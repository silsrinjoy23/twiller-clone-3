import React, { useState, useEffect, useRef } from "react";
import "./chatbot.css";

const Chatbot = () => {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatAreaRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when chat updates
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [chat]);

  // Show welcome message on first load
  useEffect(() => {
    setChat([
      {
        sender: "bot",
        text: "👋 Hey there! I'm InsightBot. Ask me anything about tech, sports, or trends!",
      },
    ]);
  }, []);

  const simulateTyping = async (messages) => {
    for (let i = 0; i < messages.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500 + i * 200));
      setChat((prev) => [...prev, messages[i]]);
    }
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setChat((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    inputRef.current?.focus();

    try {
      const res = await fetch("http://localhost:5000/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input }),
      });

      const data = await res.json();
      const tweetList = data.tweets || [];

      if (tweetList.length > 0) {
        const botMessages = tweetList.map((t) => ({
          sender: "bot",
          text: `@${t.username || "user"}: ${t.post || ""}`,
          image: t.photo || null,
        }));
        await simulateTyping(botMessages);
      } else {
        await simulateTyping([
          {
            sender: "bot",
            text:
              "🤔 Hmm, I couldn’t find any tweets about that. Maybe try asking about a trending topic like AI, cricket, or climate?",
          },
        ]);
      }
    } catch (err) {
      console.error("Chatbot API error:", err);
      await simulateTyping([
        {
          sender: "bot",
          text: "⚠️ Oops! Something went wrong while fetching the response. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-wrapper">
      <div className="chatbot-box">
        <div className="chatbot-header">
          <span className="chatbot-icon">✨</span>
          <h2>InsightBot</h2>
          <p>Your intelligent assistant for tweets and more!</p>
        </div>

        <div className="chat-area" ref={chatAreaRef}>
          {chat.map((msg, idx) => (
            <div
              key={idx}
              className={`chat-message ${
                msg.sender === "user" ? "user-msg" : "bot-msg"
              }`}
            >
              <p>{msg.text}</p>
              {msg.image && (
                <img src={msg.image} alt="tweet" className="tweet-image" />
              )}
            </div>
          ))}

          {loading && (
            <div className="loading-indicator bot-msg">
              <div className="dot-pulse"></div>
              <span>Typing a response...</span>
            </div>
          )}
        </div>

        <form onSubmit={handleAsk} className="chat-form">
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask me about tech trends, sports, AI advancements..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? (
              <span className="spinner"></span>
            ) : (
              <>
                Send <i className="fa fa-paper-plane" aria-hidden="true"></i>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
