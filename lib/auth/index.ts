export {
  AuthorizationError,
  checkAccess,
  getAccessContext,
  getCurrentUser,
  loadAccessFor,
  requireAccess,
  satisfies,
  type AccessContext,
  type AccessRequirement,
  type Permission,
} from "@/lib/auth/access";
export { withAuthorization } from "@/lib/auth/with-authorization";
export {
  requirePageAccess,
  type PageAccess,
  type PageAccessOptions,
} from "@/lib/auth/require-page-access";
