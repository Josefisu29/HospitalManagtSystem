const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.migrateData = functions.https.onRequest(async (req, res) => {
  const rtdb = admin.database();
  const db = admin.firestore();
  const patientsSnapshot = await rtdb.ref('patients').once('value');
  const patients = patientsSnapshot.val();
  for (const patientId in patients) {
    const patient = patients[patientId];
    const [firstName, lastName] = patient.name.split(' ');
    await db.collection('users').doc(patientId).set({
      firstName,
      lastName,
      patientId: patient.id,
      doctorId: null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    for (const apptId in patient.appointments) {
      await db.collection('appointments').doc(apptId).set({
        patientId,
        doctorId: null,
        ...patient.appointments[apptId],
      });
    }
    for (const noteId in patient.notes) {
      await db.collection('clinicalNotes').doc(noteId).set({
        patientId,
        doctorId: null,
        ...patient.notes[noteId],
      });
    }
    for (const recordId in patient.records) {
      await db.collection('medicalRecords').doc(recordId).set({
        patientId,
        doctorId: null,
        ...patient.records[recordId],
      });
    }
    for (const prescriptionId in patient.prescriptions) {
      await db.collection('prescriptions').doc(prescriptionId).set({
        patientId,
        doctorId: null,
        ...patient.prescriptions[prescriptionId],
      });
    }
  }
  res.send('Migration complete');
});

function getAllPatients() {
    const patientsQuery = query(collection(db, 'users'));
    onSnapshot(patientsQuery, (snapshot) => {
      const patients = {};
      snapshot.forEach((doc) => {
        patients[doc.id] = doc.data();
      });
      displayPatients(patients);
    }, (error) => showError('Failed to load patients.'));
  }
  
  function searchPatients(searchTerm) {
    const searchQuery = query(collection(db, 'users'), where('name', '==', searchTerm));
    onSnapshot(searchQuery, (snapshot) => {
      const patients = {};
      snapshot.forEach((doc) => {
        patients[doc.id] = doc.data();
      });
      displayPatients(patients);
    }, (error) => showError('Failed to search patients.'));
  }
  
  function getPatientData(patientId, dataType) {
    let collectionName;
    switch (dataType) {
      case 'appointments': collectionName = 'appointments'; break;
      case 'notes': collectionName = 'clinicalNotes'; break;
      case 'records': collectionName = 'medicalRecords'; break;
      case 'prescriptions': collectionName = 'prescriptions'; break;
      default: return;
    }
    const dataQuery = query(collection(db, collectionName), where('patientId', '==', patientId));
    onSnapshot(dataQuery, (snapshot) => {
      const data = {};
      snapshot.forEach((doc) => {
        data[doc.id] = doc.data();
      });
      displayPatientData(data, dataType);
    }, (error) => showError(`Failed to load ${dataType}.`));
  }
  
  function displayPatients(patients) {
    const patientsList = document.getElementById('patientsList');
    patientsList.innerHTML = '';
    if (patients && Object.keys(patients).length > 0) {
      for (const patientId in patients) {
        const patient = patients[patientId];
        const listItem = document.createElement('li');
        listItem.textContent = `${patient.firstName} ${patient.lastName} - ${patient.patientId}`;
        if (idTokenResult.claims.admin) {
          const assignBtn = document.createElement('button');
          assignBtn.textContent = 'Assign Doctor';
          assignBtn.onclick = () => assignDoctor(patientId);
          listItem.appendChild(assignBtn);
        }
        listItem.addEventListener('click', () => {
          getPatientData(patientId, 'appointments');
          getPatientData(patientId, 'notes');
          getPatientData(patientId, 'records');
          getPatientData(patientId, 'prescriptions');
        });
        patientsList.appendChild(listItem);
      }
    } else {
      patientsList.innerHTML = '<li>No patients found.</li>';
    }
  }
  
  function displayPatientData(data, dataType) {
    const dataContainer = document.getElementById(`${dataType}Container`);
    dataContainer.innerHTML = `<h3>${dataType.charAt(0).toUpperCase() + dataType.slice(1)}</h3>`;
    if (data && Object.keys(data).length > 0) {
      for (const itemId in data) {
        const item = data[itemId];
        const itemElement = document.createElement('div');
        itemElement.textContent = JSON.stringify(item);
        dataContainer.appendChild(itemElement);
      }
    } else {
      dataContainer.innerHTML += `<p>No ${dataType} found.</p>`;
    }
  }
  async function loadDoctorDashboard(doctorId) {
    showLoading();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    try {
      const doctorDoc = await getDoc(doc(db, 'doctors', doctorId));
      if (doctorDoc.exists()) {
        const doctor = doctorDoc.data();
        const hour = new Date().getHours();
        const sal = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
        document.getElementById('greeting').textContent = `${sal}, Dr. ${doctor.firstName || 'Doctor'}`;
      } else {
        showError('Doctor profile not found.');
      }
    } catch (error) {
      showError('Failed to load doctor profile.');
    }
  
    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('doctorId', '==', doctorId),
      where('date', '>=', today),
      where('date', '<', new Date(today.getTime() + 24 * 60 * 60 * 1000)),
      orderBy('date', 'asc'),
      limit(5)
    );
    onSnapshot(appointmentsQuery, (snapshot) => {
      const appointmentsDiv = document.getElementById('upcoming-appointments');
      if (snapshot.empty) {
        appointmentsDiv.innerHTML = '<p>No upcoming appointments today</p>';
        return;
      }
      let html = '<table><thead><tr><th>Time</th><th>Patient</th><th>Type</th><th>Status</th></tr></thead><tbody>';
      snapshot.forEach((doc) => {
        const appointment = doc.data();
        const date = appointment.date.toDate();
        html += `
          <tr>
            <td>${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
            <td>${appointment.patientName}</td>
            <td>${appointment.type}</td>
            <td>${appointment.status}</td>
          </tr>`;
      });
      html += '</tbody></table>';
      appointmentsDiv.innerHTML = html;
    }, (error) => showError('Failed to load appointments.'));
  
    const patientsQuery = query(
      collection(db, 'users'),
      where('doctorId', '==', doctorId),
      orderBy('updatedAt', 'desc'),
      limit(5)
    );
    onSnapshot(patientsQuery, (snapshot) => {
      const patientsDiv = document.getElementById('recent-patients');
      if (snapshot.empty) {
        patientsDiv.innerHTML = '<p>No recent patients</p>';
        return;
      }
      let html = '<table><thead><tr><th>Name</th><th>ID</th><th>Last Updated</th></tr></thead><tbody>';
      snapshot.forEach((doc) => {
        const patient = doc.data();
        html += `
          <tr>
            <td>${patient.firstName} ${patient.lastName}</td>
            <td>${patient.patientId}</td>
            <td>${patient.updatedAt.toDate().toLocaleString()}</td>
          </tr>`;
      });
      html += '</tbody></table>';
      patientsDiv.innerHTML = html;
    }, (error) => showError('Failed to load patients.'));
  
    try {
      const appointmentsCountQuery = query(
        collection(db, 'appointments'),
        where('doctorId', '==', doctorId),
        where('date', '>=', today),
        where('date', '<', new Date(today.getTime() + 24 * 60 * 60 * 1000))
      );
      const appointmentsSnapshot = await getDocs(appointmentsCountQuery);
      document.getElementById('today-appointments').textContent = appointmentsSnapshot.size;
  
      const notesQuery = query(
        collection(db, 'clinicalNotes'),
        where('doctorId', '==', doctorId),
        where('status', '==', 'pending')
      );
      const notesSnapshot = await getDocs(notesQuery);
      document.getElementById('pending-notes').textContent = notesSnapshot.size;
  
      const patientsCountQuery = query(
        collection(db, 'users'),
        where('doctorId', '==', doctorId)
      );
      const patientsSnapshot = await getDocs(patientsCountQuery);
      document.getElementById('active-patients').textContent = patientsSnapshot.size;
    } catch (error) {
      showError('Failed to load dashboard statistics.');
    }
  
    hideLoading();
  }
//   rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//     match /users/{userId} {
//       allow read, write: if request.auth != null && (
//         request.auth.token.admin == true ||
//         (request.auth.token.doctor == true && resource.data.doctorId == request.auth.uid)
//       );
//     }
//     match /appointments/{appointmentId} {
//       allow read, write: if request.auth != null && (
//         request.auth.token.admin == true ||
//         (request.auth.token.doctor == true && resource.data.doctorId == request.auth.uid)
//       );
//     }
//     match /clinicalNotes/{noteId} {
//       allow read, write: if request.auth != null && (
//         request.auth.token.admin == true ||
//         (request.auth.token.doctor == true && resource.data.doctorId == request.auth.uid)
//       );
//     }
//     match /medicalRecords/{recordId} {
//       allow read, write: if request.auth != null && (
//         request.auth.token.admin == true ||
//         (request.auth.token.doctor == true && resource.data.doctorId == request.auth.uid)
//       );
//     }
//     match /prescriptions/{prescriptionId} {
//       allow read, write: if request.auth != null && (
//         request.auth.token.admin == true ||
//         (request.auth.token.doctor == true && resource.data.doctorId == request.auth.uid)
//       );
//     }
//   }
// }
onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = '/login.html';
      return;
    }
    showLoading();
    try {
      const idTokenResult = await user.getIdTokenResult();
      if (idTokenResult.claims.admin) {
        patientsSection.style.display = 'block';
        dashboardSection.style.display = 'none';
        getAllPatients();
      } else if (idTokenResult.claims.doctor) {
        dashboardSection.style.display = 'block';
        patientsSection.style.display = 'none';
        loadDoctorDashboard(user.uid);
      } else {
        showError('Access denied: Invalid role.');
      }
    } catch (error) {
      showError('Failed to verify user role.');
    } finally {
      hideLoading();
    }
  });