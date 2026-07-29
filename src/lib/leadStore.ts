'use client';

/* ==========================================================================
   Penyimpan perubahan lead untuk demo, plus alur konversi.

   Sama seperti `dealStore.ts`: data dasar di `src/data/leads.ts` tidak
   pernah ditulis ulang, perubahan disimpan sebagai lapisan timpa di
   localStorage. Konversi lead adalah kasus khusus karena dia menulis TIGA
   entitas sekaligus (Contact, Company, Deal) lalu menyambungkan keduanya
   dua arah: `Lead.konversi` menunjuk maju, `Contact.asalLeadId` dan
   `Deal.asalLeadId` menunjuk balik, persis kontrak yang ditetapkan Stage 3
   di `src/data/types.ts`.
   ========================================================================== */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { HARI_INI } from '@/data/clock';
import { LEADS } from '@/data/leads';
import type { ID, Lead, LeadStatus } from '@/data/types';
import { buatDealBaruLangsung, type InputDealBaru } from '@/lib/dealStore';
import { tambahCompanyBaru, tambahContactBaru } from '@/lib/crmExtras';
import { bacaSimpanan, tulisSimpanan } from '@/lib/hooks';

const KUNCI_TIMPA = 'leads.overrides';

type TimpaLead = Partial<Omit<Lead, 'id'>>;
type PetaTimpa = Record<ID, TimpaLead>;

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

let penghitungIdBaru = 0;

export interface InputKonversi {
  /** Kalau diisi, kontak baru menempel ke perusahaan yang SUDAH ada. */
  companyIdTerpilih?: ID;
  /** Dipakai kalau `companyIdTerpilih` kosong, membuat perusahaan baru. */
  perusahaanBaru?: { industri: string; kota: string; provinsi: string };
  dealNama: string;
  dealNilai: number;
  dealTahap: InputDealBaru['tahap'];
  dealPerkiraanTutup: string;
}

export function useLeadStore() {
  const [timpa, setTimpa] = useState<PetaTimpa>({});
  const [siap, setSiap] = useState(false);

  useEffect(() => {
    setTimpa(bacaTimpa());
    setSiap(true);
  }, []);

  const simpan = useCallback((baru: PetaTimpa) => {
    setTimpa(baru);
    tulisSimpanan(KUNCI_TIMPA, JSON.stringify(baru));
  }, []);

  const leads = useMemo<Lead[]>(
    () =>
      LEADS.map((l) => {
        const t = timpa[l.id];
        return t ? { ...l, ...t } : l;
      }),
    [timpa],
  );

  const ubahLead = useCallback(
    (leadId: ID, patch: TimpaLead) => {
      simpan({ ...timpa, [leadId]: { ...timpa[leadId], ...patch } });
    },
    [timpa, simpan],
  );

  const tandaiDihubungiMassal = useCallback(
    (leadIds: ID[]) => {
      const baru: PetaTimpa = { ...timpa };
      for (const id of leadIds) {
        baru[id] = { ...baru[id], kontakTerakhir: HARI_INI, status: baru[id]?.status ?? statusSetelahDihubungi(id) };
      }
      simpan(baru);
    },
    [timpa, simpan],
  );

  const ubahOwnerMassal = useCallback(
    (leadIds: ID[], ownerId: ID) => {
      const baru: PetaTimpa = { ...timpa };
      for (const id of leadIds) baru[id] = { ...baru[id], ownerId };
      simpan(baru);
    },
    [timpa, simpan],
  );

  /**
   * Konversi satu lead jadi Contact, Company (baru atau yang sudah ada),
   * dan Deal, lalu menulis jejak dua arah. Mengembalikan id ketiganya.
   */
  const konversiLead = useCallback(
    (lead: Lead, input: InputKonversi) => {
      penghitungIdBaru += 1;
      const cap = Date.now().toString(36) + penghitungIdBaru;

      let companyId = input.companyIdTerpilih;
      if (!companyId) {
        companyId = `com-baru-${cap}`;
        tambahCompanyBaru({
          id: companyId,
          nama: lead.perusahaanNama,
          industri: input.perusahaanBaru?.industri ?? 'Lainnya',
          kota: input.perusahaanBaru?.kota ?? '',
          provinsi: input.perusahaanBaru?.provinsi ?? '',
          ukuran: 'kecil',
          jumlahKaryawan: 0,
          situs: '',
          telepon: lead.telepon,
          alamat: '',
          ownerId: lead.ownerId,
          dibuatPada: HARI_INI,
          catatan: `Dibuat otomatis dari konversi lead ${lead.nama}.`,
        });
      }

      const contactId = `kon-baru-${cap}`;
      tambahContactBaru({
        id: contactId,
        nama: lead.nama,
        inisial: lead.inisial,
        jabatan: lead.jabatan,
        email: lead.email,
        telepon: lead.telepon,
        whatsapp: lead.telepon,
        companyId,
        ownerId: lead.ownerId,
        sumber: lead.sumber,
        dibuatPada: HARI_INI,
        catatan: `Dikonversi dari lead pada ${HARI_INI}.`,
        asalLeadId: lead.id,
      });

      const dealId = buatDealBaruLangsung({
        nama: input.dealNama,
        companyId,
        contactId,
        ownerId: lead.ownerId,
        nilai: input.dealNilai,
        tahap: input.dealTahap,
        perkiraanTutup: input.dealPerkiraanTutup,
        sumber: lead.sumber,
        catatan: `Deal awal hasil konversi lead ${lead.nama}.`,
      });
      // asalLeadId ditambahkan lewat patch terpisah karena InputDealBaru tidak
      // membawanya (deal tambah manual dari modal Deals tidak punya lead asal).
      tandaiAsalLeadPadaDealBaru(dealId, lead.id);

      ubahLead(lead.id, {
        status: 'dikonversi' as LeadStatus,
        kontakTerakhir: HARI_INI,
        konversi: { tanggal: HARI_INI, contactId, companyId, dealId },
      });

      return { contactId, companyId, dealId };
    },
    [ubahLead],
  );

  const kembalikanDemo = useCallback(() => simpan({}), [simpan]);

  const jumlahPerubahan = Object.keys(timpa).length;

  return { leads, siap, ubahLead, tandaiDihubungiMassal, ubahOwnerMassal, konversiLead, kembalikanDemo, jumlahPerubahan };
}

function statusSetelahDihubungi(leadId: ID): LeadStatus {
  const dasar = LEADS.find((l) => l.id === leadId);
  if (!dasar) return 'dihubungi';
  return dasar.status === 'baru' ? 'dihubungi' : dasar.status;
}

/**
 * `dealStore.ts` tidak mengekspor penimpa field tunggal untuk dipakai di luar
 * hook-nya (`ubahDeal` ada di dalam `useDealStore`). `asalLeadId` cuma perlu
 * ditulis sekali saat deal itu baru saja dibuat lewat `buatDealBaruLangsung`,
 * jadi di sini cukup baca-ubah-tulis `deals.baru` langsung, sama seperti
 * `buatDealBaruLangsung` sendiri melakukannya.
 */
function tandaiAsalLeadPadaDealBaru(dealId: ID, leadId: ID) {
  const kunci = 'deals.baru';
  const mentah = bacaSimpanan(kunci);
  if (!mentah) return;
  try {
    const daftar = JSON.parse(mentah) as Array<{ id: ID; asalLeadId?: ID }>;
    const berikutnya = daftar.map((d) => (d.id === dealId ? { ...d, asalLeadId: leadId } : d));
    tulisSimpanan(kunci, JSON.stringify(berikutnya));
  } catch {
    /* Data rusak, biarkan tanpa asalLeadId daripada melempar error di alur konversi. */
  }
}
