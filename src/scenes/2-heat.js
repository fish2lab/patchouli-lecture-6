'use strict';
// 第 2 段 · 水和锅温（heat）。台词和 docs/方案.md 逐字一致。
// 主物件：黑板中左一口炒锅剖面（灶火在下），右上一块温度表盘。水让指针掉、烧透让指针升；
// 放大镜里看蒸汽垫托住肉片；最后底下一片青菜被盐拉出水，缩成小图标，排进「青菜 / 肉」两条下锅时间线。
// 颜色：水和锅温 = blue，热 = orange，当句结论 = yellow。顶层名字带 S2 / s2 前缀。
const S2LINES = seq(1.0, [
  ['第二件事：水，是锅温的敌人。', { hold: .3 }],
  ['湿菜倒进热油锅，锅温一下掉下去，爆炒就变成了水煮。', { hold: .6 }],
  ['所以青菜要沥干，肉片要用厨房纸吸干。', { who: 'meiling', mood: 'smile', pause: .2, hold: .5 }],
  ['锅也一样。空锅先烧到微微冒烟，再倒凉油下肉。', { pause: .2, hold: .4 }],
  ['肉片表面那点水瞬间变成蒸汽，垫在下面，肉就不粘锅。', { pause: .2, hold: 1.2 }],
  ['那我站在锅边，锅是不是就凉了？', { who: 'cirno', mood: 'proud', pause: .2 }],
  ['所以今天你离灶台远一点。', { mood: 'annoyed', hold: .3 }],
  ['盐也会把水拉出来。青菜早放盐，就会出汤变软。', { pause: .3, hold: .5 }],
  ['青菜出锅前再放盐；肉反过来，要提前用盐腌。', { pause: .2, hold: 1.3 }],
]);
const s2T = i => S2LINES[i][0], s2E = i => S2LINES[i][1];
// 第 i 句念到 f 处的时刻（不算 hold）
const s2At = (i, f) => s2T(i) + f * (s2E(i) - ((S2LINES[i][3] || {}).hold || 0) - s2T(i));
const S2DUR = s2E(S2LINES.length - 1) + 1.6;
const s2seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);

// ===================== 位置（板坐标） =====================
const S2WOK = { x: 720, y: 400, s: 1.15 };                 // 锅口中心
const S2WR = 180 * S2WOK.s, S2WD = 92 * S2WOK.s;           // 锅口半宽、锅深
const S2FIRE = [720, 584];                                 // 灶火底
const S2G = { x: 1262, y: 262, r: 104 };                   // 温度表盘
const S2MAG = { x: 995, y: 700, r: 118 };                  // 放大镜
// 擦黑板的几趟：[开始, 结束, 范围]
const S2ER = {
  wet: [s2T(2) - .2, s2T(2) + .45, [512, 196, 430, 318]],      // 锅里的湿菜和「水煮」
  icons: [s2T(3) - .15, s2T(3) + .5, [505, 625, 700, 232]],    // 沥干 / 吸干两个小图
  snow: [s2T(6) + .05, s2T(6) + .7, [1118, 100, 290, 250]],    // 琪露诺的霜
  mag: [s2T(7) - .2, s2T(7) + .45, [505, 425, 700, 430]],      // 放大镜和「蒸汽垫」
  leaf: [s2T(8) - .2, s2T(8) + .35, [505, 600, 700, 255]],     // 盐水、出汤
};

// 锅底曲线：x 处的锅内壁 y
function s2WokY(x) { const u = clamp((x - S2WOK.x) / S2WR, -1, 1); return S2WOK.y + S2WD * (1 - u * u) * (1 - .12 * u * u); }
// 锅里液面高度 yw 处的左右半宽
function s2WokHalf(yw) { let a = 0, b = 1; for (let k = 0; k < 24; k++) { const m = (a + b) / 2; if (S2WOK.y + S2WD * (1 - m * m) * (1 - .12 * m * m) > yw) a = m; else b = m; } return a * S2WR; }

// ===================== 指针 =====================
const S2NEEDLE = [
  [2.7, .1], [3.6, .86],
  [s2At(1, .3), .86], [s2At(1, .3) + .5, .16],
  [s2At(3, .25), .16], [s2At(3, .65), .88],
  [s2At(5, .2), .88], [s2At(5, .5), .34],
  [s2At(6, .25), .34], [s2At(6, .7), .86],
];
function s2Needle(tau) {
  let f = key(tau, S2NEEDLE);
  const cold = win(s2At(5, .4), s2At(6, .3), tau, .3);
  f += cold * .06 * Math.sin(twos(tau) * 13);                  // 琪露诺：指针打哆嗦
  f += (f > .7 ? .012 : .006) * Math.sin(twos(tau) * 7);        // 平时轻轻颤
  return clamp(f, 0, 1);
}
// 表盘：两端加一小段蓝 / 橙弧（冷 / 热），下面写「锅温」
function s2Gauge(lc, tau, p) {
  const { x, y, r } = S2G;
  ogGauge(lc, x, y, r, s2Needle(tau), { p, seed: 2601 });
  const arc = (a0, a1) => { const o = []; for (let i = 0; i <= 6; i++) { const a = lerp(a0, a1, i / 6); o.push([x + r * 1.13 * Math.cos(a), y + r * 1.13 * Math.sin(a)]); } return o; };
  ckLine(lc, arc(Math.PI * 1.02, Math.PI * 1.22), { color: 'blue', w: 6, smooth: true, p: s2seg(p, .5, 1), seed: 2602 });
  ckLine(lc, arc(Math.PI * 1.78, Math.PI * 1.98), { color: 'orange', w: 6, smooth: true, p: s2seg(p, .5, 1), seed: 2603 });
  if (p > .2) { lc.fillStyle = CK.ink; lc.beginPath(); lc.arc(x, y, 8, 0, TAU); lc.fill(); }
}

// ===================== 小画法 =====================
// 一片叶子：中心 (x,y)，长 280*s，rot 旋转，droop 0..1 叶尖往下耷拉
function s2LeafPts(x, y, s, rot, droop = 0) {
  const top = [], bot = [], mid = [], N = 14;
  for (let i = 0; i <= N; i++) { const u = i / N * 2 - 1, wv = 46 * Math.pow(1 - u * u, .8) * (1 + .25 * u), dy = droop * 70 * Math.pow((u + 1) / 2, 2);
    top.push([u * 140, -wv + dy]); bot.unshift([u * 140, wv * .8 + dy]); mid.push([u * 140, dy + 4 * Math.sin(u * 2)]); }
  const T = ([px, py]) => { const c = Math.cos(rot), sn = Math.sin(rot); return [x + s * (px * c - py * sn), y + s * (px * sn + py * c)]; };
  return { out: [...top, ...bot].map(T), mid: [[-165, mid[0][1]], ...mid].map(T), T };
}
function s2Leaf(lc, x, y, s, rot, o = {}) {
  const { droop = 0, p = 1, seed = 2610, color = 'ink' } = o, L = s2LeafPts(x, y, s, rot, droop);
  ckLine(lc, L.out, { color, w: s > .6 ? 5 : 4, close: true, smooth: true, p: s2seg(p, 0, .7), seed });
  ckLine(lc, L.mid, { color: 'muted', w: s > .6 ? 3.5 : 3, smooth: true, p: s2seg(p, .5, 1), seed: seed + 1 });
  if (s > .6 && p >= 1) for (let k = 0; k < 6; k++) { const u = -.6 + (k >> 1) * .45, sg = k & 1 ? 1 : -1, u2 = u + .2, dr = v => droop * 70 * Math.pow((v + 1) / 2, 2);
    const wv = 46 * Math.pow(1 - u2 * u2, .8) * (1 + .25 * u2) * (sg < 0 ? 1 : .8) * .6;
    ckLine(lc, [L.T([u * 140, dr(u)]), L.T([u2 * 140, sg * wv + dr(u2)])], { color: 'muted', w: 2.6, seed: seed + 5 + k }); }
  return L;
}
// 水滴（实心，蓝）：尖头朝上
function s2Drop(lc, x, y, r, al = 1, color = 'blue') {
  if (r <= .3 || al <= 0) return;
  lc.save(); lc.globalAlpha *= al; lc.fillStyle = ckColor(color); lc.beginPath();
  lc.moveTo(x, y - r * 2.1); lc.quadraticCurveTo(x + r * 1.1, y - r * .4, x + r, y); lc.arc(x, y, r, 0, Math.PI); lc.quadraticCurveTo(x - r * 1.1, y - r * .4, x, y - r * 2.1); lc.fill(); lc.restore();
}
// 雪花（六瓣粉笔）
function s2Flake(lc, x, y, r, p, seed) {
  for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3 + .2, dx = Math.cos(a) * r, dy = Math.sin(a) * r;
    ckLine(lc, [[x - dx, y - dy], [x + dx, y + dy]], { color: 'blue', w: 3.5, p: s2seg(p, k / 3, (k + 1) / 3), seed: seed + k }); }
}
// 一缕烟 / 蒸汽：从 (x,y) 往上 h，摆动随时间走（一拍两帧）
function s2Wisp(lc, tau, x, y, h, o = {}) {
  const { color = 'muted', w = 3.5, p = 1, ph = 0, amp = 12, seed = 2640 } = o, tt = twos(tau), pts = [];
  for (let i = 0; i <= 8; i++) { const u = i / 8; pts.push([x + amp * u * Math.sin(u * 5 + tt * 3 + ph), y - h * u]); }
  ckLine(lc, pts, { color, w, smooth: true, p, seed });
}
// 一小撮盐（几个小方粒）
function s2Salt(lc, x, y, p, color = 'yellow', seed = 2650) {
  const n = 9; for (let k = 0; k < n; k++) { if (p <= k / n) break; const row = k < 4 ? 0 : k < 7 ? 1 : 2, i = row === 0 ? k : row === 1 ? k - 4 : k - 7;
    const px = x + (i - (row === 0 ? 1.5 : row === 1 ? 1 : .5)) * 13 + (hash(k, seed) - .5) * 4, py = y - row * 11;
    lc.fillStyle = ckColor(color); lc.fillRect(px - 4, py - 4, 8, 8); }
}
// 肉片贴着锅底（一条弯带）。lift 往上抬的像素
function s2MeatInWok(lc, x0, x1, lift, p, seed = 2660) {
  const top = [], bot = [];
  for (let i = 0; i <= 8; i++) { const x = lerp(x0, x1, i / 8); top.push([x, s2WokY(x) - 30 - lift]); bot.unshift([x, s2WokY(x) - 10 - lift]); }
  ckLine(lc, [...top, ...bot], { color: 'pink', w: 5, close: true, smooth: true, p, seed });
  if (p >= 1) for (let k = 0; k < 2; k++) { const pts = []; for (let i = 1; i <= 7; i++) { const x = lerp(x0, x1, i / 8); pts.push([x, s2WokY(x) - 23 + k * 7 - lift + 2 * Math.sin(i * 1.7 + k)]); }
    ckLine(lc, pts, { color: 'ink', w: 2.4, smooth: true, seed: seed + 1 + k }); }
}

// ===================== 各句的画 =====================
// 第 1 句：油锅的热浪（橙色波纹），湿菜落进锅里后消失
function s2Heat(lc, tau, k) {
  if (k <= 0) return;
  for (let i = 0; i < 3; i++) { const x = 650 + i * 70, pts = [];
    for (let j = 0; j <= 6; j++) { const u = j / 6; pts.push([x + 8 * Math.sin(u * 7 + twos(tau) * 4 + i), 380 - u * 70]); }
    ckLine(lc, pts, { color: 'orange', w: 3.5, smooth: true, p: k, al: .9, seed: 2670 + i }); }
}
// 第 2 句：三片湿青菜落进锅；水面、气泡
const S2WET = [[648, 462, -.22], [724, 474, .08], [796, 460, .26]];
function s2Wet(lc, tau) {
  const t0 = s2At(1, .04);
  S2WET.forEach(([x, y, r], i) => {
    const a = t0 + i * .2, u = s2seg(tau, a, a + .55); if (tau < a - .1) return;
    const e = u * u, yy = lerp(170, y, e), rot = lerp(r - 1.4, r, easeOut(u));
    const L = s2Leaf(lc, x + (1 - u) * (i - 1) * 40, yy, .27, rot, { p: s2seg(tau, a - .1, a + .25), seed: 2680 + i * 3 });
    if (u < 1) for (let d = 0; d < 2; d++) { const q = L.T([d ? 70 : -60, 60]); s2Drop(lc, q[0], q[1] + 8 + 8 * d, 6); }
  });
  const land = t0 + .4 + .55, w = s2seg(tau, land, land + .5);
  if (w > 0) {
    const yw = lerp(s2WokY(S2WOK.x) - 4, 462, easeOut(w)), hw = s2WokHalf(yw) - 6, pts = [];
    for (let i = 0; i <= 20; i++) { const u = i / 20; pts.push([S2WOK.x - hw + 2 * hw * u, yw + 4 * Math.sin(u * 14 + twos(tau) * 6)]); }
    ckLine(lc, pts, { color: 'blue', w: 4.5, smooth: true, seed: 2690 });
    // 冒泡：从锅底升到水面
    const tb = land + .4;
    if (tau > tb) for (let k = 0; k < 7; k++) { const ph = ((tau - tb) * .9 + hash(k, 2691)) % 1, bx = S2WOK.x + (hash(k, 2692) - .5) * 280, by0 = s2WokY(bx) - 10;
      if (by0 < yw + 12) continue; const by = lerp(by0, yw + 6, ph), r = 4 + 5 * ph;
      lc.save(); lc.globalAlpha = Math.min(1, s2seg(tau, tb, tb + .3)) * Math.sin(ph * Math.PI); lc.strokeStyle = CK.blue; lc.lineWidth = 3; lc.beginPath(); lc.arc(bx, by, r, 0, TAU); lc.stroke(); lc.restore(); }
    // 水汽（不是烟）往上冒
    const ts = land + .7;
    for (let k = 0; k < 3; k++) s2Wisp(lc, tau, 650 + k * 70, yw - 30, 80, { color: 'blue', p: s2seg(tau, ts + k * .15, ts + .6 + k * .15), ph: k * 2, seed: 2693 + k });
  }
}
// 第 3 句：沥干（漏勺）、吸干（厨房纸盖肉片）
function s2Icons(lc, tau, wr) {
  const a = s2At(2, .08), pa = s2seg(tau, a, a + .7), cx = 640, cy = 668;
  if (pa > 0) {
    const bowl = []; for (let i = 0; i <= 16; i++) { const u = i / 16 * Math.PI; bowl.push([cx - 92 * Math.cos(u), cy + 64 * Math.sin(u)]); }
    ckLine(lc, bowl, { w: 5, smooth: true, p: s2seg(pa, 0, .6), seed: 2700 });
    ckLine(lc, [[cx - 112, cy], [cx + 112, cy]], { w: 5, p: s2seg(pa, .4, .7), seed: 2701 });
    if (pa >= .7) for (let k = 0; k < 7; k++) { const u = (k + 1) / 8 * Math.PI, hx = cx - 70 * Math.cos(u), hy = cy + 46 * Math.sin(u); lc.fillStyle = CK.muted; lc.beginPath(); lc.arc(hx, hy, 3.5, 0, TAU); lc.fill(); }
    s2Leaf(lc, cx - 26, cy - 12, .24, -.35, { p: s2seg(pa, .5, 1), seed: 2703 });
    s2Leaf(lc, cx + 30, cy - 12, .24, .3, { p: s2seg(pa, .6, 1), seed: 2706 });
    // 滴水
    if (pa >= 1) for (let k = 0; k < 3; k++) { const ph = ((tau - a) * 1.4 + k / 3) % 1, x = cx - 40 + k * 40;
      s2Drop(lc, x, cy + 70 + ph * 46, 6 - ph * 1.5, Math.sin(ph * Math.PI)); }
  }
  wr('沥干', cx, 846, s2At(2, .32), { size: 50, color: 'yellow', heavy: true, align: 'center' });
  // 肉片 + 厨房纸
  const b = s2At(2, .48), pb = s2seg(tau, b, b + .5), mx = 840, my = 692;
  if (pb > 0) ogMeat(lc, mx, my, 160, 58, { p: pb, n: 3, fp: s2seg(pb, .6, 1), thick: 2.6, seed: 2710 });
  const c0 = s2At(2, .6), pc = s2seg(tau, c0, c0 + .4);
  if (pc > 0) { const dy = (1 - easeOut(pc)) * -60, paper = [[mx - 14, my - 12 + dy], [mx + 176, my - 18 + dy], [mx + 180, my + 30 + dy], [mx - 10, my + 34 + dy]];
    lc.save(); lc.globalCompositeOperation = 'destination-out'; lc.fillStyle = '#000'; lc.fill(polyPath(paper)); lc.restore();
    ckShape(lc, paper, { color: 'ink', w: 4.5, seed: 2711, hatch: pc >= 1 ? 'muted' : false, gap: 18 });
    // 纸吸了水：蓝色洇开的小点
    const sp = s2seg(tau, c0 + .45, c0 + 1.3);
    for (let k = 0; k < 6; k++) { if (sp <= k / 6) break; const px = mx + 12 + hash(k, 2712) * 150, py = my - 4 + hash(k, 2713) * 30, r = 5 + 5 * clamp(sp * 6 - k, 0, 1);
      lc.save(); lc.globalAlpha = .85; lc.fillStyle = CK.blue; lc.beginPath(); lc.arc(px, py, r, 0, TAU); lc.fill(); lc.restore(); } }
  wr('吸干', mx + 85, 846, s2At(2, .76), { size: 50, color: 'yellow', heavy: true, align: 'center' });
}
// 第 5 句：放大镜里的蒸汽垫
function s2Mag(lc, tau, wr) {
  const a = s2At(4, .04), pa = s2seg(tau, a, a + .6), { x, y, r } = S2MAG;
  if (pa <= 0) return;
  // 锅里那片肉圈起来，虚线连到放大镜
  ckLine(lc, ellPts(720, s2WokY(720) - 20, 82, 34, 30), { color: 'muted', w: 3.5, close: true, p: pa, seed: 2720 });
  ckLine(lc, [[790, s2WokY(790) - 2], [x - r * .72, y - r * .69]], { color: 'muted', w: 3, dash: [12, 12], p: s2seg(pa, .3, 1), seed: 2721 });
  ckLine(lc, [[700, s2WokY(700) + 12], [x - r, y + 6]], { color: 'muted', w: 3, dash: [12, 12], p: s2seg(pa, .3, 1), seed: 2722 });
  const pc = s2seg(tau, a + .3, a + .9);
  ckLine(lc, circPts(x, y, r, 40), { w: 5.5, close: true, p: pc, seed: 2723 });
  ckLine(lc, [[x + r * .72, y + r * .72], [x + r * 1.05, y + r * 1.05]], { w: 9, p: s2seg(pc, .8, 1), seed: 2724 });
  if (pc < .5) return;
  lc.save(); lc.beginPath(); lc.arc(x, y, r - 5, 0, TAU); lc.clip();
  const sy = xx => y + 80 - .0011 * (xx - x) * (xx - x);
  const surf = []; for (let i = 0; i <= 12; i++) { const xx = x - r + 2 * r * i / 12; surf.push([xx, sy(xx)]); }
  ckLine(lc, surf, { w: 6, smooth: true, p: s2seg(pc, .5, 1), seed: 2725 });
  if (pc >= 1) for (let k = 0; k < 9; k++) { const xx = x - r + 10 + k * 28; ckLine(lc, [[xx, sy(xx) + 10], [xx - 20, sy(xx) + 34]], { color: 'muted', w: 2.6, seed: 2726 + k }); }
  // 底下的火：橙色小箭头往上
  if (pc >= 1) for (let k = 0; k < 3; k++) { const xx = x - 50 + k * 50; ckArrow(lc, [xx, y + r - 4], [xx, sy(xx) + 14], { color: 'orange', w: 3.5, head: 9, seed: 2736 + k * 2 }); }
  // 肉片（落下来）
  const m0 = s2At(4, .1), mu = s2seg(tau, m0, m0 + .4), bob = 1.5 * Math.sin(twos(tau) * 8);
  const st = s2At(4, .28), su = s2seg(tau, st, st + .5);
  const my = lerp(y - 60, y + 14 - 16 * easeOut(su), easeOut(mu)) + (su > 0 ? bob : 0);
  if (mu > 0) ogMeat(lc, x - 82, my, 164, 42, { n: 3, thick: 2.4, p: s2seg(mu, 0, .6), fp: s2seg(mu, .5, 1), seed: 2740 });
  // 蒸汽小泡：一排垫在肉片和锅之间
  for (let k = 0; k < 8; k++) { if (su <= k / 8) break; const xx = x - 74 + k * 21, jj = Math.sin(twos(tau) * 11 + k * 2.1) * 1.5, rr = 7 + 2 * hash(k, 2741);
    ckLine(lc, circPts(xx + jj, sy(xx) - rr - 3 + Math.cos(twos(tau) * 9 + k) * 1.2, rr, 12), { color: 'ink', w: 3, close: true, seed: 2742 + k }); }
  // 两边漏出来的蒸汽
  if (su >= 1) { s2Wisp(lc, tau, x - 90, sy(x - 90) - 8, 60, { color: 'muted', w: 3, amp: -10, seed: 2752 }); s2Wisp(lc, tau, x + 92, sy(x + 92) - 8, 60, { color: 'muted', w: 3, ph: 2, seed: 2753 }); }
  lc.restore();
  wr('蒸汽垫', 530, 742, s2At(4, .5), { size: 60, color: 'yellow', heavy: true });
}
// 第 8 句：一片青菜撒上盐，水被拉出来，叶子耷拉
const S2LEAF = [690, 712];
function s2SaltLeaf(lc, tau, wr) {
  const t0 = s2T(7), droop = sm(s2At(7, .55), s2At(7, .9), tau);
  // 盐粒落在叶面上
  const ts = S2ER.mag[1] + .35;
  for (let k = 0; k < 16; k++) { const tk = ts + k * .04, u = s2seg(tau, tk, tk + .35); if (u <= 0) break;
    const ux = (hash(k, 2760) * 1.6 - .8), L = s2LeafPts(S2LEAF[0], S2LEAF[1], 1, -.06, droop), q = L.T([ux * 140, (hash(k, 2761) - .6) * 40 * (1 - ux * ux) + droop * 70 * Math.pow((ux + 1) / 2, 2)]);
    lc.fillStyle = CK.ink; lc.fillRect(q[0] - 3.5, lerp(q[1] - 120, q[1], u * u) - 3.5, 7, 7); }
  // 水被拉出来：叶缘冒出水珠，往下滴，底下积一摊汤
  const tw = s2At(7, .3);
  if (tau > tw) {
    const L = s2LeafPts(S2LEAF[0], S2LEAF[1], 1, -.06, droop);
    for (let k = 0; k < 5; k++) { const ux = -.7 + k * .35, q = L.T([ux * 140, 40 * Math.pow(1 - ux * ux, .8) + droop * 70 * Math.pow((ux + 1) / 2, 2)]);
      const g = s2seg(tau, tw + k * .12, tw + k * .12 + .4), ph = ((tau - tw - k * .12 - .4) * .8) % 1;
      s2Drop(lc, q[0], q[1] + 10, 7 * g);
      if (tau > tw + k * .12 + .4 && ph >= 0) { const fy = lerp(q[1] + 14, 818, ph * ph); s2Drop(lc, q[0] + 2, fy, 5, 1 - ph * .6); } }
    const pw = s2seg(tau, tw + .6, tw + 2), pts = [];
    if (pw > 0) { for (let i = 0; i <= 14; i++) { const u = i / 14; pts.push([lerp(600, 820, u), 826 + 3 * Math.sin(u * 12 + twos(tau) * 5)]); }
      ckLine(lc, pts, { color: 'blue', w: 5, smooth: true, p: pw, seed: 2770 }); }
  }
  wr('出汤变软', 880, 760, s2At(7, .62), { size: 50, color: 'blue', heavy: true });
}
// 第 9 句：青菜 / 肉两条下锅时间线，盐放在哪一头
function s2Lines(lc, tau, wr) {
  const rows = [[668, s2At(8, .02)], [790, s2At(8, .52)]];
  rows.forEach(([y, t0], i) => {
    const p = s2seg(tau, t0, t0 + .6); if (p <= 0) return;
    ckArrow(lc, [632, y], [1172, y], { color: 'muted', w: 4.5, p, head: 18, seed: 2780 + i * 3 });
    ckLine(lc, [[640, y - 14], [640, y + 14]], { color: 'muted', w: 4, p, seed: 2786 + i });
  });
  // 肉的小图标
  const pm = s2seg(tau, rows[1][1] - .1, rows[1][1] + .4);
  if (pm > 0) ogMeat(lc, 524, 770, 90, 40, { n: 2, thick: 2.2, p: pm, fp: s2seg(pm, .6, 1), seed: 2790 });
  // 盐：青菜在出锅那头，肉在下锅那头
  const a = s2At(8, .18), b = s2At(8, .7);
  s2Salt(lc, 1112, 652, s2seg(tau, a, a + .4), 'yellow', 2791);
  wr('出锅前', 1112, 620, a + .25, { size: 42, color: 'yellow', heavy: true, align: 'center' });
  s2Salt(lc, 700, 774, s2seg(tau, b, b + .4), 'yellow', 2792);
  wr('腌', 700, 742, b + .25, { size: 48, color: 'yellow', heavy: true, align: 'center' });
}

function s2Draw(c, tau, L) {
  ckRoom(c, tau);
  // 第 5 句往放大镜那边推一点，琪露诺开口前拉回
  const cam = ckCam(tau, [[s2T(4), CKB.cx, CKB.cy, 1], [s2T(4) + 1.2, 930, CKB.cy, 1.06], [s2E(4) - .4, 930, CKB.cy, 1.06], [s2T(5) - .1, CKB.cx, CKB.cy, 1]]);
  let pen = null, outro = null, er = null;
  ckLayer(c, cam, lc => {
    const wr = (text, x, y, t0, o = {}) => { if (tau < t0) return null; const w = ckWrite(lc, tau, text, x, y, t0, { size: o.size, align: o.align, spc: o.spc ?? .1 });
      ckText(lc, text, x, y, { size: o.size, color: o.color, p: w.p, heavy: o.heavy, align: o.align }); if (w.writing) pen = { head: w.head, color: o.color }; return w; };
    const erase = ([a, b, r]) => { if (tau > a && tau < b) er = ckErase(lc, r, sm(a, b, tau, t => t)) || er; };
    const before = k => tau < S2ER[k][1];

    // —— 会被擦掉的内容（按出现顺序，各自画到被擦完为止）——
    if (before('wet')) { s2Heat(lc, tau, s2seg(tau, 2.9, 3.5) * (1 - s2seg(tau, s2At(1, .3), s2At(1, .45))));
      s2Wet(lc, tau); wr('水煮', 528, 300, s2At(1, .78), { size: 62, color: 'blue', heavy: true }); }
    erase(S2ER.wet);
    if (tau > s2T(2) - .3 && before('icons')) s2Icons(lc, tau, wr);
    erase(S2ER.icons);
    if (tau > s2T(5) && before('snow')) {
      const pts = [[1150, 170], [1386, 150], [1392, 312], [1140, 300], [1270, 120]];
      pts.forEach(([x, y], k) => s2Flake(lc, x, y, 15 + 3 * hash(k, 2800), s2seg(tau, s2At(5, .3) + k * .12, s2At(5, .3) + k * .12 + .3), 2801 + k * 4));
    }
    erase(S2ER.snow);
    if (tau > s2T(4) && before('mag')) s2Mag(lc, tau, wr);
    erase(S2ER.mag);
    if (tau > s2T(7) && before('leaf')) s2SaltLeaf(lc, tau, wr);
    erase(S2ER.leaf);

    // —— 一直在的：标题、锅、火、表盘 ——
    ckBadge(lc, '二 · 水', 510, 78, 'blue', s2seg(tau, .7, 1.7), 2810);
    if (tau > 1.1) { const p = s2seg(tau, 1.5, 2.4);
      // 第 4 句起：烧空锅冒烟 → 凉油 → 下肉
      const tsm = s2At(3, .3), toil = s2At(3, .6), tm = s2At(3, .84);
      if (tau > tsm) for (let k = 0; k < 3; k++) { const x0 = 650 + k * 70; s2Wisp(lc, tau, x0, s2WokY(x0) - 18, 120 - 14 * (k % 2), { p: s2seg(tau, tsm + k * .15, tsm + .8 + k * .15) * (1 - s2seg(tau, tm - .1, tm + .4)), amp: 14, ph: k * 1.7, seed: 2820 + k }); }
      if (tau > toil) { const pts = []; for (let i = 0; i <= 12; i++) { const x = lerp(590, 850, i / 12); pts.push([x, s2WokY(x) - 7]); }
        ckLine(lc, pts, { color: 'orange', w: 4, smooth: true, p: s2seg(tau, toil, toil + .5), seed: 2825 }); }
      if (tau > tm) { const u = s2seg(tau, tm, tm + .35), lift = (1 - u * u) * 120 + (tau > s2At(4, .28) ? 4 + 1.5 * Math.sin(twos(tau) * 8) : 0);
        s2MeatInWok(lc, 668, 772, lift, s2seg(tau, tm - .1, tm + .2), 2826);
        // 肉下面嗤的一下：几缕小蒸汽
        const st = s2At(4, .28); if (tau > st) for (let k = 0; k < 2; k++) s2Wisp(lc, tau, 655 + k * 130, s2WokY(655 + k * 130) - 14, 46, { color: 'muted', w: 3, amp: (k ? 1 : -1) * 8, p: s2seg(tau, st, st + .4) * (1 - s2seg(tau, s2T(7), s2T(7) + .5)), seed: 2830 + k }); }
      ogWok(lc, S2WOK.x, S2WOK.y, S2WOK.s, { p, seed: 2840, w: 6 });
      ckLine(lc, [[610, S2FIRE[1] + 6], [830, S2FIRE[1] + 6]], { color: 'muted', w: 4, p: s2seg(tau, 2.2, 2.6), seed: 2842 });
      ogFlame(lc, S2FIRE[0], S2FIRE[1], 1.25, tau, { k: s2seg(tau, 2.3, 2.8) * (1 + .3 * s2seg(tau, s2At(3, .2), s2At(3, .5))), seed: 2843 });
    }
    s2Gauge(lc, tau, s2seg(tau, 2.4, 3.1));
    wr('锅温', S2G.x, 330, 3.0, { size: 48, color: 'blue', heavy: true, align: 'center' });

    if (tau > s2T(8) - .2) {
      // 那片青菜缩成「青菜」行的小图标
      const k = sm(s2T(8) - .1, s2T(8) + .5, tau);
      s2Leaf(lc, lerp(S2LEAF[0], 572, k), lerp(S2LEAF[1], 664, k), lerp(1, .3, k), lerp(-.06, -.15, k), { droop: lerp(sm(s2At(7, .55), s2At(7, .9), tau), 0, k), seed: 2850 });
      s2Lines(lc, tau, wr);
    } else if (tau > s2T(7)) s2Leaf(lc, S2LEAF[0], S2LEAF[1], 1, -.06, { droop: sm(s2At(7, .55), s2At(7, .9), tau), p: s2seg(tau, S2ER.mag[1], S2ER.mag[1] + .5), seed: 2850 });

    outro = ogOutro(lc, tau, S2DUR, cam);
  });
  if (pen) { const sp = ckToScreen(cam, pen.head[0], pen.head[1]); ckStick(c, sp, tau, { color: pen.color || 'ink' }); ckDust(c, sp, tau, true, 2860); }
  ogEraser(c, cam, er);
  ogEraser(c, cam, outro);
  // 人物
  const pt = (i, a, b) => tau > s2At(i, a) && tau < s2At(i, b);
  const point = pt(1, .1, .8) || pt(4, .05, .8) || pt(7, .1, .7);
  const cross = tau > s2T(6) - .1 && tau < s2E(6) + .2;
  ogPch(c, tau, L, { pose: cross ? 'cross' : point ? 'point' : 'lecture', gesture: .6 });
  ogMei(c, tau, L, { pose: tau > s2T(2) && tau < s2E(2) ? 'kungfu' : 'stand', gesture: sm(s2T(2), s2T(2) + .5, tau) });
  ogCirno(c, tau, L, S2LINES);
}
scene({ order: 2, key: 'heat', title: '水和锅温', dur: S2DUR, lines: S2LINES, fn: s2Draw });
