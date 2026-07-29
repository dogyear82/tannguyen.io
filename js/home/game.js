// The landing game: a whimsical office on a floating island. A/D or the
// on-screen arrows rotate the island to the next area of interest; click to
// fire a nerf dart. Shooting the laptop on the desk makes it pull a face
// and opens the contact panel; the other sections live in the menu.
import { AREAS, ISLAND, DART, KNOCK, CONTACT_CAM, LANGUAGES_CAM, CREST_CAM } from './config.js';
import { createDarts } from './darts.js';
import { isPanelOpen, getResume } from './panel.js';
import { openScreen, isScreenOpen, onScreenClosed } from './laptopScreen.js';
import { openLanguagePanel, isLanguagePanelOpen, onLanguagePanelClosed } from './languages.js';
import { t, onLangChange } from './i18n.js';

const B = window.BABYLON;

// Filenames as they exist in /models (credits in README / attributions.txt).
const M = {
  island: 'Island.glb',
  desk: 'Desk.glb',
  deskChair: 'Chair.glb',
  laptop: 'Laptop.glb',
  laptopFace: 'LaptopFace.glb',
  energyDrink: 'EnergyDrink.glb',
  wasteBasket: 'WasteBasket.glb',
  crest: 'MatsueCrest.glb',
  beanbag: 'BeanbagChair.glb',
  cabinet: 'Cabinet Bed Drawer Tabl by Kenney - EcvXBrClPe.glb',
  chair: 'Chair by CMHT Oculus - 1MFMOaz3zqe.glb',
  bear: 'Bear by jiang liu - 3Eb9oLfZYIc.glb',
  dartboard: 'Dartboard by Jarlan Perez - drNqt_5ReeP.glb',
  darts: 'Darts by Jarlan Perez - eab-9L4WRWZ.glb'
};

const DESK_POSE = { x: -.7, y: 0, z: -4.95, height: 1.0, rotY: Math.PI + .4 };
const TABLETOP_Y = DESK_POSE.y + DESK_POSE.height;

// Props are easier to arrange in the desk's own coordinates than in world
// space. +X runs across the desk and +Z points toward the chair.
const onDesk = (x, z) => ({
  x: DESK_POSE.x + Math.cos(DESK_POSE.rotY) * x + Math.sin(DESK_POSE.rotY) * z,
  z: DESK_POSE.z - Math.sin(DESK_POSE.rotY) * x + Math.cos(DESK_POSE.rotY) * z
});

const LAPTOP_POSE = {
  ...onDesk(-.15, .02),
  y: TABLETOP_Y,
  height: .42,
  rotY: DESK_POSE.rotY
};
// Island-local. faceX/faceZ is the point the chair is turned toward.
const BEANBAG = { x: -3.75, y: .16, z: 3.25, faceX: -5, faceZ: 4, height: .8 };

const STANDING_CAN_POSE = onDesk(.62, -.08);
const SIDE_CAN_POSE = onDesk(.50, .22);

const wrapPi = d => ((d + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;

export async function buildScene(engine, canvas) {
  const scene = new B.Scene(engine);
  const skyColor = B.Color3.FromHexString('#a6ddf4');
  scene.clearColor = B.Color4.FromColor3(skyColor, 1);
  scene.fogMode = B.Scene.FOGMODE_LINEAR;
  scene.fogStart = 28;
  scene.fogEnd = 70;
  scene.fogColor = skyColor;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // ?camdebug: free-flying camera + live coordinates HUD for tuning the
  // area vantages. Normal visitors only pivot the camera in place.
  const DEBUG_CAM = new URLSearchParams(location.search).has('camdebug');

  // The camera pivots in place for the player; on area switches it glides
  // to that area's tuned vantage while the island rotates.
  const camera = new B.FreeCamera('player', B.Vector3.FromArray(AREAS[0].pos), scene);
  camera.minZ = .1;
  // Precompute each area's pose. Config poses are captured with the island
  // unrotated, so rotate them by the area's bearing (the same rotation the
  // island content undergoes when that area comes to the front), then read
  // the resulting Euler angles off the camera.
  const areaPoses = AREAS.map(a => {
    const rotM = B.Matrix.RotationY(a.bearing);
    const pos = B.Vector3.TransformCoordinates(B.Vector3.FromArray(a.pos), rotM);
    const tgt = B.Vector3.TransformCoordinates(B.Vector3.FromArray(a.target), rotM);
    camera.position.copyFrom(pos);
    camera.setTarget(tgt);
    return { pos, rot: camera.rotation.clone() };
  });
  camera.position.copyFrom(areaPoses[0].pos);
  camera.rotation.copyFrom(areaPoses[0].rot);
  camera.attachControl(canvas, true);
  if (DEBUG_CAM) {
    // Babylon's keyboard input listens on the canvas — make it focusable.
    canvas.tabIndex = 0;
    canvas.focus();
    camera.speed = .5;
    camera.keysUp = [87, 38];      // W / ↑
    camera.keysDown = [83, 40];    // S / ↓
    camera.keysLeft = [65, 37];    // A / ←
    camera.keysRight = [68, 39];   // D / →
    camera.keysUpward = [69];      // E
    camera.keysDownward = [81];    // Q
  } else {
    // Pivot-only: no movement keys, just mouse/touch look.
    camera.inputs.removeByType('FreeCameraKeyboardMoveInput');
  }

  // Everything on the island hangs off this node.
  const islandRoot = new B.TransformNode('islandRoot', scene);

  // Dev-only measuring grid, loaded on demand so normal visits never fetch it.
  if (DEBUG_CAM) {
    const { buildDebugGrid } = await import('./debugGrid.js');
    buildDebugGrid(scene, islandRoot);
  }

  // --- Island rotation rig ---
  let areaIndex = 0;
  let spin = null; // { from, to, t, camFrom }
  // Declared up here because switchArea (reachable via the arrow buttons
  // while models are still loading) checks them.
  let portal = null;
  // A close-up on something shootable: { kind, phase: 'in'|'hold'|'out', t,
  // fromPos, fromRot, toPos, toRot, savedPos, savedRot, onArrive }
  let focus = null;
  const chip = document.getElementById('areaChip');
  const setChip = () => { if (chip) chip.textContent = t(AREAS[areaIndex].name); };
  setChip();
  onLangChange(setChip);

  const switchArea = index => {
    if (portal || focus) return; // mid-portal or close-up: no switching
    areaIndex = ((index % AREAS.length) + AREAS.length) % AREAS.length;
    const bearing = AREAS[areaIndex].bearing;
    if (reduceMotion) {
      islandRoot.rotation.y = bearing;
      if (!DEBUG_CAM) {
        camera.position.copyFrom(areaPoses[areaIndex].pos);
        camera.rotation.copyFrom(areaPoses[areaIndex].rot);
      }
      spin = null;
    } else {
      const from = islandRoot.rotation.y;
      // Glide the camera (including any user pivot) to the new area's
      // vantage during the spin (not in debug mode, where it's hand-flown).
      spin = {
        from, to: from + wrapPi(bearing - from), t: 0,
        camFrom: DEBUG_CAM ? null : { pos: camera.position.clone(), rot: camera.rotation.clone() }
      };
    }
    setChip();
  };
  const isTransitioning = () => spin !== null;

  document.getElementById('areaPrev')?.addEventListener('click', () => switchArea(areaIndex - 1));
  document.getElementById('areaNext')?.addEventListener('click', () => switchArea(areaIndex + 1));
  if (!DEBUG_CAM) {
    document.addEventListener('keydown', e => {
      if (e.target instanceof HTMLElement && e.target.closest('button, a, input, textarea')) return;
      if (e.key === 'Escape' && focus?.kind === 'crest' && focus.phase === 'hold') endFocus();
      if (isPanelOpen()) return;
      if (e.key === 'a' || e.key === 'A') switchArea(areaIndex - 1);
      if (e.key === 'd' || e.key === 'D') switchArea(areaIndex + 1);
    });
  }

  // Debug HUD: live camera position + facing, in AREAS-config terms.
  let hudUpdate = null;
  if (DEBUG_CAM) {
    const hud = document.createElement('div');
    hud.id = 'camDebug';
    hud.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:99;background:rgba(20,15,25,.85);color:#9ef7c3;font:12px/1.6 monospace;padding:10px 14px;border-radius:8px;white-space:pre;pointer-events:none';
    document.body.appendChild(hud);
    const f2 = v => v.toFixed(2);
    hudUpdate = () => {
      const p = camera.position;
      const d = camera.getForwardRay().direction;
      const tgt = p.add(d.scale(10));
      // Props live in the island's frame, which only matches world space
      // while the island is unrotated — show both so they can't be confused.
      const local = B.Vector3.TransformCoordinates(p, B.Matrix.Invert(islandRoot.getWorldMatrix()));
      const spin = islandRoot.rotation.y * 180 / Math.PI;
      hud.textContent =
        `CAM DEBUG (WASD/QE move, drag look)\n` +
        `pos    [${f2(p.x)}, ${f2(p.y)}, ${f2(p.z)}]  world\n` +
        `island [${f2(local.x)}, ${f2(local.y)}, ${f2(local.z)}]  ← place props here\n` +
        `dir    [${f2(d.x)}, ${f2(d.y)}, ${f2(d.z)}]\n` +
        `target [${f2(tgt.x)}, ${f2(tgt.y)}, ${f2(tgt.z)}]  (10u ahead)\n` +
        `area   ${areaIndex} · ${t(AREAS[areaIndex].name)}   spin ${spin.toFixed(0)}°   grid 1m`;
    };
  }

  // --- Light and sky ---
  const fill = new B.HemisphericLight('fill', new B.Vector3(0, 1, 0), scene);
  fill.intensity = .7;
  fill.groundColor = B.Color3.FromHexString('#93c97e').scale(.55);
  // High steep sun: shadows fall short to the screen-right of each object,
  // staying visible on the island instead of hiding behind their casters.
  const sunLight = new B.DirectionalLight('sun', new B.Vector3(.45, -1.1, .12).normalize(), scene);
  sunLight.position = new B.Vector3(-9.8, 24, -2.6);
  // Tight, EXPLICIT depth bounds are essential: the default huge range
  // quantizes small objects' depth away (only tall trees cast), and
  // auto-calculated bounds shrink to the casters, dropping the receive-only
  // island slab outside the range (no shadows land on it at all).
  sunLight.shadowMinZ = 1;
  sunLight.shadowMaxZ = 60;
  sunLight.intensity = 1.05;
  sunLight.diffuse = B.Color3.FromHexString('#fff2cc');
  // Poisson at 2048 renders soft shadows reliably across GPU stacks (PCF
  // silently produced no shadows on some renderers).
  // Bias is higher than usual because the island mesh must both cast (its
  // big tree) and receive (its terrain) — lower values give surface acne.
  const shadows = new B.ShadowGenerator(2048, sunLight);
  shadows.usePoissonSampling = true;
  shadows.bias = .002;
  const castShadow = mesh => shadows.addShadowCaster(mesh);

  const flat = (name, hex) => {
    const mat = new B.StandardMaterial(name, scene);
    mat.diffuseColor = B.Color3.FromHexString(hex);
    mat.specularColor = B.Color3.Black();
    return mat;
  };

  const sun = B.MeshBuilder.CreateDisc('sun-disc', { radius: 4, tessellation: 48 }, scene);
  sun.position.set(-17, 16, 14);
  sun.billboardMode = B.Mesh.BILLBOARDMODE_ALL;
  const sunMat = new B.StandardMaterial('sun-mat', scene);
  sunMat.emissiveColor = B.Color3.FromHexString('#ffe28a');
  sunMat.disableLighting = true;
  sunMat.fogEnabled = false;
  sun.material = sunMat;
  sun.isPickable = false;

  const cloudMat = new B.StandardMaterial('cloud-mat', scene);
  cloudMat.emissiveColor = B.Color3.FromHexString('#ffffff');
  cloudMat.disableLighting = true;
  cloudMat.fogEnabled = false;
  const clouds = [
    [-14, 13, 36, 1.5], [6, 16, 42, 2], [18, 12, 30, 1.2],
    // Below the island — sells the floating.
    [-10, -7, 14, 1.3], [8, -9, 8, 1.1], [-2, -6, 24, 1.6]
  ].map(([x, y, z, s], i) => {
    const root = new B.TransformNode(`cloud-${i}`, scene);
    root.position.set(x, y, z);
    [[0, 0, 0, 2.6], [-1.6, -.3, .2, 1.8], [1.7, -.25, -.1, 2], [.4, .7, .3, 1.7]].forEach(([px, py, pz, d], j) => {
      const puff = B.MeshBuilder.CreateSphere(`cloud-${i}-${j}`, { diameter: d, segments: 8 }, scene);
      puff.parent = root;
      puff.position.set(px, py, pz);
      puff.scaling.y = .62;
      puff.material = cloudMat;
      puff.isPickable = false;
    });
    root.scaling.setAll(s);
    return root;
  });

  // --- The island itself: Tan's Island.glb (terrain, big tree, and rocks
  // in one painterly mesh). Loaded first so everything else can snap to its
  // actual terrain height.

  // Small companion rocks: one orbits with the island, one bobs freely.
  const rockMat = flat('rocklet-mat', '#8a6f5b');
  const orbitRock = B.MeshBuilder.CreateIcoSphere('rocklet-0', { radius: .7, subdivisions: 1 }, scene);
  orbitRock.parent = islandRoot;
  orbitRock.position.set(10.5, -2.5, 5);
  orbitRock.material = rockMat;
  orbitRock.isPickable = false;
  castShadow(orbitRock);
  const bobRock = B.MeshBuilder.CreateIcoSphere('rocklet-1', { radius: .5, subdivisions: 1 }, scene);
  bobRock.position.set(-9.5, -4, 2);
  bobRock.material = rockMat;
  bobRock.isPickable = false;
  castShadow(bobRock);

  // Shared normalize/center/flag logic for a loaded (or extracted) node.
  const placeNode = (root, { x = 0, y = 0, z = 0, height, rotY = 0, parent = null }, meshes) => {
    const { min, max } = root.getHierarchyBoundingVectors();
    const factor = height / (max.y - min.y);
    root.scaling.scaleInPlace(factor);
    root.rotationQuaternion = B.Quaternion.RotationAxis(B.Vector3.Up(), rotY)
      .multiply(root.rotationQuaternion ?? B.Quaternion.Identity());
    if (parent) root.parent = parent;
    const off = B.Vector3.TransformCoordinates(
      new B.Vector3((min.x + max.x) / 2 * factor, 0, (min.z + max.z) / 2 * factor),
      B.Matrix.RotationY(rotY));
    root.position.set(x - off.x, y - min.y * factor, z - off.z);
    meshes.forEach(m => {
      m.isPickable = false;
      m.receiveShadows = true;
      if (m.getTotalVertices?.() > 0) castShadow(m);
    });
    return root;
  };

  const place = async (file, opts) => {
    const res = await B.SceneLoader.ImportMeshAsync('', 'models/', encodeURIComponent(file), scene);
    return placeNode(res.meshes[0], opts, res.meshes);
  };

  const bearingXZ = (deg, r) => {
    const th = deg * Math.PI / 180;
    return { x: r * Math.sin(th), z: -r * Math.cos(th) };
  };

  // Load the island (terrain + its own big tree and rocks in one mesh).
  // Its grass plateau is treated as flat: placed so the plateau sits at
  // y=0, where all the gameplay objects already live. (Raycast terrain
  // snapping doesn't work on this glb — its handedness-flipped winding
  // makes ray hits unreliable — so the offset is measured and fixed.)
  const GRASS_DROP = 6.3; // world units from the island's base to its grass top
  await place(M.island, { x: 0, y: -GRASS_DROP, z: 0, height: 18.7, rotY: Math.PI, parent: islandRoot });

  // A few flowers for color.
  const petalColors = ['#f2b84b', '#ff8a5c', '#8e6fc7'];
  const stemMat = flat('stem-mat', '#5f9e50');
  // (the 225° flower sits further out so the beanbag doesn't swallow it)
  [[45, 5.6], [120, 4.4], [165, 5.9], [225, 6.2], [285, 5.7], [350, 4.2]]
    .forEach(([deg, r], i) => {
      const { x, z } = bearingXZ(deg, r);
      const stem = B.MeshBuilder.CreateCylinder(`flower-stem-${i}`, { diameter: .03, height: .18 }, scene);
      stem.parent = islandRoot;
      stem.position.set(x, .09, z);
      stem.material = stemMat;
      stem.isPickable = false;
      castShadow(stem);
      const head = B.MeshBuilder.CreateIcoSphere(`flower-head-${i}`, { radius: .06, subdivisions: 1 }, scene);
      head.parent = stem;
      head.position.y = .12;
      head.material = flat(`flower-mat-${i}`, petalColors[i % petalColors.length]);
      head.isPickable = false;
      castShadow(head);
    });

  // --- The laptop: the one shootable thing. A dart hit swaps it for the
  // grumpy-faced version and opens the contact panel; closing the panel
  // calms it back down.
  let laptopRoot = null;
  let laptopFaceRoot = null;
  let laptopState = 'up'; // 'up' | 'swapped' | 'falling'
  let laptopHitbox = null;
  let laptopPivot = null;
  const LAPTOP_TILT = .45; // radians knocked backwards by the dart

  const laptopLoads = [
    place(M.laptop, { ...LAPTOP_POSE, parent: islandRoot }).then(root => {
      laptopRoot = root;
      // Invisible pickable box around the laptop: clicks aim at it and the
      // dart sweep tests against it.
      const { min, max } = root.getHierarchyBoundingVectors();
      laptopHitbox = B.MeshBuilder.CreateBox('laptop-hitbox', {
        width: (max.x - min.x) + .08,
        height: (max.y - min.y) + .08,
        depth: (max.z - min.z) + .08
      }, scene);
      laptopHitbox.position.set((min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2);
      laptopHitbox.setParent(islandRoot);
      // Fully transparent but NOT isVisible=false — scene.pick's default
      // predicate skips invisible meshes, and clicks must aim at this box.
      laptopHitbox.visibility = 0;
      laptopHitbox.isPickable = true;
    }),
    place(M.laptopFace, { ...LAPTOP_POSE, parent: islandRoot }).then(root => {
      laptopFaceRoot = root;
      root.setEnabled(false);
      // Pivot node on the lid's hinge line (the back edge of the deck),
      // yawed like the laptop so its local X IS the hinge axis. Animating
      // its rotation.x tips the laptop around that edge — the glb root's
      // own baked transform can't be trusted for this.
      const yaw = LAPTOP_POSE.rotY;
      // The hinge line sits a little behind center at deck height — NOT at
      // the bounding box's back edge (that's the top of the reclined lid).
      const hingeBack = LAPTOP_POSE.height * (1.9 / 1.65) / 2 * .5;
      laptopPivot = new B.TransformNode('laptop-pivot', scene);
      laptopPivot.parent = islandRoot;
      laptopPivot.position.set(
        LAPTOP_POSE.x - Math.sin(yaw) * hingeBack,
        LAPTOP_POSE.y + .05,
        LAPTOP_POSE.z - Math.cos(yaw) * hingeBack);
      laptopPivot.rotation.y = yaw;
      root.setParent(laptopPivot); // world-preserving
    })
  ];

  // Tilt the (grumpy) laptop backwards around the hinge when hit, and let
  // it fall back upright when the contact panel closes.
  const animateLaptop = (keys, frames, onEnd) => {
    const anim = new B.Animation('laptop-tilt', 'rotation.x', 60,
      B.Animation.ANIMATIONTYPE_FLOAT, B.Animation.ANIMATIONLOOPMODE_CONSTANT);
    anim.setKeys(keys);
    laptopPivot.animations = [anim];
    scene.beginAnimation(laptopPivot, 0, frames, false, 1, onEnd);
  };

  const loads = [
    ...laptopLoads,
    // Sector 0 — The Desk (the main area, facing the camera at load).
    place(M.desk, { ...DESK_POSE, parent: islandRoot }),
    place(M.deskChair, { x: -1.05, z: -5.85, height: 1.3, rotY: Math.PI - .87, parent: islandRoot }),
    place(M.bear, { x: 1.5, z: -3.9, height: .95, rotY: Math.PI, parent: islandRoot }),
    // Energy drinks sit to the laptop's right: one standing toward the back,
    // one lying closer to the chair with enough clearance from every edge.
    place(M.energyDrink, {
      ...STANDING_CAN_POSE,
      y: TABLETOP_Y,
      height: .17,
      rotY: DESK_POSE.rotY - 1.3,
      parent: islandRoot
    }),
    (() => {
      const lay = new B.TransformNode('can-lay', scene);
      lay.parent = islandRoot;
      // The can is .17 tall and about .106 wide after normalization, so its
      // center is one .053 radius above the tabletop when turned sideways.
      lay.position.set(SIDE_CAN_POSE.x, TABLETOP_Y + .053, SIDE_CAN_POSE.z);
      lay.rotation.set(0, DESK_POSE.rotY - .45, Math.PI / 2);
      return place(M.energyDrink, { x: 0, y: -.085, z: 0, height: .17, parent: lay });
    })(),
    // Waste basket on the grass just off the desk's end (the bear's side),
    // toward the chair. On the flat plateau, so its base sits at y=0.
    place(M.wasteBasket, { ...onDesk(-1.35, .45), height: .45, rotY: DESK_POSE.rotY, parent: islandRoot }),
    // Beanbag out on the far side of the island, turned to face BEANBAG's
    // aim point. `y` is the terrain height where it stands.
    place(M.beanbag, {
      x: BEANBAG.x, y: BEANBAG.y, z: BEANBAG.z,
      height: BEANBAG.height,
      rotY: Math.atan2(BEANBAG.faceX - BEANBAG.x, BEANBAG.faceZ - BEANBAG.z),
      parent: islandRoot
    }),
    // Dartboard on the island's central tree trunk.
    place(M.dartboard, { x: -.4, y: 2.3, z: -3.05, height: .75, rotY: -Math.PI / 2, parent: islandRoot }),
    place(M.darts, { x: -.25, y: 2.5, z: -3.1, height: .1, rotY: -Math.PI / 2, parent: islandRoot }),
    // Furniture dressing the other areas.
    place(M.cabinet, { x: 4.95, z: 1.61, height: 1.0, parent: islandRoot }),
    place(M.chair, { x: 3.44, z: 3.21, height: .88, parent: islandRoot })
  ].map(p => p.catch(err => console.warn('model failed to load', err)));

  // --- Placeholder language block on the desk. An alphabet cube drawn at
  // runtime (no asset) — shooting it opens the language picker. Swap in a
  // model here whenever you have one.
  // The tabletop runs to ±.95 across and -.57/+.55 deep in desk-local
  // coords — keep props (plus their half-width) inside that.
  const LANG_BLOCK = { size: .17, ...onDesk(-.60, -.25) };
  const langBlock = (() => {
    const tex = new B.DynamicTexture('lang-block-tex', { width: 768, height: 512 }, scene, true);
    const ctx = tex.getContext();
    // One letter per face, in the three languages. The generic sans stack
    // avoids waiting on a webfont before drawing.
    const faces = ['A', 'Ă', 'あ', 'あ', 'A', 'Ă'];
    faces.forEach((glyph, i) => {
      const cx = (i % 3) * 256, cy = Math.floor(i / 3) * 256;
      ctx.fillStyle = '#fff6e5';
      ctx.fillRect(cx, cy, 256, 256);
      ctx.strokeStyle = '#3a3143';
      ctx.lineWidth = 16;
      ctx.strokeRect(cx + 8, cy + 8, 240, 240);
      ctx.fillStyle = '#ff8a5c';
      ctx.font = 'bold 148px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(glyph, cx + 128, cy + 136);
    });
    tex.update();
    // Texture V runs bottom-up, so each face's row is flipped into UV space.
    const faceUV = faces.map((_, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      return new B.Vector4(col / 3, 1 - (row + 1) / 2, (col + 1) / 3, 1 - row / 2);
    });
    const box = B.MeshBuilder.CreateBox('lang-block', { size: LANG_BLOCK.size, faceUV, wrap: true }, scene);
    const mat = new B.StandardMaterial('lang-block-mat', scene);
    mat.diffuseTexture = tex;
    mat.specularColor = B.Color3.Black();
    box.material = mat;
    box.parent = islandRoot;
    box.position.set(LANG_BLOCK.x, TABLETOP_Y + LANG_BLOCK.size / 2, LANG_BLOCK.z);
    box.rotation.y = DESK_POSE.rotY + .35;
    box.isPickable = true;
    box.receiveShadows = true;
    castShadow(box);
    return box;
  })();
  let blockState = 'up'; // 'up' | 'hit'

  // --- The Matsue crest, propped on the grass against the rocky bump out
  // past the desk. Not in the opening shot — you find it by panning right.
  // It faces CREST_CAM so the close-up looks it square in the face.
  // Sits on the line between the rock and CREST_CAM, so leaning straight
  // back from the camera tips it into the rock.
  // `turn` swings it partway back toward the opening vantage, so it still
  // reads as a crest when you pan across and find it.
  const CREST = { x: 3.72, y: .02, z: -5.16, height: .85, lean: .6, turn: .55 };
  let crestHitbox = null;
  const crestLoad = (() => {
    const yaw = Math.atan2(CREST_CAM.pos[0] - CREST.x, CREST_CAM.pos[2] - CREST.z) + CREST.turn;
    const pivot = new B.TransformNode('crest-pivot', scene);
    pivot.parent = islandRoot;
    pivot.position.set(CREST.x, CREST.y, CREST.z);
    // Tilts about its bottom edge. Pitch is negated because positive pitch
    // tips the top toward the facing direction — we want it away, into the
    // rock behind.
    pivot.rotationQuaternion = B.Quaternion.RotationYawPitchRoll(yaw, -CREST.lean, 0);
    return place(M.crest, { x: 0, y: 0, z: 0, height: CREST.height, parent: pivot }).then(root => {
      const { min, max } = root.getHierarchyBoundingVectors();
      crestHitbox = B.MeshBuilder.CreateBox('crest-hitbox', {
        width: (max.x - min.x) + .1,
        height: (max.y - min.y) + .1,
        depth: (max.z - min.z) + .1
      }, scene);
      crestHitbox.position.set((min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2);
      crestHitbox.setParent(islandRoot);
      crestHitbox.visibility = 0; // transparent but pickable
      crestHitbox.isPickable = true;
    });
  })();

  // A hit spins the block once and bounces it on the spot.
  const animateBlock = () => {
    const baseY = TABLETOP_Y + LANG_BLOCK.size / 2;
    const spin = new B.Animation('block-spin', 'rotation.y', 60,
      B.Animation.ANIMATIONTYPE_FLOAT, B.Animation.ANIMATIONLOOPMODE_CONSTANT);
    spin.setKeys([
      { frame: 0, value: langBlock.rotation.y },
      { frame: 38, value: langBlock.rotation.y + Math.PI * 2 }
    ]);
    const ease = new B.CubicEase();
    ease.setEasingMode(B.EasingFunction.EASINGMODE_EASEOUT);
    spin.setEasingFunction(ease);
    const hop = new B.Animation('block-hop', 'position.y', 60,
      B.Animation.ANIMATIONTYPE_FLOAT, B.Animation.ANIMATIONLOOPMODE_CONSTANT);
    hop.setKeys([
      { frame: 0, value: baseY },
      { frame: 9, value: baseY + .13 },
      { frame: 20, value: baseY },
      { frame: 26, value: baseY + .04 },
      { frame: 34, value: baseY }
    ]);
    langBlock.animations = [spin, hop];
    scene.beginAnimation(langBlock, 0, 38, false);
  };

  // The starry cavity in the trunk is a portal to the solar system page:
  // an invisible hit zone the darts (and click-aiming) can find.
  const cavityBox = B.MeshBuilder.CreateBox('cavity-hitbox', { width: 3.3, height: 4.3, depth: 1 }, scene);
  cavityBox.parent = islandRoot;
  cavityBox.position.set(1.55, 3.3, -1.55);
  cavityBox.visibility = 0; // transparent but pickable (like the laptop box)
  cavityBox.isPickable = true;

  const sphereVsBox = (box, center, r) => {
    const inv = B.Matrix.Invert(box.computeWorldMatrix(true));
    const local = B.Vector3.TransformCoordinates(center, inv);
    const e = box.getBoundingInfo().boundingBox.extendSize;
    const dx = local.x - B.Scalar.Clamp(local.x, -e.x, e.x);
    const dy = local.y - B.Scalar.Clamp(local.y, -e.y, e.y);
    const dz = local.z - B.Scalar.Clamp(local.z, -e.z, e.z);
    return dx * dx + dy * dy + dz * dz <= r * r;
  };

  const hitTest = (center, r) => {
    if (focus || portal) return null; // already zoomed in on something
    if (laptopState === 'up' && laptopHitbox && sphereVsBox(laptopHitbox, center, r)) {
      return { kind: 'laptop', board: laptopHitbox, section: 'contact' };
    }
    if (blockState === 'up' && sphereVsBox(langBlock, center, r)) {
      return { kind: 'languages', board: langBlock };
    }
    if (crestHitbox && sphereVsBox(crestHitbox, center, r)) {
      return { kind: 'crest', board: crestHitbox };
    }
    if (sphereVsBox(cavityBox, center, r)) {
      return { kind: 'portal', board: cavityBox };
    }
    return null;
  };

  // Portal sequence: fly the camera into the cavity, fade to dark, then
  // hand over to the solar system page.
  const portalFade = document.createElement('div');
  portalFade.className = 'portal-fade';
  document.body.appendChild(portalFade);
  const startPortal = () => {
    if (portal || focus) return;
    camera.detachControl();
    const to = cavityBox.getAbsolutePosition().clone();
    portal = { fromPos: camera.position.clone(), to, t: 0, done: false };
  };

  // Close-up on a shot object: glide the camera to that object's tuned
  // vantage (the config pose rotated by the island's live angle, like the
  // AREAS poses), pop its panel a beat later, and remember where the player
  // was standing so closing can glide back there.
  const scheduleArrival = () => setTimeout(() => {
    if (focus?.phase === 'hold') focus.onArrive();
  }, KNOCK.popupDelayMs);

  const startFocus = (kind, pose, onArrive) => {
    const rotM = B.Matrix.RotationY(islandRoot.rotation.y);
    const toPos = B.Vector3.TransformCoordinates(B.Vector3.FromArray(pose.pos), rotM);
    const toTgt = B.Vector3.TransformCoordinates(B.Vector3.FromArray(pose.target), rotM);
    const savedPos = camera.position.clone();
    const savedRot = camera.rotation.clone();
    // Read the vantage's Euler angles off the camera, then put it back.
    camera.position.copyFrom(toPos);
    camera.setTarget(toTgt);
    const toRot = camera.rotation.clone();
    camera.position.copyFrom(savedPos);
    camera.rotation.copyFrom(savedRot);
    camera.detachControl();
    // Let the page chrome step aside while we're up close to something.
    document.body.classList.add('is-focused');
    focus = {
      kind, phase: 'in', t: 0, secs: pose.zoomSecs,
      fromPos: savedPos.clone(), fromRot: savedRot.clone(),
      toPos, toRot, savedPos, savedRot, onArrive
    };
    if (reduceMotion) {
      camera.position.copyFrom(toPos);
      camera.rotation.copyFrom(toRot);
      focus.phase = 'hold';
      scheduleArrival();
    }
  };

  // Closing a panel flies the camera back to the pre-hit pose.
  const endFocus = () => {
    if (!focus) return;
    document.body.classList.remove('is-focused');
    if (reduceMotion) {
      camera.position.copyFrom(focus.savedPos);
      camera.rotation.copyFrom(focus.savedRot);
      focus = null;
      camera.attachControl(canvas, true);
      return;
    }
    focus = {
      ...focus,
      phase: 'out', t: 0,
      fromPos: camera.position.clone(),
      fromRot: camera.rotation.clone(),
      toPos: focus.savedPos,
      toRot: focus.savedRot
    };
  };

  const onHit = target => {
    if (target.kind === 'portal') {
      startPortal();
      return;
    }
    if (portal || focus) return;
    if (target.kind === 'languages') {
      blockState = 'hit';
      animateBlock();
      startFocus('languages', LANGUAGES_CAM, openLanguagePanel);
      return;
    }
    if (target.kind === 'crest') {
      // No panel — the close-up is the payoff; a click or Esc flies back.
      startFocus('crest', CREST_CAM, () => {});
      return;
    }
    laptopState = 'swapped';
    laptopRoot?.setEnabled(false);
    if (laptopFaceRoot && laptopPivot) {
      laptopFaceRoot.setEnabled(true);
      laptopPivot.rotation.x = 0;
      // Knocked back over the hinge with a little overshoot, then frozen.
      animateLaptop([
        { frame: 0, value: 0 },
        { frame: 8, value: -LAPTOP_TILT * 1.2 },
        { frame: 13, value: -LAPTOP_TILT }
      ], 13);
    }
    startFocus('contact', CONTACT_CAM, () => openScreen(getResume()));
  };
  const darts = createDarts(scene, camera, hitTest, onHit, castShadow, islandRoot);

  onLanguagePanelClosed(() => {
    endFocus();
    blockState = 'up';
  });

  onScreenClosed(() => {
    endFocus();
    if (laptopState !== 'swapped') return;
    laptopState = 'falling';
    const finish = () => {
      laptopState = 'up';
      laptopFaceRoot?.setEnabled(false);
      if (laptopPivot) laptopPivot.rotation.x = 0;
      laptopRoot?.setEnabled(true);
    };
    if (laptopFaceRoot && laptopPivot) {
      // Fall back upright with a tiny forward bounce, then calm back down.
      animateLaptop([
        { frame: 0, value: laptopPivot.rotation.x },
        { frame: 9, value: .07 },
        { frame: 14, value: 0 }
      ], 14, finish);
    } else {
      finish();
    }
  });

  // Fire on TAP, not press: dragging pivots the camera without shooting.
  // A click that closes the panel must not also fire, so remember whether
  // the panel was open when the press started (the canvas sees pointerdown
  // before the document-level outside-click close does).
  let pressStartedWithPanelOpen = false;
  scene.onPointerObservable.add(info => {
    if (info.type === B.PointerEventTypes.POINTERDOWN) {
      pressStartedWithPanelOpen = isPanelOpen() || isScreenOpen() || isLanguagePanelOpen();
      return;
    }
    if (info.type !== B.PointerEventTypes.POINTERTAP) return;
    // The crest close-up has no panel to close, so a tap dismisses it.
    if (focus?.kind === 'crest' && focus.phase === 'hold') {
      endFocus();
      return;
    }
    if (info.event.button !== 0 || pressStartedWithPanelOpen || isPanelOpen() || isScreenOpen() ||
        isLanguagePanelOpen() || isTransitioning() || portal || focus) return;
    darts.fire(scene.pointerX, scene.pointerY);
  });

  let elapsed = 0;
  scene.onBeforeRenderObservable.add(() => {
    const dt = engine.getDeltaTime() / 1000;
    elapsed += dt;
    darts.update(dt);

    if (portal) {
      portal.t += dt / 1.6;
      const s = Math.min(portal.t, 1);
      const e = s * s * (3 - 2 * s);
      // Fly toward the cavity, aiming into it; the fade covers the arrival.
      camera.position = B.Vector3.Lerp(portal.fromPos, portal.to, e * .92);
      camera.setTarget(portal.to);
      if (s > .45) portalFade.classList.add('active');
      if (s >= 1 && !portal.done) {
        portal.done = true;
        setTimeout(() => { location.href = 'solar-system/'; }, 250);
      }
    }

    if (focus && focus.phase !== 'hold') {
      focus.t += dt / focus.secs;
      const s = Math.min(focus.t, 1);
      const e = s * s * (3 - 2 * s);
      camera.position = B.Vector3.Lerp(focus.fromPos, focus.toPos, e);
      camera.rotation.x = focus.fromRot.x + (focus.toRot.x - focus.fromRot.x) * e;
      camera.rotation.y = focus.fromRot.y + wrapPi(focus.toRot.y - focus.fromRot.y) * e;
      if (s >= 1) {
        if (focus.phase === 'in') {
          focus.phase = 'hold';
          scheduleArrival();
        } else {
          focus = null;
          camera.attachControl(canvas, true);
        }
      }
    }

    if (spin) {
      spin.t += dt / ISLAND.spinSecs;
      const s = Math.min(spin.t, 1);
      const e = s * s * (3 - 2 * s); // smoothstep
      islandRoot.rotation.y = spin.from + (spin.to - spin.from) * e;
      if (spin.camFrom) {
        // Glide the camera to the (possibly mid-flight retargeted) area pose.
        const to = areaPoses[areaIndex];
        camera.position = B.Vector3.Lerp(spin.camFrom.pos, to.pos, e);
        camera.rotation.x = spin.camFrom.rot.x + (to.rot.x - spin.camFrom.rot.x) * e;
        camera.rotation.y = spin.camFrom.rot.y + wrapPi(to.rot.y - spin.camFrom.rot.y) * e;
      }
      if (s >= 1) {
        islandRoot.rotation.y = ((spin.to % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        spin = null;
      }
    }
    hudUpdate?.();

    if (!reduceMotion) {
      clouds.forEach((cloud, i) => {
        cloud.position.x += (.1 + i * .04) * dt;
        if (cloud.position.x > 24) cloud.position.x = -24;
      });
      bobRock.position.y = -4 + Math.sin(elapsed * .5) * .3;
    }
  });

  // --- Debug/test hooks ---
  const muzzle = () => camera.position
    .add(camera.getDirection(B.Vector3.Forward()).scale(DART.muzzleForward))
    .add(new B.Vector3(0, -DART.muzzleDown, 0));

  // Closed-form low-arc ballistic solve at fixed dart speed, aimed at a
  // live world point.
  const aimAt = c => {
    const m = muzzle();
    const dx = c.x - m.x, dz = c.z - m.z, dy = c.y - m.y;
    const d = Math.hypot(dx, dz);
    const v2 = DART.speed * DART.speed;
    const disc = v2 * v2 - DART.g * (DART.g * d * d + 2 * dy * v2);
    const tanTheta = disc > 0 ? (v2 - Math.sqrt(disc)) / (DART.g * d) : dy / d;
    const theta = Math.atan(tanTheta);
    const horiz = DART.speed * Math.cos(theta);
    return new B.Vector3(horiz * dx / d, DART.speed * Math.sin(theta), horiz * dz / d);
  };
  const aimLaptop = () => aimAt(laptopHitbox.getAbsolutePosition());
  const aimCavity = () => aimAt(cavityBox.getAbsolutePosition());

  const screenPointOf = mesh => {
    const p = B.Vector3.Project(
      mesh.getAbsolutePosition(),
      B.Matrix.Identity(),
      scene.getTransformMatrix(),
      camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight()));
    return { x: p.x, y: p.y };
  };
  const screenPointLaptop = () => screenPointOf(laptopHitbox);

  // The crest is built further down the file than `loads`, so it joins here.
  await Promise.all([...loads, crestLoad.catch(err => console.warn('model failed to load', err))]);

  scene.metadata = {
    game: {
      areaIndex: () => areaIndex,
      areaCount: AREAS.length,
      switchArea,
      isTransitioning,
      islandAngle: () => ((islandRoot.rotation.y % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI),
      shootWith: v => darts.shootWith(Array.isArray(v) ? B.Vector3.FromArray(v) : v),
      aimLaptop,
      aimCavity,
      portalActive: () => portal !== null,
      dartsInFlight: darts.dartsInFlight,
      screenPointLaptop,
      laptopState: () => laptopState,
      laptopTilt: () => Math.abs(laptopPivot?.rotation.x ?? 0),
      contactPhase: () => (focus?.kind === 'contact' ? focus.phase : null),
      focusKind: () => focus?.kind ?? null,
      focusPhase: () => focus?.phase ?? null,
      blockState: () => blockState,
      aimBlock: () => aimAt(langBlock.getAbsolutePosition()),
      aimCrest: () => aimAt(crestHitbox.getAbsolutePosition()),
      screenPointCrest: () => screenPointOf(crestHitbox),
      screenPointBlock: () => screenPointOf(langBlock),
      languagePanelOpen: isLanguagePanelOpen,
      screenOpen: isScreenOpen,
      cameraPose: () => ({
        pos: camera.position.asArray(),
        rot: camera.rotation.asArray()
      })
    }
  };
  return scene;
}
