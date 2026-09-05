create table if not exists public.products (
  id text primary key,
  name text not null,
  name_en text,
  description text,
  description_en text,
  category text not null,
  image text not null,
  images jsonb not null default '[]'::jsonb,
  price numeric(12,2) not null check (price >= 0),
  original_price numeric(12,2) check (original_price is null or original_price >= 0),
  stock integer not null default 0 check (stock >= 0),
  low_stock_threshold integer not null default 3 check (low_stock_threshold >= 0),
  colors jsonb not null default '[]'::jsonb,
  sizes jsonb not null default '[]'::jsonb,
  badge text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coupons (
  code text primary key,
  discount numeric(5,2) not null check (discount > 0 and discount <= 100),
  uses integer not null default 0 check (uses >= 0),
  active boolean not null default true,
  expires_at timestamptz,
  max_uses integer check (max_uses is null or max_uses > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected', 'completed')),
  customer_name text not null,
  phone text not null,
  address text not null,
  notes text,
  payment_method text not null check (payment_method in ('cod', 'wallet', 'instapay')),
  transfer_number text,
  receipt_path text,
  subtotal numeric(12,2) not null check (subtotal >= 0),
  discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0),
  shipping_amount numeric(12,2) not null default 0 check (shipping_amount >= 0),
  total numeric(12,2) not null check (total >= 0),
  coupon_code text references public.coupons(code),
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  product_id text not null references public.products(id),
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  total numeric(12,2) not null check (total >= 0),
  size text,
  color text
);

create table if not exists public.site_settings (
  id boolean primary key default true check (id),
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.site_settings enable row level security;

create index if not exists orders_status_created_idx on public.orders (status, created_at desc);
create index if not exists order_items_order_idx on public.order_items (order_id);
