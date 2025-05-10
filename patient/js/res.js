const gpsBtn = document.getElementById('btn-gps-help');
const callBtn = document.getElementById('btn-call-help');

// Simple spinner toggle
function setLoading(button, isLoading) {
  if (isLoading) {
    button.setAttribute('disabled', '');
    button.innerHTML = `<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> <span>Processing…</span>`;
  } else {
    button.removeAttribute('disabled');
  }
}

gpsBtn.addEventListener('click', async () => {
  if (!navigator.geolocation) return alert('Geolocation not supported');
  setLoading(gpsBtn, true);
  navigator.geolocation.getCurrentPosition(async pos => {
    await fetch('/api/request-help', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ type:'gps', latitude:pos.coords.latitude, longitude:pos.coords.longitude })
    });
    alert('Help is on the way!');
    setLoading(gpsBtn, false);
  }, () => { alert('Unable to get location'); setLoading(gpsBtn, false); });
});

callBtn.addEventListener('click', async () => {
  setLoading(callBtn, true);
  const { token } = await fetch('/token').then(r=>r.json());
  const device = new Twilio.Device(token);
  device.on('ready', () => device.connect());
});
