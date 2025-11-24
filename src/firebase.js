
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyApLvygWd0BhsoCNEdVY8KZ9Jv-zudlGzk",
  authDomain: "health-application-600a5.firebaseapp.com",
  projectId: "health-application-600a5",
  storageBucket: "health-application-600a5.appspot.com",
  messagingSenderId: "122384246739",
  appId: "1:122384246739:web:2aa90ffc98f6bbd5c5f126"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);