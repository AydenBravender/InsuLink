import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Volume2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", text: "Hello! I'm your AI health assistant. How can I help you today?", isUser: false },
    { id: "2", text: "What's my current insulin schedule?", isUser: true },
    { id: "3", text: "Based on your routine, you're scheduled for insulin at 8:00 AM and 6:00 PM. Your last reading was 120 mg/dL at 2:00 PM.", isUser: false },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [ttsEnabled, setTtsEnabled] = useState(false);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
    };

    setMessages([...messages, newMessage]);
    setInputValue("");

    // Mock AI response
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        text: "I've noted that. Let me help you with that information.",
        isUser: false,
      };
      setMessages((prev) => [...prev, response]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen pb-20">
      <div className="bg-card border-b border-border">
        <div className="px-6 py-6">
          <h1 className="text-2xl font-bold text-foreground">AI Assistant</h1>
          <p className="text-muted-foreground mt-1">Ask me anything about your health</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.isUser ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3",
                message.isUser
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-foreground"
              )}
            >
              <p className="text-sm">{message.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setTtsEnabled(!ttsEnabled)}
          >
            <Volume2 className="w-4 h-4" />
            {ttsEnabled ? "TTS On" : "TTS Off"}
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Mic className="w-4 h-4" />
            Voice
          </Button>
        </div>
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            className="flex-1"
          />
          <Button onClick={handleSend} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
