"use client";
import { ChatData } from "@/helpers/TypeHelper";
import api from "@/lib/axios";
import { ApiResponse } from "@/types/response";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const Page = ({ params }: { params: Promise<{ id: string }> }) => {
  const resolvedParams = React.use(params);
  const [chatData, setChatData] = useState<ChatData>();
  const [loading, setLoading] = useState<boolean>(true);

  const [id] = useState<string>(resolvedParams.id);

  const fetchChatDetails = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse<ChatData>>(
        `/api/pg/get-chat-data/${id}`
      );

      if (response.data.success) {
        setChatData(response.data.data);
      }
    } catch (error) {
      console.log("Error fetching details:", error);
      toast.error("Failed to fetch PG details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchChatDetails();
  }, [fetchChatDetails]);

  return (
    <div>
      <pre>
        {chatData?.messages &&
          chatData.messages.map((message) => {
            return (
              <div key={message.id}>
                <p>{message.sender.username}</p>
                <p>{message.text}</p>
              </div>
            );
          })}
      </pre>
    </div>
  );
};

export default Page;
