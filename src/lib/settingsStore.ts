'use client';

/* ==========================================================================
   Penyimpan pengaturan untuk demo. Pola yang sama dengan `useSimpanan` di
   `hooks.ts`: render pertama SELALU memakai nilai bawaan dari
   `src/data/settings.ts`, nilai tersimpan baru dipasang setelah mount, jadi
   HTML hasil build dan render pertama di browser tetap identik.
   ========================================================================== */

import { useCallback, useEffect, useState } from 'react';
import { ALASAN_KALAH, AMBANG_MANDEK_HARI, PPN_PERSEN, SUMBER_LEAD } from '@/data/settings';
import { bacaSimpanan, tulisSimpanan } from '@/lib/hooks';

const KUNCI = 'pengaturan';

export interface Pengaturan {
  sumberAktif: Record<string, boolean>;
  alasanAktif: Record<string, boolean>;
  ambangMandekHari: number;
  pajakPersen: number;
  mataUang: string;
  pengingatAktivitas: boolean;
  ringkasanHarian: boolean;
  kolomDeal: Record<string, boolean>;
}

const KOLOM_DEAL_BAWAAN = ['Nilai', 'Probabilitas', 'Perkiraan tutup', 'Penanggung jawab'];

export function pengaturanBawaan(): Pengaturan {
  return {
    sumberAktif: Object.fromEntries(SUMBER_LEAD.map((s) => [s.id, s.aktif])),
    alasanAktif: Object.fromEntries(ALASAN_KALAH.map((a) => [a.id, a.aktif])),
    ambangMandekHari: AMBANG_MANDEK_HARI,
    pajakPersen: PPN_PERSEN,
    mataUang: 'idr',
    pengingatAktivitas: true,
    ringkasanHarian: false,
    kolomDeal: Object.fromEntries(KOLOM_DEAL_BAWAAN.map((k) => [k, true])),
  };
}

function bacaPengaturan(): Pengaturan | null {
  const mentah = bacaSimpanan(KUNCI);
  if (!mentah) return null;
  try {
    const hasil = JSON.parse(mentah) as Partial<Pengaturan>;
    return { ...pengaturanBawaan(), ...hasil };
  } catch {
    return null;
  }
}

export function useSettingsStore() {
  const [nilai, setNilai] = useState<Pengaturan>(pengaturanBawaan);
  const [tersimpan, setTersimpan] = useState(false);

  useEffect(() => {
    const dariSimpanan = bacaPengaturan();
    if (dariSimpanan) {
      setNilai(dariSimpanan);
      setTersimpan(true);
    }
  }, []);

  const simpan = useCallback((baru: Pengaturan) => {
    setNilai(baru);
    tulisSimpanan(KUNCI, JSON.stringify(baru));
    setTersimpan(true);
  }, []);

  const kembalikanBawaan = useCallback(() => {
    const bawaan = pengaturanBawaan();
    setNilai(bawaan);
    tulisSimpanan(KUNCI, '');
    setTersimpan(false);
  }, []);

  return { pengaturan: nilai, simpan, kembalikanBawaan, tersimpan };
}
