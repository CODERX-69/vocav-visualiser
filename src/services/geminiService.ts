import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "dummy" });
export interface WordDetails {
  word: string;
  phonetic: string;
  meaning: string;
  examples: string[];
  synonyms: string[];
}

export async function getWordDetails(word: string): Promise<WordDetails> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Provide the detailed meaning, usage examples, synonyms, and phonetic pronunciation for the word '${word}'.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          phonetic: { type: Type.STRING, description: "Phonetic spelling, e.g., /əˈbændən/" },
          meaning: { type: Type.STRING, description: "Detailed meaning of the word." },
          examples: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 usage examples." },
          synonyms: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 synonyms." },
        },
        required: ["word", "phonetic", "meaning", "examples", "synonyms"],
      },
    },
  });

  const jsonStr = response.text?.trim() || "{}";
  return JSON.parse(jsonStr) as WordDetails;
}

export async function getWordImage(word: string): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `A clear, high-quality, educational illustration representing the meaning of the word '${word}'. The image should visually elaborate on the concept without containing any text.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/jpeg;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Error generating image:", error);
  }
  return null;
}

export async function getWordAudio(word: string): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say clearly: ${word}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return base64Audio;
    }
  } catch (error) {
    console.error("Error generating audio:", error);
  }
  return null;
}
