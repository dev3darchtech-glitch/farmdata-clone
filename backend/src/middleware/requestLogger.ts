import { NextFunction, Request, Response } from "express";

function getResultCount(payload: unknown): number | undefined {
  if (Array.isArray(payload)) return payload.length;
  if (payload && typeof payload === "object") {
    const data = payload as { items?: unknown[]; total?: unknown };
    if (Array.isArray(data.items)) return data.items.length;
    if (typeof data.total === "number") return data.total;
  }
  return undefined;
}

function getSafeBody(req: Request) {
  if (!req.body || typeof req.body !== "object") return req.body;
  const body = req.body as Record<string, unknown>;
  return {
    ...body,
    images: Array.isArray(body.images)
      ? `[${body.images.length} image(s)]`
      : body.images,
  };
}

export function apiRequestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const startedAt = Date.now();
  const isMasterDataRequest = req.path.startsWith("/master-data");
  const originalJson = res.json.bind(res);
  let responsePayload: unknown;

  res.json = (body?: unknown) => {
    responsePayload = body;
    return originalJson(body);
  };

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    const shouldLog = isMasterDataRequest || res.statusCode >= 400;
    if (!shouldLog) return;

    const base = {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs,
      user: req.user
        ? {
            id: req.user.id,
            username: req.user.username,
            role: req.user.role,
            email: req.user.email,
          }
        : undefined,
      hasAuthorizationHeader: Boolean(req.headers.authorization),
      query: req.query,
    };

    if (isMasterDataRequest) {
      console.log("📋 Master data request:", {
        ...base,
        resultCount: getResultCount(responsePayload),
      });
      return;
    }

    console.error("⚠️ API request failed:", {
      ...base,
      body: getSafeBody(req),
      response: responsePayload,
    });
  });

  next();
}
