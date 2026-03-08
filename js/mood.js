/* ============================================
   mood.js - Kayfiyat kuzatish moduli
   Slider, holat teglari, va eslatmalar
   localStorage da saqlash
   ============================================ */

/**
 * Forma ma'lumotlari - kayfiyat, stress, uyqu va boshqalar
 */
var formData = {
  mood: 5,
  stress: 5,
  social: 0,
  expense: 0,
  sleepHours: 8,
  sleepTime: '23:00',
  wakeTime: '07:00'
};

/** Holat teglari ro'yxati */
var userStatuses = [
  '\uD83D\uDE34 Charchagan',
  '\uD83D\uDCAA Energik',
  '\uD83C\uDFAF Fokusda',
  '\uD83D\uDE30 Tashvishli',
  '\uD83E\uDD12 Kasal',
  '\uD83E\uDDD8 Tinch'
];

/** Tanlangan holatlar to'plami */
var activeStatuses = new Set();

/** Tahrir qilinayotgan todo ID si */
var editingTodoId = null;

/**
 * Slider qiymatini yangilash
 * @param {string} type - 'mood' yoki 'stress'
 * @param {string|number} value - Yangi qiymat
 */
function updateSlider(type, value) {
  TGHaptics.selection();
  var valEl = document.getElementById(type + 'V');
  if (valEl) valEl.textContent = value;
  formData[type] = parseInt(value, 10);
}

/**
 * Raqamli qiymatni o'zgartirish (+/-)
 * @param {string} type - 'social' yoki 'expense'
 * @param {number} delta - O'zgarish miqdori
 */
function adjustNumber(type, delta) {
  TGHaptics.light();

  if (type === 'social') {
    formData.social = Math.max(0, formData.social + delta);
    var h = Math.floor(formData.social / 60);
    var m = formData.social % 60;
    var display = h > 0 ? h + 'h ' + m : '' + m;
    var el = document.getElementById('socialV');
    if (el) el.innerHTML = display + ' <small style="font-size:11px;color:var(--t3)">daq</small>';
  } else if (type === 'expense') {
    formData.expense = Math.max(0, formData.expense + delta);
    var el2 = document.getElementById('expenseV');
    if (el2) el2.innerHTML = formData.expense.toLocaleString() + ' <small style="font-size:10px;color:var(--t3)">so\'m</small>';
  }
}

/**
 * Uyqu vaqtini hisoblash
 * Uxlash va uyg'onish vaqtlaridan davomiylikni topadi
 */
function calcSleep() {
  var s = document.getElementById('sleepTime') ? document.getElementById('sleepTime').value : '23:00';
  var w = document.getElementById('wakeTime') ? document.getElementById('wakeTime').value : '07:00';

  var sh = parseInt(s.split(':')[0]);
  var sm = parseInt(s.split(':')[1]);
  var wh = parseInt(w.split(':')[0]);
  var wm = parseInt(w.split(':')[1]);

  var sM = sh * 60 + sm;
  var wM = wh * 60 + wm;
  if (wM <= sM) wM += 1440; // Keyingi kun

  var dur = wM - sM;
  var hh = Math.floor(dur / 60);
  var mm = dur % 60;

  // Rang: yashil >= 7 soat, sariq >= 5, qizil < 5
  var col = dur >= 420 ? 'var(--green)' : dur >= 300 ? 'var(--yellow)' : 'var(--red)';
  var el = document.getElementById('sleepDur');
  if (el) {
    el.innerHTML = '\u23F1 Uyqu davomiyligi: <strong style="color:' + col + '">' + hh + ' soat ' + (mm > 0 ? mm + ' daq' : '') + '</strong>';
  }

  formData.sleepHours = parseFloat((dur / 60).toFixed(1));
  formData.sleepTime = s;
  formData.wakeTime = w;
}

/**
 * Holat teglarini render qilish
 */
function renderStatuses() {
  var grid = document.getElementById('statusGrid');
  if (!grid) return;

  grid.innerHTML = userStatuses.map(function(st) {
    return '<div class="status-tag ' + (activeStatuses.has(st) ? 'on' : '') + '" onclick="toggleStatus(\'' + escapeHtml(st) + '\')">' +
      '<span class="stx"></span> ' + escapeHtml(st) +
      '</div>';
  }).join('');
}

/**
 * Holat tegini yoqish/o'chirish
 * @param {string} st - Holat nomi
 */
function toggleStatus(st) {
  TGHaptics.selection();
  if (activeStatuses.has(st)) {
    activeStatuses.delete(st);
  } else {
    activeStatuses.add(st);
  }
  renderStatuses();
}

/**
 * Holat qo'shish modalni ochish
 */
function openAddStatus() {
  var overlay = document.getElementById('statusOverlay');
  if (overlay) overlay.classList.add('show');
}

/**
 * Holat modalni yopish
 */
function closeStatusModal() {
  var overlay = document.getElementById('statusOverlay');
  var input = document.getElementById('statusInput');
  if (overlay) overlay.classList.remove('show');
  if (input) input.value = '';
}

/**
 * Yangi holat qo'shish
 */
function addStatus() {
  var input = document.getElementById('statusInput');
  var val = input && input.value ? input.value.trim() : '';

  if (!val) {
    showToast('Holat nomini kiriting', 'error');
    TGHaptics.error();
    return;
  }
  if (userStatuses.indexOf(val) !== -1) {
    showToast('Bu holat mavjud', 'error');
    return;
  }

  userStatuses.push(val);
  renderStatuses();
  closeStatusModal();
  showToast('Holat qo\'shildi');
  TGHaptics.success();
}

/**
 * Kunlik maqsadlarni yuklash
 */
function loadTodos() {
  var todos = JSON.parse(localStorage.getItem('lc_todos') || '[]');
  var today = new Date().toDateString();
  var todayTodos = todos.filter(function(t) { return t.date === today; });
  var list = document.getElementById('todoList');

  if (!list) return;

  if (todayTodos.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:var(--t3);padding:20px;font-size:13px">Hali maqsadlar yo\'q. Yangi qo\'shing!</div>';
    return;
  }

  list.innerHTML = todayTodos.map(function(t) {
    return '<div class="todo-item ' + (t.done ? 'done' : '') + '" data-id="' + t.id + '">' +
      '<div class="todo-check ' + (t.done ? 'checked' : '') + '" onclick="toggleTodo(' + t.id + ')"></div>' +
      '<div class="todo-text" onclick="editTodo(' + t.id + ')">' + escapeHtml(t.text) + '</div>' +
      '<div class="todo-actions">' +
      '<button class="todo-btn" onclick="editTodo(' + t.id + ')">\u270F\uFE0F</button>' +
      '<button class="todo-btn" onclick="deleteTodo(' + t.id + ')">\uD83D\uDDD1\uFE0F</button>' +
      '</div>' +
      '</div>';
  }).join('');
}

/**
 * Yangi maqsad qo'shish
 */
function addTodo() {
  var input = document.getElementById('todoInput');
  var text = input && input.value ? input.value.trim() : '';
  if (!text) return;

  TGHaptics.light();

  var todos = JSON.parse(localStorage.getItem('lc_todos') || '[]');
  var today = new Date().toDateString();

  if (editingTodoId) {
    var idx = todos.findIndex(function(t) { return t.id === editingTodoId; });
    if (idx !== -1) todos[idx].text = text;
    editingTodoId = null;
  } else {
    todos.push({ id: Date.now(), text: text, done: false, date: today });
  }

  localStorage.setItem('lc_todos', JSON.stringify(todos));
  input.value = '';
  loadTodos();
  showToast(editingTodoId ? 'Yangilandi!' : 'Maqsad qo\'shildi!');
  TGHaptics.success();
}

/**
 * Maqsadni bajarilgan/bajarilmagan deb belgilash
 * @param {number} id - Todo ID
 */
function toggleTodo(id) {
  var todos = JSON.parse(localStorage.getItem('lc_todos') || '[]');
  var idx = todos.findIndex(function(t) { return t.id === id; });
  if (idx !== -1) {
    todos[idx].done = !todos[idx].done;
    localStorage.setItem('lc_todos', JSON.stringify(todos));
    loadTodos();
    if (todos[idx].done) {
      showToast('Maqsad bajarildi!');
      TGHaptics.success();
    } else {
      TGHaptics.light();
    }
  }
}

/**
 * Maqsadni tahrirlash
 * @param {number} id - Todo ID
 */
function editTodo(id) {
  var todos = JSON.parse(localStorage.getItem('lc_todos') || '[]');
  var todo = todos.find(function(t) { return t.id === id; });
  if (todo) {
    document.getElementById('todoInput').value = todo.text;
    editingTodoId = id;
    document.getElementById('todoInput').focus();
  }
}

/**
 * Maqsadni o'chirish
 * @param {number} id - Todo ID
 */
function deleteTodo(id) {
  if (!confirm('Maqsadni o\'chirishni xohlaysizmi?')) return;
  TGHaptics.light();

  var todos = JSON.parse(localStorage.getItem('lc_todos') || '[]');
  var filtered = todos.filter(function(t) { return t.id !== id; });
  localStorage.setItem('lc_todos', JSON.stringify(filtered));
  loadTodos();
  showToast('O\'chirildi');
}

/**
 * AI yordamida maqsadlar yaratish
 */
async function generateAiGoals() {
  var btn = event.target;
  var originalText = btn.textContent;
  btn.textContent = 'Yaratilmoqda...';
  btn.disabled = true;

  try {
    var prompt = 'Bugun uchun 3 ta foydali kunlik maqsad yarat. Har biri qisqa va aniq bo\'lsin. O\'zbek tilida, har birini yangi qatordan boshla.';
    var text = await fetchWithFallback(prompt);
    var goals = text.split('\n').filter(function(g) { return g.trim(); }).slice(0, 3);

    var todos = JSON.parse(localStorage.getItem('lc_todos') || '[]');
    var today = new Date().toDateString();

    goals.forEach(function(goal) {
      var cleanGoal = goal.replace(/^\d+[.\-)\s]*/, '').trim();
      if (cleanGoal) {
        todos.push({ id: Date.now() + Math.random(), text: cleanGoal, done: false, date: today });
      }
    });

    localStorage.setItem('lc_todos', JSON.stringify(todos));
    loadTodos();
    showToast('AI maqsadlar yaratildi!');
    TGHaptics.success();
  } catch (e) {
    showToast('Xato: ' + e.message, 'error');
    TGHaptics.error();
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

/**
 * Bugungi ma'lumotlarni AI ga tahlil qildirish
 */
async function analyzeToday() {
  calcSleep();
  TGHaptics.medium();

  var note = document.getElementById('noteTA') && document.getElementById('noteTA').value ? document.getElementById('noteTA').value.trim() : '';
  var analysisBox = document.getElementById('homeAnalysis');
  var content = document.getElementById('analysisContent');

  if (analysisBox) analysisBox.classList.add('show');
  if (content) {
    content.innerHTML = '<div class="analysis-loading">' +
      '<div class="spinner" style="width:20px;height:20px;border-width:2px"></div>' +
      'Tahlil qilinmoqda...' +
      '</div>';
  }

  if (analysisBox) {
    setTimeout(function() { analysisBox.scrollIntoView({ behavior: 'smooth' }); }, 100);
  }

  try {
    var prompt = 'Foydalanuvchi ma\'lumotlari: Kayfiyat ' + formData.mood + '/10, Stress ' + formData.stress + '/10, Uyqu ' + formData.sleepHours + 'soat, Tarmoq ' + formData.social + 'daq, Xarajat ' + formData.expense + 'so\'m. Eslatma: ' + note + '. O\'zbek tilida batafsil tahlil ber va 3-4 ta amaliy maslahat ber.';
    var text = await fetchWithFallback(prompt);

    // Tahlilni localStorage ga saqlash
    var analysis = JSON.parse(localStorage.getItem('lc_analysis') || '[]');
    analysis.unshift({
      date: new Date().toISOString(),
      text: text,
      provider: 'Gemini',
      data: Object.assign({}, formData, { note: note })
    });
    localStorage.setItem('lc_analysis', JSON.stringify(analysis.slice(0, 30)));

    if (content) {
      content.innerHTML = '<p class="ai-txt">' + escapeHtml(text).replace(/\n/g, '<br>') + '</p>';
    }

    var providerName = document.getElementById('aiProviderName');
    if (providerName) providerName.textContent = 'Gemini AI';

    showToast('Tahlil tayyor!');
    TGHaptics.success();
  } catch (e) {
    if (content) {
      content.innerHTML = '<p style="color:var(--red)">Xato: ' + escapeHtml(e.message) + '</p>';
    }
    TGHaptics.error();
  }
}
