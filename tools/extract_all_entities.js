const fs = require('fs');
const path = require('path');
const { decodePNG, makePNG } = require('./png_utils');

const outDir = path.join(__dirname, '..', 'assets', 'all_icons');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const sheetsConfig = [
  // Sheet 1
  {
    file: 'assets/entity_sheets/sheet1.png',
    rows: [
      { cat: "Activities", y: 23, names: ["Action", "Arrest", "Burglary", "Date", "Date & Time", "Drug Exchange", "Flight Arrival", "Flight Departure", "Incident", "Interview", "Meeting", "Query", "Search", "Sentence", "Surveillance", "Telephone Tap", "Time"] },
      { cat: "Colours", y: 81, names: ["Aqua", "Black", "Blue", "Fuchsia", "Green", "Grey", "Lime", "Maroon", "Navy", "Olive", "Purple", "Red", "Silver", "Teal", "White", "Yellow"] },
      { cat: "Commodities", y: 140, names: ["Alcohol", "Bird", "Briefcase", "Camcorder", "Camera", "Cannabis", "Cat", "Clothing", "Cocaine", "Counterfeit Goods", "Cow", "Dog", "Drugs", "Ecstasy", "Hazard", "Heroin", "Horse", "Industrial Chemicals", "Jewellery", "Jiffy Bag", "Kilo of Drugs", "MP3 Player"] },
      { cat: "Commodities", y: 185, names: ["Notebook", "Nuclear", "Package", "Perfume", "Pills", "Prescription Drugs", "Radiation", "Rope", "Sat Nav", "Snake", "Software", "Television", "Tobacco", "Trash", "Valuable Metal", "Video Recorder"] },
      { cat: "Common", y: 244, names: ["Account", "Anonymous", "Building", "Car", "Cash", "Credit Card", "Document", "Female", "House", "Male", "Meeting", "Mobile Phone", "Office", "Organisation", "Subscriber", "Telephone"] },
      { cat: "Crime", y: 303, names: ["Arrest", "Arson", "Assassination", "Assault", "Body", "Burglary", "Car (Crashed)", "Car (Damaged)", "Car Bomb", "Case", "Category", "CCTV", "Cocaine", "Contaminated Letter", "Crime", "Crowbar", "Deceased Female", "Deceased Male", "DNA", "Drug Exchange", "Drugs", "Evidence Collection"] },
      { cat: "Crime", y: 348, names: ["Fingerprint", "Footprint", "Forensic", "Fraud", "Graffiti", "Handler of Stolen Goods", "Heroin", "ID Theft", "Incident", "Kidnapping", "Letter Bomb", "Magnify", "Meeting", "Query", "Robbery", "Search", "Sentence", "Software Piracy", "Speed Camera", "Suicide Bomb", "Tyre Tread", "Window (Broken)"] }
    ]
  },
  // Sheet 2
  {
    file: 'assets/entity_sheets/sheet2.png',
    rows: [
      { cat: "Cyber Crime", y: 26, names: ["Account (Service)", "Administrator", "Anomalous Activity", "Anonymizer", "Beaconing", "Bot Herder", "Botnet-Zombie", "Breached Firewall", "Command and Control", "Computer Log", "Computer Port", "Computer Virus", "Computer Worm", "Crime", "Cyber Backdoor", "Cyber Exploit", "Cyber Implant", "Cyber Offence", "Cyber Victim", "Data Breach", "Data Cache", "Data Exfiltration"] },
      { cat: "Cyber Crime", y: 71, names: ["Data Leak", "Data Package", "Data Transfer", "Database", "DDoS", "Defaced Web Site", "Digital Evidence", "Digital Evidence (Mobile)", "Directory", "Domain Controller", "Electronic Device", "Fake ID", "Firewall", "FTP Server", "Hacker", "Hacker (Foreign)", "Hackers Forum", "Hackers Tool", "ID Theft", "IDS - Intrusion Detection", "Infected Computer", "Instant Messaging"] },
      { cat: "Cyber Crime", y: 115, names: ["Intercept", "Internet Service Provider", "IPS - Intrusion Protection", "LAN", "Lateral Movement", "Logic Bomb", "Login", "MAC Address", "National Domain", "Network Access", "Online Forum", "Online Posting", "Packet Capture", "Password", "Phishing", "Physically Enabled Data", "Protocol", "Proxy Server", "Reconnaissance", "Rootkit", "Screen Name", "Security Operations"] },
      { cat: "Cyber Crime", y: 160, names: ["Server", "Server Blade", "SIEM - Incident Management", "Software", "Spammer", "Spear Phishing", "Spoof E-mail", "Spoof IP Address", "Spoof MAC Address", "Spoof Web Site", "Spyware", "Steganography", "Switch", "TCP - Transmission Control", "Threat Actor", "Threat Campaign", "Trojan", "UDP - User Datagram", "USB Stick", "User", "VLAN", "Web Guerrilla"] },
      { cat: "Cyber Crime", y: 205, names: ["Web ID", "Web Page", "Web Search", "Web Server", "Web Subscriber"] },
      { cat: "Documents", y: 264, names: ["Audio", "Audio Cassette", "Blog", "Book", "Cabinet", "Case", "CD-ROM", "Chart", "Cheque", "Claim", "Disk", "Document", "Drivers License", "Email", "Envelope", "Fax", "ID Card", "Jiffy Bag", "Letter", "Number Plate", "Online Forum", "Online Posting"] },
      { cat: "Documents", y: 309, names: ["Passport", "SIM Card", "Social Security", "Spreadsheet", "Text Message", "USB Stick", "Vehicle Insurance", "Video Cassette", "Video Spool", "Web Page", "Web Site"] },
      { cat: "Finance", y: 368, names: ["Account", "ATM", "Cash", "Cheque", "Claim", "Counterfeit", "Credit Card", "Credit Card (Back)", "Credit Card (Chip and PIN)", "Credit Cards", "Dollar", "Financial Loan", "Fraud", "Money Bag", "Money Transfer", "Offshore Account", "Wire Transfer"] }
    ]
  },
  // Sheet 3
  {
    file: 'assets/entity_sheets/sheet3.png',
    rows: [
      { cat: "Flags", y: 26, names: ["Afghanistan", "Albania", "Algeria", "American Samoa", "Andorra", "Angola", "Anguilla", "Antarctica", "Antigua and Barbuda", "Argentina", "Armenia", "Aruba", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize"] },
      { cat: "Flags", y: 71, names: ["Benin", "Bermuda", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Bouvet Island", "Brazil", "British Indian Ocean Territory", "Brunei Darussalam", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde", "Cayman Islands", "Central African Republic", "Chad", "Chile", "China"] },
      { cat: "Flags", y: 116, names: ["Christmas Island", "Cocos (Keeling) Islands", "Colombia", "Comoros", "Congo", "Congo (Democratic Republic)", "Cook Islands", "Costa Rica", "Cote D'Ivoire", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "East Timor", "Ecuador", "Egypt", "El Salvador", "England"] },
      { cat: "Flags", y: 160, names: ["Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia", "EU", "Falkland Islands", "Faroe Islands", "Fiji", "Finland", "France", "French Guiana", "French Polynesia", "French Southern Territories", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Gibraltar", "Greece", "Greenland", "Grenada"] },
      { cat: "Flags", y: 205, names: ["Guadeloupe", "Guam", "Guatemala", "Guernsey", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Heard Island and McDonald Islands", "Holy See (Vatican City)", "Honduras", "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Isle of Man", "Israel", "Italy"] },
      { cat: "Flags", y: 250, names: ["Jamaica", "Japan", "Jersey", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea (North)", "Korea (South)", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Macao", "North Macedonia"] },
      { cat: "Flags", y: 295, names: ["Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Martinique", "Mauritania", "Mauritius", "Mayotte", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Montserrat", "Morocco", "Mozambique", "Myanmar", "Namibia"] },
      { cat: "Flags", y: 339, names: ["NATO", "Nauru", "Nepal", "Netherlands", "Netherlands Antilles", "New Caledonia", "New Zealand", "Nicaragua", "Niger", "Nigeria", "Niue", "Norfolk Island", "Northern Ireland", "Northern Mariana Islands", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay"] },
      { cat: "Flags", y: 384, names: ["Peru", "Philippines", "Pitcairn", "Poland", "Portugal", "Puerto Rico", "Qatar", "Reunion", "Romania", "Russian Federation", "Rwanda", "Saint Helena", "Saint Kitts and Nevis", "Saint Lucia", "Saint Pierre and Miquelon", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Scotland", "Senegal"] }
    ]
  },
  // Sheet 4
  {
    file: 'assets/entity_sheets/sheet4.png',
    rows: [
      { cat: "Flags", y: 14, names: ["Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Georgia", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Svalbard and Jan Mayen", "Swaziland", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan"] },
      { cat: "Flags", y: 59, names: ["Tanzania", "Thailand", "Togo", "Tokelau", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Turks and Caicos Islands", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United Nations", "United States", "United States Minor Outlying Islands", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela"] },
      { cat: "Flags", y: 104, names: ["Viet Nam", "Virgin Islands (British)", "Virgin Islands (U.S.)", "Wales", "Wallis and Futuna", "Western Sahara", "Yemen", "Zambia", "Zimbabwe"] },
      { cat: "Locations", y: 163, names: ["Airport", "Arena", "Bank", "Bomb Factory", "Bridge", "Brothel", "Building", "Building (Abandoned)", "Car Park", "Casino", "Church", "Coach Station", "Court", "Factory", "Flat", "Garage", "Government", "Hospital", "Hospital Bed", "Hotel", "House", "Industrial Plant"] },
      { cat: "Locations", y: 208, names: ["Laboratory", "Lake", "Massage Parlour", "Medical Laboratory", "Mosque", "Motorway", "Office", "Petrol Station", "Place", "Police Station", "Port", "Post Office", "Prison", "Public House", "Restaurant", "Road", "School", "Shop", "Shopping Centre", "Theatre", "Town", "Train Station"] },
      { cat: "Locations", y: 253, names: ["University", "Warehouse", "Workshop"] },
      { cat: "Medical", y: 312, names: ["Ambulance", "Claim", "DNA", "Doctor", "Hospital", "Hospital Bed", "Medical", "Medical Laboratory", "Patient", "Pills", "Prescription Drugs"] }
    ]
  },
  // Sheet 5
  {
    file: 'assets/entity_sheets/sheet5.png',
    rows: [
      { cat: "Military", y: 29, names: ["Aircraft Carrier", "Airfield", "Ambush", "APC", "Attack Helicopter", "Bodyguard", "Bomb Factory", "Bomber", "Bridge", "Building (Ruined)", "Cargo Plane (Fixed Wing)", "Cargo Plane (Rotary Wing)", "Checkpoint", "Communications Centre", "Crater", "Destroyer", "Detonation", "Explosion", "Fighter", "Guerrilla", "Gun Emplacement", "Hand Grenade"] },
      { cat: "Military", y: 73, names: ["IED", "Insurgent", "Kidnapper", "MANPADS", "Maritime", "MBRL", "MBT", "Military Base", "Minefield", "Mortar", "NATO Soldier", "Observation Tower", "OPFOR Soldier", "Patrol", "Patrol Boat", "Patrol Vehicle", "POW", "Radar Site", "Road Block", "Rocket Attack", "RPG", "Safe House"] },
      { cat: "Military", y: 118, names: ["Shelter", "Sniper", "Soldier", "Submarine", "Support Helicopter", "Surveillance Aircraft (Fixed Wing)", "Surveillance Aircraft (Rotary Wing)", "Technical Support", "UAV", "Unexploded Ordnance", "Utility Vehicle", "Weapons Cache"] },
      { cat: "Military - APP6", y: 179, names: ["Fr-Air Defence", "Fr-Air Rotary Wing", "Fr-Anti Armour", "Fr-Armour", "Fr-Arson-Fire", "Fr-Assassination", "Fr-Attack", "Fr-Black List Location", "Fr-Bomber", "Fr-Bombing", "Fr-Booby Trap", "Fr-Chemical Recon", "Fr-Combat Service Support", "Fr-Combat Support NBC", "Fr-Combatant", "Fr-Counter Intelligence", "Fr-Demonstration", "Fr-Dismounted Ground", "Fr-Drive-by Shooting", "Fr-Drug Operation", "Fr-Drug Vehicle", "Fr-Engineer Combat"] },
      { cat: "Military - APP6", y: 224, names: ["Fr-Extortion", "Fr-Field Artillery", "Fr-Fighter", "Fr-Fixed Wing", "Fr-Graffiti", "Fr-Grey List Location", "Fr-Ground Rotary Wing", "Fr-Hijacking (Aircraft)", "Fr-Hijacking (Boat)", "Fr-Hijacking (Vehicle)", "Fr-Infantry", "Fr-Infantry Air Assault", "Fr-Infantry Airborne", "Fr-Infantry Light", "Fr-Infantry Mechanized", "Fr-Infantry Motorized", "Fr-Infantry Mountain", "Fr-Internal Security Force", "Fr-Kidnapping", "Fr-Maintenance", "Fr-Medical Treatment", "Fr-Military Intelligence"] },
      { cat: "Military - APP6", y: 268, names: ["Fr-Military Police", "Fr-Mine Laying", "Fr-Multi Rocket Launcher", "Fr-Patrolling", "Fr-Poisoning", "Fr-PSYOP", "Fr-PSYOP (House to House)", "Fr-PSYOP (Radio & TV)", "Fr-PSYOP (Written Print)", "Fr-Reconnaissance", "Fr-Reconnaissance Cavalry Armour", "Fr-Reconnaissance Long Range", "Fr-Recruitment (Coerced)", "Fr-Refugees", "Fr-Signal Unit", "Fr-Sniping", "Fr-SOF Unit Ground", "Fr-Special Operations", "Fr-Spy", "Fr-Submarine", "Fr-Supply", "Fr-Surface To Air Missile"] },
      { cat: "Military - APP6", y: 312, names: ["Ho-Air Defence", "Ho-Air Rotary Wing", "Ho-Anti Armour", "Ho-Armour", "Ho-Arson-Fire", "Ho-Assassination", "Ho-Attack", "Ho-Black List Location", "Ho-Bomber", "Ho-Bombing", "Ho-Booby Trap", "Ho-Chemical Recon", "Ho-Combat Service Support", "Ho-Combat Support NBC", "Ho-Combatant", "Ho-Counter Intelligence", "Ho-Demonstration", "Ho-Dismounted Ground", "Ho-Drive-by Shooting", "Ho-Drug Operation", "Ho-Drug Vehicle", "Ho-Engineer Combat"] },
      { cat: "Military - APP6", y: 355, names: ["Ho-Extortion", "Ho-Field Artillery", "Ho-Fighter", "Ho-Fixed Wing", "Ho-Graffiti", "Ho-Grey List Location", "Ho-Ground Rotary Wing", "Ho-Hijacking (Aircraft)", "Ho-Hijacking (Boat)", "Ho-Hijacking (Vehicle)", "Ho-Infantry", "Ho-Infantry Air Assault", "Ho-Infantry Airborne", "Ho-Infantry Light", "Ho-Infantry Mechanized", "Ho-Infantry Motorized", "Ho-Infantry Mountain", "Ho-Internal Security Force", "Ho-Kidnapping", "Ho-Maintenance", "Ho-Medical Treatment", "Ho-Military Intelligence"] },
      { cat: "Military - APP6", y: 400, names: ["Ho-Military Police", "Ho-Mine Laying", "Ho-Multi Rocket Launcher", "Ho-Patrolling", "Ho-Poisoning", "Ho-PSYOP", "Ho-PSYOP (House to House)", "Ho-PSYOP (Radio & TV)", "Ho-PSYOP (Written Print)", "Ho-Reconnaissance", "Ho-Reconnaissance Cavalry Armour", "Ho-Reconnaissance Long Range", "Ho-Recruitment (Coerced)", "Ho-Refugees", "Ho-Signal Unit", "Ho-Sniping", "Ho-SOF Unit Ground", "Ho-Special Operations", "Ho-Spy", "Ho-Submarine", "Ho-Supply", "Ho-Surface To Air Missile"] }
    ]
  }
];

const allEntities = [];
const BOX = 32;

sheetsConfig.forEach((cfg, sIdx) => {
  const filePath = path.join(__dirname, '..', cfg.file);
  console.log(`Loading sheet ${sIdx + 1}: ${cfg.file}`);
  const sheet = decodePNG(filePath);

  cfg.rows.forEach(r => {
    const numItems = r.names.length;
    for (let c = 0; c < numItems; c++) {
      const name = r.names[c];
      const cx = Math.round(19 + c * 46.2);
      const cy = r.y;

      const cropRGBA = Buffer.alloc(BOX * BOX * 4);
      const startCropX = Math.round(cx - BOX / 2);
      const startCropY = Math.round(cy - BOX / 2);

      for (let dy = 0; dy < BOX; dy++) {
        for (let dx = 0; dx < BOX; dx++) {
          const srcX = startCropX + dx;
          const srcY = startCropY + dy;
          const dstOff = (dy * BOX + dx) * 4;

          if (srcX >= 0 && srcX < sheet.w && srcY >= 0 && srcY < sheet.h) {
            const srcOff = (srcY * sheet.w + srcX) * 4;
            const red = sheet.rgba[srcOff];
            const green = sheet.rgba[srcOff + 1];
            const blue = sheet.rgba[srcOff + 2];
            // Make pure white/near-white transparent
            if (red > 250 && green > 250 && blue > 250) {
              cropRGBA[dstOff] = 255;
              cropRGBA[dstOff + 1] = 255;
              cropRGBA[dstOff + 2] = 255;
              cropRGBA[dstOff + 3] = 0;
            } else {
              cropRGBA[dstOff] = red;
              cropRGBA[dstOff + 1] = green;
              cropRGBA[dstOff + 2] = blue;
              cropRGBA[dstOff + 3] = 255;
            }
          } else {
            cropRGBA[dstOff + 3] = 0;
          }
        }
      }

      const safeCat = r.cat.replace(/[^a-zA-Z0-9_\-]/g, '_');
      const safeName = name.replace(/[^a-zA-Z0-9_\-]/g, '_');
      const fileId = `${safeCat}_${safeName}`;
      const fileName = `${fileId}.png`;
      const outPath = path.join(outDir, fileName);

      const pngBuf = makePNG(BOX, BOX, cropRGBA);
      fs.writeFileSync(outPath, pngBuf);

      allEntities.push({
        id: fileId,
        name: name,
        category: r.cat,
        icon: `assets/all_icons/${fileName}`
      });
    }
  });
});

console.log(`\nSuccessfully extracted ${allEntities.length} entity icons!`);

// Write JSON manifest
const jsonPath = path.join(__dirname, '..', 'assets', 'all_entities.json');
fs.writeFileSync(jsonPath, JSON.stringify(allEntities, null, 2), 'utf8');
console.log(`Saved manifest to ${jsonPath}`);
