# Eğitim İlerletici — Training Helper

Chrome üzerinde desteklenen eğitim sayfaları ile açılan eğitim penceresi arasında geçişi kolaylaştıran eklenti. Güncel sürüm: **1.1.4**.

## İndir

> **Test ve değerlendirme amaçlı deneysel yazılımdır.** Yalnızca izin verilen ortamlarda kullanın. Eğitim yükümlülükleri ve platform kurallarına uyum kullanıcıya aittir; çalışma, ilerleme kaydı veya sertifika garantisi verilmez. Kullanımdan önce [kullanım amacı ve sorumluluk bilgilendirmesini](SORUMLULUK.md) okuyun.

**[Kuruluma hazır ZIP indir](https://github.com/ozdemirumit/training_helper/raw/refs/heads/main/Egitim-Ilerletici.zip)**

Alternatif: [Kaynak kodu ZIP olarak indir](https://github.com/ozdemirumit/training_helper/archive/refs/heads/main.zip) veya GitHub sayfasındaki **Code → Download ZIP** seçeneğini kullanın.

Kurulum için Node.js, Python, terminal veya ücretli bir program gerekmez. ZIP'i çıkartıp Chrome'a yüklemek yeterlidir.

## Chrome'a kurulum

1. Yukarıdaki **Kuruluma hazır ZIP indir** bağlantısına tıklayın.
2. İndirilen dosyaya sağ tıklayıp **Tümünü ayıkla** seçeneğini kullanın. Çıkan klasörü kalıcı bir yerde tutun; kurulumdan sonra silmeyin.
3. Chrome adres çubuğuna `chrome://extensions/` yazıp Enter'a basın.
4. Sağ üstte **Geliştirici modu** seçeneğini açın.
5. **Paketlenmemiş öğe yükle** düğmesine basın.
6. Doğrudan `manifest.json` dosyasını içeren klasörü seçin. ZIP dosyasını seçmeyin. Kaynak ZIP kullandıysanız bu klasör genellikle `training_helper-main` olur.
7. Eğitim İlerletici kartında **1.1.4** sürümünü kontrol edin. Site erişimi sorulursa kullandığınız desteklenen eğitim sitesi için izin verin.
8. Önceden açık olan ana eğitim sayfasını ve eğitim popup'ını yenileyin.

## Kullanım

### Ana sayfadan başlatma

1. Eğitim platformuna normal şekilde giriş yapın. Eğitim ayrıntısını ve ders listesini açın.
2. Sayfanın sağ üstündeki **Eğitim İlerletici** panelinde **Başlat** düğmesine basın.
3. Eklenti, sayfadaki tek etkin **Başla / Devam** düğmesine basar. Bu ilk açılış için eğitim satırını seçmek zorunlu değildir.
4. Açılan eğitim popup'ı otomatik devralır; burada tekrar Başlat'a basmanız gerekmez.
5. Eğitim sayfası hazır olduğunda ileri düğmesine tıklamayı dener.
6. **“İçerik sona erdi. Bu pencereyi kapatabilirsiniz”** mesajı 3 saniye görünür kalınca eğitim sekmesini kapatır. Tek sekmeli popup da kapanmış olur.
7. Ana sayfaya döner. Listede tamamlandı işareti görünür ve sıradaki eğitim kilitsizse o satırı seçip Başla/Devam ile devam eder.

Ana panel popup açıkken bekler. Kapalı konu gruplarını gerektiğinde kendiniz açın. Ana listedeki minimum süre/tamamlanma bilgisi güncellenmediyse eklenti bekler. Liste yapısı tanınmazsa panelde açıklama gösterir.

### Yalnızca eğitim popup'ında kullanım

Eğitimi kendiniz açıp popup üzerindeki panelden **Başlat** diyebilirsiniz. Bu kullanımda içerik sonunda popup kapanır; ana listedeki sonraki ders zinciri için otomasyonu ana sayfadan başlatın.

### Kontroller

| Kontrol | İşlev |
| --- | --- |
| Başlat | Bulunduğunuz ana eğitim sayfasında veya popup'ta çalışmayı başlatır. |
| Durdur / Esc | Ana sayfa ve bağlı popup'taki çalışma oturumunu durdurur. Esc için ilgili sayfa odakta olmalıdır. |
| Pencereyi önde tut | Eğitim popup'ını öne getirir; başka uygulamaya geçerseniz eğitim yeniden öne gelebilir. |
| İleri düğmesini seç | Popup'ta ileri oku otomatik bulunamazsa bir kez seçmenizi sağlar. Seçim tıklaması eğitimi ilerletmez. |
| Mevcut eğitim satırını seç | Ana listedeki ders eşleştirmesine yardımcı olur. Başla/Devam düğmesine basmak için zorunlu değildir. |

Sürüm, panelin ve eklenti menüsünün başlığında sürekli görünür. Popup'ta Chrome araç çubuğu olmasa da sayfa içindeki panel kullanılabilir.

## İleri düğmesi nasıl bulunur?

İleri, İlerle, İlerlet, Sonraki ve Next etiketleri ile düğmenin açıklamaları kontrol edilir. **“İlerlemek için Ctrl + Alt + .”** yazısı fareyle üzerine gelince çıkan bir ipucu olarak değerlendirilir; otomatik klavye kısayolu gönderilmez.

İpucu yalnızca fare üzerine gelince oluşturuluyorsa okun üzerinde kısa süre bekleyebilirsiniz. Bulunamazsa **İleri düğmesini seç** kullanın. Yalnızca anlatım bitince etkinleşen gerçek ileri düğmesini seçin. Elle seçilmiş düğme zaten etkinse kısa bekleme sonunda tıklanabilir.

Düğmenin pasiften aktife geçişi, okunabilir sayfa bitiş mesajı veya görünür HTML video/ses öğelerinin bitmesi izlenir. Pasif düğmeye basılmaz. Tıklamalar arasında en az 5 saniye bulunur; aynı etkin durumda sürekli tıklama yapılmaz. “Tıklandı” mesajı platformun geçişi kabul ettiğini garanti etmez.

## Son düzeltme — 1.1.4

Tamamlanan ders satırı bulunamadığında yeni açılmış dersin başlığı ve etkin Başla/Devam düğmesi kontrol edilir; yeni ders tanınırsa durdurup başlatmadan devam edilir. Ders eşleştirmesinde numaralı ders kodları kullanılarak başlık boşlukları ve ek durum metinlerinden kaynaklanan uyuşmazlıklar azaltılır. Eski dersin Devam düğmesi otomatik tekrar açılmaz. Yeni ders de tanınamazsa liste güncellemesi beklenir.

## Güncelleme

1. Otomasyonu **Durdur** ile durdurun.
2. Güncel ZIP'i indirin ve mevcut eklenti klasörüne çıkarıp dosyaların üzerine yazın.
3. `chrome://extensions/` sayfasında Eğitim İlerletici kartının **yenile** simgesine basın.
4. **Ana eğitim sayfasını ve açık popup'ı da yenileyin.** Yalnızca eklentiyi yenilemek eski açık sayfalardaki kodu değiştirmez.
5. Panelde güncel sürümü kontrol edip Başlat'a basın.

## Sorun giderme

| Mesaj / sorun | Yapılacak işlem |
| --- | --- |
| Bağlantı kesildi | Eklentiyi, ana sayfayı ve popup'ı yenileyin. |
| Başla/Devam bulunamadı | Eğitim ayrıntısını açın. Tek bir görünür ve etkin Başla/Devam düğmesi bulunmalıdır. |
| Popup açılmadı veya eşleşmedi | Chrome'da bu sitenin açılır pencerelerine izin verin; gerekirse sitenin Başla/Devam düğmesine bir kez elle basın. |
| Birden fazla eğitim popup'ı açık | Kullanmadıklarınızı kapatın. Yalnızca aynı ana sayfanın açtığı, aynı alan adındaki tek popup devralınır. |
| İleri düğmesi bulunamadı | İleri oku üzerine fareyi getirin veya panelden düğmeyi seçin. |
| Yeni dersin başlığı yükleniyor | Sayfanın ayrıntılarının güncellenmesini bekleyin. Eski ders başlığı görünürken yeni ders başlatılmaz. |
| Tamamlandı işareti / kilit bekleniyor | Platformun minimum süre ve tamamlanma koşullarını kontrol edin. Liste güncellenmiyorsa sayfayı yenileyin. |
| Sıradaki eğitim yok | Diğer konu grubunu açın; tüm dersler bittiyse Durdur'a basın. |
| Bitiş mesajı var ama pencere kapanmıyor | Otomasyon çalışıyor olmalıdır. Mesaj resim, canvas veya tarayıcının yerel uyarı kutusundaysa okunamaz. |

## Kapsam ve sınırlamalar

- Yalnızca eklentinin `manifest.json` dosyasında tanımlanmış eğitim alan adlarında çalışır. Tüm eğitim siteleriyle uyumlu değildir; farklı alan adındaki içerik çerçeveleri için uyarlama gerekebilir.
- Ders süresini hızlandırmaz, kilitleri açmaz veya SCORM tamamlanma kayıtlarını değiştirmez.
- Sınav yanıtı seçmez. Görünür radyo yanıtlarının bulunduğu çerçevede otomatik ilerleme bekler. Ana listede numaralı E-Eğitim satırları hedeflenir.
- Canvas içindeki yazılar okunamaz. Bitiş işareti ve düğme farklı iframe'lerdeyse metne dayalı algılama çalışmayabilir.
- Ana liste tanıma, HTML başlıklarına, tamamlandı/kilit işaretlerine ve açık konu gruplarına bağlıdır; her oynatıcıyla uyumluluk garanti edilmez.
- Aynı anda tek çalışma oturumu vardır. Popup elle kapatılırsa oturum durur. Chrome kapanınca oturum sıfırlanır.
- Kod testleri çalıştırılmıştır. Bu sürümün tüm akışı, geliştirici tarafından giriş yapılmış gerçek eğitim oturumunda uçtan uca doğrulanmamıştır.

## İzinler ve gizlilik

`storage` izni yerel ayarlar içindir. Desteklenen eğitim sitesine erişim, içerik betiklerinin çalışması ve ana sayfa/popup adresi ile açan sekme ilişkisinin eşleştirilmesi için kullanılır.

Seçilen düğme/satırın CSS yolu, sayfa alan adı ve yolu `chrome.storage.local` içinde saklanır. Çalışma oturumu, sekme kimlikleri ve ders eşleştirme adı geçici `chrome.storage.session` alanında tutulur. Ders gövdesi, şifre veya sınav yanıtı arşivlenmez. Eklentinin ayrı bir sunucusu, analitik servisi veya dışarıya veri gönderme özelliği yoktur. Normal sayfa düğmelerine basılması platformun kendi isteklerini tetikler.

Kaldırmak için `chrome://extensions/` sayfasından **Kaldır** seçeneğini kullanın; eklentinin yerel kayıtları da silinir.

## Geliştirme ve test

Son kullanıcı için bu bölüm gerekli değildir. Geliştirme testleri Node.js ile çalışır; ek paket kurulumu gerekmez.

```powershell
git clone https://github.com/ozdemirumit/training_helper.git
cd training_helper
node detector.test.cjs
node launcher.test.cjs
node main-launch.test.cjs
node background.test.cjs
node --check content.js
node --check background.js
node --check popup.js
```

Paket hazırlamak için PowerShell'de:

```powershell
./build.ps1
```

Bu işlem manifestteki kod dosyalarını ve README'yi `Egitim-Ilerletici.zip` içine paketler. ZIP kökünde `manifest.json` bulunur.

## Sorumluluk

Bu proje herhangi bir kurumun veya eğitim platformunun resmi uygulaması değildir. Test ve değerlendirme amaçlıdır; eğitim içeriğini takip etme veya değerlendirmelere şahsen katılma yükümlülüğünün yerine geçmez. Kullanıcı platform ve kurum kurallarına uyumu, gerekli izinleri ve ilerleme kayıtlarının doğruluğunu kontrol etmelidir.

Yazılım mevcut haliyle sunulur. Mevzuatın izin verdiği ölçüde geliştirici ve katkıda bulunanlar kullanım sonuçları için garanti vermez ve sorumluluk üstlenmez. Kanunen sınırlandırılamayan sorumluluklar ve vazgeçilemeyen haklar saklıdır. Ayrıntılar: [SORUMLULUK.md](SORUMLULUK.md).
