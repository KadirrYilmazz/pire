const assert = require('node:assert/strict');

function makeScope(db) {
  function notificationRecipient(init = {}) {
    const headers = new Headers(init.headers || {});
    const encodedRole = headers.get('X-Pire-Role') || '';
    const role = (() => { try { return decodeURIComponent(encodedRole); } catch { return encodedRole; } })() || 'Ziyaretçi';
    const accountId = headers.get('X-Pire-Account') || '';
    const studentId = headers.get('X-Pire-Student') || '';
    const teacherId = headers.get('X-Pire-Teacher') || '';
    return { role, accountId, studentId, teacherId, key: accountId || `role:${role}` };
  }

  function relatedStudentId(item) {
    const key = String(item.key || '');
    const numeric = Number((key.match(/\d+/) || [])[0]);
    if (key.startsWith('payment-')) return db.students.payments.find(x => Number(x.id) === numeric)?.studentId;
    if (key.startsWith('package-')) return db.packages.packages.find(x => Number(x.id) === numeric)?.studentId;
    if (key.startsWith('homework-')) return db.attendance.progress.find(x => Number(x.id) === numeric)?.studentId;
    if (key.startsWith('makeup-')) return db.makeups.rights.find(x => Number(x.id) === numeric)?.studentId;
    return null;
  }

  function relatedLesson(item) {
    const key = String(item.key || '');
    const numeric = Number((key.match(/\d+/) || [])[0]);
    let lessonId = key.startsWith('attendance-') ? numeric : null;
    if (key.startsWith('change-')) lessonId = db.makeups.history.find(x => Number(x.id) === numeric)?.lessonId;
    if (key.startsWith('homework-')) lessonId = db.attendance.progress.find(x => Number(x.id) === numeric)?.lessonId;
    if (key.startsWith('makeup-')) lessonId = db.makeups.rights.find(x => Number(x.id) === numeric)?.sourceLessonId;
    return db.lessons.lessons.find(x => Number(x.id) === Number(lessonId));
  }

  function visibleOperationalNotifications(init = {}) {
    const recipient = notificationRecipient(init);
    const list = db.notifications.notifications || [];
    db.notificationReads ||= {};
    db.notificationReads[recipient.key] ||= [];
    const reads = db.notificationReads[recipient.key];
    if (recipient.role === 'Yönetici') return list;
    if (recipient.role === 'Öğrenci' || recipient.role === 'Veli') {
      if (!recipient.studentId) return [];
      return list.filter(item => {
        const lesson = relatedLesson(item);
        const directStudentId = relatedStudentId(item);
        const inLesson = lesson && JSON.parse(lesson.studentIds || '[]').map(String).includes(String(recipient.studentId));
        return String(directStudentId || '') === String(recipient.studentId) || inLesson;
      }).map(item => ({ ...item, read: item.read || reads.includes(String(item.key)) }));
    }
    if (recipient.role === 'Eğitmen') {
      const teacher = db.catalog.teachers.find(x => String(x.id) === String(recipient.teacherId));
      if (!teacher) return [];
      return list.filter(item => relatedLesson(item)?.teacher === teacher.name)
        .map(item => ({ ...item, read: item.read || reads.includes(String(item.key)) }));
    }
    return [];
  }

  return { notificationRecipient, visibleOperationalNotifications };
}

const db = {
  students: { payments: [{ id: 1, studentId: 101 }, { id: 2, studentId: 202 }] },
  packages: { packages: [{ id: 11, studentId: 101 }, { id: 22, studentId: 202 }] },
  attendance: { progress: [{ id: 31, lessonId: 501, studentId: 101 }, { id: 32, lessonId: 502, studentId: 202 }] },
  makeups: { rights: [{ id: 41, sourceLessonId: 501, studentId: 101 }], history: [{ id: 51, lessonId: 502 }] },
  lessons: { lessons: [{ id: 501, studentIds: '[101]', teacher: 'Ayşe' }, { id: 502, studentIds: '[202]', teacher: 'Mehmet' }] },
  catalog: { teachers: [{ id: 't1', name: 'Ayşe' }, { id: 't2', name: 'Mehmet' }] },
  notifications: { notifications: [
    { key: 'attendance-501', type: 'Yoklama', read: false },
    { key: 'attendance-502', type: 'Yoklama', read: false },
    { key: 'payment-1-late', type: 'Ödeme', read: false },
    { key: 'payment-2-late', type: 'Ödeme', read: false },
    { key: 'package-11-2', type: 'Paket', read: false },
    { key: 'homework-32-2026', type: 'Ödev', read: false },
    { key: 'change-51', type: 'Ders iptali', read: false },
  ] },
  notificationReads: { student101: ['payment-1-late'] },
};

const scope = makeScope(db);
const student = { headers: { 'X-Pire-Role': encodeURIComponent('Öğrenci'), 'X-Pire-Account': 'student101', 'X-Pire-Student': '101' } };
const teacher = { headers: { 'X-Pire-Role': encodeURIComponent('Eğitmen'), 'X-Pire-Account': 'teacher1', 'X-Pire-Teacher': 't1' } };
const admin = { headers: { 'X-Pire-Role': encodeURIComponent('Yönetici'), 'X-Pire-Account': 'admin' } };

assert.deepEqual(scope.visibleOperationalNotifications(student).map(x => x.key), ['attendance-501', 'payment-1-late', 'package-11-2']);
assert.equal(scope.visibleOperationalNotifications(student).find(x => x.key === 'payment-1-late').read, true);
assert.deepEqual(scope.visibleOperationalNotifications(teacher).map(x => x.key), ['attendance-501']);
assert.equal(scope.visibleOperationalNotifications(admin).length, 7);
console.log('Fix73 notification scope: 4/4 passed');
