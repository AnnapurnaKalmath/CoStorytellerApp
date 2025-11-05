import { z } from "zod";

// Gender options for personalized narration (KEEP)
export const genderSchema = z.enum(["him", "her", "neutral"]);
export type Gender = z.infer<typeof genderSchema>;

// Genre types: REMOVE all old stories, ADD the new Adaptive Genre
export const genreSchema = z.enum([
  "yjhd_temple_incident", // New single genre ID for the adaptive flow
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
    id: "yjhd_temple_incident",
    name: "YJHD: The Temple Incident (Adaptive)",
    hook: "Dusty sunlight hits the jeep windshield. Five bikers block the road, their engines growling louder than Avi’s stomach.",
    ambience: "engine growl, distant bells, tension"
  }
];

// Message types in the story feed (KEEP)
export const messageTypeSchema = z.enum(["user", "ai", "ambience", "system"]);
export type MessageType = z.infer<typeof messageTypeSchema>;

// Individual story message (KEEP)
export interface StoryMessage {
  id: string;
  type: MessageType;
  content: string;
  sender?: "user1" | "user2"; // Only for user messages
  timestamp: number;
}

// Room state (KEEP)
export const roomStateSchema = z.enum(["waiting", "active", "ended"]);
export type RoomState = z.infer<typeof roomStateSchema>;

// Room data structure (KEEP - no scene/beat trackers)
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

// WebSocket message schemas (KEEP)
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

// Client-side room info (KEEP - no scene/beat trackers)
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