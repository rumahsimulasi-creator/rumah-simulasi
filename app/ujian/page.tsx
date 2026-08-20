'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '../utils/supabase'

function UjianContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const paketId = searchParams.get('paket')

  const [soalList, setSoalList] = useState<any[]>([])
  const [paketInfo, setPaketInfo] = useState<any>(null)
  const [jawaban, setJawaban] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(true)

  const [soalAktif, setSoalAktif] = useState(0)
  const [raguRagu, setRaguRagu] = useState<{ [key: string]: boolean }>({})

  // TIMER 100 MENIT
  const [waktuTersisa, setWaktuTersisa] = useState(100 * 60)

  const [showHasil, setShowHasil] = useState(false)
  const [hasilId, setHasilId] = useState<string | null>(null)

  const [hasilUjian, setHasilUjian] = useState({
    total: 0,
    twk: 0,
    tiu: 0,
    tkp: 0,
    lulus: false,
  })

  const [menyimpan, setMenyimpan] = useState(false)

  // ATURAN PASSING GRADE (terpusat di sini)
  const PASSING_GRADE = {
    total: 311,
    twk: 65,
    tiu: 80,
    tkp: 166,
  }

  // =========================
  // AMBIL DATA PAKET + SOAL
  // =========================
  useEffect(() => {
    const fetchData = async () => {
      if (!paketId) {
        setLoading(false)
        return
      }

      const { data: paketData, error: paketError } = await supabase
        .from('paket')
        .select('*')
        .eq('id', paketId)
        .single()

      if (!paketError && paketData) {
        setPaketInfo(paketData)
      }

      const { data: soalData, error: soalError } = await supabase
        .from('soal')
        .select('*')
        .eq('paket_id', paketId)
        .order('id', { ascending: true })

      if (!soalError && soalData) {
        setSoalList(soalData)
      }

      setLoading(false)
    }

    fetchData()
  }, [paketId])

  // =========================
  // TIMER
  // =========================
  useEffect(() => {
    if (loading || soalList.length === 0 || showHasil || !paketId) return

    const timerKey = `ujian_timer_${paketId}`
    const sekarang = Date.now()

    const timerTersimpan = localStorage.getItem(timerKey)

    let waktuSelesai: number

    if (timerTersimpan) {
      waktuSelesai = Number(timerTersimpan)
    } else {
      waktuSelesai = sekarang + 100 * 60 * 1000
      localStorage.setItem(timerKey, String(waktuSelesai))
    }

    const updateTimer = () => {
      const sisa = Math.max(
        0,
        Math.ceil((waktuSelesai - Date.now()) / 1000)
      )

      setWaktuTersisa(sisa)

      if (sisa <= 0) {
        clearInterval(timer)
        handleSelesai(true)
      }
    }

    updateTimer()

    const timer = setInterval(updateTimer, 1000)

    return () => clearInterval(timer)
  }, [loading, soalList.length, showHasil, paketId])

  // =========================
  // FORMAT TIMER
  // =========================
  const jam = Math.floor(waktuTersisa / 3600)
  const menit = Math.floor((waktuTersisa % 3600) / 60)
  const detik = waktuTersisa % 60

  const formatWaktu = (angka: number) => {
    return String(angka).padStart(2, '0')
  }

  // =========================
  // PILIH JAWABAN
  // =========================
  const pilihJawaban = (soalId: string, pilihan: string) => {
    setJawaban((prev) => ({
      ...prev,
      [soalId]: pilihan,
    }))
  }

  // =========================
  // RAGU-RAGU
  // =========================
  const toggleRagu = (soalId: string) => {
    setRaguRagu((prev) => ({
      ...prev,
      [soalId]: !prev[soalId],
    }))
  }

  // =========================
  // PINDAH SOAL
  // =========================
  const pindahSoal = (index: number) => {
    if (index < 0 || index >= soalList.length) return

    setSoalAktif(index)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // =========================
  // SELESAI UJIAN
  // =========================
  const handleSelesai = async (otomatis = false) => {
    if (menyimpan || showHasil) return

    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id

    if (!userId) {
      alert('Anda harus login terlebih dahulu.')
      router.push('/login')
      return
    }

    setMenyimpan(true)

    let twk = 0
    let tiu = 0
    let tkp = 0

    const jawabanRows = soalList.map((soal) => {
      const kategori = String(soal.kategori || '').toUpperCase()
      const pilihanUser = jawaban[soal.id] || null

      let poin = 0
      let benar: boolean | null = null

      if (kategori === 'TKP') {
        if (pilihanUser) {
          poin = Number(soal[`bobot_${pilihanUser}`]) || 0
        }

        tkp += poin
        benar = null
      } else {
        benar = pilihanUser === soal.jawaban_benar
        poin = benar ? 5 : 0

        if (kategori === 'TWK') twk += poin
        if (kategori === 'TIU') tiu += poin
      }

      return {
        soal_id: soal.id,
        jawaban_dipilih: pilihanUser,
        benar,
        poin,
      }
    })

    const total = twk + tiu + tkp

    const lulus =
      total >= PASSING_GRADE.total &&
      twk >= PASSING_GRADE.twk &&
      tiu >= PASSING_GRADE.tiu &&
      tkp >= PASSING_GRADE.tkp

    const { data: hasilData, error: hasilError } = await supabase
      .from('hasil_ujian')
      .insert({
        user_id: userId,
        paket_id: paketId,
        skor: total,
        skor_twk: twk,
        skor_tiu: tiu,
        skor_tkp: tkp,
        lulus,
      })
      .select()
      .single()

    if (hasilError) {
      alert(hasilError.message)
      setMenyimpan(false)
      return
    }

    const jawabanRowsFinal = jawabanRows.map((row) => ({
      hasil_ujian_id: hasilData.id,
      soal_id: row.soal_id,
      jawaban_dipilih: row.jawaban_dipilih,
      benar: row.benar,
    }))

    const { error: jawabanError } = await supabase
      .from('jawaban_user')
      .insert(jawabanRowsFinal)

    if (jawabanError) {
      alert(jawabanError.message)
      setMenyimpan(false)
      return
    }

    setHasilId(hasilData.id)

    setHasilUjian({
      total,
      twk,
      tiu,
      tkp,
      lulus,
    })

    setShowHasil(true)
    setMenyimpan(false)

    // Hapus timer setelah ujian selesai
    if (paketId) {
      localStorage.removeItem(`ujian_timer_${paketId}`)
    }

    if (otomatis) {
      // Popup akan menampilkan hasil karena waktu habis
    }
  }

  // =========================
  // DATA SOAL AKTIF
  // =========================
  const soal = soalList[soalAktif]

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-10">
        <div className="mx-auto flex min-h-[500px] max-w-6xl items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-[3px] border-[#D6ECFD] border-t-[#2563EB]" />

            <p className="mt-4 text-sm font-bold text-slate-500">
              Memuat soal...
            </p>
          </div>
        </div>
      </main>
    )
  }

  // =========================
  // TIDAK ADA SOAL
  // =========================
  if (soalList.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-extrabold text-slate-900">
            Belum Ada Soal
          </h1>

          <p className="mt-2 text-sm font-medium text-slate-500">
            Belum ada soal di paket ini.
          </p>

          <button
            onClick={() => router.back()}
            className="mt-6 rounded-lg bg-[#2563EB] px-6 py-3 text-sm font-bold text-white hover:bg-[#1D4ED8]"
          >
            Kembali
          </button>
        </div>
      </main>
    )
  }

  const nomorSoal = soalAktif + 1
  const sudahDijawab = soal ? Boolean(jawaban[soal.id]) : false
  const soalRagu = soal ? Boolean(raguRagu[soal.id]) : false
  const isLast = soalAktif === soalList.length - 1

  const jumlahDijawab = Object.keys(jawaban).length

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 font-sans sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* ========================= */}
        {/* HEADER */}
        {/* ========================= */}

        <div className="mb-5 grid gap-5 lg:grid-cols-[1fr_280px]">

          {/* INFO PAKET */}
          <section className="rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm sm:px-8 sm:py-7">

            <p className="text-xs font-extrabold uppercase tracking-wider text-[#2563EB]">
              Tryout
            </p>

            <h1 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              {paketInfo?.nama || 'Memuat paket...'}
            </h1>

            {paketInfo?.deskripsi && (
              <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                {paketInfo.deskripsi}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">

              <span className="rounded-full bg-[#EFF6FF] px-3 py-1.5 text-xs font-bold text-[#2563EB]">
                Soal {nomorSoal} dari {soalList.length}
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                {jumlahDijawab} sudah dijawab
              </span>

            </div>
          </section>

          {/* TIMER */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">
              <p className="text-sm font-extrabold text-slate-900">
                Sisa Waktu
              </p>

              {waktuTersisa <= 300 && (
                <span className="text-[11px] font-extrabold text-red-500">
                  Segera selesai
                </span>
              )}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">

              <div
                className={`rounded-xl px-2 py-3 text-center text-white ${
                  waktuTersisa <= 300
                    ? 'bg-red-600'
                    : 'bg-[#2563EB]'
                }`}
              >
                <p className="text-xl font-extrabold">
                  {formatWaktu(jam)}
                </p>

                <p className="text-[10px] font-bold opacity-80">
                  Jam
                </p>
              </div>

              <div
                className={`rounded-xl px-2 py-3 text-center text-white ${
                  waktuTersisa <= 300
                    ? 'bg-red-600'
                    : 'bg-[#2563EB]'
                }`}
              >
                <p className="text-xl font-extrabold">
                  {formatWaktu(menit)}
                </p>

                <p className="text-[10px] font-bold opacity-80">
                  Menit
                </p>
              </div>

              <div
                className={`rounded-xl px-2 py-3 text-center text-white ${
                  waktuTersisa <= 300
                    ? 'bg-red-600'
                    : 'bg-[#2563EB]'
                }`}
              >
                <p className="text-xl font-extrabold">
                  {formatWaktu(detik)}
                </p>

                <p className="text-[10px] font-bold opacity-80">
                  Detik
                </p>
              </div>

            </div>
          </section>

        </div>

        {/* ========================= */}
        {/* CONTENT */}
        {/* ========================= */}

        <div className="grid gap-5 lg:grid-cols-[1fr_280px]">

          {/* SOAL */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

            <div className="mb-6">

              <p className="text-sm font-extrabold text-[#2563EB]">
                Soal Nomor {nomorSoal}
              </p>

              {soal.kategori && (
                <span className="mt-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase text-slate-600">
                  {soal.kategori}
                </span>
              )}

            </div>

            {soal.pertanyaan_teks && (
              <p className="whitespace-pre-line text-[15px] font-medium leading-7 text-slate-700 sm:text-base">
                {soal.pertanyaan_teks}
              </p>
            )}

            {soal.pertanyaan_gambar && (
              <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
                <img
                  src={soal.pertanyaan_gambar}
                  alt="Soal"
                  className="max-h-[500px] w-full object-contain"
                />
              </div>
            )}

            {/* PILIHAN */}
            <div className="mt-7 space-y-3">

              {['a', 'b', 'c', 'd', 'e'].map((huruf) => {

                const teks = soal[`pilihan_${huruf}_teks`]
                const gambar = soal[`pilihan_${huruf}_gambar`]

                if (!teks && !gambar) return null

                const dipilih = jawaban[soal.id] === huruf

                return (
                  <button
                    key={huruf}
                    type="button"
                    onClick={() => pilihJawaban(soal.id, huruf)}
                    className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition ${
                      dipilih
                        ? 'border-[#2563EB] bg-[#EFF6FF] shadow-sm'
                        : 'border-slate-200 bg-slate-50 hover:border-[#93C5FD] hover:bg-[#F8FBFF]'
                    }`}
                  >

                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
                        dipilih
                          ? 'bg-[#2563EB] text-white'
                          : 'border border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      {huruf.toUpperCase()}
                    </span>

                    <span className="whitespace-pre-line pt-1 text-sm font-semibold leading-6 text-slate-700">

                      {teks}

                      {gambar && (
                        <img
                          src={gambar}
                          alt={huruf}
                          className="mt-3 max-h-48 max-w-full rounded-lg object-contain"
                        />
                      )}

                    </span>

                  </button>
                )
              })}

            </div>

            {/* NAVIGASI */}
            <div className="mt-8 border-t border-slate-200 pt-5">

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <button
                  onClick={() => pindahSoal(soalAktif - 1)}
                  disabled={soalAktif === 0}
                  className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Sebelumnya
                </button>

                <button
                  onClick={() => toggleRagu(soal.id)}
                  className={`rounded-lg px-5 py-3 text-sm font-bold transition ${
                    soalRagu
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {soalRagu ? '✓ Ragu-ragu' : 'Ragu-ragu'}
                </button>

                {isLast ? (

                  <button
                    onClick={() => handleSelesai(false)}
                    disabled={menyimpan}
                    className="rounded-lg bg-[#2563EB] px-7 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {menyimpan ? 'Menyimpan...' : 'Selesai'}
                  </button>

                ) : (

                  <button
                    onClick={() => pindahSoal(soalAktif + 1)}
                    className="rounded-lg bg-[#2563EB] px-7 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#1D4ED8]"
                  >
                    Selanjutnya →
                  </button>

                )}

              </div>

            </div>

          </section>

          {/* DAFTAR SOAL */}
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-5">

            <div className="flex items-center justify-between">

              <h2 className="text-sm font-extrabold text-slate-900">
                Daftar Soal
              </h2>

              <span className="text-xs font-bold text-slate-400">
                {jumlahDijawab}/{soalList.length}
              </span>

            </div>

            <div className="mt-4 max-h-[500px] overflow-y-auto pr-1">

              <div className="grid grid-cols-4 gap-2">

                {soalList.map((item, index) => {

                  const aktif = index === soalAktif
                  const dijawab = Boolean(jawaban[item.id])
                  const ragu = Boolean(raguRagu[item.id])

                  return (
                    <button
                      key={item.id}
                      onClick={() => pindahSoal(index)}
                      className={`relative h-10 rounded-lg border text-xs font-extrabold transition ${
                        aktif
                          ? 'border-[#2563EB] bg-[#2563EB] text-white'
                          : ragu
                            ? 'border-orange-500 bg-orange-500 text-white'
                            : dijawab
                              ? 'border-green-500 bg-green-500 text-white'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {index + 1}

                      {ragu && (
                        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-orange-500 ring-2 ring-white" />
                      )}
                    </button>
                  )
                })}

              </div>

            </div>

            <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-[11px] font-semibold text-slate-500">

              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-[#2563EB]" />
                Soal aktif
              </div>

              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-green-500" />
                Sudah dijawab
              </div>

              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-orange-500" />
                Ragu-ragu
              </div>

            </div>

          </aside>

        </div>
      </div>

      {/* ========================= */}
      {/* POPUP HASIL UJIAN */}
      {/* ========================= */}

      {showHasil && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6 backdrop-blur-sm">

          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

            {/* HEADER POPUP */}
            <div className="relative overflow-hidden bg-[#2563EB] px-6 py-8 text-center sm:px-10">

              <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/10" />
              <div className="absolute -bottom-24 -left-10 h-48 w-48 rounded-full bg-white/10" />

              <div className="relative">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-lg">
                  🎯
                </div>

                <h2 className="mt-4 text-2xl font-extrabold text-white sm:text-3xl">
                  Ujian Selesai
                </h2>

                <p className="mt-1 text-sm font-medium text-blue-100">
                  {paketInfo?.nama || 'Hasil Simulasi'}
                </p>

              </div>
            </div>

            <div className="p-6 sm:p-8">

              {/* NILAI TOTAL */}
              <div className="rounded-2xl bg-slate-50 p-6 text-center">

                <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  Nilai Total
                </p>

                <p className="mt-2 text-5xl font-black tracking-tight text-[#2563EB]">
                  {hasilUjian.total}
                </p>

                <p className="mt-1 text-sm font-bold text-slate-400">
                  dari 550 poin maksimal
                </p>

              </div>

              {/* NILAI KATEGORI */}
              <div className="mt-5 grid grid-cols-3 gap-3">

                <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">

                  <p className="text-xs font-extrabold text-slate-400">
                    TWK
                  </p>

                  <p className="mt-2 text-2xl font-black text-slate-900">
                    {hasilUjian.twk}
                  </p>

                  <p className="mt-1 text-[10px] font-bold text-slate-400">
                    min. {PASSING_GRADE.twk}
                  </p>

                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">

                  <p className="text-xs font-extrabold text-slate-400">
                    TIU
                  </p>

                  <p className="mt-2 text-2xl font-black text-slate-900">
                    {hasilUjian.tiu}
                  </p>

                  <p className="mt-1 text-[10px] font-bold text-slate-400">
                    min. {PASSING_GRADE.tiu}
                  </p>

                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">

                  <p className="text-xs font-extrabold text-slate-400">
                    TKP
                  </p>

                  <p className="mt-2 text-2xl font-black text-slate-900">
                    {hasilUjian.tkp}
                  </p>

                  <p className="mt-1 text-[10px] font-bold text-slate-400">
                    min. {PASSING_GRADE.tkp}
                  </p>

                </div>

              </div>

              {/* STATUS PASSING GRADE */}
              <div
                className={`mt-5 rounded-2xl border p-5 ${
                  hasilUjian.lulus
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >

                <div className="flex items-start gap-3">

                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-black ${
                      hasilUjian.lulus
                        ? 'bg-emerald-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {hasilUjian.lulus ? '✓' : '×'}
                  </div>

                  <div>

                    <p
                      className={`text-sm font-extrabold ${
                        hasilUjian.lulus
                          ? 'text-emerald-700'
                          : 'text-red-700'
                      }`}
                    >
                      {hasilUjian.lulus
                        ? 'LULUS PASSING GRADE'
                        : 'BELUM LULUS PASSING GRADE'}
                    </p>

                    <p className="mt-1 text-sm font-medium leading-5 text-slate-600">
                      {hasilUjian.lulus
                        ? 'Nilai kamu sudah memenuhi seluruh batas passing grade (total & tiap subtes).'
                        : 'Nilai kamu belum memenuhi seluruh batas passing grade (total & tiap subtes).'}
                    </p>

                  </div>

                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-black/5 pt-4 text-sm">

                  <div>

                    <p className="font-semibold text-slate-400">
                      Passing Grade Total
                    </p>

                    <p className="mt-1 font-extrabold text-slate-800">
                      {PASSING_GRADE.total}
                    </p>

                  </div>

                  <div>

                    <p className="font-semibold text-slate-400">
                      Nilai Kamu
                    </p>

                    <p className="mt-1 font-extrabold text-slate-800">
                      {hasilUjian.total}
                    </p>

                  </div>

                </div>

              </div>

              {/* BUTTON */}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">

                <button
                  onClick={() => {
                    if (hasilId) {
                      router.push(`/pembahasan?hasil=${hasilId}`)
                    }
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-extrabold text-slate-700 transition hover:border-[#93C5FD] hover:bg-[#EFF6FF] hover:text-[#2563EB]"
                >
                  Lihat Pembahasan
                </button>

                <button
                  onClick={() => {
                    if (paketId) {
                      router.push(`/ranking?paket=${paketId}`)
                    }
                  }}
                  className="rounded-xl bg-[#2563EB] px-5 py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#1D4ED8]"
                >
                  Lihat Ranking
                </button>

              </div>

            </div>
          </div>
        </div>
      )}

    </main>
  )
}

export default function UjianPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 px-5 py-10">
          <div className="mx-auto flex min-h-[500px] max-w-6xl items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-[3px] border-[#D6ECFD] border-t-[#2563EB]" />
              <p className="mt-4 text-sm font-bold text-slate-500">
                Memuat halaman ujian...
              </p>
            </div>
          </div>
        </main>
      }
    >
      <UjianContent />
    </Suspense>
  )
}