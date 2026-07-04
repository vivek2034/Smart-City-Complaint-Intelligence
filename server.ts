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

// AI Complaint Analysis Route (Using Mistral-Large-3-675b-instruct on Nvidia NIM)
app.post("/api/analyze", async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: "Title and description are required" });
  }

  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey || apiKey === "MY_NVIDIA_API_KEY" || apiKey.trim() === "") {
    console.log("[AI API] NVIDIA_API_KEY is not set. Using local rule-based analysis fallback.");
    const fallbackResult = getFallbackAnalysis(title, description);
    return res.json({ ...fallbackResult, source: "fallback_rules" });
  }

  try {
    const systemPrompt = `You are a Smart City Complaint Intelligence AI. Your task is to analyze municipal complaints submitted by citizens and classify them.
You must respond with raw JSON ONLY. Do not wrap your response in markdown code blocks (such as \`\`\`json). The JSON must have exactly these keys:
- category: must be one of ["Roads & Traffic", "Sanitation & Waste", "Water & Sewage", "Electricity & Power", "Public Safety", "Others"]
- severity: must be one of ["High", "Medium", "Low"]
- sentiment: must be a short description of the user's emotional state (e.g. "Frustrated", "Neutral", "Anxious", "Concerned")
- keywords: must be an array of up to 5 relevant tags or keywords extracted from the complaint text

Example JSON Output:
{
  "category": "Roads & Traffic",
  "severity": "High",
  "sentiment": "Frustrated",
  "keywords": ["pothole", "accident", "broken road", "damage"]
}`;

    const userPrompt = `Complaint Title: "${title}"
Complaint Description: "${description}"`;

    const invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
    const headers = {
      "Authorization": `Bearer ${apiKey}`,
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
      "frequency_penalty": 0.00,
      "presence_penalty": 0.00,
      "stream": false
    };

    console.log("[AI API] Sending request to NVIDIA NIM API...");
    const response = await axios.post(invokeUrl, payload, { headers, timeout: 10000 });
    
    let content = response.data.choices[0].message.content.trim();
    console.log("[AI API] Raw Response content:", content);

    // Strip any markdown codeblock backticks if the model ignores system prompt
    if (content.startsWith("```")) {
      content = content.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    try {
      const parsed = JSON.parse(content);
      return res.json({ ...parsed, source: "nvidia_mistral" });
    } catch (parseError) {
      console.error("[AI API] Failed to parse JSON response from LLM:", content);
      // Fallback if parsing fails
      const fallbackResult = getFallbackAnalysis(title, description);
      return res.json({ ...fallbackResult, source: "nvidia_mistral_parse_fallback" });
    }
  } catch (error: any) {
    console.error("[AI API] Error during Nvidia API invocation:", error.message);
    const fallbackResult = getFallbackAnalysis(title, description);
    return res.json({ ...fallbackResult, source: "api_error_fallback" });
  }
});

// AI Assistant Chat Route (Conversational Assistant for Citizens and Officials)
app.post("/api/assistant", async (req, res) => {
  const { messages, userContext } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey || apiKey === "MY_NVIDIA_API_KEY" || apiKey.trim() === "") {
    // Generate a helpful rule-based assistant response if API key is not set
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
  }

  try {
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
      "Authorization": `Bearer ${apiKey}`,
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

    console.log("[Assistant API] Sending request to NVIDIA NIM API...");
    const response = await axios.post(invokeUrl, payload, { headers, timeout: 12000 });
    const reply = response.data.choices[0].message.content.trim();
    
    return res.json({ reply, source: "nvidia_mistral" });
  } catch (error: any) {
    console.error("[Assistant API] Error during Nvidia API invocation:", error.message);
    return res.json({ 
      reply: "I am having some connection delays, but I can assure you that all complaints are logged securely in our Firestore databases. High-severity issues are dispatched to repair authorities within 12 hours.",
      source: "api_error_fallback" 
    });
  }
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
