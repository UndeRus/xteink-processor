export const XTC_MAGIC = 0x00435458;
export const XTCH_MAGIC = 0x48435458;
export const XTG_MAGIC = 0x00475458;
export const XTH_MAGIC = 0x00485458;

function writeU16LE(buf, off, v) {
  buf[off] = v & 0xff;
  buf[off + 1] = (v >> 8) & 0xff;
}
function writeU32LE(buf, off, v) {
  buf[off] = v & 0xff;
  buf[off + 1] = (v >> 8) & 0xff;
  buf[off + 2] = (v >> 16) & 0xff;
  buf[off + 3] = (v >> 24) & 0xff;
}
function writeU64LE(buf, off, v) {
  const hi = Math.floor(v / 0x100000000);
  const lo = v >>> 0;
  writeU32LE(buf, off, lo);
  writeU32LE(buf, off + 4, hi);
}

export function encodeXtg(width, height, pixels) {
  // pixels: Uint8Array of length width*height, 0=black 1=white (or 0/255). We expect 0/1.
  const rowBytes = Math.ceil(width / 8);
  const dataSize = rowBytes * height;
  const out = new Uint8Array(22 + dataSize);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, XTG_MAGIC, true);
  dv.setUint16(4, width, true);
  dv.setUint16(6, height, true);
  out[8] = 0;
  out[9] = 0;
  dv.setUint32(10, dataSize, true);
  // md5 optional zero
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = pixels[y * width + x] ? 1 : 0;
      if (v) out[22 + y * rowBytes + (x >> 3)] |= 1 << (7 - (x & 7));
    }
  }
  return out;
}

export function encodeXth(width, height, pixels) {
  // pixels: Uint8Array length width*height, values 0..3
  const planeSize = Math.ceil((width * height) / 8);
  const dataSize = planeSize * 2;
  const out = new Uint8Array(22 + dataSize);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, XTH_MAGIC, true);
  dv.setUint16(4, width, true);
  dv.setUint16(6, height, true);
  out[8] = 0;
  out[9] = 0;
  dv.setUint32(10, dataSize, true);

  // plane1 = bit1, plane2 = bit2
  // column-major right-to-left, 8 vertical pixels per byte
  const plane1 = new Uint8Array(planeSize);
  const plane2 = new Uint8Array(planeSize);
  let idx = 0;
  for (let x = width - 1; x >= 0; x--) {
    for (let y = 0; y < height; y += 8) {
      let b1 = 0, b2 = 0;
      for (let k = 0; k < 8; k++) {
        const yy = y + k;
        if (yy >= height) break;
        const pv = pixels[yy * width + x] & 3;
        const bit1 = (pv >> 1) & 1;
        const bit2 = pv & 1;
        if (bit1) b1 |= 1 << (7 - k);
        if (bit2) b2 |= 1 << (7 - k);
      }
      plane1[idx] = b1;
      plane2[idx] = b2;
      idx++;
    }
  }
  out.set(plane1, 22);
  out.set(plane2, 22 + planeSize);
  return out;
}

export { writeU16LE, writeU32LE, writeU64LE };