"use client";

import { useEffect, useState } from "react";
import { Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WhatsAppIcon } from "./contact-reveal";

function shareUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

/** Native share sheet on phones; WhatsApp + copy link menu elsewhere. */
export function ShareButton({
  title,
  text,
  className,
  variant = "outline",
  iconOnly,
}: {
  title: string;
  text: string;
  className?: string;
  variant?: ButtonProps["variant"];
  iconOnly?: boolean;
}) {
  const [native, setNative] = useState(false);
  useEffect(() => setNative(typeof navigator !== "undefined" && typeof navigator.share === "function"), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl());
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy the link");
    }
  };

  const label = iconOnly ? <span className="sr-only">Share</span> : "Share";

  if (native) {
    return (
      <Button
        variant={variant}
        size={iconOnly ? "icon" : "default"}
        className={className}
        onClick={async () => {
          try {
            await navigator.share({ title, text, url: shareUrl() });
          } catch (error) {
            if (error instanceof Error && error.name !== "AbortError") void copy();
          }
        }}
      >
        <Share2 /> {label}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={iconOnly ? "icon" : "default"} className={className}>
          <Share2 /> {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${text} ${typeof window !== "undefined" ? shareUrl() : ""}`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsAppIcon className="size-4 text-[#25D366]" /> Share on WhatsApp
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void copy()}>
          <Copy className="size-4" /> Copy link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
