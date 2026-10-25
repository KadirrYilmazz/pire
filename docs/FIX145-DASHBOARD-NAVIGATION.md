# Fix145 — ilk girişten sonra siyah ekran

## Bulgu ve düzeltme

Dashboard takvim yaması `.content > header > .top-actions` düğümünü `sidebar.appendChild(actions)` ile React dışında taşıyordu. React 19.2.6 ile çalışan yerel geçiş testinde dashboard sonrasında bu başlık alanı kaldırıldığında `The node to be removed is not a child of this node.` hatası oluştu ve uygulama kökü kapandı. Bu, bildirilen siyah ekranla uyumlu bir hata mekanizmasıdır; canlı yönetici oturumunun konsol kaydı bu çalışmada alınmadı.

Yama artık React başlığını veya eylem düğümlerini taşımıyor. Dashboard durum sınıfları yalnızca değiştiğinde güncelleniyor. Masaüstünde + Yeni orijinal başlığında sağa hizalı kompakt bir satırda gösteriliyor; gizlenen başlık içinde kalmıyor. Diğer sayfalarda durum sınıfı temizleniyor. Takvim, bildirim ve veri akışına müdahale edilmedi.

## Doğrulama

- Üretimdeki takvim yamasını, uygulamadaki sürümle aynı React/React DOM 19.2.6 ile jsdom içinde çalıştıran regresyon testi eklendi.
- Giriş → dashboard → 10 yönetici menüsü → dashboard akışı iki tur çalıştırılıyor; 40 sayfa geçişinde hata ve kök kapanması denetleniyor.
- Bu test eski kodda ilk geçişte başarısız oldu; düzeltmeyle geçti.
- Tüm 155 JavaScript testi ve ayrı kopyada yayın hazırlama komutu başarılı.
- Mevcut önizleme/rol değiştirme testleri React düğümünün özgün başlıkta kalmasını doğruluyor.

Test, gerçek uygulamanın tam yönetici ekranı veya canlı Supabase oturumuyla uçtan uca test değildir. Canlı tarayıcı ziyaretçi ekranında açıldı; yönetici oturumu bulunmadığından canlı giriş sonrası geçiş teyidi yapılmadı. Yayın sonrası kullanıcının bildirdiği ilk giriş senaryosu ayrıca kontrol edilmeli. React paketleri yalnızca test bağımlılığıdır; üretim bundle sürümü değiştirilmedi. Veritabanı değişikliği yoktur. Yayın öncesi sahip onayı gerekir.
