create or replace function public.quote_is_recent(_quote_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.quotes q
    where q.id = _quote_id and q.created_at > now() - interval '30 minutes'
  )
$$;

drop policy if exists "Visitors can create positive quote items" on public.quote_items;

create policy "Visitors can create positive quote items"
on public.quote_items for insert to anon, authenticated
with check (
  length(trim(item_key)) > 0
  and length(trim(item_name)) > 0
  and length(trim(category)) > 0
  and quantity > 0
  and public.quote_is_recent(quote_id)
);