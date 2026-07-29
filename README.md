# tannguyen.io

Personal site for **Tan Nguyen** (aka **CostlyToaster**). A space-themed, build-free static site rendered with [Babylon.js](https://www.babylonjs.com/) (loaded from CDN).

## Pages

| Page | Path | What it is |
|---|---|---|
| Resume game | `/` | A whimsical office on a floating island under a giant tree, with real-time sun and shadows. Spin the island between areas of interest, browse the resume from the menu — and shoot the laptop with a nerf dart to get in touch. |
| Orrery | `/solar-system/` | A cinematic, interactive field guide to the solar system. |

## Running locally

No build step — serve the repo root with any static server:

```bash
python3 serve.py        # dev server with caching disabled (recommended)
# or: python3 -m http.server 8080  (browsers may cache stale JS — hard-refresh with Ctrl+Shift+R)
```

Then open http://localhost:8080. (Opening `index.html` directly via `file://` won't work — ES modules and `fetch('resume.json')` need HTTP.)

## Controls

**Resume game (`/`)**
- Drag — pivot the camera freely in place (it re-centers when you switch areas)
- `A` / `D` or the on-screen ‹ › arrows — spin the island to the next area of interest (The Desk, The Grove, The Meadow)
- Click — fire a nerf dart at the click point; darts drop slightly over distance
- Dev only: append `?camdebug` to the URL for a free-flying camera (WASD/QE + drag), a live position/direction readout, and a 1-metre measuring grid with numbered X (red) / Y (green) / Z (blue) axes drawn over the scene. The HUD prints both the **world** position and the **island** position — props are placed in the island's frame, and the two only match while the island is unrotated (`spin 0°`)
- Shoot the laptop on the desk — it gets knocked back tilted with a grumpy face, the camera zooms up to its screen, and the contact info types itself out on a translucent black "screen"; closing it (✕, `Esc`, or clicking outside) flies the camera back to where you were and calms the laptop down
- Shoot the alphabet block on the desk — the camera zooms in and a panel lists the three languages I speak; clicking a flag (🇺🇸 / 🇻🇳 / 🇯🇵) re-renders the whole page in that language, and the choice is remembered
- Pan right from the opening view to find the Matsue crest propped against the rock past the desk; shoot it and the camera drops below the island's rim to look back up at it. Click anywhere or press `Esc` to fly back
- Shoot the starry hollow in the big tree — the camera flies in, everything goes dark, and you arrive at the solar system
- During any close-up the hero text, hint, and area controls fade out so nothing covers what you shot
- The section menu (bottom-left) opens every resume section (About, Experience, Projects, Skills, Contact), and keeps the resume fully usable when WebGL is unavailable
- `Esc`, the ✕, or clicking anywhere outside the panel — close it

**Orrery (`/solar-system/`)**
- Drag — orbit the camera · Scroll — travel
- Number rail or `←/→/↑/↓`, `Home`, `End` — select a body
- Drag on a selected body — spin it

## Editing content

All resume content lives in **`resume.json`** — name, about, experience, skills, projects, and social links. Edit it and refresh; no code changes needed. Current values are placeholders marked `PLACEHOLDER`.

Vietnamese and Japanese versions of that content go under `translations.vi` / `translations.ja` in the same file; anything a translation leaves out falls back to the English entry. Every other string on the page (buttons, hints, panel labels) lives in **`js/home/i18n.js`**, keyed — markup opts in with `data-i18n`, `data-i18n-html`, or `data-i18n-label`.

Areas, the dart physics, and the two close-up camera vantages live in `js/home/config.js`.

## Project layout

```
index.html          Landing page (resume game)
resume.json         All resume content
css/                home.css (landing theme), base.css + solar-system.css (orrery)
js/home/            Landing page modules: main, config, game, darts, panel,
                    laptopScreen, languages, i18n
models/             .glb props for the outdoor office (see credits below)
solar-system/       The orrery page (index.html + app.js)
textures/           Planet/starfield textures
```

The alphabet block on the desk is drawn at runtime with a canvas (DynamicTexture) and the flags are inline SVG — neither needs an image asset. The block is a placeholder: swap in a `.glb` where `lang-block` is built in `js/home/game.js` whenever you have one.

## Asset credits

The floating island (`Island.glb`, terrain + giant tree + rocks), desk (`Desk.glb`), office chair (`Chair.glb`), laptop (`Laptop.glb` / `LaptopFace.glb`), energy drink (`EnergyDrink.glb`), waste basket (`WasteBasket.glb`), Matsue crest (`MatsueCrest.glb`), and beanbag chair (`BeanbagChair.glb`) are Tan's own assets (via Fab).

Other 3D models via [Poly Pizza](https://poly.pizza) (full list in `models/attributions.txt`; a few downloaded models are kept in `models/` but not currently placed in the scene):

**CC0 (public domain):** Cabinet, Rug Round — [Kenney](https://kenney.nl); Trees, Twisted Tree — [Quaternius](https://quaternius.com). Also CC0: social SVG icons from [Simple Icons](https://simpleicons.org/).

**CC-BY (attribution):**
- "Desk" by dook
- "Big Tree" by 3Donimus
- "Palm tree" by Poly by Google
- "Chair" by CMHT Oculus
- "Bear" by jiang liu
- "Dartboard" and "Darts" by Jarlan Perez
- "Phone" by Alex Safayan and "TIME HOTEL 1.20" by S. Paul Michael (in `models/`, not currently used in the scene)

Space textures were sourced previously for the solar system guide.
