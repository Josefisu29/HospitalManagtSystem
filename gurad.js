// guard.js
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

const auth = getAuth();

/**
 * Reusable guard: checks auth + custom‑claim role, shows/hides UI, runs onSuccess.
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

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      loginEl && (loginEl.style.display = "block");
      appEl && (appEl.style.display = "none");
      return;
    }
    try {
      const { claims } = await user.getIdTokenResult(true);
      if (claims.role !== role) {
        await signOut(auth);
        return (window.location.href = unauthorizedPath);
      }
      loginEl && (loginEl.style.display = "none");
      appEl && (appEl.style.display = "block");
      onSuccess(user);
    } catch (err) {
      console.error("Guard error:", err);
      await signOut(auth);
      window.location.href = loginPath;
    }
  });
}

// ====== Role‑specific init stubs ======
// Fill these in on each page or import from other modules.

export function initAdminPage() {
  /* loadDashboard() etc. */
}
export function initDoctorPage() {
  /* loadDoctorAppointments() */
}
export function initNursePage() {
  /* loadVitals() etc. */
}
export function initPharmacistPage() {
  /* loadInventory() */
}
export function initLabPage() {
  /* loadLabTests() */
}
export function initReceptionPage() {
  /* loadAllAppointments() */
}
export function initResponderPage() {
  /* listenToHelpRequests() */
}
export function initRecordClerkPage() {
  /* loadRecords() */
}
export function initHospitalStaffPage() {
  /* lookupPatient() */
}
export function initPatientPage() {
  /* loadPatientAppointments() */
}
if (idRes.claims.role === "admin") {
  document.getElementById("login-box").style.display = "none";
  document.getElementById("admin-dashboard").style.display = "block";
  loadDashboard();
}
