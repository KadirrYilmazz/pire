# Fix143 — Supabase kaynak ve şema geçmişi eşitlemesi

## Yapılan çalışma

13 Ekim 2026 tarihli canlı Supabase migration kayıtları ve Edge Function kaynakları salt okunur erişimle incelendi. Canlı veritabanı, Auth kullanıcıları, fonksiyon yayınları ve işletme kayıtları değiştirilmedi.

- Önceki 33 migration, kayıtlı tam sürüm numaraları ve isimleriyle aktif `supabase/migrations/` dizinine aktarıldı.
- Depodaki önceki 23 SQL dosyası `supabase/historical-source-migrations/` altında korundu. Bu arşiv aktif migration zinciri değildir.
- `pire-phone-login` sürüm 1 kaynağı eklendi.
- `pire-manage-users` sürüm 11 kaynağıyla depodaki kod karşılaştırıldı: anlamlı kod farkı yok, mevcut dosya korundu.
- `supabase/config.toml`, yönetim fonksiyonunun JWT kontrolünü açık, giriş fonksiyonunun giriş öncesi JWT kapısını kapalı tutacak şekilde hazırlandı.
- `supabase/source-inventory.json` sürüm, isim ve SHA-256 kaynak envanteri içeriyor. İşletme verisi, API anahtarı, token veya kullanıcı kayıtları içermez. Dosya sonundaki gereksiz boş satırlar normalleştirildi; ham kaynak hash'i ayrıca tutulur.

## Migration geçmişi dışındaki canlı nesneler

33 kayıtlı migration boş bir yerel veritabanına uygulanınca şu iki canlı nesnenin kaynak zincirinde olmadığı doğrulandı:

1. `pire_profiles.gender`: text, NOT NULL, varsayılan `Belirtilmedi`; değer kümesi `Erkek`, `Kadın`, `Belirtilmedi`.
2. `pire_profile_students_relationship_check`: `Kendi`, `Anne`, `Baba`, `Vasi`, `Diğer` değerlerini sınırlar.

`20261013173610_fix143_schema_reconciliation.sql` bunları `IF NOT EXISTS` kontrolleriyle kayda geçirir. Mevcut canlı nesneler zaten bulunduğundan öğrenci/profil değerlerini güncellemez ve mevcut kuralları değiştirmez. Kullanıcı onayıyla production'a uygulandı; dosya ve envanter gerçek migration sürümüyle eşitlendi.

## Kişisel bootstrap e-posta bilgisinin korunması

Üç tarihsel migration'da ilk yöneticiye ait sabit e-posta vardı. Kamuya açık kaynak aktarımında bu bilgi `__PIRE_BOOTSTRAP_ADMIN_EMAIL__` ile değiştirildi. Bu üç dosya bu nedenle canlıdaki ham SQL'in birebir kopyası değildir; envanterde kaynak ve dışa aktarılan dosyanın ayrı hash'leri ve redaction bilgisi bulunur. Canlı trigger değiştirilmedi.

Yeni bir ortam kurarken gereken e-posta `PIRE_BOOTSTRAP_ADMIN_EMAIL` ortam değişkeninden özel bir çalışma kopyasına yerleştirilir:

```bash
node scripts/prepare-supabase-bootstrap.js /tmp/pire-private-bootstrap
```

Ortam değişkenini güvenli şekilde sağlayın; değeri terminal çıktısına veya Git'e yazmayın. Script kaynak depoyu değiştirmez; çıktıyı depo dışında veya ignore edilen `supabase/.temp/` altında oluşturur. Kişisel bilgi içeren üretilmiş SQL dosyalarını paylaşmayın. İlk yönetici bootstrap'ını çalıştıracak yeni ortamda ham şablonları doğrudan kullanmayın.

Aktif production üzerinde bütün eski migration'ları yeniden uygulamayın. SQL yedek geri yükleme bu değişikliğin konusu değildir. Supabase Auth kullanıcıları ve işletme verileri şema kaynağından ayrı tutulur.

## Doğrulama

Yerel PostgreSQL/PGlite üzerinde Supabase'in yönettiği Auth altyapısı için küçük bir test iskelesi kullanılarak 33 kayıtlı migration ve yeni uzlaştırma migration'ı sırasıyla çalıştırıldı. Gerçek kullanıcı ve öğrenci verisi kopyalanmadı.

Canlı metadata ile aynı sonuç doğrulandı: 329 kolon; 123 PK/FK/UNIQUE/CHECK kısıtı; 96 RLS policy; 76 indeks; 13 public trigger; 15 public/private iş fonksiyonunun gövdesi ve security ayarları. Yerel motor PostgreSQL 18, production PostgreSQL 17 olduğu için NOT NULL catalog gösterim farkı karşılaştırmada normalleştirilir; nullability kolon testinde ayrı doğrulanır.

Yeni uzlaştırma migration'ı ikinci kez uygulanınca mevcut profil değeri korundu; geçersiz gender değeri CHECK ile reddedildi. Fix142 atomik kayıt testleri ve mevcut zorunlu testler de çalıştırılır.

Bu doğrulama barındırılan Supabase Auth/Edge Functions servislerinin gerçek oturum testi değildir. Gizli anahtarlar, Auth kullanıcıları, veri yedeği, proje seviyesindeki SMTP/redirect/rate-limit ayarları bu kaynak aktarımının dışında kalır.

## Onay sonrası sıra

1. Yeni uzlaştırma migration'ını uygulayın; canlı kolon/kural tanımları ve kayıt sayılarının korunduğunu doğrulayın.
2. Gerçek migration sürümünü aktif dosya adı, envanter ve belgelerle eşitleyin.
3. GitHub'a kaynak değişikliklerini alın; zorunlu JS/SQL testlerini çalıştırın.
4. Vercel dağıtımını doğrulayın. Edge Function'ları yeniden deploy etmeyin: mevcut canlı kaynakla aynı oldukları için bu aşamada yeniden yayın gerekmiyor.

## Yayın kaydı

Fix143 uzlaştırması onaylandı ve uygulandı. Aktif zincirde artık 34 kayıtlı migration var; bekleyen migration yok. Kayıt sayıları ve iki mevcut şema kuralı uygulama sonrası korundu. Edge Function yeniden yayını yapılmadı.
