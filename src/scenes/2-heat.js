'use strict';
// 第 2 段 · 水和锅温（heat）。台词和 docs/方案.md 逐字一致；画面见 docs/分镜.md。
const S2LINES = seq(1.0, [
  ['第二件事：水，是锅温的敌人。'],
  ['湿菜倒进热油锅，锅温一下掉下去，爆炒就变成了水煮。'],
  ['所以青菜要沥干，肉片要用厨房纸吸干。', { who: 'meiling', mood: 'smile' }],
  ['锅也一样。空锅先烧到微微冒烟，再倒凉油下肉。'],
  ['肉片表面那点水瞬间变成蒸汽，垫在下面，肉就不粘锅。'],
  ['那我站在锅边，锅是不是就凉了？', { who: 'cirno', mood: 'proud' }],
  ['所以今天你离灶台远一点。'],
  ['盐也会把水拉出来。青菜早放盐，就会出汤变软。'],
  ['青菜出锅前再放盐；肉反过来，要提前用盐腌。'],
]);
const s2T = i => S2LINES[i][0], s2E = i => S2LINES[i][1];
const S2DUR = s2E(S2LINES.length - 1) + 1.6;

function s2Draw(c, tau, L) {
  ckRoom(c, tau);
  const cam = CKCAM0;
  let outro = null;
  ckLayer(c, cam, lc => {
    ckText(lc, '水和锅温', CKB.cx, 200, { size: 60, align: 'center', color: 'yellow', p: sm(.6, 1.6, tau) });
    outro = ogOutro(lc, tau, S2DUR, cam);
  });
  ogEraser(c, cam, outro);
  ogPch(c, tau, L);
  ogMei(c, tau, L);
  ogCirno(c, tau, L, S2LINES);
}
scene({ order: 2, key: 'heat', title: '水和锅温', dur: S2DUR, lines: S2LINES, fn: s2Draw });
