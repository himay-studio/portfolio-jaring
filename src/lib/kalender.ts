/* ==========================================================================
   Aritmetika tanggal untuk date picker dan kalender aktivitas.

   Semua hitungan lewat UTC lalu dipotong jadi "YYYY-MM-DD". Dengan begitu
   tidak ada pergeseran zona waktu yang bikin tanggal meleset satu hari antara
   hasil build dan hasil render di browser.

   Minggu dimulai hari SENIN, mengikuti kebiasaan kalender kerja Indonesia.
   ========================================================================== */

export interface SelKalender {
  iso: string;
  /** True kalau sel ini milik bulan sebelum atau sesudah bulan yang ditampilkan. */
  luarBulan: boolean;
}

function keUTC(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function keISO(t: Date): string {
  return t.toISOString().slice(0, 10);
}

export function tambahHari(iso: string, jumlah: number): string {
  const t = keUTC(iso);
  t.setUTCDate(t.getUTCDate() + jumlah);
  return keISO(t);
}

export function tambahBulan(iso: string, jumlah: number): string {
  const t = keUTC(iso);
  const tanggalAsli = t.getUTCDate();
  t.setUTCDate(1);
  t.setUTCMonth(t.getUTCMonth() + jumlah);
  /* Jaga jaga 31 Januari ditambah satu bulan. Dipotong ke hari terakhir
     bulan tujuan, bukan melompat ke bulan berikutnya. */
  const hariTerakhir = new Date(
    Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0),
  ).getUTCDate();
  t.setUTCDate(Math.min(tanggalAsli, hariTerakhir));
  return keISO(t);
}

/** Indeks hari dengan Senin = 0. */
export function indeksHariSenin(iso: string): number {
  return (keUTC(iso).getUTCDay() + 6) % 7;
}

/** Hari Senin pada minggu yang memuat `iso`. */
export function awalMinggu(iso: string): string {
  return tambahHari(iso, -indeksHariSenin(iso));
}

/** Tujuh tanggal dalam satu minggu, dimulai Senin. */
export function mingguDari(iso: string): string[] {
  const senin = awalMinggu(iso);
  return Array.from({ length: 7 }, (_, i) => tambahHari(senin, i));
}

/** Tanggal 1 pada bulan yang memuat `iso`. */
export function awalBulan(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

export function akhirBulan(iso: string): string {
  const t = keUTC(iso);
  return keISO(new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)));
}

/**
 * Grid 6 baris kali 7 kolom untuk sebuah bulan. Selalu 42 sel supaya tinggi
 * kalender tidak berubah ubah saat ganti bulan, yang bikin layout melompat.
 */
export function gridBulan(isoDiBulanItu: string): SelKalender[] {
  const pertama = awalBulan(isoDiBulanItu);
  const mulai = awalMinggu(pertama);
  const bulanIni = pertama.slice(0, 7);
  return Array.from({ length: 42 }, (_, i) => {
    const iso = tambahHari(mulai, i);
    return { iso, luarBulan: iso.slice(0, 7) !== bulanIni };
  });
}

/** True kalau `iso` berada di dalam rentang, batas ikut dihitung. */
export function dalamRentang(iso: string, mulai?: string, sampai?: string): boolean {
  if (!mulai || !sampai) return false;
  const a = mulai <= sampai ? mulai : sampai;
  const b = mulai <= sampai ? sampai : mulai;
  return iso >= a && iso <= b;
}
