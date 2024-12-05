import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

import { GoogleOAuthProvider } from "@react-oauth/google";
import ClientProvider from "./providers/ClientProvider";
import StoreProvider from "./providers/StoreProvider";
import { ThemeProvider } from "./providers/ThemeProvider";
import { TooltipProvider } from "@radix-ui/react-tooltip";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.pgconnect.com"
  ),
  title: {
    default: "PGConnect - Find Best Paying Guest Accommodations",
    template: "%s | PGConnect",
  },
  description:
    "Discover and connect with verified Paying Guest (PG) accommodations across India. Find safe, comfortable, and affordable housing for students and working professionals.",
  keywords: [
    "paying guest",
    "pg accommodation",
    "pg rooms",
    "student housing",
    "affordable housing",
    "pg near me",
    "pg in India",
    "rental rooms",
    "hostel alternatives",
  ],

  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "PGConnect",
    title: "PGConnect - Your Trusted Paying Guest Accommodation Platform",
    description:
      "Find the perfect PG room in minutes across major Indian cities",
    images: [
      {
        url: "/og-image-pg.jpg",
        width: 1200,
        height: 630,
        alt: "PGConnect - Find Paying Guest Accommodations",
      },
    ],
  },

  // Twitter Card Metadata
  twitter: {
    card: "summary_large_image",
    title: "PGConnect - Discover PG Rooms",
    description:
      "Easy and quick PG accommodation search for students and professionals",
    images: ["/twitter-card-pg.jpg"],
  },

  // Robots and Indexing
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Verification for Search Consoles
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },

  // Alternate language versions
  alternates: {
    canonical: "/",
    languages: {
      "en-IN": "/",
    },
  },

  // Icons and Favicons
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
};

// Viewport configuration
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// Structured Data Generation
function generateStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "PGConnect",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.pgconnect.com",
    description: "Connecting paying guest seekers with verified accommodations",
    potentialAction: {
      "@type": "SearchAction",
      target: `${
        process.env.NEXT_PUBLIC_SITE_URL || "https://www.pgconnect.com"
      }/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = generateStructuredData();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-inter scroll-smooth`}
      >
        <StoreProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <ClientProvider>
              <GoogleOAuthProvider
                clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}
              >
                <TooltipProvider>{children}</TooltipProvider>
              </GoogleOAuthProvider>
            </ClientProvider>
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
