// Đọc FB2: <section><title> là chương, <binary> chỉ dùng để lấy bìa.
import { UserError, baseName, cleanText, decodeMarkup, parseXml } from '../util.js';
import { t } from '../i18n.js';

const kids = (el, name) => Array.from(el.children).filter(c => c.localName === name);
const first = (root, name) => Array.from(root.getElementsByTagName('*')).find(e => e.localName === name);
const all = (root, name) => Array.from(root.getElementsByTagName('*')).filter(e => e.localName === name);

export async function readFb2(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const xml = parseXml(decodeMarkup(bytes));
  if (!xml || xml.documentElement.localName !== 'FictionBook') {
    throw new UserError(t('err.fb2.invalid'));
  }
  const root = xml.documentElement;
  const titleInfo = first(root, 'title-info');
  const meta = { title: '', author: [], language: '' };
  if (titleInfo) {
    meta.title = cleanText(first(titleInfo, 'book-title')?.textContent || '');
    meta.language = cleanText(first(titleInfo, 'lang')?.textContent || '');
    for (const a of kids(titleInfo, 'author')) {
      const n = ['first-name', 'middle-name', 'last-name']
        .map(k => cleanText(first(a, k)?.textContent || '')).filter(Boolean).join(' ');
      if (n) meta.author.push(n);
    }
  }

  const out = document.implementation.createHTMLDocument('');
  const add = (tag, text) => {
    const t = cleanText(text);
    if (!t) return;
    const el = out.createElement(tag);
    el.textContent = t;
    out.body.append(el);
  };
  const blockText = (el) => {
    for (const c of el.children) {
      const n = c.localName;
      if (n === 'p' || n === 'v' || n === 'subtitle' || n === 'text-author') add('p', c.textContent);
      else if (n === 'empty-line' || n === 'image') continue;
      else if (n === 'title') add('p', c.textContent);
      else blockText(c); // epigraph, poem, stanza, cite, annotation, table...
    }
  };
  const walk = (sec) => {
    const title = kids(sec, 'title')[0];
    if (title) add('h1', Array.from(title.children).map(p => p.textContent).join(' ') || title.textContent);
    for (const c of sec.children) {
      const n = c.localName;
      if (n === 'section') walk(c);
      else if (n === 'title' || n === 'image' || n === 'empty-line') continue;
      else if (n === 'p' || n === 'subtitle' || n === 'text-author' || n === 'v') add('p', c.textContent);
      else blockText(c);
    }
  };
  for (const body of kids(root, 'body')) {
    if (body.getAttribute('name') === 'notes') continue;
    for (const c of body.children) {
      if (c.localName === 'section') walk(c);
      else if (c.localName === 'epigraph') blockText(c);
    }
  }
  if (!out.body.textContent.trim()) throw new UserError(t('err.fb2.empty'));

  // bìa
  let cover = null;
  try {
    const img = first(first(titleInfo || root, 'coverpage') || root, 'image');
    const ref = img && Array.from(img.attributes).find(a => a.localName === 'href')?.value;
    if (ref) {
      const id = ref.replace(/^#/, '');
      const bin = all(root, 'binary').find(b => b.getAttribute('id') === id);
      if (bin) {
        const b64 = bin.textContent.replace(/\s+/g, '');
        const raw = atob(b64);
        const arr = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
        cover = new Blob([arr], { type: bin.getAttribute('content-type') || 'image/jpeg' });
      }
    }
  } catch { cover = null; }

  return { meta, cover, docs: [{ href: 'book.fb2', doc: out }], toc: [], tocDocHrefs: new Set(), fallbackTitle: meta.title || baseName(file.name) };
}
