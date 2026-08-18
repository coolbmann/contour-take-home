# Contour — Consultations

Built on Next.js 16 (App Router) with Supabase for auth and
Postgres. Styling is Tailwind.

```bash
npm install
npm run dev
```

To run the whole stack locally see [Local development](#local-development).

---

## Local development

Runs Postgres, GoTrue and PostgREST in Docker, applies every migration, and
loads `supabase/seed.sql`. No remote project needed.

**Requires** Docker Desktop running, and Node 20+. The Supabase CLI is invoked
through `npx` — there is nothing to install globally.

```bash
npx supabase start      # first run pulls several GB of images
npx supabase db reset   # re-applies migrations + seed at any time
npm run dev
```

`supabase start` prints the local credentials. Put them in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<PUBLISHABLE_KEY from the start output>
```

`npx supabase stop` shuts it down; add `--no-backup` to discard the volume.

### Seeded accounts

All four use the password `password123`. Email confirmation is off
(`enable_confirmations = false`).

| Email                 | Role    | Fixtures                             |
| --------------------- | ------- | ------------------------------------ |
| `admin@contour.test`  | Admin   | —                                    |
| `ada@contour.test`    | Student | 2 upcoming, 1 completed, 1 cancelled |
| `marcus@contour.test` | Student | 2 upcoming, 1 completed              |
| `priya@contour.test`  | Student | 1 upcoming                           |

Eight consultations in total, seven live. The cancelled one is seeded
deliberately: it should **not** appear anywhere in the UI, which is what makes
it a test of the `deleted_at` filtering rather than decoration.

---

## Data model

The data model follows the following schema:

<img width="1514" height="1524" alt="Screenshot 2026-08-18 at 11 39 45 PM" src="https://github.com/user-attachments/assets/282bb442-e65f-4cab-8cfd-32b7e2022e80" />


RBAC is implemented through a series of permission and role tables, which are attached to users defining the scope they have to certain APIs exposed by the system. The key tables are as follows:

`permissions`:

- This table defines scope, as well as grants applied to the scope. This allows system administrators to define different access policies partitioned by module, domain, etc, as well as defining granular read, update, delete, etc policies for each scope.

`roles`:

- This table defines high-level roles that can be assigned to a user. For our use case, this is where Student and Admin roles are defined.

`role_permissions`:

- A composite table which defines what permissions each role has access to.

`user_roles`:

- Stores a normalised view of the roles a user has been assigned to. Allows users to be granted multiple roles, allowing system admins to create and assign ‘access groups’ to users via roles.

| Role             | Grants                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------- |
| `Student` (id 1) | `consultation.create`, `consultation.read`, `consultation.update`, `consultation.delete` |
| `Admin` (id 2)   | `consultation.readAll`                                                                   |

## Implementation of RBAC in Application

We implement the permissions defined in the data model via 3 guards:

- `withAuthorization`
- `requirePageAccess`
- `requireAccess`

These guards are called at the top of or wraps each API route, server component, and repository service respectively, to ensure that the user calling each of these resources has the permissions to access them.

These methods take in an array of optional `roles` and `permissions` args, against which the user’s credentials are checked. This approach makes it easy to implement different access requirements on different parts of the application.

```ts
type AccessRequirement = {
  roles?: string[]; // satisfied by ANY listed role
  permissions?: Permission[]; // satisfied per `match`
  match?: "any" | "all"; // default "any"
};
```

Given the simple nature of the app, these have been applied inline, however, global application via middleware is a likely implementation for larger production apps, at least for blanket rules to ensure these checks do not slip through the cracks.

In the application, I have deliberately left the “Manage” consultation button visible for admins to show the permission denied behaviour.

## Assumptions on user flows

- Login pages are shared between admins and students. Since admin users should be provisioned ad hoc, the create account flow only supports creating student accounts
- No email verification occurs as part of the sign-up / login process. In production, we would need to implement this confirmation behaviour, and/or magic link UX.
- Once marked as completed, consultations can no longer be added.
- Booking timeslots are always available (clashes are out of scope)

---

## API reference

All under `/api`. Every route is guarded by `withAuthorization`; the service it
calls re-checks the same grant.

| Method   | Path                          | Grant                 | Success                  |
| -------- | ----------------------------- | --------------------- | ------------------------ |
| `POST`   | `/auth/create-account`        | — (public)            | 201 + user               |
| `POST`   | `/auth/login`                 | — (public)            | 200 + `{ redirectTo }`   |
| `GET`    | `/consultation`               | `consultation.read`   | 200 + your live bookings |
| `POST`   | `/consultation`               | `consultation.create` | 201 + the created row    |
| `PATCH`  | `/consultation/[id]`          | `consultation.update` | 200 + the updated row    |
| `DELETE` | `/consultation/[id]`          | `consultation.delete` | 204 (soft delete)        |
| `POST`   | `/consultation/[id]/complete` | `consultation.update` | 200 + the updated row    |

---
