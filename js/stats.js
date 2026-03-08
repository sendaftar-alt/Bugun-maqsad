/* ============================================
   stats.js - Statistika va tahlil moduli
   Haftalik, oylik, yillik ko'rsatkichlar
   Kalendar va grafik funksiyalari
   ============================================ */

/** Kalendar holati */
var currentCalendarMonth = new Date().getMonth();
var currentCalendarYear = new Date().getFullYear();

/**
 * Statistika tablarini almashtirish
 * @param {string} tab - 'weekly', 'monthly', 'yearly'
 * @param {HTMLElement} btn - Bosilgan tugma
 */
function switchStatsTab(tab, btn) {
  TGHaptics.light();

  document.querySelectorAll('.stats-tab').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');

  document.querySelectorAll('.stats-section').forEach(function(s) { s.classList.remove('active'); });
  var section = document.getElementById('stats-' + tab);
  if (section) section.classList.add('active');
}

/**
 * Barcha statistikalarni yuklash
 */
function loadStats() {
  var entries = JSON.parse(localStorage.getItem('lc_entries') || '[]');
  var now = new Date();
  var weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  var monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  var weekEntries = entries.filter(function(e) { return new Date(e.date) >= weekAgo; });
  var monthEntries = entries.filter(function(e) { return new Date(e.date) >= monthAgo; });

  // Haftalik o'rtachalar
  var weekMoods = weekEntries.map(function(e) { return e.mood; }).filter(function(m) { return m; });
  var weekSleeps = weekEntries.map(function(e) { return e.sleepHours; }).filter(function(s) { return s; });
  var monthMoods = monthEntries.map(function(e) { return e.mood; }).filter(function(m) { return m; });
  var monthSleeps = monthEntries.map(function(e) { return e.sleepHours; }).filter(function(s) { return s; });

  var weekMoodAvg = weekMoods.length ? Math.round(weekMoods.reduce(function(a, b) { return a + b; }, 0) / weekMoods.length * 10) / 10 : '\u2014';
  var weekSleepAvg = weekSleeps.length ? Math.round(weekSleeps.reduce(function(a, b) { return a + b; }, 0) / weekSleeps.length * 10) / 10 : '\u2014';
  var monthMoodAvg = monthMoods.length ? Math.round(monthMoods.reduce(function(a, b) { return a + b; }, 0) / monthMoods.length * 10) / 10 : '\u2014';
  var monthSleepAvg = monthSleeps.length ? Math.round(monthSleeps.reduce(function(a, b) { return a + b; }, 0) / monthSleeps.length * 10) / 10 : '\u2014';
  var monthExpense = monthEntries.reduce(function(sum, e) { return sum + (e.expense || 0); }, 0);

  // DOM yangilash
  var weekMoodEl = document.getElementById('weekMood');
  if (weekMoodEl) weekMoodEl.textContent = weekMoodAvg;
  var weekSleepEl = document.getElementById('weekSleep');
  if (weekSleepEl) weekSleepEl.textContent = weekSleepAvg;
  var monthMoodEl = document.getElementById('monthMood');
  if (monthMoodEl) monthMoodEl.textContent = monthMoodAvg;
  var monthSleepEl = document.getElementById('monthSleep');
  if (monthSleepEl) monthSleepEl.textContent = monthSleepAvg;
  var monthExpenseEl = document.getElementById('monthExpense');
  if (monthExpenseEl) monthExpenseEl.textContent = monthExpense.toLocaleString() + ' so\'m';
  var yearTotalEl = document.getElementById('yearTotal');
  if (yearTotalEl) yearTotalEl.textContent = entries.length;

  // Grafiklar
  drawBarChart('weekMoodChart', weekEntries.map(function(e) {
    return { label: new Date(e.date).getDate(), value: e.mood };
  }));
  drawBarChart('weekSleepChart', weekEntries.map(function(e) {
    return { label: new Date(e.date).getDate(), value: e.sleepHours * 10 };
  }));
  drawBarChart('monthMoodChart', monthEntries.slice(0, 15).map(function(e) {
    return { label: new Date(e.date).getDate(), value: e.mood };
  }));
  drawBarChart('monthSleepChart', monthEntries.slice(0, 15).map(function(e) {
    return { label: new Date(e.date).getDate(), value: e.sleepHours * 10 };
  }));

  // Haftalik xulosa
  var weekSummary = document.getElementById('weekSummary');
  if (weekSummary) {
    weekSummary.innerHTML =
      '<div class="wcard"><div class="wlbl">Jami yozuvlar</div><div class="wval">' + weekEntries.length + '</div></div>' +
      '<div class="wcard"><div class="wlbl">Jami xarajat</div><div class="wval">' +
      weekEntries.reduce(function(sum, e) { return sum + (e.expense || 0); }, 0).toLocaleString() +
      ' <span class="wunit">so\'m</span></div></div>';
  }

  // Yillik xulosa
  var yearSummary = document.getElementById('yearSummary');
  if (yearSummary) {
    var totalPomo = JSON.parse(localStorage.getItem('lc_pomodoro') || '{}').totalDone || 0;
    var totalBooks = Object.values(JSON.parse(localStorage.getItem('lc_books') || '{}')).filter(function(b) { return b.status === 'done'; }).length;
    yearSummary.innerHTML =
      '<div class="wcard"><div class="wlbl">Pomodoro</div><div class="wval">' + totalPomo + '</div></div>' +
      '<div class="wcard"><div class="wlbl">Kitoblar</div><div class="wval">' + totalBooks + '</div></div>';
  }

  // Oxirgi yozuvlar
  var histBox = document.getElementById('histBox');
  if (histBox && entries.length > 0) {
    histBox.innerHTML = entries.slice(0, 10).map(function(e) {
      return '<div class="hist-item">' +
        '<div><div class="hist-date">' + new Date(e.date).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' }) + '</div>' +
        (e.note ? '<div class="hist-sub">' + escapeHtml(e.note.substring(0, 30)) + '...</div>' : '') +
        '</div>' +
        '<div class="hist-right"><div class="hist-mood">\uD83D\uDE0A ' + e.mood + '/10</div><div class="hist-exp">\uD83D\uDCB8 ' + (e.expense || 0).toLocaleString() + '</div></div>' +
        '</div>';
    }).join('');
  }
}

/**
 * SVG bar grafigi chizish
 * @param {string} canvasId - SVG element ID
 * @param {Array} data - Ma'lumotlar [{label, value}]
 */
function drawBarChart(canvasId, data) {
  var svg = document.getElementById(canvasId);
  if (!svg || data.length === 0) return;

  var max = Math.max.apply(null, data.map(function(d) { return d.value; }).concat([10]));
  var w = 300, h = 100, padding = 20;
  var barW = (w - padding * 2) / data.length * 0.7;
  var gap = (w - padding * 2) / data.length * 0.3;

  var html = '';
  data.forEach(function(d, i) {
    var barH = (d.value / max) * (h - padding * 2);
    var x = padding + i * (barW + gap);
    var y = h - padding - barH;
    html += '<rect x="' + x + '" y="' + y + '" width="' + barW + '" height="' + barH + '" fill="url(#barGrad)" rx="4"/>';
    html += '<text x="' + (x + barW / 2) + '" y="' + (h - padding + 12) + '" text-anchor="middle" fill="var(--t3)" font-size="10">' + d.label + '</text>';
  });

  html += '<defs><linearGradient id="barGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="var(--a1)"/><stop offset="100%" stop-color="var(--a2)"/></linearGradient></defs>';
  svg.innerHTML = html;
}

/**
 * Natijalar sahifasi statistikasini yangilash
 */
function updateResultStats() {
  var pomData = JSON.parse(localStorage.getItem('lc_pomodoro') || '{}');
  var entries = JSON.parse(localStorage.getItem('lc_entries') || '[]');
  var books = JSON.parse(localStorage.getItem('lc_books') || '{}');

  var resStreak = document.getElementById('resStreak');
  if (resStreak) resStreak.textContent = entries.length;
  var resPomos = document.getElementById('resPomos');
  if (resPomos) resPomos.textContent = pomData.totalDone || 0;
  var resBooks = document.getElementById('resBooks');
  if (resBooks) resBooks.textContent = Object.values(books).filter(function(b) { return b.status === 'done'; }).length;
}

/**
 * Stiker galereyasini yuklash
 */
function loadStickerGallery() {
  var container = document.getElementById('stickerGallery');
  if (!container) return;

  var pomData = JSON.parse(localStorage.getItem('lc_pomodoro') || '{}');
  var totalDone = pomData.totalDone || 0;

  var stickers = [
    { emoji: '\uD83C\uDF31', name: 'Yangi boshlovchi', required: 1 },
    { emoji: '\uD83C\uDF3F', name: 'Fokus ustasi', required: 5 },
    { emoji: '\uD83C\uDF33', name: 'Professional', required: 10 },
    { emoji: '\uD83D\uDC51', name: 'Fokus qiroli', required: 25 },
    { emoji: '\uD83D\uDC8E', name: 'Fokus afsonasi', required: 50 },
    { emoji: '\uD83C\uDFC6', name: 'Fokus ilohi', required: 100, legendary: true },
    { emoji: '\uD83D\uDD25', name: 'Streak master', required: 7 },
    { emoji: '\u2B50', name: 'Yulduz', required: 30 },
    { emoji: '\uD83C\uDF1F', name: 'Super yulduz', required: 60 },
    { emoji: '\u2728', name: 'Nur', required: 90 },
    { emoji: '\uD83C\uDFAF', name: 'Aniq nishon', required: 15 },
    { emoji: '\uD83D\uDE80', name: 'Raketa', required: 40 }
  ];

  container.innerHTML = stickers.map(function(s) {
    var unlocked = totalDone >= s.required;
    return '<div class="sticker-item ' + (unlocked ? 'unlocked' : 'locked') + (s.legendary && unlocked ? ' legendary' : '') + '" title="' + s.name + ' (' + s.required + ' ta)">' +
      (unlocked ? s.emoji : '\uD83D\uDD12') +
      '</div>';
  }).join('');
}

/**
 * Maqsadlar kalendarini yuklash
 */
function loadGoalsCalendar() {
  var container = document.getElementById('goalsCalendar');
  if (!container) return;

  var todos = JSON.parse(localStorage.getItem('lc_todos') || '[]');
  var now = new Date();
  var year = currentCalendarYear;
  var month = currentCalendarMonth;
  var daysInMonth = new Date(year, month + 1, 0).getDate();
  var firstDay = new Date(year, month, 1).getDay();

  var monthNames = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

  var html = '<div class="calendar-header">' +
    '<span>' + monthNames[month] + ' ' + year + '</span>' +
    '<div class="calendar-nav">' +
    '<button class="btn btn-small btn-ghost" onclick="changeCalendarMonth(-1)">\u2190</button>' +
    '<button class="btn btn-small btn-ghost" onclick="changeCalendarMonth(1)">\u2192</button>' +
    '</div>' +
    '</div>';

  html += '<div class="calendar-grid">';
  ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'].forEach(function(d) {
    html += '<div class="calendar-day-header">' + d + '</div>';
  });

  for (var i = 0; i < firstDay; i++) {
    html += '<div></div>';
  }

  for (var day = 1; day <= daysInMonth; day++) {
    var dateStr = new Date(year, month, day).toDateString();
    var dayTodos = todos.filter(function(t) { return t.date === dateStr; });
    var hasGoals = dayTodos.length > 0;
    var isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
    var completed = dayTodos.filter(function(t) { return t.done; }).length;

    html += '<div class="calendar-day ' + (isToday ? 'today' : '') + '" ' +
      (hasGoals ? 'onclick="showDailyGoals(\'' + dateStr + '\')"' : '') + '>' +
      day +
      (hasGoals ? '<span class="goal-count">' + completed + '/' + dayTodos.length + '</span>' : '') +
      '</div>';
  }

  html += '</div>';
  container.innerHTML = html;
}

/**
 * Kalendar oyini o'zgartirish
 * @param {number} delta - +1 yoki -1
 */
function changeCalendarMonth(delta) {
  currentCalendarMonth += delta;
  if (currentCalendarMonth > 11) {
    currentCalendarMonth = 0;
    currentCalendarYear++;
  } else if (currentCalendarMonth < 0) {
    currentCalendarMonth = 11;
    currentCalendarYear--;
  }
  loadGoalsCalendar();
}

/**
 * Kunlik maqsadlarni ko'rsatish
 * @param {string} dateStr - Sana satri
 */
function showDailyGoals(dateStr) {
  var todos = JSON.parse(localStorage.getItem('lc_todos') || '[]');
  var dayTodos = todos.filter(function(t) { return t.date === dateStr; });

  var view = document.getElementById('dailyGoalsView');
  var dateEl = document.getElementById('dailyGoalsDate');
  var list = document.getElementById('dailyGoalsList');
  if (!view || !dateEl || !list) return;

  var date = new Date(dateStr);
  dateEl.textContent = date.toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  if (dayTodos.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:var(--t3);padding:20px;">Maqsadlar yo\'q</div>';
  } else {
    list.innerHTML = dayTodos.map(function(t) {
      return '<div class="daily-goal-item ' + (t.done ? 'done' : '') + '">' +
        '<span>' + (t.done ? '\u2705' : '\u2B55') + '</span>' +
        '<span class="text">' + escapeHtml(t.text) + '</span>' +
        '</div>';
    }).join('');
  }

  view.style.display = 'block';
}

/**
 * Kunlik maqsadlar ko'rinishini yopish
 */
function hideDailyGoals() {
  var view = document.getElementById('dailyGoalsView');
  if (view) view.style.display = 'none';
}

/**
 * Tahlil tarixini yuklash
 */
function loadAnalysisHistory() {
  var container = document.getElementById('analysisHistory');
  if (!container) return;

  var analysis = JSON.parse(localStorage.getItem('lc_analysis') || '[]');

  if (analysis.length === 0) {
    container.innerHTML = '<div class="card"><div class="empty"><div class="empty-icon">\uD83D\uDCDD</div><p>Hali tahlillar yo\'q</p></div></div>';
    return;
  }

  container.innerHTML = analysis.slice(0, 5).map(function(a) {
    var date = new Date(a.date);
    var dateStr = date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });
    return '<div class="ai-box" style="margin-bottom:10px;">' +
      '<div class="ai-badge">' + dateStr + ' \u00B7 ' + (a.provider || 'AI') + '</div>' +
      '<p class="ai-txt" style="font-size:13px;">' + escapeHtml(a.text.substring(0, 150)) + '...</p>' +
      '</div>';
  }).join('');
}
