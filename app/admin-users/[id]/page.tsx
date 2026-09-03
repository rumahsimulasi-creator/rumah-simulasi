'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '../../utils/supabase'

export default function AdminUserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [checking, setChecking] = useState(true)
  const [loading, setLoading] = useState(true)

  const [profil, setProfil] = useState<any>(null)
  const [paketDimiliki, setPaketDimiliki] = useState<any[]>([])
  const [ebookDimiliki, setEbookDimiliki] = useState<any[]>([])
  const [riwayatUjian, setRiwayatUjian] = useState<any[]>([])

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
    const fetchDetail = async () => {
      setLoading(true)

      const { data: profilData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      setProfil(profilData)

      // Paket yang statusnya lunas
      const { data: pembelianData } = await supabase
        .from('pembelian')
        .select('paket_id, status, created_at')
        .eq('user_id', userId)
        .eq('status', 'lunas')

      if (pembelianData && pembelianData.length > 0) {
        const paketIds = pembelianData.map((p) => p.paket_id)
        const { data: paketData } = await supabase
          .from('paket')
          .select('id, nama, harga')
          .in('id', paketIds)
        setPaketDimiliki(paketData || [])
      } else {
        setPaketDimiliki([])
      }

      // Ebook yang statusnya lunas
      const { data: pembelianEbookData } = await supabase
        .from('pembelian_ebook')
        .select('ebook_id')
        .eq('user_id', userId)
        .eq('status', 'lunas')

      if (pembelianEbookData && pembelianEbookData.length > 0) {
        const ebookIds = pembelianEbookData.map((p) => p.ebook_id)
        const { data: ebookData } = await supabase
          .from('ebook')
          .select('id, judul')
          .in('id', ebookIds)
        setEbookDimiliki(ebookData || [])
      } else {
        setEbookDimiliki([])
      }

      // Riwayat ujian
      const { data: hasilData } = await supabase
        .from('hasil_ujian')
        .select('*')
        .eq('user_id', userId)
        .order('waktu_selesai', { ascending: false })

      if (hasilData && hasilData.length > 0) {
        const paketIds = hasilData.map((h) => h.paket_id)
        const { data: paketData } = await supabase
          .from('paket')
          .select('id, nama')
          .in('id', paketIds)

        const gabung = hasilData.map((h) => ({
          ...h,
          paket_nama: paketData?.find((p) => p.id === h.paket_id)?.nama || '-',
        }))
        setRiwayatUjian(gabung)
      } else {
        setRiwayatUjian([])
      }

      setLoading(false)
    }
    if (!checking && userId) fetchDetail()
  }, [checking, userId])

  if (checking) return <p style={{ padding: '24px' }}>Memeriksa akses...</p>
  if (loading) return <p style={{ padding: '24px' }}>Memuat data...</p>
  if (!profil) return <p style={{ padding: '24px' }}>User tidak ditemukan.</p>

  return (
    <div style={{ padding: '24px', maxWidth: '800px' }}>
      <button
        onClick={() => router.push('/admin-users')}
        style={{ marginBottom: '16px', padding: '6px 12px', background: '#e5e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        ← Kembali ke Daftar User
      </button>

      <h1>Detail Akun</h1>

      {/* PROFIL */}
      <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '16px', marginTop: '16px' }}>
        <h2 style={{ marginTop: 0 }}>Profil</h2>
        <p><strong>Nama:</strong> {profil.nama || '-'}</p>
        <p><strong>Email:</strong> {profil.email || '-'}</p>
        <p><strong>No HP:</strong> {profil.no_hp || '-'}</p>
        <p><strong>Role:</strong> {profil.role}</p>
        <p><strong>Terdaftar:</strong> {profil.created_at ? new Date(profil.created_at).toLocaleDateString('id-ID') : '-'}</p>
      </div>

      {/* PAKET DIMILIKI */}
      <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '16px', marginTop: '16px' }}>
        <h2 style={{ marginTop: 0 }}>Paket Dimiliki ({paketDimiliki.length})</h2>
        {paketDimiliki.length === 0 ? (
          <p style={{ color: '#6b7280' }}>Belum punya paket.</p>
        ) : (
          <ul>
            {paketDimiliki.map((p) => (
              <li key={p.id}>{p.nama} — {p.harga === 0 ? 'Gratis' : `Rp${Number(p.harga).toLocaleString('id-ID')}`}</li>
            ))}
          </ul>
        )}
      </div>

      {/* EBOOK DIMILIKI */}
      <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '16px', marginTop: '16px' }}>
        <h2 style={{ marginTop: 0 }}>Ebook Dimiliki ({ebookDimiliki.length})</h2>
        {ebookDimiliki.length === 0 ? (
          <p style={{ color: '#6b7280' }}>Belum punya ebook.</p>
        ) : (
          <ul>
            {ebookDimiliki.map((e) => (
              <li key={e.id}>{e.judul}</li>
            ))}
          </ul>
        )}
      </div>

      {/* RIWAYAT UJIAN */}
      <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '16px', marginTop: '16px' }}>
        <h2 style={{ marginTop: 0 }}>Riwayat Pengerjaan ({riwayatUjian.length})</h2>
        {riwayatUjian.length === 0 ? (
          <p style={{ color: '#6b7280' }}>Belum pernah mengerjakan ujian.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
                  <th style={{ padding: '8px', border: '1px solid #d1d5db' }}>Paket</th>
                  <th style={{ padding: '8px', border: '1px solid #d1d5db' }}>Total</th>
                  <th style={{ padding: '8px', border: '1px solid #d1d5db' }}>TWK</th>
                  <th style={{ padding: '8px', border: '1px solid #d1d5db' }}>TIU</th>
                  <th style={{ padding: '8px', border: '1px solid #d1d5db' }}>TKP</th>
                  <th style={{ padding: '8px', border: '1px solid #d1d5db' }}>Status</th>
                  <th style={{ padding: '8px', border: '1px solid #d1d5db' }}>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {riwayatUjian.map((r) => (
                  <tr key={r.id}>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>{r.paket_nama}</td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>{r.skor}</td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>{r.skor_twk ?? '-'}</td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>{r.skor_tiu ?? '-'}</td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>{r.skor_tkp ?? '-'}</td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        background: r.lulus ? '#dcfce7' : '#fee2e2',
                        color: r.lulus ? '#16a34a' : '#dc2626',
                      }}>
                        {r.lulus ? 'Lulus' : 'Belum Lulus'}
                      </span>
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>
                      {r.waktu_selesai ? new Date(r.waktu_selesai).toLocaleDateString('id-ID') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}