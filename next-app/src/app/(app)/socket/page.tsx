"use client";
import { useEffect, useState } from "react";
import useSocket from "@/hooks/useSocket";

const SocketTest: React.FC = () => {
  const socket = useSocket("http://localhost:4000"); // Replace with your Socket.IO server URL
  const [messages, setMessages] = useState<string[]>([]);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!socket) return;

    // Listen for messages from the server
    socket.on("message", (data: string) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off("message");
    };
  }, [socket]);

  const sendMessage = () => {
    if (socket && message.trim()) {
      socket.emit("message", message); // Send a message to the server
      setMessage("");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Socket.IO Client Test</h1>
      <div>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message"
        />
        <button onClick={sendMessage}>Send</button>
      </div>
      <div style={{ marginTop: "20px" }}>
        <h2>Messages:</h2>
        <ul>
          {messages.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SocketTest;
