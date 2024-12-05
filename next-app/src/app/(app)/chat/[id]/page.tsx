"use client";

import useSocket from "@/hooks/useSocket";
import api from "@/lib/axios";
import { useAppSelector } from "@/lib/hooks";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface Message {
  id: string;
  text: string;
  sender: {
    id: string;
    username: string;
  };
  createdAt: string;
}

interface ChatData {
  id: string;
  messages: Message[];
  pg: {
    id: string;
    name: string;
    address: string;
    rentPerMonth: number;
    owner: {
      id: string;
      username: string;
    };
  };
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalMessages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const Page = ({ params }: { params: Promise<{ id: string }> }) => {
  const resolvedParams = React.use(params);
  const chatId = resolvedParams.id;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalMessages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const { accessToken, userData: user } = useAppSelector((state) => state.user);
  const socket = useSocket(process.env.NEXT_PUBLIC_SOCKETURL!, accessToken);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [initialFetchRef, setIntialFetchRef] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (isLoading || pagination.hasPreviousPage) return;
    try {
      setIsLoading(true);

      const response = await api.get<{
        data: ChatData;
        pagination: PaginationInfo;
      }>(`/api/pg/get-chat-data/${chatId}`, {
        params: { page },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const { data, pagination: newPagination } = response.data;

      setMessages((prevMessages) => {
        const combinedMessages = [...data.messages, ...prevMessages];
        const uniqueMessages = Array.from(
          new Map(combinedMessages.map((m) => [m.id, m])).values()
        );

        return uniqueMessages.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });

      setPagination(newPagination);
      setPage(newPagination.currentPage - 1);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to fetch messages");
    } finally {
      setIsLoading(false);
    }
  }, [chatId, accessToken, page, isLoading, pagination.hasPreviousPage]);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (container.scrollTop === 0 && pagination.hasPreviousPage && !isLoading) {
      fetchMessages();
    }
  }, [fetchMessages, pagination.hasPreviousPage, isLoading]);

  useEffect(() => {
    console.log("it reached");

    if (!initialFetchRef) {
      setIntialFetchRef(true);
      console.log("reached inside");

      setMessages([]);
      setPage(1);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalMessages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      fetchMessages();
    }
  }, [chatId, fetchMessages, initialFetchRef]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      console.log("Connected to server");
      socket.emit("JOIN_CHAT", { chatId });
    };

    const handleMessage = (data: { message: Message }) => {
      setMessages((prevMessages) => {
        const isDuplicate = prevMessages.some(
          (msg) => msg.id === data.message.id
        );

        if (isDuplicate) return prevMessages;

        return [...prevMessages, data.message].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
    };

    const handleConnectError = (err: Error) => {
      console.error("Connection error:", err.message);
      toast.error(`Connection error: ${err.message}`);
    };

    socket.on("connect", handleConnect);
    socket.on("message", handleMessage);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("message", handleMessage);
      socket.off("connect_error", handleConnectError);
    };
  }, [socket, chatId]);

  const sendMessage = useCallback(() => {
    if (!socket) {
      toast.error("Socket not connected");
      return;
    }

    if (!newMessage.trim()) {
      toast.error("Message cannot be empty");
      return;
    }

    socket.emit("NEW_MESSAGE", {
      chatId,
      message: newMessage,
      sender: {
        id: user?.id,
        username: user?.username,
      },
    });
    setNewMessage("");
  }, [socket, newMessage, chatId, user]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Chat Room: {chatId}</h1>
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="mb-4 h-96 overflow-y-auto border rounded p-2"
      >
        {isLoading && pagination.currentPage > 1 && (
          <div className="text-center text-gray-500">Loading more...</div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-2 p-2 rounded ${
              msg.sender.id === user?.id
                ? "bg-blue-100 text-right"
                : "bg-gray-100"
            }`}
          >
            <strong
              className={`text-blue-600 ${
                msg.sender.id === user?.id ? "text-right" : ""
              }`}
            >
              {msg.sender.username}:
            </strong>{" "}
            {msg.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-grow p-2 border rounded-l"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white p-2 rounded-r"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Page;
