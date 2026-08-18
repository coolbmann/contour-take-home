-- Database-side counterpart to lib/auth.
--
-- The TypeScript guard protects your API routes. It does NOT protect the
-- tables: the publishable key ships to the browser, so anyone can skip your
-- routes and talk to PostgREST directly. These helpers let RLS enforce the
-- same rules the app enforces, from the one place that cannot be bypassed.

-- Does the current user hold "<scope>.<grant>"? Soft deletes are honoured at
-- every hop, matching loadAccessFor() in lib/auth/access.ts.
create or replace function public.has_permission(p_scope text, p_grant text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r
      on r.id = ur.role_id and r.deleted_at is null
    join public.role_permissions rp
      on rp.role_id = r.id and rp.deleted_at is null
    join public.permissions p
      on p.id = rp.permission_id and p.deleted_at is null
    where ur.user_id = auth.uid()
      and ur.deleted_at is null
      and p.scope = p_scope
      and p.grant = p_grant
  );
$$;

create or replace function public.has_role(p_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r
      on r.id = ur.role_id and r.deleted_at is null
    where ur.user_id = auth.uid()
      and ur.deleted_at is null
      and r.name = p_role
  );
$$;

revoke all on function public.has_permission(text, text) from public;
revoke all on function public.has_role(text) from public;
-- anon needs execute too: the policies call these, and without it a signed-out
-- request fails with "permission denied for function" instead of simply
-- matching no rows. Both return false when auth.uid() is null.
grant execute on function public.has_permission(text, text) to anon, authenticated;
grant execute on function public.has_role(text) to anon, authenticated;

-- Consultations: the permission decides *what you may do*, ownership decides
-- *which rows*. Both must hold, so a read grant never becomes "read everyone".
alter table public.consultations enable row level security;

create policy "read own consultations" on public.consultations
  for select using (
    auth.uid() = user_id and public.has_permission('consultation', 'read')
  );

create policy "create own consultations" on public.consultations
  for insert with check (
    auth.uid() = user_id and public.has_permission('consultation', 'create')
  );

create policy "update own consultations" on public.consultations
  for update
  using (auth.uid() = user_id and public.has_permission('consultation', 'update'))
  with check (auth.uid() = user_id);

create policy "delete own consultations" on public.consultations
  for delete using (
    auth.uid() = user_id and public.has_permission('consultation', 'delete')
  );

-- The RBAC tables themselves must be readable (the app resolves roles through
-- them) but never writable from the client.
alter table public.user_roles       enable row level security;
alter table public.roles            enable row level security;
alter table public.role_permissions enable row level security;
alter table public.permissions      enable row level security;

create policy "read own role assignments" on public.user_roles
  for select using (auth.uid() = user_id);
create policy "read roles" on public.roles
  for select using (true);
create policy "read role permissions" on public.role_permissions
  for select using (true);
create policy "read permissions" on public.permissions
  for select using (true);
