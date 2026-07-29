'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Icon } from '@/components/Icon';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { Avatar, Badge } from '@/components/ui/Basic';
import { DataTable, type Kolom } from '@/components/ui/DataTable';
import { DatePicker } from '@/components/ui/DatePicker';
import { Field, Input, SearchInput, Textarea } from '@/components/ui/Form';
import { PageHeader, Toolbar, ToolbarSpacer, ViewPane, ViewSwitcher, useViewMode } from '@/components/ui/Nav';
import { Modal } from '@/components/ui/Overlay';
import { Select } from '@/components/ui/Select';
import { hari } from '@/data/clock';
import { ALASAN_KALAH, SUMBER_LEAD, TAHAP, TAHAP_AKTIF } from '@/data/settings';
import { COMPANIES, CONTACTS, USERS, contactsByCompany, getContact, namaCompany, namaUser } from '@/data/relations';
import type { AlasanKalahId, Deal, TahapId, Tone, ViewMode } from '@/data/types';
import { persenSingkat, rupiah, rupiahSingkat, tanggalRingkas } from '@/lib/format';
import { useDealStore } from '@/lib/dealStore';
import { useDisclosure } from '@/lib/hooks';
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
  const { deals, pindahTahap, pindahTahapMassal, ubahOwnerMassal, tambahDeal, kembalikanDemo, jumlahPerubahan } =
    useDealStore();
  const [view, setView] = useViewMode('deals', VIEW);

  /* Filter hidup di ATAS pemindah view, jadi ganti view tidak meresetnya. */
  const [cari, setCari] = useState('');
  const [owner, setOwner] = useState('semua');
  const [tahap, setTahap] = useState('semua');
  const [terpilih, setTerpilih] = useState<Set<string>>(new Set());

  const panelTambah = useDisclosure();
  const panelOwnerMassal = useDisclosure();
  const panelTahapMassal = useDisclosure();

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
            <button type="button" className="btn btn-primary" onClick={panelTambah.buka}>
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
                    <button type="button" className="btn btn-secondary btn-sm" onClick={panelOwnerMassal.buka}>
                      Ubah penanggung jawab
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={panelTahapMassal.buka}>
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

      <ModalTambahDeal panel={panelTambah} onSimpan={tambahDeal} />
      <ModalOwnerMassal
        panel={panelOwnerMassal}
        jumlah={terpilih.size}
        onSimpan={(ownerId) => {
          ubahOwnerMassal([...terpilih], ownerId);
          setTerpilih(new Set());
        }}
      />
      <ModalTahapMassal
        panel={panelTahapMassal}
        jumlah={terpilih.size}
        onSimpan={(tahapTujuan, alasan) => {
          pindahTahapMassal([...terpilih], tahapTujuan, alasan);
          setTerpilih(new Set());
        }}
      />

      <p className="t-xs muted" style={{ marginTop: 16 }}>
        Perubahan disimpan di browser Anda sendiri sebagai lapisan timpa, data dasarnya tidak ikut
        berubah. Tombol Kembalikan data demo menghapusnya.{' '}
        <Link href="/app/">Kembali ke dashboard</Link>
      </p>
    </>
  );
}

/* -------------------------------------------------------------------------
   Modal tambah deal.
   ------------------------------------------------------------------------- */

function ModalTambahDeal({
  panel,
  onSimpan,
}: {
  panel: ReturnType<typeof useDisclosure>;
  onSimpan: (input: Parameters<ReturnType<typeof useDealStore>['tambahDeal']>[0]) => void;
}) {
  const [nama, setNama] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [contactId, setContactId] = useState('');
  const [ownerId, setOwnerId] = useState(USERS[1]?.id ?? '');
  const [nilai, setNilai] = useState('');
  const [tahapPilih, setTahapPilih] = useState<TahapId>('prospek');
  const [perkiraanTutup, setPerkiraanTutup] = useState(hari(30));
  const [sumber, setSumber] = useState<string>(SUMBER_LEAD[0]?.id ?? 'website');
  const [catatan, setCatatan] = useState('');

  const kontakPerusahaan = companyId ? contactsByCompany(companyId) : [];
  const sah = nama.trim() && companyId && contactId && ownerId && Number(nilai) > 0;

  function tutupDanReset() {
    panel.tutup();
    setNama('');
    setCompanyId('');
    setContactId('');
    setNilai('');
    setCatatan('');
    setTahapPilih('prospek');
  }

  return (
    <Modal
      panel={{ ...panel, tutup: tutupDanReset }}
      judul="Tambah deal"
      keterangan="Deal baru masuk ke pipeline dan langsung terlihat di papan kanban serta tabel."
      lebar="wide"
      footer={
        <>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!sah}
            onClick={() => {
              onSimpan({
                nama: nama.trim(),
                companyId,
                contactId,
                ownerId,
                nilai: Number(nilai),
                tahap: tahapPilih,
                perkiraanTutup,
                sumber: sumber as Deal['sumber'],
                catatan: catatan.trim() || 'Deal baru dari modal Tambah deal.',
              });
              tutupDanReset();
            }}
          >
            Simpan deal
          </button>
          <button type="button" className="btn btn-secondary" onClick={tutupDanReset}>
            Batal
          </button>
        </>
      }
    >
      <div className="stack gap-16">
        <Field label="Nama deal" htmlFor="deal-nama">
          <Input
            id="deal-nama"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Contoh: Paket Tim Sales 20 pengguna"
          />
        </Field>

        <div className="grid grid-2">
          <Select
            label="Perusahaan"
            tampilkanLabel
            placeholder="Pilih perusahaan"
            nilai={companyId}
            onUbah={(v) => {
              setCompanyId(v);
              setContactId('');
            }}
            lebar="100%"
            opsi={COMPANIES.map((c) => ({ nilai: c.id, label: c.nama, keterangan: c.industri }))}
          />
          <Select
            label="Kontak utama"
            tampilkanLabel
            placeholder={companyId ? 'Pilih kontak' : 'Pilih perusahaan dulu'}
            nilai={contactId}
            onUbah={setContactId}
            nonaktif={!companyId}
            lebar="100%"
            opsi={kontakPerusahaan.map((k) => ({ nilai: k.id, label: k.nama, keterangan: k.jabatan }))}
          />
        </div>

        <div className="grid grid-2">
          <Field label="Nilai deal" htmlFor="deal-nilai" keterangan="Dalam Rupiah, tanpa titik">
            <Input
              id="deal-nilai"
              type="number"
              min={0}
              value={nilai}
              onChange={(e) => setNilai(e.target.value)}
              placeholder="50000000"
            />
          </Field>
          <Select
            label="Penanggung jawab"
            tampilkanLabel
            nilai={ownerId}
            onUbah={setOwnerId}
            lebar="100%"
            opsi={USERS.filter((u) => u.peran === 'ae' || u.peran === 'manajer').map((u) => ({
              nilai: u.id,
              label: u.nama,
              keterangan: u.jabatan,
            }))}
          />
        </div>

        <div className="grid grid-2">
          <Select
            label="Tahap awal"
            tampilkanLabel
            nilai={tahapPilih}
            onUbah={(v) => setTahapPilih(v as TahapId)}
            lebar="100%"
            opsi={TAHAP_AKTIF.map((t) => ({ nilai: t.id, label: t.nama, keterangan: t.keterangan }))}
          />
          <DatePicker
            label="Perkiraan tutup"
            tampilkanLabel
            nilai={perkiraanTutup}
            onUbah={setPerkiraanTutup}
            lebar="100%"
          />
        </div>

        <Select
          label="Sumber"
          tampilkanLabel
          nilai={sumber}
          onUbah={setSumber}
          lebar="100%"
          opsi={SUMBER_LEAD.map((s) => ({ nilai: s.id, label: s.nama }))}
        />

        <Field label="Catatan" htmlFor="deal-catatan">
          <Textarea id="deal-catatan" value={catatan} onChange={(e) => setCatatan(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------
   Modal aksi massal: ubah penanggung jawab.
   ------------------------------------------------------------------------- */

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
      keterangan={`Berlaku untuk ${jumlah} deal terpilih.`}
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

/* -------------------------------------------------------------------------
   Modal aksi massal: geser tahap. Sama seperti papan kanban, memindah ke
   tahap Kalah wajib membawa alasan (ditegakkan juga di `useDealStore`).
   ------------------------------------------------------------------------- */

function ModalTahapMassal({
  panel,
  jumlah,
  onSimpan,
}: {
  panel: ReturnType<typeof useDisclosure>;
  jumlah: number;
  onSimpan: (tahap: TahapId, alasan?: { alasanKalahId: AlasanKalahId; catatan: string }) => void;
}) {
  const [tahapTujuan, setTahapTujuan] = useState<TahapId>('kualifikasi');
  const [alasanKalah, setAlasanKalah] = useState('');
  const [catatanKalah, setCatatanKalah] = useState('');

  const butuhAlasan = tahapTujuan === 'kalah';
  const sah = !butuhAlasan || !!alasanKalah;

  function tutupDanReset() {
    panel.tutup();
    setAlasanKalah('');
    setCatatanKalah('');
  }

  return (
    <Modal
      panel={{ ...panel, tutup: tutupDanReset }}
      judul="Geser tahap"
      keterangan={`Berlaku untuk ${jumlah} deal terpilih.`}
      footer={
        <>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!sah}
            onClick={() => {
              onSimpan(
                tahapTujuan,
                butuhAlasan ? { alasanKalahId: alasanKalah as AlasanKalahId, catatan: catatanKalah } : undefined,
              );
              tutupDanReset();
            }}
          >
            Geser {jumlah} deal
          </button>
          <button type="button" className="btn btn-secondary" onClick={tutupDanReset}>
            Batal
          </button>
        </>
      }
    >
      <div className="stack gap-16">
        <Select
          label="Tahap tujuan"
          tampilkanLabel
          nilai={tahapTujuan}
          onUbah={(v) => setTahapTujuan(v as TahapId)}
          lebar="100%"
          opsi={TAHAP.map((t) => ({ nilai: t.id, label: t.nama, keterangan: t.keterangan }))}
        />

        {butuhAlasan && (
          <>
            <Select
              label="Alasan kalah"
              tampilkanLabel
              placeholder="Pilih alasan"
              nilai={alasanKalah}
              onUbah={setAlasanKalah}
              lebar="100%"
              opsi={ALASAN_KALAH.filter((a) => a.aktif).map((a) => ({ nilai: a.id, label: a.nama }))}
            />
            <Field label="Catatan tambahan" htmlFor="tahap-massal-catatan">
              <Textarea
                id="tahap-massal-catatan"
                value={catatanKalah}
                onChange={(e) => setCatatanKalah(e.target.value)}
              />
            </Field>
          </>
        )}
      </div>
    </Modal>
  );
}
