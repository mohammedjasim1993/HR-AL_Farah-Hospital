/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, DollarSign, Stethoscope, Clock, ShieldCheck, Award, FileText, 
  CheckCircle2, AlertCircle, X, Search, Plus, Edit, Trash2, ListFilter, 
  Check, Bot, Send, HelpCircle, Printer, Download, Sparkles, TrendingUp, 
  Coins, FileSpreadsheet, UserCheck, ShieldAlert, BadgeInfo, Calendar, ChevronDown, ChevronRight, Activity, ArrowLeftRight
} from 'lucide-react';
import { Employee, ChatMessage, PayrollRecord } from './types';
import { 
  INITIAL_EMPLOYEES, 
  INITIAL_PAYROLLS, 
  HOSPITAL_DEPARTMENTS, 
  DEPARTMENT_TITLES, 
  calculateEmployeeSalaryAndDeductions 
} from './data';
import Dashboard from './components/Dashboard';

export default function App() {
  // الحالات الأساسية المربوطة بالـ LocalStorage للاحتفاظ المستمر بالتغييرات
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('alfarrah_employees');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [activeTab, setActiveTab] = useState<string>('payroll'); // 'dashboard', 'payroll', 'tree', 'advisor', 'reports'

  // فلاتر البحث والفلترة حسب الأقسام
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [contractFilter, setContractFilter] = useState('all'); // 'all', 'flat', 'normal'

  // حالات فتح النوافذ والتحكم بالبيانات
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // فورم إضافة/تعديل الموظف
  const [formState, setFormState] = useState({
    id: '',
    name: '',
    department: 'الإدارة العامة',
    title: 'موظف حسابات',
    totalSalary: 1000000,
    deductionDays: 0,
    deductionHours: 0,
    isFlatRate: false,
    notes: ''
  });

  // الذكاء الاصطناعي والمحادثة
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('alfarrah_chat');
    return saved ? JSON.parse(saved) : [
      {
        id: 'welcome',
        sender: 'ai',
        text: 'مرحباً بك في مستشفى الفرح الأهلي! أنا المستشار المحاسبي الذكي الخاص بك والمبني على ذكاء Gemini 3.5. يمكنني إرشادك لحساب الرواتب، تحديد قواعد استقطاع الغياب اليومي والساعي، أو توضيح حالة موظفي الأشعة والأمنية والإسعاف الذين تنطبق عليهم قوانين المبالغ القطعية. كيف يمكنني مساعدتك برواتب الكادر اليوم؟',
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // لحساب الرواتب التلقائي والفعلي المتزامن مع تعديلات الاستقطاع
  const payrolls = useMemo(() => {
    return employees.map(emp => {
      const calc = calculateEmployeeSalaryAndDeductions(emp);
      return {
        id: `PR-202605-${emp.id}`,
        payrollMonth: "2026-05",
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        title: emp.title,
        totalSalary: emp.totalSalary,
        dailySalary: calc.dailySalary,
        hourlySalary: calc.hourlySalary,
        deductionDays: emp.deductionDays,
        deductionHours: emp.deductionHours,
        isFlatRate: emp.isFlatRate,
        calculatedDeductionsDaysAmount: calc.deductionDaysAmount,
        calculatedDeductionsHoursAmount: calc.deductionHoursAmount,
        totalDeductions: calc.totalDeductions,
        finalSalary: calc.finalSalary,
        status: (emp.status === 'active' ? 'approved' : 'draft') as 'draft' | 'approved' | 'paid'
      };
    });
  }, [employees]);

  // تحديث التخزين المحلي فور حدوث أي تعديل
  useEffect(() => {
    localStorage.setItem('alfarrah_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('alfarrah_chat', JSON.stringify(chatMessages));
  }, [chatMessages]);

  // مراقبة اختيار القسم في الفورم وتعديل المسمى تلقائياً ليطابق المناصب الفعلية بالصورة
  useEffect(() => {
    if (!editingEmployee) {
      const availableTitles = DEPARTMENT_TITLES[formState.department] || [];
      if (availableTitles.length > 0 && !availableTitles.includes(formState.title)) {
        setFormState(prev => ({ ...prev, title: availableTitles[0] }));
      }
    }
  }, [formState.department, editingEmployee]);

  // تحديث هل هو مبلغ قطعي تلقائياً حسب القسم في الشجرة المرفقة بالصورة
  // "رواتب الاسعاف، الأمنية، الأشعة = مبلغ قطعي"
  useEffect(() => {
    const isSpecialFlat = 
      formState.department === "قسم الأمنية والحراسة" || 
      formState.department === "قسم الإسعاف الفوري" || 
      (formState.department === "قسم الأشعة والمفراس والسونار" && formState.title === "طبيب أشعة وسونار");
    
    setFormState(prev => ({ ...prev, isFlatRate: isSpecialFlat }));
  }, [formState.department, formState.title]);

  // معالجة البحث والتصفية بمسير الرواتب الرئيسي
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchSearch = 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        emp.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        emp.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDept = deptFilter === 'all' || emp.department === deptFilter;
      const matchContract = 
        contractFilter === 'all' || 
        (contractFilter === 'flat' && emp.isFlatRate) || 
        (contractFilter === 'normal' && !emp.isFlatRate);

      return matchSearch && matchDept && matchContract;
    });
  }, [employees, searchTerm, deptFilter, contractFilter]);

  // فتح نافذة الإضافة
  const handleAddClick = () => {
    setEditingEmployee(null);
    setFormState({
      id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      department: 'الإدارة العامة',
      title: 'موظف استقبال',
      totalSalary: 800000,
      deductionDays: 0,
      deductionHours: 0,
      isFlatRate: false,
      notes: ''
    });
    setIsModalOpen(true);
  };

  // فتح نافذة التعديل
  const handleEditClick = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormState({
      id: emp.id,
      name: emp.name,
      department: emp.department,
      title: emp.title,
      totalSalary: emp.totalSalary,
      deductionDays: emp.deductionDays,
      deductionHours: emp.deductionHours,
      isFlatRate: emp.isFlatRate,
      notes: emp.notes || ''
    });
    setIsModalOpen(true);
  };

  // حفظ بيانات الموظف (إضافة أو تعديل)
  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim()) {
      alert("الرجاء إدخال اسم الموظف بالكامل");
      return;
    }

    const daily = Math.round(formState.totalSalary / 30);
    const hourly = Math.round(daily / 8);

    const newEmpData: Employee = {
      id: formState.id,
      name: formState.name,
      department: formState.department,
      title: formState.title,
      totalSalary: Number(formState.totalSalary),
      dailySalary: daily,
      hourlySalary: hourly,
      deductionDays: Number(formState.deductionDays),
      deductionHours: Number(formState.deductionHours),
      isFlatRate: formState.isFlatRate,
      joinedDate: editingEmployee ? editingEmployee.joinedDate : new Date().toISOString().split('T')[0],
      status: editingEmployee ? editingEmployee.status : 'active',
      notes: formState.notes
    };

    if (editingEmployee) {
      setEmployees(prev => prev.map(emp => emp.id === editingEmployee.id ? newEmpData : emp));
    } else {
      setEmployees(prev => [newEmpData, ...prev]);
    }

    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  // حذف موظف
  const handleDeleteEmployee = (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف الموظف "${name}" نهائياً من كشف رواتب مستشفى الفرح الأهلي؟`)) {
      setEmployees(prev => prev.filter(emp => emp.id !== id));
    }
  };

  // تعديل سريع ومباشر على أيام/ساعات الاستقطاع من الجدول لتسهيل العمل على الميزانية المباشرة
  const handleDeductionsUpdate = (empId: string, field: 'deductionDays' | 'deductionHours', value: number) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id === empId) {
        let updatedValue = Math.max(0, value);
        if (field === 'deductionDays' && updatedValue > 30) updatedValue = 30;
        if (field === 'deductionHours' && updatedValue > 240) updatedValue = 240;

        const updatedEmp = { ...emp, [field]: updatedValue };
        
        // إعادة احتساب الرواتب التلقائية
        const calc = calculateEmployeeSalaryAndDeductions(updatedEmp);
        updatedEmp.dailySalary = calc.dailySalary;
        updatedEmp.hourlySalary = calc.hourlySalary;

        return updatedEmp;
      }
      return emp;
    }));
  };

  // تفريغ قاعدة البيانات للمثالي الافتراضي لإصلاح الأخطاء
  const handleResetToDefault = () => {
    if (confirm("هل تريد استعادة الهيكلية والبيانات الافتراضية المفصلة لمستشفى الفرح الأهلي؟ هذا سيحذف التعديلات المحفوظة.")) {
      setEmployees(INITIAL_EMPLOYEES);
      setChatMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: 'تمت إعادة تعيين كشوف الرواتب بنجاح إلى شجرة مستشفى الفرح الأهلي الافتراضية كاملة البيانات والمطابقة لمخطط الحسابات الرسمي.',
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  // إرسال رسالة إلى المستشار الذكي بجيميناي
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
      // إرسال قائمة مصغرة ومحمية ومحسوبة بالرواتب الحالية كـ contextData
      const contextData = payrolls.map(pr => ({
        "الاسم": pr.employeeName,
        "القسم": pr.department,
        "المنصب": pr.title,
        "الراتب الكلي": pr.totalSalary,
        "الاستقطاعات": pr.totalDeductions,
        "أيام الغياب": pr.deductionDays,
        "ساعات الغياب": pr.deductionHours,
        "الراتب الصافي النهائي": pr.finalSalary,
        "نوع التعاقد": pr.isFlatRate ? "مبلغ قطعي" : "قياسي باليوم والساعة"
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
        throw new Error('فشل الاتصال بالخادم المحاسبي للذكاء الاصطناعي');
      }

      const resData = await response.json();
      const aiReply: ChatMessage = {
        id: `AI-${Date.now()}`,
        sender: 'ai',
        text: resData.text,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, aiReply]);

    } catch (err: any) {
      console.error(err);
      const errorReply: ChatMessage = {
        id: `AI-ERR-${Date.now()}`,
        sender: 'ai',
        text: 'عذراً، يواجه نظام الاستشارات المحاسبية جهداً عهيداً في الشبكة الآن. يرجى الملاحظة المباشرة بأن راتب اليوم هو (الراتب الكلي ÷ 30) وراتب الساعة هو (راتب اليوم ÷ 8)، واقسام الأمنية والإسعاف والأشعة معفاة كلياً نظراً لكون رواتبهم مبالغ قطعية.',
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, errorReply]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-teal-700 selection:text-white" dir="rtl">
      
      {/* Top Professional Header Bar */}
      <header className="bg-white border-b border-gray-150 sticky top-0 z-40 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Brand Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-800 flex items-center justify-center text-white shadow-md animate-pulse shrink-0">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-teal-800 tracking-wider block">سجلات الحسابات والرواتب الرسمية</span>
              <h2 className="text-lg font-bold text-gray-900 mt-0.5 font-sans">مستشفى الفرح الأهلي</h2>
            </div>
          </div>

          {/* Quick Navigation Pills */}
          <nav className="flex flex-wrap items-center justify-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveTab('dashboard')}
              id="nav-tab-dashboard"
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-white text-teal-850 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-slate-50'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              لوحة التحكم والإحصائيات
            </button>

            <button
              onClick={() => setActiveTab('payroll')}
              id="nav-tab-payroll"
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'payroll'
                  ? 'bg-white text-teal-850 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-slate-50'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              جدول الرواتب والاستقطاعات
            </button>

            <button
              onClick={() => setActiveTab('tree')}
              id="nav-tab-tree"
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'tree'
                  ? 'bg-white text-teal-850 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-slate-50'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              هيكلية الشجرة التنظيمية
            </button>

            <button
              onClick={() => setActiveTab('advisor')}
              id="nav-tab-advisor"
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'advisor'
                  ? 'bg-white text-teal-850 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-slate-50'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              مستشار الذكاء الاصطناعي
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              id="nav-tab-reports"
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'reports'
                  ? 'bg-white text-teal-850 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-slate-50'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              مسير ومسودات الطباعة
            </button>
          </nav>

          {/* Setup reset button */}
          <button 
            type="button"
            onClick={handleResetToDefault}
            className="text-[10px] text-gray-400 hover:text-red-500 transition-colors border border-gray-200 hover:border-red-100 rounded-lg py-1.5 px-3 bg-white hover:bg-red-50"
          >
            إعادة تعيين الشجرة
          </button>

        </div>
      </header>

      {/* Main Container Wrapper */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        
        {/* TAB 1: DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <Dashboard 
              employees={employees} 
              payrolls={payrolls} 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
            />
          </div>
        )}

        {/* TAB 2: PAYROLL WORKSHEET GRID TABLE */}
        {activeTab === 'payroll' && (
          <div className="space-y-6">
            
            {/* Action Bar with Search & Filters */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
                <input
                  type="text"
                  placeholder="ابحث عن موظف بالاسم، المسمى الوظيفي، أو الكود..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-11 pl-4 py-2 text-xs rounded-xl border border-gray-200 outline-none focus:border-teal-700 bg-slate-50/50 transition-colors"
                />
              </div>

              {/* Advanced Filters */}
              <div className="flex flex-wrap items-center gap-3">
                
                {/* Department Selector */}
                <div className="flex items-center gap-1.5 text-xs bg-slate-50 border border-gray-150 px-2.5 py-1.5 rounded-xl">
                  <ListFilter className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-400 ml-1">القسم:</span>
                  <select 
                    value={deptFilter} 
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="outline-none bg-transparent font-semibold text-gray-700 cursor-pointer"
                  >
                    <option value="all">كل الأقسام والمرافق</option>
                    {HOSPITAL_DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Contract / Flat Rate selector */}
                <div className="flex items-center gap-1.5 text-xs bg-slate-50 border border-gray-150 px-2.5 py-1.5 rounded-xl">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-400 ml-1">نوع الراتب:</span>
                  <select 
                    value={contractFilter} 
                    onChange={(e) => setContractFilter(e.target.value)}
                    className="outline-none bg-transparent font-semibold text-gray-700 cursor-pointer"
                  >
                    <option value="all">الكل</option>
                    <option value="flat">رواتب مبلغ قطعي 🛑</option>
                    <option value="normal">راتب قياسي باليوم والساعة 🟢</option>
                  </select>
                </div>

                {/* Add New Button */}
                <button
                  onClick={handleAddClick}
                  id="add-new-employee-btn"
                  className="px-4 py-2 bg-teal-800 text-white font-bold rounded-xl shadow-sm hover:bg-teal-900 transition-all flex items-center gap-1.5 text-xs shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-white" />
                  إضافة موظف للهيكلية
                </button>

              </div>
            </div>

            {/* Core Responsive Table Wrapper */}
            <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  
                  {/* Table Header */}
                  <thead className="bg-slate-50 border-b border-gray-150 text-gray-500 font-bold">
                    <tr>
                      <th className="p-4 text-center w-24">كود الموظف</th>
                      <th className="p-4">اسم الموظف بالكامل</th>
                      <th className="p-4">القسم والمنصب الفعلي</th>
                      <th className="p-4 text-left font-mono">الراتب الكلي (عقد)</th>
                      <th className="p-4 text-left font-mono text-slate-500">راتب اليوم الواحد (الكل÷30)</th>
                      <th className="p-4 text-left font-mono text-slate-500">راتب الساعة (اليوم÷8)</th>
                      <th className="p-4 text-center select-none">أيام الاستقطاع (غياب)</th>
                      <th className="p-4 text-center select-none">ساعات الاستقطاع (أخرى)</th>
                      <th className="p-4 text-center">نوع التعاقد</th>
                      <th className="p-4 text-left font-mono font-bold text-teal-900 bg-teal-50/20">الراتب النهائي المستحق</th>
                      <th className="p-4 text-center">التحكم</th>
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="p-8 text-center text-gray-400">
                          <BadgeInfo className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-xs font-semibold">لم نعثر على أي موظف يطابق خيارات البحث والتصفية المحددة.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((emp) => {
                        const rec = payrolls.find(p => p.employeeId === emp.id) || {
                          dailySalary: Math.round(emp.totalSalary / 30),
                          hourlySalary: Math.round((emp.totalSalary / 30) / 8),
                          calculatedDeductionsDaysAmount: 0,
                          calculatedDeductionsHoursAmount: 0,
                          totalDeductions: 0,
                          finalSalary: emp.totalSalary
                        };

                        return (
                          <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors animate-fade-in group">
                            
                            {/* Kود */}
                            <td className="p-4 text-center font-mono font-bold text-gray-450 border-l border-gray-50">
                              {emp.id}
                            </td>

                            {/* الاسم */}
                            <td className="p-4">
                              <div className="font-bold text-gray-900 flex items-center gap-1.5">
                                {emp.name}
                                {emp.status === 'suspended' && (
                                  <span className="bg-red-50 text-red-650 px-1.5 py-0.5 rounded text-[8px] font-bold">موقوف مؤقتاً</span>
                                )}
                              </div>
                            </td>

                            {/* القسم والتايتل */}
                            <td className="p-4">
                              <div>
                                <span className="text-[10px] text-gray-400 font-bold block">{emp.department}</span>
                                <span className="text-gray-750 font-medium text-[11px] mt-0.5 block">{emp.title}</span>
                              </div>
                            </td>

                            {/* الراتب الكلي */}
                            <td className="p-4 text-left font-mono font-bold text-gray-900 bg-slate-50/20">
                              {emp.totalSalary.toLocaleString()} د.ع
                            </td>

                            {/* راتب اليوم الواحد */}
                            <td className="p-4 text-left font-mono text-gray-500">
                              {rec.dailySalary.toLocaleString()} د.ع
                            </td>

                            {/* راتب الساعة الواحد */}
                            <td className="p-4 text-left font-mono text-gray-400">
                              {rec.hourlySalary.toLocaleString()} د.ع
                            </td>

                            {/* عدد أيام الغياب الاستقطاعية */}
                            <td className="p-4 text-center">
                              {emp.isFlatRate ? (
                                <span className="text-[10px] text-gray-400 italic">معفي</span>
                              ) : (
                                <div className="inline-flex items-center gap-1 bg-slate-50 border border-gray-250 p-1 rounded-lg">
                                  <button
                                    onClick={() => handleDeductionsUpdate(emp.id, 'deductionDays', emp.deductionDays - 1)}
                                    className="w-5 h-5 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-700 text-gray-650 rounded flex items-center justify-center font-bold font-sans cursor-pointer transition-colors"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="0"
                                    max="30"
                                    value={emp.deductionDays}
                                    onChange={(e) => handleDeductionsUpdate(emp.id, 'deductionDays', parseInt(e.target.value) || 0)}
                                    className="w-8 text-center bg-transparent outline-none font-sans font-bold text-gray-800 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <button
                                    onClick={() => handleDeductionsUpdate(emp.id, 'deductionDays', emp.deductionDays + 1)}
                                    className="w-5 h-5 bg-white border border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 text-gray-650 rounded flex items-center justify-center font-bold font-sans cursor-pointer transition-colors"
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </td>

                            {/* عدد ساعات الغياب الاستقطاعية */}
                            <td className="p-4 text-center">
                              {emp.isFlatRate ? (
                                <span className="text-[10px] text-gray-400 italic">معفي</span>
                              ) : (
                                <div className="inline-flex items-center gap-1 bg-slate-50 border border-gray-250 p-1 rounded-lg">
                                  <button
                                    onClick={() => handleDeductionsUpdate(emp.id, 'deductionHours', emp.deductionHours - 1)}
                                    className="w-5 h-5 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-700 text-gray-650 rounded flex items-center justify-center font-bold font-sans cursor-pointer transition-colors"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="0"
                                    max="240"
                                    value={emp.deductionHours}
                                    onChange={(e) => handleDeductionsUpdate(emp.id, 'deductionHours', parseInt(e.target.value) || 0)}
                                    className="w-8 text-center bg-transparent outline-none font-sans font-bold text-gray-800 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <button
                                    onClick={() => handleDeductionsUpdate(emp.id, 'deductionHours', emp.deductionHours + 1)}
                                    className="w-5 h-5 bg-white border border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 text-gray-650 rounded flex items-center justify-center font-bold font-sans cursor-pointer transition-colors"
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </td>

                            {/* نوع التعاقد */}
                            <td className="p-4 text-center">
                              {emp.isFlatRate ? (
                                <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap block w-max mx-auto">
                                  مبلغ قطعي 🛑
                                </span>
                              ) : (
                                <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap block w-max mx-auto">
                                  قياسي 🟢
                                </span>
                              )}
                            </td>

                            {/* الراتب النهائي المستحق بعد الاستقطاع */}
                            <td className="p-4 text-left font-mono font-bold text-teal-800 bg-teal-50/20 text-[13px]">
                              {rec.finalSalary.toLocaleString()} د.ع
                            </td>

                            {/* أزرار التحكم والخيارات */}
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleEditClick(emp)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 hover:text-blue-800 rounded-lg transition-colors cursor-pointer"
                                  title="تعديل الموظف"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors cursor-pointer"
                                  title="حذف الموظف"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>

                          </tr>
                        );
                      })
                    )}
                  </tbody>

                </table>
              </div>

              {/* Summary Stats Bottom Section */}
              <div className="bg-slate-50 border-t border-gray-150 p-4 font-bold flex flex-col sm:flex-row items-center justify-between text-gray-800 gap-4 text-xs">
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <span>إجمالي الكادر المعروض: <span className="text-teal-800 font-sans">{filteredEmployees.length} موظفاً</span></span>
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full hidden sm:block"></span>
                  <span>المبلغ الكلي الشهري المعروض: <span className="text-sky-800 font-sans">{filteredEmployees.reduce((acc, curr) => acc + curr.totalSalary, 0).toLocaleString()} د.ع</span></span>
                </div>
                <div className="flex items-center gap-1.5 bg-teal-100/60 border border-teal-200 px-3 py-1.5 rounded-xl text-teal-900 font-bold">
                  <span>صافي الرواتب المستحقة (للمعروض):</span>
                  <span className="font-sans text-sm">{filteredEmployees.reduce((acc, curr) => {
                    const calc = calculateEmployeeSalaryAndDeductions(curr);
                    return acc + calc.finalSalary;
                  }, 0).toLocaleString()} د.ع</span>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: ORGANIZATIONAL SHAGARA TREE VIEW */}
        {activeTab === 'tree' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-l from-slate-900 to-slate-800 rounded-2xl p-6 text-white text-right space-y-4 shadow-lg overflow-hidden">
              <h3 className="text-xl font-bold font-sans">هيكل مستشفى الفرح الأهلي التنظيمي التفاعلي</h3>
              <p className="text-slate-350 text-xs">
                خريطة شجرية توضح كيف تترابط وتنسجم الأقسام المعتمدة والمناصب لمستشفى الفرح الأهلي بموجب مخطط الحسابات والتعاقدات الرسمية والمبالغ المقطوعة المحددة.
              </p>
              
              <div className="p-3 bg-red-900/40 border border-red-850 rounded-xl flex items-start gap-3 text-red-150 text-xs">
                <ShieldAlert className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
                <div>
                  <span className="font-bold text-white block mb-0.5">ملاحظة محاسبية واستثنائية من الشجرة:</span>
                  محددة "المبلغ القطعي" مطبقة بشكل صارم وملزم على أقسام: **حارس الأمن ومسؤول الأمنية**، **سائق الإسعاف ومسعف الطوارئ**، بالإضافة إلى **طبيب الأشعة وسونار ومسؤول قسم الأشعة**. هذا الكادر الرواتب المخصصة لهم هي مبالغ قطعية ومستثناة من استقطاعات الغياب والساعات التلقائية مالم يتم تعديل الراتب الأساسي بالعقد.
                </div>
              </div>
            </div>

            {/* Interactive Tree Node Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {HOSPITAL_DEPARTMENTS.map((deptName) => {
                const deptEmps = employees.filter(e => e.department === deptName);
                const sumDeptTotal = deptEmps.reduce((acc, c) => acc + c.totalSalary, 0);
                const isDeptFlat = deptName === "قسم الأمنية والحراسة" || deptName === "قسم الإسعاف الفوري" || deptName === "قسم الأشعة والمفراس والسونار";

                return (
                  <div key={deptName} className="bg-white rounded-2xl border border-gray-150 p-4 shadow-sm flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          isDeptFlat ? 'bg-amber-100 text-amber-800' : 'bg-teal-50 text-teal-800'
                        }`}>
                          {isDeptFlat ? 'رواتب فئة مبلغ قطعي 🛑' : 'كادر قياسي مستقطع 🟢'}
                        </span>
                        <h4 className="font-bold text-gray-900 text-xs">{deptName}</h4>
                      </div>

                      {/* Defined positions within this department based on the mindmap */}
                      <p className="text-[10px] text-gray-400 font-bold mb-1.5">المناصب المعتمدة بالتشجير:</p>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {(DEPARTMENT_TITLES[deptName] || []).map(title => (
                          <span key={title} className="bg-slate-50 text-slate-800 text-[9px] px-2 py-0.5 rounded border border-gray-100">
                            {title}
                          </span>
                        ))}
                      </div>

                      {/* Employees actually registered in this department */}
                      <p className="text-[10px] text-gray-400 font-bold mb-1.5">الكادر العامل والمسجل حالياً ({deptEmps.length}):</p>
                      {deptEmps.length === 0 ? (
                        <p className="text-[10px] text-gray-400 italic">لا توجد موظفين مسجلين حالياً في هذا القسم.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {deptEmps.map(emp => (
                            <div key={emp.id} className="flex items-center justify-between bg-slate-50/50 p-1.5 rounded border border-slate-100 text-[10px]">
                              <span className="font-mono font-bold text-teal-800">{emp.totalSalary.toLocaleString()} د.ع</span>
                              <div className="text-right">
                                <span className="font-bold text-gray-800 font-sans block">{emp.name}</span>
                                <span className="text-[9px] text-gray-400 font-medium block">{emp.title}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-gray-100 text-[10px] flex items-center justify-between font-bold">
                      <span className="font-mono font-sans font-bold text-gray-800">{sumDeptTotal.toLocaleString()} د.ع</span>
                      <span className="text-gray-400">إجمالي الموازنة الشهرية للقسم:</span>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: AI ACCOUNTING ADVISOR CHAT */}
        {activeTab === 'advisor' && (
          <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden h-[600px] flex flex-col justify-between">
            
            {/* Advisor Header */}
            <div className="bg-teal-900 text-white p-4 flex items-center justify-between border-b border-teal-950">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-800 flex items-center justify-center border border-teal-700">
                  <Bot className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-xs">مستشار رواتب مستشفى الفرح الأهلي الذكي</h4>
                  <span className="text-[10px] text-teal-200">مدعوم بالذكاء الاصطناعي وبينات الحسابات لـ {employees.length} موظفاً</span>
                </div>
              </div>
              <Sparkles className="w-5 h-5 text-emerald-300 shrink-0" />
            </div>

            {/* Chat message display area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/60 text-xs">
              {chatMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex gap-3 max-w-[85%] ${
                    msg.sender === 'user' ? 'mr-auto flex-row-reverse' : 'ml-auto'
                  }`}
                >
                  {/* Sender Avatar */}
                  <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${
                    msg.sender === 'user' ? 'bg-teal-700 text-white' : 'bg-slate-205 text-teal-900 border border-slate-300'
                  }`}>
                    {msg.sender === 'user' ? <Users className="w-3.5 h-3.5" /> : <Bot className="w-4 h-4 text-teal-800" />}
                  </div>

                  {/* Message Bubble */}
                  <div className="space-y-1">
                    <div className={`p-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                      msg.sender === 'user' 
                        ? 'bg-teal-800 text-white rounded-tr-none' 
                        : 'bg-white text-gray-800 border border-gray-200 shadow-sm rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-gray-400 block text-right font-mono px-1">{msg.timestamp}</span>
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex gap-3 ml-auto max-w-[80%]">
                  <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center bg-slate-200 border border-slate-300">
                    <Bot className="w-4 h-4 text-teal-800 animate-spin" />
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl rounded-tl-none border border-gray-150 shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-teal-800 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-teal-800 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-teal-800 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompts Helper */}
            <div className="bg-slate-50 px-4 py-2 border-t border-gray-150 overflow-x-auto whitespace-nowrap flex gap-2">
              <button 
                onClick={() => setChatInput("كيف يتم احتساب راتب اليوم الواحد وراتب الساعة للموظف القياسي؟")}
                className="bg-white border border-gray-200 hover:border-teal-700 hover:bg-teal-50 text-[10px] px-3 py-1 rounded-lg transition-all text-gray-650 font-semibold inline-block shrink-0 cursor-pointer"
              >
                📊 آلية احتساب اليوم والساعة؟
              </button>
              <button 
                onClick={() => setChatInput("من هم موظفو فئة المبالغ القطعية المسجلين بالكامل حالياً وما هي إجمالي ميزانيتهم؟")}
                className="bg-white border border-gray-200 hover:border-teal-700 hover:bg-teal-50 text-[10px] px-3 py-1 rounded-lg transition-all text-gray-650 font-semibold inline-block shrink-0 cursor-pointer"
              >
                🛑 كادر المبلغ القطعي؟
              </button>
              <button 
                onClick={() => setChatInput("أعطني إحصائية وموازنة الرواتب لقسم الإدارة العامة وكيف يتم توزيعها.")}
                className="bg-white border border-gray-200 hover:border-teal-700 hover:bg-teal-50 text-[10px] px-3 py-1 rounded-lg transition-all text-gray-650 font-semibold inline-block shrink-0 cursor-pointer"
              >
                💼 موازنة الإدارة العامة؟
              </button>
            </div>

            {/* Chat Input Bar */}
            <div className="p-3 border-t border-gray-150 flex items-center gap-2 bg-white">
              <input
                type="text"
                placeholder="اسأل المستشار الحسابي عن أي موظف، أو استقطاعات الغياب أو الرواتب الإجمالية..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                disabled={isChatLoading}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-teal-700 text-xs transition-colors"
              />
              <button
                onClick={handleSendChatMessage}
                disabled={isChatLoading || !chatInput.trim()}
                className="w-10 h-10 shrink-0 bg-teal-800 text-white font-bold rounded-xl flex items-center justify-center hover:bg-teal-900 transition-colors cursor-pointer disabled:bg-slate-200 disabled:text-gray-400"
              >
                <Send className="w-4.5 h-4.5 text-white" />
              </button>
            </div>

          </div>
        )}

        {/* TAB 5: REPORTS & PDF PRINTING WORKSHEETS */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-right">
                <h3 className="font-bold text-gray-900 text-sm">مسير كشف الرواتب الرسمي الجاهز للتصدير</h3>
                <p className="text-gray-400 text-xs mt-0.5">يمكنك طباعة هذا الكشف المالي لتقديمه للحسابات والتدقيق المالي بنظام PDF.</p>
              </div>
              <button
                onClick={() => window.print()}
                id="native-print-btn"
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4 text-white" />
                طباعة الكشف الورقي أو الحفظ PDF
              </button>
            </div>

            {/* PDF Styled layout for printing */}
            <div className="bg-white p-8 rounded-2xl border border-gray-150 shadow-sm max-w-4xl mx-auto text-right text-xs print:p-0 print:border-none print:shadow-none space-y-6 font-sans border-t-8 border-t-teal-900" id="official-payout-bill">
              
              {/* Official Bill Header */}
              <div className="flex justify-between items-start border-b border-gray-200 pb-5">
                <div className="text-left leading-normal">
                  <p className="font-bold text-gray-800">جمهورية العراق</p>
                  <p className="text-gray-500 font-medium">وزارة الصحة والبيئة</p>
                  <p className="text-gray-500 font-medium">دائرة المؤسسات الصحية غير الحكومية</p>
                </div>
                <div className="text-center rounded-xl p-3 bg-teal-50/50 border border-teal-100 shrink-0">
                  <h1 className="text-lg font-bold text-teal-850">مسير رواتب مستشفى الفرح الأهلي</h1>
                  <p className="text-slate-500 text-[10px] mt-1 font-bold">شهر آيار - May 2026</p>
                  <p className="font-mono text-[9px] text-gray-400 mt-0.5">تاريخ الإصدار: {new Date().toLocaleDateString('ar-EG')}</p>
                </div>
                <div className="text-right leading-normal">
                  <p className="font-bold text-teal-900">مستشفى الفرح الأهلي</p>
                  <p className="text-gray-500 font-medium">قسم تدقيق الحسابات والمالية</p>
                  <p className="text-gray-500 font-medium">مسير كشوف العاملين المعتمد</p>
                </div>
              </div>

              {/* Statistical Snapshot */}
              <div className="grid grid-cols-3 gap-4 border border-teal-100 bg-teal-50/30 p-4 rounded-xl leading-relaxed text-slate-800 font-semibold">
                <div className="text-center border-l border-teal-50">
                  <span className="text-gray-400 text-[10px] block">إجمالي كادر المستشفى</span>
                  <span className="font-sans text-sm font-bold text-gray-850">{employees.length} موظفاً</span>
                </div>
                <div className="text-center border-l border-teal-50">
                  <span className="text-gray-400 text-[10px] block">إجمالي كشوف المبالغ القطعية</span>
                  <span className="font-sans text-sm font-bold text-gray-850">
                    {employees.filter(e => e.isFlatRate).length} موظفين
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-teal-900 text-[10px] block font-bold">صافي الرواتب المستحق للتحويل</span>
                  <span className="font-sans text-sm font-bold text-teal-900">
                    {payrolls.reduce((sum, pr) => sum + pr.finalSalary, 0).toLocaleString()} د.ع
                  </span>
                </div>
              </div>

              {/* Detailed Bill Record Grid */}
              <div className="overflow-hidden border border-gray-150 rounded-xl">
                <table className="w-full text-right border-collapse text-[10px]">
                  <thead className="bg-slate-100 text-gray-500 font-bold border-b border-gray-150">
                    <tr>
                      <th className="p-2.5 text-center">الكود</th>
                      <th className="p-2.5">الموظف</th>
                      <th className="p-2.5">القسم</th>
                      <th className="p-2.5">المنصب</th>
                      <th className="p-2.5 text-left font-mono">الراتب الكلي</th>
                      <th className="p-2.5 text-center">أيام الاستقطاع</th>
                      <th className="p-2.5 text-center">ساعات الاستقطاع</th>
                      <th className="p-2.5 text-center">آلية الاحتساب</th>
                      <th className="p-2.5 text-left font-mono font-bold bg-teal-50 text-teal-900">الصافي النهائي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-800">
                    {payrolls.map((pr) => (
                      <tr key={pr.id}>
                        <td className="p-2 text-center font-mono text-gray-450">{pr.employeeId}</td>
                        <td className="p-2 font-bold">{pr.employeeName}</td>
                        <td className="p-2 text-gray-500">{pr.department}</td>
                        <td className="p-2 text-gray-500">{pr.title}</td>
                        <td className="p-2 text-left font-mono">{pr.totalSalary.toLocaleString()} د.ع</td>
                        <td className="p-2 text-center font-mono">{pr.isFlatRate ? 'معفي' : pr.deductionDays}</td>
                        <td className="p-2 text-center font-mono">{pr.isFlatRate ? 'معفي' : pr.deductionHours}</td>
                        <td className="p-2 text-center font-bold">
                          {pr.isFlatRate ? (
                            <span className="text-amber-800 text-[9px]">مبلغ قطعي ثابت</span>
                          ) : (
                            <span className="text-emerald-800 text-[9px]">غياب باليوم/الساعة</span>
                          )}
                        </td>
                        <td className="p-2 text-left font-mono font-bold bg-teal-50/40 text-teal-900 border-r border-teal-100">
                          {pr.finalSalary.toLocaleString()} د.ع
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bill Signature sections */}
              <div className="grid grid-cols-4 gap-4 text-center text-[10px] text-gray-500 pt-8 border-t border-gray-200">
                <div className="space-y-8">
                  <span className="font-bold">منسق شؤون الموظفين</span>
                  <div className="border-b border-gray-200 mx-4 h-5"></div>
                  <span className="text-[8px] text-gray-400">التاريخ والتدقيق</span>
                </div>
                <div className="space-y-8">
                  <span className="font-bold">مدير قسم الحسابات</span>
                  <div className="border-b border-gray-200 mx-4 h-5"></div>
                  <span className="text-[8px] text-gray-400">التدقيق المالي والختم</span>
                </div>
                <div className="space-y-8">
                  <span className="font-bold">المدير الإداري</span>
                  <div className="border-b border-gray-200 mx-4 h-5"></div>
                  <span className="text-[8px] text-gray-400">الاعتماد والتسليم</span>
                </div>
                <div className="space-y-8">
                  <span className="font-bold">المدير التنفيذي للجمعية</span>
                  <div className="border-b border-gray-200 mx-4 h-5"></div>
                  <span className="text-[8px] text-gray-400">المصادقة النهائية</span>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* FOOTER COID */}
      <footer className="bg-white border-t border-gray-150 py-5 text-center text-xs text-gray-400 mt-8 print:hidden">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-bold">مستشفى الفرح الأهلي • قسم الحسابات وتدقيق الرواتب الموحد</p>
          <p className="text-[10px] text-gray-400 mt-1">حقوق الحسابات محفوظة للخدمة الإدارية المحوسبة © {new Date().getFullYear()}</p>
        </div>
      </footer>

      {/* CORE ADD/EDIT EMPLOYEE DIALOG MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" id="employee-form-modal">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 text-right text-xs">
            
            {/* Modal Header */}
            <div className="bg-teal-900 p-4 text-white flex items-center justify-between border-b border-teal-950">
              <h3 className="text-sm font-bold">{editingEmployee ? `تعديل ملف الموظف: ${editingEmployee.name}` : 'إضافة موظف جديد للهيكلية'}</h3>
              <button 
                onClick={() => { setIsModalOpen(false); setEditingEmployee(null); }}
                className="w-7 h-7 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5 text-white" />
              </button>
            </div>

            {/* Modal Form Form */}
            <form onSubmit={handleSaveEmployee} className="p-6 space-y-4">
              
              {/* Employee Code & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1 sm:col-span-1">
                  <label className="font-bold text-gray-700 block text-[10px]">كود الموظف (الرقم الوظيفي)</label>
                  <input
                    type="text"
                    required
                    disabled
                    value={formState.id}
                    className="w-full px-3 py-2 bg-slate-150 border border-gray-200 rounded-xl outline-none text-gray-400 font-mono text-center font-bold"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-gray-700 block text-[10px]">اسم الموظف الاسم بالكامل</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: د. عباس فاضل العبيدي"
                    value={formState.name}
                    onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-teal-750 font-semibold"
                  />
                </div>
              </div>

              {/* Department & Title Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Department Selection */}
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 block text-[10px]">اختر القسم الاداري أو الطبي</label>
                  <select
                    value={formState.department}
                    onChange={(e) => setFormState(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-teal-750 font-bold bg-white text-gray-800"
                  >
                    {HOSPITAL_DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Role title Selection */}
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 block text-[10px]">اختر المسمى والمنصب المعتمد</label>
                  <select
                    value={formState.title}
                    onChange={(e) => setFormState(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-teal-750 font-bold bg-white text-gray-800"
                  >
                    {(DEPARTMENT_TITLES[formState.department] || []).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    <option value="عنوان مخصص">عنوان مخصص...</option>
                  </select>
                </div>

              </div>

              {/* If customized Title selected, let user write arbitrary title */}
              {formState.title === "عنوان مخصص" && (
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 block text-[10px]">اكتب المسمى الوظيفي المخصص بالقسم بدقة</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: مسؤول مجمع الاستعلامات الطبية"
                    onChange={(e) => setFormState(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-teal-750 font-semibold"
                  />
                </div>
              )}

              {/* Salary & Flat rate checkbox */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 block text-[10px]">الراتب الكلي الإجمالي (عقدي)</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={100000}
                      step={10000}
                      value={formState.totalSalary}
                      onChange={(e) => setFormState(prev => ({ ...prev, totalSalary: Number(e.target.value) }))}
                      className="w-full pr-3 pl-10 py-2 border border-gray-200 rounded-xl outline-none focus:border-teal-750 font-mono font-bold"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold uppercase">د.ع</span>
                  </div>
                </div>

                <div className="border border-slate-150 p-2.5 rounded-xl bg-slate-50 flex items-center justify-between">
                  <input
                    type="checkbox"
                    id="checkbox-is-flat-rate"
                    checked={formState.isFlatRate}
                    onChange={(e) => setFormState(prev => ({ ...prev, isFlatRate: e.target.checked }))}
                    className="w-4 h-4 text-teal-700 cursor-pointer"
                  />
                  <label htmlFor="checkbox-is-flat-rate" className="font-bold text-gray-800 block text-[10px] cursor-pointer select-none text-right">
                    هل الراتب مبلغ قطعي؟ <span className="text-[9px] text-amber-600 block font-normal">(الأمنية، الإسعاف، الأشعة)</span>
                  </label>
                </div>
              </div>

              {/* Deductions inputs section (Only if not flat rate) */}
              {!formState.isFlatRate ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-red-50/40 border border-red-100 rounded-2xl">
                  <div className="space-y-1">
                    <label className="font-bold text-red-800 block text-[10px]">أيام الغياب والاستقطاع</label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={formState.deductionDays}
                      onChange={(e) => setFormState(prev => ({ ...prev, deductionDays: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-red-400 font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-red-800 block text-[10px]">ساعات الغياب والاستقطاع</label>
                    <input
                      type="number"
                      min={0}
                      max={240}
                      value={formState.deductionHours}
                      onChange={(e) => setFormState(prev => ({ ...prev, deductionHours: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-red-400 font-mono font-bold"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-2xl text-[10px] text-amber-800 font-semibold text-center leading-relaxed">
                  هذا الموظف خاضع لنظام الراتب القطعي ومستثنى مسبقاً من الخصومات اليومية أو الساعية للأمن والأشعة والإسعاف.
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-bold text-gray-700 block text-[10px]">ملاحظات إجرائية حول المعاملة</label>
                <textarea
                  rows={2}
                  placeholder="مثال: حاصل على استثناء رسمي أو عقد مثبت..."
                  value={formState.notes}
                  onChange={(e) => setFormState(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-teal-750 font-medium"
                />
              </div>

              {/* Save & Cancel Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingEmployee(null); }}
                  className="px-4 py-2 border border-gray-200 font-bold rounded-xl text-gray-700 hover:bg-slate-50 transition-colors shrink-0 cursor-pointer text-xs"
                >
                  إلغاء الأمر
                </button>
                <button
                  type="submit"
                  id="submit-save-employee-btn"
                  className="px-5 py-2 bg-teal-800 text-white font-bold rounded-xl shadow-md hover:bg-teal-900 transition-colors shrink-0 cursor-pointer text-xs"
                >
                  حفظ وتأكيد السجلات المالية
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
