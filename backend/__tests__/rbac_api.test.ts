import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { connectMongoDB } from "../src/db/connect";
import { app } from "../src/index";

jest.setTimeout(30000);

describe("FarmData Backend API & RBAC Suite", () => {
  let mongoServer: MongoMemoryServer;
  let farmerToken: string;
  let farmerRefreshToken: string;
  let adminToken: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await connectMongoDB(uri);

    // Authenticate as Farmer
    const farmerRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "an.nguyen@farm.vn", password: "123456" });
    expect(farmerRes.status).toBe(200);
    expect(farmerRes.body.token).toBeDefined();
    expect(farmerRes.body.refreshToken).toBeDefined();
    farmerToken = farmerRes.body.token;
    farmerRefreshToken = farmerRes.body.refreshToken;

    // Authenticate as Admin
    const adminRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@farm.vn", password: "123456" });
    expect(adminRes.status).toBe(200);
    expect(adminRes.body.token).toBeDefined();
    adminToken = adminRes.body.token;
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  describe("1. Authentication & JWT", () => {
    it("returns 401 for invalid credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "an.nguyen@farm.vn", password: "wrongpassword" });
      expect(res.status).toBe(401);
    });

    it("returns profile info for authenticated token", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${farmerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe("FARMER");
    });

    it("refreshes FARMER session tokens through backend refresh token", async () => {
      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: farmerRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.role).toBe("FARMER");
      expect(res.body.token).not.toBe(farmerRefreshToken);
    });

    it("registers and unregisters system push notification token", async () => {
      const token = "ExponentPushToken[farmer-notification-test]";
      const registerRes = await request(app)
        .post("/api/auth/push-token")
        .set("Authorization", `Bearer ${farmerToken}`)
        .send({ platform: "ios", token });

      expect(registerRes.status).toBe(200);
      expect(registerRes.body.ok).toBe(true);

      const unregisterRes = await request(app)
        .delete("/api/auth/push-token")
        .set("Authorization", `Bearer ${farmerToken}`)
        .send({ token });

      expect(unregisterRes.status).toBe(200);
      expect(unregisterRes.body.ok).toBe(true);
    });
  });

  describe("2. RBAC Access Control Enforcement", () => {
    it("allows FARMER to fetch read-only capture master data", async () => {
      const plotsRes = await request(app)
        .get("/api/master-data/plots")
        .set("Authorization", `Bearer ${farmerToken}`);
      const cropsRes = await request(app)
        .get("/api/master-data/crops")
        .set("Authorization", `Bearer ${farmerToken}`);

      expect(plotsRes.status).toBe(200);
      expect(cropsRes.status).toBe(200);
      expect(Array.isArray(plotsRes.body)).toBe(true);
      expect(Array.isArray(cropsRes.body)).toBe(true);
      expect(plotsRes.body.length).toBeGreaterThan(0);
      expect(cropsRes.body.length).toBeGreaterThan(0);
    });

    it("blocks FARMER from accessing ADMIN endpoints (403 Forbidden)", async () => {
      const res = await request(app)
        .post("/api/admin/plots")
        .set("Authorization", `Bearer ${farmerToken}`)
        .send({ code: "L-999", name: "Unauthorized plot" });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain("Forbidden");
    });

    it("allows ADMIN to access ADMIN endpoints (201 Created)", async () => {
      const res = await request(app)
        .post("/api/admin/plots")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ code: "L-009", name: "Luống 09 - Admin Managed" });

      expect(res.status).toBe(201);
      expect(res.body.code).toBe("L-009");
    });
  });

  describe("3. Capture Session and Admin Post Publishing Workflow", () => {
    it("creates a CaptureSession with required symptom description", async () => {
      const res = await request(app)
        .post("/api/sessions")
        .set("Authorization", `Bearer ${farmerToken}`)
        .send({
          images: ["https://example.com/plant.jpg"],
          plotId: "L-001",
          cropType: "Cà chua",
          growthStage: "flowering",
          envMode: "greenhouse",
          stationMeasurements: {
            temperature: 29,
            lightUvIndex: 68,
            windSpeed: 11,
            co2Level: 405,
            weatherCode: 1,
          },
          localMeasurements: {
            temperature: 26,
            humidity: 70,
          },
          symptomDescription: "Lá xuất hiện đốm vàng rải rác",
          severity: "Chớm bệnh",
        });

      expect(res.status).toBe(201);
      expect(res.body.session.severity).toBe("Chớm bệnh");
      expect(res.body.session.symptomDescription).toBe(
        "Lá xuất hiện đốm vàng rải rác",
      );
      expect(res.body.session.driveFiles[0].description).toContain(
        "Metadata phiên chụp",
      );
      expect(res.body.session.driveFiles[0].description).toContain(
        "Mã số luống: L-001",
      );
      expect(res.body.session.driveFiles[0].description).toContain(
        "Mã thời tiết: 1",
      );
      expect(res.body.post).toBeUndefined();
    });

    it("allows ADMIN to create a manual post from metadata fields", async () => {
      const res = await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          images: ["data:image/jpeg;base64,ZmFrZS1wb3N0LWltYWdl"],
          plotId: "L-001",
          cropType: "Cà chua",
          growthStage: "flowering",
          weatherCode: 63,
          severity: "Nhẹ",
          symptomDescription: "Lá bị cháy mép nhẹ",
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("PUBLISHED");
      expect(res.body.user.role).toBe("ADMIN");
      expect(res.body.plotId).toBe("L-001");
      expect(res.body.images[0]).toContain("drive.google.com");
      expect(res.body.driveFiles[0].folderPath).toBe("farmdata/posts/images");
      expect(res.body.driveFiles[0].description).toContain(
        "Mã số luống: L-001",
      );
      expect(res.body.stationMeasurements.weatherCode).toBe(63);
    });

    it("creates a CaptureSession without auto-posting, then only ADMIN can publish it", async () => {
      const sessionPayload = {
        images: ["https://example.com/plant.jpg"],
        plotId: "L-001",
        cropType: "Cà chua",
        growthStage: "flowering",
        envMode: "greenhouse",
        symptomDescription: "Vàng lá đốm nâu",
        severity: "Vừa",
      };

      const res = await request(app)
        .post("/api/sessions")
        .set("Authorization", `Bearer ${farmerToken}`)
        .send(sessionPayload);

      expect(res.status).toBe(201);
      expect(res.body.session.status).toBe("COMPLETED");
      expect(res.body.post).toBeUndefined();

      const farmerPostRes = await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${farmerToken}`)
        .send({ sessionId: res.body.session.sessionId });

      expect(farmerPostRes.status).toBe(403);

      const adminPostRes = await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ sessionId: res.body.session.sessionId });

      expect(adminPostRes.status).toBe(201);
      expect(adminPostRes.body.status).toBe("PUBLISHED");
      expect(adminPostRes.body.sessionId).toBe(res.body.session.sessionId);
      expect(adminPostRes.body.cropType).toBe("Cà chua");

      const postDetailRes = await request(app)
        .get(`/api/posts/${adminPostRes.body.postId}`)
        .set("Authorization", `Bearer ${farmerToken}`);

      expect(postDetailRes.status).toBe(200);
      expect(postDetailRes.body.postId).toBe(adminPostRes.body.postId);
    });
  });

  describe("4. Post Feed API", () => {
    it("fetches posts feed for authorized user", async () => {
      const res = await request(app)
        .get("/api/posts")
        .set("Authorization", `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it("applies post search, filters, and sorting on the API", async () => {
      const filteredRes = await request(app)
        .get("/api/posts")
        .query({
          crop: "Cà chua",
          env: "greenhouse",
          q: "Vàng",
          severity: "Vừa",
          sort: "newest",
        })
        .set("Authorization", `Bearer ${farmerToken}`);

      expect(filteredRes.status).toBe(200);
      expect(Array.isArray(filteredRes.body)).toBe(true);
      expect(filteredRes.body.length).toBeGreaterThan(0);
      filteredRes.body.forEach((post: any) => {
        expect(post.cropType).toBe("Cà chua");
        expect(post.envMode).toBe("greenhouse");
        expect(post.severity).toBe("Vừa");
        expect(
          [
            post.cropType,
            post.plotId,
            post.symptomDescription,
            post.user?.name,
          ]
            .filter(Boolean)
            .join(" "),
        ).toMatch(/Vàng/i);
      });

      const newestRes = await request(app)
        .get("/api/posts")
        .query({ sort: "newest" })
        .set("Authorization", `Bearer ${farmerToken}`);
      const oldestRes = await request(app)
        .get("/api/posts")
        .query({ sort: "oldest" })
        .set("Authorization", `Bearer ${farmerToken}`);

      expect(newestRes.status).toBe(200);
      expect(oldestRes.status).toBe(200);
      if (newestRes.body.length > 1 && oldestRes.body.length > 1) {
        expect(newestRes.body[0].postId).toBe(
          oldestRes.body[oldestRes.body.length - 1].postId,
        );
      }
    });
  });
});
