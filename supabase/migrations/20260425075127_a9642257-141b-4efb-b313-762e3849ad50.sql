drop policy if exists "events: team read" on public.team_events;
create policy "events: team read"
on public.team_events
for select
to authenticated
using (
  public.has_role(auth.uid(), 'admin')
  or team_id is null
  or team_id = public.my_team_id()
  or created_by = auth.uid()
);

drop policy if exists "rsvps: user upsert own" on public.event_rsvps;
create policy "rsvps: user upsert own"
on public.event_rsvps
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.team_events e
    where e.id = event_rsvps.event_id
      and (e.team_id is null or e.team_id = public.my_team_id() or e.created_by = auth.uid() or public.has_role(auth.uid(), 'admin'))
  )
);