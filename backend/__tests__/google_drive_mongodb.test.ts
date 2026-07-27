import { MongoMemoryServer } from "mongodb-memory-server";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import request from "supertest";

import { connectMongoDB } from "../src/db/connect";
import { app } from "../src/index";
import { UserModel } from "../src/models/User";

jest.setTimeout(30000);

describe("MongoDB & Admin Google Drive Integration Suite", () => {
  let mongoServer: MongoMemoryServer;
  let adminToken: string;
  let adminId: string;
  let otherAdminToken: string;
  let otherAdminId: string;
  let otherFarmerId: string;
  let farmerToken: string;
  let farmerId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await connectMongoDB(uri);

    // Login Admin
    const adminRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@farm.vn", password: "123456" });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.token;
    adminId = adminRes.body.user.id;

    const otherAdmin = await UserModel.create({
      name: "Admin khác",
      email: "admin2@farm.vn",
      username: "admin2",
      passwordHash: bcrypt.hashSync("123456", 8),
      role: "ADMIN",
      isRevoked: false,
    });
    otherAdminId = otherAdmin._id.toString();

    const otherAdminRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin2@farm.vn", password: "123456" });
    expect(otherAdminRes.status).toBe(200);
    otherAdminToken = otherAdminRes.body.token;

    const otherFarmer = await UserModel.create({
      name: "Farmer của admin khác",
      username: "otherfarmer",
      passwordHash: bcrypt.hashSync("password123", 8),
      role: "FARMER",
      createdByAdminId: otherAdminId,
      isRevoked: false,
    });
    otherFarmerId = otherFarmer._id.toString();

    // Admin creates a normal Farmer user
    const createFarmerRes = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Nông dân Bùi Văn Cường",
        username: "cuongbui",
        password: "password123",
        role: "FARMER",
      });

    expect(createFarmerRes.status).toBe(201);
    expect(createFarmerRes.body.createdByAdminId).toBeDefined();
    farmerId = createFarmerRes.body._id;

    // Login newly created Farmer
    const farmerRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "cuongbui", password: "password123" });
    expect(farmerRes.status).toBe(200);
    farmerToken = farmerRes.body.token;
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it("verifies Admin Google OAuth URL endpoint (GET /api/auth/google/url)", async () => {
    const res = await request(app)
      .get("/api/auth/google/url")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.url).toContain("accounts.google.com");
  });

  it("requests Drive scope during Google sign-in", async () => {
    const redirectUri = "capturedata://auth-callback";
    const res = await request(app)
      .get("/api/auth/google")
      .query({ redirect_uri: redirectUri })
      .redirects(0);

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain("accounts.google.com");
    expect(decodeURIComponent(res.headers.location)).toContain(
      "https://www.googleapis.com/auth/drive",
    );
    expect(decodeURIComponent(res.headers.location)).toContain(
      "https://www.googleapis.com/auth/drive.file",
    );
    expect(decodeURIComponent(res.headers.location)).toContain(
      "prompt=consent select_account",
    );
  });

  it("links Google OAuth tokens to Admin account in MongoDB", async () => {
    // Manually set linked tokens for testing
    await UserModel.findOneAndUpdate(
      { email: "admin@farm.vn" },
      {
        $set: {
          "googleTokens.refreshToken": "mock_admin_refresh_token_xyz",
          "googleTokens.email": "admin.gdrive@farm.vn",
          "googleTokens.isLinked": true,
        },
      },
    );

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.isGoogleDriveLinked).toBe(true);
    expect(meRes.body.user.googleDriveEmail).toBe("admin.gdrive@farm.vn");
  });

  it("does not report Google Drive as linked when refresh token is missing", async () => {
    await UserModel.findOneAndUpdate(
      { email: "admin@farm.vn" },
      {
        $set: {
          "googleTokens.accessToken": "login_only_access_token",
          "googleTokens.email": "admin.loginonly@farm.vn",
          "googleTokens.isLinked": true,
        },
        $unset: {
          "googleTokens.refreshToken": 1,
        },
      },
    );

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.isGoogleDriveLinked).toBe(false);
    expect(meRes.body.user.googleDriveEmail).toBe("admin.loginonly@farm.vn");
  });

  it("allows admin to manage farmers but not create, update, or revoke admin accounts", async () => {
    const createAdminRes = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Admin phụ",
        username: "adminphu",
        password: "password123",
        role: "ADMIN",
      });

    expect(createAdminRes.status).toBe(403);

    const updateAdminRes = await request(app)
      .patch(`/api/admin/users/${adminId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Admin bị sửa" });

    expect(updateAdminRes.status).toBe(403);

    const revokeAdminRes = await request(app)
      .patch(`/api/admin/users/${adminId}/revoke`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(revokeAdminRes.status).toBe(403);

    const updateFarmerRes = await request(app)
      .patch(`/api/admin/users/${farmerId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Nông dân đã chỉnh sửa" });

    expect(updateFarmerRes.status).toBe(200);
    expect(updateFarmerRes.body.name).toBe("Nông dân đã chỉnh sửa");
  });

  it("only lets an admin list, update, and revoke farmers they created", async () => {
    const listRes = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.map((item: any) => item._id || item.id)).toContain(
      farmerId,
    );
    expect(listRes.body.map((item: any) => item._id || item.id)).not.toContain(
      otherFarmerId,
    );

    const otherListRes = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${otherAdminToken}`);

    expect(otherListRes.status).toBe(200);
    expect(otherListRes.body.map((item: any) => item._id || item.id)).toEqual([
      otherFarmerId,
    ]);

    const updateOtherFarmerRes = await request(app)
      .patch(`/api/admin/users/${otherFarmerId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Không được sửa" });

    expect(updateOtherFarmerRes.status).toBe(403);

    const revokeOtherFarmerRes = await request(app)
      .patch(`/api/admin/users/${otherFarmerId}/revoke`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(revokeOtherFarmerRes.status).toBe(403);
  });

  it("Farmer uploads capture session using creator Admin Google Drive credentials", async () => {
    await UserModel.findByIdAndUpdate(farmerId, {
      $set: {
        "googleTokens.refreshToken": "must_not_be_used_farmer_refresh_token",
        "googleTokens.email": "farmer.gdrive@farm.vn",
        "googleTokens.isLinked": true,
      },
    });

    const sessionRes = await request(app)
      .post("/api/sessions")
      .set("Authorization", `Bearer ${farmerToken}`)
      .send({
        images: ["https://example.com/leaf_photo.jpg"],
        plotId: "L-002",
        cropType: "Dưa leo",
        growthStage: "fruiting",
        envMode: "outdoor",
        stationMeasurements: {
          temperature: 30.0,
          lightUvIndex: 75,
          windSpeed: 14.0,
          co2Level: 410,
          weatherCode: 3,
        },
        localMeasurements: {
          temperature: 28,
          humidity: 72,
        },
        symptomDescription: "Đốm lá phấn trắng",
        severity: "Nhẹ",
      });

    expect(sessionRes.status).toBe(201);
    expect(sessionRes.body.session.driveFiles).toBeDefined();
    expect(sessionRes.body.session.driveFiles.length).toBe(1);
    expect(sessionRes.body.post).toBeUndefined();
    expect(sessionRes.body.session.driveFiles[0].fileId).toContain("DRIVE");
    expect(sessionRes.body.session.driveFiles[0].folderPath).toBe(
      "farmdata/Fruiting/Mild/Images",
    );
    expect(sessionRes.body.session.driveFiles[0].description).toContain(
      "Mã số luống: L-002",
    );
    expect(sessionRes.body.session.driveFiles[0].description).toContain(
      "Mã thời tiết: 3",
    );
    expect(sessionRes.body.session.driveFiles[0].description).toContain(
      "Độ ẩm nhập tay: 72%",
    );
    expect(sessionRes.body.session.images[0]).toContain("drive.google.com");
  });

  it("Admin revokes farmer account and blocks login plus existing JWT", async () => {
    const revokeRes = await request(app)
      .patch(`/api/admin/users/${farmerId}/revoke`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(revokeRes.status).toBe(200);
    expect(revokeRes.body.isRevoked).toBe(true);

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "cuongbui", password: "password123" });

    expect(loginRes.status).toBe(403);

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${farmerToken}`);

    expect(meRes.status).toBe(403);
    expect(meRes.body.error).toContain("Account revoked");
  });
});
