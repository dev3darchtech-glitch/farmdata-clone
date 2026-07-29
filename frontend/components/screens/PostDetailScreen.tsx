import { getCaptureWeatherLabel } from "@/components/shared/CaptureFormParts";
import { COLORS, LAYOUT, TYPOGRAPHY } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { deletePost } from "@/services/postService";
import { setPendingEditPost } from "@/stores/editPostStore";
import { Post } from "@/types";
import {
  envName,
  formatMetric,
  formatPostDate,
  normalizePostIdentity,
  normalizeRole,
  severityDotColor,
  stageName,
} from "@/utils/captureDisplay";
import { buildPostUrl } from "@/utils/postImage";
import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import {
  Calendar,
  ChevronLeft,
  Image as ImageIcon,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ImageViewer } from "../posts/ImageViewer";
import { AppScreenLayout } from "../shared/AppScreenLayout";

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={postDetailStyles.detailRow}>
      <Text style={postDetailStyles.detailLabel}>{label}</Text>
      <Text style={postDetailStyles.detailValue}>{value}</Text>
    </View>
  );
}

export function PostDetailScreen() {
  const { user } = useAuth();
  const role = normalizeRole(user?.role as string);
  const { postData } = useLocalSearchParams<{ postData?: string }>();
  const post: Post | null = postData
    ? (() => {
        try {
          return normalizePostIdentity(
            JSON.parse(postData) as Post & { _id?: string },
          );
        } catch {
          return null;
        }
      })()
    : null;

  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!post) {
    return (
      <AppScreenLayout active="posts" testID="post-detail-screen">
        <View style={postDetailStyles.emptyWrap}>
          <Text style={postDetailStyles.emptyText}>
            Không tìm thấy bài đăng.
          </Text>
        </View>
      </AppScreenLayout>
    );
  }

  const isAdmin = role === "admin";
  const isOwner =
    user &&
    (post.user?.id === user.id ||
      (post.user?.email && post.user.email === (user as any).email) ||
      (post.user?.name && post.user.name === user.name));
  const canEdit = isAdmin && Boolean(isOwner);
  const canDelete = isAdmin && Boolean(isOwner);
  const diseaseDisplayName =
    post.diseaseName?.trim() || post.diseaseType?.trim() || "Bệnh cây";
  const imageCount = post.images.length;

  const handleEdit = () => {
    try {
      setPendingEditPost(post);
      router.navigate("/(tabs)/capture" as any);
    } catch {
      Alert.alert("Lỗi", "Không thể mở trang chỉnh sửa.");
    }
  };

  const handleShare = async () => {
    try {
      await Clipboard.setStringAsync(buildPostUrl(post));
      Alert.alert("Đã copy URL", "URL bài đã được copy vào clipboard.");
    } catch {
      Alert.alert("Không thể copy URL", "Vui lòng thử lại sau.");
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Xác nhận xóa bài post",
      "Bạn có chắc chắn muốn xóa bài post này không? Thao tác này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await deletePost(post.id);
              Alert.alert("Thành công", "Đã xóa bài post thành công.", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (err: any) {
              Alert.alert("Lỗi", err?.message || "Không thể xóa bài post.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <AppScreenLayout active="posts" testID="post-detail-screen">
      {/* Image viewer overlay */}
      {viewerVisible ? (
        <ImageViewer
          post={post}
          initialIndex={viewerIndex}
          onClose={() => setViewerVisible(false)}
          canDelete={canDelete}
          onDelete={handleDelete}
        />
      ) : null}

      {/* Header bar */}
      <View style={postDetailStyles.headerBar}>
        <Pressable
          style={postDetailStyles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={20} color={COLORS.body} />
          <Text style={postDetailStyles.backText}>Quay lại</Text>
        </Pressable>
        <View style={postDetailStyles.headerActions}>
          <Pressable style={postDetailStyles.actionBtn} onPress={handleShare}>
            <Share2 size={17} color={COLORS.green} />
          </Pressable>
          {canEdit ? (
            <Pressable style={postDetailStyles.actionBtn} onPress={handleEdit}>
              <Pencil size={17} color={COLORS.green} />
            </Pressable>
          ) : null}
          {canDelete ? (
            <Pressable
              style={[
                postDetailStyles.actionBtn,
                postDetailStyles.actionBtnRed,
              ]}
              onPress={handleDelete}
              disabled={deleting}
            >
              <Trash2 size={17} color="#ef4444" />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView
        style={postDetailStyles.scroll}
        contentContainerStyle={postDetailStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image grid */}
        <View
          style={[
            postDetailStyles.imageGrid,
            imageCount <= 1 && postDetailStyles.imageGridSingle,
          ]}
        >
          {post.images.length > 0 ? (
            post.images.slice(0, 4).map((img, idx) => (
              <Pressable
                key={`${img}-${idx}`}
                style={[
                  postDetailStyles.imageCell,
                  imageCount === 1 && postDetailStyles.imageCellSingle,
                  imageCount === 2 && postDetailStyles.imageCellHalf,
                ]}
                onPress={() => {
                  setViewerIndex(idx);
                  setViewerVisible(true);
                }}
              >
                <Image
                  source={{ uri: img }}
                  style={postDetailStyles.thumbImage}
                />
                {idx === 3 && imageCount > 4 ? (
                  <View style={postDetailStyles.moreOverlay}>
                    <Text style={postDetailStyles.moreText}>
                      +{imageCount - 4}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            ))
          ) : (
            <View
              style={[
                postDetailStyles.imagePlaceholder,
                postDetailStyles.imageCellSingle,
              ]}
            >
              <ImageIcon size={32} color={COLORS.muted} />
            </View>
          )}
        </View>

        {/* Title row */}
        <View style={postDetailStyles.titleRow}>
          {post.plotId ? (
            <View style={postDetailStyles.plotBadge}>
              <Text style={postDetailStyles.plotBadgeText}>{post.plotId}</Text>
            </View>
          ) : null}
          <Text style={postDetailStyles.postTitle}>
            {post.cropType} - {stageName(post.growthStage)}
          </Text>
        </View>

        {/* Date */}
        <View style={postDetailStyles.dateRow}>
          <Calendar size={13} color="#9ca3af" />
          <Text style={postDetailStyles.dateText}>
            {formatPostDate(post.createdAt)}
          </Text>
          {isAdmin && post.user ? (
            <Text style={postDetailStyles.posterText}>
              {" "}
              · Người đăng: {post.user.name}
            </Text>
          ) : null}
        </View>

        {/* Symptom severity */}
        <View style={postDetailStyles.severityRow}>
          <View
            style={[
              postDetailStyles.severityDot,
              { backgroundColor: severityDotColor(post.severity) },
            ]}
          />
          <Text style={postDetailStyles.severityText}>
            {diseaseDisplayName} - Mức độ {post.severity}
          </Text>
        </View>

        {/* Symptom description */}
        {post.symptomDescription ? (
          <View style={postDetailStyles.descBlock}>
            <Text style={postDetailStyles.descLabel}>Mô tả triệu chứng</Text>
            <Text style={postDetailStyles.descText}>
              {post.symptomDescription}
            </Text>
          </View>
        ) : null}

        <View style={postDetailStyles.divider} />

        {/* Cây trồng & bệnh */}
        <Text style={postDetailStyles.sectionTitle}>
          Thông tin cây trồng & bệnh
        </Text>
        <View style={postDetailStyles.dataCard}>
          <DetailRow label="Loại cây" value={post.cropType} />
          <DetailRow label="Mã luống" value={post.plotId} />
          <DetailRow label="Giai đoạn" value={stageName(post.growthStage)} />
          <DetailRow label="Môi trường" value={envName(post.envMode)} />
          <DetailRow label="Nhóm bệnh" value={post.diseaseGroup} />
          <DetailRow label="Loại bệnh" value={post.diseaseType} />
          <DetailRow label="Tên bệnh" value={post.diseaseName} />
          <DetailRow label="Mức độ" value={post.severity} />
        </View>

        <View style={postDetailStyles.divider} />

        {/* Dữ liệu thời tiết trạm */}
        <Text style={postDetailStyles.sectionTitle}>
          Dữ liệu trạm thời tiết (T0)
        </Text>
        <View style={postDetailStyles.dataCard}>
          <DetailRow
            label="Thời tiết"
            value={
              post.stationMeasurements?.weatherCode !== undefined
                ? getCaptureWeatherLabel(post.stationMeasurements.weatherCode)
                : envName(post.envMode)
            }
          />
          <DetailRow
            label="Nhiệt độ (T0)"
            value={
              post.stationMeasurements?.temperature !== undefined
                ? `${formatMetric(post.stationMeasurements.temperature, 1)}°C`
                : undefined
            }
          />
          <DetailRow
            label="Độ ẩm (T0)"
            value={
              post.stationMeasurements?.humidity !== undefined
                ? `${post.stationMeasurements.humidity}%`
                : undefined
            }
          />
          <DetailRow
            label="Gió (T0)"
            value={
              post.stationMeasurements?.windSpeed !== undefined
                ? `${post.stationMeasurements.windSpeed} km/h`
                : undefined
            }
          />
          {post.stationMeasurementsT12 ? (
            <>
              <DetailRow
                label="Nhiệt độ (T-12)"
                value={
                  post.stationMeasurementsT12.temperature !== undefined
                    ? `${formatMetric(post.stationMeasurementsT12.temperature, 1)}°C`
                    : undefined
                }
              />
              <DetailRow
                label="Độ ẩm (T-12)"
                value={
                  post.stationMeasurementsT12.humidity !== undefined
                    ? `${post.stationMeasurementsT12.humidity}%`
                    : undefined
                }
              />
            </>
          ) : null}
          {post.stationMeasurementsT24 ? (
            <>
              <DetailRow
                label="Nhiệt độ (T-24)"
                value={
                  post.stationMeasurementsT24.temperature !== undefined
                    ? `${formatMetric(post.stationMeasurementsT24.temperature, 1)}°C`
                    : undefined
                }
              />
              <DetailRow
                label="Độ ẩm (T-24)"
                value={
                  post.stationMeasurementsT24.humidity !== undefined
                    ? `${post.stationMeasurementsT24.humidity}%`
                    : undefined
                }
              />
            </>
          ) : null}
          {post.stationMeasurementsT48 ? (
            <>
              <DetailRow
                label="Nhiệt độ (T-48)"
                value={
                  post.stationMeasurementsT48.temperature !== undefined
                    ? `${formatMetric(post.stationMeasurementsT48.temperature, 1)}°C`
                    : undefined
                }
              />
              <DetailRow
                label="Độ ẩm (T-48)"
                value={
                  post.stationMeasurementsT48.humidity !== undefined
                    ? `${post.stationMeasurementsT48.humidity}%`
                    : undefined
                }
              />
            </>
          ) : null}
        </View>

        {/* Số đo tại nơi */}
        {post.localMeasurements ? (
          <>
            <View style={postDetailStyles.divider} />
            <Text style={postDetailStyles.sectionTitle}>Số đo tại nơi</Text>
            <View style={postDetailStyles.dataCard}>
              <DetailRow
                label="Nhiệt độ"
                value={
                  post.localMeasurements.temperature !== undefined
                    ? `${post.localMeasurements.temperature}°C`
                    : undefined
                }
              />
              <DetailRow
                label="Độ ẩm"
                value={
                  post.localMeasurements.humidity !== undefined
                    ? `${post.localMeasurements.humidity}%`
                    : undefined
                }
              />
              <DetailRow
                label="Ánh sáng"
                value={
                  post.localMeasurements.lightUvIndex !== undefined
                    ? `${post.localMeasurements.lightUvIndex} lux`
                    : undefined
                }
              />
              <DetailRow
                label="Tốc độ gió"
                value={
                  post.localMeasurements.windSpeed !== undefined
                    ? `${post.localMeasurements.windSpeed} m/s`
                    : undefined
                }
              />
              <DetailRow
                label="CO2"
                value={
                  post.localMeasurements.co2Level !== undefined
                    ? `${post.localMeasurements.co2Level} ppm`
                    : undefined
                }
              />
              <DetailRow label="pH đất" value={post.localMeasurements.soilPh} />
              <DetailRow label="EC đất" value={post.localMeasurements.soilEc} />
              <DetailRow label="DO đất" value={post.localMeasurements.soilDo} />
              <DetailRow
                label="Độ ẩm đất"
                value={post.localMeasurements.soilHumidity}
              />
            </View>
          </>
        ) : null}

        {/* Vị trí GPS */}
        {post.captureLocation ? (
          <>
            <View style={postDetailStyles.divider} />
            <Text style={postDetailStyles.sectionTitle}>Vị trí GPS</Text>
            <View style={postDetailStyles.dataCard}>
              <DetailRow
                label="Vĩ độ"
                value={String(post.captureLocation.latitude)}
              />
              <DetailRow
                label="Kinh độ"
                value={String(post.captureLocation.longitude)}
              />
              {post.captureLocation.formattedAddress ? (
                <DetailRow
                  label="Địa chỉ"
                  value={post.captureLocation.formattedAddress}
                />
              ) : null}
            </View>
          </>
        ) : null}

        {/* Action buttons at bottom */}
        {canEdit || canDelete ? (
          <View style={postDetailStyles.bottomActions}>
            <Pressable
              style={postDetailStyles.bottomShareBtn}
              onPress={handleShare}
            >
              <Share2 size={16} color={COLORS.green} />
              <Text style={postDetailStyles.bottomShareText}>Chia sẻ</Text>
            </Pressable>
            {canEdit ? (
              <Pressable
                style={postDetailStyles.bottomEditBtn}
                onPress={handleEdit}
              >
                <Pencil size={16} color="#fff" />
                <Text style={postDetailStyles.bottomEditText}>Chỉnh sửa</Text>
              </Pressable>
            ) : null}
            {canDelete ? (
              <Pressable
                style={postDetailStyles.bottomDeleteBtn}
                onPress={handleDelete}
                disabled={deleting}
              >
                <Trash2 size={16} color="#fff" />
                <Text style={postDetailStyles.bottomDeleteText}>
                  {deleting ? "Đang xóa..." : "Xóa bài"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </AppScreenLayout>
  );
}

const postDetailStyles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: LAYOUT.screenX,
    paddingBottom: 40,
    gap: 14,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: LAYOUT.screenX,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backText: {
    color: COLORS.body,
    fontSize: TYPOGRAPHY.label,
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  actionBtnRed: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  imageGrid: {
    width: "100%",
    height: 200,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  imageGridSingle: {
    flexWrap: "nowrap",
  },
  imageCell: {
    width: "47%",
    height: 96,
    borderRadius: 8,
    overflow: "hidden",
  },
  imageCellSingle: {
    width: "100%",
    height: 200,
  },
  imageCellHalf: {
    width: "47%",
    height: 200,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.field,
  },
  imagePlaceholder: {
    backgroundColor: COLORS.field,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  moreText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  plotBadge: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  plotBadgeText: {
    color: "#6b7280",
    fontSize: 11,
    fontWeight: "700",
  },
  postTitle: {
    flex: 1,
    color: COLORS.text,
    fontSize: TYPOGRAPHY.title,
    fontWeight: "700",
    lineHeight: TYPOGRAPHY.titleLine,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    color: "#9ca3af",
    fontSize: 12,
    lineHeight: 16,
  },
  posterText: {
    color: "#9ca3af",
    fontSize: 12,
    lineHeight: 16,
  },
  severityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  severityDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  severityText: {
    flex: 1,
    color: "#374151",
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "600",
  },
  descBlock: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    gap: 6,
  },
  descLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  descText: {
    color: COLORS.body,
    fontSize: 13,
    lineHeight: 19,
  },
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  dataCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    gap: 8,
  },
  detailLabel: {
    width: 120,
    color: "#6b7280",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
  },
  detailValue: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 14,
  },
  bottomActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  bottomShareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.green,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bottomShareText: {
    color: COLORS.green,
    fontSize: 13,
    fontWeight: "600",
  },
  bottomEditBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 8,
    backgroundColor: COLORS.green,
    paddingVertical: 10,
  },
  bottomEditText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  bottomDeleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 8,
    backgroundColor: "#ef4444",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bottomDeleteText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});
