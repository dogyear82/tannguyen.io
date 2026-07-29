// 3D scene data for the landing game. Resume *content* lives in resume.json;
// this file defines the areas of interest, target spots, and dart feel.
// i18n keys — the strings themselves live in i18n.js.
export const SECTION_TITLES = {
  about: 'title.about',
  experience: 'title.experience',
  projects: 'title.projects',
  skills: 'title.skills',
  contact: 'title.contact'
};

// Areas of interest around the island. A/D or the on-screen arrows rotate
// the island so the chosen area's bearing faces the player, while the
// camera glides to that area's tuned vantage.
// pos/target are hand-tuned via the ?camdebug HUD with the island in its
// LOADED (unrotated) orientation — fly to the area, read the HUD, paste.
// The game rotates each pose by the area's bearing at build time.
export const AREAS = [
  { name: 'area.desk',   bearing: 0,                pos: [.94, 1.23, -7.91],  target: [-4.02, 2.53, .68] },
  { name: 'area.grove',  bearing: 2 * Math.PI / 3,  pos: [.13, 5.26, 9.76],   target: [4.23, -.39, 2.60] },
  { name: 'area.meadow', bearing: 4 * Math.PI / 3,  pos: [-8.90, 11.45, 6.24], target: [.90, 11.04, 4.28] }
];

export const ISLAND = { r: 7.5, spinSecs: .8 };

// Nerf dart: fast with a slight gravity drop — point and click, with a small
// aim-high at long range.
export const DART = {
  speed: 28,
  g: 7,
  r: .12,
  muzzleForward: .7,
  muzzleDown: .35,
  converge: 12,   // miss clicks aim at a point this far along the view ray
  maxFlight: 3,
  pool: 8
};

// Delay between a laptop hit and the contact popup, so the reaction reads.
export const KNOCK = { popupDelayMs: 350 };

// Close-up vantage of the laptop screen for the contact view. Captured with
// the ?camdebug HUD in the island's LOADED (unrotated) orientation, like the
// AREAS poses; the game rotates it by the island's live angle at hit time.
export const CONTACT_CAM = {
  pos: [-.72, 1.56, -5.34],
  target: [2.47, -3.02, 2.96],
  zoomSecs: 1.0
};

// Close-up of the language block on the desk, captured the same way.
export const LANGUAGES_CAM = {
  pos: [-.10, 1.48, -5.85],
  target: [.27, -2.06, 3.49],
  zoomSecs: 1.0
};

// The Matsue crest, propped against the rock out past the desk. This one
// drops below the rim and looks back up at the island.
export const CREST_CAM = {
  pos: [6.14, -.35, -6.38],
  target: [-.76, 2.72, .18],
  zoomSecs: 1.2
};
