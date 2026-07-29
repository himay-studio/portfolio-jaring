#!/usr/bin/env node
/**
 * Menyiapkan Chromium di runtime ini.
 *
 * Chromium yang sudah ter-cache TIDAK bisa langsung jalan di sini, karena ada
 * sembilan pustaka bersama yang tidak terpasang, dan tidak ada akses root untuk
 * `apt install`. Ini BUKAN alasan yang sah untuk melewati R51. Perbaikannya
 * sepenuhnya di ruang pengguna: unduh deb-nya, bongkar ke direktori cache,
 * lalu arahkan `LD_LIBRARY_PATH` ke sana.
 *
 * Skrip ini idempoten, aman dijalankan berkali kali.
 *
 * Pemakaian:  node scripts/qa-setup.mjs
 * Keluaran:   mencetak jalur biner Chromium dan LD_LIBRARY_PATH yang dipakai.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PAKET = [
  'libatk1.0-0t64',
  'libatk-bridge2.0-0t64',
  'libatspi2.0-0t64',
  'libxdamage1',
  'libxres1',
  'libasound2t64',
  'libcups2t64',
  'libavahi-common3',
  'libavahi-client3',
];

const CACHE = join(homedir(), '.cache', 'qa-libs');
const DEBS = join(CACHE, 'debs');
const ROOT = join(CACHE, 'root');
export const LIBDIR = join(ROOT, 'usr', 'lib', 'x86_64-linux-gnu');

const KANDIDAT_CHROME = [
  join(homedir(), '.cache/ms-playwright/chromium-1234/chrome-linux64/chrome'),
  join(homedir(), '.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome'),
];

export function cariChrome() {
  const ada = KANDIDAT_CHROME.find((p) => existsSync(p));
  if (!ada) throw new Error('Biner Chromium tidak ditemukan di cache mana pun.');
  return ada;
}

export function siapkanLib() {
  if (existsSync(LIBDIR) && readdirSync(LIBDIR).some((f) => f.startsWith('libatk-1.0'))) return LIBDIR;

  mkdirSync(DEBS, { recursive: true });
  mkdirSync(ROOT, { recursive: true });
  execFileSync('apt-get', ['download', ...PAKET], { cwd: DEBS, stdio: 'inherit' });
  for (const f of readdirSync(DEBS).filter((x) => x.endsWith('.deb'))) {
    execFileSync('dpkg-deb', ['-x', join(DEBS, f), ROOT], { stdio: 'inherit' });
  }
  return LIBDIR;
}

/**
 * Menyiapkan pustaka DAN memasang LD_LIBRARY_PATH ke proses ini.
 *
 * Digabung jadi satu panggilan karena memisahkannya sudah sekali membuat
 * `qa-probe.mjs` gagal start: pustakanya sudah ada, tapi lupa dipasang ke env,
 * dan galatnya persis sama dengan galat "browser tidak tersedia" yang membuat
 * orang menyerah lalu melewati R51.
 */
export function siapkanBrowser() {
  const lib = siapkanLib();
  process.env.LD_LIBRARY_PATH = process.env.LD_LIBRARY_PATH
    ? `${lib}:${process.env.LD_LIBRARY_PATH}`
    : lib;
  return { chrome: cariChrome(), lib };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const lib = siapkanLib();
  const chrome = cariChrome();
  process.stdout.write(`CHROME=${chrome}\nLD_LIBRARY_PATH=${lib}\n`);
}
