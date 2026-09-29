// Menyintesis lagu demo (WAV di memori -> MP3 via lamejs), lirik LRC, dan public/catalog.json.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { tracks } from './tracks.mjs';
const require = createRequire(import.meta.url);
import vm from 'node:vm';
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(require.resolve('lamejs/lame.all.js'), 'utf8'), ctx);
const lamejs = ctx.lamejs;

const SR = 22050;
const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], harmonic: [0, 2, 3, 5, 7, 8, 11] };
const PROG = [0, 5, 3, 4]; // i - VI - iv - v (derajat 0-based dalam tangga nada)
const hz = (m) => 440 * 2 ** ((m - 69) / 12);
let seed = 1; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

function osc(wave, ph) {
  const f = ph - Math.floor(ph);
  switch (wave) {
    case 'sine': return Math.sin(2 * Math.PI * f);
    case 'square': return f < 0.5 ? 0.6 : -0.6;
    case 'sawtooth': return (2 * f - 1) * 0.7;
    case 'triangle': return 4 * Math.abs(f - 0.5) - 1;
    case 'string': return 0.6 * Math.sin(2 * Math.PI * f) + 0.3 * Math.sin(4 * Math.PI * f) + 0.15 * Math.sin(6 * Math.PI * f);
    default: return Math.sin(2 * Math.PI * f) * 0.7 + Math.sin(4 * Math.PI * f) * 0.25; // pluck
  }
}

function render(t) {
  seed = 7;
  const beat = 60 / t.bpm, bar = beat * 4;
  const bars = 2 + t.lyrics.length * 2;
  const total = Math.ceil((bars * bar + 1.5) * SR);
  const out = new Float32Array(total);
  const scale = SCALES[t.mode];
  const deg = (d) => t.root + scale[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7);
  const note = (start, dur, midi, wave, vol, att = 0.01, rel = 0.25) => {
    const f = hz(midi), s0 = Math.floor(start * SR), n = Math.floor((dur + rel) * SR);
    for (let i = 0; i < n && s0 + i < total; i++) {
      const tt = i / SR;
      let env = Math.min(1, tt / att) * (tt < dur ? 1 : Math.max(0, 1 - (tt - dur) / rel));
      if (wave === 'pluck') env *= Math.exp(-tt * 3.2);
      out[s0 + i] += osc(wave, f * tt) * env * vol;
    }
  };
  const drum = (start, kind) => {
    const s0 = Math.floor(start * SR), n = Math.floor((kind === 'kick' ? 0.18 : 0.06) * SR);
    for (let i = 0; i < n && s0 + i < total; i++) {
      const tt = i / SR;
      out[s0 + i] += kind === 'kick'
        ? Math.sin(2 * Math.PI * (110 * tt - 400 * tt * tt * 0.5 + 40 * tt)) * Math.exp(-tt * 22) * 0.55
        : rnd() * Math.exp(-tt * (kind === 'snare' ? 40 : 90)) * (kind === 'snare' ? 0.25 : 0.1);
    }
  };
  for (let b = 0; b < bars; b++) {
    const t0 = b * bar, root = PROG[b % 4];
    const chord = [root, root + 2, root + 4];
    chord.forEach((d) => note(t0, bar * 0.98, deg(d) + 12, t.wave === 'pluck' ? 'triangle' : t.wave === 'sawtooth' ? 'triangle' : t.wave, 0.07, 0.12, 0.4));
    note(t0, beat * 1.9, deg(root) - 12, 'sine', 0.3); note(t0 + beat * 2, beat * 1.9, deg(root + (t.drums === 'four' ? 0 : 4)) - 12, 'sine', 0.26);
    if (b >= 2) { // melodi
      const pat = [4, 6, 5, 7, 6, 4, 2, 4];
      for (let i = 0; i < 8; i++) note(t0 + i * beat * 0.5, beat * 0.45, deg(chord[i % 3] + (pat[(i + b) % 8] > 5 ? 7 : 0)) + 12, t.wave === 'pluck' ? 'pluck' : 'triangle', 0.09, 0.005, 0.15);
    }
    if (t.wave === 'pluck') for (let i = 0; i < 8; i++) note(t0 + i * beat * 0.5, beat, deg(chord[i % 3]), 'pluck', 0.12);
    const D = t.drums;
    for (let i = 0; i < 4 && D !== 'none'; i++) {
      const at = t0 + i * beat;
      if (D === 'four' || (D !== 'swing' && D !== 'dangdut' && i % 2 === 0) || (D === 'dangdut' && i === 0)) drum(at, 'kick');
      if ((i % 2 === 1 && D !== 'four' && D !== 'swing') || (D === 'dangdut' && i === 2)) drum(at, 'snare');
      if (D === 'four' || D === 'pop' || D === 'rock') drum(at + beat / 2, 'hat'); else if (D === 'soft' || D === 'swing') drum(at + (D === 'swing' ? beat * 0.66 : beat / 2), 'hat');
    }
  }
  let peak = 0; for (let i = 0; i < total; i++) peak = Math.max(peak, Math.abs(out[i]));
  const fade = SR * 1.2; for (let i = 0; i < fade; i++) out[total - 1 - i] *= i / fade;
  const pcm = new Int16Array(total); for (let i = 0; i < total; i++) pcm[i] = Math.max(-1, Math.min(1, (out[i] / peak) * 0.85)) * 32767;
  return { pcm, dur: total / SR, bar };
}

function mp3(pcm) {
  const enc = new lamejs.Mp3Encoder(1, SR, 64), chunks = [];
  for (let i = 0; i < pcm.length; i += 1152) { const b = enc.encodeBuffer(pcm.subarray(i, i + 1152)); if (b.length) chunks.push(Buffer.from(b)); }
  const e = enc.flush(); if (e.length) chunks.push(Buffer.from(e));
  return Buffer.concat(chunks);
}
const stamp = (s) => `[${String(Math.floor(s / 60)).padStart(2, '0')}:${(s % 60).toFixed(2).padStart(5, '0')}]`;

const catalog = [];
for (const t of tracks) {
  const { pcm, dur, bar } = render(t);
  const buf = mp3(pcm);
  fs.writeFileSync(`public/audio/${t.id}.mp3`, buf);
  const lrc = [`[ti:${t.title}]`, `[ar:${t.artist}]`, ...t.lyrics.map((l, i) => `${stamp(bar * 2 + i * bar * 2)}${l}`)].join('\n') + '\n';
  fs.writeFileSync(`public/lyrics/${t.id}.lrc`, lrc);
  catalog.push({ id: t.id, title: t.title, artist: t.artist, album: t.album, genre: t.genre, duration: Math.round(dur), audio: `audio/${t.id}.mp3`, lyrics: `lyrics/${t.id}.lrc`, size: buf.length });
  console.log(t.id, Math.round(dur) + 's', (buf.length / 1024).toFixed(0) + 'KB');
}
fs.writeFileSync('public/catalog.json', JSON.stringify({ version: 1, tracks: catalog }, null, 1));
