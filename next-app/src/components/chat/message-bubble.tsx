import { AlertCircle, Check, CheckCheck, Clock, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { messageTime, type UiMessage } from "./chat-utils";

export function MessageBubble({
  message,
  mine,
  grouped,
  onRetry,
}: {
  message: UiMessage;
  mine: boolean;
  /** Same sender as the previous bubble: tighter spacing. */
  grouped: boolean;
  onRetry?: (message: UiMessage) => void;
}) {
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start", grouped ? "mt-0.5" : "mt-3")}>
      <div className={cn("flex max-w-[85%] flex-col sm:max-w-[70%]", mine ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 text-[15px] leading-snug shadow-sm sm:text-sm",
            mine
              ? "rounded-br-md bg-primary text-primary-foreground"
              : "rounded-bl-md border bg-muted text-foreground",
            message.failed && "bg-destructive/10 text-foreground ring-1 ring-destructive/40",
            message.pending && "opacity-80"
          )}
        >
          <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{message.text}</p>
          <span
            className={cn(
              "mt-1 flex items-center justify-end gap-1 text-[11px] leading-none",
              mine && !message.failed ? "text-primary-foreground/75" : "text-muted-foreground"
            )}
          >
            <time dateTime={message.createdAt}>{messageTime(message.createdAt)}</time>
            {mine ? <MessageStatus message={message} /> : null}
          </span>
        </div>
        {message.failed ? (
          <button
            type="button"
            onClick={() => onRetry?.(message)}
            className="mt-1 inline-flex items-center gap-1 rounded-md px-1 text-xs font-medium text-destructive hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <AlertCircle className="size-3.5" aria-hidden />
            Not sent · Tap to retry
            <RotateCw className="size-3" aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function MessageStatus({ message }: { message: UiMessage }) {
  if (message.failed) return null;
  if (message.pending) return <Clock className="size-3" aria-label="Sending" />;
  if (message.status === "READ") return <CheckCheck className="size-3.5 text-sky-200" aria-label="Read" />;
  return <Check className="size-3.5" aria-label="Sent" />;
}
