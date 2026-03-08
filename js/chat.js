/* ============================================
   chat.js - AI Chat interfeysi moduli
   Gemini API bilan ishlash va fallback mexanizm
   OpenAI/Gemini API kalitini Settings dan o'qish
   ============================================ */

/**
 * AI konfiguratsiyasi
 * GEMINI_KEYS - oldindan kiritilgan API kalitlari (fallback)
 * GEMINI_MODEL - ishlatilayotgan model
 */
var CONFIG = {
  GEMINI_KEYS: [
    'AIzaSyBD7gVRU4fZvsXTZ2Qe9X9_gV0PGGUK0DQ',
    'AIzaSyB5NGRWv_8PKejgKz3uM1S3FhvqnAx8c9k',
    'AIzaSyA1kTM4bR_95S6V-GX4KTV0lw-tGINbfKE',
    'AIzaSyBxbsXEQP9BGiuORi6gH6YiNzVdCFbS3rs',
    'AIzaSyCSzdrswNhedKcB1Dm5BdrtnOfEIdaq1Iw',
    'AIzaSyBKyYzsftmfD4UPp5P-DXDwOE9U2QnsM7U'
  ],
  GEMINI_MODEL: 'gemini-2.5-flash',
  CURRENT_KEY_INDEX: 0,
  OPENAI_KEY: '',
  CUSTOM_GEMINI_KEY: ''
};

/** Chat tarixi */
var chatHistory = [];

/**
 * API kalitini saqlash (Settings sahifasidan)
 * @param {string} provider - 'openai' yoki 'gemini'
 * @param {string} key - API kaliti
 */
function saveApiKey(provider, key) {
  if (provider === 'openai') {
    CONFIG.OPENAI_KEY = key;
    localStorage.setItem('lc_openai_key', key);
  } else if (provider === 'gemini') {
    CONFIG.CUSTOM_GEMINI_KEY = key;
    localStorage.setItem('lc_gemini_key', key);
  }
  showToast('API kaliti saqlandi!');
  TGHaptics.success();
}

/**
 * Saqlangan API kalitlarini yuklash
 */
function loadApiKeys() {
  var openaiKey = localStorage.getItem('lc_openai_key');
  var geminiKey = localStorage.getItem('lc_gemini_key');

  if (openaiKey) {
    CONFIG.OPENAI_KEY = openaiKey;
    var openaiInput = document.getElementById('openaiKeyInput');
    if (openaiInput) openaiInput.value = openaiKey;
  }

  if (geminiKey) {
    CONFIG.CUSTOM_GEMINI_KEY = geminiKey;
    var geminiInput = document.getElementById('geminiKeyInput');
    if (geminiInput) geminiInput.value = geminiKey;
  }
}

/**
 * AI holat ko'rsatkichini yangilash
 * @param {boolean} online - AI ishlayaptimi
 */
function updateAiStatus(online) {
  var dot = document.getElementById('aiStatusDot');
  var text = document.getElementById('aiStatusText');
  if (dot) dot.className = 'dot' + (online ? '' : ' offline');
  if (text) text.textContent = online ? 'Gemini AI' : 'Offline';
}

/**
 * Gemini API bilan so'rov yuborish (fallback mexanizm)
 * Barcha kalitlarni ketma-ket sinaydi
 * @param {string} prompt - So'rov matni
 * @returns {Promise<string>} - AI javobi
 */
async function fetchWithFallback(prompt) {
  // Birinchi: maxsus Gemini kalit
  if (CONFIG.CUSTOM_GEMINI_KEY) {
    try {
      var result = await fetchGemini(prompt, CONFIG.CUSTOM_GEMINI_KEY);
      updateAiStatus(true);
      return result;
    } catch (e) {
      console.log('[AI] Maxsus kalit ishlamadi:', e.message);
    }
  }

  // Ikkinchi: oldindan kiritilgan kalitlar
  var keys = CONFIG.GEMINI_KEYS;
  var lastError = null;

  for (var i = 0; i < keys.length; i++) {
    var keyIndex = (CONFIG.CURRENT_KEY_INDEX + i) % keys.length;
    try {
      var result2 = await fetchGemini(prompt, keys[keyIndex]);
      CONFIG.CURRENT_KEY_INDEX = keyIndex;
      updateAiStatus(true);
      return result2;
    } catch (e) {
      console.log('[AI] Gemini kalit ' + (keyIndex + 1) + ' xato:', e.message);
      lastError = e;
    }
  }

  updateAiStatus(false);
  throw lastError || new Error('Barcha API kalitlari ishlamayapti');
}

/**
 * Gemini API ga so'rov yuborish
 * @param {string} prompt - So'rov matni
 * @param {string} apiKey - API kaliti
 * @returns {Promise<string>} - Javob matni
 */
async function fetchGemini(prompt, apiKey) {
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + CONFIG.GEMINI_MODEL + ':generateContent?key=' + apiKey;

  var res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    })
  });

  if (!res.ok) throw new Error('Gemini xato: ' + res.status);

  var data = await res.json();
  var text = data.candidates && data.candidates[0] && data.candidates[0].content &&
    data.candidates[0].content.parts && data.candidates[0].content.parts[0] &&
    data.candidates[0].content.parts[0].text;

  return text || 'Javob kelmadi';
}

/**
 * Chat xabar yuborish
 * Foydalanuvchi xabarini ko'rsatadi va AI javobini kutadi
 */
async function sendChat() {
  var input = document.getElementById('chatInput');
  var text = input && input.value ? input.value.trim() : '';
  if (!text) return;

  TGHaptics.light();

  var chatArea = document.getElementById('chatArea');
  if (!chatArea) return;

  // Welcome xabarni o'chirish
  var welcome = chatArea.querySelector('.chat-welcome');
  if (welcome) welcome.remove();

  // Foydalanuvchi xabarini ko'rsatish
  var userMsg = document.createElement('div');
  userMsg.className = 'msg user';
  userMsg.textContent = text;
  chatArea.appendChild(userMsg);

  input.value = '';
  input.style.height = 'auto';
  chatArea.scrollTop = chatArea.scrollHeight;

  // Yozilmoqda animatsiyasi
  var typing = document.createElement('div');
  typing.className = 'msg ai';
  typing.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
  chatArea.appendChild(typing);
  chatArea.scrollTop = chatArea.scrollHeight;

  try {
    var prompt = 'Foydalanuvchi: ' + text + '. O\'zbek tilida, qisqa va aniq javob ber.';
    var reply = await fetchWithFallback(prompt);

    typing.remove();

    // AI javobini ko'rsatish
    var aiMsg = document.createElement('div');
    aiMsg.className = 'msg ai';
    aiMsg.innerHTML = escapeHtml(reply).replace(/\n/g, '<br>');
    chatArea.appendChild(aiMsg);

    // Chat tarixini saqlash
    chatHistory.push({ role: 'user', content: text });
    chatHistory.push({ role: 'assistant', content: reply });

    TGHaptics.success();
  } catch (e) {
    typing.remove();

    var errMsg = document.createElement('div');
    errMsg.className = 'msg ai';
    errMsg.innerHTML = '<span style="color:var(--red)">Xato: ' + escapeHtml(e.message) + '</span>';
    chatArea.appendChild(errMsg);

    TGHaptics.error();
  }

  chatArea.scrollTop = chatArea.scrollHeight;
}
