/* ==========================================================================
   Penawaran sederhana. Baris item, subtotal, diskon, pajak, total, dan
   status kirim atau terima.

   Setiap penawaran WAJIB menempel pada satu deal. Perusahaan dan kontaknya
   diturunkan dari deal itu, tidak diketik ulang, supaya tidak pernah ada
   penawaran yang menyebut perusahaan berbeda dari dealnya.
   ========================================================================== */

import { hari } from './clock';
import { PPN_PERSEN } from './settings';
import type { Quotation } from './types';

export const QUOTATIONS: Quotation[] = [
  {
    id: 'pnw-01',
    nomor: 'PNW-2026-001',
    dealId: 'dea-10',
    companyId: 'com-06',
    contactId: 'kon-08',
    ownerId: 'usr-02',
    tanggal: hari(-9),
    berlakuHingga: hari(21),
    status: 'terkirim',
    diskonPersen: 5,
    pajakPersen: PPN_PERSEN,
    catatan: 'Harga berlaku untuk kontrak 12 bulan, dibayar di muka per tahun.',
    items: [
      { deskripsi: 'Lisensi Jaring Pro, per pengguna per tahun', qty: 60, satuan: 'pengguna', hargaSatuan: 4_200_000 },
      { deskripsi: 'Migrasi data dari spreadsheet bersama', qty: 1, satuan: 'paket', hargaSatuan: 18_000_000 },
      { deskripsi: 'Pelatihan tim sales, sesi tatap muka', qty: 4, satuan: 'sesi', hargaSatuan: 3_500_000 },
    ],
  },
  {
    id: 'pnw-02',
    nomor: 'PNW-2026-002',
    dealId: 'dea-12',
    companyId: 'com-09',
    contactId: 'kon-12',
    ownerId: 'usr-03',
    tanggal: hari(-16),
    berlakuHingga: hari(14),
    status: 'terkirim',
    diskonPersen: 8,
    pajakPersen: PPN_PERSEN,
    catatan: 'Termasuk integrasi ke ERP yang sudah berjalan. Termin tiga tahap.',
    items: [
      { deskripsi: 'Lisensi Jaring Pro, per pengguna per tahun', qty: 45, satuan: 'pengguna', hargaSatuan: 4_200_000 },
      { deskripsi: 'Integrasi dua arah dengan ERP', qty: 1, satuan: 'paket', hargaSatuan: 145_000_000 },
      { deskripsi: 'Pendampingan pasca implementasi, 3 bulan', qty: 3, satuan: 'bulan', hargaSatuan: 9_000_000 },
    ],
  },
  {
    id: 'pnw-03',
    nomor: 'PNW-2026-003',
    dealId: 'dea-13',
    companyId: 'com-12',
    contactId: 'kon-16',
    ownerId: 'usr-03',
    tanggal: hari(-11),
    berlakuHingga: hari(19),
    status: 'terkirim',
    diskonPersen: 8,
    pajakPersen: PPN_PERSEN,
    catatan: 'Diskon volume 8 persen untuk 30 pengguna. Menunggu persetujuan.',
    items: [
      { deskripsi: 'Lisensi Jaring Pro, per pengguna per tahun', qty: 30, satuan: 'pengguna', hargaSatuan: 4_200_000 },
      { deskripsi: 'Penyiapan cabang dan hak akses', qty: 1, satuan: 'paket', hargaSatuan: 12_000_000 },
    ],
  },
  {
    id: 'pnw-04',
    nomor: 'PNW-2026-004',
    dealId: 'dea-09',
    companyId: 'com-11',
    contactId: 'kon-15',
    ownerId: 'usr-04',
    tanggal: hari(-12),
    berlakuHingga: hari(18),
    status: 'terkirim',
    diskonPersen: 0,
    pajakPersen: PPN_PERSEN,
    catatan: 'Termasuk penyesuaian formulir pesanan ekspor per kontainer.',
    items: [
      { deskripsi: 'Lisensi Jaring Bisnis, per pengguna per tahun', qty: 8, satuan: 'pengguna', hargaSatuan: 3_000_000 },
      { deskripsi: 'Penyesuaian formulir pesanan ekspor', qty: 1, satuan: 'paket', hargaSatuan: 16_500_000 },
      { deskripsi: 'Pelatihan daring', qty: 2, satuan: 'sesi', hargaSatuan: 2_000_000 },
    ],
  },
  {
    id: 'pnw-05',
    nomor: 'PNW-2026-005',
    dealId: 'dea-11',
    companyId: 'com-02',
    contactId: 'kon-03',
    ownerId: 'usr-03',
    tanggal: hari(-18),
    berlakuHingga: hari(12),
    status: 'terkirim',
    diskonPersen: 0,
    pajakPersen: PPN_PERSEN,
    catatan: 'Sudah dikirim lewat email, belum ada tanggapan. Coba lewat WhatsApp.',
    items: [
      { deskripsi: 'Lisensi Jaring Bisnis, per pengguna per tahun', qty: 12, satuan: 'pengguna', hargaSatuan: 3_000_000 },
      { deskripsi: 'Penyiapan awal dan impor data', qty: 1, satuan: 'paket', hargaSatuan: 4_800_000 },
    ],
  },
  {
    id: 'pnw-06',
    nomor: 'PNW-2026-006',
    dealId: 'dea-17',
    companyId: 'com-05',
    contactId: 'kon-07',
    ownerId: 'usr-04',
    tanggal: hari(-28),
    berlakuHingga: hari(-14),
    status: 'ditolak',
    diskonPersen: 0,
    pajakPersen: PPN_PERSEN,
    catatan: 'Ditolak karena selisih harga sekitar 30 persen dari anggaran klinik.',
    items: [
      { deskripsi: 'Lisensi Jaring Bisnis, per pengguna per tahun', qty: 6, satuan: 'pengguna', hargaSatuan: 3_000_000 },
      { deskripsi: 'Penyiapan 5 cabang', qty: 5, satuan: 'cabang', hargaSatuan: 2_200_000 },
    ],
  },
];
