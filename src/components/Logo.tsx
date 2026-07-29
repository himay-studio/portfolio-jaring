/* ==========================================================================
   Logo Jaring.

   Geometri kisinya disalin PERSIS dari berkas Stage 2 di `public/`
   (`logo-jaring.svg` dan `mark-jaring.svg`): kisi 4x4 pada viewBox 200x200,
   garis di 40/80/120/160, simpul 20x20 di kolom kanan membentuk turunan
   huruf J, plus satu simpul sorot di ujung kail pada x=110, y=150.

   Kenapa di-inline dan bukan `<img src="/logo-jaring.svg">`:
   berkas Stage 2 menulis wordmark sebagai elemen `<text>` dengan
   `font-family: Plus Jakarta Sans`. SVG yang dimuat lewat `<img>` terisolasi
   dan tidak bisa mengambil webfont dari halaman, jadi wordmark-nya akan jatuh
   ke sans bawaan sistem dan terlihat beda dari tipografi aplikasi. Dengan
   di-inline, mark tetap vektor Stage 2 apa adanya dan wordmark memakai font
   Plus Jakarta Sans yang sudah dimuat halaman.

   Dua varian WAJIB (R43). `terang` untuk latar putih dan `--bg`, `knockout`
   untuk latar gelap `--ink` di sidebar dan panel login. Latar SELALU
   transparan, logo tidak pernah jadi blok warna sendiri, karena blok itulah
   yang membuat logo Legatara terbaca sebagai kotak kosong di footer.
   ========================================================================== */

export type VarianLogo = 'terang' | 'knockout';

const WARNA: Record<VarianLogo, { kisi: string; simpul: string; sorot: string; teks: string }> = {
  /* ART-DIRECTION.md 2.2, varian A */
  terang: {
    kisi: '#084B57', // --brand-deep
    simpul: '#0C6B7A', // --brand
    sorot: '#5B3FBF', // --accent, 7.22:1 di atas putih
    teks: '#0E1F24', // --text
  },
  /* ART-DIRECTION.md 2.2, varian B. Kisi sengaja lebih redup daripada simpul
     supaya huruf J tetap yang pertama terbaca. Sorot pindah dari violet ke
     teal terang karena violet cuma sekitar 2.3:1 di atas --ink. */
  knockout: {
    kisi: '#9FB6BE', // --ink-text-muted, 7.75:1 di atas --ink
    simpul: '#E8F0F2', // --ink-text, 14.22:1
    sorot: '#35B3C4', // --brand-bright, 6.57:1
    teks: '#FFFFFF', // 16.43:1
  },
};

function Kisi({ varian }: { varian: VarianLogo }) {
  const w = WARNA[varian];
  const kolom = [40, 80, 120, 160];
  return (
    <g>
      {kolom.map((x) => (
        <line key={`v${x}`} x1={x} y1={40} x2={x} y2={160} stroke={w.kisi} strokeWidth={3} strokeLinecap="butt" />
      ))}
      {kolom.map((y) => (
        <line key={`h${y}`} x1={40} y1={y} x2={160} y2={y} stroke={w.kisi} strokeWidth={3} strokeLinecap="butt" />
      ))}
      {/* Simpul pejal yang membentuk jalur huruf J: turun di kolom kanan */}
      <rect x={150} y={30} width={20} height={20} fill={w.simpul} />
      <rect x={150} y={70} width={20} height={20} fill={w.simpul} />
      <rect x={150} y={110} width={20} height={20} fill={w.simpul} />
      <rect x={150} y={150} width={20} height={20} fill={w.simpul} />
      {/* Simpul sorot di ujung kail J, prospek yang tertangkap */}
      <rect x={110} y={150} width={20} height={20} fill={w.sorot} />
    </g>
  );
}

export interface MarkProps {
  varian?: VarianLogo;
  /** Tinggi mark dalam piksel. Minimum yang dibolehkan 20px (ART-DIRECTION 2.3). */
  size?: number;
  className?: string;
}

/** Mark saja. Dipakai saat sidebar tertutup jadi rail 64px. */
export function Mark({ varian = 'terang', size = 24, className }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <Kisi varian={varian} />
    </svg>
  );
}

export interface LogoProps extends MarkProps {
  /** Teks alternatif. Dipakai saat logo jadi tautan ke beranda. */
  judul?: string;
}

/**
 * Lockup mendatar: mark di kiri, wordmark di kanan. Wordmark memakai Plus
 * Jakarta Sans Bold dengan jarak huruf sedikit dirapatkan, dan selalu ditulis
 * "Jaring", tidak pernah JARING dan tidak pernah jaring (ART-DIRECTION 2.3).
 */
export function Logo({ varian = 'terang', size = 28, className, judul = 'Jaring' }: LogoProps) {
  const w = WARNA[varian];
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.5, minWidth: 0 }}
    >
      <Mark varian={varian} size={size} />
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: size * 0.62,
          letterSpacing: '-0.01em',
          lineHeight: 1,
          color: w.teks,
          whiteSpace: 'nowrap',
        }}
      >
        {judul}
      </span>
    </span>
  );
}
