'use client';

import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { BarChart, ChartCard, Legend, LineChart, WARNA_SERI } from '@/components/charts/Charts';
import { Avatar, Badge, Bar, EmptyState, StatCard } from '@/components/ui/Basic';
import { PageHeader } from '@/components/ui/Nav';
import { HARI_INI } from '@/data/clock';
import { getContact, namaCompany, namaUser } from '@/data/relations';
import { LABEL_JENIS_AKTIVITAS, TAHAP, TONE_JENIS_AKTIVITAS } from '@/data/settings';
import type { TahapId, Tone } from '@/data/types';
import { useDealStore } from '@/lib/dealStore';
import {
  jam,
  namaBulanTahun,
  persenSingkat,
  rupiahSingkat,
  tanggalLengkap,
  tanggalRingkas,
} from '@/lib/format';
import {
  aktivitasHariIni,
  aktivitasTerlambat,
  bulanBerjalan,
  capaianPerSales,
  dealKalahBulan,
  dealMenangBulan,
  dealPerTahap,
  hariMandek,
  isMandek,
  nilaiTertimbang,
  nilaiTotal,
  pipelineBerjalan,
  rasioMenang,
  targetTim,
  trenPipelineMingguan,
} from '@/lib/metrics';

/* ==========================================================================
   Dashboard sales.

   Isinya persis yang diminta HIM-283: nilai pipeline, deal menang dan kalah
   bulan ini, target lawan realisasi, aktivitas hari ini, dan leaderboard.

   Semua angka dihitung dari data yang sama lewat `src/lib/metrics.ts`. Tidak
   ada satu pun angka yang diketik manual di layar ini.
   ========================================================================== */

const TONE_TAHAP: Record<TahapId, Tone> = {
  prospek: 'info',
  kualifikasi: 'brand',
  penawaran: 'accent',
  negosiasi: 'warning',
  menang: 'success',
  kalah: 'danger',
};

export default function Dashboard() {
  const { deals } = useDealStore();
  const berjalan = pipelineBerjalan(deals);
  const menang = dealMenangBulan(bulanBerjalan, deals);
  const kalah = dealKalahBulan(bulanBerjalan, deals);
  const realisasi = nilaiTotal(menang);
  const target = targetTim();
  const perTahap = dealPerTahap(deals);
  const mandek = berjalan.filter(isMandek).sort((a, b) => hariMandek(b) - hariMandek(a));
  const hariIni = aktivitasHariIni();
  const terlambat = aktivitasTerlambat();
  const capaian = capaianPerSales(bulanBerjalan, deals);
  const tren = trenPipelineMingguan(deals);

  return (
    <>
      <PageHeader
        judul="Dashboard sales"
        keterangan={`${tanggalLengkap(HARI_INI)}. Ringkasan pipeline dan pekerjaan hari ini.`}
        aksi={
          <>
            <Link href="/app/deals/" className="btn btn-primary">
              <Icon name="plus" size={16} />
              Tambah deal
            </Link>
            <Link href="/app/aktivitas/" className="btn btn-secondary">
              Catat aktivitas
            </Link>
          </>
        }
      />

      {/* Empat kartu KPI. Lebih dari tiga item peer, jadi di mobile berubah
          jadi snap carousel, bukan tumpukan panjang (R48). */}
      <div className="grid grid-kpi snap-row">
        <StatCard
          label="Nilai pipeline berjalan"
          nilai={rupiahSingkat(nilaiTotal(berjalan))}
          keterangan={`${berjalan.length} deal di empat tahap aktif`}
        />
        <StatCard
          label="Perkiraan tertimbang"
          nilai={rupiahSingkat(nilaiTertimbang(berjalan))}
          tone="accent"
          keterangan="Nilai deal dikali probabilitas tahapnya"
        />
        <StatCard
          label={`Menang ${namaBulanTahun(bulanBerjalan)}`}
          nilai={rupiahSingkat(realisasi)}
          tone="success"
          delta={{ arah: 'up', teks: `${menang.length} deal ditutup menang` }}
        />
        <StatCard
          label={`Kalah ${namaBulanTahun(bulanBerjalan)}`}
          nilai={rupiahSingkat(nilaiTotal(kalah))}
          tone="danger"
          delta={{ arah: 'down', teks: `${kalah.length} deal ditutup kalah` }}
        />
      </div>

      {/* --------------------------- Target tim ----------------------------- */}
      <section className="section grid grid-2">
        <div className="card">
          <div className="card-head">
            <span className="titled">
              <span className="t-h3">Target lawan realisasi</span>
              <span className="t-sm muted">Target tim bulan {namaBulanTahun(bulanBerjalan)}</span>
            </span>
            <Badge tone={realisasi >= target ? 'success' : 'warning'}>
              {persenSingkat(target > 0 ? (realisasi / target) * 100 : 0)} tercapai
            </Badge>
          </div>
          <div className="card-body stack gap-16">
            <div className="stack gap-8">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="t-sm muted">Realisasi</span>
                <span className="t-body-strong num">{rupiahSingkat(realisasi)}</span>
              </div>
              <Bar
                persen={target > 0 ? (realisasi / target) * 100 : 0}
                tone={realisasi >= target ? 'success' : 'brand'}
                label="Capaian target tim"
              />
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="t-xs muted">Target</span>
                <span className="t-xs muted num">{rupiahSingkat(target)}</span>
              </div>
            </div>

            <div className="hr" />

            <div className="row gap-24 wrap">
              <span className="titled">
                <span className="t-label muted">Rasio menang</span>
                <span className="t-metric-sm num">{persenSingkat(rasioMenang())}</span>
              </span>
              <span className="titled">
                <span className="t-label muted">Deal berjalan</span>
                <span className="t-metric-sm num">{berjalan.length}</span>
              </span>
              <span className="titled">
                <span className="t-label muted">Deal mandek</span>
                <span className="t-metric-sm num">{mandek.length}</span>
              </span>
            </div>
          </div>
        </div>

        <ChartCard
          judul="Nilai pipeline per tahap"
          keterangan="Empat tahap aktif, tidak termasuk deal yang sudah ditutup"
        >
          <BarChart
            judul="Nilai pipeline per tahap"
            formatNilai={rupiahSingkat}
            data={TAHAP.filter((t) => t.terminal === null).map((t, i) => ({
              label: t.nama,
              nilai: nilaiTotal(perTahap[t.id]),
              warna: WARNA_SERI[i],
            }))}
          />
          <Legend
            item={TAHAP.filter((t) => t.terminal === null).map((t, i) => ({
              label: `${t.nama}, ${perTahap[t.id].length} deal`,
              warna: WARNA_SERI[i],
            }))}
          />
        </ChartCard>
      </section>

      {/* ------------------------ Pekerjaan hari ini ------------------------- */}
      <section className="section grid grid-2">
        <div className="card">
          <div className="card-head">
            <span className="titled">
              <span className="t-h3">Aktivitas hari ini</span>
              <span className="t-sm muted">
                {hariIni.length} terjadwal, {terlambat.length} terlambat
              </span>
            </span>
            <Link href="/app/aktivitas/" className="btn btn-ghost btn-sm">
              Lihat semua
            </Link>
          </div>
          <div className="card-body" style={{ padding: hariIni.length > 0 ? 0 : undefined }}>
            {hariIni.length === 0 ? (
              <EmptyState
                judul="Tidak ada yang jatuh tempo hari ini"
                keterangan="Bagus. Cek deal yang mandek supaya tetap jalan."
                aksi={
                  <Link href="/app/deals/" className="btn btn-secondary btn-sm">
                    Lihat deal mandek
                  </Link>
                }
              />
            ) : (
              <ul className="timeline" data-r48="koleksi-data" style={{ padding: '0 16px' }}>
                {hariIni.map((a) => {
                  const kontak = getContact(a.relasi.contactId);
                  return (
                    <li className="tl-item" key={a.id}>
                      <span className="tl-mark" data-tone={TONE_JENIS_AKTIVITAS[a.jenis]}>
                        <Icon name={a.jenis === 'telepon' ? 'telepon' : a.jenis === 'email' ? 'email' : a.jenis === 'meeting' ? 'meeting' : 'tugas'} size={15} />
                      </span>
                      <span className="titled grow">
                        <span className="t-body-strong">{a.judul}</span>
                        <span className="t-xs muted">
                          {jam(a.mulai)}, {LABEL_JENIS_AKTIVITAS[a.jenis]}, {namaUser(a.ownerId)}
                        </span>
                        {kontak && <span className="t-xs muted">{kontak.nama}</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <span className="titled">
              <span className="t-h3">Deal mandek</span>
              <span className="t-sm muted">Tidak tersentuh lebih dari 14 hari</span>
            </span>
            <Link href="/app/deals/" className="btn btn-ghost btn-sm">
              Buka papan
            </Link>
          </div>
          <div className="card-body" style={{ padding: mandek.length > 0 ? 0 : undefined }}>
            {mandek.length === 0 ? (
              <EmptyState
                judul="Tidak ada deal yang mandek"
                keterangan="Semua deal berjalan punya langkah berikutnya. Pertahankan."
              />
            ) : (
              <ul className="timeline" data-r48="koleksi-data" style={{ padding: '0 16px' }}>
                {mandek.map((d) => (
                  <li className="tl-item" key={d.id}>
                    <span className="tl-mark" data-tone="warning">
                      <Icon name="peringatan" size={15} />
                    </span>
                    <Link href={`/app/deals/${d.id}/`} className="titled grow" style={{ color: 'inherit' }}>
                      <span className="t-body-strong">{d.nama}</span>
                      <span className="t-xs muted">{namaCompany(d.companyId)}</span>
                      <span className="t-xs muted">
                        Belum tersentuh {hariMandek(d)} hari, perkiraan tutup{' '}
                        {tanggalRingkas(d.perkiraanTutup)}
                      </span>
                    </Link>
                    <span className="titled" style={{ alignItems: 'flex-end' }}>
                      <span className="t-body-strong num">{rupiahSingkat(d.nilai)}</span>
                      <Badge tone={TONE_TAHAP[d.tahap]}>{TAHAP.find((t) => t.id === d.tahap)?.nama}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* ---------------------------- Leaderboard ---------------------------- */}
      <section className="section">
        <div className="card">
          <div className="card-head">
            <span className="titled">
              <span className="t-h3">Leaderboard sales</span>
              <span className="t-sm muted">
                Realisasi bulan {namaBulanTahun(bulanBerjalan)} lawan target masing masing
              </span>
            </span>
            <Link href="/app/laporan/" className="btn btn-ghost btn-sm">
              Laporan lengkap
            </Link>
          </div>
          <div className="card-body stack gap-16">
            {capaian.map((c, i) => (
              <div className="stack gap-8" key={c.user.id}>
                <div className="row gap-12">
                  <span className="t-body-strong num" style={{ width: 20, color: 'var(--text-muted)' }}>
                    {i + 1}
                  </span>
                  <Avatar nama={c.user.nama} kunci={c.user.id} />
                  <span className="titled grow">
                    <span className="t-body-strong">{c.user.nama}</span>
                    <span className="t-xs muted">
                      {c.user.jabatan}, {c.jumlahMenang} menang dan {c.jumlahKalah} kalah
                    </span>
                  </span>
                  <span className="titled" style={{ alignItems: 'flex-end' }}>
                    <span className="t-body-strong num">{rupiahSingkat(c.realisasi)}</span>
                    <span className="t-xs muted num">dari {rupiahSingkat(c.target)}</span>
                  </span>
                </div>
                <Bar
                  persen={c.persenCapaian}
                  tone={c.persenCapaian >= 100 ? 'success' : c.persenCapaian >= 50 ? 'brand' : 'warning'}
                  label={`Capaian ${c.user.nama}`}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <ChartCard
          judul="Tren pipeline delapan minggu"
          keterangan="Nilai deal berjalan pada akhir tiap minggu. Naik turun mengikuti perpindahan tahap di papan kanban."
        >
          <LineChart judul="Nilai pipeline berjalan per minggu" formatNilai={rupiahSingkat} data={tren} />
        </ChartCard>
      </section>
    </>
  );
}
