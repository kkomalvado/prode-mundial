import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/prode')

  const adminLinks = [
    { href: '/admin', label: '📊 Dashboard' },
    { href: '/admin/resultados', label: '⚽ Cargar resultados' },
    { href: '/admin/usuarios', label: '👥 Usuarios' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <span>Admin</span>
        <nav className="flex gap-2 ml-4">
          {adminLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  )
}
