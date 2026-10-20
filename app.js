/* ================= CONFIGURACIÓN (edita esto) ================= */
const CONFIG = {
  // Tu número con indicativo de país, sin + ni espacios. Ej: Colombia -> "573001234567"
  whatsapp: "",
  // Lugar de la cena
  place: "Por confirmar",
  // Fecha del evento (año, mes 0-11, día, hora, min)
  date: new Date(2026, 9, 27, 19, 0, 0),
  // Opcional: URL de Google Apps Script para guardar confirmaciones en una hoja (ver README)
  sheetsUrl: ""
};
/* ============================================================== */

const $ = (s) => document.querySelector(s);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const show = (id) => {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  $(id).classList.add("active");
};
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/* ---------- Fondo: lluvia de código + luciérnagas ---------- */
(function bg() {
  const c = $("#bg"), x = c.getContext("2d");
  let w, h, cols, drops;
  const chars = "01{}<>/;=()[]$#";
  const fit = () => {
    w = c.width = innerWidth; h = c.height = innerHeight;
    cols = Math.floor(w / 18);
    drops = Array.from({ length: cols }, () => Math.random() * h / 18);
  };
  fit(); addEventListener("resize", fit);
  const sparks = Array.from({ length: 30 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 2 + .5, s: Math.random() * .0006 + .0002, p: Math.random() * 6 }));
  (function loop(t) {
    x.fillStyle = "rgba(5, 9, 20, .12)"; x.fillRect(0, 0, w, h);
    x.font = "14px JetBrains Mono, monospace";
    drops.forEach((d, i) => {
      x.fillStyle = Math.random() > .97 ? "#e8fff4" : "rgba(0, 229, 255, .35)";
      x.fillText(chars[(Math.random() * chars.length) | 0], i * 18, d * 18);
      drops[i] = d * 18 > h && Math.random() > .975 ? 0 : d + .35;
    });
    sparks.forEach((s) => {
      s.y -= s.s * 16; if (s.y < 0) s.y = 1;
      const a = .5 + Math.sin(t / 700 + s.p) * .5;
      x.beginPath(); x.fillStyle = `rgba(232, 194, 106, ${a})`;
      x.shadowColor = "#e8c26a"; x.shadowBlur = 12;
      x.arc(s.x * w + Math.sin(t / 1500 + s.p) * 20, s.y * h, s.r, 0, 7); x.fill(); x.shadowBlur = 0;
    });
    requestAnimationFrame(loop);
  })(0);
})();

/* ---------- Efecto de tipeo ---------- */
async function typeInto(el, text, speed = 22, append = false) {
  if (!append) el.textContent = "";
  for (const ch of text) { el.textContent += ch; await sleep(speed); }
}

/* ---------- Arranque ---------- */
const guests = window.GUESTS;
const params = new URLSearchParams(location.search);
let guest = guests.find((g) => g.id === norm(params.get("i") || ""));

async function boot() {
  const log = $("#bootLog");
  const lines = [
    "> iniciando sistema de invitaciones v1.0...",
    "> cargando módulo: cena_de_grado.exe",
    guest ? `> verificando credenciales de ${guest.name}...` : "> credenciales no detectadas...",
  ];
  for (const l of lines) { await typeInto(log, l + "\n", 12, true); await sleep(250); }
  if (guest) {
    await typeInto(log, "> [OK] acceso concedido ✔\n", 14, true);
    await sleep(600);
    return showEnvelope();
  }
  $("#lookup").hidden = false;
  $("#nameInput").focus();
}

$("#nameInput").addEventListener("input", (e) => {
  const q = norm(e.target.value), box = $("#lookupMsg");
  box.innerHTML = "";
  if (q.length < 2) return;
  const hits = guests.filter((g) => norm(g.name).includes(q) && g.id !== "diego");
  if (!hits.length) { box.textContent = "> sin resultados. Pídele tu link a Diego."; return; }
  hits.forEach((g) => {
    const b = document.createElement("button");
    b.type = "button"; b.textContent = "> " + g.name;
    b.onclick = () => { guest = g; history.replaceState(null, "", "?i=" + g.id); $("#lookup").hidden = true; boot2(); };
    box.appendChild(b);
  });
});
$("#lookup").addEventListener("submit", (e) => { e.preventDefault(); const b = $("#lookupMsg button"); if (b) b.click(); });
async function boot2() { await typeInto($("#bootLog"), `> [OK] acceso concedido: ${guest.name} ✔\n`, 14, true); await sleep(500); showEnvelope(); }

/* ---------- Sobre ---------- */
function showEnvelope() {
  $("#envName").textContent = guest.name;
  $("#envRel").textContent = guest.rel;
  show("#envelopeScreen");
}
let opened = false;
async function openEnvelope() {
  if (opened) return; opened = true;
  const env = $("#envelope");
  env.classList.add("open");
  $(".hint.small").style.visibility = "hidden";
  await sleep(2200);
  env.classList.add("leave");
  await sleep(500);
  showCard();
}
$("#envelope").addEventListener("click", openEnvelope);
$("#envelope").addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") openEnvelope(); });

/* ---------- Carta ---------- */
async function showCard() {
  $("#familyTag").textContent = guest.family || guest.rel;
  $("#greet").textContent = `${guest.g === "f" ? "Querida" : "Querido"} ${guest.name.split(" ")[0]},`;
  $("#place").textContent = CONFIG.place;
  renderState();
  show("#cardScreen");
  await sleep(1000);
  await typeInto($("#msg"), `${guest.msg}\n\nTe invito a mi cena de grado como Ingeniero de Sistemas. Será un honor compartir este momento contigo.`, 18);
  $("#msg").classList.add("done");
}

/* ---------- Cuenta regresiva ---------- */
function tick() {
  let d = Math.max(0, CONFIG.date - Date.now());
  const p = (n) => String(n).padStart(2, "0");
  $("#cd-d").textContent = p(Math.floor(d / 864e5));
  $("#cd-h").textContent = p(Math.floor(d / 36e5) % 24);
  $("#cd-m").textContent = p(Math.floor(d / 6e4) % 60);
  $("#cd-s").textContent = p(Math.floor(d / 1e3) % 60);
}
tick(); setInterval(tick, 1000);

/* ---------- Confirmación ---------- */
const key = () => "rsvp:" + guest.id;
const saved = () => { try { return localStorage.getItem(key()); } catch (e) { return null; } };

function renderState() {
  const s = saved(), st = $("#status");
  if (!s) { $("#actions").hidden = false; st.hidden = true; return; }
  $("#actions").hidden = true; st.hidden = false;
  st.innerHTML = (s === "yes" ? "✔ Asistencia confirmada. ¡Nos vemos el 27!" : "Respuesta registrada. Gracias por avisar.") +
    '<button id="change">cambiar respuesta</button>';
  $("#change").onclick = () => { try { localStorage.removeItem(key()); } catch (e) {} renderState(); };
}

function respond(answer) {
  try { localStorage.setItem(key(), answer); } catch (e) {}
  const text = answer === "yes"
    ? `¡Hola Diego! Soy ${guest.name}. ✅ Confirmo mi asistencia a tu cena de grado el martes 27 de octubre a las 7:00 PM. ¡Felicitaciones, ingeniero! 🎓`
    : `Hola Diego, soy ${guest.name}. Lamentablemente no podré asistir a tu cena de grado, pero te mando un abrazo y muchas felicitaciones. 🎓`;

  if (CONFIG.sheetsUrl) {
    fetch(CONFIG.sheetsUrl, { method: "POST", mode: "no-cors", body: JSON.stringify({ id: guest.id, name: guest.name, answer, at: new Date().toISOString() }) }).catch(() => {});
  }
  renderState();
  if (answer === "yes") confetti();
  // Abre WhatsApp con el mensaje listo para enviar
  setTimeout(() => window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`, "_blank"), answer === "yes" ? 900 : 200);
}
$("#yes").onclick = () => respond("yes");
$("#no").onclick = () => respond("no");

/* ---------- Confeti de código ---------- */
function confetti() {
  const set = ["0", "1", "{ }", "</>", "🎓", "✔"];
  for (let i = 0; i < 40; i++) {
    const e = document.createElement("span");
    e.textContent = set[(Math.random() * set.length) | 0];
    Object.assign(e.style, {
      position: "fixed", left: Math.random() * 100 + "vw", top: "-30px", zIndex: 9, pointerEvents: "none",
      color: Math.random() > .5 ? "#00e5ff" : "#e8c26a", fontSize: 14 + Math.random() * 16 + "px",
      transition: `transform ${2 + Math.random() * 2}s ease-in, opacity 3s`,
    });
    document.body.appendChild(e);
    requestAnimationFrame(() => { e.style.transform = `translateY(${innerHeight + 60}px) rotate(${Math.random() * 720}deg)`; e.style.opacity = 0; });
    setTimeout(() => e.remove(), 4500);
  }
}

boot();
