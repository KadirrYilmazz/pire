# Fix123 — Production Geçiş Kontrol Listesi

Durum: **Merge/deploy öncesi son kapı**

## Otomatik olarak doğrulananlar
- [x] Canonical Supabase operasyon şeması ve additive migrationlar uygulandı.
- [x] Operasyonel API yolları canonical Supabase katmanına taşındı.
- [x] Legacy SEED/local API/global fetch backend preview deploy çıktısından çıkarılıyor.
- [x] Operasyonel localStorage kalıntıları build-time guard ile engelleniyor.
- [x] Ödeme ve yoklama gibi kritik mutationlar atomik RPC ile korunuyor.
- [x] Yönetici dışı öğrenci/eğitmen okumaları güvenli directory projectionlarından geliyor.
- [x] Eğitmen finans erişimi kapalı; Öğrenci/Veli finans erişimi bağlı öğrenciyle sınırlı.
- [x] Öğrenci, Veli ve Eğitmen RLS davranışı rollback'li DB rol simülasyonlarıyla doğrulandı.
- [x] Fix123 zorunlu CI paketi ve serverless syntax kontrolü mevcut.
- [x] Supabase security advisor Fix123 kaynaklı yeni kritik/yüksek bulgu göstermiyor.
- [x] Son doğrulanmış functional Vercel preview READY ve 12 serverless function sınırında.

## Gerçek tarayıcıda son smoke kontrolü
Aşağıdaki kontroller preview URL üzerinde gerçek oturumla yapılmalı. Veri silme/geri dönüşü zor işlemler yapılmamalı; mümkünse test kaydı kullanılıp ardından normal UI üzerinden temizlenmeli.

### Yönetici
- [ ] Giriş yapılabiliyor ve panel açılıyor.
- [ ] Öğrenciler listeleniyor; öğrenci ekleme/düzenleme akışı hata vermiyor.
- [ ] Eğitmen/branş listesi açılıyor ve yönetici gerekli ayrıntıları görebiliyor.
- [ ] Ders ve paket ekranları açılıyor.
- [ ] Ödeme/tahsilat kaydı akışı çalışıyor.
- [ ] Yoklama kaydı çalışıyor ve sayfa yenilenince durum korunuyor.
- [ ] Giderler, bildirimler ve müşteri CRM açılıyor.
- [ ] AI asistan açılıyor ve canonical veriden cevap verebiliyor.

### Eğitmen
- [ ] Yalnızca yetkili/bağlı öğrenciler görünüyor.
- [ ] Öğrenci TC/adres/veli telefonu gibi hassas profil alanları görünmüyor.
- [ ] Eğitmen TC/IBAN/ücret gibi hassas katalog alanları görünmüyor.
- [ ] Ödeme/tahsilat verileri görünmüyor.
- [ ] İlgili ders/paket bilgileri görüntülenebiliyor.

### Veli
- [ ] Yalnızca bağlı öğrenci görünüyor.
- [ ] Başka öğrencilerin kayıtları görünmüyor.
- [ ] Bağlı öğrencinin izinli ders/paket/ödeme bilgileri görüntülenebiliyor.
- [ ] Hassas ana öğrenci/eğitmen tablolarına ait alanlar görünmüyor.

### Öğrenci
- [ ] Yalnızca kendi kaydı görünüyor.
- [ ] Başka öğrencilerin kayıtları görünmüyor.
- [ ] Hassas ana öğrenci/eğitmen alanları görünmüyor.
- [ ] Yetkili ders/paket bilgileri görüntülenebiliyor.

## Runtime kontrolü
- [ ] Smoke test sırasında Vercel preview runtime loglarında 5xx oluşmuyor.
- [ ] Browser console'da canonical API'yi durduran uncaught exception yok.
- [ ] Canonical endpointlerde yetkisiz rol için localStorage fallback oluşmuyor.

## Merge/deploy kararı
Bu listedeki gerçek tarayıcı smoke maddeleri tamamlanmadan PR #53 `main`e merge edilmez ve Fix123 production frontend'e geçirilmez.

Production geçişinden hemen önce:
1. PR head için `fix123-required` yeşil olmalı.
2. Aynı functional head'i içeren Vercel preview READY olmalı.
3. Runtime 5xx kontrolü temiz olmalı.
4. Fix122 production deployment geri dönüş noktası olarak korunmalı.
