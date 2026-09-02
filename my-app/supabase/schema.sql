NOTIFY pgrst, 'reload schema';

-- ============================================================
-- FAZ 1: Departman / Makine / Pozisyon / Parça / Yetki mimarisi
-- ============================================================

-- ---------- Yeni enum tipleri ----------
do $$ begin
  create type authority_level as enum ('seviye_1', 'seviye_2');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type part_group as enum ('elektrik', 'mekanik');
exception when duplicate_object then null;
end $$;

-- ---------- Departmanlar ----------
create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists departments_company_idx on departments(company_id);

-- ---------- Makinelere departman + seri no + max hız ekle ----------
alter table machines add column if not exists department_id uuid references departments(id) on delete set null;
alter table machines add column if not exists serial_number text;
alter table machines add column if not exists max_speed numeric;

create index if not exists machines_department_idx on machines(department_id);

-- ---------- Makine pozisyonları (somut kayıtlar) ----------
create table if not exists machine_positions (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references machines(id) on delete cascade,
  position_number integer not null,
  created_at timestamptz not null default now(),
  unique (machine_id, position_number)
);

create index if not exists machine_positions_machine_idx on machine_positions(machine_id);

-- ---------- Makine kategori/parça ağacı (self-referencing) ----------
create table if not exists machine_categories (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references machines(id) on delete cascade,
  parent_id uuid references machine_categories(id) on delete cascade,
  group_type part_group not null,
  name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists machine_categories_machine_idx on machine_categories(machine_id);
create index if not exists machine_categories_parent_idx on machine_categories(parent_id);

-- ---------- Profiles tablosu güncellemeleri ----------
alter table profiles add column if not exists department_id uuid references departments(id) on delete set null;
alter table profiles add column if not exists authority_level authority_level;
alter table profiles add column if not exists title text;
alter table profiles add column if not exists phone text;

-- ---------- Invites tablosu güncellemeleri ----------
alter table invites add column if not exists department_id uuid references departments(id) on delete set null;
alter table invites add column if not exists authority_level authority_level;

-- ---------- Tickets tablosu güncellemeleri ----------
alter table tickets add column if not exists department_id uuid references departments(id) on delete set null;
alter table tickets add column if not exists position_id uuid references machine_positions(id) on delete set null;
alter table tickets add column if not exists category_id uuid references machine_categories(id) on delete set null;

create index if not exists tickets_department_idx on tickets(department_id);

-- ============================================================
-- Varsayılan parça şablonu
-- ============================================================
create or replace function seed_default_machine_categories(target_machine_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
declare
  elektrik_names text[] := array['Motor', 'Sensör', 'PLC', 'Elektrik Panosu', 'Kablo', 'Kontaktör', 'Röle', 'İnverter', 'Güç Kaynağı', 'Diğer Elektrik'];
  mekanik_names text[] := array['Rulman', 'Cıvata', 'Kayış', 'Kaplin', 'Redüktör', 'Mil', 'Pnömatik', 'Hidrolik', 'Diğer Mekanik'];
  i integer;
begin
  for i in 1 .. array_length(elektrik_names, 1) loop
    insert into machine_categories (machine_id, parent_id, group_type, name, sort_order)
    values (target_machine_id, null, 'elektrik', elektrik_names[i], i);
  end loop;

  for i in 1 .. array_length(mekanik_names, 1) loop
    insert into machine_categories (machine_id, parent_id, group_type, name, sort_order)
    values (target_machine_id, null, 'mekanik', mekanik_names[i], i);
  end loop;
end;
$$;

-- ============================================================
-- Şirket + admin oluşturma
-- ============================================================
create or replace function create_company(
  company_name text,
  admin_name text,
  admin_title text default null,
  admin_phone text default null
)
returns json language plpgsql security definer set search_path = public
as $$
declare company_id uuid;
begin
  insert into companies(name) values (company_name) returning id into company_id;
  insert into profiles(id, company_id, name, role, title, phone)
  values (auth.uid(), company_id, admin_name, 'admin', admin_title, admin_phone);
  return json_build_object('user_id', auth.uid(), 'company_id', company_id);
end;
$$;

-- ============================================================
-- Departman Yönetimi
-- ============================================================
create or replace function create_department(department_name text)
returns json language plpgsql security definer set search_path = public
as $$
declare new_id uuid;
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Sadece işletme sahibi departman oluşturabilir.';
  end if;

  insert into departments (company_id, name, created_by)
  values (current_company_id(), department_name, auth.uid())
  returning id into new_id;

  return json_build_object('id', new_id, 'name', department_name);
end;
$$;

create or replace function update_department(target_id uuid, new_name text default null, new_is_active boolean default null)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Yetkisiz işlem.';
  end if;

  update departments
  set name = coalesce(new_name, name),
      is_active = coalesce(new_is_active, is_active)
  where id = target_id and company_id = current_company_id();
end;
$$;

-- ============================================================
-- Makine Yönetimi
-- ============================================================
create or replace function create_machine_full(
  target_department_id uuid,
  machine_name text,
  position_count integer,
  serial_no text,
  max_speed_value numeric
)
returns json language plpgsql security definer set search_path = public
as $$
declare
  new_machine_id uuid;
  i integer;
  qr text;
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Sadece işletme sahibi makine oluşturabilir.';
  end if;

  if not exists (select 1 from departments where id = target_department_id and company_id = current_company_id()) then
    raise exception 'Departman bulunamadı.';
  end if;

  if position_count is null or position_count < 1 then
    raise exception 'Pozisyon sayısı en az 1 olmalı.';
  end if;

  qr := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10));

  insert into machines (company_id, department_id, name, positions, serial_number, max_speed, qr_code, created_by)
  values (current_company_id(), target_department_id, machine_name, position_count, serial_no, max_speed_value, qr, auth.uid())
  returning id into new_machine_id;

  for i in 1 .. position_count loop
    insert into machine_positions (machine_id, position_number) values (new_machine_id, i);
  end loop;

  perform seed_default_machine_categories(new_machine_id);

  return json_build_object('id', new_machine_id, 'qr_code', qr);
end;
$$;

create or replace function increase_machine_positions(target_machine_id uuid, new_position_count integer)
returns void language plpgsql security definer set search_path = public
as $$
declare
  current_count integer;
  i integer;
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Yetkisiz işlem.';
  end if;

  select positions into current_count from machines
  where id = target_machine_id and company_id = current_company_id();

  if current_count is null then
    raise exception 'Makine bulunamadı.';
  end if;

  if new_position_count <= current_count then
    raise exception 'Yeni pozisyon sayısı mevcuttan büyük olmalı (azaltma desteklenmiyor).';
  end if;

  for i in (current_count + 1) .. new_position_count loop
    insert into machine_positions (machine_id, position_number) values (target_machine_id, i);
  end loop;

  update machines set positions = new_position_count where id = target_machine_id;
end;
$$;

-- ============================================================
-- Kategori/Parça Yönetimi
-- ============================================================
create or replace function add_machine_category(
  target_machine_id uuid,
  parent_category_id uuid,
  category_group part_group,
  category_name text
)
returns json language plpgsql security definer set search_path = public
as $$
declare new_id uuid;
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Yetkisiz işlem.';
  end if;

  if not exists (select 1 from machines where id = target_machine_id and company_id = current_company_id()) then
    raise exception 'Makine bulunamadı.';
  end if;

  insert into machine_categories (machine_id, parent_id, group_type, name)
  values (target_machine_id, parent_category_id, category_group, category_name)
  returning id into new_id;

  return json_build_object('id', new_id);
end;
$$;

create or replace function update_machine_category(target_id uuid, new_name text default null, new_is_active boolean default null)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Yetkisiz işlem.';
  end if;

  update machine_categories
  set name = coalesce(new_name, name),
      is_active = coalesce(new_is_active, is_active)
  where id = target_id
    and machine_id in (select id from machines where company_id = current_company_id());
end;
$$;

-- ============================================================
-- Davet Yönetimi (Bakımcı + Amiri için Genişletilmiş)
-- ============================================================
drop function if exists create_invite(user_role, uuid, maintenance_type, authority_level);
drop function if exists create_invite(user_role);

create or replace function create_invite(
  invite_role user_role,
  target_department_id uuid default null,
  invite_maintenance_type maintenance_type default 'genel',
  invite_authority_level authority_level default null
)
returns text language plpgsql security definer set search_path = public
as $$
declare invite_code text;
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Only admins can create invites';
  end if;

  if invite_role in ('bakimci', 'amiri') and target_department_id is null then
    raise exception 'Departman seçilmelidir.';
  end if;

  if invite_role in ('bakimci', 'amiri') and invite_authority_level is null then
    raise exception 'Yetki seviyesi seçilmelidir.';
  end if;

  invite_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
  insert into invites (code, company_id, role, maintenance_type, department_id, authority_level, created_by)
  values (
    invite_code,
    current_company_id(),
    invite_role,
    case when invite_role = 'bakimci' then invite_maintenance_type else null end,
    case when invite_role in ('bakimci', 'amiri') then target_department_id else null end,
    case when invite_role in ('bakimci', 'amiri') then invite_authority_level else null end,
    auth.uid()
  );
  return invite_code;
end;
$$;

create or replace function redeem_invite(invite_code text, member_name text)
returns json language plpgsql security definer set search_path = public
as $$
declare invite_row invites%rowtype;
begin
  select * into invite_row from invites
  where code = upper(invite_code) and used_by is null
  for update;
  if not found then raise exception 'Invalid or already used invite code'; end if;

  insert into profiles (id, company_id, name, role, maintenance_type, department_id, authority_level)
  values (auth.uid(), invite_row.company_id, member_name, invite_row.role, invite_row.maintenance_type, invite_row.department_id, invite_row.authority_level)
  on conflict (id) do update set
    company_id = excluded.company_id,
    name = excluded.name,
    role = excluded.role,
    maintenance_type = excluded.maintenance_type,
    department_id = excluded.department_id,
    authority_level = excluded.authority_level;

  update invites set used_by = auth.uid(), used_at = now() where code = invite_row.code;

  return json_build_object(
    'user_id', auth.uid(),
    'company_id', invite_row.company_id,
    'role', invite_row.role,
    'maintenance_type', invite_row.maintenance_type,
    'department_id', invite_row.department_id,
    'authority_level', invite_row.authority_level
  );
end;
$$;

-- ============================================================
-- Merkezi Bildirim / Erişim Routing
-- ============================================================
create or replace function get_eligible_supervisor_ids(
  target_department_id uuid,
  fault_maintenance_type maintenance_type
)
returns table (user_id uuid) language sql stable security definer set search_path = public
as $$
  select id from profiles
  where role = 'bakimci'
    and (
      authority_level = 'seviye_2'
      or (authority_level = 'seviye_1' and department_id = target_department_id)
    )
    and (
      maintenance_type = 'genel'
      or maintenance_type = fault_maintenance_type
    );
$$;

-- ============================================================
-- RLS Güvenlik Politikaları
-- ============================================================
alter table departments enable row level security;
alter table machine_positions enable row level security;
alter table machine_categories enable row level security;

drop policy if exists "members read departments" on departments;
create policy "members read departments" on departments for select using (company_id = current_company_id());

drop policy if exists "admin manage departments" on departments;
create policy "admin manage departments" on departments for all using (
  company_id = current_company_id() and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
) with check (
  company_id = current_company_id() and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "members read positions" on machine_positions;
create policy "members read positions" on machine_positions for select using (
  machine_id in (select id from machines where company_id = current_company_id())
);

drop policy if exists "members read categories" on machine_categories;
create policy "members read categories" on machine_categories for select using (
  machine_id in (select id from machines where company_id = current_company_id())
);

NOTIFY pgrst, 'reload schema';