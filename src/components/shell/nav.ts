/* ==========================================================================
   Struktur navigasi sidebar.

   Sembilan modul, lebih dari tujuh, jadi dikelompokkan dengan label seksi
   sesuai standar aplikasi Himay Studio bagian 1. Ikon per modul dikunci di
   ART-DIRECTION.md bagian 3 supaya konsisten lintas stage.

   Semua href memakai trailing slash karena `next.config.mjs` memasang
   `trailingSlash: true`. Tanpa itu, `usePathname()` akan mengembalikan
   `/app/leads/` sementara href-nya `/app/leads`, dan penanda menu aktif tidak
   akan pernah cocok.
   ========================================================================== */

import type { NamaIkon } from '@/components/Icon';

export interface ItemNav {
  href: string;
  label: string;
  icon: NamaIkon;
  /** Cocokkan persis, bukan berdasarkan awalan. Dipakai rute akar aplikasi. */
  persis?: boolean;
}

export interface GrupNav {
  label: string;
  item: ItemNav[];
}

export const NAV: GrupNav[] = [
  {
    label: 'Utama',
    item: [{ href: '/app/', label: 'Dashboard', icon: 'dashboard', persis: true }],
  },
  {
    label: 'Penjualan',
    item: [
      { href: '/app/leads/', label: 'Leads', icon: 'leads' },
      { href: '/app/deals/', label: 'Deals', icon: 'deals' },
      { href: '/app/penawaran/', label: 'Penawaran', icon: 'penawaran' },
    ],
  },
  {
    label: 'Relasi',
    item: [
      { href: '/app/kontak/', label: 'Kontak', icon: 'kontak' },
      { href: '/app/perusahaan/', label: 'Perusahaan', icon: 'perusahaan' },
    ],
  },
  {
    label: 'Kerja',
    item: [{ href: '/app/aktivitas/', label: 'Aktivitas', icon: 'aktivitas' }],
  },
  {
    label: 'Analisis',
    item: [{ href: '/app/laporan/', label: 'Laporan', icon: 'laporan' }],
  },
  {
    label: 'Sistem',
    item: [{ href: '/app/pengaturan/', label: 'Pengaturan', icon: 'pengaturan' }],
  },
];

/** Semua item dalam satu daftar datar, dipakai judul topbar dan pengecekan rute. */
export const NAV_DATAR: ItemNav[] = NAV.flatMap((g) => g.item);

export function itemAktif(pathname: string): ItemNav | undefined {
  /* Yang paling spesifik menang, supaya /app/deals/dea-01/ tetap menyorot
     Deals dan bukan Dashboard. */
  const cocok = NAV_DATAR.filter((i) =>
    i.persis ? pathname === i.href : pathname.startsWith(i.href),
  );
  return cocok.sort((a, b) => b.href.length - a.href.length)[0];
}
