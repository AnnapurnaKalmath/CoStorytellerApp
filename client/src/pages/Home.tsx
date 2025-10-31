import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { GENRES, type Gender, type Genre } from "@shared/schema";

interface HomeProps {
  onJoinRoom: (code: string, gender: Gender, genre: Genre) => void;
}

export default function Home({ onJoinRoom }: HomeProps) {
  const [step, setStep] = useState<"code" | "gender" | "genre">("code");
  const [roomCode, setRoomCode] = useState("");
  const [selectedGender, setSelectedGender] = useState<Gender | null>(null);

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.length === 6 && /^\d{6}$/.test(roomCode)) {
      setStep("gender");
    }
  };

  const handleGenderSelect = (gender: Gender) => {
    setSelectedGender(gender);
    setStep("genre");
  };

  const handleGenreSelect = (genre: Genre) => {
    if (selectedGender) {
      onJoinRoom(roomCode, selectedGender, genre);
    }
  };

  if (step === "code") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-8">
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold font-serif text-foreground">
                CoStory
              </h1>
              <p className="text-muted-foreground">
                Create collaborative stories in real-time
              </p>
            </div>

            <form onSubmit={handleCodeSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="room-code" className="text-sm font-medium text-foreground">
                  Enter 6-Digit Room Code
                </label>
                <Input
                  id="room-code"
                  data-testid="input-room-code"
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="h-16 text-center text-2xl font-mono tracking-widest"
                  autoFocus
                />
              </div>

              <Button
                data-testid="button-continue"
                type="submit"
                className="w-full h-12"
                disabled={roomCode.length !== 6}
              >
                Continue
              </Button>
            </form>

            <p className="text-xs text-center text-muted-foreground">
              Both users must enter the same code to match
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (step === "gender") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-8">
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Select Your Character</h2>
              <p className="text-sm text-muted-foreground">
                Room Code: <span className="font-mono font-medium text-foreground">{roomCode}</span>
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <Button
                data-testid="button-gender-him"
                variant="outline"
                className="h-14 rounded-full border-2 text-base font-medium hover-elevate active-elevate-2"
                onClick={() => handleGenderSelect("him")}
              >
                Him
              </Button>
              <Button
                data-testid="button-gender-her"
                variant="outline"
                className="h-14 rounded-full border-2 text-base font-medium hover-elevate active-elevate-2"
                onClick={() => handleGenderSelect("her")}
              >
                Her
              </Button>
              <Button
                data-testid="button-gender-neutral"
                variant="outline"
                className="h-14 rounded-full border-2 text-base font-medium hover-elevate active-elevate-2"
                onClick={() => handleGenderSelect("neutral")}
              >
                Neutral
              </Button>
            </div>

            <Button
              data-testid="button-back"
              variant="ghost"
              onClick={() => setStep("code")}
              className="w-full"
            >
              Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-foreground">
              Choose Your Story
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Select a genre to begin your 10-minute journey
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="px-3 py-1.5 bg-card rounded-lg font-mono text-foreground border border-card-border">
              {roomCode}
            </span>
            <span className="px-3 py-1.5 bg-card rounded-lg text-foreground border border-card-border capitalize">
              {selectedGender}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GENRES.map((genre) => (
            <Card
              key={genre.id}
              data-testid={`card-genre-${genre.id}`}
              className="p-6 cursor-pointer hover-elevate active-elevate-2 transition-all overflow-visible"
              onClick={() => handleGenreSelect(genre.id)}
            >
              <div className="space-y-4">
                <h3 className="text-2xl md:text-3xl font-bold font-serif text-foreground leading-tight">
                  {genre.name}
                </h3>
                <p className="text-base leading-relaxed font-serif text-foreground/90">
                  {genre.hook}
                </p>
                <p className="text-sm font-mono tracking-wide uppercase text-muted-foreground opacity-70">
                  {genre.ambience}
                </p>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex justify-center">
          <Button
            data-testid="button-back-from-genre"
            variant="ghost"
            onClick={() => setStep("gender")}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
