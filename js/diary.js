/* ============================================
   diary.js - Kundalik (Diary) moduli
   Notion uslubidagi yozuv muharriri
   Shablonlar va yozuvlarni boshqarish
   ============================================ */

/** Tahrir qilinayotgan kundalik ID si */
var editingDiaryId = null;

/**
 * Kundalik ko'rinishini almashtirish
 * @param {string} view - 'write', 'entries', yoki 'templates'
 * @param {HTMLElement} btn - Bosilgan tugma
 */
function switchDiaryView(view, btn) {
  TGHaptics.light();

  document.querySelectorAll('.notion-nav-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');

  var writeView = document.getElementById('diaryWriteView');
  var entriesView = document.getElementById('diaryEntriesView');
  var templatesView = document.getElementById('diaryTemplatesView');

  if (writeView) writeView.style.display = view === 'write' ? 'block' : 'none';
  if (entriesView) entriesView.style.display = view === 'entries' ? 'block' : 'none';
  if (templatesView) templatesView.style.display = view === 'templates' ? 'block' : 'none';

  if (view === 'entries') loadDiaryEntries();
}

/**
 * Kundalik sanasini yangilash
 */
function updateDiaryDate() {
  var dateEl = document.getElementById('diaryDate');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('uz-UZ', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }
}

/**
 * So'zlar sonini hisoblash
 */
function updateWordCount() {
  var editor = document.getElementById('diaryEditor');
  var countEl = document.getElementById('diaryWordCount');
  if (editor && countEl) {
    var text = editor.innerText || '';
    var words = text.trim().split(/\s+/).filter(function(w) { return w.length > 0; }).length;
    countEl.textContent = words;
  }
}

/**
 * Matn formatlash (bold, italic, va boshqalar)
 * @param {string} command - execCommand buyrug'i
 * @param {string} [value] - Qiymat (formatBlock uchun)
 */
function formatDiary(command, value) {
  var editor = document.getElementById('diaryEditor');
  if (!editor) return;
  document.execCommand(command, false, value);
  editor.focus();
  updateWordCount();
}

/**
 * Kundalik yozuvini saqlash
 */
function saveDiaryEntry() {
  var editor = document.getElementById('diaryEditor');
  var titleInput = document.getElementById('diaryTitle');
  var tagsInput = document.getElementById('diaryTags');

  var content = editor ? editor.innerHTML.trim() : '';
  var title = titleInput ? titleInput.value.trim() : '';
  var tags = tagsInput ? tagsInput.value.trim() : '';

  if (!content || content === '<br>') {
    showToast('Kundalik bo\'sh!', 'error');
    TGHaptics.error();
    return;
  }

  TGHaptics.medium();

  var diary = JSON.parse(localStorage.getItem('lc_diary') || '[]');

  if (editingDiaryId) {
    var idx = diary.findIndex(function(d) { return d.id === editingDiaryId; });
    if (idx !== -1) {
      diary[idx].content = content;
      diary[idx].title = title;
      diary[idx].tags = tags;
      diary[idx].updatedAt = new Date().toISOString();
    }
    editingDiaryId = null;
  } else {
    diary.unshift({
      id: Date.now(),
      title: title,
      content: content,
      tags: tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  localStorage.setItem('lc_diary', JSON.stringify(diary.slice(0, 100)));

  // Formni tozalash
  if (editor) editor.innerHTML = '';
  if (titleInput) titleInput.value = '';
  if (tagsInput) tagsInput.value = '';

  var indicator = document.getElementById('diarySavedIndicator');
  if (indicator) {
    indicator.style.display = 'inline';
    setTimeout(function() { indicator.style.display = 'none'; }, 2000);
  }

  updateWordCount();
  showToast('Kundalik saqlandi!');
  TGHaptics.success();
}

/**
 * Kundalik yozuvlarini ro'yxatini yuklash
 */
function loadDiaryEntries() {
  var diary = JSON.parse(localStorage.getItem('lc_diary') || '[]');
  var list = document.getElementById('diaryList');
  var badge = document.getElementById('diaryCountBadge');

  if (badge) {
    badge.textContent = diary.length;
    badge.style.display = diary.length > 0 ? 'inline' : 'none';
  }

  if (!list) return;

  if (diary.length === 0) {
    list.innerHTML = '<div class="empty"><div class="empty-icon">\uD83D\uDCD3</div><p>Hali kundalik yozuvlari yo\'q</p></div>';
    return;
  }

  list.innerHTML = diary.map(function(d) {
    var date = new Date(d.createdAt);
    var dateStr = date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' });
    var timeStr = date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
    var tags = d.tags ? d.tags.split(' ').filter(function(t) { return t; }).map(function(t) {
      return '<span class="notion-entry-tag">' + t + '</span>';
    }).join('') : '';
    var preview = d.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...';

    return '<div class="notion-entry" data-id="' + d.id + '">' +
      '<div class="notion-entry-header" onclick="toggleEntryExpand(' + d.id + ')">' +
      '<div>' +
      '<div class="notion-entry-title">' + (d.title || 'Sarlavhasiz') + '</div>' +
      '<div class="notion-entry-date">\uD83D\uDCC5 ' + dateStr + ' \u00B7 \uD83D\uDD50 ' + timeStr + '</div>' +
      '</div>' +
      '<span style="font-size:18px;">\u25BC</span>' +
      '</div>' +
      '<div class="notion-entry-preview" id="entryPreview' + d.id + '">' + escapeHtml(preview) + '</div>' +
      '<div class="notion-entry-tags">' + tags + '</div>' +
      '<div class="notion-entry-actions">' +
      '<button class="btn btn-small btn-ghost" onclick="editDiaryEntry(' + d.id + ')">\u270F\uFE0F Tahrirlash</button>' +
      '<button class="btn btn-small btn-danger" onclick="deleteDiaryEntry(' + d.id + ')">\uD83D\uDDD1\uFE0F O\'chirish</button>' +
      '</div>' +
      '</div>';
  }).join('');
}

/**
 * Yozuv preview ni ochish/yopish
 * @param {number} id - Yozuv ID
 */
function toggleEntryExpand(id) {
  var preview = document.getElementById('entryPreview' + id);
  if (preview) {
    preview.style.display = preview.style.display === 'none' ? 'block' : 'none';
  }
}

/**
 * Kundalik yozuvini tahrirlash
 * @param {number} id - Yozuv ID
 */
function editDiaryEntry(id) {
  var diary = JSON.parse(localStorage.getItem('lc_diary') || '[]');
  var entry = diary.find(function(d) { return d.id === id; });

  if (entry) {
    var editor = document.getElementById('diaryEditor');
    var titleInput = document.getElementById('diaryTitle');
    var tagsInput = document.getElementById('diaryTags');

    if (editor) editor.innerHTML = entry.content;
    if (titleInput) titleInput.value = entry.title || '';
    if (tagsInput) tagsInput.value = entry.tags || '';
    editingDiaryId = id;

    // Yozish ko'rinishiga o'tish
    document.querySelectorAll('.notion-nav-btn').forEach(function(b) { b.classList.remove('active'); });
    var firstBtn = document.querySelector('.notion-nav-btn');
    if (firstBtn) firstBtn.classList.add('active');

    var writeView = document.getElementById('diaryWriteView');
    var entriesView = document.getElementById('diaryEntriesView');
    var templatesView = document.getElementById('diaryTemplatesView');

    if (writeView) writeView.style.display = 'block';
    if (entriesView) entriesView.style.display = 'none';
    if (templatesView) templatesView.style.display = 'none';

    updateWordCount();
    showToast('Tahrirlash rejimi');
    TGHaptics.light();
  }
}

/**
 * Kundalik yozuvini o'chirish
 * @param {number} id - Yozuv ID
 */
function deleteDiaryEntry(id) {
  if (!confirm('Kundalik yozuvini o\'chirishni xohlaysizmi?')) return;

  TGHaptics.light();
  var diary = JSON.parse(localStorage.getItem('lc_diary') || '[]');
  var filtered = diary.filter(function(d) { return d.id !== id; });
  localStorage.setItem('lc_diary', JSON.stringify(filtered));
  loadDiaryEntries();
  showToast('Yozuv o\'chirildi');
}

/**
 * Kundalik shablonlarni qo'llash
 * @param {string} type - Shablon turi
 */
function applyTemplate(type) {
  var templates = {
    daily: '<h2>\uD83D\uDCC5 Kunlik hisobot</h2><p><strong>Bugun qilgan ishlarim:</strong></p><ul><li></li></ul><p><strong>Ertaga reja:</strong></p><ul><li></li></ul>',
    gratitude: '<h2>\uD83D\uDE4F Minnatdorlik</h2><p>Bugun quyidagi narsalar uchun minnatdorman:</p><ul><li></li><li></li><li></li></ul>',
    goals: '<h2>\uD83C\uDFAF Bugungi maqsadlar</h2><ul><li></li><li></li><li></li></ul>',
    reflection: '<h2>\uD83E\uDD14 Bugungi o\'ylari</h2><p></p>',
    dream: '<h2>\uD83C\uDF19 Tushim</h2><p></p><p><strong>Tushning ma\'nosi:</strong></p><p></p>',
    idea: '<h2>\uD83D\uDCA1 Yangi g\'oya</h2><p></p><p><strong>Qanday amalga oshirish mumkin:</strong></p><ul><li></li></ul>'
  };

  var editor = document.getElementById('diaryEditor');
  if (editor) {
    editor.innerHTML = templates[type] || '';
    updateWordCount();
    showToast('Shablon qo\'llandi');
    TGHaptics.light();

    // Yozish ko'rinishiga o'tish
    document.querySelectorAll('.notion-nav-btn').forEach(function(b) { b.classList.remove('active'); });
    document.querySelectorAll('.notion-nav-btn')[0].classList.add('active');

    document.getElementById('diaryWriteView').style.display = 'block';
    document.getElementById('diaryEntriesView').style.display = 'none';
    document.getElementById('diaryTemplatesView').style.display = 'none';
  }
}

/**
 * AI yordamida kundalik yozuv yaratish
 */
async function generateAiDiary() {
  var btn = event.target;
  var originalText = btn.textContent;
  btn.textContent = 'Yaratilmoqda...';
  btn.disabled = true;

  try {
    var prompt = 'Bugun uchun kundalik yozuv yarat. Foydalanuvchi o\'z fikrlarini davom ettirishi uchun 2-3 ta ochiq savol ber. O\'zbek tilida, samimiy uslubda.';
    var text = await fetchWithFallback(prompt);

    var editor = document.getElementById('diaryEditor');
    if (editor) {
      editor.innerHTML = '<p>' + escapeHtml(text).replace(/\n/g, '</p><p>') + '</p>';
      updateWordCount();
    }

    showToast('AI kundalik yaratildi!');
    TGHaptics.success();
  } catch (e) {
    showToast('Xato: ' + e.message, 'error');
    TGHaptics.error();
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}
