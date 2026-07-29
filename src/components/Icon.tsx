/* ==========================================================================
   Satu set ikon garis, satu keluarga, tanpa campuran.

   ART-DIRECTION.md bagian 3 mengunci bentuknya: tebal garis 1.5px, ujung dan
   sambungan SIKU (`butt` dan `miter`), tidak ada satu pun sudut membulat,
   supaya sejalan dengan R10.

   Ikon tidak pernah berdiri sendiri sebagai satu-satunya penjelas aksi.
   Selalu ada label teks di sebelahnya, atau `aria-label` plus tooltip.
   ========================================================================== */

import type { SVGProps } from 'react';

export type NamaIkon =
  | 'dashboard'
  | 'leads'
  | 'kontak'
  | 'perusahaan'
  | 'deals'
  | 'aktivitas'
  | 'penawaran'
  | 'laporan'
  | 'pengaturan'
  | 'chevron-down'
  | 'chevron-up'
  | 'chevron-left'
  | 'chevron-right'
  | 'panel-left'
  | 'menu'
  | 'search'
  | 'plus'
  | 'x'
  | 'check'
  | 'filter'
  | 'sort'
  | 'arrow-up'
  | 'arrow-down'
  | 'arrow-right'
  | 'telepon'
  | 'email'
  | 'meeting'
  | 'tugas'
  | 'kalender'
  | 'jam'
  | 'target'
  | 'peringatan'
  | 'tabel'
  | 'kartu'
  | 'daftar'
  | 'papan'
  | 'tim'
  | 'tautan'
  | 'keluar'
  | 'kotak-kosong'
  | 'unduh'
  | 'titik-tiga';

const JALUR: Record<NamaIkon, React.ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </>
  ),
  /* Magnet, sesuai kunci ikon di ART-DIRECTION bagian 3 */
  leads: (
    <>
      <path d="M5 4v8a7 7 0 0 0 14 0V4h-4v8a3 3 0 0 1-6 0V4z" />
      <path d="M5 8h4" />
      <path d="M15 8h4" />
    </>
  ),
  kontak: (
    <>
      <path d="M4 21v-2a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v2" />
      <path d="M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
    </>
  ),
  perusahaan: (
    <>
      <path d="M3 21h18" />
      <path d="M5 21V4h9v17" />
      <path d="M14 9h5v12" />
      <path d="M8 8h3" />
      <path d="M8 12h3" />
      <path d="M8 16h3" />
    </>
  ),
  deals: (
    <>
      <rect x="3" y="4" width="5" height="16" />
      <rect x="10" y="4" width="5" height="11" />
      <rect x="17" y="4" width="4" height="7" />
    </>
  ),
  aktivitas: (
    <>
      <path d="M21 11V5H3v16h9" />
      <path d="M3 9h18" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <path d="M17 13v4l3 2" />
      <path d="M17 21a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z" />
    </>
  ),
  penawaran: (
    <>
      <path d="M14 3H5v18h14V8z" />
      <path d="M14 3v5h5" />
      <path d="M8 12h8" />
      <path d="M8 16h8" />
    </>
  ),
  laporan: (
    <>
      <path d="M3 3v18h18" />
      <rect x="7" y="11" width="3" height="6" />
      <rect x="12" y="7" width="3" height="10" />
      <rect x="17" y="13" width="3" height="4" />
    </>
  ),
  pengaturan: (
    <>
      <path d="M3 7h10" />
      <path d="M17 7h4" />
      <path d="M3 17h4" />
      <path d="M11 17h10" />
      <rect x="13" y="4" width="4" height="6" />
      <rect x="7" y="14" width="4" height="6" />
    </>
  ),
  'chevron-down': <path d="m5 8 7 7 7-7" />,
  'chevron-up': <path d="m5 16 7-7 7 7" />,
  'chevron-left': <path d="m15 5-7 7 7 7" />,
  'chevron-right': <path d="m9 5 7 7-7 7" />,
  'panel-left': (
    <>
      <rect x="3" y="4" width="18" height="16" />
      <path d="M9 4v16" />
    </>
  ),
  menu: (
    <>
      <path d="M3 6h18" />
      <path d="M3 12h18" />
      <path d="M3 18h18" />
    </>
  ),
  search: (
    <>
      <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z" />
      <path d="m16 16 5 5" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  x: (
    <>
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </>
  ),
  check: <path d="m4 12 5 5L20 6" />,
  filter: <path d="M3 5h18l-7 8v6l-4 2v-8z" />,
  sort: (
    <>
      <path d="M7 4v16" />
      <path d="m3 8 4-4 4 4" />
      <path d="M17 20V4" />
      <path d="m13 16 4 4 4-4" />
    </>
  ),
  'arrow-up': (
    <>
      <path d="M12 20V4" />
      <path d="m5 11 7-7 7 7" />
    </>
  ),
  'arrow-down': (
    <>
      <path d="M12 4v16" />
      <path d="m5 13 7 7 7-7" />
    </>
  ),
  'arrow-right': (
    <>
      <path d="M4 12h16" />
      <path d="m13 5 7 7-7 7" />
    </>
  ),
  telepon: <path d="M5 3h4l2 5-2.5 1.5a12 12 0 0 0 6 6L16 13l5 2v4h-2A16 16 0 0 1 3 5V3z" />,
  email: (
    <>
      <rect x="3" y="5" width="18" height="14" />
      <path d="m3 6 9 7 9-7" />
    </>
  ),
  meeting: (
    <>
      <path d="M3 20v-1a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v1" />
      <path d="M8 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
      <path d="M15 20v-1a4 4 0 0 1 3-3.9" />
      <path d="M17 12a3 3 0 1 0 0-6" />
    </>
  ),
  tugas: (
    <>
      <rect x="4" y="4" width="16" height="16" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  kalender: (
    <>
      <rect x="3" y="5" width="18" height="16" />
      <path d="M3 9h18" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
    </>
  ),
  jam: (
    <>
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  target: (
    <>
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />
      <path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" />
      <path d="M12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
    </>
  ),
  peringatan: (
    <>
      <path d="M12 3 2 20h20z" />
      <path d="M12 9v5" />
      <path d="M12 17h.01" />
    </>
  ),
  tabel: (
    <>
      <rect x="3" y="4" width="18" height="16" />
      <path d="M3 9h18" />
      <path d="M3 14.5h18" />
      <path d="M9 9v11" />
    </>
  ),
  kartu: (
    <>
      <rect x="3" y="4" width="8" height="7" />
      <rect x="13" y="4" width="8" height="7" />
      <rect x="3" y="13" width="8" height="7" />
      <rect x="13" y="13" width="8" height="7" />
    </>
  ),
  daftar: (
    <>
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h2" />
      <path d="M3 12h2" />
      <path d="M3 18h2" />
    </>
  ),
  papan: (
    <>
      <rect x="3" y="4" width="5" height="16" />
      <rect x="9.5" y="4" width="5" height="16" />
      <rect x="16" y="4" width="5" height="16" />
    </>
  ),
  tim: (
    <>
      <path d="M2 20v-1a4 4 0 0 1 4-4h3a4 4 0 0 1 4 4v1" />
      <path d="M7.5 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
      <path d="M15 20v-1a4 4 0 0 0-1.5-3.1" />
      <path d="M16 5.2a3.5 3.5 0 0 1 0 6.6" />
      <path d="M22 20v-1a4 4 0 0 0-3-3.9" />
    </>
  ),
  tautan: (
    <>
      <path d="M10 13a4 4 0 0 0 6 .5l3-3a4 4 0 0 0-5.7-5.7L11.5 6.6" />
      <path d="M14 11a4 4 0 0 0-6-.5l-3 3a4 4 0 0 0 5.7 5.7l1.8-1.8" />
    </>
  ),
  keluar: (
    <>
      <path d="M10 4H4v16h6" />
      <path d="M15 8l4 4-4 4" />
      <path d="M19 12H9" />
    </>
  ),
  'kotak-kosong': (
    <>
      <rect x="3" y="7" width="18" height="13" />
      <path d="M3 12h5l1.5 3h5L16 12h5" />
      <path d="m6 7 2-4h8l2 4" />
    </>
  ),
  unduh: (
    <>
      <path d="M12 3v12" />
      <path d="m7 11 5 5 5-5" />
      <path d="M4 20h16" />
    </>
  ),
  'titik-tiga': (
    <>
      <path d="M5 12h.01" />
      <path d="M12 12h.01" />
      <path d="M19 12h.01" />
    </>
  ),
};

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: NamaIkon;
  size?: number;
  /** Isi kalau ikon berdiri sendiri tanpa label teks di sebelahnya. */
  label?: string;
}

export function Icon({ name, size = 20, label, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      focusable="false"
      {...rest}
    >
      {JALUR[name]}
    </svg>
  );
}
