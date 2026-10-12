const fs = require('fs');
const uicons = JSON.parse(fs.readFileSync('tools/uicons_map.json', 'utf8'));
const mapped = JSON.parse(fs.readFileSync('tools/entity_flaticon_mapping.json', 'utf8'));
const entities = JSON.parse(fs.readFileSync('assets/all_entities.json', 'utf8'));

const mappedById = {};
mapped.forEach(m => {
  mappedById[m.id] = m.flaticon;
});

const updatedEntities = entities.map(e => {
  const flaticon = mappedById[e.id] || 'apps';
  const unicode = uicons[flaticon] || 'f11b';
  return {
    ...e,
    flaticon: flaticon,
    unicode: unicode
  };
});

fs.writeFileSync('assets/all_entities.json', JSON.stringify(updatedEntities, null, 2), 'utf8');
fs.writeFileSync('assets/all_entities.js', 'window.ALL_ENTITIES_DATA = ' + JSON.stringify(updatedEntities) + ';', 'utf8');
console.log('Updated assets/all_entities.json and assets/all_entities.js with Flaticon icons and unicodes for all', updatedEntities.length, 'entities!');

