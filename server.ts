import express from "express";
import path from "path";
import axios from "axios";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Mock analysis function to fallback gracefully if NVIDIA_API_KEY is not defined or invalid
function getFallbackAnalysis(title: string, description: string) {
  const text = (title + " " + description).toLowerCase();
  
  let category = "Others";
  let severity: "High" | "Medium" | "Low" = "Medium";
  let keywords: string[] = ["smart city", "complaint"];
  let sentiment = "Negative";

  // Category matching
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

  // Severity matching
  if (text.includes("urgent") || text.includes("emergency") || text.includes("dangerous") || text.includes("hazard") || text.includes("injury") || text.includes("fatal") || text.includes("flood") || text.includes("fire")) {
    severity = "High";
  } else if (text.includes("slow") || text.includes("dirty") || text.includes("broken") || text.includes("annoy") || text.includes("smelly")) {
    severity = "Medium";
  } else {
    severity = "Low";
  }

  // Sentiment matching
  if (text.includes("angry") || text.includes("worst") || text.includes("terrible") || text.includes("fail") || text.includes("useless") || text.includes("disgusting")) {
    sentiment = "Extremely Negative";
  } else if (text.includes("please") || text.includes("help") || text.includes("need") || text.includes("could")) {
    sentiment = "Negative / Concerned";
  } else {
    sentiment = "Neutral / Descriptive";
  }

  // Keywords extraction
  const commonWords = ["the", "and", "a", "of", "to", "in", "is", "that", "it", "for", "on", "with", "as", "at", "by", "an", "this", "my", "our", "we", "i"];
  const words = text
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 3 && !commonWords.includes(w));
  
  if (words.length > 0) {
    keywords = Array.from(new Set(words)).slice(0, 5);
  }

  return { category, severity, sentiment, keywords };
}

import { GoogleGenAI, Type } from "@google/genai";

// Lazy-initialize Gemini client to support zero-config startup and graceful error handling
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

// Backup function using gemini-3.5-flash for structured complaint analysis
async function analyzeWithGemini(title: string, description: string) {
  const client = getGeminiClient();
  if (!client) {
    throw new Error("Gemini API Client could not be initialized (key missing or invalid).");
  }

  const systemInstruction = `You are a Smart City Complaint Intelligence AI. Your task is to analyze municipal complaints submitted by citizens and classify them.
You must respond with raw JSON ONLY. The JSON must have exactly these keys:
- category: must be one of ["Roads & Traffic", "Sanitation & Waste", "Water & Sewage", "Electricity & Power", "Public Safety", "Others"]
- severity: must be one of ["High", "Medium", "Low"]
- sentiment: must be a short description of the user's emotional state (e.g. "Frustrated", "Neutral", "Anxious", "Concerned")
- keywords: must be an array of up to 5 relevant tags or keywords extracted from the complaint text`;

  const userPrompt = `Complaint Title: "${title}"
Complaint Description: "${description}"`;

  const response = await client.models.generateContent({
    model: "gemini-3.5-flash",
    contents: userPrompt,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: {
            type: Type.STRING,
            description: "Category of the complaint"
          },
          severity: {
            type: Type.STRING,
            description: "Severity of the complaint: High, Medium, or Low"
          },
          sentiment: {
            type: Type.STRING,
            description: "Citizen's emotional state or sentiment"
          },
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
  return JSON.parse(text);
}

// Backup function using gemini-3.5-flash for friendly assistant conversation
async function assistantWithGemini(messages: any[], userContext: any): Promise<string> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error("Gemini API Client could not be initialized (key missing or invalid).");
  }

  const systemInstruction = `You are a helpful, smart, and friendly Smart City Complaint Intelligence Assistant named "Civic Assistant AI". 
You are speaking to a user on our Smart City web application.
User details: ID: ${userContext?.id || "unknown"}, Role: ${userContext?.role || "Citizen/Visitor"}.

Your core purpose is to guide them about the portal, explain how our AI automatically determines Category, Severity (High, Medium, Low), Sentiment, and Keywords, assist citizens in tracking and writing helpful complaints, and advise authorities on prioritizations (always act on High-severity safety issues first).

Keep your answers structured, encouraging, professional, and clear. Feel free to use bolding, bullet points, and appropriate emojis to format your answer beautifully. Use markdown formatting if needed. Do not make up fake URLs.`;

  // Map messages to Gemini's { role: 'user' | 'model', parts: [{ text: '...' }] } structure
  const contents = messages.slice(-8).map((m: any) => {
    let role = m.role;
    if (role === "assistant" || role === "system") {
      role = "model";
    }
    return {
      role: role,
      parts: [{ text: m.content || "" }]
    };
  });

  const response = await client.models.generateContent({
    model: "gemini-3.5-flash",
    contents: contents,
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.3
    }
  });

  return response.text || "I am here to support you. Let me know what questions you have about municipal complaints!";
}

// AI Complaint Analysis Route (Using Gemini as primary, NVIDIA NIM as backup, rule-based fallback if offline)
app.post("/api/analyze", async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: "Title and description are required" });
  }

  // 1. Try Gemini Primary Model
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const hasGeminiKey = geminiApiKey && geminiApiKey !== "MY_GEMINI_API_KEY" && geminiApiKey.trim() !== "";

  if (hasGeminiKey) {
    try {
      console.log("[AI API] Invoking Gemini API for Structured Analysis...");
      const parsed = await analyzeWithGemini(title, description);
      return res.json({ ...parsed, source: "gemini_primary" });
    } catch (geminiError: any) {
      console.warn("[AI API] Gemini primary analysis failed, trying NVIDIA NIM backup:", geminiError.message);
    }
  } else {
    console.log("[AI API] GEMINI_API_KEY is not configured or placeholder.");
  }

  // 2. Try NVIDIA NIM Backup Model
  const nvidiaApiKey = process.env.NVIDIA_API_KEY;
  const hasNvidiaKey = nvidiaApiKey && nvidiaApiKey !== "MY_NVIDIA_API_KEY" && nvidiaApiKey.trim() !== "";

  if (hasNvidiaKey) {
    try {
      console.log("[AI API] Sending request to NVIDIA NIM API as backup...");
      const systemPrompt = `You are a Smart City Complaint Intelligence AI. Your task is to analyze municipal complaints submitted by citizens and classify them.
You must respond with raw JSON ONLY. Do not wrap your response in markdown code blocks (such as \`\`\`json). The JSON must have exactly these keys:
- category: must be one of ["Roads & Traffic", "Sanitation & Waste", "Water & Sewage", "Electricity & Power", "Public Safety", "Others"]
- severity: must be one of ["High", "Medium", "Low"]
- sentiment: must be a short description of the user's emotional state (e.g. "Frustrated", "Neutral", "Anxious", "Concerned")
- keywords: must be an array of up to 5 relevant tags or keywords extracted from the complaint text`;

      const userPrompt = `Complaint Title: "${title}"
Complaint Description: "${description}"`;

      const invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
      const headers = {
        "Authorization": `Bearer ${nvidiaApiKey}`,
        "Accept": "application/json",
        "Content-Type": "application/json"
      };

      const payload = {
        "model": "mistralai/mistral-large-3-675b-instruct-2512",
        "messages": [
          { "role": "system", "content": systemPrompt },
          { "role": "user", "content": userPrompt }
        ],
        "max_tokens": 1024,
        "temperature": 0.15,
        "top_p": 1.00,
        "stream": false
      };

      const response = await axios.post(invokeUrl, payload, { headers, timeout: 10000 });
      let content = response.data.choices[0].message.content.trim();
      console.log("[AI API] Raw NVIDIA Response:", content);

      if (content.startsWith("```")) {
        content = content.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      }

      const parsed = JSON.parse(content);
      return res.json({ ...parsed, source: "nvidia_mistral_backup" });
    } catch (nvidiaError: any) {
      console.warn("[AI API] NVIDIA NIM API backup failed:", nvidiaError.message);
    }
  } else {
    console.log("[AI API] NVIDIA_API_KEY is not configured or placeholder.");
  }

  // 3. Last Fallback: Local rule-based processing
  console.log("[AI API] Both AI endpoints unavailable. Using local rule-based analysis.");
  const fallbackResult = getFallbackAnalysis(title, description);
  return res.json({ ...fallbackResult, source: "fallback_rules" });
});

// AI Assistant Chat Route (Gemini primary, NVIDIA NIM backup, Local rule-based fallback)
app.post("/api/assistant", async (req, res) => {
  const { messages, userContext } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  // 1. Try Gemini Primary Model
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const hasGeminiKey = geminiApiKey && geminiApiKey !== "MY_GEMINI_API_KEY" && geminiApiKey.trim() !== "";

  if (hasGeminiKey) {
    try {
      console.log("[Assistant API] Invoking Gemini API as primary for Assistant Conversation...");
      const reply = await assistantWithGemini(messages, userContext);
      return res.json({ reply, source: "gemini_primary" });
    } catch (geminiError: any) {
      console.warn("[Assistant API] Gemini primary assistant failed, trying NVIDIA NIM backup:", geminiError.message);
    }
  } else {
    console.log("[Assistant API] GEMINI_API_KEY is not configured or placeholder.");
  }

  // 2. Try NVIDIA NIM Backup Model
  const nvidiaApiKey = process.env.NVIDIA_API_KEY;
  const hasNvidiaKey = nvidiaApiKey && nvidiaApiKey !== "MY_NVIDIA_API_KEY" && nvidiaApiKey.trim() !== "";

  if (hasNvidiaKey) {
    try {
      console.log("[Assistant API] Sending request to NVIDIA NIM API as backup...");
      const systemInstruction = `You are a helpful, smart, and friendly Smart City Complaint Intelligence Assistant named "Civic Assistant AI". 
You are speaking to a user on our Smart City web application.
User details: ID: ${userContext?.id || "unknown"}, Role: ${userContext?.role || "Citizen/Visitor"}.

Your core purpose is to guide them about the portal, explain how our AI automatically determines Category, Severity (High, Medium, Low), Sentiment, and Keywords, assist citizens in tracking and writing helpful complaints, and advise authorities on prioritizations (always act on High-severity safety issues first).

Keep your answers structured, encouraging, professional, and clear. Feel free to use bolding, bullet points, and appropriate emojis to format your answer beautifully. Use markdown formatting if needed. Do not make up fake URLs.`;

      const apiMessages = [
        { role: "system", content: systemInstruction },
        ...messages.slice(-8) // Send up to last 8 messages for context
      ];

      const invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
      const headers = {
        "Authorization": `Bearer ${nvidiaApiKey}`,
        "Accept": "application/json",
        "Content-Type": "application/json"
      };

      const payload = {
        "model": "mistralai/mistral-large-3-675b-instruct-2512",
        "messages": apiMessages,
        "max_tokens": 1024,
        "temperature": 0.3,
        "top_p": 1.00,
        "stream": false
      };

      const response = await axios.post(invokeUrl, payload, { headers, timeout: 12000 });
      const reply = response.data.choices[0].message.content.trim();
      return res.json({ reply, source: "nvidia_mistral_backup" });
    } catch (nvidiaError: any) {
      console.warn("[Assistant API] NVIDIA NIM API failed:", nvidiaError.message);
    }
  } else {
    console.log("[Assistant API] NVIDIA_API_KEY is not configured or placeholder.");
  }

  // 3. Last Fallback: Local rule-based assistant responses
  console.log("[Assistant API] All cloud AI model methods unavailable. Falling back to rule-based responses.");
  const lastUserMessage = messages[messages.length - 1]?.content || "";
  const lower = lastUserMessage.toLowerCase();
  let reply = "I am here to help you navigate the Smart City Complaint Portal. How can I help you today?";

  if (lower.includes("severity") || lower.includes("decide") || lower.includes("how is")) {
    reply = "Complaint severity is automatically determined by our AI system using advanced NLP! \n\n🔴 **High**: Immediate safety hazards, severe infrastructure collapse, water supply main pipe bursts, or darkness on busy streets.\n🟠 **Medium**: Regular service disruptions like overflowing dumpsters or minor blockages.\n🟢 **Low**: Minor aesthetics or standard repair requests.";
  } else if (lower.includes("categories") || lower.includes("support") || lower.includes("what category")) {
    reply = "We support 6 primary categories:\n1. **Roads & Traffic** (potholes, street lights, blockages)\n2. **Sanitation & Waste** (garbage pileups, dirty spaces)\n3. **Water & Sewage** (leakages, drainage, burst pipes)\n4. **Electricity & Power** (cables, loose wires, power cutouts)\n5. **Public Safety** (dark alleys, broken pedestrian crossings, hazards)\n6. **Others** (miscellaneous civic queries)";
  } else if (lower.includes("track") || lower.includes("how to") || lower.includes("status")) {
    reply = "To track a complaint, navigate to the **Track My Complaints** tab in the Citizen Portal. You'll see a live timeline mapping stages: **Pending ➔ Assigned ➔ Investigation with Resolution Timeline ➔ Resolved**, with technical action plans and live feedback directly from the on-ground engineers.";
  } else if (lower.includes("who handles") || lower.includes("water") || lower.includes("leakage")) {
    reply = "Water leakages are handled with top priority by the **Municipal Water Supply & Sewage Board (BWSSB)**. High-severity pipe bursts are assigned within 2 hours, with mandatory fix timelines given to on-ground crews.";
  } else if (lower.includes("official") || lower.includes("authority")) {
    reply = "Officials can sign in using their official email, password, and department credentials. Once logged in, the portal lists complaints prioritizing High severity, enables assigning them to specific field divisions, and requires setting concrete fix timelines with reasonings.";
  }

  return res.json({ reply, source: "local_assistant_rules" });
});

// Start server and mount Vite dev middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();
