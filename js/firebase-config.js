import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCPsgkDAGLWzYGzM2NXOPgMD1pYR8C3Ug8",
  authDomain: "dagicreative-graphics.firebaseapp.com",
  projectId: "dagicreative-graphics",
  storageBucket: "dagicreative-graphics.firebasestorage.app",
  messagingSenderId: "1046603799963",
  appId: "1:1046603799963:web:a39c0441c95a35e03e153e",
  measurementId: "G-WXPQTXZ81P"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
