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

    const body = await req.json().catch(() => ({}));
    const extra = typeof body?.dream === "string" ? body.dream.trim().slice(0, 4000) : "";

    const { data: dreams } = await supabase.from("dreams").select("title, content, mood, tags, created_at")
      .order("created_at", { ascending: false }).limit(20);
    const list = (dreams ?? []).map((d, i) =>
      `#${i + 1} (${d.created_at.slice(0, 10)}, mood: ${d.mood}) ${d.title}: ${d.content.slice(0, 600)}`);
    if (extra) list.unshift(`NEW DREAM: ${extra}`);
    if (list.length === 0) return json({ error: "Write a dream first." }, 400);

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
        "You are a warm, non-clinical dream reflection guide in a sleep wellness app. Read the user's dream journal and identify recurring themes, symbols, emotions or settings across dreams (if only one dream, note its key themes and what to watch for). Output ONLY lines in this exact format, no other text:\nTHEME: <short name> | <one sentence explaining where it recurs>\nPROMPT: <an open reflection question>\nGive 2-4 THEME lines, then 3 PROMPT lines.",
      messages: [{ role: "user", content: list.join("\n\n") }],
      providerOptions: {
        openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] },
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
    const themes: { name: string; detail: string }[] = [];
    const prompts: string[] = [];
    for (const line of text.split("\n")) {
      const t = line.trim();
      if (t.startsWith("THEME:")) {
        const [name, ...rest] = t.slice(6).split("|");
        themes.push({ name: name.trim(), detail: rest.join("|").trim() });
      } else if (t.startsWith("PROMPT:")) prompts.push(t.slice(7).trim());
    }
    if (!themes.length && !prompts.length) return json({ error: "No insights were returned." }, 502);
    return json({ themes, prompts, count: dreams?.length ?? 0 });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
