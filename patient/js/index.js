const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

// ── ELEMENTS ───────────────────────────────────────────────────────────────
const loadingEl = document.getElementById("loading");
const statusDot = document.getElementById("statusIndicator");
const form = document.getElementById("profileForm");
const draftKey = "patientProfileDraft";

// Appointment & Rx containers
const apptBody = document.getElementById("appt-list");
const rxBody = document.getElementById("rx-list-patient");

// ── UTIL: Show/Hide loading overlay ────────────────────────────────────────
function showLoading() {
  loadingEl.classList.remove("loading--hidden");
}
function hideLoading() {
  loadingEl.classList.add("loading--hidden");
}

// ── DRAFT STORAGE ──────────────────────────────────────────────────────────
// Hydrate inputs from localStorage
window.addEventListener("DOMContentLoaded", () => {
  const draft = localStorage.getItem(draftKey);
  if (draft) {
    const data = JSON.parse(draft);
    Object.keys(data).forEach((k) => {
      const el = form.elements[k];
      if (el) el.value = data[k];
    });
  }
});
// Auto‑save on every input
form.addEventListener("input", () => {
  const state = Array.from(form.elements)
    .filter((e) => e.name)
    .reduce((o, e) => {
      o[e.name] = e.value;
      return o;
    }, {});
  localStorage.setItem(draftKey, JSON.stringify(state));
});

// ── ON AUTH CHANGE (ROLE‑GUARD + INIT) ────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/index.html";
    return;
  }

  showLoading();
  const uid = user.uid;
  const userRef = doc(db, "users", uid);
  let snap = await getDoc(userRef);
  let data = snap.exists() ? snap.data() : {};

  // → Dynamic Patient ID via RTDB push‑key
  if (!data.patientId) {
    const newId = rtdbPush(rtdbRef(rtdb, "patients")).key;
    await setDoc(userRef, { patientId: newId }, { merge: true });
    data.patientId = newId;
  }

  // → Populate form from Firestore + draft overlay
  Object.entries(data).forEach(([k, v]) => {
    if (form.elements[k])
      form.elements[k].value = v?.toDate
        ? v.toDate().toISOString().split("T")[0]
        : v;
  });
  // field `'email'` readonly already set in HTML

  // → Real‑time listener for live updates of your own user doc
  onSnapshot(userRef, (snap) => {
    if (snap.exists()) {
      const updated = snap.data();
      Object.entries(updated).forEach(([k, v]) => {
        if (form.elements[k])
          form.elements[k].value = v?.toDate
            ? v.toDate().toISOString().split("T")[0]
            : v;
      });
    }
  });

  // → Real‑time appointments
  onSnapshot(
    query(collection(db, "appointments"), where("patientId", "==", uid)),
    (snap) => {
      apptBody.innerHTML = "";
      snap.forEach((d) => {
        const appt = d.data();
        const tr = document.createElement("tr");
        tr.innerHTML = `
              <td>${appt.doctorName || appt.doctorId}</td>
              <td>${appt.date.toDate().toLocaleString()}</td>
              <td>${appt.status}</td>`;
        apptBody.appendChild(tr);
      });
    }
  );

  // → Real‑time prescriptions (fulfilled)
  onSnapshot(
    query(
      collection(db, "prescriptions"),
      where("patientId", "==", uid),
      where("status", "==", "fulfilled")
    ),
    (snap) => {
      rxBody.innerHTML = "";
      snap.forEach((d) => {
        const rx = d.data();
        const li = document.createElement("li");
        li.textContent = `${rx.medication} (${rx.timestamp
          .toDate()
          .toLocaleDateString()})`;
        rxBody.appendChild(li);
      });
    }
  );

  hideLoading();
});

// ── FORM SUBMIT → Firestore WRITE + clear draft ────────────────────────────
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  showLoading();
  const user = auth.currentUser;
  if (!user) {
    showLoading();
    return;
  }

  const userRef = doc(db, "users", user.uid);
  // gather only named fields
  const payload = Array.from(form.elements)
    .filter((e) => e.name && e.name !== "email")
    .reduce((o, e) => {
      o[e.name] =
        e.type === "date" && e.value
          ? serverTimestamp(new Date(e.value))
          : e.value;
      return o;
    }, {});
  payload.updatedAt = serverTimestamp();

  await updateDoc(userRef, payload);
  localStorage.removeItem(draftKey);
  hideLoading();
  alert("Profile saved!");
});
