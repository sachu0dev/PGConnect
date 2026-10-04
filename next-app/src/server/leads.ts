import "server-only";
import { createElement } from "react";
import { after } from "next/server";
import type { z } from "zod";
import prisma from "@/lib/prisma";
import type { leadSchema } from "@/lib/validation";
import { env } from "./env";
import { badRequest, notFound } from "./http";
import { enforceRateLimit } from "./rate-limit";
import { sendEmail } from "./email/send";
import { LeadEmail } from "./email/templates";
import type { AuthUser } from "./auth/guard";

export type LeadInput = z.output<typeof leadSchema>;

const HOUR = 60 * 60 * 1000;

/**
 * Creates (or refreshes) a callback / visit request from a tenant and emails
 * the owner. One lead per user per PG per type: repeat requests update the
 * existing lead and move it back to NEW so the owner sees it again.
 */
export async function submitLead(user: AuthUser, pgId: string, input: LeadInput) {
  enforceRateLimit(`lead:${user.id}`, 10, HOUR);

  const pg = await prisma.pg.findUnique({
    where: { id: pgId },
    select: {
      id: true,
      name: true,
      status: true,
      ownerId: true,
      owner: { select: { email: true, username: true, isBanned: true } },
    },
  });
  if (!pg || pg.status === "BLOCKED" || pg.owner.isBanned) throw notFound("PG not found");
  if (pg.ownerId === user.id) throw badRequest("You cannot send an enquiry to your own PG");
  if (pg.status !== "ACTIVE") throw badRequest("This PG is not accepting enquiries right now");

  const data = {
    name: input.name,
    phoneNumber: input.phoneNumber,
    message: input.message,
    visitDate: input.type === "VISIT" ? input.visitDate : null,
  };

  const lead = await prisma.lead.upsert({
    where: { pgId_userId_type: { pgId: pg.id, userId: user.id, type: input.type } },
    create: { ...data, type: input.type, pgId: pg.id, userId: user.id },
    update: { ...data, status: "NEW" },
    select: { id: true, type: true, status: true },
  });

  const owner = pg.owner;
  const visitDate = data.visitDate
    ? data.visitDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })
    : null;
  after(() =>
    sendEmail(
      owner.email,
      input.type === "VISIT" ? `Visit request for ${pg.name}` : `Callback request for ${pg.name}`,
      createElement(LeadEmail, {
        ownerName: owner.username,
        pgName: pg.name,
        leadType: input.type,
        name: data.name,
        phoneNumber: data.phoneNumber,
        message: data.message,
        visitDate,
        dashboardUrl: `${env.siteUrl}/dashboard/leads`,
      }),
      `lead=${lead.id}`
    )
  );

  return { lead };
}
