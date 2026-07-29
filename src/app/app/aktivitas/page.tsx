'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Icon } from '@/components/Icon';
import { ActivityFormModal } from '@/components/activity/ActivityFormModal';
import { Avatar, Badge, EmptyState, StatCard } from '@/components/ui/Basic';
import { Checkbox, SearchInput } from '@/components/ui/Form';
import { PageHeader, Toolbar, ToolbarSpacer, ViewPane, ViewSwitcher, useViewMode } from '@/components/ui/Nav';
import { Select } from '@/components/ui/Select';
import { HARI_INI, umurHari } from '@/data/clock';
import { USERS, getContact, getDeal, getLead, namaCompany, namaUser } from '@/data/relations';
import { LABEL_JENIS_AKTIVITAS, TONE_JENIS_AKTIVITAS } from '@/data/settings';
import type { Activity, JenisAktivitas, Tone, ViewMode } from '@/data/types';
import { useActivityStore } from '@/lib/activityStore';
import { useDisclosure } from '@/lib/hooks';
import {
  HARI_PENDEK,
  jam,
  namaBulan,
  relatifHari,
  tanggalLengkap,
  tanggalRingkas,
} from '@/lib/format';
import { gridBulan, mingguDari, tambahBulan, tambahHari } from '@/lib/kalender';

/* ==========================================================================
   Aktivitas. WAJIB punya Calendar plus List (HIM-283).

   Calendar menjawab "kapan", List menjawab "apa yang belum beres". Keduanya
   membaca hasil penyaringan yang sama, jadi mengganti view tidak pernah
   mengubah apa yang sedang dilihat, cuma cara menggambarnya.

   Aktivitas yang tanggalnya sudah lewat dan belum ditandai selesai dianggap
   TERLAMBAT dan diberi warna danger. Itu inti janji brand: follow up yang
   menagih, bukan daftar yang diam.

   Di bawah 768px grid tujuh kolom membuat setiap sel selebar sekitar 50px dan
   tidak terbaca, jadi kalender berubah jadi agenda per hari. Bukan grid yang
   digulir mendatar, karena itu memicu overflow yang dilarang R19.
   ========================================================================== */

const VIEW: readonly ViewMode[] = ['calendar', 'list'];

const IKON_AKTIVITAS: Record<JenisAktivitas, 'telepon' | 'email' | 'meeting' | 'tugas'> = {
  telepon: 'telepon',
  email: 'email',
  meeting: 'meeting',
  tugas: 'tugas',
};

function toneAktivitas(a: Activity): Tone {
  if (!a.selesai && umurHari(a.mulai.slice(0, 10)) > 0) return 'danger';
  if (a.selesai) return 'success';
  if (a.mulai.slice(0, 10) === HARI_INI) return 'brand';
  return TONE_JENIS_AKTIVITAS[a.jenis];
}

function statusAktivitas(a: Activity): { label: string; tone: Tone } {
  if (a.selesai) return { label: 'Selesai', tone: 'success' };
  if (umurHari(a.mulai.slice(0, 10)) > 0) return { label: 'Terlambat', tone: 'danger' };
  if (a.mulai.slice(0, 10) === HARI_INI) return { label: 'Hari ini', tone: 'brand' };
  return { label: 'Terjadwal', tone: 'warning' };
}

function tautanRelasi(a: Activity): { label: string; href: string } | null {
  if (a.relasi.dealId) {
    const d = getDeal(a.relasi.dealId);
    if (d) return { label: d.nama, href: `/app/deals/${d.id}/` };
  }
  if (a.relasi.leadId) {
    const l = getLead(a.relasi.leadId);
    if (l) return { label: l.nama, href: `/app/leads/${l.id}/` };
  }
  if (a.relasi.contactId) {
    const k = getContact(a.relasi.contactId);
    if (k) return { label: k.nama, href: `/app/kontak/${k.id}/` };
  }
  if (a.relasi.companyId) {
    return { label: namaCompany(a.relasi.companyId), href: `/app/perusahaan/${a.relasi.companyId}/` };
  }
  return null;
}

export default function HalamanAktivitas() {
  const { activities, tandaiSelesai, catatAktivitas } = useActivityStore();
  const [view, setView] = useViewMode('aktivitas', VIEW);
  const [cari, setCari] = useState('');
  const [jenis, setJenis] = useState('semua');
  const [owner, setOwner] = useState('semua');
  const [status, setStatus] = useState('semua');
  const [rentang, setRentang] = useState<'bulan' | 'minggu'>('bulan');
  const [jangkar, setJangkar] = useState(HARI_INI);
  const panelCatat = useDisclosure();

  const tersaring = useMemo(
    () =>
      activities.filter((a) => {
        if (jenis !== 'semua' && a.jenis !== jenis) return false;
        if (owner !== 'semua' && a.ownerId !== owner) return false;
        if (status === 'selesai' && !a.selesai) return false;
        if (status === 'belum' && a.selesai) return false;
        if (status === 'terlambat' && (a.selesai || umurHari(a.mulai.slice(0, 10)) <= 0))
          return false;
        if (!cari.trim()) return true;
        const kata = cari.toLowerCase();
        return (
          a.judul.toLowerCase().includes(kata) ||
          a.catatan.toLowerCase().includes(kata) ||
          (tautanRelasi(a)?.label.toLowerCase().includes(kata) ?? false)
        );
      }),
    [activities, cari, jenis, owner, status],
  );

  const hariIni = tersaring.filter((a) => a.mulai.slice(0, 10) === HARI_INI);
  const terlambat = tersaring.filter((a) => !a.selesai && umurHari(a.mulai.slice(0, 10)) > 0);
  const mendatang = tersaring.filter((a) => !a.selesai && umurHari(a.mulai.slice(0, 10)) < 0);

  const perTanggal = useMemo(() => {
    const peta = new Map<string, Activity[]>();
    for (const a of tersaring) {
      const t = a.mulai.slice(0, 10);
      const daftar = peta.get(t) ?? [];
      daftar.push(a);
      peta.set(t, daftar);
    }
    for (const daftar of peta.values()) daftar.sort((x, y) => x.mulai.localeCompare(y.mulai));
    return peta;
  }, [tersaring]);

  const sel = gridBulan(jangkar);
  const minggu = mingguDari(jangkar);
  const hariBerisi = [...perTanggal.keys()].sort();

  return (
    <>
      <PageHeader
        judul="Aktivitas"
        keterangan="Telepon, meeting, email, dan tugas follow up. Yang jatuh tempo hari ini muncul paling atas."
        aksi={
          <>
            <button type="button" className="btn btn-primary" onClick={panelCatat.buka}>
              <Icon name="plus" size={16} />
              Catat aktivitas
            </button>
          </>
        }
      />

      {terlambat.length > 0 && (
        <div className="origin-trace" style={{ background: 'var(--danger-soft)', color: 'var(--danger-ink)', borderLeftColor: 'var(--danger)' }}>
          <Icon name="peringatan" size={16} />
          <span className="t-body">
            {terlambat.length} aktivitas terlambat, sudah lewat tanggal dan belum ditandai selesai.
            Tandai selesai dari daftar di bawah atau buka satu per satu.
          </span>
        </div>
      )}

      <div className="grid grid-kpi snap-row">
        <StatCard label="Total aktivitas" nilai={`${tersaring.length}`} keterangan="Sesuai penyaring" />
        <StatCard
          label="Jatuh tempo hari ini"
          nilai={`${hariIni.length}`}
          tone="brand"
          keterangan={tanggalLengkap(HARI_INI)}
        />
        <StatCard
          label="Terlambat"
          nilai={`${terlambat.length}`}
          tone={terlambat.length > 0 ? 'danger' : 'success'}
          keterangan="Lewat tanggal dan belum ditandai selesai"
        />
        <StatCard label="Akan datang" nilai={`${mendatang.length}`} tone="info" />
      </div>

      <div className="section">
        <Toolbar>
          <SearchInput
            nilai={cari}
            onUbah={setCari}
            label="Cari aktivitas"
            placeholder="Cari aktivitas"
          />
          <Select
            label="Jenis aktivitas"
            nilai={jenis}
            onUbah={setJenis}
            lebar={160}
            opsi={[
              { nilai: 'semua', label: 'Semua jenis' },
              ...Object.entries(LABEL_JENIS_AKTIVITAS).map(([nilai, label]) => ({ nilai, label })),
            ]}
          />
          <Select
            label="Status"
            nilai={status}
            onUbah={setStatus}
            lebar={160}
            opsi={[
              { nilai: 'semua', label: 'Semua status' },
              { nilai: 'belum', label: 'Belum selesai' },
              { nilai: 'terlambat', label: 'Terlambat' },
              { nilai: 'selesai', label: 'Selesai' },
            ]}
          />
          <Select
            label="Penanggung jawab"
            nilai={owner}
            onUbah={setOwner}
            lebar={190}
            opsi={[
              { nilai: 'semua', label: 'Semua penanggung jawab' },
              ...USERS.map((u) => ({ nilai: u.id, label: u.nama, keterangan: u.jabatan })),
            ]}
          />
          <ToolbarSpacer />
          <ViewSwitcher nilai={view} onUbah={setView} tersedia={VIEW} />
        </Toolbar>
      </div>

      <div className="section">
        {view === 'calendar' ? (
          <ViewPane kunci="calendar">
            <div className="row gap-8 wrap" style={{ marginBottom: 12 }}>
              <button
                type="button"
                className="icon-btn"
                aria-label={rentang === 'bulan' ? 'Bulan sebelumnya' : 'Minggu sebelumnya'}
                onClick={() =>
                  setJangkar(rentang === 'bulan' ? tambahBulan(jangkar, -1) : tambahHari(jangkar, -7))
                }
              >
                <Icon name="chevron-left" size={18} />
              </button>
              <span className="t-h3" aria-live="polite" style={{ minWidth: 190, textAlign: 'center' }}>
                {rentang === 'bulan'
                  ? `${namaBulan(Number(jangkar.slice(5, 7)))} ${jangkar.slice(0, 4)}`
                  : `${tanggalRingkas(minggu[0])} sampai ${tanggalRingkas(minggu[6])}`}
              </span>
              <button
                type="button"
                className="icon-btn"
                aria-label={rentang === 'bulan' ? 'Bulan berikutnya' : 'Minggu berikutnya'}
                onClick={() =>
                  setJangkar(rentang === 'bulan' ? tambahBulan(jangkar, 1) : tambahHari(jangkar, 7))
                }
              >
                <Icon name="chevron-right" size={18} />
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setJangkar(HARI_INI)}>
                Hari ini
              </button>
              <ToolbarSpacer />
              <Select
                label="Rentang kalender"
                nilai={rentang}
                onUbah={(v) => setRentang(v as 'bulan' | 'minggu')}
                lebar={150}
                align="right"
                opsi={[
                  { nilai: 'bulan', label: 'Tampilan bulan' },
                  { nilai: 'minggu', label: 'Tampilan minggu' },
                ]}
              />
            </div>

            <div className="cal">
              {/* ------------------- Grid, mulai 769px --------------------- */}
              <div className="cal-monthgrid">
                <div className="cal-head">
                  {HARI_PENDEK.map((h) => (
                    <div key={h} className="cal-dow t-label">
                      {h}
                    </div>
                  ))}
                </div>

                {rentang === 'bulan' ? (
                  <div className="cal-grid">
                    {sel.map((s) => {
                      const isi = perTanggal.get(s.iso) ?? [];
                      return (
                        <div
                          key={s.iso}
                          className="cal-cell"
                          data-outside={s.luarBulan ? 'true' : 'false'}
                          data-today={s.iso === HARI_INI ? 'true' : 'false'}
                        >
                          <span className="cal-daynum t-xs">
                            {Number(s.iso.slice(8, 10))}
                            {s.iso === HARI_INI && <span className="t-xs">hari ini</span>}
                          </span>
                          {isi.slice(0, 3).map((a) => (
                            <Link
                              key={a.id}
                              href={tautanRelasi(a)?.href ?? '/app/aktivitas/'}
                              className="cal-ev t-xs"
                              data-tone={toneAktivitas(a)}
                            >
                              {/* R50: jam dan judul elemen blok terpisah */}
                              <span className="num">{jam(a.mulai)}</span>
                              <span className="truncate">{a.judul}</span>
                            </Link>
                          ))}
                          {isi.length > 3 && (
                            <span className="cal-more t-xs">{isi.length - 3} lagi</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="cal-week">
                    {minggu.map((iso) => {
                      const isi = perTanggal.get(iso) ?? [];
                      return (
                        <div key={iso} className="cal-weekcol">
                          <span className="cal-weekhead titled">
                            <span className="t-xs muted">{tanggalRingkas(iso)}</span>
                            {iso === HARI_INI && <span className="t-xs" style={{ color: 'var(--brand)' }}>hari ini</span>}
                          </span>
                          {isi.length === 0 && <span className="t-xs muted">Kosong</span>}
                          {isi.map((a) => (
                            <Link
                              key={a.id}
                              href={tautanRelasi(a)?.href ?? '/app/aktivitas/'}
                              className="cal-ev t-xs"
                              data-tone={toneAktivitas(a)}
                            >
                              <span className="num">{jam(a.mulai)}</span>
                              <span>{a.judul}</span>
                            </Link>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ------------------ Agenda, sampai 768px -------------------- */}
              <div className="cal-agenda" data-r48="koleksi-data">
                {hariBerisi.length === 0 ? (
                  <EmptyState
                    judul="Tidak ada aktivitas"
                    keterangan="Tidak ada yang terjadwal dengan penyaring ini. Longgarkan penyaring atau catat aktivitas baru."
                  />
                ) : (
                  hariBerisi.map((iso) => (
                    <div className="agenda-day" key={iso}>
                      <div className="agenda-daytitle">
                        <span className="titled grow">
                          <span className="t-body-strong">{tanggalLengkap(iso)}</span>
                          <span className="t-xs muted">{relatifHari(-umurHari(iso))}</span>
                        </span>
                        {iso === HARI_INI && <Badge tone="brand">Hari ini</Badge>}
                      </div>
                      <ul className="stack gap-8">
                        {(perTanggal.get(iso) ?? []).map((a) => (
                          <li key={a.id}>
                            <Link
                              href={tautanRelasi(a)?.href ?? '/app/aktivitas/'}
                              className="cal-ev"
                              data-tone={toneAktivitas(a)}
                              style={{ padding: 10 }}
                            >
                              <span className="t-xs num">
                                {jam(a.mulai)}, {LABEL_JENIS_AKTIVITAS[a.jenis]}
                              </span>
                              <span className="t-body-strong">{a.judul}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </div>
            </div>
          </ViewPane>
        ) : (
          <ViewPane kunci="list">
            <div className="card">
              <div className="card-head">
                <span className="titled">
                  <span className="t-h3">Daftar aktivitas</span>
                  <span className="t-sm muted">
                    Diurutkan dari yang paling terlambat sampai yang paling jauh
                  </span>
                </span>
              </div>
              <div className="card-body" style={{ padding: tersaring.length > 0 ? '0 16px' : undefined }}>
                {tersaring.length === 0 ? (
                  <EmptyState
                    judul="Tidak ada aktivitas"
                    keterangan="Tidak ada yang jatuh tempo hari ini. Bagus. Cek deal yang mandek supaya tetap jalan."
                    aksi={
                      <Link href="/app/deals/" className="btn btn-secondary btn-sm">
                        Lihat deal mandek
                      </Link>
                    }
                  />
                ) : (
                  <ul className="timeline" data-r48="koleksi-data">
                    {[...tersaring]
                      .sort((a, b) => a.mulai.localeCompare(b.mulai))
                      .map((a) => {
                        const relasi = tautanRelasi(a);
                        const st = statusAktivitas(a);
                        return (
                          <li className="tl-item" key={a.id}>
                            <Checkbox
                              checked={a.selesai}
                              onUbah={(v) => tandaiSelesai(a.id, v)}
                              label={`Tandai selesai: ${a.judul}`}
                              sembunyikanLabel
                            />
                            <span className="tl-mark" data-tone={toneAktivitas(a)}>
                              <Icon name={IKON_AKTIVITAS[a.jenis]} size={15} />
                            </span>
                            <span className="titled grow">
                              <span className="t-body-strong">{a.judul}</span>
                              <span className="t-xs muted">
                                {tanggalRingkas(a.mulai)} pukul {jam(a.mulai)},{' '}
                                {LABEL_JENIS_AKTIVITAS[a.jenis]}, {a.durasiMenit} menit
                              </span>
                              {relasi && (
                                <Link href={relasi.href} className="t-xs">
                                  {relasi.label}
                                </Link>
                              )}
                            </span>
                            <span className="titled" style={{ alignItems: 'flex-end' }}>
                              <Badge tone={st.tone}>{st.label}</Badge>
                              <span className="row gap-6 t-xs muted">
                                <Avatar nama={namaUser(a.ownerId)} kunci={a.ownerId} size="sm" />
                                {namaUser(a.ownerId)}
                              </span>
                            </span>
                          </li>
                        );
                      })}
                  </ul>
                )}
              </div>
            </div>
          </ViewPane>
        )}
      </div>

      <ActivityFormModal panel={panelCatat} relasiDasar={{}} onSimpan={catatAktivitas} />
    </>
  );
}
