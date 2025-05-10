import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCpMkpU9YeB3HNpzk0_fwswSf9TQwb_Xdg",
  authDomain: "hospitalmanagtsystem.firebaseapp.com",
  projectId: "hospitalmanagtsystem",
  storageBucket: "hospitalmanagtsystem.firsebasestorage.app",
  messagingSenderId: "771158568788",
  appId: "1:771158568788:web:e47f16ea2577fa1e8762c1",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export async function checkAuth(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === "firstResponder") {
          callback(user);
        } else {
          window.location.href = "/index.html";
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        window.location.href = "/index.html";
      }
    } else {
      window.location.href = "/index.html";
    }
  });
}

export function updateGreeting(userData) {
  const greetEl = document.getElementById("userGreeting");
  if (!greetEl) {
    console.error("Greeting element not found");
    return;
  }
  const hour = new Date().getHours();
  const sal =
    hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  greetEl.textContent = `${sal}, ${userData.firstName || "Responder"}`;
}
