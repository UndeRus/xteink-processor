import { renderXtcPages } from './xtcRender.js';
import { buildXtc } from './xtcWriter.js';
import { cleanText } from './util.js';

export async function buildXtcBlob(book, chapters, opts, grayscale) {
  const pages = await renderXtcPages(chapters, opts, grayscale);
  const title = cleanText(book.meta.title || '') || book.fallbackTitle || '';
  const author = (book.meta.author || []).filter(Boolean).join(', ');
  const language = book.meta.language || '';
  const data = buildXtc(pages, { title, author, language, chapters: [], grayscale });
  const ext = grayscale ? 'xtch' : 'xtc';
  const mime = 'application/octet-stream';
  return { blob: new Blob([data], { type: mime }), filename: `${title || 'book'}.${ext}`.replace(/\s+/g, ' '), chapters: chapters.length, pages: pages.length };
}