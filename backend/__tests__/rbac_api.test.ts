import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { connectMongoDB } from "../src/db/connect";
import { app } from "../src/index";
import { UserModel } from "../src/models/User";
import {
  createAdminFixture,
  createFarmerFixture,
} from "./helpers/userFixtures";

jest.setTimeout(30000);

describe("FarmData Backend API & RBAC Suite", () => {
  let mongoServer: MongoMemoryServer;
  let farmerToken: string;
  let farmerRefreshToken: string;
  let adminToken: string;
  let adminEmail: string;
  let adminPassword: string;
  let farmerEmail: string;

  let testFarmId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await connectMongoDB(uri);

    // Create a mock farm first for all plot creation tests
    const Farm = mongoose.model("Farm");
    const testFarm = await Farm.create({
      name: "Trại Thực Nghiệm",
      isActive: true,
    });
    testFarmId = testFarm._id.toString();

    // Seed initial plots to pass plotsRes.body.length > 0
    const Plot = mongoose.model("Plot");
    await Plot.create([
      {
        code: "L-001",
        name: "Luống 01",
        envMode: "outdoor",
        farmId: testFarmId,
        isActive: true,
      },
      {
        code: "L-002",
        name: "Luống 02",
        envMode: "outdoor",
        farmId: testFarmId,
        isActive: true,
      },
      {
        code: "L-003",
        name: "Luống 03",
        envMode: "outdoor",
        farmId: testFarmId,
        isActive: true,
      },
    ]);

    // Seed initial crops to pass cropsRes.body.length > 0
    const Crop = mongoose.model("Crop");
    await Crop.create({
      name: "Cà chua",
      category: "Master Data",
      isActive: true,
    });

    const adminFixture = await createAdminFixture({
      name: "Admin RBAC",
      email: "admin.rbac@farm.vn",
      username: "adminrbac",
    });
    adminEmail = adminFixture.email;
    adminPassword = adminFixture.password;

    const farmerFixture = await createFarmerFixture({
      adminId: adminFixture.admin._id.toString(),
      name: "Farmer RBAC",
      email: "farmer.rbac@farm.vn",
      username: "farmerrbac",
      password: "123456",
    });
    farmerEmail = farmerFixture.email;

    // Authenticate as Farmer
    const farmerRes = await request(app)
      .post("/api/auth/login")
      .send({ email: farmerEmail, password: farmerFixture.password });
    expect(farmerRes.status).toBe(200);
    expect(farmerRes.body.token).toBeDefined();
    expect(farmerRes.body.refreshToken).toBeDefined();
    farmerToken = farmerRes.body.token;
    farmerRefreshToken = farmerRes.body.refreshToken;

    // Authenticate as Admin
    const adminRes = await request(app)
      .post("/api/auth/login")
      .send({ email: adminEmail, password: adminPassword });
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
        .send({ email: farmerEmail, password: "wrongpassword" });
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
      expect(res.body.error).toContain("Không có quyền truy cập");
    });

    it("allows ADMIN to access ADMIN endpoints (201 Created)", async () => {
      const res = await request(app)
        .post("/api/admin/plots")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          code: "L-009",
          name: "Luống 09 - Admin Managed",
          envMode: "greenhouse",
          farmId: testFarmId,
        });

      console.log(">>> createPlot response:", res.status, res.body);
      expect(res.status).toBe(201);
      expect(res.body.code).toBe("L-009");
    });

    it("seeds isolated master data for each newly registered admin", async () => {
      const firstAdminCreateRes = await request(app)
        .post("/api/admin/plots")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          code: "L-019",
          name: "Luống 19 - Admin 1",
          envMode: "greenhouse",
          farmId: testFarmId,
        });
      expect(firstAdminCreateRes.status).toBe(201);

      const secondAdminEmail = `admin.${Date.now()}@farm.vn`;
      await createAdminFixture({
        name: "Admin Seed Isolation",
        email: secondAdminEmail,
        username: `adminseed${Date.now()}`,
        password: "123456",
      });

      const secondAdminLoginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: secondAdminEmail, password: "123456" });
      expect(secondAdminLoginRes.status).toBe(200);
      const secondAdminToken = secondAdminLoginRes.body.token;

      const secondAdminPlotsRes = await request(app)
        .get("/api/master-data/plots")
        .set("Authorization", `Bearer ${secondAdminToken}`);
      expect(secondAdminPlotsRes.status).toBe(200);
      expect(secondAdminPlotsRes.body.map((item: any) => item.code)).toEqual(
        expect.arrayContaining(["L-001", "L-002", "L-003"]),
      );
      expect(secondAdminPlotsRes.body.map((item: any) => item.code)).toContain(
        "L-019",
      );

      const secondAdminCreateRes = await request(app)
        .post("/api/admin/plots")
        .set("Authorization", `Bearer ${secondAdminToken}`)
        .send({
          code: "L-777",
          name: "Luống 777 - Admin 2",
          envMode: "greenhouse",
          farmId: testFarmId,
        });
      expect(secondAdminCreateRes.status).toBe(201);

      const firstFarmerPlotsRes = await request(app)
        .get("/api/master-data/plots")
        .set("Authorization", `Bearer ${farmerToken}`);
      expect(firstFarmerPlotsRes.status).toBe(200);
      expect(firstFarmerPlotsRes.body.map((item: any) => item.code)).toContain(
        "L-019",
      );
      expect(firstFarmerPlotsRes.body.map((item: any) => item.code)).toContain(
        "L-777",
      );
    });

    it("toggles plot and crop active status through boolean deactivate endpoint bodies", async () => {
      const plotRes = await request(app)
        .post("/api/admin/plots")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          code: "L-010",
          name: "Luống 10 - Toggle Test",
          envMode: "greenhouse",
          farmId: testFarmId,
        });
      expect(plotRes.status).toBe(201);
      const plotId = plotRes.body._id || plotRes.body.id;

      const inactivePlotRes = await request(app)
        .patch(`/api/admin/plots/${plotId}/deactivate`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ isActive: false });
      expect(inactivePlotRes.status).toBe(200);
      expect(inactivePlotRes.body.isActive).toBe(false);

      const activePlotRes = await request(app)
        .patch(`/api/admin/plots/${plotId}/deactivate`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ isActive: true });
      expect(activePlotRes.status).toBe(200);
      expect(activePlotRes.body.isActive).toBe(true);

      const cropRes = await request(app)
        .post("/api/admin/crops")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Dưa lưới toggle", category: "Master Data" });
      expect(cropRes.status).toBe(201);
      const cropId = cropRes.body._id || cropRes.body.id;

      const inactiveCropRes = await request(app)
        .patch(`/api/admin/crops/${cropId}/deactivate`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ isActive: false });
      expect(inactiveCropRes.status).toBe(200);
      expect(inactiveCropRes.body.isActive).toBe(false);

      const activeCropRes = await request(app)
        .patch(`/api/admin/crops/${cropId}/deactivate`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ isActive: true });
      expect(activeCropRes.status).toBe(200);
      expect(activeCropRes.body.isActive).toBe(true);

      const invalidRes = await request(app)
        .patch(`/api/admin/crops/${cropId}/deactivate`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});
      expect(invalidRes.status).toBe(400);
      expect(invalidRes.body.error).toContain("isActive");
    });

    it("allows ADMIN to lock and unlock a farmer account they created", async () => {
      const username = `farmerlock${Date.now()}`;
      const createRes = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Farmer Lock Test",
          username,
          password: "123456",
          role: "FARMER",
        });
      expect(createRes.status).toBe(201);
      const userId = createRes.body._id || createRes.body.id;

      const revokeRes = await request(app)
        .patch(`/api/admin/users/${userId}/revoke`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(revokeRes.status).toBe(200);
      expect(revokeRes.body.isRevoked).toBe(true);
      expect(revokeRes.body.revokedAt).toBeDefined();

      const restoreRes = await request(app)
        .patch(`/api/admin/users/${userId}/restore`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(restoreRes.status).toBe(200);
      expect(restoreRes.body.isRevoked).toBe(false);
      expect(restoreRes.body.revokedAt).toBeUndefined();
    });

    it("lets an admin-created FARMER log in and upload capture images", async () => {
      const username = `farmerupload${Date.now()}`;
      const password = "123456";
      const createRes = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Farmer Upload Test",
          username,
          password,
          role: "FARMER",
        });
      expect(createRes.status).toBe(201);

      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: username, password });
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.token).toBeDefined();

      const diseaseName = `Sương mai ${Date.now()}`;
      const diseaseRes = await request(app)
        .post("/api/admin/plant-diseases")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          group: "Truyền nhiễm",
          type: "Nấm",
          name: diseaseName,
          description: "Bệnh test cho farmer upload",
        });
      expect(diseaseRes.status).toBe(201);

      const otherGroupDiseaseRes = await request(app)
        .post("/api/admin/plant-diseases")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          group: "Không truyền nhiễm",
          type: "Nấm",
          name: diseaseName,
          description: "Bệnh test group khác",
        });
      expect(otherGroupDiseaseRes.status).toBe(201);

      const [farmsRes, plotsRes, cropsRes, diseasesRes] = await Promise.all([
        request(app)
          .get("/api/master-data/farms")
          .set("Authorization", `Bearer ${loginRes.body.token}`),
        request(app)
          .get("/api/master-data/plots")
          .set("Authorization", `Bearer ${loginRes.body.token}`),
        request(app)
          .get("/api/master-data/crops")
          .set("Authorization", `Bearer ${loginRes.body.token}`),
        request(app)
          .get("/api/master-data/plant-diseases")
          .set("Authorization", `Bearer ${loginRes.body.token}`),
      ]);
      expect(farmsRes.status).toBe(200);
      expect(plotsRes.status).toBe(200);
      expect(cropsRes.status).toBe(200);
      expect(diseasesRes.status).toBe(200);
      expect(farmsRes.body.map((item: any) => item.name)).toContain(
        "Trại Thực Nghiệm",
      );
      expect(plotsRes.body.map((item: any) => item.code)).toContain("L-001");
      expect(cropsRes.body.map((item: any) => item.name)).toContain("Cà chua");
      expect(diseasesRes.body.map((item: any) => item.name)).toContain(
        diseaseName,
      );

      const onePixelPng =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const sessionRes = await request(app)
        .post("/api/sessions")
        .set("Authorization", `Bearer ${loginRes.body.token}`)
        .send({
          images: [onePixelPng],
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
          diseaseGroup: "Truyền nhiễm",
          diseaseType: "Nấm",
          diseaseName,
          diseasedPart: "Lá",
          symptomDescription: "Lá xuất hiện đốm vàng rải rác",
          severity: "Chớm bệnh",
        });

      expect(sessionRes.status).toBe(201);
      expect(sessionRes.body.session.farmerEmail).toBe(
        `${username}@farmdata.com`,
      );
      expect(sessionRes.body.session.files).toHaveLength(1);
      expect(sessionRes.body.session.files[0].fileId).toMatch(/^captures\//);
      expect(sessionRes.body.session.files[0].webContentLink).toContain(
        "firebasestorage.googleapis.com",
      );
    });

    it("links an existing Mongo user by email when Firebase UID changed", async () => {
      const stamp = Date.now();
      const email = `ngocntk${stamp}@farmdata.com`;
      const farmer = await UserModel.create({
        name: "Ngoc Farmer",
        email,
        username: email.split("@")[0],
        role: "FARMER",
        isRevoked: false,
      });

      const firebaseUid = `firebase-uid-ngocntk${stamp}`;
      const res = await request(app)
        .get("/api/master-data/plots")
        .set("Authorization", `Bearer ${firebaseUid}`);

      expect(res.status).toBe(200);
      expect(res.body.map((item: any) => item.code)).toContain("L-001");

      const updatedFarmer = await UserModel.findById(farmer._id);
      expect(updatedFarmer?.firebaseUid).toBe(firebaseUid);
    });

    it("syncs changed Firebase UID into Mongo immediately during login", async () => {
      const username = `farmersync${Date.now()}`;
      const email = `${username}@farmdata.com`;
      const farmer = await UserModel.create({
        name: "Farmer Sync Test",
        email,
        username,
        role: "FARMER",
        firebaseUid: "old-firebase-uid",
        isRevoked: false,
      });

      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: username, password: "123456" });

      expect(loginRes.status).toBe(200);
      const updatedFarmer = await UserModel.findById(farmer._id);
      expect(updatedFarmer?.firebaseUid).toBe(loginRes.body.token);
      expect(updatedFarmer?.firebaseUid).not.toBe("old-firebase-uid");
    });
  });

  describe.skip("3. Capture Session and Admin Post Publishing Workflow", () => {
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
      expect(res.body.session.files[0].description).toContain(
        "Metadata phiên chụp",
      );
      expect(res.body.session.files[0].description).toContain(
        "Mã số luống: L-001",
      );
      expect(res.body.session.files[0].description).toContain(
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
      expect(res.body.files[0].folderPath).toBe("farmdata/posts/images");
      expect(res.body.files[0].description).toContain("Mã số luống: L-001");
      expect(res.body.stationMeasurements.weatherCode).toBe(63);
    });

    it("shows farmer-created capture sessions in the posts feed and detail API", async () => {
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

      const postDetailRes = await request(app)
        .get(`/api/posts/${res.body.session.sessionId}`)
        .set("Authorization", `Bearer ${farmerToken}`);

      expect(postDetailRes.status).toBe(200);
      expect(postDetailRes.body.postId).toBe(res.body.session.sessionId);
      expect(postDetailRes.body.user.role).toBe("FARMER");

      const farmerFeedRes = await request(app)
        .get("/api/posts")
        .query({ mine: "true" })
        .set("Authorization", `Bearer ${farmerToken}`);

      expect(farmerFeedRes.status).toBe(200);
      expect(Array.isArray(farmerFeedRes.body.items)).toBe(true);
      expect(
        farmerFeedRes.body.items.some(
          (post: any) => post.postId === res.body.session.sessionId,
        ),
      ).toBe(true);
    });
  });

  describe.skip("4. Post Feed API", () => {
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
          [post.cropType, post.plotId, post.symptomDescription, post.user?.name]
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
