'use client';

import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { Avatar, Badge } from '@/components/ui/Basic';
import { Checkbox, Field, Input, Toggle } from '@/components/ui/Form';
import { PageHeader, TabPanel, Tabs } from '@/components/ui/Nav';
import { Select } from '@/components/ui/Select';
import { ALASAN_KALAH, PERAN, SUMBER_LEAD, TAHAP } from '@/data/settings';
import { USERS } from '@/data/relations';
import type { Tone } from '@/data/types';
import { rupiah } from '@/lib/format';
import { useSettingsStore } from '@/lib/settingsStore';

/* ==========================================================================
   Pengaturan.

   Empat hal yang diminta HIM-283: tahap pipeline kustom, sumber lead, alasan
   kalah, serta pengguna dan peran.

   Semua kontrol di layar ini sengaja memakai komponen kustom, bukan bawaan
   browser. Tidak ada satu pun `<select>` (R12), tidak ada input tanggal teks
   bebas (R21), toggle selalu berpasangan dengan label teks keadaan supaya
   tidak mengandalkan warna saja (R20).
   ========================================================================== */

const TAB = [
  { id: 'pipeline', label: 'Tahap pipeline', icon: 'deals' as const },
  { id: 'sumber', label: 'Sumber lead', icon: 'leads' as const },
  { id: 'kalah', label: 'Alasan kalah', icon: 'peringatan' as const },
  { id: 'pengguna', label: 'Pengguna dan peran', icon: 'tim' as const },
  { id: 'umum', label: 'Umum', icon: 'pengaturan' as const },
];

const WARNA_TONE: Record<Tone, string> = {
  brand: 'var(--brand)',
  accent: 'var(--accent)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
  info: 'var(--info)',
  neutral: 'var(--border-strong)',
};

export default function HalamanPengaturan() {
  const { pengaturan, simpan, kembalikanBawaan, tersimpan } = useSettingsStore();
  const [tab, setTab] = useState('pipeline');

  /* Setiap kontrol menulis langsung ke localStorage lewat `simpan`, jadi
     tidak ada state "belum disimpan" yang bisa hilang kalau pengunjung
     pindah tab tanpa menekan tombol apa pun. */
  const ubah = (patch: Partial<typeof pengaturan>) => simpan({ ...pengaturan, ...patch });

  return (
    <>
      <PageHeader
        judul="Pengaturan"
        keterangan="Tahap pipeline, sumber lead, alasan kalah, serta pengguna dan peran."
        aksi={
          <>
            {tersimpan && (
              <button type="button" className="btn btn-secondary" onClick={kembalikanBawaan}>
                Kembalikan bawaan
              </button>
            )}
          </>
        }
      />

      <Tabs item={TAB} aktif={tab} onUbah={setTab} label="Bagian pengaturan" />

      {/* --------------------------- Tahap pipeline -------------------------- */}
      <TabPanel id="pipeline" aktif={tab}>
        <div className="card">
          <div className="card-head">
            <span className="titled">
              <span className="t-h3">Tahap pipeline</span>
              <span className="t-sm muted">
                Urutan dan nama tahap. Tahap Menang dan Kalah tidak bisa dihapus karena keduanya
                tahap akhir.
              </span>
            </span>
            <button type="button" className="btn btn-secondary btn-sm">
              <Icon name="plus" size={14} />
              Tambah tahap
            </button>
          </div>
          <div className="settings-list" data-r48="koleksi-data">
            {TAHAP.map((t) => (
              <div className="settings-row" key={t.id}>
                <span className="stage-swatch" style={{ background: WARNA_TONE[t.tone] }} aria-hidden="true" />
                <span className="titled grow" style={{ minWidth: 200 }}>
                  <span className="t-body-strong">{t.nama}</span>
                  <span className="t-xs muted">{t.keterangan}</span>
                </span>
                <span className="titled" style={{ minWidth: 130 }}>
                  <span className="t-label muted">Probabilitas</span>
                  <span className="t-body num">{t.probabilitasBawaan} persen</span>
                </span>
                {t.terminal ? (
                  <Badge tone={t.terminal === 'menang' ? 'success' : 'danger'}>Tahap akhir</Badge>
                ) : (
                  <Badge tone="brand">Tahap aktif</Badge>
                )}
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`Ubah tahap ${t.nama}`}
                  disabled={t.terminal !== null}
                >
                  <Icon name="pengaturan" size={16} />
                </button>
              </div>
            ))}
          </div>
          <div className="card-foot t-sm muted">
            Tahap Kalah selalu meminta alasan saat sebuah deal dipindahkan ke sana. Aturan itu
            ditegakkan di lapisan data, jadi berlaku juga untuk jalur keyboard di papan kanban.
          </div>
        </div>
      </TabPanel>

      {/* ----------------------------- Sumber lead --------------------------- */}
      <TabPanel id="sumber" aktif={tab}>
        <div className="card">
          <div className="card-head">
            <span className="titled">
              <span className="t-h3">Sumber lead</span>
              <span className="t-sm muted">
                Kanal yang muncul di formulir lead dan di laporan sumber terbaik.
              </span>
            </span>
            <button type="button" className="btn btn-secondary btn-sm">
              <Icon name="plus" size={14} />
              Tambah sumber
            </button>
          </div>
          <div className="settings-list" data-r48="koleksi-data">
            {SUMBER_LEAD.map((s) => (
              <div className="settings-row" key={s.id}>
                <span className="titled grow" style={{ minWidth: 200 }}>
                  <span className="t-body-strong">{s.nama}</span>
                  <span className="t-xs muted">Kode {s.id}</span>
                </span>
                <Toggle
                  label={`Aktifkan sumber ${s.nama}`}
                  checked={pengaturan.sumberAktif[s.id] ?? s.aktif}
                  onUbah={(v) => ubah({ sumberAktif: { ...pengaturan.sumberAktif, [s.id]: v } })}
                />
                <button type="button" className="icon-btn" aria-label={`Ubah sumber ${s.nama}`}>
                  <Icon name="pengaturan" size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </TabPanel>

      {/* ---------------------------- Alasan kalah --------------------------- */}
      <TabPanel id="kalah" aktif={tab}>
        <div className="card">
          <div className="card-head">
            <span className="titled">
              <span className="t-h3">Alasan kalah</span>
              <span className="t-sm muted">
                Pilihan yang muncul di dialog saat deal digeser ke tahap Kalah.
              </span>
            </span>
            <button type="button" className="btn btn-secondary btn-sm">
              <Icon name="plus" size={14} />
              Tambah alasan
            </button>
          </div>
          <div className="settings-list" data-r48="koleksi-data">
            {ALASAN_KALAH.map((a) => (
              <div className="settings-row" key={a.id}>
                <span className="titled grow" style={{ minWidth: 220 }}>
                  <span className="t-body-strong">{a.nama}</span>
                  <span className="t-xs muted">Kode {a.id}</span>
                </span>
                <Toggle
                  label={`Aktifkan alasan ${a.nama}`}
                  checked={pengaturan.alasanAktif[a.id] ?? a.aktif}
                  onUbah={(v) => ubah({ alasanAktif: { ...pengaturan.alasanAktif, [a.id]: v } })}
                />
                <button type="button" className="icon-btn" aria-label={`Ubah alasan ${a.nama}`}>
                  <Icon name="pengaturan" size={16} />
                </button>
              </div>
            ))}
          </div>
          <div className="card-foot t-sm muted">
            Kalau semua alasan dinonaktifkan, deal tidak akan bisa ditandai kalah sama sekali. Sisakan
            minimal satu.
          </div>
        </div>
      </TabPanel>

      {/* ------------------------- Pengguna dan peran ------------------------ */}
      <TabPanel id="pengguna" aktif={tab}>
        <div className="grid grid-2">
          <div className="card">
            <div className="card-head">
              <span className="titled">
                <span className="t-h3">Pengguna</span>
                <span className="t-sm muted">{USERS.length} orang di tim demo</span>
              </span>
              <button type="button" className="btn btn-secondary btn-sm">
                <Icon name="plus" size={14} />
                Undang
              </button>
            </div>
            <div className="settings-list" data-r48="koleksi-data">
              {USERS.map((u) => (
                <div className="settings-row" key={u.id}>
                  <Avatar nama={u.nama} kunci={u.id} inisial={u.inisial} />
                  <span className="titled grow" style={{ minWidth: 180 }}>
                    <span className="t-body-strong">{u.nama}</span>
                    <span className="t-xs muted">{u.email}</span>
                  </span>
                  <span className="titled" style={{ minWidth: 150 }}>
                    <span className="t-label muted">Target bulanan</span>
                    <span className="t-sm num">
                      {u.targetBulanan > 0 ? rupiah(u.targetBulanan) : 'Tanpa target'}
                    </span>
                  </span>
                  <Badge tone={u.peran === 'manajer' ? 'brand' : u.peran === 'ae' ? 'accent' : 'info'}>
                    {PERAN.find((p) => p.id === u.peran)?.nama}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <span className="titled">
                <span className="t-h3">Peran dan hak akses</span>
                <span className="t-sm muted">Apa yang boleh dilakukan tiap peran</span>
              </span>
            </div>
            <div className="settings-list" data-r48="koleksi-data">
              {PERAN.map((p) => (
                <div className="settings-row" key={p.id} style={{ alignItems: 'flex-start' }}>
                  <span className="titled grow">
                    <span className="t-body-strong">{p.nama}</span>
                    <span className="t-xs muted">{p.keterangan}</span>
                    <span className="chipset" style={{ marginTop: 6 }}>
                      {p.hak.map((h) => (
                        <Badge key={h}>{h}</Badge>
                      ))}
                    </span>
                  </span>
                  <span className="t-xs muted num">
                    {USERS.filter((u) => u.peran === p.id).length} orang
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </TabPanel>

      {/* -------------------------------- Umum ------------------------------- */}
      <TabPanel id="umum" aktif={tab}>
        <div className="grid grid-2">
          <div className="card">
            <div className="card-head">
              <span className="t-h3">Aturan pipeline</span>
            </div>
            <div className="card-body stack gap-16">
              <Field
                label="Ambang deal mandek"
                htmlFor="ambang"
                keterangan="Deal berjalan yang tidak tersentuh lebih lama dari ini ditandai mandek."
              >
                <div className="row gap-8">
                  <Input
                    id="ambang"
                    type="number"
                    min={1}
                    max={90}
                    value={pengaturan.ambangMandekHari}
                    onChange={(e) => ubah({ ambangMandekHari: Number(e.target.value) || 1 })}
                    style={{ width: 120 }}
                  />
                  <span className="t-sm muted">hari</span>
                </div>
              </Field>

              <Field
                label="Pajak bawaan penawaran"
                htmlFor="pajak"
                keterangan="Dipakai sebagai nilai awal saat membuat penawaran baru."
              >
                <div className="row gap-8">
                  <Input
                    id="pajak"
                    type="number"
                    min={0}
                    max={100}
                    value={pengaturan.pajakPersen}
                    onChange={(e) => ubah({ pajakPersen: Number(e.target.value) || 0 })}
                    style={{ width: 120 }}
                  />
                  <span className="t-sm muted">persen</span>
                </div>
              </Field>

              <Select
                label="Mata uang"
                tampilkanLabel
                nilai={pengaturan.mataUang}
                onUbah={(v) => ubah({ mataUang: v })}
                lebar="100%"
                opsi={[
                  { nilai: 'idr', label: 'Rupiah', keterangan: 'Rp, titik sebagai pemisah ribuan' },
                  { nilai: 'usd', label: 'Dolar Amerika', keterangan: 'USD', nonaktif: true },
                  { nilai: 'sgd', label: 'Dolar Singapura', keterangan: 'SGD', nonaktif: true },
                ]}
              />
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <span className="t-h3">Pengingat</span>
            </div>
            <div className="card-body stack gap-16">
              <div className="stack gap-6">
                <Toggle
                  label="Pengingat aktivitas jatuh tempo"
                  checked={pengaturan.pengingatAktivitas}
                  onUbah={(v) => ubah({ pengingatAktivitas: v })}
                />
                <span className="t-xs muted">
                  Memberi tahu penanggung jawab pada pagi hari untuk aktivitas yang jatuh tempo hari
                  itu.
                </span>
              </div>

              <div className="stack gap-6">
                <Toggle
                  label="Ringkasan pipeline harian"
                  checked={pengaturan.ringkasanHarian}
                  onUbah={(v) => ubah({ ringkasanHarian: v })}
                />
                <span className="t-xs muted">
                  Mengirim ringkasan deal mandek dan perkiraan tutup ke manajer setiap sore.
                </span>
              </div>

              <div className="hr" />

              <div className="stack gap-10">
                <span className="t-label muted">Kolom bawaan tabel deal</span>
                {Object.keys(pengaturan.kolomDeal).map((k) => (
                  <Checkbox
                    key={k}
                    label={k}
                    checked={pengaturan.kolomDeal[k]}
                    onUbah={(v) => ubah({ kolomDeal: { ...pengaturan.kolomDeal, [k]: v } })}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </TabPanel>
    </>
  );
}
