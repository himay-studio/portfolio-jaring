/* ==========================================================================
   Grafik. Dirender dari data sebagai SVG, bukan berkas gambar.

   Ini bagian dari keputusan "aplikasi ini tidak bergantung pada gambar hasil
   generate" yang dijelaskan di MEDIA.md. Grafik yang digambar dari data juga
   selalu tajam, selalu sinkron dengan angkanya, dan bisa dibaca pembaca layar
   lewat tabel bayangan.

   Aturan DESIGN.md 6.8 yang wajib: enam warna seri dipakai berurutan, garis
   kisi `--chart-grid`, label sumbu `--chart-axis` ukuran `--t-chart`, dan
   SETIAP seri punya legenda berlabel teks. Warna tidak pernah jadi satu
   satunya pembeda.
   ========================================================================== */

import type { ReactNode } from 'react';

export const WARNA_SERI = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
];

/* -------------------------------------------------------------------------
   Legenda
   ------------------------------------------------------------------------- */

export function Legend({ item }: { item: { label: string; warna: string }[] }) {
  return (
    <ul className="legend">
      {item.map((i) => (
        <li key={i.label} className="legend-item t-xs">
          <span className="legend-swatch" style={{ background: i.warna }} aria-hidden="true" />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

/**
 * Tabel bayangan untuk pembaca layar. Grafik SVG dikasih aria-hidden, dan
 * angkanya tetap terbaca lewat tabel ini.
 */
function TabelBayangan({
  judul,
  kolom,
  baris,
}: {
  judul: string;
  kolom: string[];
  baris: (string | number)[][];
}) {
  return (
    <table className="sr-only">
      <caption>{judul}</caption>
      <thead>
        <tr>
          {kolom.map((k) => (
            <th key={k} scope="col">
              {k}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {baris.map((r, i) => (
          <tr key={i}>
            {r.map((sel, j) => (
              <td key={j}>{sel}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* -------------------------------------------------------------------------
   Grafik batang tegak
   ------------------------------------------------------------------------- */

export interface TitikBatang {
  label: string;
  nilai: number;
  warna?: string;
}

export function BarChart({
  data,
  judul,
  formatNilai,
  tinggi = 200,
}: {
  data: TitikBatang[];
  judul: string;
  formatNilai: (n: number) => string;
  tinggi?: number;
}) {
  const W = 640;
  const H = tinggi;
  const padKiri = 64;
  const padBawah = 28;
  const padAtas = 12;
  const areaLebar = W - padKiri - 8;
  const areaTinggi = H - padAtas - padBawah;

  const maks = Math.max(1, ...data.map((d) => d.nilai));
  const lebarSlot = areaLebar / Math.max(1, data.length);
  const lebarBatang = Math.min(48, lebarSlot * 0.62);
  const garisKisi = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div data-r48="grafik">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="chart"
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ height: H }}
      >
        {garisKisi.map((g) => {
          const y = padAtas + areaTinggi * (1 - g);
          return (
            <g key={g}>
              <line x1={padKiri} y1={y} x2={W - 8} y2={y} className="chart-grid-line" />
              <text x={padKiri - 8} y={y + 4} textAnchor="end" className="chart-axis-text">
                {formatNilai(maks * g)}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const t = (d.nilai / maks) * areaTinggi;
          const x = padKiri + lebarSlot * i + (lebarSlot - lebarBatang) / 2;
          return (
            <g key={d.label}>
              <rect
                x={x}
                y={padAtas + areaTinggi - t}
                width={lebarBatang}
                height={Math.max(1, t)}
                fill={d.warna ?? WARNA_SERI[i % WARNA_SERI.length]}
              />
              <text
                x={x + lebarBatang / 2}
                y={H - 8}
                textAnchor="middle"
                className="chart-axis-text"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      <TabelBayangan
        judul={judul}
        kolom={['Kategori', 'Nilai']}
        baris={data.map((d) => [d.label, formatNilai(d.nilai)])}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------
   Grafik garis dengan area
   ------------------------------------------------------------------------- */

export function LineChart({
  data,
  judul,
  formatNilai,
  warna = 'var(--chart-1)',
  tinggi = 200,
}: {
  data: TitikBatang[];
  judul: string;
  formatNilai: (n: number) => string;
  warna?: string;
  tinggi?: number;
}) {
  const W = 640;
  const H = tinggi;
  const padKiri = 64;
  const padBawah = 28;
  const padAtas = 12;
  const areaLebar = W - padKiri - 8;
  const areaTinggi = H - padAtas - padBawah;

  const maks = Math.max(1, ...data.map((d) => d.nilai));
  const langkah = data.length > 1 ? areaLebar / (data.length - 1) : 0;

  const titik = data.map((d, i) => ({
    x: padKiri + langkah * i,
    y: padAtas + areaTinggi * (1 - d.nilai / maks),
  }));

  const garis = titik.map((t) => `${t.x},${t.y}`).join(' ');
  const area =
    titik.length > 0
      ? `${padKiri},${padAtas + areaTinggi} ${garis} ${titik[titik.length - 1].x},${
          padAtas + areaTinggi
        }`
      : '';

  return (
    <div data-r48="grafik">
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" aria-hidden="true" style={{ height: H }}>
        {[0, 0.25, 0.5, 0.75, 1].map((g) => {
          const y = padAtas + areaTinggi * (1 - g);
          return (
            <g key={g}>
              <line x1={padKiri} y1={y} x2={W - 8} y2={y} className="chart-grid-line" />
              <text x={padKiri - 8} y={y + 4} textAnchor="end" className="chart-axis-text">
                {formatNilai(maks * g)}
              </text>
            </g>
          );
        })}

        <polygon points={area} fill={warna} opacity="0.12" />
        <polyline points={garis} fill="none" stroke={warna} strokeWidth="2" />
        {titik.map((t, i) => (
          <rect key={i} x={t.x - 3} y={t.y - 3} width="6" height="6" fill={warna} />
        ))}

        {data.map((d, i) => (
          <text
            key={d.label}
            x={padKiri + langkah * i}
            y={H - 8}
            textAnchor="middle"
            className="chart-axis-text"
          >
            {d.label}
          </text>
        ))}
      </svg>

      <TabelBayangan
        judul={judul}
        kolom={['Periode', 'Nilai']}
        baris={data.map((d) => [d.label, formatNilai(d.nilai)])}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------
   Daftar batang mendatar. Dipakai untuk sumber lead dan alasan kalah, di mana
   labelnya panjang dan tidak muat di sumbu tegak.
   ------------------------------------------------------------------------- */

export function HBarList({
  data,
  judul,
  formatNilai,
}: {
  data: { label: string; nilai: number; keterangan?: string; warna?: string }[];
  judul: string;
  formatNilai: (n: number) => string;
}) {
  const maks = Math.max(1, ...data.map((d) => d.nilai));
  return (
    <div className="stack gap-12" data-r48="grafik">
      <span className="sr-only">{judul}</span>
      {data.map((d, i) => (
        <div key={d.label} className="funnel-row">
          <div className="funnel-top">
            {/* R50: label dan keterangan blok terpisah */}
            <span className="titled">
              <span className="t-sm">{d.label}</span>
              {d.keterangan && <span className="t-xs muted">{d.keterangan}</span>}
            </span>
            <span className="t-body-strong num">{formatNilai(d.nilai)}</span>
          </div>
          <div className="funnel-track">
            <div
              className="funnel-fill"
              style={{
                width: `${(d.nilai / maks) * 100}%`,
                background: d.warna ?? WARNA_SERI[i % WARNA_SERI.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Corong konversi per tahap
   ------------------------------------------------------------------------- */

export function Funnel({
  data,
}: {
  data: {
    nama: string;
    jumlah: number;
    nilai: string;
    persenDariAwal: number;
    persenDariSebelumnya: number;
    rataHari: number;
    warna: string;
  }[];
}) {
  return (
    <div className="funnel" data-r48="grafik">
      {data.map((d) => (
        <div key={d.nama} className="funnel-row">
          <div className="funnel-top">
            <span className="titled">
              <span className="t-body-strong">{d.nama}</span>
              <span className="t-xs muted">
                {d.jumlah} deal, rata rata {d.rataHari} hari di tahap ini
              </span>
            </span>
            <span className="titled" style={{ alignItems: 'flex-end', textAlign: 'right' }}>
              <span className="t-body-strong num">{d.nilai}</span>
              <span className="t-xs muted num">
                {Math.round(d.persenDariSebelumnya)}% dari tahap sebelumnya
              </span>
            </span>
          </div>
          <div className="funnel-track">
            <div
              className="funnel-fill"
              style={{ width: `${Math.max(2, d.persenDariAwal)}%`, background: d.warna }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Pembungkus kartu grafik
   ------------------------------------------------------------------------- */

export function ChartCard({
  judul,
  keterangan,
  aksi,
  children,
}: {
  judul: string;
  keterangan?: string;
  aksi?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="card">
      <div className="card-head">
        <span className="titled">
          <span className="t-h3">{judul}</span>
          {keterangan && <span className="t-sm muted">{keterangan}</span>}
        </span>
        {aksi}
      </div>
      <div className="card-body">{children}</div>
    </section>
  );
}
