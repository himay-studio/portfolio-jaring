'use client';

/* ==========================================================================
   Kontak dan perusahaan yang lahir dari konversi lead di demo ini.

   Sama seperti `dealStore.ts`, ini lapisan TAMBAHAN di localStorage, bukan
   penulisan ulang data dasar. Company dan Contact hasil konversi tidak punya
   halaman detail statis (rute dibuat dari `generateStaticParams` saat build,
   sebelum id klien manapun ada), jadi Kontak dan Perusahaan hanya menampilkan
   recordnya di daftar dan kartu ringkas, bukan mengarahkan ke `/app/kontak/{id}`
   atau `/app/perusahaan/{id}` yang tidak pernah ada. `isIdBaru` dipakai
   layar mana pun yang perlu tahu apakah sebuah id aman di-Link atau tidak.
   ========================================================================== */

import { useEffect, useState } from 'react';
import type { Company, Contact } from '@/data/types';
import { bacaSimpanan, tulisSimpanan } from '@/lib/hooks';

const KUNCI_CONTACT = 'contacts.baru';
const KUNCI_COMPANY = 'companies.baru';

export const isIdBaru = (id: string) => id.includes('-baru-');

function bacaArray<T>(kunci: string): T[] {
  const mentah = bacaSimpanan(kunci);
  if (!mentah) return [];
  try {
    const hasil = JSON.parse(mentah) as T[];
    return Array.isArray(hasil) ? hasil : [];
  } catch {
    return [];
  }
}

export function bacaContactBaru(): Contact[] {
  return bacaArray<Contact>(KUNCI_CONTACT);
}

export function bacaCompanyBaru(): Company[] {
  return bacaArray<Company>(KUNCI_COMPANY);
}

export function tambahContactBaru(c: Contact): void {
  tulisSimpanan(KUNCI_CONTACT, JSON.stringify([...bacaContactBaru(), c]));
}

export function tambahCompanyBaru(c: Company): void {
  tulisSimpanan(KUNCI_COMPANY, JSON.stringify([...bacaCompanyBaru(), c]));
}

export function kembalikanCrmExtras(): void {
  tulisSimpanan(KUNCI_CONTACT, '[]');
  tulisSimpanan(KUNCI_COMPANY, '[]');
}

/**
 * Kontak dan perusahaan tambahan dari localStorage, dibaca setelah mount
 * supaya render pertama tetap identik dengan HTML hasil build (nol
 * hydration mismatch, pola yang sama dengan `useSimpanan`).
 */
export function useCrmExtras() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    setContacts(bacaContactBaru());
    setCompanies(bacaCompanyBaru());
  }, []);

  return { contactsBaru: contacts, companiesBaru: companies };
}
