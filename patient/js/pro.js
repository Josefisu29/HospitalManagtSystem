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

const form = document.getElementById("profileForm");
const draftKey = "profileDraft";

function generateRandomId(length = 6) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function generatePatientId() {
  return `PAT-${generateRandomId(6)}`;
}

function populateForm(data) {
  const greetEl = document.getElementById("greeting");
  const hour = new Date().getHours();
  const sal =
    hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  greetEl.textContent = `${sal}, ${data.firstName || "User"}`;

  Object.entries(data).forEach(([key, value]) => {
    const el = document.getElementById(key);
    if (el) {
      el.value = value?.toDate
        ? value.toDate().toISOString().split("T")[0]
        : value || "";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const draft = localStorage.getItem(draftKey);
  if (draft) {
    try {
      populateForm(JSON.parse(draft));
    } catch (e) {
      console.error("Error loading draft:", e);
    }
  }

  const navToggle = document.getElementById("navToggle");
  const navMenu = document.getElementById("navMenu");
  navToggle.addEventListener("click", () => {
    navMenu.classList.toggle("open");
  });

  document.querySelectorAll(".nav-menu a").forEach((a) => {
    if (window.location.pathname.endsWith(a.getAttribute("href"))) {
      a.classList.add("active");
    }
  });
});

form.addEventListener("input", () => {
  const data = Array.from(form.elements)
    .filter((e) => e.id)
    .reduce((o, e) => ({ ...o, [e.id]: e.value }), {});
  localStorage.setItem(draftKey, JSON.stringify(data));
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/index.html";
    return;
  }

  showLoading();
  let loadingTimeout = setTimeout(hideLoading, 3000);

  try {
    const idTokenResult = await user.getIdTokenResult(true);
    if (idTokenResult.claims.role !== "patient") {
      await signOut(auth);
      showError("Unauthorized access. Redirecting to login...");
      setTimeout(() => (window.location.href = "/index.html"), 2000);
      return;
    }

    const userRef = doc(db, "users", user.uid);
    let snap = await getDoc(userRef);
    let data = snap.exists() ? snap.data() : { email: user.email };

    if (!data.patientId) {
      data.patientId = generatePatientId();
      await setDoc(userRef, { patientId: data.patientId }, { merge: true });
    }

    const draft = localStorage.getItem(draftKey);
    if (draft) {
      data = { ...data, ...JSON.parse(draft) };
    }

    populateForm({ ...data, email: user.email });

    onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        populateForm(snap.data());
      }
    });
  } catch (err) {
    console.error("Error loading user data:", err);
    showError("Failed to load user data. Please try again.");
  } finally {
    clearTimeout(loadingTimeout);
    hideLoading();
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  showLoading();
  let loadingTimeout = setTimeout(hideLoading, 3000);

  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    const userRef = doc(db, "users", user.uid);
    const payload = Array.from(form.elements)
      .filter((el) => el.id && el.id !== "email")
      .reduce((o, el) => {
        o[el.id] =
          el.type === "date" && el.value
            ? Timestamp.fromDate(new Date(el.value))
            : el.value;
        return o;
      }, {});
    payload.updatedAt = serverTimestamp();

    await updateDoc(userRef, payload);
    localStorage.removeItem(draftKey);
    showSuccess(
      navigator.onLine
        ? "Profile saved successfully"
        : "Profile saved locally. Will sync when online."
    );
  } catch (error) {
    console.error("Error saving profile:", error);
    showError("Failed to save profile: " + error.message);
  } finally {
    clearTimeout(loadingTimeout);
    hideLoading();
  }
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  showLoading();
  let loadingTimeout = setTimeout(hideLoading, 3000);
  try {
    await signOut(auth);
    window.location.href = "/index.html";
  } catch (error) {
    console.error("Error signing out:", error);
    showError("Failed to sign out: " + error.message);
  } finally {
    clearTimeout(loadingTimeout);
    hideLoading();
  }
});
