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

  var api = {
    PRESETS: PRESETS,
    SIZES: SIZES,
    preset: preset,
    perSheet: perSheet,
    sheetCount: sheetCount,
    chunk: chunk,
    mirrorRow: mirrorRow,
    pageCount: pageCount,
    fitClass: fitClass,
    vocabItems: vocabItems,
    estimate: estimate,
  };
  global.CardLabPrint = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
