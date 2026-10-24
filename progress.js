/* 門戶共用進度事件（2026-10-24）
 *
 * 目的：家長總覽唔使識每一個 app 嘅 localStorage 格式。任何 app include 呢支
 * script，做完成一次練習就叫：
 *
 *   HubProgress.log({ app: 'sentence', skill: 'word-order', correct: true, ms: 8000 })
 *
 * 事件寫入同一個 key `hub/events/v1`（上限 2000 條，超過丟最舊），總覽頁只讀
 * 呢個 key。全部本機，唔上傳。
 *
 * 設計取捨：
 *  - 只存最小欄位（app / at / skill / correct / ms），唔存答案、唔存小朋友名。
 *  - 每次 log 都 dispatch `hub-progress`，將來自動更新嘅頁面可以監聽。
 *  - localStorage 爆 quota 或私密模式：log() 回 null，唔 throw，app 照常運作。
 */
(function () {
  'use strict';

  var KEY = 'hub/events/v1';
  var MAX = 2000;

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function write(list) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      return false;
    }
  }

  function log(event) {
    if (!event || !event.app) return null;
    var ev = {
      app: String(event.app),
      at: typeof event.at === 'number' && isFinite(event.at) ? event.at : Date.now(),
      skill: event.skill ? String(event.skill) : '',
      correct: event.correct ? 1 : 0,
      ms: Math.max(0, Number(event.ms) || 0),
    };
    var list = read();
    list.push(ev);
    if (list.length > MAX) list = list.slice(-MAX);
    if (!write(list)) return null;
    try {
      window.dispatchEvent(new CustomEvent('hub-progress', { detail: ev }));
    } catch (e) {
      /* 舊瀏覽器冇 CustomEvent constructor：唔影響寫入 */
    }
    return ev;
  }

  function all() {
    return read();
  }

  function clear() {
    try {
      localStorage.removeItem(KEY);
    } catch (e) {}
  }

  window.HubProgress = { log: log, all: all, clear: clear, KEY: KEY, MAX: MAX };
})();
