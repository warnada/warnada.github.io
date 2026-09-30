// Terapkan tema sebelum render pertama supaya tidak berkedip. Nilai divalidasi karena localStorage bukan sumber tepercaya.
try {
  var s = (JSON.parse(localStorage.getItem('warnada:settings') || '{}') || {}).state || {};
  var d = document.documentElement;
  var accents = ['lilac', 'sage', 'peach', 'sky', 'rose', 'butter'];
  if (s.theme === 'light' || s.theme === 'dark') d.dataset.theme = s.theme;
  else if (matchMedia('(prefers-color-scheme: light)').matches) d.dataset.theme = 'light';
  if (accents.indexOf(s.accent) !== -1) d.dataset.accent = s.accent;
} catch { /* pakai bawaan */ }
