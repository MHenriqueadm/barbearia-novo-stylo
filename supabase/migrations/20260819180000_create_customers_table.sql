create table public.customers (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    phone text not null,
    phone_normalized text not null unique,
    email text,
    birth_date date,
    notes text,
    active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- RLS
alter table public.customers enable row level security;

create policy "Authenticated users can select customers" on public.customers for select to authenticated using (true);
create policy "Authenticated users can insert customers" on public.customers for insert to authenticated with check (true);
create policy "Authenticated users can update customers" on public.customers for update to authenticated using (true);

-- Grants
grant select, insert, update, delete on public.customers to authenticated;
grant all on public.customers to service_role;

-- Step 2: Alter appointments table
alter table public.appointments add column customer_id uuid references public.customers(id);

-- Migration for created_at/updated_at defaults if missing (good practice)
alter table public.customers alter column created_at set default now();
alter table public.appointments alter column created_at set default now();
