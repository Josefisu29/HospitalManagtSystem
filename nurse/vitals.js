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
  addDoc,
  serverTimestamp,
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

function checkNetworkAndLoad() {
  if (!navigator.onLine) {
    showError("No internet connection. Please check your network.");
    hideLoading();
    return false;
  }
  return true;
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
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
    const assignedPatients = userSnap.exists()
      ? userSnap.data().assignedPatients || []
      : [];

    if (assignedPatients.length === 0) {
      showError("No patients assigned to you.");
      return;
    }

    const vitalsQuery = query(
      collection(db, "vitals"),
      where("patientId", "in", assignedPatients)
    );

    onSnapshot(vitalsQuery, (snapshot) => {
      const vitalsList = document.getElementById("vitals-list");
      vitalsList.innerHTML = "";
      snapshot.forEach((doc) => {
        const vital = doc.data();
        const li = document.createElement("li");
        li.textContent = `Patient ${vital.patientId}: HR=${vital.heartRate}, BP=${vital.bloodPressure}, Temp=${vital.temperature} °C`;
        vitalsList.appendChild(li);
      });
    });

    const greetEl = document.getElementById("greeting");
    const hour = new Date().getHours();
    const sal =
      hour < 12
        ? "Good Morning"
        : hour < 18
        ? "Good Afternoon"
        : "Good Evening";
    greetEl.textContent = `${sal}, ${
      userSnap.exists() ? userSnap.data().firstName : "Nurse"
    }`;
  } catch (err) {
    console.error("Error loading vitals:", err);
    showError("Failed to load vitals data: " + err.message);
  } finally {
    hideLoading();
  }
});

window.recordVitals = async function () {
  if (!checkNetworkAndLoad()) return;

  showLoading();
  try {
    const patientId = document.getElementById("patientId").value;
    const heartRate = parseInt(document.getElementById("heartRate").value);
    const bloodPressure = document.getElementById("bloodPressure").value;
    const temperature = parseFloat(
      document.getElementById("temperature").value
    );

    if (!patientId || !heartRate || !bloodPressure || !temperature) {
      throw new Error("All fields are required.");
    }

    await addDoc(collection(db, "vitals"), {
      patientId,
      heartRate,
      bloodPressure,
      temperature,
      timestamp: serverTimestamp(),
    });

    showSuccess("Vitals recorded successfully!");
    document.getElementById("patientId").value = "";
    document.getElementById("heartRate").value = "";
    document.getElementById("bloodPressure").value = "";
    document.getElementById("temperature").value = "";
  } catch (error) {
    console.error("Error recording vitals:", error);
    showError("Failed to record vitals: " + error.message);
  } finally {
    hideLoading();
  }
};

document.getElementById("logoutBtn").addEventListener("click", async () => {
  if (!checkNetworkAndLoad()) return;

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
