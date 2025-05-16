// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  getDocs,
  setDoc,
  updateDoc,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

/** ── 1. CONFIGURE FIREBASE ──────────────────────────────────────── */
const firebaseConfig = {
  apiKey: "AIzaSyCpMkpU9YeB3HNpzk0_fwswSf9TQwb_Xdg",
  authDomain: "hospitalmanagtsystem.firebaseapp.com",
  projectId: "hospitalmanagtsystem",
  storageBucket: "hospitalmanagtsystem.firebasestorage.app",
  messagingSenderId: "771158568788",
  appId: "1:771158568788:web:e47f16ea2577fa1e8762c1",
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/** ── 2. UI HELPERS ──────────────────────────────────────────────── */
// Loading overlay
function showLoading() {
  if (!document.querySelector(".loading-overlay")) {
    const overlay = document.createElement("div");
    overlay.className = "loading-overlay";
    overlay.innerHTML = `<div class="loading-spinner"></div>`;
    document.body.appendChild(overlay);
  }
}
function hideLoading() {
  const ol = document.querySelector(".loading-overlay");
  if (ol) ol.remove();
}

// Notifications
function showError(msg) {
  const d = document.createElement("div");
  d.className = "error-message";
  d.innerHTML = `<span>${msg}</span><button class="close-btn">&times;</button>`;
  document.querySelector("main")?.prepend(d);
  d.querySelector(".close-btn").onclick = () => d.remove();
  setTimeout(() => d.remove(), 5000);
}
function showSuccess(msg) {
  const d = document.createElement("div");
  d.className = "success-message";
  d.innerHTML = `<span>${msg}</span><button class="close-btn">&times;</button>`;
  document.querySelector("main")?.prepend(d);
  d.querySelector(".close-btn").onclick = () => d.remove();
  setTimeout(() => d.remove(), 5000);
}

// Table sort/filter (as provided)
function setupTableSorting(tableId, columns) {
  /*…*/
}
function setupTableFiltering(tableId, columns) {
  /*…*/
}
// (You can paste your existing implementations here.)

/** ── 3. ONLINE/OFFLINE INDICATOR ───────────────────────────────── */
function initStatusIndicator(indicatorId = "statusIndicator") {
  const ind = document.getElementById(indicatorId);
  if (!ind) return;
  function update() {
    if (navigator.onLine) {
      ind.classList.replace("offline", "online");
      ind.title = "Online";
    } else {
      ind.classList.replace("online", "offline");
      ind.title = "Offline";
    }
  }
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  update();
}

/** ── 4. GENERIC FIRESTORE WATCHER ──────────────────────────────── */
function watchCollection(path, { queryFn = null, onData }) {
  let qRef = collection(db, path);
  if (queryFn) qRef = queryFn(qRef);
  return onSnapshot(
    qRef,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => console.error(`❌ [${path}]`, err)
  );
}

/** ── 5. INITIALIZE REAL‑TIME LISTENERS ─────────────────────────── */
/* 5.1 Hospitals */
watchCollection("hospitals", {
  queryFn: (q) => orderBy(q, "name", "asc"),
  onData: (list) => {
    const sel = document.getElementById("hospitalSelect");
    if (!sel) return;
    sel.innerHTML = list
      .map((h) => `<option value="${h.id}">${h.name} (${h.location})</option>`)
      .join("");
  },
});

/* 5.2 Doctors grouped by hospital */
let doctorsByHospital = {};
watchCollection("doctors", {
  queryFn: (q) => orderBy(q, "lastName", "asc"),
  onData: (list) => {
    doctorsByHospital = list.reduce(
      (m, d) => (m[d.hospitalId] || (m[d.hospitalId] = [])).push(d),
      {}
    );
    // populate initial if hospitalSelect has value
    const hs = document.getElementById("hospitalSelect");
    if (hs?.value) hs.dispatchEvent(new Event("change"));
  },
});
document.getElementById("hospitalSelect")?.addEventListener("change", (e) => {
  const docs = doctorsByHospital[e.target.value] || [];
  const sel = document.getElementById("doctorSelect");
  if (!sel) return;
  sel.innerHTML = docs
    .map(
      (d) => `<option value="${d.id}">Dr. ${d.firstName} ${d.lastName}</option>`
    )
    .join("");
});

/* 5.3 Nurses */
watchCollection("nurses", {
  onData: (list) => {
    const ul = document.getElementById("nurseList");
    if (!ul) return;
    ul.innerHTML = list
      .map((n) => `<li>${n.firstName} ${n.lastName} — Shift: ${n.shift}</li>`)
      .join("");
  },
});

/* 5.4 Pharmacists */
watchCollection("pharmacists", {
  onData: (list) => {
    const ul = document.getElementById("pharmacistList");
    if (!ul) return;
    ul.innerHTML = list
      .map(
        (p) =>
          `<li>${p.firstName} ${p.lastName} — Inventory: ${p.inventoryCount}</li>`
      )
      .join("");
  },
});

/* 5.5 Lab Attendants */
watchCollection("labAttendants", {
  onData: (list) => {
    const ul = document.getElementById("labAttendantList");
    if (!ul) return;
    ul.innerHTML = list
      .map(
        (l) =>
          `<li>${l.firstName} ${l.lastName} — Tests: ${l.testsProcessed}</li>`
      )
      .join("");
  },
});

/* 5.6 Record Clerks */
watchCollection("recordClerks", {
  onData: (list) => {
    const ul = document.getElementById("recordClerkList");
    if (!ul) return;
    ul.innerHTML = list
      .map(
        (c) =>
          `<li>${c.firstName} ${c.lastName} — Files: ${c.filesManaged}</li>`
      )
      .join("");
  },
});

/* 5.7 Users count */
watchCollection("users", {
  onData: (list) => {
    const stat = document.getElementById("stat-users");
    if (stat) stat.textContent = list.length;
  },
});

/** ── 6. AUTH GUARD & LOGOUT ───────────────────────────────────── */
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "/index.html";
  }
});

// Attach logout button
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  showLoading();
  try {
    await signOut(auth);
    window.location.href = "/index.html";
  } catch (e) {
    showError("Logout failed");
  } finally {
    hideLoading();
  }
});

/** ── 7. BOOTSTRAP ON DOM READY ─────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  initStatusIndicator(); // online/offline dot
  // You can also kick off any other on‑load behavior here
});
