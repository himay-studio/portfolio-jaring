# Jaring

**CRM pipeline penjualan. Tidak ada prospek yang lolos.**

Demo aplikasi portfolio Himay Studio. Aplikasi CRM untuk tim sales B2B Indonesia, dipakai untuk mengelola lead, deal, aktivitas follow up, penawaran, dan laporan penjualan.

Merek ini fiktif dan dibuat sebagai contoh pekerjaan. Tidak ada backend, tidak ada autentikasi nyata, semua data adalah data demo.

---

## Status pipeline

| Stage | Pekerjaan | Status |
| --- | --- | --- |
| 1 | Brand Strategist, brand dan sistem desain | Selesai |
| 2 | Asset Forge, logo dan favicon | Selesai |
| 3 | Webapp Architect, arsitektur, scaffold, semua layar layout-first | Selesai |
| 4 | Media Producer, aset gambar | Belum |
| 5 | Frontend Builder, implementasi penuh dan data demo | Belum |
| 6 | QA Deploy Engineer | Belum |
| 7 | Project Recorder, video walkthrough | Belum |
| 8 | Review Curator | Belum |

---

## Dokumen

Baca berurutan sebelum menyentuh kode.

| Berkas | Isi |
| --- | --- |
| `BRAND.md` | Riset niche, kompetitor, posisi, nama, tagline, nada bicara, istilah UI yang dikunci, aturan data demo |
| `DESIGN.md` | Token warna lengkap dengan **angka kontras terhitung**, tipografi, skala padat data, tata letak, aturan komponen, gerak |
| `ART-DIRECTION.md` | Konsep logo, dua varian wajib, ikonografi, daftar aset, bahasa visual di dalam aplikasi |
| `LOGO.md` | Prompt logo siap tempel, instruksi favicon, tutorial Google Flow |
| `LAYOUT-ARCHITECTURE.md` | Peta rute, hierarki komponen, keputusan arsitektur beserta alasannya, batas R48, hasil pengukuran |
| `MEDIA.md` | Manifest media. Kosong dengan sengaja, aplikasi ini tidak bergantung pada gambar hasil generate |

Aturan tiga baris untuk siapa pun yang melanjutkan:

1. Jangan bikin warna baru. Semua ada di `DESIGN.md` dan kontrasnya sudah dihitung.
2. Jangan pakai istilah UI selain yang dikunci di `BRAND.md` bagian 5.
3. Sudut siku di mana pun, `border-radius: 0`.

---

## Modul aplikasi

- **Dashboard sales**: nilai pipeline, deal menang dan kalah bulan ini, target lawan realisasi, aktivitas hari ini, leaderboard sales.
- **Leads**: sumber lead, status kualifikasi, skor, penanggung jawab, konversi jadi kontak plus deal.
- **Kontak dan Perusahaan**: profil, riwayat interaksi, deal terkait, catatan. View table plus card.
- **Deals**: pipeline kanban enam tahap dengan seret dan lepas, nilai deal, probabilitas, perkiraan tanggal tutup, alasan kalah. View kanban plus table.
- **Aktivitas**: telepon, meeting, email, tugas follow up. View calendar plus list, pengingat jatuh tempo.
- **Penawaran**: baris item, subtotal, pajak, total, status kirim dan terima.
- **Laporan**: konversi per tahap, waktu rata rata per tahap, performa per sales, sumber lead terbaik.
- **Pengaturan**: tahap pipeline kustom, sumber lead, pengguna dan peran.

Tahap pipeline: Prospek, Kualifikasi, Penawaran, Negosiasi, Menang, Kalah.

---

## Menjalankan

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # rm -rf out .next lalu next build, hasilnya di out/
npm run typecheck    # tsc --noEmit
```

Pemeriksa aturan terukur, dijalankan di browser sungguhan:

```bash
npm install --no-save playwright-core
npm run build
npx serve out -l 4173 &
node scripts/qa-check.mjs http://localhost:4173
```

Skrip itu mengukur luapan mendatar di 375, 480, 768, 1025, dan 1440 dengan
panel tertutup maupun terbuka, membaca `innerText` per baris untuk teks yang
menempel, mencari em dash dan en dash pada teks ter-render, mencocokkan
`aria-expanded` dengan geometri panel yang sebenarnya, dan mengukur laci mobile
dari kotaknya. Penjelasan tiap pemeriksaan ada di kepala berkasnya.

## Teknis

- Next.js dengan `output: 'export'`, static export tanpa backend. 83 halaman.
- Data demo statis di `src/data/*.ts`, mutasi demo disimpan di `localStorage`
  sebagai lapisan timpa di atas data dasar.
- Font Plus Jakarta Sans, Inter, dan JetBrains Mono lewat `next/font`, di-host
  sendiri, tanpa permintaan ke domain pihak ketiga.
- Login demo, kredensial ditampilkan di layar, satu klik masuk.
- Deploy ke Cloudflare Pages project `himaystudio-portfolio-jaring`.
- URL publik: `https://portfolio-jaring.himaystudio.com`. URL `pages.dev` hanya cadangan internal dan tidak pernah dilaporkan sebagai URL publik.

---

Dibuat oleh [Himay Studio](https://himaystudio.com).
