# CoStory - Real-Time Collaborative Storytelling

## Overview
CoStory is a real-time web application where two people create collaborative stories together with AI-powered narration. Each session lasts 10 minutes, with users taking turns writing dialogue and actions while an AI narrator creates an immersive third-person narrative.

## Current State
**Status**: ✅ MVP Complete & Tested

The application is fully functional with all core features implemented:
- 6-digit room code matching system
- Gender selection (Him/Her/Neutral) for personalized AI narration
- 6 immersive genre options with unique story hooks
- Real-time turn-based storytelling via WebSocket
- AI-powered adaptive narration using Google Gemini
- 10-minute timer with visual countdown
- Story export as downloadable .txt file

## Recent Changes (October 31, 2024)

### Initial Build
- Created complete schema with TypeScript interfaces and Zod validation
- Implemented beautiful frontend with exceptional visual design following design guidelines
- Built WebSocket server with real-time room management
- Integrated Google Gemini AI (gemini-2.5-flash) for adaptive narration
- Implemented turn-based messaging system
- Added 10-minute auto-timer with visual warnings
- Created story download functionality
- Successfully tested end-to-end with two concurrent users

## Project Architecture

### Frontend Stack
- **React** with TypeScript
- **Tailwind CSS** for styling with custom design tokens
- **WebSocket** for real-time communication
- **Wouter** for routing
- **Custom Hooks** for WebSocket state management

### Backend Stack
- **Express.js** server
- **WebSocket (ws)** for real-time messaging
- **Google Gemini AI** (gemini-2.5-flash) for narration
- **In-memory storage** for room management
- **Turn-based logic** with automatic timer expiry

### Design System
- **Primary Font (Story)**: Crimson Pro (serif) - for immersive narrative text
- **Secondary Font (UI)**: Inter - for clean interface elements
- **Accent Font (Ambience)**: Space Mono - for atmospheric descriptions
- **Color Palette**: Custom tokens for AI, user, partner, and ambience messages
- **Responsive Design**: Mobile-first with breakpoints for tablet and desktop

## User Preferences
None documented yet.

## Core Features

### 1. Room Matching System
- Users enter same 6-digit numeric code to match
- Must select same genre to join room
- First user waits, second user activates the story
- Room capacity: exactly 2 users

### 2. Genre Selection (6 Options)
1. **Truth or Dare (Pub)** - Social ritual in a buzzing pub
2. **Accidental Encounter (Café)** - Coffee spill meets cute
3. **Horror Auto Ride** - Late-night mysterious driver
4. **Back to School** - Time-bending classroom mystery
5. **Old Friends Reunion** - Locked hall with fake memories
6. **Midnight Parcel** - Mysterious delivery meeting

### 3. Turn-Based Storytelling
- User 1 always starts first
- Players alternate writing dialogue/actions (max 500 chars)
- AI narrates in third person after each turn (max 130 chars)
- Turn indicator shows whose move it is
- Input disabled when not your turn

### 4. AI Narration
- Uses Google Gemini 2.5 Flash model
- Analyzes user input for emotional tone
- Adapts ambience descriptions based on emotion:
  - Playful → lo-fi beats, chatter
  - Curious → ticking clocks
  - Tense → silence, heartbeat
  - Nostalgic → piano melodies
  - Romantic → acoustic guitar
  - Horror → rattling sounds
- Never speaks as users, only narrates environment and NPCs
- Advances plot when story stalls

### 5. Timer System
- 10 minutes (600 seconds) total
- Starts when second user joins
- Visual progress bar at top
- Red warning when < 2 minutes remaining
- Auto-ends at 0:00

### 6. Story Export
- Download complete story as .txt file
- Format includes all messages: You, Partner, AI, Ambience
- Filename: `costory-{code}-{timestamp}.txt`

## Technical Implementation

### WebSocket Events
**Client → Server:**
- `join_room`: Join/create room with code, gender, genre
- `send_message`: Send user message (enforces turn validation)
- `end_story`: Manually end the story
- `leave_room`: Exit the room

**Server → Client:**
- `room_joined`: Confirmation with room info
- `room_updated`: Real-time updates (messages, timer, turns)
- `ai_thinking`: Indicator that AI is generating
- `story_ended`: Story completed (timer or manual)
- `error`: Validation or system errors

### Room States
1. **Waiting**: First user joined, waiting for partner
2. **Active**: Both users present, story in progress
3. **Ended**: Timer expired or manually ended

### Message Types
- **user**: Player dialogue/actions (shown left/right)
- **ai**: AI narration (centered, italic serif)
- **ambience**: Atmospheric text (full-width, monospace)
- **system**: System notifications

## Environment Variables
- `GEMINI_API_KEY`: Google Gemini API key (required for AI narration)
- `SESSION_SECRET`: Express session secret

## File Structure
```
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx          # Room code, gender, genre selection
│   │   │   ├── Waiting.tsx       # Waiting for partner screen
│   │   │   └── Story.tsx         # Active story interface
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts   # WebSocket connection & events
│   │   ├── App.tsx               # Main app with state routing
│   │   └── index.css             # Custom design tokens
│   └── index.html                # Meta tags, fonts
├── server/
│   ├── routes.ts                 # WebSocket server & event handlers
│   ├── roomManager.ts            # Room state & turn management
│   ├── gemini.ts                 # AI narration integration
│   └── storage.ts                # Placeholder storage interface
├── shared/
│   └── schema.ts                 # TypeScript types & Zod schemas
├── design_guidelines.md          # Complete UI/UX specifications
└── replit.md                     # This file
```

## Development Workflow
1. **Start Application**: `npm run dev` (already configured)
2. **Open in Browser**: Visit the Replit webview
3. **Test with Two Users**: Open app in two different browsers/tabs
4. **Share Room Code**: Both users enter same 6-digit code
5. **Select Matching Genre**: Both must choose the same genre
6. **Begin Storytelling**: Take turns writing and watch AI narrate

## Known Limitations
- Rooms stored in memory (cleared on server restart)
- No persistence of completed stories
- No user authentication
- 10-minute limit is fixed (not configurable)
- Maximum 2 users per room

## Future Enhancements
- Persistent storage for story history
- Customizable timer lengths
- Story gallery showcasing popular stories
- Background music/sound effects
- Story branching visualization
- User profiles and saved stories
- Extended mode for longer sessions

## Testing Notes
✅ Successfully tested with automated E2E tests covering:
- Room creation and matching
- Gender and genre selection
- Turn-based messaging flow
- AI narration generation
- Timer countdown and auto-expiry
- Story download functionality
- WebSocket connection resilience

## Deployment
The application is ready for publishing. Use Replit's built-in deployment to make it live with a public URL.

## Support
For issues or questions, check:
1. Ensure `GEMINI_API_KEY` is set in Replit Secrets
2. Verify both users select the same genre
3. Check browser console for WebSocket connection errors
4. Confirm server logs show successful room creation
