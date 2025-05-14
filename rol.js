import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import {
  getDatabase,
  ref as rdbRef,
  onValue,
  set as rdbSet,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import {
  showLoading,
  hideLoading,
  showError,
  showSuccess,
} from "./js/common.js";

// ————————————————————————————————————————————
// 1. Init Firebase
// ————————————————————————————————————————————
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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

// ————————————————————————————————————————————
// 2. Utility: Generate Unique Patient ID
// ————————————————————————————————————————————
function generateRandomId(len = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: len }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
}
function generatePatientId() {
  return `PAT-${generateRandomId()}`;
}

// ————————————————————————————————————————————
// 3. Form Helpers: Draft Saving & Hydration
// ————————————————————————————————————————————
const DRAFT_KEY = "patientProfileDraft";
const formEl = document.getElementById("profileForm");

// Hydrate on load
window.addEventListener("DOMContentLoaded", () => {
  const draft = localStorage.getItem(DRAFT_KEY);
  if (draft) {
    const data = JSON.parse(draft);
    Object.entries(data).forEach(([k, v]) => {
      const inp = formEl.querySelector(`#${k}`);
      if (inp) inp.value = v;
    });
  }
});

// Auto‑save on input
formEl.addEventListener("input", () => {
  const data = {};
  formEl.querySelectorAll("input, textarea, select").forEach((inp) => {
    if (inp.id) data[inp.id] = inp.value;
  });
  localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
});

// ————————————————————————————————————————————
// 4. Populate Form
// ————————————————————————————————————————————
function populateForm(userData) {
  document.getElementById("greeting").textContent =
    (new Date().getHours() < 12
      ? "Good Morning"
      : new Date().getHours() < 18
      ? "Good Afternoon"
      : "Good Evening") + `, ${userData.firstName || "User"}`;
  [
    "patientId",
    "firstName",
    "lastName",
    "dateOfBirth",
    "gender",
    "address",
    "phone",
    "email",
    "allergies",
    "medications",
    "medicalHistory",
    "emergencyContact",
  ].forEach((field) => {
    const el = document.getElementById(field);
    if (!el) return;
    let val = userData[field] ?? "";
    if (field === "dateOfBirth" && val instanceof Timestamp) {
      val = val.toDate().toISOString().split("T")[0];
    }
    el.value = val;
  });
}

// ————————————————————————————————————————————
// 5. Auth & Profile Load
// ————————————————————————————————————————————
onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location = "/index.html");
  showLoading();
  try {
    const refDoc = doc(db, "users", user.uid);
    let snap = await getDoc(refDoc);

    let data = snap.exists()
      ? snap.data()
      : { email: user.email, patientId: generatePatientId() };

    // If new user, set initial doc
    if (!snap.exists()) {
      await setDoc(refDoc, data);
    }

    // Ensure patientId persisted
    if (!data.patientId) {
      data.patientId = generatePatientId();
      await updateDoc(refDoc, { patientId: data.patientId });
    }

    data.email = user.email;
    // Merge with draft if exists
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}");
    data = { ...data, ...draft };

    populateForm(data);

    // Real‑time listener
    onSnapshot(refDoc, (s) => {
      if (s.exists()) populateForm(s.data());
    });
  } catch (err) {
    console.error(err);
    showError("Failed to load profile.");
  } finally {
    hideLoading();
  }
});

// ————————————————————————————————————————————
// 6. Form Submission → Firestore & Clear Draft
// ————————————————————————————————————————————
formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  showLoading();
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");
    const refDoc = doc(db, "users", user.uid);

    const payload = {};
    formEl.querySelectorAll("input, textarea, select").forEach((inp) => {
      if (!inp.id) return;
      let val = inp.value;
      if (inp.id === "dateOfBirth" && val) {
        payload.dateOfBirth = Timestamp.fromDate(new Date(val));
      } else {
        payload[inp.id] = val;
      }
    });
    payload.updatedAt = serverTimestamp();

    await updateDoc(refDoc, payload);
    localStorage.removeItem(DRAFT_KEY);
    showSuccess("Profile saved!");
  } catch (err) {
    console.error(err);
    showError("Failed to save profile.");
  } finally {
    hideLoading();
  }
});

// ————————————————————————————————————————————
// 7. Logout Button
// ————————————————————————————————————————————
document.getElementById("logoutBtn").addEventListener("click", async () => {
  showLoading();
  try {
    await signOut(auth);
    window.location = "/index.html";
  } catch {
    showError("Logout failed");
  } finally {
    hideLoading();
  }
});
