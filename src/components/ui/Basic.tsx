/* ==========================================================================
   Primitif kecil yang dipakai di hampir setiap layar.

   Semuanya tanpa hook, jadi aman dipakai di server component maupun client
   component.
   ========================================================================== */

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon, type NamaIkon } from '@/components/Icon';
import type { Tone } from '@/data/types';
import { hue as hitungHue, inisial as hitungInisial } from '@/lib/format';

/* -------------------------------------------------------------------------
   Badge. Selalu pasangan soft dan ink dari DESIGN.md 3.3, tidak pernah
   bulatan warna tanpa teks.
   ------------------------------------------------------------------------- */

export function Badge({
  children,
  tone = 'neutral',
  solid = false,
  icon,
}: {
  children: ReactNode;
  tone?: Tone;
  solid?: boolean;
  icon?: NamaIkon;
}) {
  return (
    <span className={solid ? 'badge badge-solid' : 'badge'} data-tone={tone}>
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------
   Avatar. Inisial di atas blok warna, PERSEGI bukan lingkaran (DESIGN.md 5.1).
   Bukan foto: alasannya ada di MEDIA.md, dan ini memang pola yang dipakai
   Linear, Jira, dan Notion.
   ------------------------------------------------------------------------- */

export function Avatar({
  nama,
  kunci,
  inisial,
  size = 'md',
}: {
  nama: string;
  /** Penentu warna. Pakai id entitas supaya orang yang sama selalu satu warna. */
  kunci?: string;
  inisial?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  return (
    <span
      className="avatar"
      data-size={size === 'md' ? undefined : size}
      data-hue={hitungHue(kunci ?? nama)}
      aria-hidden="true"
    >
      {inisial ?? hitungInisial(nama)}
    </span>
  );
}

/* -------------------------------------------------------------------------
   Kartu KPI. Batang tepi kiri berwarna arti, label di atas, angka tabular di
   bawahnya, lalu perbandingan periode dengan panah PLUS teks (ART-DIRECTION 7).
   ------------------------------------------------------------------------- */

export function StatCard({
  label,
  nilai,
  satuan,
  tone = 'brand',
  delta,
  keterangan,
}: {
  label: string;
  nilai: string;
  satuan?: string;
  tone?: Tone;
  delta?: { arah: 'up' | 'down' | 'flat'; teks: string };
  keterangan?: string;
}) {
  return (
    <div className="kpi" data-tone={tone === 'brand' ? undefined : tone}>
      {/* R50: setiap baris elemen blok terpisah, tidak ada dua teks inline
          yang menempel jadi satu kata. */}
      <span className="kpi-label t-label">{label}</span>
      <span className="kpi-value t-metric">
        {nilai}
        {satuan && <span className="t-sm muted"> {satuan}</span>}
      </span>
      {delta && (
        <span className="kpi-delta t-xs" data-dir={delta.arah}>
          {delta.arah !== 'flat' && (
            <Icon name={delta.arah === 'up' ? 'arrow-up' : 'arrow-down'} size={12} />
          )}
          {delta.teks}
        </span>
      )}
      {keterangan && <span className="t-xs muted">{keterangan}</span>}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Bar progres
   ------------------------------------------------------------------------- */

export function Bar({
  persen,
  tone = 'brand',
  label,
}: {
  persen: number;
  tone?: Tone;
  label?: string;
}) {
  const lebar = Math.max(0, Math.min(100, persen));
  return (
    <div
      className="bar"
      role="progressbar"
      aria-valuenow={Math.round(lebar)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className="bar-fill"
        data-tone={tone === 'brand' ? undefined : tone}
        style={{ width: `${lebar}%` }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------
   Penanda relasi antar entitas. Inti CRM: dari layar mana pun, relasi Lead,
   Kontak, Perusahaan, dan Deal harus terbaca dan bisa diklik.
   ------------------------------------------------------------------------- */

export type JenisRelasi = 'lead' | 'kontak' | 'perusahaan' | 'deal' | 'penawaran';

const IKON_RELASI: Record<JenisRelasi, NamaIkon> = {
  lead: 'leads',
  kontak: 'kontak',
  perusahaan: 'perusahaan',
  deal: 'deals',
  penawaran: 'penawaran',
};

export function RelChip({
  jenis,
  label,
  href,
}: {
  jenis: JenisRelasi;
  label: string;
  href?: string;
}) {
  const isi = (
    <>
      <Icon name={IKON_RELASI[jenis]} size={13} />
      <span className="truncate">{label}</span>
    </>
  );
  if (!href) {
    return (
      <span className="relchip" data-kind={jenis}>
        {isi}
      </span>
    );
  }
  return (
    <Link href={href} className="relchip" data-kind={jenis}>
      {isi}
    </Link>
  );
}

/* -------------------------------------------------------------------------
   Keadaan kosong. Bentuk geometris SVG yang ditulis sendiri, sudut siku
   sesuai R10, tanpa ilustrasi hasil generate (ART-DIRECTION 7).
   Tabel kosong tanpa apa-apa itu bug, bukan desain.
   ------------------------------------------------------------------------- */

function ArtKosong() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true" className="empty-art">
      <rect x="4" y="4" width="56" height="56" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 20h56M4 36h56M4 52h56M20 4v56M36 4v56M52 4v56" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <rect x="36" y="36" width="16" height="16" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

export function EmptyState({
  judul,
  keterangan,
  aksi,
}: {
  judul: string;
  keterangan: string;
  aksi?: ReactNode;
}) {
  return (
    <div className="empty">
      <ArtKosong />
      {/* Judul dan keterangan adalah elemen blok terpisah (R50) */}
      <p className="t-h3">{judul}</p>
      <p className="empty-text t-sm">{keterangan}</p>
      {aksi}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Skeleton. Bukan spinner penuh layar yang bikin layout melompat.
   ------------------------------------------------------------------------- */

export function Skeleton({
  tinggi = 16,
  lebar = '100%',
}: {
  tinggi?: number | string;
  lebar?: number | string;
}) {
  return <div className="skel" style={{ height: tinggi, width: lebar }} aria-hidden="true" />;
}

export function SkeletonTabel({ baris = 6 }: { baris?: number }) {
  return (
    <div className="stack gap-8" style={{ padding: 12 }} aria-busy="true" aria-live="polite">
      <span className="sr-only">Memuat data</span>
      {Array.from({ length: baris }, (_, i) => (
        <Skeleton key={i} tinggi={i === 0 ? 24 : 20} lebar={i === 0 ? '40%' : '100%'} />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Placeholder beranotasi Stage 3.

   Ini penanda kerja yang SENGAJA ditinggalkan untuk Stage 5, bukan komponen
   produksi. Bentuknya dibuat mencolok (garis putus putus) supaya tidak
   mungkin lolos ke deploy tanpa disadari, dan isinya menyebut persis apa yang
   harus dikerjakan Stage 5 di titik itu.
   ------------------------------------------------------------------------- */

/**
 * Nama berkas dan pengenal camelCase di dalam prosa dirender sebagai `<code>`.
 *
 * Bukan sekadar kosmetik. Sweep R50 mencari huruf kecil yang langsung menempel
 * ke huruf besar dalam satu baris ter-render, dan `useDealStore` atau
 * `LineChart` persis berbentuk begitu. Membungkusnya sebagai kode membuat
 * keduanya terbaca sebagai apa adanya, dan sweep-nya boleh tetap ketat tanpa
 * perlu daftar pengecualian yang panjang dan gampang basi.
 */
function tandaiKode(teks: string): ReactNode[] {
  return teks.split(/(\s+)/).map((token, i) => {
    const bersih = token.replace(/[.,]$/, '');
    const akhiran = token.slice(bersih.length);
    const kodeMirip =
      /^[a-z][A-Za-z0-9]*[A-Z][A-Za-z0-9]*$/.test(bersih) || // camelCase
      /^[A-Za-z0-9_/.-]+\.(tsx?|mjs|css|md|json)$/.test(bersih) || // nama berkas
      /^[a-z]+\/[A-Za-z0-9/_-]+$/.test(bersih); // penggalan path
    if (!kodeMirip) return token;
    return (
      <span key={i}>
        <code className="mono">{bersih}</code>
        {akhiran}
      </span>
    );
  });
}

export function Placeholder({
  judul,
  untuk,
  children,
}: {
  judul: string;
  /** Apa yang harus dikerjakan Stage 5 di sini. */
  untuk: string;
  children?: ReactNode;
}) {
  return (
    <div className="ph">
      <span className="ph-tag">Stage 5</span>
      <span className="ph-title t-body-strong">{judul}</span>
      <span className="t-sm">{tandaiKode(untuk)}</span>
      {children}
    </div>
  );
}
