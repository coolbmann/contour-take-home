-- Local development fixtures.
--
-- Run automatically by `supabase db reset`, after every file in
-- supabase/migrations/. Assumes an empty database, but every statement is
-- ON CONFLICT DO NOTHING so re-running it by hand is safe.
--
-- Executes as `postgres`, which bypasses RLS. That is why this file can write
-- rows the application itself could not — and why seeded data is not evidence
-- that the policies allow anything.
--
-- Every account below uses the password: password123

begin;

-- Auth users ----------------------------------------------------------------
-- Written directly rather than through the API because `supabase db reset`
-- has no HTTP client. Two rows are needed per account: auth.users holds the
-- credentials, auth.identities is what the password grant actually looks up —
-- without it, sign-in fails with "Invalid login credentials" against a user
-- that plainly exists.
--
-- `email_confirmed_at` is set so no confirmation step is required. This matches
-- config.toml (`enable_confirmations = false`) and the remote project.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000',
  seed.id,
  'authenticated',
  'authenticated',
  seed.email,
  extensions.crypt('password123', extensions.gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('first_name', seed.first_name, 'last_name', seed.last_name),
  '', '', '', ''
from (values
  ('11111111-1111-4111-8111-111111111111'::uuid, 'admin@contour.test',  'Alex',   'Whitfield'),
  ('22222222-2222-4222-8222-222222222222'::uuid, 'ada@contour.test',    'Ada',    'Nguyen'),
  ('33333333-3333-4333-8333-333333333333'::uuid, 'marcus@contour.test', 'Marcus', 'Okonkwo'),
  ('44444444-4444-4444-8444-444444444444'::uuid, 'priya@contour.test',  'Priya',  'Raman')
) as seed(id, email, first_name, last_name)
on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(),
  u.id,
  u.id::text,
  jsonb_build_object(
    'sub', u.id::text,
    'email', u.email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  now(), now(), now()
from auth.users u
where u.email like '%@contour.test'
on conflict do nothing;

-- Profiles ------------------------------------------------------------------
-- public.handle_new_user() exists in the schema but the trigger that calls it
-- lives on auth.users, in the auth schema, which the dump does not carry. So
-- nothing populates these locally and the seed does it explicitly. The ON
-- CONFLICT keeps this correct if you later attach the trigger.

insert into public.user_profiles (id, first_name, last_name)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'first_name', ''),
  coalesce(u.raw_user_meta_data ->> 'last_name', '')
from auth.users u
where u.email like '%@contour.test'
on conflict (id) do nothing;

-- RBAC ----------------------------------------------------------------------
-- Ids are pinned, not generated. The application hardcodes them —
-- STUDENT_ROLE_ID = 1 in app/api/auth/create-account/route.ts and
-- ADMIN_ROLE_ID = 2 in app/api/auth/login/route.ts — so a locally generated
-- id would break sign-up and the admin redirect in ways that look like
-- application bugs. roles.id is GENERATED ALWAYS, hence OVERRIDING SYSTEM VALUE.

insert into public.roles (id, name, description) overriding system value
values
  (1, 'Student', 'Super level role for all students'),
  (2, 'Admin',   'Super admin')
on conflict (id) do nothing;

insert into public.permissions (id, scope, "grant") overriding system value
values
  (1, 'consultation', 'create'),
  (2, 'consultation', 'read'),
  (3, 'consultation', 'update'),
  (4, 'consultation', 'delete'),
  -- read *everyone's* bookings; distinct from 'read', which is your own.
  (5, 'consultation', 'readAll')
on conflict (id) do nothing;

-- Sequences must be moved past the pinned ids, or the next natural insert
-- collides with row 1.
select setval(pg_get_serial_sequence('public.roles', 'id'),
              (select max(id) from public.roles), true);
select setval(pg_get_serial_sequence('public.permissions', 'id'),
              (select max(id) from public.permissions), true);

-- Mirrors the remote grants exactly: Student may act on its own bookings,
-- Admin may only read across all of them.
insert into public.role_permissions (role_id, permission_id)
values
  (1, 1), (1, 2), (1, 3), (1, 4),
  (2, 5)
on conflict do nothing;

insert into public.user_roles (user_id, role_id)
select u.id, assignment.role_id
from auth.users u
join (values
  ('admin@contour.test',  2),
  ('ada@contour.test',    1),
  ('marcus@contour.test', 1),
  ('priya@contour.test',  1)
) as assignment(email, role_id) on assignment.email = u.email
on conflict do nothing;

-- Consultations -------------------------------------------------------------
-- Dates are relative to the day the seed runs, so the fixtures never go stale.
-- Times are expressed in Australia/Melbourne — the business's wall clock, and
-- the zone lib/consultations/format.ts formats for — so they land on the hour
-- against SLOT_TIMES (08:00–18:00). On a machine in another timezone they will
-- render shifted; that is the app's local-time behaviour, not a seeding bug.
--
-- The spread is deliberate: upcoming, completed, and soft-deleted, so every
-- state the UI can render has something behind it. The soft-deleted row should
-- NOT appear in the app — it is there to prove the deleted_at filters work.

insert into public.consultations (
  id, user_id, booking_date_time, duration_mins, reason, completed_at, deleted_at
) overriding system value
select
  seed.id, u.id, seed.booking_date_time, 60, seed.reason,
  seed.completed_at, seed.deleted_at
from (values
  -- Ada: two upcoming, one completed, one cancelled.
  (1, 'ada@contour.test',
   ((current_date + 1)::timestamp + time '16:00') at time zone 'Australia/Melbourne',
   'Stuck on integration by substitution — want to work through the SAC revision set.',
   null::timestamptz, null::timestamptz),
  (2, 'ada@contour.test',
   ((current_date + 3)::timestamp + time '09:00') at time zone 'Australia/Melbourne',
   'Go over the practice exam I sat on the weekend.',
   null::timestamptz, null::timestamptz),
  (3, 'ada@contour.test',
   ((current_date - 7)::timestamp + time '10:00') at time zone 'Australia/Melbourne',
   'Chain rule drills.',
   now() - interval '7 days', null::timestamptz),
  (4, 'ada@contour.test',
   ((current_date - 3)::timestamp + time '14:00') at time zone 'Australia/Melbourne',
   'Cancelled — clashed with a school commitment.',
   null::timestamptz, now() - interval '4 days'),

  -- Marcus: two upcoming, one completed.
  (5, 'marcus@contour.test',
   ((current_date + 1)::timestamp + time '11:00') at time zone 'Australia/Melbourne',
   'Redox half-equations and titration calculations from last week''s prac.',
   null::timestamptz, null::timestamptz),
  (6, 'marcus@contour.test',
   ((current_date + 4)::timestamp + time '15:00') at time zone 'Australia/Melbourne',
   'Organic reaction pathways — I keep losing marks on the mechanism steps.',
   null::timestamptz, null::timestamptz),
  (7, 'marcus@contour.test',
   ((current_date - 14)::timestamp + time '13:00') at time zone 'Australia/Melbourne',
   'Stoichiometry catch-up after missing a week.',
   now() - interval '14 days', null::timestamptz),

  -- Priya: one upcoming.
  (8, 'priya@contour.test',
   ((current_date + 2)::timestamp + time '17:00') at time zone 'Australia/Melbourne',
   'Essay structure feedback on the analytical commentary draft.',
   null::timestamptz, null::timestamptz)
) as seed(id, email, booking_date_time, reason, completed_at, deleted_at)
join auth.users u on u.email = seed.email
on conflict (id) do nothing;

select setval(pg_get_serial_sequence('public.consultations', 'id'),
              (select max(id) from public.consultations), true);

commit;
