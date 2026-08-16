'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../utils/supabase'

export default function AdminBundlingPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  const [paketList, setPaketList] = useState<any[]>([])
  const [nama, setNama] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [harga, setHarga] = useState('0')
  const [paketTerpilih, setPaketTerpilih] = useState<string[]>([])

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

  useEffect(() => {
    const fetchPaket = async () => {
      const { data } = await supabase.from('paket').select('*').order('id')
      if (data) setPaketList(data)
    }
    if (!checking) fetchPaket()
  }, [checking])

  const togglePaket = (id: string) => {
    setPaketTerpilih((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const handleBuatBundling = async () => {
    if (paketTerpilih.length === 0) {
      alert('Pilih minimal 1 paket.')
      return
    }

    const { data: bundlingData, error } = await supabase
      .from('paket_bundling')
      .insert({ nama, deskripsi, harga: Number(harga) })
      .select()
      .single()

    if (error) {
      alert(error.message)
      return
    }

    const rows = paketTerpilih.map((paketId) => ({
      bundling_id: bundlingData.id,
      paket_id: paketId,
    }))

    const { error: isiError } = await supabase.from('bundling_isi').insert(rows)

    if (isiError) {
      alert(isiError.message)
      return
    }

    alert('Bundling berhasil dibuat!')
    setNama('')
    setDeskripsi('')
    setHarga('0')
    setPaketTerpilih([])
  }

  if (checking) return <p style={{ padding: '24px' }}>Memeriksa akses...</p>

  const inputStyle = { padding: '8px', border: '1px solid #9ca3af', borderRadius: '4px', width: '100%' }

  return (
    <div style={{ padding: '24px' }}>
      <h1>Admin - Buat Paket Bundling</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '400px', marginTop: '16px' }}>
        <label>Nama Bundling</label>
        <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} style={inputStyle} />

        <label>Deskripsi</label>
        <textarea value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} style={inputStyle} />

        <label>Harga Bundling (Rp)</label>
        <input type="number" value={harga} onChange={(e) => setHarga(e.target.value)} style={inputStyle} />

        <label>Pilih Paket yang Digabung</label>
        <div style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '10px', maxHeight: '250px', overflowY: 'auto' }}>
          {paketList.map((paket) => (
            <label key={paket.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
              <input
                type="checkbox"
                checked={paketTerpilih.includes(paket.id)}
                onChange={() => togglePaket(paket.id)}
              />
              {paket.nama} ({paket.harga === 0 ? 'Gratis' : `Rp${Number(paket.harga).toLocaleString('id-ID')}`})
            </label>
          ))}
        </div>

        <button
          onClick={handleBuatBundling}
          style={{ padding: '8px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', marginTop: '8px' }}
        >
          Buat Bundling
        </button>
      </div>
    </div>
  )
}