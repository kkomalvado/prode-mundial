# 🌍⚽ Prode Mundial 2026

App de pronósticos del Mundial de Fútbol 2026. Construida con Next.js 14 + Supabase + Tailwind CSS.

## Funcionalidades

- 🏆 **Tabla de posiciones** pública en tiempo real
- ⚽ **Pronósticos de partidos** (resultado y marcador exacto)
- 🎯 **Picks del torneo** (campeón y goleador)
- 👥 **Gestión de usuarios** — el admin crea cuentas manualmente
- ⚙️ **Panel de administración** para cargar resultados y ver estadísticas
- 🔒 **Control de predicciones** — bloquear antes de que empiece el torneo
- 📱 **Responsive** — funciona en celular

## Sistema de puntos

| Predicción | Puntos |
|---|---|
| Marcador exacto | 5 pts |
| Solo resultado correcto (G/E/P) | 2 pts |
| Campeón del torneo | 15 pts |
| Goleador del torneo | 10 pts |

---

## Setup paso a paso

### 1. Clonar e instalar dependencias

```bash
git clone <repo>
cd prode-mundial
npm install
```

### 2. Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → New project
2. Guardar la URL y las API keys

### 3. Configurar variables de entorno

```bash
cp .env.local.example .env.local
```

Editar `.env.local` con tus valores de Supabase:
- `NEXT_PUBLIC_SUPABASE_URL` — tu URL de proyecto
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — service_role key (secreta, solo server-side)
- `NEXT_PUBLIC_SITE_URL` — URL de tu app (ej: `https://tu-prode.vercel.app`)

### 4. Ejecutar el schema en Supabase

En el **SQL Editor** de Supabase, copiar y ejecutar el contenido de:
```
supabase/schema.sql
```

Luego (opcional) cargar los partidos iniciales:
```
supabase/seed.sql
```

### 5. Crear el primer usuario admin

En Supabase → **Authentication** → **Users** → **Add user**:
- Email: tu email
- Password: tu contraseña

Luego en el **SQL Editor** de Supabase, ejecutar:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE username = 'tu-username';
```

### 6. Correr localmente

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000)

### 7. Deploy en Vercel (opcional)

```bash
npm install -g vercel
vercel
```

Configurar las mismas variables de entorno en el dashboard de Vercel.

---

## Flujo de uso

1. **Admin** crea usuarios desde `/admin/usuarios` → les llega email de invitación
2. **Usuarios** hacen click en el email → eligen contraseña → ingresan
3. **Usuarios** van a `/prode` → ingresan sus predicciones antes de cada partido
4. **Admin** carga resultados desde `/admin/resultados` → los puntos se calculan solos
5. **Todos** ven la tabla de posiciones actualizada en `/`

---

## Estructura del proyecto

```
prode-mundial/
├── supabase/
│   ├── schema.sql        # Tablas, funciones, triggers, RLS
│   └── seed.sql          # Partidos iniciales del Mundial 2026
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Tabla de posiciones (pública)
│   │   ├── login/page.tsx              # Login
│   │   ├── prode/
│   │   │   ├── page.tsx                # Server component
│   │   │   └── PredictionGrid.tsx      # Client component (formularios)
│   │   ├── mis-predicciones/page.tsx   # Mis resultados y puntos
│   │   └── admin/
│   │       ├── page.tsx                # Dashboard
│   │       ├── resultados/page.tsx     # Cargar resultados de partidos
│   │       └── usuarios/page.tsx       # Gestión de usuarios
│   ├── actions/
│   │   ├── predictions.ts  # Server actions para predicciones
│   │   └── admin.ts        # Server actions para admin
│   ├── components/
│   │   └── Navbar.tsx
│   ├── lib/supabase/
│   │   ├── client.ts       # Browser client
│   │   └── server.ts       # Server client + admin client
│   ├── lib/utils.ts
│   └── types/index.ts
└── middleware.ts           # Protección de rutas
```

---

## Agregar más partidos manualmente

Desde el SQL Editor de Supabase:

```sql
INSERT INTO public.matches 
  (home_team, away_team, home_flag, away_flag, match_date, stage, group_name, venue)
VALUES 
  ('Argentina', 'Brasil', '🇦🇷', '🇧🇷', '2026-07-01 20:00:00-05', 'quarter', NULL, 'MetLife Stadium');
```

O podés agregar un formulario en el panel admin para crear partidos desde la UI.
