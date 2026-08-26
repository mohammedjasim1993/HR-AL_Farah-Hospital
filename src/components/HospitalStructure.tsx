import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Network,
  GitFork,
  Users,
  Building2,
  Building,
  User,
  Plus,
  Briefcase,
  Upload,
  CheckCircle2,
  Sliders,
  DollarSign,
  Fingerprint,
  FileSpreadsheet,
  Edit,
  Trash2,
  X,
  PlusCircle,
  HelpCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Check,
  Layers,
  Printer,
  ChevronDown,
  ShieldCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';
import { Department, Employee, FieldId, UserRole } from '../types';
import { showToast } from '../lib/toast';
import { DEPT_ICON_TEMPLATES } from './DepartmentBuilder';

// Arabic Orthographic Normalization helper for smart search
const normalizeArabic = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[ظض]/g, 'ظ') // unified matching for common typos like الموضف vs الموظف
    .replace(/[\u064B-\u065F]/g, '') // remove diacritics
    .trim()
    .toLowerCase();
};

interface HospitalStructureProps {
  departments: Department[];
  employees: Employee[];
  userRole: UserRole;
  onSaveEmployees: (emps: Employee[]) => void;
  onSaveDepartments: (depts: Department[]) => void;
  hospitalProfile: {
    nameAr: string;
    nameEn: string;
    logo?: string;
    logoUrl?: string;
    addressAr: string;
    addressEn: string;
    phone: string;
  };
  onUpdateHospitalProfile: (profile: any) => void;
  language: 'ar' | 'en';
}

export default function HospitalStructure({
  departments,
  employees,
  userRole,
  onSaveEmployees,
  onSaveDepartments,
  hospitalProfile,
  onUpdateHospitalProfile,
  language
}: HospitalStructureProps) {
  // Navigation tabs within structure view
  const [subTab, setSubTab] = useState<'chart' | 'excel-import'>('chart');

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Selected elements for edit modal
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [newPositionInput, setNewPositionInput] = useState('');
  const [isAddingEmployee, setIsAddingEmployee] = useState<string | null>(null); // holds departmentId when adding

  // New employee inline form state
  const [newEmpForm, setNewEmpForm] = useState({
    name: '',
    employeeCode: '',
    position: '',
    gender: 'male' as 'male' | 'female',
    basicSalary: 1000000,
    currency: 'IQD' as 'IQD' | 'USD',
    isFingerprintExempt: false
  });

  // Excel import sub-state
  const [importType, setImportType] = useState<'employee-ids' | 'departments'>('employee-ids');
  const [excelPreviewData, setExcelPreviewData] = useState<any[] | null>(null);
  const [excelFileName, setExcelFileName] = useState('');

  // Customize & Print Hierarchy states
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [visibleColumns, setVisibleColumns] = useState({
    empId: true,
    name: true,
    department: true,
    role: true,
    finger: true
  });
  const [printSelectedDepts, setPrintSelectedDepts] = useState<string[]>([]);
  const [showPrintPreviewModal, setShowPrintPreviewModal] = useState(false);
  const [isPrintConfigExpanded, setIsPrintConfigExpanded] = useState(false);

  // Advanced print selection states to make printing highly customizable
  const [showPrintSetupModal, setShowPrintSetupModal] = useState(false);
  const [printScope, setPrintScope] = useState<'all' | 'specific'>('all');
  const [printSpecificDeptId, setPrintSpecificDeptId] = useState<string>('');
  const [printIncludeHospitalDetails, setPrintIncludeHospitalDetails] = useState(true);
  const [printTarget, setPrintTarget] = useState<'employees' | 'departments'>('employees');

  // Set all departments selected by default for printing when departments change
  useEffect(() => {
    if (departments.length > 0 && printSelectedDepts.length === 0) {
      setPrintSelectedDepts(departments.map(d => d.id));
    }
  }, [departments]);

  const isReadOnly = userRole === 'DataEntry';

  // Toggle or select tab translation helper
  const isAr = language === 'ar';

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const isEmpInDept = (emp: any, dept: Department) => {
    if (!emp || !dept) return false;
    return (
      emp.departmentId === dept.id ||
      emp.departmentId === dept.name ||
      emp.departmentName === dept.name ||
      emp.departmentName === dept.id ||
      emp.department === dept.name ||
      emp.department === dept.id
    );
  };

  const handlePrint = () => {
    const isIframe = typeof window !== 'undefined' && window.self !== window.top;
    if (isIframe) {
      showToast(
        isAr
          ? 'تنبيه: تعمل الأداة داخل إطار مضمن (iframe)، تم التوجيه المباشر للتنزيل كملف PDF لتفادي قيود المتصفح!'
          : 'Running inside iframe: triggering direct PDF download!',
        'info'
      );
      handleDownloadPDF();
      return;
    }
    const prevTitle = document.title;
    try {
      document.title = printTarget === 'departments' 
        ? (isAr ? 'هيكلية وأقسام المستشفى' : 'Hospital Departments Structure')
        : (isAr ? 'ملاك الكوادر والوظائف' : 'Staff and Personnel Directory');
      window.focus();
      window.print();
    } catch (e) {
      console.error('Print blocked or failed:', e);
      showToast(
        isAr
          ? 'فشلت الطباعة المباشرة بسبب قيود الحماية. يتم التحويل تلقائياً لتنزيل التقرير كملف PDF...'
          : 'Direct printing failed. Downloading report as PDF instead...',
        'error'
      );
      handleDownloadPDF();
    } finally {
      setTimeout(() => {
        document.title = prevTitle;
      }, 350);
    }
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('printable-hospital-structure-sheet');
    if (!element) {
      showToast(isAr ? 'عذراً، لم يتم العثور على محتوى لتصدير الـ PDF!' : 'No content found for PDF export!', 'error');
      return;
    }

    setIsGeneratingPdf(true);
    showToast(
      isAr 
        ? 'جاري إنشاء وتجهيز ملف الـ PDF... يرجى الانتظار ثواني.' 
        : 'Generating PDF file... please wait a moment.',
      'info'
    );

    const titleText = printTarget === 'departments' 
      ? (isAr ? 'تقرير هيكلية وأقسام المستشفى' : 'Hospital Structure Report')
      : (isAr ? 'تقرير ملاك الكوادر الطبية والإدارية' : 'Medical and Admin Staff Report');

    const opt = {
      margin:       10,
      filename:     `${titleText}_${new Date().toISOString().slice(0,10)}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    setTimeout(() => {
      // @ts-ignore
      html2pdf()
        .from(element)
        .set(opt)
        .save()
        .then(() => {
          setIsGeneratingPdf(false);
          showToast(
            isAr
              ? 'تم تصدير وتحميل التقرير كملف PDF بنجاح!'
              : 'Report exported and downloaded as PDF successfully!',
            'success'
          );
        })
        .catch((err: any) => {
          console.error('PDF export error:', err);
          setIsGeneratingPdf(false);
          showToast(
            isAr
              ? 'حدث خطأ أثناء تصدير ملف PDF.'
              : 'An error occurred during PDF export.',
            'error'
          );
        });
    }, 500);
  };

  // Filtered departments by search term
  const filteredDepartments = useMemo(() => {
    if (!searchTerm.trim()) return departments;
    const term = normalizeArabic(searchTerm);
    return departments.filter(d => {
      const deptMatch = normalizeArabic(d.name).includes(term) ||
                        (d.code && normalizeArabic(d.code).includes(term)) ||
                        (d.positions && d.positions.some(p => normalizeArabic(p).includes(term)));
      
      const hasMatchingEmp = employees.some(e => 
        e.departmentId === d.id && (
          normalizeArabic(e.name).includes(term) ||
          (e.employeeCode && normalizeArabic(e.employeeCode).includes(term)) ||
          (e.position && normalizeArabic(e.position).includes(term))
        )
      );
      
      return deptMatch || hasMatchingEmp;
    });
  }, [departments, employees, searchTerm]);

  // Aggregate stats
  const totalBudgetLimit = useMemo(() => {
    return departments.reduce((sum, d) => sum + (d.budgetLimit || 0), 0);
  }, [departments]);

  // Selected print employees using advanced filtering logic
  const printableData = useMemo(() => {
    return employees.filter(emp => {
      if (selectedDepartment === 'all') return true;
      if (emp.departmentId === selectedDepartment) return true;
      const deptObj = departments.find(d => d.id === emp.departmentId);
      if (deptObj && deptObj.name === selectedDepartment) return true;
      if ((emp as any).department === selectedDepartment) return true;
      return false;
    });
  }, [employees, selectedDepartment, departments]);

  const printableEmployees = printableData;

  // File import parser for Excel IDs or Department Structure
  const handleExcelImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const arrayBuffer = evt.target?.result as ArrayBuffer;
        if (!arrayBuffer) return;
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

        if (jsonRows.length < 2) {
          showToast(isAr ? 'المستند فارغ بالكامل أو يفتقد للبيانات الأساسية!' : 'Excel file is empty.', 'error');
          return;
        }

        // Clean headers: Trim any hidden whitespace or Arabic special characters
        const rawHeaders = jsonRows[0] as any[];
        const sanitizedHeaders = rawHeaders.map((h: any) => {
          if (h === null || h === undefined) return '';
          return String(h)
            .replace(/[\u200B-\u200D\uFEFF]/g, '') // trim invisible Arabic formatting characters
            .trim()
            .replace(/\s+/g, ' '); // collapse multiple spaces
        });

        // Parse preview records based on selection
        const parsedRows: any[] = [];
        if (importType === 'employee-ids') {
          // Identify columns for: Name, ID/Code (رقم الموظف أو الاسم)
          const nameColIdx = sanitizedHeaders.findIndex(h => 
            h === 'الاسم' || h === 'الإسم الأول' || h === 'الاسم الأول' || h === 'اسم الموظف' || h === 'اسم الموضف' || h.toLowerCase() === 'name' || h.toLowerCase() === 'employee name'
          );
          const idColIdx = sanitizedHeaders.findIndex(h => 
            h === 'رقم الموظف' || h === 'معرف الموظف' || h === 'الرقم الوظيفي' || h === 'كود الموظف' || h.includes('رقم الموظف') || h.includes('معرف الموظف') || h.toLowerCase() === 'id' || h.toLowerCase() === 'employee id' || h.toLowerCase() === 'employee code'
          );

          if (nameColIdx === -1) {
            showToast(isAr ? 'عذراً، لم نتمكن من العثور على عمود يحمل اسم الموظف في ملف الإكسل لتطبيقه!' : 'Could not find Employee Name column as primary key.', 'error');
            return;
          }

          for (let i = 1; i < jsonRows.length; i++) {
            const row = jsonRows[i];
            if (!row || row.length === 0) continue;
            const empName = row[nameColIdx] !== undefined ? String(row[nameColIdx]).trim() : '';
            const empId = idColIdx !== -1 && row[idColIdx] !== undefined ? String(row[idColIdx]).trim() : '';
            if (empName) {
              parsedRows.push({ name: empName, code: empId, originalRowIndex: i });
            }
          }
        } else {
          // Departments structure
          const deptNameColIdx = sanitizedHeaders.findIndex(h => 
            h === 'القسم' || h === 'اسم القسم' || h === 'أقسام المستشفى' || h.toLowerCase().includes('dept') || h.toLowerCase().includes('department')
          );
          const budgetColIdx = sanitizedHeaders.findIndex(h => 
            h === 'الوزن المالي' || h === 'سقف الميزانية' || h === 'الميزانية' || h.toLowerCase().includes('budget') || h.toLowerCase().includes('limit')
          );

          if (deptNameColIdx === -1) {
            showToast(isAr ? 'لم يتم العثور على عمود اسم القسم في ملف الإكسل!' : 'Could not find Department Name column.', 'error');
            return;
          }

          for (let i = 1; i < jsonRows.length; i++) {
            const row = jsonRows[i];
            if (!row || row.length === 0) continue;
            const deptName = row[deptNameColIdx] !== undefined ? String(row[deptNameColIdx]).trim() : '';
            const budgetVal = budgetColIdx !== -1 && row[budgetColIdx] !== undefined ? parseFloat(String(row[budgetColIdx]).replace(/,/g, '')) : 0;
            if (deptName) {
              parsedRows.push({ name: deptName, budget: isNaN(budgetVal) ? 0 : budgetVal, originalRowIndex: i });
            }
          }
        }

        setExcelPreviewData(parsedRows);
        showToast(isAr ? `تم تحميل ومعالجة ${parsedRows.length} حقل من ملف الإكسل بنجاح!` : `Processed ${parsedRows.length} rows.`, 'success');
      } catch (err) {
        showToast(isAr ? 'حدث خطأ غير متوقع أثناء تفكيك وقرصنة كود الإكسل!' : 'Error parsing Excel sheet.', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleApplyExcelImport = () => {
    if (!excelPreviewData || excelPreviewData.length === 0) return;

    if (importType === 'employee-ids') {
      let linkedCount = 0;
      const updatedEmployees = employees.map(emp => {
        // Attempt fuzzy name matches
        const matched = excelPreviewData.find(row => {
          const rowClean = row.name.replace(/\s+/g, '').toLowerCase();
          const empClean = emp.name.replace(/\s+/g, '').toLowerCase();
          return rowClean === empClean || empClean.includes(rowClean) || rowClean.includes(empClean);
        });

        if (matched && matched.code) {
          linkedCount++;
          return {
            ...emp,
            employeeCode: matched.code
          };
        }
        return emp;
      });

      onSaveEmployees(updatedEmployees);
      showToast(isAr ? `نجاح! تم تحديث ومطابقة الأرقام الوظيفية لـ ${linkedCount} موظف من المستند المالي.` : `Matched & linked ${linkedCount} employee ID codes.`, 'success');
    } else {
      // Import/Update departments
      let addedDeptCount = 0;
      let updatedDeptCount = 0;
      const currentDepts = [...departments];

      excelPreviewData.forEach(row => {
        const existingIdx = currentDepts.findIndex(d => d.name.trim().toLowerCase() === row.name.trim().toLowerCase());
        if (existingIdx !== -1) {
          currentDepts[existingIdx] = {
            ...currentDepts[existingIdx],
            budgetLimit: row.budget || currentDepts[existingIdx].budgetLimit || 50000000
          };
          updatedDeptCount++;
        } else {
          const newDeptId = 'dept_' + Math.random().toString(36).substr(2, 9);
          currentDepts.push({
            id: newDeptId,
            name: row.name,
            positions: ['مدير قسم', 'عضو هيئة طبية'],
            enabledFields: {
              workingDays: true,
              workingHours: true,
              shiftMorning: true,
              shiftEvening: true,
              shiftMiddle: true,
              shiftKhafar: true
            },
            budgetLimit: row.budget || 50000000,
            pricing: {
              dayPrice: 25000,
              hourPrice: 5000,
              shiftMorningPrice: 15000,
              shiftEveningPrice: 20000,
              shiftMiddlePrice: 18000,
              shiftFull24Price: 50000,
              shiftHalf12Price: 25000,
              shiftKhafarPrice: 15000,
              calloutMalePrice: 30000,
              calloutFemalePrice: 30000
            }
          });
          addedDeptCount++;
        }
      });

      onSaveDepartments(currentDepts);
      showToast(isAr ? `ألف مبروك! تم إضافة ${addedDeptCount} قسم جديد وتحديث سقف الموازنة لـ ${updatedDeptCount} قسم حالي.` : `Added ${addedDeptCount} departments & updated ${updatedDeptCount} others.`, 'success');
    }

    // Reset importer view
    setExcelPreviewData(null);
    setExcelFileName('');
  };

  const handleEditEmployeeSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    const updated = employees.map(emp => 
      emp.id === editingEmployee.id ? editingEmployee : emp
    );
    onSaveEmployees(updated);
    setEditingEmployee(null);
    showToast(isAr ? 'تم حفظ التعديلات على كادر الموظف وقاعدة الرواتب الخاصة به فورا!' : 'Saved employee updates.', 'success');
  };

  const handleEditDepartmentSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDepartment) return;

    const updated = departments.map(d => 
      d.id === editingDepartment.id ? editingDepartment : d
    );
    onSaveDepartments(updated);
    setEditingDepartment(null);
    showToast(isAr ? 'تم حفظ تعديلات القسم وسقف الموازنة المخصصة له بنجاح!' : 'Saved department parameters.', 'success');
  };

  const handleAddEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAddingEmployee) return;

    const newEmp: Employee = {
      id: 'emp_' + Math.random().toString(36).substr(2, 9),
      name: newEmpForm.name,
      employeeCode: newEmpForm.employeeCode,
      departmentId: isAddingEmployee,
      position: newEmpForm.position || 'موظف في مستشفى الفرح الأهلي',
      gender: newEmpForm.gender,
      basicSalary: Number(newEmpForm.basicSalary),
      currency: newEmpForm.currency,
      isFingerprintExempt: newEmpForm.isFingerprintExempt,
      workingDays: 26,
      workingHours: 208,
      shiftMorning: 0,
      shiftEvening: 0,
      shiftMiddle: 0,
      shiftFull24: 0,
      shiftHalf12: 0,
      shiftKhafar: 0,
      callouts: 0,
      allowanceDanger: 0,
      allowanceMarriage: 0,
      allowanceChildren: 0,
      allowanceDegree: 0,
      allowanceExtraDays: 0,
      allowanceExtraHours: 0,
      allowanceGeneral: 0,
      allowanceEsnad: 0,
      deductionDays: 0,
      deductionHours: 0,
      deductionPenalties: 0,
      deductionOther: 0,
      previousMonthOver: 0
    };

    onSaveEmployees([...employees, newEmp]);
    setIsAddingEmployee(null);
    setNewEmpForm({
      name: '',
      employeeCode: '',
      position: '',
      gender: 'male',
      basicSalary: 1000000,
      currency: 'IQD',
      isFingerprintExempt: false
    });
    showToast(isAr ? 'تم تسجيل كادر جديد ودمجه ضمن الموازنة والأقسام النشطة!' : 'Registered new employee successfully.', 'success');
  };

  const handleDeleteEmployee = (empId: string) => {
    if (confirm(isAr ? 'هل أنت متأكد تماماً من شطب وحذف هذا الموظف من كشوف الرواتب وقاعدة البيانات؟ لا يمكن التراجع!' : 'Are you sure you want to delete this employee?')) {
      const updated = employees.filter(emp => emp.id !== empId);
      onSaveEmployees(updated);
      showToast(isAr ? 'تم مسح وإقالة الكادر من النظام الإداري بنجاح.' : 'Employee removed successfully.', 'success');
    }
  };

  const getDeptIcon = (index?: number) => {
    const defaultIcon = Building2;
    if (index === undefined || index < 0 || index >= DEPT_ICON_TEMPLATES.length) return defaultIcon;
    return DEPT_ICON_TEMPLATES[index].icon;
  };

  // Safe UI colors
  const activeColorTheme = "border-[#1e3a8a] shadow-blue-500/10";

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Visual Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-l from-[#111827] to-[#1f2937] border border-white/5 relative overflow-hidden shadow-2xl">
        <div className="absolute top-1/2 left-3/4 w-[350px] h-[350px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="p-2 bg-blue-500/15 text-blue-400 rounded-xl border border-blue-500/30">
                <Network className="w-5 h-5 animate-pulse" />
              </span>
              <h2 className="text-lg font-black text-white">{isAr ? 'هيكلية المستشفى وتوزيع الكوادر الطبية' : 'Hospital Structure & Medical Hierarchy'}</h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              {isAr 
                ? 'لوحة تفاعلية متكاملة تعرض الهيكلية الوظيفية لأقسام مستشفى الفرح الأهلي بالتفصيل، مع إمكانية التعديل السريع وإدارة ملفات ملاك إكسل والمطابقة المباشرة بالأرقام التعريفية.'
                : 'Fuzzy matching, visual hierarchical department structures, individual staff allocation control, and smart Excel importer operations.'}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setSubTab('chart')}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                subTab === 'chart'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 ring-2 ring-blue-500/40'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
              }`}
            >
              <GitFork className="w-4 h-4" />
              <span>{isAr ? 'الهيكلية والترابط الوظيفي' : 'Hierarchy Chart'}</span>
            </button>
            <button
              onClick={() => setSubTab('excel-import')}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                subTab === 'excel-import'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 ring-2 ring-blue-500/40'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isAr ? 'استيراد ومطابقة ملفات إكسل' : 'Smart Excel Sync'}</span>
            </button>
          </div>
        </div>
      </div>

      {subTab === 'chart' ? (
        <>
          {/* Overview Bento Board */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-[#111827] border border-white/5 rounded-2xl flex items-center gap-4 shadow-lg">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-extrabold">{isAr ? 'هوية المستشفى النشطة' : 'Hospital Name'}</p>
                <p className="text-sm font-black text-white">{isAr ? hospitalProfile.nameAr : hospitalProfile.nameEn}</p>
              </div>
            </div>

            <div className="p-4 bg-[#111827] border border-white/5 rounded-2xl flex items-center gap-4 shadow-lg">
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-extrabold">{isAr ? 'مجموع الأطقم الطبية والأقسام' : 'Total Departments'}</p>
                <p className="text-sm font-black text-white">{departments.length} {isAr ? 'أقسام إدارية وطبية' : 'Depts'}</p>
              </div>
            </div>

            <div className="p-4 bg-[#111827] border border-white/5 rounded-2xl flex items-center gap-4 shadow-lg">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-extrabold">{isAr ? 'مجموع الكوادر المسجلة بالنظام' : 'Total Appointed Staff'}</p>
                <p className="text-sm font-black text-white">{employees.length} {isAr ? 'موظف وبصمة إبهام' : 'Staff'}</p>
              </div>
            </div>

            <div className="p-4 bg-[#111827] border border-white/5 rounded-2xl flex items-center gap-4 shadow-lg">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-extrabold">{isAr ? 'السقف المالي لهيكلية الأقسام' : 'Total Structure Budget Cap'}</p>
                <p className="text-sm font-black text-amber-400">
                  {totalBudgetLimit.toLocaleString('en-US')} <span className="text-[10px] text-slate-400">IQD</span>
                </p>
              </div>
            </div>
          </div>

          {/* Search bar & Quick addition */}
          <div className="no-print p-4 bg-[#111827] border border-white/5 rounded-2xl flex flex-wrap md:flex-nowrap justify-between items-center gap-4 shadow-xl">
            <div className="relative w-full md:w-96">
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder={isAr ? 'ابحث عن قسم، كادر، رقم وظيفي، عنوان تخصصي...' : 'Search structure, codes, titles...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950/70 border border-white/10 rounded-xl py-2 pr-10 pl-4 text-xs text-slate-200 placeholder-slate-500 h-10 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={() => {
                  setPrintScope('all');
                  setSelectedDepartment('all');
                  setPrintSelectedDepts(departments.map(d => d.id));
                  setPrintTarget('employees');
                  setVisibleColumns({ empId: true, name: true, department: true, role: true, finger: true });
                  setShowPrintPreviewModal(true);
                }}
                className="w-full md:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900/60 backdrop-blur-md border border-white/5 hover:border-cyan-500/25 text-slate-300 hover:text-white rounded-xl text-xs font-black transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/5 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-cyan-400" />
                <span>{isAr ? 'طباعة ملاك الكوادر' : 'Print Staff Directory'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPrintScope('all');
                  setSelectedDepartment('all');
                  setPrintSelectedDepts(departments.map(d => d.id));
                  setPrintTarget('departments');
                  setVisibleColumns({ empId: false, name: false, department: true, role: true, finger: false });
                  setShowPrintPreviewModal(true);
                }}
                className="w-full md:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900/60 backdrop-blur-md border border-white/5 hover:border-indigo-500/25 text-slate-350 hover:text-white rounded-xl text-xs font-black transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/5 cursor-pointer"
              >
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>{isAr ? 'طباعة هيكلية الأقسام' : 'Print Departments'}</span>
              </button>

              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => {
                    if (departments.length === 0) {
                      showToast(isAr ? 'يرجى تهيئة قسم طبي واحد على الأقل أولا مسبقاً!' : 'Create at least one department first.', 'error');
                      return;
                    }
                    setIsAddingEmployee(departments[0].id);
                  }}
                  className="w-full md:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg shadow-emerald-600/15"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{isAr ? 'تعيين كادر جديد بالهيكلية' : 'Hire New Staff'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Connected Tree Root representing the entire Hospital */}
          <div className="flex flex-col items-center justify-center py-6">
            <div className="relative p-6 rounded-2xl bg-gradient-to-b from-[#141b2d] to-[#0d111d] border border-blue-500/25 shadow-2xl flex flex-col items-center justify-center text-center w-72 z-10">
              <span className="p-3 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/40 mb-3 animate-ping absolute -top-5 w-12 h-12 flex items-center justify-center opacity-45" />
              <div className="p-3 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/40 mb-3 z-10 w-12 h-12 flex items-center justify-center">
                <Building className="w-5 h-5" />
              </div>
              <h3 className="text-md font-black text-white">{isAr ? hospitalProfile.nameAr : hospitalProfile.nameEn}</h3>
              <p className="text-[10px] text-slate-400 mt-1">{isAr ? 'المستوى الأول: المجلس الإداري الرئيسي' : 'Level 1: Primary Administrative Board'}</p>
              
              {/* Dynamic Connector */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-[2px] h-12 bg-gradient-to-b from-blue-500/50 to-indigo-500/30" />
            </div>

            {/* Structural vertical gap line */}
            <div className="h-10" />

            {/* Level 2: Departments Bento Grid */}
            {filteredDepartments.length === 0 ? (
              <div className="p-12 text-center bg-[#111827] border border-white/5 rounded-2xl w-full max-w-4xl shadow-inner">
                <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <h4 className="text-sm font-black text-slate-350">{isAr ? 'لا يوجد أقسام تطابق حقول البحث الخاصة بك!' : 'No departments match search queries.'}</h4>
                <p className="text-xs text-slate-500 mt-1">{isAr ? 'أدخل مصطلحات بحث أخرى أو قم بإنشاء أقسام في لوحة التحكم.' : 'Modify search filter or create departments.'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl mx-auto">
                {filteredDepartments.map((dept, dIdx) => {
                  const DeptIcon = getDeptIcon(dept.iconIndex);
                  const deptStaff = employees.filter(e => e.departmentId === dept.id);
                  const totalDeptBasic = deptStaff.reduce((sum, e) => sum + e.basicSalary, 0);
                  const isBudgetCeilingSurpassed = (dept.budgetLimit && totalDeptBasic > dept.budgetLimit);

                  return (
                    <motion.div
                      key={dept.id}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: dIdx * 0.05 }}
                      className={`p-5 rounded-2xl bg-[#111827] border flex flex-col justify-between shadow-xl relative overflow-hidden group ${
                        isBudgetCeilingSurpassed ? 'border-amber-500/40 shadow-amber-500/5' : 'border-white/5 hover:border-slate-700'
                      }`}
                    >
                      {/* Connection Dots decorative */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-indigo-500/40 -translate-y-1 block" />

                      <div>
                        {/* Department Card Header */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-2.5">
                            <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                              <DeptIcon className="w-4 h-4" />
                            </span>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="text-base font-black text-white group-hover:text-blue-400 transition-colors">{dept.name}</h4>
                                {dept.code && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-black bg-blue-500/15 text-blue-400 rounded-md border border-blue-500/30">
                                    {isAr ? `رقم ${dept.code}` : `#${dept.code}`}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-350 font-bold mt-1">{deptStaff.length} {isAr ? 'كوادر طبية وإدارية' : 'Appointed staff'}</p>
                            </div>
                          </div>

                          <div className="flex gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => {
                                setPrintScope('specific');
                                setSelectedDepartment(dept.id);
                                setPrintSelectedDepts([dept.id]);
                                setPrintTarget('employees');
                                setVisibleColumns({ empId: true, name: true, department: true, role: true, finger: true });
                                setShowPrintPreviewModal(true);
                              }}
                              className="p-1.5 hover:bg-white/5 border border-white/10 rounded-lg text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                              title={isAr ? 'تخصيص وطباعة هيكلية هذا القسم' : 'Customize and print this department'}
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            {!isReadOnly && (
                              <button
                                type="button"
                                onClick={() => setEditingDepartment(dept)}
                                className="p-1.5 hover:bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                                title={isAr ? 'تعديل سقف موازنة القسم' : 'Modify budget limit'}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Financial ceiling status */}
                        <div className="p-3.5 rounded-xl bg-slate-950/50 border border-white/5 space-y-2.5 mb-4">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-300 font-bold">{isAr ? 'الكتلة المالية الأساسية:' : 'Basic payroll mass:'}</span>
                            <span className="font-extrabold text-blue-300">{totalDeptBasic.toLocaleString('en-US')} IQD</span>
                          </div>
                          
                          {dept.budgetLimit && (
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-300 font-bold">{isAr ? 'سقف ميزانية القسم:' : 'Budget ceiling limit:'}</span>
                                <span className="font-mono text-rose-300 font-black">{dept.budgetLimit.toLocaleString('en-US')} IQD</span>
                              </div>
                              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${isBudgetCeilingSurpassed ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${Math.min(100, (totalDeptBasic / dept.budgetLimit) * 100)}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {isBudgetCeilingSurpassed && (
                            <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-black animate-pulse pt-0.5">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>{isAr ? 'تنبيه: تجاوز ميزانية القسم المقررة بالتوزيع!' : 'Alert: Allocation exceeds department budget!'}</span>
                            </div>
                          )}
                        </div>

                        {/* Appointed Staff List inside department card */}
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          <p className="text-xs text-[#06b6d4] font-black pb-1.5 border-b border-white/5">{isAr ? 'الكوادر والوظائف النشطة:' : 'Positions & Appointed Staff:'}</p>
                          {(() => {
                            const searchClean = normalizeArabic(searchTerm);
                            const displayedStaff = (() => {
                              if (!searchClean) return deptStaff;
                              const filtered = deptStaff.filter(e => 
                                normalizeArabic(e.name).includes(searchClean) ||
                                (e.employeeCode && normalizeArabic(e.employeeCode).includes(searchClean)) ||
                                (e.position && normalizeArabic(e.position).includes(searchClean))
                              );
                              if (filtered.length === 0 && (
                                normalizeArabic(dept.name).includes(searchClean) ||
                                (dept.positions && dept.positions.some(p => normalizeArabic(p).includes(searchClean)))
                              )) {
                                return deptStaff;
                              }
                              return filtered;
                            })();

                            if (displayedStaff.length === 0) {
                              return <p className="text-[10px] text-slate-450 text-center py-4 italic">{isAr ? 'لا يوجد نتائج مطابقة في هذا القسم' : 'No matching results in this department.'}</p>;
                            }

                            return displayedStaff.map(emp => (
                              <div
                                key={emp.id}
                                className="p-3 rounded-xl bg-slate-950/70 border border-white/5 hover:border-[#06b6d4]/50 flex items-center justify-between gap-3 transition-all cursor-pointer group/emp hover:translate-x-1 shadow-md shadow-black/10"
                                onClick={() => setEditingEmployee(emp)}
                              >
                                <div className="flex items-center gap-2.5 truncate">
                                  <div className={`p-1.5 rounded-lg shrink-0 ${emp.gender === 'female' ? 'bg-pink-500/10 text-pink-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                    <User className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="truncate">
                                    <p className="text-xs font-black text-slate-200 group-hover/emp:text-[#06b6d4] transition-colors truncate">{emp.name}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5 max-w-full">
                                      <span className="text-[10px] text-slate-400 font-bold truncate">{emp.position}</span>
                                      {emp.isFingerprintExempt && (
                                        <span className="text-[9px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-1 rounded font-black shrink-0" title={isAr ? 'معفى من بصمة العمل' : 'Fingerprint exempt'}>
                                          {isAr ? 'ثابت' : 'Exempt'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <p className="text-[10px] font-mono font-black text-slate-300">{emp.employeeCode || `${isAr ? 'بدون كود' : 'No ID'}`}</p>
                                  <p className="text-[9px] font-bold text-slate-400 mt-0.5">{(emp.basicSalary/1000).toLocaleString('en-US')}k {emp.currency || 'IQD'}</p>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>

                      {/* Hire staff helper trigger inside department box */}
                      {!isReadOnly && (
                        <button
                          onClick={() => setIsAddingEmployee(dept.id)}
                          className="w-full mt-4 flex items-center justify-center gap-1 py-1.5 hover:bg-[#06b6d4]/10 hover:text-white text-slate-400 rounded-xl text-[9.5px] font-extrabold transition-all border border-dashed border-white/5 hover:border-dashed hover:border-[#06b6d4]/40 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>{isAr ? 'إجراء تعيين سريع في هذا القسم' : 'Quick Hire under this Department'}</span>
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Print customization options are now handled via a premium popup dialog portal */}
        </>
      ) : (
        /* Excel Smart Matcher & Importer Pane */
        <div className="p-6 rounded-2xl bg-[#111827] border border-white/5 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-4 gap-4">
            <div>
              <h3 className="text-md font-black text-white">{isAr ? 'مساعد وقارئ ملفات الملاك الذكي من إكسل' : 'Smart Excel HR Blueprint Reader'}</h3>
              <p className="text-xs text-slate-400 mt-1">
                {isAr 
                  ? 'اختر نمط المطابقة لملف الإكسل لربط الأرقام الوظيفية بالاسم أو لتوليد مصفوفة الهيكلية والأقسام مباشرة.'
                  : 'Fuzzy match names over database profiles to merge worker ID numbers automatically.'}
              </p>
            </div>

            <div className="bg-slate-950 p-1 rounded-xl border border-white/5 flex gap-1 shadow-inner w-full md:w-auto">
              <button
                onClick={() => {
                  setImportType('employee-ids');
                  setExcelPreviewData(null);
                  setExcelFileName('');
                }}
                className={`flex-1 md:flex-initial text-center px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  importType === 'employee-ids' ? 'bg-blue-600 text-white' : 'text-slate-400'
                }`}
              >
                {isAr ? 'مطابقة وتحديث أرقام الكوادر (Employee IDs)' : 'Link Employee IDs'}
              </button>
              <button
                onClick={() => {
                  setImportType('departments');
                  setExcelPreviewData(null);
                  setExcelFileName('');
                }}
                className={`flex-1 md:flex-initial text-center px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  importType === 'departments' ? 'bg-blue-600 text-white' : 'text-slate-400'
                }`}
              >
                {isAr ? 'إضافة وتحديث هيكل الأقسام (Departments)' : 'Import Departments'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Upload Zone */}
            <div className="md:col-span-1 border border-dashed border-white/10 rounded-2xl p-6 bg-slate-950/40 text-center flex flex-col justify-center items-center gap-3 relative hover:bg-slate-950/60 hover:border-blue-500/30 transition-all">
              <span className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
                <Upload className="w-6 h-6 animate-bounce" />
              </span>
              <div className="space-y-1">
                <p className="text-xs font-black text-white">{isAr ? 'اختر ملف إنجاز ملاك العمل' : 'Select Excel roster report'}</p>
                <p className="text-[10px] text-slate-500 font-bold">يدعم الصيغ: (.csv, .xlsx, .xls)</p>
              </div>
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                disabled={isReadOnly}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                onChange={handleExcelImportFile}
              />
              {excelFileName && (
                <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[10px] text-blue-300 font-mono font-bold mt-2">
                  ✓ {excelFileName}
                </div>
              )}
            </div>

            {/* Explanatory Box */}
            <div className="md:col-span-2 p-5 bg-slate-950/35 border border-white/5 rounded-2xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-blue-400 text-xs font-black">
                  <HelpCircle className="w-4 h-4" />
                  <span>{isAr ? 'كيفية تشغيل واستخدام المستورد الذكي:' : 'Using the Intelligent Importer:'}</span>
                </div>
                <ul className="text-[10px] text-slate-400 space-y-2 list-disc list-inside leading-relaxed font-semibold">
                  {importType === 'employee-ids' ? (
                    <>
                      <li>{isAr ? 'قم برفع ملف إكسل يحتوي كحد أدنى على عمود يحمل قيمة اسم الكادر "الاسم" أو "الاسم الأول" وعمود "رقم الموظف".' : 'Upload an Excel workbook featuring names and ID codes.'}</li>
                      <li>{isAr ? 'سيموم معالج الذكاء بالنظام تلقائياً بمطابقة عمود الاسم في ملف Excel مع الكوادر النشطة في قاعدة بيانات المستشفى.' : 'Will parse and overlay raw values smoothly into corresponding system fields.'}</li>
                      <li>{isAr ? 'يتم مطابقة التعديلات بشكل فوري وآمن وتحديث الأرقام الوظيفية والوجبات.' : 'Ensures 100% correct matching using robust whitespace sanitization.'}</li>
                    </>
                  ) : (
                    <>
                      <li>{isAr ? 'ارفع ملف إكسل يحتوي على أسماء الأقسام الطبية "اسم القسم" وعمود موازنة القسم "سقف الميزانية".' : 'Upload an Excel sheet detailing department names and budgets.'}</li>
                      <li>{isAr ? 'الأقسام التي لا وجود لها سيتم جدولتها وتوليدها تلقائياً بهيكلية المستشفى وتعيين الأصول المالية لها.' : 'Newly parsed entries will automatically be spawned as new nodes in the visual structure.'}</li>
                    </>
                  )}
                </ul>
              </div>

              {excelPreviewData && (
                <div className="pt-4 border-t border-white/5 flex justify-end gap-2.5">
                  <button
                    onClick={() => {
                      setExcelPreviewData(null);
                      setExcelFileName('');
                    }}
                    className="p-2 px-4 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    {isAr ? 'إلغاء تماما واختيار ملف آخر' : 'Discard File'}
                  </button>
                  <button
                    onClick={handleApplyExcelImport}
                    className="p-2 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg shadow-blue-500/20 flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isAr ? 'تأكيد الحفظ ودمج البيانات الفوري' : 'Merge and Sync Database Now'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Excel Preview Grid rendering */}
          {excelPreviewData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <h4 className="text-xs font-black text-white">{isAr ? 'معاينة هيكلية وقائمة البيانات المحللة:' : 'Decoded Rows Preview Matrix:'}</h4>
              </div>

              <div className="overflow-x-auto border border-white/5 rounded-2xl max-h-96">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#1f2937]/50 text-slate-300 font-extrabold border-b border-white/5">
                    <tr>
                      <th className="p-3 font-semibold">{isAr ? 'الصف بالملف' : 'Excel Row'}</th>
                      {importType === 'employee-ids' ? (
                        <>
                          <th className="p-3 font-semibold">{isAr ? 'اسم الكادر المكتشف' : 'Identified Name'}</th>
                          <th className="p-3 font-bold text-blue-400">{isAr ? 'الرقم الوظيفي الجديد المقترح' : 'Suggested code'}</th>
                          <th className="p-3 font-semibold">{isAr ? 'حالة المطابقة الأولية بقاعدة البيانات' : 'System Database match status'}</th>
                        </>
                      ) : (
                        <>
                          <th className="p-3 font-semibold">{isAr ? 'اسم القسم المكتشف' : 'Identified Department'}</th>
                          <th className="p-3 font-bold text-indigo-400">{isAr ? 'سقف ميزانية القسم المقترحة' : 'Budget Target'}</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {excelPreviewData.map((row, idx) => {
                      let dbMatch = false;
                      if (importType === 'employee-ids') {
                        dbMatch = employees.some(e => {
                          const rowClean = row.name.replace(/\s+/g, '').toLowerCase();
                          const empClean = e.name.replace(/\s+/g, '').toLowerCase();
                          return rowClean === empClean || empClean.includes(rowClean) || rowClean.includes(empClean);
                        });
                      }

                      return (
                        <tr key={idx} className="hover:bg-slate-900/50">
                          <td className="p-3 font-mono font-bold text-slate-500">#{row.originalRowIndex}</td>
                          {importType === 'employee-ids' ? (
                            <>
                              <td className="p-3 font-black text-slate-200">{row.name}</td>
                              <td className="p-3 font-mono font-bold text-blue-400">{row.code || 'N/A'}</td>
                              <td className="p-3">
                                {dbMatch ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-5800/10 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                                    <Check className="w-3 h-3" />
                                    <span>{isAr ? 'مطابق لملف بالسيستم وطبقة الرواتب' : 'Perfect Profile Match'}</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/30">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>{isAr ? 'غير مدرج حاليا بالسيستم (صالح للمطابقة بالاسم)' : 'Unmatched Staff'}</span>
                                  </span>
                                )}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-3 font-black text-slate-200">{row.name}</td>
                              <td className="p-3 font-mono font-bold text-indigo-400">{row.budget ? row.budget.toLocaleString('en-US') + ' IQD' : '50,000,000 IQD (تلقائي)'}</td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Editing Employee Modal dialog inside structure pane */}
      <AnimatePresence>
        {editingEmployee && (
          <div className="no-print fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111827] border border-white/10 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
            >
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#1f2937]/45">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-blue-500/15 text-blue-400 rounded-lg">
                    <User className="w-4 h-4" />
                  </span>
                  <h4 className="text-sm font-black text-white">{isAr ? 'تعديل بيانات الكادر والرواتب بالهيكلية' : 'Edit Appointed Employee'}</h4>
                </div>
                <button
                  onClick={() => setEditingEmployee(null)}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditEmployeeSave} className="p-5 space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1.5">{isAr ? 'الاسم الكامل للموظف/الكادر' : 'Employee Full Name'}</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={editingEmployee.name}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                      className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-2 px-3 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1.5">{isAr ? 'الرقم الوظيفي (ID Code)' : 'Job Reference Code'}</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={editingEmployee.employeeCode || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, employeeCode: e.target.value })}
                      className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-2 px-3 text-slate-250 focus:outline-none focus:border-blue-500 font-mono transition-colors"
                      placeholder="e.g. 102345"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1.5">{isAr ? 'العنوان وتوصيف التخصص' : 'Staff Position / Title'}</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={editingEmployee.position}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, position: e.target.value })}
                      className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-2 px-3 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1.5">{isAr ? 'قسم العمل النشط بالهيكل' : 'Assigned Department'}</label>
                    <select
                      disabled={isReadOnly}
                      value={editingEmployee.departmentId}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, departmentId: e.target.value })}
                      className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-2 px-3 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id} className="bg-slate-950 text-slate-200">{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1.5">{isAr ? 'الراتب المالي الأساسي' : 'Basic Monthly Salary'}</label>
                    <input
                      type="number"
                      disabled={isReadOnly}
                      value={editingEmployee.basicSalary}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, basicSalary: Number(e.target.value) })}
                      className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-2 px-3 text-slate-200 focus:outline-none focus:border-blue-500 font-mono transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1.5">{isAr ? 'عملة احتساب الموازنة' : 'Base Currency'}</label>
                    <select
                      disabled={isReadOnly}
                      value={editingEmployee.currency || 'IQD'}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, currency: e.target.value as 'IQD' | 'USD' })}
                      className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-2 px-3 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="IQD" className="bg-slate-950">دينار عراقي IQD</option>
                      <option value="USD" className="bg-slate-950 font-sans">دولار أمريكي USD</option>
                    </select>
                  </div>
                </div>

                {/* Fingerprint exemption status (ثابت وغير خاضع للبصمة) */}
                <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                      <Fingerprint className="w-4 h-4 animate-pulse" />
                    </span>
                    <div>
                      <h5 className="text-[11px] font-black text-white">{isAr ? 'موظف غير خاضع للبصمة (راتب ثابت مكتمل)' : 'Fingerprint Exempt Employee'}</h5>
                      <p className="text-[9px] text-[#06b6d4] mt-0.5">{isAr ? 'يتم احتساب راتبه كاملا متكاملا واستثنائه من تفاصيل كشوفات الحضور' : 'Exclude this staff member from typical fine rules'}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    disabled={isReadOnly}
                    checked={editingEmployee.isFingerprintExempt || false}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, isFingerprintExempt: e.target.checked })}
                    className="w-4.5 h-4.5 rounded border-white/10 bg-slate-950 text-blue-600 focus:ring-blue-500/50"
                  />
                </div>

                {/* Form Buttons */}
                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => {
                        handleDeleteEmployee(editingEmployee.id);
                        setEditingEmployee(null);
                      }}
                      className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 transition-colors font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isAr ? 'إنهاء الخدمات وحذف الكادر' : 'Fire employee'}</span>
                    </button>
                  )}

                  <div className="flex gap-2 mr-auto">
                    <button
                      type="button"
                      onClick={() => setEditingEmployee(null)}
                      className="p-2 px-4 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl font-bold transition-all cursor-pointer"
                    >
                      {isAr ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={isReadOnly}
                      className="p-2 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-black transition-all cursor-pointer shadow-lg shadow-blue-500/20"
                    >
                      {isAr ? 'تحديث وتطبيق الحفظ' : 'Build & Save'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Editing Department Modal inside structure pane */}
      <AnimatePresence>
        {editingDepartment && (
          <div className="no-print fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111827] border border-white/10 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
            >
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#1f2937]/45">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-500/15 text-indigo-400 rounded-lg">
                    <Building2 className="w-4 h-4" />
                  </span>
                  <h4 className="text-sm font-black text-white">{isAr ? 'تعديل سقف موازنة وخصائص القسم' : 'Edit Department Parameters'}</h4>
                </div>
                <button
                  onClick={() => setEditingDepartment(null)}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditDepartmentSave} className="p-5 space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-400 mb-1.5">{isAr ? 'اسم القسم المعتمد بالمستشفى' : 'Primary Department Name'}</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={editingDepartment.name}
                    onChange={(e) => setEditingDepartment({ ...editingDepartment, name: e.target.value })}
                    className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-2 px-3 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1.5">{isAr ? 'رمز أو كود القسم' : 'Department Code / Number'}</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={editingDepartment.code || ''}
                    onChange={(e) => setEditingDepartment({ ...editingDepartment, code: e.target.value })}
                    className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-2 px-3 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder={isAr ? 'مثال: 101 أو DEPT-02' : 'e.g. 101 or DEPT-02'}
                  />
                </div>

                {/* Position Management */}
                <div className="space-y-2 pt-1 border-t border-white/5">
                  <label className="block text-slate-300 font-bold mb-1">{isAr ? 'إدارة وتسميات المناصب والوظائف بالقسم' : 'Department Position Titles'}</label>
                  <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-950/60 border border-white/5 rounded-xl max-h-36 overflow-y-auto">
                    {(editingDepartment.positions || []).length === 0 ? (
                      <span className="text-[10px] text-slate-500 italic">{isAr ? 'لا توجد مناصب مضافة لهذا القسم' : 'No positions defined'}</span>
                    ) : (
                      (editingDepartment.positions || []).map((pos, pIdx) => (
                        <div key={pIdx} className="flex items-center gap-1.5 bg-blue-950/60 border border-blue-500/30 text-blue-200 px-2.5 py-1 rounded-lg text-[11px] font-semibold">
                          <span>{pos}</span>
                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (editingDepartment.positions || []).filter((_, i) => i !== pIdx);
                                setEditingDepartment({ ...editingDepartment, positions: updated });
                              }}
                              className="text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                              title={isAr ? 'حذف المنصب' : 'Remove position'}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {!isReadOnly && (
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={newPositionInput}
                        onChange={(e) => setNewPositionInput(e.target.value)}
                        placeholder={isAr ? 'إضافة منصب جديد (مثال: طبيب أخصائي، ممرض أقدم)...' : 'Add position name...'}
                        className="flex-1 bg-slate-950/50 border border-white/10 rounded-xl px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newPositionInput.trim() && editingDepartment) {
                              const curr = editingDepartment.positions || [];
                              if (!curr.includes(newPositionInput.trim())) {
                                setEditingDepartment({
                                  ...editingDepartment,
                                  positions: [...curr, newPositionInput.trim()]
                                });
                                setNewPositionInput('');
                              }
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newPositionInput.trim() && editingDepartment) {
                            const curr = editingDepartment.positions || [];
                            if (!curr.includes(newPositionInput.trim())) {
                              setEditingDepartment({
                                ...editingDepartment,
                                positions: [...curr, newPositionInput.trim()]
                              });
                              setNewPositionInput('');
                            }
                          }
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isAr ? 'إضافة' : 'Add'}</span>
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 mb-1.5">{isAr ? 'سقف الميزانية المالية الشهري (Budget Caps)' : 'Monthly Budget Limits'}</label>
                  <input
                    type="number"
                    disabled={isReadOnly}
                    value={editingDepartment.budgetLimit || 50000000}
                    onChange={(e) => setEditingDepartment({ ...editingDepartment, budgetLimit: Number(e.target.value) })}
                    className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-2 px-3 text-slate-200 focus:outline-none focus:border-blue-500 font-mono transition-colors"
                  />
                  <p className="text-[9px] text-[#06b6d4] mt-1">{isAr ? 'الحد الأعلى المقترح للرواتب في هذا القسم للوقوف ضد أي هدر أو مخاطر مالية.' : 'Sets warning flag when department payroll exceeds limit.'}</p>
                </div>

                <div className="pt-2">
                  <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 hover:border-emerald-500/50 transition-all">
                    <div className="flex items-center gap-2 text-right" dir="rtl">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-slate-200 text-xs font-bold block">
                          {isAr ? 'تفعيل خدمة الضمان الاجتماعي (خصم 5%)' : 'Enable Social Security (5% Deduction)'}
                        </span>
                        <span className="text-[9.5px] text-slate-400 font-normal block mt-0.5">
                          {isAr ? 'خصم 5% من الراتب المستحق لجميع كوادر هذا القسم لصالح الضمان الاجتماعي.' : 'Deduct 5% from gross earned salary for Social Security.'}
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      disabled={isReadOnly}
                      checked={!!editingDepartment.enableSocialSecurity}
                      onChange={(e) => setEditingDepartment({ ...editingDepartment, enableSocialSecurity: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-900 border-slate-700 cursor-pointer shrink-0 mr-2"
                    />
                  </label>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditingDepartment(null)}
                    className="p-2 px-4 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl font-bold transition-all cursor-pointer"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isReadOnly}
                    className="p-2 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-black transition-all cursor-pointer shadow-lg shadow-blue-500/20"
                  >
                    {isAr ? 'تأكيد وحفظ الموازنة' : 'Apply ceiling limits'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Adding Employee Dialog Modal */}
      <AnimatePresence>
        {isAddingEmployee && (
          <div className="no-print fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111827] border border-white/10 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
            >
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#1f2937]/45">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-550/15 text-emerald-400 rounded-lg">
                    <PlusCircle className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
                  </span>
                  <h4 className="text-sm font-black text-white">{isAr ? 'تعيين كادر جديد مدرج بالهيكلية' : 'Hire New Faculty Member'}</h4>
                </div>
                <button
                  onClick={() => setIsAddingEmployee(null)}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddEmployeeSubmit} className="p-5 space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1.5">{isAr ? 'الاسم الكامل للموظف/الكادر' : 'Employee Full Name'}</label>
                    <input
                      type="text"
                      value={newEmpForm.name}
                      onChange={(e) => setNewEmpForm({ ...newEmpForm, name: e.target.value })}
                      placeholder={isAr ? 'الاسم الثلاثي أو الكامل للكوادر' : 'Full legal name'}
                      className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-2 px-3 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1.5">{isAr ? 'الرقم الوظيفي (ID Code)' : 'Job Reference Code'}</label>
                    <input
                      type="text"
                      value={newEmpForm.employeeCode}
                      onChange={(e) => setNewEmpForm({ ...newEmpForm, employeeCode: e.target.value })}
                      placeholder="e.g. 102123"
                      className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-2 px-3 text-slate-200 focus:outline-none focus:border-blue-500 font-mono transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1.5">{isAr ? 'العنوان وتوصيف التخصص' : 'Staff Position / Title'}</label>
                    <input
                      type="text"
                      value={newEmpForm.position}
                      onChange={(e) => setNewEmpForm({ ...newEmpForm, position: e.target.value })}
                      placeholder={isAr ? 'e.g. طبيب مقيم أقدم جراحة' : 'Staff level position'}
                      className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-2 px-3 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1.5">{isAr ? 'النوع الاجتماعي' : 'Gender'}</label>
                    <select
                      value={newEmpForm.gender}
                      onChange={(e) => setNewEmpForm({ ...newEmpForm, gender: e.target.value as 'male' | 'female' })}
                      className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-2 px-3 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="male" className="bg-slate-950">{isAr ? 'ذكر' : 'Male'}</option>
                      <option value="female" className="bg-slate-950">{isAr ? 'أنثى' : 'Female'}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1.5">{isAr ? 'الراتب المالي الأساسي' : 'Basic Monthly Salary'}</label>
                    <input
                      type="number"
                      value={newEmpForm.basicSalary}
                      onChange={(e) => setNewEmpForm({ ...newEmpForm, basicSalary: Number(e.target.value) })}
                      className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-2 px-3 text-slate-200 focus:outline-none focus:border-blue-500 font-mono transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1.5">{isAr ? 'عملة احتساب الموازنة' : 'Base Currency'}</label>
                    <select
                      value={newEmpForm.currency}
                      onChange={(e) => setNewEmpForm({ ...newEmpForm, currency: e.target.value as 'IQD' | 'USD' })}
                      className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-2 px-3 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="IQD" className="bg-slate-950">دينار عراقي IQD</option>
                      <option value="USD" className="bg-slate-950">دولار أمريكي USD</option>
                    </select>
                  </div>
                </div>

                {/* Fingerprint exemption status (ثابت وغير خاضع للبصمة) */}
                <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                      <Fingerprint className="w-4 h-4 animate-pulse" />
                    </span>
                    <div>
                      <h5 className="text-[11px] font-black text-white">{isAr ? 'موظف غير خاضع للبصمة (راتب ثابت مكتمل)' : 'Fingerprint Exempt Employee'}</h5>
                      <p className="text-[9px] text-[#06b6d4] mt-0.5">{isAr ? 'يتم استثنائه من استقطاعات الغياب أو الغرامات ويستحق راتبه الأساسي متكاملاً.' : 'Exclude this staff member from standard fine controls.'}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={newEmpForm.isFingerprintExempt}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, isFingerprintExempt: e.target.checked })}
                    className="w-4.5 h-4.5 rounded border-white/10 bg-slate-950 text-blue-600 focus:ring-blue-500/50"
                  />
                </div>

                {/* Modal Buttons */}
                <div className="pt-4 border-t border-white/5 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAddingEmployee(null)}
                    className="p-2 px-4 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl font-bold transition-all cursor-pointer"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="p-2 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black transition-all cursor-pointer shadow-lg shadow-emerald-550/20"
                  >
                    {isAr ? 'تسجيل الموظف وقبول العقد' : 'Hire & Assign'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Custom Print Setup Modal Portal */}
      <AnimatePresence>
        {showPrintSetupModal && typeof window !== 'undefined' && createPortal(
          <div className="no-print fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111827] border border-white/10 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
            >
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#1f2937]/45">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-blue-500/15 text-blue-400 rounded-lg">
                    <Printer className="w-4 h-4" />
                  </span>
                  <h4 className="text-sm font-black text-white">{isAr ? 'خيارات تخصيص وطباعة هيكلية الكوادر والأقسام' : 'Customize Print Report'}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPrintSetupModal(false)}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-5 text-xs text-right" dir={isAr ? 'rtl' : 'ltr'}>
                {/* Step 1: Print Scope Selection / Dropdown */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-black text-cyan-400 text-right">
                    {isAr ? '1. نطاق تقرير الكادر وملاكه (تصفية الأقسام):' : '1. Report Scope / Filter Department:'}
                  </label>
                  <div className="relative">
                    <select
                      id="selected-department-print"
                      value={selectedDepartment}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedDepartment(val);
                        if (val === 'all') {
                          setPrintSelectedDepts(departments.map(d => d.id));
                        } else {
                          setPrintSelectedDepts([val]);
                        }
                      }}
                      className="w-full bg-slate-950 border border-white/10 hover:border-white/20 rounded-xl py-3 px-4 text-slate-250 focus:outline-none focus:border-cyan-500 font-bold cursor-pointer text-xs transition-colors"
                    >
                      <option value="all" className="bg-slate-950 text-slate-200">
                        {isAr ? 'الكل (كافة الأقسام الطبية والإدارية المتاحة)' : 'All (Entire Hospital Staff)'}
                      </option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id} className="bg-slate-950 text-slate-200">
                          {dept.name} {dept.code ? `(#${dept.code})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Step 2: Print Columns Checklist */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-cyan-400 text-right">
                      {isAr ? '2. الأعمدة والبيانات المطلوبة في التقرير:' : '2. Visible Columns for Report:'}
                    </label>
                    <div className="flex items-center gap-1.5 no-print" dir="ltr">
                      <button
                        type="button"
                        onClick={() => setVisibleColumns({ empId: true, name: true, department: true, role: true, finger: true })}
                        className="px-2 py-1 text-[10px] font-black bg-[#06b6d4]/10 hover:bg-[#06b6d4]/20 text-[#06b6d4] rounded transition-all cursor-pointer"
                      >
                        {isAr ? 'تحديد الكل' : 'Select All'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setVisibleColumns({ empId: false, name: false, department: false, role: false, finger: false })}
                        className="px-2 py-1 text-[10px] font-black bg-white/5 hover:bg-white/10 text-slate-400 rounded transition-all cursor-pointer"
                      >
                        {isAr ? 'مسح الكل' : 'Clear All'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 bg-slate-950/40 p-3 rounded-xl border border-white/5">
                    {[
                      { id: 'name', labelAr: 'الاسم الثلاثي والكامل', labelEn: 'Full Name' },
                      { id: 'empId', labelAr: 'الرقم والرمز الوظيفي', labelEn: 'Employee ID' },
                      { id: 'department', labelAr: 'القسم المنتسب له', labelEn: 'Department' },
                      { id: 'role', labelAr: 'العنوان والصفة الوظيفية', labelEn: 'Position / Role' },
                      { id: 'finger', labelAr: 'حالة البصمة والالتزام', labelEn: 'Fingerprint Status' }
                    ].map((field) => {
                      const isChecked = visibleColumns[field.id as keyof typeof visibleColumns];
                      return (
                        <label
                          key={field.id}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all cursor-pointer select-none text-[11px] ${
                            isChecked
                              ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-300'
                              : 'bg-slate-900/40 border-white/5 text-slate-400 hover:border-white/10'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setVisibleColumns((prev) => ({
                                ...prev,
                                [field.id]: !prev[field.id as keyof typeof visibleColumns]
                              }));
                            }}
                            className="sr-only"
                          />
                          <span className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${
                            isChecked ? 'bg-[#06b6d4] border-[#06b6d4] text-slate-950' : 'border-slate-650'
                          }`}>
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </span>
                          <span className="font-bold truncate">
                            {isAr ? field.labelAr : field.labelEn}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Step 3: Hospital details & signatures check */}
                <div className="space-y-2">
                  <label className="block text-xs font-black text-cyan-400 text-right">{isAr ? '3. الهوية والتفاصيل الرسمية للوزارة والمستشفى:' : '3. Hospital Branding & Authenticity:'}</label>
                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/20 border border-white/5 cursor-pointer select-none hover:bg-slate-950/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={printIncludeHospitalDetails}
                      onChange={(e) => setPrintIncludeHospitalDetails(e.target.checked)}
                      className="sr-only"
                    />
                    <span className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${
                      printIncludeHospitalDetails ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-650'
                    }`}>
                      {printIncludeHospitalDetails && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                    <div className="text-right">
                      <p className="font-bold text-slate-200 text-[11px]">{isAr ? 'تضمين تفاصيل المستشفى وتواقيع المدراء الكاملة' : 'Include Hospital Details & Director Signatures'}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{isAr ? 'يعرض شعار المستشفى المخصص، الترويسة الوزارية الرسمية، تاريخ الإصدار، وحقول تواقيع الموارد البشرية، الحسابات والمدير العام.' : 'Displays official logo, Ministry of Health header, report timestamp, and signatures blocks at the bottom.'}</p>
                    </div>
                  </label>
                </div>

                {/* Modal Buttons */}
                <div className="pt-4 border-t border-white/5 flex justify-end gap-2.5" dir="ltr">
                  <button
                    type="button"
                    onClick={() => setShowPrintSetupModal(false)}
                    className="p-2.5 px-4 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl font-bold transition-all cursor-pointer text-xs"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedDepartment === 'all') {
                        setPrintSelectedDepts(departments.map(d => d.id));
                      } else {
                        if (!selectedDepartment) {
                          showToast(isAr ? 'يرجى تحديد قسم أولاً للطباعة!' : 'Please select a department to print!', 'error');
                          return;
                        }
                        setPrintSelectedDepts([selectedDepartment]);
                      }

                      const hasSelectedField = Object.values(visibleColumns).some(val => val === true);
                      if (!hasSelectedField) {
                        showToast(isAr ? 'يرجى اختيار عمود/حقل واحد على الأقل للطباعة!' : 'Select at least one field/column to print.', 'error');
                        return;
                      }

                      setShowPrintSetupModal(false);
                      setShowPrintPreviewModal(true);
                    }}
                    className="p-2.5 px-5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-cyan-600/15 text-xs"
                  >
                    <Printer className="w-4 h-4 text-white" />
                    <span>{isAr ? 'عرض ومعاينة تقرير الطباعة' : 'Generate & Preview'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>

      {/* Pristine Fullscreen Print Preview Overlay Modal */}
      <AnimatePresence>
        {showPrintPreviewModal && typeof window !== 'undefined' && createPortal(
          <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 overflow-y-auto p-4 md:p-8 print-preview-modal-overlay" id="hospital-structure-preview-modal">
            {/* Custom print styles dynamically active during preview */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                body {
                  background-color: white !important;
                  background-image: none !important;
                  color: black !important;
                }
                #root, main, aside, header, footer, .no-print, .no-print-element {
                  display: none !important;
                }
                .print-preview-modal-overlay {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  height: auto !important;
                  background: white !important;
                  color: black !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  display: block !important;
                }
                .print-preview-modal-card {
                  box-shadow: none !important;
                  border: none !important;
                  background: white !important;
                  color: black !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  padding: 0 !important;
                  margin: 0 !important;
                }
                .print-controller-bar {
                  display: none !important;
                }
                table {
                  border-collapse: collapse !important;
                  width: 100% !important;
                  color: black !important;
                }
                th, td {
                  border: 1px solid #7f8c8d !important;
                  color: black !important;
                  background: none !important;
                  padding: 6px 8px !important;
                  font-size: 11px !important;
                  text-align: center !important;
                }
                th {
                  background-color: #f1f5f9 !important;
                  font-weight: bold !important;
                }
              }

              /* High-specificity overrides for screen preview of HospitalStructure to defeat body:not(.theme-light) and other dark theme styles */
              @media screen {
                #hospital-structure-preview-modal {
                  background-color: rgba(2, 6, 23, 0.98) !important;
                  display: block !important;
                }
                
                #printable-hospital-structure-sheet {
                  background-color: #ffffff !important;
                  background: #ffffff !important;
                  color: #0f172a !important;
                  border: 2px solid #334155 !important;
                  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
                }

                #printable-hospital-structure-sheet,
                #printable-hospital-structure-sheet *,
                #printable-hospital-structure-sheet p,
                #printable-hospital-structure-sheet h1,
                #printable-hospital-structure-sheet h2,
                #printable-hospital-structure-sheet h3,
                #printable-hospital-structure-sheet h4,
                #printable-hospital-structure-sheet span,
                #printable-hospital-structure-sheet td,
                #printable-hospital-structure-sheet div {
                  color: #0f172a !important;
                  text-shadow: none !important;
                  border-color: #64748b !important;
                }

                #printable-hospital-structure-sheet table {
                  border-collapse: collapse !important;
                  width: 100% !important;
                }

                #printable-hospital-structure-sheet th {
                  background-color: #0f172a !important;
                  background: #0f172a !important;
                  color: #ffffff !important;
                  border: 1.5px solid #475569 !important;
                  padding: 8px 6px !important;
                }
                
                #printable-hospital-structure-sheet th * {
                  color: #ffffff !important;
                }

                #printable-hospital-structure-sheet td {
                  border: 1.5px solid #94a3b8 !important;
                  color: #0f172a !important;
                  background-color: #ffffff !important;
                  padding: 8px 6px !important;
                }

                #printable-hospital-structure-sheet tr:nth-child(even) td {
                  background-color: #f8fafc !important;
                }

                #printable-hospital-structure-sheet .badge-normal,
                #printable-hospital-structure-sheet .badge-ex,
                #printable-hospital-structure-sheet .badge-dept {
                  background-color: #f1f5f9 !important;
                  border: 1px solid #cbd5e1 !important;
                  color: #1e293b !important;
                  display: inline-block;
                }
              }
            ` }} />

            <div className="max-w-4xl mx-auto space-y-4">
              {/* Controller Bar (Hidden in printed sheet) */}
              <div className="no-print print-controller-bar flex items-center justify-between bg-[#111827] border border-white/5 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-blue-500/10 text-[#06b6d4] rounded-xl animate-pulse">
                    <Printer className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="text-xs font-black text-white">{isAr ? 'معاينة هيكلية الكوادر المطبوعة' : 'Print Preview - Medical Personnel'}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{isAr ? 'تأكد من الهوامش وعرض الورقة ثم انقر طباعة' : 'Verify columns and layout before proceeding'}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPrintPreviewModal(false);
                      setShowPrintSetupModal(true);
                    }}
                    className="px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white text-[#06b6d4] rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    {isAr ? 'تعديل الخيارات' : 'Edit Options'}
                  </button>
                  <button
                    type="button"
                    disabled={isGeneratingPdf}
                    onClick={() => handleDownloadPDF()}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-lg ${
                      isGeneratingPdf 
                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed' 
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/10'
                    }`}
                  >
                    <Upload className="w-4 h-4 rotate-180" />
                    <span>{isGeneratingPdf ? (isAr ? 'جاري التصدير...' : 'Exporting...') : (isAr ? 'تنزيل كملف PDF' : 'Download as PDF')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePrint()}
                    className="px-3.5 py-2 bg-[#06b6d4] hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4 text-slate-950" />
                    <span>{isAr ? 'بدء الطباعة فورا' : 'Print Now'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPrintPreviewModal(false)}
                    className="px-3.5 py-2 bg-white/5 border border-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    {isAr ? 'إغلاق المعاينة' : 'Close Preview'}
                  </button>
                </div>
              </div>

              {/* Informative warning banner when inside iframe */}
              {typeof window !== 'undefined' && window.self !== window.top && (
                <div className="no-print bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-2xl p-4 text-xs flex items-start gap-3 leading-relaxed">
                  <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg shrink-0 mt-0.5">
                    <AlertCircle className="w-4 h-4" />
                  </span>
                  <div>
                    <p className="font-black text-amber-200">
                      {isAr 
                        ? 'تنبيه هام لتشغيل ميزة الطباعة بنجاح:' 
                        : 'Important notice for printing successfully:'}
                    </p>
                    <p className="mt-1 text-slate-350 font-semibold text-[11px]">
                      {isAr 
                        ? 'المتصفحات تحظر الطباعة من داخل النوافذ المضمنة (iFrame) لأسباب أمنية. يرجى الضغط على زر (توسيط المعاينة / نافذة مستقلة) في أعلى يمين شاشة AI Studio لفتح التطبيق في علامة تبويب جديدة بالكامل، ثم جرب الطباعة لتتمكن من تنزيل التقارير كملفات PDF بكل سهولة.'
                        : 'Browsers block direct printing within integrated frames (iFrame) for security. Please click the "Open in New Tab" button at the top-right of the AI Studio preview to open the app in a new tab, then print or download as PDF seamlessly.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Printable sheet container styled as physical A4 paper preview */}
              <div id="printable-hospital-structure-sheet" className="print-preview-modal-card bg-white text-slate-900 p-8 sm:p-12 shadow-2xl rounded-2xl border border-slate-200 select-text font-sans" dir={isAr ? 'rtl' : 'ltr'}>
                {/* Official Hospital branding header */}
                {printIncludeHospitalDetails && (
                  <div className="flex justify-between items-start border-b-2 border-slate-800 pb-5 mb-8">
                    <div className="text-right space-y-1">
                      <h2 className="text-md font-black text-slate-950">{isAr ? 'جمهورية العراق' : 'Republic of Iraq'}</h2>
                      <h3 className="text-sm font-bold text-slate-900">{isAr ? 'وزارة الصحة والبيئة' : 'Ministry of Health'}</h3>
                      <h3 className="text-md font-black text-blue-900 lg:text-lg">{isAr ? hospitalProfile.nameAr : hospitalProfile.nameEn}</h3>
                      <p className="text-[10px] text-slate-500">{isAr ? `تاريخ إصدار التقرير: ${new Date().toLocaleDateString('ar-IQ')} م` : `Issued: ${new Date().toLocaleDateString()}`}</p>
                    </div>
                    
                    {/* Central Symbolic Emblem/Logo */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-20 h-20 rounded-full border-2 border-slate-300 p-1 bg-white shadow-md flex items-center justify-center overflow-hidden">
                        {hospitalProfile.logoUrl ? (
                          <img 
                            src={hospitalProfile.logoUrl} 
                            alt="Logo" 
                            referrerPolicy="no-referrer"
                            className="w-full h-full rounded-full object-contain" 
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-blue-50 flex items-center justify-center border border-blue-200">
                            <Building2 className="w-8 h-8 text-blue-700" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-black text-slate-500 tracking-wider mt-1.5">{isAr ? 'قسم الموارد البشرية' : 'HR DIVISION'}</span>
                    </div>

                    <div className="text-left space-y-1 text-slate-650 text-[10px] sm:text-xs">
                      <p className="font-semibold text-slate-900">{isAr ? 'نوع التقرير: ملاك الكوادر والأقسام' : 'Report Type: Appointed Structure'}</p>
                      <p>{isAr ? `الأقسام المشمولة: ${printSelectedDepts.length}` : `Included Depts: ${printSelectedDepts.length}`}</p>
                      <p>{isAr ? 'الترخيص: نظام الرواتب الذكي الموحد' : 'License: Unified BioPayroll App'}</p>
                    </div>
                  </div>
                )}

                {/* Subtitle title block */}
                <div className="text-center mb-8">
                  <h1 className="text-lg font-black text-slate-950 underline underline-offset-8 decoration-double decoration-slate-400 mb-2">
                    {isAr ? 'كشف الملاك والهيكلية التنظيمية المعتمدة للكوادر البشرية' : 'Appointed Medical & Administrative Staff Allocation Directory'}
                  </h1>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {isAr 
                      ? 'تم مطابقة البيانات مع رموز البصمات الإلكترونية والأرقام الوظيفية المعتمدة في الإدارة العامة.'
                      : 'Verified directly with operational biometric scanners and official administration job references.'}
                  </p>
                </div>

                {/* Render Department segments */}
                <div className="space-y-8">
                  {printTarget === 'departments' ? (
                    <div className="space-y-4 break-inside-avoid">
                      <table className="w-full text-center border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-350">
                            <th className="p-3 border border-slate-300 font-bold text-slate-900 text-center w-12">#</th>
                            <th className="p-3 border border-slate-300 font-bold text-slate-900 text-center">{isAr ? 'اسم القسم' : 'Department Name'}</th>
                            <th className="p-3 border border-slate-300 font-bold text-slate-900 text-center w-24">{isAr ? 'كود القسم' : 'Code'}</th>
                            <th className="p-3 border border-slate-300 font-bold text-slate-900 text-center">{isAr ? 'العناوين الوظيفية المتاحة' : 'Available Positions'}</th>
                            <th className="p-3 border border-slate-300 font-bold text-slate-900 text-center w-36">{isAr ? 'السقف المالي للقسم' : 'Budget Limit'}</th>
                            <th className="p-3 border border-slate-300 font-bold text-slate-900 text-center w-28">{isAr ? 'عدد الموظفين' : 'Hired Staff'}</th>
                            <th className="p-3 border border-slate-300 font-bold text-slate-900 text-center w-36">{isAr ? 'مجموع الرواتب الأساسية' : 'Total Basic Salary'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {departments
                            .filter(dept => {
                              if (selectedDepartment === 'all') return true;
                              return dept.id === selectedDepartment || dept.name === selectedDepartment || printSelectedDepts.includes(dept.id);
                            })
                            .map((dept, index) => {
                              const deptEmployees = employees.filter(e => isEmpInDept(e, dept));
                              const totalBasic = deptEmployees.reduce((sum, e) => sum + (e.basicSalary || 0), 0);
                              return (
                                <tr key={dept.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                                  <td className="p-3 border border-slate-200 text-center font-mono text-slate-700">{index + 1}</td>
                                  <td className="p-3 border border-slate-200 font-black text-slate-900 text-center">{dept.name}</td>
                                  <td className="p-3 border border-slate-200 text-center font-mono text-slate-650 font-semibold">{dept.code || '#-'}</td>
                                  <td className="p-3 border border-slate-200 text-center text-slate-600 text-[10.5px]">
                                    {dept.positions && dept.positions.length > 0 ? dept.positions.join('، ') : (isAr ? 'لم يحدد' : 'Not Set')}
                                  </td>
                                  <td className="p-3 border border-slate-200 text-center font-mono font-bold text-emerald-700" dir="ltr">
                                    {dept.budgetLimit ? dept.budgetLimit.toLocaleString('en-US') + ' IQD' : (isAr ? 'بدون سقف' : 'No Limit')}
                                  </td>
                                  <td className="p-3 border border-slate-200 text-center font-mono font-bold text-slate-900">{deptEmployees.length}</td>
                                  <td className="p-3 border border-slate-200 text-center font-mono font-bold text-blue-700" dir="ltr">
                                    {totalBasic.toLocaleString('en-US')} IQD
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    departments
                      .filter(dept => {
                        if (selectedDepartment === 'all') return true;
                        return dept.id === selectedDepartment || dept.name === selectedDepartment || printSelectedDepts.includes(dept.id);
                      })
                      .map((dept) => {
                        // Filter employees inside this department using our clean, filtered printableData
                        const deptEmployees = printableData.filter(e => isEmpInDept(e, dept));

                        return (
                          <div key={dept.id} className="space-y-3 break-inside-avoid">
                            {/* Department Heading */}
                            <div className="flex items-center justify-between bg-slate-50 border border-slate-300 p-2.5 rounded-lg">
                              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                                <span>📁</span>
                                {isAr ? 'القسم الهيكلي:' : 'Structural Unit:'} {dept.name}
                              </span>
                              {dept.code && (
                                <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                                  {isAr ? `رمز الرقم التعريفي للقسم: #${dept.code}` : `Dept Code: #${dept.code}`}
                                </span>
                              )}
                            </div>

                            {deptEmployees.length === 0 ? (
                              <p className="text-[11px] text-slate-450 italic pr-4 py-1">
                                {isAr ? 'لا يوجد أي موظف أو كادر مسجل تحت ملاك هذا القسم حالياً في النظام.' : 'No active staff registered or hired under this department.'}
                              </p>
                            ) : (
                              <table className="w-full text-center border-collapse text-xs">
                                <thead>
                                  <tr className="bg-slate-100 border-b border-slate-350">
                                    {visibleColumns.empId && (
                                      <th className="p-2 border border-slate-300 font-bold text-slate-900 text-center w-24">{isAr ? 'الرقم الوظيفي' : 'Emp ID'}</th>
                                    )}
                                    {visibleColumns.name && (
                                      <th className="p-2 border border-slate-300 font-bold text-slate-900 text-center">{isAr ? 'الاسم الثلاثي والكامل' : 'Staff Full Name'}</th>
                                    )}
                                    {visibleColumns.department && (
                                      <th className="p-2 border border-slate-300 font-bold text-slate-900 text-center w-36">{isAr ? 'القسم التنظيمي' : 'Department'}</th>
                                    )}
                                    {visibleColumns.role && (
                                      <th className="p-2 border border-slate-300 font-bold text-slate-900 text-center w-40">{isAr ? 'العنوان وتوصيف التخصص' : 'Position / Role'}</th>
                                    )}
                                    {visibleColumns.finger && (
                                      <th className="p-2 border border-slate-300 font-bold text-slate-900 text-center w-36">{isAr ? 'حالة البصمة' : 'Fingerprint'}</th>
                                    )}
                                  </tr>
                                </thead>
                                <tbody>
                                  {deptEmployees.map((emp) => (
                                    <tr key={emp.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                                      {visibleColumns.empId && (
                                        <td className="p-2 border border-slate-200 text-center font-mono text-slate-700 font-semibold">{emp.employeeCode || '-'}</td>
                                      )}
                                      {visibleColumns.name && (
                                        <td className="p-2 border border-slate-200 font-black text-slate-900 text-center">{emp.name}</td>
                                      )}
                                      {visibleColumns.department && (
                                        <td className="p-2 border border-slate-200 text-center text-slate-700 font-semibold">{dept.name}</td>
                                      )}
                                      {visibleColumns.role && (
                                        <td className="p-2 border border-slate-200 text-center text-slate-700">{emp.position}</td>
                                      )}
                                      {visibleColumns.finger && (
                                        <td className="p-2 border border-slate-200 text-center font-bold">
                                          {emp.isFingerprintExempt ? (
                                            <span className="text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-150 text-[10px]">
                                              {isAr ? 'معفى (ثابت)' : 'Exempt (Fixed)'}
                                            </span>
                                          ) : (
                                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-150 text-[10px]">
                                              {isAr ? 'نشط (خاضع للبصمة)' : 'Active (Required)'}
                                            </span>
                                          )}
                                        </td>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        );
                      })
                  )}
                </div>

                {/* Unified Summary Stats Block */}
                <div className="mt-10 p-4 border border-dashed border-slate-300 bg-slate-50 rounded-xl flex justify-between items-center text-xs text-slate-750 break-inside-avoid">
                  <div>
                    <p className="font-bold text-slate-900">
                      {isAr ? `إجمالي الكوادر المستخرجة: ${printableEmployees.length} موظفاً` : `Total Extracted Staff: ${printableEmployees.length} employees`}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-650">
                      {isAr ? 'مصدر الرواتب: الحسابات الموحدة لمستشفى الفرح' : 'Unified payroll database authentication.'}
                    </p>
                  </div>
                </div>

                {/* Signatures footer row */}
                {printIncludeHospitalDetails && (
                  <div className="grid grid-cols-3 gap-6 text-center mt-16 pt-8 border-t border-slate-200 text-xs text-slate-700 break-inside-avoid">
                    <div className="space-y-12">
                      <p className="font-black text-slate-900">{isAr ? 'مدير الموارد البشرية' : 'Human Resources Director'}</p>
                      <p className="text-[11px] text-slate-400">...............................................</p>
                    </div>
                    <div className="space-y-12">
                      <p className="font-black text-slate-900">{isAr ? 'مدير الحسابات والتدقيق' : 'Chief Accountant'}</p>
                      <p className="text-[11px] text-slate-400">...............................................</p>
                    </div>
                    <div className="space-y-12">
                      <p className="font-black text-slate-900">{isAr ? 'مدير المستشفى المفوّض' : 'Hospital General Manager'}</p>
                      <p className="text-[11px] text-slate-400">...............................................</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
      </AnimatePresence>

      {/* Static Footer Watermark with Strict Preservation */}
      <div className="border-t border-white/5 pt-6 text-center text-[11px] text-slate-500 font-extrabold w-full py-4 tracking-wider select-none leading-none mt-10">
        حقوق النظام محفوظة لـ: مسؤول النظام المهندس محمد جاسم محمد ابراهيم | رقم الهاتف: 07836885808
      </div>
    </div>
  );
}
