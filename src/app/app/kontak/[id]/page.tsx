import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { Avatar, Badge, EmptyState, RelChip, StatCard } from '@/components/ui/Basic';
import { PageHeader } from '@/components/ui/Nav';
import {
  CONTACTS,
  activitiesFor,
  asalLead,
  dealsByContact,
  getCompany,
  getUser,
  namaSumber,
} from '@/data/relations';
import { LABEL_JENIS_AKTIVITAS, TAHAP, TONE_JENIS_AKTIVITAS } from '@/data/settings';
import type { JenisAktivitas, TahapId, Tone } from '@/data/types';
import { jam, rupiah, rupiahSingkat, tanggal, tanggalRingkas } from '@/lib/format';
import { dealBerjalan, nilaiTotal } from '@/lib/metrics';

/* ==========================================================================
   Detail kontak.

   Riwayat interaksinya bukan cuma aktivitas yang kebetulan diberi
   `contactId`, tapi juga yang menempel ke deal milik kontak ini. Itu yang
   membuat linimasanya terasa lengkap, dan itu satu satunya alasan
   `activitiesFor` menerima objek relasi dan bukan satu id.
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
  return CONTACTS.map((k) => ({ id: k.id }));
}

export default async function DetailKontak({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kontak = CONTACTS.find((k) => k.id === id);
  if (!kontak) notFound();

  const perusahaan = getCompany(kontak.companyId);
  const owner = getUser(kontak.ownerId);
  const deal = dealsByContact(kontak.id);
  const berjalan = deal.filter(dealBerjalan);
  const lead = asalLead(kontak);

  const dealIds = deal.map((d) => d.id);
  const aktivitas = [
    ...activitiesFor({ contactId: kontak.id }),
    ...dealIds.flatMap((did) => activitiesFor({ dealId: did })),
  ]
    .filter((a, i, arr) => arr.findIndex((x) => x.id === a.id) === i)
    .sort((a, b) => b.mulai.localeCompare(a.mulai));

  return (
    <>
      <nav aria-label="Remah roti" className="row gap-8 t-sm muted" style={{ marginBottom: 12 }}>
        <Link href="/app/kontak/">Kontak</Link>
        <Icon name="chevron-right" size={13} />
        <span className="truncate">{kontak.nama}</span>
      </nav>

      <PageHeader
        judul={kontak.nama}
        keterangan={`${kontak.jabatan} di ${perusahaan?.nama ?? 'perusahaan yang tidak tercatat'}`}
        aksi={
          <>
            <button type="button" className="btn btn-primary">
              <Icon name="plus" size={16} />
              Catat aktivitas
            </button>
            <button type="button" className="btn btn-secondary">
              Tambah deal
            </button>
            <button type="button" className="btn btn-secondary">
              Ubah kontak
            </button>
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
        <StatCard label="Total deal" nilai={`${deal.length}`} keterangan="Termasuk yang sudah tutup" />
        <StatCard label="Aktivitas" nilai={`${aktivitas.length}`} tone="info" keterangan="Termasuk lewat dealnya" />
        <StatCard
          label="Masuk sistem"
          nilai={tanggalRingkas(kontak.dibuatPada)}
          tone="accent"
          keterangan={`Sumber ${namaSumber(kontak.sumber)}`}
        />
      </div>

      <div className="section grid grid-detail">
        <div className="stack gap-16">
          {/* Jejak balik ke lead asal. Pasangan majunya ada di
              `lead.konversi.contactId` di halaman detail lead. */}
          {lead && (
            <div className="origin-trace">
              <Icon name="leads" size={16} />
              <span className="t-body">
                Kontak ini lahir dari konversi lead <strong>{lead.nama}</strong> yang masuk lewat{' '}
                {namaSumber(lead.sumber)} pada {tanggal(lead.dibuatPada)}.
              </span>
              <Link href={`/app/leads/${lead.id}/`} className="btn btn-ghost btn-sm">
                Buka lead asal
              </Link>
            </div>
          )}

          <section className="card">
            <div className="card-head">
              <span className="titled">
                <span className="t-h3">Deal terkait</span>
                <span className="t-sm muted">{deal.length} deal menyebut kontak ini</span>
              </span>
            </div>
            <div className="card-body" style={{ padding: deal.length > 0 ? '0 16px' : undefined }}>
              {deal.length === 0 ? (
                <EmptyState
                  judul="Belum ada deal"
                  keterangan="Kontak tanpa deal belum menghasilkan apa apa. Buat deal kalau kebutuhannya sudah jelas."
                  aksi={
                    <button type="button" className="btn btn-primary btn-sm">
                      Tambah deal
                    </button>
                  }
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
                  Aktivitas yang menyebut kontak ini maupun deal miliknya
                </span>
              </span>
            </div>
            <div className="card-body" style={{ padding: aktivitas.length > 0 ? '0 16px' : undefined }}>
              {aktivitas.length === 0 ? (
                <EmptyState
                  judul="Belum ada interaksi"
                  keterangan="Catat telepon, meeting, atau email supaya riwayatnya tidak berhenti di HP satu orang."
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
        </div>

        <div className="stack gap-16">
          <section className="card">
            <div className="card-head">
              <span className="t-h3">Relasi</span>
            </div>
            <div className="card-body chipset">
              {perusahaan && (
                <RelChip
                  jenis="perusahaan"
                  label={perusahaan.nama}
                  href={`/app/perusahaan/${perusahaan.id}/`}
                />
              )}
              {lead && <RelChip jenis="lead" label={lead.nama} href={`/app/leads/${lead.id}/`} />}
              {deal.map((d) => (
                <RelChip key={d.id} jenis="deal" label={d.nama} href={`/app/deals/${d.id}/`} />
              ))}
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <span className="t-h3">Data kontak</span>
            </div>
            <div className="card-body">
              <dl className="dl">
                <dt>Email</dt>
                <dd className="truncate">{kontak.email}</dd>
                <dt>Telepon</dt>
                <dd>{kontak.telepon}</dd>
                <dt>WhatsApp</dt>
                <dd>{kontak.whatsapp}</dd>
                <dt>Perusahaan</dt>
                <dd>{perusahaan?.nama}</dd>
                <dt>Kota</dt>
                <dd>
                  {perusahaan?.kota}, {perusahaan?.provinsi}
                </dd>
                <dt>Sumber</dt>
                <dd>{namaSumber(kontak.sumber)}</dd>
                <dt>Catatan</dt>
                <dd>{kontak.catatan}</dd>
              </dl>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <span className="t-h3">Penanggung jawab</span>
            </div>
            <div className="card-body row gap-12">
              <Avatar nama={owner?.nama ?? 'Tanpa penanggung jawab'} kunci={kontak.ownerId} />
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
