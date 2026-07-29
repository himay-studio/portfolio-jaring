'use client';

/* ==========================================================================
   Modal catat aktivitas, dipakai bersama oleh halaman Aktivitas, detail
   Deal, dan detail Lead. Relasinya (`relasiDasar`) ditentukan pemanggil,
   jadi mencatat telepon dari halaman deal otomatis menempel ke deal itu
   tanpa pengunjung harus memilihnya lagi.
   ========================================================================== */

import { useState } from 'react';
import { hari } from '@/data/clock';
import { USERS } from '@/data/relations';
import type { JenisAktivitas, RelasiAktivitas } from '@/data/types';
import type { InputAktivitasBaru } from '@/lib/activityStore';
import type { useDisclosure } from '@/lib/hooks';
import { DatePicker } from '@/components/ui/DatePicker';
import { Field, Input, Textarea } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Overlay';
import { Select } from '@/components/ui/Select';

const JAM_OPSI = Array.from({ length: 21 }, (_, i) => {
  const totalMenit = 8 * 60 + i * 30; // 08:00 sampai 18:00, tiap 30 menit
  const j = String(Math.floor(totalMenit / 60)).padStart(2, '0');
  const m = String(totalMenit % 60).padStart(2, '0');
  return `${j}:${m}`;
});

const JENIS_OPSI: { nilai: JenisAktivitas; label: string }[] = [
  { nilai: 'telepon', label: 'Telepon' },
  { nilai: 'meeting', label: 'Meeting' },
  { nilai: 'email', label: 'Email' },
  { nilai: 'tugas', label: 'Tugas' },
];

export function ActivityFormModal({
  panel,
  relasiDasar,
  ownerIdBawaan,
  onSimpan,
}: {
  panel: ReturnType<typeof useDisclosure>;
  relasiDasar: RelasiAktivitas;
  ownerIdBawaan?: string;
  onSimpan: (input: InputAktivitasBaru) => void;
}) {
  const [jenis, setJenis] = useState<JenisAktivitas>('telepon');
  const [judul, setJudul] = useState('');
  const [catatan, setCatatan] = useState('');
  const [tanggal, setTanggal] = useState(hari(0));
  const [jam, setJam] = useState('09:00');
  const [durasiMenit, setDurasiMenit] = useState('30');
  const [ownerId, setOwnerId] = useState(ownerIdBawaan ?? USERS[1]?.id ?? '');

  const sah = judul.trim().length > 0 && ownerId;

  function tutupDanReset() {
    panel.tutup();
    setJudul('');
    setCatatan('');
    setJenis('telepon');
  }

  return (
    <Modal
      panel={{ ...panel, tutup: tutupDanReset }}
      judul="Catat aktivitas"
      keterangan="Telepon, meeting, email, atau tugas. Langsung masuk daftar dan kalender."
      footer={
        <>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!sah}
            onClick={() => {
              onSimpan({
                jenis,
                judul: judul.trim(),
                catatan: catatan.trim(),
                mulai: `${tanggal}T${jam}`,
                durasiMenit: Number(durasiMenit) || 30,
                ownerId,
                relasi: relasiDasar,
              });
              tutupDanReset();
            }}
          >
            Simpan aktivitas
          </button>
          <button type="button" className="btn btn-secondary" onClick={tutupDanReset}>
            Batal
          </button>
        </>
      }
    >
      <div className="stack gap-16">
        <div className="grid grid-2">
          <Select
            label="Jenis aktivitas"
            tampilkanLabel
            nilai={jenis}
            onUbah={(v) => setJenis(v as JenisAktivitas)}
            lebar="100%"
            opsi={JENIS_OPSI.map((j) => ({ nilai: j.nilai, label: j.label }))}
          />
          <Select
            label="Penanggung jawab"
            tampilkanLabel
            nilai={ownerId}
            onUbah={setOwnerId}
            lebar="100%"
            opsi={USERS.map((u) => ({ nilai: u.id, label: u.nama, keterangan: u.jabatan }))}
          />
        </div>

        <Field label="Judul" htmlFor="akt-judul">
          <Input
            id="akt-judul"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            placeholder="Contoh: Telepon tindak lanjut penawaran"
          />
        </Field>

        <div className="grid grid-2">
          <DatePicker label="Tanggal" tampilkanLabel nilai={tanggal} onUbah={setTanggal} lebar="100%" />
          <Select
            label="Jam mulai"
            tampilkanLabel
            nilai={jam}
            onUbah={setJam}
            lebar="100%"
            opsi={JAM_OPSI.map((j) => ({ nilai: j, label: j }))}
          />
        </div>

        <Select
          label="Durasi"
          tampilkanLabel
          nilai={durasiMenit}
          onUbah={setDurasiMenit}
          lebar="100%"
          opsi={[
            { nilai: '15', label: '15 menit' },
            { nilai: '20', label: '20 menit' },
            { nilai: '30', label: '30 menit' },
            { nilai: '45', label: '45 menit' },
            { nilai: '60', label: '60 menit' },
          ]}
        />

        <Field label="Catatan" htmlFor="akt-catatan">
          <Textarea id="akt-catatan" value={catatan} onChange={(e) => setCatatan(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
