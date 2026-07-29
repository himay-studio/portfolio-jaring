'use client';

/* ==========================================================================
   Portal ke document.body.

   Ini pemenuhan R53 dalam bentuk komponen. Setiap overlay full viewport
   (modal, laci, lightbox, tooltip) WAJIB lewat sini.

   Alasannya bukan soal rapi rapi kode. Elemen yang memasang `backdrop-filter`,
   `filter`, `transform`, `perspective`, `contain: paint`, atau `will-change`
   pada properti itu menjadi containing block untuk SETIAP keturunannya yang
   `position: fixed`. Anak `fixed`-nya berhenti mengacu ke viewport dan
   terpotong sebesar kotak ancestor itu. Laci yang seharusnya setinggi layar
   kolaps jadi setinggi header, lengkap dengan logo kedua yang muncul di
   tengah topbar. CSS-nya terbaca benar di kedua kasus, jadi membaca
   stylesheet tidak akan pernah bisa membedakannya. Yang membedakan cuma
   di mana elemen itu dirender.
   ========================================================================== */

import { createPortal } from 'react-dom';
import { useSudahMount } from '@/lib/hooks';

export function Portal({ children }: { children: React.ReactNode }) {
  const siap = useSudahMount();
  if (!siap) return null;
  return createPortal(children, document.body);
}
