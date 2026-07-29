'use client';

/* ==========================================================================
   Penyimpan perubahan penawaran untuk demo. Pola yang sama dengan
   `dealStore.ts` dan `activityStore.ts`.
   ========================================================================== */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { HARI_INI, hari } from '@/data/clock';
import { QUOTATIONS } from '@/data/quotations';
import { PPN_PERSEN } from '@/data/settings';
import type { ID, ItemPenawaran, Quotation, StatusPenawaran } from '@/data/types';
import { bacaSimpanan, tulisSimpanan } from '@/lib/hooks';

const KUNCI_TIMPA = 'quotations.overrides';
const KUNCI_BARU = 'quotations.baru';

type TimpaQuotation = Partial<Omit<Quotation, 'id'>>;
type PetaTimpa = Record<ID, TimpaQuotation>;

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

function bacaQuotationBaru(): Quotation[] {
  const mentah = bacaSimpanan(KUNCI_BARU);
  if (!mentah) return [];
  try {
    const hasil = JSON.parse(mentah) as Quotation[];
    return Array.isArray(hasil) ? hasil : [];
  } catch {
    return [];
  }
}

export type InputQuotationBaru = Pick<
  Quotation,
  'dealId' | 'companyId' | 'contactId' | 'ownerId' | 'diskonPersen' | 'catatan'
> & { items: ItemPenawaran[] };

let penghitungIdBaru = 0;
let penghitungNomor = 0;

export function useQuotationStore() {
  const [timpa, setTimpa] = useState<PetaTimpa>({});
  const [quotationBaru, setQuotationBaru] = useState<Quotation[]>([]);
  const [siap, setSiap] = useState(false);

  useEffect(() => {
    setTimpa(bacaTimpa());
    setQuotationBaru(bacaQuotationBaru());
    setSiap(true);
  }, []);

  const simpanTimpa = useCallback((baru: PetaTimpa) => {
    setTimpa(baru);
    tulisSimpanan(KUNCI_TIMPA, JSON.stringify(baru));
  }, []);

  const simpanQuotationBaru = useCallback((baru: Quotation[]) => {
    setQuotationBaru(baru);
    tulisSimpanan(KUNCI_BARU, JSON.stringify(baru));
  }, []);

  const terapkanTimpa = useCallback(
    (q: Quotation): Quotation => {
      const t = timpa[q.id];
      return t ? { ...q, ...t } : q;
    },
    [timpa],
  );

  const quotations = useMemo<Quotation[]>(
    () => [...QUOTATIONS.map(terapkanTimpa), ...quotationBaru.map(terapkanTimpa)],
    [terapkanTimpa, quotationBaru],
  );

  const ubahStatus = useCallback(
    (id: ID, status: StatusPenawaran) => {
      if (QUOTATIONS.some((q) => q.id === id)) {
        simpanTimpa({ ...timpa, [id]: { ...timpa[id], status } });
      } else {
        simpanQuotationBaru(quotationBaru.map((q) => (q.id === id ? { ...q, status } : q)));
      }
    },
    [timpa, simpanTimpa, quotationBaru, simpanQuotationBaru],
  );

  const buatQuotation = useCallback(
    (input: InputQuotationBaru): ID => {
      penghitungIdBaru += 1;
      penghitungNomor += 1;
      const id = `pnw-baru-${Date.now().toString(36)}-${penghitungIdBaru}`;
      const nomor = `PNW-2026-BARU-${String(penghitungNomor).padStart(3, '0')}`;
      const quotation: Quotation = {
        id,
        nomor,
        dealId: input.dealId,
        companyId: input.companyId,
        contactId: input.contactId,
        ownerId: input.ownerId,
        tanggal: HARI_INI,
        berlakuHingga: hari(30),
        status: 'draft',
        diskonPersen: input.diskonPersen,
        pajakPersen: PPN_PERSEN,
        catatan: input.catatan,
        items: input.items,
      };
      simpanQuotationBaru([...quotationBaru, quotation]);
      return id;
    },
    [quotationBaru, simpanQuotationBaru],
  );

  const kembalikanDemo = useCallback(() => {
    simpanTimpa({});
    simpanQuotationBaru([]);
  }, [simpanTimpa, simpanQuotationBaru]);

  const jumlahPerubahan = Object.keys(timpa).length + quotationBaru.length;

  return { quotations, siap, ubahStatus, buatQuotation, kembalikanDemo, jumlahPerubahan };
}
