'use client';

/* ==========================================================================
   Catatan kolaboratif dan lampiran demo per deal.

   Ini static export tanpa backend, jadi "lampiran" di sini bukan unggah
   berkas sungguhan, cuma nama berkas yang dicatat pengunjung, disimpan
   bersama catatannya di localStorage per deal. Cukup untuk memperlihatkan
   pola kolaborasi tim di sekitar satu deal, tanpa berpura-pura ada server
   penyimpan berkas yang sebenarnya tidak ada.
   ========================================================================== */

import { useCallback, useEffect, useState } from 'react';
import { HARI_INI } from '@/data/clock';
import { bacaSimpanan, tulisSimpanan } from '@/lib/hooks';

export interface CatatanDeal {
  id: string;
  teks: string;
  penulisId: string;
  waktu: string;
}

export interface LampiranDeal {
  id: string;
  namaFile: string;
  penulisId: string;
  waktu: string;
}

interface DataKolab {
  catatan: CatatanDeal[];
  lampiran: LampiranDeal[];
}

const KOSONG: DataKolab = { catatan: [], lampiran: [] };

function kunci(dealId: string) {
  return `deals.kolab.${dealId}`;
}

function baca(dealId: string): DataKolab {
  const mentah = bacaSimpanan(kunci(dealId));
  if (!mentah) return KOSONG;
  try {
    const hasil = JSON.parse(mentah) as DataKolab;
    return hasil && Array.isArray(hasil.catatan) && Array.isArray(hasil.lampiran) ? hasil : KOSONG;
  } catch {
    return KOSONG;
  }
}

let penghitung = 0;

export function useDealCollab(dealId: string) {
  const [data, setData] = useState<DataKolab>(KOSONG);

  useEffect(() => {
    setData(baca(dealId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId]);

  const simpan = useCallback(
    (baru: DataKolab) => {
      setData(baru);
      tulisSimpanan(kunci(dealId), JSON.stringify(baru));
    },
    [dealId],
  );

  const tambahCatatan = useCallback(
    (teks: string, penulisId: string) => {
      penghitung += 1;
      const catatan: CatatanDeal = { id: `cat-${Date.now().toString(36)}-${penghitung}`, teks, penulisId, waktu: HARI_INI };
      simpan({ ...data, catatan: [catatan, ...data.catatan] });
    },
    [data, simpan],
  );

  const tambahLampiran = useCallback(
    (namaFile: string, penulisId: string) => {
      penghitung += 1;
      const lampiran: LampiranDeal = { id: `lmp-${Date.now().toString(36)}-${penghitung}`, namaFile, penulisId, waktu: HARI_INI };
      simpan({ ...data, lampiran: [lampiran, ...data.lampiran] });
    },
    [data, simpan],
  );

  return { ...data, tambahCatatan, tambahLampiran };
}
