// Inside your onAuthStateChanged → onSuccess branch, call:
function loadDashboard() {
  // USERS
  onSnapshot(collection(db, "users"), (snapshot) => {
    document.getElementById("stat-users").textContent = snapshot.size;
    renderTable("user-table", snapshot.docs, [
      "firstName",
      "lastName",
      "email",
      "role",
    ]);
  });

  // DOCTORS
  onSnapshot(collection(db, "doctors"), (snapshot) => {
    document.getElementById("stat-doctors").textContent = snapshot.size;
    renderTable("doctor-table", snapshot.docs, ["name", "email", "specialty"]);
  });

  // NURSES
  onSnapshot(collection(db, "nurses"), (snapshot) => {
    renderTable("nurse-table", snapshot.docs, [
      "firstName",
      "lastName",
      "email",
    ]);
  });

  // PHARMACISTS
  onSnapshot(collection(db, "pharmacists"), (snapshot) => {
    renderTable("pharmacist-table", snapshot.docs, [
      "firstName",
      "lastName",
      "email",
    ]);
  });

  // LAB ATTENDANTS
  onSnapshot(collection(db, "labAttendants"), (snapshot) => {
    renderTable("lab-table", snapshot.docs, ["firstName", "lastName", "email"]);
  });

  // RECEPTIONISTS
  onSnapshot(collection(db, "receptionists"), (snapshot) => {
    renderTable("receptionist-table", snapshot.docs, [
      "firstName",
      "lastName",
      "email",
    ]);
  });

  // FIRST RESPONDERS
  onSnapshot(collection(db, "firstResponders"), (snapshot) => {
    renderTable("responder-table", snapshot.docs, [
      "firstName",
      "lastName",
      "email",
    ]);
  });

  // RECORD CLERKS
  onSnapshot(collection(db, "recordClerks"), (snapshot) => {
    renderTable("recordclerk-table", snapshot.docs, [
      "firstName",
      "lastName",
      "email",
    ]);
  });

  // HOSPITAL STAFF
  onSnapshot(collection(db, "hospitalStaff"), (snapshot) => {
    renderTable("hospital-table", snapshot.docs, [
      "firstName",
      "lastName",
      "email",
    ]);
  });

  // PATIENTS
  onSnapshot(collection(db, "patients"), (snapshot) => {
    document.getElementById("stat-patients").textContent = snapshot.size || "–";
    renderTable("patient-table", snapshot.docs, [
      "firstName",
      "lastName",
      "email",
    ]);
  });

  // APPOINTMENTS
  onSnapshot(collection(db, "appointments"), (snapshot) => {
    document.getElementById("stat-appointments").textContent = snapshot.size;
    // For appointments we join patient/doctor names:
    renderAppointments(snapshot.docs);
  });

  // SYSTEM LOGS
  onSnapshot(
    query(collection(db, "logs"), orderBy("timestamp", "desc"), limit(20)),
    (snapshot) => {
      const ul = document.getElementById("system-logs");
      ul.innerHTML = "";
      snapshot.forEach((docSnap) => {
        const { message, timestamp } = docSnap.data();
        const li = document.createElement("li");
        li.textContent = `[${timestamp.toDate().toLocaleString()}] ${message}`;
        ul.appendChild(li);
      });
    }
  );
}
/**
 * Renders a generic table with columns for given field names.
 * @param {string} tbodyId
 * @param {QueryDocumentSnapshot[]} docs
 * @param {string[]} fields   keys to display in order
 */
function renderTable(tbodyId, docs, fields) {
  const tbody = document.getElementById(tbodyId);
  tbody.innerHTML = "";
  docs.forEach((docSnap) => {
    const data = docSnap.data();
    const tr = document.createElement("tr");
    // Render each field
    fields.forEach((f) => {
      const td = document.createElement("td");
      td.textContent = data[f] || "";
      tr.appendChild(td);
    });
    // Actions cell
    const actionsTd = document.createElement("td");
    actionsTd.innerHTML = `
        <button class="action-btn edit-btn" data-id="${docSnap.id}" data-collection="${tbodyId}">Edit</button>
        <button class="action-btn delete-btn" data-id="${docSnap.id}" data-collection="${tbodyId}">Delete</button>
      `;
    tr.appendChild(actionsTd);
    tbody.appendChild(tr);
  });
}

/**
 * Special rendering for appointments with patient/doctor lookups.
 */
async function renderAppointments(docs) {
  const tbody = document.getElementById("appointment-table");
  tbody.innerHTML = "";
  for (let docSnap of docs) {
    const { patientId, doctorId, date, status } = docSnap.data();
    // Fetch names (could cache for efficiency)
    const pSnap = await getDoc(doc(db, "patients", patientId));
    const dSnap = await getDoc(doc(db, "doctors", doctorId));
    const patientName = pSnap.exists()
      ? `${pSnap.data().firstName} ${pSnap.data().lastName}`
      : "Unknown";
    const doctorName = dSnap.exists() ? dSnap.data().name : "Unknown";

    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td>${patientName}</td>
        <td>${doctorName}</td>
        <td>${date.toDate().toLocaleString()}</td>
        <td>${status}</td>
        <td>
          <button class="action-btn edit-btn" data-id="${
            docSnap.id
          }" data-collection="appointment-table">Edit</button>
          <button class="action-btn delete-btn" data-id="${
            docSnap.id
          }" data-collection="appointment-table">Delete</button>
        </td>
      `;
    tbody.appendChild(tr);
  }
}
// Open modal on any edit button click
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("edit-btn")) {
    const id = e.target.dataset.id;
    const tbodyId = e.target.dataset.collection; // e.g. "user-table"
    const collMap = {
      "user-table": "users",
      "doctor-table": "doctors",
      "nurse-table": "nurses",
      "pharmacist-table": "pharmacists",
      "lab-table": "labAttendants",
      "receptionist-table": "receptionists",
      "responder-table": "firstResponders",
      "recordclerk-table": "recordClerks",
      "hospital-table": "hospitalStaff",
      "patient-table": "patients",
      "appointment-table": "appointments",
    };
    const collectionName = collMap[tbodyId];
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return alert("Record not found");

    const data = docSnap.data();
    document.getElementById("editDocId").value = id;
    document.getElementById("editCollection").value = collectionName;

    // Build form fields dynamically
    const container = document.getElementById("editFields");
    container.innerHTML = "";
    Object.entries(data).forEach(([key, val]) => {
      // skip Firestore metadata
      if (key === "timestamp" || key === "createdAt" || key === "updatedAt")
        return;
      // create label + input
      const div = document.createElement("div");
      div.className = "form-group";
      div.innerHTML = `
          <label for="field_${key}">${key}</label>
          <input type="text" id="field_${key}" name="${key}" value="${val}">
        `;
      container.appendChild(div);
    });
    document.getElementById("editModal").style.display = "flex";
  }
});

// Submit updated record
document.getElementById("editForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("editDocId").value;
  const coll = document.getElementById("editCollection").value;
  const form = e.target;
  const updates = {};

  // Gather all inputs
  Array.from(form.elements).forEach((el) => {
    if (el.name) updates[el.name] = el.value;
  });
  updates.updatedAt = serverTimestamp();

  // Update Firestore
  await updateDoc(doc(db, coll, id), updates);
  // Optionally log
  await addDoc(collection(db, "logs"), {
    message: `Record ${id} in ${coll} updated by admin`,
    timestamp: serverTimestamp(),
  });
  // Close modal
  document.getElementById("editModal").style.display = "none";
});
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("delete-btn")) {
    const id = e.target.dataset.id;
    const coll = collMap[e.target.dataset.collection];
    if (confirm("Delete this record?")) {
      await deleteDoc(doc(db, coll, id));
      await addDoc(collection(db, "logs"), {
        message: `Record ${id} deleted from ${coll}`,
        timestamp: serverTimestamp(),
      });
    }
  }
});
