import test from 'node:test';
import assert from 'node:assert/strict';
const { isArchiveName } = await import('../src/archive.js');

test('isArchiveName detects archives', () => {
  assert.equal(isArchiveName('a.zip'), true);
  assert.equal(isArchiveName('a.rar'), true);
  assert.equal(isArchiveName('a.7z'), true);
  assert.equal(isArchiveName('a.txt'), false);
});
