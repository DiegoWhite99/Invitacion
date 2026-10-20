/* Efectos de sonido sintetizados con Web Audio (sin archivos). */
window.SFX = (() => {
  let ctx, master;
  const AC = window.AudioContext || window.webkitAudioContext;
  const unlock = () => {
    if (!AC) return null;
    if (!ctx) { ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination); }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  };
  const ready = () => ctx && !(window.SMIDY && SMIDY.isMuted && SMIDY.isMuted());

  function tone(f1, f2, dur, type = "sine", vol = 0.3, delay = 0) {
    if (!ready()) return;
    const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur) {
    const b = ctx.createBuffer(1, Math.max(1, ctx.sampleRate * dur), ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(); s.buffer = b; return s;
  }

  return {
    unlock,
    // notificación tipo móvil: dos notas
    ping() { tone(988, 988, 0.2, "sine", 0.5); tone(1480, 1480, 0.5, "sine", 0.5, 0.12); tone(2960, 2960, 0.3, "triangle", 0.08, 0.12); },
    // el sello se rompe
    crack() {
      if (!ready()) return;
      const n = noise(0.18), f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = "highpass"; f.frequency.value = 1500;
      g.gain.setValueAtTime(0.6, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      n.connect(f).connect(g).connect(master); n.start();
      tone(180, 50, 0.25, "sawtooth", 0.35);
    },
    // interferencia digital
    glitch() { for (let i = 0; i < 7; i++) tone(200 + Math.random() * 1800, 100 + Math.random() * 900, 0.05, "square", 0.1, i * 0.055); },
    blip() { tone(1200, 1800, 0.06, "square", 0.08); },
    // portal: barrido de ruido + zumbido ascendente + golpe grave final
    whoosh(d = 1.8) {
      if (!ready()) return;
      const t = ctx.currentTime, n = noise(d), f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = "bandpass"; f.Q.value = 1.2;
      f.frequency.setValueAtTime(200, t); f.frequency.exponentialRampToValueAtTime(5000, t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.6, t + d * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      n.connect(f).connect(g).connect(master); n.start(t);
      tone(80, 900, d, "sawtooth", 0.14);
      tone(70, 28, 0.7, "sine", 0.8, d - 0.15);
    },
    confirm() { tone(523, 523, 0.1, "square", 0.15); tone(659, 659, 0.1, "square", 0.15, 0.1); tone(784, 784, 0.25, "square", 0.15, 0.2); },
  };
})();
