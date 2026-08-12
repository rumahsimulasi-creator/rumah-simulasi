'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../utils/supabase'

export default function KelolaPaketPage() {
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
  const [paketList, setPaketList] = useState<any[]>([])
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<any>({})

  const fetchPaket = async () => {
    const { data } = await supabase.from('paket').select('*').order('id')
    if (data) setPaketList(data)
  }

  useEffect(() => {
    fetchPaket()
  }, [])

  const mulaiEdit = (paket: any) => {
    setEditId(paket.id)
    setEditData({
      nama: paket.nama,
      deskripsi: paket.deskripsi,
      waktu_menit: paket.waktu_menit,
      harga: paket.harga,
    })
  }

  const simpanEdit = async (id: string) => {
    const { error } = await supabase
      .from('paket')
      .update({
        nama: editData.nama,
        deskripsi: editData.deskripsi,
        waktu_menit: Number(editData.waktu_menit),
        harga: Number(editData.harga),
      })
      .eq('id', id)
    if (error) {
      alert(error.message)
    } else {
      setEditId(null)
      fetchPaket()
    }
  }

  const hapusPaket = async (id: string) => {
    if (!confirm('Yakin mau hapus paket ini? Soal di dalamnya juga bisa ikut kehapus.')) return
    const { error } = await supabase.from('paket').delete().eq('id', id)
    if (error) alert(error.message)
    else fetchPaket()
  }

  const inputStyle = { padding: '6px', border: '1px solid #9ca3af', borderRadius: '4px', width: '100%', marginTop: '4px' }

  if (checking) return <p style={{ padding: '24px' }}>Memeriksa akses...</p>
  return (
    <div style={{ padding: '24px', maxWidth: '600px' }}>
      <h1>Kelola Paket</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
        {paketList.map((paket) => (
          <div key={paket.id} style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '16px' }}>
            {editId === paket.id ? (
              <div>
                <label>Nama</label>
                <input style={inputStyle} value={editData.nama} onChange={(e) => setEditData({ ...editData, nama: e.target.value })} />
                <label>Deskripsi</label>
                <input style={inputStyle} value={editData.deskripsi} onChange={(e) => setEditData({ ...editData, deskripsi: e.target.value })} />
                <label>Waktu (menit)</label>
                <input type="number" style={inputStyle} value={editData.waktu_menit} onChange={(e) => setEditData({ ...editData, waktu_menit: e.target.value })} />
                <label>Harga</label>
                <input type="number" style={inputStyle} value={editData.harga} onChange={(e) => setEditData({ ...editData, harga: e.target.value })} />

                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button onClick={() => simpanEdit(paket.id)} style={{ padding: '6px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px' }}>Simpan</button>
                  <button onClick={() => setEditId(null)} style={{ padding: '6px 12px', background: '#9ca3af', color: '#fff', border: 'none', borderRadius: '4px' }}>Batal</button>
                </div>
              </div>
            ) : (
              <div>
                <h3>{paket.nama}</h3>
                <p>{paket.deskripsi}</p>
                <p>Waktu: {paket.waktu_menit} menit</p>
                <p>Harga: {paket.harga === 0 ? 'Gratis' : `Rp${Number(paket.harga).toLocaleString('id-ID')}`}</p>

                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button onClick={() => mulaiEdit(paket)} style={{ padding: '6px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px' }}>Edit</button>
                  <button onClick={() => hapusPaket(paket.id)} style={{ padding: '6px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px' }}>Hapus</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}