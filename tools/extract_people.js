const fs = require('fs');
const path = require('path');
const { decodePNG, makePNG } = require('./png_utils.js');

const row1Names = [
  'Administrator',
  'Adult',
  'Alias',
  'Anonymous',
  'Body',
  'Boy',
  'Child',
  'Clan',
  'Dealer',
  'Deceased Female',
  'Deceased Male',
  'Doctor',
  'Emergency Responder',
  'Family',
  'Female',
  'Female Figure',
  'Female Lawyer',
  'Female Police Officer',
  'Female Prison Officer',
  'Female Prisoner',
  'Firefighter',
  'Fugitive'
];

const row2Names = [
  'Girl',
  'Group of People',
  'Handler of Stolen Goods',
  'Inmate',
  'Male',
  'Male Figure',
  'Male Lawyer',
  'Male Police Officer',
  'Offender',
  'Patient',
  'Person (Generic)',
  'Person (Shaded Shirt)',
  'Prison Officer',
  'Prisoner',
  'Professional Female',
  'Professional Male',
  'Screen Name',
  'Spy',
  'Subscriber',
  'User'
];

const sheet = decodePNG('assets/entity_sheets/sheet_people.png');

function isBackground(r, g, b) {
  // Near white background
  return r > 240 && g > 240 && b > 240;
}

// HD Scaler with bicubic / smooth filtering
function scaleHD(srcW, srcH, srcRgba, outSize = 64) {
  const out = Buffer.alloc(outSize * outSize * 4);
  const scale = Math.min((outSize - 8) / srcW, (outSize - 8) / srcH);
  const targetW = Math.round(srcW * scale);
  const targetH = Math.round(srcH * scale);
  const offX = Math.round((outSize - targetW) / 2);
  const offY = Math.round((outSize - targetH) / 2);

  for (let oy = 0; oy < targetH; oy++) {
    for (let ox = 0; ox < targetW; ox++) {
      const srcX = (ox / targetW) * srcW;
      const srcY = (oy / targetH) * srcH;
      
      const x0 = Math.floor(srcX);
      const y0 = Math.floor(srcY);
      const x1 = Math.min(srcW - 1, x0 + 1);
      const y1 = Math.min(srcH - 1, y0 + 1);

      const dx = srcX - x0;
      const dy = srcY - y0;

      const idx00 = (y0 * srcW + x0) * 4;
      const idx10 = (y0 * srcW + x1) * 4;
      const idx01 = (y1 * srcW + x0) * 4;
      const idx11 = (y1 * srcW + x1) * 4;

      const r = (1 - dx) * (1 - dy) * srcRgba[idx00] + dx * (1 - dy) * srcRgba[idx10] + (1 - dx) * dy * srcRgba[idx01] + dx * dy * srcRgba[idx11];
      const g = (1 - dx) * (1 - dy) * srcRgba[idx00 + 1] + dx * (1 - dy) * srcRgba[idx10 + 1] + (1 - dx) * dy * srcRgba[idx01 + 1] + dx * dy * srcRgba[idx11 + 1];
      const b = (1 - dx) * (1 - dy) * srcRgba[idx00 + 2] + dx * (1 - dy) * srcRgba[idx10 + 2] + (1 - dx) * dy * srcRgba[idx01 + 2] + dx * dy * srcRgba[idx11 + 2];
      const a = (1 - dx) * (1 - dy) * srcRgba[idx00 + 3] + dx * (1 - dy) * srcRgba[idx10 + 3] + (1 - dx) * dy * srcRgba[idx01 + 3] + dx * dy * srcRgba[idx11 + 3];

      const outIdx = ((oy + offY) * outSize + (ox + offX)) * 4;
      out[outIdx] = Math.round(r);
      out[outIdx + 1] = Math.round(g);
      out[outIdx + 2] = Math.round(b);
      out[outIdx + 3] = a > 15 ? Math.round(a) : 0;
    }
  }

  return out;
}

function extractItem(col, yMin, yMax, name) {
  const approxX = Math.round(19 + col * 46.2);
  let minX = 999, maxX = -1, minY = 999, maxY = -1;

  for (let y = yMin; y <= yMax; y++) {
    for (let x = Math.max(0, approxX - 20); x <= Math.min(sheet.w - 1, approxX + 20); x++) {
      const idx = (y * sheet.w + x) * 4;
      const r = sheet.rgba[idx], g = sheet.rgba[idx + 1], b = sheet.rgba[idx + 2];
      if (!isBackground(r, g, b)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (minX > maxX || minY > maxY) {
    minX = approxX - 10;
    maxX = approxX + 10;
    minY = yMin;
    maxY = yMax;
  }

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const cropRgba = Buffer.alloc(cropW * cropH * 4);

  for (let cy = 0; cy < cropH; cy++) {
    for (let cx = 0; cx < cropW; cx++) {
      const sx = minX + cx;
      const sy = minY + cy;
      const srcIdx = (sy * sheet.w + sx) * 4;
      const dstIdx = (cy * cropW + cx) * 4;

      const r = sheet.rgba[srcIdx];
      const g = sheet.rgba[srcIdx + 1];
      const b = sheet.rgba[srcIdx + 2];

      if (isBackground(r, g, b)) {
        cropRgba[dstIdx + 3] = 0;
      } else {
        cropRgba[dstIdx] = r;
        cropRgba[dstIdx + 1] = g;
        cropRgba[dstIdx + 2] = b;
        cropRgba[dstIdx + 3] = 255;
      }
    }
  }

  // Generate HD 64x64 icon
  const hdRgba = scaleHD(cropW, cropH, cropRgba, 64);
  const pngBuf = makePNG(64, 64, hdRgba);

  const safeName = name.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
  const filename = `People_${safeName}.png`;
  const outPath = path.join(__dirname, '..', 'assets', 'all_icons', filename);
  fs.writeFileSync(outPath, pngBuf);

  return {
    id: `People_${safeName}`,
    name: name,
    category: 'People',
    icon: `assets/all_icons/${filename}`
  };
}

const peopleEntities = [];

console.log('Extracting Row 1...');
row1Names.forEach((name, i) => {
  const item = extractItem(i, 16, 38, name);
  peopleEntities.push(item);
});

console.log('Extracting Row 2...');
row2Names.forEach((name, i) => {
  const item = extractItem(i, 60, 83, name);
  peopleEntities.push(item);
});

console.log(`Extracted ${peopleEntities.length} HD People icons!`);

// Update all_entities.json and all_entities.js
const manifestPath = path.join(__dirname, '..', 'assets', 'all_entities.json');
let existing = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Filter out any prior People items to prevent duplicates
existing = existing.filter(e => e.category !== 'People');

// Insert People entities
const updated = [...existing, ...peopleEntities];

fs.writeFileSync(manifestPath, JSON.stringify(updated, null, 2), 'utf8');
const jsPath = path.join(__dirname, '..', 'assets', 'all_entities.js');
fs.writeFileSync(jsPath, 'window.ALL_ENTITIES_DATA = ' + JSON.stringify(updated) + ';', 'utf8');

console.log(`Manifest updated with People category. Total entities now: ${updated.length}`);
