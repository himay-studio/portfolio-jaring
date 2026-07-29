'use client';

/* ==========================================================================
   Shell aplikasi: sidebar kiri persisten, topbar, dan kanvas isi.

   Keputusan yang mengikat seluruh area aplikasi:

   - Navigasi utama ada di SIDEBAR KIRI, bukan di topbar. Ini aplikasi, bukan
     halaman marketing, jadi R16 dan R32 soal mega menu navbar sengaja tidak
     berlaku di sini.
   - Sidebar bisa dilipat jadi rail 64px, dan status lipatnya diingat antar
     kunjungan. Supaya tidak ada kedipan lebar saat halaman dimuat, status itu
     dibaca oleh skrip pra hidrasi di layout root dan dipasang sebagai
     `data-sidebar` di elemen `<html>`, bukan lewat state React.
   - Di bawah 1025px sidebar keluar dari alur dan jadi laci geser yang
     DI-PORTAL ke `document.body` (R53). Header aplikasi memakai latar solid
     tanpa `backdrop-filter`, jadi jebakan containing block memang tidak pernah
     lahir di build ini.
   ========================================================================== */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@/components/Icon';
import { Logo, Mark } from '@/components/Logo';
import { Avatar } from '@/components/ui/Basic';
import { Drawer, Tooltip } from '@/components/ui/Overlay';
import { NAV, itemAktif } from '@/components/shell/nav';
import { DEMO_USER_ID } from '@/data/users';
import { getUser } from '@/data/relations';
import { useDisclosure, tulisSimpanan } from '@/lib/hooks';

const KUNCI_SIDEBAR = 'sidebar.rail';

/* -------------------------------------------------------------------------
   Daftar item navigasi, dipakai bersama sidebar desktop dan laci mobile
   ------------------------------------------------------------------------- */

function DaftarNav({
  pathname,
  rail,
  onNavigasi,
}: {
  pathname: string;
  rail: boolean;
  onNavigasi?: () => void;
}) {
  const aktif = itemAktif(pathname);

  return (
    <nav className="sidebar-nav" aria-label="Navigasi utama">
      {NAV.map((grup) => (
        <div className="nav-group" key={grup.label}>
          <div className="nav-group-label t-label" aria-hidden={rail ? 'true' : undefined}>
            {grup.label}
          </div>
          <ul>
            {grup.item.map((item) => {
              const ini = aktif?.href === item.href;
              const tautan = (
                <Link
                  href={item.href}
                  className="nav-item t-body"
                  /* Penanda aktif rangkap tiga: batang tepi kiri, latar
                     --ink-3, dan aria-current. Tidak mengandalkan warna saja. */
                  aria-current={ini ? 'page' : undefined}
                  onClick={onNavigasi}
                >
                  <Icon name={item.icon} size={20} className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                </Link>
              );
              return (
                <li key={item.href}>
                  {rail ? (
                    /* Di rail 64px label teks tidak muat, jadi ikon dapat
                       tooltip supaya tidak pernah berdiri sendiri tanpa
                       penjelas (ART-DIRECTION 3). */
                    <Tooltip teks={item.label}>{tautan}</Tooltip>
                  ) : (
                    tautan
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function KakiSidebar({ rail }: { rail: boolean }) {
  const pengguna = getUser(DEMO_USER_ID);
  return (
    <div className="sidebar-foot">
      <Link href="/app/pengaturan/" className="sidebar-user">
        <Avatar nama={pengguna?.nama ?? 'Pengguna'} kunci={DEMO_USER_ID} size="sm" />
        {!rail && (
          <span className="sidebar-user-meta titled grow">
            <span className="t-sm">{pengguna?.nama}</span>
            <span className="t-xs" style={{ color: 'var(--ink-text-muted)' }}>
              {pengguna?.jabatan}
            </span>
          </span>
        )}
      </Link>
      <Link href="/login/" className="sidebar-user">
        <Icon name="keluar" size={18} style={{ color: 'var(--ink-text-muted)' }} />
        {!rail && <span className="sidebar-user-meta t-sm">Keluar demo</span>}
      </Link>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Shell
   ------------------------------------------------------------------------- */

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const laci = useDisclosure(240);
  const [rail, setRail] = useState(false);

  /* Sinkronkan state React dengan atribut yang sudah dipasang skrip pra
     hidrasi, supaya label tombol dan tooltip cocok sejak render pertama. */
  useEffect(() => {
    setRail(document.documentElement.dataset.sidebar === 'rail');
  }, []);

  const alihRail = useCallback(() => {
    setRail((sebelum) => {
      const berikutnya = !sebelum;
      document.documentElement.dataset.sidebar = berikutnya ? 'rail' : 'penuh';
      tulisSimpanan(KUNCI_SIDEBAR, berikutnya ? '1' : '0');
      return berikutnya;
    });
  }, []);

  const aktif = itemAktif(pathname);

  /* Laci mobile ditutup setiap kali rute berganti, kalau tidak dia menutupi
     halaman baru yang barusan dibuka. */
  useEffect(() => {
    laci.tutup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div className="shell">
      <aside className="sidebar on-ink">
        <div className="sidebar-head">
          <Link href="/app/" aria-label="Jaring, ke Dashboard" style={{ display: 'flex' }}>
            {/* Varian knockout WAJIB di atas latar gelap --ink (R43).
                Varian terang tidak boleh dipakai di sini. */}
            {rail ? (
              <Mark varian="knockout" size={28} />
            ) : (
              <Logo varian="knockout" size={26} />
            )}
          </Link>
        </div>

        <DaftarNav pathname={pathname} rail={rail} />

        <KakiSidebar rail={rail} />

        <button
          type="button"
          className="collapse-btn"
          onClick={alihRail}
          aria-label={rail ? 'Lebarkan sidebar' : 'Lipat sidebar'}
        >
          <Icon name="panel-left" size={18} className="chev" />
          <span className="collapse-btn-label t-sm">Lipat sidebar</span>
        </button>
      </aside>

      <div className="main-col">
        <header className="topbar">
          <button
            type="button"
            className="icon-btn hamburger"
            aria-label="Buka menu navigasi"
            aria-expanded={laci.isOpen}
            onClick={laci.alih}
          >
            <Icon name="menu" size={22} />
          </button>

          <span className="topbar-title titled grow">
            <span className="t-body-strong truncate">{aktif?.label ?? 'Jaring'}</span>
            <span className="t-xs muted truncate">Demo CRM pipeline penjualan</span>
          </span>

          <Link href="/" className="btn btn-ghost btn-sm">
            Tentang demo
          </Link>
        </header>

        {/* Pembungkus animasi perpindahan halaman (R46). Di-key dengan
            pathname supaya animasinya jalan lagi tiap ganti rute. */}
        <main className="page page-enter" key={pathname} id="isi">
          {children}
        </main>
      </div>

      {/* Laci navigasi mobile. Dirender lewat <Drawer> yang di-portal ke
          document.body, bukan bersarang di dalam <header> (R53). */}
      <Drawer
        panel={laci}
        judul="Navigasi"
        /* R52: di mobile sidebar desktop disembunyikan, jadi logo hanya
           muncul di sini. Persis satu kali, tidak pernah dua. */
        judulNode={<Logo varian="knockout" size={24} />}
        sisi="left"
        className="navdrawer on-ink"
        labelTutup="Tutup menu navigasi"
      >
        <DaftarNav pathname={pathname} rail={false} onNavigasi={laci.tutup} />
        <KakiSidebar rail={false} />
      </Drawer>
    </div>
  );
}
