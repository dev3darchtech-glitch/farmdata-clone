import {
  CaptureSession,
  CropTypeInfo,
  PlotInfo,
  PlantDiseaseInfo,
  Post,
  GrowthStageId,
  SymptomSeverity,
  User,
  UserRole,
} from "@/types";

export const BACKEND_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";

let activeJwtToken: string | null = null;

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

function mapPlot(p: any): PlotInfo {
  return {
    id: p._id || p.id,
    code: p.code,
    name: p.name,
    areaSquareMeters: p.areaSquareMeters,
    isActive: p.isActive !== false,
    status: p.status,
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

export interface PaginatedPlantDiseases {
  items: PlantDiseaseInfo[];
  total: number;
  page: number;
  totalPages: number;
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
  const res = await fetch(`${BACKEND_URL}/auth/me`, {
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

export async function registerPushTokenAPI(pushToken: {
  platform: "android" | "ios";
  token: string;
}): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/auth/push-token`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(pushToken),
  }).catch(() => {
    throw new Error("Không thể đăng ký thông báo đẩy.");
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Không thể đăng ký thông báo đẩy.");
  }
}

export async function unregisterPushTokenAPI(token: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/auth/push-token`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    body: JSON.stringify({ token }),
  }).catch(() => undefined);

  if (res && !res.ok) {
    throw new Error("Không thể hủy thông báo đẩy.");
  }
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
    const res = await fetch(`${BACKEND_URL}/sessions`, {
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

/**
 * Fetch Post Feed directly from backend API using server-side filters and sorting.
 */
export async function fetchPostFeed(
  role: UserRole = "farmer",
  filters: {
    crop?: string;
    env?: string;
    plot?: string;
    q?: string;
    severity?: string;
    sort?: string;
  } = {},
): Promise<Post[]> {
  try {
    const url = new URL(`${BACKEND_URL}/posts`);
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

    const res = await fetch(url.toString(), {
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Silent offline catch
  }

  return [];
}

export async function fetchPostById(postId: string): Promise<Post | null> {
  if (!postId) return null;

  const res = await fetch(
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

  const res = await fetch(
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
  const res = await fetch(`${BACKEND_URL}/posts`, {
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

/**
 * Fetch Plots directly from backend API.
 */
export async function fetchPlotsAPI(): Promise<PlotInfo[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/master-data/plots`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const plots = await res.json();
      return plots.map(mapPlot);
    }
  } catch {
    // Silent offline catch
  }
  return [];
}

/**
 * Create Plot directly on backend API.
 */
export async function createPlotAPI(
  plot: Omit<PlotInfo, "id">,
): Promise<PlotInfo> {
  try {
    const res = await fetch(`${BACKEND_URL}/admin/plots`, {
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
  const res = await fetch(`${BACKEND_URL}/admin/plots/${plotId}`, {
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
  const res = await fetch(`${BACKEND_URL}/admin/plots/${plotId}/deactivate`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ isActive }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Không thể cập nhật trạng thái mã luống.");
  }

  return mapPlot(data);
}

/**
 * Fetch Crops directly from backend API.
 */
export async function fetchCropsAPI(): Promise<CropTypeInfo[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/master-data/crops`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const crops = await res.json();
      return crops.map(mapCrop);
    }
  } catch {
    // Silent offline catch
  }
  return [];
}

/**
 * Create Crop directly on backend API.
 */
export async function createCropAPI(
  crop: Omit<CropTypeInfo, "id">,
): Promise<CropTypeInfo> {
  try {
    const res = await fetch(`${BACKEND_URL}/admin/crops`, {
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
  const res = await fetch(`${BACKEND_URL}/admin/crops/${cropId}`, {
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
  const res = await fetch(`${BACKEND_URL}/admin/crops/${cropId}/deactivate`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ isActive }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Không thể cập nhật trạng thái loại cây.");
  }

  return mapCrop(data);
}

/**
 * Fetch plant diseases from master-data API.
 */
export async function fetchPlantDiseasesAPI(): Promise<PlantDiseaseInfo[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/master-data/plant-diseases`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const diseases = await res.json();
      return diseases.map(mapPlantDisease);
    }
  } catch {
    // Silent offline catch
  }
  return [];
}

export async function fetchPlantDiseasesPageAPI({
  page,
  limit,
  query,
}: {
  page: number;
  limit: number;
  query?: string;
}): Promise<PaginatedPlantDiseases> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (query?.trim()) {
    params.set("q", query.trim());
  }

  const res = await fetch(
    `${BACKEND_URL}/master-data/plant-diseases?${params.toString()}`,
    {
      headers: getAuthHeaders(),
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Không thể tải danh sách bệnh cây.");
  }

  if (Array.isArray(data)) {
    const filteredItems = query?.trim()
      ? data.filter((item: any) =>
          [item.group, item.type, item.name]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
        )
      : data;
    const start = (page - 1) * limit;
    const items = filteredItems.slice(start, start + limit);

    return {
      items: items.map(mapPlantDisease),
      total: filteredItems.length,
      page,
      totalPages: Math.max(1, Math.ceil(filteredItems.length / limit)),
    };
  }

  return {
    items: Array.isArray(data.items) ? data.items.map(mapPlantDisease) : [],
    total: Number(data.total) || 0,
    page: Number(data.page) || page,
    totalPages: Number(data.totalPages) || 1,
  };
}

/**
 * Create plant disease directly on backend API.
 */
export async function createPlantDiseaseAPI(
  disease: Omit<PlantDiseaseInfo, "id">,
): Promise<PlantDiseaseInfo> {
  const res = await fetch(`${BACKEND_URL}/admin/plant-diseases`, {
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
  const res = await fetch(`${BACKEND_URL}/admin/plant-diseases/${diseaseId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(disease),
  });

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
  const res = await fetch(
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
    const res = await fetch(`${BACKEND_URL}/admin/users`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const users = await res.json();
      return users.map((u: any) => ({
        id: u._id || u.id,
        name: u.name,
        email: u.email,
        username: u.username,
        role: u.role,
        isRevoked: Boolean(u.isRevoked),
        revokedAt: u.revokedAt,
        createdByAdminId:
          typeof u.createdByAdminId === "string"
            ? u.createdByAdminId
            : u.createdByAdminId?._id || u.createdByAdminId?.id,
      }));
    }
  } catch {
    // Silent offline catch
  }
  return [];
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
    const res = await fetch(`${BACKEND_URL}/admin/users`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });

    if (res.ok) {
      const u = await res.json();
      return {
        id: u._id || u.id,
        name: u.name,
        email: u.email,
        username: u.username,
        role: u.role,
        isRevoked: Boolean(u.isRevoked),
        revokedAt: u.revokedAt,
        createdByAdminId:
          typeof u.createdByAdminId === "string"
            ? u.createdByAdminId
            : u.createdByAdminId?._id || u.createdByAdminId?.id,
      };
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
  const res = await fetch(`${BACKEND_URL}/admin/users/${userId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Không thể cập nhật tài khoản.");
  }

  return {
    id: data._id || data.id,
    name: data.name,
    email: data.email,
    username: data.username,
    role: data.role,
    isRevoked: Boolean(data.isRevoked),
    revokedAt: data.revokedAt,
    createdByAdminId:
      typeof data.createdByAdminId === "string"
        ? data.createdByAdminId
        : data.createdByAdminId?._id || data.createdByAdminId?.id,
  };
}

/**
 * Revoke a farmer account. Revoked users can no longer log in or use existing JWTs.
 */
export async function revokeUserAPI(userId: string): Promise<User> {
  const res = await fetch(`${BACKEND_URL}/admin/users/${userId}/revoke`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Không thể thu hồi tài khoản.");
  }

  return {
    id: data._id || data.id,
    name: data.name,
    email: data.email,
    username: data.username,
    role: data.role,
    isRevoked: Boolean(data.isRevoked),
    revokedAt: data.revokedAt,
    createdByAdminId:
      typeof data.createdByAdminId === "string"
        ? data.createdByAdminId
        : data.createdByAdminId?._id || data.createdByAdminId?.id,
  };
}

/**
 * Restore a revoked farmer account.
 */
export async function restoreUserAPI(userId: string): Promise<User> {
  const res = await fetch(`${BACKEND_URL}/admin/users/${userId}/restore`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Không thể mở khóa tài khoản.");
  }

  return {
    id: data._id || data.id,
    name: data.name,
    email: data.email,
    username: data.username,
    role: data.role,
    isRevoked: Boolean(data.isRevoked),
    revokedAt: data.revokedAt,
    createdByAdminId:
      typeof data.createdByAdminId === "string"
        ? data.createdByAdminId
        : data.createdByAdminId?._id || data.createdByAdminId?.id,
  };
}
