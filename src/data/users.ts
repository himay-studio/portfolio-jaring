/* ==========================================================================
   Tim sales demo. Nama dan peran dikunci di ART-DIRECTION.md bagian 6 supaya
   Stage 4 dan Stage 5 memakai orang yang sama.

   Avatar TIDAK memakai berkas foto. Dipakai inisial di atas blok warna,
   seperti Linear, Jira, dan Notion. Alasannya ada di MEDIA.md.
   ========================================================================== */

import type { ID, User } from './types';

export const USERS: User[] = [
  {
    id: 'usr-01',
    nama: 'Dimas Prakoso',
    inisial: 'DP',
    peran: 'manajer',
    jabatan: 'Sales Manager',
    email: 'dimas.prakoso@jaring.id',
    telepon: '0811 2233 4455',
    targetBulanan: 900_000_000,
    aktif: true,
  },
  {
    id: 'usr-02',
    nama: 'Rani Kusumawati',
    inisial: 'RK',
    peran: 'ae',
    jabatan: 'Account Executive',
    email: 'rani.kusumawati@jaring.id',
    telepon: '0812 3344 5566',
    targetBulanan: 250_000_000,
    aktif: true,
  },
  {
    id: 'usr-03',
    nama: 'Bagas Setiawan',
    inisial: 'BS',
    peran: 'ae',
    jabatan: 'Account Executive',
    email: 'bagas.setiawan@jaring.id',
    telepon: '0813 4455 6677',
    targetBulanan: 250_000_000,
    aktif: true,
  },
  {
    id: 'usr-04',
    nama: 'Ayu Lestari',
    inisial: 'AL',
    peran: 'ae',
    jabatan: 'Account Executive',
    email: 'ayu.lestari@jaring.id',
    telepon: '0857 5566 7788',
    targetBulanan: 200_000_000,
    aktif: true,
  },
  {
    id: 'usr-05',
    nama: 'Hendra Wijaya',
    inisial: 'HW',
    peran: 'sdr',
    jabatan: 'Sales Development',
    email: 'hendra.wijaya@jaring.id',
    telepon: '0821 6677 8899',
    targetBulanan: 0,
    aktif: true,
  },
  {
    id: 'usr-06',
    nama: 'Nadia Sihombing',
    inisial: 'NS',
    peran: 'sdr',
    jabatan: 'Sales Development',
    email: 'nadia.sihombing@jaring.id',
    telepon: '0838 7788 9900',
    targetBulanan: 0,
    aktif: true,
  },
];

/** Pengguna yang "masuk" di demo. Kredensialnya ditampilkan di layar login. */
export const DEMO_USER_ID: ID = 'usr-01';

export const DEMO_KREDENSIAL = {
  email: 'dimas.prakoso@jaring.id',
  sandi: 'demo1234',
};
