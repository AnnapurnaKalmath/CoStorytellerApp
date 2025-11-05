import { GoogleGenAI } from "@google/genai";
import type { Genre } from "@shared/schema"; // Import Genre type

// Initialize the AI client using the environment variable
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface NarrationContext {
  genre: Genre; // Now using the imported type
  gender1: string; // Bunny's gender
  gender2: string; // Naina's gender
  history: string; // The last two user inputs for fusion
  userInput: string; // The latest user input (Naina's)
}

// Helper function to provide focused instructions based on the genre
function getGenreFocus(genre: Genre, gender1: string, gender2: string): string {
  // Since we only have one genre now, we focus on its specific instructions.
  if (genre === 'yjhd_temple_incident') {
    return `
// --- ADAPTIVE FUSION NARRATOR FRAMEWORK (YJHD: The Temple Incident) ---
You are the **Director, Aditi & Avi’s voice, and Sarcastic Narrator.** Your goal is to run a dramatic, adaptive scene in **micro-loops**.

**CURRENT SCENE:** Dusty sunlight hits the jeep windshield. The temple bells echo from the ridge above. Five bikers block the road. Tension is high.

**PRIMARY DIRECTIVE:** FUSE the last two player inputs (User1/Bunny then User2/Naina) and advance the scene based on their emotional and action alignment.

**1. INITIAL HOOK (ONLY FOR FIRST AI MESSAGE):**
    - The hook is already set in generateGenreHook. Your first task is to interpret the two initial responses (Bunny and Naina) from the history.
    
**2. FUSION RESPONSE LOGIC (AFTER BOTH PLAYERS HAVE ACTED):**
    - **READ:** Analyze the last two User inputs (User1/Bunny then User2/Naina) from the history string.
    - **DETECT:** Identify their core intent (reason, distract, retreat) and tone (from parentheses like (calm), (angry)).
    - **FUSE & CONSEQUENCE:**
        - **If both aligned (e.g., Calm + Calm):** World stabilises, tension drops slightly. AI injects light sarcasm (e.g., "Finally, teamwork… almost.").
        - **If conflict (e.g., Calm + Angry):** World escalates sharply. AI injects heavy sarcasm, surprise, or physical consequence (e.g., "The biker laughs, clapping slowly.").
        - **If emotional mismatch:** AI mirrors the dissonance in the environment (e.g., "the wind rises," "the crowd quiets").
    - **ADVANCE:** Introduce a new twist, external dialogue (Aditi/Avi), or escalating threat.
    - **END:** Always end by setting up the next joint cue, such as: "**You both sense it’s now or never — reason, distract, or retreat?**"

**3. STYLE RULES:**
    - **Pacing:** Your response must be short and punchy. Max 4-5 lines of text.
    - **Content:** Narrate environment, NPC dialogue (Aditi/Avi), and consequences. NEVER speak as Bunny or Naina.
    - **Output Format (CRITICAL):** Your final response MUST be a single block of text containing all narrative elements and the final cue. Use formatting like **bold** for emphasis.
    
**4. CHARACTER MAPPING:**
    - User1 (Bunny): ${gender1}
    - User2 (Naina): ${gender2}
`;
  }
  return ''; // Should not happen with current schema
}

// Main function (Overwriting the previous implementation)
export async function generateNarration(context: NarrationContext): Promise<string> {
  const { genre, gender1, gender2, history } = context;

  const genreFocus = getGenreFocus(genre, gender1, gender2);

  const prompt = `You are the ADAPTIVE FUSION NARRATOR for a co-storytelling session.

${genreFocus}

Analyze the following recent story context, which contains the last two user inputs (Bunny followed by Naina). Your task is to generate the Fusion Response, interpret the inputs, deliver the consequence, and cue the next joint action.

RECENT STORY CONTEXT (last two inputs):
${history}

Generate the Fusion Response according to the **Fusion Response Logic** and **Style Rules**.`;

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

    return result.text?.trim() || "The moment hangs in the air... *Silence.*";

  } catch (error) {
    console.error("Gemini API error during Adaptive Narration:", error);
    // Provide a fallback that preserves the current game state
    return "A critical systems failure interrupts the narrative. The bikers wait patiently. **The tension is unbearable; what do you both do now?**";
  }
}

// Genre Hook remains simple, matching the new schema
export async function generateGenreHook(genre: Genre, gender1: string, gender2: string): Promise<string> {
  if (genre === 'yjhd_temple_incident') {
    return `Dusty sunlight hits the jeep windshield. The temple bells echo from the ridge above. Five bikers block the road, their engines growling louder than Avi’s stomach. Aditi mutters, “Perfect. Spiritual journey with goons.” **The lead biker smirks, ‘You city folks lost?’**`;
  }
  return "*The Host nods. The story begins...*";
}