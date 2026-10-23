import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

export function setupDom() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.CustomEvent = dom.window.CustomEvent;
  globalThis.localStorage = dom.window.localStorage;
  globalThis.URL = dom.window.URL;
  const jszipCode = readFileSync(new URL('../../vendor/jszip.min.js', import.meta.url), 'utf8');
  dom.window.eval(jszipCode);
  globalThis.JSZip = dom.window.JSZip;
  return dom;
}
