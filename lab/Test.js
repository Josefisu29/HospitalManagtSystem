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
    if (idTokenResult.claims.role !== 'lab_attendant') {
      await signOut(auth);
      showError("Unauthorized access. Redirecting to login...");
      setTimeout(() => window.location.href = "/index.html", 2000);
      return;
    }

    if (!checkNetworkAndLoad()) return;

    const userDoc = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDoc);

    const testsQuery = query(
      collection(db, "lab_tests"),
      where("status", "==", "pending")
    );

    onSnapshot(testsQuery, async (snapshot) => {
      const testsList = document.getElementById("tests-list");
      testsList.innerHTML = "";
      for (const doc of snapshot.docs) {
        const test = doc.data();
        const patientDoc = await getDoc(doc(db, "users", test.patientId));
        const doctorDoc = await getDoc(doc(db, "users", test.doctorId));
        const patientName = patientDoc.exists() ? `${patientDoc.data().firstName} ${patientDoc.data().lastName}` : "Unknown";
        const doctorName = doctorDoc.exists() ? `${doctorDoc.data().firstName} ${doctorDoc.data().lastName}` : "Unknown";
        const li = document.createElement("li");
        li.textContent = `Test ID: ${doc.id}, Patient: ${patientName}, Doctor: ${doctorName}, Type: ${test.testType}`;
        const acceptBtn = document.createElement("button");
        acceptBtn.textContent = "Accept";
        acceptBtn.onclick = () => acceptTest(doc.id);
        li.appendChild(acceptBtn);
        const rejectBtn = document.createElement("button");
        rejectBtn.textContent = "Reject";
        rejectBtn.onclick = () => rejectTest(doc.id);
        li.appendChild(rejectBtn);
        testsList.appendChild(li);
      }
    });

    const greetEl = document.getElementById("greeting");
    const hour = new Date().getHours();
    const sal = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
    greetEl.textContent = `${sal}, ${userSnap.exists() ? userSnap.data().firstName : "Lab Attendant"}`;
  } catch (err) {
    console.error("Error loading test requests:", err);
    showError("Failed to load test requests: " + err.message);
  } finally {