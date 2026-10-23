import { setupDom } from './helpers/dom.js';
setupDom();
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const { convert } = await import('../src/convert.js');

test('convert txt produces epub blob', async () => {
  const buf = readFileSync(new URL('./fixtures/sample.txt', import.meta.url));
  const file = new File([buf], 'sample.txt', { type: 'text/plain' });
  const res = await convert(file, () => {});
  assert.ok(res.blob.size > 0);
  assert.match(res.filename, /\.epub$/);
  assert.ok(res.chapters >= 1);
});
