'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../utils/supabase'

export default function AdminPembelianEbookPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [pembelianList, setPembelianList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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

  const fetchPembelian = async () => {
    setLoading(true)
    const { data: pembelianData, error } = await supabase
      .from('pembelian_ebook')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !pembelianData) {
      setLoading(false)
      return
    }

    const userIds = pembelianData.map((p) => p.user_id)
    const ebookIds = pembelianData.map((p) => p.ebook_id)

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, nama, email')
      .in('id', userIds)

    const { data: ebookData } = await supabase
      .from('ebook')
      .select('id, judul, harga')
      .in('id', ebookIds)

    const gabung = pembelianData.map((p) => ({
      ...p,
      user_nama: profilesData?.find((u) => u.id === p.user_id)?.nama || '-',
      user_email: profilesData?.find((u) => u.id === p.user_id)?.email || '-',
      ebook_judul: ebookData?.find((e) => e.id === p.ebook_id)?.judul || '-',
      ebook_harga: ebookData?.find((e) => e.id === p.ebook_id)?.harga || 0,
    }))

    setPembelianList(gabung)
    setLoading(false)
  }

  useEffect(() => {
    if (!checking) fetchPembelian()
  }, [checking])

  const handleKonfirmasi = async (id: string) => {
    const { error } = await supabase
      .from('pembelian_ebook')
      .update({ status: 'lunas' })
      .eq('id', id)
    if (error) {
      alert(error.message)
    } else {
      alert('Pembelian ebook dikonfirmasi!')
      fetchPembelian()
    }
  }

  if (checking) return <p style={{ padding: '24px' }}>Memeriksa akses...</p>
  if (loading) return <p style={{ padding: '24px' }}>Memuat data...</p>

  return (
    <div style={{ padding: '24px', maxWidth: '700px' }}>
      <h1>Admin - Konfirmasi Pembelian Ebook</h1>
      {pembelianList.length === 0 ? (
        <p>Belum ada pembelian ebook.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
          {pembelianList.map((p) => (
            <div key={p.id} style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '16px' }}>
              <p><strong>{p.user_nama}</strong> ({p.user_email})</p>
              <p>Ebook: {p.ebook_judul} — Rp{Number(p.ebook_harga).toLocaleString('id-ID')}</p>
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