// GitHub Pages tidak punya SPA fallback: salin index.html ke 404.html agar deep link (/unduhan) tetap terbuka.
import fs from 'node:fs';
fs.copyFileSync('dist/index.html', 'dist/404.html');
fs.writeFileSync('dist/.nojekyll', '');
console.log('postbuild: 404.html + .nojekyll');
