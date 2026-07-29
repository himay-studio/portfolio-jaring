# LOGO.md, Jaring

Lembar prompt siap tempel untuk logo dan favicon Jaring. Dipakai oleh **Asset Forge (Stage 2)**.

Alasan di balik bentuknya ada di `ART-DIRECTION.md` bagian 2. Berkas ini isinya teks yang ditempel dan langkah teknis, bukan penjelasan.

Dua jalur produksi didukung, yaitu MCP `gemini-image` di dalam pipeline (sesuai R39, tidak ada gerbang manusia di sub-issue), atau manusia lewat Google Flow. Prompt di bawah bekerja untuk keduanya.

---

## 1. Prompt varian A, primary, untuk latar terang

Tempel apa adanya.

```
Flat vector logo for an Indonesian B2B software product named "Jaring", a sales pipeline CRM. The word jaring means net or mesh in Indonesian.

MARK: a square emblem built from a thin straight-line lattice, 4 columns by 4 rows, drawn like a taut fishing net rendered as an engineering grid. Line weight is uniform and thin. At five of the lattice intersections the nodes are filled as small solid SQUARES, and the sequence of filled nodes traces the path of a capital letter J: down the right-hand column, then hooking left along the bottom row. The final node at the tip of the J hook is filled in a different accent color, representing one prospect caught in the net. From a distance the emblem reads as a bold letter J; up close it reads as a net with one lit node. Both readings must be true.

COLORS: lattice lines #084B57, filled J nodes #0C6B7A, the single highlight node at the hook tip #5B3FBF.

WORDMARK: the word "Jaring" set to the right of the mark in a bold geometric sans serif, capital J and lowercase a-r-i-n-g, tight letter spacing, color #0E1F24. Wordmark cap height about 62 percent of the mark height. Gap between mark and wordmark equal to half the mark height.

TECHNICAL: transparent background, PNG with alpha, 1:1 square canvas, clean flat vector style, crisp hard edges, perfectly straight lines, high resolution 1024x1024.

HARD CONSTRAINTS: every corner is a right angle, zero rounded corners anywhere including the lattice nodes. No gradients, no mesh gradient, no drop shadow, no glow, no bevel, no 3D, no texture, no outline stroke around the whole logo. The logo must NOT sit inside a filled colored block or badge, the background is fully transparent.

NEGATIVE: no sales funnel icon, no upward arrow, no bar chart, no handshake, no shield, no globe, no speech bubble, no generic startup swoosh, no fish, no boat, no fishing rod, no rope texture, no knotted cord, no curved lines, no rounded corners, no gradient, no photo, no mockup, no drop shadow, no stock icon look, no lens flare, no watermark, no extra text beyond the word Jaring.
```

---

## 2. Prompt varian B, knockout, untuk latar gelap

**Wajib, bukan opsional.** Sidebar aplikasi berlatar `#0D2229`, jadi varian ini benar benar dipakai di layar yang sama dengan varian A (R43).

```
Same logo as before for the Indonesian sales CRM product "Jaring": a square emblem built from a thin straight-line lattice 4 columns by 4 rows, with five intersections filled as small solid SQUARES tracing the path of a capital letter J, down the right column then hooking left along the bottom row, plus the word "Jaring" set to the right in a bold geometric sans serif.

This is the KNOCKOUT variant, made to sit on a very dark background.

COLORS: lattice lines #9FB6BE, filled J nodes #E8F0F2, the single highlight node at the hook tip #35B3C4, wordmark #FFFFFF. The lattice is deliberately dimmer than the filled nodes so the letter J reads first.

TECHNICAL: transparent background, PNG with alpha, 1:1 square canvas, clean flat vector style, crisp hard edges, high resolution 1024x1024. Designed to be legible on a dark background of #0D2229.

HARD CONSTRAINTS: every corner is a right angle, zero rounded corners anywhere. No gradients, no drop shadow, no glow, no 3D, no texture. The logo must NOT sit inside a filled colored block, the background is fully transparent, so nothing but the marks themselves is visible.

NEGATIVE: no sales funnel icon, no upward arrow, no bar chart, no handshake, no shield, no fish, no boat, no rope texture, no curved lines, no rounded corners, no gradient, no photo, no drop shadow, no dark box behind the logo, no extra text beyond the word Jaring.
```

---

## 3. Prompt varian monokrom, untuk favicon

```
Same "Jaring" square emblem only, without the wordmark: a thin straight-line lattice 4 columns by 4 rows with five intersections filled as small solid squares tracing a capital letter J, down the right column then hooking left along the bottom.

Single flat color #084B57 for every part, including the lattice, all filled nodes, and the highlight node. No second color.

Simplified for small sizes: slightly thicker lattice lines and slightly larger filled nodes so the letter J still reads clearly at 16 pixels.

TECHNICAL: transparent background, PNG with alpha, 1:1 square canvas, flat vector, crisp hard edges, 1024x1024.

HARD CONSTRAINTS: right angles only, zero rounded corners, no gradient, no shadow, no colored background block.

NEGATIVE: no wordmark, no text, no funnel, no arrow, no fish, no rope, no curves, no rounded corners, no gradient, no shadow.
```

---

## 4. Verifikasi sebelum lanjut

Jangan lanjut ke favicon sebelum ketiganya lulus. Ini yang paling sering lolos begitu saja.

1. Tempel varian A di atas kotak `#FFFFFF` dan `#F4F7F8`. Semua bagian harus terlihat.
2. Tempel varian B di atas kotak `#0D2229`. **Tidak boleh ada satu pun bagian yang hilang atau muncul sebagai persegi kosong.** Kalau hasil generate ternyata punya latar pejal, buang dan generate ulang, jangan diakali dengan `mix-blend-mode`. Ini kegagalan R43 yang terjadi di Legatara.
3. Perkecil mark ke 20px dan lihat apakah huruf J masih terbaca. Kalau tidak, pakai versi monokrom yang lebih tebal.
4. Periksa tidak ada satu pun sudut membulat (R10).
5. Periksa latar benar benar transparan, bukan putih pejal yang kebetulan cocok di halaman putih.

Kalau model gambar terus gagal menghasilkan kisi yang lurus dan siku, **buat SVG-nya dengan tangan**. Bentuk ini geometris murni, yaitu beberapa garis lurus dan beberapa persegi, jadi menulis SVG langsung sering lebih cepat dan hasilnya pasti presisi. Itu pilihan yang sah dan bahkan disarankan untuk `logo-jaring.svg`, `logo-jaring-knockout.svg`, dan `mark-jaring.svg`.

---

## 5. Favicon dan ikon aplikasi

Semua diturunkan dari master monokrom 1024x1024, jangan dari hasil pembesaran ikon kecil.

| Berkas | Ukuran | Catatan |
| --- | --- | --- |
| `public/favicon.ico` | multi 16, 32, 48 | Dari monokrom `#084B57`, latar transparan |
| `public/favicon-16.png` | 16x16 | |
| `public/favicon-32.png` | 32x32 | |
| `public/favicon-48.png` | 48x48 | |
| `public/apple-touch-icon.png` | 180x180 | **Latar pejal `#0D2229`** dengan mark knockout putih, karena iOS tidak menghormati transparansi dan akan memberi latar hitam sendiri |
| `public/icon-192.png` | 192x192 | Transparan, mark monokrom |
| `public/icon-512.png` | 512x512 | Transparan, mark monokrom |

Cara paling sederhana, dengan `sharp` yang gratis dan lokal (R55 melarang memanggil layanan gambar berbayar untuk pekerjaan yang bisa dilakukan lokal):

```bash
npx sharp-cli -i public/mark-jaring-mono.png -o public/favicon-16.png resize 16 16
npx sharp-cli -i public/mark-jaring-mono.png -o public/favicon-32.png resize 32 32
npx sharp-cli -i public/mark-jaring-mono.png -o public/favicon-48.png resize 48 48
npx sharp-cli -i public/mark-jaring-mono.png -o public/icon-192.png  resize 192 192
npx sharp-cli -i public/mark-jaring-mono.png -o public/icon-512.png  resize 512 512
# favicon.ico multi ukuran
npx png-to-ico public/favicon-16.png public/favicon-32.png public/favicon-48.png > public/favicon.ico
```

`apple-touch-icon.png` dibuat terpisah, yaitu mark knockout 180x180 dikomposit di atas kanvas pejal `#0D2229`.

Metadata Next.js yang dituju:

```ts
icons: {
  icon: [
    { url: '/favicon.ico' },
    { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
  ],
  apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
}
```

---

## 6. Tempat menaruh berkas jadi

Semua berkas final masuk ke `public/` di repo `himay-studio/portfolio-jaring`, dengan nama persis seperti tabel di `ART-DIRECTION.md` bagian 4. Salah nama berarti gambar rusak saat build, dan pada static export kesalahan itu baru terlihat setelah deploy.

---

## 7. Cara generate lewat Google Flow, kalau dikerjakan manusia

Jalur ini disediakan sebagai cadangan. Sesuai R39 jalur utamanya adalah MCP `gemini-image` langsung di dalam pipeline, tanpa menunggu manusia.

1. **Tempel prompt yang sudah dirangkai** dari bagian 1, 2, dan 3 di atas ke kotak chat Google Flow, `https://labs.google/fx/id/tools/flow/project/1e873728-41ff-4e87-ab36-3de32f6ad416`, di collection bernama `jaring`. Tempel prompt utuh, jangan cuma kalimat MARK-nya.
2. **Atur config**: rasio **1:1** untuk logo dan favicon, resolusi **1K**, model **Nano Banana** untuk gambar.
3. **Generate**, maksimum **4 media sekaligus**, jangan lebih dari 4 berbarengan.
4. **Lanjut ke prompt berikutnya tanpa download dulu.**
5. **Kalau sudah**, select hasil generate, download, lalu taruh di `public/` repo `portfolio-jaring` dengan nama berkas **persis** seperti tabel di `ART-DIRECTION.md` bagian 4. Salah nama berarti logo rusak di build.
