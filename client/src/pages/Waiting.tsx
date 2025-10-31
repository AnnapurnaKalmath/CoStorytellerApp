import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { GENRES, type Gender, type Genre } from "@shared/schema";

interface WaitingProps {
  roomCode: string;
  gender: Gender;
  genre: Genre;
  onLeave: () => void;
}

export default function Waiting({ roomCode, gender, genre, onLeave }: WaitingProps) {
  const genreData = GENRES.find((g) => g.id === genre);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg p-8">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Waiting for partner...
            </h2>
            <p className="text-muted-foreground">
              Share the room code with someone to begin your story
            </p>
          </div>

          <Card className="p-6 bg-card border border-card-border">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Room Code</span>
                <span className="text-xl font-mono font-bold text-foreground tracking-wider">
                  {roomCode}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Your Character</span>
                <span className="text-base font-medium text-foreground capitalize">
                  {gender}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Genre</span>
                <span className="text-base font-medium text-foreground">
                  {genreData?.name}
                </span>
              </div>
            </div>
          </Card>

          <div className="space-y-2">
            <p className="text-sm font-serif italic text-foreground/80 leading-relaxed">
              {genreData?.hook}
            </p>
            <p className="text-xs font-mono tracking-wide uppercase text-muted-foreground opacity-70">
              {genreData?.ambience}
            </p>
          </div>

          <Button
            data-testid="button-leave"
            variant="outline"
            onClick={onLeave}
            className="w-full"
          >
            Leave Room
          </Button>
        </div>
      </Card>
    </div>
  );
}
