/* CardLab srs.js — 間隔重練純函數（P1）
 *
 * 規則（設計文件 §10）：
 *   STEPS = [1,3,7,14,30]（日）
 *   記得：step+1（上限 5），下次 = STEPS[step-1] 日後
 *   唔記得：step = 0，10 分鐘後
 *   熟練：step ≥ 3
 *
 * 全部函數唔讀時鐘：`now` 一定由 caller 傳入（測試可以凍結時間）。
 */
(function (global) {
  'use strict';

  var STEPS = [1, 3, 7, 14, 30];
  var RELEARN_MS = 10 * 60 * 1000;
  var DAY_MS = 24 * 60 * 60 * 1000;
  var MASTER_STEP = 3;
  var MAX_STEP = 5;

  function fresh() {
    return { step: 0, tries: 0, ok: 0, due: 0, last: 0 };
  }

  function normalize(state) {
    var s = fresh();
    if (!state || typeof state !== 'object') return s;
    s.step = clampInt(state.step, 0, MAX_STEP);
    s.tries = clampInt(state.tries, 0, 9999);
    s.ok = clampInt(state.ok, 0, 9999);
    s.due = Number(state.due) || 0;
    s.last = Number(state.last) || 0;
    return s;
  }

  function clampInt(v, lo, hi) {
    var n = Math.floor(Number(v) || 0);
    if (n < lo) return lo;
    if (n > hi) return hi;
    return n;
  }

  /** step → 間隔毫秒（step 0 = 未建立間隔，回 0）。 */
  function intervalMs(step) {
    var s = clampInt(step, 0, MAX_STEP);
    if (s <= 0) return 0;
    return STEPS[s - 1] * DAY_MS;
  }

  /** 一次作答：remembered = true/false。回新 state（唔改輸入）。 */
  function review(state, remembered, now) {
    var s = normalize(state);
    var t = Number(now) || 0;
    if (remembered) {
      s.step = Math.min(MAX_STEP, s.step + 1);
      s.ok += 1;
      s.due = t + intervalMs(s.step);
    } else {
      s.step = 0;
      s.due = t + RELEARN_MS;
    }
    s.tries += 1;
    s.last = t;
    return s;
  }

  function isNew(state) {
    var s = normalize(state);
    return s.tries === 0;
  }

  function isMastered(state) {
    return normalize(state).step >= MASTER_STEP;
  }

  function isDue(state, now) {
    var s = normalize(state);
    if (s.tries === 0) return true; // 新卡當到期
    return s.due <= (Number(now) || 0);
  }

  /** 卡片陣列的聚合狀態：gold / blue / gray / empty（設計 §18.1）。 */
  function statusOf(cards, srsMap) {
    var list = cards || [];
    if (!list.length) return 'empty';
    var map = srsMap || {};
    var anyTried = false;
    var allMastered = true;
    for (var i = 0; i < list.length; i++) {
      var s = normalize(map[list[i].id]);
      if (s.tries > 0) anyTried = true;
      if (s.step < MASTER_STEP) allMastered = false;
    }
    if (allMastered) return 'gold';
    if (anyTried) return 'blue';
    return 'gray';
  }

  function dueCount(cards, srsMap, now) {
    var list = cards || [];
    var map = srsMap || {};
    var n = 0;
    for (var i = 0; i < list.length; i++) {
      if (isDue(map[list[i].id], now)) n += 1;
    }
    return n;
  }

  function byDifficulty(a, b) {
    var da = Number(a && a.difficulty) || 0;
    var dbb = Number(b && b.difficulty) || 0;
    if (da !== dbb) return da - dbb;
    return String((a && a.id) || '').localeCompare(String((b && b.id) || ''));
  }

  /**
   * 砌一節練習隊列。
   *   opts.goal   最多幾張（0 = 唔限）
   *   opts.filter 只練某 kpId（可選）
   *   opts.dueOnly 只練到期卡（可選）
   * 排序：到期卡先，其餘新卡在後；兩組內部都由淺入深（difficulty 升序）。
   */
  function buildQueue(cards, srsMap, now, opts) {
    var o = opts || {};
    var map = srsMap || {};
    var list = (cards || []).slice();
    if (o.filter) list = list.filter(function (c) { return c.kpId === o.filter; });
    var due = [];
    var fresh_ = [];
    for (var i = 0; i < list.length; i++) {
      var st = normalize(map[list[i].id]);
      if (st.tries > 0 && st.due <= (Number(now) || 0)) due.push(list[i]);
      else if (st.tries === 0) fresh_.push(list[i]);
    }
    due.sort(function (a, b) {
      var sa = normalize(map[a.id]).due - normalize(map[b.id]).due;
      if (sa !== 0) return sa;
      return byDifficulty(a, b);
    });
    fresh_.sort(byDifficulty);
    var queue = due.concat(fresh_);
    if (!o.dueOnly) {
      // 未到期但又練過嘅卡排最後（自由練習先用得着）
      var rest = list.filter(function (c) {
        var st = normalize(map[c.id]);
        return st.tries > 0 && st.due > (Number(now) || 0);
      }).sort(byDifficulty);
      queue = queue.concat(rest);
    }
    if (o.goal && o.goal > 0) queue = queue.slice(0, o.goal);
    return queue;
  }

  /** 最近 7 日（含今日）每日作答次數，回 [{date:'MM-DD', count}] 由舊到新。 */
  function weekSeries(cards, srsMap, now) {
    var map = srsMap || {};
    var t = Number(now) || 0;
    var day = new Date(t);
    day.setHours(0, 0, 0, 0);
    var series = [];
    for (var i = 6; i >= 0; i--) {
      series.push({ start: day.getTime() - i * DAY_MS, count: 0, date: '' });
    }
    (cards || []).forEach(function (c) {
      var s = normalize(map[c.id]);
      if (!s.last) return;
      for (var i = 0; i < series.length; i++) {
        var start = series[i].start;
        if (s.last >= start && s.last < start + DAY_MS) {
          series[i].count += 1;
          break;
        }
      }
    });
    series.forEach(function (item) {
      var d = new Date(item.start);
      item.date = pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
    });
    return series;
  }

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  var api = {
    STEPS: STEPS,
    RELEARN_MS: RELEARN_MS,
    DAY_MS: DAY_MS,
    MASTER_STEP: MASTER_STEP,
    MAX_STEP: MAX_STEP,
    fresh: fresh,
    normalize: normalize,
    intervalMs: intervalMs,
    review: review,
    isNew: isNew,
    isDue: isDue,
    isMastered: isMastered,
    statusOf: statusOf,
    dueCount: dueCount,
    buildQueue: buildQueue,
    weekSeries: weekSeries,
  };

  global.CardLabSrs = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
