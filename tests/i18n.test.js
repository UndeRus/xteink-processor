import { setupDom } from './helpers/dom.js';
setupDom();
import test from 'node:test';
import assert from 'node:assert/strict';
const { t, setLang, getLang } = await import('../src/i18n.js');

test('default language supported', () => {
  assert.ok(['vi','en','ru'].includes(getLang()));
});

test('setLang switches language', () => {
  setLang('ru');
  assert.equal(getLang(), 'ru');
  assert.equal(t('done.ok'), 'Конвертация завершена');
  setLang('en');
  assert.equal(t('done.ok'), 'Conversion finished');
});
