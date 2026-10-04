import "server-only";
import type { ReactElement } from "react";
import { Resend } from "resend";
import { env, features } from "../env";

let resend: Resend | null = null;

/**
 * Sends a transactional email. Without RESEND_API_KEY (local dev) the email is
 * logged instead so flows like OTP verification remain testable.
 */
export async function sendEmail(to: string, subject: string, react: ReactElement, devSummary?: string) {
  if (!features.email) {
    if (env.isProd) {
      // Never log message contents (OTP codes) in production.
      console.error("[email] RESEND_API_KEY is not configured; email not sent");
      return { success: false as const };
    }
    console.info(`[email:dev] to=${to} subject="${subject}" ${devSummary ?? ""}`);
    return { success: true as const };
  }
  try {
    resend ??= new Resend(env.resendApiKey);
    const { error } = await resend.emails.send({ from: env.emailFrom, to, subject, react });
    if (error) throw new Error(error.message);
    return { success: true as const };
  } catch (error) {
    console.error("[email] send failed", error);
    return { success: false as const };
  }
}
