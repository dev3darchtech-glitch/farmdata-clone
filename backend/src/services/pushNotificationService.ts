import { env } from "../configs/env";
import { ICaptureSessionDocument } from "../models/CaptureSession";
import { IUserDocument, UserModel } from "../models/User";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const CHANNEL_ID = "farmdata-default";

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  sound: "default";
  channelId: string;
  data: Record<string, unknown>;
}

function isExpoPushToken(token: string) {
  return /^Expo(nent)?PushToken\[[A-Za-z0-9_-]+\]$/.test(token);
}

function collectPushTokens(users: Array<IUserDocument | null | undefined>) {
  return [
    ...new Set(
      users.flatMap(
        (user) =>
          user?.pushTokens
            ?.filter((item) => isExpoPushToken(item.token))
            .map((item) => item.token) || [],
      ),
    ),
  ];
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function pruneInvalidTokens(tokens: string[]) {
  if (!tokens.length) return;
  await UserModel.updateMany(
    {},
    { $pull: { pushTokens: { token: { $in: tokens } } } },
  );
}

async function sendExpoPushNotifications(
  tokens: string[],
  content: Omit<ExpoPushMessage, "to">,
) {
  if (!tokens.length || env.nodeEnv === "test") return;

  for (const tokenChunk of chunk(tokens, 100)) {
    const messages = tokenChunk.map((token) => ({
      ...content,
      to: token,
    }));

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });
      const result = (await response.json().catch(() => ({}))) as {
        data?: Array<{
          details?: { error?: string };
          status?: string;
        }>;
      };
      const invalidTokens =
        result.data
          ?.map((item, index) =>
            item.status === "error" &&
            item.details?.error === "DeviceNotRegistered"
              ? tokenChunk[index]
              : undefined,
          )
          .filter((token): token is string => Boolean(token)) || [];

      await pruneInvalidTokens(invalidTokens);
    } catch (error) {
      console.warn(
        "Expo push notification failed:",
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}

export async function notifyCaptureSessionCompleted(
  session: ICaptureSessionDocument,
) {
  const farmer = await UserModel.findById(session.farmerId);
  const farmerTokens = collectPushTokens([farmer]);

  await sendExpoPushNotifications(farmerTokens, {
    title: "Phiên chụp đã lưu",
    body: `${session.cropType} tại ${
      session.plotId || "luống chưa chọn"
    } đã được đồng bộ.`,
    sound: "default",
    channelId: CHANNEL_ID,
    data: {
      type: "capture_session_completed",
      sessionId: session.sessionId,
      url: "/(tabs)/capture",
    },
  });

  if (!farmer?.createdByAdminId) return;

  const admin = await UserModel.findById(farmer.createdByAdminId);
  const adminTokens = collectPushTokens([admin]);
  await sendExpoPushNotifications(adminTokens, {
    title: "Có phiên chụp mới",
    body: `${session.farmerName} vừa lưu ${session.cropType} tại ${
      session.plotId || "luống chưa chọn"
    }.`,
    sound: "default",
    channelId: CHANNEL_ID,
    data: {
      type: "admin_capture_received",
      sessionId: session.sessionId,
      url: "/(tabs)/management",
    },
  });
}

export async function notifyPostPublished(post: ICaptureSessionDocument) {
  const users = await UserModel.find({
    isRevoked: { $ne: true },
    pushTokens: { $exists: true, $ne: [] },
  });
  const tokens = collectPushTokens(users);

  await sendExpoPushNotifications(tokens, {
    title: "Bài đăng mới",
    body: `${post.cropType} - ${post.severity} tại ${
      post.plotId || "luống chưa chọn"
    }.`,
    sound: "default",
    channelId: CHANNEL_ID,
    data: {
      type: "post_published",
      postId: post.sessionId,
      url: "/(tabs)/posts",
    },
  });
}
