create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace function public.generate_join_code()
returns text
language plpgsql
set search_path = public
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
  attempt int := 0;
begin
  loop
    result := '';
    for i in 1..6 loop
      result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    if not exists (select 1 from public.teams where join_code = result) then
      return result;
    end if;
    attempt := attempt + 1;
    if attempt > 20 then
      raise exception 'Could not generate unique join code';
    end if;
  end loop;
end;
$$;

create or replace function public.set_team_join_code()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.join_code is null or new.join_code = '' then
    new.join_code := public.generate_join_code();
  end if;
  return new;
end;
$$;