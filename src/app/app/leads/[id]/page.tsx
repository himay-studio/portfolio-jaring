import { notFound } from 'next/navigation';
import { LeadDetail } from '@/components/lead/LeadDetail';
import { LEADS } from '@/data/relations';

/* ==========================================================================
   Detail lead.

   Bagian terpenting halaman ini adalah blok konversi: kalau lead sudah
   dikonversi, halaman ini menunjukkan KE MANA dia berubah, kontak apa,
   perusahaan apa, dan deal apa. Karena status, konversi, dan aktivitas semua
   bisa berubah di sesi pengunjung (localStorage), rendernya didelegasikan ke
   `LeadDetail`, komponen klien yang membaca `useLeadStore`. Berkas ini cuma
   memvalidasi id lewat `generateStaticParams`, yang HARUS tetap berjalan di
   Server Component, tidak bisa ikut dipindah ke `LeadDetail`.
   ========================================================================== */

export function generateStaticParams() {
  return LEADS.map((l) => ({ id: l.id }));
}

export default async function DetailLead({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = LEADS.find((l) => l.id === id);
  if (!lead) notFound();

  return <LeadDetail leadId={id} />;
}
