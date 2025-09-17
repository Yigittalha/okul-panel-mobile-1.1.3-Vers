# Okul Panel - Mobil Uygulama

Modern eğitim yönetim sistemi için geliştirilmiş React Native tabanlı mobil uygulama.

## 🚀 Özellikler

### 👨‍🏫 Öğretmen Paneli
- **Dashboard:** Genel bakış ve hızlı erişim
- **Ders Programı:** Haftalık ders planlaması
- **Yoklama Al:** Öğrenci devamsızlık takibi
- **Sınavlarım:** Sınav oluşturma ve yönetimi
- **Verdiğim Ödevler:** Ödev atama ve takibi
- **Mesaj Gönder:** Öğrenci/veli iletişimi
- **Gelen Kutusu:** Gelen mesajları görüntüleme

### 👨‍🎓 Öğrenci Paneli
- **Ana Sayfa:** Kişiselleştirilmiş dashboard
- **Ödevlerim:** Atanan ödevleri görüntüleme
- **Sınavlarım:** Sınav takvimi ve sonuçları
- **Notlarım:** Akademik performans takibi
- **Ders Programı:** Haftalık program görüntüleme
- **Devamsızlık Geçmişi:** Devamsızlık durumu
- **Mesaj Gönder:** Öğretmen/veli iletişimi
- **Gelen Kutusu:** Gelen mesajları görüntüleme

### 👨‍👩‍👧‍👦 Veli Paneli
- **Ana Sayfa:** Çocuğunun genel durumu
- **Profil:** Öğrenci bilgileri
- **Ödevlerim:** Çocuğunun ödevleri
- **Sınavlarım:** Sınav sonuçları
- **Notlarım:** Akademik performans
- **Ders Programı:** Haftalık program
- **Devamsızlık Geçmişi:** Devamsızlık takibi
- **Mesaj Gönder:** Öğretmen iletişimi
- **Gelen Kutusu:** Gelen mesajlar

## 🎨 Tema Sistemi

### Light Theme (Varsayılan)
- Temiz ve modern açık renk paleti
- Yüksek kontrast ve okunabilirlik
- Eğitim ortamına uygun tasarım

### Dark Theme (Klasik)
- Göz yormayan koyu renk paleti
- Gece kullanımı için optimize edilmiş
- Modern ve şık görünüm

#### Tema Token'ları
Tüm tema ayarları `src/constants/colors.js` dosyasında tanımlanmıştır:

```javascript
// Dark Theme Token'ları
background: '#0B0F14'     // Ana arka plan
surface: '#121417'        // Yüzey rengi
card: '#161A20'           // Kart arka planı
border: '#232A33'         // Kenarlık rengi
textPrimary: '#E6E8EB'    // Ana metin
textSecondary: '#AAB2BD'  // İkincil metin
accent: '#4F9CF9'         // Vurgu rengi
```

## 🛠️ Teknolojiler

- **React Native:** Mobil uygulama framework'ü
- **Expo:** Geliştirme ve dağıtım platformu
- **React Navigation:** Sayfa geçişleri
- **Context API:** State yönetimi
- **AsyncStorage:** Yerel veri saklama
- **Axios:** HTTP istekleri
- **React Native Safe Area Context:** Güvenli alan yönetimi

## 📱 Kurulum

### Gereksinimler
- Node.js (v14 veya üzeri)
- npm veya yarn
- Expo CLI
- Android Studio (Android için)
- Xcode (iOS için)

### Adımlar

1. **Repository'yi klonlayın:**
```bash
git clone https://github.com/username/okul-panel-mobile.git
cd okul-panel-mobile
```

2. **Bağımlılıkları yükleyin:**
```bash
npm install
```

3. **Uygulamayı başlatın:**
```bash
npm start
```

4. **Platform seçin:**
- Android: `a` tuşuna basın
- iOS: `i` tuşuna basın

## 🚀 Otomatik GitHub Yükleme

Proje için otomatik GitHub yükleme özellikleri mevcuttur:

### 1. Bash Script ile (Tavsiye edilen)
```bash
npm run github
```
veya
```bash
./upload.sh
```

### 2. Node.js Script ile
```bash
npm run upload
```
veya
```bash
node github-upload.js
```

### İlk Kullanım
İlk çalıştırmada aşağıdaki bilgileri girmeniz gerekir:
- GitHub kullanıcı adınız
- GitHub email adresiniz
- Repository URL'iniz

Bu bilgiler `.github-config` dosyasına kaydedilir ve sonraki kullanımlarda otomatik olarak kullanılır.

## 📁 Proje Yapısı

```
src/
├── app/                    # Sayfa bileşenleri
│   ├── admin/             # Yönetici paneli
│   ├── auth/              # Kimlik doğrulama
│   ├── common/            # Ortak bileşenler
│   ├── parent/            # Veli paneli
│   ├── student/           # Öğrenci paneli
│   └── teacher/           # Öğretmen paneli
├── components/            # Yeniden kullanılabilir bileşenler
├── constants/             # Sabitler ve konfigürasyon
├── lib/                   # Yardımcı kütüphaneler
├── navigation/            # Navigasyon yapılandırması
├── state/                 # State yönetimi
└── theme/                 # Tema ayarları
```

## 🎯 Özellik Detayları

### Animasyonlar
- Öğrenci anasayfasında tatlı giriş animasyonları
- Staggered kart animasyonları
- Smooth geçişler ve hover efektleri

### Responsive Tasarım
- Tüm ekran boyutlarına uyumlu
- Safe area optimizasyonu
- Dinamik padding ve margin değerleri

### Performans
- Native driver kullanımı
- Optimize edilmiş render döngüleri
- Lazy loading ve memoization

## 🔧 Geliştirme

### Yeni Özellik Ekleme
1. İlgili panel klasöründe yeni sayfa oluşturun
2. `AppDrawer.js`'e route ekleyin
3. `menuSchema.js`'e menü öğesi ekleyin
4. Gerekirse `StudentBottomMenu`'ye ekleyin

### Tema Özelleştirme
`src/constants/colors.js` dosyasındaki token'ları düzenleyerek tema renklerini değiştirebilirsiniz.

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📞 İletişim

Proje hakkında sorularınız için issue açabilir veya iletişime geçebilirsiniz.

---

**Okul Panel** - Modern eğitim yönetimi için tasarlandı 🎓