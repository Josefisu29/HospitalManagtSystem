// script.js
import { auth } from ".firebase-configue.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// Sign Up
const signupForm = document.getElementById("signup-form");
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = signupForm["signup-email"].value;
  const pass = signupForm["signup-password"].value;
  const confirm = signupForm["signup-confirm"].value;
  if (pass !== confirm) {
    document.getElementById("signup-error").textContent =
      "Passwords must match.";
    document.getElementById("signup-error").style.display = "block";
    return;
  }
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      pass
    );
    console.log("Signed up:", userCredential.user);
    overlay.style.display = "none";
  } catch (error) {
    document.getElementById("signup-error").textContent = error.message;
    document.getElementById("signup-error").style.display = "block";
  }
});

// Login
const loginForm = document.getElementById("login-form");
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = loginForm["login-email"].value;
  const pass = loginForm["login-password"].value;
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    console.log("Signed in:", userCredential.user);
    overlay.style.display = "none";
  } catch (error) {
    document.getElementById("login-error").style.display = "block";
  }
});

// Auth State Observer
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User is signed in:", user.email);
    // Redirect or update UI as needed
  } else {
    console.log("No user signed in");
  }
});

import {
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

const googleBtn = document.getElementById("btn-google");
const provider = new GoogleAuthProvider();

googleBtn.addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    console.log("Google sign in:", result.user);
    overlay.style.display = "none";
    window.location.href = "/patient.html";
  } catch (error) {
    console.error("Google sign-in error:", error);
    alert("Sign-in failed: " + error.message);
  }
});

// Sign-Up
createUserWithEmailAndPassword(auth, email, pass)
  .then((userCredential) => {
    // … store data here …
    // then redirect:
    window.location.href = "patient/reg.html";
  })
  .catch((error) => {
    /* show error */
  });

// Login
signInWithEmailAndPassword(auth, email, pass)
  .then((userCredential) => {
    window.location.href = "patient/reg.html";
  })
  .catch((error) => {
    /* show error */
  });
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCpMkpU9YeB3HNpzk0_fwswSf9TQwb_Xdg",
  authDomain: "hospitalmanagtsystem.firebaseapp.com",
  projectId: "hospitalmanagtsystem",
  storageBucket: "hospitalmanagtsystem.firebasestorage.app",
  messagingSenderId: "771158568788",
  appId: "1:771158568788:web:e47f16ea2577fa1e8762c1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Utility function to get the current user's role
export async function getUserRole() {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdTokenResult();
    return token.claims.role || null;
  }
  return null;
}

// Database operation: Create a help request
export async function createHelpRequest(latitude, longitude) {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  if ((await getUserRole()) !== "patient")
    throw new Error("Only patients can create help requests");
  await addDoc(collection(db, "helpRequests"), {
    patientId: user.uid,
    latitude,
    longitude,
    timestamp: serverTimestamp(),
  });
}

// Database operation: Update user profile
export async function updateUserProfile(data) {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  const userRef = doc(db, "users", user.uid);
  await updateDoc(userRef, data);
}

// Authentication utility: Sign out
export async function signOutUser() {
  await signOut(auth);
}

// Authentication utility: Set up auth state listener
export function setupAuthListener(callback) {
  onAuthStateChanged(auth, callback);
}

// Real-time listener for help requests (for responders)
export function listenToHelpRequests(callback) {
  return onSnapshot(collection(db, "helpRequests"), callback);
}

// UI utility functions (placeholders, implement as needed)
export function showLoading() {
  const loading = document.getElementById("loading");
  if (loading) loading.style.display = "flex";
}

export function hideLoading() {
  const loading = document.getElementById("loading");
  if (loading) loading.style.display = "none";
}

export function showError(message) {
  alert(`Error: ${message}`);
}

export function showSuccess(message) {
  alert(`Success: ${message}`);
}
