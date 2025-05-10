// const gpsBtn = document.getElementById('btn-gps-help');
// const callBtn = document.getElementById('btn-call-help');

// // Simple spinner toggle
// function setLoading(button, isLoading) {
//   if (isLoading) {
//     button.setAttribute('disabled', '');
//     button.innerHTML = `<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> <span>Processing…</span>`;
//   } else {
//     button.removeAttribute('disabled');
//   }
// }

// gpsBtn.addEventListener('click', async () => {
//   if (!navigator.geolocation) return alert('Geolocation not supported');
//   setLoading(gpsBtn, true);
//   navigator.geolocation.getCurrentPosition(async pos => {
//     await fetch('/api/request-help', {
//       method: 'POST', headers: {'Content-Type':'application/json'},
//       body: JSON.stringify({ type:'gps', latitude:pos.coords.latitude, longitude:pos.coords.longitude })
//     });
//     alert('Help is on the way!');
//     setLoading(gpsBtn, false);
//   }, () => { alert('Unable to get location'); setLoading(gpsBtn, false); });
// });

// callBtn.addEventListener('click', async () => {
//   setLoading(callBtn, true);
//   const { token } = await fetch('/token').then(r=>r.json());
//   const device = new Twilio.Device(token);
//   device.on('ready', () => device.connect());
// });

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { Device } from "https://sdk.twilio.com/js/client/v2.0/twilio.min.js";

// Firebase
const firebaseConfig = {
  /* your config */
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let patientData = null;

// Populate patient info & keep live-updated
onAuthStateChanged(auth, (user) => {
  if (!user) return (location.href = "/index.html");
  const uref = doc(db, "users", user.uid);
  onSnapshot(uref, (snap) => {
    patientData = snap.data();
  });
});

// GPS Help
document.getElementById("btn-gps-help").onclick = () => {
  if (!navigator.geolocation) return alert("Geolocation not supported");
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      if (!patientData) return alert("Loading…");
      await setDoc(doc(db, "helpRequests" /* auto-id */), {
        patientId: patientData.patientId,
        name: `${patientData.firstName} ${patientData.lastName}`,
        address: patientData.address,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        type: "gps",
        status: "pending",
        timestamp: serverTimestamp(),
      });
      alert("Help request sent via GPS!");
    },
    () => alert("Permission denied or unavailable")
  );
};

// Call Help
document.getElementById("btn-call-help").onclick = async () => {
  if (!patientData) return alert("Loading…");
  // fetch Twilio token from your backend
  const { token } = await fetch("/token").then((r) => r.json());
  const device = new Device(token);
  device.on("ready", () => {
    device.connect({
      params: {
        patientId: patientData.patientId,
        name: `${patientData.firstName} ${patientData.lastName}`,
        address: patientData.address,
      },
    });
  });
  device.on("error", (e) => alert("Call failed: " + e.message));
};
