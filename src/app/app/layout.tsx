import { AppShell } from '@/components/shell/AppShell';

/* ==========================================================================
   Layout area aplikasi.

   Semua rute di bawah "/app" memakai shell yang sama: sidebar kiri persisten,
   topbar 56px, dan kanvas isi yang beranimasi tiap perpindahan halaman (R46).

   Halaman "/" dan "/login" sengaja DI LUAR layout ini karena keduanya bukan
   bagian dari aplikasi kerja.
   ========================================================================== */

export default function LayoutAplikasi({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
