/** Shapes shared between API routes and client components. */
export type PublicUser = {
  id: string;
  username: string;
  email: string;
  phoneNumber: string | null;
  isOwner: boolean;
  isAdmin: boolean;
  isVerified: boolean;
  membership: "FREE" | "BASIC" | "PREMIUM";
  hasPassword: boolean;
  hasGoogle: boolean;
  ownerVerification: "PENDING" | "APPROVED" | "REJECTED" | null;
  createdAt: string;
};

export type AuthResponse = { accessToken: string; user: PublicUser };

export type Paginated<T> = {
  items: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export type { PgCard, PgDetail } from "@/server/listings-types";
