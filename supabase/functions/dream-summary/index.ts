import { createOpenAI } from "npm:@ai-sdk/openai@^2";
import { streamText } from "npm:ai@^5";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
} from "../_shared/run-id.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-lovable-aig-run-id",
  "Access-Control-Expose-Headers": "X-Lovable-AIG-Run-ID",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Please sign in." }, 401);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return json({ error: "Please sign in." }, 401);

    const { dreamId } = await req.json();
    const { data: dream } = await supabase.from("dreams").select("*").eq("id", dreamId).maybeSingle();
    if (!dream) return json({ error: "Dream not found." }, 404);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI is not configured." }, 500);

    const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(req));
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: runIdFetch.fetch,
    });

    let failure: { status: number; message: string } | null = null;
    const result = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      abortSignal: req.signal,
      system:
        "You are a gentle dream interpreter for a sleep wellness app. Given a dream, reply in under 90 words: a 1-sentence summary, then 2 possible symbolic meanings, then one calming bedtime reflection. Plain text, no markdown headings.",
      messages: [
        { role: "user", content: `Title: ${dream.title}\nMood: ${dream.mood}\nTags: ${dream.tags.join(", ")}\n\n${dream.content}` },
      ],
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
      onError: ({ error }) => {
        const e = error as { statusCode?: number; message?: string };
        failure = { status: e.statusCode ?? 500, message: e.message ?? "AI request failed" };
      },
    });

    let text = "";
    for await (const chunk of result.textStream) text += chunk;
    if (failure) {
      const f = failure as { status: number; message: string };
      const msg = f.status === 429 ? "Too many requests, try again shortly."
        : f.status === 402 ? "AI credits are used up. Please add credits to continue."
        : f.message;
      return json({ error: msg }, f.status);
    }
    if (!text.trim()) return json({ error: "No summary was returned." }, 502);

    await supabase.from("dreams").update({ ai_summary: text.trim() }).eq("id", dreamId);
    return json({ summary: text.trim() });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
