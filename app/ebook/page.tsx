'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../utils/supabase'

const METODE_BAYAR = [
  {
    id: 'bni',
    nama: 'BNI',
    nomor: '1234567890 a.n. Rumah Simulasi',
  },
  {
    id: 'qris',
    nama: 'QRIS',
    nomor: 'Scan QRIS untuk melakukan pembayaran',
  },
  {
    id: 'gopay',
    nama: 'GoPay',
    nomor: '081234567890 a.n. Rumah Simulasi',
  },
  {
    id: 'shopeepay',
    nama: 'ShopeePay',
    nomor: '081234567890 a.n. Rumah Simulasi',
  },
]

const NOMOR_WA_ADMIN = '6285179821611'

export default function EbookPage() {
  const [ebookList, setEbookList] = useState<any[]>([])
  const [pembelianList, setPembelianList] = useState<any[]>([])

  const [showModal, setShowModal] = useState(false)
  const [ebookTerpilih, setEbookTerpilih] = useState<any>(null)
  const [metodeTerpilih, setMetodeTerpilih] = useState<string | null>(null)
  const [memproses, setMemproses] = useState(false)

  const router = useRouter()

  // =========================
  // AMBIL DATA
  // =========================

  const fetchData = async () => {
    const { data: ebookData } = await supabase
      .from('ebook')
      .select('*')

    if (ebookData) {
      setEbookList(ebookData)
    }

    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id

    if (userId) {
      const { data: pembelianData } = await supabase
        .from('pembelian_ebook')
        .select('*')
        .eq('user_id', userId)

      if (pembelianData) {
        setPembelianList(pembelianData)
      }
    } else {
      setPembelianList([])
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getPembelian = (ebookId: string) => {
    return pembelianList.find(
      (p) => p.ebook_id === ebookId
    )
  }

  // =========================
  // BELI EBOOK
  // =========================

  const bukaPembayaran = async (ebook: any) => {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id

    if (!userId) {
      alert('Silakan login terlebih dahulu.')
      router.push('/login')
      return
    }

    const pembelianLama = getPembelian(ebook.id)

    if (!pembelianLama) {
      setMemproses(true)

      const { error } = await supabase
        .from('pembelian_ebook')
        .insert({
          user_id: userId,
          ebook_id: ebook.id,
          status: 'belum_bayar',
        })

      if (error) {
        alert(error.message)
        setMemproses(false)
        return
      }

      await fetchData()
      setMemproses(false)
    }

    setEbookTerpilih(ebook)
    setMetodeTerpilih(null)
    setShowModal(true)
  }

  // =========================
  // PILIH METODE
  // =========================

  const pilihMetode = (metode: string) => {
    setMetodeTerpilih(metode)
  }

  // =========================
  // KONFIRMASI PEMBAYARAN
  // =========================

  const konfirmasiPembayaran = async () => {
    if (!ebookTerpilih) return

    const pembelian = getPembelian(ebookTerpilih.id)

    if (!pembelian) {
      alert('Data pembelian tidak ditemukan.')
      return
    }

    setMemproses(true)

    const { error } = await supabase
      .from('pembelian_ebook')
      .update({
        status: 'menunggu_konfirmasi',
      })
      .eq('id', pembelian.id)

    if (error) {
      alert(error.message)
      setMemproses(false)
      return
    }

    setShowModal(false)
    setEbookTerpilih(null)
    setMetodeTerpilih(null)

    await fetchData()

    setMemproses(false)
  }

  // =========================
  // TUTUP POPUP PEMBAYARAN
  // =========================

  const tutupModal = async () => {
    if (!ebookTerpilih) {
      setShowModal(false)
      return
    }

    const pembelian = getPembelian(ebookTerpilih.id)

    if (
      pembelian &&
      pembelian.status === 'belum_bayar' &&
      metodeTerpilih
    ) {
      const { error } = await supabase
        .from('pembelian_ebook')
        .update({
          status: 'menunggu_konfirmasi',
        })
        .eq('id', pembelian.id)

      if (error) {
        alert(error.message)
        return
      }

      await fetchData()
    }

    setShowModal(false)
    setEbookTerpilih(null)
    setMetodeTerpilih(null)
  }

  const linkWhatsappAdmin = (ebook: any) => {
    const pesan = `Halo admin, saya sudah melakukan pembayaran untuk ebook "${ebook.judul}", saya mau konfirmasi.`

    return `https://wa.me/${NOMOR_WA_ADMIN}?text=${encodeURIComponent(pesan)}`
  }

  const getMetode = () => {
    return METODE_BAYAR.find(
      (m) => m.id === metodeTerpilih
    )
  }

  return (
    <>
      <main className="min-h-screen bg-slate-50 px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">

          {/* HEADER */}
          <div className="mb-7">
            <p className="text-sm font-extrabold uppercase tracking-wider text-[#2563EB]">
              Koleksi
            </p>

            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
              Ebook
            </h1>

            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
              Temukan ebook pilihan untuk menambah wawasan dan
              membantu persiapan belajarmu.
            </p>
          </div>

          {/* LIST EBOOK */}
          {ebookList.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <h2 className="text-lg font-extrabold text-slate-900">
                Belum Ada Ebook
              </h2>

              <p className="mt-2 text-sm font-medium text-slate-500">
                Belum ada ebook yang tersedia saat ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

              {ebookList.map((ebook) => {
                const pembelian = getPembelian(ebook.id)
                const status = pembelian
                  ? pembelian.status
                  : 'belum_beli'

                return (
                  <div
                    key={ebook.id}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
                  >

                    {/* SAMPUL */}
                    <div className="relative overflow-hidden bg-slate-100">

                      {ebook.sampul_gambar ? (
                        <img
                          src={ebook.sampul_gambar}
                          alt={ebook.judul}
                          className="h-72 w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-72 items-center justify-center bg-gradient-to-br from-[#EFF6FF] to-white">
                          <div className="text-center">
                            <div className="text-5xl">
                              📖
                            </div>

                            <p className="mt-3 text-xs font-extrabold uppercase tracking-wider text-[#2563EB]">
                              Ebook
                            </p>
                          </div>
                        </div>
                      )}

                      {/* BADGE */}
                      <div className="absolute left-4 top-4">
                        <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-extrabold text-[#2563EB] shadow-sm backdrop-blur">
                          EBOOK
                        </span>
                      </div>

                      {status === 'lunas' && (
                        <div className="absolute right-4 top-4">
                          <span className="rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-extrabold text-white shadow-sm">
                            DIMILIKI
                          </span>
                        </div>
                      )}

                    </div>

                    {/* ISI CARD */}
                    <div className="flex flex-1 flex-col p-6">

                      <h2 className="text-lg font-extrabold leading-6 text-slate-900 transition group-hover:text-[#2563EB]">
                        {ebook.judul}
                      </h2>

                      <p className="mt-2 line-clamp-3 text-sm font-medium leading-6 text-slate-500">
                        {ebook.deskripsi}
                      </p>

                      {/* HARGA */}
                      <div className="mt-5">
                        <p className="text-xs font-bold text-slate-400">
                          Harga
                        </p>

                        <p className="mt-1 text-xl font-black text-[#2563EB]">
                          Rp
                          {Number(ebook.harga).toLocaleString('id-ID')}
                        </p>
                      </div>

                      <div className="mt-5 border-t border-slate-100 pt-5" />

                      {/* LUNAS */}
                      {status === 'lunas' ? (
                        <div className="space-y-2">

                          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
                            <p className="text-sm font-extrabold text-emerald-700">
                              Ebook Sudah Dibeli
                            </p>

                            <p className="mt-1 text-xs font-medium leading-5 text-emerald-600">
                              Ebook siap dibaca atau diunduh.
                            </p>
                          </div>

                          <a
                            href={ebook.link_drive}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex w-full items-center justify-between rounded-xl bg-[#2563EB] px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#1D4ED8]"
                          >
                            Baca / Download

                            <span className="text-lg">
                              →
                            </span>
                          </a>

                        </div>

                      ) : status === 'menunggu_konfirmasi' ? (

                        /* MENUNGGU KONFIRMASI */
                        <div className="space-y-2">

                          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center">
                            <p className="text-sm font-extrabold text-amber-700">
                              Menunggu Konfirmasi
                            </p>

                            <p className="mt-1 text-xs font-medium leading-5 text-amber-600">
                              Sedang diperiksa admin.
                            </p>
                          </div>

                          <a
                            href={linkWhatsappAdmin(ebook)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-extrabold text-emerald-700 transition hover:bg-emerald-100"
                          >
                            Hubungi Admin
                          </a>

                        </div>

                      ) : (

                        /* BELI */
                        <button
                          onClick={() => bukaPembayaran(ebook)}
                          disabled={memproses}
                          className="flex w-full items-center justify-between rounded-xl bg-[#2563EB] px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {memproses ? 'Memproses...' : 'Beli Ebook'}

                          <span className="text-lg">
                            →
                          </span>
                        </button>
                      )}

                    </div>

                  </div>
                )
              })}

            </div>
          )}
        </div>
      </main>

      {/* ================================================= */}
      {/* POPUP PEMBAYARAN */}
      {/* ================================================= */}

      {showModal && ebookTerpilih && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 px-4 py-6 backdrop-blur-sm">

          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">

            {/* HEADER POPUP */}
            <div className="border-b border-slate-100 px-6 py-5 sm:px-7">

              <div className="flex items-start justify-between gap-4">

                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-[#2563EB]">
                    Pembayaran Ebook
                  </p>

                  <h2 className="mt-1 text-xl font-extrabold text-slate-900">
                    {ebookTerpilih.judul}
                  </h2>
                </div>

                <button
                  onClick={tutupModal}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
                >
                  ×
                </button>

              </div>

            </div>

            <div className="p-6 sm:p-7">

              {/* TOTAL */}
              <div className="rounded-2xl bg-[#EFF6FF] p-4">

                <p className="text-xs font-bold text-[#2563EB]">
                  Total Pembayaran
                </p>

                <p className="mt-1 text-2xl font-black text-slate-900">
                  Rp
                  {Number(ebookTerpilih.harga).toLocaleString('id-ID')}
                </p>

              </div>

              {/* PILIH METODE */}
              {!metodeTerpilih && (
                <>
                  <div className="mt-6">

                    <h3 className="text-sm font-extrabold text-slate-900">
                      Pilih Metode Pembayaran
                    </h3>

                    <p className="mt-1 text-xs font-medium text-slate-500">
                      Pilih salah satu metode pembayaran berikut.
                    </p>

                  </div>

                  <div className="mt-4 space-y-3">

                    {METODE_BAYAR.map((metode) => (
                      <button
                        key={metode.id}
                        onClick={() => pilihMetode(metode.id)}
                        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-[#93C5FD] hover:bg-[#F8FBFF]"
                      >

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EFF6FF] text-xs font-black text-[#2563EB]">
                            {metode.id === 'qris'
                              ? 'QR'
                              : metode.nama.slice(0, 2)}
                          </div>

                          <div>

                            <p className="text-sm font-extrabold text-slate-800">
                              {metode.nama}
                            </p>

                            <p className="mt-0.5 text-xs font-medium text-slate-500">
                              {metode.id === 'qris'
                                ? 'Pembayaran melalui QRIS'
                                : 'Transfer / pembayaran langsung'}
                            </p>

                          </div>

                        </div>

                        <span className="text-lg font-bold text-slate-400">
                          →
                        </span>

                      </button>
                    ))}

                  </div>
                </>
              )}

              {/* DETAIL PEMBAYARAN */}
              {metodeTerpilih && (
                <div className="mt-6">

                  <button
                    onClick={() => setMetodeTerpilih(null)}
                    className="mb-4 text-xs font-bold text-[#2563EB] hover:underline"
                  >
                    ← Ganti metode pembayaran
                  </button>

                  <div className="rounded-2xl border border-[#BFDBFE] bg-[#F8FBFF] p-5">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DBEAFE] text-xs font-black text-[#2563EB]">
                        {getMetode()?.id === 'qris'
                          ? 'QR'
                          : getMetode()?.nama.slice(0, 2)}
                      </div>

                      <div>

                        <p className="text-xs font-bold text-slate-400">
                          Bayar menggunakan
                        </p>

                        <p className="text-base font-extrabold text-slate-900">
                          {getMetode()?.nama}
                        </p>

                      </div>

                    </div>

                    {/* QRIS */}
                    {metodeTerpilih === 'qris' ? (

                      <div className="mt-5 text-center">

                        {ebookTerpilih.qris_gambar ? (
                          <img
                            src={ebookTerpilih.qris_gambar}
                            alt="QRIS Pembayaran"
                            className="mx-auto h-64 w-64 rounded-xl border border-slate-200 bg-white object-contain p-3"
                          />
                        ) : (
                          <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white">

                            <div className="px-6 text-center">

                              <p className="text-sm font-extrabold text-slate-700">
                                QRIS Belum Tersedia
                              </p>

                              <p className="mt-2 text-xs font-medium leading-5 text-slate-400">
                                QRIS belum tersedia untuk pembayaran
                                ebook ini.
                              </p>

                            </div>

                          </div>
                        )}

                        <p className="mt-4 text-xs font-medium text-slate-500">
                          Scan QRIS di atas menggunakan aplikasi
                          pembayaran yang mendukung QRIS.
                        </p>

                      </div>

                    ) : (

                      /* TRANSFER */
                      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">

                        <p className="text-xs font-bold text-slate-400">
                          Nomor Pembayaran
                        </p>

                        <p className="mt-2 text-base font-extrabold leading-6 text-slate-900">
                          {getMetode()?.nomor}
                        </p>

                      </div>

                    )}

                  </div>

                  {/* PERINGATAN */}
                  <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">

                    <p className="text-sm font-extrabold text-amber-800">
                      Sudah melakukan pembayaran?
                    </p>

                    <p className="mt-1 text-xs font-medium leading-5 text-amber-700">
                      Klik tombol di bawah untuk mengirim konfirmasi
                      pembayaran kepada admin.
                    </p>

                  </div>

                  {/* KONFIRMASI */}
                  <button
                    onClick={konfirmasiPembayaran}
                    disabled={memproses}
                    className="mt-4 w-full rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {memproses
                      ? 'Mengirim Konfirmasi...'
                      : 'Konfirmasi Pembayaran'}
                  </button>

                  <p className="mt-3 text-center text-[11px] font-medium leading-5 text-slate-400">
                    Setelah konfirmasi, pembayaran akan diperiksa oleh
                    admin.
                  </p>

                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  )
}