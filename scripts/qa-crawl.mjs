#!/usr/bin/env node
/**
 * Sapuan R59 EXHAUSTIVE: seluruh 198 rute terbangun, seluruh tautan
 * internal unik, dua arah (tautan mati + rute yatim), terhadap URL
 * PRODUKSI. Satu-pakai, dijalankan dari QA & Deploy Stage 6.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const AKAR = process.cwd();
const OUT = join(AKAR, 'out');
const DASAR = process.argv[2] ?? 'https://portfolio-jaring.himaystudio.com';

function rute() {
  const hasil = [];
  const jalan = (dir, prefix) => {
    for (const entri of readdirSync(dir)) {
      const p = join(dir, entri);
      if (statSync(p).isDirectory()) {
        jalan(p, `${prefix}${entri}/`);
      } else if (entri === 'index.html') {
        hasil.push(prefix || '/');
      }
    }
  };
  jalan(OUT, '/');
  return hasil;
}

const RUTE = rute();
process.stdout.write(`Total rute terbangun: ${RUTE.length}\n`);

const tautan = new Set();
for (const r of RUTE) {
  const f = join(OUT, r.replace(/^\//, ''), 'index.html');
  if (!existsSync(f)) continue;
  const html = readFileSync(f, 'utf8');
  const re = /href="(\/[^"#?]*)"/g;
  let m;
  while ((m = re.exec(html))) {
    let h = m[1];
    if (!h.startsWith('/_next')) tautan.add(h);
  }
}
process.stdout.write(`Total tautan internal unik: ${tautan.size}\n`);

async function cekStatus(jalur) {
  const url = DASAR + jalur;
  for (let percobaan = 0; percobaan < 3; percobaan += 1) {
    try {
      const res = await fetch(url, { redirect: 'manual' });
      return res.status;
    } catch (e) {
      if (percobaan === 2) return `ERROR ${e.message}`;
      await new Promise((r) => setTimeout(r, 800));
    }
  }
}

const mati = [];
for (const t of tautan) {
  const status = await cekStatus(t);
  if (status !== 200) mati.push(`${t} -> ${status}`);
}
process.stdout.write(`Tautan mati (bukan 200): ${mati.length}\n`);
mati.forEach((m) => process.stdout.write(`  ${m}\n`));

const dijangkau = new Set([...tautan].map((t) => t.replace(/\/$/, '') || '/'));
const yatim = RUTE.filter((r) => !dijangkau.has(r.replace(/\/$/, '') || '/'));
process.stdout.write(`Rute yatim (terbangun, tak ada tautan menuju): ${yatim.length}\n`);
yatim.forEach((y) => process.stdout.write(`  ${y}\n`));

const kontrol = await cekStatus('/zzz-nonexistent/');
process.stdout.write(`Kontrol negatif /zzz-nonexistent/ -> ${kontrol} (wajib 404)\n`);
