/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Employee, PayrollRecord } from './types';

// قائمة الأقسام الـ 15 المعتمدة بالتفصيل لمستشفى الفرح الأهلي
export const HOSPITAL_DEPARTMENTS = [
  "الادارة العليا",
  "قسم الصيدلية",
  "قسم العمليات",
  "قسم النسائية والتوليد",
  "قسم الكافتريا",
  "قسم الاطفال والخدج",
  "قسم السونار",
  "قسم اطباء الخدج المقيمين",
  "قسم المختبر ومصرف الدم",
  "قسم الاطباء المقيمين",
  "قسم التمريض والردهات والطواريء",
  "قسم اطباء النسائية",
  "قسم الاشعة",
  "قسم الامنية",
  "قسم الاسعاف"
];

// قائمة المناصب التفصيلية المطابقة للأقسام الجديدة
export const DEPARTMENT_TITLES: Record<string, string[]> = {
  "الادارة العليا": [
    "المدير التنفيذي",
    "المدير الإداري",
    "مدير قسم الحسابات",
    "موظف حسابات",
    "مسؤول الاستعلامات",
    "موظف استقبال"
  ],
  "قسم الصيدلية": [
    "مسؤول الصيدلية",
    "صيدلاني خفر",
    "صيدلاني ممارس"
  ],
  "قسم العمليات": [
    "مسؤول صالة العمليات",
    "مساعد جراح",
    "مساعد تخدير",
    "ممرض عمليات"
  ],
  "قسم النسائية والتوليد": [
    "قابلة مأذونة",
    "ممرضة توليد"
  ],
  "قسم الكافتريا": [
    "طباخ رئيسي",
    "عامل صالة",
    "كاشير"
  ],
  "قسم الاطفال والخدج": [
    "مسؤول تمريض الخدج",
    "ممرض أطفال",
    "طبيب أطفال خفر"
  ],
  "قسم السونار": [
    "اختصاصي سونار وملخص",
    "طبيب استدعاء مفراس"
  ],
  "قسم اطباء الخدج المقيمين": [
    "طبيب مقيم أطفال وخدج"
  ],
  "قسم المختبر ومصرف الدم": [
    "مسؤول المختبر العلمي",
    "محلل كيميائي",
    "تقني سحب دم"
  ],
  "قسم الاطباء المقيمين": [
    "طبيب مقيم دوري خفر",
    "مسؤول الأطباء المقيمين"
  ],
  "قسم التمريض والردهات والطواريء": [
    "ممرض طوارئ رئيسي",
    "ممرض ردهة صباحي",
    "مسؤول التمريض الليلي"
  ],
  "قسم اطباء النسائية": [
    "طبيبة نسائية أخصائية",
    "مسؤولة قسم التوليد"
  ],
  "قسم الاشعة": [
    "مسؤول قسم الأشعة",
    "تقني أشعة وسونار",
    "طبيب أشعة استشاري"
  ],
  "قسم الامنية": [
    "مسؤول الأمن والسلامة",
    "حارس أمن نوبة"
  ],
  "قسم الاسعاف": [
    "سائق إسعاف فوري",
    "مسعف طوارئ ميداني"
  ]
};

// تهيئة الموظفين ببيانات واقعية تحاكي شجرة مستشفى الفرح الأهلي مع كامل الحقول المخصصة لكل قسم
export const INITIAL_EMPLOYEES: Employee[] = [
  // 1. الادارة العليا
  {
    id: "EMP-1001",
    name: "أ. حيدر الخفاجي",
    department: "الادارة العليا",
    title: "المدير التنفيذي",
    status: "active",
    joinedDate: "2020-01-15",
    baseSalary: 3500000,
    overtimeDays: 2,
    overtimeHours: 5,
    penalties: 0,
    workDaysCount: 30,
    notes: "الإدارة العليا للمستشفى"
  },
  {
    id: "EMP-1002",
    name: "أ. عمر نصير ياسين",
    department: "الادارة العليا",
    title: "المدير الإداري",
    status: "active",
    joinedDate: "2021-03-10",
    baseSalary: 2505000,
    overtimeDays: 0,
    overtimeHours: 0,
    penalties: 50000,
    workDaysCount: 29,
    notes: "مدير الشؤون الإدارية"
  },
  {
    id: "EMP-1003",
    name: "أ. مصطفى كامل الأسدي",
    department: "الادارة العليا",
    title: "مدير قسم الحسابات",
    status: "active",
    joinedDate: "2021-06-01",
    baseSalary: 2000000,
    overtimeDays: 3,
    overtimeHours: 8,
    penalties: 0,
    workDaysCount: 30
  },

  // 2. قسم الصيدلية
  {
    id: "EMP-2001",
    name: "د. ص. رانيا مرتضى الصدر",
    department: "قسم الصيدلية",
    title: "مسؤول الصيدلية",
    status: "active",
    joinedDate: "2021-02-14",
    morningShiftValue: 80000,
    nightShiftValue: 120000,
    morningShiftDays: 16,
    nightShiftDays: 10,
    additions: 150000,
    deductions: 0
  },
  {
    id: "EMP-2002",
    name: "د. ص. عباس فاضل العبيدي",
    department: "قسم الصيدلية",
    title: "صيدلاني خفر",
    status: "active",
    joinedDate: "2023-05-18",
    morningShiftValue: 70000,
    nightShiftValue: 100000,
    morningShiftDays: 14,
    nightShiftDays: 12,
    additions: 50000,
    deductions: 30000
  },

  // 3. قسم العمليات
  {
    id: "EMP-3001",
    name: "د. عمار ياسين الموسوي",
    department: "قسم العمليات",
    title: "مسؤول صالة العمليات",
    status: "active",
    joinedDate: "2019-05-15",
    totalSalary: 2500000,
    dayValue: 85000,
    hourValue: 10500,
    workDaysCount: 28,
    additions: 200000,
    deductions: 0
  },
  {
    id: "EMP-3002",
    name: "كرار عبد الصاحب",
    department: "قسم العمليات",
    title: "مساعد تخدير",
    status: "active",
    joinedDate: "2022-04-12",
    totalSalary: 1400000,
    dayValue: 45000,
    hourValue: 6000,
    workDaysCount: 26,
    additions: 50000,
    deductions: 40000
  },

  // 4. قسم النسائية والتوليد
  {
    id: "EMP-4001",
    name: "نادين وليد البياتي",
    department: "قسم النسائية والتوليد",
    title: "قابلة مأذونة",
    status: "active",
    joinedDate: "2022-08-20",
    fullDayValue: 60000,
    halfShiftValue: 30000,
    workDaysCount: 22,
    additions: 120000,
    deductions: 0
  },

  // 5. قسم الكافتريا
  {
    id: "EMP-5001",
    name: "أبو أحمد البصراوي",
    department: "قسم الكافتريا",
    title: "طباخ رئيسي",
    status: "active",
    joinedDate: "2018-12-01",
    dayValue: 35000,
    hourValue: 4500,
    workDaysCount: 28,
    additions: 70000,
    deductions: 0
  },
  {
    id: "EMP-5002",
    name: "أحمد ستار العراقي",
    department: "قسم الكافتريا",
    title: "عامل صالة",
    status: "active",
    joinedDate: "2023-09-15",
    dayValue: 25000,
    hourValue: 3000,
    workDaysCount: 26,
    additions: 0,
    deductions: 15000
  },

  // 6. قسم الاطفال والخدج
  {
    id: "EMP-6001",
    name: "دعاء طارق العامري",
    department: "قسم الاطفال والخدج",
    title: "مسؤول تمريض الخدج",
    status: "active",
    joinedDate: "2021-07-01",
    morningShiftValue: 50000,
    nightShiftValue: 75000,
    morningShiftDaysCount: 16,
    nightShiftDaysCount: 12,
    additions: 100000,
    deductions: 0
  },

  // 7. قسم السونار
  {
    id: "EMP-7001",
    name: "ميثاق صباح الربيعي",
    department: "قسم السونار",
    title: "اختصاصي سونار وملخص",
    status: "active",
    joinedDate: "2019-12-10",
    recallValue: 70000,
    workDaysCount: 20,
    additions: 150000,
    deductions: 20000
  },

  // 8. قسم اطباء الخدج المقيمين
  {
    id: "EMP-8001",
    name: "د. مريم جعفر الحسيني",
    department: "قسم اطباء الخدج المقيمين",
    title: "طبيب مقيم أطفال وخدج",
    status: "active",
    joinedDate: "2023-01-05",
    fullDayValue: 120000,
    jointDayValue: 160000,
    fullDayCount: 15,
    jointDayCount: 10,
    additions: 250000,
    deductions: 0
  },

  // 9. قسم المختبر ومصرف الدم
  {
    id: "EMP-9001",
    name: "د. كمال شاكر الخالد",
    department: "قسم المختبر ومصرف الدم",
    title: "مسؤول المختبر العلمي",
    status: "active",
    joinedDate: "2020-09-01",
    morningShiftValue: 55000,
    nightShiftValue: 85000,
    halfShiftValue9: 30000,
    morningShiftDays9: 14,
    nightShiftDays9: 12,
    halfShiftDays9: 4,
    additions: 80000,
    deductions: 10000
  },

  // 10. قسم الاطباء المقيمين
  {
    id: "EMP-10001",
    name: "د. حيدر الأسدي",
    department: "قسم الاطباء المقيمين",
    title: "مسؤول الأطباء المقيمين",
    status: "active",
    joinedDate: "2021-04-10",
    dayValue12h: 110000,
    workDaysCount: 24,
    additions: 180000,
    deductions: 0
  },

  // 11. قسم التمريض والردهات والطواريء
  {
    id: "EMP-11001",
    name: "يوسف جلال الموسوي",
    department: "قسم التمريض والردهات والطواريء",
    title: "ممرض طوارئ رئيسي",
    status: "active",
    joinedDate: "2022-09-01",
    shiftValue11: 45000,
    workDays12h11: 22,
    additions: 60000,
    deductions: 25000
  },

  // 12. قسم اطباء النسائية
  {
    id: "EMP-12001",
    name: "د. سهام عبد اللطيف",
    department: "قسم اطباء النسائية",
    title: "طبيبة نسائية أخصائية",
    status: "active",
    joinedDate: "2019-11-01",
    dayValue: 160000,
    workDaysCount: 18,
    additions: 300000,
    deductions: 0
  },

  // 13. قسم الاشعة
  {
    id: "EMP-13001",
    name: "د. علي الشمري",
    department: "قسم الاشعة",
    title: "طبيب أشعة استشاري",
    status: "active",
    joinedDate: "2022-01-20",
    radiologyTotalSum: 3000000,
    notes: "راتب قطعي بموجب العقد الكلي للاشعة"
  },

  // 14. قسم الامنية
  {
    id: "EMP-14001",
    name: "رائد كريم العزاوي",
    department: "قسم الامنية",
    title: "مسؤول الأمن والسلامة",
    status: "active",
    joinedDate: "2020-03-01",
    securityTotalSum: 1100000,
    notes: "راتب شهري قطعي مثبت للأمنية"
  },

  // 15. قسم الاسعاف
  {
    id: "EMP-15001",
    name: "عمار نجم العبادي",
    department: "قسم الاسعاف",
    title: "سائق إسعاف فوري",
    status: "active",
    joinedDate: "2021-12-01",
    ambulanceTotalSum: 950000,
    notes: "مبلغ قطعي مخصص للإسعاف الفوري"
  }
];

// دالة احتساب الراتب النهائي والاستقطاعات والإضافات حسب قواعد كل قسم الـ 15 المذكورة
export const calculateEmployeeSalaryAndDeductions = (emp: Employee) => {
  let finalSalary = 0;
  let totalDeductions = 0;
  let totalAdditions = 0;
  let calculationDetails = "";

  switch (emp.department) {
    case "الادارة العليا": {
      const base = emp.baseSalary || 0;
      const otDays = emp.overtimeDays || 0;
      const otHours = emp.overtimeHours || 0;
      const pens = emp.penalties || 0;
      const dedDays = emp.deductionDays || 0;
      const dedHours = emp.deductionHours || 0;
      
      const dayRate = Math.round(base / 30);
      const hourRate = Math.round(dayRate / 8);
      
      const addFromOtDays = otDays * dayRate;
      const addFromOtHours = otHours * hourRate;
      const dedFromDays = dedDays * dayRate;
      const dedFromHours = dedHours * hourRate;
      
      totalAdditions = addFromOtDays + addFromOtHours;
      totalDeductions = pens + dedFromDays + dedFromHours;
      finalSalary = base + totalAdditions - totalDeductions;
      
      calculationDetails = `الأساسي (${base.toLocaleString()}) + إضافي أيام (${otDays} × ${dayRate.toLocaleString()}) + إضافي ساعات (${otHours} × ${hourRate.toLocaleString()}) - غياب أيام (${dedDays} × ${dayRate.toLocaleString()}) - تأخير ساعات (${dedHours} × ${hourRate.toLocaleString()}) - عقوبات (${pens.toLocaleString()})`;
      break;
    }

    case "قسم الصيدلية": {
      const morningRate = emp.morningShiftValue || 0;
      const nightRate = emp.nightShiftValue || 0;
      const morningDays = emp.morningShiftDays || 0;
      const nightDays = emp.nightShiftDays || 0;
      const add = emp.additions || 0;
      const ded = emp.deductions || 0;

      const shiftsSum = (morningRate * morningDays) + (nightRate * nightDays);
      totalAdditions = add;
      totalDeductions = ded;
      finalSalary = shiftsSum + add - ded;
      
      calculationDetails = `الشفتات [صباحي (${morningDays} × ${morningRate.toLocaleString()}) + خفر (${nightDays} × ${nightRate.toLocaleString()}) = ${shiftsSum.toLocaleString()}] + إضافات (${add.toLocaleString()}) - استقطاعات (${ded.toLocaleString()})`;
      break;
    }

    case "قسم العمليات": {
      const totSal = emp.totalSalary || 0;
      const dVal = emp.dayValue || 0;
      const hVal = emp.hourValue || 0;
      const days = emp.workDaysCount || 0;
      const add = emp.additions || 0;
      const ded = emp.deductions || 0;

      // حساب الراتب مستنداً على مبلغ اليوم × عدد أيام الدوام أو الراتب الإجمالي المباشر
      const base = dVal > 0 ? (dVal * days) : totSal;
      totalAdditions = add;
      totalDeductions = ded;
      finalSalary = base + add - ded;
      
      calculationDetails = dVal > 0 
        ? `دوام أيام (${days} × ${dVal.toLocaleString()}) + إضافات (${add.toLocaleString()}) - استقطاعات (${ded.toLocaleString()})`
        : `الإجمالي المباشر (${totSal.toLocaleString()}) + إضافات (${add.toLocaleString()}) - استقطاعات (${ded.toLocaleString()})`;
      break;
    }

    case "قسم النسائية والتوليد": {
      const fDay = emp.fullDayValue || 0;
      const hShift = emp.halfShiftValue || 0;
      const days = emp.workDaysCount || 0;
      const add = emp.additions || 0;
      const ded = emp.deductions || 0;

      const base = (fDay * days) + hShift;
      totalAdditions = add;
      totalDeductions = ded;
      finalSalary = base + add - ded;
      
      calculationDetails = `يوم كامل (${days} × ${fDay.toLocaleString()}) + نصف شفت (${hShift.toLocaleString()}) + إضافات (${add.toLocaleString()}) - استقطاعات (${ded.toLocaleString()})`;
      break;
    }

    case "قسم الكافتريا": {
      const dVal = emp.dayValue || 0;
      const days = emp.workDaysCount || 0;
      const add = emp.additions || 0;
      const ded = emp.deductions || 0;

      const base = dVal * days;
      totalAdditions = add;
      totalDeductions = ded;
      finalSalary = base + add - ded;
      
      calculationDetails = `أيام العمل (${days} × ${dVal.toLocaleString()}) + إضافات (${add.toLocaleString()}) - استقطاعات (${ded.toLocaleString()})`;
      break;
    }

    case "قسم الاطفال والخدج": {
      const shiftMo = emp.morningShiftValue || 0;
      const shiftNi = emp.nightShiftValue || 0;
      const daysMo = emp.morningShiftDaysCount || 0;
      const daysNi = emp.nightShiftDaysCount || 0;
      const add = emp.additions || 0;
      const ded = emp.deductions || 0;

      const shiftsSum = (shiftMo * daysMo) + (shiftNi * daysNi);
      totalAdditions = add;
      totalDeductions = ded;
      finalSalary = shiftsSum + add - ded;
      
      calculationDetails = `مجموع الشفتين (${shiftsSum.toLocaleString()}) + إضافات (${add.toLocaleString()}) - استقطاعات (${ded.toLocaleString()})`;
      break;
    }

    case "قسم السونار": {
      const recallVal = emp.recallValue || 0;
      const days = emp.workDaysCount || 0;
      const add = emp.additions || 0;
      const ded = emp.deductions || 0;

      const base = recallVal * days;
      totalAdditions = add;
      totalDeductions = ded;
      finalSalary = base + add - ded;
      
      calculationDetails = `الاستدعاء (${days} × ${recallVal.toLocaleString()}) + إضافات (${add.toLocaleString()}) - استقطاعات (${ded.toLocaleString()})`;
      break;
    }

    case "قسم اطباء الخدج المقيمين": {
      const fullDayVal = emp.fullDayValue || 0;
      const jointDayVal = emp.jointDayValue || 0;
      const fdCount = emp.fullDayCount || 0;
      const jdCount = emp.jointDayCount || 0;
      const add = emp.additions || 0;
      const ded = emp.deductions || 0;

      const base = (fullDayVal * fdCount) + (jointDayVal * jdCount);
      totalAdditions = add;
      totalDeductions = ded;
      finalSalary = base + add - ded;
      
      calculationDetails = `يوم كامل (${fdCount} × ${fullDayVal.toLocaleString()}) + يوم مشترك (${jdCount} × ${jointDayVal.toLocaleString()}) + إضافات (${add.toLocaleString()}) - استقطاعات (${ded.toLocaleString()})`;
      break;
    }

    case "قسم المختبر ومصرف الدم": {
      const moVal = emp.morningShiftValue || 0;
      const niVal = emp.nightShiftValue || 0;
      const halfVal = emp.halfShiftValue9 || 0;
      const moDays = emp.morningShiftDays9 || 0;
      const niDays = emp.nightShiftDays9 || 0;
      const halfDays = emp.halfShiftDays9 || 0;
      const add = emp.additions || 0;
      const ded = emp.deductions || 0;

      const baseSum = (moVal * moDays) + (niVal * niDays) + (halfVal * halfDays);
      totalAdditions = add;
      totalDeductions = ded;
      finalSalary = baseSum + add - ded;
      
      calculationDetails = `صباحي (${moDays}×${moVal.toLocaleString()}) + خفر (${niDays}×${niVal.toLocaleString()}) + نصف شفت (${halfDays}×${halfVal.toLocaleString()}) + إضافات (${add}) - لمختبر (${ded})`;
      break;
    }

    case "قسم الاطباء المقيمين": {
      const d12hVal = emp.dayValue12h || 0;
      const days = emp.workDaysCount || 0;
      const add = emp.additions || 0;
      const ded = emp.deductions || 0;

      const base = d12hVal * days;
      totalAdditions = add;
      totalDeductions = ded;
      finalSalary = base + add - ded;
      
      calculationDetails = `يوم 12ساعة (${days} × ${d12hVal.toLocaleString()}) + إضافات (${add.toLocaleString()}) - استقطاعات (${ded.toLocaleString()})`;
      break;
    }

    case "قسم التمريض والردهات والطواريء": {
      const sVal = emp.shiftValue11 || 0;
      const days = emp.workDays12h11 || 0;
      const add = emp.additions || 0;
      const ded = emp.deductions || 0;

      const base = sVal * days;
      totalAdditions = add;
      totalDeductions = ded;
      finalSalary = base + add - ded;
      
      calculationDetails = `الشفت (${days} × ${sVal.toLocaleString()}) + إضافات (${add.toLocaleString()}) - استقطاعات (${ded.toLocaleString()})`;
      break;
    }

    case "قسم اطباء النسائية": {
      const dVal = emp.dayValue || 0;
      const days = emp.workDaysCount || 0;
      const add = emp.additions || 0;
      const ded = emp.deductions || 0;

      const base = dVal * days;
      totalAdditions = add;
      totalDeductions = ded;
      finalSalary = base + add - ded;
      
      calculationDetails = `الأيام (${days} × ${dVal.toLocaleString()}) + إضافات (${add.toLocaleString()}) - استقطاعات (${ded.toLocaleString()})`;
      break;
    }

    case "قسم الاشعة": {
      finalSalary = emp.radiologyTotalSum || 0;
      calculationDetails = `مبلغ قطعي كلي للاشعة يدوياً: ${finalSalary.toLocaleString()} د.ع`;
      break;
    }

    case "قسم الامنية": {
      finalSalary = emp.securityTotalSum || 0;
      calculationDetails = `مبلغ قطعي كلي للامنية يدوياً: ${finalSalary.toLocaleString()} د.ع`;
      break;
    }

    case "قسم الاسعاف": {
      finalSalary = emp.ambulanceTotalSum || 0;
      calculationDetails = `مبلغ قطعي كلي للاسعاف يدوياً: ${finalSalary.toLocaleString()} د.ع`;
      break;
    }

    default: {
      finalSalary = emp.totalSalary || 0;
      calculationDetails = `حساب عام افتراضي: ${finalSalary.toLocaleString()} د.ع`;
      break;
    }
  }

  return {
    finalSalary,
    totalDeductions,
    totalAdditions,
    calculationDetails
  };
};

export const INITIAL_PAYROLLS: PayrollRecord[] = INITIAL_EMPLOYEES.map(emp => {
  const calc = calculateEmployeeSalaryAndDeductions(emp);

  return {
    id: `PR-202605-${emp.id}`,
    payrollMonth: "2026-05",
    employeeId: emp.id,
    employeeName: emp.name,
    department: emp.department,
    title: emp.title,
    finalSalary: calc.finalSalary,
    totalSalary: emp.totalSalary || emp.baseSalary || emp.radiologyTotalSum || emp.securityTotalSum || emp.ambulanceTotalSum || 0,
    totalDeductions: calc.totalDeductions,
    totalAdditions: calc.totalAdditions,
    status: 'draft',
    processedDate: '2026-05-26'
  };
});
