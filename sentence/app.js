/* 句子重組 Sentence Lab（2026-10-24）
 *
 * 純前端、離線、進度只存 localStorage。每題：由詞語庫點選，排成正確句子；
 * 檢查後顯示完整句子＋文法提示（中／英）。冇自動「相似句」判斷——答案唯一。
 */
(function () {
  'use strict';

  var BANK = window.SENTENCE_BANK || [];
  var COMBINE = window.SENTENCE_COMBINE || [];
  var KEY = 'sentence/progress';
  var GKEY = 'sentence/grade';
  var LKEY = 'sentence/lang';
  var MKEY = 'sentence/mode';
  var SKEY = 'sentence/streak';
  var LANGS = ['yue', 'zh', 'en'];
  var GRADES = ['all', 'P3', 'P4', 'P5', 'P6'];

  var DICT = {
    title: ['句子重組', '句子重組', 'Sentence Builder'],
    sub: [
      '點選詞語，排成一句正確嘅英文句子。每句都有文法解釋。',
      '點選詞語，排成一句正確的英文句子。每句都有文法解釋。',
      'Tap the words to build a correct English sentence. Every sentence has a grammar note.',
    ],
    all: ['全部', '全部', 'All'],
    words: ['{n} 個詞', '{n} 個詞', '{n} words'],
    start: ['開始', '開始', 'Start'],
    progress: ['已完成 {done} / {total} 句', '已完成 {done} / {total} 句', 'Completed {done} / {total}'],
    back: ['返回', '返回', 'Back'],
    prompt: ['把詞語排成一句通順的英文句子。', '把詞語排成一句通順的英文句子。', 'Put the words in the right order.'],
    bank: ['詞語', '詞語', 'Word bank'],
    answer: ['你的句子', '你的句子', 'Your sentence'],
    placeholder: ['點下面的詞語開始', '點下面的詞語開始', 'Tap the words below to start'],
    check: ['檢查', '檢查', 'Check'],
    reset: ['重排', '重排', 'Shuffle'],
    undo: ['退一個', '退一個', 'Undo'],
    next: ['下一句', '下一句', 'Next'],
    again: ['再做一次', '再做一次', 'Try again'],
    home: ['返回列表', '返回列表', 'Back to list'],
    correct: ['正確！', '正確！', 'Correct!'],
    wrong: ['未啱，正確句子係：', '未啱，正確句子是：', 'Not quite. The correct sentence is:'],
    hint: ['文法提示', '文法提示', 'Grammar note'],
    translation: ['中文意思', '中文意思', 'Meaning'],
    done: ['全部做完！', '全部做完！', 'All done!'],
    empty: ['呢個年級未有句子。', '這個年級未有句子。', 'No sentences for this level yet.'],
    counter: ['第 {i} / {n} 句', '第 {i} / {n} 句', 'Sentence {i} / {n}'],
    modeScramble: ['重組句子', '重組句子', 'Unscramble'],
    modeCombine: ['合併句子', '合併句子', 'Combine'],
    combineTitle: ['句子合併', '句子合併', 'Sentence combining'],
    combineSub: [
      '睇兩句，揀一個連接詞，再把兩句合併成一句。',
      '看兩句，選一個連接詞，再把兩句合併成一句。',
      'Read two sentences, pick a connector, then build one combined sentence.',
    ],
    kernels: ['两句', '兩句', 'Two sentences'],
    pickConnector: ['揀一個連接詞', '選一個連接詞', 'Pick a connector'],
    connector: ['連接詞', '連接詞', 'Connector'],
    combinePrompt: [
      '把兩句合併成一句通順的英文句子。',
      '把兩句合併成一句通順的英文句子。',
      'Combine the two sentences into one.',
    ],
    twoKernels: ['2 句 · {n} 個詞', '2 句 · {n} 個詞', '2 sentences · {n} words'],
    sentenceCard: ['句子', '句子', 'Sentence'],
    combineCard: ['合併', '合併', 'Combine'],
    streak: ['連續 {n} 日', '連續 {n} 日', '{n}-day streak'],
    mNew: ['新', '新', 'New'],
    mLearning: ['練習中', '練習中', 'Learning'],
    mSolid: ['熟練', '熟練', 'Solid'],
    mShaky: ['重溫', '重溫', 'Review'],
  };

  var lang = 'zh';
  var grade = 'all';
  var mode = 'scramble';
  try {
    var sl = localStorage.getItem(LKEY);
    if (sl && LANGS.indexOf(sl) >= 0) lang = sl;
    var sg = localStorage.getItem(GKEY);
    if (sg && GRADES.indexOf(sg) >= 0) grade = sg;
    var sm = localStorage.getItem(MKEY);
    if (sm === 'combine') mode = 'combine';
    if (mode === 'combine' && grade === 'P3') grade = 'all';
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

  var progress = {};
  try {
    progress = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
  } catch (e) {
    progress = {};
  }

  function saveProgress() {
    try {
      localStorage.setItem(KEY, JSON.stringify(progress));
    } catch (e) {}
  }

  var app = document.getElementById('app');
  var view = 'home';
  var current = null;
  var bank = [];
  var answer = [];
  var checked = false;
  var lastOk = false;
  var startedAt = 0;
  var combine = null;
  var combineStep = 'connector';
  var combineBank = [];
  var combineAnswer = [];
  var combineChecked = false;
  var combineOk = false;
  var combineHint = '';
  var combineStartedAt = 0;
  var streak = { last: '', n: 0 };
  try {
    var ss = JSON.parse(localStorage.getItem(SKEY) || '{}');
    if (ss && typeof ss.n === 'number') streak = { last: ss.last || '', n: ss.n };
  } catch (e) {}

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function filtered() {
    var base = mode === 'combine' ? COMBINE : BANK;
    return base.filter(function (s) {
      return grade === 'all' || s.level === grade;
    });
  }

  function mastery(id) {
    var r = progress[id];
    if (!r || !r.tries) return { key: 'new', pct: 0 };
    var acc = r.correct / r.tries;
    var key = r.tries >= 3 && acc >= 0.8 ? 'solid' : acc >= 0.5 ? 'learning' : 'shaky';
    return { key: key, pct: Math.round(acc * 100) };
  }

  function localDay(ts) {
    var d = new Date(ts == null ? Date.now() : ts);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function bumpStreak() {
    var today = localDay();
    if (streak.last === today) return;
    var y = localDay(Date.now() - 86400000);
    streak.n = streak.last === y ? streak.n + 1 : 1;
    streak.last = today;
    try {
      localStorage.setItem(SKEY, JSON.stringify(streak));
    } catch (e) {}
  }

  function doneCount(list) {
    return list.filter(function (s) {
      return progress[s.id] && progress[s.id].correct > 0;
    }).length;
  }

  function shuffled(n) {
    var idx = [];
    for (var i = 0; i < n; i++) idx.push(i);
    for (var j = idx.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var tmp = idx[j];
      idx[j] = idx[k];
      idx[k] = tmp;
    }
    return idx;
  }

  function startSentence(id) {
    current = BANK.filter(function (s) {
      return s.id === id;
    })[0];
    if (!current) return;
    bank = shuffled(current.tokens.length);
    answer = [];
    checked = false;
    lastOk = false;
    startedAt = Date.now();
    view = 'play';
    render();
  }

  function currentList() {
    return filtered();
  }

  function nextSentence() {
    if (!current) return;
    var list = currentList();
    var at = -1;
    for (var i = 0; i < list.length; i++) if (list[i].id === current.id) at = i;
    if (at < 0 || at + 1 >= list.length) {
      view = 'home';
      current = null;
      render();
      return;
    }
    startSentence(list[at + 1].id);
  }

  function startCombine(id) {
    combine = COMBINE.filter(function (s) {
      return s.id === id;
    })[0];
    if (!combine) return;
    combineStep = 'connector';
    combineBank = [];
    combineAnswer = [];
    combineChecked = false;
    combineOk = false;
    combineHint = '';
    combineStartedAt = Date.now();
    view = 'play';
    render();
  }

  function nextCombine() {
    if (!combine) return;
    var list = currentList();
    var at = -1;
    for (var i = 0; i < list.length; i++) if (list[i].id === combine.id) at = i;
    if (at < 0 || at + 1 >= list.length) {
      view = 'home';
      combine = null;
      render();
      return;
    }
    startCombine(list[at + 1].id);
  }

  function usedSet() {
    var used = {};
    answer.forEach(function (b) {
      used[b] = true;
    });
    return used;
  }

  function render() {
    if (view === 'play' && mode === 'combine') return renderCombinePlay();
    if (view === 'play' && current) return renderPlay();
    return renderHome();
  }

  function renderHome() {
    app.replaceChildren();
    app.appendChild(el('h1', null, mode === 'combine' ? t('combineTitle') : t('title')));
    app.appendChild(el('p', 'sub', mode === 'combine' ? t('combineSub') : t('sub')));

    var modes = el('div', 'modes');
    [
      { key: 'scramble', label: t('modeScramble') },
      { key: 'combine', label: t('modeCombine') },
    ].forEach(function (m) {
      var b = el('button', 'mode-tab' + (mode === m.key ? ' is-on' : ''), m.label);
      b.type = 'button';
      b.setAttribute('data-mode', m.key);
      b.setAttribute('aria-pressed', mode === m.key ? 'true' : 'false');
      b.addEventListener('click', function () {
        if (mode === m.key) return;
        mode = m.key;
        view = 'home';
        current = null;
        combine = null;
        if (mode === 'combine' && grade === 'P3') {
          grade = 'all';
          try {
            localStorage.setItem(GKEY, grade);
          } catch (e) {}
        }
        try {
          localStorage.setItem(MKEY, mode);
        } catch (e) {}
        render();
      });
      modes.appendChild(b);
    });
    app.appendChild(modes);

    if (streak.n > 0) {
      app.appendChild(el('p', 'streak', '🔥 ' + t('streak', { n: streak.n })));
    }

    var row = el('div', 'grades');
    var gradeList = mode === 'combine' ? ['all', 'P4', 'P5', 'P6'] : GRADES;
    gradeList.forEach(function (g) {
      var b = el('button', 'grade-btn' + (grade === g ? ' is-on' : ''), g === 'all' ? t('all') : g);
      b.type = 'button';
      b.setAttribute('data-grade', g);
      b.setAttribute('aria-pressed', grade === g ? 'true' : 'false');
      b.addEventListener('click', function () {
        grade = g;
        try {
          localStorage.setItem(GKEY, g);
        } catch (e) {}
        render();
      });
      row.appendChild(b);
    });
    app.appendChild(row);

    var list = filtered();
    app.appendChild(el('p', 'progress-line', t('progress', { done: doneCount(list), total: list.length })));

    if (!list.length) {
      app.appendChild(el('div', 'empty', t('empty')));
      return;
    }

    var mlabel = { new: 'mNew', learning: 'mLearning', solid: 'mSolid', shaky: 'mShaky' };
    var wrap = el('div', 'list');
    list.forEach(function (s, i) {
      var done = progress[s.id] && progress[s.id].correct > 0;
      var m = mastery(s.id);
      var card = el('article', 'sentence-card' + (done ? ' is-done' : ''));
      card.setAttribute('data-id', s.id);
      var body = el('div', 'card-body');
      body.appendChild(
        el(
          'h2',
          null,
          t(mode === 'combine' ? 'combineCard' : 'sentenceCard') + ' ' + (i + 1) + ' · ' + s.level
        )
      );
      var metaText =
        mode === 'combine' ? t('twoKernels', { n: s.tokens.length }) : t('words', { n: s.tokens.length });
      body.appendChild(el('p', 'meta', metaText + (done ? ' · ✓' : '')));
      body.appendChild(el('span', 'badge badge-' + m.key, t(mlabel[m.key])));
      var bar = el('div', 'mastery-bar');
      bar.setAttribute('role', 'img');
      bar.setAttribute('aria-label', t(mlabel[m.key]) + ' ' + m.pct + '%');
      var fill = el('span', 'mastery-fill');
      fill.style.width = m.pct + '%';
      bar.appendChild(fill);
      body.appendChild(bar);
      card.appendChild(body);
      var btn = el('button', 'btn primary', done ? t('again') : t('start'));
      btn.type = 'button';
      btn.setAttribute('data-start', s.id);
      btn.addEventListener('click', function () {
        if (mode === 'combine') startCombine(s.id);
        else startSentence(s.id);
      });
      card.appendChild(btn);
      wrap.appendChild(card);
    });
    app.appendChild(wrap);
  }

  function renderCombinePlay() {
    if (!combine) {
      view = 'home';
      return renderHome();
    }
    app.replaceChildren();
    var list = currentList();
    var at = 0;
    for (var i = 0; i < list.length; i++) if (list[i].id === combine.id) at = i;

    var top = el('div', 'play-top');
    var back = el('button', 'btn ghost', '← ' + t('back'));
    back.type = 'button';
    back.addEventListener('click', function () {
      view = 'home';
      combine = null;
      render();
    });
    top.appendChild(back);
    top.appendChild(el('span', 'counter', t('counter', { i: at + 1, n: list.length })));
    app.appendChild(top);

    app.appendChild(el('p', 'prompt', t('combinePrompt')));

    var kernels = el('section', 'panel kernels-panel');
    kernels.appendChild(el('h2', null, t('kernels')));
    combine.kernels.forEach(function (sentence) {
      kernels.appendChild(el('p', 'kernel', sentence));
    });
    app.appendChild(kernels);

    if (combineStep === 'connector') {
      var cp = el('section', 'panel');
      cp.appendChild(el('h2', null, t('pickConnector')));
      var opts = el('div', 'connectors');
      combine.options.forEach(function (opt, idx) {
        var b = el('button', 'connector-btn', opt.w);
        b.type = 'button';
        b.setAttribute('data-connector-opt', String(idx));
        b.addEventListener('click', function () {
          if (opt.ok) {
            combineStep = 'arrange';
            combineHint = '';
            combineBank = shuffled(combine.tokens.length);
            combineAnswer = [];
            combineChecked = false;
            combineOk = false;
            render();
          } else {
            combineHint = opt.why;
            render();
          }
        });
        opts.appendChild(b);
      });
      cp.appendChild(opts);
      if (combineHint) cp.appendChild(el('p', 'connector-hint', combineHint));
      app.appendChild(cp);
      return;
    }

    var answerPanel = el('section', 'panel');
    answerPanel.appendChild(el('h2', null, t('answer')));
    var area = el('div', 'answer-area');
    area.setAttribute('data-answer', '');
    if (!combineAnswer.length) {
      area.appendChild(el('span', 'placeholder', t('placeholder')));
    } else {
      combineAnswer.forEach(function (bankIdx, pos) {
        var c = el('button', 'chip answer-chip', combine.tokens[combineBank[bankIdx]]);
        c.type = 'button';
        c.setAttribute('data-answer-pos', String(pos));
        c.setAttribute('aria-label', '移除 ' + combine.tokens[combineBank[bankIdx]]);
        c.addEventListener('click', function () {
          if (combineChecked) return;
          combineAnswer.splice(pos, 1);
          render();
        });
        area.appendChild(c);
      });
    }
    answerPanel.appendChild(area);
    app.appendChild(answerPanel);

    var bankPanel = el('section', 'panel');
    bankPanel.appendChild(el('h2', null, t('bank')));
    var bankWrap = el('div', 'bank');
    var used = {};
    combineAnswer.forEach(function (b) {
      used[b] = true;
    });
    combineBank.forEach(function (tokenIdx, bi) {
      if (used[bi]) return;
      var c = el('button', 'chip', combine.tokens[tokenIdx]);
      c.type = 'button';
      c.setAttribute('data-bank-idx', String(bi));
      c.addEventListener('click', function () {
        if (combineChecked) return;
        combineAnswer.push(bi);
        render();
      });
      bankWrap.appendChild(c);
    });
    bankPanel.appendChild(bankWrap);
    app.appendChild(bankPanel);

    var controls = el('div', 'controls');
    var undo = el('button', 'btn ghost', t('undo'));
    undo.type = 'button';
    undo.disabled = combineChecked || !combineAnswer.length;
    undo.addEventListener('click', function () {
      combineAnswer.pop();
      render();
    });
    controls.appendChild(undo);

    var reset = el('button', 'btn ghost', t('reset'));
    reset.type = 'button';
    reset.disabled = combineChecked;
    reset.addEventListener('click', function () {
      combineBank = shuffled(combine.tokens.length);
      combineAnswer = [];
      render();
    });
    controls.appendChild(reset);

    var check = el('button', 'btn primary', t('check'));
    check.type = 'button';
    check.setAttribute('data-check', '');
    check.disabled = combineChecked || combineAnswer.length !== combine.tokens.length;
    check.addEventListener('click', function () {
      var ok = combineAnswer.every(function (bi, pos) {
        return combine.tokens[combineBank[bi]] === combine.tokens[pos];
      });
      combineChecked = true;
      combineOk = ok;
      var rec = progress[combine.id] || { tries: 0, correct: 0 };
      rec.tries += 1;
      if (ok) rec.correct += 1;
      rec.last = new Date().toISOString();
      progress[combine.id] = rec;
      saveProgress();
      bumpStreak();
      if (window.HubProgress) {
        window.HubProgress.log({
          app: 'sentence',
          skill: 'combining',
          correct: ok,
          ms: combineStartedAt ? Date.now() - combineStartedAt : 0,
        });
      }
      render();
    });
    controls.appendChild(check);
    app.appendChild(controls);

    if (combineChecked) {
      var fb = el('section', 'feedback ' + (combineOk ? 'ok' : 'bad'));
      fb.setAttribute('aria-live', 'polite');
      fb.appendChild(el('h2', null, combineOk ? t('correct') : t('wrong')));
      fb.appendChild(el('p', 'full-sentence', combine.tokens.join(' ') + '.'));
      var hint = el('p', 'hint');
      hint.appendChild(el('strong', null, t('hint') + '：'));
      hint.appendChild(document.createTextNode(' ' + combine.why));
      fb.appendChild(hint);
      fb.appendChild(el('p', 'hint', t('translation') + '：' + combine.zh));
      var next = el('button', 'btn primary', t('next'));
      next.type = 'button';
      next.setAttribute('data-next', '');
      next.style.marginTop = '12px';
      next.addEventListener('click', nextCombine);
      fb.appendChild(next);
      app.appendChild(fb);
    }
  }

  function renderPlay() {
    app.replaceChildren();
    var list = currentList();
    var at = 0;
    for (var i = 0; i < list.length; i++) if (list[i].id === current.id) at = i;

    var top = el('div', 'play-top');
    var back = el('button', 'btn ghost', '← ' + t('back'));
    back.type = 'button';
    back.addEventListener('click', function () {
      view = 'home';
      current = null;
      render();
    });
    top.appendChild(back);
    top.appendChild(el('span', 'counter', t('counter', { i: at + 1, n: list.length })));
    app.appendChild(top);

    app.appendChild(el('p', 'prompt', t('prompt')));

    var answerPanel = el('section', 'panel');
    answerPanel.appendChild(el('h2', null, t('answer')));
    var area = el('div', 'answer-area');
    area.setAttribute('data-answer', '');
    if (!answer.length) {
      area.appendChild(el('span', 'placeholder', t('placeholder')));
    } else {
      answer.forEach(function (bankIdx, pos) {
        var c = el('button', 'chip answer-chip', current.tokens[bank[bankIdx]]);
        c.type = 'button';
        c.setAttribute('data-answer-pos', String(pos));
        c.setAttribute('aria-label', '移除 ' + current.tokens[bank[bankIdx]]);
        c.addEventListener('click', function () {
          if (checked) return;
          answer.splice(pos, 1);
          render();
        });
        area.appendChild(c);
      });
    }
    answerPanel.appendChild(area);
    app.appendChild(answerPanel);

    var bankPanel = el('section', 'panel');
    bankPanel.appendChild(el('h2', null, t('bank')));
    var bankWrap = el('div', 'bank');
    var used = usedSet();
    bank.forEach(function (tokenIdx, bi) {
      if (used[bi]) return;
      var c = el('button', 'chip', current.tokens[tokenIdx]);
      c.type = 'button';
      c.setAttribute('data-bank-idx', String(bi));
      c.addEventListener('click', function () {
        if (checked) return;
        answer.push(bi);
        render();
      });
      bankWrap.appendChild(c);
    });
    bankPanel.appendChild(bankWrap);
    app.appendChild(bankPanel);

    var controls = el('div', 'controls');
    var undo = el('button', 'btn ghost', t('undo'));
    undo.type = 'button';
    undo.setAttribute('data-undo', '');
    undo.disabled = checked || !answer.length;
    undo.addEventListener('click', function () {
      answer.pop();
      render();
    });
    controls.appendChild(undo);

    var reset = el('button', 'btn ghost', t('reset'));
    reset.type = 'button';
    reset.setAttribute('data-reset', '');
    reset.disabled = checked;
    reset.addEventListener('click', function () {
      bank = shuffled(current.tokens.length);
      answer = [];
      render();
    });
    controls.appendChild(reset);

    var check = el('button', 'btn primary', t('check'));
    check.type = 'button';
    check.setAttribute('data-check', '');
    check.disabled = checked || answer.length !== current.tokens.length;
    check.addEventListener('click', function () {
      var ok = answer.every(function (bi, pos) {
        return current.tokens[bank[bi]] === current.tokens[pos];
      });
      checked = true;
      lastOk = ok;
      var rec = progress[current.id] || { tries: 0, correct: 0 };
      rec.tries += 1;
      if (ok) rec.correct += 1;
      rec.last = new Date().toISOString();
      progress[current.id] = rec;
      saveProgress();
      bumpStreak();
      if (window.HubProgress) {
        window.HubProgress.log({
          app: 'sentence',
          skill: 'word-order',
          correct: ok,
          ms: startedAt ? Date.now() - startedAt : 0,
        });
      }
      render();
    });
    controls.appendChild(check);
    app.appendChild(controls);

    if (checked) {
      var fb = el('section', 'feedback ' + (lastOk ? 'ok' : 'bad'));
      fb.setAttribute('aria-live', 'polite');
      fb.appendChild(el('h2', null, lastOk ? t('correct') : t('wrong')));
      fb.appendChild(el('p', 'full-sentence', current.tokens.join(' ') + '.'));
      var hint = el('p', 'hint');
      hint.appendChild(el('strong', null, t('hint') + '：'));
      hint.appendChild(document.createTextNode(' ' + (lang === 'en' ? current.hint.en : current.hint.zh)));
      fb.appendChild(hint);
      fb.appendChild(el('p', 'hint', t('translation') + '：' + current.zh));
      var next = el('button', 'btn primary', t('next'));
      next.type = 'button';
      next.setAttribute('data-next', '');
      next.style.marginTop = '12px';
      next.addEventListener('click', nextSentence);
      fb.appendChild(next);
      app.appendChild(fb);
    }
  }

  document.querySelectorAll('[data-lang]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-lang');
      if (LANGS.indexOf(v) < 0) return;
      lang = v;
      try {
        localStorage.setItem(LKEY, v);
      } catch (e) {}
      document.querySelectorAll('[data-lang]').forEach(function (x) {
        x.setAttribute('aria-pressed', x.getAttribute('data-lang') === v ? 'true' : 'false');
      });
      render();
    });
  });

  document.querySelectorAll('[data-lang]').forEach(function (x) {
    x.setAttribute('aria-pressed', x.getAttribute('data-lang') === lang ? 'true' : 'false');
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }

  render();
})();
