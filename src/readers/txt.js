// Đọc TXT: dò encoding, dòng trống tách đoạn, regex tựa chương.
import { UserError, baseName, cleanText, looksLikeChapterTitle } from '../util.js';

export function decodeText(bytes) {
  if (bytes[0] === 0xFF && bytes[1] === 0xFE) return new TextDecoder('utf-16le').decode(bytes.subarray(2));
  if (bytes[0] === 0xFE && bytes[1] === 0xFF) return new TextDecoder('utf-16be').decode(bytes.subarray(2));
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^﻿/, '');
  } catch { /* thử encoding tiếp theo */ }
  for (const label of ['windows-1258', 'windows-1252']) {
    try {
      return new TextDecoder(label).decode(bytes);
    } catch { /* thử tiếp */ }
  }
  return new TextDecoder('utf-8').decode(bytes);
}

/** Trả về mảng khối {h: boolean, text} từ văn bản thuần. */
export function splitTxt(raw) {
  const text = raw.normalize('NFC').replace(/\r\n?/g, '\n');
  const lines = text.split('\n');
  // Xác định kiểu: dòng trống phân đoạn hay mỗi dòng là một đoạn.
  let blank = 0, nonBlank = 0;
  for (const l of lines) (l.trim() ? nonBlank++ : blank++);
  const blocks = blank ? nonBlank / (blank + 1) : nonBlank;
  const lineMode = blocks > 8; // gần như không có dòng trống -> mỗi dòng một đoạn

  const out = [];
  let cur = [];
  const flush = () => {
    if (cur.length) {
      const t = cleanText(cur.join(' '));
      if (t) out.push({ h: false, text: t });
      cur = [];
    }
  };
  for (const line of lines) {
    const t = line.trim();
    if (!t) { flush(); continue; }
    if (t.length <= 110 && looksLikeChapterTitle(t)) {
      flush();
      out.push({ h: true, text: cleanText(t) });
      continue;
    }
    if (lineMode) { cur = [t]; flush(); } else cur.push(t);
  }
  flush();
  return out;
}

export async function readTxt(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const blocks = splitTxt(decodeText(bytes));
  if (!blocks.length) throw new UserError('Tệp văn bản trống.');
  const doc = document.implementation.createHTMLDocument('');
  for (const b of blocks) {
    const el = doc.createElement(b.h ? 'h1' : 'p');
    el.textContent = b.text;
    doc.body.append(el);
  }
  const title = baseName(file.name);
  return { meta: { title }, cover: null, docs: [{ href: 'text.txt', doc }], toc: [], tocDocHrefs: new Set(), fallbackTitle: title };
}
