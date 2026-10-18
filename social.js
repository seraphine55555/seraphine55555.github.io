/**
 * 門戶頁「讚好／留言／分享」（2026-10-18）。
 *
 * 設計：
 *  - 只有門戶頁需要網絡；兩個 app（讀默／數練）本身仍然完全離線、冇 INTERNET 權限。
 *  - 資料存 Supabase（Postgres + PostgREST），anon key 係公開嘅，靠 RLS 限制寫入。
 *    呢個 key **唔係** secret；絕對唔可以喺呢個檔放 service_role key。
 *  - `social.config.js` 留空（預設）⇒ 成個 social 區塊保持 hidden，唔會出壞掣。
 *  - 留言一律用 `textContent` 渲染（唔用 innerHTML）⇒ 用戶輸入唔可能變成 HTML／script。
 *  - 語言切換靠 `document` 嘅 `hub-lang` 事件（由 index.html 嘅 applyLang 發出），
 *    日期同「匿名」等 JS 砌出嚟嘅字會重新渲染。
 *
 * 設定步驟見 docs/social-setup.md；SQL 見 sql/social.sql。
 */
(function () {
  'use strict';

  var cfg = window.HUB_SOCIAL || {};
  var base = String(cfg.supabaseUrl || '').replace(/\/+$/, '');
  var anon = String(cfg.anonKey || '');

  /* ⚠️ 2026-10-18：HUB_I18N 喺 index.html 嘅主 script 尾段才定義，而 social.js
     係喺主 script **之前**載入（要趕得切聽 hub-lang 事件）。所以呢度唔可以
     喺 top-level 就斷定 i18n 唔存在 —— 一律等 DOMContentLoaded 之後才 bind。 */
  function t(key, vars) {
    var api = window.HUB_I18N;
    return api ? api.t(key, vars) : key;
  }

  function langNow() {
    var api = window.HUB_I18N;
    return api ? api.lang() : 'zh';
  }

  /* 未配置（預設）：保持 hidden，連一個 fetch 都唔會發，亦唔會嘈 console。 */
  if (!base || !anon) return;

  /* 最小長度檢查：防止貼錯成個 project URL 都唔覺 */
  if (anon.length < 20) {
    if (window.console) console.warn('[social] anon key 似係未填好，功能關閉');
    return;
  }

  var LIKE_TABLE = cfg.likeTable || 'app_likes';
  var LIKE_RPC = cfg.likeRpc || 'like_app';
  var COMMENT_TABLE = cfg.commentTable || 'app_comments';
  var MAX_LEN = 300;

  /** 每個 app 嘅狀態（留言快取，用嚟切語言時重畫）。 */
  var apps = {};

  /**
   * 兩種 key 都要支援：
   *   - 新 publishable key（sb_publishable_…）：只放 apikey header；放 Bearer 會因為唔係 JWT 被拒。
   *   - 舊 legacy anon key（eyJ…）：apikey ＋ Authorization: Bearer 兩樣都放。
   * 2026-10-18 實測：新 project 預設只出 publishable key，anon 要喺 legacy 分頁 copy。
   */
  var IS_PUBLISHABLE = /^sb_publishable_/.test(anon);

  function headers() {
    var h = { apikey: anon, 'Content-Type': 'application/json' };
    if (!IS_PUBLISHABLE) h.Authorization = 'Bearer ' + anon;
    return h;
  }

  function rest(path, options) {
    var opts = options || {};
    var init = {
      method: opts.method || 'GET',
      headers: Object.assign({}, headers(), opts.headers || {}),
    };
    if (opts.body !== undefined) init.body = JSON.stringify(opts.body);
    return fetch(base + '/rest/v1/' + path, init).then(function (res) {
      if (!res.ok) {
        return res.text().then(function (text) {
          throw new Error('HTTP ' + res.status + ' ' + String(text || '').slice(0, 160));
        });
      }
      if (res.status === 204) return null;
      return res.json();
    });
  }

  function fmtDate(iso) {
    var api = window.HUB_I18N;
    var lang = langNow();
    var locale = (api && api.locales && api.locales[lang]) || 'zh-Hant-HK';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    try {
      return d.toLocaleString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return d.toISOString().slice(0, 16).replace('T', ' ');
    }
  }

  function setStatus(node, text, isError) {
    if (!node) return;
    node.textContent = text || '';
    node.style.color = isError ? 'var(--danger, #e5544b)' : 'var(--ok, #59b36b)';
    if (node.__timer) window.clearTimeout(node.__timer);
    if (text) {
      node.__timer = window.setTimeout(function () {
        node.textContent = '';
      }, 4000);
    }
  }

  function appLabel(root) {
    var h3 = root.closest('.app') && root.closest('.app').querySelector('h3');
    return h3 ? h3.textContent.trim() : '';
  }

  function renderComments(state) {
    var list = state.list;
    var empty = state.empty;
    var count = state.countBadge;
    list.textContent = '';
    state.comments.forEach(function (c) {
      var li = document.createElement('li');
      var text = document.createElement('span');
      text.className = 'comment-text';
      text.textContent = c.body; /* XSS-safe：用戶輸入永遠係文字 */
      var meta = document.createElement('span');
      meta.className = 'comment-meta';
      meta.textContent = fmtDate(c.created_at) + ' · ' + t('social.anonymous');
      li.appendChild(text);
      li.appendChild(meta);
      list.appendChild(li);
    });
    empty.hidden = state.comments.length > 0;
    count.hidden = state.comments.length === 0;
    count.textContent = state.comments.length ? '(' + state.comments.length + ')' : '';
  }

  function refreshLike(state) {
    state.likeCount.textContent = String(state.likes);
    state.like.setAttribute('aria-pressed', state.liked ? 'true' : 'false');
    state.like.setAttribute('aria-label', t('social.likeAria', { n: state.likes }));
    state.like.querySelector('.heart').textContent = state.liked ? '♥' : '♡';
  }

  function loadLikes(state) {
    return rest(
      LIKE_TABLE +
        '?select=count&app_slug=eq.' +
        encodeURIComponent(state.slug)
    )
      .then(function (rows) {
        var row = Array.isArray(rows) ? rows[0] : rows;
        state.likes = row && typeof row.count === 'number' ? row.count : 0;
        refreshLike(state);
      })
      .catch(function () {
        /* 讀唔到就顯示 0，唔好令成頁爆 */
        state.likes = state.likes || 0;
        refreshLike(state);
      });
  }

  function loadComments(state) {
    return rest(
      COMMENT_TABLE +
        '?select=id,body,created_at&app_slug=eq.' +
        encodeURIComponent(state.slug) +
        '&hidden=eq.false&order=created_at.desc&limit=50'
    )
      .then(function (rows) {
        state.comments = Array.isArray(rows) ? rows : [];
        renderComments(state);
      })
      .catch(function () {
        state.comments = [];
        renderComments(state);
      });
  }

  function onLike(state) {
    if (state.busyLike) return;
    state.busyLike = true;
    state.like.disabled = true;
    rest('rpc/' + LIKE_RPC, { method: 'POST', body: { p_slug: state.slug } })
      .then(function (result) {
        var n = typeof result === 'number' ? result : Array.isArray(result) ? result[0] : result && result.count;
        state.likes = typeof n === 'number' ? n : state.likes + 1;
        state.liked = true;
        try {
          localStorage.setItem('hub/liked/' + state.slug, '1');
        } catch (e) {
          /* 私密模式：唔記住都唔影響今次 */
        }
        refreshLike(state);
      })
      .catch(function () {
        setStatus(state.status, t('social.likeFail'), true);
      })
      .finally(function () {
        state.busyLike = false;
        state.like.disabled = false;
      });
  }

  function onShare(state, root) {
    var url = new URL(state.slug + '/', window.location.href).href;
    var data = {
      title: appLabel(root),
      text: root.closest('.app').querySelector('.tag').textContent.trim(),
      url: url,
    };
    if (navigator.share) {
      navigator.share(data).catch(function () {
        /* 用戶取消：唔算錯 */
      });
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(
        function () {
          setStatus(state.status, t('social.shareCopied'));
        },
        function () {
          setStatus(state.status, t('social.shareFail'), true);
        }
      );
      return;
    }
    setStatus(state.status, t('social.shareFail'), true);
  }

  function bind(root) {
    var slug = root.getAttribute('data-app');
    if (!slug) return;

    var state = {
      slug: slug,
      root: root,
      like: root.querySelector('[data-like]'),
      likeCount: root.querySelector('[data-like-count]'),
      share: root.querySelector('[data-share]'),
      toggle: root.querySelector('[data-comments-toggle]'),
      panel: root.querySelector('[data-comments]'),
      list: root.querySelector('[data-comment-list]'),
      empty: root.querySelector('[data-comments-empty]'),
      countBadge: root.querySelector('[data-comment-count]'),
      form: root.querySelector('[data-comment-form]'),
      input: root.querySelector('[data-comment-input]'),
      send: root.querySelector('[data-comment-send]'),
      status: root.querySelector('[data-comment-status]'),
      likes: 0,
      liked: false,
      comments: [],
      busyLike: false,
      loaded: false,
    };
    apps[slug] = state;

    try {
      state.liked = localStorage.getItem('hub/liked/' + slug) === '1';
    } catch (e) {
      state.liked = false;
    }

    root.hidden = false;
    refreshLike(state);
    loadLikes(state);

    state.like.addEventListener('click', function () {
      onLike(state);
    });

    state.share.addEventListener('click', function () {
      onShare(state, root);
    });

    state.toggle.addEventListener('click', function () {
      var open = state.panel.hidden;
      state.panel.hidden = !open;
      state.toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open && !state.loaded) {
        state.loaded = true;
        state.empty.textContent = t('social.loading');
        state.empty.hidden = false;
        loadComments(state);
      }
      if (open) state.input.focus();
    });

    state.form.addEventListener('submit', function (event) {
      event.preventDefault();
      var body = state.input.value.trim();
      if (!body) {
        state.input.focus();
        return;
      }
      if (body.length > MAX_LEN) {
        setStatus(state.status, t('social.fail'), true);
        return;
      }
      state.send.disabled = true;
      setStatus(state.status, t('social.loading'));
      rest(COMMENT_TABLE, {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: { app_slug: slug, body: body },
      })
        .then(function (rows) {
          var row = Array.isArray(rows) ? rows[0] : rows;
          if (row) state.comments.unshift(row);
          else state.comments.unshift({ body: body, created_at: new Date().toISOString() });
          state.input.value = '';
          renderComments(state);
          setStatus(state.status, t('social.sent'));
        })
        .catch(function () {
          setStatus(state.status, t('social.fail'), true);
        })
        .finally(function () {
          state.send.disabled = false;
        });
    });
  }

  function bindAll() {
    /* 主 script 未跑完（或者壞咗）就唔好出半截 UI */
    if (!window.HUB_I18N) return;
    var nodes = document.querySelectorAll('.social[data-app]');
    for (var i = 0; i < nodes.length; i++) bind(nodes[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindAll);
  } else {
    bindAll();
  }

  /* 語言切換：日期／「匿名」/aria-label 係 JS 砌，唔會自動更新 */
  document.addEventListener('hub-lang', function () {
    Object.keys(apps).forEach(function (slug) {
      var state = apps[slug];
      refreshLike(state);
      if (state.loaded) renderComments(state);
    });
  });
})();
