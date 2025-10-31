import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useWebSocket } from "@/hooks/useWebSocket";
import Home from "@/pages/Home";
import Waiting from "@/pages/Waiting";
import Story from "@/pages/Story";
import { type Gender, type Genre } from "@shared/schema";

function App() {
  const {
    isConnected,
    roomInfo,
    isAiThinking,
    joinRoom,
    sendMessage,
    endStory,
    leaveRoom,
  } = useWebSocket();

  const handleJoinRoom = (code: string, gender: Gender, genre: Genre) => {
    joinRoom(code, gender, genre);
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    window.location.reload();
  };

  const handleEndStory = () => {
    endStory();
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Connecting to server...</p>
        </div>
      </div>
    );
  }

  if (roomInfo && roomInfo.state === "active") {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Story
            roomInfo={roomInfo}
            onSendMessage={sendMessage}
            onEndStory={handleEndStory}
            isAiThinking={isAiThinking}
          />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  if (roomInfo && roomInfo.state === "waiting") {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Waiting
            roomCode={roomInfo.code}
            gender={roomInfo.userGender}
            genre={roomInfo.genre}
            onLeave={handleLeaveRoom}
          />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  if (roomInfo && roomInfo.state === "ended") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md text-center space-y-6">
          <h2 className="text-3xl font-bold font-serif text-foreground">
            Story Complete
          </h2>
          <p className="text-muted-foreground">
            Your 10-minute journey has ended. The story has been saved.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover-elevate active-elevate-2"
          >
            Create Another Story
          </button>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Home onJoinRoom={handleJoinRoom} />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
