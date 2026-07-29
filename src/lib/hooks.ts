'use client';

/* ==========================================================================
   Hook bersama.

   Yang paling penting di berkas ini adalah `useDisclosure`. Semua panel
   mengambang (dropdown, date picker, modal, laci) memakainya, dan bentuknya
   dipilih untuk memenuhi dua aturan sekaligus:

   - R57: panel yang TERTUTUP tidak boleh menyumbang lebar layout. Di sini
     panel benar-benar DILEPAS dari DOM saat tertutup, bukan sekadar
     `opacity: 0`, jadi `scrollWidth` tidak mungkin ikut melebar.
   - R12: buka dan tutup tetap beranimasi. Karena itu ada fase `closing` yang
     menahan panel tetap terpasang selama animasi keluar berjalan, lalu baru
     melepasnya.

   `isOpen` adalah SATU-SATUNYA sumber kebenaran untuk `aria-expanded` dan
   untuk keputusan merender panel (R60). Tidak ada CSS `:hover` atau
   `:focus-within` yang membuka panel di belakang punggung state.
   ========================================================================== */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';

export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/* -------------------------------------------------------------------------
   Penyimpanan pilihan pengguna
   ------------------------------------------------------------------------- */

const PREFIX = 'jaring.';

export function bacaSimpanan(kunci: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(PREFIX + kunci);
  } catch {
    return null;
  }
}

export function tulisSimpanan(kunci: string, nilai: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PREFIX + kunci, nilai);
  } catch {
    /* Mode privat atau kuota penuh. Aplikasi tetap jalan tanpa mengingat. */
  }
}

/**
 * Nilai yang diingat antar kunjungan.
 *
 * Render pertama SELALU memakai `bawaan` supaya HTML hasil build dan render
 * pertama di browser identik. Nilai tersimpan baru dipasang setelah mount.
 * Ini menukar satu frame kedip dengan nol hydration mismatch, dan untuk
 * pilihan yang tidak menggeser tata letak itu pertukaran yang benar.
 *
 * Perkecualiannya sidebar, yang memang menggeser tata letak, jadi dia dibaca
 * lebih awal lewat skrip pra hidrasi di layout root.
 */
export function useSimpanan<T extends string>(
  kunci: string,
  bawaan: T,
  sah?: readonly T[],
): [T, (nilai: T) => void] {
  const [nilai, setNilai] = useState<T>(bawaan);

  useEffect(() => {
    const tersimpan = bacaSimpanan(kunci);
    if (tersimpan === null) return;
    if (sah && !sah.includes(tersimpan as T)) return;
    setNilai(tersimpan as T);
  }, [kunci, sah]);

  const simpan = useCallback(
    (baru: T) => {
      setNilai(baru);
      tulisSimpanan(kunci, baru);
    },
    [kunci],
  );

  return [nilai, simpan];
}

/* -------------------------------------------------------------------------
   Panel mengambang: buka, tutup, dan animasi keluar
   ------------------------------------------------------------------------- */

export type FasePanel = 'closed' | 'opening' | 'open' | 'closing';

export interface Disclosure {
  fase: FasePanel;
  /** Sumber kebenaran untuk aria-expanded (R60). */
  isOpen: boolean;
  /** Panel dirender selama ini true, termasuk saat animasi keluar. */
  terpasang: boolean;
  buka: () => void;
  tutup: () => void;
  alih: () => void;
}

export function useDisclosure(durasiMs = 160, awal = false): Disclosure {
  const [fase, setFase] = useState<FasePanel>(awal ? 'open' : 'closed');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (fase !== 'opening' && fase !== 'closing') return;
    timer.current = setTimeout(
      () => setFase(fase === 'opening' ? 'open' : 'closed'),
      durasiMs,
    );
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [fase, durasiMs]);

  const buka = useCallback(() => {
    setFase((f) => (f === 'open' || f === 'opening' ? f : 'opening'));
  }, []);

  const tutup = useCallback(() => {
    setFase((f) => (f === 'closed' || f === 'closing' ? f : 'closing'));
  }, []);

  const alih = useCallback(() => {
    setFase((f) => (f === 'open' || f === 'opening' ? 'closing' : 'opening'));
  }, []);

  const isOpen = fase === 'opening' || fase === 'open';

  return { fase, isOpen, terpasang: fase !== 'closed', buka, tutup, alih };
}

/* -------------------------------------------------------------------------
   Menutup panel
   ------------------------------------------------------------------------- */

export function useKlikDiLuar(
  refs: RefObject<HTMLElement | null>[],
  aktif: boolean,
  saatKlikDiLuar: () => void,
): void {
  useEffect(() => {
    if (!aktif) return;
    function tangani(e: MouseEvent | TouchEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      if (refs.some((r) => r.current?.contains(target))) return;
      saatKlikDiLuar();
    }
    document.addEventListener('mousedown', tangani);
    document.addEventListener('touchstart', tangani);
    return () => {
      document.removeEventListener('mousedown', tangani);
      document.removeEventListener('touchstart', tangani);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aktif, saatKlikDiLuar]);
}

export function useEscape(aktif: boolean, saatEscape: () => void): void {
  useEffect(() => {
    if (!aktif) return;
    function tangani(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        saatEscape();
      }
    }
    document.addEventListener('keydown', tangani);
    return () => document.removeEventListener('keydown', tangani);
  }, [aktif, saatEscape]);
}

/* -------------------------------------------------------------------------
   Perangkap fokus untuk modal dan laci
   ------------------------------------------------------------------------- */

const BISA_FOKUS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function usePerangkapFokus(
  ref: RefObject<HTMLElement | null>,
  aktif: boolean,
): void {
  useEffect(() => {
    if (!aktif) return;
    const wadah = ref.current;
    if (!wadah) return;

    const sebelumnya = document.activeElement as HTMLElement | null;
    const pertama = wadah.querySelector<HTMLElement>(BISA_FOKUS);
    (pertama ?? wadah).focus();

    function tangani(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !wadah) return;
      const daftar = [...wadah.querySelectorAll<HTMLElement>(BISA_FOKUS)].filter(
        (el) => el.offsetParent !== null,
      );
      if (daftar.length === 0) return;
      const awal = daftar[0];
      const akhir = daftar[daftar.length - 1];
      if (e.shiftKey && document.activeElement === awal) {
        e.preventDefault();
        akhir.focus();
      } else if (!e.shiftKey && document.activeElement === akhir) {
        e.preventDefault();
        awal.focus();
      }
    }

    document.addEventListener('keydown', tangani);
    return () => {
      document.removeEventListener('keydown', tangani);
      sebelumnya?.focus?.();
    };
  }, [ref, aktif]);
}

/** Mengunci gulir badan halaman selama overlay terbuka. */
export function useKunciGulir(aktif: boolean): void {
  useEffect(() => {
    if (!aktif) return;
    const asli = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = asli;
    };
  }, [aktif]);
}

/* -------------------------------------------------------------------------
   Penanda sudah ter-mount, untuk komponen yang memakai portal
   ------------------------------------------------------------------------- */

export function useSudahMount(): boolean {
  const [siap, setSiap] = useState(false);
  useEffect(() => setSiap(true), []);
  return siap;
}
