"use client";

import { useEffect, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MAX_MESSAGE_LENGTH } from "./chat-utils";

export function Composer({
  onSend,
  onTyping,
  sending,
  disabled,
  autoFocus,
}: {
  /** Resolves when the message has been handed off (optimistically). */
  onSend: (text: string) => void;
  onTyping?: () => void;
  sending: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const trimmed = text.trim();
  const remaining = MAX_MESSAGE_LENGTH - text.length;
  const canSend = trimmed.length > 0 && !sending && !disabled && remaining >= 0;

  // Auto-grow up to ~6 lines.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  useEffect(() => {
    // Don't pop the keyboard on touch devices.
    if (autoFocus && window.matchMedia("(pointer: fine)").matches) ref.current?.focus();
  }, [autoFocus]);

  const submit = () => {
    if (!canSend) return;
    onSend(trimmed);
    setText("");
    ref.current?.focus();
  };

  return (
    <form
      className="border-t bg-background p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="flex items-end gap-2">
        <label htmlFor="chat-composer" className="sr-only">
          Type a message
        </label>
        <textarea
          id="chat-composer"
          ref={ref}
          rows={1}
          value={text}
          maxLength={MAX_MESSAGE_LENGTH}
          disabled={disabled}
          aria-busy={sending || undefined}
          onChange={(e) => {
            setText(e.target.value);
            if (e.target.value) onTyping?.();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={disabled ? "Messaging is unavailable" : "Type a message"}
          className="max-h-40 min-h-11 flex-1 resize-none rounded-2xl border border-input bg-muted/40 px-4 py-2.5 text-base leading-6 shadow-sm placeholder:text-muted-foreground focus-visible:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
        />
        <Button
          type="submit"
          size="icon"
          className="size-11 shrink-0 rounded-full"
          disabled={!canSend}
          loading={sending}
          aria-label="Send message"
        >
          {!sending ? <SendHorizontal /> : null}
        </Button>
      </div>
      <div className="flex justify-between px-2 pt-1 text-[11px] text-muted-foreground">
        <span className="hidden sm:inline">Enter to send · Shift + Enter for a new line</span>
        <span className={cn("ml-auto", remaining > 200 && "invisible", remaining < 50 && "text-destructive")} aria-live="polite">
          {remaining} characters left
        </span>
      </div>
    </form>
  );
}
