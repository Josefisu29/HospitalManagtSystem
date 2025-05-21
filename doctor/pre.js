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
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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

const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error-message");
const successEl = document.getElementById("success-message");
const statusDot = document.getElementById("statusIndicator");
const prescriptionForm = document.getElementById("prescriptionForm");
const patientSelect = document.getElementById("patientSelect");
const medicationList = document.getElementById("medicationList");
const addMedicationBtn = document.getElementById("addMedicationBtn");
const closePrescriptionModal = document.getElementById(
  "closePrescriptionModal"
);
const prescriptionModal = document.getElementById("prescriptionModal");
const newPrescriptionBtn = document.getElementById("newPrescriptionBtn");
const patientFilter = document.getElementById("patientFilter");
const statusFilter = document.getElementById("statusFilter");
const profileModal = document.getElementById("profileModal");
const profileForm = document.getElementById("profileForm");
const profileBtn = document.getElementById("profileBtn");
const cancelProfileBtn = document.getElementById("cancelProfileBtn");
const modalCloseButtons = document.querySelectorAll(".modal-close");

let currentUser = null;
let editingPrescriptionId = null;

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
  if (modal === prescriptionModal) {
    prescriptionForm.reset();
    editingPrescriptionId = null;
    document.getElementById("modalTitle").textContent = "New Prescription";
    while (medicationList.children.length > 1) {
      medicationList.lastChild.remove();
    }
    loadMedications();
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
    const doctorDoc = await getDoc(doc(db, "doctors", user.uid));
    if (
      userDoc.exists() &&
      userDoc.data().role === "doctor" &&
      doctorDoc.exists()
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
      ).textContent = `${sal}, Dr. ${currentUser.firstName} `;
      await loadPatients();
      await loadMedications();
      loadPrescriptions();
      loadProfile();
      updateStatus();
      setInterval(updateStatus, 15000);
    } else {
      await signOut(auth);
      window.location.href = "/unauthorized.html";
    }
  } catch (error) {
    showError("Failed to verify doctor status: " + error.message);
    window.location.href = "/index.html";
  } finally {
    hideLoading();
  }
});

// Load patients for dropdowns
async function loadPatients() {
  try {
    const q = query(
      collection(db, "users"),
      where("role", "==", "patient"),
      orderBy("lastName", "asc")
    );
    const snapshot = await getDocs(q);
    const options = ['<option value="">Select a patient</option>'];
    const filterOptions = ['<option value="">All Patients</option>'];
    snapshot.forEach((doc) => {
      const user = doc.data();
      const name = `${user.firstName} ${user.lastName}`;
      options.push(`<option value="${doc.id}">${name}</option>`);
      filterOptions.push(`<option value="${doc.id}">${name}</option>`);
    });
    patientSelect.innerHTML = options.join("");
    patientFilter.innerHTML = filterOptions.join("");
  } catch (error) {
    showError("Failed to load patients: " + error.message);
  }
}

// Load medications for dropdowns
async function loadMedications() {
  try {
    const snapshot = await getDocs(collection(db, "medications"));
    const selects = document.querySelectorAll(".medication-select");
    selects.forEach((select) => {
      select.innerHTML = '<option value="">Select a medication</option>';
      snapshot.forEach((doc) => {
        const med = doc.data();
        const option = document.createElement("option");
        option.value = doc.id;
        option.textContent = `${med.name} (${med.dosage})`;
        select.appendChild(option);
      });
    });
  } catch (error) {
    showError("Failed to load medications: " + error.message);
  }
}

// Add medication field
addMedicationBtn.addEventListener("click", () => {
  const item = document.createElement("div");
  item.className = "medication-item";
  item.innerHTML = `
    <div class="field is-grouped">
      <div class="control is-expanded">
        <div class="select is-fullwidth">
          <select class="medication-select" required>
            <option value="">Select a medication</option>
          </select>
        </div>
      </div>
      <div class="control">
        <button class="button is-danger remove-medication" type="button"><i class="fas fa-trash"></i></button>
      </div>
    </div>
    <div class="field">
      <label class="label">Dosage</label>
      <div class="control">
        <input class="input dosage-input" type="text" placeholder="e.g., 500mg" required>
      </div>
    </div>
    <div class="field">
      <label class="label">Frequency</label>
      <div class="control">
        <input class="input frequency-input" type="text" placeholder="e.g., twice daily" required>
      </div>
    </div>
    <div class="field">
      <label class="label">Duration</label>
      <div class="control">
        <input class="input duration-input" type="text" placeholder="e.g., 7 days" required>
      </div>
    </div>
  `;
  medicationList.appendChild(item);
  loadMedications();
  item.querySelector(".remove-medication").addEventListener("click", () => {
    if (medicationList.children.length > 1) item.remove();
  });
});

// Load prescriptions in table
function loadPrescriptions() {
  showLoading();
  const q = query(
    collection(db, "prescriptions"),
    where("doctorId", "==", currentUser.uid),
    orderBy("createdAt", "desc")
  );
  onSnapshot(
    q,
    (snapshot) => {
      const list = document.getElementById("prescriptionsList");
      if (snapshot.empty) {
        list.innerHTML = "<p>No prescriptions found.</p>";
        hideLoading();
        return;
      }
      let html =
        "<table><thead><tr><th>Date</th><th>Patient</th><th>Medications</th><th>Status</th><th>Valid Until</th><th>Actions</th></tr></thead><tbody>";
      snapshot.forEach((doc) => {
        const prescription = doc.data();
        html += `
        <tr data-id="${doc.id}" data-patient-id="${prescription.patientId}">
          <td>${new Date(
            prescription.createdAt.seconds * 1000
          ).toLocaleDateString()}</td>
          <td>${prescription.patientName}</td>
          <td>${prescription.medications.length} medication(s)</td>
          <td><span class="status-badge ${prescription.status}">${
          prescription.status
        }</span></td>
          <td>${new Date(
            prescription.validUntil.seconds * 1000
          ).toLocaleDateString()}</td>
          <td>
            <button class="button is-info is-small view-btn" data-id="${
              doc.id
            }">View</button>
            <button class="button is-primary is-small edit-btn" data-id="${
              doc.id
            }" ${
          prescription.status !== "active" ? "disabled" : ""
        }>Edit</button>
            <button class="button is-danger is-small delete-btn" data-id="${
              doc.id
            }" ${
          prescription.status !== "active" ? "disabled" : ""
        }>Delete</button>
          </td>
        </tr>
      `;
      });
      html += "</tbody></table>";
      list.innerHTML = html;

      document.querySelectorAll(".view-btn").forEach((btn) => {
        btn.addEventListener("click", () => viewPrescription(btn.dataset.id));
      });
      document.querySelectorAll(".edit-btn").forEach((btn) => {
        btn.addEventListener("click", () => editPrescription(btn.dataset.id));
      });
      document.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", () => deletePrescription(btn.dataset.id));
      });
      applyFilters();
      hideLoading();
    },
    (error) => {
      showError("Failed to load prescriptions: " + error.message);
      hideLoading();
    }
  );
}

// View prescription
async function viewPrescription(prescriptionId) {
  showLoading();
  try {
    const docSnap = await getDoc(doc(db, "prescriptions", prescriptionId));
    if (docSnap.exists()) {
      const prescription = docSnap.data();
      const medDetails = prescription.medications
        .map(
          (med) => `
        <p><strong>${med.name}</strong>: ${med.dosage}, ${med.frequency}, ${med.duration}</p>
      `
        )
        .join("");
      openModal(prescriptionModal);
      prescriptionModal.querySelector(".modal-content").innerHTML = `
        <div class="box">
          <h2 class="title is-4">Prescription Details</h2>
          <p><strong>Patient:</strong> ${prescription.patientName}</p>
          <p><strong>Date:</strong> ${new Date(
            prescription.createdAt.seconds * 1000
          ).toLocaleDateString()}</p>
          <p><strong>Medications:</strong></p>
          ${medDetails}
          <p><strong>Notes:</strong> ${prescription.notes || "None"}</p>
          <p><strong>Status:</strong> ${prescription.status}</p>
          <p><strong>Valid Until:</strong> ${new Date(
            prescription.validUntil.seconds * 1000
          ).toLocaleDateString()}</p>
          <div class="field">
            <button class="button is-light" onclick="document.getElementById('prescriptionModal').classList.remove('is-active')">Close</button>
          </div>
        </div>
      `;
    }
  } catch (error) {
    showError("Failed to load prescription details: " + error.message);
  } finally {
    hideLoading();
  }
}

// Edit prescription
async function editPrescription(prescriptionId) {
  showLoading();
  try {
    const docSnap = await getDoc(doc(db, "prescriptions", prescriptionId));
    if (docSnap.exists()) {
      const prescription = docSnap.data();
      editingPrescriptionId = prescriptionId;
      document.getElementById("modalTitle").textContent = "Edit Prescription";
      patientSelect.value = prescription.patientId;
      document.getElementById("prescriptionNotes").value =
        prescription.notes || "";
      document.getElementById("validUntil").value = new Date(
        prescription.validUntil.seconds * 1000
      )
        .toISOString()
        .split("T")[0];
      while (medicationList.children.length > 1) {
        medicationList.lastChild.remove();
      }
      medicationList.innerHTML = "";
      prescription.medications.forEach((med) => {
        const item = document.createElement("div");
        item.className = "medication-item";
        item.innerHTML = `
          <div class="field is-grouped">
            <div class="control is-expanded">
              <div class="select is-fullwidth">
                <select class="medication-select" required>
                  <option value="">Select a medication</option>
                </select>
              </div>
            </div>
            <div class="control">
              <button class="button is-danger remove-medication" type="button"><i class="fas fa-trash"></i></button>
            </div>
          </div>
          <div class="field">
            <label class="label">Dosage</label>
            <div class="control">
              <input class="input dosage-input" type="text" placeholder="e.g., 500mg" value="${med.dosage}" required>
            </div>
          </div>
          <div class="field">
            <label class="label">Frequency</label>
            <div class="control">
              <input class="input frequency-input" type="text" placeholder="e.g., twice daily" value="${med.frequency}" required>
            </div>
          </div>
          <div class="field">
            <label class="label">Duration</label>
            <div class="control">
              <input class="input duration-input" type="text" placeholder="e.g., 7 days" value="${med.duration}" required>
            </div>
          </div>
        `;
        medicationList.appendChild(item);
        item.querySelector(".medication-select").value = med.id;
        item
          .querySelector(".remove-medication")
          .addEventListener("click", () => {
            if (medicationList.children.length > 1) item.remove();
          });
      });
      loadMedications();
      openModal(prescriptionModal);
    }
  } catch (error) {
    showError("Failed to load prescription: " + error.message);
  } finally {
    hideLoading();
  }
}

// Delete prescription
async function deletePrescription(prescriptionId) {
  if (!confirm("Are you sure you want to delete this prescription?")) return;
  showLoading();
  try {
    await deleteDoc(doc(db, "prescriptions", prescriptionId));
    showSuccess("Prescription deleted successfully.");
  } catch (error) {
    showError("Failed to delete prescription: " + error.message);
  } finally {
    hideLoading();
  }
}

// Handle prescription form submission
prescriptionForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  showLoading();
  try {
    const patientId = patientSelect.value;
    const patientOption = patientSelect.options[patientSelect.selectedIndex];
    const patientName = patientOption ? patientOption.textContent : "";
    const notes = document.getElementById("prescriptionNotes").value.trim();
    const validUntil = document.getElementById("validUntil").value;
    const medications = Array.from(
      medicationList.querySelectorAll(".medication-item")
    ).map((item) => {
      const select = item.querySelector(".medication-select");
      const dosage = item.querySelector(".dosage-input").value.trim();
      const frequency = item.querySelector(".frequency-input").value.trim();
      const duration = item.querySelector(".duration-input").value.trim();
      if (!select.value || !dosage || !frequency || !duration) {
        throw new Error("All medication fields are required.");
      }
      return {
        id: select.value,
        name: select.options[select.selectedIndex].textContent.split(" (")[0],
        dosage,
        frequency,
        duration,
      };
    });

    if (!patientId || !medications.length || !validUntil) {
      throw new Error(
        "Patient, at least one medication, and valid until date are required."
      );
    }

    const prescriptionData = {
      patientId,
      patientName,
      doctorId: currentUser.uid,
      medications,
      notes: notes || null,
      validUntil: Timestamp.fromDate(new Date(validUntil)),
      status: "active",
      updatedAt: Timestamp.now(),
    };

    if (editingPrescriptionId) {
      await updateDoc(
        doc(db, "prescriptions", editingPrescriptionId),
        prescriptionData
      );
      showSuccess("Prescription updated successfully.");
    } else {
      prescriptionData.createdAt = Timestamp.now();
      await addDoc(collection(db, "prescriptions"), prescriptionData);
      showSuccess("Prescription created successfully.");
    }

    closeModal(prescriptionModal);
  } catch (error) {
    showError("Failed to save prescription: " + error.message);
  } finally {
    hideLoading();
  }
});

// Apply patient and status filters
function applyFilters() {
  const patientId = patientFilter.value;
  const status = statusFilter.value;
  const rows = document.querySelectorAll("#prescriptionsList table tbody tr");
  rows.forEach((row) => {
    const rowStatus = row.querySelector(".status-badge").textContent;
    const rowPatientId = row.dataset.patientId;
    row.style.display =
      (!patientId || rowPatientId === patientId) &&
      (status === "all" || rowStatus === status)
        ? ""
        : "none";
  });
}

patientFilter.addEventListener("change", applyFilters);
statusFilter.addEventListener("change", applyFilters);

// Load profile data
function loadProfile() {
  if (currentUser) {
    document.getElementById("firstName").value = currentUser.firstName || "";
    document.getElementById("lastName").value = currentUser.lastName || "";
    document.getElementById("email").value = currentUser.email || "";
    document.getElementById("phone").value = currentUser.phone || "";
    document.getElementById("role").value = currentUser.role || "doctor";
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
    document.getElementById(
      "greeting"
    ).textContent = `${sal}, Dr. ${firstName} `;

    showSuccess("Profile updated successfully.");
    closeModal(profileModal);
  } catch (error) {
    showError("Failed to update profile: " + error.message);
  } finally {
    hideLoading();
  }
});

// Modal open/close handlers
newPrescriptionBtn.addEventListener("click", () =>
  openModal(prescriptionModal)
);
closePrescriptionModal.addEventListener("click", () =>
  closeModal(prescriptionModal)
);
profileBtn.addEventListener("click", () => {
  loadProfile();
  openModal(profileModal);
});
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

window.addEventListener("online", updateStatus);
window.addEventListener("offline", () => {
  statusDot.className = "status-indicator offline";
  statusDot.title = "Offline";
});
