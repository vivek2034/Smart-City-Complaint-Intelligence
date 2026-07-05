import { GoogleGenAI, Type } from "@google/genai";

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY" && key.trim() !== "") {
      geminiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
    }
  }
  return geminiClient;
}

function getFallbackAnalysis(title: string, description: string) {
  const text = (title + " " + description).toLowerCase();
  let category = "Others";
  let severity: "High" | "Medium" | "Low" = "Medium";
  let keywords: string[] = ["smart city", "complaint"];
  let sentiment = "Negative";

  if (text.includes("pothole") || text.includes("road") || text.includes("street") || text.includes("traffic") || text.includes("accident") || text.includes("bridge")) {
    category = "Roads & Traffic";
  } else if (text.includes("garbage") || text.includes("waste") || text.includes("trash") || text.includes("smell") || text.includes("sanitation") || text.includes("dirty") || text.includes("drain")) {
    category = "Sanitation & Waste";
  } else if (text.includes("water") || text.includes("leak") || text.includes("pipe") || text.includes("sewage") || text.includes("drainage")) {
    category = "Water & Sewage";
  } else if (text.includes("power") || text.includes("electricity") || text.includes("blackout") || text.includes("wire") || text.includes("light") || text.includes("street light")) {
    category = "Electricity & Power";
  } else if (text.includes("theft") || text.includes("robbery") || text.includes("crime") || text.includes("danger") || text.includes("safe") || text.includes("police")) {
    category = "Public Safety";
  }

  if (text.includes("urgent") || text.includes("emergency") || text.includes("dangerous") || text.includes("hazard") || text.includes("injury") || text.includes("fatal") || text.includes("flood") || text.includes("fire")) {
    severity = "High";
  } else if (text.includes("slow") || text.includes("dirty") || text.includes("broken") || text.includes("annoy") || text.includes("smelly")) {
    severity = "Medium";
  } else {
    severity = "Low";
  }

  if (text.includes("angry") || text.includes("worst") || text.includes("terrible") || text.includes("fail") || text.includes("useless") || text.includes("disgusting")) {
    sentiment = "Extremely Negative";
  } else if (text.includes("please") || text.includes("help") || text.includes("need") || text.includes("could")) {
    sentiment = "Negative / Concerned";
  } else {
    sentiment = "Neutral / Descriptive";
  }

  const commonWords = ["the", "and", "a", "of", "to", "in", "is", "that", "it", "for", "on", "with", "as", "at", "by", "an", "this", "my", "our", "we", "i"];
  const words = text.replace(/[^\w\s]/g, "").split(/\s+/).filter(w => w.length > 3 && !commonWords.includes(w));
  if (words.length > 0) {
    keywords = Array.from(new Set(words)).slice(0, 5);
  }

  return { category, severity, sentiment, keywords };
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { title, description, image } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: "Title and description are required" });
  }

  const client = getGeminiClient();
  if (!client) {
    console.log("[Vercel API] GEMINI_API_KEY is not configured or placeholder. Falling back to rules.");
    const fallbackResult = getFallbackAnalysis(title, description);
    return res.json({ ...fallbackResult, source: "fallback_rules" });
  }

  try {
    const systemInstruction = `You are a Smart City Complaint Intelligence AI. Your task is to analyze municipal complaints submitted by citizens and classify them.
If an image is attached, inspect it carefully to verify the issue, confirm the correct category and severity, and extract extra context.
You must respond with raw JSON ONLY. The JSON must have exactly these keys:
- category: must be one of ["Roads & Traffic", "Sanitation & Waste", "Water & Sewage", "Electricity & Power", "Public Safety", "Others"]
- severity: must be one of ["High", "Medium", "Low"]
- sentiment: must be a short description of the user's emotional state (e.g. "Frustrated", "Neutral", "Anxious", "Concerned")
- keywords: must be an array of up to 5 relevant tags or keywords extracted from the complaint text and visual evidence`;

    const userPrompt = `Complaint Title: "${title}"
Complaint Description: "${description}"`;

    const contents: any[] = [userPrompt];

    if (image && image.startsWith("data:")) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        contents.push({
          inlineData: {
            mimeType: match[1],
            data: match[2]
          }
        });
      }
    }

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, description: "Category of the complaint" },
            severity: { type: Type.STRING, description: "Severity of the complaint: High, Medium, or Low" },
            sentiment: { type: Type.STRING, description: "Citizen's emotional state or sentiment" },
            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Up to 5 relevant keywords extracted from the complaint"
            }
          },
          required: ["category", "severity", "sentiment", "keywords"]
        }
      }
    });

    const text = response.text || "";
    const parsed = JSON.parse(text);
    return res.json({ ...parsed, source: "gemini_primary" });
  } catch (geminiError: any) {
    console.warn("[Vercel API] Gemini analysis failed, using fallback:", geminiError.message);
    const fallbackResult = getFallbackAnalysis(title, description);
    return res.json({ ...fallbackResult, source: "fallback_rules_error" });
  }
}
