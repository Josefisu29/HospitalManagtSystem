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
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

const auth = getAuth();

/**
 * Protect a page by Firebase Auth + a custom-claim role.
 *
 * @param {string} role                 Required role name (must match custom claim).
 * @param {object} options
 * @param {string} options.loginContainer       CSS selector for your login UI container.
 * @param {string} options.appContainer         CSS selector for your app UI container.
 * @param {string} options.loginPath            Redirect here if not signed in.
 * @param {string} options.unauthorizedPath     Redirect here if not the correct role.
 * @param {function(firebase.User):void} options.onSuccess  Called once guard passes.
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
  const loginEl = document.querySelector(loginContainer);
  const appEl = document.querySelector(appContainer);

  // Initially hide both until we know state
  if (loginEl) loginEl.style.display = "none";
  if (appEl) appEl.style.display = "none";

  onAuthStateChanged(auth, async (user) => {
    // Not signed in → show login UI
    if (!user) {
      if (loginEl) loginEl.style.display = "block";
      if (appEl) appEl.style.display = "none";
      return;
    }

    try {
      // Force-refresh token to get latest custom claims
      const tokenResult = await user.getIdTokenResult(true);
      const userRole = tokenResult.claims.role;

      // Wrong role → sign out + redirect to “unauthorized”
      if (userRole !== role) {
        await signOut(auth);
        return void (window.location.href = unauthorizedPath);
      }

      // Correct role → show app UI, hide login UI
      if (loginEl) loginEl.style.display = "none";
      if (appEl) appEl.style.display = "block";

      // Run page‑specific initialization
      onSuccess(user);
    } catch (err) {
      console.error("Auth guard error:", err);
      await signOut(auth);
      window.location.href = loginPath;
    }
  });
}

/**
 * Per‑role initialization stubs.
 * Fill these in or import real implementations on each page.
 */
export function initAdminPage(user) {
  // e.g. loadDashboard(user.uid);
}
export function initDoctorPage(user) {
  // e.g. loadDoctorSchedule(user.uid);
}
export function initNursePage(user) {
  // e.g. startVitalsMonitor(user.uid);
}
export function initPharmacistPage(user) {
  // e.g. loadPharmacyInventory();
}
export function initLabPage(user) {
  // e.g. listenToLabRequests();
}
export function initReceptionPage(user) {
  // e.g. loadReceptionSchedule();
}
export function initResponderPage(user) {
  // e.g. listenToEmergencyAlerts();
}
export function initRecordClerkPage(user) {
  // e.g. loadRecordsDashboard();
}
export function initHospitalStaffPage(user) {
  // e.g. loadHospitalReports();
}
export function initPatientPage(user) {
  // e.g. loadPatientProfile(user.uid);
}
