import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { connectMongoDB } from "../src/db/connect";
import { app } from "../src/index";

jest.setTimeout(30000);

describe("FarmData Backend API & RBAC Suite", () => {
  let mongoServer: MongoMemoryServer;
  let farmerToken: string;
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
    farmerToken = farmerRes.body.token;

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
  });

  describe("2. RBAC Access Control Enforcement", () => {
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

  describe("3. Auto Post Generation Workflow", () => {
    it("creates a CaptureSession and automatically generates linked Post", async () => {
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
      expect(res.body.post.status).toBe("PUBLISHED");
      expect(res.body.post.sessionId).toBe(res.body.session.sessionId);
      expect(res.body.post.cropType).toBe("Cà chua");
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
  });
});
