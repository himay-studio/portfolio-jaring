'use client';

/* ==========================================================================
   Date picker kustom (R21).

   DILARANG input teks tanggal bebas. Field bertuliskan "contoh: 12 Agustus
   2026" menghasilkan data yang tidak bisa diurai, dan itu build yang gagal.

   Yang dipenuhi:
   - Grid `role="grid"` dengan `role="row"` dan `role="gridcell"`.
   - Keyboard penuh: ArrowLeft dan ArrowRight geser satu hari, ArrowUp dan
     ArrowDown geser satu minggu, PageUp dan PageDown geser satu bulan, Home
     dan End lompat ke awal dan akhir minggu, Enter memilih, Escape menutup.
   - Penanda hari ini (batas teal) dan tanggal terpilih (isian teal, teks
     putih 6.18:1) dibedakan, dan keduanya tidak cuma mengandalkan warna.
   - Format tampilan "12 Agustus 2026", format nilai ISO.
   - Mode rentang untuk penyaring laporan.
   - R57: panel dilepas dari DOM saat tertutup. Inilah persis panel yang di
     Mabrur menyebabkan overflow tersembunyi 385px lawan 375px, karena di
     sana dia cuma `opacity: 0` tapi tetap memakan layout.
   ========================================================================== */

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Icon } from '@/components/Icon';
import { HARI_INI } from '@/data/clock';
import { HARI_PENDEK, namaBulan, tanggal as formatTanggal } from '@/lib/format';
import { useDisclosure, useEscape, useKlikDiLuar } from '@/lib/hooks';
import {
  awalMinggu,
  dalamRentang,
  gridBulan,
  tambahBulan,
  tambahHari,
} from '@/lib/kalender';

interface DasarProps {
  label: string;
  tampilkanLabel?: boolean;
  align?: 'left' | 'right';
  lebar?: number | string;
  nonaktif?: boolean;
  id?: string;
  /** Tanggal paling awal yang boleh dipilih, format ISO. */
  minimal?: string;
}

/* -------------------------------------------------------------------------
   Grid kalender, dipakai bersama mode tunggal dan mode rentang.
   ------------------------------------------------------------------------- */

interface GridProps {
  bulanTampil: string;
  setBulanTampil: (iso: string) => void;
  fokus: string;
  setFokus: (iso: string) => void;
  terpilih?: string;
  rentangMulai?: string;
  rentangSampai?: string;
  minimal?: string;
  onPilih: (iso: string) => void;
  onTutup: () => void;
}

function GridKalender({
  bulanTampil,
  setBulanTampil,
  fokus,
  setFokus,
  terpilih,
  rentangMulai,
  rentangSampai,
  minimal,
  onPilih,
  onTutup,
}: GridProps) {
  const sel = gridBulan(bulanTampil);
  const refGrid = useRef<HTMLDivElement>(null);
  const perluFokus = useRef(false);

  useEffect(() => {
    if (!perluFokus.current) return;
    perluFokus.current = false;
    refGrid.current?.querySelector<HTMLElement>('[data-fokus="true"]')?.focus();
  });

  function pindah(iso: string) {
    perluFokus.current = true;
    setFokus(iso);
    if (iso.slice(0, 7) !== bulanTampil.slice(0, 7)) setBulanTampil(iso);
  }

  function tanganiKeyboard(e: React.KeyboardEvent) {
    const aksi: Record<string, () => string | undefined> = {
      ArrowLeft: () => tambahHari(fokus, -1),
      ArrowRight: () => tambahHari(fokus, 1),
      ArrowUp: () => tambahHari(fokus, -7),
      ArrowDown: () => tambahHari(fokus, 7),
      PageUp: () => tambahBulan(fokus, -1),
      PageDown: () => tambahBulan(fokus, 1),
      Home: () => awalMinggu(fokus),
      End: () => tambahHari(awalMinggu(fokus), 6),
    };

    if (aksi[e.key]) {
      e.preventDefault();
      const tujuan = aksi[e.key]();
      if (tujuan) pindah(tujuan);
      return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!minimal || fokus >= minimal) onPilih(fokus);
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      onTutup();
    }
  }

  const baris = Array.from({ length: 6 }, (_, i) => sel.slice(i * 7, i * 7 + 7));

  return (
    <>
      <div className="dp-head">
        <button
          type="button"
          className="dp-nav"
          aria-label="Bulan sebelumnya"
          onClick={() => setBulanTampil(tambahBulan(bulanTampil, -1))}
        >
          <Icon name="chevron-left" size={16} />
        </button>
        <div className="t-body-strong" aria-live="polite">
          {namaBulan(Number(bulanTampil.slice(5, 7)))} {bulanTampil.slice(0, 4)}
        </div>
        <button
          type="button"
          className="dp-nav"
          aria-label="Bulan berikutnya"
          onClick={() => setBulanTampil(tambahBulan(bulanTampil, 1))}
        >
          <Icon name="chevron-right" size={16} />
        </button>
      </div>

      <div
        ref={refGrid}
        role="grid"
        aria-label="Kalender"
        className="dp-grid"
        onKeyDown={tanganiKeyboard}
      >
        <div role="row" style={{ display: 'contents' }}>
          {HARI_PENDEK.map((h) => (
            <div key={h} role="columnheader" className="dp-dow t-label" aria-label={h}>
              <span aria-hidden="true">{h.slice(0, 2)}</span>
            </div>
          ))}
        </div>

        {baris.map((minggu, i) => (
          <div key={i} role="row" style={{ display: 'contents' }}>
            {minggu.map((s) => {
              const dipilih = terpilih === s.iso;
              const diRentang =
                !dipilih && dalamRentang(s.iso, rentangMulai, rentangSampai);
              const batasRentang = rentangMulai === s.iso || rentangSampai === s.iso;
              const dilarang = minimal !== undefined && s.iso < minimal;
              return (
                <div key={s.iso} role="gridcell" aria-selected={dipilih || batasRentang}>
                  <button
                    type="button"
                    className="dp-day"
                    data-outside={s.luarBulan ? 'true' : 'false'}
                    data-today={s.iso === HARI_INI ? 'true' : 'false'}
                    data-in-range={diRentang ? 'true' : 'false'}
                    data-fokus={s.iso === fokus ? 'true' : 'false'}
                    aria-selected={dipilih || batasRentang}
                    aria-label={formatTanggal(s.iso)}
                    aria-current={s.iso === HARI_INI ? 'date' : undefined}
                    tabIndex={s.iso === fokus ? 0 : -1}
                    disabled={dilarang}
                    onClick={() => onPilih(s.iso)}
                    onFocus={() => setFokus(s.iso)}
                  >
                    {Number(s.iso.slice(8, 10))}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------
   Mode tunggal
   ------------------------------------------------------------------------- */

export interface DatePickerProps extends DasarProps {
  nilai: string;
  onUbah: (iso: string) => void;
  placeholder?: string;
  name?: string;
}

export function DatePicker({
  nilai,
  onUbah,
  label,
  tampilkanLabel = false,
  align = 'left',
  lebar,
  nonaktif = false,
  id,
  minimal,
  placeholder = 'Pilih tanggal',
  name,
}: DatePickerProps) {
  const idOtomatis = useId();
  const idDasar = id ?? idOtomatis;
  const idPanel = `${idDasar}-panel`;

  const panel = useDisclosure(160);
  const refPemicu = useRef<HTMLButtonElement>(null);
  const refPanel = useRef<HTMLDivElement>(null);

  const [bulanTampil, setBulanTampil] = useState(nilai || HARI_INI);
  const [fokus, setFokus] = useState(nilai || HARI_INI);

  const tutup = useCallback(() => panel.tutup(), [panel]);
  useKlikDiLuar([refPemicu, refPanel], panel.isOpen, tutup);
  useEscape(panel.isOpen, () => {
    tutup();
    refPemicu.current?.focus();
  });

  useEffect(() => {
    if (!panel.isOpen) return;
    const awal = nilai || HARI_INI;
    setBulanTampil(awal);
    setFokus(awal);
  }, [panel.isOpen, nilai]);

  function pilih(iso: string) {
    onUbah(iso);
    tutup();
    refPemicu.current?.focus();
  }

  return (
    <div className="dp" style={lebar !== undefined ? { width: lebar } : undefined}>
      {tampilkanLabel && (
        <label className="t-label field-label" htmlFor={idDasar} style={{ marginBottom: 6 }}>
          {label}
        </label>
      )}

      <button
        ref={refPemicu}
        id={idDasar}
        type="button"
        className="sel-trigger"
        disabled={nonaktif}
        aria-expanded={panel.isOpen}
        aria-haspopup="dialog"
        aria-controls={panel.terpasang ? idPanel : undefined}
        aria-label={tampilkanLabel ? undefined : label}
        onClick={panel.alih}
      >
        <span className="sel-value t-body" data-placeholder={nilai ? 'false' : 'true'}>
          {nilai ? formatTanggal(nilai) : placeholder}
        </span>
        <Icon name="kalender" size={16} className="sel-chev" style={{ transform: 'none' }} />
      </button>

      {name && <input type="hidden" name={name} value={nilai} />}

      {panel.terpasang && (
        <div
          ref={refPanel}
          id={idPanel}
          role="dialog"
          aria-label={label}
          className="dp-panel"
          data-align={align}
          data-phase={panel.fase === 'closing' ? 'closing' : 'opening'}
        >
          <GridKalender
            bulanTampil={bulanTampil}
            setBulanTampil={setBulanTampil}
            fokus={fokus}
            setFokus={setFokus}
            terpilih={nilai || undefined}
            minimal={minimal}
            onPilih={pilih}
            onTutup={() => {
              tutup();
              refPemicu.current?.focus();
            }}
          />
          <div className="dp-foot">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => pilih(HARI_INI)}>
              Hari ini
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                onUbah('');
                tutup();
                refPemicu.current?.focus();
              }}
            >
              Kosongkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Mode rentang, dipakai penyaring periode di Laporan
   ------------------------------------------------------------------------- */

export interface DateRangePickerProps extends DasarProps {
  mulai: string;
  sampai: string;
  onUbah: (mulai: string, sampai: string) => void;
}

export function DateRangePicker({
  mulai,
  sampai,
  onUbah,
  label,
  tampilkanLabel = false,
  align = 'left',
  lebar,
  nonaktif = false,
  id,
}: DateRangePickerProps) {
  const idOtomatis = useId();
  const idDasar = id ?? idOtomatis;
  const idPanel = `${idDasar}-panel`;

  const panel = useDisclosure(160);
  const refPemicu = useRef<HTMLButtonElement>(null);
  const refPanel = useRef<HTMLDivElement>(null);

  const [bulanTampil, setBulanTampil] = useState(mulai || HARI_INI);
  const [fokus, setFokus] = useState(mulai || HARI_INI);
  /** Tahap pemilihan: menunggu tanggal awal, atau menunggu tanggal akhir. */
  const [menungguAkhir, setMenungguAkhir] = useState(false);
  const [sementaraMulai, setSementaraMulai] = useState(mulai);

  const tutup = useCallback(() => panel.tutup(), [panel]);
  useKlikDiLuar([refPemicu, refPanel], panel.isOpen, tutup);
  useEscape(panel.isOpen, () => {
    tutup();
    refPemicu.current?.focus();
  });

  useEffect(() => {
    if (!panel.isOpen) return;
    setMenungguAkhir(false);
    setSementaraMulai(mulai);
    setBulanTampil(mulai || HARI_INI);
    setFokus(mulai || HARI_INI);
  }, [panel.isOpen, mulai]);

  function pilih(iso: string) {
    if (!menungguAkhir) {
      setSementaraMulai(iso);
      setMenungguAkhir(true);
      return;
    }
    const a = iso < sementaraMulai ? iso : sementaraMulai;
    const b = iso < sementaraMulai ? sementaraMulai : iso;
    onUbah(a, b);
    setMenungguAkhir(false);
    tutup();
    refPemicu.current?.focus();
  }

  const teks =
    mulai && sampai ? `${formatTanggal(mulai)} sampai ${formatTanggal(sampai)}` : 'Pilih periode';

  return (
    <div className="dp" style={lebar !== undefined ? { width: lebar } : undefined}>
      {tampilkanLabel && (
        <label className="t-label field-label" htmlFor={idDasar} style={{ marginBottom: 6 }}>
          {label}
        </label>
      )}

      <button
        ref={refPemicu}
        id={idDasar}
        type="button"
        className="sel-trigger"
        disabled={nonaktif}
        aria-expanded={panel.isOpen}
        aria-haspopup="dialog"
        aria-controls={panel.terpasang ? idPanel : undefined}
        aria-label={tampilkanLabel ? undefined : label}
        onClick={panel.alih}
      >
        <span className="sel-value t-body" data-placeholder={mulai && sampai ? 'false' : 'true'}>
          {teks}
        </span>
        <Icon name="kalender" size={16} className="sel-chev" style={{ transform: 'none' }} />
      </button>

      {panel.terpasang && (
        <div
          ref={refPanel}
          id={idPanel}
          role="dialog"
          aria-label={label}
          className="dp-panel"
          data-align={align}
          data-phase={panel.fase === 'closing' ? 'closing' : 'opening'}
        >
          <p className="t-xs muted" style={{ marginBottom: 8 }}>
            {menungguAkhir ? 'Pilih tanggal akhir' : 'Pilih tanggal awal'}
          </p>
          <GridKalender
            bulanTampil={bulanTampil}
            setBulanTampil={setBulanTampil}
            fokus={fokus}
            setFokus={setFokus}
            rentangMulai={menungguAkhir ? sementaraMulai : mulai}
            rentangSampai={menungguAkhir ? fokus : sampai}
            onPilih={pilih}
            onTutup={() => {
              tutup();
              refPemicu.current?.focus();
            }}
          />
        </div>
      )}
    </div>
  );
}
