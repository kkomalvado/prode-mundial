'use client'

import { useState, useEffect, useTransition } from 'react'
import { inviteUser, listUsers, deleteUser } from '@/actions/admin'
import type { Profile } from '@/types'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export default function UsuariosPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // Form state
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    const result = await listUsers()
    setUsers(result.users as Profile[])
    setLoading(false)
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    startTransition(async () => {
      const result = await inviteUser(email, username, fullName)
      if (result.error) {
        setFormError(result.error)
      } else {
        setFormSuccess(`Invitación enviada a ${email}`)
        setEmail('')
        setUsername('')
        setFullName('')
        loadUsers()
      }
    })
  }

  const handleDelete = async (userId: string) => {
    const result = await deleteUser(userId)
    if (result.error) {
      alert('Error: ' + result.error)
    } else {
      setUsers(prev => prev.filter(u => u.id !== userId))
    }
    setConfirmDelete(null)
  }

  const players = users.filter(u => u.role === 'player')
  const admins = users.filter(u => u.role === 'admin')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amber-400">👥 Gestión de Usuarios</h1>
        <span className="badge bg-slate-700 text-slate-300">
          {players.length} jugadores · {admins.length} admins
        </span>
      </div>

      {/* Formulario de invitación */}
      <div className="card p-5">
        <h2 className="text-lg font-semibold text-slate-300 mb-1">Invitar nuevo usuario</h2>
        <p className="text-sm text-slate-500 mb-4">
          El usuario recibirá un email con un link para activar su cuenta y elegir contraseña.
        </p>

        <form onSubmit={handleInvite} className="space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Email *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nombre de usuario *</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                placeholder="juanperez"
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nombre completo</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Juan Pérez"
                className="input w-full"
              />
            </div>
          </div>

          {formError && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-3 text-sm">
              ❌ {formError}
            </div>
          )}
          {formSuccess && (
            <div className="bg-green-900/40 border border-green-700 text-green-300 rounded-lg p-3 text-sm">
              ✅ {formSuccess}
            </div>
          )}

          <button type="submit" disabled={isPending} className="btn-primary">
            {isPending ? 'Enviando invitación...' : '📧 Enviar invitación'}
          </button>
        </form>
      </div>

      {/* Lista de usuarios */}
      {loading ? (
        <div className="card p-8 text-center text-slate-400">Cargando usuarios...</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900 text-slate-400 text-sm">
                <th className="text-left px-4 py-3">Usuario</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Email</th>
                <th className="text-center px-3 py-3">Rol</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Creado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-t border-slate-700 hover:bg-slate-750">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-amber-400">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{user.username}</div>
                        {user.full_name && (
                          <div className="text-xs text-slate-500">{user.full_name}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400 hidden sm:table-cell">
                    {/* Email no disponible desde profiles, usar admin API si es necesario */}
                    <span className="text-slate-600">—</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`badge ${
                      user.role === 'admin'
                        ? 'bg-amber-900/50 text-amber-300 border border-amber-700'
                        : 'bg-slate-700 text-slate-300'
                    }`}>
                      {user.role === 'admin' ? '⚙️ Admin' : '👤 Jugador'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 hidden sm:table-cell">
                    {format(parseISO(user.created_at), 'd MMM yyyy', { locale: es })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {user.role === 'player' && (
                      confirmDelete === user.id ? (
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-xs text-slate-400">¿Confirmar?</span>
                          <button onClick={() => handleDelete(user.id)} className="btn-danger text-xs py-1 px-2">
                            Sí
                          </button>
                          <button onClick={() => setConfirmDelete(null)} className="btn-secondary text-xs py-1 px-2">
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(user.id)}
                          className="text-slate-500 hover:text-red-400 text-xs transition-colors"
                        >
                          Eliminar
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No hay usuarios todavía. Invitá al primero arriba 👆
            </div>
          )}
        </div>
      )}
    </div>
  )
}
