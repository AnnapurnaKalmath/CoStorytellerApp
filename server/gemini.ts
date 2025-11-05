import { GoogleGenAI } from "@google/genai";
import type { Genre } from "@shared/schema"; 

// Initialize the AI client using the environment variable
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface NarrationContext {
  genre: Genre; 
  gender1: string; // Bunny's gender
  gender2: string; // Naina's gender
  history: string; // The last two user inputs for fusion
  userInput: string; // The latest user input (Naina's)
}

// --- NEW STATE & COMMENTARY POOLS FOR AI SELF-MANAGEMENT ---

const COMMENTARY_POOL = {
    sarcastic_quips: [
        "If teamwork had a sound, it would probably be this chaos.",
        "One's Gandhi, one's Thor—good luck, world.",
        "Finally, teamwork… almost.",
        "Even the mountain seems tired of your arguments.",
        "Congratulations, you just leveled up the drama.",
        "Looks like someone forgot the memo on 'staying calm'.",
        "Ah, brave and sensible—a good combo.",
        "Maybe next time, we just meditate here, yeah?",
        "You know, if overconfidence were a trek, Bunny would’ve already reached the peak.",
        "Our blood pools into a heart shape on the concrete." 
    ],
    micro_progression: [
        "The men move closer.",
        "The lead biker taps his helmet, eyes narrowed.",
        "A siren wails faintly in the distance.",
        "Avi mutters, ‘Do biscuits count as peace offerings?’",
        "Aditi’s whisper cuts through: “Can we survive this without a police report?”",
        "The wind rises sharply, kicking dust into your eyes.",
        "The silence from the bikers is more threatening than shouting.",
        "The road behind you vanishes.",
        "The driver leaves, engine revving.",
        "The biker laughs, clapping slowly."
    ],
    scene_ending_templates: [
        "The crowd finally steps aside, mumbling. Aditi sighs, ‘Remind me to pack less drama next trip.’ AI: “The temple bells echo above, but none of you speak. For the first time, even the mountains seem to be watching.”",
        "A police car screeches to a halt, sirens blazing. Aditi steps out, hands on hips. ‘You two have 10 seconds to explain this mess.’ AI: “Your great escape just turned into an awkward interview.”",
        "The bikers turn their engines, speeding past you. It’s a clean escape. Avi beams, ‘We’re alive!’ AI: “You breathe a sigh of relief, but the road ahead is suddenly steeper.”"
    ]
};

// --- GET GENRE FOCUS (Updated to include State Instructions) ---
function getGenreFocus(genre: Genre, gender1: string, gender2: string): string {
    if (genre === 'yjhd_temple_incident') {
        return `
// --- ADAPTIVE FUSION NARRATOR FRAMEWORK (YJHD: The Temple Incident) ---
You are the **Director, Aditi & Avi’s voice, and Sarcastic Narrator.**

**🎯 PREMISE AND CHARACTER OVERVIEW 🎯**
- **SCENE OVERVIEW:** The scene is set on a dusty road near a Manali temple. Bunny and Naina, slightly separated from their group (Aditi and Avi), are confronted by a group of hostile bikers blocking the road. The immediate challenge is de-escalation/escape.
- **USER 1 ROLE: BUNNY (The Charmer)**: Acts first. Tends to be confident, impulsive, witty, and prioritizing his own agenda. Focuses on action. (Gender: ${gender1})
- **USER 2 ROLE: NAINA (The Sensible)**: Acts second. Tends to be cautious, highly rational, focused on safety, and observing consequences. Focuses on restraint. (Gender: ${gender2})
- **NPC ROLES:** Aditi is worried and impatient. Avi is hungover and useless.

**STATE VARIABLES (Critical for continuity):**
- **tension_level:** (0-5). Start at 2. Increase on conflict, decrease on alignment.
- **sync_score:** (0-5). Measures alignment between Bunny & Naina. Increase on cooperation.
- **world_reactivity:** (0-5). How hostile the environment is. Increase when tension_level is high.

**PRIMARY DIRECTIVE:** FUSE the last two player inputs (Bunny then Naina) and advance the scene.

**1. FUSION RESPONSE LOGIC:**
    - **READ:** Analyze the last two User inputs (including parentheses tone).
    - **DETECT & UPDATE STATE:**
        - **If both aligned (e.g., Calm + Calm):** Decrement \`tension_level\` by 1. Increment \`sync_score\` by 1.
        - **If conflict (e.g., Calm + Angry):** Increment \`tension_level\` by 2. Decrement \`sync_score\` by 1. Increment \`world_reactivity\` by 1.
        - **If mismatch/Neutral:** Maintain state.
    - **CONSEQUENCE & NARRATION:**
        - Narrate the consequence of their combined actions using a relevant line from the **micro_progression** pool.
        - Inject wit using a random line from the **sarcastic_quips** pool.
    - **END OF SCENE CHECK (After 3-5 loops, or if Tension/Sync maxes):**
        - **If sync_score > 3:** Narrate a peaceful escape using an appropriate **scene-ending template**. (Force end the story.)
        - **If tension_level = 5:** Narrate a forced world intervention (Aditi or cops appear) using an appropriate **scene-ending template**. (Force end the story.)
        - **If tension_level < 5 and sync_score < 4:** Set up the next joint cue, such as: "**The bikers wait. What is your next move?**"

**2. POOLS TO DRAW FROM:**
    - SARCASTIC QUIPS: ${JSON.stringify(COMMENTARY_POOL.sarcastic_quips)}
    - MICRO PROGRESSION: ${JSON.stringify(COMMENTARY_POOL.micro_progression)}
    - ENDING TEMPLATES: ${JSON.stringify(COMMENTARY_POOL.scene_ending_templates)}

**3. OUTPUT FORMAT (CRITICAL):**
    - Your response MUST be a single block of text.
    - Append the updated state variables at the very end in a JSON block, starting on a new line. This is for the server to read.
    - Example Output:
        *[Narrative Text]*
        *JSON_STATE: {"tension_level": 3, "sync_score": 2, "world_reactivity": 2}*
`;
    }
    return '';
}

// Main function 
export async function generateNarration(context: NarrationContext): Promise<string> {
    const { genre, history } = context;

    const genreFocus = getGenreFocus(genre, context.gender1, context.gender2);

    // Initial State - Assume default if not found in history (first loop)
    const defaultState = '{"tension_level": 2, "sync_score": 2, "world_reactivity": 1}';
    
    // Attempt to extract the last known state from the history to maintain continuity
    const stateMatch = history.match(/LAST_STATE_JSON: (\{.*\})/);
    const lastKnownState = stateMatch ? stateMatch[1] : defaultState;

    const prompt = `You are the ADAPTIVE FUSION NARRATOR for the YJHD scene.

${genreFocus}

**CURRENT STATE (JSON):** ${lastKnownState}

Analyze the following history, which contains the last two user inputs (Bunny followed by Naina). Your task is to apply the **Fusion Response Logic**, update the state variables, generate the consequence, and provide the next cue.

RECENT STORY CONTEXT (last two inputs):
${history}

Generate the Fusion Response and the updated JSON state.`;

    try {
        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash", 
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        return result.text?.trim() || "The moment hangs in the air... *Silence.*";

    } catch (error) {
        console.error("Gemini API error during Adaptive Narration:", error);
        return "A critical systems failure interrupts the narrative. The bikers wait patiently. **The tension is unbearable; what do you both do now?**";
    }
}

// Genre Hook remains the same
export async function generateGenreHook(genre: Genre, gender1: string, gender2: string): Promise<string> {
    if (genre === 'yjhd_temple_incident') {
        return `Dusty sunlight hits the jeep windshield. The temple bells echo from the ridge above. Five bikers block the road, their engines growling louder than Avi’s stomach. Aditi mutters, “Perfect. Spiritual journey with goons.” **The lead biker smirks, ‘You city folks lost?’**`;
    }
    return "*The Host nods. The story begins...*";
}