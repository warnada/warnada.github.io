export type WadaMood = 'happy' | 'sing' | 'sleep';

const FUR = '#F2C9A0', SHOULDER = '#E9B98A', PINK = '#F5A3B2', BAND = '#B9AEE8', INK = '#4A3F4B', NOSE = '#E68A98', MUZZLE = '#FFF3E6', STRIPE = '#D9A273', DARK = '#5A4650';
const LABEL: Record<WadaMood, string> = { happy: 'Wada si kucing tersenyum', sing: 'Wada si kucing bernyanyi', sleep: 'Wada si kucing tidur' };

const dot = (x: number) => <path key={x} d={`M${x} 68 L${x} 68.1`} stroke={INK} strokeWidth={8.5} strokeLinecap="round" />;
const arc = (d: string) => <path key={d} d={d} fill="none" stroke={INK} strokeWidth={3.4} strokeLinecap="round" />;

const EYES: Record<WadaMood, React.ReactNode> = {
  happy: [dot(45), dot(75)],
  sing: [arc('M40 69 Q45 62 50 69'), arc('M70 69 Q75 62 80 69')],
  sleep: [arc('M39 67 Q45 73 51 67'), arc('M69 67 Q75 73 81 67')]
};
const MOUTH: Record<WadaMood, React.ReactNode> = {
  happy: <path d="M60 80 L60 83 M54 84 Q57 88 60 83 Q63 88 66 84" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />,
  sing: <ellipse cx="60" cy="88" rx="5" ry="5.5" fill={DARK} />,
  sleep: <path d="M57 84 Q60 87 63 84" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
};

/** Wada, kucing maskot Warnada (karakter orisinal): kepala bulat, telinga runcing, headphone lilac. */
export function Wada({ mood = 'happy', size = 64, bounce = false, className = '' }: { mood?: WadaMood; size?: number; bounce?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={`wada ${bounce ? 'wada--bob' : ''} ${className}`} role="img" aria-label={LABEL[mood]}>
      <path d="M16 114 C16 98 36 94 60 94 C84 94 104 98 104 114Z" fill={SHOULDER} />
      <polygon points="26,54 32,18 56,38" fill={FUR} stroke={FUR} strokeWidth={6} strokeLinejoin="round" />
      <polygon points="94,54 88,18 64,38" fill={FUR} stroke={FUR} strokeWidth={6} strokeLinejoin="round" />
      <polygon points="33,44 35,27 47,37" fill={PINK} stroke={PINK} strokeWidth={3} strokeLinejoin="round" />
      <polygon points="87,44 85,27 73,37" fill={PINK} stroke={PINK} strokeWidth={3} strokeLinejoin="round" />
      <ellipse cx="60" cy="72" rx="43" ry="33" fill={FUR} />
      <path d="M20 72 C18 36 102 36 100 72" fill="none" stroke={BAND} strokeWidth={7} strokeLinecap="round" />
      <path d="M54 48 L54 55 M60 46 L60 55 M66 48 L66 55" stroke={STRIPE} strokeWidth={3} strokeLinecap="round" />
      <ellipse cx="60" cy="83" rx="19" ry="12" fill={MUZZLE} />
      <ellipse cx="18" cy="72" rx="9" ry="14" fill={BAND} />
      <ellipse cx="102" cy="72" rx="9" ry="14" fill={BAND} />
      {EYES[mood]}
      <path d="M56.5 76.5 Q60 74 63.5 76.5 Q60 81 56.5 76.5Z" fill={NOSE} stroke={NOSE} strokeWidth={1.5} strokeLinejoin="round" />
      {MOUTH[mood]}
      <circle cx="46" cy="82" r="1.3" fill="#C9A47E" /><circle cx="43" cy="86" r="1.3" fill="#C9A47E" /><circle cx="74" cy="82" r="1.3" fill="#C9A47E" /><circle cx="77" cy="86" r="1.3" fill="#C9A47E" />
      <ellipse cx="35" cy="81" rx="6" ry="4" fill="#F2A3AE" fillOpacity={0.5} />
      <ellipse cx="85" cy="81" rx="6" ry="4" fill="#F2A3AE" fillOpacity={0.5} />
    </svg>
  );
}
