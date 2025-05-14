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
