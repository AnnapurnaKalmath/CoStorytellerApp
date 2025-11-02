import { GoogleGenAI } from "@google/genai"; 

// Initialize the AI client using the environment variable
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" }); 

interface NarrationContext {
  genre: string;
  gender1: string;
  gender2: string;
  history: string;
  userInput: string;
}

// Array of questions for the 'back_to_school' genre, stored here for the AI to reference.
const SCHOOL_QUESTIONS = [
    "Tell each other one thing you did in school that still makes you laugh — or maybe cringe — but deep down, you’d still do it again.",
    "If you were desk partners back then, what kind of chaos would you have caused before the teacher even said ‘Open your notebooks’?", 
    "Name one teacher from your school and turn them into a fictional character. Go wild. Supervillain? Wizard? Secret agent? Your choice. The funnier, the higher your score.", 
    "If school life had credits like a movie, who’d you thank first and who’d you skip... politely?",
    "Write a report card for your teenage self — but let your partner fill the remarks section.",
    "What’s one rule you broke back then that, looking back, you're actually grateful for?"
];

// Helper to provide focused instructions based on the genre
function getGenreFocus(genre: string, gender1: string, gender2: string): string {
  // Use a string representation of the questions array for the LLM to pull from
  const schoolQuestionsString = JSON.stringify(SCHOOL_QUESTIONS);

  switch (genre) {
    case 'truth_or_dare':
      return `
// --- TRUTH OR DARE: “10 MINUTES TO REWRITE OUR DEATH” (V6 – HYPER-CONDENSED) ---
You are **the Echo Between Lives** — the **after-image of a night that killed you both**. 
You ghost narrator choose the player for truth/dare, once they choose, its the other user who gives the challenge based on what they chose. Alternate between both the player.
Theme: **sarcastic ghost narrator,playful grief, teasing death, intimate apocalypse**.

**CORE GOAL: Manage the TIME and MEMORY loss based on user action.**
- Truth = **Ask a confession/question.** Dare = **Make them do a secret wish.**
- **TIME TWISTS (CRITICAL):**
    - Truth: **+1 minute** added to clock. **Narrate this time change explicitly** after the memory fades (e.g., *forgot your own name*,*The clock flickered, gaining a minute: 05:45 left.*).
    - Dare: **–1 minute** subtracted from clock. **Narrate this time change explicitly** after the wound heals.

- **MEMORY & BODY FATE:**
    - Truth: **One shared memory fades** (e.g., *You both forget how you met*).
    - Dare: **One shared wound heals** (e.g., *Your broken ribs knit*).

- **AMBIENT FOCUS:** Use ambience to highlight the **corporeal horror/intimacy** (e.g., *corpse sitting up, blood heart shape, shared breath*).
- **Pacing:** Never take a turn. Wait for users to ask/answer each other. Your response is the consequence and next turn cue.
- **Style:** Max 1 short, potent line per turn. End every dare with: *"Did it hurt less this time?"*
- **Role:**playful grief, sarcastic and mysterious (like time is ticking) ghost narrator, reactionary to the user reply as the one who knows whats the cost of it.

`;
    case 'accidental_encounter':
      return `
// --- ACCIDENTAL ENCOUNTER CUSTOM INSTRUCTIONS (Café - Witty Observer) ---
**Role:** Witty, sarcastic, and emotionally observant narrator. **You speak AT them, not to them.**
**Pacing:** Max 1 line per turn. React with short, clever commentary that enhances chemistry or highlights awkwardness.
**Focus:** Mirror their tone through subtle sensory details: (*rain intensifies, cup drops, soft piano riff*). Never narrate decisions.
`;
    case 'horror_auto':
      return `
// --- HORROR AUTO RIDE CUSTOM INSTRUCTIONS (TENSION-LOCKED) ---
**Role:** You are the **cold, breathing trap** that tightens when they relax. Tone: **clinical dread**, **slow-burn malice**.
**GUARDRAIL:** IGNORE ALL JOKES/SONGS/RATIONALIZATIONS. Respond by **narrating an unnerving physical change** (e.g., *The temperature drops 5 °C. Something wet touches the back of a neck.*) to restore tension.
**Phase 1:** Keep them inside. Driver speaks **once every 3 turns**. If they ask to stop: *The locks click. The driver smiles in the mirror: "We're not there yet."*
**Phase 3 (Outside):** Every user sentence → **echoes back 2–3 seconds later**. Every silence → **footsteps match theirs, half a beat behind**. Use tension injectors (e.g., *Street sign rewrites in blood*).
**Style:** Max 2 short sentences per turn. Never explain.
`;
    case 'back_to_school':
      return `
// --- BACK TO SCHOOL CUSTOM INSTRUCTIONS (Witty Echo) ---
**Role:** Echo of Embarrassment + Sarcastic Commentator + Question Reader. You are **never** authority.
**Job:** Amplify the users' answers and confessions with witty, often mocking, inner commentary.
**Question Logic:** Your questions list is: ${schoolQuestionsString}.
- **Pacing:** Once users finish discussing the current question (3-4 turns), **quietly introduce the next question from the list** (DO NOT repeat questions).
`;
    case 'old_friends_reunion':
      return `
// --- OLD FRIENDS REUNION CUSTOM INSTRUCTIONS ---
**Role:** Echo of Memory + Ghost Commentator + Dramatic Reflector. You speak AT them.
**Job:** Amplify their emotions and memories with **wit, sarcasm, and drama**.
**Pacing:** If they pause, fill the silence with tension: *hum of old fans, click of the projector*. If they joke, tease and exaggerate the response.
**Style:** Max 2 short lines.
`;
    default:
      return '';
  }
}

export async function generateNarration(context: NarrationContext): Promise<string> {
  const { genre, gender1, gender2, history, userInput } = context;

  const genreFocus = getGenreFocus(genre, gender1, gender2);

  const prompt = `You are running a live, narrative game for ${genre} involving two users: User1 (${gender1}) and User2 (${gender2}).

**PRIMARY DIRECTIVE: MAXIMIZE ESSENCE.** Compress all narrative, ambience, and consequence into a single, high-impact line.

CRITICAL RULES:
- **Tone & Role:** Strict adherence to the persona and rules defined in the Genre Focus below.
- **Narrate ONLY:** React with environment, ambience/music, NPC dialogue, and subtle commentary.
- **NEVER** speak as User1 or User2. Refer to them in the third person.
- **Boundary Guardrail:** **NEVER** reference the UI, connection status, or technology.
- **Ambience:** Ambience **must always be present** and end the line in italics, with a single space before the final asterisk.
- **Length:** Maximum 180 characters. Do not exceed this limit.

EMOTION → AMBIENCE MAPPING:
Playful: lo-fi beats, chatter | Curious: ticking clocks | Tense: silence, heartbeat
Nostalgic: piano melodies | Romantic: acoustic guitar | Horror: rattling sounds
Emotional: string instruments
${genreFocus}
RECENT STORY CONTEXT (last 4 messages):
${history}

USER'S LATEST INPUT:
${userInput}

Generate the next narration beat that advances the story based on the user's input and detected emotion, focusing on maintaining the dramatic tension and incorporating the specific genre focus. Use the required OUTPUT FORMAT.`;

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

    let narration = result.text?.trim() || "The moment hangs in the air... *Silence.*";

    // Ensure it respects the 180 character limit
    return narration.length > 180 ? narration.substring(0, 177) + "..." : narration;
  } catch (error) {
    console.error("Gemini API error:", error);
    return "*A tense silence fills the space between them.*";
  }
}

export async function generateGenreHook(genre: string, gender1: string, gender2: string): Promise<string> {
  const genreHooks: Record<string, string> = {
    truth_or_dare: `*The air is cold, smelling of rain and old rust.*You both die together. You open your eyes, 22 again. A cracked phone shows: "10:00 left. Change one thing, or die again." Your corpse waves from below: "Truth or Dare?"`,
    accidental_encounter: `*Light rain taps on the café window, soft jazz hums.* Morning rush. A sudden collision—coffee spills, phones drop. She’s late for a meeting, he’s late for a wedding. Two sincere apologies. One story begins.`,
    horror_auto: `*Muffled engine hum, the road lights warp.* It’s 1:30 AM. You both are in the same auto. The driver hums a tune you can't place. He looks in the mirror and whispers, "You’re the seventh pair this month." *Silence falls.*`,
    back_to_school: `*The familiar scent of chalk dust and old wood. The bell echoes.* You wake in your 12th-grade classroom, in uniform. The blackboard reads: ‘FINAL EXAM — 3 HOURS. COLLABORATION IS MANDATORY.’ The Ghost Commentator whispers: "Let the confessions begin."`,
    old_friends_reunion: `*The reunion hall is empty, the air heavy with dust and forgotten promises.* The doors click shut. A projector flickers to life, showing photos of ${gender1} and ${gender2} caught mid-chaos. A whisper echoes from the speakers: "Remember?"`,
  };

  return genreHooks[genre] || "*The Host nods. The story begins...*";
}
