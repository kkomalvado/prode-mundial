'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { Profile } from '@/types'
import { cn } from '@/lib/utils'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(data)
      }
      setLoading(false)
    })
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const links = [
    { href: '/', label: '🏆 Tabla' },
    { href: '/prode', label: '⚽ Prode' },
    { href: '/mis-predicciones', label: '📋 Mis picks' },
    ...(profile?.role === 'admin' ? [{ href: '/admin', label: '⚙️ Admin' }] : []),
  ]

  return (
    <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="text-2xl">🌍</span>
            <span className="text-amber-400 hidden sm:block">Prode</span>
            <span className="hidden sm:block">Mundial 26</span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  pathname === href
                    ? 'bg-amber-500 text-slate-900'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                )}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* User */}
          <div className="flex items-center gap-3">
            {!loading && profile ? (
              <>
                <span className="text-slate-400 text-sm hidden sm:block">
                  {profile.username}
                </span>
                <button onClick={handleLogout} className="btn-secondary text-sm py-1.5">
                  Salir
                </button>
              </>
            ) : !loading ? (
              <Link href="/login" className="btn-primary text-sm py-1.5">
                Ingresar
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  )
}
