#!/usr/bin/env node
/* ==========================================================================
   Pemeriksa aturan terukur, dijalankan di browser sungguhan.

   Ditulis di Stage 3 dan sengaja ditinggalkan di repo supaya Stage 5 dan
   Stage 6 tidak perlu menulis ulang. Yang diperiksa cuma aturan yang memang
   BISA diukur, dan setiap pemeriksaan membaca artefak yang benar. Ini
   penting, karena kelas kegagalan yang paling sering lolos bukan "lupa
   memeriksa", tapi "memeriksa artefak yang salah":

   - R19 dan R57 overflow mendatar. Diukur `document.documentElement.scrollWidth`
     lawan `window.innerWidth`, di setiap titik henti, dengan panel TERTUTUP
     dan lagi dengan panel TERBUKA. Panel yang tertutup tapi cuma `opacity: 0`
     tetap memakan layout, dan itu tidak terlihat di screenshot mana pun.
   - R50 teks yang menempel. Dibaca `innerText` PER BARIS, bukan `textContent`.
     `textContent` menyambung node blok yang sebenarnya sudah terpisah secara
     visual, jadi dia melaporkan salah pada markup yang justru sudah benar.
   - R11 dan R58 em dash dan en dash. Dibaca teks TER-RENDER, bukan grep
     source, karena `&#8212;` di JSX merender tanda yang sama tapi tidak
     pernah tertangkap grep karakter.
   - R60 aria-expanded. Dibaca DUA duanya, atribut aria DAN geometri panel
     yang sebenarnya, setelah pointer dijauhkan supaya `:hover` tidak menutupi
     keadaan yang salah. Membaca salah satu saja lolos di build yang benar
     maupun yang rusak.
   - R53 overlay yang kolaps. Diukur `getBoundingClientRect()` laci, bukan
     dibaca CSS-nya, karena CSS-nya tertulis `position: fixed; top: 0` di
     kasus yang benar MAUPUN yang rusak.
   - R10 sudut siku. Diukur `border-radius` terkomputasi.
   - R20 kontras. Latar diambil dari rantai leluhur, bukan dari elemen itu
     sendiri, karena kasus yang gagal hampir selalu komponen yang latarnya
     sendiri transparan dan duduk di atas seksi gelap.

   Cara pakai:
     npm install --no-save playwright-core
     npx serve out -l 4173 &
     node scripts/qa-check.mjs http://localhost:4173

   Kalau Chromium menolak jalan karena pustaka bersama hilang, itu bisa
   diperbaiki tanpa root: `apt-get download` pustaka yang kurang, `dpkg-deb -x`
   ke direktori cache, lalu arahkan `LD_LIBRARY_PATH` ke sana. Menurunkan QA
   jadi `curl` plus cek HTTP 200 BUKAN pengganti, karena halaman kosong pun
   mengembalikan 200.
   ========================================================================== */

import { chromium } from 'playwright-core';

const DASAR = process.argv[2] ?? 'http://localhost:4173';
const EXE =
  process.env.CHROME_PATH ??
  `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`;

const TITIK_HENTI = [375, 480, 768, 1025, 1440];

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

const temuan = [];
const catat = (aturan, rute, pesan) => temuan.push({ aturan, rute, pesan });

/* Nama merek yang memang punya huruf besar di tengah, jangan dianggap
   teks menempel (R50). */
const HURUF_BESAR_SAH = /WhatsApp|YouTube|iPhone|JavaScript|TypeScript|PageUp|PageDown|ArrowUp|ArrowDown|ArrowLeft|ArrowRight/;

async function periksaHalaman(page, rute, lebar) {
  const url = `${DASAR}${rute}`;
  await page.setViewportSize({ width: lebar, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(350);

  /* ---- R19 dan R57, semua panel TERTUTUP ---- */
  const gulir = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    pelanggar: [...document.querySelectorAll('*')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.right > window.innerWidth + 1;
      })
      .slice(0, 5)
      .map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`),
  }));
  if (gulir.scrollWidth > gulir.innerWidth) {
    catat(
      'R19/R57',
      `${rute} @${lebar}`,
      `overflow mendatar, scrollWidth ${gulir.scrollWidth} lawan innerWidth ${gulir.innerWidth}, tersangka ${gulir.pelanggar.join(' | ') || 'tidak teridentifikasi'}`,
    );
  }

  /* ---- R11 dan R58, dibaca dari teks TER-RENDER ---- */
  const dash = await page.evaluate(() => {
    const teks = document.body.innerText;
    const cocok = teks.match(/[–—]/g);
    if (!cocok) return null;
    const baris = teks.split('\n').filter((b) => /[–—]/.test(b));
    return baris.slice(0, 3);
  });
  if (dash) catat('R11/R58', `${rute} @${lebar}`, `em atau en dash ter-render: ${dash.join(' // ')}`);

  /* ---- R50, innerText PER BARIS, bukan textContent ---- */
  const glued = await page.evaluate((polaSah) => {
    const re = new RegExp(polaSah);
    const hasil = [];
    /* CODE, KBD, SAMP, dan PRE memang berisi pengenal seperti `useDealStore`
       dan `LineChart`. Huruf besar di tengah kata di situ adalah nama yang
       benar, bukan label yang menempel. Dibungkus sebagai kode supaya
       regexnya boleh tetap ketat di semua tempat lain. */
    const LEWATI = new Set([
      'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'TITLE', 'HEAD',
      'CODE', 'KBD', 'SAMP', 'PRE',
    ]);
    for (const el of document.querySelectorAll('*')) {
      /* <script> dan kawan kawan bukan teks ter-render. Kalau ikut dibaca,
         sweep ini tenggelam dalam ratusan lapor palsu dari bundel JS dan
         temuan yang asli jadi tidak kelihatan. */
      if (LEWATI.has(el.tagName)) continue;
      if (el.children.length > 3) continue;
      /* Harus benar benar TERGAMBAR. Sidebar desktop masih ada di DOM dengan
         display none di mobile, dan innerText pada subtree tersembunyi jatuh
         ke perilaku textContent, yang menyambung semua teks jadi satu baris
         dan melapor "menempel" pada markup yang sebenarnya benar. */
      if (el.getClientRects().length === 0) continue;
      /* Hanya elemen yang SEMUA anaknya inline. Wadah dengan anak blok akan
         mengembalikan innerText seluruh subtree-nya, jadi memeriksanya sama
         saja memeriksa halaman utuh dan pasti melapor palsu. Bentuk yang
         memang dicari R50 adalah dua span sebaris tanpa pemisah. */
      const adaAnakBlok = [...el.children].some((c) => {
        const d = getComputedStyle(c).display;
        return !(d.startsWith('inline') || d === 'contents' || d === 'none');
      });
      if (adaAnakBlok) continue;
      if (el.querySelector('code, kbd, samp, pre')) continue;
      const t = el.innerText;
      if (!t) continue;
      for (const baris of t.split('\n')) {
        if (/[a-z][A-Z]/.test(baris) && !re.test(baris)) {
          hasil.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')}: ${baris.slice(0, 70)}`);
          break;
        }
      }
      if (hasil.length >= 5) break;
    }
    return hasil;
  }, HURUF_BESAR_SAH.source);
  for (const g of glued) catat('R50', `${rute} @${lebar}`, `teks menempel dalam satu baris, ${g}`);

  /* ---- R10, sudut siku ---- */
  const bulat = await page.evaluate(() =>
    [...document.querySelectorAll('*')]
      .filter((el) => {
        const r = getComputedStyle(el).borderRadius;
        return r && r !== '0px' && !r.startsWith('0px 0px 0px 0px');
      })
      .slice(0, 5)
      .map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')} = ${getComputedStyle(el).borderRadius}`),
  );
  for (const b of bulat) catat('R10', `${rute} @${lebar}`, `sudut membulat, ${b}`);

  /* ---- R20, kontras dengan latar EFEKTIF dari rantai leluhur ---- */
  const kontras = await page.evaluate(() => {
    const srgb = (c) => {
      c /= 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    const lum = ([r, g, b]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
    const urai = (s) => {
      const m = s.match(/[\d.]+/g);
      return m ? m.slice(0, 4).map(Number) : null;
    };
    const gabung = (atas, bawah) => {
      const a = atas[3] ?? 1;
      return [0, 1, 2].map((i) => atas[i] * a + bawah[i] * (1 - a));
    };
    /* Latar EFEKTIF: telusuri leluhur, komposit setiap backgroundColor yang
       tidak transparan sampai ke halaman. Membaca background elemen itu
       sendiri melaporkan transparan dan diam diam lolos. */
    const latarEfektif = (el) => {
      let hasil = [255, 255, 255];
      const rantai = [];
      for (let n = el; n && n !== document.documentElement; n = n.parentElement) rantai.push(n);
      rantai.push(document.documentElement);
      for (const n of rantai.reverse()) {
        const bg = urai(getComputedStyle(n).backgroundColor);
        if (bg && (bg[3] ?? 1) > 0) hasil = gabung(bg, hasil);
      }
      return hasil;
    };
    const rasio = (a, b) => {
      const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
      return (x + 0.05) / (y + 0.05);
    };

    const gagal = [];
    for (const el of document.querySelectorAll(
      'a, button, input, label, .badge, .t-body, .t-sm, .t-xs, .t-label, .t-h1, .t-h2, .t-h3, .t-body-strong, td, th, dd, dt, p, span',
    )) {
      if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.1) continue;
      /* Hanya elemen yang benar benar punya teks sendiri */
      const punyaTeksSendiri = [...el.childNodes].some(
        (n) => n.nodeType === 3 && n.textContent.trim().length > 0,
      );
      if (!punyaTeksSendiri) continue;

      const fg = urai(cs.color);
      if (!fg) continue;
      const bg = latarEfektif(el);
      const px = parseFloat(cs.fontSize);
      const berat = Number(cs.fontWeight) || 400;
      const ambang = px >= 24 || (px >= 18.66 && berat >= 700) ? 3 : 4.5;
      const nilai = rasio(gabung(fg, bg), bg);
      if (nilai < ambang) {
        gagal.push(
          `${el.tagName.toLowerCase()}.${[...el.classList].join('.')} = ${nilai.toFixed(2)}:1 (ambang ${ambang}, ${cs.color} di atas rgb(${bg.map(Math.round).join(',')}))`,
        );
      }
      if (gagal.length >= 6) break;
    }
    return gagal;
  });
  for (const k of kontras) catat('R20', `${rute} @${lebar}`, `kontras di bawah ambang, ${k}`);
}

/* R60 plus R57 keadaan TERBUKA: buka tiap dropdown, jauhkan pointer, lalu
   baca aria DAN geometri panel, dan ukur ulang overflow. */
async function periksaDropdown(page, rute, lebar) {
  await page.setViewportSize({ width: lebar, height: 900 });
  await page.goto(`${DASAR}${rute}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  const pemicu = await page.$$('.sel-trigger');
  for (let i = 0; i < pemicu.length; i += 1) {
    const t = pemicu[i];
    if (!(await t.isVisible())) continue;
    await t.click();
    await page.waitForTimeout(260);
    /* Jauhkan pointer supaya :hover tidak menutupi keadaan yang salah */
    await page.mouse.move(2, 2);
    await page.waitForTimeout(60);

    const keadaan = await page.evaluate((idx) => {
      const trig = [...document.querySelectorAll('.sel-trigger')].filter(
        (el) => el.offsetParent !== null,
      )[idx];
      if (!trig) return null;
      const idPanel = trig.getAttribute('aria-controls');
      const panel = idPanel ? document.getElementById(idPanel) : null;
      const cs = panel ? getComputedStyle(panel) : null;
      const r = panel ? panel.getBoundingClientRect() : null;
      return {
        aria: trig.getAttribute('aria-expanded'),
        terlihat: panel
          ? cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.1 && r.height > 10
          : false,
        kanan: r ? Math.round(r.right) : null,
        kiri: r ? Math.round(r.left) : null,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      };
    }, i);

    if (!keadaan) continue;

    if (keadaan.aria === 'true' && !keadaan.terlihat) {
      catat('R60', `${rute} @${lebar}`, `dropdown ${i}: aria-expanded true tapi panel tidak terlihat`);
    }
    if (keadaan.aria !== 'true' && keadaan.terlihat) {
      catat('R60', `${rute} @${lebar}`, `dropdown ${i}: panel terbuka tapi aria-expanded ${keadaan.aria}`);
    }
    if (keadaan.terlihat && (keadaan.kanan > keadaan.innerWidth + 1 || keadaan.kiri < -1)) {
      catat(
        'R16.1/R19',
        `${rute} @${lebar}`,
        `dropdown ${i}: panel keluar viewport, kiri ${keadaan.kiri} kanan ${keadaan.kanan} lawan lebar ${keadaan.innerWidth}`,
      );
    }
    if (keadaan.scrollWidth > keadaan.innerWidth) {
      catat(
        'R19/R57',
        `${rute} @${lebar}`,
        `dropdown ${i} TERBUKA memicu overflow, scrollWidth ${keadaan.scrollWidth} lawan ${keadaan.innerWidth}`,
      );
    }

    await page.keyboard.press('Escape');
    await page.waitForTimeout(220);

    const setelahEscape = await page.evaluate((idx) => {
      const trig = [...document.querySelectorAll('.sel-trigger')].filter(
        (el) => el.offsetParent !== null,
      )[idx];
      return trig ? trig.getAttribute('aria-expanded') : null;
    }, i);
    if (setelahEscape === 'true') {
      catat('R60', `${rute} @${lebar}`, `dropdown ${i}: masih aria-expanded true setelah Escape`);
    }
  }
}

/* R53: laci mobile harus benar benar setinggi viewport, bukan setinggi header.
   Diukur dari kotaknya, bukan dibaca dari CSS. */
async function periksaLaci(page) {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${DASAR}/app/`, { waitUntil: 'networkidle' });
  await page.click('.hamburger');
  await page.waitForTimeout(400);

  const ukuran = await page.evaluate(() => {
    const laci = document.querySelector('.navdrawer');
    if (!laci) return null;
    const r = laci.getBoundingClientRect();
    return {
      tinggi: Math.round(r.height),
      atas: Math.round(r.top),
      viewport: window.innerHeight,
      induk: laci.parentElement?.tagName.toLowerCase(),
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      /* Hanya logo yang benar benar TERLIHAT. Sidebar desktop masih ada di
         DOM dengan display none di mobile, dan itu bukan pelanggaran R52. */
      jumlahLogo: [...document.querySelectorAll('svg[viewBox="0 0 200 200"]')].filter(
        (el) => el.getClientRects().length > 0,
      ).length,
    };
  });

  if (!ukuran) {
    catat('R53', '/app/ @375', 'laci navigasi tidak ditemukan setelah hamburger diklik');
    return;
  }
  if (ukuran.tinggi < ukuran.viewport - 4) {
    catat(
      'R53',
      '/app/ @375',
      `laci kolaps, tinggi ${ukuran.tinggi} lawan viewport ${ukuran.viewport}, induk ${ukuran.induk}`,
    );
  }
  if (ukuran.induk !== 'body') {
    catat('R53', '/app/ @375', `laci tidak di-portal ke body, induknya ${ukuran.induk}`);
  }
  if (ukuran.scrollWidth > ukuran.innerWidth) {
    catat('R19/R57', '/app/ @375', `laci terbuka memicu overflow ${ukuran.scrollWidth} lawan ${ukuran.innerWidth}`);
  }
  if (ukuran.jumlahLogo > 1) {
    catat('R52', '/app/ @375', `logo muncul ${ukuran.jumlahLogo} kali saat laci terbuka, harusnya sekali`);
  }
}

/* R48: di 375px, tiap wadah berisi lebih dari 3 anak sejenis berupa kartu
   harus jadi snap carousel. Koleksi data ditandai data-r48 dan dikecualikan,
   alasannya ada di LAYOUT-ARCHITECTURE.md. */
async function periksaCarousel(page, rute) {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${DASAR}${rute}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  const gagal = await page.evaluate(() => {
    const hasil = [];
    for (const el of document.querySelectorAll('*')) {
      if (el.dataset.r48) continue;
      if (el.closest('[data-r48]')) continue;
      if (el.tagName === 'BODY' || el.tagName === 'HTML' || el.tagName === 'MAIN') continue;
      const anak = [...el.children].filter((c) => c.getBoundingClientRect().height > 80);
      if (anak.length <= 3) continue;
      /* Kecualikan daftar seksi halaman dan prosa */
      const tag = anak[0].tagName;
      /* Baris dan sel tabel bukan tumpukan kartu. Begitu juga daftar seksi
         halaman dan prosa. */
      if (['SECTION', 'P', 'LI', 'TR', 'TD', 'TH', 'THEAD', 'TBODY', 'COL'].includes(tag)) continue;
      if (['TABLE', 'THEAD', 'TBODY', 'TR'].includes(el.tagName)) continue;
      if (!anak.every((c) => c.tagName === tag)) continue;
      const cs = getComputedStyle(el);
      const gulirMendatar = cs.overflowX === 'auto' || cs.overflowX === 'scroll';
      const snap = (cs.scrollSnapType || '').startsWith('x');
      if (!gulirMendatar || !snap) {
        hasil.push(
          `${el.tagName.toLowerCase()}.${[...el.classList].join('.')} punya ${anak.length} anak ${tag}, overflowX ${cs.overflowX}, scrollSnapType ${cs.scrollSnapType}`,
        );
      }
      if (hasil.length >= 4) break;
    }
    return hasil;
  });
  for (const g of gagal) catat('R48', `${rute} @375`, g);
}

/* R59: setiap tautan internal harus 200, dan setiap rute harus dijangkau dari
   minimal satu tautan. Halaman yatim (terbangun, hidup, tidak ditaut dari mana
   pun) tetap cacat walaupun mengembalikan 200. Beda ejaan antara nama folder
   rute dan tautan yang menujunya adalah kegagalan keras. */
async function periksaTautan(page) {
  const terkumpul = new Set();
  const dijangkau = new Set();

  await page.setViewportSize({ width: 1440, height: 900 });
  for (const rute of RUTE) {
    await page.goto(`${DASAR}${rute}`, { waitUntil: 'networkidle' });
    const href = await page.evaluate(() =>
      [...document.querySelectorAll('a[href^="/"]')].map((a) => a.getAttribute('href')),
    );
    for (const h of href) {
      terkumpul.add(h);
      dijangkau.add(h.replace(/\/$/, '') || '/');
    }
  }

  for (const h of terkumpul) {
    const res = await page.request.get(`${DASAR}${h}`);
    if (res.status() !== 200) {
      catat('R59', h, `tautan internal mengembalikan ${res.status()}`);
    }
  }

  /* Kontrol negatif: pastikan yang dilihat memang 404 sungguhan, bukan
     fallback yang mengembalikan 200 untuk apa pun. */
  const kontrol = await page.request.get(`${DASAR}/zzz-rute-yang-tidak-ada/`);
  if (kontrol.status() === 200) {
    catat('R59', '/zzz-rute-yang-tidak-ada/', 'rute palsu mengembalikan 200, host memakai fallback sehingga cek 404 tidak bisa dipercaya');
  }

  for (const rute of RUTE) {
    const kunci = rute.replace(/\/$/, '') || '/';
    if (!dijangkau.has(kunci)) {
      catat('R59', rute, 'rute tidak ditaut dari halaman mana pun yang dipindai, kandidat halaman yatim');
    }
  }
}

/* -------------------------------------------------------------------------- */

const browser = await chromium.launch({
  executablePath: EXE,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();

for (const rute of RUTE) {
  for (const lebar of TITIK_HENTI) {
    await periksaHalaman(page, rute, lebar);
  }
}

for (const rute of ['/app/deals/', '/app/leads/', '/app/aktivitas/', '/app/laporan/', '/app/penawaran/']) {
  for (const lebar of [1025, 1440, 375]) {
    await periksaDropdown(page, rute, lebar);
  }
}

await periksaLaci(page);

await periksaTautan(page);

for (const rute of RUTE) {
  await periksaCarousel(page, rute);
}

await browser.close();

if (temuan.length === 0) {
  console.log('Semua pemeriksaan terukur lolos.');
  process.exit(0);
}

console.log(`${temuan.length} temuan:\n`);
const perAturan = {};
for (const t of temuan) (perAturan[t.aturan] ??= []).push(t);
for (const [aturan, daftar] of Object.entries(perAturan)) {
  console.log(`## ${aturan} (${daftar.length})`);
  for (const d of daftar.slice(0, 12)) console.log(`  ${d.rute}: ${d.pesan}`);
  if (daftar.length > 12) console.log(`  ... ${daftar.length - 12} lagi`);
  console.log('');
}
process.exit(1);
