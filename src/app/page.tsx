import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { Logo } from '@/components/Logo';
import { Badge } from '@/components/ui/Basic';
import { TAHAP } from '@/data/settings';
import { DEALS } from '@/data/deals';
import { rupiahSingkat } from '@/lib/format';
import { nilaiTotal, pipelineBerjalan } from '@/lib/metrics';

/* ==========================================================================
   Landing produk ringkas di "/".

   Satu layar, penjelasan singkat, tombol masuk ke demo. Ini BUKAN situs
   marketing: tidak ada hero video (R2, R15, R30, R44 memang tidak berlaku
   untuk app portfolio), tidak ada welcome modal (R13), tidak ada floating CTA
   (R37), dan tidak ada tombol WhatsApp (R14). Yang wajib ada cuma satu
   tautan halus "Dibuat oleh Himay Studio" yang dofollow, sesuai HIM-283.

   Tiga pilar di bawah disalin apa adanya dari BRAND.md bagian 4.
   ========================================================================== */

const PILAR = [
  {
    judul: 'Pipeline yang jujur',
    isi: 'Enam tahap, nilai deal, probabilitas, perkiraan tanggal tutup. Deal mandek kelihatan, bukan tersembunyi.',
    tone: undefined,
    icon: 'deals' as const,
  },
  {
    judul: 'Follow up yang menagih',
    isi: 'Setiap deal wajib punya aktivitas berikutnya. Yang jatuh tempo hari ini muncul paling atas.',
    tone: 'accent' as const,
    icon: 'aktivitas' as const,
  },
  {
    judul: 'Angka yang bisa dipercaya',
    isi: 'Konversi per tahap, waktu rata rata per tahap, performa per sales, sumber lead terbaik. Semua dari data yang sama.',
    tone: 'success' as const,
    icon: 'laporan' as const,
  },
];

export default function Beranda() {
  const berjalan = pipelineBerjalan();
  const tigaTahap = TAHAP.slice(1, 4);

  return (
    <div className="landing">
      <header className="landing-bar">
        <Logo varian="terang" size={26} />
        <div className="grow" />
        <Link href="/login/" className="btn btn-secondary btn-sm">
          Masuk demo
        </Link>
      </header>

      <main className="landing-main page-enter">
        <section className="landing-hero">
          <div className="landing-copy">
            <span className="landing-eyebrow t-label">CRM pipeline penjualan</span>
            {/* R50: setiap baris elemen blok terpisah, bukan teks inline yang
                menempel jadi satu kata. */}
            <h1 className="t-display">Tidak ada prospek yang lolos.</h1>
            <p className="landing-lede">
              CRM pipeline untuk tim sales Indonesia. Semua lead punya penanggung jawab, semua deal
              punya langkah berikutnya.
            </p>

            <div className="landing-cta">
              <Link href="/app/" className="btn btn-primary">
                Buka demo aplikasi
                <Icon name="arrow-right" size={16} />
              </Link>
              <Link href="/login/" className="btn btn-secondary">
                Lihat layar login
              </Link>
            </div>

            <p className="t-sm muted" style={{ marginTop: 4 }}>
              Demo berisi {DEALS.length} deal contoh dengan nilai pipeline berjalan{' '}
              {rupiahSingkat(nilaiTotal(berjalan))}. Tanpa pendaftaran, tanpa data asli.
            </p>
          </div>

          {/* Papan pipeline sebagai pahlawan visual, bukan mockup laptop
              melayang di atas gradien (BRAND.md 6). Digambar dari data
              yang sama dengan aplikasinya, bukan gambar hasil generate. */}
          <div className="landing-preview" aria-hidden="true">
            <div className="row gap-8">
              <span className="t-label muted">Papan pipeline</span>
              <div className="grow" />
              <Badge tone="brand">{berjalan.length} deal berjalan</Badge>
            </div>
            <div className="landing-preview-board">
              {tigaTahap.map((tahap) => {
                const isi = DEALS.filter((d) => d.tahap === tahap.id).slice(0, 2);
                const warna =
                  tahap.tone === 'brand'
                    ? 'var(--brand)'
                    : tahap.tone === 'accent'
                      ? 'var(--accent)'
                      : 'var(--warning)';
                return (
                  <div className="lp-col" key={tahap.id}>
                    <span className="t-label muted">{tahap.nama}</span>
                    {isi.map((d) => (
                      <div className="lp-card" key={d.id} style={{ borderLeftColor: warna }}>
                        <span className="t-xs truncate">{d.nama}</span>
                        <span className="t-xs muted num">{rupiahSingkat(d.nilai)}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="landing-pillars" aria-label="Yang dikerjakan Jaring">
          {PILAR.map((p) => (
            <article className="pillar" key={p.judul} data-tone={p.tone}>
              <Icon name={p.icon} size={20} style={{ color: 'var(--text-muted)' }} />
              <div className="titled">
                <h2 className="t-h3">{p.judul}</h2>
                <p className="t-sm muted">{p.isi}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="card">
          <div className="card-head">
            <span className="titled">
              <span className="t-h3">Yang bisa dicoba di demo</span>
              <span className="t-sm muted">
                Semua data di dalamnya contoh, disimpan di browser Anda sendiri.
              </span>
            </span>
          </div>
          <div className="card-body">
            <ul className="stack gap-12">
              {[
                'Geser deal antar tahap di papan kanban. Menggeser ke tahap Kalah akan meminta alasan kalah.',
                'Buka detail deal untuk melihat kontak, perusahaan, penawaran, dan lead asalnya dalam satu layar.',
                'Lihat aktivitas dalam tampilan kalender atau daftar, lengkap dengan yang terlambat.',
                'Baca laporan konversi per tahap, performa per sales, dan sumber lead terbaik.',
              ].map((t) => (
                <li key={t} className="row gap-8" style={{ alignItems: 'flex-start' }}>
                  <Icon name="check" size={16} style={{ color: 'var(--success)', marginTop: 3 }} />
                  <span className="t-body">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="landing-foot">
        <div className="landing-foot-inner t-sm">
          <span>Jaring adalah merek fiktif untuk keperluan demo portfolio.</span>
          {/* Tautan balik dofollow. TIDAK boleh nofollow, sponsored, atau ugc. */}
          <a href="https://himaystudio.com" target="_blank" rel="noopener">
            Dibuat oleh Himay Studio
          </a>
        </div>
      </footer>
    </div>
  );
}
