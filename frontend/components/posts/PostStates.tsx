import { LAYOUT } from "@/constants/theme";
import { WifiOff, X } from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

export function PostsLoadingState() {
  return (
    <ScrollView
      style={postStateStyles.postsLoading}
      contentContainerStyle={postStateStyles.postsLoadingContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={postStateStyles.screenTitle}>Post</Text>
      <View style={postStateStyles.postsSearchSkeleton}>
        <View style={postStateStyles.postsSearchSkeletonIcon} />
        <View style={postStateStyles.postsSearchSkeletonLine} />
      </View>
      <View style={postStateStyles.postsSkeletonChipRow}>
        {[80, 96, 96].map((width, index) => (
          <View
            key={`${width}-${index}`}
            style={[postStateStyles.postsSkeletonChip, { width }]}
          />
        ))}
      </View>
      <View style={postStateStyles.postsSkeletonList}>
        {[0, 1, 2].map((item) => (
          <View key={item} style={postStateStyles.postsSkeletonCard}>
            <View style={postStateStyles.postsSkeletonImage} />
            <View style={postStateStyles.postsSkeletonTextBlock}>
              <View style={postStateStyles.postsSkeletonRow}>
                <View
                  style={[postStateStyles.postsSkeletonLine, { width: 48 }]}
                />
                <View
                  style={[postStateStyles.postsSkeletonLine, { width: 128 }]}
                />
              </View>
              <View
                style={[postStateStyles.postsSkeletonLineSmall, { width: 80 }]}
              />
              <View
                style={[postStateStyles.postsSkeletonLineSmall, { width: 112 }]}
              />
              <View
                style={[postStateStyles.postsSkeletonLineSmall, { width: 144 }]}
              />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const postStateStyles = StyleSheet.create({
  screenTitle: {
    color: "#565656",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 24,
  },
  postsLoading: {
    flex: 1,
    marginTop: 16,
  },
  postsLoadingContent: {
    paddingHorizontal: LAYOUT.screenX,
    paddingBottom: 100,
    gap: LAYOUT.sectionGap,
  },
  postsSearchSkeleton: {
    height: 44,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 8,
  },
  postsSearchSkeletonIcon: {
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
  },
  postsSearchSkeletonLine: {
    width: 160,
    height: 12,
    borderRadius: 4,
    backgroundColor: "#e5e7eb",
  },
  postsSkeletonChipRow: {
    flexDirection: "row",
    gap: 8,
  },
  postsSkeletonChip: {
    height: 32,
    borderRadius: 999,
    backgroundColor: "#f3f4f6",
  },
  postsSkeletonList: {
    paddingTop: 8,
    gap: 16,
  },
  postsSkeletonCard: {
    height: 122,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    backgroundColor: "#fff",
    flexDirection: "row",
    gap: 12,
    padding: 13,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  postsSkeletonImage: {
    width: 96,
    height: 96,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  postsSkeletonTextBlock: {
    flex: 1,
    gap: 12,
    paddingVertical: 4,
  },
  postsSkeletonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  postsSkeletonLine: {
    height: 16,
    borderRadius: 4,
    backgroundColor: "#f3f4f6",
  },
  postsSkeletonLineSmall: {
    height: 12,
    borderRadius: 4,
    backgroundColor: "#f3f4f6",
  },
  postsCenteredState: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: LAYOUT.screenX,
    paddingTop: 104,
    paddingBottom: 96,
  },
  postsEmptyIllustrationWrap: {
    width: 192,
    height: 224,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 31,
  },
  postsEmptyDocument: {
    width: 62,
    height: 82,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#a7dfb1",
    backgroundColor: "#dff5e5",
    paddingHorizontal: 13,
    paddingTop: 27,
    gap: 9,
  },
  postsDocumentLineLong: {
    width: 32,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#4f7730",
  },
  postsDocumentLineMedium: {
    width: 28,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#4f7730",
  },
  postsDocumentLineShort: {
    width: 18,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#4f7730",
  },
  postsMagnifier: {
    position: "absolute",
    right: 40,
    bottom: 34,
    width: 58,
    height: 58,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  postsErrorIconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f8faf9",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 104,
    marginBottom: 32,
  },
  postsErrorBadge: {
    position: "absolute",
    right: 5,
    bottom: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#d32f2f",
    alignItems: "center",
    justifyContent: "center",
  },
  postsStateTextBlock: {
    alignItems: "center",
    gap: 8,
    marginBottom: 32,
  },
  postsStateTitle: {
    color: "#111827",
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  postsStateDescription: {
    color: "#848484",
    fontSize: 16,
    lineHeight: 23,
    textAlign: "center",
  },
  postsPrimaryStateButton: {
    width: 240,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#31582b",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  postsRetryButton: {
    width: "100%",
    height: 48,
    borderRadius: 8,
    backgroundColor: "#31582b",
    alignItems: "center",
    justifyContent: "center",
  },
  postsPrimaryStateButtonText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "500",
  },
});

export function PostsEmptyState({
  showStartButton,
  onStart,
}: {
  showStartButton: boolean;
  onStart?: () => void;
}) {
  return (
    <View style={postStateStyles.postsCenteredState}>
      <View style={postStateStyles.postsEmptyIllustrationWrap}>
        <View style={postStateStyles.postsEmptyDocument}>
          <View style={postStateStyles.postsDocumentLineLong} />
          <View style={postStateStyles.postsDocumentLineMedium} />
          <View style={postStateStyles.postsDocumentLineShort} />
        </View>
        <View style={postStateStyles.postsMagnifier}>
          <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
            <Circle cx={17} cy={17} r={11.5} stroke="#31582b" strokeWidth={3} />
            <Path
              d="M25.5 25.5L34 34"
              stroke="#31582b"
              strokeWidth={3}
              strokeLinecap="round"
            />
          </Svg>
        </View>
      </View>
      <View style={postStateStyles.postsStateTextBlock}>
        <Text style={postStateStyles.postsStateTitle}>
          Chưa có bài đăng nào
        </Text>
      </View>
      {showStartButton && onStart ? (
        <Pressable
          style={postStateStyles.postsPrimaryStateButton}
          onPress={onStart}
        >
          <Text style={postStateStyles.postsPrimaryStateButtonText}>
            Đăng bài
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function PostsErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={postStateStyles.postsCenteredState}>
      <View style={postStateStyles.postsErrorIconWrap}>
        <WifiOff size={64} color="#c9cfd8" strokeWidth={2} />
        <View style={postStateStyles.postsErrorBadge}>
          <X size={12} color="#fff" strokeWidth={3} />
        </View>
      </View>
      <View style={postStateStyles.postsStateTextBlock}>
        <Text style={postStateStyles.postsStateTitle}>
          Không thể tải dữ liệu
        </Text>
        <Text style={postStateStyles.postsStateDescription}>
          Vui lòng kiểm tra kết nối{"\n"}và thử lại.
        </Text>
      </View>
      <Pressable style={postStateStyles.postsRetryButton} onPress={onRetry}>
        <Text style={postStateStyles.postsPrimaryStateButtonText}>Thử lại</Text>
      </Pressable>
    </View>
  );
}
