import sharp from 'sharp';
import fs from 'node:fs';
const svg = fs.readFileSync('public/favicon.svg');
const out = 'public/icons'; fs.mkdirSync(out, { recursive: true });
for (const s of [192, 512]) await sharp(svg, { density: 384 }).resize(s, s).png().toFile(`${out}/icon-${s}.png`);
await sharp(svg, { density: 384 }).resize(180, 180).png().toFile(`${out}/apple-touch-icon.png`);
// maskable: ikon dikecilkan ke zona aman 80% di atas latar penuh
const inner = await sharp(svg, { density: 384 }).resize(410, 410).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: '#5b3df0' } }).composite([{ input: inner, gravity: 'center' }]).png().toFile(`${out}/maskable-512.png`);
