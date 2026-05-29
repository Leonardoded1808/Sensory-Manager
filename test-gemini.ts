import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({});
async function run() {
  try {
    const res = await ai.models.generateContent({
       model: 'gemini-3.5-flash',
       contents: { parts: [{text: "Hello"}] }
    });
    console.log(res.text);
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
