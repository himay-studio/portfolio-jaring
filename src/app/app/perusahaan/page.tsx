'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Icon } from '@/components/Icon';
import { Avatar, Badge, StatCard } from '@/components/ui/Basic';
import { DataTable, type Kolom } from '@/components/ui/DataTable';
import { SearchInput } from '@/components/ui/Form';
import { PageHeader, Toolbar, ToolbarSpacer, ViewPane, ViewSwitcher, useViewMode } from '@/components/ui/Nav';
import { Select } from '@/components/ui/Select';
import { COMPANIES, CONTACTS, USERS, namaUser } from '@/data/relations';
import type { Company, ViewMode } from '@/data/types';
import { angka, rupiahSingkat } from '@/lib/format';
import { isIdBaru, useCrmExtras } from '@/lib/crmExtras';
import { useDealStore } from '@/lib/dealStore';
import { dealBerjalan, nilaiTotal } from '@/lib/metrics';

/* ==========================================================================
   Perusahaan.

   Satu perusahaan bisa punya banyak kontak dan banyak deal, jadi kolom yang
   berguna bukan alamatnya, tapi berapa orang yang sudah kita kenal di sana
   dan berapa nilai yang sedang berjalan. Keduanya dihitung lewat
   `contactsByCompany` dan `dealsByCompany`, bukan disimpan di record.
   ========================================================================== */

const VIEW: readonly ViewMode[] = ['table', 'card'];

const LABEL_UKURAN = {
  kecil: 'Kecil',
  menengah: 'Menengah',
  besar: 'Besar',
} as const;

export default function HalamanPerusahaan() {
  const [view, setView] = useViewMode('perusahaan', VIEW);
  const [cari, setCari] = useState('');
  const [industri, setIndustri] = useState('semua');
  const [owner, setOwner] = useState('semua');
  const [terpilih, setTerpilih] = useState<Set<string>>(new Set());

  /* Perusahaan hasil konversi lead di sesi ini hidup di localStorage, sama
     seperti kontak hasil konversi di halaman Kontak. */
  const { contactsBaru, companiesBaru } = useCrmExtras();
  const { deals } = useDealStore();
  const companies = useMemo(() => [...COMPANIES, ...companiesBaru], [companiesBaru]);
  const contacts = useMemo(() => [...CONTACTS, ...contactsBaru], [contactsBaru]);
  const contactsByCompany = (companyId: string) => contacts.filter((k) => k.companyId === companyId);
  const dealsByCompany = (companyId: string) => deals.filter((d) => d.companyId === companyId);

  const daftarIndustri = useMemo(
    () => [...new Set(companies.map((c) => c.industri))].sort(),
    [companies],
  );

  const tersaring = useMemo(
    () =>
      companies.filter((c) => {
        if (industri !== 'semua' && c.industri !== industri) return false;
        if (owner !== 'semua' && c.ownerId !== owner) return false;
        if (!cari.trim()) return true;
        const kata = cari.toLowerCase();
        return (
          c.nama.toLowerCase().includes(kata) ||
          c.industri.toLowerCase().includes(kata) ||
          c.kota.toLowerCase().includes(kata)
        );
      }),
    [companies, cari, industri, owner],
  );

  const kolom: Kolom<Company>[] = [
    {
      kunci: 'nama',
      judul: 'Perusahaan',
      urut: (a, b) => a.nama.localeCompare(b.nama),
      render: (c) => (
        <span className="table-cell-stack">
          <span className="t-table-key">{c.nama}</span>
          <span className="t-xs muted">
            {c.kota}, {c.provinsi}
          </span>
        </span>
      ),
    },
    {
      kunci: 'industri',
      judul: 'Industri',
      lebar: 160,
      urut: (a, b) => a.industri.localeCompare(b.industri),
      render: (c) => <span className="t-table">{c.industri}</span>,
    },
    {
      kunci: 'ukuran',
      opsional: true,
      judul: 'Ukuran',
      lebar: 140,
      urut: (a, b) => a.jumlahKaryawan - b.jumlahKaryawan,
      render: (c) => (
        <span className="table-cell-stack">
          <Badge>{LABEL_UKURAN[c.ukuran]}</Badge>
          <span className="t-xs muted num">{angka(c.jumlahKaryawan)} karyawan</span>
        </span>
      ),
    },
    {
      kunci: 'kontak',
      judul: 'Kontak',
      num: true,
      lebar: 90,
      urut: (a, b) => contactsByCompany(a.id).length - contactsByCompany(b.id).length,
      render: (c) => <span className="num">{contactsByCompany(c.id).length}</span>,
    },
    {
      kunci: 'deal',
      judul: 'Deal berjalan',
      num: true,
      lebar: 150,
      urut: (a, b) =>
        nilaiTotal(dealsByCompany(a.id).filter(dealBerjalan)) -
        nilaiTotal(dealsByCompany(b.id).filter(dealBerjalan)),
      render: (c) => {
        const deal = dealsByCompany(c.id).filter(dealBerjalan);
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
      render: (c) => (
        <span className="row gap-8">
          <Avatar nama={namaUser(c.ownerId)} kunci={c.ownerId} size="sm" />
          <span className="t-table truncate">{namaUser(c.ownerId)}</span>
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        judul="Perusahaan"
        keterangan="Akun pelanggan dan calon pelanggan, lengkap dengan kontak dan deal di dalamnya."
        aksi={
          <>
            <button type="button" className="btn btn-primary">
              <Icon name="plus" size={16} />
              Tambah perusahaan
            </button>
            <Link href="/app/kontak/" className="btn btn-secondary">
              Lihat kontak
            </Link>
          </>
        }
      />

      <div className="grid grid-kpi snap-row">
        <StatCard label="Total perusahaan" nilai={`${companies.length}`} />
        <StatCard
          label="Punya deal berjalan"
          nilai={`${companies.filter((c) => dealsByCompany(c.id).some(dealBerjalan)).length}`}
          tone="success"
        />
        <StatCard label="Industri berbeda" nilai={`${daftarIndustri.length}`} tone="info" />
        <StatCard
          label="Nilai berjalan"
          nilai={rupiahSingkat(
            nilaiTotal(companies.flatMap((c) => dealsByCompany(c.id).filter(dealBerjalan))),
          )}
          tone="accent"
        />
      </div>

      <div className="section">
        <Toolbar>
          <SearchInput
            nilai={cari}
            onUbah={setCari}
            label="Cari perusahaan, industri, atau kota"
            placeholder="Cari perusahaan"
          />
          <Select
            label="Industri"
            nilai={industri}
            onUbah={setIndustri}
            lebar={200}
            opsi={[
              { nilai: 'semua', label: 'Semua industri' },
              ...daftarIndustri.map((i) => ({ nilai: i, label: i })),
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
              kunciBaris={(c) => c.id}
              labelTabel="Daftar perusahaan"
              hrefBaris={(c) => (isIdBaru(c.id) ? '' : `/app/perusahaan/${c.id}/`)}
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
                judul: 'Tidak ada perusahaan yang cocok',
                keterangan: 'Longgarkan penyaring, atau tambah perusahaan baru.',
              }}
              kaki={
                <span>
                  {tersaring.length} perusahaan dari {companies.length}
                </span>
              }
              kartu={(c) => (
                <>
                  <Avatar nama={c.nama} kunci={c.id} />
                  <span className="titled grow">
                    <span className="t-body-strong">{c.nama}</span>
                    <span className="t-xs muted">{c.industri}</span>
                    <span className="cardlist-meta t-xs">
                      <span>
                        {c.kota}, {c.provinsi}
                      </span>
                      <span>{contactsByCompany(c.id).length} kontak</span>
                    </span>
                  </span>
                </>
              )}
            />
          </ViewPane>
        ) : (
          <ViewPane kunci="card">
            <div className="cardgrid" data-r48="koleksi-data">
              {tersaring.map((c) => {
                const deal = dealsByCompany(c.id).filter(dealBerjalan);
                const kontak = contactsByCompany(c.id);
                const isi = (
                  <>
                    <div className="entity-card-head">
                      <Avatar nama={c.nama} kunci={c.id} size="lg" />
                      <span className="titled grow">
                        <span className="t-body-strong">{c.nama}</span>
                        <span className="t-xs muted">{c.industri}</span>
                        <span className="t-xs muted">
                          {c.kota}, {c.provinsi}
                        </span>
                      </span>
                    </div>

                    <div className="row gap-8 wrap">
                      <Badge>{LABEL_UKURAN[c.ukuran]}</Badge>
                      <Badge tone="info">{angka(c.jumlahKaryawan)} karyawan</Badge>
                      <Badge tone={kontak.length > 0 ? 'brand' : 'neutral'}>
                        {kontak.length} kontak
                      </Badge>
                    </div>

                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      <span className="t-xs muted">Deal berjalan</span>
                      <span className="t-body-strong num">
                        {deal.length > 0 ? rupiahSingkat(nilaiTotal(deal)) : 'Tidak ada'}
                      </span>
                    </div>

                    <span className="row gap-8 t-xs muted">
                      <Avatar nama={namaUser(c.ownerId)} kunci={c.ownerId} size="sm" />
                      {namaUser(c.ownerId)}
                    </span>
                  </>
                );
                return isIdBaru(c.id) ? (
                  <div key={c.id} className="entity-card" data-kind="perusahaan">
                    {isi}
                  </div>
                ) : (
                  <Link key={c.id} href={`/app/perusahaan/${c.id}/`} className="entity-card" data-kind="perusahaan">
                    {isi}
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
