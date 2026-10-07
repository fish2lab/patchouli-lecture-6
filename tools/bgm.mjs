// 背景音乐：从一份东方原曲的 MIDI 扒谱里取出旋律、副旋律、伴奏、低音的音符，写成 src/bgm-data.js，由 core.js 的 score() 用 WebAudio 重新编配（八音盒 + 柔钢琴 + 低音，放慢）。
//   node tools/bgm.mjs <扒谱.mid> --list              列出每一轨：乐器、音符数、小节范围、音域（挑轨用）
//   node tools/bgm.mjs <扒谱.mid> --bars 17,24 1-12   逐小节打印这几轨的音符（认主旋律用）
//   node tools/bgm.mjs <扒谱.mid>                     按下面的 SONG 表生成 src/bgm-data.js
// 选曲规则：用这一集主讲角色（或首次登场角色）的角色曲，做法和步骤见 docs/教程.md「背景音乐」。MIDI 文件不进仓库，仓库里只有挑出来的音符和我们自己的编配。
// 轨号是 @tonejs/midi 读出来的下标（和 MTrk 顺序不同；format 0 的单轨文件会按通道拆开）。
import pkg from '@tonejs/midi';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const { Midi } = pkg;
const ROOT = resolve(new URL('..', import.meta.url).pathname);

// ===== 每集改这一张表 =====
// 第 6 集用红美铃的角色曲：明治十七年の上海アリス（东方红魔乡，ZUN）。扒谱是 touhou-midi-collection 里的 ZUN 原版 MIDI（format 0，480 tpb，原速 143）。
// 轨：26 honky-tonk 钢琴（第 7–12 小节前奏的十六分琶音，拿来当八音盒的开头）、18 电钢（第 13–49 小节主旋律；14 是高八度的同一条，不取）、
// 3 大钢琴琶音（伴奏）、16 贝斯。第 13–32 小节升 G 小调，第 33–49 小节下移到 F 小调再走一遍；第 50–56 小节是尾声，不取。
const SONG = {
  title: '明治十七年の上海アリス（东方红魔乡，ZUN）',
  source: 'touhou-midi-collection 的 ZUN 原版 MIDI',
  bars: [7, 49],   // 前奏后半（第 1–6 小节和 7–12 小节一样，只取一遍）+ A + B + 转调再走一遍；一遍约 1 分 48 秒
  bpm: 96,         // 放慢后的速度（原曲 143）
  pick: {
    mel: [[26, [7, 12]], [18, [13, 49]]],
    counter: [],
    piano: [[3, [13, 49]]],
    bass: [[16, [7, 49]]],
  },
};
// ===== 表到此为止 =====

const args = process.argv.slice(2), file = args.find(a => !a.startsWith('--') && /\.midi?$/i.test(a));
if (!file) { console.error('用法：node tools/bgm.mjs <扒谱.mid> [--list | --bars 轨,轨 起-止]'); process.exit(2); }
const midi = new Midi(readFileSync(file)), ppq = midi.header.ppq, B = 4;   // 每小节拍数（只处理 4/4）
const barOf = n => Math.floor(n.ticks / ppq / B);
const NAMES = 'C C# D D# E F F# G G# A A# B'.split(' '), nm = p => NAMES[p % 12] + (Math.floor(p / 12) - 1);

if (args.includes('--list')) {
  console.log(`ppq ${ppq}，速度 ${midi.header.tempos.slice(0, 3).map(t => t.bpm.toFixed(0)).join('/')}，拍号 ${midi.header.timeSignatures.map(t => t.timeSignature.join('/')).join(' ')}，${midi.duration.toFixed(0)} 秒`);
  midi.tracks.forEach((t, i) => { if (!t.notes.length) return; const bs = t.notes.map(barOf), ps = t.notes.map(n => n.midi);
    console.log(`${String(i).padStart(2)}  ${t.instrument.name.padEnd(26)} 通道 ${t.channel}  ${t.notes.length} 音  小节 ${Math.min(...bs)}–${Math.max(...bs)}  音域 ${nm(Math.min(...ps))}–${nm(Math.max(...ps))}`); });
  process.exit(0);
}
const bi = args.indexOf('--bars');
if (bi >= 0) {
  const [a, b] = args[bi + 2].split('-').map(Number);
  for (const ti of args[bi + 1].split(',').map(Number)) { console.log(`-- ${ti} ${midi.tracks[ti].instrument.name}`);
    for (let bar = a; bar <= b; bar++) console.log(bar, midi.tracks[ti].notes.filter(n => barOf(n) === bar).map(n => `${nm(n.midi)}/${(n.durationTicks / ppq).toFixed(2)}`).join(' ')); }
  process.exit(0);
}

const [b0, b1] = SONG.bars, parts = {};
for (const [name, picks] of Object.entries(SONG.pick)) {
  const out = [];
  for (const [ti, ...ranges] of picks) for (const n of midi.tracks[ti].notes) {
    const bar = barOf(n);
    if (bar < b0 || bar > b1 || !ranges.some(([a, b]) => bar >= a && bar <= b)) continue;
    out.push([+(n.ticks / ppq - b0 * B).toFixed(3), +(n.durationTicks / ppq).toFixed(3), n.midi, +n.velocity.toFixed(2)]);
  }
  out.sort((a, b) => a[0] - b[0] || a[2] - b[2]);
  parts[name] = out;
}
const lenBeats = (b1 - b0 + 1) * B;
const js = `'use strict';\n// 由 tools/bgm.mjs 生成，别手改。原曲：${SONG.title}；音符取自 ${SONG.source}，编配在 core.js 的 score()。\n// 每个音：[拍, 时值（拍）, MIDI 音高, 力度 0..1]\nconst BGM = ${JSON.stringify({ lenBeats, bpm: SONG.bpm, parts })};\n`;
writeFileSync(resolve(ROOT, 'src/bgm-data.js'), js);
console.log('src/bgm-data.js：', Object.entries(parts).map(([k, v]) => `${k} ${v.length}`).join('，'), `，${lenBeats} 拍 ≈ ${(lenBeats * 60 / SONG.bpm).toFixed(0)} 秒一遍，${(js.length / 1024).toFixed(0)} KB`);
