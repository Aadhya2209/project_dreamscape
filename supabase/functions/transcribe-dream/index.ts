import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const MAX = 14 * 1024 * 1024;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Please sign in." }, 401);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return json({ error: "Please sign in." }, 401);

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File) || !file.size) return json({ error: "No recording received." }, 400);
    if (file.size > MAX) return json({ error: "Recording is too long — keep it under about 5 minutes." }, 400);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI is not configured." }, 500);

    const up = new FormData();
    up.append("model", "google/gemini-3.5-transcribe");
    up.append("file", new File([file], "dream.wav", { type: "audio/wav" }));
    up.append("response_format", "json");
    up.append("stream", "true");
    const r = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: up,
      signal: req.signal,
    });
    if (!r.ok || !r.body) {
      const t = await r.text();
      let msg = t;
      try { msg = JSON.parse(t)?.error?.message ?? JSON.parse(t)?.message ?? t; } catch { /* raw */ }
      if (r.status === 429) msg = "Too many requests, try again shortly.";
      if (r.status === 402) msg = "AI credits are used up. Please add credits to continue.";
      return json({ error: msg || "Transcription failed" }, r.status);
    }

    const reader = r.body.pipeThrough(new TextDecoderStream()).getReader();
    let buf = "", text = "", done = "";
    while (true) {
      const { value, done: end } = await reader.read();
      if (end) break;
      buf += value;
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const d = line.slice(5).trim();
        if (!d || d === "[DONE]") continue;
        try {
          const ev = JSON.parse(d);
          if (ev.type === "transcript.text.delta") text += ev.delta ?? "";
          else if (ev.type === "transcript.text.done") done = ev.text ?? "";
          else if (ev.type === "error" || ev.error) return json({ error: ev.error?.message ?? "Transcription failed" }, 502);
        } catch { /* skip */ }
      }
    }
    const out = (done || text).trim();
    if (!out) return json({ error: "We couldn't hear any words — try again closer to the mic." }, 422);
    return json({ text: out });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
