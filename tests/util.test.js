import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanText, safeFileName, baseName, extOf, resolvePath, looksLikeChapterTitle } from '../src/util.js';
import { decodeText, splitTxt } from '../src/readers/txt.js';

test('cleanText normalizes spaces', () => {
  assert.equal(cleanText('Hello   world'), 'Hello world');
});

test('baseName strips extension', () => {
  assert.equal(baseName('foo/bar/baz.epub'), 'baz');
});

test('extOf returns lowercased extension', () => {
  assert.equal(extOf('Book.PDF'), 'pdf');
  assert.equal(extOf('noext'), '');
});

test('resolvePath resolves relative paths', () => {
  assert.equal(resolvePath('OEBPS/text/ch.xhtml', '../images/cover.jpg'), 'OEBPS/images/cover.jpg');
});

test('looksLikeChapterTitle detects chapter', () => {
  assert.equal(looksLikeChapterTitle('Chapter 1'), true);
  assert.equal(looksLikeChapterTitle('Глава 2'), true);
  assert.equal(looksLikeChapterTitle('This is a long sentence.'), false);
});

test('decodeText handles utf-8', () => {
  const bytes = new TextEncoder().encode('Привет');
  assert.equal(decodeText(bytes), 'Привет');
});

test('splitTxt splits paragraphs', () => {
  const blocks = splitTxt('Hello\n\nWorld');
  assert.equal(blocks.length, 2);
});
