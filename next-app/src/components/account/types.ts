/** Shape returned by GET /api/account/enquiries (shared by the API route and UI). */
export type Enquiry = {
  id: string;
  type: "CALLBACK" | "VISIT";
  status: "NEW" | "CONTACTED" | "CLOSED";
  visitDate: string | null;
  createdAt: string;
  pg: {
    id: string;
    name: string;
    city: string;
    locality: string | null;
    image: string | null;
    rentPerMonth: number;
    /** false when the listing is paused or blocked. */
    available: boolean;
    chatId: string | null;
  };
};
