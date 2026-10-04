import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

const brand = "#0f9d84";

function Layout({ preview, children }: { preview: string; children: ReactNode }) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: "#f4f7f6", fontFamily: "Arial, Helvetica, sans-serif", margin: 0 }}>
        <Container style={{ maxWidth: 520, margin: "24px auto", backgroundColor: "#ffffff", borderRadius: 12, padding: 32 }}>
          <Text style={{ fontSize: 22, fontWeight: 800, color: brand, margin: "0 0 16px" }}>PGConnect</Text>
          {children}
          <Hr style={{ borderColor: "#e5e7eb", margin: "28px 0 16px" }} />
          <Text style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
            Never pay a token amount before visiting a PG in person. PGConnect will never ask for your
            password or OTP.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function OtpEmail({ username, code, purpose }: { username: string; code: string; purpose: "verify" | "reset" }) {
  const title = purpose === "verify" ? "Verify your email" : "Reset your password";
  return (
    <Layout preview={`${code} is your PGConnect code`}>
      <Heading as="h2" style={{ fontSize: 20, color: "#111827" }}>{title}</Heading>
      <Text style={{ color: "#374151" }}>Hi {username},</Text>
      <Text style={{ color: "#374151" }}>
        Use the code below to {purpose === "verify" ? "finish creating your account" : "set a new password"}. It
        expires in 15 minutes.
      </Text>
      <Section style={{ textAlign: "center", margin: "24px 0" }}>
        <Text style={{ fontSize: 32, letterSpacing: 8, fontWeight: 700, color: "#111827", margin: 0 }}>{code}</Text>
      </Section>
      <Text style={{ color: "#6b7280", fontSize: 13 }}>If you didn&apos;t request this, you can safely ignore this email.</Text>
    </Layout>
  );
}

export function LeadEmail(props: {
  ownerName: string;
  pgName: string;
  leadType: "CALLBACK" | "VISIT";
  name: string;
  phoneNumber: string;
  message?: string | null;
  visitDate?: string | null;
  dashboardUrl: string;
}) {
  const isVisit = props.leadType === "VISIT";
  return (
    <Layout preview={`New ${isVisit ? "visit request" : "callback request"} for ${props.pgName}`}>
      <Heading as="h2" style={{ fontSize: 20, color: "#111827" }}>
        New {isVisit ? "visit request" : "callback request"} 🎉
      </Heading>
      <Text style={{ color: "#374151" }}>Hi {props.ownerName}, someone is interested in <b>{props.pgName}</b>.</Text>
      <Section style={{ backgroundColor: "#f0fdf9", borderRadius: 8, padding: 16 }}>
        <Text style={{ margin: "0 0 6px" }}><b>Name:</b> {props.name}</Text>
        <Text style={{ margin: "0 0 6px" }}><b>Phone:</b> {props.phoneNumber}</Text>
        {props.visitDate ? <Text style={{ margin: "0 0 6px" }}><b>Preferred visit date:</b> {props.visitDate}</Text> : null}
        {props.message ? <Text style={{ margin: 0 }}><b>Message:</b> {props.message}</Text> : null}
      </Section>
      <Text style={{ color: "#374151" }}>Tenants who get a call within an hour are far more likely to book.</Text>
      <Button href={props.dashboardUrl} style={{ backgroundColor: brand, color: "#fff", padding: "12px 20px", borderRadius: 8, fontWeight: 600 }}>
        Open leads dashboard
      </Button>
    </Layout>
  );
}

export function VerificationDecisionEmail({ name, approved, note, url }: { name: string; approved: boolean; note?: string | null; url: string }) {
  return (
    <Layout preview={approved ? "You are now a verified owner" : "Update on your owner verification"}>
      <Heading as="h2" style={{ fontSize: 20, color: "#111827" }}>
        {approved ? "You're verified ✅" : "We couldn't verify your documents"}
      </Heading>
      <Text style={{ color: "#374151" }}>Hi {name},</Text>
      <Text style={{ color: "#374151" }}>
        {approved
          ? "Your listings now show the Verified Owner badge, which helps tenants trust and contact you faster."
          : "Please re-submit a clear photo of a valid government ID from your dashboard."}
      </Text>
      {note ? <Text style={{ color: "#374151" }}><b>Note from our team:</b> {note}</Text> : null}
      <Button href={url} style={{ backgroundColor: brand, color: "#fff", padding: "12px 20px", borderRadius: 8, fontWeight: 600 }}>
        Go to dashboard
      </Button>
    </Layout>
  );
}
