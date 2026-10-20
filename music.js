/* Música de fondo: house suave estilo "french touch", compuesta y sintetizada en vivo
   con Web Audio (tema original, sin archivos). Baja sola cuando SMIDY habla. */
window.MUSIC = (() => {
  const AC = window.AudioContext || window.webkitAudioContext;
  const BPM = 116, STEP = 60 / BPM / 4;           // semicorchea
  const VOL = 0.2, VOL_TALK = 0.07;               // volumen normal / mientras habla SMIDY
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  // Am7 – Fmaj7 – Cmaj7 – G7  (raíz del bajo + acorde)
  const BARS = [
    { root: 33, chord: [57, 60, 64, 67] },
    { root: 29, chord: [57, 60, 64, 65] },
    { root: 36, chord: [55, 60, 64, 71] },
    { root: 31, chord: [55, 59, 62, 65] },
  ];
  const BASS = { 0: 0, 3: 0, 6: 12, 8: 0, 10: 7, 14: 12 };   // paso -> semitonos sobre la raíz

  let ctx, out, delayIn, noiseBuf, timer, started = false, next = 0, step = 0, bar = 0, pumpTarget = 1;

  function init() {
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 9000;
    out = ctx.createGain(); out.gain.value = 0;
    lp.connect(comp).connect(out).connect(ctx.destination);
    // eco suave
    delayIn = ctx.createGain();
    const d = ctx.createDelay(1); d.delayTime.value = STEP * 3;
    const fb = ctx.createGain(); fb.gain.value = 0.38;
    const dl = ctx.createBiquadFilter(); dl.type = "lowpass"; dl.frequency.value = 3000;
    delayIn.connect(d); d.connect(dl).connect(fb).connect(d); dl.connect(lp);
    init.master = lp;
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const ch = noiseBuf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
  }

  const env = (g, t, a, dur, vol) => {
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  };
  function osc(type, freq, t, dur, vol, dest, cutoff, glideTo) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
    env(g, t, 0.005, dur, vol);
    let node = o;
    if (cutoff) { const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = cutoff; o.connect(f); node = f; }
    node.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
    return g;
  }
  function hat(t, vol, dur, hp = 7000) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = "highpass"; f.frequency.value = hp;
    env(g, t, 0.002, dur, vol); s.connect(f).connect(g).connect(init.master); s.start(t, Math.random() * 0.5, dur + 0.02);
  }
  function clap(t) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = "bandpass"; f.frequency.value = 1600; f.Q.value = 0.8;
    env(g, t, 0.003, 0.16, 0.14); s.connect(f).connect(g).connect(init.master); s.start(t, 0, 0.2);
  }

  // acorde sostenido con filtro que se abre y "bombeo" (sidechain) con cada golpe
  function pad(b, t) {
    const dur = STEP * 16, pump = ctx.createGain(), f = ctx.createBiquadFilter();
    f.type = "lowpass"; f.Q.value = 3;
    f.frequency.setValueAtTime(500, t); f.frequency.exponentialRampToValueAtTime(2600, t + dur * 0.9);
    f.connect(pump); pump.connect(init.master);
    for (let beat = 0; beat < 4; beat++) {
      const bt = t + beat * STEP * 4;
      pump.gain.setValueAtTime(0.12, bt); pump.gain.linearRampToValueAtTime(1, bt + STEP * 3.2);
    }
    b.chord.forEach((n) => [-6, 6].forEach((det) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sawtooth"; o.frequency.value = mtof(n); o.detune.value = det;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.045, t + 0.05);
      g.gain.setValueAtTime(0.045, t + dur - 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(f); o.start(t); o.stop(t + dur + 0.05);
    }));
  }

  function schedule(s, t) {
    const b = BARS[bar % 4];
    if (s === 0) pad(b, t);
    if (s % 4 === 0) osc("sine", 125, t, 0.22, 0.55, init.master, 0, 42);          // bombo suave
    if (s === 4 || s === 12) clap(t);
    if (s % 4 === 2) hat(t, 0.13, 0.05);                                           // hi-hat a contratiempo
    else if (s % 2 === 1) hat(t, 0.035, 0.025);
    if (s in BASS) osc("sawtooth", mtof(b.root + BASS[s]), t, STEP * 1.8, 0.22, init.master, 450);
    if (s % 4 === 1 || s === 14) {                                                 // arpegio brillante con eco
      const n = b.chord[(s + bar) % 4] + 12;
      const g = osc("triangle", mtof(n), t, 0.22, 0.07, init.master, 4000);
      const send = ctx.createGain(); send.gain.value = 0.7; g.connect(send).connect(delayIn);
    }
  }

  function tick() {
    while (next < ctx.currentTime + 0.2) {
      schedule(step, next);
      next += STEP;
      if (++step === 16) { step = 0; bar++; }
    }
    const muted = window.SMIDY && SMIDY.isMuted && SMIDY.isMuted();
    const talking = window.SMIDY && SMIDY.isTalking && SMIDY.isTalking();
    out.gain.setTargetAtTime(muted ? 0 : talking ? VOL_TALK : VOL, ctx.currentTime, 0.4);
  }

  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    document.hidden ? ctx.suspend() : ctx.resume();
  });

  return {
    start() {
      if (!AC || started) return; started = true;
      init(); ctx.resume();
      next = ctx.currentTime + 0.1;
      out.gain.setValueAtTime(0.0001, ctx.currentTime); // entra con fundido
      timer = setInterval(tick, 40);
    },
  };
})();
