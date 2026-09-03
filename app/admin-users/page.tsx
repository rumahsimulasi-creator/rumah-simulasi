'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../utils/supabase'

export default function AdminUsersPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [loading, setLoading] = useState(true)
  const [userList, setUserList] = useState<any[]>([])

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
    const fetchUsers = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('profiles')
        .select('id, nama, email, no_hp, role, created_at')
        .order('created_at', { ascending: false })

      if (data) setUserList(data)
      setLoading(false)
    }
    if (!checking) fetchUsers()
  }, [checking])

  if (checking) return <p style={{ padding: '24px' }}>Memeriksa akses...</p>
  if (loading) return <p style={{ padding: '24px' }}>Memuat data...</p>

  return (
    <div style={{ padding: '24px' }}>
      <h1>Admin - Daftar Akun User</h1>
      <p style={{ color: '#6b7280', fontSize: '14px' }}>Total: {userList.length} akun</p>

      <div style={{ marginTop: '16px', overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '750px' }}>
          <thead>
            <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
              <th style={{ padding: '10px', border: '1px solid #d1d5db' }}>Nama</th>
              <th style={{ padding: '10px', border: '1px solid #d1d5db' }}>Email</th>
              <th style={{ padding: '10px', border: '1px solid #d1d5db' }}>No HP</th>
              <th style={{ padding: '10px', border: '1px solid #d1d5db' }}>Role</th>
              <th style={{ padding: '10px', border: '1px solid #d1d5db' }}>Terdaftar</th>
              <th style={{ padding: '10px', border: '1px solid #d1d5db' }}></th>
            </tr>
          </thead>
          <tbody>
            {userList.map((u) => (
              <tr key={u.id}>
                <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>{u.nama || '-'}</td>
                <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>{u.email || '-'}</td>
                <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>{u.no_hp || '-'}</td>
                <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    background: u.role === 'admin' ? '#fee2e2' : '#dbeafe',
                    color: u.role === 'admin' ? '#dc2626' : '#2563eb',
                  }}>
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>
                  {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID') : '-'}
                </td>
                <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>
                  <button
                    onClick={() => router.push(`/admin-users/${u.id}`)}
                    style={{ padding: '6px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '13px' }}
                  >
                    Lihat Detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}