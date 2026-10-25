/*
 * 詞語星球 WordLab — 中英雙語生字練習
 *
 * 設計取捨（2026-10-25）：
 *  - 同一個概念有英文、中文兩邊；學習方向由 subject 決定，進度亦分開記。
 *  - 三種玩法：字卡（自評）、配對（6 對）、快問快答（4 選 1）。
 *  - 每次答題寫入簡化 SRS（1/3/7/14/30 日）＋HubProgress，唔另開帳號。
 *  - 全部本機；TTS 只係輔助，冇語音包都玩得。
 */
(function () {
  'use strict';

  var DATA = (Array.isArray(window.WORDLAB_DATA) ? window.WORDLAB_DATA : []).concat(
    Array.isArray(window.WORDLAB_BULK) ? window.WORDLAB_BULK : []
  );
  var EXTRA_EXAMPLES = window.WORDLAB_EXAMPLES || {};
  DATA.forEach(function (w) {
    var extra = EXTRA_EXAMPLES[String(w.en || '').toLowerCase()];
    if (extra && !w.exEn && extra.exEn && extra.exZh) {
      w.exEn = extra.exEn;
      w.exZh = extra.exZh;
      w.exampleSource = extra.source || 'WordLab';
    }
  });
  window.WORDLAB_ALL = DATA;
  var LANG_KEY = 'wordlab/lang';
  var SUBJECT_KEY = 'wordlab/subject';
  var GRADE_KEY = 'wordlab/grade';
  var NEED_KEY = 'wordlab/need';
  var BAND_KEY = 'wordlab/band';
  var SOURCE_KEY = 'wordlab/source';
  var PROG_KEY = 'wordlab/progress/v1';
  var STREAK_KEY = 'wordlab/streak';
  var STEPS = [1, 3, 7, 14, 30];

  var DICT = {
    footLocal: ['純前端 · 進度只存喺呢部機 · 冇帳號', '純前端 · 進度只存於本機 · 沒有帳號', 'Local only · no account'],
    footHub: ['← 返回門戶', '← 返回門戶', '← Back to hub'],
    footSource: ['詞庫：96 個自寫概念＋4,904 個 ECDICT（MIT）', '詞庫：96 個自寫概念＋4,904 個 ECDICT（MIT）', 'Word bank: 96 written concepts + 4,904 ECDICT entries (MIT)'],
    eyebrow: ['英文生字 · 中文對照', '英文生字 · 中文對照', 'English vocabulary · Chinese support'],
    heroTitle: ['詞語星球', '詞語星球', 'WordLab'],
    heroLead: [
      '以英文生字為主：睇英文諗中文；中文方向只係用中文提示回想英文詞。',
      '以英文生字為主：看英文想中文；中文方向只是用中文提示回想英文詞。',
      'English vocabulary first: see English, recall Chinese; the Chinese cue is only there to help recall the English word.',
    ],
    subjectTitle: ['學習方向', '學習方向', 'Learning direction'],
    subjectEn: ['English 生字', 'English 生字', 'English words'],
    subjectZh: ['中文提示', '中文提示', 'Chinese cue'],
    subjectEnHint: ['睇英文詞，回想中文意思', '看英文詞，回想中文意思', 'See English, recall Chinese'],
    subjectZhHint: ['睇中文釋義，回想英文詞', '看中文釋義，回想英文詞', 'See the Chinese gloss, recall the English word'],
    dailyTitle: ['今日任務', '今日任務', 'Today’s mission'],
    dailyDue: ['{n} 個待練', '{n} 個待練', '{n} to review'],
    dailyNew: ['{n} 個新字', '{n} 個新字', '{n} new words'],
    dailyStart: ['開始今日任務（{n} 題）', '開始今日任務（{n} 題）', 'Start today’s mission ({n})'],
    dailyEmpty: ['呢個年級未有生字。', '這個年級未有生字。', 'No words for this grade yet.'],
    dailyAllDone: ['今日到期已經練完，可以揀模式自由練。', '今日到期已經練完，可以選模式自由練。', 'All due words are done — pick any mode to keep practising.'],
    gradeAll: ['全部', '全部', 'All'],
    needTitle: ['學習優先', '學習優先', 'Priority'],
    needMust: ['必學', '必學', 'Must learn'],
    needShould: ['需要學', '需要學', 'Should learn'],
    needRare: ['平時少用', '平時少用', 'Less common'],
    needBonus: ['錦上添花', '錦上添花', 'Bonus'],
    needAll: ['全部', '全部', 'All'],
    needNote: [
      '必學＝日常高頻；需要學＝校內常見；平時少用＝較書面／低頻；錦上添花＝進階增潤。',
      '必學＝日常高頻；需要學＝校內常見；平時少用＝較書面／低頻；錦上添花＝進階增潤。',
      'Must learn = everyday high-frequency; Should learn = common at school; Less common = more formal or low-frequency; Bonus = stretch enrichment.',
    ],
    bandTitle: ['難度', '難度', 'Difficulty'],
    bandAll: ['全部', '全部', 'All'],
    band1: ['基礎', '基礎', 'Basic'],
    band2: ['進階', '進階', 'Developing'],
    band3: ['挑戰', '挑戰', 'Challenge'],
    sourceTitle: ['來源', '來源', 'Source'],
    sourceAll: ['全部', '全部', 'All'],
    sourceCurated: ['精選', '精選', 'Curated'],
    sourceDict: ['字典', '字典', 'Dictionary'],
    sourceCuratedBadge: ['精選', '精選', 'Curated'],
    sourceDictBadge: ['字典', '字典', 'Dictionary'],
    sourceNote: ['精選 96 個有人手例句；字典層另有 {n} 個常用字有首批例句，其餘未有例句。', '精選 96 個有人手例句；字典層另有 {n} 個常用字有首批例句，其餘未有例句。', '96 curated entries have examples; {n} other dictionary entries have Batch 1 examples; the rest do not.'],
    exampleBadge: ['例句', '例句', 'Example'],
    resetFilters: ['清除篩選', '清除篩選', 'Clear filters'],
    noFiltered: ['呢個組合暫時冇生字；試下清除篩選。', '這個組合暫時沒有生字；試試清除篩選。', 'No words in this combination — try clearing the filters.'],
    progressTitle: ['我的進度', '我的進度', 'My progress'],
    knownOf: ['已掌握 {n} / {m}', '已掌握 {n} / {m}', '{n} / {m} mastered'],
    showingOf: ['顯示 {n} / {m} 個', '顯示 {n} / {m} 個', '{n} / {m} shown'],
    dueLabel: ['{n} 個到期', '{n} 個到期', '{n} due'],
    streakLabel: ['連續 {n} 日', '連續 {n} 日', '{n}-day streak'],
    modesTitle: ['揀一種玩法', '選一種玩法', 'Pick a way to play'],
    modeFlash: ['字卡', '字卡', 'Flashcards'],
    modeFlashDesc: ['睇詞、揭意思、自評識唔識', '看詞、揭意思、自評會不會', 'See it, reveal, self-check'],
    modeMatch: ['配對', '配對', 'Match'],
    modeMatchDesc: ['6 對詞語，考反應同記憶', '6 對詞語，考反應和記憶', '6 pairs — speed and memory'],
    modeQuiz: ['快問快答', '快問快答', 'Quick quiz'],
    modeQuizDesc: ['4 選 1，連對有 combo', '4 選 1，連對有 combo', '4 choices, build a combo'],
    back: ['返回', '返回', 'Back'],
    flip: ['揭意思', '揭意思', 'Reveal'],
    meaning: ['意思', '意思', 'Meaning'],
    example: ['例句', '例句', 'Example'],
    translation: ['例句意思', '例句意思', 'Translation'],
    know: ['識咗', '會了', 'I know it'],
    again: ['要再練', '要再練', 'Practise again'],
    correct: ['答啱！', '答對了！', 'Correct!'],
    wrong: ['再試一次', '再試一次', 'Try again'],
    flashPromptEn: ['呢個英文字點解？', '這個英文字是什麼意思？', 'What does this English word mean?'],
    flashPromptZh: ['呢個中文詞點解？', '這個中文詞是什麼意思？', 'What does this Chinese word mean?'],
    questionOf: ['第 {i} / {n} 題', '第 {i} / {n} 題', 'Question {i} / {n}'],
    quizHint: ['揀正確意思', '選正確意思', 'Choose the correct meaning'],
    matchHint: ['先揀一個詞，再揀佢嘅意思', '先選一個詞，再選它的意思', 'Tap a word, then its meaning'],
    matchPairs: ['已配對 {n} / {m}', '已配對 {n} / {m}', 'Matched {n} / {m}'],
    combo: ['Combo ×{n}', 'Combo ×{n}', 'Combo ×{n}'],
    matchDone: ['全部配對完成！', '全部配對完成！', 'All pairs matched!'],
    resultFlash: ['字卡完成', '字卡完成', 'Flashcards complete'],
    resultQuiz: ['快問快答完成', '快問快答完成', 'Quiz complete'],
    resultMatch: ['配對完成', '配對完成', 'Match complete'],
    resultScore: ['答啱 {n} / {m}', '答對 {n} / {m}', '{n} / {m} correct'],
    resultMatchScore: ['完成 {n} 對 · 錯誤 {e} 次', '完成 {n} 對 · 錯誤 {e} 次', '{n} pairs · {e} mistakes'],
    resultFlashCount: ['完成 {n} 張字卡', '完成 {n} 張字卡', '{n} cards completed'],
    stars: ['★', '★', '★'],
    replay: ['再玩一次', '再玩一次', 'Play again'],
    home: ['返主頁', '回主頁', 'Home'],
    speak: ['朗讀', '朗讀', 'Listen'],
    noSpeech: ['呢部機未有語音，仍然可以繼續練。', '這部機未有語音，仍可繼續練。', 'No voice on this device — you can keep practising.'],
    noWords: ['搵唔到生字，請重新載入。', '找不到生字，請重新載入。', 'No words found — please reload.'],
    exampleMissing: ['呢個字暫時未有例句。', '這個字暫時未有例句。', 'No example for this word yet.'],
    gradeLabel: ['年級', '年級', 'Grade'],
    newBadge: ['新', '新', 'New'],
    dueBadge: ['到期', '到期', 'Due'],
    knownBadge: ['已掌握', '已掌握', 'Known'],
    streakNone: ['未開始連續紀錄', '未開始連續紀錄', 'No streak yet'],
    missionBadge: ['今日任務', '今日任務', 'Mission'],
    helpNote: [
      '每個方向分開計進度；答啱會拉長下次重練間隔，答錯會即日再練。',
      '每個方向分開計進度；答對會拉長下次重練間隔，答錯會即日再練。',
      'Each direction tracks separately; correct answers space reviews out, mistakes come back today.',
    ],
    langLabel: ['語言', '語言', 'Language'],
  };

  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  function todayKey() {
    var d = new Date();
    return (
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0')
    );
  }

  function yesterdayKey() {
    var d = new Date(Date.now() - 86400000);
    return (
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0')
    );
  }

  function t(key, vars) {
    var row = DICT[key] || [key, key, key];
    var text = row[lang === 'yue' ? 0 : lang === 'zh' ? 1 : 2];
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        text = text.replace(new RegExp('\\{' + k + '\\}', 'g'), String(vars[k]));
      });
    }
    return text;
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function shuffled(list) {
    var arr = list.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  var lang = load(LANG_KEY, 'zh');
  if (lang !== 'yue' && lang !== 'zh' && lang !== 'en') lang = 'zh';
  var subject = load(SUBJECT_KEY, 'en');
  if (subject !== 'en' && subject !== 'zh') subject = 'en';
  var grade = load(GRADE_KEY, 'all');
  if (grade !== 'all' && !/^P[1-6]$/.test(grade)) grade = 'all';
  var need = load(NEED_KEY, 'all');
  if (['all', 'must', 'should', 'rare', 'bonus'].indexOf(need) < 0) need = 'all';
  var sourceFilter = load(SOURCE_KEY, 'all');
  if (['all', 'curated', 'dictionary'].indexOf(sourceFilter) < 0) sourceFilter = 'all';
  var band = load(BAND_KEY, 'all');
  if (band !== 'all' && [1, 2, 3].indexOf(Number(band)) < 0) band = 'all';
  if (band !== 'all') band = Number(band);
  var progress = load(PROG_KEY, {});
  if (!progress || typeof progress !== 'object') progress = {};
  var streak = load(STREAK_KEY, { date: '', count: 0 });
  if (!streak || typeof streak !== 'object') streak = { date: '', count: 0 };
  var view = 'home';
  var session = null;
  var lastResult = null;
  var app = document.getElementById('app');

  function gradeWords() {
    return DATA.filter(function (w) {
      return grade === 'all' || w.grade === grade;
    });
  }

  function wordSource(w) {
    return w.source === 'ECDICT' ? 'dictionary' : 'curated';
  }

  function currentWords() {
    return gradeWords().filter(function (w) {
      var okNeed = need === 'all' || w.need === need;
      var okBand = band === 'all' || Number(w.band) === band;
      var okSource = sourceFilter === 'all' || wordSource(w) === sourceFilter;
      return okNeed && okBand && okSource;
    });
  }

  function needName(value) {
    return value === 'must'
      ? t('needMust')
      : value === 'should'
        ? t('needShould')
        : value === 'rare'
          ? t('needRare')
          : t('needBonus');
  }

  function bandName(value) {
    return value === 1 ? t('band1') : value === 2 ? t('band2') : t('band3');
  }

  function filterCounts() {
    var words = gradeWords();
    var byNeed = { all: words.length, must: 0, should: 0, rare: 0, bonus: 0 };
    var byBand = { all: words.length, 1: 0, 2: 0, 3: 0 };
    var bySource = { all: words.length, curated: 0, dictionary: 0 };
    words.forEach(function (w) {
      if (byNeed[w.need] !== undefined) byNeed[w.need] += 1;
      if (byBand[Number(w.band)] !== undefined) byBand[Number(w.band)] += 1;
      bySource[wordSource(w)] += 1;
    });
    return { need: byNeed, band: byBand, source: bySource };
  }

  function term(w) {
    return subject === 'en' ? w.en : w.zh;
  }

  function meaning(w) {
    return subject === 'en' ? w.zh : w.en;
  }

  function primaryExample(w) {
    return subject === 'en' ? w.exEn : w.exZh;
  }

  function secondaryExample(w) {
    return subject === 'en' ? w.exZh : w.exEn;
  }

  function recKey(w) {
    return w.id + ':' + subject;
  }

  function recordOf(w) {
    var r = progress[recKey(w)];
    return r && typeof r === 'object' ? r : null;
  }

  function isKnown(w) {
    var r = recordOf(w);
    return !!r && Number(r.step) >= 3;
  }

  function isDue(w) {
    var r = recordOf(w);
    return !r || !r.due || Number(r.due) <= Date.now();
  }

  function isNew(w) {
    return !recordOf(w);
  }

  function saveProgress() {
    save(PROG_KEY, progress);
  }

  function bumpStreak() {
    var today = todayKey();
    if (streak.date === today) return;
    streak.count = streak.date === yesterdayKey() ? (Number(streak.count) || 0) + 1 : 1;
    streak.date = today;
    save(STREAK_KEY, streak);
  }

  function currentStreak() {
    if (!streak || !streak.date) return 0;
    if (streak.date !== todayKey() && streak.date !== yesterdayKey()) return 0;
    return Number(streak.count) || 0;
  }

  function logEvent(skill, ok, ms) {
    if (window.HubProgress && typeof window.HubProgress.log === 'function') {
      try {
        window.HubProgress.log({
          app: 'wordlab',
          skill: skill,
          correct: !!ok,
          ms: Math.max(0, Number(ms) || 0),
        });
      } catch (e) {}
    }
  }

  /**
   * 一次答題：更新該方向嘅 SRS、連續日數、HubProgress。
   * 答對 step +1（最多 5），下次 1/3/7/14/30 日後；答錯 step 歸零、即日再練。
   */
  function markWord(w, ok, skill, ms) {
    var key = recKey(w);
    var r = progress[key] && typeof progress[key] === 'object' ? progress[key] : {
      tries: 0,
      correct: 0,
      step: 0,
      due: 0,
      last: null,
    };
    r.tries = (Number(r.tries) || 0) + 1;
    if (ok) {
      r.correct = (Number(r.correct) || 0) + 1;
      r.step = Math.min(5, (Number(r.step) || 0) + 1);
    } else {
      r.step = 0;
    }
    var days = ok ? STEPS[Math.max(0, Math.min(STEPS.length - 1, r.step - 1))] : 0;
    r.due = Date.now() + days * 86400000;
    r.last = new Date().toISOString();
    progress[key] = r;
    saveProgress();
    bumpStreak();
    logEvent(skill || 'flashcard', ok, ms);
  }

  function needRank(value) {
    return value === 'must' ? 0 : value === 'should' ? 1 : value === 'rare' ? 2 : 3;
  }

  function stats() {
    var list = currentWords();
    var known = 0;
    var due = 0;
    var fresh = 0;
    list.forEach(function (w) {
      if (isKnown(w)) known += 1;
      if (isNew(w)) fresh += 1;
      if (isDue(w)) due += 1;
    });
    return { total: list.length, known: known, due: due, new: fresh };
  }

  function dailyQueue(n) {
    var list = currentWords();
    var due = list.filter(isDue).sort(function (a, b) {
      return needRank(a.need) - needRank(b.need) || Number(a.band) - Number(b.band);
    });
    var picked = due.slice(0, n);
    if (picked.length < n) {
      var unseen = shuffled(list.filter(isNew));
      unseen.forEach(function (w) {
        if (picked.length < n && picked.indexOf(w) < 0) picked.push(w);
      });
    }
    if (picked.length < n) {
      shuffled(list).forEach(function (w) {
        if (picked.length < n && picked.indexOf(w) < 0) picked.push(w);
      });
    }
    return picked;
  }

  function starsFor(correct, total) {
    if (!total) return 0;
    var pct = correct / total;
    return pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : 1;
  }

  function speak(text) {
    if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== 'function') {
      return false;
    }
    try {
      window.speechSynthesis.cancel();
      var u = new window.SpeechSynthesisUtterance(text);
      u.lang = subject === 'en' ? 'en-US' : 'zh-HK';
      u.rate = subject === 'en' ? 0.85 : 0.8;
      window.speechSynthesis.speak(u);
      return true;
    } catch (e) {
      return false;
    }
  }

  function topbarFor(viewName) {
    var top = el('div', 'play-top');
    var back = el('button', 'btn ghost', '← ' + t('back'));
    back.type = 'button';
    back.setAttribute('data-home', '');
    top.appendChild(back);
    var label = el('span', 'counter');
    if (viewName === 'flash' && session) {
      label.textContent = t('questionOf', { i: Math.min(session.pos + 1, session.queue.length), n: session.queue.length });
    } else if (viewName === 'quiz' && session) {
      label.textContent = t('questionOf', { i: Math.min(session.pos + 1, session.queue.length), n: session.queue.length });
    } else if (viewName === 'match' && session) {
      label.textContent = t('matchPairs', { n: session.matched, m: session.pairs.length });
    }
    top.appendChild(label);
    if (session && (viewName === 'flash' || viewName === 'quiz')) {
      var listen = el('button', 'btn ghost', '🔊');
      listen.type = 'button';
      listen.setAttribute('data-speak', '');
      listen.setAttribute('aria-label', t('speak'));
      top.appendChild(listen);
    } else {
      top.appendChild(el('span', 'top-spacer'));
    }
    return top;
  }

  function renderHome() {
    var list = currentWords();
    if (!list.length) {
      var empty = el('div', 'empty-state');
      empty.appendChild(el('p', 'empty', DATA.length ? t('noFiltered') : t('noWords')));
      if (DATA.length) {
        var reset = el('button', 'btn ghost', t('resetFilters'));
        reset.type = 'button';
        reset.setAttribute('data-reset-filters', '');
        empty.appendChild(reset);
      }
      app.replaceChildren(empty);
      return;
    }
    var st = stats();

    var hero = el('section', 'hero');
    var heroTop = el('div', 'hero-top');
    heroTop.appendChild(el('p', 'eyebrow', t('eyebrow')));
    heroTop.appendChild(el('span', 'planet', '🌍'));
    hero.appendChild(heroTop);
    hero.appendChild(el('h1', 'hero-title', t('heroTitle')));
    hero.appendChild(el('p', 'hero-lead', t('heroLead')));
    app.appendChild(hero);

    var subjectWrap = el('section', 'panel subject-panel');
    var subjectHead = el('div', 'panel-head');
    subjectHead.appendChild(el('h2', '', t('subjectTitle')));
    subjectWrap.appendChild(subjectHead);
    var tabs = el('div', 'subject-tabs');
    [
      { v: 'en', label: t('subjectEn'), hint: t('subjectEnHint') },
      { v: 'zh', label: t('subjectZh'), hint: t('subjectZhHint') },
    ].forEach(function (s) {
      var b = el('button', 'subject-tab' + (subject === s.v ? ' is-on' : ''));
      b.type = 'button';
      b.setAttribute('data-subject', s.v);
      b.setAttribute('aria-pressed', subject === s.v ? 'true' : 'false');
      b.appendChild(el('strong', '', s.label));
      b.appendChild(el('span', '', s.hint));
      tabs.appendChild(b);
    });
    subjectWrap.appendChild(tabs);
    app.appendChild(subjectWrap);

    var daily = el('section', 'panel daily-panel');
    var dailyHead = el('div', 'panel-head');
    dailyHead.appendChild(el('h2', '', t('dailyTitle')));
    dailyHead.appendChild(el('span', 'pill', t('dailyDue', { n: st.due })));
    daily.appendChild(dailyHead);
    daily.appendChild(
      el(
        'p',
        'daily-line',
        st.due
          ? t('dailyDue', { n: st.due }) + ' · ' + t('dailyNew', { n: st.new })
          : t('dailyAllDone')
      )
    );
    var dailyWords = dailyQueue(5);
    var dailyBtn = el('button', 'btn primary daily-btn', t('dailyStart', { n: dailyWords.length }));
    dailyBtn.type = 'button';
    dailyBtn.setAttribute('data-start-daily', '');
    if (dailyWords.length < 2) {
      dailyBtn.disabled = true;
      dailyBtn.setAttribute('aria-disabled', 'true');
    }
    daily.appendChild(dailyBtn);
    app.appendChild(daily);

    var gradeWrap = el('section', 'panel grade-panel');
    var gradeHead = el('div', 'panel-head');
    gradeHead.appendChild(el('h2', '', t('gradeLabel')));
    gradeWrap.appendChild(gradeHead);
    var gradeRow = el('div', 'grade-row');
    [
      { v: 'all', label: t('gradeAll') },
      { v: 'P1', label: 'P1' },
      { v: 'P2', label: 'P2' },
      { v: 'P3', label: 'P3' },
      { v: 'P4', label: 'P4' },
      { v: 'P5', label: 'P5' },
      { v: 'P6', label: 'P6' },
    ].forEach(function (g) {
      var b = el('button', 'grade-btn' + (grade === g.v ? ' is-on' : ''), g.label);
      b.type = 'button';
      b.setAttribute('data-grade', g.v);
      b.setAttribute('aria-pressed', grade === g.v ? 'true' : 'false');
      gradeRow.appendChild(b);
    });
    gradeWrap.appendChild(gradeRow);
    app.appendChild(gradeWrap);

    /* 2026-10-25：學習優先（必學／需要學／少用／錦上添花）＋難度。
       兩個 filter 係獨立維度，count 以「年級」為準，唔會因另一個 filter 縮到 0 而睇唔到。 */
    var counts = filterCounts();
    var filterPanel = el('section', 'panel filter-panel');
    var filterHead = el('div', 'panel-head');
    filterHead.appendChild(el('h2', '', t('needTitle')));
    filterHead.appendChild(el('span', 'pill', t('showingOf', { n: list.length, m: gradeWords().length })));
    filterPanel.appendChild(filterHead);
    var needRow = el('div', 'filter-chips');
    [
      { v: 'all', label: t('needAll'), n: counts.need.all },
      { v: 'must', label: t('needMust'), n: counts.need.must },
      { v: 'should', label: t('needShould'), n: counts.need.should },
      { v: 'rare', label: t('needRare'), n: counts.need.rare },
      { v: 'bonus', label: t('needBonus'), n: counts.need.bonus },
    ].forEach(function (o) {
      var b = el('button', 'filter-chip need-' + o.v + (need === o.v ? ' is-on' : ''));
      b.type = 'button';
      b.setAttribute('data-need', o.v);
      b.setAttribute('aria-pressed', need === o.v ? 'true' : 'false');
      b.appendChild(el('span', '', o.label));
      b.appendChild(el('small', '', String(o.n)));
      needRow.appendChild(b);
    });
    filterPanel.appendChild(needRow);

    var bandHead = el('div', 'filter-subhead');
    bandHead.appendChild(el('span', 'filter-label', t('bandTitle')));
    filterPanel.appendChild(bandHead);
    var bandRow = el('div', 'filter-chips');
    [
      { v: 'all', label: t('bandAll'), n: counts.band.all },
      { v: 1, label: t('band1'), n: counts.band[1] },
      { v: 2, label: t('band2'), n: counts.band[2] },
      { v: 3, label: t('band3'), n: counts.band[3] },
    ].forEach(function (o) {
      var b = el('button', 'filter-chip band-' + o.v + (band === o.v ? ' is-on' : ''));
      b.type = 'button';
      b.setAttribute('data-band', String(o.v));
      b.setAttribute('aria-pressed', band === o.v ? 'true' : 'false');
      b.appendChild(el('span', '', o.label));
      b.appendChild(el('small', '', String(o.n)));
      bandRow.appendChild(b);
    });
    filterPanel.appendChild(bandRow);

    var sourceHead = el('div', 'filter-subhead');
    sourceHead.appendChild(el('span', 'filter-label', t('sourceTitle')));
    filterPanel.appendChild(sourceHead);
    var sourceRow = el('div', 'filter-chips');
    [
      { v: 'all', label: t('sourceAll'), n: counts.source.all },
      { v: 'curated', label: t('sourceCurated'), n: counts.source.curated },
      { v: 'dictionary', label: t('sourceDict'), n: counts.source.dictionary },
    ].forEach(function (o) {
      var b = el('button', 'filter-chip source-' + o.v + (sourceFilter === o.v ? ' is-on' : ''));
      b.type = 'button';
      b.setAttribute('data-source', o.v);
      b.setAttribute('aria-pressed', sourceFilter === o.v ? 'true' : 'false');
      b.appendChild(el('span', '', o.label));
      b.appendChild(el('small', '', String(o.n)));
      sourceRow.appendChild(b);
    });
    filterPanel.appendChild(sourceRow);
    var packedExamples = DATA.filter(function (w) { return w.source === 'ECDICT' && w.exEn && w.exZh; }).length;
    filterPanel.appendChild(el('p', 'filter-note', t('needNote') + ' ' + t('sourceNote').replace('{n}', String(packedExamples))));
    app.appendChild(filterPanel);

    var prog = el('section', 'panel progress-panel');
    var progHead = el('div', 'panel-head');
    progHead.appendChild(el('h2', '', t('progressTitle')));
    progHead.appendChild(el('span', 'pill', t('knownOf', { n: st.known, m: st.total })));
    prog.appendChild(progHead);
    var bar = el('div', 'progress-bar');
    var fill = el('div', 'progress-fill');
    fill.style.width = (st.total ? Math.round((st.known / st.total) * 100) : 0) + '%';
    bar.appendChild(fill);
    prog.appendChild(bar);
    var metrics = el('div', 'metrics');
    [
      { k: t('knownBadge'), v: String(st.known) },
      { k: t('dueBadge'), v: String(st.due) },
      { k: t('streakNone'), v: '🔥 ' + currentStreak() },
    ].forEach(function (m) {
      var box = el('div', 'metric');
      box.appendChild(el('strong', '', m.v));
      box.appendChild(el('span', '', m.k));
      metrics.appendChild(box);
    });
    prog.appendChild(metrics);
    app.appendChild(prog);

    var modes = el('section', 'modes');
    var modesHead = el('h2', 'modes-title', t('modesTitle'));
    app.appendChild(modesHead);
    [
      { v: 'flash', icon: '🃏', name: t('modeFlash'), desc: t('modeFlashDesc') },
      { v: 'match', icon: '🧩', name: t('modeMatch'), desc: t('modeMatchDesc') },
      { v: 'quiz', icon: '⚡', name: t('modeQuiz'), desc: t('modeQuizDesc') },
    ].forEach(function (m) {
      var card = el('button', 'mode-card');
      card.type = 'button';
      card.setAttribute('data-mode', m.v);
      if (m.v !== 'flash' && list.length < 2) {
        card.disabled = true;
        card.classList.add('is-disabled');
        card.setAttribute('aria-disabled', 'true');
      }
      card.appendChild(el('span', 'mode-icon', m.icon));
      var body = el('span', 'mode-body');
      body.appendChild(el('strong', '', m.name));
      body.appendChild(el('span', '', m.desc));
      card.appendChild(body);
      card.appendChild(el('span', 'mode-arrow', '→'));
      modes.appendChild(card);
    });
    app.appendChild(modes);
    app.appendChild(el('p', 'help-note', t('helpNote')));
  }

  function startFlash(queue) {
    var words = queue || currentWords();
    if (!words.length) return;
    if (!queue) {
      var sorted = words.slice().sort(function (a, b) {
        return (
          (isDue(a) ? 0 : 1) - (isDue(b) ? 0 : 1) ||
          needRank(a.need) - needRank(b.need) ||
          Number(a.band) - Number(b.band)
        );
      });
      words = shuffled(sorted.slice(0, Math.min(12, sorted.length)));
    }
    session = {
      kind: 'flash',
      queue: words,
      pos: 0,
      answered: 0,
      correct: 0,
      revealed: false,
      startedAt: Date.now(),
      itemAt: Date.now(),
      mission: false,
    };
    view = 'flash';
    render();
  }

  function startMatch() {
    var pool = shuffled(currentWords()).slice(0, Math.min(6, currentWords().length));
    if (pool.length < 2) return;
    var tiles = [];
    pool.forEach(function (w) {
      tiles.push({ kind: 'term', word: w, text: term(w) });
      tiles.push({ kind: 'meaning', word: w, text: meaning(w) });
    });
    session = {
      kind: 'match',
      pairs: pool,
      tiles: shuffled(tiles),
      picked: null,
      matched: 0,
      errors: 0,
      wrong: [],
      combo: 0,
      startedAt: Date.now(),
      itemAt: Date.now(),
      mission: false,
    };
    view = 'match';
    render();
  }

  function makeOptions(word) {
    var correct = meaning(word);
    var pool = [];
    currentWords().forEach(function (w) {
      var m = meaning(w);
      if (m !== correct && pool.indexOf(m) < 0) pool.push(m);
    });
    var options = [correct].concat(shuffled(pool).slice(0, 3));
    return shuffled(options);
  }

  function startQuiz(queue, mission) {
    var words = queue || shuffled(currentWords()).slice(0, Math.min(8, currentWords().length));
    if (words.length < 2) return;
    session = {
      kind: 'quiz',
      queue: words,
      pos: 0,
      answered: 0,
      correct: 0,
      options: makeOptions(words[0]),
      picked: null,
      combo: 0,
      startedAt: Date.now(),
      itemAt: Date.now(),
      mission: !!mission,
    };
    view = 'quiz';
    render();
  }

  function finishSession() {
    if (!session) return;
    var kind = session.kind;
    var total = kind === 'match' ? session.pairs.length : session.answered;
    var correct = kind === 'match' ? session.pairs.length : session.correct;
    var stars;
    if (kind === 'flash') {
      stars = total ? 1 : 0;
    } else if (kind === 'match') {
      stars = session.errors === 0 ? 3 : session.errors <= 2 ? 2 : 1;
    } else {
      stars = starsFor(correct, total);
    }
    lastResult = {
      kind: kind,
      total: total,
      correct: correct,
      stars: stars,
      errors: kind === 'match' ? session.errors : 0,
      ms: Date.now() - session.startedAt,
      mission: !!session.mission,
    };
    session = null;
    view = 'result';
    render();
  }

  function renderFlash() {
    if (!session || !session.queue.length) {
      view = 'home';
      render();
      return;
    }
    var w = session.queue[session.pos];
    app.appendChild(topbarFor('flash'));

    var card = el('section', 'flash-card');
    card.appendChild(el('p', 'prompt-label', subject === 'en' ? t('flashPromptEn') : t('flashPromptZh')));
    card.appendChild(el('p', 'term', term(w)));
    var meta = el('p', 'word-meta');
    meta.appendChild(el('span', 'badge', w.grade));
    if (w.ipa) meta.appendChild(el('span', 'badge ipa', w.ipa));
    meta.appendChild(el('span', 'badge need-' + w.need, needName(w.need)));
    meta.appendChild(el('span', 'badge band-' + w.band, bandName(Number(w.band))));
    meta.appendChild(
      el(
        'span',
        'badge source-' + wordSource(w),
        wordSource(w) === 'curated' ? t('sourceCuratedBadge') : t('sourceDictBadge')
      )
    );
    if (w.exEn) meta.appendChild(el('span', 'badge example', t('exampleBadge')));
    if (isNew(w)) meta.appendChild(el('span', 'badge new', t('newBadge')));
    else if (isDue(w)) meta.appendChild(el('span', 'badge due', t('dueBadge')));
    else if (isKnown(w)) meta.appendChild(el('span', 'badge known', t('knownBadge')));
    card.appendChild(meta);

    if (!session.revealed) {
      var reveal = el('button', 'btn primary reveal-btn', t('flip'));
      reveal.type = 'button';
      reveal.setAttribute('data-reveal', '');
      card.appendChild(reveal);
      card.appendChild(el('p', 'tiny muted', t('helpNote')));
    } else {
      var answer = el('div', 'answer');
      answer.appendChild(el('p', 'answer-label', t('meaning')));
      answer.appendChild(el('p', 'meaning', meaning(w)));
      var ex = primaryExample(w);
      if (ex) {
        answer.appendChild(el('p', 'answer-label', t('example')));
        answer.appendChild(el('p', 'example', ex));
        answer.appendChild(el('p', 'translation', secondaryExample(w)));
      } else {
        answer.appendChild(el('p', 'tiny muted', t('exampleMissing')));
      }
      card.appendChild(answer);
    }
    app.appendChild(card);

    if (session.revealed) {
      var actions = el('div', 'answer-actions');
      var again = el('button', 'btn ghost', '🔁 ' + t('again'));
      again.type = 'button';
      again.setAttribute('data-again', '');
      actions.appendChild(again);
      var know = el('button', 'btn primary', '✓ ' + t('know'));
      know.type = 'button';
      know.setAttribute('data-known', '');
      actions.appendChild(know);
      app.appendChild(actions);
    }
  }

  function answerFlash(ok) {
    if (!session || !session.revealed) return;
    var w = session.queue[session.pos];
    markWord(w, ok, 'flashcard', Date.now() - session.itemAt);
    session.answered += 1;
    if (ok) session.correct += 1;
    session.pos += 1;
    session.revealed = false;
    session.itemAt = Date.now();
    if (session.pos >= session.queue.length) finishSession();
    else render();
  }

  function renderQuiz() {
    if (!session || !session.queue.length) {
      view = 'home';
      render();
      return;
    }
    var w = session.queue[session.pos];
    app.appendChild(topbarFor('quiz'));

    var card = el('section', 'quiz-card');
    var top = el('div', 'quiz-top');
    top.appendChild(el('span', 'badge', session.mission ? t('missionBadge') : t('modeQuiz')));
    if (session.combo > 1) top.appendChild(el('span', 'combo', t('combo', { n: session.combo })));
    card.appendChild(top);
    card.appendChild(el('p', 'prompt-label', t('quizHint')));
    card.appendChild(el('p', 'term', term(w)));
    var qmeta = el('p', 'word-meta');
    qmeta.appendChild(el('span', 'badge', w.grade));
    if (w.ipa) qmeta.appendChild(el('span', 'badge ipa', w.ipa));
    qmeta.appendChild(el('span', 'badge need-' + w.need, needName(w.need)));
    qmeta.appendChild(el('span', 'badge band-' + w.band, bandName(Number(w.band))));
    qmeta.appendChild(
      el(
        'span',
        'badge source-' + wordSource(w),
        wordSource(w) === 'curated' ? t('sourceCuratedBadge') : t('sourceDictBadge')
      )
    );
    if (w.exEn) qmeta.appendChild(el('span', 'badge example', t('exampleBadge')));
    card.appendChild(qmeta);

    var options = el('div', 'options');
    session.options.forEach(function (opt, i) {
      var b = el('button', 'option');
      b.type = 'button';
      b.setAttribute('data-option', String(i));
      b.textContent = opt;
      if (session.picked !== null) {
        if (opt === meaning(w)) b.classList.add('is-correct');
        else if (i === session.picked) b.classList.add('is-wrong');
      }
      options.appendChild(b);
    });
    card.appendChild(options);
    if (session.picked !== null) {
      var ok = session.options[session.picked] === meaning(w);
      card.appendChild(el('p', 'feedback ' + (ok ? 'ok' : 'bad'), ok ? t('correct') : t('wrong')));
    }
    app.appendChild(card);
  }

  function chooseOption(index) {
    if (!session || session.picked !== null) return;
    var w = session.queue[session.pos];
    var ok = session.options[index] === meaning(w);
    session.picked = index;
    session.answered += 1;
    if (ok) {
      session.correct += 1;
      session.combo += 1;
    } else {
      session.combo = 0;
    }
    markWord(w, ok, session.mission ? 'mission' : 'quiz', Date.now() - session.itemAt);
    render();
    window.setTimeout(function () {
      if (!session || session.kind !== 'quiz' || session.picked === null) return;
      session.pos += 1;
      session.picked = null;
      session.itemAt = Date.now();
      if (session.pos >= session.queue.length) finishSession();
      else {
        session.options = makeOptions(session.queue[session.pos]);
        render();
      }
    }, 720);
  }

  function renderMatch() {
    if (!session || !session.pairs.length) {
      view = 'home';
      render();
      return;
    }
    app.appendChild(topbarFor('match'));

    var card = el('section', 'match-card');
    var head = el('div', 'match-top');
    head.appendChild(el('p', 'prompt-label', t('matchHint')));
    if (session.combo > 1) head.appendChild(el('span', 'combo', t('combo', { n: session.combo })));
    card.appendChild(head);

    var grid = el('div', 'match-grid');
    session.tiles.forEach(function (tile, i) {
      var b = el('button', 'tile ' + tile.kind, tile.text);
      b.type = 'button';
      b.setAttribute('data-tile', String(i));
      if (session.picked === i) b.classList.add('is-picked');
      if (session.wrong.indexOf(i) >= 0) b.classList.add('is-wrong');
      if (tile.done) b.classList.add('is-matched');
      b.disabled = !!tile.done;
      grid.appendChild(b);
    });
    card.appendChild(grid);
    app.appendChild(card);
  }

  function pickTile(index) {
    if (!session || session.kind !== 'match') return;
    var tile = session.tiles[index];
    if (!tile || tile.done) return;
    if (session.picked === null) {
      session.picked = index;
      session.wrong = [];
      render();
      return;
    }
    if (session.picked === index) {
      session.picked = null;
      render();
      return;
    }
    var first = session.tiles[session.picked];
    var ok = first.word.id === tile.word.id && first.kind !== tile.kind;
    if (ok) {
      first.done = true;
      tile.done = true;
      session.picked = null;
      session.matched += 1;
      session.combo += 1;
      markWord(tile.word, true, 'match', Date.now() - session.itemAt);
      render();
      if (session.matched >= session.pairs.length) {
        window.setTimeout(function () {
          if (session && session.kind === 'match') finishSession();
        }, 450);
      }
      return;
    }
    session.errors += 1;
    session.combo = 0;
    session.wrong = [session.picked, index];
    render();
    var picked = session.picked;
    window.setTimeout(function () {
      if (!session || session.kind !== 'match' || session.picked !== picked) return;
      session.picked = null;
      session.wrong = [];
      render();
    }, 550);
  }

  function renderResult() {
    if (!lastResult) {
      view = 'home';
      render();
      return;
    }
    var box = el('section', 'result-card');
    var kicker =
      lastResult.kind === 'flash'
        ? t('modeFlash')
        : lastResult.kind === 'match'
          ? t('modeMatch')
          : t('modeQuiz');
    box.appendChild(el('p', 'result-kicker', lastResult.mission ? t('missionBadge') : kicker));
    var title =
      lastResult.kind === 'flash'
        ? t('resultFlash')
        : lastResult.kind === 'match'
          ? t('resultMatch')
          : t('resultQuiz');
    if (lastResult.mission) title = t('dailyTitle') + ' · ' + title;
    box.appendChild(el('h1', 'result-title', title));
    var stars = el('p', 'result-stars');
    for (var i = 0; i < 3; i++) {
      var s = el('span', i < lastResult.stars ? 'star on' : 'star', '★');
      s.setAttribute('aria-hidden', 'true');
      stars.appendChild(s);
    }
    box.appendChild(stars);
    if (lastResult.kind === 'flash') {
      box.appendChild(el('p', 'result-score', t('resultFlashCount', { n: lastResult.total })));
    } else if (lastResult.kind === 'match') {
      box.appendChild(
        el('p', 'result-score', t('resultMatchScore', { n: lastResult.total, e: lastResult.errors }))
      );
    } else {
      box.appendChild(el('p', 'result-score', t('resultScore', { n: lastResult.correct, m: lastResult.total })));
    }
    box.appendChild(el('p', 'tiny muted', t('helpNote')));
    app.appendChild(box);

    var actions = el('div', 'result-actions');
    var replay = el('button', 'btn primary', t('replay'));
    replay.type = 'button';
    replay.setAttribute('data-replay', '');
    actions.appendChild(replay);
    var home = el('button', 'btn ghost', t('home'));
    home.type = 'button';
    home.setAttribute('data-home', '');
    actions.appendChild(home);
    app.appendChild(actions);
  }

  function render() {
    app.replaceChildren();
    if (view === 'flash') renderFlash();
    else if (view === 'quiz') renderQuiz();
    else if (view === 'match') renderMatch();
    else if (view === 'result') renderResult();
    else renderHome();
    document.documentElement.lang = lang === 'en' ? 'en' : lang === 'yue' ? 'zh-HK' : 'zh-Hant';
    document.querySelectorAll('[data-i18n]').forEach(function (n) {
      var key = n.getAttribute('data-i18n');
      if (key === 'foot.local') n.textContent = t('footLocal');
      if (key === 'foot.hub') n.textContent = t('footHub');
      if (key === 'foot.source') n.textContent = t('footSource');
    });
    document.querySelectorAll('.lang button').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-lang') === lang ? 'true' : 'false');
    });
  }

  document.addEventListener('click', function (event) {
    var target = event.target.closest('button, [data-grade], [data-subject]');
    if (!target) return;

    if (target.hasAttribute('data-subject')) {
      subject = target.getAttribute('data-subject');
      save(SUBJECT_KEY, subject);
      view = 'home';
      session = null;
      lastResult = null;
      render();
      return;
    }
    if (target.hasAttribute('data-grade')) {
      grade = target.getAttribute('data-grade');
      save(GRADE_KEY, grade);
      view = 'home';
      session = null;
      lastResult = null;
      render();
      return;
    }
    if (target.hasAttribute('data-need')) {
      need = target.getAttribute('data-need');
      save(NEED_KEY, need);
      view = 'home';
      session = null;
      lastResult = null;
      render();
      return;
    }
    if (target.hasAttribute('data-band')) {
      var bv = target.getAttribute('data-band');
      band = bv === 'all' ? 'all' : Number(bv);
      save(BAND_KEY, band);
      view = 'home';
      session = null;
      lastResult = null;
      render();
      return;
    }
    if (target.hasAttribute('data-source')) {
      sourceFilter = target.getAttribute('data-source');
      save(SOURCE_KEY, sourceFilter);
      view = 'home';
      session = null;
      lastResult = null;
      render();
      return;
    }
    if (target.hasAttribute('data-reset-filters')) {
      need = 'all';
      band = 'all';
      sourceFilter = 'all';
      save(NEED_KEY, need);
      save(BAND_KEY, band);
      save(SOURCE_KEY, sourceFilter);
      view = 'home';
      session = null;
      lastResult = null;
      render();
      return;
    }
    if (target.hasAttribute('data-lang')) {
      lang = target.getAttribute('data-lang');
      save(LANG_KEY, lang);
      render();
      return;
    }
    if (target.hasAttribute('data-start-daily')) {
      var queue = dailyQueue(5);
      if (queue.length) startQuiz(queue, true);
      return;
    }
    if (target.hasAttribute('data-mode')) {
      var mode = target.getAttribute('data-mode');
      if (mode === 'flash') startFlash();
      else if (mode === 'match') startMatch();
      else if (mode === 'quiz') startQuiz();
      return;
    }
    if (target.hasAttribute('data-reveal')) {
      if (session) {
        session.revealed = true;
        render();
      }
      return;
    }
    if (target.hasAttribute('data-known')) {
      answerFlash(true);
      return;
    }
    if (target.hasAttribute('data-again')) {
      answerFlash(false);
      return;
    }
    if (target.hasAttribute('data-tile')) {
      pickTile(Number(target.getAttribute('data-tile')));
      return;
    }
    if (target.hasAttribute('data-option')) {
      chooseOption(Number(target.getAttribute('data-option')));
      return;
    }
    if (target.hasAttribute('data-speak')) {
      if (session) {
        var sw =
          view === 'quiz' && session.queue
            ? session.queue[session.pos]
            : view === 'flash' && session.queue
              ? session.queue[session.pos]
              : null;
        if (sw) speak(term(sw));
      }
      return;
    }
    if (target.hasAttribute('data-replay')) {
      var kind = lastResult && lastResult.kind;
      lastResult = null;
      if (kind === 'flash') startFlash();
      else if (kind === 'match') startMatch();
      else if (kind === 'quiz') startQuiz();
      else {
        view = 'home';
        render();
      }
      return;
    }
    if (target.hasAttribute('data-home')) {
      view = 'home';
      session = null;
      lastResult = null;
      render();
    }
  });

  render();
})();
