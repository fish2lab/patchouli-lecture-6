'use strict';
// 第 4 段 · 辣椒炒肉（dish）。台词和 docs/方案.md 逐字一致；画面见 docs/分镜.md。
// 主物件：上一段的横时间轴转成一根竖的绿色「骨架」，上面挂五个步骤（①备肉 ②干煸辣椒 ③煸油滑肉 ④合炒 ⑤出锅），
// 每步一行：编号 + 步骤名 + 下面的三色徽章（切 粉 / 水 蓝 / 序 绿）+ 小图标 + 正在念的关键词。
// 第 6 句在④下面挂一组调料条（2 : 1 : 0.5）；第 8 句琪露诺问表，右上画一只被划掉的秒表；
// 第 9 句黑板推过去，露出三个「生熟信号」：肉由红变白、青菜塌下变深绿、筷子扎得透。
// 顶层名字带 S4 / s4 前缀。
const S4LINES = seq(1.0, [
  ['把三件事放进一道辣椒炒肉里试试。', { hold: .3 }],
  ['瘦肉顺纹切片，吸干水，抓盐，抓水，裹粉，封油。', { who: 'meiling', mood: 'smile', hold: .7 }],
  ['辣椒不放油，先干煸，逼出水汽，煸到起虎皮。', { who: 'meiling', mood: 'smile', hold: .6 }],
  ['空锅烧透，肥肉煸出猪油，下蒜，再大火滑肉。', { who: 'meiling', mood: 'smile', hold: .6 }],
  ['肉一变白，辣椒回锅，锅边淋料酒。', { hold: .5 }],
  ['生抽、蚝油、老抽，大约二比一比半。', { hold: 1.2 }],
  ['关火撒鸡精，出锅。盘底一层红油，没有水汤。', { who: 'meiling', mood: 'smile', hold: .9 }],
  ['可是美铃一次都没看表啊？', { who: 'cirno', mood: 'proud', hold: .2 }],
  ['不看表，看食材。肉由红变白，青菜塌下变深绿，筷子扎得透，就熟了。', { pause: .3, hold: 1.3 }],
]);
const s4T = i => S4LINES[i][0], s4E = i => S4LINES[i][1];
// 第 i 句念到 f 处的时刻（不算 hold）
const s4At = (i, f) => s4T(i) + f * (s4E(i) - ((S4LINES[i][3] || {}).hold || 0) - .3 - s4T(i));
const S4DUR = s4E(S4LINES.length - 1) + 1.6;
const s4seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);

// ===================== 版面 =====================
const S4SX = 530;                         // 骨架（竖线）x
const S4NX = 572;                         // 步骤名 x
const S4IX = 815;                         // 图标列中心 x
const S4KX = 925;                         // 关键词列 x
const S4ROWS = [                          // 每步：行中心 y、步骤名、徽章、对应台词
  { y: 218, name: '备肉', b: [['切', 'pink'], ['水', 'blue']], i: 1 },
  { y: 322, name: '干煸辣椒', b: [['水', 'blue']], i: 2 },
  { y: 426, name: '煸油滑肉', b: [['水', 'blue'], ['序', 'green']], i: 3 },
  { y: 530, name: '合炒', b: [['序', 'green']], i: 4 },
  { y: 752, name: '出锅', b: [['水', 'blue'], ['序', 'green']], i: 6 },
];
const S4CLOCK = [1312, 300];              // 琪露诺那句的秒表（右上空地，不进她的角落）
const S4PAN = 1350;                       // 第 9 句黑板推过去的距离（推完列表完全出画）
const S4BROWN = '#c9925e';                // 虎皮斑
const S4OIL = '#f4a88e';                  // 红油

// ===================== 小部件 =====================
// 三色徽章：圆角方框 + 一个字。(x,y) 左上角，s 边长
function s4Badge(lc, ch, x, y, color, p, seed, s = 40) {
  if (p <= 0) return;
  const k = .7 + .3 * easeOutBack(clamp(p * 1.6, 0, 1));
  lc.save(); lc.translate(x + s / 2, y + s / 2); lc.scale(k, k);
  ckShape(lc, rectPts(-s / 2, -s / 2, s, s, 9), { color, w: 4, p: clamp(p * 2, 0, 1), seed });
  ckText(lc, ch, 0, s * .36, { size: Math.max(30, s * .74), color, align: 'center', heavy: true, p: clamp(p * 2 - 1, 0, 1) });
  lc.restore();
}
// 骨架上的编号圈（先把圈里的骨架线挖掉）
function s4Num(lc, n, y, p, seed) {
  if (p <= 0) return;
  lc.save(); lc.globalCompositeOperation = 'destination-out'; lc.fillStyle = '#000'; lc.beginPath(); lc.arc(S4SX, y, 23 * Math.min(1, p * 2), 0, TAU); lc.fill(); lc.restore();
  ckLine(lc, circPts(S4SX, y, 23, 26), { color: 'green', w: 4.5, close: true, smooth: true, p: clamp(p * 1.6, 0, 1), seed });
  ckText(lc, String(n), S4SX, y + 11, { size: 31, color: 'ink', align: 'center', heavy: true, p: s4seg(p, .5, 1) });
}
// 辣椒：粗端在 (0,0)，朝 +x 长 110（局部坐标），s 缩放、rot 旋转。o.spots 虎皮 0..1
const S4CHILI = spline([[0, -13], [30, -15], [62, -12], [92, -5], [112, 6], [104, 10], [74, 10], [42, 13], [12, 14], [-2, 6]], 5, true);
function s4Chili(lc, x, y, s, rot, o = {}) {
  const { p = 1, spots = 0, color = 'ink', seed = 4401 } = o;
  lc.save(); lc.translate(x, y); lc.rotate(rot); lc.scale(s, s);
  ckLine(lc, S4CHILI, { color, w: 4.5 / s, close: true, smooth: true, p, seed });
  ckLine(lc, [[-1, -2], [-12, -6], [-18, -16]], { color: 'muted', w: 4 / s, smooth: true, p: s4seg(p, .6, 1), seed: seed + 1 });
  if (spots > 0) { lc.fillStyle = S4BROWN;
    [[22, -3, 6], [44, 2, 5], [64, -4, 5.5], [86, 2, 4.5], [34, 8, 3.5]].forEach(([sx, sy, r], k) => {
      const a = clamp(spots * 5 - k, 0, 1); if (a <= 0) return;
      lc.globalAlpha = .9 * a; lc.beginPath(); lc.ellipse(sx, sy, r * 1.3, r * .9, .2 * k, 0, TAU); lc.fill(); }); lc.globalAlpha = 1; }
  lc.restore();
}
// 一缕蒸汽：从 (x,y) 往上冒，k 0..1 浓度
function s4Steam(lc, x, y, tau, k, seed, h = 46, color = 'blue') {
  if (k <= .02) return;
  for (let j = 0; j < 3; j++) {
    const ph = (tau * .9 + j / 3 + hash(seed, 1) * .3) % 1, x0 = x + (j - 1) * 16, y0 = y - ph * 22, pts = [];
    for (let q = 0; q <= 8; q++) { const u = q / 8; pts.push([x0 + 6 * Math.sin(u * 5 + ph * 6 + j), y0 - u * h]); }
    ckLine(lc, pts, { color, w: 3.2, smooth: true, al: k * Math.sin(ph * Math.PI), seed: seed + j });
  }
}
// 小肉片（圆角块），color 可传颜色值
function s4Slice(lc, x, y, w, h, color, seed, p = 1) {
  ckShape(lc, rectPts(x - w / 2, y - h / 2, w, h, Math.min(8, h / 3)), { color, w: 3.5, p, seed });
}
// 小箭头（字中间的 →）
function s4To(lc, x, y, p, seed, color = 'muted', len = 26) {
  if (p <= 0) return; ckArrow(lc, [x, y], [x + len, y], { color, w: 3.5, head: 9, p, seed });
}

// ===================== 第 9 句：三个生熟信号 =====================
function s4Signals(lc, tau, wr) {
  const X = S4PAN, cxs = [X + 640, X + 950, X + 1260], i = 8;
  wr('看食材', X + 950, 176, s4At(i, .12), { size: 62, color: 'yellow', heavy: true, align: 'center' });
  // (a) 肉片：粉 → 白
  const ta = s4At(i, .25), ua = sm(ta + .4, ta + 1.8, tau), pa = s4seg(tau, ta - .2, ta + .5);
  if (pa > 0) { const col = mix(CK.pink, CK.ink, ua), cx = cxs[0];
    ckShape(lc, rectPts(cx - 105, 340, 210, 108, 22), { color: col, w: 5, p: pa, seed: 4501, hatch: pa >= 1 ? col : false, gap: 18 });
    for (let k = 0; k < 3; k++) { const pts = []; for (let j = 0; j <= 10; j++) { const u = j / 10; pts.push([cx - 82 + 164 * u, 368 + k * 26 + 3 * Math.sin(u * 9 + k)]); }
      ckLine(lc, pts, { color: mix(CK.pink, CK.ink, ua * .6), w: 3, smooth: true, p: s4seg(pa, .5, 1), seed: 4502 + k }); }
    if (ua > .05 && ua < .98) s4Steam(lc, cx, 320, tau, Math.sin(ua * Math.PI), 4505, 40, 'muted'); }
  wr('红', cxs[0] - 64, 600, ta + .3, { size: 44, color: 'pink' });
  if (tau > ta + .5) s4To(lc, cxs[0] - 12, 585, s4seg(tau, ta + .5, ta + .8), 4508, 'muted', 30);
  wr('白', cxs[0] + 28, 600, ta + .8, { size: 44, color: 'ink' });
  // (b) 青菜：挺 → 塌，浅绿 → 深绿
  const tb = s4At(i, .43), ub = sm(tb + .5, tb + 2.0, tau), pb = s4seg(tau, tb - .2, tb + .5);
  if (pb > 0) { const cx = cxs[1], col = mix(CK.green, '#6f9e5c', ub), stem = [];
    let px = cx - 30, py = 505, ang = -Math.PI / 2 + .12;
    for (let q = 0; q <= 12; q++) { stem.push([px, py]); const u = q / 12; ang += (.02 + ub * .2 * u * 1.4); px += Math.cos(ang) * 13; py += Math.sin(ang) * 13; }
    ckLine(lc, stem, { color: col, w: 6, smooth: true, p: s4seg(pb, 0, .5), seed: 4511 });
    const [tx, ty] = stem.at(-1), [qx, qy] = stem.at(-2), a = Math.atan2(ty - qy, tx - qx), L = 92, Wd = 30 * (1 - .25 * ub);
    const leaf = []; for (let q = 0; q <= 16; q++) { const u = q / 16, s = Math.sin(u * Math.PI) * Wd; leaf.push([u * L, -s]); }
    for (let q = 15; q >= 1; q--) { const u = q / 16, s = Math.sin(u * Math.PI) * Wd * .8; leaf.push([u * L, s]); }
    const lp = leaf.map(([lx, ly]) => [tx + lx * Math.cos(a) - ly * Math.sin(a), ty + lx * Math.sin(a) + ly * Math.cos(a)]);
    ckShape(lc, lp, { color: col, w: 5, p: s4seg(pb, .4, 1), seed: 4512, hatch: pb >= 1 ? col : false, gap: lerp(16, 8, ub) });
    ckLine(lc, [[tx, ty], [tx + L * .9 * Math.cos(a), ty + L * .9 * Math.sin(a)]], { color: col, w: 2.6, p: s4seg(pb, .7, 1), seed: 4513 });
    ckLine(lc, [[cx - 90, 508], [cx + 90, 508]], { color: 'muted', w: 3.5, p: s4seg(pb, 0, .4), seed: 4514 }); }
  wr('塌下', cxs[1] - 92, 600, tb + .3, { size: 40, color: 'ink' });
  wr('深绿', cxs[1] + 10, 600, tb + 1.2, { size: 40, color: 'green' });
  // (c) 筷子扎透一块肉
  const tc = s4At(i, .67), uc = sm(tc + .4, tc + 1.5, tau), pc = s4seg(tau, tc - .2, tc + .4);
  if (pc > 0) { const cx = cxs[2];
    ckShape(lc, rectPts(cx - 70, 382, 140, 110, 18), { color: 'muted', w: 5, p: pc, seed: 4521, hatch: pc >= 1 ? 'muted' : false, gap: 16 });
    const tip = lerp(300, 540, uc), len = 190;
    for (const dx of [-9, 9]) ckLine(lc, [[cx + dx * 1.6, tip - len], [cx + dx * .4, tip]], { color: 'ink', w: 5, p: s4seg(pc, .3, 1), seed: 4522 + dx });
    if (uc > .97) for (let k = 0; k < 3; k++) { const a = Math.PI / 2 + (k - 1) * .7;   // 底下扎穿的小火花
      ckLine(lc, [[cx + Math.cos(a) * 26, 500 + Math.sin(a) * 12], [cx + Math.cos(a) * 42, 500 + Math.sin(a) * 22]], { color: 'yellow', w: 3.5, seed: 4526 + k }); } }
  wr('扎得透', cxs[2], 600, tc + .5, { size: 40, color: 'ink', align: 'center' });
  // 就熟了
  const td = s4At(i, .88);
  wr('就熟了', X + 950, 760, td, { size: 60, color: 'yellow', heavy: true, align: 'center' });
  if (tau > td + .3) for (let k = 0; k < 3; k++) { const x = cxs[k] + 92, y = 640, p = s4seg(tau, td + .3 + k * .15, td + .55 + k * .15);
    ckLine(lc, [[x - 22, y - 8], [x - 8, y + 6], [x + 18, y - 24]], { color: 'yellow', w: 5, p, seed: 4530 + k }); }
}

// ===================== 秒表（琪露诺那句） =====================
function s4Clock(lc, tau, i) {
  const [x, y] = S4CLOCK, p = s4seg(tau, s4T(i) + .1, s4T(i) + .8), r = 58;
  if (p <= 0) return;
  ckLine(lc, circPts(x, y, r, 40), { color: 'ink', w: 5, close: true, smooth: true, p, seed: 4541 });
  ckShape(lc, rectPts(x - 12, y - r - 22, 24, 16, 4), { color: 'ink', w: 4, p: s4seg(p, .5, 1), seed: 4542 });
  ckLine(lc, [[x + r * .72, y - r * .72], [x + r * .9, y - r * .9]], { w: 5, p: s4seg(p, .5, 1), seed: 4543 });
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, r0 = k % 3 ? r * .84 : r * .74;
    ckLine(lc, [[x + Math.cos(a) * r0, y + Math.sin(a) * r0], [x + Math.cos(a) * r * .94, y + Math.sin(a) * r * .94]], { color: 'muted', w: 3, p: s4seg(p, .6, 1), seed: 4544 + k }); }
  const a = -Math.PI / 2 + Math.floor((tau - s4T(i)) * 4) / 4 * TAU / 6;   // 秒针一跳一跳
  ckLine(lc, [[x, y], [x + Math.cos(a) * r * .7, y + Math.sin(a) * r * .7]], { color: 'blue', w: 4, p: s4seg(p, .7, 1), seed: 4556 });
  const tx = s4At(i, .62), q = s4seg(tau, tx, tx + .35);
  ckLine(lc, [[x - r - 10, y - r - 10], [x + r + 10, y + r + 10]], { color: 'pink', w: 7, p: s4seg(q, 0, .5), seed: 4557 });
  ckLine(lc, [[x + r + 10, y - r - 10], [x - r - 10, y + r + 10]], { color: 'pink', w: 7, p: s4seg(q, .5, 1), seed: 4558 });
}

function s4Draw(c, tau, L) {
  ckRoom(c, tau);
  const tp = s4T(8) - .25, cam = { x: CKB.cx + S4PAN * sm(tp, tp + 1.1, tau), y: CKB.cy, z: 1 };
  let pen = null, outro = null;
  ckLayer(c, cam, lc => {
    const wr = (text, x, y, t0, o = {}) => { const w = ckWrite(lc, tau, text, x, y, t0, { size: o.size, spc: o.spc ?? .07, align: o.align });
      ckText(lc, text, x, y, { size: o.size, color: o.color, p: w.p, heavy: o.heavy, align: o.align }); if (w.writing) pen = w; return w; };
    const R = S4ROWS, list = tau < tp + 1.3;
    if (list) {
      lc.save(); lc.globalAlpha = 1 - sm(tp, tp + .4, tau);   // 推板时列表淡出，不从帕秋莉身后扫过去
      // ---- 骨架：先是一根横的时间轴（接上一段），再竖起来，成为步骤条的脊 ----
      const g1 = sm(.6, 1.2, tau), g2 = sm(1.3, 2.3, tau);
      const th = Math.PI / 2 * g2, hl = lerp(340, (R[4].y - R[0].y) / 2, g2), cx = lerp(960, S4SX, g2), cy = lerp(480, (R[0].y + R[4].y) / 2, g2);
      const A = [cx - Math.cos(th) * hl, cy - Math.sin(th) * hl], B = [cx + Math.cos(th) * hl, cy + Math.sin(th) * hl];
      ckLine(lc, [A, B], { color: 'green', w: 5, p: g1, seed: 4401 });
      if (g2 < 1) for (let k = 0; k < 5; k++) { const u = (k + .5) / 5, x = lerp(A[0], B[0], u), y = lerp(A[1], B[1], u), nx = -Math.sin(th) * 14, ny = Math.cos(th) * 14;   // 时间轴上的刻度，竖起来时收掉
        ckLine(lc, [[x - nx, y - ny], [x + nx, y + ny]], { color: 'green', w: 4, p: g1, al: 1 - g2, seed: 4402 + k }); }
      // ---- 第 1 句：标题 + 三色图例 ----
      wr('辣椒炒肉', 520, 130, s4At(0, .35), { size: 60, color: 'yellow', heavy: true });
      [['切', 'pink'], ['水', 'blue'], ['序', 'green']].forEach(([ch, col], k) =>
        s4Badge(lc, ch, 790 + k * 62, 86, col, s4seg(tau, s4At(0, .65) + k * .22, s4At(0, .65) + k * .22 + .4), 4410 + k, 48));
      // ---- 每一行的公共部分：编号、步骤名、徽章 ----
      R.forEach((r, n) => { const t0 = s4T(r.i);
        s4Num(lc, n + 1, r.y, s4seg(tau, t0 - .1, t0 + .3), 4420 + n);
        wr(r.name, S4NX, r.y - 6, t0 + .1, { size: 38, color: 'ink' });
        const tb = s4At(r.i, .93);
        r.b.forEach(([ch, col], k) => s4Badge(lc, ch, S4NX + k * 48, r.y + 10, col, s4seg(tau, tb + k * .2, tb + k * .2 + .4), 4430 + n * 3 + k));
      });
      // ---- ① 备肉：一片顺纹的肉，吸掉水珠；盐→水→粉→油 ----
      { const r = R[0], i = 1, t0 = s4T(i), y = r.y, pi = s4seg(tau, t0 + .2, t0 + .9);
        if (pi > 0) { ckShape(lc, rectPts(S4IX - 62, y - 30, 124, 60, 14), { color: 'pink', w: 4.5, p: pi, seed: 4440 });
          for (let k = 0; k < 3; k++) ckLine(lc, [[S4IX - 46, y - 14 + k * 14], [S4IX + 46, y - 14 + k * 14]], { color: 'ink', w: 2.6, p: s4seg(pi, .6, 1), seed: 4441 + k });
          const td = s4At(i, .3), dry = sm(td, td + .8, tau);   // 吸干：两颗水珠变小消失
          for (const [dx, dy] of [[-22, -40], [26, -42]]) { const k = 1 - dry; if (k <= .02 || pi < 1) continue;
            lc.save(); lc.globalAlpha = k; lc.fillStyle = CK.blue; const x = S4IX + dx, yy = y + dy + 6 * dry, s = 6 * (.4 + .6 * k);
            lc.beginPath(); lc.moveTo(x, yy - s * 1.9); lc.quadraticCurveTo(x + s, yy - s * .3, x + s, yy); lc.arc(x, yy, s, 0, Math.PI); lc.quadraticCurveTo(x - s, yy - s * .3, x, yy - s * 1.9); lc.fill(); lc.restore(); } }
        wr('顺纹切', S4KX, y - 10, s4At(i, .08), { size: 32, color: 'pink' });
        wr('吸干', S4KX + 120, y - 10, s4At(i, .3), { size: 32, color: 'blue' });
        [['盐', 'ink', .46], ['水', 'blue', .6], ['粉', 'ink', .73], ['油', 'ink', .86]].forEach(([ch, col, f], k) => {
          const x = S4KX + k * 64, t = s4At(i, f);
          if (k) s4To(lc, x - 34, y + 25, s4seg(tau, t - .15, t + .05), 4446 + k);
          wr(ch, x, y + 36, t, { size: 32, color: col }); });
      }
      // ---- ② 干煸辣椒：辣椒起虎皮，水汽往上走 ----
      { const r = R[1], i = 2, t0 = s4T(i), y = r.y, pi = s4seg(tau, t0 + .2, t0 + 1);
        const ts = s4At(i, .78), tv = s4At(i, .46);
        if (pi > 0) s4Chili(lc, S4IX - 52, y + 6, .95, -.06, { p: pi, spots: s4seg(tau, ts, ts + .8), seed: 4450 });
        if (tau > tv) s4Steam(lc, S4IX + 2, y - 18, tau, s4seg(tau, tv, tv + .4) * (1 - .7 * s4seg(tau, s4E(i), s4E(i) + 1)), 4455, 30);
        wr('不放油', S4KX, y - 10, s4At(i, .08), { size: 32, color: 'muted' });
        wr('干煸', S4KX + 120, y - 10, s4At(i, .3), { size: 32, color: 'ink' });
        wr('逼出水汽', S4KX, y + 36, tv, { size: 32, color: 'blue' });
        wr('虎皮', S4KX + 150, y + 36, ts, { size: 32, color: S4BROWN });
      }
      // ---- ③ 煸油滑肉：小锅 + 灶火，猪油、蒜、肉依次下 ----
      { const r = R[2], i = 3, t0 = s4T(i), y = r.y, pi = s4seg(tau, t0 + .2, t0 + .9);
        const tf = s4At(i, .76), tg = s4At(i, .56), to = s4At(i, .4);
        if (pi > 0) { ogWok(lc, S4IX - 10, y - 14, .3, { p: pi, seed: 4460 });
          ogFlame(lc, S4IX - 10, y + 42, .42, tau, { k: pi * lerp(.55, 1.15, sm(tf, tf + .4, tau)), seed: 4461 }); }
        if (tau > to) ckLine(lc, [[S4IX - 40, y + 4], [S4IX - 10, y + 10], [S4IX + 20, y + 4]], { color: S4OIL, w: 4, smooth: true, p: s4seg(tau, to, to + .4), seed: 4463 });
        if (tau > tg) for (let k = 0; k < 3; k++) { lc.save(); lc.globalAlpha = s4seg(tau, tg + k * .1, tg + k * .1 + .2); lc.fillStyle = CK.ink;
          lc.beginPath(); lc.arc(S4IX - 34 + k * 12, y - 6 + (k % 2) * 4, 4, 0, TAU); lc.fill(); lc.restore(); }
        if (tau > tf) for (let k = 0; k < 2; k++) s4Slice(lc, S4IX - 2 + k * 22, y - 4 - k * 3, 22, 10, 'pink', 4465 + k, s4seg(tau, tf + k * .15, tf + k * .15 + .3));
        wr('烧透', S4KX, y - 10, s4At(i, .06), { size: 32, color: 'blue' });
        wr('猪油', S4KX + 90, y - 10, to, { size: 32, color: 'muted' });
        wr('下蒜', S4KX, y + 36, tg, { size: 32, color: 'green' });
        if (tau > tf - .2) s4To(lc, S4KX + 72, y + 25, s4seg(tau, tf - .2, tf), 4468, 'green');
        wr('滑肉', S4KX + 108, y + 36, tf, { size: 32, color: 'green' });
      }
      // ---- ④ 合炒：肉变白，辣椒回锅，锅边淋料酒 ----
      { const r = R[3], i = 4, t0 = s4T(i), y = r.y, pi = s4seg(tau, t0 + .1, t0 + .7);
        const tw = s4At(i, .1), tr = s4At(i, .45), tj = s4At(i, .8);
        if (pi > 0) { ogWok(lc, S4IX - 10, y - 8, .3, { p: pi, seed: 4470 });
          const wcol = mix(CK.pink, CK.ink, sm(tw, tw + .8, tau));
          for (let k = 0; k < 2; k++) s4Slice(lc, S4IX - 30 + k * 26, y + 2 - k * 3, 22, 10, wcol, 4471 + k, s4seg(pi, .5, 1)); }
        if (tau > tr) { const u = sm(tr, tr + .7, tau, easeIO);   // 小辣椒沿弧线落回锅
          ckArrow(lc, [S4IX - 92, y - 46], [S4IX - 22, y - 18], { color: 'green', w: 3.5, head: 10, bend: -14, p: s4seg(tau, tr, tr + .4), seed: 4474 });
          s4Chili(lc, lerp(S4IX - 96, S4IX + 4, u), lerp(y - 46, y - 2, u) - 18 * Math.sin(u * Math.PI), .32, .15 + .1 * u, { spots: 1, seed: 4475 }); }
        if (tau > tj) { const u = s4seg(tau, tj, tj + .5);   // 料酒沿锅边流下 + 酒气
          ckLine(lc, [[S4IX + 46, y - 18], [S4IX + 40, y], [S4IX + 26, y + 14]], { color: 'green', w: 3.5, dash: [8, 7], smooth: true, p: u, seed: 4477 });
          s4Steam(lc, S4IX + 36, y - 22, tau, u * (1 - s4seg(tau, s4E(i) + .5, s4E(i) + 1.5)), 4478, 26, 'muted'); }
        wr('肉变白', S4KX, y - 10, tw, { size: 32, color: 'ink' });
        wr('辣椒回锅', S4KX + 112, y - 10, tr, { size: 32, color: 'green' });
        wr('锅边淋', S4KX, y + 36, s4At(i, .62), { size: 32, color: 'ink' });
        wr('料酒', S4KX + 98, y + 36, tj, { size: 32, color: 'green' });
      }
      // ---- 第 6 句：调料条 2 : 1 : 0.5（挂在④下面） ----
      { const i = 5, bx = 662, U = 100;
        [['生抽', .0, 2], ['蚝油', .17, 1], ['老抽', .34, .5]].forEach(([nm, f, v], k) => {
          const t = s4At(i, f) + .05, y = 615 + k * 37;
          wr(nm, S4NX, y, t, { size: 30, color: 'muted', spc: .05 });
          const p = s4seg(tau, t + .1, t + .5); if (p <= 0) return;
          ckShape(lc, rectPts(bx, y - 24, U * v * easeOut(p), 22, 5), { color: 'ink', w: 3.5, hatch: p >= 1 ? 'muted' : false, gap: 9, seed: 4480 + k }); });
        wr('2 : 1 : 0.5', S4KX - 10, 668, s4At(i, .6), { size: 52, color: 'yellow', heavy: true, spc: .06 });
      }
      // ---- ⑤ 出锅：盘底一层红油，没有水汤 ----
      { const r = R[4], i = 6, t0 = s4T(i), y = r.y, pi = s4seg(tau, s4At(i, .3), s4At(i, .3) + .7);
        if (pi > 0) { ckLine(lc, ellPts(S4IX - 10, y + 14, 74, 20, 36), { color: 'ink', w: 4.5, close: true, smooth: true, p: pi, seed: 4490 });
          ckLine(lc, ellPts(S4IX - 10, y + 14, 50, 11, 30), { color: 'muted', w: 3, close: true, smooth: true, p: s4seg(pi, .4, 1), seed: 4491 });
          // 菜堆：几片肉 + 两段辣椒
          if (pi >= 1) { s4Slice(lc, S4IX - 30, y + 2, 26, 11, 'ink', 4492); s4Slice(lc, S4IX + 6, y - 2, 26, 11, 'ink', 4493);
            s4Chili(lc, S4IX - 48, y - 8, .36, -.1, { spots: 1, seed: 4494 }); s4Chili(lc, S4IX - 4, y + 10, .32, .2, { spots: 1, seed: 4495 }); } }
        const to = s4At(i, .5);
        if (tau > to) { const pts = []; for (let q = 0; q <= 14; q++) { const a = Math.PI * (.12 + .76 * q / 14); pts.push([S4IX - 10 + 60 * Math.cos(a), y + 14 + 15 * Math.sin(a)]); }
          ckLine(lc, pts, { color: S4OIL, w: 5, smooth: true, p: s4seg(tau, to, to + .6), seed: 4496 }); }
        wr('关火', S4KX, y - 10, s4At(i, .02), { size: 32, color: 'green' });
        if (tau > s4At(i, .1)) s4To(lc, S4KX + 72, y - 21, s4seg(tau, s4At(i, .1), s4At(i, .16)), 4497, 'green');
        wr('鸡精', S4KX + 108, y - 10, s4At(i, .14), { size: 32, color: 'green' });
        wr('红油', S4KX, y + 36, to, { size: 32, color: S4OIL });
        const tx = s4At(i, .78);
        wr('水汤', S4KX + 100, y + 36, tx, { size: 32, color: 'blue' });
        const q = s4seg(tau, tx + .3, tx + .7);
        if (q > 0) { ckLine(lc, [[S4KX + 92, y + 2], [S4KX + 172, y + 46]], { color: 'blue', w: 5, p: s4seg(q, 0, .5), seed: 4498 });
          ckLine(lc, [[S4KX + 172, y + 2], [S4KX + 92, y + 46]], { color: 'blue', w: 5, p: s4seg(q, .5, 1), seed: 4499 }); }
      }
      // ---- 第 8 句：秒表，划掉 ----
      s4Clock(lc, tau, 7);
      lc.restore();
    }
    // ---- 第 9 句：黑板推过去，三个生熟信号 ----
    if (tau > tp) s4Signals(lc, tau, wr);
    outro = ogOutro(lc, tau, S4DUR, cam);
  });
  if (pen) { const sp = ckToScreen(cam, pen.head[0], pen.head[1]); ckStick(c, sp, tau); ckDust(c, sp, tau, true, 4560); }
  ogEraser(c, cam, outro);
  // 人物
  const pt = [0, 4, 5, 8].some(i => tau > s4T(i) && tau < s4E(i));
  ogPch(c, tau, L, { pose: pt ? 'point' : 'lecture', gesture: .6 });
  const kf = tau > s4At(3, .7) && tau < s4E(3) + .2;   // 「大火滑肉」：美铃摆个起手式
  ogMei(c, tau, L, kf ? { pose: 'kungfu', gesture: sm(s4At(3, .7), s4At(3, .7) + .4, tau) } : {});
  ogCirno(c, tau, L, S4LINES);
}
scene({ order: 4, key: 'dish', title: '辣椒炒肉', dur: S4DUR, lines: S4LINES, fn: s4Draw });
