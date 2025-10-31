import { z } from "zod";

// Gender options for personalized narration
export const genderSchema = z.enum(["him", "her", "neutral"]);
export type Gender = z.infer<typeof genderSchema>;

// Genre types with their story hooks and ambience
export const genreSchema = z.enum([
  "truth_or_dare",
  "accidental_encounter",
  "horror_auto",
  "back_to_school",
  "old_friends_reunion",
  "midnight_parcel"
]);
export type Genre = z.infer<typeof genreSchema>;

// Genre metadata for UI display
export interface GenreMetadata {
  id: Genre;
  name: string;
  hook: string;
  ambience: string;
}

export const GENRES: GenreMetadata[] = [
  {
    id: "truth_or_dare",
    name: "Truth or Dare (Pub)",
    hook: "You're both dragged into a pub ritual: the infamous 'Truth or Dare Round.' The bottle spins—stops between you two. Everyone watches.",
    ambience: "lo-fi beats, glass clinks, laughter → hush"
  },
  {
    id: "accidental_encounter",
    name: "Accidental Encounter (Café)",
    hook: "Morning rush. Coffee spills. Phones drop. One story begins.",
    ambience: "light rain, café jazz → soft piano"
  },
  {
    id: "horror_auto",
    name: "Horror Auto Ride",
    hook: "1:30 AM. Same auto. Driver hums. 'You're the seventh pair this month.'",
    ambience: "muffled hum, silence, bass rumble"
  },
  {
    id: "back_to_school",
    name: "Back to School",
    hook: "You wake in 12th-grade classroom. Exam: 'Collaboration mandatory.'",
    ambience: "bell echo, chalk, fan hum → nostalgic piano"
  },
  {
    id: "old_friends_reunion",
    name: "Old Friends Reunion",
    hook: "Reunion hall empty. Doors lock. Photos play — memories that never happened.",
    ambience: "projector flicker, thunder → strings"
  },
  {
    id: "midnight_parcel",
    name: "Midnight Parcel",
    hook: "Courier delivers half a parcel. Note: 'Meet at 12:00 AM.'",
    ambience: "rain, ticking clock, synth pulse"
  }
];

// Message types in the story feed
export const messageTypeSchema = z.enum(["user", "ai", "ambience", "system"]);
export type MessageType = z.infer<typeof messageTypeSchema>;

// Individual story message
export interface StoryMessage {
  id: string;
  type: MessageType;
  content: string;
  sender?: "user1" | "user2"; // Only for user messages
  timestamp: number;
}

// Room state
export const roomStateSchema = z.enum(["waiting", "active", "ended"]);
export type RoomState = z.infer<typeof roomStateSchema>;

// Room data structure
export interface Room {
  code: string;
  genre: Genre;
  state: RoomState;
  users: {
    user1?: {
      id: string;
      gender: Gender;
    };
    user2?: {
      id: string;
      gender: Gender;
    };
  };
  currentTurn: "user1" | "user2";
  messages: StoryMessage[];
  startTime?: number;
  endTime?: number;
}

// WebSocket message schemas
export const joinRoomSchema = z.object({
  code: z.string().length(6).regex(/^\d{6}$/),
  gender: genderSchema,
  genre: genreSchema
});
export type JoinRoomMessage = z.infer<typeof joinRoomSchema>;

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(500)
});
export type SendMessageMessage = z.infer<typeof sendMessageSchema>;

export const endStorySchema = z.object({
  roomCode: z.string().length(6)
});
export type EndStoryMessage = z.infer<typeof endStorySchema>;

// Client-side room info
export interface RoomInfo {
  code: string;
  genre: Genre;
  userGender: Gender;
  partnerGender?: Gender;
  userNumber: "user1" | "user2";
  state: RoomState;
  currentTurn: "user1" | "user2";
  messages: StoryMessage[];
  startTime?: number;
  timeRemaining?: number;
}
