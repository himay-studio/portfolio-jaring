# MEDIA.md, Jaring

## Tidak ada satu pun gambar yang perlu digenerate.

Manifestnya kosong dengan sengaja. Ini jawaban yang benar untuk aplikasi ini,
bukan kemalasan, dan bukan juga kompromi karena kredit gambar habis.

Stage 4 (Media Producer) tidak punya pekerjaan generate di build ini.

---

## Kenapa kosong

Jaring adalah alat kerja, bukan materi promosi. `BRAND.md` bagian 6 sudah
menyatakannya: kemasan sebuah CRM adalah antarmukanya sendiri, dan yang dilihat
calon pembeli pertama kali adalah tangkapan layar papan pipeline. Bukan mockup
laptop melayang di atas gradien ungu, bukan ilustrasi orang kartun 3D, bukan
foto stok jabat tangan. Semua itu tanda SaaS generik.

Jadi setiap tempat yang di aplikasi lain diisi gambar, di sini diisi sesuatu
yang lebih tepat:

| Kebutuhan | Cara Jaring mengisinya | Di mana |
| --- | --- | --- |
| Avatar orang | Inisial di atas blok warna, persegi sesuai R10. Delapan warna, semuanya lulus 4.5:1 dengan teks putih, angkanya ada di `DESIGN.md` 3.2. Warna ditentukan dari id, jadi orang yang sama selalu satu warna di layar mana pun. | `components/ui/Basic.tsx`, `Avatar` |
| Logo pelanggan, foto barang, thumbnail | Blok inisial yang sama. Perusahaan pelanggan memakai `Avatar` dengan id perusahaannya. | `app/app/perusahaan/` |
| Ilustrasi keadaan kosong | Bentuk geometris SVG yang ditulis sendiri, kisi siku senada motif logo, warna `--border-strong`. | `components/ui/Basic.tsx`, `EmptyState` |
| Grafik dan diagram | Dirender dari data sebagai SVG. Selalu tajam, selalu sinkron dengan angkanya, dan bisa dibaca pembaca layar lewat tabel bayangan. | `components/charts/Charts.tsx` |
| Motif visual di landing dan login | Kisi dari logo, digambar dengan dua `linear-gradient`. Muncul sekali saja, dan tidak pernah di belakang teks yang harus terbaca. | `.grid-motif` di `styles/pages.css` |
| Papan pipeline di landing | Papan sungguhan yang digambar dari data demo yang sama dengan aplikasinya. | `app/page.tsx` |

Pola avatar inisial ini bukan jalan pintas. Linear, Jira, dan Notion memakainya,
dan untuk halaman daftar berisi puluhan baris memang lebih benar: nol permintaan
gambar, nol pergeseran tata letak saat gambar selesai dimuat, dan tidak ada
wajah hasil generate yang terlihat palsu di ukuran 24px.

---

## Aset yang sudah ada, jangan digenerate ulang

Semuanya sudah di `public/` dari Stage 2 dan sudah terpasang di aplikasi.

| Berkas | Dipakai di |
| --- | --- |
| `logo-jaring.svg`, `logo-jaring.png` | Rujukan varian terang |
| `logo-jaring-knockout.svg`, `logo-jaring-knockout.png` | Rujukan varian knockout untuk latar gelap `#0D2229` |
| `mark-jaring.svg` | Rujukan mark untuk sidebar tertutup |
| `favicon.ico`, `favicon-16.png`, `favicon-32.png`, `favicon-48.png` | `<link rel="icon">` di `app/layout.tsx` |
| `apple-touch-icon.png` | `<link rel="apple-touch-icon">` |
| `icon-192.png`, `icon-512.png` | Ikon PWA |

Catatan dari Stage 2 yang tetap berlaku: favicon 16 dan 32 memakai varian J
pejal tanpa kisi, karena kisi tipisnya hilang kena anti-aliasing di 16px. Itu
disengaja dan sudah diuji, jangan "diperbaiki".

Di dalam aplikasi, geometri kisi logo di-inline sebagai komponen React
(`components/Logo.tsx`) dengan koordinat, warna, dan tebal garis yang sama
persis dengan berkas Stage 2. Alasannya ada di `LAYOUT-ARCHITECTURE.md` bagian
3.9: berkas Stage 2 menulis wordmark sebagai `<text>` dengan Plus Jakarta Sans,
dan SVG yang dimuat lewat `<img>` tidak bisa mengambil webfont dari halaman.

---

## Satu hal yang belum ada, dan itu bukan pekerjaan model gambar

`ART-DIRECTION.md` bagian 4 mendaftarkan `O01 public/og-jaring.png` 1200x630
sebagai gambar Open Graph, dan bagian 5 sudah menyarankan sendiri agar dibuat
sebagai render HTML statis, bukan hasil generate model, karena hasilnya lebih
tajam dan teksnya pasti benar.

Keadaan sekarang: berkasnya **belum ada**, dan `app/layout.tsx` sengaja **tidak**
menunjuk ke sana. Sebuah `og:image` yang menunjuk berkas yang tidak ada di
`public/` akan 404 di produksi, dan itu kelas kegagalan yang sama dengan hero
video yang mati (R15) dan ikon WhatsApp yang tidak disalin (R17). Lebih baik
tidak ada meta gambar sama sekali daripada ada tapi rusak.

Dampaknya kalau tetap tidak dibuat: pratinjau tautan di WhatsApp dan media
sosial tampil tanpa gambar. Tidak ada yang rusak di halamannya sendiri.

Kalau mau dibuat, ini isinya, disalin dari `ART-DIRECTION.md` bagian 5:

- Ukuran 1200x630, latar `#0D2229` penuh.
- Lockup logo varian knockout di kiri atas.
- Judul besar `Jaring`, Plus Jakarta Sans ExtraBold, warna `#FFFFFF`.
- Baris bawah judul `CRM pipeline penjualan`, warna `#9FB6BE`.
- Sisi kanan: potongan papan kanban disederhanakan, tiga kolom siku berlatar
  `#16323B` berisi kartu `#1E404B` dengan batang tepi kiri berwarna tahap.
- Sudut kanan bawah `Portfolio app by Himay Studio`, warna `#9FB6BE`.
- Semua sudut siku, tanpa gradien.

Cara paling jujur membuatnya, dan ini yang disarankan: render dari HTML atau SVG
statis. Aplikasi ini sudah punya semua bahannya, jadi tidak perlu satu pun
panggilan berbayar. Begitu berkasnya ada di `public/og-jaring.png`, tambahkan
`images: ['/og-jaring.png']` ke blok `openGraph` di `app/layout.tsx`.

---

## Ringkasan untuk Stage 4

| | |
| --- | --- |
| Gambar yang perlu digenerate | **0** |
| Video yang perlu digenerate | **0** (R2, R15, R30, R44 tidak berlaku untuk app portfolio, per HIM-283) |
| Aset yang sudah lengkap | Logo dua varian, mark, set favicon lengkap, ikon PWA |
| Satu satunya yang belum ada | `public/og-jaring.png`, dibuat dengan render statis, bukan model gambar |

Kredit gambar yang habis di tingkat akun tidak memblokir apa pun di build ini.
