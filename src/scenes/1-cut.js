'use strict';
// 第 1 段 · 切（cut）。台词和 docs/方案.md 逐字一致；画面见 docs/分镜.md。
const S1LINES = seq(1.0, [
  ['先说切。生肉的纹理，其实是一捆捆细橡皮筋。'],
  ['一受热，这些皮筋就猛地缩紧、绷直。'],
  ['那顺着切呀！长长的，多整齐！', { who: 'cirno', mood: 'proud' }],
  ['整齐，但长皮筋熟了以后，牙齿咬不断，就塞牙。'],
  ['迎着纹理横着切，皮筋全变成小短段，一咬就开。'],
  ['所以厨房里说：横切牛羊顺切猪。', { who: 'meiling', mood: 'smile' }],
  ['牛羊纤维粗硬，必须切断；猪肉细嫩，顺着切，下锅不容易碎。'],
  ['刀不是在切肉，是在决定纤维有多长。'],
]);
const s1T = i => S1LINES[i][0], s1E = i => S1LINES[i][1];
const S1DUR = s1E(S1LINES.length - 1) + 1.6;

function s1Draw(c, tau, L) {
  ckRoom(c, tau);
  const cam = CKCAM0;
  let outro = null;
  ckLayer(c, cam, lc => {
    ckText(lc, '切', CKB.cx, 200, { size: 60, align: 'center', color: 'yellow', p: sm(.6, 1.6, tau) });
    outro = ogOutro(lc, tau, S1DUR, cam);
  });
  ogEraser(c, cam, outro);
  ogPch(c, tau, L);
  ogMei(c, tau, L);
  ogCirno(c, tau, L, S1LINES);
}
scene({ order: 1, key: 'cut', title: '切', dur: S1DUR, lines: S1LINES, fn: s1Draw });
