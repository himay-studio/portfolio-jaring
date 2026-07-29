/* ==========================================================================
   Pengaturan pipeline: tahap, sumber lead, alasan kalah, jenis aktivitas,
   status penawaran, dan peran pengguna.

   Semua daftar ini dikunci di BRAND.md bagian 5 dan 8. Peta warnanya dikunci
   di DESIGN.md bagian 2. Jangan menambah tahap atau warna baru di Stage 5
   tanpa memperbarui kedua dokumen itu lebih dulu.
   ========================================================================== */

import type {
  AlasanKalah,
  JenisAktivitas,
  LeadStatus,
  Peran,
  StatusPenawaran,
  SumberLead,
  Tahap,
  Tone,
} from './types';

/* Tahap pipeline, urut dan terkunci. Peta warna dari DESIGN.md bagian 2. */
export const TAHAP: Tahap[] = [
  {
    id: 'prospek',
    nama: 'Prospek',
    urutan: 1,
    tone: 'info',
    probabilitasBawaan: 10,
    terminal: null,
    keterangan: 'Sudah masuk pipeline, belum dipastikan cocok.',
  },
  {
    id: 'kualifikasi',
    nama: 'Kualifikasi',
    urutan: 2,
    tone: 'brand',
    probabilitasBawaan: 25,
    terminal: null,
    keterangan: 'Kebutuhan, anggaran, dan pengambil keputusan sedang dicek.',
  },
  {
    id: 'penawaran',
    nama: 'Penawaran',
    urutan: 3,
    tone: 'accent',
    probabilitasBawaan: 45,
    terminal: null,
    keterangan: 'Penawaran sudah dikirim, menunggu tanggapan.',
  },
  {
    id: 'negosiasi',
    nama: 'Negosiasi',
    urutan: 4,
    tone: 'warning',
    probabilitasBawaan: 70,
    terminal: null,
    keterangan: 'Harga, lingkup, atau termin sedang dibahas.',
  },
  {
    id: 'menang',
    nama: 'Menang',
    urutan: 5,
    tone: 'success',
    probabilitasBawaan: 100,
    terminal: 'menang',
    keterangan: 'Deal ditutup menang.',
  },
  {
    id: 'kalah',
    nama: 'Kalah',
    urutan: 6,
    tone: 'danger',
    probabilitasBawaan: 0,
    terminal: 'kalah',
    keterangan: 'Deal ditutup kalah. Alasan kalah wajib diisi.',
  },
];

export const TAHAP_AKTIF = TAHAP.filter((t) => t.terminal === null);

export const SUMBER_LEAD: SumberLead[] = [
  { id: 'website', nama: 'Website', aktif: true },
  { id: 'instagram-ads', nama: 'Instagram Ads', aktif: true },
  { id: 'whatsapp', nama: 'WhatsApp', aktif: true },
  { id: 'referensi', nama: 'Referensi', aktif: true },
  { id: 'pameran', nama: 'Pameran', aktif: true },
  { id: 'cold-call', nama: 'Cold call', aktif: true },
  { id: 'marketplace', nama: 'Marketplace', aktif: true },
  { id: 'google-ads', nama: 'Google Ads', aktif: true },
];

export const ALASAN_KALAH: AlasanKalah[] = [
  { id: 'harga-tinggi', nama: 'Harga terlalu tinggi', aktif: true },
  { id: 'pilih-kompetitor', nama: 'Pilih kompetitor', aktif: true },
  { id: 'anggaran-ditunda', nama: 'Anggaran ditunda', aktif: true },
  { id: 'tidak-ada-respons', nama: 'Tidak ada respons', aktif: true },
  { id: 'bukan-target', nama: 'Bukan target pasar', aktif: true },
  { id: 'timing-belum-pas', nama: 'Timing belum pas', aktif: true },
];

export const PERAN: Peran[] = [
  {
    id: 'manajer',
    nama: 'Sales Manager',
    keterangan: 'Melihat seluruh pipeline tim, mengatur target, dan menutup deal.',
    hak: ['Lihat semua data', 'Atur target', 'Kelola pengguna', 'Ubah tahap pipeline'],
  },
  {
    id: 'ae',
    nama: 'Account Executive',
    keterangan: 'Memegang deal sampai closing, membuat penawaran.',
    hak: ['Lihat data sendiri', 'Kelola deal', 'Buat penawaran'],
  },
  {
    id: 'sdr',
    nama: 'Sales Development',
    keterangan: 'Menjaring dan mengkualifikasi lead sebelum diserahkan ke AE.',
    hak: ['Lihat data sendiri', 'Kelola lead', 'Konversi lead'],
  },
  {
    id: 'admin',
    nama: 'Admin',
    keterangan: 'Mengurus data induk dan pengaturan sistem.',
    hak: ['Lihat semua data', 'Kelola pengguna', 'Kelola data induk'],
  },
];

/* -------------------------------------------------------------------------
   Label dan warna untuk nilai enum. Dikumpulkan di satu tempat supaya badge
   di modul mana pun memakai kata dan warna yang sama persis.
   ------------------------------------------------------------------------- */

export const LABEL_STATUS_LEAD: Record<LeadStatus, string> = {
  baru: 'Baru',
  dihubungi: 'Dihubungi',
  kualifikasi: 'Kualifikasi',
  terkualifikasi: 'Terkualifikasi',
  'tidak-layak': 'Tidak layak',
  dikonversi: 'Dikonversi',
};

export const TONE_STATUS_LEAD: Record<LeadStatus, Tone> = {
  baru: 'info',
  dihubungi: 'brand',
  kualifikasi: 'brand',
  terkualifikasi: 'accent',
  'tidak-layak': 'neutral',
  dikonversi: 'success',
};

export const LABEL_JENIS_AKTIVITAS: Record<JenisAktivitas, string> = {
  telepon: 'Telepon',
  meeting: 'Meeting',
  email: 'Email',
  tugas: 'Tugas',
};

export const TONE_JENIS_AKTIVITAS: Record<JenisAktivitas, Tone> = {
  telepon: 'brand',
  meeting: 'accent',
  email: 'info',
  tugas: 'warning',
};

export const LABEL_STATUS_PENAWARAN: Record<StatusPenawaran, string> = {
  draft: 'Draft',
  terkirim: 'Terkirim',
  diterima: 'Diterima',
  ditolak: 'Ditolak',
  kedaluwarsa: 'Kedaluwarsa',
};

export const TONE_STATUS_PENAWARAN: Record<StatusPenawaran, Tone> = {
  draft: 'neutral',
  terkirim: 'info',
  diterima: 'success',
  ditolak: 'danger',
  kedaluwarsa: 'warning',
};

/** Deal yang tidak tersentuh lebih lama dari ini dianggap mandek. */
export const AMBANG_MANDEK_HARI = 14;

/** Pajak bawaan penawaran, dalam persen. */
export const PPN_PERSEN = 11;
