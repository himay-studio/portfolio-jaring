# DESIGN.md, Sistem Desain Jaring

Sistem desain untuk aplikasi CRM Jaring. Ditulis Stage 1 (HIM-287). Wajib dipakai apa adanya oleh Webapp Architect (Stage 3) dan Frontend Builder (Stage 5).

**Aturan pertama: jangan bikin warna baru.** Kalau butuh warna yang belum ada di sini, itu tanda komponennya yang salah, bukan paletnya yang kurang. Semua angka kontras di dokumen ini **sudah dihitung**, bukan diperkirakan, memakai rumus WCAG 2.1 relative luminance. Stage 3 dan Stage 5 tidak perlu menebak (R20).

---

## 1. Prinsip

1. **Data yang bicara, bukan dekorasi.** Kanvas tenang, garis rambut tipis, tanpa bayangan pada kartu. Warna kuat hanya dipakai untuk arti, bukan untuk hiasan.
2. **Sudut siku total.** `border-radius: 0` di seluruh aplikasi tanpa pengecualian (R10). Aplikasi ini tidak punya tombol WhatsApp floating, jadi tidak ada satu pun bentuk bulat.
3. **Satu warna merek, enam warna arti.** Teal adalah merek dan navigasi. Hijau, merah, kuning, biru, violet punya arti tetap dan tidak boleh dipakai untuk selera.
4. **Permukaan berjenjang, bukan bayangan berjenjang.** Kedalaman dibentuk dari empat tingkat permukaan dan garis rambut. Bayangan hanya untuk lapisan yang benar-benar mengambang (popover, modal).
5. **Angka selalu tabular.** Semua kolom angka memakai angka tabular dan rata kanan supaya digit sejajar antar baris.

---

## 2. Token warna lengkap

Salin blok ini apa adanya ke `src/app/globals.css`.

```css
:root {
  /* Permukaan, terang */
  --bg:              #F4F7F8;  /* kanvas aplikasi */
  --surface:         #FFFFFF;  /* kartu, tabel, panel */
  --surface-2:       #EDF2F4;  /* header tabel, hover baris, isian halus */
  --surface-3:       #E3EAED;  /* baris bergaris, track progress, kolom kanban */

  /* Garis */
  --border:          #D2DCE0;  /* garis rambut dekoratif, pemisah tabel */
  --border-strong:   #A6B7BE;  /* pemisah tegas antar wilayah */
  --control-border:  #74868E;  /* WAJIB untuk batas kontrol: input, checkbox, toggle, stepper */

  /* Teks di permukaan terang */
  --text:            #0E1F24;  /* teks utama, judul, nilai tabel */
  --text-muted:      #47606A;  /* teks sekunder, label kolom, keterangan */
  --text-subtle:     #546A74;  /* teks paling redup yang masih boleh, placeholder */

  /* Merek, teal laut dalam */
  --brand:           #0C6B7A;  /* isian tombol utama, tautan, cincin fokus */
  --brand-deep:      #084B57;  /* hover tombol utama, teks merek di atas soft */
  --brand-soft:      #DDEEF1;  /* latar badge merek, baris terpilih */
  --brand-ink:       #06414B;  /* teks di atas brand-soft */
  --brand-bright:    #35B3C4;  /* HANYA cincin fokus di atas latar gelap, DILARANG jadi teks di latar terang */

  /* Ink, wilayah gelap (sidebar) */
  --ink:             #0D2229;  /* latar sidebar */
  --ink-2:           #16323B;  /* hover item sidebar, header sidebar */
  --ink-3:           #1E404B;  /* item sidebar aktif */
  --ink-border:      #2C4A54;  /* pemisah dekoratif di dalam sidebar */
  --ink-control-border: #587E8C; /* batas kontrol di dalam sidebar */
  --ink-text:        #E8F0F2;  /* teks sidebar */
  --ink-text-muted:  #9FB6BE;  /* label grup sidebar, teks redup di sidebar */

  /* Aksen, violet. Dipakai untuk skor lead dan seri grafik kedua */
  --accent:          #5B3FBF;
  --accent-soft:     #E8E2FA;
  --accent-ink:      #432C93;

  /* Semantik */
  --success:         #0D7038;  /* deal menang, target tercapai, status aktif */
  --success-soft:    #DDF2E4;
  --success-ink:     #0A5A2C;

  --warning:         #8A5A00;  /* deal mandek, jatuh tempo dekat */
  --warning-soft:    #FAEFD2;
  --warning-ink:     #6B4600;

  --danger:          #B3261E;  /* deal kalah, terlambat, aksi merusak */
  --danger-soft:     #FADEDB;
  --danger-ink:      #8C1D18;

  --info:            #2456C9;  /* netral informatif, tahap awal pipeline */
  --info-soft:       #DFE8FB;
  --info-ink:        #1B429B;

  /* Seri grafik, urut. Aman untuk defisiensi warna karena beda terang jelas */
  --chart-1:         #0C6B7A;
  --chart-2:         #5B3FBF;
  --chart-3:         #B8790B;
  --chart-4:         #0D7038;
  --chart-5:         #B3261E;
  --chart-6:         #2456C9;
  --chart-grid:      #E3EAED;
  --chart-axis:      #546A74;

  /* Bayangan, HANYA untuk lapisan mengambang yang di-portal ke body (R53) */
  --shadow-pop:      0 8px 24px rgba(14, 31, 36, 0.16);
  --shadow-modal:    0 16px 48px rgba(14, 31, 36, 0.24);

  /* Bentuk. R10, tanpa pengecualian */
  --radius:          0;
}
```

**Tidak ada tema gelap** di lingkup build ini. Sidebar memang gelap secara desain, tapi kanvas selalu terang. Jangan menambah `prefers-color-scheme: dark` yang belum diuji, itu menciptakan kombinasi warna yang tidak pernah dihitung kontrasnya.

### Peta arti warna, terkunci

| Konsep di CRM | Token |
| --- | --- |
| Tahap Prospek | `--info-soft` + `--info-ink` |
| Tahap Kualifikasi | `--brand-soft` + `--brand-ink` |
| Tahap Penawaran | `--accent-soft` + `--accent-ink` |
| Tahap Negosiasi | `--warning-soft` + `--warning-ink` |
| Tahap Menang | `--success-soft` + `--success-ink` |
| Tahap Kalah | `--danger-soft` + `--danger-ink` |
| Deal mandek lebih dari 14 hari | `--warning` |
| Aktivitas terlambat | `--danger` |
| Aktivitas jatuh tempo hari ini | `--brand` |
| Skor lead tinggi | `--accent` |
| Target tercapai | `--success` |

---

## 3. Angka kontras terhitung

Dihitung dengan rumus WCAG 2.1. Ambang: **4.5:1** untuk teks normal, **3:1** untuk teks besar (18.66px tebal atau 24px) dan untuk komponen non-teks seperti batas kontrol, ikon, dan seri grafik. Semua pasangan di bawah **lulus**, tidak ada satu pun yang gagal.

### 3.1 Teks di atas permukaan terang

| Teks | Permukaan | Rasio | Ambang |
| --- | --- | --- | --- |
| `--text` `#0E1F24` | `--surface` `#FFFFFF` | **16.93:1** | 4.5 |
| `--text-muted` `#47606A` | `--surface` | **6.67:1** | 4.5 |
| `--text-subtle` `#546A74` | `--surface` | **5.69:1** | 4.5 |
| `--brand` `#0C6B7A` | `--surface` | **6.18:1** | 4.5 |
| `--brand-deep` `#084B57` | `--surface` | **9.75:1** | 4.5 |
| `--accent` `#5B3FBF` | `--surface` | **7.22:1** | 4.5 |
| `--success` `#0D7038` | `--surface` | **6.19:1** | 4.5 |
| `--warning` `#8A5A00` | `--surface` | **5.93:1** | 4.5 |
| `--danger` `#B3261E` | `--surface` | **6.54:1** | 4.5 |
| `--info` `#2456C9` | `--surface` | **6.46:1** | 4.5 |
| `--text` | `--bg` `#F4F7F8` | **15.73:1** | 4.5 |
| `--text-muted` | `--bg` | **6.19:1** | 4.5 |
| `--text-subtle` | `--bg` | **5.29:1** | 4.5 |
| `--brand` | `--bg` | **5.74:1** | 4.5 |
| `--brand-deep` | `--bg` | **9.05:1** | 4.5 |
| `--accent` | `--bg` | **6.71:1** | 4.5 |
| `--success` | `--bg` | **5.75:1** | 4.5 |
| `--warning` | `--bg` | **5.51:1** | 4.5 |
| `--danger` | `--bg` | **6.07:1** | 4.5 |
| `--info` | `--bg` | **6.00:1** | 4.5 |
| `--text` | `--surface-2` `#EDF2F4` | **15.00:1** | 4.5 |
| `--text-muted` | `--surface-2` | **5.91:1** | 4.5 |
| `--text-subtle` | `--surface-2` | **5.04:1** | 4.5 |
| `--brand` | `--surface-2` | **5.47:1** | 4.5 |
| `--brand-deep` | `--surface-2` | **8.64:1** | 4.5 |
| `--accent` | `--surface-2` | **6.40:1** | 4.5 |
| `--success` | `--surface-2` | **5.49:1** | 4.5 |
| `--warning` | `--surface-2` | **5.25:1** | 4.5 |
| `--danger` | `--surface-2` | **5.79:1** | 4.5 |
| `--info` | `--surface-2` | **5.73:1** | 4.5 |
| `--text` | `--surface-3` `#E3EAED` | **13.92:1** | 4.5 |
| `--text-muted` | `--surface-3` | **5.48:1** | 4.5 |
| `--text-subtle` | `--surface-3` | **4.68:1** | 4.5 |
| `--brand` | `--surface-3` | **5.08:1** | 4.5 |
| `--brand-deep` | `--surface-3` | **8.01:1** | 4.5 |
| `--accent` | `--surface-3` | **5.93:1** | 4.5 |
| `--success` | `--surface-3` | **5.09:1** | 4.5 |
| `--warning` | `--surface-3` | **4.87:1** | 4.5 |
| `--danger` | `--surface-3` | **5.37:1** | 4.5 |
| `--info` | `--surface-3` | **5.31:1** | 4.5 |

`--surface-3` adalah permukaan paling gelap yang boleh menampung teks. Jangan menumpuk isian di atas isian lagi.

### 3.2 Teks putih di atas isian pekat (tombol solid, badge solid)

| Teks | Isian | Rasio | Ambang |
| --- | --- | --- | --- |
| `#FFFFFF` | `--brand` `#0C6B7A` | **6.18:1** | 4.5 |
| `#FFFFFF` | `--brand-deep` `#084B57` | **9.75:1** | 4.5 |
| `#FFFFFF` | `--accent` `#5B3FBF` | **7.22:1** | 4.5 |
| `#FFFFFF` | `--success` `#0D7038` | **6.19:1** | 4.5 |
| `#FFFFFF` | `--warning` `#8A5A00` | **5.93:1** | 4.5 |
| `#FFFFFF` | `--danger` `#B3261E` | **6.54:1** | 4.5 |
| `#FFFFFF` | `--info` `#2456C9` | **6.46:1** | 4.5 |
| `#FFFFFF` | `--ink` `#0D2229` | **16.43:1** | 4.5 |
| `#FFFFFF` | `--ink-2` `#16323B` | **13.52:1** | 4.5 |
| `#FFFFFF` | `--ink-3` `#1E404B` | **11.11:1** | 4.5 |

### 3.3 Badge lembut (isian soft dengan teks ink)

| Teks | Isian | Rasio | Ambang |
| --- | --- | --- | --- |
| `--brand-ink` `#06414B` | `--brand-soft` `#DDEEF1` | **9.42:1** | 4.5 |
| `--accent-ink` `#432C93` | `--accent-soft` `#E8E2FA` | **8.26:1** | 4.5 |
| `--success-ink` `#0A5A2C` | `--success-soft` `#DDF2E4` | **7.12:1** | 4.5 |
| `--warning-ink` `#6B4600` | `--warning-soft` `#FAEFD2` | **7.33:1** | 4.5 |
| `--danger-ink` `#8C1D18` | `--danger-soft` `#FADEDB` | **7.18:1** | 4.5 |
| `--info-ink` `#1B429B` | `--info-soft` `#DFE8FB` | **7.43:1** | 4.5 |

Badge memakai ukuran 11px, jadi ambangnya tetap 4.5:1 dan bukan 3:1. Semua lulus dengan margin besar.

### 3.4 Sidebar gelap

| Teks | Latar | Rasio | Ambang |
| --- | --- | --- | --- |
| `--ink-text` `#E8F0F2` | `--ink` `#0D2229` | **14.22:1** | 4.5 |
| `--ink-text` | `--ink-2` `#16323B` | **11.70:1** | 4.5 |
| `--ink-text` | `--ink-3` `#1E404B` | **9.62:1** | 4.5 |
| `--ink-text-muted` `#9FB6BE` | `--ink` | **7.75:1** | 4.5 |
| `--ink-text-muted` | `--ink-2` | **6.38:1** | 4.5 |
| `--ink-text-muted` | `--ink-3` | **5.24:1** | 4.5 |

Item sidebar aktif memakai latar `--ink-3` dengan teks `--ink-text` (9.62:1) plus penanda batang teal `--brand-bright` selebar 3px di tepi kiri. Penanda aktif tidak boleh hanya mengandalkan warna, batang tepi itu wajib.

### 3.5 Komponen non-teks, ambang 3:1

| Elemen | Latar | Rasio | Ambang |
| --- | --- | --- | --- |
| `--control-border` `#74868E` | `--surface` | **3.79:1** | 3.0 |
| `--control-border` | `--bg` | **3.52:1** | 3.0 |
| `--control-border` | `--surface-2` | **3.36:1** | 3.0 |
| `--ink-control-border` `#587E8C` | `--ink` | **3.74:1** | 3.0 |
| `--ink-control-border` | `--ink-2` | **3.08:1** | 3.0 |
| Cincin fokus `--brand` | `--surface` | **6.18:1** | 3.0 |
| Cincin fokus `--brand-bright` | `--ink` | **6.57:1** | 3.0 |
| Cincin fokus `--brand-bright` | `--ink-3` | **4.44:1** | 3.0 |
| `--chart-1` `#0C6B7A` | `--surface` | **6.18:1** | 3.0 |
| `--chart-2` `#5B3FBF` | `--surface` | **7.22:1** | 3.0 |
| `--chart-3` `#B8790B` | `--surface` | **3.63:1** | 3.0 |
| `--chart-4` `#0D7038` | `--surface` | **6.19:1** | 3.0 |
| `--chart-5` `#B3261E` | `--surface` | **6.54:1** | 3.0 |
| `--chart-6` `#2456C9` | `--surface` | **6.46:1** | 3.0 |
| `--chart-3` | `--bg` | **3.38:1** | 3.0 |

**Peringatan penting untuk Stage 5.** `--border` `#D2DCE0` hanya **1.39:1** terhadap putih. Itu **sah** untuk garis rambut dekoratif seperti pemisah baris tabel, tapi **dilarang keras** dipakai sebagai batas kontrol. Setiap input, checkbox, toggle, stepper, dan combobox wajib memakai `--control-border` `#74868E`. Ini persis kelas kegagalan R20 yang pernah terjadi di Komodrift, yaitu kontrol yang menyatu dengan latarnya.

`--brand-bright` `#35B3C4` hanya **2.50:1** terhadap putih. Dilarang jadi teks atau ikon di latar terang. Fungsinya hanya cincin fokus dan penanda aktif di sidebar gelap.

### 3.6 Warna keadaan baris

| Keadaan | Latar | Teks | Rasio |
| --- | --- | --- | --- |
| Normal | `--surface` | `--text` | **16.93:1** |
| Hover | `--surface-2` | `--text` | **15.00:1** |
| Terpilih | `--brand-soft` | `--text` | **14.17:1** |
| Terpilih, teks sekunder | `--brand-soft` | `--text-muted` | **5.58:1** |
| Bergaris genap | `--surface-3` | `--text` | **13.92:1** |

Baris terpilih tidak boleh hanya ditandai warna. Wajib ada checkbox tercentang atau batang kiri `--brand` selebar 3px.

---

## 4. Tipografi

Dua keluarga dari Google Fonts, plus satu mono opsional untuk kode dan nomor dokumen.

| Peran | Font | Bobot yang dimuat |
| --- | --- | --- |
| Judul, angka KPI, nama merek | **Plus Jakarta Sans** | 600, 700, 800 |
| Isi, antarmuka, tabel, label, badge | **Inter** | 400, 500, 600 |
| Nomor dokumen dan kode (opsional) | **JetBrains Mono** | 400, 500 |

Plus Jakarta Sans dibuat oleh Tokotype dari Jakarta, jadi ada alasan lokal yang jujur di balik pilihannya, bukan sekadar tren. Bentuk hurufnya tegas dan geometris, cocok untuk judul dan angka besar. Inter dipilih untuk isi karena paling terbaca di ukuran 13px sampai 14px dan punya angka tabular bawaan, yang wajib untuk tabel dan nilai Rupiah.

```css
/* next/font, dimuat di layout root */
--font-display: 'Plus Jakarta Sans', system-ui, sans-serif;
--font-ui:      'Inter', system-ui, sans-serif;
--font-mono:    'JetBrains Mono', ui-monospace, monospace;

/* WAJIB pada setiap sel angka, nilai KPI, dan sumbu grafik */
.num { font-variant-numeric: tabular-nums; font-feature-settings: 'tnum' 1; text-align: right; }
```

### 4.1 Skala umum

| Token | Ukuran / tinggi baris | Bobot | Font | Dipakai untuk |
| --- | --- | --- | --- | --- |
| `--t-display` | 32px / 40px | 800 | display | Judul hero landing |
| `--t-h1` | 24px / 32px | 700 | display | Judul halaman |
| `--t-h2` | 20px / 28px | 700 | display | Judul bagian, judul modal |
| `--t-h3` | 16px / 24px | 600 | ui | Judul kartu, judul kolom kanban |
| `--t-body` | 14px / 22px | 400 | ui | Teks isi bawaan aplikasi |
| `--t-body-strong` | 14px / 22px | 600 | ui | Nilai penting sebaris |
| `--t-sm` | 13px / 20px | 400 | ui | Teks pendukung, keterangan |
| `--t-xs` | 12px / 18px | 400 | ui | Metadata, cap waktu |

Ukuran teks isi bawaan adalah **14px**, bukan 16px, karena ini aplikasi padat data. Yang dikorbankan untuk itu dibayar dengan kontras yang tinggi, dan tidak ada teks di bawah 11px di mana pun.

### 4.2 Skala padat data

Skala khusus untuk tabel, kanban, badge, dan grafik. Ini yang paling sering dipakai di aplikasi, jadi angkanya dikunci.

| Token | Ukuran / tinggi baris | Bobot | Ciri | Dipakai untuk |
| --- | --- | --- | --- | --- |
| `--t-table` | 13px / 20px | 400 | tnum untuk angka | Sel tabel |
| `--t-table-key` | 13px / 20px | 600 | | Kolom pertama tabel, nama deal, nama kontak |
| `--t-table-head` | 11px / 16px | 600 | huruf besar, jarak huruf 0.06em | Header kolom tabel |
| `--t-label` | 11px / 16px | 600 | huruf besar, jarak huruf 0.06em | Label field, judul grup sidebar |
| `--t-badge` | 11px / 16px | 600 | | Badge tahap, badge status, skor |
| `--t-metric` | 28px / 34px | 700 display | tnum | Angka besar KPI di dashboard |
| `--t-metric-sm` | 20px / 26px | 700 display | tnum | Angka total di kepala kolom kanban |
| `--t-chart` | 11px / 16px | 500 | tnum | Label sumbu dan legenda grafik |

Aturan yang menempel pada R50: judul dan label sekunder di kartu, baris tabel, atau item dropdown **wajib elemen blok terpisah** dengan `gap`, bukan dua `<span>` sebaris. Verifikasi dengan membaca `innerText` per baris, bukan `textContent`.

---

## 5. Bentuk, jarak, dan tata letak

### 5.1 Bentuk

`border-radius: 0` di mana pun. Tombol, input, kartu, badge, avatar, modal, tooltip, semuanya siku (R10). Avatar berbentuk **persegi**, bukan lingkaran. Ini yang paling sering lolos di build sebelumnya, jadi ditulis eksplisit.

### 5.2 Skala jarak, kelipatan 4

`4, 8, 12, 16, 20, 24, 32, 40, 48, 64`

Padding bawaan kartu 16px, padding sel tabel 12px mendatar dan 10px menurun, jarak antar bagian 24px.

### 5.3 Ukuran tata letak

| Elemen | Ukuran |
| --- | --- |
| Sidebar terbuka | 248px |
| Sidebar tertutup | 64px, hanya ikon, dengan tooltip |
| Topbar | 56px |
| Lebar isi maksimum | 1440px, gutter 24px di desktop dan 16px di bawah 768px |
| Tinggi baris tabel | 44px, header 40px |
| Mode tabel rapat | 36px, opsional lewat pengalih rapat |
| Lebar kolom kanban | 288px, jarak antar kolom 12px |
| Kartu deal di kanban | padding 12px, tinggi minimum 88px |
| Panel samping detail | 480px di desktop, layar penuh di bawah 768px |

### 5.4 Titik henti responsif

`375, 480, 768, 1025, 1440`. Sama persis dengan yang diuji QA (R19, R57).

- Di bawah 1025px sidebar jadi laci geser yang **di-portal ke `document.body`**, bukan bersarang di dalam `<header>` (R53). Header aplikasi memakai latar solid, tanpa `backdrop-filter`, supaya jebakan containing block tidak pernah muncul.
- Di bawah 768px tabel berubah jadi daftar kartu, satu kartu per baris data. Bukan tabel yang digulir mendatar, karena itu memicu overflow.
- Papan kanban di mobile jadi carousel snap mendatar per tahap, satu kolom selebar 85vw (R48).
- Tidak boleh ada overflow mendatar di titik henti mana pun, dengan semua panel tertutup maupun terbuka. Setiap panel mengambang wajib `max-width: calc(100vw - 2rem)` dan `display: none` saat tertutup, bukan sekadar `opacity: 0`, supaya tidak menyumbang lebar layout (R57).

### 5.5 Elevasi

Kartu, tabel, dan panel **tidak berbayang**. Batasnya garis rambut `--border` di atas `--surface`. Bayangan hanya dipakai oleh dua hal, yaitu popover atau dropdown memakai `--shadow-pop`, dan modal memakai `--shadow-modal` dengan scrim `rgba(14, 31, 36, 0.5)`. Keduanya di-portal ke `document.body`.

Semua overlay dekoratif wajib `pointer-events: none`, dan yang tertutup wajib benar-benar dilepas dari DOM atau `display: none`.

---

## 6. Aturan komponen

### 6.1 Tombol

Tinggi 40px, padding mendatar 16px, `--t-body-strong`, siku.

| Varian | Diam | Hover | Fokus |
| --- | --- | --- | --- |
| Utama | isian `--brand`, teks putih (6.18:1) | isian `--brand-deep` (9.75:1) | outline 2px `--brand`, offset 2px |
| Kedua | isian `--surface`, batas 1px `--control-border`, teks `--text` | isian `--surface-2` | sama |
| Halus | tanpa isian, teks `--brand` (6.18:1) | isian `--brand-soft` | sama |
| Merusak | isian `--danger`, teks putih (6.54:1) | gelapkan 8 persen | outline `--danger` |

**Penempatan.** Tombol aksi utama tiap halaman ada di **kiri**, sejajar judul halaman, konsisten di semua layar. Bukan di pojok kanan atas. Ini instruksi arsitektur dari HIM-283 dan berlaku tanpa kecuali.

Tap target minimum 44x44px di mobile.

### 6.2 Dropdown dan combobox (R12)

Dilarang keras memakai `<select>` bawaan browser. Setiap dropdown adalah komponen kustom dengan:

- Transisi buka dan tutup, misalnya `grid-template-rows: 0fr` ke `1fr`, ditambah chevron yang berputar 180 derajat.
- `role="listbox"` pada panel, `role="option"` pada item, plus input tersembunyi untuk nilai form.
- Keyboard penuh: ArrowUp, ArrowDown, Home, End, Enter, Escape, dan ketik untuk mencari.
- `aria-expanded` pada pemicu **wajib sinkron** dengan panel yang benar-benar terbuka (R60). Jangan pernah memasang pembuka `onFocus` bersama toggler `onClick` di elemen yang sama, karena klik nyata akan membuka lalu langsung menutup.
- Panel `position: absolute` dengan `max-width: calc(100vw - 2rem)`. Pemicu paling kiri menjangkarkan `left: 0`, pemicu paling kanan menjangkarkan `right: 0` (R16.1). Saat tertutup, panel `display: none`.

### 6.3 Date picker (R21)

Dilarang input teks tanggal bebas. Wajib kalender kustom dengan grid `role="grid"`, navigasi ArrowLeft, ArrowRight, ArrowUp, ArrowDown, PageUp, PageDown, Enter, Escape, penanda hari ini, penanda tanggal terpilih dengan kontras cukup, dan pilihan rentang untuk filter laporan. Format tampilan `12 Agustus 2026`, format nilai ISO.

Panel kalender mengikuti aturan geometri yang sama seperti dropdown, termasuk `display: none` saat tertutup, karena inilah penyebab overflow tersembunyi di Mabrur (R57).

### 6.4 Kontrol form

Input tinggi 40px, batas 1px `--control-border` (3.79:1), latar `--surface`, teks `--text`, placeholder `--text-subtle` (5.69:1). Saat fokus, batas jadi `--brand` ditambah outline 2px `--brand` dengan offset 2px. Saat salah, batas `--danger` dan pesan galat teks `--danger` di bawahnya, tidak hanya warna batas.

Checkbox dan radio 18x18px dengan area sentuh 44x44px, batas `--control-border`, saat tercentang isian `--brand` dengan tanda centang putih (6.18:1). Toggle memakai track `--control-border` saat mati dan `--brand` saat hidup, dengan label teks di sampingnya, bukan hanya warna.

### 6.5 Badge

Tinggi 20px, padding mendatar 8px, `--t-badge`, siku. Selalu pasangan soft dan ink dari tabel 3.3. Badge tahap pipeline memakai peta arti di bagian 2. Badge tidak pernah hanya bulatan warna tanpa teks.

### 6.6 Tabel

Header `--surface-2` dengan teks `--t-table-head` warna `--text-muted` (5.91:1), lengket di bagian atas saat digulir. Baris tinggi 44px, pemisah garis rambut `--border`. Kolom angka rata kanan dan tabular. Kolom pertama `--t-table-key`.

Urutan kolom ditandai ikon panah plus `aria-sort`. Baris yang bisa diklik punya `cursor: pointer`, keadaan hover `--surface-2`, dan bisa diaktifkan dengan Enter.

### 6.7 Kanban

Kolom berlatar `--surface-3` dengan header berisi nama tahap, jumlah deal, dan total nilai memakai `--t-metric-sm`. Kartu deal berlatar `--surface` dengan batas `--border` dan batang kiri 3px berwarna sesuai tahap.

Seret dan lepas wajib punya jalur keyboard: fokus ke kartu, tekan Space untuk mengangkat, panah untuk memindah antar tahap, Space untuk menjatuhkan, Escape untuk membatalkan, dengan pengumuman langsung lewat `aria-live`.

### 6.8 Grafik

Enam warna seri dari bagian 2, dipakai berurutan. Garis kisi `--chart-grid`, label sumbu `--chart-axis` ukuran `--t-chart`. Setiap seri wajib punya legenda berlabel teks, jangan mengandalkan warna saja. Tooltip di-portal ke body dan memakai `--shadow-pop`.

---

## 7. Gerak

Semua durasi ada di jendela 150ms sampai 300ms sesuai R46.

| Interaksi | Durasi | Easing |
| --- | --- | --- |
| Perpindahan halaman | 200ms, redup masuk plus geser 4px ke atas | `cubic-bezier(.2, 0, 0, 1)` |
| Buka dan tutup dropdown | 160ms | `cubic-bezier(.2, 0, 0, 1)` |
| Pengalih view (table ke kanban ke calendar ke card) | 200ms silang redup | sama |
| Sidebar buka dan tutup | 200ms lebar | sama |
| Laci mobile | 240ms geser | sama |
| Modal | 200ms, scrim redup plus konten naik 8px | sama |
| Hover baris dan tombol | 120ms warna saja | `ease-out` |
| Kartu kanban diangkat | 120ms | `ease-out` |

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Gerak tidak pernah menunda first contentful paint dan tidak pernah memblokir interaksi.

---

## 8. Aksesibilitas, yang wajib diperiksa

1. Setiap kontrol lulus ambang di bagian 3. Ukur dengan alat, jangan dikira-kira.
2. `--border` dilarang jadi batas kontrol. Pakai `--control-border`.
3. Cincin fokus terlihat di setiap elemen yang bisa difokus, termasuk di dalam sidebar gelap memakai `--brand-bright`.
4. Warna tidak pernah jadi satu-satunya penanda. Tahap punya teks, baris terpilih punya checkbox, seri grafik punya legenda, status punya label.
5. `aria-expanded` sinkron dengan keadaan panel yang sebenarnya (R60).
6. Overlay full viewport di-portal ke `document.body` (R53).
7. Judul dan label sekunder adalah elemen blok terpisah (R50).
8. Tidak ada em dash dan en dash, termasuk bentuk entity HTML (R11, R58).
9. Tap target minimum 44x44px di mobile.
10. Tidak ada overflow mendatar di 375, 480, 768, 1025, dan 1440, dalam keadaan panel tertutup maupun terbuka (R19, R57).

---

## 9. Cara memverifikasi ulang angka kontras

Angka di bagian 3 dihitung dengan skrip pendek berikut. Kalau ada yang menambah atau mengubah warna, jalankan lagi dan perbarui tabelnya. Jangan pernah mengubah warna tanpa menghitung ulang.

```python
def srgb(c):
    c = c / 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def lum(h):
    h = h.lstrip('#')
    r, g, b = [int(h[i:i+2], 16) for i in (0, 2, 4)]
    return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b)

def contrast(a, b):
    l1, l2 = lum(a), lum(b)
    if l1 < l2:
        l1, l2 = l2, l1
    return (l1 + 0.05) / (l2 + 0.05)

print(round(contrast('#0C6B7A', '#FFFFFF'), 2))  # 6.18
```
