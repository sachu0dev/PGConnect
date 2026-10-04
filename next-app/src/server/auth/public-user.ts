import "server-only";
import type { PublicUser } from "@/lib/types";
import type { AuthUser } from "./guard";

export function toPublicUser(user: AuthUser): PublicUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    phoneNumber: user.phoneNumber,
    isOwner: user.isOwner,
    isAdmin: user.isAdmin,
    isVerified: user.isVerified,
    membership: user.membership,
    hasPassword: user.hasPassword,
    hasGoogle: user.hasGoogle,
    ownerVerification: user.ownerVerification,
    createdAt: user.createdAt.toISOString(),
  };
}
