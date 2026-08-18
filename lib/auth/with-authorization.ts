import { NextResponse, type NextRequest } from "next/server";

import {
  AuthorizationError,
  checkAccess,
  type AccessContext,
  type AccessRequirement,
} from "@/lib/auth/access";

/* Route-level guard.
 *
 * Deliberately not Next's middleware (proxy.ts): that runs before routing and
 * is matched by path, so per-route rules would mean re-describing the route
 * table in a regex and keeping the two in sync. Wrapping the handler keeps the
 * rule next to the thing it protects and gives the handler a typed context. */

type Handler<Ctx> = (
  request: NextRequest,
  context: Ctx & { access: AccessContext },
) => Promise<Response> | Response;

export function withAuthorization<Ctx = unknown>(
  requirement: AccessRequirement,
  handler: Handler<Ctx>,
) {
  return async (request: NextRequest, context: Ctx): Promise<Response> => {
    const result = await checkAccess(requirement);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        {
          status: result.status,
          // Tells a client the difference between "sign in" and "you can't".
          headers:
            result.status === 401
              ? { "WWW-Authenticate": 'Bearer realm="api"' }
              : undefined,
        },
      );
    }

    try {
      return await handler(request, { ...(context ?? ({} as Ctx)), access: result.access });
    } catch (error) {
      // A service guarded with requireAccess() can throw from deeper in the
      // call stack; map it rather than leaking a 500.
      if (error instanceof AuthorizationError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status },
        );
      }
      throw error;
    }
  };
}
