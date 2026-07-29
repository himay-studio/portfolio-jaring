'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Icon } from '@/components/Icon';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { Avatar, Badge, Placeholder } from '@/components/ui/Basic';
import { DataTable, type Kolom } from '@/components/ui/DataTable';
import { SearchInput } from '@/components/ui/Form';
import { PageHeader, Toolbar, ToolbarSpacer, ViewPane, ViewSwitcher, useViewMode } from '@/components/ui/Nav';
import { Select } from '@/components/ui/Select';
import { TAHAP } from '@/data/settings';
import { USERS, getContact, namaCompany, namaUser } from '@/data/relations';
import type { Deal, TahapId, Tone, ViewMode } from '@/data/types';
import { persenSingkat, rupiah, rupiahSingkat, tanggalRingkas } from '@/lib/format';
import { useDealStore } from '@/lib/dealStore';
import { hariMandek, isMandek, nilaiTertimbang, nilaiTotal } from '@/lib/metrics';

/* ==========================================================================
   Deals. Pusat gravitasi aplikasi.

   Wajib punya Kanban PLUS Table (HIM-283). Keduanya menggambar hasil
   penyaringan yang SAMA, dan berpindah view tidak pernah mereset filter,
   karena state filter tinggal di komponen ini, di atas pemindah view.

   Papan kanban punya aturan yang tidak ada di modul lain: menggeser kartu ke
   tahap Kalah membuka dialog alasan kalah. Aturannya sendiri ditegakkan di
   `useDealStore`, jadi jalur keyboard pun tidak bisa melewatinya.
   ========================================================================== */

const VIEW: readonly ViewMode[] = ['kanban', 'table'];

const TONE_TAHAP: Record<TahapId, Tone> = {
  prospek: 'info',
  kualifikasi: 'brand',
  penawaran: 'accent',
  negosiasi: 'warning',
  menang: 'success',
  kalah: 'danger',
};

export default function HalamanDeals() {
  const { deals, pindahTahap, kembalikanDemo, jumlahPerubahan } = useDealStore();
  const [view, setView] = useViewMode('deals', VIEW);

  /* Filter hidup di ATAS pemindah view, jadi ganti view tidak meresetnya. */
  const [cari, setCari] = useState('');
  const [owner, setOwner] = useState('semua');
  const [tahap, setTahap] = useState('semua');
  const [terpilih, setTerpilih] = useState<Set<string>>(new Set());

  const tersaring = useMemo(
    () =>
      deals.filter((d) => {
        if (owner !== 'semua' && d.ownerId !== owner) return false;
        if (tahap !== 'semua' && d.tahap !== tahap) return false;
        if (!cari.trim()) return true;
        const kata = cari.toLowerCase();
        return (
          d.nama.toLowerCase().includes(kata) ||
          namaCompany(d.companyId).toLowerCase().includes(kata) ||
          (getContact(d.contactId)?.nama.toLowerCase().includes(kata) ?? false)
        );
      }),
    [deals, cari, owner, tahap],
  );

  const kolom: Kolom<Deal>[] = [
    {
      kunci: 'nama',
      judul: 'Deal',
      urut: (a, b) => a.nama.localeCompare(b.nama),
      render: (d) => (
        /* R50: nama deal dan nama perusahaan elemen blok terpisah */
        <span className="table-cell-stack">
          <span className="t-table-key">{d.nama}</span>
          <span className="t-xs muted">{namaCompany(d.companyId)}</span>
        </span>
      ),
    },
    {
      kunci: 'tahap',
      judul: 'Tahap',
      lebar: 130,
      urut: (a, b) =>
        TAHAP.findIndex((t) => t.id === a.tahap) - TAHAP.findIndex((t) => t.id === b.tahap),
      render: (d) => (
        <Badge tone={TONE_TAHAP[d.tahap]}>{TAHAP.find((t) => t.id === d.tahap)?.nama}</Badge>
      ),
    },
    {
      kunci: 'nilai',
      judul: 'Nilai',
      num: true,
      lebar: 150,
      urut: (a, b) => a.nilai - b.nilai,
      render: (d) => <span className="num">{rupiah(d.nilai)}</span>,
    },
    {
      kunci: 'probabilitas',
      opsional: true,
      judul: 'Probabilitas',
      num: true,
      lebar: 110,
      urut: (a, b) => a.probabilitas - b.probabilitas,
      render: (d) => <span className="num">{persenSingkat(d.probabilitas)}</span>,
    },
    {
      kunci: 'tutup',
      judul: 'Perkiraan tutup',
      lebar: 130,
      urut: (a, b) => a.perkiraanTutup.localeCompare(b.perkiraanTutup),
      render: (d) => (
        <span className="table-cell-stack">
          <span className="t-table">{tanggalRingkas(d.perkiraanTutup)}</span>
          {isMandek(d) && <span className="t-xs" style={{ color: 'var(--warning)' }}>Mandek {hariMandek(d)} hari</span>}
        </span>
      ),
    },
    {
      kunci: 'owner',
      opsional: true,
      judul: 'Penanggung jawab',
      lebar: 190,
      urut: (a, b) => namaUser(a.ownerId).localeCompare(namaUser(b.ownerId)),
      render: (d) => (
        <span className="row gap-8">
          <Avatar nama={namaUser(d.ownerId)} kunci={d.ownerId} size="sm" />
          <span className="t-table truncate">{namaUser(d.ownerId)}</span>
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        judul="Deals"
        keterangan="Pipeline penjualan dalam enam tahap. Geser kartu untuk memindah tahap."
        aksi={
          <>
            <button type="button" className="btn btn-primary">
              <Icon name="plus" size={16} />
              Tambah deal
            </button>
            <button type="button" className="btn btn-secondary">
              Import dari spreadsheet
            </button>
            {jumlahPerubahan > 0 && (
              <button type="button" className="btn btn-ghost" onClick={kembalikanDemo}>
                Kembalikan data demo
              </button>
            )}
          </>
        }
        meta={
          <>
            <span className="titled">
              <span className="t-label muted">Nilai tersaring</span>
              <span className="t-metric-sm num">{rupiahSingkat(nilaiTotal(tersaring))}</span>
            </span>
            <span className="titled">
              <span className="t-label muted">Tertimbang</span>
              <span className="t-metric-sm num">{rupiahSingkat(nilaiTertimbang(tersaring))}</span>
            </span>
          </>
        }
      />

      <Toolbar>
        <SearchInput
          nilai={cari}
          onUbah={setCari}
          label="Cari deal, perusahaan, atau kontak"
          placeholder="Cari deal atau perusahaan"
        />
        <Select
          label="Penanggung jawab"
          nilai={owner}
          onUbah={setOwner}
          lebar={190}
          opsi={[
            { nilai: 'semua', label: 'Semua penanggung jawab' },
            ...USERS.map((u) => ({ nilai: u.id, label: u.nama, keterangan: u.jabatan })),
          ]}
        />
        <Select
          label="Tahap"
          nilai={tahap}
          onUbah={setTahap}
          lebar={170}
          opsi={[
            { nilai: 'semua', label: 'Semua tahap' },
            ...TAHAP.map((t) => ({ nilai: t.id, label: t.nama, keterangan: t.keterangan })),
          ]}
        />
        <ToolbarSpacer />
        {/* Pemicu paling kanan, jadi panelnya menjangkar ke kanan (R16.1) */}
        <ViewSwitcher nilai={view} onUbah={setView} tersedia={VIEW} />
      </Toolbar>

      <div className="section">
        {view === 'kanban' ? (
          <ViewPane kunci="kanban">
            <KanbanBoard deals={tersaring} onPindah={pindahTahap} />
          </ViewPane>
        ) : (
          <ViewPane kunci="table">
            <DataTable
              data={tersaring}
              kolom={kolom}
              kunciBaris={(d) => d.id}
              labelTabel="Daftar deal"
              hrefBaris={(d) => `/app/deals/${d.id}/`}
              pilihan={{
                terpilih,
                onUbah: setTerpilih,
                aksiMassal: () => (
                  <>
                    <button type="button" className="btn btn-secondary btn-sm">
                      Ubah penanggung jawab
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm">
                      Geser tahap
                    </button>
                  </>
                ),
              }}
              kosong={{
                judul: 'Tidak ada deal yang cocok',
                keterangan:
                  'Coba longgarkan penyaring, atau tambah deal baru untuk mulai mengisi pipeline.',
              }}
              kaki={
                <>
                  <span>
                    {tersaring.length} deal dari {deals.length}
                  </span>
                  <span className="num">Total {rupiah(nilaiTotal(tersaring))}</span>
                </>
              }
              kartu={(d) => (
                <>
                  <Avatar nama={namaUser(d.ownerId)} kunci={d.ownerId} />
                  <span className="titled grow">
                    <span className="t-body-strong">{d.nama}</span>
                    <span className="t-xs muted">{namaCompany(d.companyId)}</span>
                    <span className="cardlist-meta t-xs">
                      <span className="num">{rupiah(d.nilai)}</span>
                      <span>{tanggalRingkas(d.perkiraanTutup)}</span>
                    </span>
                  </span>
                  <Badge tone={TONE_TAHAP[d.tahap]}>
                    {TAHAP.find((t) => t.id === d.tahap)?.nama}
                  </Badge>
                </>
              )}
            />
          </ViewPane>
        )}
      </div>

      <div className="section">
        <Placeholder
          judul="Formulir tambah dan ubah deal"
          untuk="Stage 5 menyambungkan tombol Tambah deal dan aksi massal ke modal formulir memakai Modal, Select, dan DatePicker yang sudah ada. Di Stage 3 tombolnya sengaja belum melakukan apa apa, tapi papan kanban, dialog alasan kalah, dan penyimpanan ke localStorage sudah berfungsi penuh karena itu keputusan arsitektur, bukan detail visual."
        />
      </div>

      <p className="t-xs muted" style={{ marginTop: 16 }}>
        Perubahan tahap disimpan di browser Anda sendiri sebagai lapisan timpa, data dasarnya tidak
        ikut berubah. Tombol Kembalikan data demo menghapusnya. Halaman lain masih membaca data
        dasar, penyambungannya dikerjakan Stage 5.{' '}
        <Link href="/app/">Kembali ke dashboard</Link>
      </p>
    </>
  );
}
