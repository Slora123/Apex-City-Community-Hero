import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const app = initializeApp({
  apiKey: "demo-api-key-for-hackathon-12345",
  authDomain: "test.firebaseapp.com",
  projectId: "test",
});
const auth = getAuth(app);
signInWithEmailAndPassword(auth, "test@test.com", "password").catch(e => console.log("ERROR:", e.message));
