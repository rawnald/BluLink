const fs = require('fs');
const path = require('path');
const { decodePNG, makePNG } = require('./png_utils.js');

const r1Names = [
  '4x4', 'Aeroplane', 'Ambulance', 'Articulated Tractor', 'Articulated Trailer',
  'Bicycle', 'Boat', 'Box Van', 'Bulldozer', 'Car',
  'Car (Crashed)', 'Car (Damaged)', 'Car (Rental)', 'Caravan', 'Cargo Plane (Fixed Wing)',
  'Cargo Plane (Rotary Wing)', 'Coach', 'Compact Car', 'Container', 'Container Ship',
  'Cruiser', 'Digger'
];
const r1Segs = [
  { start: 13, end: 31 }, { start: 59, end: 78 }, { start: 106, end: 125 }, { start: 152, end: 171 },
  { start: 199, end: 218 }, { start: 245, end: 264 }, { start: 292, end: 311 }, { start: 338, end: 357 },
  { start: 385, end: 403 }, { start: 431, end: 450 }, { start: 478, end: 496 }, { start: 524, end: 543 },
  { start: 570, end: 590 }, { start: 617, end: 635 }, { start: 664, end: 683 }, { start: 711, end: 729 },
  { start: 757, end: 775 }, { start: 803, end: 822 }, { start: 849, end: 868 }, { start: 896, end: 915 },
  { start: 942, end: 961 }, { start: 989, end: 1008 }
];

const r2Names = [
  'Dumper Truck', 'Ferry', 'Fire Engine', 'Flatbed', 'Freighter',
  'Hatchback', 'Helicopter', 'HGV - Box', 'HGV - Flatbed', 'Hovercraft',
  'Lear Jet', 'Limousine', 'Lorry', 'Minibus', 'Mobile Crane',
  'Motorcycle', 'Motorhome', 'Number Plate', 'Pickup Truck', 'Pickup Van',
  'Police Car', 'Security Van'
];
const r2Segs = [
  { start: 13, end: 32 }, { start: 59, end: 78 }, { start: 106, end: 125 }, { start: 152, end: 171 },
  { start: 199, end: 218 }, { start: 245, end: 264 }, { start: 292, end: 310 }, { start: 338, end: 357 },
  { start: 385, end: 404 }, { start: 431, end: 450 }, { start: 478, end: 496 }, { start: 524, end: 543 },
  { start: 570, end: 590 }, { start: 617, end: 636 }, { start: 664, end: 682 }, { start: 710, end: 729 },
  { start: 756, end: 775 }, { start: 803, end: 822 }, { start: 850, end: 868 }, { start: 896, end: 915 },
  { start: 942, end: 961 }, { start: 989, end: 1008 }
];

const r3Names = [
  'Ship', 'Speedboat', 'Sports Car', 'Taxi', 'Train', 'Trawler', 'Van', 'Yacht'
];
const r3Segs = [
  { start: 13, end: 32 }, { start: 59, end: 78 }, { start: 106, end: 125 }, { start: 152, end: 171 },
  { start: 199, end: 218 }, { start: 245, end: 264 }, { start: 292, end: 311 }, { start: 340, end: 355 }
];

const sheet = decodePNG('assets/entity_sheets/sheet_vehicles.png');

function isBackground(r, g, b) {
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

function extractItem(seg, yMin, yMax, name) {
  let minX = 999, maxX = -1, minY = 999, maxY = -1;

  for (let y = yMin; y <= yMax; y++) {
    for (let x = seg.start; x <= seg.end; x++) {
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
    minX = seg.start;
    maxX = seg.end;
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

  const safeName = name.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  const filename = `Vehicles_${safeName}.png`;
  const outPath = path.join(__dirname, '..', 'assets', 'all_icons', filename);
  fs.writeFileSync(outPath, pngBuf);

  return {
    id: `Vehicles_${safeName}`,
    name: name,
    category: 'Vehicles',
    icon: `assets/all_icons/${filename}`
  };
}

const vehicleEntities = [];

console.log('Extracting Row 1 (22 icons)...');
r1Names.forEach((name, i) => {
  const item = extractItem(r1Segs[i], 4, 23, name);
  vehicleEntities.push(item);
  console.log(`[R1 ${i+1}/22] ${item.name} -> ${item.icon}`);
});

console.log('Extracting Row 2 (22 icons)...');
r2Names.forEach((name, i) => {
  const item = extractItem(r2Segs[i], 48, 68, name);
  vehicleEntities.push(item);
  console.log(`[R2 ${i+1}/22] ${item.name} -> ${item.icon}`);
});

console.log('Extracting Row 3 (8 icons)...');
r3Names.forEach((name, i) => {
  const item = extractItem(r3Segs[i], 92, 114, name);
  vehicleEntities.push(item);
  console.log(`[R3 ${i+1}/8] ${item.name} -> ${item.icon}`);
});

console.log(`Extracted ${vehicleEntities.length} HD Vehicles icons!`);

// Update all_entities.json and all_entities.js
const manifestPath = path.join(__dirname, '..', 'assets', 'all_entities.json');
let existing = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Filter out any prior Vehicles items to prevent duplicates
existing = existing.filter(e => e.category !== 'Vehicles');

// Insert Vehicles entities
const updated = [...existing, ...vehicleEntities];

fs.writeFileSync(manifestPath, JSON.stringify(updated, null, 2), 'utf8');
const jsPath = path.join(__dirname, '..', 'assets', 'all_entities.js');
fs.writeFileSync(jsPath, 'window.ALL_ENTITIES_DATA = ' + JSON.stringify(updated) + ';', 'utf8');

console.log(`Manifest updated with Vehicles category. Total entities now: ${updated.length}`);
