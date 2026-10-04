import { MessagesSquare, ShieldCheck } from "lucide-react";

/** Right-hand pane on desktop when no conversation is open. */
export function SelectConversation() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-muted/20 p-8 text-center">
      <span className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MessagesSquare className="size-8" aria-hidden />
      </span>
      <h2 className="text-lg font-semibold">Select a conversation</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Pick a chat from the list to read and reply. Owners usually respond within a few hours.
      </p>
      <p className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-xs text-muted-foreground ring-1 ring-border">
        <ShieldCheck className="size-3.5 text-primary" aria-hidden />
        Zero brokerage · Chat directly with owners
      </p>
    </div>
  );
}
