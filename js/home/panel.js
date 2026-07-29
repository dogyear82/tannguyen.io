// Resume panel: fetches resume.json once and renders sections into the dialog.
import { SECTION_TITLES } from './config.js';
import { t, getLang, onLangChange } from './i18n.js';

const panel = document.getElementById('resumePanel');
const panelKicker = document.getElementById('panelKicker');
const panelTitle = document.getElementById('panelTitle');
const panelBody = document.getElementById('panelBody');
const closeButton = document.getElementById('panelClose');
const sectionNav = document.getElementById('sectionNav');

let resume = null;
let loadError = null;
let lastFocused = null;
let currentSection = null;
const closeListeners = [];

export function onPanelClosed(fn) {
  closeListeners.push(fn);
}

export async function loadResume() {
  try {
    const response = await fetch('resume.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    resume = await response.json();
  } catch (err) {
    loadError = err;
    console.error('Could not load resume.json', err);
  }
  return resume;
}

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

function renderAbout(body, data) {
  body.appendChild(el('p', null, data.about));
}

function renderExperience(body, data) {
  data.experience.forEach(job => {
    const entry = el('div', 'entry');
    entry.appendChild(el('h3', null, job.role));
    entry.appendChild(el('p', 'meta', `${job.company} · ${job.period}`));
    if (job.summary) entry.appendChild(el('p', null, job.summary));
    if (job.highlights?.length) {
      const list = el('ul');
      job.highlights.forEach(h => list.appendChild(el('li', null, h)));
      entry.appendChild(list);
    }
    body.appendChild(entry);
  });
}

function renderProjects(body, data) {
  data.projects.forEach(project => {
    const entry = el('div', 'entry');
    if (project.link) {
      const heading = el('h3');
      const link = el('a', null, project.name);
      link.href = project.link;
      heading.appendChild(link);
      entry.appendChild(heading);
    } else {
      entry.appendChild(el('h3', null, project.name));
    }
    if (project.tech?.length) entry.appendChild(el('p', 'meta', project.tech.join(' · ')));
    entry.appendChild(el('p', null, project.description));
    body.appendChild(entry);
  });
}

function renderSkills(body, data) {
  data.skills.forEach(group => {
    const wrap = el('div', 'tag-group');
    wrap.appendChild(el('p', 'meta', group.group));
    const tags = el('div', 'tags');
    group.items.forEach(item => tags.appendChild(el('span', null, item)));
    wrap.appendChild(tags);
    body.appendChild(wrap);
  });
}

function renderContact(body, data) {
  body.appendChild(el('p', null, t('contact.find', { alias: data.alias })));
  const socials = el('div', 'socials');
  data.socials.forEach(social => {
    const link = el('a');
    link.href = social.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    const icon = document.getElementById(`icon-${social.platform}`);
    if (icon) link.appendChild(icon.content.cloneNode(true));
    link.appendChild(el('span', null, social.label));
    link.appendChild(el('span', 'handle', social.handle ?? ''));
    socials.appendChild(link);
  });
  body.appendChild(socials);
}

const RENDERERS = {
  about: renderAbout,
  experience: renderExperience,
  projects: renderProjects,
  skills: renderSkills,
  contact: renderContact
};

function render(section) {
  const title = t(SECTION_TITLES[section]);
  panelKicker.textContent = `${t('panel.section')} · ${title.toUpperCase()}`;
  panelTitle.textContent = title;
  panelBody.replaceChildren();
  const data = getResume();
  if (!data) {
    panelBody.appendChild(el('p', null, t(loadError ? 'panel.error' : 'panel.loading')));
  } else {
    RENDERERS[section](panelBody, data);
  }
  [...sectionNav.children].forEach(b =>
    b.setAttribute('aria-current', b.dataset.section === section ? 'true' : 'false'));
}

export function openPanel(section) {
  if (!RENDERERS[section]) return;
  if (!panel.hidden && currentSection === section) return;
  if (panel.hidden) lastFocused = document.activeElement;
  currentSection = section;
  render(section);
  panel.hidden = false;
  closeButton.focus();
}

export function closePanel() {
  if (panel.hidden) return;
  const section = currentSection;
  panel.hidden = true;
  currentSection = null;
  [...sectionNav.children].forEach(b => b.setAttribute('aria-current', 'false'));
  if (lastFocused?.isConnected) lastFocused.focus();
  lastFocused = null;
  closeListeners.forEach(fn => fn(section));
}

export function isPanelOpen() {
  return !panel.hidden;
}

// resume.json carries optional per-language overrides under `translations`;
// anything a translation omits falls back to the base (English) content.
export function getResume() {
  if (!resume) return resume;
  const override = resume.translations?.[getLang()];
  return override ? { ...resume, ...override } : resume;
}

export function wirePanel() {
  closeButton.addEventListener('click', closePanel);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closePanel();
  });
  // Clicking anywhere outside the panel closes it.
  document.addEventListener('pointerdown', e => {
    if (panel.hidden) return;
    if (e.target instanceof Element && panel.contains(e.target)) return;
    closePanel();
  });
  [...sectionNav.children].forEach(button =>
    button.addEventListener('click', () => openPanel(button.dataset.section)));
  // Re-render an open section when the page language changes.
  onLangChange(() => { if (!panel.hidden && currentSection) render(currentSection); });
}
