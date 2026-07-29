'use client';

/* ==========================================================================
   Aksi status penawaran: kirim, terima, tolak, unduh PDF.

   "Unduh PDF" sengaja lewat cetak browser (`window.print()`) dengan
   stylesheet print di `pages.css`, bukan pustaka PDF di sisi klien. Ini
   static export tanpa backend, jadi jalur cetak browser yang paling jujur
   untuk demo: tidak ada dependensi baru, dan hasilnya selalu identik dengan
   yang terlihat di layar.
   ========================================================================== */

import { Icon } from '@/components/Icon';
import type { StatusPenawaran } from '@/data/types';

export function QuotationActions({
  status,
  onUbahStatus,
}: {
  status: StatusPenawaran;
  onUbahStatus: (status: StatusPenawaran) => void;
}) {
  return (
    <>
      {status === 'draft' && (
        <button type="button" className="btn btn-primary" onClick={() => onUbahStatus('terkirim')}>
          <Icon name="email" size={16} />
          Kirim penawaran
        </button>
      )}
      {status === 'terkirim' && (
        <>
          <button type="button" className="btn btn-primary" onClick={() => onUbahStatus('diterima')}>
            <Icon name="check" size={16} />
            Tandai diterima
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => onUbahStatus('ditolak')}>
            Tandai ditolak
          </button>
        </>
      )}
      <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
        <Icon name="unduh" size={16} />
        Unduh PDF
      </button>
    </>
  );
}
