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
  getDoc,
  addDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCpMkpU9YeB3HNpzk0_fwswSf9TQwb_Xdg",
  authDomain: "hospitalmanagtsystem.firebaseapp.com",
  projectId: "hospitalmanagtsystem",
  storageBucket: "hospitalmanagtsystem.firebasestorage.app",
  messagingSenderId: "771158568788",
  appId: "1:771158568788:web:e47f16ea2577fa1e8762c1",
  databaseURL: "https://hospitalmanagtsystem-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const loading = document.getElementById("loading");
const errorMessage = document.getElementById("error-message");
const successMessage = document.getElementById("success-message");
const greeting = document.getElementById("greeting");
const prescriptionsList = document.getElementById("prescriptions-list");
const profileBtn = document.getElementById("profileBtn");
const logoutBtn = document.getElementById("logoutBtn");
const profileForm = document.getElementById("profileForm");
const communicationForm = document.getElementById("communicationForm");

// Show Messages
function showMessage(element, message) {
  element.textContent = message;
  element.style.display = "block";
  setTimeout(() => {
    element.style.display = "none";
    element.textContent = "";
  }, 5000);
}

// Authentication Check
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && userDoc.data().role === "pharmacist") {
        greeting.textContent = `Hello, ${userDoc.data().firstName}`;
        loadPrescriptions();
      } else {
        showMessage(errorMessage, "Invalid user role. Please contact support.");
        await signOut(auth);
        window.location.href = "/index.html";
      }
    } catch (error) {
      showMessage(errorMessage, "Error verifying user: " + error.message);
      await signOut(auth);
    }
  } else {
    window.location.href = "/index.html";
  }
});

// Logout
logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "/";
  } catch (error) {
    showMessage(errorMessage, "Failed to log out: " + error.message);
  }
});

// Load Prescriptions
async function loadPrescriptions() {
  try {
    onSnapshot(collection(db, "prescriptions"), async (snapshot) => {
      prescriptionsList.innerHTML = "";
      for (const doc of snapshot.docs) {
        const p = doc.data();
        const patientDoc = await getDoc(doc(db, "users", p.patientId));
        const patientName = patientDoc.exists()
          ? `${patientDoc.data().firstName || "N/A"} ${
              patientDoc.data().lastName || "N/A"
            }`
          : "Unknown";
        const doctorDoc = await getDoc(doc(db, "users", p.doctorId));
        const doctorName = doctorDoc.exists()
          ? `${doctorDoc.data().firstName || "N/A"} ${
              doctorDoc.data().lastName || "N/A"
            }`
          : "Unknown";
        const card = document.createElement("div");
        card.className = "prescription-card";
        card.innerHTML = `
          <p><strong>Patient:</strong> ${patientName}</p>
          <p><strong>Doctor:</strong> ${doctorName}</p>
          <p><strong>Medication:</strong> ${p.medication}</p>
          <p><strong>Dosage:</strong> ${p.dosage}</p>
          <p><strong>Instructions:</strong> ${p.instructions || "N/A"}</p>
          <p><strong>Status:</strong> ${p.status || "Pending"}</p>
          <p><strong>Date:</strong> ${
            p.timestamp?.toDate()?.toLocaleString() || "N/A"
          }</p>
          <button class="btn btn-primary action-btn fill-btn" data-id="${
            doc.id
          }" ${p.status === "filled" ? "disabled" : ""}>Mark as Filled</button>
          <button class="btn btn-secondary action-btn message-btn" data-id="${
            doc.id
          }" data-doctor-id="${
          p.doctorId
        }" data-doctor-name="${doctorName}">Message Doctor</button>
        `;
        prescriptionsList.appendChild(card);
      }
    });
  } catch (error) {
    showMessage(errorMessage, "Failed to load prescriptions: " + error.message);
  }
}

// Handle Prescription Actions
prescriptionsList.addEventListener("click", async (e) => {
  if (e.target.classList.contains("fill-btn")) {
    const id = e.target.dataset.id;
    try {
      await updateDoc(doc(db, "prescriptions", id), {
        status: "filled",
        filledBy: auth.currentUser.uid,
        filledAt: new Date(),
      });
      showMessage(successMessage, "Prescription marked as filled!");
    } catch (error) {
      showMessage(
        errorMessage,
        "Failed to update prescription: " + error.message
      );
    }
  } else if (e.target.classList.contains("message-btn")) {
    const id = e.target.dataset.id;
    const doctorId = e.target.dataset.doctorId;
    const doctorName = e.target.dataset.doctorName;
    document.getElementById("prescriptionId").value = id;
    document.getElementById("doctorId").value = doctorId;
    document.getElementById("doctorName").value = doctorName;
    new bootstrap.Modal(document.getElementById("communicationModal")).show();
  }
});

// Send Message to Doctor
communicationForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loading.style.display = "block";
  const prescriptionId = document.getElementById("prescriptionId").value;
  const doctorId = document.getElementById("doctorId").value;
  const message = document.getElementById("communicationMessage").value;

  try {
    await addDoc(collection(db, "communications"), {
      prescriptionId,
      doctorId,
      pharmacistId: auth.currentUser.uid,
      message,
      timestamp: new Date(),
      status: "sent",
    });
    showMessage(successMessage, "Message sent successfully!");
    bootstrap.Modal.getInstance(
      document.getElementById("communicationModal")
    ).hide();
    communicationForm.reset();
  } catch (error) {
    showMessage(errorMessage, "Failed to send message: " + error.message);
  } finally {
    loading.style.display = "none";
  }
});

// Profile Management
profileBtn.addEventListener("click", async () => {
  try {
    const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
    if (userDoc.exists()) {
      const user = userDoc.data();
      document.getElementById("phamId").value = user.phamId || "";
      document.getElementById("firstName").value = user.firstName || "";
      document.getElementById("lastName").value = user.lastName || "";
      document.getElementById("email").value = user.email || "";
      document.getElementById("phone").value = user.phone || "";
      new bootstrap.Modal(document.getElementById("profileModal")).show();
    }
  } catch (error) {
    showMessage(errorMessage, "Failed to load profile: " + error.message);
  }
});

profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loading.style.display = "block";
  const profileData = {
    phamId: document.getElementById("phamId").value,
    firstName: document.getElementById("firstName").value,
    lastName: document.getElementById("lastName").value,
    phone: document.getElementById("phone").value,
    updatedAt: new Date(),
  };

  try {
    await updateDoc(doc(db, "users", auth.currentUser.uid), profileData);
    showMessage(successMessage, "Profile updated successfully!");
    bootstrap.Modal.getInstance(document.getElementById("profileModal")).hide();
  } catch (error) {
    showMessage(errorMessage, "Failed to update profile: " + error.message);
  } finally {
    loading.style.display = "none";
  }
});
