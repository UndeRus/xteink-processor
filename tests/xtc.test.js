import { setupDom } from './helpers/dom.js';
setupDom();
import test from 'node:test';
import assert from 'node:assert/strict';
const { encodeXtg, encodeXth, XTG_MAGIC, XTH_MAGIC } = await import('../src/xtcCodec.js');
const { buildXtc } = await import('../src/xtcWriter.js');

test('encodeXtg has correct magic', () => {
  const pixels = new Uint8Array(8 * 8).fill(1);
  const buf = encodeXtg(8, 8, pixels);
  const dv = new DataView(buf.buffer);
  assert.equal(dv.getUint32(0, true), XTG_MAGIC);
  assert.equal(dv.getUint16(4, true), 8);
});

test('encodeXth has correct magic', () => {
  const pixels = new Uint8Array(8 * 8).fill(0);
  const buf = encodeXth(8, 8, pixels);
  const dv = new DataView(buf.buffer);
  assert.equal(dv.getUint32(0, true), XTH_MAGIC);
});

test('buildXtc XTC magic', () => {
  const page = encodeXtg(8, 8, new Uint8Array(64).fill(1));
  const data = buildXtc([page], { title: 'T', grayscale: false });
  const dv = new DataView(data.buffer);
  assert.equal(dv.getUint32(0, true), 0x00435458);
});

test('buildXtc XTCH magic', () => {
  const page = encodeXth(8, 8, new Uint8Array(64).fill(0));
  const data = buildXtc([page], { title: 'T', grayscale: true });
  const dv = new DataView(data.buffer);
  assert.equal(dv.getUint32(0, true), 0x48435458);
});
