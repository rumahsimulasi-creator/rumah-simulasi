'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../utils/supabase'

export default function AdminPage() {
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
  const [nama, setNama] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [waktu, setWaktu] = useState('')
  const [harga, setHarga] = useState('0')
  const [butuhPendaftaran, setButuhPendaftaran] = useState(false)
  const [syaratPendaftaran, setSyaratPendaftaran] = useState('')

  const handleTambahPaket = async () => {
    const { error } = await supabase.from('paket').insert({
      nama,
      deskripsi,
      waktu_menit: Number(waktu),
      harga: Number(harga),
      butuh_pendaftaran: butuhPendaftaran,
      syarat_pendaftaran: butuhPendaftaran ? syaratPendaftaran : null,
    })
    if (error) alert(error.message)
    else {
      alert('Paket berhasil ditambahkan!')
      setNama('')
      setDeskripsi('')
      setWaktu('')
      setHarga('0')
      setButuhPendaftaran(false)
      setSyaratPendaftaran('')
    }
  }
  if (checking) return <p style={{ padding: '24px' }}>Memeriksa akses...</p>
  return (
    <div style={{ padding: '24px' }}>
      <h1>Admin - Tambah Paket</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '280px', marginTop: '16px' }}>
        <input
          type="text"
          placeholder="Nama Paket"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          style={{ padding: '8px', border: '1px solid #9ca3af', borderRadius: '4px' }}
        />
        <input
          type="text"
          placeholder="Deskripsi"
          value={deskripsi}
          onChange={(e) => setDeskripsi(e.target.value)}
          style={{ padding: '8px', border: '1px solid #9ca3af', borderRadius: '4px' }}
        />
        <input
          type="number"
          placeholder="Waktu (menit)"
          value={waktu}
          onChange={(e) => setWaktu(e.target.value)}
          style={{ padding: '8px', border: '1px solid #9ca3af', borderRadius: '4px' }}
        />
        <label style={{ fontSize: '14px', color: '#374151' }}>Harga (isi 0 kalau gratis)</label>
        <input
          type="number"
          placeholder="Harga (Rp)"
          value={harga}
          onChange={(e) => setHarga(e.target.value)}
          style={{ padding: '8px', border: '1px solid #9ca3af', borderRadius: '4px' }}
        />

        <label style={{ fontSize: '14px', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={butuhPendaftaran}
            onChange={(e) => setButuhPendaftaran(e.target.checked)}
          />
          Butuh Pendaftaran? (approval admin sebelum bisa dikerjakan)
        </label>

        {butuhPendaftaran && (
          <>
            <label style={{ fontSize: '14px', color: '#374151' }}>Syarat Pendaftaran</label>
            <textarea
              placeholder="Contoh: Follow Instagram @rumahsimulasi, Share ke 3 grup WA, dst."
              value={syaratPendaftaran}
              onChange={(e) => setSyaratPendaftaran(e.target.value)}
              style={{ padding: '8px', border: '1px solid #9ca3af', borderRadius: '4px' }}
            />
          </>
        )}

        <button onClick={handleTambahPaket} style={{ padding: '8px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px' }}>Tambah Paket</button>
      </div>
    </div>
  )
}