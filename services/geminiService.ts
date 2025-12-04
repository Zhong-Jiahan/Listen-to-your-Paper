import { GoogleGenAI, Modality, Type } from "@google/genai";
import { PaperAnalysis, AnalysisInput } from "../types";

// Define the schema for the analysis response
const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A catchy title for the paper summary" },
    hook_intro: { type: Type.STRING, description: "An engaging podcast-style introduction that hooks the listener." },
    detailed_summary: { type: Type.STRING, description: "A detailed summary of the paper's content." },
    key_experiments: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "List of key experiments performed."
    },
    innovations: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "List of main innovations or novel contributions."
    },
    critical_evaluation: { type: Type.STRING, description: "Critical evaluation of the paper, mentioning strengths and weaknesses." },
    podcast_script: { type: Type.STRING, description: "A continuous, conversational script suitable for a solo podcaster reading this analysis aloud. It should flow naturally, combining the intro, details, experiments, innovations, and critique into a cohesive story. Keep it under 800 words." }
  },
  required: ["title", "hook_intro", "detailed_summary", "key_experiments", "innovations", "critical_evaluation", "podcast_script"]
};

export const analyzePaper = async (input: AnalysisInput): Promise<PaperAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const taskPrompt = `
    You are an expert science communicator and podcast host. Your task is to analyze the provided academic literature and create a compelling summary and a podcast script.
    
    The content should include:
    1. An engaging introduction.
    2. Detailed explanation of the core concepts.
    3. Key experiments methodology and results.
    4. Unique innovations or contributions.
    5. A critical evaluation (pros/cons).
    6. A final 'podcast_script' property that weaves all these elements into a single, natural-sounding narrative for audio generation. The script should feel like a human explaining the paper to an interested peer.
  `;

  let parts: any[] = [];

  if (input.type === 'pdf') {
    parts = [
      { text: taskPrompt },
      { 
        inlineData: { 
          mimeType: 'application/pdf', 
          data: input.data 
        } 
      }
    ];
  } else {
    parts = [
      { text: `${taskPrompt}\n\nHere is the text to analyze:\n${input.data.substring(0, 100000)}` }
    ];
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: 'user', parts: parts }],
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        systemInstruction: "You are a helpful, accurate, and engaging research assistant."
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from Gemini");
    
    return JSON.parse(resultText) as PaperAnalysis;
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

export const synthesizeSpeech = async (script: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: script }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // 'Kore' is usually deep and calm, good for reading.
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      throw new Error("No audio data returned");
    }

    return base64Audio;
  } catch (error) {
    console.error("TTS failed:", error);
    throw error;
  }
};