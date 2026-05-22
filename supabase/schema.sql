-- =============================================
-- PRODE MUNDIAL - Schema completo para Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =============================================

-- 1. PERFILES (extiende auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  full_name text,
  avatar_url text,
  role text not null default 'player' check (role in ('admin', 'player')),
  created_at timestamptz default now()
);

-- 2. PARTIDOS
create table public.matches (
  id uuid default gen_random_uuid() primary key,
  home_team text not null,
  away_team text not null,
  home_flag text,
  away_flag text,
  match_date timestamptz not null,
  stage text not null default 'group'
    check (stage in ('group','round_of_16','quarter','semi','third_place','final')),
  group_name text,
  venue text,
  home_score integer,
  away_score integer,
  status text not null default 'upcoming'
    check (status in ('upcoming','live','finished')),
  created_at timestamptz default now()
);

-- 3. PREDICCIONES DE PARTIDOS
create table public.predictions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  match_id uuid references public.matches(id) on delete cascade not null,
  predicted_home integer not null check (predicted_home >= 0),
  predicted_away integer not null check (predicted_away >= 0),
  points_earned integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, match_id)
);

-- 4. PICKS DEL TORNEO (campeón + goleador)
create table public.tournament_picks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade unique not null,
  champion_team text,
  top_scorer text,
  champion_points integer not null default 0,
  scorer_points integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. CONFIGURACIÓN GLOBAL (tabla singleton)
create table public.tournament_settings (
  id integer primary key default 1 check (id = 1),
  champion_team text,
  top_scorer text,
  predictions_locked boolean not null default false,
  tournament_name text not null default 'Mundial 2026',
  updated_at timestamptz default now()
);
insert into public.tournament_settings (id) values (1);

-- =============================================
-- FUNCIÓN: Calcular puntos de un partido
-- =============================================
create or replace function public.calculate_match_points(
  pred_home integer, pred_away integer,
  real_home integer, real_away integer
) returns integer as $$
declare
  pred_winner text;
  real_winner text;
begin
  pred_winner := case
    when pred_home > pred_away then 'home'
    when pred_home < pred_away then 'away'
    else 'draw' end;
  real_winner := case
    when real_home > real_away then 'home'
    when real_home < real_away then 'away'
    else 'draw' end;
  if pred_home = real_home and pred_away = real_away then return 5;
  elsif pred_winner = real_winner then return 2;
  else return 0;
  end if;
end;
$$ language plpgsql immutable;

-- =============================================
-- TRIGGER: Auto-calcular puntos al terminar partido
-- =============================================
create or replace function public.update_prediction_points()
returns trigger as $$
begin
  if new.status = 'finished' and new.home_score is not null and new.away_score is not null then
    update public.predictions
    set points_earned = public.calculate_match_points(
          predicted_home, predicted_away, new.home_score, new.away_score),
        updated_at = now()
    where match_id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_match_finished
  after update on public.matches
  for each row when (new.status = 'finished')
  execute function public.update_prediction_points();

-- =============================================
-- TRIGGER: Auto-calcular puntos torneo
-- =============================================
create or replace function public.update_tournament_pick_points()
returns trigger as $$
begin
  if new.champion_team is not null and new.champion_team != '' then
    update public.tournament_picks
    set champion_points = case when champion_team = new.champion_team then 15 else 0 end,
        updated_at = now();
  end if;
  if new.top_scorer is not null and new.top_scorer != '' then
    update public.tournament_picks
    set scorer_points = case when top_scorer = new.top_scorer then 10 else 0 end,
        updated_at = now();
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_tournament_updated
  after update on public.tournament_settings
  for each row execute function public.update_tournament_pick_points();

-- =============================================
-- TRIGGER: Crear perfil al registrar usuario
-- =============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'player')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================
-- VISTA: Tabla de posiciones
-- =============================================
create or replace view public.leaderboard as
select
  p.id,
  p.username,
  p.full_name,
  p.avatar_url,
  (coalesce(sum(pr.points_earned), 0)
    + coalesce(tp.champion_points, 0)
    + coalesce(tp.scorer_points, 0))::int as total_points,
  count(case when pr.points_earned = 5 then 1 end)::int as exact_scores,
  count(case when pr.points_earned >= 2 then 1 end)::int as correct_results,
  count(pr.id)::int as total_predictions,
  rank() over (order by
    coalesce(sum(pr.points_earned), 0)
    + coalesce(tp.champion_points, 0)
    + coalesce(tp.scorer_points, 0) desc
  )::int as rank
from public.profiles p
left join public.predictions pr on pr.user_id = p.id
left join public.tournament_picks tp on tp.user_id = p.id
where p.role = 'player'
group by p.id, p.username, p.full_name, p.avatar_url,
         tp.champion_points, tp.scorer_points;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;
alter table public.tournament_picks enable row level security;
alter table public.tournament_settings enable row level security;

-- Perfiles
create policy "Perfiles públicos" on public.profiles for select using (true);
create policy "Editar propio perfil" on public.profiles for update using (auth.uid() = id);

-- Partidos
create policy "Partidos públicos" on public.matches for select using (true);
create policy "Solo admin gestiona partidos" on public.matches for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Predicciones
create policy "Gestionar propias predicciones" on public.predictions
  for all using (auth.uid() = user_id);
create policy "Admin ve todas las predicciones" on public.predictions
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Tournament picks
create policy "Picks públicos" on public.tournament_picks for select using (true);
create policy "Gestionar propios picks" on public.tournament_picks
  for all using (auth.uid() = user_id);

-- Settings
create policy "Settings públicos" on public.tournament_settings for select using (true);
create policy "Solo admin modifica settings" on public.tournament_settings
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
