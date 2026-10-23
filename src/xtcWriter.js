import { writeU16LE, writeU32LE, writeU64LE } from './xtcCodec.js';

const XTC_MAGIC = 0x00435458;
const XTCH_MAGIC = 0x48435458;

export function buildXtc(pages, { title = '', author = '', language = '', chapters = [], grayscale = false } = {}) {
  const magic = grayscale ? XTCH_MAGIC : XTC_MAGIC;
  const pageCount = pages.length;
  const hasMetadata = 1;
  const hasChapters = chapters && chapters.length ? 1 : 0;
  const hasThumbnails = 0;
  const readDirection = 0;

  // calculate offsets
  const headerSize = 56;
  const metadataSize = 256;
  const chapterSize = 96;
  const indexEntrySize = 16;

  const metadataOffset = headerSize;
  const chapterOffset = hasChapters ? metadataOffset + metadataSize : 0;
  const indexOffset = hasChapters
    ? chapterOffset + chapters.length * chapterSize
    : metadataOffset + metadataSize;
  const indexSize = pageCount * indexEntrySize;
  const dataOffset = indexOffset + indexSize;
  // page data offsets
  let cursor = dataOffset;
  const pageOffsets = [];
  const pageSizes = [];
  for (const p of pages) {
    pageOffsets.push(cursor);
    pageSizes.push(p.length);
    cursor += p.length;
  }
  const totalSize = cursor;

  const out = new Uint8Array(totalSize);
  const dv = new DataView(out.buffer);

  // header
  dv.setUint32(0, magic, true);
  dv.setUint16(4, 0x0100, true);
  dv.setUint16(6, pageCount, true);
  out[8] = readDirection;
  out[9] = hasMetadata;
  out[10] = hasThumbnails;
  out[11] = hasChapters;
  dv.setUint32(12, 0, true); // currentPage
  writeU64LE(out, 16, metadataOffset);
  writeU64LE(out, 24, indexOffset);
  writeU64LE(out, 32, dataOffset);
  writeU64LE(out, 40, 0); // thumbOffset
  writeU64LE(out, 48, chapterOffset);

  // metadata
  const metaOff = metadataOffset;
  const enc = new TextEncoder();
  function putStr(off, str, max) {
    const bytes = enc.encode(str || '');
    const n = Math.min(bytes.length, max - 1);
    out.set(bytes.subarray(0, n), metaOff + off);
  }
  putStr(0, title, 128);
  putStr(128, author, 64);
  putStr(192, '', 32); // publisher
  putStr(224, language || '', 16);
  dv.setUint32(metaOff + 240, Math.floor(Date.now() / 1000), true); // createTime
  dv.setUint16(metaOff + 244, 0, true); // coverPage
  dv.setUint16(metaOff + 246, hasChapters ? chapters.length : 0, true); // chapterCount

  // chapters
  if (hasChapters) {
    let co = chapterOffset;
    for (const ch of chapters) {
      putStrRel(out, co, ch.title || '', 80);
      dv.setUint16(co + 80, ch.startPage || 0, true);
      dv.setUint16(co + 82, ch.endPage || 0, true);
      co += chapterSize;
    }
  }

  // page index table
  let io = indexOffset;
  for (let i = 0; i < pageCount; i++) {
    writeU64LE(out, io, pageOffsets[i]);
    dv.setUint32(io + 8, pageSizes[i], true);
    // width/height from page header
    const pageDv = new DataView(pages[i].buffer);
    const w = pageDv.getUint16(4, true);
    const h = pageDv.getUint16(6, true);
    dv.setUint16(io + 12, w, true);
    dv.setUint16(io + 14, h, true);
    io += indexEntrySize;
  }

  // data area
  for (let i = 0; i < pageCount; i++) {
    out.set(pages[i], pageOffsets[i]);
  }

  return out;
}

function putStrRel(out, off, str, max) {
  const enc = new TextEncoder();
  const bytes = enc.encode(str || '');
  const n = Math.min(bytes.length, max - 1);
  out.set(bytes.subarray(0, n), off);
}