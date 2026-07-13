import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

let innerModel = null;

const model = new Proxy(
  {},
  {
    get(target, prop) {
      if (!innerModel) {
        const apiKey =
          process.env.GEMINI_API_KEY ||
          process.env.GEMNI_API_KEY ||
          process.env.GOOGLE_API_KEY;
        if (!apiKey) {
          throw new Error(
            "Please set GEMINI_API_KEY or GOOGLE_API_KEY in your environment variables (.env file).",
          );
        }
        innerModel = new ChatGoogleGenerativeAI({
          model: "gemini-3.5-flash",
          apiKey: apiKey,
        });
      }

      const value = Reflect.get(innerModel, prop);
      if (typeof value === "function") {
        return value.bind(innerModel);
      }
      return value;
    },
  },
);

export default model;

export async function testAImodel() {
  try {
    const response = await model.invoke("what is ai explain uder 100 words?");
    console.log("response", response);
  } catch (error) {
    console.error("AI Model Test Failed:", error.message);
  }
}
