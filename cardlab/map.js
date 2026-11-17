/* CardLab map.js — 掌握地圖資料（純函數，唔掂 DOM）
 *
 * 地圖唔另存資料：由 deck.knowledgePoints 按 category 即時砌（設計 §8）。
 * 節點狀態由其卡嘅 SRS 聚合：
 *   全部 step ≥ 3 → gold（熟練）
 *   任何 tries > 0 → blue（學習中）
 *   否則           → gray（新）
 */
(function (global) {
  'use strict';

  var Srs = (typeof require === 'function' && typeof module !== 'undefined')
    ? require('./srs.js')
    : (global.CardLabSrs || null);

  function cardsByKp(deck) {
    var map = Object.create(null);
    var list = (deck && deck.cards) || [];
    list.forEach(function (c) {
      if (!c || !c.kpId) return;
      if (!map[c.kpId]) map[c.kpId] = [];
      map[c.kpId].push(c);
    });
    return map;
  }

  /**
   * 按分類砌地圖欄。每欄：{category, kps:[{id,label,difficulty,state,cards,count,detail}]}
   * 每個知識點只出現一次；預設唔出冇卡嘅節點（設計 §16 第 16 項）。
   */
  function groupByCategory(deck, opts) {
    var o = opts || {};
    var includeEmpty = o.includeEmpty === true;
    var byKp = cardsByKp(deck);
    // SRS 正式來源係 db.srs（由 caller 傳入）；deck.srs 只係單元測試／舊資料備用。
    var srs = o.srs || (deck && deck.srs) || {};
    var taxonomy = (deck && deck.classification && deck.classification.taxonomy) || [];
    var kps = (deck && deck.knowledgePoints) || [];
    var cols = [];
    var seenLables = Object.create(null);

    function colOf(category) {
      var name = category || '其他';
      for (var i = 0; i < cols.length; i++) if (cols[i].category === name) return cols[i];
      var col = { category: name, kps: [] };
      cols.push(col);
      return col;
    }
    // 先按 taxonomy 次序開欄（UI 只顯示有節點嘅欄）
    taxonomy.forEach(function (t) { colOf(t); });

    kps.forEach(function (kp) {
      var cards = byKp[kp.id] || [];
      if (!cards.length && !includeEmpty) return;
      var key = String(kp.label) + '\u0000' + String(kp.category);
      if (seenLables[key]) return;
      seenLables[key] = 1;
      var col = colOf(kp.category);
      col.kps.push({
        id: kp.id,
        label: kp.label,
        detail: kp.detail || '',
        difficulty: Number(kp.difficulty) || 1,
        category: col.category,
        cards: cards.map(function (c) { return c.id; }),
        count: cards.length,
        state: cards.length ? Srs.statusOf(cards, srs) : 'empty',
      });
    });
    return cols.filter(function (col) { return col.kps.length > 0; });
  }

  /** 地圖頂部統計。 */
  function mapStats(cols) {
    var counts = { gold: 0, blue: 0, gray: 0, empty: 0, total: 0, cards: 0 };
    (cols || []).forEach(function (col) {
      col.kps.forEach(function (kp) {
        counts.total += 1;
        counts.cards += kp.count;
        if (counts[kp.state] !== undefined) counts[kp.state] += 1;
      });
    });
    return counts;
  }

  /** 卡組三段數字＋今日到期。 */
  function deckStats(deck, now, srsMap) {
    var cards = (deck && deck.cards) || [];
    var srs = srsMap || (deck && deck.srs) || {};
    var stats = { total: cards.length, newCount: 0, learning: 0, mastered: 0, dueToday: 0 };
    cards.forEach(function (c) {
      var s = Srs.normalize(srs[c.id]);
      if (s.tries === 0) stats.newCount += 1;
      else if (s.step >= Srs.MASTER_STEP) stats.mastered += 1;
      else stats.learning += 1;
      if (Srs.isDue(s, now)) stats.dueToday += 1;
    });
    return stats;
  }

  /** 最難 5 張：先按答錯次數，再按 difficulty。 */
  function hardest(deck, n, srsMap) {
    var cards = ((deck && deck.cards) || []).slice();
    var srs = srsMap || (deck && deck.srs) || {};
    cards.sort(function (a, b) {
      var sa = Srs.normalize(srs[a.id]);
      var sb = Srs.normalize(srs[b.id]);
      var wa = (sa.tries - sa.ok) * 10 + (5 - (Number(a.difficulty) || 1));
      var wb = (sb.tries - sb.ok) * 10 + (5 - (Number(b.difficulty) || 1));
      return wb - wa;
    });
    return cards.slice(0, n || 5);
  }

  /** 大綱模式：同一組資料用縮排列表（無障礙主要路徑）。 */
  function outline(deck, opts) {
    var cols = groupByCategory(deck, opts);
    return cols.map(function (col) {
      return {
        category: col.category,
        kps: col.kps.map(function (kp) {
          return { id: kp.id, label: kp.label, state: kp.state, count: kp.count };
        }),
      };
    });
  }

  /** 手機排版：≤4 分類 = N 欄；5–6 = 3 欄 2 行；>6 需要合併。 */
  function layout(colCount) {
    if (colCount <= 4) return { cols: Math.max(1, colCount), rows: 1, merge: false };
    if (colCount <= 6) return { cols: 3, rows: 2, merge: false };
    return { cols: 4, rows: Math.ceil(colCount / 4), merge: true };
  }

  var api = {
    cardsByKp: cardsByKp,
    groupByCategory: groupByCategory,
    mapStats: mapStats,
    deckStats: deckStats,
    hardest: hardest,
    outline: outline,
    layout: layout,
  };

  global.CardLabMap = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
