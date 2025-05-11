{/* <script type="module"> */}
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
    updateDoc,
    Timestamp,
    onSnapshot,
  } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
  import {
    showLoading,
    hideLoading,
    showError,
    showSuccess,
  } from "./js/common.js";

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
  const auth = getAuth(app);
  const db = getFirestore(app);

  // Populate form with user data
  function populateForm(userData) {
    const greetEl = document.getElementById("greeting");
    const hour = new Date().getHours();
    const sal =
      hour < 12
        ? "Good Morning"
        : hour < 18
        ? "Good Afternoon"
        : "Good Evening";
    greetEl.textContent = `${sal}, ${userData.firstName || "User"}`;

    document.getElementById("patientId").value = userData.patientId || "";
    document.getElementById("firstName").value = userData.firstName || "";
    document.getElementById("lastName").value = userData.lastName || "";
    document.getElementById("dateOfBirth").value = userData.dateOfBirth
      ? userData.dateOfBirth.toDate().toISOString().split("T")[0]
      : "";
    document.getElementById("gender").value = userData.gender || "";
    document.getElementById("address").value = userData.address || "";
    document.getElementById("phone").value = userData.phone || "";
    document.getElementById("email").value = userData.email || "";
    document.getElementById("allergies").value = userData.allergies || "";
    document.getElementById("medications").value = userData.medications || "";
    document.getElementById("medicalHistory").value = userData.medicalHistory || "";
    document.getElementById("emergencyContact").value = userData.emergencyContact || "";
  }

  let unsubscribeSnapshot; // Store the unsubscribe function for onSnapshot

  // Handle authentication state changes
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      showLoading();
      try {
        const userDocRef = doc(db, "users", user.uid);

        // Initial data load
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          populateForm(userDocSnap.data());
        }

        // Real-time updates
        unsubscribeSnapshot = onSnapshot(
          userDocRef,
          (snap) => {
            if (snap.exists()) {
              populateForm(snap.data());
            }
          },
          (err) => {
            console.error("Snapshot error:", err);
            showError("Failed to sync profile data.");
          }
        );
      } catch (err) {
        console.error("Error loading user data:", err);
        showError("Failed to load user data. Please try again.");
      } finally {
        hideLoading();
      }
    } else {
      window.location.href = "/index.html";
    }
  });

  // Handle form submission
  document.getElementById("profileForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    showLoading();
    try {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const formData = {
          firstName: document.getElementById("firstName").value,
          lastName: document.getElementById("lastName").value,
          dateOfBirth: document.getElementById("dateOfBirth").value
            ? Timestamp.fromDate(new Date(document.getElementById("dateOfBirth").value))
            : null,
          gender: document.getElementById("gender").value,
          address: document.getElementById("address").value,
          phone: document.getElementById("phone").value,
          allergies: document.getElementById("allergies").value,
          medications: document.getElementById("medications").value,
          medicalHistory: document.getElementById("medicalHistory").value,
          emergencyContact: document.getElementById("emergencyContact").value,
        };

        await updateDoc(userDocRef, formData);
        showSuccess("Profile updated successfully!");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      showError("Failed to save profile. Please try again.");
    } finally {
      hideLoading();
    }
  });

  // Update system status indicator
  const statusDot = document.getElementById("statusIndicator");
  async function updateStatus() {
    try {
      const res = await fetch("/api/system-status");
      const { status } = await res.json();
      statusDot.className = "status-indicator " + (status || "offline");
    } catch {
      statusDot.className = "status-indicator offline";
    }
  }
  setInterval(updateStatus, 15000);
  updateStatus();

  // Mobile navigation toggle
  const navToggle = document.getElementById("navToggle");
  const navMenu = document.getElementById("navMenu");
  navToggle.addEventListener("click", () => {
    navMenu.classList.toggle("open");
  });

  // Highlight active navigation link
  document.querySelectorAll(".nav-menu a").forEach((a) => {
    if (window.location.pathname.endsWith(a.getAttribute("href"))) {
      a.classList.add("active");
    }
  });

  // Handle logout
  document.getElementById("logoutBtn").addEventListener("click", async () => {
    showLoading();
    try {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot(); // Properly unsubscribe from real-time listener
      }
      await signOut(auth);
      window.location.href = "/index.html";
    } catch (error) {
      console.error("Error signing out:", error);
      showError("Failed to sign out. Please try again.");
    } finally {
      hideLoading();
    }
  });
// </script>