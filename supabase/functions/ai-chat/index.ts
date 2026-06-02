// ============================================================
// Jawatha — AI Assistant Edge Function (Google Gemini proxy)
// ------------------------------------------------------------
// الغرض: وسيط آمن بين متصفح الطالب و Gemini.
// مفتاح Gemini يُخزّن كـ Secret باسم GEMINI_API_KEY ولا يظهر للمتصفح أبداً.
//
// النشر (من لوحة Supabase أو الـ CLI):
//   supabase functions deploy ai-chat --no-verify-jwt
// تعيين المفتاح السري:
//   supabase secrets set GEMINI_API_KEY=AQ.xxxxx
// ============================================================

// الموديل المستخدم — gemini-2.5-flash له حصة مجانية ويعمل جيداً بالعربية
const MODEL = "gemini-2.5-flash";

// توجيه المساعد التعليمي — عدّله كما تشاء
const SYSTEM_PROMPT = `أنت "مساعد جواثا الذكي"، مساعد تعليمي لطلاب مدارس جواثا الأهلية في المملكة العربية السعودية.

قواعدك:
- أجب دائماً باللغة العربية الفصحى المبسّطة والواضحة المناسبة لعمر الطالب.
- مهمتك أن تُفهّم الطالب وتشرح له خطوة بخطوة، لا أن تساعده على الغش.
- إذا سأل الطالب عن حل واجب أو سؤال اختبار جاهز، لا تعطه الإجابة النهائية مباشرة؛ بل اشرح الفكرة، وأرشده إلى طريقة الحل بالخطوات، وشجّعه على المحاولة بنفسه.
- نظّم إجابتك بنقاط أو خطوات عند الحاجة، واجعلها موجزة ومركّزة.
- إذا كان السؤال خارج نطاق الدراسة أو غير مناسب، اعتذر بلطف ووجّه الطالب للتركيز على دراسته.
- كن لطيفاً ومشجّعاً ومحترماً دائماً.`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  // معالجة طلب preflight الخاص بالـ CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "الطريقة غير مدعومة" }, 405);
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return json({ error: "لم يتم ضبط مفتاح Gemini على الخادم." }, 500);
  }

  let payload: { messages?: Array<{ role: string; text: string }> };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "صيغة الطلب غير صحيحة." }, 400);
  }

  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  if (messages.length === 0) {
    return json({ error: "لا توجد رسالة." }, 400);
  }

  // نأخذ آخر 12 رسالة فقط للحفاظ على السياق دون إطالة
  const recent = messages.slice(-12);

  // تحويل المحادثة إلى صيغة Gemini (user / model)
  const contents = recent.map((m) => ({
    role: m.role === "assistant" || m.role === "model" ? "model" : "user",
    parts: [{ text: String(m.text || "").slice(0, 4000) }],
  }));

  const geminiUrl =
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          // إيقاف وضع "التفكير" في gemini-2.5-flash حتى لا يستهلك المخرجات ويترك الرد فارغاً
          thinkingConfig: { thinkingBudget: 0 },
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini error:", res.status, errText);
      return json({ error: "تعذّر الحصول على إجابة من المساعد حالياً. حاول مرة أخرى." }, 502);
    }

    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text || "")
      .join("")
      .trim();

    if (!reply) {
      const blocked = data?.promptFeedback?.blockReason;
      if (blocked) {
        return json({ reply: "عذراً، لا أستطيع الإجابة على هذا السؤال. لنركّز على ما يفيدك في دراستك 🙂" });
      }
      return json({ error: "لم يصل رد من المساعد. حاول إعادة صياغة سؤالك." }, 502);
    }

    return json({ reply });
  } catch (e) {
    console.error("Fetch failed:", e);
    return json({ error: "حدث خطأ في الاتصال بالمساعد." }, 500);
  }
});
