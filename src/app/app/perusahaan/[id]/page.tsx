import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { Avatar, Badge, EmptyState, RelChip, StatCard } from '@/components/ui/Basic';
import { PageHeader } from '@/components/ui/Nav';
import {
  COMPANIES,
  activitiesForCompany,
  contactsByCompany,
  dealsByCompany,
  getUser,
  hitungPenawaran,
  quotationsByCompany,
} from '@/data/relations';
import {
  LABEL_JENIS_AKTIVITAS,
  LABEL_STATUS_PENAWARAN,
  TAHAP,
  TONE_JENIS_AKTIVITAS,
  TONE_STATUS_PENAWARAN,
} from '@/data/settings';
import type { JenisAktivitas, TahapId, Tone } from '@/data/types';
import { angka, jam, rupiah, rupiahSingkat, tanggal, tanggalRingkas } from '@/lib/format';
import { dealBerjalan, nilaiTotal } from '@/lib/metrics';

/* ==========================================================================
   Detail perusahaan.

   Linimasanya memakai `activitiesForCompany`, yang mengumpulkan aktivitas
   milik perusahaan itu sendiri PLUS aktivitas yang menempel ke deal dan
   kontak di bawahnya. Kalau cuma membaca `relasi.companyId`, halaman ini akan
   terlihat kosong padahal timnya sibuk, karena kebanyakan aktivitas memang
   dicatat pada deal atau pada orangnya, bukan pada perusahaannya.
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

const LABEL_UKURAN = { kecil: 'Kecil', menengah: 'Menengah', besar: 'Besar' } as const;

export function generateStaticParams() {
  return COMPANIES.map((c) => ({ id: c.id }));
}

export default async function DetailPerusahaan({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const perusahaan = COMPANIES.find((c) => c.id === id);
  if (!perusahaan) notFound();

  const owner = getUser(perusahaan.ownerId);
  const kontak = contactsByCompany(perusahaan.id);
  const deal = dealsByCompany(perusahaan.id);
  const berjalan = deal.filter(dealBerjalan);
  const menang = deal.filter((d) => d.tahap === 'menang');
  const penawaran = quotationsByCompany(perusahaan.id);
  const aktivitas = activitiesForCompany(perusahaan.id).sort((a, b) =>
    b.mulai.localeCompare(a.mulai),
  );

  return (
    <>
      <nav aria-label="Remah roti" className="row gap-8 t-sm muted" style={{ marginBottom: 12 }}>
        <Link href="/app/perusahaan/">Perusahaan</Link>
        <Icon name="chevron-right" size={13} />
        <span className="truncate">{perusahaan.nama}</span>
      </nav>

      <PageHeader
        judul={perusahaan.nama}
        keterangan={`${perusahaan.industri}, ${perusahaan.kota}, ${perusahaan.provinsi}`}
        aksi={
          <>
            <button type="button" className="btn btn-primary">
              <Icon name="plus" size={16} />
              Tambah deal
            </button>
            <button type="button" className="btn btn-secondary">
              Tambah kontak
            </button>
            <button type="button" className="btn btn-secondary">
              Ubah perusahaan
            </button>
          </>
        }
        meta={
          <>
            <Badge>{LABEL_UKURAN[perusahaan.ukuran]}</Badge>
            <Badge tone="info">{angka(perusahaan.jumlahKaryawan)} karyawan</Badge>
          </>
        }
      />

      <div className="grid grid-kpi snap-row">
        <StatCard
          label="Deal berjalan"
          nilai={rupiahSingkat(nilaiTotal(berjalan))}
          tone="success"
          keterangan={`${berjalan.length} deal aktif`}
        />
        <StatCard
          label="Sudah menang"
          nilai={rupiahSingkat(nilaiTotal(menang))}
          keterangan={`${menang.length} deal ditutup menang`}
        />
        <StatCard label="Kontak" nilai={`${kontak.length}`} tone="info" />
        <StatCard label="Penawaran" nilai={`${penawaran.length}`} tone="accent" />
      </div>

      <div className="section grid grid-detail">
        <div className="stack gap-16">
          <section className="card">
            <div className="card-head">
              <span className="titled">
                <span className="t-h3">Kontak di perusahaan ini</span>
                <span className="t-sm muted">{kontak.length} orang</span>
              </span>
              <button type="button" className="btn btn-ghost btn-sm">
                Tambah kontak
              </button>
            </div>
            <div className="card-body" style={{ padding: kontak.length > 0 ? '0 16px' : undefined }}>
              {kontak.length === 0 ? (
                <EmptyState
                  judul="Belum ada kontak"
                  keterangan="Perusahaan tanpa kontak berarti belum ada orang yang bisa dihubungi. Tambahkan minimal satu."
                />
              ) : (
                <ul className="timeline" data-r48="koleksi-data">
                  {kontak.map((k) => (
                    <li className="tl-item" key={k.id}>
                      <Avatar nama={k.nama} kunci={k.id} inisial={k.inisial} />
                      <Link href={`/app/kontak/${k.id}/`} className="titled grow" style={{ color: 'inherit' }}>
                        <span className="t-body-strong">{k.nama}</span>
                        <span className="t-xs muted">{k.jabatan}</span>
                        <span className="t-xs muted truncate">{k.email}</span>
                      </Link>
                      {k.asalLeadId && <Badge tone="accent">Dari lead</Badge>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <span className="titled">
                <span className="t-h3">Deal</span>
                <span className="t-sm muted">{deal.length} deal sepanjang riwayat</span>
              </span>
            </div>
            <div className="card-body" style={{ padding: deal.length > 0 ? '0 16px' : undefined }}>
              {deal.length === 0 ? (
                <EmptyState
                  judul="Belum ada deal"
                  keterangan="Buat deal begitu kebutuhan dan anggarannya mulai jelas."
                />
              ) : (
                <ul className="timeline" data-r48="koleksi-data">
                  {deal.map((d) => (
                    <li className="tl-item" key={d.id}>
                      <span className="tl-mark" data-tone={TONE_TAHAP[d.tahap]}>
                        <Icon name="deals" size={15} />
                      </span>
                      <Link href={`/app/deals/${d.id}/`} className="titled grow" style={{ color: 'inherit' }}>
                        <span className="t-body-strong">{d.nama}</span>
                        <span className="t-xs muted">
                          Perkiraan tutup {tanggalRingkas(d.perkiraanTutup)}
                        </span>
                      </Link>
                      <span className="titled" style={{ alignItems: 'flex-end' }}>
                        <span className="t-body-strong num">{rupiah(d.nilai)}</span>
                        <Badge tone={TONE_TAHAP[d.tahap]}>
                          {TAHAP.find((t) => t.id === d.tahap)?.nama}
                        </Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <span className="titled">
                <span className="t-h3">Riwayat interaksi</span>
                <span className="t-sm muted">
                  Termasuk aktivitas yang tercatat pada deal dan kontak di bawahnya
                </span>
              </span>
            </div>
            <div className="card-body" style={{ padding: aktivitas.length > 0 ? '0 16px' : undefined }}>
              {aktivitas.length === 0 ? (
                <EmptyState
                  judul="Belum ada interaksi"
                  keterangan="Catat telepon, meeting, atau email supaya riwayatnya jadi milik perusahaan, bukan milik satu sales."
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
        </div>

        <div className="stack gap-16">
          <section className="card">
            <div className="card-head">
              <span className="t-h3">Profil</span>
            </div>
            <div className="card-body">
              <dl className="dl">
                <dt>Industri</dt>
                <dd>{perusahaan.industri}</dd>
                <dt>Ukuran</dt>
                <dd>
                  {LABEL_UKURAN[perusahaan.ukuran]}, {angka(perusahaan.jumlahKaryawan)} karyawan
                </dd>
                <dt>Situs</dt>
                <dd className="truncate">{perusahaan.situs}</dd>
                <dt>Telepon</dt>
                <dd>{perusahaan.telepon}</dd>
                <dt>Alamat</dt>
                <dd>{perusahaan.alamat}</dd>
                <dt>Masuk sistem</dt>
                <dd>{tanggal(perusahaan.dibuatPada)}</dd>
                <dt>Catatan</dt>
                <dd>{perusahaan.catatan}</dd>
              </dl>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <span className="titled">
                <span className="t-h3">Penawaran</span>
                <span className="t-sm muted">{penawaran.length} dokumen</span>
              </span>
            </div>
            <div className="card-body chipset">
              {penawaran.length === 0 ? (
                <span className="t-sm muted">Belum ada penawaran untuk perusahaan ini.</span>
              ) : (
                penawaran.map((q) => (
                  <RelChip
                    key={q.id}
                    jenis="penawaran"
                    label={`${q.nomor}, ${rupiahSingkat(hitungPenawaran(q).total)}`}
                    href={`/app/penawaran/${q.id}/`}
                  />
                ))
              )}
            </div>
            {penawaran.length > 0 && (
              <div className="card-foot row gap-8 wrap">
                {penawaran.map((q) => (
                  <Badge key={q.id} tone={TONE_STATUS_PENAWARAN[q.status]}>
                    {q.nomor}, {LABEL_STATUS_PENAWARAN[q.status]}
                  </Badge>
                ))}
              </div>
            )}
          </section>

          <section className="card">
            <div className="card-head">
              <span className="t-h3">Penanggung jawab akun</span>
            </div>
            <div className="card-body row gap-12">
              <Avatar nama={owner?.nama ?? 'Tanpa penanggung jawab'} kunci={perusahaan.ownerId} />
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
