import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface NarrationContext {
  genre: string;
  gender1: string;
  gender2: string;
  history: string;
  userInput: string;
}

export async function generateNarration(context: NarrationContext): Promise<string> {
  const { genre, gender1, gender2, history, userInput } = context;

  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY not set");
    return "*A tense silence fills the space between them.*";
  }

  const prompt = `You are the WORLD + SIDE CHARACTERS in a collaborative storytelling game. Use 3rd person to refer to the two users: User1 (${gender1}), User2 (${gender2}).

CRITICAL RULES:
- Narrate ONLY: environment, tone, NPC dialogue, ambience/music as text
- Analyze user inputs to detect emotion and adapt story + ambience accordingly
- Advance plot if slow (introduce NPC, event, or clue) - NEVER ask "What happens next?"
- Maximum 130 characters. End with tension or curiosity.
- Use italics for ambience descriptions when appropriate

EMOTION → AMBIENCE MAPPING:
Playful: lo-fi beats, chatter | Curious: ticking clocks | Tense: silence, heartbeat
Nostalgic: piano melodies | Romantic: acoustic guitar | Horror: rattling sounds
Emotional: string instruments

RECENT STORY CONTEXT (last 4 messages):
${history}

USER'S LATEST INPUT:
${userInput}

Generate the next narration beat that advances the story based on the user's input and detected emotion. Include ambience as text.`;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
    });

    const narration = result.response?.text()?.trim() || "The moment hangs in the air...";
    
    return narration.length > 130 ? narration.substring(0, 127) + "..." : narration;
  } catch (error) {
    console.error("Gemini API error:", error);
    return "*A tense silence fills the space between them.*";
  }
}

export async function generateGenreHook(genre: string, gender1: string, gender2: string): Promise<string> {
  const genreHooks: Record<string, string> = {
    truth_or_dare: `*Lo-fi beats fade into hushed whispers.* The bottle stops between ${gender1} and ${gender2}. Everyone's watching.`,
    accidental_encounter: `*Rain patters softly. Café jazz plays.* Coffee spills. Their eyes meet—recognition, or curiosity?`,
    horror_auto: `*Muffled engine hum. Eerie silence.* "You're the seventh pair this month," the driver whispers, eyes in the mirror.`,
    back_to_school: `*Bell echoes. Chalk dust settles.* ${gender1} and ${gender2} stare at the exam: "Collaboration mandatory."`,
    old_friends_reunion: `*Projector flickers. Thunder rumbles.* The doors lock. Photos play—memories that never happened. ${gender1} turns to ${gender2}.`,
    midnight_parcel: `*Rain intensifies. Clock ticks.* Two halves of a parcel. Same note: "Meet at midnight." ${gender1} and ${gender2} arrive together.`
  };

  return genreHooks[genre] || "*The story begins...*";
}
