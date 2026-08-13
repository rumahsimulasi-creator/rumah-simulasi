'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabase'

const METODE_BAYAR = [
  { nama: 'BNI', nomor: '1234567890 a.n. Rumah Simulasi' },
  { nama: 'QRIS', nomor: 'Scan QR di kasir (dummy)' },
  { nama: 'GoPay', nomor: '081234567890 a.n. Rumah Simulasi' },
  { nama: 'ShopeePay', nomor: '081234567890 a.n. Rumah Simulasi' },
]

export default function EbookPage() {
  const [ebookList, setEbookList] = useState<any[]>([])
  const [pembelianList, setPembelianList] = useState<any[]>([])
  const [sudahLogin, setSudahLogin] = useState(false)

  const fetchData = async () => {
    const { data: ebookData } = await supabase.from('ebook').select('*')
    if (ebookData) setEbookList(ebookData)

    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    setSudahLogin(!!userId)

    if (userId) {
      const { data: pembelianData } = await supabase
        .from('pembelian_ebook')
        .select('*')
        .eq('user_id', userId)

      if (pembelianData) setPembelianList(pembelianData)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getPembelian = (ebookId: string) => {
    return pembelianList.find((p) => p.ebook_id === ebookId)
  }

  const handleBeli = async (ebookId: string) => {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id

    if (!userId) {
      alert('Silakan login dulu.')
      return
    }

    const { error } = await supabase.from('pembelian_ebook').insert({
      user_id: userId,
      ebook_id: ebookId,
      status: 'belum_bayar',
    })

    if (error) alert(error.message)
    else fetchData()
  }

  const handleSudahBayar = async (pembelianId: string) => {
    const { error } = await supabase
      .from('pembelian_ebook')
      .update({ status: 'menunggu_konfirmasi' })
      .eq('id', pembelianId)

    if (error) {
      alert(error.message)
    } else {
      alert('Konfirmasi terkirim! Menunggu verifikasi admin.')
      fetchData()
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      <h1>Ebook</h1>

      {ebookList.length === 0 ? (
        <p>Belum ada ebook.</p>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            marginTop: '16px',
          }}
        >
          {ebookList.map((ebook) => {
            const pembelian = getPembelian(ebook.id)
            const status = pembelian ? pembelian.status : 'belum_beli'

            return (
              <div
                key={ebook.id}
                style={{
                  display: 'flex',
                  gap: '16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '16px',
                }}
              >
                {ebook.sampul_gambar && (
                  <img
                    src={ebook.sampul_gambar}
                    alt={ebook.judul}
                    style={{
                      width: '100px',
                      height: '140px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                    }}
                  />
                )}

                <div style={{ flex: 1 }}>
                  <h3>{ebook.judul}</h3>

                  <p>{ebook.deskripsi}</p>

                  <p>
                    <strong>
                      Rp{Number(ebook.harga).toLocaleString('id-ID')}
                    </strong>
                  </p>

                  {status === 'lunas' ? (
                    <a
                      href={ebook.link_drive}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        background: '#2563eb',
                        color: '#fff',
                        borderRadius: '4px',
                        textDecoration: 'none',
                      }}
                    >
                      Baca / Download Ebook
                    </a>
                  ) : status === 'belum_bayar' ? (
                    <div
                      style={{
                        marginTop: '8px',
                        background: '#f9fafb',
                        padding: '12px',
                        borderRadius: '4px',
                      }}
                    >
                      <p>
                        <strong>Silakan transfer ke salah satu:</strong>
                      </p>

                      {METODE_BAYAR.map((m) => (
                        <p
                          key={m.nama}
                          style={{ margin: '4px 0' }}
                        >
                          {m.nama}: {m.nomor}
                        </p>
                      ))}

                      <button
                        onClick={() =>
                          handleSudahBayar(pembelian.id)
                        }
                        style={{
                          padding: '8px 16px',
                          background: '#16a34a',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          marginTop: '8px',
                        }}
                      >
                        Saya Sudah Bayar
                      </button>
                    </div>
                  ) : status === 'menunggu_konfirmasi' ? (
                    <button
                      disabled
                      style={{
                        padding: '8px 16px',
                        background: '#9ca3af',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                      }}
                    >
                      Menunggu Konfirmasi
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBeli(ebook.id)}
                      style={{
                        padding: '8px 16px',
                        background: '#16a34a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                      }}
                    >
                      Beli
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}