'use client';

/* ==========================================================================
   Tabel data. Dibangun sekali, dipakai semua modul.

   Isinya: kolom bisa diurutkan dengan `aria-sort`, header lengket saat
   digulir, baris bisa dipilih, dan bar aksi massal muncul begitu ada yang
   terpilih (standar aplikasi Himay Studio bagian 3).

   Soal mobile. Di bawah 768px tabel berubah jadi daftar kartu, BUKAN tabel
   yang digulir mendatar, karena gulir mendatar itu sendiri yang memicu
   overflow yang dilarang R19. Kedua markup ada di DOM dan yang tidak dipakai
   disembunyikan dengan `display: none`, jadi yang tersembunyi tidak menyumbang
   satu piksel pun ke `scrollWidth` (R57).

   Daftar kartu itu KOLEKSI DATA, bukan section kartu dekoratif, jadi sengaja
   tetap tumpukan vertikal dan bukan snap carousel. Batas R48 dijelaskan di
   LAYOUT-ARCHITECTURE.md.
   ========================================================================== */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type ReactNode } from 'react';
import { Icon } from '@/components/Icon';
import { EmptyState } from '@/components/ui/Basic';
import { Checkbox } from '@/components/ui/Form';

export interface Kolom<T> {
  kunci: string;
  judul: string;
  /** Rata kanan plus angka tabular. */
  num?: boolean;
  lebar?: number | string;
  /** Isi kalau kolom ini bisa diurutkan. */
  urut?: (a: T, b: T) => number;
  render: (baris: T) => ReactNode;
  /**
   * Kolom yang boleh hilang lebih dulu di desktop sempit (di bawah 1280px).
   * Titik paling sempit di build ini bukan mobile, tapi 1025px, karena di situ
   * sidebar 248px sudah muncul sementara kanvasnya belum tumbuh. Tandai kolom
   * yang paling tidak penting supaya tabel tetap terbaca dan tidak meluap.
   */
  opsional?: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  kolom: Kolom<T>[];
  kunciBaris: (baris: T) => string;
  labelTabel: string;
  hrefBaris?: (baris: T) => string;
  /** Renderer kartu untuk mode mobile. */
  kartu: (baris: T) => ReactNode;
  pilihan?: {
    terpilih: Set<string>;
    onUbah: (terpilih: Set<string>) => void;
    aksiMassal?: (terpilih: Set<string>) => ReactNode;
  };
  kosong: { judul: string; keterangan: string; aksi?: ReactNode };
  padat?: boolean;
  /** Baris ringkasan di kaki tabel. */
  kaki?: ReactNode;
}

type ArahUrut = 'asc' | 'desc' | null;

export function DataTable<T>({
  data,
  kolom,
  kunciBaris,
  labelTabel,
  hrefBaris,
  kartu,
  pilihan,
  kosong,
  padat = false,
  kaki,
}: DataTableProps<T>) {
  const router = useRouter();
  const [kunciUrut, setKunciUrut] = useState<string | null>(null);
  const [arah, setArah] = useState<ArahUrut>(null);

  const terurut = useMemo(() => {
    if (!kunciUrut || !arah) return data;
    const kol = kolom.find((k) => k.kunci === kunciUrut);
    if (!kol?.urut) return data;
    const salinan = [...data];
    salinan.sort(kol.urut);
    if (arah === 'desc') salinan.reverse();
    return salinan;
  }, [data, kolom, kunciUrut, arah]);

  function alihUrut(kunci: string) {
    if (kunciUrut !== kunci) {
      setKunciUrut(kunci);
      setArah('asc');
      return;
    }
    if (arah === 'asc') {
      setArah('desc');
      return;
    }
    setKunciUrut(null);
    setArah(null);
  }

  const semuaKunci = terurut.map(kunciBaris);
  const jumlahTerpilih = pilihan ? semuaKunci.filter((k) => pilihan.terpilih.has(k)).length : 0;
  const semuaTerpilih = jumlahTerpilih > 0 && jumlahTerpilih === semuaKunci.length;

  function alihSemua(checked: boolean) {
    if (!pilihan) return;
    pilihan.onUbah(checked ? new Set(semuaKunci) : new Set());
  }

  function alihSatu(kunci: string, checked: boolean) {
    if (!pilihan) return;
    const baru = new Set(pilihan.terpilih);
    if (checked) baru.add(kunci);
    else baru.delete(kunci);
    pilihan.onUbah(baru);
  }

  if (data.length === 0) {
    return (
      <div className="table-wrap">
        <EmptyState judul={kosong.judul} keterangan={kosong.keterangan} aksi={kosong.aksi} />
      </div>
    );
  }

  return (
    <div className="table-wrap">
      {pilihan && jumlahTerpilih > 0 && (
        <div className="bulkbar" role="region" aria-label="Aksi untuk baris terpilih">
          <span className="t-body-strong">{jumlahTerpilih} baris terpilih</span>
          {pilihan.aksiMassal?.(pilihan.terpilih)}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => pilihan.onUbah(new Set())}
          >
            Batalkan pilihan
          </button>
        </div>
      )}

      {/* ------------------------- Mode tabel, >=769px ------------------------ */}
      <div className="table-view">
        <table className={padat ? 'table table-dense' : 'table'}>
          <caption className="sr-only">{labelTabel}</caption>
          <thead>
            <tr>
              {pilihan && (
                <th scope="col" style={{ width: 44 }}>
                  <Checkbox
                    checked={semuaTerpilih}
                    indeterminate={jumlahTerpilih > 0 && !semuaTerpilih}
                    onUbah={alihSemua}
                    label="Pilih semua baris"
                    sembunyikanLabel
                  />
                </th>
              )}
              {kolom.map((k) => {
                const aktif = kunciUrut === k.kunci && arah !== null;
                return (
                  <th
                    key={k.kunci}
                    scope="col"
                    className={[k.num ? 'num' : '', k.opsional ? 'col-opsional' : '']
                      .filter(Boolean)
                      .join(' ')}
                    style={k.lebar !== undefined ? { width: k.lebar } : undefined}
                    aria-sort={aktif ? (arah === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    {k.urut ? (
                      <button type="button" className="th-sort" onClick={() => alihUrut(k.kunci)}>
                        {k.judul}
                        <Icon
                          name={aktif ? (arah === 'asc' ? 'arrow-up' : 'arrow-down') : 'sort'}
                          size={12}
                          className="sort-icon"
                        />
                      </button>
                    ) : (
                      k.judul
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {terurut.map((baris) => {
              const kunci = kunciBaris(baris);
              const href = hrefBaris?.(baris);
              const dipilih = pilihan?.terpilih.has(kunci) ?? false;
              return (
                <tr
                  key={kunci}
                  aria-selected={pilihan ? dipilih : undefined}
                  data-clickable={href ? 'true' : undefined}
                  onClick={
                    href
                      ? (e) => {
                          /* Jangan ikut menavigasi kalau yang diklik memang
                             elemen interaktif di dalam baris. */
                          const t = e.target as HTMLElement;
                          if (t.closest('a, button, input, label')) return;
                          router.push(href);
                        }
                      : undefined
                  }
                >
                  {pilihan && (
                    <td>
                      <Checkbox
                        checked={dipilih}
                        onUbah={(c) => alihSatu(kunci, c)}
                        label={`Pilih baris ${kunci}`}
                        sembunyikanLabel
                      />
                    </td>
                  )}
                  {kolom.map((k, i) => (
                    <td
                      key={k.kunci}
                      className={[k.num ? 'num' : '', k.opsional ? 'col-opsional' : '']
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {/* Kolom pertama jadi tautan nyata, itu jalur keyboard
                          untuk membuka baris dengan Enter (DESIGN.md 6.6). */}
                      {i === 0 && href ? (
                        <Link href={href} className="td-key" style={{ color: 'inherit' }}>
                          {k.render(baris)}
                        </Link>
                      ) : (
                        k.render(baris)
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ---------------------- Mode kartu, <=768px -------------------------- */}
      <div className="cardlist-view">
        <div className="cardlist" data-r48="koleksi-data">
          {terurut.map((baris) => {
            const kunci = kunciBaris(baris);
            const href = hrefBaris?.(baris);
            const isi = kartu(baris);
            return href ? (
              <Link key={kunci} href={href} className="cardlist-item">
                {isi}
              </Link>
            ) : (
              <div key={kunci} className="cardlist-item">
                {isi}
              </div>
            );
          })}
        </div>
      </div>

      {kaki && <div className="table-foot t-sm">{kaki}</div>}
    </div>
  );
}
