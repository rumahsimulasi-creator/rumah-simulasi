'use client'

import { useState } from 'react'
import { supabase } from '../utils/supabase'

export default function RegisterPage() {
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const handleRegister = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nama },
      },
    })

    if (error) {
      alert(error.message)
      return
    }

    setShowSuccess(true)
  }

  const goToLogin = () => {
    window.location.href = '/login'
  }

  return (
    <>
      <div
        style={{
          minHeight: '100vh',
          background: '#f4f8fd',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '420px',
            background: '#ffffff',
            borderRadius: '20px',
            padding: '52px 40px 28px',
            boxSizing: 'border-box',
            boxShadow: '0 8px 30px rgba(31, 50, 81, 0.10)',
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '28px',
            }}
          >
            <img
              src="/logo.png"
              alt="Rumah Simulasi"
              style={{
                width: '72px',
                height: '72px',
                objectFit: 'contain',
              }}
            />
          </div>

          {/* Heading */}
          <div
            style={{
              textAlign: 'center',
              marginBottom: '34px',
            }}
          >
            <h1
              style={{
                margin: 0,
                color: '#050505',
                fontSize: '28px',
                fontWeight: 800,
                letterSpacing: '-0.5px',
              }}
            >
              Buat Akun
            </h1>

            <p
              style={{
                margin: '10px 0 0',
                color: '#64748b',
                fontSize: '14px',
                lineHeight: '1.5',
              }}
            >
              Silakan daftar untuk melanjutkan
            </p>
          </div>

          {/* Nama */}
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="nama"
              style={{
                display: 'block',
                marginBottom: '9px',
                color: '#1e293b',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              Nama
            </label>

            <input
              id="nama"
              type="text"
              placeholder="Masukkan nama Anda"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              style={{
                width: '100%',
                height: '49px',
                padding: '0 14px',
                boxSizing: 'border-box',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                background: '#ffffff',
                color: '#111827',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '9px',
                color: '#1e293b',
                fontSize: '14px',
                fontWeight: 600,
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
              style={{
                width: '100%',
                height: '49px',
                padding: '0 14px',
                boxSizing: 'border-box',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                background: '#ffffff',
                color: '#111827',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '22px' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '9px',
                color: '#1e293b',
                fontSize: '14px',
                fontWeight: 600,
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
              style={{
                width: '100%',
                height: '49px',
                padding: '0 14px',
                boxSizing: 'border-box',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                background: '#ffffff',
                color: '#111827',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Button */}
          <button
            onClick={handleRegister}
            style={{
              width: '100%',
              height: '50px',
              border: 'none',
              borderRadius: '10px',
              background: '#2563eb',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 5px 12px rgba(37, 99, 235, 0.25)',
            }}
          >
            Daftar
          </button>

          {/* Login text */}
          <p
            style={{
              margin: '17px 0 0',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '14px',
            }}
          >
            Sudah punya akun?{' '}
            <a
              href="/login"
              style={{
                color: '#2563eb',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Masuk sekarang
            </a>
          </p>
        </div>
      </div>

      {/* =========================
          POPUP PENDAFTARAN BERHASIL
      ========================== */}
      {showSuccess && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              background: '#ffffff',
              borderRadius: '20px',
              padding: '38px 32px 30px',
              textAlign: 'center',
              boxSizing: 'border-box',
              boxShadow: '0 20px 50px rgba(15, 23, 42, 0.20)',
              animation: 'popupIn 0.25s ease-out',
            }}
          >
            {/* Icon sukses */}
            <div
              style={{
                width: '68px',
                height: '68px',
                margin: '0 auto 20px',
                borderRadius: '50%',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '30px',
              }}
            >
              ✓
            </div>

            <h2
              style={{
                margin: '0 0 12px',
                color: '#111827',
                fontSize: '22px',
                fontWeight: 800,
              }}
            >
              Pendaftaran Berhasil!
            </h2>

            <p
              style={{
                margin: '0 auto 24px',
                maxWidth: '340px',
                color: '#64748b',
                fontSize: '14px',
                lineHeight: '1.6',
              }}
            >
              Pendaftaran akun kamu berhasil. Silakan lanjut ke halaman login
              untuk masuk ke akun kamu.
            </p>

            <button
              onClick={goToLogin}
              style={{
                width: '100%',
                height: '48px',
                border: 'none',
                borderRadius: '10px',
                background: '#2563eb',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 5px 12px rgba(37, 99, 235, 0.25)',
              }}
            >
              Ke Halaman Login
            </button>
          </div>
        </div>
      )}

      {/* Animasi popup */}
      <style jsx>{`
        @keyframes popupIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }

          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </>
  )
}