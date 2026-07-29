'use client';

/* ==========================================================================
   Papan kanban Deals.

   Ini pusat gravitasi aplikasi, jadi ditulis lengkap di Stage 3 dan bukan
   ditunda sebagai detail visual.

   Tiga hal yang membedakannya dari papan kanban biasa:

   1. Tahap Kalah MENUNTUT alasan. Menggeser kartu ke sana tidak langsung
      memindahkan deal, tapi membuka dialog. Kalau dialog dibatalkan, deal
      tetap di tahap asalnya. Aturannya sendiri ditegakkan di `useDealStore`,
      jadi jalur keyboard pun tidak bisa melewatinya.

   2. Ada jalur KEYBOARD yang setara dengan seret dan lepas (DESIGN.md 6.7):
      fokus ke kartu, Space mengangkat, ArrowLeft dan ArrowRight memindah
      antar tahap, Space menjatuhkan, Escape membatalkan. Setiap langkah
      diumumkan lewat `aria-live`, karena seret dan lepas yang hanya bisa
      dipakai dengan tetikus itu fitur yang setengah jadi.

   3. Di mobile papan jadi carousel snap mendatar, satu kolom 85vw
      (DESIGN.md 5.4, R48), bukan tumpukan vertikal enam kolom.
   ========================================================================== */

import Link from 'next/link';
import { useRef, useState } from 'react';
import { Icon } from '@/components/Icon';
import { Avatar, Badge } from '@/components/ui/Basic';
import { Field, Textarea } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Overlay';
import { Select } from '@/components/ui/Select';
import { ALASAN_KALAH, TAHAP } from '@/data/settings';
import type { AlasanKalahId, Deal, TahapId, Tone } from '@/data/types';
import { getContact, namaCompany, namaUser } from '@/data/relations';
import { rupiahSingkat, tanggalRingkas } from '@/lib/format';
import { useDisclosure } from '@/lib/hooks';
import { hariMandek, isMandek } from '@/lib/metrics';

const WARNA_TAHAP: Record<TahapId, string> = {
  prospek: 'var(--info)',
  kualifikasi: 'var(--brand)',
  penawaran: 'var(--accent)',
  negosiasi: 'var(--warning)',
  menang: 'var(--success)',
  kalah: 'var(--danger)',
};

const TONE_TAHAP: Record<TahapId, Tone> = {
  prospek: 'info',
  kualifikasi: 'brand',
  penawaran: 'accent',
  negosiasi: 'warning',
  menang: 'success',
  kalah: 'danger',
};

export interface KanbanBoardProps {
  deals: Deal[];
  onPindah: (
    dealId: string,
    tahap: TahapId,
    alasan?: { alasanKalahId: AlasanKalahId; catatan: string },
  ) => { ok: boolean; alasanTolak?: string };
}

export function KanbanBoard({ deals, onPindah }: KanbanBoardProps) {
  /* Kartu yang sedang diangkat lewat keyboard. Berbeda dari drag tetikus. */
  const [diangkat, setDiangkat] = useState<{ dealId: string; tahap: TahapId } | null>(null);
  const [sedangDiseret, setSedangDiseret] = useState<string | null>(null);
  const [kolomTujuan, setKolomTujuan] = useState<TahapId | null>(null);
  const [pengumuman, setPengumuman] = useState('');

  /* Deal yang menunggu alasan kalah sebelum benar benar dipindahkan. */
  const [menungguAlasan, setMenungguAlasan] = useState<Deal | null>(null);
  const dialogKalah = useDisclosure(200);
  const refPapan = useRef<HTMLDivElement>(null);

  function umumkan(teks: string) {
    setPengumuman(teks);
  }

  function mintaPindah(deal: Deal, tujuan: TahapId) {
    if (deal.tahap === tujuan) return;

    if (tujuan === 'kalah') {
      /* Bukan sekadar geser. Tahap Kalah memicu dialog. */
      setMenungguAlasan(deal);
      dialogKalah.buka();
      return;
    }

    const hasil = onPindah(deal.id, tujuan);
    umumkan(
      hasil.ok
        ? `${deal.nama} dipindahkan ke tahap ${namaTahapDari(tujuan)}.`
        : (hasil.alasanTolak ?? 'Perpindahan ditolak.'),
    );
  }

  function selesaikanKalah(alasanKalahId: AlasanKalahId, catatan: string) {
    if (!menungguAlasan) return;
    const hasil = onPindah(menungguAlasan.id, 'kalah', { alasanKalahId, catatan });
    umumkan(
      hasil.ok
        ? `${menungguAlasan.nama} ditandai kalah.`
        : (hasil.alasanTolak ?? 'Perpindahan ditolak.'),
    );
    dialogKalah.tutup();
    setMenungguAlasan(null);
    setDiangkat(null);
  }

  /* ---------------------------- Keyboard -------------------------------- */

  function tanganiKeyboardKartu(e: React.KeyboardEvent, deal: Deal) {
    const urut = TAHAP.map((t) => t.id);
    const indeksSekarang = urut.indexOf(diangkat?.tahap ?? deal.tahap);

    if (e.key === ' ' || e.key === 'Enter') {
      if (e.key === 'Enter' && !diangkat) return; /* Enter tanpa angkat = buka detail */
      e.preventDefault();
      if (!diangkat) {
        setDiangkat({ dealId: deal.id, tahap: deal.tahap });
        umumkan(
          `${deal.nama} diangkat dari tahap ${namaTahapDari(deal.tahap)}. Pakai panah kiri dan kanan untuk memindah, spasi untuk menjatuhkan, Escape untuk membatalkan.`,
        );
      } else {
        mintaPindah(deal, diangkat.tahap);
        if (diangkat.tahap !== 'kalah') setDiangkat(null);
      }
      return;
    }

    if (e.key === 'Escape' && diangkat) {
      e.preventDefault();
      setDiangkat(null);
      umumkan('Perpindahan dibatalkan.');
      return;
    }

    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && diangkat) {
      e.preventDefault();
      const arah = e.key === 'ArrowRight' ? 1 : -1;
      const tujuan = urut[Math.max(0, Math.min(urut.length - 1, indeksSekarang + arah))];
      setDiangkat({ dealId: deal.id, tahap: tujuan });
      umumkan(`Siap dijatuhkan di tahap ${namaTahapDari(tujuan)}. Tekan spasi untuk menjatuhkan.`);
    }
  }

  /* ------------------------ Seret dan lepas ------------------------------ */

  function mulaiSeret(e: React.DragEvent, deal: Deal) {
    setSedangDiseret(deal.id);
    e.dataTransfer.setData('text/plain', deal.id);
    e.dataTransfer.effectAllowed = 'move';
  }

  function lepasDi(e: React.DragEvent, tahap: TahapId) {
    e.preventDefault();
    setKolomTujuan(null);
    setSedangDiseret(null);
    const id = e.dataTransfer.getData('text/plain');
    const deal = deals.find((d) => d.id === id);
    if (deal) mintaPindah(deal, tahap);
  }

  return (
    <>
      <p className="t-xs muted" style={{ marginBottom: 8 }}>
        Seret kartu antar tahap, atau fokus ke kartu lalu tekan spasi untuk mengangkat dan panah
        kiri dan kanan untuk memindah. Tahap Kalah akan meminta alasan.
      </p>

      {/* Pengumuman untuk pembaca layar. Wajib ada karena seret dan lepas
          murni tetikus itu fitur yang setengah jadi (DESIGN.md 6.7). */}
      <div className="sr-only" role="status" aria-live="polite">
        {pengumuman}
      </div>

      <div className="kanban" ref={refPapan} data-r48="carousel-mobile">
        {TAHAP.map((tahap) => {
          const isi = deals.filter((d) => d.tahap === tahap.id);
          const total = isi.reduce((s, d) => s + d.nilai, 0);
          const jadiTujuanKeyboard = diangkat?.tahap === tahap.id;

          return (
            <section
              key={tahap.id}
              className="kb-col"
              aria-label={`Tahap ${tahap.nama}, ${isi.length} deal`}
              data-dropping={kolomTujuan === tahap.id || jadiTujuanKeyboard ? 'true' : 'false'}
              onDragOver={(e) => {
                e.preventDefault();
                setKolomTujuan(tahap.id);
              }}
              onDragLeave={() => setKolomTujuan((t) => (t === tahap.id ? null : t))}
              onDrop={(e) => lepasDi(e, tahap.id)}
            >
              <header className="kb-head">
                <div className="kb-head-top">
                  <span
                    className="kb-head-bar"
                    style={{ background: WARNA_TAHAP[tahap.id] }}
                    aria-hidden="true"
                  />
                  <span className="t-body-strong grow">{tahap.nama}</span>
                  <span className="t-xs muted num">{isi.length}</span>
                </div>
                <span className="t-metric-sm num">{rupiahSingkat(total)}</span>
              </header>

              <div className="kb-list">
                {isi.length === 0 && (
                  <p className="kb-empty t-sm">
                    Belum ada deal di tahap ini. Tarik deal dari tahap sebelumnya, atau tambah deal
                    baru.
                  </p>
                )}

                {isi.map((deal) => {
                  const kontak = getContact(deal.contactId);
                  const mandek = isMandek(deal);
                  const kartuDiangkat = diangkat?.dealId === deal.id;
                  return (
                    <article
                      key={deal.id}
                      className="kb-card"
                      style={{ borderLeftColor: WARNA_TAHAP[deal.tahap] }}
                      draggable
                      tabIndex={0}
                      role="button"
                      aria-grabbed={kartuDiangkat}
                      aria-label={`${deal.nama}, ${namaCompany(deal.companyId)}, tahap ${tahap.nama}`}
                      data-lifted={kartuDiangkat ? 'true' : 'false'}
                      data-dragging={sedangDiseret === deal.id ? 'true' : 'false'}
                      onDragStart={(e) => mulaiSeret(e, deal)}
                      onDragEnd={() => setSedangDiseret(null)}
                      onKeyDown={(e) => tanganiKeyboardKartu(e, deal)}
                    >
                      {/* R50: setiap baris elemen blok terpisah dengan gap */}
                      <Link href={`/app/deals/${deal.id}/`} className="titled" style={{ color: 'inherit' }}>
                        <span className="t-body-strong">{deal.nama}</span>
                        <span className="t-xs muted">{namaCompany(deal.companyId)}</span>
                      </Link>

                      <div className="row gap-8 wrap">
                        <span className="t-body-strong num">{rupiahSingkat(deal.nilai)}</span>
                        <Badge tone={TONE_TAHAP[deal.tahap]}>{deal.probabilitas} persen</Badge>
                        {mandek && (
                          <Badge tone="warning" icon="peringatan">
                            Mandek {hariMandek(deal)} hari
                          </Badge>
                        )}
                      </div>

                      <div className="row gap-8" style={{ justifyContent: 'space-between' }}>
                        <span className="row gap-4 t-xs muted">
                          <Icon name="kalender" size={12} />
                          {tanggalRingkas(deal.perkiraanTutup)}
                        </span>
                        <span
                          className="row gap-4"
                          title={`Penanggung jawab ${namaUser(deal.ownerId)}`}
                        >
                          <Avatar
                            nama={namaUser(deal.ownerId)}
                            kunci={deal.ownerId}
                            size="sm"
                          />
                          <span className="sr-only">
                            Penanggung jawab {namaUser(deal.ownerId)}
                          </span>
                        </span>
                      </div>

                      {kontak && <span className="t-xs muted truncate">{kontak.nama}</span>}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <DialogAlasanKalah
        panel={dialogKalah}
        deal={menungguAlasan}
        onBatal={() => {
          dialogKalah.tutup();
          setMenungguAlasan(null);
          setDiangkat(null);
          umumkan('Perpindahan dibatalkan. Deal tetap di tahap asalnya.');
        }}
        onSimpan={selesaikanKalah}
      />
    </>
  );
}

function namaTahapDari(id: TahapId): string {
  return TAHAP.find((t) => t.id === id)?.nama ?? id;
}

/* -------------------------------------------------------------------------
   Dialog alasan kalah.

   Perpindahan ke tahap Kalah memicu dialog ini, bukan sekadar geser. Tombol
   simpan tidak aktif sampai alasan dipilih, dan `useDealStore` menolak
   perpindahan tanpa alasan, jadi ada dua lapis penjagaan.
   ------------------------------------------------------------------------- */

function DialogAlasanKalah({
  panel,
  deal,
  onBatal,
  onSimpan,
}: {
  panel: ReturnType<typeof useDisclosure>;
  deal: Deal | null;
  onBatal: () => void;
  onSimpan: (alasanKalahId: AlasanKalahId, catatan: string) => void;
}) {
  const [alasan, setAlasan] = useState<string>('');
  const [catatan, setCatatan] = useState('');

  if (!deal) return null;

  return (
    <Modal
      panel={{ ...panel, tutup: onBatal }}
      judul="Tandai deal ini kalah?"
      keterangan="Pilih alasannya supaya laporan bulan depan berguna."
      footer={
        <>
          <button
            type="button"
            className="btn btn-danger"
            disabled={!alasan}
            onClick={() => {
              onSimpan(alasan as AlasanKalahId, catatan);
              setAlasan('');
              setCatatan('');
            }}
          >
            Tandai kalah
          </button>
          <button type="button" className="btn btn-secondary" onClick={onBatal}>
            Batal
          </button>
        </>
      }
    >
      <div className="stack gap-16">
        <div className="card" style={{ padding: 12 }}>
          <span className="titled">
            <span className="t-body-strong">{deal.nama}</span>
            <span className="t-sm muted">{namaCompany(deal.companyId)}</span>
            <span className="t-sm muted num">{rupiahSingkat(deal.nilai)}</span>
          </span>
        </div>

        <Select
          label="Alasan kalah"
          tampilkanLabel
          placeholder="Pilih alasan"
          nilai={alasan}
          onUbah={setAlasan}
          lebar="100%"
          opsi={ALASAN_KALAH.filter((a) => a.aktif).map((a) => ({
            nilai: a.id,
            label: a.nama,
          }))}
        />

        <Field label="Catatan tambahan" htmlFor="catatan-kalah">
          <Textarea
            id="catatan-kalah"
            value={catatan}
            placeholder="Contoh: selisih sekitar 30 persen dari anggaran, minta ditawarkan lagi tahun depan."
            onChange={(e) => setCatatan(e.target.value)}
          />
        </Field>

        {!alasan && (
          <p className="t-xs muted">
            Alasan kalah wajib dipilih. Tanpa itu deal tidak akan dipindahkan.
          </p>
        )}
      </div>
    </Modal>
  );
}
