#!/usr/bin/env node
/**
 * Membuat `public/og-jaring.png`, 1200x630, sesuai spesifikasi geometri
 * ART-DIRECTION.md bagian 5 (O01).
 *
 * Bukan aset yang perlu di-generate model gambar. Isinya cuma bidang datar,
 * lockup knockout Stage 2 apa adanya, dan tiga baris teks yang sudah dikunci,
 * jadi menulisnya sebagai SVG lalu merendernya lewat Chromium menghasilkan
 * tepi lebih tajam, berkas lebih kecil, dan ejaan yang dijamin benar karena
 * teksnya teks asli, bukan tebakan model gambar. ART-DIRECTION.md bagian 5
 * sendiri menyarankan jalur ini.
 *
 * Pemakaian: node scripts/gen-og.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const AKAR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const KELUARAN = join(AKAR, 'public', 'og-jaring.png');
const CHROME_PATH =
  process.env.CHROME_PATH ??
  `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`;

// Lockup knockout dipakai apa adanya dari aset Stage 2 (mark plus wordmark
// "Jaring" sudah jadi satu berkas), jadi banner ini tidak bisa menyimpang
// dari logo yang sudah dikunci.
const lockupSvg = readFileSync(join(AKAR, 'public', 'logo-jaring-knockout.svg'), 'utf8');
const lockupInline = `data:image/svg+xml;base64,${Buffer.from(lockupSvg).toString('base64')}`;

// Tiga kolom kanban, batang tepi kiri berwarna sesuai tahap (DESIGN.md 2):
// info untuk Prospek, brand untuk Kualifikasi, success untuk Menang.
const KOLOM = [
  { warna: '#2456C9', kartu: 3 },
  { warna: '#0C6B7A', kartu: 2 },
  { warna: '#0D7038', kartu: 3 },
];

const halaman = `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Inter:wght@400;500&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; border-radius:0; }
  body { width:1200px; height:630px; background:#0D2229; position:relative;
         font-family:'Inter',system-ui,sans-serif; overflow:hidden; }
  .lockup { position:absolute; top:56px; left:64px; width:220px; height:auto; }
  .judul { position:absolute; top:220px; left:64px; width:520px;
           font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:88px;
           letter-spacing:-0.02em; color:#FFFFFF; line-height:1; }
  .tagline { position:absolute; top:340px; left:64px; width:480px;
             font-size:26px; line-height:36px; color:#9FB6BE; }
  .kanan { position:absolute; top:96px; right:64px; width:500px; height:438px;
           display:flex; gap:16px; }
  .kolom { flex:1; background:#16323B; padding:14px; display:flex;
           flex-direction:column; gap:12px; }
  .kartu { background:#1E404B; height:64px; border-left:4px solid var(--tepi); }
  .footer { position:absolute; bottom:40px; right:64px; font-size:20px; color:#9FB6BE; }
</style></head>
<body>
  <img class="lockup" src="${lockupInline}" alt="">
  <div class="judul">Jaring</div>
  <div class="tagline">CRM pipeline penjualan</div>
  <div class="kanan">
    ${KOLOM.map(
      (k) => `<div class="kolom">${Array.from({ length: k.kartu })
        .map(() => `<div class="kartu" style="--tepi:${k.warna}"></div>`)
        .join('')}</div>`,
    ).join('')}
  </div>
  <div class="footer">Portfolio app by Himay Studio</div>
</body></html>`;

async function utama() {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    await page.setContent(halaman, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const buf = await page.screenshot({ type: 'png' });
    writeFileSync(KELUARAN, buf);
    process.stdout.write(`Tersimpan ${KELUARAN}\n`);
  } finally {
    await browser.close();
  }
}

utama();
