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

أنت خبير في هيكلية مستشفى الفرح الأهلي، والأقسام الـ 15 المعتمدة هي:
1. الادارة العليا
2. قسم الصيدلية
3. قسم العمليات
4. قسم النسائية والتوليد
5. قسم الكافتريا
6. قسم الاطفال والخدج
7. قسم السونار
8. قسم اطباء الخدج المقيمين
9. قسم المختبر ومصرف الدم
10. قسم الاطباء المقيمين
11. قسم التمريض والردهات والطواريء
12. قسم اطباء النسائية
13. قسم الاشعة (مبلغ قطعي كلي)
14. قسم الامنية (مبلغ قطعي كلي)
15. قسم الاسعاف (مبلغ قطعي كلي)

قواعد الاحتساب والمحددات الحسابية لرواتب كل قسم:
- الادارة العليا: الأساسي + أيام إضافية × (الأساسي/30) + ساعات إضافية × (الأساسي/240) - عقوبات.
- قسم الصيدلية: (مبلغ الشفت الصباحي × أيامه) + (مبلغ الشفت الخفر × أيامه) + إضافات - استقطاعات.
- قسم العمليات: (مبلغ اليوم × أيام الدوام) + إضافات - استقطاعات. او الراتب الكلي.
- قسم النسائية والتوليد: (مبلغ اليوم الكامل × أيام الدوام) + مبلغ النصف شفت + إضافات - استقطاعات.
- قسم الكافتريا: (مبلغ اليوم × أيام الدوام) + إضافات - استقطاعات.
- قسم الاطفال والخدج: (مبلغ الشفت الصباحي × أيامه) + (مبلغ الشفت الخفر × أيامه) + إضافات - استقطاعات.
- قسم السونار: (مبلغ الاستدعاء × أيام الدوام) + إضافات - استقطاعات.
- قسم اطباء الخدج المقيمين: (الكامل × أيامه) + (المشترك × أيامه) + إضافات - استقطاعات.
- قسم المختبر ومصرف الدم: (صباحي × أيامه) + (خفر × أيامه) + (نصف شفت × أيامه) + إضافات - استقطاعات.
- قسم الاطباء المقيمين: (مبلغ اليوم لـ 12 ساعة × أيام الدوام) + إضافات - استقطاعات.
- قسم التمريض والردهات والطواريء: (مبلغ الشفت × أيام الدوام لـ 12 ساعة) + إضافات - استقطاعات.
- قسم اطباء النسائية: (مبلغ اليوم × أيام الدوام) + إضافات - استقطاعات.
- قسم الاشعة والأمنية والاسعاف: مبالغ قطعية كلية يدخلها المحاسب وتدفع مباشرة.

إليك بيانات الموظفين ومسير رواتبهم الحالية للمستشفى لتستند عليها بدقة وتجيب منها (لا تفترض تفاصيل غير حقيقية وتكلم بثقة محاسبية عالية ومقنعة):
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
