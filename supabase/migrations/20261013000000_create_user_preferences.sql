create table public.user_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  timezone text not null default 'America/Lima'
    check (timezone in ('America/Lima', 'America/Bogota', 'America/Mexico_City', 'Europe/Madrid', 'UTC')),
  date_format text not null default 'DD/MM/YYYY'
    check (date_format in ('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD')),
  week_starts_on smallint not null default 1 check (week_starts_on in (0, 1)),
  currency text not null default 'PEN' check (currency in ('PEN', 'USD')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index user_preferences_updated_at_idx on public.user_preferences (updated_at desc);

create trigger user_preferences_set_updated_at
before update on public.user_preferences
for each row execute function public.set_updated_at();

alter table public.user_preferences enable row level security;
revoke all on table public.user_preferences from anon, authenticated;
grant select, insert, update on table public.user_preferences to authenticated;

create policy "Users read their own preferences"
on public.user_preferences for select to authenticated
using (
  user_id = (select auth.uid())
  and (select public.current_user_is_active())
);

create policy "Users create their own preferences"
on public.user_preferences for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (select public.current_user_is_active())
);

create policy "Users update their own preferences"
on public.user_preferences for update to authenticated
using (
  user_id = (select auth.uid())
  and (select public.current_user_is_active())
)
with check (
  user_id = (select auth.uid())
  and (select public.current_user_is_active())
);
