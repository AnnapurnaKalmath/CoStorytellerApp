# CoStory - Real-Time Collaborative Storytelling App

## Overview

CoStory is a real-time collaborative storytelling web application where two users create narratives together with AI-powered narration. Users join via 6-digit room codes, select character genders and story genres, then take turns writing dialogue and actions while an AI narrator (Google Gemini) adapts the story based on their inputs and detected emotions. Each story session lasts 10 minutes, featuring turn-based gameplay with atmospheric ambience descriptions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React with TypeScript using Vite as the build tool
- Client-server monorepo structure with shared TypeScript schemas
- SPA (Single Page Application) with client-side routing handled through component state

**UI Component System**
- Shadcn/ui component library with Radix UI primitives
- Tailwind CSS for styling with custom design tokens
- Three-tier typography system:
  - Serif fonts (Crimson Pro/Lora) for narrative content
  - Sans-serif (Inter/DM Sans) for UI elements  
  - Monospace (Space Mono/JetBrains Mono) for atmospheric text
- Custom color scheme with story-specific colors for AI, user, partner, and ambience messages

**State Management**
- React Query (@tanstack/react-query) for server state
- Local component state for UI interactions
- Custom WebSocket hook (useWebSocket) for real-time communication

**Page Flow**
1. Home: Room code entry → Gender selection → Genre selection
2. Waiting: Waiting room for second player to join
3. Story: Active storytelling interface with turn-based input and real-time message feed

### Backend Architecture

**Runtime & Framework**
- Node.js with Express.js
- TypeScript with ESM module system
- WebSocket server using 'ws' library (not Socket.io despite initial requirements)

**Session Management**
- In-memory room management (RoomManager class)
- No persistent database - rooms exist only during active sessions
- Session storage using connect-pg-simple (configured but may not be actively used given in-memory approach)

**Real-Time Communication**
- WebSocket protocol for bidirectional client-server communication
- Message types: join_room, send_message, room_joined, room_updated, ai_thinking, story_ended, error
- Room state synchronization between connected users

**Room Lifecycle**
- Rooms created on first user join with 6-digit code
- Second user with matching code and genre joins to start 10-minute timer
- Turn-based message flow: User1 → AI → User2 → AI (continues)
- Automatic room cleanup on timer expiration or manual story end

**AI Narration System**
- Google Gemini API (gemini-1.5-flash model) via @google/genai
- Context-aware prompting with:
  - Genre and gender information
  - Recent message history (last 4 messages)
  - Emotion detection from user inputs
  - Ambience adaptation based on detected emotions
- 130-character narration limit
- Third-person perspective only (never speaks as users)

### External Dependencies

**AI Service**
- Google Gemini API (gemini-1.5-flash)
- Purpose: Generate context-aware story narration, detect emotions, adapt ambience
- Authentication: API key via GEMINI_API_KEY environment variable

**Database**
- PostgreSQL via @neondatabase/serverless and Drizzle ORM
- Schema defined but implementation appears minimal - primary storage is in-memory
- Migration system configured via Drizzle Kit
- Note: User table schema exists in shared/schema.ts but may not be actively used

**WebSocket Communication**
- 'ws' library for WebSocket server implementation
- Real-time bidirectional communication for story collaboration
- Separate connection per user with userId-to-socket mapping

**UI Component Libraries**
- Radix UI primitives for accessible component foundations
- Shadcn/ui configuration with "new-york" style variant
- Comprehensive component set (dialogs, buttons, forms, etc.)

**Development Tools**
- Vite with React plugin and HMR
- Replit-specific plugins for error overlay and development banner
- TypeScript with strict mode enabled

**Genre System**
Six predefined story genres with hooks and ambience patterns:
1. Truth or Dare (Pub) - lo-fi beats, pub atmosphere
2. Accidental Encounter (Café) - rain, café jazz
3. Horror Auto Ride - muffled hum, bass rumble
4. Back to School - bell echo, nostalgic piano
5. Old Friends Reunion - projector flicker, strings
6. Midnight Parcel - rain, ticking clock, synth

**Emotion-to-Ambience Mapping**
AI detects emotions and adapts ambience accordingly:
- Playful → lo-fi beats, chatter
- Curious → ticking clocks
- Tense → silence, heartbeat
- Nostalgic → piano melodies
- Romantic → acoustic guitar
- Horror → rattling sounds
- Emotional → string instruments