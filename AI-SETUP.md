# إعداد المساعد الذكي (Gemini) — دليل خطوة بخطوة

المساعد الذكي يعمل عبر **Supabase Edge Function** اسمها `ai-chat` تخفي مفتاح Gemini.
عليك أن تنشرها مرة واحدة وتضبط المفتاح السري. إليك الطريقتين — اختر الأسهل لك.

> ⚠️ تأكد أولاً أن مشروع Supabase **نشط (Active)** وليس موقوفاً (Paused).

---

## الطريقة (أ) — من لوحة Supabase مباشرة (بدون برامج) ✅ الأسهل

### 1) تخزين مفتاح Gemini كسرّ
1. ادخل [لوحة Supabase](https://supabase.com/dashboard) → مشروعك.
2. من القائمة الجانبية: **Edge Functions** ثم تبويب **Secrets**
   (أو **Project Settings → Edge Functions → Secrets**).
3. اضغط **Add new secret** وأدخل:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** المفتاح الذي يبدأ بـ `AQ.` (المفتاح الكامل من Google AI Studio)
4. احفظ.

### 2) إنشاء الدالة
1. **Edge Functions** → **Deploy a new function** (أو **Create function**).
2. الاسم: اكتب بالضبط **`ai-chat`**
3. افتح ملف `supabase/functions/ai-chat/index.ts` من مجلد المشروع، **انسخ كل محتواه**، والصقه في محرّر الدالة بدلاً من الكود الموجود.
4. اضغط **Deploy**.

### 3) إيقاف التحقق من JWT (مهم)
المفاتيح الجديدة (`sb_publishable_...`) ليست JWT، لذا يجب السماح بالاستدعاء العام:
- بعد النشر: افتح إعدادات الدالة `ai-chat` → **Function Configuration / Settings**
- أوقف خيار **Verify JWT** (اجعله Off / Disabled) واحفظ.

✅ خلاص! انتقل لقسم **الاختبار** بالأسفل.

---

## الطريقة (ب) — عبر Supabase CLI (لو تفضّل الطرفية)

```powershell
# 1) تثبيت الـ CLI (مرة واحدة) — عبر scoop أو npm
npm install -g supabase

# 2) تسجيل الدخول
supabase login

# 3) ربط المشروع (الـ ref موجود في رابط لوحتك)
supabase link --project-ref tanoolmcliejckhttdor

# 4) ضبط المفتاح السري
supabase secrets set GEMINI_API_KEY=AQ.ضع_مفتاحك_هنا

# 5) نشر الدالة (مع تعطيل التحقق من JWT)
supabase functions deploy ai-chat --no-verify-jwt
```

---

## الاختبار

1. شغّل الموقع محلياً (`node server.js`) وافتح:
   `http://localhost:3000/ai-assistant.html`
2. اكتب سؤالاً مثل: «اشرح لي قاعدة الفاعل» واضغط إرسال.
3. يجب أن يرد المساعد خلال ثوانٍ.

### لو ظهر خطأ؟
- **«لم يتم ضبط مفتاح Gemini على الخادم»** → السرّ `GEMINI_API_KEY` غير مضبوط أو الاسم غير مطابق. راجع الخطوة 1.
- **خطأ 401 / Unauthorized** → لم تُوقف **Verify JWT**. راجع الخطوة 3.
- **تعذّر الاتصال** → تأكد أن المشروع نشط وأن اسم الدالة `ai-chat` بالضبط.
- لمراجعة التفاصيل: **Edge Functions → ai-chat → Logs** في اللوحة.

---

## تخصيصات سريعة (اختياري)
كل هذه في ملف `supabase/functions/ai-chat/index.ts` (أعد النشر بعد أي تعديل):
- **شخصية المساعد ولهجته:** عدّل نص `SYSTEM_PROMPT`.
- **الموديل:** غيّر قيمة `MODEL` (مثلاً `gemini-2.5-flash`).
- **طول الإجابة:** غيّر `maxOutputTokens`.
