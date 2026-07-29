'use client';

import { useMemo, useState } from 'react';
import { BarChart, ChartCard, Funnel, HBarList, Legend, WARNA_SERI } from '@/components/charts/Charts';
import { Avatar, Bar, Badge, StatCard } from '@/components/ui/Basic';
import { DateRangePicker } from '@/components/ui/DatePicker';
import { PageHeader, TabPanel, Tabs, Toolbar, ToolbarSpacer } from '@/components/ui/Nav';
import { Select } from '@/components/ui/Select';
import { hari } from '@/data/clock';
import { getAlasanKalah, namaSumber } from '@/data/relations';
import { TAHAP } from '@/data/settings';
import type { TahapId, Tone } from '@/data/types';
import { useDealStore } from '@/lib/dealStore';
import { namaBulanTahun, persenSingkat, rupiah, rupiahSingkat } from '@/lib/format';
import {
  capaianPerSales,
  corongKonversi,
  dealKalahBulan,
  dealMenangBulan,
  nilaiTertimbang,
  nilaiTotal,
  performaSumberLead,
  pipelineBerjalan,
  rasioMenang,
  ringkasanAlasanKalah,
  targetTim,
} from '@/lib/metrics';

/* ==========================================================================
   Laporan.

   Empat pertanyaan yang diminta HIM-283, dijawab satu per satu:
   konversi per tahap, waktu rata rata per tahap, performa per sales, dan
   sumber lead terbaik. Ditambah satu yang menurut BRAND.md paling berguna
   buat rapat bulan depan, yaitu alasan kalah.

   Catatan hitungan corong. Sebuah deal di tahap Negosiasi pasti pernah lewat
   Prospek, jadi corongnya dihitung KUMULATIF, bukan sekadar menghitung isi
   tiap kolom. Kalau dihitung per kolom, yang keluar bukan corong tapi diagram
   batang biasa yang menyesatkan, dan angka "persen dari tahap sebelumnya"
   jadi tidak berarti apa apa.
   ========================================================================== */

const TONE_TAHAP: Record<TahapId, Tone> = {
  prospek: 'info',
  kualifikasi: 'brand',
  penawaran: 'accent',
  negosiasi: 'warning',
  menang: 'success',
  kalah: 'danger',
};

const TAB = [
  { id: 'pipeline', label: 'Pipeline', icon: 'deals' as const },
  { id: 'sales', label: 'Performa sales', icon: 'tim' as const },
  { id: 'sumber', label: 'Sumber lead', icon: 'leads' as const },
  { id: 'kalah', label: 'Alasan kalah', icon: 'peringatan' as const },
];

/** Geser `ym` (format YYYY-MM) mundur sejumlah bulan. */
function ymMundur(ym: string, bulan: number): string {
  const [y, m] = ym.split('-').map(Number);
  const total = y * 12 + (m - 1) - bulan;
  const yBaru = Math.floor(total / 12);
  const mBaru = (total % 12) + 1;
  return `${yBaru}-${String(mBaru).padStart(2, '0')}`;
}

const MUNDUR_PER_PEMBANDING: Record<string, number | null> = {
  'bulan-lalu': 1,
  'kuartal-lalu': 3,
  'tahun-lalu': 12,
  tanpa: null,
};

export default function HalamanLaporan() {
  const { deals } = useDealStore();
  const [tab, setTab] = useState('pipeline');
  const [mulai, setMulai] = useState(hari(-30));
  const [sampai, setSampai] = useState(hari(0));
  const [pembanding, setPembanding] = useState('bulan-lalu');

  /* Deal yang DIBUAT dalam rentang tanggal terpilih. Dipakai corong, rasio
     menang, dan ringkasan alasan kalah, supaya "periode" berarti sama untuk
     ketiganya: apa yang masuk pipeline pada rentang itu. */
  const dealsPeriode = useMemo(
    () => deals.filter((d) => d.dibuatPada >= mulai && d.dibuatPada <= sampai),
    [deals, mulai, sampai],
  );

  /* Target lawan realisasi dan capaian per sales tetap berbasis BULAN
     (BRAND.md: target dihitung bulanan), jadi yang dipakai adalah bulan
     dari ujung akhir rentang terpilih. */
  const ymTerpilih = sampai.slice(0, 7);

  const berjalan = pipelineBerjalan(deals);
  const corong = corongKonversi(dealsPeriode);
  const capaian = capaianPerSales(ymTerpilih, deals);
  const sumber = performaSumberLead();
  const kalah = ringkasanAlasanKalah(dealsPeriode);
  const menangBulan = dealMenangBulan(ymTerpilih, deals);
  const kalahBulan = dealKalahBulan(ymTerpilih, deals);
  const target = targetTim();
  const realisasi = nilaiTotal(menangBulan);

  const mundurPembanding = MUNDUR_PER_PEMBANDING[pembanding];
  const ymPembanding = mundurPembanding !== null ? ymMundur(ymTerpilih, mundurPembanding) : null;
  const realisasiPembanding = ymPembanding !== null ? nilaiTotal(dealMenangBulan(ymPembanding, deals)) : null;
  const deltaPembanding =
    realisasiPembanding !== null && realisasiPembanding > 0
      ? ((realisasi - realisasiPembanding) / realisasiPembanding) * 100
      : null;

  return (
    <>
      <PageHeader
        judul="Laporan"
        keterangan="Konversi per tahap, waktu rata rata per tahap, performa per sales, dan sumber lead terbaik."
        aksi={
          <>
            <button type="button" className="btn btn-primary">
              Ekspor laporan
            </button>
            <button type="button" className="btn btn-secondary">
              Kirim ke email
            </button>
          </>
        }
      />

      <Toolbar>
        {/* Rentang tanggal WAJIB lewat date picker kustom, bukan teks bebas (R21) */}
        <DateRangePicker
          label="Periode laporan"
          mulai={mulai}
          sampai={sampai}
          onUbah={(a, b) => {
            setMulai(a);
            setSampai(b);
          }}
          lebar={330}
        />
        <Select
          label="Bandingkan dengan"
          nilai={pembanding}
          onUbah={setPembanding}
          lebar={200}
          opsi={[
            { nilai: 'bulan-lalu', label: 'Bulan lalu' },
            { nilai: 'kuartal-lalu', label: 'Kuartal lalu' },
            { nilai: 'tahun-lalu', label: 'Tahun lalu' },
            { nilai: 'tanpa', label: 'Tanpa pembanding' },
          ]}
        />
        <ToolbarSpacer />
        <span className="t-xs muted">
          Corong, rasio menang, dan alasan kalah mengikuti deal yang dibuat pada rentang di atas.
          Target dan capaian tetap per bulan, memakai bulan dari ujung akhir rentang.
        </span>
      </Toolbar>

      <div className="section grid grid-kpi snap-row">
        <StatCard
          label="Nilai pipeline"
          nilai={rupiahSingkat(nilaiTotal(berjalan))}
          keterangan={`${berjalan.length} deal berjalan`}
        />
        <StatCard
          label="Perkiraan tertimbang"
          nilai={rupiahSingkat(nilaiTertimbang(berjalan))}
          tone="accent"
        />
        <StatCard
          label="Rasio menang"
          nilai={persenSingkat(rasioMenang(dealsPeriode))}
          tone="success"
          keterangan={`${menangBulan.length} menang lawan ${kalahBulan.length} kalah, bulan ${namaBulanTahun(ymTerpilih)}`}
        />
        <StatCard
          label={`Capaian ${namaBulanTahun(ymTerpilih)}`}
          nilai={persenSingkat(target > 0 ? (realisasi / target) * 100 : 0)}
          tone={realisasi >= target ? 'success' : 'warning'}
          keterangan={
            deltaPembanding !== null
              ? `${rupiahSingkat(realisasi)} dari ${rupiahSingkat(target)}, ${deltaPembanding >= 0 ? 'naik' : 'turun'} ${persenSingkat(Math.abs(deltaPembanding))} dari ${namaBulanTahun(ymPembanding!)}`
              : `${rupiahSingkat(realisasi)} dari ${rupiahSingkat(target)}`
          }
        />
      </div>

      <div className="section">
        <Tabs item={TAB} aktif={tab} onUbah={setTab} label="Bagian laporan" />

        <TabPanel id="pipeline" aktif={tab}>
          <div className="grid grid-2">
            <ChartCard
              judul="Konversi per tahap"
              keterangan="Dihitung kumulatif, jadi deal di tahap lanjut ikut dihitung di tahap sebelumnya"
            >
              <Funnel
                data={corong.map((c, i) => ({
                  nama: c.nama,
                  jumlah: c.jumlah,
                  nilai: rupiahSingkat(c.nilai),
                  persenDariAwal: c.persenDariAwal,
                  persenDariSebelumnya: c.persenDariSebelumnya,
                  rataHari: c.rataHari,
                  warna: WARNA_SERI[i % WARNA_SERI.length],
                }))}
              />
            </ChartCard>

            <ChartCard
              judul="Waktu rata rata per tahap"
              keterangan="Berapa hari deal duduk di tahapnya sekarang. Semakin lama, semakin perlu ditagih."
            >
              <BarChart
                judul="Waktu rata rata per tahap dalam hari"
                formatNilai={(n) => `${Math.round(n)} hari`}
                data={corong.map((c, i) => ({
                  label: c.nama,
                  nilai: c.rataHari,
                  warna: WARNA_SERI[i % WARNA_SERI.length],
                }))}
              />
              <Legend
                item={corong.map((c, i) => ({
                  label: `${c.nama}, ${c.rataHari} hari`,
                  warna: WARNA_SERI[i % WARNA_SERI.length],
                }))}
              />
            </ChartCard>
          </div>

          <div className="section card">
            <div className="card-head">
              <span className="titled">
                <span className="t-h3">Rincian per tahap</span>
                <span className="t-sm muted">Jumlah deal dan nilai di setiap tahap</span>
              </span>
            </div>
            <div className="card-body stack gap-12">
              {TAHAP.map((t) => {
                const isi = berjalan.filter((d) => d.tahap === t.id);
                const semua = t.terminal === null ? isi : [];
                const nilai = nilaiTotal(semua);
                return (
                  <div className="row gap-12" key={t.id}>
                    <span
                      className="stage-swatch"
                      style={{
                        background:
                          t.tone === 'info'
                            ? 'var(--info)'
                            : t.tone === 'brand'
                              ? 'var(--brand)'
                              : t.tone === 'accent'
                                ? 'var(--accent)'
                                : t.tone === 'warning'
                                  ? 'var(--warning)'
                                  : t.tone === 'success'
                                    ? 'var(--success)'
                                    : 'var(--danger)',
                      }}
                      aria-hidden="true"
                    />
                    <span className="titled grow">
                      <span className="t-body-strong">{t.nama}</span>
                      <span className="t-xs muted">{t.keterangan}</span>
                    </span>
                    <Badge tone={TONE_TAHAP[t.id]}>{semua.length} deal</Badge>
                    <span className="t-body-strong num" style={{ minWidth: 120, textAlign: 'right' }}>
                      {t.terminal === null ? rupiahSingkat(nilai) : 'Tahap akhir'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </TabPanel>

        <TabPanel id="sales" aktif={tab}>
          <div className="card">
            <div className="card-head">
              <span className="titled">
                <span className="t-h3">Performa per sales</span>
                <span className="t-sm muted">
                  Realisasi bulan {namaBulanTahun(ymTerpilih)} lawan target masing masing
                </span>
              </span>
            </div>
            <div className="card-body stack gap-16">
              {capaian.map((c) => (
                <div className="stack gap-8" key={c.user.id}>
                  <div className="row gap-12">
                    <Avatar nama={c.user.nama} kunci={c.user.id} />
                    <span className="titled grow">
                      <span className="t-body-strong">{c.user.nama}</span>
                      <span className="t-xs muted">
                        {c.user.jabatan}, pipeline berjalan {rupiahSingkat(c.nilaiPipeline)}
                      </span>
                    </span>
                    <span className="titled" style={{ alignItems: 'flex-end' }}>
                      <span className="t-body-strong num">{rupiah(c.realisasi)}</span>
                      <span className="t-xs muted num">target {rupiah(c.target)}</span>
                    </span>
                  </div>
                  <Bar
                    persen={c.persenCapaian}
                    tone={c.persenCapaian >= 100 ? 'success' : c.persenCapaian >= 50 ? 'brand' : 'warning'}
                    label={`Capaian ${c.user.nama}`}
                  />
                  <div className="row gap-16 t-xs muted">
                    <span>{c.jumlahMenang} deal menang</span>
                    <span>{c.jumlahKalah} deal kalah</span>
                    <span>{persenSingkat(c.persenCapaian)} dari target</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabPanel>

        <TabPanel id="sumber" aktif={tab}>
          <div className="grid grid-2">
            <ChartCard
              judul="Volume lead per sumber"
              keterangan="Berapa banyak lead yang masuk dari tiap kanal"
            >
              <HBarList
                judul="Volume lead per sumber"
                formatNilai={(n) => `${n} lead`}
                data={sumber.map((s) => ({
                  label: namaSumber(s.sumberId),
                  nilai: s.jumlahLead,
                  keterangan: `${s.jumlahKonversi} dikonversi`,
                }))}
              />
            </ChartCard>

            <ChartCard
              judul="Sumber lead terbaik"
              keterangan="Diukur dari konversi jadi deal, bukan dari volume. Volume besar tanpa konversi itu biaya, bukan hasil."
            >
              <HBarList
                judul="Persentase konversi per sumber"
                formatNilai={(n) => persenSingkat(n)}
                data={[...sumber]
                  .sort((a, b) => b.persenKonversi - a.persenKonversi)
                  .map((s) => ({
                    label: namaSumber(s.sumberId),
                    nilai: s.persenKonversi,
                    keterangan:
                      s.nilaiDeal > 0
                        ? `Nilai deal ${rupiahSingkat(s.nilaiDeal)}`
                        : 'Belum ada deal',
                  }))}
              />
            </ChartCard>
          </div>
        </TabPanel>

        <TabPanel id="kalah" aktif={tab}>
          <div className="grid grid-2">
            <ChartCard
              judul="Alasan kalah"
              keterangan="Kalah di harga dan kalah karena anggaran ditunda butuh tindak lanjut yang berbeda"
            >
              {kalah.length === 0 ? (
                <p className="t-sm muted">Belum ada deal yang ditandai kalah dengan alasan.</p>
              ) : (
                <HBarList
                  judul="Jumlah deal kalah per alasan"
                  formatNilai={(n) => `${n} deal`}
                  data={kalah.map((k) => ({
                    label: getAlasanKalah(k.alasanId)?.nama ?? k.alasanId,
                    nilai: k.jumlah,
                    keterangan: `Nilai hilang ${rupiahSingkat(k.nilai)}`,
                    warna: 'var(--danger)',
                  }))}
                />
              )}
            </ChartCard>

            <div className="card">
              <div className="card-head">
                <span className="titled">
                  <span className="t-h3">Tindak lanjut yang masuk akal</span>
                  <span className="t-sm muted">
                    Deal kalah bukan akhir, sebagian besar cuma soal waktu
                  </span>
                </span>
              </div>
              <div className="card-body stack gap-12">
                {[
                  ['Harga terlalu tinggi', 'Tawarkan paket lebih kecil, atau jadwalkan ulang saat anggaran naik.'],
                  ['Anggaran ditunda', 'Catat bulan anggaran berikutnya dan buat pengingat, jangan tunggu diingat.'],
                  ['Pilih kompetitor', 'Cari tahu apa yang menang, itu bahan paling berharga untuk deal berikutnya.'],
                  ['Tidak ada respons', 'Cek apakah kontaknya memang pengambil keputusan, atau kita salah pintu masuk.'],
                ].map(([judul, isi]) => (
                  <div className="titled" key={judul}>
                    <span className="t-body-strong">{judul}</span>
                    <span className="t-sm muted">{isi}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabPanel>
      </div>
    </>
  );
}
