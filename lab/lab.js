import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import {
  showLoading,
  hideLoading,
  showError,
  showSuccess,
} from "../js/common.js";

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

// UI Elements
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error-message");
const successEl = document.getElementById("success-message");
const statusDot = document.getElementById("statusIndicator");
const testsList = document.getElementById("tests-list");
const testModal = document.getElementById("testModal");
const testForm = document.getElementById("testForm");
const cancelTestBtn = document.getElementById("cancelTestBtn");
const profileModal = document.getElementById("profileModal");
const profileForm = document.getElementById("profileForm");
const profileBtn = document.getElementById("profileBtn");
const cancelProfileBtn = document.getElementById("cancelProfileBtn");
const modalCloseButtons = document.querySelectorAll(".modal-close");

let currentUser = null;
let editingTestId = null;

// Utility Functions
function showLoading() {
  loadingEl.style.display = "block";
}

function hideLoading() {
  loadingEl.style.display = "none";
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.style.display = "block";
  setTimeout(() => {
    errorEl.style.display = "none";
  }, 5000);
}

function showSuccess(message) {
  successEl.textContent = message;
  successEl.style.display = "block";
  setTimeout(() => {
    successEl.style.display = "none";
  }, 5000);
}

function openModal(modal) {
  modal.classList.add("is-active");
}

function closeModal(modal) {
  modal.classList.remove("is-active");
  if (modal === testModal) {
    testForm.reset();
    editingTestId = null;
  } else if (modal === profileModal) {
    profileForm.reset();
  }
}

async function updateStatus() {
  if (!navigator.onLine) {
    statusDot.className = "status-indicator offline";
    statusDot.title = "Offline";
    return;
  }
  try {
    const res = await fetch(
      "https://us-central1-hospitalmanagtsystem.cloudfunctions.net/systemStatus"
    );
    if (res.ok) {
      const { status } = await res.json();
      statusDot.className = `status-indicator ${
        status === "online" ? "online" : "offline"
      }`;
      statusDot.title = status.charAt(0).toUpperCase() + status.slice(1);
    } else {
      statusDot.className = "status-indicator offline";
      statusDot.title = "Offline";
    }
  } catch {
    statusDot.className = "status-indicator offline";
    statusDot.title = "Offline";
  }
}

// Auth state listener
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/index.html";
    return;
  }
  showLoading();
  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const labAttendantDoc = await getDoc(doc(db, "labAttendants", user.uid));
    if (
      userDoc.exists() &&
      userDoc.data().role === "lab attendant" &&
      labAttendantDoc.exists()
    ) {
      currentUser = { uid: user.uid, ...userDoc.data() };
      const hour = new Date().getHours();
      const sal =
        hour < 12
          ? "Good Morning"
          : hour < 18
          ? "Good Afternoon"
          : "Good Evening";
      document.getElementById(
        "greeting"
      ).textContent = `${sal}, ${currentUser.firstName} `;
      loadTestRequests();
      loadProfile();
      updateStatus();
      setInterval(updateStatus, 15000);
    } else {
      await signOut(auth);
      window.location.href = "/unauthorized.html";
    }
  } catch (error) {
    showError("Failed to verify lab attendant status: " + error.message);
    window.location.href = "/index.html";
  } finally {
    hideLoading();
  }
});

// Load test requests
function loadTestRequests() {
  showLoading();
  const q = query(
    collection(db, "testRequests"),
    where("assignedLabAttendantId", "==", currentUser.uid),
    orderBy("createdAt", "desc")
  );
  onSnapshot(
    q,
    (snapshot) => {
      testsList.innerHTML = "";
      if (snapshot.empty) {
        testsList.innerHTML =
          "<p class='has-text-grey'>No test requests found.</p>";
        hideLoading();
        return;
      }
      snapshot.forEach((doc) => {
        const test = doc.data();
        const li = document.createElement("div");
        li.className = "test-item";
        li.innerHTML = `
        <p><strong>Patient:</strong> ${test.patientName}</p>
        <p><strong>Doctor:</strong> ${test.doctorName}</p>
        <p><strong>Test Type:</strong> ${test.testType}</p>
        <p><strong>Status:</strong> <span class="status-badge ${test.status}">${
          test.status
        }</span></p>
        <p><strong>Created:</strong> ${new Date(
          test.createdAt.seconds * 1000
        ).toLocaleString()}</p>
        <div class="buttons">
          <button class="button is-primary is-small update-btn" data-id="${
            doc.id
          }" ${test.status !== "pending" ? "disabled" : ""}>Update</button>
        </div>
      `;
        testsList.appendChild(li);
      });
      document.querySelectorAll(".update-btn").forEach((btn) => {
        btn.addEventListener("click", () => updateTestRequest(btn.dataset.id));
      });
      hideLoading();
    },
    (error) => {
      showError("Failed to load test requests: " + error.message);
      hideLoading();
    }
  );
}

// Update test request
async function updateTestRequest(testId) {
  showLoading();
  try {
    const docSnap = await getDoc(doc(db, "testRequests", testId));
    if (docSnap.exists()) {
      const test = docSnap.data();
      editingTestId = testId;
      document.getElementById("patientName").value = test.patientName;
      document.getElementById("doctorName").value = test.doctorName;
      document.getElementById("testType").value = test.testType;
      document.getElementById("testStatus").value = test.status;
      document.getElementById("testResults").value = test.results || "";
      openModal(testModal);
    }
  } catch (error) {
    showError("Failed to load test request: " + error.message);
  } finally {
    hideLoading();
  }
}

// Handle test form submission
testForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  showLoading();
  try {
    const status = document.getElementById("testStatus").value;
    const results = document.getElementById("testResults").value.trim();

    if (!status) {
      throw new Error("Status is required.");
    }
    if (status === "completed" && !results) {
      throw new Error("Results are required for completed tests.");
    }

    await updateDoc(doc(db, "testRequests", editingTestId), {
      status,
      results: results || null,
      updatedAt: new Date(),
    });

    showSuccess("Test request updated successfully.");
    closeModal(testModal);
  } catch (error) {
    showError("Failed to update test request: " + error.message);
  } finally {
    hideLoading();
  }
});

// Load profile data
function loadProfile() {
  if (currentUser) {
    document.getElementById("firstName").value = currentUser.firstName || "";
    document.getElementById("lastName").value = currentUser.lastName || "";
    document.getElementById("email").value = currentUser.email || "";
    document.getElementById("phone").value = currentUser.phone || "";
    document.getElementById("role").value = currentUser.role || "lab attendant";
  }
}

// Handle profile form submission
profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  showLoading();
  try {
    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();

    if (!firstName || !lastName || !email) {
      throw new Error("First Name, Last Name, and Email are required.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Invalid email format.");
    }
    if (phone && !/^\+?\d{10,15}$/.test(phone.replace(/\D/g, ""))) {
      throw new Error("Invalid phone number format.");
    }

    await setDoc(
      doc(db, "users", currentUser.uid),
      {
        firstName,
        lastName,
        email,
        phone: phone || null,
        role: currentUser.role,
      },
      { merge: true }
    );

    currentUser = { ...currentUser, firstName, lastName, email, phone };
    const hour = new Date().getHours();
    const sal =
      hour < 12
        ? "Good Morning"
        : hour < 18
        ? "Good Afternoon"
        : "Good Evening";
    document.getElementById("greeting").textContent = `${sal}, ${firstName} `;

    showSuccess("Profile updated successfully.");
    closeModal(profileModal);
  } catch (error) {
    showError("Failed to update profile: " + error.message);
  } finally {
    hideLoading();
  }
});

// Modal open/close handlers
profileBtn.addEventListener("click", () => {
  loadProfile();
  openModal(profileModal);
});
cancelTestBtn.addEventListener("click", () => closeModal(testModal));
cancelProfileBtn.addEventListener("click", () => closeModal(profileModal));
modalCloseButtons.forEach((btn) =>
  btn.addEventListener("click", () => {
    closeModal(btn.closest(".modal"));
  })
);

// Logout handler
document.getElementById("logoutBtn").addEventListener("click", async () => {
  showLoading();
  try {
    await signOut(auth);
    window.location.href = "/index.html";
  } catch (error) {
    showError("Failed to sign out: " + error.message);
  } finally {
    hideLoading();
  }
});

// Network status handlers
window.addEventListener("online", updateStatus);
window.addEventListener("offline", () => {
  statusDot.className = "status-indicator offline";
  statusDot.title = "Offline";
});
// import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
// import {
//   getAuth,
//   onAuthStateChanged,
//   signOut,
// } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
// import {
//   getFirestore,
//   collection,
//   query,
//   where,
//   onSnapshot,
//   doc,
//   updateDoc,
//   setDoc,
//   getDoc,
//   Timestamp,
// } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
// import {
//   getStorage,
//   ref,
//   uploadBytes,
//   getDownloadURL,
// } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";

// const firebaseConfig = {
//   apiKey: "AIzaSyCpMkpU9YeB3HNpzk0_fwswSf9TQwb_Xdg",
//   authDomain: "hospitalmanagtsystem.firebaseapp.com",
//   projectId: "hospitalmanagtsystem",
//   storageBucket: "hospitalmanagtsystem.firsebasestorage.app",
//   messagingSenderId: "771158568788",
//   appId: "1:771158568788:web:e47f16ea2577fa1e8762c1",
// };

// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);
// const db = getFirestore(app);
// const storage = getStorage(app);

// let currentUser;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/index.html";
    return;
  }
  try {
    const idTokenResult = await user.getIdTokenResult();
    if (idTokenResult.claims.role !== "lab attendant") {
      showMessage(
        "Access denied. Only lab attendants can access this page.",
        "error"
      );
      await signOut(auth);
      window.location.href = "/unauthorized.html";
      return;
    }
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      currentUser = userData;
      const hour = new Date().getHours();
      const greeting =
        hour < 12
          ? "Good Morning"
          : hour < 18
          ? "Good Afternoon"
          : "Good Evening";
      document.getElementById("greeting").textContent = `${greeting}, ${
        userData.firstName || "Lab Attendant"
      }`;
      loadTestRequests();
    } else {
      showMessage("User profile not found.", "error");
    }
  } catch (error) {
    console.error("Error loading user data:", error);
    showMessage("Failed to load user data.", "error");
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth).then(() => (window.location.href = "/index.html"));
});

document.getElementById("profileBtn").addEventListener("click", () => {
  const modal = document.getElementById("profileModal");
  const form = document.getElementById("profileForm");
  if (currentUser) {
    form.querySelector("#firstName").value = currentUser.firstName || "";
    form.querySelector("#lastName").value = currentUser.lastName || "";
    form.querySelector("#email").value = currentUser.email || "";
    form.querySelector("#phone").value = currentUser.phone || "";
  }
  modal.classList.add("is-active");
});

document.getElementById("profileForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  showLoading(true);
  try {
    const userDocRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userDocRef, {
      firstName: document.getElementById("firstName").value,
      lastName: document.getElementById("lastName").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      updatedAt: Timestamp.now(),
    });
    currentUser = {
      ...currentUser,
      ...document.getElementById("profileForm").elements,
    };
    showMessage("Profile updated successfully.", "success");
    document.getElementById("profileModal").classList.remove("is-active");
  } catch (error) {
    console.error("Error updating profile:", error);
    showMessage("Failed to update profile.", "error");
  } finally {
    showLoading(false);
  }
});

document.getElementById("cancelProfileBtn").addEventListener("click", () => {
  document.getElementById("profileModal").classList.remove("is-active");
});

function loadTestRequests() {
  showLoading(true);
  const testsList = document.getElementById("tests-list");
  const q = query(
    collection(db, "testRequests"),
    where("status", "in", ["pending", "completed", "cancelled"])
  );
  onSnapshot(
    q,
    (snapshot) => {
      testsList.innerHTML = "";
      if (snapshot.empty) {
        testsList.innerHTML =
          "<p class='has-text-grey'>No test requests found.</p>";
      } else {
        snapshot.forEach((docSnap) => {
          const test = docSnap.data();
          const patientDoc = getDoc(doc(db, "users", test.patientId)).then(
            (snap) => snap.data()
          );
          const doctorDoc = getDoc(
            doc(db, "doctors", test.doctorId || test.patientId)
          ).then((snap) => snap.data());
          Promise.all([patientDoc, doctorDoc])
            .then(([patient, doctor]) => {
              const testItem = document.createElement("div");
              testItem.className = "test-item box";
              testItem.innerHTML = `
            <p><strong>Patient:</strong> ${patient?.firstName} ${
                patient?.lastName
              }</p>
            <p><strong>Doctor:</strong> ${doctor?.firstName} ${
                doctor?.lastName || "N/A"
              }</p>
            <p><strong>Test Type:</strong> ${test.testType}</p>
            <p><strong>Date:</strong> ${test.date.toDate().toLocaleString()}</p>
            <p><strong>Status:</strong> <span class="status-badge ${
              test.status
            }">${test.status}</span></p>
            <button class="button is-info is-small mt-2" data-id="${
              docSnap.id
            }">Update</button>
          `;
              testsList.appendChild(testItem);
            })
            .catch((error) => {
              console.error("Error fetching user/doctor data:", error);
              testsList.innerHTML +=
                "<p class='has-text-danger'>Error loading test data.</p>";
            });
        });
      }
      showLoading(false);
    },
    (error) => {
      console.error("Error loading test requests:", error);
      testsList.innerHTML =
        "<p class='has-text-danger'>Failed to load test requests.</p>";
      showLoading(false);
    }
  );
}

document.getElementById("tests-list").addEventListener("click", (e) => {
  if (e.target.tagName === "BUTTON" && e.target.classList.contains("is-info")) {
    const testId = e.target.dataset.id;
    showLoading(true);
    getDoc(doc(db, "testRequests", testId))
      .then((docSnap) => {
        if (docSnap.exists()) {
          const test = docSnap.data();
          const modal = document.getElementById("testModal");
          document.getElementById(
            "patientName"
          ).value = `${test.patientFirstName} ${test.patientLastName}`;
          document.getElementById("doctorName").value = `${
            test.doctorFirstName
          } ${test.doctorLastName || "N/A"}`;
          document.getElementById("testType").value = test.testType;
          document.getElementById("testStatus").value = test.status;
          document.getElementById("testResults").value = test.results || "";
          modal.classList.add("is-active");
          modal.dataset.testId = testId;
        } else {
          showMessage("Test request not found.", "error");
        }
        showLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching test:", error);
        showMessage("Failed to load test request.", "error");
        showLoading(false);
      });
  }
});

document.getElementById("testForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  showLoading(true);
  const testId = document.getElementById("testModal").dataset.testId;
  const status = document.getElementById("testStatus").value;
  const results = document.getElementById("testResults").value;
  const fileInput = document.getElementById("resultFile");
  let filePath = null;

  try {
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const storageRef = ref(storage, `testResults/${testId}/${file.name}`);
      await uploadBytes(storageRef, file);
      filePath = await getDownloadURL(storageRef);
    }

    const testRef = doc(db, "testRequests", testId);
    await updateDoc(testRef, {
      status,
      results: results || filePath || "No results provided",
      updatedAt: Timestamp.now(),
      filePath,
    });
    showMessage("Test request updated successfully.", "success");
    document.getElementById("testModal").classList.remove("is-active");
    fileInput.value = "";
    loadTestRequests();
  } catch (error) {
    console.error("Error updating test request:", error);
    showMessage("Failed to update test request.", "error");
  } finally {
    showLoading(false);
  }
});

document.getElementById("cancelTestBtn").addEventListener("click", () => {
  document.getElementById("testModal").classList.remove("is-active");
  document.getElementById("resultFile").value = "";
});

document.getElementById("cancelProfileBtn").addEventListener("click", () => {
  document.getElementById("profileModal").classList.remove("is-active");
});

function showLoading(show) {
  document.getElementById("loading").style.display = show ? "flex" : "none";
}

function showMessage(message, type) {
  const msgElement = document.getElementById(
    type === "error" ? "error-message" : "success-message"
  );
  msgElement.textContent = message;
  msgElement.style.display = "block";
  setTimeout(() => (msgElement.style.display = "none"), 5000);
}

window.addEventListener("online", () => {
  document.getElementById("statusIndicator").className =
    "status-indicator online";
});
window.addEventListener("offline", () => {
  document.getElementById("statusIndicator").className =
    "status-indicator offline";
});
document.getElementById("statusIndicator").className = navigator.onLine
  ? "status-indicator online"
  : "status-indicator offline";
  import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
  import {
    getAuth,
    onAuthStateChanged,
    signOut,
  } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
  import {
    getFirestore,
    collection,
    query,
    where,
    onSnapshot,
    doc,
    updateDoc,
    getDoc,
    Timestamp,
  } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
  import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
  } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";
  
  // const firebaseConfig = {
  //   apiKey: "AIzaSyCpMkpU9YeB3HNpzk0_fwswSf9TQwb_Xdg",
  //   authDomain: "hospitalmanagtsystem.firebaseapp.com",
  //   projectId: "hospitalmanagtsystem",
  //   storageBucket: "hospitalmanagtsystem.firsebasestorage.app",
  //   messagingSenderId: "771158568788",
  //   appId: "1:771158568788:web:e47f16ea2577fa1e8762c1",
  // };
  
  // const app = initializeApp(firebaseConfig);
  // const auth = getAuth(app);
  // const db = getFirestore(app);
  // const storage = getStorage(app);
  
  // let currentUser;
  
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "/index.html";
      return;
    }
    try {
      const idTokenResult = await user.getIdTokenResult();
      if (idTokenResult.claims.role !== "lab attendant") {
        showMessage("Access denied. Only lab attendants can access this page.", "error");
        await signOut(auth);
        window.location.href = "/unauthorized.html";
        return;
      }
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        currentUser = userDoc.data();
        const hour = new Date().getHours();
        const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
        document.getElementById("greeting").textContent = `${greeting}, ${currentUser.firstName || "Lab Attendant"}`;
        populateProfileForm();
        setupTabSwitching();
        loadTestRequests();
      } else {
        showMessage("User profile not found.", "error");
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      showMessage("Failed to load user data.", "error");
    }
  });
  
  function setupTabSwitching() {
    const tabs = document.querySelectorAll(".tabs li");
    const contents = document.querySelectorAll(".tab-content");
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("is-active"));
        contents.forEach(c => c.classList.remove("active"));
        tab.classList.add("is-active");
        document.getElementById(`${tab.dataset.tab}-content`).classList.add("active");
      });
    });
  }
  
  function populateProfileForm() {
    const form = document.getElementById("profileForm");
    form.querySelector("#firstName").value = currentUser.firstName || "";
    form.querySelector("#lastName").value = currentUser.lastName || "";
    form.querySelector("#email").value = currentUser.email || "";
    form.querySelector("#phone").value = currentUser.phone || "";
    document.getElementById("profilePictureName").textContent = currentUser.photoURL ? "Current image selected" : "No file selected";
    const preview = document.getElementById("profilePreview");
    preview.src = currentUser.photoURL || "";
    preview.style.display = currentUser.photoURL ? "block" : "none";
  }
  
  document.getElementById("logoutBtn").addEventListener("click", () => {
    signOut(auth).then(() => (window.location.href = "/index.html"));
  });
  
  document.getElementById("profileForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    showLoading(true);
    const form = e.target;
    if (!form.checkValidity()) {
      form.reportValidity();
      showLoading(false);
      return;
    }
  
    const firstName = form.querySelector("#firstName").value;
    const lastName = form.querySelector("#lastName").value;
    const email = form.querySelector("#email").value;
    const phone = form.querySelector("#phone").value;
    const fileInput = form.querySelector("#profilePicture");
    let photoURL = currentUser.photoURL || null;
  
    try {
      if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const storageRef = ref(storage, `profiles/${auth.currentUser.uid}/${file.name}`);
        await uploadBytes(storageRef, file);
        photoURL = await getDownloadURL(storageRef);
      }
  
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userDocRef, {
        firstName,
        lastName,
        email,
        phone,
        photoURL,
        updatedAt: Timestamp.now(),
      });
      currentUser = { ...currentUser, firstName, lastName, email, phone, photoURL };
      showMessage("Profile updated successfully.", "success");
      populateProfileForm(); // Refresh form with updated data
    } catch (error) {
      console.error("Error updating profile:", error);
      showMessage("Failed to update profile.", "error");
    } finally {
      showLoading(false);
    }
  });
  
  document.getElementById("profilePicture").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      document.getElementById("profilePictureName").textContent = file.name;
      const preview = document.getElementById("profilePreview");
      preview.src = URL.createObjectURL(file);
      preview.style.display = "block";
    }
  });
  
  document.getElementById("cancelProfileBtn").addEventListener("click", () => {
    populateProfileForm(); // Reset to current data
    const tabs = document.querySelectorAll(".tabs li");
    const contents = document.querySelectorAll(".tab-content");
    tabs.forEach(t => t.classList.remove("is-active"));
    contents.forEach(c => c.classList.remove("active"));
    document.querySelector('[data-tab="test-requests"]').classList.add("is-active");
    document.getElementById("test-requests-content").classList.add("active");
  });
  
  function loadTestRequests() {
    showLoading(true);
    const testsList = document.getElementById("tests-list");
    const q = query(collection(db, "testRequests"), where("status", "in", ["pending", "completed", "cancelled"]));
    onSnapshot(q, (snapshot) => {
      testsList.innerHTML = "";
      if (snapshot.empty) {
        testsList.innerHTML = "<p class='has-text-grey'>No test requests found.</p>";
      } else {
        snapshot.forEach((docSnap) => {
          const test = docSnap.data();
          const patientDoc = getDoc(doc(db, "users", test.patientId)).then((snap) => snap.data());
          const doctorDoc = getDoc(doc(db, "doctors", test.doctorId || test.patientId)).then((snap) => snap.data());
          Promise.all([patientDoc, doctorDoc]).then(([patient, doctor]) => {
            const testItem = document.createElement("div");
            testItem.className = "test-item box";
            testItem.innerHTML = `
              <p><strong>Patient:</strong> ${patient?.firstName} ${patient?.lastName}</p>
              <p><strong>Doctor:</strong> ${doctor?.firstName} ${doctor?.lastName || "N/A"}</p>
              <p><strong>Test Type:</strong> ${test.testType}</p>
              <p><strong>Date:</strong> ${test.date.toDate().toLocaleString()}</p>
              <p><strong>Status:</strong> <span class="status-badge ${test.status}">${test.status}</span></p>
              <button class="button is-info is-small mt-2" data-id="${docSnap.id}">Update</button>
            `;
            testsList.appendChild(testItem);
          }).catch((error) => {
            console.error("Error fetching user/doctor data:", error);
            testsList.innerHTML += "<p class='has-text-danger'>Error loading test data.</p>";
          });
        });
      }
      showLoading(false);
    }, (error) => {
      console.error("Error loading test requests:", error);
      testsList.innerHTML = "<p class='has-text-danger'>Failed to load test requests.</p>";
      showLoading(false);
    });
  }
  
  document.getElementById("tests-list").addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON" && e.target.classList.contains("is-info")) {
      const testId = e.target.dataset.id;
      showLoading(true);
      getDoc(doc(db, "testRequests", testId)).then((docSnap) => {
        if (docSnap.exists()) {
          const test = docSnap.data();
          const modal = document.getElementById("testModal");
          document.getElementById("patientName").value = `${test.patientFirstName} ${test.patientLastName}`;
          document.getElementById("doctorName").value = `${test.doctorFirstName} ${test.doctorLastName || "N/A"}`;
          document.getElementById("testType").value = test.testType;
          document.getElementById("testStatus").value = test.status;
          document.getElementById("testResults").value = test.results || "";
          modal.classList.add("is-active");
          modal.dataset.testId = testId;
        } else {
          showMessage("Test request not found.", "error");
        }
        showLoading(false);
      }).catch((error) => {
        console.error("Error fetching test:", error);
        showMessage("Failed to load test request.", "error");
        showLoading(false);
      });
    }
  });
  
  document.getElementById("testForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    showLoading(true);
    const testId = document.getElementById("testModal").dataset.testId;
    const status = document.getElementById("testStatus").value;
    const results = document.getElementById("testResults").value;
    const fileInput = document.getElementById("resultFile");
    let filePath = null;
  
    try {
      if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const storageRef = ref(storage, `testResults/${testId}/${file.name}`);
        await uploadBytes(storageRef, file);
        filePath = await getDownloadURL(storageRef);
      }
  
      const testRef = doc(db, "testRequests", testId);
      await updateDoc(testRef, {
        status,
        results: results || filePath || "No results provided",
        updatedAt: Timestamp.now(),
        filePath,
      });
      showMessage("Test request updated successfully.", "success");
      document.getElementById("testModal").classList.remove("is-active");
      fileInput.value = "";
      loadTestRequests();
    } catch (error) {
      console.error("Error updating test request:", error);
      showMessage("Failed to update test request.", "error");
    } finally {
      showLoading(false);
    }
  });
  
  document.getElementById("cancelTestBtn").addEventListener("click", () => {
    document.getElementById("testModal").classList.remove("is-active");
    document.getElementById("resultFile").value = "";
  });
  
  function showLoading(show) {
    document.getElementById("loading").style.display = show ? "flex" : "none";
  }
  
  function showMessage(message, type) {
    const msgElement = document.getElementById(type === "error" ? "error-message" : "success-message");
    msgElement.textContent = message;
    msgElement.style.display = "block";
    setTimeout(() => (msgElement.style.display = "none"), 5000);
  }
  
  window.addEventListener("online", () => {
    document.getElementById("statusIndicator").className = "status-indicator online";
  });
  window.addEventListener("offline", () => {
    document.getElementById("statusIndicator").className = "status-indicator offline";
  });
  document.getElementById("statusIndicator").className = navigator.onLine
    ? "status-indicator online"
    : "status-indicator offline";