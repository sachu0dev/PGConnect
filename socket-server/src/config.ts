function read(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() !== "" ? value.trim() : undefined;
}

const isProd = process.env.NODE_ENV === "production";

function required(name: string, devFallback: string): string {
  const value = read(name);
  if (value) return value;
  if (isProd) throw new Error(`Missing required environment variable: ${name}`);
  return devFallback;
}

export const config = {
  isProd,
  port: Number(read("PORT") ?? 4000),
  // Dev fallback matches next-app's so local setups work without a .env.
  jwtSecret: required("JWT_SECRET", "dev-insecure-jwt-secret-change-me"),
  internalSecret: read("SOCKET_INTERNAL_SECRET"),
  clientOrigins: (read("CLIENT_ORIGIN") ?? "http://localhost:3000")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean),
  /** Max events a single socket may send per second (burst = 2x). */
  eventsPerSecond: Number(read("SOCKET_EVENTS_PER_SECOND") ?? 10),
  /** Max chat rooms one socket may be joined to at a time. */
  maxRoomsPerSocket: 50,
  maxHttpBufferSize: 16 * 1024,
  internalBodyLimit: 64 * 1024,
} as const;
