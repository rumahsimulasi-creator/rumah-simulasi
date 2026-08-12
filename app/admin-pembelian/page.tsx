'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../utils/supabase'

export default function AdminPembelianPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const cekAdmin = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        router.push('/login')
        return
      }
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userData.user.id)
        .single()
      if (profileData?.role !== 'admin') {
        router.push('/dashboard')
        return
      }
      setChecking(false)
    }
    cekAdmin()
  }, [])
  const [pembelianList, setPembelianList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPembelian = async () => {
    setLoading(true)
    const { data: pembelianData, error } = await supabase
      .from('pembelian')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !pembelianData) {
      setLoading(false)
      return
    }

    const userIds = pembelianData.map((p) => p.user_id)
    const paketIds = pembelianData.map((p) => p.paket_id)

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, nama, email')
      .in('id', userIds)

    const { data: paketData } = await supabase
      .from('paket')
      .select('id, nama, harga')
      .in('id', paketIds)

    const gabung = pembelianData.map((p) => ({
      ...p,
      user_nama: profilesData?.find((u) => u.id === p.user_id)?.nama || '-',
      user_email: profilesData?.find((u) => u.id === p.user_id)?.email || '-',
      paket_nama: paketData?.find((pk) => pk.id === p.paket_id)?.nama || '-',
      paket_harga: paketData?.find((pk) => pk.id === p.paket_id)?.harga || 0,
    }))

    setPembelianList(gabung)
    setLoading(false)
  }

  useEffect(() => {
    fetchPembelian()
  }, [])

  const handleKonfirmasi = async (id: string) => {
    const { error } = await supabase
      .from('pembelian')
      .update({ status: 'lunas' })
      .eq('id', id)
    if (error) {
      alert(error.message)
    } else {
      alert('Pembelian dikonfirmasi!')
      fetchPembelian()
    }
  }

  if (checking) return <p style={{ padding: '24px' }}>Memeriksa akses...</p>
  if (loading) return <p style={{ padding: '24px' }}>Memuat data...</p>
  return (
    <div style={{ padding: '24px', maxWidth: '700px' }}>
      <h1>Admin - Konfirmasi Pembelian</h1>
      {pembelianList.length === 0 ? (
        <p>Belum ada pembelian.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
          {pembelianList.map((p) => (
            <div key={p.id} style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '16px' }}>
              <p><strong>{p.user_nama}</strong> ({p.user_email})</p>
              <p>Paket: {p.paket_nama} — Rp{Number(p.paket_harga).toLocaleString('id-ID')}</p>
              <p>Status: <strong>{p.status}</strong></p>
              {p.status === 'menunggu_konfirmasi' && (
                <button
                  onClick={() => handleKonfirmasi(p.id)}
                  style={{ padding: '8px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px' }}
                >
                  Konfirmasi
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}