/* ============================================
   pomodoro.js - Pomodoro Timer moduli
   25 daqiqalik ish va 5 daqiqalik tanaffus sikli
   Vizual progress-bar va tugash signali
   ============================================ */

/**
 * Pomodoro holati
 * running - taymer ishlayaptimi
 * phase - 'work' yoki 'break'
 * remaining - qolgan vaqt (soniya)
 * duration - umumiy vaqt (soniya)
 * timer - setInterval ID
 * soundEnabled - ovoz yoqilganmi
 */
var pomodoro = {
  running: false,
  phase: 'work',
  remaining: 1500,
  duration: 1500,
  timer: null,
  soundEnabled: false
};

/** AudioContext ovozli signal uchun */
var audioContext = null;

/**
 * Pomodoro vaqtini o'zgartirish (15, 25, 50 daqiqa)
 * @param {number} minutes - Daqiqa miqdori
 */
function setPomDuration(minutes) {
  if (pomodoro.running) return;
  TGHaptics.light();
  pomodoro.duration = minutes * 60;
  pomodoro.remaining = minutes * 60;
  updatePomDisplay();
}

/**
 * Taymer displeyini yangilash
 * Vaqt va progress-bar ni ko'rsatadi
 */
function updatePomDisplay() {
  var min = Math.floor(pomodoro.remaining / 60);
  var sec = pomodoro.remaining % 60;
  var timeEl = document.getElementById('pomTime');
  if (timeEl) timeEl.textContent = (min < 10 ? '0' : '') + min + ':' + (sec < 10 ? '0' : '') + sec;

  // SVG progress ring yangilash
  var arc = document.getElementById('pomArc');
  if (arc) {
    var offset = 540 * (1 - pomodoro.remaining / pomodoro.duration);
    arc.style.strokeDashoffset = offset;
  }

  // Fazani ko'rsatish
  var phaseEl = document.getElementById('pomPhase');
  if (phaseEl) phaseEl.textContent = pomodoro.phase === 'work' ? 'Fokus \uD83C\uDFAF' : 'Dam olish \u2615';
}

/**
 * Pomodoro boshlash/to'xtatish
 */
function pomToggle() {
  TGHaptics.medium();

  if (pomodoro.running) {
    // To'xtatish
    pomodoro.running = false;
    clearInterval(pomodoro.timer);
    var btn = document.getElementById('pomStartBtn');
    if (btn) {
      btn.textContent = '\u25B6 Davom ettirish';
      btn.classList.add('primary');
    }
  } else {
    // Boshlash
    pomodoro.running = true;
    var btn2 = document.getElementById('pomStartBtn');
    if (btn2) {
      btn2.textContent = '\u23F8 To\'xtatish';
      btn2.classList.remove('primary');
    }

    // Telegram MainButton orqali boshqarish
    if (tg && tg.MainButton) {
      setupMainButton('To\'xtatish', function() {
        pomToggle();
      });
    }

    pomodoro.timer = setInterval(function() {
      pomodoro.remaining--;
      updatePomDisplay();
      if (pomodoro.remaining <= 0) {
        pomComplete();
      }
    }, 1000);
  }
}

/**
 * Pomodoro tugaganda chaqiriladi
 * Statistikani saqlaydi va mukofotlarni tekshiradi
 */
function pomComplete() {
  clearInterval(pomodoro.timer);
  pomodoro.running = false;

  // Ovoz va tebranish
  if (pomodoro.soundEnabled) playNotificationSound();
  TGHaptics.success();

  // Statistikani saqlash
  var pomData = JSON.parse(localStorage.getItem('lc_pomodoro') || '{}');
  var today = new Date().toDateString();

  if (!pomData.history) pomData.history = [];
  pomData.history.push({ date: today, duration: pomodoro.duration / 60 });
  if (pomData.history.length > 100) pomData.history = pomData.history.slice(-100);

  pomData.totalDone = (pomData.totalDone || 0) + 1;
  pomData.totalMinutes = (pomData.totalMinutes || 0) + pomodoro.duration / 60;

  if (!pomData.lastDate || pomData.lastDate !== today) {
    pomData.streak = (pomData.streak || 0) + 1;
    pomData.lastDate = today;
  }

  localStorage.setItem('lc_pomodoro', JSON.stringify(pomData));

  // Mukofotlarni tekshirish
  checkAchievements(pomData.totalDone);

  // Taymer qayta o'rnatish
  pomodoro.remaining = pomodoro.duration;
  updatePomDisplay();

  var btn = document.getElementById('pomStartBtn');
  if (btn) {
    btn.textContent = '\u25B6 Boshlash';
    btn.classList.add('primary');
  }

  // MainButton yashirish
  hideMainButton();

  // Statistikani yangilash
  loadPomStats();
  loadPomHistory();
  updateRewards();

  showToast('Pomodoro tugadi!');
}

/**
 * Mukofotlarni tekshirish
 * @param {number} totalDone - Jami bajarilgan pomodoro soni
 */
function checkAchievements(totalDone) {
  var achievements = [
    { at: 1, sticker: '\uD83C\uDF31', title: 'Yangi boshlovchi', desc: 'Birinchi pomodoro!' },
    { at: 5, sticker: '\uD83C\uDF3F', title: 'Fokus ustasi', desc: '5 ta pomodoro!' },
    { at: 10, sticker: '\uD83C\uDF33', title: 'Professional', desc: '10 ta pomodoro!' },
    { at: 25, sticker: '\uD83D\uDC51', title: 'Fokus qiroli', desc: '25 ta pomodoro!' },
    { at: 50, sticker: '\uD83D\uDC8E', title: 'Fokus afsonasi', desc: '50 ta pomodoro!' },
    { at: 100, sticker: '\uD83C\uDFC6', title: 'Fokus ilohi', desc: '100 ta pomodoro!' }
  ];

  var achievement = achievements.find(function(a) { return a.at === totalDone; });
  if (achievement) {
    showAchievement(achievement.sticker, achievement.title, achievement.desc);
  }
}

/**
 * Mukofot popup ni ko'rsatish
 */
function showAchievement(sticker, title, desc) {
  var overlay = document.getElementById('achievementOverlay');
  var popup = document.getElementById('achievementPopup');
  var stickerEl = document.getElementById('achievementSticker');
  var titleEl = document.getElementById('achievementTitle');
  var descEl = document.getElementById('achievementDesc');

  if (stickerEl) stickerEl.textContent = sticker;
  if (titleEl) titleEl.textContent = title;
  if (descEl) descEl.textContent = desc;
  if (overlay) overlay.classList.add('show');
  if (popup) popup.classList.add('show');

  TGHaptics.heavy();
}

/**
 * Mukofot popup ni yopish
 */
function closeAchievement() {
  var overlay = document.getElementById('achievementOverlay');
  var popup = document.getElementById('achievementPopup');
  if (overlay) overlay.classList.remove('show');
  if (popup) popup.classList.remove('show');
}

/**
 * Ovoz signal funksiyasi
 * Web Audio API orqali tebranishli ovoz chiqaradi
 */
function playNotificationSound() {
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  var osc = audioContext.createOscillator();
  var gain = audioContext.createGain();
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.frequency.value = 800;
  osc.type = 'sine';
  gain.gain.setValueAtTime(0.3, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  osc.start(audioContext.currentTime);
  osc.stop(audioContext.currentTime + 0.5);
}

/**
 * Ovozni yoqish/o'chirish
 */
function togglePomSound() {
  pomodoro.soundEnabled = !pomodoro.soundEnabled;
  var toggle = document.getElementById('soundToggle');
  if (toggle) toggle.classList.toggle('on', pomodoro.soundEnabled);
  TGHaptics.light();
}

/**
 * Pomodoro qayta o'rnatish
 */
function pomReset() {
  pomodoro.running = false;
  clearInterval(pomodoro.timer);
  pomodoro.remaining = pomodoro.duration;
  updatePomDisplay();
  TGHaptics.light();

  var btn = document.getElementById('pomStartBtn');
  if (btn) {
    btn.textContent = '\u25B6 Boshlash';
    btn.classList.add('primary');
  }

  hideMainButton();
}

/**
 * Pomodoro statistikasini yuklash
 */
function loadPomStats() {
  var pomData = JSON.parse(localStorage.getItem('lc_pomodoro') || '{}');
  var doneEl = document.getElementById('pomDone');
  if (doneEl) doneEl.textContent = pomData.totalDone || 0;
  var minEl = document.getElementById('pomMin');
  if (minEl) minEl.textContent = Math.floor(pomData.totalMinutes || 0);
  var streakEl = document.getElementById('pomStreak');
  if (streakEl) streakEl.textContent = pomData.streak || 0;
}

/**
 * Pomodoro tarixini yuklash
 */
function loadPomHistory() {
  var container = document.getElementById('pomHistoryList');
  if (!container) return;

  var pomData = JSON.parse(localStorage.getItem('lc_pomodoro') || '{}');
  var history = pomData.history || [];

  if (history.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:var(--t3);padding:20px;font-size:13px">Hali tarix yo\'q</div>';
    return;
  }

  var last7Days = history.slice(-7).reverse();
  container.innerHTML = last7Days.map(function(h) {
    return '<div class="pom-history-item">' +
      '<span class="date">' + new Date(h.date).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' }) + '</span>' +
      '<span class="duration">' + h.duration + ' daq</span>' +
      '</div>';
  }).join('');
}

/**
 * Mukofotlar holatini yangilash
 */
function updateRewards() {
  var pomData = JSON.parse(localStorage.getItem('lc_pomodoro') || '{}');
  var totalDone = pomData.totalDone || 0;
  var tiers = [1, 5, 10, 25, 50, 100];

  tiers.forEach(function(tier) {
    var el = document.getElementById('reward' + tier);
    var progressEl = document.getElementById('progress' + tier);
    if (el && progressEl) {
      var unlocked = totalDone >= tier;
      el.classList.toggle('unlocked', unlocked);
      progressEl.textContent = Math.min(totalDone, tier) + '/' + tier;
    }
  });
}
