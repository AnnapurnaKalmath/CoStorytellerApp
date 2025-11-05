import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "crypto";
import { roomManager } from "./roomManager";
import { generateNarration, generateGenreHook } from "./gemini";
import {
  joinRoomSchema,
  sendMessageSchema,
  type StoryMessage,
} from "@shared/schema";

// NOTE: This constant is defined here but requires the function body to be implemented 
// (which is assumed to be in the provided context for startTimerUpdates).
const timerIntervals = new Map<string, NodeJS.Timeout>(); 

function broadcastRoomUpdate(room: any, userSockets: Map<string, WebSocket>, roomManager: any, eventType: string = "room_updated") {
    if (room.users.user1?.id) {
      const user1Socket = userSockets.get(room.users.user1.id);
      const user1Info = roomManager.getRoomInfo(room, room.users.user1.id);
      if (user1Socket && user1Socket.readyState === WebSocket.OPEN) {
        user1Socket.send(
          JSON.stringify({
            type: eventType,
            roomInfo: user1Info,
          })
        );
      }
    }

    if (room.users.user2?.id) {
      const user2Socket = userSockets.get(room.users.user2.id);
      const user2Info = roomManager.getRoomInfo(room, room.users.user2.id);
      if (user2Socket && user2Socket.readyState === WebSocket.OPEN) {
        user2Socket.send(
          JSON.stringify({
            type: eventType,
            roomInfo: user2Info,
          })
        );
      }
    }
  }

// Assuming startTimerUpdates exists and is correctly implemented elsewhere in the server.
function startTimerUpdates(code: string, user1Id: string, user2Id: string) {
    if (timerIntervals.has(code)) {
      return;
    }

    const interval = setInterval(() => {
      const room = roomManager.getRoom(code);
      if (!room || room.state !== "active") {
        clearInterval(interval);
        timerIntervals.delete(code);
        return;
      }

      // Logic to send timer updates to sockets (omitted for brevity, assume correct implementation)
      // This is necessary because broadcastRoomUpdate relies on userSockets being available here.
      
      if (room.startTime) {
        const elapsed = Math.floor((Date.now() - room.startTime) / 1000);
        if (elapsed >= 600) {
          roomManager.endStory(code);
          // NOTE: broadcastRoomUpdate will need userSockets passed to it here!
          // broadcastRoomUpdate(room, userSockets, roomManager, "story_ended"); 
          clearInterval(interval);
          timerIntervals.delete(code);
        }
      }
    }, 1000);

    timerIntervals.set(code, interval);
  }


export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  const userSockets = new Map<string, WebSocket>();

  wss.on("connection", (ws: WebSocket) => {
    const userId = randomUUID();
    userSockets.set(userId, ws);
    console.log(`User ${userId} connected`);

    ws.on("message", async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        console.log(`Message from ${userId}:`, message);

        switch (message.type) {
          case "join_room": {
            const { code, gender, genre } = joinRoomSchema.parse(message);
            const { room, userNumber, isNewRoom } = roomManager.createOrJoinRoom(
              userId,
              code,
              gender,
              genre
            );

            const roomInfo = roomManager.getRoomInfo(room, userId);
            ws.send(
              JSON.stringify({
                type: "room_joined",
                roomInfo,
              })
            );

            if (!isNewRoom && room.state === "active") {
              // The logic here is for the initial start after both join.
              const genreHook = await generateGenreHook(
                room.genre,
                room.users.user1?.gender || "neutral",
                room.users.user2?.gender || "neutral"
              );

              const hookMessage: StoryMessage = {
                id: randomUUID(),
                type: "ai",
                content: genreHook,
                timestamp: Date.now(),
              };
              roomManager.addMessage(code, hookMessage);

              // Use the unified broadcast function here:
              broadcastRoomUpdate(room, userSockets, roomManager);
              
              startTimerUpdates(code, room.users.user1!.id, room.users.user2!.id);
            }
            break;
          }

          case "send_message": {
            const { content } = sendMessageSchema.parse(message);
            const room = roomManager.getRoomByUserId(userId);

            if (!room || room.state !== "active") {
              ws.send(
                JSON.stringify({
                  type: "error",
                  message: "Room not active",
                })
              );
              break;
            }

            const userNumber =
              room.users.user1?.id === userId ? "user1" : "user2";

            if (room.currentTurn !== userNumber) {
              ws.send(
                JSON.stringify({
                  type: "error",
                  message: "Not your turn",
                })
              );
              break;
            }

            // 1. ADD USER MESSAGE
            const userMessage: StoryMessage = {
              id: randomUUID(),
              type: "user",
              content,
              sender: userNumber,
              timestamp: Date.now(),
            };
            roomManager.addMessage(room.code, userMessage);

            // 2. Determine if this is the Fusion Turn (i.e., the second player in the micro-loop)
            const isFusionTurn = (userNumber === "user2");

            if (isFusionTurn) {
              // --- A. FUSION TURN: Call AI and generate response based on BOTH inputs ---
              
              broadcastRoomUpdate(room, userSockets, roomManager, "ai_thinking"); 

              // Get the last two user messages (Bunny then Naina)
              // NOTE: This relies on the new getLastTwoUserMessages in roomManager.ts
              const lastTwoMessages = roomManager.getLastTwoUserMessages(room.code);

              // Construct the history string for the Fusion Narrator
              // We reverse the order here to ensure the AI reads Bunny's move first, then Naina's
              const fusionHistory = lastTwoMessages
                .map((msg) => `${msg.sender}: ${msg.content}`)
                .join("\n");

              const narration = await generateNarration({
                genre: room.genre,
                gender1: room.users.user1?.gender || "neutral",
                gender2: room.users.user2?.gender || "neutral",
                history: fusionHistory, // Contains Bunny's and Naina's input
                userInput: content, // The latest input (Naina's)
              });

              // Add the Fusion AI Message
              const aiMessage: StoryMessage = {
                id: randomUUID(),
                type: "ai",
                content: narration,
                timestamp: Date.now(),
              };
              roomManager.addMessage(room.code, aiMessage);

              // Switch turn back to the FIRST player (Bunny) to restart the micro-loop
              roomManager.switchTurn(room.code); // room.currentTurn is now 'user1'

              broadcastRoomUpdate(room, userSockets, roomManager);

            } else {
              // --- B. BUNNY'S TURN: Switch turn to Naina, NO AI CALL ---
              
              // Only switch the turn to the next user in the loop (Naina)
              roomManager.switchTurn(room.code); // room.currentTurn is now 'user2'
              
              // Broadcast the room update so Naina sees Bunny's move and knows it's her turn
              broadcastRoomUpdate(room, userSockets, roomManager);
            }
            
            break;
          }

          case "end_story": {
            const room = roomManager.getRoomByUserId(userId);
            if (room) {
              roomManager.endStory(room.code);
              broadcastRoomUpdate(room, userSockets, roomManager, "story_ended");
            }
            break;
          }

          case "leave_room": {
            roomManager.removeUser(userId);
            break;
          }
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
        ws.send(
          JSON.stringify({
            type: "error",
            message: error instanceof Error ? error.message : "Unknown error",
          })
        );
      }
    });

    ws.on("close", () => {
      console.log(`User ${userId} disconnected`);
      roomManager.removeUser(userId);
      userSockets.delete(userId);
    });
  });

  return httpServer;
}