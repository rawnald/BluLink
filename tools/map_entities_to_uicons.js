const fs = require('fs');
const uicons = JSON.parse(fs.readFileSync('tools/uicons_map.json', 'utf8'));
const entities = JSON.parse(fs.readFileSync('assets/all_entities.json', 'utf8'));

const uiconKeys = Object.keys(uicons);
const uiconSet = new Set(uiconKeys);

// Common manual synonyms or overrides for specialized terms
const manualAliases = {
  // Common & People
  'male': 'user',
  'female': 'woman-head',
  'anonymous': 'incognito',
  'subscriber': 'user-add',
  'telephone': 'phone-call',
  'mobile phone': 'mobile-button',
  'account': 'user-check',
  'credit card': 'credit-card',
  'cash': 'money-bill-wave',
  'document': 'document',
  'meeting': 'users',
  'car': 'car',
  'building': 'building',
  'office': 'briefcase',
  'house': 'home',
  'organisation': 'bank',

  // Activities
  'action': 'bolt',
  'arrest': 'handcuffs',
  'burglary': 'mask',
  'date': 'calendar',
  'date & time': 'calendar-clock',
  'date - time': 'calendar-clock',
  'drug exchange': 'pills',
  'flight arrival': 'plane-arrival',
  'flight departure': 'plane-departure',
  'incident': 'exclamation',
  'query': 'search-alt',
  'search': 'search',
  'sentence': 'gavel',
  'surveillance': 'eye',
  'telephone tap': 'headset',
  'time': 'clock',

  // Crime & Cyber Crime
  'fraud': 'file-invoice-dollar',
  'extortion': 'sack-dollar',
  'kidnapping': 'user-slash',
  'murder': 'skull-crossbones',
  'robbery': 'sack-dollar',
  'theft': 'mask',
  'weapon': 'sword',
  'gun': 'target',
  'firearm': 'target',
  'bomb': 'bomb',
  'explosive': 'bomb',
  'drugs': 'pills',
  'cocaine': 'pills',
  'heroin': 'syringe',
  'cannabis': 'leaf',
  'hacker': 'laptop-code',
  'hacking': 'laptop-code',
  'malware': 'bug',
  'virus': 'virus',
  'trojan': 'shield-virus',
  'phishing': 'fish',
  'ransomware': 'lock-alt',
  'ddos': 'server-key',
  'data breach': 'database',
  'server': 'database',
  'firewall': 'shield-check',
  'encryption': 'key',
  'decryption': 'unlock',
  'ip address': 'globe',
  'network': 'network',
  'router': 'router',
  'wifi': 'wifi-alt',
  'email': 'envelope',
  'website': 'browser',
  'domain': 'globe',

  // Military
  'soldier': 'user-shield',
  'infantry': 'user-shield',
  'sniper': 'target',
  'tank': 'shield',
  'armour': 'shield',
  'artillery': 'bullseye-pointer',
  'fighter': 'fighter-jet',
  'bomber': 'plane-alt',
  'helicopter': 'helicopter-side',
  'uav': 'drone',
  'drone': 'drone',
  'aircraft carrier': 'ship',
  'submarine': 'ship',
  'destroyer': 'ship',
  'patrol boat': 'ship-side',
  'radar': 'radar',
  'missile': 'rocket',
  'airfield': 'plane',
  'checkpoint': 'road',
  'minefield': 'land-mine-on',

  // Medical
  'hospital': 'hospital',
  'ambulance': 'ambulance',
  'doctor': 'user-md',
  'nurse': 'user-nurse',
  'medicine': 'capsules',
  'patient': 'bed-alt',

  // Finance & Commodities
  'bank': 'bank',
  'gold': 'coins',
  'silver': 'coins',
  'diamond': 'diamond',
  'oil': 'gas-pump',
  'currency': 'dollar',
  'investment': 'chart-line-up',

  // Flags & Locations
  'location': 'marker',
  'flag': 'flag',
  'border': 'map-marker',
  'city': 'city',
  'country': 'globe',
  'island': 'island-tropical',
  'port': 'anchor',
  'airport': 'plane-departure'
};

function getFlaticonForName(name, category) {
  const cleanName = name.toLowerCase().trim().replace(/['"()]/g, '').replace(/[\s_-]+/g, ' ');

  // Direct alias check
  if (manualAliases[cleanName]) return manualAliases[cleanName];

  // Slug check
  const slug = cleanName.replace(/\s+/g, '-');
  if (uiconSet.has(slug)) return slug;

  // Split words check
  const words = cleanName.split(' ');
  for (const w of words) {
    if (manualAliases[w]) return manualAliases[w];
    if (uiconSet.has(w)) return w;
  }

  // Check prefix or partial match in uiconSet
  for (const w of words) {
    if (w.length < 3) continue;
    const found = uiconKeys.find(k => k === w || k.startsWith(w + '-') || k.endsWith('-' + w));
    if (found) return found;
  }

  // Category fallback
  const catLower = (category || '').toLowerCase();
  if (catLower.includes('crime')) return 'shield-exclamation';
  if (catLower.includes('cyber')) return 'laptop';
  if (catLower.includes('military')) return 'shield';
  if (catLower.includes('medical')) return 'hospital';
  if (catLower.includes('finance')) return 'dollar';
  if (catLower.includes('document')) return 'document';
  if (catLower.includes('commodity') || catLower.includes('commodities')) return 'box';
  if (catLower.includes('flag')) return 'flag';
  if (catLower.includes('location')) return 'marker';
  if (catLower.includes('colour')) return 'palette';
  if (catLower.includes('activit')) return 'calendar';

  return 'apps';
}

let matched = 0;
const results = entities.map(e => {
  const icon = getFlaticonForName(e.name, e.category);
  if (uiconSet.has(icon)) matched++;
  return {
    id: e.id,
    name: e.name,
    category: e.category,
    flaticon: icon
  };
});

console.log(`Matched ${matched} of ${entities.length} entities to valid Flaticon uicons.`);
console.log('Sample mappings:', results.slice(0, 25));
fs.writeFileSync('tools/entity_flaticon_mapping.json', JSON.stringify(results, null, 2), 'utf8');
