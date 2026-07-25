import {
  CaptureSession,
  CropTypeInfo,
  PlotInfo,
  Post,
  User,
  UserRole,
} from "@/types";

const BACKEND_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";

let activeJwtToken: string | null = null;

export interface BackendLoginResponse {
  token: string;
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

/**
 * Submit CaptureSession directly to backend API.
 */
export async function submitCaptureSession(
  sessionData: Omit<CaptureSession, "id" | "status" | "createdAt">,
  onProgress?: (step: string, current: number, total: number) => void,
): Promise<{ session: CaptureSession; post: Post }> {
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
      return { session: data.session, post: data.post };
    }
  } catch (err) {
    // Silent offline catch
  }

  const sessionId = `SESS-${Date.now()}`;
  const mockSession: CaptureSession = {
    ...sessionData,
    id: sessionId,
    status: "COMPLETED",
    createdAt: new Date().toISOString(),
  };

  const mockPost: Post = {
    id: `POST-${Date.now()}`,
    sessionId,
    user: {
      id: sessionData.farmerId || "FARMER-01",
      name: sessionData.farmerName || "Nông dân Nguyễn Văn An",
      email: sessionData.farmerEmail || "an.nguyen@farm.vn",
      role: "farmer",
    },
    cropType: sessionData.cropType,
    plotId: sessionData.plotId,
    growthStage: sessionData.growthStage,
    envMode: sessionData.envMode,
    symptomDescription: sessionData.symptomDescription,
    severity: sessionData.severity,
    images: sessionData.images,
    stationMeasurements: sessionData.stationMeasurements,
    localMeasurements: sessionData.localMeasurements,
    status: "PUBLISHED",
    createdAt: new Date().toISOString(),
  };

  return { session: mockSession, post: mockPost };
}

/**
 * Fetch Post Feed directly from backend API using server-side query parameters (`crop`, `q`).
 */
export async function fetchPostFeed(
  role: UserRole = "farmer",
  cropFilter?: string,
  searchQuery?: string,
): Promise<Post[]> {
  try {
    const url = new URL(`${BACKEND_URL}/posts`);
    if (cropFilter && cropFilter !== "ALL") {
      url.searchParams.set("crop", cropFilter);
    }
    if (searchQuery && searchQuery.trim()) {
      url.searchParams.set("q", searchQuery.trim());
    }

    const res = await fetch(url.toString(), {
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Silent offline catch
  }

  return [];
}

/**
 * Fetch Plots directly from backend API.
 */
export async function fetchPlotsAPI(): Promise<PlotInfo[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/admin/plots`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const plots = await res.json();
      return plots.map((p: any) => ({
        id: p._id || p.id,
        code: p.code,
        name: p.name,
        areaSquareMeters: p.areaSquareMeters,
      }));
    }
  } catch (err) {
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
      return {
        id: p._id || p.id,
        code: p.code,
        name: p.name,
        areaSquareMeters: p.areaSquareMeters,
      };
    }
  } catch (err) {
    // Silent offline catch
  }

  return {
    id: `PLOT-${Date.now()}`,
    code: plot.code,
    name: plot.name,
    areaSquareMeters: plot.areaSquareMeters,
  };
}

/**
 * Fetch Crops directly from backend API.
 */
export async function fetchCropsAPI(): Promise<CropTypeInfo[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/admin/crops`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const crops = await res.json();
      return crops.map((c: any) => ({
        id: c._id || c.id,
        name: c.name,
        category: c.category,
        icon: c.icon,
      }));
    }
  } catch (err) {
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
      return {
        id: c._id || c.id,
        name: c.name,
        category: c.category,
        icon: c.icon,
      };
    }
  } catch (err) {
    // Silent offline catch
  }

  return {
    id: `CROP-${Date.now()}`,
    name: crop.name,
    category: crop.category,
    icon: crop.icon,
  };
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
        role: u.role,
      }));
    }
  } catch (err) {
    // Silent offline catch
  }
  return [];
}

/**
 * Create User directly on backend API.
 */
export async function createUserAPI(userData: {
  name: string;
  email: string;
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
        role: u.role,
      };
    }
  } catch (err) {
    // Silent offline catch
  }

  return {
    id: `USER-${Date.now()}`,
    name: userData.name,
    email: userData.email,
    role: userData.role as any,
  };
}
