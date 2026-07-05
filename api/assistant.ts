import { GoogleGenAI } from "@google/genai";

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

function getFallbackAssistantResponse(messages: any[]): string {
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

  return reply;
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

  const { messages, userContext } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  const client = getGeminiClient();
  if (!client) {
    console.log("[Vercel API] GEMINI_API_KEY is not configured or placeholder. Falling back to rules.");
    const reply = getFallbackAssistantResponse(messages);
    return res.json({ reply, source: "local_assistant_rules" });
  }

  try {
    const systemInstruction = `You are a helpful, smart, and friendly Smart City Complaint Intelligence Assistant named "Civic Assistant AI". 
You are speaking to a user on our Smart City web application.
User details: ID: ${userContext?.id || "unknown"}, Role: ${userContext?.role || "Citizen/Visitor"}.

Your core purpose is to guide them about the portal, explain how our AI automatically determines Category, Severity (High, Medium, Low), Sentiment, and Keywords, assist citizens in tracking and writing helpful complaints, and advise authorities on prioritizations (always act on High-severity safety issues first).

Keep your answers structured, encouraging, professional, and clear. Feel free to use bolding, bullet points, and appropriate emojis to format your answer beautifully. Use markdown formatting if needed. Do not make up fake URLs.`;

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
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3
      }
    });

    const reply = response.text || "I am here to support you. Let me know what questions you have about municipal complaints!";
    return res.json({ reply, source: "gemini_primary" });
  } catch (geminiError: any) {
    console.warn("[Vercel API] Gemini assistant failed, using fallback:", geminiError.message);
    const reply = getFallbackAssistantResponse(messages);
    return res.json({ reply: `*(Vercel Offline Assistant)*\n\n${reply}`, source: "local_assistant_rules_error" });
  }
}
