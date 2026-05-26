/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Employee, PayrollRecord } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Users, DollarSign, Stethoscope, ShieldAlert, Award, Clock, FileSpreadsheet, Percent, Calculator, ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';

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
      sumTotalSalary += emp.totalSalary;
      if (emp.isFlatRate) {
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex items-center justify-between"
          id="stat-employees"
        >
          <div className="p-3 bg-teal-50 text-teal-700 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div className="text-right">
            <span className="text-gray-400 text-xs block">إجمالي كادر المستشفى</span>
            <span className="font-sans text-xl font-bold text-gray-800">{totalEmployees} موظفاً</span>
            <span className="text-[10px] text-gray-400 block mt-0.5">موزعين على {HOSPITAL_DEPARTMENTS_COUNT(employees)} قسماً فعلياً</span>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex items-center justify-between"
          id="stat-total-salaries"
        >
          <div className="p-3 bg-sky-50 text-sky-700 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="text-right">
            <span className="text-gray-400 text-xs block">إجمالي الرواتب الكلية</span>
            <span className="font-sans text-xl font-bold text-sky-900">
              {statsSummary.sumTotalSalary.toLocaleString()} <span className="text-[10px] font-medium text-sky-700">د.ع</span>
            </span>
            <span className="text-[10px] text-gray-400 block mt-0.5">قبل احتساب نسب الاستقطاع</span>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex items-center justify-between"
          id="stat-total-deductions"
        >
          <div className="p-3 bg-red-50 text-red-700 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="text-right">
            <span className="text-gray-400 text-xs block">إجمالي استقطاعات الغياب/الساعات</span>
            <span className="font-sans text-xl font-bold text-red-700">
              {statsSummary.sumTotalDeductions.toLocaleString()} <span className="text-[10px] font-medium text-red-650">د.ع</span>
            </span>
            <span className="text-[10px] text-red-400 block mt-0.5">لهذا الشهر الجاري</span>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex items-center justify-between"
          id="stat-flat-rate"
        >
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div className="text-right">
            <span className="text-gray-400 text-xs block">كادر الراتب القطعي (المثبت)</span>
            <span className="font-sans text-xl font-bold text-amber-800">
              {statsSummary.flatRateCount} موظفين
            </span>
            <span className="text-[10px] text-amber-600 font-medium block mt-0.5">الإسعاف، الأمنية، الأشعة</span>
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
          <div className="max-h-32 overflow-y-auto space-y-1 pr-1 text-xs scrollbar-thin">
            {employeesPerDept.map((dept) => (
              <div key={dept.name} className="flex items-center justify-between text-[11px] py-0.5 border-b border-gray-50">
                <span className="text-gray-400 font-sans">%{Math.round((dept.value / totalEmployees) * 100)}</span>
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="text-gray-700 font-medium">{dept.name} ({dept.value})</span>
                  <span className="w-2.0 h-2.0 rounded-full inline-block shrink-0" style={{ backgroundColor: dept.color, width: '8px', height: '8px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

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
