import { useState, useEffect, useCallback } from "react";
import { useAppSelector } from "@/lib/hooks";
import api from "@/lib/axios";
import useSocket from "@/hooks/useSocket";
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
  user: {
    id: string;
    username: string;
  };
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalMessages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function useChat(chatId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [data, setData] = useState<ChatData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalMessages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const { accessToken, userData: user } = useAppSelector((state) => state.user);
  const socket = useSocket(process.env.NEXT_PUBLIC_SOCKETURL!, accessToken);

  const fetchMessages = useCallback(
    async (page: number = 1) => {
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

        setData(data);
        setPagination(newPagination);

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
      } catch (error) {
        console.log("Error fetching messages:", error);
        toast.error("Failed to fetch messages");
      } finally {
        setIsLoading(false);
      }
    },
    [chatId, accessToken]
  );

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      console.log("Connected to server");
      socket.emit("JOIN_CHAT", { chatId });
    };

    const handleMessage = (data: { message: Message }) => {
      setMessages((prevMessages) => [...prevMessages, data.message]);
      setPagination((prev) => ({
        ...prev,
        totalMessages: prev.totalMessages + 1,
      }));
    };

    const handleConnectError = (err: Error) => {
      console.log("Connection error:", err.message);
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

  const sendMessage = useCallback(
    (message: string) => {
      if (!socket) {
        toast.error("Socket not connected");
        return;
      }

      socket.emit("NEW_MESSAGE", {
        chatId,
        message,
        sender: {
          id: user?.id,
          username: user?.username,
        },
      });
    },
    [socket, chatId, user]
  );

  const loadMoreMessages = useCallback(() => {
    if (pagination.hasPreviousPage) {
      fetchMessages(pagination.currentPage + 1);
    }
  }, [fetchMessages, pagination.hasPreviousPage, pagination.currentPage]);

  return {
    messages,
    sendMessage,
    data,
    isLoading,
    pagination,
    loadMoreMessages,
  };
}
