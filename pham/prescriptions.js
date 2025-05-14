import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, collection, query, where, onSnapshot, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { showLoading, hideLoading, showError, showSuccess } from "../js/common.js";

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
    if (idTokenResult.claims.role !== 'pharmacist') {
      await signOut(auth);
      showError("Unauthorized access. Redirecting to login...");
      setTimeout(() => window.location.href = "/index.html", 2000);
      return;
    }

    if (!checkNetworkAndLoad()) return;

    const userDoc = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDoc);

    const prescriptionsQuery = query(
      collection(db, "prescriptions"),
      where("status", "==", "pending")
    );

    onSnapshot(prescriptionsQuery, async (snapshot) => {
      const prescriptionsList = document.getElementById("prescriptions-list");
      prescriptionsList.innerHTML = "";
      for (const doc of snapshot.docs) {
        const prescription = doc.data();
        const patientDoc = await getDoc(doc(db, "users", prescription.patientId));
        const doctorDoc = await getDoc(doc(db, "users", prescription.doctorId));
        const patientName = patientDoc.exists() ? `${patientDoc.data().firstName} ${patientDoc.data().lastName}` : "Unknown";
        const doctorName = doctorDoc.exists() ? `${doctorDoc.data().firstName} ${doctorDoc.data().lastName}` : "Unknown";
        const li = document.createElement("li");
        li.textContent = `Prescription ID: ${doc.id}, Patient: ${patientName}, Doctor: ${doctorName}`;
        const approveBtn = document.createElement("button");
        approveBtn.textContent = "Approve";
        approveBtn.onclick = () => approvePrescription(doc.id);
        li.appendChild(approveBtn);
        const rejectBtn = document.createElement("button");
        rejectBtn.textContent = "Reject";
        rejectBtn.onclick = () => rejectPrescription(doc.id);
        li.appendChild(rejectBtn);
        prescriptionsList.appendChild(li);
      }
    });

    const greetEl = document.getElementById("greeting");
    const hour = new Date().getHours();
    const sal = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
    greetEl.textContent = `${sal}, ${userSnap.exists() ? userSnap.data().firstName : "Pharmacist"}`;
  } catch (err) {
    console.error("Error loading prescriptions:", err);
    showError("Failed to load prescriptions: " + err.message);
  } finally {
    hideLoading();
  }
});

async function approvePrescription(id) {
  if (!checkNetworkAndLoad()) return;

  showLoading();
  try {
    const prescriptionRef = doc(db, "prescriptions", id);
    await updateDoc(prescriptionRef, { status: "approved" });
    showSuccess("Prescription approved!");
  |} catch (error) {
    console.error("Error approving prescription:", error);
    showError("Failed to approve prescription: " + error.message);
  } finally {
    hideLoading();
  }
}

async function rejectPrescription(id) {
  if (!checkNetworkAndLoad()) return;

  showLoading();
  try {
    const prescriptionRef = doc(db, "prescriptions", id);
    await updateDoc(prescriptionRef, { status: "rejected" });
    showSuccess("Prescription rejected!");
  } catch (error) {
    console.error("Error rejecting prescription:", error);
    showError("Failed to reject prescription: " + error.message);
  } finally {
    hideLoading();
  }
}

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