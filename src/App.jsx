import React, { useState, useRef, useEffect } from "react";

const App = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = () => {
    if (!input.trim() || blocked) return;

    const userText = input; // ✅ FIX

    const userMsg = {
      text: userText,
      sender: "user",
      status: "sent",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // ticks
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg, i) =>
          i === prev.length - 1 ? { ...msg, status: "delivered" } : msg,
        ),
      );
    }, 500);

    const delay = Math.min(2000, userText.length * 50);

    setTimeout(async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: userText }),
        });

        if (!res.ok) {
          throw new Error("Server error");
        }

        const data = await res.json();

        setMessages((prev) => [...prev, { text: data.reply, sender: "bot" }]);

        if (data.block) {
          setBlocked(true);
        }
      } catch (err) {
        console.log(err);
        setMessages((prev) => [
          ...prev,
          { text: "Network error 😭", sender: "bot" },
        ]);
      }

      setIsTyping(false);
    }, delay);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#0f0f0f] via-[#1a1a2e] to-black flex items-center justify-center">
      <div className="w-[380px] h-[640px] rounded-[2rem] bg-white/5 backdrop-blur-2xl border border-white/10 shadow-xl flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="p-4 flex items-center gap-3 border-b border-white/10">
          <img src="/profilePicture.png" className="w-10 h-10 rounded-full" />
          <div>
            <h2 className="text-white text-sm font-semibold">
              My AI Companion
            </h2>
            <span className="text-green-400 text-xs">
              {isTyping ? "Typing..." : "Online"}
            </span>
          </div>
        </div>

        {/* CHAT */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto no-scrollbar">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-16 text-sm">
              Start a conversation…
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div className="max-w-[75%]">
                <div
                  className={`message px-4 py-2 text-sm rounded-2xl ${
                    msg.sender === "user"
                      ? "bg-linear-to-r from-blue-500 to-indigo-600 text-white"
                      : "bg-white/10 text-white"
                  }`}
                >
                  {msg.text}
                </div>

                {msg.sender === "user" && (
                  <div className="text-xs text-gray-400 text-right mt-1">
                    {msg.time} {msg.status === "sent" ? "✓" : "✓✓"}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing */}
          {isTyping && (
            <div className="flex">
              <div className="bg-white/10 px-4 py-2 rounded-2xl flex gap-1">
                <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-white rounded-full animate-bounce"></span>
              </div>
            </div>
          )}

          <div ref={chatEndRef}></div>
        </div>

        {/* INPUT */}
        {!blocked ? (
          <div className="p-3 border-t border-white/10 flex gap-2">
            <input
              className="flex-1 bg-white/10 text-white px-4 py-2 rounded-full outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <button
              onClick={sendMessage}
              className="bg-blue-500 px-4 rounded-full text-white"
            >
              ➤
            </button>
          </div>
        ) : (
          <div className="p-4 text-center text-red-400">You are blocked!</div>
        )}
      </div>
    </div>
  );
};

export default App;
