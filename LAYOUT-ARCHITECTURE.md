# LAYOUT-ARCHITECTURE.md, Jaring

Peta rute, hierarki komponen, dan keputusan arsitektur beserta alasannya.
Ditulis Stage 3 (HIM-299). Pembaca utamanya Stage 5 (Frontend Builder) dan
Stage 6 (QA Deploy).

Sumber yang mengikat dokumen ini, berurutan: `ART-DIRECTION.md` menang kalau
bentrok, lalu `DESIGN.md`, lalu `BRAND.md`.

---

## 1. Peta rute

Semua rute memakai trailing slash karena `next.config.mjs` memasang
`trailingSlash: true`. Total 83 halaman statis.

### Di luar aplikasi

| Rute | Isi |
| --- | --- |
| `/` | Landing produk ringkas. Satu layar, tiga pilar dari `BRAND.md` bagian 4, papan pipeline sebagai citra utama, tombol masuk demo, tautan balik dofollow. |
| `/login/` | Layar login demo dua kolom. Kredensial ditampilkan di layar, satu klik masuk, tanpa auth nyata. |
| `/_not-found` | 404 dengan jalan kembali ke dashboard. |

### Area aplikasi, semuanya di bawah shell `/app`

| Rute | Modul | View |
| --- | --- | --- |
| `/app/` | Dashboard sales | tunggal |
| `/app/leads/` | Leads | Table + Card |
| `/app/leads/[id]/` | Detail lead, 18 halaman | tunggal |
| `/app/deals/` | Deals | **Kanban + Table** |
| `/app/deals/[id]/` | Detail deal, 18 halaman | tunggal |
| `/app/kontak/` | Kontak | **Table + Card** |
| `/app/kontak/[id]/` | Detail kontak, 16 halaman | tunggal |
| `/app/perusahaan/` | Perusahaan | Table + Card |
| `/app/perusahaan/[id]/` | Detail perusahaan, 12 halaman | tunggal |
| `/app/aktivitas/` | Aktivitas | **Calendar + List** |
| `/app/penawaran/` | Penawaran | Table + Card |
| `/app/penawaran/[id]/` | Detail penawaran, 6 halaman | tunggal |
| `/app/laporan/` | Laporan, 4 tab | tab |
| `/app/pengaturan/` | Pengaturan, 5 tab | tab |

Yang ditebalkan adalah pasangan view yang diwajibkan HIM-283.

Tidak ada halaman yatim. Setiap rute detail dijangkau dari daftarnya, dan
setiap daftar ada di sidebar. Halaman `/` dan `/login/` saling menaut dan
dijangkau dari topbar aplikasi lewat tombol Tentang demo dan Keluar demo.

---

## 2. Hierarki komponen

```
app/layout.tsx                  font, meta, skrip pra hidrasi sidebar
├── app/page.tsx                landing "/"
├── app/login/page.tsx          login demo
└── app/app/layout.tsx
    └── components/shell/AppShell.tsx
        ├── aside.sidebar       Logo knockout, DaftarNav, KakiSidebar, tombol lipat
        ├── header.topbar       hamburger, judul halaman, tautan Tentang demo
        ├── main.page-enter     animasi perpindahan halaman, di-key pathname
        └── Drawer navdrawer    laci mobile, DI-PORTAL ke document.body
```

Komponen dasar, dibangun sekali dan dipakai semua modul:

| Berkas | Isi |
| --- | --- |
| `components/Icon.tsx` | Satu set ikon garis 1.5px, ujung dan sambungan siku |
| `components/Logo.tsx` | `Logo` lockup dan `Mark`, dua varian terang dan knockout |
| `components/ui/Select.tsx` | Dropdown kustom (R12) |
| `components/ui/DatePicker.tsx` | `DatePicker` dan `DateRangePicker` (R21) |
| `components/ui/DataTable.tsx` | Tabel generik, urut, pilih baris, aksi massal, kartu di mobile |
| `components/ui/Overlay.tsx` | `Modal`, `Drawer`, `Tooltip`, semuanya lewat portal |
| `components/ui/Basic.tsx` | `Badge`, `Avatar`, `StatCard`, `Bar`, `RelChip`, `EmptyState`, `Skeleton`, `Placeholder` |
| `components/ui/Form.tsx` | `Field`, `Input`, `Textarea`, `SearchInput`, `Checkbox`, `Toggle` |
| `components/ui/Nav.tsx` | `PageHeader`, `Toolbar`, `ViewSwitcher`, `useViewMode`, `Tabs` |
| `components/ui/Portal.tsx` | Portal ke `document.body` (R53) |
| `components/charts/Charts.tsx` | `BarChart`, `LineChart`, `HBarList`, `Funnel`, `Legend`, `ChartCard` |
| `components/kanban/KanbanBoard.tsx` | Papan pipeline plus dialog alasan kalah |

Lapisan data dan logika:

| Berkas | Isi |
| --- | --- |
| `data/types.ts` | Seluruh model data dan bentuk relasinya |
| `data/relations.ts` | Penyambung relasi, indeks, dan hitungan penawaran |
| `data/settings.ts` | Tahap, sumber lead, alasan kalah, peran, label dan warna enum |
| `data/clock.ts` | Jangkar tanggal demo |
| `lib/metrics.ts` | Turunan angka: pipeline, target, mandek, corong, leaderboard |
| `lib/format.ts` | Rupiah, persen, tanggal, inisial, warna avatar |
| `lib/kalender.ts` | Aritmetika tanggal untuk date picker dan kalender |
| `lib/hooks.ts` | `useDisclosure`, `useSimpanan`, perangkap fokus, klik di luar |
| `lib/dealStore.ts` | Lapisan timpa perubahan deal di localStorage |

---

## 3. Keputusan arsitektur

### 3.1 Relasi antar entitas ditetapkan sekarang, bukan di Stage 5

Ini permintaan eksplisit HIM-299 dan alasannya benar: kalau bentuk relasi baru
dipikirkan di Stage 5, setiap layar detail harus dibongkar ulang.

Aturan yang berlaku: **layar tidak boleh menulis sendiri
`DEALS.filter(d => d.companyId === id)`.** Semua penyambungan lewat
`data/relations.ts`. Kalau bentuk relasi berubah, yang diubah cuma satu berkas.

Konversi lead ditulis **dua arah**, dan ini yang paling penting:

```
Lead.konversi = { tanggal, contactId, companyId, dealId }   menunjuk MAJU
Contact.asalLeadId                                          menunjuk BALIK
Deal.asalLeadId                                             menunjuk BALIK
```

Kalau cuma satu arah, salah satu layar pasti jadi jalan buntu. Dengan dua arah,
halaman detail lead menunjukkan ke mana dia berubah, dan halaman detail deal
maupun kontak menunjukkan dari mana asalnya. Ketiganya sudah terpasang dan
bisa dilihat di `led-16`, `kon-14`, dan `dea-06`.

Tahap, status, dan skor adalah **atribut**, bukan entitas terpisah (semangat
R42). Deal yang menang tetap record `Deal` yang sama dengan `tahap: 'menang'`.

### 3.2 Aturan bisnis ditegakkan di lapisan data, bukan di komponen

Perpindahan deal ke tahap Kalah wajib membawa alasan. Aturan itu ada di
`lib/dealStore.ts`, bukan di `KanbanBoard.tsx`. Konsekuensinya jalur keyboard,
seret dan lepas, dan nanti aksi massal Stage 5 semuanya tunduk pada aturan yang
sama tanpa perlu ditulis tiga kali. Komponen cuma memutuskan kapan membuka
dialog; yang menolak perpindahan tanpa alasan adalah lapisan datanya.

### 3.3 Tanggal demo memakai jangkar tetap, bukan `new Date()`

`data/clock.ts` mengunci `HARI_INI = '2026-07-29'` dan semua tanggal diturunkan
darinya. Dua alasan:

1. Static export. Tanggal yang dihitung dari jam sistem membuat HTML hasil
   build dan render pertama di browser bisa berbeda hari, dan itu hydration
   mismatch yang muncul sebagai teks berkedip lalu berubah sendiri.
2. Reproducible. Screenshot QA minggu depan sama persis dengan hari ini.

Konsekuensinya jujur: "jatuh tempo hari ini" berarti jatuh tempo pada tanggal
jangkar. Stage 5 bisa menggeser seluruh dataset dengan mengubah satu konstanta.

### 3.4 Mutasi demo memakai lapisan timpa, bukan menulis ulang data dasar

`lib/dealStore.ts` menyimpan perubahan sebagai peta timpa di localStorage di
atas `data/deals.ts`. Data dasar tetap satu sumber kebenaran, Stage 5 bisa
menggemukkannya tanpa bentrok dengan apa pun yang tersimpan di browser
pengunjung, dan tombol Kembalikan data demo cukup menghapus satu kunci.

Render pertama SELALU memakai data dasar, timpaan dipasang setelah mount, jadi
tidak ada hydration mismatch.

### 3.5 Status lipat sidebar dibaca sebelum hidrasi

Sidebar 248px yang menyusut jadi 64px satu frame setelah halaman muncul membuat
seluruh isi halaman melompat. Karena itu statusnya dibaca skrip pendek di
`<head>` dan dipasang sebagai `data-sidebar` di `<html>`, dan CSS-nya menempel
ke `html[data-sidebar='rail']`, bukan ke state React.

Pilihan lain yang tidak menggeser tata letak (mode view per halaman) tetap
memakai `useSimpanan` biasa: render pertama pakai bawaan, nilai tersimpan
dipasang setelah mount. Menukar satu frame kedip dengan nol hydration mismatch.

### 3.6 Berpindah view tidak pernah mereset filter

State filter tinggal di komponen halaman, di **atas** pemindah view. Pemindah
view cuma memilih cara menggambar hasil penyaringan yang sama. Ini bukan detail
implementasi, ini kontrak: jangan pernah memindahkan state filter ke dalam
komponen view.

### 3.7 Overlay selalu di-portal, dan itu bukan soal kerapian

`Portal.tsx` dipakai `Modal`, `Drawer`, dan `Tooltip`. Elemen yang memasang
`backdrop-filter`, `filter`, `transform`, `perspective`, `contain: paint`, atau
`will-change` pada properti itu menjadi containing block untuk setiap keturunan
`position: fixed`, dan laci yang seharusnya setinggi layar kolaps jadi setinggi
header (R53). CSS-nya terbaca benar di kedua kasus, jadi membaca stylesheet
tidak akan pernah bisa membedakan. Yang membedakan cuma di mana elemen
dirender.

Topbar aplikasi memakai latar solid dan sengaja TIDAK memakai `backdrop-filter`,
supaya jebakan itu memang tidak pernah lahir di build ini.

Terkait itu, `.page-enter` sengaja TANPA `animation-fill-mode`. Kalau memakai
`both`, nilai `transform` dari keyframe terakhir tetap menempel setelah animasi
selesai, dan pembungkus halaman jadi containing block untuk keturunan `fixed`.

### 3.8 Panel tertutup dilepas dari DOM, bukan sekadar `opacity: 0`

`useDisclosure` di `lib/hooks.ts` punya empat fase: `closed`, `opening`, `open`,
`closing`. Panel dirender selama fase bukan `closed`, jadi animasi buka DAN
tutup tetap jalan, tapi saat benar benar tertutup panelnya tidak ada di DOM sama
sekali dan tidak mungkin menyumbang lebar layout (R57).

`isOpen` adalah satu satunya sumber kebenaran untuk `aria-expanded` DAN untuk
keputusan merender panel, jadi mustahil panel terlihat terbuka sementara aria
bilang tertutup (R60). Tidak ada pembuka `onFocus` yang dipasang bareng toggler
`onClick` di elemen yang sama, dan tidak ada CSS `:hover` atau `:focus-within`
yang membuka panel di luar state.

### 3.9 Aset visual tanpa satu pun gambar hasil generate

Lihat `MEDIA.md`. Ringkasnya: avatar memakai inisial di atas blok warna, empty
state memakai bentuk geometris SVG yang ditulis sendiri, grafik dirender dari
data sebagai SVG, dan logo memakai berkas Stage 2 yang sudah ada.

Satu catatan soal logo. `components/Logo.tsx` meng-inline geometri kisi dari
berkas Stage 2 (koordinat, warna, dan tebal garisnya sama persis) alih alih
memakai `<img src="/logo-jaring.svg">`. Alasannya teknis: berkas Stage 2 menulis
wordmark sebagai `<text>` dengan `font-family: Plus Jakarta Sans`, dan SVG yang
dimuat lewat `<img>` terisolasi sehingga tidak bisa mengambil webfont dari
halaman. Wordmark-nya akan jatuh ke sans bawaan sistem dan terlihat beda dari
tipografi aplikasi. Dengan di-inline, mark tetap vektor Stage 2 apa adanya dan
wordmark memakai font yang sudah dimuat halaman. Berkas PNG dan SVG Stage 2
tetap dipakai untuk favicon, apple touch icon, dan ikon PWA.

---

## 4. Batas R48, dan kenapa dibedakan

R48 mewajibkan section berisi lebih dari 3 item peer jadi snap carousel di
mobile. Yang perlu dibedakan adalah section KARTU dekoratif melawan KOLEKSI
DATA, karena aplikasi bisnis isinya memang koleksi data.

**Jadi carousel** (baris KPI di dashboard dan semua halaman detail, empat kartu
peer): kelas `snap-row`.

**Sengaja tetap tumpukan vertikal**, ditandai `data-r48` di markup supaya sweep
QA bisa membedakannya secara programatik, bukan dengan tebakan:

| Penanda | Apa | Kenapa |
| --- | --- | --- |
| `data-r48="koleksi-data"` | Daftar kartu pengganti tabel di mobile, `cardgrid` view Card, `timeline`, `settings-list`, agenda kalender | HIM-283 menyatakan eksplisit "tabel boleh jadi list kartu di mobile". Koleksi 16 kontak yang dijadikan carousel mendatar justru tidak bisa dipindai. |
| `data-r48="grafik"` | Corong konversi dan daftar batang mendatar | Satu grafik utuh. Memecahnya jadi carousel merusak perbandingan antar batang, yang justru inti grafiknya. |
| `data-r48="carousel-mobile"` | Papan kanban | Sudah carousel mendatar per tahap, 85vw per kolom, sesuai `DESIGN.md` 5.4. |

Tabel dokumen penawaran tetap tabel di semua lebar, karena cuma empat kolom dan
lebarnya persen sehingga tidak pernah meluap.

---

## 5. Hasil pengukuran, bukan pembacaan CSS

Dijalankan lewat `scripts/qa-check.mjs` di Chromium sungguhan, 16 rute kali 5
titik henti (375, 480, 768, 1025, 1440), ditambah keadaan panel terbuka dan
laci mobile terbuka. Hasil akhir: **semua pemeriksaan terukur lolos**.

Tiga hal ditemukan lewat pengukuran dan tidak akan pernah terlihat dari membaca
kode. Ketiganya sudah diperbaiki, dan dicatat di sini supaya Stage 5 tidak
membatalkannya tanpa sadar:

1. **Wadah gulir mendatar tetap menyumbang luapan dokumen.** Papan kanban
   melapor `document.documentElement.scrollWidth` 1943 lawan `innerWidth` 375,
   padahal `.kanban` sendiri sudah menggulir dengan benar (`clientWidth` 375,
   `scrollWidth` 2005) dan `body.scrollWidth` tetap 375. `overflow-x: auto`
   saja tidak cukup; yang menutup jalurnya adalah `contain: paint`, terukur
   turun ke 375. Dipasang juga di `.snap-row` dan `.tabs`.
   Aman terhadap R53 karena tidak ada keturunan `position: fixed` di dalam
   ketiganya, semua overlay di-portal ke `document.body`.

2. **Titik paling sempit bukan mobile, tapi 1025px.** Di situ sidebar 248px
   sudah muncul sementara kanvasnya belum tumbuh, jadi ruang isi cuma sekitar
   729px. `/app/kontak/` melapor `scrollWidth` 1065 lawan 1025 karena tabel
   memakai `table-layout: auto` dan kolomnya melebar mengikuti isi terpanjang.
   Diperbaiki dengan `table-layout: fixed` plus dua kolom per tabel ditandai
   `opsional` dan disembunyikan di bawah 1280px.

3. **Email panjang mendorong grid melebar.** `/app/kontak/kon-14/` melapor 1034
   lawan 1025 karena `dl.dl` memberi 140px ke kolom label sehingga nilainya
   cuma dapat 48px, dan email tanpa titik putus alami meluap. Diperbaiki dengan
   label 116px plus `overflow-wrap: anywhere` pada `dd`.

Cara menjalankan ulang ada di kepala `scripts/qa-check.mjs`. Kalau Chromium
menolak jalan karena pustaka bersama hilang, itu bisa diperbaiki tanpa root
dan BUKAN alasan untuk menurunkan QA jadi `curl` plus cek HTTP 200, karena
halaman kosong pun mengembalikan 200.

---

## 6. Yang sengaja ditunda ke Stage 5

Semuanya sudah ditandai di layar masing masing lewat komponen `Placeholder`,
yang dirender dengan garis putus putus dan label Stage 5 supaya tidak mungkin
lolos ke deploy tanpa disadari.

| Layar | Yang ditunda |
| --- | --- |
| Dashboard | Grafik tren pipeline delapan minggu, dan penyambungan dashboard ke `useDealStore` supaya perubahan tahap di papan ikut mengubah angkanya. Di Stage 3 dashboard membaca data dasar saja. |
| Deals | Modal formulir tambah dan ubah deal, plus aksi massal. Papan kanban, dialog alasan kalah, seret dan lepas, jalur keyboard, dan penyimpanan ke localStorage SUDAH berfungsi penuh. |
| Leads | Alur konversi lead jadi Kontak, Perusahaan, dan Deal sekaligus. Bentuk datanya sudah lengkap, tinggal formulir dan penulisannya. |
| Aktivitas | Formulir catat aktivitas, kotak centang selesai langsung dari daftar, pengingat jatuh tempo. |
| Penawaran | Editor baris item dengan stepper qty dan harga, aksi kirim, terima, dan tolak, serta jalur unduh PDF. |
| Laporan | Menyambungkan `DateRangePicker` dan pilihan pembanding ke fungsi di `lib/metrics.ts`. Fungsinya sudah menerima parameter bulan, tinggal meneruskan rentangnya. |
| Pengaturan | Menyimpan pilihan ke localStorage dengan pola yang sama dengan `useDealStore`. Kontrolnya sudah hidup, perubahannya belum bertahan setelah muat ulang. |
| Detail deal | Catatan kolaboratif dan lampiran. |

Volume data demo juga naik di Stage 5, mengikuti `BRAND.md` bagian 8: 60 lead,
45 deal, 40 kontak, 25 perusahaan, 120 aktivitas lintas 8 minggu, 15 penawaran.
Stage 3 memakai 18 lead, 18 deal, 16 kontak, 12 perusahaan, 34 aktivitas, dan 6
penawaran, secukupnya supaya tata letaknya terlihat jujur. Rute detail dibuat
dari `generateStaticParams`, jadi jumlah halaman ikut tumbuh sendiri tanpa
mengubah apa pun.
