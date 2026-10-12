const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function decodePNG(filePath) {
  const buf = fs.readFileSync(filePath);
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  const colorType = buf[25];
  let pos = 8;
  const idats = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IDAT') idats.push(buf.slice(pos + 8, pos + 8 + len));
    pos += 12 + len;
  }
  const decomp = zlib.inflateSync(Buffer.concat(idats));
  const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 4 ? 2 : 1;
  const stride = w * bpp + 1;

  const rgba = Buffer.alloc(w * h * 4);
  const prevLine = Buffer.alloc(w * bpp);
  const currLine = Buffer.alloc(w * bpp);

  for (let y = 0; y < h; y++) {
    const filter = decomp[y * stride];
    const srcOff = y * stride + 1;
    for (let i = 0; i < w * bpp; i++) {
      let val = decomp[srcOff + i];
      const a = (i >= bpp) ? currLine[i - bpp] : 0;
      const b = prevLine[i];
      const c = (i >= bpp) ? prevLine[i - bpp] : 0;
      if (filter === 1) val = (val + a) & 0xff;
      else if (filter === 2) val = (val + b) & 0xff;
      else if (filter === 3) val = (val + Math.floor((a + b) / 2)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        let pr = a;
        if (pb < pa && pb <= pc) pr = b;
        else if (pc < pa) pr = c;
        val = (val + pr) & 0xff;
      }
      currLine[i] = val;
    }
    currLine.copy(prevLine);

    for (let x = 0; x < w; x++) {
      const dstOff = (y * w + x) * 4;
      if (colorType === 6) {
        currLine.copy(rgba, dstOff, x * 4, (x + 1) * 4);
      } else if (colorType === 2) {
        rgba[dstOff] = currLine[x * 3];
        rgba[dstOff + 1] = currLine[x * 3 + 1];
        rgba[dstOff + 2] = currLine[x * 3 + 2];
        rgba[dstOff + 3] = 255;
      }
    }
  }
  return { w, h, rgba };
}

function makePNG(width, height, rgbaBuffer) {
  const rowLen = width * 4;
  const filtered = Buffer.alloc(height * (rowLen + 1));
  for (let y = 0; y < height; y++) {
    filtered[y * (rowLen + 1)] = 0;
    rgbaBuffer.copy(filtered, y * (rowLen + 1) + 1, y * rowLen, (y + 1) * rowLen);
  }
  const idatData = zlib.deflateSync(filtered);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const t = Buffer.from(type, 'ascii');
    const crc = crc32(Buffer.concat([t, data]));
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc, 0);
    return Buffer.concat([len, t, data, c]);
  }

  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  }

  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }

  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    header,
    chunk('IHDR', ihdr),
    chunk('IDAT', idatData),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

module.exports = { decodePNG, makePNG };
