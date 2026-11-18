/* CardLab store.js — localStorage schema / migrate / draft / export-import（P1）
 *
 * 主資料：`hub/flashcards/v1`（設計 §6）
 * 續練草稿：`hub/flashcards/draft/v1`（每次答題寫，完成／退出／24h 清）
 * 相片：P1 唔入 localStorage、唔入 IndexedDB（用完即棄）
 */
(function (global) {
  'use strict';

  var KEY = 'hub/flashcards/v1';
  var DRAFT_KEY = 'hub/flashcards/draft/v1';
  // P1.1：24 小時同相分析快取（只存文字分析 JSON，冇相片）
  var AICACHE_KEY = 'hub/flashcards/ai-cache/v1';
  var SCHEMA = 1;
  var DRAFT_TTL = 24 * 60 * 60 * 1000;
  var DEFAULT_GOAL = 10;

  function storage() {
    try {
      if (typeof localStorage !== 'undefined') return localStorage;
    } catch (e) { /* 私密模式 */ }
    return null;
  }

  function readJson(key) {
    var ls = storage();
    if (!ls) return null;
    try {
      var raw = ls.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeJson(key, value) {
    var ls = storage();
    if (!ls) return false;
    try {
      ls.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function blank() {
    return {
      schema: SCHEMA,
      settings: {
        lang: 'zh',
        dailyGoal: DEFAULT_GOAL,
        // P9 朗讀：默認唔自動讀（唔想一出題就出聲），用戶可喺設定開
        autoRead: false,
        ai: {
          mode: 'direct',
          endpoint: 'https://api.deepseek.com',
          model: 'deepseek-flash',
          key: '',
          dailyPhotoCap: 20,
          usedDate: '',
          usedCount: 0,
        },
      },
      decks: [],
      srs: {},
    };
  }

  function normalizeDb(db) {
    var out = blank();
    if (!db || typeof db !== 'object') return out;
    var s = db.settings || {};
    out.settings.lang = ['yue', 'zh', 'en'].indexOf(s.lang) >= 0 ? s.lang : 'zh';
    out.settings.dailyGoal = Math.max(1, Math.min(100, Number(s.dailyGoal) || DEFAULT_GOAL));
    out.settings.autoRead = s.autoRead === true;
    var ai = s.ai || {};
    out.settings.ai = {
      mode: ai.mode === 'proxy' ? 'proxy' : 'direct',
      endpoint: String(ai.endpoint || 'https://api.deepseek.com'),
      model: String(ai.model || 'deepseek-flash'),
      key: String(ai.key || ''),
      dailyPhotoCap: Math.max(1, Math.min(500, Number(ai.dailyPhotoCap) || 20)),
      usedDate: String(ai.usedDate || ''),
      usedCount: Math.max(0, Number(ai.usedCount) || 0),
    };
    out.decks = Array.isArray(db.decks) ? db.decks.filter(function (d) { return d && d.id; }) : [];
    out.srs = db.srs && typeof db.srs === 'object' ? db.srs : {};
    // 舊資料遷移：card.id 以前只在卡組內唯一，但 srs 用 card.id 做全局 key。
    // 重複 id 一律重新發 uid，並丟棄對應嘅舊進度（寧願由頭練，唔好污染另一組）。
    var seenCard = Object.create(null);
    out.decks.forEach(function (d) {
      if (!Array.isArray(d.cards)) d.cards = [];
      d.cards.forEach(function (c) {
        if (!c || !c.id) return;
        if (seenCard[c.id]) {
          var stale = c.id;
          c.id = uid('c');
          delete out.srs[stale];
        }
        seenCard[c.id] = 1;
      });
    });
    return out;
  }

  function load() {
    var db = readJson(KEY);
    return normalizeDb(db);
  }

  function save(db) {
    return writeJson(KEY, normalizeDb(db));
  }

  function uid(prefix) {
    return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function todayStamp(now) {
    var d = new Date(Number(now) || Date.now());
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  /** P4：原文正規化交 ai.js（單一真相）；ai.js 未載入時就當冇 source，唔會爛。 */
  function sanitizeSource(raw) {
    var Ai = global.CardLabAi;
    return Ai && typeof Ai.sanitizeSource === 'function' ? Ai.sanitizeSource(raw) : null;
  }

  /** 由 AI 驗證結果砌卡組（只喺用戶確認之後叫）。 */
  function createDeck(db, analysis, opts) {
    var o = opts || {};
    var cards = (analysis.cards || []).filter(function (c) { return !o.allow || o.allow[c.id] !== false; });
    var deck = {
      id: uid('d'),
      title: analysis.topic && analysis.topic.title ? analysis.topic.title : '未命名卡組',
      lang: 'zh-HK',
      direction: 'fwd',
      createdAt: Date.now(),
      classification: analysis.classification,
      topic: analysis.topic,
      knowledgePoints: analysis.knowledgePoints || [],
      cards: cards.map(function (c) {
        return {
          // 全局唯一：AI 每次只回 c1..cN，直接沿用會令兩個卡組共用 srs 進度。
          id: uid('c'),
          kpId: c.kpId,
          category: c.category,
          difficulty: c.difficulty,
          type: c.type,
          front: c.front,
          back: c.back,
          mnemonic: c.mnemonic || '',
          example: c.example || '',
          // P4 B：optional 原文節錄（≤200 字）；冇就係空字串，練習頁自己判斷
          context: c.context || '',
          uncertain: c.uncertain === true,
          source: 'ai',
        };
      }),
      aiMeta: {
        model: (db.settings.ai && db.settings.ai.model) || 'deepseek-flash',
        at: Date.now(),
        cards: cards.length,
        ocr: analysis.ocr || { pages: 1, chars: 0, quality: 'ok' },
      },
    };
    // P4 A：卡組保留 OCR 原文（純文字、冇相片）。舊 analysis 冇 source → 唔加 key，UI 自己隱藏原文掣。
    var src = sanitizeSource(analysis && analysis.source);
    if (src) deck.source = src;
    // P7：分析 call 同時回嘅「整理後原文」→ 存喺 source.clean（原文 source.text 照留）
    if (src && analysis.source && typeof analysis.source.clean === 'string') {
      var cleanSrc = sanitizeSource({ text: analysis.source.clean });
      if (cleanSrc) deck.source.clean = cleanSrc.text;
    }
    db.decks.unshift(deck);
    save(db);
    return deck;
  }

  function deleteDeck(db, deckId) {
    var deck = null;
    db.decks = db.decks.filter(function (d) {
      if (d.id === deckId) { deck = d; return false; }
      return true;
    });
    if (deck) {
      deck.cards.forEach(function (c) { delete db.srs[c.id]; });
    }
    var draft = readJson(DRAFT_KEY);
    if (draft && draft.deckId === deckId) clearDraft();
    // 私隱（設計 §7.6／§18.9）：刪卡組一併清分析快取（寧願多清，唔留舊分析）。
    clearAiCache();
    save(db);
    return !!deck;
  }

  function getDeck(db, deckId) {
    for (var i = 0; i < db.decks.length; i++) if (db.decks[i].id === deckId) return db.decks[i];
    return null;
  }

  function gradeSrs(db, cardId, remembered, now) {
    var Srs = global.CardLabSrs;
    var next = Srs.review(db.srs[cardId], remembered, now);
    db.srs[cardId] = next;
    save(db);
    return next;
  }

  /** 全部卡組加埋今日到期。 */
  function dueAcrossDecks(db, now) {
    var Srs = global.CardLabSrs;
    var n = 0;
    db.decks.forEach(function (d) {
      (d.cards || []).forEach(function (c) { if (Srs.isDue(db.srs[c.id], now)) n += 1; });
    });
    return n;
  }

  function saveDraft(draft) {
    return writeJson(DRAFT_KEY, draft);
  }

  function loadDraft(now) {
    var d = readJson(DRAFT_KEY);
    if (!d || !Array.isArray(d.entries)) return null;
    var t = Number(now) || Date.now();
    if (!d.savedAt || t - d.savedAt > DRAFT_TTL) { clearDraft(); return null; }
    if (d.index >= d.entries.length) return null;
    return d;
  }

  function clearDraft() {
    var ls = storage();
    if (!ls) return;
    try { ls.removeItem(DRAFT_KEY); } catch (e) {}
  }

  function keyOf(db) {
    return (db.settings.ai && db.settings.ai.key) || '';
  }

  // ── P1.1 快取封裝（純邏輯喺 ai.js，呢度只負責 localStorage）──

  function readAiCache() {
    var ls = storage();
    if (!ls) return '';
    try { return ls.getItem(AICACHE_KEY) || ''; } catch (e) { return ''; }
  }

  function writeAiCache(text) {
    var ls = storage();
    if (!ls) return false;
    try {
      ls.setItem(AICACHE_KEY, String(text));
      return true;
    } catch (e) {
      return false;
    }
  }

  function clearAiCache() {
    var ls = storage();
    if (!ls) return;
    try { ls.removeItem(AICACHE_KEY); } catch (e) {}
  }

  function setKey(db, key) {
    db.settings.ai.key = String(key || '').trim();
    save(db);
  }

  /** 每日相片上限（設計 §7.6：每部機每日 20 張）。 */
  function photoCap(db, now) {
    var ai = db.settings.ai;
    var today = todayStamp(now);
    if (ai.usedDate !== today) {
      ai.usedDate = today;
      ai.usedCount = 0;
      save(db);
    }
    return { used: ai.usedCount, cap: ai.dailyPhotoCap, remaining: Math.max(0, ai.dailyPhotoCap - ai.usedCount) };
  }

  function markPhotoUsed(db, now, count) {
    photoCap(db, now);
    // P2.0：多張相合併一次分析時，每張相各扣 1 次（2 張 = 2）。
    var n = Math.floor(Number(count));
    if (!isFinite(n) || n < 1) n = 1;
    db.settings.ai.usedCount += n;
    save(db);
  }

  function exportJson(db) {
    return JSON.stringify(
      { schema: SCHEMA, exportedAt: Date.now(), decks: db.decks, srs: db.srs, settings: { lang: db.settings.lang, dailyGoal: db.settings.dailyGoal, autoRead: !!db.settings.autoRead } },
      null,
      2
    );
  }

  /** 匯入：只收卡組／進度，唔收 key；壞資料回 {ok:false}。 */
  function importJson(db, text) {
    var data = null;
    try { data = JSON.parse(text); } catch (e) { return { ok: false, code: 'bad_json' }; }
    if (!data || !Array.isArray(data.decks)) return { ok: false, code: 'no_decks' };
    var added = 0;
    var idMap = Object.create(null);
    data.decks.forEach(function (d) {
      if (!d || !d.id || !Array.isArray(d.cards) || !d.cards.length) return;
      var exists = db.decks.some(function (x) { return x.id === d.id; });
      if (exists) d.id = uid('d');
      d.cards.forEach(function (c) {
        if (!c || typeof c !== 'object') return;
        var old = c.id;
        c.id = uid('c');
        if (old) idMap[old] = c.id;
      });
      db.decks.unshift(d);
      added += 1;
    });
    if (data.srs && typeof data.srs === 'object') {
      for (var k in data.srs) {
        if (!Object.prototype.hasOwnProperty.call(data.srs, k)) continue;
        // 匯入嘅進度跟新 card id 走；唔係今次匯入嘅 id 保持原樣
        db.srs[idMap[k] || k] = data.srs[k];
      }
    }
    if (!added) return { ok: false, code: 'no_decks' };
    save(db);
    return { ok: true, added: added };
  }

  var api = {
    KEY: KEY,
    DRAFT_KEY: DRAFT_KEY,
    AICACHE_KEY: AICACHE_KEY,
    SCHEMA: SCHEMA,
    DRAFT_TTL: DRAFT_TTL,
    blank: blank,
    normalizeDb: normalizeDb,
    load: load,
    save: save,
    uid: uid,
    createDeck: createDeck,
    deleteDeck: deleteDeck,
    getDeck: getDeck,
    gradeSrs: gradeSrs,
    dueAcrossDecks: dueAcrossDecks,
    saveDraft: saveDraft,
    loadDraft: loadDraft,
    clearDraft: clearDraft,
    keyOf: keyOf,
    setKey: setKey,
    readAiCache: readAiCache,
    writeAiCache: writeAiCache,
    clearAiCache: clearAiCache,
    photoCap: photoCap,
    markPhotoUsed: markPhotoUsed,
    exportJson: exportJson,
    importJson: importJson,
  };

  global.CardLabStore = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
