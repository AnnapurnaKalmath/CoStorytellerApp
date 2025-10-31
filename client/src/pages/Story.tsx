import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Download, Send, Loader2 } from "lucide-react";
import { type RoomInfo, type StoryMessage } from "@shared/schema";
import { cn } from "@/lib/utils";

interface StoryProps {
  roomInfo: RoomInfo;
  onSendMessage: (content: string) => void;
  onEndStory: () => void;
  isAiThinking: boolean;
}

export default function Story({ roomInfo, onSendMessage, onEndStory, isAiThinking }: StoryProps) {
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMyTurn = roomInfo.currentTurn === roomInfo.userNumber;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [roomInfo.messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && isMyTurn && !isAiThinking) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleDownload = () => {
    const storyText = roomInfo.messages
      .map((msg) => {
        if (msg.type === "ai") {
          return `AI: ${msg.content}`;
        } else if (msg.type === "user") {
          const label = msg.sender === roomInfo.userNumber ? "You" : "Partner";
          return `${label}: ${msg.content}`;
        } else if (msg.type === "ambience") {
          return `[${msg.content}]`;
        }
        return msg.content;
      })
      .join("\n\n");

    const blob = new Blob([storyText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `costory-${roomInfo.code}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const timeRemaining = roomInfo.timeRemaining || 600;
  const timePercentage = (timeRemaining / 600) * 100;
  const isWarning = timeRemaining < 120;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  const getGenderPronoun = (gender: string) => {
    if (gender === "him") return "He";
    if (gender === "her") return "She";
    return "They";
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="relative h-2 bg-muted">
        <div
          className={cn(
            "h-full transition-all duration-1000 ease-linear",
            isWarning ? "bg-destructive" : "bg-primary"
          )}
          style={{ width: `${timePercentage}%` }}
        />
        <div className="absolute right-2 top-0 transform -translate-y-full mb-1">
          <span className="text-xs font-mono tabular-nums text-muted-foreground bg-background px-2 py-1 rounded-md">
            {minutes}:{seconds.toString().padStart(2, "0")}
          </span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 md:px-8 py-6"
        data-testid="story-feed"
      >
        <div className="max-w-4xl mx-auto space-y-6">
          {roomInfo.messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isUser={msg.sender === roomInfo.userNumber}
              userGender={roomInfo.userGender}
              partnerGender={roomInfo.partnerGender}
              getGenderPronoun={getGenderPronoun}
            />
          ))}
          {isAiThinking && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg border border-card-border">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">AI is narrating...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-card">
        <div className="max-w-4xl mx-auto p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Badge
              data-testid="badge-turn"
              variant={isMyTurn ? "default" : "secondary"}
              className={cn(
                "px-4 py-1.5 text-sm font-medium",
                isMyTurn && "animate-pulse"
              )}
            >
              {isMyTurn ? "Your Turn" : "Partner's Turn"}
            </Badge>
            <Button
              data-testid="button-download"
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Textarea
                data-testid="input-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  isMyTurn
                    ? "Write your dialogue, actions, emotions..."
                    : "Wait for your partner..."
                }
                disabled={!isMyTurn || isAiThinking}
                className="resize-none pr-16 min-h-[100px]"
                rows={3}
                maxLength={500}
              />
              <div className="absolute bottom-3 right-3 text-xs text-muted-foreground tabular-nums">
                {message.length}/500
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                data-testid="button-send"
                type="submit"
                disabled={!message.trim() || !isMyTurn || isAiThinking}
                className="gap-2 flex-1"
              >
                <Send className="h-4 w-4" />
                Send
              </Button>
              <Button
                data-testid="button-end"
                type="button"
                variant="outline"
                onClick={onEndStory}
              >
                End Story
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: StoryMessage;
  isUser: boolean;
  userGender: string;
  partnerGender?: string;
  getGenderPronoun: (gender: string) => string;
}

function MessageBubble({ message, isUser, userGender, partnerGender, getGenderPronoun }: MessageBubbleProps) {
  if (message.type === "ambience") {
    return (
      <div className="flex justify-center" data-testid={`message-ambience-${message.id}`}>
        <div className="max-w-3xl w-full text-center py-4 px-6 bg-muted/30 rounded-lg">
          <p className="text-sm font-mono tracking-wide uppercase text-story-ambience opacity-70">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  if (message.type === "ai") {
    return (
      <div className="flex justify-center" data-testid={`message-ai-${message.id}`}>
        <div className="max-w-2xl w-full p-6 bg-story-ai/5 border border-story-ai/20 rounded-xl">
          <p className="text-lg leading-relaxed font-serif italic text-foreground">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  if (message.type === "user") {
    const label = isUser ? "You" : "Partner";
    const gender = isUser ? userGender : partnerGender || "neutral";
    const pronoun = getGenderPronoun(gender);

    return (
      <div
        className={cn("flex", isUser ? "justify-end" : "justify-start")}
        data-testid={`message-user-${message.id}`}
      >
        <div className="max-w-lg space-y-1">
          <div className={cn("text-xs font-medium", isUser ? "text-right" : "text-left")}>
            <span className="text-muted-foreground">
              {label} ({pronoun})
            </span>
          </div>
          <div
            className={cn(
              "px-6 py-4 rounded-xl",
              isUser
                ? "bg-story-user/10 border border-story-user/30"
                : "bg-story-partner/10 border border-story-partner/30"
            )}
          >
            <p className="text-base font-sans text-foreground leading-relaxed">
              {message.content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
