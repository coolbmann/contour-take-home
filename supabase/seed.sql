begin;

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

insert into public.user_profiles (id, first_name, last_name)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'first_name', ''),
  coalesce(u.raw_user_meta_data ->> 'last_name', '')
from auth.users u
where u.email like '%@contour.test'
on conflict (id) do nothing;

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
  (5, 'consultation', 'readAll')
on conflict (id) do nothing;

select setval(pg_get_serial_sequence('public.roles', 'id'),
              (select max(id) from public.roles), true);
select setval(pg_get_serial_sequence('public.permissions', 'id'),
              (select max(id) from public.permissions), true);

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

insert into public.consultations (
  id, user_id, booking_date_time, duration_mins, reason, completed_at, deleted_at
) overriding system value
select
  seed.id, u.id, seed.booking_date_time, 60, seed.reason,
  seed.completed_at, seed.deleted_at
from (values
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
