import React, { useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { showToast } from '../lib/toast';
import {
  TrendingUp,
  Users,
  DollarSign,
  Briefcase,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon,
  Sparkles,
  Calendar,
  CalendarDays,
  CalendarRange,
  Clock,
  RotateCcw,
  CheckCircle2,
  FolderArchive,
  PlusCircle,
  Info,
  ChevronDown,
  Printer,
  Download,
  Trash2,
  Lock,
  ArrowRight,
  History,
  X,
  AlertCircle
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { Department, Employee, CalculatedPayroll, ArchivedMonth } from '../types';
import { TRANSLATIONS, formatCurrency, getSystemDate } from '../lib/translations';
import { calculateEmployeePayroll } from '../data';
import HospitalLogo from './HospitalLogo';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface DashboardOverviewProps {
  departments: Department[];
  employees: Employee[];
  payrollList: CalculatedPayroll[];
  archive: ArchivedMonth[];
  onLoadDemoData: () => void;
  onClearAll: () => void;
  onDeleteArchiveMonth?: (monthId: string) => void;
  onUpdateEmployees?: (employees: Employee[]) => void;
  onSaveDepartments?: (departments: Department[]) => void;
  onUpdateArchive?: (archive: ArchivedMonth[]) => void;
  timeSettings?: any;
  language: 'ar' | 'en';
}

export default function DashboardOverview({
  departments,
  employees,
  payrollList,
  archive,
  onLoadDemoData,
  onClearAll,
  onDeleteArchiveMonth,
  onUpdateEmployees,
  onSaveDepartments,
  onUpdateArchive,
  timeSettings,
  language = 'ar',
}: DashboardOverviewProps) {
  const t = TRANSLATIONS[language];
  const [showPrintPreviewModal, setShowPrintPreviewModal] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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

      const hRad = (H * Math.PI) / 180;
      const lab_a = C * Math.cos(hRad);
      const lab_b = C * Math.sin(hRad);

      const l_ = L + 0.3963377774 * lab_a + 0.2158037573 * lab_b;
      const m_ = L - 0.1055613458 * lab_a - 0.0638541728 * lab_b;
      const s_ = L - 0.0894841775 * lab_a - 1.2914855480 * lab_b;

      const l = Math.max(0, l_ * l_ * l_);
      const m = Math.max(0, m_ * m_ * m_);
      const s = Math.max(0, s_ * s_ * s_);

      const rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
      const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
      const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147014 * s;

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

      if (changed) itemsToRestore.push(restoreItem);
      Array.from(node.children).forEach((child) => recurse(child as HTMLElement));
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

  const handleDownloadPDF = () => {
    let element = document.getElementById('printable-departments-summary');
    if (!element) {
      setShowPrintPreviewModal(true);
      setTimeout(() => {
        handleDownloadPDF();
      }, 400);
      return;
    }

    setIsGeneratingPdf(true);
    showToast(
      language === 'ar' 
        ? 'جاري إنشاء وتجهيز ملف الـ PDF... يرجى الانتظار ثواني.' 
        : 'Generating PDF file... please wait a moment.',
      'info'
    );

    // Create a temporary fixed container at top 0, left 0 with direction: ltr to prevent html2canvas RTL negative X offset
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.top = '0';
    tempContainer.style.left = '0';
    tempContainer.style.width = '750px';
    tempContainer.style.zIndex = '999999';
    tempContainer.style.backgroundColor = '#ffffff';
    tempContainer.style.color = '#0f172a';
    tempContainer.style.direction = 'ltr'; // Outer wrapper MUST be ltr so x=0 is top-left
    tempContainer.style.fontFamily = "Cairo, Tahoma, Arial, sans-serif";
    tempContainer.style.overflow = 'visible';
    tempContainer.style.height = 'auto';
    tempContainer.style.boxSizing = 'border-box';
    tempContainer.style.margin = '0';
    tempContainer.style.padding = '0';

    const clone = element.cloneNode(true) as HTMLElement;
    clone.id = 'printable-departments-summary-pdf-clone';
    clone.style.width = '750px';
    clone.style.maxWidth = '750px';
    clone.style.minHeight = 'auto';
    clone.style.height = 'auto';
    clone.style.margin = '0 auto';
    clone.style.padding = '20px 22px';
    clone.style.boxSizing = 'border-box';
    clone.style.boxShadow = 'none';
    clone.style.border = 'none';
    clone.style.direction = 'rtl'; // Inner element is RTL
    clone.style.backgroundColor = '#ffffff';

    // Remove letter-spacing / tracking styles that scramble Arabic in html2canvas
    const allElements = clone.querySelectorAll<HTMLElement>('*');
    allElements.forEach((el) => {
      el.style.letterSpacing = 'normal';
      el.style.wordSpacing = 'normal';
      el.style.textShadow = 'none';
      el.style.fontFamily = "Cairo, Tahoma, Arial, sans-serif";
      el.style.boxSizing = 'border-box';
      if (el.classList.contains('tracking-tight') || el.classList.contains('tracking-tighter')) {
        el.classList.remove('tracking-tight', 'tracking-tighter');
      }
    });

    // Enforce strict table fit inside clone
    const table = clone.querySelector('table');
    if (table) {
      table.style.width = '100%';
      table.style.maxWidth = '100%';
      table.style.boxSizing = 'border-box';
      table.style.tableLayout = 'fixed';
      table.style.margin = '12px 0';
      table.style.borderCollapse = 'collapse';
    }

    const ths = clone.querySelectorAll<HTMLElement>('th');
    ths.forEach((th) => {
      th.style.boxSizing = 'border-box';
      th.style.overflow = 'hidden';
      th.style.wordBreak = 'break-word';
      th.style.textAlign = 'center';
    });

    const tds = clone.querySelectorAll<HTMLElement>('td');
    tds.forEach((td) => {
      td.style.boxSizing = 'border-box';
      td.style.overflow = 'hidden';
      td.style.wordBreak = 'break-word';
      td.style.textAlign = 'center';
    });

    tempContainer.appendChild(clone);
    document.body.appendChild(tempContainer);

    const restoredItems = convertSubtreeColors(clone);

    const titleText = language === 'ar' 
      ? 'تقرير_رواتب_الأقسام_مستشفى_الفرح' 
      : 'Departmental_Payroll_Report';

    const opt = {
      margin:       [8, 6, 8, 6] as [number, number, number, number],
      filename:     `${titleText}_${new Date().toISOString().slice(0,10)}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true, 
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        width: 750,
        windowWidth: 750
      },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      pagebreak:    { mode: ['css', 'legacy'], avoid: ['tr', '.signature-and-footer-block'] }
    };

    setTimeout(() => {
      try {
        const html2pdfFunc = (html2pdf as any)?.default || html2pdf;
        html2pdfFunc()
          .from(clone)
          .set(opt)
          .save()
          .then(() => {
            restoreSubtreeColors(restoredItems);
            if (document.body.contains(tempContainer)) {
              document.body.removeChild(tempContainer);
            }
            setIsGeneratingPdf(false);
            showToast(
              language === 'ar'
                ? 'تم تصدير وتحميل التقرير كملف PDF بنجاح!'
                : 'Report exported and downloaded as PDF successfully!',
              'success'
            );
          })
          .catch((err: any) => {
            console.error('PDF export error:', err);
            restoreSubtreeColors(restoredItems);
            if (document.body.contains(tempContainer)) {
              document.body.removeChild(tempContainer);
            }
            setIsGeneratingPdf(false);
            showToast(
              language === 'ar'
                ? 'حدث خطأ أثناء تصدير ملف PDF.'
                : 'An error occurred during PDF export.',
              'error'
            );
          });
      } catch (e) {
        console.error('PDF generation crash:', e);
        restoreSubtreeColors(restoredItems);
        if (document.body.contains(tempContainer)) {
          document.body.removeChild(tempContainer);
        }
        setIsGeneratingPdf(false);
        showToast(language === 'ar' ? 'تعذر تصدير PDF.' : 'PDF generation failed.', 'error');
      }
    }, 250);
  };

  const triggerPdfDownloadFromDashboard = () => {
    handleDownloadPDF();
  };

  // Retrieve hospital profile for printing
  const hospitalProfile = useMemo(() => {
    try {
      const localProfileStr = typeof window !== 'undefined' ? localStorage.getItem('alfarrah_hospital_profile') : null;
      if (localProfileStr) {
        return JSON.parse(localProfileStr);
      }
    } catch (e) {
      console.error(e);
    }
    return {
      nameAr: 'مستشفى الفرح الأهلي',
      nameEn: 'Al-Farrah Private Hospital',
      addressAr: 'العراق، البصرة',
      addressEn: 'Basra, Iraq',
      phone: '07836885808'
    };
  }, []);

  // Arabic Month names dictionary for automatic cycle naming
  const ARABIC_MONTH_NAMES = [
    'شهر كانون الثاني / يناير',
    'شهر شباط / فبراير',
    'شهر آذار / مارس',
    'شهر نيسان / أبريل',
    'شهر أيار / مايو',
    'شهر حزيران / يونيو',
    'شهر تموز / يوليو',
    'شهر آب / أغسطس',
    'شهر أيلول / سبتمبر',
    'شهر تشرين الأول / أكتوبر',
    'شهر تشرين الثاني / نوفمبر',
    'شهر كانون الأول / ديسمبر',
  ];

  // Active/Current Month Label state (e.g. شهر تموز / يوليو 2026)
  const [activeCycleMonthLabel, setActiveCycleMonthLabel] = useState<string>(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('alfarrah_current_payroll_cycle_name')) || 'شهر تموز / يوليو 2026';
  });

  // Selected Month to view in the Dashboard ('current' or archived month ID)
  const [selectedDashboardMonth, setSelectedDashboardMonth] = useState<string>('current');

  // Automatic Day 20 Rollover state (enabled by default)
  const [autoCycleEnabled, setAutoCycleEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('alfarrah_auto_cycle_day20_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  // Modal states for New Month Cycle / Archive
  const [showNewMonthModal, setShowNewMonthModal] = useState(false);
  const [newCycleMonthName, setNewCycleMonthName] = useState('شهر آب / أغسطس 2026');
  const [autoArchiveCurrentBeforeReset, setAutoArchiveCurrentBeforeReset] = useState(true);
  const [isProcessingNewCycle, setIsProcessingNewCycle] = useState(false);

  // Automatic Day 20 Auto-Rollover & Statistics Zeroing Check
  useEffect(() => {
    if (!autoCycleEnabled || !onUpdateEmployees || employees.length === 0) return;

    try {
      const now = timeSettings ? getSystemDate(timeSettings) : new Date();
      const currentDay = now.getDate();
      const currentMonthIdx = now.getMonth(); // 0 to 11
      const currentYear = now.getFullYear();

      // Only perform rollover when current day is on or after the 20th of the month
      if (currentDay >= 20) {
        const cycleKey = `cycle-${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}`;
        const lastCycleKey = typeof window !== 'undefined' ? localStorage.getItem('alfarrah_last_auto_cycle_key') : null;

        // Check if this month's 20th cycle hasn't been rolled over yet
        if (lastCycleKey !== cycleKey) {
          const expectedMonthName = `${ARABIC_MONTH_NAMES[currentMonthIdx]} ${currentYear}`;
          
          // 1. Archive current snapshot automatically before resetting
          if (onUpdateArchive) {
            const snaps: CalculatedPayroll[] = employees.map((emp) => {
              const dept = departments.find((d) => d.id === emp.departmentId);
              return calculateEmployeePayroll(emp, dept);
            });

            const netSum = snaps.reduce((sum, s) => sum + s.netSalary, 0);
            const earningsSum = snaps.reduce((sum, s) => sum + s.totalEarnings, 0);
            const deductionsSum = snaps.reduce((sum, s) => sum + s.totalDeductions, 0);

            const archiveId = `auto-month-${Date.now()}`;
            const newArchiveEntry: ArchivedMonth = {
              monthId: archiveId,
              monthLabel: activeCycleMonthLabel || expectedMonthName,
              employeesSnapshot: JSON.parse(JSON.stringify(employees)),
              departmentsSnapshot: JSON.parse(JSON.stringify(departments)),
              payrollsSnapshot: snaps,
              totalNetPaid: netSum,
              totalEarningsSum: earningsSum,
              totalDeductionsSum: deductionsSum,
              totalNetSalary: netSum,
              totalEmployeesCount: employees.length,
              timestamp: now.toISOString(),
              archivedAt: now.toISOString(),
            };

            const targetLabel = activeCycleMonthLabel || expectedMonthName;
            const existingEntry = (archive || []).find((a) => a.monthLabel === targetLabel);
            // If existing has valid calculated net salary and current is zero, preserve the existing rich one
            if (existingEntry && (existingEntry.totalNetSalary || 0) > 0 && netSum === 0) {
              // preserve existing rich archive
            } else {
              const existingFiltered = (archive || []).filter((a) => a.monthLabel !== targetLabel);
              onUpdateArchive([...existingFiltered, newArchiveEntry]);
            }
          }

          // 2. Reset dynamic monthly variables to 0 for all employees
          const zeroedEmployees: Employee[] = employees.map((emp) => ({
            ...emp,
            workingDays: 0,
            workingHours: 0,
            shiftMorning: 0,
            shiftEvening: 0,
            shiftMiddle: 0,
            shiftFull24: 0,
            shiftHalf12: 0,
            shiftKhafar: 0,
            callouts: 0,
            allowanceExtraDays: 0,
            allowanceExtraHours: 0,
            allowanceGeneral: 0,
            deductionDays: 0,
            deductionHours: 0,
            deductionPenalties: 0,
            deductionOther: 0,
            previousMonthOver: 0,
          }));

          onUpdateEmployees(zeroedEmployees);

          // 3. Reset department payroll completion checkmarks for the fresh new cycle
          if (onSaveDepartments && departments.length > 0) {
            const resetDepartments = departments.map((d) => ({
              ...d,
              isPayrollCompleted: false,
            }));
            onSaveDepartments(resetDepartments);
          }

          setActiveCycleMonthLabel(expectedMonthName);
          if (typeof window !== 'undefined') {
            localStorage.setItem('alfarrah_current_payroll_cycle_name', expectedMonthName);
            localStorage.setItem('alfarrah_last_auto_cycle_key', cycleKey);
          }

          showToast(
            language === 'ar'
              ? `🚀 يوم 20 بالشهر: تم فتح دورة جديدة تلقائياً (${expectedMonthName}) وتصفير الإحصائيات مع حفظ الشهر السابق بالأرشيف!`
              : `🚀 Day 20: New cycle (${expectedMonthName}) auto-started with reset stats!`,
            'success'
          );
        }
      }
    } catch (e) {
      console.error('Auto rollover error:', e);
    }
  }, [timeSettings, autoCycleEnabled, employees, departments, archive, activeCycleMonthLabel, language, onUpdateArchive, onUpdateEmployees, onSaveDepartments]);

  // Selected archive entry when browsing past months
  const selectedArchiveItem = useMemo(() => {
    if (selectedDashboardMonth === 'current') return null;
    return (archive || []).find((a) => a.monthId === selectedDashboardMonth || a.monthLabel === selectedDashboardMonth) || null;
  }, [archive, selectedDashboardMonth]);

  // Effective data based on whether viewing current live month or historical archived month
  const effectiveEmployees = useMemo(() => {
    if (selectedArchiveItem && selectedArchiveItem.employeesSnapshot && selectedArchiveItem.employeesSnapshot.length > 0) {
      return selectedArchiveItem.employeesSnapshot;
    }
    return employees;
  }, [selectedArchiveItem, employees]);

  const effectiveDepartments = useMemo(() => {
    if (selectedArchiveItem && selectedArchiveItem.departmentsSnapshot && selectedArchiveItem.departmentsSnapshot.length > 0) {
      return selectedArchiveItem.departmentsSnapshot;
    }
    return departments;
  }, [selectedArchiveItem, departments]);

  const effectivePayrollList = useMemo(() => {
    if (selectedArchiveItem && selectedArchiveItem.payrollsSnapshot && selectedArchiveItem.payrollsSnapshot.length > 0) {
      return selectedArchiveItem.payrollsSnapshot;
    }
    return payrollList;
  }, [selectedArchiveItem, payrollList]);

  // Handler to start a new month cycle and optionally archive the previous month and reset variables to zero
  const handleStartNewMonthCycle = () => {
    if (!onUpdateEmployees) {
      showToast(language === 'ar' ? 'تنبيه: دالة التحديث غير متوفرة.' : 'Update handler unavailable', 'error');
      return;
    }

    setIsProcessingNewCycle(true);

    try {
      // 1. If archiving is enabled, save current snapshot to archive
      if (autoArchiveCurrentBeforeReset && onUpdateArchive && employees.length > 0) {
        const snaps: CalculatedPayroll[] = employees.map((emp) => {
          const dept = departments.find((d) => d.id === emp.departmentId);
          return calculateEmployeePayroll(emp, dept);
        });

        const netSum = snaps.reduce((sum, s) => sum + s.netSalary, 0);
        const earningsSum = snaps.reduce((sum, s) => sum + s.totalEarnings, 0);
        const deductionsSum = snaps.reduce((sum, s) => sum + s.totalDeductions, 0);

        const currentMonthId = `month-${Date.now()}`;
        const newArchiveEntry: ArchivedMonth = {
          monthId: currentMonthId,
          monthLabel: activeCycleMonthLabel,
          employeesSnapshot: JSON.parse(JSON.stringify(employees)),
          departmentsSnapshot: JSON.parse(JSON.stringify(departments)),
          payrollsSnapshot: snaps,
          totalNetPaid: netSum,
          totalEarningsSum: earningsSum,
          totalDeductionsSum: deductionsSum,
          timestamp: (timeSettings ? getSystemDate(timeSettings) : new Date()).toISOString(),
        };

        const existingFiltered = (archive || []).filter((a) => a.monthLabel !== activeCycleMonthLabel);
        onUpdateArchive([...existingFiltered, newArchiveEntry]);
      }

      // 2. Reset dynamic monthly variables to 0 for all employees
      const zeroedEmployees: Employee[] = employees.map((emp) => ({
        ...emp,
        workingDays: 0,
        workingHours: 0,
        shiftMorning: 0,
        shiftEvening: 0,
        shiftMiddle: 0,
        shiftFull24: 0,
        shiftHalf12: 0,
        shiftKhafar: 0,
        callouts: 0,
        allowanceExtraDays: 0,
        allowanceExtraHours: 0,
        allowanceGeneral: 0,
        deductionDays: 0,
        deductionHours: 0,
        deductionPenalties: 0,
        deductionOther: 0,
        previousMonthOver: 0,
      }));

      onUpdateEmployees(zeroedEmployees);

      // 3. Reset department payroll completion checkmarks for the fresh new cycle
      if (onSaveDepartments && departments.length > 0) {
        const resetDepartments = departments.map((d) => ({
          ...d,
          isPayrollCompleted: false,
        }));
        onSaveDepartments(resetDepartments);
      }

      // 4. Update active cycle label
      const nextMonthName = newCycleMonthName.trim() || (language === 'ar' ? 'شهر جديد' : 'New Month');
      setActiveCycleMonthLabel(nextMonthName);
      if (typeof window !== 'undefined') {
        localStorage.setItem('alfarrah_current_payroll_cycle_name', nextMonthName);
      }

      setSelectedDashboardMonth('current');
      setShowNewMonthModal(false);

      showToast(
        language === 'ar'
          ? `تم بدء دورة (${nextMonthName}) بنجاح! تم حفظ الأرشيف وتصفير الإحصائيات والمتغيرات لدورة الشهر الجديد.`
          : `Started new cycle (${nextMonthName})! Statistics and variables have been reset.`,
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast(language === 'ar' ? 'تعذر إتمام التحويل للشهر الجديد' : 'Error starting new month cycle', 'error');
    } finally {
      setIsProcessingNewCycle(false);
    }
  };

  // Aggregate stats for current month or selected archived month
  const totalEmployees = effectiveEmployees.length;
  const totalDepartments = effectiveDepartments.length;

  // Pricing & metrics per department
  const deptsPayrollStats = useMemo(() => {
    return effectiveDepartments.map((d) => {
      const isLump = d.salaryStructureType === 'lump_sum' || d.isLumpSum || d.salaryType === 'lumpSum';
      const lumpSalary = d.lumpSumSalary || 0;

      const deptEmployees = effectiveEmployees.filter((e) => e.departmentId === d.id);
      const deptsPayrolls = effectivePayrollList.filter((p) =>
        deptEmployees.some((e) => e.id === p.employeeId)
      );

      let netSum = isLump ? lumpSalary : 0;
      let allowancesSum = 0;
      let deductionsSum = 0;

      if (!isLump) {
        netSum = deptsPayrolls.reduce((sum, p) => sum + p.netSalary, 0);
        allowancesSum = deptsPayrolls.reduce(
          (sum, p) =>
            sum +
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
            (p.previousMonthAddVal || 0),
          0
        );
        deductionsSum = deptsPayrolls.reduce(
          (sum, p) =>
            sum +
            (p.deductionDaysVal || 0) +
            (p.deductionHoursVal || 0) +
            (p.deductionPenaltiesVal || 0) +
            (p.deductionOtherVal || 0) +
            (p.deductionPenaltyCustom1Val || 0) +
            (p.deductionPenaltyCustom2Val || 0) +
            (p.deductionPenaltyCustom3Val || 0) +
            (p.deductionPenaltyCustom4Val || 0) +
            (p.deductionPenaltyCustom5Val || 0) +
            (p.previousMonthSubVal || 0),
          0
        );
      } else {
        const actualNetSum = deptsPayrolls.reduce((sum, p) => sum + p.netSalary, 0);
        if (actualNetSum > 0) {
          netSum = actualNetSum;
          allowancesSum = deptsPayrolls.reduce(
            (sum, p) =>
              sum +
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
              (p.previousMonthAddVal || 0),
            0
          );
          deductionsSum = deptsPayrolls.reduce(
            (sum, p) =>
              sum +
              (p.deductionDaysVal || 0) +
              (p.deductionHoursVal || 0) +
              (p.deductionPenaltiesVal || 0) +
              (p.deductionOtherVal || 0) +
              (p.deductionPenaltyCustom1Val || 0) +
              (p.deductionPenaltyCustom2Val || 0) +
              (p.deductionPenaltyCustom3Val || 0) +
              (p.deductionPenaltyCustom4Val || 0) +
              (p.deductionPenaltyCustom5Val || 0) +
              (p.previousMonthSubVal || 0),
            0
          );
        }
      }

      return {
        id: d.id,
        name: d.name,
        count: deptEmployees.length,
        totalNet: netSum,
        totalAllowances: allowancesSum,
        totalDeductions: deductionsSum,
      };
    });
  }, [effectiveDepartments, effectiveEmployees, effectivePayrollList]);

  const deptsPayrollTotals = useMemo(() => {
    let activeStaff = 0;
    let allowances = 0;
    let deductions = 0;
    let net = 0;
    deptsPayrollStats.forEach((item) => {
      activeStaff += item.count;
      allowances += item.totalAllowances;
      deductions += item.totalDeductions;
      net += item.totalNet;
    });
    return { activeStaff, allowances, deductions, net };
  }, [deptsPayrollStats]);

  const stats = useMemo(() => {
    return {
      totalNetSalary: deptsPayrollTotals.net,
      totalAllowances: deptsPayrollTotals.allowances,
      totalDeductions: deptsPayrollTotals.deductions,
    };
  }, [deptsPayrollTotals]);

  // Employment sector & Social Security breakdown statistics
  const sectorStats = useMemo(() => {
    let govCount = 0;
    let nonGovCoveredSSCount = 0;
    let nonGovExemptSSCount = 0;
    let govCoveredSSCount = 0;

    effectiveEmployees.forEach((emp) => {
      const isGov = !!emp.isGovernmentSector;
      const dept = effectiveDepartments.find((d) => d.id === emp.departmentId);
      
      let isSS = false;
      if (emp.isSubjectToSocialSecurity !== undefined && emp.isSubjectToSocialSecurity !== null) {
        isSS = emp.isSubjectToSocialSecurity;
      } else if (isGov) {
        isSS = false;
      } else {
        isSS = !!(dept && dept.enableSocialSecurity);
      }

      if (isGov) {
        govCount++;
        if (isSS) govCoveredSSCount++;
      } else {
        if (isSS) nonGovCoveredSSCount++;
        else nonGovExemptSSCount++;
      }
    });

    const totalCoveredSS = nonGovCoveredSSCount + govCoveredSSCount;
    const nonGovTotal = effectiveEmployees.length - govCount;

    return {
      govCount,
      nonGovTotal,
      nonGovCoveredSSCount,
      nonGovExemptSSCount,
      govCoveredSSCount,
      totalCoveredSS,
    };
  }, [effectiveEmployees, effectiveDepartments]);

  // Dynamic Chart labels
  const labelCurrent = language === 'ar' ? 'الشهر الحالي (ألف د.ع)' : 'Current Month (K IQD)';
  const labelPrevious = language === 'ar' ? 'الشهر السابق (ألف د.ع)' : 'Previous Month (K IQD)';
  const labelAllowancesChart = language === 'ar' ? 'الإضافات (ألف د.ع)' : 'Allowances (K IQD)';
  const labelDeductionsChart = language === 'ar' ? 'الاستقطاعات (ألف د.ع)' : 'Deductions (K IQD)';

  const labelWagesTrend = language === 'ar' ? 'إجمالي الرواتب المصروفة (مليون د.ع)' : 'Total Net Paid (M IQD)';
  const labelAddTrend = language === 'ar' ? 'مجموع الإضافات (مليون د.ع)' : 'Total Allowances (M IQD)';
  const labelSubTrend = language === 'ar' ? 'مجموع الاستقطاعات (مليون د.ع)' : 'Total Deductions (M IQD)';

  // Construct chart data comparing departments' Current Month with Previous Month
  const departmentComparisonData = useMemo(() => {
    const lastArchive = archive && archive.length > 0 ? archive[archive.length - 1] : null;

    return departments.map((d) => {
      const currentStats = deptsPayrollStats.find((s) => s.id === d.id);
      const currentNet = currentStats ? currentStats.totalNet / 1000 : 0;

      // Find same dept in previous archive record
      let prevNet = 0;
      if (lastArchive) {
        const prevPayrollForDept = (lastArchive.payrollsSnapshot || []).filter((p) => {
          const emp = (lastArchive.employeesSnapshot || []).find((e) => e.id === p.employeeId);
          return emp && emp.departmentId === d.id;
        });
        prevNet = prevPayrollForDept.reduce((sum, p) => sum + p.netSalary, 0) / 1000;
      } else {
        prevNet = currentNet > 0 ? currentNet * 0.85 : 0;
      }

      return {
        name: d.name,
        [labelCurrent]: Math.round(currentNet),
        [labelPrevious]: Math.round(prevNet),
        [labelAllowancesChart]: Math.round((currentStats ? currentStats.totalAllowances : 0) / 1000),
        [labelDeductionsChart]: Math.round((currentStats ? currentStats.totalDeductions : 0) / 1000),
      };
    });
  }, [departments, deptsPayrollStats, archive, labelCurrent, labelPrevious, labelAllowancesChart, labelDeductionsChart]);

  // Trend analysis over archived months
  const monthlyWagesTrend = useMemo(() => {
    const data = (archive || []).map((a) => ({
      month: a.monthLabel,
      [labelWagesTrend]: Number((a.totalNetPaid / 1000000).toFixed(2)),
      [labelAddTrend]: Number((a.totalEarningsSum / 1000000).toFixed(2)),
      [labelSubTrend]: Number((a.totalDeductionsSum / 1000000).toFixed(2)),
    }));

    // Append current month to complete the timeline
    data.push({
      month: language === 'ar' ? 'الشهر الحالي' : 'Current Month',
      [labelWagesTrend]: Number((stats.totalNetSalary / 1000000).toFixed(2)),
      [labelAddTrend]: Number((stats.totalAllowances / 1000000).toFixed(2)),
      [labelSubTrend]: Number((stats.totalDeductions / 1000000).toFixed(2)),
    });

    return data;
  }, [archive, stats, language, labelWagesTrend, labelAddTrend, labelSubTrend]);

  // Formatter for Currency
  const formatIQD = (amount: number) => {
    return formatCurrency(amount, language, 'IQD');
  };

  return (
    <div className="space-y-8 bg-slate-900/10 dark:bg-slate-950/20 glass-panel p-5 sm:p-7 lg:p-9 rounded-3xl border border-white/8 text-slate-200 shadow-xl overflow-hidden relative" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Absolute faint top-right background gradient ball */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-transparent blur-3xl pointer-events-none rounded-full" />

      {/* Alert Header if Empty */}
      {departments.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-500/5 dark:bg-blue-950/20 border border-blue-500/20 rounded-2xl p-6.5 text-center space-y-4 shadow-sm"
        >
          <div className="flex justify-center">
            <span className="p-3 bg-blue-500/10 dark:bg-blue-950/40 text-blue-400 rounded-full border border-blue-500/20">
              <Sparkles className="w-7 h-7 animate-pulse" />
            </span>
          </div>
          <h2 className="text-lg font-black text-white">
            {language === 'ar' 
              ? 'مرحباً بك في نظام الرواتب والإدارة لمستشفى الفرح الأهلي!'
              : 'Welcome to Al-Farrah Private Hospital ERP & Payroll Suite!'}
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed font-bold">
            {language === 'ar'
              ? 'النظام يبدأ حالياً بنية نظيفة وقاعدة بيانات فارغة ليتيح لك مرونة التشكيل الكاملة. يمكنك المباشرة بإضافة الأقسام والوظائف يدوياً، أو النقر على الزر أدناه لتعبئة بيانات المستشفى وتصاميم شعب افتراضية متكاملة بضغطة واحدة لاختبار النظام على الفور.'
              : 'The system has loaded with an empty database to grant you complete setup flexibility. Begin adding custom departments and hospital staff manually, or click down below to generate standard demo records instantly for a live simulation.'}
          </p>
          <div className="flex justify-center gap-3">
            <button
              id="dash-load-demo-btn"
              onClick={onLoadDemoData}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer active:scale-95"
            >
              {language === 'ar' ? 'تحميل البيانات التجريبية للمستشفى' : 'Load Demo Hospital Datasets'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Main Month Cycle & Payroll Period Indicator & Switcher */}
      <div className="bg-gradient-to-r from-slate-900/90 via-slate-850/90 to-slate-900/90 border border-cyan-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 rounded-xl shadow-inner">
                <CalendarDays className="w-5 h-5" />
              </span>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2 flex-wrap">
                <span>{language === 'ar' ? 'دورة رواتب المستشفى المعروضة:' : 'Displayed Payroll Cycle:'}</span>
                <span className="text-cyan-400 font-mono bg-cyan-950/80 px-3 py-0.5 rounded-xl border border-cyan-500/40 shadow-sm">
                  {selectedDashboardMonth === 'current' ? activeCycleMonthLabel : (selectedArchiveItem?.monthLabel || selectedDashboardMonth)}
                </span>
                {selectedDashboardMonth === 'current' ? (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {language === 'ar' ? 'الدورة الحالية النشطة' : 'Active Live Cycle'}
                  </span>
                ) : (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                    <FolderArchive className="w-3.5 h-3.5" />
                    {language === 'ar' ? 'سجل تاريخي مؤرشف' : 'Archived Historical'}
                  </span>
                )}
                {autoCycleEnabled && (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    {language === 'ar' ? 'التدوير والتصفير التلقائي: يوم 20 بالشهر' : 'Auto Day-20 Rollover: Active'}
                  </span>
                )}
              </h2>
            </div>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              📅 <strong className="text-amber-300">{language === 'ar' ? 'نظام دورة الرواتب:' : 'Payroll Schedule:'}</strong> {language === 'ar' ? 'يتم إعداد الرواتب من نهاية الشهر ' : 'Salaries are calculated from end of month '}
              <strong className="text-white">{language === 'ar' ? 'يوم 20' : '20th'}</strong> {language === 'ar' ? 'إلى ' : 'to '}
              <strong className="text-white">{language === 'ar' ? 'يوم 10' : '10th'}</strong> {language === 'ar' ? 'بالشهر التالي (يوم 20 يفتح النظام شهراً جديداً ويصفر الإحصائيات تلقائياً مع أرشفة الشهر السابق).' : 'of next month (on the 20th, a new cycle starts & resets automatically).'}
            </p>
          </div>

          {/* Month Selector dropdown & New Month Action */}
          <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
            <div className="relative min-w-[210px] w-full sm:w-auto">
              <select
                id="dash-month-selector"
                value={selectedDashboardMonth}
                onChange={(e) => setSelectedDashboardMonth(e.target.value)}
                className="w-full bg-slate-950/90 border border-slate-700 hover:border-cyan-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all focus:outline-none focus:border-cyan-400 cursor-pointer text-right appearance-none pr-8 shadow-inner"
              >
                <option value="current">🟢 {activeCycleMonthLabel} ({language === 'ar' ? 'المدخلات الحالية النشطة' : 'Active live entries'})</option>
                {archive && archive.length > 0 && (
                  <optgroup label={language === 'ar' ? '📁 الشهور المؤرشفة السابقة' : '📁 Archived Past Months'}>
                    {archive.map((a) => (
                      <option key={a.monthId} value={a.monthId}>
                        📁 {a.monthLabel} ({formatCurrency(a.totalNetPaid, language, 'IQD')})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {selectedDashboardMonth !== 'current' && (
              <button
                onClick={() => setSelectedDashboardMonth('current')}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'العودة للشهر الحالي' : 'Back to Active'}</span>
              </button>
            )}

            <button
              id="dash-start-new-month-btn"
              onClick={() => {
                setShowNewMonthModal(true);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-950/50 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-emerald-200" />
              <span>{language === 'ar' ? 'بدء دورة شهر جديد (تصفير للإحصائيات) 🚀' : 'Start New Month Cycle 🚀'}</span>
            </button>
          </div>
        </div>

        {/* Quick Month Navigation Chips Bar */}
        <div className="pt-2 pb-1 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-white/5">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1 pl-1">
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>{language === 'ar' ? 'التنقل بين الأشهر:' : 'Quick Switch:'}</span>
          </span>

          <button
            onClick={() => setSelectedDashboardMonth('current')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
              selectedDashboardMonth === 'current'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md shadow-cyan-950/40'
                : 'bg-slate-900/60 text-slate-400 border-white/5 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>🟢 {activeCycleMonthLabel} ({language === 'ar' ? 'الحالي' : 'Active'})</span>
          </button>

          {archive && archive.length > 0 ? (
            archive.map((a) => (
              <button
                key={a.monthId}
                onClick={() => setSelectedDashboardMonth(a.monthId)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
                  selectedDashboardMonth === a.monthId
                    ? 'bg-indigo-500/25 text-indigo-200 border-indigo-500/50 shadow-md shadow-indigo-950/40'
                    : 'bg-slate-900/60 text-slate-400 border-white/5 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <FolderArchive className="w-3 h-3 text-indigo-400" />
                <span>{a.monthLabel}</span>
                <span className="text-[10px] font-mono opacity-70 bg-black/30 px-1.5 py-0.2 rounded">
                  {formatCurrency(a.totalNetPaid, language, 'IQD')}
                </span>
              </button>
            ))
          ) : (
            <span className="text-[10px] text-slate-500 font-sans italic">
              {language === 'ar' ? '(لا توجد شهور سابقة مؤرشفة بعد، يتم الحفظ التلقائي يوم 20 بالشهر أو بالضغط على زر بدء دورة شهر جديد)' : '(No archived months yet)'}
            </span>
          )}
        </div>

        {/* Cycle notice banner */}
        <div className="p-3 bg-slate-950/60 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              {selectedDashboardMonth === 'current' ? (
                language === 'ar' ? (
                  <>
                    الرواتب والمدخلات المسجلة حالياً تخص: <strong className="text-cyan-300 font-mono font-bold">{activeCycleMonthLabel}</strong>. النظام مبرمج ليقوم <strong className="text-emerald-300">يوم 20 من كل شهر تلقائياً</strong> بأرشفة بيانات الشهر السابق، وفتح دورة الشهر الجديد وتصفير الإحصائيات والمتغيرات (الساعات، الإضافيات، الخصومات) للبدء برواتب نظيفة.
                  </>
                ) : (
                  <>
                    Current active entries belong to: <strong className="text-cyan-300 font-mono font-bold">{activeCycleMonthLabel}</strong>. On the 20th of each month, the system auto-archives past data and resets monthly counters.
                  </>
                )
              ) : (
                language === 'ar' ? (
                  <>
                    أنت تستعرض حالياً بيانات وإحصائيات: <strong className="text-amber-300 font-mono font-bold">{selectedArchiveItem?.monthLabel}</strong> (المحفوظة كأرشيف معتمد - للقراءة والمقارنة).
                  </>
                ) : (
                  <>
                    You are reviewing historical data for: <strong className="text-amber-300 font-mono font-bold">{selectedArchiveItem?.monthLabel}</strong>.
                  </>
                )
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {selectedDashboardMonth === 'current' ? (
              <button
                onClick={() => {
                  const newName = prompt(language === 'ar' ? 'تعديل مسمى دورة الشهر الحالي النشط:' : 'Edit active month label:', activeCycleMonthLabel);
                  if (newName && newName.trim()) {
                    setActiveCycleMonthLabel(newName.trim());
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('alfarrah_current_payroll_cycle_name', newName.trim());
                    }
                    showToast(language === 'ar' ? `تم تحديث مسمى الدورة إلى: ${newName.trim()}` : `Updated cycle name to: ${newName.trim()}`, 'success');
                  }
                }}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline font-bold cursor-pointer"
              >
                ✏️ {language === 'ar' ? 'تعديل مسمى الشهر الحالي' : 'Edit Month Label'}
              </button>
            ) : (
              <button
                onClick={() => setSelectedDashboardMonth('current')}
                className="px-2.5 py-1 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{language === 'ar' ? 'العودة للشهر الحالي النشط' : 'Return to Active Month'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Top statistics matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/5 hover:border-emerald-500/25 p-6 h-36 relative overflow-hidden group transition-all duration-300 shadow-lg"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-emerald-500/5 to-transparent blur-xl rounded-full pointer-events-none" />
          <div className="flex flex-col justify-between items-center h-full text-center w-full z-10 relative">
            <div className="flex items-center justify-between w-full pb-1">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">{t.totalNetSalary}</p>
              <span className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                <DollarSign className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="flex items-center justify-center py-1">
              <h3 id="stat-net-salary" className="text-base sm:text-lg lg:text-xl font-black text-emerald-400 font-mono tracking-tight drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]" dir="ltr">
                {formatIQD(stats.totalNetSalary)}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-[10.5px] text-slate-450 font-bold justify-center w-full">
              <span className="text-emerald-450 font-black flex items-center shrink-0">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
              <span className="truncate">{language === 'ar' ? 'صافي الرواتب والأجور النهائية' : 'Net distributed salaries to roster'}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/5 hover:border-cyan-500/25 p-6 h-36 relative overflow-hidden group transition-all duration-300 shadow-lg"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-cyan-500/5 to-transparent blur-xl rounded-full pointer-events-none" />
          <div className="flex flex-col justify-between items-center h-full text-center w-full z-10 relative">
            <div className="flex items-center justify-between w-full pb-1">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">{t.totalEmployees}</p>
              <span className="p-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400">
                <Users className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="flex items-center justify-center py-1">
              <h3 id="stat-emp-count" className="text-base sm:text-lg lg:text-xl font-black text-cyan-400 font-mono tracking-tight drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]" dir="ltr">
                {totalEmployees} <span className="text-xs text-slate-455 font-sans font-black">{language === 'ar' ? 'معين' : 'Staff'}</span>
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-[10.5px] text-slate-450 font-bold justify-center w-full">
              <span className="text-cyan-455 font-black shrink-0">{language === 'ar' ? 'نشط' : 'Active'}</span>
              <span className="truncate">{language === 'ar' ? `موزعين على ${totalDepartments} أقسام وشعب` : `Assigned across ${totalDepartments} departments`}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/5 hover:border-amber-500/25 p-6 h-36 relative overflow-hidden group transition-all duration-300 shadow-lg"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-amber-500/5 to-transparent blur-xl rounded-full pointer-events-none" />
          <div className="flex flex-col justify-between items-center h-full text-center w-full z-10 relative">
            <div className="flex items-center justify-between w-full pb-1">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">{t.totalAllowances}</p>
              <span className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
                <TrendingUp className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="flex items-center justify-center py-1">
              <h3 id="stat-additions" className="text-base sm:text-lg lg:text-xl font-black text-amber-400 font-mono tracking-tight drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]" dir="ltr">
                {formatIQD(stats.totalAllowances)}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-[10.5px] text-slate-450 font-bold justify-center w-full">
              <span className="truncate">{language === 'ar' ? 'تشمل المخصصات والزيادات الممنوحة' : 'Includes allowances and bonuses'}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/5 hover:border-rose-500/25 p-6 h-36 relative overflow-hidden group transition-all duration-300 shadow-lg"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-rose-500/5 to-transparent blur-xl rounded-full pointer-events-none" />
          <div className="flex flex-col justify-between items-center h-full text-center w-full z-10 relative">
            <div className="flex items-center justify-between w-full pb-1">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">{t.totalDeductions}</p>
              <span className="p-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400">
                <AlertTriangle className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="flex items-center justify-center py-1">
              <h3 id="stat-deductions" className="text-base sm:text-lg lg:text-xl font-black text-rose-400 font-mono tracking-tight drop-shadow-[0_0_10px_rgba(244,63,94,0.3)]" dir="ltr">
                {formatIQD(stats.totalDeductions)}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-[10.5px] text-slate-450 font-bold justify-center w-full">
              <span className="truncate">{language === 'ar' ? 'غرامات وعقوبات وسلف استقطعت' : 'Absence, penalties, or pre-paid debts'}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sector & Social Security Statistics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" dir="rtl">
        {/* Gov Sector Employees Card */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-amber-500/20 p-4 relative overflow-hidden group shadow-md"
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-300">
                🏛️
              </span>
              <div>
                <h4 className="text-xs font-black text-slate-200">
                  {language === 'ar' ? 'الموظفون بالقطاع الحكومي' : 'Government Sector Employees'}
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  {language === 'ar' ? 'يعملون بالقطاع الحكومي (مستثنون من الضمان)' : 'Government staff (Exempt from SS)'}
                </p>
              </div>
            </div>
          </div>
          <div className="pt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-400 font-mono" dir="ltr">
              {sectorStats.govCount}
            </span>
            <span className="text-xs font-bold text-slate-400">
              {language === 'ar' ? `من أصل ${totalEmployees} موظف` : `Out of ${totalEmployees}`}
            </span>
          </div>
        </motion.div>

        {/* Non-Gov Employees Subject to SS Card */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-emerald-500/20 p-4 relative overflow-hidden group shadow-md"
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300">
                🏥
              </span>
              <div>
                <h4 className="text-xs font-black text-slate-200">
                  {language === 'ar' ? 'القطاع الخاص (الخاضعون للضمان)' : 'Private Sector (Covered by SS)'}
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  {language === 'ar' ? 'لا يعملون بالحكومية ومشمولون باستقطاع الضمان 5%' : 'Private sector subject to 5% SS'}
                </p>
              </div>
            </div>
          </div>
          <div className="pt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-400 font-mono" dir="ltr">
              {sectorStats.nonGovCoveredSSCount}
            </span>
            <span className="text-xs font-bold text-slate-400">
              {language === 'ar' ? `من أصل ${sectorStats.nonGovTotal} كادر خاص` : `Out of ${sectorStats.nonGovTotal} private`}
            </span>
          </div>
        </motion.div>

        {/* Total Employees Covered by Social Security Card */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-cyan-500/20 p-4 relative overflow-hidden group shadow-md"
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-cyan-500/15 border border-cyan-500/30 rounded-xl text-cyan-300">
                🛡️
              </span>
              <div>
                <h4 className="text-xs font-black text-slate-200">
                  {language === 'ar' ? 'إجمالي الخاضعين للضمان الاجتماعي' : 'Total Staff Covered by SS'}
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  {language === 'ar' ? 'إجمالي الموظفين المشمولين باستقطاع الضمان' : 'Total roster active in Social Security'}
                </p>
              </div>
            </div>
          </div>
          <div className="pt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-cyan-400 font-mono" dir="ltr">
              {sectorStats.totalCoveredSS}
            </span>
            <span className="text-xs font-bold text-slate-400">
              {language === 'ar' ? `نسبة الشمول: ${totalEmployees > 0 ? Math.round((sectorStats.totalCoveredSS / totalEmployees) * 100) : 0}%` : `Coverage: ${totalEmployees > 0 ? Math.round((sectorStats.totalCoveredSS / totalEmployees) * 100) : 0}%`}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Dynamic Graph Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Department Salary Comparison */}
        <div className="bg-white/4 dark:bg-slate-950/40 rounded-2xl border border-white/10 p-5 space-y-4 hover:border-blue-500/20 transition-all">
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                {t.departmentsComparison}
              </h3>
              <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                {language === 'ar' 
                  ? 'مقارنة مجموع الرواتب المصروفة للشعب (بالألف دينار عراقي)' 
                  : 'Total net salary compare grouped by department ward (K IQD)'}
              </p>
            </div>
          </div>

          <div className="h-[300px] w-full" dir="ltr">
            {departments.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                {language === 'ar' ? 'لا توجد أقسام متوفرة لعرضها في الرسم البياني' : 'No departments available to chart.'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300} minWidth={0}>
                <BarChart
                  data={departmentComparisonData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #e2e8f0)" />
                  <XAxis dataKey="name" stroke="var(--chart-axis, #475569)" fontSize={10} tickLine={false} />
                  <YAxis stroke="var(--chart-axis, #475569)" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: 8 }}
                    labelStyle={{ color: '#0f172a', fontWeight: 'bold', fontSize: 11 }}
                    itemStyle={{ fontSize: 11, color: '#1e293b' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10, color: '#475569' }} />
                  <Bar dataKey={labelCurrent} fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={labelPrevious} fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right Column: Additions / Deductions per department */}
        <div className="glass-panel rounded-2xl p-5 space-y-4 transition-all duration-200">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 border-slate-700/20">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                {language === 'ar' ? 'مقارنة مبالغ الإضافات والاستقطاعات في الأقسام' : 'Departmental Allowances vs Deductions'}
              </h3>
              <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                {language === 'ar'
                  ? 'مستحقات الزيادات المالية مقابل العقوبات والاستقطاعات لكل شعبة'
                  : 'Bonuses versus administrative penalties per department (K IQD)'}
              </p>
            </div>
          </div>

          <div className="h-[300px] w-full" dir="ltr">
            {departments.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                {language === 'ar' ? 'لا توجد بيانات للعرض في الرسم البياني' : 'No datasets registered to chart yet.'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300} minWidth={0}>
                <BarChart
                  data={departmentComparisonData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #e2e8f0)" />
                  <XAxis dataKey="name" stroke="var(--chart-axis, #475569)" fontSize={10} tickLine={false} />
                  <YAxis stroke="var(--chart-axis, #475569)" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: 8 }}
                    labelStyle={{ color: '#0f172a', fontWeight: 'bold', fontSize: 11 }}
                    itemStyle={{ fontSize: 11, color: '#1e293b' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10, color: '#475569' }} />
                  <Bar dataKey={labelAllowancesChart} fill="#0891b2" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={labelDeductionsChart} fill="#e11d48" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Hospital Overall Payroll Trend (LineChart) */}
      <div className="glass-panel rounded-2xl p-6 transition-all duration-200">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100 border-slate-700/20 mb-5 border-slate-700/20 mb-5">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              {t.wagesTrend || (language === 'ar' ? 'المنحنى التاريخي للكتلة المالية المصروفة' : 'Historical Cost Trend Over Months')}
            </h3>
            <p className="text-[11px] text-slate-500 font-bold mt-0.5">
              {language === 'ar'
                ? 'تتبع إجمالي رواتب المستشفى الشهرية والإضافات بالمليون دينار'
                : 'Monitor grand total monthly salaries & overhead trend (Millions IQD)'}
            </p>
          </div>
        </div>

        <div className="h-[280px] w-full" dir="ltr">
          <ResponsiveContainer width="100%" height={280} minWidth={0}>
            <LineChart
              data={monthlyWagesTrend}
              margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #e2e8f0)" />
              <XAxis dataKey="month" stroke="var(--chart-axis, #475569)" fontSize={10} />
              <YAxis stroke="var(--chart-axis, #475569)" fontSize={10} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: 8 }}
                labelStyle={{ color: '#0f172a', fontWeight: 'bold', fontSize: 11 }}
                itemStyle={{ fontSize: 11, color: '#1e293b' }}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line
                type="monotone"
                dataKey={labelWagesTrend}
                stroke="#2563eb"
                strokeWidth={3}
                activeDot={{ r: 8 }}
              />
              <Line type="monotone" dataKey={labelAddTrend} stroke="#16a34a" strokeWidth={1.5} strokeDasharray="3 3" />
              <Line type="monotone" dataKey={labelSubTrend} stroke="#dc2626" strokeWidth={1.5} strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Interactive Comparison Grid */}
      <div className="glass-panel rounded-2xl p-5 space-y-4 transition-all duration-200">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 border-slate-700/20 flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              {language === 'ar' 
                ? 'مقارنة رواتب ومؤشرات المستشفى بين الأشهر التاريخية' 
                : 'Historical Month-by-Month Payroll Analytics'}
            </h3>
            <p className="text-[11px] text-slate-500 font-bold mt-0.5">
              {language === 'ar'
                ? 'تحليل مقارن للمصروفات والكتل النقدية الموزعة والتقلبات شهراً بشهر'
                : 'Comparative financial index analysis of distributed clinical wages month-on-month'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowNewMonthModal(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5 text-blue-200" />
              <span>{language === 'ar' ? 'بدء شهر جديد وتصفير الإحصائيات' : 'Start New Month Cycle'}</span>
            </button>
          </div>
        </div>

        {/* Dedicated Cycle Info Notice Banner above Months Table */}
        <div className="p-3.5 bg-gradient-to-r from-blue-950/40 via-slate-900/50 to-indigo-950/40 border border-blue-500/25 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg shrink-0">
              <Clock className="w-4 h-4" />
            </span>
            <div>
              <p className="text-slate-200 font-bold">
                {language === 'ar' ? (
                  <>
                    الرواتب والمدخلات الحالية مسجلة لـ: <span className="text-cyan-300 font-mono font-black">{activeCycleMonthLabel}</span> (دورة العمل: من <span className="text-amber-300 font-bold">يوم 20</span> بنهاية الشهر إلى <span className="text-amber-300 font-bold">يوم 10</span> بالشهر التالي).
                  </>
                ) : (
                  <>
                    Current registered salaries belong to: <span className="text-cyan-300 font-mono font-bold">{activeCycleMonthLabel}</span> (Period: 20th to 10th).
                  </>
                )}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {language === 'ar'
                  ? '💡 لحد يوم 10 من الشهر الحالي يتم قيد وتدقيق رواتب الشهر السابق. وعند الانتقال لشهر جديد، تُحفظ السجلات في الأرشيف وتُصفّر الإحصائيات والمتغيرات للبدء من جديد.'
                  : '💡 Up to the 10th of the month, previous month entries are finalized. Switching to a new month archives the previous one and resets active variables.'}
              </p>
            </div>
          </div>
        </div>

        {(!archive || archive.length === 0) ? (
          <p className="text-center text-xs text-slate-500 leading-relaxed py-6">
            💡 {language === 'ar'
              ? 'لا توجد شهور مؤرشفة بعد في النظام لمقارنتها. سيتم ملء هذه المقارنة تلقائياً عند إغلاق الدورة المالية وتخزين الشهور من تبويب الإعدادات.'
              : 'No archived months are saved in the system yet. Once you lock a financial roll and generate closure snapshots from the Settings Panel, they will show up here.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className={`w-full text-xs ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              <thead>
                <tr className="border-b border-slate-250 text-slate-600 font-black">
                  <th className={`pb-3 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    {language === 'ar' ? 'عنوان الشهر التاريخي' : 'Archived Month'}
                  </th>
                  <th className="pb-3 text-center">{language === 'ar' ? 'الكوادر المشمولة' : 'Staff Count'}</th>
                  <th className={`pb-3 ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                    {language === 'ar' ? 'مجموع المخصصات والإضافات' : 'Total Allowances'}
                  </th>
                  <th className={`pb-3 ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                    {language === 'ar' ? 'مجموع الخصومات والغيابات' : 'Total Deductions'}
                  </th>
                  <th className={`pb-3 font-black text-slate-900 ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                    {language === 'ar' ? 'صافي الرواتب المصروفة' : 'Net Total Paid'}
                  </th>
                  <th className="pb-3 text-center">{language === 'ar' ? 'نسبة التغير ومؤشر النمو' : 'Fluctuation Rate'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-155">
                {[
                  ...(archive || []).map((a, idx) => {
                    const prevNet = idx > 0 ? archive[idx - 1].totalNetPaid : null;
                    let changePercent = null;
                    if (prevNet && prevNet > 0) {
                      changePercent = ((a.totalNetPaid - prevNet) / prevNet) * 100;
                    }
                    return {
                      monthId: a.monthId,
                      monthName: a.monthLabel,
                      staffCount: a.payrollsSnapshot?.length || 0,
                      totalAllowances: a.totalEarningsSum,
                      totalDeductions: a.totalDeductionsSum,
                      totalNet: a.totalNetPaid,
                      changePercent,
                      isCurrent: false,
                    };
                  }),
                  (() => {
                    const prevNet = archive && archive.length > 0 ? archive[archive.length - 1].totalNetPaid : null;
                    let changePercent = null;
                    if (prevNet && prevNet > 0) {
                      changePercent = ((stats.totalNetSalary - prevNet) / prevNet) * 100;
                    }
                    return {
                      monthId: 'current',
                      monthName: language === 'ar' ? 'الشهر الحالي (نشط)' : 'Current Month (Active)',
                      staffCount: totalEmployees,
                      totalAllowances: stats.totalAllowances,
                      totalDeductions: stats.totalDeductions,
                      totalNet: stats.totalNetSalary,
                      changePercent,
                      isCurrent: true,
                    };
                  })()
                ].map((row, index) => {
                  return (
                    <tr 
                      key={index} 
                      className={`hover:bg-slate-50 transition-colors bg-white ${
                        row.isCurrent ? "bg-blue-50/50 border-r-2 border-blue-600" : ""
                      }`}
                    >
                      <td className="py-3 text-slate-900 font-extrabold flex items-center justify-between gap-1.5 px-2">
                        <div className="flex items-center gap-1.5">
                          {row.isCurrent ? (
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping" />
                          ) : (
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                          )}
                          <span>{row.monthName}</span>
                        </div>
                        {!row.isCurrent && onDeleteArchiveMonth && row.monthId && (
                          <button
                            onClick={() => {
                              if (confirm(language === 'ar' ? `هل ترغب بالفعل بحذف الشهر المؤرشف (${row.monthName})؟` : `Delete archived month (${row.monthName})?`)) {
                                onDeleteArchiveMonth(row.monthId);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title={language === 'ar' ? 'مسح هذا الشهر المؤرشف' : 'Delete archived month'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                      <td className="py-3 text-center text-slate-700 font-mono font-bold">
                        {row.staffCount} {language === 'ar' ? 'موظف' : 'Staff'}
                      </td>
                      <td className={`py-3 font-mono font-bold ${language === 'ar' ? 'text-left' : 'text-right'} text-emerald-700`} dir="ltr">
                        {formatIQD(row.totalAllowances)}
                      </td>
                      <td className={`py-3 font-mono font-bold ${language === 'ar' ? 'text-left' : 'text-right'} text-rose-700`} dir="ltr">
                        {formatIQD(row.totalDeductions)}
                      </td>
                      <td className={`py-3 font-mono font-black ${language === 'ar' ? 'text-left' : 'text-right'} text-blue-700 dark:text-cyan-400`} dir="ltr">
                        {formatIQD(row.totalNet)}
                      </td>
                      <td className="py-3 text-center">
                        {row.changePercent === null ? (
                          <span className="text-slate-500 font-bold">-</span>
                        ) : row.changePercent > 0 ? (
                          <span className="text-xs text-rose-700 font-mono font-black flex items-center justify-center gap-0.5" dir="ltr">
                            ↑ +{row.changePercent.toFixed(1)}%
                          </span>
                        ) : row.changePercent < 0 ? (
                          <span className="text-xs text-emerald-700 font-mono font-black flex items-center justify-center gap-0.5" dir="ltr">
                            ↓ {row.changePercent.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 font-mono font-bold">0.0%</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Departments Summary Matrix Grid */}
      <div className="glass-panel rounded-2xl p-5 transition-all duration-200">
        <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4 gap-4 flex-wrap no-print">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <span className="text-blue-600">📊</span>
            {language === 'ar' ? 'ملخص الإنفاق والتشغيل للأقسام الشعبية' : 'Departmental Cumulative Spending Matrix'}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (typeof window !== 'undefined' && window.self !== window.top) {
                  showToast(
                    language === 'ar'
                      ? '⚠️ لتشغيل الطباعة بنجاح، يرجى أولاً فتح التطبيق في نافذة مستقلة عبر زر (فتح في نافذة جديدة) أعلى يمين الشاشة لتجاوز حماية المتصفح.'
                      : '⚠️ To print successfully, please first open the app in a new independent tab using the (Open in New Tab) button at the top-right of your screen.',
                    'info'
                  );
                }
                setShowPrintPreviewModal(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer"
              title={language === 'ar' ? 'معاينة وطباعة تقرير رواتب الأقسام بشكل احترافي معتمد' : 'Preview and print professional departmental salary report'}
            >
              <Printer className="w-4 h-4 text-cyan-200 animate-pulse" />
              {language === 'ar' ? 'معاينة وطباعة التقرير 🖨️' : 'Preview & Print Report 🖨️'}
            </button>
            <button
              disabled={isGeneratingPdf}
              onClick={triggerPdfDownloadFromDashboard}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer ${
                isGeneratingPdf 
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/10'
              }`}
              title={language === 'ar' ? 'تنزيل التقرير كملف PDF مباشرة' : 'Download report as PDF file directly'}
            >
              <Download className="w-4 h-4" />
              {language === 'ar' ? (isGeneratingPdf ? 'جاري التصدير...' : 'تنزيل كملف PDF 📥') : (isGeneratingPdf ? 'Exporting...' : 'Download PDF 📥')}
            </button>
          </div>
        </div>

        {/* Screen layout title (only visible when printing is active, otherwise hidden by no-print logic above) */}
        <h3 className="hidden print:block text-slate-800 text-sm font-bold mb-4 border-b border-slate-300 pb-2">
          {language === 'ar' ? 'ملخص الإنفاق والتشغيل للأقسام الشعبية' : 'Departmental Cumulative Spending Matrix'}
        </h3>

        {deptsPayrollStats.length === 0 ? (
          <p className="text-center text-xs text-slate-500 py-6">
            {language === 'ar' ? 'لم يتم العثور على أقسام متوفرة في النظام.' : 'No registered hospital departments.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className={`w-full text-xs text-center border-collapse`}>
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold text-center">
                  <th className="pb-3 text-center">
                    {language === 'ar' ? 'اسم القسم والشعبة' : 'Department Ward'}
                  </th>
                  <th className="pb-3 text-center">{language === 'ar' ? 'الكوادر النشطة' : 'Active Staff'}</th>
                  <th className="pb-3 text-center">
                    {language === 'ar' ? 'إجمالي المخصصات والإضافات' : 'Total Allowances'}
                  </th>
                  <th className="pb-3 text-center">
                    {language === 'ar' ? 'إجمالي الخصومات والغيابات' : 'Total Deductions'}
                  </th>
                  <th className="pb-3 font-black text-slate-900 text-center">
                    {language === 'ar' ? 'صافي الرواتب المستحقة' : 'Net Cumulative Salary'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-center">
                {deptsPayrollStats.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors bg-white text-center">
                    <td className="py-3 text-slate-900 font-black text-center">{item.name}</td>
                    <td className="py-3 text-center text-slate-700 font-mono font-bold">
                      {item.count} {language === 'ar' ? 'موظف' : 'Staff'}
                    </td>
                    <td className="py-3 font-mono font-bold text-center text-emerald-700" dir="ltr">
                      {formatIQD(item.totalAllowances)}
                    </td>
                    <td className="py-3 font-mono font-bold text-center text-rose-700" dir="ltr">
                      {formatIQD(item.totalDeductions)}
                    </td>
                    <td className="py-3 text-center">
                      <span className="font-mono font-black text-[#15803d] bg-[#f0fdf4] border border-[#bbf7d0] px-2.5 py-1 rounded-md inline-block font-bold mx-auto" dir="ltr">
                        {formatIQD(item.totalNet)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-slate-200 bg-slate-50 font-bold">
                <tr className="text-slate-900 text-center">
                  <td className="py-3.5 text-slate-950 font-black text-sm text-center">
                    {language === 'ar' ? 'المجموع الكلي للأقسام' : 'Grand Cumulative Total'}
                  </td>
                  <td className="py-3.5 text-center text-blue-700 font-mono font-black">
                    {deptsPayrollTotals.activeStaff} {language === 'ar' ? 'موظف' : 'Staff'}
                  </td>
                  <td className="py-3.5 font-mono font-black text-center text-emerald-700" dir="ltr">
                    {formatIQD(deptsPayrollTotals.allowances)}
                  </td>
                  <td className="py-3.5 font-mono font-black text-center text-rose-700" dir="ltr">
                    {formatIQD(deptsPayrollTotals.deductions)}
                  </td>
                  <td className="py-3.5 font-mono font-extrabold text-center text-blue-800 bg-[#eff6ff] px-3 border-x border-slate-200 text-sm" dir="ltr">
                    <span className="font-mono font-black text-[#1d4ed8] bg-[#eff6ff] px-2.5 py-1 rounded inline-block">
                      {formatIQD(deptsPayrollTotals.net)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Interactive Print Preview Overlay (Portal to body to resolve white page and iframe issues) */}
      {showPrintPreviewModal && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[9999] overflow-y-auto p-4 md:p-8 print:p-0 print:bg-white print:backdrop-blur-none" dir="rtl" id="print-preview-modal-overlay">
          
          <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-start min-h-screen py-4 print:py-0 print:max-w-none">
            {/* Header Controls (Hidden during print) */}
            <div className="no-print w-full bg-slate-900/90 border border-white/10 rounded-2xl p-4 mb-6 flex flex-wrap gap-4 items-center justify-between shadow-2xl backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
                  <Printer className="w-5 h-5 animate-pulse" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-white">معاينة التقرير المعتمد للأقسام الطبية</h3>
                  <p className="text-[10px] text-slate-400">تحقق من التنسيق، التوسيط والهوية قبل طباعة المستند</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const prevTitle = document.title;
                    try {
                      document.title = "كشف رواتب الأقسام - مستشفى الفرح الأهلي";
                      window.focus();
                      window.print();
                    } catch (e) {
                      console.error('Print failed:', e);
                      showToast('تعذر بدء الطباعة المباشرة', 'error');
                    } finally {
                      setTimeout(() => {
                        document.title = prevTitle;
                      }, 300);
                    }
                  }}
                  className="px-4.5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  بدء الطباعة الآن 🖨️
                </button>

                <button
                  disabled={isGeneratingPdf}
                  onClick={handleDownloadPDF}
                  className={`px-4.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer ${
                    isGeneratingPdf
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/10'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  {isGeneratingPdf ? 'جاري التصدير...' : 'تنزيل كملف PDF 📥'}
                </button>
                
                <button
                  onClick={() => setShowPrintPreviewModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-white/5 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  إغلاق المعاينة
                </button>
              </div>
            </div>

            {/* Printable A4 Paper Sheet */}
            <div className="bg-white text-slate-900 p-6 sm:p-8 md:p-10 shadow-2xl rounded-2xl w-full max-w-[21cm] border border-slate-300 print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none flex flex-col justify-start relative select-all my-4" id="printable-departments-summary" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
              {/* Embedded styles for pristine formatting */}
              <style dangerouslySetInnerHTML={{__html: `
                @media print {
                  * {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  html, body {
                    background-color: #ffffff !important;
                    color: #000000 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 21cm !important;
                    height: auto !important;
                    overflow: visible !important;
                    font-family: 'Cairo', system-ui, sans-serif !important;
                  }
                  #root, main, aside, header, footer, .no-print, .no-print-element {
                    display: none !important;
                    height: 0 !important;
                    width: 0 !important;
                    overflow: hidden !important;
                  }
                  #print-preview-modal-overlay {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    height: auto !important;
                    background: white !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    display: block !important;
                    overflow: visible !important;
                  }
                  #printable-departments-summary {
                    border: none !important;
                    box-shadow: none !important;
                    padding: 0.8cm !important;
                    margin: 0 auto !important;
                    width: 21cm !important;
                    min-height: auto !important;
                    height: auto !important;
                    background: white !important;
                    box-sizing: border-box !important;
                  }
                  tr {
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                  }
                  .signature-and-footer-block {
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                  }
                }

                @media screen {
                  #print-preview-modal-overlay {
                    background-color: rgba(2, 6, 23, 0.98) !important;
                    overflow-y: auto !important;
                    display: block !important;
                    position: fixed !important;
                    inset: 0 !important;
                    z-index: 99999 !important;
                  }

                  #printable-departments-summary {
                    background-color: #ffffff !important;
                    background: #ffffff !important;
                    color: #0f172a !important;
                    border: 2px solid #334155 !important;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
                  }
                }

                /* Rules applying both in screen preview AND print mode */
                #printable-departments-summary,
                #printable-departments-summary * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  letter-spacing: normal !important;
                  word-spacing: normal !important;
                  text-shadow: none !important;
                }

                #printable-departments-summary {
                  background-color: #ffffff !important;
                  color: #0f172a !important;
                }

                #printable-departments-summary h1,
                #printable-departments-summary h2,
                #printable-departments-summary h3,
                #printable-departments-summary p,
                #printable-departments-summary div,
                #printable-departments-summary span,
                #printable-departments-summary td,
                #printable-departments-summary .text-slate-950,
                #printable-departments-summary .text-slate-900,
                #printable-departments-summary .text-slate-800,
                #printable-departments-summary .text-slate-700,
                #printable-departments-summary .text-slate-600 {
                  color: #0f172a !important;
                  text-shadow: none !important;
                }

                #printable-departments-summary .text-slate-500,
                #printable-departments-summary .text-slate-400 {
                  color: #475569 !important;
                  text-shadow: none !important;
                }

                #printable-departments-summary table {
                  border-collapse: collapse !important;
                  width: 100% !important;
                  background-color: #ffffff !important;
                }

                #printable-departments-summary th {
                  background: #0f172a !important;
                  background-color: #0f172a !important;
                  color: #ffffff !important;
                  font-weight: 800 !important;
                  border: 1.5px solid #475569 !important;
                  padding: 10px 6px !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }

                #printable-departments-summary th * {
                  color: #ffffff !important;
                }

                #printable-departments-summary td {
                  border: 1.5px solid #cbd5e1 !important;
                  font-weight: 700 !important;
                  padding: 8px 6px !important;
                  color: #0f172a !important;
                }

                #printable-departments-summary tr:nth-child(even) td {
                  background-color: #f8fafc !important;
                }

                #printable-departments-summary tr:nth-child(odd) td {
                  background-color: #ffffff !important;
                }

                #printable-departments-summary .grand-total-row td,
                #printable-departments-summary .grand-total-row td * {
                  background-color: #f1f5f9 !important;
                  border: 2px solid #334155 !important;
                  color: #0f172a !important;
                  font-weight: 900 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }

                #printable-departments-summary .badge-staff {
                  background-color: #f1f5f9 !important;
                  border: 1px solid #cbd5e1 !important;
                  color: #334155 !important;
                  border-radius: 4px;
                  padding: 3px 6px;
                  display: inline-block;
                  font-weight: 800 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }

                #printable-departments-summary .badge-allowances {
                  background-color: #f0fdf4 !important;
                  border: 1px solid #bbf7d0 !important;
                  color: #166534 !important;
                  border-radius: 4px;
                  padding: 3px 6px;
                  display: inline-block;
                  font-weight: 800 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }

                #printable-departments-summary .badge-deductions {
                  background-color: #fff1f2 !important;
                  border: 1px solid #fecdd3 !important;
                  color: #9f1239 !important;
                  border-radius: 4px;
                  padding: 3px 6px;
                  display: inline-block;
                  font-weight: 800 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }

                #printable-departments-summary .badge-net {
                  background-color: #eff6ff !important;
                  border: 1px solid #bfdbfe !important;
                  color: #1e40af !important;
                  border-radius: 4px;
                  padding: 3px 8px;
                  display: inline-block;
                  font-weight: 800 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }

                #printable-departments-summary .border-dashed {
                  border-style: dashed !important;
                  border-color: #4f46e5 !important;
                  background-color: #f5f3ff !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                #printable-departments-summary .border-dashed * {
                  color: #312e81 !important;
                }
              `}} />

              <div>
                {/* Magnificent Hospital Header with Official Logo Stamp Holder */}
                <div className="flex justify-between items-center border-b-2 border-slate-400 pb-4 mb-4" dir="rtl">
                  <div className="text-right flex-1 pl-4">
                    <h1 className="text-xl sm:text-2xl font-black mb-1" style={{ color: '#0f172a', letterSpacing: 'normal' }}>
                      مستشفى الفرح الأهلي
                    </h1>
                    <p className="text-[10px] sm:text-xs font-extrabold" style={{ color: '#475569', letterSpacing: 'normal' }}>
                      قسم الإدارة المالية والموارد البشرية • تقرير رصد ومطابقة كشوفات الأقسام الطبية والشعب الإستشفائية
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border-2 border-slate-300 p-1 bg-white shadow-md flex items-center justify-center overflow-hidden">
                      {hospitalProfile?.logoUrl ? (
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
                  </div>
                </div>

                {/* Title */}
                <div className="text-center my-4">
                  <h1 className="text-base sm:text-lg font-black border-2 border-slate-800 inline-block px-6 py-2 rounded-xl shadow-sm" style={{ color: '#0f172a', backgroundColor: '#f8fafc', borderColor: '#1e293b', letterSpacing: 'normal' }}>
                    {language === 'ar' ? 'تقرير كشف الرواتب الإجمالي للأقسام والشعب الطبية' : 'Administrative Total Spending Report by Medical Department'}
                  </h1>
                  <p className="text-[10.5px] mt-1.5 font-bold max-w-xl mx-auto leading-relaxed" style={{ color: '#475569' }}>
                    {language === 'ar' ? 'تقرير رسمي معتمد يشمل تفاصيل إجمالي الإضافات، الخصومات وصافي المبالغ المستحقة لكافة الكوادر الطبية والإدارية العاملة بمستشفى الفرح الأهلي' : 'Official departmental spending matrix covering active allowances, deductions and net balances with grand aggregate footer'}
                  </p>
                </div>

                {/* Main Table (Optimized center-aligned) */}
                <table className="w-full text-xs text-center border-collapse mt-3" style={{ tableLayout: 'fixed' }}>
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold h-10 text-center" style={{ backgroundColor: '#0f172a' }}>
                      <th className="p-2.5 font-extrabold border border-slate-400 text-center align-middle w-[26%] text-white" style={{ color: '#ffffff', backgroundColor: '#0f172a' }}>
                        {language === 'ar' ? 'اسم القسم والشعبة الاستشفائية' : 'Department Ward'}
                      </th>
                      <th className="p-2.5 font-extrabold border border-slate-400 text-center align-middle w-[14%] text-white" style={{ color: '#ffffff', backgroundColor: '#0f172a' }}>
                        {language === 'ar' ? 'الكوادر النشطة' : 'Active Staff'}
                      </th>
                      <th className="p-2.5 font-extrabold border border-slate-400 text-center align-middle w-[20%] text-white" style={{ color: '#ffffff', backgroundColor: '#0f172a' }}>
                        {language === 'ar' ? 'إجمالي المخصصات والإضافات' : 'Total Allowances'}
                      </th>
                      <th className="p-2.5 font-extrabold border border-slate-400 text-center align-middle w-[20%] text-white" style={{ color: '#ffffff', backgroundColor: '#0f172a' }}>
                        {language === 'ar' ? 'إجمالي الخصومات والغيابات' : 'Total Deductions'}
                      </th>
                      <th className="p-2.5 font-extrabold border border-slate-400 text-center align-middle w-[20%] text-white" style={{ color: '#ffffff', backgroundColor: '#0f172a' }}>
                        {language === 'ar' ? 'صافي الرواتب المستحقة (الكلي)' : 'Net Cumulative Salary (Total)'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-center">
                    {deptsPayrollStats.map((item, index) => (
                      <tr key={item.id} className="text-center font-bold align-middle" style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                        <td className="p-2.5 border border-slate-300 text-center align-middle font-black" style={{ color: '#0f172a' }}>{item.name}</td>
                        <td className="p-2.5 border border-slate-300 text-center align-middle font-bold">
                          <span className="badge-staff font-bold inline-block" style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155' }}>
                            {item.count} {language === 'ar' ? 'موظف' : 'Staff'}
                          </span>
                        </td>
                        <td className="p-2.5 border border-slate-300 text-center align-middle font-bold font-mono" dir="ltr">
                          <span className="badge-allowances font-bold inline-block" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' }}>
                            {formatIQD(item.totalAllowances)}
                          </span>
                        </td>
                        <td className="p-2.5 border border-slate-300 text-center align-middle font-bold font-mono" dir="ltr">
                          <span className="badge-deductions font-bold inline-block" style={{ backgroundColor: '#fff1f2', border: '1px solid #fecdd3', color: '#9f1239' }}>
                            {formatIQD(item.totalDeductions)}
                          </span>
                        </td>
                        <td className="p-2.5 border border-slate-300 text-center align-middle font-bold font-mono" dir="ltr">
                          <span className="badge-net font-bold inline-block" style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af' }}>
                            {formatIQD(item.totalNet)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {/* Grand Total Row placed strictly at the VERY END of the table rows */}
                    <tr className="grand-total-row font-bold border-t-2 border-slate-500 text-center" style={{ backgroundColor: '#f1f5f9' }}>
                      <td className="p-3 border border-slate-400 text-center font-black text-xs" style={{ color: '#0f172a', backgroundColor: '#f1f5f9' }}>
                        {language === 'ar' ? 'المجموع الكلي النهائي للأقسام' : 'Grand Cumulative Total'}
                      </td>
                      <td className="p-3 border border-slate-400 text-center align-middle font-bold" style={{ backgroundColor: '#f1f5f9' }}>
                        <span className="badge-staff font-black px-3 py-1.5 rounded inline-block" style={{ backgroundColor: '#e2e8f0', border: '1px solid #cbd5e1', color: '#1e293b' }}>
                          {deptsPayrollTotals.activeStaff} {language === 'ar' ? 'موظف' : 'Staff'}
                        </span>
                      </td>
                      <td className="p-3 border border-slate-400 text-center align-middle font-mono font-bold" dir="ltr" style={{ backgroundColor: '#f1f5f9' }}>
                        <span className="badge-allowances font-black px-3 py-1.5 rounded inline-block" style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#14532d' }}>
                          {formatIQD(deptsPayrollTotals.allowances)}
                        </span>
                      </td>
                      <td className="p-3 border border-slate-400 text-center align-middle font-mono font-bold" dir="ltr" style={{ backgroundColor: '#f1f5f9' }}>
                        <span className="badge-deductions font-black px-3 py-1.5 rounded inline-block" style={{ backgroundColor: '#ffe4e6', border: '1px solid #fda4af', color: '#881337' }}>
                          {formatIQD(deptsPayrollTotals.deductions)}
                        </span>
                      </td>
                      <td className="p-3 border border-slate-400 text-center align-middle font-mono font-black" dir="ltr" style={{ backgroundColor: '#dbeafe' }}>
                        <span className="badge-net font-black px-3.5 py-1.5 rounded-lg border text-xs sm:text-sm inline-block" style={{ backgroundColor: '#dbeafe', border: '1px solid #93c5fd', color: '#1e3a8a' }}>
                          {formatIQD(deptsPayrollTotals.net)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Dynamic official signature block & footer */}
              <div className="signature-and-footer-block mt-8">
                <div className="grid grid-cols-3 gap-6 text-center text-xs">
                  <div className="space-y-10">
                    <p className="font-extrabold" style={{ color: '#0f172a' }}>{language === 'ar' ? 'إعداد الحسابات المالية / محاسب المشفى' : 'Prepared by Hospital Accountant'}</p>
                    <p style={{ color: '#94a3b8' }}>..........................................</p>
                  </div>
                  <div className="space-y-10">
                    <p className="font-extrabold" style={{ color: '#0f172a' }}>{language === 'ar' ? 'مدير الموارد البشرية وشؤون الموظفين' : 'HR Manager'}</p>
                    <p style={{ color: '#94a3b8' }}>..........................................</p>
                  </div>
                  <div className="space-y-10">
                    <p className="font-extrabold" style={{ color: '#0f172a' }}>{language === 'ar' ? 'المصادقة والتوقيع / المدير العام للمستشفى' : 'Approved by Hospital Director'}</p>
                    <p style={{ color: '#94a3b8' }}>..........................................</p>
                  </div>
                </div>

                {/* Document Stamp Placeholder & Permanent Legal Footer Watermark */}
                <div className="mt-8 flex justify-between items-end">
                  <div className="text-right text-[10px] max-w-md font-bold leading-relaxed pr-2" style={{ color: '#64748b' }}>
                    تاريخ الطباعة المعتمد: {new Date().toLocaleDateString('en-US')} | رقم المطابقة: Far-PR-{Math.floor(1000 + Math.random() * 9000)}
                  </div>
                  <div className="border-2 border-dashed border-indigo-700/50 rounded-full w-20 h-20 flex items-center justify-center text-[10px] sm:text-[11px] font-bold rotate-12 bg-indigo-50 leading-relaxed pr-1 pb-1" style={{ color: '#312e81', backgroundColor: '#e0e7ff', borderColor: '#6366f1' }}>
                    {language === 'ar' ? 'ختم الحسابات الرسمي' : 'Official Accounts Stamp'}
                  </div>
                </div>

                {/* Retained system copyright watermark - Protected permanent footer */}
                <div className="mt-6 pt-3 border-t border-slate-300 text-center text-[10px] font-bold font-mono" style={{ color: '#64748b', borderColor: '#cbd5e1' }}>
                  حقوق النظام محفوظة لـ: مسؤول النظام المهندس محمد جاسم محمد ابراهيم | رقم الهاتف: 07836885808
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Start New Month Cycle / Archive & Reset Modal */}
      <AnimatePresence>
        {showNewMonthModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 max-w-lg w-full text-slate-200 shadow-2xl space-y-6 relative"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                    <Sparkles className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-white">
                      {language === 'ar' ? 'بدء دورة شهر جديد وتصفير الإحصائيات' : 'Start New Month & Reset Stats'}
                    </h3>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">
                      {language === 'ar' ? 'أرشفة الدورة السابقة والبدء من الصفر للشهر الجديد' : 'Archive current cycle and zero variables'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNewMonthModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">{language === 'ar' ? 'الدورة الحالية النشطة:' : 'Current Cycle:'}</span>
                    <span className="text-cyan-400 font-mono font-black">{activeCycleMonthLabel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">{language === 'ar' ? 'إجمالي الرواتب الحالية:' : 'Total Salaries:'}</span>
                    <span className="text-emerald-400 font-mono font-bold" dir="ltr">{formatIQD(stats.totalNetSalary)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">{language === 'ar' ? 'عدد الموظفين:' : 'Staff Count:'}</span>
                    <span className="text-white font-mono font-bold">{totalEmployees} {language === 'ar' ? 'موظف' : 'Staff'}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300">
                    {language === 'ar' ? 'عنوان دورة الشهر الجديد المراد البدء به:' : 'New Month Cycle Label:'}
                  </label>
                  <input
                    type="text"
                    value={newCycleMonthName}
                    onChange={(e) => setNewCycleMonthName(e.target.value)}
                    placeholder={language === 'ar' ? 'مثال: شهر آب / أغسطس 2026' : 'e.g. August 2026'}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-white text-xs font-bold focus:outline-none transition-all"
                  />
                </div>

                <label className="flex items-start gap-3 p-3.5 bg-slate-950/50 rounded-2xl border border-white/5 cursor-pointer hover:bg-slate-950 transition-colors">
                  <input
                    type="checkbox"
                    checked={autoArchiveCurrentBeforeReset}
                    onChange={(e) => setAutoArchiveCurrentBeforeReset(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-700 bg-slate-900 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-black text-slate-200 block">
                      {language === 'ar' ? 'حفظ نسخة كاملة من رواتب الشهر المنتهي في الأرشيف التاريخي' : 'Save full snapshot to historical archive'}
                    </span>
                    <span className="text-slate-400 text-[11px] block mt-0.5">
                      {language === 'ar'
                        ? 'تتيح لك الرجوع إليها في أي وقت عبر جداول المقارنة واستعراض التقارير السابقة.'
                        : 'Allows you to review this month later in comparisons and historical reports.'}
                    </span>
                  </div>
                </label>

                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[11px] text-amber-300 font-medium leading-relaxed flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    {language === 'ar' ? (
                      <>
                        <strong>تنبيه تصفير المتغيرات:</strong> سيتم تصفير متغيرات هذا الشهر تلقائياً (أيام وساعات العمل الإضافية، الخصومات، والغيابات) لكل الكوادر ليصبحوا جاهزين لإدخال ساعات وأيام الشهر الجديد. الرواتب الأساسية ومخصصات الشهادة والزوجية والأطفال ستبقى محفوظة كما هي.
                      </>
                    ) : (
                      <>
                        <strong>Reset Notice:</strong> Monthly dynamic variables (extra days, hours, absences, deductions) will be reset to 0. Base salaries and fixed marital/degree allowances are preserved.
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewMonthModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={isProcessingNewCycle}
                  onClick={handleStartNewMonthCycle}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-950/50 transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isProcessingNewCycle ? (
                    <span>{language === 'ar' ? 'جاري التحويل والتصفير...' : 'Processing...'}</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-200" />
                      <span>{language === 'ar' ? 'تأكيد والبدء بالشهر الجديد 🚀' : 'Confirm & Start New Month'}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
