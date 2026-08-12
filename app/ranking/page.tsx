'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabase'

export default function RankingPage() {
  const [paketList, setPaketList] = useState<any[]>([])
  const [rankingData, setRankingData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      const { data: userData } = await supabase.auth.getUser()
      const uid = userData.user?.id ?? null
      setUserId(uid)

      const { data: paketData } = await supabase
        .from('paket')
        .select('*')

      if (!paketData || paketData.length === 0) {
        setPaketList([])
        setRankingData([])
        setLoading(false)
        return
      }

      setPaketList(paketData)

      const hasilSemua: any[] = []

      for (const paket of paketData) {
        const { data: hasilData } = await supabase
          .from('hasil_ujian')
          .select('*')
          .eq('paket_id', paket.id)
          .order('skor', { ascending: false })
          .limit(20)

        hasilSemua.push({
          paket,
          hasil: hasilData || [],
        })
      }

      const semuaUserId = hasilSemua.flatMap((item) =>
        item.hasil.map((h: any) => h.user_id)
      )

      const uniqueUserIds = [...new Set(semuaUserId)]

      let profilesData: any[] = []

      if (uniqueUserIds.length > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('id, nama')
          .in('id', uniqueUserIds)

        profilesData = data || []
      }

      const hasilDenganNama = hasilSemua.map((item) => ({
        paket: item.paket,
        ranking: item.hasil.map((hasil: any) => ({
          ...hasil,
          nama:
            profilesData.find(
              (profile: any) => profile.id === hasil.user_id
            )?.nama || 'Tanpa Nama',
          isCurrentUser: hasil.user_id === uid,
        })),
      }))

      setRankingData(hasilDenganNama)
      setLoading(false)
    }

    fetchData()
  }, [])

  return (
    <main className="min-h-screen bg-[#f8fafc] px-5 py-10 font-sans sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1180px]">

        {/* HERO */}
        <section className="grid items-center gap-10 border-b border-[#e5eaf0] pb-12 lg:grid-cols-[1fr_0.9fr] lg:gap-14">

          {/* KIRI */}
          <div>

            <span className="inline-flex rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-4 py-1.5 text-xs font-bold text-[#2563eb]">
              Ranking Peserta
            </span>

            <h1 className="mt-6 max-w-[650px] text-[42px] font-black leading-[1.08] tracking-[-1.5px] text-[#0f2744] sm:text-[50px]">
              Lihat posisi kamu di antara peserta lainnya.
            </h1>

            <p className="mt-5 max-w-[570px] text-[16px] font-medium leading-7 text-[#52657d]">
              Bandingkan skor hasil simulasi dan lihat siapa yang berada di
              peringkat teratas.
            </p>

            <div className="mt-7 flex items-center gap-3">

              <div className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" />

              <span className="text-sm font-bold text-[#52657d]">
                Ranking diperbarui berdasarkan hasil ujian
              </span>

            </div>

          </div>

          {/* KANAN - RANKING PREVIEW */}
          <div className="flex justify-center lg:justify-end">

            {loading ? (
              <div className="w-full max-w-[500px] rounded-[22px] border border-[#dfe6ee] bg-white p-6 shadow-[0_12px_30px_rgba(31,55,84,0.08)]">

                <div className="flex gap-1.5 border-b border-[#edf1f5] pb-4">
                  <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
                  <span className="h-2 w-2 rounded-full bg-[#ffbd2e]" />
                  <span className="h-2 w-2 rounded-full bg-[#28c840]" />
                </div>

                <div className="flex h-[260px] items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#dbeafe] border-t-[#2563eb]" />
                </div>

              </div>
            ) : rankingData.length > 0 ? (
              <RankingCard
                paket={rankingData[0].paket}
                ranking={rankingData[0].ranking}
                compact
              />
            ) : (
              <div className="w-full max-w-[500px] rounded-[22px] border border-[#dfe6ee] bg-white p-10 text-center shadow-[0_12px_30px_rgba(31,55,84,0.08)]">

                <img
                  src="/logo.png"
                  alt="Rumah Simulasi"
                  className="mx-auto h-20 w-20 object-contain"
                />

                <p className="mt-5 text-sm font-bold text-[#52657d]">
                  Belum ada ranking.
                </p>

              </div>
            )}

          </div>

        </section>

        {/* DAFTAR RANKING */}
        <section className="pt-12">

          <div className="mb-6">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#2563eb]">
              Leaderboard
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight text-[#0f2744]">
              Ranking Simulasi
            </h2>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <p className="text-sm font-bold text-[#64748b]">
                Memuat ranking...
              </p>
            </div>
          ) : rankingData.length === 0 ? (
            <div className="rounded-[20px] border border-[#dfe6ee] bg-white px-6 py-16 text-center">
              <p className="text-sm font-bold text-[#64748b]">
                Belum ada peserta yang mengerjakan paket.
              </p>
            </div>
          ) : (

            /* HORIZONTAL SCROLL */
            <div className="overflow-x-auto pb-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#cbd5e1]">

              <div className="flex w-max gap-5">

                {rankingData.map((item) => (
                  <RankingCard
                    key={item.paket.id}
                    paket={item.paket}
                    ranking={item.ranking}
                  />
                ))}

              </div>

            </div>
          )}

        </section>

      </div>
    </main>
  )
}


/* =========================================================
   RANKING CARD
========================================================= */

function RankingCard({
  paket,
  ranking,
  compact = false,
}: {
  paket: any
  ranking: any[]
  compact?: boolean
}) {
  const displayedRanking = ranking.slice(0, 3)

  return (
    <div
      className={`overflow-hidden rounded-[20px] border border-[#dfe6ee] bg-white shadow-[0_10px_28px_rgba(31,55,84,0.08)] ${
        compact
          ? 'w-full max-w-[500px]'
          : 'w-[360px] shrink-0 sm:w-[390px]'
      }`}
    >

      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-[#e8edf3] px-5 py-4">

        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
          <span className="h-2 w-2 rounded-full bg-[#ffbd2e]" />
          <span className="h-2 w-2 rounded-full bg-[#28c840]" />
        </div>

        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#94a3b8]">
          Ranking
        </span>

      </div>

      {/* PAKET */}
      <div className="px-5 pb-3 pt-5">

        <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#2563eb]">
          Simulasi
        </p>

        <h3 className="mt-1 truncate text-base font-black text-[#17243a]">
          {paket.nama}
        </h3>

      </div>

      {/* PESERTA */}
      {ranking.length === 0 ? (
        <div className="px-5 py-10 text-center">

          <p className="text-sm font-semibold text-[#718198]">
            Belum ada peserta.
          </p>

        </div>
      ) : (
        <div>

          {displayedRanking.map((item, index) => {
            const peringkat = index + 1

            return (
              <div
                key={item.id}
                className="flex items-center justify-between border-t border-[#edf1f5] px-5 py-3.5"
              >

                <div className="flex min-w-0 items-center gap-3">

                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                      peringkat === 1
                        ? 'bg-[#eaf2ff] text-[#2563eb]'
                        : peringkat === 2
                        ? 'bg-[#f1f5f9] text-[#64748b]'
                        : 'bg-[#f8eee8] text-[#a16207]'
                    }`}
                  >
                    {peringkat}
                  </span>

                  <span className="truncate text-sm font-bold text-[#40536d]">
                    {item.isCurrentUser ? 'Kamu' : item.nama}
                  </span>

                </div>

                <span className="ml-4 text-sm font-black text-[#17243a]">
                  {item.skor}
                </span>

              </div>
            )
          })}

          {/* KAMU JIKA TIDAK MASUK TOP 3 */}
          {ranking.length > 3 &&
            (() => {
              const currentUserIndex = ranking.findIndex(
                (item) => item.isCurrentUser
              )

              if (currentUserIndex === -1 || currentUserIndex < 3) {
                return null
              }

              const currentUser = ranking[currentUserIndex]

              return (
                <>
                  <div className="flex items-center justify-center border-t border-[#edf1f5] py-1.5">
                    <span className="text-[11px] font-bold text-[#94a3b8]">
                      •••
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-[#eef4ff] px-5 py-3.5">

                    <div className="flex min-w-0 items-center gap-3">

                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#dbeafe] text-[10px] font-black text-[#2563eb]">
                        {currentUserIndex + 1}
                      </span>

                      <span className="text-sm font-black text-[#2448a5]">
                        Kamu
                      </span>

                    </div>

                    <span className="text-sm font-black text-[#2563eb]">
                      {currentUser.skor}
                    </span>

                  </div>
                </>
              )
            })()}

        </div>
      )}

      {/* FOOTER */}
      <div className="border-t border-[#edf1f5] bg-[#fafcff] px-5 py-3">

        <p className="text-[11px] font-semibold text-[#8a98aa]">
          {ranking.length > 0
            ? `${ranking.length} peserta`
            : 'Belum ada peserta'}
        </p>

      </div>

    </div>
  )
}