'use strict';
// 第 6 集舞台：箱庭厨房（照「胡闹厨房」那种剖开的小房间，前上方看进去的 2.5D）。屏幕坐标，纯函数，只随 t 轻轻动（锅里冒汽、灶火、窗外云）。
//   ktRoom(c, t)    背景：房间外的天色 → 剖开的左右墙和后墙（墙顶露出墙厚）→ 透视棋盘格地板 → 靠后墙的料理台（灶、锅、水槽）→ 墙上的架子、挂锅、窗
//   ktTicket(c, t)  后墙正中挂的一张大订单纸（板内容画在它上面，见 chalk.js 的 CKT / CKV）
//   ktFront(c, t)   前景：右前方一张料理台（琪露诺从它后面冒出来，所以在她之后画）
// 帕秋莉站左前（x 300）、美铃站右前（x 1660），脚底 y 880 在地板上；字幕在 y≈930–1030。
// 顶层名字都带 kt / KT 前缀。

const KT = {
  sky: '#bfe3ff', sky2: '#ffe0f0',
  wall: '#ffe9bf', wallTile: '#8fd6c8', wallTile2: '#7cc6b8', grout: '#f4fbf8',
  side: '#ffd99a', sideTile: '#79bfb2', edge: '#e6a65a', edgeTop: '#f7c17a',
  floorA: '#fbe3b5', floorB: '#f0bf86',
  ctrTop: '#f7f1e6', ctrFace: '#6fa7d8', ctrFace2: '#5b93c6', ctrTrim: '#3f74a8',
  steel: '#c9d3dc', steel2: '#9aa8b5', wood: '#d79a5c', wood2: '#b97b41', pot: '#e85d4a', pot2: '#c2412f',
};
// 房间几何（屏幕坐标）
const KTR = { x0: 210, x1: 1710, top: 30, back: 690, fy: 1080, fx0: -170, fx1: 2090, cut: 420 };   // 后墙、地板后沿 y、前沿 y 和前沿 x、侧墙前端的剖切高度

function ktRoom(c, t = 0) {
  const R = KTR;
  // 房间外：淡天色渐变 + 几朵慢慢走的云（箱庭是悬在空里的小房间）
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, KT.sky); g.addColorStop(1, KT.sky2); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.save(); c.fillStyle = 'rgba(255,255,255,.75)';
  for (let k = 0; k < 4; k++) { const x = ((k * 530 + t * 9 + 120) % (W + 400)) - 200, y = 40 + (k % 2) * 60;
    for (const [dx, dy, r] of [[0, 0, 34], [36, -10, 42], [76, 2, 30]]) { c.beginPath(); c.arc(x + dx, y + dy, r, 0, TAU); c.fill(); } }
  c.restore();
  // 地板（透视棋盘格）：灭点在后墙正上方
  const vp = [W / 2, R.back - (R.x1 - R.x0) * (R.fy - R.back) / ((R.fx1 - R.fx0) - (R.x1 - R.x0))];
  const xAt = (u, y) => { const bx = lerp(R.x0, R.x1, u); return vp[0] + (bx - vp[0]) * (y - vp[1]) / (R.back - vp[1]); };
  c.save(); c.beginPath(); c.moveTo(R.x0, R.back); c.lineTo(R.x1, R.back); c.lineTo(R.fx1, R.fy); c.lineTo(R.fx0, R.fy); c.closePath(); c.fillStyle = KT.floorA; c.fill(); c.clip();
  const NX = 12, rows = []; { let y = R.back, d = 26; while (y < R.fy + 60) { rows.push(y); y += d; d *= 1.16; } }
  c.fillStyle = KT.floorB;
  for (let r = 0; r < rows.length - 1; r++) for (let i = -4; i < NX + 4; i++) { if ((r + i) % 2) continue;
    const y0 = rows[r], y1 = rows[r + 1], u0 = i / NX, u1 = (i + 1) / NX;
    c.beginPath(); c.moveTo(xAt(u0, y0), y0); c.lineTo(xAt(u1, y0), y0); c.lineTo(xAt(u1, y1), y1); c.lineTo(xAt(u0, y1), y1); c.closePath(); c.fill(); }
  // 后墙脚下的接触阴影 + 前方暖光
  const fs = c.createLinearGradient(0, R.back, 0, R.back + 60); fs.addColorStop(0, 'rgba(120,70,30,.22)'); fs.addColorStop(1, 'rgba(120,70,30,0)'); c.fillStyle = fs; c.fillRect(0, R.back, W, 60);
  c.restore();
  grain(c, polyPath([[R.x0, R.back], [R.x1, R.back], [R.fx1, R.fy], [R.fx0, R.fy]]), .06);
  // 左右侧墙（剖开，墙顶斜着切下来）
  for (const sd of [-1, 1]) {
    const bx = sd < 0 ? R.x0 : R.x1, fx = sd < 0 ? R.fx0 : R.fx1;
    const wall = [[bx, R.top], [bx, R.back], [fx, R.fy], [fx, R.cut]];
    c.fillStyle = KT.side; c.fill(polyPath(wall));
    // 下半截瓷砖（护墙）：随透视斜下去
    const tl = (y0) => [[bx, y0], [bx, R.back], [fx, R.fy], [fx, y0 + (R.fy - R.back)]];
    c.save(); c.clip(polyPath(tl(470))); c.fillStyle = KT.sideTile; c.fill(polyPath(wall));
    c.strokeStyle = KT.grout; c.lineWidth = 2; for (let k = 0; k < 9; k++) { const u = k / 8; c.beginPath(); c.moveTo(lerp(bx, fx, u), 0); c.lineTo(lerp(bx, fx, u), H); c.stroke(); }
    c.restore();
    c.fillStyle = 'rgba(90,50,20,.10)'; c.fill(polyPath(wall));   // 侧墙比后墙暗一点
    // 墙顶的剖面（墙厚）
    const th = 20, ed = [[bx, R.top], [fx, R.cut], [fx + sd * th, R.cut - th * .4], [bx + sd * th, R.top - th * .4]];
    c.fillStyle = KT.edgeTop; c.fill(polyPath(ed)); c.strokeStyle = KT.edge; c.lineWidth = 3; c.stroke(polyPath(ed));
  }
  // 后墙
  c.fillStyle = KT.wall; c.fillRect(R.x0, R.top, R.x1 - R.x0, R.back - R.top);
  c.save(); c.beginPath(); c.rect(R.x0, 470, R.x1 - R.x0, R.back - 470); c.clip();
  c.fillStyle = KT.wallTile; c.fillRect(R.x0, 470, R.x1 - R.x0, R.back - 470);
  for (let y = 470, r = 0; y < R.back; y += 44, r++) for (let x = R.x0 - (r % 2) * 32; x < R.x1; x += 64) { c.fillStyle = (x / 64 + r) % 3 < 1 ? KT.wallTile2 : KT.wallTile; c.fillRect(x + 2, y + 2, 60, 40); }
  c.restore();
  c.fillStyle = KT.edge; c.fillRect(R.x0, 462, R.x1 - R.x0, 10);   // 腰线
  // 后墙墙顶剖面
  c.fillStyle = KT.edgeTop; c.fillRect(R.x0 - 20, R.top - 18, R.x1 - R.x0 + 40, 18); c.strokeStyle = KT.edge; c.lineWidth = 3; c.strokeRect(R.x0 - 20, R.top - 18, R.x1 - R.x0 + 40, 18);
  grain(c, polyPath(rectPts(R.x0, R.top, R.x1 - R.x0, R.back - R.top)), .05);
  // 左上：吊杆上挂着锅铲、汤勺、平底锅；下面一层调料架
  c.strokeStyle = KT.steel2; c.lineWidth = 6; c.beginPath(); c.moveTo(250, 110); c.lineTo(560, 110); c.stroke();
  ktHang(c, 290, 110, 'ladle', t); ktHang(c, 360, 110, 'pan', t); ktHang(c, 470, 110, 'turner', t); ktHang(c, 530, 110, 'whisk', t);
  cutPaper(c, rectPts(245, 300, 320, 16, 3), KT.wood, { seed: 6101, step: 30, blur: 6, sy: 4 });
  for (const [x, col, h] of [[262, '#e85d4a', 52], [312, '#ffd34d', 44], [358, '#6cc070', 58], [408, '#f2f2f2', 40], [452, '#b07cd8', 50], [500, '#ff9f43', 46]]) {
    cutPaper(c, rectPts(x, 300 - h, 38, h, 8), col, { seed: 6110 + x, step: 12, blur: 4, sy: 3 });
    cutPaper(c, rectPts(x + 4, 300 - h - 10, 30, 12, 3), '#8a5a3a', { seed: 6130 + x, step: 10, shadow: false });
  }
  // 右上：窗（窗外天和一棵树）+ 窗帘
  const wx = 1380, wy = 90, ww = 280, wh = 230;
  c.fillStyle = '#9fd6ff'; c.fillRect(wx, wy, ww, wh);
  c.fillStyle = '#ffffff'; for (let k = 0; k < 2; k++) { const cx = wx + ((k * 150 + t * 14) % (ww + 80)) - 40; c.beginPath(); c.arc(cx, wy + 60 + k * 50, 22, 0, TAU); c.arc(cx + 26, wy + 52 + k * 50, 26, 0, TAU); c.fill(); }
  c.fillStyle = '#7cc46a'; c.beginPath(); c.arc(wx + 210, wy + wh - 20, 70, Math.PI, 0); c.fill();
  c.strokeStyle = '#ffffff'; c.lineWidth = 10; c.strokeRect(wx, wy, ww, wh); c.beginPath(); c.moveTo(wx + ww / 2, wy); c.lineTo(wx + ww / 2, wy + wh); c.moveTo(wx, wy + wh / 2); c.lineTo(wx + ww, wy + wh / 2); c.stroke();
  for (const sd of [-1, 1]) { const cx = sd < 0 ? wx - 10 : wx + ww + 10, sw = Math.sin(twos(t) * .8 + sd) * 4;
    cutPaper(c, [[cx - 34 * sd * -1 * 0, wy - 16], [cx + sd * -60, wy - 16], [cx + sd * -38 + sw, wy + wh + 10], [cx + sd * 6, wy + wh + 10]], '#ff8fa3', { seed: 6150 + sd, step: 22, blur: 6 }); }
  cutPaper(c, rectPts(wx - 40, wy - 26, ww + 80, 14, 4), KT.wood2, { seed: 6160, step: 30, blur: 4 });
  // 靠后墙的料理台：左段（灶 + 锅），右段（水槽 + 菜板）
  ktCounter(c, 228, 592, 1692, 712, t);
}
// ktHang：吊杆上挂的厨具（屏幕坐标，挂点 x,y）
function ktHang(c, x, y, kind, t) {
  const sw = Math.sin(twos(t) * 1.3 + x) * .03;
  c.save(); c.translate(x, y); c.rotate(sw);
  c.strokeStyle = KT.steel2; c.lineWidth = 3; c.beginPath(); c.arc(0, 6, 6, Math.PI, 0); c.stroke();
  if (kind === 'pan') { cutPaper(c, rectPts(-6, 10, 12, 70, 5), '#4a4a52', { seed: 6170, step: 10, blur: 4 }); cutPaper(c, ellPts(0, 120, 48, 46, 24), '#4a4a52', { seed: 6171, step: 14, blur: 6 }); cutPaper(c, ellPts(0, 120, 38, 36, 20), '#5c5c66', { seed: 6172, step: 12, shadow: false }); }
  else if (kind === 'ladle') { cutPaper(c, rectPts(-4, 10, 8, 90, 4), KT.steel, { seed: 6173, step: 10, blur: 4 }); cutPaper(c, ellPts(0, 110, 22, 16, 16), KT.steel, { seed: 6174, step: 10, blur: 4 }); }
  else if (kind === 'turner') { cutPaper(c, rectPts(-4, 10, 8, 70, 4), KT.wood2, { seed: 6175, step: 10, blur: 4 }); cutPaper(c, rectPts(-18, 78, 36, 40, 6), KT.steel, { seed: 6176, step: 10, blur: 4 }); }
  else { cutPaper(c, rectPts(-4, 10, 8, 46, 4), KT.wood2, { seed: 6177, step: 10, blur: 4 }); c.strokeStyle = KT.steel2; c.lineWidth = 3; for (let k = -2; k <= 2; k++) { c.beginPath(); c.ellipse(k * 2, 84, 6 + Math.abs(k) * 5, 30, 0, 0, TAU); c.stroke(); } }
  c.restore();
}
// ktCounter：靠墙的一排料理台（台面 + 正面柜门），上面放灶、锅、水槽、菜板
function ktCounter(c, x0, ytop, x1, ybot, t) {
  const th = 26;
  cutPaper(c, rectPts(x0, ytop + th, x1 - x0, ybot - ytop - th), KT.ctrFace, { seed: 6201, step: 40, blur: 10, sy: 6, grain: .08 });
  for (let x = x0 + 14; x < x1 - 120; x += 150) { cutPaper(c, rectPts(x, ytop + th + 14, 136, ybot - ytop - th - 26, 6), KT.ctrFace2, { seed: 6210 + x, step: 30, shadow: false }); c.fillStyle = KT.ctrTrim; c.fillRect(x + 58, ytop + th + 26, 20, 6); }
  cutPaper(c, rectPts(x0 - 8, ytop, x1 - x0 + 16, th, 6), KT.ctrTop, { seed: 6202, step: 40, blur: 6, sy: 4 });
  // 灶 + 红锅 + 冒汽（左段，帕秋莉右边露出来）
  const sx = 470;
  cutPaper(c, rectPts(sx - 70, ytop - 10, 140, 14, 4), '#4a4a52', { seed: 6220, step: 14, blur: 4 });
  const fl = .5 + .5 * Math.sin(twos(t) * 9);
  c.fillStyle = alpha('#ff7a2e', .8); for (let k = -1; k <= 1; k++) { c.beginPath(); c.ellipse(sx + k * 22, ytop - 12, 7, 9 + fl * 4, 0, 0, TAU); c.fill(); }
  cutPaper(c, [[sx - 64, ytop - 70], [sx + 64, ytop - 70], [sx + 54, ytop - 14], [sx - 54, ytop - 14]], KT.pot, { seed: 6221, step: 14, blur: 6 });
  cutPaper(c, rectPts(sx - 72, ytop - 78, 144, 14, 6), KT.pot2, { seed: 6222, step: 14, shadow: false });
  c.save(); c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 6; c.lineCap = 'round';
  for (let k = 0; k < 3; k++) { const ph = (t * .5 + k / 3) % 1, x = sx - 30 + k * 30, y = ytop - 86 - ph * 90; c.globalAlpha = Math.sin(ph * Math.PI) * .8;
    c.beginPath(); c.moveTo(x, y + 30); c.bezierCurveTo(x - 12, y + 18, x + 12, y + 8, x, y - 6); c.stroke(); }
  c.restore();
  // 水槽 + 水龙头（右段，美铃左边露出来）
  const kx = 1420;
  cutPaper(c, rectPts(kx - 70, ytop + 2, 140, 16, 6), KT.steel2, { seed: 6230, step: 14, shadow: false });
  cutPaper(c, [[kx + 30, ytop], [kx + 30, ytop - 60], [kx - 10, ytop - 60], [kx - 10, ytop - 48], [kx + 18, ytop - 48], [kx + 18, ytop]], KT.steel, { seed: 6231, step: 8, blur: 4 });
  // 菜板 + 一根胡萝卜
  cutPaper(c, rectPts(1500, ytop - 8, 120, 14, 5), KT.wood, { seed: 6240, step: 14, blur: 4 });
  cutPaper(c, [[1520, ytop - 14], [1590, ytop - 22], [1596, ytop - 12]], '#ff8a2a', { seed: 6241, step: 8, blur: 3 });
}
// ktTicket：后墙上的大订单纸（屏幕坐标 CKT）。纸略微翘起、两角贴胶带，纸下有投影（离墙一点点）
function ktTicket(c, t = 0) {
  const { x, y, w, h } = CKT;
  cutPaper(c, rectPts(x - 6, y - 4, w + 12, h + 10, 10), CK.slate, { seed: 6301, step: 50, blur: 22, sx: 6, sy: 14, grain: .07 });
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  c.strokeStyle = 'rgba(80,140,200,.10)'; c.lineWidth = 2; for (let yy = y + 60; yy < y + h; yy += 38) { c.beginPath(); c.moveTo(x, yy); c.lineTo(x + w, yy); c.stroke(); }   // 很淡的横格
  c.restore();
  for (const [tx, rot] of [[x + 40, -.35], [x + w - 40, .35]]) { c.save(); c.translate(tx, y + 4); c.rotate(rot); cutPaper(c, rectPts(-44, -14, 88, 28, 2), alpha('#ffd34d', .85), { seed: 6310 + Math.round(tx), step: 10, blur: 3, sy: 2 }); c.restore(); }
}
// ktFront：右前方的料理台（在琪露诺之后画，她从台子后面冒头）
function ktFront(c, t = 0) {
  const x0 = 1225, x1 = 1565, yb = 838, yf = 884;   // 台面后沿、前沿（台面是透视的平行四边形）
  cutPaper(c, rectPts(x0, yf, x1 - x0, H - yf + 20), KT.ctrFace, { seed: 6401, step: 40, blur: 16, sy: -8, grain: .08 });
  cutPaper(c, rectPts(x0 + 16, yf + 18, 146, 150, 6), KT.ctrFace2, { seed: 6402, step: 30, shadow: false });
  cutPaper(c, rectPts(x0 + 178, yf + 18, 146, 150, 6), KT.ctrFace2, { seed: 6403, step: 30, shadow: false });
  c.fillStyle = KT.ctrTrim; c.fillRect(x0 + 130, yf + 80, 6, 26); c.fillRect(x0 + 204, yf + 80, 6, 26);
  cutPaper(c, [[x0 + 14, yb], [x1 - 14, yb], [x1 + 8, yf], [x0 - 8, yf]], KT.ctrTop, { seed: 6404, step: 40, blur: 6, sy: 3 });
  cutPaper(c, rectPts(x0 - 8, yf, x1 - x0 + 16, 12, 3), '#e6dccb', { seed: 6405, step: 40, shadow: false });
  // 台面上一筐菜、一块菜板
  cutPaper(c, [[x0 + 230, yb - 22], [x0 + 320, yb - 22], [x0 + 310, yb + 14], [x0 + 240, yb + 14]], KT.wood, { seed: 6410, step: 12, blur: 4 });
  for (const [dx, col, r] of [[248, '#e85d4a', 14], [274, '#6cc070', 16], [300, '#ffd34d', 13]]) cutPaper(c, ellPts(x0 + dx, yb - 26, r, r, 14), col, { seed: 6420 + dx, step: 8, shadow: false });
}
