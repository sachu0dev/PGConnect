"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SUPPORT_EMAIL } from "@/lib/constants";

const TOPICS = [
  "Help finding a PG",
  "Listing / owner dashboard",
  "Plans, billing or refunds",
  "Report a fake listing or scam",
  "Privacy or data request",
  "Something else",
] as const;

/**
 * No backend involved: composes a pre-filled email in the visitor's mail app,
 * so nothing is stored and there is no spam surface.
 */
export function ContactForm() {
  const [name, setName] = useState("");
  const [topic, setTopic] = useState<string>(TOPICS[0]);
  const [message, setMessage] = useState("");
  const [opened, setOpened] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const subject = `[${topic}] ${name.trim() ? `Message from ${name.trim()}` : "Message from the website"}`;
    const body = `${message.trim()}\n\n— ${name.trim() || "PGConnect user"}`;
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setOpened(true);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" aria-describedby="contact-form-note">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="contact-name">Your name</Label>
          <Input
            id="contact-name"
            autoComplete="name"
            required
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Priya Sharma"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="contact-topic">Topic</Label>
          <select
            id="contact-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
          >
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="contact-message">How can we help?</Label>
        <Textarea
          id="contact-message"
          required
          minLength={10}
          maxLength={2000}
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Share the PG name or link, your registered email and what went wrong. Please don't include passwords, OTPs or full ID numbers."
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p id="contact-form-note" className="text-xs text-muted-foreground">
          This opens your email app with the message ready to send to {SUPPORT_EMAIL}.
        </p>
        <Button type="submit" className="sm:w-auto">
          <Send /> Compose email
        </Button>
      </div>
      {opened ? (
        <p role="status" className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          Your email app should have opened. If it didn&apos;t, write to us directly at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium underline underline-offset-4">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      ) : null}
    </form>
  );
}
