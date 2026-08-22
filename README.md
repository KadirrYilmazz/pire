# Pİ-RE V0 — Kurtarılmış Orijinal

Bu proje, mevcut chatgpt.site uygulamasından alınan HAR ve tarayıcı bundle'larından oluşturuldu.

## Amaç
- Orijinal HTML/CSS/JS arayüzünü mümkün olduğunca değiştirmeden korumak.
- Aynı Supabase oturum açma akışını kullanmak.
- `/api/*` isteklerini Vercel Function üzerinden mevcut chatgpt.site backend'ine iletmek.
- Böylece mevcut geliştirmeleri yeniden yazmadan kalıcı bir Vercel adresinde çalıştırmayı denemek.

## Hazır olanlar
- Orijinal HTML
- Orijinal CSS ve JS bundle'ları
- Geist font dosyaları
- Pİ-RE logosu
- HAR API envanteri
- Ana uygulama endpoint'leri için Vercel proxy function'ları

## Not
Bu ilk kurtarma sürümü hâlâ orijinal backend'e bağlıdır. Backend erişimi ileride kapanırsa proxy katmanını bağımsız backend ile değiştireceğiz.
