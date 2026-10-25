# Fix146 — ziyaretçi içeriğinin yönetici görünümüne sızması

Ziyaretçi detay yaması belge genelinde aynı metne sahip düğmeleri bağlıyordu. Yönetici İletişim menüsü de bu kapsamdaydı. Eklenen detay paneli React ana alanının dışında kalıyor, giriş sonrası temizlenmiyor ve MutationObserver tarafından yeniden oluşturulabiliyordu. Ana sayfa eklentisi de görünüm dışında yalnızca gizleniyordu.

Detay eklentisi artık uygulamanın ziyaretçi giriş düğmesinin bulunduğu görünümde ve yalnızca sidebar içindeki ziyaretçi düğmelerine bağlanır. Bu kontrol bir yetkilendirme mekanizması değil, mevcut role göre üretilen DOM üzerinden görsel eklenti kapsamıdır; API veya Supabase yetkileri değişmez. Yönetici görünümünde eklentinin kendi paneli kaldırılır, seçimi temizlenir. Gecikmeli görevler görünüm kimliği ve işlem nesliyle doğrulanır; giriş sonrasında ziyaretçi panelini yeniden ekleyemez. Ana Sayfa seçimi detay panelini temizler. Ana sayfa eklentisi ziyaretçi görünümü dışında kaldırılır ve görünürlük gözlemcisi kapatılır. Çıkış sonrası ziyaretçi içerikleri yeniden oluşturulabilir.

Ziyaretçi yükleyici URL sürümleri artırıldı. React'in yönettiği özgün düğümler taşınmadı veya silinmedi; yalnızca eklentilerin kendi oluşturduğu paneller temizlenir.

## Doğrulama

Altı jsdom regresyon testi yönetici İletişim menüsünü, beş ziyaretçi hizmetini, Ana Sayfa dönüşünü, giriş/çıkış temizliğini, gecikmiş tıklamayı ve gerçek kanonik ziyaretçi HTML'iyle uyumluluğu kapsar. Eski kodla beş test başarısız oldu; düzeltilmiş kodla tümü geçti. Toplam 161 JavaScript testi başarılı. Ayrı kopyada yayın hazırlama komutu başarılı. Canlı yönetici oturumu ile uçtan uca doğrulama yapılmadı. Veritabanı değişikliği yoktur; yayın için sahip onayı gerekir.
