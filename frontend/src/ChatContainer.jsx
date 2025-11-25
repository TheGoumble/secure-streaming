import React, { useEffect, useRef, useState } from "react";
import { WS_BASE_URL } from "./config";
import ChatPanel from "./ChatPanel";

/**
 * ChatContainer wraps ChatPanel and handles WebSocket logic.
 * roomId: shared ID for a stream session (we'll use the streamer username).
 * username: current user's username.
 */
const ChatContainer = ({ roomId, username }) => {
  const [messages, setMessages] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    // Prevent duplicate connections on re-render
    if (!roomId || !username) return;

    const url = `${WS_BASE_URL}/chat?roomId=${encodeURIComponent(
      roomId
    )}&username=${encodeURIComponent(username)}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Chat WebSocket connected:", url);
      setMessages((prev) => [
        ...prev,
        {
          sender: "System",
          text: `Connected to chat room: ${roomId}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        setMessages((prev) => [...prev, msg]);
      } catch (e) {
        console.error("Failed to parse chat message:", e);
      }
    };

    ws.onerror = (err) => {
      console.error("Chat WebSocket error:", err);
    };

    ws.onclose = () => {
      console.log("Chat WebSocket closed");
    };

    return () => {
      ws.close();
    };
  }, [roomId, username]);

  const handleSend = (msg) => {
  const ws = wsRef.current;
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  } else {
    console.warn("Chat WebSocket not open, cannot send message");
  }
};

  return (
    <ChatPanel
      username={username}
      messages={messages}
      onSend={handleSend}
    />
  );
};

export default ChatContainer;