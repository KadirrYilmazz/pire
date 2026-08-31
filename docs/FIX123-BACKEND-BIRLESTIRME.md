# Fix123 — Backend Birleştirme Faz 1

## Amaç
Pİ-RE'nin çalışan production görünümünü bozmadan veri katmanını tek ve merkezi Supabase mimarisine taşımak.

## Güvenlik kuralı
Bu çalışma doğrudan `main` üzerinde yapılmaz. Fix122 production sürümü korunur. Tüm değişiklikler `fix123-backend-birlestirme-faz1` branch'inde hazırlanır ve doğrulanmadan production'a alınmaz.

## Mevcut durum
- Ana UI kurtarılmış statik bundle üzerinden çalışıyor.
- `index.html` içinde localStorage tabanlı bir local API/backend emülasyonu bulunuyor.
- Bazı gerçek serverless endpointler `/api` altında Vercel üzerinde çalışıyor.
- Supabase Auth, profil/rol ilişkileri ve AI snapshot tabloları aktif.
- Aynı veri alanının tarayıcı ve Supabase tarafında farklı kaynaklardan gelme riski var.

## Hedef mimari
1. Supabase kalıcı operasyonel verinin tek gerçek kaynağı olacak.
2. Vercel API / Supabase Edge Functions yetki gerektiren sunucu işlemlerini yönetecek.
3. localStorage yalnızca tema, dil ve benzeri cihaz tercihleri için kullanılacak.
4. Global `window.fetch` override kaldırılacak.
5. UI mevcut görünümünü ve kullanıcı akışını koruyacak.

## Fazlar
### Faz 1 — Envanter ve koruma
- Production Fix122 dondurulur.
- Local API endpointleri ve veri koleksiyonları envanterlenir.
- Supabase karşılığı olan/olmayan veri alanları belirlenir.
- Public HTML içindeki seed/kişisel veri kaldırma planı hazırlanır.

### Faz 2 — Supabase şeması
Eksik operasyonel tablolar migration ile eklenir. RLS varsayılan olarak açık tutulur. Mevcut kullanıcı/rol ilişkileri korunur.

### Faz 3 — API geçiş katmanı
UI'yi tek seferde yeniden yazmak yerine mevcut `/api/*` sözleşmesi korunur; endpointler localStorage yerine Supabase okuyup yazacak şekilde sunucu tarafına taşınır.

### Faz 4 — Local backend sökümü
Endpointler doğrulandıktan sonra `window.fetch` interception ve local API emülasyonu kaldırılır. localStorage'da yalnızca cihaz tercihleri kalır.

### Faz 5 — Veri temizliği
Public bundle/HTML içindeki seed kayıtları kaldırılır. Gerekli demo veri yalnızca geliştirme/test ortamında tutulur.

### Faz 6 — Test ve production
Rol bazlı erişim, öğrenci/ders/ödeme/yoklama/telafi/gider akışları test edilir. Vercel preview doğrulandıktan sonra kontrollü production geçişi yapılır.

## Geri dönüş
Her faz bağımsız commit edilir. Fix122 production commit'i değiştirilmeden korunur; başarısız geçişte production Fix122'ye geri alınabilir.
