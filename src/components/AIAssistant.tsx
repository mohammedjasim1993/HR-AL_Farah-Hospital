import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ShieldCheck, 
  HelpCircle, 
  LineChart, 
  AlertTriangle, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Send, 
  Calculator, 
  Search, 
  ArrowLeftRight,
  TrendingUp,
  BrainCircuit,
  Phone,
  UserCheck
} from 'lucide-react';
import { Department, Employee, ArchivedMonth } from '../types';

interface AIAssistantProps {
  departments: Department[];
  employees: Employee[];
  payrollList: any[];
  archive: ArchivedMonth[];
  language: 'ar' | 'en';
}

export default function AIAssistant({
  departments,
  employees,
  payrollList,
  archive,
  language
}: AIAssistantProps) {
  const [activeSubTab, setActiveSubTab] = useState<'audit' | 'calculate' | 'chat'>('audit');
  
  // Loading & State
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [responseHtml, setResponseHtml] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Chat conversation logs state
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: language === 'ar' 
        ? 'مرحباً بك في المساعد الذكي لمستشفى الفرح الأهلي الموحد! 🌟 أنا هنا لمساعدتك في تدقيق الرواتب، وتخطيط الميزانيات للأقسام، والإجابة عن أي أسئلة بخصوص قاعدة بيانات الكادر والمستحقات ماليًا.'
        : 'Welcome to the Smart AI Suite of Al-Farrah Private Hospital! 🌟 I am here to help you audit payrolls, plan department budgets, and answer any inquiries regarding staff database records.'
    }
  ]);

  // Encouraging loader steps
  const loaderStepsAr = [
    'جاري فحص دفاتر الحسابات والقيود لـ مستشفى الفرح... 🏥📊',
    'يتم الآن مطابقة رواتب الأقسام مع السقف المعتمد (Budget Limit)... 📝🔐',
    'يقوم المدقق الذكي بتحليل الخصومات والغيابات والأيام الإضافية... 🔍💵',
    'يرسل الذكاء الاصطناعي استعلاماً موقّعاً لحسابات البصرة... 📡🛰️',
    'جاري تنسيق تقرير التدقيق النهائي بدعم المهندس محمد جاسم... 💎👨‍💻'
  ];

  const loaderStepsEn = [
    'Scanning Al-Farrah bookkeeping ledgers and files... 🏥📊',
    'Matching department cumulative payroll with maximum budget limits... 📝🔐',
    'Auditing deductions, extra days, and healthcare shift pricing... 🔍💵',
    'Gemini AI is digesting active staff metadata parameters... 📡🛰️',
    'Formatting final compliant financial report with engineer Mohammed support... 💎👨‍💻'
  ];

  const triggerStepRotation = (isArabic: boolean) => {
    let currentIdx = 0;
    const steps = isArabic ? loaderStepsAr : loaderStepsEn;
    setLoadingStep(steps[0]);
    
    const interval = setInterval(() => {
      currentIdx = (currentIdx + 1) % steps.length;
      setLoadingStep(steps[currentIdx]);
    }, 2200);

    return interval;
  };

  const getFriendlyErrorMessage = (rawError: any): string => {
    let str = "";
    if (typeof rawError === 'object') {
      try {
        str = JSON.stringify(rawError);
      } catch {
        str = String(rawError);
      }
    } else {
      str = String(rawError);
    }

    // 1. Quota limit exceeded (429 Rate limits / Free Tier limit of 5 requests per minute)
    if (
      str.includes("quota") || 
      str.includes("Quota") || 
      str.includes("429") || 
      str.includes("limit: 5") || 
      str.includes("GenerateRequestsPerMinute") ||
      str.includes("quota_exceeded")
    ) {
      return language === 'ar' 
        ? "⚠️ تم استهلاك الحد الأقصى من طلبات الذكاى الاصطناعي المجانية المؤقتة لمؤسستكم حالياً (أقصى حد هو 5 طلبات في الدقيقة على السيرفر المجاني لتجنب الضغط العالي).\n\n💡 يرجى الانتظار 30 إلى 60 ثانية لحين تصفير عداد خوادم Google، ثم اضغط على زر 'إعادة المحاولة مجدداً' وسيعمل النظام بكفاءة كاملة لتدقيق كافة الرواتب وجداول الكادر ومطابقتها."
        : "⚠️ Temporary Free Tier Quota Limit Reached (Max 5 requests per minute for this project environment).\n\n💡 Please wait 45-60 seconds and then click 'Retry Operation' to resume auditing payroll systems.";
    }

    // 2. High demand or 503 Overloaded
    if (
      str.includes("503") || 
      str.includes("UNAVAILABLE") || 
      str.includes("high demand") || 
      str.includes("Spikes in demand") || 
      str.includes("temporary") ||
      str.includes("overloaded")
    ) {
      return language === 'ar' 
        ? "⚠️ خوادم معالجة الذكاء الاصطناعي (Gemini 3.5 Engine) تشهد حالياً ضغطاً تشغيلياً مؤقتاً في معالجة العمليات الحسابية الضخمة.\n\n💡 يرجى الانتظار 15 ثانية فقط ثم اضغط على زر 'إعادة المحاولة مجدداً' ليعيد النظام إرسال الجداول وتدقيق القيود والأقسام بنجاح."
        : "⚠️ AI Engines are experiencing high workload volume at this moment (Temporary Google Service Overload).\n\n💡 Please wait 15 seconds and click 'Retry Operation' to refresh and compute.";
    }

    // 3. API Key issue
    if (
      str.includes("API_KEY") || 
      str.includes("API key") || 
      str.includes("key not found") || 
      str.includes("Authentication")
    ) {
      return language === 'ar' 
        ? "⚠️ رمز تشغيل الذكاء الاصطناعي (Gemini API Key) غير مهيأ بسيرفر النظام أو تم إلغاؤه. يرجى مراجعة المهندس محمد جاسم لإعادة تهيئته."
        : "⚠️ Gemini API key is not fully configured inside the server. Please consult systems developer Engineer Mohammed Jassim.";
    }

    return str || (language === 'ar' ? 'فشلت معالجة الطلب في السيرفر حالياً.' : 'Server failed to process the diagnostic request.');
  };

  // Main fetch function calling the server-side controller proxy
  const handleAIService = async (action: 'audit' | 'calculate' | 'ask', specificPrompt: string) => {
    if (loading) return;
    setLoading(true);
    setErrorMsg(null);
    setResponseHtml('');
    
    const rotationInterval = triggerStepRotation(language === 'ar');
 
    try {
      const response = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          prompt: specificPrompt,
          payrollList,
          departments,
          employees
        })
      });
 
      const result = await response.json();
      clearInterval(rotationInterval);
      setLoading(false);
 
      if (result && result.success) {
        const mdText = result.text || '';
        const parsedHtml = formatMarkdownToSimpleHtml(mdText);
        setResponseHtml(parsedHtml);
 
        if (action === 'ask') {
          setChatHistory(prev => [
            ...prev,
            { sender: 'ai', text: mdText }
          ]);
        }
      } else {
        const rawErr = result.error || 'فشلت معالجة الطلب في السيرفر حالياً.';
        const friendlyErr = getFriendlyErrorMessage(rawErr);
        setErrorMsg(friendlyErr);
        if (action === 'ask') {
          setChatHistory(prev => [
            ...prev,
            { sender: 'ai', text: friendlyErr }
          ]);
        }
      }
    } catch (err: any) {
      clearInterval(rotationInterval);
      setLoading(false);
      const rawErr = err.message || 'خطأ في الاتصال بالشبكة أو مزود الخصائص الذكية.';
      const friendlyErr = getFriendlyErrorMessage(rawErr);
      setErrorMsg(friendlyErr);
      if (action === 'ask') {
        setChatHistory(prev => [
          ...prev,
          { sender: 'ai', text: friendlyErr }
        ]);
      }
    }
  };

  // Send message from chat box
  const handleSendMessage = async () => {
    const text = customPrompt.trim();
    if (!text) return;

    setChatHistory(prev => [...prev, { sender: 'user', text }]);
    setCustomPrompt('');
    
    await handleAIService('ask', text);
  };

  // Convert Gemini Markdown responses into elegant HTML for rendering in accounting table views
  const formatMarkdownToSimpleHtml = (md: string): string => {
    if (!md) return '';
    let html = md;

    // Secure HTML escapement
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Handle standard Tables (| values |)
    const lines = html.split('\n');
    let isInTable = false;
    let tableHtml = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('|') && line.endsWith('|')) {
        const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        
        if (!isInTable) {
          isInTable = true;
          tableHtml += '<div className="overflow-x-auto my-3"><table className="w-full text-xs text-right border-collapse bg-slate-900/60 rounded-xl overflow-hidden border border-slate-705/30">';
          tableHtml += '<thead><tr className="bg-slate-950 text-slate-200 border-b border-slate-800">';
          cells.forEach(cell => {
            tableHtml += `<th className="p-2.5 font-bold">${cell}</th>`;
          });
          tableHtml += '</tr></thead><tbody>';
        } else {
          // If it is the separator line (---|---) ignore it
          if (line.includes('---') || line.includes('-:-')) {
            continue;
          }
          tableHtml += '<tr className="hover:bg-white/5 border-b border-white/5">';
          cells.forEach(cell => {
            tableHtml += `<td className="p-2.5 font-medium font-mono text-slate-300">${cell}</td>`;
          });
          tableHtml += '</tr>';
        }
        lines[i] = '<!--TABLE_ROW-->';
      } else {
        if (isInTable) {
          isInTable = false;
          tableHtml += '</tbody></table></div>';
          // Find the place of i - 1 table row and replace it with tableHtml
          const lastIdx = lines.indexOf('<!--TABLE_ROW-->');
          if (lastIdx !== -1) {
            lines[lastIdx] = tableHtml;
          }
          tableHtml = '';
        }
      }
    }
    html = lines.join('\n');

    // bold text (**text**)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong className="text-blue-300 font-extrabold">$1</strong>');
    
    // single bold asterisk (*text*)
    html = html.replace(/\*(.*?)\*/g, '<em className="text-indigo-300 font-semibold">$1</em>');

    // Bullet points
    html = html.replace(/^\s*[-*+]\s+(.*?)$/gm, '<li className="mr-4 list-disc text-slate-300 py-1 leading-relaxed">$1</li>');

    // Headings (###, ##, #)
    html = html.replace(/^\s*###\s+(.*?)$/gm, '<h4 className="text-sm font-black text-blue-200 mt-4 mb-2 flex items-center gap-1.5 border-r-2 border-blue-500 pr-2">$1</h4>');
    html = html.replace(/^\s*##\s+(.*?)$/gm, '<h3 className="text-base font-black text-indigo-200 mt-5 mb-3 flex items-center gap-2 border-r-4 border-indigo-600 pr-2 pb-1 bg-white/5 p-1.5 rounded">$1</h3>');
    html = html.replace(/^\s*#\s+(.*?)$/gm, '<h2 className="text-lg font-black text-white mt-6 mb-4 pb-1 border-b border-white/10">$1</h2>');

    // Line breaks
    html = html.replace(/\n/g, '<br/>');

    return html;
  };

  // Pre-configured calculator suggestions
  const calculatePromptsAr = [
    {
      title: 'خصم غيابات متكررة لطبيب شفتات',
      text: 'لدينا طبيب في قسم الطوارئ براتب أساسي 2,000,000 د.ع غاب 3 أيام غير معذرة ولديه خصم أيام. كيف أحتسب الخصم بدقة حسب سعر اليوم القياسي للقسم؟'
    },
    {
      title: 'هيكلة أجور الأكواد الصحية الجديدة',
      text: 'اكتب دليلاً لتوزيع نسب الاستدعاء (callouts) لأخصائي التخدير والعمليات بالمقارنة بين أجر شفت الطبيب المقيم وأجر شفت الممرض الساند.'
    },
    {
      title: 'تنظيم الحوافز والإضافي التعويضي في البصرة',
      text: 'كيف تحتسب ساعات العمل الإضافي المعتمدة قانونياً لتعويض دوام الكوادر خلال أيام الجمعة والأعياد الرسمية في العراق؟'
    }
  ];

  const calculatePromptsEn = [
    {
      title: 'Calculate Repeated Absence Penalty',
      text: 'A specialist physician with a 2,500,000 IQD basic salary in the Emergency unit missed 3 shifts. Recommend a mathematically sound penalty structure.'
    },
    {
      title: 'Department Shift Weighting Rules',
      text: 'Suggest a healthy pricing baseline for callouts and night shifts comparing chief surgeons with assistant nurses.'
    },
    {
      title: 'Iraq Overtime & Friday Compensation Code',
      text: 'What are the recommended overtime coefficients and hourly payouts representing public holidays and weekend duties in Basra medical units?'
    }
  ];

  // Pre-configured chat suggestions
  const chatPromptsAr = [
    {
      title: 'من هو صاحب أعلى راتب بالفندق/المستشفى؟',
      text: 'من هو الموظف الذي لديه أعلى راتب في قاعدة البيانات الحالية وما هو موقعه الوظيفي وقسمه؟'
    },
    {
      title: 'هل هناك تجاوز لميزانيات الأقسام؟',
      text: 'قارن الرواتب المحتسبة الحالية لكل قسم مع سقف ميزانيته المحدد BudgetLimit، واذكر الأقسام المتجاوزة أو المعرضة للتجاوز.'
    },
    {
      title: 'إحصائيات الإضافي والخصومات الكلية للقسم',
      text: 'اعطني جدولاً مجملاً يعكس الكوادر الذين لديهم خصومات أيام (deductionDays) ومجموع الخصومات والمردود المستقطع حالياً.'
    }
  ];

  const chatPromptsEn = [
    {
      title: 'Highest Earning Staff Member',
      text: 'Identify the employee with the highest total basic salary or computed net salary in Al-Farrah database.'
    },
    {
      title: 'Check Budget Limit Statuses',
      text: 'Are there any hospital units that exceeded or are close to exceeding their allocated capital budget limit?'
    },
    {
      title: 'Summarize Active Medical Personnel',
      text: 'Write a high-level summary of active headcounts, comparing physicians against operational tech assistants.'
    }
  ];

  const promptsList = language === 'ar' ? calculatePromptsAr : calculatePromptsEn;
  const suggestionsList = language === 'ar' ? chatPromptsAr : chatPromptsEn;

  return (
    <div className="space-y-6">
      
      {/* Dynamic Header Block with Glowing Matrix and Professional Medical Accent */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 transition-all duration-200 hover:shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl text-blue-700 animate-pulse">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-md font-black text-slate-900 flex items-center gap-2">
                {language === 'ar' ? 'مساعد تدقيق وحسابات الرواتب الذكي لمستشفى الفرح' : 'Al-Farrah ERP Intelligent Audit & Accounting Suite'}
                <span className="text-[10px] bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-mono uppercase font-bold">
                  Powered by Gemini 3.5
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {language === 'ar' 
                  ? 'بروتوكول تدقيق مرئي مدرب على هياكل أجور الكوادر الصحية العراقية بالدينار لتدقيق القيود وتحليل الالتزام بميزانيات مستشفى الفرح الأهلي بالبصرة.'
                  : 'Auditing protocol trained on Iraqi healthcare staff salaries to crosscheck ledgers, monitor safety caps, and optimize hospital operational costs.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            {language === 'ar' ? `الربط الذكي: ${employees.length} موظف مقيد` : `Bridge Status: ${employees.length} Staff Linked`}
          </div>
        </div>

        {/* Feature Sub-Navigation Tabs inside panel */}
        <div className="flex flex-wrap gap-2 mt-6 border-t border-slate-100 pt-4">
          <button
            onClick={() => { setActiveSubTab('audit'); setResponseHtml(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'audit'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {language === 'ar' ? 'التدقيق المالي الشامل للرواتب' : 'Smart Payroll Audit'}
          </button>

          <button
            onClick={() => { setActiveSubTab('calculate'); setResponseHtml(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'calculate'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Calculator className="w-4 h-4" />
            {language === 'ar' ? 'مساعد احتساب الرواتب والمقاصات' : 'Salary calculation assistance'}
          </button>

          <button
            onClick={() => { setActiveSubTab('chat'); setResponseHtml(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'chat'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            {language === 'ar' ? 'المستشار الذكي (سؤال وجواب)' : 'Intelligence Q&A Consultation'}
          </button>
        </div>
      </div>

      {/* Main Feature Interlocking Views */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Control Column (Take Actions, Suggestions, Presets) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Action Trigger Card - Depend on Active Tab */}
          {activeSubTab === 'audit' && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                {language === 'ar' ? 'تدقيق مالي بضغطة زر' : 'Automated Accounting Check'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {language === 'ar' 
                  ? 'سيتم تجميع أرقام الرواتب، الأيام، الخصومات ومقارنتها عبر محرك الاستدلال الذكي للتنبؤ بالأخطاء والرواتب المتجاوزة لخط وميزانية القسم.'
                  : 'Extract payroll logs on the fly, matching allowances versus structural penalties to discover compliance anomalies.'}
              </p>
              
              <button
                disabled={loading || employees.length === 0}
                onClick={() => handleAIService('audit', '')}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#15803d] hover:bg-[#166534] text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? (language === 'ar' ? 'جاري التدقيق والمعالجة...' : 'Auditing Ledgers...') : (language === 'ar' ? 'توليد تقرير التدقيق المالي الشامل' : 'Generate Hospital Audit Report')}
              </button>

              {employees.length === 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-start gap-1.5 leading-relaxed">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    {language === 'ar' 
                      ? 'قاعدة البيانات فارغة حالياً! يرجى إدخال موظفين أو تحميل بيانات تجريبية من صفحة اللوحة الرئيسية لتتمكن من التدقيق ماليًا.'
                      : 'Database is empty! Populate active employees first to run structural financial audits.'}
                  </span>
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'calculate' && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Calculator className="w-4 h-4 text-blue-600" />
                {language === 'ar' ? 'اقتراحات احتساب الرواتب' : 'Calculation Templates'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {language === 'ar' 
                  ? 'انقر على أي معادلة ماليّة أدناه لملئها وفهم طريقة احتسابها بشكل سليم وصحيح محاسبياً:'
                  : 'Click on any scenario to formulate compliance logic built on top of Iraq Labor Code:'}
              </p>
              
              <div className="space-y-2">
                {promptsList.map((p, idx) => (
                  <button
                    key={idx}
                    disabled={loading}
                    onClick={() => {
                      setCustomPrompt(p.text);
                      handleAIService('calculate', p.text);
                    }}
                    className="w-full text-right block p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all text-xs font-bold text-slate-700 cursor-pointer disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between gap-1.5 font-sans">
                      <span className="truncate">{p.title}</span>
                      <ChevronLeft className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === 'chat' && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                {language === 'ar' ? 'أسئلة سريعة حول البيانات' : 'Frequent Data Queries'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {language === 'ar' 
                  ? 'اسأل المساعد عن تفاصيل مباشرة في الكادر المالي الحالي بنقرة واحدة:'
                  : 'Query current database headcounts and salary distributions effortlessly:'}
              </p>

              <div className="space-y-2">
                {suggestionsList.map((p, idx) => (
                  <button
                    key={idx}
                    disabled={loading}
                    onClick={() => {
                      setCustomPrompt(p.text);
                      handleAIService('ask', p.text);
                    }}
                    className="w-full text-right block p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all text-xs font-bold text-slate-700 cursor-pointer disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between gap-1.5 font-sans">
                      <span className="truncate">{p.title}</span>
                      <ChevronLeft className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* System Integrity Certificate Footer (Mohammed Jassim Clinical Branding) */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">بروتوكول السلامة المالية</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              يدقق هذا المساعد حسابات الأطقم الطبية وصيانة الأجهزة المعقدة طبقاً للضوابط التشغيلية لمؤسسة الفرح الأهلي في البصرة.
            </p>
            <div className="h-[1px] bg-slate-800" />
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span className="flex items-center gap-1"><UserCheck className="w-3.5 h-3.5 text-slate-400" /> م. محمد جاسم</span>
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> 07836885808</span>
            </div>
          </div>
        </div>

        {/* Right Content / Report Rendering Area */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 min-h-[460px] flex flex-col justify-between relative overflow-hidden">
            
            {/* Ambient Background Glow when Loading */}
            {loading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 text-center">
                <div className="space-y-4 max-w-sm">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-lg animate-bounce">
                    <BrainCircuit className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-black text-slate-900 animate-pulse">{loadingStep}</p>
                    <p className="text-[10px] text-slate-500">جاري المعالجة الحسابية عبر محرك الذكاء الاصطناعي المركزي لـ مستشفى الفرح الموحد</p>
                  </div>
                </div>
              </div>
            )}

            {/* Response Output - Audit/Calculate Mode */}
            {activeSubTab !== 'chat' && (
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                    {activeSubTab === 'audit' 
                      ? (language === 'ar' ? 'تقرير تدقيق الحسابات القياسي' : 'Payroll Diagnostic Output')
                      : (language === 'ar' ? 'حلول ومقترحات احتساب الأجور' : 'Calculation Advice Output')}
                  </h3>
                  {responseHtml && (
                    <button
                      onClick={() => handleAIService(activeSubTab, customPrompt)}
                      className="text-slate-500 hover:text-blue-600 p-1 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1 font-bold"
                      title="إعادة التشغيل والتدقيق مجدداً"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      {language === 'ar' ? 'تحديث' : 'Refresh'}
                    </button>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  {responseHtml ? (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-slate-800 text-xs leading-relaxed space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200 select-text"
                    >
                      <div 
                        className="markdown-body text-[13px] font-medium leading-relaxed font-sans space-y-3 prose max-w-none text-right pr-1"
                        dangerouslySetInnerHTML={{ __html: responseHtml }} 
                      />
                    </motion.div>
                  ) : errorMsg ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-5 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl space-y-3"
                    >
                      <div className="flex items-center gap-2 text-rose-700 font-extrabold text-xs">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <span>{language === 'ar' ? 'حدث خطأ في استخلاص النتيجة' : 'Execution Anomaly Encountered'}</span>
                      </div>
                      <p className="text-xs font-medium leading-relaxed">{errorMsg}</p>
                      <div className="pt-2">
                        <button
                          onClick={() => handleAIService(activeSubTab, customPrompt)}
                          className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          {language === 'ar' ? 'إعادة المحاولة مجدداً' : 'Retry Operation'}
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center text-center py-20 text-slate-400 space-y-3"
                    >
                      <BrainCircuit className="w-12 h-12 text-slate-300 stroke-1" />
                      <div className="space-y-1">
                        <p className="text-xs font-black text-slate-600">
                          {activeSubTab === 'audit' 
                            ? (language === 'ar' ? 'بانتظار بناء تقرير التدقيق المالي' : 'Ready to Run Diagnostic Audit')
                            : (language === 'ar' ? 'ادخل تساؤلك أو حدد نمط احتساب معيّن' : 'Select calculations prompt template to begin')}
                        </p>
                        <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                          {activeSubTab === 'audit'
                            ? (language === 'ar' ? 'اضغط على زر (توليد تقرير التدقيق المالي الشامل) ليرتفع الذكاء ويبحث الرواتب' : 'Press the diagnostic button on the left to review employee records.')
                            : (language === 'ar' ? 'أو اختر سيناريو حساب مالي سريع من الجانب الأيمن' : 'Or select one of the templates directly.')}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {activeSubTab === 'calculate' && (
                  <div className="pt-4 border-t border-slate-100">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">
                      {language === 'ar' ? 'أو صغ سيناريو حساب خاص بك:' : 'Or type a custom salary scenario:'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder={language === 'ar' ? 'مثال: أخصائي في الطوارئ لديه 3 شفتات صباحية وغاب يومين...' : 'e.g., A nurse with extra day pricing...'}
                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <button
                        onClick={() => handleAIService('calculate', customPrompt)}
                        className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {language === 'ar' ? 'أرسل' : 'Send'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Custom Interactive Q&A chat mode */}
            {activeSubTab === 'chat' && (
              <div className="flex-1 flex flex-col justify-between h-full">
                
                {/* Scrollable messages container */}
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[340px] mb-4 pr-1">
                  <div className="text-[10px] text-slate-400 text-center font-mono py-1 border-b border-slate-50 mb-2">
                    {language === 'ar' ? 'محادثة آمنة ومدركة لقاعدة بيانات مستشفى الفرح' : 'Secure contextual ERP Chat session'}
                  </div>
                  
                  {chatHistory.map((item, index) => (
                    <div
                      key={index}
                      className={`flex gap-2.5 max-w-[85%] ${item.sender === 'user' ? 'mr-auto flex-row-reverse' : 'ml-auto'}`}
                    >
                      <div className={`p-1 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        item.sender === 'user' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {item.sender === 'user' ? <UserCheck className="w-4 h-4" /> : <BrainCircuit className="w-4 h-4" />}
                      </div>
                      
                      <div className={`p-3 rounded-xl text-xs leading-relaxed font-medium select-text ${
                        item.sender === 'user' 
                          ? 'bg-indigo-600 text-white text-left font-bold' 
                          : 'bg-slate-50 border border-slate-200 text-slate-800 text-right'
                      }`}>
                        {item.sender === 'user' ? (
                          item.text
                        ) : (
                          <div 
                            className="markdown-body text-[12.5px] whitespace-pre-wrap leading-relaxed font-sans prose"
                            dangerouslySetInnerHTML={{ __html: formatMarkdownToSimpleHtml(item.text) }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input block */}
                <div className="pt-3 border-t border-slate-100 mt-auto">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                      placeholder={language === 'ar' ? 'اسأل المساعد بالفصحى عن رواتب الموظفين أو الأقسام الشعبية...' : 'Ask about active salaries, staff counts or historic months...'}
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                      disabled={loading || !customPrompt.trim()}
                      onClick={handleSendMessage}
                      className="py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <Send className="w-4 h-4" />
                      {language === 'ar' ? 'إرسال واستعلم' : 'Query'}
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
