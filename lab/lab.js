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
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
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

// UI Elements
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error-message");
const successEl = document.getElementById("success-message");
const statusDot = document.getElementById("statusIndicator");
const testsList = document.getElementById("tests-list");
const testModal = document.getElementById("testModal");
const testForm = document.getElementById("testForm");
const cancelTestBtn = document.getElementById("cancelTestBtn");
const profileModal = document.getElementById("profileModal");
const profileForm = document.getElementById("profileForm");
const profileBtn = document.getElementById("profileBtn");
const cancelProfileBtn = document.getElementById("cancelProfileBtn");
const modalCloseButtons = document.querySelectorAll(".modal-close");

let currentUser = null;
let editingTestId = null;

// Utility Functions
function showLoading() {
  loadingEl.style.display = "block";
}

function hideLoading() {
  loadingEl.style.display = "none";
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.style.display = "block";
  setTimeout(() => {
    errorEl.style.display = "none";
  }, 5000);
}

function showSuccess(message) {
  successEl.textContent = message;
  successEl.style.display = "block";
  setTimeout(() => {
    successEl.style.display = "none";
  }, 5000);
}

function openModal(modal) {
  modal.classList.add("is-active");
}

function closeModal(modal) {
  modal.classList.remove("is-active");
  if (modal === testModal) {
    testForm.reset();
    editingTestId = null;
  } else if (modal === profileModal) {
    profileForm.reset();
  }
}

async function updateStatus() {
  if (!navigator.onLine) {
    statusDot.className = "status-indicator offline";
    statusDot.title = "Offline";
    return;
  }
  try {
    const res = await fetch(
      "https://us-central1-hospitalmanagtsystem.cloudfunctions.net/systemStatus"
    );
    if (res.ok) {
      const { status } = await res.json();
      statusDot.className = `status-indicator ${
        status === "online" ? "online" : "offline"
      }`;
      statusDot.title = status.charAt(0).toUpperCase() + status.slice(1);
    } else {
      statusDot.className = "status-indicator offline";
      statusDot.title = "Offline";
    }
  } catch {
    statusDot.className = "status-indicator offline";
    statusDot.title = "Offline";
  }
}

// Auth state listener
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/index.html";
    return;
  }
  showLoading();
  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const labAttendantDoc = await getDoc(doc(db, "labAttendants", user.uid));
    if (
      userDoc.exists() &&
      userDoc.data().role === "lab attendant" &&
      labAttendantDoc.exists()
    ) {
      currentUser = { uid: user.uid, ...userDoc.data() };
      const hour = new Date().getHours();
      const sal =
        hour < 12
          ? "Good Morning"
          : hour < 18
          ? "Good Afternoon"
          : "Good Evening";
      document.getElementById(
        "greeting"
      ).textContent = `${sal}, ${currentUser.firstName} `;
      loadTestRequests();
      loadProfile();
      updateStatus();
      setInterval(updateStatus, 15000);
    } else {
      await signOut(auth);
      window.location.href = "/unauthorized.html";
    }
  } catch (error) {
    showError("Failed to verify lab attendant status: " + error.message);
    window.location.href = "/index.html";
  } finally {
    hideLoading();
  }
});

// Load test requests
function loadTestRequests() {
  showLoading();
  const testsList = document.getElementById("tests-list");

  // Create a compound query that combines all requirements
  const q = query(
    collection(db, "testRequests"),
    where("assignedLabAttendantId", "==", currentUser.uid),
    where("status", "in", ["pending", "completed", "cancelled"]),
    orderBy("createdAt", "desc")
  );

  onSnapshot(
    q,
    async (snapshot) => {
      testsList.innerHTML = "";
      if (snapshot.empty) {
        testsList.innerHTML =
          "<p class='has-text-grey'>No test requests found.</p>";
        hideLoading();
        return;
      }

      for (const doc of snapshot.docs) {
        const test = doc.data();
        let clinicalNote = null;

        // Fetch associated clinical note if available
        if (test.medicalRecordId) {
          try {
            const noteDoc = await getDoc(
              doc(db, "clinicalNotes", test.medicalRecordId)
            );
            if (noteDoc.exists()) {
              clinicalNote = noteDoc.data();
            }
          } catch (error) {
            console.error("Error fetching clinical note:", error);
          }
        }

        const li = document.createElement("div");
        li.className = "test-item box";
        li.innerHTML = `
          <div class="columns">
            <div class="column">
              <p><strong>Patient:</strong> ${test.patientName}</p>
              <p><strong>Doctor:</strong> ${test.doctorName}</p>
              <p><strong>Test Type:</strong> ${test.testType}</p>
              <p><strong>Status:</strong> <span class="status-badge ${
                test.status
              }">${test.status}</span></p>
              <p><strong>Created:</strong> ${new Date(
                test.createdAt.seconds * 1000
              ).toLocaleString()}</p>
              ${
                clinicalNote
                  ? `
                <div class="mt-3">
                  <p><strong>Clinical Context:</strong></p>
                  <p><em>Chief Complaint:</em> ${clinicalNote.chiefComplaint}</p>
                  <p><em>Assessment:</em> ${clinicalNote.assessment}</p>
                </div>
              `
                  : ""
              }
            </div>
            <div class="column is-narrow">
              <div class="buttons">
                <button class="button is-primary is-small update-btn" data-id="${
                  doc.id
                }" ${test.status !== "pending" ? "disabled" : ""}>
                  Update
                </button>
                ${
                  test.results
                    ? `
                  <button class="button is-info is-small view-results-btn" data-id="${doc.id}">
                    View Results
                  </button>
                `
                    : ""
                }
              </div>
            </div>
          </div>
        `;
        testsList.appendChild(li);
      }

      // Add event listeners
      document.querySelectorAll(".update-btn").forEach((btn) => {
        btn.addEventListener("click", () => updateTestRequest(btn.dataset.id));
      });
      document.querySelectorAll(".view-results-btn").forEach((btn) => {
        btn.addEventListener("click", () => viewTestResults(btn.dataset.id));
      });
      hideLoading();
    },
    (error) => {
      showError("Failed to load test requests: " + error.message);
      hideLoading();
    }
  );
}

// Update test request
async function updateTestRequest(testId) {
  showLoading();
  try {
    const docSnap = await getDoc(doc(db, "testRequests", testId));
    if (docSnap.exists()) {
      const test = docSnap.data();
      editingTestId = testId;
      document.getElementById("patientName").value = test.patientName;
      document.getElementById("doctorName").value = test.doctorName;
      document.getElementById("testType").value = test.testType;
      document.getElementById("testStatus").value = test.status;
      document.getElementById("testResults").value = test.results || "";
      openModal(testModal);
    }
  } catch (error) {
    showError("Failed to load test request: " + error.message);
  } finally {
    hideLoading();
  }
}

// Handle test form submission
testForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  showLoading();
  try {
    const status = document.getElementById("testStatus").value;
    const results = document.getElementById("testResults").value.trim();

    if (!status) {
      throw new Error("Status is required.");
    }
    if (status === "completed" && !results) {
      throw new Error("Results are required for completed tests.");
    }

    await updateDoc(doc(db, "testRequests", editingTestId), {
      status,
      results: results || null,
      updatedAt: new Date(),
    });

    showSuccess("Test request updated successfully.");
    closeModal(testModal);
  } catch (error) {
    showError("Failed to update test request: " + error.message);
  } finally {
    hideLoading();
  }
});

// Load profile data
function loadProfile() {
  if (currentUser) {
    document.getElementById("firstName").value = currentUser.firstName || "";
    document.getElementById("lastName").value = currentUser.lastName || "";
    document.getElementById("email").value = currentUser.email || "";
    document.getElementById("phone").value = currentUser.phone || "";
    document.getElementById("role").value = currentUser.role || "lab attendant";
  }
}

// Handle profile form submission
profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  showLoading();
  try {
    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();

    if (!firstName || !lastName || !email) {
      throw new Error("First Name, Last Name, and Email are required.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Invalid email format.");
    }
    if (phone && !/^\+?\d{10,15}$/.test(phone.replace(/\D/g, ""))) {
      throw new Error("Invalid phone number format.");
    }

    await setDoc(
      doc(db, "users", currentUser.uid),
      {
        firstName,
        lastName,
        email,
        phone: phone || null,
        role: currentUser.role,
      },
      { merge: true }
    );

    currentUser = { ...currentUser, firstName, lastName, email, phone };
    const hour = new Date().getHours();
    const sal =
      hour < 12
        ? "Good Morning"
        : hour < 18
        ? "Good Afternoon"
        : "Good Evening";
    document.getElementById("greeting").textContent = `${sal}, ${firstName} `;

    showSuccess("Profile updated successfully.");
    closeModal(profileModal);
  } catch (error) {
    showError("Failed to update profile: " + error.message);
  } finally {
    hideLoading();
  }
});

// Modal open/close handlers
profileBtn.addEventListener("click", () => {
  loadProfile();
  openModal(profileModal);
});
cancelTestBtn.addEventListener("click", () => closeModal(testModal));
cancelProfileBtn.addEventListener("click", () => closeModal(profileModal));
modalCloseButtons.forEach((btn) =>
  btn.addEventListener("click", () => {
    closeModal(btn.closest(".modal"));
  })
);

// Logout handler
document.getElementById("logoutBtn").addEventListener("click", async () => {
  showLoading();
  try {
    await signOut(auth);
    window.location.href = "/index.html";
  } catch (error) {
    showError("Failed to sign out: " + error.message);
  } finally {
    hideLoading();
  }
});

// Network status handlers
window.addEventListener("online", updateStatus);
window.addEventListener("offline", () => {
  statusDot.className = "status-indicator offline";
  statusDot.title = "Offline";
});

// Add function to view test results
async function viewTestResults(testId) {
  showLoading();
  try {
    const docSnap = await getDoc(doc(db, "testRequests", testId));
    if (docSnap.exists()) {
      const test = docSnap.data();
      const modal = document.createElement("div");
      modal.className = "modal is-active";
      modal.innerHTML = `
        <div class="modal-background"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="modal-card-title">Test Results</p>
            <button class="delete" aria-label="close"></button>
          </header>
          <section class="modal-card-body">
            <div class="content">
              <p><strong>Patient:</strong> ${test.patientName}</p>
              <p><strong>Test Type:</strong> ${test.testType}</p>
              <p><strong>Date:</strong> ${new Date(
                test.createdAt.seconds * 1000
              ).toLocaleString()}</p>
              <hr>
              <p><strong>Results:</strong></p>
              <p>${test.results}</p>
            </div>
          </section>
          <footer class="modal-card-foot">
            <button class="button" id="closeResultsModal">Close</button>
          </footer>
        </div>
      `;
      document.body.appendChild(modal);

      // Add event listeners for closing the modal
      modal.querySelector(".delete").addEventListener("click", () => {
        modal.remove();
      });
      modal
        .querySelector("#closeResultsModal")
        .addEventListener("click", () => {
          modal.remove();
        });
      modal.querySelector(".modal-background").addEventListener("click", () => {
        modal.remove();
      });
    }
  } catch (error) {
    showError("Failed to load test results: " + error.message);
  } finally {
    hideLoading();
  }
}
