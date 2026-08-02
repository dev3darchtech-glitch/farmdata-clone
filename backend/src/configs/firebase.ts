import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import fs from "fs";
import path from "path";

const serviceAccountPath = path.join(
  __dirname,
  "../../firebase-service-account.json",
);

const googleServicesPath = path.join(__dirname, "../../google-services.json");

let app;

if (getApps().length === 0) {
  let credential;

  // 1. Read credential from firebase-service-account.json directly at root
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(
      fs.readFileSync(serviceAccountPath, "utf8"),
    );
    credential = cert(serviceAccount);
    console.log("🔥 Firebase Admin initialized with service account file.");
  } else {
    throw new Error(
      `Critical: Firebase service account file not found at ${serviceAccountPath}`,
    );
  }

  // 2. Read projectId and storageBucket from google-services.json directly at root
  let projectId = "farmdata-e22c6";
  let storageBucket = "farmdata-e22c6.firebasestorage.app";

  if (fs.existsSync(googleServicesPath)) {
    try {
      const googleServices = JSON.parse(
        fs.readFileSync(googleServicesPath, "utf8"),
      );
      if (googleServices.project_info?.project_id) {
        projectId = googleServices.project_info.project_id;
      }
      if (googleServices.project_info?.storage_bucket) {
        storageBucket = googleServices.project_info.storage_bucket;
      }
      console.log(
        `Configured Firebase app using google-services.json: project=${projectId}, bucket=${storageBucket}`,
      );
    } catch (e: any) {
      console.warn(
        "⚠️ Failed to parse google-services.json, falling back to default config",
        e?.message,
      );
    }
  } else {
    console.warn(
      "⚠️ google-services.json not found, using fallback configuration",
    );
  }

  app = initializeApp({
    credential,
    projectId,
    storageBucket,
  });
} else {
  app = getApps()[0];
}

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;
