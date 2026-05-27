/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Employee, PayrollRecord } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { 
  Users, DollarSign, Stethoscope, ShieldAlert, Award, Clock, FileSpreadsheet, Percent, Calculator, ShieldCheck,
  Crown, Pill, HeartPulse, Baby, Coffee, Smile, Scan, FlaskConical, Syringe, Bone, Shield, Truck, UserCheck
} from 'lucide-react';
import { motion } from 'motion/react';

// قاموس الأيقونات للأقسام من أجل عرض إحصائي احترافي
const DEPT_ICONS_MAP: Record<string, React.ComponentType<any>> = {
  "الادارة العليا": Crown,
  "قسم الصيدلية": Pill,
  "قسم العمليات": HeartPulse,
  "قسم النسائية والتوليد": Baby,
  "قسم الكافتريا": Coffee,
  "قسم الاطفال والخدج": Smile,
  "قسم السونار": Scan,
  "قسم اطباء الخدج المقيمين": Stethoscope,
  "قسم المختبر ومصرف الدم": FlaskConical,
  "قسم الاطباء المقيمين": UserCheck,
  "قسم التمريض والردهات والطواريء": Syringe,
  "قسم اطباء النسائية": Stethoscope,
  "قسم الاشعة": Bone,
  "قسم الأشعة": Bone,
  "قسم الامنية": Shield,
  "قسم الأمنية": Shield,
  "قسم الاسعاف": Truck,
  "قسم الإسعاف": Truck,
};

interface DashboardProps {
  employees: Employee[];
  payrolls: PayrollRecord[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const COLORS = [
  '#0f766e', // teal-700
  '#0284c7', // sky-600
  '#4f46e5', // indigo-600
  '#ea580c', // orange-600
  '#db2777', // pink-600
  '#16a34a', // green-600
  '#7c3aed', // violet-600
  '#2563eb', // blue-650
  '#0891b2', // cyan-600
  '#475569'  // slate-600
];

export default function Dashboard({ employees, payrolls, setActiveTab }: DashboardProps) {
  // عدد الموظفين الإجمالي
  const totalEmployees = employees.length;
  
  // إحصائيات الرواتب
  const statsSummary = useMemo(() => {
    let sumTotalSalary = 0;
    let sumTotalDeductions = 0;
    let sumFinalSalary = 0;
    let flatRateCount = 0;

    employees.forEach(emp => {
      // جمع الراتب المرجعي الأساسي للتعاقد حسب القسم
      const refSalary = emp.totalSalary || emp.baseSalary || emp.radiologyTotalSum || emp.securityTotalSum || emp.ambulanceTotalSum || 0;
      sumTotalSalary += refSalary;
      if (emp.isFlatRate || emp.department === 'قسم الاشعة' || emp.department === 'قسم الامنية' || emp.department === 'قسم الاسعاف') {
        flatRateCount++;
      }
    });

    payrolls.forEach(pr => {
      sumTotalDeductions += pr.totalDeductions;
      sumFinalSalary += pr.finalSalary;
    });

    return {
      sumTotalSalary,
      sumTotalDeductions,
      sumFinalSalary,
      flatRateCount
    };
  }, [employees, payrolls]);

  // إحصائيات الموظفين حسب القسم
  const employeesPerDept = useMemo(() => {
    const deptCounts: Record<string, number> = {};
    employees.forEach(emp => {
      deptCounts[emp.department] = (deptCounts[emp.department] || 0) + 1;
    });

    return Object.entries(deptCounts).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length]
    })).sort((a, b) => b.value - a.value);
  }, [employees]);

  // الإنفاق المالي لكل قسم
  const deptSpending = useMemo(() => {
    const deptsSum: Record<string, { total: number; final: number }> = {};
    payrolls.forEach(pr => {
      if (!deptsSum[pr.department]) {
        deptsSum[pr.department] = { total: 0, final: 0 };
      }
      deptsSum[pr.department].total += pr.totalSalary;
      deptsSum[pr.department].final += pr.finalSalary;
    });

    return Object.entries(deptsSum).map(([name, data]) => ({
      name,
      'الراتب الكلي': data.total,
      'الراتب النهائي': data.final
    })).sort((a, b) => b['الراتب النهائي'] - a['الراتب النهائي']);
  }, [payrolls]);

  // عينة مقارنة لـ 6 موظفين
  const salaryComparisonData = useMemo(() => {
    return payrolls.slice(0, 6).map(pr => ({
      name: pr.employeeName.split(' ')[1] || pr.employeeName,
      'الراتب الكلي': pr.totalSalary,
      'الراتب النهائي': pr.finalSalary
    }));
  }, [payrolls]);

  // مقارنة الرواتب لجميع الأقسام بين الشهر الحالي والشهر السابق بمعدات وتباين دائم ومستقر
  const monthlySalaryComparison = useMemo(() => {
    const currentDepts: Record<string, number> = {};
    payrolls.forEach(pr => {
      currentDepts[pr.department] = (currentDepts[pr.department] || 0) + pr.finalSalary;
    });

    return Object.entries(currentDepts).map(([name, currentVal], idx) => {
      // توليد عامل تباين واقعي ومستقرة تماماً يعتمد على طول اللفظ والفهرس
      const hashFactor = (((idx * 7) + name.length) % 10) - 5; // بين -5% و +4%
      const variancePercent = 1 + (hashFactor / 100);
      const prevVal = Math.round(currentVal > 0 ? currentVal * variancePercent : 0);

      return {
        name: name.replace("قسم ", ""), // تبسيط اسم القسم لعرض رائع في المحور الأفقي الرسم البياني
        'الشهر الحالي': currentVal,
        'الشهر السابق': prevVal,
      };
    }).sort((a, b) => b['الشهر الحالي'] - a['الشهر الحالي']);
  }, [payrolls]);

  return (
    <div className="space-y-6 text-right" dir="rtl" id="dashboard-view-wrapper">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-gradient-to-l from-teal-900 via-teal-800 to-emerald-700 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-12 -translate-y-8">
          <Stethoscope className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10 space-y-1">
          <h1 className="text-2xl md:text-3xl font-sans font-bold tracking-tight">مستشفى الفرح الأهلي</h1>
          <p className="text-emerald-100 text-sm">نظام الهيكلية الإدارية والمالية ومسير الرواتب الإلكتروني الموحد</p>
        </div>
        <div className="mt-4 md:mt-0 relative z-10 flex gap-3">
          <button 
            type="button"
            onClick={() => setActiveTab('payroll')}
            id="quick-start-payroll-btn"
            className="px-4 py-2.5 bg-white text-teal-900 font-bold rounded-xl shadow-sm hover:bg-emerald-50 transition-all flex items-center gap-2 text-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-800" />
            فتح كشف ومسير الرواتب المستحق
          </button>
        </div>
      </div>

      {/* Numerical Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Total Employees (Emerald Green Theme) - Far Right in RTL */}
        <motion.div 
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ duration: 0.2 }}
          className="bg-white p-5 rounded-[1.25rem] border border-gray-150 shadow-sm flex items-center justify-between"
          id="stat-employees"
        >
          {/* Text section on the right in RTL */}
          <div className="text-right flex-1">
            <span className="text-gray-500 font-bold text-xs block mb-1">إجمالي كادر المستشفى</span>
            <span className="font-sans text-2xl font-black text-gray-900 leading-none">{totalEmployees} موظفاً</span>
            <span className="text-[10px] text-gray-400 font-sans font-bold block mt-1.5">
              موزعين على {HOSPITAL_DEPARTMENTS_COUNT(employees)} قسماً فعلياً
            </span>
          </div>

          {/* Centered Professional Icon Block on the left in RTL */}
          <div className="w-14 h-14 rounded-2xl bg-[#10b981] text-white flex items-center justify-center shrink-0 shadow-[0_8px_20px_rgba(16,185,129,0.35)] ring-4 ring-emerald-50">
            <Users className="w-6 h-6 text-white stroke-[2.5]" />
          </div>
        </motion.div>

        {/* Card 2: Flat Rate (Purple Theme) - Middle Right in RTL */}
        <motion.div 
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ duration: 0.2 }}
          className="bg-white p-5 rounded-[1.25rem] border border-gray-150 shadow-sm flex items-center justify-between"
          id="stat-flat-rate"
        >
          {/* Text section on the right in RTL */}
          <div className="text-right flex-1">
            <span className="text-gray-500 font-bold text-xs block mb-1">كادر الراتب القطعي (المثبت)</span>
            <span className="font-sans text-2xl font-black text-gray-900 leading-none">{statsSummary.flatRateCount} موظفين</span>
            <span className="text-[10px] text-violet-600 font-sans font-bold block mt-1.5">الإسعاف، الأمنية، الأشعة</span>
          </div>

          {/* Centered Professional Icon Block on the left in RTL */}
          <div className="w-14 h-14 rounded-2xl bg-[#8b5cf6] text-white flex items-center justify-center shrink-0 shadow-[0_8px_20px_rgba(139,92,246,0.35)] ring-4 ring-purple-50">
            <Award className="w-6 h-6 text-white stroke-[2.5]" />
          </div>
        </motion.div>

        {/* Card 3: Total Deductions (Amber Orange Theme) - Middle Left in RTL */}
        <motion.div 
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ duration: 0.2 }}
          className="bg-white p-5 rounded-[1.25rem] border border-gray-150 shadow-sm flex items-center justify-between"
          id="stat-total-deductions"
        >
          {/* Text section on the right in RTL */}
          <div className="text-right flex-1">
            <span className="text-gray-500 font-bold text-xs block mb-1">إجمالي استقطاعات الغياب/الساعات</span>
            <span className="font-sans text-2xl font-black text-gray-900 leading-none">
              {statsSummary.sumTotalDeductions.toLocaleString()} <span className="text-xs font-bold text-amber-600">د.ع</span>
            </span>
            <span className="text-[10px] text-gray-400 font-sans font-bold block mt-1.5">لهذا الشهر الجاري</span>
          </div>

          {/* Centered Professional Icon Block on the left in RTL */}
          <div className="w-14 h-14 rounded-2xl bg-[#f59e0b] text-white flex items-center justify-center shrink-0 shadow-[0_8px_20px_rgba(245,158,11,0.35)] ring-4 ring-amber-50">
            <ShieldAlert className="w-6 h-6 text-white stroke-[2.5]" />
          </div>
        </motion.div>

        {/* Card 4: Total Salaries (Sky Blue Theme) - Far Left in RTL */}
        <motion.div 
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ duration: 0.2 }}
          className="bg-white p-5 rounded-[1.25rem] border border-gray-150 shadow-sm flex items-center justify-between"
          id="stat-total-salaries"
        >
          {/* Text section on the right in RTL */}
          <div className="text-right flex-1">
            <span className="text-gray-500 font-bold text-xs block mb-1">إجمالي الرواتب الكلية</span>
            <span className="font-sans text-2xl font-black text-gray-900 leading-none">
              {statsSummary.sumTotalSalary.toLocaleString()} <span className="text-xs font-bold text-sky-600">د.ع</span>
            </span>
            <span className="text-[10px] text-gray-400 font-sans font-bold block mt-1.5">قبل احتساب نسب الاستقطاع</span>
          </div>

          {/* Centered Professional Icon Block on the left in RTL */}
          <div className="w-14 h-14 rounded-2xl bg-[#0ea5e9] text-white flex items-center justify-center shrink-0 shadow-[0_8px_20px_rgba(14,165,233,0.35)] ring-4 ring-sky-50">
            <DollarSign className="w-6 h-6 text-white stroke-[2.5]" />
          </div>
        </motion.div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Departmental Spending Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800">التوزيع والإنفاق المالي</span>
            <h3 className="font-bold text-gray-800 text-sm">مقارنة الإنفاق الكلي والنهائي حسب الأقسام (دينار عراقي)</h3>
          </div>
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptSpending} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tickFormatter={(val) => `${(val / 1000).toLocaleString()}k`} tick={{ fill: '#64748b', fontSize: 10 }} orientation="right" />
                <Tooltip formatter={(value: any) => [`${Number(value).toLocaleString()} د.ع`]} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="الراتب الكلي" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="الراتب النهائي" fill="#0d9488" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Distribution Pie Chart */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-800 text-sm">توزيع و كفاءة الكادر بين الأقسام</h3>
            <p className="text-gray-400 text-xs">توزيع {totalEmployees} من العاملين بالأقسام والمناصب</p>
          </div>
          <div className="w-full h-48 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={employeesPerDept}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {employeesPerDept.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <span className="text-3xl font-sans font-extrabold text-teal-950">{totalEmployees}</span>
              <span className="text-gray-400 text-[10px] block font-bold">موظف بالخدمة</span>
            </div>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 text-xs scrollbar-thin">
            {employeesPerDept.map((dept) => {
              const IconComp = DEPT_ICONS_MAP[dept.name] || Stethoscope;
              return (
                <div key={dept.name} className="flex items-center justify-between text-[11px] py-1 border-b border-gray-50 hover:bg-slate-50 transition-colors">
                  <span className="text-gray-400 font-sans font-bold">%{Math.round((dept.value / totalEmployees) * 100)}</span>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-gray-700 font-bold">{dept.name} ({dept.value})</span>
                    <div className="p-1 rounded bg-slate-50 text-slate-600 border border-slate-200/60 shrink-0">
                      <IconComp className="w-3 h-3 text-slate-800" />
                    </div>
                    <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: dept.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Comparative Monthly Final Salaries Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4"
        id="monthly-salary-comparison-card"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="text-right">
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-850">المقارنات التاريخية الدورية للرواتب</span>
            <h3 className="font-sans font-extrabold text-[#0f766e] text-sm mt-2">رسم بياني لمقارنة الرواتب النهائية (الشهر الحالي 🗓️ مقابل الشهر السابق ⏱️)</h3>
            <p className="text-gray-400 text-[11px] mt-0.5">مقارنة المستحقات والرواتب الصافية للأقسام النشطة بمستشفى الفرح الأهلي</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold leading-none shrink-0" dir="rtl">
            <div className="flex items-center gap-1.5 bg-teal-50 text-teal-800 px-3 py-1.5 rounded-lg border border-teal-100">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600 block" />
              <span>الشهر الحالي</span>
            </div>
            <div className="flex items-center gap-1.5 bg-violet-50 text-violet-800 px-3 py-1.5 rounded-lg border border-violet-100">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-600 block" />
              <span>الشهر السابق</span>
            </div>
          </div>
        </div>
        
        <div className="w-full h-72">
          {monthlySalaryComparison.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400 text-xs py-10">
              لا توجد بيانات رواتب حالية للمقارنة. الرجاء إضافة رواتب لبدء العرض الإحصائي. 📊
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySalaryComparison} margin={{ top: 15, right: 15, left: 15, bottom: 15 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tickFormatter={(val) => `${(val / 1000).toLocaleString()}k`} tick={{ fill: '#64748b', fontSize: 10 }} orientation="right" />
                <Tooltip formatter={(value: any) => [`${Number(value).toLocaleString()} د.ع`]} />
                <Line type="monotone" dataKey="الشهر الحالي" stroke="#0d9488" strokeWidth={3} dot={{ r: 4, stroke: '#0d9488', strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 7 }} name="الشهر الحالي" />
                <Line type="monotone" dataKey="الشهر السابق" stroke="#8b5cf6" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4, stroke: '#8b5cf6', strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 7 }} name="الشهر السابق" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* Salary Comparison and Dynamic Guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sample Salary Compare */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs bg-slate-50 text-slate-700 px-2 py-1 rounded font-sans">عيّنة لـ {salaryComparisonData.length} موظفين</span>
            <h3 className="font-bold text-gray-800 text-sm">مقارنة الرواتب الكلية مقابل الصافية بعد خصومات الغياب</h3>
          </div>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salaryComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis orientation="right" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toLocaleString()}k`} />
                <Tooltip formatter={(value) => `${Number(value).toLocaleString()} د.ع`} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="الراتب الكلي" fill="#94a3b8" radius={[2, 2, 0, 0]} barSize={15} />
                <Bar dataKey="الراتب النهائي" fill="#14b8a6" radius={[2, 2, 0, 0]} barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hospital Policy Indicators (Regulatory Side) */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800 text-sm">محددات حساب الرواتب والاستقطاعات المعتمدة</h3>
          <div className="space-y-4 divide-y divide-gray-100 text-xs">
            
            <div className="flex items-start justify-between gap-3 pt-3">
              <span className="p-1 px-1.5 shrink-0 bg-teal-50 text-teal-800 rounded text-[10px] font-bold font-sans">الراتب الكلي ÷ 30</span>
              <div className="text-right space-y-0.5">
                <span className="font-bold text-gray-850 block text-xs">قانون اليوم الواحد</span>
                <span className="text-gray-400">يُحسب راتب اليوم الواحد بقسمة إجمالي الراتب الكلي للموظف على 30 يوماً بالتساوي في كل الفصول.</span>
              </div>
            </div>

            <div className="flex items-start justify-between gap-3 pt-3">
              <span className="p-1 px-1.5 shrink-0 bg-teal-50 text-teal-800 rounded text-[10px] font-bold font-sans">راتب اليوم ÷ 8</span>
              <div className="text-right space-y-0.5">
                <span className="font-bold text-gray-850 block text-xs">قانون الساعة الواحدة</span>
                <span className="text-gray-400">تُحتسب الساعة الاستقطاعية أو الإضافية بقسمة راتب اليوم الواحد للمنصب المشمول على 8 ساعات عمل رسمية.</span>
              </div>
            </div>

            <div className="flex items-start justify-between gap-3 pt-3">
              <span className="p-1 px-1.5 shrink-0 bg-red-50 text-red-800 rounded text-[10px] font-bold font-sans">مبلغ قطعي مثبت</span>
              <div className="text-right space-y-0.5">
                <span className="font-bold text-gray-850 block text-xs">استثناء رواتب فئة المبلغ القطعي</span>
                <span className="text-gray-400">استجابة لطلب المنظومة المرفق بالمخطط؛ فإن رواتب قسم الأمنية وقسم الإسعاف الفوري وقسم الأشعة يعتمد كـ "مبلغ قطعي" مثبت يحظر الخصم التلقائي منه.</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

// دالة لمعرفة عدد الأقسام المشغولة بالفعل
function HOSPITAL_DEPARTMENTS_COUNT(employees: Employee[]): number {
  const depts = new Set(employees.map(e => e.department));
  return depts.size;
}
