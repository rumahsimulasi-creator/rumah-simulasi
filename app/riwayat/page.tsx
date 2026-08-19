'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../utils/supabase'

export default function RiwayatPage() {
  const [riwayatList, setRiwayatList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sudahLogin, setSudahLogin] = useState(true)
  const [tampilkan, setTampilkan] = useState(true)

  const router = useRouter()

  useEffect(() => {
    const fetchRiwayat = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id

      if (!userId) {
        setSudahLogin(false)
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('hasil_ujian')
        .select('*, paket(nama)')
        .eq('user_id', userId)
        .order('waktu_selesai', { ascending: false })

      if (!error && data) {
        setRiwayatList(data)
      }

      setLoading(false)
    }

    fetchRiwayat()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-7 w-56 rounded bg-slate-200" />
            <div className="mt-6 h-12 rounded-xl bg-slate-100" />
            <div className="mt-3 h-12 rounded-xl bg-slate-100" />
          </div>
        </div>
      </main>
    )
  }

  if (!sudahLogin) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-extrabold text-slate-900">
            Riwayat Nilai
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Silakan login untuk melihat riwayat nilai kamu.
          </p>

          <button
            onClick={() => router.push('/login')}
            className="mt-6 rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#1D4ED8]"
          >
            Login
          </button>
        </div>
      </main>
    )
  }

  const pertama =
    riwayatList.length > 0
      ? riwayatList[riwayatList.length - 1]
      : null

  const terbaru =
    riwayatList.length > 0
      ? riwayatList[0]
      : null

  const formatTanggal = (tanggal: string) => {
    if (!tanggal) return '-'

    return new Date(tanggal).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1200px]">

        {riwayatList.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EFF6FF] text-2xl">
              📊
            </div>

            <h1 className="mt-5 text-2xl font-black text-slate-900">
              Belum Ada Riwayat Nilai
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Kamu belum menyelesaikan tryout apa pun.
            </p>

            <button
              onClick={() => router.push('/paket')}
              className="mt-6 rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#1D4ED8]"
            >
              Lihat Tryout
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">

            {/* KIRI */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

              <div className="flex items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-black text-slate-900 sm:text-2xl">
                    Riwayat Nilai
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Lihat hasil pengerjaan tryout kamu.
                  </p>
                </div>

                <button
                  onClick={() => setTampilkan(!tampilkan)}
                  className="shrink-0 rounded-xl bg-[#2563EB] px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#1D4ED8]"
                >
                  {tampilkan ? 'Sembunyikan' : 'Tampilkan'}
                  <span className="ml-1">
                    {tampilkan ? '⌃' : '⌄'}
                  </span>
                </button>
              </div>

              {tampilkan && (
                <div className="mt-6 space-y-6">

                  {riwayatList.map((item, index) => (
                    <div
                      key={item.id}
                      className="overflow-hidden rounded-2xl border border-slate-200"
                    >
                      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                        <div className="inline-flex rounded-lg bg-[#EFF6FF] px-4 py-2">
                          <span className="text-sm font-bold text-[#2563EB]">
                            {index === riwayatList.length - 1
                              ? 'Perolehan Nilai Pertama'
                              : index === 0
                                ? 'Perolehan Nilai Terbaru'
                                : `Hasil Tryout ${riwayatList.length - index}`}
                          </span>
                        </div>

                        <p className="mt-3 text-sm font-semibold text-slate-800">
                          {item.paket?.nama || 'Tryout'}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatTanggal(item.waktu_selesai)}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-px bg-slate-200 sm:grid-cols-3">

                        <div className="bg-white p-4">
                          <p className="text-xs font-medium text-slate-500">
                            Nilai
                          </p>

                          <p className="mt-1 text-2xl font-black text-[#2563EB]">
                            {item.skor ?? 0}
                          </p>
                        </div>

                        <div className="bg-white p-4">
                          <p className="text-xs font-medium text-slate-500">
                            Status
                          </p>

                          <p className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
                            Selesai
                          </p>
                        </div>

                        <div className="col-span-2 bg-white p-4 sm:col-span-1">
                          <button
                            onClick={() =>
                              router.push(
                                `/pembahasan?hasil=${item.id}`
                              )
                            }
                            className="w-full rounded-xl bg-[#2563EB] px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#1D4ED8]"
                          >
                            Lihat Pembahasan
                          </button>
                        </div>

                      </div>
                    </div>
                  ))}

                </div>
              )}
            </section>

            {/* KANAN */}
            <aside className="space-y-6">

              {/* NILAI PERTAMA */}
              {pertama && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="rounded-2xl bg-[#EFF6FF] p-6 text-center">

                    <p className="text-sm font-bold text-slate-800">
                      Perolehan Nilai Pertama
                    </p>

                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                      {pertama.paket?.nama || 'Tryout'}
                    </p>

                    <p className="mt-4 text-6xl font-black tracking-tight text-[#2563EB]">
                      {pertama.skor ?? 0}
                    </p>

                    <div className="mx-auto mt-3 inline-flex rounded-full bg-emerald-500 px-5 py-1.5 text-xs font-extrabold text-white">
                      SELESAI
                    </div>

                    <p className="mt-4 text-xs leading-5 text-slate-600">
                      Nilai pertama yang kamu peroleh dari tryout.
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={() =>
                        router.push(`/pembahasan?hasil=${pertama.id}`)
                      }
                      className="rounded-xl bg-[#EFF6FF] px-3 py-3 text-xs font-bold text-[#2563EB] transition hover:bg-[#DBEAFE]"
                    >
                      Detail Nilai
                    </button>

                    <button
                      onClick={() =>
                        router.push(`/pembahasan?hasil=${pertama.id}`)
                      }
                      className="rounded-xl bg-[#2563EB] px-3 py-3 text-xs font-extrabold text-white transition hover:bg-[#1D4ED8]"
                    >
                      Pembahasan
                    </button>
                  </div>
                </div>
              )}

              {/* NILAI TERBARU */}
              {terbaru && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="rounded-2xl bg-[#EFF6FF] p-6 text-center">

                    <p className="text-sm font-bold text-slate-800">
                      Perolehan Nilai Terbaru
                    </p>

                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                      {terbaru.paket?.nama || 'Tryout'}
                    </p>

                    <p className="mt-4 text-6xl font-black tracking-tight text-[#2563EB]">
                      {terbaru.skor ?? 0}
                    </p>

                    <div className="mx-auto mt-3 inline-flex rounded-full bg-emerald-500 px-5 py-1.5 text-xs font-extrabold text-white">
                      SELESAI
                    </div>

                    <p className="mt-4 text-xs leading-5 text-slate-600">
                      Nilai terbaru dari pengerjaan tryout kamu.
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={() =>
                        router.push(`/pembahasan?hasil=${terbaru.id}`)
                      }
                      className="rounded-xl bg-[#EFF6FF] px-3 py-3 text-xs font-bold text-[#2563EB] transition hover:bg-[#DBEAFE]"
                    >
                      Detail Nilai
                    </button>

                    <button
                      onClick={() =>
                        router.push(`/pembahasan?hasil=${terbaru.id}`)
                      }
                      className="rounded-xl bg-[#2563EB] px-3 py-3 text-xs font-extrabold text-white transition hover:bg-[#1D4ED8]"
                    >
                      Pembahasan
                    </button>
                  </div>
                </div>
              )}

            </aside>
          </div>
        )}
      </div>
    </main>
  )
}