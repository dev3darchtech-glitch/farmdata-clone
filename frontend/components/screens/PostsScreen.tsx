import { COLORS, LAYOUT, TYPOGRAPHY } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { getCropTypes, getPlots } from "@/services/adminService";
import { deletePost, getPosts } from "@/services/postService";
import { CropTypeInfo, EnvMode, PlotInfo, Post } from "@/types";
import { ManagementVariant } from "@/types/ui";
import {
  normalizePostIdentity,
  normalizeRole,
  postListKey,
} from "@/utils/captureDisplay";
import { useLocalSearchParams } from "expo-router";
import {
  ArrowDownAZ,
  ArrowDownWideNarrow,
  ArrowUpAZ,
  ArrowUpNarrowWide,
  ArrowUpDown,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AdminPostComposer } from "../posts/AdminPostComposer";
import { DateRangeFilter, FilterModal } from "../posts/FilterModal";
import { ImageViewer } from "../posts/ImageViewer";
import { PostCard } from "../posts/PostCard";
import {
  PostsEmptyState,
  PostsErrorState,
  PostsLoadingState,
  PostsSkeletonList,
} from "../posts/PostStates";
import { SortModal } from "../posts/SortModal";
import { InputText } from "../shared/InputText";

import { AppScreenLayout } from "../shared/AppScreenLayout";

function getSortIcon(mode: string) {
  switch (mode) {
    case "newest":
      return ArrowDownWideNarrow;
    case "oldest":
      return ArrowUpNarrowWide;
    case "plotAsc":
    case "cropAsc":
      return ArrowDownAZ;
    case "plotDesc":
    case "cropDesc":
      return ArrowUpAZ;
    default:
      return ArrowUpDown;
  }
}

function matchesDateRange(
  createdAt: string | number,
  dateRange?: DateRangeFilter,
): boolean {
  if (!dateRange || dateRange.preset === "all") return true;

  const postTime = new Date(createdAt).getTime();
  if (isNaN(postTime)) return true;

  const now = new Date();

  if (dateRange.preset === "today") {
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();
    const endOfToday = startOfToday + 86400000 - 1;
    return postTime >= startOfToday && postTime <= endOfToday;
  }

  if (dateRange.preset === "7days") {
    const sevenDaysAgo = now.getTime() - 7 * 86400000;
    return postTime >= sevenDaysAgo;
  }

  if (dateRange.preset === "30days") {
    const thirtyDaysAgo = now.getTime() - 30 * 86400000;
    return postTime >= thirtyDaysAgo;
  }

  if (dateRange.preset === "custom") {
    if (dateRange.startDate) {
      const startMs = new Date(`${dateRange.startDate}T00:00:00`).getTime();
      if (!isNaN(startMs) && postTime < startMs) return false;
    }
    if (dateRange.endDate) {
      const endMs = new Date(`${dateRange.endDate}T23:59:59`).getTime();
      if (!isNaN(endMs) && postTime > endMs) return false;
    }
    return true;
  }

  return true;
}

export function PostsScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ compose?: string }>();
  const role = normalizeRole(user?.role as string);
  const [posts, setPosts] = useState<Post[]>([]);
  const [sidebarVariant, setSidebarVariant] =
    useState<ManagementVariant>("plots");
  const [query, setQuery] = useState("");
  const [env, setEnv] = useState<"all" | EnvMode>("all");
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewerPost, setViewerPost] = useState<Post | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [sortOpen, setSortOpen] = useState(false);
  const [sortMode, setSortMode] = useState("newest");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState("all");
  const [selectedCrop, setSelectedCrop] = useState("all");
  const [selectedEnv, setSelectedEnv] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState<DateRangeFilter>({
    preset: "all",
  });
  const [composerOpen, setComposerOpen] = useState(false);
  const [masterPlots, setMasterPlots] = useState<PlotInfo[]>([]);
  const [masterCrops, setMasterCrops] = useState<CropTypeInfo[]>([]);

  const insets = useSafeAreaInsets();
  const effectiveEnv = selectedEnv !== "all" ? selectedEnv : env;
  const isInitialMount = useRef(true);

  const fetchPostsData = useCallback(
    async (isPullToRefresh = false) => {
      if (isPullToRefresh) {
        setRefreshing(true);
      } else if (isInitialMount.current) {
        setLoadingPosts(true);
      } else {
        setFiltering(true);
      }
      setLoadError(null);
      try {
        const data = await getPosts(role, user?.id, {
          crop: selectedCrop,
          env: effectiveEnv,
          plot: selectedPlot,
          q: query,
          severity: selectedSeverity,
          sort: sortMode,
        });
        const dateFiltered = data.filter((post) =>
          matchesDateRange(post.createdAt, selectedDateRange),
        );
        setPosts(
          dateFiltered.map((post) =>
            normalizePostIdentity(post as Post & { _id?: string }),
          ),
        );
      } catch (err: any) {
        setLoadError(err?.message || "Lỗi tải dữ liệu");
        setPosts([]);
      } finally {
        setRefreshing(false);
        setLoadingPosts(false);
        setFiltering(false);
        isInitialMount.current = false;
      }
    },
    [
      effectiveEnv,
      query,
      role,
      selectedCrop,
      selectedDateRange,
      selectedPlot,
      selectedSeverity,
      sortMode,
      user?.id,
    ],
  );

  useEffect(() => {
    fetchPostsData(false);
  }, [fetchPostsData]);

  const onPullToRefresh = useCallback(() => {
    fetchPostsData(true);
  }, [fetchPostsData]);

  const loadPostComposerData = useCallback(async () => {
    if (role !== "admin") return;
    const [plotData, cropData] = await Promise.all([
      getPlots(),
      getCropTypes(),
    ]);
    setMasterPlots(plotData);
    setMasterCrops(cropData);
  }, [role]);

  const openPostComposer = useCallback(() => {
    setComposerOpen(true);
    loadPostComposerData().catch(() => {});
  }, [loadPostComposerData]);

  useEffect(() => {
    if (role === "admin" && params.compose === "1") {
      openPostComposer();
    }
  }, [openPostComposer, params.compose, role]);

  const plots = useMemo(() => {
    const set = new Set(posts.map((p) => p.plotId).filter(Boolean));
    return Array.from(set) as string[];
  }, [posts]);

  const crops = useMemo(() => {
    const set = new Set(posts.map((p) => p.cropType).filter(Boolean));
    return Array.from(set) as string[];
  }, [posts]);

  const isPostAuthorAdmin = useCallback(
    (targetPost?: Post | null) => {
      if (!targetPost || !user || role !== "admin") return false;
      return Boolean(
        targetPost.user?.id === user.id ||
          (targetPost.user?.email && targetPost.user.email === user.email) ||
          (targetPost.user?.name && targetPost.user.name === user.name),
      );
    },
    [role, user],
  );

  const handleDeletePost = useCallback(
    async (postId: string) => {
      try {
        await deletePost(postId);
        Alert.alert("Thành công", "Đã xóa bài post thành công.");
        fetchPostsData(false);
      } catch (err: any) {
        Alert.alert("Lỗi", err?.message || "Không thể xóa bài post.");
      }
    },
    [fetchPostsData],
  );

  return (
    <AppScreenLayout
      active="posts"
      managementVariant={sidebarVariant}
      onAdminCreatePost={openPostComposer}
      setManagementVariant={setSidebarVariant}
      testID="posts-screen"
      overlays={
        <>
          <ImageViewer
            post={viewerPost}
            initialIndex={viewerIndex}
            onClose={() => setViewerPost(null)}
            canDelete={isPostAuthorAdmin(viewerPost)}
            onDelete={() => {
              if (viewerPost) {
                handleDeletePost(viewerPost.id);
              }
            }}
          />
          <FilterModal
            visible={filterOpen}
            onClose={() => setFilterOpen(false)}
            plots={plots}
            crops={crops}
            selectedPlot={selectedPlot}
            selectedCrop={selectedCrop}
            selectedEnv={selectedEnv}
            selectedSeverity={selectedSeverity}
            selectedDateRange={selectedDateRange}
            onApply={(filters) => {
              setSelectedPlot(filters.plot);
              setSelectedCrop(filters.crop);
              setSelectedEnv(filters.env);
              setEnv(filters.env as "all" | EnvMode);
              setSelectedSeverity(filters.severity);
              setSelectedDateRange(filters.dateRange);
            }}
            onReset={() => {
              setSelectedPlot("all");
              setSelectedCrop("all");
              setSelectedEnv("all");
              setEnv("all");
              setSelectedSeverity("all");
              setSelectedDateRange({ preset: "all" });
            }}
          />
          <SortModal
            visible={sortOpen}
            onClose={() => setSortOpen(false)}
            selectedSort={sortMode}
            onSelectSort={setSortMode}
          />
          <AdminPostComposer
            visible={composerOpen}
            plots={masterPlots}
            crops={masterCrops}
            onClose={() => setComposerOpen(false)}
            onSaved={() => {
              setComposerOpen(false);
              fetchPostsData(false);
            }}
          />
        </>
      }
    >
      <View style={postsScreenStyles.listHeader}>
        <View style={postsScreenStyles.searchFilterRow}>
          <View style={postsScreenStyles.searchBox}>
            <Search size={20} color={COLORS.muted} />
            <InputText
              containerStyle={{ flex: 1 }}
              testID="posts-search-input"
              value={query}
              onChangeText={setQuery}
              placeholder={
                role === "admin"
                  ? "Tìm mã luống, loại cây hoặc tài khoản"
                  : "Tìm mã luống hoặc loại cây"
              }
              style={postsScreenStyles.searchInput}
              variant="plain"
            />
          </View>
          <Pressable
            style={postsScreenStyles.filterButton}
            onPress={() => setFilterOpen(true)}
          >
            <SlidersHorizontal size={16} color="#414940" />
            {/* <Text style={postsScreenStyles.filterText}>Bộ lọc</Text> */}
          </Pressable>
        </View>
        <View style={postsScreenStyles.filterChipRow}>
          <View style={postsScreenStyles.chipRow}>
            {[
              ["all", "Tất cả"],
              ["outdoor", "Ngoài trời"],
              ["greenhouse", "Nhà kính"],
            ].map(([id, label]) => (
              <Pressable
                key={id}
                style={[
                  postsScreenStyles.chip,
                  env === id && postsScreenStyles.chipActive,
                ]}
                onPress={() => {
                  setEnv(id as any);
                  setSelectedEnv(id);
                }}
              >
                <Text
                  style={[
                    postsScreenStyles.chipText,
                    env === id && postsScreenStyles.chipTextActive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
          {(() => {
            const SortIcon = getSortIcon(sortMode);
            const isCustomSort = sortMode !== "newest";
            return (
              <Pressable
                style={[
                  postsScreenStyles.sortIconButton,
                  isCustomSort && postsScreenStyles.sortIconButtonActive,
                ]}
                onPress={() => setSortOpen(true)}
              >
                <SortIcon
                  size={18}
                  color={isCustomSort ? COLORS.green : "#414940"}
                />
              </Pressable>
            );
          })()}
        </View>
      </View>
      <ScrollView
        style={postsScreenStyles.postList}
        contentContainerStyle={postsScreenStyles.postListContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onPullToRefresh}
            tintColor={COLORS.green}
          />
        }
      >
        {loadingPosts ? (
          <PostsSkeletonList />
        ) : loadError ? (
          <PostsErrorState onRetry={() => fetchPostsData(false)} />
        ) : filtering ? (
          <View style={{ opacity: 0.6, gap: LAYOUT.sectionGap }}>
            {posts.length > 0 ? (
              posts.map((post, index) => (
                <PostCard
                  key={postListKey(post as Post & { _id?: string }, index)}
                  post={post}
                  admin={role === "admin"}
                  canDelete={isPostAuthorAdmin(post)}
                  onImage={(imageIndex = 0) => {
                    setViewerPost(post);
                    setViewerIndex(imageIndex);
                  }}
                  onDelete={() => handleDeletePost(post.id)}
                />
              ))
            ) : (
              <PostsSkeletonList />
            )}
          </View>
        ) : posts.length > 0 ? (
          posts.map((post, index) => (
            <PostCard
              key={postListKey(post as Post & { _id?: string }, index)}
              post={post}
              admin={role === "admin"}
              canDelete={isPostAuthorAdmin(post)}
              onImage={(imageIndex = 0) => {
                setViewerPost(post);
                setViewerIndex(imageIndex);
              }}
              onDelete={() => handleDeletePost(post.id)}
            />
          ))
        ) : (
          <PostsEmptyState showStartButton={false} />
        )}
      </ScrollView>
      {role === "admin" && !viewerPost ? (
        <Pressable
          style={[
            postLocalStyles.floatingPublishButton,
            { bottom: 64 + insets.bottom },
          ]}
          onPress={openPostComposer}
        >
          <Plus size={20} color="#fff" />
        </Pressable>
      ) : null}
    </AppScreenLayout>
  );
}

const postLocalStyles = StyleSheet.create({
  floatingPublishButton: {
    position: "absolute",
    right: LAYOUT.sheetX,
    bottom: 96,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});

const postsScreenStyles = StyleSheet.create({
  listHeader: {
    paddingHorizontal: LAYOUT.screenX,
    paddingTop: 8,
    gap: 10,
  },
  searchFilterRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  searchBox: {
    flex: 1,
    height: 39,
    borderRadius: 8,
    backgroundColor: COLORS.field,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    color: COLORS.body,
    fontSize: TYPOGRAPHY.label,
    padding: 0,
  },
  filterButton: {
    // width: 86,
    height: 39,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c0c9bd",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  filterText: {
    color: "#414940",
    fontSize: TYPOGRAPHY.label,
    lineHeight: TYPOGRAPHY.bodyLine,
  },
  filterChipRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    flexShrink: 1,
  },
  chip: {
    height: 34,
    borderRadius: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.field,
  },
  chipActive: {
    backgroundColor: COLORS.green,
  },
  chipText: {
    color: COLORS.body,
    fontSize: TYPOGRAPHY.label,
    lineHeight: TYPOGRAPHY.bodyLine,
  },
  chipTextActive: {
    color: "#fff",
  },
  sortIconButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  sortIconButtonActive: {
    backgroundColor: COLORS.greenSoft,
    borderWidth: 1,
    borderColor: COLORS.green,
  },
  sortIconText: {
    color: "#414940",
    fontSize: 18,
    fontWeight: "700",
  },
  postList: {
    flex: 1,
    marginBottom: 16,
  },
  postListContent: {
    paddingTop: LAYOUT.sectionGap,
    paddingHorizontal: LAYOUT.screenX,
    paddingBottom: 12,
    gap: LAYOUT.sectionGap,
  },
});
