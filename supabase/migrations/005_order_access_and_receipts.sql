alter table public.orders add column if not exists access_token_hash text;
create unique index if not exists orders_access_token_hash_idx on public.orders (access_token_hash) where access_token_hash is not null;

create table if not exists public.receipt_uploads (
  token_hash text primary key,
  path text not null unique,
  expires_at timestamptz not null,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.receipt_uploads enable row level security;
revoke all on table public.receipt_uploads from anon, authenticated;

create or replace function public.create_store_order_secure(
  p_customer_name text, p_phone text, p_address text, p_notes text, p_payment_method text,
  p_transfer_number text, p_receipt text, p_coupon_code text, p_idempotency_key text, p_items jsonb,
  p_access_token_hash text
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare result jsonb;
begin
  if p_access_token_hash is null or length(trim(p_access_token_hash)) < 32 then
    raise exception 'invalid order access token' using errcode = '22023';
  end if;
  select public.create_store_order(p_customer_name, p_phone, p_address, p_notes, p_payment_method, p_transfer_number, p_receipt, p_coupon_code, p_idempotency_key, p_items) into result;
  update public.orders set access_token_hash = p_access_token_hash where id = (result->>'id')::uuid and access_token_hash is null;
  return result;
end;
$$;
revoke all on function public.create_store_order_secure(text,text,text,text,text,text,text,text,text,jsonb,text) from public, anon, authenticated;
grant execute on function public.create_store_order_secure(text,text,text,text,text,text,text,text,text,jsonb,text) to service_role;

create or replace function public.create_store_order_for_customer_secure(
  p_customer_name text, p_phone text, p_address text, p_notes text, p_payment_method text,
  p_transfer_number text, p_receipt text, p_coupon_code text, p_idempotency_key text, p_items jsonb,
  p_customer_id uuid, p_access_token_hash text
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare result jsonb;
begin
  if p_customer_id is not null and p_customer_id <> auth.uid() and auth.role() <> 'service_role' then
    raise exception 'invalid customer';
  end if;
  select public.create_store_order_secure(p_customer_name, p_phone, p_address, p_notes, p_payment_method, p_transfer_number, p_receipt, p_coupon_code, p_idempotency_key, p_items, p_access_token_hash) into result;
  if p_customer_id is not null then
    update public.orders set customer_id = p_customer_id where id = (result->>'id')::uuid;
  end if;
  return result;
end;
$$;
revoke all on function public.create_store_order_for_customer_secure(text,text,text,text,text,text,text,text,text,jsonb,uuid,text) from public, anon, authenticated;
grant execute on function public.create_store_order_for_customer_secure(text,text,text,text,text,text,text,text,text,jsonb,uuid,text) to service_role;
