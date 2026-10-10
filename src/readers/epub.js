// Đọc EPUB: spine theo OPF, TOC từ NCX/nav, tìm ảnh bìa.
import { UserError, decodeMarkup, parseXml, parseMarkup, resolvePath, tick, baseName } from '../util.js';

const MIME_BY_EXT = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
  webp: 'image/webp', svg: 'image/svg+xml', bmp: 'image/bmp',
};
const isImagePath = p => /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(p);
const isMarkupType = (type, path) =>
  /x?html/.test(type || '') || /\.(x?html?|xml)$/i.test(path);

const byLocalName = (root, name) =>
  Array.from(root.getElementsByTagName('*')).filter(e => e.localName === name);
const attrLocal = (el, name) => {
  for (const a of el.attributes) if (a.localName === name) return a.value;
  return null;
};

export async function readEpub(file, report) {
  const JSZip = globalThis.JSZip;
  let zip;
  try {
    zip = await JSZip.loadAsync(await file.arrayBuffer());
  } catch {
    throw new UserError('Tệp EPUB bị hỏng hoặc không phải là tệp ZIP hợp lệ.');
  }
  const names = Object.keys(zip.files);
  const lookup = new Map(names.map(n => [n.toLowerCase(), n]));
  const getFile = p => zip.file(p) || (lookup.has(p.toLowerCase()) ? zip.file(lookup.get(p.toLowerCase())) : null);
  const readText = async p => {
    const f = getFile(p);
    return f ? decodeMarkup(await f.async('uint8array')) : null;
  };

  if (names.some(n => /META-INF\/encryption\.xml$/i.test(n))) {
    const enc = await readText('META-INF/encryption.xml');
    if (enc && /EncryptionMethod/i.test(enc) && !/IDPF\.org\/2008\/embedding|obfuscation/i.test(enc)) {
      throw new UserError('Sách này được bảo vệ bản quyền (DRM) nên không thể chuyển đổi.');
    }
  }

  // --- OPF
  let opfPath = null;
  const containerXml = await readText('META-INF/container.xml');
  if (containerXml) {
    const c = parseXml(containerXml);
    const rf = c && byLocalName(c, 'rootfile')[0];
    if (rf) opfPath = rf.getAttribute('full-path');
  }
  if (!opfPath) opfPath = names.find(n => /\.opf$/i.test(n));
  if (!opfPath) throw new UserError('Không tìm thấy nội dung sách trong tệp EPUB.');
  const opfText = await readText(opfPath);
  const opf = opfText && parseXml(opfText);
  if (!opf) throw new UserError('Tệp EPUB có phần mô tả (OPF) bị lỗi.');

  const manifest = new Map();
  for (const it of byLocalName(opf, 'item')) {
    const href = it.getAttribute('href');
    if (!href) continue;
    manifest.set(it.getAttribute('id'), {
      id: it.getAttribute('id'),
      path: resolvePath(opfPath, href),
      type: it.getAttribute('media-type') || '',
      props: (it.getAttribute('properties') || '').split(/\s+/),
    });
  }

  // --- metadata
  const dc = name => byLocalName(opf, name).map(e => e.textContent.trim()).filter(Boolean);
  const meta = {
    title: dc('title')[0] || '',
    author: dc('creator'),
    language: dc('language')[0] || '',
  };

  // --- spine
  const spineEl = byLocalName(opf, 'spine')[0];
  let refs = spineEl ? byLocalName(spineEl, 'itemref') : [];
  let items = refs.map(r => ({ item: manifest.get(r.getAttribute('idref')), linear: r.getAttribute('linear') !== 'no' }))
    .filter(x => x.item && isMarkupType(x.item.type, x.item.path));
  const linearItems = items.filter(x => x.linear);
  if (linearItems.length) items = linearItems;
  if (!items.length) throw new UserError('Sách EPUB không có nội dung để chuyển đổi.');

  // --- trang mục lục trong nội dung
  const tocDocHrefs = new Set();
  const guideRefs = byLocalName(opf, 'reference');
  for (const g of guideRefs) {
    if ((g.getAttribute('type') || '').toLowerCase() === 'toc' && g.getAttribute('href')) {
      tocDocHrefs.add(resolvePath(opfPath, g.getAttribute('href')));
    }
  }

  // --- TOC
  let toc = [];
  const ncxId = spineEl && spineEl.getAttribute('toc');
  const ncxItem = (ncxId && manifest.get(ncxId))
    || [...manifest.values()].find(m => m.type === 'application/x-dtbncx+xml')
    || [...manifest.values()].find(m => /\.ncx$/i.test(m.path));
  if (ncxItem) {
    const t = await readText(ncxItem.path);
    const d = t && parseXml(t);
    const map = d && byLocalName(d, 'navMap')[0];
    if (map) toc = parseNcx(map, ncxItem.path, 0);
  }
  const navItem = [...manifest.values()].find(m => m.props.includes('nav'));
  if (navItem) {
    tocDocHrefs.add(navItem.path);
    if (toc.length < 2) {
      const t = await readText(navItem.path);
      const d = t && parseMarkup(t);
      if (d) toc = parseNav(d, navItem.path);
    }
  }

  // --- đọc từng tài liệu
  const docs = [];
  let i = 0;
  for (const { item } of items) {
    const text = await readText(item.path);
    i++;
    if (text == null) continue;
    docs.push({ href: item.path, doc: parseMarkup(text) });
    if (i % 8 === 0) { report && report(`Đang đọc nội dung (${i}/${items.length})…`, i / items.length); await tick(); }
  }

  // --- bìa
  const cover = await findCover({ opf, manifest, getFile, opfPath, guideRefs, docs });

  return { meta, cover, docs, toc, tocDocHrefs, fallbackTitle: baseName(file.name) };
}

function parseNcx(navMap, ncxPath, level) {
  const out = [];
  for (const child of navMap.children) {
    if (child.localName !== 'navPoint') continue;
    const label = byLocalName(child, 'text')[0];
    const content = Array.from(child.children).find(c => c.localName === 'content');
    const title = label ? label.textContent : '';
    const src = content && content.getAttribute('src');
    if (src) {
      const hash = src.indexOf('#');
      const path = resolvePath(ncxPath, src);
      out.push({ title, href: hash >= 0 ? `${path}${src.slice(hash)}` : path, level });
    }
    out.push(...parseNcx(child, ncxPath, level + 1));
  }
  return out;
}

function parseNav(doc, navPath) {
  const navs = byLocalName(doc, 'nav');
  const tocNav = navs.find(n => (attrLocal(n, 'type') || '').split(/\s+/).includes('toc')) || navs[0];
  if (!tocNav) return [];
  const out = [];
  const walk = (ol, level) => {
    for (const li of Array.from(ol.children).filter(c => c.localName === 'li')) {
      const a = Array.from(li.children).find(c => c.localName === 'a');
      const span = Array.from(li.children).find(c => c.localName === 'span');
      const href = a && a.getAttribute('href');
      if (href && !/^[a-z][a-z0-9+.-]*:/i.test(href)) {
        const hash = href.indexOf('#');
        const path = hash === 0 ? navPath : resolvePath(navPath, href);
        out.push({ title: a.textContent, href: hash >= 0 ? `${path}${href.slice(hash)}` : path, level });
      } else if (span && href == null) {
        // mục không có link
      }
      for (const sub of Array.from(li.children).filter(c => c.localName === 'ol')) walk(sub, level + 1);
    }
  };
  const ol = Array.from(tocNav.children).find(c => c.localName === 'ol') || byLocalName(tocNav, 'ol')[0];
  if (ol) walk(ol, 0);
  return out;
}

async function blobOf(getFile, path) {
  const f = getFile(path);
  if (!f) return null;
  const ext = (/\.([a-z0-9]+)$/i.exec(path) || [])[1]?.toLowerCase();
  return new Blob([await f.async('uint8array')], { type: MIME_BY_EXT[ext] || 'application/octet-stream' });
}

async function findCover({ opf, manifest, getFile, opfPath, guideRefs, docs }) {
  const candidates = [];
  const images = [...manifest.values()].filter(m => /^image\//.test(m.type) || isImagePath(m.path));
  // 1. properties="cover-image"
  for (const m of images) if (m.props.includes('cover-image')) candidates.push(m.path);
  // 2. <meta name="cover" content="id">
  for (const m of byLocalName(opf, 'meta')) {
    if ((m.getAttribute('name') || '').toLowerCase() === 'cover') {
      const it = manifest.get(m.getAttribute('content'));
      if (it && (/^image\//.test(it.type) || isImagePath(it.path))) candidates.push(it.path);
      else if (it && isMarkupType(it.type, it.path)) {
        const img = await firstImageOfPage(getFile, it.path);
        if (img) candidates.push(img);
      }
    }
  }
  // 3. guide type="cover"
  for (const g of guideRefs) {
    if ((g.getAttribute('type') || '').toLowerCase() === 'cover' && g.getAttribute('href')) {
      const p = resolvePath(opfPath, g.getAttribute('href'));
      if (isImagePath(p)) candidates.push(p);
      else {
        const img = await firstImageOfPage(getFile, p);
        if (img) candidates.push(img);
      }
    }
  }
  // 4. id / tên file chứa "cover"
  for (const m of images) {
    if (/cover/i.test(m.id || '') || /cover/i.test(m.path.split('/').pop())) candidates.push(m.path);
  }
  for (const p of candidates) {
    const blob = await blobOf(getFile, p);
    if (blob && blob.size > 0) return blob;
  }
  return null;
}

async function firstImageOfPage(getFile, pagePath) {
  const f = getFile(pagePath);
  if (!f) return null;
  const text = decodeMarkup(await f.async('uint8array'));
  const m = /<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/i.exec(text)
    || /<image\b[^>]*?\b(?:xlink:)?href\s*=\s*["']([^"']+)["']/i.exec(text);
  return m ? resolvePath(pagePath, m[1]) : null;
}
