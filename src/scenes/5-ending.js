'use strict';
// 第 5 段 · 结尾（ending）。台词和 docs/方案.md 逐字一致；画面见 docs/分镜.md。
const S5LINES = seq(1.0, [
  ['所以大厨不看谱，不是靠玄学手感，而是心中有谱。'],
  ['纤维，水，先后。想清楚这三件，菜谱就只是参考。'],
  ['下回试试只改一处，比如青菜出锅前放盐，看它出不出水。', { who: 'meiling', mood: 'smile' }],
  ['那我来试冷水下锅！咦，锅呢？我把锅冻住了。', { who: 'cirno', mood: 'proud' }],
  ['今天这本书，我就不翻了。去厨房吧。'],
]);
const s5T = i => S5LINES[i][0], s5E = i => S5LINES[i][1];
const S5DUR = s5E(S5LINES.length - 1) + 1.6;

function s5Draw(c, tau, L) {
  ckRoom(c, tau);
  const cam = CKCAM0;
  let outro = null;
  ckLayer(c, cam, lc => {
    ckText(lc, '结尾', CKB.cx, 200, { size: 60, align: 'center', color: 'yellow', p: sm(.6, 1.6, tau) });
    outro = ogOutro(lc, tau, S5DUR, cam);
  });
  ogEraser(c, cam, outro);
  ogPch(c, tau, L);
  ogMei(c, tau, L);
  ogCirno(c, tau, L, S5LINES);
}
scene({ order: 5, key: 'ending', title: '结尾', dur: S5DUR, lines: S5LINES, fn: s5Draw });
