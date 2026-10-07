'use strict';
// 第 3 段 · 先后（order）。台词和 docs/方案.md 逐字一致；画面见 docs/分镜.md。
// 主物件：黑板中部一条横的绿色时间轴（下锅时间表），食材的时间条按句落到轴上方的三行里（肉 / 杆 / 叶），
// 轴上方再叠一条橙色锅温曲线；轴下方是第 1 句的「薄片 / 厚块」剖面，热从表面往中心爬，薄的先熟。
// 琪露诺最后一句时，右下角（x>1220, y>540）是空的：轴在 y=520，轴下只在 x<1220 放东西。
// 顶层名字带 S3 / s3 前缀。
const S3LINES = seq(1.0, [
  ['第三件事：先后。热从表面走到中心要时间，越厚越慢。', { hold: 1.2 }],
  ['蒜苗的白杆要炒一分钟，绿叶三十秒就熟。', { pause: .2, hold: .8 }],
  ['所以杆和叶分两堆，杆先下，叶后下。', { who: 'meiling', mood: 'smile', pause: .2, hold: 1.0 }],
  ['肉片也一样。滑到表面变白，先盛出来。', { pause: .3, hold: .9 }],
  ['底油炒熟配菜，再把肉倒回去合炒。', { pause: .2, hold: 1.0 }],
  ['料酒要等锅最热的时候，沿锅边淋，酒气一蒸，腥味就走了。', { pause: .3, hold: 1.2 }],
  ['鸡精和蚝油怕高温，关火以后再放。', { pause: .2, hold: 1.2 }],
  ['原来做菜就是排时间表！', { who: 'cirno', mood: 'proud', pause: .2, hold: 1.3 }],
]);
const s3T = i => S3LINES[i][0], s3E = i => S3LINES[i][1];
// 第 i 句念到 f 处的时刻（不算 hold）
const s3At = (i, f) => s3T(i) + f * (s3E(i) - ((S3LINES[i][3] || {}).hold || 0) - s3T(i));
const S3DUR = s3E(S3LINES.length - 1) + 1.6;
const s3P = (tau, a, d = .6) => sm(a, a + d, tau);

// ===================== 版面（板坐标 = 屏幕坐标） =====================
const S3AX = 520, S3AX0 = 530, S3AX1 = 1325;             // 时间轴
const S3RM = 335, S3RS = 405, S3RL = 468, S3BH = 36;     // 三行：肉 / 杆 / 叶（行中心 y），条高
const S3MEAT = [565, 690], S3STEM = [720, 1040], S3LEAF = [880, 1040], S3MIX = [1075, 1200];   // 1 分钟 = 320px
const S3PEAK = 1130, S3OFF = 1205, S3SEAS = 1262;        // 料酒（锅最热）、关火、鸡精蚝油
// 锅温曲线（左 → 右，y 小 = 热）：热锅 → 下肉掉一下 → 回升 → 下菜掉一下 → 回锅 → 最热 → 关火后落下
const S3TEMP_A = spline([[530, 214], [560, 210], [578, 246], [640, 228], [700, 216], [734, 247], [800, 232], [900, 222], [1040, 214], [1058, 232], [1100, 207], [S3PEAK, 200], [1168, 205], [S3OFF, 211]], 5);
const S3TEMP_B = spline([[S3OFF, 211], [1240, 232], [1285, 254], [S3AX1, 262]], 5);
// 剖面：薄片、厚块
const S3THIN = [560, 680, 240, 40], S3THICK = [880, 640, 280, 120];
const S3HEAT_V = 26;                                     // 热往里爬的速度（px/秒）

// 折线上走到 p 处的点（粉笔头跟着画线）
function s3Tip(pts, p) {
  let L = 0; for (let k = 1; k < pts.length; k++) L += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
  let d = L * clamp(p, 0, 1);
  for (let k = 1; k < pts.length; k++) { const s = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); if (d <= s) { const u = s ? d / s : 0; return [lerp(pts[k - 1][0], pts[k][0], u), lerp(pts[k - 1][1], pts[k][1], u)]; } d -= s; }
  return pts.at(-1);
}

// 一块剖面：热从上下两个面往中心爬（橙色），爬到中心时中心点变绿
function s3Slab(lc, tau, [x, y, w, h], t0, th, seed) {
  const pr = s3P(tau, t0, .7);
  if (pr <= 0) return;
  ckShape(lc, rectPts(x, y, w, h, 6), { color: 'ink', w: 5, p: pr, seed });
  const d = clamp((tau - th) * S3HEAT_V, 0, h / 2), done = d >= h / 2 - .5;
  if (d > 0) {
    const hp = new Path2D(); hp.rect(x + 4, y + 3, w - 8, Math.min(d, h / 2 - 3)); hp.rect(x + 4, y + h - 3 - Math.min(d, h / 2 - 3), w - 8, Math.min(d, h / 2 - 3));
    hatch(lc, hp, [x, y, w, h], { gap: 9, angle: -.75, color: CK.orange, w: 2.8, al: .8, seed: seed + 3 });
    if (!done) for (const fy of [y + d, y + h - d]) ckLine(lc, [[x + 8, fy], [x + w - 8, fy]], { color: 'orange', w: 3, dash: [10, 9], seed: seed + 5 });
  }
  // 中心点
  if (pr >= 1) { lc.save(); lc.fillStyle = done ? CK.green : CK.ink; lc.beginPath(); lc.arc(x + w / 2, y + h / 2, done ? 8 : 6, 0, TAU); lc.fill(); lc.restore();
    if (done) { const tdn = th + h / 2 / S3HEAT_V, u = clamp((tau - tdn) / .5, 0, 1); if (u < 1) ckLine(lc, circPts(x + w / 2, y + h / 2, 10 + 26 * u, 24), { color: 'green', w: 3, close: true, al: 1 - u, seed: seed + 7 }); } }
  // 热箭头：上下各三支，指向里面
  const pa = s3P(tau, th - .5, .5);
  if (pa > 0) for (let k = 0; k < 3; k++) { const ax = x + w * (k + 1) / 4;
    ckArrow(lc, [ax, y - 44], [ax, y - 10], { color: 'orange', w: 4, head: 12, p: pa, seed: seed + 10 + k });
    ckArrow(lc, [ax, y + h + 44], [ax, y + h + 10], { color: 'orange', w: 4, head: 12, p: pa, seed: seed + 20 + k }); }
}

// 时间条：从 x0 往右长到 x0 + (x1-x0)*g；o.fill 渐变填充 [左色, 右色]
function s3Bar(lc, x0, x1, y, g, o = {}) {
  if (g <= 0) return;
  const { color = 'ink', hatchC = null, fill = null, seed = 1 } = o, xe = lerp(x0, x1, g), w = Math.max(8, xe - x0);
  if (fill) { const gr = lc.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, ckColor(fill[0])); gr.addColorStop(1, ckColor(fill[1]));
    lc.save(); lc.globalAlpha = .72; lc.fillStyle = gr; lc.fill(polyPath(rectPts(x0 + 3, y - S3BH / 2 + 3, w - 6, S3BH - 6, 6))); lc.restore(); }
  else if (hatchC) hatch(lc, polyPath(rectPts(x0, y - S3BH / 2, w, S3BH, 8)), [x0, y - S3BH / 2, w, S3BH], { gap: 11, angle: -.75, color: ckColor(hatchC), w: 2.4, al: .6, seed });
  if (o.gapW && g >= 1) { lc.save(); lc.globalCompositeOperation = 'destination-out'; lc.fillStyle = '#000'; lc.fillRect((x0 + x1) / 2 - o.gapW / 2, y - S3BH / 2 + 4, o.gapW, S3BH - 8); lc.restore(); }
  ckLine(lc, rectPts(x0, y - S3BH / 2, w, S3BH, 8), { color, w: 4.5, close: true, seed });
}

function s3Draw(c, tau, L) {
  ckRoom(c, tau);
  const cam = CKCAM0;
  let pen = null, outro = null;
  ckLayer(c, cam, lc => {
    const wr = (text, x, y, t0, o = {}) => { const w = ckWrite(lc, tau, text, x, y, t0, { size: o.size, spc: o.spc ?? .09, align: o.align });
      ckText(lc, text, x, y, { size: o.size, color: o.color, p: w.p, heavy: o.heavy, align: o.align }); if (w.writing) pen = { head: w.head, color: o.color }; return w; };
    const draw = (pts, p, color = 'ink') => { if (p > 0 && p < 1) pen = { head: s3Tip(pts, p), color }; };

    // ---- 1：标题 + 剖面（薄 / 厚）+ 越厚越慢 + 时间轴 ----
    wr('先后', 520, 128, .7, { size: 64, color: 'green', heavy: true, spc: .2 });
    const ts = s3At(0, .3), th = s3At(0, .44);
    s3Slab(lc, tau, S3THIN, ts, th, 3301);
    s3Slab(lc, tau, S3THICK, ts + .2, th, 3331);
    wr('薄', 545, 712, ts + .1, { size: 36, color: 'muted', align: 'right' });
    wr('厚', 865, 712, ts + .3, { size: 36, color: 'muted', align: 'right' });
    wr('越厚越慢', 790, 832, s3At(0, .8), { size: 46, color: 'yellow', heavy: true, align: 'center', spc: .1 });
    const ta = s3At(0, 1) + .1, pax = s3P(tau, ta, .9);
    ckArrow(lc, [S3AX0, S3AX], [S3AX1, S3AX], { color: 'green', w: 6, head: 24, p: pax, seed: 3351 });
    draw([[S3AX0, S3AX], [S3AX1, S3AX]], pax, 'green');
    wr('时间 →', 1200, 564, ta + .7, { size: 32, color: 'muted', align: 'right' });

    // ---- 2：白杆 1 分钟、绿叶 30 秒，同一个终点（时间光标扫过去，扫到叶的起点叶才开始长） ----
    const tc0 = s3At(1, .12), tc1 = s3At(1, .92), cx = lerp(S3STEM[0], S3STEM[1], sm(tc0, tc1, tau, t => t));
    const gs = clamp((cx - S3STEM[0]) / (S3STEM[1] - S3STEM[0]), 0, 1), gl = clamp((cx - S3LEAF[0]) / (S3LEAF[1] - S3LEAF[0]), 0, 1);
    s3Bar(lc, S3STEM[0], S3STEM[1], S3RS, gs, { color: 'ink', hatchC: 'muted', seed: 3361, gapW: 140 });
    s3Bar(lc, S3LEAF[0], S3LEAF[1], S3RL, gl, { color: 'green', hatchC: 'green', seed: 3362, gapW: 124 });
    if (tau > tc0 && tau < tc1 + .5) { lc.save(); lc.globalAlpha = 1 - sm(tc1, tc1 + .5, tau); ckLine(lc, [[cx, S3RS - 34], [cx, S3AX - 6]], { color: 'muted', w: 3, dash: [8, 8], seed: 3363 }); lc.restore(); }
    if (gs >= 1) ckText(lc, '杆 1分钟', (S3STEM[0] + S3STEM[1]) / 2, S3RS + 11, { size: 30, color: 'ink', align: 'center', p: s3P(tau, tc1 - .55, .4) });
    if (gl >= 1) ckText(lc, '叶 30秒', (S3LEAF[0] + S3LEAF[1]) / 2, S3RL + 11, { size: 30, color: 'green', align: 'center', p: s3P(tau, tc1, .4) });

    // ---- 3（美铃）：杆先下、叶后下 —— 两根落到轴上的绿色标记 ----
    const td1 = s3At(2, .5), td2 = s3At(2, .78);
    ckArrow(lc, [S3STEM[0], S3RS + S3BH / 2 + 4], [S3STEM[0], S3AX - 6], { color: 'green', w: 4.5, head: 14, p: s3P(tau, td1, .35), seed: 3371 });
    ckArrow(lc, [S3LEAF[0], S3RL + S3BH / 2 + 4], [S3LEAF[0], S3AX - 6], { color: 'green', w: 4.5, head: 12, p: s3P(tau, td2, .3), seed: 3372 });
    wr('杆先下', S3STEM[0], 574, td1 + .2, { size: 36, color: 'green', align: 'center' });
    wr('叶后下', S3LEAF[0], 574, td2 + .2, { size: 36, color: 'green', align: 'center' });

    // ---- 4：肉 —— 粉 → 白的一条，再「盛出」 ----
    const tm = s3At(3, .05), gm = sm(s3At(3, .35), s3At(3, .72), tau, t => t);
    wr('肉', S3MEAT[0] - 12, S3RM + 12, tm, { size: 36, color: 'pink', align: 'right' });
    s3Bar(lc, S3MEAT[0], S3MEAT[1], S3RM, gm, { color: 'pink', fill: ['pink', 'ink'], seed: 3381 });
    const tu = s3At(3, .78), pu = s3P(tau, tu, .35);
    ckArrow(lc, [S3MEAT[1], S3RM - S3BH / 2 - 2], [S3MEAT[1], 266], { color: 'yellow', w: 5, head: 15, p: pu, seed: 3382 });
    wr('盛出', S3MEAT[1] + 14, 300, tu + .15, { size: 34, color: 'yellow' });

    // ---- 5：配菜（括住杆和叶），肉回锅，三行并成「合炒」 ----
    const tb = s3At(4, .1), pb = s3P(tau, tb, .45);
    const brace = [[704, 383], [694, 390], [694, 424], [684, 436], [694, 448], [694, 482], [704, 489]];
    ckLine(lc, brace, { color: 'muted', w: 4, smooth: true, p: pb, seed: 3391 });
    wr('配菜', 678, 448, tb + .3, { size: 34, color: 'muted', align: 'right' });
    const tr = s3At(4, .5), pr = s3P(tau, tr, .55), back = [[796, 284], [S3MIX[0] - 3, S3RS - S3BH / 2 - 8]];
    ckArrow(lc, back[0], back[1], { color: 'pink', w: 4.5, head: 15, bend: -48, p: pr, seed: 3392 });
    draw(back, pr, 'pink');
    const tj = s3At(4, .72), pj = s3P(tau, tj, .3);
    ckLine(lc, [[S3STEM[1], S3RS], [S3MIX[0], S3RS]], { color: 'muted', w: 4, p: pj, seed: 3393 });
    ckLine(lc, [[S3LEAF[1], S3RL], [1058, S3RL - 30], [S3MIX[0], S3RS + 12]], { color: 'green', w: 4, smooth: true, p: pj, seed: 3394 });
    const gx = sm(tj + .25, tj + .85, tau);
    if (gx > 0) { lc.save(); lc.translate(0, 0); s3Bar(lc, S3MIX[0], S3MIX[1], S3RS, gx, { color: 'green', hatchC: 'green', seed: 3395, gapW: 84 }); lc.restore(); }
    if (gx >= 1) ckText(lc, '合炒', (S3MIX[0] + S3MIX[1]) / 2, S3RS + 11, { size: 30, color: 'yellow', heavy: true, align: 'center', p: s3P(tau, tj + .85, .35) });

    // ---- 6：锅温曲线（橙）+ 锅最热处淋料酒，酒气一蒸 ----
    const tw = s3At(5, .02), pw = s3P(tau, tw, 1.3);
    wr('锅温', 530, 186, tw, { size: 30, color: 'orange' });
    ckLine(lc, S3TEMP_A, { color: 'orange', w: 4.5, p: pw, seed: 3401 });
    draw(S3TEMP_A, pw, 'orange');
    const tk = s3At(5, .22);
    wr('锅最热', S3PEAK, 262, tk, { size: 38, color: 'yellow', heavy: true, align: 'center' });
    const pk = s3P(tau, tk, .3);
    if (pk > 0) { lc.save(); lc.globalAlpha = pk; lc.fillStyle = CK.yellow; lc.beginPath(); lc.arc(S3PEAK, 200, 7, 0, TAU); lc.fill(); lc.restore(); }
    const tl = s3At(5, .44);
    wr('料酒', 1064, 186, tl, { size: 34, color: 'ink', align: 'right' });
    ckArrow(lc, [1072, 168], [S3PEAK - 9, 194], { color: 'ink', w: 4, head: 12, bend: -6, p: s3P(tau, tl + .2, .3), seed: 3402 });
    const tst = s3At(5, .62);
    if (tau > tst) for (let k = 0; k < 3; k++) {     // 酒气：三缕往上飘的波浪
      const ph = ((tau - tst) * .9 + k / 3) % 1, x0 = S3PEAK + 10 + k * 22, y0 = 192 - ph * 34, pts = [];
      for (let j = 0; j <= 8; j++) { const u = j / 8; pts.push([x0 + 6 * Math.sin(u * 5 + tau * 3 + k), y0 - u * 34]); }
      lc.save(); lc.globalAlpha = Math.sin(ph * Math.PI) * sm(tst, tst + .4, tau); lc.strokeStyle = CK.muted; lc.lineWidth = 3; lc.lineCap = 'round';
      lc.stroke(polyPath(pts)); lc.restore(); }

    // ---- 7：鸡精蚝油（怕高温），关火线，关火后锅温落下，再放 ----
    const tg = s3At(6, .05);
    wr('鸡精', S3SEAS, 404, tg, { size: 34, color: 'ink', align: 'center' });
    wr('蚝油', S3SEAS, 448, tg + .25, { size: 34, color: 'ink', align: 'center' });
    const to = s3At(6, .5), po = s3P(tau, to, .5);
    ckLine(lc, [[S3OFF, 160], [S3OFF, S3AX - 4]], { color: 'yellow', w: 4, dash: [14, 10], p: po, seed: 3411 });
    draw([[S3OFF, 160], [S3OFF, S3AX - 4]], po, 'yellow');
    wr('关火', S3OFF + 10, 186, to + .3, { size: 34, color: 'yellow', heavy: true });
    const pt = s3P(tau, to + .4, .5);
    ckLine(lc, S3TEMP_B, { color: 'orange', w: 4.5, p: pt, seed: 3412 });
    ckArrow(lc, [S3SEAS, 460], [S3SEAS, S3AX - 6], { color: 'green', w: 4.5, head: 12, p: s3P(tau, s3At(6, .82), .3), seed: 3413 });

    // ---- 8（琪露诺）：整张图框起来 —— 时间表 ----
    const tf = s3At(7, .15);
    ckBorder(lc, 506, 150, 829, 384, 'wave', 'yellow', s3P(tau, tf, .9), 3421);
    const pbg = s3P(tau, tf + .6, .7);
    if (pbg > 0) ckBadge(lc, '时间表', 690, 62, 'yellow', pbg, 3422);

    outro = ogOutro(lc, tau, S3DUR, cam);
  });
  if (pen && !outro) { const sp = ckToScreen(cam, pen.head[0], pen.head[1]); ckStick(c, sp, tau, { color: pen.color || 'ink' }); ckDust(c, sp, tau, true, 3430); }
  ogEraser(c, cam, outro);
  // 人物
  const pnt = [0, 3, 5].some(i => tau > s3At(i, .25) && tau < s3E(i) - .3);
  ogPch(c, tau, L, { pose: pnt ? 'point' : 'lecture', gesture: .6 });
  ogMei(c, tau, L);
  ogCirno(c, tau, L, S3LINES);
}
scene({ order: 3, key: 'order', title: '先后', dur: S3DUR, lines: S3LINES, fn: s3Draw });
// 粉笔音效：[段内秒, 种类, 时长]
sfx('order', [
  [.7, 'chalk', .4],                                          // 先后
  [s3At(0, .3), 'line', .9],                                  // 剖面
  [s3At(0, .8), 'chalk', .4],                                 // 越厚越慢
  [s3At(0, 1) + .1, 'line', .9],                              // 时间轴
  [s3At(1, .12), 'line', s3At(1, .92) - s3At(1, .12)],        // 杆、叶两条
  [s3At(2, .5), 'tap'], [s3At(2, .5) + .2, 'chalk', .3],      // 杆先下
  [s3At(2, .78), 'tap'], [s3At(2, .78) + .2, 'chalk', .3],    // 叶后下
  [s3At(3, .05), 'chalk', .1], [s3At(3, .35), 'line', s3At(3, .72) - s3At(3, .35)],   // 肉
  [s3At(3, .78), 'line', .35], [s3At(3, .78) + .15, 'chalk', .2],                    // 盛出
  [s3At(4, .1), 'line', .45], [s3At(4, .1) + .3, 'chalk', .2],                        // 配菜
  [s3At(4, .5), 'line', .55], [s3At(4, .72), 'line', .85],                            // 回锅、合炒
  [s3At(5, .02), 'line', 1.3], [s3At(5, .22), 'chalk', .3],                           // 锅温、锅最热
  [s3At(5, .44), 'chalk', .2], [s3At(5, .44) + .2, 'line', .3],                       // 料酒
  [s3At(6, .05), 'chalk', .45], [s3At(6, .5), 'line', .5], [s3At(6, .5) + .3, 'chalk', .2], [s3At(6, .82), 'tap'],   // 鸡精蚝油、关火
  [s3At(7, .15), 'line', .9], [s3At(7, .15) + .6, 'chalk', .7],                       // 时间表
  [S3DUR - 1.25, 'felt', 1.0],                                                       // 段末擦黑板
]);
