# ART-DIRECTION.md, Jaring

Arah visual dan daftar aset untuk aplikasi CRM Jaring. Ditulis Stage 1 (HIM-287). Pembaca utamanya **Asset Forge (Stage 2)** untuk logo dan favicon, lalu **Webapp Architect (Stage 3)** dan **Media Producer (Stage 4)** untuk sisa aset.

Semua nilai warna diambil dari `DESIGN.md`. Jangan mengarang warna baru di sini.

---

## 1. Sikap visual dalam satu kalimat

Jaring terlihat seperti **alat kerja yang dirawat**, bukan seperti materi promosi. Bidang siku, garis rambut tipis, teal laut dalam, dan angka yang rapi. Kalau ada yang bisa dihapus tanpa mengurangi arti, hapus.

**Yang dikejar:** tenang, padat, presisi, jujur.
**Yang dihindari:** ceria berlebihan, gradien, kilau, bayangan tebal, sudut membulat, ilustrasi orang.

---

## 2. Logo

### 2.1 Konsep

Nama Jaring berarti jala, dan jala adalah kisi. Kisi juga bentuk dasar tabel dan papan kanban di dalam aplikasi. Jadi logonya adalah **monogram J yang tumbuh dari sebuah kisi jaring**, bukan huruf J yang ditempeli ikon.

Bentuknya begini. Bayangkan satu bidang persegi. Di dalamnya ada kisi tipis 4 kolom kali 4 baris, seperti jala yang direntang. Beberapa simpul di kisi itu diisi penuh menjadi kotak kecil pejal, dan urutan simpul yang terisi membentuk jalur huruf **J**, yaitu turun di kolom kanan lalu berbelok ke kiri di baris paling bawah. Satu simpul di ujung kail J diisi warna teal terang, itulah prospek yang tertangkap.

Jadi dari jauh terbaca sebagai huruf J yang tegas, dan dari dekat terbaca sebagai jala dengan satu simpul menyala. Dua bacaan itu keduanya benar dan itulah inti idenya.

**Aturan bentuk yang tidak bisa ditawar:**

- Semua sudut siku, `border-radius: 0`, termasuk simpul kisi (R10). Simpul berbentuk kotak kecil, bukan titik bulat.
- Kisi digambar dengan garis lurus rata, tebal seragam. Tidak ada garis melengkung, tidak ada tali yang terpilin, tidak ada tekstur.
- Latar **transparan**. Logo bukan blok berwarna yang berdiri sendiri. Ini larangan langsung dari R43, dan ini penyebab logo Legatara terbaca sebagai kotak kosong di footer.
- Tidak ada gradien, tidak ada bayangan, tidak ada efek 3D, tidak ada garis luar tebal.

### 2.2 Dua varian wajib (R43)

Aplikasi ini punya sidebar gelap dan kanvas terang, jadi kedua varian benar-benar dipakai di layar yang sama. Ini bukan formalitas.

**Varian A, primary, untuk latar terang** (`--surface` `#FFFFFF` dan `--bg` `#F4F7F8`)

| Bagian | Warna |
| --- | --- |
| Garis kisi | `#084B57` (`--brand-deep`) |
| Simpul pejal pembentuk J | `#0C6B7A` (`--brand`) |
| Simpul sorot di ujung kail | `#5B3FBF` (`--accent`, 7.22:1 di atas putih) |
| Wordmark "Jaring" | `#0E1F24` (`--text`) |

**Varian B, knockout, untuk latar gelap** (`--ink` `#0D2229`, sidebar aplikasi)

| Bagian | Warna |
| --- | --- |
| Garis kisi | `#9FB6BE` (`--ink-text-muted`, 7.75:1 di atas `--ink`) |
| Simpul pejal pembentuk J | `#E8F0F2` (`--ink-text`, 14.22:1) |
| Simpul sorot di ujung kail | `#35B3C4` (`--brand-bright`, 6.57:1) |
| Wordmark "Jaring" | `#FFFFFF` (16.43:1) |

Varian B bukan sekadar varian A yang diputihkan seluruhnya. Kisi sengaja dibuat lebih redup daripada simpul supaya huruf J tetap yang pertama terbaca. Simpul sorot berganti dari violet ke teal terang di varian B karena violet `#5B3FBF` hanya sekitar 2.3:1 di atas `--ink`, terlalu gelap untuk latar gelap.

Ada juga **varian monokrom satu warna** untuk favicon kecil dan tempat yang tidak bisa menampung dua nada, yaitu seluruh mark satu warna pejal, `#084B57` di latar terang dan `#FFFFFF` di latar gelap.

### 2.3 Lockup

- **Lockup mendatar** (dipakai di header sidebar saat terbuka, dan di landing): mark di kiri, wordmark di kanan, jarak antara sama dengan setengah tinggi mark. Tinggi wordmark kira kira 62 persen tinggi mark.
- **Mark saja** (dipakai saat sidebar tertutup 64px, dan untuk favicon): hanya bidang kisi.
- **Ruang aman**: minimal setinggi satu sel kisi di keempat sisi. Jangan ada elemen lain masuk ke area itu.
- **Ukuran minimum**: lockup mendatar 96px lebar, mark saja 20px. Di bawah 20px pakai varian monokrom.

Wordmark memakai **Plus Jakarta Sans Bold (700)**, huruf J besar dan sisanya kecil, jarak huruf sedikit dirapatkan `-0.01em`. Ditulis **Jaring**, tidak pernah JARING dan tidak pernah jaring.

### 2.4 Yang dilarang pada logo

- Blok persegi berwarna pekat yang jadi latar logo itu sendiri (R43).
- Ikon corong penjualan, panah naik, grafik batang, jabat tangan, atau perisai. Semua itu klise CRM.
- Ikan, perahu, atau apa pun yang membuat jaring terbaca sebagai perikanan. Metaforanya jala sebagai kisi, bukan nelayan.
- Sudut membulat pada bagian mana pun.
- Efek gradien mesh atau bayang jatuh.

### 2.5 Prompt siap pakai untuk Asset Forge

Prompt lengkap ada di `LOGO.md`, termasuk instruksi favicon dan tutorial Google Flow. `LOGO.md` adalah sumber tunggal untuk generate logo. Dokumen ini menjelaskan alasannya, `LOGO.md` yang berisi teks yang ditempel.

---

## 3. Ikonografi

- Satu set ikon garis, tebal garis **1.5px** pada kanvas 20px atau 24px, ujung garis siku (`stroke-linecap: butt`, `stroke-linejoin: miter`). Sudut membulat pada ikon dilarang, supaya sejalan dengan R10.
- Sumber yang disarankan: Lucide, dengan `strokeLinecap` dan `strokeLinejoin` di-override jadi siku. Jangan mencampur dua keluarga ikon.
- Ikon di sidebar memakai `--ink-text-muted`, jadi `--ink-text` saat aktif atau hover.
- Ikon di kanvas terang memakai `--text-muted` (6.67:1), dan `--brand` saat menandai aksi merek.
- Ikon tidak pernah berdiri sendiri sebagai satu satunya penjelas aksi. Selalu ada label teks atau `aria-label` plus tooltip.

Ikon per modul, dikunci supaya konsisten lintas stage: Dashboard (grid), Leads (magnet), Kontak (user), Perusahaan (building), Deals (kanban columns), Aktivitas (calendar-clock), Penawaran (file-text), Laporan (bar-chart), Pengaturan (sliders).

---

## 4. Daftar aset yang dibutuhkan

Aplikasi ini sedikit asetnya dan itu memang disengaja. Tidak ada foto produk, tidak ada foto stok, tidak ada video hero (R2, R15, R30, R44 tidak berlaku untuk app portfolio sesuai HIM-283).

| ID | Berkas | Ukuran | Dibuat oleh | Keterangan |
| --- | --- | --- | --- | --- |
| L01 | `public/logo-jaring.png` | 1024x1024 | Stage 2 | Master varian A, latar transparan |
| L02 | `public/logo-jaring-knockout.png` | 1024x1024 | Stage 2 | Master varian B, latar transparan |
| L03 | `public/logo-jaring.svg` | vektor | Stage 2 | Lockup mendatar varian A, `currentColor` bila memungkinkan |
| L04 | `public/logo-jaring-knockout.svg` | vektor | Stage 2 | Lockup mendatar varian B |
| L05 | `public/mark-jaring.svg` | vektor | Stage 2 | Mark saja, untuk sidebar tertutup |
| F01 | `public/favicon.ico` | 16, 32, 48 multi | Stage 2 | Dari varian monokrom |
| F02 | `public/favicon-16.png` | 16x16 | Stage 2 | |
| F03 | `public/favicon-32.png` | 32x32 | Stage 2 | |
| F04 | `public/favicon-48.png` | 48x48 | Stage 2 | |
| F05 | `public/apple-touch-icon.png` | 180x180 | Stage 2 | Latar pejal `#0D2229` dengan mark knockout, karena iOS tidak menghormati transparansi |
| F06 | `public/icon-192.png` | 192x192 | Stage 2 | |
| F07 | `public/icon-512.png` | 512x512 | Stage 2 | |
| O01 | `public/og-jaring.png` | 1200x630 | Stage 4 | Gambar Open Graph, lihat bagian 5 |
| A01 | `public/img/avatar/sales-01.png` sampai `sales-06.png` | 128x128 | Stage 4 | Avatar 6 anggota tim sales demo, lihat bagian 6 |

Total 6 avatar, bukan lebih. Kontak dan perusahaan memakai avatar inisial yang digambar dengan CSS, bukan berkas gambar, supaya tidak ada 40 permintaan gambar di halaman daftar.

---

## 5. Gambar Open Graph (O01)

Bukan foto dan bukan mockup laptop. Isinya:

- Latar `#0D2229` penuh.
- Lockup logo varian B di kiri atas.
- Judul besar `Jaring` memakai Plus Jakarta Sans ExtraBold warna `#FFFFFF`.
- Baris bawah judul: `CRM pipeline penjualan` warna `#9FB6BE`.
- Di sisi kanan, potongan papan kanban yang disederhanakan, yaitu tiga kolom siku berlatar `#16323B` berisi kartu-kartu `#1E404B` dengan batang tepi kiri berwarna sesuai tahap. Digambar sebagai bentuk geometris, bukan tangkapan layar buram.
- Sudut kanan bawah: `Portfolio app by Himay Studio` warna `#9FB6BE`.
- Semua sudut siku. Tanpa gradien.

Kalau lebih praktis, Stage 4 boleh membuat O01 sebagai berkas gambar hasil render HTML statis, bukan hasil generate model gambar. Hasilnya lebih tajam dan teksnya pasti benar. Ini pilihan yang disarankan.

---

## 6. Avatar tim sales (A01)

Enam avatar untuk anggota tim sales demo di leaderboard dan kolom penanggung jawab.

**Arah foto:** potret setengah badan orang Indonesia dewasa usia 25 sampai 45 di lingkungan kantor yang wajar, pencahayaan jendela lembut, latar polos agak buram, ekspresi tenang dan ramah tanpa berlebihan. Pakaian kerja kasual, kemeja atau blus polos. Beragam gender dan tampilan wajah, mewakili keragaman Indonesia. Dipotong persegi, bukan lingkaran, karena avatar di aplikasi ini siku (R10).

**PHOTO DNA yang wajib ditempel ke setiap prompt** (R33): shot on 50mm prime, f/2.8, natural window light with soft directional shadows, subtle film grain, realistic skin texture with visible pores, shallow depth of field, candid neutral expression, natural color grading.

**NEGATIVE yang wajib ditempel ke setiap prompt** (R33): plastic waxy skin, over-smoothed airbrushed face, hyper saturation, symmetrical studio reflections, faux bokeh halo, extra or merged fingers, floating objects, perfect symmetry, artificial studio smear, stock photo grin, corporate handshake, whitened teeth glare, CGI render look, 3D illustration.

Sesuai R49, **tiap avatar punya blok SUBJECT sendiri**. Enam orang berbeda, jangan satu prompt dipakai enam kali dan jangan satu berkas dipasang di enam slot.

Nama demo yang dipasangkan, ditetapkan di sini supaya Stage 4 dan Stage 5 sinkron:

| Berkas | Nama | Peran |
| --- | --- | --- |
| `sales-01.png` | Dimas Prakoso | Sales Manager |
| `sales-02.png` | Rani Kusumawati | Account Executive |
| `sales-03.png` | Bagas Setiawan | Account Executive |
| `sales-04.png` | Ayu Lestari | Account Executive |
| `sales-05.png` | Hendra Wijaya | Sales Development |
| `sales-06.png` | Nadia Sihombing | Sales Development |

---

## 7. Bahasa visual di dalam aplikasi

Bagian ini untuk Webapp Architect dan Frontend Builder, supaya layar terasa satu keluarga dengan logonya.

- **Motif kisi.** Kisi dari logo boleh muncul sekali saja sebagai elemen tenang, misalnya pola garis rambut `--border` sangat tipis di area kosong halaman landing atau di panel kiri layar login. Sekali, bukan di setiap halaman, dan tidak pernah di belakang teks yang harus terbaca.
- **Batang tepi kiri.** Penanda kategori di seluruh aplikasi memakai batang tepi kiri selebar 3px, bukan lencana bulat dan bukan latar penuh. Dipakai di item sidebar aktif, kartu kanban, baris tabel terpilih, dan kartu KPI. Ini yang mengikat semuanya jadi satu sistem.
- **Kartu KPI.** Latar `--surface`, batas garis rambut, batang tepi kiri berwarna arti, label `--t-label` di atas, angka `--t-metric` tabular di bawahnya, lalu perbandingan kecil terhadap periode sebelumnya dengan panah dan teks, bukan hanya warna.
- **Keadaan kosong.** Ikon garis besar warna `--border-strong`, satu kalimat penjelas warna `--text-muted`, satu tombol aksi. Tanpa ilustrasi.
- **Layar login.** Dua kolom di desktop. Kiri berlatar `--ink` berisi logo varian B, tagline, dan motif kisi tipis. Kanan berlatar `--surface` berisi form dan kredensial demo yang ditampilkan terang terangan plus tombol masuk sekali klik. Di bawah 768px jadi satu kolom, panel gelap menyusut jadi kepala halaman. Footer login memuat tautan dofollow `Dibuat oleh Himay Studio` ke `https://himaystudio.com`.

---

## 8. Daftar periksa Stage 2

- [ ] L01 dan L02 dua varian, keduanya latar benar benar transparan, bukan putih pejal.
- [ ] Uji varian B ditempel di atas `#0D2229`. Tidak boleh ada satu pun bagian yang hilang atau terbaca sebagai kotak kosong (R43).
- [ ] Uji varian A ditempel di atas `#FFFFFF` dan `#F4F7F8`.
- [ ] Semua sudut siku, tidak ada satu pun lengkung, termasuk simpul kisi.
- [ ] Mark saja masih terbaca di 20px.
- [ ] Set favicon lengkap dari F01 sampai F07 diturunkan dari master 1024, bukan dari hasil upscale ikon kecil.
- [ ] `apple-touch-icon.png` berlatar pejal `#0D2229`, bukan transparan.
