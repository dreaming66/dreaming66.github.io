// Physics + policy, no rendering: runs in the browser and in Node (test_node.mjs).
// A line-by-line port of sim/interactive.py's Sim (itself checked against biped/joystick.py).

export class Policy {
  constructor(buf, spec) {
    const t = {};
    for (const s of spec.tensors) {
      const n = s.shape.reduce((a, b) => a * b, 1);
      t[s.name] = { data: new Float32Array(buf, s.offset, n), shape: s.shape };
    }
    this.mean = t.mean.data;
    this.std = t.std.data;
    this.layers = [];
    for (let i = 0; i < spec.n_layers; i++) this.layers.push({ W: t[`kernel${i}`], b: t[`bias${i}`].data });
    this.buf = [];
    for (const L of this.layers) this.buf.push(new Float32Array(L.W.shape[1]));
    this.x0 = new Float32Array(this.mean.length);
  }

  // deterministic action: tanh of the first half of the last layer (Normal-tanh mode)
  act(obs, nu) {
    const x0 = this.x0;
    for (let i = 0; i < x0.length; i++) x0[i] = (obs[i] - this.mean[i]) / this.std[i];
    let x = x0;
    this.layers.forEach((L, li) => {
      const [nin, nout] = L.W.shape, W = L.W.data, y = this.buf[li];
      y.set(L.b);
      for (let i = 0; i < nin; i++) {
        const xi = x[i];
        if (xi === 0) continue;
        const row = i * nout;
        for (let j = 0; j < nout; j++) y[j] += xi * W[row + j];
      }
      if (li < this.layers.length - 1) for (let j = 0; j < nout; j++) y[j] = y[j] / (1 + Math.exp(-y[j]));
      x = y;
    });
    const a = new Float64Array(nu);
    for (let j = 0; j < nu; j++) a[j] = Math.tanh(x[j]);
    return a;
  }
}

export class Biped {
  constructor(mujoco, simXml, policyBuf, cfg) {
    this.mj = mujoco;
    this.cfg = cfg;
    this.m = mujoco.MjModel.from_xml_string(simXml);
    this.m.opt.timestep = cfg.ctrl_dt / cfg.n_sub;
    this.d = new mujoco.MjData(this.m);
    this.policy = new Policy(policyBuf, cfg.policy);
    this.nu = cfg.nu;
    this.cmd = [0, 0, 0];
    this.obsBuf = new Float32Array(31);
    this.reset();
  }

  reset() {
    const { mj, m, d, cfg } = this;
    mj.mj_resetData(m, d);
    d.qpos.set(cfg.home_qpos);
    d.ctrl.set(cfg.default_ctrl);
    mj.mj_forward(m, d);
    this.lastAct = new Float64Array(this.nu);
    this.phase = [0, Math.PI];
    this.t = 0;
  }

  obs() {
    const { d, cfg, nu } = this, o = this.obsBuf;
    const sd = d.sensordata, R = d.site_xmat, r = 9 * cfg.imu_site, len = d.actuator_length, vel = d.actuator_velocity;
    let k = 0;
    for (let i = 0; i < 3; i++) o[k++] = sd[cfg.gyro + i];
    for (let i = 0; i < 3; i++) o[k++] = -R[r + 6 + i];            // R^T [0,0,-1]
    for (let i = 0; i < 3; i++) o[k++] = this.cmd[i];
    for (let i = 0; i < nu; i++) o[k++] = len[i] - cfg.default_ctrl[i];
    for (let i = 0; i < nu; i++) o[k++] = vel[i];
    for (let i = 0; i < nu; i++) o[k++] = this.lastAct[i];
    o[k++] = Math.cos(this.phase[0]); o[k++] = Math.cos(this.phase[1]);
    o[k++] = Math.sin(this.phase[0]); o[k++] = Math.sin(this.phase[1]);
    return o;
  }

  step() {
    const { mj, m, d, cfg, nu } = this;
    const a = this.policy.act(this.obs(), nu);
    const ctrl = d.ctrl;
    for (let i = 0; i < nu; i++) ctrl[i] = cfg.default_ctrl[i] + a[i] * cfg.action_scale;
    for (let i = 0; i < cfg.n_sub; i++) mj.mj_step(m, d);
    this.lastAct = a;
    const dph = 2 * Math.PI * cfg.ctrl_dt * cfg.gait_hz;
    this.phase = this.phase.map(p => {
      let q = (p + dph + Math.PI) % (2 * Math.PI);            // == np.fmod for these (positive) values
      return q - Math.PI;
    });
    this.t += cfg.ctrl_dt;
  }

  fallen() {
    const d = this.d;
    return d.sensordata[this.cfg.upvector_z] < 0.5 || d.qpos[2] < this.cfg.min_height;
  }

  push(speed = 0.6) {
    const a = Math.random() * 2 * Math.PI, qv = this.d.qvel;
    qv[0] += speed * Math.cos(a);
    qv[1] += speed * Math.sin(a);
  }

  bodyVel() {
    const sd = this.d.sensordata, c = this.cfg;
    return [sd[c.local_linvel], sd[c.local_linvel + 1], sd[c.gyro + 2]];
  }
}

// Pose the CAD display model from the sim state (same mapping as showcase_video.set_leg).
export function poseCad(mujoco, vm, vd, sim) {
  const c = sim.cfg.cad_q, sq = sim.cfg.sim_q, q = sim.d.qpos, vq = vd.qpos;
  for (let i = 0; i < 7; i++) vq[c.root + i] = q[i];
  for (const [side, s] of [["l", 1], ["r", -1]]) {
    const roll = s * q[sq[`${side}_hip_roll`]], pitch = q[sq[`${side}_hip_pitch`]], knee = q[sq[`${side}_knee`]];
    const set = (j, v) => { if (c[`${side}_${j}`] >= 0) vq[c[`${side}_${j}`]] = v; };
    set("roll", roll); set("pitch", pitch); set("knee", knee);
    set("crank", pitch + knee); set("rod", -knee); set("mcrank", pitch + knee); set("link1", -(pitch + knee));
  }
  mujoco.mj_kinematics(vm, vd);
}

export function loadCad(mujoco, kinXml) {
  const vm = mujoco.MjModel.from_xml_string(kinXml);
  return { vm, vd: new mujoco.MjData(vm) };
}
