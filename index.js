// // script.
// import { auth } from ".firebase-configue.js";
// import {
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword,
//   onAuthStateChanged,
// } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// // Sign Up
// const signupForm = document.getElementById("signup-form");
// signupForm.addEventListener("submit", async (e) => {
//   e.preventDefault();
//   const email = signupForm["signup-email"].value;
//   const pass = signupForm["signup-password"].value;
//   const confirm = signupForm["signup-confirm"].value;
//   if (pass !== confirm) {
//     document.getElementById("signup-error").textContent =
//       "Passwords must match.";
//     document.getElementById("signup-error").style.display = "block";
//     return;
//   }
//   try {
//     const userCredential = await createUserWithEmailAndPassword(
//       auth,
//       email,
//       pass
//     );
//     console.log("Signed up:", userCredential.user);
//     overlay.style.display = "none";
//   } catch (error) {
//     document.getElementById("signup-error").textContent = error.message;
//     document.getElementById("signup-error").style.display = "block";
//   }
// });

// // Login
// const loginForm = document.getElementById("login-form");
// loginForm.addEventListener("submit", async (e) => {
//   e.preventDefault();
//   const email = loginForm["login-email"].value;
//   const pass = loginForm["login-password"].value;
//   try {
//     const userCredential = await signInWithEmailAndPassword(auth, email, pass);
//     console.log("Signed in:", userCredential.user);
//     overlay.style.display = "none";
//   } catch (error) {
//     document.getElementById("login-error").style.display = "block";
//   }
// });

// // Auth State Observer
// onAuthStateChanged(auth, (user) => {
//   if (user) {
//     console.log("User is signed in:", user.email);
//     // Redirect or update UI as needed
//   } else {
//     console.log("No user signed in");
//   }
// });

// import {
//   GoogleAuthProvider,
//   signInWithPopup,
// } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// const googleBtn = document.getElementById("btn-google");
// const provider = new GoogleAuthProvider();

// googleBtn.addEventListener("click", async () => {
//   try {
//     const result = await signInWithPopup(auth, provider);
//     console.log("Google sign in:", result.user);
//     overlay.style.display = "none";
//     window.location.href = "/patient.html";
//   } catch (error) {
//     console.error("Google sign-in error:", error);
//     alert("Sign-in failed: " + error.message);
//   }
// });

// // Sign-Up
// createUserWithEmailAndPassword(auth, email, pass)
//   .then((userCredential) => {
//     // … store data here …
//     // then redirect:
//     window.location.href = "patient/reg.html";
//   })
//   .catch((error) => {
//     /* show error */
//   });

// // Login
// signInWithEmailAndPassword(auth, email, pass)
//   .then((userCredential) => {
//     window.location.href = "patient/reg.html";
//   })
//   .catch((error) => {
//     /* show error */
//   });
// import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
// import {
//   getAuth,
//   onAuthStateChanged,
//   signOut,
// } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
// import {
//   getFirestore,
//   collection,
//   addDoc,
//   serverTimestamp,
//   doc,
//   updateDoc,
//   onSnapshot,
// } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// // Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyCpMkpU9YeB3HNpzk0_fwswSf9TQwb_Xdg",
//   authDomain: "hospitalmanagtsystem.firebaseapp.com",
//   projectId: "hospitalmanagtsystem",
//   storageBucket: "hospitalmanagtsystem.firebasestorage.app",
//   messagingSenderId: "771158568788",
//   appId: "1:771158568788:web:e47f16ea2577fa1e8762c1",
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// export const auth = getAuth(app);
// export const db = getFirestore(app);

// // Utility function to get the current user's role
// export async function getUserRole() {
//   const user = auth.currentUser;
//   if (user) {
//     const token = await user.getIdTokenResult();
//     return token.claims.role || null;
//   }
//   return null;
// }

// // Database operation: Create a help request
// export async function createHelpRequest(latitude, longitude) {
//   const user = auth.currentUser;
//   if (!user) throw new Error("User not authenticated");
//   if ((await getUserRole()) !== "patient")
//     throw new Error("Only patients can create help requests");
//   await addDoc(collection(db, "helpRequests"), {
//     patientId: user.uid,
//     latitude,
//     longitude,
//     timestamp: serverTimestamp(),
//   });
// }

// // Database operation: Update user profile
// export async function updateUserProfile(data) {
//   const user = auth.currentUser;
//   if (!user) throw new Error("User not authenticated");
//   const userRef = doc(db, "users", user.uid);
//   await updateDoc(userRef, data);
// }

// // Authentication utility: Sign out
// export async function signOutUser() {
//   await signOut(auth);
// }

// // Authentication utility: Set up auth state listener
// export function setupAuthListener(callback) {
//   onAuthStateChanged(auth, callback);
// }

// // Real-time listener for help requests (for responders)
// export function listenToHelpRequests(callback) {
//   return onSnapshot(collection(db, "helpRequests"), callback);
// }

// // UI utility functions (placeholders, implement as needed)
// export function showLoading() {
//   const loading = document.getElementById("loading");
//   if (loading) loading.style.display = "flex";
// }

// export function hideLoading() {
//   const loading = document.getElementById("loading");
//   if (loading) loading.style.display = "none";
// }

// export function showError(message) {
//   alert(`Error: ${message}`);
// }

// export function showSuccess(message) {
//   alert(`Success: ${message}`);
// }

// import { initializeApp } from "[invalid url, do not cite]
// import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence, browserSessionPersistence, onAuthStateChanged } from "[invalid url, do not cite]
// import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, onSnapshot, query, where, Timestamp, serverTimestamp } from "[invalid url, do not cite]

// const firebaseConfig = {
//   apiKey: "AIzaSyCpMkpU9YeB3HNpzk0_fwswSf9TQwb_Xdg",
//   authDomain: "hospitalmanagtsystem.firebaseapp.com",
//   projectId: "hospitalmanagtsystem",
//   storageBucket: "hospitalmanagtsystem.firebasestorage.app",
//   messagingSenderId: "771158568788",
//   appId: "1:771158568788:web:e47f16ea2577fa1e8762c1",
// };

// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);
// const db = getFirestore(app);

// let currentStatus = navigator.onLine ? "online" : "offline";

// window.addEventListener("online", () => {
//   currentStatus = "online";
//   updateStatusIndicator("online");
//   syncLocalData();
// });

// window.addEventListener("offline", () => {
//   currentStatus = "offline";
//   updateStatusIndicator("offline");
// });

// function updateStatusIndicator(status) {
//   const indicator = document.getElementById("statusIndicator");
//   if (indicator) {
//     indicator.className = `status-indicator ${status}`;
//   }
// }

// function showLoading() {
//   const loader = document.getElementById("beat-loader");
//   if (loader) {
//     if (currentStatus === "online") {
//       loader.setAttribute("stroke", "#28a745");
//     } else if (currentStatus === "offline") {
//       loader.setAttribute("stroke", "#dc3545");
//     } else if (currentStatus === "syncing") {
//       loader.setAttribute("stroke", "#6c757d");
//     }
//   }
//   const loadingDiv = document.getElementById("loading");
//   if (loadingDiv) {
//     loadingDiv.style.display = "flex";
//   }
// }

// function hideLoading() {
//   const loadingDiv = document.getElementById("loading");
//   if (loadingDiv) {
//     loadingDiv.style.display = "none";
//   }
// }

// function showError(message) {
//   const errorMsg = document.getElementById("error-message");
//   if (errorMsg) {
//     errorMsg.textContent = message;
//     errorMsg.style.display = "block";
//   } else {
//     console.error("Error:", message);
//   }
// }

// function showSuccess(message) {
//   const notification = document.createElement("div");
//   notification.className = "notification success";
//   notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
//   document.getElementById("notifications")?.appendChild(notification);
//   setTimeout(() => notification.remove(), 5000);
// }

// async function login(email, password, rememberMe) {
//   try {
//     await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
//     const userCredential = await signInWithEmailAndPassword(auth, email, password);
//     const user = userCredential.user;
//     const idTokenResult = await user.getIdTokenResult(true);
//     const role = idTokenResult.claims.role;
//     switch (role) {
//       case 'firstResponder':
//         window.location.href = "/Responder/Responder.html";
//         break;
//       case 'nurse':
//         window.location.href = "/nurse/vitals.html";
//         break;
//       case 'patient':
//         window.location.href = "/patient.html";
//         break;
//       case 'pharmacist':
//         window.location.href = "/pharmacist/prescriptions.html";
//         break;
//       case 'lab_attendant':
//         window.location.href = "/lab/test-requests.html";
//         break;
//       case 'record_clerk':
//         window.location.href = "/records/records-management.html";
//         break;
//       default:
//         await signOut(auth);
//         showError("Unauthorized role.");
//     }
//   } catch (error) {
//     showError(error.message);
//   }
// }

// async function signup(email, password, termsAccepted, role = 'patient') {
//   if (!termsAccepted) {
//     showError("You must agree to the terms and conditions.");
//     return;
//   }
//   try {
//     const userCredential = await createUserWithEmailAndPassword(auth, email, password);
//     const user = userCredential.user;
//     await setDoc(doc(db, "users", user.uid), {
//       email,
//       role,
//       createdAt: serverTimestamp()
//     });
//     window.location.href = role === 'patient' ? "/patient.html" : "/index.html";
//   } catch (error) {
//     showError(error.message);
//   }
// }

// async function logout() {
//   try {
//     showLoading();
//     await signOut(auth);
//     window.location.href = "/index.html";
//   } catch (error) {
//     showError("Failed to log out: " + error.message);
//   } finally {
//     hideLoading();
//   }
// }

// async function checkAuth(requiredRole, callback) {
//   onAuthStateChanged(auth, async (user) => {
//     if (user) {
//       try {
//         const idTokenResult = await user.getIdTokenResult(true);
//         if (idTokenResult.claims.role === requiredRole) {
//           callback(user);
//         } else {
//           await signOut(auth);
//           showError("Unauthorized access. Redirecting to login...");
//           setTimeout(() => window.location.href = "/index.html", 2000);
//         }
//       } catch (error) {
//         showError("Error verifying user role: " + error.message);
//         window.location.href = "/index.html";
//       }
//     } else {
//       window.location.href = "/index.html";
//     }
//   });
// }

// async function getData(path) {
//   if (!navigator.onLine) {
//     const localData = localStorage.getItem(path);
//     return localData ? JSON.parse(localData) : null;
//   }
//   try {
//     const docRef = doc(db, path);
//     const docSnap = await getDoc(docRef);
//     return docSnap.exists() ? docSnap.data() : null;
//   } catch (error) {
//     console.error("Error fetching data:", error);
//     showError("Failed to fetch data: " + error.message);
//     return null;
//   }
// }

// async function setData(path, data) {
//   if (!navigator.onLine) {
//     localStorage.setItem(path, JSON.stringify(data));
//     showSuccess("Data saved locally. Will sync when online.");
//     return;
//   }
//   try {
//     await setDoc(doc(db, path), data, { merge: true });
//     localStorage.removeItem(path);
//   } catch (error) {
//     console.error("Error setting data:", error);
//     showError("Failed to save data: " + error.message);
//   }
// }

// function listenToData(path, callback) {
//   if (!navigator.onLine) {
//     showError("Offline mode: Real-time updates unavailable.");
//     return () => {};
//   }
//   try {
//     const q = collection(db, path);
//     return onSnapshot(q, (snapshot) => {
//       snapshot.docChanges().forEach((change) => {
//         callback(change.doc.data(), change.type);
//       });
//     }, (error) => {
//       console.error("Error listening to data:", error);
//       showError("Failed to listen to data: " + error.message);
//     });
//   } catch (error) {
//     console.error("Error setting up listener:", error);
//     showError("Failed to set up data listener: " + error.message);
//     return () => {};
//   }
// }

// async function syncLocalData() {
//   if (!navigator.onLine) {
//     showError("Cannot sync: No internet connection.");
//     return;
//   }
//   currentStatus = "syncing";
//   updateStatusIndicator("syncing");
//   showLoading();
//   try {
//     for (let i = 0; i < localStorage.length; i++) {
//       const key = localStorage.key(i);
//       const data = JSON.parse(localStorage.getItem(key));
//       await setDoc(doc(db, key), data, { merge: true });
//       localStorage.removeItem(key);
//     }
//     showSuccess("Data synchronized successfully.");
//   } catch (error) {
//     console.error("Error syncing data:", error);
//     showError("Failed to sync data: " + error.message);
//   } finally {
//     currentStatus = navigator.onLine ? "online" : "offline";
//     updateStatusIndicator(currentStatus);
//     hideLoading();
//   }
// }

// function toggleOfflineMode() {
//   if (navigator.onLine) {
//     currentStatus = "offline";
//     updateStatusIndicator("offline");
//     showSuccess("Switched to offline mode.");
//   } else {
//     showError("Already offline due to no internet connection.");
//   }
// }

// function toggleOnlineMode() {
//   if (navigator.onLine) {
//     currentStatus = "online";
//     updateStatusIndicator("online");
//     syncLocalData();
//   } else {
//     showError("Cannot switch to online mode: No internet connection.");
//   }
// }

// export {
//   login,
//   signup,
//   logout,
//   checkAuth,
//   getData,
//   setData,
//   listenToData,
//   showLoading,
//   hideLoading,
//   showError,
//   showSuccess,
//   updateStatusIndicator,
//   syncLocalData,
//   toggleOfflineMode,
//   toggleOnlineMode
// };

// script.js

// --- Imports & Firebase Init ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCpMkpU9YeB3HNpzk0_fwswSf9TQwb_Xdg",
  authDomain: "hospitalmanagtsystem.firebaseapp.com",
  projectId: "hospitalmanagtsystem",
  storageBucket: "hospitalmanagtsystem.firsebasestorage.app",
  messagingSenderId: "771158568788",
  appId: "1:771158568788:web:e47f16ea2577fa1e8762c1",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// --- Authentication Utilities ---

/**
 * Creates a new user with email/password, stores basic profile, and redirects.
 */
export async function signup(
  email,
  password,
  confirmPassword,
  role = "patient"
) {
  if (password !== confirmPassword) throw new Error("Passwords must match");
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;
  // Set role in Firestore profile
  await setDoc(doc(db, "users", uid), {
    email,
    role,
    createdAt: serverTimestamp(),
  });
  // Optionally set custom claim via Cloud Function here...
  return cred.user;
}

/**
 * Signs in with email/password and redirects based on role.
 */
export async function login(email, password, rememberMe = false) {
  // Choose persistence
  await setPersistence(
    auth,
    rememberMe ? browserLocalPersistence : browserSessionPersistence
  );
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const user = cred.user;
  // Refresh token for latest claims
  const idToken = await user.getIdTokenResult(true);
  const role = idToken.claims.role || "patient";
  // Redirect mapping
  const routes = {
    admin: "/admin.html",
    doctor: "/doctor.html",
    nurse: "/nurse.html",
    pharmacist: "/pharmacist.html",
    labAttendant: "/lab.html",
    receptionist: "/reception.html",
    firstResponder: "/responder.html",
    recordClerk: "/records.html",
    hospitalStaff: "/hospital.html",
    patient: "/patient.html",
  };
  window.location.href = routes[role] || "/index.html";
}

/**
 * Google OAuth sign in.
 */
export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Signs out the current user.
 */
export function signOutUser() {
  return signOut(auth);
}

/**
 * Returns the current user's role claim (or null).
 */
export async function getUserRole() {
  const user = auth.currentUser;
  if (!user) return null;
  const token = await user.getIdTokenResult(true);
  return token.claims.role || null;
}

/**
 * Sets up an auth state listener.
 * `callback(user)` is invoked on any state change.
 */
export function setupAuthListener(callback) {
  onAuthStateChanged(auth, callback);
}

// --- Firestore Operations ---

/**
 * Creates an emergency help request (patients only).
 */
export async function createHelpRequest(lat, lng) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  if ((await getUserRole()) !== "patient")
    throw new Error("Only patients may request help");
  return addDoc(collection(db, "helpRequests"), {
    patientId: user.uid,
    location: new firebase.firestore.GeoPoint(lat, lng),
    timestamp: serverTimestamp(),
    status: "active",
  });
}

/**
 * Updates the current user's Firestore profile.
 * `data` is an object of fields to merge.
 */
export async function updateUserProfile(data) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const ref = doc(db, "users", user.uid);
  return updateDoc(ref, data);
}

/**
 * Listens in real-time to help requests.
 * Returns an unsubscribe function.
 */
export function listenToHelpRequests(onChange) {
  return onSnapshot(collection(db, "helpRequests"), (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      onChange(change.doc.data(), change.type);
    });
  });
}

// --- Network Status & Sync Helpers ---

let currentStatus = navigator.onLine ? "online" : "offline";
window.addEventListener("online", () => syncLocalData("online"));
window.addEventListener("offline", () => syncLocalData("offline"));

/**
 * Updates a status indicator element and optionally triggers sync.
 */
export function updateStatusIndicator(status) {
  currentStatus = status;
  const ind = document.getElementById("statusIndicator");
  if (ind) ind.className = `status-indicator ${status}`;
  if (status === "online") syncLocalData();
}
// functions/index.js
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
admin.initializeApp();

export const systemStatus = functions.https.onRequest((req, res) => {
  // Optional: perform any backend checks here
  res.json({ status: "online" });
});

/**
 * Saves data locally when offline, and syncs all local data when online.
 * Keys in localStorage are Firestore paths.
 */
export async function syncLocalData(mode) {
  if (mode === "offline") {
    updateStatusIndicator("offline");
    return;
  }
  updateStatusIndicator("syncing");
  const keys = Object.keys(localStorage);
  for (let key of keys) {
    const data = JSON.parse(localStorage[key]);
    const ref = doc(db, ...key.split("/"));
    await setDoc(ref, data, { merge: true });
    localStorage.removeItem(key);
  }
  updateStatusIndicator("online");
}

/**
 * Fetches a Firestore document or returns local copy when offline.
 */
export async function getData(path) {
  if (!navigator.onLine) {
    const raw = localStorage.getItem(path);
    return raw ? JSON.parse(raw) : null;
  }
  const snap = await getDoc(doc(db, ...path.split("/")));
  return snap.exists() ? snap.data() : null;
}

/**
 * Writes data to Firestore or localStorage when offline.
 */
export async function setData(path, data) {
  if (!navigator.onLine) {
    localStorage.setItem(path, JSON.stringify(data));
    return;
  }
  await setDoc(doc(db, ...path.split("/")), data, { merge: true });
}
document.addEventListener("DOMContentLoaded", () => {
  showLoader("syncing");
  loadDoctorAppointments((docs) => {
    const tbody = document.getElementById("appt-tbody");
    tbody.innerHTML = "";
    docs.forEach((a) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${a.patientId}</td>
        <td>${new Date(a.dateTime.seconds * 1000).toLocaleString()}</td>
        <td>
          <button class="edit-appointment" data-id="${a.id}">Edit</button>
        </td>`;
      tbody.appendChild(tr);
    });
    hideLoader();
  });
});
document.addEventListener("click", async (e) => {
  if (e.target.matches(".edit-appointment")) {
    const id = e.target.dataset.id;
    showLoader("syncing");
    const docSnap = await getDoc(doc(db, "appointments", id));
    hideLoader();
    if (docSnap.exists()) {
      const data = docSnap.data();
      // populate modal fields, then:
      document.getElementById("appointmentModal").style.display = "flex";
    }
  }
});
document
  .getElementById("appointmentForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    showLoader("syncing");
    const id = document.getElementById("editAppointmentId").value;
    const updated = {
      /* gather from form */
    };
    await updateDoc(doc(db, "appointments", id), {
      ...updated,
      updatedAt: serverTimestamp(),
    });
    hideLoader();
    document.getElementById("appointmentModal").style.display = "none";
  });

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// const auth = getAuth();

// Login form submit
document
  .getElementById("admin-login-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = e.target["admin-email"].value;
    const password = e.target["admin-password"].value;
    try {
      // Sign in
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      // Force token refresh to get latest claims
      const idToken = await user.getIdTokenResult(true);
      if (idToken.claims.role !== "admin") {
        await signOut(auth);
        throw new Error("Unauthorized: Admin access required.");
      }
      // If we reach here, user is admin → show dashboard
      document.getElementById("login-box").style.display = "none";
      document.getElementById("admin-dashboard").style.display = "block";
    } catch (err) {
      document.getElementById("error-msg").textContent = err.message;
    }
  });

// onAuthStateChanged(auth, async (user) => {
//   if (!user) {
//     // Not signed in → show login box
//     document.getElementById("login-box").style.display = "flex";
//     document.getElementById("admin-dashboard").style.display = "none";
//     return;
//   }

//   try {
//     // Refresh token so we get the latest custom claims
//     const idRes = await user.getIdTokenResult(true);
//     if (idRes.claims.role !== "admin") {
//       // Signed in but not an admin → sign out & redirect
//       await signOut(auth);
//       alert("Only admins may access this page.");
//       window.location.href = "/index.html";
//       return;
//     }
//     // Signed in as admin → show dashboard
//     document.getElementById("login-box").style.display = "none";
//     document.getElementById("admin-dashboard").style.display = "block";
//     loadDashboard(); // your function that hooks up onSnapshot, etc.
//   } catch (error) {
//     console.error("Auth guard error:", error);
//     await signOut(auth);
//     window.location.href = "/index.html";
//   }
// });
// // Grab loader elements
// const loadingEl = document.getElementById("loading");
// const loaderPath = document.getElementById("beat-loader");

// // Define stroke colors
// const strokeColors = {
//   online: "#28a745", // green
//   offline: "#dc3545", // red
//   syncing: "#6c757d", // grey
// };

// let loaderTimer;

// /**
//  * Show the loader with the given status color for 2 seconds.
//  * @param {'online'|'offline'|'syncing'} status
//  */
// function showLoader(status = "online") {
//   // Set the stroke color
//   loaderPath.setAttribute("stroke", strokeColors[status]);
//   // Un‑hide loader
//   loadingEl.classList.remove("loading--hidden");
//   // Schedule auto‑hide
//   clearTimeout(loaderTimer);
//   loaderTimer = setTimeout(() => {
//     hideLoader();
//     // If offline, also show a message
//     if (status === "offline") {
//       alert("You are offline");
//     }
//   }, 2000);
// }

// /** Hide the loader immediately */
// function hideLoader() {
//   clearTimeout(loaderTimer);
//   loadingEl.classList.add("loading--hidden");
// }

// // 1) On initial page load, show green if online, red if offline
// document.addEventListener("DOMContentLoaded", () => {
//   showLoader(navigator.onLine ? "online" : "offline");
// });

// // 2) Listen for connectivity changes
// window.addEventListener("online", () => showLoader("online"));
// window.addEventListener("offline", () => showLoader("offline"));

const loader = document.getElementById("network-loader");
const text = document.getElementById("network-text");

let hideTimeout;

function showStatus(status) {
  // clear any pending hide
  clearTimeout(hideTimeout);

  // update class & text
  loader.className = `network-loader visible ${status}`;
  text.textContent = status === "online" ? "Online" : "Offline";

  // if we just came online, auto-hide after 5s
  if (status === "online") {
    hideTimeout = setTimeout(() => {
      loader.classList.remove("visible");
    }, 5000);
  }
  // if offline, keep showing until reconnect
}

// initial state
showStatus(navigator.onLine ? "online" : "offline");

window.addEventListener("online", () => showStatus("online"));
window.addEventListener("offline", () => showStatus("offline"));
document.getElementById("logoutBtn").addEventListener("click", async () => {
  try {
    showLoading();
    await signOut(auth);
    window.location.href = "/index.html";
  } catch (error) {
    console.error("Error signing out:", error);
    showError("Failed to sign out");
  } finally {
    hideLoading();
  }
});
