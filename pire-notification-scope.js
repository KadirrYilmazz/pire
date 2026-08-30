(function () {
  'use strict';

  const originalFetch = window.fetch.bind(window);
  const readsKey = 'pire-notification-role-reads-v1';

  function account() {
    try {
      return JSON.parse(
        sessionStorage.getItem('pire-local-admin-session-v1') ||
        localStorage.getItem('pire-local-admin-session-v1') ||
        'null'
      );
    } catch (_) {
      return null;
    }
  }

  function recipient() {
    const profile = account();
    const role = localStorage.getItem('pire-active-role') || profile?.role || 'Ziyaretçi';
    return {
      role,
      accountId: String(profile?.id || ''),
      studentId: String(profile?.linked_student_id || ''),
      teacherId: String(profile?.linked_teacher_id || ''),
      key: String(profile?.id || `role:${role}`),
    };
  }

  function database() {
    try {
      return window.__PIRE_RECOVERED_BACKEND__?.exportData?.() || {};
    } catch (_) {
      return {};
    }
  }

  function storedReads(key) {
    try {
      const all = JSON.parse(localStorage.getItem(readsKey) || '{}');
      return new Set(Array.isArray(all[key]) ? all[key].map(String) : []);
    } catch (_) {
      return new Set();
    }
  }

  function saveReads(key, values) {
    let all = {};
    try { all = JSON.parse(localStorage.getItem(readsKey) || '{}'); } catch (_) {}
    all[key] = [...new Set(values)].map(String);
    localStorage.setItem(readsKey, JSON.stringify(all));
  }

  function firstNumber(value) {
    return Number((String(value || '').match(/\d+/) || [])[0]);
  }

  function lessonStudents(lesson) {
    try {
      const ids = Array.isArray(lesson?.studentIds) ? lesson.studentIds : JSON.parse(lesson?.studentIds || '[]');
      return ids.map(String);
    } catch (_) {
      return [];
    }
  }

  function relations(item, db) {
    const key = String(item?.key || '');
    const id = firstNumber(key);
    let studentId = '';
    let lessonId = '';

    if (key.startsWith('payment-')) studentId = db.students?.payments?.find(x => Number(x.id) === id)?.studentId;
    if (key.startsWith('package-')) studentId = db.packages?.packages?.find(x => Number(x.id) === id)?.studentId;
    if (key.startsWith('homework-')) {
      const progress = db.attendance?.progress?.find(x => Number(x.id) === id);
      studentId = progress?.studentId;
      lessonId = progress?.lessonId;
    }
    if (key.startsWith('makeup-')) {
      const right = db.makeups?.rights?.find(x => Number(x.id) === id);
      studentId = right?.studentId;
      lessonId = right?.sourceLessonId;
    }
    if (key.startsWith('attendance-')) lessonId = id;
    if (key.startsWith('change-')) lessonId = db.makeups?.history?.find(x => Number(x.id) === id)?.lessonId;

    const lesson = db.lessons?.lessons?.find(x => Number(x.id) === Number(lessonId));
    return { studentId: String(studentId || ''), lesson };
  }

  function scopeNotifications(items) {
    const user = recipient();
    if (user.role === 'Yönetici') return items;

    const db = database();
    const reads = storedReads(user.key);
    return items.filter(item => {
      if (String(item.key || '').startsWith('announcement:')) return true;
      const { studentId, lesson } = relations(item, db);

      if (user.role === 'Öğrenci' || user.role === 'Veli') {
        if (!user.studentId) return false;
        return studentId === user.studentId || lessonStudents(lesson).includes(user.studentId);
      }

      if (user.role === 'Eğitmen') {
        if (!user.teacherId || !lesson) return false;
        const teacher = db.catalog?.teachers?.find(x => String(x.id) === user.teacherId);
        return Boolean(teacher?.name) && String(lesson.teacher) === String(teacher.name);
      }

      return false;
    }).map(item => ({ ...item, read: Boolean(item.read) || reads.has(String(item.key)) }));
  }

  async function scopedGet(input, init) {
    const response = await originalFetch(input, init);
    if (!response.ok) return response;
    const payload = await response.json();
    const notifications = scopeNotifications(payload.notifications || []);
    return new Response(JSON.stringify({
      ...payload,
      notifications,
      unread: notifications.filter(item => !item.read).length,
      recipient: { ...payload.recipient, role: recipient().role },
    }), { status: response.status, headers: { 'content-type': 'application/json;charset=utf-8', 'cache-control': 'no-store' } });
  }

  window.fetch = async function (input, init = {}) {
    let url;
    try { url = new URL(typeof input === 'string' ? input : input.url, location.origin); } catch (_) { return originalFetch(input, init); }
    if (url.origin !== location.origin || url.pathname !== '/api/notifications') return originalFetch(input, init);

    const method = String(init.method || 'GET').toUpperCase();
    const user = recipient();
    if (method === 'GET') return scopedGet(input, init);
    if (method !== 'POST' || user.role === 'Yönetici') return originalFetch(input, init);

    let body = {};
    try { body = typeof init.body === 'string' ? JSON.parse(init.body) : (init.body || {}); } catch (_) {}
    if (String(body.key || '').startsWith('announcement:')) return originalFetch(input, init);

    const current = await scopedGet(url.toString(), { method: 'GET', headers: init.headers });
    const payload = await current.json();
    const operational = (payload.notifications || []).filter(item => !String(item.key || '').startsWith('announcement:'));
    const reads = storedReads(user.key);
    if (body.all) operational.forEach(item => reads.add(String(item.key)));
    else if (body.key && operational.some(item => String(item.key) === String(body.key))) reads.add(String(body.key));
    saveReads(user.key, reads);

    if (body.all) {
      const announcements = (payload.notifications || []).filter(item => String(item.key || '').startsWith('announcement:') && !item.read);
      await Promise.all(announcements.map(item => originalFetch(url.toString(), {
        method: 'POST',
        headers: init.headers,
        body: JSON.stringify({ key: item.key }),
      })));
    }

    const remaining = (payload.notifications || []).filter(item => {
      if (String(item.key || '').startsWith('announcement:')) return !item.read;
      return !reads.has(String(item.key));
    }).length;
    return new Response(JSON.stringify({ ok: true, unread: remaining }), {
      status: 200,
      headers: { 'content-type': 'application/json;charset=utf-8', 'cache-control': 'no-store' },
    });
  };
})();

(function () {
  'use strict';

  const previousFetch = window.fetch.bind(window);

  function courseKey(course) {
    return String(course?.name || '')
      .normalize('NFKC')
      .trim()
      .replace(/\s+/g, ' ')
      .toLocaleLowerCase('tr-TR');
  }

  function uniqueCourses(courses) {
    const seen = new Set();
    return (Array.isArray(courses) ? courses : []).filter(course => {
      const key = courseKey(course);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function optionKey(option) {
    return String(option?.textContent || option?.label || '')
      .normalize('NFKC')
      .trim()
      .replace(/\s+/g, ' ')
      .toLocaleLowerCase('tr-TR');
  }

  function dedupeSelect(select) {
    if (!select?.options || String(select.name || '').toLocaleLowerCase('tr-TR') !== 'course') return 0;
    const seen = new Set();
    let removed = 0;
    [...select.options].forEach(option => {
      const key = optionKey(option);
      if (!key || !seen.has(key)) {
        if (key) seen.add(key);
        return;
      }
      option.remove();
      removed += 1;
    });
    return removed;
  }

  function dedupeRenderedCourseSelects(root = document) {
    if (root?.matches?.('select[name="course"]')) dedupeSelect(root);
    root?.querySelectorAll?.('select[name="course"]').forEach(dedupeSelect);
  }

  function responseWith(payload, response) {
    const headers = new Headers(response.headers);
    headers.set('content-type', 'application/json;charset=utf-8');
    headers.set('cache-control', 'no-store');
    return new Response(JSON.stringify(payload), {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  window.fetch = async function (input, init = {}) {
    let url;
    try {
      url = new URL(typeof input === 'string' ? input : input.url, location.origin);
    } catch (_) {
      return previousFetch(input, init);
    }

    const method = String(init.method || (typeof input !== 'string' && input.method) || 'GET').toUpperCase();
    if (url.origin !== location.origin || url.pathname !== '/api/catalog' || method !== 'GET') {
      return previousFetch(input, init);
    }

    const response = await previousFetch(input, init);
    if (!response.ok) return response;

    let payload;
    try {
      payload = await response.clone().json();
    } catch (_) {
      return response;
    }

    return responseWith({ ...payload, courses: uniqueCourses(payload.courses) }, response);
  };

  function startRenderedSelectGuard() {
    dedupeRenderedCourseSelects();
    const observer = new MutationObserver(records => {
      records.forEach(record => record.addedNodes.forEach(dedupeRenderedCourseSelects));
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startRenderedSelectGuard, { once: true });
  } else {
    startRenderedSelectGuard();
  }

  window.__PIRE_COURSE_DEDUPE__ = { uniqueCourses, dedupeSelect };
})();
