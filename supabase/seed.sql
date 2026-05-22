-- =============================================
-- SEED - Partidos del Mundial 2026
-- Ejecutar DESPUÉS del schema.sql
-- Nota: ajustar fechas y equipos cuando se confirmen los cruces de fases eliminatorias
-- =============================================

-- GRUPOS (48 equipos, 12 grupos de 4)
insert into public.matches (home_team, away_team, home_flag, away_flag, match_date, stage, group_name, venue, status) values
-- GRUPO A
('México',     'Jamaica',     '🇲🇽','🇯🇲', '2026-06-11 18:00:00-05', 'group', 'A', 'SoFi Stadium, Los Ángeles',    'upcoming'),
('Venezuela',  'Ecuador',     '🇻🇪','🇪🇨', '2026-06-11 21:00:00-05', 'group', 'A', 'Rose Bowl, Los Ángeles',       'upcoming'),
('México',     'Venezuela',   '🇲🇽','🇻🇪', '2026-06-15 18:00:00-05', 'group', 'A', 'Estadio Azteca, Ciudad de Méx','upcoming'),
('Ecuador',    'Jamaica',     '🇪🇨','🇯🇲', '2026-06-15 21:00:00-05', 'group', 'A', 'AT&T Stadium, Dallas',         'upcoming'),
('México',     'Ecuador',     '🇲🇽','🇪🇨', '2026-06-19 20:00:00-05', 'group', 'A', 'MetLife Stadium, Nueva York',  'upcoming'),
('Jamaica',    'Venezuela',   '🇯🇲','🇻🇪', '2026-06-19 20:00:00-05', 'group', 'A', 'Levi''s Stadium, San José',    'upcoming'),
-- GRUPO B
('Argentina',  'Perú',        '🇦🇷','🇵🇪', '2026-06-12 18:00:00-05', 'group', 'B', 'MetLife Stadium, Nueva York',  'upcoming'),
('Canadá',     'Marruecos',   '🇨🇦','🇲🇦', '2026-06-12 21:00:00-05', 'group', 'B', 'BMO Field, Toronto',           'upcoming'),
('Argentina',  'Canadá',      '🇦🇷','🇨🇦', '2026-06-16 18:00:00-05', 'group', 'B', 'Estadio Azteca, Ciudad de Méx','upcoming'),
('Marruecos',  'Perú',        '🇲🇦','🇵🇪', '2026-06-16 21:00:00-05', 'group', 'B', 'SoFi Stadium, Los Ángeles',    'upcoming'),
('Argentina',  'Marruecos',   '🇦🇷','🇲🇦', '2026-06-20 20:00:00-05', 'group', 'B', 'AT&T Stadium, Dallas',         'upcoming'),
('Perú',       'Canadá',      '🇵🇪','🇨🇦', '2026-06-20 20:00:00-05', 'group', 'B', 'BC Place, Vancouver',          'upcoming'),
-- GRUPO C
('Brasil',     'Alemania',    '🇧🇷','🇩🇪', '2026-06-12 15:00:00-05', 'group', 'C', 'AT&T Stadium, Dallas',         'upcoming'),
('Japón',      'Croacia',     '🇯🇵','🇭🇷', '2026-06-12 12:00:00-05', 'group', 'C', 'Levi''s Stadium, San José',    'upcoming'),
('Brasil',     'Japón',       '🇧🇷','🇯🇵', '2026-06-16 15:00:00-05', 'group', 'C', 'Rose Bowl, Los Ángeles',       'upcoming'),
('Croacia',    'Alemania',    '🇭🇷','🇩🇪', '2026-06-16 12:00:00-05', 'group', 'C', 'MetLife Stadium, Nueva York',  'upcoming'),
('Brasil',     'Croacia',     '🇧🇷','🇭🇷', '2026-06-20 17:00:00-05', 'group', 'C', 'SoFi Stadium, Los Ángeles',    'upcoming'),
('Alemania',   'Japón',       '🇩🇪','🇯🇵', '2026-06-20 17:00:00-05', 'group', 'C', 'BMO Field, Toronto',           'upcoming'),
-- GRUPO D
('Francia',    'Senegal',     '🇫🇷','🇸🇳', '2026-06-13 18:00:00-05', 'group', 'D', 'BC Place, Vancouver',          'upcoming'),
('Portugal',   'EEUU',        '🇵🇹','🇺🇸', '2026-06-13 21:00:00-05', 'group', 'D', 'Rose Bowl, Los Ángeles',       'upcoming'),
('Francia',    'Portugal',    '🇫🇷','🇵🇹', '2026-06-17 18:00:00-05', 'group', 'D', 'AT&T Stadium, Dallas',         'upcoming'),
('EEUU',       'Senegal',     '🇺🇸','🇸🇳', '2026-06-17 21:00:00-05', 'group', 'D', 'SoFi Stadium, Los Ángeles',    'upcoming'),
('Francia',    'EEUU',        '🇫🇷','🇺🇸', '2026-06-21 20:00:00-05', 'group', 'D', 'MetLife Stadium, Nueva York',  'upcoming'),
('Senegal',    'Portugal',    '🇸🇳','🇵🇹', '2026-06-21 20:00:00-05', 'group', 'D', 'Estadio Azteca, Ciudad de Méx','upcoming'),
-- GRUPO E
('España',     'Inglaterra',  '🇪🇸','🏴󠁧󠁢󠁥󠁮󠁧󠁿', '2026-06-13 15:00:00-05', 'group', 'E', 'Levi''s Stadium, San José',    'upcoming'),
('Países Bajos','Costa Rica', '🇳🇱','🇨🇷', '2026-06-13 12:00:00-05', 'group', 'E', 'BMO Field, Toronto',           'upcoming'),
('España',     'Países Bajos','🇪🇸','🇳🇱', '2026-06-17 15:00:00-05', 'group', 'E', 'Rose Bowl, Los Ángeles',       'upcoming'),
('Costa Rica', 'Inglaterra',  '🇨🇷','🏴󠁧󠁢󠁥󠁮󠁧󠁿', '2026-06-17 12:00:00-05', 'group', 'E', 'AT&T Stadium, Dallas',         'upcoming'),
('España',     'Costa Rica',  '🇪🇸','🇨🇷', '2026-06-21 17:00:00-05', 'group', 'E', 'BC Place, Vancouver',          'upcoming'),
('Inglaterra', 'Países Bajos','🏴󠁧󠁢󠁥󠁮󠁧󠁿','🇳🇱', '2026-06-21 17:00:00-05', 'group', 'E', 'MetLife Stadium, Nueva York',  'upcoming');
