import { GoogleGenAI } from "@google/genai";

let innerAI = null;

const getAIInstance = () => {
  if (!innerAI) {
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GEMNI_API_KEY ||
      process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Please set GEMINI_API_KEY or GOOGLE_API_KEY in your environment variables (.env file).",
      );
    }
    innerAI = new GoogleGenAI({ apiKey });
  }
  return innerAI;
};

/**
 *
 * @param {string} prompt
 * @param {number} count
 * @param {string} aspectRatio
 * @returns {Promise<Array<string>>}
 */
export async function generateImagesFromPrompt(
  prompt,
  count = 4,
  aspectRatio = "1:1",
) {
  try {
    console.log(
      `[Imagen Service] Attempting to generate image via Google GenAI for prompt: "${prompt}"`,
    );
    const ai = getAIInstance();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: `Generate an image of: ${prompt}`,
    });

    const candidate = response.candidates?.[0];
    const part = candidate?.content?.parts?.find(
      (p) => p.inlineData || p.fileData,
    );
    if (part && part.inlineData) {
      const mimeType = part.inlineData.mimeType || "image/png";
      const base64 = part.inlineData.data;
      return [`data:${mimeType};base64,${base64}`];
    }

    throw new Error("No inline image data returned from Gemini model.");
  } catch (error) {
    console.warn(
      `[Imagen Service] Google GenAI generation failed: ${error.message}. Falling back to free Pollinations AI generator.`,
    );

    const images = [];
    const width =
      aspectRatio === "16:9" ? 1024 : aspectRatio === "9:16" ? 576 : 1024;
    const height =
      aspectRatio === "16:9" ? 576 : aspectRatio === "9:16" ? 1024 : 1024;

    for (let i = 0; i < count; i++) {
      const seed = Math.floor(Math.random() * 1000000) + i;
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&private=true`;

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString("base64");
        images.push(`data:image/jpeg;base64,${base64}`);
      } catch (fetchErr) {
        console.error(
          `[Imagen Service] Fallback failed for image ${i + 1}:`,
          fetchErr.message,
        );
      }
    }

    if (images.length === 0) {
      throw new Error(
        "Failed to generate images using both Google GenAI and fallback service.",
      );
    }

    return images;
  }
}
