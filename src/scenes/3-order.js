'use strict';
// 第 3 段 · 先后（order）。台词和 docs/方案.md 逐字一致；画面见 docs/分镜.md。
const S3LINES = seq(1.0, [
  ['第三件事：先后。热从表面走到中心要时间，越厚越慢。'],
  ['蒜苗的白杆要炒一分钟，绿叶三十秒就熟。'],
  ['所以杆和叶分两堆，杆先下，叶后下。', { who: 'meiling', mood: 'smile' }],
  ['肉片也一样。滑到表面变白，先盛出来。'],
  ['底油炒熟配菜，再把肉倒回去合炒。'],
  ['料酒要等锅最热的时候，沿锅边淋，酒气一蒸，腥味就走了。'],
  ['鸡精和蚝油怕高温，关火以后再放。'],
  ['原来做菜就是排时间表！', { who: 'cirno', mood: 'proud' }],
]);
const s3T = i => S3LINES[i][0], s3E = i => S3LINES[i][1];
const S3DUR = s3E(S3LINES.length - 1) + 1.6;

function s3Draw(c, tau, L) {
  ckRoom(c, tau);
  const cam = CKCAM0;
  let outro = null;
  ckLayer(c, cam, lc => {
    ckText(lc, '先后', CKB.cx, 200, { size: 60, align: 'center', color: 'yellow', p: sm(.6, 1.6, tau) });
    outro = ogOutro(lc, tau, S3DUR, cam);
  });
  ogEraser(c, cam, outro);
  ogPch(c, tau, L);
  ogMei(c, tau, L);
  ogCirno(c, tau, L, S3LINES);
}
scene({ order: 3, key: 'order', title: '先后', dur: S3DUR, lines: S3LINES, fn: s3Draw });
