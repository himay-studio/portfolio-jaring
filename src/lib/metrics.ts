/* ==========================================================================
   Turunan angka: pipeline, target lawan realisasi, deal mandek, konversi per
   tahap, dan performa per sales.

   Semuanya dihitung dari data yang sama (BRAND.md pilar 3, "angka yang bisa
   dipercaya"). Tidak ada angka dashboard yang diketik manual.
   ========================================================================== */

import { ACTIVITIES, DEALS, LEADS, USERS } from '@/data/relations';
import { HARI_INI, umurHari } from '@/data/clock';
import { AMBANG_MANDEK_HARI, TAHAP, TAHAP_AKTIF } from '@/data/settings';
import type { Activity, Deal, ID, Lead, TahapId, User } from '@/data/types';

/* -------------------------------------------------------------------------
   Deal
   ------------------------------------------------------------------------- */

export const dealBerjalan = (d: Deal) => d.tahap !== 'menang' && d.tahap !== 'kalah';

/** Berapa hari sebuah deal tidak tersentuh. */
export const hariMandek = (d: Deal) => umurHari(d.disentuhPada);

/** Deal berjalan yang tidak tersentuh lebih dari ambang (BRAND.md 4, pilar 1). */
export const isMandek = (d: Deal) =>
  dealBerjalan(d) && hariMandek(d) > AMBANG_MANDEK_HARI;

/** Berapa hari deal sudah duduk di tahapnya sekarang. */
export const hariDiTahap = (d: Deal) => umurHari(d.tahapSejak);

export const nilaiTotal = (deals: Deal[]) => deals.reduce((s, d) => s + d.nilai, 0);

/** Nilai pipeline dikali probabilitas, angka yang dipakai untuk perkiraan. */
export const nilaiTertimbang = (deals: Deal[]) =>
  Math.round(deals.reduce((s, d) => s + (d.nilai * d.probabilitas) / 100, 0));

export const pipelineBerjalan = (deals: Deal[] = DEALS) => deals.filter(dealBerjalan);

/** Deal per tahap, urut sesuai urutan pipeline. Dipakai kanban dan laporan. */
export function dealPerTahap(deals: Deal[] = DEALS): Record<TahapId, Deal[]> {
  const hasil = {} as Record<TahapId, Deal[]>;
  for (const t of TAHAP) hasil[t.id] = [];
  for (const d of deals) hasil[d.tahap].push(d);
  return hasil;
}

const dalamBulan = (iso: string | undefined, ym: string) =>
  iso !== undefined && iso.slice(0, 7) === ym;

export const bulanBerjalan = HARI_INI.slice(0, 7);

export const dealMenangBulan = (ym: string = bulanBerjalan, deals: Deal[] = DEALS) =>
  deals.filter((d) => d.tahap === 'menang' && dalamBulan(d.ditutupPada, ym));

export const dealKalahBulan = (ym: string = bulanBerjalan, deals: Deal[] = DEALS) =>
  deals.filter((d) => d.tahap === 'kalah' && dalamBulan(d.ditutupPada, ym));

/* -------------------------------------------------------------------------
   Target lawan realisasi
   ------------------------------------------------------------------------- */

export interface CapaianSales {
  user: User;
  target: number;
  realisasi: number;
  persenCapaian: number;
  jumlahMenang: number;
  jumlahKalah: number;
  nilaiPipeline: number;
}

export function capaianPerSales(ym: string = bulanBerjalan, deals: Deal[] = DEALS): CapaianSales[] {
  const menang = dealMenangBulan(ym, deals);
  const kalah = dealKalahBulan(ym, deals);
  return USERS.filter((u) => u.targetBulanan > 0)
    .map((user) => {
      const menangSaya = menang.filter((d) => d.ownerId === user.id);
      const realisasi = nilaiTotal(menangSaya);
      return {
        user,
        target: user.targetBulanan,
        realisasi,
        persenCapaian: user.targetBulanan > 0 ? (realisasi / user.targetBulanan) * 100 : 0,
        jumlahMenang: menangSaya.length,
        jumlahKalah: kalah.filter((d) => d.ownerId === user.id).length,
        nilaiPipeline: nilaiTotal(pipelineBerjalan(deals).filter((d) => d.ownerId === user.id)),
      };
    })
    .sort((a, b) => b.realisasi - a.realisasi);
}

/** Target tim adalah target manajer, bukan penjumlahan semua orang. */
export function targetTim(): number {
  return USERS.find((u) => u.peran === 'manajer')?.targetBulanan ?? 0;
}

/* -------------------------------------------------------------------------
   Aktivitas
   ------------------------------------------------------------------------- */

export const tanggalAktivitas = (a: Activity) => a.mulai.slice(0, 10);

export const aktivitasHariIni = (ownerId?: ID) =>
  ACTIVITIES.filter(
    (a) => tanggalAktivitas(a) === HARI_INI && (ownerId === undefined || a.ownerId === ownerId),
  ).sort((a, b) => a.mulai.localeCompare(b.mulai));

/** Sudah lewat tanggalnya dan belum ditandai selesai. */
export const aktivitasTerlambat = (ownerId?: ID) =>
  ACTIVITIES.filter(
    (a) =>
      !a.selesai &&
      umurHari(tanggalAktivitas(a)) > 0 &&
      (ownerId === undefined || a.ownerId === ownerId),
  ).sort((a, b) => a.mulai.localeCompare(b.mulai));

export const aktivitasMendatang = (jumlahHari = 7, ownerId?: ID) =>
  ACTIVITIES.filter((a) => {
    const jarak = -umurHari(tanggalAktivitas(a));
    return (
      jarak > 0 &&
      jarak <= jumlahHari &&
      !a.selesai &&
      (ownerId === undefined || a.ownerId === ownerId)
    );
  }).sort((a, b) => a.mulai.localeCompare(b.mulai));

/** Aktivitas pada satu tanggal ISO. Dipakai grid kalender. */
export const aktivitasPadaTanggal = (isoTanggal: string, daftar: Activity[] = ACTIVITIES) =>
  daftar
    .filter((a) => tanggalAktivitas(a) === isoTanggal)
    .sort((a, b) => a.mulai.localeCompare(b.mulai));

/* -------------------------------------------------------------------------
   Lead
   ------------------------------------------------------------------------- */

export const leadAktif = (l: Lead) => l.status !== 'dikonversi' && l.status !== 'tidak-layak';

export const leadBelumDihubungi = () =>
  LEADS.filter((l) => l.status === 'baru' && l.kontakTerakhir === null);

export interface PerformaSumber {
  sumberId: string;
  jumlahLead: number;
  jumlahKonversi: number;
  persenKonversi: number;
  nilaiDeal: number;
}

/** Sumber lead terbaik, diukur dari konversi jadi deal, bukan dari volume. */
export function performaSumberLead(): PerformaSumber[] {
  const peta = new Map<string, PerformaSumber>();
  for (const l of LEADS) {
    const baris = peta.get(l.sumber) ?? {
      sumberId: l.sumber,
      jumlahLead: 0,
      jumlahKonversi: 0,
      persenKonversi: 0,
      nilaiDeal: 0,
    };
    baris.jumlahLead += 1;
    if (l.konversi) {
      baris.jumlahKonversi += 1;
      const deal = DEALS.find((d) => d.id === l.konversi?.dealId);
      if (deal) baris.nilaiDeal += deal.nilai;
    }
    peta.set(l.sumber, baris);
  }
  return [...peta.values()]
    .map((b) => ({
      ...b,
      persenKonversi: b.jumlahLead > 0 ? (b.jumlahKonversi / b.jumlahLead) * 100 : 0,
    }))
    .sort((a, b) => b.jumlahLead - a.jumlahLead);
}

/* -------------------------------------------------------------------------
   Laporan pipeline
   ------------------------------------------------------------------------- */

export interface BarisCorong {
  tahapId: TahapId;
  nama: string;
  jumlah: number;
  nilai: number;
  /** Persentase terhadap tahap pertama. */
  persenDariAwal: number;
  /** Persentase terhadap tahap sebelumnya, ini yang menunjukkan kebocoran. */
  persenDariSebelumnya: number;
  rataHari: number;
}

/**
 * Corong konversi per tahap. Dihitung kumulatif: sebuah deal di Negosiasi
 * pasti pernah melewati Prospek, jadi ikut dihitung di semua tahap sebelum
 * tahapnya sekarang. Kalau tidak begitu, corongnya bukan corong, cuma
 * diagram batang biasa yang menyesatkan.
 */
export function corongKonversi(sumberDeals: Deal[] = DEALS): BarisCorong[] {
  const perTahap = dealPerTahap(sumberDeals);
  const urut = TAHAP_AKTIF;

  const kumulatif = urut.map((t, i) => {
    const tahapSetelahnya = urut.slice(i).map((x) => x.id);
    const deals = sumberDeals.filter(
      (d) =>
        tahapSetelahnya.includes(d.tahap as TahapId) ||
        // Deal yang sudah tutup pasti melewati semua tahap aktif.
        d.tahap === 'menang' ||
        (d.tahap === 'kalah' && urut.findIndex((x) => x.id === t.id) === 0),
    );
    return { tahap: t, deals };
  });

  const awal = kumulatif[0]?.deals.length ?? 0;

  return kumulatif.map(({ tahap, deals }, i) => {
    const sebelumnya = i === 0 ? deals.length : kumulatif[i - 1].deals.length;
    const diTahapIni = perTahap[tahap.id];
    const rataHari =
      diTahapIni.length > 0
        ? Math.round(diTahapIni.reduce((s, d) => s + hariDiTahap(d), 0) / diTahapIni.length)
        : 0;
    return {
      tahapId: tahap.id,
      nama: tahap.nama,
      jumlah: deals.length,
      nilai: nilaiTotal(deals),
      persenDariAwal: awal > 0 ? (deals.length / awal) * 100 : 0,
      persenDariSebelumnya: sebelumnya > 0 ? (deals.length / sebelumnya) * 100 : 0,
      rataHari,
    };
  });
}

/** Rasio menang terhadap seluruh deal yang sudah ditutup. */
export function rasioMenang(deals: Deal[] = DEALS): number {
  const menang = deals.filter((d) => d.tahap === 'menang').length;
  const kalah = deals.filter((d) => d.tahap === 'kalah').length;
  const total = menang + kalah;
  return total > 0 ? (menang / total) * 100 : 0;
}

export interface RingkasanAlasanKalah {
  alasanId: string;
  jumlah: number;
  nilai: number;
}

export function ringkasanAlasanKalah(deals: Deal[] = DEALS): RingkasanAlasanKalah[] {
  const peta = new Map<string, RingkasanAlasanKalah>();
  for (const d of deals) {
    if (d.tahap !== 'kalah' || !d.alasanKalahId) continue;
    const baris = peta.get(d.alasanKalahId) ?? { alasanId: d.alasanKalahId, jumlah: 0, nilai: 0 };
    baris.jumlah += 1;
    baris.nilai += d.nilai;
    peta.set(d.alasanKalahId, baris);
  }
  return [...peta.values()].sort((a, b) => b.jumlah - a.jumlah);
}

/* -------------------------------------------------------------------------
   Tren pipeline mingguan. Dipakai grafik garis dashboard.

   Tanpa snapshot historis sungguhan, nilai tiap titik minggu direkonstruksi
   dari dibuatPada dan ditutupPada: sebuah deal terhitung "berjalan" pada
   akhir minggu W kalau sudah dibuat sebelum W dan belum ditutup sebelum W.
   ------------------------------------------------------------------------- */

export interface TitikTrenMingguan {
  label: string;
  nilai: number;
}

export function trenPipelineMingguan(deals: Deal[] = DEALS, jumlahMinggu = 8): TitikTrenMingguan[] {
  const titik: TitikTrenMingguan[] = [];
  for (let i = jumlahMinggu - 1; i >= 0; i--) {
    const iso = new Date(Date.parse(HARI_INI) - i * 7 * 86400000).toISOString().slice(0, 10);
    const berjalanSaatItu = deals.filter((d) => {
      if (d.dibuatPada > iso) return false;
      if (d.ditutupPada && d.ditutupPada <= iso) return false;
      return true;
    });
    titik.push({
      label: iso.slice(5),
      nilai: nilaiTotal(berjalanSaatItu),
    });
  }
  return titik;
}
