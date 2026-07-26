import type { Post } from "@/types";
import * as Linking from "expo-linking";

export function getImageExtension(uri: string) {
  const cleanUri = uri.split("?")[0].split("#")[0];
  const match = cleanUri.match(/\.(jpe?g|png|webp|heic|gif)$/i);
  return match?.[1]?.toLowerCase() || "jpg";
}

export function getImageDownloadName(post: Post, index: number, uri: string) {
  const safePostId = post.id.replace(/[^a-zA-Z0-9_-]/g, "-") || "post";
  return `capture-data-${safePostId}-${index + 1}.${getImageExtension(uri)}`;
}

export function buildPostUrl(post: Post) {
  return Linking.createURL("/posts", {
    queryParams: {
      postId: post.id,
    },
  });
}

export function downloadImageOnWeb(uri: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = uri;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}
