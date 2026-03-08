/* ============================================
   telegram.js - Telegram Web App integratsiyasi
   ThemeParams, MainButton, BackButton, Haptics
   va foydalanuvchi ma'lumotlarini boshqarish
   ============================================ */

/**
 * Telegram WebApp obyektiga havola
 * Agar Telegram muhitida bo'lmasa, null qaytaradi
 */
var tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;

/**
 * Telegram mavzusini (dark/light) aniqlash va CSS ga qo'llash
 * ThemeParams orqali ranglarni moslantiradi
 */
function applyTelegramTheme() {
  if (!tg) return;

  // Telegram ranglar sxemasini aniqlash
  var colorScheme = tg.colorScheme || 'dark';

  if (colorScheme === 'light') {
    document.body.classList.add('light-theme');
    document.body.classList.remove('dark-theme');
  } else {
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
  }

  // ThemeParams orqali maxsus ranglarni qo'llash
  var tp = tg.themeParams;
  if (tp) {
    var root = document.documentElement;
    if (tp.bg_color) root.style.setProperty('--bg', tp.bg_color);
    if (tp.secondary_bg_color) root.style.setProperty('--s1', tp.secondary_bg_color);
    if (tp.text_color) root.style.setProperty('--text', tp.text_color);
    if (tp.hint_color) root.style.setProperty('--t2', tp.hint_color);
    if (tp.link_color) root.style.setProperty('--a1', tp.link_color);
    if (tp.button_color) root.style.setProperty('--a1', tp.button_color);
    if (tp.button_text_color) {
      // Tugma matn rangini saqlash
      root.style.setProperty('--btn-text', tp.button_text_color);
    }
  }

  console.log('[TG] Mavzu qo\'llandi:', colorScheme);
}

/**
 * Foydalanuvchi ismini Telegram profildan olish
 * "Salom, [Ism]!" formatida ko'rsatish
 */
function showTelegramGreeting() {
  var greetingEl = document.getElementById('tgGreeting');
  if (!greetingEl) return;

  if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
    var user = tg.initDataUnsafe.user;
    var name = user.first_name || 'Foydalanuvchi';
    greetingEl.textContent = 'Salom, ' + name + '!';
    greetingEl.style.display = 'inline-block';
    console.log('[TG] Foydalanuvchi:', name);
  } else {
    // Test rejimida
    greetingEl.textContent = 'Salom!';
    greetingEl.style.display = 'inline-block';
  }
}

/**
 * Telegram MainButton ni sozlash
 * Asosiy sahifada "Tahlil qilish" tugmasini ko'rsatadi
 * @param {string} text - Tugma matni
 * @param {Function} callback - Bosilganda bajariladigan funksiya
 */
function setupMainButton(text, callback) {
  if (!tg || !tg.MainButton) return;

  tg.MainButton.setText(text);
  tg.MainButton.show();
  tg.MainButton.onClick(callback);
  console.log('[TG] MainButton sozlandi:', text);
}

/**
 * Telegram MainButton ni yashirish
 */
function hideMainButton() {
  if (!tg || !tg.MainButton) return;
  tg.MainButton.hide();
}

/**
 * Telegram BackButton ni boshqarish
 * Home sahifasida yashiriladi, boshqa sahifalarda ko'rsatiladi
 * @param {string} currentPage - Joriy sahifa nomi
 */
function handleBackButton(currentPage) {
  if (!tg || !tg.BackButton) return;

  if (currentPage === 'home') {
    tg.BackButton.hide();
  } else {
    tg.BackButton.show();
  }
}

/**
 * Telegram Haptics (tebranish) effektlari
 * Tugmalar bosilganda ishlatiladi
 */
var TGHaptics = {
  /** Yengil tebranish - oddiy bosilish */
  light: function() {
    if (tg && tg.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('light');
    }
  },

  /** O'rtacha tebranish - muhim harakat */
  medium: function() {
    if (tg && tg.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('medium');
    }
  },

  /** Kuchli tebranish - yakunlash signali */
  heavy: function() {
    if (tg && tg.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('heavy');
    }
  },

  /** Muvaffaqiyat tebranishi */
  success: function() {
    if (tg && tg.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred('success');
    }
  },

  /** Xato tebranishi */
  error: function() {
    if (tg && tg.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred('error');
    }
  },

  /** Ogohlantirish tebranishi */
  warning: function() {
    if (tg && tg.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred('warning');
    }
  },

  /** Tanlash tebranishi (navigatsiya uchun) */
  selection: function() {
    if (tg && tg.HapticFeedback) {
      tg.HapticFeedback.selectionChanged();
    }
  }
};

/**
 * Telegram WebApp ni ishga tushirish
 * ready(), expand() va asosiy sozlamalarni bajaradi
 */
function initTelegram() {
  if (!tg) {
    console.log('[TG] Telegram muhiti aniqlanmadi - TEST rejimi');
    var badge = document.getElementById('testBadge');
    if (badge) badge.style.display = 'inline-block';
    return false;
  }

  // WebApp tayyor ekanligini bildirish
  tg.ready();

  // Ilovani to'liq ekranga kengaytirish
  tg.expand();

  // Mavzuni qo'llash
  applyTelegramTheme();

  // Foydalanuvchi ismini ko'rsatish
  showTelegramGreeting();

  // BackButton bosilganda Home ga qaytish
  tg.BackButton.onClick(function() {
    TGHaptics.light();
    goPage('home', null);
  });

  // Mavzu o'zgarganda qayta qo'llash
  tg.onEvent('themeChanged', function() {
    applyTelegramTheme();
    console.log('[TG] Mavzu o\'zgardi');
  });

  // CloudStorage mavjud bo'lsa ma'lumotlarni yuklash
  if (tg.CloudStorage) {
    loadFromCloud();
    console.log('[TG] CloudStorage mavjud');
  }

  console.log('[TG] Telegram WebApp ishga tushirildi');
  return true;
}

/**
 * Telegram Cloud Storage ga saqlash
 */
function saveToCloud() {
  if (!tg || !tg.CloudStorage) {
    showToast('CloudStorage mavjud emas', 'error');
    return;
  }

  var data = {
    entries: JSON.parse(localStorage.getItem('lc_entries') || '[]'),
    books: JSON.parse(localStorage.getItem('lc_books') || '{}'),
    todos: JSON.parse(localStorage.getItem('lc_todos') || '[]'),
    diary: JSON.parse(localStorage.getItem('lc_diary') || '[]'),
    pomodoro: JSON.parse(localStorage.getItem('lc_pomodoro') || '{}'),
    analysis: JSON.parse(localStorage.getItem('lc_analysis') || '[]'),
    user: currentUser
  };

  tg.CloudStorage.setItem('lifecontext_data', JSON.stringify(data), function(err) {
    if (err) {
      showToast('Cloud saqlashda xato', 'error');
      TGHaptics.error();
    } else {
      showToast('Bulutga saqlandi!');
      TGHaptics.success();
    }
  });
}

/**
 * Telegram Cloud Storage dan yuklash
 */
function loadFromCloud() {
  if (!tg || !tg.CloudStorage) return;

  tg.CloudStorage.getItem('lifecontext_data', function(err, value) {
    if (err || !value) return;
    try {
      var data = JSON.parse(value);
      if (data.entries) localStorage.setItem('lc_entries', JSON.stringify(data.entries));
      if (data.books) localStorage.setItem('lc_books', JSON.stringify(data.books));
      if (data.todos) localStorage.setItem('lc_todos', JSON.stringify(data.todos));
      if (data.diary) localStorage.setItem('lc_diary', JSON.stringify(data.diary));
      if (data.pomodoro) localStorage.setItem('lc_pomodoro', JSON.stringify(data.pomodoro));
      if (data.analysis) localStorage.setItem('lc_analysis', JSON.stringify(data.analysis));
      if (data.user) {
        currentUser = data.user;
        localStorage.setItem('lc_user', JSON.stringify(data.user));
      }
      showToast('Bulutdan yuklandi!');
    } catch (e) {
      console.error('[TG] Cloud parse xato:', e);
    }
  });
}

/**
 * Bulutga sinxronlash
 */
function syncToCloud() {
  saveToCloud();
}
