import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Prose } from "./prose";

export type LegalSection = { id: string; title: string; body: ReactNode };

export const LEGAL_LAST_UPDATED = "October 2026";

/**
 * Shared layout for policy pages: breadcrumb, title, last-updated date, a
 * sticky table of contents on desktop (collapsible on mobile) and the body.
 */
export function LegalPage({
  title,
  intro,
  sections,
  updated = LEGAL_LAST_UPDATED,
}: {
  title: string;
  intro?: ReactNode;
  sections: LegalSection[];
  updated?: string;
}) {
  const showToc = sections.length >= 4;
  const toc = (
    <ol className="space-y-1.5 text-sm">
      {sections.map((section, index) => (
        <li key={section.id}>
          <a
            href={`#${section.id}`}
            className="flex gap-2 rounded-md py-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="w-5 shrink-0 tabular-nums">{index + 1}.</span>
            <span>{section.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <article className="container max-w-6xl py-8 sm:py-12">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span aria-current="page" className="text-foreground">
          {title}
        </span>
      </nav>
      <header className="max-w-3xl border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}</p>
        {intro ? <div className="mt-4 text-base leading-7 text-muted-foreground">{intro}</div> : null}
      </header>

      <div className={showToc ? "mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-12" : "mt-8"}>
        {showToc ? (
          <details className="mb-8 rounded-xl border bg-muted/30 p-4 lg:hidden">
            <summary className="cursor-pointer text-sm font-semibold">On this page</summary>
            <div className="mt-3">{toc}</div>
          </details>
        ) : null}

        <Prose className="max-w-3xl [&>section:first-child>h2]:mt-0">
          {sections.map((section, index) => (
            <section key={section.id} aria-labelledby={section.id}>
              <h2 id={section.id}>
                {index + 1}. {section.title}
              </h2>
              {section.body}
            </section>
          ))}
        </Prose>

        {showToc ? (
          <aside className="hidden lg:block" aria-label="Table of contents">
            <div className="sticky top-24 rounded-xl border bg-card p-5">
              <p className="mb-3 text-sm font-semibold">On this page</p>
              {toc}
            </div>
          </aside>
        ) : null}
      </div>
    </article>
  );
}
