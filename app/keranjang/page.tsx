'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabase'

const METODE_BAYAR = [
  { nama: 'BNI', nomor: '1234567890 a.n. Rumah Simulasi' },
  { nama: 'QRIS', nomor: 'Scan QR di kasir (dummy)' },
  { nama: 'GoPay', nomor: '081234567890 a.n. Rumah Simulasi' },
  { nama: 'ShopeePay', nomor: '081234567890 a.n. Rumah Simulasi' },
]

export default function KeranjangPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sudahLogin, setSudahLogin] = useState(true)

  const fetchKeranjang = async () => {
    setLoading(true)
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    if (!userId) {
      setSudahLogin(false)
      setLoading(false)
      return
    }

    const { data: pembelianData } = await supabase
      .from('pembelian')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'belum_bayar')

    if (pembelianData) {
      const paketIds = pembelianData.map((p) => p.paket_id)
      const { data: paketData } = await supabase
        .from('paket')
        .select('*')
        .in('id', paketIds)

      const gabung = pembelianData.map((p) => ({
        ...p,
        paket: paketData?.find((pk) => pk.id === p.paket_id),
      }))
      setItems(gabung)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchKeranjang()
  }, [])

  const handleSudahBayar = async (pembelianId: string) => {
    const { error } = await supabase
      .from('pembelian')
      .update({ status: 'menunggu_konfirmasi' })
      .eq('id', pembelianId)
    if (error) alert(error.message)
    else {
      alert('Konfirmasi terkirim! Menunggu verifikasi admin.')
      fetchKeranjang()
    }
  }

  if (loading) return <p style={{ padding: '24px' }}>Memuat keranjang...</p>
if (!sudahLogin) return <p style={{ padding: '24px' }}>Silakan login untuk melihat keranjang. <a href="/login">Login</a></p>

  return (
    <div style={{ padding: '24px', maxWidth: '600px' }}>
      <h1>Keranjang</h1>
      {items.length === 0 ? (
        <p>Keranjang kosong.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
          {items.map((item) => (
            <div key={item.id} style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '16px' }}>
              <h3>{item.paket?.nama}</h3>
              <p><strong>Rp{Number(item.paket?.harga).toLocaleString('id-ID')}</strong></p>

              <div style={{ marginTop: '8px', background: '#f9fafb', padding: '12px', borderRadius: '4px' }}>
                <p><strong>Silakan transfer ke salah satu:</strong></p>
                {METODE_BAYAR.map((m) => (
                  <p key={m.nama} style={{ margin: '4px 0' }}>{m.nama}: {m.nomor}</p>
                ))}
                <button
                  onClick={() => handleSudahBayar(item.id)}
                  style={{ padding: '8px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', marginTop: '8px' }}
                >
                  Saya Sudah Bayar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}