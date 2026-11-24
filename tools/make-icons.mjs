// 앱 아이콘(PNG) 생성 — 외부 라이브러리 없이 24×24 도트를 확대해 PNG로 저장
// 사용: node tools/make-icons.mjs  →  icons/icon-180.png, icon-192.png, icon-512.png
import fs from 'node:fs';
import zlib from 'node:zlib';

// 24×24 도트: 빨간 버그를 내려찍는 거대 키보드 (가장자리 2칸은 여백 → maskable 안전 영역)
const ART = [
  '........................',
  '........................',
  '..........y.............',
  '.......y..y..y..........',
  '........y.y.y...........',
  '..........y.............',
  '.......gg.r.r.gg........',
  '........grrrrrg.........',
  '.......grRrrRrrg........',
  '........rrrrrrr.........',
  '.......g.rrrrr.g........',
  '........g.r.r.g.........',
  '........................',
  '....cccccccccccccccc....',
  '....cKKKKKKKKKKKKKKc....',
  '....cKwKwKwKwKwKwKKc....',
  '....cKKKKKKKKKKKKKKc....',
  '....cKwKwKwKwKwKwKKc....',
  '....cKKKKKKKKKKKKKKc....',
  '....cKKwwwwwwwwwwKRc....',
  '....cKKKKKKKKKKKKKKc....',
  '....cccccccccccccccc....',
  '........................',
  '........................',
];
const PAL = {
  '.': [10, 15, 28], c: [0, 229, 255], K: [43, 47, 58], w: [232, 236, 243], R: [255, 82, 82],
  r: [255, 59, 107], g: [139, 234, 59], y: [255, 215, 64],
};

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  const cell = size / ART.length;
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0; // 필터 없음
    const row = ART[Math.min(ART.length - 1, Math.floor(y / cell))];
    for (let x = 0; x < size; x++) {
      const ch = row[Math.min(row.length - 1, Math.floor(x / cell))];
      const [r, g, b] = PAL[ch] || PAL['.'];
      const o = y * (size * 3 + 1) + 1 + x * 3;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0; // 8bit RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ]);
}
const out = new URL('../icons/', import.meta.url);
fs.mkdirSync(out, { recursive: true });
for (const s of [180, 192, 512]) { fs.writeFileSync(new URL(`icon-${s}.png`, out), png(s)); console.log('icon', s); }
