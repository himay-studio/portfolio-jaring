/* ==========================================================================
   Pemformat angka, mata uang, dan tanggal.

   Ditulis tangan, bukan lewat Intl, karena tiga alasan:
   1. Hasilnya identik di server saat build dan di browser saat hidrasi.
      Intl bisa berbeda kalau data ICU di lingkungan build tidak lengkap, dan
      itu muncul sebagai hydration mismatch.
   2. Intl kadang menyisipkan en dash pada rentang, dan itu melanggar R11.
   3. Format Rupiah yang kita mau (titik ribuan, tanpa desimal) memang cuma
      satu bentuk, jadi tidak perlu mesin selengkap Intl.
   ========================================================================== */

const BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const BULAN_PENDEK = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

/** Minggu dimulai Senin, sesuai kebiasaan kalender kerja di Indonesia. */
export const HARI_PENDEK = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
export const HARI_PANJANG = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
  'Minggu',
];

/* -------------------------------------------------------------------------
   Angka dan mata uang
   ------------------------------------------------------------------------- */

/** 125000000 jadi "125.000.000". Titik sebagai pemisah ribuan (BRAND.md 8). */
export function angka(n: number): string {
  const bulat = Math.round(Math.abs(n));
  const teks = bulat.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return n < 0 ? `-${teks}` : teks;
}

/** 125000000 jadi "Rp 125.000.000". Tanpa desimal. */
export function rupiah(n: number): string {
  return `Rp ${angka(n)}`;
}

/**
 * Bentuk ringkas untuk kartu KPI dan sumbu grafik, di mana angka penuh
 * bikin kolom melebar tidak karuan.
 * 1_200_000_000 jadi "Rp 1,2 M", 125_000_000 jadi "Rp 125 jt".
 */
export function rupiahSingkat(n: number): string {
  const abs = Math.abs(n);
  const tanda = n < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    const m = abs / 1_000_000_000;
    const teks = m >= 10 ? Math.round(m).toString() : m.toFixed(1).replace('.', ',');
    return `${tanda}Rp ${teks} M`;
  }
  if (abs >= 1_000_000) {
    return `${tanda}Rp ${Math.round(abs / 1_000_000)} jt`;
  }
  if (abs >= 1_000) {
    return `${tanda}Rp ${Math.round(abs / 1_000)} rb`;
  }
  return `${tanda}Rp ${Math.round(abs)}`;
}

export function persen(n: number, desimal = 0): string {
  const teks = desimal > 0 ? n.toFixed(desimal).replace('.', ',') : Math.round(n).toString();
  return `${teks} persen`;
}

/** Bentuk pendek untuk badge dan sumbu, di mana kata "persen" kepanjangan. */
export function persenSingkat(n: number): string {
  return `${Math.round(n)}%`;
}

/* -------------------------------------------------------------------------
   Tanggal
   ------------------------------------------------------------------------- */

function pecah(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return { y, m, d };
}

/** "2026-08-12" jadi "12 Agustus 2026" (format tampilan wajib, DESIGN.md 6.3). */
export function tanggal(iso: string): string {
  const { y, m, d } = pecah(iso);
  return `${d} ${BULAN[m - 1]} ${y}`;
}

/** "2026-08-12" jadi "12 Agu 2026". Dipakai di sel tabel yang sempit. */
export function tanggalPendek(iso: string): string {
  const { y, m, d } = pecah(iso);
  return `${d} ${BULAN_PENDEK[m - 1]} ${y}`;
}

/** "2026-08-12" jadi "12 Agu". Dipakai di kartu kanban dan sumbu grafik. */
export function tanggalRingkas(iso: string): string {
  const { m, d } = pecah(iso);
  return `${d} ${BULAN_PENDEK[m - 1]}`;
}

/** "2026-08" jadi "Agustus 2026". */
export function namaBulanTahun(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return `${BULAN[m - 1]} ${y}`;
}

export function namaBulan(m: number): string {
  return BULAN[m - 1];
}

/** "2026-07-29T09:30" jadi "09:30". */
export function jam(isoDatetime: string): string {
  const bagian = isoDatetime.split('T')[1];
  return bagian ? bagian.slice(0, 5) : '';
}

/** Indeks hari dengan Senin = 0, supaya cocok dengan HARI_PENDEK. */
export function indeksHari(iso: string): number {
  const { y, m, d } = pecah(iso);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

export function namaHari(iso: string): string {
  return HARI_PANJANG[indeksHari(iso)];
}

export function namaHariPendek(iso: string): string {
  return HARI_PENDEK[indeksHari(iso)];
}

/** "2026-08-12" jadi "Rabu, 12 Agustus 2026". */
export function tanggalLengkap(iso: string): string {
  return `${namaHari(iso)}, ${tanggal(iso)}`;
}

/**
 * Jarak hari dalam bahasa manusia, relatif terhadap jangkar demo.
 * Sengaja tanpa tanda hubung panjang, hanya kata (R11).
 */
export function relatifHari(selisih: number): string {
  if (selisih === 0) return 'hari ini';
  if (selisih === 1) return 'besok';
  if (selisih === -1) return 'kemarin';
  if (selisih > 1) return `${selisih} hari lagi`;
  return `${Math.abs(selisih)} hari lalu`;
}

/* -------------------------------------------------------------------------
   Identitas visual
   ------------------------------------------------------------------------- */

/** "Budi Santoso" jadi "BS". Maksimal dua huruf. */
export function inisial(nama: string): string {
  const kata = nama.trim().split(/\s+/).filter(Boolean);
  if (kata.length === 0) return '?';
  if (kata.length === 1) return kata[0].slice(0, 2).toUpperCase();
  return (kata[0][0] + kata[kata.length - 1][0]).toUpperCase();
}

/**
 * Nomor warna avatar 0 sampai 7, ditentukan dari id supaya orang yang sama
 * selalu dapat warna yang sama di layar mana pun. Delapan warna itu semuanya
 * lulus 4.5:1 dengan teks putih, angkanya ada di DESIGN.md 3.2.
 */
export function hue(kunci: string): number {
  let h = 0;
  for (let i = 0; i < kunci.length; i += 1) {
    h = (h * 31 + kunci.charCodeAt(i)) >>> 0;
  }
  return h % 8;
}
