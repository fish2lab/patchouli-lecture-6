'use strict';
// 第 4 段 · 辣椒炒肉（dish）。台词和 docs/方案.md 逐字一致；画面见 docs/分镜.md。
const S4LINES = seq(1.0, [
  ['把三件事放进一道辣椒炒肉里试试。'],
  ['瘦肉顺纹切片，吸干水，抓盐，抓水，裹粉，封油。', { who: 'meiling', mood: 'smile' }],
  ['辣椒不放油，先干煸，逼出水汽，煸到起虎皮。', { who: 'meiling', mood: 'smile' }],
  ['空锅烧透，肥肉煸出猪油，下蒜，再大火滑肉。', { who: 'meiling', mood: 'smile' }],
  ['肉一变白，辣椒回锅，锅边淋料酒。'],
  ['生抽、蚝油、老抽，大约二比一比半。'],
  ['关火撒鸡精，出锅。盘底一层红油，没有水汤。', { who: 'meiling', mood: 'smile' }],
  ['可是美铃一次都没看表啊？', { who: 'cirno', mood: 'proud' }],
  ['不看表，看食材。肉由红变白，青菜塌下变深绿，筷子扎得透，就熟了。'],
]);
const s4T = i => S4LINES[i][0], s4E = i => S4LINES[i][1];
const S4DUR = s4E(S4LINES.length - 1) + 1.6;

function s4Draw(c, tau, L) {
  ckRoom(c, tau);
  const cam = CKCAM0;
  let outro = null;
  ckLayer(c, cam, lc => {
    ckText(lc, '辣椒炒肉', CKB.cx, 200, { size: 60, align: 'center', color: 'yellow', p: sm(.6, 1.6, tau) });
    outro = ogOutro(lc, tau, S4DUR, cam);
  });
  ogEraser(c, cam, outro);
  ogPch(c, tau, L);
  ogMei(c, tau, L);
  ogCirno(c, tau, L, S4LINES);
}
scene({ order: 4, key: 'dish', title: '辣椒炒肉', dur: S4DUR, lines: S4LINES, fn: s4Draw });
