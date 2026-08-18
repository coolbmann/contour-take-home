import { cache } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export type Permission = `${string}.${string}`;

export type AccessRequirement = {
  roles?: string[];

  permissions?: Permission[];

  match?: "any" | "all";
};

export type AccessContext = {
  userId: string;
  roles: string[];
  permissions: Permission[];
  has: (permission: Permission) => boolean;
  hasRole: (role: string) => boolean;
};

export class AuthorizationError extends Error {
  readonly status: 401 | 403;
  readonly requirement?: AccessRequirement;

  constructor(
    message: string,
    status: 401 | 403,
    requirement?: AccessRequirement,
  ) {
    super(message);
    this.name = "AuthorizationError";
    this.status = status;
    this.requirement = requirement;
  }
}

type UserRoleRow = {
  deleted_at: string | null;
  roles: {
    name: string;
    deleted_at: string | null;
    role_permissions: {
      deleted_at: string | null;
      permissions: {
        scope: string;
        grant: string;
        deleted_at: string | null;
      } | null;
    }[];
  } | null;
};

const live = <T extends { deleted_at: string | null }>(row: T) =>
  row.deleted_at === null;

export async function loadAccessFor(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ roles: string[]; permissions: Permission[] }> {
  const { data, error } = await supabase
    .from("user_roles")
    .select(
      `deleted_at,
       roles!inner (
         name,
         deleted_at,
         role_permissions ( deleted_at, permissions ( scope, grant, deleted_at ) )
       )`,
    )
    .eq("user_id", userId);

  if (error) throw error;

  const rows = (data ?? []) as unknown as UserRoleRow[];
  const roles = new Set<string>();
  const permissions = new Set<Permission>();

  for (const row of rows) {
    if (!live(row) || !row.roles || !live(row.roles)) continue;
    roles.add(row.roles.name);
    for (const rp of row.roles.role_permissions ?? []) {
      if (!live(rp) || !rp.permissions || !live(rp.permissions)) continue;
      permissions.add(`${rp.permissions.scope}.${rp.permissions.grant}`);
    }
  }

  return { roles: [...roles], permissions: [...permissions] };
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getAccessContext = cache(
  async (): Promise<AccessContext | null> => {
    const user = await getCurrentUser();
    if (!user) return null;

    const supabase = await createClient();
    const { roles, permissions } = await loadAccessFor(supabase, user.id);

    return {
      userId: user.id,
      roles,
      permissions,
      has: (permission) => permissions.includes(permission),
      hasRole: (role) => roles.includes(role),
    };
  },
);

export function satisfies(
  access: AccessContext,
  requirement: AccessRequirement,
): boolean {
  const { roles, permissions, match = "any" } = requirement;

  if (roles?.length && !roles.some((r) => access.hasRole(r))) return false;

  if (permissions?.length) {
    const ok =
      match === "all"
        ? permissions.every((p) => access.has(p))
        : permissions.some((p) => access.has(p));
    if (!ok) return false;
  }

  return true;
}

export async function checkAccess(
  requirement: AccessRequirement = {},
): Promise<
  | { ok: true; access: AccessContext }
  | { ok: false; status: 401 | 403; error: string }
> {
  const access = await getAccessContext();
  if (!access) return { ok: false, status: 401, error: "Not signed in." };
  if (!satisfies(access, requirement)) {
    return { ok: false, status: 403, error: describe(requirement) };
  }
  return { ok: true, access };
}

export async function requireAccess(
  requirement: AccessRequirement = {},
): Promise<AccessContext> {
  const result = await checkAccess(requirement);
  if (!result.ok) {
    throw new AuthorizationError(result.error, result.status, requirement);
  }
  return result.access;
}

function describe(requirement: AccessRequirement): string {
  const { roles, permissions, match = "any" } = requirement;
  const parts: string[] = [];
  if (roles?.length) parts.push(`role ${roles.join(" or ")}`);
  if (permissions?.length) {
    parts.push(
      `permission ${permissions.join(match === "all" ? " and " : " or ")}`,
    );
  }
  return parts.length
    ? `Requires ${parts.join(", and ")}.`
    : "Not permitted.";
}
