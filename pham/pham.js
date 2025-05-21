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
  updateDoc,
  getDoc,
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
const profileModal = document.getElementById("profileModal");
const profileForm = document.getElementById("profileForm");
const profileBtn = document.getElementById("profileBtn");
const cancelProfileBtn = document.getElementById("cancelProfileBtn");
const modalCloseBtn = document.querySelector(".modal-close");

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

function openProfileModal() {
  profileModal.classList.add("is-active");
}

function closeProfileModal() {
  profileModal.classList.remove("is-active");
  profileForm.reset();
}

// Auth state listener
let currentUser = null;
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/index.html";
    return;
  }
  showLoading();
  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists() && userDoc.data().role === "pharmacist") {
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
      ).textContent = `${sal}, ${currentUser.firstName}`;
      loadPrescriptions();
      loadProfile();
    } else {
      await signOut(auth);
      window.location.href = "/unauthorized.html";
    }
  } catch (error) {
    showError("Failed to verify pharmacist status: " + error.message);
    window.location.href = "/index.html";
  } finally {
    hideLoading();
  }
});

// Load profile data into form
function loadProfile() {
  if (currentUser) {
    document.getElementById("firstName").value = currentUser.firstName || "";
    document.getElementById("lastName").value = currentUser.lastName || "";
    document.getElementById("email").value = currentUser.email || "";
    document.getElementById("phone").value = currentUser.phone || "";
    document.getElementById("role").value = currentUser.role || "pharmacist";
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

    // Basic validation
    if (!firstName || !lastName || !email) {
      throw new Error("First Name, Last Name, and Email are required.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Invalid email format.");
    }
    if (phone && !/^\+?\d{10,15}$/.test(phone.replace(/\D/g, ""))) {
      throw new Error("Invalid phone number format.");
    }

    // Update profile in Firestore
    await setDoc(
      doc(db, "users", currentUser.uid),
      {
        firstName,
        lastName,
        email,
        phone: phone || null,
        role: currentUser.role, // Preserve role
      },
      { merge: true }
    );

    // Update currentUser and greeting
    currentUser = { ...currentUser, firstName, lastName, email, phone };
    const hour = new Date().getHours();
    const sal =
      hour < 12
        ? "Good Morning"
        : hour < 18
        ? "Good Afternoon"
        : "Good Evening";
    document.getElementById("greeting").textContent = `${sal}, ${firstName}`;

    showSuccess("Profile updated successfully.");
    closeProfileModal();
  } catch (error) {
    showError("Failed to update profile: " + error.message);
  } finally {
    hideLoading();
  }
});

// Load prescriptions in real-time
function loadPrescriptions() {
  showLoading();
  onSnapshot(
    collection(db, "prescriptions"),
    (snapshot) => {
      const list = document.getElementById("prescriptions-list");
      list.innerHTML = "";
      if (snapshot.empty) {
        list.innerHTML = "<p class='has-text-grey'>No prescriptions found.</p>";
        hideLoading();
        return;
      }
      snapshot.forEach((doc) => {
        const prescription = doc.data();
        const div = document.createElement("div");
        div.className = "prescription-item";
        div.innerHTML = `
        <p><strong>Patient:</strong> ${prescription.patientName}</p>
        <p><strong>Medications:</strong> ${
          prescription.medications.length
        } item(s)</p>
        <p><strong>Status:</strong> ${prescription.status}</p>
        <p><strong>Created:</strong> ${new Date(
          prescription.createdAt.seconds * 1000
        ).toLocaleString()}</p>
        <div class="buttons">
          <button class="button is-success approve-btn" data-id="${doc.id}" ${
          prescription.status !== "active" ? "disabled" : ""
        }>Approve</button>
          <button class="button is-danger cancel-btn" data-id="${doc.id}" ${
          prescription.status !== "active" ? "disabled" : ""
        }>Cancel</button>
        </div>
      `;
        list.appendChild(div);
      });
      // Add event listeners for buttons
      document.querySelectorAll(".approve-btn").forEach((btn) => {
        btn.addEventListener("click", () =>
          updatePrescriptionStatus(btn.dataset.id, "completed")
        );
      });
      document.querySelectorAll(".cancel-btn").forEach((btn) => {
        btn.addEventListener("click", () =>
          updatePrescriptionStatus(btn.dataset.id, "cancelled")
        );
      });
      hideLoading();
    },
    (error) => {
      showError("Failed to load prescriptions: " + error.message);
      hideLoading();
    }
  );
}

// Update prescription status
async function updatePrescriptionStatus(prescriptionId, status) {
  showLoading();
  try {
    await updateDoc(doc(db, "prescriptions", prescriptionId), {
      status,
      updatedAt: new Date(),
    });
    showSuccess(`Prescription ${status} successfully.`);
  } catch (error) {
    showError("Failed to update prescription: " + error.message);
  } finally {
    hideLoading();
  }
}

// Modal open/close handlers
profileBtn.addEventListener("click", () => {
  loadProfile();
  openProfileModal();
});

cancelProfileBtn.addEventListener("click", closeProfileModal);
modalCloseBtn.addEventListener("click", closeProfileModal);

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
