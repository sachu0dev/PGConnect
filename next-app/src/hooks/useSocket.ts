import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const useSocket = (
  serverUrl: string,
  accessToken: string | null
): Socket | null => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const newSocket = io(serverUrl, {
      transports: ["websocket"],
      auth: {
        token: accessToken,
      },
    });

    newSocket.on("connect", () => {
      console.log("Connected to socket server");
    });

    setSocket(newSocket);

    return () => {
      console.log("Disconnecting socket...");
      newSocket.disconnect();
    };
  }, [serverUrl, accessToken]);

  return socket;
};

export default useSocket;
