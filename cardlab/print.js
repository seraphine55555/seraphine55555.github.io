/* CardLab 列印排版（P20）
 * 只做「張數 → 版面 → 每頁分配 → 雙面鏡像」嘅純計算，方便 node 單元測試；
 * 實際外觀（mm 尺寸、字級、切線）留喺 style.css。
 */
(function (global) {
  'use strict';

  // A4 210×297mm、安全邊 **10mm**（唔少打印機 8mm 都會食邊）→ 可用 190×277mm。
  // 每個版面預留 header／footer 高度後仍然喺安全邊內，印唔晒嘅機會最低。
  var PRESETS = {
    big: { id: 'big', w: 85, h: 52, cols: 2, rows: 5 },   // 170×260mm，每頁 10
    mid: { id: 'mid', w: 63, h: 43, cols: 3, rows: 6 },   // 189×258mm，每頁 18（預設）
    small: { id: 'small', w: 47, h: 38, cols: 4, rows: 7 }, // 188×266mm，每頁 28
  };
  var SIZES = ['big', 'mid', 'small'];

  function preset(id) {
    return PRESETS[id] || PRESETS.mid;
  }

  function perSheet(id) {
    var p = preset(id);
    return p.cols * p.rows;
  }

  function sheetCount(n, id) {
    var total = Math.max(0, Math.floor(Number(n) || 0));
    if (!total) return 0;
    return Math.ceil(total / perSheet(id));
  }

  /** 將卡按每頁容量切開（最後一頁可以唔滿）。 */
  function chunk(cards, id) {
    var per = perSheet(id);
    var list = Array.isArray(cards) ? cards : [];
    var out = [];
    for (var i = 0; i < list.length; i += per) out.push(list.slice(i, i + per));
    return out;
  }

  /**
   * 雙面（長邊翻頁）背面用：每一橫行左右反轉，答案先會印喺同一張卡後面。
   * 空格用 null 補齊，令唔滿嘅一行反轉後仍然貼右（例如 4 張卡、3 欄：
   * 正面 [1,2,3] / [4]，背面 [3,2,1] / [null,null,4]）。
   */
  function mirrorRow(cards, id) {
    var p = preset(id);
    var cols = p.cols;
    var list = Array.isArray(cards) ? cards : [];
    var out = [];
    for (var i = 0; i < list.length; i += cols) {
      var row = list.slice(i, i + cols);
      while (row.length < cols) row.push(null);
      out = out.concat(row.slice().reverse());
    }
    return out;
  }

  /**
   * P24：雙面背面排位。
   *   flip='long'（長邊翻，書本式）→ 逐行左右反轉（答案喺同一張卡背後）；
   *   flip='short'（短邊翻，日曆式）→ 上下反轉：以整頁 rows 為單位，補齊空格再反轉。
   */
  function mirrorSheet(cards, id, flip) {
    var list = Array.isArray(cards) ? cards : [];
    if (flip !== 'short') return mirrorRow(list, id);
    var p = preset(id);
    var total = p.cols * p.rows;
    var grid = [];
    for (var i = 0; i < total; i++) grid.push(i < list.length ? list[i] : null);
    var out = [];
    for (var r = p.rows - 1; r >= 0; r--) out = out.concat(grid.slice(r * p.cols, (r + 1) * p.cols));
    return out;
  }

  function pageCount(n, id, mode) {
    var s = sheetCount(n, id);
    return mode === 'duplex' ? s * 2 : s;
  }

  /** 字太多要縮：'is-long'（略縮）／'is-xlong'（大幅縮）。 */
  function fitClass(text, kind) {
    var str = String(text == null ? '' : text);
    var len = str.length;
    var limit = kind === 'back' ? 60 : 32;
    if (len > limit * 1.6) return 'is-xlong';
    if (len > limit) return 'is-long';
    return '';
  }

  /** P22：詞語生字 → 列印項目（word 做正面，meaning／example 做背面）。 */
  function vocabItems(list) {
    var out = [];
    (Array.isArray(list) ? list : []).forEach(function (v, i) {
      if (!v || typeof v !== 'object') return;
      var word = String(v.word || '').trim();
      if (!word) return;
      out.push({
        id: String(v.id || 'v' + (i + 1)),
        word: word,
        meaning: String(v.meaning || '').trim(),
        example: String(v.example || '').trim(),
        lang: v.lang === 'en' ? 'en' : 'zh',
      });
    });
    return out;
  }

  function estimate(n, id, mode) {
    var p = preset(id);
    return {
      per: p.cols * p.rows,
      sheets: sheetCount(n, id),
      pages: pageCount(n, id, mode),
      cols: p.cols,
      rows: p.rows,
      w: p.w,
      h: p.h,
    };
  }

  // ── P23：組號（組序-卡序）＋對照表（免剪）────────────────────────
  function groupMap(deck) {
    var kps = (deck && deck.knowledgePoints) || [];
    var map = {};
    kps.forEach(function (kp, i) {
      if (!kp || !kp.id) return;
      map[String(kp.id)] = { no: i + 1, label: String(kp.label || '').trim() };
    });
    return map;
  }

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  /**
   * 卡角編號「組序-卡序」（例如 2-03）：組序跟 deck.knowledgePoints 次序，
   * 卡序係該組喺**今次列印**入面嘅次序（所以只印未掌握會由 1 重新排）。
   * 冇 kpId（或 kpId 唔存在）→ 用全份流水號。回傳同 cards 對齊嘅 [{label,g,gi}]。
   */
  function cardLabels(deck, cards) {
    var gm = groupMap(deck);
    var counts = {};
    var seq = 0;
    return (Array.isArray(cards) ? cards : []).map(function (c) {
      seq += 1;
      var g = c && c.kpId ? gm[String(c.kpId)] : null;
      if (!g) return { label: String(seq), g: 0, gi: seq };
      counts[g.no] = (counts[g.no] || 0) + 1;
      return { label: g.no + '-' + pad2(counts[g.no]), g: g.no, gi: counts[g.no] };
    });
  }

  /** 頁首圖例：只列今次有印嘅組，例如 [{no:1,label:'反射',count:3}]。 */
  function legend(deck, cards) {
    var gm = groupMap(deck);
    var got = {};
    (Array.isArray(cards) ? cards : []).forEach(function (c) {
      var g = c && c.kpId ? gm[String(c.kpId)] : null;
      if (g) got[g.no] = (got[g.no] || 0) + 1;
    });
    return Object.keys(got)
      .map(Number)
      .sort(function (a, b) { return a - b; })
      .map(function (no) {
        var label = '';
        (deck.knowledgePoints || []).forEach(function (kp) {
          if (kp && kp.id && gm[String(kp.id)] && gm[String(kp.id)].no === no) label = gm[String(kp.id)].label;
        });
        return { no: no, label: label, count: got[no] };
      });
  }

  // 對照表三欄（號碼／題目／答案）；mm 值要同 style.css 一致。
  // 每行字數刻意估少（qChars 26、aChars 18）：寧願早分頁，都唔好印穿頁。
  var LIST = {
    noW: 11, qW: 105, aW: 74,
    lineMm: 4.5, padMm: 2.8, subMm: 6.5, budgetMm: 249,
    qChars: 26, aChars: 18,
  };

  function textLines(text, perLine) {
    var s = String(text == null ? '' : text);
    if (!s) return 1;
    return s.split('\n').reduce(function (sum, part) {
      return sum + Math.max(1, Math.ceil(part.length / perLine));
    }, 0);
  }

  /** 一行實際高度（mm）＝上下留白 ＋ 較長一邊嘅行數 × 行高。 */
  function rowHeight(front, back) {
    var lines = Math.max(textLines(front, LIST.qChars), textLines(back, LIST.aChars), 1);
    return LIST.padMm + lines * LIST.lineMm;
  }

  /**
   * 將列印項目分批入頁。items: [{front, back, label, g, gLabel}]
   * 回傳 [[{item, sub}], …]；sub 係組標題（同組喺新一頁會再印一次）。
   */
  function listPages(items, opts) {
    var budget = (opts && Number(opts.budgetMm)) || LIST.budgetMm;
    var pages = [];
    var page = [];
    var used = 0;
    var lastG = null;
    (Array.isArray(items) ? items : []).forEach(function (it) {
      if (!it) return;
      var needSub = !!it.g && it.g !== lastG;
      var h = rowHeight(it.front, it.back) + (needSub ? LIST.subMm : 0);
      if (page.length && used + h > budget) {
        pages.push(page);
        page = [];
        used = 0;
        lastG = null;
        needSub = !!it.g;
        h = rowHeight(it.front, it.back) + (needSub ? LIST.subMm : 0);
      }
      page.push({ item: it, sub: needSub ? String(it.gLabel || it.g) : null });
      if (needSub) lastG = it.g;
      used += h;
    });
    if (page.length) pages.push(page);
    return pages;
  }

  function listEstimate(items) {
    var pages = listPages(items);
    var first = pages[0] || [];
    return { pages: pages.length, sheets: pages.length, rows: Array.isArray(items) ? items.length : 0, per: first.length };
  }

  /** 對照表按組排（冇組排最後），同組保留原本次序。 */
  function listOrder(items) {
    var list = Array.isArray(items) ? items.slice() : [];
    return list
      .map(function (it, i) { return { it: it, i: i }; })
      .sort(function (a, b) {
        var ga = a.it && a.it.g ? a.it.g : 999;
        var gb = b.it && b.it.g ? b.it.g : 999;
        return ga === gb ? a.i - b.i : ga - gb;
      })
      .map(function (x) { return x.it; });
  }

  // ── P24：練習紙（填空＋簡答）────────────────────────
  // 每頁 190×277mm；預算 250mm 留 header／姓名行／footer 空間。
  // 行高同 style.css 嘅 --ws-fs 對應；字數刻意估少（寧願早分頁）。
  var WS = {
    padMm: 2.2, lineMm: 5.2, gapMm: 2.6, headMm: 8, budgetMm: 250,
    shortLineMm: 8, shortGapMm: 6.5, qChars: 38,
  };

  /** cloze front（含 {{answer}}）→ {answer, before, after}；唔係 cloze 回 null。 */
  function clozeParts(front) {
    var s = String(front == null ? '' : front);
    var m = s.match(/\{\{\s*([^{}]+?)\s*\}\}/);
    if (!m) return null;
    return {
      answer: String(m[1]).trim(),
      before: s.slice(0, m.index),
      after: s.slice(m.index + m[0].length),
    };
  }

  /**
   * 將 word 喺 text 第一次出現挖空；英文用字邊界＋大小寫不敏感，中文用 substring。
   * 回 {before, after, word}；搵唔到回 null（唔好亂挖，寧願唔出呢題）。
   */
  function blankWord(text, word) {
    var s = String(text == null ? '' : text);
    var w = String(word == null ? '' : word).trim();
    if (!s || !w) return null;
    var idx;
    var len = w.length;
    if (/^[A-Za-z0-9'’-]+$/.test(w)) {
      var esc = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var re = new RegExp('(^|[^A-Za-z0-9])(' + esc + ')(?=$|[^A-Za-z0-9])', 'i');
      var m = s.match(re);
      if (!m) return null;
      idx = m.index + m[1].length;
    } else {
      idx = s.indexOf(w);
      if (idx < 0) return null;
    }
    return { before: s.slice(0, idx), after: s.slice(idx + len), word: s.slice(idx, idx + len) };
  }

  function wsLines(text, perLine) {
    var s = String(text == null ? '' : text);
    if (!s) return 1;
    return s.split('\n').reduce(function (sum, part) {
      return sum + Math.max(1, Math.ceil(part.length / perLine));
    }, 0);
  }

  /** 簡答留幾行手寫位：按答案長度 2–4 行。 */
  function wsShortLines(answer) {
    var len = String(answer == null ? '' : answer).length;
    return Math.min(4, Math.max(2, Math.ceil(len / 22)));
  }

  function wsItemHeight(item, size) {
    var scale = size === 'big' ? 1.12 : 1;
    if (!item) return 0;
    if (item.kind === 'head') return WS.headMm * scale;
    if (item.kind === 'fill') {
      var text = String(item.before || '') + '＿＿＿＿＿＿' + String(item.after || '');
      return (WS.padMm + wsLines(text, WS.qChars) * WS.lineMm + WS.gapMm) * scale;
    }
    var q = wsLines(item.front, WS.qChars);
    var lines = item.lines || 2;
    return (WS.padMm + q * WS.lineMm + 1.5 + lines * WS.shortLineMm + WS.shortGapMm) * scale;
  }

  /**
   * 練習紙分頁：items 可以係 {kind:'head'|'fill'|'short'}。
   * 組標題唔可以孤零零留喺頁尾（連下一個 item 都要放得落先留）。
   */
  function wsPages(items, opts) {
    var size = (opts && opts.size) || 'std';
    var budget = (opts && Number(opts.budgetMm)) || WS.budgetMm;
    var list = Array.isArray(items) ? items : [];
    var pages = [];
    var page = [];
    var used = 0;
    list.forEach(function (it, i) {
      if (!it) return;
      var h = wsItemHeight(it, size);
      if (it.kind === 'head') {
        var next = list[i + 1];
        var nextH = next ? wsItemHeight(next, size) : 0;
        if (page.length && used + h + Math.min(nextH, 24) > budget) {
          pages.push(page);
          page = [];
          used = 0;
        }
      }
      if (page.length && used + h > budget) {
        pages.push(page);
        page = [];
        used = 0;
      }
      page.push(it);
      used += h;
    });
    if (page.length) pages.push(page);
    return pages;
  }

  /** 答案頁：每題一行（答案長都會 wrap），按固定行高分頁。 */
  function wsAnswerPages(items, size) {
    var rows = (Array.isArray(items) ? items : []).filter(function (it) {
      return it && (it.kind === 'fill' || it.kind === 'short');
    });
    var rowMm = size === 'big' ? 8.2 : 7.2;
    var pages = [];
    var page = [];
    var used = 0;
    rows.forEach(function (r) {
      if (page.length && used + rowMm > WS.budgetMm) {
        pages.push(page);
        page = [];
        used = 0;
      }
      page.push(r);
      used += rowMm;
    });
    if (page.length) pages.push(page);
    return { rows: rows, pages: pages };
  }

  function wsEstimate(items, size, withAnswers) {
    var list = Array.isArray(items) ? items : [];
    var n = list.filter(function (it) { return it && it.kind !== 'head'; }).length;
    var pages = wsPages(list, { size: size });
    var ans = withAnswers ? wsAnswerPages(list, size).pages.length : 0;
    return { n: n, pages: pages.length, answers: ans, sheets: pages.length + ans };
  }

  var api = {
    PRESETS: PRESETS,
    SIZES: SIZES,
    preset: preset,
    perSheet: perSheet,
    sheetCount: sheetCount,
    chunk: chunk,
    mirrorRow: mirrorRow,
    mirrorSheet: mirrorSheet,
    pageCount: pageCount,
    fitClass: fitClass,
    vocabItems: vocabItems,
    estimate: estimate,
    // P23
    LIST: LIST,
    groupMap: groupMap,
    cardLabels: cardLabels,
    legend: legend,
    rowHeight: rowHeight,
    listPages: listPages,
    listEstimate: listEstimate,
    listOrder: listOrder,
    // P24
    WS: WS,
    clozeParts: clozeParts,
    blankWord: blankWord,
    wsShortLines: wsShortLines,
    wsItemHeight: wsItemHeight,
    wsPages: wsPages,
    wsAnswerPages: wsAnswerPages,
    wsEstimate: wsEstimate,
  };
  global.CardLabPrint = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
