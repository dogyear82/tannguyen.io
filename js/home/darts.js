// Nerf darts: point and click. Each click fires a foam dart from a muzzle
// just below the camera, along a ray aimed at the clicked point, with a
// slight gravity drop over distance.
import { DART, ISLAND } from './config.js';

const B = window.BABYLON;

export function createDarts(scene, camera, hitTest, onHit, castShadow, islandRoot) {
  const bodyMat = new B.StandardMaterial('dart-body-mat', scene);
  bodyMat.diffuseColor = B.Color3.FromHexString('#ff8a5c');
  bodyMat.specularColor = B.Color3.Black();
  const tipMat = new B.StandardMaterial('dart-tip-mat', scene);
  tipMat.diffuseColor = B.Color3.FromHexString('#4a90d9');
  tipMat.specularColor = new B.Color3(.15, .15, .15);

  // Pool of darts, oldest reused when exhausted. Geometry points along +z so
  // lookAt() lines the dart up with its velocity.
  const pool = Array.from({ length: DART.pool }, (_, i) => {
    const body = B.MeshBuilder.CreateCylinder(`dart-${i}`, { diameter: .09, height: .4 }, scene);
    body.rotation.x = Math.PI / 2;
    body.bakeCurrentTransformIntoVertices();
    body.material = bodyMat;
    const tip = B.MeshBuilder.CreateCylinder(`dart-${i}-tip`, { diameter: .11, height: .12 }, scene);
    tip.rotation.x = Math.PI / 2;
    tip.bakeCurrentTransformIntoVertices();
    tip.position.z = .24;
    tip.material = tipMat;
    tip.parent = body;
    [body, tip].forEach(m => { m.isPickable = false; });
    body.setEnabled(false);
    castShadow?.(body);
    castShadow?.(tip);
    return {
      mesh: body,
      velocity: new B.Vector3(),
      state: 'free', // 'free' | 'flying' | 'stuck' | 'resting'
      age: 0,
      restTimer: 0,
      seq: 0
    };
  });
  let seqCounter = 0;

  const muzzle = () => camera.position
    .add(camera.getDirection(B.Vector3.Forward()).scale(DART.muzzleForward))
    .add(new B.Vector3(0, -DART.muzzleDown, 0));

  const acquire = () => {
    let dart = pool.find(d => d.state === 'free');
    if (!dart) dart = pool.reduce((a, b) => (a.seq < b.seq ? a : b)); // oldest
    if (dart.mesh.parent) dart.mesh.parent = null;
    dart.seq = ++seqCounter;
    return dart;
  };

  const shootWith = v => {
    const dart = acquire();
    dart.state = 'flying';
    dart.age = 0;
    dart.velocity.copyFrom(v);
    dart.mesh.position.copyFrom(muzzle());
    dart.mesh.setEnabled(true);
    dart.mesh.lookAt(dart.mesh.position.add(v));
  };

  // Fire toward the clicked screen point: aim the muzzle at whatever the
  // click ray hits (boards are the scene's only pickable meshes), or at a
  // fixed convergence distance along the ray on a miss.
  const fire = (px, py) => {
    const pick = scene.pick(px, py);
    const rayTarget = pick?.hit
      ? pick.pickedPoint
      : (() => {
          const ray = scene.createPickingRay(px, py, B.Matrix.Identity(), camera);
          return ray.origin.add(ray.direction.scale(DART.converge));
        })();
    const dir = rayTarget.subtract(muzzle()).normalize();
    shootWith(dir.scale(DART.speed));
  };

  const release = dart => {
    dart.state = 'free';
    dart.mesh.setEnabled(false);
    dart.mesh.parent = null;
  };

  const update = dt => {
    for (const dart of pool) {
      if (dart.state === 'stuck' || dart.state === 'resting') {
        dart.restTimer -= dt;
        if (dart.restTimer <= 0) release(dart);
        continue;
      }
      if (dart.state !== 'flying') continue;
      dt = Math.min(dt, 1 / 20);
      dart.age += dt;

      const prev = dart.mesh.position.clone();
      dart.velocity.y -= DART.g * dt;
      const next = prev.add(dart.velocity.scale(dt));

      // Substep the swept segment finely enough that a fast dart can't
      // tunnel through a board.
      const dist = B.Vector3.Distance(prev, next);
      const steps = Math.max(1, Math.ceil(dist / (DART.r * .9)));
      let hit = null;
      for (let s = 1; s <= steps && !hit; s++) {
        const sample = B.Vector3.Lerp(prev, next, s / steps);
        const target = hitTest(sample, DART.r);
        if (target) {
          hit = { target, at: sample };
        }
      }
      if (hit) {
        dart.mesh.position.copyFrom(hit.at);
        dart.mesh.parent = hit.target.board; // ride the knockdown
        dart.state = 'stuck';
        dart.restTimer = 1;
        onHit(hit.target);
        continue;
      }

      dart.mesh.position.copyFrom(next);
      dart.mesh.lookAt(next.add(dart.velocity));

      if (next.y <= DART.r && Math.hypot(next.x, next.z) <= ISLAND.r) {
        // Landed in the island's grass — ride the island if it spins.
        dart.mesh.position.y = DART.r;
        dart.state = 'resting';
        dart.restTimer = .7;
        dart.mesh.setParent(islandRoot);
        continue;
      }
      // Off-island misses fall into the sky below.
      if (next.y < -25 || dart.age > DART.maxFlight ||
          Math.abs(next.x) > 30 || next.z > 30 || next.z < -30) {
        release(dart);
      }
    }
  };

  return {
    fire, shootWith, update,
    dartsInFlight: () => pool.filter(d => d.state === 'flying').length
  };
}
