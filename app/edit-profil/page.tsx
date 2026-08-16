'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../utils/supabase'

export default function EditProfilPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [menyimpan, setMenyimpan] = useState(false)

  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [nama, setNama] = useState('')
  const [noHp, setNoHp] = useState('')

  useEffect(() => {
    const fetchProfil = async () => {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      setUserId(userData.user.id)
      setEmail(userData.user.email || '')

      const { data: profileData } = await supabase
        .from('profiles')
        .select('nama, no_hp')
        .eq('id', userData.user.id)
        .single()

      if (profileData) {
        setNama(profileData.nama || '')
        setNoHp(profileData.no_hp || '')
      }

      setLoading(false)
    }
    fetchProfil()
  }, [])

  const handleSimpan = async () => {
    if (!userId) return
    setMenyimpan(true)

    const { error } = await supabase
      .from('profiles')
      .update({ nama, no_hp: noHp })
      .eq('id', userId)

    if (error) {
      alert(error.message)
      setMenyimpan(false)
      return
    }

    alert('Profil berhasil diperbarui!')
    setMenyimpan(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-10">
        <div className="mx-auto flex min-h-[300px] max-w-md items-center justify-center">
          <p className="text-sm font-bold text-slate-500">Memuat profil...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-md">

        <div className="mb-6">
          <p className="text-xs font-extrabold uppercase tracking-widest text-[#2563EB]">
            Akun Saya
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900">
            Edit Profil
          </h1>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Email
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="mt-1 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-500"
          />
          <p className="mt-1 text-xs text-slate-400">Email tidak bisa diubah.</p>

          <label className="mt-5 block text-xs font-bold uppercase tracking-wide text-slate-400">
            Nama Lengkap
          </label>
          <input
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 focus:border-[#2563EB] focus:outline-none"
          />

          <label className="mt-5 block text-xs font-bold uppercase tracking-wide text-slate-400">
            Nomor HP
          </label>
          <input
            type="text"
            value={noHp}
            onChange={(e) => setNoHp(e.target.value)}
            placeholder="08xxxxxxxxxx"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 focus:border-[#2563EB] focus:outline-none"
          />

          <button
            onClick={handleSimpan}
            disabled={menyimpan}
            className="mt-6 w-full rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {menyimpan ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>

        </div>
      </div>
    </main>
  )
}