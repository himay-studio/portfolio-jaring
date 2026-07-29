import { notFound } from 'next/navigation';
import { DealDetail } from '@/components/deal/DealDetail';
import { DEALS } from '@/data/relations';

/* ==========================================================================
   Detail deal.

   Layar ini yang membuktikan model relasinya benar. Dari satu halaman harus
   terbaca: perusahaan mana, kontak siapa, penanggung jawab siapa, penawaran
   apa saja yang sudah dikirim, aktivitas apa yang sudah dan akan terjadi,
   dan DARI LEAD MANA deal ini berasal. Tahap, aktivitas, penawaran, dan
   catatan kolaboratif semua bisa berubah di sesi pengunjung, jadi rendernya
   didelegasikan ke `DealDetail`, komponen klien. Berkas ini cuma
   memvalidasi id lewat `generateStaticParams`.
   ========================================================================== */

export function generateStaticParams() {
  return DEALS.map((d) => ({ id: d.id }));
}

export default async function DetailDeal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = DEALS.find((d) => d.id === id);
  if (!deal) notFound();

  return <DealDetail dealId={id} />;
}
