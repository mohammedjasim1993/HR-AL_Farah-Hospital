import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import * as XLSX from 'xlsx';
import {
  Printer,
  Building2,
  ChevronDown,
  Check,
  Sparkles,
  FileText,
  Calendar,
  Layers,
  Sliders,
  Eye,
  Settings,
  XSquare,
  CheckSquare
} from 'lucide-react';
import { Department, Employee, CalculatedPayroll, ArchivedMonth, FieldId } from '../types';
import { calculateEmployeePayroll, FIELDS_METADATA } from '../data';
import { showToast } from '../lib/toast';
import { TRANSLATIONS, formatCurrency } from '../lib/translations';
import HospitalLogo from './HospitalLogo';

interface PayrollPrintSheetProps {
  departments: Department[];
  employees: Employee[];
  payrollList: CalculatedPayroll[];
  archive: ArchivedMonth[];
  onUpdateArchive?: (archive: ArchivedMonth[]) => void;
  timeSettings?: any;
  customFieldLabels?: Record<string, string>;
  language: 'ar' | 'en';
}

export default function PayrollPrintSheet({
  departments,
  employees,
  payrollList,
  archive = [],
  onUpdateArchive,
  timeSettings,
  customFieldLabels = {},
  language = 'ar',
}: PayrollPrintSheetProps) {
  const localProfileStr = typeof window !== 'undefined' ? localStorage.getItem('alfarrah_hospital_profile') : null;
  const hospitalProfile = localProfileStr ? JSON.parse(localProfileStr) : { nameAr: 'مستشفى الفرح الأهلي', nameEn: 'Al-Farrah Private Hospital', logo: 'HeartPulse' };

  const [selectedMonthId, setSelectedMonthId] = useState<string>('current');
  
  const monthNamesArabic = useMemo(() => [
    'كانون الثاني / يناير',
    'شباط / فبراير',
    'آذار / مارس',
    'نيسان / أبريل',
    'أيار / مايو',
    'حزيران / يونيو',
    'تموز / يوليو',
    'آب / أغسطس',
    'أيلول / سبتمبر',
    'تشرين الأول / أكتوبر',
    'تشرين الثاني / نوفمبر',
    'كانون الأول / ديسمبر',
  ], []);

  const [currentMonthName, setCurrentMonthName] = useState<string>(() => {
    const date = new Date();
    const months = [
      'كانون الثاني / يناير',
      'شباط / فبراير',
      'آذار / مارس',
      'نيسان / أبريل',
      'أيار / مايو',
      'حزيران / يونيو',
      'تموز / يوليو',
      'آب / أغسطس',
      'أيلول / سبتمبر',
      'تشرين الأول / أكتوبر',
      'تشرين الثاني / نوفمبر',
      'كانون الأول / ديسمبر',
    ];
    // Smart default: If early in the month (day <= 10), default to previous month because payroll is being processed for previous month
    const usePrev = date.getDate() <= 10;
    const prevMonthIdx = date.getMonth() === 0 ? 11 : date.getMonth() - 1;
    const prevYear = date.getMonth() === 0 ? date.getFullYear() - 1 : date.getFullYear();
    const targetIdx = usePrev ? prevMonthIdx : date.getMonth();
    const targetYear = usePrev ? prevYear : date.getFullYear();

    return `${months[targetIdx]} ${targetYear}`;
  });

  // Calculate labels for quick month selection buttons
  const { prevMonthLabel, thisMonthLabel } = useMemo(() => {
    const d = new Date();
    const curIdx = d.getMonth();
    const curYear = d.getFullYear();
    const pIdx = curIdx === 0 ? 11 : curIdx - 1;
    const pYear = curIdx === 0 ? curYear - 1 : curYear;
    return {
      prevMonthLabel: `${monthNamesArabic[pIdx]} ${pYear}`,
      thisMonthLabel: `${monthNamesArabic[curIdx]} ${curYear}`
    };
  }, [monthNamesArabic]);

  // Dynamic customization for printing options (Part 3)
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>(() => departments.map((d) => d.id));
  const [sortOrder, setSortOrder] = useState<'netSalaryDesc' | 'netSalaryAsc' | 'basicSalaryDesc' | 'default'>('netSalaryDesc');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showConfirmPdfModal, setShowConfirmPdfModal] = useState(false);
  const [pdfFilenameInput, setPdfFilenameInput] = useState('');
  
  // Columns toggle options state
  const [printCols, setPrintCols] = useState({
    dept: true,
    position: true,
    workingDays: true,
    workingHours: false,
    dayPrice: false,
    hourPrice: false,
    allowanceExtraDays: false,
    allowanceExtraHours: false,
    deductionDays: false,
    deductionHours: false,
    allowances: true,
    deductions: true,
    basicSalary: true,
    totalEarnings: false,
    shiftMorningCount: false,
    shiftMorningPay: false,
    shiftEveningCount: false,
    shiftEveningPay: false,
    shiftMiddleCount: false,
    shiftMiddlePay: false,
    shiftKhafarCount: false,
    shiftKhafarPay: false,
    shiftFull24Count: false,
    shiftFull24Pay: false,
    shiftHalf12Count: false,
    shiftHalf12Pay: false,
    callouts: false,
    calloutsPay: false,
    dailyFullPrice: false,
    dailyHalfPrice: false,
    socialSecurity: true,
    netSalary: true,
    signatureBox: true,
  });

  // Footer visual toggle options state
  const [printFooterOpts, setPrintFooterOpts] = useState({
    showFingerNote: true,
    showOfficialSignatures: true,
    showSystemSummary: true,
    denseLayout: false,
  });

  // Resolve archive snapshot
  const selectedArchiveSnap = useMemo(() => {
    if (selectedMonthId === 'current') return null;
    return archive.find((a) => a.monthId === selectedMonthId) || null;
  }, [archive, selectedMonthId]);

  // Dynamically resolve datasets based on selection
  const activeEmployees = useMemo(() => {
    if (selectedArchiveSnap) return selectedArchiveSnap.employeesSnapshot;
    return employees;
  }, [employees, selectedArchiveSnap]);

  const activeDepartments = useMemo(() => {
    if (selectedArchiveSnap) return selectedArchiveSnap.departmentsSnapshot;
    return departments;
  }, [departments, selectedArchiveSnap]);

  // Check if "workingDays" field is enabled in at least one of the selected departments
  const isWorkingDaysEnabledInSelectedDepts = useMemo(() => {
    const selectedDepts = activeDepartments.filter(d => selectedDeptIds.includes(d.id));
    if (selectedDepts.length === 0) return true; // default fallback
    return selectedDepts.some(d => d.enabledFields && d.enabledFields.workingDays);
  }, [activeDepartments, selectedDeptIds]);

  const activePayrollList = useMemo(() => {
    if (selectedArchiveSnap) return selectedArchiveSnap.payrollsSnapshot;
    return payrollList;
  }, [payrollList, selectedArchiveSnap]);

  const resolvedMonthLabel = useMemo(() => {
    if (selectedArchiveSnap) return selectedArchiveSnap.monthLabel;
    return currentMonthName;
  }, [selectedArchiveSnap, currentMonthName]);

  // Sync department ids selection list if departments changes
  React.useEffect(() => {
    setSelectedDeptIds(activeDepartments.map((d) => d.id));
  }, [activeDepartments]);

  // Filter list of employees and payroll for selected departments (Full multi-dept support) and sort
  const printItems = useMemo(() => {
    const list = activeEmployees.map((emp) => {
      const dept = activeDepartments.find((d) => d.id === emp.departmentId);
      const calculated = activePayrollList.find((p) => p.employeeId === emp.id) || calculateEmployeePayroll(emp, dept);
      return { emp, dept, calculated };
    });

    // filter only selected department IDs
    const filtered = list.filter((item) => selectedDeptIds.includes(item.emp.departmentId));

    // Sort according to sortOrder option
    const sorted = [...filtered];
    if (sortOrder === 'netSalaryDesc') {
      sorted.sort((a, b) => b.calculated.netSalary - a.calculated.netSalary);
    } else if (sortOrder === 'netSalaryAsc') {
      sorted.sort((a, b) => a.calculated.netSalary - b.calculated.netSalary);
    } else if (sortOrder === 'basicSalaryDesc') {
      sorted.sort((a, b) => b.calculated.basicSalary - a.calculated.basicSalary);
    }

    return sorted;
  }, [activeEmployees, activeDepartments, activePayrollList, selectedDeptIds, sortOrder]);

  // Group printItems by department with support for empty/new departments or lump sum
  const groupedPrintItems = useMemo(() => {
    const selectedDepts = activeDepartments.filter(d => selectedDeptIds.includes(d.id));
    return selectedDepts.map(dept => {
      const items = printItems.filter(item => item.emp.departmentId === dept.id);
      return { dept, items };
    }).filter(group => group.items.length > 0 || group.dept.salaryStructureType === 'lump_sum' || group.dept.salaryType === 'lumpSum' || group.dept.isLumpSum);
  }, [activeDepartments, selectedDeptIds, printItems]);

  const formattedTodayDate = useMemo(() => {
    try {
      return new Date().toLocaleDateString('ar-IQ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return new Date().toLocaleDateString();
    }
  }, []);

  // Generate department financial summaries first
  const departmentFinancialSummary = useMemo(() => {
    const summaryMap: Record<string, {
      id: string;
      deptName: string;
      basicSum: number;
      additionsSum: number;
      deductionsSum: number;
      netSum: number;
    }> = {};

    activeDepartments.forEach(dept => {
      if (selectedDeptIds.includes(dept.id)) {
        const isLump = dept.salaryStructureType === 'lump_sum' || dept.isLumpSum || dept.salaryType === 'lumpSum';
        const lumpSalary = isLump ? (dept.lumpSumSalary || 0) : 0;
        summaryMap[dept.id] = {
          id: dept.id,
          deptName: dept.name,
          basicSum: lumpSalary,
          additionsSum: 0,
          deductionsSum: 0,
          netSum: lumpSalary
        };
      }
    });

    printItems.forEach(item => {
      const deptId = item.emp.departmentId;
      if (summaryMap[deptId]) {
        const p = item.calculated;
        const dept = activeDepartments.find((d) => d.id === deptId);
        const isLump = dept ? (dept.salaryStructureType === 'lump_sum' || dept.isLumpSum || dept.salaryType === 'lumpSum') : false;
        if (!isLump) {
          summaryMap[deptId].basicSum += p.basicSalary;
          summaryMap[deptId].additionsSum += (p.allowanceDangerVal + p.allowanceMarriageVal + p.allowanceChildrenVal + p.allowanceDegreeVal + p.allowanceExtraDaysVal + p.allowanceExtraHoursVal + p.allowanceGeneralVal + p.allowanceEsnadVal + p.allowanceCustom1Val + p.allowanceCustom2Val + p.allowanceCustom3Val + p.allowanceCustom4Val + p.allowanceCustom5Val + p.previousMonthAddVal);
          summaryMap[deptId].deductionsSum += (p.deductionDaysVal + p.deductionHoursVal + p.deductionPenaltiesVal + p.deductionOtherVal + p.deductionPenaltyCustom1Val + p.deductionPenaltyCustom2Val + p.deductionPenaltyCustom3Val + p.deductionPenaltyCustom4Val + p.deductionPenaltyCustom5Val + p.previousMonthSubVal);
          summaryMap[deptId].netSum += p.netSalary;
        }
      }
    });

    return Object.values(summaryMap);
  }, [printItems, activeDepartments, selectedDeptIds]);

  // Aggregate stats from the department summary to keep totals fully synchronized
  const totalNetSelected = useMemo(() => {
    return departmentFinancialSummary.reduce((sum, d) => sum + d.netSum, 0);
  }, [departmentFinancialSummary]);

  const totalBasicSelected = useMemo(() => {
    return departmentFinancialSummary.reduce((sum, d) => sum + d.basicSum, 0);
  }, [departmentFinancialSummary]);

  // Helper inside component to get localized/renamed field titles
  const getFieldLabel = (fId: FieldId) => {
    return customFieldLabels[fId] || FIELDS_METADATA.find((m) => m.id === fId)?.label || fId;
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined' && window.self !== window.top) {
      showToast(
        language === 'ar'
          ? '⚠️ لتشغيل الطباعة بنجاح، يرجى أولاً فتح التطبيق في نافذة مستقلة عبر زر (فتح في نافذة جديدة) أعلى يمين الشاشة لتجاوز حماية المتصفح.'
          : '⚠️ To print successfully, please first open the app in a new independent tab using the (Open in New Tab) button at the top-right of your screen.',
        'info'
      );
    }
    const prevTitle = document.title;
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

  const handleExportToExcel = async () => {
    if (printItems.length === 0) {
      showToast('لا توجد سجلات رواتب لتصديرها للشهر المحدد.', 'info');
      return;
    }

    const cleanLabel = resolvedMonthLabel.replace(/[\s\/]/g, '_');
    const filename = `كشف_رواتب_شهر_${cleanLabel}_مستشفى_الفرح_الأهلي.xlsx`;

    try {
      const headers = [
        'ت',
        'اسم الموظف المستحق',
        'الرقم الوظيفي',
        'القسم',
        'المنصب',
        'الراتب الأساسي (د.ع)',
        'أيام الحضور الفعلية',
        'أجور الاستدعاء (د.ع)',
        'إجمالي المخصصات والإضافات (د.ع)',
        'إجمالي الخصم والعقوبات (د.ع)',
        'مضافات تراكمية شهر سابق (د.ع)',
        'ديون مسترجعة لشهر سابق (د.ع)',
        'إجمالي المستحق (د.ع)',
        'إجمالي الاستقطاع (د.ع)',
        'صافي القبض المستحق النهائي (د.ع)'
      ];

      const rows = printItems.map(({ emp, dept, calculated }, index) => [
        index + 1,
        emp.name,
        emp.employeeCode || '',
        dept ? dept.name : 'عام',
        emp.position || '',
        Math.round(calculated.basicSalary),
        emp.workingDays !== undefined ? emp.workingDays : 0,
        Math.round(calculated.calloutsPay || 0),
        Math.round(calculated.allowanceDangerVal + calculated.allowanceMarriageVal + calculated.allowanceChildrenVal + calculated.allowanceDegreeVal + calculated.allowanceExtraDaysVal + calculated.allowanceExtraHoursVal + calculated.allowanceGeneralVal + calculated.allowanceEsnadVal + calculated.allowanceCustom1Val + calculated.allowanceCustom2Val + calculated.allowanceCustom3Val + calculated.allowanceCustom4Val + calculated.allowanceCustom5Val),
        Math.round(calculated.deductionDaysVal + calculated.deductionHoursVal + calculated.deductionPenaltiesVal + calculated.deductionOtherVal + calculated.deductionPenaltyCustom1Val + calculated.deductionPenaltyCustom2Val + calculated.deductionPenaltyCustom3Val + calculated.deductionPenaltyCustom4Val + calculated.deductionPenaltyCustom5Val),
        Math.round(calculated.previousMonthAddVal || 0),
        Math.round(calculated.previousMonthSubVal || 0),
        Math.round(calculated.totalEarnings),
        Math.round(calculated.totalDeductions),
        Math.round(calculated.netSalary)
      ]);

      const data = [headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(data);

      // Enable RTL (Right-To-Left) layout natively for Arabic Excel compatibility
      if (!ws['!views']) ws['!views'] = [];
      ws['!views'].push({ RTL: true });

      // Perfect column widths for standard landscape and readable data
      const colWidths = [
        { wch: 4 },   // Index
        { wch: 25 },  // Employee name
        { wch: 12 },  // Code
        { wch: 15 },  // Department
        { wch: 15 },  // Position
        { wch: 18 },  // Basic salary
        { wch: 18 },  // Working days
        { wch: 18 },  // Callouts
        { wch: 28 },  // Total allowances
        { wch: 26 },  // Total deductions
        { wch: 28 },  // Previous month add
        { wch: 28 },  // Previous month sub
        { wch: 20 },  // Total earnings
        { wch: 20 },  // Total deductions
        { wch: 28 }   // Net salary
      ];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `كشف الرواتب ${cleanLabel}`);

      XLSX.writeFile(wb, filename);

      showToast('تم تصدير وحفظ ملف Excel المطور بنجاح وبترميز عربي متوافق 100%! 📊', 'success');
    } catch (error) {
      console.error('Failed to export using XLSX library:', error);
      showToast('حدث خطأ أثناء تصدير ملف الـ Excel.', 'error');
    }
  };

  const handleExportPDF = () => {
    const cleanLabel = resolvedMonthLabel.replace(/[\s\/]/g, '_');
    setPdfFilenameInput(`سجل_رواتب_مستشفى_الفرح_${cleanLabel}`);
    setShowConfirmPdfModal(true);
  };

  const triggerActualPdfExport = async (customFilename: string) => {
    setShowConfirmPdfModal(false);
    const element = document.getElementById('payroll-printable-area');
    if (!element) return;

    const filename = customFilename.endsWith('.pdf') ? customFilename : `${customFilename}.pdf`;

    // Attempt to request Save File Picker IMMEDIATELY within the click handler to satisfy browser transient user activation constraint
    const isSaveFilePickerSupported = typeof window !== 'undefined' && 'showSaveFilePicker' in window;
    let fileHandle: any = null;
    let useSaveFilePicker = false;

    if (isSaveFilePickerSupported) {
      try {
        // @ts-ignore
        fileHandle = await window.showSaveFilePicker({
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

    // Apply the custom pdf style class immediately to format layout correctly
    element.classList.add('pdf-render-mode');

    // Remove CSS classes temporarily so the raw PDF looks pristine without glassy cards shadows
    element.classList.remove('glass-panel', 'border', 'border-white/10', 'rounded-3xl', 'shadow-xl');

    // Dynamically rewrite OKLCH style strings to solid RGB inside our table structure so html2canvas compiles correctly
    const restoredItems = convertSubtreeColors(element);

    const opt = {
      margin:       [10, 10, 10, 10] as [number, number, number, number], // top, left, bottom, right in mm
      filename:     filename,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' as const }
    };

    // Use a small timeout to let the browser re-render the landscape-optimized theme and print style layers correctly
    setTimeout(() => {
      const fallbackStandardDownload = () => {
        // @ts-ignore
        html2pdf()
          .from(element)
          .set(opt)
          .save()
          .then(() => {
            // Restore beautiful CSS card styling classes
            restoreSubtreeColors(restoredItems);
            element.classList.remove('pdf-render-mode');
            element.classList.add('glass-panel', 'border', 'border-white/10', 'rounded-3xl', 'shadow-xl');
            setIsGeneratingPdf(false);
            showToast('تم تصدير وحفظ كشف الرواتب كـ PDF بنجاح! لتخصيص مسار ومجلد الحفظ على جهازك يدوياً لجميع التنزيلات، ننصح بتفعيل خيار "السؤال عن مكان حفظ كل ملف قبل التحميل" من إعدادات التحميل بالمتصفح.', 'success');
          })
          .catch((err: any) => {
            console.error('PDF fallback generation error:', err);
            restoreSubtreeColors(restoredItems);
            element.classList.remove('pdf-render-mode');
            element.classList.add('glass-panel', 'border', 'border-white/10', 'rounded-3xl', 'shadow-xl');
            setIsGeneratingPdf(false);
            showToast('حدث خطأ غير متوقع أثناء تصدير مستند الـ PDF.', 'error');
          });
      };

      if (useSaveFilePicker && fileHandle) {
        // @ts-ignore
        html2pdf()
          .from(element)
          .set(opt)
          .output('blob')
          .then(async (blob: Blob) => {
            try {
              const writable = await fileHandle.createWritable();
              await writable.write(blob);
              await writable.close();

              // Restore styling classes
              restoreSubtreeColors(restoredItems);
              element.classList.remove('pdf-render-mode');
              element.classList.add('glass-panel', 'border', 'border-white/10', 'rounded-3xl', 'shadow-xl');
              setIsGeneratingPdf(false);
              showToast('تم حفظ الكشف المالي بنجاح في المسار والمجلد الذي اخترته! 📁', 'success');
            } catch (err: any) {
              console.warn('Writing to selected file handle failed, trying fallback standard download:', err);
              fallbackStandardDownload();
            }
          })
          .catch((err: any) => {
            console.error('PDF Blob generation error:', err);
            fallbackStandardDownload();
          });
      } else {
        fallbackStandardDownload();
      }
    }, 150);
  };

  const handleSelectAllDepts = () => {
    setSelectedDeptIds(activeDepartments.map((d) => d.id));
  };

  const handleUnselectAllDepts = () => {
    setSelectedDeptIds([]);
  };

  const formatIQD = (amount: number) => {
    const val = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    return formatCurrency(val, language, 'IQD');
  };

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Print custom global styling injection */}
      <style>{`
        /* ========================================================
           SCREEN-VIEW THEME ISOLATION & ENHANCEMENTS FOR REPORT AREA
           ======================================================== */
        html body #payroll-printable-area {
          background-color: #ffffff !important;
          background: #ffffff !important;
          color: #212121 !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 24px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05) !important;
          padding: 24px !important;
          font-family: "Cairo", "Arial", sans-serif !important;
          font-size: 11px !important;
          transform: none !important;
        }

        /* Prevent system theme color leakage inside report area */
        html body #payroll-printable-area *,
        html body #payroll-printable-area table,
        html body #payroll-printable-area thead,
        html body #payroll-printable-area tbody,
        html body #payroll-printable-area tr,
        html body #payroll-printable-area th,
        html body #payroll-printable-area td,
        html body #payroll-printable-area span,
        html body #payroll-printable-area p,
        html body #payroll-printable-area div,
        html body #payroll-printable-area h1,
        html body #payroll-printable-area h2,
        html body #payroll-printable-area h3,
        html body #payroll-printable-area h4 {
          text-shadow: none !important;
          box-shadow: none !important;
          transition: none !important;
          text-decoration-style: solid !important;
          font-style: normal !important;
          word-spacing: normal !important;
        }

        /* Override dynamic dark-theme system text utilities inside report area */
        html body #payroll-printable-area .text-white,
        html body #payroll-printable-area .text-slate-900,
        html body #payroll-printable-area .text-slate-950,
        html body #payroll-printable-area .text-slate-800,
        html body #payroll-printable-area .text-slate-700,
        html body #payroll-printable-area .text-slate-200,
        html body #payroll-printable-area .text-slate-600 {
          color: #212121 !important;
        }
        
        html body #payroll-printable-area .text-slate-400,
        html body #payroll-printable-area .text-slate-300,
        html body #payroll-printable-area .text-slate-405,
        html body #payroll-printable-area .text-slate-450,
        html body #payroll-printable-area .text-slate-305 {
          color: #4b5563 !important;
        }

        /* Official high-contrast headings */
        html body #payroll-printable-area h1,
        html body #payroll-printable-area h2,
        html body #payroll-printable-area h3,
        html body #payroll-printable-area h4 {
          color: #1e3a8a !important; /* Official deep royal navy */
        }

        /* Safe printable colors for monetary additions & subtractions */
        html body #payroll-printable-area .text-emerald-400,
        html body #payroll-printable-area .text-emerald-450,
        html body #payroll-printable-area .text-emerald-700,
        html body #payroll-printable-area .text-emerald-800,
        html body #payroll-printable-area .text-emerald-300 {
          color: #15803d !important; /* solid contrast green */
          font-weight: 700 !important;
        }

        html body #payroll-printable-area .text-red-400,
        html body #payroll-printable-area .text-red-700,
        html body #payroll-printable-area .text-red-850,
        html body #payroll-printable-area .text-red-350 {
          color: #b91c1c !important; /* solid contrast red */
          font-weight: 700 !important;
        }

        html body #payroll-printable-area .text-blue-400,
        html body #payroll-printable-area .text-blue-800,
        html body #payroll-printable-area .text-indigo-400 {
          color: #1e3a8a !important; /* solid contrast blue */
        }

        /* Clean hospital emblem/crest isolation */
        html body #payroll-printable-area .bg-slate-950,
        html body #payroll-printable-area .bg-white\\/5 {
          background-color: #f8fafc !important;
          background: #f8fafc !important;
          border-color: #e2e8f0 !important;
        }

        /* Standardized official table layout */
        html body #payroll-printable-area .print-table {
          width: 100% !important;
          border-collapse: collapse !important;
          border: 1.5px solid #1e3a8a !important; /* Corporate thick dark navy border */
          margin-top: 15px !important;
          margin-bottom: 15px !important;
          background-color: #ffffff !important;
          table-layout: auto !important; /* Auto-fit columns layout */
        }

        /* Centered Header Cells - Navy blue background with crisp white text */
        html body #payroll-printable-area .print-table th {
          background-color: #1e3a8a !important; /* Institutional Navy Blue */
          color: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          font-weight: 700 !important;
          padding: 10px 8px !important;
          text-align: center !important;
          vertical-align: middle !important;
          font-size: 13px !important; /* 14px default display font size */
          font-style: normal !important;
        }

        /* Centered Data Cells - Clean light borders and automatic alignment */
        html body #payroll-printable-area .print-table td {
          border: 1.5px solid #cbd5e1 !important; /* Clear light grey border */
          color: #111827 !important;
          padding: 8px 6px !important;
          font-size: 11.5px !important; /* 12px default display inner size */
          background-color: transparent !important;
          vertical-align: middle !important;
          text-align: center !important; /* Center-align text, numbers, symbols */
          font-style: normal !important;
          white-space: nowrap !important; /* Prevent text line wrapping awkwardly inside individual record fields */
        }

        /* Allow specific columns containing detail list breakdown to wrap text and stretch gracefully */
        html body #payroll-printable-area .print-table td span.block {
          white-space: normal !important;
          word-break: break-word !important;
          display: block !important;
          text-align: center !important;
        }

        /* Double-check column alignment overrides */
        html body #payroll-printable-area .print-table td.font-mono,
        html body #payroll-printable-area .print-table td font-mono {
          text-align: center !important;
          vertical-align: middle !important;
        }

        /* alternate row shading for readability */
        html body #payroll-printable-area .print-table tbody tr {
          background-color: #ffffff !important;
        }
        
        html body #payroll-printable-area .print-table tbody tr:nth-child(even) {
          background-color: #f8fafc !important; /* Subtle off-white */
        }

        html body #payroll-printable-area .print-table tbody tr:hover td {
          background-color: #f1f5f9 !important;
        }

        /* Soft gray stand out highlight background for Net Salary column cell */
        html body #payroll-printable-area .print-table td.net-salary-cell {
          background-color: #f1f5f9 !important;
          font-weight: 700 !important;
        }

        /* Gray stand out background for Grand Totals row to emphasize corporative style */
        html body #payroll-printable-area .print-table tr.grand-total-row,
        html body #payroll-printable-area .print-table tr.grand-total-row td {
          background-color: #e2e8f0 !important;
          font-weight: 850 !important;
          color: #0f172a !important;
          border-top: 2px double #1e3a8a !important;
          border-bottom: 2px double #1e3a8a !important;
        }

        /* Dense Mode overrides to match dynamic toggling */
        html body #payroll-printable-area.dense-layout-active .print-table th {
          font-size: 11px !important;
          padding: 6px 4px !important;
        }
        html body #payroll-printable-area.dense-layout-active .print-table td {
          font-size: 9.5px !important;
          padding: 5px 3px !important;
        }

        /* Header double border standard formatting */
        html body #payroll-printable-area .print-header {
          border-bottom: 3px double #1e3a8a !important;
          padding-bottom: 16px !important;
          margin-bottom: 20px !important;
        }


        /* ========================================================
           PRINT ENGINE MEDIA DEFINITIONS (Ctrl + P)
           ======================================================== */
        @media print {
          @page {
            size: A4 landscape; /* Landscape scale for official reporting grid width sustainability */
            margin: 10mm 15mm 10mm 15mm !important; /* Standard margins for A4 landscape printing */
          }

          body {
            padding: 0 !important;
            margin: 0 !important;
            font-size: 11px !important;
            direction: rtl !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background-color: #ffffff !important;
            background-image: none !important;
          }

          /* Force standard pure white background canvas for page and core roots */
          html, body, #root, .min-h-screen, main, .print-area,
          .theme-dark, .theme-light, .theme-cosmic, .theme-brand, .theme-luxury {
            background: #ffffff !important;
            background-color: #ffffff !important;
            background-image: none !important;
            color: #000000 !important;
            box-shadow: none !important;
            text-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
            display: block !important;
            overflow: visible !important;
            height: auto !important;
            min-height: auto !important;
          }

          .no-print {
            display: none !important;
          }

          /* Ensure the container is fully visible and doesn't clip */
          html body #payroll-printable-area {
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow: visible !important;
            display: block !important;
            zoom: 78% !important; /* Scale down the wide table to fit A4 landscape perfectly! */
          }

          /* Force logo size in print */
          html body #payroll-printable-area svg {
            width: 80px !important;
            height: 80px !important;
            max-width: 80px !important;
            max-height: 80px !important;
          }

          /* Force all scroll containers to be visible and flow block-wise */
          html body #payroll-printable-area .overflow-x-auto {
            overflow: visible !important;
            overflow-x: visible !important;
            overflow-y: visible !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: none !important;
            float: none !important;
            position: relative !important;
          }

          /* Force high-contrast solid black text inside print areas */
          .print-area, .print-area * {
            color: #111827 !important;
            text-shadow: none !important;
            box-shadow: none !important;
            background-color: transparent !important;
          }

          /* Reinforce blue header fill during ink transfer */
          html body #payroll-printable-area .print-table th {
            background-color: #1e3a8a !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          html body #payroll-printable-area .print-table td {
            border: 1.5px solid #cbd5e1 !important;
            color: #111827 !important;
            background-color: transparent !important;
          }

          html body #payroll-printable-area .print-table tbody tr:nth-child(even) td {
            background-color: #f1f5f9 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Keep table headers repeating on every page and prevent rows split */
          html body #payroll-printable-area .print-table thead {
            display: table-header-group !important;
          }

          html body #payroll-printable-area .print-table tbody {
            display: table-row-group !important;
          }

          html body #payroll-printable-area .print-table tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }


        /* ========================================================
           PDF EXPORT CAPTURE RESOLVERS (html2pdf / html2canvas)
           ======================================================== */
        html body #payroll-printable-area.pdf-render-mode {
          background-color: #ffffff !important;
          background: #ffffff !important;
          color: #000000 !important;
          box-shadow: none !important;
          text-shadow: none !important;
          padding: 30px !important;
          margin: 0 !important;
          width: 297mm !important; /* Match physical A4 landscape width precisely */
          max-width: 297mm !important;
          border-radius: 0 !important;
          border: none !important;
          box-sizing: border-box !important;
        }

        /* Constrain logo size in PDF export mode */
        html body #payroll-printable-area.pdf-render-mode svg {
          width: 80px !important;
          height: 80px !important;
          max-width: 80px !important;
          max-height: 80px !important;
        }

        html body #payroll-printable-area.pdf-render-mode *,
        html body #payroll-printable-area.pdf-render-mode div,
        html body #payroll-printable-area.pdf-render-mode h1,
        html body #payroll-printable-area.pdf-render-mode h2,
        html body #payroll-printable-area.pdf-render-mode h3,
        html body #payroll-printable-area.pdf-render-mode h4,
        html body #payroll-printable-area.pdf-render-mode span,
        html body #payroll-printable-area.pdf-render-mode p,
        html body #payroll-printable-area.pdf-render-mode table,
        html body #payroll-printable-area.pdf-render-mode thead,
        html body #payroll-printable-area.pdf-render-mode tbody,
        html body #payroll-printable-area.pdf-render-mode tr,
        html body #payroll-printable-area.pdf-render-mode th,
        html body #payroll-printable-area.pdf-render-mode td {
          color: #111827 !important;
          text-shadow: none !important;
          box-shadow: none !important;
          border-color: #94a3b8 !important;
        }

        /* Style overlays for functional contrast elements in PDF mode */
        html body #payroll-printable-area.pdf-render-mode .text-emerald-400,
        html body #payroll-printable-area.pdf-render-mode .text-emerald-450,
        html body #payroll-printable-area.pdf-render-mode .text-emerald-700,
        html body #payroll-printable-area.pdf-render-mode .text-emerald-300 {
          color: #15803d !important;
        }
        
        html body #payroll-printable-area.pdf-render-mode .text-red-400,
        html body #payroll-printable-area.pdf-render-mode .text-red-700,
        html body #payroll-printable-area.pdf-render-mode .text-red-350 {
          color: #b91c1c !important;
        }
        
        html body #payroll-printable-area.pdf-render-mode .text-blue-400,
        html body #payroll-printable-area.pdf-render-mode .text-blue-800,
        html body #payroll-printable-area.pdf-render-mode .text-indigo-400 {
          color: #1e40af !important;
        }

        html body #payroll-printable-area.pdf-render-mode .print-table {
          width: 100% !important;
          border-collapse: collapse !important;
          border: 1.5px solid #1e3a8a !important;
        }
        
        html body #payroll-printable-area.pdf-render-mode .print-table th {
          background-color: #1e3a8a !important;
          color: #ffffff !important;
          border: 1px solid #1e3a8a !important;
          padding: 8px 6px !important;
        }

        html body #payroll-printable-area.pdf-render-mode .print-table td {
          border: 1px solid #94a3b8 !important;
          color: #111827 !important;
          padding: 8px 6px !important;
        }

        html body #payroll-printable-area.pdf-render-mode .print-table tbody tr:nth-child(even) td {
          background-color: #f1f5f9 !important;
        }
      `}</style>

      {/* Control Panel Wrapper (Hidden strictly on physical prints) */}
      <div className="no-print space-y-5">
        
        {/* Main Header card */}
        <div className="glass-panel rounded-3xl p-5 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 animate-pulse">
              <Printer className="w-5 h-5 text-blue-400 animate-spin-slow" />
              منظومة إعداد وطباعة تقارير الرواتب المرنة
            </h3>
            <p className="text-[11px] text-slate-400">
              تحكم كامل بتحديد الأقسام، وحجب أو إظهار كتل الأعمدة المطبوعة (شفتات، خصومات، مخصصات) لتلائم حاجتكم المحاسبية.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="trigger-excel-btn"
              onClick={handleExportToExcel}
              disabled={isGeneratingPdf}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white border border-white/10 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              تصدير كـ Excel (كشف ذكي) 📊
            </button>

            <button
              id="trigger-pdf-btn"
              onClick={handleExportPDF}
              disabled={isGeneratingPdf}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white border border-white/10 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingPdf ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جاري تصدير PDF...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-emerald-300 animate-pulse" />
                  تصـدير كـ PDF مباشر 📥
                </>
              )}
            </button>

            <button
              id="trigger-print-btn"
              onClick={handlePrint}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white border border-white/10 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              طباعة الكشف المحدد الآن
            </button>
          </div>
        </div>

        {/* Configurations grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* Section 1: Month and Departments Selection */}
          <div className="glass-panel p-4 rounded-3xl border border-white/5 space-y-4">
            <h4 className="text-xs font-bold text-blue-400 flex items-center gap-1.5 border-b border-white/5 pb-2">
              <Layers className="w-4 h-4 text-blue-400" />
              ١. الشهر المالي وفرز الأقسام
            </h4>

            {/* Month Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-bold text-slate-300">الشهر المحاسبي للكشف المطبوع:</label>
                {selectedMonthId !== 'current' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMonthId('current');
                      setCurrentMonthName(thisMonthLabel);
                    }}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-500/20"
                  >
                    <span>🟢 العودة للنشط</span>
                  </button>
                )}
              </div>

              {/* Quick Month Switcher Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMonthId('current');
                    setCurrentMonthName(thisMonthLabel);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition-all border flex items-center gap-1 cursor-pointer ${
                    selectedMonthId === 'current'
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow shadow-emerald-900/50'
                      : 'bg-slate-900 text-slate-400 border-white/5 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  الشهر الحالي النشط
                </button>
                {archive.map((a) => (
                  <button
                    key={a.monthId}
                    type="button"
                    onClick={() => {
                      setSelectedMonthId(a.monthId);
                      setCurrentMonthName(a.monthLabel);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition-all border flex items-center gap-1 cursor-pointer ${
                      selectedMonthId === a.monthId
                        ? 'bg-blue-600 text-white border-blue-400 shadow shadow-blue-900/50'
                        : 'bg-slate-900 text-slate-400 border-white/5 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>📂</span>
                    <span>{a.monthLabel}</span>
                  </button>
                ))}
              </div>

              <div className="relative">
                <select
                  value={selectedMonthId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedMonthId(val);
                    if (val === 'current') {
                      setCurrentMonthName(thisMonthLabel);
                    } else {
                      const found = archive.find(a => a.monthId === val);
                      if (found) setCurrentMonthName(found.monthLabel);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-950/90 border border-white/10 rounded-xl text-slate-200 text-xs font-bold focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="current">🟢 الشهر الجاري المالي (النشط حالياً - قابل للتعديل)</option>
                  {archive.map((a) => (
                    <option key={a.monthId} value={a.monthId}>
                      📂 {a.monthLabel} (سجل كامل مدخل ومحسوب - {formatIQD(a.totalNetSalary || a.totalNetPaid || 0)})
                    </option>
                  ))}
                </select>
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* If Archived Month Selected: Info Banner */}
            {selectedMonthId !== 'current' && selectedArchiveSnap && (
              <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-300 flex items-center gap-1.5">
                    <span>📂</span>
                    <span>كشف رواتب مؤرشف بالكامل مع المدخلات</span>
                  </span>
                  <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-200 border border-blue-400/20 font-bold">
                    سجل مدخلات تاريخي معتمد
                  </span>
                </div>
                <div className="text-[10px] text-slate-300 space-y-1">
                  <p className="font-semibold text-white">
                    الشهر: {selectedArchiveSnap.monthLabel}
                  </p>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>عدد الكوادر: <b className="text-white">{activeEmployees.length}</b></span>
                    <span>صافي الرواتب: <b className="text-emerald-400">{formatIQD(totalNetSelected)}</b></span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMonthId('current');
                    setCurrentMonthName(thisMonthLabel);
                  }}
                  className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 rounded-xl text-[10.5px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>العودة لكشف الشهر الحالي النشط</span>
                  <span>↩️</span>
                </button>
              </div>
            )}

            {/* Label custom name inline */}
            <div className="space-y-2 bg-slate-950/40 p-3 rounded-2xl border border-white/5">
              <label className="block text-[10.5px] text-slate-300 font-bold">
                عنوان وتاريخ شهر الرواتب المعروض بالكشف والسندات:
              </label>

              <div className="space-y-2">
                {/* Quick Month Preset Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const matchArch = archive.find(a => 
                        a.monthLabel.includes('تموز') || 
                        a.monthLabel.includes('يوليو') || 
                        a.monthId.includes('07') ||
                        a.monthLabel.includes(prevMonthLabel.split(' ')[0])
                      );
                      if (matchArch) {
                        setSelectedMonthId(matchArch.monthId);
                        setCurrentMonthName(matchArch.monthLabel);
                      } else {
                        setSelectedMonthId('current');
                        setCurrentMonthName(prevMonthLabel);
                      }
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-[10.5px] font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      resolvedMonthLabel.includes('تموز') || resolvedMonthLabel.includes('يوليو') || currentMonthName === prevMonthLabel
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow shadow-indigo-950/50'
                        : 'bg-slate-900 text-slate-300 border-white/10 hover:bg-slate-800'
                    }`}
                  >
                    <span>👈</span>
                    <span>كشف شهر 7 (تموز)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMonthId('current');
                      setCurrentMonthName(thisMonthLabel);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-[10.5px] font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      selectedMonthId === 'current' && currentMonthName === thisMonthLabel
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow shadow-emerald-950/50'
                        : 'bg-slate-900 text-slate-300 border-white/10 hover:bg-slate-800'
                    }`}
                  >
                    <span>📅</span>
                    <span>الشهر الحالي النشط</span>
                  </button>
                </div>

                {/* Dropdown to pick month directly */}
                <div className="relative">
                  <select
                    value={monthNamesArabic.some(m => resolvedMonthLabel.includes(m)) ? monthNamesArabic.find(m => resolvedMonthLabel.includes(m)) : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        const sel = e.target.value;
                        const matchArch = archive.find(a => a.monthLabel.includes(sel));
                        if (matchArch) {
                          setSelectedMonthId(matchArch.monthId);
                          setCurrentMonthName(matchArch.monthLabel);
                        } else {
                          const yearMatch = currentMonthName.match(/\d{4}/);
                          const yearStr = yearMatch ? yearMatch[0] : new Date().getFullYear().toString();
                          setSelectedMonthId('current');
                          setCurrentMonthName(`${sel} ${yearStr}`);
                        }
                      }
                    }}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-white/10 rounded-xl text-indigo-300 text-xs font-semibold focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="">-- اختر الشهر المالي من القائمة --</option>
                    {monthNamesArabic.map((m) => (
                      <option key={m} value={m}>
                        🗓️ شهر {m}
                      </option>
                    ))}
                  </select>
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-indigo-400">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              <input
                type="text"
                disabled={selectedMonthId !== 'current'}
                value={resolvedMonthLabel}
                onChange={(e) => setCurrentMonthName(e.target.value)}
                placeholder="أيار / مايو 2026"
                className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-white text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
              />

              {selectedMonthId === 'current' && onUpdateArchive && (
                <button
                  type="button"
                  onClick={() => {
                    const monthId = `month_${Date.now()}`;
                    const newArchiveMonth: ArchivedMonth = {
                      monthId,
                      monthLabel: currentMonthName,
                      timestamp: new Date().toISOString(),
                      archivedAt: new Date().toISOString(),
                      departmentsSnapshot: JSON.parse(JSON.stringify(departments)),
                      employeesSnapshot: JSON.parse(JSON.stringify(employees)),
                      payrollsSnapshot: JSON.parse(JSON.stringify(payrollList)),
                      totalNetPaid: totalNetSelected,
                      totalEarningsSum: totalNetSelected,
                      totalDeductionsSum: 0,
                      totalNetSalary: totalNetSelected,
                      totalEmployeesCount: employees.length
                    };
                    const updated = [newArchiveMonth, ...archive.filter(a => a.monthLabel !== newArchiveMonth.monthLabel)];
                    onUpdateArchive(updated);
                    showToast(`تم أرشفة وحفظ نسخة كاملة من كشف (${currentMonthName}) في الأرشيف بنجاح! 📁`, 'success');
                  }}
                  className="w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-blue-400 border border-blue-500/20 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                  <span>💾</span>
                  <span>حفظ وأرشفة نسخة من هذا الكشف الآن</span>
                </button>
              )}
            </div>

            {/* Salary Sorting Selector Before Printing */}
            <div className="bg-emerald-950/30 border border-emerald-500/20 p-2.5 rounded-2xl space-y-1.5">
              <label className="block text-[10.5px] font-bold text-emerald-300 flex items-center justify-between">
                <span>ترتيب الرواتب قبل الطباعة:</span>
                <span className="text-[9px] text-emerald-400/80 font-normal">من الأعلى للأعلى أو العكس</span>
              </label>
              <div className="relative">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer"
                >
                  <option value="netSalaryDesc">⬇️ ترتيب الراتب من الأعلى إلى الأسفل (صافي القبض)</option>
                  <option value="netSalaryAsc">⬆️ ترتيب الراتب من الأسفل إلى الأعلى (صافي القبض)</option>
                  <option value="basicSalaryDesc">💵 ترتيب حسب الراتب الأساسي (من الأعلى للأسفل)</option>
                  <option value="default">📋 الترتيب الافتراضي (حسب تسلسل الموظفين بالسجل)</option>
                </select>
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-400">
                  <ChevronDown className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* Multi-Dept Selector */}
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-slate-950/40 p-1.5 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-300 font-bold">الأقسام الطبية المشمولة ({selectedDeptIds.length}):</span>
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAllDepts}
                    className="text-[9px] text-blue-400 hover:underline flex items-center gap-0.5"
                  >
                    تحديد الكل
                  </button>
                  <span className="text-slate-700 text-[10px] select-none">|</span>
                  <button
                    onClick={handleUnselectAllDepts}
                    className="text-[9px] text-slate-500 hover:underline flex items-center gap-0.5"
                  >
                    إلغاء الكل
                  </button>
                </div>
              </div>

              {activeDepartments.length === 0 ? (
                <p className="text-[10px] text-slate-500 italic">لا توجد أقسام متوفرة للصرف.</p>
              ) : (
                <div className="max-h-[140px] overflow-y-auto border border-white/5 rounded-xl p-2 bg-slate-950/20 space-y-1.5 scrollbar-thin">
                  {activeDepartments.map((d) => {
                    const isChecked = selectedDeptIds.includes(d.id);
                    return (
                      <label key={d.id} className="flex items-center gap-2 select-none cursor-pointer text-[10px] text-slate-300 hover:text-white">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedDeptIds(selectedDeptIds.filter((id) => id !== d.id));
                            } else {
                              setSelectedDeptIds([...selectedDeptIds, d.id]);
                            }
                          }}
                          className="rounded bg-slate-950 text-blue-500 focus:ring-blue-500 border-white/10"
                        />
                        <span className="truncate">{d.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Columns select toggles */}
          <div className="glass-panel p-4 rounded-3xl border border-white/5 space-y-4">
            <h4 className="text-xs font-bold text-blue-400 flex items-center gap-1.5 border-b border-white/5 pb-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              ٢. تخصيص أعمدة وحقول الطباعة
            </h4>

            <p className="text-[9px] text-slate-400 leading-normal">
              اضبط الأعمدة المحددة للتصدير الورقي لتفادي تشويه عرض الجداول على الصفحات الأفقية:
            </p>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              <label className="flex items-center gap-2 select-none cursor-pointer text-[10px] text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printCols.workingDays}
                  onChange={(e) => setPrintCols({ ...printCols, workingDays: e.target.checked })}
                  className="rounded bg-slate-950 text-blue-500 border-white/10"
                />
                <span className="font-medium text-blue-300">أيام الدوام</span>
              </label>

              <label className="flex items-center gap-2 select-none cursor-pointer text-[10px] text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printCols.workingHours}
                  onChange={(e) => setPrintCols({ ...printCols, workingHours: e.target.checked })}
                  className="rounded bg-slate-950 text-blue-500 border-white/10"
                />
                <span className="font-medium text-blue-300">ساعات الدوام</span>
              </label>

              <label className="flex items-center gap-2 select-none cursor-pointer text-[10px] text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printCols.dayPrice}
                  onChange={(e) => setPrintCols({ ...printCols, dayPrice: e.target.checked })}
                  className="rounded bg-slate-950 text-blue-500 border-white/10"
                />
                <span>مبلغ اليوم</span>
              </label>

              <label className="flex items-center gap-2 select-none cursor-pointer text-[10px] text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printCols.hourPrice}
                  onChange={(e) => setPrintCols({ ...printCols, hourPrice: e.target.checked })}
                  className="rounded bg-slate-950 text-blue-500 border-white/10"
                />
                <span>مبلغ الساعات</span>
              </label>

              <label className="flex items-center gap-2 select-none cursor-pointer text-[10px] text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printCols.allowanceExtraDays}
                  onChange={(e) => setPrintCols({ ...printCols, allowanceExtraDays: e.target.checked })}
                  className="rounded bg-slate-950 text-blue-500 border-white/10"
                />
                <span>اضافي ايام</span>
              </label>

              <label className="flex items-center gap-2 select-none cursor-pointer text-[10px] text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printCols.allowanceExtraHours}
                  onChange={(e) => setPrintCols({ ...printCols, allowanceExtraHours: e.target.checked })}
                  className="rounded bg-slate-950 text-blue-500 border-white/10"
                />
                <span>اضافي ساعات</span>
              </label>

              <label className="flex items-center gap-2 select-none cursor-pointer text-[10px] text-red-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printCols.deductionDays}
                  onChange={(e) => setPrintCols({ ...printCols, deductionDays: e.target.checked })}
                  className="rounded bg-slate-950 text-blue-500 border-white/10"
                />
                <span>أيام الغياب</span>
              </label>

              <label className="flex items-center gap-2 select-none cursor-pointer text-[10px] text-red-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printCols.deductionHours}
                  onChange={(e) => setPrintCols({ ...printCols, deductionHours: e.target.checked })}
                  className="rounded bg-slate-950 text-blue-500 border-white/10"
                />
                <span>استقطاع ساعات</span>
              </label>

              <label className="flex items-center gap-2 select-none cursor-pointer text-[10px] text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printCols.allowances}
                  onChange={(e) => setPrintCols({ ...printCols, allowances: e.target.checked })}
                  className="rounded bg-slate-950 text-blue-500 border-white/10"
                />
                <span className="text-emerald-300">اضافات ومخصصات</span>
              </label>

              <label className="flex items-center gap-2 select-none cursor-pointer text-[10px] text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printCols.deductions}
                  onChange={(e) => setPrintCols({ ...printCols, deductions: e.target.checked })}
                  className="rounded bg-slate-950 text-blue-500 border-white/10"
                />
                <span className="text-rose-300">عقوبات</span>
              </label>

              <label className="flex items-center gap-2 select-none cursor-pointer text-[10px] text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printCols.basicSalary}
                  onChange={(e) => setPrintCols({ ...printCols, basicSalary: e.target.checked })}
                  className="rounded bg-slate-950 text-blue-500 border-white/10"
                />
                <span>الراتب الاساسي</span>
              </label>

              <label className="flex items-center gap-2 select-none cursor-pointer text-[10px] text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printCols.totalEarnings}
                  onChange={(e) => setPrintCols({ ...printCols, totalEarnings: e.target.checked })}
                  className="rounded bg-slate-950 text-blue-500 border-white/10"
                />
                <span className="font-semibold text-blue-200">الراتب المستحق</span>
              </label>

              {/* Individual Shift counts and custom prices as requested */}
              <label className="flex items-center gap-2 select-none cursor-pointer text-[10px] text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printCols.shiftMorningCount}
                  onChange={(e) => setPrintCols({ ...printCols, shiftMorningCount: e.target.checked })}
                  className="rounded bg-slate-950 text-blue-500 border-white/10"
                />
                <span>عدد ايام الشفت الصباحي</span>
              </label>

              <label className="flex items-center gap-2 select-none cursor-pointer text-[10px] text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printCols.shiftMorningPay}
                  onChange={(e) => setPrintCols({ ...printCols, shiftMorningPay: e.target.checked })}
                  className="rounded bg-slate-950 text-blue-500 border-white/10"
                />
                <span>مبلغ الشفت الصباحي</span>
              </label>

              <label className="flex items-center gap-2 select-none cursor-pointer text-[10px] text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printCols.shiftEveningCount}
                  onChange={(e) => setPrintCols({ ...printCols, shiftEveningCount: e.target.checked })}
                  className="rounded bg-slate-950 text-blue-500 border-white/10"
                />
                <span>عدد ايام الشفت المسائي</span>
              </label>

              <label className="flex items-center gap-2 select-none cursor-pointer text-[10px] text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printCols.shiftEveningPay}
                  onChange={(e) => setPrintCols({ ...printCols, shiftEveningPay: e.target.checked })}
                  className="rounded bg-slate-950 text-blue-500 border-white/10"
                />
                <span>مبلغ الشفت المسائي</span>
              </label>

              <label className="flex items-center gap-2 select-none cursor-pointer text-[10px] text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printCols.shiftMiddleCount}
                  onChange={(e) => setPrintCols({ ...printCols, shiftMiddleCount: e.target.checked })}
                  className="rounded bg-slate-950 text-blue-500 border-white/10"
                />
                <span>عدد ايام الشفت الوسطي</span>
              </label>

              <label className="flex items-center gap-2 select-none cursor-pointer text-[10px] text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printCols.shiftMiddlePay}
                  onChange={(e) => setPrintCols({ ...printCols, shiftMiddlePay: e.target.checked })}
                  className="rounded bg-slate-950 text-blue-500 border-white/10"
                />
                <span>مبلغ الشفت الوسطي</span>
              </label>

              <label className="flex items-center gap-2 select-none cursor-pointer text-[10px] text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printCols.shiftKhafarCount}
                  onChange={(e) => setPrintCols({ ...printCols, shiftKhafarCount: e.target.checked })}
                  className="rounded bg-slate-950 text-blue-500 border-white/10"
                />
                <span>عدد ايام الشفت الخفر</span>
              </label>

              <label className="flex items-center gap-2 select-none cursor-pointer text-[10px] text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printCols.shiftKhafarPay}
                  onChange={(e) => setPrintCols({ ...printCols, shiftKhafarPay: e.target.checked })}
                  className="rounded bg-slate-950 text-blue-500 border-white/10"
                />
                <span>مبلغ الشفت الخفر</span>
              </label>

              <label className="flex items-center gap-2 select-none cursor-pointer text-[10px] text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printCols.shiftFull24Count}
                  onChange={(e) => setPrintCols({ ...printCols, shiftFull24Count: e.target.checked })}
                  className="rounded bg-slate-950 text-blue-500 border-white/10"
                />
                <span>عدد ايام دوام كامل 24</span>
              </label>

              <label className="flex items-center gap-2 select-none cursor-pointer text-[10px] text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printCols.shiftFull24Pay}
                  onChange={(e) => setPrintCols({ ...printCols, shiftFull24Pay: e.target.checked })}
                  className="rounded bg-slate-950 text-blue-500 border-white/10"
                />
                <span>مبلغ ال 24 ساعة</span>
              </label>

              <label className="flex items-center gap-2 select-none cursor-pointer text-[10px] text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printCols.shiftHalf12Count}
                  onChange={(e) => setPrintCols({ ...printCols, shiftHalf12Count: e.target.checked })}
                  className="rounded bg-slate-950 text-blue-500 border-white/10"
                />
                <span>عدد ايام نصف شفت 12</span>
              </label>

              <label className="flex items-center gap-2 select-none cursor-pointer text-[10px] text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printCols.shiftHalf12Pay}
                  onChange={(e) => setPrintCols({ ...printCols, shiftHalf12Pay: e.target.checked })}
                  className="rounded bg-slate-950 text-blue-500 border-white/10"
                />
                <span>مبلغ النصف شفت</span>
              </label>

              <label className="flex items-center gap-2 select-none cursor-pointer text-[10px] text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printCols.callouts}
                  onChange={(e) => setPrintCols({ ...printCols, callouts: e.target.checked })}
                  className="rounded bg-slate-950 text-blue-500 border-white/10"
                />
                <span>عدد ايام الاستدعاء</span>
              </label>

              <label className="flex items-center gap-2 select-none cursor-pointer text-[10px] text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printCols.calloutsPay}
                  onChange={(e) => setPrintCols({ ...printCols, calloutsPay: e.target.checked })}
                  className="rounded bg-slate-950 text-blue-500 border-white/10"
                />
                <span>مبلغ الاستدعاء</span>
              </label>

              <label className="flex items-center gap-2 select-none cursor-pointer text-[10px] text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printCols.dailyFullPrice}
                  onChange={(e) => setPrintCols({ ...printCols, dailyFullPrice: e.target.checked })}
                  className="rounded bg-slate-950 text-blue-500 border-white/10"
                />
                <span>مبلغ اليوم الكامل</span>
              </label>

              <label className="flex items-center gap-2 select-none cursor-pointer text-[10px] text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printCols.dailyHalfPrice}
                  onChange={(e) => setPrintCols({ ...printCols, dailyHalfPrice: e.target.checked })}
                  className="rounded bg-slate-950 text-blue-500 border-white/10"
                />
                <span>مبلغ النص يوم</span>
              </label>

              <label className="flex items-center gap-2 select-none cursor-pointer text-[10px] text-emerald-400 font-bold hover:text-white border-t border-white/5 pt-2 col-span-2 mt-1">
                <input
                  type="checkbox"
                  checked={printCols.socialSecurity}
                  onChange={(e) => setPrintCols({ ...printCols, socialSecurity: e.target.checked })}
                  className="rounded bg-slate-950 text-emerald-500 border-white/10"
                />
                <span>إظهار عمود خصم الضمان الاجتماعي (5%)</span>
              </label>

              {/* Extra Utility Columns */}
              <label className="flex items-center gap-2 select-none cursor-pointer text-[10px] text-slate-400 hover:text-white border-t border-white/5 pt-2 col-span-2 mt-1">
                <input
                  type="checkbox"
                  checked={printCols.dept}
                  onChange={(e) => setPrintCols({ ...printCols, dept: e.target.checked })}
                  className="rounded bg-slate-950 text-blue-500 border-white/10"
                />
                <span>شعبة/قسم الموظف</span>
              </label>

              <label className="flex items-center gap-2 select-none cursor-pointer text-[10px] text-slate-400 hover:text-white col-span-2">
                <input
                  type="checkbox"
                  checked={printCols.position}
                  onChange={(e) => setPrintCols({ ...printCols, position: e.target.checked })}
                  className="rounded bg-slate-950 text-blue-500 border-white/10"
                />
                <span>العنوان الوظيفي</span>
              </label>

              <label className="flex items-center gap-2 select-none cursor-pointer text-[10px] text-emerald-300 hover:text-white col-span-2">
                <input
                  type="checkbox"
                  checked={printCols.signatureBox}
                  onChange={(e) => setPrintCols({ ...printCols, signatureBox: e.target.checked })}
                  className="rounded bg-slate-950 text-blue-500 border-white/10"
                />
                <span>أضف خانة توقيع وبصمة الإبهام</span>
              </label>
            </div>
          </div>

          {/* Section 3: Formatting and Footers */}
          <div className="glass-panel p-4 rounded-3xl border border-white/5 space-y-4">
            <h4 className="text-xs font-bold text-blue-400 flex items-center gap-1.5 border-b border-white/5 pb-2">
              <Settings className="w-4 h-4 text-blue-400" />
              ٣. مظهر وهوامش الصفحة الرسمية
            </h4>

            <div className="space-y-3">
              <label className="flex items-center gap-2.5 select-none cursor-pointer text-[11px] text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printFooterOpts.showFingerNote}
                  onChange={(e) => setPrintFooterOpts({ ...printFooterOpts, showFingerNote: e.target.checked })}
                  className="rounded bg-slate-950 text-blue-500 border-white/10"
                />
                <span>أضف عبارة "بصمات الكاميرا والمكتبية" للموظف</span>
              </label>

              <label className="flex items-center gap-2.5 select-none cursor-pointer text-[11px] text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printFooterOpts.showOfficialSignatures}
                  onChange={(e) => setPrintFooterOpts({ ...printFooterOpts, showOfficialSignatures: e.target.checked })}
                  className="rounded bg-slate-950 text-blue-500 border-white/10"
                />
                <span>أضف فقرة توقيع وختم (المدير والمدقق المالي)</span>
              </label>

              <label className="flex items-center gap-2.5 select-none cursor-pointer text-[11px] text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printFooterOpts.showSystemSummary}
                  onChange={(e) => setPrintFooterOpts({ ...printFooterOpts, showSystemSummary: e.target.checked })}
                  className="rounded bg-slate-950 text-blue-500 border-white/10"
                />
                <span>عرض شريط الإحصائيات الصافية وحقوق المهندس محمد</span>
              </label>

              <label className="flex items-center gap-2.5 select-none cursor-pointer text-[11px] text-slate-300 hover:text-white p-1.5 bg-yellow-500/10 border border-yellow-500/15 rounded-xl">
                <input
                  type="checkbox"
                  checked={printFooterOpts.denseLayout}
                  onChange={(e) => setPrintFooterOpts({ ...printFooterOpts, denseLayout: e.target.checked })}
                  className="rounded bg-slate-950 text-yellow-500 border-white/10"
                />
                <div>
                  <span className="font-bold text-yellow-300 text-[10px] block">ضغط وتنسيق ورقة الكشف (Dense)</span>
                  <span className="text-[8px] text-slate-400">مثالي للطباعة عندما تكون قائمة الموظفين والأعمدة طويلة جداً لتفادي الصفحات الإضافية.</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Sheet Area */}
      <div id="payroll-printable-area" className={`print-area glass-panel border border-slate-300 rounded-3xl p-6 sm:p-8 shadow-xl max-w-7xl mx-auto space-y-6 select-text animate-scale-up ${printFooterOpts.denseLayout ? 'dense-layout-active' : ''}`}>
        
        {/* Document Header */}
        <div className="print-header pb-5 border-b-2 border-slate-900 flex flex-col sm:flex-row justify-between items-center gap-6 text-center sm:text-right">
          <div className="flex items-center gap-4 flex-col sm:flex-row">
            {/* Elegant Hospital Crest/Medical Seal Emblem */}
            <div className="shrink-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border-2 border-slate-300 p-1 bg-white shadow-md flex items-center justify-center overflow-hidden">
                {hospitalProfile.logoUrl ? (
                  <img 
                    src={hospitalProfile.logoUrl} 
                    alt="Logo" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full rounded-full object-contain" 
                  />
                ) : isGeneratingPdf ? (
                  <div className="w-full h-full rounded-full bg-cyan-600 border-2 border-amber-500 flex flex-col items-center justify-center text-center p-1 select-none" style={{ background: '#009db4' }}>
                    <span className="text-[10px] font-black text-white leading-tight">مستشفى الفرح</span>
                    <span className="text-[5px] font-bold text-cyan-100 uppercase tracking-wider leading-none mt-0.5">AL FARAH</span>
                  </div>
                ) : (
                  <HospitalLogo className="w-full h-full" />
                )}
              </div>
            </div>
            
            <div className="space-y-0.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight font-sans">{hospitalProfile.nameAr}</h1>
              <p className="text-[10px] sm:text-slate-600 font-mono tracking-widest uppercase font-bold">
                {hospitalProfile.nameEn}
              </p>
              <div className="mt-1">
                <span className="text-[10px] sm:text-slate-950 font-black border border-slate-400 bg-slate-100 px-3 py-1 rounded-full inline-block">
                  جدول الرواتب والأجور والكشوفات الرسمية الموحدة
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1 text-center sm:text-left text-slate-900 text-xs font-medium">
            <p>
              الشهر المالي المستحق: <span className="font-extrabold text-slate-950 text-sm sm:text-base border-b sm:border-slate-900 pb-0.5">{resolvedMonthLabel}</span>
            </p>
            <p className="text-[10px] font-mono text-slate-655 font-medium">
              تاريخ استخراج الكشف: {new Date().toLocaleString('en-US')}
            </p>
            <p className="text-[10px]">
              التبويب المالي: <span className="text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-extrabold">
                {selectedDeptIds.length === activeDepartments.length 
                  ? 'كافة كشوفات الأقسام المفتوحة' 
                  : `فرز مخصص (${selectedDeptIds.length} من الأقسام)`}
              </span>
            </p>
          </div>
        </div>

        {/* Informative interactive notice (Hidden on print) */}
        <div className="no-print bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2.5">
          <FileText className="w-5 h-5 shrink-0 text-blue-650 mt-0.5" />
          <p>
            <span className="font-bold">معاينة التنسيق النهائي:</span> سيتم إخفاء لوحات التحكم بالفرز واختيار الحقول وتظليلها تلقائياً عند طلب الطباعة لتخرج صفحة بيضاء نظيفة خالية من الزخرفة. الأعمدة تتفاعل وتتسع حسب اختيارك للخصائص باللوحة العلوية.
          </p>
        </div>

        {/* Filter and render dynamic calculated table columns based on checked settings */}
        {groupedPrintItems.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            لا توجد سجلات رواتب وموظفين تطابق الأقسام المحددة حالياً.
          </div>
        ) : (
          <div className="space-y-12">
            {groupedPrintItems.map((group, groupIdx) => {
              const { dept, items } = group;
              const isWorkingDaysEnabledForDept = isWorkingDaysEnabledInSelectedDepts && (dept.enabledFields ? !!dept.enabledFields.workingDays : true);

              return (
                <div key={dept.id} className="dept-print-block space-y-6 pt-6 first:pt-0 border-t border-slate-700/20 sm:border-slate-300 first:border-t-0">
                  {/* Beautiful Centered Department Header */}
                  <div className="text-center my-6">
                    <div className="inline-block border-b-4 border-double border-slate-805 pb-2.5 px-12">
                      <span className="text-[10px] font-bold text-slate-600 block mb-1 tracking-widest uppercase">كشف البصمات والجدول المالي الرسمي</span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-sans tracking-wide">
                        قسم {dept.name}
                      </h2>
                    </div>
                  </div>

                  {items.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs">
                      لا توجد سجلات موظفين في هذا القسم حالياً.
                    </div>
                  ) : (
                    <div className="overflow-x-auto w-full">
                      <table className="print-table w-full text-center text-[10px] sm:text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-150 border-b border-slate-300 text-slate-950 font-bold text-center">
                            <th className="p-2 border border-slate-300 w-10 text-center text-slate-950">ت</th>
                            <th className="p-2 border border-slate-300 text-center text-slate-950">اسم الموظف المستحق</th>
                            
                            {printCols.dept && <th className="p-2 border border-slate-300 text-center text-slate-950">القسم الاستشفائي</th>}
                            {printCols.position && <th className="p-2 border border-slate-300 text-center text-slate-950">المسمى والمنصب</th>}
                            {printCols.workingDays && <th className="p-2 border border-slate-300 text-center w-14 text-slate-950">أيام الدوام</th>}
                            {printCols.workingHours && <th className="p-2 border border-slate-300 text-center w-14 text-slate-950">ساعات الدوام</th>}
                            {printCols.dayPrice && <th className="p-2 border border-slate-300 text-center w-20 text-[10px] text-slate-950">مبلغ اليوم</th>}
                            {printCols.hourPrice && <th className="p-2 border border-slate-300 text-center w-20 text-[10px] text-slate-950">مبلغ الساعات</th>}
                            
                            {printCols.allowanceExtraDays && <th className="p-2 border border-slate-300 text-center text-slate-950">اضافي ايام</th>}
                            {printCols.allowanceExtraHours && <th className="p-2 border border-slate-300 text-center text-slate-950">اضافي ساعات</th>}
                            {printCols.deductionDays && <th className="p-2 border border-slate-300 text-center text-slate-950">أيام الغياب</th>}
                            {printCols.deductionHours && <th className="p-2 border border-slate-300 text-center text-slate-950">استقطاع ساعات</th>}

                            {printCols.allowances && <th className="p-2 border border-slate-300 text-center text-slate-950">إضافات ومخصصات</th>}
                            {printCols.deductions && <th className="p-2 border border-slate-300 text-center text-slate-950">عقوبات</th>}
                            {printCols.basicSalary && <th className="p-2 border border-slate-300 text-center text-slate-950">الراتب الاساسي</th>}
                            {printCols.totalEarnings && <th className="p-2 border border-slate-300 text-center text-slate-950">الراتب المستحق</th>}
                            
                            {/* Shift Details */}
                            {printCols.shiftMorningCount && <th className="p-1 border border-slate-300 text-center text-[9px] w-12 text-slate-950">أيام الشفت الصباحي</th>}
                            {printCols.shiftMorningPay && <th className="p-1 border border-slate-300 text-center text-[9px] w-14 text-slate-950">مبلغ الشفت الصباحي</th>}
                            {printCols.shiftEveningCount && <th className="p-1 border border-slate-300 text-center text-[9px] w-12 text-slate-950">أيام الشفت المسائي</th>}
                            {printCols.shiftEveningPay && <th className="p-1 border border-slate-300 text-center text-[9px] w-14 text-slate-950">مبلغ الشفت المسائي</th>}
                            {printCols.shiftMiddleCount && <th className="p-1 border border-slate-300 text-center text-[9px] w-12 text-slate-950">أيام الشفت الوسطي</th>}
                            {printCols.shiftMiddlePay && <th className="p-1 border border-slate-300 text-center text-[9px] w-14 text-slate-950">مبلغ الشفت الوسطي</th>}
                            {printCols.shiftKhafarCount && <th className="p-1 border border-slate-300 text-center text-[9px] w-12 text-slate-950">أيام الشفت الخفر</th>}
                            {printCols.shiftKhafarPay && <th className="p-1 border border-slate-300 text-center text-[9px] w-14 text-slate-950">مبلغ الشفت الخفر</th>}
                            {printCols.shiftFull24Count && <th className="p-1 border border-slate-300 text-center text-[9px] w-12 text-slate-950">أيام دوام كامل 24</th>}
                            {printCols.shiftFull24Pay && <th className="p-1 border border-slate-300 text-center text-[9px] w-14 text-slate-950">مبلغ ال 24 ساعة</th>}
                            {printCols.shiftHalf12Count && <th className="p-1 border border-slate-300 text-center text-[9px] w-12 text-slate-950">أيام نصف شفت 12</th>}
                            {printCols.shiftHalf12Pay && <th className="p-1 border border-slate-300 text-center text-[9px] w-14 text-slate-950">مبلغ النصف شفت</th>}

                            {/* Callouts & Daily */}
                            {printCols.callouts && <th className="p-2 border border-slate-300 text-center w-14 text-slate-950">عدد ايام الاستدعاء</th>}
                            {printCols.calloutsPay && <th className="p-2 border border-slate-300 text-center w-20 text-slate-950">مبلغ الاستدعاء</th>}
                            {printCols.dailyFullPrice && <th className="p-2 border border-slate-300 text-center w-20 text-slate-950">مبلغ اليوم الكامل</th>}
                            {printCols.dailyHalfPrice && <th className="p-2 border border-slate-300 text-center w-20 text-slate-950">مبلغ النص يوم</th>}
                            {printCols.socialSecurity && <th className="p-2 border border-slate-300 text-center text-slate-950">استقطاع الضمان (5%)</th>}

                            {printCols.netSalary && <th className="p-2 border border-slate-300 text-center font-bold w-28 net-salary-header text-slate-950">صافي القبض</th>}
                            {printCols.signatureBox && <th className="p-2 border border-slate-300 text-center w-36 text-slate-950">التوقيع وبصمة الإبهام</th>}
                          </tr>
                        </thead>
                        
                        <tbody className="divide-y divide-slate-300 text-slate-950">
                          {items.map((item, index) => {
                            const { emp, calculated } = item;

                            const pricing = emp.pricingOverride || (dept ? dept.pricing : {});
                            const dailyFullRate = Number(pricing?.dayPrice || 0) > 0 
                              ? Number(pricing?.dayPrice || 0) 
                              : (calculated.dayPrice > 0 ? calculated.dayPrice : (emp.isManager && dept?.managerSalary && Number(dept.managerSalary) > 0 ? Number(dept.managerSalary) / 30 : 0));
                            const dailyHalfRate = Number(pricing?.shiftHalf12Price || 0) > 0 
                              ? Number(pricing?.shiftHalf12Price || 0) 
                              : dailyFullRate / 2;
                            
                            // Allowance breakdown preview string
                            const allowancePreview = [];
                            if (calculated.allowanceDangerVal > 0) allowancePreview.push(`${getFieldLabel('allowanceDanger')}: ${formatIQD(calculated.allowanceDangerVal)}`);
                            if (calculated.allowanceMarriageVal > 0) allowancePreview.push(`${getFieldLabel('allowanceMarriage')}: ${formatIQD(calculated.allowanceMarriageVal)}`);
                            if (calculated.allowanceChildrenVal > 0) allowancePreview.push(`${getFieldLabel('allowanceChildren')}: ${formatIQD(calculated.allowanceChildrenVal)}`);
                            if (calculated.allowanceDegreeVal > 0) allowancePreview.push(`${getFieldLabel('allowanceDegree')}: ${formatIQD(calculated.allowanceDegreeVal)}`);
                            if (calculated.allowanceExtraDaysVal > 0) allowancePreview.push(`${getFieldLabel('allowanceExtraDays')}: ${formatIQD(calculated.allowanceExtraDaysVal)}`);
                            if (calculated.allowanceExtraHoursVal > 0) allowancePreview.push(`${getFieldLabel('allowanceExtraHours')}: ${formatIQD(calculated.allowanceExtraHoursVal)}`);
                            if (calculated.allowanceGeneralVal > 0) allowancePreview.push(`مكافآت أخرى: ${formatIQD(calculated.allowanceGeneralVal)}`);
                            if (calculated.allowanceEsnadVal > 0) allowancePreview.push(`${getFieldLabel('allowanceEsnad')}: ${formatIQD(calculated.allowanceEsnadVal)}`);
                            if (calculated.allowanceCustom1Val > 0) allowancePreview.push(`${getFieldLabel('allowanceCustom1')}: ${formatIQD(calculated.allowanceCustom1Val)}`);
                            if (calculated.allowanceCustom2Val > 0) allowancePreview.push(`${getFieldLabel('allowanceCustom2')}: ${formatIQD(calculated.allowanceCustom2Val)}`);
                            if (calculated.allowanceCustom3Val > 0) allowancePreview.push(`${getFieldLabel('allowanceCustom3')}: ${formatIQD(calculated.allowanceCustom3Val)}`);
                            if (calculated.allowanceCustom4Val > 0) allowancePreview.push(`${getFieldLabel('allowanceCustom4')}: ${formatIQD(calculated.allowanceCustom4Val)}`);
                            if (calculated.allowanceCustom5Val > 0) allowancePreview.push(`${getFieldLabel('allowanceCustom5')}: ${formatIQD(calculated.allowanceCustom5Val)}`);
                            const allowanceStr = allowancePreview.length > 0 ? allowancePreview.join(' | ') : 'لا يوجد';

                            // Deduction breakdown preview string
                            const deductionPreview = [];
                            if (calculated.deductionDaysVal > 0) deductionPreview.push(`غياب أيام: ${formatIQD(calculated.deductionDaysVal)}`);
                            if (calculated.deductionHoursVal > 0) deductionPreview.push(`تأخير ساعات: ${formatIQD(calculated.deductionHoursVal)}`);
                            if (calculated.deductionPenaltiesVal > 0) deductionPreview.push(`عقوبات: ${formatIQD(calculated.deductionPenaltiesVal)}`);
                            if (calculated.deductionOtherVal > 0) deductionPreview.push(`استقطاع آخر: ${formatIQD(calculated.deductionOtherVal)}`);
                            if (calculated.deductionPenaltyCustom1Val > 0) deductionPreview.push(`${getFieldLabel('deductionPenaltyCustom1')}: ${formatIQD(calculated.deductionPenaltyCustom1Val)}`);
                            if (calculated.deductionPenaltyCustom2Val > 0) deductionPreview.push(`${getFieldLabel('deductionPenaltyCustom2')}: ${formatIQD(calculated.deductionPenaltyCustom2Val)}`);
                            if (calculated.deductionPenaltyCustom3Val > 0) deductionPreview.push(`${getFieldLabel('deductionPenaltyCustom3')}: ${formatIQD(calculated.deductionPenaltyCustom3Val)}`);
                            if (calculated.deductionPenaltyCustom4Val > 0) deductionPreview.push(`${getFieldLabel('deductionPenaltyCustom4')}: ${formatIQD(calculated.deductionPenaltyCustom4Val)}`);
                            if (calculated.deductionPenaltyCustom5Val > 0) deductionPreview.push(`${getFieldLabel('deductionPenaltyCustom5')}: ${formatIQD(calculated.deductionPenaltyCustom5Val)}`);
                            const deductionStr = deductionPreview.length > 0 ? deductionPreview.join(' | ') : 'لا يوجد';

                            return (
                              <tr key={emp.id} className="hover:bg-white/5 sm:hover:bg-slate-50 transition-colors">
                                <td className="p-2.5 text-center font-mono text-slate-500 sm:text-slate-600 border border-white/5 sm:border-slate-300">
                                  {index + 1}
                                </td>

                                <td className="p-2.5 border border-white/5 sm:border-slate-300 text-center">
                                  <div className="font-bold text-white sm:text-black text-center">{emp.name}</div>
                                  <div className="flex flex-wrap items-center justify-center gap-1.5 mt-0.5">
                                    {emp.employeeCode && (
                                      <span className="text-[10px] text-cyan-400 sm:text-slate-500 font-mono font-bold" dir="ltr">
                                        #{emp.employeeCode}
                                      </span>
                                    )}
                                    {emp.isFingerprintExempt && (
                                      <span className="text-[9px] font-extrabold text-[#6366f1] sm:text-[#4338ca] bg-[#1e1b4b]/20 sm:bg-indigo-50 border border-indigo-500/20 rounded px-1.5 py-0.2 select-none leading-none">
                                        غير خاضع للبصمة
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {printCols.dept && (
                                  <td className="p-2.5 border border-white/5 sm:border-slate-300 text-center">
                                    {dept ? dept.name : 'مجهول'}
                                  </td>
                                )}

                                {printCols.position && (
                                  <td className="p-2.5 border border-white/5 sm:border-slate-300 font-sans text-center">
                                    {emp.position}
                                  </td>
                                )}

                                {printCols.workingDays && (
                                  <td className="p-2.5 text-center border border-white/5 sm:border-slate-300 font-mono">
                                    {emp.workingDays !== undefined ? emp.workingDays : 0} يوم
                                  </td>
                                )}

                                {printCols.workingHours && (
                                  <td className="p-2.5 text-center border border-white/5 sm:border-slate-300 font-mono">
                                    {emp.workingHours !== undefined ? emp.workingHours : 0} ساعة
                                  </td>
                                )}

                                {printCols.dayPrice && (
                                  <td className="p-2.5 text-center border border-white/5 sm:border-slate-300 font-mono text-[9.5px]">
                                    {formatIQD(calculated.dayPrice)}
                                  </td>
                                )}

                                {printCols.hourPrice && (
                                  <td className="p-2.5 text-center border border-white/5 sm:border-slate-300 font-mono text-[9.5px]">
                                    {formatIQD(calculated.hourPrice)}
                                  </td>
                                )}

                                {printCols.allowanceExtraDays && (
                                  <td className="p-2.5 text-center border border-white/5 sm:border-slate-300 font-mono text-[9.5px]">
                                    {formatIQD(calculated.allowanceExtraDaysVal)}
                                  </td>
                                )}

                                {printCols.allowanceExtraHours && (
                                  <td className="p-2.5 text-center border border-white/5 sm:border-slate-300 font-mono text-[9.5px]">
                                    {formatIQD(calculated.allowanceExtraHoursVal)}
                                  </td>
                                )}

                                {printCols.deductionDays && (
                                  <td className="p-2.5 text-center border border-white/5 sm:border-slate-300 font-mono text-[9.5px]">
                                    {formatIQD(calculated.deductionDaysVal)}
                                  </td>
                                )}

                                {printCols.deductionHours && (
                                  <td className="p-2.5 text-center border border-white/5 sm:border-slate-300 font-mono text-[9.5px]">
                                    {formatIQD(calculated.deductionHoursVal)}
                                  </td>
                                )}

                                {printCols.allowances && (
                                  <td className="p-2 text-center border border-white/5 sm:border-slate-300 text-[9px]">
                                    <span className="block font-mono font-semibold text-emerald-600 text-[10px] text-center">
                                      {formatIQD(calculated.allowanceDangerVal + calculated.allowanceMarriageVal + calculated.allowanceChildrenVal + calculated.allowanceDegreeVal + calculated.allowanceExtraDaysVal + calculated.allowanceExtraHoursVal + calculated.allowanceGeneralVal + calculated.allowanceEsnadVal + calculated.allowanceCustom1Val + calculated.allowanceCustom2Val + calculated.allowanceCustom3Val + calculated.allowanceCustom4Val + calculated.allowanceCustom5Val)}
                                    </span>
                                    <span className="block mt-0.5 truncate max-w-[200px] mx-auto text-center" title={allowanceStr}>
                                      {allowanceStr}
                                    </span>
                                  </td>
                                )}

                                {printCols.deductions && (
                                  <td className="p-2 text-center border border-white/5 sm:border-slate-300 text-[9px]">
                                    <span className="block font-mono font-semibold text-red-500 text-[10px] text-center">
                                      {formatIQD(calculated.deductionPenaltiesVal + calculated.deductionOtherVal + calculated.deductionPenaltyCustom1Val + calculated.deductionPenaltyCustom2Val + calculated.deductionPenaltyCustom3Val + calculated.deductionPenaltyCustom4Val + calculated.deductionPenaltyCustom5Val)}
                                    </span>
                                    <span className="block mt-0.5 truncate max-w-[180px] mx-auto text-center" title={deductionStr}>
                                      {deductionStr}
                                    </span>
                                  </td>
                                )}

                                {printCols.basicSalary && (
                                  <td className="p-2.5 text-center border border-white/5 sm:border-slate-300 font-mono">
                                    {formatIQD(calculated.basicSalary)}
                                  </td>
                                )}

                                {printCols.totalEarnings && (
                                  <td className="p-2.5 text-center border border-white/5 sm:border-slate-300 font-mono text-blue-800">
                                    {formatIQD(calculated.totalEarnings)}
                                  </td>
                                )}

                                {/* Shift Details */}
                                {printCols.shiftMorningCount && (
                                  <td className="p-1 border border-slate-300 text-center font-mono">{emp.shiftMorning || 0}</td>
                                )}
                                {printCols.shiftMorningPay && (
                                  <td className="p-1 border border-slate-300 text-center font-mono text-[9px]">{formatIQD(calculated.shiftsMorningPay)}</td>
                                )}
                                {printCols.shiftEveningCount && (
                                  <td className="p-1 border border-slate-300 text-center font-mono">{emp.shiftEvening || 0}</td>
                                )}
                                {printCols.shiftEveningPay && (
                                  <td className="p-1 border border-slate-300 text-center font-mono text-[9px]">{formatIQD(calculated.shiftsEveningPay)}</td>
                                )}
                                {printCols.shiftMiddleCount && (
                                  <td className="p-1 border border-slate-300 text-center font-mono">{emp.shiftMiddle || 0}</td>
                                )}
                                {printCols.shiftMiddlePay && (
                                  <td className="p-1 border border-slate-300 text-center font-mono text-[9px]">{formatIQD(calculated.shiftsMiddlePay)}</td>
                                )}
                                {printCols.shiftKhafarCount && (
                                  <td className="p-1 border border-slate-300 text-center font-mono">{emp.shiftKhafar || 0}</td>
                                )}
                                {printCols.shiftKhafarPay && (
                                  <td className="p-1 border border-slate-300 text-center font-mono text-[9px]">{formatIQD(calculated.shiftsKhafarPay)}</td>
                                )}
                                {printCols.shiftFull24Count && (
                                  <td className="p-1 border border-slate-300 text-center font-mono">{emp.shiftFull24 || 0}</td>
                                )}
                                {printCols.shiftFull24Pay && (
                                  <td className="p-1 border border-slate-300 text-center font-mono text-[9px]">{formatIQD(calculated.shiftsFull24Pay)}</td>
                                )}
                                {printCols.shiftHalf12Count && (
                                  <td className="p-1 border border-slate-300 text-center font-mono">{emp.shiftHalf12 || 0}</td>
                                )}
                                {printCols.shiftHalf12Pay && (
                                  <td className="p-1 border border-slate-300 text-center font-mono text-[9px]">{formatIQD(calculated.shiftsHalf12Pay)}</td>
                                )}

                                {/* Callouts & Daily */}
                                {printCols.callouts && (
                                  <td className="p-2.5 text-center border border-white/5 sm:border-slate-300 font-mono">
                                    {emp.callouts || 0}
                                  </td>
                                )}
                                {printCols.calloutsPay && (
                                  <td className="p-2.5 text-center border border-white/5 sm:border-slate-300 font-mono text-[9.5px]">
                                    {formatIQD(calculated.calloutsPay)}
                                  </td>
                                )}
                                {printCols.dailyFullPrice && (
                                  <td className="p-2.5 text-center border border-white/5 sm:border-slate-300 font-mono text-[9.5px]">
                                    {formatIQD(dailyFullRate)}
                                  </td>
                                )}
                                {printCols.dailyHalfPrice && (
                                  <td className="p-2.5 text-center border border-white/5 sm:border-slate-300 font-mono text-[9.5px]">
                                    {formatIQD(dailyHalfRate)}
                                  </td>
                                )}
                                {printCols.socialSecurity && (
                                  <td className="p-2.5 text-center border border-white/5 sm:border-slate-300 font-mono text-[9.5px] text-red-600 font-bold">
                                    {calculated.socialSecurityVal ? formatIQD(calculated.socialSecurityVal) : '0'}
                                  </td>
                                )}

                                {printCols.netSalary && (
                                  <td className="p-2.5 text-center font-bold border border-white/5 sm:border-slate-300 font-mono text-emerald-700 sm:text-slate-900 bg-slate-50 net-salary-cell" dir="ltr">
                                    {formatIQD(calculated.netSalary)}
                                  </td>
                                )}

                                {printCols.signatureBox && (
                                  <td className="p-2.5 border border-white/5 sm:border-slate-300 bg-slate-950/25 sm:bg-slate-50 text-center relative h-12 w-36">
                                    {printFooterOpts.showFingerNote && (
                                      <span className="text-[8px] text-slate-500/40 select-none absolute bottom-1 right-2 scale-90">
                                        توقيع أو البصمة الفورية
                                      </span>
                                    )}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* If lump-sum department: Render the beautiful official receipt box */}
                  {(dept.salaryStructureType === 'lump_sum' || dept.isLumpSum || dept.salaryType === 'lumpSum') && (
                    <div className="mt-6 p-6 border-2 border-dashed border-indigo-500 sm:border-slate-400 rounded-3xl bg-indigo-950/15 sm:bg-slate-50 text-right space-y-4 shadow-sm break-inside-avoid page-break-inside-avoid max-w-3xl mx-auto">
                      <div className="flex items-center gap-2 border-b border-indigo-500 sm:border-slate-300 pb-2">
                        <span className="text-lg">📜</span>
                        <h4 className="font-extrabold text-indigo-300 sm:text-indigo-900 text-xs sm:text-sm">سند ووصل تسليم الراتب القطعي وإمضاء المخول بالتبويب</h4>
                      </div>
                      
                      <p className="text-xs sm:text-sm text-slate-300 sm:text-slate-800 leading-relaxed font-semibold">
                        تم تسليم المخول <strong className="text-amber-300 sm:text-slate-950 font-black text-sm px-2 py-0.5 rounded bg-white/5 sm:bg-slate-200">({dept.lumpSumRepresentative || 'المخول الرسمي للقسم'})</strong> راتباً كاملاً عن قسم <strong className="text-white sm:text-slate-950 font-extrabold">({dept.name})</strong>، والمستحق ماليًا بمبلغ وقدره <strong className="text-emerald-400 sm:text-emerald-900 font-mono font-black text-sm px-1.5 py-0.5 rounded bg-emerald-950/40 sm:bg-emerald-50 border border-emerald-500/40 sm:border-emerald-300 inline-block">{formatIQD(dept.lumpSumSalary || 0)}</strong>، وذلك عن كشف الرواتب والأجور لشهر <strong className="text-indigo-300 sm:text-indigo-950 font-extrabold">({resolvedMonthLabel})</strong> وتاريخ استحقاق ومطابقة السند المرفوع <strong className="text-slate-400 sm:text-slate-600 font-mono font-bold">({formattedTodayDate})</strong>. وتحت هذا التعهد؛ يدرج إمضاء المعني محاسبياً.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 pt-3 text-xs text-slate-300 sm:text-slate-800">
                        <div className="border border-white/5 sm:border-slate-200 p-2.5 rounded-xl bg-slate-950/30 sm:bg-white space-y-1">
                          <p className="text-[10px] text-slate-400 sm:text-slate-500 font-medium">الشخص المخول بالاستلام والقبض رسميًا:</p>
                          <p className="font-black text-white sm:text-slate-950">{dept.lumpSumRepresentative || 'المخول بالاستلام'}</p>
                        </div>
                        <div className="border border-white/5 sm:border-slate-200 p-2.5 rounded-xl bg-slate-950/30 sm:bg-white flex flex-col justify-between h-14">
                          <p className="text-[10px] text-slate-400 sm:text-slate-500 font-medium">توقيع وبصمة إبهام المخول الحية:</p>
                          <div className="h-4 border-b border-dotted border-slate-550/40"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Combined summary and official signatures footer envelope - Guaranteed to avoid breaking onto separate blank sheets */}
        <div className="space-y-8 break-inside-avoid page-break-inside-avoid print:break-inside-avoid print:page-break-inside-avoid">
          {/* Department Summary Section */}
        {departmentFinancialSummary.length > 0 && (
          <div className="pt-8 mt-6 border-t border-slate-700/80 sm:border-slate-300 space-y-3 break-inside-avoid page-break-inside-avoid">
            <div className="flex justify-between items-center pb-2 border-b border-slate-700/80 sm:border-slate-300/60">
              <h2 className="text-[11px] sm:text-xs font-black text-indigo-400 sm:text-slate-900 bg-white/5 sm:bg-slate-100 px-3 py-1.5 rounded-lg border border-white/10 sm:border-slate-300">
                {language === 'ar' ? 'خلاصة وهيكلية الرواتب التفصيلية للأقسام المحددة' : 'Financial Structure Summary Across Departments'}
              </h2>
              <span className="text-[10px] font-mono text-slate-500">مستشفى الفرح الأهلي</span>
            </div>

            <table className="print-table w-full text-center text-[10px] sm:text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800/20 sm:bg-slate-100 border-b border-white/10 sm:border-slate-300 text-slate-300 sm:text-slate-900 font-bold text-center">
                  <th className="p-2 border border-slate-700/80 sm:border-slate-400 text-center">اسم القسم الاستشفائي</th>
                  <th className="p-2 border border-slate-700/80 sm:border-slate-400 text-center">مجموع الرواتب الأساسية</th>
                  <th className="p-2 border border-slate-700/80 sm:border-slate-400 text-center">إجمالي المخصصات والإضافات</th>
                  <th className="p-1 border border-slate-700/80 sm:border-slate-400 text-center w-20">نسبة الإضافة</th>
                  <th className="p-2 border border-slate-700/80 sm:border-slate-400 text-center">إجمالي الخصومات والاستقطاع</th>
                  <th className="p-1 border border-slate-700/80 sm:border-slate-400 text-center w-20">نسبة الخصم</th>
                  <th className="p-2 border border-slate-700/80 sm:border-slate-400 text-center bg-emerald-950/20 sm:bg-slate-200">صافي مستحقات القسم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 sm:divide-slate-300 text-slate-300 sm:text-black">
                {departmentFinancialSummary.map((dept) => {
                  const addPct = Math.round((dept.additionsSum / (dept.basicSum || 1)) * 100);
                  const dedPct = Math.round((dept.deductionsSum / (dept.basicSum || 1)) * 100);
                  return (
                    <tr key={dept.id} className="hover:bg-white/5 sm:hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 border border-white/5 sm:border-slate-300 font-bold text-center text-white sm:text-slate-900">{dept.deptName}</td>
                      <td className="p-2.5 border border-white/5 sm:border-slate-300 font-mono text-center">{formatIQD(dept.basicSum)}</td>
                      <td className="p-2.5 border border-white/5 sm:border-slate-300 font-mono text-center text-emerald-400 sm:text-emerald-700 font-semibold font-bold">+{formatIQD(dept.additionsSum)}</td>
                      <td className="p-2.5 border border-white/5 sm:border-slate-300 font-mono text-center text-emerald-400 sm:text-emerald-750 bg-emerald-950/10 sm:bg-emerald-50/20 font-bold">{addPct}%</td>
                      <td className="p-2.5 border border-white/5 sm:border-slate-300 font-mono text-center text-red-400 sm:text-red-700 font-bold">-{formatIQD(dept.deductionsSum)}</td>
                      <td className="p-2.5 border border-white/5 sm:border-slate-300 font-mono text-center text-red-400 sm:text-red-750 bg-red-950/10 sm:bg-red-50/20 font-bold">{dedPct}%</td>
                      <td className="p-2.5 border border-white/5 sm:border-slate-300 font-mono text-center font-black bg-emerald-950/25 sm:bg-slate-100/50 text-emerald-400 sm:text-slate-900 font-bold">{formatIQD(dept.netSum)}</td>
                    </tr>
                  );
                })}
                {/* Grand totals row */}
                <tr className="bg-slate-900/40 sm:bg-slate-100 font-bold border-t-2 border-slate-700 sm:border-slate-950 grand-total-row">
                  <td className="p-2.5 border border-white/10 sm:border-slate-400 text-center text-white sm:text-slate-900 font-black">المجموع الكلي النهائي لكافة الأقسام المذكورة</td>
                  <td className="p-2.5 border border-white/10 sm:border-slate-400 font-mono text-center font-black text-white sm:text-slate-900">
                    {formatIQD(departmentFinancialSummary.reduce((sum, d) => sum + d.basicSum, 0))}
                  </td>
                  <td className="p-2.5 border border-white/10 sm:border-slate-400 font-mono text-center font-black text-emerald-400 sm:text-emerald-850">
                    +{formatIQD(departmentFinancialSummary.reduce((sum, d) => sum + d.additionsSum, 0))}
                  </td>
                  <td className="p-2.5 border border-white/10 sm:border-slate-400 font-mono text-center text-emerald-400 sm:text-emerald-850">
                    {Math.round((departmentFinancialSummary.reduce((sum, d) => sum + d.additionsSum, 0) / (departmentFinancialSummary.reduce((sum, d) => sum + d.basicSum, 0) || 1)) * 100)}%
                  </td>
                  <td className="p-2.5 border border-white/10 sm:border-slate-400 font-mono text-center font-black text-red-400 sm:text-red-850 font-semibold">
                    -{formatIQD(departmentFinancialSummary.reduce((sum, d) => sum + d.deductionsSum, 0))}
                  </td>
                  <td className="p-2.5 border border-white/10 sm:border-slate-400 font-mono text-center text-red-400 sm:text-red-850">
                    {Math.round((departmentFinancialSummary.reduce((sum, d) => sum + d.deductionsSum, 0) / (departmentFinancialSummary.reduce((sum, d) => sum + d.basicSum, 0) || 1)) * 100)}%
                  </td>
                  <td className="p-2.5 border border-white/10 sm:border-slate-400 font-mono text-center font-black bg-emerald-950/40 sm:bg-slate-200 text-emerald-300 sm:text-slate-950 text-xs sm:text-sm shadow-sm">
                    {formatIQD(departmentFinancialSummary.reduce((sum, d) => sum + d.netSum, 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Report Footer summary logic */}
        {printFooterOpts.showSystemSummary && (
          <div className="pt-4 border-t border-slate-800/80 sm:border-slate-450 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-right text-slate-400 sm:text-slate-800 space-y-1">
              <p className="text-[11px]">عدد الكوادر المنتجة في الكشف المحدد: <span className="text-white sm:text-black font-bold font-mono text-xs">{printItems.length} موظفاً</span></p>
              {printCols.basicSalary && (
                <p className="text-[11px]">مجموع الرواتب الأساسية للكشف: <span className="text-white sm:text-black font-semibold font-mono">{formatIQD(totalBasicSelected)}</span></p>
              )}
              <p className="text-xs text-slate-300 sm:text-black font-bold flex items-center gap-1">
                مجموع صافي القبض الإجمالي المستحق للصرف:
                <span className="text-blue-400 sm:text-blue-800 font-mono text-sm sm:text-base font-bold" dir="ltr">
                  {formatIQD(totalNetSelected)}
                </span>
              </p>
            </div>

            <div className="bg-white/5 sm:bg-slate-100 border border-white/5 sm:border-slate-300 p-3 rounded-2xl text-center text-[10px] text-slate-400 sm:text-slate-700 max-w-lg space-y-1">
              <p className="text-white sm:text-black font-medium text-[11px]">تم تدقيق الكشف ومطابقته محاسبياً مع نظام مستشفى الفرح الأهلي.</p>
              <p className="text-slate-500 text-[8px] font-sans">
                حقوق نظام الرواتب الموحد محفوظة: مسؤول النظام المهندس محمد جاسم محمد ابراهيم | هاتف: 07836885808
              </p>
            </div>
          </div>
        )}

        {/* Action Signature rows at bottom */}
        {printFooterOpts.showOfficialSignatures && (
          <div className="grid grid-cols-3 gap-6 pt-10 text-center text-xs text-slate-400 sm:text-slate-800 font-sans">
            <div className="space-y-10">
              <p className="font-bold">محاسب الرواتب المالي</p>
              <div className="border-t border-slate-755/90 w-32 mx-auto pt-1.5 text-[9px] text-slate-500">
                التوقيع والتاريخ
              </div>
            </div>
            <div className="space-y-10">
              <p className="font-bold">المدير المالي والتدقيق</p>
              <div className="border-t border-slate-755/90 w-32 mx-auto pt-1.5 text-[9px] text-slate-500">
                التوقيع والتاريخ
              </div>
            </div>
            <div className="space-y-10">
              <p className="font-bold">الختم والمصادقة الرسمية</p>
              <div className="border-t border-slate-755/90 w-32 mx-auto pt-1.5 text-[9px] text-slate-500 flex flex-col gap-0.5">
                <span>توقيع مدير عام مستشفى الفرح</span>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* File Save Location Dialog wrapper for high-fidelity PDF exports */}
      <AnimatePresence>
        {showConfirmPdfModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-center items-center p-4 font-sans text-right">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="glass-panel border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center gap-3 text-red-400 justify-start" dir="rtl">
                <Building2 className="w-5 h-5 shrink-0 text-red-400" />
                <h3 className="text-sm font-bold text-white">خيارات تصدير وطباعة كشف الـ PDF المالي</h3>
              </div>
              
              <div className="space-y-4" dir="rtl">
                <div className="bg-amber-950/40 p-3.5 rounded-xl border border-amber-500/30 space-y-1.5 text-right">
                  <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                    ⚠️ تنويه هام لسلامة اللغة العربية والوضوح:
                  </span>
                  <p className="text-[10.5px] text-amber-200/90 leading-relaxed leading-5">
                    عملية <strong>التصدير المباشر</strong> الحالية تقوم بتحويل الصفحة لصورة مرسومة، مما قد يسبب ظهور الحروف العربية مقطعة أو غير متصلة (بسبب قيود المتصفحات في تحويل الرسوم).
                  </p>
                  <p className="text-[10.5px] text-amber-150 font-bold leading-relaxed mt-1">
                    للحصول على تقرير مالي PDF ممتاز، وبحروف متصلة وصحيحة 100%، ننصح بشدة بالضغط على زر <strong className="text-white bg-emerald-600 px-1 py-0.5 rounded">الحفظ عبر طباعة المتصفح</strong>، ومن ثم اختيار وجهة الطباعة <strong className="text-white">"حفظ بتنسيق PDF" (Save as PDF)</strong>.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-100 font-bold">اسم مستند التصدير والحفظ:</label>
                  <input
                    type="text"
                    value={pdfFilenameInput}
                    onChange={(e) => setPdfFilenameInput(e.target.value)}
                    placeholder="مثال: سجل_رواتب_مستشفى_الفرح_قسم_الباطنية"
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs font-mono font-bold focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="bg-[#050b18] p-3 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[10px] font-bold text-slate-350 flex items-center gap-1">
                    📁 تخصيص مكان الحفظ:
                  </span>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    يمكنك تمكين خيار "السؤال عن مكان حفظ كل ملف قبل تنزيله" من إعدادات المتصفح للتحكم بالمسار والمجلد يدوياً.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmPdfModal(false)}
                  className="px-4 py-2 text-xs text-slate-300 border border-slate-700/85 hover:bg-slate-850 rounded-lg cursor-pointer transition-all"
                >
                  إلغاء
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmPdfModal(false);
                    // Standard triggerActualPdfExport
                    triggerActualPdfExport(pdfFilenameInput);
                  }}
                  className="px-4 py-2 text-xs text-slate-400 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg cursor-pointer transition-all"
                >
                  التصدير المباشر بالرغم من ذلك
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmPdfModal(false);
                    handlePrint();
                  }}
                  className="px-4 py-2 text-xs text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg cursor-pointer font-bold transition-all shadow-md shadow-emerald-950/20 flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  الحفظ عبر طباعة المتصفح (دقة 100%)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
