import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCHUjYREU9JhLVFy01jT6WWp9XrJBUNl-k",
  authDomain: "farmdata-e22c6.firebaseapp.com",
  projectId: "farmdata-e22c6",
  storageBucket: "farmdata-e22c6.firebasestorage.app",
  messagingSenderId: "22839448152",
  appId: "1:22839448152:android:d66f9ddd1e25cc3c15702d",
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Export services
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;
