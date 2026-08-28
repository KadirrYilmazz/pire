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

  window.__PIRE_COURSE_DEDUPE__ = { uniqueCourses };
})();
