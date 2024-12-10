"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import api from "@/lib/axios";
import { useAppSelector } from "@/lib/hooks";
import { ApiResponse } from "@/types/response";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Loader from "../layout/Loader";
import { toast } from "sonner";
import { AxiosError } from "axios";

interface InputProps {
  pgId: string;
  classname: string;
  chatId: string;
}

const IntailChatDialog: React.FC<InputProps> = ({
  pgId,
  classname,
  chatId,
}) => {
  const router = useRouter();
  const { userData } = useAppSelector((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChat, setIsChat] = useState(false);

  useEffect(() => {
    if (!chatId) return;

    const checkChatExists = async () => {
      setLoading(true);
      try {
        const response = await api.get<ApiResponse>(
          `/api/pg/check-chat-exists/${chatId}`
        );
        if (response.data.success) {
          setIsChat(true);
        }
      } catch (error) {
        console.log("Error checking chat existence:", error);
      } finally {
        setLoading(false);
      }
    };

    checkChatExists();
  }, [chatId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isChat) {
      router.push(`/chat/${chatId}`);
      return;
    }

    setIsLoading(true);

    const form = e.currentTarget;
    const messageInput = form.elements.namedItem("message") as HTMLInputElement;
    const message = messageInput.value.trim();

    if (!message) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post<ApiResponse>("/api/pg/send-message", {
        message,
        pgId,
        chatId,
      });

      if (response.data.success) {
        router.push(`/chat/${chatId}`);
      }

      form.reset();
    } catch (error) {
      const errorMessage =
        (error as AxiosError<ApiResponse>).response?.data?.error ??
        "Failed to send message. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog key={chatId}>
      <DialogTrigger
        disabled={isChat}
        className={`font-semibold h-[36px] ${classname} text-sm py-1 px-2 rounded-md border bg-primary1 text-white hover:bg-primary1/90 z-10`}
        aria-label="Request a Callback"
      >
        {isChat ? (
          <Link href={`/chat/${chatId}`}>Open Chat</Link>
        ) : (
          " Start a free chat"
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          {loading ? (
            <Loader />
          ) : userData ? (
            <>
              <DialogTitle className="text-primary1">
                Send your first message
              </DialogTitle>

              <form onSubmit={handleSubmit} noValidate>
                <Input
                  id="message"
                  name="message"
                  placeholder="Message"
                  className="mt-4"
                  type="text"
                />
                <Button
                  type="submit"
                  className="mt-4 w-full bg-primary1 text-white font-semibold hover:bg-primary1/90"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </>
          ) : (
            <>
              <DialogTitle className="text-primary1">
                Login to send your first message
              </DialogTitle>
              <DialogDescription>
                <Link href="/login">
                  <Button
                    className="w-full mt-4 bg-primary1 text-white font-medium hover:bg-primary1/90"
                    aria-label="Login to request callback"
                  >
                    Login
                  </Button>
                </Link>
              </DialogDescription>
            </>
          )}
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default IntailChatDialog;
