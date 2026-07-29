import { Post } from "@/types";

/**
 * Simple module-level store for passing a Post object to CaptureScreen for editing.
 * Using URL params for this is unreliable with large JSON payloads and Expo Router tabs.
 */
let _pendingEditPost: Post | null = null;

/** Set the post to be edited. Call before navigating to CaptureScreen. */
export function setPendingEditPost(post: Post): void {
  _pendingEditPost = post;
}

/** Consume the pending edit post (reads and clears it). */
export function consumePendingEditPost(): Post | null {
  const post = _pendingEditPost;
  _pendingEditPost = null;
  return post;
}

/** Check if there is a pending edit post without consuming it. */
export function hasPendingEditPost(): boolean {
  return _pendingEditPost !== null;
}
