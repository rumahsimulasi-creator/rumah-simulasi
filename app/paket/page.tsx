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

const NOMOR_WA_ADMIN = '6285179821611'

export default function PaketPage() {
  const [paketList, setPaketList] = useState<any[]>([])
  const [pembelianList, setPembelianList] = useState<any[]>([])
  const [bundlingList, setBundlingList] = useState<any[]>([])
  const [pembelianBundlingList, setPembelianBundlingList] = useState<any[]>([])

  const [showModal, setShowModal] = useState(false)
  const [tipeAktif, setTipeAktif] = useState<'paket' | 'bundling'>('paket')

  const [paketTerpilih, setPaketTerpilih] = useState<any>(null)
  const [bundlingTerpilih, setBundlingTerpilih] = useState<any>(null)

  const [metodeTerpilih, setMetodeTerpilih] = useState<string>('')

  const [namaPembeli, setNamaPembeli] = useState('')
  const [emailPembeli, setEmailPembeli] = useState('')
  const [noHpPembeli, setNoHpPembeli] = useState('')

  const [memproses, setMemproses] = useState(false)

  const router = useRouter()

  // =========================
  // FETCH DATA
  // =========================

  const fetchData = async () => {
    const { data: paketData } = await supabase
      .from('paket')
      .select('*')
      .order('created_at', { ascending: true })

    if (paketData) {
      setPaketList(paketData)
    }

    const { data: bundlingData } = await supabase
      .from('paket_bundling')
      .select('*')
      .order('created_at', { ascending: true })

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
  // BUKA MODAL PAKET
  // TANPA LOGIN
  // =========================

  const bukaPembayaran = async (paket: any) => {
    setTipeAktif('paket')
    setPaketTerpilih(paket)
    setBundlingTerpilih(null)

    setMetodeTerpilih('')
    setNoHpPembeli('')

    const { data: userData } = await supabase.auth.getUser()

    if (userData.user) {
      setNamaPembeli(
        userData.user.user_metadata?.nama ||
          userData.user.user_metadata?.name ||
          ''
      )

      setEmailPembeli(
        userData.user.email || ''
      )
    } else {
      setNamaPembeli('')
      setEmailPembeli('')
    }

    setShowModal(true)
  }

  // =========================
  // BUKA MODAL BUNDLING
  // TANPA LOGIN
  // =========================

  const bukaPembayaranBundling = async (bundling: any) => {
    setTipeAktif('bundling')
    setBundlingTerpilih(bundling)
    setPaketTerpilih(null)

    setMetodeTerpilih('')
    setNoHpPembeli('')

    const { data: userData } = await supabase.auth.getUser()

    if (userData.user) {
      setNamaPembeli(
        userData.user.user_metadata?.nama ||
          userData.user.user_metadata?.name ||
          ''
      )

      setEmailPembeli(
        userData.user.email || ''
      )
    } else {
      setNamaPembeli('')
      setEmailPembeli('')
    }

    setShowModal(true)
  }

  // =========================
  // PESAN
  // LANGSUNG KE WHATSAPP
  // =========================

  const kirimPesanWhatsApp = () => {
    if (!noHpPembeli.trim()) {
      alert('Silakan isi No HP terlebih dahulu.')
      return
    }

    if (!namaPembeli.trim()) {
      alert('Silakan isi Nama terlebih dahulu.')
      return
    }

    if (!emailPembeli.trim()) {
      alert('Silakan isi Email terlebih dahulu.')
      return
    }

    if (!metodeTerpilih) {
      alert('Silakan pilih metode pembayaran terlebih dahulu.')
      return
    }

    const item =
      tipeAktif === 'paket'
        ? paketTerpilih
        : bundlingTerpilih

    if (!item) return

    const metode = METODE_BAYAR.find(
      (m) => m.id === metodeTerpilih
    )

    const jenis =
      tipeAktif === 'paket'
        ? 'Paket'
        : 'Bundling'

    const pesan = `Halo admin, saya ingin membeli ${jenis}.

Nama: ${namaPembeli}
No HP: ${noHpPembeli}
Email: ${emailPembeli}

${jenis}: ${item.nama}
Harga: Rp${Number(item.harga).toLocaleString('id-ID')}
Metode Pembayaran: ${metode?.nama || '-'}

Mohon diarahkan untuk proses pembelian selanjutnya. Terima kasih.`

    const linkWhatsapp =
      `https://wa.me/${NOMOR_WA_ADMIN}?text=${encodeURIComponent(
        pesan
      )}`

    setMemproses(true)

    window.open(
      linkWhatsapp,
      '_blank',
      'noopener,noreferrer'
    )

    setMemproses(false)
    setShowModal(false)
  }

  // =========================
  // TUTUP MODAL
  // =========================

  const tutupModal = () => {
    setShowModal(false)
    setPaketTerpilih(null)
    setBundlingTerpilih(null)
    setMetodeTerpilih('')
    setNamaPembeli('')
    setEmailPembeli('')
    setNoHpPembeli('')
  }

  // =========================
  // DAFTAR PAKET GRATIS
  // LANGSUNG WHATSAPP
  // =========================

  const bukaPendaftaran = (paket: any) => {
    const pesan = `Halo admin, saya ingin mendaftar paket gratis.

Nama Paket: ${paket.nama}

Saya ingin mendapatkan informasi mengenai syarat dan proses pendaftaran paket tersebut. Mohon diarahkan untuk proses selanjutnya. Terima kasih.`

    const linkWhatsapp =
      `https://wa.me/${NOMOR_WA_ADMIN}?text=${encodeURIComponent(
        pesan
      )}`

    window.open(
      linkWhatsapp,
      '_blank',
      'noopener,noreferrer'
    )
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
  // TETAP WAJIB LOGIN
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
  // ITEM AKTIF
  // =========================

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

              {/* BUNDLING */}

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
                        className="flex w-full items-center justify-between rounded-xl bg-[#2563EB] px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#1D4ED8]"
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

              {/* PAKET */}

              {paketList.map((paket) => {
                const gratis =
                  Number(paket.harga) === 0

                const status =
                  getStatus(paket)

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
                          className="flex w-full items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-extrabold text-emerald-700 transition hover:bg-emerald-100"
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
                        className="flex w-full items-center justify-between rounded-xl bg-[#2563EB] px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#1D4ED8]"
                      >
                        Beli Paket

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

      {/* MODAL PEMBELIAN */}

      {showModal && itemModalAktif && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 px-4 py-6 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">

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

              {/* DATA PEMBELI */}

              <div className="mt-6 space-y-4">

                <div>
                  <label className="mb-1.5 block text-xs font-extrabold text-slate-700">
                    No HP
                  </label>

                  <input
                    type="tel"
                    value={noHpPembeli}
                    onChange={(e) =>
                      setNoHpPembeli(
                        e.target.value
                      )
                    }
                    placeholder="Masukkan nomor HP"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-extrabold text-slate-700">
                    Nama
                  </label>

                  <input
                    type="text"
                    value={namaPembeli}
                    onChange={(e) =>
                      setNamaPembeli(
                        e.target.value
                      )
                    }
                    placeholder="Masukkan nama"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-extrabold text-slate-700">
                    Email
                  </label>

                  <input
                    type="email"
                    value={emailPembeli}
                    onChange={(e) =>
                      setEmailPembeli(
                        e.target.value
                      )
                    }
                    placeholder="Masukkan email"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
                  />
                </div>

                {/* METODE PEMBAYARAN DROPDOWN */}

                <div>
                  <label className="mb-1.5 block text-xs font-extrabold text-slate-700">
                    Metode Pembayaran
                  </label>

                  <select
                    value={metodeTerpilih}
                    onChange={(e) =>
                      setMetodeTerpilih(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
                  >
                    <option value="">
                      Pilih metode pembayaran
                    </option>

                    {METODE_BAYAR.map(
                      (metode) => (
                        <option
                          key={metode.id}
                          value={metode.id}
                        >
                          {metode.nama}
                        </option>
                      )
                    )}
                  </select>
                </div>

              </div>

              {/* INFO PEMBAYARAN */}
              {metodeTerpilih && (
                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold text-slate-400">
                    Detail Pembayaran
                  </p>

                  <p className="mt-2 text-sm font-extrabold text-slate-900">
                    {METODE_BAYAR.find(
                      (m) =>
                        m.id ===
                        metodeTerpilih
                    )?.nomor}
                  </p>
                </div>
              )}

              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-extrabold text-amber-800">
                  Sudah melakukan pembayaran?
                </p>

                <p className="mt-1 text-xs font-medium leading-5 text-amber-700">
                  Klik tombol di bawah untuk mengirim konfirmasi pembayaran kepada admin.
                </p>
              </div>

              {/* TOMBOL PESAN */}

              <button
                onClick={kirimPesanWhatsApp}
                disabled={memproses}
                className="mt-4 w-full rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Pesan
              </button>

              <p className="mt-3 text-center text-[11px] font-medium leading-5 text-slate-400">
                Setelah konfirmasi, pembayaran akan diperiksa oleh admin.
              </p>

            </div>
          </div>
        </div>
      )}
    </>
  )
}