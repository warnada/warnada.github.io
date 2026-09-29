export type ShortcutAction = 'toggle' | 'seek-back' | 'seek-forward' | 'next' | 'prev';

/** Ringkasan event keyboard agar pemetaan bisa dites tanpa DOM. */
export interface KeyInfo { key: string; tag: string; inputType: string; editable: boolean; ctrl: boolean; meta: boolean; alt: boolean }

export const SEEK_STEP_SECONDS = 5;

export function keyInfo(e: KeyboardEvent): KeyInfo {
  const el = e.target instanceof HTMLElement ? e.target : null;
  return {
    key: e.key, tag: el?.tagName ?? 'BODY', inputType: el instanceof HTMLInputElement ? el.type : '',
    editable: !!el?.isContentEditable, ctrl: e.ctrlKey, meta: e.metaKey, alt: e.altKey
  };
}

/** null = biarkan perilaku bawaan browser/elemen. */
export function shortcutFor(k: KeyInfo): ShortcutAction | null {
  if (k.ctrl || k.meta || k.alt || k.editable) return null;
  const typing = k.tag === 'TEXTAREA' || k.tag === 'SELECT' || (k.tag === 'INPUT' && k.inputType !== 'range');
  if (typing) return null;
  switch (k.key) {
    case ' ': return k.tag === 'BUTTON' || k.tag === 'A' || k.tag === 'INPUT' ? null : 'toggle';
    case 'ArrowRight': return k.tag === 'INPUT' ? null : 'seek-forward';
    case 'ArrowLeft': return k.tag === 'INPUT' ? null : 'seek-back';
    case 'n': case 'N': return 'next';
    case 'p': case 'P': return 'prev';
    default: return null;
  }
}
