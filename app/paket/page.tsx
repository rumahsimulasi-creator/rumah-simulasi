'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../utils/supabase'

const METODE_BAYAR = [
  {
    id: 'bni',
    nama: 'BNI',
    nomor: '2008792833 A.N M.IQBAL',
  },
  {
    id: 'qris',
    nama: 'QRIS',
    nomor: 'Scan QRIS untuk melakukan pembayaran',
  },
  {
    id: 'seabank',
    nama: 'SeaBank',
    nomor: '901658813886 a.n. M. IQBAL',
  },
  {
    id: 'gopay',
    nama: 'GoPay',
    nomor: '085179821611 a.n. M.IQBAL',
  },
  {
    id: 'dana',
    nama: 'Dana',
    nomor: '085179821611 a.n. M.Iqbal',
  },
]

const NOMOR_WA_ADMIN = '62895403173470'

export default function PaketPage() {
  const [paketList, setPaketList] = useState<any[]>([])
  const [pembelianList, setPembelianList] = useState<any[]>([])

  const [bundlingList, setBundlingList] = useState<any[]>([])
  const [pembelianBundlingList, setPembelianBundlingList] = useState<any[]>([])

  const [showModal, setShowModal] = useState(false)
  const [tipeAktif, setTipeAktif] = useState<'paket' | 'bundling'>('paket')
  const [paketTerpilih, setPaketTerpilih] = useState<any>(null)
  const [bundlingTerpilih, setBundlingTerpilih] = useState<any>(null)
  const [metodeTerpilih, setMetodeTerpilih] = useState<string | null>(null)
  const [memproses, setMemproses] = useState(false)

  const [showPendaftaranModal, setShowPendaftaranModal] = useState(false)
  const [paketPendaftaran, setPaketPendaftaran] = useState<any>(null)

  const router = useRouter()

  // =========================
  // FETCH DATA
  // =========================

  const fetchData = async () => {
    const { data: paketData } = await supabase
      .from('paket')
      .select('*')

    if (paketData) {
      setPaketList(paketData)
    }

    const { data: bundlingData } = await supabase
      .from('paket_bundling')
      .select('*')

    if (bundlingData) {
      const bundlingDenganIsi = await Promise.all(
        bundlingData.map(async (b) => {
          const { data: isiData } = await supabase
            .from('bundling_isi')
            .select('paket_id, paket(nama)')
            .eq('bundling_id', b.id)

          return {
            ...b,
            isi: isiData || [],
          }
        })
      )

      setBundlingList(bundlingDenganIsi)
    }

    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id

    if (userId) {
      const { data: pembelianData } = await supabase
        .from('pembelian')
        .select('*')
        .eq('user_id', userId)

      if (pembelianData) {
        setPembelianList(pembelianData)
      }

      const { data: pembelianBundlingData } = await supabase
        .from('pembelian_bundling')
        .select('*')
        .eq('user_id', userId)

      if (pembelianBundlingData) {
        setPembelianBundlingList(pembelianBundlingData)
      }
    } else {
      setPembelianList([])
      setPembelianBundlingList([])
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // =========================
  // GET PEMBELIAN
  // =========================

  const getPembelian = (paketId: string) => {
    return pembelianList.find(
      (p) => p.paket_id === paketId
    )
  }

  const getPembelianBundling = (bundlingId: string) => {
    return pembelianBundlingList.find(
      (p) => p.bundling_id === bundlingId
    )
  }

  // =========================
  // STATUS PAKET
  // =========================

  const getStatus = (paket: any) => {
    const gratis = Number(paket.harga) === 0
    const pembelian = getPembelian(paket.id)

    if (gratis && paket.butuh_pendaftaran) {
      return pembelian
        ? pembelian.status
        : 'belum_daftar'
    }

    return gratis
      ? 'gratis'
      : pembelian
        ? pembelian.status
        : 'belum_beli'
  }

  // =========================
  // STATUS BUNDLING
  // =========================

  const getStatusBundling = (bundling: any) => {
    const pembelian = getPembelianBundling(bundling.id)

    return pembelian
      ? pembelian.status
      : 'belum_beli'
  }

  // =========================
  // BUKA PEMBAYARAN PAKET
  // =========================

  const bukaPembayaran = async (paket: any) => {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id

    if (!userId) {
      alert('Silakan login terlebih dahulu.')
      router.push('/login')
      return
    }

    setTipeAktif('paket')
    setPaketTerpilih(paket)
    setBundlingTerpilih(null)
    setMetodeTerpilih(null)
    setShowModal(true)
  }

  // =========================
  // BUKA PEMBAYARAN BUNDLING
  // =========================

  const bukaPembayaranBundling = async (bundling: any) => {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id

    if (!userId) {
      alert('Silakan login terlebih dahulu.')
      router.push('/login')
      return
    }

    setTipeAktif('bundling')
    setBundlingTerpilih(bundling)
    setPaketTerpilih(null)
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
    if (!metodeTerpilih) {
      alert('Silakan pilih metode pembayaran terlebih dahulu.')
      return
    }

    setMemproses(true)

    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id

    if (!userId) {
      setMemproses(false)
      alert('Silakan login terlebih dahulu.')
      router.push('/login')
      return
    }

    // =========================
    // PAKET BIASA
    // =========================

    if (tipeAktif === 'paket') {
      if (!paketTerpilih) {
        setMemproses(false)
        return
      }

      const pembelian = getPembelian(paketTerpilih.id)

      // Jika belum ada transaksi, baru buat setelah
      // user menekan konfirmasi pembayaran
      if (!pembelian) {
        const { error } = await supabase
          .from('pembelian')
          .insert({
            user_id: userId,
            paket_id: paketTerpilih.id,
            status: 'menunggu_konfirmasi',
          })

        if (error) {
          alert(error.message)
          setMemproses(false)
          return
        }
      } else {
        const { error } = await supabase
          .from('pembelian')
          .update({
            status: 'menunggu_konfirmasi',
          })
          .eq('id', pembelian.id)

        if (error) {
          alert(error.message)
          setMemproses(false)
          return
        }
      }
    }

    // =========================
    // BUNDLING
    // =========================

    if (tipeAktif === 'bundling') {
      if (!bundlingTerpilih) {
        setMemproses(false)
        return
      }

      const pembelian = getPembelianBundling(
        bundlingTerpilih.id
      )

      // Jika belum ada transaksi, baru buat setelah
      // user menekan konfirmasi pembayaran
      if (!pembelian) {
        const { error } = await supabase
          .from('pembelian_bundling')
          .insert({
            user_id: userId,
            bundling_id: bundlingTerpilih.id,
            status: 'menunggu_konfirmasi',
          })

        if (error) {
          alert(error.message)
          setMemproses(false)
          return
        }
      } else {
        const { error } = await supabase
          .from('pembelian_bundling')
          .update({
            status: 'menunggu_konfirmasi',
          })
          .eq('id', pembelian.id)

        if (error) {
          alert(error.message)
          setMemproses(false)
          return
        }
      }
    }

    setShowModal(false)
    setPaketTerpilih(null)
    setBundlingTerpilih(null)
    setMetodeTerpilih(null)

    await fetchData()

    setMemproses(false)
  }

  // =========================
  // TUTUP POPUP
  // =========================

  const tutupModal = () => {
    // Menutup popup TIDAK mengubah status pembayaran.
    // Transaksi hanya dibuat/diubah ketika tombol
    // "Konfirmasi Pembayaran" ditekan.

    setShowModal(false)
    setPaketTerpilih(null)
    setBundlingTerpilih(null)
    setMetodeTerpilih(null)
  }

  // =========================
  // PENDAFTARAN PAKET GRATIS
  // =========================

  const bukaPendaftaran = async (paket: any) => {
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      alert('Silakan login terlebih dahulu.')
      router.push('/login')
      return
    }

    setPaketPendaftaran(paket)
    setShowPendaftaranModal(true)
  }

  const konfirmasiSyaratTerpenuhi = async () => {
    if (!paketPendaftaran) return

    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id

    if (!userId) return

    setMemproses(true)

    const { error } = await supabase
      .from('pembelian')
      .insert({
        user_id: userId,
        paket_id: paketPendaftaran.id,
        status: 'menunggu_konfirmasi',
      })

    if (error) {
      alert(error.message)
      setMemproses(false)
      return
    }

    setShowPendaftaranModal(false)
    setPaketPendaftaran(null)

    await fetchData()

    setMemproses(false)
  }

  // =========================
  // WHATSAPP ADMIN
  // =========================

  const linkWhatsappAdmin = (paket: any) => {
    const pesan =
      `Halo admin, saya sudah melakukan syarat pendaftaran untuk paket "${paket.nama}", saya mau konfirmasi.`

    return `https://wa.me/${NOMOR_WA_ADMIN}?text=${encodeURIComponent(
      pesan
    )}`
  }

  // =========================
  // MULAI UJIAN
  // =========================

  const handleMulaiUjian = async (paketId: string) => {
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      alert(
        'Anda harus login terlebih dahulu untuk mengerjakan soal.'
      )
      router.push('/login')
      return
    }

    router.push(`/ujian?paket=${paketId}`)
  }

  // =========================
  // GET METODE AKTIF
  // =========================

  const getMetode = () => {
    return METODE_BAYAR.find(
      (m) => m.id === metodeTerpilih
    )
  }

  const itemModalAktif =
    tipeAktif === 'paket'
      ? paketTerpilih
      : bundlingTerpilih

  // =========================
  // RENDER
  // =========================

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
              Paket Tryout / Simulasi
            </h1>

            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
              Pilih paket simulasi yang sesuai dengan kebutuhanmu
              dan mulai latihan untuk mempersiapkan ujian.
            </p>
          </div>

          {/* LIST PAKET + BUNDLING */}
          {paketList.length === 0 &&
          bundlingList.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <h2 className="text-lg font-extrabold text-slate-900">
                Belum Ada Paket
              </h2>

              <p className="mt-2 text-sm font-medium text-slate-500">
                Belum ada paket tryout yang tersedia saat ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

              {/* ========================= */}
              {/* KARTU BUNDLING */}
              {/* ========================= */}

              {bundlingList.map((bundling) => {
                const status =
                  getStatusBundling(bundling)

                return (
                  <div
                    key={`bundling-${bundling.id}`}
                    className="flex h-full flex-col rounded-2xl border-2 border-[#2563EB] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#2563EB] px-3 py-1 text-[11px] font-extrabold text-white">
                        BUNDLING
                      </span>
                    </div>

                    <h2 className="mt-5 text-lg font-extrabold leading-6 text-slate-900">
                      {bundling.nama}
                    </h2>

                    <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-slate-500">
                      {bundling.deskripsi}
                    </p>

                    <div className="mt-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Paket di dalamnya:
                      </p>

                      <ul className="mt-1 space-y-0.5">
                        {bundling.isi.map(
                          (item: any) => (
                            <li
                              key={item.paket_id}
                              className="text-sm text-slate-600"
                            >
                              • {item.paket?.nama}
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    <div className="mt-5">
                      <p className="text-xs font-bold text-slate-400">
                        Harga
                      </p>

                      <p className="mt-1 text-xl font-black text-[#2563EB]">
                        Rp
                        {Number(
                          bundling.harga
                        ).toLocaleString('id-ID')}
                      </p>
                    </div>

                    <div className="mt-5 border-t border-slate-100 pt-5" />

                    {status === 'lunas' ? (
                      <button
                        disabled
                        className="w-full rounded-xl bg-emerald-50 px-5 py-3.5 text-sm font-extrabold text-emerald-600"
                      >
                        Sudah Dimiliki
                      </button>
                    ) : status ===
                      'menunggu_konfirmasi' ? (
                      <button
                        disabled
                        className="w-full cursor-not-allowed rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-400"
                      >
                        Menunggu Konfirmasi
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          bukaPembayaranBundling(
                            bundling
                          )
                        }
                        disabled={memproses}
                        className="flex w-full items-center justify-between rounded-xl bg-[#2563EB] px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Beli Bundling

                        <span className="text-lg">
                          →
                        </span>
                      </button>
                    )}
                  </div>
                )
              })}

              {/* ========================= */}
              {/* KARTU PAKET BIASA */}
              {/* ========================= */}

              {paketList.map((paket) => {
                const gratis =
                  Number(paket.harga) === 0

                const status = getStatus(paket)

                return (
                  <div
                    key={paket.id}
                    className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-[11px] font-extrabold text-[#2563EB]">
                        TRY OUT
                      </span>

                      {gratis && (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-extrabold text-emerald-600">
                          GRATIS
                        </span>
                      )}

                      {paket.butuh_pendaftaran && (
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-extrabold text-amber-600">
                          PERLU DAFTAR
                        </span>
                      )}
                    </div>

                    <h2 className="mt-5 text-lg font-extrabold leading-6 text-slate-900">
                      {paket.nama}
                    </h2>

                    <p className="mt-2 line-clamp-3 text-sm font-medium leading-6 text-slate-500">
                      {paket.deskripsi}
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs">
                        ⏱
                      </span>

                      {paket.waktu_menit} menit
                    </div>

                    <div className="mt-5">
                      <p className="text-xs font-bold text-slate-400">
                        Harga
                      </p>

                      <p className="mt-1 text-xl font-black text-[#2563EB]">
                        {gratis
                          ? 'Gratis'
                          : `Rp${Number(
                              paket.harga
                            ).toLocaleString(
                              'id-ID'
                            )}`}
                      </p>
                    </div>

                    <div className="mt-5 border-t border-slate-100 pt-5" />

                    {status === 'gratis' ||
                    status === 'lunas' ? (
                      <button
                        onClick={() =>
                          handleMulaiUjian(
                            paket.id
                          )
                        }
                        className="flex w-full items-center justify-between rounded-xl bg-[#2563EB] px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#1D4ED8]"
                      >
                        Mulai Ujian

                        <span className="text-lg">
                          →
                        </span>
                      </button>
                    ) : status ===
                      'menunggu_konfirmasi' ? (
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
                          href={linkWhatsappAdmin(
                            paket
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-extrabold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          Hubungi Admin
                        </a>
                      </div>
                    ) : status ===
                      'belum_daftar' ? (
                      <button
                        onClick={() =>
                          bukaPendaftaran(paket)
                        }
                        className="flex w-full items-center justify-between rounded-xl bg-amber-500 px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-amber-600"
                      >
                        Daftar

                        <span className="text-lg">
                          →
                        </span>
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          bukaPembayaran(paket)
                        }
                        disabled={memproses}
                        className="flex w-full items-center justify-between rounded-xl bg-[#2563EB] px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {memproses
                          ? 'Memproses...'
                          : 'Beli Paket'}

                        <span className="text-lg">
                          →
                        </span>
                      </button>
                    )}
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

      {showModal && itemModalAktif && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 px-4 py-6 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">

            {/* HEADER */}
            <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
              <div className="flex items-start justify-between gap-4">

                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-[#2563EB]">
                    {tipeAktif === 'bundling'
                      ? 'Pembayaran Bundling'
                      : 'Pembayaran Paket'}
                  </p>

                  <h2 className="mt-1 text-xl font-extrabold text-slate-900">
                    {itemModalAktif.nama}
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
                  {Number(
                    itemModalAktif.harga
                  ).toLocaleString('id-ID')}
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
                    {METODE_BAYAR.map(
                      (metode) => (
                        <button
                          key={metode.id}
                          onClick={() =>
                            pilihMetode(
                              metode.id
                            )
                          }
                          className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-[#93C5FD] hover:bg-[#F8FBFF]"
                        >
                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EFF6FF] text-xs font-black text-[#2563EB]">
                              {metode.id ===
                              'qris'
                                ? 'QR'
                                : metode.nama.slice(
                                    0,
                                    2
                                  )}
                            </div>

                            <div>
                              <p className="text-sm font-extrabold text-slate-800">
                                {metode.nama}
                              </p>

                              <p className="mt-0.5 text-xs font-medium text-slate-500">
                                {metode.id ===
                                'qris'
                                  ? 'Pembayaran melalui QRIS'
                                  : 'Transfer / pembayaran langsung'}
                              </p>
                            </div>
                          </div>

                          <span className="text-lg font-bold text-slate-400">
                            →
                          </span>
                        </button>
                      )
                    )}
                  </div>
                </>
              )}

              {/* DETAIL PEMBAYARAN */}
              {metodeTerpilih && (
                <div className="mt-6">

                  <button
                    onClick={() =>
                      setMetodeTerpilih(null)
                    }
                    className="mb-4 text-xs font-bold text-[#2563EB] hover:underline"
                  >
                    ← Ganti metode pembayaran
                  </button>

                  <div className="rounded-2xl border border-[#BFDBFE] bg-[#F8FBFF] p-5">

                    {/* METODE */}
                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DBEAFE] text-xs font-black text-[#2563EB]">
                        {getMetode()?.id ===
                        'qris'
                          ? 'QR'
                          : getMetode()?.nama.slice(
                              0,
                              2
                            )}
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
                    {metodeTerpilih ===
                    'qris' ? (
                      <div className="mt-5 text-center">

                        <img
                          src="/Qris.jpg"
                          alt="QRIS Pembayaran"
                          className="mx-auto h-64 w-64 rounded-xl border border-slate-200 bg-white object-contain p-3"
                        />

                        <p className="mt-4 text-xs font-medium leading-5 text-slate-500">
                          Scan QRIS di atas menggunakan aplikasi pembayaran yang mendukung QRIS.
                        </p>
                      </div>
                    ) : (
                      /* TRANSFER / E-WALLET */
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
                      Klik tombol di bawah untuk mengirim konfirmasi pembayaran kepada admin.
                    </p>
                  </div>

                  {/* KONFIRMASI */}
                  <button
                    onClick={
                      konfirmasiPembayaran
                    }
                    disabled={memproses}
                    className="mt-4 w-full rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {memproses
                      ? 'Mengirim Konfirmasi...'
                      : 'Konfirmasi Pembayaran'}
                  </button>

                  <p className="mt-3 text-center text-[11px] font-medium leading-5 text-slate-400">
                    Setelah konfirmasi, pembayaran akan diperiksa oleh admin.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* POPUP PENDAFTARAN */}
      {/* ================================================= */}

      {showPendaftaranModal &&
        paketPendaftaran && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 px-4 py-6 backdrop-blur-sm">

            <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">

              <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
                <div className="flex items-start justify-between gap-4">

                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-amber-600">
                      Syarat Pendaftaran
                    </p>

                    <h2 className="mt-1 text-xl font-extrabold text-slate-900">
                      {paketPendaftaran.nama}
                    </h2>
                  </div>

                  <button
                    onClick={() => {
                      setShowPendaftaranModal(
                        false
                      )
                      setPaketPendaftaran(null)
                    }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6 sm:p-7">

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <p className="text-sm font-extrabold text-amber-800">
                    Syarat yang harus dipenuhi:
                  </p>

                  <p className="mt-2 whitespace-pre-line text-sm font-medium leading-6 text-amber-700">
                    {paketPendaftaran.syarat_pendaftaran ||
                      'Tidak ada syarat khusus.'}
                  </p>
                </div>

                <button
                  onClick={
                    konfirmasiSyaratTerpenuhi
                  }
                  disabled={memproses}
                  className="mt-5 w-full rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {memproses
                    ? 'Mengirim...'
                    : 'Saya Sudah Memenuhi Syarat'}
                </button>

                <p className="mt-3 text-center text-[11px] font-medium leading-5 text-slate-400">
                  Setelah ini, pendaftaran kamu akan diperiksa oleh admin.
                </p>
              </div>
            </div>
          </div>
        )}
    </>
  )
}