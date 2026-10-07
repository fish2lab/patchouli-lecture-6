'use strict';
// 本集舞台：教室里的一块推拉黑板（照 V8 黑板报的视觉规范抄：板岩绿底、粉笔白、黄色只标新东西、粉色标问题、
// 粉笔头写字带粉尘、板擦擦掉的东西有意思）。全部是 Canvas 纯函数，不引入 HyperFrames / GSAP。
//
// 坐标：黑板上的内容画在「板坐标」里。镜头 cam = { x, y, z }：板坐标 (x, y) 落在板面中心，z 是缩放（≤ 1.06）。
// cam 缺省 = CKCAM0（板坐标和屏幕坐标重合）。一段的内容可以超出一屏宽，镜头在段内平移过去（推拉黑板）。
//
// 用法（一段的 draw 里）：
//   ckRoom(c, tau);                                   // 墙、黑板框、板面、粉笔槽、地板（屏幕坐标，不随镜头动）
//   ckLayer(c, cam, lc => { ckText(lc, ...); ckLine(lc, ...); });   // 所有粉笔内容画进这一层；整层盖一遍粉笔颗粒
//   ckStick(c, ckToScreen(cam, x, y), tau, t0)       // 粉笔头（屏幕坐标），写字时跟着最后一个字
//   ... 再画角色（屏幕坐标，站在黑板前）
//
// 顶层名字都带 ck / CK 前缀。

// ===================== 颜色（V8 KIT.md 的 tokens） =====================
const CK = {
  slate: '#1e3329', slate2: '#24392f', frame: '#6b4a34', frame2: '#4f3524', wall: '#3a3440', wall2: '#2f2a35', floor: '#2a211c',
  ink: '#f2efe6',      // 白粉笔：字和轮廓
  muted: '#d6d2c4',    // 旧粉笔：次要注释（满不透明，不用透明度压低）
  yellow: '#f6d96b',   // 唯一的强调：新出现的、重要的东西
  blue: '#94cdea',     // 结构；本集也是「光」（470 nm 蓝光）
  pink: '#f3a3ba',     // 问题、代价、失稳
  green: '#aedb93',    // 解决、恢复
  orange: '#f5b26b',   // 第五种章节色
};
const CK_TONES = ['pink', 'blue', 'yellow', 'green', 'orange'];   // 章节色轮换
const CK_BORDERS = ['wave', 'dash', 'scallop', 'dot', 'zig', 'double'];
const ckColor = k => CK[k] || k;

// 黑板在屏幕上的位置（板面内区）。角色脚底 y=880 站在粉笔槽前；字幕在地板上 y≈930–1030。
const CKB = { x: 70, y: 46, w: W - 140, h: 812 };
CKB.cx = CKB.x + CKB.w / 2; CKB.cy = CKB.y + CKB.h / 2;
const CKCAM0 = { x: CKB.cx, y: CKB.cy, z: 1 };

// ===================== 教室和黑板 =====================
function ckRoom(c, t = 0) {
  c.fillStyle = CK.wall; c.fillRect(0, 0, W, H);
  grain(c, polyPath(rectPts(0, 0, W, H)), .05);
  // 地板（木纹）
  c.fillStyle = CK.floor; c.fillRect(0, 892, W, H - 892);
  c.save(); c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = 2;
  for (let k = 0; k < 5; k++) { const y = 920 + k * 36; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y + 4); c.stroke(); } c.restore();
  // 黑板框（剪纸木框）+ 板面
  const { x, y, w, h } = CKB;
  cutPaper(c, rectPts(x - 26, y - 24, w + 52, h + 46, 6), CK.frame, { seed: 3101, step: 30, blur: 14, sy: 8, grain: .14 });
  cutPaper(c, rectPts(x - 8, y - 6, w + 16, h + 12, 3), CK.frame2, { seed: 3102, step: 40, shadow: false, grain: .1 });
  c.save(); c.fillStyle = CK.slate; c.fillRect(x, y, w, h);
  const g = c.createRadialGradient(x + w * .45, y + h * .4, h * .2, x + w / 2, y + h / 2, w * .62);
  g.addColorStop(0, alpha(CK.slate2, .9)); g.addColorStop(1, alpha('#0f1c16', .65)); c.fillStyle = g; c.fillRect(x, y, w, h);
  // 擦过的粉笔灰（固定，不随时间变）
  c.beginPath(); c.rect(x, y, w, h); c.clip();
  c.globalAlpha = .035; c.strokeStyle = CK.ink; c.lineCap = 'round'; const r = rng(3103);
  for (let k = 0; k < 9; k++) { c.lineWidth = 50 + r() * 70; const sx = x + r() * w, sy = y + 60 + r() * (h - 120); c.beginPath(); c.moveTo(sx, sy); c.bezierCurveTo(sx + 120, sy - 40, sx + 240, sy + 30, sx + 260 + r() * 200, sy + (r() - .5) * 60); c.stroke(); }
  c.restore();
  grain(c, polyPath(rectPts(x, y, w, h)), .07);
  // 粉笔槽 + 几截粉笔 + 一块板擦
  cutPaper(c, rectPts(x - 30, y + h + 14, w + 60, 22, 3), CK.frame, { seed: 3104, step: 30, blur: 8, sy: 5 });
  for (const [px, col, len] of [[x + 1260, CK.ink, 46], [x + 1320, CK.yellow, 30], [x + 1360, CK.pink, 26], [x + 1400, CK.blue, 34]])
    cutPaper(c, rectPts(px, y + h + 6, len, 11, 4), col, { seed: 3110 + px % 97, step: 8, blur: 3, sy: 2 });
  ckEraser(c, x + 1520, y + h + 2, 0, .9);
}
// 板坐标 → 屏幕坐标
function ckToScreen(cam, x, y) { cam = cam || CKCAM0; return [CKB.cx + (x - cam.x) * cam.z, CKB.cy + (y - cam.y) * cam.z]; }
// ckCam：镜头关键帧。K = [[tau, x, y, z], ...]，返回 { x, y, z }
function ckCam(tau, K) { const v = key(tau, K.map(k => [k[0], [k[1], k[2], k[3] ?? 1]])); return { x: v[0], y: v[1], z: v[2] }; }

// ===================== 粉笔层 =====================
// 所有粉笔画进一张离屏画布，整层用颗粒蒙版「挖」一遍（V8 的 chalk-mask），颗粒贴在板上、随镜头走，不会游动。
let CK_LAYER = null;
const CK_GRAIN = (() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 192; const g = cv.getContext('2d'), r = rng(3120);
  for (let k = 0; k < 2600; k++) { g.fillStyle = `rgba(0,0,0,${.35 + r() * .6})`; const s = r() < .8 ? 1 : 2; g.fillRect(r() * 192, r() * 192, s, s); }
  for (let k = 0; k < 160; k++) { const x = r() * 192, y = r() * 192, a = -.35 + (r() - .5) * .5, l = 3 + r() * 10; g.strokeStyle = `rgba(0,0,0,${.25 + r() * .4})`; g.lineWidth = .6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  return cv; })();
function ckLayer(c, cam, fn, o = {}) {
  cam = cam || CKCAM0;
  const cw = c.canvas.width, ch = c.canvas.height;
  if (!CK_LAYER) CK_LAYER = document.createElement('canvas');
  if (CK_LAYER.width !== cw || CK_LAYER.height !== ch) { CK_LAYER.width = cw; CK_LAYER.height = ch; }
  const lc = CK_LAYER.getContext('2d'), m = c.getTransform();
  lc.setTransform(1, 0, 0, 1, 0, 0); lc.clearRect(0, 0, cw, ch);
  lc.globalAlpha = 1; lc.globalCompositeOperation = 'source-over'; lc.setLineDash([]); lc.shadowBlur = 0;
  // 当前变换（出片的 scale）× 镜头
  lc.setTransform(m); lc.beginPath(); lc.rect(CKB.x, CKB.y, CKB.w, CKB.h); lc.clip();
  lc.translate(CKB.cx, CKB.cy); lc.scale(cam.z, cam.z); lc.translate(-cam.x, -cam.y);
  lc.save(); fn(lc); lc.restore();
  // 颗粒蒙版：在板坐标里铺，随镜头走
  if (o.grain !== false) {
    lc.save(); lc.globalCompositeOperation = 'destination-out'; lc.globalAlpha = o.grainAl ?? .55;
    const pat = lc.createPattern(CK_GRAIN, 'repeat'); lc.fillStyle = pat;
    lc.fillRect(cam.x - CKB.w / cam.z, cam.y - CKB.h / cam.z, CKB.w * 2 / cam.z, CKB.h * 2 / cam.z); lc.restore();
  }
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = o.al ?? 1; c.drawImage(CK_LAYER, 0, 0); c.restore();
}

// ===================== 粉笔笔触（画在 ckLayer 的 lc 上） =====================
// ckLine：一笔粉笔线。o = { w=5, color='ink', p 画出比例, seed, close, smooth, dash, al }
// 粉笔线写上去就不动（不传 t，不呼吸）；边缘的毛糙靠一层宽而淡的底和颗粒蒙版。
function ckLine(lc, pts, o = {}) {
  const { w = 5, color = 'ink', p = 1, seed = 1, close = false, smooth = false, dash = null, al = 1, amp = 1.1 } = o;
  if (p <= 0) return;
  const col = ckColor(color);
  rline(lc, pts, { w: w * 1.9, color: col, p, seed, close, smooth, dash, amp, al: al * .22 });
  rline(lc, pts, { w, color: col, p, seed, close, smooth, dash, amp, al: al * .95 });
}
// ckShape：粉笔轮廓 + 可选的斜线阴影。o = { color, w, hatch: 颜色键或 false, gap, angle, p, seed }
function ckShape(lc, pts, o = {}) {
  const { color = 'ink', w = 5, hatch: hc = false, gap = 13, angle = -.75, p = 1, seed = 1, al = 1 } = o;
  if (hc && p >= 1) { const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]), x0 = Math.min(...xs), y0 = Math.min(...ys);
    hatch(lc, polyPath(pts), [x0, y0, Math.max(...xs) - x0, Math.max(...ys) - y0], { gap, angle, color: ckColor(hc), w: 2.6, al: .75 * al, seed }); }
  ckLine(lc, pts, { color, w, p, seed, close: true, al });
}
// ckText：粉笔字。字用同色描边加粗（文楷是细笔，视频里要读得清）。o = { size=46, color, align, p, al, base }
// 字号下限 30（V8 规则）。返回整句宽度。
function ckText(lc, text, x, y, o = {}) {
  const { size = 46, color = 'ink', align = 'left', p = 1, al = 1, base = 'alphabetic', heavy = false } = o, col = ckColor(color);
  zh(lc, text, x, y, { size: Math.max(30, size), color: col, align, p, al, base, outline: col, ow: heavy ? size * .07 : Math.max(1.5, size * .045) });
  return zhWidth(lc, text, size);
}
// ckWrite：逐字写出的进度和「笔尖」位置。返回 { p, head:[x,y], writing }
//   t0 开始时刻，spc 每字秒数（默认 0.09，比纸上手写略慢）
function ckWrite(lc, tau, text, x, y, t0, o = {}) {
  const { size = 46, align = 'left', spc = .09 } = o, n = [...text].length, p = clamp((tau - t0) / (n * spc), 0, 1);
  const full = zhWidth(lc, text, size), x0 = align === 'center' ? x - full / 2 : align === 'right' ? x - full : x;
  const k = Math.floor(n * p + 1e-6), done = [...text].slice(0, k).join('');
  return { p, head: [x0 + zhWidth(lc, done, size), y - size * .35], writing: p > 0 && p < 1 };
}
// ckBorder：章节框的粉笔边。style ∈ CK_BORDERS
function ckBorder(lc, x, y, w, h, style = 'wave', color = 'ink', p = 1, seed = 1) {
  if (p <= 0) return;
  const per = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], seg = [];
  const along = (f) => { const L = 2 * (w + h); let d = f * L; for (let i = 0; i < 4; i++) { const a = per[i], b = per[(i + 1) % 4], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (d <= l) { const u = d / l; return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), (b[0] - a[0]) / l, (b[1] - a[1]) / l]; } d -= l; } return [x, y, 1, 0]; };
  const N = Math.round(2 * (w + h) / 6);
  if (style === 'dash' || style === 'dot') { ckLine(lc, [...per, per[0]], { color, w: style === 'dot' ? 7 : 5, p, seed, dash: style === 'dot' ? [1, 22] : [26, 18] }); return; }
  if (style === 'double') { ckLine(lc, [...per, per[0]], { color, w: 4, p, seed }); ckLine(lc, rectPts(x + 12, y + 12, w - 24, h - 24).concat([[x + 12, y + 12]]), { color, w: 3, p, seed: seed + 3 }); return; }
  for (let i = 0; i <= N; i++) { const [px, py, tx, ty] = along(i / N), nx = -ty, ny = tx, ph = i / N * 2 * (w + h);
    const off = style === 'wave' ? Math.sin(ph / 22) * 6 : style === 'zig' ? (Math.abs(((ph / 18) % 2) - 1) - .5) * 14 : -Math.abs(Math.sin(ph / 26)) * 10;
    seg.push([px + nx * off, py + ny * off]); }
  ckLine(lc, seg, { color, w: 4.5, p, seed, amp: .5 });
}
// ckBadge：章节徽章（「一 · 开关」），美术字感：粗描边 + 圆角粉笔框。p 是写出进度
function ckBadge(lc, text, x, y, color = 'yellow', p = 1, seed = 1) {
  const size = 50, w = zhWidth(lc, text, size) + 56, h = 76;
  ckShape(lc, rectPts(x, y, w, h, 18), { color, w: 5, p: clamp(p * 2, 0, 1), seed });
  ckText(lc, text, x + 28, y + 54, { size, color, heavy: true, p: clamp(p * 2 - 1, 0, 1) });
  return w;
}
// ckArrow：粉笔箭头
function ckArrow(lc, a, b, o = {}) {
  const { color = 'ink', w = 5, p = 1, bend = 0, head = 20, seed = 3 } = o, col = ckColor(color);
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
  const pts = spline([a, [mx - dy / L * bend, my + dx / L * bend], b], 6);
  ckLine(lc, pts, { color: col, w, p, seed });
  if (p >= .98) { const e = pts.at(-1), f = pts.at(-4) || pts[0], ang = Math.atan2(e[1] - f[1], e[0] - f[0]);
    ckLine(lc, [[e[0] - Math.cos(ang - .5) * head, e[1] - Math.sin(ang - .5) * head], e, [e[0] - Math.cos(ang + .5) * head, e[1] - Math.sin(ang + .5) * head]], { color: col, w, seed: seed + 1 }); }
}
// ckUnderline / ckRing：在写好的字下面划线、圈起来（按实际字宽量，不猜）
function ckUnderline(lc, text, x, y, size, color = 'yellow', p = 1, seed = 5, align = 'left') {
  const w = zhWidth(lc, text, size), x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  ckLine(lc, [[x0 - 6, y + size * .2], [x0 + w * .5, y + size * .26], [x0 + w + 8, y + size * .18]], { color, w: 5, p, seed, smooth: true });
}
function ckRing(lc, text, x, y, size, color = 'yellow', p = 1, seed = 7, align = 'left') {
  const w = zhWidth(lc, text, size), x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  const pts = ellPts(x0 + w / 2, y - size * .35, w / 2 + 26, size * .72, 40, -.04); pts.push([pts[0][0] + 18, pts[0][1] - 10]);
  ckLine(lc, pts, { color, w: 5, p, seed, smooth: true });
}

// ===================== 板擦 =====================
// ckErase：在 lc 上把 rect 按三条横带擦掉（板擦来回三趟），u 0..1。返回板擦此刻的位置（板坐标），没在擦时返回 null。
// 用法：先画要被擦的内容，再调用 ckErase；之后画的东西不受影响。
function ckErase(lc, rect, u) {
  if (u <= 0) return null;
  const [x, y, w, h] = rect, bands = 3, bh = h / bands;
  lc.save(); lc.globalCompositeOperation = 'destination-out'; lc.fillStyle = '#000';
  let pos = null;
  for (let b = 0; b < bands; b++) {
    const v = clamp(u * bands - b, 0, 1); if (v <= 0) break;
    const dir = b % 2 ? -1 : 1, ex = dir > 0 ? x + w * v : x + w * (1 - v), by = y + b * bh;
    if (dir > 0) lc.fillRect(x - 10, by - 4, ex - x + 20, bh + 8); else lc.fillRect(ex - 10, by - 4, x + w - ex + 20, bh + 8);
    if (v < 1) pos = [ex, by + bh / 2];
  }
  lc.restore();
  return u < 1 ? (pos || [x + w, y + h - bh / 2]) : null;
}
// ckEraser：板擦（屏幕坐标）。rot 弧度，k 缩放
function ckEraser(c, x, y, rot = 0, k = 1) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(k, k);
  cutPaper(c, rectPts(-62, -22, 124, 26, 6), '#8a6446', { seed: 3130, step: 14, blur: 6, sy: 4 });
  cutPaper(c, rectPts(-60, 2, 120, 16, 3), '#6f6a66', { seed: 3131, step: 12, shadow: false, grain: .3 });
  c.restore();
}

// ===================== 粉笔头和粉尘 =====================
// ckStick：一截粉笔（屏幕坐标），笔尖在 (x, y)。writing 为真时轻轻抖；color 是粉笔颜色键
function ckStick(c, pos, tau, o = {}) {
  if (!pos) return;
  const { color = 'ink', writing = true, al = 1 } = o, [x, y] = pos, j = writing ? (hash(Math.floor(tau * 24), 3140) - .5) * 4 : 0;
  c.save(); c.globalAlpha *= al; c.translate(x + j, y + j * .6); c.rotate(-.75);
  cutPaper(c, rectPts(4, -9, 92, 18, 7), ckColor(color), { seed: 3141, step: 10, blur: 6, sx: 4, sy: 6 });
  c.fillStyle = alpha('#000', .12); c.fillRect(60, -9, 36, 18);
  c.restore();
}
// ckDust：粉笔灰——从笔尖往下飘的小点。纯函数：每颗的出生时刻按 0.05 秒网格取，位置由 hash 决定
function ckDust(c, pos, tau, writing, seed = 1) {
  if (!pos) return; const [x, y] = pos;
  c.save(); c.fillStyle = CK.ink;
  for (let k = 0; k < 14; k++) {
    const born = Math.floor(tau / .05) * .05 - k * .05, age = tau - born; if (!writing && age > .1 + k * .02) continue;
    const id = Math.round(born * 20), dx = (hash(id, seed) - .5) * 18 + (hash(id, seed + 1) - .5) * age * 30, dy = age * age * 260 + age * 20;
    c.globalAlpha = clamp(.7 - age * .9, 0, .7); const s = 1 + hash(id, seed + 2) * 2.2;
    c.fillRect(x + dx, y + 6 + dy, s, s);
  }
  c.restore();
}
