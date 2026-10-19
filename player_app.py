import os
os.environ['GST_DEBUG'] = '0'
import random
import re
from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.gridlayout import GridLayout
from kivy.uix.label import Label
from kivy.uix.button import Button
from kivy.uix.textinput import TextInput
from kivy.uix.spinner import Spinner
from kivy.uix.scrollview import ScrollView
from kivy.uix.popup import Popup
from kivy.uix.checkbox import CheckBox
from kivy.clock import Clock
from kivy.metrics import dp
from kivy.core.audio import SoundLoader


MAX_SLOTS = 10
MAX_STACK = 99
BASE_HP = 100
STARTING_EP = 0

_HERE = os.path.dirname(os.path.abspath(__file__))

EQUIP_SOUND_FILES = [
    os.path.join(_HERE, 'Equip_iron1.ogg'),
    os.path.join(_HERE, 'Equip_iron2.ogg'),
    os.path.join(_HERE, 'Equip_iron3.ogg'),
    os.path.join(_HERE, 'Equip_iron4.ogg'),
    os.path.join(_HERE, 'Equip_iron5.ogg'),
    os.path.join(_HERE, 'Equip_iron6.ogg'),
]
EFFECT_REMOVE_SOUND_FILE = os.path.join(_HERE, 'effect_remove.wav')

CLASS_STATS = {
    'Fighter':   {'max_ep': 95, 'phys_end': 3,  'mag_end': -9, 'agility': 0,
                  'weight': 'Heavy',  'reactions': 'Parry, Guard'},
    'Rogue':     {'max_ep': 80, 'phys_end': 2,  'mag_end': -9, 'agility': 2,
                  'weight': 'Light',  'reactions': 'Dodge'},
    'Mage':      {'max_ep': 80, 'phys_end': -2, 'mag_end': 5,  'agility': 0,
                  'weight': 'N/A',    'reactions': 'Dodge'},
    'Ranger':    {'max_ep': 85, 'phys_end': 1,  'mag_end': -9, 'agility': 3,
                  'weight': 'Light (ranged can be Heavy)', 'reactions': 'Dash'},
    'Artificer': {'max_ep': 90, 'phys_end': 0,  'mag_end': 2,  'agility': 0,
                  'weight': 'Light',  'reactions': 'Rummage'},
}

WEAPONS = {
    'Unarmed':         0,
    'Cleaver':         5,
    'Short Sword':     4,
    'Morning Star':    8,
    'Longsword':       6,
    'Throwing Spear':  5,
    'Dagger':          3,
    'Shortbow':        5,
    'Light Crossbow':  5,
    'Long Staff':      1,
    'Nail Hammer':     5,
    'Wrench':          5,
    'Zweihandler':     8,
    'Spear':           5,
    'Custom':          0,
}

HEAD_ARMOR = {
    'None': {
        'bonus': 0, 'passive': '', 'speed': 0, 'attack': 0,
    },
    'Leather Helmet': {
        'bonus': 2,
        'passive': 'Weak to Blunt (+3 if other armor is not already weak to Blunt). Head armor.',
        'speed': 0, 'attack': 0,
    },
    'Tough Helmet': {
        'bonus': 4,
        'passive': 'Heavy: -2 Speed (-4 if Mage or Rogue). Can be worn with other Body Armor.',
        'speed': -2, 'attack': 0,
        'class_speed_override': {'Mage': -4, 'Rogue': -4},
    },
    'Plate Helmet': {
        'bonus': 5,
        'passive': 'Additional +5 Armor to Plate Armor. -2 Speed.',
        'speed': -2, 'attack': 0,
    },
    'Custom': {
        'bonus': 0, 'passive': '', 'speed': 0, 'attack': 0,
    },
}

BODY_ARMOR = {
    'None': {
        'bonus': 0, 'passive': '', 'speed': 0, 'attack': 0,
    },
    'Reinforced Cloth Robe': {
        'bonus': 1,
        'passive': 'Light. +3 Fire vulnerability.',
        'speed': 0, 'attack': 0,
    },
    'Light Shoulder Plates': {
        'bonus': 2,
        'passive': '-1 on Attack rolls.',
        'speed': 0, 'attack': -1,
    },
    'Tough Leather Vest': {
        'bonus': 3,
        'passive': 'Heavy: -2 Speed (-4 if Mage or Rogue). Weak to Blunt (+2). +1 Defense vs Slashing hits.',
        'speed': -2, 'attack': 0,
        'class_speed_override': {'Mage': -4, 'Rogue': -4},
    },
    'Plate Body Armor': {
        'bonus': 8,
        'passive': 'Full plate. -4 Speed.',
        'speed': -4, 'attack': 0,
    },
    'Custom': {
        'bonus': 0, 'passive': '', 'speed': 0, 'attack': 0,
    },
}

SHIELD_ARMOR = {
    'None': {
        'bonus': 0, 'passive': '', 'speed': 0, 'attack': 0,
    },
    'Buckler': {
        'bonus': 1,
        'passive': 'Learn Parry if not already learned.',
        'speed': 0, 'attack': 0,
        'granted_reactions': ['Parry'],
    },
    'Wooden Shield': {
        'bonus': 2,
        'passive': 'Weak to Blunt (+3 damage taken).',
        'speed': 0, 'attack': 0,
    },
    'Standard-issue Shield': {
        'bonus': 4,
        'passive': 'Learn Guard if not already learned. -1 Speed.',
        'speed': -1, 'attack': 0,
        'granted_reactions': ['Guard'],
    },
    'Metal Shield': {
        'bonus': 5,
        'passive': 'Weak to Piercing (+3 damage taken).',
        'speed': 0, 'attack': 0,
    },
    'Black Shield': {
        'bonus': 10,
        'passive': 'HP set to 60 in battle. Bloodied but formidable.',
        'speed': 0, 'attack': 0,
        'special': 'Your HP is set to 60 during battle.\nRemember this when tracking HP.',
    },
    'Custom': {
        'bonus': 0, 'passive': '', 'speed': 0, 'attack': 0,
    },
}

REACTIONS = {
    'Fighter': [
        {'name': 'Parry', 'ep': '4',
         'note': '+4 EP on successful parry. Negate damage using the highest possible weapon attack roll.'},
        {'name': 'Guard', 'ep': '3',
         'note': '+3 EP if you actually absorb damage. Take a hit for an ally being targeted.'},
    ],
    'Rogue': [
        {'name': 'Dodge', 'ep': '4', 'coinflip': True,
         'note': 'AUTO-ROLL = COINFLIP → Heads = SUCCESS (negate all damage, no EP). Tails = FAIL (take full damage, +4 EP after endurance).'},
    ],
    'Mage': [
        {'name': 'Dodge', 'ep': '4', 'coinflip': True,
         'note': 'AUTO-ROLL = COINFLIP → Heads = SUCCESS (negate all damage, no EP). Tails = FAIL (take full damage, +4 EP after endurance).'},
    ],
    'Ranger': [
        {'name': 'Dash', 'ep': '5',
         'note': '+5 EP. Imposes disadvantage equal to your Agility on the enemy attack roll against you.'},
    ],
    'Artificer': [
        {'name': 'Rummage', 'ep': '0',
         'note': 'Collect crafting materials from a list of 20 materials. No EP.'},
    ],
}

ALL_REACTIONS = {}
for _cls, _lst in REACTIONS.items():
    for _r in _lst:
        ALL_REACTIONS[_r['name']] = _r

SCROLL_SKILLS = [
    {'name': 'Desperation', 'ep': 'd12', 'type': 'Physical',
     'note': 'When anyone is downed/dead: +1d6 on next attack per downed/dead ally. Receive d12 EP on that attack.'},
    {'name': 'Swift Impacts', 'ep': None, 'type': 'Physical',
     'note': 'Pair with Speedy Attack. Light weapon: coinflip per hit, +2 EP per hit. Enter total manually.'},
    {'name': 'Attack Stance', 'ep': '4', 'type': 'Physical',
     'note': '+4 EP on next successful attack. +1d6 damage on that attack.'},
    {'name': 'Speed Attack', 'ep': '5', 'type': 'Physical',
     'note': '+5 EP on success. Next attack boosted by Agility. If paired with Backstab, +d12 damage.'},
    {'name': 'Double Impact', 'ep': 'd6+6', 'type': 'Physical',
     'note': '2 regular attacks in 1 move. -1 Agility next turn (stacks). +d6 + 6 EP.'},
    {'name': 'Momentary Rest', 'ep': '-10', 'type': 'Physical',
     'note': 'REMOVES 10 EP. -3 Agility in the next battle.'},
]

SPELLBOOK = [
    ('Level 1', [
        {'name': 'Harming', 'ep': 'd4+2', 'cat': 'Offensive',
         'note': 'Only corporeal. Can only learn one other spell after.'},
        {'name': 'Simple Pyromancy', 'ep': 'd4+3', 'cat': 'Offensive',
         'note': 'Burn for 2 turns.'},
        {'name': 'Dazing', 'ep': 'd4+2', 'cat': 'Offensive',
         'note': 'Confusion d4 turns. Not a starter spell.'},
        {'name': 'Blinding', 'ep': 'd4+3', 'cat': 'Offensive',
         'note': 'Blind for 4 turns. Not a starter spell.'},
        {'name': 'Simple Protection', 'ep': 'd4+1', 'cat': 'Support',
         'note': '+2 EP per turn held.'},
        {'name': 'Simple Restoration', 'ep': 'd6+1', 'cat': 'Support',
         'note': 'Heal d12 + Magical Endurance.'},
    ]),
    ('Level 2', [
        {'name': 'Spontaneous Poisoning', 'ep': 'd4+5', 'cat': 'Offensive',
         'note': 'Poison for 5 - endurance turns.'},
        {'name': 'Ring of Embers', 'ep': 'd4+3', 'cat': 'Offensive',
         'note': '+1 EP per turn held.'},
        {'name': 'Injuring', 'ep': 'd4+6', 'cat': 'Offensive',
         'note': 'Replaces Harming.'},
        {'name': 'Primitive Healing', 'ep': 'd6+5', 'cat': 'Support',
         'note': '+d4 EP if removing Downed or Bleeding.'},
        {'name': 'Whispers of Haste', 'ep': 'd4+6', 'cat': 'Support',
         'note': 'Haste all allies.'},
        {'name': 'Rudimentary Golem', 'ep': 'd4+4', 'cat': 'Support',
         'note': 'Not learnable on level up.'},
        {'name': 'Light Shield', 'ep': 'd4+1', 'cat': 'Support',
         'note': '+1 EP per shield already stacked.'},
    ]),
    ('Level 3', [
        {'name': 'Concentrated Pyromancy', 'ep': 'd4+4', 'cat': 'Offensive',
         'note': 'Replaces Simple Pyromancy. Inflicts Burn III.'},
        {'name': 'Disruption', 'ep': '2d6+4', 'cat': 'Offensive',
         'note': 'Replaces Blinding and Dazing.'},
    ]),
    ('Level 4', [
        {'name': 'Arcane Shield', 'ep': 'd12+2', 'cat': 'Support',
         'note': 'Additional EP per additional stack.'},
        {'name': 'Universal Restoration', 'ep': 'd20', 'cat': 'Support',
         'note': 'Heal d20+d12 to all party.'},
        {'name': 'Whispers of Malice', 'ep': 'd12+2', 'cat': 'Support',
         'note': 'Intimidate enemy or buff an ally.'},
        {'name': 'Beacon of Light', 'ep': 'd4', 'cat': 'Support',
         'note': 'Per turn held.'},
    ]),
    ('Level 6', [
        {'name': 'Visions of the Imminent', 'ep': None, 'cat': 'Support',
         'note': 'No EP listed. Cannot be learned after level up.'},
        {'name': 'Tearing', 'ep': 'd6+6', 'cat': 'Offensive',
         'note': 'Replaces Injuring. +6 EP on trigger.'},
        {'name': 'Terror of Souls', 'ep': 'd6+6', 'cat': 'Offensive',
         'note': 'Replaces Injuring. +2 EP on trigger.'},
        {'name': 'Teleportation', 'ep': 'd20+10', 'cat': 'Support',
         'note': 'In battle: d20+20 EP.'},
    ]),
    ('Level 7', [
        {'name': 'Lightweight Ascension', 'ep': 'd6+10', 'cat': 'Support',
         'note': 'Flight; immune to melee 5 turns.'},
        {'name': 'Ultimate Healing', 'ep': 'd20+20', 'cat': 'Support',
         'note': 'Cannot learn more spells after.'},
        {'name': 'Complex Pyromancy', 'ep': '3d20+10', 'cat': 'Offensive',
         'note': 'Replaces Ring of Embers.'},
        {'name': 'Incapacitation', 'ep': '1d20+1d12', 'cat': 'Offensive',
         'note': 'Black Magic.'},
        {'name': 'Visions of Violence', 'ep': '3d20', 'cat': 'Offensive',
         'note': 'Black Magic.'},
        {'name': 'Villify', 'ep': '2d20+10', 'cat': 'Support',
         'note': 'White Magic.'},
        {'name': 'Blessing of Protection', 'ep': '2d20+11', 'cat': 'Support',
         'note': 'White Magic.'},
    ]),
    ('Level 8', [
        {'name': 'Endless Torment', 'ep': '2d20', 'cat': 'Offensive',
         'note': 'Black Magic. Bypasses defense.'},
        {'name': 'Futility', 'ep': '1d20+1d12', 'cat': 'Offensive',
         'note': 'Black Magic. 2d20 EP if the spell kills.'},
        {'name': 'Smite', 'ep': '2d20+12', 'cat': 'Offensive',
         'note': 'White Magic.'},
        {'name': 'Banish', 'ep': None, 'cat': 'Support',
         'note': 'White Magic. No EP listed.'},
    ]),
    ('Level 9', [
        {'name': 'C.H.U.D.', 'ep': None, 'cat': 'Offensive',
         'note': 'Black Magic. +50 EP on interrupt (unresisted).'},
        {'name': 'Mindless Devotion', 'ep': None, 'cat': 'Support',
         'note': 'White Magic. +50 EP on interrupt (unresisted).'},
    ]),
]

STATUS_EFFECTS = {
    'Burn I':        {'trigger': 'damage',    'dice': '1d4',
                      'desc': '1d4 + fire vuln per turn.'},
    'Burn II':       {'trigger': 'damage',    'dice': '2d6',
                      'desc': '2d6 + fire vuln per turn.'},
    'Burn III':      {'trigger': 'damage',    'dice': '2d12', 'coinflip': True,
                      'desc': '2d12 + fire vuln per turn. 50% chance to burn melee attackers.'},
    'Poison':        {'trigger': 'damage',    'dice': '1d6',
                      'desc': '1d6 per turn.'},
    'Bleeding':      {'trigger': 'damage',    'fixed': 4,
                      'desc': '+4 damage per action.'},
    'Confusion':     {'desc': '-3 disadvantage on all rolls.'},
    'Blinded':       {'desc': 'All attack rolls -6, auto-lose Clashes.'},
    'Injured':       {'desc': 'Cannot attack or use special moves.'},
    'Paralyzed':     {'desc': 'Cannot move or use passives.'},
    'Incapacitated': {'trigger': 'damage_ep', 'fixed': 4, 'ep': 2,
                      'desc': 'Bleeding (4 HP) + 2 EP per action. Removed if healed.'},
    'Insanity':      {'desc': 'Attack a random ally. Magic users cast a random offensive spell on a random ally.'},
    'Infected':      {'trigger': 'timer',
                      'desc': '30-minute timer. When it ends: become Ghoul, start encounter.'},
    'Regeneration':  {'trigger': 'heal',      'dice': '1d4',
                      'desc': '+1d4 HP per turn.'},
}

HELP_TEXT = """
T.A.D. HELP

[ CHARACTER ]
- Pick your class to load its stats automatically.
- HP starts at 100. EP starts at 0.
- Level 1-5: attack die is d6. Level 6+: d20.

[ ARMOR ]
- Head, Body, Shield are separate equipment slots.
- Pick a preset (auto-fills its bonus + shows passive).
- Total Defense = Head + Body + Shield.
- Speed and Attack modifiers from armor appear in Class Stats.
- Passives (weaknesses, learned reactions) are shown under each slot.
- Buckler grants Parry. Standard-issue Shield grants Guard.
- Black Shield sets HP to 60 in battle.

[ WEAPON ]
- Pick a preset weapon or Custom to enter any bonus.
- Weapon bonus feeds directly into the damage preview.

[ DAMAGE ]
Regular attack:
  d6 (2d6 on nat 20) + weapon bonus + (level - 1) - enemy defense
  At level 6+, use d20 (2d20 on nat 20) instead of d6.

[ EP / EXHAUSTION ]
- Using a skill/spell adds EP. Hitting Max EP = Downed.
- Physical skills subtract Physical Endurance.
- Magical skills subtract Magical Endurance.
- Negative endurance means the skill costs MORE EP.
- Some skills REMOVE EP (e.g. Momentary Rest). Those work too.

[ SKILLS ]
- Checkbox ON  = auto-roll EP (uses spell's formula).
- Checkbox OFF = you type the EP manually.
- Open Spellbook to add spells directly from the rules.
- Open Scrolls to add scroll-learned skills.

[ REACTIONS ]
- Class-specific. Auto-rolls EP with the checkbox on.
- Physical Endurance applies to all reactions.
- Uncheck the box to enter EP manually.
- Armor-granted reactions (Buckler, Standard-issue Shield) also appear here.

[ DODGE ]
- Auto-roll ON  → coinflip happens automatically.
    Heads = SUCCESS (negate all damage, no EP added).
    Tails = FAIL (take full damage, +4 EP after endurance).
- Auto-roll OFF → you enter the EP yourself.

[ INVENTORY ]
- 10 slots max, 99 per stack.
- Identical items auto-stack.

[ STATUS EFFECTS ]
- Max 5 at once. X removes.
- Incapacitated replaces Bleeding.
- Trigger auto-applies HP/EP changes per the effect.
- Burn III has an auto-coinflip checkbox.
- Infected has Start/Stop + live MM:SS timer.
- Effects with no HP/EP change show no Trigger button.

[ EFFECT DETAILS ]
- Burn: 1d4 damage + fire vuln per turn.
- Burn II: 2d6 damage + fire vuln per turn.
- Burn III: 2d12 + fire vuln per turn. Coinflip: set melee attacker on fire (Burn I).
- Poison: 1d6 per turn.
- Bleeding: +4 damage per action.
- Confusion: -3 disadvantage on all rolls.
- Blinded: all attack rolls -6, auto-lose Clashes.
- Injured: cannot attack or use special moves while active.
- Paralyzed: Cannot move or use passives for turn duration.
- Incapacitated: Bleeding + additional 2 EP on all actions, removed if healed.
- Insanity: Attack a random ally. Magic users cast a random offensive spell.
- Infected: 30 minutes. Turn into Ghoul + start encounter if not healed.
- Regeneration: +1d4 HP per turn.

- Reaching Max EP = Downed, EP resets to 0 on recovery.
"""


# ---------- Sound helpers ----------

_sound_cache = {}

def play_sound(filename):
    if not os.path.exists(filename):
        print(f"[sound] MISSING FILE: {filename}")
        return
    try:
        if filename not in _sound_cache:
            _sound_cache[filename] = SoundLoader.load(filename)
        sound = _sound_cache[filename]
        if sound is None:
            print(f"[sound] FAILED TO LOAD: {filename} (backend returned None)")
            return
        if sound.state == 'play':
            sound.stop()
        sound.play()
    except Exception as e:
        print(f"[sound] ERROR playing {filename}: {e}")


def play_random_sound(filenames):
    existing = [f for f in filenames if os.path.exists(f)]
    if not existing:
        print(f"[sound] None of these files found:")
        for f in filenames:
            print(f"        {f}")
        print(f"[sound] Current working directory: {os.getcwd()}")
        return
    play_sound(random.choice(existing))


# ---------- EP formula helpers ----------

def _tokenize(formula):
    formula = str(formula).lower().replace(' ', '')
    return re.findall(r'[+-]?\d*d\d+|[+-]?\d+', formula)


def roll_formula(formula):
    total = 0
    for tok in _tokenize(formula):
        sign = -1 if tok.startswith('-') else 1
        tok = tok.lstrip('+-')
        if 'd' in tok:
            n_str, s_str = tok.split('d')
            n = int(n_str) if n_str else 1
            s = int(s_str)
            for _ in range(n):
                total += sign * random.randint(1, s)
        else:
            total += sign * int(tok)
    return total


def formula_avg(formula):
    total = 0.0
    for tok in _tokenize(formula):
        sign = -1 if tok.startswith('-') else 1
        tok = tok.lstrip('+-')
        if 'd' in tok:
            n_str, s_str = tok.split('d')
            n = int(n_str) if n_str else 1
            s = int(s_str)
            total += sign * n * (s + 1) / 2
        else:
            total += sign * int(tok)
    return total


def validate_formula(s):
    s = str(s).lower().replace(' ', '')
    return bool(re.fullmatch(r'[+-]?\d*d\d+([+-]\d*d\d+|[+-]\d+)*', s))


def classify_ep(s):
    if s is None or str(s).strip() == '':
        return ('manual', None)
    s_clean = str(s).strip().lower().replace(' ', '')
    if 'd' in s_clean and validate_formula(s_clean):
        return ('formula', s_clean)
    try:
        int(s_clean)
        return ('fixed', s_clean)
    except ValueError:
        return ('manual', None)


def ep_display(s):
    kind, val = classify_ep(s)
    if kind == 'fixed':
        return f"{val} EP"
    if kind == 'formula':
        return f"{val} EP (avg {formula_avg(val):.1f})"
    return "— (manual)"


# ---------- UI helpers ----------

def lbl(text, h=dp(30), bold=False, fs=None):
    kwargs = dict(text=text, size_hint_y=None, height=h, bold=bold,
                  halign='left', valign='top')
    if fs is not None:
        kwargs['font_size'] = fs
    l = Label(**kwargs)
    min_h = h
    l.bind(
        width=lambda s, *_: setattr(s, 'text_size', (s.width, None)),
        texture_size=lambda s, *_: setattr(
            s, 'height', max(min_h, s.texture_size[1] + dp(2))),
    )
    return l


def passive_lbl(text):
    l = Label(text=text, size_hint_y=None, height=dp(22),
              halign='left', valign='top', font_size=dp(10),
              color=(0.75, 0.75, 0.75, 1))
    l.bind(
        width=lambda s, *_: setattr(s, 'text_size', (s.width, None)),
        texture_size=lambda s, *_: setattr(
            s, 'height', max(dp(22), s.texture_size[1] + dp(2))),
    )
    return l


class CharacterSheet(BoxLayout):
    def __init__(self, **kwargs):
        super().__init__(orientation='vertical', padding=dp(10),
                         spacing=dp(8), size_hint_y=None, **kwargs)
        self.bind(minimum_height=self.setter('height'))

        self.inventory = []
        self.skills = []
        self.reaction_auto = {}
        self.current_class = 'Fighter'
        self.hp = BASE_HP
        self.ep = STARTING_EP
        self.level = 1
        self._downed_shown = False

        self.head_name = 'None'
        self.body_name = 'None'
        self.shield_name = 'None'
        self.head_info = HEAD_ARMOR['None']
        self.body_info = BODY_ARMOR['None']
        self.shield_info = SHIELD_ARMOR['None']
        self.head_armor = 0
        self.body_armor = 0
        self.shield_armor = 0

        self.weapon_bonus = 0
        self.weapon_name = 'Unarmed'

        self.status_effects = []
        self._infected_event = None
        self._infected_remaining = 0

        self.build()

    # ---------- UI ----------
    def build(self):
        self.add_widget(Label(text='T.A.D. Character Sheet',
                              font_size=dp(24), bold=True,
                              size_hint_y=None, height=dp(50)))

        # Character
        self.add_widget(Label(text='[ CHARACTER ]', bold=True,
                              size_hint_y=None, height=dp(28)))
        grid = GridLayout(cols=2, spacing=dp(6), size_hint_y=None)
        grid.bind(minimum_height=grid.setter('height'))

        grid.add_widget(lbl('Class'))
        self.class_spinner = Spinner(text='Fighter',
                                     values=list(CLASS_STATS.keys()),
                                     size_hint_y=None, height=dp(40))
        self.class_spinner.bind(text=self.on_class_change)
        grid.add_widget(self.class_spinner)

        grid.add_widget(lbl('Level'))
        level_row = BoxLayout(size_hint_y=None, height=dp(40), spacing=dp(4))
        self.level_input = TextInput(text='1', input_filter='int',
                                     multiline=False, size_hint_x=None, width=dp(60))
        self.level_input.bind(text=self.on_level_change)
        level_row.add_widget(self.level_input)
        level_row.add_widget(BoxLayout())  # spacer
        grid.add_widget(level_row)

        grid.add_widget(lbl('HP'))
        hp_row = BoxLayout(size_hint_y=None, height=dp(40), spacing=dp(4))
        self.hp_input = TextInput(text=str(BASE_HP), input_filter='int',
                                  multiline=False, size_hint_x=None, width=dp(70))
        self.hp_input.bind(text=self.on_hp_change)
        hp_row.add_widget(self.hp_input)
        hp_row.add_widget(Button(text='-', size_hint_x=None, width=dp(40),
                                 on_press=lambda _: self.adjust_hp(-1)))
        hp_row.add_widget(Button(text='+', size_hint_x=None, width=dp(40),
                                 on_press=lambda _: self.adjust_hp(1)))
        hp_row.add_widget(BoxLayout())  # spacer
        grid.add_widget(hp_row)

        grid.add_widget(lbl('EP'))
        ep_row = BoxLayout(size_hint_y=None, height=dp(40), spacing=dp(4))
        self.ep_input = TextInput(text=str(STARTING_EP), input_filter='int',
                                  multiline=False, size_hint_x=None, width=dp(70))
        self.ep_input.bind(text=self.on_ep_change)
        ep_row.add_widget(self.ep_input)
        ep_row.add_widget(Button(text='-', size_hint_x=None, width=dp(40),
                                 on_press=lambda _: self.adjust_ep(-1)))
        ep_row.add_widget(Button(text='+', size_hint_x=None, width=dp(40),
                                 on_press=lambda _: self.adjust_ep(1)))
        ep_row.add_widget(BoxLayout())  # spacer
        grid.add_widget(ep_row)

        self.add_widget(grid)

        # Class stats
        self.add_widget(Label(text='[ CLASS STATS ]', bold=True,
                              size_hint_y=None, height=dp(28)))
        self.stats_grid = GridLayout(cols=2, spacing=dp(6), size_hint_y=None)
        self.stats_grid.bind(minimum_height=self.stats_grid.setter('height'))
        self.add_widget(self.stats_grid)
        self.refresh_stats()

        # Armor
        self.add_widget(Label(text='[ ARMOR ]', bold=True,
                              size_hint_y=None, height=dp(28)))
        armor_box = BoxLayout(orientation='vertical', spacing=dp(4),
                              size_hint_y=None)
        armor_box.bind(minimum_height=armor_box.setter('height'))

        # HEAD
        head_grid = GridLayout(cols=2, spacing=dp(4), size_hint_y=None,
                               height=dp(40))
        head_grid.add_widget(lbl('Head', h=dp(40)))
        head_row = BoxLayout(spacing=dp(4))
        self.head_spinner = Spinner(text='None', values=list(HEAD_ARMOR.keys()))
        self.head_spinner.bind(text=self.on_head_select)
        head_row.add_widget(self.head_spinner)
        self.head_input = TextInput(text='0', input_filter='int',
                                    multiline=False, size_hint_x=None, width=dp(50))
        self.head_input.bind(text=self.on_armor_change)
        head_row.add_widget(self.head_input)
        head_grid.add_widget(head_row)
        armor_box.add_widget(head_grid)
        self.head_passive = passive_lbl('')
        armor_box.add_widget(self.head_passive)

        # BODY
        body_grid = GridLayout(cols=2, spacing=dp(4), size_hint_y=None,
                               height=dp(40))
        body_grid.add_widget(lbl('Body', h=dp(40)))
        body_row = BoxLayout(spacing=dp(4))
        self.body_spinner = Spinner(text='None', values=list(BODY_ARMOR.keys()))
        self.body_spinner.bind(text=self.on_body_select)
        body_row.add_widget(self.body_spinner)
        self.body_input = TextInput(text='0', input_filter='int',
                                    multiline=False, size_hint_x=None, width=dp(50))
        self.body_input.bind(text=self.on_armor_change)
        body_row.add_widget(self.body_input)
        body_grid.add_widget(body_row)
        armor_box.add_widget(body_grid)
        self.body_passive = passive_lbl('')
        armor_box.add_widget(self.body_passive)

        # SHIELD
        shield_grid = GridLayout(cols=2, spacing=dp(4), size_hint_y=None,
                                 height=dp(40))
        shield_grid.add_widget(lbl('Shield', h=dp(40)))
        shield_row = BoxLayout(spacing=dp(4))
        self.shield_spinner = Spinner(text='None', values=list(SHIELD_ARMOR.keys()))
        self.shield_spinner.bind(text=self.on_shield_select)
        shield_row.add_widget(self.shield_spinner)
        self.shield_input = TextInput(text='0', input_filter='int',
                                      multiline=False, size_hint_x=None, width=dp(50))
        self.shield_input.bind(text=self.on_armor_change)
        shield_row.add_widget(self.shield_input)
        shield_grid.add_widget(shield_row)
        armor_box.add_widget(shield_grid)
        self.shield_passive = passive_lbl('')
        armor_box.add_widget(self.shield_passive)

        # TOTAL
        total_grid = GridLayout(cols=2, spacing=dp(4), size_hint_y=None,
                                height=dp(36))
        total_grid.add_widget(lbl('Total Defense', bold=True))
        self.defense_label = lbl('0', bold=True, fs=dp(16))
        total_grid.add_widget(self.defense_label)
        armor_box.add_widget(total_grid)

        self.add_widget(armor_box)

        # Weapon
        self.add_widget(Label(text='[ WEAPON ]', bold=True,
                              size_hint_y=None, height=dp(28)))
        weapon_grid = GridLayout(cols=2, spacing=dp(6), size_hint_y=None)
        weapon_grid.bind(minimum_height=weapon_grid.setter('height'))

        weapon_grid.add_widget(lbl('Weapon'))
        weapon_row = BoxLayout(size_hint_y=None, height=dp(40), spacing=dp(4))
        self.weapon_spinner = Spinner(text='Unarmed',
                                      values=list(WEAPONS.keys()))
        self.weapon_spinner.bind(text=self.on_weapon_change)
        weapon_row.add_widget(self.weapon_spinner)
        self.weapon_bonus_input = TextInput(text='0', input_filter='int',
                                            multiline=False, size_hint_x=None,
                                            width=dp(50))
        self.weapon_bonus_input.bind(text=self.on_weapon_bonus_change)
        weapon_row.add_widget(self.weapon_bonus_input)
        weapon_grid.add_widget(weapon_row)

        self.add_widget(weapon_grid)

        # Skills / Spells
        self.add_widget(Label(text='[ SKILLS & SPELLS ]', bold=True,
                              size_hint_y=None, height=dp(28)))
        self.skill_count_label = lbl('')
        self.add_widget(self.skill_count_label)

        add_skill_box = BoxLayout(size_hint_y=None, height=dp(40), spacing=dp(4))
        self.skill_name = TextInput(hint_text='Custom skill name', multiline=False)
        self.skill_ep = TextInput(text='0', hint_text='EP or d4+2',
                                  multiline=False, size_hint_x=None, width=dp(90))
        self.skill_type = Spinner(text='Physical',
                                  values=['Physical', 'Magical', 'None'],
                                  size_hint_x=None, width=dp(100))
        add_skill_btn = Button(text='Add', size_hint_x=None, width=dp(60))
        add_skill_btn.bind(on_press=self.add_custom_skill)
        add_skill_box.add_widget(self.skill_name)
        add_skill_box.add_widget(self.skill_ep)
        add_skill_box.add_widget(self.skill_type)
        add_skill_box.add_widget(add_skill_btn)
        self.add_widget(add_skill_box)

        button_row = BoxLayout(size_hint_y=None, height=dp(40), spacing=dp(4))
        spellbook_btn = Button(text='Spellbook')
        spellbook_btn.bind(on_press=self.open_spellbook)
        scrolls_btn = Button(text='Scrolls')
        scrolls_btn.bind(on_press=self.open_scrolls)
        button_row.add_widget(spellbook_btn)
        button_row.add_widget(scrolls_btn)
        self.add_widget(button_row)

        self.skills_container = BoxLayout(orientation='vertical', spacing=dp(4),
                                          size_hint_y=None)
        self.skills_container.bind(minimum_height=self.skills_container.setter('height'))
        self.add_widget(self.skills_container)

        self.skill_status = lbl('', h=dp(36), fs=dp(12))
        self.add_widget(self.skill_status)
        self.refresh_skills()

        # Reactions
        self.add_widget(Label(text='[ REACTIONS ]', bold=True,
                              size_hint_y=None, height=dp(28)))
        self.reactions_container = BoxLayout(orientation='vertical', spacing=dp(4),
                                             size_hint_y=None)
        self.reactions_container.bind(minimum_height=self.reactions_container.setter('height'))
        self.add_widget(self.reactions_container)
        self.refresh_reactions()

        # Status Effects
        self.add_widget(Label(text='[ STATUS EFFECTS ]', bold=True,
                              size_hint_y=None, height=dp(28)))
        self.effect_count_label = lbl('')
        self.add_widget(self.effect_count_label)

        add_eff_row = BoxLayout(size_hint_y=None, height=dp(40), spacing=dp(4))
        self.effect_spinner = Spinner(text='Burn I',
                                      values=list(STATUS_EFFECTS.keys()),
                                      size_hint_y=None, height=dp(40))
        add_eff_row.add_widget(self.effect_spinner)
        add_eff_btn = Button(text='Add Effect',
                             size_hint_x=None, width=dp(95))
        add_eff_btn.bind(on_press=self.add_effect_from_spinner)
        add_eff_row.add_widget(add_eff_btn)
        self.add_widget(add_eff_row)

        self.effects_container = BoxLayout(orientation='vertical', spacing=dp(4),
                                           size_hint_y=None)
        self.effects_container.bind(minimum_height=self.effects_container.setter('height'))
        self.add_widget(self.effects_container)

        self.infected_status_label = lbl('', h=dp(30), bold=True, fs=dp(14))
        self.add_widget(self.infected_status_label)
        self.refresh_effects()

        # Damage preview
        self.add_widget(Label(text='[ DAMAGE PREVIEW ]', bold=True,
                              size_hint_y=None, height=dp(28)))
        self.damage_preview = lbl('', h=dp(80), fs=dp(12))
        self.add_widget(self.damage_preview)
        self.refresh_damage_preview()

        # Inventory
        self.add_widget(Label(text='[ INVENTORY ]', bold=True,
                              size_hint_y=None, height=dp(28)))
        self.slot_label = lbl('')
        self.add_widget(self.slot_label)

        add_box = BoxLayout(size_hint_y=None, height=dp(40), spacing=dp(4))
        self.item_name = TextInput(hint_text='Item name', multiline=False)
        self.item_qty = TextInput(text='1', input_filter='int',
                                  multiline=False, size_hint_x=None, width=dp(55))
        add_btn = Button(text='Add', size_hint_x=None, width=dp(70))
        add_btn.bind(on_press=self.add_item)
        add_box.add_widget(self.item_name)
        add_box.add_widget(self.item_qty)
        add_box.add_widget(add_btn)
        self.add_widget(add_box)

        self.inv_container = BoxLayout(orientation='vertical', spacing=dp(4),
                                       size_hint_y=None)
        self.inv_container.bind(minimum_height=self.inv_container.setter('height'))
        self.add_widget(self.inv_container)
        self.refresh_inventory()

        # Help
        self.add_widget(Label(text='[ HELP ]', bold=True,
                              size_hint_y=None, height=dp(28)))
        help_btn = Button(text='Open Help',
                          size_hint_y=None, height=dp(45))
        help_btn.bind(on_press=self.show_help)
        self.add_widget(help_btn)

    # ---------- Armor calculations ----------
    def get_armor_totals(self):
        total_def = self.head_armor + self.body_armor + self.shield_armor
        speed_mod = 0
        attack_mod = 0
        granted = []
        specials = []
        for info in (self.head_info, self.body_info, self.shield_info):
            if not info:
                continue
            speed = info.get('speed', 0)
            override = info.get('class_speed_override', {})
            if self.current_class in override:
                speed = override[self.current_class]
            speed_mod += speed
            attack_mod += info.get('attack', 0)
            granted.extend(info.get('granted_reactions', []))
            if 'special' in info:
                specials.append(info['special'])
        return total_def, speed_mod, attack_mod, granted, specials

    def refresh_armor_passives(self):
        def update(lbl_widget, info):
            text = info.get('passive', '') if info else ''
            lbl_widget.text = text or ''

        update(self.head_passive, self.head_info)
        update(self.body_passive, self.body_info)
        update(self.shield_passive, self.shield_info)

    # ---------- Stats ----------
    def refresh_stats(self):
        self.stats_grid.clear_widgets()
        s = CLASS_STATS[self.current_class]
        level_bonus = self.level - 1
        suffix = f"  (+{level_bonus})" if level_bonus > 0 else ""
        total_def, speed_mod, attack_mod, _, _ = self.get_armor_totals()
        rows = [
            ('Max EP', str(s['max_ep'])),
            ('Defense (from armor)', str(total_def)),
            ('Speed modifier', self.signed(speed_mod)),
            ('Attack roll modifier', self.signed(attack_mod)),
            ('Physical Endurance', self.signed(s['phys_end']) + suffix),
            ('Magical Endurance', self.signed(s['mag_end']) + suffix),
            ('Agility Advantage', self.signed(s['agility']) + suffix),
            ('Equipment Weight', s['weight']),
            ('Reactions', s['reactions']),
        ]
        for k, v in rows:
            self.stats_grid.add_widget(lbl(k))
            self.stats_grid.add_widget(lbl(v))

    @staticmethod
    def signed(n):
        return f'+{n}' if n >= 0 else str(n)

    def refresh_damage_preview(self):
        die = 'd20' if self.level >= 6 else 'd6'
        level_bonus = self.level - 1
        wb = self.weapon_bonus
        wb_disp = f"+{wb}" if wb >= 0 else str(wb)
        _, _, attack_mod, _, _ = self.get_armor_totals()
        atk_str = ''
        if attack_mod != 0:
            atk_str = f" (armor {self.signed(attack_mod)} to attack rolls)"
        self.damage_preview.text = (
            f"Weapon: {self.weapon_name} (damage {wb_disp})\n"
            f"Attack die: {die} (2{die} on nat 20){atk_str}\n"
            f"Formula: {die} {wb_disp} + (level - 1 = {level_bonus}) - enemy defense"
        )

    # ---------- Class / Level / HP / EP ----------
    def on_class_change(self, spinner, text):
        self.current_class = text
        max_ep = CLASS_STATS[text]['max_ep']
        if self.ep > max_ep:
            self.ep = max_ep
            self.ep_input.text = str(self.ep)
        self._downed_shown = False
        self.refresh_stats()
        self.refresh_reactions()
        self.refresh_damage_preview()

    def on_level_change(self, ti, text):
        try:
            self.level = max(1, int(text))
        except ValueError:
            self.level = 1
        self.refresh_damage_preview()
        self.refresh_stats()

    def on_hp_change(self, ti, text):
        try:
            self.hp = max(0, int(text))
        except ValueError:
            self.hp = 0

    def on_ep_change(self, ti, text):
        try:
            self.ep = max(0, int(text))
        except ValueError:
            self.ep = 0
        self.check_downed()

    def adjust_hp(self, delta):
        self.hp = max(0, self.hp + delta)
        self.hp_input.text = str(self.hp)

    def adjust_ep(self, delta):
        max_ep = CLASS_STATS[self.current_class]['max_ep']
        self.ep = max(0, min(max_ep, self.ep + delta))
        self.ep_input.text = str(self.ep)
        self.check_downed()

    def gain_ep(self, amount):
        if amount == 0:
            return
        max_ep = CLASS_STATS[self.current_class]['max_ep']
        self.ep = max(0, min(max_ep, self.ep + amount))
        self.ep_input.text = str(self.ep)
        self.check_downed()

    def check_downed(self):
        max_ep = CLASS_STATS[self.current_class]['max_ep']
        if self.ep >= max_ep:
            if not self._downed_shown:
                self.show_popup('Downed!',
                                f"EP has reached Max EP ({max_ep}).\nYou are DOWNED.")
                self._downed_shown = True
        else:
            self._downed_shown = False

    # ---------- Armor ----------
    def on_head_select(self, spinner, text):
        play_random_sound(EQUIP_SOUND_FILES)
        self.head_name = text
        self.head_info = HEAD_ARMOR.get(text, HEAD_ARMOR['None'])
        if 'bonus' in self.head_info:
            self.head_input.text = str(self.head_info['bonus'])
        self.refresh_armor_passives()
        self._after_armor_change(self.head_info)

    def on_body_select(self, spinner, text):
        play_random_sound(EQUIP_SOUND_FILES)
        self.body_name = text
        self.body_info = BODY_ARMOR.get(text, BODY_ARMOR['None'])
        if 'bonus' in self.body_info:
            self.body_input.text = str(self.body_info['bonus'])
        self.refresh_armor_passives()
        self._after_armor_change(self.body_info)

    def on_shield_select(self, spinner, text):
        play_random_sound(EQUIP_SOUND_FILES)
        self.shield_name = text
        self.shield_info = SHIELD_ARMOR.get(text, SHIELD_ARMOR['None'])
        if 'bonus' in self.shield_info:
            self.shield_input.text = str(self.shield_info['bonus'])
        self.refresh_armor_passives()
        self._after_armor_change(self.shield_info)

    def _after_armor_change(self, info):
        self.refresh_stats()
        self.refresh_reactions()
        self.refresh_damage_preview()
        if info and 'special' in info:
            self.show_popup('Special Effect', info['special'])

    def on_armor_change(self, ti, text):
        try:
            self.head_armor = max(0, int(self.head_input.text))
        except (ValueError, AttributeError):
            self.head_armor = 0
        try:
            self.body_armor = max(0, int(self.body_input.text))
        except (ValueError, AttributeError):
            self.body_armor = 0
        try:
            self.shield_armor = max(0, int(self.shield_input.text))
        except (ValueError, AttributeError):
            self.shield_armor = 0
        total = self.head_armor + self.body_armor + self.shield_armor
        if hasattr(self, 'defense_label'):
            self.defense_label.text = str(total)
        self.refresh_stats()

    # ---------- Weapon ----------
    def on_weapon_change(self, spinner, text):
        play_random_sound(EQUIP_SOUND_FILES)
        self.weapon_name = text
        if text in WEAPONS:
            self.weapon_bonus_input.text = str(WEAPONS[text])
        self.refresh_damage_preview()

    def on_weapon_bonus_change(self, ti, text):
        try:
            self.weapon_bonus = int(text)
        except ValueError:
            self.weapon_bonus = 0
        self.refresh_damage_preview()

    # ---------- Skills ----------
    def endurance_for(self, type_name):
        if type_name == 'Physical':
            return CLASS_STATS[self.current_class]['phys_end']
        if type_name == 'Magical':
            return CLASS_STATS[self.current_class]['mag_end']
        return 0

    def add_custom_skill(self, instance):
        name = self.skill_name.text.strip()
        if not name:
            return
        ep_input = self.skill_ep.text.strip()
        kind, val = classify_ep(ep_input)
        ep_str = val if kind in ('fixed', 'formula') else None
        self.skills.append({
            'name': name,
            'ep_str': ep_str,
            'type': self.skill_type.text,
            'auto': True,
            'note': '',
        })
        self.skill_name.text = ''
        self.skill_ep.text = '0'
        self.refresh_skills()

    def add_from_spellbook(self, spell, status_label):
        for existing in self.skills:
            if existing['name'].lower() == spell['name'].lower():
                status_label.text = f"{spell['name']} is already in your list."
                return
        self.skills.append({
            'name': spell['name'],
            'ep_str': spell['ep'],
            'type': 'Magical',
            'auto': True,
            'note': spell['note'],
        })
        self.refresh_skills()
        status_label.text = f"Added {spell['name']}."

    def open_spellbook(self, instance):
        content = BoxLayout(orientation='vertical', padding=dp(8), spacing=dp(6))
        status = Label(text='Click Add to add a spell.',
                       size_hint_y=None, height=dp(24))
        content.add_widget(status)

        sv = ScrollView()
        inner = BoxLayout(orientation='vertical', size_hint_y=None, spacing=dp(4))
        inner.bind(minimum_height=inner.setter('height'))

        for level_name, spells in SPELLBOOK:
            inner.add_widget(Label(text=f"— {level_name} —", bold=True,
                                   size_hint_y=None, height=dp(28)))
            for sp in spells:
                row = BoxLayout(size_hint_y=None, spacing=dp(6))
                row.bind(minimum_height=row.setter('height'))

                text_box = BoxLayout(orientation='vertical', size_hint_y=None)
                text_box.bind(minimum_height=text_box.setter('height'))
                title = lbl(f"{sp['name']} [{sp['cat']}]  ·  {ep_display(sp['ep'])}",
                            h=dp(24), bold=True)
                note = lbl(sp['note'], h=dp(24), fs=dp(11))
                text_box.add_widget(title)
                text_box.add_widget(note)

                add_btn = Button(text='Add', size_hint_x=None, width=dp(55))
                add_btn.bind(on_press=lambda _, s=sp: self.add_from_spellbook(s, status))

                row.add_widget(text_box)
                row.add_widget(add_btn)
                inner.add_widget(row)

        sv.add_widget(inner)
        content.add_widget(sv)

        close = Button(text='Close', size_hint_y=None, height=dp(40))
        content.add_widget(close)

        pop = Popup(title='Spellbook', content=content, size_hint=(0.9, 0.9))
        close.bind(on_press=pop.dismiss)
        pop.open()

    def remove_skill(self, index):
        if 0 <= index < len(self.skills):
            self.skills.pop(index)
            self.refresh_skills()

    def toggle_skill_auto(self, index, value):
        if 0 <= index < len(self.skills):
            self.skills[index]['auto'] = value
            self.refresh_skills()

    def use_skill(self, index):
        if not (0 <= index < len(self.skills)):
            return
        skill = self.skills[index]
        if not skill['auto']:
            self.ask_ep_amount(skill['name'])
            return

        kind, val = classify_ep(skill['ep_str'])
        if kind == 'manual':
            self.ask_ep_amount(skill['name'])
            return

        if kind == 'formula':
            rolled = roll_formula(val)
            rolled_disp = f"rolled {val} → {rolled}"
        else:
            rolled = int(val)
            rolled_disp = f"{rolled}"

        if rolled < 0:
            endurance = 0
            effective = rolled
        else:
            endurance = self.endurance_for(skill['type'])
            effective = max(0, rolled - endurance)

        max_ep = CLASS_STATS[self.current_class]['max_ep']
        before = self.ep
        self.gain_ep(effective)
        gained = self.ep - before

        if rolled < 0:
            self.skill_status.text = (
                f"{skill['name']}: {rolled_disp} → {gained} EP "
                f"(now {self.ep}/{max_ep})"
            )
        else:
            self.skill_status.text = (
                f"{skill['name']}: {rolled_disp} EP, "
                f"- {endurance:+d} END → +{gained} EP "
                f"(now {self.ep}/{max_ep})"
            )

    def ask_ep_amount(self, skill_name):
        content = BoxLayout(orientation='vertical', padding=dp(10), spacing=dp(10))
        content.add_widget(Label(text=f"How much EP for '{skill_name}'?",
                                 size_hint_y=None, height=dp(30)))
        ti = TextInput(text='0', input_filter='int', multiline=False,
                       size_hint_y=None, height=dp(40))
        content.add_widget(ti)
        btn_box = BoxLayout(size_hint_y=None, height=dp(40), spacing=dp(10))
        ok = Button(text='Apply')
        cancel = Button(text='Cancel')
        btn_box.add_widget(ok)
        btn_box.add_widget(cancel)
        content.add_widget(btn_box)
        pop = Popup(title='Manual EP Input', content=content,
                    size_hint=(0.75, 0.35))

        def on_ok(_):
            try:
                amt = int(ti.text)
            except ValueError:
                amt = 0
            before = self.ep
            self.gain_ep(amt)
            self.skill_status.text = (
                f"{skill_name}: manual {self.ep - before:+d} EP "
                f"(now {self.ep}/{CLASS_STATS[self.current_class]['max_ep']})"
            )
            pop.dismiss()

        ok.bind(on_press=on_ok)
        cancel.bind(on_press=pop.dismiss)
        pop.open()

    def refresh_skills(self):
        self.skills_container.clear_widgets()
        self.skill_count_label.text = f"Skills/Spells: {len(self.skills)}"

        if not self.skills:
            self.skills_container.add_widget(lbl('(none yet)'))
            return

        for i, sk in enumerate(self.skills):
            row = BoxLayout(size_hint_y=None, spacing=dp(4))
            row.bind(minimum_height=row.setter('height'))

            ep_label = ep_display(sk['ep_str'])
            if sk['note']:
                text = f"{sk['name']} [{sk['type']}]  ·  {ep_label}\n{sk['note']}"
            else:
                text = f"{sk['name']} [{sk['type']}]  ·  {ep_label}"

            row.add_widget(lbl(text, h=dp(48), fs=dp(12)))

            auto_label = Label(
                text='Auto-roll', size_hint_x=None, width=dp(55),
                font_size=dp(9), halign='right', valign='middle',
            )
            auto_label.bind(size=lambda s, *_: setattr(s, 'text_size', (s.width, None)))
            row.add_widget(auto_label)

            auto_cb = CheckBox(size_hint_x=None, width=dp(40))
            auto_cb.active = sk['auto']
            auto_cb.bind(active=lambda cb, val, idx=i: self.toggle_skill_auto(idx, val))
            row.add_widget(auto_cb)

            use_btn = Button(text='Use', size_hint_x=None, width=dp(55))
            use_btn.bind(on_press=lambda _, idx=i: self.use_skill(idx))
            row.add_widget(use_btn)

            rm_btn = Button(text='X', size_hint_x=None, width=dp(35))
            rm_btn.bind(on_press=lambda _, idx=i: self.remove_skill(idx))
            row.add_widget(rm_btn)

            self.skills_container.add_widget(row)

    # ---------- Scrolls ----------
    def open_scrolls(self, instance):
        content = BoxLayout(orientation='vertical', padding=dp(8), spacing=dp(6))
        status = Label(text='Click Add to add a scroll-learned skill.',
                       size_hint_y=None, height=dp(24))
        content.add_widget(status)

        sv = ScrollView()
        inner = BoxLayout(orientation='vertical', size_hint_y=None, spacing=dp(4))
        inner.bind(minimum_height=inner.setter('height'))

        for sp in SCROLL_SKILLS:
            row = BoxLayout(size_hint_y=None, spacing=dp(6))
            row.bind(minimum_height=row.setter('height'))

            text_box = BoxLayout(orientation='vertical', size_hint_y=None)
            text_box.bind(minimum_height=text_box.setter('height'))
            title = lbl(f"{sp['name']}  ·  {ep_display(sp['ep'])}",
                        h=dp(24), bold=True)
            note = lbl(sp['note'], h=dp(24), fs=dp(11))
            text_box.add_widget(title)
            text_box.add_widget(note)

            add_btn = Button(text='Add', size_hint_x=None, width=dp(55))
            add_btn.bind(on_press=lambda _, s=sp: self.add_from_scrolls(s, status))

            row.add_widget(text_box)
            row.add_widget(add_btn)
            inner.add_widget(row)

        sv.add_widget(inner)
        content.add_widget(sv)

        close = Button(text='Close', size_hint_y=None, height=dp(40))
        content.add_widget(close)

        pop = Popup(title='Scroll Skills', content=content, size_hint=(0.9, 0.85))
        close.bind(on_press=pop.dismiss)
        pop.open()

    def add_from_scrolls(self, skill, status_label):
        for existing in self.skills:
            if existing['name'].lower() == skill['name'].lower():
                status_label.text = f"{skill['name']} is already in your list."
                return
        self.skills.append({
            'name': skill['name'],
            'ep_str': skill['ep'],
            'type': skill['type'],
            'auto': True,
            'note': skill['note'],
        })
        self.refresh_skills()
        status_label.text = f"Added {skill['name']}."

    # ---------- Reactions ----------
    def toggle_reaction_auto(self, name, value):
        self.reaction_auto[name] = value

    def use_reaction(self, idx):
        reactions = self._get_active_reactions()
        if not (0 <= idx < len(reactions)):
            return
        rx = reactions[idx]
        max_ep = CLASS_STATS[self.current_class]['max_ep']
        auto_on = self.reaction_auto.get(rx['name'], True)

        if rx.get('coinflip') and auto_on:
            flip = random.choice(['Heads', 'Tails'])
            if flip == 'Heads':
                self.skill_status.text = (
                    f"{rx['name']}: Coinflip → {flip} — SUCCESS! "
                    f"All damage negated. No EP added. "
                    f"(EP now {self.ep}/{max_ep})"
                )
                return
            else:
                kind, val = classify_ep(rx['ep'])
                if kind == 'manual':
                    self.ask_ep_amount(rx['name'])
                    return
                if kind == 'formula':
                    rolled = roll_formula(val)
                else:
                    rolled = int(val)
                endurance = CLASS_STATS[self.current_class]['phys_end']
                effective = max(0, rolled - endurance)
                before = self.ep
                self.gain_ep(effective)
                gained = self.ep - before
                self.skill_status.text = (
                    f"{rx['name']}: Coinflip → {flip} — FAIL. "
                    f"Take full damage. +{gained} EP after -{endurance} endurance. "
                    f"(EP now {self.ep}/{max_ep})"
                )
                return

        if not auto_on:
            self.ask_ep_amount(rx['name'])
            return

        kind, val = classify_ep(rx['ep'])
        if kind == 'manual':
            self.ask_ep_amount(rx['name'])
            return

        if kind == 'formula':
            rolled = roll_formula(val)
            rolled_disp = f"rolled {val} → {rolled}"
        else:
            rolled = int(val)
            rolled_disp = f"{rolled}"

        if rolled < 0:
            endurance = 0
            effective = rolled
        else:
            endurance = CLASS_STATS[self.current_class]['phys_end']
            effective = max(0, rolled - endurance)

        before = self.ep
        self.gain_ep(effective)
        gained = self.ep - before

        if rolled < 0:
            self.skill_status.text = (
                f"{rx['name']}: {rolled_disp} → {gained} EP (now {self.ep}/{max_ep})"
            )
        else:
            self.skill_status.text = (
                f"{rx['name']} (reaction): {rolled_disp} EP, "
                f"- {endurance:+d} END → +{gained} EP (now {self.ep}/{max_ep})"
            )

    def _get_active_reactions(self):
        base = [dict(r) for r in REACTIONS.get(self.current_class, [])]
        names = {r['name'] for r in base}
        _, _, _, granted, _ = self.get_armor_totals()
        for g in granted:
            if g in names:
                continue
            if g in ALL_REACTIONS:
                base.append(dict(ALL_REACTIONS[g]))
                names.add(g)
        return base

    def refresh_reactions(self):
        self.reactions_container.clear_widgets()
        reactions = self._get_active_reactions()
        if not reactions:
            self.reactions_container.add_widget(lbl('(none for this class)'))
            return

        for i, rx in enumerate(reactions):
            row = BoxLayout(size_hint_y=None, spacing=dp(4))
            row.bind(minimum_height=row.setter('height'))

            ep_label = ep_display(rx['ep'])
            text = f"{rx['name']}  ·  {ep_label}\n{rx['note']}"
            row.add_widget(lbl(text, h=dp(52), fs=dp(11)))

            label_text = 'Auto-flip' if rx.get('coinflip') else 'Auto-roll'
            auto_label = Label(
                text=label_text, size_hint_x=None, width=dp(55),
                font_size=dp(9), halign='right', valign='middle',
            )
            auto_label.bind(size=lambda s, *_: setattr(s, 'text_size', (s.width, None)))
            row.add_widget(auto_label)

            auto_cb = CheckBox(size_hint_x=None, width=dp(40))
            auto_cb.active = self.reaction_auto.get(rx['name'], True)
            auto_cb.bind(active=lambda cb, val, name=rx['name']:
                         self.toggle_reaction_auto(name, val))
            row.add_widget(auto_cb)

            use_btn = Button(text='Use', size_hint_x=None, width=dp(55))
            use_btn.bind(on_press=lambda _, idx=i: self.use_reaction(idx))
            row.add_widget(use_btn)

            self.reactions_container.add_widget(row)

    # ---------- Status Effects ----------
    def add_effect_from_spinner(self, instance):
        self.add_effect(self.effect_spinner.text)

    def add_effect(self, name):
        if len(self.status_effects) >= 5:
            self.show_popup('Max Effects',
                            'You can only have 5 effects at once.\nRemove one first.')
            return
        if any(e['name'] == name for e in self.status_effects):
            self.show_popup('Already Active',
                            f'You already have {name}.')
            return

        if name == 'Incapacitated':
            self.status_effects = [
                e for e in self.status_effects if e['name'] != 'Bleeding'
            ]
        elif name == 'Bleeding':
            if any(e['name'] == 'Incapacitated' for e in self.status_effects):
                self.show_popup('Replaced',
                                'Incapacitated already covers Bleeding.')
                return

        self.status_effects.append({'name': name, 'autoflip': False})
        self.refresh_effects()

    def remove_effect(self, idx):
        if not (0 <= idx < len(self.status_effects)):
            return
        play_sound(EFFECT_REMOVE_SOUND_FILE)
        name = self.status_effects[idx]['name']
        if name == 'Infected':
            self.stop_infected()
        self.status_effects.pop(idx)
        self.refresh_effects()

    def set_effect_autoflip(self, idx, value):
        if 0 <= idx < len(self.status_effects):
            self.status_effects[idx]['autoflip'] = value

    def trigger_effect(self, idx):
        if not (0 <= idx < len(self.status_effects)):
            return
        eff = self.status_effects[idx]
        name = eff['name']
        info = STATUS_EFFECTS.get(name, {})
        trigger = info.get('trigger')
        max_ep = CLASS_STATS[self.current_class]['max_ep']

        if trigger == 'damage':
            if 'dice' in info:
                dmg = roll_formula(info['dice'])
                self.hp = max(0, self.hp - dmg)
                self.hp_input.text = str(self.hp)
                msg = f"{name}: -{dmg} HP (now {self.hp}). Add fire vulnerability if applicable."
            elif 'fixed' in info:
                dmg = info['fixed']
                self.hp = max(0, self.hp - dmg)
                self.hp_input.text = str(self.hp)
                msg = f"{name}: -{dmg} HP (now {self.hp})."
            else:
                msg = f"{name}: no HP change configured."

            if info.get('coinflip') and eff.get('autoflip'):
                flip = random.choice(['Heads', 'Tails'])
                if flip == 'Heads':
                    msg += f"\nCoinflip: {flip} — melee attacker gets Burn I."
                else:
                    msg += f"\nCoinflip: {flip} — attacker does not burn."
            elif info.get('coinflip') and not eff.get('autoflip'):
                msg += "\n(Coinflip disabled — flip a coin yourself.)"

            self.skill_status.text = msg

        elif trigger == 'heal':
            heal = roll_formula(info['dice'])
            self.hp += heal
            self.hp_input.text = str(self.hp)
            self.skill_status.text = f"{name}: +{heal} HP (now {self.hp})"

        elif trigger == 'damage_ep':
            dmg = info.get('fixed', 0)
            ep = info.get('ep', 0)
            self.hp = max(0, self.hp - dmg)
            self.hp_input.text = str(self.hp)
            self.gain_ep(ep)
            self.skill_status.text = (
                f"{name}: -{dmg} HP, +{ep} EP "
                f"(now {self.hp} HP, {self.ep}/{max_ep} EP)"
            )

        elif trigger == 'timer':
            self.start_infected()

    # ---------- Infected timer ----------
    def start_infected(self):
        if self._infected_event:
            self._infected_event.cancel()
        self._infected_remaining = 30 * 60
        self._infected_event = Clock.schedule_interval(self._tick_infected, 1.0)
        self._update_infected_display()

    def stop_infected(self):
        if self._infected_event:
            self._infected_event.cancel()
            self._infected_event = None
        self._infected_remaining = 0
        self._update_infected_display()

    def _tick_infected(self, dt):
        if self._infected_remaining <= 0:
            if self._infected_event:
                self._infected_event.cancel()
                self._infected_event = None
            self._update_infected_display()
            return False

        self._infected_remaining -= 1
        self._update_infected_display()

        if self._infected_remaining <= 0:
            if self._infected_event:
                self._infected_event.cancel()
                self._infected_event = None
            self.show_popup(
                'INFECTED — TIMER UP',
                'You have become a Ghoul.\nStart a Ghoul encounter now.'
            )
            return False
        return True

    def _update_infected_display(self):
        if self._infected_remaining > 0:
            m = self._infected_remaining // 60
            s = self._infected_remaining % 60
            self.infected_status_label.text = f"Infected timer: {m:02d}:{s:02d}"
        else:
            self.infected_status_label.text = ''

    def refresh_effects(self):
        self.effects_container.clear_widgets()
        self.effect_count_label.text = f"Active effects: {len(self.status_effects)} / 5"

        if not self.status_effects:
            self.effects_container.add_widget(lbl('(none)'))
            return

        for i, eff in enumerate(self.status_effects):
            name = eff['name']
            info = STATUS_EFFECTS.get(name, {})

            row = BoxLayout(size_hint_y=None, spacing=dp(4))
            row.bind(minimum_height=row.setter('height'))

            text = f"{name}\n{info.get('desc', '')}"
            row.add_widget(lbl(text, h=dp(52), fs=dp(11)))

            if info.get('coinflip'):
                auto_label = Label(
                    text='Auto-coinflip', size_hint_x=None, width=dp(70),
                    font_size=dp(9), halign='right', valign='middle',
                )
                auto_label.bind(size=lambda s, *_: setattr(s, 'text_size', (s.width, None)))
                row.add_widget(auto_label)

                cb = CheckBox(size_hint_x=None, width=dp(40))
                cb.active = eff.get('autoflip', False)
                cb.bind(active=lambda c, v, idx=i: self.set_effect_autoflip(idx, v))
                row.add_widget(cb)

            trigger = info.get('trigger')
            if trigger == 'timer':
                start_btn = Button(text='Start', size_hint_x=None, width=dp(55))
                start_btn.bind(on_press=lambda _,: self.start_infected())
                row.add_widget(start_btn)

                stop_btn = Button(text='Stop', size_hint_x=None, width=dp(50))
                stop_btn.bind(on_press=lambda _,: self.stop_infected())
                row.add_widget(stop_btn)
            elif trigger:
                trig_btn = Button(text='Trigger', size_hint_x=None, width=dp(65))
                trig_btn.bind(on_press=lambda _, idx=i: self.trigger_effect(idx))
                row.add_widget(trig_btn)

            rm_btn = Button(text='X', size_hint_x=None, width=dp(35))
            rm_btn.bind(on_press=lambda _, idx=i: self.remove_effect(idx))
            row.add_widget(rm_btn)

            self.effects_container.add_widget(row)

    # ---------- Inventory ----------
    def add_item(self, instance):
        name = self.item_name.text.strip()
        if not name:
            return
        try:
            qty = max(1, int(self.item_qty.text))
        except ValueError:
            qty = 1

        remaining = qty
        for it in self.inventory:
            if it['name'].lower() == name.lower() and it['qty'] < MAX_STACK:
                add = min(remaining, MAX_STACK - it['qty'])
                it['qty'] += add
                remaining -= add
                if remaining == 0:
                    break

        while remaining > 0 and len(self.inventory) < MAX_SLOTS:
            add = min(remaining, MAX_STACK)
            self.inventory.append({'name': name, 'qty': add})
            remaining -= add

        if remaining > 0:
            self.show_popup('Inventory Full',
                            f'Could not fit {remaining} of {name}.')

        self.item_name.text = ''
        self.item_qty.text = '1'
        self.refresh_inventory()

    def remove_slot(self, index, amount=None):
        if index < 0 or index >= len(self.inventory):
            return
        it = self.inventory[index]
        if amount is None or amount >= it['qty']:
            self.inventory.pop(index)
        else:
            it['qty'] -= amount
        self.refresh_inventory()

    def refresh_inventory(self):
        self.inv_container.clear_widgets()
        self.slot_label.text = f"Slots used: {len(self.inventory)} / {MAX_SLOTS}"
        if not self.inventory:
            self.inv_container.add_widget(lbl('(empty)'))
            return
        for i, it in enumerate(self.inventory):
            row = BoxLayout(size_hint_y=None, spacing=dp(4))
            row.bind(minimum_height=row.setter('height'))
            row.add_widget(lbl(f"{i+1}. {it['name']} x{it['qty']}"))
            btn_minus = Button(text='-1', size_hint_x=None, width=dp(50))
            btn_minus.bind(on_press=lambda _, idx=i: self.remove_slot(idx, 1))
            row.add_widget(btn_minus)
            btn_drop = Button(text='Drop', size_hint_x=None, width=dp(60))
            btn_drop.bind(on_press=lambda _, idx=i: self.remove_slot(idx))
            row.add_widget(btn_drop)
            self.inv_container.add_widget(row)

    # ---------- Popups ----------
    def show_popup(self, title, message):
        content = BoxLayout(orientation='vertical', padding=dp(10), spacing=dp(10))
        content.add_widget(Label(text=message, halign='center'))
        ok = Button(text='OK', size_hint_y=None, height=dp(40))
        content.add_widget(ok)
        pop = Popup(title=title, content=content, size_hint=(0.8, 0.4))
        ok.bind(on_press=pop.dismiss)
        pop.open()

    def show_help(self, instance):
        content = BoxLayout(orientation='vertical', padding=dp(10), spacing=dp(8))
        sv = ScrollView()
        help_label = Label(
            text=HELP_TEXT,
            size_hint_y=None,
            halign='left',
            valign='top',
            font_size=dp(12),
        )
        help_label.bind(
            width=lambda s, *_: setattr(s, 'text_size', (s.width, None)),
            texture_size=lambda s, *_: setattr(s, 'height', s.texture_size[1]),
        )
        sv.add_widget(help_label)
        content.add_widget(sv)

        close = Button(text='Close', size_hint_y=None, height=dp(40))
        content.add_widget(close)

        pop = Popup(title='Help', content=content, size_hint=(0.9, 0.85))
        close.bind(on_press=pop.dismiss)
        pop.open()


class CharacterApp(App):
    def build(self):
        self.title = 'T.A.D. Character Sheet'
        sv = ScrollView()
        sv.add_widget(CharacterSheet())
        return sv


if __name__ == '__main__':
    CharacterApp().run()