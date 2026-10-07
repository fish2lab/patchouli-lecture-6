'use strict';
// 粉笔音效：照 V8 黑板报的做法，每个粉笔事件配一声。全部用 WebAudio 合成，不引入音频文件。
// core.js 的 mixAudio 在 BGM 之后调用 sfxMix，所以播放器和出片（OfflineAudioContext）听到的一样。
//
// 登记（场景文件里，scene({...}) 之后）：
//   sfx('opening', [
//     [s0T(0) + .4, 'chalk', 0.9],     // [段内秒, 种类, 时长秒]
//     [tb - .6,     'line',  1.2],
//     [tn,          'tap'],            // tap 不用写时长
//     [S0DUR - 1.25, 'felt', 1.0],     // 段末擦黑板（ogOutro 的时间）
//   ]);
// 种类：chalk 写字沙沙 / line 长线 / felt 板擦三趟 / tap 点一下 / whoosh 镜头移动。
// 没登记的段按台词自动推断：每句开始后 0.4 秒起 1.2 秒 chalk，段末前 1.25 秒起 1.0 秒 felt。
// 顶层名字都带 sfx / SFX 前缀。

const SFX_EV = {};                              // sceneKey → [[t, kind, dur], ...]
const SFX_KINDS = ['chalk', 'line', 'felt', 'tap', 'whoosh'];
const SFX_GAIN = .049;                          // 总音量：叠上 master 1.8 后峰值约 -24 dBFS
const SFX_DUCK = .708;                          // 说话时再压 3 dB
function sfx(key, events) {
  for (const e of events) if (!SFX_KINDS.includes(e[1])) throw new Error(`sfx(${key}): 未知种类 ${e[1]}`);
  SFX_EV[key] = events.slice().sort((a, b) => a[0] - b[0]);
}
// sfxAuto：没登记时的兜底
function sfxAuto(s) {
  const ev = (s.lines || []).map(l => [l[0] + .4, 'chalk', 1.2]);
  ev.push([s.dur - 1.25, 'felt', 1.0]);
  return ev;
}
const sfxEventsOf = s => SFX_EV[s.key] || sfxAuto(s);
// sfxList：全片时间落在 [from, from+dur) 内的事件 → [[全片秒, kind, dur, 段内序号, sceneKey], ...]
function sfxList(from = 0, dur = Infinity) {
  const out = [];
  for (const s of FILM.T) sfxEventsOf(s).forEach((e, i) => { const at = s.start + e[0]; if (at >= from && at < from + dur) out.push([at, e[1], e[2], i, s.key]); });
  return out;
}

// 噪声 buffer（每个 AudioContext 生成一次，rng 种子固定，确定性）
function sfxNoise(ac) {
  if (ac.__sfxNoise) return ac.__sfxNoise;
  const sr = ac.sampleRate, n = sr * 2, mk = () => ac.createBuffer(1, n, sr);
  const white = mk(), pink = mk(), w = white.getChannelData(0), p = pink.getChannelData(0), r = rng(5101), r2 = rng(5102);
  for (let i = 0; i < n; i++) w[i] = r() * 2 - 1;
  // 粉红噪声：Paul Kellet 的经济型滤波
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < n; i++) { const x = r2() * 2 - 1;
    b0 = .99886 * b0 + x * .0555179; b1 = .99332 * b1 + x * .0750759; b2 = .969 * b2 + x * .153852; b3 = .8665 * b3 + x * .3104856;
    b4 = .55 * b4 + x * .5329522; b5 = -.7616 * b5 - x * .016898; p[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + x * .5362) * .11; b6 = x * .115926; }
  return (ac.__sfxNoise = { white, pink });
}
// 一路噪声源 → 滤波 → 包络 → 声像 → out；返回 { f, g }，调用方往 f.frequency / g.gain 上排自动化
function sfxVoice(ac, out, buf, type, st, len, seed, { freq = 1000, Q = .7, pan = 0 } = {}) {
  const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
  const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = Q;
  const g = ac.createGain(); g.gain.value = 0; g.gain.setValueAtTime(0, st);
  src.connect(f); f.connect(g);
  if (ac.createStereoPanner) { const pn = ac.createStereoPanner(); pn.pan.value = pan; g.connect(pn); pn.connect(out); } else g.connect(out);
  src.start(st, hash(seed, 5103) * 1.9); src.stop(st + len + .05);
  return { f, g: g.gain };
}

// 各种类的合成。st 是 ac 时刻，d 是时长，k 是 hash 种子
const SFX_SYN = {
  // 写字：带通 2–5 kHz 白噪声，8–14 Hz 颗粒包络（一笔一画），每笔中心频率跳一下
  chalk(ac, out, N, st, d, k) {
    const { f, g } = sfxVoice(ac, out, N.white, 'bandpass', st, d, k, { freq: 3400, Q: 1.1, pan: (hash(k, 5110) - .5) * .4 });
    const rate = 8 + hash(k, 5111) * 6; let t = 0, i = 0;
    while (t < d) {
      const gl = (.6 + hash(k * 31 + i, 5112) * .8) / rate, a = .45 + .55 * hash(k * 31 + i, 5113), at = st + t;
      const fade = Math.max(.15, Math.min(1, t / .06, (d - t) / .08));
      f.frequency.setValueAtTime(2000 + hash(k * 31 + i, 5114) * 3000, at);
      g.setValueAtTime(0, at); g.linearRampToValueAtTime(a * fade, at + .008);
      g.exponentialRampToValueAtTime(Math.max(1e-4, a * fade * .12), at + gl * .8); g.linearRampToValueAtTime(0, at + gl * .95);
      t += gl; i++;
      if (hash(k * 31 + i, 5115) < .12) t += .05;    // 偶尔提笔
    }
  },
  // 长线：高通噪声，起落平滑，中间只有很慢的起伏
  line(ac, out, N, st, d, k) {
    const { g } = sfxVoice(ac, out, N.white, 'highpass', st, d, k, { freq: 2200, Q: .5, pan: (hash(k, 5120) - .5) * .3 });
    const steps = Math.max(2, Math.round(d * 6));
    g.linearRampToValueAtTime(.55, st + Math.min(.06, d / 4));
    for (let i = 1; i < steps; i++) g.linearRampToValueAtTime(.45 + .2 * hash(k * 17 + i, 5121), st + d * i / steps);
    g.linearRampToValueAtTime(0, st + d);
  },
  // 板擦：低通 < 900 Hz 粉红噪声，三趟来回，每趟滤波频率扫上去再落下
  felt(ac, out, N, st, d, k) {
    const { f, g } = sfxVoice(ac, out, N.pink, 'lowpass', st, d, k, { freq: 500, Q: .6 });
    const L = d / 3;
    for (let b = 0; b < 3; b++) { const a = st + b * L, pk = 1.6 + .5 * hash(k + b, 5130);
      g.setValueAtTime(.02, a); g.linearRampToValueAtTime(pk, a + L * .3); g.linearRampToValueAtTime(pk * .8, a + L * .75); g.linearRampToValueAtTime(.02, a + L * .98);
      f.frequency.setValueAtTime(420, a); f.frequency.linearRampToValueAtTime(880, a + L * .45); f.frequency.linearRampToValueAtTime(460, a + L * .98); }
    g.linearRampToValueAtTime(0, st + d);
  },
  // 点一下：极短的带通噪声
  tap(ac, out, N, st, d, k) {
    const { g } = sfxVoice(ac, out, N.white, 'bandpass', st, .08, k, { freq: 2200 + hash(k, 5140) * 1200, Q: 2.2, pan: (hash(k, 5141) - .5) * .4 });
    g.linearRampToValueAtTime(1.6, st + .002); g.exponentialRampToValueAtTime(1e-3, st + .045); g.linearRampToValueAtTime(0, st + .06);
  },
  // 镜头移动：带通扫频噪声，低 → 高 → 落回
  whoosh(ac, out, N, st, d, k) {
    const { f, g } = sfxVoice(ac, out, N.pink, 'bandpass', st, d, k, { freq: 300, Q: 1.4 });
    f.frequency.setValueAtTime(300, st); f.frequency.exponentialRampToValueAtTime(2400, st + d * .55); f.frequency.exponentialRampToValueAtTime(600, st + d);
    g.linearRampToValueAtTime(2.2, st + d * .5); g.linearRampToValueAtTime(0, st + d);
  },
};
const SFX_DEF = { chalk: 1.0, line: 1.0, felt: 1.0, tap: .06, whoosh: .8 };

// sfxMix：从全片第 from 秒起、在 ac 的 t0 时刻开始，排好 [from, from+dur) 内的粉笔声（core.js 的 mixAudio 调用）
function sfxMix(ac, out, t0, from, dur) {
  const ev = sfxList(from, dur); if (!ev.length) return 0;
  const N = sfxNoise(ac), bus = ac.createGain(); bus.gain.value = SFX_GAIN; bus.connect(out);
  // 说话时压 3 dB
  for (const s of FILM.T) for (const l of s.lines || []) {
    const v = voiceOf(l[2]), a = s.start + l[0], b = a + (v ? v.d : l[1] - l[0]);
    if (b <= from || a >= from + dur) continue;
    const sa = t0 + Math.max(0, a - from), sb = t0 + Math.max(0, b - from);
    bus.gain.setValueAtTime(SFX_GAIN, sa); bus.gain.linearRampToValueAtTime(SFX_GAIN * SFX_DUCK, sa + .08);
    bus.gain.setValueAtTime(SFX_GAIN * SFX_DUCK, sb); bus.gain.linearRampToValueAtTime(SFX_GAIN, sb + .15);
  }
  for (const [at, kind, d, i, key] of ev) {
    const k = (i + 1) * 977 + [...key].reduce((h, ch) => h * 31 + ch.charCodeAt(0) | 0, 7);
    SFX_SYN[kind](ac, bus, N, t0 + (at - from), Math.max(.05, d ?? SFX_DEF[kind]), k);
  }
  return ev.length;
}
