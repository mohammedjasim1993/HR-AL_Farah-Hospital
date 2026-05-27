/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Employee, ChatMessage, PayrollRecord } from './types';
import { 
  HOSPITAL_DEPARTMENTS, 
  DEPARTMENT_TITLES, 
  INITIAL_EMPLOYEES, 
  calculateEmployeeSalaryAndDeductions 
} from './data';
import Dashboard from './components/Dashboard';
import DepartmentPayrollTable from './components/DepartmentPayrollTable';
import { 
  Building, 
  Users, 
  FileSpreadsheet, 
  Bot, 
  Printer, 
  FileDown,
  Search, 
  Plus, 
  ShieldCheck, 
  X, 
  Briefcase, 
  Calendar, 
  Check, 
  AlertCircle,
  TrendingUp,
  Activity,
  UserCheck,
  RotateCcw,
  Share2,
  Crown,
  Pill,
  HeartPulse,
  Baby,
  Coffee,
  Smile,
  Scan,
  Stethoscope,
  FlaskConical,
  Syringe,
  Bone,
  Shield,
  Truck,
  Calculator,
  Sparkles,
  Lock,
  Unlock,
  Clock,
  Fingerprint
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip, 
  Legend as RechartsLegend 
} from 'recharts';

// قاموس الأيقونات الاحترافية للأقسام الـ 15 مع تنسيقات ألوان مخصصة ومصقولة
export const DEPARTMENT_ICONS: Record<string, { icon: React.ComponentType<any>; color: string; bg: string; border: string }> = {
  "الادارة العليا": { icon: Crown, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  "قسم الصيدلية": { icon: Pill, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  "قسم العمليات": { icon: HeartPulse, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  "قسم النسائية والتوليد": { icon: Baby, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200" },
  "قسم الكافتريا": { icon: Coffee, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
  "قسم الاطفال والخدج": { icon: Smile, color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-200" },
  "قسم السونار": { icon: Scan, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
  "قسم اطباء الخدج المقيمين": { icon: Stethoscope, color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-200" },
  "قسم المختبر ومصرف الدم": { icon: FlaskConical, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  "قسم الاطباء المقيمين": { icon: UserCheck, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
  "قسم التمريض والردهات والطواريء": { icon: Syringe, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
  "قسم اطباء النسائية": { icon: Stethoscope, color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-200" },
  "قسم الاشعة": { icon: Bone, color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200" },
  "قسم الأشعة": { icon: Bone, color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200" },
  "قسم الامنية": { icon: Shield, color: "text-zinc-700", bg: "bg-zinc-100", border: "border-zinc-200" },
  "قسم الأمنية": { icon: Shield, color: "text-zinc-700", bg: "bg-zinc-100", border: "border-zinc-200" },
  "قسم الاسعاف": { icon: Truck, color: "text-amber-700", bg: "bg-amber-100", border: "border-amber-300" },
  "قسم الإسعاف": { icon: Truck, color: "text-amber-700", bg: "bg-amber-100", border: "border-amber-300" },
};

export const MONTHS_LIST = [
  { id: '2026-01', name: 'رواتب كانون الثاني (شهر 1)', arabicName: 'كانون الثاني' },
  { id: '2026-02', name: 'رواتب شباط (شهر 2)', arabicName: 'شباط' },
  { id: '2026-03', name: 'رواتب آذار (شهر 3)', arabicName: 'آذار' },
  { id: '2026-04', name: 'رواتب نيسان (شهر 4)', arabicName: 'نيسان' },
  { id: '2026-05', name: 'رواتب أيار (شهر 5)', arabicName: 'أيار' },
  { id: '2026-06', name: 'رواتب حزيران (شهر 6)', arabicName: 'حزيران' },
  { id: '2026-07', name: 'رواتب تموز (شهر 7)', arabicName: 'تموز' },
  { id: '2026-08', name: 'رواتب آب (شهر 8)', arabicName: 'آب' },
  { id: '2026-09', name: 'رواتب أيلول (شهر 9)', arabicName: 'أيلول' },
  { id: '2026-10', name: 'رواتب تشرين الأول (شهر 10)', arabicName: 'تشرين الأول' },
  { id: '2026-11', name: 'رواتب تشرين الثاني (شهر 11)', arabicName: 'تشرين الثاني' },
  { id: '2026-12', name: 'رواتب كانون الأول (شهر 12)', arabicName: 'كانون الأول' }
];

const CHART_COLORS = [
  '#0d9488', // Teal
  '#0284c7', // Sky Blue
  '#4f46e5', // Indigo
  '#7c3aed', // Purple Violet
  '#db2777', // Pink Rose
  '#ea580c', // Dark Orange
  '#eab308', // Amber Yellow
  '#16a34a', // Emerald Green
  '#2563eb', // Royal Blue
  '#9333ea', // Bright Purple
  '#dc2626', // Warm Red
  '#0891b2', // Deep Cyan
  '#475569', // Muted Slate
  '#14b8a6', // Neon Teal
  '#f43f5e', // Sweet Rose
];

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [minSalary, setMinSalary] = useState<string>('');
  const [maxSalary, setMaxSalary] = useState<string>('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [currentPrintDept, setCurrentPrintDept] = useState<string>('all');
  const [signatureFilterDept, setSignatureFilterDept] = useState<string>('all');
  const [printDateString, setPrintDateString] = useState<string>('');

  // تهيئة وتخزين حالة الدورة الشهرية
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return localStorage.getItem('alfarrah_selected_month_v3') || '2026-05';
  });

  const [employeesByMonth, setEmployeesByMonth] = useState<Record<string, Employee[]>>(() => {
    const saved = localStorage.getItem('alfarrah_employees_by_month_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    const singleSaved = localStorage.getItem('alfarrah_employees_v2');
    const baseList = singleSaved ? JSON.parse(singleSaved) : INITIAL_EMPLOYEES;
    return {
      '2026-05': baseList
    };
  });

  const [releasedMonths, setReleasedMonths] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('alfarrah_released_months_v3');
    return saved ? JSON.parse(saved) : {};
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const savedMonth = localStorage.getItem('alfarrah_selected_month_v3') || '2026-05';
    const savedAll = localStorage.getItem('alfarrah_employees_by_month_v3');
    if (savedAll) {
      try {
        const parsed = JSON.parse(savedAll);
        if (parsed[savedMonth]) return parsed[savedMonth];
      } catch (e) {
        console.error(e);
      }
    }
    const singleSaved = localStorage.getItem('alfarrah_employees_v2');
    return singleSaved ? JSON.parse(singleSaved) : INITIAL_EMPLOYEES;
  });

  // تحديث التخزين المحلي والنسخ المتعددة للأشهر تلقائياً
  useEffect(() => {
    setEmployeesByMonth(prev => {
      const updated = {
        ...prev,
        [selectedMonth]: employees
      };
      localStorage.setItem('alfarrah_employees_by_month_v3', JSON.stringify(updated));
      return updated;
    });
    localStorage.setItem('alfarrah_employees_v2', JSON.stringify(employees));
  }, [employees, selectedMonth]);

  useEffect(() => {
    localStorage.setItem('alfarrah_released_months_v3', JSON.stringify(releasedMonths));
  }, [releasedMonths]);

  // دالة تغيير الدورة الشهرية بأمان وحفظ البيانات السابقة ونقل الكوادر نظيفة
  const handleMonthChange = (newMonth: string) => {
    const curEmps = [...employees];
    
    // حفظ التغييرات للشهر الحالي أولاً
    setEmployeesByMonth(prev => {
      const updated = {
        ...prev,
        [selectedMonth]: curEmps
      };
      localStorage.setItem('alfarrah_employees_by_month_v3', JSON.stringify(updated));
      return updated;
    });

    setSelectedMonth(newMonth);
    localStorage.setItem('alfarrah_selected_month_v3', newMonth);

    // تحميل موظفي الشهر المختار، أو توليد قائمة نظيفة بناء على الموظفين الحاليين مع تصفير المتغيرات الشهرية
    setEmployeesByMonth(prev => {
      let targetList = prev[newMonth];
      if (!targetList) {
        targetList = curEmps.map(emp => ({
          ...emp,
          overtimeDays: 0,
          overtimeHours: 0,
          deductionDays: 0,
          deductionHours: 0,
          penalties: 0,
          notes: ''
        }));
      }
      setEmployees(targetList);
      return prev;
    });
  };

  // تخزين محادثة مستشار الحسابات
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('alfarrah_chat_v2');
    return saved ? JSON.parse(saved) : [
      {
        id: 'welcome',
        sender: 'ai',
        text: 'مرحباً بك في مستشفى الفرح الأهلي! أنا المستشار المحاسبي الذكي الخاص بك المدعوم بـ Gemini 3.5. لقد قمت بتحميل الهيكلية والمحددات الرواتب الحسابية المنفصلة للأقسام الـ 15 بنجاح. يمكنني مساعدتك الآن بمسير الرواتب والميزانيات، وتوضيح كيفية احتساب كشوفات الرواتب، وتطبيق خصومات الاستقطاعات والإضافات بيسر وسهولة. تفضل بطرح سؤالك المحاسبي!',
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  // حالات حاسبة التدقيق للتحقق التلقائي بجيميناي بناءً على القسم المختار
  const [auditDept, setAuditDept] = useState<string>('الادارة العليا');
  const [auditVal1, setAuditVal1] = useState<string>('');
  const [auditVal2, setAuditVal2] = useState<string>('');
  const [auditLabel1, setAuditLabel1] = useState<string>('الراتب الأساسي لـ 30 يوماً');
  const [auditLabel2, setAuditLabel2] = useState<string>('أيام الدوام أو شفتات الخفر');

  // إرسال طلب تدقيق مالي تفصيلي مخصص للقسم المختار إلى جيميناي
  const handleSendAuditRequest = async () => {
    if (!auditVal1.trim() && !auditVal2.trim()) {
      alert("الطلب يحتاج إدخال قيمة مالية أو عدد أيام/ساعات واحدة على الأقل قبل إرسال التدقيق.");
      return;
    }

    const value1Str = auditVal1.trim() || 'غير محدد';
    const value2Str = auditVal2.trim() || 'غير محدد';

    const promptText = `طلب تدقيق مالي وحسابي فوري ومستهدف:
أنا بصدد احتساب أو مراجعة قيم كشف رواتب الموظفين في للقسم المختار من الهيكلية: **[${auditDept}]**.
يرجى التحقق من صحة ودقة المعادلة الحسابية للبيانات المدخلة التالية:
- المدخل الأول (${auditLabel1}): ${value1Str}
- المدخل الثاني (${auditLabel2}): ${value2Str}

المطلوب تدقيقه حسابياً:
1. راجع صحة المعادلة الرياضية بناءً على محددات قسم "${auditDept}" حصراً المعتمدة بمستشفى الفرح الأهلي.
2. اعرض كيف يتم الاحتساب خطوة بخطوة بالأرقام والعمليات الحسابية من (قسمة، زيادة، أو خصومات) بوضوح تام يفهمه المدقق المالي.
3. بيّن ما إذا كان هناك أي تباين أو خطأ مالي، وزوّدني بالنصيحة والراتب النهائي المحسوب بدقة تامة بالدينار العراقي.`;

    const userMsg: ChatMessage = {
      id: `USR-AUD-${Date.now()}`,
      sender: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const contextData = payrolls.map(pr => ({
        "الاسم": pr.employeeName,
        "القسم الطبي/الإداري": pr.department,
        "المنصب": pr.title,
        "الخصومات": pr.totalDeductions,
        "إضافات وبدلات": pr.totalAdditions,
        "الراتب المستحق النهائي": pr.finalSalary
      }));

      const response = await fetch('/api/payroll-consult', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMsg.text,
          history: chatMessages.map(m => ({ sender: m.sender, text: m.text })),
          contextData: contextData
        })
      });

      if (!response.ok) {
        throw new Error('تعذر جلب الاستجابة من خادم مستشفى الفرح الأهلي للذكاء الاصطناعي');
      }

      const data = await response.json();
      const aiMsg: ChatMessage = {
        id: `AI-${Date.now()}`,
        sender: 'ai',
        text: data.text,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, aiMsg]);

    } catch (err) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: `AI-ERR-${Date.now()}`,
        sender: 'ai',
        text: "عذراً، حدث خطأ أثناء الاتصال بالخادم الذكي لمستشفى الفرح للتدقيق الحسابي المباشر. يرجى تكرار المحاولة.",
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, errMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // حالة التحكم بالنافذة المنبثقة لإضافة وتعديل الموظفين
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formState, setFormState] = useState<any>({
    id: '',
    name: '',
    department: 'الادارة العليا',
    title: 'موظف استقبال',
    status: 'active',
    notes: ''
  });

  useEffect(() => {
    localStorage.setItem('alfarrah_chat_v2', JSON.stringify(chatMessages));
  }, [chatMessages]);

  // تحديث تلقائي للوقت والتاريخ عند طباعة التقرير أو فتحه
  useEffect(() => {
    const updateTime = () => {
      const parts = new Date().toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      setPrintDateString(parts);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);

  // دالة المساعدة لتوليد وتصدير ملف الـ PDF الاحترافي والمنظم للأقسام باستخدام مكتبتي html2canvas و jsPDF
  const handleExportPDF = async () => {
    const element = document.getElementById('printable-area-mockup');
    if (!element) return;

    setIsExportingPDF(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      // تهيئة خيارات التحويل لضمان أعلى جودة ودقة وحفظ الخطوط والتنسيقات والصور
      const canvas = await html2canvas(element, {
        scale: 2, // دقة مخرجات عالية وممتازة تجعل النصوص حادة وسهلة القراءة عند الطباعة
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // عرض الصفحة A4 بالملم
      const pageHeight = 297; // طول الصفحة A4 بالملم
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // إضافة الصفحة الأولى
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // لو كانت البيانات أطول من صفحة واحدة، نقوم بالتكرار لإضافة مساحات إضافية بمرونة كاملة
      while (heightLeft > 0) {
        position -= pageHeight; // إزاحة للأعلى بمقدار الارتفاع الكامل لصفحة A4
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`تقرير_رواتب_مستشفى_الفرح_${currentPrintDept === 'all' ? 'كافة_الأقسام' : currentPrintDept.replace(/ /g, '_')}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("حدث فشل أثناء محاولة توليد ملف الـ PDF. يرجى المحاولة مرة ثانية.");
    } finally {
      setIsExportingPDF(false);
    }
  };

  // احتساب كشف الرواتب الكلي المحدث تلقائياً للدورة الشهرية المحددة في النظام
  const payrolls = useMemo(() => {
    return employees.map(emp => {
      const calc = calculateEmployeeSalaryAndDeductions(emp);
      return {
        id: `PR-${selectedMonth.replace('-', '')}-${emp.id}`,
        payrollMonth: selectedMonth,
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        title: emp.title,
        finalSalary: calc.finalSalary,
        totalSalary: emp.totalSalary || emp.baseSalary || emp.radiologyTotalSum || emp.securityTotalSum || emp.ambulanceTotalSum || 0,
        totalDeductions: calc.totalDeductions,
        totalAdditions: calc.totalAdditions,
        status: (emp.status === 'active' ? 'approved' : 'draft') as any
      };
    });
  }, [employees, selectedMonth]);

  // احتساب مجاميع الرواتب لكل قسم وإجمالي الأقسام
  const departmentalSalariesSummary = useMemo(() => {
    let grandGrossSalary = 0;
    let grandDeductions = 0;
    let grandAdditions = 0;
    let grandNetSalary = 0;
    let grandStaffCount = 0;

    const report = HOSPITAL_DEPARTMENTS.map(dept => {
      const deptEmps = employees.filter(e => e.department === dept);
      let gross = 0;
      let deductions = 0;
      let additions = 0;
      let net = 0;

      deptEmps.forEach(emp => {
        const payrollRec = payrolls.find(p => p.employeeId === emp.id);
        if (payrollRec) {
          gross += payrollRec.totalSalary;
          deductions += payrollRec.totalDeductions;
          additions += payrollRec.totalAdditions;
          net += payrollRec.finalSalary;
        }
      });

      grandGrossSalary += gross;
      grandDeductions += deductions;
      grandAdditions += additions;
      grandNetSalary += net;
      grandStaffCount += deptEmps.length;

      return {
        department: dept,
        staffCount: deptEmps.length,
        grossSalary: gross,
        deductions,
        additions,
        netSalary: net
      };
    });

    return {
      departmentsSummary: report,
      grandGrossSalary,
      grandDeductions,
      grandAdditions,
      grandNetSalary,
      grandStaffCount
    };
  }, [employees, payrolls]);

  // تصفية الكارد الكلي للبحث العام ونطاق الراتب المتقدم
  const filteredEmployeesBySearch = useMemo(() => {
    return employees.filter(emp => {
      // 1. تصفية النص (البحث العام)
      const matchSearch = 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        emp.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        emp.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchSearch) return false;

      // 2. تصفية نطاق الراتب بناءً على مسير الرواتب المعتمد الفعلي
      const empPayroll = payrolls.find(p => p.employeeId === emp.id);
      const salary = empPayroll ? empPayroll.finalSalary : 0;

      const min = minSalary !== '' ? parseFloat(minSalary) : null;
      const max = maxSalary !== '' ? parseFloat(maxSalary) : null;

      if (min !== null && salary < min) return false;
      if (max !== null && salary > max) return false;

      return true;
    });
  }, [employees, searchTerm, payrolls, minSalary, maxSalary]);

  // إعادة تعيين الشجرة والمستشار
  const handleResetToDefault = () => {
    if (releasedMonths[selectedMonth]) {
      alert("⚠️ لا يمكن إعادة التعيين! كشف رواتب هذا الشهر صادرة ومطلقة ومغلقة حماية للحسابات.");
      return;
    }
    if (confirm("هل أنت متأكد من استعادة بيانات مستشفى الفرح الأهلي الأساسية؟ سيؤدي ذلك إلى تهيئة كل موظف وحقوله المخصصة للأقسام الـ 15 ونموذجه المحسوب.")) {
      setEmployees(INITIAL_EMPLOYEES);
      setChatMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: 'تمت إعادة تعيين كشوف الرواتب بنجاح إلى شجرة مستشفى الفرح الأهلي الافتراضية كاملة البيانات والمطابقة لمخطط الحسابات الفعلي المعنون.',
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  // تعديل سريع ومباشر على الحقول من الجدول لتسهيل عمل المحاسب يدويًا
  const handleUpdateEmployeeField = (empId: string, field: keyof Employee, value: any) => {
    if (releasedMonths[selectedMonth]) {
      alert("⚠️ كشف رواتب هذا الشهر صادرة ومغلقة! الرجاء إلغاء قفل الحسابات من شريط التحكم لإجراء تعديلات سريعة.");
      return;
    }
    setEmployees(prev => prev.map(emp => {
      if (emp.id === empId) {
        return {
          ...emp,
          [field]: value
        };
      }
      return emp;
    }));
  };

  // فتح فورم الإضافة
  const handleAddClick = () => {
    if (releasedMonths[selectedMonth]) {
      alert("⚠️ كشف رواتب هذا الشهر صادرة ومغلقة! الرجاء إلغاء قفل الحسابات من شريط التحكم قبل إضافة موظفين جدد.");
      return;
    }
    const randomCode = Math.floor(10000 + Math.random() * 90000);
    const initialDept = 'الادارة العليا';
    setEditingEmployee(null);
    setFormState({
      id: `EMP-${randomCode}`,
      name: '',
      department: initialDept,
      title: DEPARTMENT_TITLES[initialDept][0] || 'موظف رئيسي',
      status: 'active',
      baseSalary: 1200000,
      overtimeDays: 0,
      overtimeHours: 0,
      deductionDays: 0,
      deductionHours: 0,
      penalties: 0,
      workDaysCount: 30,
      notes: ''
    });
    setIsModalOpen(true);
  };

  // فتح فورم التعديل لملف الموظف بالكامل
  const handleEditClick = (emp: Employee) => {
    if (releasedMonths[selectedMonth]) {
      alert("⚠️ كشف رواتب هذا الشهر مقفلة وصادرة! الرجاء إلغاء قفل الحسابات من شريط التحكم قبل تعديل الملف.");
      return;
    }
    setEditingEmployee(emp);
    setFormState({
      ...emp,
      id: emp.id,
      name: emp.name,
      department: emp.department,
      title: emp.title,
      status: emp.status || 'active',
      notes: emp.notes || ''
    });
    setIsModalOpen(true);
  };

  // حفظ سجل الموظف الجديد أو المعدل
  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (releasedMonths[selectedMonth]) {
      alert("⚠️ غير مسموح بالحفظ! كشف رواتب هذا الشهر صادرة ومغلقة.");
      return;
    }
    if (!formState.name.trim()) {
      alert("الرجاء كتابة اسم الموظف كاملاً وبأحرف واضحة");
      return;
    }

    const savedData: Employee = {
      ...formState,
      joinedDate: editingEmployee ? editingEmployee.joinedDate : new Date().toISOString().split('T')[0]
    };

    if (editingEmployee) {
      setEmployees(prev => prev.map(emp => emp.id === editingEmployee.id ? savedData : emp));
    } else {
      setEmployees(prev => [savedData, ...prev]);
    }

    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  // معالجة تغيير القسم في الفورم وتعديل المسمى ديناميكياً بناءً على هيكلية مستشفى الفرح
  const handleFormDeptChange = (dept: string) => {
    const titles = DEPARTMENT_TITLES[dept] || [];
    setFormState((prev: any) => ({
      ...prev,
      department: dept,
      title: titles[0] || 'موظف رئيسي'
    }));
  };

  // حذف الموظف
  const handleDeleteEmployee = (id: string, name: string) => {
    if (releasedMonths[selectedMonth]) {
      alert("⚠️ كشف رواتب هذا الشهر مقفلة ومطلقة! لا يمكن إزالة الموظف إلا بعد إلغاء قفل الدورة المالية النشطة.");
      return;
    }
    if (confirm(`هل توافق على إزالة ملف الموظف "${name}" نهائياً من هيكلية المستشفى؟`)) {
      setEmployees(prev => prev.filter(emp => emp.id !== id));
    }
  };

  // إرسال استشارة إلى الحسابات المحوسبة بجيميناي
  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = {
      id: `USR-${Date.now()}`,
      sender: 'user',
      text: chatInput,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // إرسال الكشوفات الحالية كـ contextData لدعم إجابات المحاسب بجيميناي
      const contextData = payrolls.map(pr => ({
        "الاسم": pr.employeeName,
        "القسم الطبي/الإداري": pr.department,
        "المنصب": pr.title,
        "الخصومات": pr.totalDeductions,
        "إضافات وبدلات": pr.totalAdditions,
        "الراتب المستحق النهائي": pr.finalSalary
      }));

      const response = await fetch('/api/payroll-consult', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMsg.text,
          history: chatMessages.map(m => ({ sender: m.sender, text: m.text })),
          contextData: contextData
        })
      });

      if (!response.ok) {
        throw new Error('تعذر جلب الاستجابة من خادم مستشفى الفرح الأهلي للذكاء الاصطناعي');
      }

      const data = await response.json();
      const aiMsg: ChatMessage = {
        id: `AI-${Date.now()}`,
        sender: 'ai',
        text: data.text,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, aiMsg]);

    } catch (err) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: `AI-ERR-${Date.now()}`,
        sender: 'ai',
        text: 'عذراً، انقطع اتصال السيرفر المحاسبي الموحد مؤقتاً. يرجى محاولة طرح السؤال مرة ثانية، أو التأكد من إدخال مفتاح GEMINI_API_KEY السري في إعدادات المنصة.',
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, errMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // حساب المجموع والخصومات والبدلات المفلترة
  const filteredTotals = useMemo(() => {
    let salarySum = 0;
    let deductionSum = 0;
    let additionsSum = 0;

    const filteredIds = new Set(filteredEmployeesBySearch.map(e => e.id));

    payrolls.forEach(pr => {
      if (filteredIds.has(pr.employeeId)) {
        if (selectedDeptFilter === 'all' || pr.department === selectedDeptFilter) {
          salarySum += pr.finalSalary;
          deductionSum += pr.totalDeductions;
          additionsSum += pr.totalAdditions;
        }
      }
    });

    return { salarySum, deductionSum, additionsSum };
  }, [payrolls, selectedDeptFilter, filteredEmployeesBySearch]);

  // دالة المساعدة لرسم المدخلات المخصصة ديناميكياً داخل المودال
  const renderDeptSpecialInputs = () => {
    const dept = formState.department;
    
    const renderFieldInput = (label: string, field: string, placeholder = "0") => (
      <div key={field} className="space-y-1">
        <label className="font-bold text-gray-700 block text-[10px]">{label}</label>
        <input
          type="number"
          min="0"
          value={formState[field] !== undefined ? formState[field] : ''}
          placeholder={placeholder}
          onChange={(e) => setFormState((prev: any) => ({ ...prev, [field]: Number(e.target.value) }))}
          className="w-full px-3 py-2 border border-gray-200 bg-slate-50 focus:bg-white rounded-xl outline-none focus:border-teal-700 font-mono font-bold text-center text-xs"
        />
      </div>
    );

    return (
      <div className="bg-slate-50 border border-teal-100 p-4 rounded-2xl grid grid-cols-2 gap-3" id="special-dept-inputs">
        <h4 className="text-[10px] font-bold text-teal-800 col-span-2 border-b border-teal-150 pb-1.5 flex items-center gap-1.5">
          <Building className="w-3.5 h-3.5 text-teal-700" />
          البدلات والمتغيرات والرواتب المخصصة لـ ({dept})
        </h4>
        
        {dept === "الادارة العليا" && (
          <>
            {renderFieldInput("الراتب الأساسي لـ 30 يوماً", "baseSalary", "3500000")}
            {renderFieldInput("إضافي عدد أيام", "overtimeDays")}
            {renderFieldInput("إضافي عدد ساعات", "overtimeHours")}
            {renderFieldInput("استقطاع عدد أيام (غياب)", "deductionDays")}
            {renderFieldInput("استقطاع عدد ساعات (تأخير)", "deductionHours")}
            {renderFieldInput("مبلغ عقوبات مباشرة", "penalties")}
            {renderFieldInput("عدد أيام الدوام المقبولة", "workDaysCount", "30")}
          </>
        )}
        {dept === "قسم الصيدلية" && (
          <>
            {renderFieldInput("مبلغ الشفت الصباحي", "morningShiftValue", "80000")}
            {renderFieldInput("مبلغ الشفت الخفر", "nightShiftValue", "120000")}
            {renderFieldInput("أيام الشفت الصباحي", "morningShiftDays")}
            {renderFieldInput("أيام الشفت الخفر", "nightShiftDays")}
            {renderFieldInput("إضافات مالية حافزة", "additions")}
            {renderFieldInput("استقطاعات عامة عقابية", "deductions")}
          </>
        )}
        {dept === "قسم العمليات" && (
          <>
            {renderFieldInput("الراتب الإجمالي الافتراضي", "totalSalary", "2500000")}
            {renderFieldInput("مبلغ اليوم (حسب الدوام)", "dayValue", "85000")}
            {renderFieldInput("مبلغ الساعة المعتمدة", "hourValue", "10000")}
            {renderFieldInput("عدد أيام الدوام", "workDaysCount", "26")}
            {renderFieldInput("إضافات مالية", "additions")}
            {renderFieldInput("استقطاعات", "deductions")}
          </>
        )}
        {dept === "قسم النسائية والتوليد" && (
          <>
            {renderFieldInput("مبلغ اليوم الكامل", "fullDayValue", "60000")}
            {renderFieldInput("مبلغ النصف شفت", "halfShiftValue", "30000")}
            {renderFieldInput("عدد أيام الدوام", "workDaysCount", "22")}
            {renderFieldInput("إضافات مالية", "additions")}
            {renderFieldInput("استقطاعات", "deductions")}
          </>
        )}
        {dept === "قسم الكافتريا" && (
          <>
            {renderFieldInput("مبلغ اليوم المعتمد", "dayValue", "35000")}
            {renderFieldInput("مبلغ الساعة المعتمد", "hourValue", "4500")}
            {renderFieldInput("عدد أيام الدوام", "workDaysCount", "28")}
            {renderFieldInput("إضافات مالية", "additions")}
            {renderFieldInput("استقطاعات", "deductions")}
          </>
        )}
        {dept === "قسم الاطفال والخدج" && (
          <>
            {renderFieldInput("مبلغ الشفت الصباحي", "morningShiftValue", "50000")}
            {renderFieldInput("مبلغ الشفت الخفر", "nightShiftValue", "75000")}
            {renderFieldInput("أيام الشفت الصباحي", "morningShiftDaysCount")}
            {renderFieldInput("أيام الشفت الخفر", "nightShiftDaysCount")}
            {renderFieldInput("إضافات مالية", "additions")}
            {renderFieldInput("استقطاعات", "deductions")}
          </>
        )}
        {dept === "قسم السونار" && (
          <>
            {renderFieldInput("مبلغ الاستدعاء السوناري", "recallValue", "70000")}
            {renderFieldInput("عدد الاستدعاءات (الدوام)", "workDaysCount", "20")}
            {renderFieldInput("إضافات مالية", "additions")}
            {renderFieldInput("استقطاعات", "deductions")}
          </>
        )}
        {dept === "قسم اطباء الخدج المقيمين" && (
          <>
            {renderFieldInput("مبلغ اليوم الكامل", "fullDayValue", "120000")}
            {renderFieldInput("مبلغ اليوم المشترك", "jointDayValue", "160000")}
            {renderFieldInput("أيام الدوام الكامل", "fullDayCount", "15")}
            {renderFieldInput("أيام الدوام المشترك", "jointDayCount", "10")}
            {renderFieldInput("إضافات مالية", "additions")}
            {renderFieldInput("استقطاعات", "deductions")}
          </>
        )}
        {dept === "قسم المختبر ومصرف الدم" && (
          <>
            {renderFieldInput("مبلغ الصباحي للشفت", "morningShiftValue", "55000")}
            {renderFieldInput("مبلغ الخفر للشفت", "nightShiftValue", "85000")}
            {renderFieldInput("مبلغ نصف شفت", "halfShiftValue9", "30000")}
            {renderFieldInput("أيام الشفت الصباحي", "morningShiftDays9")}
            {renderFieldInput("أيام الشفت الخفر", "nightShiftDays9")}
            {renderFieldInput("أيام النصف شفت", "halfShiftDays9")}
            {renderFieldInput("إضافات مالية", "additions")}
            {renderFieldInput("استقطاعات", "deductions")}
          </>
        )}
        {dept === "قسم الاطباء المقيمين" && (
          <>
            {renderFieldInput("مبلغ اليوم لـ 12 ساعة", "dayValue12h", "110000")}
            {renderFieldInput("عدد أيام الدوام المفعّلة", "workDaysCount", "24")}
            {renderFieldInput("إضافات مالية", "additions")}
            {renderFieldInput("استقطاعات", "deductions")}
          </>
        )}
        {dept === "قسم التمريض والردهات والطواريء" && (
          <>
            {renderFieldInput("مبلغ الشفت والبديل", "shiftValue11", "45000")}
            {renderFieldInput("أيام دوام 12 ساعة", "workDays12h11", "22")}
            {renderFieldInput("إضافات مالية", "additions")}
            {renderFieldInput("استقطاعات", "deductions")}
          </>
        )}
        {dept === "قسم اطباء النسائية" && (
          <>
            {renderFieldInput("مبلغ اليوم الواحد طبيب", "dayValue", "160000")}
            {renderFieldInput("عدد أيام الدوام", "workDaysCount", "18")}
            {renderFieldInput("إضافات مالية", "additions")}
            {renderFieldInput("استقطاعات", "deductions")}
          </>
        )}
        {(dept === "قسم الاشعة" || dept === "قسم الأشعة") && (
          <div className="col-span-2 space-y-1">
            <span className="text-[10px] text-amber-700 block font-semibold mb-1">⚠️ تنبيه: يخضع هذا القسم للمبالغ القطعية الكاملة</span>
            {renderFieldInput("مبلغ الراتب القطعي الكلي للاشعة شهرياً", "radiologyTotalSum", "3000000")}
          </div>
        )}
        {(dept === "قسم الامنية" || dept === "قسم الأمنية") && (
          <div className="col-span-2 space-y-1">
            <span className="text-[10px] text-amber-700 block font-semibold mb-1">⚠️ تنبيه: حراسة الوجبات تخضع للمبالغ القطعية</span>
            {renderFieldInput("مبلغ الراتب القطعي الكلي للامنية شهرياً", "securityTotalSum", "1100000")}
          </div>
        )}
        {(dept === "قسم الاسعاف" || dept === "قسم الإسعاف") && (
          <div className="col-span-2 space-y-1">
            <span className="text-[10px] text-amber-700 block font-semibold mb-1">⚠️ تنبيه: منسبي الإسعاف الفوري مبالغ قطعية</span>
            {renderFieldInput("مبلغ الراتب القطعي الكلي للاسعاف شهرياً", "ambulanceTotalSum", "950000")}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none text-right" dir="rtl" id="hospital-main-page">
      
      {/* GLOBAL TOP PREMIUM NAVIGATION HEADER */}
      <header className="bg-white border-b border-gray-150 py-6 shadow-sm relative z-40 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-6">
          
          {/* Logo brand - Centered Professionally */}
          <div className="flex flex-col items-center text-center gap-3">
            <div className="bg-gradient-to-br from-teal-50 to-white p-2 rounded-full border border-teal-100/60 shadow-inner">
              <svg viewBox="0 0 200 200" className="w-20 h-20 shrink-0 drop-shadow-md select-none" id="hospital-brand-logo">
                {/* Outer Circle Ring Group */}
                <circle cx="100" cy="100" r="94" fill="#149cb7" stroke="#ffffff" strokeWidth="2" />
                <circle cx="100" cy="100" r="91" fill="none" stroke="#ffffff" strokeWidth="1" />
                
                {/* Define Paths for Curved Text */}
                <defs>
                  {/* Top Arc for Arabic Text */}
                  <path id="text-path-top" d="M 23 100 A 77 77 0 0 1 177 100" fill="none" />
                  {/* Bottom Arc for English Text */}
                  <path id="text-path-bottom" d="M 177 100 A 77 77 0 0 1 23 100" fill="none" />
                </defs>

                {/* Curved Texts with SVG TextPath */}
                <text fill="#ffffff" className="font-sans font-bold text-[14px]">
                  <textPath href="#text-path-top" startOffset="50%" textAnchor="middle">
                    مستشفى الفرح الأهلي
                  </textPath>
                </text>
                
                <text fill="#ffffff" className="font-sans font-extrabold text-[9.5px] uppercase tracking-[0.03em]">
                  <textPath href="#text-path-bottom" startOffset="50%" textAnchor="middle">
                    AL FARAH PRIVATE HOSPITAL
                  </textPath>
                </text>

                {/* Decorative Gold Circles on the left and right */}
                <circle cx="21" cy="100" r="3.5" fill="#cda13c" />
                <circle cx="179" cy="100" r="3.5" fill="#cda13c" />

                {/* Inner White Circle */}
                <circle cx="100" cy="100" r="62" fill="#ffffff" stroke="#149cb7" strokeWidth="1" />
                
                {/* Center Gold graphic: Tree, ECG beat & Hospital name */}
                <g transform="translate(68, 70) scale(0.33)" fill="#cda13c">
                  {/* Golden Family Tree representing Al Farah hospital */}
                  <path d="M42,75 C42,70 41,60 44,52 C46,45 42,40 37,42 C30,45 28,52 23,45 C18,38 23,30 31,34 C36,36 39,26 31,19 C24,12 17,20 12,28 C8,34 5,20 15,10 C25,0 38,12 40,2 C42,-8 48,-8 50,2 C52,12 65,0 75,10 C85,20 82,34 78,28 C73,20 66,12 59,19 C51,26 54,36 59,34 C67,30 72,38 67,45 C62,52 60,45 53,42 C48,40 44,45 46,52 C49,60 48,70 48,75 L42,75 Z" />
                  
                  {/* Stylized Care figures inside tree/gold points */}
                  <circle cx="34" cy="30" r="3.5" />
                  <circle cx="45" cy="18" r="4" />
                  <circle cx="56" cy="30" r="3.5" />
                </g>

                {/* ECG Heartbeat line passing elegantly over */}
                <path d="M 68 112 L 80 112 L 84 96 L 90 125 L 95 86 L 102 119 L 107 108 L 111 112 L 128 112" fill="none" stroke="#cda13c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Text next to the tree in Gold */}
                <g transform="translate(101, 88)">
                  <text x="0" y="0" className="font-sans font-extrabold text-[8px]" fill="#cda13c">AL FARAH</text>
                  <text x="0" y="8" className="font-sans font-bold text-[7px]" fill="#cda13c">PRIVATE</text>
                  <text x="0" y="16" className="font-sans font-bold text-[7.5px]" fill="#cda13c">HOSPITAL</text>
                  <line x1="0" y1="20" x2="28" y2="20" stroke="#cda13c" strokeWidth="0.8" />
                </g>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-sans font-black text-gray-900 tracking-tight">مستشفى الفرح الأهلي</h1>
              <span className="text-[10px] uppercase font-bold text-teal-800 tracking-widest block font-sans mt-1">نظام تدقيق وإدارة كشوفات الرواتب الإلكتروني الموحد</span>
            </div>
          </div>

          {/* Tab buttons */}
          <nav className="flex flex-wrap items-center justify-center gap-1 p-1 bg-slate-100 rounded-2xl border border-gray-150">
            <button
              onClick={() => setActiveTab('dashboard')}
              id="app-tab-dashboard-btn"
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-white text-teal-900 shadow-sm border border-slate-200'
                  : 'text-gray-500 hover:text-gray-950'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              المؤشرات العامة
            </button>

            <button
              onClick={() => setActiveTab('payroll')}
              id="app-tab-payroll-btn"
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'payroll'
                  ? 'bg-white text-teal-900 shadow-sm border border-slate-200'
                  : 'text-gray-500 hover:text-gray-950'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              جداول رواتب الأقسام
            </button>

            <button
              onClick={() => setActiveTab('dept-totals')}
              id="app-tab-dept-totals-btn"
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'dept-totals'
                  ? 'bg-white text-teal-900 shadow-sm border border-slate-200'
                  : 'text-gray-500 hover:text-gray-950'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-teal-700 font-bold" />
              مجاميع رواتب الأقسام 💰
            </button>

            <button
              onClick={() => setActiveTab('tree')}
              id="app-tab-tree-btn"
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'tree'
                  ? 'bg-white text-teal-900 shadow-sm border border-slate-200'
                  : 'text-gray-500 hover:text-gray-950'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              الهيكلية والوصف العملي للمناصب
            </button>

            <button
              onClick={() => setActiveTab('advisor')}
              id="app-tab-advisor-btn"
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'advisor'
                  ? 'bg-white text-teal-900 shadow-sm border border-slate-200'
                  : 'text-gray-500 hover:text-gray-950'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              المستشار الذكي (Gemini)
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              id="app-tab-reports-btn"
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'reports'
                  ? 'bg-white text-teal-900 shadow-sm border border-slate-200'
                  : 'text-gray-500 hover:text-gray-950'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              تخمين ومسودات الطباعة
            </button>

            <button
              onClick={() => setActiveTab('signatures')}
              id="app-tab-signatures-btn"
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'signatures'
                  ? 'bg-white text-teal-900 shadow-sm border border-slate-200'
                  : 'text-gray-500 hover:text-gray-950'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              كشوفات التوقيع والاستلام ✍️
            </button>
          </nav>

          {/* Reset Action */}
          <button
            onClick={handleResetToDefault}
            className="text-[10px] text-gray-500 border border-slate-200 bg-white shadow-sm hover:text-red-650 hover:bg-red-50/50 py-2 px-3.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer"
          >
            تهيئة وتهديم الشجرة الحالية ⚠️
          </button>

        </div>
      </header>

      {/* LOCAL MONTHS & DISBURSEMENT CONTROL SYSTEM */}
      <div className="bg-white border-b border-gray-150 py-3.5 shadow-sm print:hidden select-none" id="monthly-control-bar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Active Month Selector group */}
          <div className="flex items-center gap-3" id="active-month-selector-group">
            <div className="p-2.5 bg-teal-50 text-teal-800 rounded-xl shadow-inner border border-teal-100 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-teal-800" />
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 font-bold block">الدورة المالية النشطة وتخزين الأشهر 🗓️:</span>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <select
                  value={selectedMonth}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-gray-200 text-gray-800 font-sans font-black text-xs rounded-xl outline-none focus:border-teal-700 cursor-pointer"
                  id="month-active-system-dropdown"
                >
                  {MONTHS_LIST.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <div className="text-[10px] text-teal-850 font-sans font-bold bg-teal-100/50 border border-teal-150 px-2.5 py-1.5 rounded-xl">
                  كادر الدورة الحالي: {employees.length} موظفاً 👥
                </div>
              </div>
            </div>
          </div>

          {/* Automate release day 1 to 10 indicator & Manual lock/release buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs" id="disbursement-status-controls">
            {releasedMonths[selectedMonth] ? (
              // Status 1: Issued/Released
              <div className="flex items-center gap-3 bg-emerald-50/70 border border-emerald-200 rounded-3xl p-2.5 text-right w-full md:w-auto">
                <div className="w-8 h-8 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-md animate-pulse">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-sans font-black text-emerald-950 text-xs">صرف مالي نهائي مغلق: تم إطلاق الرواتب بنجاح (فترة الإطلاق من 1 لغاية 10 بالشهر) ✅</span>
                  </div>
                  <span className="text-[9.5px] text-gray-500 font-semibold block mt-1">مسيرات ودفاتر رواتب هذا الشهر صادرة ومحمية محاسبياً. يتيح النظام لـك فك القفل فوراً لإجراء أي تعديلات طارئة.</span>
                </div>
                <button
                  onClick={() => {
                    if (confirm("هل تريد بالفعل فك قفل هذا الشهر لإتاحة تعديل رواتب الموارد والكوادر مجدداً فوراً؟")) {
                      setReleasedMonths(prev => ({ ...prev, [selectedMonth]: false }));
                    }
                  }}
                  className="mr-auto px-3 py-1.5 bg-white border border-emerald-200 hover:bg-emerald-100 text-emerald-800 font-black text-[10px] rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Unlock className="w-3" />
                  قفل مفكوك (إلغاء قفل فوري) 🔓
                </button>
              </div>
            ) : (
              // Status 2: Draft / Preparing
              <div className="flex items-center gap-3 bg-amber-50/70 border border-amber-200 rounded-3xl p-2.5 text-right w-full md:w-auto">
                <div className="w-8 h-8 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-md">
                  <Clock className="w-4 h-4 text-white animate-spin" style={{ animationDuration: '5s' }} />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-sans font-black text-amber-950 text-xs">حالة الرواتب: قيد التحضير والتجهيز المالي (فترة الإطلاق المعتمدة 1 - 10 بالشهر) ⏱️</span>
                  </div>
                  <span className="text-[9.5px] text-gray-500 font-semibold block mt-1">تطلق الحسابات تلقائياً من 1 لغاية 10 بالشهر. يمكنك الضغط لغرض الإطلاق والصرف الفوري المباشر الآن.</span>
                </div>
                <button
                  onClick={() => {
                    const monthName = MONTHS_LIST.find(m => m.id === selectedMonth)?.name || selectedMonth;
                    if (confirm(`هل أنت متأكد من صرف وإطلاق الرواتب رسمياً لشهر [${monthName}] بالكامل بشكل فوري ومباشر؟`)) {
                      setReleasedMonths(prev => ({ ...prev, [selectedMonth]: true }));
                    }
                  }}
                  className="mr-auto px-3 py-2 bg-gradient-to-l from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-black text-[10px] rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Lock className="w-3" />
                  إطلاق وصرف رواتب فوري 🚀
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* PRIMARY VIEWS WRAPPER BODY CONTAINER */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 print:py-0 print:px-0">
        
        {/* VIEW 1: INDEX GRAPH STATS */}
        {activeTab === 'dashboard' && (
          <Dashboard 
            employees={employees} 
            payrolls={payrolls} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
          />
        )}

        {/* VIEW 2: SPECIAL DEPARTMENT PAYROLL TABLES */}
        {activeTab === 'payroll' && (
          <div className="space-y-6">
            
            {/* Header description */}
            <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-black text-gray-800 text-sm">مسير رواتب مستشفى الفرح المعتمد التفصيلي يدوياً</h3>
                <p className="text-gray-400 text-xs">اختر القسم الخاص من القائمة لعرضه وتحديث بيانات شفتاته وأيامه بشكل منفصل، أو اختر كافة الأقسام معاً.</p>
              </div>
              <button
                onClick={handleAddClick}
                className="px-4 py-2.5 bg-teal-800 text-white hover:bg-teal-900 rounded-xl shadow-sm text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-white" />
                إضافة موظف جديد بالقسم 👤
              </button>
            </div>

            {/* Department Navigation Tabs & Filter Options - Arranged Horizontally with World-Class Brand Cards */}
            <div className="space-y-6" id="horizontal-departments-dashboard">
              
              {/* Horizontal List of Departments with Professional Visual Highlights */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-150 shadow-sm space-y-3.5 print:hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-700 to-teal-500 text-white flex items-center justify-center shadow-md">
                      <Building className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-sans font-black text-gray-900 text-xs">أقسام مستشفى الفرح الـ 15 المعتمدة للرواتب والأجور 🏥</h3>
                      <p className="text-gray-400 text-[10px] mt-0.5">اضغط على أي قسم لعرض كادر العمل ومسير الأوراق وتعديل مخصصاتهم بشكل مستقل فوري، أو اعرض جميع الأقسام معاً.</p>
                    </div>
                  </div>
                  <div className="bg-teal-50 border border-teal-150 px-3 py-1.5 rounded-2xl flex items-center gap-1.5 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
                    <span className="text-[10px] text-teal-900 font-sans font-black">إجمالي كادر المستشفى: {employees.length} موظفاً</span>
                  </div>
                </div>

                {/* Highly Crafted Grid of Professional Icons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
                  <button
                    onClick={() => setSelectedDeptFilter('all')}
                    className={`text-right p-3 text-[11px] font-bold rounded-2xl transition-all duration-200 flex flex-col items-center justify-center gap-2 border-2 cursor-pointer shadow-sm relative group hover:shadow-md ${
                      selectedDeptFilter === 'all'
                        ? 'bg-gradient-to-br from-teal-800 to-teal-900 border-teal-900 text-white font-black scale-[1.02] ring-4 ring-teal-100'
                        : 'bg-slate-50 border-slate-200 text-gray-750 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className={`p-2 rounded-xl transition-all duration-200 ${selectedDeptFilter === 'all' ? 'bg-white/20 text-white' : 'bg-teal-50 text-teal-850'}`}>
                      <Building className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />
                    </div>
                    <span className="font-black truncate text-center w-full">كافة الأقسام المعزولة</span>
                    <span className={`absolute top-1.5 left-1.5 font-sans px-2 py-0.5 rounded-lg text-[9px] font-black ${selectedDeptFilter === 'all' ? 'bg-white text-teal-950 shadow-sm' : 'bg-slate-200 text-gray-700 border border-slate-300'}`}>
                      {employees.length}
                    </span>
                  </button>

                  {HOSPITAL_DEPARTMENTS.map(dept => {
                    const deptEmpsCount = employees.filter(e => e.department === dept).length;
                    const info = DEPARTMENT_ICONS[dept] || { icon: Building, color: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200" };
                    const IconComp = info.icon;
                    const isActive = selectedDeptFilter === dept;

                    return (
                      <button
                        key={dept}
                        onClick={() => setSelectedDeptFilter(dept)}
                        className={`text-right p-3 text-[11px] font-bold rounded-2xl transition-all duration-200 flex flex-col items-center justify-center gap-2 border-2 cursor-pointer shadow-sm relative group hover:shadow-md ${
                          isActive
                            ? 'bg-teal-50/70 border-teal-500 text-teal-950 font-black scale-[1.02] ring-4 ring-teal-50'
                            : 'bg-white border-gray-200 text-gray-705 hover:bg-slate-50/50 hover:border-slate-300'
                        }`}
                      >
                        {/* Beautifully Crafted Circular Icon Ring */}
                        <div className={`p-2 rounded-xl transition-all duration-200 border ${info.bg} ${info.color} ${info.border} ${isActive ? 'scale-110 shadow-sm' : ''}`}>
                          <IconComp className="w-5 h-5 shrink-0 transition-transform group-hover:scale-115" />
                        </div>
                        <span className="font-extrabold truncate text-center w-full block" title={dept}>
                          {dept.replace("قسم ", "")}
                        </span>
                        <span className={`absolute top-1.5 left-1.5 font-sans px-2 py-0.5 rounded-lg text-[9px] font-black ${
                          isActive ? 'bg-teal-700 text-white shadow-sm' : 'bg-slate-100 border border-slate-200 text-gray-500'
                        }`}>
                          {deptEmpsCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Printable Area / Left Worksheets Flow Layout - Spans Full Width */}
              <div className="space-y-6">
                
                {/* Advanced Multi-Filter Panel: Search & Salary range */}
                <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-150 print:hidden shadow-sm space-y-4">
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                    
                    {/* General Text Search */}
                    <div className="flex-1 bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-gray-200 flex items-center gap-2">
                      <Search className="w-4.5 h-4.5 text-gray-400 shrink-0 ml-1" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="ابحث بالاسم، المسمى الوظيفي، أو الكود في كافة أقسام مستشفى الفرح..."
                        className="w-full text-xs font-bold outline-none bg-transparent placeholder-gray-400 text-right text-gray-800"
                      />
                      {searchTerm && (
                        <button 
                          onClick={() => setSearchTerm('')} 
                          className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Salary Range Filter Control Group */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                        <span className="text-[11px] font-black text-gray-750 shrink-0">نطاق راتب الموظف المستحق (د.ع):</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="الحد الأدنى لغاية"
                          value={minSalary}
                          onChange={(e) => setMinSalary(e.target.value)}
                          className="w-28 sm:w-32 px-3 py-2 bg-slate-50 border border-gray-200 text-xs font-sans font-extrabold text-center rounded-xl outline-none focus:border-teal-700 transition-all text-gray-900"
                        />
                        <span className="text-gray-450 text-[11px] font-black shrink-0">إلى</span>
                        <input
                          type="number"
                          placeholder="الحد الأقصى لغاية"
                          value={maxSalary}
                          onChange={(e) => setMaxSalary(e.target.value)}
                          className="w-28 sm:w-32 px-3 py-2 bg-slate-50 border border-gray-200 text-xs font-sans font-extrabold text-center rounded-xl outline-none focus:border-teal-700 transition-all text-gray-900"
                        />

                        {/* Clear/Reset button */}
                        {(minSalary || maxSalary || searchTerm) && (
                          <button
                            onClick={() => {
                              setMinSalary('');
                              setMaxSalary('');
                              setSearchTerm('');
                            }}
                            className="px-3 py-2 bg-red-50 border border-red-100 hover:bg-red-100 text-red-700 font-sans font-black text-[10.5px] rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
                            title="تصفير كافة الفلاتر والبحث"
                          >
                            إعادة ضبط 🔄
                          </button>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Preset Quick Range Selectors */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100 text-[10.5px]">
                    <span className="text-teal-900 font-sans font-black ml-1.5 flex items-center gap-1">
                      <span>💡</span>
                      <span>تحديد نطاق راتب سريع ومقترح:</span>
                    </span>
                    <button
                      onClick={() => { setMinSalary(''); setMaxSalary('500000'); }}
                      className={`px-3 py-1.5 rounded-xl border-2 transition-all cursor-pointer font-extrabold ${
                        (minSalary === '' && maxSalary === '500000') 
                          ? 'bg-teal-850 border-teal-850 text-white shadow-sm' 
                          : 'bg-slate-50 border-gray-150 text-gray-650 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      أقل من 500,000 د.ع
                    </button>
                    <button
                      onClick={() => { setMinSalary('500000'); setMaxSalary('1000000'); }}
                      className={`px-3 py-1.5 rounded-xl border-2 transition-all cursor-pointer font-extrabold ${
                        (minSalary === '500000' && maxSalary === '1000000') 
                          ? 'bg-teal-850 border-teal-850 text-white shadow-sm' 
                          : 'bg-slate-50 border-gray-150 text-gray-650 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      من 500,000 إلى 1,000,000 د.ع
                    </button>
                    <button
                      onClick={() => { setMinSalary('1000000'); setMaxSalary('2000000'); }}
                      className={`px-3 py-1.5 rounded-xl border-2 transition-all cursor-pointer font-extrabold ${
                        (minSalary === '1000000' && maxSalary === '2000000') 
                          ? 'bg-teal-850 border-teal-850 text-white shadow-sm' 
                          : 'bg-slate-50 border-gray-150 text-gray-650 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      من 1,000,000 إلى 2,000,000 د.ع
                    </button>
                    <button
                      onClick={() => { setMinSalary('2000000'); setMaxSalary(''); }}
                      className={`px-3 py-1.5 rounded-xl border-2 transition-all cursor-pointer font-extrabold ${
                        (minSalary === '2000000' && maxSalary === '') 
                          ? 'bg-teal-850 border-teal-850 text-white shadow-sm' 
                          : 'bg-slate-50 border-gray-150 text-gray-650 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      أكثر من 2,000,000 د.ع
                    </button>
                  </div>
                </div>

                {/* Live Totals Card For current filtered state */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden">
                  <div className="bg-[#f0fdf4] border border-[#dcfce7] p-3.5 rounded-xl text-center shadow-sm">
                    <span className="text-[10px] text-green-700 font-bold block mb-1">صافي الرواتب المستحقة</span>
                    <span className="font-sans text-base font-black text-green-900">{filteredTotals.salarySum.toLocaleString()} د.ع</span>
                  </div>
                  <div className="bg-[#fef2f2] border border-[#fee2e2] p-3.5 rounded-xl text-center shadow-sm">
                    <span className="text-[10px] text-red-750 font-bold block mb-1">مجموع العقوبات والاستقطاعات الكلية</span>
                    <span className="font-sans text-base font-black text-red-905">{filteredTotals.deductionSum.toLocaleString()} د.ع</span>
                  </div>
                  <div className="bg-[#f0f9ff] border border-[#e0f2fe] p-3.5 rounded-xl text-center shadow-sm">
                    <span className="text-[10px] text-sky-700 font-bold block mb-1">إجمالي البدلات والإضافات العامة</span>
                    <span className="font-sans text-base font-black text-sky-900">{filteredTotals.additionsSum.toLocaleString()} د.ع</span>
                  </div>
                </div>

                {/* Render separate tables uniquely for the selected departments */}
                {HOSPITAL_DEPARTMENTS.filter(d => selectedDeptFilter === 'all' || d === selectedDeptFilter).map(dept => {
                  // تصفية موظفي هذا القسم المحدّد بناءً على البحث
                  const deptEmps = filteredEmployeesBySearch.filter(e => e.department === dept);
                  
                  // لو كنا نعرض كافة الأقسام وتصفية البحث أخفت موظفي قسم؛ لا نرسم جدول القسم فارغاً لتحسين تجربة المستخدم
                  if (selectedDeptFilter === 'all' && deptEmps.length === 0 && searchTerm) return null;

                  return (
                    <div key={dept} className="space-y-2 border-r-4 border-teal-700 bg-white p-4 rounded-3xl border border-gray-150 shadow-sm" id={`dept-panel-${dept}`}>
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] bg-teal-800 text-white font-sans font-bold px-2.5 py-1 rounded-lg shadow-sm">
                          رواتب قسم منفصل 🏷️
                        </span>
                        <h4 className="font-black text-gray-850 text-xs">{dept}</h4>
                      </div>
                      
                      <DepartmentPayrollTable 
                        department={dept}
                        employees={deptEmps}
                        onUpdateField={handleUpdateEmployeeField}
                        onEditClick={handleEditClick}
                        onDeleteClick={handleDeleteEmployee}
                        isLocked={releasedMonths[selectedMonth]}
                      />
                    </div>
                  );
                })}

              </div>

            </div>

          </div>
        )}

        {/* VIEW 3: HOSPITAL DEPARTMENTS DESCRIPTION & STRUCTURAL VIEW */}
        {activeTab === 'tree' && (
          <div className="space-y-6 animate-fade-in" id="tree-view-pane">
            
            {/* Top header desc */}
            <div className="bg-white p-5 rounded-3xl border border-gray-150 shadow-sm space-y-1">
              <h3 className="font-black text-gray-900 text-sm">الهيكلية التنظيمية وأوصاف الاحتساب للأفرع الطبية</h3>
              <p className="text-gray-400 text-xs">مخطط تفصيلي لكيفية توزيع الكوادر الحسابية وتصنيف المعاملات ومقارنة أنظمة احتساب الشفتات والساعات لمستشفى الفرح.</p>
            </div>

             {/* General Description grid list */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {HOSPITAL_DEPARTMENTS.map((dept, i) => {
                 const emps = employees.filter(e => e.department === dept);
                 const titles = DEPARTMENT_TITLES[dept] || [];
                 const info = DEPARTMENT_ICONS[dept] || { icon: Building, color: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200" };
                 const IconComp = info.icon;
                 
                 return (
                   <motion.div 
                     key={dept} 
                     whileHover={{ y: -4, scale: 1.01 }}
                     className="bg-white border border-gray-150 rounded-2xl p-5 hover:border-teal-300 hover:shadow-md transition-all space-y-4 relative overflow-hidden"
                   >
                     <div className="flex items-start justify-between">
                       <div className="space-y-1 text-right">
                         <span className="font-mono text-gray-400 text-[10px] block">قسم رقم {String(i + 1).padStart(2, '0')}</span>
                         <h4 className="font-extrabold text-gray-900 text-xs">{dept}</h4>
                       </div>
                       <div className={`p-2.5 rounded-xl ${info.bg} ${info.color} ${info.border} border shadow-inner shrink-0`}>
                         <IconComp className="w-5 h-5" />
                       </div>
                     </div>
                     
                     <div className="space-y-2 text-xs">
                       <span className="text-[10px] text-teal-850 block font-bold">المناصب والمسميات الرسمية بالقسم:</span>
                       <div className="flex flex-wrap gap-1">
                         {titles.map(t => (
                           <span key={t} className="px-2.5 py-1 bg-slate-50 border border-slate-100 text-slate-700 text-[10px] rounded-lg font-bold">{t}</span>
                         ))}
                       </div>
                     </div>

                     <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] text-gray-400">
                       <span className="font-semibold text-gray-450">إجمالي عدد الكادر النشط:</span>
                       <span className="font-sans font-black text-teal-900 bg-teal-50/70 border border-teal-100 px-2.5 py-0.5 rounded-lg text-xs">{emps.length} موظفاً</span>
                     </div>
                   </motion.div>
                 );
               })}
             </div>

          </div>
        )}

        {/* VIEW 4: INTELLIGENT AI COPILOT CONSULTANT */}
        {activeTab === 'advisor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[620px] items-stretch animate-fade-in text-right" id="advisor-view-container" dir="rtl">
            
            {/* Right: Calculations Auditor Form & Inputs (col-span-12 on Mobile, col-span-5 on Desktop) */}
            <div className="lg:col-span-5 bg-white border border-gray-200 rounded-3xl p-5 shadow-md flex flex-col justify-between space-y-4" id="ai-auditor-form-panel">
              <div className="space-y-4">
                {/* Header title */}
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl shadow-inner">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-sans font-black text-gray-800 text-xs">مدقق الحسابات والامتثال المالي ⚡</h4>
                    <p className="text-gray-400 text-[10px] mt-0.5">افحص صحة المعادلة الحسابية للقسم بذكاء جيميناي</p>
                  </div>
                </div>

                {/* Step 1: Select Department Rule */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-700 block">1. اختر قواعد القسم الطبي/الإداري المستهدف:</label>
                  <select
                    value={auditDept}
                    onChange={(e) => setAuditDept(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:border-teal-700 rounded-xl outline-none font-bold bg-slate-50 text-xs text-gray-800"
                  >
                    {HOSPITAL_DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Step 2: Input 1 Configuration */}
                <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-gray-150 space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 block">نوع ومسمى القيمة الأولى:</label>
                    <select
                      value={auditLabel1}
                      onChange={(e) => setAuditLabel1(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-[11px] font-bold bg-white text-gray-800 outline-none focus:border-amber-500"
                    >
                      <option value="الراتب الأساسي لـ 30 يوماً">الراتب الأساسي لـ 30 يوماً (د.ع)</option>
                      <option value="عدد أيام الدوام المنجزة">عدد أيام الدوام المطبقة</option>
                      <option value="مبلغ الشفت الصباحي">مبلغ الشفت الواحد (الصباحي)</option>
                      <option value="قيمة الشفت الخفر الكلية">مبلغ الشفت الخفر</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-700 block">أدخل القيمة الحسابية الأولى:</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="أدخل رقماً، مثلاً: 1200000 أو 25"
                        value={auditVal1}
                        onChange={(e) => setAuditVal1(e.target.value)}
                        className="w-full font-mono text-left px-3 py-2 text-xs font-semibold border border-gray-200 focus:border-amber-500 rounded-lg outline-none bg-white"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 font-bold pointer-events-none">قيمة 1</span>
                    </div>
                  </div>
                </div>

                {/* Step 3: Input 2 Configuration */}
                <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-gray-150 space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 block">نوع ومسمى القيمة الثانية:</label>
                    <select
                      value={auditLabel2}
                      onChange={(e) => setAuditLabel2(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-[11px] font-bold bg-white text-gray-800 outline-none focus:border-amber-500"
                    >
                      <option value="أيام الدوام أو شفتات الخفر">عدد الأيام / الشفتات الإضافية</option>
                      <option value="عدد أيام الاستقطاع (الغياب)">عدد أيام الاستقطاع (غياب)</option>
                      <option value="ساعات الاستقطاع (التأخير)">ساعات الاستقطاع (تأخير)</option>
                      <option value="مبلغ بدلات ومكافآت">مبلغ المكافآت أو الإضافيات كقيمة</option>
                      <option value="الراتب النهائي المحتسب">الراتب النهائي المراد مطابقته (د.ع)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-700 block">أدخل القيمة الحسابية الثانية:</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="مثلاً: 5 أو 30000"
                        value={auditVal2}
                        onChange={(e) => setAuditVal2(e.target.value)}
                        className="w-full font-mono text-left px-3 py-2 text-xs font-semibold border border-gray-200 focus:border-amber-500 rounded-lg outline-none bg-white"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 font-bold pointer-events-none">قيمة 2</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action and feedback */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleSendAuditRequest}
                  disabled={isChatLoading}
                  className="w-full py-3 bg-gradient-to-l from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-black text-xs rounded-xl shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-white animate-spin" style={{ animationDuration: '3s' }} />
                  تحقق حسابياً واطلب امتثال جيميناي 🔎
                </button>
                <p className="text-gray-400 text-[9px] text-center leading-normal">
                  سوف يتدخل جيميناي مباشرة في المحادثة الجانبية ليوضح لك آلية الحساب خطوة بخطوة بالاستناد لمعادلة هذا القسم الطبي المسجل لدينا.
                </p>
              </div>
            </div>

            {/* Left Column: Smart Advisor Chat (col-span-12 on Mobile, col-span-7 on Desktop) */}
            <div className="lg:col-span-7 bg-white border border-gray-250 rounded-3xl overflow-hidden shadow-lg flex flex-col h-[500px] lg:h-full" id="chat-pane font-bold">
              
              {/* Chat header area */}
              <div className="bg-gradient-to-l from-teal-900 via-teal-800 to-teal-950 p-4 text-white flex items-center justify-between shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white animate-pulse" />
                  </div>
                  <div className="text-right">
                    <h3 className="font-sans font-bold text-xs">المستشار المالي والرواتب الذكي لمستشفى الفرح</h3>
                    <span className="text-[9px] text-teal-200 block mt-0.5 font-bold">مدعوم بذكاء Gemini 3.5 وتدريب الأقسام الطبية والرواتب</span>
                  </div>
                </div>
              </div>

              {/* Messages box list */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50 flex flex-col scrollbar-thin">
                {chatMessages.map(msg => (
                  <div 
                    key={msg.id} 
                    className={`w-fit max-w-[85%] rounded-2xl p-3.5 text-xs shadow-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-teal-850 text-white self-end rounded-br-none font-bold'
                        : msg.text.startsWith('طلب تدقيق مالي') 
                          ? 'bg-amber-50 border border-amber-200 text-amber-950 self-end rounded-br-none font-semibold text-right'
                          : 'bg-white border border-gray-200 text-gray-850 self-start rounded-bl-none text-right font-semibold'
                    }`}
                    style={{ whiteSpace: 'pre-wrap' }}
                  >
                    <span className="text-[9px] opacity-60 block mb-1 font-mono">{msg.timestamp}</span>
                    <p>{msg.text}</p>
                  </div>
                ))}
                
                {isChatLoading && (
                  <div className="bg-white border border-gray-200 text-gray-500 self-start rounded-2xl p-3 text-xs flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-teal-700 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-teal-700 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-teal-700 rounded-full animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[10px] font-bold">يتم الآن التحقق من دقة الحسابات بناءً على قواعد قسمك المختار... 📊</span>
                  </div>
                )}
              </div>

              {/* Text send input field */}
              <div className="p-3 border-t border-gray-200 bg-white flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  placeholder="اسأل المستشار: كم ميزانية قسم العمليات؟ أو ما هي آلية خصومات قسم التمريض؟..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                  className="w-full text-xs font-semibold px-4 py-2.5 border border-gray-200 focus:border-teal-700 outline-none rounded-xl bg-slate-50/40"
                />
                <button
                  onClick={handleSendChatMessage}
                  disabled={isChatLoading || !chatInput.trim()}
                  className="px-4 py-2.5 bg-teal-800 text-white font-bold rounded-xl text-xs hover:bg-teal-900 disabled:opacity-40 transition-colors shrink-0 cursor-pointer"
                >
                  إرسال الاستشارة
                </button>
              </div>

            </div>

          </div>
        )}

        {/* VIEW 5: PRINTABLE REPORT MANAGER */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            
            {/* Header selection card */}
            <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
              <div className="space-y-1 text-right">
                <h3 className="font-black text-gray-900 text-sm">توليد وطباعة التقارير المحاسبية مع كشوف الوقت والتاريخ</h3>
                <p className="text-gray-400 text-xs">قم بتحديد كشف القسم المراد توليد نسخته الورقية، ثم انقر على "طباعة التقرير" لطباعته أو حفظه كملف PDF مدمج مع الوقت وتاريخ التدقيق.</p>
              </div>
              
              <div className="flex items-center gap-3">
                <select
                  value={currentPrintDept}
                  onChange={(e) => setCurrentPrintDept(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-teal-700 font-bold bg-white text-xs"
                >
                  <option value="all">كافة الأقسام الطبية والإدارية معاً</option>
                  {HOSPITAL_DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 bg-teal-800 text-white hover:bg-teal-900 rounded-xl shadow-md text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  <Printer className="w-4 h-4 text-white" />
                  طباعة الكشف الورقي الفوري
                </button>

                <button
                  onClick={handleExportPDF}
                  disabled={isExportingPDF}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                  id="pdf-export-button"
                >
                  <FileDown className={`w-4 h-4 text-white ${isExportingPDF ? 'animate-bounce' : ''}`} />
                  {isExportingPDF ? 'جاري تصدير الـ PDF...' : 'تصدير إلى PDF 📄'}
                </button>
              </div>
            </div>

            {/* Printable canvas mockup container */}
            <div className="bg-white border border-gray-250 p-8 rounded-3xl shadow-xl space-y-8 print:p-0 print:border-none print:shadow-none" id="printable-area-mockup">
              
              {/* Report banner */}
              <div className="border-b-4 border-teal-800 pb-5 flex items-center justify-between">
                <div className="flex items-center gap-4 text-right">
                  <svg viewBox="0 0 200 200" className="w-16 h-16 shrink-0 select-none" id="hospital-brand-logo-print">
                    {/* Outer Circle Ring Group */}
                    <circle cx="100" cy="100" r="94" fill="#149cb7" stroke="#ffffff" strokeWidth="2" />
                    <circle cx="100" cy="100" r="91" fill="none" stroke="#ffffff" strokeWidth="1" />
                    
                    {/* Define Paths for Curved Text */}
                    <defs>
                      {/* Top Arc for Arabic Text */}
                      <path id="text-path-top-print" d="M 23 100 A 77 77 0 0 1 177 100" fill="none" />
                      {/* Bottom Arc for English Text */}
                      <path id="text-path-bottom-print" d="M 177 100 A 77 77 0 0 1 23 100" fill="none" />
                    </defs>

                    {/* Curved Texts with SVG TextPath */}
                    <text fill="#ffffff" className="font-sans font-bold text-[14px]">
                      <textPath href="#text-path-top-print" startOffset="50%" textAnchor="middle">
                        مستشفى الفرح الأهلي
                      </textPath>
                    </text>
                    
                    <text fill="#ffffff" className="font-sans font-extrabold text-[9.5px] uppercase tracking-[0.03em]">
                      <textPath href="#text-path-bottom-print" startOffset="50%" textAnchor="middle">
                        AL FARAH PRIVATE HOSPITAL
                      </textPath>
                    </text>

                    {/* Decorative Gold Circles on the left and right */}
                    <circle cx="21" cy="100" r="3.5" fill="#cda13c" />
                    <circle cx="179" cy="100" r="3.5" fill="#cda13c" />

                    {/* Inner White Circle */}
                    <circle cx="100" cy="100" r="62" fill="#ffffff" stroke="#149cb7" strokeWidth="1" />
                    
                    {/* Center Gold graphic: Tree, ECG beat & Hospital name */}
                    <g transform="translate(68, 70) scale(0.33)" fill="#cda13c">
                      {/* Golden Family Tree representing Al Farah hospital */}
                      <path d="M42,75 C42,70 41,60 44,52 C46,45 42,40 37,42 C30,45 28,52 23,45 C18,38 23,30 31,34 C36,36 39,26 31,19 C24,12 17,20 12,28 C8,34 5,20 15,10 C25,0 38,12 40,2 C42,-8 48,-8 50,2 C52,12 65,0 75,10 C85,20 82,34 78,28 C73,20 66,12 59,19 C51,26 54,36 59,34 C67,30 72,38 67,45 C62,52 60,45 53,42 C48,40 44,45 46,52 C49,60 48,70 48,75 L42,75 Z" />
                      
                      {/* Stylized Care figures inside tree/gold points */}
                      <circle cx="34" cy="30" r="3.5" />
                      <circle cx="45" cy="18" r="4" />
                      <circle cx="56" cy="30" r="3.5" />
                    </g>

                    {/* ECG Heartbeat line passing elegantly over */}
                    <path d="M 68 112 L 80 112 L 84 96 L 90 125 L 95 86 L 102 119 L 107 108 L 111 112 L 128 112" fill="none" stroke="#cda13c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Text next to the tree in Gold */}
                    <g transform="translate(101, 88)">
                      <text x="0" y="0" className="font-sans font-extrabold text-[8px]" fill="#cda13c">AL FARAH</text>
                      <text x="0" y="8" className="font-sans font-bold text-[7px]" fill="#cda13c">PRIVATE</text>
                      <text x="0" y="16" className="font-sans font-bold text-[7.5px]" fill="#cda13c">HOSPITAL</text>
                      <line x1="0" y1="20" x2="28" y2="20" stroke="#cda13c" strokeWidth="0.8" />
                    </g>
                  </svg>
                  <div className="space-y-1">
                    <h1 className="text-lg font-black text-gray-900 font-sans">مستشفى الفرح الأهلي للأمراض الطبية والجراحية</h1>
                    <p className="text-xs text-teal-800 font-extrabold pb-1">قسم تدقيق والمالية العام - التقرير الحسابي لعام {new Date().getFullYear()}</p>
                    <p className="text-[10px] text-gray-400 font-sans font-bold">تصميم مطابق للهيكلية الإدارية والمالية الرسمية المعتمدة</p>
                  </div>
                </div>
                <div className="text-left space-y-1.5 text-xs text-gray-400">
                  <p className="font-bold">حالة التقرير: <span className="text-teal-800">نشط ومدقق ومصدق 🛑</span></p>
                  <p className="text-[10px] font-bold">تاريخ وقت توليد التقرير للطباعة الحالية:</p>
                  <p className="text-[11px] font-sans font-black text-gray-800 bg-slate-100 p-1.5 rounded-lg border border-slate-200">{printDateString}</p>
                </div>
              </div>

              {/* General Aggregated Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4" id="report-stats">
                <div className="border border-slate-200 p-3.5 rounded-xl text-center">
                  <span className="text-[10px] text-gray-450 block font-bold mb-0.5">عدد الموظفين بالقسام</span>
                  <span className="font-sans text-sm font-black text-gray-800">
                    {currentPrintDept === 'all' 
                      ? employees.length 
                      : employees.filter(e => e.department === currentPrintDept).length} موظفاً
                  </span>
                </div>
                <div className="border border-slate-200 p-3.5 rounded-xl text-center">
                  <span className="text-[10px] text-gray-450 block font-bold mb-0.5">صافي الرواتب المستحقة</span>
                  <span className="font-sans text-sm font-black text-teal-900">{filteredTotals.salarySum.toLocaleString()} د.ع</span>
                </div>
                <div className="border border-slate-200 p-3.5 rounded-xl text-center">
                  <span className="text-[10px] text-gray-450 block font-bold mb-0.5">قيمة الخصومات المستقطعة</span>
                  <span className="font-sans text-sm font-black text-red-750">{filteredTotals.deductionSum.toLocaleString()} د.ع</span>
                </div>
                <div className="border border-slate-200 p-3.5 rounded-xl text-center">
                  <span className="text-[10px] text-gray-450 block font-bold mb-0.5">قيمة الإضافات والبدلات المدفوعة</span>
                  <span className="font-sans text-sm font-black text-sky-800">{filteredTotals.additionsSum.toLocaleString()} د.ع</span>
                </div>
              </div>

              {/* List of department structures */}
              <div className="space-y-8 select-text">
                {HOSPITAL_DEPARTMENTS.filter(d => currentPrintDept === 'all' || d === currentPrintDept).map(dept => {
                  const deptEmps = employees.filter(e => e.department === dept);
                  if (deptEmps.length === 0) return null;

                  return (
                    <div key={dept} className="space-y-3 break-inside-avoid">
                      <div className="border-b-2 border-slate-800 pb-1 flex items-center justify-between">
                        <span className="text-xs text-gray-400 font-bold font-sans">عدد الكادر: {deptEmps.length} موظفين صنف {dept}</span>
                        <h3 className="font-black text-gray-900 text-xs">{dept}</h3>
                      </div>

                      <DepartmentPayrollTable 
                        department={dept}
                        employees={deptEmps}
                        onUpdateField={() => {}}
                        onEditClick={() => {}}
                        onDeleteClick={() => {}}
                        isPrintMode={true}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Report signature block */}
              <div className="pt-8 border-t border-dashed border-gray-300 grid grid-cols-3 text-center text-xs leading-relaxed font-semibold">
                <div>
                  <p className="text-gray-400">توقيع محاسب الرواتب:</p>
                  <p className="mt-8">......................................</p>
                </div>
                <div>
                  <p className="text-gray-400">توقيع المدير الإداري:</p>
                  <p className="mt-8">......................................</p>
                </div>
                <div>
                  <p className="text-gray-400">مصادقة مكتب المدير التنفيذي الأقدم:</p>
                  <p className="mt-8">......................................</p>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* VIEW 6: SIGNATURES AND ACKNOWLEDGEMENT MANIFEST */}
        {activeTab === 'signatures' && (
          <div className="space-y-6 text-right animate-fade-in" id="signatures-view-tab" dir="rtl">
            
            {/* Control Panel (Hidden on Printing) */}
            <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden" id="signatures-control-panel">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl shadow-inner">
                    <UserCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-sans font-black text-gray-800 text-xs">دفاتر وكشوفات توقيع استلام الرواتب الشهري ✍️</h3>
                    <p className="text-gray-400 text-[10px] mt-0.5">شاشة مستقلة للمحاسبة تستمد أسماء المنتسبين تلقائياً لطباعة كشف التوثيق واستلام المستحقات المالية.</p>
                  </div>
                </div>
              </div>

              {/* Filtering & Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 font-bold block shrink-0">تصفية القسم:</span>
                  <select
                    value={signatureFilterDept}
                    onChange={(e) => setSignatureFilterDept(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-gray-200 text-gray-800 font-sans font-bold text-xs rounded-xl outline-none focus:border-teal-700 cursor-pointer"
                  >
                    <option value="all">كافة أقسام مستشفى الفرح الأربعة عشر</option>
                    {HOSPITAL_DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-white" />
                  طباعة الكشوفات الفورية 🖨️
                </button>
              </div>
            </div>

            {/* Printable Document Board */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-md print:shadow-none print:border-none print:p-0" id="signatures-printable-area">
              
              {/* Report Header Logo & Banner */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-slate-900 pb-5 mb-6 text-right">
                <div className="flex items-center gap-3">
                  <svg viewBox="0 0 200 200" className="w-16 h-16 shrink-0 drop-shadow-md select-none" id="hospital-brand-logo-print">
                    <circle cx="100" cy="100" r="94" fill="#149cb7" stroke="#ffffff" strokeWidth="2" />
                    <circle cx="100" cy="100" r="91" fill="none" stroke="#ffffff" strokeWidth="1" />
                    <circle cx="100" cy="100" r="62" fill="#ffffff" stroke="#149cb7" strokeWidth="1" />
                    <g transform="translate(68, 70) scale(0.33)" fill="#cda13c">
                      <path d="M42,75 C42,70 41,60 44,52 C46,45 42,40 37,42 C30,45 28,52 23,45 C18,38 23,30 31,34 C36,36 39,26 31,19 C24,12 17,20 12,28 C8,34 5,20 15,10 C25,0 38,12 40,2 C42,-8 48,-8 50,2 C52,12 65,0 75,10 C85,20 82,34 78,28 C73,20 66,12 59,19 C51,26 54,36 59,34 C67,30 72,38 67,45 C62,52 60,45 53,42 C48,40 44,45 46,52 C49,60 48,70 48,75 L42,75 Z" />
                      <circle cx="34" cy="30" r="3.5" />
                      <circle cx="45" cy="18" r="4" />
                      <circle cx="56" cy="30" r="3.5" />
                    </g>
                    <path d="M 68 112 L 80 112 L 84 96 L 90 125 L 95 86 L 102 119 L 107 108 L 111 112 L 128 112" fill="none" stroke="#cda13c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div>
                    <h2 className="text-sm font-sans font-black text-gray-900">مستشفى الفرح الأهلي - الإدارة المالية وشؤون الموظفين</h2>
                    <p className="text-[10px] text-gray-400 font-bold block mt-0.5">كشوف استلام الرواتب والتوقيع والبصمة اليدوية للكوادر</p>
                  </div>
                </div>

                <div className="text-right md:text-left">
                  <span className="inline-block px-3 py-1 bg-teal-50 border border-teal-150 text-teal-900 font-sans font-black text-xs rounded-xl mb-1">
                    {MONTHS_LIST.find(m => m.id === selectedMonth)?.arabicName || selectedMonth}
                  </span>
                  <p className="text-[10px] text-gray-450 font-bold block">تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</p>
                </div>
              </div>

              {/* Warning/Notes Banner (Hidden on printing for maximum clean aesthetics) */}
              <div className="bg-indigo-50/50 border border-indigo-150 rounded-2xl p-4 mb-6 text-indigo-950 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs leading-relaxed font-semibold print:hidden">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                  <p>
                    <strong>تعليمات الاستلام الرسمية:</strong> يرجى التأكد من استكمال التواقيع أو إبهام البصام لمنتسبي قسمكم. هذه القائمة تعكس الأسماء والرواتب المدخلة مباشرة في النظام للشهر المذكور وهي مستقرة بالكامل.
                  </p>
                </div>
              </div>

              {/* The dynamic department-by-department signatures list rendering */}
              <div className="space-y-10 select-text">
                {HOSPITAL_DEPARTMENTS.filter(d => signatureFilterDept === 'all' || d === signatureFilterDept).map(dept => {
                  const deptEmps = employees.filter(e => e.department === dept);
                  if (deptEmps.length === 0) return null;

                  return (
                    <div key={dept} className="space-y-4 break-inside-avoid">
                      
                      {/* Department Heading */}
                      <div className="border-b-2 border-slate-700 pb-1.5 flex items-center justify-between">
                        <span className="text-[10px] text-gray-450 font-black font-sans">إجمالي الكادر المستلم: {deptEmps.length} منتسباً</span>
                        <h4 className="font-sans font-extrabold text-[#149cb7] text-xs flex items-center gap-1.5">
                          {React.createElement(DEPARTMENT_ICONS[dept]?.icon || UserCheck, { className: "w-4 h-4 text-[#149cb7]" })}
                          <span>تفصيل رواتب وتواقيع: {dept}</span>
                        </h4>
                      </div>

                      {/* Header & Values Table for Printing */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs font-semibold border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-gray-700 border-b border-gray-300">
                              <th className="p-3 text-center border border-gray-200 w-12 font-bold bg-slate-100">ت</th>
                              <th className="p-3 border border-gray-150 font-bold text-gray-800">اسم الموظف الرباعي</th>
                              <th className="p-3 border border-gray-150 font-bold text-gray-800">القسم</th>
                              <th className="p-3 border border-gray-150 font-bold text-gray-800 hidden md:table-cell">المنصب المعيّن</th>
                              <th className="p-3 border border-gray-150 font-bold text-center w-52 bg-slate-100/80 text-gray-800">التوقيع بالاستلام المالي أو البصمة</th>
                              <th className="p-3 border border-gray-150 font-bold text-center w-28 hidden lg:table-cell">ملاحظات المستلم</th>
                            </tr>
                          </thead>
                          <tbody>
                            {deptEmps.map((emp, index) => {
                              const payrollRec = payrolls.find(p => p.employeeId === emp.id);
                              const finalVal = payrollRec?.finalSalary || 0;

                              return (
                                <tr key={emp.id} className="border-b border-gray-200 hover:bg-slate-50/50 transition-colors">
                                  {/* Index */}
                                  <td className="p-3 text-center font-mono text-gray-500 border border-gray-200 font-bold">{index + 1}</td>
                                  
                                  {/* Name */}
                                  <td className="p-2 border border-gray-200 text-gray-900 font-black font-sans leading-relaxed">
                                    {emp.name}
                                  </td>

                                  {/* Department */}
                                  <td className="p-2 border border-gray-200 text-gray-650 font-bold">
                                    {emp.department}
                                  </td>

                                  {/* Position */}
                                  <td className="p-2 border border-gray-200 hidden md:table-cell text-gray-550 font-bold">{emp.title}</td>

                                  {/* Signature Box */}
                                  <td className="p-2 border border-gray-200 bg-slate-50/20 text-center relative h-14 w-52">
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none select-none flex items-center gap-1 opacity-20">
                                      <Fingerprint className="w-5 h-5 text-gray-400" />
                                      <span className="text-[7.5px] font-bold">مكان البصمة / التوقيع</span>
                                    </div>
                                    <div className="w-full h-full border border-dashed border-gray-350 rounded-lg flex items-center justify-center relative">
                                      <span className="text-[8px] text-gray-400 font-semibold absolute bottom-1 left-2 pointer-events-none">[ ......................... ]</span>
                                    </div>
                                  </td>

                                  {/* Notes field */}
                                  <td className="p-2 border border-gray-200 text-center font-bold text-gray-400 text-[10px] hidden lg:table-cell">
                                    {emp.notes || "ـ"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Physical Audit Approval Section at the end of Signature Sheet */}
              <div className="mt-12 pt-8 border-t-2 border-slate-900 grid grid-cols-1 md:grid-cols-3 text-center text-xs leading-relaxed font-semibold gap-6">
                <div className="space-y-2">
                  <p className="text-gray-400 font-bold">تنظيم وتنسيق شعبة الرواتب:</p>
                  <p className="mt-6 font-extrabold text-gray-800">.....................................................</p>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-400 font-bold">التدقيق المالي والرقابة الداخلية:</p>
                  <p className="mt-6 font-extrabold text-gray-800">.....................................................</p>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-400 font-bold">توقيع ومصادقة المدير الإداري والمالي:</p>
                  <p className="mt-6 font-extrabold text-gray-800">.....................................................</p>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* VIEW 7: DEPARTMENT FINANCIAL TOTALS SUMMARY */}
        {activeTab === 'dept-totals' && (() => {
          const pieData = departmentalSalariesSummary.departmentsSummary
            .filter(d => d.netSalary > 0)
            .map(d => ({
              name: d.department,
              value: d.netSalary,
              percentage: ((d.netSalary / (departmentalSalariesSummary.grandNetSalary || 1)) * 100).toFixed(1)
            }));

          return (
            <div className="space-y-6 text-right animate-fade-in print:p-0" id="dept-totals-view-tab" dir="rtl">
              
              {/* Financial Summary Top Bar (Hidden in standard printing) */}
              <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden" id="dept-totals-control-panel">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-teal-600 to-teal-800 text-white rounded-xl shadow-inner animate-pulse">
                      <Calculator className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-sans font-black text-gray-800 text-xs">خلاصة المجاميع المالية وكشوفات رواتب الأقسام المجمعة 📊</h3>
                      <p className="text-gray-400 text-[10px] mt-0.5">شاشة مالية لاستعراض المجموع الكلي والصافي لكل قسم مع حسابات حاصل الجمع النهائي لمستشفى الفرح الأهلي.</p>
                    </div>
                  </div>
                </div>

                {/* Printable button */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-[10px] text-teal-900 font-bold bg-teal-50 border border-teal-150 px-3 py-1.5 rounded-xl">
                    الدورة النشطة: {MONTHS_LIST.find(m => m.id === selectedMonth)?.arabicName || selectedMonth} 🗓️
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-teal-500/10"
                  >
                    <Printer className="w-4 h-4 text-white" />
                    طباعة الكشوفات الإجمالية 🖨️
                  </button>
                </div>
              </div>

              {/* Executive Highlights Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 print:grid-cols-4 print:gap-4 print:mb-6">
                
                {/* Card 1: Grand Gross Sum */}
                <div className="bg-white p-5 rounded-[1.25rem] border border-gray-150 shadow-sm text-right flex flex-col justify-between">
                  <span className="text-gray-400 font-bold text-[10px] block mb-1">المجموع الكلي لرواتب المستشفى الكلي</span>
                  <div>
                    <span className="font-sans text-xl font-black text-gray-900">
                      {departmentalSalariesSummary.grandGrossSalary.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-gray-500 font-bold mr-1">د.ع</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold mt-2 font-sans">عقود التعاقد قبل الاقتطاع</span>
                </div>

                {/* Card 2: Grand Net Sum (THE CEILING RESULT) */}
                <div className="bg-gradient-to-br from-teal-900 to-teal-800 p-5 rounded-[1.25rem] text-white shadow-md text-right flex flex-col justify-between">
                  <span className="text-teal-200 font-bold text-[10px] block mb-1">المجموع الصافي النهائي المستحق دفعه 💰</span>
                  <div>
                    <span className="font-sans text-xl font-black text-teal-50">
                      {departmentalSalariesSummary.grandNetSalary.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-teal-200 font-bold mr-1">د.ع</span>
                  </div>
                  <span className="text-[9px] text-teal-100 font-bold mt-2">صافي النقد المقرر توزيعه على الكوادر فعلياً</span>
                </div>

                {/* Card 3: Total Grand Deductions */}
                <div className="bg-white p-5 rounded-[1.25rem] border border-gray-150 shadow-sm text-right flex flex-col justify-between">
                  <span className="text-gray-400 font-bold text-[10px] block mb-1">إجمالي الخصومات واستقطاع الغيابات</span>
                  <div>
                    <span className="font-sans text-xl font-black text-red-650">
                      {departmentalSalariesSummary.grandDeductions.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-red-500 font-bold mr-1">د.ع</span>
                  </div>
                  <span className="text-[9px] text-red-400 font-semibold mt-2">العقوبات والغيابات والساعات التقصيرية</span>
                </div>

                {/* Card 4: Total Hospital Staff strength */}
                <div className="bg-white p-5 rounded-[1.25rem] border border-gray-150 shadow-sm text-right flex flex-col justify-between">
                  <span className="text-gray-400 font-bold text-[10px] block mb-1">إجمالي المنتسبين بالخدمة حالياً</span>
                  <div>
                    <span className="font-sans text-xl font-black text-indigo-950">
                      {departmentalSalariesSummary.grandStaffCount}
                    </span>
                    <span className="text-[10px] text-gray-500 font-bold mr-1">موظف ونقيب</span>
                  </div>
                  <span className="text-[9px] text-indigo-400 font-semibold mt-2">المشمولين بالدورة المالية الحالية</span>
                </div>

              </div>

              {/* Financial Departmental Grid Manifest Sheet */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm print:border-none print:p-0">
                
                {/* Printable Header */}
                <div className="hidden print:flex items-center justify-between border-b-2 border-slate-900 pb-5 mb-6 text-right">
                  <div className="flex items-center gap-3">
                    <svg viewBox="0 0 200 200" className="w-14 h-14 shrink-0" id="hospital-brand-logo-totals-print">
                      <circle cx="100" cy="100" r="94" fill="#149cb7" stroke="#ffffff" strokeWidth="2" />
                      <circle cx="100" cy="100" r="62" fill="#ffffff" stroke="#149cb7" strokeWidth="1" />
                      <g transform="translate(68, 70) scale(0.33)" fill="#cda13c">
                        <path d="M42,75 C42,70 41,60 44,52 C46,45 42,40 37,42 C30,45 28,52 23,45 C18,38 23,30 31,34 C36,36 39,26 31,19 C24,12 17,20 12,28 C8,34 5,20 15,10 C25,0 38,12 40,2 C42,-8 48,-8 50,2 C52,12 65,0 75,10 C85,20 82,34 78,28 C73,20 66,12 59,19 C51,26 54,36 59,34 C67,30 72,38 67,45 C62,52 60,45 53,42 C48,40 44,45 46,52 C49,60 48,70 48,75 L42,75 Z" />
                      </g>
                      <path d="M 68 112 L 80 112 L 84 96 L 90 125 L 95 86 L 102 119 L 107 108 L 111 112 L 128 112" fill="none" stroke="#cda13c" strokeWidth="2.5" />
                    </svg>
                    <div>
                      <h2 className="text-sm font-sans font-black text-gray-900">مستشفى الفرح الأهلي - الإدارة الإدارية وشؤون الموظفين</h2>
                      <p className="text-[10px] text-gray-400 font-bold block mt-0.5">الخلاصة المالية والمطابقة الختامية لرواتب الأقسام</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="inline-block px-3 py-1 bg-teal-50 border border-teal-150 text-teal-900 font-sans font-black text-xs rounded-xl mb-1">
                      رواتب {MONTHS_LIST.find(m => m.id === selectedMonth)?.arabicName || selectedMonth} 2026
                    </span>
                    <p className="text-[9px] text-gray-450 font-bold block">تاريخ الاستخراج: {new Date().toLocaleDateString('ar-EG')}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] text-gray-400 font-bold">بمجموع {departmentalSalariesSummary.departmentsSummary.filter(d => d.staffCount > 0).length} أقسام ومراكز مشغولة وفعالة</span>
                  <h4 className="font-sans font-extrabold text-[#149cb7] text-xs">مسير وتفصيل رواتب الأقسام مع هيكلة البياني التفاعلي 📊</h4>
                </div>

                {/* Main Content Area: Side-by-Side Table and Pie Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Right side: Detailed Financial Totals Table (Taking up 8 Cols of 12) */}
                  <div className="lg:col-span-8 overflow-x-auto border border-gray-150 rounded-2xl bg-white shadow-sm p-4 print:border-none print:p-0 print:shadow-none">
                    <table className="w-full text-right text-xs font-semibold border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-gray-700 border-b border-gray-300">
                          <th className="p-3 text-center border border-gray-200 w-12 font-bold bg-slate-100">ت</th>
                          <th className="p-3 border border-gray-150 font-bold text-gray-800">القسم / المركز الطبي الإداري بالمستشفى</th>
                          <th className="p-2 border border-gray-150 font-bold text-center text-gray-800 w-24">عدد الكوادر</th>
                          <th className="p-2 border border-gray-150 font-bold text-center text-gray-800">المجموع الكلي</th>
                          <th className="p-2 border border-gray-150 font-bold text-center text-red-700">الخصومات الكلية</th>
                          <th className="p-3 border border-gray-150 font-bold text-center text-emerald-800 bg-teal-50">صافي الرواتب (الصافي) 💰</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departmentalSalariesSummary.departmentsSummary.map((deptSum, index) => {
                          const isDeptActive = deptSum.staffCount > 0;
                          const iconData = DEPARTMENT_ICONS[deptSum.department];
                          const IconComponent = iconData?.icon || Calculator;

                          return (
                            <tr 
                              key={deptSum.department} 
                              className={`border-b border-gray-200 transition-colors ${
                                isDeptActive ? 'hover:bg-slate-50/70' : 'opacity-40 hover:opacity-75 bg-slate-50/20'
                              }`}
                            >
                              {/* Index */}
                              <td className="p-2 text-center font-mono text-gray-400 border border-gray-200 font-bold">{index + 1}</td>

                              {/* Department Name */}
                              <td className="p-2 border border-gray-200">
                                <div className="flex items-center gap-2">
                                  <div className={`p-1.5 rounded-lg border shrink-0 ${iconData?.bg || 'bg-slate-100'} ${iconData?.color || 'text-slate-600'} ${iconData?.border || 'border-slate-200'}`}>
                                    <IconComponent className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="font-black text-gray-800 font-sans">{deptSum.department}</span>
                                  {!isDeptActive && (
                                    <span className="text-[8px] bg-slate-200 text-slate-500 rounded px-1 text-center font-bold">شاغر</span>
                                  )}
                                </div>
                              </td>

                              {/* Staff Count */}
                              <td className="p-2 border border-gray-200 text-center font-mono font-bold text-gray-700">
                                {deptSum.staffCount}
                              </td>

                              {/* Gross Salaries Sum */}
                              <td className="p-2 border border-gray-200 text-center font-mono text-gray-850">
                                {deptSum.grossSalary.toLocaleString()} د.ع
                              </td>

                              {/* Deductions Sum */}
                              <td className="p-2 border border-gray-200 text-center font-mono font-bold text-red-650">
                                {deptSum.deductions > 0 ? `${deptSum.deductions.toLocaleString()} د.ع` : 'ـ'}
                              </td>

                              {/* Net / Final Salaries Sum */}
                              <td className="p-2 border border-gray-200 text-center font-mono font-black text-teal-950 bg-teal-50/60 text-xs">
                                {deptSum.netSalary.toLocaleString()} د.ع
                              </td>
                            </tr>
                          );
                        })}

                        {/* Totals Summary Row */}
                        <tr className="border-t-2 border-slate-900 bg-slate-105 font-black text-gray-900 border-2">
                          <td className="p-3 text-center font-sans font-bold" colSpan={2}>
                            <span className="text-gray-950 text-xs font-sans font-black block text-right pr-2">حسابات الجمع الختامي (لكل الأقسام) 🧾</span>
                          </td>
                          <td className="p-3 text-center font-mono text-indigo-950 font-black">
                            {departmentalSalariesSummary.grandStaffCount}
                          </td>
                          <td className="p-3 text-center font-mono text-slate-950 font-black">
                            {departmentalSalariesSummary.grandGrossSalary.toLocaleString()} د.ع
                          </td>
                          <td className="p-3 text-center font-mono text-red-700 font-black">
                            {departmentalSalariesSummary.grandDeductions.toLocaleString()} د.ع
                          </td>
                          <td className="p-3 text-center font-mono text-teal-950 bg-teal-100 font-black text-xs border-r-2 border-slate-900">
                            {departmentalSalariesSummary.grandNetSalary.toLocaleString()} د.ع
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Left side: Beautiful Recharts Pie Chart (Taking up 4 Cols of 12) */}
                  <div className="lg:col-span-4 bg-slate-50 border border-gray-200 rounded-2xl p-5 shadow-sm print:hidden">
                    <div className="text-center mb-4">
                      <h4 className="font-sans font-black text-xs text-gray-800">حصة الأقسام من إجمالي الإنفاق 📊</h4>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">توزيع النسبة المئوية للمصروفات الصافية لشهر {MONTHS_LIST.find(m => m.id === selectedMonth)?.arabicName || selectedMonth}</p>
                    </div>

                    {pieData.length === 0 ? (
                      <div className="h-48 flex items-center justify-center text-xs text-gray-400 font-bold">
                        لا توجد رواتب مدفوعة حالياً لعرض النسبة المئوية.
                      </div>
                    ) : (
                      <>
                        <div className="h-48 relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={70}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <RechartsTooltip
                                formatter={(value: any, name: any, tooltipProps: any) => {
                                  const rawVal = parseFloat(value);
                                  return [`${rawVal.toLocaleString()} د.ع (${tooltipProps.payload.percentage}%)`, name];
                                }}
                                contentStyle={{
                                  direction: 'rtl',
                                  textAlign: 'right',
                                  fontFamily: 'sans-serif',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  backgroundColor: '#ffffff',
                                  borderRadius: '12px',
                                  border: '1px solid #e2e8f0',
                                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          
                          {/* Inner Circle Total */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[8px] text-gray-400 font-bold">صافي الكلي</span>
                            <span className="text-[10px] font-sans font-black text-teal-800 mt-1">
                              {departmentalSalariesSummary.grandNetSalary >= 1000000 
                                ? `${(departmentalSalariesSummary.grandNetSalary / 1000000).toFixed(1)}M` 
                                : departmentalSalariesSummary.grandNetSalary.toLocaleString()
                              }
                            </span>
                          </div>
                        </div>

                        {/* Legend section with color dots */}
                        <div className="space-y-1 mt-4 max-h-48 overflow-y-auto pl-1 scrollbar-transparent">
                          {pieData.map((item, index) => {
                            const color = CHART_COLORS[index % CHART_COLORS.length];
                            return (
                              <div key={item.name} className="flex items-center justify-between text-[11px] font-extrabold p-1 hover:bg-white rounded-lg transition-all border border-transparent">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                                  <span className="text-gray-700 truncate">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-gray-400 text-[9px] font-mono">{item.value.toLocaleString()} د.ع</span>
                                  <span className="font-sans text-[9px] text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded-lg border border-teal-100 font-black shrink-0">
                                    {item.percentage}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                </div>

                {/* Signature Board at the end of Financial totals report */}
                <div className="mt-12 pt-8 border-t-2 border-slate-900 grid grid-cols-1 md:grid-cols-3 text-center text-xs leading-relaxed font-semibold gap-6">
                  <div className="space-y-2">
                    <p className="text-gray-400 font-bold">إعداد ومطابقة قسم الرواتب الرقمي:</p>
                    <p className="mt-6 font-extrabold text-gray-800">.....................................................</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-400 font-bold">مدير الرقابة والتفتيش المالي:</p>
                    <p className="mt-6 font-extrabold text-gray-800">.....................................................</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-400 font-bold">مصادقة وإقرار مجلس الإدارة الأعلى:</p>
                    <p className="mt-6 font-extrabold text-gray-800">.....................................................</p>
                  </div>
                </div>

              </div>

            </div>
          );
        })()}

      </main>

      {/* CORE ADD/EDIT EMPLOYEE DIALOG POPUP MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 animate-fade-in" id="primary-modal">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-teal-100 text-right text-xs"
            >
              
              {/* Modal Header */}
              <div className="bg-teal-900 p-4 text-white flex items-center justify-between border-b border-teal-950">
                <h3 className="text-xs font-black">{editingEmployee ? `تعديل سجل الموظف: ${editingEmployee.name}` : 'إضافة وتهيئة موظف جديد بالقسم 👤'}</h3>
                <button 
                  onClick={() => { setIsModalOpen(false); setEditingEmployee(null); }}
                  className="w-7 h-7 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveEmployee} className="p-6 space-y-4 max-h-[500px] overflow-y-auto scrollbar-thin">
                
                {/* Employee Name & ID Code */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1 sm:col-span-1">
                    <label className="font-bold text-gray-700 block text-[10px]">الكود الوظيفي (تلقائي)</label>
                    <input
                      type="text"
                      disabled
                      value={formState.id}
                      className="w-full px-3 py-2 bg-slate-100 border border-gray-200 text-gray-400 rounded-xl text-center font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-gray-700 block text-[10px]">الاسم بالكامل للمنتسب</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: د. عباس فاضل العبيدي"
                      value={formState.name}
                      onChange={(e) => setFormState((prev: any) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 focus:border-teal-700 outline-none rounded-xl font-bold text-slate-800"
                    />
                  </div>
                </div>

                {/* Hospital branch & titles list select fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700 block text-[10px]">قسم الموظف في مستشفى الفرح</label>
                    <select
                      value={formState.department}
                      onChange={(e) => handleFormDeptChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white text-gray-800 font-bold outline-none"
                    >
                      {HOSPITAL_DEPARTMENTS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-700 block text-[10px]">المنصب / المسمى الوظيفي المعتمد</label>
                    <select
                      value={formState.title}
                      onChange={(e) => setFormState((prev: any) => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white text-gray-800 font-bold outline-none"
                    >
                      {(DEPARTMENT_TITLES[formState.department] || []).map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                      <option value="عنوان مخصص">عنوان مخصص بالقسم...</option>
                    </select>
                  </div>
                </div>

                {/* If Title is defined custom, render input */}
                {formState.title === "عنوان مخصص" && (
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700 block text-[10px]">اكتب المسمى الوظيفي المخصص بالقسم بدقة</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: مسؤول مجمع الاستعلامات الطبية"
                      onChange={(e) => setFormState((prev: any) => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold outline-none [direction:rtl]"
                    />
                  </div>
                )}

                {/* SPECIAL ASSISTANCE DYNAMIC FIELDS */}
                {renderDeptSpecialInputs()}

                {/* Notes and procedure actions details */}
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 block text-[10px]">ملاحظات ومستثنيات العقد</label>
                  <textarea
                    rows={2}
                    placeholder="مثل: عقد مالي منفصل مرخص من المدير التنفيذي..."
                    value={formState.notes || ''}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 outline-none focus:border-teal-700 font-medium rounded-xl text-slate-700 text-xs"
                  />
                </div>

                {/* Save and Cancel triggers */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
                  <button
                    type="button"
                    onClick={() => { setIsModalOpen(false); setEditingEmployee(null); }}
                    className="px-4 py-2 border border-slate-200 font-bold rounded-xl text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
                  >
                    إلغاء الأمر
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-teal-800 text-white font-black rounded-xl hover:bg-teal-900 shadow-md transition-colors cursor-pointer shrink-0"
                  >
                    حفظ وتأكيد السجلات المالية
                  </button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FOOTER GENERAL INFO */}
      <footer className="bg-white border-t border-gray-150 py-5 text-center text-[11px] text-gray-400 mt-auto print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="font-bold">مستشفى الفرح الأهلي • قسم الإدارة والتدقيق الحسابي رواتب وأجور</p>
          <p className="text-[10px]">حقوق إدارة السجلات المحوسبة محفوظة © {new Date().getFullYear()}</p>
        </div>
      </footer>

    </div>
  );
}
