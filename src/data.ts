/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Employee, PayrollRecord } from './types';

// قائمة الأقسام المعتمدة في مستشفى الفرح الأهلي
export const HOSPITAL_DEPARTMENTS = [
  "الإدارة العامة",
  "قسم العمليات",
  "قسم الصيدلية",
  "قسم النسائية والتوليد",
  "الكافتيريا",
  "قسم الأطفال والخدج",
  "قسم الأشعة والمفراس والسونار",
  "قسم أطباء الخدج المقيمين",
  "قسم المختبر",
  "قسم التمريض الأطباء المقيمين",
  "قسم التمريض الردهات والطوارئ",
  "قسم أطباء النسائية",
  "قسم الأمنية والحراسة",
  "قسم الإسعاف الفوري"
];

// قائمة المناصب التفصيلية حسب الهيكلية المرفقة لمستشفى الفرح الأهلي
export const DEPARTMENT_TITLES: Record<string, string[]> = {
  "الإدارة العامة": [
    "المدير التنفيذي",
    "المدير الإداري",
    "مدير قسم الحسابات",
    "موظف حسابات",
    "مدير قسم تقنية المعلومات",
    "مدير قسم الاحصاء",
    "موظف احصاء",
    "مسؤول الاستعلامات",
    "موظف استقبال",
    "مدير قسم الخدمات",
    "موظف خدمات",
    "مدير قسم الموارد البشرية"
  ],
  "قسم العمليات": [
    "مسؤول صالة العمليات",
    "موظف خدمات",
    "مساعد جراح",
    "مساعد تخدير",
    "مدخل بيانات"
  ],
  "قسم الصيدلية": [
    "مسؤول الصيدلية",
    "صيدلاني"
  ],
  "قسم النسائية والتوليد": [
    "قابلة"
  ],
  "الكافتيريا": [
    "كلفة / طباخ",
    "عامل"
  ],
  "قسم الأطفال والخدج": [
    "مسؤول قسم تمريض الخدج",
    "ممرض"
  ],
  "قسم الأشعة والمفراس والسونار": [
    "مسؤول قسم الأشعة والسونار",
    "طبيب أشعة وسونار"
  ],
  "قسم أطباء الخدج المقيمين": [
    "طبيب مقيم"
  ],
  "قسم المختبر": [
    "مسؤول قسم المختبر",
    "محلل"
  ],
  "قسم التمريض الأطباء المقيمين": [
    "مسؤول الأطباء المقيمين",
    "طبيب مقيم"
  ],
  "قسم التمريض الردهات والطوارئ": [
    "ممرض"
  ],
  "قسم أطباء النسائية": [
    "مسؤول قسم أطباء النسائية",
    "طبيبة نسائية"
  ],
  "قسم الأمنية والحراسة": [
    "مسؤول الأمنية",
    "حارس أمن"
  ],
  "قسم الإسعاف الفوري": [
    "سائق إسعاف",
    "مسعف طوارئ"
  ]
};

// تهيئة الموظفين ببيانات واقعية تحاكي شجرة مستشفى الفرح الأهلي بدقة متناهية
export const INITIAL_EMPLOYEES: Employee[] = [
  // 1. الإدارة العامة
  {
    id: "EMP-1001",
    name: "أ. حيدر الخفاجي",
    department: "الإدارة العامة",
    title: "المدير التنفيذي",
    totalSalary: 3500000,
    dailySalary: Math.round(3500000 / 30),
    hourlySalary: Math.round((3500000 / 30) / 8),
    deductionDays: 0,
    deductionHours: 0,
    isFlatRate: false,
    joinedDate: "2020-01-15",
    status: "active",
    notes: "مدير الإدارة العامة للمستشفى"
  },
  {
    id: "EMP-1002",
    name: "أ. عمر نصير ياسين",
    department: "الإدارة العامة",
    title: "المدير الإداري",
    totalSalary: 2500000,
    dailySalary: Math.round(2500000 / 30),
    hourlySalary: Math.round((2500000 / 30) / 8),
    deductionDays: 0,
    deductionHours: 0,
    isFlatRate: false,
    joinedDate: "2021-03-10",
    status: "active"
  },
  {
    id: "EMP-1003",
    name: "أ. مصطفى كامل الأسدي",
    department: "الإدارة العامة",
    title: "مدير قسم الحسابات",
    totalSalary: 2000000,
    dailySalary: Math.round(2000000 / 30),
    hourlySalary: Math.round((2000000 / 30) / 8),
    deductionDays: 1, // تجسيد استقطاع افتراضي للتوضيح
    deductionHours: 2,
    isFlatRate: false,
    joinedDate: "2021-06-01",
    status: "active"
  },
  {
    id: "EMP-1004",
    name: "علي باسم التميمي",
    department: "الإدارة العامة",
    title: "موظف حسابات",
    totalSalary: 1200000,
    dailySalary: Math.round(1200000 / 30),
    hourlySalary: Math.round((1200000 / 30) / 8),
    deductionDays: 0,
    deductionHours: 0,
    isFlatRate: false,
    joinedDate: "2023-01-20",
    status: "active"
  },
  {
    id: "EMP-1005",
    name: "م. سيف الدين زاهر",
    department: "الإدارة العامة",
    title: "مدير قسم تقنية المعلومات",
    totalSalary: 1500000,
    dailySalary: Math.round(1500000 / 30),
    hourlySalary: Math.round((1500000 / 30) / 8),
    deductionDays: 0,
    deductionHours: 0,
    isFlatRate: false,
    joinedDate: "2022-05-15",
    status: "active"
  },
  {
    id: "EMP-1006",
    name: "أ. أحمد عبد الرزاق",
    department: "الإدارة العامة",
    title: "مدير قسم الاحصاء",
    totalSalary: 1300000,
    dailySalary: Math.round(1300000 / 30),
    hourlySalary: Math.round((1300000 / 30) / 8),
    deductionDays: 0,
    deductionHours: 0,
    isFlatRate: false,
    joinedDate: "2021-09-01",
    status: "active"
  },
  {
    id: "EMP-1007",
    name: "رشا كريم البياتي",
    department: "الإدارة العامة",
    title: "موظف احصاء",
    totalSalary: 900000,
    dailySalary: Math.round(900000 / 30),
    hourlySalary: Math.round((900000 / 30) / 8),
    deductionDays: 0,
    deductionHours: 0,
    isFlatRate: false,
    joinedDate: "2024-02-10",
    status: "active"
  },
  {
    id: "EMP-1008",
    name: "وليد خالد الكعبي",
    department: "الإدارة العامة",
    title: "مسؤول الاستعلامات",
    totalSalary: 850000,
    dailySalary: Math.round(850000 / 30),
    hourlySalary: Math.round((850000 / 30) / 8),
    deductionDays: 0,
    deductionHours: 0,
    isFlatRate: false,
    joinedDate: "2022-11-12",
    status: "active"
  },
  {
    id: "EMP-1009",
    name: "مها جاسم الفتلاوي",
    department: "الإدارة العامة",
    title: "موظف استقبال",
    totalSalary: 750000,
    dailySalary: Math.round(750000 / 30),
    hourlySalary: Math.round((750000 / 30) / 8),
    deductionDays: 2,
    deductionHours: 0,
    isFlatRate: false,
    joinedDate: "2024-01-05",
    status: "active"
  },
  {
    id: "EMP-1010",
    name: "جاسم محمد الدفاعي",
    department: "الإدارة العامة",
    title: "مدير قسم الخدمات",
    totalSalary: 1100000,
    dailySalary: Math.round(1100000 / 30),
    hourlySalary: Math.round((1100000 / 30) / 8),
    deductionDays: 0,
    deductionHours: 0,
    isFlatRate: false,
    joinedDate: "2020-04-18",
    status: "active"
  },
  {
    id: "EMP-1011",
    name: "حيدر كاظم الخفاجي",
    department: "الإدارة العامة",
    title: "موظف خدمات",
    totalSalary: 650000,
    dailySalary: Math.round(650000 / 30),
    hourlySalary: Math.round((650000 / 30) / 8),
    deductionDays: 0,
    deductionHours: 4,
    isFlatRate: false,
    joinedDate: "2023-07-22",
    status: "active"
  },
  {
    id: "EMP-1012",
    name: "أ. رائد الجبوري",
    department: "الإدارة العامة",
    title: "مدير قسم الموارد البشرية",
    totalSalary: 1800000,
    dailySalary: Math.round(1800000 / 30),
    hourlySalary: Math.round((1800000 / 30) / 8),
    deductionDays: 0,
    deductionHours: 0,
    isFlatRate: false,
    joinedDate: "2020-08-01",
    status: "active"
  },

  // 2. قسم العمليات
  {
    id: "EMP-2001",
    name: "د. عمار ياسين الموسوي",
    department: "قسم العمليات",
    title: "مسؤول صالة العمليات",
    totalSalary: 2500000,
    dailySalary: Math.round(2500000 / 30),
    hourlySalary: Math.round((2500000 / 30) / 8),
    deductionDays: 0,
    deductionHours: 0,
    isFlatRate: false,
    joinedDate: "2019-05-15",
    status: "active"
  },
  {
    id: "EMP-2002",
    name: "سجاد باسم السوداني",
    department: "قسم العمليات",
    title: "موظف خدمات",
    totalSalary: 650000,
    dailySalary: Math.round(650000 / 30),
    hourlySalary: Math.round((650000 / 30) / 8),
    deductionDays: 0,
    deductionHours: 0,
    isFlatRate: false,
    joinedDate: "2024-03-01",
    status: "active"
  },
  {
    id: "EMP-2003",
    name: "ميثم حميد الشمري",
    department: "قسم العمليات",
    title: "مساعد جراح",
    totalSalary: 1500000,
    dailySalary: Math.round(1500000 / 30),
    hourlySalary: Math.round((1500000 / 30) / 8),
    deductionDays: 0,
    deductionHours: 0,
    isFlatRate: false,
    joinedDate: "2021-11-20",
    status: "active"
  },
  {
    id: "EMP-2004",
    name: "كرار عبد الصاحب",
    department: "قسم العمليات",
    title: "مساعد تخدير",
    totalSalary: 1400000,
    dailySalary: Math.round(1400000 / 30),
    hourlySalary: Math.round((1400000 / 30) / 8),
    deductionDays: 1,
    deductionHours: 0,
    isFlatRate: false,
    joinedDate: "2022-04-12",
    status: "active"
  },
  {
    id: "EMP-2005",
    name: "علي حسن الفتلاوي",
    department: "قسم العمليات",
    title: "مدخل بيانات",
    totalSalary: 800000,
    dailySalary: Math.round(800000 / 30),
    hourlySalary: Math.round((800000 / 30) / 8),
    deductionDays: 0,
    deductionHours: 0,
    isFlatRate: false,
    joinedDate: "2023-10-01",
    status: "active"
  },

  // 3. قسم الصيدلية
  {
    id: "EMP-3001",
    name: "د. ص. رانيا مرتضى الصدر",
    department: "قسم الصيدلية",
    title: "مسؤول الصيدلية",
    totalSalary: 2100000,
    dailySalary: Math.round(2100000 / 30),
    hourlySalary: Math.round((2100000 / 30) / 8),
    deductionDays: 0,
    deductionHours: 0,
    isFlatRate: false,
    joinedDate: "2021-02-14",
    status: "active"
  },
  {
    id: "EMP-3002",
    name: "د. ص. عباس فاضل العبيدي",
    department: "قسم الصيدلية",
    title: "صيدلاني",
    totalSalary: 1600000,
    dailySalary: Math.round(1600000 / 30),
    hourlySalary: Math.round((1600000 / 30) / 8),
    deductionDays: 0,
    deductionHours: 0,
    isFlatRate: false,
    joinedDate: "2023-05-18",
    status: "active"
  },

  // 4. قسم النسائية والتوليد
  {
    id: "EMP-4001",
    name: "نادين وليد البياتي",
    department: "قسم النسائية والتوليد",
    title: "قابلة",
    totalSalary: 1200000,
    dailySalary: Math.round(1200000 / 30),
    hourlySalary: Math.round((1200000 / 30) / 8),
    deductionDays: 0,
    deductionHours: 0,
    isFlatRate: false,
    joinedDate: "2022-08-20",
    status: "active"
  },

  // 5. الكافتيريا
  {
    id: "EMP-5001",
    name: "أبو أحمد البصراوي",
    department: "الكافتيريا",
    title: "كلفة / طباخ",
    totalSalary: 1000000,
    dailySalary: Math.round(1000000 / 30),
    hourlySalary: Math.round((1000000 / 30) / 8),
    deductionDays: 0,
    deductionHours: 0,
    isFlatRate: false,
    joinedDate: "2018-12-01",
    status: "active"
  },
  {
    id: "EMP-5002",
    name: "أحمد ستار العراقي",
    department: "الكافتيريا",
    title: "عامل",
    totalSalary: 600000,
    dailySalary: Math.round(600000 / 30),
    hourlySalary: Math.round((600000 / 30) / 8),
    deductionDays: 0,
    deductionHours: 0,
    isFlatRate: false,
    joinedDate: "2023-09-15",
    status: "active"
  },

  // 6. قسم الأطفال والخدج
  {
    id: "EMP-6001",
    name: "دعاء طارق العامري",
    department: "قسم الأطفال والخدج",
    title: "مسؤول قسم تمريض الخدج",
    totalSalary: 1350000,
    dailySalary: Math.round(1350000 / 30),
    hourlySalary: Math.round((1350000 / 30) / 8),
    deductionDays: 0,
    deductionHours: 0,
    isFlatRate: false,
    joinedDate: "2021-07-01",
    status: "active"
  },
  {
    id: "EMP-6002",
    name: "ممرض محمد سعد الخالدي",
    department: "قسم الأطفال والخدج",
    title: "ممرض",
    totalSalary: 950000,
    dailySalary: Math.round(950000 / 30),
    hourlySalary: Math.round((950000 / 30) / 8),
    deductionDays: 1,
    deductionHours: 3,
    isFlatRate: false,
    joinedDate: "2022-10-10",
    status: "active"
  },

  // 7. قسم الأشعة والمفراس والسونار (رواتب الأشعة = مبلغ قطعي)
  {
    id: "EMP-7001",
    name: "ميثاق صباح الربيعي",
    department: "قسم الأشعة والمفراس والسونار",
    title: "مسؤول قسم الأشعة والسونار",
    totalSalary: 1400000,
    dailySalary: Math.round(1400000 / 30),
    hourlySalary: Math.round((1400000 / 30) / 8),
    deductionDays: 0,
    deductionHours: 0,
    isFlatRate: true,
    flatRateType: "radiology",
    joinedDate: "2019-12-10",
    status: "active",
    notes: "رتب قطعي - رواتب الأشعة قطعية"
  },
  {
    id: "EMP-7002",
    name: "د. علي الشمري",
    department: "قسم الأشعة والمفراس والسونار",
    title: "طبيب أشعة وسونار",
    totalSalary: 3000000,
    dailySalary: Math.round(3000000 / 30),
    hourlySalary: Math.round((3000000 / 30) / 8),
    deductionDays: 0,
    deductionHours: 0,
    isFlatRate: true,
    flatRateType: "radiology",
    joinedDate: "2022-01-20",
    status: "active",
    notes: "راتب قطعي - مستثنى من قوانين الاستقطاعات اليومية"
  },

  // 8. قسم أطباء الخدج المقيمين
  {
    id: "EMP-8001",
    name: "د. مريم جعفر الحسيني",
    department: "قسم أطباء الخدج المقيمين",
    title: "طبيب مقيم",
    totalSalary: 1800000,
    dailySalary: Math.round(1800000 / 30),
    hourlySalary: Math.round((1800000 / 30) / 8),
    deductionDays: 0,
    deductionHours: 0,
    isFlatRate: false,
    joinedDate: "2023-01-05",
    status: "active"
  },

  // 9. قسم المختبر
  {
    id: "EMP-9001",
    name: "د. كمال شاكر الخالد",
    department: "قسم المختبر",
    title: "مسؤول قسم المختبر",
    totalSalary: 1800000,
    dailySalary: Math.round(1800000 / 30),
    hourlySalary: Math.round((1800000 / 30) / 8),
    deductionDays: 0,
    deductionHours: 0,
    isFlatRate: false,
    joinedDate: "2020-09-01",
    status: "active"
  },
  {
    id: "EMP-9002",
    name: "زينب حيدر الجابري",
    department: "قسم المختبر",
    title: "محلل",
    totalSalary: 1100000,
    dailySalary: Math.round(1100000 / 30),
    hourlySalary: Math.round((1100000 / 30) / 8),
    deductionDays: 0,
    deductionHours: 0,
    isFlatRate: false,
    joinedDate: "2024-03-01",
    status: "active"
  },

  // 10. قسم التمريض الأطباء المقيمين
  {
    id: "EMP-10001",
    name: "د. حيدر الأسدي",
    department: "قسم التمريض الأطباء المقيمين",
    title: "مسؤول الأطباء المقيمين",
    totalSalary: 2200000,
    dailySalary: Math.round(2200000 / 30),
    hourlySalary: Math.round((2200000 / 30) / 8),
    deductionDays: 0,
    deductionHours: 0,
    isFlatRate: false,
    joinedDate: "2021-04-10",
    status: "active"
  },
  {
    id: "EMP-10002",
    name: "د. فاطمة زهير الخاقاني",
    department: "قسم التمريض الأطباء المقيمين",
    title: "طبيب مقيم",
    totalSalary: 1700000,
    dailySalary: Math.round(1700000 / 30),
    hourlySalary: Math.round((1700000 / 30) / 8),
    deductionDays: 0,
    deductionHours: 0,
    isFlatRate: false,
    joinedDate: "2023-11-20",
    status: "active"
  },

  // 11. قسم التمريض الردهات والطوارئ
  {
    id: "EMP-11001",
    name: "يوسف جلال الموسوي",
    department: "قسم التمريض الردهات والطوارئ",
    title: "ممرض",
    totalSalary: 950000,
    dailySalary: Math.round(950000 / 30),
    hourlySalary: Math.round((950000 / 30) / 8),
    deductionDays: 0,
    deductionHours: 0,
    isFlatRate: false,
    joinedDate: "2022-09-01",
    status: "active"
  },

  // 12. قسم أطباء النسائية
  {
    id: "EMP-12001",
    name: "د. سهام عبد اللطيف",
    department: "قسم أطباء النسائية",
    title: "مسؤول قسم أطباء النسائية",
    totalSalary: 2800000,
    dailySalary: Math.round(2800000 / 30),
    hourlySalary: Math.round((2800000 / 30) / 8),
    deductionDays: 0,
    deductionHours: 0,
    isFlatRate: false,
    joinedDate: "2019-11-01",
    status: "active"
  },
  {
    id: "EMP-12002",
    name: "د. غدير جعفر المالكي",
    department: "قسم أطباء النسائية",
    title: "طبيبة نسائية",
    totalSalary: 2400000,
    dailySalary: Math.round(2400000 / 30),
    hourlySalary: Math.round((2400000 / 30) / 8),
    deductionDays: 0,
    deductionHours: 0,
    isFlatRate: false,
    joinedDate: "2023-08-15",
    status: "active"
  },

  // 13. قسم الأمنية والحراسة (رواتب الأمنية = مبلغ قطعي)
  {
    id: "EMP-13001",
    name: "رائد كريم العزاوي",
    department: "قسم الأمنية والحراسة",
    title: "مسؤول الأمنية",
    totalSalary: 1100000,
    dailySalary: Math.round(1100000 / 30),
    hourlySalary: Math.round((1100000 / 30) / 8),
    deductionDays: 0,
    deductionHours: 0,
    isFlatRate: true,
    flatRateType: "security",
    joinedDate: "2020-03-01",
    status: "active",
    notes: "راتب قطعي - مستثنى من الاستقطاعات"
  },
  {
    id: "EMP-13002",
    name: "عباس مطر الفضلي",
    department: "قسم الأمنية والحراسة",
    title: "حارس أمن",
    totalSalary: 700000,
    dailySalary: Math.round(700000 / 30),
    hourlySalary: Math.round((700000 / 30) / 8),
    deductionDays: 0,
    deductionHours: 0,
    isFlatRate: true,
    flatRateType: "security",
    joinedDate: "2023-02-15",
    status: "active",
    notes: "راتب قطعي للأفراد الحرس"
  },

  // 14. قسم الإسعاف الفوري (رواتب الإسعاف = مبلغ قطعي)
  {
    id: "EMP-14001",
    name: "عمار نجم العبادي",
    department: "قسم الإسعاف الفوري",
    title: "سائق إسعاف",
    totalSalary: 900000,
    dailySalary: Math.round(900000 / 30),
    hourlySalary: Math.round((900000 / 30) / 8),
    deductionDays: 0,
    deductionHours: 0,
    isFlatRate: true,
    flatRateType: "ambulance",
    joinedDate: "2021-12-01",
    status: "active",
    notes: "راتب قطعي - فئة سيارات الإسعاف الفوري"
  },
  {
    id: "EMP-14002",
    name: "تحسين علاء العكيلي",
    department: "قسم الإسعاف الفوري",
    title: "مسعف طوارئ",
    totalSalary: 1000000,
    dailySalary: Math.round(1000000 / 30),
    hourlySalary: Math.round((1000000 / 30) / 8),
    deductionDays: 0,
    deductionHours: 0,
    isFlatRate: true,
    flatRateType: "ambulance",
    joinedDate: "2022-05-15",
    status: "active",
    notes: "راتب قطعي للمسعفين الميدانيين"
  }
];

// دالة احتساب الراتب النهائي والاستقطاعات لموظف معين
export const calculateEmployeeSalaryAndDeductions = (emp: Employee) => {
  // للرواتب القطعية، بعض الأنظمة تتجاهل استقطاع ساعات وأيام الغياب أو تحسبها في الحالات النادرة للغاية.
  // تماشياً مع طلب المخطط: "رواتب الاسعاف، الأمنية، الأشعة = مبلغ قطعي"، لن نجري استقطاعات عليها إلا إذا تم تحديدها يدوياً
  // من باب الكفاءة والوضوح، سيتم الحساب بالشكل التالي:
  const isFlat = emp.isFlatRate;
  
  // الاحتساب القياسي بناء على طلب المخطط للأعمدة:
  const daily = Math.round(emp.totalSalary / 30);
  const hourly = Math.round(daily / 8);

  const deductionDaysAmount = isFlat ? 0 : emp.deductionDays * daily;
  const deductionHoursAmount = isFlat ? 0 : emp.deductionHours * hourly;
  const totalDeductions = deductionDaysAmount + deductionHoursAmount;
  const finalSalary = emp.totalSalary - totalDeductions;

  return {
    dailySalary: daily,
    hourlySalary: hourly,
    deductionDaysAmount,
    deductionHoursAmount,
    totalDeductions,
    finalSalary
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
    totalSalary: emp.totalSalary,
    dailySalary: calc.dailySalary,
    hourlySalary: calc.hourlySalary,
    deductionDays: emp.deductionDays,
    deductionHours: emp.deductionHours,
    isFlatRate: emp.isFlatRate,
    flatRateType: emp.flatRateType,
    calculatedDeductionsDaysAmount: calc.deductionDaysAmount,
    calculatedDeductionsHoursAmount: calc.deductionHoursAmount,
    totalDeductions: calc.totalDeductions,
    finalSalary: calc.finalSalary,
    status: 'draft',
    processedDate: '2026-05-26'
  };
});
