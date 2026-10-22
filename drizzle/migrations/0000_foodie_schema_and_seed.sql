-- ============ Utility ============
create or replace function public.handle_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- ============ profiles ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles:select:own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles:insert:own" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles:update:own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create trigger profiles_updated_at before update on public.profiles for each row execute function public.handle_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(coalesce(new.email, ''), '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    new.phone
  )
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ============ categories ============
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  emoji text not null default '🍽️',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "categories:select:all" on public.categories for select to anon, authenticated using (true);

-- ============ restaurants ============
create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  branch text,
  category_slug text not null references public.categories(slug) on delete restrict,
  cover_url text not null,
  logo_emoji text not null default '🍽️',
  description text,
  rating numeric(2,1) not null default 4.5,
  rating_count int not null default 0,
  delivery_fee numeric(10,2) not null default 0,
  eta_min int not null default 20,
  distance_km numeric(4,1) not null default 1,
  discount_pct int not null default 0,
  lat double precision not null,
  lng double precision not null,
  address text,
  created_at timestamptz not null default now()
);
create index idx_restaurants_category on public.restaurants(category_slug);
grant select on public.restaurants to anon, authenticated;
grant all on public.restaurants to service_role;
alter table public.restaurants enable row level security;
create policy "restaurants:select:all" on public.restaurants for select to anon, authenticated using (true);

-- ============ menu_items ============
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  description text not null default '',
  price numeric(10,2) not null check (price >= 0),
  kcal int not null default 0,
  prep_min int not null default 12,
  image_url text not null,
  section text not null default 'Para você',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index idx_menu_items_restaurant on public.menu_items(restaurant_id);
grant select on public.menu_items to anon, authenticated;
grant all on public.menu_items to service_role;
alter table public.menu_items enable row level security;
create policy "menu_items:select:all" on public.menu_items for select to anon, authenticated using (true);

-- ============ item_options ============
create table public.item_options (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  kind text not null check (kind in ('size','addon')),
  group_name text not null,
  name text not null,
  price_delta numeric(10,2) not null default 0 check (price_delta >= 0),
  is_default boolean not null default false,
  sort_order int not null default 0
);
create index idx_item_options_item on public.item_options(menu_item_id);
grant select on public.item_options to anon, authenticated;
grant all on public.item_options to service_role;
alter table public.item_options enable row level security;
create policy "item_options:select:all" on public.item_options for select to anon, authenticated using (true);

-- ============ coupons ============
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text not null default '',
  discount_type text not null check (discount_type in ('percent','fixed','free_delivery')),
  value numeric(10,2) not null default 0,
  min_subtotal numeric(10,2) not null default 0,
  max_discount numeric(10,2),
  restaurant_id uuid references public.restaurants(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.coupons to anon, authenticated;
grant all on public.coupons to service_role;
alter table public.coupons enable row level security;
create policy "coupons:select:active" on public.coupons for select to anon, authenticated using (active);

-- ============ couriers ============
create table public.couriers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  photo_url text not null,
  rating numeric(2,1) not null default 4.8,
  trips int not null default 0,
  vehicle text not null,
  plate text not null,
  phone text not null,
  created_at timestamptz not null default now()
);
grant select on public.couriers to authenticated;
grant all on public.couriers to service_role;
alter table public.couriers enable row level security;

-- ============ addresses ============
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  label text not null default 'Casa',
  line1 text not null,
  line2 text,
  lat double precision not null,
  lng double precision not null,
  created_at timestamptz not null default now()
);
create index idx_addresses_user on public.addresses(user_id);
grant select, insert, update, delete on public.addresses to authenticated;
grant all on public.addresses to service_role;
alter table public.addresses enable row level security;
create policy "addresses:select:own" on public.addresses for select to authenticated using (auth.uid() = user_id);
create policy "addresses:insert:own" on public.addresses for insert to authenticated with check (auth.uid() = user_id);
create policy "addresses:update:own" on public.addresses for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "addresses:delete:own" on public.addresses for delete to authenticated using (auth.uid() = user_id);

-- ============ orders ============
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  short_code text not null default lpad((floor(random() * 10000))::int::text, 4, '0'),
  user_id uuid not null,
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  courier_id uuid references public.couriers(id) on delete set null,
  mode text not null default 'delivery' check (mode in ('delivery','pickup')),
  status text not null default 'confirmed' check (status in ('confirmed','preparing','picked_up','on_the_way','delivered','cancelled')),
  address_label text,
  address_text text,
  dest_lat double precision not null,
  dest_lng double precision not null,
  route jsonb not null default '[]',
  route_progress double precision not null default 0,
  courier_lat double precision,
  courier_lng double precision,
  subtotal numeric(10,2) not null,
  delivery_fee numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  coupon_code text,
  payment_method text not null default 'pix',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_orders_user_created on public.orders(user_id, created_at desc);
grant select on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "orders:select:own" on public.orders for select to authenticated using (auth.uid() = user_id);
create trigger orders_updated_at before update on public.orders for each row execute function public.handle_updated_at();

create policy "couriers:select:assigned" on public.couriers for select to authenticated
  using (exists (select 1 from public.orders o where o.courier_id = couriers.id and o.user_id = auth.uid()));

-- ============ order_items ============
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  name text not null,
  image_url text,
  unit_price numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  options jsonb not null default '[]',
  note text,
  created_at timestamptz not null default now()
);
create index idx_order_items_order on public.order_items(order_id);
grant select on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "order_items:select:own" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid()));

-- ============ order_status_events ============
create table public.order_status_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  created_at timestamptz not null default now(),
  unique (order_id, status)
);
create index idx_order_status_events_order on public.order_status_events(order_id);
grant select on public.order_status_events to authenticated;
grant all on public.order_status_events to service_role;
alter table public.order_status_events enable row level security;
create policy "order_status_events:select:own" on public.order_status_events for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_status_events.order_id and o.user_id = auth.uid()));

-- ============ favorites ============
create table public.favorites (
  user_id uuid not null,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, restaurant_id)
);
grant select, insert, delete on public.favorites to authenticated;
grant all on public.favorites to service_role;
alter table public.favorites enable row level security;
create policy "favorites:select:own" on public.favorites for select to authenticated using (auth.uid() = user_id);
create policy "favorites:insert:own" on public.favorites for insert to authenticated with check (auth.uid() = user_id);
create policy "favorites:delete:own" on public.favorites for delete to authenticated using (auth.uid() = user_id);

-- ============ Realtime ============
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_status_events;

-- ============ Seed ============
insert into public.categories (slug, name, emoji, sort_order) values
  ('burger','Burger','🍔',1),('pizza','Pizza','🍕',2),('sushi','Sushi','🍣',3),('frango','Frango','🍗',4);

insert into public.restaurants (slug, name, branch, category_slug, cover_url, logo_emoji, description, rating, rating_count, delivery_fee, eta_min, distance_km, discount_pct, lat, lng, address) values
  ('burger-verde','Burger Verde','Bela Vista','burger','https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&q=80','🍔','Hambúrgueres artesanais com blend da casa.',4.7,12400,5.99,20,1.2,15,-23.5583,-46.6612,'R. Frei Caneca, 320 - Consolação'),
  ('smash-brothers','Smash Brothers','Paulista','burger','https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=1200&q=80','🥩','Smash burgers prensados na chapa.',4.6,8300,4.99,18,0.6,30,-23.5636,-46.6528,'Al. Santos, 1100 - Jardim Paulista'),
  ('bella-napoli','Bella Napoli Pizzaria','Jardins','pizza','https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?w=1200&q=80','🍕','Pizza napolitana em forno a lenha.',4.8,15200,7.90,30,2.1,25,-23.5668,-46.6672,'R. Oscar Freire, 540 - Jardins'),
  ('sakura-sushi','Sakura Sushi Bar','Liberdade','sushi','https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=1200&q=80','🍣','Culinária japonesa tradicional e contemporânea.',4.9,9800,8.50,35,3.4,20,-23.5575,-46.6352,'R. Galvão Bueno, 210 - Liberdade'),
  ('frango-dourado','Frango Dourado','Consolação','frango','https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=1200&q=80','🍗','Frango frito crocante e grelhados.',4.5,6100,0,15,0.9,10,-23.5538,-46.6585,'R. da Consolação, 2200 - Consolação');

insert into public.menu_items (restaurant_id, name, description, price, kcal, prep_min, image_url, sort_order)
select r.id, v.name, v.description, v.price, v.kcal, v.prep_min, v.image_url, v.sort_order
from (values
  ('burger-verde','Clássico Verde','Blend bovino 160g, queijo prato, alface, tomate e molho da casa no pão brioche.',29.90,620,12,'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',1),
  ('burger-verde','Duplo Cheddar','Dois blends de 120g, cheddar derretido, cebola caramelizada e picles.',36.90,890,14,'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=600&q=80',2),
  ('burger-verde','Bacon Supreme','Blend 160g, bacon crocante, queijo, alface e maionese defumada.',34.90,780,13,'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&q=80',3),
  ('burger-verde','Batata Rústica','Batatas com casca, alecrim e parmesão. Acompanha maionese verde.',16.90,420,8,'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80',4),
  ('smash-brothers','Smash Clássico','Smash 90g, queijo americano, cebola e molho especial.',24.90,540,10,'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&q=80',1),
  ('smash-brothers','Smash Duplo','Dois smashes, duplo queijo americano e picles.',31.90,760,11,'https://images.unsplash.com/photo-1513185158878-8d8c2a2a3da3?w=600&q=80',2),
  ('smash-brothers','Combo Smash & Fritas','Smash clássico com fritas crocantes.',36.90,980,12,'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&q=80',3),
  ('smash-brothers','Fritas com Parmesão','Fritas finas, parmesão ralado e salsinha.',14.90,390,7,'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80',4),
  ('bella-napoli','Margherita','Molho de tomate San Marzano, muçarela de búfala e manjericão.',49.90,1100,20,'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80',1),
  ('bella-napoli','Pepperoni','Muçarela e pepperoni fatiado fininho.',56.90,1300,20,'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&q=80',2),
  ('bella-napoli','Calabresa','Calabresa artesanal, cebola roxa e azeitonas.',52.90,1250,20,'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&q=80',3),
  ('bella-napoli','Quatro Queijos','Muçarela, gorgonzola, parmesão e catupiry.',58.90,1400,22,'https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=600&q=80',4),
  ('bella-napoli','Vegetariana','Abobrinha, pimentão, tomate-cereja e rúcula.',51.90,980,20,'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',5),
  ('sakura-sushi','Combo Sakura 20 peças','Seleção do chef: niguiris, uramakis e hossomakis.',79.90,780,18,'https://images.unsplash.com/photo-1563612116625-3012372fccce?w=600&q=80',1),
  ('sakura-sushi','Uramaki Salmão','8 peças de uramaki com salmão, cream cheese e gergelim.',34.90,420,12,'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&q=80',2),
  ('sakura-sushi','Hot Roll','8 peças empanadas com salmão e cream cheese, molho tarê.',32.90,560,12,'https://images.unsplash.com/photo-1617196035154-1e7e6e28b0db?w=600&q=80',3),
  ('sakura-sushi','Sashimi de Salmão','10 fatias de salmão fresco.',44.90,310,10,'https://images.unsplash.com/photo-1607330289024-1535c6b4e1c1?w=600&q=80',4),
  ('sakura-sushi','Salmão Grelhado','Filé de salmão grelhado com arroz gohan e legumes.',58.90,640,20,'https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?w=600&q=80',5),
  ('frango-dourado','Balde Crocante','8 pedaços de frango frito crocante temperado.',44.90,1500,15,'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=600&q=80',1),
  ('frango-dourado','Tirinhas com Molho','Tiras de peito empanadas com molho de mostarda e mel.',29.90,720,12,'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&q=80',2),
  ('frango-dourado','Asinhas Picantes','10 asinhas glaceadas com molho apimentado e gergelim.',32.90,880,14,'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=600&q=80',3),
  ('frango-dourado','Frango Grelhado','Peito grelhado com legumes salteados.',31.90,520,15,'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&q=80',4),
  ('frango-dourado','Espetinhos Mistos','Espetinhos de frango e legumes na brasa.',34.90,690,16,'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80',5)
) as v(slug, name, description, price, kcal, prep_min, image_url, sort_order)
join public.restaurants r on r.slug = v.slug;

-- Sizes for every item
insert into public.item_options (menu_item_id, kind, group_name, name, price_delta, is_default, sort_order)
select m.id, 'size', 'Tamanho', s.name, s.delta, s.ord = 1, s.ord
from public.menu_items m
cross join (values ('Regular', 0.00, 1), ('Grande', 5.00, 2), ('Combo', 12.00, 3)) as s(name, delta, ord);

-- Category-specific add-ons
insert into public.item_options (menu_item_id, kind, group_name, name, price_delta, sort_order)
select m.id, 'addon', 'Adicionais', a.name, a.delta, a.ord
from public.menu_items m
join public.restaurants r on r.id = m.restaurant_id
join (values
  ('burger','Queijo extra',3.50,1),('burger','Bacon',4.00,2),('burger','Cebola caramelizada',2.50,3),('burger','Molho barbecue',1.50,4),
  ('pizza','Borda recheada',8.00,1),('pizza','Catupiry extra',5.00,2),('pizza','Azeitonas',2.00,3),
  ('sushi','Cream cheese extra',3.00,1),('sushi','Molho tarê',2.00,2),('sushi','Gengibre extra',1.50,3),
  ('frango','Molho de alho',1.50,1),('frango','Molho barbecue',1.50,2),('frango','Porção de fritas',6.90,3)
) as a(cat, name, delta, ord) on a.cat = r.category_slug;

-- Drinks for every item
insert into public.item_options (menu_item_id, kind, group_name, name, price_delta, sort_order)
select m.id, 'addon', 'Bebidas', d.name, d.delta, d.ord
from public.menu_items m
cross join (values ('Coca-Cola lata', 5.50, 1), ('Guaraná lata', 5.00, 2), ('Água mineral', 3.50, 3)) as d(name, delta, ord);

insert into public.coupons (code, title, description, discount_type, value, min_subtotal, max_discount, restaurant_id) values
  ('FOODIE30','30% OFF no pedido','Em pedidos a partir de R$ 40. Desconto máximo de R$ 25.','percent',30,40,25,null),
  ('FRETEGRATIS','Entrega grátis','Frete grátis em qualquer pedido.','free_delivery',0,0,null,null),
  ('BEMVINDO10','R$ 10 de desconto','Em pedidos a partir de R$ 30.','fixed',10,30,null,null);

insert into public.coupons (code, title, description, discount_type, value, min_subtotal, max_discount, restaurant_id)
select v.code, v.title, v.description, v.discount_type, v.value, v.min_subtotal, v.max_discount, r.id
from (values
  ('burger-verde','BURGER15','15% OFF','Pedido mínimo de R$ 50. Só nesta loja.','percent',15.00,50.00,null::numeric),
  ('smash-brothers','SMASH30','30% OFF','Pedido mínimo de R$ 40. Máx. R$ 20.','percent',30.00,40.00,20.00),
  ('bella-napoli','NAPOLI25','25% OFF','Pedido mínimo de R$ 60. Máx. R$ 30.','percent',25.00,60.00,30.00),
  ('sakura-sushi','SAKURA20','R$ 20 OFF','Pedido mínimo de R$ 80. Só nesta loja.','fixed',20.00,80.00,null::numeric),
  ('frango-dourado','FRANGO10','10% OFF','Pedido mínimo de R$ 30. Só nesta loja.','percent',10.00,30.00,null::numeric)
) as v(slug, code, title, description, discount_type, value, min_subtotal, max_discount)
join public.restaurants r on r.slug = v.slug;

insert into public.couriers (name, photo_url, rating, trips, vehicle, plate, phone) values
  ('João Silva','https://randomuser.me/api/portraits/men/32.jpg',4.8,1170,'Honda CG 160 · Preta','FOO-2E09','+5511990000001'),
  ('Marina Costa','https://randomuser.me/api/portraits/women/44.jpg',4.9,860,'Yamaha Factor 150 · Vermelha','DLV-7A31','+5511990000002'),
  ('Rafael Souza','https://randomuser.me/api/portraits/men/75.jpg',4.7,2310,'Honda Biz 125 · Branca','MTO-4C88','+5511990000003');
