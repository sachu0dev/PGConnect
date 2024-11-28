import { resend } from "@/lib/auth/resend";
import VerificationEmail from "../../email/VerificationEmail";

export async function sendVerificationEmail(
  email: string,
  username: string,
  verifyCode: string
) {
  try {
    await resend.emails.send({
      from: "PGConnect@sushilcode.lol",
      to: email,
      subject: "PGConnect - Verification Code",
      react: VerificationEmail({ username, otp: verifyCode }),
    });

    return {
      success: true,
      message: "Verification email sent successfully",
    };
  } catch (emailError) {
    console.log("Error sending verification email", emailError);
    return {
      success: false,
      message: "Error sending verification email",
    };
  }
}
