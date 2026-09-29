// Terapkan tema sebelum render pertama supaya tidak berkedip. Nilai divalidasi karena localStorage bukan sumber tepercaya.
try {
  var s = (JSON.parse(localStorage.getItem('warnada:settings') || '{}') || {}).state || {};
  var d = document.documentElement;
  var genres = ['lofi', 'pop', 'rock', 'jazz', 'edm', 'dangdut', 'akustik', 'klasik'];
  if (s.theme === 'light' || s.theme === 'dark') d.dataset.theme = s.theme;
  else if (matchMedia('(prefers-color-scheme: light)').matches) d.dataset.theme = 'light';
  if (genres.indexOf(s.genre) !== -1) d.dataset.genre = s.genre;
} catch { /* pakai bawaan */ }
