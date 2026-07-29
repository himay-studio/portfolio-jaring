'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Icon } from '@/components/Icon';
import { Avatar, Badge, Placeholder, StatCard } from '@/components/ui/Basic';
import { DataTable, type Kolom } from '@/components/ui/DataTable';
import { SearchInput } from '@/components/ui/Form';
import { PageHeader, Toolbar, ToolbarSpacer, ViewPane, ViewSwitcher, useViewMode } from '@/components/ui/Nav';
import { Select } from '@/components/ui/Select';
import { umurHari } from '@/data/clock';
import {
  QUOTATIONS,
  USERS,
  getContact,
  getDeal,
  hitungPenawaran,
  namaCompany,
  namaUser,
} from '@/data/relations';
import { LABEL_STATUS_PENAWARAN, TONE_STATUS_PENAWARAN } from '@/data/settings';
import type { Quotation, ViewMode } from '@/data/types';
import { relatifHari, rupiah, rupiahSingkat, tanggalRingkas } from '@/lib/format';

/* ==========================================================================
   Penawaran.

   Setiap penawaran menempel pada satu deal, dan perusahaan serta kontaknya
   diturunkan dari deal itu, tidak diketik ulang. Jadi tidak mungkin ada
   penawaran yang menyebut perusahaan berbeda dari dealnya.

   Totalnya SELALU dihitung lewat `hitungPenawaran`, satu fungsi yang sama
   dipakai daftar ini dan halaman detail, supaya angka di dua layar tidak
   pernah berbeda.
   ========================================================================== */

const VIEW: readonly ViewMode[] = ['table', 'card'];

export default function HalamanPenawaran() {
  const [view, setView] = useViewMode('penawaran', VIEW);
  const [cari, setCari] = useState('');
  const [status, setStatus] = useState('semua');
  const [owner, setOwner] = useState('semua');
  const [terpilih, setTerpilih] = useState<Set<string>>(new Set());

  const tersaring = useMemo(
    () =>
      QUOTATIONS.filter((q) => {
        if (status !== 'semua' && q.status !== status) return false;
        if (owner !== 'semua' && q.ownerId !== owner) return false;
        if (!cari.trim()) return true;
        const kata = cari.toLowerCase();
        return (
          q.nomor.toLowerCase().includes(kata) ||
          namaCompany(q.companyId).toLowerCase().includes(kata) ||
          (getDeal(q.dealId)?.nama.toLowerCase().includes(kata) ?? false)
        );
      }),
    [cari, status, owner],
  );

  const totalTersaring = tersaring.reduce((s, q) => s + hitungPenawaran(q).total, 0);
  const terkirim = QUOTATIONS.filter((q) => q.status === 'terkirim');
  const diterima = QUOTATIONS.filter((q) => q.status === 'diterima');

  const kolom: Kolom<Quotation>[] = [
    {
      kunci: 'nomor',
      judul: 'Nomor',
      lebar: 190,
      urut: (a, b) => a.nomor.localeCompare(b.nomor),
      render: (q) => (
        <span className="table-cell-stack">
          <span className="t-table-key mono">{q.nomor}</span>
          <span className="t-xs muted">{tanggalRingkas(q.tanggal)}</span>
        </span>
      ),
    },
    {
      kunci: 'deal',
      judul: 'Deal dan perusahaan',
      urut: (a, b) => namaCompany(a.companyId).localeCompare(namaCompany(b.companyId)),
      render: (q) => (
        <span className="table-cell-stack">
          <span className="t-table">{getDeal(q.dealId)?.nama ?? 'Deal tidak ditemukan'}</span>
          <span className="t-xs muted">{namaCompany(q.companyId)}</span>
        </span>
      ),
    },
    {
      kunci: 'status',
      judul: 'Status',
      lebar: 130,
      urut: (a, b) => a.status.localeCompare(b.status),
      render: (q) => (
        <Badge tone={TONE_STATUS_PENAWARAN[q.status]}>{LABEL_STATUS_PENAWARAN[q.status]}</Badge>
      ),
    },
    {
      kunci: 'berlaku',
      opsional: true,
      judul: 'Berlaku sampai',
      lebar: 150,
      urut: (a, b) => a.berlakuHingga.localeCompare(b.berlakuHingga),
      render: (q) => (
        <span className="table-cell-stack">
          <span className="t-table">{tanggalRingkas(q.berlakuHingga)}</span>
          <span
            className="t-xs"
            style={{ color: umurHari(q.berlakuHingga) > 0 ? 'var(--danger)' : 'var(--text-muted)' }}
          >
            {umurHari(q.berlakuHingga) > 0
              ? 'Sudah lewat'
              : relatifHari(-umurHari(q.berlakuHingga))}
          </span>
        </span>
      ),
    },
    {
      kunci: 'total',
      judul: 'Total',
      num: true,
      lebar: 160,
      urut: (a, b) => hitungPenawaran(a).total - hitungPenawaran(b).total,
      render: (q) => {
        const r = hitungPenawaran(q);
        return (
          <span className="table-cell-stack" style={{ alignItems: 'flex-end' }}>
            <span className="t-table-key num">{rupiah(r.total)}</span>
            <span className="t-xs muted num">{q.items.length} baris item</span>
          </span>
        );
      },
    },
    {
      kunci: 'owner',
      opsional: true,
      judul: 'Dibuat oleh',
      lebar: 190,
      urut: (a, b) => namaUser(a.ownerId).localeCompare(namaUser(b.ownerId)),
      render: (q) => (
        <span className="row gap-8">
          <Avatar nama={namaUser(q.ownerId)} kunci={q.ownerId} size="sm" />
          <span className="t-table truncate">{namaUser(q.ownerId)}</span>
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        judul="Penawaran"
        keterangan="Dokumen penawaran per deal, lengkap dengan baris item, pajak, dan status kirim."
        aksi={
          <>
            <button type="button" className="btn btn-primary">
              <Icon name="plus" size={16} />
              Buat penawaran
            </button>
            <Link href="/app/deals/" className="btn btn-secondary">
              Pilih deal dulu
            </Link>
          </>
        }
      />

      <div className="grid grid-kpi snap-row">
        <StatCard label="Total penawaran" nilai={`${QUOTATIONS.length}`} />
        <StatCard
          label="Menunggu tanggapan"
          nilai={`${terkirim.length}`}
          tone="info"
          keterangan="Status terkirim, belum diterima atau ditolak"
        />
        <StatCard label="Diterima" nilai={`${diterima.length}`} tone="success" />
        <StatCard
          label="Nilai tersaring"
          nilai={rupiahSingkat(totalTersaring)}
          tone="accent"
          keterangan="Sudah termasuk diskon dan pajak"
        />
      </div>

      <div className="section">
        <Toolbar>
          <SearchInput
            nilai={cari}
            onUbah={setCari}
            label="Cari nomor penawaran, deal, atau perusahaan"
            placeholder="Cari penawaran"
          />
          <Select
            label="Status"
            nilai={status}
            onUbah={setStatus}
            lebar={170}
            opsi={[
              { nilai: 'semua', label: 'Semua status' },
              ...Object.entries(LABEL_STATUS_PENAWARAN).map(([nilai, label]) => ({ nilai, label })),
            ]}
          />
          <Select
            label="Dibuat oleh"
            nilai={owner}
            onUbah={setOwner}
            lebar={190}
            opsi={[
              { nilai: 'semua', label: 'Semua pembuat' },
              ...USERS.map((u) => ({ nilai: u.id, label: u.nama, keterangan: u.jabatan })),
            ]}
          />
          <ToolbarSpacer />
          <ViewSwitcher nilai={view} onUbah={setView} tersedia={VIEW} />
        </Toolbar>
      </div>

      <div className="section">
        {view === 'table' ? (
          <ViewPane kunci="table">
            <DataTable
              data={tersaring}
              kolom={kolom}
              kunciBaris={(q) => q.id}
              labelTabel="Daftar penawaran"
              hrefBaris={(q) => `/app/penawaran/${q.id}/`}
              pilihan={{
                terpilih,
                onUbah: setTerpilih,
                aksiMassal: () => (
                  <button type="button" className="btn btn-secondary btn-sm">
                    Tandai terkirim
                  </button>
                ),
              }}
              kosong={{
                judul: 'Tidak ada penawaran yang cocok',
                keterangan:
                  'Longgarkan penyaring, atau buat penawaran baru dari salah satu deal yang sudah lolos kualifikasi.',
              }}
              kaki={
                <>
                  <span>
                    {tersaring.length} penawaran dari {QUOTATIONS.length}
                  </span>
                  <span className="num">Total {rupiah(totalTersaring)}</span>
                </>
              }
              kartu={(q) => (
                <>
                  <span className="titled grow">
                    <span className="t-body-strong mono">{q.nomor}</span>
                    <span className="t-xs muted">{namaCompany(q.companyId)}</span>
                    <span className="cardlist-meta t-xs">
                      <span className="num">{rupiah(hitungPenawaran(q).total)}</span>
                      <span>Berlaku sampai {tanggalRingkas(q.berlakuHingga)}</span>
                    </span>
                  </span>
                  <Badge tone={TONE_STATUS_PENAWARAN[q.status]}>
                    {LABEL_STATUS_PENAWARAN[q.status]}
                  </Badge>
                </>
              )}
            />
          </ViewPane>
        ) : (
          <ViewPane kunci="card">
            <div className="cardgrid" data-r48="koleksi-data">
              {tersaring.map((q) => {
                const r = hitungPenawaran(q);
                const kontak = getContact(q.contactId);
                return (
                  <Link
                    key={q.id}
                    href={`/app/penawaran/${q.id}/`}
                    className="entity-card"
                    data-kind="penawaran"
                  >
                    <div className="entity-card-head">
                      <span className="titled grow">
                        <span className="t-body-strong mono">{q.nomor}</span>
                        <span className="t-xs muted">{getDeal(q.dealId)?.nama}</span>
                        <span className="t-xs muted">{namaCompany(q.companyId)}</span>
                      </span>
                      <Badge tone={TONE_STATUS_PENAWARAN[q.status]}>
                        {LABEL_STATUS_PENAWARAN[q.status]}
                      </Badge>
                    </div>

                    <div className="stack gap-4">
                      <div className="row" style={{ justifyContent: 'space-between' }}>
                        <span className="t-xs muted">Subtotal</span>
                        <span className="t-xs num">{rupiah(r.subtotal)}</span>
                      </div>
                      {r.diskon > 0 && (
                        <div className="row" style={{ justifyContent: 'space-between' }}>
                          <span className="t-xs muted">Diskon {q.diskonPersen} persen</span>
                          <span className="t-xs num">{rupiah(-r.diskon)}</span>
                        </div>
                      )}
                      <div className="row" style={{ justifyContent: 'space-between' }}>
                        <span className="t-xs muted">PPN {q.pajakPersen} persen</span>
                        <span className="t-xs num">{rupiah(r.pajak)}</span>
                      </div>
                      <div className="hr" style={{ margin: '4px 0' }} />
                      <div className="row" style={{ justifyContent: 'space-between' }}>
                        <span className="t-body-strong">Total</span>
                        <span className="t-body-strong num">{rupiah(r.total)}</span>
                      </div>
                    </div>

                    {kontak && <span className="t-xs muted">Untuk {kontak.nama}</span>}
                  </Link>
                );
              })}
            </div>
          </ViewPane>
        )}
      </div>

      <div className="section">
        <Placeholder
          judul="Editor baris item penawaran"
          untuk="Stage 5 membuat editor baris item dengan stepper qty, harga satuan, diskon, dan pilihan pajak, memakai hitungPenawaran di src/data/relations.ts sebagai satu satunya sumber hitungan. Termasuk aksi kirim, terima, dan tolak yang mengubah status."
        />
      </div>
    </>
  );
}
