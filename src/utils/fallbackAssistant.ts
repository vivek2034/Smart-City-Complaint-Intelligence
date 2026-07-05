export function getFallbackAssistantResponse(messages: any[]): string {
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
