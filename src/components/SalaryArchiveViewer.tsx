import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import html2pdf from 'html2pdf.js';
import { showToast } from '../lib/toast';
import HospitalLogo from './HospitalLogo';
import {
  Calendar,
  Building2,
  Users,
  Search,
  FileText,
  ChevronDown,
  Coins,
  TrendingDown,
  Info,
  CalendarDays,
  X,
  CreditCard,
  Building,
  ArrowLeft,
  DollarSign,
  FileSpreadsheet,
  Printer,
  SlidersHorizontal,
  Trash2
} from 'lucide-react';
import { ArchivedMonth, Department, Employee, CalculatedPayroll, FieldId } from '../types';
import { FIELDS_METADATA, calculateEmployeePayroll } from '../data';

export const getDeptCategoryKey = (deptId?: string, deptName?: string): string => {
  if (deptId) {
    const cleanId = deptId.trim().toLowerCase();
    if (cleanId === 'dept-security' || cleanId.includes('security') || cleanId.includes('sec')) return 'cat-security';
    if (cleanId === 'dept-maintenance' || cleanId.includes('maintenance') || cleanId.includes('maint')) return 'cat-maintenance';
    if (cleanId === 'dept-ambulance' || cleanId.includes('ambulance') || cleanId.includes('amb')) return 'cat-ambulance';
    if (cleanId === 'dept-radiology' || cleanId.includes('radiology') || cleanId.includes('radio')) return 'cat-radiology';
  }
  const name = (deptName || '').trim().toLowerCase();
  if (name.includes('أمن') || name.includes('امن') || name.includes('حراس') || name.includes('سلامة')) return 'cat-security';
  if (name.includes('أشعة') || name.includes('اشعة') || name.includes('تصوير') || name.includes('مفراس') || name.includes('رنين')) return 'cat-radiology';
  if (name.includes('سونار')) return 'cat-sonar';
  if (name.includes('إسعاف') || name.includes('اسعاف') || name.includes('طوارئ')) return 'cat-ambulance';
  if (name.includes('صيانة') || name.includes('فنية')) return 'cat-maintenance';
  if (name.includes('إحصاء') || name.includes('احصاء')) return 'cat-statistics';
  if (name.includes('مخزن') || name.includes('مذخر')) return 'cat-warehouse';
  if (name.includes('شبكات') || name.includes('اتصالات') || name.includes('تكنولوجيا')) return 'cat-networks';
  if (name.includes('تمريض') || name.includes('خدمات سريرية')) return 'cat-nursing';
  if (name.includes('عمليات') || name.includes('جراحة')) return 'cat-surgery';
  if (name.includes('مقيمين') || name.includes('أطباء') || name.includes('اطباء')) return 'cat-doctors';
  if (name.includes('مختبر') || name.includes('باثولوجي')) return 'cat-lab';
  if (name.includes('صيدلية') || name.includes('علاج')) return 'cat-pharmacy';
  if (name.includes('إدارة') || name.includes('حسابات') || name.includes('مالية')) return 'cat-admin';
  return deptId || name || 'cat-other';
};

const getPayrollAllowancesSum = (p: CalculatedPayroll): number => {
  if (!p) return 0;
  return (
    (p.allowanceDangerVal || 0) +
    (p.allowanceMarriageVal || 0) +
    (p.allowanceChildrenVal || 0) +
    (p.allowanceDegreeVal || 0) +
    (p.allowanceExtraDaysVal || 0) +
    (p.allowanceExtraHoursVal || 0) +
    (p.allowanceGeneralVal || 0) +
    (p.allowanceEsnadVal || 0) +
    (p.allowanceCustom1Val || 0) +
    (p.allowanceCustom2Val || 0) +
    (p.allowanceCustom3Val || 0) +
    (p.allowanceCustom4Val || 0) +
    (p.allowanceCustom5Val || 0) +
    (p.previousMonthAddVal || 0)
  );
};

const getPayrollDeductionsSum = (p: CalculatedPayroll): number => {
  if (!p) return 0;
  return (
    (p.deductionDaysVal || 0) +
    (p.deductionHoursVal || 0) +
    (p.deductionPenaltiesVal || 0) +
    (p.deductionOtherVal || 0) +
    (p.deductionPenaltyCustom1Val || 0) +
    (p.deductionPenaltyCustom2Val || 0) +
    (p.deductionPenaltyCustom3Val || 0) +
    (p.deductionPenaltyCustom4Val || 0) +
    (p.deductionPenaltyCustom5Val || 0) +
    (p.previousMonthSubVal || 0)
  );
};

interface SalaryArchiveViewerProps {
  archive: ArchivedMonth[];
  departments?: Department[];
  employees?: Employee[];
  currentPayrolls?: CalculatedPayroll[];
  customFieldLabels?: Record<string, string>;
  language?: 'ar' | 'en';
  timeSettings?: any;
  onDeleteArchiveMonth?: (monthId: string) => void;
}

export default function SalaryArchiveViewer({
  archive,
  departments = [],
  employees = [],
  currentPayrolls = [],
  customFieldLabels = {},
  language = 'ar',
  timeSettings,
  onDeleteArchiveMonth,
}: SalaryArchiveViewerProps) {
  const localProfileStr = typeof window !== 'undefined' ? localStorage.getItem('alfarrah_hospital_profile') : null;
  const hospitalProfile = localProfileStr ? JSON.parse(localProfileStr) : { nameAr: 'مستشفى الفرح الأهلي', nameEn: 'Al-Farrah Private Hospital', logo: 'HeartPulse' };

  const [selectedMonthId, setSelectedMonthId] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  
  // Advanced filters state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [salaryFilterType, setSalaryFilterType] = useState<'net' | 'basic'>('net');
  const [minSalary, setMinSalary] = useState<string>('');
  const [maxSalary, setMaxSalary] = useState<string>('');
  const [deductionsFilter, setDeductionsFilter] = useState<'all' | 'has-any' | 'no-deductions' | 'has-absence' | 'has-delay' | 'has-penalty'>('all');
  const [archiveSortOrder, setArchiveSortOrder] = useState<'netDesc' | 'netAsc' | 'basicDesc' | 'default'>('netDesc');
  
  // Selected employee detail modal
  const [activePayrollDetail, setActivePayrollDetail] = useState<CalculatedPayroll | null>(null);

  // Print Mode states for full monthly report vs individual employee detailed payslip
  const [printMode, setPrintMode] = useState<'full' | 'individual'>('full');
  const [printingEmployeeDetail, setPrintingEmployeeDetail] = useState<CalculatedPayroll | null>(null);

  const getFieldLabel = (fId: FieldId) => {
    return customFieldLabels[fId] || FIELDS_METADATA.find((m) => m.id === fId)?.label || fId;
  };

  // Computed current live payrolls
  const livePayrolls = useMemo(() => {
    if (!employees || employees.length === 0) return currentPayrolls || [];
    const calculatedMap = new Map<string, CalculatedPayroll>();
    (currentPayrolls || []).forEach((p) => {
      if (p && p.employeeId) {
        calculatedMap.set(p.employeeId, p);
      }
    });
    return employees.map((emp) => {
      if (calculatedMap.has(emp.id)) {
        return calculatedMap.get(emp.id)!;
      }
      const dept = (departments || []).find((d) => d.id === emp.departmentId);
      return calculateEmployeePayroll(emp, dept);
    });
  }, [employees, currentPayrolls, departments]);

  // Computed all available months list (saved archived snapshots + live current month)
  const allMonths = useMemo(() => {
    const list: ArchivedMonth[] = [...(archive || [])];
    
    // Generate Current Live Month snapshot
    const now = new Date();
    // Smart payroll cycle rule: If early in month (day <= 10), payroll processing belongs to previous month (e.g. July when in early August)
    const usePrev = now.getDate() <= 10;
    const targetMonthIdx = usePrev ? (now.getMonth() === 0 ? 11 : now.getMonth() - 1) : now.getMonth();
    const targetYear = usePrev && now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    const monthNum = String(targetMonthIdx + 1).padStart(2, '0');
    const currentMonthId = `${targetYear}-${monthNum}`;
    
    const monthNamesAr = [
      'كانون الثاني / يناير', 'شباط / فبراير', 'آذار / مارس', 'نيسان / أبريل',
      'أيار / مايو', 'حزيران / يونيو', 'تموز / يوليو', 'آب / أغسطس',
      'أيلول / سبتمبر', 'تشرين الأول / أكتوبر', 'تشرين الثاني / نوفمبر', 'كانون الأول / ديسمبر'
    ];
    const currentMonthLabel = `${monthNamesAr[targetMonthIdx]} ${targetYear} (الشهر الحالي)`;

    const totalNet = livePayrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0);
    const totalEarn = livePayrolls.reduce((sum, p) => sum + getPayrollAllowancesSum(p), 0);
    const totalDed = livePayrolls.reduce((sum, p) => sum + getPayrollDeductionsSum(p), 0);

    const liveCurrentSnapshot: ArchivedMonth = {
      monthId: currentMonthId,
      monthLabel: currentMonthLabel,
      employeesSnapshot: employees || [],
      departmentsSnapshot: departments || [],
      payrollsSnapshot: livePayrolls,
      totalNetPaid: totalNet,
      totalEarningsSum: totalEarn,
      totalDeductionsSum: totalDed,
      timestamp: new Date().toISOString()
    };

    // If current month is not already in list, put it first
    if (!list.some(m => m.monthId === currentMonthId)) {
      list.unshift(liveCurrentSnapshot);
    }

    return list;
  }, [archive, departments, employees, livePayrolls]);

  // Default to first month in allMonths if none selected yet, and ensure all system departments and employees are included
  const activeMonth = useMemo(() => {
    if (!allMonths || allMonths.length === 0) return null;
    const selected = allMonths.find((a) => a.monthId === selectedMonthId);
    const target = selected || allMonths[0];
    if (!target) return null;

    // Build complete departments snapshot ensuring all system departments exist
    const deptsSnap = [...(target.departmentsSnapshot || [])];
    (departments || []).forEach((d) => {
      if (!deptsSnap.some((existing) => existing.id === d.id || existing.name?.trim() === d.name?.trim())) {
        deptsSnap.push(d);
      }
    });

    // Build complete employees snapshot ensuring all system employees exist
    const empsSnap = [...(target.employeesSnapshot || [])];
    (employees || []).forEach((e) => {
      if (!empsSnap.some((existing) => existing.id === e.id)) {
        empsSnap.push(e);
      }
    });

    // Ensure all employees have valid non-zero payroll records in payrollsSnapshot
    const rawPayrollsSnap = target.payrollsSnapshot || [];
    const payrollsSnap: CalculatedPayroll[] = [];
    const processedEmpIds = new Set<string>();

    rawPayrollsSnap.forEach((p) => {
      if (!p) return;
      let finalP = p;
      // If archived payroll record evaluates to 0, recalculate with current employee & dept configuration
      if (finalP.netSalary === 0 && finalP.totalEarnings === 0) {
        const emp = empsSnap.find((e) => e.id === finalP.employeeId || e.name === finalP.employeeName) ||
                    (employees || []).find((e) => e.id === finalP.employeeId || e.name === finalP.employeeName);
        if (emp) {
          const dept = deptsSnap.find((d) => d.id === emp.departmentId) ||
                       (departments || []).find((d) => d.id === emp.departmentId);
          const recalc = calculateEmployeePayroll(emp, dept);
          if (recalc.netSalary > 0 || recalc.totalEarnings > 0) {
            finalP = recalc;
          }
        }
      }
      payrollsSnap.push(finalP);
      if (finalP.employeeId) processedEmpIds.add(finalP.employeeId);
    });

    (employees || []).forEach((emp) => {
      if (!processedEmpIds.has(emp.id)) {
        const dept = (departments || []).find((d) => d.id === emp.departmentId) ||
                     deptsSnap.find((d) => d.id === emp.departmentId);
        const calculated = calculateEmployeePayroll(emp, dept);
        payrollsSnap.push(calculated);
        processedEmpIds.add(emp.id);
      }
    });

    let totalNet = payrollsSnap.reduce((sum, p) => sum + (p.netSalary || 0), 0);
    let totalEarn = payrollsSnap.reduce((sum, p) => sum + getPayrollAllowancesSum(p), 0);
    let totalDed = payrollsSnap.reduce((sum, p) => sum + getPayrollDeductionsSum(p), 0);

    // Calculate fixed lump sum departments that are not represented in payrollsSnap
    const fixedKeys = [
      { catKey: 'cat-security', id: 'dept-security', defaultLump: 0 },
      { catKey: 'cat-radiology', id: 'dept-radiology', defaultLump: 2300000 },
      { catKey: 'cat-ambulance', id: 'dept-ambulance', defaultLump: 0 },
      { catKey: 'cat-maintenance', id: 'dept-maintenance', defaultLump: 0 },
    ];

    fixedKeys.forEach(({ catKey, defaultLump }) => {
      const sumInSnap = payrollsSnap.reduce((s, p) => {
        const emp = empsSnap.find((e) => e.id === p.employeeId || e.name === p.employeeName);
        const k = getDeptCategoryKey(emp?.departmentId, p.departmentName);
        return k === catKey ? s + (p.netSalary || 0) : s;
      }, 0);

      if (sumInSnap === 0) {
        const isMatch = (d: Department) => getDeptCategoryKey(d.id, d.name) === catKey;
        const deptObj = deptsSnap.find(isMatch) || (departments || []).find(isMatch);
        let lumpVal = 0;
        if (deptObj) {
          lumpVal = deptObj.lumpSumSalary || deptObj.fixedSalary || deptObj.budgetLimit || deptObj.pricing?.basicSalary || deptObj.defaultBasicSalary || 0;
        }
        if (lumpVal === 0) lumpVal = defaultLump;

        totalNet += lumpVal;
      }
    });

    return {
      ...target,
      departmentsSnapshot: deptsSnap,
      employeesSnapshot: empsSnap,
      payrollsSnapshot: payrollsSnap,
      totalNetPaid: totalNet,
      totalEarningsSum: totalEarn,
      totalDeductionsSum: totalDed,
    };
  }, [allMonths, selectedMonthId, departments, employees]);

  // Resolve raw snapshot inputs/columns of the printing employee
  const employeeRawSnapshot = useMemo(() => {
    if (!activeMonth || !printingEmployeeDetail) return null;
    return activeMonth.employeesSnapshot?.find((e) => e.id === printingEmployeeDetail.employeeId) || null;
  }, [activeMonth, printingEmployeeDetail]);

  // Resolve raw snapshot inputs of the active details employee
  const activeEmployeeSnapshot = useMemo(() => {
    if (!activeMonth || !activePayrollDetail) return null;
    return activeMonth.employeesSnapshot?.find((e) => e.id === activePayrollDetail.employeeId) || null;
  }, [activeMonth, activePayrollDetail]);

  // Memoized additions only calculations
  const activeBaseWorkPay = useMemo(() => {
    if (!activePayrollDetail) return 0;
    return (activePayrollDetail.basicDaysPay || 0) + (activePayrollDetail.basicHoursPay || 0);
  }, [activePayrollDetail]);

  const activeAdditionsOnlyVal = useMemo(() => {
    if (!activePayrollDetail) return 0;
    return (activePayrollDetail.totalEarnings || 0) - activeBaseWorkPay;
  }, [activePayrollDetail, activeBaseWorkPay]);

  const printingBaseWorkPay = useMemo(() => {
    if (!printingEmployeeDetail) return 0;
    return (printingEmployeeDetail.basicDaysPay || 0) + (printingEmployeeDetail.basicHoursPay || 0);
  }, [printingEmployeeDetail]);

  const printingAdditionsOnlyVal = useMemo(() => {
    if (!printingEmployeeDetail) return 0;
    return (printingEmployeeDetail.totalEarnings || 0) - printingBaseWorkPay;
  }, [printingEmployeeDetail, printingBaseWorkPay]);

  // Sync state with selected activeMonth id and register print teardown safety listeners
  React.useEffect(() => {
    if (activeMonth && !selectedMonthId) {
      setSelectedMonthId(activeMonth.monthId);
    }
  }, [activeMonth, selectedMonthId]);

  // Handler to export current snapshot data to Excel CSV format with UTF-8 BOM
  const handleExportToExcel = () => {
    if (!activeMonth) return;

    const dataToExport = filteredPayrolls;
    if (dataToExport.length === 0) return;

    // Accountant friendly detailed columns
    const headers = [
      'اسم المنتسب',
      'القسم',
      'المنصب',
      'الجنس',
      'أيام الدوام المسجلة',
      'الراتب الأساسي (د.ع)',
      'أجر أيام الحضور الفعلية (د.ع)',
      'أجر الساعات الاعتيادية (د.ع)',
      'الشفت الصباحي (د.ع)',
      'الشفت المسائي (د.ع)',
      'الشفت الوسطي (د.ع)',
      'شفت 24 ساعة (د.ع)',
      'شفت 12 ساعة (د.ع)',
      'شفت الخفارة (د.ع)',
      'أجور الاستدعاء (د.ع)',
      'مخصص الخطورة (د.ع)',
      'مخصص الزوجية الاجتماعية (د.ع)',
      'مخصص الأطفال (د.ع)',
      'خطورة الشهادة الأكاديمية (د.ع)',
      'أيام إضافية خارج الدوام (د.ع)',
      'ساعات عمل إضافية (د.ع)',
      'إضافات تشجيعية عامة (د.ع)',
      'مضافات وتراكمات شهر سابق (د.ع)',
      'إجمالي الاستحقاقات الإضافية (د.ع)',
      'خصم أيام الغياب (د.ع)',
      'خصم ساعات الغياب/التأخر (د.ع)',
      'العقوبات والغرامات المخصومة (د.ع)',
      'استقطاعات عينية أخرى (د.ع)',
      'ديون مسترجعة للشهر السابق (د.ع)',
      'إجمالي المستقطعات والخصم (د.ع)',
      'صافي الراتب المستحق للصرف النهائي (د.ع)'
    ];

    const rows = dataToExport.map((p) => [
      p.employeeName,
      p.departmentName,
      p.position,
      p.gender === 'male' ? 'ذكر' : 'أنثى',
      p.workingDays !== undefined ? p.workingDays : 0,
      Math.round(p.basicSalary),
      Math.round(p.basicDaysPay),
      Math.round(p.basicHoursPay),
      Math.round(p.shiftsMorningPay || 0),
      Math.round(p.shiftsEveningPay || 0),
      Math.round(p.shiftsMiddlePay || 0),
      Math.round(p.shiftsFull24Pay || 0),
      Math.round(p.shiftsHalf12Pay || 0),
      Math.round(p.shiftsKhafarPay || 0),
      Math.round(p.calloutsPay || 0),
      Math.round(p.allowanceDangerVal || 0),
      Math.round(p.allowanceMarriageVal || 0),
      Math.round(p.allowanceChildrenVal || 0),
      Math.round(p.allowanceDegreeVal || 0),
      Math.round(p.allowanceExtraDaysVal || 0),
      Math.round(p.allowanceExtraHoursVal || 0),
      Math.round(p.allowanceGeneralVal || 0),
      Math.round(p.allowanceEsnadVal || 0),
      Math.round(p.previousMonthAddVal || 0),
      Math.round(p.totalEarnings),
      Math.round(p.deductionDaysVal || 0),
      Math.round(p.deductionHoursVal || 0),
      Math.round(p.deductionPenaltiesVal || 0),
      Math.round(p.deductionOtherVal || 0),
      Math.round(p.previousMonthSubVal || 0),
      Math.round(p.totalDeductions),
      Math.round(p.netSalary)
    ]);

    // Format fields with quotes to handle commas correctly in names or titles
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Excel needs the UTF-8 BOM (Byte Order Mark) to recognize Arabic encoding perfectly
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    
    const deptLabel = selectedDeptId === 'all' ? 'كافة_الأقسام' : `قسم_${deptsPayrollSummary.find(d => d.id === selectedDeptId)?.name || selectedDeptId}`;
    link.setAttribute('download', `كشف_رواتب_مؤرشف_${activeMonth.monthLabel || activeMonth.monthId}_${deptLabel}.csv`);
    
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to dynamically convert Tailwind CSS v4 OKLCH colors to standard Parseable RGB colors
  // to prevent html2canvas / html2pdf "Attempting to parse an unsupported color function" errors
  const replaceOklchInString = (str: string): string => {
    if (typeof str !== 'string' || !str.includes('oklch')) {
      return str;
    }
    
    return str.replace(/oklch\(([^)]+)\)/g, (fullMatch, content) => {
      const parts = content.trim().split(/[\s,+/]+/);
      if (parts.length < 3) return fullMatch;

      let L = parseFloat(parts[0]);
      if (isNaN(L)) return fullMatch;
      if (parts[0].includes('%')) L = L / 100;
      
      let C = parseFloat(parts[1]);
      if (isNaN(C)) return fullMatch;

      let H = parseFloat(parts[2]);
      if (isNaN(H)) return fullMatch;
      
      let A = 1;
      if (parts.length >= 4) {
        A = parseFloat(parts[3]);
        if (isNaN(A)) A = 1;
        if (parts[3].includes('%')) A = A / 100;
      }

      // OKLCH to sRGB conversion math
      const hRad = (H * Math.PI) / 180;
      const lab_a = C * Math.cos(hRad);
      const lab_b = C * Math.sin(hRad);

      const l_ = L + 0.3963377774 * lab_a + 0.2158037573 * lab_b;
      const m_ = L - 0.1055613458 * lab_a - 0.0638541728 * lab_b;
      const s_ = L - 0.0894841775 * lab_a - 1.2914855480 * lab_b;

      const l = Math.max(0, l_ * l_ * l_);
      const m = Math.max(0, m_ * m_ * m_);
      const s = Math.max(0, s_ * s_ * s_);

      // LMS to Linear RGB
      const rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
      const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
      const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147014 * s;

      // Linear sRGB to sRGB
      const toSRGB = (c: number) => {
        c = Math.max(0, Math.min(1, c));
        return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
      };

      const r = Math.round(toSRGB(rLin) * 255);
      const g = Math.round(toSRGB(gLin) * 255);
      const b = Math.round(toSRGB(bLin) * 255);

      return A === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${A})`;
    });
  };

  interface StyleRestoreItem {
    element: HTMLElement;
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderTopColor?: string;
    borderBottomColor?: string;
    borderLeftColor?: string;
    borderRightColor?: string;
  }

  const convertSubtreeColors = (root: HTMLElement): StyleRestoreItem[] => {
    const itemsToRestore: StyleRestoreItem[] = [];

    const recurse = (node: HTMLElement) => {
      if (!node || node.nodeType !== Node.ELEMENT_NODE) return;

      const computed = window.getComputedStyle(node);
      const restoreItem: StyleRestoreItem = { element: node };
      let changed = false;

      const props = [
        { name: 'color', styleKey: 'color' },
        { name: 'backgroundColor', styleKey: 'backgroundColor' },
        { name: 'borderColor', styleKey: 'borderColor' },
        { name: 'borderTopColor', styleKey: 'borderTopColor' },
        { name: 'borderBottomColor', styleKey: 'borderBottomColor' },
        { name: 'borderLeftColor', styleKey: 'borderLeftColor' },
        { name: 'borderRightColor', styleKey: 'borderRightColor' }
      ];

      props.forEach((p) => {
        const val = computed[p.name as any];
        if (typeof val === 'string' && val.includes('oklch')) {
          (restoreItem as any)[p.styleKey] = node.style[p.styleKey as any];
          const converted = replaceOklchInString(val);
          node.style[p.styleKey as any] = converted;
          changed = true;
        }
      });

      if (changed) {
        itemsToRestore.push(restoreItem);
      }

      Array.from(node.children).forEach((child) => {
        recurse(child as HTMLElement);
      });
    };

    recurse(root);
    return itemsToRestore;
  };

  const restoreSubtreeColors = (items: StyleRestoreItem[]) => {
    items.forEach((item) => {
      if (item.color !== undefined) item.element.style.color = item.color;
      if (item.backgroundColor !== undefined) item.element.style.backgroundColor = item.backgroundColor;
      if (item.borderColor !== undefined) item.element.style.borderColor = item.borderColor;
      if (item.borderTopColor !== undefined) item.element.style.borderTopColor = item.borderTopColor;
      if (item.borderBottomColor !== undefined) item.element.style.borderBottomColor = item.borderBottomColor;
      if (item.borderLeftColor !== undefined) item.element.style.borderLeftColor = item.borderLeftColor;
      if (item.borderRightColor !== undefined) item.element.style.borderRightColor = item.borderRightColor;
    });
  };

  // Handler to export the current filtered month report to a PDF document with Save As interaction
  const handlePrintPDF = async () => {
    if (!activeMonth) return;

    const element = document.getElementById('printable-archive-report');
    if (!element) {
      showToast('خطأ: لم يتم العثور على تقرير الطباعة للتحويل.', 'error');
      return;
    }

    const deptLabel = selectedDeptId === 'all' ? 'كافة_الأقسام' : `قسم_${deptsPayrollSummary.find(d => d.id === selectedDeptId)?.name || selectedDeptId}`;
    const filename = `تقرير_الرواتب_المؤرشف_${activeMonth.monthLabel || activeMonth.monthId}_${deptLabel}.pdf`;

    // Attempt to request Save File Picker IMMEDIATELY within the click handler to satisfy browser transient user activation constraint
    const isSaveFilePickerSupported = typeof window !== 'undefined' && 'showSaveFilePicker' in window;
    let fileHandle: any = null;
    let useSaveFilePicker = false;

    if (isSaveFilePickerSupported) {
      try {
        fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'مستند كشف الرواتب المالي PDF',
            accept: { 'application/pdf': ['.pdf'] }
          }]
        });
        useSaveFilePicker = true;
      } catch (err: any) {
        // If user cancelled, stop immediately and revert cleanly without rendering anything
        if (err.name === 'AbortError') {
          showToast('تم إلغاء عملية التصدير وحفظ الملف.', 'info');
          return;
        }
        // In case of iframe sandbox restrictions/SecurityError, print warning and proceed with fallback standard download
        console.warn('showSaveFilePicker was blocked/failed in sandbox, falling back to standard download:', err);
      }
    }

    setIsGeneratingPdf(true);

    const opt: any = {
      margin: [10, 10, 10, 10],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        backgroundColor: '#ffffff',
        logging: false
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    // Apply the custom pdf style class immediately to format layout correctly
    element.classList.add('pdf-render-mode');
    const restoredItems = convertSubtreeColors(element);

    setTimeout(() => {
      if (useSaveFilePicker && fileHandle) {
        html2pdf()
          .from(element)
          .set(opt)
          .output('blob')
          .then(async (blob: Blob) => {
            try {
              const writable = await fileHandle.createWritable();
              await writable.write(blob);
              await writable.close();
              showToast('تم حفظ ملف الـ PDF بنجاح في المكان المحدد!', 'success');
            } catch (err: any) {
              console.error('File write error:', err);
              showToast('فشل حفظ الملف للمسار المحدد. سيتم تحميله تلقائياً الآن.', 'info');
              // Fallback to traditional download
              html2pdf().from(element).set(opt).save();
            }
          })
          .catch((err: any) => {
            console.error('PDF Generation Error:', err);
            showToast('حدث خطأ أثناء تصدير ملف الـ PDF.', 'error');
          })
          .finally(() => {
            restoreSubtreeColors(restoredItems);
            element.classList.remove('pdf-render-mode');
            setIsGeneratingPdf(false);
          });
      } else {
        html2pdf()
          .from(element)
          .set(opt)
          .save()
          .then(() => {
            showToast('تم تصدير وحفظ التقرير كـ PDF بنجاح.', 'success');
          })
          .catch((err: any) => {
            console.error('PDF Generation Error:', err);
            showToast('حدث خطأ أثناء تصدير ملف الـ PDF.', 'error');
          })
          .finally(() => {
            restoreSubtreeColors(restoredItems);
            element.classList.remove('pdf-render-mode');
            setIsGeneratingPdf(false);
          });
      }
    }, 150);
  };

  // Handler for direct physical printing targeting default printer setup
  const handleDirectPrint = () => {
    setPrintMode('full');
    setPrintingEmployeeDetail(null);
    if (typeof window !== 'undefined' && window.self !== window.top) {
      showToast(
        language === 'ar'
          ? '⚠️ لتشغيل الطباعة بنجاح، يرجى أولاً فتح التطبيق في نافذة مستقلة عبر زر (فتح في نافذة جديدة) أعلى يمين الشاشة لتجاوز حماية المتصفح.'
          : '⚠️ To print successfully, please first open the app in a new independent tab using the (Open in New Tab) button at the top-right of your screen.',
        'info'
      );
    }
    const prevTitle = document.title;
    setTimeout(() => {
      try {
        document.title = " ";
        window.focus();
        window.print();
      } catch (e) {
        console.error('Print blocked or failed:', e);
        showToast(
          language === 'ar'
            ? 'فشلت الطباعة المباشرة بسبب قيود الحماية. يرجى فتح التطبيق في علامة تبويب جديدة أولاً.'
            : 'Direct printing failed due to security/sandbox constraints. Please open the app in a new tab first.',
          'error'
        );
      } finally {
        setTimeout(() => {
          document.title = prevTitle;
        }, 350);
      }
    }, 150);
  };

  // Group payroll calculations per department smartly with normalized deduplication
  const deptsPayrollSummary = useMemo(() => {
    if (!activeMonth) return [];

    const catMap: {
      [catKey: string]: {
        id: string;
        name: string;
        catKey: string;
        deptIds: Set<string>;
        employeesSnapshotCount: number;
        totalEarningsSum: number;
        totalDeductionsSum: number;
        totalNetSalarySum: number;
      };
    } = {};

    const registerDept = (dId: string, dName: string) => {
      const catKey = getDeptCategoryKey(dId, dName);
      if (!catMap[catKey]) {
        catMap[catKey] = {
          id: catKey,
          name: dName,
          catKey,
          deptIds: new Set([dId]),
          employeesSnapshotCount: 0,
          totalEarningsSum: 0,
          totalDeductionsSum: 0,
          totalNetSalarySum: 0,
        };
      } else {
        catMap[catKey].deptIds.add(dId);
        // Prefer longer descriptive name if current name is brief
        if (dName.length > catMap[catKey].name.length) {
          catMap[catKey].name = dName;
        }
      }
    };

    // 1. Populate system & snapshot departments
    const archivedDepts = activeMonth.departmentsSnapshot || [];
    archivedDepts.forEach((d) => registerDept(d.id, d.name));

    if (departments && departments.length > 0) {
      departments.forEach((d) => registerDept(d.id, d.name));
    }

    const employeesSnap = activeMonth.employeesSnapshot || [];
    employeesSnap.forEach((emp) => {
      if (emp.departmentId) {
        const foundLive = departments?.find((d) => d.id === emp.departmentId);
        const foundArch = archivedDepts.find((d) => d.id === emp.departmentId);
        const deptName = foundLive?.name || foundArch?.name || (emp as any).departmentName || 'قسم آخر';
        registerDept(emp.departmentId, deptName);
      }
    });

    // 2. Aggregate payrolls into categorized department buckets
    const payrolls = activeMonth.payrollsSnapshot || [];
    payrolls.forEach((payroll) => {
      const empSnap = employeesSnap.find(
        (e) => e.id === payroll.employeeId || e.name === payroll.employeeName
      );

      const empDeptId = empSnap?.departmentId;
      const catKey = getDeptCategoryKey(empDeptId, payroll.departmentName);

      if (!catMap[catKey]) {
        catMap[catKey] = {
          id: catKey,
          name: payroll.departmentName || 'أخرى / غير مصنف',
          catKey,
          deptIds: new Set(empDeptId ? [empDeptId] : []),
          employeesSnapshotCount: 0,
          totalEarningsSum: 0,
          totalDeductionsSum: 0,
          totalNetSalarySum: 0,
        };
      }

      catMap[catKey].employeesSnapshotCount += 1;
      catMap[catKey].totalEarningsSum += getPayrollAllowancesSum(payroll);
      catMap[catKey].totalDeductionsSum += getPayrollDeductionsSum(payroll);
      catMap[catKey].totalNetSalarySum += payroll.netSalary || 0;
    });

    // 3. Ensure the 4 primary fixed salary departments always exist in catMap for quick access
    const fixedDefaults = [
      { catKey: 'cat-security', name: 'قسم الامنية', id: 'dept-security' },
      { catKey: 'cat-radiology', name: 'قسم الاشعة والمفراس', id: 'dept-radiology' },
      { catKey: 'cat-ambulance', name: 'قسم الاسعاف', id: 'dept-ambulance' },
      { catKey: 'cat-maintenance', name: 'قسم الصيانة', id: 'dept-maintenance' },
    ];
    fixedDefaults.forEach(fd => {
      if (!catMap[fd.catKey]) {
        catMap[fd.catKey] = {
          id: fd.catKey,
          name: fd.name,
          catKey: fd.catKey,
          deptIds: new Set([fd.id]),
          employeesSnapshotCount: 0,
          totalEarningsSum: 0,
          totalDeductionsSum: 0,
          totalNetSalarySum: 0,
        };
      }
      if (catMap[fd.catKey].totalNetSalarySum === 0) {
        const isMatch = (d: Department) => getDeptCategoryKey(d.id, d.name) === fd.catKey;
        const deptObj = archivedDepts.find(isMatch) || (departments || []).find(isMatch);
        let lumpVal = 0;
        if (deptObj) {
          lumpVal = deptObj.lumpSumSalary || deptObj.fixedSalary || deptObj.budgetLimit || deptObj.pricing?.basicSalary || deptObj.defaultBasicSalary || 0;
        }
        if (lumpVal === 0 && fd.catKey === 'cat-radiology') lumpVal = 2300000;

        catMap[fd.catKey].totalEarningsSum = lumpVal;
        catMap[fd.catKey].totalDeductionsSum = 0;
        catMap[fd.catKey].totalNetSalarySum = lumpVal;
      }
    });

    return Object.values(catMap);
  }, [activeMonth, departments]);

  const getNormalizedDeptTitle = (deptId?: string, deptName?: string): string => {
    const catKey = getDeptCategoryKey(deptId, deptName);
    if (catKey === 'cat-security') return 'قسم الامنية';
    if (catKey === 'cat-radiology') return 'قسم الاشعة والمفراس';
    if (catKey === 'cat-ambulance') return 'قسم الاسعاف';
    if (catKey === 'cat-maintenance') return 'قسم الصيانة';
    if (catKey === 'cat-nursing') return 'قسم التمريض والخدمات السريرية';
    if (catKey === 'cat-surgery') return 'قسم العمليات والجراحة';
    if (catKey === 'cat-doctors') return 'قسم الأطباء والمقيمين';
    if (catKey === 'cat-lab') return 'قسم المختبر والباثولوجي';
    if (catKey === 'cat-pharmacy') return 'قسم الصيدلية والدواء';
    if (catKey === 'cat-admin') return 'قسم الإدارة المالية والحسابات';
    if (catKey === 'cat-statistics') return 'قسم الإحصاء والتسجيل';
    if (catKey === 'cat-warehouse') return 'قسم المخزن والمذخر';
    if (catKey === 'cat-networks') return 'قسم الشبكات والاتصالات';
    return deptName || 'قسم آخر';
  };

  // Summary for the 4 fixed salary departments
  const fixedDeptSummaries = useMemo(() => {
    const fixedKeys = [
      { catKey: 'cat-security', name: 'قسم الامنية' },
      { catKey: 'cat-radiology', name: 'قسم الاشعة والمفراس' },
      { catKey: 'cat-ambulance', name: 'قسم الاسعاف' },
      { catKey: 'cat-maintenance', name: 'قسم الصيانة' },
    ];

    const archivedDepts = activeMonth?.departmentsSnapshot || [];
    const liveDepts = departments || [];

    const getDeptLumpSum = (catKey: string): number => {
      // 1. Check if employees/payrolls in this department generated earnings
      const foundInSummary = (deptsPayrollSummary as any[]).find((d) => d.catKey === catKey);
      if (foundInSummary && foundInSummary.totalEarningsSum > 0) {
        return foundInSummary.totalEarningsSum;
      }

      // 2. Look up department object in activeMonth.departmentsSnapshot or live departments
      const isMatch = (d: Department) => {
        const key = getDeptCategoryKey(d.id, d.name);
        return key === catKey;
      };

      const deptObj = archivedDepts.find(isMatch) || liveDepts.find(isMatch);
      if (deptObj) {
        const lumpVal = deptObj.lumpSumSalary || deptObj.fixedSalary || deptObj.budgetLimit || deptObj.pricing?.basicSalary || deptObj.defaultBasicSalary || 0;
        if (lumpVal > 0) return lumpVal;
      }

      if (catKey === 'cat-radiology') return 2300000;

      return 0;
    };

    return fixedKeys.map(({ catKey, name }) => {
      const found = (deptsPayrollSummary as any[]).find((d) => d.catKey === catKey);
      const employeesSnapshotCount = found ? (found.employeesSnapshotCount || 0) : 0;
      let totalEarningsSum = found ? (found.totalEarningsSum || 0) : 0;
      let totalDeductionsSum = found ? (found.totalDeductionsSum || 0) : 0;
      let totalNetSalarySum = found ? (found.totalNetSalarySum || 0) : 0;

      // If net salary is 0 (because no individual employees are listed in payroll snapshot), fetch lump sum from department config/summary
      if (totalNetSalarySum === 0) {
        const lumpVal = getDeptLumpSum(catKey);
        totalEarningsSum = lumpVal;
        totalDeductionsSum = 0;
        totalNetSalarySum = lumpVal;
      }

      return {
        catKey,
        name,
        employeesSnapshotCount,
        totalEarningsSum,
        totalDeductionsSum,
        totalNetSalarySum,
      };
    });
  }, [deptsPayrollSummary, activeMonth, departments]);

  // Compute total fixed salary departments count & net sum
  const fixedSalaryStats = useMemo(() => {
    let count = 0;
    let netSum = 0;
    fixedDeptSummaries.forEach(d => {
      count += d.employeesSnapshotCount || 0;
      netSum += d.totalNetSalarySum || 0;
    });
    return { count, netSum };
  }, [fixedDeptSummaries]);

  // Filter payroll records based on selection, search and advanced filters
  const filteredPayrolls = useMemo(() => {
    if (!activeMonth) return [];
    
    let list = activeMonth.payrollsSnapshot || [];

    // Filter by department
    if (selectedDeptId === 'fixed_departments') {
      const fixedCatKeys = new Set(['cat-security', 'cat-radiology', 'cat-ambulance', 'cat-maintenance']);
      const fixedDeptObjs = (deptsPayrollSummary as any[]).filter((d) => fixedCatKeys.has(d.catKey));
      const allFixedDeptIds = new Set<string>();
      fixedDeptObjs.forEach((d) => {
        d.deptIds?.forEach((id: string) => allFixedDeptIds.add(id));
      });

      list = list.filter((p) => {
        const empSnap = activeMonth.employeesSnapshot?.find(
          (e) => e.id === p.employeeId || e.name === p.employeeName
        );
        if (empSnap && allFixedDeptIds.has(empSnap.departmentId)) return true;
        const pName = (p.departmentName || '').trim().toLowerCase();
        return (
          pName.includes('أمن') || pName.includes('امن') || pName.includes('حراس') ||
          pName.includes('أشعة') || pName.includes('اشعة') || pName.includes('مفراس') || pName.includes('سونار') || pName.includes('تصوير') ||
          pName.includes('إسعاف') || pName.includes('اسعاف') || pName.includes('طوارئ') ||
          pName.includes('صيانة') || pName.includes('فنية')
        );
      });
    } else if (selectedDeptId !== 'all') {
      const selectedDeptObj = (deptsPayrollSummary as any[]).find((d) => d.id === selectedDeptId || d.catKey === selectedDeptId || d.deptIds?.has(selectedDeptId));
      if (selectedDeptObj) {
        list = list.filter((p) => {
          const empSnap = activeMonth.employeesSnapshot?.find(
            (e) => e.id === p.employeeId || e.name === p.employeeName
          );
          if (empSnap && selectedDeptObj.deptIds?.has(empSnap.departmentId)) return true;
          if (p.departmentName && selectedDeptObj.name) {
            const pName = p.departmentName.trim().toLowerCase();
            const sName = selectedDeptObj.name.trim().toLowerCase();
            if (pName === sName || pName.includes(sName) || sName.includes(pName)) return true;
          }
          return false;
        });
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.employeeName.toLowerCase().includes(q) ||
          p.position.toLowerCase().includes(q)
      );
    }

    // Filter by salary range
    if (minSalary.trim()) {
      const minVal = parseFloat(minSalary);
      if (!isNaN(minVal)) {
        list = list.filter((p) => {
          const sal = salaryFilterType === 'net' ? p.netSalary : p.basicSalary;
          return sal >= minVal;
        });
      }
    }

    if (maxSalary.trim()) {
      const maxVal = parseFloat(maxSalary);
      if (!isNaN(maxVal)) {
        list = list.filter((p) => {
          const sal = salaryFilterType === 'net' ? p.netSalary : p.basicSalary;
          return sal <= maxVal;
        });
      }
    }

    // Filter by deductions presence
    if (deductionsFilter !== 'all') {
      list = list.filter((p) => {
        const hasAnyDeduction = p.totalDeductions > 0;
        const absenceDeduction = (p.deductionDaysVal || 0) > 0;
        const delayDeduction = (p.deductionHoursVal || 0) > 0;
        const penaltyDeduction = (p.deductionPenaltiesVal || 0) > 0;

        switch (deductionsFilter) {
          case 'has-any':
            return hasAnyDeduction;
          case 'no-deductions':
            return !hasAnyDeduction;
          case 'has-absence':
            return absenceDeduction;
          case 'has-delay':
            return delayDeduction;
          case 'has-penalty':
            return penaltyDeduction;
          default:
            return true;
        }
      });
    }

    const sorted = [...list];
    if (archiveSortOrder === 'netDesc') {
      sorted.sort((a, b) => b.netSalary - a.netSalary);
    } else if (archiveSortOrder === 'netAsc') {
      sorted.sort((a, b) => a.netSalary - b.netSalary);
    } else if (archiveSortOrder === 'basicDesc') {
      sorted.sort((a, b) => b.basicSalary - a.basicSalary);
    }

    return sorted;
  }, [
    activeMonth,
    selectedDeptId,
    deptsPayrollSummary,
    searchQuery,
    salaryFilterType,
    minSalary,
    maxSalary,
    deductionsFilter,
    archiveSortOrder
  ]);

  // Group filtered payrolls per department for printing the official salary receipt book format
  const groupedPayrollsByDept = useMemo(() => {
    if (!filteredPayrolls || filteredPayrolls.length === 0) return [];

    const map: { [dept: string]: CalculatedPayroll[] } = {};
    filteredPayrolls.forEach((p) => {
      const empSnap = activeMonth?.employeesSnapshot?.find(
        (e) => e.id === p.employeeId || e.name === p.employeeName
      );
      const title = getNormalizedDeptTitle(empSnap?.departmentId, p.departmentName);
      if (!map[title]) map[title] = [];
      map[title].push(p);
    });

    return Object.keys(map).map((deptName) => {
      const payrolls = map[deptName];
      const deptBasicSum = payrolls.reduce((s, p) => s + (p.basicSalary || 0), 0);
      const deptEarnSum = payrolls.reduce((s, p) => s + (p.totalEarnings || 0), 0);
      const deptDedSum = payrolls.reduce((s, p) => s + (p.totalDeductions || 0), 0);
      const deptNetSum = payrolls.reduce((s, p) => s + (p.netSalary || 0), 0);
      return {
        deptName,
        payrolls,
        deptBasicSum,
        deptEarnSum,
        deptDedSum,
        deptNetSum,
      };
    });
  }, [filteredPayrolls, activeMonth]);

  const selectedDeptSummary = useMemo(() => {
    if (selectedDeptId === 'all' || selectedDeptId === 'fixed_departments') return null;
    return (deptsPayrollSummary as any[]).find(
      (d) => d.id === selectedDeptId || d.catKey === selectedDeptId || d.deptIds?.has(selectedDeptId)
    );
  }, [deptsPayrollSummary, selectedDeptId]);

  const reportTotals = useMemo(() => {
    if (selectedDeptId === 'all') {
      const basic = filteredPayrolls.reduce((s, p) => s + (p.basicSalary || 0), 0);
      const earn = deptsPayrollSummary.reduce((s, d) => s + (d.totalEarningsSum || 0), 0);
      const ded = deptsPayrollSummary.reduce((s, d) => s + (d.totalDeductionsSum || 0), 0);
      const net = deptsPayrollSummary.reduce((s, d) => s + (d.totalNetSalarySum || 0), 0);
      return { basic, earn, ded, net };
    } else if (selectedDeptId === 'fixed_departments') {
      const earn = fixedDeptSummaries.reduce((s, d) => s + (d.totalEarningsSum || 0), 0);
      const ded = fixedDeptSummaries.reduce((s, d) => s + (d.totalDeductionsSum || 0), 0);
      const net = fixedSalaryStats.netSum;
      return { basic: 0, earn, ded, net };
    } else {
      const curr = selectedDeptSummary;
      if (filteredPayrolls.length > 0) {
        const basic = filteredPayrolls.reduce((s, p) => s + (p.basicSalary || 0), 0);
        const earn = filteredPayrolls.reduce((s, p) => s + getPayrollAllowancesSum(p), 0);
        const ded = filteredPayrolls.reduce((s, p) => s + getPayrollDeductionsSum(p), 0);
        const net = filteredPayrolls.reduce((s, p) => s + (p.netSalary || 0), 0);
        return {
          basic: Math.max(basic, (curr?.totalNetSalarySum || 0) > 0 && basic === 0 ? curr?.totalNetSalarySum || 0 : basic),
          earn: Math.max(earn, curr?.totalEarningsSum || 0),
          ded: Math.max(ded, curr?.totalDeductionsSum || 0),
          net: Math.max(net, curr?.totalNetSalarySum || 0),
        };
      } else if (curr) {
        return {
          basic: 0,
          earn: curr.totalEarningsSum || 0,
          ded: curr.totalDeductionsSum || 0,
          net: curr.totalNetSalarySum || 0,
        };
      } else {
        return { basic: 0, earn: 0, ded: 0, net: 0 };
      }
    }
  }, [selectedDeptId, filteredPayrolls, deptsPayrollSummary, fixedDeptSummaries, fixedSalaryStats, selectedDeptSummary]);

  // Format currency Helper in IQD
  const formatIQD = (amount: number) => {
    return Math.round(amount).toLocaleString('en-US') + ' د.ع';
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="no-print space-y-6">
        {/* Month Selector & Controls Header */}
      <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">أرشيف رواتب الأشهر وحافظة الكشوفات</h2>
            <p className="text-[10px] text-slate-400">اختر الشهر لمشاهدة كافة الأقسام والموظفين واستعراض كشف راتب أي موظف</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <label className="text-xs text-slate-300 font-semibold shrink-0 flex items-center gap-1">
            <CalendarDays className="w-4 h-4 text-indigo-400" />
            <span>اختر الشهر المراد تصفحه:</span>
          </label>
          <div className="relative flex-1 md:flex-initial">
            <select
              id="archive-month-select"
              value={selectedMonthId || (activeMonth ? activeMonth.monthId : '')}
              onChange={(e) => {
                setSelectedMonthId(e.target.value);
                setSelectedDeptId('all'); // Reset filtered department
                setPrintMode('full');
                setPrintingEmployeeDetail(null);
              }}
              className="w-full md:w-64 px-3 py-2 bg-slate-900/90 border border-indigo-500/40 rounded-xl text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans cursor-pointer shadow-md"
            >
              {allMonths.map((m) => (
                <option key={m.monthId} value={m.monthId}>
                  {m.monthLabel} ({m.monthId})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          </div>

          {activeMonth && (
            <div className="flex items-center gap-1.5 flex-wrap mr-1">
              <button
                onClick={handleExportToExcel}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-950/20"
                title="تصدير كشف الرواتب المحدد كجدول إكسل"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                تصدير كشف إكسل Excel
              </button>

              <button
                onClick={handlePrintPDF}
                disabled={isGeneratingPdf}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-sky-950/20 disabled:opacity-60 disabled:cursor-not-allowed"
                title="تصدير هذا التقرير كملف PDF مع خيار الحفظ باسم"
              >
                {isGeneratingPdf ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    جاري التوليد...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 text-sky-200" />
                    تصدير كـ PDF مباشر 📥
                  </>
                )}
              </button>

              {onDeleteArchiveMonth && (
                <button
                  onClick={() => {
                    if (confirm(language === 'ar' ? `هل ترغب بالفعل بحذف الشهر المؤرشف (${activeMonth.monthLabel || activeMonth.monthId}) نهائياً من النظام؟` : `Delete archived month (${activeMonth.monthLabel || activeMonth.monthId}) permanently?`)) {
                      onDeleteArchiveMonth(activeMonth.monthId);
                    }
                  }}
                  className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                  title="مسح هذا الشهر المؤرشف نهائياً"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>{language === 'ar' ? 'حذف هذا الشهر' : 'Delete Month'}</span>
                </button>
              )}

              <button
                onClick={handleDirectPrint}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-950/20"
                title="إرسال أمر الطباعة فوراً وبشكل تلقائي إلى الطابعة"
              >
                <Printer className="w-4 h-4 text-indigo-200" />
                طباعة التقرير مباشرة 🖨️
              </button>
            </div>
          )}
        </div>
      </div>

      {activeMonth && (
        <>
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-indigo-900/40 via-indigo-950/20 to-transparent border border-indigo-500/10 p-4 rounded-2xl shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-indigo-300 font-bold block">إجمالي صافي الرواتب المصروفة</span>
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <p className="text-base font-bold text-indigo-300 font-mono mt-2 tracking-tight">
                {formatIQD(activeMonth.totalNetPaid)}
              </p>
              <span className="text-[9px] text-slate-500 block">شامل جميع الاستحقاقات والمكافآت</span>
            </div>

            <div className="bg-gradient-to-br from-emerald-900/40 via-emerald-950/20 to-transparent border border-emerald-500/10 p-4 rounded-2xl shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-emerald-300 font-bold block">مجموع الاستحقاقات والإضافات</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <p className="text-base font-bold text-emerald-300 font-mono mt-2 tracking-tight">
                {formatIQD(activeMonth.totalEarningsSum)}
              </p>
              <span className="text-[9px] text-slate-500 block">تشمل الشفتات والاستدعاء والخطورة والزوجية</span>
            </div>

            <div className="bg-gradient-to-br from-red-900/40 via-red-950/20 to-transparent border border-red-500/10 p-4 rounded-2xl shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-red-300 font-bold block">مجموع المستقطعات والعقوبات</span>
                <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <p className="text-base font-bold text-red-300 font-mono mt-2 tracking-tight">
                {formatIQD(activeMonth.totalDeductionsSum)}
              </p>
              <span className="text-[9px] text-slate-500 block">بما فيها الغيابات وتأخيرات الساعات</span>
            </div>

            <div className="bg-gradient-to-br from-slate-800/60 to-transparent border border-white/5 p-4 rounded-2xl shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-300 font-bold block">عدد الكوادر المشمولين</span>
                <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-base font-bold text-white font-mono mt-2 tracking-tight">
                {activeMonth.payrollsSnapshot?.length || 0} منتسب
              </p>
              <span className="text-[9px] text-slate-500 block">إجمالي المنتسبين الذين تم حساب رواتبهم</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Right Panel: Departments list overview */}
            <div className="lg:col-span-4 space-y-3">
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-3">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <Building2 className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                  رواتب وتكاليف الأقسام لـ ({activeMonth.monthLabel})
                </h3>

                <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1 pb-6">
                  <button
                    onClick={() => setSelectedDeptId('all')}
                    className={`w-full text-right p-3 rounded-xl flex items-center justify-between border cursor-pointer transition-all ${
                      selectedDeptId === 'all'
                        ? 'bg-blue-600/20 border-blue-500/50 text-white font-bold'
                        : 'bg-transparent border-transparent text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    <span className="text-xs">كل الأقسام والموظفين</span>
                    <span className="text-[10px] font-mono shrink-0 bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                      {activeMonth.payrollsSnapshot?.length || 0}
                    </span>
                  </button>

                  {/* Dedicated Quick Action Button for Fixed Salary Departments (الصيانة، الأشعة، الإسعاف، الأمنية) */}
                  <button
                    onClick={() => setSelectedDeptId('fixed_departments')}
                    className={`w-full text-right p-3 rounded-xl flex items-center justify-between border cursor-pointer transition-all ${
                      selectedDeptId === 'fixed_departments'
                        ? 'bg-amber-600/30 border-amber-500/80 text-amber-100 font-bold shadow-md shadow-amber-950/40'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                    }`}
                    title="عرض كشف حساب الأقسام ذات الرواتب القطعية (الصيانة، الأشعة، الإسعاف، والأمنية)"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs p-1 bg-amber-500/20 rounded-md border border-amber-500/40">⚡</span>
                      <div>
                        <span className="text-xs font-bold block text-amber-200">الأقسام ذات الرواتب القطعية</span>
                        <span className="text-[9.5px] text-amber-300/80 block">الصيانة، الأشعة، الإسعاف، الأمنية</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono shrink-0 bg-amber-950/90 text-amber-300 px-2 py-0.5 rounded-full border border-amber-700/60 font-bold">
                      {fixedSalaryStats.count} منتسب
                    </span>
                  </button>

                  {deptsPayrollSummary.map((deptSummary, idx) => {
                    const isFixedDept = ['cat-security', 'cat-radiology', 'cat-ambulance', 'cat-maintenance'].includes(deptSummary.catKey);
                    return (
                      <button
                        key={deptSummary.catKey || `${deptSummary.id}-${idx}`}
                        onClick={() => setSelectedDeptId(deptSummary.id)}
                        className={`w-full text-right p-3 rounded-xl flex flex-col gap-1 border cursor-pointer transition-all ${
                          selectedDeptId === deptSummary.id
                            ? 'bg-blue-600/20 border-blue-500/50 text-white font-bold'
                            : 'bg-transparent border-transparent text-slate-400 hover:bg-white/5'
                        }`}
                      >
                        <div className="w-full flex items-center justify-between text-xs">
                          <span className="truncate flex items-center gap-1.5">
                            <span>{deptSummary.name}</span>
                            {isFixedDept && (
                              <span className="text-[8.5px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-bold shrink-0">
                                ⚡ قطعي
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700/50 font-mono shrink-0">
                            {deptSummary.employeesSnapshotCount} منتسب
                          </span>
                        </div>
                        <div className="w-full flex items-center justify-between text-[11px] font-sans text-slate-400 mt-1">
                          <span>إجمالي الصافي للمستشفي:</span>
                          <span className="font-mono text-left font-semibold text-emerald-400">
                            {formatIQD(deptSummary.totalNetSalarySum)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Left Panel: Employee Snapshot List */}
            <div className="lg:col-span-8 space-y-3">
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-4">
                {/* Search Bar & Table Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-white">
                      {selectedDeptId === 'all'
                        ? 'قائمة الرواتب لكافة الفئات والأقسام'
                        : selectedDeptId === 'fixed_departments'
                        ? '⚡ كشف حساب الأقسام ذات الرواتب القطعية (الصيانة، الأشعة، الإسعاف، الأمنية)'
                        : `قائمة الرواتب لقسم: ${
                            deptsPayrollSummary.find((d) => d.id === selectedDeptId || d.catKey === selectedDeptId)?.name || ''
                          }`}
                    </h3>
                    <p className="text-[10px] text-slate-400">تظهر نتائج البحث مطابقة للسجلات المسجلة مسبقاً</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <div className="relative">
                      <select
                        value={archiveSortOrder}
                        onChange={(e) => setArchiveSortOrder(e.target.value as any)}
                        className="pl-3 pr-7 py-1.5 bg-indigo-950/60 border border-indigo-500/30 rounded-xl text-indigo-300 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
                        title="ترتيب كشف الراتب قبل الطباعة"
                      >
                        <option value="netDesc">⬇️ ترتيب الراتب من الأعلى إلى الأسفل</option>
                        <option value="netAsc">⬆️ ترتيب الراتب من الأسفل إلى الأعلى</option>
                        <option value="basicDesc">💵 ترتيب حسب الراتب الأساسي (الأعلى أولاً)</option>
                        <option value="default">📋 الترتيب الافتراضي بالسجل</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-indigo-400 absolute left-2 top-2.5 pointer-events-none" />
                    </div>

                    <div className="relative flex-1 sm:flex-initial">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث بالاسم أو المسمى..."
                        className="w-full sm:w-56 pl-3 pr-8 py-1.5 bg-slate-900/80 border border-white/10 rounded-xl text-white text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500 text-right"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className={`p-1.5 px-3 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        showAdvancedFilters || minSalary || maxSalary || deductionsFilter !== 'all'
                          ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                      }`}
                      title="خيارات الفلترة المتقدمة (الراتب والاستقطاعات)"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>فلترة متقدمة</span>
                      {(minSalary || maxSalary || deductionsFilter !== 'all') && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Advanced Filters Panel */}
                <AnimatePresence>
                  {showAdvancedFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border border-white/5 bg-slate-950/60 p-4 rounded-xl space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                          تصفية متقدمة لرواتب الكادر
                        </span>
                        
                        {(minSalary || maxSalary || deductionsFilter !== 'all') && (
                          <button
                            onClick={() => {
                              setMinSalary('');
                              setMaxSalary('');
                              setDeductionsFilter('all');
                            }}
                            className="text-[10px] text-red-400 hover:text-red-300 cursor-pointer"
                          >
                            تصفير الفلاتر
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                        {/* Column 1: Salary bounds */}
                        <div className="space-y-3">
                          <label className="block text-slate-300 font-bold">بناءً على الراتب والمحافظة المالية:</label>
                          
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setSalaryFilterType('net')}
                              className={`flex-1 py-1 rounded-lg border text-center font-bold text-[10px] transition-all cursor-pointer ${
                                salaryFilterType === 'net'
                                  ? 'bg-indigo-600/30 border-indigo-500/50 text-white'
                                  : 'bg-transparent border-white/5 text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              الراتب الصافي النهائي
                            </button>
                            <button
                              type="button"
                              onClick={() => setSalaryFilterType('basic')}
                              className={`flex-1 py-1 rounded-lg border text-center font-bold text-[10px] transition-all cursor-pointer ${
                                salaryFilterType === 'basic'
                                  ? 'bg-indigo-600/30 border-indigo-500/50 text-white'
                                  : 'bg-transparent border-white/5 text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              الراتب الأساسي
                            </button>
                          </div>

                          <div className="flex gap-2 items-center">
                            <div className="flex-1">
                              <span className="text-[10px] text-slate-400 block mb-1">الحد الأدنى (د.ع):</span>
                              <input
                                type="number"
                                value={minSalary}
                                onChange={(e) => setMinSalary(e.target.value)}
                                placeholder="مثال: 500000"
                                className="w-full px-2.5 py-1 bg-slate-900 border border-white/10 rounded-lg text-white font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>

                            <div className="flex-1">
                              <span className="text-[10px] text-slate-400 block mb-1">الحد الأعلى (د.ع):</span>
                              <input
                                type="number"
                                value={maxSalary}
                                onChange={(e) => setMaxSalary(e.target.value)}
                                placeholder="مثال: 2000000"
                                className="w-full px-2.5 py-1 bg-slate-900 border border-white/10 rounded-lg text-white font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Column 2: Deductions */}
                        <div className="space-y-2">
                          <label className="block text-slate-300 font-bold mb-1">تصفية بحسب وجود استقطاعات:</label>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setDeductionsFilter('all')}
                              className={`py-1.5 px-2 rounded-lg border text-right text-[10px] transition-all cursor-pointer ${
                                deductionsFilter === 'all'
                                  ? 'bg-indigo-600/30 border-indigo-500/50 text-white font-bold'
                                  : 'bg-slate-900 border-white/5 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              رؤية الجميع
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeductionsFilter('has-any')}
                              className={`py-1.5 px-2 rounded-lg border text-right text-[10px] transition-all cursor-pointer ${
                                deductionsFilter === 'has-any'
                                  ? 'bg-indigo-600/30 border-indigo-500/50 text-white font-bold'
                                  : 'bg-slate-900 border-white/5 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              لديه أي استقطاع
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeductionsFilter('no-deductions')}
                              className={`py-1.5 px-2 rounded-lg border text-right text-[10px] transition-all cursor-pointer ${
                                deductionsFilter === 'no-deductions'
                                  ? 'bg-indigo-600/30 border-indigo-500/50 text-white font-bold'
                                  : 'bg-slate-900 border-white/5 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              خالٍ من الاستقطاعات
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeductionsFilter('has-absence')}
                              className={`py-1.5 px-2 rounded-lg border text-right text-[10px] transition-all cursor-pointer ${
                                deductionsFilter === 'has-absence'
                                  ? 'bg-indigo-600/30 border-indigo-500/50 text-white font-bold'
                                  : 'bg-slate-900 border-white/5 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              مستقطع غيابات أيام
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeductionsFilter('has-delay')}
                              className={`py-1.5 px-2 rounded-lg border text-right text-[10px] transition-all cursor-pointer ${
                                deductionsFilter === 'has-delay'
                                  ? 'bg-indigo-600/30 border-indigo-500/50 text-white font-bold'
                                  : 'bg-slate-900 border-white/5 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              مستقطع ساعات تأخر
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeductionsFilter('has-penalty')}
                              className={`py-1.5 px-2 rounded-lg border text-right text-[10px] transition-all cursor-pointer ${
                                deductionsFilter === 'has-penalty'
                                  ? 'bg-indigo-600/30 border-indigo-500/50 text-white font-bold'
                                  : 'bg-slate-900 border-white/5 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              غرامات / جزاءات عقابية
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* If fixed departments is selected, show the 4 department summary grid & lump-sum statement table */}
                {selectedDeptId === 'fixed_departments' && (
                  <div className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-4 mb-4 space-y-4 shadow-xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl text-base font-bold">⚡</span>
                        <div>
                          <h3 className="text-sm font-bold text-slate-100">جدول كشف حساب وحافظة رواتب الأقسام ذات الرواتب القطعية الأربعة</h3>
                          <p className="text-[11px] text-slate-400">يتضمن (قسم الامنية - قسم الاسعاف - قسم الصيانة - قسم الاشعة والمفراس)</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-300 bg-slate-950 px-3 py-1.5 rounded-full border border-emerald-500/30 shadow-sm">
                        إجمالي الرواتب القطعية المصروفة: {formatIQD(fixedSalaryStats.netSum)}
                      </span>
                    </div>

                    {/* 4 Cards Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {fixedDeptSummaries.map((dept) => (
                        <div key={dept.catKey} className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between space-y-2 shadow-sm">
                          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                            <span className="text-xs font-bold text-slate-200">{dept.name}</span>
                            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono font-bold border border-slate-700">
                              {dept.employeesSnapshotCount > 0 ? `${dept.employeesSnapshotCount} منتسب` : 'راتب قطعي'}
                            </span>
                          </div>
                          <div className="space-y-1 text-[11px] font-mono">
                            <div className="flex justify-between text-slate-400">
                              <span>المستحقات:</span>
                              <span className="text-emerald-400 font-semibold">+{formatIQD(dept.totalEarningsSum)}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>الخصومات:</span>
                              <span className="text-red-400 font-semibold">-{formatIQD(dept.totalDeductionsSum)}</span>
                            </div>
                            <div className="flex justify-between text-white font-bold border-t border-white/10 pt-1 text-xs">
                              <span>صافي الراتب المصروف:</span>
                              <span className="text-emerald-300">{formatIQD(dept.totalNetSalarySum)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Official Statement Table for Fixed Departments */}
                    <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950 pt-2">
                      <div className="px-3 py-1.5 text-xs font-bold text-slate-200 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
                        <span>📋 بيان كشف حساب الأقسام ذات الرواتب القطعية المعتمد</span>
                        <span className="text-[10px] font-normal text-slate-400">مصروف ككتلة إجمالية مقطوعة</span>
                      </div>
                      <table className="w-full text-right border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-900 text-slate-300 text-[11px] font-bold border-b border-slate-800">
                            <th className="p-2.5 text-center w-10">ت</th>
                            <th className="p-2.5 text-right">اسم القسم ذات الراتب القطعي</th>
                            <th className="p-2.5 text-center">طبيعة الصرف</th>
                            <th className="p-2.5 text-left text-emerald-300">إجمالي المستحقات</th>
                            <th className="p-2.5 text-left text-red-300">إجمالي الاستقطاعات</th>
                            <th className="p-2.5 text-left text-emerald-300 font-black text-sm">صافي الراتب المصروف للقسم</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {fixedDeptSummaries.map((dept, idx) => (
                            <tr key={dept.catKey} className="hover:bg-slate-900/50 transition-colors">
                              <td className="p-2.5 text-center font-mono font-bold text-slate-400">{idx + 1}</td>
                              <td className="p-2.5 font-bold text-white text-xs sm:text-sm">
                                {dept.name}
                                {dept.employeesSnapshotCount > 0 && (
                                  <span className="text-[10px] text-slate-400 mr-2 bg-slate-800 px-2 py-0.5 rounded-full font-mono font-normal border border-slate-700">
                                    ({dept.employeesSnapshotCount} منتسب)
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 text-center">
                                <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-full text-[10px] font-bold">
                                  مقطوع / راتب قطعي
                                </span>
                              </td>
                              <td className="p-2.5 font-mono text-left text-emerald-400 font-semibold text-xs">
                                +{formatIQD(dept.totalEarningsSum)}
                              </td>
                              <td className="p-2.5 font-mono text-left text-red-400 font-semibold text-xs">
                                -{formatIQD(dept.totalDeductionsSum)}
                              </td>
                              <td className="p-2.5 font-mono text-left text-emerald-300 font-black text-xs sm:text-sm">
                                {formatIQD(dept.totalNetSalarySum)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-900 text-slate-200 font-bold border-t-2 border-slate-800 text-xs">
                            <td colSpan={3} className="p-2.5 text-right font-black">إجمالي كافة الأقسام القطعية الأربعة:</td>
                            <td className="p-2.5 font-mono text-left text-emerald-300">+{formatIQD(fixedDeptSummaries.reduce((s, d) => s + d.totalEarningsSum, 0))}</td>
                            <td className="p-2.5 font-mono text-left text-red-300">-{formatIQD(fixedDeptSummaries.reduce((s, d) => s + d.totalDeductionsSum, 0))}</td>
                            <td className="p-2.5 font-mono text-left text-emerald-300 font-black text-sm underline">{formatIQD(fixedSalaryStats.netSum)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* Table list */}
                <div className="overflow-x-auto border border-white/5 rounded-xl">
                  {selectedDeptId === 'fixed_departments' ? null : filteredPayrolls.length === 0 ? (
                    selectedDeptSummary && selectedDeptSummary.totalNetSalarySum > 0 ? (
                      <div className="p-6 bg-slate-950/60 border border-amber-500/30 rounded-xl space-y-4 m-2">
                        <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-amber-400 text-lg">⚡</span>
                            <div>
                              <h3 className="text-sm font-bold text-amber-200">{selectedDeptSummary.name}</h3>
                              <p className="text-[10px] text-amber-300/80">قسم ذو تخصيص راتب قطعي / ميزانية مقطوعة معتمدة</p>
                            </div>
                          </div>
                          <div className="text-left font-mono">
                            <span className="text-[10px] text-slate-400 block">صافي الراتب المعتمد:</span>
                            <span className="text-base font-black text-emerald-400">{formatIQD(selectedDeptSummary.totalNetSalarySum)}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center text-xs">
                          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                            <span className="text-[10px] text-slate-400 block mb-1">الراتب الأساسي</span>
                            <span className="font-mono font-bold text-slate-200">0 د.ع</span>
                          </div>
                          <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                            <span className="text-[10px] text-emerald-300 block mb-1">مجموع المستحقات والإضافات</span>
                            <span className="font-mono font-bold text-emerald-400">+{formatIQD(selectedDeptSummary.totalEarningsSum)}</span>
                          </div>
                          <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                            <span className="text-[10px] text-red-300 block mb-1">مجموع الاستقطاعات والخصومات</span>
                            <span className="font-mono font-bold text-red-400">-{formatIQD(selectedDeptSummary.totalDeductionsSum)}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-xs text-slate-500">
                        لا توجد سجلات مطابقة لخيارات الفرز الحالية.
                      </div>
                    )
                  ) : selectedDeptId === 'all' ? (
                    <div className="space-y-4 p-2">
                      {groupedPayrollsByDept.map(({ deptName, payrolls, deptNetSum, deptEarnSum, deptDedSum }) => (
                        <div key={deptName} className="border border-white/10 rounded-xl overflow-hidden bg-slate-950/40">
                          <div className="bg-white/5 px-4 py-2.5 flex items-center justify-between border-b border-white/10">
                            <div className="flex items-center gap-2">
                              <span className="text-amber-400">🏢</span>
                              <span className="text-xs font-bold text-white">{deptName}</span>
                              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                                {payrolls.length} منتسب
                              </span>
                            </div>
                            <span className="text-xs font-mono font-bold text-emerald-400">
                              مجموع الصافي للقسم: {formatIQD(deptNetSum)}
                            </span>
                          </div>
                          <table className="w-full text-right border-collapse text-[11px]">
                            <thead>
                              <tr className="bg-black/20 text-slate-400 text-[10px] font-bold border-b border-white/5">
                                <th className="p-2.5 text-right">المنتسب</th>
                                <th className="p-2.5 text-right">المسمى والمنصب</th>
                                <th className="p-2.5 text-left">الراتب الأساسي</th>
                                <th className="p-2.5 text-left text-emerald-300">الإضافات</th>
                                <th className="p-2.5 text-left text-red-300">المستقطعات</th>
                                <th className="p-2.5 text-left text-blue-300 font-extrabold">الصافي المقبوض</th>
                                <th className="p-2.5 text-center no-print">التفاصيل</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {payrolls.map((p) => (
                                <tr key={p.employeeId} className="hover:bg-white/5 transition-colors">
                                  <td className="p-2.5 font-semibold text-white">{p.employeeName}</td>
                                  <td className="p-2.5">
                                    <span className="text-slate-300 font-medium">{p.position}</span>
                                    <span className="text-[9px] text-slate-500 block">{p.departmentName}</span>
                                  </td>
                                  <td className="p-2.5 font-mono text-left text-slate-400">
                                    {formatIQD(p.basicSalary)}
                                  </td>
                                  <td className="p-2.5 font-mono text-left text-emerald-400">
                                    +{formatIQD(p.totalEarnings - p.basicDaysPay)}
                                  </td>
                                  <td className="p-2.5 font-mono text-left text-red-400 text-opacity-90">
                                    -{formatIQD(p.totalDeductions)}
                                  </td>
                                  <td className="p-2.5 font-mono text-left text-blue-300 font-extrabold text-xs">
                                    {formatIQD(p.netSalary)}
                                  </td>
                                  <td className="p-2.5 text-center no-print">
                                    <button
                                      onClick={() => setActivePayrollDetail(p)}
                                      className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 rounded-lg text-[10px] font-bold text-indigo-200 hover:text-white transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1 mx-auto"
                                    >
                                      <FileText className="w-3 h-3 text-indigo-400" />
                                      <span>كشف راتب</span>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <table className="w-full text-right border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-white/5 border-b border-white/10 text-slate-300 font-bold">
                          <th className="p-3 text-right">المنتسب</th>
                          <th className="p-3 text-right">المسمى والمنصب</th>
                          <th className="p-3 text-left">الراتب الأساسي</th>
                          <th className="p-3 text-left text-emerald-300">الإضافات</th>
                          <th className="p-3 text-left text-red-300">المستقطعات</th>
                          <th className="p-3 text-left text-blue-300 font-extrabold">الصافي المقبوض</th>
                          <th className="p-3 text-center no-print">التفاصيل</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredPayrolls.map((p) => (
                          <tr key={p.employeeId} className="hover:bg-white/5 transition-colors">
                            <td className="p-3 font-semibold text-white">{p.employeeName}</td>
                            <td className="p-3">
                              <span className="text-slate-300 font-medium">{p.position}</span>
                              <span className="text-[9px] text-slate-500 block">{p.departmentName}</span>
                            </td>
                            <td className="p-3 font-mono text-left text-slate-400">
                              {formatIQD(p.basicSalary)}
                            </td>
                            <td className="p-3 font-mono text-left text-emerald-400">
                              +{formatIQD(p.totalEarnings - p.basicDaysPay)}
                            </td>
                            <td className="p-3 font-mono text-left text-red-400 text-opacity-90">
                              -{formatIQD(p.totalDeductions)}
                            </td>
                            <td className="p-3 font-mono text-left text-blue-300 font-extrabold text-xs">
                              {formatIQD(p.netSalary)}
                            </td>
                            <td className="p-3 text-center no-print">
                              <button
                                onClick={() => setActivePayrollDetail(p)}
                                className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 rounded-xl text-[11px] font-bold text-indigo-200 hover:text-white transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 mx-auto"
                                title="مشاهدة كشف راتب الموظف تفصيلياً"
                              >
                                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                <span>مشاهدة كشف راتب</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Detail Popup Drawer - Employee Detail breakdown snapshots */}
      <AnimatePresence>
        {activePayrollDetail && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-slate-900 border border-slate-800 max-w-2xl w-full rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950/40 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white">تفصيل رواتب وأجور المنتسب لشهر {activeMonth?.monthLabel}</span>
                </div>
                <button
                  onClick={() => {
                    setActivePayrollDetail(null);
                    setPrintMode('full');
                    setPrintingEmployeeDetail(null);
                  }}
                  className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                {/* Employee metadata Snapshot */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white/5 rounded-xl border border-white/5 text-xs">
                  <div>
                    <span className="text-slate-500 block mb-0.5">اسم المنتسب:</span>
                    <span className="text-white font-bold block">{activePayrollDetail.employeeName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">القسم الفعلي بالمستشفى:</span>
                    <span className="text-white block font-semibold">{activePayrollDetail.departmentName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">المنصب والعنوان الوظيفي:</span>
                    <span className="text-white font-medium block">{activePayrollDetail.position}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">الجنس:</span>
                    <span className="text-slate-300 block">{activePayrollDetail.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
                  </div>
                </div>

                {/* تفاصيل احتساب الراتب ومعدلات الأجر (Comprehensive Attendance & Pay Rates section) */}
                <div className="bg-[#1e293b]/60 border border-slate-700/50 p-4 rounded-xl space-y-3 shadow-md">
                  <h4 className="text-xs font-black text-indigo-300 border-b border-slate-700/60 pb-1.5 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                    <span>معدلات الأجر والدوام وتفاصيل المخصصات الاجتماعية</span>
                  </h4>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-[11px] font-sans">
                    <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
                      <span className="text-slate-405 text-[10px] mb-1">أيام الدوام الفعلي كلياً:</span>
                      <strong className="text-white font-black font-mono text-xs">
                        {activeEmployeeSnapshot?.workingDays !== undefined ? `${activeEmployeeSnapshot.workingDays} يوم` : '0 يوم'}
                      </strong>
                    </div>

                    <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
                      <span className="text-slate-405 text-[10px] mb-1">ساعات العمل العادية:</span>
                      <strong className="text-white font-black font-mono text-xs">
                        {activeEmployeeSnapshot?.workingHours !== undefined ? `${activeEmployeeSnapshot.workingHours} ساعة` : '0 ساعة'}
                      </strong>
                    </div>

                    <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
                      <span className="text-slate-405 text-[10px] mb-1">أجر اليوم الواحد:</span>
                      <strong className="text-emerald-400 font-extrabold font-mono text-xs">
                        {formatIQD(activePayrollDetail.dayPrice || 0)}
                      </strong>
                    </div>

                    <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
                      <span className="text-slate-405 text-[10px] mb-1">أجر الساعة الواحدة:</span>
                      <strong className="text-emerald-400 font-extrabold font-mono text-xs">
                        {formatIQD(activePayrollDetail.hourPrice || 0)}
                      </strong>
                    </div>

                    <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
                      <span className="text-slate-405 text-[10px] mb-1">الزوجية الاجتماعية:</span>
                      <strong className="text-indigo-305 font-black text-[11.5px] leading-tight">
                        {activeEmployeeSnapshot?.allowanceMarriage ? `مستحق (${formatIQD(activeEmployeeSnapshot.allowanceMarriage)})` : 'غير مستحق / أعزب'}
                      </strong>
                    </div>

                    <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
                      <span className="text-slate-405 text-[10px] mb-1">الأطفال المسجلين:</span>
                      <strong className="text-indigo-305 font-black font-mono text-xs">
                        {activeEmployeeSnapshot?.allowanceChildren ?? 0} طفل
                      </strong>
                    </div>

                    <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-805 flex flex-col justify-between">
                      <span className="text-slate-405 text-[10px] mb-1">أيام الإيجابية المضافة:</span>
                      <strong className="text-amber-400 font-black font-mono text-xs">
                        {activeEmployeeSnapshot?.allowanceExtraDays ?? 0} يوم
                      </strong>
                    </div>

                    <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-805 flex flex-col justify-between">
                      <span className="text-slate-405 text-[10px] mb-1">ساعات الإضافي المسجلة:</span>
                      <strong className="text-amber-400 font-black font-mono text-xs">
                        {activeEmployeeSnapshot?.allowanceExtraHours ?? 0} ساعة
                      </strong>
                    </div>

                    <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-805 flex flex-col justify-between">
                      <span className="text-slate-405 text-[10px] mb-1">أيام الغياب والاستقطاع:</span>
                      <strong className="text-red-400 font-black font-mono text-xs">
                        {activeEmployeeSnapshot?.deductionDays ?? 0} يوم غياب
                      </strong>
                    </div>

                    <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-805 flex flex-col justify-between">
                      <span className="text-slate-405 text-[10px] mb-1">ساعات التأخر والغرامات:</span>
                      <strong className="text-red-400 font-black font-mono text-xs">
                        {activeEmployeeSnapshot?.deductionHours ?? 0} ساعة تأخير
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[11px]">
                  {/* Detailed Earnings side snap */}
                  <div className="space-y-4 bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl">
                    <h4 className="text-xs font-black text-emerald-400 border-b border-emerald-500/10 pb-1.5 flex justify-between">
                      <span>الاستحقاقات والمضافات الشاملة (+)</span>
                      <span>{formatIQD(activePayrollDetail.totalEarnings)}</span>
                    </h4>

                    <div className="space-y-3">
                      {/* Section 1: Base Completion */}
                      <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60 space-y-1.5">
                        <span className="text-[10px] text-teal-300 font-extrabold block border-b border-slate-800 pb-1">أولاً: أجور الدوام الأساسي المنجز</span>
                        <div className="flex justify-between font-mono text-xs text-white">
                          <span className="text-slate-400 font-sans">أجر أيام حضور العمل:</span>
                          <span>{formatIQD(activePayrollDetail.basicDaysPay)}</span>
                        </div>
                        {activePayrollDetail.basicHoursPay > 0 && (
                          <div className="flex justify-between font-mono text-xs text-white border-t border-slate-900/40 pt-1.5">
                            <span className="text-slate-400 font-sans">أجر الساعات الاعتيادية:</span>
                            <span>+{formatIQD(activePayrollDetail.basicHoursPay)}</span>
                          </div>
                        )}
                      </div>

                      {/* Section 2: Additions / Allowances */}
                      <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60 space-y-1.5">
                        <div className="flex justify-between text-[10px] text-emerald-400 font-extrabold border-b border-slate-800 pb-1">
                          <span>ثانياً: الإضافات والشفتات والمخصصات (+)</span>
                          <span className="text-emerald-300 font-mono font-black">{formatIQD(activeAdditionsOnlyVal)}</span>
                        </div>

                        <div className="space-y-1.5 text-slate-300 font-mono text-xs">
                          {activeAdditionsOnlyVal === 0 ? (
                            <div className="text-center py-2 text-slate-500 text-[10px] font-bold italic">
                              لا توجد إضافات أو مخصصات مسجلة (0 د.ع)
                            </div>
                          ) : (
                            <>
                              {activePayrollDetail.shiftsMorningPay > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400 font-sans">أجر الشفت الصباحي:</span>
                                  <span>+{formatIQD(activePayrollDetail.shiftsMorningPay)}</span>
                                </div>
                              )}
                              {activePayrollDetail.shiftsEveningPay > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400 font-sans">أجر الشفت المسائي:</span>
                                  <span>+{formatIQD(activePayrollDetail.shiftsEveningPay)}</span>
                                </div>
                              )}
                              {activePayrollDetail.shiftsMiddlePay > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400 font-sans">أجر الشفت الوسطي:</span>
                                  <span>+{formatIQD(activePayrollDetail.shiftsMiddlePay)}</span>
                                </div>
                              )}
                              {activePayrollDetail.shiftsFull24Pay > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400 font-sans">أجر شفت 24 ساعة الموحد:</span>
                                  <span>+{formatIQD(activePayrollDetail.shiftsFull24Pay)}</span>
                                </div>
                              )}
                              {activePayrollDetail.shiftsHalf12Pay > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400 font-sans">أجر شفت 12 ساعة الموحد:</span>
                                  <span>+{formatIQD(activePayrollDetail.shiftsHalf12Pay)}</span>
                                </div>
                              )}
                              {activePayrollDetail.shiftsKhafarPay > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400 font-sans">مخصص شفت الخفارة:</span>
                                  <span>+{formatIQD(activePayrollDetail.shiftsKhafarPay)}</span>
                                </div>
                              )}
                              {activePayrollDetail.calloutsPay > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400 font-sans">مستحق استدعاء طافئ ومباشر:</span>
                                  <span>+{formatIQD(activePayrollDetail.calloutsPay)}</span>
                                </div>
                              )}
                              {activePayrollDetail.allowanceDangerVal > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400 font-sans font-semibold">مخصصات خطورة طبية:</span>
                                  <span>+{formatIQD(activePayrollDetail.allowanceDangerVal)}</span>
                                </div>
                              )}
                              {activePayrollDetail.allowanceMarriageVal > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400 font-sans">الزوجية الاجتماعية (مستحق):</span>
                                  <span>+{formatIQD(activePayrollDetail.allowanceMarriageVal)}</span>
                                </div>
                              )}
                              {activePayrollDetail.allowanceChildrenVal > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400 font-sans">مخصصات الأطفال ({activeEmployeeSnapshot?.allowanceChildren ?? 0} طفل):</span>
                                  <span>+{formatIQD(activePayrollDetail.allowanceChildrenVal)}</span>
                                </div>
                              )}
                              {activePayrollDetail.allowanceDegreeVal > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400 font-sans">خطورة الشهادة الأكاديمية:</span>
                                  <span>+{formatIQD(activePayrollDetail.allowanceDegreeVal)}</span>
                                </div>
                              )}
                              {activePayrollDetail.allowanceExtraDaysVal > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400 font-sans">أيام إضافية خارج الدوام ({activeEmployeeSnapshot?.allowanceExtraDays ?? 0} يوم):</span>
                                  <span>+{formatIQD(activePayrollDetail.allowanceExtraDaysVal)}</span>
                                </div>
                              )}
                              {activePayrollDetail.allowanceExtraHoursVal > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400 font-sans">ساعات عمل إضافية ({activeEmployeeSnapshot?.allowanceExtraHours ?? 0} ساعة):</span>
                                  <span>+{formatIQD(activePayrollDetail.allowanceExtraHoursVal)}</span>
                                </div>
                              )}
                              {activePayrollDetail.allowanceGeneralVal > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400 font-sans">إضافات تشجيعية وعامة:</span>
                                  <span>+{formatIQD(activePayrollDetail.allowanceGeneralVal)}</span>
                                </div>
                              )}
                              {activePayrollDetail.allowanceEsnadVal > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400 font-sans">مخصصات الإسناد:</span>
                                  <span>+{formatIQD(activePayrollDetail.allowanceEsnadVal)}</span>
                                </div>
                              )}
                              {activePayrollDetail.previousMonthAddVal > 0 && (
                                <div className="flex justify-between text-indigo-300">
                                  <span className="text-indigo-400 font-sans">تراكمات وفضلات شهر وراد:</span>
                                  <span>+{formatIQD(activePayrollDetail.previousMonthAddVal)}</span>
                                </div>
                              )}

                              {/* Custom Allowances display */}
                              {activePayrollDetail.allowanceCustom1Val > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400 font-sans">{getFieldLabel('allowanceCustom1')}:</span>
                                  <span>+{formatIQD(activePayrollDetail.allowanceCustom1Val)}</span>
                                </div>
                              )}
                              {activePayrollDetail.allowanceCustom2Val > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400 font-sans">{getFieldLabel('allowanceCustom2')}:</span>
                                  <span>+{formatIQD(activePayrollDetail.allowanceCustom2Val)}</span>
                                </div>
                              )}
                              {activePayrollDetail.allowanceCustom3Val > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400 font-sans">{getFieldLabel('allowanceCustom3')}:</span>
                                  <span>+{formatIQD(activePayrollDetail.allowanceCustom3Val)}</span>
                                </div>
                              )}
                              {activePayrollDetail.allowanceCustom4Val > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400 font-sans">{getFieldLabel('allowanceCustom4')}:</span>
                                  <span>+{formatIQD(activePayrollDetail.allowanceCustom4Val)}</span>
                                </div>
                              )}
                              {activePayrollDetail.allowanceCustom5Val > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400 font-sans">{getFieldLabel('allowanceCustom5')}:</span>
                                  <span>+{formatIQD(activePayrollDetail.allowanceCustom5Val)}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Deductions side snap */}
                  <div className="space-y-3 bg-red-500/5 border border-red-500/10 p-4 rounded-xl">
                    <h4 className="text-xs font-bold text-red-400 border-b border-red-500/10 pb-1.5 flex justify-between">
                      <span>الاستقطاعات والدواعي والخصم (-)</span>
                      <span>{formatIQD(activePayrollDetail.totalDeductions)}</span>
                    </h4>

                    <div className="space-y-1.5 text-slate-300 font-mono">
                      {activePayrollDetail.deductionDaysVal > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-sans">خصومات أيام غياب ({activeEmployeeSnapshot?.deductionDays ?? 0} يوم):</span>
                          <span>-{formatIQD(activePayrollDetail.deductionDaysVal)}</span>
                        </div>
                      )}
                      {activePayrollDetail.deductionHoursVal > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-sans">خصومات ساعات غياب وتأخر ({activeEmployeeSnapshot?.deductionHours ?? 0} ساعة):</span>
                          <span>-{formatIQD(activePayrollDetail.deductionHoursVal)}</span>
                        </div>
                      )}
                      {activePayrollDetail.deductionPenaltiesVal > 0 && (
                        <div className="flex justify-between font-bold text-amber-400">
                          <span className="text-slate-450 font-sans text-amber-300">غرامات وعقوبات تأديبية:</span>
                          <span>-{formatIQD(activePayrollDetail.deductionPenaltiesVal)}</span>
                        </div>
                      )}
                      {activePayrollDetail.deductionPenaltyCustom1Val > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-450 font-sans text-stone-300">{getFieldLabel('deductionPenaltyCustom1')}:</span>
                          <span>-{formatIQD(activePayrollDetail.deductionPenaltyCustom1Val)}</span>
                        </div>
                      )}
                      {activePayrollDetail.deductionPenaltyCustom2Val > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-450 font-sans text-stone-300">{getFieldLabel('deductionPenaltyCustom2')}:</span>
                          <span>-{formatIQD(activePayrollDetail.deductionPenaltyCustom2Val)}</span>
                        </div>
                      )}
                      {activePayrollDetail.deductionPenaltyCustom3Val > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-450 font-sans text-stone-300">{getFieldLabel('deductionPenaltyCustom3')}:</span>
                          <span>-{formatIQD(activePayrollDetail.deductionPenaltyCustom3Val)}</span>
                        </div>
                      )}
                      {activePayrollDetail.deductionPenaltyCustom4Val > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-450 font-sans text-stone-300">{getFieldLabel('deductionPenaltyCustom4')}:</span>
                          <span>-{formatIQD(activePayrollDetail.deductionPenaltyCustom4Val)}</span>
                        </div>
                      )}
                      {activePayrollDetail.deductionPenaltyCustom5Val > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-450 font-sans text-stone-300">{getFieldLabel('deductionPenaltyCustom5')}:</span>
                          <span>-{formatIQD(activePayrollDetail.deductionPenaltyCustom5Val)}</span>
                        </div>
                      )}
                      {activePayrollDetail.deductionOtherVal > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-sans">استقطاعات عينية أخرى:</span>
                          <span>-{formatIQD(activePayrollDetail.deductionOtherVal)}</span>
                        </div>
                      )}
                      {activePayrollDetail.previousMonthSubVal > 0 && (
                        <div className="flex justify-between text-amber-500">
                          <span className="text-amber-405 font-sans">ديون مسترجعة للشهر الفائت:</span>
                          <span>-{formatIQD(activePayrollDetail.previousMonthSubVal)}</span>
                        </div>
                      )}
                      {(activePayrollDetail.socialSecurityVal || 0) > 0 && (
                        <div className="flex justify-between text-emerald-400 font-bold border-t border-emerald-500/20 pt-1.5 mt-1">
                          <span className="font-sans flex items-center gap-1">
                            🛡️ خصم الضمان الاجتماعي (5% من الراتب المستحق):
                          </span>
                          <span>-{formatIQD(activePayrollDetail.socialSecurityVal || 0)}</span>
                        </div>
                      )}

                      {/* Fallback if no deductions */}
                      {activePayrollDetail.totalDeductions === 0 && (
                        <div className="text-slate-500 text-xs py-10 text-center font-sans">
                          لا توجد استقطاعات أو غيابات مقيدة على المنتسب هذا الشهر!
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Main calculation equation */}
                <div className="p-4 bg-slate-900 border-2 border-emerald-500/60 rounded-xl flex items-center justify-between text-white font-bold text-xs font-mono shadow-md">
                  <div className="space-y-1 text-right font-sans">
                    <span className="text-sm font-black text-white block">صافي الراتب المستحق للصرف النهائي</span>
                    <span className="text-xs text-emerald-300 block font-bold">المعادلة: (مجموع الاستحقاقات - مجموع الاستقطاعات)</span>
                  </div>
                  <div className="text-lg sm:text-xl text-emerald-300 bg-slate-950 px-4 py-2 rounded-xl border-2 border-emerald-500 font-black tracking-tight shadow-sm">
                    {formatIQD(activePayrollDetail.netSalary)}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex flex-wrap gap-3 justify-end items-center">
                <button
                  onClick={() => {
                    setPrintMode('individual');
                    setPrintingEmployeeDetail(activePayrollDetail);
                    if (typeof window !== 'undefined' && window.self !== window.top) {
                      showToast(
                        language === 'ar'
                          ? '⚠️ لتشغيل الطباعة بنجاح، يرجى أولاً فتح التطبيق في نافذة مستقلة عبر زر (فتح في نافذة جديدة) أعلى يمين الشاشة لتجاوز حماية المتصفح.'
                          : '⚠️ To print successfully, please first open the app in a new independent tab using the (Open in New Tab) button at the top-right of your screen.',
                        'info'
                      );
                    }
                    const prevTitle = document.title;
                    setTimeout(() => {
                      try {
                        document.title = " ";
                        window.focus();
                        window.print();
                      } catch (e) {
                        console.error('Print blocked or failed:', e);
                        showToast(
                          language === 'ar'
                            ? 'فشلت الطباعة المباشرة بسبب قيود الحماية. يرجى فتح التطبيق في علامة تبويب جديدة أولاً.'
                            : 'Direct printing failed due to security/sandbox constraints. Please open the app in a new tab first.',
                          'error'
                        );
                      } finally {
                        setTimeout(() => {
                          document.title = prevTitle;
                        }, 350);
                      }
                    }, 500);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-md shadow-indigo-500/10"
                >
                  <Printer className="w-4 h-4 shrink-0 text-white" />
                  <span>سحب وطباعة كشف تفصيلي للموظف (A4)</span>
                </button>
                <button
                  onClick={() => {
                    setActivePayrollDetail(null);
                    setPrintMode('full');
                    setPrintingEmployeeDetail(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold rounded-xl cursor-pointer transition-all"
                >
                  إغلاق النافذة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>

      {/* Printable Sheet for PDF Generation (Hidden on screen, styled formally for printing) */}
      <div className="hidden print:block text-slate-900 bg-white p-6 font-sans text-right font-medium" dir="rtl" id="printable-archive-report">
        {printMode === 'individual' && printingEmployeeDetail ? (
          <div className="space-y-6">
            {/* Header Voucher */}
            <div className="border-b-4 border-double border-slate-900 pb-4 mb-4 flex justify-between items-center bg-transparent">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full border-2 border-slate-300 p-1 bg-white shadow-md flex items-center justify-center overflow-hidden shrink-0">
                  {hospitalProfile.logoUrl ? (
                    <img 
                      src={hospitalProfile.logoUrl} 
                      alt="Logo" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full rounded-full object-contain" 
                    />
                  ) : (
                    <HospitalLogo className="w-full h-full" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-950 font-sans">{hospitalProfile.nameAr}</h2>
                  <p className="text-[9px] text-slate-900 font-mono tracking-widest uppercase font-bold">{hospitalProfile.nameEn}</p>
                  <p className="text-[10px] text-slate-950 font-black">شعبة الحسابات والرواتب وكشوفات الكوادر والمنتسبين</p>
                </div>
              </div>
              <div className="text-left font-mono text-[9px] space-y-0.5 text-slate-950 font-black">
                <p>تاريخ الطباعة: {new Date().toLocaleDateString('en-US') + ' ' + new Date().toLocaleTimeString('en-US')}</p>
                <p className="text-[11px] font-black text-slate-950">الشهر المستحق: {activeMonth?.monthLabel}</p>
                <p className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border-2 border-slate-900 font-black inline-block mt-0.5">قسيمة راتب وتفاصيل أجور فردية رسمية</p>
              </div>
            </div>

            {/* Employee Information Area */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border border-slate-900 p-3 rounded-lg text-slate-950 text-[10px] bg-slate-50/50">
              <div>
                <span className="text-slate-700 font-bold block">اسم المنتسب الكامل:</span>
                <strong className="text-[11px] text-slate-950 font-black">{printingEmployeeDetail.employeeName}</strong>
              </div>
              <div>
                <span className="text-slate-700 font-bold block">القسم الفعلي بالمستشفى:</span>
                <strong className="text-[11px] text-slate-950 font-bold">{printingEmployeeDetail.departmentName}</strong>
              </div>
              <div>
                <span className="text-slate-700 font-bold block">العنوان الوظيفي والمنصب:</span>
                <strong className="text-[11px] text-slate-950 font-semibold">{printingEmployeeDetail.position}</strong>
              </div>
              <div>
                <span className="text-slate-700 font-bold block">الجنس وطبيعة العمل:</span>
                <span className="text-[10px] text-slate-900 font-black">
                  {printingEmployeeDetail.gender === 'male' ? 'ذكر' : 'أنثى'} 
                  {employeeRawSnapshot?.isManager ? ' (مخوّل / مدير)' : ' (كادر)'}
                </span>
              </div>
            </div>

            {/* Structured Table detailing base stats */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-900 border-b border-slate-400 pb-1 flex justify-between">
                <span>أولاً: بيانات العمل ومعدلات الأجر الأساسية</span>
                <span className="text-[9px] font-normal text-slate-500">حقوق وخصائص الاحتساب التلقائي</span>
              </h3>

              <table className="w-full text-right text-[10px] border border-collapse border-slate-400">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-400 font-bold">
                    <th className="p-1.5 border border-slate-400 text-right">البيان الأساسي</th>
                    <th className="p-1.5 border border-slate-400 text-center">أيام الدوام</th>
                    <th className="p-1.5 border border-slate-400 text-center">ساعات الدوام</th>
                    <th className="p-1.5 border border-slate-400 text-left">الراتب الشهري الكلي</th>
                    <th className="p-1.5 border border-slate-400 text-left">أجر اليوم المحتسب</th>
                    <th className="p-1.5 border border-slate-400 text-left">أجر الساعة المحتسب</th>
                    <th className="p-1.5 border border-slate-400 text-left bg-slate-200">الناتج الأساسي الفعلي</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-slate-900">
                    <td className="p-1.5 border border-slate-400 font-bold">بيانات حضور ومعدلات العمل</td>
                    <td className="p-1.5 border border-slate-400 text-center font-mono font-bold">
                      {employeeRawSnapshot?.workingDays !== undefined ? `${employeeRawSnapshot.workingDays} يوم` : '-'}
                    </td>
                    <td className="p-1.5 border border-slate-400 text-center font-mono font-bold text-slate-800">
                      {employeeRawSnapshot?.workingDays !== undefined ? `${employeeRawSnapshot.workingDays * 8} ساعة` : (employeeRawSnapshot?.workingHours !== undefined ? `${employeeRawSnapshot.workingHours} ساعة` : '-')}
                    </td>
                    <td className="p-1.5 border border-slate-400 text-left font-mono">{formatIQD(printingEmployeeDetail.basicSalary)}</td>
                    <td className="p-1.5 border border-slate-400 text-left font-mono">{formatIQD(printingEmployeeDetail.dayPrice)}</td>
                    <td className="p-1.5 border border-slate-400 text-left font-mono">{formatIQD(printingEmployeeDetail.hourPrice)}</td>
                    <td className="p-1.5 border border-slate-400 text-left font-mono font-black bg-slate-100">{formatIQD(printingEmployeeDetail.basicDaysPay + printingEmployeeDetail.basicHoursPay)}</td>
                  </tr>
                </tbody>
              </table>

              {/* جدول معايير الدوام والأجر الاجتماعي التفصيلي (لحل اعتراضات الموظفين) */}
              <div className="grid grid-cols-2 gap-4 text-[9.5px]">
                <div className="border border-slate-400 rounded-lg p-2.5 bg-slate-50/70">
                  <span className="font-black text-slate-800 block border-b border-slate-300 pb-1 mb-1.5">أولاً (أ): معايير الدوام والأجر الاجتماعي التمهيدية</span>
                  <table className="w-full text-right text-[9px] border-collapse">
                    <tbody>
                      <tr className="border-b border-slate-200/50">
                        <td className="py-1 text-slate-700 font-bold">عدد أيام الدوام الفعلي كلياً:</td>
                        <td className="py-1 text-left font-mono font-black text-slate-900">{employeeRawSnapshot?.workingDays !== undefined ? `${employeeRawSnapshot.workingDays} يوم` : '0 يوم'}</td>
                      </tr>
                      <tr className="border-b border-slate-200/50">
                        <td className="py-1 text-slate-700 font-bold">عدد ساعات العمل العادية:</td>
                        <td className="py-1 text-left font-mono font-black text-slate-900">
                          {employeeRawSnapshot?.workingDays !== undefined ? `${employeeRawSnapshot.workingDays * 8} ساعة` : (employeeRawSnapshot?.workingHours !== undefined ? `${employeeRawSnapshot.workingHours} ساعة` : '0 ساعة')}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200/50">
                        <td className="py-1 text-slate-700 font-bold">مخصص الزوجية الاجتماعية:</td>
                        <td className="py-1 text-left font-black text-slate-900">{employeeRawSnapshot?.allowanceMarriage ? `مستحق (${formatIQD(employeeRawSnapshot.allowanceMarriage)})` : 'غير مستحق / أعزب / 0 د.ع'}</td>
                      </tr>
                      <tr>
                        <td className="py-1 text-slate-700 font-bold">الأطفال المسجلين بالنظام:</td>
                        <td className="py-1 text-left font-mono font-black text-slate-900">{employeeRawSnapshot?.allowanceChildren !== undefined ? `${employeeRawSnapshot.allowanceChildren} أطفال` : '0 طفل'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="border border-slate-400 rounded-lg p-2.5 bg-slate-50/70">
                  <span className="font-black text-slate-800 block border-b border-slate-300 pb-1 mb-1.5">أولاً (ب): مضافات الإضافي واستقطاعات الغياب المعتمدة</span>
                  <table className="w-full text-right text-[9px] border-collapse">
                    <tbody>
                      <tr className="border-b border-slate-200/50">
                        <td className="py-1 text-slate-700 font-bold">أيام الإيجابية المضافة (الإضافي):</td>
                        <td className="py-1 text-left font-mono font-black text-emerald-800">{employeeRawSnapshot?.allowanceExtraDays ?? 0} يوم إضافي</td>
                      </tr>
                      <tr className="border-b border-slate-200/50">
                        <td className="py-1 text-slate-700 font-bold">ساعات الإضافي خارج العمل:</td>
                        <td className="py-1 text-left font-mono font-black text-emerald-800">{employeeRawSnapshot?.allowanceExtraHours ?? 0} ساعة إضافية</td>
                      </tr>
                      <tr className="border-b border-slate-200/50">
                        <td className="py-1 text-slate-700 font-bold">أيام الغياب والاستقطاع:</td>
                        <td className="py-1 text-left font-mono font-black text-red-800">{employeeRawSnapshot?.deductionDays ?? 0} يوم غياب</td>
                      </tr>
                      <tr>
                        <td className="py-1 text-slate-700 font-bold">ساعات التأخر والغرامات:</td>
                        <td className="py-1 text-left font-mono font-black text-red-800">{employeeRawSnapshot?.deductionHours ?? 0} ساعة تأخير</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Additions vs Deductions Details Block */}
              <div className="grid grid-cols-2 gap-4">
                {/* 1. Additions and Shifts */}
                <div className="space-y-3 border border-emerald-400 rounded-lg p-2.5 bg-emerald-50/10">
                  <h4 className="text-[10.5px] font-black text-emerald-800 border-b border-emerald-300 pb-1 flex justify-between">
                    <span>الاستحقاقات والمضافات الشاملة (+)</span>
                    <span className="font-mono">{formatIQD(printingEmployeeDetail.totalEarnings)}</span>
                  </h4>

                  {/* Section A: Core Work Pay */}
                  <div className="bg-white/60 p-1.5 rounded border border-slate-250 space-y-1">
                    <span className="text-[8.5px] text-teal-850 font-extrabold block border-b border-slate-200 pb-0.5">أولاً: أجور الدوام الأساسي المنجز</span>
                    <table className="w-full text-right text-[9px] border-collapse text-slate-900">
                      <tbody>
                        <tr className="border-b border-slate-100 pb-0.5">
                          <td className="py-0.5">أجر أيام حضور العمل:</td>
                          <td className="py-0.5 font-mono text-left text-slate-800 font-bold">{formatIQD(printingEmployeeDetail.basicDaysPay)}</td>
                        </tr>
                        {printingEmployeeDetail.basicHoursPay > 0 && (
                          <tr>
                            <td className="py-0.5">أجر الساعات الاعتيادية:</td>
                            <td className="py-0.5 font-mono text-left text-slate-800 font-semibold">+{formatIQD(printingEmployeeDetail.basicHoursPay)}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Section B: Allowances & Overtime */}
                  <div className="bg-white/60 p-1.5 rounded border border-slate-250 space-y-1">
                    <div className="flex justify-between text-[8.5px] text-emerald-850 font-extrabold border-b border-slate-200 pb-0.5">
                      <span>ثانياً: الإضافات والشفتات والمخصصات (+)</span>
                      <span className="font-mono font-black">{formatIQD(printingAdditionsOnlyVal)}</span>
                    </div>
                    <table className="w-full text-right text-[9px] border-collapse text-slate-900">
                      <tbody>
                        {printingAdditionsOnlyVal === 0 ? (
                          <tr>
                            <td colSpan={2} className="py-2 text-center text-slate-500 font-bold italic text-[8.5px]">
                              لا توجد مضافات أو مخصصات مسجلة لهذا الشهر (0 د.ع)
                            </td>
                          </tr>
                        ) : (
                          <>
                            {/* Shifts */}
                            {printingEmployeeDetail.shiftsMorningPay > 0 && (
                              <tr className="border-b border-emerald-100/40">
                                <td className="py-0.5">أجر الشفت الصباحي ({employeeRawSnapshot?.shiftMorning || 0} شفت):</td>
                                <td className="py-0.5 font-mono text-left text-emerald-800">+{formatIQD(printingEmployeeDetail.shiftsMorningPay)}</td>
                              </tr>
                            )}
                            {printingEmployeeDetail.shiftsEveningPay > 0 && (
                              <tr className="border-b border-emerald-100/40">
                                <td className="py-0.5">أجر الشفت المسائي ({employeeRawSnapshot?.shiftEvening || 0} شفت):</td>
                                <td className="py-0.5 font-mono text-left text-emerald-800">+{formatIQD(printingEmployeeDetail.shiftsEveningPay)}</td>
                              </tr>
                            )}
                            {printingEmployeeDetail.shiftsMiddlePay > 0 && (
                              <tr className="border-b border-emerald-100/40">
                                <td className="py-0.5">أجر الشفت الوسطي ({employeeRawSnapshot?.shiftMiddle || 0} شفت):</td>
                                <td className="py-0.5 font-mono text-left text-emerald-800">+{formatIQD(printingEmployeeDetail.shiftsMiddlePay)}</td>
                              </tr>
                            )}
                            {printingEmployeeDetail.shiftsKhafarPay > 0 && (
                              <tr className="border-b border-emerald-100/40">
                                <td className="py-0.5">أجر شفت الخفارة ({employeeRawSnapshot?.shiftKhafar || 0} شفت):</td>
                                <td className="py-0.5 font-mono text-left text-emerald-800">+{formatIQD(printingEmployeeDetail.shiftsKhafarPay)}</td>
                              </tr>
                            )}
                            {printingEmployeeDetail.shiftsFull24Pay > 0 && (
                              <tr className="border-b border-emerald-100/40">
                                <td className="py-0.5">أجر شفت 24 ساعة الموحد ({employeeRawSnapshot?.shiftFull24 || 0} شفت):</td>
                                <td className="py-0.5 font-mono text-left text-emerald-800">+{formatIQD(printingEmployeeDetail.shiftsFull24Pay)}</td>
                              </tr>
                            )}
                            {printingEmployeeDetail.shiftsHalf12Pay > 0 && (
                              <tr className="border-b border-emerald-100/40">
                                <td className="py-0.5">أجر شفت 12 ساعة الموحد ({employeeRawSnapshot?.shiftHalf12 || 0} شفت):</td>
                                <td className="py-0.5 font-mono text-left text-emerald-800">+{formatIQD(printingEmployeeDetail.shiftsHalf12Pay)}</td>
                              </tr>
                            )}
                            {printingEmployeeDetail.calloutsPay > 0 && (
                              <tr className="border-b border-emerald-100/40">
                                <td className="py-0.5">أجور الاستدعاء الطارئ ({employeeRawSnapshot?.callouts || 0} يوم):</td>
                                <td className="py-0.5 font-mono text-left text-emerald-800">+{formatIQD(printingEmployeeDetail.calloutsPay)}</td>
                              </tr>
                            )}

                            {/* Overtime Days/Hours */}
                            {printingEmployeeDetail.allowanceExtraDaysVal > 0 && (
                              <tr className="border-b border-emerald-100/40">
                                <td className="py-0.5">أيام إضافية خارج العمل ({employeeRawSnapshot?.allowanceExtraDays || 0} يوم):</td>
                                <td className="py-0.5 font-mono text-left text-emerald-800">+{formatIQD(printingEmployeeDetail.allowanceExtraDaysVal)}</td>
                              </tr>
                            )}
                            {printingEmployeeDetail.allowanceExtraHoursVal > 0 && (
                              <tr className="border-b border-emerald-100/40">
                                <td className="py-0.5">ساعات إضافية خارج العمل ({employeeRawSnapshot?.allowanceExtraHours || 0} ساعة):</td>
                                <td className="py-0.5 font-mono text-left text-emerald-800">+{formatIQD(printingEmployeeDetail.allowanceExtraHoursVal)}</td>
                              </tr>
                            )}

                            {/* Allowances */}
                            {printingEmployeeDetail.allowanceDangerVal > 0 && (
                              <tr className="border-b border-emerald-100/40">
                                <td className="py-0.5">مخصص خطورة طبية:</td>
                                <td className="py-0.5 font-mono text-left text-emerald-800">+{formatIQD(printingEmployeeDetail.allowanceDangerVal)}</td>
                              </tr>
                            )}
                            {printingEmployeeDetail.allowanceMarriageVal > 0 && (
                              <tr className="border-b border-emerald-100/40">
                                <td className="py-0.5">الزوجية الاجتماعية (مستحق):</td>
                                <td className="py-0.5 font-mono text-left text-emerald-800">+{formatIQD(printingEmployeeDetail.allowanceMarriageVal)}</td>
                              </tr>
                            )}
                            {printingEmployeeDetail.allowanceChildrenVal > 0 && (
                              <tr className="border-b border-emerald-100/40">
                                <td className="py-0.5">مخصصات الأبناء والأطفال ({employeeRawSnapshot?.allowanceChildren ?? 0} طفل):</td>
                                <td className="py-0.5 font-mono text-left text-emerald-800">+{formatIQD(printingEmployeeDetail.allowanceChildrenVal)}</td>
                              </tr>
                            )}
                            {printingEmployeeDetail.allowanceDegreeVal > 0 && (
                              <tr className="border-b border-emerald-100/40">
                                <td className="py-0.5">مخصص شهادة أكاديمية:</td>
                                <td className="py-0.5 font-mono text-left text-emerald-800">+{formatIQD(printingEmployeeDetail.allowanceDegreeVal)}</td>
                              </tr>
                            )}
                            {printingEmployeeDetail.allowanceEsnadVal > 0 && (
                              <tr className="border-b border-emerald-100/40">
                                <td className="py-0.5">مخصص إسناد وظيفي:</td>
                                <td className="py-0.5 font-mono text-left text-emerald-800">+{formatIQD(printingEmployeeDetail.allowanceEsnadVal)}</td>
                              </tr>
                            )}
                            {printingEmployeeDetail.allowanceGeneralVal > 0 && (
                              <tr className="border-b border-emerald-100/40">
                                <td className="py-0.5">إضافات تشجيعية وعامة:</td>
                                <td className="py-0.5 font-mono text-left text-emerald-800">+{formatIQD(printingEmployeeDetail.allowanceGeneralVal)}</td>
                              </tr>
                            )}
                            {printingEmployeeDetail.previousMonthAddVal > 0 && (
                              <tr className="border-b border-emerald-100/40">
                                <td className="py-0.5">تراكمات وأرصدة سابقة مستحقة:</td>
                                <td className="py-0.5 font-mono text-left text-indigo-900 font-bold">+{formatIQD(printingEmployeeDetail.previousMonthAddVal)}</td>
                              </tr>
                            )}

                            {/* Custom Allowances */}
                            {printingEmployeeDetail.allowanceCustom1Val > 0 && (
                              <tr className="border-b border-emerald-100/40">
                                <td className="py-0.5">{getFieldLabel('allowanceCustom1')}:</td>
                                <td className="py-0.5 font-mono text-left text-emerald-800">+{formatIQD(printingEmployeeDetail.allowanceCustom1Val)}</td>
                              </tr>
                            )}
                            {printingEmployeeDetail.allowanceCustom2Val > 0 && (
                              <tr className="border-b border-emerald-100/40">
                                <td className="py-0.5">{getFieldLabel('allowanceCustom2')}:</td>
                                <td className="py-0.5 font-mono text-left text-emerald-800">+{formatIQD(printingEmployeeDetail.allowanceCustom2Val)}</td>
                              </tr>
                            )}
                            {printingEmployeeDetail.allowanceCustom3Val > 0 && (
                              <tr className="border-b border-emerald-100/40">
                                <td className="py-0.5">{getFieldLabel('allowanceCustom3')}:</td>
                                <td className="py-0.5 font-mono text-left text-emerald-800">+{formatIQD(printingEmployeeDetail.allowanceCustom3Val)}</td>
                              </tr>
                            )}
                            {printingEmployeeDetail.allowanceCustom4Val > 0 && (
                              <tr className="border-b border-emerald-100/40">
                                <td className="py-0.5">{getFieldLabel('allowanceCustom4')}:</td>
                                <td className="py-0.5 font-mono text-left text-emerald-800">+{formatIQD(printingEmployeeDetail.allowanceCustom4Val)}</td>
                              </tr>
                            )}
                            {printingEmployeeDetail.allowanceCustom5Val > 0 && (
                              <tr className="border-b border-emerald-100/40">
                                <td className="py-0.5">{getFieldLabel('allowanceCustom5')}:</td>
                                <td className="py-0.5 font-mono text-left text-emerald-800">+{formatIQD(printingEmployeeDetail.allowanceCustom5Val)}</td>
                              </tr>
                            )}
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Deductions and Penalties */}
                <div className="space-y-2 border border-red-400 rounded-lg p-2.5 bg-red-50/10">
                  <h4 className="text-[10.5px] font-black text-red-800 border-b border-red-300 pb-1 flex justify-between">
                    <span>ثالثاً: الخصومات والاستقطاعات والغياب (-)</span>
                    <span className="font-mono">{formatIQD(printingEmployeeDetail.totalDeductions)}</span>
                  </h4>
                  <table className="w-full text-right text-[9px] border-collapse text-slate-900">
                    <tbody>
                      {printingEmployeeDetail.deductionDaysVal > 0 && (
                        <tr className="border-b border-red-200/50">
                          <td className="py-1">استقطاع أيام الغياب ({employeeRawSnapshot?.deductionDays || 0} يوم):</td>
                          <td className="py-1 font-mono text-left text-red-900 font-bold">-{formatIQD(printingEmployeeDetail.deductionDaysVal)}</td>
                        </tr>
                      )}
                      {printingEmployeeDetail.deductionHoursVal > 0 && (
                        <tr className="border-b border-red-200/50">
                          <td className="py-1">استقطاع ساعات الغياب والتأخر ({employeeRawSnapshot?.deductionHours || 0} ساعة):</td>
                          <td className="py-1 font-mono text-left text-red-900 font-bold">-{formatIQD(printingEmployeeDetail.deductionHoursVal)}</td>
                        </tr>
                      )}
                      {printingEmployeeDetail.deductionPenaltiesVal > 0 && (
                        <tr className="border-b border-red-200/50">
                          <td className="py-1">جزاءات وعقوبات تأديبية مالية:</td>
                          <td className="py-1 font-mono text-left text-red-900">-{formatIQD(printingEmployeeDetail.deductionPenaltiesVal)}</td>
                        </tr>
                      )}
                      {printingEmployeeDetail.deductionOtherVal > 0 && (
                        <tr className="border-b border-red-200/50">
                          <td className="py-1">استقطاعات أخرى أو سلف إدارية:</td>
                          <td className="py-1 font-mono text-left text-red-900">-{formatIQD(printingEmployeeDetail.deductionOtherVal)}</td>
                        </tr>
                      )}
                      {printingEmployeeDetail.previousMonthSubVal > 0 && (
                        <tr className="border-b border-red-200/50">
                          <td className="py-1">مديونية سابقة مسترجعة متبقية:</td>
                          <td className="py-1 font-mono text-left text-red-950 font-bold">-{formatIQD(printingEmployeeDetail.previousMonthSubVal)}</td>
                        </tr>
                      )}

                      {/* Custom Penalties */}
                      {printingEmployeeDetail.deductionPenaltyCustom1Val > 0 && (
                        <tr className="border-b border-red-200/50">
                          <td className="py-1">{getFieldLabel('deductionPenaltyCustom1')}:</td>
                          <td className="py-1 font-mono text-left text-red-900">-{formatIQD(printingEmployeeDetail.deductionPenaltyCustom1Val)}</td>
                        </tr>
                      )}
                      {printingEmployeeDetail.deductionPenaltyCustom2Val > 0 && (
                        <tr className="border-b border-red-200/50">
                          <td className="py-1">{getFieldLabel('deductionPenaltyCustom2')}:</td>
                          <td className="py-1 font-mono text-left text-red-900">-{formatIQD(printingEmployeeDetail.deductionPenaltyCustom2Val)}</td>
                        </tr>
                      )}
                      {printingEmployeeDetail.deductionPenaltyCustom3Val > 0 && (
                        <tr className="border-b border-red-200/50">
                          <td className="py-1">{getFieldLabel('deductionPenaltyCustom3')}:</td>
                          <td className="py-1 font-mono text-left text-red-900">-{formatIQD(printingEmployeeDetail.deductionPenaltyCustom3Val)}</td>
                        </tr>
                      )}
                      {printingEmployeeDetail.deductionPenaltyCustom4Val > 0 && (
                        <tr className="border-b border-red-200/50">
                          <td className="py-1">{getFieldLabel('deductionPenaltyCustom4')}:</td>
                          <td className="py-1 font-mono text-left text-red-900">-{formatIQD(printingEmployeeDetail.deductionPenaltyCustom4Val)}</td>
                        </tr>
                      )}
                      {printingEmployeeDetail.deductionPenaltyCustom5Val > 0 && (
                        <tr className="border-b border-red-200/50">
                          <td className="py-1">{getFieldLabel('deductionPenaltyCustom5')}:</td>
                          <td className="py-1 font-mono text-left text-red-900">-{formatIQD(printingEmployeeDetail.deductionPenaltyCustom5Val)}</td>
                        </tr>
                      )}
                      {(printingEmployeeDetail.socialSecurityVal || 0) > 0 && (
                        <tr className="border-b border-emerald-300 bg-emerald-50/50">
                          <td className="py-1 font-bold text-emerald-900">🛡️ خصم الضمان الاجتماعي (5% من الراتب المستحق):</td>
                          <td className="py-1 font-mono text-left text-emerald-900 font-bold">-{formatIQD(printingEmployeeDetail.socialSecurityVal || 0)}</td>
                        </tr>
                      )}

                      {/* Safety placeholder if 0 */}
                      {printingEmployeeDetail.totalDeductions === 0 && (
                        <tr>
                          <td colSpan={2} className="py-6 text-center text-slate-400">لا توجد غيابات أو خصومات مسجلة هذا الشهر</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Main Net payout calculation */}
            <div className="p-3.5 bg-emerald-50 border-2 border-emerald-600 text-slate-950 rounded-xl flex items-center justify-between shadow-sm my-2">
              <div className="text-right space-y-1">
                <span className="text-sm sm:text-base font-black text-slate-950 block">صافي الراتب المستحق للصرف والقبض النهائي</span>
                <span className="text-xs text-emerald-900 block font-bold">(أصل الاستحقاقات الشاملة) مطروحاً منها (كامل الاستقطاعات والغياب)</span>
              </div>
              <div className="text-right font-mono">
                <span className="text-lg sm:text-xl font-black text-emerald-950 bg-emerald-200/90 px-4 py-1.5 rounded-lg border-2 border-emerald-600 block shadow-sm">
                  {formatIQD(printingEmployeeDetail.netSalary)}
                </span>
              </div>
            </div>

            {/* Stamp and signature space */}
            <div className="grid grid-cols-3 gap-6 pt-10 text-center text-slate-900 text-[10px] font-sans">
              <div className="space-y-12">
                <p className="font-bold">مستلم الراتب (المنتسب)</p>
                <div className="border-t border-slate-400 w-32 mx-auto pt-1 text-[8.5px] text-slate-500">
                  التوقيع / بصمة الإبهام
                </div>
              </div>
              <div className="space-y-12">
                <p className="font-bold">دقق من قبل شعبة الحسابات</p>
                <div className="border-t border-slate-400 w-32 mx-auto pt-1 text-[8.5px] text-slate-500">
                  توقيع محاسب التدقيق
                </div>
              </div>
              <div className="space-y-12">
                <p className="font-bold">المصادقة والختم الرسمي لمستشفى الفرح</p>
                <div className="border-t border-slate-400 w-32 mx-auto pt-1 text-[8.5px] text-slate-500">
                  توقيع وختم رئيس الإدارة المالية
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-dashed border-slate-300 text-center text-[8px] text-slate-500">
              حقوق كشف الراتب التفصيلي الموحد محفوظة | مستشفى الفرح الأهلي
            </div>
          </div>
        ) : (
          <>
            <div className="border-b-2 border-slate-900 pb-5 mb-4 flex justify-between items-center bg-transparent">
              <div className="flex items-center gap-4">
                {/* Elegant Hospital Crest/Medical Seal Emblem */}
                <div className="w-16 h-16 rounded-full border-2 border-slate-800 p-1 bg-white shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                  {hospitalProfile.logoUrl ? (
                    <img 
                      src={hospitalProfile.logoUrl} 
                      alt="Logo" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full rounded-full object-contain" 
                    />
                  ) : (
                    <HospitalLogo className="w-full h-full" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-950 font-sans">{hospitalProfile.nameAr}</h2>
                  <p className="text-[10px] text-slate-900 font-mono tracking-widest uppercase font-bold">{hospitalProfile.nameEn}</p>
                  <p className="text-[11px] text-slate-950 mt-0.5 font-black border-t border-slate-400 pt-0.5">قسم الشؤون المالية والحسابات - سجل وقوائم استلام الرواتب</p>
                </div>
              </div>
              <div className="text-left font-mono text-[10px] space-y-1 text-slate-950 font-black border-r-2 border-slate-900 pr-4">
                <p>تاريخ الاستخراج الموثق: {new Date().toLocaleDateString('en-US')}</p>
                <p>الشهر المالي المؤرشف: {activeMonth?.monthLabel || activeMonth?.monthId}</p>
                <p>رقم السجل المالي: ARCH-{activeMonth?.monthId || '2026'}</p>
              </div>
            </div>
            
            <div className="text-center my-5">
              <h1 className="text-2xl font-black text-slate-950 underline underline-offset-4">
                {selectedDeptId === 'fixed_departments'
                  ? 'كشف حساب وسجل رواتب الأقسام ذات الرواتب القطعية المعتمد (الصيانة - الأشعة - الإسعاف - الأمنية)'
                  : 'كتاب وسجل استلام الرواتب الشهري المعتمد (كشف الاستلام المالي الرسمي)'}
              </h1>
              <p className="text-[11px] text-slate-950 font-black mt-2 bg-slate-100 border-2 border-slate-800 px-4 py-1 rounded-full inline-block shadow-sm">
                القسم المستهدف: {
                  selectedDeptId === 'all'
                    ? 'كافة الأقسام والشُعب (يشمل الأمنية، الصيانة، الإسعاف، الأشعة، والكوادر الطبية والخدمية)'
                    : selectedDeptId === 'fixed_departments'
                    ? 'الأقسام ذات الرواتب القطعية المعتمدة (قسم الصيانة، قسم الأشعة والتصوير الطبي، قسم الإسعاف، قسم الأمنية والحراسات)'
                    : deptsPayrollSummary.find(d => d.id === selectedDeptId || d.catKey === selectedDeptId)?.name || selectedDeptId
                }
              </p>
            </div>

            {/* Financial Audit Summary Box */}
            <div className="grid grid-cols-4 gap-3 border-2 border-slate-900 p-3 rounded-xl mb-6 text-[10px] bg-slate-50 shadow-sm">
              <div className="border-l border-slate-300 pl-2">
                <span className="text-slate-900 font-black block">إجمالي الراتب الأساسي:</span>
                <strong className="text-xs text-black font-black">{activeMonth ? formatIQD(reportTotals.basic) : '-'}</strong>
              </div>
              <div className="border-l border-slate-300 pl-2">
                <span className="text-slate-900 font-black block">مجموع المستحقات والإضافات:</span>
                <strong className="text-xs text-emerald-950 font-black">+{activeMonth ? formatIQD(reportTotals.earn) : '-'}</strong>
              </div>
              <div className="border-l border-slate-300 pl-2">
                <span className="text-slate-900 font-black block">مجموع الخصوم والاستقطاعات:</span>
                <strong className="text-xs text-amber-950 font-black">-{activeMonth ? formatIQD(reportTotals.ded) : '-'}</strong>
              </div>
              <div>
                <span className="text-slate-900 font-black block">صافي الرواتب المصروفة للتوزيع:</span>
                <strong className="text-sm text-black font-black underline">{activeMonth ? formatIQD(reportTotals.net) : '-'}</strong>
              </div>
            </div>

            {/* Receipt Book Payloads - Grouped by Department when 'all' or 'fixed_departments' is selected */}
            {selectedDeptId === 'fixed_departments' ? (
              <div className="border-2 border-slate-900 rounded-lg overflow-hidden mb-6 page-break-inside-avoid shadow-sm">
                <div className="bg-slate-900 text-white px-3 py-2 font-black text-xs flex justify-between items-center">
                  <span className="flex items-center gap-1.5">
                    <span>⚡</span>
                    <span>جدول كشف حساب وحافظة رواتب الأقسام ذات الرواتب القطعية المعتمد</span>
                  </span>
                  <span className="font-mono text-[11px] bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
                    إجمالي رواتب الأقسام الأربعة: {formatIQD(fixedSalaryStats.netSum)}
                  </span>
                </div>
                <table className="w-full text-right text-[10.5px] border-collapse printable-table">
                  <thead>
                    <tr className="bg-slate-200 border-b-2 border-slate-400 font-black text-slate-950">
                      <th className="p-2 border border-slate-400 text-center w-8">ت</th>
                      <th className="p-2 border border-slate-400">اسم القسم القطعي المعتمد</th>
                      <th className="p-2 border border-slate-400 text-center w-28">طبيعة الصرف</th>
                      <th className="p-2 border border-slate-400 text-left">مجموع المستحقات والإضافات</th>
                      <th className="p-2 border border-slate-400 text-left">مجموع الاستقطاعات والخصوم</th>
                      <th className="p-2 border border-slate-400 text-left font-black bg-slate-300 text-black">صافي الراتب المصروف للقسم</th>
                      <th className="p-2 border border-slate-400 text-center w-32">التوقيع / البصمة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fixedDeptSummaries.map((dept, idx) => (
                      <tr key={dept.catKey} className="border-b border-slate-300 font-bold text-slate-950">
                        <td className="p-2 border border-slate-300 font-mono text-center font-black">{idx + 1}</td>
                        <td className="p-2 border border-slate-300 font-black text-xs">
                          {dept.name}
                          {dept.employeesSnapshotCount > 0 && (
                            <span className="text-[9.5px] font-normal text-slate-700 mr-2 font-mono">
                              ({dept.employeesSnapshotCount} منتسب)
                            </span>
                          )}
                        </td>
                        <td className="p-2 border border-slate-300 text-center font-bold text-[10px]">مقطوع / راتب قطعي</td>
                        <td className="p-2 border border-slate-300 font-mono text-left text-emerald-950">+{formatIQD(dept.totalEarningsSum)}</td>
                        <td className="p-2 border border-slate-300 font-mono text-left text-amber-950">-{formatIQD(dept.totalDeductionsSum)}</td>
                        <td className="p-2 border border-slate-300 font-mono text-left font-black bg-slate-100 text-black text-xs">{formatIQD(dept.totalNetSalarySum)}</td>
                        <td className="p-2 border border-slate-300 text-center text-[9px] text-slate-700"></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-200 font-black text-[11px] border-t-2 border-slate-800">
                      <td colSpan={3} className="p-2 border border-slate-400 text-right text-black">إجمالي كافة الأقسام القطعية الأربعة:</td>
                      <td className="p-2 border border-slate-400 text-left font-mono text-emerald-950">+{formatIQD(fixedDeptSummaries.reduce((s, d) => s + d.totalEarningsSum, 0))}</td>
                      <td className="p-2 border border-slate-400 text-left font-mono text-amber-950">-{formatIQD(fixedDeptSummaries.reduce((s, d) => s + d.totalDeductionsSum, 0))}</td>
                      <td className="p-2 border border-slate-400 text-left font-mono font-black text-black bg-slate-300 underline text-xs">{formatIQD(fixedSalaryStats.netSum)}</td>
                      <td className="p-2 border border-slate-400"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : selectedDeptId === 'all' ? (
              <div className="space-y-6">
                {/* Fixed departments summary inside 'all' print view */}
                {fixedDeptSummaries.length > 0 && (
                  <div className="border-2 border-slate-800 rounded-lg overflow-hidden page-break-inside-avoid mb-4">
                    <div className="bg-slate-900 text-white px-3 py-1.5 font-black text-[11px] flex justify-between items-center">
                      <span className="flex items-center gap-1.5">
                        <span>⚡</span>
                        <span>الأقسام ذات الرواتب القطعية المعتمدة (الأشعة، الأمنية، الإسعاف، الصيانة)</span>
                      </span>
                      <span className="text-[10px] font-mono font-black">
                        إجمالي الأقسام القطعية: {formatIQD(fixedSalaryStats.netSum)}
                      </span>
                    </div>
                    <table className="w-full text-right text-[10px] border-collapse printable-table">
                      <thead>
                        <tr className="bg-slate-200 border-b border-slate-400 font-black text-slate-950">
                          <th className="p-1.5 border border-slate-400 text-center w-8">ت</th>
                          <th className="p-1.5 border border-slate-400">اسم القسم القطعي</th>
                          <th className="p-1.5 border border-slate-400 text-center">طبيعة الصرف</th>
                          <th className="p-1.5 border border-slate-400 text-left">المستحقات والإضافات</th>
                          <th className="p-1.5 border border-slate-400 text-left">الخصومات</th>
                          <th className="p-1.5 border border-slate-400 text-left font-black bg-slate-300 text-black">صافي الراتب</th>
                          <th className="p-1.5 border border-slate-400 text-center w-36">توقيع وبصمة المستلم</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fixedDeptSummaries.map((dept, idx) => (
                          <tr key={dept.catKey} className="border-b border-slate-300 font-bold text-slate-950">
                            <td className="p-1.5 border border-slate-300 font-mono text-center font-black">{idx + 1}</td>
                            <td className="p-1.5 border border-slate-300 font-black">{dept.name}</td>
                            <td className="p-1.5 border border-slate-300 text-center font-bold">راتب قطعي معتمد</td>
                            <td className="p-1.5 border border-slate-300 font-mono text-left text-emerald-950">+{formatIQD(dept.totalEarningsSum)}</td>
                            <td className="p-1.5 border border-slate-300 font-mono text-left text-amber-950">-{formatIQD(dept.totalDeductionsSum)}</td>
                            <td className="p-1.5 border border-slate-300 font-mono text-left font-black bg-slate-100 text-black">{formatIQD(dept.totalNetSalarySum)}</td>
                            <td className="p-1.5 border border-slate-300 text-center"></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {groupedPayrollsByDept.map(({ deptName, payrolls, deptNetSum, deptBasicSum, deptEarnSum, deptDedSum }) => (
                  <div key={deptName} className="border-2 border-slate-800 rounded-lg overflow-hidden page-break-inside-avoid mb-4">
                    <div className="bg-slate-200 border-b-2 border-slate-800 px-3 py-1.5 font-black text-[11px] text-slate-950 flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <span>🏢</span>
                        <span>{deptName}</span>
                        <span className="text-[9.5px] font-normal text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-400 font-mono">
                          {payrolls.length} منتسب
                        </span>
                      </span>
                      <span className="text-[10px] font-mono font-black">
                        مجموع صافي رواتب القسم: {formatIQD(deptNetSum)}
                      </span>
                    </div>

                    <table className="w-full text-right text-[10px] border-collapse printable-table">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-400">
                          <th className="p-1.5 border border-slate-400 text-center text-slate-950 font-black w-8">ت</th>
                          <th className="p-1.5 border border-slate-400 text-right text-slate-950 font-black">اسم المنتسب / الموظف</th>
                          <th className="p-1.5 border border-slate-400 text-right text-slate-950 font-black">المنصب / الصفة الوظيفية</th>
                          <th className="p-1.5 border border-slate-400 text-center text-slate-950 font-black w-14">أيام الدوام</th>
                          <th className="p-1.5 border border-slate-400 text-left text-slate-950 font-black">الراتب الأساسي</th>
                          <th className="p-1.5 border border-slate-400 text-left text-slate-950 font-black">المستحقات والإضافات</th>
                          <th className="p-1.5 border border-slate-400 text-left text-slate-950 font-black">الخصومات والاستقطاعات</th>
                          <th className="p-1.5 border border-slate-400 text-left text-slate-950 font-black">صافي الراتب المستحق</th>
                          <th className="p-1.5 border border-slate-400 text-center w-36 text-slate-950 font-black">توقيع وبصمة المستلم</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payrolls.map((p, idx) => (
                          <tr key={p.employeeId} className="border-b border-slate-300">
                            <td className="p-1.5 border border-slate-300 font-mono text-center text-black font-black">{idx + 1}</td>
                            <td className="p-1.5 border border-slate-300 font-black text-slate-950">{p.employeeName}</td>
                            <td className="p-1.5 border border-slate-300 text-slate-950 font-bold">{p.position}</td>
                            <td className="p-1.5 border border-slate-300 text-center font-mono font-bold text-slate-900">{p.workingDays || 26} يوم</td>
                            <td className="p-1.5 border border-slate-300 font-mono text-left text-black font-bold">{formatIQD(p.basicSalary)}</td>
                            <td className="p-1.5 border border-slate-300 font-mono text-left text-emerald-950 font-black">+{formatIQD(p.totalEarnings)}</td>
                            <td className="p-1.5 border border-slate-300 font-mono text-left text-amber-950 font-black">-{formatIQD(p.totalDeductions)}</td>
                            <td className="p-1.5 border border-slate-300 font-mono font-black text-left text-black bg-slate-100">{formatIQD(p.netSalary)}</td>
                            <td className="p-1 border border-slate-300 text-center">
                              <div className="border border-slate-400 rounded p-1 text-[8.5px] text-slate-800 font-bold bg-white">
                                توقيع / بصمة المستلم
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-200 border-t-2 border-slate-800 font-black text-[10px]">
                          <td colSpan={4} className="p-1.5 border border-slate-400 text-right text-black font-black">
                            مجموع الإجمالي لقسم ({deptName}):
                          </td>
                          <td className="p-1.5 border border-slate-400 text-left font-mono">{formatIQD(deptBasicSum)}</td>
                          <td className="p-1.5 border border-slate-400 text-left font-mono text-emerald-950">+{formatIQD(deptEarnSum)}</td>
                          <td className="p-1.5 border border-slate-400 text-left font-mono text-amber-950">-{formatIQD(deptDedSum)}</td>
                          <td className="p-1.5 border border-slate-400 text-left font-mono text-black underline bg-slate-300">{formatIQD(deptNetSum)}</td>
                          <td className="p-1.5 border border-slate-400 text-center text-[8.5px]">اعتماد رئيس القسم</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ))}
              </div>
            ) : (
              /* Single Selected Department Receipt Table */
              <table className="w-full text-right text-[10px] border border-collapse border-slate-400 printable-table">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-400">
                    <th className="p-2 border border-slate-400 text-center text-slate-950 font-black w-8">ت</th>
                    <th className="p-2 border border-slate-400 text-right text-slate-950 font-black">اسم المنتسب / الموظف</th>
                    <th className="p-2 border border-slate-400 text-right text-slate-950 font-black">القسم</th>
                    <th className="p-2 border border-slate-400 text-right text-slate-950 font-black">المنصب / الصفة الوظيفية</th>
                    <th className="p-2 border border-slate-400 text-center text-slate-950 font-black w-14">أيام الدوام</th>
                    <th className="p-2 border border-slate-400 text-left text-slate-950 font-black">الراتب الأساسي</th>
                    <th className="p-2 border border-slate-400 text-left text-slate-950 font-black">المستحقات والإضافات</th>
                    <th className="p-2 border border-slate-400 text-left text-slate-950 font-black">الخصومات والاستقطاعات</th>
                    <th className="p-2 border border-slate-400 text-left text-slate-950 font-black">صافي الراتب المستحق</th>
                    <th className="p-2 border border-slate-400 text-center w-36 text-slate-950 font-black">توقيع وبصمة المستلم</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayrolls.length > 0 ? (
                    filteredPayrolls.map((p, index) => (
                      <tr key={p.employeeId} className="border-b border-slate-300">
                        <td className="p-2 border border-slate-300 font-mono text-center text-black font-black">{index + 1}</td>
                        <td className="p-2 border border-slate-300 font-black text-slate-950">{p.employeeName}</td>
                        <td className="p-2 border border-slate-300 text-slate-950 font-bold">{p.departmentName}</td>
                        <td className="p-2 border border-slate-300 text-slate-950 font-bold">{p.position}</td>
                        <td className="p-2 border border-slate-300 text-center font-mono font-bold text-slate-900">{p.workingDays || 26} يوم</td>
                        <td className="p-2 border border-slate-300 font-mono text-left text-black font-bold">{formatIQD(p.basicSalary)}</td>
                        <td className="p-2 border border-slate-300 font-mono text-left text-emerald-950 font-black">+{formatIQD(p.totalEarnings)}</td>
                        <td className="p-2 border border-slate-300 font-mono text-left text-amber-950 font-black">-{formatIQD(p.totalDeductions)}</td>
                        <td className="p-2 border border-slate-300 font-mono font-black text-left text-black bg-slate-100">{formatIQD(p.netSalary)}</td>
                        <td className="p-1 border border-slate-300 text-center">
                          <div className="border border-slate-400 rounded p-1 text-[8.5px] text-slate-800 font-bold bg-white">
                            توقيع / بصمة المستلم
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : selectedDeptSummary ? (
                    <tr className="border-b border-slate-300 font-bold text-slate-950">
                      <td className="p-2 border border-slate-300 font-mono text-center font-black">1</td>
                      <td className="p-2 border border-slate-300 font-black text-xs">
                        {selectedDeptSummary.name}
                        {selectedDeptSummary.employeesSnapshotCount > 0 && (
                          <span className="text-[9.5px] font-normal text-slate-700 mr-2 font-mono">
                            ({selectedDeptSummary.employeesSnapshotCount} منتسب)
                          </span>
                        )}
                      </td>
                      <td className="p-2 border border-slate-300 text-slate-950 font-bold">{selectedDeptSummary.name}</td>
                      <td className="p-2 border border-slate-300 text-slate-950 font-bold">تخصيص راتب قطعي معتمد</td>
                      <td className="p-2 border border-slate-300 text-center font-mono font-bold text-slate-900">شهر كامل</td>
                      <td className="p-2 border border-slate-300 font-mono text-left text-black font-bold">0 د.ع</td>
                      <td className="p-2 border border-slate-300 font-mono text-left text-emerald-950 font-black">+{formatIQD(selectedDeptSummary.totalEarningsSum)}</td>
                      <td className="p-2 border border-slate-300 font-mono text-left text-amber-950 font-black">-{formatIQD(selectedDeptSummary.totalDeductionsSum)}</td>
                      <td className="p-2 border border-slate-300 font-mono font-black text-left text-black bg-slate-100">{formatIQD(selectedDeptSummary.totalNetSalarySum)}</td>
                      <td className="p-1 border border-slate-300 text-center">
                        <div className="border border-slate-400 rounded p-1 text-[8.5px] text-slate-800 font-bold bg-white">
                          توقيع / بصمة المستلم
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={10} className="p-4 text-center text-slate-500 font-bold">لا توجد بيانات رواتب لهذا القسم</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-200 border-t-2 border-slate-800 font-black text-[10px]">
                    <td colSpan={5} className="p-2 border border-slate-400 text-right text-black font-black">
                      الإجمالي المالي الكلي للكشف:
                    </td>
                    <td className="p-2 border border-slate-400 text-left font-mono">{formatIQD(reportTotals.basic)}</td>
                    <td className="p-2 border border-slate-400 text-left font-mono text-emerald-950">+{formatIQD(reportTotals.earn)}</td>
                    <td className="p-2 border border-slate-400 text-left font-mono text-amber-950">-{formatIQD(reportTotals.ded)}</td>
                    <td className="p-2 border border-slate-400 text-left font-mono text-black underline bg-slate-300">{formatIQD(reportTotals.net)}</td>
                    <td className="p-2 border border-slate-400 text-center text-[9px]">اعتماد الحسابات</td>
                  </tr>
                </tfoot>
              </table>
            )}

            {/* Overall Grand Total Row when grouped by department */}
            {selectedDeptId === 'all' && (
              <div className="mt-4 border-2 border-slate-900 bg-slate-200 p-3 rounded-xl flex items-center justify-between text-[11px] font-black">
                <span>الإجمالي العام لجميع كادر وموظفي المستشفى:</span>
                <span className="font-mono text-sm underline text-black">
                  صافي المستحق النهائي المصروف: {formatIQD(reportTotals.net)}
                </span>
              </div>
            )}

            {/* Official Signatures Block */}
            <div className="grid grid-cols-4 gap-4 mt-10 pt-6 border-t-2 border-slate-900 text-center text-[10px] bg-slate-50 p-4 rounded-xl">
              <div>
                <p className="font-black text-slate-950">تنظيم المحاسب المسؤول</p>
                <p className="mt-6 text-slate-400 font-mono">............................................</p>
                <p className="text-[8px] text-slate-500 mt-1">التوقيع والتاريخ</p>
              </div>
              <div>
                <p className="font-black text-slate-950">الرقابة والتدقيق المالي</p>
                <p className="mt-6 text-slate-400 font-mono">............................................</p>
                <p className="text-[8px] text-slate-500 mt-1">التوقيع والتاريخ</p>
              </div>
              <div>
                <p className="font-black text-slate-950">مدير الشؤون المالية والحسابات</p>
                <p className="mt-6 text-slate-400 font-mono">............................................</p>
                <p className="text-[8px] text-slate-500 mt-1">التوقيع والتاريخ</p>
              </div>
              <div className="border-r border-slate-400 pr-2">
                <p className="font-black text-slate-950">المصادقة: مدير المستشفى / رئيس مجلس الإدارة</p>
                <div className="w-16 h-16 border-2 border-dashed border-slate-400 rounded-full mx-auto my-1 flex items-center justify-center text-[8px] text-slate-400 font-mono">
                  ختم المستشفى
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-slate-300 text-center text-[8.5px] text-slate-600 font-bold">
              كتاب سجل استلام الرواتب موثق ومحمى رسمياً | مستشفى الفرح الأهلي - البصرة
            </div>
          </>
        )}
      </div>

      {/* Styled Print media queries for flawless document flow */}
      <style>{`
        /* PDF and Print global overrides to guarantee ultra-high legibility & prevent faded oklch/opacity issues */
        .pdf-render-mode, 
        #printable-archive-report {
          display: block !important;
          background-color: #ffffff !important;
          background-image: none !important;
          color: #000000 !important;
          opacity: 1 !important;
          visibility: visible !important;
        }

        /* Ensure 100% opacity and clear text colors on all children */
        .pdf-render-mode *, 
        #printable-archive-report * {
          opacity: 1 !important;
          text-shadow: none !important;
          box-shadow: none !important;
          visibility: visible !important;
        }

        /* Strong black text overrides for standard text elements instead of light greys/slates */
        .pdf-render-mode h1, #printable-archive-report h1,
        .pdf-render-mode h2, #printable-archive-report h2,
        .pdf-render-mode h3, #printable-archive-report h3,
        .pdf-render-mode p, #printable-archive-report p,
        .pdf-render-mode span, #printable-archive-report span,
        .pdf-render-mode strong, #printable-archive-report strong,
        .pdf-render-mode td, #printable-archive-report td {
          color: #000000 !important;
          font-weight: 700 !important; /* Bold, clear text */
        }

        /* Specific header colors & extra important titles */
        .pdf-render-mode h1, #printable-archive-report h1 {
          font-weight: 900 !important;
        }

        /* Specific overrides for color-coded columns/badges */
        .pdf-render-mode .text-emerald-900, #printable-archive-report .text-emerald-900,
        .pdf-render-mode .text-emerald-950, #printable-archive-report .text-emerald-950,
        .pdf-render-mode .text-emerald-700, #printable-archive-report .text-emerald-700 {
          color: #15803d !important; /* Strong clear green */
          font-weight: 900 !important;
        }

        .pdf-render-mode .text-amber-900, #printable-archive-report .text-amber-900,
        .pdf-render-mode .text-amber-950, #printable-archive-report .text-amber-950,
        .pdf-render-mode .text-amber-700, #printable-archive-report .text-amber-700 {
          color: #b45309 !important; /* Strong clear dark amber */
          font-weight: 900 !important;
        }

        /* Strong thick table borders */
        .pdf-render-mode table, #printable-archive-report table {
          border: 2px solid #000000 !important;
          border-collapse: collapse !important;
        }

        .pdf-render-mode th, #printable-archive-report th,
        .printable-table th {
          background-color: #1e3a8a !important; /* Solid navy header */
          color: #ffffff !important;
          font-weight: 900 !important;
          border: 1.5px solid #000000 !important;
          padding: 8px 6px !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .pdf-render-mode td, #printable-archive-report td,
        .printable-table td {
          border: 1.5px solid #000000 !important; /* Solid thick black table grid borders */
          padding: 8px 6px !important;
          color: #000000 !important;
          font-weight: 700 !important;
          vertical-align: middle !important;
        }

        .pdf-render-mode tbody tr:nth-child(even) td, 
        #printable-archive-report tbody tr:nth-child(even) td {
          background-color: #f1f5f9 !important; /* Slightly visible alternate row bg */
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0px !important; /* Completely eliminates browser printing default headers/footers contains IP address/URL */
          }
          body {
            padding: 1.2cm !important; /* Re-applies safe printing padding to prevent physical edge clipping */
            background-color: white !important;
            background-image: none !important;
            color: black !important;
          }
          html, body, #root, .min-h-screen, main, .print-area,
          .theme-dark, .theme-light, .theme-cosmic, .theme-brand, .theme-luxury {
            background: #ffffff !important;
            background-color: #ffffff !important;
            background-image: none !important;
            color: #000000 !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }
          /* Hide anything marked as no-print, layout wrappers, headers, triggers */
          header, footer, nav, aside, .no-print, button, select, input, .glass-panel, .glass-header {
            display: none !important;
          }
          #printable-archive-report {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
