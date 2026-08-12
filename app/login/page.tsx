'use client'


import { useState } from 'react'
import Image from 'next/image'
import { supabase } from '../utils/supabase'
import { useRouter } from 'next/navigation'


export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()


  const handleLogin = async () => {
    setIsLoading(true)


    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })


    if (error) {
      if (error.message === 'Invalid login credentials') {
        alert('Email atau password salah')
      } else {
        alert(error.message)
      }


      setIsLoading(false)
    } else {
      router.push('/dashboard')
    }
  }


  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background:
          'linear-gradient(135deg, #eff6ff 0%, #f8fafc 50%, #eef2ff 100%)',
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#ffffff',
          borderRadius: '20px',
          padding: '40px',
          boxShadow:
            '0 20px 50px rgba(15, 23, 42, 0.10), 0 4px 12px rgba(15, 23, 42, 0.05)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
        }}
      >
        {/* Logo & Brand */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '88px',
              height: '88px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px',
            }}
          >
            <Image
              src="/logo.png"
              alt="Logo Rumah Simulasi"
              width={88}
              height={88}
              style={{
                objectFit: 'contain',
                width: '100%',
                height: '100%',
              }}
              priority
            />
          </div>


          <h1
            style={{
              margin: 0,
              fontSize: '28px',
              fontWeight: 800,
              color: '#111827',
              letterSpacing: '-0.5px',
            }}
          >
            Rumah Simulasi
          </h1>


          <p
            style={{
              margin: '8px 0 0',
              color: '#6b7280',
              fontSize: '14px',
              textAlign: 'center',
            }}
          >
            Silakan masuk untuk melanjutkan
          </p>
        </div>


        {/* Login Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!isLoading) {
              handleLogin()
            }
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          <div>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151',
              }}
            >
              Email
            </label>


            <input
              id="email"
              type="email"
              placeholder="Masukkan email Anda"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '13px 14px',
                border: '1px solid #d1d5db',
                borderRadius: '10px',
                background: '#f9fafb',
                color: '#111827',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#2563eb'
                e.currentTarget.style.background = '#ffffff'
                e.currentTarget.style.boxShadow =
                  '0 0 0 3px rgba(37, 99, 235, 0.10)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db'
                e.currentTarget.style.background = '#f9fafb'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>


          <div>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151',
              }}
            >
              Password
            </label>


            <input
              id="password"
              type="password"
              placeholder="Masukkan password Anda"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '13px 14px',
                border: '1px solid #d1d5db',
                borderRadius: '10px',
                background: '#f9fafb',
                color: '#111827',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#2563eb'
                e.currentTarget.style.background = '#ffffff'
                e.currentTarget.style.boxShadow =
                  '0 0 0 3px rgba(37, 99, 235, 0.10)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db'
                e.currentTarget.style.background = '#f9fafb'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>


          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              marginTop: '4px',
              padding: '13px 16px',
              background: isLoading ? '#93c5fd' : '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: isLoading
                ? 'none'
                : '0 4px 12px rgba(37, 99, 235, 0.25)',
              transition: 'all 0.2s ease',
            }}
          >
            {isLoading ? 'Memproses...' : 'Masuk'}
          </button>


          {/* Registrasi */}
          <div
            style={{
              textAlign: 'center',
              marginTop: '-4px',
              fontSize: '14px',
            }}
          >
            <span
              style={{
                color: '#6b7280',
              }}
            >
              Belum punya akun?{' '}
            </span>

            <button
              type="button"
              onClick={() => router.push('/register')}
              style={{
                padding: 0,
                border: 'none',
                background: 'transparent',
                color: '#2563eb',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Daftar sekarang
            </button>
          </div>
        </form>


        {/* Footer */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid #f1f5f9',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              margin: 0,
              color: '#9ca3af',
              fontSize: '12px',
            }}
          >
            © {new Date().getFullYear()} Rumah Simulasi
          </p>
        </div>
      </div>
    </main>
  )
}

