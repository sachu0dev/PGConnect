/**
 * Legacy endpoint kept for backwards compatibility:
 *  GET → same as GET /api/profile, PUT → same as PATCH /api/account.
 */
export { GET } from "@/app/api/profile/route";
export { PATCH as PUT } from "@/app/api/account/route";
