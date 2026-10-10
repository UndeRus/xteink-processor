// Đọc HTML đơn lẻ: một tài liệu, chương lấy từ heading hoặc regex.
import { UserError, baseName, decodeMarkup } from '../util.js';

export async function readHtml(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^﻿/, '');
  } catch {
    // Không phải UTF-8: ưu tiên charset khai báo, nếu không có thì windows-1258.
    text = decodeMarkup(bytes);
    if (!/charset|encoding/i.test(new TextDecoder('latin1').decode(bytes.subarray(0, 1024)))) {
      text = new TextDecoder('windows-1258').decode(bytes);
    }
  }
  const doc = new DOMParser().parseFromString(text, 'text/html');
  if (!doc.body || !doc.body.textContent.trim()) throw new UserError('Tệp HTML không có nội dung.');
  const title = (doc.title || '').trim() || baseName(file.name);
  return { meta: { title }, cover: null, docs: [{ href: 'index.html', doc }], toc: [], tocDocHrefs: new Set(), fallbackTitle: title };
}
