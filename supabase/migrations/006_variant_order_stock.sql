-- Keep order pricing and stock checks inside one transaction, including color/size variants.
insert into public.site_settings (id, data)
values (true, '{"shippingAmount":80,"freeShippingThreshold":2500}'::jsonb)
on conflict (id) do nothing;

create or replace function public.create_store_order(
  p_customer_name text,
  p_phone text,
  p_address text,
  p_notes text,
  p_payment_method text,
  p_transfer_number text,
  p_receipt text,
  p_coupon_code text,
  p_idempotency_key text,
  p_items jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric(12,2) := 0;
  v_discount numeric(12,2) := 0;
  v_shipping numeric(12,2) := 0;
  v_total numeric(12,2);
  v_shipping_amount numeric(12,2);
  v_free_shipping_threshold numeric(12,2);
  v_coupon coupons%rowtype;
  v_item jsonb;
  v_product products%rowtype;
  v_quantity integer;
  v_unit_price numeric(12,2);
  v_variant_index integer;
  v_variant jsonb;
  v_variants jsonb;
  v_settings jsonb;
begin
  if p_idempotency_key is null or length(trim(p_idempotency_key)) < 16 then
    raise exception 'invalid idempotency key' using errcode = '22023';
  end if;

  select id, order_number, total into v_order_id, v_order_number, v_total
  from orders where idempotency_key = p_idempotency_key;
  if v_order_id is not null then
    return jsonb_build_object('id', v_order_id, 'order_number', v_order_number, 'total', v_total);
  end if;

  select data into v_settings from site_settings where id = true;
  v_shipping_amount := (v_settings->>'shippingAmount')::numeric;
  v_free_shipping_threshold := (v_settings->>'freeShippingThreshold')::numeric;
  if v_shipping_amount is null or v_shipping_amount < 0 or v_free_shipping_threshold is null or v_free_shipping_threshold < 0 then
    raise exception 'shipping settings are not configured' using errcode = '22023';
  end if;

  if p_payment_method not in ('cod', 'wallet', 'instapay') then
    raise exception 'invalid payment method' using errcode = '22023';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'order must contain items' using errcode = '22023';
  end if;
  if (select count(*) from jsonb_array_elements(p_items)) <> (select count(distinct value->>'productId') from jsonb_array_elements(p_items)) then
    raise exception 'duplicate product' using errcode = '22023';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity is null or v_quantity < 1 or v_quantity > 99 then
      raise exception 'invalid quantity' using errcode = '22023';
    end if;
    select * into v_product from products where id = v_item->>'productId' and active = true for update;
    if not found then raise exception 'product unavailable' using errcode = 'P0001'; end if;

    v_variants := coalesce(v_product.variants, '[]'::jsonb);
    if jsonb_array_length(v_variants) > 0 then
      select ordinality::integer - 1, value into v_variant_index, v_variant
      from jsonb_array_elements(v_variants) with ordinality
      where coalesce((value->>'active')::boolean, false)
        and value->>'color' = v_item->>'color'
        and value->>'size' = v_item->>'size'
      limit 1;
      if v_variant is null or coalesce((v_variant->>'stock')::integer, 0) < v_quantity then
        raise exception 'product unavailable' using errcode = 'P0001';
      end if;
    elsif v_product.stock < v_quantity then
      raise exception 'product unavailable' using errcode = 'P0001';
    end if;

    v_unit_price := coalesce(v_product.sale_price, v_product.numeric_price);
    v_subtotal := v_subtotal + (v_unit_price * v_quantity);
  end loop;

  if nullif(trim(p_coupon_code), '') is not null then
    select * into v_coupon from coupons where code = upper(trim(p_coupon_code)) and active = true for update;
    if not found or (v_coupon.expires_at is not null and v_coupon.expires_at <= now()) or (v_coupon.max_uses is not null and v_coupon.uses >= v_coupon.max_uses) then
      raise exception 'invalid coupon' using errcode = 'P0001';
    end if;
    v_discount := round(v_subtotal * v_coupon.discount / 100, 2);
  end if;

  v_shipping := case when v_subtotal >= v_free_shipping_threshold then 0 else v_shipping_amount end;
  v_total := greatest(0, v_subtotal - v_discount + v_shipping);
  v_order_number := 'NN-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS');

  insert into orders (order_number, customer_name, phone, address, notes, payment_method, transfer_number, receipt, subtotal, discount_amount, shipping_amount, total, coupon_code, idempotency_key)
  values (v_order_number, trim(p_customer_name), trim(p_phone), trim(p_address), nullif(trim(p_notes), ''), p_payment_method, nullif(trim(p_transfer_number), ''), nullif(trim(p_receipt), ''), v_subtotal, v_discount, v_shipping, v_total, nullif(upper(trim(p_coupon_code)), ''), p_idempotency_key)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity := (v_item->>'quantity')::integer;
    select * into v_product from products where id = v_item->>'productId' for update;
    v_unit_price := coalesce(v_product.sale_price, v_product.numeric_price);
    insert into order_items (order_id, product_id, name, quantity, unit_price, total, size, color)
    values (v_order_id, v_product.id, v_product.name, v_quantity, v_unit_price, v_unit_price * v_quantity, nullif(trim(v_item->>'size'), ''), nullif(trim(v_item->>'color'), ''));

    v_variants := coalesce(v_product.variants, '[]'::jsonb);
    if jsonb_array_length(v_variants) > 0 then
      select ordinality::integer - 1 into v_variant_index
      from jsonb_array_elements(v_variants) with ordinality
      where coalesce((value->>'active')::boolean, false)
        and value->>'color' = v_item->>'color'
        and value->>'size' = v_item->>'size'
      limit 1;
      v_variants := jsonb_set(v_variants, array[v_variant_index::text, 'stock'], to_jsonb(((v_variants->v_variant_index->>'stock')::integer) - v_quantity), false);
      update products set variants = v_variants, stock = (select coalesce(sum((value->>'stock')::integer), 0) from jsonb_array_elements(v_variants) where coalesce((value->>'active')::boolean, false)), updated_at = now() where id = v_product.id;
    else
      update products set stock = stock - v_quantity, updated_at = now() where id = v_product.id;
    end if;
    insert into inventory_movements (product_id, quantity_delta, reason) values (v_product.id, -v_quantity, 'Order ' || v_order_number);
  end loop;

  if v_coupon.code is not null then
    update coupons set uses = uses + 1 where code = v_coupon.code;
  end if;

  return jsonb_build_object('id', v_order_id, 'order_number', v_order_number, 'total', v_total);
exception when unique_violation then
  select id, order_number, total into v_order_id, v_order_number, v_total from orders where idempotency_key = p_idempotency_key;
  if v_order_id is not null then
    return jsonb_build_object('id', v_order_id, 'order_number', v_order_number, 'total', v_total);
  end if;
  raise;
end;
$$;

revoke all on function public.create_store_order(text, text, text, text, text, text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.create_store_order(text, text, text, text, text, text, text, text, text, jsonb) to service_role;
