// The language panel: opens when a dart hits the block on the desk, lists
// how strong each language is, and lets a flag click re-render the whole
// page in that language.
import { LANGS, t, setLang, getLang, onLangChange } from './i18n.js';

const overlay = document.getElementById('langPanel');
const strengthList = document.getElementById('langStrengths');
const flagRow = document.getElementById('langFlags');
const closeButton = document.getElementById('langClose');

let panelOpen = false;
let lastFocused = null;
const closeListeners = [];

// Strongest to weakest, per skill.
const STRENGTHS = [
  { key: 'lang.speech', order: ['en', 'vi', 'ja'] },
  { key: 'lang.writing', order: ['en', 'ja', 'vi'] },
  { key: 'lang.reading', order: ['en', 'vi', 'ja'] }
];

export const isLanguagePanelOpen = () => panelOpen;

export function onLanguagePanelClosed(fn) {
  closeListeners.push(fn);
}

function renderStrengths() {
  strengthList.replaceChildren();
  STRENGTHS.forEach(row => {
    const li = document.createElement('li');
    const skill = document.createElement('span');
    skill.className = 'lang-skill';
    skill.textContent = t(row.key);
    const order = document.createElement('span');
    order.className = 'lang-order';
    order.textContent = row.order.map(code => t(`lang.${code}`)).join(' · ');
    li.append(skill, order);
    strengthList.appendChild(li);
  });
}

function renderFlags() {
  flagRow.replaceChildren();
  LANGS.forEach(({ code, native }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'lang-flag';
    button.dataset.lang = code;
    const icon = document.getElementById(`flag-${code}`);
    if (icon) button.appendChild(icon.content.cloneNode(true));
    const name = document.createElement('span');
    name.className = 'lang-flag-name';
    name.textContent = native;
    button.appendChild(name);
    button.setAttribute('aria-label', `${t('lang.select')} ${native}`);
    button.setAttribute('aria-pressed', String(code === getLang()));
    button.addEventListener('click', () => setLang(code));
    flagRow.appendChild(button);
  });
}

function render() {
  renderStrengths();
  renderFlags();
}

export function openLanguagePanel() {
  if (panelOpen) return;
  panelOpen = true;
  lastFocused = document.activeElement;
  render();
  overlay.hidden = false;
  closeButton.focus();
}

export function closeLanguagePanel() {
  if (!panelOpen) return;
  panelOpen = false;
  overlay.hidden = true;
  if (lastFocused?.isConnected) lastFocused.focus();
  lastFocused = null;
  closeListeners.forEach(fn => fn());
}

export function wireLanguagePanel() {
  closeButton.addEventListener('click', closeLanguagePanel);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLanguagePanel();
  });
  // The overlay spans the page while open, so a press anywhere off the card
  // closes it.
  overlay.addEventListener('pointerdown', e => {
    if (e.target === overlay) closeLanguagePanel();
  });
  // Picking a flag re-renders this panel in the new language too.
  onLangChange(() => { if (panelOpen) render(); });
}
