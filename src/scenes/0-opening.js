'use strict';
// 第 0 段 · 开场（opening）。台词和 docs/方案.md 逐字一致；画面见 docs/分镜.md。
const S0LINES = seq(1.0, [
  ['帕秋莉！美铃炒的菜，为什么比你照书做的好吃？', { who: 'cirno', mood: 'proud' }],
  ['我照着菜谱做，每次都像抽盲盒。'],
  ['我做菜从来不看谱。', { who: 'meiling', mood: 'smile' }],
  ['不看谱，是因为谱已经在她心里了。'],
  ['今天把做菜当工程来拆。菜谱背后，其实只有三件事。'],
  ['怎么切，怎么管住水和锅温，谁先下锅。'],
]);
const s0T = i => S0LINES[i][0], s0E = i => S0LINES[i][1];
const S0DUR = s0E(S0LINES.length - 1) + 1.6;

function s0Draw(c, tau, L) {
  ckRoom(c, tau);
  const cam = CKCAM0;
  let outro = null;
  ckLayer(c, cam, lc => {
    ckText(lc, '开场', CKB.cx, 200, { size: 60, align: 'center', color: 'yellow', p: sm(.6, 1.6, tau) });
    outro = ogOutro(lc, tau, S0DUR, cam);
  });
  ogEraser(c, cam, outro);
  ogPch(c, tau, L);
  ogMei(c, tau, L);
  ogCirno(c, tau, L, S0LINES);
}
scene({ order: 0, key: 'opening', title: '开场', dur: S0DUR, lines: S0LINES, fn: s0Draw });
