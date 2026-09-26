import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Configuration parameters loaded from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyBFSHAHrgk4gcx9wlOYiwJg8RI_-0lB-QA",
  authDomain: "gen-lang-client-0526890470.firebaseapp.com",
  projectId: "gen-lang-client-0526890470",
  storageBucket: "gen-lang-client-0526890470.firebasestorage.app",
  messagingSenderId: "511010566451",
  appId: "1:511010566451:web:95237ff333b787ca998e46"
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Exports
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-bizpilotai-273cd82a-b107-4aed-a4df-b42f9a60963b");
export const isFirebaseConfigured = true;

// Validate Connection to Firestore per skill guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
