'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../utils/supabase'

export default function KelolaEbookPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [ebookList, setEbookList] = useState<any[]>([])
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<any>({})

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

  const fetchEbook = async () => {
    const { data } = await supabase.from('ebook').select('*').order('id')
    if (data) setEbookList(data)
  }

  useEffect(() => {
    if (!checking) fetchEbook()
  }, [checking])

  const mulaiEdit = (ebook: any) => {
    setEditId(ebook.id)
    setEditData({
      judul: ebook.judul,
      sampul_gambar: ebook.sampul_gambar,
      deskripsi: ebook.deskripsi,
      harga: ebook.harga,
      link_drive: ebook.link_drive,
    })
  }

  const simpanEdit = async (id: string) => {
    const { error } = await supabase
      .from('ebook')
      .update({
        judul: editData.judul,
        sampul_gambar: editData.sampul_gambar,
        deskripsi: editData.deskripsi,
        harga: Number(editData.harga),
        link_drive: editData.link_drive,
      })
      .eq('id', id)
    if (error) {
      alert(error.message)
    } else {
      setEditId(null)
      fetchEbook()
    }
  }

  const hapusEbook = async (id: string) => {
    if (!confirm('Yakin mau hapus ebook ini?')) return
    const { error } = await supabase.from('ebook').delete().eq('id', id)
    if (error) alert(error.message)
    else fetchEbook()
  }

  if (checking) return <p style={{ padding: '24px' }}>Memeriksa akses...</p>

  const inputStyle = { padding: '6px', border: '1px solid #9ca3af', borderRadius: '4px', width: '100%', marginTop: '4px' }

  return (
    <div style={{ padding: '24px', maxWidth: '600px' }}>
      <h1>Kelola Ebook</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
        {ebookList.length === 0 && <p>Belum ada ebook.</p>}
        {ebookList.map((ebook) => (
          <div key={ebook.id} style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '16px' }}>
            {editId === ebook.id ? (
              <div>
                <label>Judul</label>
                <input style={inputStyle} value={editData.judul} onChange={(e) => setEditData({ ...editData, judul: e.target.value })} />

                <label>Foto Sampul (link gambar)</label>
                <input style={inputStyle} value={editData.sampul_gambar} onChange={(e) => setEditData({ ...editData, sampul_gambar: e.target.value })} />

                <label>Deskripsi</label>
                <textarea style={inputStyle} value={editData.deskripsi} onChange={(e) => setEditData({ ...editData, deskripsi: e.target.value })} />

                <label>Harga</label>
                <input type="number" style={inputStyle} value={editData.harga} onChange={(e) => setEditData({ ...editData, harga: e.target.value })} />

                <label>Link Google Drive</label>
                <input style={inputStyle} value={editData.link_drive} onChange={(e) => setEditData({ ...editData, link_drive: e.target.value })} />

                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button onClick={() => simpanEdit(ebook.id)} style={{ padding: '6px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px' }}>Simpan</button>
                  <button onClick={() => setEditId(null)} style={{ padding: '6px 12px', background: '#9ca3af', color: '#fff', border: 'none', borderRadius: '4px' }}>Batal</button>
                </div>
              </div>
            ) : (
              <div>
                <h3>{ebook.judul}</h3>
                <p>{ebook.deskripsi}</p>
                <p>Rp{Number(ebook.harga).toLocaleString('id-ID')}</p>

                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button onClick={() => mulaiEdit(ebook)} style={{ padding: '6px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px' }}>Edit</button>
                  <button onClick={() => hapusEbook(ebook.id)} style={{ padding: '6px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px' }}>Hapus</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}