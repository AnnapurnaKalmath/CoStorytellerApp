# Design Guidelines: Real-Time Co-Storytelling Web App

## Design Approach
**Reference-Based Approach** drawing from Discord's real-time messaging UX, Netflix's immersive genre selection, Linear's clean typography, and gaming interfaces for atmospheric tension. The design must balance functional chat-like interaction with cinematic storytelling immersion.

## Typography System

### Font Families
- **Primary (Story Content)**: Crimson Pro or Lora (serif) via Google Fonts - for narrative immersion
- **Secondary (UI/Labels)**: Inter or DM Sans - for interface clarity
- **Accent (Ambience Text)**: Space Mono or JetBrains Mono - for atmospheric descriptions

### Type Scale
- **Genre Titles**: text-4xl md:text-5xl font-bold (Primary serif)
- **Story Feed - AI Narration**: text-lg leading-relaxed font-serif italic
- **Story Feed - User Input**: text-base font-sans
- **Ambience Descriptions**: text-sm font-mono tracking-wide uppercase opacity-70
- **Labels/Buttons**: text-sm md:text-base font-medium
- **Timer**: text-xs font-mono tabular-nums

## Layout System

### Spacing Primitives
Use Tailwind units: **2, 4, 6, 8, 12, 16** for consistent rhythm
- Component padding: p-6 to p-8
- Section gaps: space-y-6 to space-y-8
- Tight groupings: gap-2 to gap-4
- Generous breathing room: py-12 to py-16

### Grid Structure
- **Max Container Width**: max-w-6xl for main content, max-w-4xl for story feed
- **Genre Selection**: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- **Form Elements**: Single column, max-w-md centered

## Core Screens & Components

### 1. Entry Screen (Room Code + Gender)
**Layout**: Centered card (max-w-md) on full viewport
- Large heading with app title
- 6-digit room code input (large, monospace, letter-spacing for digits)
- Gender selection: 3 large pill buttons in row (Him/Her/Neutral)
- Join button (full-width, prominent)
- Visual hierarchy: Title → Code Input (hero element) → Gender → CTA

### 2. Genre Selection Screen
**Layout**: Full viewport with genre cards grid
- Top: Selected room code + gender badge (small, top-right)
- Heading: "Choose Your Story"
- **6 Genre Cards**: Each card displays:
  - Genre name (large, bold)
  - Hook text (2-3 lines, serif, leading-relaxed)
  - Starting ambience preview (mono, small, muted)
  - Hover state: subtle elevation
- Cards should feel like movie posters - immersive and inviting
- Grid: 2 columns on tablet, 3 on desktop

### 3. Waiting Screen
**Layout**: Centered content with animation area
- Large status text: "Waiting for partner..."
- Pulsing/animated indicator (CSS animation, not complex)
- Room details card: Code, Genre, Your Gender
- Cancel/Leave button (subtle, bottom)

### 4. Active Story Interface (Main Screen)
**Full Layout Structure**:
```
┌─────────────────────────────────┐
│ Timer Bar (full-width, thin)   │
├─────────────────────────────────┤
│                                 │
│   Story Feed (scrollable)       │
│   - AI messages (centered)      │
│   - User 1 messages (left)      │
│   - User 2 messages (right)     │
│   - Ambience (full-width)       │
│                                 │
├─────────────────────────────────┤
│ Turn Indicator | Input Area     │
└─────────────────────────────────┘
```

**Story Feed Details**:
- **AI Narration Bubbles**: Centered, max-w-2xl, distinguished styling (italic serif, distinct treatment)
- **User Bubbles**: 
  - "You": Aligned right, max-w-lg
  - "Partner": Aligned left, max-w-lg
  - Label with gender pronoun above each
- **Ambience Text**: Full-width strips between story beats, mono font, centered, subtle visual treatment
- Generous spacing between messages (space-y-6)
- Auto-scroll to latest message
- Subtle timestamps (text-xs, muted)

**Timer Bar**:
- Fixed top position, height: h-2
- Progress indicator fills from left to right
- Warning state when <2 minutes (visual treatment change)
- Integrated time remaining text (absolute positioned, right side, text-xs)

**Input Area**:
- Fixed bottom position
- **Turn Indicator**: Clear badge showing "Your Turn" or "Partner's Turn" with appropriate styling
- Large textarea (rows: 3, resize-none)
- Send button integrated (right side of textarea or below)
- Character counter (subtle, small)
- Disabled state when not your turn

**End & Download Button**: 
- Position: Fixed bottom-right or in timer bar area
- Secondary styling, doesn't compete with main input
- Icon + text label

## Component Library

### Buttons
- **Primary CTA**: Large (h-12 to h-14), rounded-lg, font-medium
- **Secondary**: Outline style or muted treatment
- **Pill Buttons** (Gender selection): rounded-full, px-8, py-4, border-2
- All buttons: Active/hover states with subtle scale or opacity

### Cards
- Rounded corners: rounded-xl to rounded-2xl
- Padding: p-6 to p-8
- Border treatment or subtle shadow
- Hover states for interactive cards (genre selection)

### Input Fields
- **Text Input**: Large size (h-12 to h-14), rounded-lg, border, px-4
- **Textarea**: rounded-lg, p-4, border, focus states
- **Room Code Input**: Extra large (h-16), text-center, text-2xl, font-mono, tracking-widest
- Placeholder text styling (muted)

### Badges/Labels
- **Room Code Display**: Rounded badge, font-mono, px-4 py-2
- **Gender Badge**: Pill shape, small text
- **Turn Indicator**: Prominent badge, animated when active turn

### Message Bubbles
- AI: Distinct container (centered, max-w-2xl, special treatment)
- User: Asymmetric (left/right), rounded corners with tail or without, max-w-lg
- Padding: px-6 py-4
- Clear visual distinction between sender types

## Animations & Interactions

**Use Sparingly**:
- Timer bar: Smooth width transition
- Waiting screen: Gentle pulse animation
- New messages: Subtle fade-in
- Turn indicator: Gentle glow/pulse when active
- Button hover: Subtle scale (scale-105) or opacity
- Avoid distracting scroll effects or complex animations

## Images

**No Hero Images Required**: This is a functional, immersive app focused on text-based storytelling. All atmosphere comes from typography, layout, and text ambience descriptions.

**Optional Decorative Elements**:
- Subtle background textures or gradients (not images)
- Genre card backgrounds: Abstract patterns or gradients (not photos)
- Icon library: Heroicons for UI elements (timer, send, download icons)

## Special Considerations

### Atmosphere Through Design
- Use typography weight and size to create tension
- Spacing and layout density varies by story intensity
- Ambience text styling must feel integrated but distinct
- Timer creates visual urgency without being distracting

### Real-Time Feedback
- Clear turn indicators prevent confusion
- Loading states for AI responses
- Typing indicators (subtle, if implemented)
- Connection status (subtle indicator)

### Mobile Responsiveness
- Story feed must work well on mobile (single column)
- Genre cards stack to single column
- Input area remains accessible (fixed bottom)
- Timer remains visible but compact
- Touch-friendly target sizes (min h-12)

### Accessibility
- High contrast for readability
- Focus states for keyboard navigation
- Clear labels for screen readers
- Semantic HTML structure
- ARIA labels for real-time updates

This design creates an immersive storytelling environment that balances the functional needs of real-time collaboration with the atmospheric requirements of narrative engagement. The interface should feel like a private creative space where two people can craft stories together, with the AI as an invisible narrator enriching their shared world.