-- ============================================================================
-- JOUTE DUEL - Script de durcissement Supabase (RLS, Contraintes & RPC)
-- A executer dans l'editeur SQL de votre projet Supabase
-- ============================================================================

-- 1. Activer impérativement Row Level Security (RLS) sur la table matches
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches FORCE ROW LEVEL SECURITY;

-- 2. Supprimer les anciennes politiques trop permissives si existantes
DROP POLICY IF EXISTS "matches_select_participants" ON public.matches;
DROP POLICY IF EXISTS "matches_insert_none" ON public.matches;
DROP POLICY IF EXISTS "matches_update_none" ON public.matches;
DROP POLICY IF EXISTS "matches_delete_none" ON public.matches;

-- 3. Lecture autorisée UNIQUEMENT aux deux joueurs participants de la partie
CREATE POLICY "matches_select_participants"
ON public.matches
FOR SELECT
TO authenticated
USING (auth.uid() = p1 OR auth.uid() = p2);

-- 4. Interdire toute insertion, modification ou suppression directe depuis le client
--    Toutes les mutations doivent passer par les fonctions RPC SECURITY DEFINER
CREATE POLICY "matches_insert_none"
ON public.matches
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "matches_update_none"
ON public.matches
FOR UPDATE
TO authenticated, anon
USING (false);

CREATE POLICY "matches_delete_none"
ON public.matches
FOR DELETE
TO authenticated, anon
USING (false);

-- 5. Contraintes d'intégrité directement en base de données
ALTER TABLE public.matches
  DROP CONSTRAINT IF EXISTS chk_c1_range,
  DROP CONSTRAINT IF EXISTS chk_c2_range,
  DROP CONSTRAINT IF EXISTS chk_hp1_range,
  DROP CONSTRAINT IF EXISTS chk_hp2_range,
  DROP CONSTRAINT IF EXISTS chk_ult1_range,
  DROP CONSTRAINT IF EXISTS chk_ult2_range,
  DROP CONSTRAINT IF EXISTS chk_status_valid,
  DROP CONSTRAINT IF EXISTS chk_distinct_players;

ALTER TABLE public.matches
  ADD CONSTRAINT chk_c1_range CHECK (c1 >= 0 AND c1 <= 9),
  ADD CONSTRAINT chk_c2_range CHECK (c2 IS NULL OR (c2 >= 0 AND c2 <= 9)),
  ADD CONSTRAINT chk_hp1_range CHECK (hp1 >= 0 AND hp1 <= 100),
  ADD CONSTRAINT chk_hp2_range CHECK (hp2 >= 0 AND hp2 <= 100),
  ADD CONSTRAINT chk_ult1_range CHECK (ult1 >= 0 AND ult1 <= 3),
  ADD CONSTRAINT chk_ult2_range CHECK (ult2 >= 0 AND ult2 <= 3),
  ADD CONSTRAINT chk_status_valid CHECK (status IN ('waiting', 'active', 'done')),
  ADD CONSTRAINT chk_distinct_players CHECK (p2 IS NULL OR p1 <> p2);

-- 6. Table anti-spam / rate-limiting par utilisateur
CREATE TABLE IF NOT EXISTS public.rpc_rate_limits (
  user_id uuid NOT NULL,
  action text NOT NULL,
  last_call timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, action)
);

ALTER TABLE public.rpc_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rpc_rate_limits FORCE ROW LEVEL SECURITY;

-- 7. Verrouiller les permissions d'exécution des fonctions RPC
REVOKE ALL ON FUNCTION public.find_match(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_move(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.tick(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.find_match(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_move(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.tick(uuid) TO authenticated;
