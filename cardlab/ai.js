/* CardLab ai.js — taxonomy 正規化、AI 回應本機驗證、請求組裝、相片壓縮（P1）
 *
 * 原則：唔信 AI 格式。任何一項硬失敗 → ok:false，唔會寫入 storage。
 */
(function (global) {
  'use strict';

  var MODEL = 'deepseek-flash';
  var OCR_URL = 'https://api.deepseek.com/v1/tools/ocr';
  var CHAT_URL = 'https://api.deepseek.com/chat/completions';
  var MAX_EDGE = 2048;
  var MAX_BYTES = 4 * 1024 * 1024;
  var JPEG_QUALITY = 0.9;
  var PREVIEW_EDGE = 1300;
  // P2.0：一次分析最多 8 張相（多頁合併成一個卡組）
  // P12：4 → 8。8 頁嘅 OCR 原文一次過餵模型會撞聚合上限／JSON 截斷，
  //      所以唔止改上限：每 PHOTO_BATCH 張相一批，分批理解＋出卡，最後合併去重。
  var MAX_PHOTOS = 8;
  var PHOTO_BATCH = 3;

  var STAGES = {
    kindergarten: ['K1', 'K2', 'K3'],
    primary: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
    secondary: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'],
    university: ['U1', 'U2', 'U3', 'U4'],
  };
  var SUBJECTS = ['chinese', 'english', 'maths', 'science', 'general', 'humanities', 'other'];
  // P1.1：gradeLabel（AI 有時回英文 label；本機改年級用固定中文標籤）
  var GRADE_LABELS = {
    K1: '幼稚園K1', K2: '幼稚園K2', K3: '幼稚園K3',
    P1: '小一', P2: '小二', P3: '小三', P4: '小四', P5: '小五', P6: '小六',
    S1: '中一', S2: '中二', S3: '中三', S4: '中四', S5: '中五', S6: '中六',
    U1: '大一', U2: '大二', U3: '大三', U4: '大四',
  };
  // 24 小時同相快取（設計 §7.6／§18.9）
  var CACHE_TTL = 24 * 60 * 60 * 1000;
  var CACHE_MAX = 20;
  // 理解頁編輯上限（設計 §S4）：主題 ≤60 字、知識點名 ≤16 字、難度 1–5
  var TOPIC_TITLE_MAX = 60;
  var KP_LABEL_MAX = 16;
  // 卡冊分類（P3）：AI 回 topic.category＝「科目＋範疇」2–10 字，例如 中文閱讀理解／數學乘法
  var CATEGORY_MAX = 10;
  var CATEGORY_MIN = 2;
  // P4：保留原文參考 —— A：卡組 source（純文字、冇相片）；B：每卡 optional context（原文節錄 ≤200 字）
  // P12：8000 → 16000。分批後每批原文仍然細，但合併後嘅卡組原文（8 頁）會超過 8000，
  //       截斷會令尾幾頁原文靜靜消失（用戶只覺「AI 漏頁」）。
  var SOURCE_MAX = 16000;
  var CONTEXT_MAX = 200;
  // 原文顯示層分段：每段大約 110 字或最多 3 句（純顯示，唔改 source.text）
  var SOURCE_PARA_CHARS = 110;
  var SOURCE_PARA_SENTENCES = 3;
  // P6：AI 整理原文 —— 只可以由用戶撳先 call；整理結果少過原文 30% 視為可疑（保留原文）
  var SOURCE_CLEAN_MIN_RATIO = 0.3;
  var CARD_TYPES = ['basic', 'cloze', 'compare', 'trap'];
  // P11：用戶要求「出卡盡量多」。硬上限由 24 放寬到 40（仍然係防爆閘，唔係目標），
  // prompt 目標改 8–20 張，並允許同一知識點由唔同角度出 2–3 張。
  // P12.1：40 係「每批」上限；合併總上限另計（見 MAX_CARDS_TOTAL）。
  var MAX_CARDS = 40;
  // P13：詞語生字（由整份教材抽，同知識點一樣係「內容決定」）——純文字，唔存相片。
  var VOCAB_MAX = 30;
  var VOCAB_WORD_MAX = 30;
  var VOCAB_MEANING_MAX = 100;
  var VOCAB_EXAMPLE_MAX = 120;
  // P12：知識點上限 10 → 12，但 12 只係**每批**上限。
  // P12.1：之前用固定 12 做合并上限，8 張相（3 批）各出 4–8 個就爆，會靜靜砍走知識點
  //        同佢嘅卡 ⇒ 用戶多上傳幾頁反而少咗內容。總上限要隨批數放大：
  //        每批 12 個 × 最多 3 批 = 36；每批 40 張卡 × 3 批 = 120（純防爆閘，正常用唔到）。
  // P12.2：知識點由「整份教材內容」決定，唔再由批次決定。
  //   做法：先一次過理解整份 OCR 文字（只出 classification／topic／taxonomy／knowledgePoints，
  //   輸出細、唔會撞 token 上限），再用同一份知識點清單逐批出卡（只回 cards）。
  //   MAX_KP 只係防爆閘（內容多可以到 24 個），唔係「每批上限」。
  var MAX_KP = 24;
  var MAX_BATCHES = planBatches(MAX_PHOTOS, PHOTO_BATCH).length; // 8 張 → 3 批
  var MAX_CARDS_TOTAL = MAX_BATCHES * MAX_CARDS;
  var SYNONYMS = {
    '常見錯誤': '易錯',
    '易錯點': '易錯',
    '錯誤': '易錯',
    '概念': '定義',
    '定義卡': '定義',
    '原理卡': '原理',
    '例子': '應用',
    '例題': '應用',
    '應用題': '應用',
    '比較': '對比',
    '分類卡': '分類',
  };
  var OTHER = '其他';

  function str(v) { return typeof v === 'string' ? v : ''; }
  function isCJKText(text) { return /[\u3400-\u9fff]/.test(String(text || '')); }
  function asArray(v) { return Array.isArray(v) ? v : []; }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function isInt(n) { return typeof n === 'number' && isFinite(n) && Math.floor(n) === n; }

  /** P10：cloze 佔位符字面值（模型有時照抄 {{answer}} 做 back）。
   *  規則必須同 parse.js 嘅 isPlaceholderAnswer 一致（兩邊都有單元測試互相對照）。 */
  var PLACEHOLDER_WORDS = ['answer', 'blank', 'fill', '答案', '填空'];
  function isPlaceholderAnswer(v) {
    var t = str(v).trim();
    if (!t) return true;
    if (/^[＿_\-—]{1,}$/.test(t)) return true;
    return PLACEHOLDER_WORDS.indexOf(t.toLowerCase()) >= 0;
  }

  /** 去 HTML ＋壓空白；唔會用 innerHTML，所以連 <script> 都當文字。 */  function stripHtml(s) {
    return str(s)
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/[ \t\u3000]+/g, ' ')
      .trim();
  }

  function truncate(s, max) {
    var arr = Array.from(s || '');
    if (arr.length <= max) return { text: s, truncated: false };
    return { text: arr.slice(0, max).join(''), truncated: true };
  }

  /** 全形英數→半形（保留中文標點）。 */
  function toHalfWidth(s) {
    return str(s).replace(/[\uFF01-\uFF5E]/g, function (ch) {
      return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0);
    }).replace(/\u3000/g, ' ');
  }

  function normLabel(raw) {
    var s = toHalfWidth(str(raw)).trim().replace(/\s+/g, ' ');
    s = s.replace(/卡$/, '');
    s = s.trim();
    if (SYNONYMS[s]) s = SYNONYMS[s];
    return s;
  }

  function labelLen(s) { return Array.from(str(s)).length; }

  // ── P4：原文參考（A 卡組 source＋B 每卡 context）──
  /**
   * 卡組原文（純文字）正規化：收 {text, pages, chars, at}。
   * text 必須係非空字串；trim、\r\n → \n、上限 SOURCE_MAX（8000 字，超出截斷但唔會拒絕整份分析）。
   * 非物件／冇文字 → null（舊卡組冇 source 就係 null，UI 自己隱藏原文掣）。
   */
  function sanitizeSource(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var text = str(raw.text).replace(/\r\n?/g, '\n').trim();
    if (!text) return null;
    var cut = truncate(text, SOURCE_MAX).text;
    var pages = Math.floor(Number(raw.pages));
    if (!isFinite(pages) || pages < 1) pages = 1;
    if (pages > 100) pages = 100;
    var at = Number(raw.at);
    if (!isFinite(at) || at < 0) at = 0;
    return { text: cut, pages: pages, chars: labelLen(cut), at: at };
  }

  /** 快取嚴格驗：source 只可以係「已正規化」嘅純文字物件（舊 entry 冇 source 仍然 OK）。 */
  function sourceOk(raw) {
    if (!raw || typeof raw !== 'object') return false;
    if (typeof raw.text !== 'string') return false;
    if (!raw.text.trim() || labelLen(raw.text) > SOURCE_MAX) return false;
    if (raw.text !== raw.text.replace(/\r\n?/g, '\n').trim()) return false;
    if (!isInt(raw.pages) || raw.pages < 1 || raw.pages > 100) return false;
    if (!isInt(raw.chars) || raw.chars !== labelLen(raw.text)) return false;
    if (!isFinite(Number(raw.at)) || Number(raw.at) < 0) return false;
    return true;
  }

  /**
   * 原文「可讀化」（純顯示層，唔改 source.text）：
   * 1) 去 OCR 當成普通字元回傳嘅 markdown 殘骸（**bold**、__bold__、行首 #、內文孤立 #）；
   * 2) 章節標題（日期 成績／學習重點／詞語角…）前斷行；
   * 3) 按句號／問號／感嘆號／分號分句，再砌成每段約 110 字或最多 3 句；
   * 英文（冇 CJK 句號）維持現有換行，唔會逐字亂切。
   * 回傳只係文字（呼叫者負責 esc），除標記外內容同原文一致。
   */
  /**
   * P13：正規化「詞語生字」清單（optional，永唔會令整份分析失敗）。
   * 每項：{id, word, lang, meaning, example}
   *  - word 必填（≤30 字，去 HTML／markdown）；meaning（中文書面解釋）必填（≤100）；
   *  - example（應用範例）optional（≤120）；
   *  - lang 由字面判斷：有 CJK → zh，否則 en（AI 回嘅值只作參考，唔信）；
   *  - 同一個 word（細楷、去空白）只留第一次；最多 VOCAB_MAX 個。
   */
  function sanitizeVocabulary(raw) {
    var out = [];
    var seen = Object.create(null);
    asArray(raw).forEach(function (item, i) {
      if (out.length >= VOCAB_MAX) return;
      if (!item || typeof item !== 'object') return;
      var word = truncate(stripHtml(item.word || '').replace(/[*_#`]/g, '').trim(), VOCAB_WORD_MAX).text;
      if (!word) return;
      var meaning = truncate(stripHtml(item.meaning || '').replace(/\r\n?/g, '\n').trim(), VOCAB_MEANING_MAX).text;
      if (!meaning) return;
      var example = truncate(stripHtml(item.example || '').replace(/\r\n?/g, '\n').trim(), VOCAB_EXAMPLE_MAX).text;
      var key = word.toLowerCase().replace(/\s+/g, ' ');
      if (seen[key]) return;
      seen[key] = 1;
      var lang = isCJKText(word) ? 'zh' : 'en';
      var v = { id: 'v' + (out.length + 1), word: word, lang: lang, meaning: meaning };
      if (example) v.example = example;
      out.push(v);
    });
    return out;
  }

  function formatSourceText(raw) {
    var s = str(raw).replace(/\r\n?/g, '\n').trim();
    if (!s) return '';
    // 1) markdown 殘骸
    s = s.replace(/\*\*/g, '').replace(/__/g, '');
    s = s.replace(/^[ \t]*#{1,6}[ \t]*/gm, '');
    s = s.replace(/[ \t]+#[ \t]*(?=\S)/g, ' ');
    s = s.replace(/[ \t]+/g, ' ');
    s = s.replace(/[ \t]*\n[ \t]*/g, '\n');
    // 2) 章節標題前斷行（OCR 會將標題同正文黏埋一段）
    s = s.replace(/(?=日期[ 　]?成績|學習重點|思維策略|詞語角|語文增值站|邊讀邊思考)/g, '\n');
    // 3) 分句 → 砌段
    var blocks = s.split(/\n+/).map(function (b) { return b.trim(); }).filter(Boolean);
    var out = [];
    blocks.forEach(function (block) {
      var sentences = block.match(/[^。！？!?；;…]+[。！？!?；;…]+[」』”）)]?|[^。！？!?；;…]+$/g) || [block];
      var para = '';
      var n = 0;
      sentences.forEach(function (sent) {
        var part = sent.trim();
        if (!part) return;
        var on = para ? para + part : part;
        if (para && (labelLen(on) > SOURCE_PARA_CHARS || n >= SOURCE_PARA_SENTENCES)) {
          out.push(para);
          para = part;
          n = 1;
        } else {
          para = on;
          n += 1;
        }
      });
      if (para) out.push(para);
    });
    return out.join('\n\n');
  }

  // ── P6：AI 整理原文（用戶撳先 call；只回 JSON {clean}，唔會覆蓋原文） ──
  function sourceCleanPrompt() {
    return [
      '你係香港教材助理。下面係一張工作紙／課本頁 OCR 出嘅文字，可能夾雜工作紙格式同雜訊。',
      '請整理成「只需要睇課文就可以用」嘅純文字：',
      '保留：故事／文章正文全文、詞語解釋（例如「詞語角」）、課後問題同選項、屬於課文一部分嘅章節小標題。',
      '刪走：日期／成績／姓名／班別欄、頁碼、分數、工作紙指示（例如「閱讀下面的文字，然後回答問題」）、教學標籤（例如「學習重點」「思維策略」「語文增值站」呢類唔係課文內容嘅標題）、重複嘅頁眉頁腳、markdown 符號（**、#、-）。',
      '規則：唔好改寫、唔好簡化、唔好加內容、唔好改錯字；保留原本文字同次序；用空行分段；如果冇嘢好刪就原樣回傳。',
      '只輸出 JSON：{"clean":"整理後嘅文字"}，唔要 markdown、唔要解釋。',
    ].join('\n');
  }

  /** 整理原文嘅請求 body（同對話模型一樣關 thinking＋JSON mode）。 */
  function buildSourceCleanBody(text) {
    return {
      model: MODEL,
      temperature: 0.2,
      max_tokens: 8192,
      thinking: { type: 'disabled' },
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: sourceCleanPrompt() },
        { role: 'user', content: '以下係 OCR 文字：\n\n' + str(text) },
      ],
    };
  }

  /**
   * 驗證 AI 整理結果：只收 JSON {clean:string}。
   * 去 markdown 殘骸（**、__）、trim、上限 SOURCE_MAX；
   * 整理後少過原文 30%（原文 ≥100 字）→ 當 AI 可能刪走課文，拒收並保留原文。
   */
  function validateSourceClean(raw, opts) {
    var o = opts || {};
    var obj = parseJsonLoose(raw);
    if (!obj || typeof obj !== 'object') return { ok: false, errors: ['not_json'] };
    var clean = str(obj.clean).replace(/\r\n?/g, '\n').replace(/\*\*/g, '').replace(/__/g, '').trim();
    if (!clean) return { ok: false, errors: ['empty_clean'] };
    clean = truncate(clean, SOURCE_MAX).text;
    var original = str(o.original);
    if (labelLen(original) >= 100 && labelLen(clean) < Math.floor(labelLen(original) * SOURCE_CLEAN_MIN_RATIO)) {
      return { ok: false, errors: ['clean_too_short'] };
    }
    return { ok: true, clean: clean };
  }

  // ── stage ↔ grade 枚舉聯動（P1.1 理解頁改年級）──
  /** grade → stage；唔認識回 ''。 */
  function stageForGrade(grade) {
    var g = str(grade).trim().toUpperCase();
    if (!g) return '';
    var keys = Object.keys(STAGES);
    for (var i = 0; i < keys.length; i++) {
      if (STAGES[keys[i]].indexOf(g) >= 0) return keys[i];
    }
    return '';
  }

  /** stage → 合法 grade 清單（回副本，唔好改到常數）。 */
  function gradesForStage(stage) {
    return STAGES[stage] ? STAGES[stage].slice() : [];
  }

  function isValidPair(stage, grade) {
    var list = STAGES[stage];
    return !!list && list.indexOf(str(grade).trim().toUpperCase()) >= 0;
  }

  function gradeLabelOf(grade) {
    var g = str(grade).trim().toUpperCase();
    return GRADE_LABELS[g] || g;
  }

  // ── 卡冊分類（P3）：科目＋範疇，例如 中文閱讀理解／英文文法／數學乘法 ──
  /** 去 HTML、全形→半形、壓空白；只有 2–10 字先算合法，其餘回 ''（唔會拋錯）。 */
  function sanitizeCategory(raw) {
    var text = toHalfWidth(stripHtml(raw)).replace(/\s+/g, ' ').trim();
    var n = labelLen(text);
    if (n < CATEGORY_MIN || n > CATEGORY_MAX) return '';
    return text;
  }

  /** analysis 嘅分類：topic.category → 科目中文 label（subjectLabel）→「其他」。 */
  function categoryOf(topic, classification) {
    var cat = sanitizeCategory(topic && topic.category);
    if (cat) return cat;
    var fallback = sanitizeCategory(classification && classification.subjectLabel);
    if (fallback) return fallback;
    return OTHER;
  }

  /** 卡組分類：舊卡組冇 topic.category 都用同一條 fallback 次序，唔會爛。 */
  function deckCategory(deck) {
    if (!deck || typeof deck !== 'object') return OTHER;
    return categoryOf(deck.topic, deck.classification);
  }

  /** 按 category 分組，組次序＝卡組首次出現次序（首頁卡冊列表用）。 */
  function groupDecks(decks) {
    var groups = [];
    var at = Object.create(null);
    asArray(decks).forEach(function (d) {
      if (!d || typeof d !== 'object') return;
      var cat = deckCategory(d);
      if (!(cat in at)) {
        at[cat] = groups.length;
        groups.push({ category: cat, decks: [] });
      }
      groups[at[cat]].decks.push(d);
    });
    return groups;
  }

  /**
   * 分類正規化（設計 §9）：
   *  1. trim、全形→半形、去尾字「卡」
   *  2. 同義表合併
   *  3. 重複 label 合併；空 label → 其他
   *  4. >6 類 → 最少嗰類併入「其他」
   *  5. KP category 唔喺 taxonomy → 其他
   * 唔改輸入，回新物件。
   */
  function normalizeTaxonomy(taxonomy, knowledgePoints, cards) {
    var kps = asArray(knowledgePoints).map(function (kp) {
      var copy = {};
      for (var k in kp) if (Object.prototype.hasOwnProperty.call(kp, k)) copy[k] = kp[k];
      copy.category = normLabel(kp && kp.category) || OTHER;
      return copy;
    });
    var cardList = asArray(cards).map(function (c) {
      var copy = {};
      for (var k in c) if (Object.prototype.hasOwnProperty.call(c, k)) copy[k] = c[k];
      copy.category = normLabel(c && c.category) || OTHER;
      return copy;
    });

    var order = [];
    function push(label) {
      var l = label || OTHER;
      if (order.indexOf(l) < 0) order.push(l);
    }
    asArray(taxonomy).forEach(function (t) { push(normLabel(t)); });
    // 知識點用到但唔喺 taxonomy 嘅分類 → 其他
    kps.forEach(function (kp) { if (order.indexOf(kp.category) < 0) kp.category = OTHER; });
    if (kps.some(function (kp) { return kp.category === OTHER; })) push(OTHER);

    // 卡嘅分類跟知識點（唔一致就用 KP 的）
    var kpById = {};
    kps.forEach(function (kp) { if (kp && kp.id) kpById[kp.id] = kp; });
    cardList.forEach(function (c) {
      var kp = kpById[c.kpId];
      var cat = kp ? kp.category : c.category;
      if (order.indexOf(cat) < 0) cat = OTHER;
      c.category = cat;
    });

    // >6 類：把最少用嘅分類併入「其他」
    function usage(label) {
      var n = 0;
      kps.forEach(function (kp) { if (kp.category === label) n += 1; });
      return n;
    }
    var guard = 0;
    while (order.length > 6 && guard < 20) {
      guard += 1;
      if (order.indexOf(OTHER) < 0) push(OTHER);
      var victim = null;
      var min = Infinity;
      order.forEach(function (l) {
        if (l === OTHER) return;
        var u = usage(l);
        if (u < min) { min = u; victim = l; }
      });
      if (!victim) break;
      order = order.filter(function (l) { return l !== victim; });
      kps.forEach(function (kp) { if (kp.category === victim) kp.category = OTHER; });
      cardList.forEach(function (c) { if (c.category === victim) c.category = OTHER; });
    }
    // 只保留仍有知識點用嘅分類？設計「UI 只顯示使用中嘅分類」→ 留返全部，UI 再篩。
    return { taxonomy: order, knowledgePoints: kps, cards: cardList };
  }

  /**
   * 由一段文字抽出第一個「完整」JSON 物件／陣列：
   * 追蹤字串狀態同括號深度，所以字串入面嘅 { } 唔會影響，前後雜訊都唔會截錯。
   */
  function balancedJson(s) {
    var text = str(s);
    var open = -1;
    for (var i = 0; i < text.length; i++) {
      var c0 = text.charAt(i);
      if (c0 === '{' || c0 === '[') { open = i; break; }
    }
    if (open < 0) return '';
    var ob = text.charAt(open);
    var cb = ob === '{' ? '}' : ']';
    var depth = 0;
    var inStr = false;
    var esc = false;
    for (var j = open; j < text.length; j++) {
      var ch = text.charAt(j);
      if (inStr) {
        if (esc) esc = false;
        else if (ch === '\\') esc = true;
        else if (ch === '"') inStr = false;
        continue;
      }
      if (ch === '"') { inStr = true; continue; }
      if (ch === ob) depth += 1;
      else if (ch === cb) {
        depth -= 1;
        if (depth === 0) return text.slice(open, j + 1);
      }
    }
    return '';
  }

  function parseJsonLoose(raw) {
    if (raw && typeof raw === 'object') return raw;
    // BOM／零寬字元：模型偶爾會夾喺開頭
    var s = str(raw).replace(/^\uFEFF/, '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
    if (!s) return null;
    // code fence 可能喺中間（有前導文字）；一律拆走
    s = s.replace(/```[a-z0-9_-]*\s*/gi, ' ').replace(/```/g, ' ').trim();
    try { return JSON.parse(s); } catch (e) { /* 再試抽第一個完整 JSON */ }
    var chunk = balancedJson(s) || s;
    try { return JSON.parse(chunk); } catch (e) { /* 尾逗號修一次 */ }
    try { return JSON.parse(chunk.replace(/,\s*([}\]])/g, '$1')); } catch (e) { return null; }
  }

  /**
   * 由 chat completion 嘅 message 抽文字：正常係 content 字串；
   * 有啲 endpoint 會回多段陣列，thinking model 亦可能只填 reasoning_content。
   */
  function messageText(msg) {
    if (!msg || typeof msg !== 'object') return '';
    var c = msg.content;
    if (typeof c === 'string' && c.trim()) return c;
    if (Array.isArray(c)) {
      var parts = [];
      c.forEach(function (p) {
        if (typeof p === 'string') parts.push(p);
        else if (p && typeof p === 'object') {
          if (typeof p.text === 'string') parts.push(p.text);
          else if (typeof p.content === 'string') parts.push(p.content);
        }
      });
      var joined = parts.join('').trim();
      if (joined) return joined;
    }
    if (typeof msg.reasoning_content === 'string' && msg.reasoning_content.trim()) return msg.reasoning_content;
    return '';
  }

  /**
   * 本機驗證（設計 §7.4）。回 {ok, errors[], notes[], value}。
   * value 只會喺 ok:true 時存在。
   */
  function validateResult(raw, opts) {
    var o = opts || {};
    // P12.2：整份教材「理解」call 只回 classification／topic／taxonomy／knowledgePoints（冇卡），
    // 所以 requireCards:false 時唔將「冇卡」當錯誤；預設仍然要有卡（單批一次過出卡嘅舊路徑）。
    var requireCards = o.requireCards !== false;
    var errors = [];
    var notes = [];
    var obj = parseJsonLoose(raw);
    if (!obj || typeof obj !== 'object') return { ok: false, errors: ['not_json'], notes: notes };
    if (obj.error) return { ok: false, errors: ['ai_' + String(obj.error)], notes: notes, aiError: String(obj.error) };

    // ── classification ──
    var c = obj.classification || {};
    var stage = str(c.stage).trim();
    var grade = str(c.grade).trim().toUpperCase();
    var grades = STAGES[stage];
    if (!grades) errors.push('bad_stage');
    else if (grades.indexOf(grade) < 0) errors.push('bad_grade');
    var subject = str(c.subject).trim();
    if (SUBJECTS.indexOf(subject) < 0) errors.push('bad_subject');
    var difficulty = typeof c.difficulty === 'string' ? Number(c.difficulty) : c.difficulty;
    if (!isInt(difficulty) || difficulty < 1 || difficulty > 5) errors.push('bad_difficulty');
    var confidence = Number(c.confidence);
    if (!isFinite(confidence) || confidence < 0 || confidence > 1) errors.push('bad_confidence');

    // ── topic ──
    var topicRaw = obj.topic || {};
    var title = stripHtml(topicRaw.title || '');
    var summary = stripHtml(topicRaw.summary || '');
    if (!title) errors.push('no_title');
    title = truncate(title, 60).text;
    summary = truncate(summary, 120).text;

    // ── taxonomy ──
    var taxRaw = asArray(obj.taxonomy).map(function (t) { return normLabel(t); }).filter(Boolean);
    var taxonomy = [];
    taxRaw.forEach(function (t) { if (taxonomy.indexOf(t) < 0) taxonomy.push(t); });
    if (taxonomy.length < 3) errors.push('bad_taxonomy_count');

    // ── knowledgePoints ──
    var kpRaw = asArray(obj.knowledgePoints);
    if (kpRaw.length < 1) errors.push('no_kp');
    if (kpRaw.length > MAX_KP) errors.push('too_many_kp');
    var kps = [];
    var kpIds = Object.create(null);
    kpRaw.forEach(function (kp, i) {
      if (!kp || typeof kp !== 'object') return;
      var id = str(kp.id).trim() || 'kp' + (i + 1);
      if (kpIds[id]) { id = id + '_' + (i + 1); }
      kpIds[id] = 1;
      var label = truncate(stripHtml(kp.label || ''), 16).text;
      if (!label) return;
      var kpDiff = isInt(kp.difficulty) ? clamp(kp.difficulty, 1, 5) : clamp(Math.round(Number(kp.difficulty) || 2), 1, 5);
      var detail = truncate(stripHtml(kp.detail || ''), 120).text;
      kps.push({ id: id, label: label, category: normLabel(kp.category) || OTHER, difficulty: kpDiff, detail: detail });
    });
    if (!kps.length) errors.push('no_valid_kp');

    // ── cards ──
    var cardRaw = asArray(obj.cards);
    if (requireCards && !cardRaw.length) errors.push('no_cards');
    if (cardRaw.length > MAX_CARDS) errors.push('too_many_cards');
    var cards = [];
    var seen = Object.create(null);
    var orphan = 0;
    var emptyKp = Object.create(null);
    kps.forEach(function (kp) { emptyKp[kp.id] = true; });
    cardRaw.forEach(function (card, i) {
      if (!card || typeof card !== 'object') return;
      var kpId = str(card.kpId).trim();
      if (!kpIds[kpId]) { orphan += 1; return; } // 孤兒卡丟棄
      var type = str(card.type).trim();
      if (CARD_TYPES.indexOf(type) < 0) type = 'basic';
      var front = stripHtml(card.front || '');
      var back = stripHtml(card.back || '');
      if (!front || !back) { notes.push('drop_empty_card'); return; }
      var f = truncate(front, 60);
      var b = truncate(back, 120);
      if (f.truncated || b.truncated) notes.push('truncated_card');
      if (type === 'cloze' && !/\{\{[^{}]*\}\}/.test(f.text)) {
        notes.push('drop_cloze_without_blank');
        return;
      }
      // P10：cloze 卡 back 係佔位符字面值／空 ⇒ 唔可以入庫（練習會出現「answer」選項）
      if (type === 'cloze' && isPlaceholderAnswer(b.text)) {
        notes.push('drop_cloze_placeholder_back');
        return;
      }
      var key = kpId + '\u0000' + f.text.toLowerCase();
      if (seen[key]) { notes.push('drop_duplicate_card'); return; }
      seen[key] = 1;
      emptyKp[kpId] = false;
      var cd = isInt(card.difficulty) ? clamp(card.difficulty, 1, 5) : clamp(Math.round(Number(card.difficulty) || 2), 1, 5);
      // P4 B：optional context＝原文相關段落節錄；去 HTML、trim、≤200 字，空就唔加 key。
      var ctx = truncate(stripHtml(card.context || ''), CONTEXT_MAX).text;
      var outCard = {
        id: 'c' + (i + 1),
        kpId: kpId,
        category: normLabel(card.category) || OTHER,
        difficulty: cd,
        type: type,
        front: f.text,
        back: b.text,
        mnemonic: truncate(stripHtml(card.mnemonic || ''), 30).text,
        example: truncate(stripHtml(card.example || ''), 80).text,
        uncertain: card.uncertain === true,
      };
      if (ctx) outCard.context = ctx;
      cards.push(outCard);
    });
    if (orphan) notes.push('orphan_cards:' + orphan);
    if (requireCards && !cards.length) errors.push('no_cards');
    if (requireCards) kps.forEach(function (kp) { if (emptyKp[kp.id]) notes.push('empty_kp:' + kp.id); });

    if (errors.length) return { ok: false, errors: errors, notes: notes };

    var normalized = normalizeTaxonomy(taxonomy, kps, cards);
    // >6 類由 §9 正規化合併；驗證只會喺合併後仍然超標時報錯。
    if (normalized.taxonomy.length > 6 && errors.indexOf('bad_taxonomy_count') < 0) errors.push('bad_taxonomy_count');
    normalized.taxonomy.forEach(function (t) {
      var n = labelLen(t);
      if ((n < 2 || n > 6) && errors.indexOf('bad_taxonomy_label') < 0) errors.push('bad_taxonomy_label');
    });
    if (errors.length) return { ok: false, errors: errors, notes: notes };
    var classification = {
      stage: stage,
      grade: grade,
      gradeLabel: truncate(stripHtml(c.gradeLabel || ''), 12).text || grade,
      subject: subject,
      subjectLabel: truncate(stripHtml(c.subjectLabel || ''), 12).text || subject,
      difficulty: difficulty,
      confidence: Math.round(confidence * 100) / 100,
      taxonomy: normalized.taxonomy,
      taxonomyVersion: 1,
    };
    // P3：卡冊分類只係「顯示用標籤」，空／超長／缺一律 fallback，唔會因此拒絕整份分析。
    var category = categoryOf(topicRaw, classification);
    // P7：AI 同一 call 回「同卡片相關嘅原文」整理版（optional）。
    // 去 HTML／markdown 殘骸、trim、封頂；整理後少過 OCR 原文 30%（原文 ≥100 字）→ 當刪走課文，唔採用（保留 OCR 原文）。
    // P13：詞語生字（optional）——壞項逐個丟，唔會拒絕整份分析
    var vocabulary = sanitizeVocabulary(obj.vocabulary);
    if (asArray(obj.vocabulary).length && !vocabulary.length) notes.push('drop_vocab_all');
    var cleanSource = '';
    var ocrRaw = str(o.ocrText).replace(/\r\n?/g, '\n').trim();
    if (typeof obj.source === 'string') {
      var cs = stripHtml(obj.source).replace(/\r\n?/g, '\n').replace(/\*\*/g, '').replace(/__/g, '').trim();
      cs = truncate(cs, SOURCE_MAX).text;
      if (cs && (labelLen(ocrRaw) < 100 || labelLen(cs) >= Math.floor(labelLen(ocrRaw) * SOURCE_CLEAN_MIN_RATIO))) {
        cleanSource = cs;
      } else if (cs) {
        notes.push('drop_clean_source_too_short');
      }
    }
    return {
      ok: true,
      errors: [],
      notes: notes,
      value: {
        classification: classification,
        topic: { title: title, summary: summary, category: category },
        cleanSource: cleanSource,
        vocabulary: vocabulary,
        taxonomy: normalized.taxonomy,
        knowledgePoints: normalized.knowledgePoints,
        cards: normalized.cards.map(function (card) {
          var kp = null;
          for (var j = 0; j < normalized.knowledgePoints.length; j++) {
            if (normalized.knowledgePoints[j].id === card.kpId) kp = normalized.knowledgePoints[j];
          }
          card.category = kp ? kp.category : OTHER;
          return card;
        }),
      },
    };
  }

  // ── P1.1：24 小時同相快取（純函數；唔接觸 localStorage）──
  // key＝壓縮後 JPEG bytes 嘅 SHA-256。只存 analysis 結果 JSON（冇相片／base64／blob）。
  // 讀／寫都係「字串入、字串出」，方便 node 單元測試同可注入時鐘。

  function hexFromBuffer(buf) {
    var arr = new Uint8Array(buf);
    var out = '';
    for (var i = 0; i < arr.length; i++) out += (arr[i] < 16 ? '0' : '') + arr[i].toString(16);
    return out;
  }

  /** Blob／ArrayBuffer／Uint8Array → 小寫 hex SHA-256。 */
  function sha256Hex(bytes) {
    var c = global.crypto;
    var subtle = c && (c.subtle || c.webkitSubtle);
    if (!subtle || typeof subtle.digest !== 'function') return Promise.reject(new Error('no_crypto'));
    var data = bytes;
    if (bytes && typeof bytes.arrayBuffer === 'function') data = bytes.arrayBuffer();
    return Promise.resolve(data)
      .then(function (buf) { return subtle.digest('SHA-256', buf); })
      .then(hexFromBuffer);
  }

  // ── P2.0：多張相合併成一個卡組（2–4 張，純函數）──
  /** 一次最多幾張相（相簿入口；相機入口仍然單張）。 */
  function photoCountCheck(n) {
    var count = Math.floor(Number(n));
    if (!isFinite(count) || count <= 0) return { ok: false, code: 'empty', count: 0, max: MAX_PHOTOS };
    if (count > MAX_PHOTOS) return { ok: false, code: 'too_many', count: count, max: MAX_PHOTOS };
    return { ok: true, code: 'ok', count: count, max: MAX_PHOTOS };
  }

  /** 將多段 bytes（Uint8Array／ArrayBuffer）按次序串接；空清單或壞輸入回 null。 */
  function joinBytes(list) {
    var arr = asArray(list);
    var parts = [];
    var total = 0;
    var i;
    for (i = 0; i < arr.length; i++) {
      var chunk = arr[i];
      if (!chunk) return null;
      var u8;
      try {
        u8 = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk);
      } catch (e) {
        return null;
      }
      if (!u8 || typeof u8.length !== 'number') return null;
      parts.push(u8);
      total += u8.length;
    }
    if (!parts.length) return null;
    var out = new Uint8Array(total);
    var off = 0;
    for (i = 0; i < parts.length; i++) {
      out.set(parts[i], off);
      off += parts[i].length;
    }
    return out;
  }

  /**
   * 多張相嘅快取 key＝所有壓縮後 JPEG bytes「按次序串接」後嘅 SHA-256。
   * 次序敏感（A+B ≠ B+A）、任何一張唔同 → key 唔同；空清單一律拒絕。
   */
  function photoSetHash(list) {
    var joined = joinBytes(list);
    if (!joined) return Promise.reject(new Error('empty_photo_set'));
    return sha256Hex(joined);
  }

  /**
   * P12：分批計劃。8 張相、每批 3 張 → [{from:0,to:3},{from:3,to:6},{from:6,to:8}]。
   * 純函數（唔掂 DOM／storage），node 可以逐個邊界直接測。
   */
  function planBatches(count, size) {
    var n = Math.floor(Number(count));
    var s = Math.floor(Number(size));
    if (!isFinite(s) || s <= 0) s = PHOTO_BATCH;
    if (!isFinite(n) || n <= 0) return [];
    var out = [];
    for (var i = 0; i < n; i += s) out.push({ from: i, to: Math.min(n, i + s) });
    return out;
  }

  /**
   * P12.2：合併各批「只出卡」結果。
   * 知識點由**整份教材一次過理解**決定（見 understandPrompt），批次只負責出卡 ⇒ 呢度只做：
   *  - 丟孤兒卡（kpId 唔喺整份知識點清單）；
   *  - 跨批去重（kpId + front 小寫，同 validateResult 同一把尺）；
   *  - card.id 重新由 c1 排到 cN（確認頁 checkbox key，跨批唔可以撞）；
   *  - 卡總數封頂（MAX_CARDS_TOTAL = 批數 × 每批上限，正常用唔到）。
   * 冇卡 → ok:false（唔會出一個冇卡嘅卡組）。
   */
  function mergeCardSets(lists, opts) {
    var o = opts || {};
    var maxCards = isInt(o.maxCards) ? clamp(o.maxCards, 1, MAX_CARDS_TOTAL) : MAX_CARDS_TOTAL;
    var notes = [];
    var out = [];
    var seen = Object.create(null);
    var dup = 0;
    asArray(lists).forEach(function (list) {
      asArray(list).forEach(function (c) {
        if (!c || typeof c !== 'object') return;
        var kpId = str(c.kpId).trim();
        var front = stripHtml(c.front || '');
        var back = stripHtml(c.back || '');
        if (!kpId || !front || !back) return;
        var key = kpId + '\u0000' + front.toLowerCase();
        if (seen[key]) { dup += 1; return; }
        seen[key] = 1;
        var card = {
          id: 'c' + (out.length + 1),
          kpId: kpId,
          category: c.category,
          difficulty: c.difficulty,
          type: c.type,
          front: front,
          back: back,
          mnemonic: str(c.mnemonic),
          example: str(c.example),
          uncertain: c.uncertain === true,
        };
        if (str(c.context).trim()) card.context = c.context;
        out.push(card);
      });
    });
    if (dup) notes.push('drop_duplicate_card:' + dup);
    if (out.length > maxCards) {
      notes.push('trimmed_cards:' + (out.length - maxCards));
      out = out.slice(0, maxCards);
    }
    if (!out.length) return { ok: false, cards: [], notes: notes, errors: ['no_cards'] };
    return { ok: true, cards: out, notes: notes, errors: [] };
  }

  function cacheEmpty() { return { schema: 1, entries: [] }; }

  /** 快取 value 一定要係「已過本機驗證」嘅 analysis 形狀；壞資料一律拒收。 */
  function cacheValueOk(v) {
    if (!v || typeof v !== 'object') return false;
    var c = v.classification;
    if (!c || typeof c !== 'object') return false;
    if (!isValidPair(c.stage, c.grade)) return false;
    if (!isInt(c.difficulty) || c.difficulty < 1 || c.difficulty > 5) return false;
    var tax = asArray(c.taxonomy).map(function (x) { return normLabel(x); }).filter(Boolean);
    if (tax.length < 3 || tax.length > 6) return false;
    var tp = v.topic;
    if (!tp || typeof tp !== 'object') return false;
    var titleText = stripHtml(tp.title || '');
    if (!titleText || labelLen(titleText) > TOPIC_TITLE_MAX) return false;
    // P3：topic.category 只做 optional 驗 —— 舊快取（冇 category）照樣 OK；
    //     有就要係已正規化嘅 2–10 字字串，否則拒收（唔會因此清走其他舊 entry）。
    if (tp.category !== undefined && tp.category !== null) {
      if (typeof tp.category !== 'string') return false;
      if (!sanitizeCategory(tp.category) || sanitizeCategory(tp.category) !== tp.category) return false;
    }
    // P4 A：source 只做 optional 驗 —— 舊快取（冇 source）照命中；有就要係已正規化嘅純文字物件。
    if (v.source !== undefined && v.source !== null && !sourceOk(v.source)) return false;
    // P7：AI 整理後原文（source.clean）optional 驗 —— 有就要係非空、≤8000 字純文字。
    if (v.source && v.source.clean !== undefined && v.source.clean !== null) {
      if (typeof v.source.clean !== 'string') return false;
      var sclean = stripHtml(v.source.clean);
      if (!sclean || labelLen(sclean) > SOURCE_MAX) return false;
    }
    // P13：vocabulary optional —— 冇＝舊 entry 照命中；有就要每一項都過 sanitize（形狀一致）
    if (v.vocabulary !== undefined && v.vocabulary !== null) {
      if (!Array.isArray(v.vocabulary)) return false;
      var vlist = sanitizeVocabulary(v.vocabulary);
      if (vlist.length !== v.vocabulary.length) return false;
    }
    var kps = asArray(v.knowledgePoints);
    if (!kps.length || kps.length > MAX_KP) return false;
    var ids = Object.create(null);
    var i;
    for (i = 0; i < kps.length; i++) {
      var kp = kps[i];
      if (!kp || typeof kp !== 'object') return false;
      var id = str(kp.id).trim();
      if (!id || ids[id]) return false;
      ids[id] = 1;
      var label = stripHtml(kp.label || '');
      if (!label || labelLen(label) > 16) return false;
      if (tax.indexOf(normLabel(kp.category)) < 0) return false;
      if (!isInt(kp.difficulty) || kp.difficulty < 1 || kp.difficulty > 5) return false;
    }
    var cards = asArray(v.cards);
    if (!cards.length || cards.length > MAX_CARDS_TOTAL) return false;
    var seen = Object.create(null);
    var cardIds = Object.create(null);
    for (i = 0; i < cards.length; i++) {
      var card = cards[i];
      if (!card || typeof card !== 'object') return false;
      // card.id 係確認頁 checkbox 嘅 key：缺 id／重複 id 都會令選擇互相蓋過。
      var cardId = str(card.id).trim();
      if (!cardId || cardIds[cardId]) return false;
      cardIds[cardId] = 1;
      if (!ids[str(card.kpId).trim()]) return false;
      var front = stripHtml(card.front || '');
      var back = stripHtml(card.back || '');
      if (!front || !back) return false;
      if (labelLen(front) > 60 || labelLen(back) > 120) return false;
      var type = str(card.type).trim();
      if (CARD_TYPES.indexOf(type) < 0) return false;
      if (type === 'cloze' && !/\{\{[^{}]*\}\}/.test(front)) return false;
      // P10：cloze back 係佔位符字面值 ⇒ 呢張卡唔合格
      if (type === 'cloze' && isPlaceholderAnswer(back)) return false;
      // P4 B：context 只做 optional 驗 —— 冇＝OK；有就要係非空、已去 HTML、≤200 字。
      if (card.context !== undefined && card.context !== null) {
        if (typeof card.context !== 'string') return false;
        var cctx = stripHtml(card.context);
        if (!cctx || labelLen(cctx) > CONTEXT_MAX) return false;
      }
      var dk = str(card.kpId) + '\u0000' + front.toLowerCase();
      if (seen[dk]) return false;
      seen[dk] = 1;
    }
    return true;
  }

  function cacheEntryOk(e) {
    if (!e || typeof e !== 'object') return false;
    if (!/^[0-9a-f]{64}$/.test(str(e.key))) return false;
    var at = Number(e.at);
    if (!isFinite(at) || at <= 0) return false;
    return cacheValueOk(e.value);
  }

  /**
   * 讀快取。回 {status: 'hit'|'miss'|'expired'|'corrupt', value, text}。
   * text 係「應該寫返 storage」嘅字串（命中會 touch 去最新、過期會刪走、壞資料會清乾淨）。
   * TTL 24 小時；預設上限 20 條。
   */
  function cacheGet(raw, hash, now, opts) {
    var o = opts || {};
    var ttl = typeof o.ttl === 'number' ? o.ttl : CACHE_TTL;
    var t = Number(now) || Date.now();
    var key = str(hash).trim().toLowerCase();
    var src = str(raw);
    var res = { status: 'miss', value: null, text: src };
    if (!key) return res;
    var doc = null;
    try { doc = JSON.parse(src); } catch (e) { doc = null; }
    if (!doc || typeof doc !== 'object' || doc.schema !== 1 || !Array.isArray(doc.entries)) {
      res.status = 'corrupt';
      res.text = JSON.stringify(cacheEmpty());
      return res;
    }
    var keep = [];
    var hit = null;
    var bad = false;
    doc.entries.forEach(function (e) {
      if (!cacheEntryOk(e)) { bad = true; return; }
      if (e.key === key) hit = e;
      else keep.push(e);
    });
    if (!hit) {
      if (bad) {
        res.status = 'corrupt';
        res.text = JSON.stringify({ schema: 1, entries: keep });
      }
      return res;
    }
    if (t - Number(hit.at) > ttl) {
      res.status = 'expired';
      res.text = JSON.stringify({ schema: 1, entries: keep });
      return res;
    }
    keep.push(hit); // LRU：命中即移到最新
    res.status = 'hit';
    res.value = hit.value;
    res.text = JSON.stringify({ schema: 1, entries: keep });
    return res;
  }

  /** 寫快取：驗證唔過（或 key 唔係 sha256）就原樣回傳，唔會寫入。 */
  function cachePut(raw, hash, value, now, opts) {
    var o = opts || {};
    var max = typeof o.max === 'number' ? o.max : CACHE_MAX;
    var t = Number(now) || Date.now();
    var key = str(hash).trim().toLowerCase();
    var src = str(raw);
    if (!/^[0-9a-f]{64}$/.test(key) || !cacheValueOk(value)) return src;
    var doc = null;
    try { doc = JSON.parse(src); } catch (e) { doc = null; }
    if (!doc || typeof doc !== 'object' || doc.schema !== 1 || !Array.isArray(doc.entries)) doc = cacheEmpty();
    var entries = doc.entries.filter(function (e) { return cacheEntryOk(e) && e.key !== key; });
    entries.push({ key: key, at: t, value: value });
    while (entries.length > max) entries.shift(); // 最舊（最耐冇用）先走
    return JSON.stringify({ schema: 1, entries: entries });
  }

  // ── P1.1：理解頁編輯（純函數；app.js 同 node test 共用）──
  // 設計 §S4：主題／年級可改；知識點可改名／改分類（限 taxonomy）／改難度／刪除／新增。
  // 全部「唔改輸入」：回新陣列，app.js 自己 assign，方便單元測試。

  function cloneObj(o) {
    var copy = {};
    if (o && typeof o === 'object') {
      for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) copy[k] = o[k];
    }
    return copy;
  }

  function cloneList(list) { return asArray(list).map(cloneObj); }

  function analysisTaxonomy(a) {
    return asArray(a && a.classification && a.classification.taxonomy);
  }

  /** 知識點名：去 HTML、≤16 字（設計 §S4）。 */
  function sanitizeKpLabel(raw) { return truncate(stripHtml(raw), KP_LABEL_MAX).text; }

  /** 主題標題：去 HTML、≤60 字（設計 §S4）。 */
  function sanitizeTopicTitle(raw) { return truncate(stripHtml(raw), TOPIC_TITLE_MAX).text; }

  /** 難度：整數 1–5；空／非數 → fallback，再夾範圍。 */
  function kpDifficulty(raw, fallback) {
    var n = Math.round(Number(raw));
    if (!isFinite(n) || n === 0) n = Math.round(Number(fallback));
    if (!isFinite(n) || n === 0) n = 1;
    return clamp(n, 1, 5);
  }

  /**
   * 改一個知識點：label（≤16，去 HTML）、category（必須喺 taxonomy）、difficulty（1–5）。
   * 分類改咗，該 KP 嘅卡嘅 category 一齊跟。回 {ok, errors, knowledgePoints, cards, kp}。
   */
  function updateKp(a, id, patch) {
    var p = patch || {};
    var kps = cloneList(a && a.knowledgePoints);
    var cards = cloneList(a && a.cards);
    var tax = analysisTaxonomy(a);
    var kp = null;
    kps.forEach(function (x) { if (x.id === id) kp = x; });
    if (!kp) return { ok: false, errors: ['kp_not_found'], knowledgePoints: kps, cards: cards };
    var label = sanitizeKpLabel(p.label);
    if (!label) return { ok: false, errors: ['no_kp_label'], knowledgePoints: kps, cards: cards };
    var cat = str(p.category).trim();
    if (tax.indexOf(cat) < 0) return { ok: false, errors: ['bad_kp_category'], knowledgePoints: kps, cards: cards }; // 改分類只限 taxonomy
    kp.label = label;
    kp.category = cat;
    kp.difficulty = kpDifficulty(p.difficulty, kp.difficulty);
    cards.forEach(function (c) { if (c.kpId === id) c.category = cat; });
    return { ok: true, errors: [], knowledgePoints: kps, cards: cards, kp: kp };
  }

  /** 刪知識點：佢嘅卡一齊走（唔會留孤兒卡）。 */
  function deleteKp(a, id) {
    var kps = cloneList(a && a.knowledgePoints).filter(function (x) { return x.id !== id; });
    var allCards = cloneList(a && a.cards);
    var cards = allCards.filter(function (c) { return c.kpId !== id; }); // 連卡一齊刪
    return {
      ok: true,
      errors: [],
      knowledgePoints: kps,
      cards: cards,
      removedCards: allCards.length - cards.length,
    };
  }

  /**
   * 新增知識點：label／category（限 taxonomy）／difficulty 照驗；id 由注入嘅 makeId 產生
   * （app 傳 store.uid('kp')，測試可以傳固定值），撞 id 就加後綴，唔會覆蓋舊知識點。
   */
  function addKp(a, patch, makeId) {
    var p = patch || {};
    var kps = cloneList(a && a.knowledgePoints);
    var cards = cloneList(a && a.cards);
    var tax = analysisTaxonomy(a);
    var label = sanitizeKpLabel(p.label);
    if (!label) return { ok: false, errors: ['no_kp_label'], knowledgePoints: kps, cards: cards };
    var cat = str(p.category).trim();
    if (tax.indexOf(cat) < 0) return { ok: false, errors: ['bad_kp_category'], knowledgePoints: kps, cards: cards };
    var id = str(typeof makeId === 'function' ? makeId() : makeId).trim();
    if (!id) return { ok: false, errors: ['bad_kp_id'], knowledgePoints: kps, cards: cards };
    var unique = id;
    var n = 2;
    while (kps.some(function (x) { return x.id === unique; })) {
      unique = id + '_' + n;
      n += 1;
    }
    var kp = {
      id: unique,
      label: label,
      category: cat,
      difficulty: kpDifficulty(p.difficulty, 2),
      detail: truncate(stripHtml(p.detail || ''), 120).text,
    };
    kps.push(kp);
    return { ok: true, errors: [], knowledgePoints: kps, cards: cards, kp: kp };
  }

  function systemPrompt() {
    return [
      '你係香港教材助理。下面係一張課本相 OCR 出嘅文字（可能附一張縮圖）。',
      '先判斷「教緊咩、咩程度」，再出卡。',
      '',
      '一、分類（全部由你判斷）',
      '1. stage：kindergarten / primary / secondary / university。',
      '2. grade：K1–K3、P1–P6、S1–S6、U1–U4；用香港學制。內容跨級就揀最接近嘅一級。',
      '3. subject：chinese / english / maths / science / general / humanities / other，同時俾中文 subjectLabel。',
      '4. category（topic.category）：2–10 字嘅「科目＋範疇」，例如 中文閱讀理解、英文閱讀理解、英文文法、數學乘法、常識科學。同一類內容要用同一個名，唔好自創新同義詞（唔好一時「英文文法」一時「英文語法」）；寧願粗都唔好長過 10 字。',
      '5. difficulty（1–5 星）：1=課本直接寫出、認得就答到；2=要記一個定義；3=要理解因果／過程；4=要比較／應用；5=跨概念綜合／易錯陷阱。呢個係「內容難度」，唔係小朋友能力。',
      '6. confidence：你對 stage/grade 嘅把握（0–1）。唔肯定就低分，唔好扮肯定。',
      '7. taxonomy：自己設計 3–6 個知識分類（每類 2–6 字），要覆蓋所有知識點；唔好用「其他」除非真係無辦法分類。',
      '',
      '二、理解',
      '8. 一句話講出呢一頁教緊咩（≤40 字）。',
      '9. 抽 4–8 個知識點（多頁嘅話最多 12 個）：名稱（≤8 字）、分類（必須喺 taxonomy 入面）、難度星、一句解釋（≤40 字）。',
      '10. 一個知識點只講一件事；唔好把成段課文當一個知識點。',
      '',
      '三、出卡（盡量多：一般 8–20 張；內容豐富就出更多，硬上限 40 張）',
      '11. 一張卡只考一個概念；正面係問題（≤25 字），背面係答案（≤40 字）。',
      '12. 卡嘅 difficulty 預設跟知識點；明顯更深／更淺可以自己改。',
      '13. 卡類型由你揀（basic / cloze / compare / trap）。cloze 卡正面必須含 {{answer}} 佔位符。',
      '14. 唔好照抄課文長句；要改寫成「問—答」。避免是非題。',
      '15. 可以加一句口訣（mnemonic，≤20 字）同一個例子。',
      '16. 每個知識點至少 1 張卡；內容夠嘅知識點可以出 2–3 張（由定義／應用／易錯／比較等唔同角度問），但唔好用同一個問法重複；冇卡嘅知識點要刪走。',
      '17. 如果張卡要靠原文上文下理先答得到（例如閱讀理解問「作者點解咁講」），可以為佢加 context：原文相關段落節錄（≤200 字，照原文抄，唔好改寫、唔好連答案一齊抄）。其他卡冇需要就唔好加 context。',
      '',
      '四、誠實',
      '18. 只根據提供嘅文字／圖片內容；唔好加內容以外嘅知識。',
      '19. OCR 認唔清、有亂碼或者明顯缺字嘅位，標 uncertain:true，唔好猜。',
      '20. 工作紙相片：出「解題所需知識」卡，唔好直接把答案抄成卡。',
      '21. 如果內容唔係課本／筆記（例如自拍、食物），回 {"error":"not_study_material"}。',
      '22. 如果文字殘缺到唔能夠理解，回 {"error":"low_legibility"}。',
      '',
      '五、原文（source）',
      '23. 同時回一個 source：由 OCR 原文整理出「同呢批卡片相關」嘅課文——刪走工作紙標題／指示（例如「日期 成績」「學習重點」「思維策略」「閱讀下面的文字，然後回答問題」）、頁碼／分數／姓名欄、重複頁眉頁腳；保留故事／文章正文、詞語解釋、課後問題同選項。照原文抄，唔好改寫、唔好簡化、唔好加內容；用空行分段；冇嘢好刪就原樣回傳。',
      '',
      '六、詞語生字（vocabulary）',
      '24. 課文有值得學嘅中文詞語或英文生字就抽 0–20 個：word（原字，≤30 字）；meaning（**中文書面解釋**，≤100 字，唔好寫英文）；example（**應用範例**：課文原句或自己寫嘅例句，≤120 字；英文生字用英文例句，可以之後補中文對照）。冇值得學嘅就回 []。唔好抽人名、地名或者太淺嘅字。',
      '',
      '只輸出 JSON（物件），唔要 markdown、唔要解釋。',
      'JSON 形狀：{"source":"整理後原文","classification":{"stage","grade","gradeLabel","subject","subjectLabel","difficulty","confidence"},"topic":{"title","summary","category"},"taxonomy":["…"],"knowledgePoints":[{"id","label","category","difficulty","detail"}],"cards":[{"type","kpId","category","difficulty","front","back","mnemonic","example","context","uncertain"}],"vocabulary":[{"word","meaning","example"}]}',
    ].join('\n');
  }

  /**
   * P12.2：整份教材「理解」用 prompt —— 只定分類、主題、分類法同**完整知識點清單**，
   * 唔出卡（出卡交返逐批 card pass）。知識點數量由內容決定，唔關頁數／批次事。
   */
  function understandPrompt() {
    return [
      '你係香港教材助理。下面係**一整份**功課／課本嘅 OCR 文字（幾頁，按頁序排列，每頁開頭有「第 N 頁」）。',
      '你要由整份內容判斷「教緊咩、咩程度」，並整理出一份**完整**嘅知識點清單；唔使出卡。',
      '',
      '一、分類（全部由你判斷）',
      '1. stage：kindergarten / primary / secondary / university。',
      '2. grade：K1–K3、P1–P6、S1–S6、U1–U4；用香港學制。內容跨級就揀最接近嘅一級。',
      '3. subject：chinese / english / maths / science / general / humanities / other，同時俾中文 subjectLabel。',
      '4. category（topic.category）：2–10 字嘅「科目＋範疇」，例如 中文閱讀理解、英文文法、數學乘法。同一類內容要用同一個名，唔好自創同義詞；寧願粗都唔好長過 10 字。',
      '5. difficulty（1–5 星）：1=課本直接寫出、認得就答到；2=要記一個定義；3=要理解因果／過程；4=要比較／應用；5=跨概念綜合／易錯陷阱。',
      '6. confidence：你對 stage/grade 嘅把握（0–1）。唔肯定就低分，唔好扮肯定。',
      '7. taxonomy：自己設計 3–6 個知識分類（每類 2–6 字），要覆蓋所有知識點；唔好用「其他」除非真係無辦法分類。',
      '',
      '二、理解（整份教材一次過）',
      '8. 一句話講出整份教材教緊咩（≤40 字）。',
      '9. 知識點：由**內容本身**決定數量——每頁有幾個重點就抽幾個，跨頁同一個概念只計一個；一般 4–12 個，內容多可以 16–24 個，最多 24 個。',
      '10. 唔可以因為「分咗幾多張相、幾多批」而增減知識點；亦唔好漏咗任何一頁嘅重點。',
      '11. 每個知識點：名稱（≤8 字）、分類（必須喺 taxonomy 入面）、難度星、一句解釋（≤40 字）。',
      '12. 一個知識點只講一件事；唔好把成段課文當一個知識點。',
      '',
      '三、原文（source）',
      '13. 同時回一個 source：由 OCR 原文整理出同上述知識點相關嘅課文——刪走工作紙標題／指示（例如「日期 成績」「學習重點」「思維策略」「閱讀下面的文字，然後回答問題」）、頁碼／分數／姓名欄、重複頁眉頁腳；保留故事／文章正文、詞語解釋、課後問題同選項，**所有頁都要保留**。照原文抄，唔好改寫、唔好簡化、唔好加內容；用空行分段；冇嘢好刪就原樣回傳。',
      '',
      '四、詞語生字（vocabulary）',
      '14. 由**整份教材**抽值得學嘅中文詞語或英文生字 0–20 個：word（原字，≤30 字）；meaning（**中文書面解釋**，≤100 字，唔好寫英文）；example（**應用範例**：課文原句或自己寫嘅例句，≤120 字；英文生字用英文例句）。跨頁重複只計一次；冇值得學嘅就回 []。唔好抽人名、地名或者太淺嘅字。',
      '',
      '只輸出 JSON（物件），唔要 markdown、唔要解釋。',
      'JSON 形狀：{"source":"整理後原文","classification":{"stage","grade","gradeLabel","subject","subjectLabel","difficulty","confidence"},"topic":{"title","summary","category"},"taxonomy":["…"],"knowledgePoints":[{"id","label","category","difficulty","detail"}],"vocabulary":[{"word","meaning","example"}]}',
    ].join('\n');
  }

  function understandContent(ocrText, opts) {
    var o = opts || {};
    var parts = ['以下係整份教材嘅 OCR 文字（按頁序）：\n\n' + str(ocrText)];
    if (o.retry) {
      parts.push('', '重要：上一次回覆唔係有效 JSON。今次只准輸出一個完整 JSON 物件，唔要 markdown、唔要解釋、唔要前後任何文字。');
    }
    return parts.join('\n');
  }

  function userContent(ocrText, opts) {
    var o = opts || {};
    // P12：分批提示 —— 只處理呢批嘅文字、重用已有知識點 id、每批有卡數預算。
    var head = [];
    var b = o.batch;
    if (b && Number(b.n) > 1) {
      head.push('呢份功課分咗 ' + Number(b.n) + ' 批分析，呢一批係第 ' + Number(b.i) + ' 批（第 ' + Number(b.from) + '–' + Number(b.to) + ' 張相）。只根據下面呢批文字出卡，唔好出其他批次嘅內容。');
    }
    if (o.knownKps && o.knownKps.length) {
      head.push('已經有嘅知識點（id／label）：' + JSON.stringify(o.knownKps));
      head.push('如果本批內容屬於上面任何一個知識點，請直接重用同一個 kpId（唔好另開新 id）；真係新嘅知識點才用新 id。');
    }
    if (isInt(o.maxCards) && o.maxCards > 0) {
      head.push('本批最多出 ' + o.maxCards + ' 張卡。');
    }
    var parts;
    if (o.regen) {
      parts = head.concat([
        '已確認嘅理解如下，請只回 cards（唔要 classification / topic / knowledgePoints）：',
        JSON.stringify({ classification: o.classification, topic: o.topic, taxonomy: o.taxonomy, knowledgePoints: o.knowledgePoints }),
        '',
        'OCR 文字（只作參考）：',
        str(ocrText).slice(0, isInt(o.textMax) ? o.textMax : 4000),
      ]);
    } else {
      parts = head.concat(['以下係 OCR 文字：\n\n' + str(ocrText)]);
    }
    if (o.retry) {
      parts.push('', '重要：上一次回覆唔係有效 JSON。今次只准輸出一個完整 JSON 物件，唔要 markdown、唔要解釋、唔要前後任何文字。');
    }
    return parts.join('\n');
  }

  /** 對話模型請求 body：model=deepseek-flash、temperature 0.2。
   * 關掉 thinking（`thinking:{type:'disabled'}`）：呢個任務係結構化抽取，thinking 版會先寫一長段
   * CoT，真機實測 4096 token 用晒喺 reasoning（finish=length、content 空）→ 直接出唔到 JSON。
   * 真機 2026-11-17 診斷：finish=length、reasoning=7747 字、content 0 字。
   */
  function buildChatBody(ocrText, opts) {
    var o = opts || {};
    // P12.2：understand:true = 整份教材「只定理解／知識點」；其餘（含 regen）= 只出卡。
    return {
      model: MODEL,
      temperature: 0.2,
      max_tokens: 8192,
      thinking: { type: 'disabled' },
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: o.understand ? understandPrompt() : systemPrompt() },
        { role: 'user', content: o.understand ? understandContent(ocrText, o) : userContent(ocrText, o) },
      ],
    };
  }

  /** 錯誤分類（設計 §7.6）：回 i18n key 後綴。 */
  function errorCode(status, err) {
    if (err && err.name === 'AbortError') return 'timeout';
    if (!status) return 'network';
    if (status === 401 || status === 403) return 'auth';
    if (status === 402) return 'balance';
    if (status === 408) return 'upload';
    if (status === 413) return 'too_large';
    if (status === 429) return 'rate';
    if (status >= 500) return 'server';
    if (status === 400 || status === 422) return 'bad_request';
    return 'unknown';
  }

  // ── 瀏覽器專用：相片壓縮（canvas 重繪，EXIF 唔會帶過去）──

  function loadBitmap(blob) {
    if (typeof createImageBitmap === 'function') return createImageBitmap(blob);
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(blob);
      var img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('image_decode')); };
      img.src = url;
    });
  }

  function canvasToBlob(canvas, quality) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (b) {
        if (b) resolve(b); else reject(new Error('encode_failed'));
      }, 'image/jpeg', quality);
    });
  }

  /**
   * 長邊 2048、JPEG 0.9、≤4MB。超過 4MB 先降 quality，再降長邊。
   * 回 {blob, width, height, bytes, quality, maxEdge}。
   */
  function compressImage(input, opts) {
    var o = opts || {};
    var maxEdge = o.maxEdge || MAX_EDGE;
    var quality = o.quality || JPEG_QUALITY;
    var maxBytes = o.maxBytes || MAX_BYTES;
    return loadBitmap(input).then(function (bmp) {
      var w0 = bmp.width || bmp.naturalWidth;
      var h0 = bmp.height || bmp.naturalHeight;
      var scale = Math.min(1, maxEdge / Math.max(w0, h0));
      var w = Math.max(1, Math.round(w0 * scale));
      var h = Math.max(1, Math.round(h0 * scale));
      var canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(bmp, 0, 0, w, h);
      if (bmp.close) { try { bmp.close(); } catch (e) {} }
      return canvasToBlob(canvas, quality).then(function (blob) {
        if (blob.size <= maxBytes) {
          return { blob: blob, width: w, height: h, bytes: blob.size, quality: quality, maxEdge: maxEdge };
        }
        // 逐級降質素，仍然超就縮長邊
        var attempts = [0.8, 0.7, 0.6];
        var chain = Promise.resolve(null);
        attempts.forEach(function (q) {
          chain = chain.then(function (found) {
            if (found) return found;
            return canvasToBlob(canvas, q).then(function (b2) {
              return b2.size <= maxBytes ? { blob: b2, width: w, height: h, bytes: b2.size, quality: q, maxEdge: maxEdge } : null;
            });
          });
        });
        return chain.then(function (found) {
          if (found) return found;
          return compressImage(input, {
            maxEdge: Math.max(800, Math.round(Math.max(w, h) * 0.75)),
            quality: 0.8,
            maxBytes: maxBytes,
          });
        });
      });
    });
  }

  /** 對話模型預覽圖：長邊 ≤1300（設計 §7.0 決定 14）。 */
  function makePreview(blob, maxEdge) {
    return compressImage(blob, { maxEdge: maxEdge || PREVIEW_EDGE, quality: 0.8, maxBytes: 900 * 1024 });
  }

  /**
   * 大圖 OCR 被截斷（finish_reason=length）時，將相片沿長邊切成兩半：
   * 橫向（跨頁）→ 左右切；直向 → 上下切。回 [{blob,width,height}, …]。
   */
  function splitInHalf(blob) {
    return loadBitmap(blob).then(function (bmp) {
      var w = bmp.width || bmp.naturalWidth;
      var h = bmp.height || bmp.naturalHeight;
      var horizontal = w >= h;
      var halfW = horizontal ? Math.ceil(w / 2) : w;
      var halfH = horizontal ? h : Math.ceil(h / 2);
      var rects = horizontal
        ? [[0, 0, halfW, h], [halfW, 0, w - halfW, h]]
        : [[0, 0, w, halfH], [0, halfH, w, h - halfH]];
      var jobs = rects.map(function (r) {
        var canvas = document.createElement('canvas');
        canvas.width = r[2];
        canvas.height = r[3];
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, r[2], r[3]);
        ctx.drawImage(bmp, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]);
        return canvasToBlob(canvas, JPEG_QUALITY).then(function (b) {
          return { blob: b, width: r[2], height: r[3] };
        });
      });
      if (bmp.close) { try { bmp.close(); } catch (e) {} }
      return Promise.all(jobs);
    });
  }

  /**
   * 本機 preflight（設計 §7.3）：太細／矇／反光。唔會上傳、唔會 block，
   * 只回 issues 等 UI 提示家長重影。全部喺 canvas 做。
   */
  function preflight(blob, opts) {
    var o = opts || {};
    var minEdge = o.minEdge || 1200;
    var blurThreshold = typeof o.blurThreshold === 'number' ? o.blurThreshold : 120;
    var glareRatio = typeof o.glareRatio === 'number' ? o.glareRatio : 0.03;
    var glareLum = typeof o.glareLum === 'number' ? o.glareLum : 245;
    return loadBitmap(blob).then(function (bmp) {
      var w0 = bmp.width || bmp.naturalWidth;
      var h0 = bmp.height || bmp.naturalHeight;
      var issues = [];
      if (Math.max(w0, h0) < minEdge) issues.push('too_small');
      var cw = 256;
      var ch = Math.max(16, Math.round((h0 / w0) * cw));
      var canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(bmp, 0, 0, cw, ch);
      if (bmp.close) { try { bmp.close(); } catch (e) {} }
      var data = ctx.getImageData(0, 0, cw, ch).data;
      var gray = new Float32Array(cw * ch);
      var bright = 0;
      for (var i = 0, p = 0; i < data.length; i += 4, p++) {
        var lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        gray[p] = lum;
        if (lum > glareLum) bright += 1;
      }
      var sum = 0;
      var sum2 = 0;
      var n = 0;
      for (var y = 1; y < ch - 1; y++) {
        for (var x = 1; x < cw - 1; x++) {
          var idx = y * cw + x;
          var lap = -4 * gray[idx] + gray[idx - 1] + gray[idx + 1] + gray[idx - cw] + gray[idx + cw];
          sum += lap;
          sum2 += lap * lap;
          n += 1;
        }
      }
      var mean = n ? sum / n : 0;
      var variance = n ? sum2 / n - mean * mean : 0;
      if (n && variance < blurThreshold) issues.push('blurry');
      if (bright / (cw * ch) > glareRatio) issues.push('glare');
      return {
        ok: issues.length === 0,
        issues: issues,
        variance: Math.round(variance),
        brightRatio: Math.round((bright / (cw * ch)) * 1000) / 10,
        width: w0,
        height: h0,
      };
    });
  }

  var api = {
    MODEL: MODEL,
    OCR_URL: OCR_URL,
    CHAT_URL: CHAT_URL,
    MAX_EDGE: MAX_EDGE,
    MAX_BYTES: MAX_BYTES,
    JPEG_QUALITY: JPEG_QUALITY,
    PREVIEW_EDGE: PREVIEW_EDGE,
    STAGES: STAGES,
    SUBJECTS: SUBJECTS,
    CARD_TYPES: CARD_TYPES,
    SYNONYMS: SYNONYMS,
    OTHER: OTHER,
    GRADE_LABELS: GRADE_LABELS,
    CACHE_TTL: CACHE_TTL,
    CACHE_MAX: CACHE_MAX,
    MAX_PHOTOS: MAX_PHOTOS,
    PHOTO_BATCH: PHOTO_BATCH,
    MAX_KP: MAX_KP,
    MAX_BATCHES: MAX_BATCHES,
    MAX_CARDS_TOTAL: MAX_CARDS_TOTAL,
    planBatches: planBatches,
    mergeCardSets: mergeCardSets,
    TOPIC_TITLE_MAX: TOPIC_TITLE_MAX,
    KP_LABEL_MAX: KP_LABEL_MAX,
    CATEGORY_MAX: CATEGORY_MAX,
    CATEGORY_MIN: CATEGORY_MIN,
    SOURCE_MAX: SOURCE_MAX,
    CONTEXT_MAX: CONTEXT_MAX,
    SOURCE_PARA_CHARS: SOURCE_PARA_CHARS,
    SOURCE_PARA_SENTENCES: SOURCE_PARA_SENTENCES,
    SOURCE_CLEAN_MIN_RATIO: SOURCE_CLEAN_MIN_RATIO,
    buildSourceCleanBody: buildSourceCleanBody,
    validateSourceClean: validateSourceClean,
    sanitizeSource: sanitizeSource,
    sourceOk: sourceOk,
    formatSourceText: formatSourceText,
    stageForGrade: stageForGrade,
    gradesForStage: gradesForStage,
    isValidPair: isValidPair,
    gradeLabelOf: gradeLabelOf,
    sanitizeCategory: sanitizeCategory,
    categoryOf: categoryOf,
    deckCategory: deckCategory,
    groupDecks: groupDecks,
    sha256Hex: sha256Hex,
    photoCountCheck: photoCountCheck,
    joinBytes: joinBytes,
    photoSetHash: photoSetHash,
    cacheEmpty: cacheEmpty,
    cacheValueOk: cacheValueOk,
    cacheGet: cacheGet,
    cachePut: cachePut,
    sanitizeKpLabel: sanitizeKpLabel,
    sanitizeTopicTitle: sanitizeTopicTitle,
    kpDifficulty: kpDifficulty,
    updateKp: updateKp,
    deleteKp: deleteKp,
    addKp: addKp,
    stripHtml: stripHtml,
    isPlaceholderAnswer: isPlaceholderAnswer,
    MAX_CARDS: MAX_CARDS,
    VOCAB_MAX: VOCAB_MAX,
    VOCAB_WORD_MAX: VOCAB_WORD_MAX,
    VOCAB_MEANING_MAX: VOCAB_MEANING_MAX,
    VOCAB_EXAMPLE_MAX: VOCAB_EXAMPLE_MAX,
    sanitizeVocabulary: sanitizeVocabulary,
    truncate: truncate,
    toHalfWidth: toHalfWidth,
    normLabel: normLabel,
    normalizeTaxonomy: normalizeTaxonomy,
    parseJsonLoose: parseJsonLoose,
    balancedJson: balancedJson,
    messageText: messageText,
    validateResult: validateResult,
    systemPrompt: systemPrompt,
    buildChatBody: buildChatBody,
    errorCode: errorCode,
    compressImage: compressImage,
    makePreview: makePreview,
    splitInHalf: splitInHalf,
    preflight: preflight,
  };

  global.CardLabAi = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
