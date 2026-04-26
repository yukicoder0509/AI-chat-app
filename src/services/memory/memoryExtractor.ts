import type { Message } from "../../types/chat";
import type { MemoryEntry } from "../../types/memory";

const EXTRACTION_PROMPT = `You are a memory extraction assistant. Given a conversation exchange and a list of facts already known about the user, extract up to 5 NEW, discrete, memorable facts about the user (preferences, identity, context, goals, constraints) that are NOT already covered by the known facts. Return ONLY a JSON array of strings, each being a concise fact. Example: ["User's name is Alex", "User works on Rust microservices"]. If there are no new memorable facts, return an empty array [].`;

function generateId(): string {
  return `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function extractFacts(
  lastExchange: Message[],
  credentials: { apiKey: string; apiUrl: string },
  model: string,
  existingFacts: string[] = [],
): Promise<MemoryEntry[]> {
  try {
    const knownBlock =
      existingFacts.length > 0
        ? `Already known facts:\n${existingFacts.map((f) => `- ${f}`).join("\n")}\n\n`
        : "Already known facts: none\n\n";

    const exchangeText = lastExchange
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const userContent = `${knownBlock}New conversation exchange:\n${exchangeText}`;

    const response = await fetch(`${credentials.apiUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${credentials.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: EXTRACTION_PROMPT },
          { role: "user", content: userContent },
        ],
        temperature: 0.3,
        max_tokens: 300,
        stream: false,
      }),
    });

    if (!response.ok) return [];

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";

    // Extract JSON array from the response
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return [];

    const facts: unknown = JSON.parse(match[0]);
    if (!Array.isArray(facts)) return [];

    const now = Date.now();
    return (facts as unknown[])
      .filter((f): f is string => typeof f === "string" && f.trim().length > 0)
      .slice(0, 5)
      .map((fact) => ({
        id: generateId(),
        fact: fact.trim(),
        sourceConversationId: "",
        createdAt: now,
        updatedAt: now,
      }));
  } catch {
    return [];
  }
}
