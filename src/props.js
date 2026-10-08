'use strict';
// 本集共用的站位和道具（主会话维护；各段只调用，不改）。黑板画法在 src/lec/chalk.js（ck*）。
//   OG    三人的标准站位：段首段末帕秋莉、美铃在这里（琪露诺段首段末不在画面里）。
//   帕秋莉站在黑板左侧讲课，红美铃（红魔馆的中餐担当）站在右侧；琪露诺只在自己说话时从右下角冒出来，说完缩回去（ogCirno）。
//   内容区（板坐标 = 屏幕坐标时）：x 500–1400，y 70–860；琪露诺冒头的地方 x > 1220 且 y > 540，她说话时那里不放东西。
const OG = {
  pch: { x: 300, y: 880, h: 500 },
  mei: { x: 1660, y: 880, h: 500, facing: -1 },
  cir: { x: 1390, y: 1060, h: 500, facing: -1 },   // 脚底在画面外，只露上半身（第三版 Q 版头大，比原来低 50，蝴蝶结不碰板书）
};

// ogPch / ogMei：标准站位的两人，嘴型、表情、眨眼自动从当前台词取。o 覆盖参数
function ogPch(c, tau, L, o = {}) { return drawPatchouli(c, { ...OG.pch, pose: 'lecture', mood: moodOf(L, 'patchouli', 'normal'), mouth: mouthOf(L, 'patchouli'), blink: blinkAt(tau), t: tau, ...o }); }
function ogMei(c, tau, L, o = {}) { return drawMeiling(c, { ...OG.mei, pose: 'stand', mood: moodOf(L, 'meiling', 'normal'), mouth: mouthOf(L, 'meiling'), blink: blinkAt(tau, 3), t: tau, ...o }); }
// ogCirno：琪露诺从右下角冒出来。lines 是本段台词，她的每句前 0.35 秒升起、句末 0.4 秒后缩回；
// 相邻两句间隔小于 1.2 秒就不缩回。返回升起程度 0..1（0 时不画）。
function ogCirnoUp(tau, lines) {
  let k = 0;
  for (let i = 0; i < lines.length; i++) { const l = lines[i]; if ((l[3] || {}).who !== 'cirno') continue;
    k = Math.max(k, Math.min(sm(l[0] - .35, l[0], tau, easeOutBack), 1 - sm(l[1] + .4, l[1] + .75, tau))); }
  return k;
}
function ogCirno(c, tau, L, lines, o = {}) {
  const k = ogCirnoUp(tau, lines); if (k <= .001) return 0;
  c.save(); c.beginPath(); c.rect(0, 0, W, 892); c.clip();   // 地板线以下不画（她从黑板槽后面冒出来）
  drawCirno(c, { ...OG.cir, y: OG.cir.y + (1 - k) * 420, pose: 'point', gesture: .4, mood: moodOf(L, 'cirno', 'normal'), mouth: mouthOf(L, 'cirno'), blink: blinkAt(tau, 2), t: tau, ...o });
  c.restore(); return k;
}
// ogOutro：段末用板擦把整块黑板擦干净（在 ckLayer 里调用；返回板擦位置，交给 ogEraser 画）。
//   dur 段长；擦在段末前 1.25 秒到 0.25 秒之间，最后 0.25 秒是干净黑板（段间交接画面）。
const OG_ALL = [CKB.x - 400, CKB.y - 40, CKB.w + 800, CKB.h + 80];
function ogOutro(lc, tau, dur, cam) { cam = cam || CKCAM0;
  const r = [cam.x - CKB.w / 2 / cam.z - 40, cam.y - CKB.h / 2 / cam.z - 30, CKB.w / cam.z + 80, CKB.h / cam.z + 60];
  return ckErase(lc, r, sm(dur - 1.25, dur - .25, tau, t => t)); }
function ogEraser(c, cam, pos) { if (!pos) return; const [x, y] = ckToScreen(cam, pos[0], pos[1]); ckEraser(c, x, y, -.08, 1.25); }

// ===== 本集的粉笔小图标（板坐标，在 ckLayer 的 lc 上画）。各段共用，保证同一样东西每段长得一样 =====
// ogWok(lc, x, y, s, o)：炒锅剖面（锅口中心 x,y，口宽 360*s），o.p 画出进度，o.color
function ogWok(lc, x, y, s = 1, o = {}) {
  const { p = 1, color = 'ink', seed = 601, w = 5 } = o, r = 180 * s, d = 92 * s, pts = [];
  for (let i = 0; i <= 24; i++) { const a = i / 24, u = a * 2 - 1; pts.push([x + u * r, y + d * (1 - u * u) * (1 - .12 * u * u)]); }
  ckLine(lc, pts, { color, w, p: sm(0, .7, p), seed, smooth: true });
  ckLine(lc, [[x + r, y], [x + r + 150 * s, y - 34 * s]], { color, w: w + 2, p: sm(.6, 1, p), seed: seed + 1 });   // 锅柄
}
// ogFlame(lc, x, y, s, tau, o)：灶火三簇（o.k 0..1 火力，0 时不画）
function ogFlame(lc, x, y, s = 1, tau = 0, o = {}) {
  const { k = 1, color = 'orange', seed = 611 } = o; if (k <= .01) return;
  for (let i = -1; i <= 1; i++) { const fx = x + i * 46 * s, hh = (34 + 10 * Math.sin(twos(tau) * 9 + i * 2)) * s * k;
    ckLine(lc, [[fx - 14 * s, y], [fx - 6 * s, y - hh * .55], [fx, y - hh], [fx + 7 * s, y - hh * .5], [fx + 14 * s, y]], { color, w: 4, smooth: true, seed: seed + i }); }
}
// ogMeat(lc, x, y, w, h, o)：一块肉（圆角块）+ 里面的纤维（橡皮筋）。o.dir 0 横纤维 / 1 竖纤维，o.n 根数，o.taut 0..1 绷直程度，o.cut 切段数（0 不切）
function ogMeat(lc, x, y, w, h, o = {}) {
  const { p = 1, color = 'pink', fiber = 'ink', n = 6, taut = 0, cut = 0, seed = 621, fp = 1, thick = 3 } = o;
  ckShape(lc, rectPts(x, y, w, h).map(([px, py]) => [px, py]), { color, w: 5, p, seed, al: 1 });
  if (fp <= 0) return;
  for (let i = 0; i < n; i++) {
    const fy = y + h * (i + .5) / n, pts = [];
    for (let j = 0; j <= 12; j++) { const u = j / 12, amp = (1 - taut) * h / n * .28; pts.push([x + 18 + (w - 36) * u, fy + amp * Math.sin(u * Math.PI * 5 + i * 1.7)]); }
    if (!cut) ckLine(lc, pts, { color: fiber, w: thick, smooth: true, p: fp, seed: seed + 3 + i });
    else for (let k = 0; k < cut; k++) { const a = Math.floor(k / cut * 12), b = Math.floor((k + 1) / cut * 12);
      ckLine(lc, pts.slice(a, b + 1).map((q, qi, arr) => qi === arr.length - 1 ? [q[0] - 8, q[1]] : q), { color: fiber, w: thick, smooth: true, p: fp, seed: seed + 30 + i * 7 + k }); }
  }
}
// ogGauge(lc, x, y, r, frac, o)：温度表盘（frac 0..1 指针位置，左低右高），o.label
function ogGauge(lc, x, y, r, frac, o = {}) {
  const { p = 1, color = 'ink', seed = 631 } = o, arc = [];
  for (let i = 0; i <= 20; i++) { const a = Math.PI + Math.PI * i / 20; arc.push([x + r * Math.cos(a), y + r * Math.sin(a)]); }
  ckLine(lc, arc, { color, w: 5, smooth: true, p, seed });
  for (let i = 0; i <= 4; i++) { const a = Math.PI + Math.PI * i / 4; ckLine(lc, [[x + r * .82 * Math.cos(a), y + r * .82 * Math.sin(a)], [x + r * Math.cos(a), y + r * Math.sin(a)]], { color, w: 4, p, seed: seed + 1 + i }); }
  const a = Math.PI + Math.PI * clamp(frac, 0, 1);
  ckLine(lc, [[x, y], [x + r * .78 * Math.cos(a), y + r * .78 * Math.sin(a)]], { color: frac > .6 ? 'orange' : 'blue', w: 6, p, seed: seed + 9 });
}
