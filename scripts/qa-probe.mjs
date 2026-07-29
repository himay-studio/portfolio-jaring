#!/usr/bin/env node
/**
 * Probe terarah, pelengkap `qa-check.mjs` (Jaring).
 *
 * `qa-check.mjs` melaporkan TEMUAN. Kalau dia melapor nol, ada dua kemungkinan
 * yang terbaca sama persis dari luar: benar benar bersih, atau sapuannya tidak
 * pernah menyentuh apa yang seharusnya diperiksa. Skrip ini menutup jarak itu
 * dengan MENCETAK ANGKA yang diukurnya.
 *
 * Disalin polanya dari `portfolio-lekas/scripts/qa-probe.mjs` (POS), selektor
 * dan rute diganti ke Jaring (CRM pipeline penjualan): dropdown filter
 * `.sel-trigger` di /app/deals/, laci navigasi `.hamburger`/`.navdrawer`,
 * dan papan Kanban `.kanban[data-r48]` yang wajib jadi carousel di mobile.
 *
 * Pemakaian: node scripts/qa-probe.mjs
 */

import { createServer } from 'node:http';
import { existsSync, statSync, createReadStream } from 'node:fs';
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
    await page.goto(`${url}/app/deals/`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 400));

    const bawaan = await page.evaluate(() => document.querySelectorAll('select').length);
    const pemicu = await page.$$('.sel-trigger');
    process.stdout.write(`R12  /app/deals/  select bawaan: ${bawaan} (wajib 0), pemicu dropdown custom (.sel-trigger): ${pemicu.length}\n`);

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

    /* 2. Laci navigasi mobile benar benar setinggi viewport, di-portal ke body (R53). */
    await page.setViewport({ width: 375, height: 900 });
    await page.goto(`${url}/app/deals/`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 400));
    await (await page.$('.hamburger')).click();
    await new Promise((r) => setTimeout(r, 400));
    const laci = await page.evaluate(() => {
      const p = document.querySelector('.navdrawer');
      if (!p) return null;
      const r = p.getBoundingClientRect();
      return { top: Math.round(r.top), tinggi: Math.round(r.height), induk: p.parentElement?.tagName };
    });
    process.stdout.write(`R53  laci mobile: top=${laci?.top} tinggi=${laci?.tinggi} (viewport 900) induk=${laci?.induk}\n`);
    await page.keyboard.press('Escape');

    /* 3. Kanban deals di 375px, wajib carousel horizontal, bukan tumpukan vertikal (R48). */
    await page.goto(`${url}/app/deals/`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 500));
    const kanban = await page.evaluate(() => {
      const papan = document.querySelector('.kanban[data-r48]');
      if (!papan) return null;
      const cs = getComputedStyle(papan);
      return {
        overflowX: cs.overflowX,
        scrollSnapType: cs.scrollSnapType,
        kolom: papan.querySelectorAll('.kb-col').length,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      };
    });
    process.stdout.write(`R48  Kanban /app/deals/ @375px: overflow-x=${kanban?.overflowX} scroll-snap-type=${kanban?.scrollSnapType} kolom=${kanban?.kolom} scrollWidth=${kanban?.scrollWidth} innerWidth=${kanban?.innerWidth}\n`);

    /* 4. Modal Tambah deal benar benar di-portal dan seukuran viewport (R53). */
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('Tambah deal'));
      b?.click();
    });
    await new Promise((r) => setTimeout(r, 400));
    const modal = await page.evaluate(() => {
      const o = document.querySelector('[role="dialog"]');
      if (!o) return null;
      const r = o.getBoundingClientRect();
      return {
        top: Math.round(r.top), tinggi: Math.round(r.height), lebar: Math.round(r.width),
        induk: o.parentElement?.tagName,
        scrollWidth: document.documentElement.scrollWidth,
      };
    });
    process.stdout.write(`R53  modal Tambah deal: top=${modal?.top} tinggi=${modal?.tinggi} lebar=${modal?.lebar} induk=${modal?.induk} scrollWidth=${modal?.scrollWidth}\n`);
    await page.keyboard.press('Escape');

    process.stdout.write('Semua probe selesai.\n');
  } finally {
    await browser.close();
    srv.close();
  }
}

utama();
