// // src/firebase.js

// import { initializeApp } from "firebase/app";

// // Auth
// import { getAuth, GoogleAuthProvider } from "firebase/auth";

// // Firestore (structured, queryable)
// import { getFirestore } from "firebase/firestore";

// // Realtime Database (ultra‑low‑latency streams)
// import { getDatabase } from "firebase/database";

// // Storage (file uploads/downloads)
// import { getStorage } from "firebase/storage";

// // Messaging (push notifications)
// import { getMessaging } from "firebase/messaging";

// // 1️⃣ Your Firebase web app configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyCpMkpU9YeB3HNpzk0_fwswSf9TQwb_Xdg",
//   authDomain: "hospitalmanagtsystem.firebaseapp.com",
//   projectId: "hospitalmanagtsystem",
//   storageBucket: "hospitalmanagtsystem.appspot.com",
//   messagingSenderId: "771158568788",
//   appId: "1:771158568788:web:e47f16ea2577fa1e8762c1",
//   databaseURL:
//     "https://hospitalmanagtsystem-default-rtdb.europe-west1.firebasedatabase.app",
// };

// // 2️⃣ Initialize the Firebase App
// const app = initializeApp(firebaseConfig);

// // 3️⃣ Auth & Providers
// export const auth = getAuth(app);
// export const googleProvider = new GoogleAuthProvider();

// // 4️⃣ Firestore
// export const firestoreDB = getFirestore(app);

// // 5️⃣ Realtime Database
// export const realtimeDB = getDatabase(app);

// // 6️⃣ Storage
// export const storage = getStorage(app);

// // 7️⃣ Messaging
// export const messaging = getMessaging(app);

// Now you can import any of these in your code:
// import { auth, firestoreDB, realtimeDB, storage, messaging } from './firebase';
// src/firebase.js

import { initializeApp } from "firebase/app";

// Auth
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Firestore (structured, queryable)
import { getFirestore } from "firebase/firestore";

// Realtime Database (ultra‑low‑latency streams)
import { getDatabase } from "firebase/database";

// Storage (file uploads/downloads)
import { getStorage } from "firebase/storage";

// Messaging (push notifications)
import { getMessaging } from "firebase/messaging";

// 1️⃣ Your Firebase web app configuration
const firebaseConfig = {
  apiKey: "AIzaSyCpMkpU9YeB3HNpzk0_fwswSf9TQwb_Xdg",
  authDomain: "hospitalmanagtsystem.firebaseapp.com",
  projectId: "hospitalmanagtsystem",
  storageBucket: "hospitalmanagtsystem.appspot.com",
  messagingSenderId: "771158568788",
  appId: "1:771158568788:web:e47f16ea2577fa1e8762c1",
  databaseURL:
    "https://hospitalmanagtsystem-default-rtdb.europe-west1.firebasedatabase.app",
};

// 2️⃣ Initialize the Firebase App
const app = initializeApp(firebaseConfig);

// 3️⃣ Auth & Providers
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// 4️⃣ Firestore
export const firestoreDB = getFirestore(app);

// 5️⃣ Realtime Database
export const realtimeDB = getDatabase(app);

// 6️⃣ Storage
export const storage = getStorage(app);

// 7️⃣ Messaging
export const messaging = getMessaging(app);
// Import whichever services you need from your central firebase.js
import {
  auth,
  googleProvider,
  firestoreDB,
  realtimeDB,
  storage,
  messaging
} from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

async function loadUserProfile(uid) {
  const ref = doc(firestoreDB, 'users', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

async function saveUserProfile(uid, data) {
  await setDoc(doc(firestoreDB, 'users', uid), data, { merge: true });
}
import { ref, onValue, set } from 'firebase/database';

// Listen to updates
onValue(ref(realtimeDB, `patients/${uid}`), snap => {
  console.log('Realtime patient data:', snap.val());
});

// Save
function savePatient(uid, profile) {
  return set(ref(realtimeDB, `patients/${uid}`), profile);
}
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

async function uploadProfilePic(uid, file) {
  const picRef = storageRef(storage, `profiles/${uid}/avatar.jpg`);
  await uploadBytes(picRef, file);
  return getDownloadURL(picRef);
}

// Now you can import any of these in your code:
// import { auth, firestoreDB, realtimeDB, storage, messaging } from './firebase';
