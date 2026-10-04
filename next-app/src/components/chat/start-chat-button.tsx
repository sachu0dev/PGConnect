"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { api, errorMessage } from "@/lib/api-client";

/** Opens (or creates) the conversation between the current user and a PG owner. */
export function StartChatButton({
  pgId,
  ownerId,
  label = "Chat with owner",
  ...props
}: { pgId: string; ownerId: string; label?: string } & Omit<ButtonProps, "onClick">) {
  const { user, status } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (user?.id === ownerId) return null;

  const start = async () => {
    if (status !== "authenticated") {
      router.push(`/login?next=${encodeURIComponent(`/pg/${pgId}`)}`);
      return;
    }
    setLoading(true);
    try {
      const { chatId } = await api<{ chatId: string }>(`/api/pg/${pgId}/chat`, { method: "POST", body: {} });
      router.push(`/chat/${chatId}`);
    } catch (error) {
      toast.error(errorMessage(error));
      setLoading(false);
    }
  };

  return (
    <Button onClick={start} loading={loading} {...props}>
      {!loading ? <MessageSquareText /> : null}
      {label}
    </Button>
  );
}
