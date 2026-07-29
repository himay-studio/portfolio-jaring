import { notFound } from 'next/navigation';
import { QuotationDetail } from '@/components/penawaran/QuotationDetail';
import { QUOTATIONS } from '@/data/relations';

/* ==========================================================================
   Detail penawaran, ditampilkan menyerupai dokumen.

   Status (kirim, terima, tolak) bisa berubah di sesi pengunjung, jadi
   rendernya didelegasikan ke `QuotationDetail`, komponen klien yang membaca
   `useQuotationStore`. Berkas ini cuma memvalidasi id lewat
   `generateStaticParams`, yang harus tetap berjalan di Server Component.
   ========================================================================== */

export function generateStaticParams() {
  return QUOTATIONS.map((q) => ({ id: q.id }));
}

export default async function DetailPenawaran({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const q = QUOTATIONS.find((x) => x.id === id);
  if (!q) notFound();

  return <QuotationDetail quotationId={id} />;
}
