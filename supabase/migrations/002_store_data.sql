-- The store schema is defined in 001_admin_security.sql.
-- Keep this migration as a safe compatibility step for databases that already ran 001.
alter table if exists public.order_items add column if not exists size text;
alter table if exists public.order_items add column if not exists color text;
alter table if exists public.orders add column if not exists receipt text;

create index if not exists orders_status_created_idx on public.orders (status, created_at desc);
create index if not exists order_items_order_idx on public.order_items (order_id);
