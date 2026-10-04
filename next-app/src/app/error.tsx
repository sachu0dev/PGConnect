"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { SUPPORT_EMAIL } from "@/lib/constants";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center px-4 py-16 text-center">
      <Logo className="mb-10" />
      <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <TriangleAlert className="size-7" aria-hidden />
      </span>
      <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">Something went wrong</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        We couldn&rsquo;t load this page. It&rsquo;s probably temporary — please try again in a moment.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={reset}>
          <RefreshCw /> Try again
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Go to home</Link>
        </Button>
      </div>
      <p className="mt-8 text-xs text-muted-foreground">
        Still stuck? Email{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">
          {SUPPORT_EMAIL}
        </a>
        {error.digest ? <> and mention reference {error.digest}</> : null}.
      </p>
    </main>
  );
}
