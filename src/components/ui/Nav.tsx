'use client';

/* ==========================================================================
   Kepala halaman, tab, dan pemindah view.

   Dua keputusan tata letak yang berlaku di SELURUH aplikasi:

   1. Aksi utama ada di KIRI, sejajar judul halaman, bukan di pojok kanan atas
      (DESIGN.md 6.1, arahan arsitektur dari HIM-283). Urutan tetap di semua
      layar: judul, aksi utama, filter dan pencarian, baru datanya.

   2. Berpindah view TIDAK PERNAH mereset filter yang sedang aktif. Karena itu
      state filter tinggal di komponen halaman, di ATAS pemindah view, dan
      pemindah view cuma memilih cara menggambar hasil penyaringan yang sama.
   ========================================================================== */

import type { ReactNode } from 'react';
import { Icon, type NamaIkon } from '@/components/Icon';
import { useSimpanan } from '@/lib/hooks';
import type { ViewMode } from '@/data/types';

/* -------------------------------------------------------------------------
   Kepala halaman
   ------------------------------------------------------------------------- */

export function PageHeader({
  judul,
  keterangan,
  aksi,
  meta,
}: {
  judul: string;
  keterangan?: string;
  /** Aksi utama. Dirender di KIRI, tepat di bawah judul. */
  aksi?: ReactNode;
  /** Ringkasan angka kecil di kanan judul. */
  meta?: ReactNode;
}) {
  return (
    <header className="page-head">
      <div className="page-head-top">
        <div className="page-title-block grow">
          {/* R50: judul dan keterangan elemen blok terpisah dengan gap */}
          <div className="titled">
            <h1 className="t-h1">{judul}</h1>
            {keterangan && <p className="t-sm muted">{keterangan}</p>}
          </div>
          {aksi && (
            <div className="page-head-actions" style={{ marginTop: 12 }}>
              {aksi}
            </div>
          )}
        </div>
        {meta && <div className="row gap-16 wrap">{meta}</div>}
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------
   Toolbar filter. Selalu di bawah kepala halaman, di atas data.
   ------------------------------------------------------------------------- */

export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="toolbar" role="group" aria-label="Penyaring dan tampilan">
      {children}
    </div>
  );
}

export function ToolbarSpacer() {
  return <div className="toolbar-spacer" />;
}

/* -------------------------------------------------------------------------
   Pemindah view
   ------------------------------------------------------------------------- */

const IKON_VIEW: Record<ViewMode, NamaIkon> = {
  table: 'tabel',
  kanban: 'papan',
  calendar: 'kalender',
  card: 'kartu',
  list: 'daftar',
};

const LABEL_VIEW: Record<ViewMode, string> = {
  table: 'Table',
  kanban: 'Kanban',
  calendar: 'Calendar',
  card: 'Card',
  list: 'List',
};

/**
 * Mode tampilan yang diingat per halaman lewat localStorage.
 *
 * Render pertama selalu memakai `bawaan` supaya HTML hasil build sama dengan
 * render pertama di browser, baru setelah mount nilai tersimpan dipasang.
 */
export function useViewMode(
  kunciHalaman: string,
  tersedia: readonly ViewMode[],
): [ViewMode, (v: ViewMode) => void] {
  return useSimpanan<ViewMode>(`view.${kunciHalaman}`, tersedia[0], tersedia);
}

export function ViewSwitcher({
  nilai,
  onUbah,
  tersedia,
}: {
  nilai: ViewMode;
  onUbah: (v: ViewMode) => void;
  tersedia: readonly ViewMode[];
}) {
  return (
    <div className="viewsw" role="group" aria-label="Mode tampilan">
      {tersedia.map((v) => (
        <button
          key={v}
          type="button"
          className="viewsw-btn"
          aria-pressed={nilai === v}
          onClick={() => onUbah(v)}
        >
          <Icon name={IKON_VIEW[v]} size={16} />
          <span className="t-sm">{LABEL_VIEW[v]}</span>
        </button>
      ))}
    </div>
  );
}

/** Pembungkus isi view, memberi silang redup 200ms saat berpindah. */
export function ViewPane({ kunci, children }: { kunci: string; children: ReactNode }) {
  return (
    <div className="view-pane" key={kunci}>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Tab
   ------------------------------------------------------------------------- */

export interface ItemTab {
  id: string;
  label: string;
  icon?: NamaIkon;
  jumlah?: number;
}

export function Tabs({
  item,
  aktif,
  onUbah,
  label,
}: {
  item: ItemTab[];
  aktif: string;
  onUbah: (id: string) => void;
  label: string;
}) {
  function tanganiKeyboard(e: React.KeyboardEvent, indeks: number) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const arah = e.key === 'ArrowRight' ? 1 : -1;
    const tujuan = (indeks + arah + item.length) % item.length;
    onUbah(item[tujuan].id);
    (e.currentTarget.parentElement?.children[tujuan] as HTMLElement | undefined)?.focus();
  }

  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {item.map((t, i) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          id={`tab-${t.id}`}
          aria-selected={aktif === t.id}
          aria-controls={`panel-${t.id}`}
          tabIndex={aktif === t.id ? 0 : -1}
          className="tab"
          onClick={() => onUbah(t.id)}
          onKeyDown={(e) => tanganiKeyboard(e, i)}
        >
          {t.icon && <Icon name={t.icon} size={16} />}
          <span className="t-body">{t.label}</span>
          {t.jumlah !== undefined && <span className="t-xs muted num">{t.jumlah}</span>}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({
  id,
  aktif,
  children,
}: {
  id: string;
  aktif: string;
  children: ReactNode;
}) {
  if (id !== aktif) return null;
  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      tabIndex={0}
      className="view-pane"
      style={{ marginTop: 16 }}
    >
      {children}
    </div>
  );
}
