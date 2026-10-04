/** Shapes shared between the listing API routes and the listing UI. */

export type LeadKind = "CALLBACK" | "VISIT";
export type LeadState = "NEW" | "CONTACTED" | "CLOSED";

export type ViewerState = {
  saved: boolean;
  myReview: { rating: number; comment: string | null } | null;
  leads: {
    CALLBACK?: { status: LeadState; createdAt: string };
    VISIT?: { status: LeadState; visitDate: string | null };
  };
  chatId: string | null;
  canReview: boolean;
  isOwner: boolean;
};

export const GUEST_VIEWER: ViewerState = {
  saved: false,
  myReview: null,
  leads: {},
  chatId: null,
  canReview: false,
  isOwner: false,
};

export type ReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { username: string };
};

export type ReviewSummary = {
  avgRating: number;
  reviewCount: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

export type ReviewPage = {
  items: ReviewItem[];
  summary: ReviewSummary;
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export type ContactInfo = { phone: string; whatsappUrl: string };
