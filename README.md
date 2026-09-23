# Rehber — Güneş Sistemi Turu

NASA Space Apps 2026 MVP. Bir robot rehber eşliğinde gezilen 3B güneş sistemi:
gök cisimlerine tıkla, kamera yaklaşsın, visual-novel tarzı diyalog kutusunda
rehber o cismi anlatsın. Asteroitlerde ayrıca bir çarpma simülasyonu var.

## Çalıştırma

```bash
npm install --legacy-peer-deps   # @react-three/fiber, React 19 ile peer uyarısı veriyor
npm run dev                      # http://localhost:5173
npm run build                    # üretim derlemesi
```

Node 20.19+ gerekiyor (Vite 8).

## Kullanım

- **Genel görünüm**: sürükle → döndür, tekerlek → yakınlaş/uzaklaş.
- Bir cisme **tıkla** (ya da soldaki durak listesinden seç) → kamera yaklaşır,
  alttan diyalog kartı gelir.
- **Enter / Boşluk**: sıradaki replik (metin akarken basarsan yazımı atlar).
  **Esc** ya da boşluğa tıklamak: genel görünüme dön. Çarpma çalışma sayfası
  açıkken Esc önce onu kapatır, ikinci Esc genel görünüme döner.
- Asteroitlerde son replikten sonra **"Çarpma hesabını aç"** çıkar.
- Ay'ın son repliğinde **"Diğer yüzü çevir"** → uzak yüz modeli yüklenir.

## Mimari

```
src/
  content/bodies.json      gezegenler + Ay: model, konum, diyalog, künye
  content/asteroids.json   4 asteroit + simülasyon varsayılanları
  content/index.ts         JSON'u tipli Body[] hâline getirir
  types.ts                 Body / PlanetBody / AsteroidBody
  store.ts                 zustand: mod, odak, replik indeksi, açılan içerikler
  systems/
    impact.ts              çarpma fiziği (enerji + krater ölçekleme)
    geometry.ts            STL normalize, glb normalize, halka UV'si, halka dokusu
  components/
    Scene.tsx              Canvas, ışık, OrbitControls
    CameraRig.tsx          odak geçişinde kamera lerp'i
    bodies/                BodyMesh (model tipi dağıtımı), FocusBrackets, Environment
    ui/                    DialogueCard, ImpactWorksheet, RobotGuide, Chrome
```

Durum yönetimi için tek bir küçük zustand store yeterli; Redux yok.

Birkaç küçük ama görünür karar:

- **Odak ayraçları ekran uzayında bir alt sınıra sahip** (`FocusBrackets`).
  Genel görünümde asteroitler birkaç piksel; ayraç onlara birebir sarılsaydı
  görünmezdi. Alt sınır dünya biriminde sabitlenseydi de bu sefer cisme
  yaklaşınca kayanın kat kat üstünde bir çerçeve çizilirdi. Sınırı kamera
  mesafesine göre piksele çevirip uyguluyoruz.
- **Yıldız alanı tohumlu bir PRNG ile üretiliyor** (`Environment`), yani her
  yüklemede birebir aynı. Ekran görüntüsü alırken ve sunumu tekrarlarken
  sahnenin değişmemesi işe yarıyor.

## Varlıklar

Kaynak dosyalar `nasa_3d_models/` altında; `public/` içine normalize edilmiş
adlarla kopyalandı.

| Sahnedeki cisim | Kaynak dosya | Biçim |
|---|---|---|
| Dünya | `earth/realistic_3d_earth_model_with_4k_textures.glb` | glb (8,4 MB) |
| Ay — yakın yüz | `moon/Moon (near side).stl` | STL (12,4 MB) |
| Ay — uzak yüz | `moon/Moon (far side).stl` | STL (12,4 MB) |
| Mars | `mars/Mars.jpg` | doku → `SphereGeometry` |
| Satürn | `saturn/Saturn.jpg` | doku → `SphereGeometry` |
| Bennu | `asteroids/bennıu/Bennu_1_1.glb` | **glb** |
| Kleopatra / Mithra / Toutatis | `asteroids/*/…stl` | STL |

**Şartnameden sapmalar (varlıkların gerçek hâli böyleydi):**

1. **Bennu STL değil, glb.** Dört asteroidin üçü STL, Bennu glb. `BodyMesh`
   her iki yolu da destekliyor.
2. **Satürn halka dokusu yok.** Halka, `geometry.ts` içinde canvas ile
   prosedürel üretiliyor (bantlı radyal gradient + Cassini boşluğu).
3. **Ay'ın uzak yüzü tembel yükleniyor.** İki STL de 12,4 MB; ikisini birden
   indirmek açılışa 25 MB ekliyordu. Uzak yüz ancak rehber teklif edip
   kullanıcı kabul edince yükleniyor.

STL'ler renk/UV/materyal taşımaz. Her STL yüklendikten sonra normalleri
yeniden hesaplanıyor, sınırlayıcı kutu merkezi orijine çekiliyor ve
sınırlayıcı küre 1 birime normalize ediliyor (`systems/geometry.ts`);
ölçek tamamen `visualScale` ile kontrol ediliyor.

<!-- TODO: Sketchfab lisansını doğrula, submission öncesi attribution ekle.
     earth.glb (realistic_3d_earth_model_with_4k_textures) Sketchfab kaynaklı
     ve lisansı netleşmedi. Bennu_1_1.glb'nin kaynağı da doğrulanmalı. -->

## Yer tutucu olan şeyler

Bunlar bilerek geçici; jüri sunumundan önce güncellenecek:

- **Diyalog metinleri** — `bodies.json` / `asteroids.json` içindeki tüm
  `dialogue` dizileri taslak. Ton denemesi olarak yazıldı, final metin değil.
- **Mithra'nın yoğunluğu** — ölçülmemiş. S-tipi asteroitler için tipik olan
  2.700 kg/m³ varsayıldı. Diğer üçünün çap/yoğunluk değerleri gerçek
  yayımlanmış ölçümler (Bennu: OSIRIS-REx; Toutatis: Goldstone radar;
  Kleopatra: VLT/SPHERE). Her cismin `dataNote` alanı bunu arayüzde de yazıyor.
- **Çarpma hızları** — tipik senaryo varsayımları, gerçek yörünge çözümü değil.
  Kleopatra ana kuşakta kalır; onun çarpma senaryosu tamamen varsayımsal.
- **Sketchfab lisansı** — yukarıdaki TODO.
- **Sahne mesafeleri ve boyutları** — gerçek astronomik ölçek kullanılmıyor
  (kullanılsa sahne gezilemez olurdu). Mesafeler sıkıştırıldı, boyutlar ise
  göreli sıralama korunacak şekilde ölçeklendi:
  Satürn > Dünya > Mars > Ay > asteroitler.

## Çarpma hesabı hakkında

`systems/impact.ts`, iki adımlı:

1. **Enerji** — kesin fizik. Küre hacmi → kütle → ½mv², sonra 4,184×10¹⁵ J'ye
   bölerek megaton TNT.
2. **Krater çapı** — Collins, Melosh & Marcus (2005), *Earth Impact Effects
   Program* ölçekleme denklemi. **Bu bir tahmindir**, bilimsel kesinlik iddia
   etmez; arayüzde de böyle yazıyor. Atmosferde parçalanma, hedef tipi ve
   karmaşık krater çöküşü modellenmedi.

Referans değerlerle doğrulandı:

| Senaryo | Enerji | Final krater |
|---|---|---|
| 10 km / 20 km·s⁻¹ / 3.000 kg·m⁻³ (Chicxulub mertebesi) | 7,5×10⁷ MT | 86 km |
| Bennu: 490 m / 12,7 km·s⁻¹ | 1.410 MT | 4,9 km |
| 60 m / 17 km·s⁻¹ (Tunguska mertebesi) | 7,8 MT | 1,3 km |

Yayımlanmış Chicxulub kestirimi ~10⁸ MT ve 150–180 km'lik *karmaşık* bir
krater; buradaki 1,25× basit-krater katsayısı karmaşık kraterleri olduğundan
küçük gösteriyor. Mertebe doğru, kesinlik iddiası yok.

## Bilinen uyarılar

- Konsolda `THREE.Clock: This module has been deprecated` uyarısı görülebilir.
  Kaynağı `@react-three/fiber`'ın olay döngüsü, bizim kodumuz değil; sürüm
  yükseltmesiyle kaybolur. Bunun dışında konsol temiz.
- Tipografi Google Fonts'tan (Space Grotesk, IBM Plex Sans) çekiliyor.
  Makinede ağ yoksa konsolda font isteği hataları görünür ve sistem
  yazı tipine düşülür — düzen bozulmaz. Sunumda ağ garanti değilse fontları
  `public/` altına indirip yerelden servis etmek yeterli.

## MVP kapsamı dışında

Canlı NASA API'leri (NeoWs, JPL SBDB), sekiz gezegenin tamamı, ses/TTS,
3B karakter rigging, hesap/backend, çoklu dil. Mobilde temel responsive var,
piksel hassasiyetinde mobil UI hedeflenmedi.
