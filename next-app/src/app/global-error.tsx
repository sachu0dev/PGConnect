"use client";

import { useEffect } from "react";
import "./globals.css";

/** Last-resort boundary when the root layout itself fails. Keep it dependency-free. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en-IN">
      <body className="bg-background font-sans text-foreground antialiased">
        <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-16 text-center">
          <p className="text-lg font-bold">
            PG<span className="text-primary">Connect</span>
          </p>
          <h1 className="mt-8 text-2xl font-bold tracking-tight">We hit an unexpected error</h1>
          <p className="mt-2 max-w-md text-muted-foreground">
            Please try again. If the problem continues, come back in a few minutes.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Try again
            </button>
            {/* A full page load is intentional here: the app shell may be broken. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-input px-4 text-sm font-semibold hover:bg-accent"
            >
              Go to home
            </a>
          </div>
          {error.digest ? (
            <p className="mt-8 text-xs text-muted-foreground">Reference: {error.digest}</p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
