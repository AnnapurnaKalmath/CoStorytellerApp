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
              const otherUserId =
                userNumber === "user1" ? room.users.user2?.id : room.users.user1?.id;
              const otherSocket = otherUserId ? userSockets.get(otherUserId) : null;

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

              const user1Info = roomManager.getRoomInfo(room, room.users.user1!.id);
              const user2Info = roomManager.getRoomInfo(room, room.users.user2!.id);

              if (room.users.user1?.id) {
                const user1Socket = userSockets.get(room.users.user1.id);
                if (user1Socket && user1Socket.readyState === WebSocket.OPEN) {
                  user1Socket.send(
                    JSON.stringify({
                      type: "room_updated",
                      roomInfo: user1Info,
                    })
                  );
                }
              }

              if (room.users.user2?.id) {
                const user2Socket = userSockets.get(room.users.user2.id);
                if (user2Socket && user2Socket.readyState === WebSocket.OPEN) {
                  user2Socket.send(
                    JSON.stringify({
                      type: "room_updated",
                      roomInfo: user2Info,
                    })
                  );
                }
              }

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

            const userMessage: StoryMessage = {
              id: randomUUID(),
              type: "user",
              content,
              sender: userNumber,
              timestamp: Date.now(),
            };
            roomManager.addMessage(room.code, userMessage);

            broadcastRoomUpdate(room, "ai_thinking");

            const history = room.messages
              .slice(-4)
              .map((msg) => `${msg.type}: ${msg.content}`)
              .join("\n");

            const narration = await generateNarration({
              genre: room.genre,
              gender1: room.users.user1?.gender || "neutral",
              gender2: room.users.user2?.gender || "neutral",
              history,
              userInput: content,
            });

            const aiMessage: StoryMessage = {
              id: randomUUID(),
              type: "ai",
              content: narration,
              timestamp: Date.now(),
            };
            roomManager.addMessage(room.code, aiMessage);

            roomManager.switchTurn(room.code);

            broadcastRoomUpdate(room);
            break;
          }

          case "end_story": {
            const room = roomManager.getRoomByUserId(userId);
            if (room) {
              roomManager.endStory(room.code);
              broadcastRoomUpdate(room, "story_ended");
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

  function broadcastRoomUpdate(room: any, eventType: string = "room_updated") {
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

  const timerIntervals = new Map<string, NodeJS.Timeout>();

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

      const user1Socket = userSockets.get(user1Id);
      const user2Socket = userSockets.get(user2Id);

      if (user1Socket && user1Socket.readyState === WebSocket.OPEN) {
        const user1Info = roomManager.getRoomInfo(room, user1Id);
        user1Socket.send(
          JSON.stringify({
            type: "room_updated",
            roomInfo: user1Info,
          })
        );
      }

      if (user2Socket && user2Socket.readyState === WebSocket.OPEN) {
        const user2Info = roomManager.getRoomInfo(room, user2Id);
        user2Socket.send(
          JSON.stringify({
            type: "room_updated",
            roomInfo: user2Info,
          })
        );
      }

      if (room.startTime) {
        const elapsed = Math.floor((Date.now() - room.startTime) / 1000);
        if (elapsed >= 600) {
          roomManager.endStory(code);
          broadcastRoomUpdate(room, "story_ended");
          clearInterval(interval);
          timerIntervals.delete(code);
        }
      }
    }, 1000);

    timerIntervals.set(code, interval);
  }

  return httpServer;
}
