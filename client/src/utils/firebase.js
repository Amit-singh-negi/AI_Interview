
import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth"
const firebaseConfig = {
  apiKey:import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "interviewai-25f98.firebaseapp.com",
  projectId: "interviewai-25f98",
  storageBucket: "interviewai-25f98.firebasestorage.app",
  messagingSenderId: "506032534104",
  appId: "1:506032534104:web:89cf4e817b329c921e902d"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app)

const provider = new GoogleAuthProvider()
export {auth,provider}