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
