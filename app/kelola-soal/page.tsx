'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../utils/supabase'

export default function KelolaSoalPage() {
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
  const [paketFilter, setPaketFilter] = useState('')
  const [soalList, setSoalList] = useState<any[]>([])
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<any>({})

  useEffect(() => {
    const fetchPaket = async () => {
      const { data } = await supabase.from('paket').select('*')
      if (data) {
        setPaketList(data)
        if (data.length > 0) setPaketFilter(data[0].id)
      }
    }
    fetchPaket()
  }, [])

  const fetchSoal = async () => {
    if (!paketFilter) return
    const { data } = await supabase.from('soal').select('*').eq('paket_id', paketFilter)
    if (data) setSoalList(data)
  }

  useEffect(() => {
    fetchSoal()
  }, [paketFilter])

  const mulaiEdit = (soal: any) => {
    setEditId(soal.id)
    setEditData({ ...soal })
  }

  const isTKPEdit = editData.kategori === 'TKP'

  const simpanEdit = async (id: string) => {
    const { error } = await supabase
      .from('soal')
      .update({
        kategori: editData.kategori,
        pertanyaan_teks: editData.pertanyaan_teks,
        pertanyaan_gambar: editData.pertanyaan_gambar,
        pilihan_a_teks: editData.pilihan_a_teks,
        pilihan_b_teks: editData.pilihan_b_teks,
        pilihan_c_teks: editData.pilihan_c_teks,
        pilihan_d_teks: editData.pilihan_d_teks,
        pilihan_e_teks: editData.pilihan_e_teks,
        jawaban_benar: isTKPEdit ? null : editData.jawaban_benar,
        bobot_a: isTKPEdit ? Number(editData.bobot_a) : null,
        bobot_b: isTKPEdit ? Number(editData.bobot_b) : null,
        bobot_c: isTKPEdit ? Number(editData.bobot_c) : null,
        bobot_d: isTKPEdit ? Number(editData.bobot_d) : null,
        bobot_e: isTKPEdit ? Number(editData.bobot_e) : null,
        pembahasan_teks: editData.pembahasan_teks,
      })
      .eq('id', id)
    if (error) {
      alert(error.message)
    } else {
      setEditId(null)
      fetchSoal()
    }
  }

  const hapusSoal = async (id: string) => {
    if (!confirm('Yakin mau hapus soal ini?')) return
    const { error } = await supabase.from('soal').delete().eq('id', id)
    if (error) alert(error.message)
    else fetchSoal()
  }

  const inputStyle = { padding: '6px', border: '1px solid #9ca3af', borderRadius: '4px', width: '100%', marginTop: '4px' }

  if (checking) return <p style={{ padding: '24px' }}>Memeriksa akses...</p>
  return (
    <div style={{ padding: '24px', maxWidth: '600px' }}>
      <h1>Kelola Soal</h1>

      <select value={paketFilter} onChange={(e) => setPaketFilter(e.target.value)} style={{ ...inputStyle, marginTop: '16px' }}>
        {paketList.map((p) => (
          <option key={p.id} value={p.id}>{p.nama}</option>
        ))}
      </select>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
        {soalList.length === 0 && <p>Belum ada soal di paket ini.</p>}
        {soalList.map((soal, index) => (
          <div key={soal.id} style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '16px' }}>
            {editId === soal.id ? (
              <div>
                <label>Kategori</label>
                <select style={inputStyle} value={editData.kategori} onChange={(e) => setEditData({ ...editData, kategori: e.target.value })}>
                  <option value="TWK">TWK</option>
                  <option value="TIU">TIU</option>
                  <option value="TKP">TKP</option>
                </select>

                <label>Pertanyaan</label>
                <textarea style={inputStyle} value={editData.pertanyaan_teks || ''} onChange={(e) => setEditData({ ...editData, pertanyaan_teks: e.target.value })} />

                {['a', 'b', 'c', 'd', 'e'].map((huruf) => (
                  <div key={huruf}>
                    <label>Pilihan {huruf.toUpperCase()}</label>
                    <input
                      style={inputStyle}
                      value={editData[`pilihan_${huruf}_teks`] || ''}
                      onChange={(e) => setEditData({ ...editData, [`pilihan_${huruf}_teks`]: e.target.value })}
                    />
                    {isTKPEdit && (
                      <input
                        type="number"
                        placeholder={`Bobot ${huruf.toUpperCase()}`}
                        style={inputStyle}
                        value={editData[`bobot_${huruf}`] ?? ''}
                        onChange={(e) => setEditData({ ...editData, [`bobot_${huruf}`]: e.target.value })}
                      />
                    )}
                  </div>
                ))}

                {!isTKPEdit && (
                  <>
                    <label>Jawaban Benar</label>
                    <select style={inputStyle} value={editData.jawaban_benar || 'a'} onChange={(e) => setEditData({ ...editData, jawaban_benar: e.target.value })}>
                      <option value="a">A</option>
                      <option value="b">B</option>
                      <option value="c">C</option>
                      <option value="d">D</option>
                      <option value="e">E</option>
                    </select>
                  </>
                )}

                <label>Pembahasan</label>
                <textarea style={inputStyle} value={editData.pembahasan_teks || ''} onChange={(e) => setEditData({ ...editData, pembahasan_teks: e.target.value })} />

                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button onClick={() => simpanEdit(soal.id)} style={{ padding: '6px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px' }}>Simpan</button>
                  <button onClick={() => setEditId(null)} style={{ padding: '6px 12px', background: '#9ca3af', color: '#fff', border: 'none', borderRadius: '4px' }}>Batal</button>
                </div>
              </div>
            ) : (
              <div>
                <p><strong>Soal {index + 1} ({soal.kategori})</strong></p>
                <p>{soal.pertanyaan_teks}</p>
                {soal.kategori === 'TKP' ? (
                  <p>Bobot: A={soal.bobot_a} B={soal.bobot_b} C={soal.bobot_c} D={soal.bobot_d} E={soal.bobot_e}</p>
                ) : (
                  <p>Jawaban benar: {soal.jawaban_benar?.toUpperCase()}</p>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button onClick={() => mulaiEdit(soal)} style={{ padding: '6px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px' }}>Edit</button>
                  <button onClick={() => hapusSoal(soal.id)} style={{ padding: '6px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px' }}>Hapus</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}