import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Firebase configuration using Vite environment variables with safe development defaults
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key-for-hackathon-12345",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "apex-city-community-hero.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "apex-city-community-hero",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "apex-city-community-hero.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Enable connecting to local Firebase Auth Emulator if configured
if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  const host = import.meta.env.VITE_FIREBASE_EMULATOR_HOST || 'http://localhost:9099';
  connectAuthEmulator(auth, host);
  console.log(`🔌 Firebase Auth connected to local emulator at ${host}`);
}

export { app, auth };
