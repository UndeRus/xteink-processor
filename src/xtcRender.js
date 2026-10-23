import { encodeXtg, encodeXth } from './xtcCodec.js';
const W = 528;
const H = 792;

function getCanvas() {
  if (typeof OffscreenCanvas !== 'undefined') {
    const c = new OffscreenCanvas(W, H);
    const ctx = c.getContext('2d');
    if (ctx) return { canvas: c, ctx };
  }
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    if (ctx) return { canvas: c, ctx };
  }
  // Fallback for environments without canvas (e.g. jsdom tests): blank white page.
  const ctx = {
    fillStyle: '#ffffff',
    font: '',
    textBaseline: 'alphabetic',
    fillRect() {},
    fillText() {},
    measureText(t) { return { width: (t || '').length * 8 }; },
    getImageData(x, y, w, h) {
      const data = new Uint8ClampedArray(w * h * 4);
      for (let i = 0; i < data.length; i += 4) { data[i] = 255; data[i+1] = 255; data[i+2] = 255; data[i+3] = 255; }
      return { data, width: w, height: h };
    },
  };
  return { canvas: null, ctx };
}

function wrapText(ctx, text, maxWidth) {
  const words = (text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width <= maxWidth) {
      line = test;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (!lines.length && text) lines.push(text);
  return lines;
}

export async function renderXtcPages(chapters, opts, grayscale) {
  const { canvas, ctx } = getCanvas();
  const fontSize = opts.fontSize || 20;
  const lineHeight = Math.round(fontSize * (opts.lineHeight || 1.4));
  const titleSize = Math.round(fontSize * 1.3);
  const titleLineHeight = Math.round(titleSize * 1.3);
  const marginTop = opts.marginTop || 40;
  const marginBottom = opts.marginBottom || 40;
  const marginLeft = opts.marginLeft || 32;
  const marginRight = opts.marginRight || 32;
  const contentWidth = W - marginLeft - marginRight;
  const fontFamily = opts.fontFamily || 'serif';
  const paraGap = Math.round(lineHeight * 0.6);

  const encodedPages = [];
  let y = marginTop + fontSize;

  function finishPage() {
    const img = ctx.getImageData(0, 0, W, H);
    const d = img.data;
    const pixels = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) {
      const r = d[i * 4];
      const g = d[i * 4 + 1];
      const b = d[i * 4 + 2];
      const gray = (r * 299 + g * 587 + b * 114) / 1000;
      if (grayscale) {
        if (gray >= 200) pixels[i] = 0;
        else if (gray >= 128) pixels[i] = 2;
        else if (gray >= 64) pixels[i] = 1;
        else pixels[i] = 3;
      } else {
        pixels[i] = gray < 128 ? 0 : 1;
      }
    }
    const enc = grayscale
      ? encodeXth(W, H, pixels)
      : encodeXtg(W, H, pixels);
    encodedPages.push(enc);
    // clear
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    y = marginTop + fontSize;
  }

  function ensureSpace(needed) {
    if (y + needed > H - marginBottom + fontSize) {
      finishPage();
    }
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#000000';
  ctx.textBaseline = 'alphabetic';

  for (const ch of chapters) {
    // new page for chapter title
    if (y !== marginTop + fontSize) finishPage();
    ctx.font = `bold ${titleSize}px ${fontFamily}`;
    const titleLines = wrapText(ctx, ch.title || '', contentWidth);
    for (const line of titleLines) {
      ensureSpace(titleLineHeight);
      ctx.fillText(line, marginLeft, y);
      y += titleLineHeight;
    }
    y += paraGap;

    ctx.font = `${fontSize}px ${fontFamily}`;
    for (const para of ch.paras || []) {
      const lines = wrapText(ctx, para, contentWidth);
      for (const line of lines) {
        ensureSpace(lineHeight);
        ctx.fillText(line, marginLeft, y);
        y += lineHeight;
      }
      y += paraGap;
    }
    y += lineHeight;
  }

  // finish last page if has content
  // detect if page has any non-white? We'll always finish if y > start
  finishPage();

  return encodedPages;
}