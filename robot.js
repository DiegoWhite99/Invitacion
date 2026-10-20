/* Escena 3D (Three.js): fondo con geometrías flotantes + BIT, el mini robot agente que narra.
   Expone window.BIT = { say(texto, {mood}), wave(), celebrate(), toggleMute() } */
(function () {
  const bubble = document.getElementById("bubble");
  const bubbleText = document.getElementById("bubbleText");
  const muteBtn = document.getElementById("mute");
  const T = window.THREE;

  const S = { talking: false, muted: false, mx: 0, my: 0, waveUntil: 0, celebrateAt: -1e9 };
  const now = () => performance.now() / 1000;

  /* ================= Narración ================= */
  let sayId = 0, revealTimer;
  function pickVoice() {
    const vs = ("speechSynthesis" in window) ? speechSynthesis.getVoices() : [];
    return vs.find((v) => /^es[-_](MX|CO|US|419)/i.test(v.lang)) || vs.find((v) => v.lang.toLowerCase().startsWith("es")) || null;
  }
  if ("speechSynthesis" in window) speechSynthesis.onvoiceschanged = () => {};

  function say(text, opts = {}) {
    const id = ++sayId;
    clearInterval(revealTimer);
    bubble.classList.add("on");
    bubbleText.textContent = "";
    const est = Math.max(1600, text.length * 66);
    let i = 0;
    revealTimer = setInterval(() => {
      bubbleText.textContent = text.slice(0, ++i);
      if (i >= text.length) clearInterval(revealTimer);
    }, Math.max(12, (est * 0.8) / text.length));
    S.talking = true;
    if (opts.mood === "wave") wave();
    const t0 = Date.now();

    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return; done = true;
        // tiempo mínimo para que alcance a leerse aunque el navegador no tenga voz
        const wait = Math.max(0, est * 0.5 - (Date.now() - t0));
        setTimeout(() => { if (id === sayId) S.talking = false; resolve(); }, wait);
      };
      const tts = !S.muted && "speechSynthesis" in window && speechSynthesis.getVoices().length > 0;
      if (tts) {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        const v = pickVoice();
        u.lang = v ? v.lang : "es-MX"; if (v) u.voice = v;
        u.pitch = 1.5; u.rate = 1.03;
        u.onend = finish; u.onerror = finish;
        speechSynthesis.speak(u);
        setTimeout(finish, est * 2 + 3000);
      } else {
        setTimeout(finish, est);
      }
    });
  }

  function toggleMute() {
    S.muted = !S.muted;
    muteBtn.textContent = S.muted ? "🔇" : "🔊";
    muteBtn.setAttribute("aria-label", S.muted ? "Activar voz" : "Silenciar voz");
    if (S.muted && "speechSynthesis" in window) speechSynthesis.cancel();
  }
  muteBtn.addEventListener("click", toggleMute);

  const wave = () => { S.waveUntil = now() + 2.4; };
  const celebrate = () => { S.celebrateAt = now(); };
  window.BIT = { say, wave, celebrate, toggleMute };

  /* ================= 3D ================= */
  if (!T) return;
  let renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas: document.getElementById("bg3d"), alpha: true, antialias: true });
  } catch (e) { return; } // sin WebGL: queda solo la narración con subtítulos
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.z = 10;
  const FOV_K = 2 * Math.tan((40 * Math.PI) / 360) * 10; // alto visible a z=0

  scene.add(new T.AmbientLight(0xffffff, 0.75));
  const sun = new T.DirectionalLight(0xffffff, 0.9); sun.position.set(3, 5, 6); scene.add(sun);
  const cyanLight = new T.PointLight(0x00e5ff, 1.2, 20); cyanLight.position.set(-3, 0, 4); scene.add(cyanLight);

  /* --- fondo --- */
  const bg = new T.Group(); scene.add(bg);
  const wire = (geo, color, pos) => {
    const m = new T.Mesh(geo, new T.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.35 }));
    m.position.set(...pos); bg.add(m); return m;
  };
  const ico = wire(new T.IcosahedronGeometry(2.2, 1), 0x00e5ff, [-5, 2.5, -7]);
  const knot = wire(new T.TorusKnotGeometry(1.5, 0.4, 90, 12), 0xe8c26a, [6, -1.5, -9]);
  const cube = wire(new T.BoxGeometry(1.8, 1.8, 1.8), 0x39ff88, [4.5, 3.5, -5]);
  const pts = new Float32Array(900 * 3);
  for (let i = 0; i < pts.length; i += 3) { pts[i] = (Math.random() - 0.5) * 40; pts[i + 1] = (Math.random() - 0.5) * 24; pts[i + 2] = -Math.random() * 25; }
  const starGeo = new T.BufferGeometry(); starGeo.setAttribute("position", new T.BufferAttribute(pts, 3));
  const stars = new T.Points(starGeo, new T.PointsMaterial({ color: 0x9fdcff, size: 0.06, transparent: true, opacity: 0.8 }));
  bg.add(stars);

  /* --- BIT --- */
  const white = new T.MeshStandardMaterial({ color: 0xe8f1ff, metalness: 0.35, roughness: 0.3 });
  const dark = new T.MeshStandardMaterial({ color: 0x07122a, metalness: 0.6, roughness: 0.15 });
  const cyanMat = new T.MeshBasicMaterial({ color: 0x00e5ff });
  const greenMat = new T.MeshBasicMaterial({ color: 0x39ff88 });
  const goldMat = new T.MeshStandardMaterial({ color: 0xe8c26a, metalness: 0.7, roughness: 0.3 });
  const mesh = (geo, mat, x = 0, y = 0, z = 0, parent) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); (parent || root).add(m); return m; };

  const root = new T.Group(); scene.add(root);
  const body = mesh(new T.SphereGeometry(0.55, 32, 24), white); body.scale.set(1, 1.1, 0.9);
  mesh(new T.TorusGeometry(0.5, 0.04, 8, 32), cyanMat, 0, -0.1, 0).rotation.x = Math.PI / 2; // franja del torso
  const core = mesh(new T.SphereGeometry(0.12, 16, 12), greenMat, 0, 0.1, 0.5); // "núcleo" en el pecho

  const head = new T.Group(); head.position.y = 1.15; root.add(head);
  const shell = mesh(new T.SphereGeometry(0.75, 36, 28), white, 0, 0, 0, head); shell.scale.set(1.15, 0.95, 0.95);
  const visor = mesh(new T.SphereGeometry(0.62, 32, 24), dark, 0, -0.02, 0.4, head); visor.scale.set(1.2, 0.76, 0.55);
  const eyeL = mesh(new T.SphereGeometry(0.11, 16, 12), cyanMat, -0.26, 0.06, 0.74, head);
  const eyeR = mesh(new T.SphereGeometry(0.11, 16, 12), cyanMat, 0.26, 0.06, 0.74, head);
  [eyeL, eyeR].forEach((e) => e.scale.set(1, 1.3, 0.4));
  const mouth = mesh(new T.BoxGeometry(0.26, 0.04, 0.02), greenMat, 0, -0.22, 0.73, head);
  [-1, 1].forEach((s) => { // orejas
    const ear = mesh(new T.CylinderGeometry(0.17, 0.17, 0.12, 20), cyanMat, s * 0.88, 0, 0, head); ear.rotation.z = Math.PI / 2;
  });
  const ant = mesh(new T.CylinderGeometry(0.025, 0.025, 0.4, 8), white, -0.55, 0.78, 0, head); ant.rotation.z = 0.35;
  const antBall = mesh(new T.SphereGeometry(0.09, 12, 10), greenMat, -0.64, 0.98, 0, head);
  // birrete de grado
  const cap = new T.Group(); cap.position.set(0.1, 0.72, 0); cap.rotation.z = -0.1; head.add(cap);
  mesh(new T.CylinderGeometry(0.4, 0.45, 0.2, 20), dark, 0, 0, 0, cap);
  const board = mesh(new T.BoxGeometry(1.25, 0.05, 1.25), dark, 0, 0.13, 0, cap); board.rotation.y = Math.PI / 4;
  mesh(new T.SphereGeometry(0.05, 8, 8), goldMat, 0, 0.17, 0, cap);
  const tasselRope = mesh(new T.CylinderGeometry(0.012, 0.012, 0.5, 6), goldMat, 0.5, 0.0, 0.5, cap);
  mesh(new T.SphereGeometry(0.06, 10, 8), goldMat, 0.5, -0.27, 0.5, cap);
  tasselRope.position.y = -0.1;

  const arms = [-1, 1].map((s) => { // brazos tipo "manos flotantes"
    const g = new T.Group(); g.position.set(s * 0.62, 0.3, 0.05); root.add(g);
    const a = mesh(new T.CylinderGeometry(0.06, 0.06, 0.45, 10), white, 0, -0.25, 0, g);
    mesh(new T.SphereGeometry(0.17, 18, 14), white, 0, -0.52, 0, g);
    g.rotation.z = s * 0.35; return g;
  });
  const ring = mesh(new T.TorusGeometry(0.55, 0.035, 8, 40), cyanMat, 0, -1.0, 0); ring.rotation.x = Math.PI / 2;
  const ring2 = mesh(new T.TorusGeometry(0.38, 0.025, 8, 40), cyanMat, 0, -1.08, 0); ring2.rotation.x = Math.PI / 2;

  /* --- tamaño / posición según pantalla --- */
  let W, H, dock = { x: 0, y: 0, s: 1 };
  function layout() {
    W = innerWidth; H = innerHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    const wpp = FOV_K / H, small = W < 640;
    const sizePx = small ? 120 : 170;
    dock.s = (sizePx * wpp) / 3.0;
    dock.x = ((small ? 66 : 105) - W / 2) * wpp;
    dock.y = ((small ? 74 : 92) - H / 2) * wpp;
    dock.wpp = wpp;
  }
  layout(); addEventListener("resize", layout);

  const pointer = (x, y) => { S.mx = (x / innerWidth) * 2 - 1; S.my = -((y / innerHeight) * 2 - 1); };
  addEventListener("mousemove", (e) => pointer(e.clientX, e.clientY));
  addEventListener("touchmove", (e) => pointer(e.touches[0].clientX, e.touches[0].clientY), { passive: true });

  const ease = (t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
  const t0 = now();
  let nextBlink = 2, blinkEnd = 0;

  function frame() {
    const t = now(), el = t - t0;
    // fondo
    ico.rotation.x = el * 0.1; ico.rotation.y = el * 0.15;
    knot.rotation.x = el * 0.12; knot.rotation.y = el * 0.08;
    cube.rotation.x = el * 0.2; cube.rotation.y = el * 0.17;
    stars.rotation.y = el * 0.01;
    bg.rotation.y += (S.mx * 0.2 - bg.rotation.y) * 0.04;
    bg.rotation.x += (-S.my * 0.12 - bg.rotation.x) * 0.04;

    // entrada: BIT vuela desde arriba a la derecha dando una vuelta
    const k = ease(el / 2);
    const startX = dock.x + 5, startY = dock.y + 5;
    root.position.x = startX + (dock.x - startX) * k;
    root.position.y = startY + (dock.y - startY) * k + Math.sin(t * 2) * 0.06 * dock.s * 3;
    root.scale.setScalar(dock.s * (0.6 + 0.4 * k));
    root.rotation.y = (1 - k) * Math.PI * 4 + Math.sin(t * 0.8) * 0.12;

    // mirar al puntero
    head.rotation.y += (S.mx * 0.7 - head.rotation.y) * 0.08;
    head.rotation.x += (-S.my * 0.35 - head.rotation.x) * 0.08;

    // parpadeo
    if (el > nextBlink) { blinkEnd = el + 0.12; nextBlink = el + 2 + Math.random() * 3; }
    const ey = el < blinkEnd ? 0.1 : 1.3;
    eyeL.scale.y = eyeR.scale.y = ey;

    // hablar
    const talk = S.talking ? 1 : 0;
    mouth.scale.y = 1 + talk * Math.abs(Math.sin(t * 16)) * 6;
    mouth.scale.x = 1 + talk * Math.sin(t * 9) * 0.25;
    head.position.y = 1.15 + talk * Math.abs(Math.sin(t * 8)) * 0.03;
    antBall.scale.setScalar(1 + (talk ? 0.5 : 0.2) * Math.sin(t * 6));
    core.scale.setScalar(1 + 0.25 * Math.sin(t * 3));
    ring.material.opacity = 1; ring.scale.setScalar(1 + 0.05 * Math.sin(t * 4));
    ring2.scale.setScalar(1 + 0.08 * Math.sin(t * 4 + 1));

    // brazos: reposo / saludo / celebración
    const cel = t - S.celebrateAt;
    arms[0].rotation.z = -0.35 - Math.sin(t * 1.6) * 0.05;
    if (t < S.waveUntil) arms[1].rotation.z = 2.6 + Math.sin(t * 12) * 0.35;
    else arms[1].rotation.z += (0.35 - arms[1].rotation.z) * 0.12;
    if (cel >= 0 && cel < 1.8) {
      const c = cel / 1.8;
      root.rotation.y += ease(c) * Math.PI * 4 * (1 - c) * 0.1;
      root.position.y += Math.abs(Math.sin(cel * 7)) * 0.5 * dock.s * 2;
      arms[0].rotation.z = -2.6 - Math.sin(t * 14) * 0.3;
      arms[1].rotation.z = 2.6 + Math.sin(t * 14) * 0.3;
    }

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  frame();
})();
