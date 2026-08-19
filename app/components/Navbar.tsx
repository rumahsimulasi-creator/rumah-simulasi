'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '../utils/supabase'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const [promo, setPromo] = useState<any>(null)
  const [showPromo, setShowPromo] = useState(false)

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

    const initialize = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!mounted) return

      await loadUser(session?.user ?? null)
    }

    initialize()

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

  // =========================
  // POP-UP PROMOSI
  // =========================
  useEffect(() => {
    const cekPromo = async () => {
      const sudahMuncul = sessionStorage.getItem('promo_shown')

      if (sudahMuncul) return

      const { data } = await supabase
        .from('promo_popup')
        .select('*')
        .eq('aktif', true)
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data) {
        setPromo(data)
        setShowPromo(true)
        sessionStorage.setItem('promo_shown', '1')
      }
    }

    cekPromo()
  }, [])

  const handleKlikPromo = () => {
    setShowPromo(false)

    if (user) {
      router.push('/paket')
    } else {
      router.push('/register')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
    setDropdownOpen(false)
    setMobileMenuOpen(false)
    router.push('/login')
  }

  const menuUser = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Tryout', href: '/paket' },
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
    {
      label: 'Konfirmasi Pembelian Ebook',
      href: '/admin-pembelian-ebook',
    },
    { label: 'Pop-up Promosi', href: '/admin-promo' },
  ]

  const menuTamu = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Tryout', href: '/paket' },
    { label: 'Ebook', href: '/ebook' },
    { label: 'Ranking', href: '/ranking' },
  ]

  const menu = !user
    ? menuTamu
    : role === 'admin'
      ? menuAdmin
      : menuUser

  const isActive = (href: string) => {
    return (
      pathname === href ||
      (href !== '/dashboard' && pathname.startsWith(`${href}/`))
    )
  }

  const handleMobileMenuClick = (href: string) => {
    setMobileMenuOpen(false)
    router.push(href)
  }

  if (loading) {
    return <nav className="h-[78px] border-b border-slate-200 bg-white" />
  }

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-[78px] max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* BRAND */}
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center gap-2.5 no-underline sm:gap-3"
            onClick={() => setMobileMenuOpen(false)}
          >
            <img
              src="/logo.png"
              alt="Rumah Simulasi"
              className="h-10 w-10 rounded-xl object-contain sm:h-11 sm:w-11"
            />

            <span className="text-[17px] font-extrabold tracking-tight text-slate-900 sm:text-[20px]">
              Rumah <span className="text-[#2563EB]">Simulasi</span>
            </span>
          </Link>

          {/* =========================
              MENU DESKTOP
          ========================== */}
          <div className="hidden items-center gap-6 lg:flex xl:gap-9">
            {menu.map((m) => {
              const aktif = isActive(m.href)

              return (
                <Link
                  key={m.href}
                  href={m.href}
                  className={`whitespace-nowrap text-[14px] font-semibold transition-colors xl:text-[15px] ${
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

          {/* =========================
              ACCOUNT DESKTOP
          ========================== */}
          <div className="relative hidden shrink-0 lg:block">
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

          {/* =========================
              MOBILE BUTTON
          ========================== */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-2xl text-slate-700 transition hover:bg-slate-50 lg:hidden"
            aria-label="Buka menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* =========================
            MOBILE DROPDOWN MENU
        ========================== */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white shadow-lg lg:hidden">
            <div className="mx-auto max-w-[1280px] px-4 py-3 sm:px-6">

              {/* MENU */}
              <div className="flex flex-col">
                {menu.map((m) => {
                  const aktif = isActive(m.href)

                  return (
                    <button
                      key={m.href}
                      onClick={() => handleMobileMenuClick(m.href)}
                      className={`flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-left text-[14px] font-semibold transition ${
                        aktif
                          ? 'bg-[#EFF6FF] text-[#2563EB]'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{m.label}</span>

                      {aktif && (
                        <span className="text-[#2563EB]">●</span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* ADMIN BADGE */}
              {role === 'admin' && (
                <div className="mt-2 border-t border-slate-100 pt-3">
                  <span className="inline-flex rounded-full bg-[#EFF6FF] px-3 py-1.5 text-[11px] font-extrabold text-[#2563EB]">
                    Admin
                  </span>
                </div>
              )}

              {/* ACCOUNT MOBILE */}
              <div className="mt-3 border-t border-slate-100 pt-3">
                {!user ? (
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-[14px] font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      Login
                    </Link>

                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center rounded-xl bg-[#2563EB] px-4 py-3 text-[14px] font-bold text-white shadow-sm transition hover:bg-[#1D4ED8]"
                    >
                      Daftar
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">

                    {role !== 'admin' && (
                      <button
                        onClick={() => handleMobileMenuClick('/riwayat')}
                        className="w-full rounded-xl px-4 py-3 text-left text-[14px] font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Riwayat Nilai
                      </button>
                    )}

                    <button
                      onClick={() => handleMobileMenuClick('/edit-profil')}
                      className="w-full rounded-xl px-4 py-3 text-left text-[14px] font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Edit Profil
                    </button>

                    <button
                      onClick={handleLogout}
                      className="mt-1 w-full rounded-xl px-4 py-3 text-left text-[14px] font-bold text-red-600 transition hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ========================================================= */}
      {/* POP-UP PROMOSI */}
      {/* ========================================================= */}

      {showPromo && promo && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPromo(false)
          }}
        >
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">

            <button
              onClick={() => setShowPromo(false)}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg font-bold text-slate-600 shadow hover:bg-white"
            >
              ×
            </button>

            {promo.gambar && (
              <img
                src={promo.gambar}
                alt={promo.judul}
                className="h-56 w-full object-cover"
              />
            )}

            <div className="p-6 text-center">
              <h2 className="text-xl font-black text-slate-900">
                {promo.judul}
              </h2>

              {promo.teks && (
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {promo.teks}
                </p>
              )}

              <button
                onClick={handleKlikPromo}
                className="mt-5 w-full rounded-xl bg-[#2563EB] px-5 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:bg-[#1D4ED8]"
              >
                Daftar/Ikut Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}