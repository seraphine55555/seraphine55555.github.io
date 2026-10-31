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
  var EXTRA_SENSES = window.WORDLAB_SENSES || {};
  var EXTRA_PHRASES = window.WORDLAB_PHRASES || {};
  var EXTRA_TYPES = window.WORDLAB_TYPES || {};
  var BLOCKED = new Set((window.WORDLAB_BLOCKED || []).map(function (w) { return String(w).toLowerCase(); }));
  DATA = DATA.filter(function (w) { return !BLOCKED.has(String(w.en || '').toLowerCase()); });
  var TYPE_ORDER = ['noun', 'verb', 'adj', 'adv', 'function', 'number', 'other'];
  DATA.forEach(function (w) {
    var extra = EXTRA_EXAMPLES[String(w.en || '').toLowerCase()];
    if (extra && !w.exEn && extra.exEn && extra.exZh) {
      w.exEn = extra.exEn;
      w.exZh = extra.exZh;
      if (extra.zh) w.zh = extra.zh;
      w.exampleSource = extra.source || 'WordLab';
    }
    var more = EXTRA_SENSES[String(w.en || '').toLowerCase()];
    if (more && Array.isArray(more.senses) && more.senses.length) {
      w.extraSenses = more.senses;
    }
    var phrases = EXTRA_PHRASES[String(w.en || '').toLowerCase()];
    if (Array.isArray(phrases) && phrases.length) {
      w.phrases = phrases;
    }
    var typeRow = EXTRA_TYPES[String(w.en || '').toLowerCase()];
    w.types = TYPE_ORDER.filter(function (type) {
      return Array.isArray(typeRow) && typeRow.indexOf(type) >= 0;
    });
    if (!w.types.length) w.types = ['other'];
  });
  window.WORDLAB_ALL = DATA;
  var LANG_KEY = 'wordlab/lang';
  var SUBJECT_KEY = 'wordlab/subject';
  var GRADE_KEY = 'wordlab/grade';
  var NEED_KEY = 'wordlab/need';
  var BAND_KEY = 'wordlab/band';
  var SOURCE_KEY = 'wordlab/source';
  var TYPE_KEY = 'wordlab/type';
  var PROG_KEY = 'wordlab/progress/v1';
  var STREAK_KEY = 'wordlab/streak';
  var PHRASE_KEY = 'wordlab/phrase-progress/v1';
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
    sourceNote: ['精選 96 個有人手例句；字典層另有 {n} 個常用字有人手例句。', '精選 96 個有人手例句；字典層另有 {n} 個常用字有人手例句。', '96 curated entries have examples; {n} other dictionary entries also have examples.'],
    typeTitle: ['類型', '類型', 'Type'],
    typeAll: ['全部', '全部', 'All'],
    typeNoun: ['名詞', '名詞', 'Noun'],
    typeVerb: ['動詞', '動詞', 'Verb'],
    typeAdj: ['形容詞', '形容詞', 'Adjective'],
    typeAdv: ['副詞', '副詞', 'Adverb'],
    typeFunction: ['功能詞', '功能詞', 'Function word'],
    typeNumber: ['數字', '數字', 'Number'],
    typeOther: ['其他', '其他', 'Other'],
    typeNote: ['詞性由字典標記抽取；一個字可以有多個類型。', '詞性由字典標記抽取；一個字可以有多個類型。', 'Types are derived from dictionary tags; a word can have more than one.'],
    exampleBadge: ['例句', '例句', 'Example'],
    multiSenseBadge: ['多義', '多義', 'Multi-meaning'],
    otherMeanings: ['另一個意思', '另一個意思', 'Another meaning'],
    phrasesLabel: ['常用配搭', '常用配搭', 'Common phrases'],
    resetFilters: ['清除篩選', '清除篩選', 'Clear filters'],
    noFiltered: ['呢個組合暫時冇生字；試下清除篩選。', '這個組合暫時沒有生字；試試清除篩選。', 'No words in this combination — try clearing the filters.'],
    progressTitle: ['我的進度', '我的進度', 'My progress'],
    knownOf: ['已掌握 {n} / {m}', '已掌握 {n} / {m}', '{n} / {m} mastered'],
    progressScope: ['已套用篩選：目前 {m} 個 · 全站 {n} 個', '已套用篩選：目前 {m} 個 · 全站 {n} 個', 'Filtered: {m} shown · {n} total'],
    needTip: ['must 最早要識；should 校內常見；rare 較少用；bonus 進階增潤。', 'must 最早要識；should 校內常見；rare 較少用；bonus 進階增潤。', 'must = earliest priority; should = common at school; rare = less common; bonus = enrichment.'],
    bandTip: ['獨立難度，唔係年級：1 基礎、2 進階、3 挑戰。', '獨立難度，不是年級：1 基礎、2 進階、3 挑戰。', 'Independent difficulty, not grade: 1 basic, 2 developing, 3 challenge.'],
    typeTip: ['詞性由字典標記抽取；一個字可以有多個類型。', '詞性由字典標記抽取；一個字可以有多個類型。', 'Part of speech from dictionary tags; a word can have several types.'],
    sourceTip: ['精選＝96 個人手概念；字典＝ECDICT 詞庫。', '精選＝96 個人手概念；字典＝ECDICT 詞庫。', 'Curated = 96 hand-written concepts; Dictionary = ECDICT word bank.'],
    knownTip: ['連續答對 3 次或以上，才算已掌握。', '連續答對 3 次或以上，才算已掌握。', 'A word is mastered after 3 correct answers in a row.'],
    dueTip: ['新字（未練過）＋已到期重練嘅字；第一次打開可以等於全站字數。', '新字（未練過）＋已到期重練的字；第一次打開可以等於全站字數。', 'New words plus reviews that are due; on first visit this can equal the whole word bank.'],
    streakTip: ['連續有練習的日子；今日未練會顯示現有連續日數，唔係「未開始」。', '連續有練習的日子；今日未練會顯示現有連續日數，不是「未開始」。', 'Consecutive practice days; if you have not practised today, it still shows your current streak.'],
    clearScope: ['清除篩選', '清除篩選', 'Clear filters'],
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
    modePhrase: ['配搭練習', '配搭練習', 'Phrase practice'],
    modePhraseDesc: ['睇中文義揀正確配搭', '看中文義選正確配搭', 'Pick the right collocation'],
    phraseHint: ['揀正確配搭', '選正確配搭', 'Choose the correct collocation'],
    phraseNoData: ['目前篩選下冇常用配搭嘅字；試下清除篩選。', '目前篩選下沒有常用配搭的字；試試清除篩選。', 'No words with phrases in this filter — try clearing filters.'],
    phraseStats: ['配搭：已掌握 {k} / {t} 條；今日到期 {d} 條', '配搭：已掌握 {k} / {t} 條；今日到期 {d} 條', 'Phrases: {k} / {t} mastered; {d} due today'],
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
  var typeFilter = load(TYPE_KEY, 'all');
  if (typeFilter !== 'all' && TYPE_ORDER.indexOf(typeFilter) < 0) typeFilter = 'all';
  var band = load(BAND_KEY, 'all');
  if (band !== 'all' && [1, 2, 3].indexOf(Number(band)) < 0) band = 'all';
  if (band !== 'all') band = Number(band);
  var progress = load(PROG_KEY, {});
  if (!progress || typeof progress !== 'object') progress = {};
  var streak = load(STREAK_KEY, { date: '', count: 0 });
  if (!streak || typeof streak !== 'object') streak = { date: '', count: 0 };
  var phraseProgress = load(PHRASE_KEY, {});
  if (!phraseProgress || typeof phraseProgress !== 'object') phraseProgress = {};
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
      var okType = typeFilter === 'all' || (w.types || []).indexOf(typeFilter) >= 0;
      return okNeed && okBand && okSource && okType;
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

  function tipIcon(text) {
    var icon = el('span', 'tip', '?');
    icon.setAttribute('tabindex', '0');
    icon.setAttribute('role', 'note');
    icon.setAttribute('aria-label', text);
    icon.setAttribute('data-tip', text);
    return icon;
  }

  function typeText(w) {
    return (w.types || ['other']).map(function (type) {
      return t('type' + type.charAt(0).toUpperCase() + type.slice(1));
    }).join(' · ');
  }

  function filterCounts() {
    var words = gradeWords();
    var byNeed = { all: words.length, must: 0, should: 0, rare: 0, bonus: 0 };
    var byBand = { all: words.length, 1: 0, 2: 0, 3: 0 };
    var bySource = { all: words.length, curated: 0, dictionary: 0 };
    var byType = { all: words.length };
    TYPE_ORDER.forEach(function (type) { byType[type] = 0; });
    words.forEach(function (w) {
      if (byNeed[w.need] !== undefined) byNeed[w.need] += 1;
      if (byBand[Number(w.band)] !== undefined) byBand[Number(w.band)] += 1;
      bySource[wordSource(w)] += 1;
      (w.types || []).forEach(function (type) { if (byType[type] !== undefined) byType[type] += 1; });
    });
    return { need: byNeed, band: byBand, source: bySource, type: byType };
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

  function phraseRecord(p) {
    var r = phraseProgress[p];
    return r && typeof r === 'object' ? r : null;
  }

  function phraseKnown(p) {
    var r = phraseRecord(p);
    return !!r && Number(r.step) >= 3;
  }

  function phraseDue(p) {
    var r = phraseRecord(p);
    return !r || !r.due || Number(r.due) <= Date.now();
  }

  function markPhrase(p, ok) {
    var r = phraseRecord(p) || { tries: 0, correct: 0, step: 0, due: 0, last: null };
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
    phraseProgress[p] = r;
    save(PHRASE_KEY, phraseProgress);
    logEvent('phrase', ok, 0);
  }

  function phraseStats() {
    var total = 0;
    var known = 0;
    var due = 0;
    currentWords().forEach(function (w) {
      if (!w.phrases || !w.phrases.length) return;
      w.phrases.forEach(function (row) {
        total += 1;
        if (phraseKnown(row.p)) known += 1;
        if (phraseDue(row.p)) due += 1;
      });
    });
    return { total: total, known: known, due: due };
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

  function filtersActive() {
    return grade !== 'all' || need !== 'all' || band !== 'all' || sourceFilter !== 'all' || typeFilter !== 'all';
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

  function speak(text, lang, onEnd) {
    function finish() {
      if (typeof onEnd === 'function') onEnd();
    }
    if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== 'function') {
      finish();
      return false;
    }
    try {
      var voices = typeof window.speechSynthesis.getVoices === 'function' ? window.speechSynthesis.getVoices() : [];
      if (!voices.length && navigator.webdriver) {
        // Playwright／headless 冇語音包，唔好拖住答題流程；真實瀏覽器仍然會嘗試朗讀。
        finish();
        return false;
      }
      window.speechSynthesis.cancel();
      var u = new window.SpeechSynthesisUtterance(text);
      u.lang = lang || (subject === 'en' ? 'en-US' : 'zh-HK');
      u.rate = subject === 'en' ? 0.85 : 0.8;
      var ended = false;
      var done = function () {
        if (ended) return;
        ended = true;
        finish();
      };
      u.onend = done;
      u.onerror = done;
      window.speechSynthesis.speak(u);
      // 安全網：個別瀏覽器唔會 fire onend。
      window.setTimeout(done, Math.max(1500, Math.min(6000, String(text).length * 180)));
      return true;
    } catch (e) {
      finish();
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
    } else if ((viewName === 'quiz' || viewName === 'phrase') && session) {
      label.textContent = t('questionOf', { i: Math.min(session.pos + 1, session.queue.length), n: session.queue.length });
    } else if (viewName === 'match' && session) {
      label.textContent = t('matchPairs', { n: session.matched, m: session.pairs.length });
    }
    top.appendChild(label);
    if (session && (viewName === 'flash' || viewName === 'quiz' || viewName === 'phrase')) {
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
    filterHead.appendChild(tipIcon(t('needTip')));
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
    bandHead.appendChild(tipIcon(t('bandTip')));
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

    var typeHead = el('div', 'filter-subhead');
    typeHead.appendChild(el('span', 'filter-label', t('typeTitle')));
    typeHead.appendChild(tipIcon(t('typeTip')));
    filterPanel.appendChild(typeHead);
    var typeSelect = el('select', 'filter-select');
    typeSelect.setAttribute('data-type-select', '');
    typeSelect.setAttribute('aria-label', t('typeTitle'));
    [{ v: 'all', label: t('typeAll') }].concat(TYPE_ORDER.map(function (type) {
      return { v: type, label: t('type' + type.charAt(0).toUpperCase() + type.slice(1)) };
    })).forEach(function (o) {
      var opt = el('option', '', o.label + ' · ' + counts.type[o.v]);
      opt.value = o.v;
      typeSelect.appendChild(opt);
    });
    typeSelect.value = typeFilter;
    typeSelect.addEventListener('change', function () {
      typeFilter = typeSelect.value;
      save(TYPE_KEY, typeFilter);
      view = 'home';
      session = null;
      lastResult = null;
      render();
    });
    filterPanel.appendChild(typeSelect);
    filterPanel.appendChild(el('p', 'filter-note', t('typeNote')));

    var sourceHead = el('div', 'filter-subhead');
    sourceHead.appendChild(el('span', 'filter-label', t('sourceTitle')));
    sourceHead.appendChild(tipIcon(t('sourceTip')));
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
    if (filtersActive()) {
      var scope = el('p', 'progress-scope');
      scope.appendChild(el('span', '', t('progressScope', { n: DATA.length, m: st.total })));
      var clearScope = el('button', 'link-btn', t('clearScope'));
      clearScope.type = 'button';
      clearScope.setAttribute('data-reset-filters', '');
      scope.appendChild(clearScope);
      prog.appendChild(scope);
    }
    var bar = el('div', 'progress-bar');
    var fill = el('div', 'progress-fill');
    fill.style.width = (st.total ? Math.round((st.known / st.total) * 100) : 0) + '%';
    bar.appendChild(fill);
    prog.appendChild(bar);
    var metrics = el('div', 'metrics');
    var streakDays = currentStreak();
    [
      { k: t('knownBadge'), v: String(st.known), tip: t('knownTip') },
      { k: t('dueBadge'), v: String(st.due), tip: t('dueTip') },
      { k: streakDays ? t('streakLabel', { n: streakDays }) : t('streakNone'), v: '🔥 ' + streakDays, tip: t('streakTip') },
    ].forEach(function (m) {
      var box = el('div', 'metric');
      box.appendChild(el('strong', '', m.v));
      var label = el('span', '', m.k);
      box.appendChild(label);
      box.appendChild(tipIcon(m.tip));
      metrics.appendChild(box);
    });
    prog.appendChild(metrics);
    var ps = phraseStats();
    if (ps.total) {
      prog.appendChild(el('p', 'progress-phrase tiny muted', t('phraseStats', { k: ps.known, t: ps.total, d: ps.due })));
    }
    app.appendChild(prog);

    var modes = el('section', 'modes');
    var modesHead = el('h2', 'modes-title', t('modesTitle'));
    app.appendChild(modesHead);
    [
      { v: 'flash', icon: '🃏', name: t('modeFlash'), desc: t('modeFlashDesc') },
      { v: 'match', icon: '🧩', name: t('modeMatch'), desc: t('modeMatchDesc') },
      { v: 'quiz', icon: '⚡', name: t('modeQuiz'), desc: t('modeQuizDesc') },
      { v: 'phrase', icon: '🔗', name: t('modePhrase'), desc: t('modePhraseDesc') },
    ].forEach(function (m) {
      var card = el('button', 'mode-card');
      card.type = 'button';
      card.setAttribute('data-mode', m.v);
      if (m.v !== 'flash' && list.length < 2) {
        card.disabled = true;
        card.classList.add('is-disabled');
        card.setAttribute('aria-disabled', 'true');
      }
      if (m.v === 'phrase' && !list.some(function (w) { return w.phrases && w.phrases.length; })) {
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

  function appendExtraSenses(card, w) {
    if (!w.extraSenses || !w.extraSenses.length) return;
    var box = el('div', 'extra-senses');
    box.appendChild(el('p', 'answer-label', t('otherMeanings')));
    w.extraSenses.forEach(function (sense) {
      var item = el('div', 'extra-sense');
      item.appendChild(el('p', 'extra-zh', sense.zh));
      if (sense.exEn) item.appendChild(el('p', 'extra-ex', sense.exEn));
      if (sense.exZh) item.appendChild(el('p', 'extra-ex-zh', sense.exZh));
      box.appendChild(item);
    });
    card.appendChild(box);
  }

  function appendPhrases(card, w) {
    if (!w.phrases || !w.phrases.length) return;
    var box = el('div', 'phrases');
    box.appendChild(el('p', 'answer-label', t('phrasesLabel')));
    w.phrases.forEach(function (ph) {
      var item = el('div', 'phrase');
      item.appendChild(el('p', 'phrase-p', ph.p));
      item.appendChild(el('p', 'phrase-zh', ph.zh));
      if (ph.exEn) item.appendChild(el('p', 'extra-ex', ph.exEn));
      if (ph.exZh) item.appendChild(el('p', 'extra-ex-zh', ph.exZh));
      box.appendChild(item);
    });
    card.appendChild(box);
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
    meta.appendChild(el('span', 'badge type', typeText(w)));
    meta.appendChild(
      el(
        'span',
        'badge source-' + wordSource(w),
        wordSource(w) === 'curated' ? t('sourceCuratedBadge') : t('sourceDictBadge')
      )
    );
    if (w.exEn) meta.appendChild(el('span', 'badge example', t('exampleBadge')));
    if (w.extraSenses && w.extraSenses.length) meta.appendChild(el('span', 'badge multi', t('multiSenseBadge')));
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
      appendExtraSenses(answer, w);
      appendPhrases(answer, w);
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
    qmeta.appendChild(el('span', 'badge type', typeText(w)));
    qmeta.appendChild(
      el(
        'span',
        'badge source-' + wordSource(w),
        wordSource(w) === 'curated' ? t('sourceCuratedBadge') : t('sourceDictBadge')
      )
    );
    if (w.exEn) qmeta.appendChild(el('span', 'badge example', t('exampleBadge')));
    if (w.extraSenses && w.extraSenses.length) qmeta.appendChild(el('span', 'badge multi', t('multiSenseBadge')));
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
      appendExtraSenses(card, w);
      appendPhrases(card, w);
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

    function advance() {
      if (!session || session.kind !== 'quiz' || session.picked === null) return;
      session.pos += 1;
      session.picked = null;
      session.itemAt = Date.now();
      if (session.pos >= session.queue.length) finishSession();
      else {
        session.options = makeOptions(session.queue[session.pos]);
        render();
      }
    }

    if (ok) {
      // 答中先朗讀英文生字；朗讀完再停 1 秒才跳下一題。
      var answer = w.en;
      var answerLang = 'en-US';
      speak(answer, answerLang, function () {
        window.setTimeout(advance, 1000);
      });
    } else {
      // 答錯保留原本 720ms 回饋，再加 1 秒才跳題。
      window.setTimeout(advance, 1720);
    }
  }

  function startPhrase() {
    var all = [];
    currentWords().forEach(function (w) {
      if (!w.phrases || !w.phrases.length) return;
      w.phrases.forEach(function (row) { all.push({ word: w, target: row }); });
    });
    if (!all.length) {
      view = 'home';
      render();
      return;
    }
    var dueItems = all.filter(function (it) { return phraseDue(it.target.p); });
    var restItems = all.filter(function (it) { return !phraseDue(it.target.p); });
    var items = shuffled(dueItems).concat(shuffled(restItems)).slice(0, Math.min(12, all.length));
    session = {
      kind: 'phrase',
      queue: items,
      pos: 0,
      answered: 0,
      correct: 0,
      options: makePhraseOptions(items[0], currentWords()),
      picked: null,
      combo: 0,
      startedAt: Date.now(),
      itemAt: Date.now(),
      mission: false,
    };
    view = 'phrase';
    render();
  }

  function makePhraseOptions(item, pool) {
    var correct = item.target.p;
    var others = [];
    item.word.phrases.forEach(function (row) {
      if (row.p !== correct) others.push(row.p);
    });
    var withPhrases = (pool || []).filter(function (w) { return w.phrases && w.phrases.length; });
    var candidates = shuffled(withPhrases).map(function (w) { return w.phrases[Math.floor(Math.random() * w.phrases.length)].p; });
    candidates.forEach(function (p) {
      if (p !== correct && others.indexOf(p) === -1) others.push(p);
    });
    var distractors = shuffled(others).slice(0, 2);
    return shuffled([correct].concat(distractors));
  }

  function renderPhrase() {
    if (!session || !session.queue.length) {
      view = 'home';
      render();
      return;
    }
    var item = session.queue[session.pos];
    var w = item.word;
    app.appendChild(topbarFor('phrase'));

    var card = el('section', 'quiz-card phrase-card');
    var top = el('div', 'quiz-top');
    top.appendChild(el('span', 'badge', t('modePhrase')));
    if (session.combo > 1) top.appendChild(el('span', 'combo', t('combo', { n: session.combo })));
    card.appendChild(top);
    card.appendChild(el('p', 'prompt-label', t('phraseHint')));
    card.appendChild(el('p', 'term', w.en));
    card.appendChild(el('p', 'phrase-target', item.target.zh));

    var options = el('div', 'options');
    session.options.forEach(function (opt, i) {
      var b = el('button', 'option');
      b.type = 'button';
      b.setAttribute('data-option', String(i));
      b.textContent = opt;
      if (session.picked !== null) {
        if (opt === item.target.p) b.classList.add('is-correct');
        else if (i === session.picked) b.classList.add('is-wrong');
      }
      options.appendChild(b);
    });
    card.appendChild(options);
    if (session.picked !== null) {
      var ok = session.options[session.picked] === item.target.p;
      card.appendChild(el('p', 'feedback ' + (ok ? 'ok' : 'bad'), ok ? t('correct') : t('wrong')));
      if (item.target.exEn) card.appendChild(el('p', 'extra-ex', item.target.exEn));
      if (item.target.exZh) card.appendChild(el('p', 'extra-ex-zh', item.target.exZh));
    }
    app.appendChild(card);
  }

  function choosePhrase(index) {
    if (!session || session.kind !== 'phrase' || session.picked !== null) return;
    var item = session.queue[session.pos];
    var ok = session.options[index] === item.target.p;
    session.picked = index;
    session.answered += 1;
    markPhrase(item.target.p, ok);
    if (ok) {
      session.correct += 1;
      session.combo += 1;
    } else {
      session.combo = 0;
    }
    render();

    function advance() {
      if (!session || session.kind !== 'phrase' || session.picked === null) return;
      session.pos += 1;
      session.picked = null;
      session.itemAt = Date.now();
      if (session.pos >= session.queue.length) finishSession();
      else {
        session.options = makePhraseOptions(session.queue[session.pos], currentWords());
        render();
      }
    }

    if (ok) {
      var moved = false;
      var go = function () {
        if (moved) return;
        moved = true;
        advance();
      };
      speak(item.target.p, 'en-US', function () {
        window.setTimeout(go, 900);
      });
      window.setTimeout(go, 2500);
    } else {
      window.setTimeout(advance, 1600);
    }
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
          : lastResult.kind === 'phrase'
            ? t('modePhrase')
            : t('modeQuiz');
    box.appendChild(el('p', 'result-kicker', lastResult.mission ? t('missionBadge') : kicker));
    var title =
      lastResult.kind === 'flash'
        ? t('resultFlash')
        : lastResult.kind === 'match'
          ? t('resultMatch')
          : lastResult.kind === 'phrase'
            ? t('modePhrase')
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
    else if (view === 'phrase') renderPhrase();
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
      typeFilter = 'all';
      save(NEED_KEY, need);
      save(BAND_KEY, band);
      save(SOURCE_KEY, sourceFilter);
      save(TYPE_KEY, typeFilter);
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
      else if (mode === 'phrase') startPhrase();
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
      if (session && session.kind === 'phrase') choosePhrase(Number(target.getAttribute('data-option')));
      else chooseOption(Number(target.getAttribute('data-option')));
      return;
    }
    if (target.hasAttribute('data-speak')) {
      if (session) {
        var sw =
          (view === 'quiz' || view === 'phrase') && session.queue
            ? session.queue[session.pos]
            : view === 'flash' && session.queue
              ? session.queue[session.pos]
              : null;
        if (sw) {
          if (view === 'phrase' && sw.target) speak(sw.target.p);
          else speak(term(sw));
        }
      }
      return;
    }
    if (target.hasAttribute('data-replay')) {
      var kind = lastResult && lastResult.kind;
      lastResult = null;
      if (kind === 'flash') startFlash();
      else if (kind === 'match') startMatch();
      else if (kind === 'quiz') startQuiz();
      else if (kind === 'phrase') startPhrase();
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

  function openDeepLink() {
    var match = /(?:^#|&)word=([^&]+)/.exec(location.hash || '');
    if (!match) return false;
    var wanted = decodeURIComponent(match[1]).toLowerCase();
    var row = DATA.find(function (w) { return String(w.en || '').toLowerCase() === wanted; });
    if (!row) return false;
    startFlash([row]);
    return true;
  }

  if (!openDeepLink()) render();
})();
