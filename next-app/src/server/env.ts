import "server-only";

/**
 * Central place for server configuration. Optional integrations degrade
 * gracefully (feature flags) so the app runs locally without every key.
 */
function read(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() !== "" ? value.trim() : undefined;
}

const isProd = process.env.NODE_ENV === "production";

function required(name: string, devFallback: string): string {
  const value = read(name);
  if (value) return value;
  if (isProd && process.env.NEXT_PHASE !== "phase-production-build") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return devFallback;
}

export const env = {
  isProd,
  siteUrl: read("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000",
  get jwtSecret() {
    return required("JWT_SECRET", "dev-insecure-jwt-secret-change-me");
  },
  aws: {
    region: read("AWS_REGION"),
    accessKeyId: read("AWS_ACCESS_KEY_ID"),
    secretAccessKey: read("AWS_SECRET_ACCESS_KEY"),
    bucket: read("AWS_BUCKET_NAME"),
    publicBaseUrl: read("AWS_PUBLIC_BASE_URL"),
  },
  storage: {
    /** "local" (default) stores files on disk; "s3" uses the AWS_* bucket. */
    driver: (read("STORAGE_DRIVER")?.toLowerCase() === "s3" ? "s3" : "local") as "local" | "s3",
    /** Root folder for the local driver. Mount a persistent volume here in production. */
    localDir: read("STORAGE_LOCAL_DIR") ?? "storage",
  },
  resendApiKey: read("RESEND_API_KEY"),
  emailFrom: read("EMAIL_FROM") ?? "PGConnect <no-reply@pgconnect.site>",
  googleClientId: read("GOOGLE_CLIENT_ID") ?? read("NEXT_PUBLIC_GOOGLE_CLIENT_ID"),
  razorpay: {
    keyId: read("RAZORPAY_KEY_ID"),
    keySecret: read("RAZORPAY_KEY_SECRET"),
    webhookSecret: read("RAZORPAY_WEBHOOK_SECRET"),
    basicPlanId: read("RAZORPAY_BASIC_PLAN_ID"),
    premiumPlanId: read("RAZORPAY_PREMIUM_PLAN_ID"),
  },
  socket: {
    internalUrl: read("SOCKET_INTERNAL_URL") ?? read("NEXT_PUBLIC_SOCKET_URL"),
    internalSecret: read("SOCKET_INTERNAL_SECRET"),
  },
  adminEmails: (read("ADMIN_EMAILS") ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
};

export const features = {
  /** True when S3 credentials are present (needed to read/delete existing S3 files). */
  get s3() {
    return Boolean(
      env.aws.region && env.aws.accessKeyId && env.aws.secretAccessKey && env.aws.bucket
    );
  },
  get email() {
    return Boolean(env.resendApiKey);
  },
  get payments() {
    return Boolean(env.razorpay.keyId && env.razorpay.keySecret);
  },
  get googleAuth() {
    return Boolean(env.googleClientId);
  },
};
