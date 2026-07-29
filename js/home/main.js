// Entry point for the landing page.
import { buildScene } from './game.js';
import { loadResume, wirePanel } from './panel.js';
import { wireScreen } from './laptopScreen.js';
import { wireLanguagePanel } from './languages.js';
import { initI18n } from './i18n.js';

const canvas = document.getElementById('space');
const loading = document.getElementById('loading');
const fallback = document.getElementById('fallback');

async function boot() {
  initI18n();
  wirePanel();
  wireScreen();
  wireLanguagePanel();
  const resumeReady = loadResume();

  if (!window.BABYLON || !BABYLON.Engine.isSupported()) {
    fallback.hidden = false;
    loading.classList.add('done');
    await resumeReady;
    return;
  }

  try {
    const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: false, stencil: true });
    const scene = await buildScene(engine, canvas);
    window.__scene = scene; // debug/testing handles
    window.__game = scene.metadata.game;
    engine.runRenderLoop(() => scene.render());
    addEventListener('resize', () => engine.resize());
  } catch (err) {
    console.error(err);
    fallback.hidden = false;
  } finally {
    loading.classList.add('done');
  }
  await resumeReady;
}

boot();
