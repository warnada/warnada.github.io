export type Repeat = 'off' | 'all' | 'one';

export interface QueueContext {
  queue: string[];
  currentId: string | null;
  shuffle: boolean;
  repeat: Repeat;
  /** true bila dipicu oleh lagu yang selesai (bukan tombol berikutnya/sebelumnya) */
  auto: boolean;
  isPlayable: (id: string) => boolean;
  random: () => number;
}

export type QueueDecision = { type: 'play'; id: string } | { type: 'restart' } | { type: 'stop' };

/** Aturan pemilihan lagu berikutnya — murni, tanpa <audio>, supaya mudah dites. */
export function pickNext(ctx: QueueContext, dir: 1 | -1): QueueDecision {
  const { currentId, shuffle, repeat, auto } = ctx;
  const playable = ctx.queue.filter(ctx.isPlayable);
  if (!currentId || !playable.length) return { type: 'stop' };
  if (auto && repeat === 'one') return { type: 'restart' };

  if (shuffle && playable.length > 1) {
    const pool = playable.filter((id) => id !== currentId);
    return { type: 'play', id: pool[Math.floor(ctx.random() * pool.length)] };
  }
  const i = playable.indexOf(currentId);
  if (auto && repeat === 'off' && dir === 1 && i === playable.length - 1) return { type: 'stop' };
  return { type: 'play', id: playable[(i + dir + playable.length) % playable.length] };
}
