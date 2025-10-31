import { useState, useEffect, useRef, useCallback } from "react";
import { type RoomInfo, type Gender, type Genre } from "@shared/schema";

export function useWebSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket message:", data);

        switch (data.type) {
          case "room_joined":
          case "room_updated":
            setRoomInfo(data.roomInfo);
            setIsAiThinking(false);
            break;
          case "ai_thinking":
            setIsAiThinking(true);
            break;
          case "story_ended":
            setRoomInfo((prev) => prev ? { ...prev, state: "ended" } : null);
            setIsAiThinking(false);
            break;
          case "error":
            console.error("WebSocket error:", data.message);
            setIsAiThinking(false);
            break;
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
      setSocket(null);

      reconnectTimeoutRef.current = setTimeout(() => {
        console.log("Attempting to reconnect...");
        connect();
      }, 3000);
    };

    setSocket(ws);
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, [connect]);

  const joinRoom = useCallback(
    (code: string, gender: Gender, genre: Genre) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "join_room",
            code,
            gender,
            genre,
          })
        );
      }
    },
    [socket]
  );

  const sendMessage = useCallback(
    (content: string) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "send_message",
            content,
          })
        );
        setIsAiThinking(true);
      }
    },
    [socket]
  );

  const endStory = useCallback(() => {
    if (socket && socket.readyState === WebSocket.OPEN && roomInfo) {
      socket.send(
        JSON.stringify({
          type: "end_story",
          roomCode: roomInfo.code,
        })
      );
    }
  }, [socket, roomInfo]);

  const leaveRoom = useCallback(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "leave_room",
        })
      );
    }
    setRoomInfo(null);
  }, [socket]);

  return {
    isConnected,
    roomInfo,
    isAiThinking,
    joinRoom,
    sendMessage,
    endStory,
    leaveRoom,
  };
}
