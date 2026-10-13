# Pİ-RE — Mevcut web uygulaması

Kurtarılmış HTML ve derlenmiş React/Vinext ön yüzü, ek JavaScript katmanları,
Vercel API'leri ve kalıcı Supabase veritabanından oluşur. Özgün TSX kaynakları
bu depoda bulunmaz. Operasyon API'leri eski chatgpt.site proxy'si yerine
Supabase Auth doğrulaması, PostgREST ve RLS korumalı tabloları kullanır.

## Dizinler

- `index.html`, `assets/`, `pire-*.js`: mevcut ön yüz ve uyumluluk katmanları.
- `api/`, `lib/`: Vercel API ve iş kuralları.
- `supabase/migrations/`: kayıtlı migration geçmişi ve hazırlanmış yeni migration'lar.
- `supabase/functions/`: canlı kaynaklarıyla karşılaştırılmış Edge Function'lar.
- `supabase/source-inventory.json`: 13 Ekim 2026 kaynak envanteri.
- `supabase/historical-source-migrations/`: önceki kaynak arşivi; yeniden uygulamayın.

## Kontroller

```bash
node --test tests/*.test.js
npm ci --prefix tests/sql --ignore-scripts --no-audit --no-fund
node --test tests/sql/*.test.cjs
```

Tam tarihsel JavaScript grubunda bilinen eski DOM testi başarısızlıkları vardır.
Zorunlu CI grubu ve SQL testleri ayrı çalışır. Vercel build komutu
`node scripts/fix123-strip-legacy-backend.js` ile mevcut çıktı temizlenir;
bu komut özgün React uygulamasını yeniden derlemez.

## Supabase kaynakları ve yayın

[Fix142 kayıt akışı](docs/FIX142-ATOMIC-STUDENT-REGISTRATION.md) ve
[Fix143 kaynak eşitlemesi](docs/FIX143-SUPABASE-SOURCE-SYNC.md) yayın sırasını,
şema testlerini ve kapsam sınırlarını açıklar. Tarihsel bootstrap e-posta
bilgisi kamuya açık kaynakta şablonla tutulur; yeni ortam kurulumunda özel
çalışma kopyası hazırlayın. Gizli anahtarları ve kullanıcı/veri yedeklerini
bu depoya koymayın. Production yayın ve migration uygulaması sahibin onayını gerektirir.
