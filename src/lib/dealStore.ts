'use client';

/* ==========================================================================
   Penyimpan perubahan deal untuk demo.

   Tanpa backend. Data dasarnya statis di `src/data/deals.ts`, dan setiap
   perubahan yang dilakukan pengunjung disimpan sebagai LAPISAN TIMPA di
   localStorage, bukan dengan menulis ulang data dasarnya.

   Bentuk ini dipilih supaya:
   - Data dasar tetap satu sumber kebenaran dan bisa digemukkan Stage 5 tanpa
     bentrok dengan apa pun yang tersimpan di browser pengunjung.
   - Tombol "Kembalikan data demo" cukup menghapus dua kunci.
   - Render pertama SELALU memakai data dasar, jadi HTML hasil build identik
     dengan render pertama di browser dan tidak ada hydration mismatch.
     Timpaan baru dipasang setelah mount.

   Aturan bisnis yang ditegakkan di sini, bukan di komponen: pindah ke tahap
   Kalah WAJIB membawa alasan kalah. Kalau alasannya kosong, perpindahan
   ditolak. Dengan begitu tidak ada satu pun jalur di UI, termasuk jalur
   keyboard, aksi massal, dan modal tambah/ubah, yang bisa menghasilkan deal
   kalah tanpa alasan.

   Dua lapisan disimpan terpisah:
   - `deals.overrides` menimpa FIELD pada deal yang sudah ada di data dasar.
   - `deals.baru` menampung deal yang benar benar baru dibuat lewat modal
     tambah, karena deal itu tidak punya record di data dasar untuk ditimpa.
   ========================================================================== */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { HARI_INI } from '@/data/clock';
import { DEALS } from '@/data/deals';
import { TAHAP } from '@/data/settings';
import type { AlasanKalahId, Deal, ID, TahapId } from '@/data/types';
import { bacaSimpanan, tulisSimpanan } from '@/lib/hooks';

const KUNCI_TIMPA = 'deals.overrides';
const KUNCI_BARU = 'deals.baru';

type TimpaDeal = Partial<Omit<Deal, 'id'>>;
type PetaTimpa = Record<ID, TimpaDeal>;

function bacaTimpa(): PetaTimpa {
  const mentah = bacaSimpanan(KUNCI_TIMPA);
  if (!mentah) return {};
  try {
    const hasil = JSON.parse(mentah) as PetaTimpa;
    return typeof hasil === 'object' && hasil !== null ? hasil : {};
  } catch {
    return {};
  }
}

function bacaDealBaru(): Deal[] {
  const mentah = bacaSimpanan(KUNCI_BARU);
  if (!mentah) return [];
  try {
    const hasil = JSON.parse(mentah) as Deal[];
    return Array.isArray(hasil) ? hasil : [];
  } catch {
    return [];
  }
}

export interface HasilPindah {
  ok: boolean;
  /** Diisi kalau perpindahan ditolak, supaya UI bisa menjelaskan sebabnya. */
  alasanTolak?: string;
}

export type InputDealBaru = Pick<
  Deal,
  'nama' | 'companyId' | 'contactId' | 'ownerId' | 'nilai' | 'tahap' | 'perkiraanTutup' | 'sumber' | 'catatan'
>;

let penghitungIdBaru = 0;

/**
 * Buat deal baru langsung ke localStorage tanpa lewat hook React. Dipakai
 * alur konversi lead di `leadStore.ts`, yang berjalan di luar komponen mana
 * pun yang sedang me-render papan deal, jadi tidak bisa memanggil setState
 * `useDealStore`. Baris localStorage-nya sama persis dengan yang ditulis
 * `tambahDeal` di bawah, jadi begitu pengunjung membuka `/app/deals/`,
 * `useDealStore` yang mount di sana membacanya seperti deal baru lainnya.
 */
export function buatDealBaruLangsung(input: InputDealBaru): ID {
  penghitungIdBaru += 1;
  const id = `dea-baru-${Date.now().toString(36)}-${penghitungIdBaru}`;
  const def = TAHAP.find((t) => t.id === input.tahap);
  const deal: Deal = {
    id,
    nama: input.nama,
    companyId: input.companyId,
    contactId: input.contactId,
    ownerId: input.ownerId,
    nilai: input.nilai,
    probabilitas: def?.probabilitasBawaan ?? 10,
    tahap: input.tahap,
    perkiraanTutup: input.perkiraanTutup,
    dibuatPada: HARI_INI,
    tahapSejak: HARI_INI,
    disentuhPada: HARI_INI,
    sumber: input.sumber,
    catatan: input.catatan,
  };
  const sekarang = bacaDealBaru();
  tulisSimpanan(KUNCI_BARU, JSON.stringify([...sekarang, deal]));
  return id;
}

export function useDealStore() {
  const [timpa, setTimpa] = useState<PetaTimpa>({});
  const [dealBaru, setDealBaru] = useState<Deal[]>([]);
  const [siap, setSiap] = useState(false);

  useEffect(() => {
    setTimpa(bacaTimpa());
    setDealBaru(bacaDealBaru());
    setSiap(true);
  }, []);

  const simpanTimpa = useCallback((baru: PetaTimpa) => {
    setTimpa(baru);
    tulisSimpanan(KUNCI_TIMPA, JSON.stringify(baru));
  }, []);

  const simpanDealBaru = useCallback((baru: Deal[]) => {
    setDealBaru(baru);
    tulisSimpanan(KUNCI_BARU, JSON.stringify(baru));
  }, []);

  const terapkanTimpa = useCallback((d: Deal): Deal => {
    const t = timpa[d.id];
    return t ? { ...d, ...t } : d;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timpa]);

  const deals = useMemo<Deal[]>(
    () => [...DEALS.map(terapkanTimpa), ...dealBaru.map(terapkanTimpa)],
    [terapkanTimpa, dealBaru],
  );

  const pindahTahap = useCallback(
    (
      dealId: ID,
      tahapTujuan: TahapId,
      alasan?: { alasanKalahId: AlasanKalahId; catatan: string },
    ): HasilPindah => {
      const dasar = DEALS.find((d) => d.id === dealId) ?? dealBaru.find((d) => d.id === dealId);
      if (!dasar) return { ok: false, alasanTolak: 'Deal tidak ditemukan.' };

      /* Aturan yang tidak bisa dilewati dari jalur mana pun, termasuk keyboard. */
      if (tahapTujuan === 'kalah' && !alasan?.alasanKalahId) {
        return { ok: false, alasanTolak: 'Deal kalah wajib punya alasan kalah.' };
      }

      const def = TAHAP.find((t) => t.id === tahapTujuan);
      const terminal = def?.terminal !== null;

      const patch: TimpaDeal = {
        tahap: tahapTujuan,
        probabilitas: def?.probabilitasBawaan ?? dasar.probabilitas,
        tahapSejak: HARI_INI,
        disentuhPada: HARI_INI,
        ditutupPada: terminal ? HARI_INI : undefined,
        alasanKalahId: tahapTujuan === 'kalah' ? alasan?.alasanKalahId : undefined,
        catatanKalah: tahapTujuan === 'kalah' ? alasan?.catatan : undefined,
      };

      if (DEALS.some((d) => d.id === dealId)) {
        simpanTimpa({ ...timpa, [dealId]: { ...timpa[dealId], ...patch } });
      } else {
        simpanDealBaru(dealBaru.map((d) => (d.id === dealId ? { ...d, ...patch } : d)));
      }
      return { ok: true };
    },
    [timpa, simpanTimpa, dealBaru, simpanDealBaru],
  );

  /** Aksi massal: geser sekumpulan deal ke tahap yang sama sekaligus. */
  const pindahTahapMassal = useCallback(
    (
      dealIds: ID[],
      tahapTujuan: TahapId,
      alasan?: { alasanKalahId: AlasanKalahId; catatan: string },
    ): HasilPindah => {
      if (tahapTujuan === 'kalah' && !alasan?.alasanKalahId) {
        return { ok: false, alasanTolak: 'Deal kalah wajib punya alasan kalah.' };
      }
      for (const id of dealIds) pindahTahap(id, tahapTujuan, alasan);
      return { ok: true };
    },
    [pindahTahap],
  );

  /** Aksi massal: pindahkan sekumpulan deal ke penanggung jawab baru. */
  const ubahOwnerMassal = useCallback(
    (dealIds: ID[], ownerId: ID) => {
      const idBaru = new Set(dealIds.filter((id) => !DEALS.some((d) => d.id === id)));
      if (idBaru.size > 0) {
        simpanDealBaru(dealBaru.map((d) => (idBaru.has(d.id) ? { ...d, ownerId } : d)));
      }
      const idDasar = dealIds.filter((id) => DEALS.some((d) => d.id === id));
      if (idDasar.length > 0) {
        const baru: PetaTimpa = { ...timpa };
        for (const id of idDasar) baru[id] = { ...baru[id], ownerId };
        simpanTimpa(baru);
      }
    },
    [timpa, simpanTimpa, dealBaru, simpanDealBaru],
  );

  /** Ubah field bebas pada satu deal, dipakai modal ubah deal. */
  const ubahDeal = useCallback(
    (dealId: ID, patch: Partial<Deal>) => {
      if (DEALS.some((d) => d.id === dealId)) {
        simpanTimpa({ ...timpa, [dealId]: { ...timpa[dealId], ...patch, disentuhPada: HARI_INI } });
      } else {
        simpanDealBaru(
          dealBaru.map((d) => (d.id === dealId ? { ...d, ...patch, disentuhPada: HARI_INI } : d)),
        );
      }
    },
    [timpa, simpanTimpa, dealBaru, simpanDealBaru],
  );

  /** Tambah deal baru lewat modal. Mengembalikan id yang baru dibuat. */
  const tambahDeal = useCallback(
    (input: InputDealBaru): ID => {
      penghitungIdBaru += 1;
      const id = `dea-baru-${Date.now().toString(36)}-${penghitungIdBaru}`;
      const def = TAHAP.find((t) => t.id === input.tahap);
      const deal: Deal = {
        id,
        nama: input.nama,
        companyId: input.companyId,
        contactId: input.contactId,
        ownerId: input.ownerId,
        nilai: input.nilai,
        probabilitas: def?.probabilitasBawaan ?? 10,
        tahap: input.tahap,
        perkiraanTutup: input.perkiraanTutup,
        dibuatPada: HARI_INI,
        tahapSejak: HARI_INI,
        disentuhPada: HARI_INI,
        sumber: input.sumber,
        catatan: input.catatan,
      };
      simpanDealBaru([...dealBaru, deal]);
      return id;
    },
    [dealBaru, simpanDealBaru],
  );

  const kembalikanDemo = useCallback(() => {
    simpanTimpa({});
    simpanDealBaru([]);
  }, [simpanTimpa, simpanDealBaru]);

  const jumlahPerubahan = Object.keys(timpa).length + dealBaru.length;

  return {
    deals,
    siap,
    pindahTahap,
    pindahTahapMassal,
    ubahOwnerMassal,
    ubahDeal,
    tambahDeal,
    kembalikanDemo,
    jumlahPerubahan,
  };
}
