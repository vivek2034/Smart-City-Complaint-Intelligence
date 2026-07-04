import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, Bot, HelpCircle, Loader2 } from "lucide-react";
import axios from "axios";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AiAssistantProps {
  currentUserId?: string;
  currentUserRole?: "citizen" | "official";
}

export default function AiAssistant({ currentUserId, currentUserRole }: AiAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hello! I am the **Smart City Complaint Intelligence Assistant** 🏙️✨.

I can help you with:
1. **Filing a complaint** correctly.
2. **Checking the status** of municipal issues.
3. **Explaining AI-analyzed severity** or categories.
4. **Providing helpful contacts** for urgent situations.

How can I assist you in building or managing our city today?`
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    "How is complaint severity decided?",
    "What categories are supported?",
    "How to track my complaint?",
    "Who handles water leakage issues?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const queryText = (textToSend || input).trim();
    if (!queryText) return;

    if (!textToSend) setInput("");
    setMessages((prev) => [...prev, { role: "user", content: queryText }]);
    setLoading(true);

    try {
      // Send chat history and current query to the Express proxy
      const response = await axios.post("/api/assistant", {
        messages: [
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: "user", content: queryText }
        ],
        userContext: {
          id: currentUserId || "Anonymous",
          role: currentUserRole || "Visitor"
        }
      });

      const reply = response.data.reply;
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (error) {
      console.error("[Assistant UI] Error calling chat:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm having a bit of trouble connecting to our core AI servers. Here is a helpful answer: Citizens can easily submit complaints with photos. Our system automatically categorizes, estimates timelines, and assigns tasks to departmental teams."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500 rounded-lg">
            <Sparkles className="w-4 h-4 text-indigo-100" />
          </div>
          <div>
            <h4 className="font-semibold text-sm font-display leading-tight">Civic Assistant AI</h4>
            <p className="text-[10px] text-indigo-200">NVIDIA Mistral Powered</p>
          </div>
        </div>
        <span className="text-[10px] bg-indigo-500 font-semibold px-2 py-0.5 rounded-full text-indigo-100">
          ● Online
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-3 max-w-[85%] ${m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                m.role === "user" ? "bg-indigo-100 text-indigo-600" : "bg-indigo-600 text-white"
              }`}
            >
              {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div
              className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                m.role === "user"
                  ? "bg-indigo-600 text-white rounded-tr-none"
                  : "bg-white text-slate-700 rounded-tl-none border border-slate-100"
              }`}
            >
              <div className="whitespace-pre-line prose prose-xs">
                {m.content}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 mr-auto max-w-[85%]">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-indigo-600 text-white animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 bg-white text-slate-500 rounded-2xl rounded-tl-none border border-slate-100 text-xs shadow-sm flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              <span>Analyzing city databases...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100/50">
          <p className="text-[10px] text-slate-400 font-medium mb-1.5 flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-indigo-400" /> Suggested Queries
          </p>
          <div className="flex flex-wrap gap-1.5">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="text-[10px] text-slate-600 bg-white hover:bg-indigo-50 hover:text-indigo-600 px-2 py-1 rounded-full border border-slate-200 transition-all font-medium"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 border-t border-slate-100 flex gap-2 bg-white"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about guidelines, status tracking..."
          disabled={loading}
          className="flex-1 bg-slate-50 text-xs px-3.5 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-slate-200 text-slate-800 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white p-2 rounded-xl flex items-center justify-center transition-all shadow-sm shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
