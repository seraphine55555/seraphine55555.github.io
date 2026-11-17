/* CardLab parse.js — OCR 回應解析、文字清理、品質閘、貼上解析（P1）
 *
 * OCR 回應形狀有多個可能（pages / data.pages / choices[0].message.content…），
 * 呢支模組一律嘗試抽取，抽唔到就當「冇文字」。
 *
 * box 座標係 0–1000 歸一化（設計 §7.0）：<ref>文字<box>[[x1,y1,x2,y2]]</box></ref>
 * 亦接受 box 喺 ref 後面。ref 同 box 按出現次序配對。
 */
(function (global) {
  'use strict';

  var CJK = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\u3000-\u303F]/;
  var PUNCT = /[\s\u3000-\u303F\uFF00-\uFFEF!-/:-@\[-`{-~]/;
  var REPLACEMENT = /[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F]/;

  function str(v) {
    return typeof v === 'string' ? v : '';
  }

  /** 數字用 Array.from 數（surrogate pair 當一個字）。 */
  function charCount(text) {
    return Array.from(str(text)).length;
  }

  /** 「字」＝非空白字元（設計「一頁 < 80 字」）。 */
  function countChars(text) {
    var arr = Array.from(str(text));
    var n = 0;
    for (var i = 0; i < arr.length; i++) {
      if (!/\s/.test(arr[i])) n += 1;
    }
    return n;
  }

  function isGarbageChar(ch) {
    if (REPLACEMENT.test(ch)) return true;
    if (CJK.test(ch)) return false;
    if (/[A-Za-z0-9]/.test(ch)) return false;
    if (PUNCT.test(ch)) return false;
    return true;
  }

  /** 亂碼比例：非中英數標點／空白嘅字元佔比（設計門檻 >10%）。 */
  function garbageRatio(text) {
    var arr = Array.from(str(text));
    if (!arr.length) return 0;
    var bad = 0;
    for (var i = 0; i < arr.length; i++) {
      if (isGarbageChar(arr[i])) bad += 1;
    }
    return bad / arr.length;
  }

  function normalizeBox(raw) {
    if (!raw || raw.length !== 4) return null;
    var vals = raw.map(function (v) { return Number(v); });
    if (vals.some(function (v) { return !isFinite(v); })) return null;
    var maxVal = Math.max.apply(null, vals.map(Math.abs));
    // 有人回 0–1 浮點：換算成 0–1000
    if (maxVal <= 1.5 && vals.some(function (v) { return v % 1 !== 0; })) {
      vals = vals.map(function (v) { return v * 1000; });
    }
    vals = vals.map(function (v) { return Math.round(Math.max(0, Math.min(1000, v))); });
    if (vals[2] <= vals[0] || vals[3] <= vals[1]) return null;
    return vals;
  }

  /** 由頁面文字抽 <ref> 標籤 + <box> 座標（按次序配對）。 */
  function extractRefs(text) {
    var src = str(text);
    var refs = [];
    var boxes = [];
    var m;
    var refRe = /<ref>([\s\S]*?)<\/ref>/g;
    while ((m = refRe.exec(src))) {
      refs.push(m[1].replace(/<box>[\s\S]*?<\/box>/g, '').replace(/<[^>]+>/g, '').trim());
    }
    var boxRe = /<box>\s*\[\[\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\]\]\s*<\/box>/g;
    while ((m = boxRe.exec(src))) {
      boxes.push([m[1], m[2], m[3], m[4]]);
    }
    var out = [];
    for (var i = 0; i < refs.length; i++) {
      out.push({ label: refs[i], box: boxes[i] ? normalizeBox(boxes[i]) : null });
    }
    return out;
  }

  /** 去掉 ref/box 標記之後嘅純文字。 */
  function plainText(text) {
    return str(text)
      .replace(/<box>[\s\S]*?<\/box>/g, ' ')
      .replace(/<\/?ref>/g, ' ')
      .replace(/<[^>]+>/g, ' ');
  }

  function firstArray() {
    for (var i = 0; i < arguments.length; i++) {
      if (Array.isArray(arguments[i])) return arguments[i];
    }
    return null;
  }

  /** 由 OCR 回應抽 pages：[{index, text, finishReason, refs, boxes}]。 */
  function parseOcrPayload(payload) {
    var p = payload || {};
    var pages = Array.isArray(p) ? p : firstArray(p.pages, p.data && p.data.pages, p.result && p.result.pages, p.output && p.output.pages);
    if (!pages && p.choices && p.choices[0]) {
      var content = p.choices[0].message && p.choices[0].message.content;
      if (typeof content === 'string') pages = [{ text: content, finish_reason: p.choices[0].finish_reason }];
    }
    if (!pages) {
      var single = str(p.text) || str(p.markdown) || str(p.content) || str(p.data && p.data.text);
      if (single) pages = [{ text: single }];
    }
    if (!pages) return [];
    return pages.map(function (page, i) {
      var t = page || {};
      var text = str(t.text) || str(t.markdown) || str(t.content) || str(t.md);
      var refs = Array.isArray(t.refs) ? t.refs.slice() : extractRefs(text);
      var boxes = [];
      refs.forEach(function (ref) {
        if (ref && ref.box) boxes.push(ref.box);
        else if (ref && Array.isArray(ref.bbox)) boxes.push(normalizeBox(ref.bbox));
      });
      return {
        index: typeof t.index === 'number' ? t.index : i,
        text: plainText(text).replace(/\n{3,}/g, '\n\n').trim(),
        finishReason: str(t.finish_reason) || str(t.finishReason) || str(p.finish_reason),
        refs: refs,
        boxes: boxes.filter(Boolean),
      };
    });
  }

  /** 跨頁重複行（頁眉／頁腳）只保留第一次；合併斷行。 */
  function cleanPages(pages) {
    var seen = Object.create(null);
    var counts = Object.create(null);
    (pages || []).forEach(function (pg) {
      var lines = str(pg.text).split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
      lines.forEach(function (l) { counts[l] = (counts[l] || 0) + 1; });
    });
    var repeatMin = (pages || []).length > 1 ? 2 : 99;
    return (pages || []).map(function (pg) {
      var lines = str(pg.text).split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
      var kept = [];
      lines.forEach(function (line) {
        if (counts[line] >= repeatMin && line.length <= 30) return; // 頁眉／頁腳
        if (line.length <= 2 && /^[\d\s\-–—·.]+$/.test(line)) return; // 純頁碼
        kept.push(line);
      });
      var out = '';
      kept.forEach(function (line) {
        if (!out) { out = line; return; }
        var prev = Array.from(out).pop() || '';
        var next = Array.from(line)[0] || '';
        var cjkJoin = CJK.test(prev) && CJK.test(next);
        var latinJoin = /[A-Za-z]-$/.test(out);
        if (latinJoin) out = out.replace(/-$/, '') + line;
        else if (cjkJoin) out += line;
        else out += ' ' + line;
      });
      return { index: pg.index, text: out.trim(), finishReason: pg.finishReason || pg.finish_reason || '', refs: pg.refs, boxes: pg.boxes };
    });
  }

  function cleanText(pages) {
    return cleanPages(pages).map(function (p) { return p.text; }).join('\n\n').trim();
  }

  /**
   * OCR 後品質閘（設計 §7.3）：唔過就唔發對話模型。
   * 回 {ok, code, page, message, fix, stats}。code 用嚟做 i18n key。
   */
  function qualityGate(pages, opts) {
    var o = opts || {};
    var minChars = o.minChars || 80;
    var maxGarbage = typeof o.maxGarbage === 'number' ? o.maxGarbage : 0.1;
    var list = cleanPages(pages);
    var total = 0;
    for (var i = 0; i < list.length; i++) {
      var pg = list[i];
      var n = countChars(pg.text);
      total += n;
      var stats = { page: pg.index, chars: n, garbage: Number(garbageRatio(pg.text).toFixed(3)) };
      if (pg.finishReason === 'length') {
        return { ok: false, code: 'truncated', page: pg.index, stats: stats };
      }
      if (n < minChars) {
        return { ok: false, code: 'too_few_chars', page: pg.index, stats: stats };
      }
      if (garbageRatio(pg.text) > maxGarbage) {
        return { ok: false, code: 'garbage', page: pg.index, stats: stats };
      }
    }
    if (total === 0) return { ok: false, code: 'no_text', page: 0, stats: { chars: 0 } };
    return { ok: true, code: 'ok', stats: { pages: list.length, chars: total } };
  }

  /** 貼上建卡 fallback：每行「正面 | 背面」或「正面<TAB>背面」或「問：… 答：…」。 */
  function parsePastedCards(text) {
    var lines = str(text).split(/\r?\n/);
    var out = [];
    lines.forEach(function (line) {
      var raw = line.trim();
      if (!raw || raw.charAt(0) === '#') return;
      var parts = null;
      if (raw.indexOf('|') >= 0) parts = raw.split('|');
      else if (raw.indexOf('\t') >= 0) parts = raw.split('\t');
      else {
        var m = raw.match(/^(?:問|Q)\s*[：:]\s*(.+?)\s*(?:答|A)\s*[：:]\s*(.+)$/i);
        if (m) parts = [m[1], m[2]];
      }
      if (!parts || parts.length < 2) return;
      var front = parts[0].trim();
      var back = parts.slice(1).join('|').trim();
      if (!front || !back) return;
      out.push({ front: front, back: back });
    });
    return out;
  }

  /** cloze：front 必須含 {{answer}}；回 {sentence, answer} 或 null。 */
  function parseCloze(front) {
    var s = str(front);
    var m = s.match(/\{\{\s*([^{}]+?)\s*\}\}/);
    if (!m) return null;
    return { sentence: s.replace(m[0], '＿＿'), answer: m[1].trim(), raw: s };
  }

  /** 由句子抽詞做填空選項（中文按標點斷詞、英文按空白），最多 n 個。 */
  function sentenceWords(sentence, n) {
    var words = str(sentence)
      .replace(/[＿＿]+/g, ' ')
      .split(/[\s，。、；：？！,.;:?!「」『』（）()〔〕【】《》…—\-]+/)
      .filter(function (w) { return charCount(w) >= 1 && charCount(w) <= 8; });
    var seen = Object.create(null);
    var out = [];
    words.forEach(function (w) {
      if (seen[w]) return;
      seen[w] = 1;
      out.push(w);
    });
    return out.slice(0, n || 3);
  }

  /** 答案正規化（打字批改）：只放寬全形／大小寫／空白／彎引號；中文唔用 NFKC。 */
  function normalizeAnswer(s) {
    var t = str(s);
    t = t.replace(/[\u2018\u2019\u201B\u2032]/g, "'");
    t = t.replace(/[\u201C\u201D\u201F\u2033]/g, '"');
    // 全形英數＋全形空白 → 半形（只針對 ASCII 對應區，避免動到中文標點）
    t = t.replace(/[\uFF01-\uFF5E]/g, function (ch) {
      return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0);
    });
    t = t.replace(/\u3000/g, ' ');
    t = t.replace(/\s+/g, ' ').trim().toLowerCase();
    return t;
  }

  function answersMatch(input, expected) {
    return normalizeAnswer(input) === normalizeAnswer(expected);
  }

  var api = {
    charCount: charCount,
    countChars: countChars,
    garbageRatio: garbageRatio,
    normalizeBox: normalizeBox,
    extractRefs: extractRefs,
    plainText: plainText,
    parseOcrPayload: parseOcrPayload,
    cleanPages: cleanPages,
    cleanText: cleanText,
    qualityGate: qualityGate,
    parsePastedCards: parsePastedCards,
    parseCloze: parseCloze,
    sentenceWords: sentenceWords,
    normalizeAnswer: normalizeAnswer,
    answersMatch: answersMatch,
  };

  global.CardLabParse = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
