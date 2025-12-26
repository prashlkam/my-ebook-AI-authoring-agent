
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { AuthorPersona, Chapter, EbookProject } from "../types";

// Always initialize GoogleGenAI with process.env.API_KEY directly as per guidelines
export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const scrapeAuthorIdentity = async (name: string, handles: string): Promise<string> => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Research and summarize the professional identity and writing style of an author named "${name}" with these social handles: "${handles}". Use your internal knowledge and grounding tools.`,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });
  return response.text || "No information found.";
};

export const generateMasterPlan = async (theme: string, persona: AuthorPersona): Promise<Partial<EbookProject>> => {
  const ai = getGeminiClient();
  const prompt = `Act as a Master Ebook Architect. Create a master plan for an ebook about "${theme}". 
  Author Voice Context: ${persona.writingStyle}. 
  Author Background: ${persona.professionalHistory}.
  Return a JSON object containing: title, subtitle, targetAudience, and a list of 10 chapters (each with title and a 50-word overview).`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          subtitle: { type: Type.STRING },
          targetAudience: { type: Type.STRING },
          chapters: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                overview: { type: Type.STRING }
              },
              required: ['title', 'overview']
            }
          }
        },
        required: ['title', 'subtitle', 'targetAudience', 'chapters']
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const draftChapter = async (
  chapter: Chapter, 
  persona: AuthorPersona, 
  project: EbookProject,
  runningSummary: string
): Promise<{ content: string; summary: string }> => {
  const ai = getGeminiClient();
  const prompt = `Draft Chapter ${chapter.number}: "${chapter.title}" for the book "${project.title}".
  
  CONTEXT:
  - Author Voice: ${persona.writingStyle}
  - Author Identity: ${persona.professionalHistory}
  - Book Theme: ${project.theme}
  - Chapter Goal: ${chapter.overview}
  - User Specific Pointers: ${chapter.pointers}
  - Context from previous chapters: ${runningSummary}
  
  INSTRUCTIONS:
  Write a full-length, engaging chapter (at least 1500 words). Use "Chain of Thought" to structure the arguments. 
  Maintain the author's consistent voice. 
  After the chapter, provide a 100-word summary of what occurred in this chapter for future context.
  Return as JSON with 'content' (Markdown) and 'summary'.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          content: { type: Type.STRING },
          summary: { type: Type.STRING }
        },
        required: ['content', 'summary']
      }
    }
  });

  const data = JSON.parse(response.text || '{}');
  return {
    content: data.content || "Error generating content.",
    summary: data.summary || ""
  };
};

export const checkPlagiarism = async (content: string): Promise<{ score: number; report: string }> => {
  const ai = getGeminiClient();
  const prompt = `Analyze the following text for plagiarism, AI-likeness, and common AI tropes (e.g., "In the rapidly evolving landscape...").
  Return a JSON object with:
  - score: integer from 0 to 100 (where 100 is highly suspicious/AI-like)
  - report: a brief summary of detected issues or "Clean" if no issues.
  
  Text: "${content.substring(0, 5000)}"`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER },
          report: { type: Type.STRING }
        },
        required: ['score', 'report']
      }
    }
  });

  return JSON.parse(response.text || '{"score": 0, "report": "Error checking"}');
};

export const humanizeChapter = async (content: string): Promise<string> => {
  const ai = getGeminiClient();
  const prompt = `Rewrite the following text to sound more human-written. 
  - Vary sentence structure.
  - Remove common AI cliches and filler.
  - Maintain the original meaning and length.
  - Ensure it bypasses common AI detectors.
  
  Text: "${content}"`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt
  });

  return response.text || content;
};

export const tweakBlock = async (text: string, instruction: string): Promise<string> => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Modify the following text based on this instruction: "${instruction}". 
    Text: "${text}"
    Return only the modified text.`
  });
  return response.text || text;
};

export const generateCover = async (prompt: string): Promise<string> => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `A professional ebook cover art for: ${prompt}. Minimalist, high-quality, professional typography style.` }]
    },
    config: {
      imageConfig: { aspectRatio: '3:4' }
    }
  });

  let imageUrl = "";
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
  }
  return imageUrl;
};

export const generateTTS = async (text: string): Promise<string> => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Narrate the following chapter professionally: ${text.substring(0, 1000)}...` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio ? `data:audio/pcm;base64,${base64Audio}` : '';
};
