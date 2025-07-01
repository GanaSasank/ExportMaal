// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDm74C2phzefPOAJlp_H2dwcUad6mXpNLw",
  authDomain: "export-maal.firebaseapp.com",
  projectId: "export-maal",
  storageBucket: "export-maal.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app,auth };
