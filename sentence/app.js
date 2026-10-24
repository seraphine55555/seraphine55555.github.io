/* 句子重組 Sentence Lab（2026-10-24）
 *
 * 純前端、離線、進度只存 localStorage。每題：由詞語庫點選，排成正確句子；
 * 檢查後顯示完整句子＋文法提示（中／英）。冇自動「相似句」判斷——答案唯一。
 */
(function () {
  'use strict';

  var BANK = window.SENTENCE_BANK || [];
  var KEY = 'sentence/progress';
  var GKEY = 'sentence/grade';
  var LKEY = 'sentence/lang';
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
  };

  var lang = 'zh';
  var grade = 'all';
  try {
    var sl = localStorage.getItem(LKEY);
    if (sl && LANGS.indexOf(sl) >= 0) lang = sl;
    var sg = localStorage.getItem(GKEY);
    if (sg && GRADES.indexOf(sg) >= 0) grade = sg;
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

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function filtered() {
    return BANK.filter(function (s) {
      return grade === 'all' || s.level === grade;
    });
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

  function usedSet() {
    var used = {};
    answer.forEach(function (b) {
      used[b] = true;
    });
    return used;
  }

  function render() {
    if (view === 'play' && current) return renderPlay();
    return renderHome();
  }

  function renderHome() {
    app.replaceChildren();
    var h = el('h1', null, t('title'));
    app.appendChild(h);
    app.appendChild(el('p', 'sub', t('sub')));

    var row = el('div', 'grades');
    GRADES.forEach(function (g) {
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

    var wrap = el('div', 'list');
    list.forEach(function (s, i) {
      var done = progress[s.id] && progress[s.id].correct > 0;
      var card = el('article', 'sentence-card' + (done ? ' is-done' : ''));
      card.setAttribute('data-id', s.id);
      var body = el('div');
      body.appendChild(el('h2', null, (lang === 'en' ? 'Sentence ' : '句子 ') + (i + 1) + ' · ' + s.level));
      body.appendChild(el('p', 'meta', t('words', { n: s.tokens.length }) + (done ? ' · ✓' : '')));
      card.appendChild(body);
      var btn = el('button', 'btn primary', done ? t('again') : t('start'));
      btn.type = 'button';
      btn.setAttribute('data-start', s.id);
      btn.addEventListener('click', function () {
        startSentence(s.id);
      });
      card.appendChild(btn);
      wrap.appendChild(card);
    });
    app.appendChild(wrap);
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

  render();
})();
