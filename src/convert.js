// Điều phối: file -> reader -> normalize -> cover -> writer.
import { UserError, extOf, baseName, cleanText, safeFileName } from './util.js';
import { normalize } from './normalize.js';
import { processCover } from './cover.js';
import { writeEpub } from './writer.js';
import { t } from './i18n.js';

export const SUPPORTED = ['epub', 'azw3', 'azw', 'mobi', 'prc', 'txt', 'html', 'htm', 'xhtml', 'fb2'];

async function readerFor(ext) {
  switch (ext) {
    case 'epub': return (await import('./readers/epub.js')).readEpub;
    case 'mobi': case 'azw': case 'azw3': case 'prc': return (await import('./readers/mobi.js')).readMobi;
    case 'fb2': return (await import('./readers/fb2.js')).readFb2;
    case 'html': case 'htm': case 'xhtml': return (await import('./readers/html.js')).readHtml;
    case 'txt': return (await import('./readers/txt.js')).readTxt;
    default:
      throw new UserError(t('err.unsupported', { ext }));
  }
}

/** @returns {Promise<{blob:Blob, filename:string, chapters:number, hasCover:boolean}>} */
export async function convert(file, report = () => {}) {
  const ext = extOf(file.name);
  report(t('conv.reading'), 0.02);
  const read = await readerFor(ext);
  const book = await read(file, (msg, f) => report(msg, 0.05 + 0.4 * (f || 0)));
  report(t('conv.processing'), 0.5);
  const chapters = await normalize(book, (msg, f) => report(msg, 0.5 + 0.3 * (f || 0)));
  report(t('conv.cover'), 0.85);
  const cover = await processCover(book.cover);
  report(t('conv.packaging'), 0.92);
  const title = cleanText(book.meta.title || '') || baseName(file.name);
  const blob = await writeEpub({ ...book.meta, title }, chapters, cover);
  report(t('conv.done'), 1);
  const author = safeFileName((book.meta.author || []).filter(Boolean).join(', '));
  const name = [safeFileName(title) || safeFileName(baseName(file.name)) || 'ebook', author, 'xte'].filter(Boolean).join(' - ');
  return { blob, filename: `${name}.epub`, chapters: chapters.length, hasCover: !!cover };
}
