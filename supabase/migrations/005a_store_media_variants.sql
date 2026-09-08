alter table public.products
  add column if not exists video text,
  add column if not exists variants jsonb not null default '[]'::jsonb;

alter table public.site_settings
  add column if not exists data jsonb not null default '{}'::jsonb;

insert into storage.buckets (id, name, public)
values ('product-videos', 'product-videos', true)
on conflict (id) do nothing;

create index if not exists products_variants_gin_idx on public.products using gin (variants);

comment on column public.products.video is 'Public product video URL stored in Supabase Storage';
comment on column public.products.variants is 'Active color and size combinations with stock';
