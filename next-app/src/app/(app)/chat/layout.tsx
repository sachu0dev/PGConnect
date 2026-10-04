import type { Metadata } from "next";
import { ChatShell } from "@/components/chat/chat-shell";

export const metadata: Metadata = {
  title: "Messages",
  robots: { index: false, follow: false },
};

/** Fills the viewport under the 4rem sticky header; the site footer sits below the fold. */
export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[calc(100dvh-4rem)] md:container md:py-4">
      <ChatShell>{children}</ChatShell>
    </div>
  );
}
