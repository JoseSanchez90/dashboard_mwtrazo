create type public.project_payment_status as enum ('pending', 'paid', 'overdue', 'cancelled');

create table public.project_payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete restrict,
  concept text not null check (char_length(trim(concept)) between 2 and 180),
  amount numeric(14, 2) not null check (amount > 0),
  due_date date,
  paid_at timestamptz,
  status public.project_payment_status not null default 'pending',
  notes text check (notes is null or char_length(notes) <= 2000),
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint project_payments_overdue_date check (status <> 'overdue' or due_date is not null),
  constraint project_payments_paid_at check ((status = 'paid' and paid_at is not null) or (status <> 'paid' and paid_at is null))
);

create table public.project_expenses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete restrict,
  concept text not null check (char_length(trim(concept)) between 2 and 180),
  amount numeric(14, 2) not null check (amount > 0),
  expense_date date not null,
  notes text check (notes is null or char_length(notes) <= 2000),
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index project_payments_project_id_idx on public.project_payments (project_id);
create index project_payments_status_idx on public.project_payments (status);
create index project_payments_due_date_idx on public.project_payments (due_date) where due_date is not null;
create index project_expenses_project_id_idx on public.project_expenses (project_id);
create index project_expenses_expense_date_idx on public.project_expenses (expense_date desc);

create trigger project_payments_set_updated_at before update on public.project_payments for each row execute function public.set_updated_at();
create trigger project_expenses_set_updated_at before update on public.project_expenses for each row execute function public.set_updated_at();

create function public.protect_project_financial_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not (select public.current_user_has_role('admin')) then
    raise exception 'Solo un administrador puede gestionar finanzas.' using errcode = 'insufficient_privilege';
  end if;
  if tg_op = 'UPDATE' and new.created_by is distinct from old.created_by then
    raise exception 'No se puede cambiar el creador del registro.' using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create function public.normalize_project_payment()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status = 'paid' and new.paid_at is null then new.paid_at = timezone('utc', now()); end if;
  if new.status <> 'paid' then new.paid_at = null; end if;
  return new;
end;
$$;

create trigger project_payments_protect before insert or update on public.project_payments for each row execute function public.protect_project_financial_fields();
create trigger project_payments_normalize before insert or update on public.project_payments for each row execute function public.normalize_project_payment();
create trigger project_expenses_protect before insert or update on public.project_expenses for each row execute function public.protect_project_financial_fields();
revoke all on function public.protect_project_financial_fields() from public, anon, authenticated;
revoke all on function public.normalize_project_payment() from public, anon, authenticated;

alter table public.project_payments enable row level security;
alter table public.project_expenses enable row level security;
revoke all on table public.project_payments, public.project_expenses from anon, authenticated;
grant select, insert, update, delete on table public.project_payments, public.project_expenses to authenticated;

create policy "Admins read project payments" on public.project_payments for select to authenticated using ((select public.current_user_has_role('admin')));
create policy "Admins create project payments" on public.project_payments for insert to authenticated with check ((select public.current_user_has_role('admin')) and created_by = (select auth.uid()));
create policy "Admins update project payments" on public.project_payments for update to authenticated using ((select public.current_user_has_role('admin'))) with check ((select public.current_user_has_role('admin')));
create policy "Admins delete project payments" on public.project_payments for delete to authenticated using ((select public.current_user_has_role('admin')));
create policy "Admins read project expenses" on public.project_expenses for select to authenticated using ((select public.current_user_has_role('admin')));
create policy "Admins create project expenses" on public.project_expenses for insert to authenticated with check ((select public.current_user_has_role('admin')) and created_by = (select auth.uid()));
create policy "Admins update project expenses" on public.project_expenses for update to authenticated using ((select public.current_user_has_role('admin'))) with check ((select public.current_user_has_role('admin')));
create policy "Admins delete project expenses" on public.project_expenses for delete to authenticated using ((select public.current_user_has_role('admin')));

