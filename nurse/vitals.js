import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  enableIndexedDbPersistence,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";
import {
  showLoading,
  hideLoading,
  showError,
  showSuccess,
} from "../js/common.js";

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
const storage = getStorage(app);

enableIndexedDbPersistence(db).catch((err) =>
  console.warn("Offline persistence failed:", err)
);

const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error-message");
const successEl = document.getElementById("success-message");
const vitalsSection = document.getElementById("vitals");
const tasksSection = document.getElementById("tasks");
const profileSection = document.getElementById("profile");
const profileForm = document.getElementById("profileForm");
const vitalsForm = document.getElementById("vitalsForm");
const greeting = document.getElementById("greeting");
const statusIndicator = document.getElementById("statusIndicator");
const logoutBtn = document.getElementById("logoutBtn");
const patientIdSelect = document.getElementById("patientId");
const tasksTable = document
  .getElementById("tasks-table")
  .querySelector("tbody");
const vitalsFilter = document.getElementById("vitalsFilter");
const tasksFilter = document.getElementById("tasksFilter");

function checkNetworkAndLoad() {
  if (!navigator.onLine) {
    showError("No internet connection. Please check your network.");
    hideLoading();
    return false;
  }
  return true;
}

function handleNavigation() {
  const hash = window.location.hash || "#vitals";
  vitalsSection.style.display = hash === "#vitals" ? "block" : "none";
  tasksSection.style.display = hash === "#tasks" ? "block" : "none";
  profileSection.style.display = hash === "#profile" ? "block" : "none";
  document.querySelectorAll("nav ul li a").forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === hash);
  });
}
window.addEventListener("hashchange", handleNavigation);
handleNavigation();

onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && userDoc.data().role === "nurse") {
        greeting.textContent = `Good Morning, ${userDoc.data().firstName}`;
        statusIndicator.classList.remove("disconnected");
        statusIndicator.classList.add("online");
        loadPatients();
        loadVitals();
        loadTasks();
        loadProfile(user.uid);
      } else {
        showError("Invalid user role. Please contact support.");
        await signOut(auth);
        window.location.href = "/index.html";
      }
    } catch (error) {
      showError("Error verifying user: " + error.message);
      await signOut(auth);
    }
  } else {
    window.location.href = "/index.html";
  }
});

function initVitalsTable() {
  new List("vitals-list", {
    valueNames: [
      "patientId",
      "heartRate",
      "bloodPressure",
      "temperature",
      "date",
      "recordedBy",
    ],
    searchClass: "filter-input",
  });
  document.querySelectorAll("#vitals-table th[data-sort]").forEach((th) => {
    th.addEventListener("click", () => {
      const column = th.dataset.sort;
      const isAsc = th.classList.contains("sort-asc");
      document.querySelectorAll("#vitals-table th").forEach((t) => {
        t.classList.remove("sort-asc", "sort-desc");
        t.querySelector(".sort-icon")?.remove();
      });
      th.classList.add(isAsc ? "sort-desc" : "sort-asc");
      th.innerHTML += '<span class="sort-icon"></span>';
      // Sorting handled by List.js
    });
  });
}

function initTasksTable() {
  new List("tasks-list", {
    valueNames: ["description", "patientId", "status"],
    searchClass: "filter-input",
  });
  document.querySelectorAll("#tasks-table th[data-sort]").forEach((th) => {
    th.addEventListener("click", () => {
      const column = th.dataset.sort;
      const isAsc = th.classList.contains("sort-asc");
      document.querySelectorAll("#tasks-table th").forEach((t) => {
        t.classList.remove("sort-asc", "sort-desc");
        t.querySelector(".sort-icon")?.remove();
      });
      th.classList.add(isAsc ? "sort-desc" : "sort-asc");
      th.innerHTML += '<span class="sort-icon"></span>';
      // Sorting handled by List.js
    });
  });
}

function loadNurseProfile(nurseId, email) {
  showLoading();
  document.getElementById("nurseId").value = nurseId;
  document.getElementById("email").value = email;
  const nurseRef = doc(db, "nurses", nurseId);
  const unsubscribe = onSnapshot(
    nurseRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const profile = docSnap.data();
        document.getElementById("firstName").value = profile.firstName || "";
        document.getElementById("lastName").value = profile.lastName || "";
        document.getElementById("licenseNumber").value =
          profile.licenseNumber || "";
        document.getElementById("hospital").value = profile.hospital || "";
        document.getElementById("phone").value = profile.phone || "";
        document.getElementById("bio").value = profile.bio || "";
      } else {
        document.getElementById("firstName").value = "";
        document.getElementById("lastName").value = "";
        document.getElementById("licenseNumber").value = "";
        document.getElementById("hospital").value = "";
        document.getElementById("phone").value = "";
        document.getElementById("bio").value = "";
      }
      hideLoading();
    },
    (error) => {
      console.error("Error fetching nurse profile:", error);
      showError("Failed to load profile: " + error.message);
      hideLoading();
    }
  );
  profileForm.dataset.unsubscribe = unsubscribe;
}

profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!checkNetworkAndLoad()) return;
  showLoading();
  const nurseId = document.getElementById("nurseId").value;
  const profileData = {
    nurseId,
    firstName: document.getElementById("firstName").value,
    lastName: document.getElementById("lastName").value,
    email: document.getElementById("email").value,
    licenseNumber: document.getElementById("licenseNumber").value,
    hospital: document.getElementById("hospital").value,
    phone: document.getElementById("phone").value,
    bio: document.getElementById("bio").value,
    updatedAt: serverTimestamp(),
  };
  try {
    await setDoc(doc(db, "nurses", nurseId), profileData, { merge: true });
    showSuccess("Profile saved successfully!");
  } catch (error) {
    console.error("Error saving profile:", error);
    showError("Failed to save profile: " + error.message);
  } finally {
    hideLoading();
  }
});

vitalsForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!checkNetworkAndLoad()) return;

  showLoading();
  try {
    const patientId = document.getElementById("patientId").value;
    const heartRate = parseInt(document.getElementById("heartRate").value);
    const bloodPressure = document.getElementById("bloodPressure").value;
    const temperature = parseFloat(
      document.getElementById("temperature").value
    );
    const file = document.getElementById("vitalFile").files[0];

    if (!patientId || !heartRate || !bloodPressure || !temperature) {
      throw new Error("All fields except file are required.");
    }

    // Validate patientId
    const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
    const assignedPatients = userDoc.exists()
      ? userDoc.data().assignedPatients || []
      : [];
    if (!assignedPatients.includes(patientId)) {
      throw new Error("Patient ID not assigned to you.");
    }

    // Validate vitals
    const alerts = [];
    if (heartRate < 60 || heartRate > 100) {
      alerts.push(`Abnormal heart rate: ${heartRate} bpm`);
    }
    if (temperature > 38) {
      alerts.push(`Abnormal temperature: ${temperature} °C`);
    }
    if (bloodPressure.split("/")[0] > 140 || bloodPressure.split("/")[1] > 90) {
      alerts.push(`Abnormal blood pressure: ${bloodPressure}`);
    }

    // Upload file
    let filePath = "";
    if (file) {
      const storageRef = ref(storage, `vitals/${patientId}/${Date.now()}`);
      await uploadBytes(storageRef, file);
      filePath = await getDownloadURL(storageRef);
    }

    // Record vitals
    await addDoc(collection(db, "vitals"), {
      patientId,
      heartRate,
      bloodPressure,
      temperature,
      recordedBy: auth.currentUser.uid,
      filePath,
      timestamp: serverTimestamp(),
    });

    // Create alerts
    for (const message of alerts) {
      await addDoc(collection(db, "alerts"), {
        type: "vital",
        patientId,
        message,
        createdBy: auth.currentUser.uid,
        status: "pending",
        timestamp: serverTimestamp(),
      });
    }

    showSuccess(
      "Vitals recorded successfully!" +
        (alerts.length > 0 ? " Alerts sent to doctor." : "")
    );
    vitalsForm.reset();
  } catch (error) {
    console.error("Error recording vitals:", error);
    showError("Failed to record vitals: " + error.message);
  } finally {
    hideLoading();
  }
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  if (!checkNetworkAndLoad()) return;

  try {
    showLoading();
    cleanupListeners();
    await signOut(auth);
    window.location.href = "/index.html";
  } catch (error) {
    console.error("Error signing out:", error);
    showError("Failed to sign out: " + error.message);
  } finally {
    hideLoading();
  }
});

function cleanupListeners() {
  if (vitalsSection.dataset.vitalsUnsubscribe) {
    vitalsSection.dataset.vitalsUnsubscribe();
    delete vitalsSection.dataset.vitalsUnsubscribe;
  }
  if (tasksSection.dataset.tasksUnsubscribe) {
    tasksSection.dataset.tasksUnsubscribe();
    delete tasksSection.dataset.tasksUnsubscribe;
  }
  if (profileForm.dataset.unsubscribe) {
    profileForm.dataset.unsubscribe();
    delete profileForm.dataset.unsubscribe;
  }
}

// Network status indicator
async function updateStatus() {
  try {
    const res = await fetch(
      "https://us-central1-hospitalmanagtsystem.cloudfunctions.net/systemStatus"
    );
    const statusIndicator = document.getElementById("statusIndicator");
    if (res.ok) {
      const { status } = await res.json();
      statusIndicator.className = `status-indicator ${status || "offline"}`;
    } else {
      statusIndicator.className = "status-indicator disconnected";
    }
  } catch {
    statusIndicator.className = "status-indicator disconnected";
  }
}
window.addEventListener("online", updateStatus);
window.addEventListener("offline", () => {
  document.getElementById("statusIndicator").className =
    "status-indicator offline";
});
setInterval(updateStatus, 15000);
updateStatus();

// Load Patients
async function loadPatients() {
  try {
    const q = query(collection(db, "users"), where("role", "==", "patient"));
    onSnapshot(q, (snapshot) => {
      patientIdSelect.innerHTML = '<option value="">Select Patient</option>';
      snapshot.forEach((doc) => {
        const user = doc.data();
        const option = document.createElement("option");
        option.value = doc.id;
        option.textContent = `${user.firstName || "N/A"} ${
          user.lastName || "N/A"
        }`;
        option.dataset.name = `${user.firstName || "N/A"} ${
          user.lastName || "N/A"
        }`;
        patientIdSelect.appendChild(option);
      });
    });
  } catch (error) {
    showError("Failed to load patients: " + error.message);
  }
}

// Load Vitals History
async function loadVitals() {
  try {
    onSnapshot(collection(db, "vitals"), async (snapshot) => {
      const vitalsTable = document
        .getElementById("vitals-table")
        .querySelector("tbody");
      vitalsTable.innerHTML = "";
      for (const doc of snapshot.docs) {
        const v = doc.data();
        const patientDoc = await getDoc(doc(db, "users", v.patientId));
        const patientName = patientDoc.exists()
          ? `${patientDoc.data().firstName || "N/A"} ${
              patientDoc.data().lastName || "N/A"
            }`
          : "Unknown";
        const recordedByDoc = await getDoc(doc(db, "users", v.recordedBy));
        const recordedByName = recordedByDoc.exists()
          ? `${recordedByDoc.data().firstName || "N/A"} ${
              recordedByDoc.data().lastName || "N/A"
            }`
          : "Unknown";
        const row = document.createElement("tr");
        row.innerHTML = `
          <td data-name="${patientName}">${patientName}</td>
          <td>${v.heartRate}</td>
          <td>${v.bloodPressure}</td>
          <td>${v.temperature}</td>
          <td>${v.date?.toDate()?.toLocaleString() || "N/A"}</td>
          <td>${recordedByName}</td>
          <td>${
            v.filePath ? '<a href="' + v.filePath + '">Download</a>' : "N/A"
          }</td>
        `;
        vitalsTable.appendChild(row);
      }
    });
  } catch (error) {
    showError("Failed to load vitals: " + error.message);
  }
}

// Vitals Filter
vitalsFilter.addEventListener("input", () => {
  const filter = vitalsFilter.value.toLowerCase();
  const rows = document
    .getElementById("vitals-table")
    .querySelector("tbody").rows;
  for (let row of rows) {
    const patientName = row.cells[0].dataset.name.toLowerCase();
    const date = row.cells[4].textContent.toLowerCase();
    row.style.display =
      patientName.includes(filter) || date.includes(filter) ? "" : "none";
  }
});

// Load Tasks
async function loadTasks() {
  try {
    const q = query(
      collection(db, "tasks"),
      where("assignedTo", "==", auth.currentUser.uid)
    );
    onSnapshot(q, async (snapshot) => {
      tasksTable.innerHTML = "";
      for (const doc of snapshot.docs) {
        const t = doc.data();
        const patientDoc = await getDoc(doc(db, "users", t.patientId));
        const patientName = patientDoc.exists()
          ? `${patientDoc.data().firstName || "N/A"} ${
              patientDoc.data().lastName || "N/A"
            }`
          : "Unknown";
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${t.description}</td>
          <td data-name="${patientName}">${patientName}</td>
          <td>
            <select class="status-select" data-id="${doc.id}">
              <option value="pending" ${
                t.status === "pending" ? "selected" : ""
              }>Pending</option>
              <option value="completed" ${
                t.status === "completed" ? "selected" : ""
              }>Completed</option>
            </select>
          </td>
          <td><button class="action-btn delete-btn" data-id="${
            doc.id
          }">Delete</button></td>
        `;
        tasksTable.appendChild(row);
      }
    });
  } catch (error) {
    showError("Failed to load tasks: " + error.message);
  }
}

// Tasks Filter
tasksFilter.addEventListener("input", () => {
  const filter = tasksFilter.value.toLowerCase();
  const rows = document
    .getElementById("tasks-table")
    .querySelector("tbody").rows;
  for (let row of rows) {
    const description = row.cells[0].textContent.toLowerCase();
    const patientName = row.cells[1].dataset.name.toLowerCase();
    row.style.display =
      description.includes(filter) || patientName.includes(filter)
        ? ""
        : "none";
  }
});

// Update Task Status
tasksTable.addEventListener("change", async (e) => {
  if (e.target.classList.contains("status-select")) {
    const taskId = e.target.dataset.id;
    const status = e.target.value;
    try {
      await updateDoc(doc(db, "tasks", taskId), { status });
      showSuccess("Task status updated!");
    } catch (error) {
      showError("Failed to update task: " + error.message);
    }
  }
});

// Delete Task
tasksTable.addEventListener("click", async (e) => {
  if (e.target.classList.contains("delete-btn")) {
    const taskId = e.target.dataset.id;
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        await deleteDoc(doc(db, "tasks", taskId));
        showSuccess("Task deleted successfully!");
      } catch (error) {
        showError("Failed to delete task: " + error.message);
      }
    }
  }
});

// Load Profile
async function loadProfile(userId) {
  try {
    onSnapshot(doc(db, "users", userId), (docSnap) => {
      if (docSnap.exists()) {
        const user = docSnap.data();
        document.getElementById("nurseId").value = userId;
        document.getElementById("firstName").value = user.firstName || "";
        document.getElementById("lastName").value = user.lastName || "";
        document.getElementById("email").value = user.email || "";
        document.getElementById("licenseNumber").value =
          user.licenseNumber || "";
        document.getElementById("hospital").value = user.hospital || "";
        document.getElementById("phone").value = user.phone || "";
        document.getElementById("bio").value = user.bio || "";
      }
    });
  } catch (error) {
    showError("Failed to load profile: " + error.message);
  }
}

// Save Profile
profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loadingEl.style.display = "block";
  const userId = document.getElementById("nurseId").value;
  const profileData = {
    firstName: document.getElementById("firstName").value,
    lastName: document.getElementById("lastName").value,
    licenseNumber: document.getElementById("licenseNumber").value,
    hospital: document.getElementById("hospital").value,
    phone: document.getElementById("phone").value,
    bio: document.getElementById("bio").value,
  };

  try {
    await updateDoc(doc(db, "users", userId), profileData);
    showSuccess("Profile updated successfully!");
  } catch (error) {
    showError("Failed to update profile: " + error.message);
  } finally {
    loadingEl.style.display = "none";
  }
});

// Navigation
document.querySelectorAll("nav a").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    document
      .querySelectorAll("nav a")
      .forEach((l) => l.classList.remove("active"));
    link.classList.add("active");
    document.querySelectorAll("main section").forEach((section) => {
      section.style.display =
        section.id === link.getAttribute("href").slice(1) ? "block" : "none";
    });
  });
});

// Table Sorting
document.querySelectorAll("th[data-sort]").forEach((header) => {
  header.addEventListener("click", () => {
    const table = header.closest("table");
    const tbody = table.querySelector("tbody");
    const index = Array.from(header.parentElement.children).indexOf(header);
    const sortKey = header.dataset.sort;
    const isAsc = header.classList.contains("sort-asc");

    // Reset all headers
    table.querySelectorAll("th").forEach((th) => {
      th.classList.remove("sort-asc", "sort-desc");
      th.classList.add("sort-icon");
    });

    // Set sort direction
    header.classList.add(isAsc ? "sort-desc" : "sort-asc");

    const rows = Array.from(tbody.rows);
    rows.sort((a, b) => {
      let aValue = a.cells[index].textContent.trim();
      let bValue = b.cells[index].textContent.trim();

      if (sortKey === "heartRate" || sortKey === "temperature") {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      } else if (sortKey === "date") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (isAsc) {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    rows.forEach((row) => tbody.appendChild(row));
  });
});
