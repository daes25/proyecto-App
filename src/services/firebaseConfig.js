// firebaseConfig.js
import { initializeApp, } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBI_asMjhjfpLW3HAoxQY4tGhnXFoOEP04",
  authDomain: "safetweet-a0677.firebaseapp.com",
  projectId: "safetweet-a0677",
  storageBucket: "safetweet-a0677.firebasestorage.app",
  messagingSenderId: "885160066919",
  appId: "1:885160066919:web:6a30d59540158d1f99b9c2",
  measurementId: "G-2952ZCKK5J"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
