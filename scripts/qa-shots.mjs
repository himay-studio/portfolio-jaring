#!/usr/bin/env node
/**
 * Tangkapan layar untuk R51 (Jaring).
 *
 * Disalin polanya dari `portfolio-derap/scripts/qa-shots.mjs` (browser
 * dimulai ulang tiap breakpoint supaya renderer yang sesekali mati di
 * runtime ini tidak menggagalkan seluruh rentetan), rute dan selektor
 * disesuaikan ke Jaring (CRM pipeline penjualan): Kanban deals, laci
 * navigasi mobile `.hamburger`/`.navdrawer`, dropdown filter `.sel-trigger`,
 * dan modal "Tambah deal".
 *
 * Diambil pada keadaan TERBURUK: gulir nol, papan Kanban deals (>3 kartu
 * per kolom), laci mobile terbuka, dropdown filter terbuka, modal terbuka.
 */

import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { siapkanBrowser } from './qa-setup.mjs';

const AKAR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(AKAR, 'out');
const SHOTS = join(AKAR, 'qa-shots');
const PORT = 4321;
const LEBAR = [375, 480, 768, 1025, 1440];

const RUTE = [
  '/',
  '/login/',
  '/app/',
  '/app/leads/',
  '/app/leads/led-16/',
  '/app/deals/',
  '/app/deals/dea-12/',
  '/app/kontak/',
  '/app/kontak/kon-14/',
  '/app/perusahaan/',
  '/app/perusahaan/com-03/',
  '/app/aktivitas/',
  '/app/penawaran/',
  '/app/penawaran/pnw-01/',
  '/app/laporan/',
  '/app/pengaturan/',
];

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain' };

function server() {
  return new Promise((ok) => {
    const s = createServer((req, res) => {
      const j = decodeURIComponent(req.url.split('?')[0]);
      const f = extname(j) ? join(OUT, j) : join(OUT, j.replace(/\/$/, ''), 'index.html');
      if (!existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); res.end('404'); return; }
      res.writeHead(200, { 'content-type': MIME[extname(f)] ?? 'application/octet-stream' });
      createReadStream(f).pipe(res);
    });
    s.listen(PORT, () => ok(s));
  });
}

const nama = (j) => (j === '/' ? 'root' : j.replace(/^\/|\/$/g, '').split('/').join('_'));

async function utama() {
  const { chrome } = siapkanBrowser();
  const srv = await server();
  const url = `http://127.0.0.1:${PORT}`;

  const ARGS = ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--hide-scrollbars', '--disable-background-networking', '--disable-extensions'];

  for (const lebar of LEBAR) {
    let browser = await puppeteer.launch({ executablePath: chrome, headless: 'shell', args: ARGS });
    let page = await browser.newPage();
    await page.setViewport({ width: lebar, height: lebar <= 480 ? 812 : 900 });
    const dir = join(SHOTS, String(lebar));
    mkdirSync(dir, { recursive: true });

    const tangkap = async (jalur, berkas, siapkan) => {
      for (let percobaan = 0; percobaan < 2; percobaan += 1) {
        try {
          await page.goto(url + jalur, { waitUntil: 'networkidle0' });
          await new Promise((r) => setTimeout(r, 450));
          if (siapkan) await siapkan(page);
          await page.screenshot({ path: join(dir, berkas) });
          return;
        } catch (e) {
          process.stdout.write(`  ulang ${jalur} @${lebar}px setelah ${e.message.split('\n')[0]}\n`);
          try { await browser.close(); } catch { /* sudah mati */ }
          browser = await puppeteer.launch({ executablePath: chrome, headless: 'shell', args: ARGS });
          page = await browser.newPage();
          await page.setViewport({ width: lebar, height: lebar <= 480 ? 812 : 900 });
        }
      }
      throw new Error(`Gagal menangkap ${jalur} pada ${lebar}px setelah dua percobaan.`);
    };

    for (const jalur of RUTE) {
      await tangkap(jalur, `${nama(jalur)}.png`);
    }

    // Keadaan terburuk, bukan keadaan yang nyaman.
    await tangkap('/app/deals/', 'deals_kanban_modal-terbuka.png', async (p) => {
      await p.evaluate(() => {
        const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('Tambah deal'));
        b?.click();
      });
      await new Promise((r) => setTimeout(r, 500));
    });

    if (lebar <= 1024) {
      await tangkap('/app/', 'app_laci-terbuka.png', async (p) => {
        await p.click('.hamburger');
        await new Promise((r) => setTimeout(r, 500));
      });
    } else {
      await tangkap('/app/deals/', 'deals_dropdown-terbuka.png', async (p) => {
        const trigger = await p.$('.sel-trigger');
        if (trigger) await trigger.click();
        await p.mouse.move(2, 2);
        await new Promise((r) => setTimeout(r, 400));
      });
    }

    await browser.close();
    process.stdout.write(`${lebar}px selesai\n`);
  }

  srv.close();
  process.stdout.write(`Tangkapan layar ada di ${SHOTS}\n`);
}

utama();
