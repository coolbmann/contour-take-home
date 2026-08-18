import { NextResponse, type NextRequest } from "next/server";

import {
  AuthorizationError,
  checkAccess,
  type AccessContext,
  type AccessRequirement,
} from "@/lib/auth/access";

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
