'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../utils/supabase'

const METODE_BAYAR = [
  {
    nama: 'BNI',
    nomor: '1234567890 a.n. Rumah Simulasi',
  },
  {
    nama: 'QRIS',
    nomor: 'Scan QR di kasir (dummy)',
  },
  {
    nama: 'GoPay',
    nomor: '081234567890 a.n. Rumah Simulasi',
  },
  {
    nama: 'ShopeePay',
    nomor: '081234567890 a.n. Rumah Simulasi',
  },
]

const NOMOR_WA_ADMIN = '62895403173470'

export default function DashboardPage() {
  const [paketList, setPaketList] = useState<any[]>([])
  const [ebookList, setEbookList] = useState<any[]>([])
  const [pembelianList, setPembelianList] = useState<any[]>([])
  const [pembelianEbookList, setPembelianEbookList] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  const [pembayaranAktif, setPembayaranAktif] = useState<any>(null)
  const [metodeDipilih, setMetodeDipilih] = useState<any>(null)
  const [jenisPembayaran, setJenisPembayaran] = useState<'paket' | 'ebook'>('paket')

  const [showPendaftaranModal, setShowPendaftaranModal] = useState(false)
  const [paketPendaftaran, setPaketPendaftaran] = useState<any>(null)

  const router = useRouter()

  const fetchData = async () => {
    const { data: paketData } = await supabase
      .from('paket')
      .select('*')

    if (paketData) {
      setPaketList(paketData)
    }

    const { data: ebookData } = await supabase
      .from('ebook')
      .select('*')

    if (ebookData) {
      setEbookList(ebookData)
    }

    const { data: userData } = await supabase.auth.getUser()

    const uid = userData.user?.id ?? null

    setUserId(uid)

    if (uid) {
      const { data: pembelianData } = await supabase
        .from('pembelian')
        .select('*')
        .eq('user_id', uid)

      if (pembelianData) {
        setPembelianList(pembelianData)
      }

      const { data: pembelianEbookData } = await supabase
        .from('pembelian_ebook')
        .select('*')
        .eq('user_id', uid)

      if (pembelianEbookData) {
        setPembelianEbookList(pembelianEbookData)
      }
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleBeli = async (paketId: string) => {
    const { data: userData } = await supabase.auth.getUser()

    const uid = userData.user?.id

    if (!uid) {
      alert('Silakan login dulu.')
      router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('pembelian')
      .insert({
        user_id: uid,
        paket_id: paketId,
        status: 'belum_bayar',
      })
      .select()
      .single()

    if (error) {
      alert(error.message)
      return
    }

    setJenisPembayaran('paket')
    setPembayaranAktif(data)
    setMetodeDipilih(null)

    fetchData()
  }

  const handleBeliEbook = async (ebookId: string) => {
    const { data: userData } = await supabase.auth.getUser()

    const uid = userData.user?.id

    if (!uid) {
      alert('Silakan login dulu.')
      router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('pembelian_ebook')
      .insert({
        user_id: uid,
        ebook_id: ebookId,
        status: 'belum_bayar',
      })
      .select()
      .single()

    if (error) {
      alert(error.message)
      return
    }

    setJenisPembayaran('ebook')
    setPembayaranAktif(data)
    setMetodeDipilih(null)

    fetchData()
  }

  const handleSudahBayar = async (pembelianId: string) => {
    const table =
      jenisPembayaran === 'ebook'
        ? 'pembelian_ebook'
        : 'pembelian'

    const { error } = await supabase
      .from(table)
      .update({
        status: 'menunggu_konfirmasi',
      })
      .eq('id', pembelianId)

    if (error) {
      alert(error.message)
      return
    }

    setPembayaranAktif(null)
    setMetodeDipilih(null)

    fetchData()
  }

  const getPembelian = (paketId: string) => {
    return pembelianList.find(
      (p) => p.paket_id === paketId
    )
  }

  const getPembelianEbook = (ebookId: string) => {
    return pembelianEbookList.find(
      (p) => p.ebook_id === ebookId
    )
  }

  const handleCobaGratis = () => {
    if (userId) {
      document
        .getElementById('daftar-paket')
        ?.scrollIntoView({
          behavior: 'smooth',
        })
    } else {
      router.push('/register')
    }
  }

  const handleMulaiUjian = async (paketId: string) => {
    const { data: userData } =
      await supabase.auth.getUser()

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
  // ALUR PENDAFTARAN (paket gratis + butuh_pendaftaran)
  // =========================

  const bukaPendaftaran = async (paket: any) => {
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      alert('Silakan login dulu.')
      router.push('/login')
      return
    }

    setPaketPendaftaran(paket)
    setShowPendaftaranModal(true)
  }

  const konfirmasiSyaratTerpenuhi = async () => {
    if (!paketPendaftaran) return

    const { data: userData } = await supabase.auth.getUser()
    const uid = userData.user?.id
    if (!uid) return

    const { error } = await supabase.from('pembelian').insert({
      user_id: uid,
      paket_id: paketPendaftaran.id,
      status: 'menunggu_konfirmasi',
    })

    if (error) {
      alert(error.message)
      return
    }

    setShowPendaftaranModal(false)
    setPaketPendaftaran(null)
    fetchData()
  }

  const linkWhatsappAdmin = (paket: any) => {
    const pesan = `Halo admin, saya sudah melakukan syarat pendaftaran untuk paket "${paket.nama}", saya mau konfirmasi.`
    return `https://wa.me/${NOMOR_WA_ADMIN}?text=${encodeURIComponent(pesan)}`
  }

  return (
    <div className="overflow-hidden bg-white">

      {/* ========================================================= */}
      {/* HERO */}
      {/* ========================================================= */}

      <section className="relative overflow-hidden bg-[#EFF7FF]">

        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#BFDBFE]/50 blur-3xl" />

        <div className="absolute -right-32 top-20 h-[500px] w-[500px] rounded-full bg-[#DBEAFE]/70 blur-3xl" />

        <div className="absolute bottom-0 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-white/70 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 py-20 sm:py-28 lg:grid-cols-2 lg:px-8">

          <div className="animate-[fadeUp_.7s_ease-out]">

            <span className="inline-flex items-center gap-2 rounded-full border border-[#BFDBFE] bg-white/80 px-4 py-2 text-xs font-bold text-[#2563EB] shadow-sm backdrop-blur">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#3B9EF0]" />
              Platform Simulasi & Belajar
            </span>

            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">

              Simulasikan Tesmu,

              <span className="block text-[#3B9EF0]">
                Raih Cita-Citamu
              </span>

            </h1>

            <p className="mt-7 max-w-xl text-base font-medium leading-8 text-slate-600 sm:text-lg">
              Sukses ujian seleksi dari simulasi terbaik di sini.
              Rumah Simulasi adalah platform simulasi ujian
              berbasis web CAT yang menghadirkan latihan,
              tryout, bank soal, pembahasan, hingga ebook
              pembelajaran dalam satu tempat.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">

              <button
                onClick={handleCobaGratis}
                className="rounded-xl bg-[#2563EB] px-7 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-200 transition duration-300 hover:-translate-y-1 hover:bg-[#1D4ED8] hover:shadow-xl"
              >
                Coba Gratis Sekarang
              </button>

              <a
                href="#daftar-paket"
                className="rounded-xl border border-[#BFDBFE] bg-white px-7 py-3.5 text-sm font-extrabold text-slate-700 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#60A5FA] hover:text-[#2563EB]"
              >
                Lihat Semua Paket
              </a>

            </div>

            <div className="mt-12 grid max-w-xl grid-cols-2 gap-4 sm:flex sm:gap-0">

              <div className="sm:pr-10">

                <p className="text-3xl font-black text-[#2563EB]">
                  50+
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Paket Tryout/Simulasi
                </p>

              </div>

              <div className="border-l border-[#BFDBFE] pl-6 sm:pl-10">

                <p className="text-3xl font-black text-[#2563EB]">
                  2024
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Mulai berkembang
                </p>

              </div>

            </div>

          </div>

          <div className="relative flex justify-center lg:justify-end">

            <div className="absolute h-72 w-72 animate-pulse rounded-full bg-white/80 blur-2xl sm:h-96 sm:w-96" />

            <div className="relative rounded-[2rem] border border-white/80 bg-white/70 p-8 shadow-2xl shadow-blue-200/50 backdrop-blur transition duration-500 hover:-translate-y-3">

              <img
                src="/logo.png"
                alt="Rumah Simulasi"
                className="relative mx-auto w-full max-w-sm drop-shadow-xl"
              />

              <div className="absolute -left-5 top-14 rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-xl transition duration-300 hover:-translate-y-2">

                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Latihan
                </p>

                <p className="mt-1 text-sm font-black text-slate-800">
                  Terarah
                </p>

              </div>

              <div className="absolute -right-5 bottom-14 rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-xl transition duration-300 hover:-translate-y-2">

                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Hasil
                </p>

                <p className="mt-1 text-sm font-black text-[#2563EB]">
                  Terukur
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ========================================================= */}
      {/* PAKET */}
      {/* ========================================================= */}

      <section
        id="daftar-paket"
        className="relative bg-white py-20 sm:py-24"
      >

        <div className="absolute left-0 top-0 h-32 w-full bg-gradient-to-b from-[#EFF7FF] to-transparent" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">

          <div className="mx-auto mb-14 max-w-3xl text-center">

            <span className="inline-block rounded-full border border-[#BFDBFE] bg-[#EFF7FF] px-4 py-1.5 text-xs font-bold text-[#2563EB]">
              Persiapkan Dirimu
            </span>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Simulasi Terbaru
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-base">
              Simulasi terbaru Rumah Simulasi siap kamu ikuti
              untuk menguji kesiapanmu sebelum menghadapi
              ujian sebenarnya.
            </p>

          </div>


          {paketList.length === 0 ? (

            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-20 text-center">

              <p className="font-medium text-slate-400">
                Belum ada paket.
              </p>

            </div>

          ) : (

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

              {paketList.map((paket) => {

                const gratis =
                  Number(paket.harga) === 0

                const pembelian =
                  getPembelian(paket.id)

                const status =
                  gratis
                    ? (paket.butuh_pendaftaran
                        ? (pembelian ? pembelian.status : 'belum_daftar')
                        : 'gratis')
                    : pembelian
                      ? pembelian.status
                      : 'belum_beli'

                return (

                  <div
                    key={paket.id}
                    className="group relative mx-auto w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-500 hover:-translate-y-2 hover:border-[#BFDBFE] hover:shadow-2xl hover:shadow-blue-100"
                  >

                    <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-[#EFF7FF] blur-2xl transition duration-500 group-hover:scale-150" />

                    <div className="relative">

                      <div className="flex flex-wrap gap-2">

                        <span className="rounded-full bg-[#EFF7FF] px-3 py-1 text-[10px] font-extrabold tracking-wide text-[#2563EB]">
                          TRY OUT
                        </span>

                        {gratis && (
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-extrabold tracking-wide text-emerald-600">
                            GRATIS
                          </span>
                        )}

                        {paket.butuh_pendaftaran && (
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-extrabold tracking-wide text-amber-600">
                            PERLU DAFTAR
                          </span>
                        )}

                      </div>

                      <h3 className="mt-5 text-lg font-black text-slate-900">
                        {paket.nama}
                      </h3>

                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                        {paket.deskripsi}
                      </p>

                      <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 p-3">

                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF4FE] text-sm">
                          ⏱
                        </span>

                        <div>

                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            Durasi
                          </p>

                          <p className="text-sm font-bold text-slate-700">
                            {paket.waktu_menit} menit
                          </p>

                        </div>

                      </div>

                      <div className="mt-5">

                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Harga
                        </p>

                        <p className="mt-1 text-xl font-black text-slate-900">
                          {gratis
                            ? 'Gratis'
                            : `Rp${Number(
                                paket.harga
                              ).toLocaleString('id-ID')}`}
                        </p>

                      </div>

                      <div className="my-5 border-t border-dashed border-slate-200" />

                      {status === 'gratis' ||
                      status === 'lunas' ? (

                        <button
                          onClick={() =>
                            handleMulaiUjian(
                              paket.id
                            )
                          }
                          className="flex w-full items-center justify-between rounded-xl px-1 py-2 text-sm font-extrabold text-[#2563EB] transition duration-300 hover:px-2"
                        >
                          Mulai Ujian

                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EAF4FE] transition duration-300 group-hover:translate-x-1">
                            →
                          </span>

                        </button>

                      ) : status === 'belum_daftar' ? (

                        <button
                          onClick={() => bukaPendaftaran(paket)}
                          className="flex w-full items-center justify-between rounded-xl px-1 py-2 text-sm font-extrabold text-amber-600 transition duration-300 hover:px-2"
                        >
                          Daftar

                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 transition duration-300 group-hover:translate-x-1">
                            →
                          </span>

                        </button>

                      ) : status === 'belum_bayar' ? (

                        <button
                          onClick={() => {
                            if (pembelian) {
                              setJenisPembayaran('paket')
                              setPembayaranAktif(
                                pembelian
                              )
                              setMetodeDipilih(null)
                            }
                          }}
                          className="flex w-full items-center justify-between rounded-xl px-1 py-2 text-sm font-extrabold text-[#2563EB] transition duration-300 hover:px-2"
                        >
                          Bayar Sekarang

                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EAF4FE] transition duration-300 group-hover:translate-x-1">
                            →
                          </span>

                        </button>

                      ) : status ===
                        'menunggu_konfirmasi' ? (

                        <div className="space-y-2">

                          <button
                            disabled
                            className="w-full cursor-not-allowed rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-400"
                          >
                            Menunggu Konfirmasi
                          </button>

                          <a
                            href={linkWhatsappAdmin(paket)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-extrabold text-emerald-700 transition hover:bg-emerald-100"
                          >
                            Hubungi Admin
                          </a>

                        </div>

                      ) : (

                        <button
                          onClick={() =>
                            handleBeli(
                              paket.id
                            )
                          }
                          className="flex w-full items-center justify-between rounded-xl px-1 py-2 text-sm font-extrabold text-[#2563EB] transition duration-300 hover:px-2"
                        >
                          Beli

                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EAF4FE] transition duration-300 group-hover:translate-x-1">
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


          <div className="mt-12 flex justify-center">

            <Link
              href="/paket"
              className="group flex items-center gap-3 rounded-xl bg-[#2563EB] px-7 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-100 transition duration-300 hover:-translate-y-1 hover:bg-[#1D4ED8] hover:shadow-xl"
            >
              Lihat Lebih Lengkap

              <span className="transition duration-300 group-hover:translate-x-1">
                →
              </span>

            </Link>

          </div>

        </div>

      </section>


      {/* ========================================================= */}
      {/* EBOOK */}
      {/* ========================================================= */}

      <section className="relative overflow-hidden bg-[#F5FAFF] py-20 sm:py-24">

        <div className="absolute -right-40 top-20 h-96 w-96 rounded-full bg-[#DBEAFE] blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">

          <div className="mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">

            <div>

              <span className="inline-block rounded-full border border-[#BFDBFE] bg-white px-4 py-1.5 text-xs font-bold text-[#2563EB]">
                Materi Belajar
              </span>

              <h2 className="mt-4 text-3xl font-black text-slate-900 sm:text-4xl">
                Ebook Pilihan
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                Lengkapi persiapanmu dengan ebook yang
                bisa membantu memahami materi dan
                meningkatkan kemampuanmu.
              </p>

            </div>

            <Link
              href="/ebook"
              className="group flex shrink-0 items-center gap-2 rounded-xl border border-[#BFDBFE] bg-white px-5 py-3 text-sm font-extrabold text-[#2563EB] shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#60A5FA] hover:shadow-md"
            >
              Lihat Semua Ebook
              <span className="transition group-hover:translate-x-1">
                →
              </span>
            </Link>

          </div>


          {ebookList.length === 0 ? (

            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">

              <p className="font-medium text-slate-400">
                Belum ada ebook.
              </p>

            </div>

          ) : (

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

              {ebookList.slice(0, 3).map((ebook) => {

                const pembelian =
                  getPembelianEbook(
                    ebook.id
                  )

                const status =
                  pembelian
                    ? pembelian.status
                    : 'belum_beli'

                return (

                  <div
                    key={ebook.id}
                    className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-500 hover:-translate-y-2 hover:border-[#BFDBFE] hover:shadow-2xl hover:shadow-blue-100"
                  >

                    <div className="relative flex h-64 items-center justify-center overflow-hidden bg-gradient-to-br from-[#DBEAFE] to-[#EFF6FF] p-7">

                      <div className="absolute h-40 w-40 rounded-full bg-white/70 blur-3xl" />

                      {ebook.sampul_gambar ? (

                        <img
                          src={ebook.sampul_gambar}
                          alt={ebook.judul}
                          className="relative h-52 w-36 rounded-lg object-cover shadow-2xl transition duration-500 group-hover:scale-105 group-hover:-rotate-2"
                        />

                      ) : (

                        <div className="relative flex h-52 w-36 items-center justify-center rounded-lg bg-white shadow-xl">

                          <span className="px-4 text-center text-xs font-black text-[#2563EB]">
                            {ebook.judul}
                          </span>

                        </div>

                      )}

                    </div>


                    <div className="p-6">

                      <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#2563EB]">
                        Ebook
                      </span>

                      <h3 className="mt-4 line-clamp-2 text-lg font-black text-slate-900">
                        {ebook.judul}
                      </h3>

                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                        {ebook.deskripsi}
                      </p>

                      <div className="mt-5 flex items-end justify-between gap-4">

                        <div>

                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Harga
                          </p>

                          <p className="mt-1 text-lg font-black text-slate-900">
                            Rp{Number(
                              ebook.harga
                            ).toLocaleString('id-ID')}
                          </p>

                        </div>


                        {status === 'lunas' ? (

                          <a
                            href={ebook.link_drive}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-xl bg-[#2563EB] px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#1D4ED8]"
                          >
                            Buka Ebook
                          </a>

                        ) : status ===
                          'menunggu_konfirmasi' ? (

                          <span className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-400">
                            Menunggu
                          </span>

                        ) : status ===
                          'belum_bayar' ? (

                          <button
                            onClick={() => {
                              setJenisPembayaran(
                                'ebook'
                              )

                              setPembayaranAktif(
                                pembelian
                              )

                              setMetodeDipilih(
                                null
                              )
                            }}
                            className="rounded-xl bg-[#2563EB] px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#1D4ED8]"
                          >
                            Bayar
                          </button>

                        ) : (

                          <button
                            onClick={() =>
                              handleBeliEbook(
                                ebook.id
                              )
                            }
                            className="rounded-xl bg-[#2563EB] px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#1D4ED8]"
                          >
                            Beli
                          </button>

                        )}

                      </div>

                    </div>

                  </div>

                )
              })}

            </div>

          )}


          <div className="mt-12 flex justify-center">

            <Link
              href="/ebook"
              className="group flex items-center gap-3 rounded-xl border border-[#BFDBFE] bg-white px-7 py-3.5 text-sm font-extrabold text-[#2563EB] shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#60A5FA] hover:shadow-md"
            >
              Lihat Semua Ebook

              <span className="transition group-hover:translate-x-1">
                →
              </span>

            </Link>

          </div>

        </div>

      </section>


      {/* ========================================================= */}
      {/* KEUNGGULAN */}
      {/* ========================================================= */}

      <section className="relative overflow-hidden bg-white py-20 sm:py-28">

        <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-[#EFF6FF] blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">

          <div className="mx-auto max-w-3xl text-center">

            <span className="inline-block rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-1.5 text-xs font-bold text-[#2563EB]">
              Kenapa Rumah Simulasi?
            </span>

            <h2 className="mt-5 text-3xl font-black leading-tight text-slate-900 sm:text-4xl">
              Latihan Jadi Lebih Terarah dan Terukur
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
              Semua yang kamu butuhkan untuk mempersiapkan
              ujian dikumpulkan dalam satu platform.
            </p>

          </div>


          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">

            {[
              {
                nomor: '1',
                title: 'Hasil Try Out Lengkap',
                text: 'Skor total dan rincian hasil pengerjaan membantu kamu mengetahui bagian yang masih perlu diperbaiki.',
              },
              {
                nomor: '2',
                title: 'Soal Terarah',
                text: 'Bank soal disusun berdasarkan kategori dan materi sehingga latihan menjadi lebih terstruktur.',
              },
              {
                nomor: '3',
                title: 'Simulasi CAT',
                text: 'Timer, navigasi soal, dan pengalaman pengerjaan dibuat menyerupai ujian berbasis komputer.',
              },
              {
                nomor: '4',
                title: 'Ranking Peserta',
                text: 'Bandingkan hasil try out dengan peserta lain dan lihat posisi hasilmu.',
              },
            ].map((item) => (

              <div
                key={item.nomor}
                className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition duration-500 hover:-translate-y-2 hover:border-[#BFDBFE] hover:shadow-xl hover:shadow-blue-50"
              >

                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2563EB] text-sm font-black text-white shadow-lg shadow-blue-100 transition duration-500 group-hover:rotate-6 group-hover:scale-110">
                  {item.nomor}
                </span>

                <h3 className="mt-6 text-base font-black text-slate-900">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {item.text}
                </p>

              </div>

            ))}

          </div>


          {/* MOCKUP */}

          <div className="mt-20 flex flex-wrap items-start justify-center gap-8 lg:flex-nowrap">

            <div className="w-64 flex-shrink-0 -rotate-2 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl transition duration-500 hover:z-10 hover:-translate-y-4 hover:rotate-0">

              <div className="flex items-center gap-1.5 border-b border-slate-100 px-4 py-3">

                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />

              </div>

              <div className="bg-[#2563EB] px-5 py-7 text-center">

                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-100">
                  Skor Total
                </p>

                <p className="mt-2 text-5xl font-black text-white">
                  385
                </p>

              </div>

              <div className="grid grid-cols-3 divide-x divide-slate-100">

                {[
                  ['TWK', '120'],
                  ['TIU', '145'],
                  ['TKP', '120'],
                ].map(([label, value]) => (

                  <div
                    key={label}
                    className="px-2 py-4 text-center"
                  >

                    <p className="text-[9px] font-bold text-slate-400">
                      {label}
                    </p>

                    <p className="mt-1 text-sm font-black text-slate-900">
                      {value}
                    </p>

                  </div>

                ))}

              </div>

            </div>


            <div className="w-64 flex-shrink-0 rotate-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl transition duration-500 hover:z-10 hover:-translate-y-4 hover:rotate-0 lg:mt-10">

              <div className="flex items-center gap-1.5 border-b border-slate-100 px-4 py-3">

                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />

              </div>

              <div className="space-y-3 p-5">

                <span className="inline-block rounded-full bg-[#EFF6FF] px-3 py-1 text-[10px] font-bold text-[#2563EB]">
                  Sesuai Kisi-Kisi
                </span>

                <p className="text-xs leading-6 text-slate-600">
                  Pancasila sebagai dasar negara
                  memiliki kedudukan sebagai sumber
                  dari segala sumber hukum...
                </p>

                {[
                  'A. Norma dasar',
                  'B. Ideologi terbuka',
                  'C. Dasar hukum',
                ].map((text) => (

                  <div
                    key={text}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-[11px] text-slate-500 transition hover:border-blue-200 hover:bg-blue-50"
                  >
                    {text}
                  </div>

                ))}

              </div>

            </div>


            <div className="w-64 flex-shrink-0 rotate-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl transition duration-500 hover:z-10 hover:-translate-y-4 hover:rotate-0">

              <div className="flex items-center gap-1.5 border-b border-slate-100 px-4 py-3">

                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />

              </div>

              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">

                <span className="text-[10px] font-bold text-slate-500">
                  Sisa Waktu
                </span>

                <span className="rounded-lg bg-rose-50 px-3 py-1 text-xs font-black text-rose-600">
                  28:45
                </span>

              </div>

              <div className="grid grid-cols-4 gap-2 p-5">

                {Array.from({
                  length: 16,
                }).map((_, i) => (

                  <div
                    key={i}
                    className={`flex h-7 items-center justify-center rounded-lg text-[10px] font-bold ${
                      i < 5
                        ? 'bg-[#2563EB] text-white'
                        : i === 5
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {i + 1}
                  </div>

                ))}

              </div>

            </div>


            <div className="w-64 flex-shrink-0 -rotate-2 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl transition duration-500 hover:z-10 hover:-translate-y-4 hover:rotate-0 lg:mt-10">

              <div className="flex items-center gap-1.5 border-b border-slate-100 px-4 py-3">

                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />

              </div>

              <div className="divide-y divide-slate-100">

                {[
                  ['1', 'Ahmad F.', '465'],
                  ['2', 'Siti R.', '452'],
                  ['12', 'Kamu', '385'],
                ].map(([rank, name, score], index) => (

                  <div
                    key={rank}
                    className={`flex items-center justify-between px-5 py-4 ${
                      index === 2
                        ? 'bg-[#EFF6FF]'
                        : ''
                    }`}
                  >

                    <div className="flex items-center gap-3">

                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${
                          index === 2
                            ? 'bg-[#2563EB] text-white'
                            : 'bg-[#EFF6FF] text-[#2563EB]'
                        }`}
                      >
                        {rank}
                      </span>

                      <span
                        className={`text-xs ${
                          index === 2
                            ? 'font-black text-[#2563EB]'
                            : 'text-slate-700'
                        }`}
                      >
                        {name}
                      </span>

                    </div>

                    <span
                      className={`text-xs font-black ${
                        index === 2
                          ? 'text-[#2563EB]'
                          : 'text-slate-900'
                      }`}
                    >
                      {score}
                    </span>

                  </div>

                ))}

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ========================================================= */}
      {/* SECTION TAMBAHAN */}
      {/* ========================================================= */}

      <section className="relative overflow-hidden bg-[#EFF6FF] py-20 sm:py-24">

        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-white/80 blur-3xl" />

        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-[#BFDBFE]/60 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">

          <div className="grid items-center gap-12 lg:grid-cols-2">

            <div>

              <span className="inline-block rounded-full border border-[#BFDBFE] bg-white px-4 py-1.5 text-xs font-bold text-[#2563EB]">
                Belajar Lebih Konsisten
              </span>

              <h2 className="mt-5 text-3xl font-black leading-tight text-slate-900 sm:text-4xl">
                Bukan Sekadar Mengerjakan Soal
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                Gunakan hasil latihan untuk mengetahui
                kemampuanmu, pelajari pembahasannya,
                kemudian ulangi materi yang masih belum
                dikuasai.
              </p>

              <div className="mt-8 space-y-4">

                {[
                  'Kerjakan soal dengan sistem simulasi.',
                  'Lihat hasil dan perkembangan latihan.',
                  'Pelajari pembahasan setiap soal.',
                  'Gunakan ebook sebagai materi tambahan.',
                ].map((text, index) => (

                  <div
                    key={text}
                    className="flex items-center gap-4"
                  >

                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-xs font-black text-white">
                      ✓
                    </span>

                    <p className="text-sm font-semibold text-slate-700">
                      {text}
                    </p>

                  </div>

                ))}

              </div>

            </div>


            <div className="relative">

              <div className="rounded-[2rem] border border-white bg-white p-7 shadow-2xl shadow-blue-100">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Progress Latihan
                    </p>

                    <p className="mt-1 text-2xl font-black text-slate-900">
                      78%
                    </p>

                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF6FF] text-xl">
                    📈
                  </div>

                </div>

                <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">

                  <div className="h-full w-[78%] rounded-full bg-[#2563EB]" />

                </div>

                <div className="mt-7 grid grid-cols-3 gap-3">

                  <div className="rounded-2xl bg-slate-50 p-4">

                    <p className="text-[9px] font-bold uppercase text-slate-400">
                      Latihan
                    </p>

                    <p className="mt-1 text-xl font-black text-slate-900">
                      24
                    </p>

                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">

                    <p className="text-[9px] font-bold uppercase text-slate-400">
                      Soal
                    </p>

                    <p className="mt-1 text-xl font-black text-slate-900">
                      720
                    </p>

                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">

                    <p className="text-[9px] font-bold uppercase text-slate-400">
                      Rata-rata
                    </p>

                    <p className="mt-1 text-xl font-black text-[#2563EB]">
                      82
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ========================================================= */}
      {/* CTA */}
      {/* ========================================================= */}

      <section className="relative overflow-hidden bg-[#2563EB] py-20 sm:py-24">

        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

        <div className="absolute -bottom-40 -right-20 h-[500px] w-[500px] rounded-full bg-blue-400/20 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 text-center">

          <span className="inline-block rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold text-white">
            Siap Mulai?
          </span>

          <h2 className="mt-5 text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
            Persiapkan Dirimu Mulai Hari Ini
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
            Jangan tunggu sampai hari ujian. Mulai
            latihan, ukur kemampuanmu, dan tingkatkan
            kesiapanmu bersama Rumah Simulasi.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-4">

            <button
              onClick={handleCobaGratis}
              className="rounded-xl bg-white px-7 py-3.5 text-sm font-extrabold text-[#2563EB] shadow-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              Mulai Latihan Gratis
            </button>

            <Link
              href="/ebook"
              className="rounded-xl border border-white/30 bg-white/10 px-7 py-3.5 text-sm font-extrabold text-white backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/20"
            >
              Lihat Ebook
            </Link>

          </div>

        </div>

      </section>


      {/* ========================================================= */}
      {/* FOOTER */}
      {/* ========================================================= */}

      <footer className="bg-[#0F172A] text-white">

        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">

          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">

            <div className="lg:col-span-2">

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-3"
              >

                <img
                  src="/logo.png"
                  alt="Rumah Simulasi"
                  className="h-11 w-11 rounded-xl object-contain"
                />

                <span className="text-xl font-black">
                  Rumah{' '}
                  <span className="text-[#60A5FA]">
                    Simulasi
                  </span>
                </span>

              </Link>

              <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
                Platform simulasi dan pembelajaran untuk
                membantu kamu mempersiapkan diri menghadapi
                berbagai jenis ujian seleksi.
              </p>

            </div>


            <div>

              <h3 className="text-sm font-black">
                Menu
              </h3>

              <div className="mt-5 space-y-3">

                <Link
                  href="/dashboard"
                  className="block text-sm text-slate-400 transition hover:text-white"
                >
                  Dashboard
                </Link>

                <Link
                  href="/paket"
                  className="block text-sm text-slate-400 transition hover:text-white"
                >
                  Paket Simulasi
                </Link>

                <Link
                  href="/ebook"
                  className="block text-sm text-slate-400 transition hover:text-white"
                >
                  Ebook
                </Link>

                <Link
                  href="/ranking"
                  className="block text-sm text-slate-400 transition hover:text-white"
                >
                  Ranking
                </Link>

              </div>

            </div>


            <div>

              <h3 className="text-sm font-black">
                Akun
              </h3>

              <div className="mt-5 space-y-3">

                <Link
                  href="/login"
                  className="block text-sm text-slate-400 transition hover:text-white"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  className="block text-sm text-slate-400 transition hover:text-white"
                >
                  Daftar
                </Link>

                <Link
                  href="/paket-saya"
                  className="block text-sm text-slate-400 transition hover:text-white"
                >
                  Paket Saya
                </Link>

              </div>

            </div>

          </div>


          <div className="mt-12 border-t border-slate-800 pt-7">

            <div className="flex flex-col gap-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">

              <p>
                © 2026 Rumah Simulasi. Semua hak dilindungi.
              </p>

              <p>
                Belajar. Berlatih. Siap menghadapi ujian.
              </p>

            </div>

          </div>

        </div>

      </footer>


      {/* ========================================================= */}
      {/* MODAL PEMBAYARAN */}
      {/* ========================================================= */}

      {pembayaranAktif && (

        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm"
          onClick={(e) => {

            if (e.target === e.currentTarget) {

              setPembayaranAktif(null)
              setMetodeDipilih(null)

            }

          }}
        >

          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-7">

            {!metodeDipilih ? (

              <>

                <div className="mb-6">

                  <span className="inline-block rounded-full bg-[#EFF6FF] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#2563EB]">
                    Pembayaran
                  </span>

                  <h3 className="mt-3 text-xl font-black text-slate-900">
                    Pilih Metode Pembayaran
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Pilih salah satu metode pembayaran
                    yang ingin kamu gunakan.
                  </p>

                </div>


                <div className="space-y-3">

                  {METODE_BAYAR.map((m) => (

                    <button
                      key={m.nama}
                      onClick={() =>
                        setMetodeDipilih(m)
                      }
                      className="group flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left transition duration-300 hover:-translate-y-0.5 hover:border-[#93C5FD] hover:bg-[#EFF6FF] hover:shadow-md"
                    >

                      <div>

                        <p className="text-sm font-black text-slate-800">
                          {m.nama}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Pembayaran melalui {m.nama}
                        </p>

                      </div>

                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB] transition group-hover:translate-x-1">
                        →
                      </span>

                    </button>

                  ))}

                </div>


                <button
                  onClick={() => {

                    setPembayaranAktif(null)
                    setMetodeDipilih(null)

                  }}
                  className="mt-5 w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
                >
                  Batal
                </button>

              </>

            ) : (

              <>

                <div className="mb-6">

                  <button
                    onClick={() =>
                      setMetodeDipilih(null)
                    }
                    className="mb-4 text-xs font-bold text-[#2563EB] hover:underline"
                  >
                    ← Kembali ke metode pembayaran
                  </button>

                  <span className="block rounded-full bg-[#EFF6FF] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#2563EB]">
                    {metodeDipilih.nama}
                  </span>

                  <h3 className="mt-3 text-xl font-black text-slate-900">
                    Lakukan Pembayaran
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Silakan lakukan pembayaran sesuai
                    informasi berikut.
                  </p>

                </div>


                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    {metodeDipilih.nama}
                  </p>

                  <p className="mt-3 break-words text-sm font-black leading-7 text-slate-800">
                    {metodeDipilih.nomor}
                  </p>

                </div>


                {metodeDipilih.nama === 'QRIS' && (

                  <div className="mt-5 flex justify-center rounded-2xl border border-slate-200 bg-white p-5">

                    <div className="flex h-48 w-48 items-center justify-center rounded-xl bg-slate-100">

                      <div className="grid grid-cols-7 gap-1">

                        {Array.from({
                          length: 49,
                        }).map((_, i) => (

                          <span
                            key={i}
                            className={`h-4 w-4 ${
                              (i * 7 + 3) % 5 < 2
                                ? 'bg-slate-900'
                                : 'bg-white'
                            }`}
                          />

                        ))}

                      </div>

                    </div>

                  </div>

                )}


                <button
                  onClick={() =>
                    handleSudahBayar(
                      pembayaranAktif.id
                    )
                  }
                  className="mt-5 w-full rounded-xl bg-[#2563EB] px-4 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-100 transition duration-300 hover:-translate-y-0.5 hover:bg-[#1D4ED8]"
                >
                  Saya Sudah Bayar
                </button>


                <button
                  onClick={() => {

                    setPembayaranAktif(null)
                    setMetodeDipilih(null)

                  }}
                  className="mt-2 w-full rounded-xl px-4 py-3 text-sm font-bold text-slate-500 transition hover:bg-slate-50"
                >
                  Tutup
                </button>

              </>

            )}

          </div>

        </div>

      )}


      {/* ========================================================= */}
      {/* MODAL PENDAFTARAN (paket gratis butuh_pendaftaran) */}
      {/* ========================================================= */}

      {showPendaftaranModal && paketPendaftaran && (

        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPendaftaranModal(false)
              setPaketPendaftaran(null)
            }
          }}
        >

          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-7">

            <span className="inline-block rounded-full bg-amber-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-600">
              Syarat Pendaftaran
            </span>

            <h3 className="mt-3 text-xl font-black text-slate-900">
              {paketPendaftaran.nama}
            </h3>

            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-sm font-extrabold text-amber-800">
                Syarat yang harus dipenuhi:
              </p>
              <p className="mt-2 whitespace-pre-line text-sm font-medium leading-6 text-amber-700">
                {paketPendaftaran.syarat_pendaftaran || 'Tidak ada syarat khusus.'}
              </p>
            </div>

            <button
              onClick={konfirmasiSyaratTerpenuhi}
              className="mt-5 w-full rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Saya Sudah Memenuhi Syarat
            </button>

            <button
              onClick={() => {
                setShowPendaftaranModal(false)
                setPaketPendaftaran(null)
              }}
              className="mt-2 w-full rounded-xl px-4 py-3 text-sm font-bold text-slate-500 transition hover:bg-slate-50"
            >
              Batal
            </button>

          </div>

        </div>

      )}

    </div>
  )
}