match /users/{userId} {
    allow read, write: if request.auth != null && request.auth.uid == userId;
    allow read: if request.auth != null && request.auth.token.doctor == true && resource.data.doctorId == request.auth.uid;
  }
  match /doctors/{doctorId} {
    allow read, write: if request.auth != null && request.auth.uid == doctorId && request.auth.token.doctor == true;
  }
  match /appointments/{appointmentId} {
    allow read, write: if request.auth != null && (
      request.auth.uid == resource.data.patientId ||
      (request.auth.token.doctor == true && resource.data.doctorId == request.auth.uid)
    );
  }
  match /medicalRecords/{recordId} {
    allow read: if request.auth != null && (
      request.auth.uid == resource.data.patientId ||
      (request.auth.token.doctor == true && resource.data.doctorId == request.auth.uid) ||
      request.auth.token.clerk == true
    );
    allow write: if request.auth != null && (
      request.auth.token.doctor == true ||
      request.auth.token.clerk == true
    );
  }
  match /invoices/{invoiceId} {
    allow read: if request.auth != null && request.auth.uid == resource.data.patientId;
    allow write: if request.auth != null && (
      request.auth.token.doctor == true ||
      request.auth.token.pharmacist == true
    );
  }
  match /labResults/{resultId} {
    allow read: if request.auth != null && (
      request.auth.uid == resource.data.patientId ||
      (request.auth.token.doctor == true && resource.data.doctorId == request.auth.uid) ||
      request.auth.token.labTechnician == true
    );
    allow write: if request.auth != null && request.auth.token.labTechnician == true;
  }