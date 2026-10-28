import { useState, useEffect } from 'react';
import { 
  CLASS_STATS, WEAPONS, HEAD_ARMOR, BODY_ARMOR, SHIELD_ARMOR, 
  SPELLBOOK, SCROLL_SKILLS, REACTIONS, ALL_REACTIONS, STATUS_EFFECTS,
  CURSES
} from './data';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

// --- KURODOKO MINIGAME LOGIC ---
const generateKurodoko = (size: number) => {
  let grid: any[][] = Array(size).fill(null).map(() => Array(size).fill(null).map(() => ({ isBlack: false, num: 0 })));
  
  let blackCount = Math.floor(size * size * 0.15); 
  let attempts = 0;
  
  while (blackCount > 0 && attempts < 500) {
    attempts++;
    let r = Math.floor(Math.random() * size);
    let c = Math.floor(Math.random() * size);
    if (grid[r][c].isBlack) continue;
    
    // Check adjacency
    let adj = false;
    if (r > 0 && grid[r-1][c].isBlack) adj = true;
    if (r < size-1 && grid[r+1][c].isBlack) adj = true;
    if (c > 0 && grid[r][c-1].isBlack) adj = true;
    if (c < size-1 && grid[r][c+1].isBlack) adj = true;
    
    if (!adj) {
      grid[r][c].isBlack = true;
      
      // Check connectivity of remaining white cells
      let whites = [];
      for (let i=0; i<size; i++) {
        for (let j=0; j<size; j++) {
          if (!grid[i][j].isBlack) whites.push({r: i, c: j});
        }
      }
      
      let visited = new Set();
      if (whites.length > 0) {
        let queue = [whites[0]];
        visited.add(`${whites[0].r},${whites[0].c}`);
        while (queue.length > 0) {
          let curr = queue.shift()!;
          let dirs = [[-1,0],[1,0],[0,-1],[0,1]];
          for (let [dr, dc] of dirs) {
            let nr = curr.r + dr;
            let nc = curr.c + dc;
            if (nr >=0 && nr < size && nc >=0 && nc < size && !grid[nr][nc].isBlack) {
              let key = `${nr},${nc}`;
              if (!visited.has(key)) {
                visited.add(key);
                queue.push({r: nr, c: nc});
              }
            }
          }
        }
      }
      
      if (visited.size !== whites.length) {
        grid[r][c].isBlack = false; // Undo if it disconnects the board
      } else {
        blackCount--;
      }
    }
  }
  
  // Calculate numbers based on the solution
  for (let r=0; r<size; r++) {
    for (let c=0; c<size; c++) {
      if (!grid[r][c].isBlack) {
        let count = 0;
        for (let i=r; i>=0; i--) { if (grid[i][c].isBlack) break; count++; }
        for (let i=r+1; i<size; i++) { if (grid[i][c].isBlack) break; count++; }
        for (let i=c-1; i>=0; i--) { if (grid[r][i].isBlack) break; count++; }
        for (let i=c+1; i<size; i++) { if (grid[r][i].isBlack) break; count++; }
        
        grid[r][c].num = Math.random() > 0.5 ? count : 0;
      } else {
        grid[r][c].num = 0;
      }
    }
  }
  
  return grid;
};

const isValidKurodoko = (grid: any[][]) => {
  const size = grid.length;
  
  // 1. Check adjacency
  for (let r=0; r<size; r++) {
    for (let c=0; c<size; c++) {
      if (grid[r][c].isBlack) {
        if (r>0 && grid[r-1][c].isBlack) return false;
        if (c>0 && grid[r][c-1].isBlack) return false;
      }
    }
  }
  
  // 2. Check connectivity
  let whites = [];
  for (let i=0; i<size; i++) {
    for (let j=0; j<size; j++) {
      if (!grid[i][j].isBlack) whites.push({r: i, c: j});
    }
  }
  if (whites.length === 0) return false;
  
  let visited = new Set();
  let queue = [whites[0]];
  visited.add(`${whites[0].r},${whites[0].c}`);
  while (queue.length > 0) {
    let curr = queue.shift()!;
    let dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    for (let [dr, dc] of dirs) {
      let nr = curr.r + dr;
      let nc = curr.c + dc;
      if (nr >=0 && nr < size && nc >=0 && nc < size && !grid[nr][nc].isBlack) {
        let key = `${nr},${nc}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({r: nr, c: nc});
        }
      }
    }
  }
  if (visited.size !== whites.length) return false;
  
  // 3. Check numbers
  for (let r=0; r<size; r++) {
    for (let c=0; c<size; c++) {
      if (!grid[r][c].isBlack && grid[r][c].num > 0) {
        let count = 0;
        for (let i=r; i>=0; i--) { if (grid[i][c].isBlack) break; count++; }
        for (let i=r+1; i<size; i++) { if (grid[i][c].isBlack) break; count++; }
        for (let i=c-1; i>=0; i--) { if (grid[r][i].isBlack) break; count++; }
        for (let i=c+1; i<size; i++) { if (grid[r][i].isBlack) break; count++; }
        if (count !== grid[r][c].num) return false;
      }
    }
  }
  return true;
};

// --- NORINORI MINIGAME LOGIC ---
type Coord = { r: number; c: number };

const generateNorinori = () => {
  const size = 6;
  const regions = [
    [0,0,1,1,2,2],
    [0,0,1,1,2,2],
    [3,3,4,4,5,5],
    [3,3,4,4,5,5],
    [6,6,7,7,8,8],
    [6,6,7,7,8,8]
  ];
  
  let grid: { region: number; isBlack: boolean }[][] = Array(size).fill(null).map((_, r) => Array(size).fill(null).map((_, c) => ({ region: regions[r][c], isBlack: false })));

  let attempts = 0;
  while (attempts < 500) {
    for (let r=0; r<size; r++) for (let c=0; c<size; c++) grid[r][c].isBlack = false;
    
    let regionCells: Coord[][] = Array(9).fill(null).map(() => []);
    for (let r=0; r<size; r++) for (let c=0; c<size; c++) regionCells[regions[r][c]].push({r, c});

    for (let i=0; i<9; i++) {
      let cells = regionCells[i];
      let validPairs: Coord[][] = [];
      for (let j=0; j<4; j++) {
        for (let k=j+1; k<4; k++) {
          let c1 = cells[j], c2 = cells[k];
          if (Math.abs(c1.r - c2.r) + Math.abs(c1.c - c2.c) === 1) {
            validPairs.push([c1, c2]);
          }
        }
      }
      let pair = validPairs[Math.floor(Math.random() * validPairs.length)];
      grid[pair[0].r][pair[0].c].isBlack = true;
      grid[pair[1].r][pair[1].c].isBlack = true;
    }

    let success = true;
    for (let r=0; r<size; r++) {
      for (let c=0; c<size; c++) {
        if (grid[r][c].isBlack) {
          let reg = grid[r][c].region;
          if (r > 0 && grid[r-1][c].isBlack && grid[r-1][c].region !== reg) success = false;
          if (c > 0 && grid[r][c-1].isBlack && grid[r][c-1].region !== reg) success = false;
        }
      }
    }

    if (success) return grid;
    attempts++;
  }
  return grid;
};

const isValidNorinori = (grid: any[][]) => {
  let regionCounts = Array(9).fill(0);
  let regionCells: Coord[][] = Array(9).fill(null).map(() => []);
  
  for (let r=0; r<6; r++) {
    for (let c=0; c<6; c++) {
      if (grid[r][c].isBlack) {
        regionCounts[grid[r][c].region]++;
        regionCells[grid[r][c].region].push({r, c});
      }
    }
  }
  if (regionCounts.some(count => count !== 2)) return false;

  for (let i=0; i<9; i++) {
    if (regionCells[i].length !== 2) return false;
    let c1 = regionCells[i][0];
    let c2 = regionCells[i][1];
    if (Math.abs(c1.r - c2.r) + Math.abs(c1.c - c2.c) !== 1) return false;
  }

  for (let r=0; r<6; r++) {
    for (let c=0; c<6; c++) {
      if (grid[r][c].isBlack) {
        let region = grid[r][c].region;
        if (r > 0 && grid[r-1][c].isBlack && grid[r-1][c].region !== region) return false;
        if (c > 0 && grid[r][c-1].isBlack && grid[r][c-1].region !== region) return false;
      }
    }
  }
  
  return true;
};

const DEFAULT_STATE = {
  name: "",
  charClass: 'Fighter', level: 1, hp: 100, ep: 0,
  head: 'None', body: 'None', shield: 'None', weapon: 'Unarmed',
  accessory: 'None',
  learnedSpells: [] as any[], learnedSkills: [] as any[], 
  inventory: [] as any[], effects: [] as string[], notes: "",
  infectedEndTime: 0,
  activeCurse: null as string | null,
  learnedRecipes: ['torch', 'wooden_shield'] as string[]
};

type ItemCategory =
  | 'material' | 'consumable' | 'equipment' | 'weapon'
  | 'shield' | 'armor' | 'book' | 'charm' | 'special';

type ItemEntry = {
  key: string;
  name: string;
  category: ItemCategory;
  aliases?: string[];
  note?: string;
  teachesRecipe?: string;
  teachesRecipes?: string[];
};

const ITEM_DATABASE: ItemEntry[] = [
  { key: 'dirt', name: 'Dirt', category: 'material', note: 'Throw: d20 > 15 to inflict Confusion' },
  { key: 'feces', name: 'Feces', category: 'material', note: 'Throw: d20 > 15 to inflict Confusion. Holding it in battle gives Poison.' },
  { key: 'pebble', name: 'Pebble', category: 'material', note: 'Throw: D6 damage (no EP)' },
  { key: 'wood_pieces', name: 'Wood Pieces', category: 'material', aliases: ['wood', 'wood piece', 'wooden piece'], note: 'Crafting material' },
  { key: 'leather_straps', name: 'Leather Straps', category: 'material', aliases: ['leather', 'leather strap', 'strap', 'straps'], note: 'Crafting material' },
  { key: 'cloth', name: 'Cloth', category: 'material', note: 'Artificer crafting material / makes Torches with Sticks' },
  { key: 'nails', name: 'Nails', category: 'material', aliases: ['nail'], note: 'Crafting material / distraction: Bleeding' },
  { key: 'string', name: 'String', category: 'material', note: 'Crafting material, great for tripwire.' },
  { key: 'scrap_metal', name: 'Scrap Metal', category: 'material', aliases: ['scrap'], note: 'Artificer crafting material' },
  { key: 'arrows', name: 'Arrows', category: 'material', aliases: ['arrow'], note: 'Ammunition for bows and ballistas' },
  { key: 'stick', name: 'Stick', category: 'material', aliases: ['stick'], note: 'Combine with Cloth -> Torch' },
  { key: 'reddish_greyish_powder', name: 'Reddish-Greyish Powder', category: 'material', aliases: ['powder', 'red powder', 'reddish powder'], note: 'Volatile substance used as a base for potions' },
  { key: 'blackpowder', name: 'Blackpowder', category: 'material', aliases: ['black powder', 'gunpowder'], note: 'Explosive powder used to fire Arquebuses.' },
  { key: 'shimmering_sandpaper', name: 'Shimmering Sandpaper', category: 'material', note: 'Permanent weapon enhancement (Blazing / Bludgeoning / Cleaving)' },
  { key: 'opaque_shard', name: 'Opaque Shard', category: 'material', note: 'Solid darkness' },
  { key: 'vessel_soul', name: 'Vessel of a Soul', category: 'special', aliases: ['vessel of souls'], note: 'Trapped spectre' },
  { key: 'gears', name: 'Gears', category: 'material', aliases: ['gears'], note: 'Useful for complicated machinery.' },

  { key: 'green_vial', name: 'Green Vial', category: 'material', aliases: ['green vial'], note: 'Acidic substance, slightly corrosive.' },
  { key: 'water_vial', name: 'Water Vial', category: 'material', aliases: ['water vial','water'], note: 'Murky vial of water.' },
  { key: 'glow_vial', name: 'Glowing Vial', category: 'material', aliases: ['glowing','glowing vial'], note: 'Impure form of the Ether.' },
  { key: 'pure_vial', name: 'Purified Vial', category: 'material', aliases: ['pure vial', 'purified vial', 'purified', 'pure'], note: 'Soul repurposed as a potion ingredient.' },
  { key: 'glass_vial', name: 'Glass Vial', category: 'material', aliases: ['empty vial', 'vial'], note: 'An empty glass vial.' },

  { key: 'torch', name: 'Torch', category: 'equipment', note: 'Light source. -1 EP/turn held. Throw to inflict Burn.' },
  { key: 'combustive_vial', name: 'Combustive Vial', category: 'consumable', note: 'Thrown: 3d6 fire damage to all enemies (coinflip per enemy).' },
  { key: 'healing_vial', name: 'Healing Vial', category: 'consumable', aliases: ['heal vial'], note: 'Heal 10 HP' },
  { key: 'healing_potion', name: 'Healing Potion', category: 'consumable', aliases: ['heal potion'], note: 'Heal 20 HP' },
  { key: 'very_potent_healing_potion', name: 'Very Potent Healing Potion', category: 'consumable', aliases: ['very potent heal potion', 'very potent'], note: 'Heal 50 HP or take d20 damage' },
  { key: 'refreshing_herb', name: 'Refreshing Herb', category: 'consumable', aliases: ['herb'], note: 'Remove negative effects (except Burn, Insanity, Bleeding)' },
  { key: 'ether', name: 'Ether', category: 'consumable', note: 'Remove 30 EP (not if Downed)' },
  { key: 'large_ether', name: 'Large Ether', category: 'consumable', note: 'Remove ALL EP (2 uses)' },
  { key: 'poison_vial', name: 'Poison Vial', category: 'consumable', note: 'Inflict Poison for 5 turns' },
  { key: 'ectoplasma_vessel', name: 'Ectoplasma Vessel', category: 'consumable', aliases: ['ectoplasm vessel'], note: 'Trap spectres (coinflip)' },
  { key: 'cure_all', name: 'Cure-All', category: 'consumable', aliases: ['cure', 'cure all'], note: 'Remove ALL effects.' },
  { key: 'smoke_pot', name: 'Smoke Pot', category: 'consumable', aliases: ['smoke bomb'], note: 'Thrown: Shatters into a cloud of thick alchemical smoke, inflicting Blinded.' },

  { key: 'lucky_charm', name: 'Lucky Charm', category: 'charm', note: 'Roll d4 with d20 on regular attack' },
  { key: 'restorative_charm', name: 'Restorative Charm', category: 'charm', note: 'Heal d4 HP, lose d4 EP at Planning start' },
  { key: 'vessel_otherworldly', name: 'Vessel of Otherworldly Influence', category: 'charm', aliases: ['vessel otherworldly', 'otherworldly vessel'], note: '+5 Magical Endurance' },
  { key: 'vessel_anxiety', name: 'Vessel of Anxiety', category: 'charm', aliases: ['vessel anxiety', 'anxiety vessel'], note: '+d6 with d20 on regular attack, +2 EP per action' },

  { key: 'cleaver', name: 'Cleaver', category: 'weapon', note: 'Light Blade. +5 dmg. d6 > 4 inflicts Bleeding.' },
  { key: 'zweihandler', name: 'Zweihandler', category: 'weapon', aliases: ['zweihander', 'greatsword'], note: 'Heavy Blade. +8 dmg, +4 Atk, -1 Spd.' },
  { key: 'spear', name: 'Spear', category: 'weapon', note: 'Heavy Spear. +5 dmg, +6 Atk. Can Charge.' },
  { key: 'short_sword', name: 'Short Sword', category: 'weapon', note: 'Light Blade. Slashing/Stab. +4 dmg.' },
  { key: 'morning_star', name: 'Morning Star', category: 'weapon', note: 'Heavy Club. Blunt/Pierce. +8 dmg.' },
  { key: 'longsword', name: 'Longsword', category: 'weapon', note: 'Heavy Blade. Slashing. +6 dmg.' },
  { key: 'throwing_spear', name: 'Throwing Spear', category: 'weapon', note: 'Light Pike. Pierce/Range. +5 dmg (+4 on throw).' },
  { key: 'dagger', name: 'Dagger', category: 'weapon', note: 'Light Blade. Stab. +3 dmg, +3 on Backstab.' },
  { key: 'shortbow', name: 'Shortbow', category: 'weapon', note: 'Light Ranged. Pierce. +5 dmg. Charged Shot.' },
  { key: 'light_crossbow', name: 'Light Crossbow', category: 'weapon', note: 'Light Ranged. Pierce. +5 dmg. Requires bolts.' },
  { key: 'long_staff', name: 'Long Staff', category: 'weapon', note: 'Light Staff. Blunt. +1 dmg. Stance +d4 Def.' },
  { key: 'nail_hammer', name: 'Nail Hammer', category: 'weapon', note: 'Heavy Tool. Blunt/Pierce. +5 dmg (+3 Nail and Hammer).' },
  { key: 'wrench', name: 'Wrench', category: 'weapon', note: 'Heavy Tool. Blunt. +5 dmg. -2 EP on Construct spells.' },
  { key: 'arquebus', name: 'Arquebus', category: 'weapon', note: 'Heavy Ranged. Matchlock firearm. Devastating but slow to reload. Requires blackpowder.' },
  { key: 'ballista', name: 'Ballista', category: 'weapon', note: 'Siege Engine. Fires massive iron bolts. Too heavy to move alone.' },

  { key: 'wooden_shield', name: 'Wooden Shield', category: 'shield', note: '+2 Armor. Weak to Blunt (+3).' },
  { key: 'buckler', name: 'Buckler', category: 'shield', note: '+1 Armor. Learn Parry if not already learned.' },
  { key: 'standard_shield', name: 'Standard-issue Shield', category: 'shield', aliases: ['standard shield', 'standard issue shield'], note: '+4 Armor, -1 Spd. Learn Guard if not already learned.' },
  { key: 'metal_shield', name: 'Metal Shield', category: 'shield', note: '+5 Armor. Weak to Piercing (+3).' },
  { key: 'black_shield', name: 'Black Shield', category: 'shield', note: '+10 Defense. HP set to 60 in battle.' },

  { key: 'reinforced_cloth_robe', name: 'Reinforced Cloth Robe', category: 'armor', aliases: ['cloth robe', 'robe'], note: '+1 Armor, +3 Fire vulnerability. Light.' },
  { key: 'leather_helmet', name: 'Leather Helmet', category: 'armor', note: '+2 Armor. Head armor. Weak to Blunt (+3).' },
  { key: 'tough_leather_vest', name: 'Tough Leather Vest', category: 'armor', aliases: ['leather vest', 'vest'], note: '+3 Armor. Weak to Blunt (+2). Heavy (-2 Spd, -4 for Mage/Rogue).' },
  { key: 'light_shoulder_plates', name: 'Light Shoulder Plates', category: 'armor', aliases: ['shoulder plates'], note: '+2 Armor, -1 Atk.' },
  { key: 'tough_helmet', name: 'Tough Helmet', category: 'armor', note: '+4 Armor. Heavy (-2 Spd, -4 for Mage/Rogue).' },
  { key: 'plate_body_armor', name: 'Plate Body Armor', category: 'armor', aliases: ['plate armor', 'plate body'], note: '+8 Armor, -4 Spd.' },
  { key: 'plate_helmet', name: 'Plate Helmet', category: 'armor', note: '+5 Armor (with Plate Armor), -2 Spd.' },

  { key: 'grappling_hook', name: 'Grappling Hook', category: 'equipment', note: 'Situational. Iron hook and hemp rope. Allows climbing or pulling distant objects.' },
  { key: 'doctor_mask', name: 'Doctor\'s Mask', category: 'equipment', aliases: ['doctors mask'], note: 'Leather mask stuffed with herbs. Protects against gaseous Poison and airborne diseases.' },
  { key: 'clockwork_beetle', name: 'Clockwork Beetle', category: 'equipment', aliases: ['mechanical spider'], note: 'Situational. A brass and gear trinket. Can scuttle into small spaces for scouting.' },

  { key: 'scroll_desperate', name: 'Scroll of the Desperate', category: 'book', aliases: ['desperation scroll'], note: 'Learn Desperation' },
  { key: 'scroll_swift', name: 'Scroll of Swift Impacts', category: 'book', aliases: ['swift impacts'], note: 'Learn Swift Impacts' },
  { key: 'scroll_fencing', name: 'Scroll of Fencing', category: 'book', aliases: ['fencing'], note: 'Learn Attack Stance' },
  { key: 'book_holding', name: 'Book of Holding', category: 'book', note: 'Extra storage slot / +2 Magical Endurance as conduit' },
  { key: 'scroll_stealth', name: 'Scroll of Stealth', category: 'book', aliases: ['stealth scroll'], note: 'Learn Speed Attack' },
  { key: 'scroll_reckless', name: 'Scroll of the Reckless', category: 'book', aliases: ['reckless scroll'], note: 'Learn Double Impact' },
  { key: 'predictions', name: 'Predictions', category: 'book', note: 'Coinflip: learn Visions of the Imminent, else Insanity next battle' },
  { key: 'unseen_boundary', name: 'The Unseen Boundary', category: 'book', note: 'Learn Teleportation' },
  { key: 'guide_exhaustion', name: 'Guide to Clearing Exhaustion', category: 'book', aliases: ['clearing exhaustion', 'exhaustion guide'], note: 'Learn Momentary Rest' },
  { key: 'black_book', name: 'Black Book', category: 'book', note: 'Coinflip: replace L1/L2 spells with Harming/Injuring, gain Dark Fate' },
  { key: 'emberweaved_grimoire', name: 'Emberweaved Grimoire', category: 'book', aliases: ['ember grimoire'], note: 'Learn Ring of Embers / Concentrated Pyromancy' },
  { key: 'tome_ivy', name: 'Tome of Ivy', category: 'book', aliases: ['ivy tome'], note: 'Learn Spontaneous Poisoning' },
  { key: 'book_healing', name: 'Book of Healing', category: 'book', note: 'Add d6 to your healing spells' },
  { key: 'tome_violence', name: 'Tome of Violence', category: 'book', aliases: ['violence tome'], note: 'Halve EP gain from Hurting/Injuring/Tearing/Terror of Souls' },
  { key: 'wishes_protection', name: 'Wishes of Protection', category: 'book', aliases: ['protection wishes'], note: '+1 Defense, -1 EP gain on protection spells' },
  
  { key: 'book_al_artifice', name: "Alchemia I", category: 'book', teachesRecipes: ['ether', 'healing_potion'], note: 'Teaches how to make some useful remedies.' },
  { key: 'book_al_artifice2', name: "Alchemia II", category: 'book', teachesRecipes: ['combustive_vial','poison_vial','smoke_pot'], note: 'Teaches how to make some volatile potions.' },
  { key: 'book_illnesses', name: "Common Illnesses and Afflictions", category: 'book', teachesRecipes: ['doctor_mask'], note: 'Teaches how to make some useful remedies.' },
  { key: 'book_al_artifice3', name: "Alchemia?", category: 'book', teachesRecipes: ['very_potent_healing_potion','cure_all'], note: '???' },
  
  { key: 'kriegsmaschinen', name: "Kriegsmaschinen", category: 'book', teachesRecipes: ['arquebus', 'ballista'], note: 'A weathered book containing instructions on how to make machines of war.' },
  { key: 'codex_mechanica', name: "Codex Mechanica", category: 'book', teachesRecipes: ['grappling_hook', 'clockwork_beetle'], note: 'A pamphlet containing some weird handwriting and unrealistic drawings.' },
];

const ALL_CRAFTING_RECIPES = [
  {
    key: 'torch', name: 'Torch', category: 'equipment', note: 'Light source. -1 EP/turn held. Throw to inflict Burn.',
    isSimple: true,
    ingredients: [{ key: 'stick', name: 'Stick', qty: 1 }, { key: 'cloth', name: 'Cloth', qty: 1 }]
  },
  {
    key: 'combustive_vial', name: 'Combustive Vial', category: 'consumable', note: 'Thrown: 3d6 fire damage to all enemies (coinflip per enemy).',
    ingredients: [{ key: 'reddish_greyish_powder', name: 'Reddish-Greyish Powder', qty: 1 }, { key: 'refreshing_herb', name: 'Refreshing Herb', qty: 1 }, { key: 'glass_vial', name: 'Glass Vial', qty: 1 }]
  },
  {
    key: 'blackpowder', name: 'Blackpowder', category: 'material', note: 'Explosive powder used to fire Arquebuses.',
    isSimple: true,
    ingredients: [{ key: 'reddish_greyish_powder', name: 'Reddish-Greyish Powder', qty: 2 }, { key: 'dirt', name: 'Dirt', qty: 1 }]
  },
  {
    key: 'wooden_shield', name: 'Wooden Shield', category: 'shield', note: '+2 Armor. Weak to Blunt (+3).',
    isSimple: true,
    ingredients: [{ key: 'wood_pieces', name: 'Wood Pieces', qty: 5 }, { key: 'nails', name: 'Nails', qty: 3 }, { key: 'scrap_metal', name: 'Scrap Metal', qty: 2 }]
  },
  {
    key: 'poison_vial', name: 'Poison Vial', category: 'consumable', note: 'Craft this to inflict Poison onto enemies for 5 turns.',
    ingredients: [{ key: 'reddish_greyish_powder', name: 'Reddish-Greyish Powder', qty: 1 }, { key: 'green_vial', name: 'Green Vial', qty: 1 }, { key: 'glass_vial', name: 'Glass Vial', qty: 1 }]
  },
  {
    key: 'ether', name: 'Ether', category: 'consumable', note: 'Craft an Ether.',
    ingredients: [{ key: 'reddish_greyish_powder', name: 'Reddish-Greyish Powder', qty: 1 }, { key: 'pure_vial', name: 'Purified Vial', qty: 1 }, { key: 'glass_vial', name: 'Glass Vial', qty: 1 }]
  },
  {
    key: 'healing_potion', name: 'Healing Potion', category: 'consumable', note: 'Craft a Healing Potion',
    ingredients: [{ key: 'reddish_greyish_powder', name: 'Reddish-Greyish Powder', qty: 1 }, { key: 'pure_vial', name: 'Purified Vial', qty: 1 }, { key: 'refreshing_herb', name: 'Refreshing Herb', qty: 1 }, { key: 'glass_vial', name: 'Glass Vial', qty: 1 }]
  },
  {
    key: 'very_potent_healing_potion', name: 'Very Potent Healing Potion', category: 'consumable', note: 'Craft a Very Potent Healing Potion',
    ingredients: [{ key: 'reddish_greyish_powder', name: 'Reddish-Greyish Powder', qty: 1 }, { key: 'refreshing_herb', name: 'Refreshing Herb', qty: 1 }, { key: 'healing_potion', name: 'Healing Potion', qty: 2 }]
  },
  {
    key: 'cure_all', name: 'Cure-all', category: 'consumable', note: 'Craft a Cure-All.',
    ingredients: [{ key: 'reddish_greyish_powder', name: 'Reddish-Greyish Powder', qty: 2 }, { key: 'pure_vial', name: 'Purified Vial', qty: 3 }, { key: 'refreshing_herb', name: 'Refreshing Herb', qty: 3 }, { key: 'glass_vial', name: 'Glass Vial', qty: 1 }]
  },
  {
    key: 'smoke_pot', name: 'Smoke Pot', category: 'consumable', note: 'Thrown: Shatters into a cloud of thick smoke, inflicting Blinded on mostly everyone. Everyone coinflips once this is used.',
    ingredients: [{ key: 'cloth', name: 'Cloth', qty: 1 }, { key: 'reddish_greyish_powder', name: 'Reddish-Greyish Powder', qty: 1 }, { key: 'glass_vial', name: 'Glass Vial', qty: 1 }]
  },
  {
    key: 'arquebus', name: 'Arquebus', category: 'weapon', note: 'Heavy Ranged. Matchlock firearm. Requires blackpowder.',
    ingredients: [{ key: 'wood_pieces', name: 'Wood Pieces', qty: 4 }, { key: 'scrap_metal', name: 'Scrap Metal', qty: 3 }, { key: 'string', name: 'String', qty: 2 }, { key: 'blackpowder', name: 'Blackpowder', qty: 1 }]
  },
  {
    key: 'ballista', name: 'Ballista', category: 'weapon', note: 'Siege Engine. Fires massive iron bolts.',
    ingredients: [{ key: 'wood_pieces', name: 'Wood Pieces', qty: 8 }, { key: 'scrap_metal', name: 'Scrap Metal', qty: 6 }, { key: 'string', name: 'String', qty: 4 }, { key: 'leather_straps', name: 'Leather Straps', qty: 4 }]
  },
  {
    key: 'grappling_hook', name: 'Grappling Hook', category: 'equipment', note: 'Situational. Allows climbing or pulling distant objects.',
    ingredients: [{ key: 'scrap_metal', name: 'Scrap Metal', qty: 2 }, { key: 'string', name: 'String', qty: 3 }, { key: 'stick', name: 'Stick', qty: 1 }]
  },
  {
    key: 'clockwork_beetle', name: 'Clockwork Beetle', category: 'equipment', note: 'Situational. Useful for scouting out the next room.',
    ingredients: [{ key: 'scrap_metal', name: 'Scrap Metal', qty: 3 }, { key: 'gears', name: 'Gears', qty: 3 }]
  },
  {
    key: 'doctor_mask', name: 'Doctor\'s Mask', category: 'equipment', note: 'Protects against gaseous Poison and airborne diseases.',
    isSimple: true,
    ingredients: [{ key: 'leather_straps', name: 'Leather Straps', qty: 2 }, { key: 'refreshing_herb', name: 'Refreshing Herb', qty: 1 }, { key: 'cloth', name: 'Cloth', qty: 1 }]
  },
];

const searchItems = (query: string): ItemEntry[] => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored = ITEM_DATABASE
    .map(item => {
      const name = item.name.toLowerCase();
      const aliases = item.aliases?.map(a => a.toLowerCase()) ?? [];
      let score = Infinity;
      if (name === q) score = 0;
      else if (aliases.some(a => a === q)) score = 1;
      else if (name.startsWith(q)) score = 2;
      else if (aliases.some(a => a.startsWith(q))) score = 3;
      else if (name.includes(q)) score = 4;
      else if (aliases.some(a => a.includes(q))) score = 5;
      return { item, score };
    })
    .filter(({ score }) => score !== Infinity)
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return a.item.name.localeCompare(b.item.name);
    });
  return scored.slice(0, 6).map(s => s.item);
};

const resolveItem = (typed: string): ItemEntry | null => {
  const lower = typed.trim().toLowerCase();
  if (!lower) return null;
  const exact = ITEM_DATABASE.find(i => i.name.toLowerCase() === lower);
  if (exact) return exact;
  const aliasExact = ITEM_DATABASE.find(i =>
    i.aliases?.some(a => a.toLowerCase() === lower)
  );
  if (aliasExact) return aliasExact;

  const guesses = searchItems(typed);
  if (guesses.length === 0) return null;
  if (guesses.length === 1) return guesses[0];
  if (guesses[0].name.toLowerCase().startsWith(lower)) return guesses[0];
  if (guesses[0].aliases?.some(a => a.toLowerCase().startsWith(lower))) return guesses[0];
  return null;
};

const rollDice = (formula: string) => {
  if (!formula || formula === 'None' || formula === 'Manual') return 0;
  try {
    const match = formula.match(/(\d*)d(\d+)(?:\+(\d+))?/i);
    if (!match) return parseInt(formula) || 0;
    const count = parseInt(match[1]) || 1;
    const sides = parseInt(match[2]);
    const mod = parseInt(match[3]) || 0;
    let total = 0;
    for (let i = 0; i < count; i++) total += Math.floor(Math.random() * sides) + 1;
    return total + mod;
  } catch { return 0; }
};

const getMaxRoll = (formula: string) => {
  if (!formula || formula === 'None' || formula === 'Manual') return 0;
  try {
    const match = formula.match(/(\d*)d(\d+)(?:\+(\d+))?/i);
    if (!match) return parseInt(formula) || 0;
    const count = parseInt(match[1]) || 1;
    const sides = parseInt(match[2]);
    const mod = parseInt(match[3]) || 0;
    return (count * sides) + mod;
  } catch { return 0; }
};

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

type SmartNumberInputProps = {
  value: number;
  onCommit: (n: number) => void;
  className?: string;
  min?: number;
  max?: number;
  title?: string;
};

const SmartNumberInput = ({ value, onCommit, className, min = 0, max = Infinity, title }: SmartNumberInputProps) => {
  const [text, setText] = useState(String(value));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) setText(String(value));
  }, [value, isFocused]);

  const commit = (raw: string) => {
    const parsed = parseInt(raw, 10);
    if (raw.trim() === '' || isNaN(parsed)) {
      setText(String(value));
      return;
    }
    const clamped = Math.max(min, Math.min(max, parsed));
    setText(String(clamped));
    if (clamped !== value) onCommit(clamped);
  };

  return (
    <input
      type="number"
      className={className}
      value={text}
      title={title}
      onFocus={() => setIsFocused(true)}
      onChange={e => {
        const raw = e.target.value;
        setText(raw);
        if (raw.trim() === '') return;
        const n = parseInt(raw, 10);
        if (!isNaN(n) && n >= min) {
          onCommit(Math.min(max, Math.max(min, n)));
        }
      }}
      onBlur={e => { setIsFocused(false); commit(e.target.value); }}
      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
    />
  );
};

export default function App() {
  const [tab, setTab] = useState<'main' | 'inventory' | 'spells' | 'skills' | 'effects' | 'curses' | 'notes'>('main');
  const [currentSlot, setCurrentSlot] = useState(0);
  const [state, setState] = useState(DEFAULT_STATE);
  const [lastRoll, setLastRoll] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const [hpStep, setHpStep] = useState(1);
  const [epStep, setEpStep] = useState(1);
  const [levelStep, setLevelStep] = useState(1);

  // Crafting Minigame State
  const [showPuzzle, setShowPuzzle] = useState(false);
  const [puzzleType, setPuzzleType] = useState<'kurodoko' | 'norinori'>('kurodoko');
  const [puzzleGrid, setPuzzleGrid] = useState<any[][]>([]);
  const [craftingRecipe, setCraftingRecipe] = useState<any>(null);
  const [puzzleError, setPuzzleError] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  // Controlled Add Item form
  const [itemNameInput, setItemNameInput] = useState('');
  const [itemQtyInput, setItemQtyInput] = useState('1');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // --- OTA UPDATE LOGIC ---
  useEffect(() => {
    // Tells Capacitor the app loaded successfully (prevents rollback)
    CapacitorUpdater.notifyAppReady().catch(console.warn);
    
    // Delay update check slightly so it doesn't block initial render
    const timer = setTimeout(() => {
      checkForOTAUpdate();
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const checkForOTAUpdate = async () => {
    try {
      const GITHUB_REPO = 'YOUR_GITHUB_USERNAME/YOUR_REPO_NAME'; // <--- CHANGE THIS
      
      const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
      if (!response.ok) return; // If no releases, do nothing
      
      const latestRelease = await response.json();
      
      // Use CapacitorUpdater to get the current bundle version
      const currentBundle = await CapacitorUpdater.current();
      const currentVersion = currentBundle.bundle.version;
      
      const latestVersion = latestRelease.tag_name.replace('v', '');
      
      if (latestVersion !== currentVersion) {
        // Look for the zip asset in the release
        const zipAsset = latestRelease.assets.find((asset: any) => asset.name.endsWith('.zip'));
        
        if (zipAsset) {
          const userConfirmed = window.confirm(`New update (v${latestVersion}) is available! Download now?`);
          if (userConfirmed) {
            // Download and apply the new bundle
            const bundle = await CapacitorUpdater.download({
              url: zipAsset.browser_download_url,
              version: latestVersion,
            });
            await CapacitorUpdater.set(bundle); // This will restart the app
          }
        }
      }
    } catch (err) {
      console.warn("OTA Update check failed:", err);
    }
  };
  // -------------------------

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const infectedSeconds = Math.max(0, Math.floor((state.infectedEndTime - now) / 1000));
  useEffect(() => {
    if (state.infectedEndTime > 0 && infectedSeconds <= 0) {
      alert("INFECTED TIMER UP! You have become a Ghoul.");
      setState(prev => ({ ...prev, infectedEndTime: 0, effects: prev.effects.filter(e => e !== 'Infected') }));
    }
  }, [infectedSeconds, state.infectedEndTime]);

  useEffect(() => {
    const saved = localStorage.getItem(`tad_save_${currentSlot}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.skills && !parsed.learnedSpells) {
        parsed.learnedSpells = parsed.skills;
        delete parsed.skills;
      }
      if (!parsed.learnedRecipes) parsed.learnedRecipes = ['torch', 'wooden_shield'];
      
      const loadedState = { ...DEFAULT_STATE, ...parsed };
      loadedState.hp = Math.min(100, Math.max(0, loadedState.hp));
      loadedState.ep = Math.max(0, loadedState.ep);
      
      setState(loadedState);
    } else {
      setState(DEFAULT_STATE);
    }
  }, [currentSlot]);

  const saveGame = () => {
    localStorage.setItem(`tad_save_${currentSlot}`, JSON.stringify(state));
    alert(`${state.name.trim() || 'Character'} saved to Slot ${currentSlot + 1}!`);
  };

  const baseData = CLASS_STATS[state.charClass];
  
  let maxEp = baseData.max_ep;
  let physEnd = baseData.phys_end;
  let magEnd = baseData.mag_end;
  let agility = baseData.agility;
  let maxSpellSlots = 3;

  if (state.activeCurse === 'Bound to Darkness') {
    maxEp = 75;
  } else if (state.activeCurse === 'Indelible Fatigue') {
    maxEp = 100;
    magEnd -= 2;
    physEnd -= 2;
  } else if (state.activeCurse === 'Blinding Light') {
    maxEp = 60;
  } else if (state.activeCurse === 'Closed Mind') {
    maxEp = 100;
    maxSpellSlots = 1;
  }

  const wData = WEAPONS[state.weapon];
  const hData = HEAD_ARMOR[state.head];
  const bData = BODY_ARMOR[state.body];
  const sData = SHIELD_ARMOR[state.shield];

  const totalDef = hData.bonus + bData.bonus + sData.bonus;
  let totalCrit = hData.attack + bData.attack + sData.attack + wData.attack;
  
  if (state.accessory === 'Lucky Charm') totalCrit += 1;
  if (state.accessory === 'Vessel of Anxiety') totalCrit += 2;

  let armorSpeed = hData.speed + bData.speed + sData.speed;
  if (['Mage', 'Rogue'].includes(state.charClass)) {
    if (hData.speed < 0) armorSpeed += hData.speed; 
    if (bData.speed < 0) armorSpeed += bData.speed;
  }
  const totalSpd = armorSpeed + wData.speed;

  const epDebuffs = state.ep >= 70 ? { dmg: -16, agi: -7 } :
                    state.ep >= 50 ? { dmg: -12, agi: -5 } :
                    state.ep >= 30 ? { dmg: -8, agi: -3 } :
                    state.ep >= 20 ? { dmg: -5, agi: -2 } :
                    state.ep >= 10 ? { dmg: -3, agi: -1 } : { dmg: 0, agi: 0 };
  
  const isDowned = state.ep >= maxEp;
  const die = state.level >= 6 ? 'd20' : 'd6';
  const baseDmg = wData.damage + (state.level - 1);
  const finalDmg = baseDmg + epDebuffs.dmg;
  const levelBonus = state.level > 1 ? ` (+${state.level - 1})` : '';
  const finalAgi = agility + (state.level - 1) + epDebuffs.agi;

  const activeReactions = [...REACTIONS[state.charClass]];
  const activeReactionNames = new Set(activeReactions.map(r => r.name));

  [hData, bData, sData, wData].forEach(item => {
    if (item.grants) {
      item.grants.forEach((rName: string) => {
        if (!activeReactionNames.has(rName) && ALL_REACTIONS[rName]) {
          activeReactions.push(ALL_REACTIONS[rName]);
          activeReactionNames.add(rName);
        }
      });
    }
  });

  const adjustStat = (stat: 'hp' | 'ep', amount: number) => {
    setState(prev => {
      let newVal = prev[stat] + amount;
      if (stat === 'ep') newVal = Math.min(maxEp, newVal);
      if (stat === 'hp') newVal = Math.min(100, newVal);
      return { ...prev, [stat]: Math.max(0, newVal) };
    });
  };

  const adjustLevel = (amount: number) => {
    setState(prev => {
      const newLevel = Math.max(1, prev.level + amount);
      return { ...prev, level: newLevel };
    });
  };

  const rollDamage = () => {
    const roll = rollDice(`${die}`) + finalDmg;
    setLastRoll(`Damage Roll: ${die} (${roll - finalDmg}) + ${finalDmg} = ${roll}`);
  };

  const rollAttack = () => {
    const roll = rollDice('1d20');
    const total = roll + totalCrit;
    let msg = `Attack Roll: d20 (${roll}) + ${totalCrit} = ${total}`;
    if (roll === 20 || total >= 20) {
      msg += `\nCRIT! Roll an extra d6 for damage.`;
    }
    setLastRoll(msg);
  };

  const useMove = (move: any) => {
    const epRolled = rollDice(move.ep);
    const maxEpRoll = getMaxRoll(move.ep);
    const endurance = move.type === 'Magical' ? magEnd : physEnd;

    let finalEp = epRolled;
    let msg = `${move.name}: Rolled ${epRolled} EP`;

    if (endurance < 0) {
      finalEp = Math.max(0, epRolled - endurance); 
      msg += `, ${endurance} Endurance (Always applies)`;
    } else if (endurance > 0) {
      if (epRolled === maxEpRoll && epRolled > 0) {
        finalEp = Math.max(0, epRolled - endurance);
        msg += ` (MAX ROLL!), -${endurance} Endurance`;
      } else {
        msg += ` (Endurance inactive - need ${maxEpRoll} EP to trigger)`;
      }
    }

    msg += ` → +${finalEp} EP`;

    setState(prev => {
      const newEp = Math.min(maxEp, prev.ep + finalEp);
      return { ...prev, ep: newEp };
    });
    setLastRoll(msg);
  };

  const addItemToInventory = (itemToAdd: any, currentInv: any[]) => {
    let newInv = [...currentInv];
    let remaining = itemToAdd.qty;

    for (let item of newInv) {
      if (item.name.toLowerCase() === itemToAdd.name.toLowerCase() && item.qty < 99) {
        const add = Math.min(remaining, 99 - item.qty);
        item.qty += add;
        remaining -= add;
      }
    }

    while (remaining > 0 && newInv.length < 10) {
      const add = Math.min(remaining, 99);
      newInv.push({
        name: itemToAdd.name,
        qty: add,
        itemKey: itemToAdd.key || itemToAdd.itemKey,
        category: itemToAdd.category,
        note: itemToAdd.note,
      });
      remaining -= add;
    }

    return { newInv, remaining };
  };

  const addItem = () => {
    const typed = itemNameInput.trim();
    if (!typed) return;
    const qty = Math.max(1, parseInt(itemQtyInput, 10) || 1);

    const matched = resolveItem(typed);
    const finalName = matched ? matched.name : typed;
    const finalKey = matched?.key;
    const finalCategory = matched?.category;
    const finalNote = matched?.note;

    const { newInv, remaining } = addItemToInventory({
      name: finalName, qty, key: finalKey, category: finalCategory, note: finalNote
    }, state.inventory);

    if (remaining > 0) alert("Inventory full!");

    setState({ ...state, inventory: newInv });
    setItemNameInput('');
    setItemQtyInput('1');
    setShowSuggestions(false);
  };

  const handleUseItem = (index: number) => {
    const item = state.inventory[index];
    const key = item.itemKey || item.name.toLowerCase().replace(/\s+/g, '_');

    if (key === 'arquebus') {
      let powderCount = 0, pebbleCount = 0, nailCount = 0;
      state.inventory.forEach(i => {
        if (i.itemKey === 'blackpowder' || i.name === 'Blackpowder') powderCount += i.qty;
        if (i.itemKey === 'pebble' || i.name === 'Pebble') pebbleCount += i.qty;
        if (i.itemKey === 'nails' || i.name === 'Nails') nailCount += i.qty;
      });

      if (powderCount >= 4 && (pebbleCount >= 1 || nailCount >= 1)) {
        let tempInv = JSON.parse(JSON.stringify(state.inventory));
        let needed = 4;
        for (let i = 0; i < tempInv.length; i++) {
          if (tempInv[i].itemKey === 'blackpowder' || tempInv[i].name === 'Blackpowder') {
            const take = Math.min(needed, tempInv[i].qty);
            tempInv[i].qty -= take;
            needed -= take;
            if (needed <= 0) break;
          }
        }
        needed = 1;
        for (let i = 0; i < tempInv.length; i++) {
          if (tempInv[i].itemKey === 'nails' || tempInv[i].name === 'Nails' || tempInv[i].itemKey === 'pebble' || tempInv[i].name === 'Pebble') {
            const take = Math.min(needed, tempInv[i].qty);
            tempInv[i].qty -= take;
            needed -= take;
            if (needed <= 0) break;
          }
        }
        tempInv = tempInv.filter((i: any) => i.qty > 0);
        setState({ ...state, inventory: tempInv });
        setLastRoll("Fired the Arquebus! (Consumed 4 Blackpowder and 1 Nail/Pebble. Weapon not consumed.)");
      } else {
        setLastRoll("Failed to fire Arquebus. Need 4 Blackpowder and 1 Nail or Pebble.");
      }
      return;
    }

    if (key === 'ballista') {
      let arrowCount = 0;
      state.inventory.forEach(i => {
        if (i.itemKey === 'arrows' || i.name === 'Arrows') arrowCount += i.qty;
      });
      
      if (arrowCount >= 1) {
        let tempInv = JSON.parse(JSON.stringify(state.inventory));
        let needed = 1;
        for (let i = 0; i < tempInv.length; i++) {
          if (tempInv[i].itemKey === 'arrows' || tempInv[i].name === 'Arrows') {
            const take = Math.min(needed, tempInv[i].qty);
            tempInv[i].qty -= take;
            needed -= take;
            if (needed <= 0) break;
          }
        }
        tempInv = tempInv.filter((i: any) => i.qty > 0);
        setState({ ...state, inventory: tempInv });
        setLastRoll("Fired the Ballista! (Consumed 1 Arrow. Weapon not consumed.)");
      } else {
        setLastRoll("Failed to fire Ballista. Need 1 Arrow.");
      }
      return;
    }

    let newHp = state.hp;
    let newEp = state.ep;
    let newEffects = [...state.effects];
    let newInfectedEndTime = state.infectedEndTime;
    let newInv = [...state.inventory];
    let newRecipes = [...state.learnedRecipes];
    let newHead = state.head;
    let newBody = state.body;
    let newShield = state.shield;
    let newWeapon = state.weapon;
    let newAccessory = state.accessory || 'None';
    let msg = `Used ${item.name}! `;

    const dbItem = ITEM_DATABASE.find(i => i.key === key);
    const isBook = item.category === 'book';

    const isHead = !!HEAD_ARMOR[item.name];
    const isBody = !!BODY_ARMOR[item.name];
    const isShield = !!SHIELD_ARMOR[item.name];
    const isWeapon = !!WEAPONS[item.name];
    const isAccessory = (item.category === 'charm' || item.category === 'equipment') && !isHead && !isBody && !isShield && !isWeapon;

    if (isHead || isBody || isShield || isWeapon || isAccessory) {
      let oldItemName = 'None';
      let slotName = '';
      
      if (isHead) { oldItemName = newHead; newHead = item.name; slotName = 'Head'; }
      else if (isBody) { oldItemName = newBody; newBody = item.name; slotName = 'Body'; }
      else if (isShield) { oldItemName = newShield; newShield = item.name; slotName = 'Shield'; }
      else if (isWeapon) { oldItemName = newWeapon; newWeapon = item.name; slotName = 'Weapon'; }
      else if (isAccessory) { oldItemName = newAccessory; newAccessory = item.name; slotName = 'Accessory'; }

      newInv.splice(index, 1);

      if (oldItemName && oldItemName !== 'None' && oldItemName !== 'Unarmed') {
        const oldDbItem = ITEM_DATABASE.find(i => i.name === oldItemName);
        const itemToAdd = oldDbItem 
          ? { name: oldDbItem.name, qty: 1, key: oldDbItem.key, category: oldDbItem.category, note: oldDbItem.note }
          : { name: oldItemName, qty: 1 }; 
          
        const { newInv: invWithOld } = addItemToInventory(itemToAdd, newInv);
        newInv = invWithOld;
      }

      msg += `Equipped ${item.name} to ${slotName}.`;
      if (oldItemName !== 'None' && oldItemName !== 'Unarmed') {
        msg += ` ${oldItemName} returned to inventory.`;
      }
      
      setState({ ...state, head: newHead, body: newBody, shield: newShield, weapon: newWeapon, accessory: newAccessory, inventory: newInv });
      setLastRoll(msg);
      return;
    }

    if (key === 'healing_vial') {
      newHp = newHp + 10;
      msg += `Healed 10 HP.`;
    } else if (key === 'healing_potion') {
      newHp = newHp + 20;
      msg += `Healed 20 HP.`;
    } else if (key === 'ether') {
      newEp = Math.max(0, newEp - 30);
      msg += `Removed 30 EP.`;
    } else if (key === 'large_ether') {
      newEp = 0;
      msg += `Removed ALL EP.`;
    } else if (key === 'refreshing_herb') {
      newEffects = newEffects.filter(e => !['Poison', 'Blinded', 'Confusion', 'Injured', 'Paralyzed', 'Incapacitated'].includes(e));
      msg += `Removed negative effects.`;
    } else if (key === 'cure_all') {
      newEffects = [];
      newInfectedEndTime = 0;
      msg += `Removed ALL effects (including positive ones).`;
    } else if (key === 'combustive_vial') {
      msg += `Thrown! 3d6 fire damage to all enemies.`;
    } else if (key === 'smoke_pot') {
      if (!newEffects.includes('Blinded')) {
        newEffects.push('Blinded');
      }
      msg += `Thrown! The pot shatters, releasing a thick cloud of alchemical smoke. You are now Blinded.`;
    } else if (dbItem?.teachesRecipe || dbItem?.teachesRecipes) {
      const recipesToLearn = [];
      if (dbItem.teachesRecipe) recipesToLearn.push(dbItem.teachesRecipe);
      if (dbItem.teachesRecipes) recipesToLearn.push(...dbItem.teachesRecipes);

      let learnedCount = 0;
      for (const rKey of recipesToLearn) {
        if (!newRecipes.includes(rKey)) {
          newRecipes.push(rKey);
          learnedCount++;
        }
      }
      
      if (learnedCount > 0) {
        msg += `Learned ${learnedCount} new crafting recipe(s)!`;
      } else {
        msg += `You already know all these recipes.`;
      }
    } else if (isBook) {
      msg += `Learned something new. (Check spells/skills)`;
    } else if (item.category === 'material') {
      msg += `Cannot be used directly. Use it in the Crafting menu.`;
      setLastRoll(msg);
      return;
    } else {
      msg += `No immediate effect, but consumed.`;
    }

    newInv[index].qty -= 1;
    if (newInv[index].qty <= 0) {
      newInv.splice(index, 1);
    }

    newHp = Math.min(100, Math.max(0, newHp));
    newEp = Math.min(maxEp, Math.max(0, newEp));

    setState({ ...state, hp: newHp, ep: newEp, effects: newEffects, infectedEndTime: newInfectedEndTime, inventory: newInv, learnedRecipes: newRecipes });
    setLastRoll(msg);
  };

  const triggerCharm = () => {
    const acc = state.accessory;
    if (!acc || acc === 'None') return;
    const dbItem = ITEM_DATABASE.find(i => i.name === acc);
    if (!dbItem || dbItem.category !== 'charm') return;

    let msg = `Triggered ${acc}! `;
    let newHp = state.hp;
    let newEp = state.ep;

    if (acc === 'Lucky Charm') {
      const roll = rollDice('1d4');
      msg += `Rolled a d4: ${roll}. Add this to your next attack roll.`;
    } else if (acc === 'Restorative Charm') {
      const heal = rollDice('1d4');
      const epLoss = rollDice('1d4');
      newHp = Math.min(100, newHp + heal);
      newEp = Math.max(0, newEp - epLoss);
      msg += `Healed ${heal} HP and lost ${epLoss} EP.`;
    } else if (acc === 'Vessel of Otherworldly Influence') {
      msg += `Passive effect: +5 Magical Endurance.`;
    } else if (acc === 'Vessel of Anxiety') {
      const roll = rollDice('1d6');
      msg += `Rolled a d6: ${roll}. Add this to your next attack roll.`;
    } else {
      msg += `No special trigger effect defined.`;
    }

    setState({ ...state, hp: newHp, ep: newEp });
    setLastRoll(msg);
  };

  const startCraft = (recipe: any) => {
    let canCraft = true;
    for (const ing of recipe.ingredients) {
      const total = state.inventory
        .filter(invItem => (invItem.itemKey || invItem.name.toLowerCase().replace(/\s+/g, '_')) === ing.key || invItem.name.toLowerCase() === ing.name.toLowerCase())
        .reduce((sum, invItem) => sum + invItem.qty, 0);
      if (total < ing.qty) {
        canCraft = false;
        break;
      }
    }
    if (!canCraft) return alert("Missing ingredients!");

    // --- BYPASS PUZZLE FOR ARTIFICERS ---
    if (state.charClass === 'Artificer') {
      let tempInv = JSON.parse(JSON.stringify(state.inventory));
      for (const ing of recipe.ingredients) {
        let needed = ing.qty;
        for (let i = 0; i < tempInv.length; i++) {
          const invKey = tempInv[i].itemKey || tempInv[i].name.toLowerCase().replace(/\s+/g, '_');
          if (invKey === ing.key || tempInv[i].name.toLowerCase() === ing.name.toLowerCase()) {
            const deduct = Math.min(needed, tempInv[i].qty);
            tempInv[i].qty -= deduct;
            needed -= deduct;
            if (needed <= 0) break;
          }
        }
      }
      tempInv = tempInv.filter((item: any) => item.qty > 0);

      const { newInv: finalInv, remaining } = addItemToInventory({
        name: recipe.name,
        qty: 1,
        key: recipe.key,
        category: recipe.category,
        note: recipe.note
      }, tempInv);

      if (remaining > 0) {
        alert("Inventory full! Crafted item lost.");
      } else {
        setLastRoll(`Crafted 1x ${recipe.name}!`);
      }
      setState({ ...state, inventory: finalInv });
      return; 
    }
    // -------------------------------------

    setCraftingRecipe(recipe);
    const isSimple = recipe.isSimple;

    if (isSimple) {
      setPuzzleType('norinori');
      const newGrid = generateNorinori();
      const blankGrid = newGrid.map(row => row.map(cell => ({ ...cell, isBlack: false })));
      setPuzzleGrid(blankGrid);
    } else {
      setPuzzleType('kurodoko');
      const newGrid = generateKurodoko(6);
      const blankGrid = newGrid.map(row => row.map(cell => ({ ...cell, isBlack: false })));
      setPuzzleGrid(blankGrid);
    }
    
    setShowPuzzle(true);
    setPuzzleError('');
    setShowHelp(false);
  };

  const checkPuzzle = () => {
    const isValid = puzzleType === 'norinori' ? isValidNorinori(puzzleGrid) : isValidKurodoko(puzzleGrid);
    
    let tempInv = JSON.parse(JSON.stringify(state.inventory));
    for (const ing of craftingRecipe.ingredients) {
      let needed = ing.qty;
      for (let i = 0; i < tempInv.length; i++) {
        const invKey = tempInv[i].itemKey || tempInv[i].name.toLowerCase().replace(/\s+/g, '_');
        if (invKey === ing.key || tempInv[i].name.toLowerCase() === ing.name.toLowerCase()) {
          const deduct = Math.min(needed, tempInv[i].qty);
          tempInv[i].qty -= deduct;
          needed -= deduct;
          if (needed <= 0) break;
        }
      }
    }
    tempInv = tempInv.filter((item: any) => item.qty > 0);

    if (isValid) {
      const { newInv: finalInv, remaining } = addItemToInventory({
        name: craftingRecipe.name,
        qty: 1,
        key: craftingRecipe.key,
        category: craftingRecipe.category,
        note: craftingRecipe.note
      }, tempInv);

      if (remaining > 0) {
        alert("Inventory full! Crafted item lost.");
      } else {
        setLastRoll(`Crafted 1x ${craftingRecipe.name}!`);
      }
      setState({ ...state, inventory: finalInv });
    } else {
      setState({ ...state, inventory: tempInv });
      setLastRoll("Crafting failed! The materials were destroyed by the failed process.");
    }
    setShowPuzzle(false);
  };

  const toggleEffect = (effect: string) => {
    if (state.effects.includes(effect)) {
      setState({ 
        ...state, 
        effects: state.effects.filter(e => e !== effect),
        infectedEndTime: effect === 'Infected' ? 0 : state.infectedEndTime 
      });
    } else {
      if (state.effects.length >= 5) return alert("Max 5 effects allowed.");
      setState({ 
        ...state, 
        effects: [...state.effects, effect],
        infectedEndTime: effect === 'Infected' ? Date.now() + 3600000 : state.infectedEndTime
      });
    }
  };

  const triggerEffects = () => {
    let log: string[] = [];
    let newHp = state.hp;
    let newEp = state.ep;
    
    for (const eff of state.effects) {
      const data = STATUS_EFFECTS[eff];
      if (data.trigger === 'damage') {
        const dmg = data.dice ? rollDice(data.dice) : data.fixed;
        newHp = Math.max(0, newHp - dmg);
        log.push(`${eff}: -${dmg} HP`);
      } else if (data.trigger === 'heal') {
        const heal = rollDice(data.dice);
        newHp += heal;
        log.push(`${eff}: +${heal} HP`);
      } else if (data.trigger === 'damage_ep') {
        newHp = Math.max(0, newHp - data.fixed);
        newEp += data.ep;
        log.push(`${eff}: -${data.fixed} HP, +${data.ep} EP`);
      }
    }
    
    if (log.length === 0) return alert("No active damage/healing effects triggered.");
    
    newHp = Math.min(100, Math.max(0, newHp));
    newEp = Math.min(maxEp, Math.max(0, newEp));

    setState({ ...state, hp: newHp, ep: newEp });
    setLastRoll(log.join("\n"));
  };

  const getSpellStatus = (spell: any): { allowed: boolean, reason: string } => {
    const currentSpells = state.learnedSpells;
    if (currentSpells.some((s: any) => s.name === spell.name)) return { allowed: false, reason: '' };
    if (spell.level > state.level) return { allowed: false, reason: `Requires Level ${spell.level}` };

    const levelSpells = currentSpells.filter((s: any) => s.level === spell.level);
    if (levelSpells.length >= maxSpellSlots) return { allowed: false, reason: `Max ${maxSpellSlots} spells of this level` };

    const spellNames = currentSpells.map((s: any) => s.name);
    
    const replaces = 
      (spell.name === 'Injuring' && spellNames.includes('Harming')) ||
      (spell.name === 'Arcane Shield' && spellNames.some((n: string) => ['Light Shield', 'Simple Protection'].includes(n))) ||
      (['Tearing', 'Terror of Souls'].includes(spell.name) && spellNames.includes('Injuring'));

    if (!replaces) {
      if (spellNames.includes('Ultimate Healing')) return { allowed: false, reason: 'Blocked by Ultimate Healing' };
      if (spellNames.includes('Light Shield') && currentSpells.length >= 2) return { allowed: false, reason: 'Blocked by Light Shield' };
      if (spell.name === 'Ultimate Healing' && currentSpells.length > 0) return { allowed: false, reason: 'Must be your only spell' };
      if (spell.name === 'Light Shield' && currentSpells.length < 2) return { allowed: false, reason: 'Requires 2 other spells' };

      const hasLimiter = spellNames.some((n: string) => ['Harming', 'Simple Protection', 'Injuring', 'Arcane Shield'].includes(n));
      if (hasLimiter && currentSpells.length >= 2) return { allowed: false, reason: 'A learned spell limits you to 2 total spells' };
      if (['Harming', 'Simple Protection', 'Injuring', 'Arcane Shield'].includes(spell.name) && currentSpells.length >= 2) return { allowed: false, reason: 'This spell limits you to 2 total spells' };

      if (spell.level === 6 && levelSpells.length >= 1) return { allowed: false, reason: 'Only 1 Level 6 spell allowed' };
    } else {
      if (spell.level === 6 && (spellNames.includes('Tearing') || spellNames.includes('Terror of Souls'))) {
         return { allowed: false, reason: 'Already have a Level 6 spell' };
      }
    }

    return { allowed: true, reason: '' };
  };

  const cardStyle = "bg-white border border-gray-300 p-4 space-y-3";
  const inputStyle = "w-full bg-white text-black border border-gray-400 p-2 text-sm focus:outline-none focus:border-black";
  const labelStyle = "text-xs font-bold text-gray-700 mb-1";
  const btnSuccess = "w-full bg-blue-600 text-white font-bold p-2 text-sm hover:bg-blue-700";
  
  const ListItem = ({ item, type }: { item: any, type: 'spell' | 'skill' }) => {
    const isLearned = type === 'spell' 
      ? state.learnedSpells.some((s: any) => s.name === item.name)
      : state.learnedSkills.some((s: any) => s.name === item.name);

    const status = type === 'spell' ? getSpellStatus(item) : { allowed: true, reason: '' };

    const handleToggle = () => {
      if (isLearned) {
        if (type === 'spell') setState({ ...state, learnedSpells: state.learnedSpells.filter((s: any) => s.name !== item.name) });
        else setState({ ...state, learnedSkills: state.learnedSkills.filter((s: any) => s.name !== item.name) });
      } else {
        if (type === 'spell') {
          if (!status.allowed) return;
          let newSpells = [...state.learnedSpells];
          if (item.name === 'Injuring') newSpells = newSpells.filter((s: any) => s.name !== 'Harming');
          if (item.name === 'Arcane Shield') newSpells = newSpells.filter((s: any) => !['Light Shield', 'Simple Protection'].includes(s.name));
          if (['Tearing', 'Terror of Souls'].includes(item.name)) {
            newSpells = newSpells.filter((s: any) => !['Injuring', 'Tearing', 'Terror of Souls'].includes(s.name));
          }
          setState({ ...state, learnedSpells: [...newSpells, item] });
        } else {
          setState({ ...state, learnedSkills: [...state.learnedSkills, item] });
        }
      }
    };

    return (
      <div className="flex justify-between items-center py-3 border-b border-gray-200 last:border-0">
        <div className="pr-3">
          <p className={`font-bold text-sm ${isLearned ? 'text-blue-600' : 'text-gray-900'}`}>{item.name}</p>
          <p className="text-xs text-gray-600 mt-0.5">{item.ep} EP - {item.note}</p>
          {!isLearned && !status.allowed && status.reason && (
            <p className="text-[10px] text-red-600 mt-1 font-bold">{status.reason}</p>
          )}
        </div>
        <div className="flex gap-2">
          {isLearned && <button onClick={() => useMove(item)} className="bg-gray-200 hover:bg-gray-300 border border-gray-400 text-black px-3 py-1 text-xs font-bold">Use</button>}
          
          {isLearned ? (
            <button onClick={handleToggle} className="px-3 py-1 text-xs font-bold bg-red-100 hover:bg-red-200 border border-red-400 text-red-700">
              Forget
            </button>
          ) : (
            <button 
              onClick={handleToggle} 
              disabled={!status.allowed}
              className={`px-3 py-1 text-xs font-bold border ${
                status.allowed 
                  ? 'bg-blue-100 hover:bg-blue-200 border-blue-400 text-blue-700' 
                  : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
              }`}
            >
              Learn
            </button>
          )}
        </div>
      </div>
    );
  };

  const suggestions = showSuggestions ? searchItems(itemNameInput) : [];
  const resolvedPreview = itemNameInput.trim() ? resolveItem(itemNameInput) : null;
  const willRename =
    resolvedPreview &&
    resolvedPreview.name.toLowerCase() !== itemNameInput.trim().toLowerCase();

  const accItem = ITEM_DATABASE.find(i => i.name === state.accessory);
  const isCharmEquipped = accItem && accItem.category === 'charm';

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
      <div className="max-w-md mx-auto p-4 pb-24">
        <h1 className="text-xl font-bold text-center mb-1">T.A.D. Sheet</h1>
        {state.name.trim() && (
          <p className="text-center text-sm text-gray-600 mb-3 italic">{state.name.trim()}</p>
        )}
        {!state.name.trim() && <div className="mb-3" />}

        <div className="flex bg-white border border-gray-300 mb-4 p-1">
          {[0, 1, 2].map(slot => (
            <button key={slot} onClick={() => setCurrentSlot(slot)}
              className={`flex-1 py-1 text-sm font-bold ${
                currentSlot === slot ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >Slot {slot + 1}</button>
          ))}
        </div>

        {lastRoll && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-5 border border-gray-300">
              <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
                <span className="font-bold text-blue-700 text-lg">RESULT</span>
                <button onClick={() => setLastRoll(null)} className="text-gray-500 hover:text-black font-bold text-2xl leading-none">&times;</button>
              </div>
              <div className="text-sm whitespace-pre-wrap max-h-64 overflow-y-auto font-mono">
                {lastRoll}
              </div>
              <button onClick={() => setLastRoll(null)} className="mt-5 w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition-colors">
                OK
              </button>
            </div>
          </div>
        )}

        {/* --- CRAFTING PUZZLE MODAL --- */}
        {showPuzzle && craftingRecipe && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-5 rounded-lg w-full max-w-sm relative">
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-bold text-lg">Crafting: {craftingRecipe.name}</h2>
                <button 
                  onClick={() => setShowHelp(!showHelp)}
                  className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 font-bold flex items-center justify-center text-sm hover:bg-gray-300"
                >
                  ?
                </button>
              </div>
              
              {showHelp ? (
                <div className="bg-blue-50 border border-blue-200 p-3 mb-4 text-xs text-blue-900 rounded shadow-inner">
                  <p className="font-bold mb-1">{puzzleType === 'norinori' ? 'Norinori Rules:' : 'Kurodoko Rules:'}</p>
                  {puzzleType === 'norinori' ? (
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Shade exactly 2 cells in each colored region.</li>
                      <li>The two shaded cells in a region must be orthogonally adjacent.</li>
                      <li>Shaded cells from different regions cannot touch (even diagonally, but only checking orthogonally here).</li>
                    </ul>
                  ) : (
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Numbers indicate how many white cells are visible from that cell (including itself) in all 4 directions.</li>
                      <li>Shade cells to block visibility.</li>
                      <li>Shaded cells cannot touch each other (orthogonally).</li>
                      <li>All white cells must be connected.</li>
                    </ul>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-500 mb-4 text-center">
                  {state.charClass === 'Artificer' ? 'Artificer: Solve the 6x6 Norinori grid.' : 'Non-crafter: Solve the 6x6 Kurodoko grid.'}
                  <br/>Tap cells to shade them black. Press ? for rules.
                </p>
              )}
              
              <div className="grid mx-auto mb-4" style={{ gridTemplateColumns: `repeat(6, minmax(0, 1fr))`, maxWidth: '300px' }}>
                {puzzleGrid.map((row, r) => (
                  row.map((cell, c) => {
                    const isNorinori = puzzleType === 'norinori';
                    
                    let borderClasses = "";
                    if (isNorinori) {
                      if (r === 0 || puzzleGrid[r-1][c].region !== cell.region) borderClasses += " border-t-2 border-t-black";
                      if (c === 0 || puzzleGrid[r][c-1].region !== cell.region) borderClasses += " border-l-2 border-l-black";
                      if (r === 5 || puzzleGrid[r+1][c].region !== cell.region) borderClasses += " border-b-2 border-b-black";
                      if (c === 5 || puzzleGrid[r][c+1].region !== cell.region) borderClasses += " border-r-2 border-r-black";
                    } else {
                      borderClasses = " border border-gray-400";
                    }

                    const bgClass = cell.isBlack 
                      ? 'bg-gray-400' 
                      : 'bg-white hover:bg-gray-100';
                    
                    return (
                      <button
                        key={`${r}-${c}`}
                        onClick={() => {
                          if (isNorinori || cell.num === 0) {
                            let newGrid = [...puzzleGrid];
                            newGrid[r][c].isBlack = !newGrid[r][c].isBlack;
                            setPuzzleGrid(newGrid);
                          }
                        }}
                        className={`aspect-square flex items-center justify-center text-lg font-bold ${bgClass} ${borderClasses} ${
                          (!isNorinori && cell.num > 0) ? 'cursor-not-allowed text-gray-900' : 'cursor-pointer text-gray-900'
                        }`}
                      >
                        {(!isNorinori && cell.num > 0) ? cell.num : ''}
                      </button>
                    );
                  })
                ))}
              </div>
              
              {puzzleError && <p className="text-red-600 text-xs text-center mb-2 font-bold">{puzzleError}</p>}
              
              <div className="flex gap-2">
                <button onClick={() => setShowPuzzle(false)} className="flex-1 bg-gray-200 py-2 font-bold border border-gray-400">Cancel</button>
                <button onClick={checkPuzzle} className="flex-1 bg-blue-600 text-white py-2 font-bold border border-blue-700 hover:bg-blue-700">Submit</button>
              </div>
            </div>
          </div>
        )}
        {/* -------------------------------------- */}

        {tab === 'main' && (
          <div className="space-y-4">
            <div className={cardStyle}>
              <div className="flex flex-col">
                <label className={labelStyle}>Character Name</label>
                <input
                  className={inputStyle}
                  placeholder="put the name here"
                  value={state.name}
                  maxLength={40}
                  onChange={e => setState({ ...state, name: e.target.value })}
                />
              </div>

              <div className="flex flex-col">
                <label className={labelStyle}>Class</label>
                <select className={inputStyle} value={state.charClass} onChange={e => setState({...state, charClass: e.target.value})}>
                  {Object.keys(CLASS_STATS).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <label className={`${labelStyle} mb-0`}>Level</label>
                    <SmartNumberInput
                      className="w-10 text-xs text-center border border-gray-300 rounded px-1"
                      value={levelStep}
                      min={1}
                      onCommit={setLevelStep}
                      title="Step"
                    />
                  </div>
                  <div className="flex">
                    <button onClick={() => adjustLevel(-levelStep)} className="bg-gray-200 border border-gray-400 px-2 text-black font-bold">-</button>
                    <SmartNumberInput
                      className={`${inputStyle} text-center border-x-0 px-1`}
                      value={state.level}
                      min={1}
                      onCommit={n => setState({ ...state, level: n })}
                    />
                    <button onClick={() => adjustLevel(levelStep)} className="bg-gray-200 border border-gray-400 px-2 text-black font-bold">+</button>
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <label className={`${labelStyle} mb-0`}>HP</label>
                    <SmartNumberInput
                      className="w-10 text-xs text-center border border-gray-300 rounded px-1"
                      value={hpStep}
                      min={1}
                      onCommit={setHpStep}
                      title="Step"
                    />
                  </div>
                  <div className="flex">
                    <button onClick={() => adjustStat('hp', -hpStep)} className="bg-gray-200 border border-gray-400 px-2 text-black font-bold">-</button>
                    <SmartNumberInput
                      className={`${inputStyle} text-center border-x-0 px-1`}
                      value={state.hp}
                      min={0}
                      max={100}
                      onCommit={n => setState({ ...state, hp: Math.min(100, Math.max(0, n)) })}
                    />
                    <button onClick={() => adjustStat('hp', hpStep)} className="bg-gray-200 border border-gray-400 px-2 text-black font-bold">+</button>
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <label className={`${labelStyle} mb-0`}>EP</label>
                    <SmartNumberInput
                      className="w-10 text-xs text-center border border-gray-300 rounded px-1"
                      value={epStep}
                      min={1}
                      onCommit={setEpStep}
                      title="Step"
                    />
                  </div>
                  <div className="flex">
                    <button onClick={() => adjustStat('ep', -epStep)} className="bg-gray-200 border border-gray-400 px-2 text-black font-bold">-</button>
                    <SmartNumberInput
                      className={`${inputStyle} text-center border-x-0 px-1`}
                      value={state.ep}
                      min={0}
                      max={maxEp}
                      onCommit={n => setState({ ...state, ep: Math.min(maxEp, Math.max(0, n)) })}
                    />
                    <button onClick={() => adjustStat('ep', epStep)} className="bg-gray-200 border border-gray-400 px-2 text-black font-bold">+</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-300 p-4 text-sm space-y-2">
              <div className="grid grid-cols-2 gap-y-1 text-gray-800">
                <p>Max EP: <span className="font-bold">{maxEp}</span></p>
                <p>Def: <span className="font-bold">{totalDef}</span></p>
                <p>Phys End: <span className="font-bold">{physEnd}{levelBonus}</span></p>
                <p>Crit: <span className="font-bold">{totalCrit}</span></p>
                <p>Mag End: <span className="font-bold">{magEnd}{levelBonus}</span></p>
                <p>Spd: <span className="font-bold">{totalSpd}</span></p>
                <p>Agi: <span className="font-bold">{finalAgi}</span></p>
              </div>
              <div className="pt-2 border-t border-gray-200 mt-1">
                <p>EP Debuff: <span className={isDowned ? 'text-red-600 font-bold text-lg' : epDebuffs.dmg !== 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                  {isDowned ? 'DOWNED' : epDebuffs.dmg !== 0 ? `${epDebuffs.dmg} Dmg, ${epDebuffs.agi} Agi` : 'None'}
                </span></p>
              </div>
            </div>

            <div className={cardStyle}>
              <h2 className="text-sm font-bold border-b border-gray-300 pb-2 mb-2">Equipment</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col col-span-2">
                  <label className={labelStyle}>Weapon</label>
                  <select className={inputStyle} value={state.weapon} onChange={e => setState({...state, weapon: e.target.value})}>
                    {Object.keys(WEAPONS).map(w => <option key={w}>{w}</option>)}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className={labelStyle}>Head</label>
                  <select className={inputStyle} value={state.head} onChange={e => setState({...state, head: e.target.value})}>
                    {Object.keys(HEAD_ARMOR).map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className={labelStyle}>Body</label>
                  <select className={inputStyle} value={state.body} onChange={e => setState({...state, body: e.target.value})}>
                    {Object.keys(BODY_ARMOR).map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div className="flex flex-col col-span-2">
                  <label className={labelStyle}>Shield</label>
                  <select className={inputStyle} value={state.shield} onChange={e => setState({...state, shield: e.target.value})}>
                    {Object.keys(SHIELD_ARMOR).map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div className="flex flex-col col-span-2">
                  <label className={labelStyle}>Accessory</label>
                  <select 
                    className={inputStyle} 
                    value={state.accessory || 'None'} 
                    onChange={e => {
                      const newAcc = e.target.value;
                      if (newAcc === state.accessory) return;
                      
                      let newInv = [...state.inventory];
                      
                      if (state.accessory && state.accessory !== 'None') {
                        const oldDbItem = ITEM_DATABASE.find(i => i.name === state.accessory);
                        if (oldDbItem) {
                          const { newInv: invWithOld } = addItemToInventory({
                            name: oldDbItem.name, qty: 1, key: oldDbItem.key, category: oldDbItem.category, note: oldDbItem.note
                          }, newInv);
                          newInv = invWithOld;
                        } else {
                          const { newInv: invWithOld } = addItemToInventory({
                            name: state.accessory, qty: 1
                          }, newInv);
                          newInv = invWithOld;
                        }
                      }
                      
                      setState({ ...state, accessory: newAcc, inventory: newInv });
                    }}
                  >
                    <option value="None">None</option>
                    {state.accessory && state.accessory !== 'None' && (
                      <option value={state.accessory}>{state.accessory}</option>
                    )}
                  </select>
                </div>
                <div className="flex flex-col col-span-2 mt-2">
                  <button
                    onClick={triggerCharm}
                    disabled={!isCharmEquipped}
                    className={`w-full py-2 text-sm font-bold border ${
                      isCharmEquipped 
                        ? 'bg-purple-100 hover:bg-purple-200 border-purple-400 text-purple-700' 
                        : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Trigger Charm
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-300 p-4 flex justify-between items-center">
              <div>
                <p className="font-bold text-sm">Damage: <span className="text-blue-600">{die} {finalDmg >= 0 ? `+${finalDmg}` : finalDmg}</span></p>
              </div>
              <div className="flex gap-2">
                <button onClick={rollAttack} className="bg-gray-200 hover:bg-gray-300 border border-gray-400 text-black font-bold px-3 py-1 text-xs">Roll Atk</button>
                <button onClick={rollDamage} className="bg-gray-200 hover:bg-gray-300 border border-gray-400 text-black font-bold px-3 py-1 text-xs">Roll Dmg</button>
              </div>
            </div>

            <div className="bg-white border border-gray-300 p-4 text-xs space-y-1">
              <h2 className="text-sm font-bold border-b border-gray-300 pb-2 mb-2">Equipped Properties</h2>
              {wData.properties && <p><span className="font-bold">Weapon:</span> {wData.properties}</p>}
              {hData.passive && <p><span className="font-bold">Head:</span> {hData.passive}</p>}
              {bData.passive && <p><span className="font-bold">Body:</span> {bData.passive}</p>}
              {sData.passive && <p><span className="font-bold">Shield:</span> {sData.passive}</p>}
              
              {(() => {
                const accData = ITEM_DATABASE.find(i => i.name === state.accessory);
                return accData?.note ? <p><span className="font-bold">Accessory:</span> {accData.note}</p> : null;
              })()}

              {(!wData.properties && !hData.passive && !bData.passive && !sData.passive && !ITEM_DATABASE.find(i => i.name === state.accessory)?.note) && (
                <p className="text-gray-500 italic">No special properties on current equipment.</p>
              )}
            </div>
            
            <div className={cardStyle}>
              <h2 className="text-sm font-bold border-b border-gray-300 pb-2 mb-2">Reactions</h2>
              {activeReactions.map((r, i) => (
                 <div key={i} className="flex justify-between items-center text-xs pb-2 border-b border-gray-100 last:border-0">
                   <div className="pr-2">
                     <span className="font-bold">{r.name} ({r.ep} EP):</span> {r.note}
                   </div>
                   <button onClick={() => useMove(r)} className="bg-gray-200 hover:bg-gray-300 border border-gray-400 text-black font-bold px-2 py-1 text-[10px]">Use</button>
                 </div>
              ))}
            </div>

            <button onClick={saveGame} className={btnSuccess}>Save to Slot {currentSlot + 1}</button>
          </div>
        )}

        {tab === 'inventory' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold border-b border-gray-300 pb-2">Inventory ({state.inventory.length}/10)</h2>
            <div className="bg-white border border-gray-300">
              {state.inventory.length === 0 ? (
                <p className="text-gray-500 text-sm p-4 text-center">Inventory is empty.</p>
              ) : (
                state.inventory.map((item, i) => {
                  const isUsable = ['consumable', 'equipment', 'book', 'charm', 'weapon', 'shield', 'armor'].includes(item.category || '');
                  return (
                    <div key={i} className="flex justify-between items-start p-3 border-b border-gray-200 last:border-0">
                      <div className="pr-3 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{item.name}</span>
                          <span className="text-gray-500 text-xs">x{item.qty}</span>
                          {item.category && (
                            <span className="text-[9px] uppercase tracking-wide text-gray-500 border border-gray-300 px-1 leading-tight">
                              {item.category}
                            </span>
                          )}
                        </div>
                        {item.note && <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{item.note}</p>}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {isUsable && (
                          <button 
                            className="bg-blue-100 hover:bg-blue-200 border border-blue-400 text-blue-700 font-bold px-3 py-1 text-xs" 
                            onClick={() => handleUseItem(i)}
                          >
                            Use
                          </button>
                        )}
                        <button 
                          className="bg-red-100 hover:bg-red-200 border border-red-400 text-red-700 font-bold px-3 py-1 text-xs" 
                          onClick={() => {
                            const newInv = [...state.inventory];
                            newInv.splice(i, 1);
                            setState({...state, inventory: newInv});
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="bg-white border border-gray-300 p-4 space-y-2">
              <h3 className="text-sm font-bold mb-1">Add Item</h3>
              
              <div className="flex gap-2 items-end">
                <div className="flex-1 flex flex-col relative">
                  <label className={labelStyle}>Name</label>
                  <input
                    className={inputStyle}
                    placeholder="e.g. Wood, Healing Potion..."
                    value={itemNameInput}
                    onChange={e => { setItemNameInput(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-400 shadow-lg z-30 max-h-56 overflow-y-auto">
                      {suggestions.map(s => (
                        <button
                          key={s.key}
                          type="button"
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => { setItemNameInput(s.name); setShowSuggestions(false); }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 border-b border-gray-100 last:border-0"
                        >
                          <div className="flex justify-between items-center gap-2">
                            <span className="font-bold text-gray-900">{s.name}</span>
                            <span className="text-[9px] uppercase text-gray-500 shrink-0">{s.category}</span>
                          </div>
                          {s.note && <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{s.note}</p>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="w-20 flex flex-col">
                  <label className={labelStyle}>Qty</label>
                  <input
                    type="number"
                    className={inputStyle}
                    value={itemQtyInput}
                    onChange={e => setItemQtyInput(e.target.value)}
                  />
                </div>
                
                <button onClick={addItem} className="bg-gray-200 hover:bg-gray-300 border border-gray-400 text-black font-bold px-4 py-2 text-sm">
                  Add
                </button>
              </div>

              {willRename ? (
                <p className="text-[11px] text-blue-600 font-semibold mt-1">
                  Will add: {resolvedPreview!.name} <span className="text-gray-500 font-normal">({resolvedPreview!.category})</span>
                </p>
              ) : (
                <p className="text-[10px] text-gray-500 mt-1">
                  Known items auto-fill canonical names &amp; metadata.
                </p>
              )}
            </div>

            <h2 className="text-lg font-bold border-b border-gray-300 pb-2 mt-6">Crafting</h2>
            <div className="bg-white border border-gray-300 p-4">
              {ALL_CRAFTING_RECIPES.map(recipe => {
                const isKnown = state.learnedRecipes.includes(recipe.key);
                if (!isKnown) return null;

                const canCraft = recipe.ingredients.every(ing => {
                  const total = state.inventory
                    .filter(invItem => (invItem.itemKey || invItem.name.toLowerCase().replace(/\s+/g, '_')) === ing.key || invItem.name.toLowerCase() === ing.name.toLowerCase())
                    .reduce((sum, invItem) => sum + invItem.qty, 0);
                  return total >= ing.qty;
                });

                return (
                  <div key={recipe.key} className="border-b border-gray-200 last:border-0 py-3">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{recipe.name}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{recipe.note}</p>
                      </div>
                      <button
                        onClick={() => startCraft(recipe)}
                        disabled={!canCraft}
                        className={`px-3 py-1 text-xs font-bold border whitespace-nowrap ${
                          canCraft 
                            ? 'bg-green-100 hover:bg-green-200 border-green-400 text-green-700' 
                            : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Craft
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[10px] mt-1 text-gray-600">
                      <span className="font-semibold">Requires:</span>
                      {recipe.ingredients.map((ing, idx) => {
                        const owned = state.inventory
                          .filter(invItem => (invItem.itemKey || invItem.name.toLowerCase().replace(/\s+/g, '_')) === ing.key || invItem.name.toLowerCase() === ing.name.toLowerCase())
                          .reduce((sum, invItem) => sum + invItem.qty, 0);
                        return (
                          <span key={idx} className={owned >= ing.qty ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                            {ing.qty}x {ing.name} ({owned})
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {ALL_CRAFTING_RECIPES.filter(r => state.learnedRecipes.includes(r.key)).length === 0 && (
                <p className="text-gray-500 text-sm text-center">No recipes known.</p>
              )}
            </div>
          </div>
        )}

        {tab === 'spells' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold border-b border-gray-300 pb-2">Spellbook</h2>
            {state.learnedSpells.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-blue-600 mb-2 uppercase tracking-wide">Learned Spells</h3>
                <div className="bg-blue-50 border border-blue-200 px-4 shadow-sm">
                  {state.learnedSpells.map((sp, i) => <ListItem key={`learned-${i}`} item={sp} type="spell" />)}
                </div>
              </div>
            )}
            <h3 className="text-sm font-bold text-gray-600 mb-2 uppercase tracking-wide">Available Spells</h3>
            <div className="bg-white border border-gray-300 px-4">
              {SPELLBOOK.map((sp, i) => <ListItem key={i} item={sp} type="spell" />)}
            </div>
          </div>
        )}

        {tab === 'skills' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold border-b border-gray-300 pb-2">Scroll Skills</h2>
            {state.learnedSkills.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-green-600 mb-2 uppercase tracking-wide">Learned Skills</h3>
                <div className="bg-green-50 border border-green-200 px-4 shadow-sm">
                  {state.learnedSkills.map((sk, i) => <ListItem key={`learned-${i}`} item={sk} type="skill" />)}
                </div>
              </div>
            )}
            <h3 className="text-sm font-bold text-gray-600 mb-2 uppercase tracking-wide">Available Skills</h3>
            <div className="bg-white border border-gray-300 px-4">
              {SCROLL_SKILLS.map((sk, i) => <ListItem key={i} item={sk} type="skill" />)}
            </div>
          </div>
        )}

        {tab === 'effects' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold border-b border-gray-300 pb-2">Status Effects ({state.effects.length}/5)</h2>
            <div className="bg-white border border-gray-300 p-4">
               <button onClick={triggerEffects} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold p-2 text-sm mb-4">Trigger Active Effects</button>
               <div className="space-y-3">
                 {Object.keys(STATUS_EFFECTS).map(eff => {
                   const isActive = state.effects.includes(eff);
                   return (
                     <div key={eff} className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-0">
                       <div>
                         <p className={`text-sm font-bold ${isActive ? 'text-red-600' : ''}`}>{eff}</p>
                         <p className="text-[10px] text-gray-500">{STATUS_EFFECTS[eff].desc}</p>
                         {eff === 'Infected' && isActive && (
                           <p className="text-red-600 font-bold font-mono text-sm mt-1">{formatTime(infectedSeconds)}</p>
                         )}
                       </div>
                       <button onClick={() => toggleEffect(eff)} className={`px-3 py-1 text-xs font-bold border ${isActive ? 'bg-red-100 border-red-400 text-red-700 hover:bg-red-200' : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'}`}>
                         {isActive ? 'Remove' : 'Add'}
                       </button>
                     </div>
                   )
                 })}
               </div>
            </div>
          </div>
        )}

        {tab === 'curses' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold border-b border-gray-300 pb-2">Curses</h2>
            <p className="text-xs text-gray-500 mb-2">Once activated, a curse is permanent for this save slot. Choose wisely.</p>
            <div className="bg-white border border-gray-300 p-4">
              <div className="space-y-4">
                {CURSES.map((curse, i) => {
                  const isActive = state.activeCurse === curse.name;
                  return (
                    <div key={i} className={`p-3 border ${isActive ? 'border-purple-400 bg-purple-50' : 'border-gray-200'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className={`font-bold text-sm ${isActive ? 'text-purple-700' : 'text-gray-900'}`}>{curse.name}</h3>
                        {!isActive && (
                          <button 
                            disabled={state.activeCurse !== null}
                            onClick={() => {
                              if (confirm(`Are you sure? Activating ${curse.name} is PERMANENT for this save slot.`)) {
                                setState({ ...state, activeCurse: curse.name });
                              }
                            }}
                            className={`px-3 py-1 text-xs font-bold border whitespace-nowrap ${
                              state.activeCurse !== null 
                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                                : 'bg-purple-600 text-white border-purple-700 hover:bg-purple-700'
                            }`}
                          >
                            Activate
                          </button>
                        )}
                        {isActive && <span className="text-xs font-bold text-purple-600 border border-purple-300 px-2 py-0.5 bg-white">ACTIVE</span>}
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{curse.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === 'notes' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold border-b border-gray-300 pb-2">Game Notes</h2>
            <textarea 
              className={`${inputStyle} h-64 resize-none`}
              placeholder="Write session notes here..."
              value={state.notes}
              onChange={e => setState({...state, notes: e.target.value})}
            />
            <button onClick={saveGame} className={btnSuccess}>Save to Slot {currentSlot + 1}</button>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 flex justify-around z-40">
          <button onClick={() => setTab('main')} className={`flex-1 py-3 text-[10px] font-bold ${tab === 'main' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Main</button>
          <button onClick={() => setTab('inventory')} className={`flex-1 py-3 text-[10px] font-bold ${tab === 'inventory' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Inv</button>
          <button onClick={() => setTab('spells')} className={`flex-1 py-3 text-[10px] font-bold ${tab === 'spells' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Spells</button>
          <button onClick={() => setTab('skills')} className={`flex-1 py-3 text-[10px] font-bold ${tab === 'skills' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Skills</button>
          <button onClick={() => setTab('effects')} className={`flex-1 py-3 text-[10px] font-bold ${tab === 'effects' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Effects</button>
          <button onClick={() => setTab('curses')} className={`flex-1 py-3 text-[10px] font-bold ${tab === 'curses' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}>Curses</button>
          <button onClick={() => setTab('notes')} className={`flex-1 py-3 text-[10px] font-bold ${tab === 'notes' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Notes</button>
        </div>
      </div>
    </div>
  );
}