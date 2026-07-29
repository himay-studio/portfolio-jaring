'use client';

/* ==========================================================================
   Modal, laci, dan tooltip.

   KETIGANYA di-portal ke `document.body` lewat `<Portal>` (R53). Tidak ada
   satu pun dari komponen ini yang boleh dirender bersarang di dalam
   `<header>`, kartu, atau pembungkus apa pun yang memasang `backdrop-filter`,
   `filter`, atau `transform`, karena pembungkus semacam itu jadi containing
   block dan overlay-nya kolaps setinggi pembungkusnya.

   Saat tertutup, keduanya benar-benar dilepas dari DOM. Tidak ada lapisan
   tak terlihat yang tertinggal dan menangkap klik, dan tidak ada kotak yang
   diam diam menyumbang lebar ke `scrollWidth` (R57).
   ========================================================================== */

import { useEffect, useId, useRef, useState } from 'react';
import { Icon } from '@/components/Icon';
import { Portal } from '@/components/ui/Portal';
import {
  useEscape,
  useKunciGulir,
  usePerangkapFokus,
  type Disclosure,
} from '@/lib/hooks';

/* -------------------------------------------------------------------------
   Modal
   ------------------------------------------------------------------------- */

export function Modal({
  panel,
  judul,
  keterangan,
  children,
  footer,
  lebar = 'normal',
}: {
  panel: Disclosure;
  judul: string;
  keterangan?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  lebar?: 'normal' | 'wide';
}) {
  const id = useId();
  const refKotak = useRef<HTMLDivElement>(null);

  useEscape(panel.isOpen, panel.tutup);
  useKunciGulir(panel.terpasang);
  usePerangkapFokus(refKotak, panel.isOpen);

  if (!panel.terpasang) return null;
  const fase = panel.fase === 'closing' ? 'closing' : 'opening';

  return (
    <Portal>
      {/* Scrim dekoratif. Klik di scrim menutup, tapi scrim sendiri tidak
          pernah menutupi konten interaktif karena modal duduk di z-index
          lebih tinggi. */}
      <div className="scrim" data-phase={fase} onClick={panel.tutup} aria-hidden="true" />
      <div className="modal-wrap" role="presentation">
        <div
          ref={refKotak}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${id}-judul`}
          aria-describedby={keterangan ? `${id}-ket` : undefined}
          className="modal"
          data-width={lebar === 'wide' ? 'wide' : undefined}
          data-phase={fase}
          tabIndex={-1}
        >
          <div className="modal-head">
            <span className="titled">
              <span className="t-h2" id={`${id}-judul`}>
                {judul}
              </span>
              {keterangan && (
                <span className="t-sm muted" id={`${id}-ket`}>
                  {keterangan}
                </span>
              )}
            </span>
            <button type="button" className="icon-btn" onClick={panel.tutup} aria-label="Tutup">
              <Icon name="x" size={18} />
            </button>
          </div>

          <div className="modal-body">{children}</div>

          {footer && <div className="modal-foot">{footer}</div>}
        </div>
      </div>
    </Portal>
  );
}

/* -------------------------------------------------------------------------
   Laci samping. Dipakai panel detail (480px di desktop, layar penuh di
   bawah 768px) dan navigasi mobile.
   ------------------------------------------------------------------------- */

export function Drawer({
  panel,
  judul,
  judulNode,
  keterangan,
  children,
  footer,
  sisi = 'right',
  className,
  labelTutup = 'Tutup',
}: {
  panel: Disclosure;
  /** Selalu jadi nama yang dibacakan pembaca layar. */
  judul: string;
  /** Pengganti tampilan judul, misalnya lockup logo. `judul` tetap dipakai aria. */
  judulNode?: React.ReactNode;
  keterangan?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  sisi?: 'left' | 'right';
  className?: string;
  labelTutup?: string;
}) {
  const id = useId();
  const refKotak = useRef<HTMLDivElement>(null);

  useEscape(panel.isOpen, panel.tutup);
  useKunciGulir(panel.terpasang);
  usePerangkapFokus(refKotak, panel.isOpen);

  if (!panel.terpasang) return null;
  const fase = panel.fase === 'closing' ? 'closing' : 'opening';

  return (
    <Portal>
      <div className="scrim" data-phase={fase} onClick={panel.tutup} aria-hidden="true" />
      <div
        ref={refKotak}
        role="dialog"
        aria-modal="true"
        /* Sengaja aria-label dan bukan aria-labelledby: kalau `judulNode`
           dipakai (misalnya lockup logo yang aria-hidden), nama aksesibelnya
           akan kosong kalau mengacu ke elemen judul. */
        aria-label={judul}
        className={className ? `drawer-wrap ${className}` : 'drawer-wrap'}
        data-side={sisi}
        data-phase={fase}
        tabIndex={-1}
      >
        <div className="drawer-head">
          <span className="titled">
            <span className="t-h3" id={`${id}-judul`}>
              {judulNode ?? judul}
            </span>
            {keterangan && <span className="t-sm muted">{keterangan}</span>}
          </span>
          <button type="button" className="icon-btn" onClick={panel.tutup} aria-label={labelTutup}>
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="drawer-body">{children}</div>

        {footer && <div className="drawer-foot">{footer}</div>}
      </div>
    </Portal>
  );
}

/* -------------------------------------------------------------------------
   Tooltip. Dipakai sidebar saat tertutup jadi rail 64px, di mana label teks
   tidak muat tapi ikon tetap tidak boleh berdiri sendiri tanpa penjelas.

   Posisinya dihitung dari `getBoundingClientRect()` lalu dijepit ke dalam
   viewport, jadi tidak mungkin keluar jendela di lebar berapa pun (R19).
   ------------------------------------------------------------------------- */

export function Tooltip({
  teks,
  children,
  posisi = 'kanan',
}: {
  teks: string;
  children: React.ReactNode;
  posisi?: 'kanan' | 'bawah';
}) {
  const refPembungkus = useRef<HTMLSpanElement>(null);
  const [koordinat, setKoordinat] = useState<{ x: number; y: number } | null>(null);

  function tampilkan() {
    const el = refPembungkus.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = posisi === 'kanan' ? r.right + 8 : r.left;
    const y = posisi === 'kanan' ? r.top + r.height / 2 - 14 : r.bottom + 8;
    setKoordinat({
      x: Math.max(8, Math.min(x, window.innerWidth - 8)),
      y: Math.max(8, Math.min(y, window.innerHeight - 8)),
    });
  }

  const sembunyikan = () => setKoordinat(null);

  useEffect(() => {
    if (!koordinat) return;
    window.addEventListener('scroll', sembunyikan, true);
    window.addEventListener('resize', sembunyikan);
    return () => {
      window.removeEventListener('scroll', sembunyikan, true);
      window.removeEventListener('resize', sembunyikan);
    };
  }, [koordinat]);

  return (
    <>
      <span
        ref={refPembungkus}
        onMouseEnter={tampilkan}
        onMouseLeave={sembunyikan}
        onFocus={tampilkan}
        onBlur={sembunyikan}
        style={{ display: 'contents' }}
      >
        {children}
      </span>
      {koordinat && (
        <Portal>
          <span className="tip" role="tooltip" style={{ left: koordinat.x, top: koordinat.y }}>
            {teks}
          </span>
        </Portal>
      )}
    </>
  );
}
