import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { Avatar, Badge, Placeholder, RelChip } from '@/components/ui/Basic';
import { PageHeader } from '@/components/ui/Nav';
import { Logo } from '@/components/Logo';
import {
  QUOTATIONS,
  getCompany,
  getContact,
  getDeal,
  getUser,
  hitungItem,
  hitungPenawaran,
} from '@/data/relations';
import { LABEL_STATUS_PENAWARAN, TAHAP, TONE_STATUS_PENAWARAN } from '@/data/settings';
import { angka, rupiah, tanggal } from '@/lib/format';

/* ==========================================================================
   Detail penawaran, ditampilkan menyerupai dokumen.

   Angkanya tidak dihitung ulang di layar ini. Semua lewat `hitungPenawaran`,
   fungsi yang sama dengan yang dipakai daftar penawaran, sehingga subtotal,
   diskon, pajak, dan total mustahil berbeda antara dua layar.
   ========================================================================== */

export function generateStaticParams() {
  return QUOTATIONS.map((q) => ({ id: q.id }));
}

export default async function DetailPenawaran({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const q = QUOTATIONS.find((x) => x.id === id);
  if (!q) notFound();

  const rincian = hitungPenawaran(q);
  const deal = getDeal(q.dealId);
  const perusahaan = getCompany(q.companyId);
  const kontak = getContact(q.contactId);
  const owner = getUser(q.ownerId);

  return (
    <>
      <nav aria-label="Remah roti" className="row gap-8 t-sm muted" style={{ marginBottom: 12 }}>
        <Link href="/app/penawaran/">Penawaran</Link>
        <Icon name="chevron-right" size={13} />
        <span className="truncate">{q.nomor}</span>
      </nav>

      <PageHeader
        judul={q.nomor}
        keterangan={`${deal?.nama ?? 'Deal tidak ditemukan'}, ${perusahaan?.nama ?? ''}`}
        aksi={
          <>
            <button type="button" className="btn btn-primary">
              <Icon name="email" size={16} />
              Kirim penawaran
            </button>
            <button type="button" className="btn btn-secondary">
              <Icon name="unduh" size={16} />
              Unduh PDF
            </button>
            <button type="button" className="btn btn-secondary">
              Duplikat
            </button>
          </>
        }
        meta={<Badge tone={TONE_STATUS_PENAWARAN[q.status]}>{LABEL_STATUS_PENAWARAN[q.status]}</Badge>}
      />

      <div className="grid grid-detail">
        <div className="stack gap-16">
          <article className="quote-doc">
            <header className="quote-head">
              <div className="stack gap-12">
                <Logo varian="terang" size={28} />
                <span className="titled">
                  <span className="t-label muted">Penawaran untuk</span>
                  <span className="t-h3">{perusahaan?.nama}</span>
                  <span className="t-sm muted">{perusahaan?.alamat}</span>
                  {kontak && (
                    <span className="t-sm muted">
                      Kepada {kontak.nama}, {kontak.jabatan}
                    </span>
                  )}
                </span>
              </div>

              <dl className="dl" style={{ gridTemplateColumns: 'auto auto', gap: '6px 16px' }}>
                <dt>Nomor</dt>
                <dd className="mono">{q.nomor}</dd>
                <dt>Tanggal</dt>
                <dd>{tanggal(q.tanggal)}</dd>
                <dt>Berlaku</dt>
                <dd>{tanggal(q.berlakuHingga)}</dd>
                <dt>Status</dt>
                <dd>
                  <Badge tone={TONE_STATUS_PENAWARAN[q.status]}>
                    {LABEL_STATUS_PENAWARAN[q.status]}
                  </Badge>
                </dd>
              </dl>
            </header>

            {/* Tabel item. Di mobile tabel ini tetap tabel karena cuma empat
                kolom dan angkanya pendek, tapi lebarnya dikunci supaya tidak
                pernah memicu gulir mendatar (R19). */}
            <div className="table-wrap" style={{ border: 0, marginTop: 20 }}>
              <table className="table">
                <caption className="sr-only">Baris item penawaran {q.nomor}</caption>
                <thead>
                  <tr>
                    <th scope="col" style={{ position: 'static' }}>
                      Deskripsi
                    </th>
                    {/* Lebar persen, bukan piksel. Dengan table-layout fixed,
                        persen selalu muat berapa pun lebar induknya, jadi tabel
                        dokumen ini tidak pernah meluap di 375px (R19). */}
                    <th scope="col" className="num" style={{ position: 'static', width: '16%' }}>
                      Qty
                    </th>
                    <th scope="col" className="num" style={{ position: 'static', width: '24%' }}>
                      Harga satuan
                    </th>
                    <th scope="col" className="num" style={{ position: 'static', width: '26%' }}>
                      Jumlah
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {q.items.map((item, i) => (
                    <tr key={i}>
                      <td>
                        <span className="t-table">{item.deskripsi}</span>
                      </td>
                      <td className="num">
                        {angka(item.qty)} {item.satuan}
                      </td>
                      <td className="num">{rupiah(item.hargaSatuan)}</td>
                      <td className="num">{rupiah(hitungItem(item))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="quote-total" style={{ marginTop: 16 }}>
              <div className="quote-total-row">
                <span className="t-sm muted">Subtotal</span>
                <span className="t-body num">{rupiah(rincian.subtotal)}</span>
              </div>
              {q.diskonPersen > 0 && (
                <div className="quote-total-row">
                  <span className="t-sm muted">Diskon {q.diskonPersen} persen</span>
                  <span className="t-body num">{rupiah(-rincian.diskon)}</span>
                </div>
              )}
              <div className="quote-total-row">
                <span className="t-sm muted">Dasar pengenaan pajak</span>
                <span className="t-body num">{rupiah(rincian.dasarPajak)}</span>
              </div>
              <div className="quote-total-row">
                <span className="t-sm muted">PPN {q.pajakPersen} persen</span>
                <span className="t-body num">{rupiah(rincian.pajak)}</span>
              </div>
              <div className="quote-total-row" data-grand="true">
                <span className="t-h3">Total</span>
                <span className="t-h3 num">{rupiah(rincian.total)}</span>
              </div>
            </div>

            {q.catatan && (
              <>
                <div className="hr" />
                <span className="titled">
                  <span className="t-label muted">Catatan</span>
                  <span className="t-body">{q.catatan}</span>
                </span>
              </>
            )}
          </article>

          <Placeholder
            judul="Unduh PDF dan kirim email"
            untuk="Stage 5 memutuskan apakah PDF dibuat lewat cetak browser dengan stylesheet khusus print, atau lewat pustaka di sisi klien. Karena ini static export tanpa backend, jalur cetak browser yang paling jujur untuk demo."
          />
        </div>

        <div className="stack gap-16">
          <section className="card">
            <div className="card-head">
              <span className="t-h3">Relasi</span>
            </div>
            <div className="card-body chipset">
              {deal && <RelChip jenis="deal" label={deal.nama} href={`/app/deals/${deal.id}/`} />}
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
            </div>
          </section>

          {deal && (
            <section className="card">
              <div className="card-head">
                <span className="titled">
                  <span className="t-h3">Deal terkait</span>
                  <span className="t-sm muted">
                    Tahap {TAHAP.find((t) => t.id === deal.tahap)?.nama}
                  </span>
                </span>
              </div>
              <div className="card-body">
                <dl className="dl">
                  <dt>Nilai deal</dt>
                  <dd className="num">{rupiah(deal.nilai)}</dd>
                  <dt>Nilai penawaran</dt>
                  <dd className="num">{rupiah(rincian.total)}</dd>
                  <dt>Perkiraan tutup</dt>
                  <dd>{tanggal(deal.perkiraanTutup)}</dd>
                </dl>
              </div>
              <div className="card-foot">
                <Link href={`/app/deals/${deal.id}/`} className="btn btn-ghost btn-sm">
                  Buka deal
                  <Icon name="arrow-right" size={14} />
                </Link>
              </div>
            </section>
          )}

          <section className="card">
            <div className="card-head">
              <span className="t-h3">Dibuat oleh</span>
            </div>
            <div className="card-body row gap-12">
              <Avatar nama={owner?.nama ?? 'Tanpa pembuat'} kunci={q.ownerId} />
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
