create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 160),
  email text check (email is null or char_length(email) <= 254),
  phone text check (phone is null or char_length(phone) <= 30),
  document_type text check (document_type is null or char_length(document_type) <= 40),
  document_number text check (document_number is null or char_length(document_number) <= 40),
  company text check (company is null or char_length(company) <= 160),
  address text check (address is null or char_length(address) <= 240),
  district text check (district is null or char_length(district) <= 120),
  city text check (city is null or char_length(city) <= 120),
  notes text check (notes is null or char_length(notes) <= 2000),
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.clients is 'Personas u organizaciones clientes del estudio MWTRAZO.';
comment on column public.clients.created_by is 'Perfil que creó el registro; es inmutable después del alta.';

create index clients_created_by_idx on public.clients (created_by);
create index clients_created_at_idx on public.clients (created_at desc);
create index clients_name_search_idx on public.clients (lower(name) text_pattern_ops);
create index clients_document_number_idx on public.clients (document_number)
where document_number is not null;

create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

create function public.current_user_is_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid()) and is_active = true
  );
$$;

create function public.current_user_has_role(required_role public.user_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and is_active = true
      and role = required_role
  );
$$;

revoke all on function public.current_user_is_active() from public, anon;
revoke all on function public.current_user_has_role(public.user_role) from public, anon;
grant execute on function public.current_user_is_active() to authenticated;
grant execute on function public.current_user_has_role(public.user_role) to authenticated;

alter table public.clients enable row level security;

revoke all on table public.clients from anon, authenticated;
grant select, delete on table public.clients to authenticated;
grant insert (
  name, email, phone, document_type, document_number, company,
  address, district, city, notes, created_by
) on public.clients to authenticated;
grant update (
  name, email, phone, document_type, document_number, company,
  address, district, city, notes
) on public.clients to authenticated;

create policy "Active users can read clients"
on public.clients for select to authenticated
using ((select public.current_user_is_active()));

create policy "Active users can create clients"
on public.clients for insert to authenticated
with check (
  (select public.current_user_is_active())
  and created_by = (select auth.uid())
);

create policy "Active users can update clients"
on public.clients for update to authenticated
using ((select public.current_user_is_active()))
with check ((select public.current_user_is_active()));

create policy "Admins can delete clients"
on public.clients for delete to authenticated
using ((select public.current_user_has_role('admin')));

