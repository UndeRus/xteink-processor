import { setupDom } from './helpers/dom.js';
setupDom();
import test from 'node:test';
import assert from 'node:assert/strict';
const { normalize } = await import('../src/normalize.js');

test('normalize produces chapters from headings', async () => {
  const doc = document.implementation.createHTMLDocument('t');
  const h = doc.createElement('h1'); h.textContent = 'Chapter 1'; doc.body.append(h);
  const p = doc.createElement('p'); p.textContent = 'Hello world.'; doc.body.append(p);
  const book = { meta: { title: 'Book' }, docs: [{ href: 'a.html', doc }], toc: [], tocDocHrefs: new Set(), fallbackTitle: 'Book' };
  const chapters = await normalize(book, () => {});
  assert.equal(chapters.length, 1);
  assert.equal(chapters[0].title, 'Chapter 1');
  assert.deepEqual(chapters[0].paras, ['Hello world.']);
});
