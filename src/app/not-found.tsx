import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function TidakDitemukan() {
  return (
    <div className="nf">
      <Logo varian="terang" size={30} />
      <div className="titled" style={{ alignItems: 'center', gap: 8 }}>
        <h1 className="t-h1">Halaman tidak ditemukan</h1>
        <p className="t-body muted">
          Alamat yang Anda buka tidak ada di demo ini. Kembali ke dashboard untuk melanjutkan.
        </p>
      </div>
      <div className="row gap-8 wrap" style={{ justifyContent: 'center' }}>
        <Link href="/app/" className="btn btn-primary">
          Ke dashboard
        </Link>
        <Link href="/" className="btn btn-secondary">
          Ke halaman produk
        </Link>
      </div>
    </div>
  );
}
