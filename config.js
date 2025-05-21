// config.js
export const firebaseConfig = {
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

function watchCollection(path, { queryFn = null, onData }) {
  let qRef = collection(db, path);
  if (queryFn) qRef = queryFn(qRef);
  return onSnapshot(
    qRef,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => {
      console.error(`❌ [${path}]`, err);
      showError(`Failed to load ${path} data`);
    }
  );
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/index.html";
    return;
  }

  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      throw new Error("User document not found");
    }

    const userData = userDoc.data();
    if (userData.role !== "firstResponder") {
      await signOut(auth);
      window.location.href = "/unauthorized.html";
      return;
    }

    // Continue with authorized user flow
  } catch (error) {
    console.error("Auth error:", error);
    showError("Authentication failed");
    await signOut(auth);
    window.location.href = "/index.html";
  }
});

async function loadData() {
  showLoading();
  try {
    // Load data
  } catch (error) {
    showError("Failed to load data");
  } finally {
    hideLoading();
  }
}
