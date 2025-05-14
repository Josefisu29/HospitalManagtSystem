import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

const auth = getAuth();

/**
 * Enforces that the current user is signed in and has the given role.
 * If not signed in, shows the login UI; if signed in but wrong role, signs out and redirects.
 *
 * @param {string} role - the required custom‐claim role (e.g. "admin", "doctor", etc.)
 * @param {Object} uiSelectors
 *   - loginContainer: selector for your login form container (to show/hide)
 *   - appContainer:   selector for your main app container (to show/hide)
 *   - loginPath:      URL to redirect to if not authenticated
 *   - unauthorizedPath: URL to redirect to if wrong role
 *   - onSuccess:      callback to invoke once guard passes (e.g. loadDashboard)
 */
export function guardPage(role, {
  loginContainer,
  appContainer,
  loginPath = '/index.html',
  unauthorizedPath = '/unauthorized.html',
  onSuccess = () => {}
}) {
  const loginEl = document.querySelector(loginContainer);
  const appEl   = document.querySelector(appContainer);

  onAuthStateChanged(auth, async user => {
    // Not signed in
    if (!user) {
      if (loginEl) loginEl.style.display = 'block';
      if (appEl)   appEl.style.display = 'none';
      return;
    }

    try {
      // Refresh token to get latest claims
      const idRes = await user.getIdTokenResult(true);
      if (idRes.claims.role !== role) {
        // Wrong role → sign out & redirect
        await signOut(auth);
        window.location.href = unauthorizedPath;
        return;
      }
      // Correct role → hide login, show app, run callback
      if (loginEl) loginEl.style.display = 'none';
      if (appEl)   appEl.style.display = 'block';
      onSuccess(user);
    } catch (err) {
      console.error('Guard error:', err);
      await signOut(auth);
      window.location.href = loginPath;
    }
  });
}
