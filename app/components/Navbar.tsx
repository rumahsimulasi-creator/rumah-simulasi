'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '../utils/supabase'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let mounted = true

    const loadUser = async (currentUser: any) => {
      if (!mounted) return

      setUser(currentUser)

      if (currentUser) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .single()

        if (!mounted) return

        setRole(profileData?.role || 'user')
      } else {
        setRole(null)
      }

      setLoading(false)
    }

    // Ambil session saat pertama kali Navbar dimuat
    const initialize = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!mounted) return

      await loadUser(session?.user ?? null)
    }

    initialize()

    // Dengarkan perubahan login/logout secara langsung
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return

      const currentUser = session?.user ?? null

      setUser(currentUser)

      if (currentUser) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .single()

        if (!mounted) return

        setRole(profileData?.role || 'user')
      } else {
        setRole(null)
      }

      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
    setDropdownOpen(false)
    router.push('/login')
  }

  const menuUser = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Paket', href: '/paket' },
    { label: 'Ebook', href: '/ebook' },
    { label: 'Ranking', href: '/ranking' },
    { label: 'Paket Simulasi Saya', href: '/paket-saya' },
  ]

  const menuAdmin = [
    { label: 'Tambah Paket', href: '/admin' },
    { label: 'Kelola Paket', href: '/kelola-paket' },
    { label: 'Tambah Soal', href: '/admin-soal' },
    { label: 'Kelola Soal', href: '/kelola-soal' },
    { label: 'Konfirmasi Pembelian', href: '/admin-pembelian' },
    { label: 'Tambah Ebook', href: '/admin-ebook' },
    { label: 'Kelola Ebook', href: '/kelola-ebook' },
    { label: 'Konfirmasi Pembelian Ebook', href: '/admin-pembelian-ebook' },
  ]

  const menuTamu = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Paket', href: '/paket' },
    { label: 'Ebook', href: '/ebook' },
    { label: 'Ranking', href: '/ranking' },
  ]

  const menu = !user
    ? menuTamu
    : role === 'admin'
      ? menuAdmin
      : menuUser

  if (loading) {
    return (
      <nav className="h-[78px] border-b border-slate-200 bg-white" />
    )
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-[78px] max-w-[1280px] items-center justify-between px-6 sm:px-8">

        {/* BRAND */}
        <Link
          href="/dashboard"
          className="flex shrink-0 items-center gap-3 no-underline"
        >
          <img
            src="/logo.png"
            alt="Rumah Simulasi"
            className="h-11 w-11 rounded-xl object-contain"
          />

          <span className="text-[20px] font-extrabold tracking-tight text-slate-900">
            Rumah <span className="text-[#2563EB]">Simulasi</span>
          </span>
        </Link>

        {/* MENU */}
        <div className="hidden items-center gap-9 sm:flex">
          {menu.map((m) => {
            const aktif =
              pathname === m.href ||
              (m.href !== '/dashboard' &&
                pathname.startsWith(`${m.href}/`))

            return (
              <Link
                key={m.href}
                href={m.href}
                className={`text-[15px] font-semibold transition-colors ${
                  aktif
                    ? 'text-[#2563EB]'
                    : 'text-slate-600 hover:text-[#2563EB]'
                }`}
              >
                {m.label}
              </Link>
            )
          })}

          {role === 'admin' && (
            <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-[11px] font-extrabold text-[#2563EB]">
              Admin
            </span>
          )}
        </div>

        {/* ACCOUNT */}
        <div className="relative shrink-0">
          {!user ? (
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-[15px] font-semibold text-slate-600 transition-colors hover:text-[#2563EB]"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="rounded-lg bg-[#2563EB] px-5 py-2.5 text-[14px] font-extrabold text-white shadow-sm transition hover:bg-[#1D4ED8]"
              >
                Daftar
              </Link>
            </div>
          ) : (
            <>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-lg transition hover:border-[#BFDBFE] hover:bg-[#EFF6FF]"
              >
                👤
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-14 z-50 flex min-w-[200px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl">

                  {role !== 'admin' && (
                    <Link
                      href="/riwayat"
                      onClick={() => setDropdownOpen(false)}
                      className="px-4 py-3 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-[#2563EB]"
                    >
                      Riwayat Nilai
                    </Link>
                  )}

                  <Link
                    href="/edit-profil"
                    onClick={() => setDropdownOpen(false)}
                    className="px-4 py-3 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-[#2563EB]"
                  >
                    Edit Profil
                  </Link>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    onClick={handleLogout}
                    className="px-4 py-3 text-left text-[14px] font-bold text-red-600 transition hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </nav>
  )
}