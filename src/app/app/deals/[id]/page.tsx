import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { Avatar, Badge, Bar, EmptyState, Placeholder, RelChip, StatCard } from '@/components/ui/Basic';
import { PageHeader } from '@/components/ui/Nav';
import {
  DEALS,
  activitiesFor,
  asalLead,
  getAlasanKalah,
  getCompany,
  getContact,
  getUser,
  hitungPenawaran,
  namaSumber,
  quotationsByDeal,
} from '@/data/relations';
import { LABEL_JENIS_AKTIVITAS, LABEL_STATUS_PENAWARAN, TAHAP, TONE_JENIS_AKTIVITAS, TONE_STATUS_PENAWARAN } from '@/data/settings';
import type { JenisAktivitas, TahapId, Tone } from '@/data/types';
import { jam, persenSingkat, rupiah, rupiahSingkat, tanggal, tanggalRingkas } from '@/lib/format';
import { hariDiTahap, hariMandek, isMandek } from '@/lib/metrics';

/* ==========================================================================
   Detail deal.

   Layar ini yang membuktikan model relasinya benar. Dari satu halaman harus
   terbaca: perusahaan mana, kontak siapa, penanggung jawab siapa, penawaran
   apa saja yang sudah dikirim, aktivitas apa yang sudah dan akan terjadi,
   dan yang paling gampang hilang di CRM, DARI LEAD MANA deal ini berasal.

   Jejak asal itu dibaca lewat `asalLead(deal)`, yang menarik balik dari
   `deal.asalLeadId`. Pasangan majunya ada di `lead.konversi.dealId`.
   ========================================================================== */

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

export function generateStaticParams() {
  return DEALS.map((d) => ({ id: d.id }));
}

export default async function DetailDeal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = DEALS.find((d) => d.id === id);
  if (!deal) notFound();

  const perusahaan = getCompany(deal.companyId);
  const kontak = getContact(deal.contactId);
  const owner = getUser(deal.ownerId);
  const tahap = TAHAP.find((t) => t.id === deal.tahap);
  const penawaran = quotationsByDeal(deal.id);
  const aktivitas = activitiesFor({ dealId: deal.id }).sort((a, b) => b.mulai.localeCompare(a.mulai));
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
            <button type="button" className="btn btn-primary">
              <Icon name="plus" size={16} />
              Catat aktivitas
            </button>
            <button type="button" className="btn btn-secondary">
              Geser tahap
            </button>
            <button type="button" className="btn btn-secondary">
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
            Deal ini belum tersentuh {hariMandek(deal)} hari. Tentukan langkah berikutnya atau
            tandai kalah.
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
        {/* ------------------------- Kolom utama --------------------------- */}
        <div className="stack gap-16">
          {/* Jejak asal konversi. Inilah bagian yang paling gampang hilang di
              CRM, jadi ditaruh paling atas dan bukan di catatan kaki. */}
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
                    <button type="button" className="btn btn-primary btn-sm">
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
                          {LABEL_JENIS_AKTIVITAS[a.jenis]}, {tanggalRingkas(a.mulai)} pukul{' '}
                          {jam(a.mulai)}, {a.durasiMenit} menit
                        </span>
                        <span className="t-sm">{a.catatan}</span>
                      </span>
                      <Badge tone={a.selesai ? 'success' : 'warning'}>
                        {a.selesai ? 'Selesai' : 'Terjadwal'}
                      </Badge>
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
              <button type="button" className="btn btn-ghost btn-sm">
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
                          <Badge tone={TONE_STATUS_PENAWARAN[q.status]}>
                            {LABEL_STATUS_PENAWARAN[q.status]}
                          </Badge>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          <Placeholder
            judul="Catatan kolaboratif dan lampiran"
            untuk="Stage 5 menambahkan catatan yang bisa ditulis pengunjung dan disimpan ke localStorage, plus daftar lampiran demo. Bentuk datanya sudah disiapkan lewat field catatan di tipe Deal."
          />
        </div>

        {/* ------------------------- Kolom samping -------------------------- */}
        <div className="stack gap-16">
          <section className="card">
            <div className="card-head">
              <span className="t-h3">Relasi</span>
            </div>
            <div className="card-body stack gap-12">
              <div className="chipset">
                {perusahaan && (
                  <RelChip
                    jenis="perusahaan"
                    label={perusahaan.nama}
                    href={`/app/perusahaan/${perusahaan.id}/`}
                  />
                )}
                {kontak && (
                  <RelChip jenis="kontak" label={kontak.nama} href={`/app/kontak/${kontak.id}/`} />
                )}
                {lead && <RelChip jenis="lead" label={lead.nama} href={`/app/leads/${lead.id}/`} />}
                {penawaran.map((q) => (
                  <RelChip
                    key={q.id}
                    jenis="penawaran"
                    label={q.nomor}
                    href={`/app/penawaran/${q.id}/`}
                  />
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
                    <Bar
                      persen={deal.probabilitas}
                      tone={TONE_TAHAP[deal.tahap]}
                      label="Probabilitas menang"
                    />
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
    </>
  );
}
