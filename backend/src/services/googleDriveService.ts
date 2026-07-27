import { google } from "googleapis";
import mongoose from "mongoose";
import sharp from "sharp";
import { Readable } from "stream";
import { env } from "../configs/env";
import { IDriveFile } from "../models/CaptureSession";
import { IUserDocument, UserModel } from "../models/User";
import { CaptureLocation, WeatherCondition } from "../types";
import {
  generatePhotoLabelName,
  toVietnameseCrop,
  toVietnameseDisease,
  toVietnameseEnv,
  toVietnamesePlot,
  toVietnameseStage,
} from "../utils/dateHelper";

const CLIENT_ID = env.googleClientId;
const CLIENT_SECRET = env.googleClientSecret;
const REDIRECT_URI = env.googleRedirectUri;

export function getOAuth2Client() {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

const DRIVE_FOLDER_MIME = "application/vnd.google-apps.folder";
const ROOT_FOLDER_NAME = "farmdata";
const IMAGE_FOLDER_NAME = "Images";
const POST_FOLDER_NAME = "posts";
const POST_IMAGE_FOLDER_NAME = "images";

function escapeDriveQueryValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function normalizeFolderName(value: string): string {
  return value.trim().replace(/\s+/g, " ") || "Unspecified";
}

function getGrowthStageDisplayName(growthStage: string): string {
  return normalizeFolderName(growthStage);
}

export interface CaptureImageDescriptionInput {
  sessionId?: string;
  farmerName?: string;
  farmerEmail?: string;
  plotId?: string;
  cropType: string;
  growthStage: string;
  envMode: string;
  captureLocation?: CaptureLocation;
  stationMeasurements: WeatherCondition;
  localMeasurements?: Partial<WeatherCondition>;
  diseaseGroup?: string;
  diseaseType?: string;
  diseaseName?: string;
  symptomDescription: string;
  severity: string;
}

export interface PostImageWatermarkInput {
  cropType: string;
  growthStage: string;
  severity: string;
  stationMeasurements: Partial<WeatherCondition>;
  symptomDescription: string;
}

function formatMeasurementValue(value: unknown, suffix = ""): string {
  return value === undefined || value === null || value === ""
    ? "Không có"
    : `${value}${suffix}`;
}

export function buildCaptureImageDescription(
  metadata: CaptureImageDescriptionInput,
  imageIndex?: number,
): string {
  const station = metadata.stationMeasurements;
  const local = metadata.localMeasurements;
  const loc = metadata.captureLocation;
  const lines = [
    "Metadata phiên chụp",
    metadata.sessionId ? `Mã phiên: ${metadata.sessionId}` : undefined,
    imageIndex ? `Ảnh số: ${imageIndex}` : undefined,
    metadata.farmerName ? `Người chụp: ${metadata.farmerName}` : undefined,
    metadata.farmerEmail ? `Email: ${metadata.farmerEmail}` : undefined,
    metadata.plotId ? `Mã số luống: ${metadata.plotId}` : undefined,
    `Loại cây: ${metadata.cropType}`,
    `Giai đoạn sinh trưởng: ${metadata.growthStage}`,
    `Môi trường: ${metadata.envMode}`,
    metadata.diseaseGroup
      ? `Nhóm bệnh cây: ${metadata.diseaseGroup}`
      : undefined,
    metadata.diseaseType ? `Loại bệnh cây: ${metadata.diseaseType}` : undefined,
    metadata.diseaseName ? `Tên bệnh cây: ${metadata.diseaseName}` : undefined,

    // GPS Location Metadata
    loc?.formattedAddress ? `Vị trí: ${loc.formattedAddress}` : undefined,
    loc?.latitude !== undefined ? `Vĩ độ: ${loc.latitude}` : undefined,
    loc?.longitude !== undefined ? `Kinh độ: ${loc.longitude}` : undefined,
    loc?.accuracy !== undefined
      ? `Độ chính xác GPS: ${loc.accuracy} m`
      : undefined,
    loc?.timestamp ? `Thời điểm chụp: ${loc.timestamp}` : undefined,
    loc?.isMocked !== undefined
      ? `Giả lập tọa độ GPS: ${loc.isMocked ? "Có" : "Không"}`
      : undefined,
    loc?.name ? `Tên địa điểm GPS: ${loc.name}` : undefined,
    loc?.city ? `Thành phố GPS: ${loc.city}` : undefined,
    loc?.region ? `Khu vực/Tỉnh GPS: ${loc.region}` : undefined,
    loc?.country ? `Quốc gia GPS: ${loc.country}` : undefined,

    `Tình trạng: ${metadata.severity}`,
    `Mô tả triệu chứng: ${metadata.symptomDescription}`,

    // Station Measurements
    `Nhiệt độ trạm: ${formatMeasurementValue(station.temperature, "°C")}`,
    `Độ ẩm trạm: ${formatMeasurementValue(station.humidity, "%")}`,
    `UV/ánh sáng trạm: ${formatMeasurementValue(station.lightUvIndex)}`,
    `Tốc độ gió trạm: ${formatMeasurementValue(station.windSpeed, " km/h")}`,
    `CO2 trạm: ${formatMeasurementValue(station.co2Level, " ppm")}`,
    `Mã thời tiết: ${formatMeasurementValue(station.weatherCode)}`,
    station.soilPh
      ? `pH đất trạm: ${formatMeasurementValue(station.soilPh)}`
      : undefined,
    station.soilEc
      ? `EC đất trạm: ${formatMeasurementValue(station.soilEc)}`
      : undefined,
    station.soilDo
      ? `DO đất trạm: ${formatMeasurementValue(station.soilDo)}`
      : undefined,
    station.soilHumidity
      ? `Độ ẩm đất trạm: ${formatMeasurementValue(station.soilHumidity)}`
      : undefined,

    // Local Measurements
    local && local.temperature !== undefined
      ? `Nhiệt độ nhập tay: ${formatMeasurementValue(local.temperature, "°C")}`
      : undefined,
    local && local.humidity !== undefined
      ? `Độ ẩm nhập tay: ${formatMeasurementValue(local.humidity, "%")}`
      : undefined,
    local && local.lightUvIndex !== undefined
      ? `UV/ánh sáng nhập tay: ${formatMeasurementValue(local.lightUvIndex)}`
      : undefined,
    local && local.windSpeed !== undefined
      ? `Tốc độ gió nhập tay: ${formatMeasurementValue(local.windSpeed, " km/h")}`
      : undefined,
    local && local.co2Level !== undefined
      ? `CO2 nhập tay: ${formatMeasurementValue(local.co2Level, " ppm")}`
      : undefined,
    local && local.weatherCode !== undefined
      ? `Mã thời tiết nhập tay: ${formatMeasurementValue(local.weatherCode)}`
      : undefined,
    local && local.soilPh
      ? `pH đất nhập tay: ${formatMeasurementValue(local.soilPh)}`
      : undefined,
    local && local.soilEc
      ? `EC đất nhập tay: ${formatMeasurementValue(local.soilEc)}`
      : undefined,
    local && local.soilDo
      ? `DO đất nhập tay: ${formatMeasurementValue(local.soilDo)}`
      : undefined,
    local && local.soilHumidity
      ? `Độ ẩm đất nhập tay: ${formatMeasurementValue(local.soilHumidity)}`
      : undefined,
  ];

  return lines.filter(Boolean).join("\n");
}

async function ensureDriveFolder(
  drive: ReturnType<typeof google.drive>,
  name: string,
  parentId?: string,
): Promise<string> {
  const escapedName = escapeDriveQueryValue(name);
  const parentClause = parentId ? ` and '${parentId}' in parents` : "";
  const folderRes = await drive.files.list({
    q: `mimeType='${DRIVE_FOLDER_MIME}' and name='${escapedName}' and trashed=false${parentClause}`,
    fields: "files(id, name)",
    spaces: "drive",
  });

  const existingFolderId = folderRes.data.files?.[0]?.id;
  if (existingFolderId) {
    return existingFolderId;
  }

  const createFolderRes = await drive.files.create({
    requestBody: {
      name,
      mimeType: DRIVE_FOLDER_MIME,
      ...(parentId ? { parents: [parentId] } : {}),
    },
    fields: "id",
  });

  if (!createFolderRes.data.id) {
    throw new Error(`Could not create Google Drive folder: ${name}`);
  }

  return createFolderRes.data.id;
}

/**
 * 5-level directory structure for capture images in Google Drive:
 * `farmdata/{PlotCode}/{CropType}/{EnvMode}/{GrowthStage}/{DiseaseName}/`
 * All folders in English.
 */
async function ensureCaptureImageFolder(
  drive: ReturnType<typeof google.drive>,
  plotId?: string,
  cropType?: string,
  envMode?: string,
  growthStage?: string,
  diseaseName?: string,
): Promise<{ folderId: string; folderPath: string }> {
  const plotFolder = toVietnamesePlot(plotId);
  const cropFolder = toVietnameseCrop(cropType);
  const envFolder = toVietnameseEnv(envMode);
  const stageFolder = toVietnameseStage(growthStage);
  const diseaseFolder = toVietnameseDisease(diseaseName);

  const rootFolderId = await ensureDriveFolder(drive, ROOT_FOLDER_NAME);
  const plotFolderId = await ensureDriveFolder(drive, plotFolder, rootFolderId);
  const cropFolderId = await ensureDriveFolder(drive, cropFolder, plotFolderId);
  const envFolderId = await ensureDriveFolder(drive, envFolder, cropFolderId);
  const stageFolderId = await ensureDriveFolder(
    drive,
    stageFolder,
    envFolderId,
  );
  const diseaseFolderId = await ensureDriveFolder(
    drive,
    diseaseFolder,
    stageFolderId,
  );

  return {
    folderId: diseaseFolderId,
    folderPath: `${ROOT_FOLDER_NAME}/${plotFolder}/${cropFolder}/${envFolder}/${stageFolder}/${diseaseFolder}`,
  };
}

async function ensurePostImageFolder(
  drive: ReturnType<typeof google.drive>,
): Promise<{ folderId: string; folderPath: string }> {
  const rootFolderId = await ensureDriveFolder(drive, ROOT_FOLDER_NAME);
  const postFolderId = await ensureDriveFolder(
    drive,
    POST_FOLDER_NAME,
    rootFolderId,
  );
  const imageFolderId = await ensureDriveFolder(
    drive,
    POST_IMAGE_FOLDER_NAME,
    postFolderId,
  );

  return {
    folderId: imageFolderId,
    folderPath: `${ROOT_FOLDER_NAME}/${POST_FOLDER_NAME}/${POST_IMAGE_FOLDER_NAME}`,
  };
}

async function imageUriToBuffer(
  imageUri: string,
): Promise<{ buffer: Buffer; mimeType: string }> {
  const dataUriMatch = imageUri.match(
    /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/,
  );
  if (dataUriMatch) {
    return {
      buffer: Buffer.from(dataUriMatch[2], "base64"),
      mimeType: dataUriMatch[1],
    };
  }

  const rawBase64Match =
    /^[A-Za-z0-9+/]+={0,2}$/.test(imageUri) && imageUri.length > 100;
  if (rawBase64Match) {
    return {
      buffer: Buffer.from(imageUri, "base64"),
      mimeType: "image/jpeg",
    };
  }

  if (/^https?:\/\//i.test(imageUri)) {
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error(`Could not fetch image URL (${response.status})`);
    }
    const mimeType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      mimeType,
    };
  }

  throw new Error(
    "Image payload must be a data URI, base64 string, or HTTP URL",
  );
}

function bufferToUploadMedia(buffer: Buffer, mimeType: string) {
  return {
    body: Readable.from(buffer),
    mimeType,
  };
}

function escapeSvgText(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrapText(value: string, maxChars: number): string[] {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }
    if (current) {
      lines.push(current);
    }
    current = word;
  }

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [""];
}

function formatWatermarkValue(value: unknown, suffix = ""): string {
  if (value === undefined || value === null || value === "") return "--";
  return `${value}${suffix}`;
}

function getWeatherCodeLabel(code?: number): string {
  if (code === 1 || code === 2) return "Ít mây";
  if (code === 3) return "Nhiều mây";
  if (code === 45 || code === 48) return "Sương mù";
  if ([51, 53, 55].includes(code ?? -1)) return "Mưa nhẹ";
  if ([61, 63, 65].includes(code ?? -1)) return "Mưa vừa / to";
  if ([80, 81, 82].includes(code ?? -1)) return "Mưa rào";
  if ([71, 73, 75, 77, 85, 86].includes(code ?? -1)) return "Mưa tuyết";
  return "Nắng";
}

function renderSvgTextLines({
  lines,
  x,
  y,
  lineHeight,
  fontSize,
  fontWeight = 500,
  fill = "#ffffff",
}: {
  fill?: string;
  fontSize: number;
  fontWeight?: number;
  lineHeight: number;
  lines: string[];
  x: number;
  y: number;
}): string {
  return lines
    .map(
      (line, index) =>
        `<text x="${x}" y="${y + index * lineHeight}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fill}">${escapeSvgText(line)}</text>`,
    )
    .join("");
}

function buildPostWatermarkSvg(
  width: number,
  height: number,
  metadata: PostImageWatermarkInput,
): string {
  const bottomHeight = Math.max(142, Math.round(height * 0.2));
  const bottomY = height - bottomHeight;
  const horizontalPadding = Math.max(28, Math.round(width * 0.035));
  const titleFont = Math.max(28, Math.round(width * 0.026));
  const bodyFont = Math.max(18, Math.round(width * 0.017));
  const bodyLineHeight = Math.round(bodyFont * 1.45);
  const maxBottomChars = Math.max(34, Math.round(width / (bodyFont * 0.58)));
  const diseaseLines = wrapText(
    `Tình trạng bệnh: ${metadata.severity} - ${metadata.symptomDescription}`,
    maxBottomChars,
  ).slice(0, 2);
  const bottomLines = [
    `Loại cây: ${metadata.cropType}`,
    ...diseaseLines,
    `Giai đoạn sinh trưởng: ${getGrowthStageDisplayName(metadata.growthStage)}`,
  ];

  const station = metadata.stationMeasurements || {};
  const metricLines = [
    `Thời tiết: ${getWeatherCodeLabel(station.weatherCode)}`,
    `Nhiệt độ: ${formatWatermarkValue(station.temperature, "°C")}`,
    `Độ ẩm: ${formatWatermarkValue(station.humidity, "%")}`,
    `Ánh sáng: ${formatWatermarkValue(station.lightUvIndex)}`,
    `Gió: ${formatWatermarkValue(station.windSpeed, " km/h")}`,
    `CO2: ${formatWatermarkValue(station.co2Level, " ppm")}`,
  ];
  const metricFont = Math.max(16, Math.round(width * 0.014));
  const metricLineHeight = Math.round(metricFont * 1.38);
  const metricBoxWidth = Math.min(
    Math.max(270, Math.round(width * 0.32)),
    width - horizontalPadding * 2,
  );
  const metricBoxHeight = metricLines.length * metricLineHeight + 34;
  const metricX = width - horizontalPadding - metricBoxWidth;
  const metricY = horizontalPadding;

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        text { font-family: Arial, Helvetica, sans-serif; }
      </style>
      <rect x="0" y="${bottomY}" width="${width}" height="${bottomHeight}" fill="#0c1210" fill-opacity="0.72" />
      <rect x="${metricX}" y="${metricY}" width="${metricBoxWidth}" height="${metricBoxHeight}" rx="18" fill="#0c1210" fill-opacity="0.68" />
      ${renderSvgTextLines({
        lines: [bottomLines[0]],
        x: horizontalPadding,
        y: bottomY + 46,
        lineHeight: titleFont + 8,
        fontSize: titleFont,
        fontWeight: 700,
      })}
      ${renderSvgTextLines({
        lines: bottomLines.slice(1),
        x: horizontalPadding,
        y: bottomY + 46 + titleFont + 16,
        lineHeight: bodyLineHeight,
        fontSize: bodyFont,
      })}
      ${renderSvgTextLines({
        lines: metricLines,
        x: metricX + 20,
        y: metricY + metricLineHeight + 10,
        lineHeight: metricLineHeight,
        fontSize: metricFont,
        fontWeight: 600,
      })}
    </svg>
  `;
}

async function applyPostImageWatermark(
  image: { buffer: Buffer; mimeType: string },
  watermark: PostImageWatermarkInput,
): Promise<{ buffer: Buffer; mimeType: string }> {
  const metadata = await sharp(image.buffer).metadata();
  const width = metadata.width || 1200;
  const height = metadata.height || 900;
  const overlay = Buffer.from(buildPostWatermarkSvg(width, height, watermark));
  const buffer = await sharp(image.buffer)
    .rotate()
    .composite([{ input: overlay, gravity: "center" }])
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();

  return {
    buffer,
    mimeType: "image/jpeg",
  };
}

async function makeDriveFileReadable(
  drive: ReturnType<typeof google.drive>,
  fileId: string,
) {
  await drive.permissions.create({
    fileId,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });
}

export interface DriveUploadOptions {
  farmerEmailOrId: string;
  imageUris: string[];
  plotId?: string;
  cropType?: string;
  envMode?: string;
  growthStage?: string;
  diseaseName?: string;
  severity?: string;
  description?: string | ((imageIndex: number) => string);
  destination?: "capture" | "post";
  watermark?: PostImageWatermarkInput;
}

async function uploadImagesToDrive(
  drive: ReturnType<typeof google.drive>,
  options: DriveUploadOptions,
): Promise<IDriveFile[]> {
  const {
    imageUris,
    plotId,
    cropType = "Crop",
    envMode = "outdoor",
    growthStage = "Stage",
    diseaseName,
    description,
    destination = "capture",
    watermark,
  } = options;

  const { folderId, folderPath } =
    destination === "post"
      ? await ensurePostImageFolder(drive)
      : await ensureCaptureImageFolder(
          drive,
          plotId,
          cropType,
          envMode,
          growthStage,
          diseaseName,
        );

  const uploadedFiles: IDriveFile[] = [];

  for (let i = 0; i < imageUris.length; i++) {
    const labelName = generatePhotoLabelName(
      plotId,
      cropType,
      envMode,
      growthStage,
      diseaseName,
      i + 1,
    );
    const fileDescription =
      typeof description === "function" ? description(i + 1) : description;
    const rawImage = await imageUriToBuffer(imageUris[i]);
    const uploadImage =
      watermark && destination === "post"
        ? await applyPostImageWatermark(rawImage, watermark)
        : rawImage;
    const media = bufferToUploadMedia(uploadImage.buffer, uploadImage.mimeType);
    const response = await drive.files.create({
      requestBody: {
        name: labelName,
        parents: [folderId],
        ...(fileDescription ? { description: fileDescription } : {}),
      },
      media,
      fields: "id, webViewLink, webContentLink",
    });

    const fileId = response.data.id || `DRIVE-${Date.now()}-${i}`;
    if (response.data.id) {
      await makeDriveFileReadable(drive, response.data.id);
    }

    uploadedFiles.push({
      fileId,
      webViewLink: response.data.webViewLink || undefined,
      webContentLink:
        response.data.webContentLink ||
        (response.data.id
          ? `https://drive.google.com/uc?export=view&id=${response.data.id}`
          : undefined),
      fileName: labelName,
      folderPath,
      description: fileDescription,
    });
  }

  return uploadedFiles;
}

/**
 * Generate Google OAuth authorization consent URL for Admin.
 */
export function getAdminGoogleAuthUrl(): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  });
}

/**
 * Exchange Google OAuth code and link tokens to the Admin user account in MongoDB.
 */
export async function linkAdminGoogleAccount(
  adminUserId: string,
  authCode: string,
) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(authCode);

  oauth2Client.setCredentials(tokens);

  // Fetch Google User Email
  let googleEmail = "";
  try {
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    googleEmail = userInfo.data.email || "";
  } catch {
    // Ignore error if userinfo fails
  }

  const updatedAdmin = await UserModel.findByIdAndUpdate(
    adminUserId,
    {
      $set: {
        googleTokens: {
          accessToken: tokens.access_token || undefined,
          refreshToken: tokens.refresh_token || undefined,
          expiryDate: tokens.expiry_date || undefined,
          email: googleEmail,
          isLinked: true,
        },
      },
    },
    { new: true },
  );

  return updatedAdmin;
}

/**
 * Upload session images to the Admin's Google Drive storage.
 * Dynamic folder hierarchy: `farmdata/{PlotCode}/{CropType}/{EnvMode}/{GrowthStage}/{DiseaseName}/`
 * Photo filename rule: `{PlotCode}+{CropType}+{EnvMode}+{GrowthStage}+{DiseaseName}+{Timestamp}.jpg`
 */
export async function uploadImagesToAdminDrive(
  optionsOrFarmerId: string | DriveUploadOptions,
  imageUrisArg?: string[],
  cropTypeArg: string = "Crop",
  growthStageArg: string = "Stage",
  severityArg: string = "Unspecified",
  descriptionArg?: string | ((imageIndex: number) => string),
  destinationArg: "capture" | "post" = "capture",
  watermarkArg?: PostImageWatermarkInput,
  plotIdArg?: string,
  envModeArg?: string,
  diseaseNameArg?: string,
): Promise<IDriveFile[]> {
  const options: DriveUploadOptions =
    typeof optionsOrFarmerId === "object"
      ? optionsOrFarmerId
      : {
          farmerEmailOrId: optionsOrFarmerId,
          imageUris: imageUrisArg || [],
          cropType: cropTypeArg,
          growthStage: growthStageArg,
          severity: severityArg,
          description: descriptionArg,
          destination: destinationArg,
          watermark: watermarkArg,
          plotId: plotIdArg,
          envMode: envModeArg,
          diseaseName: diseaseNameArg,
        };

  const {
    farmerEmailOrId,
    imageUris,
    plotId,
    cropType = "Crop",
    envMode = "outdoor",
    growthStage = "Stage",
    diseaseName,
    description,
    destination = "capture",
  } = options;

  // 1. Find Farmer user
  let farmer: IUserDocument | null = null;
  if (mongoose.isValidObjectId(farmerEmailOrId)) {
    farmer = await UserModel.findById(farmerEmailOrId);
  } else {
    farmer = await UserModel.findOne({
      email: farmerEmailOrId.trim().toLowerCase(),
    });
  }

  // 2. Find associated creator Admin user with linked Google Drive tokens.
  let admin: IUserDocument | null = null;
  if (farmer?.role === "ADMIN") {
    admin = farmer;
  }
  if (farmer && farmer.createdByAdminId) {
    admin = await UserModel.findOne({
      _id: farmer.createdByAdminId,
      role: "ADMIN",
      isRevoked: { $ne: true },
    });
  }

  // Test/mock fallback only. Production must use the creator Admin OAuth.
  if (
    (!admin || !admin.googleTokens?.refreshToken) &&
    (env.nodeEnv === "test" || CLIENT_ID === "mock_client_id")
  ) {
    admin = await UserModel.findOne({
      role: "ADMIN",
      isRevoked: { $ne: true },
      "googleTokens.isLinked": true,
      "googleTokens.refreshToken": { $exists: true, $ne: null },
    });
  }

  // If live Admin Google tokens exist, perform actual Google Drive upload via API
  if (
    admin &&
    admin.googleTokens?.refreshToken &&
    CLIENT_ID !== "mock_client_id"
  ) {
    try {
      const oauth2Client = getOAuth2Client();
      oauth2Client.setCredentials({
        refresh_token: admin.googleTokens.refreshToken,
      });

      const drive = google.drive({ version: "v3", auth: oauth2Client });
      return await uploadImagesToDrive(drive, options);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(
        "Google Drive API Upload failed, falling back to Drive ID assignment:",
        message,
      );
    }
  }

  if (env.nodeEnv !== "test" && CLIENT_ID !== "mock_client_id") {
    throw new Error(
      "Admin Google Drive is not linked or upload failed; cannot upload capture images.",
    );
  }

  // Fallback mode for testing environment: return labeled Drive metadata records
  return imageUris.map((uri, idx) => {
    const labelName = generatePhotoLabelName(
      plotId,
      cropType,
      envMode,
      growthStage,
      diseaseName,
      idx + 1,
    );
    const fileDescription =
      typeof description === "function" ? description(idx + 1) : description;
    const folderPath =
      destination === "post"
        ? `${ROOT_FOLDER_NAME}/${POST_FOLDER_NAME}/${POST_IMAGE_FOLDER_NAME}`
        : `${ROOT_FOLDER_NAME}/${toVietnamesePlot(plotId)}/${toVietnameseCrop(
            cropType,
          )}/${toVietnameseEnv(envMode)}/${toVietnameseStage(
            growthStage,
          )}/${toVietnameseDisease(diseaseName)}`;
    const fileId = `GDRIVE-ADMIN-FILE-${Date.now()}-${idx + 1}`;
    return {
      fileId,
      webViewLink: `https://drive.google.com/file/d/${fileId}/view`,
      webContentLink: `https://drive.google.com/uc?export=view&id=${fileId}`,
      fileName: labelName,
      folderPath,
      description: fileDescription,
    };
  });
}
