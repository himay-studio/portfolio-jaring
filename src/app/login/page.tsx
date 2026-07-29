'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { Logo } from '@/components/Logo';
import { Field, Input } from '@/components/ui/Form';
import { DEMO_KREDENSIAL } from '@/data/users';

/* ==========================================================================
   Layar login demo.

   Tanpa auth nyata. Kredensialnya ditampilkan terang terangan di layar dan
   satu klik langsung masuk, sesuai HIM-283. Formulirnya tetap dibuat benar
   (label, tipe field, tombol submit) supaya layar ini jujur menggambarkan
   layar login sungguhan, bukan tombol yang dikasih kostum.

   Tata letak dari ART-DIRECTION.md bagian 7: dua kolom di desktop, panel
   gelap di kiri berisi logo varian knockout dan motif kisi tipis, kanan
   berisi form. Di bawah 768px jadi satu kolom.
   ========================================================================== */

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState(DEMO_KREDENSIAL.email);
  const [sandi, setSandi] = useState(DEMO_KREDENSIAL.sandi);
  const [galat, setGalat] = useState<string | null>(null);

  function masuk(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setGalat('Isi email dulu, atau pakai tombol masuk demo di bawah.');
      return;
    }
    router.push('/app/');
  }

  return (
    <div className="login">
      {/* Motif kisi dari logo, muncul SEKALI saja di aplikasi ini, dan tidak
          pernah di belakang teks yang harus terbaca (ART-DIRECTION 7). */}
      <aside className="login-aside grid-motif on-ink">
        <Logo varian="knockout" size={30} />

        <div className="login-aside-copy">
          <h1 className="t-h1" style={{ color: '#FFFFFF' }}>
            Tidak ada prospek yang lolos.
          </h1>
          <p className="login-aside-lede t-body">
            Jaring itu CRM pipeline, bukan aplikasi chat. Kami tidak mengejar semua percakapan
            pelanggan. Kami memastikan tidak ada satu pun prospek yang lewat tanpa langkah
            berikutnya.
          </p>
        </div>

        <p className="t-xs" style={{ color: 'var(--ink-text-muted)' }}>
          Jaring adalah merek fiktif untuk keperluan demo portfolio.
        </p>
      </aside>

      <main className="login-panel page-enter">
        <form className="login-form" onSubmit={masuk}>
          <div className="titled" style={{ marginBottom: 4 }}>
            <h2 className="t-h2">Masuk ke Jaring</h2>
            <p className="t-sm muted">Ini demo. Klik masuk, datanya sudah disiapkan.</p>
          </div>

          <div className="login-creds">
            <span className="t-label">Kredensial demo</span>
            <div className="login-cred-row t-sm">
              <span>Email</span>
              <span className="mono">{DEMO_KREDENSIAL.email}</span>
            </div>
            <div className="login-cred-row t-sm">
              <span>Kata sandi</span>
              <span className="mono">{DEMO_KREDENSIAL.sandi}</span>
            </div>
          </div>

          <Field label="Email" htmlFor="email" galat={galat ?? undefined}>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              aria-invalid={galat ? true : undefined}
              onChange={(e) => {
                setEmail(e.target.value);
                setGalat(null);
              }}
            />
          </Field>

          <Field label="Kata sandi" htmlFor="sandi">
            <Input
              id="sandi"
              type="password"
              autoComplete="current-password"
              value={sandi}
              onChange={(e) => setSandi(e.target.value)}
            />
          </Field>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Masuk
            <Icon name="arrow-right" size={16} />
          </button>

          <Link href="/app/" className="btn btn-ghost" style={{ width: '100%' }}>
            Masuk demo satu klik
          </Link>

          <p className="login-foot t-xs">
            <Link href="/">Kembali ke penjelasan produk</Link>
            <span aria-hidden="true"> . </span>
            {/* Tautan balik dofollow, dipasang juga di footer login (BRAND.md 9) */}
            <a href="https://himaystudio.com" target="_blank" rel="noopener">
              Dibuat oleh Himay Studio
            </a>
          </p>
        </form>
      </main>
    </div>
  );
}
