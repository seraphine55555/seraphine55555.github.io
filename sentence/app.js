/* 句子重組 Sentence Lab（2026-10-24）
 *
 * 純前端、離線、進度只存 localStorage。每題：由詞語庫點選，排成正確句子；
 * 檢查後顯示完整句子＋文法提示（中／英）。冇自動「相似句」判斷——答案唯一。
 */
(function () {
  'use strict';

  var BANK = window.SENTENCE_BANK || [];
  var COMBINE = window.SENTENCE_COMBINE || [];
  var ERRORS = window.SENTENCE_ERRORS || [];
  var KEY = 'sentence/progress';
  var GKEY = 'sentence/grade';
  var LKEY = 'sentence/lang';
  var MKEY = 'sentence/mode';
  var SKEY = 'sentence/streak';
  var SCORE_KEY = 'sentence/score';
  var CHALLENGE_KEY = 'sentence/challenge/';
  var LANGS = ['yue', 'zh', 'en'];
  var GRADES = ['all', 'P3', 'P4', 'P5', 'P6'];
  var SRS_DAYS = [1, 3, 7, 14, 30];

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
    modeError: ['改錯', '改錯', 'Error hunt'],
    errorTitle: ['句子改錯', '句子改錯', 'Error hunt'],
    errorSub: [
      '每句得一個錯處：先點錯字，再揀正確寫法。',
      '每句只有一個錯處：先點錯字，再選正確寫法。',
      'Each sentence has one mistake: tap the wrong word, then pick the correct form.',
    ],
    errorPrompt: ['搵出句子入面嘅錯處。', '找出句子裡的錯處。', 'Find the mistake in the sentence.'],
    errorTokenHint: ['呢個字冇錯，再睇一次。', '這個字沒有錯，再看一次。', 'That word is fine — look again.'],
    errorPickFix: ['揀正確寫法', '選正確寫法', 'Pick the correct form'],
    errorFixed: ['改正後', '改正後', 'Corrected'],
    errorWrongFix: ['未啱，正確寫法係 {w}。', '未啱，正確寫法是 {w}。', 'Not quite — the correct form is {w}.'],
    errorCard: ['改錯', '改錯', 'Error'],
    errorMeta: ['{n} 個詞 · 1 個錯處', '{n} 個詞 · 1 個錯處', '{n} words · 1 mistake'],
    review: ['重練 {n} 題', '重練 {n} 題', 'Review {n} today'],
    smartTitle: ['掌握度', '掌握度', 'SmartScore'],
    smartLearning: ['學習中', '學習中', 'Learning'],
    smartRefining: ['精煉中', '精煉中', 'Refining'],
    smartChallenge: ['挑戰區', '挑戰區', 'Challenge zone'],
    grammarTitle: ['文法地圖', '文法地圖', 'Grammar map'],
    grammarHint: ['點一個文法重點，集中練你最弱嘅一類。', '點一個文法重點，集中練你最弱的一類。', 'Tap a grammar focus to practise your weakest type.'],
    grammarAll: ['全部', '全部', 'All'],
    grammarPct: ['{n}%', '{n}%', '{n}%'],
    grammarMastered: ['已掌握 {n} / {m}', '已掌握 {n} / {m}', 'Mastered {n} / {m}'],
    grammarNoData: ['未有記錄，練一題就會亮起。', '未有記錄，練一題就會亮起。', 'No data yet — answer one to light it up.'],
    tagConcession: ['讓步', '讓步', 'Concession'],
    tagTime: ['時間', '時間', 'Time'],
    tagRelative: ['關係子句', '關係子句', 'Relative clause'],
    tagResult: ['結果', '結果', 'Result'],
    tagCondition: ['條件', '條件', 'Condition'],
    tagCause: ['原因', '原因', 'Cause'],
    tagAddition: ['遞進', '遞進', 'Addition'],
    tagComparison: ['比較', '比較', 'Comparison'],
    tagAgreement: ['主謂一致', '主謂一致', 'Agreement'],
    tagTense: ['時態', '時態', 'Tense'],
    tagPreposition: ['介詞', '介詞', 'Preposition'],
    tagSubjunctive: ['虛擬語氣', '虛擬語氣', 'Subjunctive'],
    weakTitle: ['每日弱項 3 題', '每日弱項 3 題', 'Daily weak-spot 3'],
    weakStart: ['⚡ 開始今日弱項 3 題', '⚡ 開始今日弱項 3 題', '⚡ Start today’s weak-spot 3'],
    weakContinue: ['⚡ 繼續今日弱項（{done}/{n}）', '⚡ 繼續今日弱項（{done}/{n}）', '⚡ Continue today’s weak-spot ({done}/{n})'],
    weakDone: ['今日弱項完成！', '今日弱項完成！', 'Today’s weak-spot done!'],
    weakBanner: ['⚡ 今日弱項 {i} / {n}', '⚡ 今日弱項 {i} / {n}', '⚡ Today’s weak-spot {i} / {n}'],
    weakHint: ['由最低正確率嘅文法重點抽 3 題；做完會亮星。', '由最低正確率的文法重點抽 3 題；做完會亮星。', 'Picks 3 questions from your lowest-accuracy grammar focus; finish it to light up the star.'],
    weakNo: ['未夠紀錄，先做幾題就會識揀。', '未夠紀錄，先做幾題就會識揀。', 'Not enough history yet — answer a few first.'],
    tagEmpty: ['呢個文法重點喺呢個年級未有題目。', '這個文法重點在這個年級未有題目。', 'No questions for this grammar focus at this level.'],
    altCorrect: [
      '正確！呢個次序都合文法。另一個寫法：',
      '正確！這個次序也合文法。另一個寫法：',
      'Correct! This order also works. Another version:',
    ],
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
    if (sm === 'combine' || sm === 'error') mode = sm;
    if (mode !== 'scramble' && grade === 'P3') grade = 'all';
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

  var scores = {};
  try {
    scores = JSON.parse(localStorage.getItem(SCORE_KEY) || '{}') || {};
  } catch (e) {
    scores = {};
  }

  function saveScores() {
    try {
      localStorage.setItem(SCORE_KEY, JSON.stringify(scores));
    } catch (e) {}
  }

  function modeScore() {
    var row = scores[mode];
    return row && typeof row.score === 'number' ? row : { score: 0, run: 0 };
  }

  /* 簡化版 SmartScore（唔係 IXL 官方演算法，只取同樣嘅分段概念）：
     0–69 學習區 +5／−2；70–89 精煉區 +2／−5；90–100 挑戰區 +1／−10；
     每 10 連對額外 +2。分數只升到 100，唔會跌穿 0。 */
  function bumpScore(ok) {
    var row = scores[mode] || { score: 0, run: 0 };
    var score = typeof row.score === 'number' ? row.score : 0;
    var run = typeof row.run === 'number' ? row.run : 0;
    if (ok) {
      var inc = score < 70 ? 5 : score < 90 ? 2 : 1;
      run += 1;
      if (run > 0 && run % 10 === 0) inc += 2;
      score = Math.min(100, score + inc);
    } else {
      var dec = score < 70 ? 2 : score < 90 ? 5 : 10;
      score = Math.max(0, score - dec);
      run = 0;
    }
    scores[mode] = { score: score, run: run };
    saveScores();
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
  var errorItem = null;
  var errorStage = 'token';
  var errorHint = '';
  var errorFixWrong = '';
  var errorStartedAt = 0;
  var reviewQueue = null;
  var reviewPos = 0;
  var challenge = null;
  var challengeActive = false;
  var tagFilter = null;
  var TAG_KEYS = {
    combine: ['concession', 'time', 'relative', 'result', 'condition', 'cause', 'addition', 'comparison'],
    error: ['agreement', 'tense', 'preposition', 'subjunctive'],
  };
  var streak = { last: '', n: 0 };
  try {
    var ss = JSON.parse(localStorage.getItem(SKEY) || '{}');
    if (ss && typeof ss.n === 'number') streak = { last: ss.last || '', n: ss.n };
  } catch (e) {}
  challenge = loadChallenge();

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function baseList() {
    var base = mode === 'combine' ? COMBINE : mode === 'error' ? ERRORS : BANK;
    return base.filter(function (s) {
      return grade === 'all' || s.level === grade;
    });
  }

  function filtered() {
    var list = baseList();
    if (!tagFilter) return list;
    return list.filter(function (s) {
      return s.tag === tagFilter;
    });
  }

  function tagName(tag) {
    return t('tag' + tag.charAt(0).toUpperCase() + tag.slice(1));
  }

  /** 由每個 item 嘅真實答題紀錄加總，冇另開一份容易走樣嘅統計。 */
  function tagStats() {
    var keys = TAG_KEYS[mode] || [];
    var list = baseList();
    return keys
      .filter(function (tag) {
        return list.some(function (s) {
          return s.tag === tag;
        });
      })
      .map(function (tag) {
        var tries = 0;
        var correct = 0;
        list.forEach(function (s) {
          if (s.tag !== tag) return;
          var r = progress[s.id];
          if (!r) return;
          tries += r.tries || 0;
          correct += r.correct || 0;
        });
        var pct = tries ? Math.round((correct / tries) * 100) : 0;
        return {
          tag: tag,
          tries: tries,
          correct: correct,
          pct: pct,
          mastered: tries >= 3 && pct >= 80,
        };
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

  function recordResult(id, ok) {
    var rec = progress[id] || { tries: 0, correct: 0, step: 0 };
    rec.tries = (rec.tries || 0) + 1;
    if (ok) rec.correct = (rec.correct || 0) + 1;
    rec.step = ok ? Math.min((rec.step || 0) + 1, SRS_DAYS.length - 1) : 0;
    rec.due = ok ? Date.now() + SRS_DAYS[rec.step] * 86400000 : Date.now();
    rec.last = new Date().toISOString();
    progress[id] = rec;
    saveProgress();
    if (challengeActive && challenge && challenge.ids.indexOf(id) >= 0 && challenge.done.indexOf(id) < 0) {
      challenge.done.push(id);
      saveChallenge();
    }
    bumpStreak();
    bumpScore(ok);
  }

  function dueList() {
    var now = Date.now();
    return filtered().filter(function (s) {
      var r = progress[s.id];
      return r && typeof r.due === 'number' && r.due <= now;
    });
  }

  function startItem(id, keepQueue) {
    if (!keepQueue) {
      reviewQueue = null;
      reviewPos = 0;
      challengeActive = false;
    }
    if (mode === 'combine') startCombine(id);
    else if (mode === 'error') startError(id);
    else startSentence(id);
  }

  function startReview() {
    var ids = dueList().map(function (s) {
      return s.id;
    });
    if (!ids.length) return;
    reviewQueue = ids;
    reviewPos = 0;
    startItem(ids[0], true);
  }

  function nextInReview() {
    if (!reviewQueue) return false;
    reviewPos += 1;
    if (reviewPos < reviewQueue.length) {
      startItem(reviewQueue[reviewPos], true);
      return true;
    }
    reviewQueue = null;
    challengeActive = false;
    view = 'home';
    current = null;
    combine = null;
    errorItem = null;
    render();
    return true;
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
    if (nextInReview()) return;
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
    if (nextInReview()) return;
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

  function startError(id) {
    errorItem = ERRORS.filter(function (s) {
      return s.id === id;
    })[0];
    if (!errorItem) return;
    errorStage = 'token';
    errorHint = '';
    errorFixWrong = '';
    errorStartedAt = Date.now();
    view = 'play';
    render();
  }

  function nextError() {
    if (!errorItem) return;
    if (nextInReview()) return;
    var list = currentList();
    var at = -1;
    for (var i = 0; i < list.length; i++) if (list[i].id === errorItem.id) at = i;
    if (at < 0 || at + 1 >= list.length) {
      view = 'home';
      errorItem = null;
      render();
      return;
    }
    startError(list[at + 1].id);
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
    if (view === 'play' && mode === 'error') return renderErrorPlay();
    if (view === 'play' && current) return renderPlay();
    return renderHome();
  }

  function loadChallenge() {
    try {
      var c = JSON.parse(localStorage.getItem(CHALLENGE_KEY + mode) || 'null');
      if (
        c &&
        c.date === localDay() &&
        c.mode === mode &&
        Array.isArray(c.ids) &&
        Array.isArray(c.done)
      ) {
        return c;
      }
    } catch (e) {}
    return null;
  }

  function saveChallenge() {
    try {
      if (challenge) localStorage.setItem(CHALLENGE_KEY + mode, JSON.stringify(challenge));
    } catch (e) {}
  }

  /** 由最低正確率嘅 tag 抽 3 題；同日嘅 ids 會固定，唔會每次 refresh 都換。 */
  function pickWeakIds(n) {
    var list = baseList();
    if (!list.length) return [];
    var stats = tagStats().slice().sort(function (a, b) {
      return a.pct - b.pct || a.tries - b.tries;
    });
    var chosen = [];
    stats.forEach(function (st) {
      if (chosen.length >= n) return;
      var candidates = list
        .filter(function (s) {
          return s.tag === st.tag && chosen.indexOf(s.id) < 0;
        })
        .sort(function (a, b) {
          var ra = progress[a.id];
          var rb = progress[b.id];
          return (ra ? ra.tries : 0) - (rb ? rb.tries : 0);
        });
      if (candidates.length) chosen.push(candidates[0].id);
    });
    list.forEach(function (s) {
      if (chosen.length < n && chosen.indexOf(s.id) < 0) chosen.push(s.id);
    });
    return chosen.slice(0, n);
  }

  function startWeakChallenge() {
    if (!challenge || challenge.date !== localDay() || challenge.mode !== mode) {
      var ids = pickWeakIds(3);
      if (!ids.length) return;
      challenge = { date: localDay(), mode: mode, ids: ids, done: [] };
      saveChallenge();
    }
    var remaining = challenge.ids.filter(function (id) {
      return challenge.done.indexOf(id) < 0;
    });
    if (!remaining.length) {
      render();
      return;
    }
    tagFilter = null;
    challengeActive = true;
    reviewQueue = remaining;
    reviewPos = 0;
    startItem(remaining[0], true);
  }

  function challengePanel() {
    if (mode === 'scramble') return null;
    var panel = el('section', 'weak-panel');
    var head = el('div', 'weak-head');
    head.appendChild(el('strong', 'weak-title', t('weakTitle')));
    panel.appendChild(head);
    var complete = challenge && challenge.ids.length > 0 && challenge.done.length >= challenge.ids.length;
    if (complete) {
      panel.appendChild(el('p', 'weak-done', '★ ' + t('weakDone')));
      return panel;
    }
    panel.appendChild(el('p', 'weak-hint', t('weakHint')));
    var btn = el('button', 'btn primary weak-btn');
    btn.type = 'button';
    btn.setAttribute('data-weak', '');
    if (challenge && challenge.ids.length) {
      btn.textContent = t('weakContinue', { done: challenge.done.length, n: challenge.ids.length });
    } else {
      btn.textContent = t('weakStart');
    }
    btn.addEventListener('click', startWeakChallenge);
    panel.appendChild(btn);
    return panel;
  }

  function challengeBanner() {
    if (!challengeActive || !challenge || !challenge.ids.length) return null;
    var i = Math.min(challenge.done.length + 1, challenge.ids.length);
    return el('p', 'challenge-banner', t('weakBanner', { i: i, n: challenge.ids.length }));
  }

  function grammarMap() {
    var panel = el('section', 'grammar-panel');
    var head = el('div', 'grammar-head');
    head.appendChild(el('strong', 'grammar-title', t('grammarTitle')));
    var stats = tagStats();
    var mastered = stats.filter(function (st) {
      return st.mastered;
    }).length;
    head.appendChild(el('span', 'tiny muted', t('grammarMastered', { n: mastered, m: stats.length })));
    panel.appendChild(head);
    panel.appendChild(el('p', 'grammar-hint', t('grammarHint')));

    var grid = el('div', 'grammar-grid');
    var all = el('button', 'tag-chip' + (!tagFilter ? ' is-on' : ''), t('grammarAll'));
    all.type = 'button';
    all.setAttribute('data-tag', 'all');
    all.setAttribute('aria-pressed', tagFilter ? 'false' : 'true');
    all.addEventListener('click', function () {
      tagFilter = null;
      render();
    });
    grid.appendChild(all);

    if (!stats.length) {
      panel.appendChild(el('p', 'tiny muted', t('grammarNoData')));
      return panel;
    }

    stats.forEach(function (st) {
      var chip = el('button', 'tag-chip' + (tagFilter === st.tag ? ' is-on' : ''));
      chip.type = 'button';
      chip.setAttribute('data-tag', st.tag);
      chip.setAttribute('aria-pressed', tagFilter === st.tag ? 'true' : 'false');
      var top = el('span', 'tag-chip-top');
      top.appendChild(el('span', 'tag-name', tagName(st.tag)));
      if (st.mastered) {
        var star = el('span', 'tag-star', '★');
        star.setAttribute('aria-label', t('mSolid'));
        top.appendChild(star);
      }
      chip.appendChild(top);
      chip.appendChild(
        el('span', 'tag-pct', st.tries ? t('grammarPct', { n: st.pct }) : '—')
      );
      var bar = el('span', 'tag-bar');
      var fill = el('span', 'tag-bar-fill');
      fill.style.width = st.pct + '%';
      bar.appendChild(fill);
      chip.appendChild(bar);
      chip.addEventListener('click', function () {
        tagFilter = tagFilter === st.tag ? null : st.tag;
        render();
      });
      grid.appendChild(chip);
    });
    panel.appendChild(grid);
    return panel;
  }

  function renderHome() {
    app.replaceChildren();
    app.appendChild(
      el('h1', null, mode === 'combine' ? t('combineTitle') : mode === 'error' ? t('errorTitle') : t('title'))
    );
    app.appendChild(
      el('p', 'sub', mode === 'combine' ? t('combineSub') : mode === 'error' ? t('errorSub') : t('sub'))
    );

    var modes = el('div', 'modes');
    [
      { key: 'scramble', label: t('modeScramble') },
      { key: 'combine', label: t('modeCombine') },
      { key: 'error', label: t('modeError') },
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
        errorItem = null;
        reviewQueue = null;
        tagFilter = null;
        challenge = loadChallenge();
        challengeActive = false;
        if (mode !== 'scramble' && grade === 'P3') {
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

    var ms = modeScore();
    var scoreCard = el('div', 'score-card');
    var scoreHead = el('div', 'score-head');
    scoreHead.appendChild(el('span', 'score-label', t('smartTitle')));
    scoreHead.appendChild(el('strong', 'score-value', ms.score + ' / 100'));
    var status = ms.score >= 90 ? t('smartChallenge') : ms.score >= 70 ? t('smartRefining') : t('smartLearning');
    scoreHead.appendChild(el('span', 'score-status', status));
    scoreCard.appendChild(scoreHead);
    var scoreBar = el('div', 'mastery-bar score-bar');
    scoreBar.setAttribute('role', 'img');
    scoreBar.setAttribute('aria-label', t('smartTitle') + ' ' + ms.score + ' / 100');
    var scoreFill = el('span', 'mastery-fill');
    scoreFill.style.width = ms.score + '%';
    scoreBar.appendChild(scoreFill);
    scoreCard.appendChild(scoreBar);
    app.appendChild(scoreCard);

    if (streak.n > 0) {
      app.appendChild(el('p', 'streak', '🔥 ' + t('streak', { n: streak.n })));
    }

    var row = el('div', 'grades');
    var gradeList = mode === 'scramble' ? GRADES : ['all', 'P4', 'P5', 'P6'];
    gradeList.forEach(function (g) {
      var b = el('button', 'grade-btn' + (grade === g ? ' is-on' : ''), g === 'all' ? t('all') : g);
      b.type = 'button';
      b.setAttribute('data-grade', g);
      b.setAttribute('aria-pressed', grade === g ? 'true' : 'false');
      b.addEventListener('click', function () {
        grade = g;
        tagFilter = null;
        try {
          localStorage.setItem(GKEY, g);
        } catch (e) {}
        render();
      });
      row.appendChild(b);
    });
    app.appendChild(row);

    if (mode !== 'scramble') {
      app.appendChild(grammarMap());
      var weak = challengePanel();
      if (weak) app.appendChild(weak);
    }

    var list = filtered();
    app.appendChild(el('p', 'progress-line', t('progress', { done: doneCount(list), total: list.length })));

    var due = dueList();
    if (due.length) {
      var review = el('button', 'btn primary review-btn', t('review', { n: due.length }));
      review.type = 'button';
      review.setAttribute('data-review', '');
      review.style.marginBottom = '12px';
      review.addEventListener('click', startReview);
      app.appendChild(review);
    }

    if (!list.length) {
      app.appendChild(el('div', 'empty', tagFilter ? t('tagEmpty') : t('empty')));
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
          t(mode === 'combine' ? 'combineCard' : mode === 'error' ? 'errorCard' : 'sentenceCard') +
            ' ' +
            (i + 1) +
            ' · ' +
            s.level
        )
      );
      var metaText =
        mode === 'combine'
          ? t('twoKernels', { n: s.tokens.length })
          : mode === 'error'
            ? t('errorMeta', { n: s.tokens.length })
            : t('words', { n: s.tokens.length });
      body.appendChild(el('p', 'meta', metaText + (s.tag ? ' · ' + tagName(s.tag) : '') + (done ? ' · ✓' : '')));
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
        startItem(s.id);
      });
      card.appendChild(btn);
      wrap.appendChild(card);
    });
    app.appendChild(wrap);
  }

  function renderErrorPlay() {
    if (!errorItem) {
      view = 'home';
      return renderHome();
    }
    app.replaceChildren();
    var list = currentList();
    var at = 0;
    for (var i = 0; i < list.length; i++) if (list[i].id === errorItem.id) at = i;

    var top = el('div', 'play-top');
    var back = el('button', 'btn ghost', '← ' + t('back'));
    back.type = 'button';
    back.addEventListener('click', function () {
      view = 'home';
      errorItem = null;
      reviewQueue = null;
      render();
    });
    top.appendChild(back);
    top.appendChild(el('span', 'counter', t('counter', { i: at + 1, n: list.length })));
    app.appendChild(top);
    var challengeNote = challengeBanner();
    if (challengeNote) app.appendChild(challengeNote);

    app.appendChild(el('p', 'prompt', t('errorPrompt')));

    var sentencePanel = el('section', 'panel error-sentence-panel');
    var sentence = el('p', 'error-sentence');
    errorItem.tokens.forEach(function (word, idx) {
      var b = el('button', 'error-token' + (errorStage !== 'token' && idx === errorItem.wrong ? ' is-bad' : ''), word);
      b.type = 'button';
      b.setAttribute('data-token', String(idx));
      if (errorStage === 'token') {
        b.addEventListener('click', function () {
          if (idx === errorItem.wrong) {
            errorStage = 'fix';
            errorHint = '';
            render();
          } else {
            errorHint = t('errorTokenHint');
            render();
          }
        });
      } else {
        b.disabled = true;
      }
      sentence.appendChild(b);
      sentence.appendChild(document.createTextNode(' '));
    });
    sentencePanel.appendChild(sentence);
    if (errorHint) sentencePanel.appendChild(el('p', 'connector-hint', errorHint));
    app.appendChild(sentencePanel);

    if (errorStage === 'fix') {
      var fixPanel = el('section', 'panel');
      fixPanel.appendChild(el('h2', null, t('errorPickFix')));
      var fixes = el('div', 'connectors');
      shuffled(errorItem.fixes.length).forEach(function (idx) {
        var b = el('button', 'connector-btn fix-btn', errorItem.fixes[idx]);
        b.type = 'button';
        b.setAttribute('data-fix-opt', String(idx));
        b.addEventListener('click', function () {
          var ok = idx === 0;
          errorStage = 'done';
          errorFixWrong = ok ? '' : t('errorWrongFix', { w: errorItem.fixes[0] });
          recordResult(errorItem.id, ok);
          if (window.HubProgress) {
            window.HubProgress.log({
              app: 'sentence',
              skill: 'proofreading',
              correct: ok,
              ms: errorStartedAt ? Date.now() - errorStartedAt : 0,
            });
          }
          render();
        });
        fixes.appendChild(b);
      });
      fixPanel.appendChild(fixes);
      app.appendChild(fixPanel);
    }

    if (errorStage === 'done') {
      var ok = !errorFixWrong;
      var fb = el('section', 'feedback ' + (ok ? 'ok' : 'bad'));
      fb.setAttribute('aria-live', 'polite');
      fb.appendChild(el('h2', null, ok ? t('correct') : t('wrong')));
      var fixed = errorItem.tokens.map(function (word, idx) {
        return idx === errorItem.wrong ? errorItem.fixes[0] : word;
      });
      fb.appendChild(el('p', 'full-sentence', fixed.join(' ') + '.'));
      if (errorFixWrong) fb.appendChild(el('p', 'connector-hint', errorFixWrong));
      var hint = el('p', 'hint');
      hint.appendChild(el('strong', null, t('hint') + '：'));
      hint.appendChild(document.createTextNode(' ' + errorItem.why));
      fb.appendChild(hint);
      fb.appendChild(el('p', 'hint', t('translation') + '：' + errorItem.zh));
      var next = el('button', 'btn primary', t('next'));
      next.type = 'button';
      next.setAttribute('data-next', '');
      next.style.marginTop = '12px';
      next.addEventListener('click', nextError);
      fb.appendChild(next);
      app.appendChild(fb);
    }
  }

  function sameSeq(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  function displayToken(item, token, pos) {
    /* 同一個 token 放句首要大寫、放句中被連接詞細寫：例如 Although → although。
       只處理單字連接詞；其他 token（I、TV）保持原樣。 */
    if (pos === 0 && /^[a-z]/.test(token)) {
      return token.charAt(0).toUpperCase() + token.slice(1);
    }
    if (pos > 0 && item.connector && item.connector.indexOf(' ') === -1 && token === item.connector) {
      return token.toLowerCase();
    }
    return token;
  }

  function sentenceText(item, seq) {
    return seq
      .map(function (idx, pos) {
        return displayToken(item, item.tokens[idx], pos);
      })
      .join(' ') + '.';
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
      reviewQueue = null;
      render();
    });
    top.appendChild(back);
    top.appendChild(el('span', 'counter', t('counter', { i: at + 1, n: list.length })));
    app.appendChild(top);
    var challengeNote = challengeBanner();
    if (challengeNote) app.appendChild(challengeNote);

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
        var c = el(
          'button',
          'chip answer-chip',
          displayToken(combine, combine.tokens[combineBank[bankIdx]], pos)
        );
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
      var seq = combineAnswer.map(function (bi) {
        return combineBank[bi];
      });
      var canonical = combine.tokens.map(function (_tok, i) {
        return i;
      });
      var ok = sameSeq(seq, canonical);
      if (!ok && combine.accepted) {
        ok = combine.accepted.some(function (alt) {
          return sameSeq(seq, alt);
        });
      }
      combineChecked = true;
      combineOk = ok;
      recordResult(combine.id, ok);
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
      var seq = combineAnswer.map(function (bi) {
        return combineBank[bi];
      });
      var canonical = combine.tokens.map(function (_tok, i) {
        return i;
      });
      var isAlt = combineOk && !sameSeq(seq, canonical);
      var fb = el('section', 'feedback ' + (combineOk ? 'ok' : 'bad'));
      fb.setAttribute('aria-live', 'polite');
      fb.appendChild(el('h2', null, combineOk ? t('correct') : t('wrong')));
      fb.appendChild(el('p', 'full-sentence', sentenceText(combine, isAlt ? seq : canonical)));
      if (isAlt) {
        var alt = el('p', 'alt-hint');
        alt.appendChild(el('strong', null, t('altCorrect')));
        alt.appendChild(document.createTextNode(' ' + sentenceText(combine, canonical)));
        fb.appendChild(alt);
      }
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
      reviewQueue = null;
      render();
    });
    top.appendChild(back);
    top.appendChild(el('span', 'counter', t('counter', { i: at + 1, n: list.length })));
    app.appendChild(top);
    var challengeNote = challengeBanner();
    if (challengeNote) app.appendChild(challengeNote);

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
      recordResult(current.id, ok);
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
