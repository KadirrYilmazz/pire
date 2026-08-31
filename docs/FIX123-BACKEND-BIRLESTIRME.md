# Fix123 — Backend Birleştirme Faz 1

## Amaç
Pİ-RE'nin çalışan production görünümünü bozmadan veri katmanını tek ve merkezi Supabase mimarisine taşımak.

## Güvenlik kuralı
Bu çalışma doğrudan `main` üzerinde yapılmaz. Fix122 production sürümü korunur. Tüm değişiklikler `fix123-backend-birlestirme-faz1` branch'inde hazırlanır ve doğrulanmadan production'a alınmaz.

## Güncel durum — 2026-08-31
- Canonical Supabase operasyon şeması oluşturuldu ve mevcut yedek kontrollü olarak aktarıldı.
- Öğrenci, eğitmen/branş, ders, paket, ödeme/finans, gider ve diğer operasyon endpointleri canonical API katmanına taşındı.
- Bildirim tercihleri ve okundu bilgisi profil bazlı canonical tablolara taşındı.
- Müşteri CRM canonical Supabase tablosu/API/UI yoluna taşındı.
- Çoklu rol yönetici yetkisi RLS/API katmanlarında destekleniyor.
- İlişki senkronizasyonu ve ödeme kaydı için atomik Supabase RPC'leri eklendi.
- Preview build sırasında gömülü `SEED`, local API emülasyonu, global `window.fetch` override ve local müşteri CRM bloğu fiziksel olarak deploy çıktısından çıkarılıyor.
- Build koruması bilinen operasyonel localStorage anahtarlarından biri deploy edilen kritik dosyalarda yeniden görünürse build'i durduruyor.
- localStorage hedef olarak yalnızca tema, dil, rapor sekmesi, müzik gibi cihaz/UI tercihleri için bırakılıyor.
- Fix123 regresyon testleri GitHub Actions üzerinde `node --test tests/*.test.js` ile çalışacak şekilde tanımlandı.
- Production Fix122 hâlâ değiştirilmedi; Fix123 yalnızca preview branch/PR üzerinde.

## Hedef mimari
1. Supabase kalıcı operasyonel verinin tek gerçek kaynağı olacak.
2. Vercel API / Supabase Edge Functions yetki gerektiren sunucu işlemlerini yönetecek.
3. localStorage yalnızca tema, dil ve benzeri cihaz tercihleri için kullanılacak.
4. Global `window.fetch` override production Fix123 çıktısında bulunmayacak.
5. UI mevcut görünümünü ve kullanıcı akışını koruyacak.

## Faz durumu
### Faz 1 — Envanter ve koruma — TAMAMLANDI
Production Fix122 korunuyor; endpoint ve veri alanları envanterlendi.

### Faz 2 — Supabase şeması — TAMAMLANDI
Canonical operasyon tabloları, RLS/policy'ler ve gerekli atomik RPC'ler eklendi. Migration dosyaları branch'te tutuluyor.

### Faz 3 — API geçiş katmanı — BÜYÜK ÖLÇÜDE TAMAMLANDI
Mevcut `/api/*` sözleşmesi korunarak operasyon yolları canonical Supabase katmanına yönlendirildi. Yazma işlemlerinde local backend'e sessiz geri dönüş engellendi.

### Faz 4 — Local backend sökümü — PREVIEW'DA TAMAMLANDI
Vercel build komutu legacy backend'i, `SEED` bloğunu, global fetch override'ı ve local CRM bloğunu deploy çıktısından çıkarıyor. Kaynak `index.html` Fix122 geri dönüş güvenliği için branch üzerinde tarihsel tabanı korumaya devam ediyor.

### Faz 5 — Veri temizliği — PREVIEW'DA TAMAMLANDI
Public preview çıktısında legacy seed/backend bloğu bulunmuyor. Operasyonel localStorage anahtarları için build-time guard eklendi.

### Faz 6 — Test ve production — DEVAM EDİYOR
GitHub Actions regresyon workflow'u eklendi. Sonraki kapı: CI sonuçları + authenticated preview smoke/regresyon kontrolü. Bunlar temiz olmadan PR `main`e alınmayacak.

## Production geçiş kapısı
Aşağıdakilerin tamamı sağlanmadan Fix123 production'a alınmaz:
- GitHub Actions regresyon testleri yeşil.
- Vercel preview build READY ve build hatası yok.
- Yönetici oturumuyla öğrenci, eğitmen, ders, paket, ödeme, gider, yoklama, telafi, bildirim ve müşteri akışları smoke testten geçiyor.
- Öğrenci/veli/eğitmen rol görünürlükleri RLS üzerinden doğrulanıyor.
- Preview deploy çıktısında legacy backend/SEED/global fetch override/operasyonel localStorage kalıntısı yok.
- Supabase güvenlik kontrollerinde Fix123 kaynaklı yeni kritik/yüksek bulgu yok.

## Geri dönüş
Her faz bağımsız commit edildi. Fix122 production commit'i değiştirilmeden korunur; production geçişi sonrasında sorun görülürse önceki Fix122 deployment/commit geri dönüş noktası olarak kalır.
