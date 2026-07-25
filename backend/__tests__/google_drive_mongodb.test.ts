import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";

import { connectMongoDB } from "../src/db/connect";
import { app } from "../src/index";
import { UserModel } from "../src/models/User";

jest.setTimeout(30000);

describe("MongoDB & Admin Google Drive Integration Suite", () => {
  let mongoServer: MongoMemoryServer;
  let adminToken: string;
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

    // Admin creates a normal Farmer user
    const createFarmerRes = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Nông dân Bùi Văn Cường",
        email: "cuong.bui@farm.vn",
        password: "password123",
        role: "FARMER",
      });

    expect(createFarmerRes.status).toBe(201);
    expect(createFarmerRes.body.createdByAdminId).toBeDefined();
    farmerId = createFarmerRes.body._id;

    // Login newly created Farmer
    const farmerRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "cuong.bui@farm.vn", password: "password123" });
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

  it("Farmer uploads capture session using creator Admin Google Drive credentials", async () => {
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
        },
        symptomDescription: "Đốm lá phấn trắng",
        severity: "Nhẹ",
      });

    expect(sessionRes.status).toBe(201);
    expect(sessionRes.body.session.driveFiles).toBeDefined();
    expect(sessionRes.body.session.driveFiles.length).toBe(1);
    expect(sessionRes.body.post.driveFiles).toBeDefined();
    expect(sessionRes.body.post.driveFiles[0].fileId).toContain("DRIVE");
  });
});
