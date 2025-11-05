// --- server/roomManager.ts (MODIFIED to include new state variables) ---

import { randomUUID } from "crypto";
import {
  type Room,
  type RoomInfo,
  type RoomState,
  type Gender,
  type Genre,
  type StoryMessage,
} from "@shared/schema";

// NOTE: Assume Room interface in @shared/schema is updated to include:
// tension_level: number;
// sync_score: number;
// world_reactivity: number;
// latest_ai_state: string; // To hold the JSON from the AI

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private userToRoom: Map<string, string> = new Map();
  private roomTimers: Map<string, NodeJS.Timeout> = new Map();

  createOrJoinRoom(
    userId: string,
    code: string,
    gender: Gender,
    genre: Genre
  ): { room: Room; userNumber: "user1" | "user2"; isNewRoom: boolean } {
    let room = this.rooms.get(code);

    if (!room) {
      room = {
        code,
        genre,
        state: "waiting",
        users: {
          user1: { id: userId, gender },
        },
        currentTurn: "user1",
        messages: [],
        
        // 🛑 NEW STATE INITIALIZATION 🛑
        tension_level: 2, // Start at 2 as per prompt
        sync_score: 2,
        world_reactivity: 1,
        latest_ai_state: '{"tension_level": 2, "sync_score": 2, "world_reactivity": 1}',
      };
      this.rooms.set(code, room);
      this.userToRoom.set(userId, code);
      return { room, userNumber: "user1", isNewRoom: true };
    }

    // ... (rest of createOrJoinRoom logic remains the same)

    if (room.genre !== genre) {
      throw new Error("Genre mismatch");
    }

    if (!room.users.user2 && room.users.user1?.id !== userId) {
      room.users.user2 = { id: userId, gender };
      room.state = "active";
      room.startTime = Date.now();
      this.userToRoom.set(userId, code);

      this.startTimer(code);

      return { room, userNumber: "user2", isNewRoom: false };
    }

    if (room.users.user1?.id === userId) {
      return { room, userNumber: "user1", isNewRoom: false };
    }
    if (room.users.user2?.id === userId) {
      return { room, userNumber: "user2", isNewRoom: false };
    }

    throw new Error("Room is full");
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code);
  }

  getRoomByUserId(userId: string): Room | undefined {
    const code = this.userToRoom.get(userId);
    return code ? this.rooms.get(code) : undefined;
  }

  addMessage(code: string, message: StoryMessage): void {
    const room = this.rooms.get(code);
    if (room) {
      room.messages.push(message);
    }
  }

  // Gets the two most recent messages from users only
  getLastTwoUserMessages(code: string): StoryMessage[] {
    const room = this.rooms.get(code);
    if (!room) return [];
    
    // Filter out non-user messages and take the last two entries.
    const userMessages = room.messages.filter(msg => msg.type === "user");
    return userMessages.slice(-2);
  }

  // 🛑 NEW METHOD: Updates the three dynamic state variables 🛑
  updateDynamicState(code: string, newStateJson: string): void {
    const room = this.rooms.get(code);
    if (!room) return;

    try {
        const newState = JSON.parse(newStateJson);
        
        // This relies on the Room interface having these properties!
        room.tension_level = newState.tension_level || room.tension_level;
        room.sync_score = newState.sync_score || room.sync_score;
        room.world_reactivity = newState.world_reactivity || room.world_reactivity;
        room.latest_ai_state = newStateJson;
        
        // Check for ending conditions based on the new state
        if (room.sync_score > 3 || room.tension_level >= 5) {
            this.endStory(code);
        }
        
    } catch (e) {
        console.error("Failed to parse and update dynamic state:", e);
    }
  }

  switchTurn(code: string): void {
    const room = this.rooms.get(code);
    if (room) {
      room.currentTurn = room.currentTurn === "user1" ? "user2" : "user1";
    }
  }

  endStory(code: string): void {
    const room = this.rooms.get(code);
    if (room) {
      room.state = "ended";
      room.endTime = Date.now();
      this.clearTimer(code);
    }
  }

  removeUser(userId: string): void {
    const code = this.userToRoom.get(userId);
    if (code) {
      const room = this.rooms.get(code);
      if (room) {
        if (room.users.user1?.id === userId) {
          room.users.user1 = undefined;
        }
        if (room.users.user2?.id === userId) {
          room.users.user2 = undefined;
        }

        if (!room.users.user1 && !room.users.user2) {
          this.rooms.delete(code);
          this.clearTimer(code);
        }
      }
      this.userToRoom.delete(userId);
    }
  }

  getRoomInfo(room: Room, userId: string): RoomInfo {
    const userNumber = room.users.user1?.id === userId ? "user1" : "user2";
    const userGender = userNumber === "user1" ? room.users.user1?.gender! : room.users.user2?.gender!;
    const partnerGender = userNumber === "user1" ? room.users.user2?.gender : room.users.user1?.gender;

    let timeRemaining: number | undefined;
    if (room.state === "active" && room.startTime) {
      const elapsed = Math.floor((Date.now() - room.startTime) / 1000);
      timeRemaining = Math.max(0, 600 - elapsed);
    }

    return {
      code: room.code,
      genre: room.genre,
      userGender,
      partnerGender,
      userNumber,
      state: room.state,
      currentTurn: room.currentTurn,
      messages: room.messages,
      startTime: room.startTime,
      timeRemaining,
      
      // 🛑 Include dynamic state in RoomInfo 🛑
      tension_level: room.tension_level,
      sync_score: room.sync_score,
      world_reactivity: room.world_reactivity,
      latest_ai_state: room.latest_ai_state,
    };
  }

  private startTimer(code: string): void {
    this.clearTimer(code);

    const timer = setTimeout(() => {
      this.endStory(code);
    }, 600000);

    this.roomTimers.set(code, timer);
  }

  private clearTimer(code: string): void {
    const timer = this.roomTimers.get(code);
    if (timer) {
      clearTimeout(timer);
      this.roomTimers.delete(code);
    }
  }
}

export const roomManager = new RoomManager();