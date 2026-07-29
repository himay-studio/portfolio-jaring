'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Icon } from '@/components/Icon';
import { Avatar, Badge, StatCard } from '@/components/ui/Basic';
import { DataTable, type Kolom } from '@/components/ui/DataTable';
import { SearchInput } from '@/components/ui/Form';
import { PageHeader, Toolbar, ToolbarSpacer, ViewPane, ViewSwitcher, useViewMode } from '@/components/ui/Nav';
import { Select } from '@/components/ui/Select';
import {
  COMPANIES,
  CONTACTS,
  USERS,
  dealsByContact,
  namaCompany,
  namaSumber,
  namaUser,
} from '@/data/relations';
import type { Contact, ViewMode } from '@/data/types';
import { rupiahSingkat, tanggalRingkas } from '@/lib/format';
import { dealBerjalan, nilaiTotal } from '@/lib/metrics';

/* ==========================================================================
   Kontak. WAJIB punya Table plus Card (HIM-283).

   Table dipakai kalau yang dicari cepat adalah satu orang di antara banyak.
   Card dipakai kalau yang dicari adalah gambaran siapa saja yang dipegang,
   karena kartu memuat lebih banyak konteks per orang.

   Kolom "Deal" di bawah menjumlah deal BERJALAN milik kontak itu. Itu
   penyambungan relasi lewat `dealsByContact`, bukan angka yang disimpan di
   record kontak, jadi tidak mungkin basi.
   ========================================================================== */

const VIEW: readonly ViewMode[] = ['table', 'card'];

export default function HalamanKontak() {
  const [view, setView] = useViewMode('kontak', VIEW);
  const [cari, setCari] = useState('');
  const [perusahaan, setPerusahaan] = useState('semua');
  const [owner, setOwner] = useState('semua');
  const [terpilih, setTerpilih] = useState<Set<string>>(new Set());

  const tersaring = useMemo(
    () =>
      CONTACTS.filter((k) => {
        if (perusahaan !== 'semua' && k.companyId !== perusahaan) return false;
        if (owner !== 'semua' && k.ownerId !== owner) return false;
        if (!cari.trim()) return true;
        const kata = cari.toLowerCase();
        return (
          k.nama.toLowerCase().includes(kata) ||
          k.jabatan.toLowerCase().includes(kata) ||
          k.email.toLowerCase().includes(kata) ||
          namaCompany(k.companyId).toLowerCase().includes(kata)
        );
      }),
    [cari, perusahaan, owner],
  );

  const dariKonversi = CONTACTS.filter((k) => k.asalLeadId !== undefined);

  const kolom: Kolom<Contact>[] = [
    {
      kunci: 'nama',
      judul: 'Kontak',
      urut: (a, b) => a.nama.localeCompare(b.nama),
      render: (k) => (
        <span className="table-cell-stack">
          <span className="t-table-key">{k.nama}</span>
          <span className="t-xs muted">{k.jabatan}</span>
        </span>
      ),
    },
    {
      kunci: 'perusahaan',
      judul: 'Perusahaan',
      urut: (a, b) => namaCompany(a.companyId).localeCompare(namaCompany(b.companyId)),
      render: (k) => <span className="t-table">{namaCompany(k.companyId)}</span>,
    },
    {
      kunci: 'kontak',
      opsional: true,
      judul: 'Kontak',
      render: (k) => (
        <span className="table-cell-stack">
          <span className="t-table truncate">{k.email}</span>
          <span className="t-xs muted">{k.telepon}</span>
        </span>
      ),
    },
    {
      kunci: 'deal',
      judul: 'Deal berjalan',
      num: true,
      lebar: 150,
      urut: (a, b) =>
        nilaiTotal(dealsByContact(a.id).filter(dealBerjalan)) -
        nilaiTotal(dealsByContact(b.id).filter(dealBerjalan)),
      render: (k) => {
        const deal = dealsByContact(k.id).filter(dealBerjalan);
        if (deal.length === 0) return <span className="t-table muted">Tidak ada</span>;
        return (
          <span className="table-cell-stack" style={{ alignItems: 'flex-end' }}>
            <span className="t-table-key num">{rupiahSingkat(nilaiTotal(deal))}</span>
            <span className="t-xs muted num">{deal.length} deal</span>
          </span>
        );
      },
    },
    {
      kunci: 'owner',
      opsional: true,
      judul: 'Penanggung jawab',
      lebar: 190,
      urut: (a, b) => namaUser(a.ownerId).localeCompare(namaUser(b.ownerId)),
      render: (k) => (
        <span className="row gap-8">
          <Avatar nama={namaUser(k.ownerId)} kunci={k.ownerId} size="sm" />
          <span className="t-table truncate">{namaUser(k.ownerId)}</span>
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        judul="Kontak"
        keterangan="Orang yang bisa dihubungi di setiap perusahaan pelanggan."
        aksi={
          <>
            <button type="button" className="btn btn-primary">
              <Icon name="plus" size={16} />
              Tambah kontak
            </button>
            <Link href="/app/perusahaan/" className="btn btn-secondary">
              Lihat perusahaan
            </Link>
          </>
        }
      />

      <div className="grid grid-kpi snap-row">
        <StatCard label="Total kontak" nilai={`${CONTACTS.length}`} />
        <StatCard
          label="Perusahaan terwakili"
          nilai={`${new Set(CONTACTS.map((k) => k.companyId)).size}`}
          tone="info"
          keterangan={`dari ${COMPANIES.length} perusahaan`}
        />
        <StatCard
          label="Dari konversi lead"
          nilai={`${dariKonversi.length}`}
          tone="accent"
          keterangan="Asal usulnya masih bisa ditelusuri"
        />
        <StatCard
          label="Punya deal berjalan"
          nilai={`${CONTACTS.filter((k) => dealsByContact(k.id).some(dealBerjalan)).length}`}
          tone="success"
        />
      </div>

      <div className="section">
        <Toolbar>
          <SearchInput
            nilai={cari}
            onUbah={setCari}
            label="Cari kontak, jabatan, email, atau perusahaan"
            placeholder="Cari kontak"
          />
          <Select
            label="Perusahaan"
            nilai={perusahaan}
            onUbah={setPerusahaan}
            lebar={230}
            opsi={[
              { nilai: 'semua', label: 'Semua perusahaan' },
              ...COMPANIES.map((c) => ({ nilai: c.id, label: c.nama, keterangan: c.industri })),
            ]}
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
              kunciBaris={(k) => k.id}
              labelTabel="Daftar kontak"
              hrefBaris={(k) => `/app/kontak/${k.id}/`}
              pilihan={{
                terpilih,
                onUbah: setTerpilih,
                aksiMassal: () => (
                  <button type="button" className="btn btn-secondary btn-sm">
                    Ubah penanggung jawab
                  </button>
                ),
              }}
              kosong={{
                judul: 'Tidak ada kontak yang cocok',
                keterangan: 'Longgarkan penyaring, atau tambah kontak baru.',
              }}
              kaki={
                <span>
                  {tersaring.length} kontak dari {CONTACTS.length}
                </span>
              }
              kartu={(k) => (
                <>
                  <Avatar nama={k.nama} kunci={k.id} inisial={k.inisial} />
                  <span className="titled grow">
                    <span className="t-body-strong">{k.nama}</span>
                    <span className="t-xs muted">{k.jabatan}</span>
                    <span className="cardlist-meta t-xs">
                      <span>{namaCompany(k.companyId)}</span>
                    </span>
                  </span>
                </>
              )}
            />
          </ViewPane>
        ) : (
          <ViewPane kunci="card">
            <div className="cardgrid" data-r48="koleksi-data">
              {tersaring.map((k) => {
                const deal = dealsByContact(k.id).filter(dealBerjalan);
                return (
                  <Link
                    key={k.id}
                    href={`/app/kontak/${k.id}/`}
                    className="entity-card"
                    data-kind="kontak"
                  >
                    <div className="entity-card-head">
                      <Avatar nama={k.nama} kunci={k.id} inisial={k.inisial} size="lg" />
                      <span className="titled grow">
                        <span className="t-body-strong">{k.nama}</span>
                        <span className="t-xs muted">{k.jabatan}</span>
                        <span className="t-xs muted">{namaCompany(k.companyId)}</span>
                      </span>
                    </div>

                    <div className="stack gap-6">
                      <span className="row gap-8 t-xs muted">
                        <Icon name="email" size={14} />
                        <span className="truncate">{k.email}</span>
                      </span>
                      <span className="row gap-8 t-xs muted">
                        <Icon name="telepon" size={14} />
                        {k.telepon}
                      </span>
                    </div>

                    <div className="row gap-8 wrap">
                      <Badge tone={deal.length > 0 ? 'success' : 'neutral'}>
                        {deal.length > 0
                          ? `${deal.length} deal, ${rupiahSingkat(nilaiTotal(deal))}`
                          : 'Tanpa deal berjalan'}
                      </Badge>
                      {k.asalLeadId && <Badge tone="accent">Dari lead</Badge>}
                    </div>

                    <span className="t-xs muted">
                      Masuk {tanggalRingkas(k.dibuatPada)} lewat {namaSumber(k.sumber)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </ViewPane>
        )}
      </div>
    </>
  );
}
