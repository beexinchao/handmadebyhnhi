-- handmadebyhnhi – lược đồ Supabase. Dán TOÀN BỘ file này vào Supabase > SQL Editor > Run (chạy một lần).
-- Có thể chạy lại an toàn: dùng "if not exists" / "create or replace".

create extension if not exists pgcrypto;

-- ===== Bảng =====
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  status text not null default 'active' check (status in ('active','sold_out','hidden')),
  featured boolean not null default false,
  sort integer not null default 100,
  data jsonb not null,               -- cùng cấu trúc với một sản phẩm trong data.js
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  status text not null default 'pending_payment'
    check (status in ('pending_payment','paid','making','shipped','done','expired','cancelled')),
  customer jsonb not null,
  item jsonb not null,               -- ảnh chụp món hàng + tuỳ chọn + đơn giá tại thời điểm đặt
  subtotal integer not null,
  shipping integer not null,
  total integer not null,
  lang text default 'vi',
  quiz_ref text,
  tracking_no text,
  admin_note text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  provider text not null default 'manual',
  provider_ref text,
  amount integer not null,
  raw jsonb,
  created_at timestamptz not null default now(),
  unique (provider, provider_ref)
);

create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  is_public boolean not null default false
);

create table if not exists public.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  ref text,
  answers jsonb,
  lang text,
  clicked_cta boolean default false,
  created_at timestamptz not null default now()
);

-- ===== Hàm kiểm tra admin =====
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ===== Bật Row Level Security =====
alter table public.admins enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.settings enable row level security;
alter table public.quiz_sessions enable row level security;

-- Khách (chưa đăng nhập): chỉ đọc sản phẩm không ẩn, cài đặt công khai; ghi lượt làm quiz
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products for select to anon, authenticated using (status <> 'hidden' or public.is_admin());
drop policy if exists "settings_public_read" on public.settings;
create policy "settings_public_read" on public.settings for select to anon, authenticated using (is_public or public.is_admin());
drop policy if exists "quiz_public_insert" on public.quiz_sessions;
create policy "quiz_public_insert" on public.quiz_sessions for insert to anon, authenticated with check (true);

-- Admin: toàn quyền
drop policy if exists "products_admin_all" on public.products;
create policy "products_admin_all" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "orders_admin_all" on public.orders;
create policy "orders_admin_all" on public.orders for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "payments_admin_all" on public.payments;
create policy "payments_admin_all" on public.payments for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "settings_admin_all" on public.settings;
create policy "settings_admin_all" on public.settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "quiz_admin_read" on public.quiz_sessions;
create policy "quiz_admin_read" on public.quiz_sessions for select to authenticated using (public.is_admin());
drop policy if exists "admins_self_read" on public.admins;
create policy "admins_self_read" on public.admins for select to authenticated using (user_id = auth.uid());

-- ===== Tạo đơn: máy chủ tự tính lại giá (không tin giá từ trình duyệt) =====
create or replace function public.create_order(payload jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  p record;
  it jsonb := payload->'item';
  cu jsonb := payload->'customer';
  sz jsonb;
  size_fee integer := 0;
  name_fee integer := 0;
  nm text := coalesce(trim(it->>'text'), '');
  zone_fee integer;
  base integer;
  sub integer;
  tot integer;
  new_code text;
  tries integer := 0;
  snapshot jsonb;
begin
  if cu is null or length(trim(coalesce(cu->>'name',''))) = 0 or length(trim(coalesce(cu->>'phone',''))) < 9
     or length(trim(coalesce(cu->>'address',''))) < 8 then
    raise exception 'invalid_customer';
  end if;
  if length(nm) > 20 then raise exception 'name_too_long'; end if;

  select * into p from public.products where slug = it->>'slug' and status = 'active';
  if not found then raise exception 'product_unavailable'; end if;

  select s.value into sz from jsonb_array_elements(p.data->'sizes') s where s.value->>0 = it->>'size' limit 1;
  if sz is null then sz := (p.data->'sizes')->0; end if;
  size_fee := coalesce((sz->>3)::integer, 0);

  if length(nm) > 0 then
    if (p.data->'nameFee') is null or jsonb_typeof(p.data->'nameFee') = 'null' then raise exception 'name_not_supported'; end if;
    name_fee := (p.data->>'nameFee')::integer;
  end if;

  select (z.value->>'fee')::integer into zone_fee
  from public.settings s, jsonb_array_elements(s.value) z
  where s.key = 'ship_zones' and z.value->>'id' = cu->>'zone' limit 1;
  if zone_fee is null then zone_fee := 35000; end if;

  base := (p.data->>'price')::integer;
  sub := base + size_fee + name_fee;
  tot := sub + zone_fee;

  loop
    new_code := 'DH-' || lpad((floor(random() * 900000) + 100000)::integer::text, 6, '0');
    exit when not exists (select 1 from public.orders where code = new_code);
    tries := tries + 1;
    if tries > 20 then raise exception 'code_generation_failed'; end if;
  end loop;

  snapshot := jsonb_build_object(
    'slug', p.slug, 'name_vi', p.data->'vi'->>0, 'name_en', p.data->'en'->>0,
    'base', base, 'size', sz->>0, 'size_vi', sz->>1, 'size_fee', size_fee,
    'color', it->>'color', 'text', nm, 'name_fee', name_fee, 'note', left(coalesce(it->>'note',''), 500));

  insert into public.orders (code, customer, item, subtotal, shipping, total, lang, quiz_ref)
  values (new_code,
          jsonb_build_object('name', left(cu->>'name',120), 'phone', left(cu->>'phone',20), 'email', left(coalesce(cu->>'email',''),120),
                             'address', left(cu->>'address',300), 'zone', cu->>'zone'),
          snapshot, sub, zone_fee, tot, coalesce(payload->>'lang','vi'), payload->>'quiz_ref');

  return jsonb_build_object('code', new_code, 'subtotal', sub, 'shipping', zone_fee, 'total', tot);
end $$;
revoke all on function public.create_order(jsonb) from public;
grant execute on function public.create_order(jsonb) to anon, authenticated;

-- ===== Kho ảnh sản phẩm =====
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read" on storage.objects for select to anon, authenticated using (bucket_id = 'product-images');
drop policy if exists "product_images_admin_write" on storage.objects;
create policy "product_images_admin_write" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "product_images_admin_update" on storage.objects;
create policy "product_images_admin_update" on storage.objects for update to authenticated using (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "product_images_admin_delete" on storage.objects;
create policy "product_images_admin_delete" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());

-- ===== Cài đặt mặc định (chủ shop sửa trong trang admin) =====
insert into public.settings (key, value, is_public) values
 ('shop', '{"instagram":"handmadebyhnhi","email":"handmadebyhnhi@gmail.com"}', true),
 ('ship_zones', '[{"id":"hcm","fee":25000},{"id":"hn","fee":35000},{"id":"other","fee":35000}]', true),
 ('banks', '[{"bank":"MB Bank","code":"mb","number":"97042299887766","holder":"HOANG NHAT NHI"},{"bank":"Techcombank","code":"tcb","number":"19036789123018","holder":"HOANG NHAT NHI"}]', true)
on conflict (key) do nothing;
