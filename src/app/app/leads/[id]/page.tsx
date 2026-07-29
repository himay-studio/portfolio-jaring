import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { Avatar, Badge, Bar, EmptyState, Placeholder, RelChip, StatCard } from '@/components/ui/Basic';
import { PageHeader } from '@/components/ui/Nav';
import {
  LEADS,
  activitiesFor,
  getUser,
  hasilKonversi,
  namaSumber,
} from '@/data/relations';
import { LABEL_JENIS_AKTIVITAS, LABEL_STATUS_LEAD, TONE_JENIS_AKTIVITAS, TONE_STATUS_LEAD } from '@/data/settings';
import type { JenisAktivitas } from '@/data/types';
import { umurHari } from '@/data/clock';
import { jam, relatifHari, rupiah, tanggal, tanggalRingkas } from '@/lib/format';

/* ==========================================================================
   Detail lead.

   Bagian terpenting halaman ini adalah blok konversi. Kalau lead sudah
   dikonversi, halaman ini menunjukkan KE MANA dia berubah: kontak apa,
   perusahaan apa, dan deal apa, ketiganya bisa diklik. Pasangan baliknya ada
   di halaman detail deal dan detail kontak, yang menarik lead ini lewat
   `asalLeadId`.

   Dua arah itu sengaja ditulis dua duanya. Kalau cuma satu arah, salah satu
   layar pasti jadi jalan buntu.
   ========================================================================== */

const IKON_AKTIVITAS: Record<JenisAktivitas, 'telepon' | 'email' | 'meeting' | 'tugas'> = {
  telepon: 'telepon',
  email: 'email',
  meeting: 'meeting',
  tugas: 'tugas',
};

export function generateStaticParams() {
  return LEADS.map((l) => ({ id: l.id }));
}

export default async function DetailLead({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = LEADS.find((l) => l.id === id);
  if (!lead) notFound();

  const owner = getUser(lead.ownerId);
  const aktivitas = activitiesFor({ leadId: lead.id }).sort((a, b) =>
    b.mulai.localeCompare(a.mulai),
  );
  const konversi = hasilKonversi(lead);
  const belumDihubungi = lead.kontakTerakhir === null;

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
          lead.status === 'dikonversi' ? (
            <Link href={`/app/deals/${lead.konversi?.dealId ?? ''}/`} className="btn btn-primary">
              Buka deal hasil konversi
              <Icon name="arrow-right" size={16} />
            </Link>
          ) : (
            <>
              <button type="button" className="btn btn-primary">
                <Icon name="arrow-right" size={16} />
                Konversi jadi kontak dan deal
              </button>
              <button type="button" className="btn btn-secondary">
                Catat aktivitas
              </button>
              <button type="button" className="btn btn-secondary">
                Tandai tidak layak
              </button>
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
          keterangan={
            lead.kontakTerakhir ? relatifHari(-umurHari(lead.kontakTerakhir)) : 'Segera hubungi'
          }
        />
      </div>

      <div className="section grid grid-detail">
        <div className="stack gap-16">
          {/* Jejak konversi ke depan. Ini pasangan dari `asalLeadId` yang
              dibaca halaman detail deal dan detail kontak. */}
          {lead.status === 'dikonversi' && lead.konversi && (
            <div className="origin-trace">
              <Icon name="check" size={16} />
              <span className="t-body">
                Lead ini dikonversi pada {tanggal(lead.konversi.tanggal)} menjadi satu kontak, satu
                perusahaan, dan satu deal.
              </span>
              <span className="chipset">
                {konversi.contact && (
                  <RelChip
                    jenis="kontak"
                    label={konversi.contact.nama}
                    href={`/app/kontak/${konversi.contact.id}/`}
                  />
                )}
                {konversi.company && (
                  <RelChip
                    jenis="perusahaan"
                    label={konversi.company.nama}
                    href={`/app/perusahaan/${konversi.company.id}/`}
                  />
                )}
                {konversi.deal && (
                  <RelChip
                    jenis="deal"
                    label={`${konversi.deal.nama}, ${rupiah(konversi.deal.nilai)}`}
                    href={`/app/deals/${konversi.deal.id}/`}
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
                    <button type="button" className="btn btn-primary btn-sm">
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
                          {LABEL_JENIS_AKTIVITAS[a.jenis]}, {tanggalRingkas(a.mulai)} pukul{' '}
                          {jam(a.mulai)}
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

          <Placeholder
            judul="Formulir konversi lead"
            untuk="Stage 5 membuat modal konversi yang mengisi Kontak, Perusahaan, dan Deal sekaligus dari data lead ini, lalu menulis lead.konversi plus asalLeadId di kedua record hasilnya supaya jejak dua arahnya utuh."
          />
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
                  <Badge tone={TONE_STATUS_LEAD[lead.status]}>
                    {LABEL_STATUS_LEAD[lead.status]}
                  </Badge>
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
    </>
  );
}
