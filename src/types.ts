/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Employee {
  id: string; // الرقم الوظيفي
  name: string; // اسم الموظف
  department: string; // القسم
  title: string; // المنصب / المسمى الوظيفي
  status: 'active' | 'suspended' | 'on_leave'; // الحالة
  joinedDate: string; // تاريخ المباشرة
  notes?: string; // ملاحظات

  // 1. الادارة العليا
  baseSalary?: number; // الراتب الأساسي
  overtimeDays?: number; // إضافي عدد أيام
  overtimeHours?: number; // إضافي عدد ساعات
  penalties?: number; // مبلغ عقوبات
  workDaysCount?: number; // حقل عدد أيام الدوام

  // 2. قسم الصيدلية
  morningShiftValue?: number; // مبلغ الشفت الصباحي
  nightShiftValue?: number; // مبلغ الشفت الخفر
  morningShiftDays?: number; // عدد أيام الشفت الصباحي
  nightShiftDays?: number; // عدد أيام الشفت الخفر
  additions?: number; // إضافات
  deductions?: number; // استقطاعات

  // 3. قسم العمليات
  totalSalary?: number; // الراتب الإجمالي
  dayValue?: number; // مبلغ اليوم
  hourValue?: number; // مبلغ الساعة
  // workDaysCount?: number (shared)
  // additions?: number (shared)
  // deductions?: number (shared)

  // 4. قسم النسائية والتوليد
  fullDayValue?: number; // مبلغ اليوم الكامل
  halfShiftValue?: number; // مبلغ النص شفت
  // workDaysCount?: number (shared)
  // additions?: number (shared)
  // deductions?: number (shared)

  // 5. قسم الكافتريا
  // dayValue?: number (shared)
  // hourValue?: number (shared)
  // workDaysCount?: number (shared)
  // additions?: number (shared)
  // deductions?: number (shared)

  // 6. قسم الاطفال والخدج
  // morningShiftValue?: number (shared)
  // nightShiftValue?: number (shared)
  morningShiftDaysCount?: number; // عدد أيام الدوام الشفت الصباحي
  nightShiftDaysCount?: number; // عدد أيام الدوام الشفت الخفر
  // additions?: number (shared)
  // deductions?: number (shared)

  // 7. قسم السونار
  recallValue?: number; // مبلغ الاستدعاء
  // workDaysCount?: number (shared)
  // additions?: number (shared)
  // deductions?: number (shared)

  // 8. قسم اطباء الخدج المقيمين
  // fullDayValue?: number (shared)
  jointDayValue?: number; // مبلغ اليوم المشترك
  fullDayCount?: number; // عدد ايام الدوام الكامل
  jointDayCount?: number; // عدد ايام الدوام المشترك
  // additions?: number (shared)
  // deductions?: number (shared)

  // 9. قسم المختبر ومصرف الدم
  halfShiftValue9?: number; // مبلغ النص شفت
  morningShiftDays9?: number; // عدد ايام الشفت الصباحي
  nightShiftDays9?: number; // عدد ايام الشفت الخفر
  halfShiftDays9?: number; // عدد ايام النص شفت
  // additions?: number (shared)
  // deductions?: number (shared)

  // 10. قسم الاطباء المقيمين
  dayValue12h?: number; // مبلغ اليوم لـ 12 ساعة
  // workDaysCount?: number (shared)
  // additions?: number (shared)
  // deductions?: number (shared)

  // 11. قسم التمريض والردهات والطواريء
  shiftValue11?: number; // مبلغ الشفت
  workDays12h11?: number; // عدد ايام الدوام لـ 12 ساعة
  // additions?: number (shared)
  // deductions?: number (shared)

  // 12. قسم اطباء النسائية
  // dayValue?: number (shared)
  // workDaysCount?: number (shared)
  // additions?: number (shared)
  // deductions?: number (shared)

  // 13. قسم الاشعة
  radiologyTotalSum?: number; // المبلغ الكلي للأشعة
  
  // 14. قسم الامنية
  securityTotalSum?: number; // المبلغ الكلي للأمنية
  
  // 15. قسم الاسعاف
  ambulanceTotalSum?: number; // المبلغ الكلي للإسعاف

  // For compatibility with previous fields or fallback UI
  isFlatRate?: boolean; // للمطابقة مع النظام السابق
  deductionDays?: number;
  deductionHours?: number;
}

export interface PayrollRecord {
  id: string;
  payrollMonth: string; // الشهر (مثال: 05-2026)
  employeeId: string;
  employeeName: string;
  department: string;
  title: string;
  finalSalary: number; // الراتب النهائي بعد الاستقطاع والاضافه
  totalSalary: number;
  totalDeductions: number;
  totalAdditions: number;
  status: 'draft' | 'approved' | 'paid';
  processedDate?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}
