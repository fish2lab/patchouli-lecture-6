// 封面：打开 cover.html，导出 16:9（1920×1080）和 4:3（1440×1080）两张 PNG 到 out/cover/。
//   node tools/cover.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { openFilm, ROOT } from './browser.mjs';
const dir = resolve(ROOT, 'out/cover'); mkdirSync(dir, { recursive: true });
let bad = false;
for (const [ar, name] of [['169', 'cover-16x9.png'], ['43', 'cover-4x3.png']]) {
  const { browser, page, errors } = await openFilm('ar=' + ar, { html: resolve(ROOT, 'cover.html') });
  const url = await page.evaluate(() => document.getElementById('c').toDataURL('image/png'));
  writeFileSync(resolve(dir, name), Buffer.from(url.split(',')[1], 'base64'));
  console.log('out/cover/' + name);
  if (errors.length) { bad = true; console.error(errors.join('\n')); }
  await browser.close();
}
process.exit(bad ? 1 : 0);
