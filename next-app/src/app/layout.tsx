import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/providers/auth-provider";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pgconnect.site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PGConnect — Find verified PGs & co-living near you",
    template: "%s | PGConnect",
  },
  description:
    "Search verified paying guest (PG) rooms, hostels and co-living spaces across India. Compare rent, food, amenities and reviews, then chat with owners directly — zero brokerage.",
  applicationName: "PGConnect",
  keywords: [
    "pg near me",
    "paying guest",
    "pg for boys",
    "pg for girls",
    "co-living",
    "hostel",
    "pg with food",
    "rooms for rent",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "PGConnect",
    url: "/",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1416" },
  ],
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "PGConnect",
  url: siteUrl,
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/pgs?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
  const tree = (
    <AuthProvider>
      <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
    </AuthProvider>
  );

  return (
    <html lang="en-IN" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {googleClientId ? <GoogleOAuthProvider clientId={googleClientId}>{tree}</GoogleOAuthProvider> : tree}
          <Toaster richColors closeButton position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
