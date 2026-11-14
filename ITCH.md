# PyDungeon on Itch.io

Store-page copy and assets for the **main (English) page**. The game ships as
**HTML5**: no install, no server, no account.

The Russian version of this page is kept in `ITCH.ru.md` for a possible
separate Russian-language project. English cover and screenshots are built
with `--lang en`: `assets/itch/cover-630x500-en.png` and the `*-en.png` files
in `assets/itch/screenshots/`.

## Card

- **Title:** PyDungeon
- **Short description:** A dungeon game where every battle is a Python question. 15 floors, 5 bosses, one dragon. Browser, no server.
- **Version:** 1.55.3
- **Status:** In development (early access)
- **Price:** free (voluntary donations optional)
- **Genre:** RPG / Roguelike / Educational
- **Platform:** HTML5, browser
- **Language:** English (also Russian)
- **Website:** https://jellyfish2077.github.io/Dungeon-of-Python/
- **GitHub:** https://github.com/JellyFish2077/Dungeon-of-Python

## Tags

`python`, `roguelike`, `dungeon crawler`, `quiz`, `pixel art`, `browser game`, `educational`, `procedural generation`, `singleplayer`, `dark fantasy`, `english`, `russian`

## Store description

**PyDungeon** is a small dungeon game where you fight with Python knowledge.
Each battle asks one Python question. Answer correctly and you hit the
monster. Make a mistake and it hits you.

### Early development

The full run is playable, but content, balance and interface will keep
changing.

### How a run works

You go down **15 floors** with a field journal. Each floor has its own look:
caves, catacombs, ice halls, demons and a dragon's lair.

Questions come in five forms:

- choose an answer;
- fill in the blank;
- find the error;
- copy code;
- write a function.

A full run takes about **two hours** and ends if you die.

After floor six the road is closed until you return to the village and rebuild
the forge. The village stays between runs: the barn, the well, the forge and
the master's house give permanent upgrades. Materials and keys are not lost
when you die.

### Saves and privacy

Saves are three browser slots. You can export and import them as JSON.

Nothing is sent to a server, and Python code runs locally in your browser
with Pyodide.

Saves on itch and github.io are separate; move them with export and import.

### Why it exists

It grew out of teaching. I wanted my students to practise Python in a game,
not a test: short questions, immediate feedback, and a reason to keep going.
That is still the goal.

I use AI tools for code, text and ideas, but the project is educational
first. Direction, editing and final decisions are mine.

I am now collecting player feedback — what is clear, what is frustrating,
where the difficulty spikes — to improve and develop the concept. Comments on
the itch page or [GitHub issues](https://github.com/JellyFish2077/Dungeon-of-Python/issues)
are equally welcome.

### What's inside

- The “Seals of the Deep” campaign: five chapters, a journal, quests and a finale.
- 15 floors, 5 biomes, 5 bosses.
- Five types of Python tasks.
- A village with buildings and permanent upgrades.
- Run omens that change risk and reward.
- Three crossroads choices: a deal, a gift, or walk past.
- Equipment, rarities, sets, potions and return amulets.
- Three save slots with export and import.
- 32×32 pixel art made in Aseprite.
- Mouse and keyboard on desktop; touch on phones.

### Controls

| Key | Action |
|---|---|
| `WASD` / arrow keys | walk around the map |
| `E` | interact: door, chest, stairs, villager |
| `Space` | skip a turn |
| `I` | inventory |
| `M` | minimap |
| `Esc` | pause or close a window |
| mouse wheel | zoom the map |

On phones the game runs in both orientations: in portrait the panels take the
full width, in landscape battle opens in a right-hand column over the map.
Controls are touch-based: tap a tile to move, and the button at the bottom
performs an action. Drag the map with a mouse or a finger, and pinch with two
fingers to zoom. On phones the minimap opens with the “Map” button in the
header. The interface adapts to the browser's visible height, so the bottom
bar and system notifications do not cover the HUD and buttons. Answer options
are chosen by touch or click — the A–D keys are not used.

## Colophon

**How the game was made.** Code, text and some of the ideas were created with
the help of AI. Direction, editing and final decisions are the author's.
Graphics are Aseprite and open DCSS tiles (CC0), with no AI generation.
Fonts are Golos Text and Handjet.

No accounts and no servers: your profile and saves live in `localStorage`,
and Python code is checked by Pyodide right in the browser.

## Upload assets

- Archive: `dist/pydungeon-standalone-1.55.3.zip` (contains `LICENSE` and `CREDITS.md`)
- Cover: `assets/itch/cover-630x500-en.png` — `python tools/make_itch_cover.py --lang en`
  (background and dragon sprite come from the build)
- Icon: `assets/logo/PyDungeon-icon-512.png` — for the Boosty/social avatar;
  the browser favicon and desktop `assets/PyDungeon.ico` already use it
- Page background: `assets/itch/background-1920x1080.png` (or
  `background-2560x1440.png`) — `python tools/make_itch_background.py`
- Screenshots, 1280×800, captured from the build:
  `python tools/shot_itch.py --lang en`
  - `assets/itch/screenshots/menu-en.png`
  - `assets/itch/screenshots/village-en.png`
  - `assets/itch/screenshots/journal-en.png`
  - `assets/itch/screenshots/battle-en.png`

The archive already has `index.html` at its root and a local Pyodide.
Upload it as an **HTML game**, not as a regular file.

## Itch page settings

- Kind of project: **HTML**
- Embed: **click to launch** or the embedded player
- Viewport: **1280×800**
- Fullscreen: **on**
- Mobile friendly: **on** — portrait and landscape are supported, controls are touch-based
- Shared storage / localStorage: **no server required**
- Network: **not required** after Pyodide loads

For the theme, upload `assets/itch/background-1920x1080.png` as the page
background and turn repeating off. Keep **BG** `#07090c` so any uncovered
edges match, and set **BG2 Alpha** around 90% so the text column stays readable.

The page theme can match the cover:

- background: `#090b0a`
- text: `#d9cbb0`
- links and accent: `#8a4a32`
- secondary text: `#a99d87`

## Pre-publication checklist

- [ ] Play the opening from the site root: guard → battle → gate → village.
- [ ] Check saving, loading, export and import of a save.
- [ ] Confirm Mobile friendly is on and the page has no “desktop only” note.
- [ ] Make sure the main menu does not link out to a separate landing page.
- [ ] Run `python tools/verify_zip.py`: it checks the archive itself and launches it in a sandboxed iframe like itch does.
- [ ] Upload the archive and confirm the game starts from `index.html`.
- [ ] Set the License field to **MIT**. `LICENSE` and `CREDITS.md` are inside the archive.
- [ ] In the embed, sandboxing blocks save downloads, so the save menu has “Show JSON” — use that to verify save transfer.
- [ ] Add the cover and four screenshots.
- [ ] Check the page in a private window.
- [ ] After publishing, update the link in the README.

## After release

1. Collect feedback on the first run and the village economy.
2. Fix onboarding and balance without changing the save format.
3. Add content: enemies, items, events, bosses.
4. Decide the fate of the `classroom` branch and repository privacy.
5. Rebuild the archive, cover and screenshots with every release; otherwise
   the page keeps an old version, as happened with the 1.9.0 cover.
