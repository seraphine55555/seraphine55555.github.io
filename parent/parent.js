/* 家長總覽（2026-10-24）
 *
 * 設計目標：**唔硬編碼 app**。app 清單來自 ../apps.json；每個 app 用一個
 * adapter 讀自己嘅 localStorage。新 app 只需要：
 *   1. 喺 apps.json 加一行（id／名／icon／href／adapter）
 *   2. 如果佢會寫 HubProgress.log，將 events 設 true
 *   3. 喺 parent.js 加一個 adapter（或者 adapter: 'none' 只看 events）
 *
 * 全部資料只喺呢部機讀，冇 fetch 去第三方、冇上傳。
 */
(function () {
  'use strict';

  var LKEY = 'parent/lang';
  var LANGS = ['yue', 'zh', 'en'];
  var lang = 'zh';

  var DICT = {
    title: ['家長總覽', '家長總覽', 'Parent overview'],
    sub: ['四個 app 嘅本機進度', '四個 app 的本機進度', 'Local progress across the apps'],
    loading: ['讀取進度中…', '讀取進度中…', 'Loading progress…'],
    error: ['讀唔到 app 清單。', '讀不到 app 清單。', 'Could not load the app list.'],
    retry: ['再試', '再試', 'Retry'],
    statWeek: ['近 7 日練習', '近 7 日練習', 'Last 7 days'],
    statAccuracy: ['總答對率', '總答對率', 'Overall accuracy'],
    statApps: ['用過嘅 app', '用過的 app', 'Apps used'],
    statLast: ['最後活動', '最後活動', 'Last activity'],
    questions: ['{n} 題', '{n} 題', '{n} questions'],
    accuracyHint: ['共 {n} 題有答案', '共 {n} 題有答案', '{n} graded answers'],
    appsHint: ['{n} / {total}', '{n} / {total}', '{n} / {total}'],
    chartTitle: ['每日練習量', '每日練習量', 'Daily practice'],
    chartEmpty: [
      '未有每日記錄。做一次練習之後，呢度會由今日開始累積。',
      '未有每日記錄。做一次練習之後，這裡會由今天開始累積。',
      'No daily records yet. After one practice session, days will start filling in from today.',
    ],
    chartAria: ['近 7 日每日練習題數', '近 7 日每日練習題數', 'Practice questions per day, last 7 days'],
    appsTitle: ['各 app 進度', '各 app 進度', 'Progress by app'],
    attemptsLabel: ['練習', '練習', 'Attempts'],
    accuracyLabel: ['答對', '答對', 'Accuracy'],
    timeLabel: ['累計', '累計', 'Time'],
    noData: ['未有記錄', '未有記錄', 'No records yet'],
    noTime: ['未有時間記錄', '未有時間記錄', 'No timestamp'],
    open: ['開啟', '開啟', 'Open'],
    today: ['今日', '今天', 'Today'],
    yesterday: ['昨日', '昨天', 'Yesterday'],
    daysAgo: ['{n} 日前', '{n} 日前', '{n} days ago'],
    minutes: ['{n} 分鐘', '{n} 分鐘', '{n} min'],
    privacy: [
      '全部進度只喺呢部機讀取，唔會上傳。清除瀏覽器資料就會冇咗紀錄。',
      '全部進度只在這一台裝置讀取，不會上傳。清除瀏覽器資料就會失去紀錄。',
      'Everything is read on this device and never uploaded. Clearing browser data erases the history.',
    ],
    back: ['← 返回門戶', '← 返回門戶', '← Back to portal'],
    noGraded: ['—', '—', '—'],
  };

  try {
    var saved = localStorage.getItem(LKEY);
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

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function safeParse(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function dayKey(ts) {
    var d = new Date(ts);
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function emptyStats() {
    return { attempts: 0, correct: 0, graded: 0, lastAt: 0, ms: 0, daily: {} };
  }

  function addDaily(stats, ts, attempts, correct) {
    if (!ts || !isFinite(ts)) return;
    var key = dayKey(ts);
    var row = stats.daily[key] || { attempts: 0, correct: 0 };
    row.attempts += attempts;
    row.correct += correct;
    stats.daily[key] = row;
  }

  /* ---------------------------------------------------------- adapters */
  function adDictalab() {
    var stats = emptyStats();
    var data = safeParse('dictalab/v1', null);
    if (!data || !Array.isArray(data.sessions)) return stats;
    data.sessions.forEach(function (s) {
      if (!s || typeof s !== 'object') return;
      var results = Array.isArray(s.results) ? s.results : [];
      var at = typeof s.endedAt === 'number' ? s.endedAt : s.startedAt;
      var correct = results.filter(function (r) {
        return r && r.known === true;
      }).length;
      stats.attempts += results.length;
      stats.correct += correct;
      stats.graded += results.length;
      if (typeof at === 'number' && at > stats.lastAt) stats.lastAt = at;
      if (typeof s.startedAt === 'number' && typeof s.endedAt === 'number') {
        var dur = s.endedAt - s.startedAt;
        if (dur > 0 && dur < 2 * 60 * 60 * 1000) stats.ms += dur;
      }
      addDaily(stats, at, results.length, correct);
    });
    return stats;
  }

  function adMathslab() {
    var stats = emptyStats();
    var data = safeParse('mathslab.state.v1', null);
    if (!data || !Array.isArray(data.attempts)) return stats;
    data.attempts.forEach(function (a) {
      if (!a || typeof a !== 'object') return;
      var ok = typeof a.score === 'number' && a.score >= 1;
      stats.attempts += 1;
      stats.graded += 1;
      if (ok) stats.correct += 1;
      if (typeof a.ms === 'number' && a.ms > 0 && a.ms < 15 * 60 * 1000) stats.ms += a.ms;
      if (typeof a.t === 'number' && a.t > stats.lastAt) stats.lastAt = a.t;
      addDaily(stats, a.t, 1, ok ? 1 : 0);
    });
    return stats;
  }

  function loadPassages() {
    if (window.READING_PASSAGES) return Promise.resolve(window.READING_PASSAGES);
    return new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = '../reading/passages.js';
      s.onload = function () {
        resolve(window.READING_PASSAGES || null);
      };
      s.onerror = function () {
        resolve(null);
      };
      document.head.appendChild(s);
    });
  }

  function adReading() {
    var answers = safeParse('reading/answers', null);
    var hasAnswers = answers && typeof answers === 'object' && Object.keys(answers).length > 0;
    if (!hasAnswers) return Promise.resolve(emptyStats());
    return loadPassages().then(function (passages) {
      var stats = emptyStats();
      var byId = {};
      (passages || []).forEach(function (p) {
        if (p && p.id) byId[p.id] = p;
      });
      Object.keys(answers).forEach(function (pid) {
        var given = answers[pid];
        if (!given || typeof given !== 'object') return;
        Object.keys(given).forEach(function (qi) {
          if (typeof given[qi] !== 'number') return;
          stats.attempts += 1;
          stats.graded += 1;
          var p = byId[pid];
          var q = p && p.questions ? p.questions[Number(qi)] : null;
          if (q && given[qi] === q.answer) stats.correct += 1;
        });
      });
      return stats;
    });
  }

  function adSentence() {
    var stats = emptyStats();
    var prog = safeParse('sentence/progress', null);
    if (!prog || typeof prog !== 'object') return stats;
    Object.keys(prog).forEach(function (id) {
      var row = prog[id];
      if (!row || typeof row !== 'object') return;
      var tries = Number(row.tries) || 0;
      var correct = Number(row.correct) || 0;
      stats.attempts += tries;
      stats.graded += tries;
      stats.correct += correct;
      if (typeof row.last === 'string') {
        var at = Date.parse(row.last);
        if (isFinite(at) && at > stats.lastAt) stats.lastAt = at;
      }
    });
    return stats;
  }

  function adapterFor(name) {
    if (name === 'dictalab') return Promise.resolve(adDictalab());
    if (name === 'mathslab') return Promise.resolve(adMathslab());
    if (name === 'reading') return adReading();
    if (name === 'sentence') return Promise.resolve(adSentence());
    return Promise.resolve(emptyStats());
  }

  /* ------------------------------------------------------------ events */
  function eventStats() {
    var list = window.HubProgress ? window.HubProgress.all() : [];
    var byApp = {};
    list.forEach(function (ev) {
      if (!ev || !ev.app) return;
      var row = byApp[ev.app] || (byApp[ev.app] = emptyStats());
      row.attempts += 1;
      row.graded += 1;
      if (ev.correct) row.correct += 1;
      if (typeof ev.at === 'number' && ev.at > row.lastAt) row.lastAt = ev.at;
      addDaily(row, ev.at, 1, ev.correct ? 1 : 0);
    });
    return byApp;
  }

  /* ------------------------------------------------------------ totals */
  function mergeStats(base, events, useEventDaily) {
    /* 累計用 adapter（佢知道歷史）；如果 adapter 乜都冇但 events 有，就用 events。
       每日圖：app 已經改為寫 HubProgress 嘅，用 events 嘅每日數，避免 adapter
       同 events 重複計；未改嘅 app 用 adapter 自己嘅時間戳。 */
    var baseDaily = base.daily || {};
    var eventDaily = events.daily || {};
    var daily = useEventDaily || !Object.keys(baseDaily).length ? eventDaily : baseDaily;
    return {
      attempts: base.attempts || events.attempts,
      correct: base.attempts ? base.correct : events.correct,
      graded: base.attempts ? base.graded : events.graded,
      lastAt: Math.max(base.lastAt || 0, events.lastAt || 0),
      ms: base.ms || 0,
      daily: daily,
    };
  }

  function lastSeven() {
    var out = [];
    var now = new Date();
    for (var i = 6; i >= 0; i--) {
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      out.push({ key: dayKey(d.getTime()), date: d });
    }
    return out;
  }

  function weekdayLabel(date) {
    try {
      return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'zh-HK', {
        weekday: 'short',
      }).format(date);
    } catch (e) {
      return String(date.getDay());
    }
  }

  function pct(correct, graded) {
    if (!graded) return null;
    return Math.round((correct / graded) * 100);
  }

  function fmtRelative(ts) {
    if (!ts) return '';
    var today = new Date();
    var start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    var day = 24 * 60 * 60 * 1000;
    var d = new Date(ts);
    var hh = String(d.getHours()).padStart(2, '0');
    var mm = String(d.getMinutes()).padStart(2, '0');
    if (ts >= start) return t('today') + ' ' + hh + ':' + mm;
    if (ts >= start - day) return t('yesterday') + ' ' + hh + ':' + mm;
    var days = Math.floor((start - ts) / day) + 1;
    if (days < 7) return t('daysAgo', { n: days });
    try {
      return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'zh-HK', {
        month: 'short',
        day: 'numeric',
      }).format(d);
    } catch (e) {
      return d.toLocaleDateString();
    }
  }

  /* ------------------------------------------------------------ render */
  var app = document.getElementById('app');
  var registry = null;
  var loaded = null;

  function renderError() {
    app.replaceChildren();
    var box = el('div', 'error');
    box.appendChild(el('p', null, t('error')));
    var btn = el('button', 'btn primary', t('retry'));
    btn.type = 'button';
    btn.addEventListener('click', boot);
    box.appendChild(btn);
    app.appendChild(box);
  }

  function render() {
    if (!registry) return;
    var cards = registry.apps || [];
    var evByApp = eventStats();
    var summaries = loaded || [];

    app.replaceChildren();
    app.appendChild(el('h1', null, t('title')));
    app.appendChild(el('p', 'sub', t('sub')));

    var totalAttempts = 0;
    var totalCorrect = 0;
    var totalGraded = 0;
    var lastAt = 0;
    var used = 0;
    var week = 0;
    var days = lastSeven();
    var dayMap = {};
    days.forEach(function (d) {
      dayMap[d.key] = 0;
    });

    var rows = cards.map(function (meta, i) {
      var sum = mergeStats(summaries[i] || emptyStats(), evByApp[meta.id] || emptyStats(), meta.events);
      totalAttempts += sum.attempts;
      totalCorrect += sum.correct;
      totalGraded += sum.graded;
      if (sum.attempts > 0) used += 1;
      if (sum.lastAt > lastAt) lastAt = sum.lastAt;
      Object.keys(dayMap).forEach(function (key) {
        var row = sum.daily && sum.daily[key];
        if (row && row.attempts) dayMap[key] += row.attempts;
      });
      return { meta: meta, sum: sum };
    });

    var statGrid = el('div', 'stats');
    function stat(key, value, hint) {
      var box = el('div', 'stat');
      box.setAttribute('data-stat', key);
      box.appendChild(el('p', 'label', t(key)));
      box.appendChild(el('p', 'value', value));
      if (hint) box.appendChild(el('p', 'hint', hint));
      statGrid.appendChild(box);
    }
    days.forEach(function (d) {
      week += dayMap[d.key] || 0;
    });
    stat('statWeek', t('questions', { n: week }));
    var acc = pct(totalCorrect, totalGraded);
    stat('statAccuracy', acc == null ? t('noGraded') : acc + '%', t('accuracyHint', { n: totalGraded }));
    stat('statApps', t('appsHint', { n: used, total: cards.length }));
    stat('statLast', lastAt ? fmtRelative(lastAt) : t('noData'));
    app.appendChild(statGrid);

    /* chart */
    var chartSection = el('section');
    chartSection.appendChild(el('h2', null, t('chartTitle')));
    var card = el('div', 'chart-card');
    var chart = el('div', 'chart');
    chart.setAttribute('role', 'img');
    chart.setAttribute('aria-label', t('chartAria'));
    var max = 1;
    days.forEach(function (d) {
      if (dayMap[d.key] > max) max = dayMap[d.key];
    });
    days.forEach(function (d) {
      var n = dayMap[d.key] || 0;
      var bar = el('div', 'bar' + (n ? '' : ' is-zero'));
      bar.title = d.key + '：' + n;
      bar.appendChild(el('span', 'n', String(n)));
      var fill = el('span', 'fill');
      fill.style.height = Math.max(2, Math.round((n / max) * 100)) + '%';
      bar.appendChild(fill);
      bar.appendChild(el('span', 'day', weekdayLabel(d.date)));
      chart.appendChild(bar);
    });
    card.appendChild(chart);
    if (!week) card.appendChild(el('p', 'empty', t('chartEmpty')));
    chartSection.appendChild(card);
    app.appendChild(chartSection);

    /* app cards */
    var appsSection = el('section');
    appsSection.appendChild(el('h2', null, t('appsTitle')));
    var list = el('div', 'apps');
    rows.forEach(function (row) {
      var meta = row.meta;
      var sum = row.sum;
      var box = el('article', 'app-card');
      box.setAttribute('data-app', meta.id);
      var img = document.createElement('img');
      img.src = '../' + meta.icon;
      img.alt = '';
      img.width = 44;
      img.height = 44;
      img.loading = 'lazy';
      box.appendChild(img);

      var body = el('div', 'body');
      body.appendChild(el('h3', null, (meta.name && (meta.name[lang] || meta.name.zh)) || meta.id));
      body.appendChild(el('p', 'tag', (meta.tag && (meta.tag[lang] || meta.tag.zh)) || ''));
      var metrics = el('p', 'metrics');
      var a = el('span');
      a.appendChild(document.createTextNode(t('attemptsLabel') + ' '));
      a.appendChild(el('b', null, String(sum.attempts)));
      metrics.appendChild(a);
      var p = pct(sum.correct, sum.graded);
      var b = el('span');
      b.appendChild(document.createTextNode(t('accuracyLabel') + ' '));
      b.appendChild(el('b', null, p == null ? t('noGraded') : p + '%'));
      metrics.appendChild(b);
      if (sum.ms > 0) {
        var c = el('span');
        c.appendChild(document.createTextNode(t('timeLabel') + ' '));
        c.appendChild(el('b', null, t('minutes', { n: Math.max(1, Math.round(sum.ms / 60000)) })));
        metrics.appendChild(c);
      }
      body.appendChild(metrics);
      body.appendChild(
        el(
          'p',
          'last',
          sum.attempts === 0 ? t('noData') : sum.lastAt ? fmtRelative(sum.lastAt) : t('noTime')
        )
      );
      box.appendChild(body);

      var link = el('a', 'btn primary', t('open'));
      link.href = '../' + meta.href;
      box.appendChild(link);
      list.appendChild(box);
    });
    appsSection.appendChild(list);
    app.appendChild(appsSection);
  }

  async function loadAll() {
    var res = await fetch('../apps.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('apps.json HTTP ' + res.status);
    var data = await res.json();
    if (!data || !Array.isArray(data.apps)) throw new Error('apps.json shape');
    registry = data;
    loaded = await Promise.all(
      data.apps.map(function (meta) {
        return adapterFor(meta.adapter);
      })
    );
  }

  async function boot() {
    app.replaceChildren(el('p', 'loading', t('loading')));
    try {
      await loadAll();
      render();
    } catch (e) {
      renderError();
    }
  }

  document.querySelectorAll('[data-lang]').forEach(function (btn) {
    btn.setAttribute('aria-pressed', btn.getAttribute('data-lang') === lang ? 'true' : 'false');
    btn.addEventListener('click', function () {
      var next = btn.getAttribute('data-lang');
      if (LANGS.indexOf(next) < 0) return;
      lang = next;
      try {
        localStorage.setItem(LKEY, lang);
      } catch (e) {}
      document.querySelectorAll('[data-lang]').forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-lang') === lang ? 'true' : 'false');
      });
      document.documentElement.lang = lang === 'en' ? 'en' : 'zh-HK';
      render();
    });
  });
  document.documentElement.lang = lang === 'en' ? 'en' : 'zh-HK';

  var timer = null;
  window.addEventListener('hub-progress', function () {
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () {
      loadAll().then(render).catch(renderError);
    }, 250);
  });

  boot();
})();
