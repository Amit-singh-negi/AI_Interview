


import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth"

const firebaseConfig = {
  apiKey:import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "aiinterview-cb7b4.firebaseapp.com",
  projectId: "aiinterview-cb7b4",
  storageBucket: "aiinterview-cb7b4.firebasestorage.app",
  messagingSenderId: "590362461867",
  appId: "1:590362461867:web:448baeece209ac8d8059ee"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app)

const provider = new GoogleAuthProvider()
export {auth,provider}