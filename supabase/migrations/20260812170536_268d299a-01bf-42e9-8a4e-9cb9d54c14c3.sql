drop policy if exists "Visitors can create positive quote items" on public.quote_items;
drop function if exists public.quote_is_recent(uuid);

create or replace function public.validate_quote_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.quotes q
    where q.id = new.quote_id and q.created_at > now() - interval '30 minutes'
  ) then
    raise exception 'quote_id invalido o expirado';
  end if;
  return new;
end;
$$;

revoke all on function public.validate_quote_item() from public, anon, authenticated;

drop trigger if exists validate_quote_item_trg on public.quote_items;
create trigger validate_quote_item_trg
before insert on public.quote_items
for each row execute function public.validate_quote_item();

create policy "Visitors can create positive quote items"
on public.quote_items for insert to anon, authenticated
with check (
  length(trim(item_key)) > 0
  and length(trim(item_name)) > 0
  and length(trim(category)) > 0
  and quantity > 0
);