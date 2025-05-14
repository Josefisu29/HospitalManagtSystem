import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
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
  showLoading,
  hideLoading,
  showError,
  showSuccess,
} from "./js/common.js";

// Firebase config & init
const firebaseConfig = {
  /* your config */
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const form = document.getElementById("profileForm");
const draftKey = "profileDraft";

// Load draft from localStorage
document.addEventListener("DOMContentLoaded", () => {
  const draft = localStorage.getItem(draftKey);
  if (draft) {
    try {
      populateForm(JSON.parse(draft));
    } catch {}
  }
});

// Auto-save draft on input
form.addEventListener("input", () => {
  const data = Array.from(form.elements)
    .filter((el) => el.id)
    .reduce((o, el) => ({ ...o, [el.id]: el.value }), {});
  localStorage.setItem(draftKey, JSON.stringify(data));
});

// Generate random patient ID
function generateRandomId(len = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: len }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
}
function generatePatientId() {
  return `PAT-${generateRandomId()}`;
}

// Populate form fields
function populateForm(data) {
  Object.entries(data).forEach(([key, val]) => {
    const el = document.getElementById(key);
    if (el) el.value = val || "";
  });
}

// Sync form to Firestore
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  showLoading();
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    const userRef = doc(db, "users", user.uid);
    const values = Array.from(form.elements)
      .filter((el) => el.id)
      .reduce((o, el) => ({ ...o, [el.id]: el.value }), {});

    // Timestamp conversion
    if (values.dateOfBirth) {
      values.dateOfBirth = Timestamp.fromDate(new Date(values.dateOfBirth));
    } else {
      delete values.dateOfBirth;
    }

    // Ensure patientId
    if (!values.patientId) {
      values.patientId = generatePatientId();
    }

    values.updatedAt = serverTimestamp();
    await setDoc(userRef, values, { merge: true });

    // Clear draft
    localStorage.removeItem(draftKey);
    showSuccess("Profile saved successfully");
  } catch (err) {
    console.error(err);
    showError("Failed to save profile");
  } finally {
    hideLoading();
  }
});

// Auth & real-time load
onAuthStateChanged(auth, async (user) => {
  if (!user) return (location.href = "/index.html");
  showLoading();
  try {
    const userRef = doc(db, "users", user.uid);
    let snap = await getDoc(userRef);
    let data = snap.exists() ? snap.data() : { email: user.email };

    // Assign patientId if missing
    if (!data.patientId) {
      data.patientId = generatePatientId();
      await setDoc(userRef, { patientId: data.patientId }, { merge: true });
    }

    // Populate and listen for updates
    populateForm({ ...data, email: user.email });
    onSnapshot(userRef, (s) => s.exists() && populateForm(s.data()));
  } catch (e) {
    console.error(e);
    showError("Failed to load profile");
  } finally {
    hideLoading();
  }
});
