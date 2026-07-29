/* ==========================================================================
   Jam demo.

   Seluruh tanggal di data demo diturunkan dari SATU jangkar tetap, bukan dari
   `new Date()`. Dua alasan, keduanya penting:

   1. Static export. Kalau tanggal dihitung dari jam sistem, HTML hasil build
      dan hasil render di browser bisa berbeda hari, dan itu hydration
      mismatch yang muncul sebagai teks berkedip lalu berubah sendiri.
   2. Reproducible. QA yang membuka situs minggu depan melihat papan yang
      persis sama dengan yang di-screenshot hari ini.

   Konsekuensinya jujur: "jatuh tempo hari ini" berarti jatuh tempo pada
   tanggal jangkar, bukan pada hari nyata pengunjung. Untuk demo portfolio ini
   pilihan yang benar. Stage 5 boleh menggeser seluruh dataset cukup dengan
   mengubah satu konstanta di bawah.
   ========================================================================== */

/** Jangkar "hari ini" untuk seluruh data demo. Format YYYY-MM-DD. */
export const HARI_INI = '2026-07-29';

/** Awal bulan berjalan pada jam demo, dipakai laporan dan target bulanan. */
export const BULAN_INI = HARI_INI.slice(0, 7); // 2026-07

function keUTC(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function dariUTC(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Tanggal relatif terhadap jangkar demo.
 * `hari(-3)` berarti tiga hari sebelum HARI_INI.
 */
export function hari(offset: number): string {
  return dariUTC(keUTC(HARI_INI) + offset * 86400000);
}

/**
 * Datetime relatif terhadap jangkar demo.
 * `waktu(-1, '14:30')` berarti kemarin pukul 14:30.
 */
export function waktu(offset: number, jam: string): string {
  return `${hari(offset)}T${jam}`;
}

/** Selisih hari antara dua tanggal ISO, positif kalau `b` lebih baru. */
export function selisihHari(a: string, b: string): number {
  return Math.round((keUTC(b.slice(0, 10)) - keUTC(a.slice(0, 10))) / 86400000);
}

/** Berapa hari sebuah tanggal berjarak dari jangkar demo. */
export function umurHari(iso: string): number {
  return selisihHari(iso, HARI_INI);
}
