'use strict';
// 第 1 段 · 切（cut）。台词和 docs/方案.md 逐字一致；画面见 docs/分镜.md。
// 主物件：黑板中央一块粉框肉，里面的波浪线 = 橡皮筋纤维。受热绷直、缩一圈 → 顺着纤维切下一条长条（琪露诺）
// → 牙咬长条咬不断（塞牙）→ 横着切成短段，一咬就开 → 美铃的口诀徽章 → 剩下的肉块一分为二：牛羊（粗纤维、横切）/ 猪（细纤维、顺切）
// → 结论「纤维有多长」。段末板擦擦净。顶层名字带 S1 / s1 前缀。
const S1LINES = seq(1.0, [
  ['先说切。生肉的纹理，其实是一捆捆细橡皮筋。', { hold: .4 }],
  ['一受热，这些皮筋就猛地缩紧、绷直。', { hold: .6 }],
  ['那顺着切呀！长长的，多整齐！', { who: 'cirno', mood: 'proud', hold: .3 }],
  ['整齐，但长皮筋熟了以后，牙齿咬不断，就塞牙。', { mood: 'annoyed', hold: .6 }],
  ['迎着纹理横着切，皮筋全变成小短段，一咬就开。', { hold: 1.0 }],
  ['所以厨房里说：横切牛羊顺切猪。', { who: 'meiling', mood: 'smile', hold: 1.2 }],
  ['牛羊纤维粗硬，必须切断；猪肉细嫩，顺着切，下锅不容易碎。', { hold: .6 }],
  ['刀不是在切肉，是在决定纤维有多长。', { mood: 'smug', hold: 1.4 }],
]);
const s1T = i => S1LINES[i][0], s1E = i => S1LINES[i][1];
// 第 i 句念到 frac 处的时刻（不算 hold）
const s1At = (i, f) => s1T(i) + f * (s1E(i) - ((S1LINES[i][3] || {}).hold || 0) - s1T(i));
const S1DUR = s1E(S1LINES.length - 1) + 1.6;
const s1seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);

// ===================== 位置（板坐标 = 屏幕坐标） =====================
// 受热缩紧后的肉块：x 600–1140，y 228–452，6 根纤维；下面两根是琪露诺要顺着切下来的长条
const S1B = { x: 570, y: 222, w: 600, h: 234, n: 6 };
const S1BAND = S1B.h / S1B.n;
const S1CUTY = S1B.y + S1BAND * 4;          // 顺切的刀线
const S1DROP = 200;                          // 长条滑出去的距离
const S1STRIPY = S1CUTY + S1DROP;            // 长条落定后的上沿
const S1PIECES = 7;                          // 横切成几段
const S1KW = [1262, 650];                    // 关键词位（橡皮筋 / 塞牙 / 短段）
const S1TOOTHX = 790;

// ===================== 画法 =====================
// 一根纤维的 y（波浪由全局 x 决定，切开以后每段还是原来那条波浪的一截）
const s1FibY = (gx, x, w, fy, amp, i) => fy + amp * Math.sin((gx - x) / w * Math.PI * 5 + i * 1.7);
// s1Block：一块肉（或切开的若干段）。o = { n 纤维根数, i0 纤维起始序号（波浪相位）, taut, p 轮廓进度, fp 纤维进度,
//   thick 纤维粗细, pieces 横切段数, spread 段间拉开, dip(gx) 被牙压下的量, seed, al, wave 波浪幅度系数 }
function s1Block(lc, x, y, w, h, o = {}) {
  const { n = 6, i0 = 0, taut = 0, p = 1, fp = 1, thick = 3, pieces = 1, spread = 0, dip = null, seed = 1100, color = 'pink', fiber = 'ink', wave = .4, refW = w, refX = x } = o;
  const band = h / n, amp = (1 - taut) * band * wave, D = gx => dip ? dip(gx) : 0;
  for (let k = 0; k < pieces; k++) {
    const sx0 = x + w * k / pieces, sx1 = x + w * (k + 1) / pieces, off = spread * (k - (pieces - 1) / 2);
    // 轮廓：上下沿按 dip 采样
    const top = [], bot = [];
    for (let j = 0; j <= 10; j++) { const gx = lerp(sx0, sx1, j / 10); top.push([gx + off, y + D(gx)]); bot.push([gx + off, y + h + D(gx)]); }
    ckLine(lc, [...top, ...bot.reverse()], { color, w: 5, close: true, p, seed: seed + k * 3 });
    if (fp <= 0) continue;
    const pad = pieces > 1 ? 9 : 18;
    for (let i = 0; i < n; i++) {
      const fy = y + band * (i + .5), pts = [];
      for (let j = 0; j <= 14; j++) { const gx = lerp(sx0 + pad, sx1 - pad, j / 14); pts.push([gx + off, s1FibY(gx, refX, refW, fy, amp, i + i0) + D(gx)]); }
      ckLine(lc, pts, { color: fiber, w: thick, smooth: true, p: fp, seed: seed + 40 + i * 7 + k });
    }
  }
}
// 粉笔菜刀：刃口在 (x, y) 处、刀尖朝 ang 方向
function s1Knife(lc, x, y, ang, p = 1, al = 1) {
  if (p <= 0 || al <= 0) return;
  fade(lc, al, () => {
    lc.save(); lc.translate(x, y); lc.rotate(ang);
    ckShape(lc, [[0, 0], [-150, 0], [-150, -46], [-24, -46], [-4, -22]], { color: 'ink', w: 4.5, p, seed: 1170 });
    ckShape(lc, rectPts(-214, -34, 64, 20, 8), { color: 'muted', w: 4, p, seed: 1171 });
    ckLine(lc, [[-140, -36], [-132, -36]], { color: 'muted', w: 3, p, seed: 1172 });
    lc.restore();
  });
}
// 粉笔臼齿（倒着，牙根朝上、牙冠朝下咬）：咬合面中心在 (x, y)
function s1Tooth(lc, x, y, p = 1, al = 1, color = 'ink') {
  if (p <= 0 || al <= 0) return;
  fade(lc, al, () => {
    const pts = [[x - 34, y - 6], [x - 36, y - 40], [x - 28, y - 80], [x - 16, y - 82], [x - 8, y - 50], [x + 8, y - 50], [x + 16, y - 82], [x + 28, y - 80], [x + 36, y - 40], [x + 34, y - 6],
      [x + 24, y], [x + 12, y - 8], [x, y], [x - 12, y - 8], [x - 24, y]];
    ckLine(lc, pts, { color, w: 5, close: true, smooth: true, p, seed: 1180 });
  });
}
// 受热箭头（一根会扭的橙色箭头）
function s1Heat(lc, x, y0, y1, tau, i, p, al) {
  if (p <= 0 || al <= 0) return;
  fade(lc, al, () => {
    const pts = []; for (let j = 0; j <= 8; j++) { const u = j / 8; pts.push([x + 10 * Math.sin(u * 6 + tau * 7 + i * 2) * (1 - u * .6), lerp(y0, y1, u)]); }
    ckLine(lc, pts, { color: 'orange', w: 5, smooth: true, p, seed: 1190 + i });
    if (p >= .98) { const e = pts.at(-1); ckLine(lc, [[e[0] - 14, e[1] + 16], e, [e[0] + 14, e[1] + 16]], { color: 'orange', w: 5, seed: 1195 + i }); }
  });
}

function s1Draw(c, tau, L) {
  ckRoom(c, tau);
  const cam = ckCam(tau, [[0, CKB.cx, CKB.cy, 1], [s1T(0), CKB.cx, CKB.cy, 1], [s1T(1), CKB.cx - 40, CKB.cy - 30, 1.04], [s1T(2), CKB.cx - 40, CKB.cy - 30, 1.04], [s1T(2) + 1.2, CKB.cx, CKB.cy, 1]]);
  let pen = null, outro = null, er = null;
  ckLayer(c, cam, lc => {
    const wr = (text, x, y, t0, o = {}) => { const w = ckWrite(lc, tau, text, x, y, t0, { size: o.size, spc: o.spc ?? .09, align: o.align });
      ckText(lc, text, x, y, { size: o.size, color: o.color, p: w.p, heavy: o.heavy, align: o.align, al: o.al ?? 1 }); if (w.writing) pen = { ...w, color: o.color }; return w; };
    // 小标题「切」
    wr('切', 520, 150, .7, { size: 62, color: 'pink', heavy: true });

    // ---------- 主物件：肉块 ----------
    const heat = sm(s1At(1, .15), s1At(1, .85), tau), taut = heat;
    const k = lerp(1, .93, heat), cx = S1B.x + S1B.w / 2, cy = S1B.y + S1B.h / 2;
    const bw = S1B.w / .93 * k, bh = S1B.h / .93 * k, bx = cx - bw / 2, by = cy - bh / 2;
    const pOut = sm(s1T(0) + .2, s1T(0) + 1.3, tau), pFib = sm(s1T(0) + 1.1, s1At(0, .75), tau);
    // 顺切：长条分出去（下面两根纤维），之后肉块只剩上面 4 根
    const cutLine = s1seg(tau, s1At(2, .05), s1At(2, .45)), slide = sm(s1At(2, .5), s1At(2, .9), tau);
    // 第 7 句：肉块一分为二（牛羊 / 猪）
    const split = sm(s1T(6) + .5, s1T(6) + 1.3, tau);
    if (cutLine <= 0) {
      s1Block(lc, bx, by, bw, bh, { n: 6, taut, p: pOut, fp: pFib, seed: 1100 });
    } else {
      const top = S1BAND * 4;
      if (split <= 0) s1Block(lc, S1B.x, S1B.y, S1B.w, top, { n: 4, taut: 1, seed: 1100 });
      else {
        // 左半：牛羊（纤维变粗、横切）；右半：猪（纤维变细、顺切）
        const gap = 50 * split, hw = S1B.w / 2;
        const thickL = lerp(3, 7, split), thinR = lerp(3, 2, split);
        const acrossP = s1seg(tau, s1At(6, .12), s1At(6, .38)), alongP = s1seg(tau, s1At(6, .55), s1At(6, .8));
        const lp = acrossP >= 1 ? 4 : 1, lsp = 12 * sm(s1At(6, .38), s1At(6, .48), tau);
        s1Block(lc, S1B.x - gap, S1B.y, hw, top, { n: 4, taut: 1, thick: thickL, pieces: lp, spread: lsp, seed: 1110, refW: S1B.w, refX: S1B.x - gap });
        // 猪：顺切后一条条上下分开
        const rsp = 10 * sm(s1At(6, .8), s1At(6, .9), tau);
        if (alongP < 1) s1Block(lc, S1B.x + hw + gap, S1B.y, hw, top, { n: 4, taut: 1, thick: thinR, seed: 1120, refW: S1B.w, refX: S1B.x + gap });
        else for (let i = 0; i < 4; i++) s1Block(lc, S1B.x + hw + gap, S1B.y + i * S1BAND + (i - 1.5) * rsp, hw, S1BAND, { n: 1, i0: i, taut: 1, thick: thinR, seed: 1130 + i * 5, refW: S1B.w, refX: S1B.x + gap });
        // 刀线（粉色虚线）
        for (let j = 1; j < 4; j++) { const xx = S1B.x - gap + hw * j / 4; ckLine(lc, [[xx, S1B.y - 22], [xx, S1B.y + top + 22]], { color: 'pink', w: 4, dash: [12, 10], p: s1seg(acrossP, (j - 1) / 3, j / 3), al: 1 - sm(s1At(6, .4), s1At(6, .5), tau), seed: 1140 + j }); }
        for (let j = 1; j < 4; j++) { const yy = S1B.y + S1BAND * j; ckLine(lc, [[S1B.x + hw + gap - 22, yy], [S1B.x + S1B.w + gap + 22, yy]], { color: 'pink', w: 4, dash: [12, 10], p: s1seg(alongP, (j - 1) / 3, j / 3), al: 1 - sm(s1At(6, .82), s1At(6, .92), tau), seed: 1150 + j }); }
        const lab = s1At(6, .02), lab2 = s1At(6, .5);
        wr('牛羊', S1B.x - gap + hw / 2, S1B.y + top + 80, lab, { size: 44, align: 'center' });
        wr('猪', S1B.x + hw + gap + hw / 2, S1B.y + top + 80, lab2, { size: 44, align: 'center' });
      }
      // 长条：顺切下来的两根长纤维
      if (tau < s1T(6) + .9) {
        const sy = S1CUTY + S1DROP * slide;
        // 牙咬：第 4 句里压两下（皮筋被压弯但不断），第 5 句段间拉开后一咬就过
        const b1 = s1At(3, .3), chew = tau > b1 && tau < s1E(3) ? Math.max(0, Math.sin((tau - b1) * 5.2)) : 0;
        const dip = chew > 0 ? gx => 22 * chew * Math.exp(-Math.pow((gx - S1TOOTHX) / 120, 2)) : null;
        const across = s1seg(tau, s1At(4, .1), s1At(4, .55)), cut = across >= 1;
        const spread = 18 * sm(s1At(4, .55), s1At(4, .7), tau);
        s1Block(lc, S1B.x, sy, S1B.w, S1BAND * 2, { n: 2, i0: 4, taut: 1, dip, pieces: cut ? S1PIECES : 1, spread, seed: 1160, p: 1 });
        // 横切的刀线
        if (!cut || tau < s1At(4, .65)) for (let j = 1; j < S1PIECES; j++) { const xx = S1B.x + S1B.w * j / S1PIECES;
          ckLine(lc, [[xx, S1STRIPY - 26], [xx, S1STRIPY + S1BAND * 2 + 26]], { color: 'pink', w: 4, dash: [12, 10], p: s1seg(across, (j - 1) / (S1PIECES - 1), j / (S1PIECES - 1)), seed: 1200 + j }); }
        // 顺切的刀线 + 菜刀
        if (tau < s1At(2, .6)) ckLine(lc, [[S1B.x - 40, S1CUTY], [S1B.x + S1B.w + 40, S1CUTY]], { color: 'pink', w: 4, dash: [14, 10], p: cutLine, seed: 1205, al: 1 - sm(s1At(2, .5), s1At(2, .6), tau) });
        s1Knife(lc, lerp(S1B.x - 10, S1B.x + S1B.w + 10, cutLine), S1CUTY, 0, sm(s1At(2, 0), s1At(2, .08), tau), 1 - sm(s1At(2, .45), s1At(2, .55), tau));
        // 横切的菜刀（竖着往下）
        if (across > 0 && across < 1) { const j = Math.min(S1PIECES - 1, Math.floor(across * (S1PIECES - 1)) + 1), u = across * (S1PIECES - 1) - (j - 1);
          s1Knife(lc, S1B.x + S1B.w * j / S1PIECES, S1STRIPY - 26 + (S1BAND * 2 + 52) * u + 6, Math.PI / 2, 1, 1); }
        // 牙
        const tp = sm(s1T(3) + .1, s1At(3, .28), tau);
        const tAl = 1 - sm(s1E(4) - .2, s1E(4) + .2, tau);
        let ty = S1STRIPY - 70 + 46 * chew;
        if (tau > s1At(4, .75)) ty += (S1BAND * 2 + 40) * Math.sin(Math.PI * s1seg(tau, s1At(4, .75), s1At(4, .95)));
        if (tau < s1T(4)) s1Tooth(lc, S1TOOTHX, ty, tp, tAl);
        else { const sx = lerp(S1TOOTHX, S1B.x + S1B.w * 3 / S1PIECES - spread * .5, sm(s1At(4, .6), s1At(4, .74), tau)); s1Tooth(lc, sx, ty, 1, tAl); }
        // 咬不断的「绷」：牙两侧的小弹线
        if (chew > .4) for (const s of [-1, 1]) ckLine(lc, [[S1TOOTHX + s * 60, S1STRIPY + 10 + 22 * chew * .4], [S1TOOTHX + s * 74, S1STRIPY - 6]], { color: 'pink', w: 3.5, seed: 1210 + s });
        // 关键词：塞牙 / 短段
        wr('塞牙', S1KW[0], S1KW[1], s1At(3, .82), { size: 50, color: 'pink', heavy: true, al: 1 - sm(s1T(4), s1T(4) + .3, tau) });
        if (tau > s1T(4)) wr('短段', S1KW[0], S1KW[1], s1At(4, .6), { size: 50, color: 'yellow', heavy: true });
      }
    }
    // 受热箭头（第 2 句）
    const hp = sm(s1T(1) + .05, s1T(1) + .7, tau), hal = 1 - sm(s1E(1) - .1, s1E(1) + .3, tau);
    for (let i = 0; i < 3; i++) s1Heat(lc, 720 + i * 150, 600, 482, tau, i, hp, hal);
    if (hp > 0 && hal > 0) fade(lc, hal, () => ogFlame(lc, 870, 650, 1.1, tau, { k: hp }));
    // 关键词：橡皮筋（第 1 句）
    wr('橡皮筋', 1228, 320, s1At(0, .7), { size: 50, color: 'pink', heavy: true, al: 1 - sm(s1T(1) + .1, s1T(1) + .4, tau) });

    // ---------- 段间擦：第 7 句前把长条区擦掉 ----------
    const ea = s1T(6) + .05, eb = s1T(6) + .85;
    if (tau > ea && tau < eb) er = ckErase(lc, [530, 470, 860, 220], sm(ea, eb, tau, t => t));

    // ---------- 口诀徽章（第 6 句），第 7 句起退成旧粉笔 ----------
    if (tau > s1T(5)) {
      const bp = s1seg(tau, s1T(5) + .2, s1At(5, .9)), mu = sm(s1T(6) + .1, s1T(6) + .5, tau);
      const bwid = zhWidth(lc, '横切牛羊 顺切猪', 50) + 56, bx0 = 870 - bwid / 2, by0 = 720;
      fade(lc, 1 - mu, () => ckBadge(lc, '横切牛羊 顺切猪', bx0, by0, 'yellow', bp, 1220));
      if (mu > 0) fade(lc, mu, () => ckBadge(lc, '横切牛羊 顺切猪', bx0, by0, 'muted', 1, 1220));
      if (bp > .5 && bp < 1) pen = { head: [bx0 + 28 + zhWidth(lc, '横切牛羊 顺切猪'.slice(0, Math.floor(clamp(bp * 2 - 1, 0, 1) * 8)), 50), by0 + 36], color: 'yellow' };
    }
    // ---------- 结论（第 8 句）----------
    if (tau > s1T(7)) {
      const w = wr('纤维有多长', 870, 610, s1At(7, .55), { size: 64, color: 'yellow', heavy: true, align: 'center', spc: .1 });
      if (w.p >= 1) ckRing(lc, '纤维有多长', 870, 610, 64, 'yellow', sm(s1At(7, .55) + .55, s1At(7, .55) + 1.2, tau), 1230, 'center');
    }
    outro = ogOutro(lc, tau, S1DUR, cam);
  });
  if (pen) { const sp = ckToScreen(cam, pen.head[0], pen.head[1]); ckStick(c, sp, tau, { color: pen.color || 'ink' }); ckDust(c, sp, tau, true, 1240); }
  ogEraser(c, cam, er);
  ogEraser(c, cam, outro);
  // 人物
  const pt = [3, 4, 7].some(i => tau > s1T(i) && tau < s1E(i));
  ogPch(c, tau, L, { pose: pt ? 'point' : 'lecture' });
  const mk = tau > s1T(5) - .2 && tau < s1E(5) + .2;
  ogMei(c, tau, L, mk ? { pose: 'kungfu', gesture: sm(s1T(5) - .2, s1T(5) + .4, tau) } : {});
  ogCirno(c, tau, L, S1LINES);
}
scene({ order: 1, key: 'cut', title: '切', dur: S1DUR, lines: S1LINES, fn: s1Draw });
sfx('cut', [
  [.7, 'chalk', .4], [s1T(0) + .2, 'line', 1.1], [s1T(0) + 1.1, 'line', 1.2], [s1At(0, .7), 'chalk', .4],
  [s1T(1) + .05, 'whoosh', .7], [s1At(2, .05), 'line', 1.0], [s1At(2, .5), 'whoosh', .5],
  [s1At(3, .3), 'tap', .2], [s1At(3, .3) + 1.2, 'tap', .2], [s1At(3, .82), 'chalk', .3],
  [s1At(4, .1), 'tap', .2], [s1At(4, .25), 'tap', .2], [s1At(4, .4), 'tap', .2], [s1At(4, .6), 'chalk', .3],
  [s1T(5) + .2, 'chalk', 1.4], [s1T(6) + .05, 'felt', .8], [s1At(6, .12), 'line', .8], [s1At(6, .55), 'line', .8],
  [s1At(7, .55), 'chalk', .6], [s1At(7, .55) + .6, 'line', .6], [S1DUR - 1.25, 'felt', 1.0],
]);
