/*
 * 閱讀理解試用版（2026-10-18）
 *
 * 目的：俾家長試「題目深淺＋解釋夠唔夠」，唔係完整產品。
 * 設計取態：
 *   - 純靜態、零網絡（冇 fetch、冇 CDN、冇字型）。
 *   - 答案即時對，但**唔止講正確答案**：四個選項逐個解釋（why）。
 *   - 進度只存 localStorage；冇帳號、冇上傳。
 */
(function () {
  'use strict';

  var PASSAGES = window.READING_PASSAGES || [];
  var STORE_KEY = 'reading/answers';
  var LANG_KEY = 'reading/lang';
  var LANGS = ['yue', 'zh', 'en'];

  var DICT = {
    'app.title': ['閱讀理解', '閱讀理解', 'Reading Lab'],
    'app.trial': ['試用版 · {n} 篇', '試用版 · {n} 篇', 'Trial · {n} passages'],
    'app.sub': [
      '英文閱讀 · 每篇 5 題 · 每個選項都有解釋',
      '英文閱讀 · 每篇 5 題 · 每個選項都有解釋',
      'English reading · 5 questions each · every option explained',
    ],
    'app.all': ['全部', '全部', 'All'],
    'app.chooseGrade': ['揀年級', '選年級', 'Choose a level'],
    'app.empty': [
      '呢個年級暫時未有樣本。',
      '這個年級暫時未有樣本。',
      'No sample for this level yet.',
    ],
    'app.summary': [
      '已完成 {done}／{total} 篇 · 答對 {right}／{answered} 題',
      '已完成 {done}／{total} 篇 · 答對 {right}／{answered} 題',
      '{done} of {total} passages done · {right} of {answered} correct',
    ],
    'app.weakTitle': ['弱項題型', '弱項題型', 'Weakest question types'],
    'app.weakLine': ['{type}：{right}／{total}', '{type}：{right}／{total}', '{type}: {right}/{total}'],
    'app.wrongTitle': ['錯題重練', '錯題重練', 'Practise missed questions'],
    'app.wrongDesc': [
      '有 {n} 題答錯過。重做答對，就會由清單清走。',
      '有 {n} 題答錯過。重做答對，就會由清單清走。',
      '{n} questions you missed. Answer them correctly to clear them.',
    ],
    'app.wrongStart': ['開始重練', '開始重練', 'Start practice'],
    'app.reviewBadge': ['錯題重練', '錯題重練', 'Missed questions'],
    'app.reviewOf': [
      '第 {i}／{n} 題 · 來自《{title}》',
      '第 {i}／{n} 題 · 來自《{title}》',
      'Question {i} of {n} · from "{title}"',
    ],
    'app.showPassage': ['睇返文章', '看回文章', 'Show the passage'],
    'app.reviewCorrect': [
      '答對，呢題會由錯題清單移除。',
      '答對，這題會由錯題清單移除。',
      'Correct — this question is cleared from your list.',
    ],
    'app.reviewSummary': [
      '已排期 {fixed} 題，仲有 {left} 題到期。',
      '已排期 {fixed} 題，還有 {left} 題到期。',
      'Scheduled {fixed}, {left} still due.',
    ],
    'app.reviewAllClear': [
      '所有錯題都清走咗！',
      '所有錯題都清走咗！',
      'All missed questions cleared!',
    ],
    'app.reviewAgain': ['再重練', '再重練', 'Practise again'],
    'app.noWeak': ['未夠數據睇弱項', '未夠數據看弱項', 'Not enough data yet'],
    'app.allGood': ['暫時未見弱項', '暫時未見弱項', 'No weak areas yet'],
    'app.breakdown': ['本篇題型表現', '本篇題型表現', 'By question type'],
    'app.foot': [
      '首次載入後可離線使用 · 毋須帳號 · 冇追蹤',
      '首次載入後可離線使用 · 毋須帳號 · 沒有追蹤',
      'Works offline after first visit · no account · no tracking',
    ],
    'app.scheduled': ['{n} 題已排期重溫', '{n} 題已排期重溫', '{n} questions scheduled for later'],
    'app.reviewScheduled': [
      '所有到期錯題都清走咗！{n} 題已排期之後重溫。',
      '所有到期錯題都清走咗！{n} 題已排期之後重溫。',
      'All due questions cleared! {n} scheduled for later review.',
    ],
    'app.lede': [
      '揀一篇，答 5 題。每題答完會逐個選項解釋——包括你揀錯嗰個。',
      '選一篇，答 5 題。每題答完會逐個選項解釋——包括你選錯的那個。',
      'Pick a passage and answer 5 questions. Every option is explained — including the one you chose.',
    ],
    'app.note': [
      '呢個係試用版：想知你覺得深淺啱唔啱、解釋夠唔夠清楚。',
      '這是試用版：想知道你覺得難度是否合適、解釋是否夠清楚。',
      'This is a trial: we want to know if the level and explanations work for you.',
    ],
    'app.level': ['年級', '年級', 'Level'],
    'app.words': ['字', '字', 'words'],
    'app.start': ['開始', '開始', 'Start'],
    'app.resume': ['繼續', '繼續', 'Resume'],
    'app.review': ['重看', '重看', 'Review'],
    'app.back': ['返回', '返回', 'Back'],
    'app.next': ['下一題', '下一題', 'Next'],
    'app.finish': ['睇結果', '看結果', 'See result'],
    'app.question': ['第 {n} 題／共 {total} 題', '第 {n} 題／共 {total} 題', 'Question {n} of {total}'],
    'app.correct': ['答對！', '答對！', 'Correct!'],
    'app.wrong': ['答錯。正確答案：{letter}', '答錯。正確答案：{letter}', 'Not quite. The answer is {letter}.'],
    'app.why': ['點解？', '為什麼？', 'Why?'],
    'app.yourPick': ['你揀咗', '你選了', 'Your choice'],
    'app.allOptions': ['四個選項解釋', '四個選項解釋', 'All four options explained'],
    'app.score': ['{score} / {total}', '{score} / {total}', '{score} / {total}'],
    'app.done': ['已完成', '已完成', 'Done'],
    'app.reset': ['重新開始', '重新開始', 'Start over'],
    'app.resultTitle': ['結果', '結果', 'Result'],
    'app.resultLede': [
      '睇吓邊題錯，再返去讀一次篇文章。',
      '看看哪題錯，再回去讀一次文章。',
      'See which ones you missed, then read the passage again.',
    ],
    'app.answered': ['已答 {n}／{total}', '已答 {n}／{total}', '{n} of {total} answered'],
    'app.pickFirst': ['先揀一個答案。', '先選一個答案。', 'Choose an answer first.'],
    'kind.story': ['故事', '故事', 'Story'],
    'kind.report': ['說明文', '說明文', 'Report'],
    'kind.notice': ['告示', '告示', 'Notice'],
    'kind.letter': ['書信', '書信', 'Letter'],
    'type.main': ['主旨', '主旨', 'Main idea'],
    'type.detail': ['細節', '細節', 'Detail'],
    'type.inference': ['推論', '推論', 'Inference'],
    'type.vocab': ['詞義', '詞義', 'Vocabulary'],
    'type.cause': ['因果', '因果', 'Cause'],
    'type.scan': ['找資料', '找資料', 'Scanning'],
    'type.sequence': ['次序', '次序', 'Sequence'],
  };

  var lang = 'zh';
  try {
    var saved = localStorage.getItem(LANG_KEY);
    if (saved && LANGS.indexOf(saved) >= 0) lang = saved;
  } catch (e) {}

  function t(key, vars) {
    var row = DICT[key] || [key, key, key];
    var i = lang === 'yue' ? 0 : lang === 'zh' ? 1 : 2;
    var out = row[i] || row[1] || key;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        out = out.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
      });
    }
    return out;
  }

  function loadAnswers() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveAnswers(all) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(all));
    } catch (e) {}
  }

  var answers = loadAnswers();
  var GRADE_KEY = 'reading/grade';
  var SRS_KEY = 'reading/srs';
  var GRADES = ['all', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6'];
  var DAY = 24 * 60 * 60 * 1000;
  /* 間隔重複：答對一次之後，隔 1／3／7／14／30 日再出。 */
  var INTERVALS = [1, 3, 7, 14, 30];
  var grade = 'all';
  try {
    var g = localStorage.getItem(GRADE_KEY);
    if (g && GRADES.indexOf(g) >= 0) grade = g;
  } catch (e) {}
  var state = { view: 'home', passageId: null, qIndex: 0, picked: null };

  /* srs[key] = { due: timestamp, step: 0.. }；due 過期就會入重練清單。 */
  var srs = {};
  try {
    var rawSrs = localStorage.getItem(SRS_KEY);
    if (rawSrs) srs = JSON.parse(rawSrs) || {};
  } catch (e) {
    srs = {};
  }

  function saveSrs() {
    try {
      localStorage.setItem(SRS_KEY, JSON.stringify(srs));
    } catch (e) {}
  }

  function qkey(p, i) {
    return p.id + ':' + i;
  }

  function scheduleWrong(p, i) {
    srs[qkey(p, i)] = { due: Date.now(), step: 0 };
    saveSrs();
  }

  function scheduleCorrect(p, i) {
    var key = qkey(p, i);
    var step = ((srs[key] && srs[key].step) || 0) + 1;
    var days = INTERVALS[Math.min(step - 1, INTERVALS.length - 1)];
    srs[key] = { due: Date.now() + days * DAY, step: step };
    saveSrs();
  }

  /* 舊資料遷移：答錯過但未有 srs 記錄 → 即刻到期。 */
  (function migrate() {
    var changed = false;
    PASSAGES.forEach(function (p) {
      var given = answers[p.id] || {};
      p.questions.forEach(function (q, i) {
        if (typeof given[i] !== 'number') return;
        if (given[i] === q.answer) return;
        if (srs[qkey(p, i)]) return;
        srs[qkey(p, i)] = { due: 0, step: 0 };
        changed = true;
      });
    });
    if (changed) saveSrs();
  })();

  var root = document.getElementById('app');

  function levelNum(p) {
    return parseInt(String(p.level).replace(/[^0-9]/g, ''), 10) || 99;
  }

  function difficultyOf(p) {
    return typeof p.difficulty === 'number' && p.difficulty >= 1 && p.difficulty <= 3
      ? p.difficulty
      : 2;
  }

  /* 年級由細到大；同級再按難度（★→★★★）；同級同難度保留原本次序（穩定 sort）。 */
  function sortedPassages() {
    return PASSAGES.slice().sort(function (a, b) {
      return levelNum(a) - levelNum(b) || difficultyOf(a) - difficultyOf(b);
    });
  }

  function stars(p) {
    return '★'.repeat(difficultyOf(p));
  }

  function filteredPassages() {
    if (grade === 'all') return sortedPassages();
    return sortedPassages().filter(function (p) {
      return p.level === grade;
    });
  }

  /* 到期錯題 = srs 記錄 due <= now。完全由 localStorage 推導，冇額外上傳。 */
  function dueList(now) {
    var t = now || Date.now();
    var out = [];
    filteredPassages().forEach(function (p) {
      p.questions.forEach(function (q, i) {
        var rec = srs[qkey(p, i)];
        if (!rec) return;
        if (rec.due > t) return;
        out.push({ p: p, i: i, q: q });
      });
    });
    return out;
  }

  /* 已排期（未到期）嘅數目，用嚟話俾用戶知「唔係消失，係遲啲再溫」。 */
  function scheduledCount(now) {
    var t = now || Date.now();
    var n = 0;
    Object.keys(srs).forEach(function (k) {
      if (srs[k] && srs[k].due > t) n++;
    });
    return n;
  }

  /* 每個題型嘅答對率（只計答過嘅題）。 */
  function typeStats() {
    var by = {};
    var order = [];
    filteredPassages().forEach(function (p) {
      var given = answers[p.id] || {};
      p.questions.forEach(function (q, i) {
        if (typeof given[i] !== 'number') return;
        if (!by[q.type]) {
          by[q.type] = { right: 0, total: 0 };
          order.push(q.type);
        }
        by[q.type].total++;
        if (given[i] === q.answer) by[q.type].right++;
      });
    });
    return order
      .map(function (ty) {
        return { type: ty, right: by[ty].right, total: by[ty].total };
      })
      .filter(function (s) {
        return s.total > 0;
      })
      .sort(function (a, b) {
        return a.right / a.total - b.right / b.total;
      });
  }

  function overall() {
    var done = 0;
    var right = 0;
    var answered = 0;
    PASSAGES.forEach(function (p) {
      var given = answers[p.id] || {};
      var n = 0;
      p.questions.forEach(function (q, i) {
        if (typeof given[i] !== 'number') return;
        n++;
        answered++;
        if (given[i] === q.answer) right++;
      });
      if (n === p.questions.length) done++;
    });
    return { done: done, right: right, answered: answered, total: PASSAGES.length };
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function applyLang() {
    document.documentElement.lang = lang === 'en' ? 'en' : lang === 'yue' ? 'zh-HK' : 'zh-Hant-HK';
    var btns = document.querySelectorAll('[data-lang-btn]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-pressed', btns[i].getAttribute('data-lang-btn') === lang ? 'true' : 'false');
    }
    var title = document.getElementById('page-title');
    if (title) {
      title.replaceChildren();
      title.appendChild(document.createTextNode(t('app.title') + ' '));
      var pill = document.createElement('span');
      pill.className = 'pill';
      pill.textContent = t('app.trial', { n: PASSAGES.length });
      title.appendChild(pill);
    }
    var sub = document.getElementById('page-sub');
    if (sub) sub.textContent = t('app.sub');
    var foot = document.getElementById('page-foot');
    if (foot) foot.textContent = t('app.foot');
    document.title = t('app.title') + ' · 試用版';
    render();
  }

  function scoreOf(p) {
    var given = answers[p.id] || {};
    var n = 0;
    p.questions.forEach(function (q, i) {
      if (given[i] === q.answer) n++;
    });
    return n;
  }

  function answeredCount(p) {
    var given = answers[p.id] || {};
    return Object.keys(given).length;
  }

  /* ---------------- 首頁 ---------------- */

  function renderHome() {
    var wrap = el('section', 'home');
    var lede = el('p', 'lede', t('app.lede'));
    wrap.appendChild(lede);

    var note = el('p', 'trial-note', t('app.note'));
    wrap.appendChild(note);

    /* 年級選擇：同數練一樣，先揀年級再揀篇章。 */
    var gradeRow = el('div', 'grade-row');
    gradeRow.setAttribute('role', 'group');
    gradeRow.setAttribute('aria-label', t('app.chooseGrade'));
    GRADES.forEach(function (g) {
      var all = g === 'all';
      var list = all
        ? PASSAGES
        : PASSAGES.filter(function (p) {
            return p.level === g;
          });
      var b = el('button', 'grade-btn' + (grade === g ? ' is-on' : ''), all ? t('app.all') : g);
      b.type = 'button';
      b.setAttribute('data-grade', g);
      b.setAttribute('aria-pressed', grade === g ? 'true' : 'false');
      if (!all && list.length === 0) b.classList.add('is-empty');
      b.title = all ? '' : list.length + ' 篇';
      b.addEventListener('click', function () {
        grade = g;
        try {
          localStorage.setItem(GRADE_KEY, grade);
        } catch (e) {}
        render();
      });
      gradeRow.appendChild(b);
    });
    wrap.appendChild(gradeRow);

    /* 進度摘要 + 錯題重練 + 弱項（2026-10-18 加）：答過先顯示，唔會一開波就滿屏數字。 */
    var ov = overall();
    if (ov.answered > 0) {
      wrap.appendChild(el('p', 'summary', t('app.summary', ov)));
    }

    var sched = scheduledCount();
    if (sched > 0) {
      wrap.appendChild(el('p', 'scheduled', t('app.scheduled', { n: sched })));
    }

    var wrongs = dueList();
    if (wrongs.length > 0) {
      var wc = el('div', 'wrong-card');
      wc.setAttribute('data-wrong-count', String(wrongs.length));
      var wt = el('div', 'wrong-text');
      wt.appendChild(el('h3', null, t('app.wrongTitle') + '（' + wrongs.length + '）'));
      wt.appendChild(el('p', 'meta', t('app.wrongDesc', { n: wrongs.length })));
      wc.appendChild(wt);
      var wbtn = el('button', 'btn primary', t('app.wrongStart'));
      wbtn.type = 'button';
      wbtn.setAttribute('data-wrong-start', '');
      wbtn.addEventListener('click', startReview);
      wc.appendChild(wbtn);
      wrap.appendChild(wc);
    }

    var stats = typeStats();
    if (ov.answered > 0) {
      var weak = el('div', 'weak');
      weak.appendChild(el('h3', null, t('app.weakTitle')));
      var weakOnly = stats.filter(function (s) {
        return s.right < s.total;
      });
      if (weakOnly.length) {
        var wl = el('ul', 'weak-list');
        weakOnly.slice(0, 3).forEach(function (s) {
          var li = el('li', null, t('app.weakLine', { type: t('type.' + s.type), right: s.right, total: s.total }));
          wl.appendChild(li);
        });
        weak.appendChild(wl);
      } else {
        weak.appendChild(el('p', 'meta', t('app.allGood')));
      }
      wrap.appendChild(weak);
    }

    var shown = filteredPassages();
    if (shown.length === 0) {
      wrap.appendChild(el('p', 'empty', t('app.empty')));
      root.replaceChildren(wrap);
      return;
    }

    var list = el('ul', 'passage-list');
    shown.forEach(function (p) {
      var li = el('li', 'passage-card');
      li.setAttribute('data-passage', p.id);
      var head = el('div', 'passage-head');
      var title = el('h2', null, p.title);
      head.appendChild(title);
      var meta = el('p', 'meta');
      meta.textContent =
        t('app.level') + ' ' + p.level + ' · ' + stars(p) + ' · ' + t('kind.' + p.kind) + ' · ' + p.words + ' ' + t('app.words');
      head.appendChild(meta);
      li.appendChild(head);

      var score = scoreOf(p);
      var done = answeredCount(p) === p.questions.length;
      var row = el('div', 'passage-actions');
      var status = el(
        'span',
        'status' + (done ? ' done' : ''),
        done ? t('app.done') + ' · ' + t('app.score', { score: score, total: p.questions.length }) : t('app.answered', { n: answeredCount(p), total: p.questions.length })
      );
      row.appendChild(status);

      var btn = el('button', 'btn primary', answeredCount(p) > 0 && !done ? t('app.resume') : done ? t('app.review') : t('app.start'));
      btn.type = 'button';
      btn.addEventListener('click', function () {
        startPassage(p.id);
      });
      row.appendChild(btn);
      li.appendChild(row);
      list.appendChild(li);
    });
    wrap.appendChild(list);
    root.replaceChildren(wrap);
  }

  /* ---------------- 文章 + 題目 ---------------- */

  function startPassage(id) {
    state.passageId = id;
    state.qIndex = 0;
    state.picked = null;
    state.view = 'read';
    render();
  }

  function passageById(id) {
    for (var i = 0; i < PASSAGES.length; i++) if (PASSAGES[i].id === id) return PASSAGES[i];
    return null;
  }

  function renderPassage() {
    var p = passageById(state.passageId);
    if (!p) return renderHome();
    var given = answers[p.id] || {};
    var q = p.questions[state.qIndex];
    var wrap = el('section', 'reading');

    var top = el('div', 'reading-top');
    var back = el('button', 'btn ghost', '← ' + t('app.back'));
    back.type = 'button';
    back.addEventListener('click', function () {
      state.view = 'home';
      state.picked = null;
      render();
    });
    top.appendChild(back);
    wrap.appendChild(top);

    var head = el('header', 'passage-header');
    head.appendChild(el('h1', null, p.title));
    head.appendChild(
      el('p', 'meta', p.level + ' · ' + stars(p) + ' · ' + t('kind.' + p.kind) + ' · ' + p.words + ' ' + t('app.words'))
    );
    wrap.appendChild(head);

    var body = el('div', 'passage-text');
    body.textContent = p.text;
    wrap.appendChild(body);

    var qbox = el('section', 'question');
    var counter = el('p', 'counter', t('app.question', { n: state.qIndex + 1, total: p.questions.length }));
    qbox.appendChild(counter);

    var tag = el('span', 'tag', t('type.' + q.type));
    qbox.appendChild(tag);

    var qtext = el('h2', 'qtext', q.q);
    qbox.appendChild(qtext);

    var area = answerArea(p, q, state.qIndex);
    qbox.appendChild(area.box);
    if (area.answered) {
      qbox.appendChild(
        nextButton(state.qIndex === p.questions.length - 1 ? t('app.finish') : t('app.next'), function () {
          if (state.qIndex === p.questions.length - 1) {
            state.view = 'result';
          } else {
            state.qIndex++;
          }
          render();
        })
      );
    } else {
      qbox.appendChild(el('p', 'hint', t('app.pickFirst')));
    }

    wrap.appendChild(qbox);
    root.replaceChildren(wrap);
  }

  /* 選項＋（答過之後）四個選項解釋。閱讀同錯題重練共用。
     fresh=true（重練）：唔理原本答案，重新答一次；答案只記喺 session，
     唔會改寫原本分數；答對就排期（1／3／7…日後）再出，答錯就即刻到期。 */
  function answerArea(p, q, qIndex, opts) {
    var fresh = !!(opts && opts.fresh);
    var key = qkey(p, qIndex);
    var box = el('div', 'answer-area');
    var letters = ['A', 'B', 'C', 'D'];
    var locked = fresh
      ? typeof state.reviewPicked[key] === 'number'
      : typeof (answers[p.id] || {})[qIndex] === 'number';
    var picked = fresh ? state.reviewPicked[key] : locked ? answers[p.id][qIndex] : null;

    var optsBox = el('div', 'options');
    optsBox.setAttribute('role', 'group');
    optsBox.setAttribute('aria-label', t('app.allOptions'));

    q.options.forEach(function (text, i) {
      var b = el('button', 'option', null);
      b.type = 'button';
      b.appendChild(el('span', 'letter', letters[i]));
      b.appendChild(el('span', 'option-text', text));
      b.setAttribute('aria-pressed', picked === i ? 'true' : 'false');
      if (locked) {
        b.disabled = true;
        if (i === q.answer) b.classList.add('is-correct');
        if (i === picked && picked !== q.answer) b.classList.add('is-wrong');
      }
      b.addEventListener('click', function () {
        if (locked) return;
        if (fresh) {
          state.reviewPicked[key] = i;
          if (i === q.answer) scheduleCorrect(p, qIndex);
          else scheduleWrong(p, qIndex);
          render();
          return;
        }
        answers[p.id] = answers[p.id] || {};
        answers[p.id][qIndex] = i;
        saveAnswers(answers);
        if (i === q.answer) delete srs[key];
        else scheduleWrong(p, qIndex);
        saveSrs();
        render();
      });
      optsBox.appendChild(b);
    });
    box.appendChild(optsBox);

    if (locked) box.appendChild(feedback(q, picked, letters));
    return { box: box, answered: locked, picked: picked };
  }

  function nextButton(label, handler) {
    var nav = el('div', 'nav-row');
    var b = el('button', 'btn primary', label);
    b.type = 'button';
    b.addEventListener('click', handler);
    nav.appendChild(b);
    return nav;
  }

  function feedback(q, picked, letters) {
    var box = el('div', 'feedback');
    var ok = picked === q.answer;
    var head = el('p', 'feedback-head ' + (ok ? 'ok' : 'bad'));
    head.setAttribute('role', 'status');
    head.textContent = ok ? t('app.correct') : t('app.wrong', { letter: letters[q.answer] });
    box.appendChild(head);

    var list = el('ul', 'why-list');
    q.options.forEach(function (text, i) {
      var li = el('li', i === q.answer ? 'why correct' : 'why');
      var top = el('p', 'why-top');
      top.appendChild(el('span', 'letter', letters[i]));
      top.appendChild(el('span', 'why-text', text));
      if (i === picked) {
        var mine = el('span', 'mine', t('app.yourPick'));
        top.appendChild(mine);
      }
      li.appendChild(top);
      li.appendChild(el('p', 'why-body', q.why[i] || ''));
      list.appendChild(li);
    });
    box.appendChild(list);
    return box;
  }

  function renderResult() {
    var p = passageById(state.passageId);
    var score = scoreOf(p);
    var wrap = el('section', 'result');
    var h = el('h1', null, t('app.resultTitle') + ' · ' + p.title);
    wrap.appendChild(h);
    wrap.appendChild(el('p', 'score-big', t('app.score', { score: score, total: p.questions.length })));
    wrap.appendChild(el('p', 'lede', t('app.resultLede')));

    /* 本篇逐個題型嘅答對率：家長一眼睇到「推論」定「詞義」弱。 */
    var byType = {};
    var order = [];
    p.questions.forEach(function (q, i) {
      if (!byType[q.type]) {
        byType[q.type] = { right: 0, total: 0 };
        order.push(q.type);
      }
      byType[q.type].total++;
      if ((answers[p.id] || {})[i] === q.answer) byType[q.type].right++;
    });
    if (order.length > 1) {
      var tb = el('div', 'type-break');
      tb.appendChild(el('h3', null, t('app.breakdown')));
      var tul = el('ul', 'weak-list');
      order.forEach(function (ty) {
        tul.appendChild(
          el('li', null, t('app.weakLine', { type: t('type.' + ty), right: byType[ty].right, total: byType[ty].total }))
        );
      });
      tb.appendChild(tul);
      wrap.appendChild(tb);
    }

    var list = el('ol', 'review-list');
    p.questions.forEach(function (q, i) {
      var picked = (answers[p.id] || {})[i];
      var ok = picked === q.answer;
      var li = el('li', ok ? 'review ok' : 'review bad');
      li.appendChild(el('p', 'review-q', (i + 1) + '. ' + q.q));
      li.appendChild(el('p', 'review-a', ok ? '✓ ' + q.options[q.answer] : '✗ ' + q.options[picked] + ' → ' + q.options[q.answer]));
      li.appendChild(el('p', 'why-body', q.why[picked] || ''));
      list.appendChild(li);
    });
    wrap.appendChild(list);

    var row = el('div', 'nav-row');
    var back = el('button', 'btn primary', t('app.back'));
    back.type = 'button';
    back.addEventListener('click', function () {
      state.view = 'home';
      state.picked = null;
      render();
    });
    row.appendChild(back);
    var reset = el('button', 'btn ghost', t('app.reset'));
    reset.type = 'button';
    reset.addEventListener('click', function () {
      delete answers[p.id];
      saveAnswers(answers);
      state.view = 'read';
      state.qIndex = 0;
      state.picked = null;
      render();
    });
    row.appendChild(reset);
    wrap.appendChild(row);
    root.replaceChildren(wrap);
  }

  /* ---------------- 錯題重練 ---------------- */

  function startReview() {
    var queue = dueList();
    if (!queue.length) return;
    state.reviewQueue = queue;
    state.reviewPos = 0;
    state.reviewFixed = 0;
    state.reviewPicked = {};
    state.view = 'review';
    render();
  }

  function renderReview() {
    var queue = state.reviewQueue || [];
    if (!queue.length) {
      state.view = 'home';
      return renderHome();
    }
    var item = queue[state.reviewPos];
    var p = item.p;
    var q = item.q;
    var idx = item.i;
    var wrap = el('section', 'review-mode');

    var top = el('div', 'reading-top');
    var badge = el('span', 'pill', t('app.reviewBadge'));
    top.appendChild(badge);
    var back = el('button', 'btn ghost', '← ' + t('app.back'));
    back.type = 'button';
    back.addEventListener('click', function () {
      state.view = 'home';
      render();
    });
    top.appendChild(back);
    wrap.appendChild(top);

    var head = el('header', 'passage-header');
    head.appendChild(
      el('p', 'counter', t('app.reviewOf', { i: state.reviewPos + 1, n: queue.length, title: p.title }))
    );
    head.appendChild(el('h1', null, p.title));
    wrap.appendChild(head);

    /* 重練時可以即時睇返篇文章，唔使跳走。 */
    var det = el('details', 'passage-details');
    det.appendChild(el('summary', null, t('app.showPassage')));
    var body = el('div', 'passage-text');
    body.textContent = p.text;
    det.appendChild(body);
    wrap.appendChild(det);

    var qbox = el('section', 'question');
    qbox.appendChild(el('span', 'tag', t('type.' + q.type)));
    qbox.appendChild(el('h2', 'qtext', q.q));
    var area = answerArea(p, q, idx, { fresh: true });
    qbox.appendChild(area.box);
    if (area.answered) {
      qbox.appendChild(
        nextButton(t('app.next'), function () {
          var ok = state.reviewPicked[qkey(p, idx)] === q.answer;
          if (ok) state.reviewFixed = (state.reviewFixed || 0) + 1;
          if (state.reviewPos === queue.length - 1) {
            state.view = 'reviewDone';
          } else {
            state.reviewPos++;
          }
          render();
        })
      );
    } else {
      qbox.appendChild(el('p', 'hint', t('app.pickFirst')));
    }
    wrap.appendChild(qbox);
    root.replaceChildren(wrap);
  }

  function renderReviewDone() {
    var left = dueList().length;
    var later = scheduledCount();
    var wrap = el('section', 'review-done');
    var h = el('h1', null, t('app.reviewBadge'));
    wrap.appendChild(h);
    if (left === 0) {
      wrap.appendChild(
        el('p', 'lede', later > 0 ? t('app.reviewScheduled', { n: later }) : t('app.reviewAllClear'))
      );
    } else {
      wrap.appendChild(el('p', 'lede', t('app.reviewSummary', { fixed: state.reviewFixed || 0, left: left })));
    }
    var row = el('div', 'nav-row');
    var home = el('button', 'btn primary', t('app.back'));
    home.type = 'button';
    home.addEventListener('click', function () {
      state.view = 'home';
      render();
    });
    row.appendChild(home);
    if (left > 0) {
      var again = el('button', 'btn', t('app.reviewAgain'));
      again.type = 'button';
      again.addEventListener('click', startReview);
      row.appendChild(again);
    }
    wrap.appendChild(row);
    root.replaceChildren(wrap);
  }

  function render() {
    if (state.view === 'home') return renderHome();
    if (state.view === 'read') return renderPassage();
    if (state.view === 'review') return renderReview();
    if (state.view === 'reviewDone') return renderReviewDone();
    if (state.view === 'result') return renderResult();
    return renderHome();
  }

  document.querySelectorAll('[data-lang-btn]').forEach(function (b) {
    b.addEventListener('click', function () {
      var next = b.getAttribute('data-lang-btn');
      if (LANGS.indexOf(next) < 0) return;
      lang = next;
      try {
        localStorage.setItem(LANG_KEY, lang);
      } catch (e) {}
      applyLang();
    });
  });

  applyLang();
})();
