'use client';

/* ==========================================================================
   Penyimpan perubahan deal untuk demo.

   Tanpa backend. Data dasarnya statis di `src/data/deals.ts`, dan setiap
   perubahan yang dilakukan pengunjung disimpan sebagai LAPISAN TIMPA di
   localStorage, bukan dengan menulis ulang data dasarnya.

   Bentuk ini dipilih supaya:
   - Data dasar tetap satu sumber kebenaran dan bisa digemukkan Stage 5 tanpa
     bentrok dengan apa pun yang tersimpan di browser pengunjung.
   - Tombol "Kembalikan data demo" cukup menghapus satu kunci.
   - Render pertama SELALU memakai data dasar, jadi HTML hasil build identik
     dengan render pertama di browser dan tidak ada hydration mismatch.
     Timpaan baru dipasang setelah mount.

   Aturan bisnis yang ditegakkan di sini, bukan di komponen: pindah ke tahap
   Kalah WAJIB membawa alasan kalah. Kalau alasannya kosong, perpindahan
   ditolak. Dengan begitu tidak ada satu pun jalur di UI, termasuk jalur
   keyboard, yang bisa menghasilkan deal kalah tanpa alasan.
   ========================================================================== */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { HARI_INI } from '@/data/clock';
import { DEALS } from '@/data/deals';
import { TAHAP } from '@/data/settings';
import type { AlasanKalahId, Deal, ID, TahapId } from '@/data/types';
import { bacaSimpanan, tulisSimpanan } from '@/lib/hooks';

const KUNCI = 'deals.overrides';

interface TimpaDeal {
  tahap: TahapId;
  probabilitas: number;
  tahapSejak: string;
  disentuhPada: string;
  ditutupPada?: string;
  alasanKalahId?: AlasanKalahId;
  catatanKalah?: string;
}

type PetaTimpa = Record<ID, TimpaDeal>;

function bacaTimpa(): PetaTimpa {
  const mentah = bacaSimpanan(KUNCI);
  if (!mentah) return {};
  try {
    const hasil = JSON.parse(mentah) as PetaTimpa;
    return typeof hasil === 'object' && hasil !== null ? hasil : {};
  } catch {
    return {};
  }
}

export interface HasilPindah {
  ok: boolean;
  /** Diisi kalau perpindahan ditolak, supaya UI bisa menjelaskan sebabnya. */
  alasanTolak?: string;
}

export function useDealStore() {
  const [timpa, setTimpa] = useState<PetaTimpa>({});
  const [siap, setSiap] = useState(false);

  useEffect(() => {
    setTimpa(bacaTimpa());
    setSiap(true);
  }, []);

  const simpan = useCallback((baru: PetaTimpa) => {
    setTimpa(baru);
    tulisSimpanan(KUNCI, JSON.stringify(baru));
  }, []);

  const deals = useMemo<Deal[]>(
    () =>
      DEALS.map((d) => {
        const t = timpa[d.id];
        return t ? { ...d, ...t } : d;
      }),
    [timpa],
  );

  const pindahTahap = useCallback(
    (
      dealId: ID,
      tahapTujuan: TahapId,
      alasan?: { alasanKalahId: AlasanKalahId; catatan: string },
    ): HasilPindah => {
      const dasar = DEALS.find((d) => d.id === dealId);
      if (!dasar) return { ok: false, alasanTolak: 'Deal tidak ditemukan.' };

      /* Aturan yang tidak bisa dilewati dari jalur mana pun, termasuk keyboard. */
      if (tahapTujuan === 'kalah' && !alasan?.alasanKalahId) {
        return { ok: false, alasanTolak: 'Deal kalah wajib punya alasan kalah.' };
      }

      const def = TAHAP.find((t) => t.id === tahapTujuan);
      const terminal = def?.terminal !== null;

      const baru: PetaTimpa = {
        ...timpa,
        [dealId]: {
          tahap: tahapTujuan,
          probabilitas: def?.probabilitasBawaan ?? dasar.probabilitas,
          tahapSejak: HARI_INI,
          disentuhPada: HARI_INI,
          ditutupPada: terminal ? HARI_INI : undefined,
          alasanKalahId: tahapTujuan === 'kalah' ? alasan?.alasanKalahId : undefined,
          catatanKalah: tahapTujuan === 'kalah' ? alasan?.catatan : undefined,
        },
      };

      simpan(baru);
      return { ok: true };
    },
    [timpa, simpan],
  );

  const kembalikanDemo = useCallback(() => {
    simpan({});
  }, [simpan]);

  const jumlahPerubahan = Object.keys(timpa).length;

  return { deals, siap, pindahTahap, kembalikanDemo, jumlahPerubahan };
}
