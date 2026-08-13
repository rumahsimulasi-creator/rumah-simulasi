'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../utils/supabase'

export default function PaketSayaPage() {
  const [paketList, setPaketList] = useState<any[]>([])
  const [ebookList, setEbookList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id

      if (!userId) {
        setLoading(false)
        return
      }

      const { data: paketData } = await supabase
        .from('paket')
        .select('*')

      const { data: pembelianData } = await supabase
        .from('pembelian')
        .select('paket_id')
        .eq('user_id', userId)
        .eq('status', 'lunas')

      const paketDimiliki = (paketData || []).filter((p) => {
        if (p.harga === 0) return true
        return pembelianData?.some((pb) => pb.paket_id === p.id)
      })

      setPaketList(paketDimiliki)

      const { data: ebookData } = await supabase
        .from('ebook')
        .select('*')

      const { data: pembelianEbookData } = await supabase
        .from('pembelian_ebook')
        .select('ebook_id')
        .eq('user_id', userId)
        .eq('status', 'lunas')

      const ebookDimiliki = (ebookData || []).filter((e) =>
        pembelianEbookData?.some((pb) => pb.ebook_id === e.id)
      )

      setEbookList(ebookDimiliki)
      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8fafc] px-5 py-10 font-sans sm:px-8 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="flex min-h-[420px] items-center justify-center rounded-[22px] border border-[#dfe6ee] bg-white shadow-[0_8px_24px_rgba(31,55,84,0.05)]">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-[3px] border-[#dbeafe] border-t-[#2563eb]" />
              <p className="mt-4 text-sm font-bold text-[#64748b]">
                Memuat paket kamu...
              </p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] px-5 py-10 font-sans sm:px-8 sm:py-12 lg:px-10">
      <div className="mx-auto max-w-[1180px]">

        {/* HERO */}
        <section className="grid items-center gap-10 border-b border-[#e5eaf0] pb-12 lg:grid-cols-[1fr_0.9fr] lg:gap-14">

          {/* KIRI */}
          <div>

            <span className="inline-flex items-center gap-2 rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-4 py-1.5 text-[11px] font-extrabold tracking-wide text-[#2563eb]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2563eb]" />
              Rumah Simulasi
            </span>

            <h1 className="mt-6 max-w-[620px] text-[42px] font-black leading-[1.08] tracking-[-1.5px] text-[#0f2744] sm:text-[50px]">
              Paket simulasi yang kamu miliki.
            </h1>

            <p className="mt-5 max-w-[570px] text-[16px] font-medium leading-7 text-[#52657d]">
              Semua paket yang sudah kamu miliki tersimpan di sini. Pilih paket
              dan mulai kerjakan simulasi.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">

              <div className="rounded-xl border border-[#dce7f4] bg-white px-5 py-3 shadow-[0_4px_14px_rgba(31,55,84,0.04)]">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#7a8ca3]">
                  Paket Aktif
                </p>
                <p className="mt-0.5 text-xl font-black text-[#17243a]">
                  {paketList.length}
                </p>
              </div>

              <div className="rounded-xl border border-[#dce7f4] bg-white px-5 py-3 shadow-[0_4px_14px_rgba(31,55,84,0.04)]">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#7a8ca3]">
                  Ebook Dimiliki
                </p>
                <p className="mt-0.5 text-xl font-black text-[#2563eb]">
                  {ebookList.length}
                </p>
              </div>

            </div>

          </div>

          {/* KANAN - PREVIEW PAKET */}
          <div className="flex justify-center lg:justify-end">

            {paketList.length > 0 ? (
              <div className="w-full max-w-[500px] overflow-hidden rounded-[22px] border border-[#dfe6ee] bg-white shadow-[0_12px_30px_rgba(31,55,84,0.08)]">

                {/* WINDOW HEADER */}
                <div className="flex h-10 items-center gap-1.5 border-b border-[#e8edf3] px-4">

                  <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
                  <span className="h-2 w-2 rounded-full bg-[#ffbd2e]" />
                  <span className="h-2 w-2 rounded-full bg-[#28c840]" />

                </div>

                {/* PREVIEW */}
                <div className="px-6 pb-6 pt-5">

                  <div className="flex items-start justify-between gap-4">

                    <div className="min-w-0">

                      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#2563eb]">
                        Paket Aktif
                      </p>

                      <h2 className="mt-2 truncate text-xl font-black text-[#17243a]">
                        {paketList[0].nama}
                      </h2>

                      <p className="mt-1.5 line-clamp-2 text-sm font-medium leading-5 text-[#66778d]">
                        {paketList[0].deskripsi || 'Paket simulasi Rumah Simulasi.'}
                      </p>

                    </div>

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#eff6ff]">
                      <img
                        src="/logo.png"
                        alt="Rumah Simulasi"
                        className="h-8 w-8 object-contain"
                      />
                    </div>

                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">

                    <div className="rounded-xl bg-[#f7faff] px-4 py-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#8a99ab]">
                        Durasi
                      </p>
                      <p className="mt-1 text-sm font-black text-[#17243a]">
                        {paketList[0].waktu_menit} menit
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#f7faff] px-4 py-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#8a99ab]">
                        Status
                      </p>
                      <p className="mt-1 text-sm font-black text-[#16a36f]">
                        Aktif
                      </p>
                    </div>

                  </div>

                  <button
                    onClick={async () => {
                      const { data: userData } = await supabase.auth.getUser()

                      if (!userData.user) {
                        alert('Anda harus login terlebih dahulu untuk mengerjakan soal.')
                        router.push('/login')
                        return
                      }

                      router.push(`/ujian?paket=${paketList[0].id}`)
                    }}
                    className="mt-4 flex w-full items-center justify-between rounded-xl bg-[#2563eb] px-5 py-3.5 text-sm font-black text-white shadow-[0_6px_14px_rgba(37,99,235,0.18)] transition hover:bg-[#1d4ed8]"
                  >
                    <span>Mulai Paket</span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-base">
                      →
                    </span>
                  </button>

                </div>

              </div>
            ) : (
              <div className="flex w-full max-w-[500px] min-h-[300px] items-center justify-center rounded-[22px] border border-[#dfe6ee] bg-white shadow-[0_12px_30px_rgba(31,55,84,0.06)]">

                <div className="text-center">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eff6ff]">
                    <img
                      src="/logo.png"
                      alt="Rumah Simulasi"
                      className="h-10 w-10 object-contain"
                    />
                  </div>

                  <p className="mt-4 text-sm font-bold text-[#64748b]">
                    Belum ada paket aktif
                  </p>

                </div>

              </div>
            )}

          </div>

        </section>

        {/* EMPTY STATE */}
        {paketList.length === 0 ? (
          <section className="mx-auto mt-12 max-w-2xl rounded-[22px] border border-[#dfe6ee] bg-white px-6 py-20 text-center shadow-[0_8px_24px_rgba(31,55,84,0.05)]">

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[#eff6ff]">
              <img
                src="/logo.png"
                alt="Rumah Simulasi"
                className="h-12 w-12 object-contain"
              />
            </div>

            <h2 className="mt-6 text-2xl font-black text-[#17243a]">
              Belum Ada Paket
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-[#64748b]">
              Kamu belum memiliki paket simulasi. Pilih paket yang sesuai dan
              mulai persiapanmu.
            </p>

            <button
              onClick={() => router.push('/')}
              className="mt-7 rounded-xl bg-[#2563eb] px-7 py-3 text-sm font-black text-white shadow-[0_6px_14px_rgba(37,99,235,0.18)] transition hover:bg-[#1d4ed8]"
            >
              Lihat Paket Simulasi
            </button>

          </section>
        ) : (
          <>
            {/* TITLE */}
            <section className="pt-12">

              <div className="mb-6 flex items-end justify-between">

                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#2563eb]">
                    Koleksi Simulasi
                  </p>

                  <h2 className="mt-2 text-3xl font-black tracking-tight text-[#0f2744]">
                    Paket yang Kamu Miliki
                  </h2>

                  <p className="mt-2 text-sm font-medium text-[#64748b]">
                    Pilih paket untuk mulai mengerjakan simulasi.
                  </p>
                </div>

                <span className="hidden rounded-full border border-[#dce5ef] bg-white px-4 py-2 text-xs font-extrabold text-[#52657d] sm:block">
                  {paketList.length} Paket
                </span>

              </div>

              {/* HORIZONTAL CARD LIST */}
              <div className="overflow-x-auto pb-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#cbd5e1]">

                <div className="flex w-max gap-5">

                  {paketList.map((paket, index) => (
                    <article
                      key={paket.id}
                      className="w-[360px] shrink-0 overflow-hidden rounded-[20px] border border-[#dfe6ee] bg-white shadow-[0_10px_28px_rgba(31,55,84,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(31,55,84,0.11)] sm:w-[390px]"
                    >

                      {/* CARD HEADER */}
                      <div className="flex items-center justify-between border-b border-[#e8edf3] px-5 py-4">

                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
                          <span className="h-2 w-2 rounded-full bg-[#ffbd2e]" />
                          <span className="h-2 w-2 rounded-full bg-[#28c840]" />
                        </div>

                        <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#94a3b8]">
                          Paket {String(index + 1).padStart(2, '0')}
                        </span>

                      </div>

                      {/* CARD CONTENT */}
                      <div className="px-5 pb-5 pt-5">

                        <div className="flex items-start gap-4">

                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#eff6ff]">
                            <img
                              src="/logo.png"
                              alt=""
                              className="h-8 w-8 object-contain"
                            />
                          </div>

                          <div className="min-w-0">

                            <h3 className="line-clamp-2 text-lg font-black leading-6 text-[#17243a]">
                              {paket.nama}
                            </h3>

                            <p className="mt-1.5 line-clamp-2 text-sm font-medium leading-5 text-[#687990]">
                              {paket.deskripsi || 'Paket simulasi Rumah Simulasi.'}
                            </p>

                          </div>

                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3">

                          <div className="rounded-xl bg-[#f7faff] px-4 py-3">
                            <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#8a99ab]">
                              Durasi
                            </p>

                            <p className="mt-1 text-base font-black text-[#17243a]">
                              {paket.waktu_menit}
                              <span className="ml-1 text-xs font-bold text-[#64748b]">
                                menit
                              </span>
                            </p>
                          </div>

                          <div className="rounded-xl bg-[#f7faff] px-4 py-3">
                            <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#8a99ab]">
                              Status
                            </p>

                            <p className="mt-1 text-base font-black text-[#16a36f]">
                              Aktif
                            </p>
                          </div>

                        </div>

                        <div className="mt-5 border-t border-dashed border-[#e2e8f0] pt-4">

                          <div className="flex items-center justify-between">

                            <div>
                              <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#8a99ab]">
                                Periode
                              </p>

                              <p className="mt-1 text-xs font-bold text-[#52657d]">
                                1 Jan 2026 — 31 Des 2026
                              </p>
                            </div>

                            <span className="rounded-full bg-[#ecfdf5] px-3 py-1 text-[10px] font-extrabold text-[#15803d]">
                              AKTIF
                            </span>

                          </div>

                        </div>

                      </div>

                      {/* BUTTON */}
                      <div className="border-t border-[#edf1f5] bg-[#fafcff] p-5">

                        <button
                          onClick={async () => {
                            const { data: userData } = await supabase.auth.getUser()

                            if (!userData.user) {
                              alert('Anda harus login terlebih dahulu untuk mengerjakan soal.')
                              router.push('/login')
                              return
                            }

                            router.push(`/ujian?paket=${paket.id}`)
                          }}
                          className="flex w-full items-center justify-between rounded-xl bg-[#2563eb] px-5 py-3.5 text-sm font-black text-white shadow-[0_6px_14px_rgba(37,99,235,0.16)] transition hover:bg-[#1d4ed8]"
                        >

                          <span>Mulai</span>

                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-base">
                            →
                          </span>

                        </button>

                      </div>

                    </article>
                  ))}

                </div>

              </div>

            </section>

            {/* BOTTOM INFO */}
            <div className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-[#8492a5]">

              <span className="hidden sm:inline">
                Geser ke kanan untuk melihat paket lainnya
              </span>

              <span className="text-base">
                →
              </span>

            </div>

          </>
        )}

        {/* EBOOK SAYA */}
        <section className="pt-14">

          <div className="mb-6 flex items-end justify-between">

            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#2563eb]">
                Koleksi Bacaan
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-[#0f2744]">
                Ebook yang Kamu Miliki
              </h2>

              <p className="mt-2 text-sm font-medium text-[#64748b]">
                Baca langsung atau download ebook yang sudah kamu beli.
              </p>
            </div>

            <span className="hidden rounded-full border border-[#dce5ef] bg-white px-4 py-2 text-xs font-extrabold text-[#52657d] sm:block">
              {ebookList.length} Ebook
            </span>

          </div>

          {ebookList.length === 0 ? (
            <div className="rounded-[22px] border border-[#dfe6ee] bg-white px-6 py-16 text-center shadow-[0_8px_24px_rgba(31,55,84,0.05)]">
              <p className="text-sm font-bold text-[#64748b]">
                Kamu belum memiliki ebook.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto pb-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#cbd5e1]">
              <div className="flex w-max gap-5">
                {ebookList.map((ebook) => (
                  <article
                    key={ebook.id}
                    className="flex w-[300px] shrink-0 flex-col overflow-hidden rounded-[20px] border border-[#dfe6ee] bg-white shadow-[0_10px_28px_rgba(31,55,84,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(31,55,84,0.11)]"
                  >
                    {ebook.sampul_gambar && (
                      <img
                        src={ebook.sampul_gambar}
                        alt={ebook.judul}
                        className="h-40 w-full object-cover"
                      />
                    )}

                    <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
                      <h3 className="line-clamp-2 text-base font-black leading-6 text-[#17243a]">
                        {ebook.judul}
                      </h3>

                      <p className="mt-1.5 line-clamp-2 text-sm font-medium leading-5 text-[#687990]">
                        {ebook.deskripsi}
                      </p>

                      <a
                        href={ebook.link_drive}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 flex w-full items-center justify-between rounded-xl bg-[#2563eb] px-5 py-3 text-sm font-black text-white shadow-[0_6px_14px_rgba(37,99,235,0.16)] transition hover:bg-[#1d4ed8]"
                      >
                        <span>Baca / Download</span>
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-base">
                          →
                        </span>
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

        </section>

      </div>
    </main>
  )
}