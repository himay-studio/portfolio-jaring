'use client';

/* ==========================================================================
   Detail lead, versi hidup.

   Halaman lead server-side (`app/leads/[id]/page.tsx`) cuma memvalidasi id
   lewat `generateStaticParams` lalu merender komponen ini. Semua state
   pengunjung, termasuk status, konversi, dan aktivitas, dibaca lewat hook
   `useLeadStore` / `useActivityStore` di sini supaya papan Deals, Kontak, dan
   Perusahaan yang juga membaca localStorage yang sama tetap konsisten.
   ========================================================================== */

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { ActivityFormModal } from '@/components/activity/ActivityFormModal';
import { Avatar, Badge, Bar, EmptyState, RelChip, StatCard } from '@/components/ui/Basic';
import { DatePicker } from '@/components/ui/DatePicker';
import { Field, Input, Textarea } from '@/components/ui/Form';
import { PageHeader } from '@/components/ui/Nav';
import { Modal } from '@/components/ui/Overlay';
import { Select } from '@/components/ui/Select';
import { hari, umurHari } from '@/data/clock';
import { COMPANIES, LEADS, getCompany, getContact, getUser, namaSumber } from '@/data/relations';
import { LABEL_JENIS_AKTIVITAS, LABEL_STATUS_LEAD, TAHAP_AKTIF, TONE_JENIS_AKTIVITAS, TONE_STATUS_LEAD } from '@/data/settings';
import type { JenisAktivitas, TahapId } from '@/data/types';
import { useActivityStore } from '@/lib/activityStore';
import { bacaCompanyBaru, bacaContactBaru, isIdBaru } from '@/lib/crmExtras';
import { useDealStore } from '@/lib/dealStore';
import { useDisclosure } from '@/lib/hooks';
import { useLeadStore } from '@/lib/leadStore';
import { jam, relatifHari, rupiah, tanggal, tanggalRingkas } from '@/lib/format';

const IKON_AKTIVITAS: Record<JenisAktivitas, 'telepon' | 'email' | 'meeting' | 'tugas'> = {
  telepon: 'telepon',
  email: 'email',
  meeting: 'meeting',
  tugas: 'tugas',
};

export function LeadDetail({ leadId }: { leadId: string }) {
  const { leads, ubahLead, konversiLead } = useLeadStore();
  const { activities, catatAktivitas } = useActivityStore();
  const { deals } = useDealStore();
  const panelKonversi = useDisclosure();
  const panelAktivitas = useDisclosure();

  /* `leadId` selalu valid: halaman server (`app/leads/[id]/page.tsx`) sudah
     memanggil `notFound()` kalau tidak ada di `LEADS` dasar, jadi fallback
     ke data dasar di sini murni untuk render pertama sebelum localStorage
     terpasang, bukan penanganan "tidak ditemukan". */
  const dasar = LEADS.find((l) => l.id === leadId)!;
  const lead = leads.find((l) => l.id === leadId) ?? dasar;

  const owner = getUser(lead.ownerId);
  const aktivitas = activities
    .filter((a) => a.relasi.leadId === lead.id)
    .sort((a, b) => b.mulai.localeCompare(a.mulai));
  const belumDihubungi = lead.kontakTerakhir === null;

  const kontak = lead.konversi ? getContact(lead.konversi.contactId) ?? bacaContactBaru().find((c) => c.id === lead.konversi?.contactId) : undefined;
  const perusahaan = lead.konversi ? getCompany(lead.konversi.companyId) ?? bacaCompanyBaru().find((c) => c.id === lead.konversi?.companyId) : undefined;
  const deal = lead.konversi ? deals.find((d) => d.id === lead.konversi?.dealId) : undefined;

  return (
    <>
      <nav aria-label="Remah roti" className="row gap-8 t-sm muted" style={{ marginBottom: 12 }}>
        <Link href="/app/leads/">Leads</Link>
        <Icon name="chevron-right" size={13} />
        <span className="truncate">{lead.nama}</span>
      </nav>

      <PageHeader
        judul={lead.nama}
        keterangan={`${lead.jabatan} di ${lead.perusahaanNama}`}
        aksi={
          lead.status === 'dikonversi' && lead.konversi ? (
            isIdBaru(lead.konversi.dealId) ? (
              <span className="t-sm muted">Sudah dikonversi, lihat blok konversi di bawah.</span>
            ) : (
              <Link href={`/app/deals/${lead.konversi.dealId}/`} className="btn btn-primary">
                Buka deal hasil konversi
                <Icon name="arrow-right" size={16} />
              </Link>
            )
          ) : (
            <>
              <button type="button" className="btn btn-primary" onClick={panelKonversi.buka}>
                <Icon name="arrow-right" size={16} />
                Konversi jadi kontak dan deal
              </button>
              <button type="button" className="btn btn-secondary" onClick={panelAktivitas.buka}>
                Catat aktivitas
              </button>
              {lead.status !== 'tidak-layak' && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => ubahLead(lead.id, { status: 'tidak-layak' })}
                >
                  Tandai tidak layak
                </button>
              )}
            </>
          )
        }
        meta={
          <>
            <Badge tone={TONE_STATUS_LEAD[lead.status]}>{LABEL_STATUS_LEAD[lead.status]}</Badge>
            {belumDihubungi && lead.status !== 'tidak-layak' && (
              <Badge tone="danger" icon="peringatan">
                Belum pernah dihubungi
              </Badge>
            )}
          </>
        }
      />

      <div className="grid grid-kpi snap-row">
        <StatCard
          label="Skor kualifikasi"
          nilai={`${lead.skor}`}
          satuan="dari 100"
          tone={lead.skor >= 80 ? 'accent' : lead.skor >= 60 ? 'brand' : 'warning'}
        />
        <StatCard label="Sumber" nilai={namaSumber(lead.sumber)} tone="info" />
        <StatCard
          label="Masuk"
          nilai={tanggalRingkas(lead.dibuatPada)}
          keterangan={relatifHari(-umurHari(lead.dibuatPada))}
        />
        <StatCard
          label="Kontak terakhir"
          nilai={lead.kontakTerakhir ? tanggalRingkas(lead.kontakTerakhir) : 'Belum ada'}
          tone={belumDihubungi ? 'danger' : 'success'}
          keterangan={lead.kontakTerakhir ? relatifHari(-umurHari(lead.kontakTerakhir)) : 'Segera hubungi'}
        />
      </div>

      <div className="section grid grid-detail">
        <div className="stack gap-16">
          {lead.status === 'dikonversi' && lead.konversi && (
            <div className="origin-trace">
              <Icon name="check" size={16} />
              <span className="t-body">
                Lead ini dikonversi pada {tanggal(lead.konversi.tanggal)} menjadi satu kontak, satu
                perusahaan, dan satu deal.
              </span>
              <span className="chipset">
                {kontak && (
                  <RelChip
                    jenis="kontak"
                    label={kontak.nama}
                    href={isIdBaru(kontak.id) ? undefined : `/app/kontak/${kontak.id}/`}
                  />
                )}
                {perusahaan && (
                  <RelChip
                    jenis="perusahaan"
                    label={perusahaan.nama}
                    href={isIdBaru(perusahaan.id) ? undefined : `/app/perusahaan/${perusahaan.id}/`}
                  />
                )}
                {deal && (
                  <RelChip
                    jenis="deal"
                    label={`${deal.nama}, ${rupiah(deal.nilai)}`}
                    href={isIdBaru(deal.id) ? undefined : `/app/deals/${deal.id}/`}
                  />
                )}
              </span>
            </div>
          )}

          <section className="card">
            <div className="card-head">
              <span className="titled">
                <span className="t-h3">Aktivitas</span>
                <span className="t-sm muted">{aktivitas.length} tercatat pada lead ini</span>
              </span>
            </div>
            <div className="card-body" style={{ padding: aktivitas.length > 0 ? '0 16px' : undefined }}>
              {aktivitas.length === 0 ? (
                <EmptyState
                  judul="Belum ada aktivitas"
                  keterangan="Lead yang tidak pernah dihubungi adalah lead yang bocor. Catat telepon pertama sekarang."
                  aksi={
                    <button type="button" className="btn btn-primary btn-sm" onClick={panelAktivitas.buka}>
                      Catat telepon
                    </button>
                  }
                />
              ) : (
                <ul className="timeline" data-r48="koleksi-data">
                  {aktivitas.map((a) => (
                    <li className="tl-item" key={a.id}>
                      <span className="tl-mark" data-tone={TONE_JENIS_AKTIVITAS[a.jenis]}>
                        <Icon name={IKON_AKTIVITAS[a.jenis]} size={15} />
                      </span>
                      <span className="titled grow">
                        <span className="t-body-strong">{a.judul}</span>
                        <span className="t-xs muted">
                          {LABEL_JENIS_AKTIVITAS[a.jenis]}, {tanggalRingkas(a.mulai)} pukul {jam(a.mulai)}
                        </span>
                        <span className="t-sm">{a.catatan}</span>
                      </span>
                      <Badge tone={a.selesai ? 'success' : 'warning'}>{a.selesai ? 'Selesai' : 'Terjadwal'}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        <div className="stack gap-16">
          <section className="card">
            <div className="card-head">
              <span className="t-h3">Data kontak</span>
            </div>
            <div className="card-body">
              <dl className="dl">
                <dt>Nama</dt>
                <dd>{lead.nama}</dd>
                <dt>Jabatan</dt>
                <dd>{lead.jabatan}</dd>
                <dt>Perusahaan</dt>
                <dd>{lead.perusahaanNama}</dd>
                <dt>Email</dt>
                <dd className="truncate">{lead.email}</dd>
                <dt>Telepon</dt>
                <dd>{lead.telepon}</dd>
              </dl>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <span className="t-h3">Kualifikasi</span>
            </div>
            <div className="card-body stack gap-12">
              <div className="stack gap-4">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="t-xs muted">Skor</span>
                  <span className="t-xs num">{lead.skor} dari 100</span>
                </div>
                <Bar
                  persen={lead.skor}
                  tone={lead.skor >= 80 ? 'accent' : lead.skor >= 60 ? 'brand' : 'warning'}
                  label="Skor kualifikasi"
                />
              </div>

              <dl className="dl">
                <dt>Status</dt>
                <dd>
                  <Badge tone={TONE_STATUS_LEAD[lead.status]}>{LABEL_STATUS_LEAD[lead.status]}</Badge>
                </dd>
                <dt>Sumber</dt>
                <dd>{namaSumber(lead.sumber)}</dd>
                <dt>Catatan</dt>
                <dd>{lead.catatan}</dd>
              </dl>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <span className="t-h3">Penanggung jawab</span>
            </div>
            <div className="card-body row gap-12">
              <Avatar nama={owner?.nama ?? 'Tanpa penanggung jawab'} kunci={lead.ownerId} />
              <span className="titled grow">
                <span className="t-body-strong">{owner?.nama}</span>
                <span className="t-xs muted">{owner?.jabatan}</span>
              </span>
            </div>
          </section>
        </div>
      </div>

      <ActivityFormModal
        panel={panelAktivitas}
        relasiDasar={{ leadId: lead.id }}
        ownerIdBawaan={lead.ownerId}
        onSimpan={(input) => {
          catatAktivitas(input);
          if (lead.kontakTerakhir === null) ubahLead(lead.id, { kontakTerakhir: hari(0), status: lead.status === 'baru' ? 'dihubungi' : lead.status });
        }}
      />

      <ModalKonversi
        panel={panelKonversi}
        namaLead={lead.nama}
        perusahaanNama={lead.perusahaanNama}
        onSimpan={(input) => konversiLead(lead, input)}
      />
    </>
  );
}

function ModalKonversi({
  panel,
  namaLead,
  perusahaanNama,
  onSimpan,
}: {
  panel: ReturnType<typeof useDisclosure>;
  namaLead: string;
  perusahaanNama: string;
  onSimpan: (input: {
    companyIdTerpilih?: string;
    perusahaanBaru?: { industri: string; kota: string; provinsi: string };
    dealNama: string;
    dealNilai: number;
    dealTahap: TahapId;
    dealPerkiraanTutup: string;
  }) => void;
}) {
  const [companyPilihan, setCompanyPilihan] = useState('__baru__');
  const [industri, setIndustri] = useState('Lainnya');
  const [kota, setKota] = useState('');
  const [provinsi, setProvinsi] = useState('');
  const [dealNama, setDealNama] = useState(`Paket awal untuk ${perusahaanNama}`);
  const [dealNilai, setDealNilai] = useState('');
  const [dealTahap, setDealTahap] = useState<TahapId>('kualifikasi');
  const [dealPerkiraanTutup, setDealPerkiraanTutup] = useState(hari(45));

  const sah = dealNama.trim() && Number(dealNilai) > 0;

  function tutupDanReset() {
    panel.tutup();
  }

  return (
    <Modal
      panel={{ ...panel, tutup: tutupDanReset }}
      judul={`Konversi ${namaLead}`}
      keterangan="Membuat kontak, perusahaan (kalau belum ada), dan deal sekaligus."
      lebar="wide"
      footer={
        <>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!sah}
            onClick={() => {
              onSimpan({
                companyIdTerpilih: companyPilihan === '__baru__' ? undefined : companyPilihan,
                perusahaanBaru: companyPilihan === '__baru__' ? { industri, kota, provinsi } : undefined,
                dealNama: dealNama.trim(),
                dealNilai: Number(dealNilai),
                dealTahap,
                dealPerkiraanTutup,
              });
              tutupDanReset();
            }}
          >
            Konversi sekarang
          </button>
          <button type="button" className="btn btn-secondary" onClick={tutupDanReset}>
            Batal
          </button>
        </>
      }
    >
      <div className="stack gap-16">
        <Select
          label="Perusahaan"
          tampilkanLabel
          nilai={companyPilihan}
          onUbah={setCompanyPilihan}
          lebar="100%"
          opsi={[
            { nilai: '__baru__', label: `Buat perusahaan baru: ${perusahaanNama}` },
            ...COMPANIES.map((c) => ({ nilai: c.id, label: c.nama, keterangan: c.industri })),
          ]}
        />

        {companyPilihan === '__baru__' && (
          <div className="grid grid-2">
            <Field label="Industri" htmlFor="konv-industri">
              <Input id="konv-industri" value={industri} onChange={(e) => setIndustri(e.target.value)} />
            </Field>
            <Field label="Kota" htmlFor="konv-kota">
              <Input id="konv-kota" value={kota} onChange={(e) => setKota(e.target.value)} placeholder="Jakarta" />
            </Field>
          </div>
        )}
        {companyPilihan === '__baru__' && (
          <Field label="Provinsi" htmlFor="konv-provinsi">
            <Input id="konv-provinsi" value={provinsi} onChange={(e) => setProvinsi(e.target.value)} placeholder="DKI Jakarta" />
          </Field>
        )}

        <div className="hr" />

        <Field label="Nama deal" htmlFor="konv-deal-nama">
          <Input id="konv-deal-nama" value={dealNama} onChange={(e) => setDealNama(e.target.value)} />
        </Field>

        <div className="grid grid-2">
          <Field label="Nilai deal" htmlFor="konv-deal-nilai" keterangan="Dalam Rupiah">
            <Input
              id="konv-deal-nilai"
              type="number"
              min={0}
              value={dealNilai}
              onChange={(e) => setDealNilai(e.target.value)}
              placeholder="45000000"
            />
          </Field>
          <Select
            label="Tahap awal"
            tampilkanLabel
            nilai={dealTahap}
            onUbah={(v) => setDealTahap(v as TahapId)}
            lebar="100%"
            opsi={TAHAP_AKTIF.map((t) => ({ nilai: t.id, label: t.nama }))}
          />
        </div>

        <DatePicker
          label="Perkiraan tutup"
          tampilkanLabel
          nilai={dealPerkiraanTutup}
          onUbah={setDealPerkiraanTutup}
          lebar="100%"
        />
      </div>
    </Modal>
  );
}
