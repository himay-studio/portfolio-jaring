/* ==========================================================================
   Model data Jaring.

   Ini keputusan arsitektur, bukan detail visual. Bentuk relasi ditetapkan di
   sini supaya Stage 5 tidak perlu membongkar layar detail satu per satu.

   Aturan relasi inti CRM, dan ini yang paling gampang salah:

     Lead ----(konversi)----> Contact + Company + Deal
      ^                          |          |        |
      |                          |          |        |
      +---- asalLeadId ----------+----------+--------+

   Konversi ditulis DUA arah dengan sengaja. `Lead.konversi` menunjuk maju ke
   record hasil konversi, dan `Contact.asalLeadId` serta `Deal.asalLeadId`
   menunjuk balik ke lead asalnya. Jadi asal usul sebuah deal bisa ditelusuri
   dari layar mana pun, bukan cuma dari layar Leads.

   Semangat R42: warna, ukuran, tahap, dan status adalah ATRIBUT, bukan
   entitas terpisah. Deal di tahap Menang tetap satu record Deal yang sama
   dengan `tahap: 'menang'`, bukan record baru di tabel lain.
   ========================================================================== */

export type ID = string;

/* -------------------------------------------------------------------------
   Warna arti. Dipetakan ke pasangan soft dan ink di DESIGN.md 3.3.
   ------------------------------------------------------------------------- */
export type Tone = 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/* -------------------------------------------------------------------------
   Tahap pipeline. Urut dan terkunci di BRAND.md bagian 5.
   ------------------------------------------------------------------------- */
export type TahapId =
  | 'prospek'
  | 'kualifikasi'
  | 'penawaran'
  | 'negosiasi'
  | 'menang'
  | 'kalah';

export interface Tahap {
  id: TahapId;
  nama: string;
  urutan: number;
  tone: Tone;
  /** Probabilitas bawaan saat deal masuk tahap ini, dalam persen. */
  probabilitasBawaan: number;
  /** Tahap akhir. `null` berarti deal masih berjalan. */
  terminal: 'menang' | 'kalah' | null;
  keterangan: string;
}

/* -------------------------------------------------------------------------
   Sumber lead, BRAND.md bagian 8.
   ------------------------------------------------------------------------- */
export type SumberLeadId =
  | 'website'
  | 'instagram-ads'
  | 'whatsapp'
  | 'referensi'
  | 'pameran'
  | 'cold-call'
  | 'marketplace'
  | 'google-ads';

export interface SumberLead {
  id: SumberLeadId;
  nama: string;
  aktif: boolean;
}

/* -------------------------------------------------------------------------
   Alasan kalah, BRAND.md bagian 8. Wajib dipilih saat deal digeser ke tahap
   Kalah, jadi perpindahan itu memicu dialog dan bukan sekadar geser.
   ------------------------------------------------------------------------- */
export type AlasanKalahId =
  | 'harga-tinggi'
  | 'pilih-kompetitor'
  | 'anggaran-ditunda'
  | 'tidak-ada-respons'
  | 'bukan-target'
  | 'timing-belum-pas';

export interface AlasanKalah {
  id: AlasanKalahId;
  nama: string;
  aktif: boolean;
}

/* -------------------------------------------------------------------------
   Pengguna dan peran.
   ------------------------------------------------------------------------- */
export type PeranId = 'manajer' | 'ae' | 'sdr' | 'admin';

export interface Peran {
  id: PeranId;
  nama: string;
  keterangan: string;
  /** Hak akses ringkas, dipakai layar Pengaturan dan penyaring milik saya. */
  hak: string[];
}

export interface User {
  id: ID;
  nama: string;
  inisial: string;
  peran: PeranId;
  jabatan: string;
  email: string;
  telepon: string;
  /** Target penjualan per bulan dalam Rupiah. 0 untuk peran non penjualan. */
  targetBulanan: number;
  aktif: boolean;
}

/* -------------------------------------------------------------------------
   Perusahaan.
   ------------------------------------------------------------------------- */
export type UkuranPerusahaan = 'kecil' | 'menengah' | 'besar';

export interface Company {
  id: ID;
  nama: string;
  industri: string;
  kota: string;
  provinsi: string;
  ukuran: UkuranPerusahaan;
  jumlahKaryawan: number;
  situs: string;
  telepon: string;
  alamat: string;
  /** Penanggung jawab akun. */
  ownerId: ID;
  dibuatPada: string;
  catatan: string;
}

/* -------------------------------------------------------------------------
   Kontak. Selalu menempel pada satu perusahaan.
   ------------------------------------------------------------------------- */
export interface Contact {
  id: ID;
  nama: string;
  inisial: string;
  jabatan: string;
  email: string;
  telepon: string;
  whatsapp: string;
  companyId: ID;
  ownerId: ID;
  sumber: SumberLeadId;
  dibuatPada: string;
  catatan: string;
  /** Terisi kalau kontak ini lahir dari konversi sebuah lead. */
  asalLeadId?: ID;
}

/* -------------------------------------------------------------------------
   Lead. Sebelum dikonversi, nama perusahaan masih teks bebas karena record
   Company-nya memang belum ada. Setelah dikonversi, jejaknya pindah ke
   `konversi` dan status jadi `dikonversi`.
   ------------------------------------------------------------------------- */
export type LeadStatus =
  | 'baru'
  | 'dihubungi'
  | 'kualifikasi'
  | 'terkualifikasi'
  | 'tidak-layak'
  | 'dikonversi';

export interface KonversiLead {
  tanggal: string;
  contactId: ID;
  companyId: ID;
  dealId: ID;
}

export interface Lead {
  id: ID;
  nama: string;
  inisial: string;
  jabatan: string;
  /** Teks bebas. Jadi record Company hanya setelah lead dikonversi. */
  perusahaanNama: string;
  email: string;
  telepon: string;
  sumber: SumberLeadId;
  status: LeadStatus;
  /** Skor kualifikasi 0 sampai 100. */
  skor: number;
  ownerId: ID;
  dibuatPada: string;
  kontakTerakhir: string | null;
  catatan: string;
  /** Hanya terisi kalau status `dikonversi`. Menunjuk MAJU ke hasil konversi. */
  konversi?: KonversiLead;
}

/* -------------------------------------------------------------------------
   Deal. Pusat gravitasi aplikasi ini.
   ------------------------------------------------------------------------- */
export interface Deal {
  id: ID;
  nama: string;
  companyId: ID;
  /** Kontak utama pada deal ini. */
  contactId: ID;
  ownerId: ID;
  /** Nilai deal dalam Rupiah. */
  nilai: number;
  /** Probabilitas menang dalam persen. */
  probabilitas: number;
  tahap: TahapId;
  perkiraanTutup: string;
  dibuatPada: string;
  /** Kapan deal masuk tahap saat ini. Dipakai menghitung deal mandek. */
  tahapSejak: string;
  /** Kapan terakhir kali ada aktivitas atau perubahan. Dipakai menghitung mandek. */
  disentuhPada: string;
  sumber: SumberLeadId;
  /** Menunjuk BALIK ke lead asal, kalau deal ini lahir dari konversi lead. */
  asalLeadId?: ID;
  /** Wajib terisi kalau tahap `kalah`. */
  alasanKalahId?: AlasanKalahId;
  catatanKalah?: string;
  ditutupPada?: string;
  catatan: string;
}

/* -------------------------------------------------------------------------
   Aktivitas. Satu aktivitas boleh menempel ke beberapa entitas sekaligus,
   misalnya telepon ke seorang kontak MENGENAI sebuah deal. Relasinya
   sengaja dikumpulkan dalam satu objek supaya penyaring "aktivitas milik
   entitas X" cukup satu fungsi, bukan enam cabang if.
   ------------------------------------------------------------------------- */
export type JenisAktivitas = 'telepon' | 'meeting' | 'email' | 'tugas';

export interface RelasiAktivitas {
  dealId?: ID;
  contactId?: ID;
  companyId?: ID;
  leadId?: ID;
}

export interface Activity {
  id: ID;
  jenis: JenisAktivitas;
  judul: string;
  catatan: string;
  /** ISO datetime lokal, contoh 2026-07-29T09:30. */
  mulai: string;
  durasiMenit: number;
  selesai: boolean;
  ownerId: ID;
  relasi: RelasiAktivitas;
}

/* -------------------------------------------------------------------------
   Penawaran. Baris item, subtotal, pajak, total, status kirim dan terima.
   ------------------------------------------------------------------------- */
export type StatusPenawaran = 'draft' | 'terkirim' | 'diterima' | 'ditolak' | 'kedaluwarsa';

export interface ItemPenawaran {
  deskripsi: string;
  qty: number;
  satuan: string;
  hargaSatuan: number;
}

export interface Quotation {
  id: ID;
  nomor: string;
  dealId: ID;
  companyId: ID;
  contactId: ID;
  ownerId: ID;
  tanggal: string;
  berlakuHingga: string;
  status: StatusPenawaran;
  items: ItemPenawaran[];
  diskonPersen: number;
  pajakPersen: number;
  catatan: string;
}

/* -------------------------------------------------------------------------
   Mode tampilan. Dipakai bersama semua modul lewat useViewMode.
   ------------------------------------------------------------------------- */
export type ViewMode = 'table' | 'kanban' | 'calendar' | 'card' | 'list';
