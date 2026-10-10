// Ảnh bìa: fit 528x792 (không phóng to), chuyển xám, JPEG chất lượng 0.4.
export const COVER_W = 528;
export const COVER_H = 792;
export const COVER_QUALITY = 0.4;

/** @returns {Promise<Uint8Array|null>} lỗi thì trả về null (bỏ bìa). */
export async function processCover(blob) {
  try {
    if (!blob || !blob.size) return null;
    const bmp = await createImageBitmap(blob);
    const scale = Math.min(1, COVER_W / bmp.width, COVER_H / bmp.height);
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    let canvas, out;
    if (typeof OffscreenCanvas !== 'undefined') {
      canvas = new OffscreenCanvas(w, h);
    } else {
      canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
    }
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bmp, 0, 0, w, h);
    if (bmp.close) bmp.close();
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const y = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000 | 0;
      d[i] = d[i + 1] = d[i + 2] = y;
    }
    ctx.putImageData(img, 0, 0);
    if (canvas.convertToBlob) {
      out = await canvas.convertToBlob({ type: 'image/jpeg', quality: COVER_QUALITY });
    } else {
      out = await new Promise(r => canvas.toBlob(r, 'image/jpeg', COVER_QUALITY));
    }
    if (!out || !out.size) return null;
    return new Uint8Array(await out.arrayBuffer());
  } catch (e) {
    console.warn('Bỏ qua ảnh bìa:', e);
    return null;
  }
}
