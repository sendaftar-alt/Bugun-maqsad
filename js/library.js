/* ============================================
   library.js - Kutubxona moduli
   Kitoblar ro'yxati, filter, qidiruv
   O'qish jarayonini kuzatish
   ============================================ */

/** Joriy filter va kategoriya */
var currentFilter = 'all';
var currentCategory = 'all';
var currentBookId = null;

/** O'qish taymeri */
var readingTimer = {
  running: false,
  seconds: 0,
  timer: null
};

/**
 * Kitoblar ma'lumotlar bazasi
 * Keyinchalik tashqi API dan yuklanishi mumkin
 */
var BOOKS_DATA = [
  { id: 1, title: 'Atom odatlar', author: 'James Clear', category: "o'z-o'zini rivojlantirish", pages: 320, price: 45000, free: true, emoji: '\uD83D\uDCD8', desc: "Kichik o'zgarishlar katta natijalarga olib keladi." },
  { id: 2, title: "Boy ota, kambag'al ota", author: 'Robert Kiyosaki', category: 'moliya', pages: 336, price: 52000, free: true, emoji: '\uD83D\uDCB0', desc: 'Moliyaviy savodxonlik va investitsiya haqida.' },
  { id: 3, title: "O'tamdan qolgan dalalar", author: "Tog'ay Murod", category: "o'zbek", pages: 280, price: 35000, free: true, emoji: '\uD83D\uDCD6', desc: "O'zbek adabiyoti durdonasi." },
  { id: 4, title: 'Steve Jobs', author: 'Walter Isaacson', category: 'biografiya', pages: 656, price: 68000, free: false, emoji: '\uD83C\uDF4E', desc: 'Apple asoschisining hayoti.' },
  { id: 5, title: 'Zero to One', author: 'Peter Thiel', category: 'biznes', pages: 224, price: 58000, free: false, emoji: '\uD83D\uDE80', desc: 'Startap va innovatsiya haqida.' },
  { id: 6, title: 'Sapiens', author: 'Yuval Noah Harari', category: 'tarix', pages: 443, price: 72000, free: false, emoji: '\uD83C\uDF0D', desc: 'Insoniyat tarixi.' },
  { id: 7, title: 'Ikki shahar haqida hikoya', author: 'Charles Dickens', category: 'roman', pages: 489, price: 42000, free: true, emoji: '\uD83D\uDCDA', desc: 'Klassik adabiyot.' },
  { id: 8, title: 'Think and Grow Rich', author: 'Napoleon Hill', category: "o'z-o'zini rivojlantirish", pages: 238, price: 38000, free: true, emoji: '\uD83D\uDCA1', desc: 'Muvaffaqiyat sirlari.' }
];

/**
 * Kutubxonani ishga tushirish
 */
function initLibrary() {
  renderBooks();
  updateLibStats();
}

/**
 * Kitoblarni render qilish (filter va qidiruv bilan)
 */
function renderBooks() {
  var grid = document.getElementById('booksGrid');
  if (!grid) return;

  var savedBooks = JSON.parse(localStorage.getItem('lc_books') || '{}');
  var filtered = BOOKS_DATA;

  // Kategoriya filter
  if (currentCategory !== 'all') {
    filtered = filtered.filter(function(b) {
      return b.category === currentCategory || b.category.includes(currentCategory);
    });
  }

  // Holat filter
  if (currentFilter !== 'all') {
    filtered = filtered.filter(function(b) {
      var saved = savedBooks[b.id];
      if (currentFilter === 'reading') return saved && saved.status === 'reading';
      if (currentFilter === 'done') return saved && saved.status === 'done';
      if (currentFilter === 'saved') return saved && saved.saved;
      return true;
    });
  }

  // Qidiruv
  var search = document.getElementById('libSearch');
  if (search && search.value.trim()) {
    var q = search.value.toLowerCase();
    filtered = filtered.filter(function(b) {
      return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
    });
  }

  // Bo'sh natija
  if (filtered.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--t3)"><div style="font-size:48px;margin-bottom:10px">\uD83D\uDCDA</div><p>Kitoblar topilmadi</p></div>';
    return;
  }

  grid.innerHTML = filtered.map(function(b) {
    var saved = savedBooks[b.id] || {};
    var progress = saved.currentPage ? Math.round((saved.currentPage / b.pages) * 100) : 0;

    return '<div class="book-card" onclick="openBookModal(' + b.id + ')">' +
      (b.free ? '<span class="book-badge badge-free">Bepul</span>' : '<span class="book-badge badge-paid">' + b.price.toLocaleString() + '</span>') +
      '<div class="book-cover-ph">' + b.emoji + '</div>' +
      '<div class="book-info">' +
      '<div class="book-title">' + escapeHtml(b.title) + '</div>' +
      '<div class="book-author">' + escapeHtml(b.author) + '</div>' +
      (saved.status === 'reading' ?
        '<div class="book-progress-bar"><div class="book-progress-fill" style="width:' + progress + '%"></div></div><div class="book-meta"><span class="book-status">\uD83D\uDCD6 O\'qilmoqda</span><span class="book-pages">' + progress + '%</span></div>' :
        saved.status === 'done' ?
          '<div class="book-meta"><span class="book-status">\u2705 O\'qildi</span></div>' :
          '<div class="book-meta"><span class="book-status">' + b.pages + ' bet</span></div>') +
      '</div>' +
      '</div>';
  }).join('');
}

/**
 * Kitoblarni filtrlash
 */
function filterBooks() { renderBooks(); }

/**
 * Holat filtrini o'rnatish
 * @param {string} filter - 'all', 'reading', 'done', 'saved'
 * @param {HTMLElement} btn - Bosilgan tugma
 */
function setFilter(filter, btn) {
  document.querySelectorAll('.lib-filter').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  currentFilter = filter;
  renderBooks();
  TGHaptics.light();
}

/**
 * Kategoriya filtrini o'rnatish
 * @param {string} cat - Kategoriya nomi
 * @param {HTMLElement} btn - Bosilgan tugma
 */
function setCategory(cat, btn) {
  document.querySelectorAll('.lib-cat').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  currentCategory = cat;
  renderBooks();
  TGHaptics.light();
}

/**
 * Kutubxona statistikasini yangilash
 */
function updateLibStats() {
  var savedBooks = JSON.parse(localStorage.getItem('lc_books') || '{}');
  var reading = Object.values(savedBooks).filter(function(b) { return b.status === 'reading'; }).length;
  var done = Object.values(savedBooks).filter(function(b) { return b.status === 'done'; }).length;
  var saved = Object.values(savedBooks).filter(function(b) { return b.saved; }).length;

  var container = document.getElementById('libStatsRow');
  if (container) {
    container.innerHTML =
      '<div class="lstat"><div class="lstat-icon">\uD83D\uDCD6</div><div class="lstat-val">' + reading + '</div><div class="lstat-lbl">O\'qilmoqda</div></div>' +
      '<div class="lstat"><div class="lstat-icon">\u2705</div><div class="lstat-val">' + done + '</div><div class="lstat-lbl">O\'qildi</div></div>' +
      '<div class="lstat"><div class="lstat-icon">\uD83D\uDD16</div><div class="lstat-val">' + saved + '</div><div class="lstat-lbl">Saqlangan</div></div>' +
      '<div class="lstat"><div class="lstat-icon">\uD83D\uDCDA</div><div class="lstat-val">' + BOOKS_DATA.length + '</div><div class="lstat-lbl">Jami</div></div>';
  }
}

/**
 * Kitob modalini ochish
 * @param {number} id - Kitob ID
 */
function openBookModal(id) {
  TGHaptics.light();

  var book = BOOKS_DATA.find(function(b) { return b.id === id; });
  if (!book) return;

  currentBookId = id;
  var savedBooks = JSON.parse(localStorage.getItem('lc_books') || '{}');
  var saved = savedBooks[id] || {};
  var progress = saved.currentPage ? Math.round((saved.currentPage / book.pages) * 100) : 0;

  var modal = document.getElementById('bookModal');
  if (!modal) return;

  modal.innerHTML =
    '<div class="bm-cover-ph">' + book.emoji + '</div>' +
    '<div class="bm-body">' +
    '<div class="bm-badges">' +
    (book.free ? '<span class="bm-badge" style="background:var(--green);color:#000">Bepul</span>' : '<span class="bm-badge" style="background:var(--yellow);color:#000">' + book.price.toLocaleString() + ' so\'m</span>') +
    '<span class="bm-badge" style="background:var(--s3);color:var(--t2)">' + book.category + '</span>' +
    '</div>' +
    '<div class="bm-title">' + escapeHtml(book.title) + '</div>' +
    '<div class="bm-author">' + escapeHtml(book.author) + '</div>' +
    '<div class="bm-desc">' + escapeHtml(book.desc) + '</div>' +
    (saved.status === 'reading' ?
      '<div class="bm-progress-section">' +
      '<div class="bm-prog-title">O\'qish jarayoni</div>' +
      '<div class="bm-prog-bar"><div class="bm-prog-fill" style="width:' + progress + '%"></div></div>' +
      '<div class="bm-prog-nums"><span>' + (saved.currentPage || 0) + ' bet</span><span>' + book.pages + ' bet</span></div>' +
      '<div class="page-input-row">' +
      '<input type="number" class="page-input" id="pageInput" placeholder="Bet raqami" min="1" max="' + book.pages + '" value="' + (saved.currentPage || '') + '"/>' +
      '<button class="save-page-btn" onclick="saveBookProgress()">Saqlash</button>' +
      '</div>' +
      '</div>' : '') +
    '<div class="bm-actions">' +
    '<button class="bm-btn primary" onclick="startReadingBook()">\uD83D\uDCD6 O\'qishni boshlash</button>' +
    '<button class="bm-btn" onclick="toggleBookSaved()">' + (saved.saved ? '\uD83D\uDD16 Saqlandi' : '\uD83D\uDD16 Saqlash') + '</button>' +
    '</div>' +
    '</div>';

  var overlay = document.getElementById('bookOverlay');
  if (overlay) overlay.classList.add('show');
}

/**
 * Kitob modalini yopish
 */
function closeBookModal() {
  var overlay = document.getElementById('bookOverlay');
  if (overlay) overlay.classList.remove('show');
  currentBookId = null;
}

/**
 * Kitob o'qish jarayonini saqlash
 */
function saveBookProgress() {
  var input = document.getElementById('pageInput');
  if (!input) return;

  var page = parseInt(input.value);
  if (!page || page < 1) {
    showToast('To\'g\'ri bet raqamini kiriting', 'error');
    TGHaptics.error();
    return;
  }

  var savedBooks = JSON.parse(localStorage.getItem('lc_books') || '{}');
  var book = BOOKS_DATA.find(function(b) { return b.id === currentBookId; });
  if (!book) return;

  if (page > book.pages) {
    showToast('Kitobda faqat ' + book.pages + ' bet bor', 'error');
    return;
  }

  if (!savedBooks[currentBookId]) savedBooks[currentBookId] = {};
  savedBooks[currentBookId].currentPage = page;
  savedBooks[currentBookId].status = 'reading';
  localStorage.setItem('lc_books', JSON.stringify(savedBooks));

  showToast('Saqlandi!');
  TGHaptics.success();
  closeBookModal();
  renderBooks();
  updateLibStats();
}

/**
 * Kitob o'qishni boshlash
 */
function startReadingBook() {
  TGHaptics.medium();

  var savedBooks = JSON.parse(localStorage.getItem('lc_books') || '{}');
  if (!savedBooks[currentBookId]) savedBooks[currentBookId] = {};
  savedBooks[currentBookId].status = 'reading';
  localStorage.setItem('lc_books', JSON.stringify(savedBooks));

  showToast('O\'qish boshlandi!');
  TGHaptics.success();
  closeBookModal();
  renderBooks();
  updateLibStats();
}

/**
 * Kitobni saqlash/olib tashlash
 */
function toggleBookSaved() {
  TGHaptics.light();

  var savedBooks = JSON.parse(localStorage.getItem('lc_books') || '{}');
  if (!savedBooks[currentBookId]) savedBooks[currentBookId] = {};
  savedBooks[currentBookId].saved = !savedBooks[currentBookId].saved;
  localStorage.setItem('lc_books', JSON.stringify(savedBooks));

  showToast(savedBooks[currentBookId].saved ? 'Saqlandi' : 'Olib tashlandi');
  closeBookModal();
  renderBooks();
  updateLibStats();
}

/**
 * AI kitob tavsiyasi olish
 */
async function getBookRecommend() {
  var btn = document.getElementById('recBtn');
  if (!btn) return;

  TGHaptics.medium();
  btn.textContent = 'Tavsiya qilinmoqda...';
  btn.disabled = true;

  try {
    var prompt = 'Menga birorta foydali kitob tavsiya qil. Kitob nomi, muallifi va qisqa tavsifi bo\'lsin. O\'zbek tilida.';
    var text = await fetchWithFallback(prompt);

    var box = document.getElementById('aiRecommendBox');
    if (box) {
      box.innerHTML = '<div class="ai-rec-box"><div class="ai-badge">\uD83E\uDD16 AI tavsiyasi</div><p class="ai-rec-text">' + escapeHtml(text).replace(/\n/g, '<br>') + '</p></div>';
    }
    TGHaptics.success();
  } catch (e) {
    showToast('Xato: ' + e.message, 'error');
    TGHaptics.error();
  } finally {
    btn.textContent = '\u2728 Menga kitob tavsiya qil';
    btn.disabled = false;
  }
}

/**
 * O'qish taymerini boshlash/to'xtatish
 */
function toggleReadingTimer() {
  var btn = document.getElementById('readingStartBtn');
  var timeEl = document.getElementById('readingTime');

  if (readingTimer.running) {
    readingTimer.running = false;
    clearInterval(readingTimer.timer);
    if (btn) btn.textContent = '\u25B6 Davom ettirish';
  } else {
    readingTimer.running = true;
    if (btn) btn.textContent = '\u23F8 To\'xtatish';

    readingTimer.timer = setInterval(function() {
      readingTimer.seconds++;
      var h = Math.floor(readingTimer.seconds / 3600);
      var m = Math.floor((readingTimer.seconds % 3600) / 60);
      var s = readingTimer.seconds % 60;
      if (timeEl) {
        timeEl.textContent = (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
      }
    }, 1000);
  }

  TGHaptics.light();
}

/**
 * O'qish taymerini qayta o'rnatish
 */
function resetReadingTimer() {
  readingTimer.running = false;
  clearInterval(readingTimer.timer);
  readingTimer.seconds = 0;

  var btn = document.getElementById('readingStartBtn');
  var timeEl = document.getElementById('readingTime');
  if (btn) btn.textContent = '\u25B6 Boshlash';
  if (timeEl) timeEl.textContent = '00:00:00';
  TGHaptics.light();
}
