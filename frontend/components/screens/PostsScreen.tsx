import { COLORS, LAYOUT, TYPOGRAPHY } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { deletePost, getPosts } from "@/services/postService";
import { EnvMode, Post } from "@/types";
import { ManagementVariant } from "@/types/ui";
import {
  normalizePostIdentity,
  normalizeRole,
  postListKey,
} from "@/utils/captureDisplay";
import { setPendingEditPost } from "@/stores/editPostStore";
import { router } from "expo-router";
import {
  ArrowDownAZ,
  ArrowDownWideNarrow,
  ArrowUpAZ,
  ArrowUpDown,
  ArrowUpNarrowWide,
  Search,
  SlidersHorizontal,
} from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { DateRangeFilter, FilterModal } from "../posts/FilterModal";
import { ImageViewer } from "../posts/ImageViewer";
import { PostCard } from "../posts/PostCard";
import {
  PostsEmptyState,
  PostsErrorState,
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

export function PostsScreen() {
  const { user } = useAuth();
  const role = normalizeRole(user?.role as string);
  const [posts, setPosts] = useState<Post[]>([]);
  const [sidebarVariant, setSidebarVariant] =
    useState<ManagementVariant>("plots");
  const [query, setQuery] = useState("");
  const [env, setEnv] = useState<"all" | EnvMode>("all");
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewerPost, setViewerPost] = useState<Post | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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

  const PAGE_SIZE = 10;
  const effectiveEnv = selectedEnv !== "all" ? selectedEnv : env;
  const isInitialMount = useRef(true);

  const buildFilters = useCallback(
    (page: number) => ({
      page,
      crop: selectedCrop,
      env: effectiveEnv,
      plot: selectedPlot,
      q: query,
      severity: selectedSeverity,
      sort: sortMode,
      datePreset: selectedDateRange.preset,
      startDate: selectedDateRange.startDate,
      endDate: selectedDateRange.endDate,
      limit: PAGE_SIZE,
    }),
    [
      effectiveEnv,
      query,
      selectedCrop,
      selectedDateRange.endDate,
      selectedDateRange.preset,
      selectedPlot,
      selectedSeverity,
      selectedDateRange.startDate,
      sortMode,
    ],
  );

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
        const result = await getPosts(role, user?.id, buildFilters(1));
        const normalized = result.items.map((post) =>
          normalizePostIdentity(post as Post & { _id?: string }),
        );
        setPosts(normalized);
        setHasMore(result.hasMore);
        setCurrentPage(result.page);
      } catch (err: any) {
        setLoadError(err?.message || "Lỗi tải dữ liệu");
        setPosts([]);
        setHasMore(false);
      } finally {
        setRefreshing(false);
        setLoadingPosts(false);
        setFiltering(false);
        isInitialMount.current = false;
      }
    },
    [buildFilters, role, user?.id],
  );

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const newPosts = await getPosts(role, user?.id, buildFilters(nextPage));
      const normalized = newPosts.items.map((post) =>
        normalizePostIdentity(post as Post & { _id?: string }),
      );
      setPosts((prev) => [...prev, ...normalized]);
      setHasMore(newPosts.hasMore);
      setCurrentPage(newPosts.page);
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
    }
  }, [buildFilters, currentPage, hasMore, loadingMore, role, user?.id]);

  useEffect(() => {
    fetchPostsData(false);
  }, [fetchPostsData]);

  const onPullToRefresh = useCallback(() => {
    fetchPostsData(true);
  }, [fetchPostsData]);

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

  const handleEditPost = useCallback((post: Post) => {
    try {
      setPendingEditPost(post);
      router.navigate("/(tabs)/capture" as any);
    } catch {
      Alert.alert("Lỗi", "Không thể mở trang chỉnh sửa.");
    }
  }, []);

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
      <FlatList
        style={postsScreenStyles.postList}
        contentContainerStyle={postsScreenStyles.postListContent}
        keyboardShouldPersistTaps="handled"
        data={posts}
        keyExtractor={(post, index) =>
          postListKey(post as Post & { _id?: string }, index)
        }
        renderItem={({ item: post }) => (
          <PostCard
            post={post}
            admin={role === "admin"}
            canDelete={isPostAuthorAdmin(post)}
            canEdit={isPostAuthorAdmin(post)}
            onImage={(imageIndex = 0) => {
              setViewerPost(post);
              setViewerIndex(imageIndex);
            }}
            onDelete={() => handleDeletePost(post.id)}
            onEdit={() => handleEditPost(post)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onPullToRefresh}
            tintColor={COLORS.green}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          loadingPosts ? (
            <PostsSkeletonList />
          ) : loadError ? (
            <PostsErrorState onRetry={() => fetchPostsData(false)} />
          ) : filtering ? (
            <View style={{ opacity: 0.6 }}>
              <PostsSkeletonList />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loadingPosts && !loadError && !filtering ? (
            <PostsEmptyState showStartButton={false} />
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={postsScreenStyles.loadMoreFooter}>
              <ActivityIndicator size="small" color={COLORS.green} />
            </View>
          ) : null
        }
      />
    </AppScreenLayout>
  );
}

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
  loadMoreFooter: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
