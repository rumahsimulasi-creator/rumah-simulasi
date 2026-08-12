'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../utils/supabase'

export default function RiwayatPage() {
  const [riwayatList, setRiwayatList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sudahLogin, setSudahLogin] = useState(true)
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

      if (!error && data) setRiwayatList(data)
      setLoading(false)
    }
    fetchRiwayat()
  }, [])

  if (loading) return <p style={{ padding: '24px' }}>Memuat riwayat...</p>
  if (!sudahLogin) return <p style={{ padding: '24px' }}>Silakan login untuk melihat riwayat nilai. <a href="/login">Login</a></p>

  return (
    <div style={{ padding: '24px', maxWidth: '600px' }}>
      <h1>Riwayat Nilai</h1>
      {riwayatList.length === 0 ? (
        <p>Belum ada riwayat ujian.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
          {riwayatList.map((item) => (
            <div
              key={item.id}
              style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '16px' }}
            >
              <p><strong>{item.paket?.nama}</strong></p>
              <p>Skor: {item.skor}</p>
              <p>Waktu: {new Date(item.waktu_selesai).toLocaleString('id-ID')}</p>
              <button
                onClick={() => router.push(`/pembahasan?hasil=${item.id}`)}
                style={{ padding: '6px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px' }}
              >
                Lihat Pembahasan
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}