// // guard.js
// import {
//   getAuth,
//   onAuthStateChanged,
//   signOut,
// } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// const auth = getAuth();

// /**
//  * Reusable guard: checks auth + custom‑claim role, shows/hides UI, runs onSuccess.
//  */
// export function guardPage(
//   role,
//   {
//     loginContainer,
//     appContainer,
//     loginPath = "/index.html",
//     unauthorizedPath = "/unauthorized.html",
//     onSuccess = () => {},
//   }
// ) {
//   const loginEl = document.querySelector(loginContainer);
//   const appEl = document.querySelector(appContainer);

//   onAuthStateChanged(auth, async (user) => {
//     if (!user) {
//       loginEl && (loginEl.style.display = "block");
//       appEl && (appEl.style.display = "none");
//       return;
//     }
//     try {
//       const { claims } = await user.getIdTokenResult(true);
//       if (claims.role !== role) {
//         await signOut(auth);
//         return (window.location.href = unauthorizedPath);
//       }
//       loginEl && (loginEl.style.display = "none");
//       appEl && (appEl.style.display = "block");
//       onSuccess(user);
//     } catch (err) {
//       console.error("Guard error:", err);
//       await signOut(auth);
//       window.location.href = loginPath;
//     }
//   });
// }

// // ====== Role‑specific init stubs ======
// // Fill these in on each page or import from other modules.

// export function initAdminPage() {
//   /* loadDashboard() etc. */
// }
// export function initDoctorPage() {
//   /* loadDoctorAppointments() */
// }
// export function initNursePage() {
//   /* loadVitals() etc. */
// }
// export function initPharmacistPage() {
//   /* loadInventory() */
// }
// export function initLabPage() {
//   /* loadLabTests() */
// }
// export function initReceptionPage() {
//   /* loadAllAppointments() */
// }
// export function initResponderPage() {
//   /* listenToHelpRequests() */
// }
// export function initRecordClerkPage() {
//   /* loadRecords() */
// }
// export function initHospitalStaffPage() {
//   /* lookupPatient() */
// }
// export function initPatientPage() {
//   /* loadPatientAppointments() */
// }
// if (idRes.claims.role === "admin") {
//   document.getElementById("login-box").style.display = "none";
//   document.getElementById("admin-dashboard").style.display = "block";
//   loadDashboard();
// }

// guard.js
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

/**
 * Protect a page by Firebase Auth + a custom-claim role.
 *
 * @param {string} role                 Required role name (must match custom claim).
 * @param {object} options
 * @param {string} options.loginContainer   CSS selector for your login UI container.
 * @param {string} options.appContainer     CSS selector for your app UI container.
 * @param {string} [options.loginPath]      Redirect here if not signed in.
 * @param {string} [options.unauthorizedPath] Redirect here if not the correct role.
 * @param {function(firebase.User):void} [options.onSuccess]  Called once guard passes.
 */
export function guardPage(
  role,
  {
    loginContainer,
    appContainer,
    loginPath = "/index.html",
    unauthorizedPath = "/unauthorized.html",
    onSuccess = () => {},
  }
) {
  const auth = getAuth();
  const loginEl = document.querySelector(loginContainer);
  const appEl = document.querySelector(appContainer);

  // Hide both until we know the state
  if (loginEl) loginEl.style.display = "none";
  if (appEl) appEl.style.display = "none";

  // Listen for auth changes
  onAuthStateChanged(auth, async (user) => {
    // Not signed in: show login UI
    if (!user) {
      if (loginEl) loginEl.style.display = "block";
      if (appEl) appEl.style.display = "none";
      return;
    }

    try {
      // Ensure we pick up any fresh custom-claim changes
      await user.reload();
      const tokenResult = await user.getIdTokenResult();
      const userRole = tokenResult.claims.role;

      // Wrong role: sign out & redirect
      if (userRole !== role) {
        await signOut(auth);
        window.location.href = unauthorizedPath;
        return;
      }

      // Correct role: show app UI
      if (loginEl) loginEl.style.display = "none";
      if (appEl) appEl.style.display = "block";

      // Call the page’s init function
      onSuccess(user);
    } catch (err) {
      console.error("Auth guard error:", err);
      await signOut(auth);
      window.location.href = loginPath;
    }
  });
}

/**
 * Helper to wire up a login form and guard in one call.
 *
 * @param {object} options
 * @param {string} options.loginFormSelector  CSS selector for your login <form>.
 * @param {string} options.emailInput        CSS selector for the email <input>.
 * @param {string} options.passwordInput     CSS selector for the password <input>.
 * @param {string} options.errorMsgSelector  CSS selector for showing errors.
 * @param {string} options.loginContainer    CSS selector for the login UI wrapper.
 * @param {string} options.appContainer      CSS selector for the app UI wrapper.
 * @param {string} options.role              Required custom-claim role.
 * @param {function(firebase.User):void} options.onSuccess  Called once guard passes.
 * @param {string} [options.unauthorizedPath]
 * @param {string} [options.loginPath]
 */
export function initGuardedLogin({
  loginFormSelector,
  emailInput,
  passwordInput,
  errorMsgSelector,
  loginContainer,
  appContainer,
  role,
  onSuccess,
  unauthorizedPath,
  loginPath,
}) {
  const form = document.querySelector(loginFormSelector);
  const emailEl = document.querySelector(emailInput);
  const passEl = document.querySelector(passwordInput);
  const errorEl = document.querySelector(errorMsgSelector);

  // Wire up form submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.textContent = "";
    try {
      const { user } = await signInWithEmailAndPassword(
        getAuth(),
        emailEl.value,
        passEl.value
      );
      // After sign-in, guardPage’s onAuthStateChanged will handle the rest
    } catch (err) {
      console.error("Login error:", err);
      errorEl.textContent = "Invalid credentials.";
    }
  });

  // Forgot password link (if you have one)
  const forgotLink = form.querySelector("[data-forgot]");
  if (forgotLink) {
    forgotLink.addEventListener("click", async (e) => {
      e.preventDefault();
      const email = prompt("Enter your email for password reset:");
      if (email) {
        try {
          await sendPasswordResetEmail(getAuth(), email);
          alert("Password reset email sent.");
        } catch (err) {
          console.error("Reset error:", err);
          alert("Error: " + err.message);
        }
      }
    });
  }

  // Finally kick off the guard
  guardPage(role, {
    loginContainer,
    appContainer,
    unauthorizedPath,
    loginPath,
    onSuccess,
  });
}

/**
 * Per‑role initialization stubs. Import and override on each page.
 */
export function initAdminPage(user) {}
export function initDoctorPage(user) {}
export function initNursePage(user) {}
export function initPharmacistPage(user) {}
export function initLabPage(user) {}
export function initReceptionPage(user) {}
export function initResponderPage(user) {}
export function initRecordClerkPage(user) {}
export function initHospitalStaffPage(user) {}
export function initPatientPage(user) {}
