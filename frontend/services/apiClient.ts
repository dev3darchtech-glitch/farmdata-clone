import {
  AuthTokens,
  CaptureSession,
  CropTypeInfo,
  FarmInfo,
  GrowthStageId,
  ListQuery,
  PaginatedListResult,
  PlantDiseaseInfo,
  PlotInfo,
  Post,
  SymptomSeverity,
  User,
  UserRole,
} from "@/types";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const BACKEND_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://farm-data.3darchtech.com/api";
const TOKENS_KEY = "auth_tokens";
let activeJwtToken: string | null = null;
let refreshRequest: Promise<string | null> | null = null;

export interface BackendLoginResponse {
  token: string;
  refreshToken?: string;
  expiresIn?: number;
  user: User;
}

export function setAuthToken(token: string | null) {
  activeJwtToken = token;
}

export function getAuthToken(): string | null {
  return activeJwtToken;
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (activeJwtToken) {
    headers["Authorization"] = `Bearer ${activeJwtToken}`;
  }
  return headers;
}

async function getPersistedTokens(): Promise<AuthTokens | null> {
  const rawTokens =
    Platform.OS === "web"
      ? typeof localStorage !== "undefined"
        ? localStorage.getItem(TOKENS_KEY)
        : null
      : await SecureStore.getItemAsync(TOKENS_KEY);

  if (!rawTokens) return null;

  try {
    return JSON.parse(rawTokens) as AuthTokens;
  } catch {
    return null;
  }
}

async function persistTokens(tokens: AuthTokens): Promise<void> {
  const serialized = JSON.stringify(tokens);
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(TOKENS_KEY, serialized);
    }
  } else {
    await SecureStore.setItemAsync(TOKENS_KEY, serialized);
  }
  setAuthToken(tokens.accessToken);
}

async function clearPersistedTokens(): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(TOKENS_KEY);
    }
  } else {
    await SecureStore.deleteItemAsync(TOKENS_KEY);
  }
  setAuthToken(null);
}

function isTokenNearExpiry(tokens: AuthTokens | null, bufferSeconds = 60) {
  if (!tokens || !tokens.accessToken) return false;
  if (!tokens.issuedAt || typeof tokens.expiresIn !== "number") return false;
  const expirationTimestamp =
    tokens.issuedAt + (tokens.expiresIn - bufferSeconds) * 1000;
  return Date.now() >= expirationTimestamp;
}

function mergeHeaders(
  headers?: HeadersInit,
  includeAuth = true,
): Record<string, string> {
  const merged = {
    ...getAuthHeaders(),
    ...(headers instanceof Headers
      ? Object.fromEntries(headers.entries())
      : {}),
    ...(Array.isArray(headers) ? Object.fromEntries(headers) : {}),
    ...((headers && !Array.isArray(headers) && !(headers instanceof Headers)
      ? headers
      : {}) as Record<string, string>),
  };

  if (!includeAuth) {
    delete merged.Authorization;
  }

  return merged;
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshRequest) {
    return await refreshRequest;
  }

  refreshRequest = (async () => {
    const storedTokens = await getPersistedTokens();
    if (!storedTokens?.refreshToken) {
      await clearPersistedTokens();
      return null;
    }

    const response = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: storedTokens.refreshToken }),
    }).catch(() => null);

    if (!response?.ok) {
      await clearPersistedTokens();
      return null;
    }

    const data = await response.json().catch(() => null);
    const accessToken = data?.token || data?.access_token;
    if (!accessToken) {
      await clearPersistedTokens();
      return null;
    }

    const nextTokens: AuthTokens = {
      ...storedTokens,
      accessToken,
      refreshToken:
        data?.refreshToken || data?.refresh_token || storedTokens.refreshToken,
      expiresIn: Number(data?.expiresIn || data?.expires_in || 86400),
      issuedAt: Date.now(),
      tokenType: data?.tokenType || data?.token_type || "Bearer",
      idToken: data?.idToken || data?.id_token || storedTokens.idToken,
    };

    await persistTokens(nextTokens);
    return nextTokens.accessToken;
  })();

  try {
    return await refreshRequest;
  } finally {
    refreshRequest = null;
  }
}

async function ensureValidAccessToken() {
  const storedTokens = await getPersistedTokens();
  if (!storedTokens?.accessToken) {
    return;
  }

  if (!activeJwtToken) {
    setAuthToken(storedTokens.accessToken);
  }

  if (isTokenNearExpiry(storedTokens)) {
    await refreshAccessToken();
  }
}

async function shouldRetryWithRefreshedToken(response: Response) {
  if (response.status !== 401 && response.status !== 403) {
    return false;
  }

  const payload = await response
    .clone()
    .json()
    .catch(() => null);
  const errorMessage = String(payload?.error || "").toLowerCase();
  return (
    errorMessage.includes("hết hạn") ||
    errorMessage.includes("id-token-expired") ||
    errorMessage.includes("token verification failed") ||
    errorMessage.includes("token không hợp lệ")
  );
}

async function backendFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  await ensureValidAccessToken();

  const execute = () =>
    fetch(input, {
      ...init,
      headers: mergeHeaders(init.headers),
    });

  let response = await execute();

  if (!activeJwtToken || !(await shouldRetryWithRefreshedToken(response))) {
    return response;
  }

  const refreshedToken = await refreshAccessToken();
  if (!refreshedToken) {
    return response;
  }

  response = await execute();
  return response;
}

function mapPlot(p: any): PlotInfo {
  return {
    id: p._id || p.id,
    code: p.code,
    name: p.name,
    farmId: p.farmId?._id || p.farmId?.id || p.farmId || "",
    envMode: p.envMode === "greenhouse" ? "greenhouse" : "outdoor",
    areaSquareMeters: p.areaSquareMeters,
    isActive: p.isActive !== false,
    status: p.status,
  };
}

function mapFarm(f: any): FarmInfo {
  return {
    id: f._id || f.id,
    name: f.name,
    isActive: f.isActive !== false,
  };
}

function mapCrop(c: any): CropTypeInfo {
  return {
    id: c._id || c.id,
    name: c.name,
    category: c.category,
    icon: c.icon,
    isActive: c.isActive !== false,
    status: c.status,
  };
}

function mapPlantDisease(d: any): PlantDiseaseInfo {
  return {
    id: d._id || d.id,
    group: d.group,
    type: d.type,
    name: d.name,
    description: d.description,
    isActive: d.isActive !== false,
    status: d.status,
  };
}

function mapUser(u: any): User {
  return {
    id: u._id || u.id,
    name: u.name,
    email: u.email,
    username: u.username,
    role: u.role,
    isRevoked: Boolean(u.isRevoked),
    revokedAt: u.revokedAt,
  };
}

/**
 * Log in to backend API to retrieve JWT token and user profile.
 */
export async function loginBackend(
  email: string,
  password: string,
): Promise<BackendLoginResponse> {
  const res = await fetch(`${BACKEND_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  }).catch(() => {
    throw new Error("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "Tên đăng nhập hoặc mật khẩu không đúng.");
  }

  if (!data.token || !data.user) {
    throw new Error("Phản hồi đăng nhập không hợp lệ.");
  }

  setAuthToken(data.token);
  return data;
}

export async function fetchCurrentUserProfile(): Promise<User> {
  const res = await backendFetch(`${BACKEND_URL}/auth/me`, {
    headers: getAuthHeaders(),
  }).catch(() => {
    throw new Error("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.user) {
    throw new Error(data.error || "Không thể tải thông tin tài khoản.");
  }

  return data.user as User;
}
/**
 * Submit CaptureSession directly to backend API.
 */
export async function submitCaptureSession(
  sessionData: Omit<CaptureSession, "id" | "status" | "createdAt">,
  onProgress?: (step: string, current: number, total: number) => void,
): Promise<{ session: CaptureSession }> {
  const totalImages = sessionData.images.length;
  if (onProgress) {
    for (let i = 1; i <= totalImages; i++) {
      onProgress("Đang tải ảnh", i, totalImages);
    }
  }

  try {
    const res = await backendFetch(`${BACKEND_URL}/sessions`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(sessionData),
    });

    if (res.ok) {
      const data = await res.json();
      return { session: data.session };
    }
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Không thể lưu phiên chụp.");
  } catch (err) {
    throw err instanceof Error
      ? err
      : new Error("Không thể kết nối đến máy chủ.");
  }
}

export async function updateCaptureSessionAPI(
  sessionId: string,
  sessionData: Omit<CaptureSession, "id" | "status" | "createdAt">,
  onProgress?: (step: string, current: number, total: number) => void,
): Promise<{ session: CaptureSession }> {
  const totalImages = sessionData.images.length;
  if (onProgress) {
    for (let i = 1; i <= totalImages; i++) {
      onProgress("Đang cập nhật ảnh", i, totalImages);
    }
  }

  try {
    const res = await backendFetch(
      `${BACKEND_URL}/sessions/${encodeURIComponent(sessionId)}`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(sessionData),
      },
    );

    if (res.ok) {
      const data = await res.json();
      return { session: data.session };
    }
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Không thể cập nhật phiên chụp.");
  } catch (err) {
    throw err instanceof Error
      ? err
      : new Error("Không thể kết nối đến máy chủ.");
  }
}

/**
 * Fetch Post Feed directly from backend API using server-side filters and sorting.
 */
export async function fetchPostFeed(
  role: UserRole = "farmer",
  filters: {
    page?: number;
    crop?: string;
    env?: string;
    plot?: string;
    q?: string;
    severity?: string;
    sort?: string;
    datePreset?: string;
    startDate?: string;
    endDate?: string;
    mine?: boolean;
    limit?: number;
    offset?: number;
  } = {},
): Promise<PaginatedListResult<Post>> {
  try {
    const url = new URL(`${BACKEND_URL}/posts`);
    if (filters.page !== undefined) {
      url.searchParams.set("page", String(filters.page));
    }
    if (filters.crop && filters.crop !== "all" && filters.crop !== "ALL") {
      url.searchParams.set("crop", filters.crop);
    }
    if (filters.env && filters.env !== "all" && filters.env !== "ALL") {
      url.searchParams.set("env", filters.env);
    }
    if (filters.plot && filters.plot !== "all" && filters.plot !== "ALL") {
      url.searchParams.set("plot", filters.plot);
    }
    if (
      filters.severity &&
      filters.severity !== "all" &&
      filters.severity !== "ALL"
    ) {
      url.searchParams.set("severity", filters.severity);
    }
    if (filters.q && filters.q.trim()) {
      url.searchParams.set("q", filters.q.trim());
    }
    if (filters.sort) {
      url.searchParams.set("sort", filters.sort);
    }
    if (filters.datePreset && filters.datePreset !== "all") {
      url.searchParams.set("datePreset", filters.datePreset);
    }
    if (filters.startDate?.trim()) {
      url.searchParams.set("startDate", filters.startDate.trim());
    }
    if (filters.endDate?.trim()) {
      url.searchParams.set("endDate", filters.endDate.trim());
    }
    if (filters.mine) {
      url.searchParams.set("mine", "true");
    }
    if (filters.limit !== undefined) {
      url.searchParams.set("limit", String(filters.limit));
    }
    if (filters.offset !== undefined) {
      url.searchParams.set("offset", String(filters.offset));
    }

    const res = await backendFetch(url.toString(), {
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return {
          items: data,
          total: data.length,
          page: filters.page || 1,
          limit: filters.limit || data.length || 1,
          totalPages: 1,
          hasMore: false,
        };
      }
      return {
        items: data.items ?? data.posts ?? [],
        total: data.total ?? 0,
        page: data.page ?? filters.page ?? 1,
        limit: data.limit ?? filters.limit ?? 10,
        totalPages: data.totalPages ?? 1,
        hasMore: data.hasMore ?? false,
      };
    }
  } catch {
    // Silent offline catch
  }

  return {
    items: [],
    total: 0,
    page: filters.page || 1,
    limit: filters.limit || 10,
    totalPages: 1,
    hasMore: false,
  };
}

export async function fetchPostById(postId: string): Promise<Post | null> {
  if (!postId) return null;

  const res = await backendFetch(
    `${BACKEND_URL}/posts/${encodeURIComponent(postId)}`,
    {
      headers: getAuthHeaders(),
    },
  ).catch(() => {
    throw new Error("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
  });

  if (res.status === 404) {
    return null;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Không thể tải bài đăng.");
  }

  return data as Post;
}

export async function deletePostAPI(postId: string): Promise<void> {
  if (!postId) return;

  const res = await backendFetch(
    `${BACKEND_URL}/posts/${encodeURIComponent(postId)}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  ).catch(() => {
    throw new Error("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Không thể xóa bài đăng.");
  }
}

export async function createManualPostAPI(postData: {
  cropType: string;
  growthStage: GrowthStageId;
  images?: string[];
  plotId: string;
  diseaseGroup?: PlantDiseaseInfo["group"];
  diseaseType?: string;
  diseaseName?: string;
  severity: SymptomSeverity;
  symptomDescription: string;
  weatherCode: number;
}): Promise<Post> {
  const res = await backendFetch(`${BACKEND_URL}/posts`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(postData),
  }).catch(() => {
    throw new Error("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Không thể đăng bài.");
  }

  return data as Post;
}

export async function createPlotAPI(
  plot: Omit<PlotInfo, "id">,
): Promise<PlotInfo> {
  try {
    const res = await backendFetch(`${BACKEND_URL}/admin/plots`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(plot),
    });

    if (res.ok) {
      const p = await res.json();
      return mapPlot(p);
    }
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Không thể tạo mã luống.");
  } catch (err) {
    throw err instanceof Error
      ? err
      : new Error("Không thể kết nối đến máy chủ.");
  }
}

export async function updatePlotAPI(
  plotId: string,
  plot: Partial<Omit<PlotInfo, "id">>,
): Promise<PlotInfo> {
  const res = await backendFetch(`${BACKEND_URL}/admin/plots/${plotId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(plot),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Không thể cập nhật mã luống.");
  }

  return mapPlot(data);
}

export async function setPlotActiveStatusAPI(
  plotId: string,
  isActive: boolean,
): Promise<PlotInfo> {
  const res = await backendFetch(
    `${BACKEND_URL}/admin/plots/${plotId}/deactivate`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ isActive }),
    },
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Không thể cập nhật trạng thái mã luống.");
  }

  return mapPlot(data);
}

export async function createFarmAPI(
  farm: Omit<FarmInfo, "id">,
): Promise<FarmInfo> {
  try {
    const res = await backendFetch(`${BACKEND_URL}/admin/farms`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(farm),
    });

    if (res.ok) {
      const f = await res.json();
      return mapFarm(f);
    }
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Không thể tạo farm.");
  } catch (err) {
    throw err instanceof Error
      ? err
      : new Error("Không thể kết nối đến máy chủ.");
  }
}

export async function updateFarmAPI(
  farmId: string,
  farm: Partial<Omit<FarmInfo, "id">>,
): Promise<FarmInfo> {
  const res = await backendFetch(`${BACKEND_URL}/admin/farms/${farmId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(farm),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Không thể cập nhật farm.");
  }

  return mapFarm(data);
}

export async function setFarmActiveStatusAPI(
  farmId: string,
  isActive: boolean,
): Promise<FarmInfo> {
  const res = await backendFetch(
    `${BACKEND_URL}/admin/farms/${farmId}/deactivate`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ isActive }),
    },
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Không thể cập nhật trạng thái farm.");
  }

  return mapFarm(data);
}

async function fetchPaginatedCollection<T>({
  path,
  page,
  limit,
  query,
  mapper,
  fallbackError,
}: {
  path: string;
  page: number;
  limit: number;
  query?: string;
  mapper: (value: any) => T;
  fallbackError: string;
}): Promise<PaginatedListResult<T>> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (query?.trim()) {
    params.set("q", query.trim());
  }

  const res = await backendFetch(`${BACKEND_URL}${path}?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || fallbackError);
  }

  return {
    items: Array.isArray(data.items) ? data.items.map(mapper) : [],
    total: Number(data.total) || 0,
    page: Number(data.page) || page,
    limit: Number(data.limit) || limit,
    totalPages: Number(data.totalPages) || 1,
    hasMore:
      typeof data.hasMore === "boolean"
        ? data.hasMore
        : (Number(data.page) || page) < (Number(data.totalPages) || 1),
  };
}

async function fetchAllPages<T>(
  fetchPage: (query: ListQuery) => Promise<PaginatedListResult<T>>,
  limit = 100,
): Promise<T[]> {
  let page = 1;
  const items: T[] = [];

  while (true) {
    const result = await fetchPage({ page, limit });
    items.push(...result.items);
    if (!result.hasMore || page >= result.totalPages) {
      return items;
    }
    page += 1;
  }
}

export async function fetchPlotsPageAPI({
  page,
  limit,
  query,
}: ListQuery): Promise<PaginatedListResult<PlotInfo>> {
  return await fetchPaginatedCollection({
    path: "/master-data/plots",
    page,
    limit,
    query,
    mapper: mapPlot,
    fallbackError: "Không thể tải danh sách mã luống.",
  });
}

export async function fetchPlotsAPI(): Promise<PlotInfo[]> {
  try {
    return await fetchAllPages(fetchPlotsPageAPI);
  } catch {
    return [];
  }
}

export async function fetchFarmsPageAPI({
  page,
  limit,
  query,
}: ListQuery): Promise<PaginatedListResult<FarmInfo>> {
  return await fetchPaginatedCollection({
    path: "/master-data/farms",
    page,
    limit,
    query,
    mapper: mapFarm,
    fallbackError: "Không thể tải danh sách farm.",
  });
}

export async function fetchFarmsAPI(): Promise<FarmInfo[]> {
  try {
    return await fetchAllPages(fetchFarmsPageAPI);
  } catch {
    return [];
  }
}

export async function fetchCropsPageAPI({
  page,
  limit,
  query,
}: ListQuery): Promise<PaginatedListResult<CropTypeInfo>> {
  return await fetchPaginatedCollection({
    path: "/master-data/crops",
    page,
    limit,
    query,
    mapper: mapCrop,
    fallbackError: "Không thể tải danh sách loại cây.",
  });
}

/**
 * Fetch Crops directly from backend API.
 */
export async function fetchCropsAPI(): Promise<CropTypeInfo[]> {
  try {
    return await fetchAllPages(fetchCropsPageAPI);
  } catch {
    return [];
  }
}

/**
 * Create Crop directly on backend API.
 */
export async function createCropAPI(
  crop: Omit<CropTypeInfo, "id">,
): Promise<CropTypeInfo> {
  try {
    const res = await backendFetch(`${BACKEND_URL}/admin/crops`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(crop),
    });

    if (res.ok) {
      const c = await res.json();
      return mapCrop(c);
    }
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Không thể tạo loại cây.");
  } catch (err) {
    throw err instanceof Error
      ? err
      : new Error("Không thể kết nối đến máy chủ.");
  }
}

export async function updateCropAPI(
  cropId: string,
  crop: Partial<Omit<CropTypeInfo, "id">>,
): Promise<CropTypeInfo> {
  const res = await backendFetch(`${BACKEND_URL}/admin/crops/${cropId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(crop),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Không thể cập nhật loại cây.");
  }

  return mapCrop(data);
}

export async function setCropActiveStatusAPI(
  cropId: string,
  isActive: boolean,
): Promise<CropTypeInfo> {
  const res = await backendFetch(
    `${BACKEND_URL}/admin/crops/${cropId}/deactivate`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ isActive }),
    },
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Không thể cập nhật trạng thái loại cây.");
  }

  return mapCrop(data);
}

export async function fetchPlantDiseasesPageAPI({
  page,
  limit,
  query,
}: ListQuery): Promise<PaginatedListResult<PlantDiseaseInfo>> {
  return await fetchPaginatedCollection({
    path: "/master-data/plant-diseases",
    page,
    limit,
    query,
    mapper: mapPlantDisease,
    fallbackError: "Không thể tải danh sách bệnh cây.",
  });
}

export async function fetchPlantDiseasesAPI(): Promise<PlantDiseaseInfo[]> {
  try {
    return await fetchAllPages(fetchPlantDiseasesPageAPI);
  } catch {
    return [];
  }
}

export async function fetchUsersPageAPI({
  page,
  limit,
  query,
}: ListQuery): Promise<PaginatedListResult<User>> {
  return await fetchPaginatedCollection({
    path: "/admin/users",
    page,
    limit,
    query,
    mapper: mapUser,
    fallbackError: "Không thể tải danh sách tài khoản.",
  });
}

/**
 * Create plant disease directly on backend API.
 */
export async function createPlantDiseaseAPI(
  disease: Omit<PlantDiseaseInfo, "id">,
): Promise<PlantDiseaseInfo> {
  const res = await backendFetch(`${BACKEND_URL}/admin/plant-diseases`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(disease),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Không thể tạo bệnh cây.");
  }

  return mapPlantDisease(data);
}

export async function updatePlantDiseaseAPI(
  diseaseId: string,
  disease: Partial<Omit<PlantDiseaseInfo, "id">>,
): Promise<PlantDiseaseInfo> {
  const res = await backendFetch(
    `${BACKEND_URL}/admin/plant-diseases/${diseaseId}`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(disease),
    },
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Không thể cập nhật bệnh cây.");
  }

  return mapPlantDisease(data);
}

export async function setPlantDiseaseActiveStatusAPI(
  diseaseId: string,
  isActive: boolean,
): Promise<PlantDiseaseInfo> {
  const res = await backendFetch(
    `${BACKEND_URL}/admin/plant-diseases/${diseaseId}/deactivate`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ isActive }),
    },
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Không thể cập nhật trạng thái bệnh cây.");
  }

  return mapPlantDisease(data);
}

/**
 * Fetch Users directly from backend API.
 */
export async function fetchUsersAPI(): Promise<User[]> {
  try {
    return await fetchAllPages(fetchUsersPageAPI);
  } catch {
    return [];
  }
}

/**
 * Create User directly on backend API.
 */
export async function createUserAPI(userData: {
  name: string;
  username: string;
  password: string;
  role: string;
}): Promise<User> {
  try {
    const res = await backendFetch(`${BACKEND_URL}/admin/users`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });

    if (res.ok) {
      const u = await res.json();
      return mapUser(u);
    }
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Không thể tạo tài khoản.");
  } catch (err) {
    throw err instanceof Error
      ? err
      : new Error("Không thể kết nối đến máy chủ.");
  }
}

/**
 * Update Farmer account profile/password.
 */
export async function updateUserAPI(
  userId: string,
  userData: {
    name?: string;
    username?: string;
    password?: string;
  },
): Promise<User> {
  const res = await backendFetch(`${BACKEND_URL}/admin/users/${userId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Không thể cập nhật tài khoản.");
  }

  return mapUser(data);
}

/**
 * Revoke a farmer account. Revoked users can no longer log in or use existing JWTs.
 */
export async function revokeUserAPI(userId: string): Promise<User> {
  const res = await backendFetch(
    `${BACKEND_URL}/admin/users/${userId}/revoke`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    },
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Không thể thu hồi tài khoản.");
  }

  return mapUser(data);
}

/**
 * Restore a revoked farmer account.
 */
export async function restoreUserAPI(userId: string): Promise<User> {
  const res = await backendFetch(
    `${BACKEND_URL}/admin/users/${userId}/restore`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    },
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Không thể mở khóa tài khoản.");
  }

  return mapUser(data);
}
