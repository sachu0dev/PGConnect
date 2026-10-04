import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { ok, route } from "@/server/http";
import { requireUser } from "@/server/auth/guard";
import type { Enquiry } from "@/components/account/types";

/** GET /api/account/enquiries — callback / visit requests the user has sent → Enquiry[]. */
export const GET = route(async (req: NextRequest) => {
  const user = await requireUser(req);
  const leads = await prisma.lead.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      type: true,
      status: true,
      visitDate: true,
      createdAt: true,
      pg: {
        select: {
          id: true,
          name: true,
          city: true,
          locality: true,
          images: true,
          rentPerMonth: true,
          status: true,
          ChatRoom: { where: { userId: user.id }, select: { id: true }, take: 1 },
        },
      },
    },
  });

  const data: Enquiry[] = leads.map((lead) => {
    const available = lead.pg.status === "ACTIVE";
    return {
      id: lead.id,
      type: lead.type,
      status: lead.status,
      visitDate: lead.visitDate?.toISOString() ?? null,
      createdAt: lead.createdAt.toISOString(),
      pg: {
        id: lead.pg.id,
        name: lead.pg.name,
        city: lead.pg.city,
        locality: lead.pg.locality,
        image: available ? (lead.pg.images[0] ?? null) : null,
        rentPerMonth: lead.pg.rentPerMonth,
        available,
        chatId: lead.pg.ChatRoom[0]?.id ?? null,
      },
    };
  });
  return ok(data, { headers: { "cache-control": "no-store" } });
});
