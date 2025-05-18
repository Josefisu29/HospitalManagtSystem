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
  if (!user) {
    cleanupListeners();
    window.location.href = "/index.html";
    return;
  }

  showLoading();
  try {
    const idTokenResult = await user.getIdTokenResult(true);
    if (idTokenResult.claims.role !== "nurse") {
      await signOut(auth);
      showError("Unauthorized access. Redirecting to login...");
      setTimeout(() => (window.location.href = "/index.html"), 2000);
      return;
    }

    if (!checkNetworkAndLoad()) return;

    const userDoc = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDoc);
    const userData = userSnap.exists() ? userSnap.data() : {};

    const greetEl = document.getElementById("greeting");
    const hour = new Date().getHours();
    const sal =
      hour < 12
        ? "Good Morning"
        : hour < 18
        ? "Good Afternoon"
        : "Good Evening";
    greetEl.textContent = `${sal}, ${userData.firstName || "Nurse"}`;

    const assignedPatients = userData.assignedPatients || [];
    if (assignedPatients.length === 0) {
      showError("No patients assigned to you.");
    } else {
      // Populate patient dropdown
      const patients = await Promise.all(
        assignedPatients.map(async (id) => {
          const doc = await getDoc(doc(db, "users", id));
          return {
            id,
            name: doc.exists()
              ? `${doc.data().firstName} ${doc.data().lastName}`
              : id,
          };
        })
      );
      const select = document.getElementById("patientId");
      select.innerHTML = '<option value="">Select Patient</option>';
      patients.forEach(({ id, name }) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = `${name} (${id})`;
        select.appendChild(option);
      });

      // Load vitals
      const vitalsQuery = query(
        collection(db, "vitals"),
        where("patientId", "in", assignedPatients)
      );
      const vitalsUnsubscribe = onSnapshot(
        vitalsQuery,
        async (snapshot) => {
          const tbody = document.querySelector("#vitals-table tbody");
          tbody.innerHTML = "";
          const vitalsData = [];
          for (const doc of snapshot.docs) {
            const vital = doc.data();
            const creatorDoc = await getDoc(
              doc(db, "nurses", vital.recordedBy)
            );
            const creatorName = creatorDoc.exists()
              ? `${creatorDoc.data().firstName} ${creatorDoc.data().lastName}`
              : "Unknown";
            let downloadUrl = "";
            if (vital.filePath) {
              try {
                downloadUrl = await getDownloadURL(
                  ref(storage, vital.filePath)
                );
              } catch (error) {
                console.error("Error fetching download URL:", error);
              }
            }
            vitalsData.push({
              id: doc.id,
              patientId: vital.patientId,
              heartRate: `${vital.heartRate} bpm`,
              bloodPressure: vital.bloodPressure,
              temperature: `${vital.temperature} °C`,
              date: vital.timestamp?.toDate().toLocaleString() || "N/A",
              recordedBy: creatorName,
              file: downloadUrl
                ? `<a href="${downloadUrl}" target="_blank" class="btn">Download</a>`
                : "None",
            });
          }
          vitalsData.forEach((data) => {
            const row = document.createElement("tr");
            row.innerHTML = `
            <td class="patientId">${data.patientId}</td>
            <td class="heartRate">${data.heartRate}</td>
            <td class="bloodPressure">${data.bloodPressure}</td>
            <td class="temperature">${data.temperature}</td>
            <td class="date">${data.date}</td>
            <td class="recordedBy">${data.recordedBy}</td>
            <td>${data.file}</td>
          `;
            tbody.appendChild(row);
          });
          initVitalsTable();
        },
        (error) => {
          console.error("Error fetching vitals:", error);
          showError("Failed to load vitals: " + error.message);
        }
      );
      vitalsSection.dataset.vitalsUnsubscribe = vitalsUnsubscribe;

      // Load tasks
      const tasksQuery = query(
        collection(db, "tasks"),
        where("assignedTo", "==", user.uid),
        where("status", "==", "pending")
      );
      const tasksUnsubscribe = onSnapshot(
        tasksQuery,
        (snapshot) => {
          const tbody = document.querySelector("#tasks-table tbody");
          tbody.innerHTML = "";
          const tasksData = [];
          snapshot.forEach((doc) => {
            const task = doc.data();
            tasksData.push({
              id: doc.id,
              description: task.description,
              patientId: task.patientId,
              status: task.status,
              actions: `<button class="btn complete-task" data-id="${doc.id}" ${
                task.status === "pending" ? "" : "disabled"
              }>Complete</button>`,
            });
          });
          tasksData.forEach((data) => {
            const row = document.createElement("tr");
            row.innerHTML = `
            <td class="description">${data.description}</td>
            <td class="patientId">${data.patientId}</td>
            <td class="status">${data.status}</td>
            <td>${data.actions}</td>
          `;
            tbody.appendChild(row);
          });
          initTasksTable();
          document.querySelectorAll(".complete-task").forEach((btn) => {
            btn.addEventListener("click", async () => {
              const id = btn.dataset.id;
              try {
                await updateDoc(doc(db, "tasks", id), {
                  status: "completed",
                  updatedAt: serverTimestamp(),
                });
                showSuccess("Task completed successfully!");
              } catch (error) {
                console.error("Error completing task:", error);
                showError("Failed to complete task: " + error.message);
              }
            });
          });
        },
        (error) => {
          console.error("Error fetching tasks:", error);
          showError("Failed to load tasks: " + error.message);
        }
      );
      tasksSection.dataset.tasksUnsubscribe = tasksUnsubscribe;
    }

    loadNurseProfile(user.uid, user.email);
  } catch (err) {
    console.error("Error loading dashboard:", err);
    showError("Failed to load dashboard: " + err.message);
  } finally {
    hideLoading();
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
