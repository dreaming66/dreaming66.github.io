// Procedural joint / footstep sounds driven by the simulation (Web Audio, no samples).
//   motors:    one voice per leg, panned L/R. Pitch follows the motor speed (joint speed x gear), loudness the
//              torque + speed; a band-passed noise layer adds the cycloid-gear whir.
//   footsteps: a short low thump when a foot lands, scaled by its vertical speed at impact.
//   push / fall: a whoosh / a heavier clunk.
// Browsers only start audio after a user gesture: call unlock() from the first click / key press.

export class JointAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.9;                 // the homepage embed runs quieter
    this.lastContact = [true, true];
    this.debug = { motorHz: [0, 0], motorGain: [0, 0], steps: 0 };
  }

  unlock() {
    if (!this.ctx) this._build();
    if (this.ctx.state !== "running") this.ctx.resume();
  }

  setEnabled(on) {
    this.enabled = on;
    if (this.ctx) this.master.gain.setTargetAtTime(on ? this.volume : 0, this.ctx.currentTime, 0.05);
  }

  _build() {
    const ctx = this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = ctx.createGain();
    this.master.gain.value = this.enabled ? this.volume : 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 4;
    this.master.connect(comp).connect(ctx.destination);

    // one second of white noise, shared by every noise source
    this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const ch = this.noise.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;

    this.voices = [-0.6, 0.6].map(panv => {
      const pan = ctx.createStereoPanner(); pan.pan.value = panv;
      const out = ctx.createGain(); out.gain.value = 0;
      out.connect(pan).connect(this.master);
      // motor whine: saw + detuned square through a resonant band-pass (gives the "servo" tone)
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 3;
      bp.connect(out);
      const saw = ctx.createOscillator(); saw.type = "sawtooth";
      const sq = ctx.createOscillator(); sq.type = "square"; sq.detune.value = 7;
      const sg = ctx.createGain(); sg.gain.value = 0.35;
      const qg = ctx.createGain(); qg.gain.value = 0.15;
      saw.connect(sg).connect(bp); sq.connect(qg).connect(bp);
      saw.start(); sq.start();
      // gear whir: looping noise, band-passed around a multiple of the motor frequency
      const n = ctx.createBufferSource(); n.buffer = this.noise; n.loop = true;
      const nbp = ctx.createBiquadFilter(); nbp.type = "bandpass"; nbp.Q.value = 6;
      const ng = ctx.createGain(); ng.gain.value = 0.25;
      n.connect(nbp).connect(ng).connect(out);
      n.start();
      return { out, bp, saw, sq, nbp, pan };
    });
  }

  // called once per 20 ms control step
  update(sim) {
    if (!this.ctx || this.ctx.state !== "running") { this._contacts(sim, false); return; }
    const t = this.ctx.currentTime, c = sim.cfg, d = sim.d;
    const vel = d.actuator_velocity, frc = d.actuator_force;
    c.legs.forEach((idx, k) => {
      let speed = 0, load = 0;
      for (const i of idx) { speed += Math.abs(vel[i]); load += Math.abs(frc[i]); }
      // joint rad/s -> motor rad/s through the gearbox; map to an audible, not-too-shrill range
      const motor = speed * c.gear;
      const hz = 70 + 2.2 * motor;
      const gain = Math.min(0.5, 0.02 + 0.0045 * motor + 0.012 * load);
      const v = this.voices[k];
      v.saw.frequency.setTargetAtTime(hz, t, 0.03);
      v.sq.frequency.setTargetAtTime(hz * 0.5, t, 0.03);
      v.bp.frequency.setTargetAtTime(Math.min(4000, hz * 2.5), t, 0.03);
      v.nbp.frequency.setTargetAtTime(Math.min(6000, 400 + hz * 4), t, 0.04);
      v.out.gain.setTargetAtTime(gain, t, 0.04);
      this.debug.motorHz[k] = hz; this.debug.motorGain[k] = gain;
    });
    this._contacts(sim, true);
  }

  _contacts(sim, play) {
    const c = sim.cfg, sd = sim.d.sensordata;
    for (let k = 0; k < 2; k++) {
      const on = sd[c.foot_contact[k]] > 0;
      if (on && !this.lastContact[k]) {
        const vz = Math.abs(sd[c.foot_vel[k] + 2]);
        if (play) this._thump(Math.min(1, 0.25 + vz / 1.2), k ? 0.5 : -0.5);
        this.debug.steps++;
      }
      this.lastContact[k] = on;
    }
  }

  _thump(strength, panv, low = 80, dur = 0.12) {
    const ctx = this.ctx, t = ctx.currentTime;
    const pan = ctx.createStereoPanner(); pan.pan.value = panv;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.9 * strength, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(pan).connect(this.master);
    const o = ctx.createOscillator(); o.type = "sine";
    o.frequency.setValueAtTime(low * 1.8, t);
    o.frequency.exponentialRampToValueAtTime(low, t + dur * 0.6);
    o.connect(g); o.start(t); o.stop(t + dur + 0.02);
    const n = ctx.createBufferSource(); n.buffer = this.noise;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900;
    const ng = ctx.createGain(); ng.gain.value = 0.5;
    n.connect(lp).connect(ng).connect(g);
    n.start(t, Math.random() * 0.5, dur);
  }

  push() {
    if (!this.ctx || this.ctx.state !== "running") return;
    const ctx = this.ctx, t = ctx.currentTime;
    const n = ctx.createBufferSource(); n.buffer = this.noise;
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(400, t);
    bp.frequency.exponentialRampToValueAtTime(2200, t + 0.25);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.6, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    n.connect(bp).connect(g).connect(this.master);
    n.start(t, 0, 0.4);
  }

  fall() {
    if (!this.ctx || this.ctx.state !== "running") return;
    this._thump(1.0, 0, 55, 0.35);
    setTimeout(() => this._thump(0.6, 0.3, 70, 0.2), 120);
  }
}
