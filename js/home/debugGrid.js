// Dev-only measuring grid (?camdebug). 1 m squares on the island's ground
// plane with labelled X / Y / Z axes, so a spot can be read straight off the
// scene. It is parented to the island, so what you read here is exactly the
// coordinate space props are placed in — even if the island is rotated.
const B = window.BABYLON;

const AXES = [
  { key: 'X', hex: '#ff7b7b', rgb: new B.Color4(1, .42, .42, .9), from: -8, to: 8, at: i => new B.Vector3(i, .02, 0) },
  { key: 'Y', hex: '#8df58d', rgb: new B.Color4(.5, .95, .5, .9), from: -2, to: 6, at: i => new B.Vector3(0, i, 0) },
  { key: 'Z', hex: '#93b8ff', rgb: new B.Color4(.55, .7, 1, .9), from: -8, to: 8, at: i => new B.Vector3(0, .02, i) }
];

let labelSeq = 0;

function makeLabel(scene, text, hex, height) {
  const dt = new B.DynamicTexture(`grid-lbl-${labelSeq++}`, { width: 160, height: 80 }, scene, false);
  const ctx = dt.getContext();
  ctx.fillStyle = '#12101a';
  ctx.fillRect(0, 0, 160, 80);
  ctx.fillStyle = hex;
  ctx.font = 'bold 54px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 80, 43);
  dt.update();
  const mat = new B.StandardMaterial(`grid-lbl-mat-${labelSeq}`, scene);
  mat.emissiveTexture = dt;      // unlit, so it stays readable in any light
  mat.diffuseColor = B.Color3.Black();
  mat.specularColor = B.Color3.Black();
  mat.disableLighting = true;
  mat.fogEnabled = false;
  const plane = B.MeshBuilder.CreatePlane(`grid-lbl-${text}`, { width: height * 2, height }, scene);
  plane.material = mat;
  plane.billboardMode = B.Mesh.BILLBOARDMODE_ALL;
  plane.isPickable = false;
  plane.renderingGroupId = 1;    // draw over the terrain rather than into it
  return plane;
}

export function buildDebugGrid(scene, parent, { extent = 8, step = 1 } = {}) {
  const root = new B.TransformNode('debug-grid', scene);
  root.parent = parent;

  // 1 m squares across the island's ground plane, every 5th line brighter.
  const lines = [], colors = [];
  const faint = new B.Color4(1, 1, 1, .22), bold = new B.Color4(1, 1, 1, .45);
  for (let i = -extent; i <= extent; i += step) {
    const c = i % 5 === 0 ? bold : faint;
    lines.push([new B.Vector3(i, 0, -extent), new B.Vector3(i, 0, extent)]);
    lines.push([new B.Vector3(-extent, 0, i), new B.Vector3(extent, 0, i)]);
    colors.push([c, c], [c, c]);
  }
  const grid = B.MeshBuilder.CreateLineSystem('debug-grid-lines',
    { lines, colors, useVertexAlpha: true }, scene);
  grid.parent = root;
  grid.isPickable = false;
  // The ground is bumpy and would swallow lines drawn at y=0, so the whole
  // grid renders as an overlay on top of the scene.
  grid.renderingGroupId = 1;

  // Coloured axes plus a numbered marker at every metre.
  AXES.forEach(axis => {
    const a = B.MeshBuilder.CreateLines(`debug-axis-${axis.key}`, {
      points: [axis.at(axis.from), axis.at(axis.to)],
      colors: [axis.rgb, axis.rgb]
    }, scene);
    a.parent = root;
    a.isPickable = false;
    a.renderingGroupId = 1;
    for (let i = axis.from; i <= axis.to; i += step) {
      if (i === 0) continue;
      const label = makeLabel(scene, String(i), axis.hex, .34);
      label.parent = root;
      label.position = axis.at(i);
      // Lift the ground-plane axes clear of the terrain so they stay legible.
      if (axis.key !== 'Y') label.position.y = .3;
      else label.position.x = .3;
    }
    const cap = makeLabel(scene, `${axis.key}+`, axis.hex, .45);
    cap.parent = root;
    cap.position = axis.at(axis.to + .8);
    if (axis.key !== 'Y') cap.position.y = .3;
  });

  const origin = makeLabel(scene, '0,0,0', '#ffe28a', .34);
  origin.parent = root;
  origin.position = new B.Vector3(0, .3, 0);
  return root;
}
