export const CLASS_STATS: Record<string, any> = {
  Fighter:   { max_ep: 95, phys_end: 3,  mag_end: -9, agility: 0, weight: 'Heavy' },
  Rogue:     { max_ep: 80, phys_end: 2,  mag_end: -9, agility: 2, weight: 'Light' },
  Mage:      { max_ep: 80, phys_end: -2, mag_end: 5,  agility: 0, weight: 'N/A' },
  Ranger:    { max_ep: 85, phys_end: 1,  mag_end: -9, agility: 3, weight: 'Light' },
  Artificer: { max_ep: 90, phys_end: 0,  mag_end: 2,  agility: 0, weight: 'Light' },
};

export const WEAPONS: Record<string, any> = {
  'Unarmed':         { damage: 0, attack: 0, speed: 0, properties: '', grants: [] },
  'Short Sword':     { damage: 4, attack: 0, speed: 0, properties: 'Stab: -3 dmg, +3 atk.', grants: ['Stab'] },
  'Morning Star':    { damage: 8, attack: 0, speed: 0, properties: '+2 EP on use.', grants: [] },
  'Longsword':       { damage: 6, attack: 0, speed: 0, properties: '+1 EP on use.', grants: [] },
  'Throwing Spear':  { damage: 5, attack: 0, speed: 0, properties: '+1 EP use. +4 dmg thrown. +1 atk thrown.', grants: [] },
  'Dagger':          { damage: 3, attack: 0, speed: 0, properties: 'No EP use. Backstab: d20+Agility >15 = +3dmg/+2EP.', grants: ['Backstab'] },
  'Shortbow':        { damage: 5, attack: 0, speed: 0, properties: '+1 EP nock. Charged: +1 dmg/turn. Breaks 2 turns (+5 EP).', grants: ['Charged Shot'] },
  'Light Crossbow':  { damage: 5, attack: 0, speed: 0, properties: '+2 EP reload, +1 EP use.', grants: [] },
  'Long Staff':      { damage: 1, attack: 0, speed: 0, properties: 'Stance: +d4 Def 1 turn. +3 EP if attacked.', grants: ['Staff Stance'] },
  'Nail Hammer':     { damage: 5, attack: 0, speed: 0, properties: '+2 EP use. Nail/Hammer: d20 >10 = +d6 dmg/+2 EP.', grants: ['Nail & Hammer'] },
  'Wrench':          { damage: 5, attack: 0, speed: 0, properties: '+3 EP use. -2 EP on Construct Spells.', grants: [] },
  'Cleaver':         { damage: 5, attack: 0, speed: 0, properties: 'On hit d6 >4 = Bleeding.', grants: [] },
  'Zweihandler':     { damage: 8, attack: 4, speed: -1, properties: 'Heavy Blade. +4 atk, -1 Spd.', grants: [] },
  'Spear':           { damage: 5, attack: 6, speed: 0, properties: 'Heavy Spear. Can use Charge.', grants: ['Charge'] },
};

export const HEAD_ARMOR: Record<string, any> = {
  'None': { bonus: 0, speed: 0, attack: 0, passive: '', grants: [] },
  'Leather Helmet': { bonus: 2, speed: 0, attack: 0, passive: 'Weak to Blunt (+3).', grants: [] },
  'Tough Helmet': { bonus: 4, speed: -2, attack: 0, passive: 'Heavy (-2 Spd, -4 Mage/Rogue).', grants: [] },
  'Plate Helmet': { bonus: 5, speed: -2, attack: 0, passive: 'Additional +5 Armor to Plate.', grants: [] }
};

export const BODY_ARMOR: Record<string, any> = {
  'None': { bonus: 0, speed: 0, attack: 0, passive: '', grants: [] },
  'Reinforced Cloth Robe': { bonus: 1, speed: 0, attack: 0, passive: 'Light. +3 Fire vuln.', grants: [] },
  'Light Shoulder Plates': { bonus: 2, speed: 0, attack: -1, passive: '-1 Attack rolls.', grants: [] },
  'Tough Leather Vest': { bonus: 3, speed: -2, attack: 0, passive: 'Heavy (-2 Spd, -4 Mage/Rogue). Weak to Blunt (+2).', grants: [] },
  'Plate Body Armor': { bonus: 8, speed: -4, attack: 0, passive: 'Heavy. -4 Speed.', grants: [] }
};

export const SHIELD_ARMOR: Record<string, any> = {
  'None': { bonus: 0, speed: 0, attack: 0, passive: '', grants: [] },
  'Buckler': { bonus: 1, speed: 0, attack: 0, passive: 'Learn Parry.', grants: ['Parry'] },
  'Wooden Shield': { bonus: 2, speed: 0, attack: 0, passive: 'Weak to Blunt (+3).', grants: [] },
  'Standard-issue Shield': { bonus: 4, speed: -1, attack: 0, passive: 'Learn Guard. -1 Spd.', grants: ['Guard'] },
  'Metal Shield': { bonus: 5, speed: 0, attack: 0, passive: 'Weak to Piercing (+3).', grants: [] },
  'Black Shield': { bonus: 10, speed: 0, attack: 0, passive: 'HP set to 60 in battle.', grants: [] }
};

export const ALL_REACTIONS: Record<string, any> = {
  // Class Reactions
  'Parry': { name: 'Parry', ep: '4', type: 'Physical', note: 'Highest wep atk roll to negate dmg.' },
  'Guard': { name: 'Guard', ep: '3', type: 'Physical', note: 'Absorb dmg for ally.' },
  'Dodge': { name: 'Dodge', ep: '4', type: 'Physical', note: 'Coinflip: Heads = negate dmg. Tails = take dmg, +4 EP.' },
  'Dash': { name: 'Dash', ep: '5', type: 'Physical', note: 'Disadvantage equal to Agility.' },
  'Rummage': { name: 'Rummage', ep: '0', type: 'Physical', note: 'Collect materials.' },
  
  // Weapon Reactions
  'Stab': { name: 'Stab', ep: '1', type: 'Physical', note: 'Take -3 damage on hit, but gain +3 on attack roll.' },
  'Backstab': { name: 'Backstab', ep: '1', type: 'Physical', note: 'Roll d20+Agility. >15 = +3 dmg/+2 EP. Else +4 EP/-1 Def.' },
  'Charged Shot': { name: 'Charged Shot', ep: '5', type: 'Physical', note: 'Requires nocking. +1 dmg per turn held. If held 2 turns, breaks.' },
  'Staff Stance': { name: 'Staff Stance', ep: '3', type: 'Physical', note: '+d4 Defense for 1 turn.' },
  'Nail & Hammer': { name: 'Nail & Hammer', ep: '2', type: 'Physical', note: 'Roll d20. >10 = +d6 dmg/+2 EP. Else +5 EP. If Nails in inventory, remove 1.' },
  'Charge': { name: 'Charge', ep: '0', type: 'Physical', note: 'Everyone coinflips, if successful everyone attacks one enemy.' }
};

export const REACTIONS: Record<string, any[]> = {
  Fighter: [ ALL_REACTIONS['Parry'], ALL_REACTIONS['Guard'] ],
  Rogue:   [ ALL_REACTIONS['Dodge'] ],
  Mage:    [ ALL_REACTIONS['Dodge'] ],
  Ranger:  [ ALL_REACTIONS['Dash'] ],
  Artificer: [ ALL_REACTIONS['Rummage'] ]
};

export const STATUS_EFFECTS: Record<string, any> = {
  'Burn I': { trigger: 'damage', dice: '1d4', desc: '1d4 + fire vuln.' },
  'Burn II': { trigger: 'damage', dice: '2d6', desc: '2d6 + fire vuln.' },
  'Burn III': { trigger: 'damage', dice: '2d12', desc: '2d12 + fire vuln. Coinflip to burn attacker.' },
  'Poison': { trigger: 'damage', dice: '1d6', desc: '1d6 per turn.' },
  'Bleeding': { trigger: 'damage', fixed: 4, desc: '+4 dmg per action.' },
  'Confusion': { desc: '-3 disadvantage on all rolls.' },
  'Blinded': { desc: 'Atk -6, auto-lose Clashes.' },
  'Injured': { desc: 'Cannot attack or use moves.' },
  'Paralyzed': { desc: 'Cannot move or use passives.' },
  'Incapacitated': { trigger: 'damage_ep', fixed: 4, ep: 2, desc: 'Bleeding (4 HP) + 2 EP. Removed if healed.' },
  'Insanity': { desc: 'Attack random ally.' },
  'Infected': { trigger: 'timer', desc: '30 mins. Turn into Ghoul.' },
  'Regeneration': { trigger: 'heal', dice: '1d4', desc: '+1d4 HP per turn.' }
};

export const SPELLBOOK = [
  { level: 1, name: 'Harming', ep: 'd4+2', type: 'Magical', note: 'D6 + Mag End. Only corporeal. Can only learn 1 other spell after.' },
  { level: 1, name: 'Simple Pyromancy', ep: 'd4+3', type: 'Magical', note: 'D6 + Mag End. Only corporeal. Inflicts Burn for 2 turns.' },
  { level: 1, name: 'Dazing', ep: 'd4+2', type: 'Magical', note: 'No dmg. Inflicts Confusion for d4 turns.' },
  { level: 1, name: 'Blinding', ep: 'd4+3', type: 'Magical', note: 'No dmg. Inflicts Blinding for 4 turns. Target must have eyes.' },
  { level: 1, name: 'Simple Protection', ep: 'd4+1', type: 'Magical', note: 'Lessen dmg by d12 + level - 1. +2 EP per turn held. Cannot use twice in a row.' },
  { level: 1, name: 'Simple Restoration', ep: 'd6+1', type: 'Magical', note: 'Restore d12 + Mag End HP to one ally. Can be boosted with healing item.' },
  { level: 2, name: 'Spontaneous Poisoning', ep: 'd4+5', type: 'Magical', note: 'D12 + Mag End dmg. Only corporeal. Inflicts Poison for 5 turns.' },
  { level: 2, name: 'Ring of Embers', ep: 'd4+3', type: 'Magical', note: '+1 EP per turn held. D6 + fire vuln dmg to all. Inflicts Burn II.' },
  { level: 2, name: 'Injuring', ep: 'd4+6', type: 'Magical', note: 'D12 + d4 + Mag End. Replaces Harming. Injured 3 turns. Nat20 = Paralyzed 1 turn.' },
  { level: 2, name: 'Primitive Healing', ep: 'd6+5', type: 'Magical', note: 'Removes Blindness, Bleeding, Poison, Downed. +d4 EP if removing Downed/Bleeding.' },
  { level: 2, name: 'Whispers of Haste', ep: 'd4+6', type: 'Magical', note: 'Applies Haste (+1 Agility for battle) to all allies.' },
  { level: 2, name: 'Rudimentary Golem', ep: 'd4+4', type: 'Magical', note: 'Golem 50 HP. Extra dmg passes to mage. Not learnable on level up.' },
  { level: 2, name: 'Light Shield', ep: 'd4+1', type: 'Magical', note: '+1 Def. +1 EP per active shield every 2 turns. Max 5 shields. Breaks on Dark hit.' },
  { level: 3, name: 'Concentrated Pyromancy', ep: 'd4+4', type: 'Magical', note: 'D6 + Mag End. Replaces Simple Pyromancy. Inflicts Burn III.' },
  { level: 3, name: 'Disruption', ep: '2d6+4', type: 'Magical', note: 'No dmg. d20 > 16: roll d6 (1-2 Blind, 3-4 Confusion, 5 Stun, 6 All).' },
  { level: 4, name: 'Arcane Shield', ep: 'd12+2', type: 'Magical', note: 'Replaces Light Shield & Simple Prot. Reduce incoming dmg by 2 per stack.' },
  { level: 4, name: 'Universal Restoration', ep: 'd20', type: 'Magical', note: 'Heal d20 + d12 to all allies. Coinflip for Regen (+d4 HP) 5 turns.' },
  { level: 4, name: 'Whispers of Malice', ep: 'd12+2', type: 'Magical', note: 'Enemy: coinflip to intimidate & run. Ally: +3 Agility for battle.' },
  { level: 4, name: 'Beacon of Light', ep: 'd4', type: 'Magical', note: 'Per turn held. Provides Light.' },
  { level: 5, name: 'Special (Custom)', ep: 'None', type: 'Magical', note: 'Make up a new spell (Offensive or Support). Cannot use d20 for dmg.' },
  { level: 6, name: 'Visions of the Imminent', ep: 'None', type: 'Magical', note: 'd20 prime: coinflip to predict enemy action. Fail = Insanity. Cannot learn after level up.' },
  { level: 6, name: 'Tearing', ep: 'd6+6', type: 'Magical', note: 'D12 + d8 + Mag End. Replaces Injuring. +6 EP trigger for extra dmg. Bleeding on d20 > 12.' },
  { level: 6, name: 'Terror of Souls', ep: 'd6+6', type: 'Magical', note: 'D12 + d8 + Mag End. Replaces Injuring. Max dmg: coinflip Insanity or Insta-kill.' },
  { level: 6, name: 'Teleportation', ep: 'd20+10', type: 'Magical', note: 'Outside: Go d6 cards ahead. Inside: Coinflip to escape (d20+20 EP).' },
  { level: 7, name: 'Lightweight Ascension', ep: 'd6+10', type: 'Magical', note: 'Flight. Invincible to melee for 5 turns.' },
  { level: 7, name: 'Ultimate Healing', ep: 'd20+20', type: 'Magical', note: 'Heal 2d20 + 10 HP to all. Cannot learn other spells.' },
  { level: 7, name: 'Complex Pyromancy', ep: '3d20+10', type: 'Magical', note: 'Replaces Ring of Embers. Trigger on d20 = 20. 4d20 dmg to all, Burn II 10 turns.' },
  { level: 7, name: 'Incapacitation', ep: '1d20+1d12', type: 'Magical', note: '[Black Magic] 2d20 dmg. Inflicts Incapacitated for d20 turns.' },
  { level: 7, name: 'Visions of Violence', ep: '3d20', type: 'Magical', note: '[Black Magic] Coinflip heads = Insanity for whole battle.' },
  { level: 7, name: 'Villify', ep: '2d20+10', type: 'Magical', note: '[White Magic] Remove all EP from an ally.' },
  { level: 7, name: 'Blessing of Protection', ep: '2d20+11', type: 'Magical', note: '[White Magic] Replaces protection spells. Coinflip to negate dmg & heal d12.' },
  { level: 8, name: 'Endless Torment', ep: '2d20', type: 'Magical', note: '[Black Magic] 3d20 dmg, bypass def. Coinflip to attack again with 2d20.' },
  { level: 8, name: 'Futility', ep: '1d20+1d12', type: 'Magical', note: '[Black Magic] Coinflip tails = target dies. Caster gets Insanity 1 turn. (2d20 EP if kill).' },
  { level: 8, name: 'Smite', ep: '2d20+12', type: 'Magical', note: '[White Magic] 3d20 dmg to all enemies. Paralyze all enemies.' },
  { level: 8, name: 'Banish', ep: 'None', type: 'Magical', note: '[White Magic] d20 nat20 = instant win. Obtain Vessel of Soul. +5 Mag Endurance.' },
  { level: 9, name: 'C.H.U.D.', ep: 'None', type: 'Magical', note: '[Black Magic] Charge 8 turns. Deal 2d100 + d20/Vessel, then die. +50 EP on interrupt.' },
  { level: 9, name: 'Mindless Devotion', ep: 'None', type: 'Magical', note: '[White Magic] Pray 8 turns. Cast Smite 10x on target, then downed. +50 EP on interrupt.' },
  { level: 10, name: 'Custom Spell', ep: 'None', type: 'Magical', note: 'Make up a spell. Knock yourself out.' }
];

export const SCROLL_SKILLS = [
  { name: 'Desperation', ep: 'd12', type: 'Physical', note: 'When anyone is downed/dead: +1d6 on next attack per downed/dead ally. Receive d12 EP on that attack.' },
  { name: 'Swift Impacts', ep: 'Manual', type: 'Physical', note: 'Pair with Speedy Attack. Light weapon: coinflip per hit, +2 EP per hit.' },
  { name: 'Attack Stance', ep: '4', type: 'Physical', note: '+4 EP on next successful attack. +1d6 damage on that attack.' },
  { name: 'Speed Attack', ep: '5', type: 'Physical', note: '+5 EP on success. Next attack boosted by Agility. If paired with Backstab, +d12 damage.' },
  { name: 'Double Impact', ep: 'd6+6', type: 'Physical', note: '2 regular attacks in 1 move. -1 Agility next turn (stacks). +d6 + 6 EP.' },
  { name: 'Momentary Rest', ep: '-10', type: 'Physical', note: 'REMOVES 10 EP. -3 Agility in the next battle.' },
];

export const CURSES = [
  {
    name: "Bound to Darkness",
    desc: "Requires Harming or Injuring to have been learned. A dark fate is already set for your soul. Max EP reduced to 75. Threat Level + 1 while you are nearby. You will die on Floor 10, after using your most powerful move on the final boss. Be able to learn Black Magic."
  },
  {
    name: "Indelible Fatigue",
    desc: "Max EP set to 100. Obtain the effects of Level 2 Exhaustion while in battle. -2 Magical Endurance. If any other Class, -2 Physical Endurance."
  },
  {
    name: "Unculled Gaze",
    desc: "Something watches you from a place you cannot comprehend. Floor 9 will be quite interesting..."
  },
  {
    name: "Closed Mind",
    desc: "Spell Slots for each Level set to 1. Keep one spell in a specific archetype (Offensive, Support). Max EP set to 100. Cannot change Conduits. If not a Mage, you can only keep ONE special move. You cannot learn any other moves. Damage scales by 1 for each encounter you win."
  },
  {
    name: "Blinding Light",
    desc: "A holy presence now watches over you, or has it always been watching? Immune to insanity. Max EP set to 60. Be able to learn White Magic."
  }
];