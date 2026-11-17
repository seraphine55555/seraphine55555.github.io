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
  var CARD_TYPES = ['basic', 'cloze', 'compare', 'trap'];
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
  function asArray(v) { return Array.isArray(v) ? v : []; }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function isInt(n) { return typeof n === 'number' && isFinite(n) && Math.floor(n) === n; }

  /** 去 HTML ＋壓空白；唔會用 innerHTML，所以連 <script> 都當文字。 */
  function stripHtml(s) {
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
    if (kpRaw.length > 10) errors.push('too_many_kp');
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
    if (!cardRaw.length) errors.push('no_cards');
    if (cardRaw.length > 24) errors.push('too_many_cards');
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
      var key = kpId + '\u0000' + f.text.toLowerCase();
      if (seen[key]) { notes.push('drop_duplicate_card'); return; }
      seen[key] = 1;
      emptyKp[kpId] = false;
      var cd = isInt(card.difficulty) ? clamp(card.difficulty, 1, 5) : clamp(Math.round(Number(card.difficulty) || 2), 1, 5);
      cards.push({
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
      });
    });
    if (orphan) notes.push('orphan_cards:' + orphan);
    if (!cards.length) errors.push('no_cards');
    kps.forEach(function (kp) { if (emptyKp[kp.id]) notes.push('empty_kp:' + kp.id); });

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
    return {
      ok: true,
      errors: [],
      notes: notes,
      value: {
        classification: classification,
        topic: { title: title, summary: summary },
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
    var kps = asArray(v.knowledgePoints);
    if (!kps.length || kps.length > 10) return false;
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
    if (!cards.length || cards.length > 24) return false;
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
      '4. difficulty（1–5 星）：1=課本直接寫出、認得就答到；2=要記一個定義；3=要理解因果／過程；4=要比較／應用；5=跨概念綜合／易錯陷阱。呢個係「內容難度」，唔係小朋友能力。',
      '5. confidence：你對 stage/grade 嘅把握（0–1）。唔肯定就低分，唔好扮肯定。',
      '6. taxonomy：自己設計 3–6 個知識分類（每類 2–6 字），要覆蓋所有知識點；唔好用「其他」除非真係無辦法分類。',
      '',
      '二、理解',
      '7. 一句話講出呢一頁教緊咩（≤40 字）。',
      '8. 抽 4–8 個知識點：名稱（≤8 字）、分類（必須喺 taxonomy 入面）、難度星、一句解釋（≤40 字）。',
      '9. 一個知識點只講一件事；唔好把成段課文當一個知識點。',
      '',
      '三、出卡（總數由你按內容決定，4–12 張）',
      '10. 一張卡只考一個概念；正面係問題（≤25 字），背面係答案（≤40 字）。',
      '11. 卡嘅 difficulty 預設跟知識點；明顯更深／更淺可以自己改。',
      '12. 卡類型由你揀（basic / cloze / compare / trap）。cloze 卡正面必須含 {{answer}} 佔位符。',
      '13. 唔好照抄課文長句；要改寫成「問—答」。避免是非題。',
      '14. 可以加一句口訣（mnemonic，≤20 字）同一個例子。',
      '15. 每個知識點至少 1 張卡；冇卡嘅知識點要刪走。',
      '',
      '四、誠實',
      '16. 只根據提供嘅文字／圖片內容；唔好加內容以外嘅知識。',
      '17. OCR 認唔清、有亂碼或者明顯缺字嘅位，標 uncertain:true，唔好猜。',
      '18. 工作紙相片：出「解題所需知識」卡，唔好直接把答案抄成卡。',
      '19. 如果內容唔係課本／筆記（例如自拍、食物），回 {"error":"not_study_material"}。',
      '20. 如果文字殘缺到唔能夠理解，回 {"error":"low_legibility"}。',
      '',
      '只輸出 JSON（物件），唔要 markdown、唔要解釋。',
      'JSON 形狀：{"classification":{"stage","grade","gradeLabel","subject","subjectLabel","difficulty","confidence"},"topic":{"title","summary"},"taxonomy":["…"],"knowledgePoints":[{"id","label","category","difficulty","detail"}],"cards":[{"type","kpId","category","difficulty","front","back","mnemonic","example","uncertain"}]}',
    ].join('\n');
  }

  function userContent(ocrText, opts) {
    var o = opts || {};
    var parts = ['以下係 OCR 文字：\n\n' + str(ocrText)];
    if (o.regen) {
      parts = [
        '已確認嘅理解如下，請只回 cards（唔要 classification / topic / knowledgePoints）：',
        JSON.stringify({ classification: o.classification, topic: o.topic, taxonomy: o.taxonomy, knowledgePoints: o.knowledgePoints }),
        '',
        'OCR 文字（只作參考）：',
        str(ocrText).slice(0, 4000),
      ];
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
    return {
      model: MODEL,
      temperature: 0.2,
      max_tokens: 8192,
      thinking: { type: 'disabled' },
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt() },
        { role: 'user', content: userContent(ocrText, opts) },
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
    TOPIC_TITLE_MAX: TOPIC_TITLE_MAX,
    KP_LABEL_MAX: KP_LABEL_MAX,
    stageForGrade: stageForGrade,
    gradesForStage: gradesForStage,
    isValidPair: isValidPair,
    gradeLabelOf: gradeLabelOf,
    sha256Hex: sha256Hex,
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
    preflight: preflight,
  };

  global.CardLabAi = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
