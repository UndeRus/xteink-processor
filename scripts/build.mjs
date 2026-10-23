import { cpSync, rmSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist');

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

const entries = [
  '.nojekyll',
  'index.html',
  'app.css',
  'app.js',
  'manifest.webmanifest',
  'sw.js',
  'src',
  'vendor',
  'icons',
];

for (const entry of entries) {
  cpSync(join(root, entry), join(dist, entry), { recursive: true });
}

console.log('Build complete:', dist);
