create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  desired_role public.app_role;
begin
  desired_role := coalesce(nullif(meta->>'role',''), 'athlete')::public.app_role;

  insert into public.profiles (
    id, email, first_name, last_name, role, sport, position,
    consent_coach_training, consent_physio_health, consent_at
  ) values (
    new.id,
    new.email,
    coalesce(meta->>'first_name',''),
    coalesce(meta->>'last_name',''),
    desired_role,
    nullif(meta->>'sport',''),
    nullif(meta->>'position',''),
    coalesce((meta->>'consent_coach_training')::boolean, false),
    coalesce((meta->>'consent_physio_health')::boolean, false),
    case when (meta->>'consent_coach_training' = 'true' or meta->>'consent_physio_health' = 'true')
         then now() else null end
  );
  return new;
exception when others then
  -- never block signup if profile insert fails (we'll patch later from client)
  return new;
end;
$$;