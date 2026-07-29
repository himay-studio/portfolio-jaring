'use client';

/* ==========================================================================
   Dropdown kustom (R12).

   DILARANG memakai `<select>` bawaan browser di mana pun di aplikasi ini.

   Yang dipenuhi komponen ini, satu per satu:

   - Buka dan tutup BERANIMASI, plus chevron yang berputar 180 derajat.
   - `role="listbox"` di panel, `role="option"` di item, plus input tersembunyi
     untuk nilai form.
   - Keyboard penuh: ArrowUp, ArrowDown, Home, End, Enter, Escape, dan ketik
     untuk mencari.
   - R60: `aria-expanded` diambil dari `isOpen` yang SAMA dengan yang dipakai
     untuk memutuskan merender panel. Jadi tidak mungkin panel terlihat
     terbuka sementara aria bilang tertutup. Tidak ada pembuka `onFocus` yang
     dipasang bareng toggler `onClick` di elemen yang sama, karena klik nyata
     memfokus lebih dulu, jadi pasangan itu akan membuka lalu langsung menutup.
     Tidak ada juga CSS `:hover` atau `:focus-within` yang membuka panel di
     luar state.
   - R57: saat tertutup panel benar-benar DILEPAS dari DOM, jadi tidak
     menyumbang satu piksel pun ke `document.documentElement.scrollWidth`.
   - R16.1: panel punya `max-width: calc(100vw - 2rem)` dan menjangkar
     `left: 0` atau `right: 0`, tidak pernah `left: 50%` tanpa clamp.
   ========================================================================== */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Icon } from '@/components/Icon';
import { useDisclosure, useEscape, useKlikDiLuar } from '@/lib/hooks';

export interface OpsiSelect {
  nilai: string;
  label: string;
  /** Baris kedua opsional. Dirender sebagai elemen BLOK terpisah (R50). */
  keterangan?: string;
  nonaktif?: boolean;
}

export interface SelectProps {
  opsi: OpsiSelect[];
  nilai: string;
  onUbah: (nilai: string) => void;
  /** Label yang dibacakan pembaca layar. Wajib, ikon saja tidak cukup. */
  label: string;
  /** Tampilkan label di atas pemicu. */
  tampilkanLabel?: boolean;
  placeholder?: string;
  /** Nama field untuk input tersembunyi. */
  name?: string;
  /** Arah tumbuh panel. Pemicu paling kanan pakai `right` (R16.1). */
  align?: 'left' | 'right';
  lebar?: number | string;
  nonaktif?: boolean;
  id?: string;
}

export function Select({
  opsi,
  nilai,
  onUbah,
  label,
  tampilkanLabel = false,
  placeholder = 'Pilih',
  name,
  align = 'left',
  lebar,
  nonaktif = false,
  id,
}: SelectProps) {
  const idOtomatis = useId();
  const idDasar = id ?? idOtomatis;
  const idPanel = `${idDasar}-panel`;

  const panel = useDisclosure(160);
  const refPemicu = useRef<HTMLButtonElement>(null);
  const refPanel = useRef<HTMLDivElement>(null);
  const refKetik = useRef<{ teks: string; timer: ReturnType<typeof setTimeout> | null }>({
    teks: '',
    timer: null,
  });

  const indeksTerpilih = useMemo(
    () => opsi.findIndex((o) => o.nilai === nilai),
    [opsi, nilai],
  );
  const [indeksAktif, setIndeksAktif] = useState(indeksTerpilih < 0 ? 0 : indeksTerpilih);

  const terpilih = indeksTerpilih >= 0 ? opsi[indeksTerpilih] : undefined;

  const tutup = useCallback(() => {
    panel.tutup();
  }, [panel]);

  useKlikDiLuar([refPemicu, refPanel], panel.isOpen, tutup);
  useEscape(panel.isOpen, () => {
    tutup();
    refPemicu.current?.focus();
  });

  /* Saat panel terbuka, sorot langsung diletakkan di opsi yang sedang dipilih. */
  useEffect(() => {
    if (panel.isOpen) setIndeksAktif(indeksTerpilih < 0 ? 0 : indeksTerpilih);
  }, [panel.isOpen, indeksTerpilih]);

  /* Menjaga opsi yang sedang disorot tetap terlihat saat digulir keyboard. */
  useEffect(() => {
    if (!panel.isOpen) return;
    const el = refPanel.current?.querySelector<HTMLElement>(`[data-indeks="${indeksAktif}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [indeksAktif, panel.isOpen]);

  function pilih(indeks: number) {
    const o = opsi[indeks];
    if (!o || o.nonaktif) return;
    onUbah(o.nilai);
    tutup();
    refPemicu.current?.focus();
  }

  function geser(arah: 1 | -1) {
    setIndeksAktif((sekarang) => {
      const jumlah = opsi.length;
      if (jumlah === 0) return 0;
      let i = sekarang;
      for (let langkah = 0; langkah < jumlah; langkah += 1) {
        i = (i + arah + jumlah) % jumlah;
        if (!opsi[i].nonaktif) return i;
      }
      return sekarang;
    });
  }

  function cariKetikan(huruf: string) {
    const state = refKetik.current;
    if (state.timer) clearTimeout(state.timer);
    state.teks += huruf.toLowerCase();
    state.timer = setTimeout(() => {
      state.teks = '';
    }, 600);
    const ketemu = opsi.findIndex(
      (o) => !o.nonaktif && o.label.toLowerCase().startsWith(state.teks),
    );
    if (ketemu >= 0) setIndeksAktif(ketemu);
  }

  function tanganiKeyboard(e: React.KeyboardEvent) {
    if (nonaktif) return;

    if (!panel.isOpen) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        panel.buka();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        geser(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        geser(-1);
        break;
      case 'Home':
        e.preventDefault();
        setIndeksAktif(opsi.findIndex((o) => !o.nonaktif));
        break;
      case 'End':
        e.preventDefault();
        setIndeksAktif(opsi.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        pilih(indeksAktif);
        break;
      case 'Tab':
        tutup();
        break;
      default:
        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          cariKetikan(e.key);
        }
    }
  }

  return (
    <div className="sel" style={lebar !== undefined ? { width: lebar } : undefined}>
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
        /* Satu sumber kebenaran, dipakai bersama dengan keputusan render panel */
        aria-expanded={panel.isOpen}
        aria-haspopup="listbox"
        aria-controls={panel.terpasang ? idPanel : undefined}
        aria-label={tampilkanLabel ? undefined : label}
        /* Sengaja HANYA onClick, tanpa onFocus pembuka (R60) */
        onClick={panel.alih}
        onKeyDown={tanganiKeyboard}
      >
        <span className="sel-value t-body" data-placeholder={terpilih ? 'false' : 'true'}>
          {terpilih?.label ?? placeholder}
        </span>
        <Icon name="chevron-down" size={16} className="sel-chev" />
      </button>

      {name && <input type="hidden" name={name} value={nilai} />}

      {panel.terpasang && (
        <div
          ref={refPanel}
          id={idPanel}
          role="listbox"
          aria-label={label}
          tabIndex={-1}
          className="sel-panel"
          data-align={align}
          data-phase={panel.fase === 'closing' ? 'closing' : 'opening'}
        >
          {opsi.length === 0 && <div className="sel-empty t-sm">Tidak ada pilihan.</div>}

          {opsi.map((o, i) => (
            <button
              key={o.nilai}
              type="button"
              role="option"
              data-indeks={i}
              data-active={i === indeksAktif ? 'true' : 'false'}
              aria-selected={o.nilai === nilai}
              disabled={o.nonaktif}
              className="sel-opt"
              onClick={() => pilih(i)}
              onMouseEnter={() => setIndeksAktif(i)}
            >
              {/* R50: judul dan keterangan adalah elemen BLOK terpisah dengan
                  gap, bukan dua teks sebaris yang menempel jadi satu kata. */}
              <span className="titled">
                <span className="t-body">{o.label}</span>
                {o.keterangan && <span className="t-xs muted">{o.keterangan}</span>}
              </span>
              {o.nilai === nilai && <Icon name="check" size={16} className="sel-opt-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
