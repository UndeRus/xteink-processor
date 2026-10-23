// Đọc MOBI/AZW/AZW3/KF8/PRC bằng mobi.js của foliate-js.
import { MOBI, isMOBI } from '../../vendor/foliate-mobi.js';
import { UserError, baseName, tick, cleanText } from '../util.js';
import { t } from '../i18n.js';

// DRM message resolved via t('err.mobi.drm') at throw site.

async function precheck(file) {
  const head = new DataView(await file.slice(0, 90).arrayBuffer());
  if (head.byteLength < 90) throw new UserError(t('err.mobi.small'));
  if (!(await isMOBI(file))) {
    throw new UserError(t('err.mobi.unknown'));
  }
  const rec0 = head.getUint32(78);
  const rec = new DataView(await file.slice(rec0, rec0 + 16).arrayBuffer());
  if (rec.byteLength >= 14 && rec.getUint16(12) !== 0) throw new UserError(t('err.mobi.drm'));
}

export async function readMobi(file, report) {
  await precheck(file);
  let book;
  try {
    book = await new MOBI({ unzlib: async x => x }).open(file);
  } catch (e) {
    if (e instanceof UserError) throw e;
    console.warn(e);
    throw new UserError(t('err.mobi.read'));
  }

  const docs = [];
  const sectionDocs = new Map(); // section index -> {href, doc}
  const n = book.sections.length;
  for (let i = 0; i < n; i++) {
    const s = book.sections[i];
    if (!s.createDocument) continue;
    let doc;
    try { doc = await s.createDocument(); } catch (e) { console.warn(e); continue; }
    const entry = { href: `s${String(i).padStart(5, '0')}`, doc };
    docs.push(entry);
    sectionDocs.set(i, entry);
    if (i % 6 === 0) { report && report(`Đang đọc nội dung (${i + 1}/${n})…`, i / n); await tick(); }
  }
  if (!docs.length) throw new UserError(t('err.mobi.nocontent'));

  // TOC: href dạng filepos:N hoặc kindle:pos:... -> doc + id phần tử
  const toc = [];
  let uid = 0;
  const walk = (items, level) => {
    for (const it of items || []) {
      let target = null;
      try {
        const [index, frag] = book.splitTOCHref(it.href);
        const entry = sectionDocs.get(index);
        if (entry) {
          let id = '';
          if (typeof frag === 'string') id = frag;
          else {
            const el = book.getTOCFragment(entry.doc, frag);
            if (el) {
              if (!el.id) el.setAttribute('id', `xt-toc-${uid++}`);
              id = el.id;
            }
          }
          target = `${entry.href}${id ? '#' + id : ''}`;
        }
      } catch (e) { /* bỏ mục hỏng */ }
      if (target) toc.push({ title: it.label || '', href: target, level });
      walk(it.subitems, level + 1);
    }
  };
  walk(book.toc, 0);

  // Trang mục lục trong nội dung (guide type="toc")
  const tocDocHrefs = new Set();
  try {
    for (const l of book.landmarks || []) {
      if (l.type?.includes('toc') && l.href) {
        const [index] = book.splitTOCHref(l.href);
        const entry = sectionDocs.get(index);
        if (entry) tocDocHrefs.add(entry.href);
      }
    }
  } catch { /* bỏ qua */ }

  const m = book.metadata || {};
  const meta = {
    title: cleanText(typeof m.title === 'string' ? m.title : (m.title && Object.values(m.title)[0]) || ''),
    author: (Array.isArray(m.author) ? m.author : m.author ? [m.author] : [])
      .map(a => cleanText(typeof a === 'string' ? a : a?.name || '')).filter(Boolean),
    language: typeof m.language === 'string' ? m.language : (Array.isArray(m.language) ? m.language[0] : ''),
  };
  let cover = null;
  try { cover = (await book.getCover()) || null; } catch { cover = null; }

  return { meta, cover, docs, toc, tocDocHrefs, fallbackTitle: meta.title || baseName(file.name) };
}
