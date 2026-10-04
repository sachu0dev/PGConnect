"use client";

import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { cn } from "@/lib/utils";
import { InboxList } from "./inbox-list";

/**
 * Two-pane messenger. Desktop: inbox on the left, conversation on the right.
 * Mobile: the inbox on /chat, a full-screen conversation on /chat/[id].
 */
export function ChatShell({ children }: { children: React.ReactNode }) {
  const { ready } = useRequireAuth();
  const params = useParams<{ id?: string | string[] }>();
  const activeId = typeof params.id === "string" ? params.id : null;

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-background md:rounded-xl md:border md:shadow-sm">
      <aside
        aria-label="Conversations"
        className={cn(
          "min-h-0 w-full shrink-0 flex-col md:flex md:w-[340px] md:border-r lg:w-[380px]",
          activeId ? "hidden" : "flex"
        )}
      >
        {ready ? <InboxList activeId={activeId} /> : <ShellSkeleton />}
      </aside>
      <section
        aria-label="Conversation"
        className={cn("min-h-0 min-w-0 flex-1 flex-col md:flex", activeId ? "flex" : "hidden")}
      >
        {ready ? children : null}
      </section>
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="space-y-4 p-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
