# Pending migrations

Written, reviewed, and **not applied to any environment** — neither local nor
the remote project. Files here are deliberately outside `supabase/migrations/`
so `supabase db reset` does not run them.

## `20260818010000_permission_helpers.sql`

Enables RLS on `consultations` and the four RBAC tables, and adds
`has_permission()` / `has_role()` so policies can ask the same questions
`lib/auth/access.ts` asks.

It is held back so local mirrors remote, which runs without RLS. Without it the
app's guards protect the *routes* but not the *tables*: the publishable key
ships to the browser, so anyone can bypass the routes and talk to PostgREST
directly.

Three things must be fixed in this file before it is applied anywhere, all
measured against a local database with it enabled:

1. **`consultation.readAll` has no policy.** It postdates the file. An admin
   owns no rows and lacks `consultation.read`, so both halves of the ownership
   policy are false and the admin dashboard reads zero rows. Needs:

   ```sql
   create policy "read all consultations" on public.consultations
     for select using (public.has_permission('consultation', 'readAll'));
   ```

2. **`user_roles` has no INSERT policy.** Sign-up's role assignment is rejected
   with `42501`, so every new account is created with no permissions and 404s
   on every guarded page. Needs an INSERT policy scoped to
   `auth.uid() = user_id`.

3. **The policies do not filter `deleted_at`.** A soft-deleted consultation
   stays readable through PostgREST; only the service layer hides it.

To apply: move it back into `supabase/migrations/` and run
`npx supabase db reset`.
