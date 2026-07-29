/* ==========================================================================
   Penyambung relasi antar entitas.

   Ini lapisan yang membuat relasi CRM terbaca dari layar mana pun. Aturannya
   satu: layar TIDAK BOLEH menulis sendiri `DEALS.filter(d => d.companyId ===
   id)`. Semua penyambungan lewat berkas ini, supaya kalau bentuk relasi
   berubah, yang diubah cuma satu tempat.

   Semua fungsi murni dan sinkron. Tidak ada backend.
   ========================================================================== */

import { ACTIVITIES } from './activities';
import { COMPANIES } from './companies';
import { CONTACTS } from './contacts';
import { DEALS } from './deals';
import { LEADS } from './leads';
import { QUOTATIONS } from './quotations';
import { ALASAN_KALAH, SUMBER_LEAD, TAHAP } from './settings';
import { USERS } from './users';
import type {
  Activity,
  AlasanKalah,
  Company,
  Contact,
  Deal,
  ID,
  ItemPenawaran,
  Lead,
  Quotation,
  RelasiAktivitas,
  SumberLead,
  Tahap,
  TahapId,
  User,
} from './types';

/* -------------------------------------------------------------------------
   Indeks. Dibangun sekali saat modul dimuat.
   ------------------------------------------------------------------------- */

function indeks<T extends { id: string }>(rows: T[]): Map<string, T> {
  return new Map(rows.map((r) => [r.id, r]));
}

const IDX_USER = indeks(USERS);
const IDX_COMPANY = indeks(COMPANIES);
const IDX_CONTACT = indeks(CONTACTS);
const IDX_LEAD = indeks(LEADS);
const IDX_DEAL = indeks(DEALS);
const IDX_QUOTATION = indeks(QUOTATIONS);
const IDX_TAHAP = indeks(TAHAP);
const IDX_SUMBER = indeks(SUMBER_LEAD);
const IDX_ALASAN = indeks(ALASAN_KALAH);

/* -------------------------------------------------------------------------
   Pencarian satu record.
   ------------------------------------------------------------------------- */

export const getUser = (id?: ID): User | undefined => (id ? IDX_USER.get(id) : undefined);
export const getCompany = (id?: ID): Company | undefined => (id ? IDX_COMPANY.get(id) : undefined);
export const getContact = (id?: ID): Contact | undefined => (id ? IDX_CONTACT.get(id) : undefined);
export const getLead = (id?: ID): Lead | undefined => (id ? IDX_LEAD.get(id) : undefined);
export const getDeal = (id?: ID): Deal | undefined => (id ? IDX_DEAL.get(id) : undefined);
export const getQuotation = (id?: ID): Quotation | undefined =>
  id ? IDX_QUOTATION.get(id) : undefined;
export const getTahap = (id?: TahapId): Tahap | undefined => (id ? IDX_TAHAP.get(id) : undefined);
export const getSumber = (id?: string): SumberLead | undefined =>
  id ? IDX_SUMBER.get(id) : undefined;
export const getAlasanKalah = (id?: string): AlasanKalah | undefined =>
  id ? IDX_ALASAN.get(id) : undefined;

/** Nama yang aman dipakai di UI walau id-nya tidak ketemu. */
export const namaUser = (id?: ID) => getUser(id)?.nama ?? 'Tanpa penanggung jawab';
export const namaCompany = (id?: ID) => getCompany(id)?.nama ?? 'Tanpa perusahaan';
export const namaContact = (id?: ID) => getContact(id)?.nama ?? 'Tanpa kontak';
export const namaTahap = (id?: TahapId) => getTahap(id)?.nama ?? 'Tanpa tahap';
export const namaSumber = (id?: string) => getSumber(id)?.nama ?? 'Tidak diketahui';

/* -------------------------------------------------------------------------
   Relasi satu ke banyak.
   ------------------------------------------------------------------------- */

export const contactsByCompany = (companyId: ID): Contact[] =>
  CONTACTS.filter((c) => c.companyId === companyId);

export const dealsByCompany = (companyId: ID): Deal[] =>
  DEALS.filter((d) => d.companyId === companyId);

export const dealsByContact = (contactId: ID): Deal[] =>
  DEALS.filter((d) => d.contactId === contactId);

export const dealsByOwner = (ownerId: ID): Deal[] => DEALS.filter((d) => d.ownerId === ownerId);

export const dealsByTahap = (tahap: TahapId): Deal[] => DEALS.filter((d) => d.tahap === tahap);

export const leadsByOwner = (ownerId: ID): Lead[] => LEADS.filter((l) => l.ownerId === ownerId);

export const quotationsByDeal = (dealId: ID): Quotation[] =>
  QUOTATIONS.filter((q) => q.dealId === dealId);

export const quotationsByCompany = (companyId: ID): Quotation[] =>
  QUOTATIONS.filter((q) => q.companyId === companyId);

/**
 * Aktivitas milik sebuah entitas. Satu fungsi untuk semua jenis relasi,
 * jadi layar detail Deal, Kontak, Perusahaan, dan Lead memanggil yang sama.
 */
export function activitiesFor(rel: RelasiAktivitas): Activity[] {
  const kunci = Object.keys(rel) as (keyof RelasiAktivitas)[];
  if (kunci.length === 0) return [];
  return ACTIVITIES.filter((a) => kunci.some((k) => rel[k] !== undefined && a.relasi[k] === rel[k]));
}

/**
 * Aktivitas sebuah perusahaan, termasuk yang menempel ke deal dan kontak
 * milik perusahaan itu. Ini yang bikin linimasa perusahaan terasa lengkap
 * dan bukan cuma aktivitas yang kebetulan diberi `companyId`.
 */
export function activitiesForCompany(companyId: ID): Activity[] {
  const dealIds = new Set(dealsByCompany(companyId).map((d) => d.id));
  const contactIds = new Set(contactsByCompany(companyId).map((c) => c.id));
  return ACTIVITIES.filter(
    (a) =>
      a.relasi.companyId === companyId ||
      (a.relasi.dealId !== undefined && dealIds.has(a.relasi.dealId)) ||
      (a.relasi.contactId !== undefined && contactIds.has(a.relasi.contactId)),
  );
}

/* -------------------------------------------------------------------------
   Jejak konversi lead. Ini bagian yang paling gampang salah di CRM, jadi
   ditulis eksplisit dua arah.
   ------------------------------------------------------------------------- */

/** Dari Deal atau Kontak, tarik balik lead asalnya. */
export function asalLead(entitas: { asalLeadId?: ID }): Lead | undefined {
  return getLead(entitas.asalLeadId);
}

/** Dari Lead yang sudah dikonversi, tarik maju ke record hasilnya. */
export function hasilKonversi(lead: Lead): {
  contact?: Contact;
  company?: Company;
  deal?: Deal;
  tanggal?: string;
} {
  if (!lead.konversi) return {};
  return {
    contact: getContact(lead.konversi.contactId),
    company: getCompany(lead.konversi.companyId),
    deal: getDeal(lead.konversi.dealId),
    tanggal: lead.konversi.tanggal,
  };
}

/** Semua deal yang lahir dari sebuah lead. */
export const dealsFromLead = (leadId: ID): Deal[] => DEALS.filter((d) => d.asalLeadId === leadId);

/** Semua kontak yang lahir dari sebuah lead. */
export const contactsFromLead = (leadId: ID): Contact[] =>
  CONTACTS.filter((c) => c.asalLeadId === leadId);

/* -------------------------------------------------------------------------
   Hitungan penawaran. Satu sumber kebenaran supaya angka di daftar penawaran
   dan di halaman detail tidak pernah berbeda.
   ------------------------------------------------------------------------- */

export interface RincianPenawaran {
  subtotal: number;
  diskon: number;
  dasarPajak: number;
  pajak: number;
  total: number;
}

export function hitungItem(item: ItemPenawaran): number {
  return item.qty * item.hargaSatuan;
}

export function hitungPenawaran(q: Quotation): RincianPenawaran {
  const subtotal = q.items.reduce((s, i) => s + hitungItem(i), 0);
  const diskon = Math.round((subtotal * q.diskonPersen) / 100);
  const dasarPajak = subtotal - diskon;
  const pajak = Math.round((dasarPajak * q.pajakPersen) / 100);
  return { subtotal, diskon, dasarPajak, pajak, total: dasarPajak + pajak };
}

/* -------------------------------------------------------------------------
   Ekspor ulang kumpulan mentah, supaya layar cukup mengimpor dari sini.
   ------------------------------------------------------------------------- */

export { ACTIVITIES, COMPANIES, CONTACTS, DEALS, LEADS, QUOTATIONS, USERS };
