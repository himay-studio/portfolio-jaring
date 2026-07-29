'use client';

/* ==========================================================================
   Modal buat penawaran. Editor baris item dengan stepper qty dan harga,
   dipakai bersama oleh halaman Penawaran dan detail Deal. Angkanya dihitung
   pakai `hitungPenawaran` lewat objek sementara, jadi rumusnya SAMA PERSIS
   dengan yang dipakai daftar dan detail penawaran, tidak ditulis ulang.
   ========================================================================== */

import { useId, useState } from 'react';
import { Icon } from '@/components/Icon';
import { Field, Input, Textarea } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Overlay';
import { Select } from '@/components/ui/Select';
import { hitungPenawaran, namaCompany } from '@/data/relations';
import { PPN_PERSEN } from '@/data/settings';
import type { Deal, ItemPenawaran } from '@/data/types';
import type { InputQuotationBaru } from '@/lib/quotationStore';
import type { useDisclosure } from '@/lib/hooks';
import { rupiah } from '@/lib/format';

let penghitungBaris = 0;
interface BarisEdit extends ItemPenawaran {
  kunci: number;
}

function barisKosong(): BarisEdit {
  penghitungBaris += 1;
  return { kunci: penghitungBaris, deskripsi: '', qty: 1, satuan: 'pengguna', hargaSatuan: 0 };
}

export function QuotationFormModal({
  panel,
  deal,
  dealsUntukPilihan,
  onSimpan,
}: {
  panel: ReturnType<typeof useDisclosure>;
  /** Deal tetap, dipakai dari halaman detail deal. */
  deal?: Deal | null;
  /** Kalau `deal` tidak diberikan, pengunjung memilih dari daftar ini dulu (halaman Penawaran). */
  dealsUntukPilihan?: Deal[];
  onSimpan: (input: InputQuotationBaru) => void;
}) {
  const [dealIdPilihan, setDealIdPilihan] = useState('');
  const dealAktif = deal ?? dealsUntukPilihan?.find((d) => d.id === dealIdPilihan) ?? null;

  const [baris, setBaris] = useState<BarisEdit[]>([barisKosong()]);
  const [diskonPersen, setDiskonPersen] = useState('0');
  const [catatan, setCatatan] = useState('');

  const items: ItemPenawaran[] = baris.map(({ kunci, ...item }) => item);
  const rincian = hitungPenawaran({
    id: '', nomor: '', dealId: '', companyId: '', contactId: '', ownerId: '',
    tanggal: '', berlakuHingga: '', status: 'draft',
    diskonPersen: Number(diskonPersen) || 0, pajakPersen: PPN_PERSEN, catatan: '', items,
  });

  const sah = !!dealAktif && baris.some((b) => b.deskripsi.trim() && b.qty > 0 && b.hargaSatuan > 0);

  function tutupDanReset() {
    panel.tutup();
    setBaris([barisKosong()]);
    setDiskonPersen('0');
    setCatatan('');
    setDealIdPilihan('');
  }

  function ubahBaris(kunci: number, patch: Partial<ItemPenawaran>) {
    setBaris((b) => b.map((row) => (row.kunci === kunci ? { ...row, ...patch } : row)));
  }

  return (
    <Modal
      panel={{ ...panel, tutup: tutupDanReset }}
      judul="Buat penawaran"
      keterangan={dealAktif ? `Untuk deal ${dealAktif.nama}` : 'Pilih deal dulu, lalu isi baris item.'}
      lebar="wide"
      footer={
        <>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!sah}
            onClick={() => {
              if (!dealAktif) return;
              onSimpan({
                dealId: dealAktif.id,
                companyId: dealAktif.companyId,
                contactId: dealAktif.contactId,
                ownerId: dealAktif.ownerId,
                diskonPersen: Number(diskonPersen) || 0,
                catatan: catatan.trim(),
                items: items.filter((i) => i.deskripsi.trim() && i.qty > 0 && i.hargaSatuan > 0),
              });
              tutupDanReset();
            }}
          >
            Simpan sebagai draft
          </button>
          <button type="button" className="btn btn-secondary" onClick={tutupDanReset}>
            Batal
          </button>
        </>
      }
    >
      <div className="stack gap-16">
        {dealsUntukPilihan && !deal && (
          <Select
            label="Deal"
            tampilkanLabel
            placeholder="Pilih deal"
            nilai={dealIdPilihan}
            onUbah={setDealIdPilihan}
            lebar="100%"
            opsi={dealsUntukPilihan.map((d) => ({ nilai: d.id, label: d.nama, keterangan: namaCompany(d.companyId) }))}
          />
        )}

        {!dealAktif ? (
          <p className="t-sm muted">Pilih deal dulu supaya perusahaan dan kontaknya tertaut otomatis.</p>
        ) : (
          <div className="stack gap-16">
          <div className="stack gap-10">
            <span className="t-label muted">Baris item</span>
            {baris.map((b) => (
              <BarisItem key={b.kunci} baris={b} onUbah={(patch) => ubahBaris(b.kunci, patch)} onHapus={() => setBaris((arr) => arr.filter((r) => r.kunci !== b.kunci))} bisaDihapus={baris.length > 1} />
            ))}
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setBaris((b) => [...b, barisKosong()])} style={{ alignSelf: 'flex-start' }}>
              <Icon name="plus" size={14} />
              Tambah baris
            </button>
          </div>

          <div className="grid grid-2">
            <Field label="Diskon (persen)" htmlFor="pnw-diskon">
              <Input id="pnw-diskon" type="number" min={0} max={100} value={diskonPersen} onChange={(e) => setDiskonPersen(e.target.value)} />
            </Field>
            <Field label="Pajak" htmlFor="pnw-pajak" keterangan={`PPN bawaan ${PPN_PERSEN} persen`}>
              <Input id="pnw-pajak" value={`${PPN_PERSEN}%`} disabled />
            </Field>
          </div>

          <Field label="Catatan" htmlFor="pnw-catatan">
            <Textarea id="pnw-catatan" value={catatan} onChange={(e) => setCatatan(e.target.value)} />
          </Field>

          <div className="quote-total">
            <div className="quote-total-row">
              <span className="t-sm muted">Subtotal</span>
              <span className="t-body num">{rupiah(rincian.subtotal)}</span>
            </div>
            {rincian.diskon > 0 && (
              <div className="quote-total-row">
                <span className="t-sm muted">Diskon</span>
                <span className="t-body num">{rupiah(-rincian.diskon)}</span>
              </div>
            )}
            <div className="quote-total-row">
              <span className="t-sm muted">PPN {PPN_PERSEN} persen</span>
              <span className="t-body num">{rupiah(rincian.pajak)}</span>
            </div>
            <div className="quote-total-row" data-grand="true">
              <span className="t-h3">Total</span>
              <span className="t-h3 num">{rupiah(rincian.total)}</span>
            </div>
          </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function BarisItem({
  baris,
  onUbah,
  onHapus,
  bisaDihapus,
}: {
  baris: BarisEdit;
  onUbah: (patch: Partial<ItemPenawaran>) => void;
  onHapus: () => void;
  bisaDihapus: boolean;
}) {
  const id = useId();
  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="stack gap-10">
        <Field label="Deskripsi" htmlFor={`${id}-desk`}>
          <Input
            id={`${id}-desk`}
            value={baris.deskripsi}
            onChange={(e) => onUbah({ deskripsi: e.target.value })}
            placeholder="Contoh: Lisensi Jaring Pro, per pengguna per tahun"
          />
        </Field>
        <div className="row gap-12 wrap" style={{ alignItems: 'flex-end' }}>
          <Field label="Qty" htmlFor={`${id}-qty`}>
            <div className="row gap-6">
              <button
                type="button"
                className="icon-btn"
                aria-label="Kurangi qty"
                onClick={() => onUbah({ qty: Math.max(1, baris.qty - 1) })}
              >
                <Icon name="chevron-left" size={14} />
              </button>
              <Input
                id={`${id}-qty`}
                type="number"
                min={1}
                value={baris.qty}
                onChange={(e) => onUbah({ qty: Math.max(1, Number(e.target.value) || 1) })}
                style={{ width: 64, textAlign: 'center' }}
              />
              <button
                type="button"
                className="icon-btn"
                aria-label="Tambah qty"
                onClick={() => onUbah({ qty: baris.qty + 1 })}
              >
                <Icon name="chevron-right" size={14} />
              </button>
            </div>
          </Field>
          <Field label="Satuan" htmlFor={`${id}-satuan`}>
            <Input id={`${id}-satuan`} value={baris.satuan} onChange={(e) => onUbah({ satuan: e.target.value })} style={{ width: 110 }} />
          </Field>
          <Field label="Harga satuan" htmlFor={`${id}-harga`}>
            <Input
              id={`${id}-harga`}
              type="number"
              min={0}
              value={baris.hargaSatuan}
              onChange={(e) => onUbah({ hargaSatuan: Math.max(0, Number(e.target.value) || 0) })}
              style={{ width: 160 }}
            />
          </Field>
          {bisaDihapus && (
            <button type="button" className="icon-btn" aria-label="Hapus baris" onClick={onHapus}>
              <Icon name="x" size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
