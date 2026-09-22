/**
 * World Dominion — Supabase-compatible client shim (v1.0)
 * ---------------------------------------------------------
 * This file is served from the SAME path the game already loads
 * (/cdn/npm/@supabase/supabase-js@2/dist/umd/supabase.js) and exposes the
 * exact `window.supabase.createClient(...)` API the game uses.
 * Instead of talking to a Supabase project, it talks to this app's own
 * built-in backend:
 *   /api/auth/*   — accounts & sessions (httpOnly cookie)
 *   /api/db/{t}   — table REST (select/insert/update/delete)
 *   /api/rpc/{f}  — stored-procedure style game functions
 *   /api/rt/{ch}  — realtime broadcast channels (SSE + polling fallback)
 * No external service required. Data lives in the app's own database.
 */
(function (global) {
  'use strict';

  var CLIENT_ID = (function () {
    try {
      return 'c-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    } catch (e) { return 'c-anon'; }
  })();

  function b64u(obj) {
    try {
      var s = JSON.stringify(obj);
      if (typeof TextEncoder !== 'undefined') {
        var bytes = new TextEncoder().encode(s);
        var bin = '';
        for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      }
      return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (e) { return ''; }
  }

  function jsonHeaders() {
    return { 'Content-Type': 'application/json', 'X-Client-Id': CLIENT_ID };
  }

  /* ---------------- realtime channel ---------------- */

  function makeChannel(name) {
    var handlers = {};
    var es = null;
    var pollTimer = null;
    var fastPoll = null;
    var lastSeq = 0;
    var closed = false;
    var sseFailed = false;

    function dispatch(ev) {
      if (!ev || typeof ev.seq === 'number') {
        if (ev && typeof ev.seq === 'number') lastSeq = Math.max(lastSeq, ev.seq);
      }
      var list = handlers[ev && ev.event] || [];
      for (var i = 0; i < list.length; i++) {
        try { list[i]({ payload: ev && ev.payload }); } catch (e) {}
      }
    }

    function startPolling(ms) {
      if (pollTimer || closed) return;
      pollTimer = setInterval(function () {
        if (closed) return;
        fetch('/api/rt/' + encodeURIComponent(name) + '?since=' + lastSeq + '&from=' + encodeURIComponent(CLIENT_ID), { cache: 'no-store' })
          .then(function (r) { return r.json(); })
          .then(function (j) { (j.events || []).forEach(dispatch); })
          .catch(function () {});
      }, ms || 2500);
    }

    function start() {
      if (closed) return;
      // 1) safety-net poll that always runs (backfills anything missed)
      startPolling(5000);
      // 2) fast SSE for instant delivery
      try {
        es = new EventSource('/api/rt/' + encodeURIComponent(name) + '/sse?from=' + encodeURIComponent(CLIENT_ID));
        es.onmessage = function (m) {
          try { dispatch(JSON.parse(m.data)); } catch (e) {}
        };
        es.onerror = function () {
          // SSE unavailable (proxy buffering?) → switch to fast polling
          if (es) { try { es.close(); } catch (e) {} es = null; }
          if (!sseFailed) {
            sseFailed = true;
            fastPoll = setInterval(function () {
              if (closed) return;
              fetch('/api/rt/' + encodeURIComponent(name) + '?since=' + lastSeq + '&from=' + encodeURIComponent(CLIENT_ID), { cache: 'no-store' })
                .then(function (r) { return r.json(); })
                .then(function (j) { (j.events || []).forEach(dispatch); })
                .catch(function () {});
            }, 1200);
          }
        };
      } catch (e) {
        sseFailed = true;
        startPolling(1500);
      }
    }

    function stop() {
      closed = true;
      if (es) { try { es.close(); } catch (e) {} es = null; }
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      if (fastPoll) { clearInterval(fastPoll); fastPoll = null; }
    }

    var chObj = {
      __wdChannel: true,
      on: function (type, filter, cb) {
        if (type === 'broadcast' && filter && filter.event && typeof cb === 'function') {
          if (!handlers[filter.event]) handlers[filter.event] = [];
          handlers[filter.event].push(cb);
        }
        return chObj;
      },
      send: function (msg) {
        if (msg && msg.type === 'broadcast') {
          return fetch('/api/rt/' + encodeURIComponent(name), {
            method: 'POST',
            headers: jsonHeaders(),
            body: JSON.stringify({ event: msg.event, payload: msg.payload, from: CLIENT_ID }),
          }).then(function () { return 'ok'; }).catch(function () { return 'error'; });
        }
        return Promise.resolve('ok');
      },
      subscribe: function (cb) {
        start();
        if (typeof cb === 'function') { try { cb('SUBSCRIBED'); } catch (e) {} }
        return Promise.resolve('SUBSCRIBED');
      },
      unsubscribe: function () { stop(); return Promise.resolve('ok'); },
      _stop: stop,
    };
    return chObj;
  }

  /* ---------------- query builder ---------------- */

  function execQuery(q) {
    var qs = b64u({
      select: q.select,
      filters: q.filters,
      order: q.order,
      limit: q.limit,
      single: q.single,
      maybeSingle: q.maybeSingle,
    });
    var op = q.op || 'select';

    if (op === 'select') {
      return fetch('/api/db/' + encodeURIComponent(q.table) + '?q=' + qs, { cache: 'no-store' })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          // supabase-js semantics: single()/maybeSingle() return the ROW (or null), not an array
          if (res && !res.error && res.data !== null && (q.single || q.maybeSingle)) {
            if (Array.isArray(res.data)) res.data = res.data.length ? res.data[0] : null;
          }
          return res;
        });
    }
    if (op === 'insert') {
      return fetch('/api/db/' + encodeURIComponent(q.table), {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ payloads: q.payload, query: { select: q.select, single: q.single } }),
      }).then(function (r) { return r.json(); });
    }
    if (op === 'update') {
      return fetch('/api/db/' + encodeURIComponent(q.table), {
        method: 'PATCH',
        headers: jsonHeaders(),
        body: JSON.stringify({ payload: q.payload, query: { select: q.select, filters: q.filters } }),
      }).then(function (r) { return r.json(); });
    }
    if (op === 'delete') {
      return fetch('/api/db/' + encodeURIComponent(q.table) + '?q=' + qs, { method: 'DELETE' })
        .then(function (r) { return r.json(); });
    }
    return Promise.resolve({ data: null, error: { message: 'unsupported op', code: null } });
  }

  function builder(table) {
    var q = { table: table, op: null, select: null, filters: [], order: null, limit: null, single: false, maybeSingle: false, payload: null };
    var b = {
      select: function (cols) {
        q.select = cols ? String(cols).split(',').map(function (s) { return s.trim(); }).filter(Boolean) : null;
        return b;
      },
      insert: function (payload) { q.op = 'insert'; q.payload = payload; return b; },
      upsert: function (payload) { q.op = 'insert'; q.payload = payload; return b; },
      update: function (payload) { q.op = 'update'; q.payload = payload; return b; },
      delete: function () { q.op = 'delete'; return b; },
      eq: function (col, val) { q.filters.push({ op: 'eq', col: col, val: val }); return b; },
      neq: function (col, val) { q.filters.push({ op: 'neq', col: col, val: val }); return b; },
      in: function (col, val) { q.filters.push({ op: 'in', col: col, val: val }); return b; },
      gt: function (col, val) { q.filters.push({ op: 'gt', col: col, val: val }); return b; },
      gte: function (col, val) { q.filters.push({ op: 'gte', col: col, val: val }); return b; },
      lt: function (col, val) { q.filters.push({ op: 'lt', col: col, val: val }); return b; },
      lte: function (col, val) { q.filters.push({ op: 'lte', col: col, val: val }); return b; },
      order: function (col, opts) { q.order = { col: col, asc: !(opts && opts.ascending === false) }; return b; },
      limit: function (n) { q.limit = n; return b; },
      single: function () { q.single = true; return b; },
      maybeSingle: function () { q.maybeSingle = true; return b; },
      then: function (onF, onR) {
        if (!q.op) q.op = 'select';
        return execQuery(q).then(onF, onR);
      },
      catch: function (onR) { if (!q.op) q.op = 'select'; return execQuery(q).catch(onR); },
      finally: function (onF) { if (!q.op) q.op = 'select'; return execQuery(q).finally(onF); },
    };
    return b;
  }

  /* ---------------- auth ---------------- */

  function makeAuth() {
    return {
      signUp: function (opts) {
        var d = (opts && opts.options && opts.options.data) || {};
        return fetch('/api/auth/signup', {
          method: 'POST',
          headers: jsonHeaders(),
          body: JSON.stringify({ email: opts && opts.email, password: opts && opts.password, nick: d.nick, device_id: d.device_id }),
        }).then(function (r) { return r.json(); });
      },
      signInWithPassword: function (opts) {
        return fetch('/api/auth/login', {
          method: 'POST',
          headers: jsonHeaders(),
          body: JSON.stringify({ email: opts && opts.email, password: opts && opts.password }),
        }).then(function (r) { return r.json(); });
      },
      signOut: function () {
        return fetch('/api/auth/logout', { method: 'POST', headers: jsonHeaders(), body: '{}' })
          .then(function (r) { return r.json(); });
      },
      getSession: function () {
        return fetch('/api/auth/session', { cache: 'no-store' }).then(function (r) { return r.json(); });
      },
      getUser: function () {
        return fetch('/api/auth/session', { cache: 'no-store' }).then(function (r) { return r.json(); })
          .then(function (res) {
            if (res && res.data && res.data.session) return { data: { user: res.data.session.user }, error: null };
            return { data: { user: null }, error: null };
          });
      },
      onAuthStateChange: function () { return { data: { subscription: { unsubscribe: function () {} } } }; },
    };
  }

  /* ---------------- client ---------------- */

  var cachedChannels = null;

  function createClient() {
    var client = {
      auth: makeAuth(),
      from: function (table) { return builder(table); },
      rpc: function (fn, params) {
        return fetch('/api/rpc/' + encodeURIComponent(fn), {
          method: 'POST',
          headers: jsonHeaders(),
          body: JSON.stringify(params || {}),
        }).then(function (r) { return r.json(); });
      },
      channel: function (name /*, opts */) { return makeChannel(String(name)); },
      removeChannel: function (ch) {
        try { if (ch && ch._stop) ch._stop(); } catch (e) {}
        return Promise.resolve('ok');
      },
      removeAllChannels: function () { return Promise.resolve('ok'); },
      getChannels: function () { return []; },
    };
    cachedChannels = client;
    return client;
  }

  global.supabase = { createClient: createClient };
  global.__wdShimVersion = '1.0';
})(typeof window !== 'undefined' ? window : this);
