// Page language. Every visible string on the landing page lives here, keyed;
// markup opts in with data-i18n (text), data-i18n-html (markup) and
// data-i18n-label (aria-label). Shooting the block on the desk opens the
// flag picker, which calls setLang().
export const LANGS = [
  { code: 'en', native: 'English' },
  { code: 'vi', native: 'Tiếng Việt' },
  { code: 'ja', native: '日本語' }
];

const STRINGS = {
  en: {
    'meta.title': 'TAN NGUYEN — Software Engineer',
    'meta.desc': 'Tan Nguyen (CostlyToaster) — software engineer. Explore my floating island office — and shoot the laptop to get in touch.',
    'canvas.label': 'A whimsical office on a floating island; shoot the laptop with a nerf dart to open contact details',
    'brand.label': 'tannguyen.io home',
    'eyebrow': 'AKA COSTLYTOASTER · SOFTWARE ENGINEER',
    'topbar.solar': 'SOLAR SYSTEM →',
    'hero.kicker': 'Hello, world · Software engineer',
    'hero.copy': 'Welcome to my island office. Have a look around — and mind the laptop.',
    'hint': '<span class="gesture-icon">◎</span> Drag to look <span class="dot">·</span> A / D to switch areas <span class="dot">·</span> Shoot the laptop',
    'area.prev': 'Previous area',
    'area.next': 'Next area',
    'area.desk': 'The Desk',
    'area.grove': 'The Grove',
    'area.meadow': 'The Meadow',
    'nav.about': 'ABOUT',
    'nav.experience': 'EXPERIENCE',
    'nav.projects': 'PROJECTS',
    'nav.skills': 'SKILLS',
    'nav.contact': 'CONTACT',
    'title.about': 'About',
    'title.experience': 'Experience',
    'title.projects': 'Projects',
    'title.skills': 'Skills',
    'title.contact': 'Contact',
    'panel.section': 'SECTION',
    'panel.close': 'Close panel',
    'panel.loading': 'Loading…',
    'panel.error': 'The resume data failed to load. Try refreshing the page.',
    'contact.find': 'Find {alias} across the internet:',
    'fallback.title': 'THE VIEWPORT IS DARK.',
    'fallback.body': 'Your browser could not start WebGL. The resume remains fully available through the section menu.',
    'loading': 'Setting up the booth…',
    'screen.close': 'Close contact screen',
    'screen.cmd': '> contact --costlytoaster',
    'screen.name': 'NAME',
    'screen.alias': 'ALIAS',
    'screen.sign': 'a dart is a perfectly valid way to say hi.',
    'lang.title': 'Three languages',
    'lang.intro': 'I speak three languages. Strongest to weakest:',
    'lang.speech': 'Speech',
    'lang.writing': 'Writing',
    'lang.reading': 'Reading',
    'lang.en': 'English',
    'lang.vi': 'Vietnamese',
    'lang.ja': 'Japanese',
    'lang.hint': 'Pick a flag to read this site in that language.',
    'lang.select': 'Switch to',
    'lang.close': 'Close language panel'
  },
  vi: {
    'meta.title': 'TAN NGUYEN — Kỹ sư phần mềm',
    'meta.desc': 'Tan Nguyen (CostlyToaster) — kỹ sư phần mềm. Khám phá văn phòng trên hòn đảo bay của tôi — và bắn vào laptop để liên hệ.',
    'canvas.label': 'Một văn phòng kỳ thú trên hòn đảo bay; bắn phi tiêu vào laptop để mở thông tin liên hệ',
    'brand.label': 'trang chủ tannguyen.io',
    'eyebrow': 'AKA COSTLYTOASTER · KỸ SƯ PHẦN MỀM',
    'topbar.solar': 'HỆ MẶT TRỜI →',
    'hero.kicker': 'Xin chào thế giới · Kỹ sư phần mềm',
    'hero.copy': 'Chào mừng đến văn phòng trên đảo của tôi. Cứ nhìn quanh thoải mái — và coi chừng cái laptop.',
    'hint': '<span class="gesture-icon">◎</span> Kéo để nhìn quanh <span class="dot">·</span> A / D để đổi khu vực <span class="dot">·</span> Bắn vào laptop',
    'area.prev': 'Khu vực trước',
    'area.next': 'Khu vực sau',
    'area.desk': 'Bàn Làm Việc',
    'area.grove': 'Lùm Cây',
    'area.meadow': 'Bãi Cỏ',
    'nav.about': 'GIỚI THIỆU',
    'nav.experience': 'KINH NGHIỆM',
    'nav.projects': 'DỰ ÁN',
    'nav.skills': 'KỸ NĂNG',
    'nav.contact': 'LIÊN HỆ',
    'title.about': 'Giới thiệu',
    'title.experience': 'Kinh nghiệm',
    'title.projects': 'Dự án',
    'title.skills': 'Kỹ năng',
    'title.contact': 'Liên hệ',
    'panel.section': 'MỤC',
    'panel.close': 'Đóng bảng',
    'panel.loading': 'Đang tải…',
    'panel.error': 'Không tải được dữ liệu hồ sơ. Hãy thử tải lại trang.',
    'contact.find': 'Tìm {alias} trên khắp internet:',
    'fallback.title': 'MÀN HÌNH TỐI ĐEN.',
    'fallback.body': 'Trình duyệt của bạn không khởi động được WebGL. Hồ sơ vẫn xem được đầy đủ qua menu các mục.',
    'loading': 'Đang dựng gian hàng…',
    'screen.close': 'Đóng màn hình liên hệ',
    'screen.cmd': '> lienhe --costlytoaster',
    'screen.name': 'TÊN',
    'screen.alias': 'BIỆT DANH',
    'screen.sign': 'một mũi phi tiêu cũng là cách chào hỏi hợp lệ.',
    'lang.title': 'Ba ngôn ngữ',
    'lang.intro': 'Tôi nói được ba thứ tiếng. Từ mạnh nhất đến yếu nhất:',
    'lang.speech': 'Nói',
    'lang.writing': 'Viết',
    'lang.reading': 'Đọc',
    'lang.en': 'Tiếng Anh',
    'lang.vi': 'Tiếng Việt',
    'lang.ja': 'Tiếng Nhật',
    'lang.hint': 'Chọn một lá cờ để đọc trang này bằng ngôn ngữ đó.',
    'lang.select': 'Chuyển sang',
    'lang.close': 'Đóng bảng ngôn ngữ'
  },
  ja: {
    'meta.title': 'タン・グエン — ソフトウェアエンジニア',
    'meta.desc': 'タン・グエン（CostlyToaster）— ソフトウェアエンジニア。空に浮かぶ島のオフィスを探検して、ノートパソコンを撃って連絡先を開こう。',
    'canvas.label': '浮島の上の風変わりなオフィス。ノートパソコンにダーツを当てると連絡先が開きます',
    'brand.label': 'tannguyen.io ホーム',
    'eyebrow': '別名 COSTLYTOASTER · ソフトウェアエンジニア',
    'topbar.solar': '太陽系 →',
    'hero.kicker': 'ハロー・ワールド · ソフトウェアエンジニア',
    'hero.copy': '私の島のオフィスへようこそ。ぐるりと見回してみてください — ノートパソコンにはご用心。',
    'hint': '<span class="gesture-icon">◎</span> ドラッグで見回す <span class="dot">·</span> A / D でエリア切替 <span class="dot">·</span> ノートパソコンを撃つ',
    'area.prev': '前のエリア',
    'area.next': '次のエリア',
    'area.desk': 'デスク',
    'area.grove': '木立',
    'area.meadow': '草原',
    'nav.about': '概要',
    'nav.experience': '経歴',
    'nav.projects': 'プロジェクト',
    'nav.skills': 'スキル',
    'nav.contact': '連絡先',
    'title.about': '概要',
    'title.experience': '経歴',
    'title.projects': 'プロジェクト',
    'title.skills': 'スキル',
    'title.contact': '連絡先',
    'panel.section': 'セクション',
    'panel.close': 'パネルを閉じる',
    'panel.loading': '読み込み中…',
    'panel.error': '履歴書データを読み込めませんでした。ページを再読み込みしてください。',
    'contact.find': '{alias} はこちらで見つかります:',
    'fallback.title': '画面が真っ暗です。',
    'fallback.body': 'ブラウザが WebGL を起動できませんでした。履歴書はセクションメニューからすべてご覧いただけます。',
    'loading': 'ブースを設営中…',
    'screen.close': '連絡先画面を閉じる',
    'screen.cmd': '> renraku --costlytoaster',
    'screen.name': '名前',
    'screen.alias': '別名',
    'screen.sign': 'ダーツで挨拶するのも、立派なご連絡です。',
    'lang.title': '三つの言語',
    'lang.intro': '三か国語を話します。得意な順に:',
    'lang.speech': '会話',
    'lang.writing': '書く',
    'lang.reading': '読む',
    'lang.en': '英語',
    'lang.vi': 'ベトナム語',
    'lang.ja': '日本語',
    'lang.hint': '旗をクリックすると、このサイトがその言語に切り替わります。',
    'lang.select': '切り替え:',
    'lang.close': '言語パネルを閉じる'
  }
};

const STORAGE_KEY = 'tannguyen.lang';
let current = 'en';
const listeners = [];

export const getLang = () => current;
export const onLangChange = fn => listeners.push(fn);

export function t(key, vars) {
  const raw = STRINGS[current]?.[key] ?? STRINGS.en[key] ?? key;
  return vars
    ? raw.replace(/\{(\w+)\}/g, (m, name) => vars[name] ?? m)
    : raw;
}

export function applyDom() {
  document.documentElement.lang = current;
  document.title = t('meta.title');
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.desc'));
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  // data-i18n-html renders the few strings that carry their own markup. Its
  // input is always a literal from STRINGS above — never resume.json, URL,
  // or any other outside text. Keep it that way.
  document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll('[data-i18n-label]').forEach(el => {
    el.setAttribute('aria-label', t(el.dataset.i18nLabel));
  });
}

export function setLang(code) {
  if (!STRINGS[code] || code === current) return;
  current = code;
  try { localStorage.setItem(STORAGE_KEY, code); } catch { /* private mode */ }
  applyDom();
  listeners.forEach(fn => fn(code));
}

export function initI18n() {
  let saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* private mode */ }
  if (saved && STRINGS[saved]) current = saved;
  applyDom();
}
