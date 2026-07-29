// The laptop's "screen": after a dart hit, the camera zooms up to the laptop
// and this translucent black overlay types the contact info out
// terminal-style. Closing it (✕, Esc, or clicking outside) hands control
// back to the game, which glides the camera home.
import { t } from './i18n.js';

const overlay = document.getElementById('laptopScreen');
const textEl = document.getElementById('laptopScreenText');
const closeButton = document.getElementById('laptopScreenClose');

let screenOpen = false;
let typeTimer = 0;
let lastFocused = null;
const closeListeners = [];

const CHAR_MS = 12;
const LINE_PAUSE_MS = 110;

export const isScreenOpen = () => screenOpen;

export function onScreenClosed(fn) {
  closeListeners.push(fn);
}

// Labels are padded to a column, so they're measured after translation.
const contactLines = resume => {
  const rows = [
    [t('screen.name'), resume?.name ?? 'Tan Nguyen'],
    [t('screen.alias'), resume?.alias ?? 'CostlyToaster']
  ];
  const socials = (resume?.socials ?? []).map(s => [
    (s.label ?? s.platform).toUpperCase(), s.handle ?? s.url, s.url
  ]);
  const width = Math.max(...[...rows, ...socials].map(([label]) => label.length)) + 2;
  const row = ([label, value]) => `${label.padEnd(width, ' ')}${value}`;
  return [
    { text: t('screen.cmd') },
    { text: '' },
    ...rows.map(r => ({ text: row(r) })),
    { text: '' },
    ...socials.map(s => ({ text: row(s), href: s[2] })),
    { text: '' },
    { text: t('screen.sign') }
  ];
};

function typeLines(lines) {
  textEl.replaceChildren();
  const cursor = document.createElement('span');
  cursor.className = 'screen-cursor';
  const lineEl = line => {
    const el = document.createElement(line.href ? 'a' : 'div');
    el.className = 'screen-line';
    if (line.href) {
      el.href = line.href;
      el.target = '_blank';
      el.rel = 'noopener noreferrer';
    }
    return el;
  };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    lines.forEach(line => {
      const el = lineEl(line);
      el.textContent = line.text;
      textEl.appendChild(el);
    });
    textEl.appendChild(cursor);
    return;
  }
  // Typing is scheduled on a real-time timeline and caught up in batches
  // each animation frame, so the pace stays brisk even at low framerates.
  const steps = [];
  let at = 0;
  lines.forEach(line => {
    steps.push({ at, line });
    for (const ch of line.text) {
      at += CHAR_MS;
      steps.push({ at, ch });
    }
    at += LINE_PAUSE_MS;
  });
  steps.push({ at, done: true });
  const t0 = performance.now();
  let i = 0;
  let txt = null;
  const frame = () => {
    if (!screenOpen) return;
    const now = performance.now() - t0;
    while (i < steps.length && steps[i].at <= now) {
      const step = steps[i++];
      if (step.line) {
        const el = lineEl(step.line);
        txt = document.createTextNode('');
        el.append(txt, cursor);
        textEl.appendChild(el);
      } else if (step.ch) {
        txt.data += step.ch;
      } else {
        textEl.appendChild(cursor);
      }
    }
    if (i < steps.length) typeTimer = requestAnimationFrame(frame);
  };
  frame();
}

export function openScreen(resume) {
  if (screenOpen) return;
  screenOpen = true;
  lastFocused = document.activeElement;
  overlay.hidden = false;
  typeLines(contactLines(resume));
  closeButton.focus();
}

export function closeScreen() {
  if (!screenOpen) return;
  screenOpen = false;
  cancelAnimationFrame(typeTimer);
  overlay.hidden = true;
  textEl.replaceChildren();
  if (lastFocused?.isConnected) lastFocused.focus();
  lastFocused = null;
  closeListeners.forEach(fn => fn());
}

export function wireScreen() {
  closeButton.addEventListener('click', closeScreen);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeScreen();
  });
  // The overlay covers the whole page while open — a press anywhere off the
  // screen itself closes the modal.
  overlay.addEventListener('pointerdown', e => {
    if (e.target === overlay) closeScreen();
  });
}
