import { Archive } from '../vendor/libarchive.js';
import { UserError } from './util.js';
import { t } from './i18n.js';

const SUPPORTED_BOOK_EXT = new Set(['epub', 'azw3', 'azw', 'mobi', 'prc', 'txt', 'html', 'htm', 'xhtml', 'fb2']);

function extOfName(name) {
  const m = /\.([A-Za-z0-9]+)$/.exec(name || '');
  return m ? m[1].toLowerCase() : '';
}

export function isArchiveName(name) {
  return /\.(zip|rar|7z|tar|tgz|gz)$/i.test(name || '');
}

let archiveInstance = null;

export async function listArchiveEntries(file) {
  try {
    Archive.init({ workerUrl: 'vendor/worker-bundle.js' });
  } catch { /* already initialized */ }
  try {
    archiveInstance = await Archive.open(file);
  } catch {
    throw new UserError(t('err.archive.broken'));
  }
  const all = await archiveInstance.getFilesArray();
  const entries = all
    .map(e => ({ path: e.path, name: (e.file && e.file.name) || e.path.split('/').pop(), size: e.file && e.file.size, file: e.file }))
    .filter(e => SUPPORTED_BOOK_EXT.has(extOfName(e.name)));
  if (!entries.length) {
    try { await archiveInstance.close(); } catch { /* ignore */ }
    archiveInstance = null;
    throw new UserError(t('err.archive.none'));
  }
  return entries;
}

export async function extractArchiveEntry(entry) {
  if (!archiveInstance) throw new UserError(t('err.archive.broken'));
  try {
    const f = await entry.file.extract();
    const name = entry.name || (entry.path && entry.path.split('/').pop()) || 'book';
    return new File([await f.arrayBuffer()], name, { type: f.type || 'application/octet-stream' });
  } catch {
    throw new UserError(t('err.archive.broken'));
  }
}

export async function closeArchive() {
  if (archiveInstance) {
    try { await archiveInstance.close(); } catch { /* ignore */ }
    archiveInstance = null;
  }
}
