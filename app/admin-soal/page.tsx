'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../utils/supabase'

export default function AdminSoalPage() {
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
  const [paketId, setPaketId] = useState('')
  const [kategori, setKategori] = useState('TWK')
  const [pertanyaanTeks, setPertanyaanTeks] = useState('')
  const [pertanyaanGambar, setPertanyaanGambar] = useState('')
  const [pilihanATeks, setPilihanATeks] = useState('')
  const [pilihanAGambar, setPilihanAGambar] = useState('')
  const [pilihanBTeks, setPilihanBTeks] = useState('')
  const [pilihanBGambar, setPilihanBGambar] = useState('')
  const [pilihanCTeks, setPilihanCTeks] = useState('')
  const [pilihanCGambar, setPilihanCGambar] = useState('')
  const [pilihanDTeks, setPilihanDTeks] = useState('')
  const [pilihanDGambar, setPilihanDGambar] = useState('')
  const [pilihanETeks, setPilihanETeks] = useState('')
  const [pilihanEGambar, setPilihanEGambar] = useState('')
  const [jawabanBenar, setJawabanBenar] = useState('a')
  const [bobotA, setBobotA] = useState('')
  const [bobotB, setBobotB] = useState('')
  const [bobotC, setBobotC] = useState('')
  const [bobotD, setBobotD] = useState('')
  const [bobotE, setBobotE] = useState('')
  const [pembahasanTeks, setPembahasanTeks] = useState('')
  const [pembahasanGambar, setPembahasanGambar] = useState('')

  useEffect(() => {
    const fetchPaket = async () => {
      const { data } = await supabase.from('paket').select('*')
      if (data) setPaketList(data)
    }
    fetchPaket()
  }, [])

  const isTKP = kategori === 'TKP'

  const handleTambahSoal = async () => {
    const { error } = await supabase.from('soal').insert({
      paket_id: paketId,
      kategori,
      pertanyaan_teks: pertanyaanTeks,
      pertanyaan_gambar: pertanyaanGambar,
      pilihan_a_teks: pilihanATeks,
      pilihan_a_gambar: pilihanAGambar,
      pilihan_b_teks: pilihanBTeks,
      pilihan_b_gambar: pilihanBGambar,
      pilihan_c_teks: pilihanCTeks,
      pilihan_c_gambar: pilihanCGambar,
      pilihan_d_teks: pilihanDTeks,
      pilihan_d_gambar: pilihanDGambar,
      pilihan_e_teks: pilihanETeks,
      pilihan_e_gambar: pilihanEGambar,
      jawaban_benar: isTKP ? null : jawabanBenar,
      bobot_a: isTKP ? Number(bobotA) : null,
      bobot_b: isTKP ? Number(bobotB) : null,
      bobot_c: isTKP ? Number(bobotC) : null,
      bobot_d: isTKP ? Number(bobotD) : null,
      bobot_e: isTKP ? Number(bobotE) : null,
      pembahasan_teks: pembahasanTeks,
      pembahasan_gambar: pembahasanGambar,
    })
    if (error) {
      alert(error.message)
    } else {
      alert('Soal berhasil ditambahkan!')
      setPertanyaanTeks('')
      setPertanyaanGambar('')
      setPilihanATeks('')
      setPilihanAGambar('')
      setPilihanBTeks('')
      setPilihanBGambar('')
      setPilihanCTeks('')
      setPilihanCGambar('')
      setPilihanDTeks('')
      setPilihanDGambar('')
      setPilihanETeks('')
      setPilihanEGambar('')
      setBobotA('')
      setBobotB('')
      setBobotC('')
      setBobotD('')
      setBobotE('')
      setPembahasanTeks('')
      setPembahasanGambar('')
    }
  }

  const inputStyle = { padding: '8px', border: '1px solid #9ca3af', borderRadius: '4px', width: '100%' }

  if (checking) return <p style={{ padding: '24px' }}>Memeriksa akses...</p>
  return (
    <div style={{ padding: '24px' }}>
      <h1>Admin - Tambah Soal</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '400px', marginTop: '16px' }}>

        <label>Paket</label>
        <select value={paketId} onChange={(e) => setPaketId(e.target.value)} style={inputStyle}>
          <option value="">Pilih Paket</option>
          {paketList.map((p) => (
            <option key={p.id} value={p.id}>{p.nama}</option>
          ))}
        </select>

        <label>Kategori</label>
        <select value={kategori} onChange={(e) => setKategori(e.target.value)} style={inputStyle}>
          <option value="TWK">TWK</option>
          <option value="TIU">TIU</option>
          <option value="TKP">TKP</option>
        </select>

        <label>Pertanyaan (teks)</label>
        <textarea value={pertanyaanTeks} onChange={(e) => setPertanyaanTeks(e.target.value)} style={inputStyle} />

        <label>Pertanyaan (link gambar, opsional)</label>
        <input type="text" value={pertanyaanGambar} onChange={(e) => setPertanyaanGambar(e.target.value)} style={inputStyle} />

        <label>Pilihan A (teks)</label>
        <input type="text" value={pilihanATeks} onChange={(e) => setPilihanATeks(e.target.value)} style={inputStyle} />
        <label>Pilihan A (link gambar, opsional)</label>
        <input type="text" value={pilihanAGambar} onChange={(e) => setPilihanAGambar(e.target.value)} style={inputStyle} />
        {isTKP && (
          <>
            <label>Bobot Pilihan A</label>
            <input type="number" value={bobotA} onChange={(e) => setBobotA(e.target.value)} style={inputStyle} />
          </>
        )}

        <label>Pilihan B (teks)</label>
        <input type="text" value={pilihanBTeks} onChange={(e) => setPilihanBTeks(e.target.value)} style={inputStyle} />
        <label>Pilihan B (link gambar, opsional)</label>
        <input type="text" value={pilihanBGambar} onChange={(e) => setPilihanBGambar(e.target.value)} style={inputStyle} />
        {isTKP && (
          <>
            <label>Bobot Pilihan B</label>
            <input type="number" value={bobotB} onChange={(e) => setBobotB(e.target.value)} style={inputStyle} />
          </>
        )}

        <label>Pilihan C (teks)</label>
        <input type="text" value={pilihanCTeks} onChange={(e) => setPilihanCTeks(e.target.value)} style={inputStyle} />
        <label>Pilihan C (link gambar, opsional)</label>
        <input type="text" value={pilihanCGambar} onChange={(e) => setPilihanCGambar(e.target.value)} style={inputStyle} />
        {isTKP && (
          <>
            <label>Bobot Pilihan C</label>
            <input type="number" value={bobotC} onChange={(e) => setBobotC(e.target.value)} style={inputStyle} />
          </>
        )}

        <label>Pilihan D (teks)</label>
        <input type="text" value={pilihanDTeks} onChange={(e) => setPilihanDTeks(e.target.value)} style={inputStyle} />
        <label>Pilihan D (link gambar, opsional)</label>
        <input type="text" value={pilihanDGambar} onChange={(e) => setPilihanDGambar(e.target.value)} style={inputStyle} />
        {isTKP && (
          <>
            <label>Bobot Pilihan D</label>
            <input type="number" value={bobotD} onChange={(e) => setBobotD(e.target.value)} style={inputStyle} />
          </>
        )}

        <label>Pilihan E (teks)</label>
        <input type="text" value={pilihanETeks} onChange={(e) => setPilihanETeks(e.target.value)} style={inputStyle} />
        <label>Pilihan E (link gambar, opsional)</label>
        <input type="text" value={pilihanEGambar} onChange={(e) => setPilihanEGambar(e.target.value)} style={inputStyle} />
        {isTKP && (
          <>
            <label>Bobot Pilihan E</label>
            <input type="number" value={bobotE} onChange={(e) => setBobotE(e.target.value)} style={inputStyle} />
          </>
        )}

        {!isTKP && (
          <>
            <label>Jawaban Benar</label>
            <select value={jawabanBenar} onChange={(e) => setJawabanBenar(e.target.value)} style={inputStyle}>
              <option value="a">A</option>
              <option value="b">B</option>
              <option value="c">C</option>
              <option value="d">D</option>
              <option value="e">E</option>
            </select>
          </>
        )}

        <label>Pembahasan (teks)</label>
        <textarea value={pembahasanTeks} onChange={(e) => setPembahasanTeks(e.target.value)} style={inputStyle} />

        <label>Pembahasan (link gambar, opsional)</label>
        <input type="text" value={pembahasanGambar} onChange={(e) => setPembahasanGambar(e.target.value)} style={inputStyle} />

        <button onClick={handleTambahSoal} style={{ padding: '8px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', marginTop: '8px' }}>
          Tambah Soal
        </button>
      </div>
    </div>
  )
}