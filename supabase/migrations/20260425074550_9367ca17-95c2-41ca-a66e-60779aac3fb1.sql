drop policy if exists "announcements media: public read" on storage.objects;

create policy "announcements media: signed-in read"
on storage.objects
for select
to authenticated
using (bucket_id = 'announcements');