create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('admin', 'editor')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_profiles enable row level security;
revoke all on table public.admin_profiles from anon, authenticated;
grant select on table public.admin_profiles to authenticated;

drop policy if exists admin_profiles_self_read on public.admin_profiles;
create policy admin_profiles_self_read on public.admin_profiles
  for select to authenticated using (id = auth.uid());

do $$
begin
  alter table public.audit_logs drop constraint if exists audit_logs_admin_user_id_fkey;
exception when undefined_table then null;
end $$;

alter table if exists public.audit_logs
  add constraint audit_logs_admin_user_id_fkey foreign key (admin_user_id) references auth.users(id) on delete set null;

alter table if exists public.orders add column if not exists payment_status text not null default 'pending';
alter table if exists public.orders drop constraint if exists orders_payment_status_check;
alter table if exists public.orders add constraint orders_payment_status_check check (payment_status in ('pending', 'verified', 'rejected'));
alter table if exists public.orders add column if not exists internal_notes text;

create index if not exists admin_profiles_active_role_idx on public.admin_profiles (is_active, role);
create index if not exists orders_customer_created_idx on public.orders (customer_id, created_at desc);

create or replace function public.create_store_order_for_customer(
  p_customer_name text, p_phone text, p_address text, p_notes text, p_payment_method text,
  p_transfer_number text, p_receipt text, p_coupon_code text, p_idempotency_key text, p_items jsonb,
  p_customer_id uuid
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  result jsonb;
begin
  if p_customer_id is not null and p_customer_id <> auth.uid() and auth.role() <> 'service_role' then
    raise exception 'invalid customer';
  end if;
  select public.create_store_order(p_customer_name, p_phone, p_address, p_notes, p_payment_method, p_transfer_number, p_receipt, p_coupon_code, p_idempotency_key, p_items) into result;
  if p_customer_id is not null then
    update public.orders set customer_id = p_customer_id where id = (result->>'id')::uuid;
  end if;
  return result;
end;
$$;

revoke all on function public.create_store_order_for_customer(text,text,text,text,text,text,text,text,text,jsonb,uuid) from public, anon, authenticated;
grant execute on function public.create_store_order_for_customer(text,text,text,text,text,text,text,text,text,jsonb,uuid) to service_role;
