'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Icon } from '@/components/Icon';
import { Avatar, Badge, Bar, StatCard } from '@/components/ui/Basic';
import { DataTable, type Kolom } from '@/components/ui/DataTable';
import { SearchInput } from '@/components/ui/Form';
import { PageHeader, Toolbar, ToolbarSpacer, ViewPane, ViewSwitcher, useViewMode } from '@/components/ui/Nav';
import { Modal } from '@/components/ui/Overlay';
import { Select } from '@/components/ui/Select';
import { LABEL_STATUS_LEAD, SUMBER_LEAD, TONE_STATUS_LEAD } from '@/data/settings';
import { USERS, namaSumber, namaUser } from '@/data/relations';
import type { Lead, ViewMode } from '@/data/types';
import { relatifHari, tanggalRingkas } from '@/lib/format';
import { umurHari } from '@/data/clock';
import { useDisclosure } from '@/lib/hooks';
import { useLeadStore } from '@/lib/leadStore';
import { leadAktif } from '@/lib/metrics';

/* ==========================================================================
   Leads.

   Sudut pandangnya sengaja beda dari Deals: yang penting di sini bukan nilai
   Rupiah, tapi apakah lead sudah DIHUBUNGI dan siapa yang bertanggung jawab.
   Karena itu kolom pertama tabelnya nama dan perusahaan, lalu skor, lalu
   kapan terakhir dihubungi, dan lead yang belum pernah dihubungi ditandai
   terang terangan.

   Lead yang sudah dikonversi tetap ada di daftar dengan status Dikonversi,
   tidak dihapus, karena jejak asalnya masih dipakai layar Kontak dan Deal.
   ========================================================================== */

const VIEW: readonly ViewMode[] = ['table', 'card'];

function toneSkor(skor: number) {
  if (skor >= 80) return 'accent' as const;
  if (skor >= 60) return 'brand' as const;
  if (skor >= 40) return 'warning' as const;
  return 'neutral' as const;
}

export default function HalamanLeads() {
  const { leads, tandaiDihubungiMassal, ubahOwnerMassal } = useLeadStore();
  const [view, setView] = useViewMode('leads', VIEW);
  const [cari, setCari] = useState('');
  const [status, setStatus] = useState('semua');
  const [sumber, setSumber] = useState('semua');
  const [owner, setOwner] = useState('semua');
  const [terpilih, setTerpilih] = useState<Set<string>>(new Set());
  const panelOwnerMassal = useDisclosure();

  const tersaring = useMemo(
    () =>
      leads.filter((l) => {
        if (status !== 'semua' && l.status !== status) return false;
        if (sumber !== 'semua' && l.sumber !== sumber) return false;
        if (owner !== 'semua' && l.ownerId !== owner) return false;
        if (!cari.trim()) return true;
        const kata = cari.toLowerCase();
        return (
          l.nama.toLowerCase().includes(kata) ||
          l.perusahaanNama.toLowerCase().includes(kata) ||
          l.email.toLowerCase().includes(kata)
        );
      }),
    [leads, cari, status, sumber, owner],
  );

  const belumDihubungi = leads.filter((l) => l.kontakTerakhir === null && leadAktif(l));
  const terkualifikasi = leads.filter((l) => l.status === 'terkualifikasi');
  const dikonversi = leads.filter((l) => l.status === 'dikonversi');

  const kolom: Kolom<Lead>[] = [
    {
      kunci: 'nama',
      judul: 'Lead',
      urut: (a, b) => a.nama.localeCompare(b.nama),
      render: (l) => (
        <span className="table-cell-stack">
          <span className="t-table-key">{l.nama}</span>
          <span className="t-xs muted">{l.perusahaanNama}</span>
        </span>
      ),
    },
    {
      kunci: 'status',
      judul: 'Status',
      lebar: 130,
      urut: (a, b) => a.status.localeCompare(b.status),
      render: (l) => <Badge tone={TONE_STATUS_LEAD[l.status]}>{LABEL_STATUS_LEAD[l.status]}</Badge>,
    },
    {
      kunci: 'skor',
      judul: 'Skor',
      num: true,
      lebar: 120,
      urut: (a, b) => a.skor - b.skor,
      render: (l) => (
        <span className="stack gap-4">
          <span className="num t-table-key">{l.skor}</span>
          <Bar persen={l.skor} tone={toneSkor(l.skor)} label={`Skor lead ${l.nama}`} />
        </span>
      ),
    },
    {
      kunci: 'sumber',
      opsional: true,
      judul: 'Sumber',
      lebar: 130,
      urut: (a, b) => a.sumber.localeCompare(b.sumber),
      render: (l) => <span className="t-table">{namaSumber(l.sumber)}</span>,
    },
    {
      kunci: 'kontak',
      judul: 'Kontak terakhir',
      lebar: 150,
      urut: (a, b) => (a.kontakTerakhir ?? '').localeCompare(b.kontakTerakhir ?? ''),
      render: (l) =>
        l.kontakTerakhir ? (
          <span className="table-cell-stack">
            <span className="t-table">{tanggalRingkas(l.kontakTerakhir)}</span>
            <span className="t-xs muted">{relatifHari(-umurHari(l.kontakTerakhir))}</span>
          </span>
        ) : (
          <Badge tone="danger">Belum dihubungi</Badge>
        ),
    },
    {
      kunci: 'owner',
      opsional: true,
      judul: 'Penanggung jawab',
      lebar: 190,
      urut: (a, b) => namaUser(a.ownerId).localeCompare(namaUser(b.ownerId)),
      render: (l) => (
        <span className="row gap-8">
          <Avatar nama={namaUser(l.ownerId)} kunci={l.ownerId} size="sm" />
          <span className="t-table truncate">{namaUser(l.ownerId)}</span>
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        judul="Leads"
        keterangan="Prospek yang masuk dari semua sumber, sebelum jadi kontak dan deal."
        aksi={
          <>
            <button type="button" className="btn btn-primary">
              <Icon name="plus" size={16} />
              Tambah lead
            </button>
            <button type="button" className="btn btn-secondary">
              Import lead
            </button>
          </>
        }
      />

      <div className="grid grid-kpi snap-row">
        <StatCard label="Total lead" nilai={`${leads.length}`} keterangan="Semua status" />
        <StatCard
          label="Belum dihubungi"
          nilai={`${belumDihubungi.length}`}
          tone={belumDihubungi.length > 0 ? 'danger' : 'success'}
          keterangan="Ini masalah nomor satu, jangan dibiarkan"
        />
        <StatCard
          label="Terkualifikasi"
          nilai={`${terkualifikasi.length}`}
          tone="accent"
          keterangan="Siap dikonversi jadi kontak dan deal"
        />
        <StatCard
          label="Sudah dikonversi"
          nilai={`${dikonversi.length}`}
          tone="success"
          keterangan="Jejak asalnya tetap bisa ditelusuri"
        />
      </div>

      <div className="section">
        <Toolbar>
          <SearchInput
            nilai={cari}
            onUbah={setCari}
            label="Cari lead, perusahaan, atau email"
            placeholder="Cari lead"
          />
          <Select
            label="Status"
            nilai={status}
            onUbah={setStatus}
            lebar={170}
            opsi={[
              { nilai: 'semua', label: 'Semua status' },
              ...Object.entries(LABEL_STATUS_LEAD).map(([nilai, label]) => ({ nilai, label })),
            ]}
          />
          <Select
            label="Sumber lead"
            nilai={sumber}
            onUbah={setSumber}
            lebar={170}
            opsi={[
              { nilai: 'semua', label: 'Semua sumber' },
              ...SUMBER_LEAD.map((s) => ({ nilai: s.id, label: s.nama })),
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
              kunciBaris={(l) => l.id}
              labelTabel="Daftar lead"
              hrefBaris={(l) => `/app/leads/${l.id}/`}
              pilihan={{
                terpilih,
                onUbah: setTerpilih,
                aksiMassal: () => (
                  <>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={panelOwnerMassal.buka}>
                      Ubah penanggung jawab
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        tandaiDihubungiMassal([...terpilih]);
                        setTerpilih(new Set());
                      }}
                    >
                      Tandai dihubungi
                    </button>
                  </>
                ),
              }}
              kosong={{
                judul: 'Tidak ada lead yang cocok',
                keterangan: 'Longgarkan penyaring, atau tambah lead baru untuk mulai menjaring.',
              }}
              kaki={
                <span>
                  {tersaring.length} lead dari {leads.length}
                </span>
              }
              kartu={(l) => (
                <>
                  <Avatar nama={l.nama} kunci={l.id} inisial={l.inisial} />
                  <span className="titled grow">
                    <span className="t-body-strong">{l.nama}</span>
                    <span className="t-xs muted">{l.perusahaanNama}</span>
                    <span className="cardlist-meta t-xs">
                      <span>Skor {l.skor}</span>
                      <span>{namaSumber(l.sumber)}</span>
                    </span>
                  </span>
                  <Badge tone={TONE_STATUS_LEAD[l.status]}>{LABEL_STATUS_LEAD[l.status]}</Badge>
                </>
              )}
            />
          </ViewPane>
        ) : (
          <ViewPane kunci="card">
            <div className="cardgrid" data-r48="koleksi-data">
              {tersaring.map((l) => (
                <Link
                  key={l.id}
                  href={`/app/leads/${l.id}/`}
                  className="entity-card"
                  data-kind="lead"
                >
                  <div className="entity-card-head">
                    <Avatar nama={l.nama} kunci={l.id} inisial={l.inisial} size="lg" />
                    <span className="titled grow">
                      <span className="t-body-strong">{l.nama}</span>
                      <span className="t-xs muted">{l.jabatan}</span>
                      <span className="t-xs muted">{l.perusahaanNama}</span>
                    </span>
                  </div>

                  <div className="stack gap-4">
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      <span className="t-xs muted">Skor kualifikasi</span>
                      <span className="t-xs num">{l.skor}</span>
                    </div>
                    <Bar persen={l.skor} tone={toneSkor(l.skor)} label={`Skor lead ${l.nama}`} />
                  </div>

                  <div className="row gap-8 wrap">
                    <Badge tone={TONE_STATUS_LEAD[l.status]}>{LABEL_STATUS_LEAD[l.status]}</Badge>
                    <Badge>{namaSumber(l.sumber)}</Badge>
                    {l.kontakTerakhir === null && leadAktif(l) && (
                      <Badge tone="danger" icon="peringatan">
                        Belum dihubungi
                      </Badge>
                    )}
                  </div>

                  <span className="row gap-8 t-xs muted">
                    <Avatar nama={namaUser(l.ownerId)} kunci={l.ownerId} size="sm" />
                    {namaUser(l.ownerId)}
                  </span>
                </Link>
              ))}
            </div>
          </ViewPane>
        )}
      </div>

      <ModalOwnerMassal
        panel={panelOwnerMassal}
        jumlah={terpilih.size}
        onSimpan={(ownerId) => {
          ubahOwnerMassal([...terpilih], ownerId);
          setTerpilih(new Set());
        }}
      />

      <p className="t-xs muted" style={{ marginTop: 16 }}>
        Konversi jadi kontak dan deal dikerjakan dari halaman detail tiap lead.
      </p>
    </>
  );
}

function ModalOwnerMassal({
  panel,
  jumlah,
  onSimpan,
}: {
  panel: ReturnType<typeof useDisclosure>;
  jumlah: number;
  onSimpan: (ownerId: string) => void;
}) {
  const [ownerId, setOwnerId] = useState('');
  return (
    <Modal
      panel={panel}
      judul="Ubah penanggung jawab"
      keterangan={`Berlaku untuk ${jumlah} lead terpilih.`}
      footer={
        <>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!ownerId}
            onClick={() => {
              onSimpan(ownerId);
              setOwnerId('');
              panel.tutup();
            }}
          >
            Terapkan
          </button>
          <button type="button" className="btn btn-secondary" onClick={panel.tutup}>
            Batal
          </button>
        </>
      }
    >
      <Select
        label="Penanggung jawab baru"
        tampilkanLabel
        placeholder="Pilih orang"
        nilai={ownerId}
        onUbah={setOwnerId}
        lebar="100%"
        opsi={USERS.map((u) => ({ nilai: u.id, label: u.nama, keterangan: u.jabatan }))}
      />
    </Modal>
  );
}
