import { resend } from "@/lib/auth/resend";
import CallbackEmail from "../../email/CallBackRequest";

interface EmailProps {
  PhoneNumber?: string;
  detailsLink?: string;
  pgName?: string;
  username?: string;
  email: string;
}
export async function sendCallbackRequest({
  PhoneNumber,
  detailsLink,
  pgName,
  username,
  email,
}: EmailProps) {
  try {
    await resend.emails.send({
      from: "CallbackRequest@pgconnect.site",
      to: email,
      subject: "PGConnect - Callback Request",
      react: CallbackEmail({
        PhoneNumber,
        detailsLink,
        pgName,
        username,
      }),
    });

    return {
      success: true,
      message: "Callback request email sent successfully",
    };
  } catch (emailError) {
    console.log("Error sending Callback request email", emailError);
    return {
      success: false,
      message: "Error sending Callback request email",
    };
  }
}
