'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../utils/supabase'

function PembahasanContent() {
  const searchParams = useSearchParams()
  const hasilId = searchParams.get('hasil')

  const [jawabanList, setJawabanList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const fetchPembahasan = async () => {
      if (!hasilId) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('jawaban_user')
        .select('*, soal(*)')
        .eq('hasil_ujian_id', hasilId)

      if (!error && data) {
        setJawabanList(data)
      }

      setLoading(false)
    }

    fetchPembahasan()
  }, [hasilId])

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-10">
        <div className="mx-auto flex min-h-[500px] max-w-6xl items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-[3px] border-[#D6ECFD] border-t-[#2563EB]" />
            <p className="mt-4 text-sm font-bold text-slate-500">
              Memuat pembahasan...
            </p>
          </div>
        </div>
      </main>
    )
  }

  if (jawabanList.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-10">
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <img
            src="/logo.png"
            alt="Rumah Simulasi"
            className="mx-auto h-16 w-16 object-contain"
          />

          <h1 className="mt-5 text-2xl font-extrabold text-slate-900">
            Pembahasan Tidak Ditemukan
          </h1>

          <p className="mt-2 text-sm font-medium text-slate-500">
            Data pembahasan untuk ujian ini belum tersedia.
          </p>
        </div>
      </main>
    )
  }

  const current = jawabanList[currentIndex]
  const soal = current.soal
  const isTKP = String(soal.kategori || '').toUpperCase() === 'TKP'
  const benar = current.benar

  const poinTKP = current.jawaban_dipilih
    ? Number(soal[`bobot_${current.jawaban_dipilih}`]) || 0
    : 0

  // Statistik: TWK/TIU dihitung benar/salah, TKP dihitung total poin
  const soalTwkTiu = jawabanList.filter(
    (item) => String(item.soal.kategori || '').toUpperCase() !== 'TKP'
  )
  const soalTkp = jawabanList.filter(
    (item) => String(item.soal.kategori || '').toUpperCase() === 'TKP'
  )

  const jumlahBenar = soalTwkTiu.filter((item) => item.benar).length
  const jumlahSalah = soalTwkTiu.length - jumlahBenar

  const totalPoinTKP = soalTkp.reduce((sum, item) => {
    const p = item.jawaban_dipilih
      ? Number(item.soal[`bobot_${item.jawaban_dipilih}`]) || 0
      : 0
    return sum + p
  }, 0)

  const pilihan = ['a', 'b', 'c', 'd', 'e']

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#2563EB]">
              Rumah Simulasi
            </p>

            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
              Pembahasan
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden rounded-lg bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm sm:block">
              Benar (TWK/TIU):{' '}
              <span className="text-emerald-600">{jumlahBenar}</span>
            </div>

            <div className="hidden rounded-lg bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm sm:block">
              Salah (TWK/TIU):{' '}
              <span className="text-red-500">{jumlahSalah}</span>
            </div>

            <div className="hidden rounded-lg bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm sm:block">
              Total Poin TKP:{' '}
              <span className="text-[#2563EB]">{totalPoinTKP}</span>
            </div>
          </div>
        </div>

        {/* LAYOUT */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">

          {/* KONTEN UTAMA */}
          <section className="space-y-5">

            {/* SOAL */}
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-extrabold text-slate-900">
                    Soal Nomor {currentIndex + 1}
                  </p>

                  {soal.kategori && (
                    <span className="mt-2 inline-flex rounded-full bg-[#EAF4FE] px-3 py-1 text-[10px] font-bold text-[#2563EB]">
                      {soal.kategori}
                    </span>
                  )}
                </div>

                {isTKP ? (
                  <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-[11px] font-extrabold text-[#2563EB]">
                    +{poinTKP} POIN
                  </span>
                ) : (
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${
                      benar
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-red-50 text-red-500'
                    }`}
                  >
                    {benar ? 'BENAR' : 'SALAH'}
                  </span>
                )}
              </div>

              {/* PERTANYAAN */}
              {soal.pertanyaan_teks && (
                <p className="mt-6 text-[15px] font-medium leading-7 text-slate-700">
                  {soal.pertanyaan_teks}
                </p>
              )}

              {soal.pertanyaan_gambar && (
                <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <img
                    src={soal.pertanyaan_gambar}
                    alt="Soal"
                    className="max-h-[400px] max-w-full object-contain"
                  />
                </div>
              )}

              {/* PILIHAN */}
              <div className="mt-6 space-y-3">
                {pilihan.map((huruf) => {
                  const teks = soal[`pilihan_${huruf}_teks`]
                  const gambar = soal[`pilihan_${huruf}_gambar`]

                  if (!teks && !gambar) return null

                  const adalahJawabanUser =
                    current.jawaban_dipilih === huruf

                  const adalahJawabanBenar =
                    !isTKP && soal.jawaban_benar === huruf

                  const bobotHuruf = isTKP ? soal[`bobot_${huruf}`] : null

                  let optionClass =
                    'border-slate-200 bg-slate-50 text-slate-700'

                  if (isTKP) {
                    if (adalahJawabanUser) {
                      optionClass =
                        'border-[#93C5FD] bg-[#EFF6FF] text-[#1D4ED8]'
                    }
                  } else if (adalahJawabanBenar) {
                    optionClass =
                      'border-emerald-300 bg-emerald-50 text-emerald-800'
                  } else if (adalahJawabanUser) {
                    optionClass =
                      'border-red-300 bg-red-50 text-red-800'
                  }

                  return (
                    <div
                      key={huruf}
                      className={`rounded-xl border px-4 py-3 transition ${optionClass}`}
                    >
                      <div className="flex items-start gap-3">

                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                            isTKP
                              ? adalahJawabanUser
                                ? 'bg-[#2563EB] text-white'
                                : 'bg-white text-slate-600'
                              : adalahJawabanBenar
                              ? 'bg-emerald-500 text-white'
                              : adalahJawabanUser
                              ? 'bg-red-500 text-white'
                              : 'bg-white text-slate-600'
                          }`}
                        >
                          {huruf.toUpperCase()}
                        </span>

                        <div className="min-w-0 flex-1">
                          {teks && (
                            <p className="text-sm font-semibold leading-6">
                              {teks}
                            </p>
                          )}

                          {gambar && (
                            <img
                              src={gambar}
                              alt={`Pilihan ${huruf.toUpperCase()}`}
                              className="mt-3 max-h-52 max-w-full object-contain"
                            />
                          )}
                        </div>

                        <div className="shrink-0 text-right">
                          {isTKP ? (
                            <span className="text-[10px] font-extrabold text-slate-400">
                              BOBOT {bobotHuruf ?? 0}
                            </span>
                          ) : (
                            <>
                              {adalahJawabanBenar && (
                                <span className="text-[10px] font-extrabold text-emerald-600">
                                  JAWABAN BENAR
                                </span>
                              )}

                              {adalahJawabanUser && !adalahJawabanBenar && (
                                <span className="text-[10px] font-extrabold text-red-500">
                                  JAWABAN KAMU
                                </span>
                              )}
                            </>
                          )}
                        </div>

                      </div>
                    </div>
                  )
                })}
              </div>

              {/* RINGKASAN JAWABAN */}
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">

                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                    Jawaban Kamu
                  </p>

                  <p
                    className={`mt-1 text-lg font-extrabold ${
                      isTKP
                        ? 'text-[#2563EB]'
                        : benar
                        ? 'text-emerald-600'
                        : 'text-red-500'
                    }`}
                  >
                    {current.jawaban_dipilih
                      ? current.jawaban_dipilih.toUpperCase()
                      : '-'}
                  </p>
                </div>

                {isTKP ? (
                  <div className="rounded-xl bg-[#EAF4FE] px-4 py-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#2563EB]">
                      Poin Diperoleh
                    </p>

                    <p className="mt-1 text-lg font-extrabold text-[#2563EB]">
                      {poinTKP}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl bg-[#EAF4FE] px-4 py-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#2563EB]">
                      Jawaban Benar
                    </p>

                    <p className="mt-1 text-lg font-extrabold text-[#2563EB]">
                      {soal.jawaban_benar
                        ? soal.jawaban_benar.toUpperCase()
                        : '-'}
                    </p>
                  </div>
                )}

              </div>
            </article>

            {/* PEMBAHASAN */}
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">

              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563EB] text-sm font-extrabold text-white">
                  ?
                </div>

                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#2563EB]">
                    Penjelasan
                  </p>

                  <h2 className="text-lg font-extrabold text-slate-900">
                    Pembahasan Nomor {currentIndex + 1}
                  </h2>
                </div>
              </div>

              {soal.pembahasan_teks ? (
                <p className="mt-5 whitespace-pre-line text-sm font-medium leading-7 text-slate-600">
                  {soal.pembahasan_teks}
                </p>
              ) : (
                <p className="mt-5 text-sm font-medium text-slate-400">
                  Pembahasan belum tersedia untuk soal ini.
                </p>
              )}

              {soal.pembahasan_gambar && (
                <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <img
                    src={soal.pembahasan_gambar}
                    alt="Pembahasan"
                    className="max-h-[500px] max-w-full object-contain"
                  />
                </div>
              )}

            </article>

          </section>

          {/* SIDEBAR */}
          <aside className="space-y-5">

            {/* HASIL */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-extrabold text-slate-900">
                Hasil Pengerjaan
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-emerald-50 p-3 text-center">
                  <p className="text-[10px] font-bold text-emerald-600">
                    BENAR
                  </p>

                  <p className="mt-1 text-xl font-extrabold text-emerald-700">
                    {jumlahBenar}
                  </p>
                </div>

                <div className="rounded-xl bg-red-50 p-3 text-center">
                  <p className="text-[10px] font-bold text-red-500">
                    SALAH
                  </p>

                  <p className="mt-1 text-xl font-extrabold text-red-600">
                    {jumlahSalah}
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-[#EFF6FF] p-3 text-center">
                <p className="text-[10px] font-bold text-[#2563EB]">
                  TOTAL POIN TKP
                </p>

                <p className="mt-1 text-xl font-extrabold text-[#1D4ED8]">
                  {totalPoinTKP}
                </p>
              </div>
            </div>

            {/* DAFTAR SOAL */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <p className="text-xs font-extrabold text-slate-900">
                Daftar Soal
              </p>

              <div className="mt-4 grid max-h-[430px] grid-cols-5 gap-2 overflow-y-auto pr-1">
                {jawabanList.map((item, index) => {
                  const itemIsTKP =
                    String(item.soal.kategori || '').toUpperCase() === 'TKP'

                  const warna = itemIsTKP
                    ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
                    : item.benar
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-red-500 text-white hover:bg-red-600'

                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentIndex(index)}
                      className={`relative flex h-10 items-center justify-center rounded-lg text-xs font-extrabold transition ${
                        currentIndex === index
                          ? 'ring-2 ring-[#2563EB] ring-offset-2'
                          : ''
                      } ${warna}`}
                    >
                      {index + 1}
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">

                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                  <span className="h-3 w-3 rounded bg-emerald-500" />
                  Jawaban benar (TWK/TIU)
                </div>

                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                  <span className="h-3 w-3 rounded bg-red-500" />
                  Jawaban salah (TWK/TIU)
                </div>

                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                  <span className="h-3 w-3 rounded bg-[#2563EB]" />
                  Soal TKP (berbobot)
                </div>

              </div>

            </div>

          </aside>

        </div>

        {/* NAVIGASI */}
        <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <button
            onClick={() =>
              setCurrentIndex((prev) => Math.max(0, prev - 1))
            }
            disabled={currentIndex === 0}
            className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-extrabold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Sebelumnya
          </button>

          <span className="hidden text-xs font-bold text-slate-400 sm:block">
            {currentIndex + 1} / {jawabanList.length}
          </span>

          <button
            onClick={() =>
              setCurrentIndex((prev) =>
                Math.min(jawabanList.length - 1, prev + 1)
              )
            }
            disabled={currentIndex === jawabanList.length - 1}
            className="rounded-lg bg-[#2563EB] px-6 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Selanjutnya →
          </button>

        </div>

      </div>
    </main>
  )
}

export default function PembahasanPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 px-5 py-10">
          <div className="mx-auto flex min-h-[500px] max-w-6xl items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-[3px] border-[#D6ECFD] border-t-[#2563EB]" />
              <p className="mt-4 text-sm font-bold text-slate-500">
                Memuat pembahasan...
              </p>
            </div>
          </div>
        </main>
      }
    >
      <PembahasanContent />
    </Suspense>
  )
}