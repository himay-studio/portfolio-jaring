'use client';

/* ==========================================================================
   Kontrol form.

   Aturan yang paling gampang dilanggar dan paling mahal akibatnya (R20):
   batas kontrol WAJIB `--control-border` `#74868E` (3.79:1 di atas putih),
   BUKAN `--border` `#D2DCE0` yang cuma 1.39:1. Yang kedua itu sah untuk garis
   rambut pemisah baris tabel, tapi kalau dipakai sebagai batas input, checkbox,
   atau toggle, kontrolnya menyatu dengan latarnya dan hilang. Itu persis
   kelas kegagalan yang terjadi di Komodrift.

   Warnanya sudah dipasang di components.css, jadi selama komponen di berkas
   ini yang dipakai, tidak ada jalan untuk salah.
   ========================================================================== */

import { useId } from 'react';
import { Icon } from '@/components/Icon';

/* -------------------------------------------------------------------------
   Field pembungkus: label, kontrol, keterangan, dan pesan galat
   ------------------------------------------------------------------------- */

export function Field({
  label,
  htmlFor,
  keterangan,
  galat,
  children,
}: {
  label: string;
  htmlFor?: string;
  keterangan?: string;
  galat?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="field">
      <label className="field-label t-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {keterangan && !galat && <span className="field-hint t-xs">{keterangan}</span>}
      {/* Galat ditandai teks, tidak cuma warna batas (DESIGN.md 6.4) */}
      {galat && (
        <span className="field-err t-xs" role="alert">
          <Icon name="peringatan" size={13} />
          {galat}
        </span>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Input teks
   ------------------------------------------------------------------------- */

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input className={className ? `input ${className}` : 'input'} {...rest} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return <textarea className={className ? `textarea ${className}` : 'textarea'} {...rest} />;
}

/* -------------------------------------------------------------------------
   Pencarian
   ------------------------------------------------------------------------- */

export function SearchInput({
  nilai,
  onUbah,
  placeholder = 'Cari',
  label,
}: {
  nilai: string;
  onUbah: (nilai: string) => void;
  placeholder?: string;
  label: string;
}) {
  const id = useId();
  return (
    <div className="search">
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <Icon name="search" size={16} className="search-icon" />
      <input
        id={id}
        type="search"
        className="input"
        value={nilai}
        placeholder={placeholder}
        onChange={(e) => onUbah(e.target.value)}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------
   Checkbox. 18x18 dengan area sentuh 44x44 (DESIGN.md 6.4).
   ------------------------------------------------------------------------- */

export function Checkbox({
  checked,
  onUbah,
  label,
  sembunyikanLabel = false,
  indeterminate = false,
}: {
  checked: boolean;
  onUbah: (checked: boolean) => void;
  label: string;
  sembunyikanLabel?: boolean;
  indeterminate?: boolean;
}) {
  return (
    <label className="check">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onUbah(e.target.checked)}
        ref={(el) => {
          if (el) el.indeterminate = indeterminate && !checked;
        }}
      />
      <span className="check-box" aria-hidden="true">
        <Icon name={indeterminate && !checked ? 'chevron-down' : 'check'} size={13} />
      </span>
      <span className={sembunyikanLabel ? 'sr-only' : 't-sm'}>{label}</span>
    </label>
  );
}

/* -------------------------------------------------------------------------
   Toggle. Track --control-border saat mati, --brand saat hidup, dan SELALU
   berpasangan dengan label teks plus teks keadaan, bukan cuma warna.
   ------------------------------------------------------------------------- */

export function Toggle({
  checked,
  onUbah,
  label,
  teksHidup = 'Aktif',
  teksMati = 'Nonaktif',
}: {
  checked: boolean;
  onUbah: (checked: boolean) => void;
  label: string;
  teksHidup?: string;
  teksMati?: string;
}) {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        aria-label={label}
        onChange={(e) => onUbah(e.target.checked)}
      />
      <span className="toggle-track" aria-hidden="true">
        <span className="toggle-knob" />
      </span>
      <span className="toggle-state t-sm">{checked ? teksHidup : teksMati}</span>
    </label>
  );
}
