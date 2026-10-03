import { NextRequest, NextResponse } from "next/server";
import { suggestFirstStep } from "@/lib/suggest";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-20b";

const FIRST_STEP_SYSTEM = `You coach people with ADHD on task initiation. Given a task they're avoiding, reply with exactly ONE tiny, concrete, physical first action that takes under 2 minutes and requires almost no decision-making. Plain, warm, short. No guilt, no "just do it" energy, no em dashes. Reply with ONLY the step itself, one sentence, no quotes, no preamble, no numbering.`;

const BREAKDOWN_SYSTEM = `You coach people with ADHD on task initiation. Given a task they're avoiding, break it into 3 to 5 tiny, concrete, sequential steps, each small enough to feel almost too easy. Plain, warm, short sentences. No guilt. Never use em dashes. Reply with ONLY a JSON array of strings, nothing else, no markdown fences, no explanation. Example: ["Open the document", "Write one messy sentence", "Read it back once"]`;

async function callGroq(system: string, task: string, maxTokens: number) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        reasoning_effort: "low",
        messages: [
          { role: "system", content: system },
          { role: "user", content: task },
        ],
        temperature: 0.8,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    return content || null;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { task, mode } = await request.json();
    const cleanTask = typeof task === "string" ? task.trim().slice(0, 300) : "";

    if (!cleanTask) {
      return NextResponse.json({ error: "No task provided" }, { status: 400 });
    }

    if (mode === "breakdown") {
      const raw = await callGroq(BREAKDOWN_SYSTEM, cleanTask, 200);
      if (raw) {
        try {
          const jsonMatch = raw.match(/\[[\s\S]*\]/);
          const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const steps = parsed
              .filter((s) => typeof s === "string" && s.trim())
              .slice(0, 5)
              .map((s: string) => s.replace(/\s*[—–]\s*/g, ". ").replace(/\.\s*\./g, ".").trim());
            if (steps.length > 0) {
              return NextResponse.json({ steps, source: "ai" });
            }
          }
        } catch {
          // fall through to heuristic
        }
      }
      return NextResponse.json({
        steps: [suggestFirstStep(cleanTask), "Do the next small thing", "Check in with yourself"],
        source: "heuristic",
      });
    }

    const raw = await callGroq(FIRST_STEP_SYSTEM, cleanTask, 60);
    if (raw) {
      const cleaned = raw
        .replace(/^["']|["']$/g, "")
        .replace(/\s*[—–]\s*/g, ". ")
        .replace(/\.\s*\./g, ".")
        .trim();
      if (cleaned.length > 0 && cleaned.length < 200) {
        return NextResponse.json({ step: cleaned, source: "ai" });
      }
    }
    return NextResponse.json({ step: suggestFirstStep(cleanTask), source: "heuristic" });
  } catch {
    return NextResponse.json({ step: suggestFirstStep(""), source: "heuristic" });
  }
}
