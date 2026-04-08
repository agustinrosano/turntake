import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBhwpvqadmhLhfmkXJ_5XoZs7IOWjvfBrs",
  authDomain: "taketurn-246cd.firebaseapp.com",
  projectId: "taketurn-246cd",
  storageBucket: "taketurn-246cd.firebasestorage.app",
  messagingSenderId: "578264292908",
  appId: "1:578264292908:web:fbe7003326a879c5cd7b89"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export instances
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
