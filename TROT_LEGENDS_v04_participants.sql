-- TROT LEGENDS v0.4 : identité des écuries et liste partagée des engagés
-- À exécuter dans Supabase > SQL Editor > New query.

alter table public.trot_race_entries
  add column if not exists stable_name text not null default 'Écurie';

-- Enrichit les anciennes inscriptions lorsque le profil existe.
update public.trot_race_entries e
set stable_name = coalesce(p.stable_name, e.stable_name, 'Écurie')
from public.player_profiles p
where p.user_id = e.user_id;

create or replace function public.trot_join_race(
  p_race_id uuid,
  p_horse_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_state jsonb;
  v_horse jsonb;
  v_race public.trot_races%rowtype;
  v_name text;
  v_stable text;
begin
  if auth.uid() is null then
    raise exception 'Connexion requise';
  end if;

  select * into v_race
  from public.trot_races
  where id = p_race_id
  for update;

  if not found then raise exception 'Course introuvable'; end if;
  if v_race.status <> 'open' or v_race.starts_at <= now() then
    raise exception 'Inscriptions closes';
  end if;

  select state into v_state
  from public.game_states
  where user_id = auth.uid();
  if v_state is null then raise exception 'Écurie introuvable'; end if;

  select x.horse into v_horse
  from jsonb_array_elements(coalesce(v_state->'horses','[]'::jsonb)) as x(horse)
  where x.horse->>'id' = p_horse_id
  limit 1;
  if v_horse is null then
    raise exception 'Ce cheval ne fait pas partie de ton écurie';
  end if;

  v_name := coalesce(v_horse->>'name','Cheval sans nom');
  v_stable := coalesce(nullif(v_state->>'stable_name',''), 'Écurie');

  insert into public.trot_race_entries(
    race_id,user_id,horse_id,horse_name,horse_stats,stable_name
  ) values (
    p_race_id,auth.uid(),p_horse_id,v_name,v_horse,v_stable
  ) on conflict (race_id,user_id) do nothing;

  return jsonb_build_object('success',true,'horse_name',v_name,'stable_name',v_stable);
end;
$$;

create or replace function public.trot_race_participants(p_race_id uuid)
returns table(
  stable_name text,
  horse_name text,
  is_mine boolean,
  place integer
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    e.stable_name,
    e.horse_name,
    (e.user_id = auth.uid()) as is_mine,
    e.position as place
  from public.trot_race_entries e
  where e.race_id = p_race_id
  order by e.position nulls last, e.created_at;
$$;

revoke all on function public.trot_join_race(uuid,text) from public;
grant execute on function public.trot_join_race(uuid,text) to authenticated;
revoke all on function public.trot_race_participants(uuid) from public;
grant execute on function public.trot_race_participants(uuid) to authenticated;

-- Met à jour aussi la fonction d'arrivée pour afficher le nom de l'écurie.
drop function if exists public.trot_race_results(uuid);
create function public.trot_race_results(p_race_id uuid)
returns table(
  place integer,
  horse_name text,
  prize integer,
  stable_name text
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select e.position, e.horse_name, e.prize, e.stable_name
  from public.trot_race_entries e
  where e.race_id = p_race_id and e.position is not null
  order by e.position;
$$;

revoke all on function public.trot_race_results(uuid) from public;
grant execute on function public.trot_race_results(uuid) to authenticated;
