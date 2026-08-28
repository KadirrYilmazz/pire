const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync(require('path').join(__dirname, 'fix74-pire-course-dedupe.js'), 'utf8');
const catalog = {
  teachers: [{ id: 1, name: 'Kadir Yılmaz' }],
  courses: [
    { id: 5, name: 'Bağlama' },
    { id: 9112, name: 'Bağlama' },
    { id: 6, name: 'Gitar' },
    { id: 9113, name: ' gitar ' },
    { id: 8, name: 'Kemençe' },
    { id: 4, name: 'Matematik' },
    { id: 9111, name: 'MATEMATİK' },
    { id: 7, name: 'Piyano' },
    { id: 12, name: 'Kimya' },
  ],
};

const nativeFetch = async (input, init = {}) => new Response(JSON.stringify(catalog), {
  status: 200,
  headers: { 'content-type': 'application/json' },
});

const context = {
  window: { fetch: nativeFetch },
  location: { origin: 'https://pire.test' },
  URL,
  Response,
  Headers,
  Set,
};
vm.createContext(context);
vm.runInContext(source, context);

async function run() {
  let passed = 0;
  const check = (condition, message) => {
    if (!condition) throw new Error(message);
    passed += 1;
  };

  const response = await context.window.fetch('/api/catalog');
  const payload = await response.json();
  check(payload.courses.length === 6, 'Duplicate course names must be removed');
  check(payload.courses.map(x => x.name).join('|') === 'Bağlama|Gitar|Kemençe|Matematik|Piyano|Kimya', 'First canonical records and order must be preserved');
  check(payload.teachers.length === 1, 'Other catalog fields must be preserved');

  const direct = context.window.__PIRE_COURSE_DEDUPE__.uniqueCourses([
    { id: 1, name: '  ŞAN   DERSİ ' },
    { id: 2, name: 'şan dersi' },
  ]);
  check(direct.length === 1, 'Turkish case and repeated whitespace must normalize');

  console.log(`Fix74 course dedupe: ${passed}/4 passed`);
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
