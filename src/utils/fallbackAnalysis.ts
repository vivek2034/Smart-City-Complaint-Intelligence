export function getFallbackAnalysis(title: string, description: string) {
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
