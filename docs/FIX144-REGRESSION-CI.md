# Fix144 — regresyon testleri ve CI

Üç eski test, Fix137/Fix138 ile kaldırılan capture-phase DOM geri taşıma davranışını bekliyordu. Uygulama kodu değiştirilmeden testler mevcut davranışı koruyacak şekilde yenilendi.

- Yönetici önizleme ve rol değiştirme olayları uygulama işleyicisine ulaşmadan dashboard düğümlerini taşımamalı.
- Dashboard dışına çıkıldığında yeni sayfanın React başlığı yerinde kalmalı.
- Altı rapor sekmesi doğru grupları göstermeli, düğümlerin ebeveynleri korunmalı, seçim kaydedilmeli.
- Klavye dolaşımı, odak, geçersiz kayıtlı seçim, form olayları ve sayfadan çıkış doğrulanır.

Testler üretimdeki JavaScript dosyalarını jsdom 26.1.0 ile çalıştırır. Zamanlayıcılar ve MutationObserver bildirimleri kontrollüdür; gerçek tarayıcı, React hydration, oturum açma veya canlı veritabanı testi yerine geçmez.

CI artık tüm JavaScript testlerini zorunlu çalıştırır; eski continue-on-error işi kaldırıldı. SQL grubu korunur. main push ve PR tetikleyicileri vardır. Checkout/setup-node mevcut v4 sürümlerinin commit SHA değerlerine sabitlendi. ci-required iki grubun sonucunu denetler. Bu YAML tek başına merge veya Vercel otomatik yayını engellemez; bunun için platformda required-check ayarı gerekir. Yayın öncesi sahip onayı ve CI sonucu kontrolü sürdürülür.

Yerel sonuç: 154 JavaScript ve 16 SQL testi başarılı. Veritabanı migration veya uygulama davranışı değişikliği yoktur.
