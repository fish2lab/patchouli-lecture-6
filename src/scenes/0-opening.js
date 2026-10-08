'use strict';
// 第 0 段：开场。琪露诺问：美铃炒的菜为什么比帕秋莉照书做的好吃？帕秋莉照谱做饭像抽盲盒；美铃从不看谱——谱在心里。
// 黑板左边一张菜谱卡（「翻炒三分钟」「盐少许」），旁边一个打问号的盲盒；右上一颗心，里面一张小卡「心中有谱」。
// 最后菜谱卡一拆为三：切（粉）/ 水和锅温（蓝）/ 先后（绿），三件事的颜色全片固定。
// 样板段：本集的画风、节奏、站位以这一段为准。顶层名字带 S0 / s0 前缀。
const S0LINES = seq(1.0, [
  ['帕秋莉！美铃炒的菜，为什么比你照书做的好吃？', { who: 'cirno', mood: 'proud' }],
  ['我照着菜谱做，每次都像抽盲盒。', { mood: 'annoyed', pause: .2, hold: .3 }],
  ['我做菜从来不看谱。', { who: 'meiling', mood: 'smile', pause: .2 }],
  ['不看谱，是因为谱已经在她心里了。', { pause: .2, hold: .8 }],
  ['今天把做菜当工程来拆。菜谱背后，其实只有三件事。', { pause: .3, hold: .3 }],
  ['怎么切，怎么管住水和锅温，谁先下锅。', { pause: .2, hold: 1.2 }],
]);
const s0T = i => S0LINES[i][0], s0E = i => S0LINES[i][1];
const S0DUR = s0E(5) + 1.6;

// 菜谱卡（板坐标）
const S0CARD = { x: 530, y: 110, w: 360, h: 380 };
const S0STEPS = ['翻炒三分钟', '盐 少许', '油 适量', '火候 看着办'];
// 心形（以 (0,0) 为中心的单位坐标，y 向下）
const S0HEART = (() => { const out = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU, x = 16 * Math.pow(Math.sin(a), 3), y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)); out.push([x / 17, y / 17]); } return out; })();
const S0HC = [1295, 250], S0HS = 140;
// 三件事（第 6 句），x 是每栏中心
const S0THREE = [
  { x: 640, head: '切', sub: '纤维多长', color: 'pink' },
  { x: 940, head: '水', sub: '锅温', color: 'blue' },
  { x: 1240, head: '先后', sub: '时间表', color: 'green' },
];

function s0Draw(c, tau, L) {
  ckRoom(c, tau);
  const cam = ckCam(tau, [[0, CKB.cx, CKB.cy, 1], [s0T(4), CKB.cx, CKB.cy, 1], [s0T(4) + 1.6, CKB.cx, CKB.cy + 20, 1.03], [S0DUR - 1.4, CKB.cx, CKB.cy + 20, 1.03]]);
  let pen = null, outro = null;
  ckLayer(c, cam, lc => {
    const { x, y, w, h } = S0CARD;
    // 第 1 句：菜谱卡——边框 + 标题 + 四行步骤
    const tc = s0T(0) + .5;
    ckBorder(lc, x, y, w, h, 'double', 'muted', sm(tc, tc + 1, tau), 501);
    const t0 = ckWrite(lc, tau, '菜谱', x + w / 2, y + 74, tc + .6, { size: 54, align: 'center', spc: .12 });
    ckText(lc, '菜谱', x + w / 2, y + 74, { size: 54, align: 'center', p: t0.p, heavy: true });
    const ws = S0STEPS.map((s, i) => { const wr = ckWrite(lc, tau, s, x + 40, y + 160 + i * 66, tc + 1 + i * .55, { size: 40, spc: .07 });
      ckText(lc, s, x + 40, y + 160 + i * 66, { size: 40, color: 'muted', p: wr.p }); return wr; });
    // 第 2 句：盲盒——一个立体纸箱 + 大问号，卡上「少许」「适量」「看着办」被圈出
    const tb = s0T(1) + .3, bx = 925, by = 220, bs = 140;
    const pb = sm(tb, tb + 1, tau);
    ckLine(lc, [[bx, by], [bx + bs, by], [bx + bs, by + bs], [bx, by + bs]], { color: 'orange', w: 5, close: true, p: pb, seed: 511 });
    ckLine(lc, [[bx, by], [bx + 40, by - 36], [bx + bs + 40, by - 36], [bx + bs, by]], { color: 'orange', w: 5, p: sm(tb + .4, tb + 1.2, tau), seed: 512 });
    ckLine(lc, [[bx + bs + 40, by - 36], [bx + bs + 40, by + bs - 36], [bx + bs, by + bs]], { color: 'orange', w: 5, p: sm(tb + .6, tb + 1.3, tau), seed: 513 });
    const q = sm(tb + 1.1, tb + 1.5, tau, easeOutBack);
    if (q > 0) ckText(lc, '?', bx + bs / 2, by + bs / 2 + 34 * q, { size: 96 * q + 30 * (1 - q), align: 'center', color: 'yellow', heavy: true, al: Math.min(1, q * 1.5) });
    const lb = ckWrite(lc, tau, '盲盒', bx + bs / 2 + 20, by + bs + 70, tb + 1.4, { size: 46, align: 'center', spc: .12 });
    ckText(lc, '盲盒', bx + bs / 2 + 20, by + bs + 70, { size: 46, align: 'center', color: 'orange', p: lb.p });
    for (let i = 1; i < 4; i++) { const s = S0STEPS[i], k = s.split(' ')[1], kx = x + 40 + zhWidth(lc, s.split(' ')[0] + ' ', 40);
      ckRing(lc, k, kx, y + 160 + i * 66, 40, 'pink', sm(tb + 2 + i * .3, tb + 2.5 + i * .3, tau), 520 + i); }
    // 第 3 句：美铃不看谱——卡片被一道斜线划掉（粉）
    const tx = s0T(2) + .5;
    ckLine(lc, [[x + 20, y + h - 20], [x + w - 20, y + 30]], { color: 'pink', w: 7, p: sm(tx, tx + .6, tau, easeOut), seed: 531 });
    // 第 4 句：心形，里面一张小卡「心中有谱」
    const th = s0T(3) + .3;
    ckLine(lc, S0HEART.map(([u, v]) => [S0HC[0] + u * S0HS, S0HC[1] + v * S0HS]), { color: 'pink', w: 5, close: true, smooth: true, p: sm(th, th + 1.2, tau), seed: 541 });
    const hc = ckWrite(lc, tau, '心中有谱', S0HC[0], S0HC[1] + 28, th + 1.1, { size: 44, align: 'center', spc: .14 });
    ckText(lc, '心中有谱', S0HC[0], S0HC[1] + 28, { size: 44, align: 'center', color: 'yellow', p: hc.p, heavy: true });
    // 第 5 句：菜谱卡底下引出一条箭头到「三件事」
    const te = s0T(4) + 1.4;
    ckArrow(lc, [x + w / 2, y + h + 20], [x + w / 2 + 120, 600], { color: 'muted', w: 5, p: sm(te, te + .7, tau), bend: -.2, seed: 551 });
    const n3 = ckWrite(lc, tau, '三件事', 760, 620, te + .7, { size: 46, spc: .12 });
    ckText(lc, '三件事', 760, 620, { size: 46, color: 'muted', p: n3.p * (1 - sm(s0T(5) - .2, s0T(5) + .2, tau)) });
    // 第 6 句：三栏标题，按台词节奏一栏一栏写出
    const d6 = s0E(5) - s0T(5) - 1.2, tw = [0, .3, .62].map(f => s0T(5) + .1 + f * d6), wr6 = [];
    S0THREE.forEach((s, i) => {
      const hw = ckWrite(lc, tau, s.head, s.x, 690, tw[i], { size: 76, align: 'center', spc: .16 });
      ckText(lc, s.head, s.x, 690, { size: 76, align: 'center', color: s.color, p: hw.p, heavy: true });
      ckUnderline(lc, s.head, s.x, 690, 76, s.color, sm(tw[i] + .35, tw[i] + .7, tau), 560 + i, 'center');
      const sw = ckWrite(lc, tau, s.sub, s.x, 790, tw[i] + .5, { size: 40, align: 'center', spc: .1 });
      ckText(lc, s.sub, s.x, 790, { size: 40, align: 'center', color: 'muted', p: sw.p });
      wr6.push(hw, sw);
    });
    for (const wr of [t0, ...ws, lb, hc, n3, ...wr6]) if (wr.writing) pen = wr;
    outro = ogOutro(lc, tau, S0DUR, cam);
  });
  if (pen) { const sp = ckToScreen(cam, pen.head[0], pen.head[1]); ckStick(c, sp, tau); ckDust(c, sp, tau, true, 58); }
  ogEraser(c, cam, outro);
  // 人物：帕秋莉第 2 句抱书生闷气，第 5、6 句指黑板；美铃说「不看谱」时摆个起手式
  const pchPose = tau > s0T(1) && tau < s0E(1) + .3 ? 'cross' : tau > s0T(4) + 1 && tau < s0E(5) ? 'point' : 'lecture';
  ogPch(c, tau, L, { pose: pchPose, gesture: .6 });
  const meiK = tau > s0T(2) - .2 && tau < s0E(2) + .4;
  ogMei(c, tau, L, { pose: meiK ? 'kungfu' : 'stand', gesture: meiK ? sm(s0T(2), s0T(2) + .5, tau) : undefined });
  ogCirno(c, tau, L, S0LINES);
}
scene({ order: 0, key: 'opening', title: '开场', dur: S0DUR, lines: S0LINES, fn: s0Draw });
{ const tc = s0T(0) + .5, tb = s0T(1) + .3, te = s0T(4) + 1.4, d6 = s0E(5) - s0T(5) - 1.2;
  sfx('opening', [
    [tc, 'line', 1.0], [tc + .6, 'chalk', .3], ...[0, 1, 2, 3].map(i => [tc + 1 + i * .55, 'chalk', .4]),
    [tb, 'line', 1.3], [tb + 1.1, 'tap'], [tb + 1.4, 'chalk', .3],
    [s0T(2) + .5, 'line', .6],
    [s0T(3) + .3, 'line', 1.2], [s0T(3) + 1.1, 'chalk', .6],
    [s0T(4), 'whoosh', 1.6], [te, 'line', .7], [te + .7, 'chalk', .4],
    ...[0, .3, .62].map(f => [s0T(5) + .1 + f * d6, 'chalk', .5]),
    [S0DUR - 1.25, 'felt', 1.0],
  ]); }
