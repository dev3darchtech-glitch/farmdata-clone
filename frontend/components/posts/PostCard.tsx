import { Post } from "@/types";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

const SEVERITY_COLORS = [
  "#22c55e", // Khỏe mạnh
  "#facc15", // Chớm bệnh
  "#fb923c", // Nhẹ
  "#ea580c", // Vừa
  "#ef4444", // Nặng
  "#991b1b", // Rất nặng
];

const SEVERITY_ORDER = ["Khỏe mạnh", "Chớm bệnh", "Nhẹ", "Vừa", "Nặng", "Rất nặng"];

function getSeverityColor(severity: string): string {
  const idx = SEVERITY_ORDER.indexOf(severity);
  return idx >= 0 ? SEVERITY_COLORS[idx] : "#94a3b8";
}

export function PostCard({
  post,
  onPressImage,
  isAdmin,
}: {
  post: Post;
  onPressImage?: (images: string[], index: number) => void;
  isAdmin?: boolean;
}) {
  const hasImages = post.images && post.images.length > 0;
  const img1 = hasImages ? post.images[0] : null;
  const img2 = post.images && post.images.length > 1 ? post.images[1] : null;
  const extraCount = post.images ? Math.max(post.images.length - 2, 0) : 0;

  return (
    <View testID={`post-card-${post.id}`}>
      {/* Two thumbnail buttons */}
      <TouchableOpacity
        disabled={!img1}
        onPress={() => img1 && onPressImage?.(post.images, 0)}
      >
        {img1 ? <Text>{img1}</Text> : null}
      </TouchableOpacity>
      <TouchableOpacity
        disabled={!img2}
        onPress={() => img2 && onPressImage?.(post.images, 1)}
      >
        {img2 ? (
          <View>
            <Text>{img2}</Text>
            {extraCount > 0 ? <Text>+{extraCount}</Text> : null}
          </View>
        ) : null}
      </TouchableOpacity>

      {/* Title: cropType - growthStage */}
      <Text numberOfLines={1}>{post.cropType}{" - "}{post.growthStage}</Text>

      {/* Plot badge — only when plotId exists */}
      {post.plotId ? (
        <View>
          <Text>{post.plotId}</Text>
        </View>
      ) : null}

      {/* Severity dot */}
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: getSeverityColor(post.severity) }} />
      <Text>{post.severity}</Text>

      {/* Admin action buttons */}
      {isAdmin ? (
        <View>
          <TouchableOpacity onPress={() => {}}>
            <Text>Xem</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}}>
            <Text>Gắn nhãn</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}
