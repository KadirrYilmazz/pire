# Fix142 — Atomik öğrenci kaydı

## Davranış

Kayıt sihirbazı öğrenci, ilk ders ve paket için tek `/api/students` POST isteği gönderir. API önce aktif yönetici kimliğini ve planı doğrular, ardından `pire_register_student` RPC'sini çağırır. Öğrenci, ders, öğrenci–ders bağlantısı, paket ve işlem kaydı aynı PostgreSQL transaction'ında oluşturulur. Herhangi bir yazma başarısızsa tamamı geri alınır.

Her form bir UUID işlem kimliği taşır. Aynı yönetici aynı isteği tekrar gönderdiğinde mevcut sonuç döner. Aynı işlem kimliği farklı içerikle gönderilirse 409 alınır; ikinci öğrenci oluşturulmaz. İşlem kimliği form açık kaldığı sürece korunur. Kullanıcı formu kapatıp yeniden açarsa yeni işlem kimliği oluşur; bu yüzden belirsiz ağ sonucunda form kapatılmadan tekrar denenmelidir.

Yeni `pire_student_registrations` tablosu yalnızca işlem kimliği, içerik özeti ve kayıt bağlantılarını tutar; öğrenci iletişim/kimlik bilgilerinin ikinci kopyasını saklamaz. RLS yalnızca aktif yöneticinin kendi işlem kayıtlarını okumasına/eklemesine izin verir. RPC SECURITY INVOKER'dır; anon rolüne açık değildir. Mevcut tabloların RLS korumalarını kullanır.

## Yayın sırası

1. Kullanıcıdan Fix142 kodu ve additive veritabanı migration'ı için onay alın.
2. `supabase/migrations/20261013165023_fix142_atomic_student_registration.sql` migration'ını uygulayın. Bu migration mevcut öğrenci/ders/paket kayıtlarını değiştirmez.
3. RPC, RLS ve grant metadatasını kontrol edin; güvenlik advisor'ını çalıştırın.
4. Yeni kodu yayınlayın; GitHub zorunlu JS ve SQL testlerini ve Vercel READY durumunu doğrulayın.
5. Authenticated preview/test ortamında gerçek form akışını ayrıca doğrulayın. Yerel PGlite testleri tüm Supabase Auth/PostgREST/üretim trigger akışının kanıtı değildir.

RPC eksikse API 503 döner ve eski üç ayrı yazma akışına geri dönmez.

## Doğrulama

- JS: plan doğrulaması, tek RPC yazması, rol reddi, eksik RPC, aynı isteğin tekrarı, içerik çakışması, HTTP/ağ hatası sonrası submit düğmesinin açılması ve DELETE geri alma isteklerinin gönderilmemesi.
- Ayrı yerel PostgreSQL motoru (PGlite): başarılı birleşik kayıt, tekrar isteğinde tek kayıt, içerik çakışması, paket INSERT sonrasında hata ile tam rollback, geçersiz branş/eğitmen/tarih/saat, öğrenci-only/lesson-only/package-only seçimleri, yetkisiz rol ve anon reddi, RLS ve SECURITY INVOKER.
- Test şeması canlı temel tabloların kullanılan alanlarını/constraints'lerini modeller; gerçek öğrenci verileri kopyalanmaz.

## Geri dönüş

Kod önceki Fix141 deployment'ına alınabilir. Yeni tablo ve RPC eski kod tarafından kullanılmaz; acil geri dönüş için tablo silmek gerekmez. Test amacıyla production öğrenci kaydı silmeyin.

## Kapsam sınırı

Bu değişiklik yeni öğrenci kayıt sihirbazını düzeltir. Bağımsız ders/paket düzenleme işlemleri, tam yedek geri yükleme ve önceki tarihsel DOM testleri bu değişikliğin kapsamına alınmadı. Kullanıcı onayı alınmadan migration veya production yayın uygulanmaz.
