# Fix123 — Local API / Supabase Envanteri

Bu belge production Fix122 kodu ve canlı Supabase şeması karşılaştırılarak hazırlanmıştır. Amaç, localStorage backend'i tek seferde sökmek yerine endpoint bazında güvenli geçiş yapmaktır.

## Canlı Supabase durumu

Mevcut public tablolar:

- `pire_ai_students` — 10 satır
- `pire_ai_lessons` — 15 satır
- `pire_ai_lesson_students` — 17 satır
- `pire_ai_payments` — 5 satır
- `pire_ai_packages` — 18 satır
- `pire_ai_attendance` — 4 satır
- `pire_profiles` — 3 satır
- `pire_profile_students` — 0 satır
- `pire_teacher_students` — 2 satır

Tüm mevcut `pire_*` tablolarında RLS aktiftir. Yetki politikaları `private.current_user_is_pire_admin()` ve `private.current_user_can_access_pire_student(...)` yardımcı fonksiyonlarını kullanmaktadır.

## Önemli tespit

`pire_ai_*` tabloları tam operasyonel veri modeli değildir. Örneğin `pire_ai_students` yalnızca `id`, `status`, `monthly_fee`, `payment_day` ve zaman alanlarını taşır. Öğrenci adı, iletişim, veli, adres ve kayıt ayrıntıları burada yoktur. Bu nedenle AI snapshot tabloları ana öğrenci veritabanı olarak kullanılmamalıdır.

Hedef:

- Operasyonel tablolar = Pİ-RE'nin gerçek ve tam verisi.
- `pire_ai_*` tabloları = asistan için güvenli/minimize edilmiş türetilmiş görünüm veya snapshot.

## Production local API endpointleri

### `/api/students`
Mevcut kaynak: `localStorage` içindeki `db.students.students` ve `db.students.payments`.

İşlemler:
- GET öğrenci/ödeme listesi
- POST öğrenci oluşturma
- PATCH öğrenci güncelleme
- PATCH ödeme durumunu değiştirme
- DELETE ayrılmış/pasif veya kalıcı silme

Supabase durumu: Tam karşılık YOK. `pire_ai_students` yalnızca minimize edilmiş snapshot.

Öneri: yeni canonical `pire_students` tablosu + ayrı ödeme tabloları.

### `/api/catalog`
Mevcut kaynak: `db.catalog.teachers`, `db.catalog.courses`.

İşlemler:
- Eğitmen oluştur/güncelle/pasifleştir/sil
- Ders/branş oluştur/sil

Supabase durumu: operasyonel karşılık YOK.

Öneri: `pire_teachers`, `pire_courses`, `pire_teacher_courses`.

### `/api/lessons`
Mevcut kaynak: `db.lessons.lessons`.

İşlemler:
- Ders oluştur
- Ders güncelle
- Ders sil
- Öğrenci bağlantısı

Supabase durumu: `pire_ai_lessons` ve `pire_ai_lesson_students` var, ancak bunlar snapshot ve tam ders ayrıntılarını taşımıyor.

Öneri: canonical `pire_lessons` + `pire_lesson_students`.

### `/api/packages`
Mevcut kaynak: `db.packages.packages`.

İşlemler:
- Paket oluştur
- Önceki aktif paketi yenilendi durumuna alma
- Ders/telafi/dondurma hakkı düzeltmeleri

Supabase durumu: `pire_ai_packages` var fakat ayarlama geçmişi ve tam operasyonel detaylar yok.

Öneri: canonical `pire_packages` + `pire_package_adjustments`.

### `/api/attendance`
Mevcut kaynak: `db.attendance.attendance`, `progress`, `history`.

İşlemler:
- Yoklama kaydet/güncelle
- Paket hakkı düşür/geri ekle
- Ders ilerleme/not bilgisi
- Değişiklik geçmişi

Supabase durumu: `pire_ai_attendance` yalnızca temel yoklama snapshot'ı.

Öneri: `pire_attendance`, `pire_lesson_progress`, `pire_attendance_history`.

### `/api/makeups`
Mevcut kaynak: `db.makeups.rights`, `db.makeups.history`.

İşlemler:
- Telafi hakları
- Ders taşıma/iptal geçmişi
- Uygun slot önerisi

Supabase durumu: karşılık YOK.

Öneri: `pire_makeup_rights`, `pire_lesson_changes`.

### `/api/expenses`
Mevcut kaynak: `db.expenses.expenses`.

Supabase durumu: karşılık YOK.

Öneri: `pire_expenses`.

### `/api/finance`
Mevcut kaynak: local verilerden hesaplanan ledgers ve `db.finance.transactions`.

Supabase durumu: `pire_ai_payments` sadece AI snapshot'ı.

Öneri: borç/tahakkuk ve tahsilat için `pire_charges`, `pire_payment_transactions`. Ledger sunucuda hesaplanmalı; kalıcı kopya olarak tutulmamalı.

### `/api/earnings`
Mevcut kaynak: `db.earnings.earnings`, `db.earnings.payouts`.

Supabase durumu: karşılık YOK.

Öneri: `pire_teacher_compensation`, `pire_teacher_payouts`; hakediş mümkün olduğunca derslerden türetilmeli.

### `/api/settings`
Mevcut kaynak: `db.settings.settings`.

Supabase durumu: karşılık YOK.

Öneri: `pire_institution_settings`.

### `/api/notifications`
Mevcut kaynak: local hesaplanan bildirimler + duyurular + okundu bilgisi.

Supabase durumu: karşılık YOK.

Öneri: ilk geçişte bildirimleri sunucuda dinamik üretmek; yalnızca kullanıcı bazlı okundu kayıtlarını `pire_notification_reads` içinde tutmak.

### `/api/announcements`
Mevcut kaynak: `db.announcements.announcements`.

Supabase durumu: karşılık YOK.

Öneri: `pire_announcements`, `pire_announcement_reads`.

### `/api/security-audit`
Mevcut kaynak: `db['security-audit'].logs`.

Supabase durumu: karşılık YOK.

Öneri: append-only `pire_audit_logs`. İstemciden doğrudan INSERT yetkisi verilmemeli; server/Edge Function üzerinden yazılmalı.

### `/api/backup`
Mevcut kaynak: tüm localStorage DB JSON export/import.

Supabase geçişi sonrası: doğrudan tarayıcı DB dump'ı yerine yetkili sunucu export/import akışı tasarlanmalı. İlk fazda restore kapatılmalı veya yalnızca preview/validation olarak bırakılmalı.

## Gerçek Vercel endpointleri

Bunlar local backend'den bağımsız sunucu fonksiyonlarıdır:

- `/api/account-gender`
- `/api/assistant-profile`
- `/api/assistant-sync`
- `/api/assistant`
- `/api/login-notification`

Bu endpointler korunacak. Özellikle AI ve hesap tarafı gerçek Supabase Auth/RLS yapısına bağlıdır.

## Geçiş sırası

1. `students + catalog`
2. `lessons + lesson_students`
3. `packages + attendance`
4. `payments + finance + expenses`
5. `makeups + earnings`
6. `settings + announcements + audit`
7. local notification hesaplarının sunucuya taşınması
8. backup sisteminin yeniden tasarlanması
9. `window.fetch` override kaldırılması
10. public `SEED` verisinin tamamen kaldırılması

## Korunacak veri ilkeleri

- Kimlik/telefon/adres/veli gibi alanlar AI snapshot tablolarına kopyalanmaz.
- `pire_ai_*` tabloları canonical veri değildir.
- RLS her canonical tabloda varsayılan olarak açık olmalıdır.
- Yönetici yazma yetkisi mevcut `private.current_user_is_pire_admin()` modeliyle uyumlu tutulmalıdır.
- Öğrenci/Veli/Eğitmen okuma yetkileri `pire_profile_students` ve `pire_teacher_students` ilişkileri üzerinden kurulmalıdır.
- Browser localStorage finans, öğrenci, ders veya yetki verisinin gerçek kaynağı olmayacaktır.
