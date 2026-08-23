const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('dashboard mode is synchronized from rendered dashboard content', () => {
  const start = html.indexOf('<script id="pire-dashboard-mode-sync">');
  const end = html.indexOf('</script>', start);

  assert.notEqual(start, -1);
  assert.notEqual(end, -1);

  const script = html.slice(start, end);
  assert.match(script, /querySelector\('\.premium-dashboard'\)/);
  assert.match(script, /classList\.toggle\('dashboard-mode',dashboardVisible\)/);
  assert.match(script, /classList\.remove\('visitor-mode'\)/);
  assert.match(script, /MutationObserver\(schedule\)/);
});
