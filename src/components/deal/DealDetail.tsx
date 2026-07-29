'use client';

/* ==========================================================================
   Detail deal, versi hidup.

   Tahap, aktivitas, penawaran, dan catatan kolaboratif semua bisa berubah
   di sesi pengunjung, jadi halaman ini membaca `useDealStore`,
   `useActivityStore`, `useQuotationStore`, dan `useDealCollab` alih-alih
   data dasar statis, persis pola yang sama dengan `LeadDetail`.
   ========================================================================== */

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { ActivityFormModal } from '@/components/activity/ActivityFormModal';
import { QuotationFormModal } from '@/components/penawaran/QuotationFormModal';
import { Avatar, Badge, Bar, EmptyState, RelChip, StatCard } from '@/components/ui/Basic';
import { Field, Input, Textarea } from '@/components/ui/Form';
import { PageHeader } from '@/components/ui/Nav';
import { Modal } from '@/components/ui/Overlay';
import { Select } from '@/components/ui/Select';
import {
  DEALS,
  USERS,
  asalLead,
  getAlasanKalah,
  getCompany,
  getContact,
  getUser,
  hitungPenawaran,
  namaSumber,
} from '@/data/relations';
import { ALASAN_KALAH, LABEL_JENIS_AKTIVITAS, LABEL_STATUS_PENAWARAN, TAHAP, TONE_JENIS_AKTIVITAS, TONE_STATUS_PENAWARAN } from '@/data/settings';
import type { AlasanKalahId, JenisAktivitas, TahapId, Tone } from '@/data/types';
import { useActivityStore } from '@/lib/activityStore';
import { useDealCollab } from '@/lib/dealCollabStore';
import { useDealStore } from '@/lib/dealStore';
import { useDisclosure } from '@/lib/hooks';
import { useQuotationStore } from '@/lib/quotationStore';
import { jam, persenSingkat, rupiah, rupiahSingkat, tanggal, tanggalRingkas } from '@/lib/format';
import { hariDiTahap, hariMandek, isMandek } from '@/lib/metrics';

const TONE_TAHAP: Record<TahapId, Tone> = {
  prospek: 'info',
  kualifikasi: 'brand',
  penawaran: 'accent',
  negosiasi: 'warning',
  menang: 'success',
  kalah: 'danger',
};

const IKON_AKTIVITAS: Record<JenisAktivitas, 'telepon' | 'email' | 'meeting' | 'tugas'> = {
  telepon: 'telepon',
  email: 'email',
  meeting: 'meeting',
  tugas: 'tugas',
};

export function DealDetail({ dealId }: { dealId: string }) {
  const { deals, pindahTahap } = useDealStore();
  const { activities, catatAktivitas } = useActivityStore();
  const { quotations, buatQuotation } = useQuotationStore();
  const kolab = useDealCollab(dealId);
  const panelAktivitas = useDisclosure();
  const panelTahap = useDisclosure();
  const panelPenawaran = useDisclosure();

  const dasar = DEALS.find((d) => d.id === dealId)!;
  const deal = deals.find((d) => d.id === dealId) ?? dasar;

  const perusahaan = getCompany(deal.companyId);
  const kontak = getContact(deal.contactId);
  const owner = getUser(deal.ownerId);
  const tahap = TAHAP.find((t) => t.id === deal.tahap);
  const penawaran = quotations.filter((q) => q.dealId === deal.id);
  const aktivitas = activities.filter((a) => a.relasi.dealId === deal.id).sort((a, b) => b.mulai.localeCompare(a.mulai));
  const lead = asalLead(deal);
  const alasan = getAlasanKalah(deal.alasanKalahId);
  const mandek = isMandek(deal);

  return (
    <>
      <nav aria-label="Remah roti" className="row gap-8 t-sm muted" style={{ marginBottom: 12 }}>
        <Link href="/app/deals/">Deals</Link>
        <Icon name="chevron-right" size={13} />
        <span className="truncate">{deal.nama}</span>
      </nav>

      <PageHeader
        judul={deal.nama}
        keterangan={`${perusahaan?.nama ?? 'Tanpa perusahaan'}, sumber ${namaSumber(deal.sumber)}`}
        aksi={
          <>
            <button type="button" className="btn btn-primary" onClick={panelAktivitas.buka}>
              <Icon name="plus" size={16} />
              Catat aktivitas
            </button>
            {deal.tahap !== 'menang' && deal.tahap !== 'kalah' && (
              <button type="button" className="btn btn-secondary" onClick={panelTahap.buka}>
                Geser tahap
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={panelPenawaran.buka}>
              Buat penawaran
            </button>
          </>
        }
        meta={
          <>
            <Badge tone={TONE_TAHAP[deal.tahap]}>{tahap?.nama}</Badge>
            {mandek && (
              <Badge tone="warning" icon="peringatan">
                Mandek {hariMandek(deal)} hari
              </Badge>
            )}
          </>
        }
      />

      {mandek && (
        <div className="origin-trace" style={{ marginBottom: 16, background: 'var(--warning-soft)', color: 'var(--warning-ink)', borderLeftColor: 'var(--warning)' }}>
          <Icon name="peringatan" size={16} />
          <span className="t-body">
            Deal ini belum tersentuh {hariMandek(deal)} hari. Tentukan langkah berikutnya atau tandai kalah.
          </span>
        </div>
      )}

      <div className="grid grid-kpi snap-row">
        <StatCard label="Nilai deal" nilai={rupiah(deal.nilai)} />
        <StatCard
          label="Probabilitas"
          nilai={persenSingkat(deal.probabilitas)}
          tone="accent"
          keterangan={`Tertimbang ${rupiahSingkat((deal.nilai * deal.probabilitas) / 100)}`}
        />
        <StatCard
          label="Perkiraan tutup"
          nilai={tanggalRingkas(deal.perkiraanTutup)}
          tone="info"
          keterangan={tanggal(deal.perkiraanTutup)}
        />
        <StatCard
          label="Lama di tahap ini"
          nilai={`${hariDiTahap(deal)}`}
          satuan="hari"
          tone={mandek ? 'warning' : 'success'}
          keterangan={`Masuk tahap ${tahap?.nama} pada ${tanggalRingkas(deal.tahapSejak)}`}
        />
      </div>

      <div className="section grid grid-detail">
        <div className="stack gap-16">
          {lead && (
            <div className="origin-trace">
              <Icon name="leads" size={16} />
              <span className="t-body">
                Deal ini lahir dari lead <strong>{lead.nama}</strong> yang masuk lewat{' '}
                {namaSumber(lead.sumber)} pada {tanggal(lead.dibuatPada)}, lalu dikonversi pada{' '}
                {lead.konversi ? tanggal(lead.konversi.tanggal) : 'tanggal yang tidak tercatat'}.
              </span>
              <Link href={`/app/leads/${lead.id}/`} className="btn btn-ghost btn-sm">
                Buka lead asal
              </Link>
            </div>
          )}

          {deal.tahap === 'kalah' && (
            <section className="card">
              <div className="card-head">
                <span className="titled">
                  <span className="t-h3">Alasan kalah</span>
                  <span className="t-sm muted">
                    Ditutup pada {deal.ditutupPada ? tanggal(deal.ditutupPada) : 'tanggal yang tidak tercatat'}
                  </span>
                </span>
                <Badge tone="danger">{alasan?.nama ?? 'Tidak tercatat'}</Badge>
              </div>
              <div className="card-body">
                <p className="t-body">{deal.catatanKalah ?? 'Tanpa catatan tambahan.'}</p>
              </div>
            </section>
          )}

          <section className="card">
            <div className="card-head">
              <span className="titled">
                <span className="t-h3">Aktivitas</span>
                <span className="t-sm muted">{aktivitas.length} tercatat pada deal ini</span>
              </span>
              <Link href="/app/aktivitas/" className="btn btn-ghost btn-sm">
                Semua aktivitas
              </Link>
            </div>
            <div className="card-body" style={{ padding: aktivitas.length > 0 ? '0 16px' : undefined }}>
              {aktivitas.length === 0 ? (
                <EmptyState
                  judul="Belum ada aktivitas"
                  keterangan="Deal tanpa langkah berikutnya adalah deal yang akan mandek. Catat telepon, meeting, atau tugas follow up."
                  aksi={
                    <button type="button" className="btn btn-primary btn-sm" onClick={panelAktivitas.buka}>
                      Catat aktivitas
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
                          {LABEL_JENIS_AKTIVITAS[a.jenis]}, {tanggalRingkas(a.mulai)} pukul {jam(a.mulai)}, {a.durasiMenit} menit
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

          <section className="card">
            <div className="card-head">
              <span className="titled">
                <span className="t-h3">Penawaran</span>
                <span className="t-sm muted">{penawaran.length} dokumen pada deal ini</span>
              </span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={panelPenawaran.buka}>
                Buat penawaran
              </button>
            </div>
            <div className="card-body" style={{ padding: penawaran.length > 0 ? '0 16px' : undefined }}>
              {penawaran.length === 0 ? (
                <EmptyState
                  judul="Belum ada penawaran"
                  keterangan="Buat penawaran saat kebutuhan dan anggaran sudah jelas, biasanya setelah tahap Kualifikasi."
                />
              ) : (
                <ul className="timeline" data-r48="koleksi-data">
                  {penawaran.map((q) => {
                    const rincian = hitungPenawaran(q);
                    return (
                      <li className="tl-item" key={q.id}>
                        <span className="tl-mark" data-tone="brand">
                          <Icon name="penawaran" size={15} />
                        </span>
                        <Link href={`/app/penawaran/${q.id}/`} className="titled grow" style={{ color: 'inherit' }}>
                          <span className="t-body-strong mono">{q.nomor}</span>
                          <span className="t-xs muted">
                            {tanggal(q.tanggal)}, berlaku sampai {tanggalRingkas(q.berlakuHingga)}
                          </span>
                          <span className="t-xs muted">{q.items.length} baris item</span>
                        </Link>
                        <span className="titled" style={{ alignItems: 'flex-end' }}>
                          <span className="t-body-strong num">{rupiah(rincian.total)}</span>
                          <Badge tone={TONE_STATUS_PENAWARAN[q.status]}>{LABEL_STATUS_PENAWARAN[q.status]}</Badge>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          <DealCollabCard dealId={deal.id} ownerId={deal.ownerId} kolab={kolab} />
        </div>

        <div className="stack gap-16">
          <section className="card">
            <div className="card-head">
              <span className="t-h3">Relasi</span>
            </div>
            <div className="card-body stack gap-12">
              <div className="chipset">
                {perusahaan && <RelChip jenis="perusahaan" label={perusahaan.nama} href={`/app/perusahaan/${perusahaan.id}/`} />}
                {kontak && <RelChip jenis="kontak" label={kontak.nama} href={`/app/kontak/${kontak.id}/`} />}
                {lead && <RelChip jenis="lead" label={lead.nama} href={`/app/leads/${lead.id}/`} />}
                {penawaran.map((q) => (
                  <RelChip key={q.id} jenis="penawaran" label={q.nomor} href={`/app/penawaran/${q.id}/`} />
                ))}
              </div>

              <div className="hr" />

              <div className="row gap-12">
                <Avatar nama={owner?.nama ?? 'Tanpa penanggung jawab'} kunci={deal.ownerId} />
                <span className="titled grow">
                  <span className="t-body-strong">{owner?.nama}</span>
                  <span className="t-xs muted">{owner?.jabatan}</span>
                </span>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <span className="t-h3">Rincian</span>
            </div>
            <div className="card-body">
              <dl className="dl">
                <dt>Tahap</dt>
                <dd>
                  <div className="stack gap-8">
                    <Badge tone={TONE_TAHAP[deal.tahap]}>{tahap?.nama}</Badge>
                    <Bar persen={deal.probabilitas} tone={TONE_TAHAP[deal.tahap]} label="Probabilitas menang" />
                  </div>
                </dd>

                <dt>Sumber</dt>
                <dd>{namaSumber(deal.sumber)}</dd>

                <dt>Dibuat</dt>
                <dd>{tanggal(deal.dibuatPada)}</dd>

                <dt>Masuk tahap</dt>
                <dd>{tanggal(deal.tahapSejak)}</dd>

                <dt>Tersentuh</dt>
                <dd>{tanggal(deal.disentuhPada)}</dd>

                {deal.ditutupPada && (
                  <>
                    <dt>Ditutup</dt>
                    <dd>{tanggal(deal.ditutupPada)}</dd>
                  </>
                )}

                <dt>Catatan</dt>
                <dd>{deal.catatan}</dd>
              </dl>
            </div>
          </section>

          {kontak && (
            <section className="card">
              <div className="card-head">
                <span className="titled">
                  <span className="t-h3">Kontak utama</span>
                  <span className="t-sm muted">{kontak.jabatan}</span>
                </span>
              </div>
              <div className="card-body stack gap-10">
                <div className="row gap-12">
                  <Avatar nama={kontak.nama} kunci={kontak.id} inisial={kontak.inisial} />
                  <span className="titled grow">
                    <Link href={`/app/kontak/${kontak.id}/`} className="t-body-strong">
                      {kontak.nama}
                    </Link>
                    <span className="t-xs muted">{perusahaan?.nama}</span>
                  </span>
                </div>
                <span className="row gap-8 t-sm">
                  <Icon name="email" size={15} style={{ color: 'var(--text-muted)' }} />
                  <span className="truncate">{kontak.email}</span>
                </span>
                <span className="row gap-8 t-sm">
                  <Icon name="telepon" size={15} style={{ color: 'var(--text-muted)' }} />
                  <span>{kontak.telepon}</span>
                </span>
              </div>
            </section>
          )}
        </div>
      </div>

      <ActivityFormModal
        panel={panelAktivitas}
        relasiDasar={{ dealId: deal.id, contactId: deal.contactId, companyId: deal.companyId }}
        ownerIdBawaan={deal.ownerId}
        onSimpan={catatAktivitas}
      />
      <QuotationFormModal panel={panelPenawaran} deal={deal} onSimpan={buatQuotation} />
      <ModalGeserTahap panel={panelTahap} tahapSekarang={deal.tahap} onSimpan={(t, alasanKalah) => pindahTahap(deal.id, t, alasanKalah)} />
    </>
  );
}

function ModalGeserTahap({
  panel,
  tahapSekarang,
  onSimpan,
}: {
  panel: ReturnType<typeof useDisclosure>;
  tahapSekarang: TahapId;
  onSimpan: (tahap: TahapId, alasan?: { alasanKalahId: AlasanKalahId; catatan: string }) => void;
}) {
  const [tahapTujuan, setTahapTujuan] = useState<TahapId>(tahapSekarang);
  const [alasanKalah, setAlasanKalah] = useState('');
  const [catatanKalah, setCatatanKalah] = useState('');

  const butuhAlasan = tahapTujuan === 'kalah';
  const sah = tahapTujuan !== tahapSekarang && (!butuhAlasan || !!alasanKalah);

  function tutupDanReset() {
    panel.tutup();
    setAlasanKalah('');
    setCatatanKalah('');
  }

  return (
    <Modal
      panel={{ ...panel, tutup: tutupDanReset }}
      judul="Geser tahap"
      footer={
        <>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!sah}
            onClick={() => {
              onSimpan(tahapTujuan, butuhAlasan ? { alasanKalahId: alasanKalah as AlasanKalahId, catatan: catatanKalah } : undefined);
              tutupDanReset();
            }}
          >
            Geser tahap
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
            <Field label="Catatan tambahan" htmlFor="geser-catatan-kalah">
              <Textarea id="geser-catatan-kalah" value={catatanKalah} onChange={(e) => setCatatanKalah(e.target.value)} />
            </Field>
          </>
        )}
      </div>
    </Modal>
  );
}

function DealCollabCard({
  dealId,
  ownerId,
  kolab,
}: {
  dealId: string;
  ownerId: string;
  kolab: ReturnType<typeof useDealCollab>;
}) {
  const [teksCatatan, setTeksCatatan] = useState('');
  const [namaLampiran, setNamaLampiran] = useState('');

  return (
    <section className="card">
      <div className="card-head">
        <span className="titled">
          <span className="t-h3">Catatan kolaboratif dan lampiran</span>
          <span className="t-sm muted">{kolab.catatan.length} catatan, {kolab.lampiran.length} lampiran</span>
        </span>
      </div>
      <div className="card-body stack gap-16">
        <div className="stack gap-8">
          <Textarea
            value={teksCatatan}
            onChange={(e) => setTeksCatatan(e.target.value)}
            placeholder="Tulis catatan untuk tim, misalnya ringkasan meeting atau kesepakatan lisan."
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ alignSelf: 'flex-start' }}
            disabled={!teksCatatan.trim()}
            onClick={() => {
              kolab.tambahCatatan(teksCatatan.trim(), ownerId);
              setTeksCatatan('');
            }}
          >
            Simpan catatan
          </button>
        </div>

        {kolab.catatan.length > 0 && (
          <ul className="stack gap-10">
            {kolab.catatan.map((c) => {
              const penulis = USERS.find((u) => u.id === c.penulisId);
              return (
                <li key={c.id} className="row gap-10" style={{ alignItems: 'flex-start' }}>
                  <Avatar nama={penulis?.nama ?? 'Tim'} kunci={c.penulisId} size="sm" />
                  <span className="titled grow">
                    <span className="t-sm">{c.teks}</span>
                    <span className="t-xs muted">
                      {penulis?.nama ?? 'Tim'}, {tanggalRingkas(c.waktu)}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <div className="hr" />

        <div className="row gap-8">
          <Field label="Lampirkan berkas (demo, nama berkas saja)" htmlFor={`lampiran-${dealId}`}>
            <Input
              id={`lampiran-${dealId}`}
              value={namaLampiran}
              onChange={(e) => setNamaLampiran(e.target.value)}
              placeholder="Contoh: penawaran-final.pdf"
            />
          </Field>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={!namaLampiran.trim()}
            onClick={() => {
              kolab.tambahLampiran(namaLampiran.trim(), ownerId);
              setNamaLampiran('');
            }}
          >
            Tambah
          </button>
        </div>

        {kolab.lampiran.length > 0 && (
          <ul className="stack gap-8">
            {kolab.lampiran.map((l) => (
              <li key={l.id} className="row gap-8 t-sm">
                <Icon name="unduh" size={15} style={{ color: 'var(--text-muted)' }} />
                <span className="truncate grow">{l.namaFile}</span>
                <span className="t-xs muted">{tanggalRingkas(l.waktu)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
