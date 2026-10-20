/* Inclinación 3D: el sobre, la carta y el fondo siguen el movimiento del celular
   (giroscopio) o el mouse en computador. Expone window.TILT = { x, y, enable() } (-1..1). */
window.TILT = (() => {
  const T = { x: 0, y: 0 };
  const root = document.documentElement;
  let tx = 0, ty = 0, cx = 0, cy = 0, base = null, useGyro = false;
  const clamp = (v) => Math.max(-1, Math.min(1, v));

  addEventListener("mousemove", (e) => {
    if (useGyro) return;
    tx = (e.clientX / innerWidth) * 2 - 1; ty = (e.clientY / innerHeight) * 2 - 1;
  });

  function onOrient(e) {
    if (e.gamma == null || e.beta == null) return;
    useGyro = true;
    if (!base) base = { g: e.gamma, b: e.beta };
    base.g += (e.gamma - base.g) * 0.0015; base.b += (e.beta - base.b) * 0.0015; // se recentra solo
    tx = clamp((e.gamma - base.g) / 22); ty = clamp((e.beta - base.b) / 22);
  }

  // iOS pide permiso explícito, y solo dentro de un toque del usuario
  T.enable = () => {
    const D = window.DeviceOrientationEvent;
    if (!D) return;
    if (typeof D.requestPermission === "function") {
      D.requestPermission().then((r) => { if (r === "granted") addEventListener("deviceorientation", onOrient); }).catch(() => {});
    } else addEventListener("deviceorientation", onOrient);
  };

  (function loop() {
    cx += (tx - cx) * 0.1; cy += (ty - cy) * 0.1;
    T.x = cx; T.y = -cy;                                   // y positivo = arriba
    root.style.setProperty("--ry", cx * 16 + "deg");
    root.style.setProperty("--rx", -cy * 12 + "deg");
    root.style.setProperty("--cry", cx * 9 + "deg");        // la carta se mueve un poco menos
    root.style.setProperty("--crx", -cy * 7 + "deg");
    root.style.setProperty("--gx", 50 + cx * 45 + "%");     // brillo holográfico
    root.style.setProperty("--gy", 30 + cy * 40 + "%");
    requestAnimationFrame(loop);
  })();
  return T;
})();
