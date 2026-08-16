'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../utils/supabase'

export default function AdminPromoPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [loading, setLoading] = useState(true)
  const [promoId, setPromoId] = useState<string | null>(null)

  const [judul, setJudul] = useState('')
  const [gambar, setGambar] = useState('')
  const [teks, setTeks] = useState('')
  const [aktif, setAktif] = useState(false)

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

  const fetchPromo = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('promo_popup')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (data) {
      setPromoId(data.id)
      setJudul(data.judul || '')
      setGambar(data.gambar || '')
      setTeks(data.teks || '')
      setAktif(data.aktif || false)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!checking) fetchPromo()
  }, [checking])

  const handleSimpan = async () => {
    if (promoId) {
      const { error } = await supabase
        .from('promo_popup')
        .update({ judul, gambar, teks, aktif })
        .eq('id', promoId)
      if (error) {
        alert(error.message)
        return
      }
    } else {
      const { error } = await supabase
        .from('promo_popup')
        .insert({ judul, gambar, teks, aktif })
      if (error) {
        alert(error.message)
        return
      }
    }
    alert('Promo berhasil disimpan!')
    fetchPromo()
  }

  if (checking) return <p style={{ padding: '24px' }}>Memeriksa akses...</p>
  if (loading) return <p style={{ padding: '24px' }}>Memuat data...</p>

  const inputStyle = { padding: '8px', border: '1px solid #9ca3af', borderRadius: '4px', width: '100%' }

  return (
    <div style={{ padding: '24px' }}>
      <h1>Admin - Pop-up Promosi</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '320px', marginTop: '16px' }}>
        <label>Judul</label>
        <input type="text" value={judul} onChange={(e) => setJudul(e.target.value)} style={inputStyle} />

        <label>Gambar (link)</label>
        <input type="text" value={gambar} onChange={(e) => setGambar(e.target.value)} style={inputStyle} />

        <label>Teks</label>
        <textarea value={teks} onChange={(e) => setTeks(e.target.value)} style={inputStyle} />

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input type="checkbox" checked={aktif} onChange={(e) => setAktif(e.target.checked)} />
          Aktifkan Pop-up
        </label>

        <button
          onClick={handleSimpan}
          style={{ padding: '8px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', marginTop: '8px' }}
        >
          Simpan
        </button>
      </div>
    </div>
  )
}