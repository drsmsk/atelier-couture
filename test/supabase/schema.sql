-- ============================================================
-- Schéma de la base de données — Atelier Haute Couture
-- À exécuter une seule fois dans l'éditeur SQL de Supabase
-- (Dashboard Supabase > SQL Editor > New query > coller > Run)
-- ============================================================

-- ---------- Table : clients ----------
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  phone text,
  notes text,
  -- Mensurations (en cm)
  tour_poitrine numeric,
  tour_taille numeric,
  tour_hanches numeric,
  tour_bras numeric,
  carrure numeric,
  hauteur numeric,
  longueur_manche numeric,
  emmanchure numeric,
  largeur_manche numeric
);

-- ---------- Table : products (pièces uniques) ----------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  client_id uuid not null references clients(id) on delete restrict,
  type text not null check (type in ('Caftan', 'Lebsa', 'Djelaba', 'Babouche')),
  description text,
  photo_url text,
  price numeric not null default 0,
  status text not null default 'En cours' check (status in ('En cours', 'Essayage', 'Livré')),
  order_date date not null default current_date,
  notes text
);

create index if not exists products_client_id_idx on products(client_id);

-- ---------- Table : payments (versements) ----------
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  product_id uuid not null references products(id) on delete cascade,
  amount numeric not null,
  payment_date date not null default current_date,
  note text
);

create index if not exists payments_product_id_idx on payments(product_id);

-- ---------- Vue : totaux par pièce ----------
create or replace view product_totals as
select
  pr.id as product_id,
  coalesce(sum(pay.amount), 0) as total_verse,
  pr.price - coalesce(sum(pay.amount), 0) as reste_a_payer
from products pr
left join payments pay on pay.product_id = pr.id
group by pr.id, pr.price;

-- ---------- Vue : totaux par client ----------
create or replace view client_totals as
select
  c.id as client_id,
  coalesce(prod_totals.total_commande, 0) as total_commande,
  coalesce(pay_totals.total_verse, 0) as total_verse,
  coalesce(prod_totals.total_commande, 0) - coalesce(pay_totals.total_verse, 0) as reste_a_payer
from clients c
left join (
  select client_id, sum(price) as total_commande
  from products
  group by client_id
) prod_totals on prod_totals.client_id = c.id
left join (
  select pr.client_id, sum(pay.amount) as total_verse
  from payments pay
  join products pr on pay.product_id = pr.id
  group by pr.client_id
) pay_totals on pay_totals.client_id = c.id;

-- ---------- Sécurité (RLS) ----------
-- Seuls les utilisateurs connectés (toi et ton père) peuvent lire/écrire.
-- Il n'y a pas d'inscription publique : vous créez vos 2 comptes à la main
-- dans Authentication > Users du dashboard Supabase.

alter table clients enable row level security;
alter table products enable row level security;
alter table payments enable row level security;

create policy "Authenticated full access clients" on clients
  for all to authenticated using (true) with check (true);

create policy "Authenticated full access products" on products
  for all to authenticated using (true) with check (true);

create policy "Authenticated full access payments" on payments
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on clients, products, payments to authenticated;
grant select on product_totals, client_totals to authenticated;

-- ---------- Stockage des photos ----------
insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', true)
on conflict (id) do nothing;

create policy "Authenticated can upload product photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-photos');

create policy "Authenticated can update product photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-photos');

create policy "Authenticated can delete product photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-photos');
