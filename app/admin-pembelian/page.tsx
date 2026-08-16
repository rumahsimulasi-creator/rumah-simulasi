'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../utils/supabase'

export default function AdminPembelianPage() {
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

  const [pembelianList, setPembelianList] = useState<any[]>([])
  const [pembelianBundlingList, setPembelianBundlingList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPembelian = async () => {
    setLoading(true)

    // === PEMBELIAN PAKET BIASA ===
    const { data: pembelianData } = await supabase
      .from('pembelian')
      .select('*')
      .order('created_at', { ascending: false })

    if (pembelianData) {
      const userIds = pembelianData.map((p) => p.user_id)
      const paketIds = pembelianData.map((p) => p.paket_id)

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, nama, email')
        .in('id', userIds)

      const { data: paketData } = await supabase
        .from('paket')
        .select('id, nama, harga, butuh_pendaftaran')
        .in('id', paketIds)

      const gabung = pembelianData.map((p) => {
        const paket = paketData?.find((pk) => pk.id === p.paket_id)
        return {
          ...p,
          user_nama: profilesData?.find((u) => u.id === p.user_id)?.nama || '-',
          user_email: profilesData?.find((u) => u.id === p.user_id)?.email || '-',
          paket_nama: paket?.nama || '-',
          paket_harga: paket?.harga || 0,
          butuh_pendaftaran: paket?.butuh_pendaftaran || false,
        }
      })

      setPembelianList(gabung)
    }

    // === PEMBELIAN BUNDLING ===
    const { data: pembelianBundlingData } = await supabase
      .from('pembelian_bundling')
      .select('*')
      .order('created_at', { ascending: false })

    if (pembelianBundlingData) {
      const userIds = pembelianBundlingData.map((p) => p.user_id)
      const bundlingIds = pembelianBundlingData.map((p) => p.bundling_id)

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, nama, email')
        .in('id', userIds)

      const { data: bundlingData } = await supabase
        .from('paket_bundling')
        .select('id, nama, harga')
        .in('id', bundlingIds)

      const gabungBundling = pembelianBundlingData.map((p) => ({
        ...p,
        user_nama: profilesData?.find((u) => u.id === p.user_id)?.nama || '-',
        user_email: profilesData?.find((u) => u.id === p.user_id)?.email || '-',
        bundling_nama: bundlingData?.find((b) => b.id === p.bundling_id)?.nama || '-',
        bundling_harga: bundlingData?.find((b) => b.id === p.bundling_id)?.harga || 0,
      }))

      setPembelianBundlingList(gabungBundling)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchPembelian()
  }, [])

  const handleKonfirmasi = async (id: string) => {
    const { error } = await supabase
      .from('pembelian')
      .update({ status: 'lunas' })
      .eq('id', id)
    if (error) {
      alert(error.message)
    } else {
      alert('Pembelian dikonfirmasi!')
      fetchPembelian()
    }
  }

  const handleKonfirmasiBundling = async (pembelian: any) => {
    // 1. Update status pembelian_bundling jadi lunas
    const { error: updateError } = await supabase
      .from('pembelian_bundling')
      .update({ status: 'lunas' })
      .eq('id', pembelian.id)

    if (updateError) {
      alert(updateError.message)
      return
    }

    // 2. Ambil semua paket yang ada di dalam bundling ini
    const { data: isiData, error: isiError } = await supabase
      .from('bundling_isi')
      .select('paket_id')
      .eq('bundling_id', pembelian.bundling_id)

    if (isiError || !isiData) {
      alert('Gagal mengambil isi bundling: ' + (isiError?.message || ''))
      return
    }

    // 3. Cek paket mana yang user ini belum punya akses (status lunas)
    const { data: pembelianPaketAda } = await supabase
      .from('pembelian')
      .select('paket_id')
      .eq('user_id', pembelian.user_id)
      .eq('status', 'lunas')

    const paketSudahAda = new Set((pembelianPaketAda || []).map((p) => p.paket_id))

    const rowsBaru = isiData
      .filter((item) => !paketSudahAda.has(item.paket_id))
      .map((item) => ({
        user_id: pembelian.user_id,
        paket_id: item.paket_id,
        status: 'lunas',
      }))

    if (rowsBaru.length > 0) {
      const { error: insertError } = await supabase.from('pembelian').insert(rowsBaru)
      if (insertError) {
        alert('Bundling dikonfirmasi, tapi gagal kasih akses beberapa paket: ' + insertError.message)
        fetchPembelian()
        return
      }
    }

    alert('Bundling dikonfirmasi! Semua paket di dalamnya sudah aktif untuk user.')
    fetchPembelian()
  }

  if (checking) return <p style={{ padding: '24px' }}>Memeriksa akses...</p>
  if (loading) return <p style={{ padding: '24px' }}>Memuat data...</p>

  return (
    <div style={{ padding: '24px', maxWidth: '700px' }}>
      <h1>Admin - Konfirmasi Pembelian</h1>

      <h2 style={{ marginTop: '24px' }}>Paket Biasa</h2>
      {pembelianList.length === 0 ? (
        <p>Belum ada pembelian.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
          {pembelianList.map((p) => (
            <div key={p.id} style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '16px' }}>
              <p><strong>{p.user_nama}</strong> ({p.user_email})</p>
              <p>
                Paket: {p.paket_nama} —{' '}
                {Number(p.paket_harga) === 0
                  ? (p.butuh_pendaftaran ? 'Gratis (Pendaftaran)' : 'Gratis')
                  : `Rp${Number(p.paket_harga).toLocaleString('id-ID')}`}
              </p>
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

      <h2 style={{ marginTop: '32px' }}>Paket Bundling</h2>
      {pembelianBundlingList.length === 0 ? (
        <p>Belum ada pembelian bundling.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
          {pembelianBundlingList.map((p) => (
            <div key={p.id} style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '16px' }}>
              <p><strong>{p.user_nama}</strong> ({p.user_email})</p>
              <p>Bundling: {p.bundling_nama} — Rp{Number(p.bundling_harga).toLocaleString('id-ID')}</p>
              <p>Status: <strong>{p.status}</strong></p>
              {p.status === 'menunggu_konfirmasi' && (
                <button
                  onClick={() => handleKonfirmasiBundling(p)}
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