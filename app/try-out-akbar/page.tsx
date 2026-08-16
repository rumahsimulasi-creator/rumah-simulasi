'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../utils/supabase'

const NOMOR_WA_ADMIN = '62895403173470'

export default function TryOutAkbarPage() {
  const [paketList, setPaketList] = useState<any[]>([])
  const [pembelianList, setPembelianList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [showPendaftaranModal, setShowPendaftaranModal] = useState(false)
  const [paketPendaftaran, setPaketPendaftaran] = useState<any>(null)

  const router = useRouter()

  const fetchData = async () => {
    setLoading(true)

    const { data: paketData } = await supabase
      .from('paket')
      .select('*')
      .eq('tampil_di_try_out_akbar', true)

    if (paketData) setPaketList(paketData)

    const { data: userData } = await supabase.auth.getUser()
    const uid = userData.user?.id

    if (uid) {
      const { data: pembelianData } = await supabase
        .from('pembelian')
        .select('*')
        .eq('user_id', uid)

      if (pembelianData) setPembelianList(pembelianData)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getPembelian = (paketId: string) => {
    return pembelianList.find((p) => p.paket_id === paketId)
  }

  const getStatus = (paket: any) => {
    const gratis = Number(paket.harga) === 0
    const pembelian = getPembelian(paket.id)

    if (gratis && paket.butuh_pendaftaran) {
      return pembelian ? pembelian.status : 'belum_daftar'
    }

    return gratis ? 'gratis' : pembelian ? pembelian.status : 'belum_beli'
  }

  const handleMulaiUjian = async (paketId: string) => {
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      alert('Anda harus login terlebih dahulu untuk mengerjakan soal.')
      router.push('/login')
      return
    }

    router.push(`/ujian?paket=${paketId}`)
  }

  const handleBeli = async (paketId: string) => {
    const { data: userData } = await supabase.auth.getUser()
    const uid = userData.user?.id

    if (!uid) {
      alert('Silakan login dulu.')
      router.push('/login')
      return
    }

    const { error } = await supabase.from('pembelian').insert({
      user_id: uid,
      paket_id: paketId,
      status: 'belum_bayar',
    })

    if (error) alert(error.message)
    else fetchData()
  }

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

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-10">
        <div className="mx-auto flex min-h-[400px] max-w-4xl items-center justify-center">
          <p className="text-sm font-bold text-slate-500">
            Memuat...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="mb-7 text-center">

          <p className="text-sm font-extrabold uppercase tracking-wider text-[#2563EB]">
            Spesial
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
            Try Out Akbar
          </h1>

          <p className="mx-auto mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
            Ikuti Try Out Akbar Rumah Simulasi dan uji kesiapanmu bersama peserta lainnya.
          </p>

        </div>

        {/* LIST AKBAR */}
        {paketList.length === 0 ? (

          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">

            <h2 className="text-lg font-extrabold text-slate-900">
              Belum Ada Try Out Akbar
            </h2>

            <p className="mt-2 text-sm font-medium text-slate-500">
              Belum ada Try Out Akbar yang tersedia saat ini.
            </p>

          </div>

        ) : (

          <div className="flex flex-col items-center gap-6">

            {paketList.map((paket) => {

              const gratis = Number(paket.harga) === 0
              const status = getStatus(paket)

              return (
                <div
                  key={paket.id}
                  className="flex w-full max-w-3xl flex-col rounded-2xl border border-[#BFDBFE] bg-white p-7 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg sm:p-8"
                >

                  {/* BADGE */}
                  <div className="flex flex-wrap gap-2">

                    <span className="rounded-full bg-[#2563EB] px-3 py-1 text-[11px] font-extrabold text-white">
                      TRY OUT AKBAR
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

                  {/* NAMA */}
                  <h2 className="mt-5 text-2xl font-black leading-7 text-slate-900">
                    {paket.nama}
                  </h2>

                  {/* DESKRIPSI */}
                  <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
                    {paket.deskripsi}
                  </p>

                  {/* DURASI */}
                  <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-slate-600">

                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EFF6FF] text-xs">
                      ⏱
                    </span>

                    {paket.waktu_menit} menit

                  </div>

                  {/* SYARAT */}
                  {paket.butuh_pendaftaran && paket.syarat_pendaftaran && (
                    <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">

                      <p className="text-xs font-extrabold uppercase tracking-wide text-amber-700">
                        Syarat Pendaftaran
                      </p>

                      <p className="mt-2 whitespace-pre-line text-sm font-medium leading-6 text-amber-800">
                        {paket.syarat_pendaftaran}
                      </p>

                    </div>
                  )}

                  {/* PEMISAH */}
                  <div className="mt-6 border-t border-slate-100 pt-6" />

                  {/* BUTTON */}
                  {status === 'gratis' || status === 'lunas' ? (

                    <button
                      onClick={() => handleMulaiUjian(paket.id)}
                      className="flex w-full items-center justify-between rounded-xl bg-[#2563EB] px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#1D4ED8]"
                    >
                      Mulai Ujian

                      <span className="text-lg">
                        →
                      </span>
                    </button>

                  ) : status === 'belum_daftar' ? (

                    <button
                      onClick={() => bukaPendaftaran(paket)}
                      className="flex w-full items-center justify-between rounded-xl bg-amber-500 px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-amber-600"
                    >
                      Daftar Sekarang

                      <span className="text-lg">
                        →
                      </span>
                    </button>

                  ) : status === 'menunggu_konfirmasi' ? (

                    <div className="space-y-2">

                      <button
                        disabled
                        className="w-full cursor-not-allowed rounded-xl bg-slate-100 px-5 py-3.5 text-sm font-bold text-slate-400"
                      >
                        Menunggu Konfirmasi
                      </button>

                      <a
                        href={linkWhatsappAdmin(paket)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-extrabold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        Hubungi Admin
                      </a>

                    </div>

                  ) : (

                    <button
                      onClick={() => handleBeli(paket.id)}
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

      {/* POPUP PENDAFTARAN */}
      {showPendaftaranModal && paketPendaftaran && (

        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 px-4 py-6 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPendaftaranModal(false)
              setPaketPendaftaran(null)
            }
          }}
        >

          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white shadow-2xl">

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
                    setShowPendaftaranModal(false)
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

        </div>
      )}

    </main>
  )
}