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
  var GRADES = ['all', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6'];
  var grade = 'all';
  try {
    var g = localStorage.getItem(GRADE_KEY);
    if (g && GRADES.indexOf(g) >= 0) grade = g;
  } catch (e) {}
  var state = { view: 'home', passageId: null, qIndex: 0, picked: null };

  var root = document.getElementById('app');

  function levelNum(p) {
    return parseInt(String(p.level).replace(/[^0-9]/g, ''), 10) || 99;
  }

  /* 年級由細到大；同年級保留原本次序（題庫作者排位）。 */
  function sortedPassages() {
    return PASSAGES.slice().sort(function (a, b) {
      return levelNum(a) - levelNum(b);
    });
  }

  function filteredPassages() {
    if (grade === 'all') return sortedPassages();
    return sortedPassages().filter(function (p) {
      return p.level === grade;
    });
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
      meta.textContent = t('app.level') + ' ' + p.level + ' · ' + t('kind.' + p.kind) + ' · ' + p.words + ' ' + t('app.words');
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
    head.appendChild(el('p', 'meta', p.level + ' · ' + t('kind.' + p.kind) + ' · ' + p.words + ' ' + t('app.words')));
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

    var letters = ['A', 'B', 'C', 'D'];
    var opts = el('div', 'options');
    opts.setAttribute('role', 'group');
    opts.setAttribute('aria-label', t('app.allOptions'));

    var locked = typeof given[state.qIndex] === 'number';
    var picked = locked ? given[state.qIndex] : state.picked;

    q.options.forEach(function (text, i) {
      var b = el('button', 'option', null);
      b.type = 'button';
      var letter = el('span', 'letter', letters[i]);
      var label = el('span', 'option-text', text);
      b.appendChild(letter);
      b.appendChild(label);
      b.setAttribute('aria-pressed', picked === i ? 'true' : 'false');
      if (locked) {
        b.disabled = true;
        if (i === q.answer) b.classList.add('is-correct');
        if (i === picked && picked !== q.answer) b.classList.add('is-wrong');
      }
      b.addEventListener('click', function () {
        if (typeof (answers[p.id] || {})[state.qIndex] === 'number') return;
        state.picked = i;
        answers[p.id] = answers[p.id] || {};
        answers[p.id][state.qIndex] = i;
        saveAnswers(answers);
        render();
      });
      opts.appendChild(b);
    });
    qbox.appendChild(opts);

    if (typeof picked === 'number') {
      qbox.appendChild(feedback(q, picked, letters));
      var nav = el('div', 'nav-row');
      var next = el(
        'button',
        'btn primary',
        state.qIndex === p.questions.length - 1 ? t('app.finish') : t('app.next')
      );
      next.type = 'button';
      next.addEventListener('click', function () {
        state.picked = null;
        if (state.qIndex === p.questions.length - 1) {
          state.view = 'result';
        } else {
          state.qIndex++;
        }
        render();
      });
      nav.appendChild(next);
      qbox.appendChild(nav);
    } else {
      var hint = el('p', 'hint', t('app.pickFirst'));
      qbox.appendChild(hint);
    }

    wrap.appendChild(qbox);
    root.replaceChildren(wrap);
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

  function render() {
    if (state.view === 'home') return renderHome();
    if (state.view === 'read') return renderPassage();
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
