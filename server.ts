/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini AI client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY" || key === "") {
      throw new Error("GEMINI_API_KEY variable is missing or empty. Please set it in Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Endpoint for HR / Payroll Advisor powered by Gemini 3.5 Flash
app.post("/api/payroll-consult", async (req, res) => {
  try {
    const { message, history, contextData } = req.body;

    if (!message) {
      res.status(400).json({ error: "الرجاء كشريك حوار كتابة رسالة قصيرة للحساب" });
      return;
    }

    // Attempt to invoke Gemini with system instruction of hospital advisor
    try {
      const ai = getGeminiClient();

      const systemInstruction = `
أنت مستشار رواتب وموارد بشرية ذكي وحسابي متخصص في "مستشفى الفرح الأهلي".
تتواصل باللغة العربية الفصحى بشكل رسمي، ودود، ومهني للغاية للرد على الإدارة وسكرتارية الحسابات.

أنت خبير في هيكلية مستشفى الفرح الأهلي المكونة من الأقسام التالية:
1. الإدارة العامة
2. قسم العمليات
3. قسم الصيدلية
4. قسم النسائية والتوليد
5. الكافتيريا
6. قسم الأطفال والخدج
7. قسم الأشعة والمفراس والسونار (رواتب الأشعة مبلغ قطعي)
8. قسم أطباء الخدج المقيمين
9. قسم المختبر
10. قسم التمريض الأطباء المقيمين
11. قسم التمريض الردهات والطوارئ
12. قسم أطباء النسائية
13. قسم الأمنية والحراسة (رواتب الأمنية مبلغ قطعي)
14. قسم الإسعاف الفوري (رواتب الإسعاف مبلغ قطعي)

قواعد الاحتساب والمحددات الحسابية المعتمدة لديك:
- الراتب الكلي: هو الراتب الإجمالي المتفق عليه بالعقد للموظف.
- راتب اليوم الواحد: هو الراتب الكلي مقسوماً على 30 يوماً بالتساوي (الراتب الكلي / 30).
- راتب الساعة الواحد: هو راتب اليوم الواحد مقسوماً على 8 ساعات عمل رسمية (راتب اليوم الواحد / 8).
- الراتب النهائي: هو (الراتب الكلي) مطروحاً منه (أيام الاستقطاع * راتب اليوم الواحد) ومطروحاً منه (ساعات الاستقطاع * راتب الساعة الواحد).
- فئة المبالغ القطعية: أقسام (الأمنية، الإسعاف، والأشعة) رواتبهم "مبلغ قطعي" وهي معفاة من الاستقطاعات التلقائية للغياب.

إليك بيانات الموظفين ومسير رواتبهم الحالية للمستشفى لتستند عليها بدقة وتجيب منها (لا تفترض تفاصيل غير حقيقية وتكلم بثقة محاسبية عالية):
${JSON.stringify(contextData ?? {}, null, 2)}

قواعد الرد:
- ابدأ بالترحيب المناسب اللطيف وأعط إجابات تحليلية واضحة ومقنعة.
- استخدم جداول ورموز نقطية مريحة للعين لتيسير قراءة الأرقام الحسابية والرواتب.
- لا تذكر تفاصيل برمجية داخلية للكود أو أسماء ملفات أو مفاتيح سرية. تحدث بصفتك مستشاراً ومحاسباً بشرياً متمرساً في مستشفى الفرح الأهلي.
`;

      // Structure contents for conversational chats. Limit history to avoid huge size
      const contents = [];
      
      // Load verified history
      if (Array.isArray(history)) {
        for (const turn of history.slice(-6)) {
          contents.push({
            role: turn.sender === 'user' ? 'user' : 'model',
            parts: [{ text: turn.text }]
          });
        }
      }
      
      // Push newest user statement
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const text = response.text || "عذراً لم أتمكن من استخلاص إجابة ذكية حالياً.";
      res.json({ text });

    } catch (aiError: any) {
      console.error("Gemini invocation failed:", aiError);
      
      // Fallback response with simulated guidance if credentials are not configured yet
      const fallbackMsgs = [
        "أهلاً بك في نظام رواتب المستشفى الشفاء. هذا استبيان محاكاة مؤقت نظراً لعدم توفر مفتاح GEMINI_API_KEY الفعال:",
        "• يرجى العلم بأن نظام البدلات والرواتب الطبية لدينا يخضع للأنظمة المحلية، ويضمن دقة بالغة للأطباء والممرضين.",
        "• لحق الكادر الطبي مناوبات عمل كاملة، وبدل سكن بنسبة 25% وبدل نقل معتدل.",
        `سؤالك كان: "${message}" -> يسعدنا تقديم الخدمة بمجرد تهيئة مفتاح الذكاء الاصطناعي في لوحة التحكم secrets!`
      ];
      res.json({ text: fallbackMsgs.join("\n\n") });
    }

  } catch (error: any) {
    console.error("Server general error:", error);
    res.status(500).json({ error: "خطأ داخلي في الخادم." });
  }
});

// Vite frontend routing middleware configuration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Hospital Payroll Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
