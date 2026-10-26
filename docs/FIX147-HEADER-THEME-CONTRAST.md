# Fix147 — üst menü tema kontrastı (ilk bölüm)

Kapsam: oturum açılmış görünümlerin üst navigasyonu, açılır menüleri ve araç çubuğu. Ziyaretçi görünümü, içerik kartları ve sayfa içi tablolar bu değişikliğin dışında.

Yeni `pire-header-theme.css`, derlenmiş eski CSS'i değiştirmeden yayın bootstrap'ına ayrı dosya olarak eklenir. İki temanın yüzey, metin, seçili, hover, sayaç, finans ve odak renkleri ayrı tanımlanır. Seçili menüye hover uygulanınca metin ve zemin eşleşmesi korunur. Alt span/i etiketleri menünün metin rengini devralır. Açılır menüler aydınlık temada açık, karanlık temada koyu olur. Gelir/gider anlam renkleri korunur, aydınlık temada koyulaştırılır. Önizleme, dil/müzik/filtre, tema, bildirim, çıkış, rol seçici ve arama alanları temaya uyar. Bildirim sayacı iki temada beyaz yazı/koyu kırmızı zemin kullanır. Klavye odağı görünürdür. Düzen, React DOM ve tıklama davranışı değiştirilmedi.

## Kontroller

- Beş sayfa modu, iki tema ve altı etkileşim durumu için navigasyon ve araç düğmelerinin metin/zemin kontrastı en az 4,5:1; rozetler de denetlenir.
- Testler gerçek header CSS kurallarını ve yeni yamanın CSS'ini jsdom ile değerlendirir. İlgisiz içerik kuralları ve media blokları bu modele dahil edilmez. jsdom sınırlaması nedeniyle CSS değişkenleri temanın değerleriyle, hover/focus pseudo durumları aynı specificity'ye sahip test sınıflarıyla değiştirilir. Bu, canlı tarayıcı görsel kontrolünün yerine geçmez.
- Tüm 164 JavaScript testi başarılı; ayrı kopyada yayın hazırlama komutu ve stylesheet yükleyicisi başarılı.
- Canlı yönetici oturumu / mobil tarayıcıda görsel kontrol yapılmadı. Ana sayfa kartlarındaki soluk yazılar sonraki bölümde ele alınmalı.
- Veritabanı ve üretim JavaScript bundle'ları değişmez. Yayın için sahip onayı gerekir.
