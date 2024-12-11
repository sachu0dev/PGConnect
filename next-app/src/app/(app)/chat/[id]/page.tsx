"use client";

import { useChat } from "@/hooks/useChat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useRef } from "react";
import { use } from "react";
import { Crown } from "lucide-react";
import Link from "next/link";

export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const {
    messages,
    sendMessage,
    data,
    isLoading,
    pagination,
    loadMoreMessages,
  } = useChat(id);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("message") as HTMLInputElement;
    if (input.value.trim()) {
      sendMessage(input.value);
      input.value = "";
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleScroll = () => {
    const scrollArea = scrollAreaRef.current;
    if (
      scrollArea &&
      scrollArea.scrollTop === 0 &&
      !isLoading &&
      pagination.hasPreviousPage
    ) {
      loadMoreMessages();
    }
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen ">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-1">
      <div className="p-2 md:p-10  border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col gap-2 flex-1 w-full h-full text-gray-700 overflow-y-auto">
        <Card className="w-full  mx-auto my-4">
          <CardHeader className="border-b ">
            <CardTitle className="text-2xl font-bold">
              {data?.pg.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{data?.pg.address}</p>
            <p className="text-sm font-medium">
              Rent: ₹{data?.pg.rentPerMonth.toLocaleString()} per month
            </p>

            <Link className="w-full" href={`/dashboard/pgs/${data?.pg.id}`}>
              <Button className="mt-4 bg-primary1 hover:bg-primary1/80 w-full">
                Manage
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea
              className="h-[60vh] p-4"
              ref={scrollAreaRef}
              onScroll={handleScroll}
            >
              {isLoading && pagination.currentPage > 1 && (
                <div className="text-center text-muted-foreground py-2">
                  Loading more messages...
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-2 mb-4 ${
                    message.sender.id === data?.pg.owner.id
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  {message.sender.id !== data?.pg.owner.id && (
                    <Avatar className="w-8 h-8">
                      <AvatarImage
                        src={`https://avatar.vercel.sh/${message.sender.username}`}
                      />
                      <AvatarFallback>
                        {message.sender.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`rounded-lg p-3 max-w-[70%] ${
                      message.sender.id === data?.pg.owner.id
                        ? "bg-primary1 text-white"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm font-medium mb-1 flex space-x-2">
                      <span>{message.sender.username}</span>{" "}
                      {message.sender.id === data?.pg.owner.id && (
                        <Crown size={16} className="text-yellow-500" />
                      )}
                    </p>
                    <p className="text-sm">{message.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(message.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </ScrollArea>
          </CardContent>
          <CardFooter>
            <form
              onSubmit={handleSendMessage}
              className="flex w-full space-x-2"
            >
              <Input
                name="message"
                placeholder="Type your message..."
                className="flex-grow"
              />
              <Button type="submit">Send</Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
