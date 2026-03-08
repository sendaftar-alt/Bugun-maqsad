/* ============================================
   app.js - Asosiy ilova moduli
   Barcha modullarni birlashtiradi va ishga tushiradi
   Navigatsiya, utillar va umumiy funksiyalar
   ============================================ */

/** Joriy sahifa nomi */
var currentPage = 'home';

/** Joriy foydalanuvchi */
var currentUser = null;

/**
 * Element ID bo'yicha topish (qisqartma)
 * @param {string} id - Element ID
 * @returns {HTMLElement|null}
 */
function $(id) {
  return document.getElementById(id);
}

/**
 * Toast xabarnomani ko'rsatish
 * @param {string} msg - Xabar matni
 * @param {string} [type] - 'error' yoki boshqa
 */
function showToast(msg, type) {
  var t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show' + (type === 'error' ? ' error' : '');
  setTimeout(function() { t.classList.remove('show'); }, 2800);
}

/**
 * HTML escape qilish (XSS himoya)
 * @param {string} text - Kirish matni
 * @returns {string} - Xavfsiz matn
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Sahifalar orasida navigatsiya
 * Telegram BackButton va MainButton ni boshqaradi
 * Haptics effektini qo'llaydi
 * @param {string} pageName - Sahifa nomi
 * @param {HTMLElement|null} btnElement - Bosilgan nav tugmasi
 */
function goPage(pageName, btnElement) {
  // Haptics effekti
  TGHaptics.selection();

  // Barcha sahifalar va tugmalarni o'chirish
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.ni').forEach(function(b) { b.classList.remove('active'); });

  // Maqsadli sahifani ko'rsatish
  var targetPage = document.getElementById('pg-' + pageName);
  if (!targetPage) return;
  targetPage.classList.add('active');

  // Navigatsiya tugmasini belgilash
  if (btnElement) {
    btnElement.classList.add('active');
  } else {
    var found = document.querySelector('.ni[data-page="' + pageName + '"]');
    if (found) found.classList.add('active');
  }

  // Telegram BackButton boshqarish
  handleBackButton(pageName);

  // MainButton boshqarish
  if (pageName === 'home') {
    if (tg && tg.MainButton) {
      setupMainButton('Tahlil qilish', function() {
        analyzeToday();
      });
    }
  } else if (pageName === 'pomo' && !pomodoro.running) {
    hideMainButton();
  } else if (pageName !== 'pomo') {
    hideMainButton();
  }

  // Sahifa-specific yuklashlar
  if (pageName === 'result') {
    loadStats();
    loadGoalsCalendar();
    loadAnalysisHistory();
    loadStickerGallery();
    updateResultStats();
  }
  if (pageName === 'library') initLibrary();
  if (pageName === 'diary') {
    loadDiaryEntries();
    updateDiaryDate();
  }
  if (pageName === 'home') loadTodos();
  if (pageName === 'pomo') {
    loadPomStats();
    loadPomHistory();
    updateRewards();
  }
  if (pageName === 'settings') {
    loadUserInfo();
    loadApiKeys();
  }

  currentPage = pageName;
}

/**
 * Google Sign-In callback
 */
function handleGoogleSignIn(response) {
  var credential = response.credential;
  var payload = JSON.parse(atob(credential.split('.')[1]));

  currentUser = {
    id: payload.sub,
    name: payload.name,
    email: payload.email,
    picture: payload.picture,
    token: credential
  };

  localStorage.setItem('lc_user', JSON.stringify(currentUser));
  loadUserInfo();
  showToast('Xush kelibsiz, ' + payload.name + '!');
  TGHaptics.success();
}

/**
 * Google Sign-Out
 */
function handleGoogleSignOut() {
  currentUser = null;
  localStorage.removeItem('lc_user');
  loadUserInfo();
  showToast('Tizimdan chiqildi');
  TGHaptics.light();
}

/**
 * Saqlangan foydalanuvchi ma'lumotlarini yuklash
 */
function loadUserFromStorage() {
  var saved = localStorage.getItem('lc_user');
  if (saved) {
    currentUser = JSON.parse(saved);
  }
}

/**
 * Foydalanuvchi ma'lumotlarini Settings da ko'rsatish
 */
function loadUserInfo() {
  var signInSection = $('googleSignInSection');
  var userCard = $('googleUserCard');
  var signInBtn = $('googleSignInBtn');

  if (!signInSection || !userCard || !signInBtn) return;

  if (currentUser) {
    signInBtn.style.display = 'none';
    userCard.style.display = 'flex';
    $('googleName').textContent = currentUser.name;
    $('googleEmail').textContent = currentUser.email;
    $('googleAvatar').src = currentUser.picture;
  } else {
    signInBtn.style.display = 'block';
    userCard.style.display = 'none';
  }
}

/**
 * Ma'lumotlarni eksport qilish (JSON)
 */
function exportData() {
  TGHaptics.medium();

  var data = {
    entries: JSON.parse(localStorage.getItem('lc_entries') || '[]'),
    books: JSON.parse(localStorage.getItem('lc_books') || '{}'),
    todos: JSON.parse(localStorage.getItem('lc_todos') || '[]'),
    diary: JSON.parse(localStorage.getItem('lc_diary') || '[]'),
    pomodoro: JSON.parse(localStorage.getItem('lc_pomodoro') || '{}'),
    analysis: JSON.parse(localStorage.getItem('lc_analysis') || '[]'),
    user: currentUser,
    exportDate: new Date().toISOString()
  };

  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'lifecontext_backup_' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
  URL.revokeObjectURL(url);

  showToast('Ma\'lumotlar yuklandi!');
  TGHaptics.success();
}

/**
 * Natijalarni ulashish
 */
function shareResults() {
  TGHaptics.medium();

  var pomData = JSON.parse(localStorage.getItem('lc_pomodoro') || '{}');
  var entries = JSON.parse(localStorage.getItem('lc_entries') || '[]');
  var done = pomData.totalDone || 0;

  var text = '\uD83D\uDCCA LifeContext statistikam:\n\uD83C\uDF45 Pomodoro: ' + done + ' ta\n\uD83D\uDCDD Yozuvlar: ' + entries.length + ' ta\n\n@LifeContext_bot';

  if (tg) {
    // Telegram share
    tg.shareUrl && tg.shareUrl('https://t.me/LifeContext_official', text);
  } else {
    navigator.clipboard.writeText(text).then(function() {
      showToast('Nusxa olindi!');
    });
  }
}

/**
 * Barcha ma'lumotlarni o'chirish
 */
function deleteAllData() {
  if (!confirm('Barcha ma\'lumotlaringiz o\'chiriladi! Davom etasizmi?')) return;
  if (!confirm('Bu amalni qaytarib bo\'lmaydi. Tasdiqlaysizmi?')) return;

  TGHaptics.heavy();

  localStorage.removeItem('lc_entries');
  localStorage.removeItem('lc_books');
  localStorage.removeItem('lc_todos');
  localStorage.removeItem('lc_diary');
  localStorage.removeItem('lc_pomodoro');
  localStorage.removeItem('lc_analysis');
  localStorage.removeItem('lc_user');
  localStorage.removeItem('lc_openai_key');
  localStorage.removeItem('lc_gemini_key');
  currentUser = null;

  if (tg && tg.CloudStorage) {
    tg.CloudStorage.removeItem('lifecontext_data');
  }

  showToast('Barcha ma\'lumotlar o\'chirildi!');
  setTimeout(function() { location.reload(); }, 1500);
}

/**
 * Ilovani ishga tushirish (init)
 * Barcha modullarni sozlaydi
 */
function init() {
  console.log('=== LifeContext 2026 v5.0 Init ===');

  // Telegram integratsiyani ishga tushirish
  initTelegram();

  // Sana ko'rsatish
  var now = new Date();
  var datePill = $('datePill');
  if (datePill) {
    datePill.textContent = now.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });
  }

  var resDate = $('resDate');
  if (resDate) {
    resDate.textContent = now.toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  // Foydalanuvchi ma'lumotlarini yuklash
  loadUserFromStorage();

  // Telegram foydalanuvchi ismini ko'rsatish
  showTelegramGreeting();

  // Holatlarni render qilish
  renderStatuses();

  // Uyqu vaqtini hisoblash
  calcSleep();

  // Maqsadlarni yuklash
  loadTodos();

  // Pomodoro statistikani yuklash
  loadPomStats();

  // API kalitlarini yuklash
  loadApiKeys();

  // Kundalik editor input listener
  var diaryEditor = $('diaryEditor');
  if (diaryEditor) {
    diaryEditor.addEventListener('input', updateWordCount);
  }

  // Home sahifada MainButton
  if (tg && tg.MainButton) {
    setupMainButton('Tahlil qilish', function() {
      analyzeToday();
    });
  }

  console.log('[APP] Init tugadi');
}

// DOM tayyor bo'lganda ishga tushirish
window.addEventListener('DOMContentLoaded', init);
