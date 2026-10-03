import { NextRequest, NextResponse } from "next/server";

const GROQ_TTS_URL = "https://api.groq.com/openai/v1/audio/speech";
const TTS_MODEL = "canopylabs/orpheus-v1-english";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "no key" }, { status: 503 });
    }
    const { text, voice } = await request.json();
    const cleanText = typeof text === "string" ? text.trim().slice(0, 500) : "";
    if (!cleanText) {
      return NextResponse.json({ error: "no text" }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(GROQ_TTS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: TTS_MODEL,
        input: cleanText,
        voice: voice || "autumn",
        response_format: "wav",
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      return NextResponse.json({ error: "tts failed", detail: errBody }, { status: 502 });
    }

    const audioBuffer = await res.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "tts error" }, { status: 500 });
  }
}
