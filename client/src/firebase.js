import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDNSyudzmyvZEM5pX_flkFsDBKblFX9lsM",
  authDomain: "rentmate-28451.firebaseapp.com",
  projectId: "rentmate-28451",
  storageBucket: "rentmate-28451.firebasestorage.app",
  messagingSenderId: "1008810058563",
  appId: "1:1008810058563:web:79f4778f1b6b9cd92105f6",
  measurementId: "G-3QHNJLB1FC"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export default app;
