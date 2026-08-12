'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../utils/supabase'

export default function AdminEbookPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  const [judul, setJudul] = useState('')
  const [sampulGambar, setSampulGambar] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [harga, setHarga] = useState('0')
  const [linkDrive, setLinkDrive] = useState('')

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

  const handleTambahEbook = async () => {
    const { error } = await supabase.from('ebook').insert({
      judul,
      sampul_gambar: sampulGambar,
      deskripsi,
      harga: Number(harga),
      link_drive: linkDrive,
    })
    if (error) {
      alert(error.message)
    } else {
      alert('Ebook berhasil ditambahkan!')
      setJudul('')
      setSampulGambar('')
      setDeskripsi('')
      setHarga('0')
      setLinkDrive('')
    }
  }

  if (checking) return <p style={{ padding: '24px' }}>Memeriksa akses...</p>

  const inputStyle = { padding: '8px', border: '1px solid #9ca3af', borderRadius: '4px', width: '100%' }

  return (
    <div style={{ padding: '24px' }}>
      <h1>Admin - Tambah Ebook</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '320px', marginTop: '16px' }}>
        <label>Judul Ebook</label>
        <input type="text" value={judul} onChange={(e) => setJudul(e.target.value)} style={inputStyle} />

        <label>Foto Sampul (link gambar)</label>
        <input type="text" value={sampulGambar} onChange={(e) => setSampulGambar(e.target.value)} style={inputStyle} />

        <label>Deskripsi</label>
        <textarea value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} style={inputStyle} />

        <label>Harga (Rp)</label>
        <input type="number" value={harga} onChange={(e) => setHarga(e.target.value)} style={inputStyle} />

        <label>Link Google Drive (PDF)</label>
        <input type="text" value={linkDrive} onChange={(e) => setLinkDrive(e.target.value)} style={inputStyle} />

        <button
          onClick={handleTambahEbook}
          style={{ padding: '8px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', marginTop: '8px' }}
        >
          Tambah Ebook
        </button>
      </div>
    </div>
  )
}