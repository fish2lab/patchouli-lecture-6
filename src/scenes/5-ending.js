'use strict';
// 第 5 段：结尾。回到开场那颗心：「玄学手感」被划掉，心里写进三件事（纤维 / 水 / 先后），
// 开场的菜谱卡缩成一张小卡，标「参考」。美铃建议只改一处做对照；琪露诺想试冷水下锅，结果把锅冻成冰块。
// 帕秋莉合上书：今天这本书不翻了。片尾标出处。顶层名字带 S5 / s5 前缀。
const S5LINES = seq(.8, [
  ['所以大厨不看谱，不是靠玄学手感，而是心中有谱。', { pause: 0, hold: 1.0 }],
  ['纤维，水，先后。想清楚这三件，菜谱就只是参考。', { pause: .2, hold: .8 }],
  ['下回试试只改一处，比如青菜出锅前放盐，看它出不出水。', { who: 'meiling', mood: 'smile', pause: .2, hold: .3 }],
  ['那我来试冷水下锅！咦，锅呢？我把锅冻住了。', { who: 'cirno', mood: 'proud', pause: .3, hold: .6 }],
  ['今天这本书，我就不翻了。去厨房吧。', { mood: 'smile', pause: .4, hold: .6 }],
]);
const s5T = i => S5LINES[i][0], s5E = i => S5LINES[i][1];
const S5DUR = s5E(4) + 3.2;

const S5HEART = (() => { const out = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU, x = 16 * Math.pow(Math.sin(a), 3), y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)); out.push([x / 17, y / 17]); } return out; })();
const S5HC = [760, 315], S5HS = 248;
const S5THREE = [['纤维', 'pink'], ['水', 'blue'], ['先后', 'green']];

function s5Draw(c, tau0, L) {
  const tau = Math.min(tau0, S5DUR - 1);   // 最后 1 秒整体静止
  ckRoom(c, tau);
  const cam = CKCAM0;
  let pen = null, erp = null;
  ckLayer(c, cam, lc => {
    const pens = [];
    // 第 1 句：「玄学手感」写出、划掉 → 大心形 +「心中有谱」
    const t1 = s5T(0) + 1.2;
    const xw = ckWrite(lc, tau, '玄学手感', 1150, 170, t1, { size: 46, align: 'center', spc: .1 });
    ckText(lc, '玄学手感', 1150, 170, { size: 46, align: 'center', color: 'muted', p: xw.p }); pens.push(xw);
    ckLine(lc, [[1040, 160], [1262, 146]], { color: 'pink', w: 6, p: sm(t1 + .6, t1 + 1, tau), seed: 701 });
    const th = s5T(0) + 2.4;
    ckLine(lc, S5HEART.map(([u, v]) => [S5HC[0] + u * S5HS, S5HC[1] + v * S5HS]), { color: 'pink', w: 6, close: true, smooth: true, p: sm(th, th + 1.2, tau), seed: 702 });
    const hw = ckWrite(lc, tau, '心中有谱', S5HC[0], S5HC[1] - 20, th + 1.1, { size: 64, align: 'center', spc: .14 });
    ckText(lc, '心中有谱', S5HC[0], S5HC[1] - 20, { size: 64, align: 'center', color: 'yellow', heavy: true, p: hw.p }); pens.push(hw);
    // 第 2 句：心里写进三件事；右边一张小菜谱卡标「参考」
    const t2 = s5T(1) + .1, tws = [0, .9, 1.6];
    let ox = S5HC[0] - zhWidth(lc, '纤维 · 水 · 先后', 44) / 2;
    S5THREE.forEach(([w, col], i) => {
      const ww = ckWrite(lc, tau, w, ox, S5HC[1] + 70, t2 + tws[i], { size: 44, spc: .14 });
      ckText(lc, w, ox, S5HC[1] + 70, { size: 44, color: col, heavy: true, p: ww.p }); pens.push(ww);
      ox += zhWidth(lc, w, 44);
      if (i < 2) { if (tau > t2 + tws[i] + .4) ckText(lc, ' · ', ox, S5HC[1] + 70, { size: 44, color: 'muted' }); ox += zhWidth(lc, ' · ', 44); }
    });
    const tc = s5T(1) + 3.2;
    ckBorder(lc, 1080, 250, 220, 190, 'double', 'muted', sm(tc, tc + .8, tau), 711);
    const cw = ckWrite(lc, tau, '菜谱', 1190, 330, tc + .5, { size: 44, align: 'center', spc: .12 });
    ckText(lc, '菜谱', 1190, 330, { size: 44, align: 'center', p: cw.p }); pens.push(cw);
    const rw = ckWrite(lc, tau, '参考', 1190, 400, tc + 1, { size: 40, align: 'center', spc: .12 });
    ckText(lc, '参考', 1190, 400, { size: 40, align: 'center', color: 'green', p: rw.p }); pens.push(rw);
    // 第 3 句：只改一处——两片青菜叶对照，一片出锅前放盐（干爽），一片早放盐（出水）
    const t3 = s5T(2) + .3;
    const ow = ckWrite(lc, tau, '只改一处', 560, 680, t3, { size: 44, spc: .12 });
    ckText(lc, '只改一处', 560, 680, { size: 44, color: 'yellow', p: ow.p }); pens.push(ow);
    const leaf = (cx, cy, p, seed) => { const pts = []; for (let i = 0; i <= 16; i++) { const a = i / 16 * TAU; pts.push([cx + 70 * Math.cos(a), cy + 30 * Math.sin(a) * (Math.cos(a) > 0 ? .7 : 1)]); }
      ckLine(lc, pts, { color: 'green', w: 5, close: true, smooth: true, p, seed }); ckLine(lc, [[cx - 80, cy], [cx + 60, cy]], { color: 'green', w: 3, p, seed: seed + 1 }); };
    const tl = t3 + 1.4;
    leaf(900, 670, sm(tl, tl + .6, tau), 721); leaf(1100, 670, sm(tl + .3, tl + .9, tau), 723);
    if (tau > tl + 1.2) { ckText(lc, '晚盐', 900, 760, { size: 34, align: 'center', color: 'muted', al: sm(tl + 1.2, tl + 1.5, tau) }); ckText(lc, '早盐', 1100, 760, { size: 34, align: 'center', color: 'muted', al: sm(tl + 1.2, tl + 1.5, tau) }); }
    const dk = sm(s5E(2) - 1.6, s5E(2) - .6, tau);   // 早盐那片出水
    if (dk > 0) { lc.fillStyle = CK.blue; for (let i = 0; i < 4; i++) { const dx = 1060 + i * 26, dy = 700 + ((tau * 40 + i * 13) % 26) * dk; lc.globalAlpha = dk; lc.beginPath(); lc.arc(dx, dy, 5, 0, TAU); lc.fill(); } lc.globalAlpha = 1; }
    // 第 4 句：琪露诺的锅——一口锅被冻成冰块（左下，避开她冒头的右下角）
    const t4 = s5T(3) + .5, wk = sm(t4, t4 + .8, tau), ice = sm(s5T(3) + 3.2, s5T(3) + 4.2, tau);
    // 这一句前先用板擦把对照实验那一行擦掉，给锅让地方
    erp = ckErase(lc, [520, 590, 720, 200], sm(s5T(3) - .5, s5T(3) + .3, tau, t => t));
    if (wk > 0) {
      const wx = 860, wy = 700;
      ogWok(lc, wx, wy, .7, { p: wk, seed: 731 });
      const ww = ckWrite(lc, tau, '冷水下锅', wx, wy - 40, t4 + .4, { size: 40, align: 'center', spc: .1 });
      ckText(lc, '冷水下锅', wx, wy - 40, { size: 40, align: 'center', color: 'blue', p: ww.p * (1 - ice) }); pens.push(ww);
      if (ice > 0) {
        ckShape(lc, rectPts(wx - 170, wy - 110, 340, 200), { color: 'blue', w: 5, hatch: 'blue', gap: 22, angle: -.6, p: ice, seed: 735 });
        for (let i = 0; i < 3; i++) { const sx = wx - 110 + i * 110, sy = wy - 50 + (i % 2) * 40, r = 16;
          for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI; ckLine(lc, [[sx - r * Math.cos(a), sy - r * Math.sin(a)], [sx + r * Math.cos(a), sy + r * Math.sin(a)]], { color: 'ink', w: 3, p: ice, seed: 740 + i * 3 + k }); } }
      }
    }
    // 第 5 句 + 片尾：出处
    const tf = s5T(4) + 1.5, fa = sm(tf, tf + .6, tau);
    if (fa > 0) ckText(lc, '出处：龙海《人人都是大厨：讲透 22 条做菜的基本原理》', CKB.cx, 838, { size: 30, align: 'center', color: 'muted', al: fa });
    for (const w of pens) if (w.writing) pen = w;
  }, {});
  if (pen) { const sp = ckToScreen(cam, pen.head[0], pen.head[1]); ckStick(c, sp, tau); ckDust(c, sp, tau, true, 78); }
  ogEraser(c, cam, erp);
  // 人物：最后一句帕秋莉合上书（stand 双手抱书）
  ogPch(c, tau, L, { pose: tau > s5T(4) ? 'stand' : tau > s5T(0) + 2 && tau < s5E(1) ? 'point' : 'lecture', gesture: .6 });
  ogMei(c, tau, L, { pose: tau > s5T(3) + 3.2 && tau < s5E(3) + .4 ? 'startle' : 'stand', gesture: tau > s5T(3) + 3.2 ? sm(s5T(3) + 3.2, s5T(3) + 4.6, tau) : undefined });
  ogCirno(c, tau, L, S5LINES, { mood: tau > s5T(3) + 3 ? 'surprised' : undefined });
}
scene({ order: 5, key: 'ending', title: '结尾', dur: S5DUR, lines: S5LINES, fn: s5Draw });
{ const t1 = s5T(0) + 1.2, th = s5T(0) + 2.4, t2 = s5T(1) + .1, tc = s5T(1) + 3.2, t3 = s5T(2) + .3, t4 = s5T(3) + .5;
  sfx('ending', [
    [t1, 'chalk', .4], [t1 + .6, 'line', .4], [th, 'line', 1.2], [th + 1.1, 'chalk', .6],
    [t2, 'chalk', .3], [t2 + .9, 'chalk', .2], [t2 + 1.6, 'chalk', .3], [tc, 'line', .8], [tc + .5, 'chalk', .3], [tc + 1, 'chalk', .3],
    [t3, 'chalk', .5], [t3 + 1.4, 'line', .9],
    [t4, 'line', .8], [t4 + .4, 'chalk', .4], [s5T(3) + 3.2, 'line', 1.0],
  ]); }
