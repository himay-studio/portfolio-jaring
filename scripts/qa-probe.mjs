#!/usr/bin/env node
/**
 * Probe terarah, pelengkap `qa-check.mjs`.
 *
 * `qa-check.mjs` melaporkan TEMUAN. Kalau dia melapor nol, ada dua kemungkinan
 * yang terbaca sama persis dari luar: benar benar bersih, atau sapuannya tidak
 * pernah menyentuh apa yang seharusnya diperiksa. Skrip ini menutup jarak itu
 * dengan MENCETAK ANGKA yang diukurnya, jadi kalau jumlah pemicu dropdown yang
 * ditemukan ternyata nol, itu langsung kelihatan alih alih lolos diam diam.
 *
 * Pemakaian: node scripts/qa-probe.mjs
 */

import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { siapkanBrowser } from './qa-setup.mjs';

const AKAR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(AKAR, 'out');
const PORT = 4319;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8',
};

function server() {
  return new Promise((ok) => {
    const s = createServer((req, res) => {
      const jalur = decodeURIComponent(req.url.split('?')[0]);
      const kandidat = extname(jalur) ? join(OUT, jalur) : join(OUT, jalur.replace(/\/$/, ''), 'index.html');
      if (!existsSync(kandidat) || statSync(kandidat).isDirectory()) {
        res.writeHead(404, { 'content-type': 'text/plain' });
        res.end('404');
        return;
      }
      res.writeHead(200, { 'content-type': MIME[extname(kandidat)] ?? 'application/octet-stream' });
      createReadStream(kandidat).pipe(res);
    });
    s.listen(PORT, () => ok(s));
  });
}

const SHOT = join(AKAR, 'qa-shots');

async function utama() {
  const { chrome } = siapkanBrowser();
  const srv = await server();
  const url = `http://127.0.0.1:${PORT}`;
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'shell',
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--hide-scrollbars'],
  });
  const page = await browser.newPage();

  try {
    /* 1. Dropdown custom BENAR BENAR ada dan keadaannya sinkron (R12, R60). */
    await page.setViewport({ width: 1025, height: 900 });
    await page.goto(`${url}/app/produk/`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 400));

    const bawaan = await page.evaluate(() => document.querySelectorAll('select').length);
    const pemicu = await page.$$('[aria-haspopup]');
    process.stdout.write(`R12  /app/produk/  select bawaan: ${bawaan} (wajib 0), pemicu dropdown custom: ${pemicu.length}\n`);

    await pemicu[0].click();
    await page.mouse.move(2, 2);
    await new Promise((r) => setTimeout(r, 300));
    const keadaan = await pemicu[0].evaluate((n) => {
      const p = document.getElementById(n.getAttribute('aria-controls'));
      const cs = p ? getComputedStyle(p) : null;
      const r = p ? p.getBoundingClientRect() : null;
      return {
        expanded: n.getAttribute('aria-expanded'),
        panel: Boolean(p),
        display: cs?.display, opacity: cs?.opacity,
        kiri: r ? Math.round(r.left) : null, kanan: r ? Math.round(r.right) : null,
        tinggi: r ? Math.round(r.height) : null,
        opsi: p ? p.querySelectorAll('[role="option"]').length : 0,
      };
    });
    const lebarBuka = await page.evaluate(() => document.documentElement.scrollWidth);
    process.stdout.write(`R60  panel terbuka: aria-expanded=${keadaan.expanded} display=${keadaan.display} tinggi=${keadaan.tinggi} opsi=${keadaan.opsi} kiri=${keadaan.kiri} kanan=${keadaan.kanan} scrollWidth=${lebarBuka}\n`);

    await page.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 260));
    const setelah = await pemicu[0].evaluate((n) => ({
      expanded: n.getAttribute('aria-expanded'),
      adaPanel: Boolean(document.getElementById(n.getAttribute('aria-controls'))),
    }));
    process.stdout.write(`R57  setelah Escape: aria-expanded=${setelah.expanded} panel masih di DOM=${setelah.adaPanel} (wajib false)\n`);

    /* 2. Laci navigasi mobile benar benar setinggi viewport (R53). */
    await page.setViewport({ width: 375, height: 900 });
    await page.goto(`${url}/app/transaksi/`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 400));
    await (await page.$('.tb-hamburger')).click();
    await new Promise((r) => setTimeout(r, 400));
    const laci = await page.evaluate(() => {
      const p = document.querySelector('.mn-panel');
      if (!p) return null;
      const r = p.getBoundingClientRect();
      return { top: Math.round(r.top), tinggi: Math.round(r.height), kakek: p.parentElement?.parentElement?.tagName };
    });
    process.stdout.write(`R53  laci mobile: top=${laci?.top} tinggi=${laci?.tinggi} (viewport 900) kakek=${laci?.kakek}\n`);
    await page.keyboard.press('Escape');

    /* 3. Layar Kasir di 375px, wilayah gulir terpisah dan tanpa luapan halaman. */
    await page.goto(`${url}/app/kasir/`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 500));
    const kasir = await page.evaluate(() => {
      const grid = document.querySelector('.kasir-grid-bungkus');
      const bar = document.querySelector('.krj-bar');
      return {
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        gridGulirSendiri: grid ? getComputedStyle(grid).overflowY : null,
        barTerlihat: bar ? getComputedStyle(bar).display : null,
        ubin: document.querySelectorAll('.ubin').length,
      };
    });
    process.stdout.write(`Kasir 375px: scrollWidth=${kasir.scrollWidth} innerWidth=${kasir.innerWidth} grid overflow-y=${kasir.gridGulirSendiri} bar keranjang=${kasir.barTerlihat} ubin=${kasir.ubin}\n`);

    /* 4. Overlay pembayaran benar benar seukuran viewport dan di-portal. */
    const tombolBayar = await page.$$('.krj-bar .btn-bayar');
    if (tombolBayar[0]) {
      await page.evaluate(() => {
        const b = document.querySelector('.ubin');
        if (b) b.click();
      });
      await new Promise((r) => setTimeout(r, 300));
      await page.evaluate(() => {
        const b = document.querySelector('.krj-bar .btn-bayar');
        if (b) b.click();
      });
      await new Promise((r) => setTimeout(r, 400));
      const ov = await page.evaluate(() => {
        const o = document.querySelector('.ov');
        if (!o) return null;
        const r = o.getBoundingClientRect();
        return {
          top: Math.round(r.top), tinggi: Math.round(r.height), lebar: Math.round(r.width),
          induk: o.parentElement?.tagName,
          scrollWidth: document.documentElement.scrollWidth,
        };
      });
      process.stdout.write(`R53  overlay bayar: top=${ov?.top} tinggi=${ov?.tinggi} lebar=${ov?.lebar} induk=${ov?.induk} scrollWidth=${ov?.scrollWidth}\n`);
      await page.keyboard.press('Escape');
    }

    /* 5. Tangkapan layar wajib R51, disimpan ke qa-shots/. */
    const daftar = [
      ['/', 'landing'], ['/login/', 'login'], ['/app/', 'beranda'], ['/app/kasir/', 'kasir'],
      ['/app/produk/', 'produk'], ['/app/transaksi/', 'transaksi'], ['/app/laporan/', 'laporan'],
      ['/app/shift/', 'shift'], ['/app/pengaturan/pajak/', 'pengaturan-pajak'],
    ];
    for (const lebar of [375, 768, 1025, 1440]) {
      const dir = join(SHOT, String(lebar));
      mkdirSync(dir, { recursive: true });
      await page.setViewport({ width: lebar, height: 900 });
      for (const [jalur, nama] of daftar) {
        await page.goto(url + jalur, { waitUntil: 'networkidle0' });
        await new Promise((r) => setTimeout(r, 420));
        await page.screenshot({ path: join(dir, `${nama}.png`) });
      }
    }
    process.stdout.write(`Tangkapan layar tersimpan di qa-shots/ untuk 375, 768, 1025, dan 1440.\n`);
  } finally {
    await browser.close();
    srv.close();
  }
}

utama();
