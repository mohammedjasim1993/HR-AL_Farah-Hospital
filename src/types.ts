/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Employee {
  id: string; // الرقم الوظيفي
  name: string; // اسم الموظف
  department: string; // القسم
  title: string; // المنصب / المسمى الوظيفي
  totalSalary: number; // الراتب الكلي
  dailySalary: number; // راتب اليوم الواحد (الراتب الكلي / 30)
  hourlySalary: number; // راتب الساعة الواحد (راتب اليوم الواحد / 8)
  deductionDays: number; // عدد أيام الاستقطاع
  deductionHours: number; // عدد ساعات الاستقطاع
  isFlatRate: boolean; // هل الراتب مبلغ قطعي؟ (رواتب الإسعاف، رواتب الأمنية، رواتب الأشعة)
  flatRateType?: 'ambulance' | 'security' | 'radiology' | 'none'; // نوع المبلغ القطعي
  joinedDate: string; // تاريخ المباشرة
  status: 'active' | 'suspended' | 'on_leave'; // الحالة
  notes?: string; // ملاحظات
}

export interface PayrollRecord {
  id: string;
  payrollMonth: string; // الشهر (مثال: 05-2026)
  employeeId: string;
  employeeName: string;
  department: string;
  title: string;
  totalSalary: number;
  dailySalary: number;
  hourlySalary: number;
  deductionDays: number;
  deductionHours: number;
  isFlatRate: boolean;
  flatRateType?: 'ambulance' | 'security' | 'radiology' | 'none';
  calculatedDeductionsDaysAmount: number; // أيام الاستقطاع * راتب اليوم الواحد
  calculatedDeductionsHoursAmount: number; // ساعات الاستقطاع * راتب الساعة
  totalDeductions: number; // مجموع الاستقطاعات
  finalSalary: number; // الراتب النهائي بعد الاستقطاع
  status: 'draft' | 'approved' | 'paid';
  processedDate?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}
