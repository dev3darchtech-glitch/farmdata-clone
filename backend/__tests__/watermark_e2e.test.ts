import crypto from "crypto";
import fs from "fs";
import path from "path";

import { google } from "googleapis";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import sharp from "sharp";

import { connectMongoDB } from "../src/db/connect";
import { app } from "../src/index";
import { UserModel } from "../src/models/User";

jest.setTimeout(120000);

const runDriveE2E = process.env.RUN_DRIVE_E2E === "true";
const describeDriveE2E = runDriveE2E ? describe : describe.skip;

describeDriveE2E("Frontend to Drive watermark E2E", () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    if (!process.env.GOOGLE_REFRESH_TOKEN) {
      throw new Error("GOOGLE_REFRESH_TOKEN is required for this E2E test");
    }

    mongoServer = await MongoMemoryServer.create();
    await connectMongoDB(mongoServer.getUri());

    await UserModel.findOneAndUpdate(
      { username: "admin" },
      {
        $set: {
          googleTokens: {
            refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
            email: process.env.GOOGLE_DRIVE_EMAIL,
            isLinked: true,
          },
        },
      },
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer?.stop();
  });

  it("selects a frontend image, creates a session, uploads watermark, and downloads it", async () => {
    const imagePath = path.resolve(
      process.env.E2E_IMAGE_PATH || path.join(__dirname, "../../tree.jpg"),
    );
    if (!fs.existsSync(imagePath)) {
      throw new Error(`E2E image does not exist: ${imagePath}`);
    }

    const sourceBuffer = fs.readFileSync(imagePath);
    const sourceMetadata = await sharp(sourceBuffer).metadata();
    const sourceMimeType =
      sourceMetadata.format === "webp" ? "image/webp" : "image/jpeg";
    const frontendImage = `data:${sourceMimeType};base64,${sourceBuffer.toString("base64")}`;

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: "an.nguyen@farm.vn", password: "123456" });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.token).toBeDefined();

    const sessionResponse = await request(app)
      .post("/api/sessions")
      .set("Authorization", `Bearer ${loginResponse.body.token}`)
      .send({
        images: [frontendImage],
        plotId: "L-001",
        cropType: "Cà chua",
        growthStage: "flowering",
        envMode: "outdoor",
        captureLocation: {
          latitude: 11.94041,
          longitude: 108.45831,
          city: "Da Lat",
          region: "Lam Dong",
          country: "Viet Nam",
        },
        stationMeasurements: {
          temperature: 24,
          lightUvIndex: 50,
          windSpeed: 10,
          co2Level: 400,
          weatherCode: 1,
        },
        symptomDescription: "Lá xuất hiện đốm vàng rải rác",
        severity: "Chớm bệnh",
      });

    expect(sessionResponse.status).toBe(201);
    const driveFile = sessionResponse.body.session.driveFiles?.[0];
    expect(driveFile?.fileId).toBeDefined();
    expect(driveFile?.watermarkFileId).toBeDefined();
    expect(driveFile?.watermarkWebContentLink).toBeDefined();

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );
    auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    const drive = google.drive({ version: "v3", auth });

    const downloadResponse = await drive.files.get(
      { fileId: driveFile.watermarkFileId, alt: "media" },
      { responseType: "arraybuffer" },
    );
    const downloaded = Buffer.from(
      downloadResponse.data as unknown as ArrayBuffer,
    );
    const metadata = await sharp(downloaded).metadata();
    const sourceHash = crypto
      .createHash("sha256")
      .update(sourceBuffer)
      .digest("hex");
    const watermarkHash = crypto
      .createHash("sha256")
      .update(downloaded)
      .digest("hex");

    expect(metadata.format).toBe(sourceMetadata.format === "webp" ? "webp" : "jpeg");
    expect(metadata.width).toBe(sourceMetadata.width);
    expect(metadata.height).toBe(sourceMetadata.height);
    expect(downloaded.length).toBeGreaterThan(0);
    expect(watermarkHash).not.toBe(sourceHash);

    console.log("[watermark-e2e] verified", {
      sessionId: sessionResponse.body.session.sessionId,
      originalFileId: driveFile.fileId,
      watermarkFileId: driveFile.watermarkFileId,
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      bytes: downloaded.length,
      watermarkWebViewLink: driveFile.watermarkWebViewLink,
    });
  });
});
