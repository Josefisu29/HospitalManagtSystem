// script.js
import { auth } from ".firebase-configue.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// Sign Up
const signupForm = document.getElementById("signup-form");
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = signupForm["signup-email"].value;
  const pass = signupForm["signup-password"].value;
  const confirm = signupForm["signup-confirm"].value;
  if (pass !== confirm) {
    document.getElementById("signup-error").textContent =
      "Passwords must match.";
    document.getElementById("signup-error").style.display = "block";
    return;
  }
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      pass
    );
    console.log("Signed up:", userCredential.user);
    overlay.style.display = "none";
  } catch (error) {
    document.getElementById("signup-error").textContent = error.message;
    document.getElementById("signup-error").style.display = "block";
  }
});

// Login
const loginForm = document.getElementById("login-form");
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = loginForm["login-email"].value;
  const pass = loginForm["login-password"].value;
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    console.log("Signed in:", userCredential.user);
    overlay.style.display = "none";
  } catch (error) {
    document.getElementById("login-error").style.display = "block";
  }
});

// Auth State Observer
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User is signed in:", user.email);
    // Redirect or update UI as needed
  } else {
    console.log("No user signed in");
  }
});

import {
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

const googleBtn = document.getElementById("btn-google");
const provider = new GoogleAuthProvider();

googleBtn.addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    console.log("Google sign in:", result.user);
    overlay.style.display = "none";
    window.location.href = "/patient.html";
  } catch (error) {
    console.error("Google sign-in error:", error);
    alert("Sign-in failed: " + error.message);
  }
});

// Sign-Up
createUserWithEmailAndPassword(auth, email, pass)
  .then((userCredential) => {
    // … store data here …
    // then redirect:
    window.location.href = "patient/reg.html";
  })
  .catch((error) => {
    /* show error */
  });

// Login
signInWithEmailAndPassword(auth, email, pass)
  .then((userCredential) => {
    window.location.href = "patient/reg.html";
  })
  .catch((error) => {
    /* show error */
  });
