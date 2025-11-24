// src/ChatPanel.jsx
import React, { useState } from "react";
import "./ChatPanel.css";

const ChatPanel = ({ username, messages, onSend }) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    onSend({
      sender: username || "Anon",
      text: trimmed,
      timestamp: new Date().toISOString(),
    });

    setInput("");
  };

  const formatSender = (sender) => {
    if (sender === "System") return "System";
    if (sender === username) return "You";
    return sender;
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="chat-title">Session Chat</div>
        <div className="chat-subtitle">
          Signed in as <span className="chat-username">{username || "Guest"}</span>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            No messages yet. Say hello to your viewers!
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isSystem = msg.sender === "System";
            const isOwn = msg.sender === username;

            const classes = [
              "chat-message",
              isSystem ? "system" : "",
              !isSystem && isOwn ? "own" : "",
              !isSystem && !isOwn ? "other" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <div key={idx} className={classes}>
                <div className="chat-meta">
                  <span className="chat-sender">
                    {formatSender(msg.sender)}
                  </span>
                  <span className="chat-time">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="chat-text">{msg.text}</div>
              </div>
            );
          })
        )}
      </div>

      <form className="chat-input-row" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Type a message and press Enter…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default ChatPanel;