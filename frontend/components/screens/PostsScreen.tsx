import { COLORS, LAYOUT, TYPOGRAPHY } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { getCropTypes, getPlots } from "@/services/adminService";
import { getPosts } from "@/services/postService";
import { CropTypeInfo, EnvMode, PlotInfo, Post } from "@/types";
import { ManagementVariant } from "@/types/ui";
import {
  normalizePostIdentity,
  normalizeRole,
  postListKey,
} from "@/utils/captureDisplay";
import { useLocalSearchParams } from "expo-router";
import {
  Plus,
  Search,
  SlidersHorizontal,
  SortAscIcon,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AdminPostComposer } from "../posts/AdminPostComposer";
import { FilterModal } from "../posts/FilterModal";
import { ImageViewer } from "../posts/ImageViewer";
import { PostCard } from "../posts/PostCard";
import {
  PostsEmptyState,
  PostsErrorState,
  PostsLoadingState,
} from "../posts/PostStates";
import { SortModal } from "../posts/SortModal";
import { EmptyState } from "../shared/EmptyState";
import { InputText } from "../shared/InputText";

import { AppScreenLayout } from "../shared/AppScreenLayout";

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
  const [composerOpen, setComposerOpen] = useState(false);
  const [masterPlots, setMasterPlots] = useState<PlotInfo[]>([]);
  const [masterCrops, setMasterCrops] = useState<CropTypeInfo[]>([]);

  const effectiveEnv = selectedEnv !== "all" ? selectedEnv : env;

  const refresh = useCallback(async () => {
    setRefreshing(true);
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
      setPosts(
        data.map((post) =>
          normalizePostIdentity(post as Post & { _id?: string }),
        ),
      );
    } catch (err: any) {
      setLoadError(err?.message || "Lỗi tải dữ liệu");
      setPosts([]);
    } finally {
      setRefreshing(false);
      setLoadingPosts(false);
    }
  }, [
    effectiveEnv,
    query,
    role,
    selectedCrop,
    selectedPlot,
    selectedSeverity,
    sortMode,
    user?.id,
  ]);

  useEffect(() => {
    refresh();
  }, [refresh]);

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

  const showInitialLoading = loadingPosts && !posts.length && !loadError;
  const showEmptyPosts = !refreshing && !loadError && !posts.length;

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
            onApply={(filters) => {
              setSelectedPlot(filters.plot);
              setSelectedCrop(filters.crop);
              setSelectedEnv(filters.env);
              setEnv(filters.env as "all" | EnvMode);
              setSelectedSeverity(filters.severity);
            }}
            onReset={() => {
              setSelectedPlot("all");
              setSelectedCrop("all");
              setSelectedEnv("all");
              setEnv("all");
              setSelectedSeverity("all");
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
              refresh();
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
            <Text style={postsScreenStyles.filterText}>Bộ lọc</Text>
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
          <Pressable
            style={postsScreenStyles.sortIconButton}
            onPress={() => setSortOpen(true)}
          >
            <Text style={postsScreenStyles.sortIconText}>
              <SortAscIcon />
            </Text>
          </Pressable>
        </View>
      </View>
      {showInitialLoading ? (
        <PostsLoadingState />
      ) : loadError ? (
        <PostsErrorState onRetry={refresh} />
      ) : showEmptyPosts ? (
        <PostsEmptyState showStartButton={false} />
      ) : (
        <ScrollView
          style={postsScreenStyles.postList}
          contentContainerStyle={postsScreenStyles.postListContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          }
        >
          {posts.length ? (
            posts.map((post, index) => (
              <PostCard
                key={postListKey(post as Post & { _id?: string }, index)}
                post={post}
                admin={role === "admin"}
                onImage={(imageIndex = 0) => {
                  setViewerPost(post);
                  setViewerIndex(imageIndex);
                }}
              />
            ))
          ) : (
            <EmptyState title="Không có bài đăng phù hợp" />
          )}
        </ScrollView>
      )}
      {role === "admin" && !viewerPost ? (
        <Pressable
          style={postLocalStyles.floatingPublishButton}
          onPress={openPostComposer}
        >
          <Plus size={28} color="#fff" />
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
    width: 58,
    height: 58,
    borderRadius: 29,
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
    paddingTop: LAYOUT.screenTop,
    gap: LAYOUT.sectionGap,
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
    width: 86,
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
