'use client';

/* ==========================================================================
   Penyimpan perubahan aktivitas untuk demo. Pola yang sama dengan
   `dealStore.ts`: data dasar di `src/data/activities.ts` tidak ditulis
   ulang, timpaan dan aktivitas baru disimpan terpisah di localStorage.
   ========================================================================== */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ACTIVITIES } from '@/data/activities';
import { HARI_INI } from '@/data/clock';
import type { Activity, ID, JenisAktivitas, RelasiAktivitas } from '@/data/types';
import { bacaSimpanan, tulisSimpanan } from '@/lib/hooks';

const KUNCI_TIMPA = 'activities.overrides';
const KUNCI_BARU = 'activities.baru';

type TimpaAktivitas = Partial<Omit<Activity, 'id'>>;
type PetaTimpa = Record<ID, TimpaAktivitas>;

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

function bacaAktivitasBaru(): Activity[] {
  const mentah = bacaSimpanan(KUNCI_BARU);
  if (!mentah) return [];
  try {
    const hasil = JSON.parse(mentah) as Activity[];
    return Array.isArray(hasil) ? hasil : [];
  } catch {
    return [];
  }
}

export type InputAktivitasBaru = Pick<Activity, 'jenis' | 'judul' | 'catatan' | 'mulai' | 'durasiMenit' | 'ownerId'> & {
  relasi: RelasiAktivitas;
};

let penghitungIdBaru = 0;

export function useActivityStore() {
  const [timpa, setTimpa] = useState<PetaTimpa>({});
  const [aktivitasBaru, setAktivitasBaru] = useState<Activity[]>([]);
  const [siap, setSiap] = useState(false);

  useEffect(() => {
    setTimpa(bacaTimpa());
    setAktivitasBaru(bacaAktivitasBaru());
    setSiap(true);
  }, []);

  const simpanTimpa = useCallback((baru: PetaTimpa) => {
    setTimpa(baru);
    tulisSimpanan(KUNCI_TIMPA, JSON.stringify(baru));
  }, []);

  const simpanAktivitasBaru = useCallback((baru: Activity[]) => {
    setAktivitasBaru(baru);
    tulisSimpanan(KUNCI_BARU, JSON.stringify(baru));
  }, []);

  const terapkanTimpa = useCallback(
    (a: Activity): Activity => {
      const t = timpa[a.id];
      return t ? { ...a, ...t } : a;
    },
    [timpa],
  );

  const activities = useMemo<Activity[]>(
    () => [...ACTIVITIES.map(terapkanTimpa), ...aktivitasBaru.map(terapkanTimpa)],
    [terapkanTimpa, aktivitasBaru],
  );

  const tandaiSelesai = useCallback(
    (id: ID, selesai: boolean) => {
      if (ACTIVITIES.some((a) => a.id === id)) {
        simpanTimpa({ ...timpa, [id]: { ...timpa[id], selesai } });
      } else {
        simpanAktivitasBaru(aktivitasBaru.map((a) => (a.id === id ? { ...a, selesai } : a)));
      }
    },
    [timpa, simpanTimpa, aktivitasBaru, simpanAktivitasBaru],
  );

  const catatAktivitas = useCallback(
    (input: InputAktivitasBaru): ID => {
      penghitungIdBaru += 1;
      const id = `akt-baru-${Date.now().toString(36)}-${penghitungIdBaru}`;
      const aktivitas: Activity = { id, selesai: false, ...input };
      simpanAktivitasBaru([...aktivitasBaru, aktivitas]);
      return id;
    },
    [aktivitasBaru, simpanAktivitasBaru],
  );

  const kembalikanDemo = useCallback(() => {
    simpanTimpa({});
    simpanAktivitasBaru([]);
  }, [simpanTimpa, simpanAktivitasBaru]);

  const jumlahPerubahan = Object.keys(timpa).length + aktivitasBaru.length;

  return { activities, siap, tandaiSelesai, catatAktivitas, kembalikanDemo, jumlahPerubahan };
}

export type { JenisAktivitas };
