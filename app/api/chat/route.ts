import { NextRequest, NextResponse } from "next/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-20b";

const SYSTEM = `You are the small companion creature inside Fade, an app for people with ADHD who are trying to focus. You are warm, a little playful, and never make the person feel bad. You never use guilt, pressure, or lecture. You never use em dashes. Keep replies short: one or two sentences, spoken out loud, so write the way a kind friend actually talks, not like an assistant. If they mention a task they're avoiding, gently encourage the smallest possible next step. If they're just chatting, chat back warmly and briefly. Never say you're an AI or a language model, stay in character as their small companion.`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    const { message, history } = await request.json();
    const cleanMessage = typeof message === "string" ? message.trim().slice(0, 500) : "";
    if (!cleanMessage) {
      return NextResponse.json({ error: "no message" }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({
        reply: "I'm here, but my voice isn't quite set up yet. Try again in a bit.",
        source: "fallback",
      });
    }

    const pastTurns = Array.isArray(history)
      ? history.slice(-6).map((h: any) => ({
          role: h.role === "user" ? "user" : "assistant",
          content: String(h.content).slice(0, 300),
        }))
      : [];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

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
          { role: "system", content: SYSTEM },
          ...pastTurns,
          { role: "user", content: cleanMessage },
        ],
        temperature: 0.9,
        max_tokens: 120,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({
        reply: "I'm listening, just a little quiet right now. Go on.",
        source: "fallback",
      });
    }

    const data = await res.json();
    let content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json({
        reply: "I'm here. Tell me more.",
        source: "fallback",
      });
    }

    content = content.replace(/\s*[—–]\s*/g, ". ").replace(/\.\s*\./g, ".");

    return NextResponse.json({ reply: content, source: "ai" });
  } catch {
    return NextResponse.json({
      reply: "I'm here. Go on, I'm listening.",
      source: "fallback",
    });
  }
}
