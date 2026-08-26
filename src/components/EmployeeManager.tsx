import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Search,
  Plus,
  Minus,
  Lock,
  Check,
  Trash2,
  Edit,
  UserPlus,
  ArrowUpDown,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  Briefcase,
  Layers,
  X,
  ChevronDown,
  ChevronUp,
  Info,
  RefreshCw,
  Building2,
  ShieldAlert,
  DollarSign,
  Activity,
  ArrowRight,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';
import { Department, Employee, FieldId, UserRole, CalculatedPayroll, AuditLogEntry } from '../types';
import { calculateEmployeePayroll, FIELDS_METADATA } from '../data';
import { DEPT_ICON_TEMPLATES, TIME_SLOT_OPTIONS } from './DepartmentBuilder';
import { showToast } from '../lib/toast';
import { TRANSLATIONS, formatCurrency, getNextEmployeeCode } from '../lib/translations';
import * as XLSX from 'xlsx';
import JobTitleSelect from './JobTitleSelect';

const renderValWithBreak = (value: string | number) => {
  if (typeof value !== 'string') return value;
  
  if (value.includes(' د.ع')) {
    const parted = value.split(' د.ع');
    return (
      <span className="flex flex-col items-center justify-center leading-normal max-w-full overflow-hidden">
        <span className="font-mono font-bold leading-none truncate max-w-full">{parted[0]}</span>
        <span className="text-[10px] text-slate-400 font-extrabold mt-0.5 tracking-wider select-none leading-none">د.ع</span>
      </span>
    );
  }
  if (value.includes(' IQD')) {
    const parted = value.split(' IQD');
    return (
      <span className="flex flex-col items-center justify-center leading-normal">
        <span className="font-mono font-bold leading-none">{parted[0]}</span>
        <span className="text-[9.5px] text-slate-400 font-sans font-bold mt-0.5 tracking-wider select-none leading-none">IQD</span>
      </span>
    );
  }
  if (value.includes(' $')) {
    const parted = value.split(' $');
    return (
      <span className="flex flex-col items-center justify-center leading-normal">
        <span className="font-mono font-bold leading-none">{parted[0]}</span>
        <span className="text-[9.5px] text-slate-400 font-sans font-bold mt-0.5 select-none leading-none">$</span>
      </span>
    );
  }
  if (value.startsWith('$')) {
    const parted = value.replace('$', '');
    return (
      <span className="flex flex-col items-center justify-center leading-normal">
        <span className="font-mono font-bold leading-none">{parted}</span>
        <span className="text-[9.5px] text-slate-400 font-sans font-bold mt-0.5 select-none leading-none">$</span>
      </span>
    );
  }
  return value;
};

interface StepperInputProps {
  key?: React.Key;
  id: string;
  label: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  isActive?: boolean;
  description?: string;
  type?: 'number' | 'currency';
  language: 'ar' | 'en';
}

function StepperInput({
  id,
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  disabled = false,
  isActive = true,
  description,
  type = 'number',
  language = 'ar',
}: StepperInputProps) {
  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled || !isActive) return;
    const newVal = Math.max(min, value - step);
    onChange(newVal);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled || !isActive) return;
    const newVal = max !== undefined ? Math.min(max, value + step) : value + step;
    onChange(newVal);
  };

  const formattedDisplay = type === 'currency' 
    ? formatCurrency(value, language, 'IQD') 
    : value;

  return (
    <div className={`p-4 rounded-2xl border transition-all duration-200 relative ${
      isActive 
        ? 'bg-slate-900/60 border-slate-700/60 hover:bg-slate-900/95 hover:border-blue-500/40 shadow-sm' 
        : 'bg-slate-950/30 border-slate-800/40 opacity-40 select-none'
    }`}>
      {/* Top row: Checkbox indicator (matching picture) & Label */}
      <div className="flex items-start gap-2.5 justify-between mb-3 text-right" dir="rtl">
        <div className="flex items-start gap-2.5">
          {/* Checkbox visual style matches picture exactly */}
          <div className="pt-0.5 select-none">
            <span className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
              isActive 
                ? 'bg-blue-600 border-blue-500 text-white shadow-sm' 
                : 'bg-slate-950 border-slate-800 text-transparent'
            }`}>
              {isActive ? (
                <Check className="w-3 h-3 text-white stroke-[4]" />
              ) : null}
            </span>
          </div>
          <div className="text-right">
            <span className={`text-xs font-bold block leading-snug ${isActive ? 'text-white' : 'text-slate-500'}`}>
              {label}
            </span>
            {description && (
              <span className="text-[10px] text-slate-400 font-sans block mt-0.5 leading-snug">
                {description}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Arrow Inputs */}
      <div className="flex items-center gap-1.5 bg-slate-950/90 p-1.5 rounded-xl border border-white/5" dir="ltr">
        {/* Decrement Button */}
        <button
          type="button"
          disabled={disabled || !isActive || value <= min}
          onClick={handleDecrement}
          className="w-9 h-9 flex items-center justify-center bg-slate-900/90 hover:bg-slate-800 hover:text-white disabled:opacity-20 disabled:hover:bg-slate-900 text-slate-300 rounded-lg transition-all cursor-pointer select-none font-bold text-base active:scale-95 focus:outline-none"
          title="تقليل القيمة"
        >
          -
        </button>

        {/* Input box */}
        <div className="flex-1 flex items-center justify-center px-1">
          <input
            id={id}
            type="number"
            disabled={disabled || !isActive}
            value={isActive ? value : 0}
            onChange={(e) => {
              const raw = parseFloat(e.target.value) || 0;
              const clamped = max !== undefined ? Math.min(max, Math.max(min, raw)) : Math.max(min, raw);
              onChange(clamped);
            }}
            className={`w-full text-center bg-transparent text-xs font-bold font-mono border-0 focus:ring-0 focus:outline-none p-1 focus:text-blue-300 ${
              isActive ? 'text-white' : 'text-slate-700'
            }`}
          />
        </div>

        {/* Increment Button */}
        <button
          type="button"
          disabled={disabled || !isActive || (max !== undefined && value >= max)}
          onClick={handleIncrement}
          className="w-9 h-9 flex items-center justify-center bg-slate-900/90 hover:bg-slate-800 hover:text-white disabled:opacity-20 disabled:hover:bg-slate-900 text-slate-300 rounded-lg transition-all cursor-pointer select-none font-bold text-base active:scale-95 focus:outline-none"
          title="زيادة القيمة"
        >
          +
        </button>
      </div>

      {/* Extra helper detail if active */}
      {isActive && type === 'currency' && value > 0 && (
        <div className="mt-1.5 text-left text-[10px] text-emerald-400 font-mono select-none" dir="ltr">
          {formattedDisplay}
        </div>
      )}
    </div>
  );
}

function getDeptVisuals(deptName: string, iconIndex?: number) {
  const index = iconIndex !== undefined ? iconIndex : 4; // default steth
  const title = deptName.toLowerCase();
  
  // Detect nature of department based on common Arabic department keywords or current iconIndex
  const isEmergency = title.includes('طوارئ') || title.includes('إسعاف') || title.includes('إنقاذ') || index === 3;
  const isSurgery = title.includes('عمليات') || title.includes('جراحة') || index === 2;
  const isHeart = title.includes('قلب') || title.includes('نبض') || title.includes('فحص') || title.includes('مختبر') || title.includes('تحاليل') || title.includes('عناية') || index === 0 || index === 13;
  const isNeon = title.includes('تقني') || title.includes('أشعة') || title.includes('صيدل') || index === 10 || index === 5 || index === 7;

  let gradient = 'from-blue-600/20 via-sky-620/10 to-transparent';
  let neonGlow = 'rgba(14, 165, 233, 0.4)';
  let textColor = 'text-[#06b6d4]';
  let pulseType: 'pulse' | 'blink' | 'neon' | 'none' = 'none';
  let showIndicator = false;
  let iconRing = 'ring-cyan-500/20';
  let iconGlow = 'drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]';
  let indicatorColor = 'bg-[#06b6d4]';

  if (isEmergency) {
    gradient = 'from-amber-600/20 via-orange-600/10 to-transparent';
    neonGlow = 'rgba(249, 115, 22, 0.45)';
    textColor = 'text-[#f97316]';
    pulseType = 'blink'; // blinking/warning beacon style
    iconRing = 'ring-orange-500/20';
    iconGlow = 'drop-shadow-[0_0_10px_rgba(249,115,22,0.6)]';
    indicatorColor = 'bg-[#f97316]';
  } else if (isSurgery) {
     iconGlow = 'drop-shadow-[0_0_10px_rgba(139,92,246,0.6)]';
     gradient = 'from-violet-600/20 via-fuchsia-600/10 to-transparent';
     neonGlow = 'rgba(139, 92, 246, 0.45)';
     textColor = 'text-[#c084fc]';
     showIndicator = true; // active green dot
     iconRing = 'ring-violet-500/20';
     indicatorColor = 'bg-emerald-500';
  } else if (isHeart) {
    gradient = 'from-rose-600/20 via-red-600/10 to-transparent';
    neonGlow = 'rgba(239, 68, 68, 0.45)';
    textColor = 'text-rose-455';
    pulseType = 'pulse'; // beating heart pulse scale
    iconRing = 'ring-red-500/20';
    iconGlow = 'drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]';
    indicatorColor = 'bg-rose-500';
  } else if (isNeon) {
    gradient = 'from-teal-600/20 via-emerald-600/10 to-transparent';
    neonGlow = 'rgba(20, 184, 166, 0.45)';
    textColor = 'text-emerald-400';
    pulseType = 'neon'; // smooth floating neon glow
    iconRing = 'ring-teal-500/20';
    iconGlow = 'drop-shadow-[0_0_10px_rgba(20,184,166,0.6)]';
    indicatorColor = 'bg-emerald-400';
  } else {
    // Dynamic based on standard templates
    const colorMap = [
      { grad: 'from-rose-600/20 via-red-650/10 to-transparent', neon: 'rgba(239, 68, 68, 0.4)', text: 'text-rose-403', ring: 'ring-rose-500/20' }, // 0
      { grad: 'from-pink-600/20 via-rose-500/10 to-transparent', neon: 'rgba(236, 72, 153, 0.4)', text: 'text-pink-400', ring: 'ring-pink-500/20' }, // 1
      { grad: 'from-violet-600/20 via-fuchsia-500/10 to-transparent', neon: 'rgba(139, 92, 246, 0.4)', text: 'text-fuchsia-400', ring: 'ring-violet-500/20' }, // 2
      { grad: 'from-amber-600/20 via-orange-500/10 to-transparent', neon: 'rgba(245, 158, 11, 0.4)', text: 'text-[#f59e0b]', ring: 'ring-orange-500/20' }, // 3
      { grad: 'from-emerald-600/20 via-teal-500/10 to-transparent', neon: 'rgba(16, 185, 129, 0.4)', text: 'text-emerald-400', ring: 'ring-emerald-500/20' }, // 4
      { grad: 'from-blue-600/20 via-sky-500/10 to-transparent', neon: 'rgba(14, 165, 233, 0.4)', text: 'text-sky-305', ring: 'ring-sky-500/20' }, // 5
      { grad: 'from-fuchsia-600/20 via-purple-500/10 to-transparent', neon: 'rgba(217, 70, 239, 0.4)', text: 'text-fuchsia-455', ring: 'ring-fuchsia-500/20' }, // 6
      { grad: 'from-cyan-600/20 via-teal-500/10 to-transparent', neon: 'rgba(6, 182, 212, 0.4)', text: 'text-cyan-400', ring: 'ring-cyan-500/20' }, // 7
      { grad: 'from-slate-600/15 via-slate-700/10 to-transparent', neon: 'rgba(100, 116, 139, 0.4)', text: 'text-slate-350', ring: 'ring-slate-500/20' }, // 8
      { grad: 'from-sky-600/20 via-blue-500/10 to-transparent', neon: 'rgba(56, 189, 248, 0.4)', text: 'text-sky-400', ring: 'ring-sky-500/20' }, // 9
      { grad: 'from-violet-600/20 via-purple-500/10 to-transparent', neon: 'rgba(167, 139, 250, 0.4)', text: 'text-violet-400', ring: 'ring-violet-500/20' }, // 10
      { grad: 'from-rose-600/20 via-pink-550/10 to-transparent', neon: 'rgba(244, 63, 94, 0.4)', text: 'text-rose-403', ring: 'ring-rose-500/20' }, // 11
      { grad: 'from-red-600/20 via-rose-500/10 to-transparent', neon: 'rgba(220, 38, 38, 0.4)', text: 'text-red-405', ring: 'ring-red-500/20' }, // 12
      { grad: 'from-teal-600/20 via-emerald-500/10 to-transparent', neon: 'rgba(20, 184, 166, 0.4)', text: 'text-teal-400', ring: 'ring-teal-500/20' }, // 13
      { grad: 'from-indigo-600/20 via-blue-500/10 to-transparent', neon: 'rgba(99, 102, 241, 0.4)', text: 'text-indigo-400', ring: 'ring-indigo-500/20' }, // 14
      { grad: 'from-yellow-600/20 via-amber-500/10 to-transparent', neon: 'rgba(234, 179, 8, 0.4)', text: 'text-yellow-405', ring: 'ring-yellow-500/20' } // 15
    ];
    const visual = colorMap[index % colorMap.length];
    gradient = visual.grad;
    neonGlow = visual.neon;
    textColor = visual.text;
    iconRing = visual.ring;
    iconGlow = `drop-shadow-[0_0_8px_${visual.neon}]`;
  }

  return { gradient, neonGlow, textColor, pulseType, showIndicator, iconRing, iconGlow, indicatorColor };
}

const renderAnimatedIcon = (IconComponent: React.ComponentType<any>, visuals: ReturnType<typeof getDeptVisuals>) => {
  let animateProps = {};
  let transitionProps = {};

  if (visuals.pulseType === 'pulse') {
    animateProps = { scale: [1, 1.18, 0.96, 1.22, 1] };
    transitionProps = { duration: 1.5, repeat: Infinity, ease: 'easeInOut' };
  } else if (visuals.pulseType === 'blink') {
    animateProps = {
      rotate: [-5, 5, -5, 5, -5],
      filter: [
        'drop-shadow(0 0 6px rgba(249,115,22,0.6)) brightness(1.2)',
        'drop-shadow(0 0 15px rgba(249,115,22,0.95)) brightness(1.5)',
        'drop-shadow(0 0 6px rgba(249,115,22,0.6)) brightness(1.2)'
      ]
    };
    transitionProps = { duration: 2.0, repeat: Infinity, ease: 'easeInOut' };
  } else if (visuals.pulseType === 'neon') {
    animateProps = {
      y: [0, -4, 0],
      filter: [
        'brightness(1.1) contrast(1.1)',
        'brightness(1.5) contrast(1.2) drop-shadow(0 0 12px currentColor)',
        'brightness(1.1) contrast(1.1)'
      ]
    };
    transitionProps = { duration: 2.5, repeat: Infinity, ease: 'easeInOut' };
  } else {
    animateProps = { scale: [1, 1.08, 1] };
    transitionProps = { duration: 3.5, repeat: Infinity, ease: 'easeInOut' };
  }

  return (
    <div className={`relative p-3 rounded-2xl bg-gradient-to-tr ${visuals.gradient} border-2 border-white/20 ${visuals.iconRing} flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.08)] backdrop-blur-md overflow-hidden group-hover:scale-105 transition-transform duration-300`}>
      {/* Brilliant dynamic reflection light sweep */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/45 to-transparent pointer-events-none"
        style={{ skewX: -22 }}
        initial={{ left: '-120%' }}
        animate={{ left: '120%' }}
        transition={{
          repeat: Infinity,
          repeatDelay: 2 + Math.random() * 2,
          duration: 1.4,
          ease: 'easeInOut'
        }}
      />

      <motion.div
        animate={animateProps}
        transition={transitionProps}
        className={`${visuals.textColor} z-10 flex items-center justify-center`}
        style={{ 
          filter: visuals.iconGlow 
            ? `${visuals.iconGlow} brightness(1.4) drop-shadow(0 0 10px currentColor)` 
            : 'brightness(1.4) drop-shadow(0 0 10px currentColor)' 
        }}
      >
        <IconComponent className="w-5.5 h-5.5 stroke-[2.5]" />
      </motion.div>
      
      {visuals.showIndicator && (
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 z-20">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
        </span>
      )}
    </div>
  );
};

export const ALL_CHECKBOX_COLUMNS = [
  { id: 'employeeCode', label: 'الرقم الوظيفي' },
  { id: 'allowanceExtraDays', label: 'إضافي أيام' },
  { id: 'allowanceExtraHours', label: 'إضافي ساعات' },
  { id: 'deductionDays', label: 'أيام الغياب' },
  { id: 'deductionHours', label: 'استقطاع ساعات' },
  { id: 'allowancesTotal', label: 'إضافات ومخصصات' },
  { id: 'deductionsTotal', label: 'عقوبات واستقطاعات' },
  { id: 'basicSalary', label: 'الراتب الأساسي' },
  { id: 'netSalary', label: 'الراتب المستحق' }
];

export const getEditableFieldForColumn = (colId: string): FieldId | null => {
  switch (colId) {
    case 'employeeCode':
      return null;
    case 'workingDays':
      return 'workingDays';
    case 'allowanceExtraDays':
      return 'allowanceExtraDays';
    case 'allowanceExtraHours':
      return 'allowanceExtraHours';
    case 'deductionDays':
      return 'deductionDays';
    case 'deductionHours':
      return 'deductionHours';
    case 'allowancesTotal':
      return 'allowanceGeneral';
    case 'deductionsTotal':
      return 'deductionPenalties';
    case 'shiftMorning_count':
      return 'shiftMorning';
    case 'shiftEvening_count':
      return 'shiftEvening';
    case 'shiftMiddle_count':
      return 'shiftMiddle';
    case 'shiftKhafar_count':
      return 'shiftKhafar';
    case 'shiftFull24_count':
      return 'shiftFull24';
    case 'shiftHalf12_count':
      return 'shiftHalf12';
    case 'callout_days_count':
      return 'callouts';
    case 'daily_full_days':
      return 'workingDays';
    case 'daily_half_days_count':
      return 'shiftHalf12';
    default:
      return null;
  }
};

function parseAttendanceDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // Try YYYY-MM-DD or YYYY/MM/DD
  let match = dateStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (match) {
    const y = parseInt(match[1]);
    const m = parseInt(match[2]) - 1;
    const d = parseInt(match[3]);
    return new Date(y, m, d);
  }
  // Try DD[-/]MM[-/]YYYY
  match = dateStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (match) {
    const d = parseInt(match[1]);
    const m = parseInt(match[2]) - 1;
    const y = parseInt(match[3]);
    return new Date(y, m, d);
  }
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  return null;
}

function isSameCalendarDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

function hasCheckedInOnCalendarDay(empLoggedDateStrings: Set<string>, calendarDate: Date): boolean {
  for (const dStr of empLoggedDateStrings) {
    const parsed = parseAttendanceDate(dStr);
    if (parsed && isSameCalendarDay(parsed, calendarDate)) {
      return true;
    }
  }
  return false;
}

function timeToMinutes(timeStr?: string, defaultVal: number = 0): number {
  if (!timeStr) return defaultVal;
  const match = timeStr.match(/(\d{1,2}):(\d{1,2})/);
  if (!match) return defaultVal;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
}

function getCircularDiff(m1: number, m2: number): number {
  const diff = Math.abs(m1 - m2);
  return Math.min(diff, 1440 - diff);
}

interface EmployeeManagerProps {
  departments: Department[];
  employees: Employee[];
  payrollList: CalculatedPayroll[];
  userRole: UserRole;
  onSaveEmployees: (emps: Employee[]) => void;
  onSaveDepartments?: (depts: Department[]) => void;
  customFieldLabels?: Record<string, string>;
  language: 'ar' | 'en';
  onAddLog?: (entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'userId' | 'userName' | 'userRole'>) => void;
}

export default function EmployeeManager({
  departments,
  employees,
  payrollList,
  userRole,
  onSaveEmployees,
  onSaveDepartments,
  customFieldLabels = {},
  language = 'ar',
  onAddLog,
}: EmployeeManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [isDraggingId, setIsDraggingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'salary_desc' | 'salary_asc'>('name');

  // Real-time computation of departments exceeding designated budget limits
  const exceededDepartments = useMemo(() => {
    return departments.filter(dept => {
      if (!dept.budgetLimit || dept.budgetLimit <= 0) return false;
      const deptEmps = employees.filter(e => e.departmentId === dept.id);
      const spent = deptEmps.reduce((acc, emp) => {
        const calc = payrollList.find(p => p.employeeId === emp.id);
        return acc + (calc?.netSalary || 0);
      }, 0);
      return spent > dept.budgetLimit;
    });
  }, [departments, employees, payrollList]);

  // Toast warning trigger on budget ceiling expansion
  const prevExceededCountRef = useRef<number>(0);
  useEffect(() => {
    const currentCount = exceededDepartments.length;
    if (currentCount > prevExceededCountRef.current) {
      const lastExceeded = exceededDepartments[exceededDepartments.length - 1];
      if (lastExceeded) {
        showToast(
          language === 'ar'
            ? `⚠️ تنبيه ميزانية: تجاوز كادر قسم "${lastExceeded.name}" السقف المالي المخصص له!`
            : `⚠️ Budget Warning: Department "${lastExceeded.name}" has crossed its financial ceiling limit!`,
          'error'
        );
      }
    }
    prevExceededCountRef.current = currentCount;
  }, [exceededDepartments, language]);

  // Form modal control
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmployeeCode, setFormEmployeeCode] = useState('');
  const [formSequence, setFormSequence] = useState<number | ''>('');
  const [formIsFingerprintExempt, setFormIsFingerprintExempt] = useState(false);
  const [formIsGovernmentSector, setFormIsGovernmentSector] = useState(false);
  const [formIsSubjectToSocialSecurity, setFormIsSubjectToSocialSecurity] = useState(true);
  const [formHasCustomShift, setFormHasCustomShift] = useState(false);
  const [formCustomStart, setFormCustomStart] = useState('08:00');
  const [formCustomEnd, setFormCustomEnd] = useState('14:00');
  const [formCustomShiftType, setFormCustomShiftType] = useState<'fixed' | 'flexible' | 'shift_system'>('fixed');
  const [formCustomShiftSystemOption, setFormCustomShiftSystemOption] = useState<'s1' | 's2' | 's3' | 's4'>('s1');
  const [formDeptId, setFormDeptId] = useState('');
  const [formPosition, setFormPosition] = useState('');
  const [formGender, setFormGender] = useState<'male' | 'female'>('male');
  const [formBasicSalary, setFormBasicSalary] = useState<number>(0);
  const [formCurrency, setFormCurrency] = useState<'IQD' | 'USD'>('IQD');

  // State for iframe-friendly employee deletion confirmation
  const [empIdToDelete, setEmpIdToDelete] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetTargetType, setResetTargetType] = useState<'all' | 'single'>('all');
  const [resetTargetDeptId, setResetTargetDeptId] = useState<string>('');

  // Form states for dynamic numeric inputs
  const [numericInputs, setNumericInputs] = useState<{ [key in FieldId]?: number }>({});

  const [expandedEmpId, setExpandedEmpId] = useState<string | null>(null);
  
  // Export Confirmation Dialog States
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFilename, setExportFilename] = useState('');

  // Dynamic columns selected at top of table (Dynamic Column Matrix Checklist)
  const [selectedColumns, setSelectedColumns] = useState<string[]>(() =>
    ALL_CHECKBOX_COLUMNS.map(c => c.id).filter(id => id !== 'employeeCode')
  );

  // Synchronized salary columns logic per selected department schema
  const visibleColumns = useMemo(() => {
    const activeDeptForStruct = selectedDeptFilter === 'all' ? null : departments.find(d => d.id === selectedDeptFilter);
    const sStruct = activeDeptForStruct ? (activeDeptForStruct.salaryStructureType || (
      activeDeptForStruct.salaryType === 'fixed' ? 'fixed_unified' :
      activeDeptForStruct.salaryType === 'shifts' ? 'shifts' :
      activeDeptForStruct.salaryType === 'day' ? 'daily' :
      (activeDeptForStruct.salaryType === 'lumpSum' || activeDeptForStruct.isLumpSum) ? 'lump_sum' :
      activeDeptForStruct.salaryType === 'callout' ? 'call_out' : 'variable'
    )) : 'all_columns';

    if (sStruct === 'shifts' && activeDeptForStruct) {
      const cols: { id: string; label: string }[] = [];
      if (selectedColumns.includes('employeeCode')) {
        cols.push({ id: 'employeeCode', label: language === 'ar' ? 'الرقم الوظيفي' : 'Employee ID' });
      }
      const shiftDefinitions = [
        { key: 'shiftMorning', countId: 'shiftMorning_count', countLabels: { ar: 'شفت صباحي', en: 'Morning Shift' }, payId: 'shiftMorning_pay', payLabels: { ar: 'مبلغ صباحي', en: 'Morning Pay' } },
        { key: 'shiftEvening', countId: 'shiftEvening_count', countLabels: { ar: 'شفت مسائي', en: 'Evening Shift' }, payId: 'shiftEvening_pay', payLabels: { ar: 'مبلغ مسائي', en: 'Evening Pay' } },
        { key: 'shiftMiddle', countId: 'shiftMiddle_count', countLabels: { ar: 'شفت وسطي', en: 'Middle Shift' }, payId: 'shiftMiddle_pay', payLabels: { ar: 'مبلغ وسطي', en: 'Middle Pay' } },
        { key: 'shiftKhafar', countId: 'shiftKhafar_count', countLabels: { ar: 'شفت خفر', en: 'Khafar Shift' }, payId: 'shiftKhafar_pay', payLabels: { ar: 'مبلغ خفر', en: 'Khafar Pay' } },
        { key: 'shiftFull24', countId: 'shiftFull24_count', countLabels: { ar: 'شفت ٢٤ ساعة', en: 'Full 24h Shift' }, payId: 'shiftFull24_pay', payLabels: { ar: 'مبلغ ٢٤ ساعة', en: 'Full 24h Pay' } },
        { key: 'shiftHalf12', countId: 'shiftHalf12_count', countLabels: { ar: 'شفت نصف شفت', en: 'Half 12h Shift' }, payId: 'shiftHalf12_pay', payLabels: { ar: 'مبلغ نصف شفت', en: 'Half 12h Pay' } }
      ];

      shiftDefinitions.forEach(sd => {
        if (activeDeptForStruct.enabledFields[sd.key as FieldId]) {
          cols.push({ id: sd.countId, label: language === 'ar' ? sd.countLabels.ar : sd.countLabels.en });
          cols.push({ id: sd.payId, label: language === 'ar' ? sd.payLabels.ar : sd.payLabels.en });
        }
      });

      if (activeDeptForStruct.enabledFields.deductionDays) {
        cols.push({ id: 'deductionDays', label: language === 'ar' ? 'أيام الغياب' : 'Absence Days' });
      }
      if (activeDeptForStruct.enabledFields.deductionHours) {
        cols.push({ id: 'deductionHours', label: language === 'ar' ? 'استقطاع ساعات' : 'Deduction Hours' });
      }

      cols.push({ id: 'allowancesTotal', label: language === 'ar' ? 'إضافات ومخصصات' : 'Allowances Total' });
      cols.push({ id: 'deductionsTotal', label: language === 'ar' ? 'عقوبات واستقطاعات' : 'Deductions Total' });
      cols.push({ id: 'netSalary', label: language === 'ar' ? 'الراتب المستحق' : 'Net Salary' });

      return cols;
    }

    if (sStruct === 'call_out' && activeDeptForStruct) {
      const cols: { id: string; label: string }[] = [];
      if (selectedColumns.includes('employeeCode')) {
        cols.push({ id: 'employeeCode', label: language === 'ar' ? 'الرقم الوظيفي' : 'Employee ID' });
      }
      cols.push({ id: 'callout_days_count', label: language === 'ar' ? 'عدد أيام الاستدعاء' : 'Call-out Days' });
      cols.push({ id: 'callout_pay', label: language === 'ar' ? 'مبلغ الاستدعاء' : 'Call-out Amount' });
      
      if (activeDeptForStruct.enabledFields.deductionDays) {
        cols.push({ id: 'deductionDays', label: language === 'ar' ? 'أيام الغياب' : 'Absence Days' });
      }
      if (activeDeptForStruct.enabledFields.deductionHours) {
        cols.push({ id: 'deductionHours', label: language === 'ar' ? 'استقطاع ساعات' : 'Deduction Hours' });
      }

      cols.push({ id: 'allowancesTotal', label: language === 'ar' ? 'إضافات ومخصصات' : 'Allowances Total' });
      cols.push({ id: 'deductionsTotal', label: language === 'ar' ? 'عقوبات واستقطاعات' : 'Deductions Total' });
      cols.push({ id: 'netSalary', label: language === 'ar' ? 'الراتب المستحق' : 'Net Salary' });
      return cols;
    }

    if (sStruct === 'daily' && activeDeptForStruct) {
      const cols: { id: string; label: string }[] = [];
      if (selectedColumns.includes('employeeCode')) {
        cols.push({ id: 'employeeCode', label: language === 'ar' ? 'الرقم الوظيفي' : 'Employee ID' });
      }
      cols.push({ id: 'daily_full_days', label: language === 'ar' ? 'أيام الدوام الكامل' : 'Full Days' });
      cols.push({ id: 'daily_full_pay', label: language === 'ar' ? 'مبلغ الدوام الكامل' : 'Full Days Pay' });
      cols.push({ id: 'daily_half_days_count', label: language === 'ar' ? 'عدد نصف يوم' : 'Half Days' });
      cols.push({ id: 'daily_half_pay', label: language === 'ar' ? 'مبلغ نصف يوم' : 'Half Days Pay' });
      
      if (activeDeptForStruct.enabledFields.deductionDays) {
        cols.push({ id: 'deductionDays', label: language === 'ar' ? 'أيام الغياب' : 'Absence Days' });
      }
      if (activeDeptForStruct.enabledFields.deductionHours) {
        cols.push({ id: 'deductionHours', label: language === 'ar' ? 'استقطاع ساعات' : 'Deduction Hours' });
      }

      cols.push({ id: 'allowancesTotal', label: language === 'ar' ? 'المخصصات والإضافات' : 'Allowances & Additions' });
      cols.push({ id: 'deductionsTotal', label: language === 'ar' ? 'العقوبات والاستقطاعات' : 'Deductions & Penalties' });
      cols.push({ id: 'netSalary', label: language === 'ar' ? 'الراتب المستحق' : 'Net Salary' });
      return cols;
    }

    const finalCols = (() => {
      if (sStruct === 'all_columns') {
        return ALL_CHECKBOX_COLUMNS.filter(c => selectedColumns.includes(c.id));
      }

      return ALL_CHECKBOX_COLUMNS.filter(c => {
        if (!selectedColumns.includes(c.id)) return false;
        switch (sStruct) {
          case 'variable':
            return ['workingDays', 'workingHours', 'allowanceExtraDays', 'allowanceExtraHours', 'deductionDays', 'deductionHours', 'allowancesTotal', 'deductionsTotal', 'basicSalary', 'netSalary'].includes(c.id);
          case 'fixed_unified':
            return ['workingHours', 'allowanceExtraDays', 'allowanceExtraHours', 'deductionDays', 'deductionHours', 'allowancesTotal', 'deductionsTotal', 'basicSalary', 'netSalary'].includes(c.id);
          case 'shifts':
            return ['workingDays', 'allowancesTotal', 'deductionsTotal', 'netSalary'].includes(c.id);
          case 'daily':
            return ['workingDays', 'allowancesTotal', 'deductionsTotal', 'netSalary'].includes(c.id);
          case 'lump_sum':
            return ['basicSalary', 'allowancesTotal', 'deductionsTotal', 'netSalary'].includes(c.id);
          case 'call_out':
            return ['workingDays', 'workingHours', 'allowancesTotal', 'netSalary'].includes(c.id);
          default:
            return true;
        }
      });
    })();

    return finalCols.filter(c => c.id !== 'workingDays' && c.id !== 'workingHours');
  }, [selectedDeptFilter, departments, selectedColumns, language]);

  // Department reordering and payroll completeness togglers
  const handleToggleDepartmentCompleted = (deptId: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!onSaveDepartments) return;
    const newDepts = departments.map(d => {
      if (d.id === deptId) {
        return { ...d, isPayrollCompleted: !d.isPayrollCompleted };
      }
      return d;
    });
    onSaveDepartments(newDepts);
    showToast(
      language === 'ar' 
        ? 'تم تحديث حالة كشف راتب هذا القسم بنجاح!' 
        : 'Department payroll completion state updated successfully!',
      'success'
    );
  };

  const handleMoveDepartment = (deptId: string, direction: 'forward' | 'backward', event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!onSaveDepartments) return;
    const index = departments.findIndex(d => d.id === deptId);
    if (index === -1) return;

    const newDepts = [...departments];
    if (direction === 'forward' && index > 0) {
      // swap with previous
      const temp = newDepts[index];
      newDepts[index] = newDepts[index - 1];
      newDepts[index - 1] = temp;
      onSaveDepartments(newDepts);
    } else if (direction === 'backward' && index < newDepts.length - 1) {
      // swap with next
      const temp = newDepts[index];
      newDepts[index] = newDepts[index + 1];
      newDepts[index + 1] = temp;
      onSaveDepartments(newDepts);
    }
  };

  // Real-time Arabized Excel CSV Export function guaranteeing seamless integration
  const handleExportExcel = () => {
    const targetEmployees = selectedDeptFilter === 'all' 
      ? employees 
      : employees.filter(e => e.departmentId === selectedDeptFilter);

    if (targetEmployees.length === 0) {
      showToast(language === 'ar' ? 'لا يوجد موظفون في الكشف الحالي لتصديرهم!' : 'No employees in current filter to export!', 'error');
      return;
    }

    const deptName = selectedDeptFilter === 'all' 
      ? (language === 'ar' ? 'كافة_الأقسام_مستشفى_الفرح' : 'AlFarah_All_Clinics') 
      : (departments.find(d => d.id === selectedDeptFilter)?.name || 'القسم');

    setExportFilename(`جدول_حضور_ورواتب_${deptName}_${new Date().toISOString().split('T')[0]}`);
    setShowExportModal(true);
  };

  const triggerActualExcelExport = async (customFilename: string) => {
    const targetEmployees = selectedDeptFilter === 'all' 
      ? employees 
      : employees.filter(e => e.departmentId === selectedDeptFilter);

    // Dynamic Header labels matching checked columns
    const headers = [
      language === 'ar' ? 'ت' : '#',
      language === 'ar' ? 'رقم الكادر ID' : 'Staff ID',
      language === 'ar' ? 'الاسم الكامل' : 'Full Name',
      language === 'ar' ? 'القسم' : 'Department',
      language === 'ar' ? 'المنصب' : 'Position',
      ...visibleColumns.map(col => col.label)
    ];

    // Align row fields in strict sequence
    const rows = targetEmployees.map((emp, index) => {
      const dept = departments.find(d => d.id === emp.departmentId);
      const calculated = payrollList.find(p => p.employeeId === emp.id) || calculateEmployeePayroll(emp, dept);
      
      const dynamicCells = visibleColumns.map(col => {
        switch (col.id) {
          case 'workingDays':
            return emp.workingDays !== undefined ? emp.workingDays : 0;
          case 'workingHours':
            return emp.workingHours || 0;
          case 'dayPrice':
            return Math.round(calculated.dayPrice);
          case 'hourPrice':
            return Math.round(calculated.hourPrice);
          case 'allowanceExtraDays':
            return Math.round(calculated.allowanceExtraDaysVal || 0);
          case 'allowanceExtraHours':
            return Math.round(calculated.allowanceExtraHoursVal || 0);
          case 'deductionDays':
            return Math.round(calculated.deductionDaysVal || 0);
          case 'deductionHours':
            return Math.round(calculated.deductionHoursVal || 0);
          case 'shiftMorning_count':
            return emp.shiftMorning || 0;
          case 'shiftMorning_pay':
            return Math.round(calculated.shiftsMorningPay || 0);
          case 'shiftEvening_count':
            return emp.shiftEvening || 0;
          case 'shiftEvening_pay':
            return Math.round(calculated.shiftsEveningPay || 0);
          case 'shiftMiddle_count':
            return emp.shiftMiddle || 0;
          case 'shiftMiddle_pay':
            return Math.round(calculated.shiftsMiddlePay || 0);
          case 'shiftKhafar_count':
            return emp.shiftKhafar || 0;
          case 'shiftKhafar_pay':
            return Math.round(calculated.shiftsKhafarPay || 0);
          case 'shiftFull24_count':
            return emp.shiftFull24 || 0;
          case 'shiftFull24_pay':
            return Math.round(calculated.shiftsFull24Pay || 0);
          case 'shiftHalf12_count':
            return emp.shiftHalf12 || 0;
          case 'shiftHalf12_pay':
            return Math.round(calculated.shiftsHalf12Pay || 0);
          case 'callout_days_count':
            return emp.callouts || 0;
          case 'callout_pay':
            return Math.round(calculated.calloutsPay || 0);
          case 'daily_full_days':
            return emp.workingDays !== undefined ? emp.workingDays : 0;
          case 'daily_full_pay':
            return Math.round(calculated.basicDaysPay || 0);
          case 'daily_half_days_count':
            return emp.shiftHalf12 || 0;
          case 'daily_half_pay':
            return Math.round(calculated.shiftsHalf12Pay || 0);
          case 'allowancesTotal':
            return Math.round(calculated.allowanceDangerVal + calculated.allowanceMarriageVal + calculated.allowanceChildrenVal + calculated.allowanceDegreeVal + calculated.allowanceExtraDaysVal + calculated.allowanceExtraHoursVal + calculated.allowanceGeneralVal + calculated.allowanceEsnadVal + calculated.allowanceCustom1Val + calculated.allowanceCustom2Val + calculated.allowanceCustom3Val + calculated.allowanceCustom4Val + calculated.allowanceCustom5Val + (calculated.shiftsMorningPay || 0) + (calculated.shiftsEveningPay || 0) + (calculated.shiftsMiddlePay || 0) + (calculated.shiftsFull24Pay || 0) + (calculated.shiftsHalf12Pay || 0) + (calculated.shiftsKhafarPay || 0) + (calculated.calloutsPay || 0));
          case 'deductionsTotal':
            return Math.round(calculated.deductionDaysVal + calculated.deductionHoursVal + calculated.deductionPenaltiesVal + calculated.deductionOtherVal + calculated.deductionPenaltyCustom1Val + calculated.deductionPenaltyCustom2Val + calculated.deductionPenaltyCustom3Val + calculated.deductionPenaltyCustom4Val + calculated.deductionPenaltyCustom5Val);
          case 'basicSalary':
            return Math.round(calculated.basicSalary);
          case 'netSalary':
            return Math.round(calculated.netSalary);
          default:
            return 0;
        }
      });

      return [
        emp.sequence !== undefined && emp.sequence !== null ? emp.sequence : (index + 1),
        emp.id,
        emp.name,
        dept ? dept.name : 'مجهول',
        emp.position,
        ...dynamicCells
      ];
    });

    // Grand Total Row matching the headers structure
    const totalRow = [
      '#',
      'المجموع الكلي',
      `${targetEmployees.length} موظفاً`,
      selectedDeptFilter === 'all' ? 'كافة الأقسام' : (departments.find(d => d.id === selectedDeptFilter)?.name || ''),
      '',
      ...visibleColumns.map(col => {
        // compute column total
        return Math.round(
          targetEmployees.reduce((sum, emp) => {
            const dept = departments.find(d => d.id === emp.departmentId);
            const calculated = payrollList.find(p => p.employeeId === emp.id) || calculateEmployeePayroll(emp, dept);
            switch (col.id) {
              case 'workingDays':
                return sum + (emp.workingDays !== undefined ? emp.workingDays : 0);
              case 'workingHours':
                return sum + (emp.workingHours || 0);
              case 'dayPrice':
                return sum + (calculated.dayPrice || 0);
              case 'hourPrice':
                return sum + (calculated.hourPrice || 0);
              case 'allowanceExtraDays':
                return sum + (calculated.allowanceExtraDaysVal || 0);
              case 'allowanceExtraHours':
                return sum + (calculated.allowanceExtraHoursVal || 0);
              case 'deductionDays':
                return sum + (calculated.deductionDaysVal || 0);
              case 'deductionHours':
                return sum + (calculated.deductionHoursVal || 0);
              case 'shiftMorning_count':
                return sum + (emp.shiftMorning || 0);
              case 'shiftMorning_pay':
                return sum + (calculated.shiftsMorningPay || 0);
              case 'shiftEvening_count':
                return sum + (emp.shiftEvening || 0);
              case 'shiftEvening_pay':
                return sum + (calculated.shiftsEveningPay || 0);
              case 'shiftMiddle_count':
                return sum + (emp.shiftMiddle || 0);
              case 'shiftMiddle_pay':
                return sum + (calculated.shiftsMiddlePay || 0);
              case 'shiftKhafar_count':
                return sum + (emp.shiftKhafar || 0);
              case 'shiftKhafar_pay':
                return sum + (calculated.shiftsKhafarPay || 0);
              case 'shiftFull24_count':
                return sum + (emp.shiftFull24 || 0);
              case 'shiftFull24_pay':
                return sum + (calculated.shiftsFull24Pay || 0);
              case 'shiftHalf12_count':
                return sum + (emp.shiftHalf12 || 0);
              case 'shiftHalf12_pay':
                return sum + (calculated.shiftsHalf12Pay || 0);
              case 'callout_days_count':
                return sum + (emp.callouts || 0);
              case 'callout_pay':
                return sum + (calculated.calloutsPay || 0);
              case 'daily_full_days':
                return sum + (emp.workingDays !== undefined ? emp.workingDays : 0);
              case 'daily_full_pay':
                return sum + (calculated.basicDaysPay || 0);
              case 'daily_half_days_count':
                return sum + (emp.shiftHalf12 || 0);
              case 'daily_half_pay':
                return sum + (calculated.shiftsHalf12Pay || 0);
              case 'allowancesTotal':
                return sum + (calculated.allowanceDangerVal + calculated.allowanceMarriageVal + calculated.allowanceChildrenVal + calculated.allowanceDegreeVal + calculated.allowanceExtraDaysVal + calculated.allowanceExtraHoursVal + calculated.allowanceGeneralVal + calculated.allowanceEsnadVal + calculated.allowanceCustom1Val + calculated.allowanceCustom2Val + calculated.allowanceCustom3Val + calculated.allowanceCustom4Val + calculated.allowanceCustom5Val + (calculated.shiftsMorningPay || 0) + (calculated.shiftsEveningPay || 0) + (calculated.shiftsMiddlePay || 0) + (calculated.shiftsFull24Pay || 0) + (calculated.shiftsHalf12Pay || 0) + (calculated.shiftsKhafarPay || 0) + (calculated.calloutsPay || 0));
              case 'deductionsTotal':
                return sum + (calculated.deductionDaysVal + calculated.deductionHoursVal + calculated.deductionPenaltiesVal + calculated.deductionOtherVal + calculated.deductionPenaltyCustom1Val + calculated.deductionPenaltyCustom2Val + calculated.deductionPenaltyCustom3Val + calculated.deductionPenaltyCustom4Val + calculated.deductionPenaltyCustom5Val);
              case 'basicSalary':
                return sum + (calculated.basicSalary || 0);
              case 'netSalary':
                return sum + (calculated.netSalary || 0);
              default:
                return sum;
            }
          }, 0)
        );
      })
    ];

    const currentDeptName = selectedDeptFilter === 'all' 
      ? 'كافة الأقسام والشعب' 
      : (departments.find(d => d.id === selectedDeptFilter)?.name || '');

    // BOM character prepended to enforce UTF-8 Arabic fonts compatibility inside Excel
    const csvContent = "\uFEFF" + [
      `مستشفى الفرح الأهلي , قسم: ${currentDeptName}`,
      headers.join(","),
      ...rows.map(row => row.map(val => {
        if (typeof val === 'string') {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(",")),
      totalRow.map(val => {
        if (typeof val === 'string') {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(",")
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // File save location picker fallback trigger
    const isSaveFilePickerSupported = typeof window !== 'undefined' && 'showSaveFilePicker' in window;
    let fileHandle: any = null;
    let useSaveFilePicker = false;

    if (isSaveFilePickerSupported) {
      try {
        // @ts-ignore
        fileHandle = await window.showSaveFilePicker({
          suggestedName: `${customFilename}.csv`,
          types: [{
            description: 'ملف كشف الرواتب المالي Excel CSV',
            accept: { 'text/csv': ['.csv'] }
          }]
        });
        useSaveFilePicker = true;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          showToast('تم إلغاء تصدير وحفظ الملف.', 'info');
          return;
        }
        console.warn('showSaveFilePicker was blocked/failed in sandbox, falling back to standard download:', err);
      }
    }

    if (useSaveFilePicker && fileHandle) {
      try {
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        showToast('تم حفظ ملف الـ Excel بنجاح في المكان المحدد! 📊', 'success');
        setShowExportModal(false);
      } catch (error) {
        console.warn('Writable Excel save failed, fallback to direct download:', error);
        triggerFallbackDownload(blob, `${customFilename}.csv`);
      }
    } else {
      triggerFallbackDownload(blob, `${customFilename}.csv`);
    }
  };

  const triggerFallbackDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
    showToast(language === 'ar' ? 'تمت عملية التصدير وحفظ ملف Excel بنجاح!' : 'Roster CSV compiled & downloaded successfully.', 'success');
  };

  // Drag-drop & bulk upload parsing to match, update and recalculate employees
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const arrayBuffer = event.target?.result as ArrayBuffer;
      if (!arrayBuffer) return;

      try {
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Smart Sheet Discovery: search all SheetNames to find the worksheet with matching rows & headers
        let selectedSheetName = workbook.SheetNames[0];
        let worksheet = workbook.Sheets[selectedSheetName];
        let sheetRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

        for (const sheetName of workbook.SheetNames) {
          const ws = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
          if (rows.length >= 2) {
            const rawHeaders = rows[0] as any[];
            const headerStr = rawHeaders.map(h => String(h || '')).join(' ');
            if (
              headerStr.includes('الرقم') || 
              headerStr.includes('الوظيفي') || 
              headerStr.includes('الاسم') ||
              headerStr.includes('كود') ||
              headerStr.toLowerCase().includes('id') ||
              headerStr.toLowerCase().includes('name') ||
              headerStr.toLowerCase().includes('emp')
            ) {
              selectedSheetName = sheetName;
              worksheet = ws;
              sheetRows = rows;
              break;
            }
          }
        }

        if (sheetRows.length < 2) {
          showToast(language === 'ar' ? 'الملف فارغ أو غير منسق بشكل صحيح!' : 'Uploaded file is empty or corrupt.', 'error');
          return;
        }

        // Clean & sanitize header row (removing hidden whitespaces/special characters)
        const rawHeaders = sheetRows[0] as any[];
        const headerRow = rawHeaders.map((h: any) => {
          if (h === null || h === undefined) return '';
          return String(h)
            .replace(/[\u200B-\u200D\uFEFF]/g, '') // strip invisible / BOM characters
            .trim()
            .replace(/\s+/g, ' '); // collapse multiple spaces
        });

        // 1. ZKTeco BioTime Arab headers dynamic mapping
        const zkEmpIdIndex = headerRow.findIndex(h => 
          h === 'رقم الموظف' || h.includes('رقم الموظف') || h.includes('رقم_الموظف') || h.includes('معرف الموظف') || h.includes('الرقم الوظيفي') || h.includes('كود الموظف') || h.includes('رقم الكادر') || h.toLowerCase() === 'employee no' || h.toLowerCase() === 'employee id' || h.toLowerCase() === 'emp id' || h.toLowerCase() === 'staff id'
        );
        const zkFirstNameIndex = headerRow.findIndex(h => 
          h === 'الإسم الأول' || h.includes('الإسم الأول') || h.includes('الاسم الاول') || h.includes('الاسم الأول') || h.includes('الاسم') || h.includes('اسم الموظف') || h.includes('اسم الموضف') || h.toLowerCase() === 'first name' || h.toLowerCase() === 'name' || h.toLowerCase() === 'employee name'
        );
        const zkDateIndex = headerRow.findIndex(h => 
          h === 'التاريخ' || h.includes('التاريخ') || h.toLowerCase() === 'date' || h.includes('يوم')
        );
        const zkTimeIndex = headerRow.findIndex(h => 
          h === 'الوقت' || h.includes('الوقت') || h.toLowerCase() === 'time' || h.includes('زمن البصمة') || h.includes('وقت البصمة')
        );
        const zkStateIndex = headerRow.findIndex(h => 
          h === 'حالة البصمة' || h.includes('حالة البصمة') || h.includes('حالة_البصمة') || h.includes('تسجيل الدخول') || h.includes('تسجيل الخروج') || h.toLowerCase() === 'punch state'
        );

        const hasMonthlyTotalsHeaders = headerRow.some(h => {
          const clean = h.trim().toLowerCase();
          return (
            clean.includes('دوام') ||
            clean.includes('دام') || // Handles "الدام" and "عدد ايام الدام"
            clean.includes('استدعاء') ||
            clean.includes('كول') ||
            clean.includes('إضافي') ||
            clean.includes('اضافي') ||
            clean.includes('استقطاع') ||
            clean.includes('غياب') ||
            clean.includes('مخصصات') ||
            clean.includes('شفت') ||
            clean.includes('ساعات') ||
            clean.includes('خفر') ||
            clean.includes('عقوبات') ||
            clean.includes('working') ||
            clean.includes('extra') ||
            clean.includes('callout') ||
            clean.includes('deduct') ||
            clean.includes('shift')
          );
        });

        const isZKTecoReport = !hasMonthlyTotalsHeaders && zkEmpIdIndex !== -1 && (zkDateIndex !== -1 || zkFirstNameIndex !== -1);

        if (isZKTecoReport) {
          // Process ZKTeco Attendance logs
          const attendanceByEmployee: { [empIdentifier: string]: { [dateStr: string]: Set<string> } } = {};
          const nameByEmployeeId: { [empId: string]: string } = {};

          for (let i = 1; i < sheetRows.length; i++) {
            const row = sheetRows[i];
            if (!row || row.length === 0) continue;

            const rawId = zkEmpIdIndex !== -1 && row[zkEmpIdIndex] !== undefined ? String(row[zkEmpIdIndex]).trim() : '';
            const rawName = zkFirstNameIndex !== -1 && row[zkFirstNameIndex] !== undefined ? String(row[zkFirstNameIndex]).trim() : '';
            const rawDate = zkDateIndex !== -1 && row[zkDateIndex] !== undefined ? String(row[zkDateIndex]).trim() : '';
            const rawTime = zkTimeIndex !== -1 && row[zkTimeIndex] !== undefined ? String(row[zkTimeIndex]).trim() : '';

            if (!rawId && !rawName) continue;

            const key = rawId || rawName;
            if (!attendanceByEmployee[key]) {
              attendanceByEmployee[key] = {};
            }
            if (rawId && rawName) {
              nameByEmployeeId[rawId] = rawName;
            }

            if (rawDate) {
              const parsedDateObj = parseAttendanceDate(rawDate);
              if (parsedDateObj) {
                const dateStr = `${parsedDateObj.getFullYear()}-${String(parsedDateObj.getMonth() + 1).padStart(2, '0')}-${String(parsedDateObj.getDate()).padStart(2, '0')}`;
                if (!attendanceByEmployee[key][dateStr]) {
                  attendanceByEmployee[key][dateStr] = new Set<string>();
                }
                let timeStr = '00:00:00';
                if (rawTime) {
                  timeStr = rawTime;
                } else {
                  timeStr = `${String(parsedDateObj.getHours()).padStart(2, '0')}:${String(parsedDateObj.getMinutes()).padStart(2, '0')}:${String(parsedDateObj.getSeconds()).padStart(2, '0')}`;
                }
                attendanceByEmployee[key][dateStr].add(timeStr);
              }
            }
          }

          let updatedCount = 0;
          const updatedEmployees = employees.map(emp => {
            let matchedKey: string | null = null;
            for (const key of Object.keys(attendanceByEmployee)) {
              const keyClean = key.toLowerCase();
              const empIdClean = emp.id.toLowerCase();
              const empCodeClean = emp.employeeCode ? emp.employeeCode.toLowerCase() : '';
              const empNameClean = emp.name.trim().toLowerCase();

              // Direct match
              if (keyClean === empIdClean || keyClean === empCodeClean || keyClean === empNameClean) {
                matchedKey = key;
                break;
              }

              // Match by numbers in the code
              if (emp.employeeCode) {
                const numericCode = emp.employeeCode.replace(/\D/g, '');
                const numericKey = key.replace(/\D/g, '');
                if (numericCode && numericKey && numericCode === numericKey) {
                  matchedKey = key;
                  break;
                }
              }
            }

            if (matchedKey) {
              const dept = departments.find(d => d.id === emp.departmentId);
              const isExempt = emp.isFingerprintExempt || (dept && (dept.isLumpSum || dept.salaryStructureType === 'lump_sum'));

              if (isExempt) {
                updatedCount++;
                return {
                  ...emp,
                  workingDays: 30,
                  workingHours: 240,
                  deductionDays: 0,
                  deductionHours: 0,
                };
              }

              updatedCount++;

              // Determine active calendar month from the loaded sheet data
              let parsedYear = 2026;
              let parsedMonth = 5; // Default: June
              let sampleDateStr = '';
              for (const k of Object.keys(attendanceByEmployee)) {
                const dates = Object.keys(attendanceByEmployee[k]);
                if (dates.length > 0) {
                  sampleDateStr = dates[0];
                  break;
                }
              }

              const sampleParsed = parseAttendanceDate(sampleDateStr);
              if (sampleParsed) {
                parsedYear = sampleParsed.getFullYear();
                parsedMonth = sampleParsed.getMonth();
              }

              const totalDaysInMonth = new Date(parsedYear, parsedMonth + 1, 0).getDate();
              const empLoggedData = attendanceByEmployee[matchedKey];

              let presentDays = 0;
              let missingNonFridays = 0;
              let missingFridays = 0;
              let totalLateMinutesMonth = 0;

              const sType = dept?.shiftType || 'single';
              const activeShiftsCount = Number(dept?.activeShiftsCount || 1);

              const hasCustom = !!emp.hasCustomShift;
              const isCustFlexible = hasCustom && emp.customShiftType === 'flexible';
              const custStartVal = emp.customStart ? timeToMinutes(emp.customStart, 8 * 60) : 8 * 60;
              const custEndVal = emp.customEnd ? timeToMinutes(emp.customEnd, 14 * 60) : 14 * 60;

              const shift1Start = timeToMinutes(dept?.s1Start, 8 * 60); 
              const shift1End = timeToMinutes(dept?.s1End, 14 * 60); 
              const shift2Start = timeToMinutes(dept?.s2Start, 14 * 60); 
              const shift2End = timeToMinutes(dept?.s2End, 20 * 60); 
              const shift3Start = timeToMinutes(dept?.s3Start, 20 * 60); 
              const shift3End = timeToMinutes(dept?.s3End, 2 * 60); 
              const shift4Start = timeToMinutes(dept?.s4Start, 2 * 60); 
              const shift4End = timeToMinutes(dept?.s4End, 8 * 60); 

              const consumedOvernightCheckouts: { [dateStr: string]: Set<number> } = {};
              const overnightMatchedDays: { [dateStr: string]: { checkIn: number; checkOut: number; matchedStart: number; matchedEnd: number } } = {};

              for (let d = 1; d <= totalDaysInMonth; d++) {
                const currentDate = new Date(parsedYear, parsedMonth, d);
                const formattedDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                consumedOvernightCheckouts[formattedDateStr] = new Set<number>();
              }

              // Phase 1: Match cross-day/overnight night duties
              if ((hasCustom && !isCustFlexible) || sType === 'multi_shift' || sType === 'single') {
                for (let d = 1; d <= totalDaysInMonth; d++) {
                  const currentDate = new Date(parsedYear, parsedMonth, d);
                  const formattedPrevDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

                  const nextDate = new Date(parsedYear, parsedMonth, d + 1);
                  const formattedNextDateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;

                  const todayPunches = empLoggedData[formattedPrevDateStr];
                  const nextDayPunches = empLoggedData[formattedNextDateStr];

                  if (todayPunches && todayPunches.size > 0 && nextDayPunches && nextDayPunches.size > 0) {
                    const todayMins = Array.from(todayPunches).map(tStr => {
                      const match = tStr.match(/(\d{1,2}):(\d{1,2})/);
                      return match ? parseInt(match[1]) * 60 + parseInt(match[2]) : 0;
                    }).sort((a, b) => a - b);

                    const nextMins = Array.from(nextDayPunches).map(tStr => {
                      const match = tStr.match(/(\d{1,2}):(\d{1,2})/);
                      return match ? parseInt(match[1]) * 60 + parseInt(match[2]) : 0;
                    }).sort((a, b) => a - b);

                    const hasCustomNotFlexible = hasCustom && !isCustFlexible;
                    const targetStart = hasCustomNotFlexible ? custStartVal : 17 * 60;
                    const targetEnd = hasCustomNotFlexible ? custEndVal : 8 * 60;
                    const isOvernight = hasCustomNotFlexible ? (targetEnd < targetStart) : true;

                    if (isOvernight) {
                      const checkInMins = todayMins.find(m => hasCustomNotFlexible ? (Math.abs(m - targetStart) <= 180 || m >= 17 * 60) : (m >= 17 * 60)); 
                      const checkoutMins = nextMins.find(m => hasCustomNotFlexible ? (Math.abs(m - targetEnd) <= 180 || (m >= 5 * 60 && m <= 11 * 60)) : (m >= 5 * 60 && m <= 9 * 60 + 30));

                      if (checkInMins !== undefined && checkoutMins !== undefined) {
                        if (hasCustomNotFlexible) {
                          overnightMatchedDays[formattedPrevDateStr] = {
                            checkIn: checkInMins,
                            checkOut: checkoutMins,
                            matchedStart: targetStart,
                            matchedEnd: targetEnd
                          };
                          consumedOvernightCheckouts[formattedNextDateStr].add(checkoutMins);
                        } else {
                          const activeShifts: { start: number; end: number; shiftNum: number }[] = [];
                          if (sType === 'single') {
                            activeShifts.push({ start: shift1Start, end: shift1End, shiftNum: 1 });
                          } else {
                            if (activeShiftsCount >= 1) activeShifts.push({ start: shift1Start, end: shift1End, shiftNum: 1 });
                            if (activeShiftsCount >= 2) activeShifts.push({ start: shift2Start, end: shift2End, shiftNum: 2 });
                            if (activeShiftsCount >= 3) activeShifts.push({ start: shift3Start, end: shift3End, shiftNum: 3 });
                            if (activeShiftsCount >= 4) activeShifts.push({ start: shift4Start, end: shift4End, shiftNum: 4 });
                          }

                          let bestShift = activeShifts[0];
                          let minDiff = 99999;
                          for (const s of activeShifts) {
                            const dStart = getCircularDiff(checkInMins, s.start);
                            if (dStart < minDiff) {
                              minDiff = dStart;
                              bestShift = s;
                            }
                          }

                          if (bestShift) {
                            overnightMatchedDays[formattedPrevDateStr] = {
                              checkIn: checkInMins,
                              checkOut: checkoutMins,
                              matchedStart: bestShift.start,
                              matchedEnd: bestShift.end
                            };
                            consumedOvernightCheckouts[formattedNextDateStr].add(checkoutMins);
                          }
                        }
                      }
                    }
                  }
                }
              }

              // Phase 2: Compute day-by-day attendance and metrics
              for (let day = 1; day <= totalDaysInMonth; day++) {
                const currentDate = new Date(parsedYear, parsedMonth, day);
                const dayIsFriday = currentDate.getDay() === 5;
                const formattedDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

                const dayPunchesSet = empLoggedData[formattedDateStr];
                
                let remainingTodayPunches: number[] = [];
                if (dayPunchesSet && dayPunchesSet.size > 0) {
                  const todayPunchesMins = Array.from(dayPunchesSet).map(tStr => {
                    const match = tStr.match(/(\d{1,2}):(\d{1,2})/);
                    return match ? parseInt(match[1]) * 60 + parseInt(match[2]) : 0;
                  }).sort((a, b) => a - b);

                  const consumedSet = consumedOvernightCheckouts[formattedDateStr] || new Set<number>();
                  remainingTodayPunches = todayPunchesMins.filter(m => !consumedSet.has(m));
                }

                const hasOvernightStartedToday = overnightMatchedDays[formattedDateStr];

                if (hasOvernightStartedToday) {
                  presentDays++;

                  const { checkIn, checkOut, matchedStart, matchedEnd } = hasOvernightStartedToday;

                  let lateMin = (checkIn - matchedStart + 1440) % 1440;
                  if (lateMin > 720) {
                    lateMin = 0; 
                  }
                  if (lateMin <= 15) {
                    lateMin = 0; 
                  }

                  const totalCheckOut = checkOut + 1440;
                  const totalMatchedEnd = matchedEnd < matchedStart ? matchedEnd + 1440 : matchedEnd;

                  let earlyOutMin = (totalMatchedEnd - totalCheckOut + 1440) % 1440;
                  if (earlyOutMin > 720) {
                    earlyOutMin = 0; 
                  }
                  if (earlyOutMin <= 15) {
                    earlyOutMin = 0; 
                  }

                  totalLateMinutesMonth += (lateMin + earlyOutMin);

                } else if (remainingTodayPunches.length > 0) {
                  presentDays++;

                  if (isCustFlexible || (!hasCustom && sType === 'flexible')) {
                    // Skip late calculations
                  } else {
                    const checkInMinutes = remainingTodayPunches[0];
                    const checkOutMinutes = remainingTodayPunches[remainingTodayPunches.length - 1];

                    let matchedShiftStart = shift1Start;
                    let matchedShiftEnd = shift1End;

                    if (hasCustom) {
                      matchedShiftStart = custStartVal;
                      matchedShiftEnd = custEndVal;
                    } else if (sType === 'multi_shift') {
                      const diffs: { diff: number; start: number; end: number }[] = [];
                      if (activeShiftsCount >= 1) diffs.push({ diff: getCircularDiff(checkInMinutes, shift1Start), start: shift1Start, end: shift1End });
                      if (activeShiftsCount >= 2) diffs.push({ diff: getCircularDiff(checkInMinutes, shift2Start), start: shift2Start, end: shift2End });
                      if (activeShiftsCount >= 3) diffs.push({ diff: getCircularDiff(checkInMinutes, shift3Start), start: shift3Start, end: shift3End });
                      if (activeShiftsCount >= 4) diffs.push({ diff: getCircularDiff(checkInMinutes, shift4Start), start: shift4Start, end: shift4End });

                      if (diffs.length > 0) {
                        diffs.sort((a, b) => a.diff - b.diff);
                        matchedShiftStart = diffs[0].start;
                        matchedShiftEnd = diffs[0].end;
                      }
                    }

                    let lateMin = (checkInMinutes - matchedShiftStart + 1440) % 1440;
                    if (lateMin > 720) {
                      lateMin = 0;
                    }
                    if (lateMin <= 15) {
                      lateMin = 0;
                    }

                    let earlyOutMin = (matchedShiftEnd - checkOutMinutes + 1440) % 1440;
                    if (earlyOutMin > 720) {
                      earlyOutMin = 0;
                    }
                    if (earlyOutMin <= 15) {
                      earlyOutMin = 0;
                    }

                    totalLateMinutesMonth += (lateMin + earlyOutMin);
                  }

                } else {
                  if (dayIsFriday) {
                    const isPaidHoliday = !dept || dept.fridayRule === 'paid_holiday' || !dept.fridayRule;
                    if (isPaidHoliday) {
                      presentDays++; 
                    } else {
                      missingFridays++; 
                    }
                  } else {
                    missingNonFridays++; 
                  }
                }
              }

              // Evaluate net unpaid absence days
              let absencesToEvaluate = missingNonFridays;
              const isFridayWorkingDay = dept && dept.fridayRule === 'working_day';
              if (isFridayWorkingDay) {
                absencesToEvaluate += missingFridays;
              }

              const allowedLeaves = dept && dept.allowedPaidLeaves !== undefined ? dept.allowedPaidLeaves : 0;
              const netUnpaidAbsences = Math.max(0, absencesToEvaluate - allowedLeaves);
              const finalDeductionDays = netUnpaidAbsences;

              const finalWorkingDays = Math.min(30, presentDays);
              const finalDeductionHours = Number((totalLateMinutesMonth / 60).toFixed(2));

              return {
                ...emp,
                workingDays: finalWorkingDays,
                workingHours: finalWorkingDays * 8,
                deductionDays: finalDeductionDays,
                deductionHours: finalDeductionHours,
              };
            }
            return emp;
          });

          if (updatedCount > 0) {
            onSaveEmployees(updatedEmployees);
            showToast(
              language === 'ar'
                ? `نجاح! تم تحليل كشف بصمة ZKTeco BioTime. تم العثور على حركات حضور وتحديث ${updatedCount} كادر بنجاح بمطابقة (رقم الموظف/الإسم الأول).`
                : `Success! Parsed ZKTeco BioTime attendance. Updated ${updatedCount} employees based on unique attendance dates.`,
              'success'
            );
          } else {
            showToast(
              language === 'ar'
                ? 'تم تحليل ملف ZKTeco ولكن لم يتم العثور على أكواد مطابقة مع الموظفين المسجلين في النظام!'
                : 'ZKTeco file parsed, but no matching Employee Codes or Names found in the system.',
              'info'
            );
          }
        } else {
          // 2. Standard custom roster sheet import
          const normalizeString = (str: string) => {
            if (!str) return '';
            return str
              .toLowerCase()
              .replace(/[()（）[\]{}「」.,\/#!$%\^&\*;:{}=\-_`~?؟]/g, '') // remove brackets & punctuation
              .replace(/[\s_ـ-]+/g, '') // strip all spaces, underscores, kashida, and hyphens
              .replace(/[أإآا]/g, 'ا') // normalize alef variations
              .replace(/[ةه]/g, 'ه')  // normalize teh marbuta / heh
              .replace(/[ىيئ]/g, 'ي')  // normalize yeh / alef maksura / yeh with hamza
              .trim();
          };

          const cleanHeaderString = (h: any): string => {
            if (h === null || h === undefined) return '';
            return String(h).trim().replace(/\s+/g, ' ').toLowerCase();
          };

          // Priority 1: Smart ID Mapping based on explicit rules: "الرقم", "الوظيفي", "كود", "id"
          const idColIndex = headerRow.findIndex(h => {
            const clean = cleanHeaderString(h);
            return (
              clean === 'الرقم الوظيفي (كود الموظف)' ||
              clean === 'الرقم الوظيفي' ||
              clean === 'كود الموظف' ||
              clean === 'empid' ||
              clean === 'id' ||
              clean === 'empcode' ||
              clean === 'employeecode' ||
              clean === 'رقم الموظف' ||
              clean === 'معرف الموظف' ||
              clean.includes('الرقم') || 
              clean.includes('الوظيفي') || 
              clean.includes('كود') || 
              clean.includes('id')
            );
          });
          
          if (idColIndex === -1) {
            showToast(
              language === 'ar' 
                ? 'عذراً، لم نتمكن من تحديد حقل (معرف الموظف ID) أو (الرقم الوظيفي) في الملف المرفوع لمطابقته!' 
                : 'CSV lacks a recognizable Employee ID / Code column!', 
              'error'
            );
            return;
          }

          // Define synonyms in both Arabic and English for all dynamic variables
          const fieldKeywords: { [key in FieldId]?: string[] } = {
            workingDays: [
              'أيام الدوام', 'ايام الدوام', 'الدوام الفعلي', 'حضور', 'عدد الأيام', 'الايام', 'الدوام', 'الأيام', 'أيام', 
              'أيام الدام', 'ايام الدام', 'الدام الفعلي', 'عدد ايام الدام', 'الدام', 'عدد أيام الدام', 'عدد أيام العمل', 'عدد ايام العمل',
              'ايام العمل', 'أيام العمل', 'العمل الفعلي', 'ايام الحضور', 'أيام الحضور', 'عدد ايام الحضور', 'عدد أيام الحضور',
              'attendancedays', 'workingdays', 'days', 'working days', 'days worked', 'worked days', 'presence days'
            ],
            workingHours: [
              'ساعات الدوام', 'ساعات الدوام الفعلي', 'ساعات', 'الساعات', 'عدد الساعات', 'ساعات العمل', 'عدد ساعات العمل',
              'workinghours', 'hours', 'working hours', 'hours worked', 'worked hours'
            ],
            shiftMorning: ['صباحي', 'شفت صباحي', 'الصباحي', 'صباحا', 'morning', 'shiftmorning', 'morning shift'],
            shiftEvening: ['مسائي', 'شفت مسائي', 'المسائي', 'مساء', 'evening', 'shiftevening', 'evening shift'],
            shiftMiddle: [
              'وسطى', 'شفت وسطى', 'الوسطى', 'وسطي', 'middle', 'shiftmiddle', 'middle shift',
              'شفت وسطي', 'شفتات وسطية', 'شفتات وسطي', 'الشفت الوسطي', 'الشفت الوسطى', 'الوسطي', 'وسطيه', 'شفت وسطيه', 'شفتات وسطيه'
            ],
            shiftFull24: ['24', 'شفت 24', 'h24', 'h 24', 'full24', 'shiftfull24', '٤٢ ساعة', '٢٤ ساعة', '24 ساعة', '24 hour', '24 hours'],
            shiftHalf12: [
              '12', '12 ساعة', 'شفت 12', '12h', 'half12', 'shifthalf12', '١٢ ساعة', '12 hour', '12 hours',
              'عدد نصف يوم', 'نصف يوم', 'نصف اليوم', 'شفت نصف شفت', 'نصف شفت', 'half day', 'half days', 'halfdays'
            ],
            shiftKhafar: ['خفر', 'شفت خفر', 'khafar', 'shiftkhafar'],
            callouts: ['استدعاء', 'الكولات', 'الاستدعاءات', 'عدد الاستدعاءات', 'عدد الاستدعاء', 'الاستدعاء', 'استدعاءات', 'عدد استدعاء', 'callouts', 'call outs', 'calloutcount', 'الكول', 'كول'],
            allowanceExtraDays: [
              'إضافي أيام', 'أيام إضافية', 'إضافي الايام', 'الاضافي ايام', 'الايام الاضافية', 'أيام إضافي', 'ايام اضافية', 'ايام اضافي', 
              'الاضافي أيام', 'الايام الاضافيه', 'اضافي أيام', 'اضافي ايام', 'أيام اضافي', 'أيام اضافية',
              'إضافي الأيام', 'إضافي الايام', 'الاضافي الأيام', 'الاضافي الايام', 'أيام إضافية', 'ايام اضافية',
              'أيام اضافيه', 'ايام اضافيه', 'الايام الاضافية', 'الايام الاضافيه', 'الايام الاضافي',
              'extra days', 'extradays', 'allowanceextradays', 'إضافي أ'
            ],
            allowanceExtraHours: [
              'إضافي ساعات', 'ساعات إضافية', 'إضافي الساعات', 'الاضافي ساعات', 'الساعات الاضافية', 'ساعات إضافي', 'ساعات اضافية', 'ساعات اضافي',
              'extra hours', 'allowanceextrahours', 'إضافي س', 'اضافي ساعات'
            ],
            allowanceGeneral: ['مخصصات عامة', 'علاوات', 'مخصصات', 'عامة', 'allowancegeneral', 'allowance general', 'allowance'],
            deductionDays: [
              'استقطاع أيام', 'أيام الاستقطاع', 'غيابات', 'استقطاع ايام', 'غياب أيام', 'غياب', 
              'استقطاع الغياب', 'غياب الموظف', 'ايام الغياب', 'أيام الغياب', 'عدد أيام الغياب', 
              'عدد ايام الغياب', 'عدد الغيابات', 'الغيابات', 'الغياب', 'الأيام المستقطعة', 
              'الايام المستقطعة', 'خصم أيام', 'خصم ايام', 'استقطاع غياب', 'استقطاع الغيابات', 'غيابات الموظف',
              'استقطاع الأيام', 'استقطاع الايام', 'أيام الاستقطاع', 'ايام الاستقطاع', 'أيام استقطاع', 'ايام استقطاع',
              'استقطاعات أيام', 'استقطاعات ايام', 'استقطاعات الأيام', 'استقطاعات الايام', 'أيام الاستقطاعات', 'ايام الاستقطاعات',
              'خصم الأيام', 'خصم الايام', 'أيام الخصم', 'ايام الخصم', 'أيام خصم', 'ايام خصم', 'الغيابات', 'الغياب', 'غياب أيام', 'غياب ايام',
              'deductiondays', 'deducteddays', 'deduction days', 'absence days', 'absence', 'absences'
            ],
            deductionHours: ['استقطاع ساعات', 'ساعات الاستقطاع', 'استقطاع ساعات', 'تأخير', 'تأخير ساعات', 'ساعات التأخير', 'ساعات التاخير', 'خصم ساعات', 'deductionhours', 'deduction hours', 'late hours'],
            deductionPenalties: ['عقوبات', 'عقوبات مالية', 'جزاءات', 'غرامات', 'خصومات إدارية', 'عقوبه', 'عقوبات الموظف', 'deductionpenalties', 'penalties'],
            deductionOther: ['استقطاعات أخرى', 'خصومات أخرى', 'خصومات', 'استقطاعات', 'استقطاع', 'الاستقطاع', 'الاستقطاعات', 'الخصم', 'deductionother', 'other deductions', 'deductions'],
            previousMonthOver: ['رصيد سابق', 'تسويات', 'فروقات', 'تسوية', 'previousmonthover', 'previous month over']
          };

          const mappedFieldIndices: { [key in FieldId]?: number } = {};
          const mappedColIndices = new Set<number>();

          const normalizedHeaders = headerRow.map((h, idx) => ({
            original: h,
            index: idx,
            normalized: normalizeString(h)
          }));

          // Pass 0: Ultimate Strict Pre-Mapping for target Days columns to avoid ANY hijacking or mis-mapping
          const targetDeductionKws = [
            'استقطاع أيام', 'استقطاع ايام', 'أيام الاستقطاع', 'غياب أيام', 'غيابات',
            'استقطاع الأيام', 'استقطاع الايام', 'أيام الاستقطاع', 'ايام الاستقطاع', 'أيام استقطاع', 'ايام استقطاع',
            'استقطاعات أيام', 'استقطاعات ايام', 'استقطاعات الأيام', 'استقطاعات الايام', 'أيام الاستقطاعات', 'ايام الاستقطاعات',
            'خصم أيام', 'خصم ايام', 'خصم الأيام', 'خصم الايام', 'أيام الخصم', 'ايام الخصم', 'أيام خصم', 'ايام خصم',
            'غياب أيام', 'غياب ايام', 'أيام الغياب', 'ايام الغياب'
          ].map(k => normalizeString(k));

          const targetAllowanceKws = [
            'إضافي أيام', 'إضافي ايام', 'أيام إضافية', 'ايام اضافية', 'اضافي ايام', 'اضافي أيام',
            'إضافي الأيام', 'إضافي الايام', 'الاضافي ايام', 'الاضافي أيام', 'الاضافي الأيام', 'الاضافي الايام',
            'أيام إضافية', 'ايام اضافية', 'أيام اضافيه', 'ايام اضافيه', 'أيام إضافي', 'ايام اضافي', 'اضافي أيام', 'اضافي ايام',
            'أيام اضافي', 'أيام اضافية', 'الايام الاضافية', 'الايام الاضافيه', 'الايام الاضافي'
          ].map(k => normalizeString(k));

          // Map deductionDays first from strict target list
          const strictDeductionHeader = normalizedHeaders.find(nh => {
            if (nh.index === idColIndex || mappedColIndices.has(nh.index)) return false;
            return targetDeductionKws.includes(nh.normalized);
          });
          if (strictDeductionHeader) {
            mappedFieldIndices['deductionDays'] = strictDeductionHeader.index;
            mappedColIndices.add(strictDeductionHeader.index);
          }

          // Map allowanceExtraDays first from strict target list
          const strictAllowanceHeader = normalizedHeaders.find(nh => {
            if (nh.index === idColIndex || mappedColIndices.has(nh.index)) return false;
            return targetAllowanceKws.includes(nh.normalized);
          });
          if (strictAllowanceHeader) {
            mappedFieldIndices['allowanceExtraDays'] = strictAllowanceHeader.index;
            mappedColIndices.add(strictAllowanceHeader.index);
          }

          // Pass 1: Exact matches for all variables (This is highly safe and maps clean columns first)
          Object.entries(fieldKeywords).forEach(([field, keywords]) => {
            const labelsToMatch = [...(keywords || [])];
            const customLabel = customFieldLabels?.[field];
            if (customLabel) {
              labelsToMatch.push(customLabel);
            }
            const defaultLabel = FIELDS_METADATA.find(m => m.id === field)?.label;
            if (defaultLabel) {
              labelsToMatch.push(defaultLabel);
            }
            const checkboxLabel = ALL_CHECKBOX_COLUMNS.find(c => c.id === field)?.label;
            if (checkboxLabel) {
              labelsToMatch.push(checkboxLabel);
            }

            const normalizedKws = Array.from(new Set(labelsToMatch.map(k => normalizeString(k))));
            const foundHeader = normalizedHeaders.find(nh => {
              if (nh.index === idColIndex || mappedColIndices.has(nh.index)) return false;
              return normalizedKws.some(nkw => nh.normalized === nkw);
            });
            if (foundHeader) {
              mappedFieldIndices[field as FieldId] = foundHeader.index;
              mappedColIndices.add(foundHeader.index);
            }
          });

          // Pass 2: Fuzzy/Inclusion matches for all variables (excluding short generic terms to avoid hijacking)
          Object.entries(fieldKeywords).forEach(([field, keywords]) => {
            if (mappedFieldIndices[field as FieldId] !== undefined) return;

            const labelsToMatch = [...(keywords || [])];
            const customLabel = customFieldLabels?.[field];
            if (customLabel) {
              labelsToMatch.push(customLabel);
            }
            const defaultLabel = FIELDS_METADATA.find(m => m.id === field)?.label;
            if (defaultLabel) {
              labelsToMatch.push(defaultLabel);
            }
            const checkboxLabel = ALL_CHECKBOX_COLUMNS.find(c => c.id === field)?.label;
            if (checkboxLabel) {
              labelsToMatch.push(checkboxLabel);
            }

            const normalizedKws = Array.from(new Set(labelsToMatch.map(k => normalizeString(k))));
            const foundHeader = normalizedHeaders.find(nh => {
              if (nh.index === idColIndex || mappedColIndices.has(nh.index)) return false;
              return normalizedKws.some(nkw => {
                // Skip generic small/common keywords for substring matching to prevent hijacking other columns
                if (nkw.length < 3) return false;
                const isGeneric = ['ايام', 'يوم', 'ساعات', 'ساعه', 'days', 'hours', 'day', 'hour', 'الايام', 'الساعات', 'س', 'ي'].includes(nkw);
                if (isGeneric) return false;

                // SPECIAL SAFEGUARD: Prevent generic terms like 'استقطاع' or 'اضافي' from hijacking days or hours specific columns
                const norm = nh.normalized;
                if (field !== 'deductionDays' && (nkw === 'استقطاع' || nkw === 'خصم' || nkw === 'deduct') && (norm.includes('ايام') || norm.includes('يوم') || norm.includes('days') || norm.includes('day'))) {
                  return false;
                }
                if (field !== 'deductionHours' && (nkw === 'استقطاع' || nkw === 'خصم' || nkw === 'deduct') && (norm.includes('ساع') || norm.includes('hour'))) {
                  return false;
                }
                if (field !== 'allowanceExtraDays' && (nkw === 'اضافي' || nkw === 'مخصص' || nkw === 'allowance' || nkw === 'extra') && (norm.includes('ايام') || norm.includes('يوم') || norm.includes('days') || norm.includes('day'))) {
                  return false;
                }
                if (field !== 'allowanceExtraHours' && (nkw === 'اضافي' || nkw === 'مخصص' || nkw === 'allowance' || nkw === 'extra') && (norm.includes('ساع') || norm.includes('hour'))) {
                  return false;
                }

                return nh.normalized.includes(nkw) || nkw.includes(nh.normalized);
              });
            });
            if (foundHeader) {
              mappedFieldIndices[field as FieldId] = foundHeader.index;
              mappedColIndices.add(foundHeader.index);
            }
          });

          // Pass 3: Smart Targeted Conflict-Free Fallbacks for critical days/hours fields
          
          // 1. allowanceExtraDays (أيام إضافية)
          if (mappedFieldIndices['allowanceExtraDays'] === undefined) {
            const found = normalizedHeaders.find(nh => {
              if (nh.index === idColIndex || mappedColIndices.has(nh.index)) return false;
              const norm = nh.normalized;
              return (norm.includes('اضافي') || norm.includes('extra')) &&
                     !norm.includes('ساع') && !norm.includes('hour');
            });
            if (found) {
              mappedFieldIndices['allowanceExtraDays'] = found.index;
              mappedColIndices.add(found.index);
            }
          }

          // 2. allowanceExtraHours (ساعات إضافية)
          if (mappedFieldIndices['allowanceExtraHours'] === undefined) {
            const found = normalizedHeaders.find(nh => {
              if (nh.index === idColIndex || mappedColIndices.has(nh.index)) return false;
              const norm = nh.normalized;
              return (norm.includes('اضافي') || norm.includes('extra')) &&
                     (norm.includes('ساع') || norm.includes('hour'));
            });
            if (found) {
              mappedFieldIndices['allowanceExtraHours'] = found.index;
              mappedColIndices.add(found.index);
            }
          }

          // 3. deductionDays (أيام الغياب / استقطاع أيام)
          if (mappedFieldIndices['deductionDays'] === undefined) {
            const found = normalizedHeaders.find(nh => {
              if (nh.index === idColIndex || mappedColIndices.has(nh.index)) return false;
              const norm = nh.normalized;
              return norm.includes('غياب') || 
                     norm.includes('absence') || 
                     norm.includes('خصمايام') || 
                     norm.includes('استقطاعايام') || 
                     norm.includes('غيابات') || 
                     norm.includes('غيابالموظف') ||
                     ((norm.includes('استقطاع') || norm.includes('خصم') || norm.includes('deduct')) && 
                      (norm.includes('ايام') || norm.includes('يوم') || norm.includes('days') || norm.includes('absence')));
            });
            if (found) {
              mappedFieldIndices['deductionDays'] = found.index;
              mappedColIndices.add(found.index);
            }
          }

          // 4. deductionHours (استقطاع ساعات)
          if (mappedFieldIndices['deductionHours'] === undefined) {
            const found = normalizedHeaders.find(nh => {
              if (nh.index === idColIndex || mappedColIndices.has(nh.index)) return false;
              const norm = nh.normalized;
              return norm.includes('تاخير') || 
                     norm.includes('late') || 
                     ((norm.includes('استقطاع') || norm.includes('خصم') || norm.includes('deduct')) && 
                      (norm.includes('ساع') || norm.includes('hour')));
            });
            if (found) {
              mappedFieldIndices['deductionHours'] = found.index;
              mappedColIndices.add(found.index);
            }
          }

          // 5. workingDays (أيام الدوام)
          if (mappedFieldIndices['workingDays'] === undefined) {
            const found = normalizedHeaders.find(nh => {
              if (nh.index === idColIndex || mappedColIndices.has(nh.index)) return false;
              const norm = nh.normalized;
              return norm.includes('دوام') || 
                     norm.includes('حضور') || 
                     norm.includes('attendance') || 
                     norm.includes('فعلي') || 
                     norm.includes('daysworked') || 
                     norm.includes('workeddays');
            });
            if (found) {
              mappedFieldIndices['workingDays'] = found.index;
              mappedColIndices.add(found.index);
            }
          }

          // 6. shiftHalf12 (عدد نصف يوم / شفت 12 ساعة)
          if (mappedFieldIndices['shiftHalf12'] === undefined) {
            const found = normalizedHeaders.find(nh => {
              if (nh.index === idColIndex || mappedColIndices.has(nh.index)) return false;
              const norm = nh.normalized;
              return norm.includes('نصف') || 
                     norm.includes('halfday') || 
                     norm.includes('halfdays');
            });
            if (found) {
              mappedFieldIndices['shiftHalf12'] = found.index;
              mappedColIndices.add(found.index);
            }
          }

          if (Object.keys(mappedFieldIndices).length === 0) {
            showToast(
              language === 'ar'
                ? 'عذراً، لم نتمكن من العثور على أي حقول محاسبية متغيرة لمطابقتها في الملف (مثل أيام الدوام، الاستدعاءات، العلاوات، الاستقطاعات... إلخ)'
                : 'Could not find any fluctuating dynamic monthly column headers to map!',
              'error'
            );
            return;
          }

          let updatedCount = 0;
          const updatedEmployees = employees.map(emp => {
            // Find row matching this employee
            const rowMatch = sheetRows.slice(1).find(row => {
              if (!row || row.length === 0) return false;
              const rawId = row[idColIndex] !== undefined ? String(row[idColIndex]).replace(/['"]/g, '').trim() : '';
              if (!rawId) return false;

              const cleanedRawId = String(rawId).trim();
              const cleanedEmpId = String(emp.id).trim();
              const cleanedEmpCode = emp.employeeCode ? String(emp.employeeCode).trim() : '';

              // 1. Direct ID matches
              if (cleanedEmpId.toLowerCase() === cleanedRawId.toLowerCase()) return true;
              if (cleanedEmpCode.toLowerCase() === cleanedRawId.toLowerCase()) return true;

              // 2. Numeric-only comparison (handles string "237" matching number 237)
              const numericRawId = cleanedRawId.replace(/\D/g, '');
              const numericEmpId = cleanedEmpId.replace(/\D/g, '');
              const numericEmpCode = cleanedEmpCode.replace(/\D/g, '');

              if (numericRawId) {
                if (numericRawId === numericEmpId) return true;
                if (numericRawId === numericEmpCode) return true;
              }

              return false;
            });

            if (rowMatch) {
              updatedCount++;
              const updatedEmp = { ...emp };

              // Update ONLY the dynamic monthly variables that were detected in the Excel spreadsheet
              // Crucial Safety Lock: We NEVER touch name, basicSalary, position, or department contracts.
              Object.entries(mappedFieldIndices).forEach(([field, colIdx]) => {
                let cellVal: any = undefined;
                
                if (Array.isArray(rowMatch)) {
                  if (colIdx !== undefined && colIdx < rowMatch.length) {
                    cellVal = rowMatch[colIdx];
                  }
                } else if (rowMatch && typeof rowMatch === 'object') {
                  const originalHeaderName = headerRow[colIdx];
                  if (originalHeaderName && rowMatch[originalHeaderName] !== undefined) {
                    cellVal = rowMatch[originalHeaderName];
                  } else {
                    const normalizedTarget = normalizeString(originalHeaderName);
                    const foundKey = Object.keys(rowMatch).find(k => normalizeString(k) === normalizedTarget);
                    if (foundKey) {
                      cellVal = rowMatch[foundKey];
                    }
                  }
                }

                // Support direct dynamic key detection fallback for deductionDays as requested
                if (field === 'deductionDays' && (cellVal === null || cellVal === undefined)) {
                  const keysToCheck = [
                    "استقطاع أيام", "استقطاع ايام", "أيام الاستقطاع", "غياب أيام", "غيابات",
                    "استقطاع الأيام", "استقطاع الايام", "أيام الاستقطاع", "ايام الاستقطاع", "أيام استقطاع", "ايام استقطاع",
                    "استقطاعات أيام", "استقطاعات ايام", "استقطاعات الأيام", "استقطاعات الايام", "أيام الاستقطاعات", "ايام الاستقطاعات",
                    "خصم أيام", "خصم ايام", "خصم الأيام", "خصم الايام", "أيام الخصم", "ايام الخصم", "أيام خصم", "ايام خصم",
                    "غياب أيام", "غياب ايام", "أيام الغياب", "ايام الغياب"
                  ];
                  if (Array.isArray(rowMatch)) {
                    keysToCheck.forEach(k => {
                      const normK = normalizeString(k);
                      const colIdxForK = headerRow.findIndex(h => normalizeString(h) === normK);
                      if (colIdxForK !== -1 && colIdxForK < rowMatch.length) {
                        cellVal = rowMatch[colIdxForK];
                      }
                    });
                  } else if (rowMatch && typeof rowMatch === 'object') {
                    for (const k of keysToCheck) {
                      if (rowMatch[k] !== undefined) {
                        cellVal = rowMatch[k];
                        break;
                      }
                    }
                  }
                }

                // Support direct dynamic key detection fallback for allowanceExtraDays
                if (field === 'allowanceExtraDays' && (cellVal === null || cellVal === undefined)) {
                  const keysToCheck = [
                    "إضافي أيام", "إضافي ايام", "أيام إضافية", "ايام اضافية",
                    "إضافي الأيام", "إضافي الايام", "الاضافي ايام", "الاضافي أيام", "الاضافي الأيام", "الاضافي الايام",
                    "أيام إضافية", "ايام اضافية", "أيام اضافيه", "ايام اضافيه", "أيام إضافي", "ايام اضافي", "اضافي أيام", "اضافي ايام"
                  ];
                  if (Array.isArray(rowMatch)) {
                    keysToCheck.forEach(k => {
                      const normK = normalizeString(k);
                      const colIdxForK = headerRow.findIndex(h => normalizeString(h) === normK);
                      if (colIdxForK !== -1 && colIdxForK < rowMatch.length) {
                        cellVal = rowMatch[colIdxForK];
                      }
                    });
                  } else if (rowMatch && typeof rowMatch === 'object') {
                    for (const k of keysToCheck) {
                      if (rowMatch[k] !== undefined) {
                        cellVal = rowMatch[k];
                        break;
                      }
                    }
                  }
                }

                // Support direct dynamic key detection fallback for shiftHalf12 (Half Days)
                if (field === 'shiftHalf12' && (cellVal === null || cellVal === undefined)) {
                  const keysToCheck = [
                    "عدد نصف يوم", "نصف يوم", "نصف اليوم", "شفت نصف شفت", "نصف شفت", "شفت 12", "12 ساعة", "12h"
                  ];
                  if (Array.isArray(rowMatch)) {
                    keysToCheck.forEach(k => {
                      const normK = normalizeString(k);
                      const colIdxForK = headerRow.findIndex(h => normalizeString(h) === normK);
                      if (colIdxForK !== -1 && colIdxForK < rowMatch.length) {
                        cellVal = rowMatch[colIdxForK];
                      }
                    });
                  } else if (rowMatch && typeof rowMatch === 'object') {
                    for (const k of keysToCheck) {
                      if (rowMatch[k] !== undefined) {
                        cellVal = rowMatch[k];
                        break;
                      }
                    }
                  }
                }

                // Support direct dynamic key detection fallback for shiftMiddle
                if (field === 'shiftMiddle' && (cellVal === null || cellVal === undefined)) {
                  const keysToCheck = [
                    "شفت وسطي", "وسطي", "شفت وسطى", "وسطى", "الوسطى", "الوسطي",
                    "شفتات وسطي", "شفتات وسطية", "شفتات وسطى", "الشفت الوسطي", "الشفت الوسطى", "وسطيه", "شفت وسطيه",
                    "middle shift", "shiftmiddle", "middle"
                  ];
                  if (Array.isArray(rowMatch)) {
                    keysToCheck.forEach(k => {
                      const normK = normalizeString(k);
                      const colIdxForK = headerRow.findIndex(h => normalizeString(h) === normK);
                      if (colIdxForK !== -1 && colIdxForK < rowMatch.length) {
                        cellVal = rowMatch[colIdxForK];
                      }
                    });
                  } else if (rowMatch && typeof rowMatch === 'object') {
                    for (const k of keysToCheck) {
                      if (rowMatch[k] !== undefined) {
                        cellVal = rowMatch[k];
                        break;
                      }
                    }
                  }
                }

                if (cellVal !== null && cellVal !== undefined && String(cellVal).trim() !== '') {
                  // Highly robust numeric parser for cell values (ignores quotes, spaces, currency symbols, and text suffixes like "يوم")
                  const rawStr = String(cellVal).trim();
                  const cleanedStr = rawStr.replace(/['"]/g, '').replace(/,/g, '').trim();
                  let parsedVal = Number(cleanedStr);
                  if (isNaN(parsedVal)) {
                    const numMatch = cleanedStr.match(/[-+]?[0-9]*\.?[0-9]+/);
                    if (numMatch) {
                      parsedVal = parseFloat(numMatch[0]);
                    }
                  }
                  if (!isNaN(parsedVal)) {
                    updatedEmp[field as FieldId] = parsedVal;
                  }
                }
              });

              return updatedEmp;
            }

            return emp;
          });

          if (updatedCount > 0) {
            onSaveEmployees(updatedEmployees);
            
            const detectedFieldLabels = Object.keys(mappedFieldIndices).map(fId => {
              return language === 'ar' ? getFieldLabel(fId as FieldId) : fId;
            });
            const colListStr = detectedFieldLabels.join(', ');

            showToast(
              language === 'ar' 
                ? `تم بنجاح مطابقة وتحديث ${updatedCount} كادر وتحديث المتغيرات التالية فوراً: (${colListStr})` 
                : `Successfully matched & updated ${updatedCount} staff members. Dynamically updated variables: (${colListStr})`,
              'success'
            );
          } else {
            showToast(
              language === 'ar' 
                ? 'مستند Excel سليم، ولكن لم يتم العثور على أي كود أو رقم معرف للموظفين يطابق الأسماء المسجلة!' 
                : 'Excel parsed successfully, but no matching Employee IDs/Codes found in the database.',
              'info'
            );
          }
        }
      } catch (err) {
        showToast(language === 'ar' ? 'فشل معالجة الكشف، يرجى التأكد من المرفقات والترويسة!' : 'Critical error parsing document.', 'error');
        console.error(err);
      }
    };

    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  // Helper inside component to get localized/renamed field titles
  const getFieldLabel = (fId: FieldId) => {
    return customFieldLabels[fId] || FIELDS_METADATA.find((m) => m.id === fId)?.label || fId;
  };

  const isReadOnly = userRole === 'DataEntry';

  const selectedDept = departments.find((d) => d.id === formDeptId);
  const isFormManager = formPosition && (formPosition.includes('مدير') || formPosition.includes('Manager'));
  const isSalaryLocked = !!selectedDept && !isFormManager && (selectedDept.salaryType === 'fixed' || selectedDept.salaryType === 'lumpSum' || !!selectedDept.isLumpSum);

  // Increments or decrements a single dynamic employee field inline
  const handleUpdateEmployeeSingleField = (empId: string, fieldId: FieldId, increment: number) => {
    const updated = employees.map((emp) => {
      if (emp.id === empId) {
        let currentVal = emp[fieldId] !== undefined ? (emp[fieldId] as number) : 0;
        let newVal = currentVal + increment;
        if (newVal < 0 && fieldId !== 'previousMonthOver') {
          newVal = 0;
        }
        if (fieldId === 'workingDays') {
          newVal = Math.min(30, newVal);
          return {
            ...emp,
            workingDays: newVal,
            workingHours: newVal * 8,
          };
        }
        return {
          ...emp,
          [fieldId]: newVal,
        };
      }
      return emp;
    });
    onSaveEmployees(updated);
  };

  // Direct manual set of a single dynamic employee field inline
  const handleSetEmployeeSingleField = (empId: string, fieldId: FieldId, valStr: string) => {
    let newVal = parseFloat(valStr);
    if (isNaN(newVal)) newVal = 0;
    if (newVal < 0 && fieldId !== 'previousMonthOver') {
      newVal = 0;
    }
    if (fieldId === 'workingDays') {
      newVal = Math.min(30, newVal);
      const updated = employees.map((emp) => {
        if (emp.id === empId) {
          return {
            ...emp,
            workingDays: newVal,
            workingHours: newVal * 8,
          };
        }
        return emp;
      });
      onSaveEmployees(updated);
      return;
    }
    const updated = employees.map((emp) => {
      if (emp.id === empId) {
        return {
          ...emp,
          [fieldId]: newVal,
        };
      }
      return emp;
    });
    onSaveEmployees(updated);
  };

  // Resets dynamic attributes of all employees to draft a fresh month
  const handleResetAllEntries = () => {
    if (selectedDeptFilter && selectedDeptFilter !== 'all') {
      setResetTargetType('single');
      setResetTargetDeptId(selectedDeptFilter);
    } else {
      setResetTargetType('all');
      if (departments.length > 0) {
        setResetTargetDeptId(departments[0].id);
      }
    }
    setShowResetConfirm(true);
  };

  const confirmResetAllEntries = () => {
    let affectedCount = 0;
    const updated = employees.map((emp) => {
      const isTarget = resetTargetType === 'all' || emp.departmentId === resetTargetDeptId;
      if (isTarget) {
        affectedCount++;
        return {
          ...emp,
          workingDays: 0, // Default 0 as requested
          workingHours: 0,
          shiftMorning: 0,
          shiftEvening: 0,
          shiftMiddle: 0,
          shiftFull24: 0,
          shiftHalf12: 0,
          shiftKhafar: 0,
          callouts: 0, // Reset callouts to 0 for a fresh month as requested
          allowanceDanger: 0,
          allowanceMarriage: 0,
          allowanceChildren: 0,
          allowanceDegree: 0,
          allowanceExtraDays: 0,
          allowanceExtraHours: 0,
          allowanceGeneral: 0,
          allowanceEsnad: 0,
          allowanceCustom1: 0,
          allowanceCustom2: 0,
          allowanceCustom3: 0,
          allowanceCustom4: 0,
          allowanceCustom5: 0,
          deductionDays: 0,
          deductionHours: 0,
          deductionPenalties: 0,
          deductionOther: 0,
          deductionPenaltyCustom1: 0,
          deductionPenaltyCustom2: 0,
          deductionPenaltyCustom3: 0,
          deductionPenaltyCustom4: 0,
          deductionPenaltyCustom5: 0,
          previousMonthOver: 0,
        };
      }
      return emp;
    });

    onSaveEmployees(updated);
    setShowResetConfirm(false);

    if (resetTargetType === 'all') {
      showToast(`تم تصفير كشوفات حضور وتفاصيل هذا الشهر لكافة المنتسبين بنجاح (${affectedCount} موظفاً)!`, 'success');
    } else {
      const deptName = departments.find((d) => d.id === resetTargetDeptId)?.name || 'القسم المحدد';
      showToast(`تم تصفير كشوفات حضور وتفاصيل قسم "${deptName}" بنجاح (${affectedCount} موظفاً)!`, 'success');
    }
  };

  // Find dynamic fields in active selected form department
  const selectedFormDept = departments.find((d) => d.id === formDeptId);

  // Form positions options - filtered based on department positions
  const formPositionsOptions = useMemo(() => {
    if (!selectedFormDept) return [];
    return Array.isArray(selectedFormDept.positions) ? selectedFormDept.positions : [];
  }, [selectedFormDept]);

  // Open form for adding
  const handleOpenAdd = () => {
    if (departments.length === 0) {
      showToast('يرجى أولاً إنشاء قسم واحد على الأقل في تبويب "إعدادات الأقسام والتسعير" قبل إضافة موظفين!', 'error');
      return;
    }
    setEditingEmployee(null);
    setFormName('');
    setFormEmployeeCode(getNextEmployeeCode(employees));
    setFormSequence('');
    setFormIsFingerprintExempt(false);
    setFormIsGovernmentSector(false);
    setFormIsSubjectToSocialSecurity(true);
    setFormHasCustomShift(false);
    setFormCustomStart('08:00');
    setFormCustomEnd('14:00');
    setFormCustomShiftType('fixed');
    setFormCustomShiftSystemOption('s1');
    const firstDept = departments[0];
    setFormDeptId(firstDept.id);
    setFormPosition((Array.isArray(firstDept.positions) && firstDept.positions[0]) || '');
    setFormGender('male');
    setFormCurrency('IQD');
    
    // Auto populate basic salary based on department structure
    if (firstDept.salaryType === 'fixed') {
      setFormBasicSalary(firstDept.fixedSalary || 0);
    } else if (firstDept.salaryType === 'lumpSum' || firstDept.isLumpSum) {
      setFormBasicSalary(firstDept.lumpSumSalary || 0);
    } else {
      setFormBasicSalary(0);
    }

    // Reset fields, default workingDays to 0 as requested
    const initialNums: { [key in FieldId]?: number } = {};
    FIELDS_METADATA.forEach((f) => {
      initialNums[f.id] = 0;
    });
    setNumericInputs(initialNums);
    setIsFormOpen(true);
  };

  // Open form for editing
  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormName(emp.name);
    setFormEmployeeCode(emp.employeeCode || '');
    setFormSequence(emp.sequence !== undefined && emp.sequence !== null ? emp.sequence : '');
    setFormIsFingerprintExempt(!!emp.isFingerprintExempt);
    const isGov = !!emp.isGovernmentSector;
    setFormIsGovernmentSector(isGov);
    if (emp.isSubjectToSocialSecurity !== undefined && emp.isSubjectToSocialSecurity !== null) {
      setFormIsSubjectToSocialSecurity(emp.isSubjectToSocialSecurity);
    } else {
      setFormIsSubjectToSocialSecurity(!isGov);
    }
    setFormHasCustomShift(!!emp.hasCustomShift);
    setFormCustomStart(emp.customStart || '08:00');
    setFormCustomEnd(emp.customEnd || '14:00');
    setFormCustomShiftType(emp.customShiftType || 'fixed');
    setFormCustomShiftSystemOption(emp.customShiftSystemOption || 's1');
    setFormDeptId(emp.departmentId);
    setFormPosition(emp.position);
    setFormGender(emp.gender);
    setFormCurrency(emp.currency || 'IQD');
    
    // Check if department enforces a certain salary, otherwise load employee custom basic salary
    const targetDept = departments.find((d) => d.id === emp.departmentId);
    const isEmpManager = emp.position && (
      emp.position.includes('مدير') || 
      emp.position.includes('مسؤول') || 
      emp.position.includes('رئيس') || 
      emp.position.includes('Manager')
    );
    if (targetDept && isEmpManager) {
      const mgrSal = (targetDept.managerSalary && targetDept.managerSalary > 0)
        ? targetDept.managerSalary
        : ((targetDept.pricing && targetDept.pricing.basicSalary && targetDept.pricing.basicSalary > 0)
            ? targetDept.pricing.basicSalary
            : ((targetDept.pricing && targetDept.pricing.dayPrice && targetDept.pricing.dayPrice > 0)
                ? targetDept.pricing.dayPrice * 30
                : (targetDept.fixedSalary || targetDept.lumpSumSalary || 0)));
      setFormBasicSalary((targetDept.managerSalary && targetDept.managerSalary > 0) ? targetDept.managerSalary : (emp.basicSalary && emp.basicSalary > 0 ? emp.basicSalary : mgrSal));
    } else if (targetDept && targetDept.salaryType === 'fixed') {
      setFormBasicSalary(targetDept.fixedSalary || 0);
    } else if (targetDept && (targetDept.salaryType === 'lumpSum' || targetDept.isLumpSum)) {
      setFormBasicSalary(targetDept.lumpSumSalary || 0);
    } else {
      setFormBasicSalary(emp.basicSalary || 0);
    }

    const inputs: { [key in FieldId]?: number } = {};
    FIELDS_METADATA.forEach((f) => {
      inputs[f.id] = emp[f.id] !== undefined ? emp[f.id] : 0;
    });
    setNumericInputs(inputs);
    setIsFormOpen(true);
  };

  const handleFormPositionChange = (newPos: string) => {
    setFormPosition(newPos);
    const targetDept = departments.find((d) => d.id === formDeptId);
    if (targetDept) {
      const isPosManager = newPos && (
        newPos.includes('مدير') || 
        newPos.includes('مسؤول') || 
        newPos.includes('رئيس') || 
        newPos.includes('Manager')
      );
      if (isPosManager) {
        const mgrSal = (targetDept.managerSalary && targetDept.managerSalary > 0)
          ? targetDept.managerSalary
          : ((targetDept.pricing && targetDept.pricing.basicSalary && targetDept.pricing.basicSalary > 0)
              ? targetDept.pricing.basicSalary
              : ((targetDept.pricing && targetDept.pricing.dayPrice && targetDept.pricing.dayPrice > 0)
                  ? targetDept.pricing.dayPrice * 30
                  : (targetDept.fixedSalary || targetDept.lumpSumSalary || 0)));
        if (mgrSal > 0) {
          setFormBasicSalary(mgrSal);
        }
      } else if (targetDept.salaryType === 'fixed') {
        setFormBasicSalary(targetDept.fixedSalary || 0);
      } else if (targetDept.salaryType === 'lumpSum' || targetDept.isLumpSum) {
        setFormBasicSalary(targetDept.lumpSumSalary || 0);
      }
    }
  };

  // Handle department change in form
  const handleFormDeptChange = (deptId: string) => {
    setFormDeptId(deptId);
    const targetDept = departments.find((d) => d.id === deptId);
    if (targetDept) {
      const nextPos = (Array.isArray(targetDept.positions) && targetDept.positions[0]) || '';
      setFormPosition(nextPos);
      const isPosManager = nextPos && (
        nextPos.includes('مدير') || 
        nextPos.includes('مسؤول') || 
        nextPos.includes('رئيس') || 
        nextPos.includes('Manager')
      );
      if (isPosManager) {
        const mgrSal = (targetDept.managerSalary && targetDept.managerSalary > 0)
          ? targetDept.managerSalary
          : ((targetDept.pricing && targetDept.pricing.basicSalary && targetDept.pricing.basicSalary > 0)
              ? targetDept.pricing.basicSalary
              : ((targetDept.pricing && targetDept.pricing.dayPrice && targetDept.pricing.dayPrice > 0)
                  ? targetDept.pricing.dayPrice * 30
                  : (targetDept.fixedSalary || targetDept.lumpSumSalary || 0)));
        if (mgrSal > 0) {
          setFormBasicSalary(mgrSal);
        }
      } else if (targetDept.salaryType === 'fixed') {
        setFormBasicSalary(targetDept.fixedSalary || 0);
      } else if (targetDept.salaryType === 'lumpSum' || targetDept.isLumpSum) {
        setFormBasicSalary(targetDept.lumpSumSalary || 0);
      } else {
        setFormBasicSalary(0);
      }
    }
  };

  const handleCustomShiftSystemOptionChange = (option: 's1' | 's2' | 's3' | 's4', deptId: string = formDeptId) => {
    setFormCustomShiftSystemOption(option);
    const dept = departments.find(d => d.id === deptId);
    if (dept) {
      if (option === 's1') {
        setFormCustomStart(dept.s1Start || '08:00');
        setFormCustomEnd(dept.s1End || '14:00');
      } else if (option === 's2') {
        setFormCustomStart(dept.s2Start || '14:00');
        setFormCustomEnd(dept.s2End || '20:00');
      } else if (option === 's3') {
        setFormCustomStart(dept.s3Start || '20:00');
        setFormCustomEnd(dept.s3End || '02:00');
      } else if (option === 's4') {
        setFormCustomStart(dept.s4Start || '02:00');
        setFormCustomEnd(dept.s4End || '08:00');
      }
    }
  };

  // Safe input value change
  const handleNumericInputChange = (fieldId: FieldId, valueStr: string) => {
    let val = parseFloat(valueStr) || 0;
    if (val < 0 && fieldId !== 'previousMonthOver') {
      val = 0; // Negative values only allowed for carryover
    }
    if (fieldId === 'workingDays') {
      val = Math.min(30, val); // constraint: workingDays max 30!
    }
    if ((fieldId === 'deductionPenalties' || fieldId.startsWith('deductionPenaltyCustom')) && val > 0 && val < 5000) {
      val = 5000; // minimum floor: starting from 5000 IQD and above
    }
    setNumericInputs((prev) => ({
      ...prev,
      [fieldId]: val,
    }));
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDeptId) return;

    // Clean inputs: set disabled fields to 0
    const targetDept = departments.find((d) => d.id === formDeptId);
    const isFormOperationsDept = targetDept && (targetDept.name?.includes('العمليات') || targetDept.id === 'dept-1780063315310');
    const cleanedNums: { [key in FieldId]: number } = {} as any;

    FIELDS_METADATA.forEach((f) => {
      const isFieldActive = targetDept ? targetDept.enabledFields[f.id] : true;
      let val = isFieldActive ? numericInputs[f.id] || 0 : 0;
      if (f.id === 'workingDays' && isFormOperationsDept) {
        val = 30;
      }
      cleanedNums[f.id] = val;
    });

    if (editingEmployee) {
      // Edit
      const salaryChanged = editingEmployee.basicSalary !== formBasicSalary;
      const updated = employees.map((emp) =>
        emp.id === editingEmployee.id
          ? {
              ...emp,
              name: formName.trim(),
              employeeCode: formEmployeeCode.trim() || undefined,
              sequence: formSequence !== '' ? Number(formSequence) : undefined,
              isFingerprintExempt: formIsFingerprintExempt,
              isGovernmentSector: formIsGovernmentSector,
              isSubjectToSocialSecurity: formIsSubjectToSocialSecurity,
              hasCustomShift: formHasCustomShift,
              customStart: formCustomStart,
              customEnd: formCustomEnd,
              customShiftType: formCustomShiftType,
              customShiftSystemOption: formCustomShiftSystemOption,
              departmentId: formDeptId,
              position: formPosition,
              gender: formGender,
              basicSalary: formBasicSalary,
              currency: formCurrency,
              ...cleanedNums,
            }
          : emp
      );
      onSaveEmployees(updated);

      if (onAddLog) {
        if (salaryChanged) {
          onAddLog({
            actionType: 'SALARY_CHANGE',
            actionTitle: 'تعديل الراتب الأساسي للموظف',
            targetName: `${formName.trim()} (${formPosition})`,
            details: `تعديل الراتب الأساسي من [${editingEmployee.basicSalary.toLocaleString()} د.ع] إلى [${formBasicSalary.toLocaleString()} د.ع]`,
            previousValue: `${editingEmployee.basicSalary.toLocaleString()} د.ع`,
            newValue: `${formBasicSalary.toLocaleString()} د.ع`
          });
        } else {
          onAddLog({
            actionType: 'EMPLOYEE_EDIT',
            actionTitle: 'تحديث سجل وساعات الكادر',
            targetName: `${formName.trim()} (${formPosition})`,
            details: `تحديث حقول وساعات الموظف (${formName.trim()})`,
            previousValue: `الراتب: ${editingEmployee.basicSalary.toLocaleString()} د.ع`,
            newValue: `الراتب: ${formBasicSalary.toLocaleString()} د.ع`
          });
        }
      }
    } else {
      // Create
      const newEmp: Employee = {
        id: `emp-${Date.now()}`,
        name: formName.trim(),
        employeeCode: formEmployeeCode.trim() || undefined,
        sequence: formSequence !== '' ? Number(formSequence) : undefined,
        isFingerprintExempt: formIsFingerprintExempt,
        isGovernmentSector: formIsGovernmentSector,
        isSubjectToSocialSecurity: formIsSubjectToSocialSecurity,
        hasCustomShift: formHasCustomShift,
        customStart: formCustomStart,
        customEnd: formCustomEnd,
        customShiftType: formCustomShiftType,
        customShiftSystemOption: formCustomShiftSystemOption,
        departmentId: formDeptId,
        position: formPosition,
        gender: formGender,
        basicSalary: formBasicSalary,
        currency: formCurrency,
        ...cleanedNums,
      };
      onSaveEmployees([...employees, newEmp]);

      if (onAddLog) {
        onAddLog({
          actionType: 'EMPLOYEE_EDIT',
          actionTitle: 'إضافة موظف جديد وتحديد الراتب',
          targetName: `${formName.trim()} (${formPosition})`,
          details: `إضافة الموظف (${formName.trim()}) وتحديد الراتب الأساسي بقيمة [${formBasicSalary.toLocaleString()} د.ع]`,
          previousValue: 'غير مسجل',
          newValue: `${formBasicSalary.toLocaleString()} د.ع`
        });
      }
    }

    setIsFormOpen(false);
  };

  const handleDeleteEmployee = (id: string) => {
    setEmpIdToDelete(id);
  };

  const confirmDeleteEmployee = () => {
    if (!empIdToDelete || isReadOnly) return;
    const targetEmp = employees.find((e) => e.id === empIdToDelete);
    const updated = employees.filter((e) => e.id !== empIdToDelete);
    onSaveEmployees(updated);
    setEmpIdToDelete(null);

    if (onAddLog && targetEmp) {
      onAddLog({
        actionType: 'EMPLOYEE_EDIT',
        actionTitle: 'حذف موظف من سجّلات النظام',
        targetName: `${targetEmp.name} (${targetEmp.position})`,
        details: `تم حذف الموظف (${targetEmp.name}) وإلغاء سجله من القسم.`,
        previousValue: `راتب أساسي: ${targetEmp.basicSalary.toLocaleString()} د.ع`,
        newValue: 'سجل محذوف'
      });
    }
  };

  // Perform advanced filter, search, and sorting via useMemo
  const processedEmployees = useMemo(() => {
    let result = employees.map((emp) => {
      const dept = departments.find((d) => d.id === emp.departmentId);
      const calculated = payrollList.find((p) => p.employeeId === emp.id) || calculateEmployeePayroll(emp, dept);
      return {
        emp,
        dept,
        calculated,
      };
    });

    // Query Search by Name
    if (searchQuery.trim()) {
      const sq = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.emp.name.toLowerCase().includes(sq) ||
          item.emp.position.toLowerCase().includes(sq) ||
          (item.emp.employeeCode && item.emp.employeeCode.toLowerCase().includes(sq)) ||
          (item.dept && item.dept.name.toLowerCase().includes(sq))
      );
    }

    // Filter by Dept
    if (selectedDeptFilter !== 'all') {
      result = result.filter((item) => item.emp.departmentId === selectedDeptFilter);
    }

    // Sort order
    if (sortBy === 'name') {
      result.sort((a, b) => {
        const seqA = a.emp.sequence !== undefined && a.emp.sequence !== null ? Number(a.emp.sequence) : 999999;
        const seqB = b.emp.sequence !== undefined && b.emp.sequence !== null ? Number(b.emp.sequence) : 999999;
        if (seqA !== seqB) {
          return seqA - seqB;
        }
        return a.emp.name.localeCompare(b.emp.name, 'ar');
      });
    } else if (sortBy === 'salary_desc') {
      result.sort((a, b) => b.calculated.netSalary - a.calculated.netSalary);
    } else if (sortBy === 'salary_asc') {
      result.sort((a, b) => a.calculated.netSalary - b.calculated.netSalary);
    }

    return result;
  }, [employees, departments, payrollList, searchQuery, selectedDeptFilter, sortBy]);

  const gridActiveFields = useMemo(() => {
    if (selectedDeptFilter !== 'all') {
      const dept = departments.find(d => d.id === selectedDeptFilter);
      if (dept) {
        return FIELDS_METADATA.filter(f => dept.enabledFields[f.id]);
      }
    }
    const activeIds = new Set<string>();
    departments.forEach(d => {
      Object.keys(d.enabledFields).forEach(k => {
        if (d.enabledFields[k]) activeIds.add(k);
      });
    });
    if (activeIds.size === 0) {
      return FIELDS_METADATA.filter(f => ['workingDays', 'shiftFull24', 'callouts'].includes(f.id));
    }
    return FIELDS_METADATA.filter(f => activeIds.has(f.id));
  }, [selectedDeptFilter, departments]);

  // Helper to calculate column totals (Grand Total)
  const getColumnTotal = (colId: string) => {
    return processedEmployees.reduce((sum, item) => {
      const { emp, calculated } = item;
      switch (colId) {
        case 'workingDays':
          return sum + (emp.workingDays !== undefined ? emp.workingDays : 0);
        case 'workingHours':
          return sum + (emp.workingHours || 0);
        case 'dayPrice':
          return sum + (calculated.dayPrice || 0);
        case 'hourPrice':
          return sum + (calculated.hourPrice || 0);
        case 'allowanceExtraDays':
          return sum + (calculated.allowanceExtraDaysVal || 0);
        case 'allowanceExtraHours':
          return sum + (calculated.allowanceExtraHoursVal || 0);
        case 'deductionDays':
          return sum + (calculated.deductionDaysVal || 0);
        case 'deductionHours':
          return sum + (calculated.deductionHoursVal || 0);
        case 'shiftMorning_count':
          return sum + (emp.shiftMorning || 0);
        case 'shiftMorning_pay':
          return sum + (calculated.shiftsMorningPay || 0);
        case 'shiftEvening_count':
          return sum + (emp.shiftEvening || 0);
        case 'shiftEvening_pay':
          return sum + (calculated.shiftsEveningPay || 0);
        case 'shiftMiddle_count':
          return sum + (emp.shiftMiddle || 0);
        case 'shiftMiddle_pay':
          return sum + (calculated.shiftsMiddlePay || 0);
        case 'shiftKhafar_count':
          return sum + (emp.shiftKhafar || 0);
        case 'shiftKhafar_pay':
          return sum + (calculated.shiftsKhafarPay || 0);
        case 'shiftFull24_count':
          return sum + (emp.shiftFull24 || 0);
        case 'shiftFull24_pay':
          return sum + (calculated.shiftsFull24Pay || 0);
        case 'shiftHalf12_count':
          return sum + (emp.shiftHalf12 || 0);
        case 'shiftHalf12_pay':
          return sum + (calculated.shiftsHalf12Pay || 0);
        case 'callout_days_count':
          return sum + (emp.callouts || 0);
        case 'callout_pay':
          return sum + (calculated.calloutsPay || 0);
        case 'daily_full_days':
          return sum + (emp.workingDays !== undefined ? emp.workingDays : 0);
        case 'daily_full_pay':
          return sum + (calculated.basicDaysPay || 0);
        case 'daily_half_days_count':
          return sum + (emp.shiftHalf12 || 0);
        case 'daily_half_pay':
          return sum + (calculated.shiftsHalf12Pay || 0);
        case 'allowancesTotal':
          return sum + (calculated.allowanceDangerVal + calculated.allowanceMarriageVal + calculated.allowanceChildrenVal + calculated.allowanceDegreeVal + calculated.allowanceExtraDaysVal + calculated.allowanceExtraHoursVal + calculated.allowanceGeneralVal + calculated.allowanceEsnadVal + calculated.allowanceCustom1Val + calculated.allowanceCustom2Val + calculated.allowanceCustom3Val + calculated.allowanceCustom4Val + calculated.allowanceCustom5Val + (calculated.shiftsMorningPay || 0) + (calculated.shiftsEveningPay || 0) + (calculated.shiftsMiddlePay || 0) + (calculated.shiftsFull24Pay || 0) + (calculated.shiftsHalf12Pay || 0) + (calculated.shiftsKhafarPay || 0) + (calculated.calloutsPay || 0));
        case 'deductionsTotal':
          return sum + (calculated.deductionDaysVal + calculated.deductionHoursVal + calculated.deductionPenaltiesVal + calculated.deductionOtherVal + calculated.deductionPenaltyCustom1Val + calculated.deductionPenaltyCustom2Val + calculated.deductionPenaltyCustom3Val + calculated.deductionPenaltyCustom4Val + calculated.deductionPenaltyCustom5Val);
        case 'basicSalary':
          return sum + (calculated.basicSalary || 0);
        case 'netSalary':
          return sum + (calculated.netSalary || 0);
        default:
          return sum;
      }
    }, 0);
  };

  // Helper inside component to render input pills (Requirement 3: Inline Staff Variables Input Grid)
  const renderInputBadge = (emp: Employee, dept: Department | undefined, fId: FieldId, label: string, stepOverride?: number) => {
    const isFieldActiveInDept = dept ? !!dept.enabledFields[fId] : true;
    if (!isFieldActiveInDept) return null;

    const val = emp[fId] !== undefined ? (emp[fId] as number) : 0;
    const isCurrency = FIELDS_METADATA.find(m => m.id === fId)?.type === 'currency';
    
    // Default steps
    let step = 1;
    if (isCurrency) {
      step = stepOverride || (fId === 'deductionPenalties' || fId.startsWith('deductionPenaltyCustom') ? 5000 : 25000);
    }

    return (
      <div key={fId} className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-lg text-[10.5px] w-fit shadow-inner hover:border-slate-700/80 transition-colors">
        <span className="text-slate-350 font-extrabold select-none whitespace-nowrap text-[10px]">{label}:</span>
        <div className="flex items-center bg-[#070b14] rounded overflow-hidden border border-white/5" dir="ltr">
          <button
            type="button"
            onClick={() => handleUpdateEmployeeSingleField(emp.id, fId, -step)}
            className="w-4.5 h-4.5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer select-none font-black text-[11px]"
            title="تقليل القيمة"
          >
            -
          </button>
          <input
            type="number"
            value={val}
            onChange={(e) => handleSetEmployeeSingleField(emp.id, fId, e.target.value)}
            className="w-11 bg-transparent text-white text-[10.5px] font-black font-mono text-center h-4.5 focus:outline-none p-0 border-none outline-none select-all focus:text-blue-300"
          />
          <button
            type="button"
            onClick={() => handleUpdateEmployeeSingleField(emp.id, fId, step)}
            className="w-4.5 h-4.5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer select-none font-black text-[11px]"
            title="زيادة القيمة"
          >
            +
          </button>
        </div>
      </div>
    );
  };

  // Formatter for Currency
  const formatIQD = (amount: number) => {
    return formatCurrency(amount, language, 'IQD');
  };

  const t = TRANSLATIONS[language];

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Real-time Proactive Budget Ceiling Alerts Banner */}
      {exceededDepartments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-3xl border border-red-500/25 bg-red-950/15 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_12px_24px_-10px_rgba(239,68,68,0.15)] select-none"
        >
          <div className="flex items-center gap-3 w-full">
            <span className="p-2 rounded-2xl bg-red-500/20 text-red-400 animate-pulse text-lg shrink-0">⚠️</span>
            <div className="space-y-1 w-full text-right">
              <h4 className="text-xs font-black text-red-200">
                {language === 'ar' ? 'تنبيه: تجاوز السقف المالي المحدد للأقسام التالية' : 'Alert: Departments Exceeded Assigned Budget Limit'}
              </h4>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                {language === 'ar' 
                  ? `هنالك (${exceededDepartments.length}) أقسام تجاوزت الميزانية المرصودة لها من قبل الإدارة المالية. انقر على أي قسم لفرز كوادرها والتحقق من التفاصيل المسببة للزيادة.`
                  : `There are (${exceededDepartments.length}) departments exceeding their financial budget. Click a department to filter its staff and audit payroll elements.`
                }
              </p>
              {/* List of exceeded departments */}
              <div className="flex flex-wrap gap-2 mt-2">
                {exceededDepartments.map((dept) => {
                  const deptEmps = employees.filter(e => e.departmentId === dept.id);
                  const spent = deptEmps.reduce((acc, emp) => {
                    const calc = payrollList.find(p => p.employeeId === emp.id);
                    return acc + (calc?.netSalary || 0);
                  }, 0);
                  const overflow = spent - (dept.budgetLimit || 0);
                  return (
                    <button 
                      key={dept.id} 
                      onClick={() => setSelectedDeptFilter(dept.id)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-500/10 text-red-300 border border-red-500/20 text-[10px] font-mono cursor-pointer hover:bg-red-500/25 hover:border-red-500/40 transition-all font-bold"
                    >
                      <span className="font-sans">{dept.name}</span>
                      <span className="bg-red-500/20 px-1 py-0.5 rounded text-[8px] font-black">
                        +{formatIQD(overflow)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Department Quick Filter Blocks */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4">
          <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-blue-400" />
            {language === 'ar' ? 'أقسام وشُعب المستشفى (انقر لفلترة وعرض الموظفين والرواتب)' : 'Hospital Departments & Wards (Click to filter employees & salaries)'}
          </h3>
          <div className="flex flex-wrap items-center gap-2 select-none">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10.5px] font-semibold">
              <span className="text-xs text-blue-400">✥</span>
              <span>{language === 'ar' ? 'اسحب وأفلت أي قسم لتغيير ترتيبه فوراً' : 'Drag & drop departments to reorder instantly'}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10.5px] font-semibold">
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              <span>{language === 'ar' ? 'اضغط الصح 🟢 لتمييز كشف الراتب المكتمل' : 'Check 🟢 to mark department payroll completed'}</span>
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 pb-2.5 pt-1" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          {/* All Departments Square card */}
          {(() => {
            const isSelected = selectedDeptFilter === 'all';
            const allVisuals = {
              gradient: 'from-sky-600/25 via-blue-500/10 to-transparent',
              neonGlow: 'rgba(14, 165, 233, 0.45)',
              textColor: 'text-indigo-400',
              pulseType: 'neon' as const,
              showIndicator: true,
              iconRing: 'ring-indigo-500/20',
              iconGlow: 'drop-shadow-[0_0_8px_rgba(99,102,241,0.55)]',
              indicatorColor: 'bg-indigo-400'
            };
            return (
              <motion.button
                type="button"
                onClick={() => setSelectedDeptFilter('all')}
                whileHover={{
                  y: -5,
                  boxShadow: isSelected 
                    ? `0 12px 24px -4px ${allVisuals.neonGlow}, 0 0 16px ${allVisuals.neonGlow}` 
                    : `0 12px 24px -4px rgba(30, 41, 59, 0.4), 0 0 12px ${allVisuals.neonGlow}`,
                  borderColor: isSelected ? 'rgba(59, 130, 246, 0.7)' : 'rgba(255, 255, 255, 0.15)'
                }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                className={`group relative p-3 rounded-2xl flex flex-col items-center justify-center gap-2.5 border text-center transition-all cursor-pointer w-full min-h-[120px] h-auto outline-none overflow-hidden ${
                  isSelected
                    ? 'bg-blue-600/10 border-blue-500/50 text-blue-200 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                    : 'bg-[#0f172a]/30 border-white/5 text-slate-400 hover:bg-[#0f172a]/50'
                }`}
              >
                {/* Glossy radial backdrop glow reflection */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-radial from-indigo-500/5 to-transparent pointer-events-none" />

                {renderAnimatedIcon(Building2, allVisuals)}
                
                <span className="text-[13px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] mt-1.5 select-none whitespace-normal break-words max-w-full text-center leading-tight bg-[#2d3748] px-4 py-1.5 rounded-full border-2 border-slate-600 shadow-[0_2px_8px_rgba(0,0,0,0.3)] md:text-[13.5px] w-full max-w-[95%] min-h-[28px] flex items-center justify-center font-sans tracking-wide">
                  كافة الأقسام
                </span>
                
                {/* Crew capsule badge selection highlighted */}
                <div className={`mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider flex items-center gap-1.5 transition-all duration-300 ${
                  isSelected 
                    ? 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-400/30 shadow-[0_0_8px_rgba(59,130,246,0.25)]' 
                    : 'bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-slate-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${allVisuals.indicatorColor} ${isSelected ? 'animate-pulse' : ''}`} />
                  <span>{employees.length} {language === 'ar' ? 'كادر' : 'Staff'}</span>
                </div>
              </motion.button>
            );
          })()}

          {departments.map((dept) => {
            const itemIcon = dept.iconIndex !== undefined ? DEPT_ICON_TEMPLATES[dept.iconIndex] : null;
            const IconComponent = itemIcon ? itemIcon.icon : Building2;
            const deptEmps = employees.filter(e => e.departmentId === dept.id);
            const isSelected = selectedDeptFilter === dept.id;
            const visuals = getDeptVisuals(dept.name, dept.iconIndex);
            
            // Calculate budget ceiling info
            const spent = payrollList
              .filter(p => p.employeeId && deptEmps.some(e => e.id === p.employeeId))
              .reduce((sum, p) => sum + p.netSalary, 0);
            const isOverBudget = !!dept.budgetLimit && dept.budgetLimit > 0 && spent > dept.budgetLimit;

            return (
              <motion.div
                key={dept.id}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (isDraggingId === dept.id) return;
                    setSelectedDeptFilter(dept.id);
                  }
                }}
                layout
                drag={!!onSaveDepartments}
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={1}
                dragTransition={{ bounceStiffness: 600, bounceDamping: 25 }}
                onDragStart={() => setIsDraggingId(dept.id)}
                onDragEnd={() => {
                  setTimeout(() => {
                    setIsDraggingId(null);
                  }, 50);
                }}
                onDrag={(_, info) => {
                  if (!onSaveDepartments) return;
                  const x = info.point.x;
                  const y = info.point.y;
                  const elements = document.querySelectorAll('[data-dept-id]');
                  for (let i = 0; i < elements.length; i++) {
                    const el = elements[i];
                    const targetId = el.getAttribute('data-dept-id');
                    if (!targetId || targetId === dept.id) continue;
                    
                    const rect = el.getBoundingClientRect();
                    if (
                      x >= rect.left &&
                      x <= rect.right &&
                      y >= rect.top &&
                      y <= rect.bottom
                    ) {
                      const activeIndex = departments.findIndex(d => d.id === dept.id);
                      const targetIndex = departments.findIndex(d => d.id === targetId);
                      if (activeIndex !== -1 && targetIndex !== -1) {
                        const newDepts = [...departments];
                        const temp = newDepts[activeIndex];
                        newDepts[activeIndex] = newDepts[targetIndex];
                        newDepts[targetIndex] = temp;
                        onSaveDepartments(newDepts);
                      }
                      break;
                    }
                  }
                }}
                data-dept-id={dept.id}
                onClick={() => {
                  if (isDraggingId === dept.id) return;
                  setSelectedDeptFilter(dept.id);
                }}
                whileHover={{
                  y: -5,
                  boxShadow: isSelected 
                    ? `0 12px 24px -4px ${visuals.neonGlow}, 0 0 16px ${visuals.neonGlow}` 
                    : dept.isPayrollCompleted 
                      ? '0 12px 24px -4px rgba(16, 185, 129, 0.45), 0 0 16px rgba(16, 185, 129, 0.35)'
                      : `0 12px 24px -4px rgba(30, 41, 59, 0.4), 0 0 12px ${visuals.neonGlow}`,
                  borderColor: isOverBudget 
                    ? 'rgba(239, 68, 68, 0.6)' 
                    : isSelected 
                      ? 'rgba(59, 130, 246, 0.7)' 
                      : dept.isPayrollCompleted 
                        ? 'rgba(16, 185, 129, 0.6)' 
                        : 'rgba(255, 255, 255, 0.15)'
                }}
                whileTap={{ scale: 0.97 }}
                whileDrag={{
                  scale: 1.06,
                  zIndex: 50,
                  boxShadow: '0 25px 35px -5px rgba(0, 0, 0, 0.75), 0 0 30px rgba(59, 130, 246, 0.7)',
                  filter: 'brightness(1.15)',
                  cursor: 'grabbing'
                }}
                transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                className={`group relative p-3 pt-8 pb-3.5 rounded-2xl flex flex-col items-center justify-center gap-2.5 border text-center transition-all cursor-grab active:cursor-grabbing w-full min-h-[135px] h-auto outline-none overflow-hidden select-none touch-none ${
                  isOverBudget
                    ? isSelected
                      ? 'bg-red-950/20 border-red-500/50 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.25)]'
                      : 'bg-[#1e1111]/30 border-red-500/20 text-red-400 hover:bg-[#2a1b1b]/40'
                    : isSelected
                      ? 'bg-blue-600/10 border-blue-500/50 text-blue-200 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                      : dept.isPayrollCompleted
                        ? 'bg-emerald-950/10 border-emerald-500/30 text-emerald-205 shadow-[0_0_12px_rgba(16,185,129,0.1)] hover:bg-emerald-950/15'
                        : 'bg-[#0f172a]/30 border-white/5 text-slate-400 hover:bg-[#0f172a]/50'
                }`}
              >
                {/* Floating department controls: Reordering & Complete marker */}
                {onSaveDepartments && (
                  <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 z-30 select-none">
                    {/* Reorder Arrows (forward: left card in layout, which is index - 1 in RTL order) */}
                    <div className="flex items-center gap-1" dir="ltr">
                      <button
                        type="button"
                        disabled={departments.indexOf(dept) === 0}
                        onClick={(e) => handleMoveDepartment(dept.id, 'forward', e)}
                        className={`p-1 rounded-lg transition-all ${
                          departments.indexOf(dept) === 0
                            ? 'opacity-20 cursor-not-allowed text-slate-600'
                            : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-white/5 active:scale-90 shadow-lg'
                        }`}
                        title={language === 'ar' ? 'تقديم الترتيب' : 'Move up in list'}
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={departments.indexOf(dept) === departments.length - 1}
                        onClick={(e) => handleMoveDepartment(dept.id, 'backward', e)}
                        className={`p-1 rounded-lg transition-all ${
                          departments.indexOf(dept) === departments.length - 1
                            ? 'opacity-20 cursor-not-allowed text-slate-600'
                            : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-white/5 active:scale-90 shadow-lg'
                        }`}
                        title={language === 'ar' ? 'تأخير الترتيب' : 'Move down in list'}
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Checkmark complete flag */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleDepartmentCompleted(dept.id, e)}
                      className={`p-1 rounded-full transition-all duration-300 shadow-md ${
                        dept.isPayrollCompleted
                          ? 'bg-emerald-500/35 text-emerald-300 hover:bg-emerald-555 border border-emerald-400/30 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                          : 'bg-slate-900/95 text-slate-500 hover:text-slate-300 hover:bg-slate-800 border border-white/5'
                      }`}
                      title={
                        dept.isPayrollCompleted
                          ? (language === 'ar' ? 'إلغاء تعيين الراتب كمكتمل' : 'Mark salary as incomplete')
                          : (language === 'ar' ? 'تعيين الراتب كمكتمل بالكامل' : 'Mark salary as complete')
                      }
                    >
                      <CheckCircle className={`w-3.5 h-3.5 ${dept.isPayrollCompleted ? 'fill-emerald-400/20 text-emerald-300' : ''}`} />
                    </button>
                  </div>
                )}

                {/* Floating over budget alert badge */}
                {isOverBudget && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white hover:scale-110 transition-transform select-none shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-bounce" title="متجاوز السقف المالي">
                    !
                  </span>
                )}

                {/* Glossy radial backdrop glow reflection */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-radial from-${isOverBudget ? 'red-500' : visuals.textColor.replace('#', '')}/5 to-transparent pointer-events-none`} />

                {renderAnimatedIcon(IconComponent, isOverBudget ? { ...visuals, textColor: 'text-red-400', neonGlow: 'rgba(239, 68, 68, 0.45)', indicatorColor: 'bg-red-500', pulseType: 'blink' as const } : visuals)}
                
                <span className="text-[13px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] mt-1.5 select-none whitespace-normal break-words max-w-full text-center leading-tight bg-[#2d3748] px-4 py-1.5 rounded-full border-2 border-slate-600 shadow-[0_2px_8px_rgba(0,0,0,0.3)] md:text-[13.5px] w-full max-w-[95%] min-h-[28px] flex items-center justify-center font-sans tracking-wide">
                  {dept.name}
                </span>
                
                {/* Crew capsule badge selection highlighted */}
                <div className="mt-1 flex items-center justify-center gap-1.5 flex-wrap">
                  <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider flex items-center gap-1.5 transition-all duration-300 ${
                    isOverBudget
                      ? 'bg-red-500/10 text-red-400 ring-1 ring-red-400/20'
                      : isSelected 
                        ? 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-400/30 shadow-[0_0_8px_rgba(59,130,246,0.25)]' 
                        : dept.isPayrollCompleted
                          ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/25 shadow-[0_0_6px_rgba(16,185,129,0.15)]'
                          : 'bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-slate-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isOverBudget ? 'bg-red-500' : dept.isPayrollCompleted ? 'bg-emerald-400' : visuals.indicatorColor} ${isSelected || isOverBudget || dept.isPayrollCompleted ? 'animate-pulse' : ''}`} />
                    <span>{deptEmps.length} {language === 'ar' ? 'كادر' : 'Staff'}</span>
                  </div>

                  {dept.isPayrollCompleted && (
                    <div className="px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 bg-emerald-500/20 text-emerald-350 ring-1 ring-emerald-405/20 shadow-[0_0_8px_rgba(16,185,129,0.2)] animate-fade-in">
                      <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                      <span>{language === 'ar' ? 'مكتمل' : 'Done'}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Real-time Budget Limit warning message */}
      {(() => {
        // If a specific department is selected
        if (selectedDeptFilter !== 'all') {
          const dept = departments.find(d => d.id === selectedDeptFilter);
          if (dept && dept.budgetLimit && dept.budgetLimit > 0) {
            const deptEmps = employees.filter(e => e.departmentId === dept.id);
            const spent = payrollList
              .filter(p => p.employeeId && deptEmps.some(e => e.id === p.employeeId))
              .reduce((sum, p) => sum + p.netSalary, 0);
            
            if (spent > dept.budgetLimit) {
              const diff = spent - dept.budgetLimit;
              return (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-red-200 text-xs shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 animate-pulse">
                      <ShieldAlert className="w-5 h-5" />
                    </span>
                    <div className="space-y-0.5 text-right">
                      <p className="font-bold text-sm text-red-300">
                        تنبيه مالي: لقد تجاوزت السقف المالي المحدد لقسم ({dept.name})!
                      </p>
                      <p className="text-[11px] text-slate-400">
                        ميزانية القسم المحددة هي {dept.budgetLimit.toLocaleString('en-US')} د.ع بينما مجموع الرواتب الفعلي الحالي يبلغ {spent.toLocaleString('en-US')} د.ع.
                      </p>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <span className="font-sans text-[10px] text-slate-400 block">مبلغ التجاوز:</span>
                    <span className="font-mono font-black text-red-400 text-sm">+{diff.toLocaleString('en-US')} د.ع</span>
                  </div>
                </motion.div>
              );
            }
          }
        } else {
          // If all is selected, list any departments that have gone over their ceilings
          const overDepts = departments.filter(d => {
            if (!d.budgetLimit || d.budgetLimit <= 0) return false;
            const deptEmps = employees.filter(e => e.departmentId === d.id);
            const spent = payrollList
              .filter(p => p.employeeId && deptEmps.some(e => e.id === p.employeeId))
              .reduce((sum, p) => sum + p.netSalary, 0);
            return spent > d.budgetLimit;
          });

          if (overDepts.length > 0) {
            return (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl space-y-3 shadow-[0_0_15px_rgba(239,68,68,0.1)] text-right"
              >
                <div className="flex items-center gap-2.5 text-red-200">
                  <span className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 animate-pulse">
                    <ShieldAlert className="w-5 h-5" />
                  </span>
                  <div>
                    <p className="font-bold text-sm text-red-300">تنبيه مالي: لقد تجاوزت السقف المالي في بعض الأقسام!</p>
                    <p className="text-[11px] text-slate-400">يرجى مراجعة ميزانيات الأقسام التالية لتعديل الرواتب أو زيادة السقف المالي:</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {overDepts.map(d => {
                    const deptEmps = employees.filter(e => e.departmentId === d.id);
                    const spent = payrollList
                      .filter(p => p.employeeId && deptEmps.some(e => e.id === p.employeeId))
                      .reduce((sum, p) => sum + p.netSalary, 0);
                    const diff = spent - (d.budgetLimit || 0);
                    return (
                      <div key={d.id} className="p-2.5 bg-slate-950/40 border border-red-500/10 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-200">{d.name}</p>
                          <p className="text-[10px] text-slate-500">حجم التجاوز: +{diff.toLocaleString('en-US')} د.ع</p>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 font-bold font-sans text-[9px] border border-red-500/15 animate-pulse">
                          متجاوز!
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          }
        }
        return null;
      })()}

      {/* Top Banner Search / Sorting Row */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xl">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
          {/* Quick Real-time Search */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              id="emp-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث الذكي بالاسم، القسم أو المنصب..."
              className="w-full pr-10 pl-4 py-2 glass-input border border-white/10 rounded-xl text-white placeholder-slate-500 text-xs transition-all animate-pulse-subtle"
            />
          </div>

          {/* Department Filter Selector */}
          <select
            id="emp-dept-filter"
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="px-3 py-2 glass-input border border-white/10 rounded-xl text-slate-300 text-xs max-w-xs focus:outline-none focus:border-blue-500"
          >
            <option value="all">كافة الأقسام والشعب</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>



        {/* Sorting Buttons & Options */}
        <div className="flex gap-2 flex-wrap shrink-0">
          <button
            id="sort-name"
            onClick={() => setSortBy('name')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-all ${
              sortBy === 'name'
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                : 'bg-slate-900 border border-slate-700 text-slate-400 font-sans'
            }`}
          >
            أبجدياً [أ-ي]
          </button>
          <button
            id="sort-sal-desc"
            onClick={() => setSortBy('salary_desc')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-all ${
              sortBy === 'salary_desc'
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                : 'bg-slate-900 border border-slate-700 text-slate-400 font-sans'
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            الراتب الأعلى
          </button>
          <button
            id="sort-sal-asc"
            onClick={() => setSortBy('salary_asc')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-all ${
              sortBy === 'salary_asc'
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                : 'bg-slate-900 border border-slate-700 text-slate-400 font-sans'
            }`}
          >
            الراتب الأقل
          </button>

          {!isReadOnly && (
            <button
              id="reset-entries-btn"
              onClick={handleResetAllEntries}
              className="px-3 py-1.5 bg-red-600/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-all focus:outline-none"
              title="تصفير كشوفات هذا الشهر للبدء من جديد"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              تصفير الشهر الجديد 🧹
            </button>
          )}

          <button
            id="add-emp-btn"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-blue-650 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer outline-none"
          >
            <UserPlus className="w-4 h-4" />
            إضافة موظف جديد
          </button>
        </div>
      </div>

      {/* Excel Automation Hub Card */}
      <div className="glass-panel rounded-2xl p-5 border border-white/10 shadow-emerald-550/5 shadow-2xl relative overflow-hidden bg-slate-900/60">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500" />
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              الربط الذكي ومزامنة الحضور والرواتب مع Excel
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed max-w-3xl">
              قم بتصدير نموذج الكشف الذكي لقسم <strong className="text-emerald-400 font-bold">({selectedDeptFilter === 'all' ? 'كافة الأقسام والشُعب' : (departments.find(d => d.id === selectedDeptFilter)?.name || 'القسم المُعرّف')})</strong> ليقوم المحاسب بملئها على Excel، وتحديث أيام الحضور، الساعات الإضافية، الاستدعاءات، الورديات، والعلاوات أو الخصومات والرفع مباشرة لتحديث رواتب الكادر دون أي تضارب!
            </p>
          </div>
          
          <div className="flex items-center gap-2.5 flex-wrap shrink-0 w-full lg:w-auto">
            {/* Export CSV button */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-4 py-2 bg-emerald-600/15 text-emerald-300 hover:text-emerald-100 hover:bg-emerald-600/25 border border-emerald-500/25 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all outline-none cursor-pointer focus:ring-1 focus:ring-emerald-400"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              تصدير كشف القسم إلى Excel
            </button>

            {/* Import file upload */}
            <label className="flex items-center">
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleImportExcel}
                className="hidden"
              />
              <span className="px-4 py-2 bg-indigo-600/15 text-indigo-300 hover:text-indigo-100 hover:bg-indigo-600/25 border border-indigo-500/25 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all outline-none cursor-pointer focus:ring-1 focus:ring-indigo-400 select-none">
                <RefreshCw className="w-4 h-4 text-indigo-400 animate-pulse" />
                استيراد وتحديث الكشف (Import)
              </span>
            </label>
          </div>
        </div>
      </div>

      {isReadOnly && (
        <div className="bg-amber-500/10 border border-amber-500/15 text-amber-200 rounded-xl p-3 text-[11px] flex gap-2 items-start mb-2 animate-scale-up">
          <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <span className="font-semibold">حساب مدخل بيانات نشط:</span> لديك الصلاحية الكاملة لتعديل ساعات وأيام دوام الموظفين، شفتاتهم، الغيابات، والجزاءات. مع ذلك، لا يمكنك تعديل البنية المالية والأسعار أو الرواتب الأساسية في القسم.
          </div>
        </div>
      )}

      {/* Main Roster Table */}
      <div className="glass-panel w-full rounded-2.5xl overflow-hidden shadow-xl animate-scale-up border border-white/5">
        {processedEmployees.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs flex flex-col items-center justify-center space-y-3">
            <Users className="w-12 h-12 text-slate-700" />
            <p>لم يتم العثور على أي موظفين يطابقون خيارات البحث والفرز.</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar relative w-full">
            <table className={`w-full border-collapse ${language === 'ar' ? 'text-right' : 'text-left'} table-fixed text-[11px] sm:text-xs md:text-sm`}>
              <thead className="sticky top-0 bg-[#080d1a]/95 backdrop-blur-md z-20 border-b border-white/10 shadow-md">
                <tr>
                  <th style={{ width: '4%' }} className="p-4 text-center text-amber-500 font-extrabold text-[12px] sm:text-[14px] bg-[#0f1a36] border-b border-blue-500/30 select-none min-w-[50px] border-r border-[#ffffff]/5">
                    {language === 'ar' ? 'ت' : '#'}
                  </th>
                  <th style={{ width: '18%' }} className={`p-4 text-blue-100 font-extrabold text-[14px] sm:text-[15.5px] bg-[#0f1a36] border-b border-blue-500/30 select-none min-w-[280px] ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    {language === 'ar' ? 'اسم الموظف' : 'Employee Name'}
                  </th>
                  {visibleColumns.map(col => {
                    const hasStepper = !!getEditableFieldForColumn(col.id);
                    const isPayCol = col.id === 'basicSalary' || col.id === 'netSalary' || col.id === 'allowancesTotal' || col.id === 'deductionsTotal' || col.id.endsWith('_pay') || col.id === 'callout_pay' || col.id === 'daily_full_pay' || col.id === 'daily_half_pay' || col.id === 'allowanceExtraDays' || col.id === 'allowanceExtraHours' || col.id === 'deductionDays' || col.id === 'deductionHours';
                    const weight = col.id === 'employeeCode' ? 0.9 : (col.id === 'netSalary' ? 2.6 : (isPayCol ? 1.8 : (hasStepper ? 1.4 : 1.0)));
                    const totalWeight = visibleColumns.reduce((sum, c) => {
                      const isC = c.id === 'basicSalary' || c.id === 'netSalary' || c.id === 'allowancesTotal' || c.id === 'deductionsTotal' || c.id.endsWith('_pay') || c.id === 'callout_pay' || c.id === 'daily_full_pay' || c.id === 'daily_half_pay' || c.id === 'allowanceExtraDays' || c.id === 'allowanceExtraHours' || c.id === 'deductionDays' || c.id === 'deductionHours';
                      const hasS = !!getEditableFieldForColumn(c.id);
                      return sum + (c.id === 'employeeCode' ? 0.9 : (c.id === 'netSalary' ? 2.6 : (isC ? 1.8 : (hasS ? 1.4 : 1.0))));
                    }, 0);
                    const colPercent = (72 * weight) / Math.max(1, totalWeight);
                    const minWidthClass = col.id === 'employeeCode' ? 'min-w-[100px]' : (col.id === 'netSalary' ? 'min-w-[175px]' : (isPayCol ? 'min-w-[145px]' : (hasStepper ? 'min-w-[115px]' : 'min-w-[85px]')));
                    return (
                      <th key={col.id} style={{ width: `${colPercent}%` }} className={`p-2 sm:p-3 border-x border-slate-800 text-[12px] sm:text-[13.5px] font-extrabold text-[#fecdd3] text-center whitespace-normal ${minWidthClass} bg-[#0d172e] border-b border-blue-500/30 select-none`}>
                        {col.label}
                      </th>
                    );
                  })}
                  <th className="p-4 text-slate-100 font-extrabold text-[13.5px] bg-[#0f1a36] border-b border-blue-500/30 text-center select-none w-16">
                    {language === 'ar' ? 'الإجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {processedEmployees.map(({ emp, dept, calculated }, index) => {
                  const isRowOperationsDept = !!(dept && (dept.name?.includes('العمليات') || dept.id === 'dept-1780063315310'));
                  return (
                    <tr key={emp.id} className="hover:bg-slate-800/35 transition-colors odd:bg-[#0c1224]/30 even:bg-[#111931]/15">
                      {/* Row Sequence Index */}
                      <td className="p-3 text-center font-mono font-black text-amber-400 text-[13px] bg-[#020617]/30 border-x border-[#ffffff]/5 min-w-[50px]">
                        {index + 1}
                      </td>

                      {/* Integrated Demographic Name & Variables Logging Cells */}
                      <td className="p-3 max-w-[420px]">
                        <div className="flex flex-col gap-2">
                          
                          {/* Bio and metadata details row */}
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                            {emp.sequence !== undefined && emp.sequence !== null && (
                              <span className="text-[11px] text-emerald-400 font-extrabold bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/30 leading-none shadow-sm" title={`التسلسل الإداري للموظف: ${emp.sequence}`}>
                                ت: {emp.sequence}
                              </span>
                            )}
                            <div className="flex items-center justify-start gap-2 bg-[#020617] border-2 border-slate-750 shadow-lg px-3 py-2 rounded-xl transition-all select-all inline-flex">
                              <span className="text-sm sm:text-[17px] font-black text-white hover:text-blue-300 leading-none">
                                {emp.name}
                              </span>
                            </div>
                            {emp.employeeCode && (
                              <span className="text-[11px] text-cyan-400 font-bold bg-[#083344] px-2 py-1 rounded-lg border border-cyan-500/30 leading-none" title="الرقم الوظيفي">
                                {emp.employeeCode}
                              </span>
                            )}
                            {emp.isFingerprintExempt && (
                              <span className="text-[11px] text-indigo-300 font-bold bg-[#1e1b4b] px-2 py-1 rounded-lg border border-indigo-500/30 leading-none flex items-center gap-1" title="غير خاضع للبصمة">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                                غير خاضع للبصمة
                              </span>
                            )}
                            {emp.hasCustomShift && (
                              <span className="text-[11px] text-amber-300 font-bold bg-[#78350f]/30 px-2 py-1 rounded-lg border border-amber-500/30 leading-none flex items-center gap-1" title={`دوام مخصص: ${emp.customStart} - ${emp.customEnd}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                دوام مخصص: {emp.customStart} - {emp.customEnd}
                              </span>
                            )}
                            <span className="text-[10.5px] text-indigo-300 font-extrabold bg-[#142345] px-2 py-0.5 rounded border border-indigo-500/20 leading-none">{dept ? dept.name : 'مجهول'}</span>
                            <span className="text-[10.5px] text-slate-300 font-medium bg-slate-900 px-2 py-0.5 rounded border border-white/5 leading-none">{emp.position}</span>
                            {emp.basicSalary > 0 && (
                              <span className="text-[11.5px] text-emerald-400 font-bold leading-none whitespace-nowrap">
                                الراتب: <strong className="font-mono text-emerald-400 font-black text-[13px]">{formatCurrency(emp.basicSalary, language, emp.currency)}</strong>
                              </span>
                            )}
                          </div>

                        </div>
                      </td>

                      {/* Outwards Columns matching checklist selections with nested compact change boxes */}
                      {visibleColumns.map(col => {

                        let val: string | number = '-';
                        let styleClass = "border-x border-slate-850/30 text-center font-mono text-[14.5px] font-bold text-slate-300";

                        switch (col.id) {
                          case 'employeeCode':
                            val = emp.employeeCode || '-';
                            styleClass += " text-cyan-400 font-extrabold text-[14px]";
                            break;
                          case 'workingDays':
                            val = isRowOperationsDept ? 30 : (emp.workingDays !== undefined ? emp.workingDays : 0);
                            styleClass += " text-white font-black text-[15.5px]";
                            break;
                          case 'workingHours':
                            val = (isRowOperationsDept ? 30 : (emp.workingDays !== undefined ? emp.workingDays : 0)) * 8;
                            styleClass += " text-white font-black text-[15.5px]";
                            break;
                          case 'dayPrice':
                            val = formatIQD(Math.round(calculated.dayPrice));
                            styleClass += " text-indigo-400 font-black whitespace-nowrap";
                            break;
                          case 'hourPrice':
                            val = formatIQD(Math.round(calculated.hourPrice));
                            styleClass += " text-purple-400 font-black whitespace-nowrap";
                            break;
                          case 'shiftMorning_count':
                            val = emp.shiftMorning !== undefined ? emp.shiftMorning : 0;
                            styleClass += " text-white font-black text-[15.5px]";
                            break;
                          case 'shiftMorning_pay':
                            val = formatIQD(Math.round(calculated.shiftsMorningPay || 0));
                            styleClass += " text-cyan-400 font-bold whitespace-nowrap";
                            break;
                          case 'shiftEvening_count':
                            val = emp.shiftEvening !== undefined ? emp.shiftEvening : 0;
                            styleClass += " text-white font-black text-[15.5px]";
                            break;
                          case 'shiftEvening_pay':
                            val = formatIQD(Math.round(calculated.shiftsEveningPay || 0));
                            styleClass += " text-[#e879f9] font-bold whitespace-nowrap";
                            break;
                          case 'shiftMiddle_count':
                            val = emp.shiftMiddle !== undefined ? emp.shiftMiddle : 0;
                            styleClass += " text-white font-black text-[15.5px]";
                            break;
                          case 'shiftMiddle_pay':
                            val = formatIQD(Math.round(calculated.shiftsMiddlePay || 0));
                            styleClass += " text-amber-400 font-bold whitespace-nowrap";
                            break;
                          case 'shiftKhafar_count':
                            val = emp.shiftKhafar !== undefined ? emp.shiftKhafar : 0;
                            styleClass += " text-white font-black text-[15.5px]";
                            break;
                          case 'shiftKhafar_pay':
                            val = formatIQD(Math.round(calculated.shiftsKhafarPay || 0));
                            styleClass += " text-purple-400 font-bold whitespace-nowrap";
                            break;
                          case 'shiftFull24_count':
                            val = emp.shiftFull24 !== undefined ? emp.shiftFull24 : 0;
                            styleClass += " text-white font-black text-[15.5px]";
                            break;
                          case 'shiftFull24_pay':
                            val = formatIQD(Math.round(calculated.shiftsFull24Pay || 0));
                            styleClass += " text-sky-400 font-bold whitespace-nowrap";
                            break;
                          case 'shiftHalf12_count':
                            val = emp.shiftHalf12 !== undefined ? emp.shiftHalf12 : 0;
                            styleClass += " text-white font-black text-[15.5px]";
                            break;
                          case 'shiftHalf12_pay':
                            val = formatIQD(Math.round(calculated.shiftsHalf12Pay || 0));
                            styleClass += " text-teal-400 font-bold whitespace-nowrap";
                            break;
                          case 'callout_days_count':
                            val = emp.callouts !== undefined ? emp.callouts : 0;
                            styleClass += " text-white font-black text-[15.5px]";
                            break;
                          case 'callout_pay':
                            val = formatIQD(Math.round(calculated.calloutsPay || 0));
                            styleClass += " text-purple-400 font-bold whitespace-nowrap";
                            break;
                          case 'daily_full_days':
                            val = emp.workingDays !== undefined ? emp.workingDays : 0;
                            styleClass += " text-white font-black text-[15.5px]";
                            break;
                          case 'daily_full_pay':
                            val = formatIQD(Math.round(calculated.basicDaysPay || 0));
                            styleClass += " text-emerald-400 font-bold whitespace-nowrap";
                            break;
                          case 'daily_half_days_count':
                            val = emp.shiftHalf12 !== undefined ? emp.shiftHalf12 : 0;
                            styleClass += " text-white font-black text-[15.5px]";
                            break;
                          case 'daily_half_pay':
                            val = formatIQD(Math.round(calculated.shiftsHalf12Pay || 0));
                            styleClass += " text-teal-400 font-bold whitespace-nowrap";
                            break;
                          case 'allowanceExtraDays':
                            val = formatIQD(Math.round(calculated.allowanceExtraDaysVal || 0));
                            styleClass += " text-cyan-400 font-black whitespace-nowrap";
                            break;
                          case 'allowanceExtraHours':
                            val = formatIQD(Math.round(calculated.allowanceExtraHoursVal || 0));
                            styleClass += " text-blue-400 font-black whitespace-nowrap";
                            break;
                          case 'deductionDays':
                            val = formatIQD(Math.round(calculated.deductionDaysVal || 0));
                            styleClass += " text-rose-400 font-black whitespace-nowrap";
                            break;
                          case 'deductionHours':
                            val = formatIQD(Math.round(calculated.deductionHoursVal || 0));
                            styleClass += " text-pink-400 font-black whitespace-nowrap";
                            break;
                          case 'allowancesTotal':
                            val = formatIQD(Math.round(calculated.allowanceDangerVal + calculated.allowanceMarriageVal + calculated.allowanceChildrenVal + calculated.allowanceDegreeVal + calculated.allowanceExtraDaysVal + calculated.allowanceExtraHoursVal + calculated.allowanceGeneralVal + calculated.allowanceEsnadVal + calculated.allowanceCustom1Val + calculated.allowanceCustom2Val + calculated.allowanceCustom3Val + calculated.allowanceCustom4Val + calculated.allowanceCustom5Val + (calculated.shiftsMorningPay || 0) + (calculated.shiftsEveningPay || 0) + (calculated.shiftsMiddlePay || 0) + (calculated.shiftsFull24Pay || 0) + (calculated.shiftsHalf12Pay || 0) + (calculated.shiftsKhafarPay || 0) + (calculated.calloutsPay || 0)));
                            styleClass += " text-emerald-400 font-bold bg-[#0a1e12]/15 whitespace-nowrap";
                            break;
                          case 'deductionsTotal':
                            val = formatIQD(Math.round(calculated.deductionDaysVal + calculated.deductionHoursVal + calculated.deductionPenaltiesVal + calculated.deductionOtherVal + calculated.deductionPenaltyCustom1Val + calculated.deductionPenaltyCustom2Val + calculated.deductionPenaltyCustom3Val + calculated.deductionPenaltyCustom4Val + calculated.deductionPenaltyCustom5Val));
                            styleClass += " text-red-400 font-bold bg-[#1e0a0f]/15 whitespace-nowrap";
                            break;
                          case 'basicSalary':
                            val = formatIQD(Math.round(calculated.basicSalary));
                            styleClass += " text-[#f8fafc] font-black text-[15.5px] bg-[#0c1328] whitespace-nowrap";
                            break;
                          case 'netSalary':
                            val = formatIQD(Math.round(calculated.netSalary));
                            styleClass += " text-emerald-400 font-black text-[16px] whitespace-nowrap";
                            break;
                        }

                        const fId = getEditableFieldForColumn(col.id);
                        const hasStepper = !!fId;
                        const isPayCol = col.id === 'basicSalary' || col.id === 'netSalary' || col.id === 'allowancesTotal' || col.id === 'deductionsTotal' || col.id.endsWith('_pay') || col.id === 'callout_pay' || col.id === 'daily_full_pay' || col.id === 'daily_half_pay' || col.id === 'allowanceExtraDays' || col.id === 'allowanceExtraHours' || col.id === 'deductionDays' || col.id === 'deductionHours';
                        const minWidthClass = col.id === 'employeeCode' ? 'min-w-[100px]' : (col.id === 'netSalary' ? 'min-w-[175px]' : (isPayCol ? 'min-w-[145px]' : (hasStepper ? 'min-w-[115px]' : 'min-w-[85px]')));
                        const paddingClass = col.id === 'employeeCode' ? 'px-1' : (isPayCol ? 'px-3' : 'px-2');

                        if (fId) {
                          const isWorkingDaysFixed = fId === 'workingDays' && isRowOperationsDept;
                          if (isWorkingDaysFixed) {
                            return (
                              <td key={col.id} className={`${styleClass} ${paddingClass} ${minWidthClass} py-2`} dir="ltr">
                                <div className="flex flex-col items-center justify-center gap-1">
                                  <span className="leading-none text-emerald-400 font-extrabold text-[15.5px]">30</span>
                                  <span className="text-[10px] text-emerald-500 font-bold bg-emerald-950/40 px-1.5 py-0.5 rounded leading-none">ثابت</span>
                                </div>
                              </td>
                            );
                          }

                          let rawValue = 0;
                          if (fId === 'workingDays') {
                            rawValue = emp.workingDays !== undefined ? emp.workingDays : 0;
                          } else {
                            rawValue = (emp[fId] as number) || 0;
                          }

                          let step = 1;
                          if (fId === 'allowanceGeneral') {
                            step = 25000;
                          } else if (fId === 'deductionPenalties') {
                            step = 5000;
                          }

                          return (
                            <td key={col.id} className={`${styleClass} ${paddingClass} ${minWidthClass} py-1 sm:py-1.5`} dir="ltr">
                              <div className="flex flex-col items-center justify-center gap-1.5 w-full">
                                <span className="leading-none">{renderValWithBreak(val)}</span>
                                <div className="flex items-center bg-[#050b14]/90 rounded-md border border-white/10 px-1 py-0.5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]" dir="ltr">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateEmployeeSingleField(emp.id, fId, -step)}
                                    className="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/15 rounded transition-colors cursor-pointer select-none font-black text-[11px]"
                                    title="تقليل القيمة"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    value={rawValue}
                                    onChange={(e) => handleSetEmployeeSingleField(emp.id, fId, e.target.value)}
                                    className="w-10 bg-transparent text-white text-[11.5px] font-extrabold font-sans text-center h-4.5 focus:outline-none p-0 border-none outline-none select-all focus:text-blue-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateEmployeeSingleField(emp.id, fId, step)}
                                    className="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/15 rounded transition-colors cursor-pointer select-none font-black text-[11px]"
                                    title="زيادة القيمة"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </td>
                          );
                        }

                        if (col.id === 'netSalary') {
                          const cleanNum = typeof val === 'string' ? val.replace(' د.ع', '').replace(' IQD', '') : val;
                          return (
                            <td key={col.id} className={`${styleClass} ${paddingClass} ${minWidthClass} py-1.5 sm:py-2.5 align-middle text-center min-w-[175px]`} dir="ltr">
                              <div className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg flex flex-col items-center justify-center w-full text-center mx-auto shadow-sm whitespace-nowrap">
                                <span className="font-mono font-black text-emerald-400 leading-none text-[16px] sm:text-[17px]">{cleanNum}</span>
                                <span className="text-[10.5px] text-emerald-400/90 font-extrabold mt-1 tracking-wider select-none leading-none">
                                  {language === 'ar' ? 'د.ع' : 'IQD'}
                                </span>
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td key={col.id} className={`${styleClass} ${paddingClass} ${minWidthClass} py-1.5 sm:py-2.5 overflow-hidden`} dir="ltr">
                            {renderValWithBreak(val)}
                          </td>
                        );
                      })}

                      {/* Row actions */}
                      <td className="p-2 text-center w-16 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            id={`edit-emp-${emp.id}`}
                            onClick={() => handleOpenEdit(emp)}
                            className="p-1 px-1.5 bg-slate-800/85 hover:bg-slate-700 text-slate-350 hover:text-white rounded border border-slate-700/40 transition-all cursor-pointer"
                            title="تعديل ملف الموظف"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          {!isReadOnly && (
                            <button
                              id={`delete-emp-${emp.id}`}
                              onClick={() => handleDeleteEmployee(emp.id)}
                              className="p-1 px-1.5 bg-slate-900/60 hover:bg-red-950/30 text-slate-400 hover:text-red-400 rounded border border-transparent hover:border-red-500/10 transition-all cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Dynamic Sticky Grand Total Row footer (Requirement: summing all columns) */}
              {processedEmployees.length > 0 && (
                <tfoot className="sticky bottom-0 bg-[#060a15] border-t-2 border-blue-500/50 z-20 shadow-[-5px_-5px_10px_rgba(0,0,0,0.4)]">
                  <tr className="font-bold text-slate-100">
                    {/* Column Align cell for row sequence */}
                    <td className="p-3 text-center font-mono font-black text-amber-500 text-xs bg-[#0d1222]/80 border-x border-[#ffffff]/5">
                      #
                    </td>
                    <td className="p-3 text-right text-sm sm:text-[14.5px] font-serif font-black bg-[#0d1222]">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-500 text-sm">📊</span>
                        <span>المجموع الكلي الكلي ({processedEmployees.length} منتسباً)</span>
                      </div>
                    </td>

                    {visibleColumns.map(col => {
                      const totalVal = getColumnTotal(col.id);
                      const hasStepper = !!getEditableFieldForColumn(col.id);
                      const isPayCol = col.id === 'basicSalary' || col.id === 'netSalary' || col.id === 'allowancesTotal' || col.id === 'deductionsTotal' || col.id.endsWith('_pay') || col.id === 'callout_pay' || col.id === 'daily_full_pay' || col.id === 'daily_half_pay' || col.id === 'allowanceExtraDays' || col.id === 'allowanceExtraHours' || col.id === 'deductionDays' || col.id === 'deductionHours';
                      const minWidthClass = col.id === 'employeeCode' ? 'min-w-[100px]' : (col.id === 'netSalary' ? 'min-w-[175px]' : (isPayCol ? 'min-w-[145px]' : (hasStepper ? 'min-w-[115px]' : 'min-w-[85px]')));
                      const paddingClass = isPayCol ? 'px-3' : 'px-2';

                      let displayVal = null;
                      let fontStyle = `py-2 border-x border-slate-800 text-center font-mono font-black text-[14px] ${minWidthClass} ${paddingClass}`;

                      if (col.id === 'workingDays' || col.id === 'workingHours' || col.id.endsWith('_count') || col.id === 'callout_days_count' || col.id === 'daily_full_days' || col.id === 'daily_half_days_count') {
                        displayVal = totalVal;
                        fontStyle += " text-slate-200 bg-[#0d1222] text-[15px]";
                      } else {
                        displayVal = formatCurrency(Math.round(totalVal), language, 'IQD');
                        if (col.id === 'netSalary') {
                          fontStyle += " bg-[#0d1222]";
                        } else if (col.id === 'deductionDays' || col.id === 'deductionHours') {
                          fontStyle += " text-rose-300 bg-[#0d1222]";
                        } else {
                          fontStyle += " text-indigo-300 bg-[#0d1222]";
                        }
                      }

                      if (col.id === 'netSalary') {
                        const cleanNum = typeof displayVal === 'string' ? displayVal.replace(' د.ع', '').replace(' IQD', '') : displayVal;
                        return (
                          <td key={col.id} className={`${fontStyle} align-middle text-center min-w-[175px]`} dir="ltr">
                            <div className="bg-emerald-500/15 backdrop-blur-sm border border-emerald-500/40 px-3 py-1.5 rounded-lg flex flex-col items-center justify-center w-full text-center select-none shadow-sm mx-auto whitespace-nowrap">
                              <span className="font-mono font-black text-emerald-400 leading-none text-[16px] sm:text-[17px]">{cleanNum}</span>
                              <span className="text-[10.5px] text-emerald-400/90 font-extrabold mt-1 tracking-wider select-none leading-none">
                                {language === 'ar' ? 'د.ع' : 'IQD'}
                              </span>
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td key={col.id} className={fontStyle} dir="ltr">
                          {renderValWithBreak(displayVal)}
                        </td>
                      );
                    })}

                    <td className="bg-[#0b1329] p-2" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Slide-over/Modal Backdrop for Adding & Editing Employees */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 pt-5 px-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-blue-400" />
                    {editingEmployee ? `تعديل ملف ومحاسبة الموظف: ${editingEmployee.name}` : 'تسجيل موظف جديد بالمستشفى'}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">يرجى تعبئة الحقول المطلوبة والمحاسبة الفعالة بالقسم للتحكم بالراتب</p>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 px-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Core Form Scroll Area */}
              <form onSubmit={handleSaveEmployee} className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* section: Basic Demographic Data */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-blue-400 border-b border-slate-800/80 pb-2">أولاً: البيانات الأساسية للعضو</h4>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    {/* Employee Name */}
                    <div className="md:col-span-2">
                      <label className="block text-[11px] text-slate-300 mb-1.5 font-medium">اسم الموظف الثلاثي</label>
                      <input
                        id="form-emp-name"
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="أدخل الاسم الصريح والكامل..."
                        className="w-full px-3 py-2 glass-input border border-white/10 rounded-xl text-white text-xs focus:outline-none"
                      />
                    </div>

                    {/* Employee Sequence (تسلسل الموظف) */}
                    <div>
                      <label className="block text-[11px] text-amber-350 mb-1.5 font-medium">التسلسل (الترتيب الإداري)</label>
                      <input
                        id="form-emp-sequence"
                        type="number"
                        min="1"
                        value={formSequence}
                        onChange={(e) => setFormSequence(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="مثال: 1"
                        className="w-full px-3 py-2 glass-input border border-white/10 rounded-xl text-amber-200 text-xs focus:outline-none placeholder-slate-500 font-mono text-center font-bold"
                      />
                    </div>

                    {/* Employee Code (الرقم الوظيفي) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[11px] text-indigo-300 font-medium">الرقم الوظيفي (كود الموظف)</label>
                        <span className="text-[9.5px] text-emerald-400 font-medium">تلقائي (+1) أو يدوي</span>
                      </div>
                      <input
                        id="form-emp-code"
                        type="text"
                        value={formEmployeeCode}
                        onChange={(e) => setFormEmployeeCode(e.target.value)}
                        placeholder="مثال: EMP-1011"
                        className="w-full px-3 py-2 glass-input border border-white/10 rounded-xl text-white text-xs focus:outline-none placeholder-slate-500 font-mono"
                      />
                    </div>

                    {/* Department Select */}
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1.5 font-medium">القسم</label>
                      <select
                        id="form-emp-dept"
                        value={formDeptId}
                        onChange={(e) => handleFormDeptChange(e.target.value)}
                        className="w-full px-3 py-2 glass-input border border-white/10 rounded-xl text-white text-xs focus:outline-none"
                      >
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Gender select */}
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1.5 font-medium"> الجنس البشري (مهم للاستدعاء)</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormGender('male')}
                          className={`py-1.5 text-xs rounded-lg font-medium cursor-pointer transition-all border ${
                            formGender === 'male'
                              ? 'bg-blue-600/10 border-blue-500/40 text-blue-300'
                              : 'bg-slate-950 border-slate-800 text-slate-500'
                          }`}
                        >
                          ولد (ذكر)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormGender('female')}
                          className={`py-1.5 text-xs rounded-lg font-medium cursor-pointer transition-all border ${
                            formGender === 'female'
                              ? 'bg-emerald-600/10 border-emerald-500/40 text-emerald-300'
                              : 'bg-slate-950 border-slate-800 text-slate-500'
                          }`}
                        >
                          بنت (أنثى)
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Position within Department */}
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1.5 font-medium">العنوان الوظيفي / المنصب</label>
                      <JobTitleSelect
                        value={formPosition}
                        onChange={(newVal) => handleFormPositionChange(newVal)}
                        className="w-full px-3 py-2 glass-input border border-white/10 rounded-xl text-white text-xs focus:outline-none bg-slate-950"
                      />
                    </div>

                    {/* Monthly Basic Salary input with arrow controls and currency choice */}
                    <div>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        {/* Salary amount field - 8 cols */}
                        <div className="sm:col-span-8">
                          <label className="block text-[11px] text-slate-300 mb-1.5 font-medium flex items-center justify-between">
                            <span>{language === 'ar' ? `الراتب الأساسي الشهري (${formCurrency === 'USD' ? 'دولار $' : 'دينار د.ع'})` : `Monthly Basic Salary (${formCurrency})`}</span>
                            {isSalaryLocked ? (
                              <span className="text-[9px] text-amber-400 font-sans font-medium">(مُقفل)</span>
                            ) : (
                              <span className="text-[9px] text-blue-400 font-sans font-medium">
                                (±{formCurrency === 'USD' ? '100 $' : '٥٠,٠٠٠ د.ع'})
                              </span>
                            )}
                          </label>
                          <div className={`flex items-center gap-1.5 p-1.5 rounded-xl border ${
                            isSalaryLocked
                              ? 'bg-slate-950/40 border-amber-500/20 opacity-80'
                              : 'bg-slate-950/90 border-white/10'
                          }`} dir="ltr">
                            <button
                              type="button"
                              disabled={isSalaryLocked || isReadOnly}
                              onClick={() => setFormBasicSalary(prev => Math.max(0, prev - (formCurrency === 'USD' ? 100 : 50000)))}
                              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all font-bold text-base select-none active:scale-95 focus:outline-none ${
                                isSalaryLocked
                                  ? 'bg-slate-900/40 text-slate-600 cursor-not-allowed'
                                  : 'bg-slate-900/90 hover:bg-slate-800 hover:text-white text-slate-200 cursor-pointer'
                              }`}
                              title={language === 'ar' ? 'تقليل بمقدار خطوة' : 'Decrease salary step'}
                            >
                              -
                            </button>
                            <input
                              id="form-emp-basic-salary"
                              type="number"
                              min="0"
                              readOnly={isSalaryLocked}
                              disabled={isReadOnly}
                              value={formBasicSalary || 0}
                              onChange={(e) => setFormBasicSalary(Math.max(0, parseInt(e.target.value) || 0))}
                              placeholder={formCurrency === 'USD' ? 'مثال: 1200' : 'مثال: 1200000'}
                              className="flex-1 text-center bg-transparent text-xs font-bold font-mono border-0 focus:ring-0 focus:outline-none p-1 text-white text-left disabled:text-slate-400"
                            />
                            <button
                              type="button"
                              disabled={isSalaryLocked || isReadOnly}
                              onClick={() => setFormBasicSalary(prev => prev + (formCurrency === 'USD' ? 100 : 50000))}
                              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all font-bold text-base select-none active:scale-95 focus:outline-none ${
                                isSalaryLocked
                                  ? 'bg-slate-900/40 text-slate-600 cursor-not-allowed'
                                  : 'bg-slate-900/90 hover:bg-slate-800 hover:text-white text-slate-200 cursor-pointer'
                              }`}
                              title={language === 'ar' ? 'زيادة بمقدار خطوة' : 'Increase salary step'}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Currency Choice - 4 cols */}
                        <div className="sm:col-span-4">
                          <label className="block text-[11px] text-slate-300 mb-1.5 font-medium">
                            {language === 'ar' ? 'اختر العملة' : 'Choose Currency'}
                          </label>
                          <div className="grid grid-cols-2 gap-1 bg-slate-950/90 p-1 border border-white/10 rounded-xl" dir="rtl">
                            <button
                              type="button"
                              disabled={isReadOnly}
                              onClick={() => setFormCurrency('IQD')}
                              className={`py-2 px-1 text-[11px] font-black rounded-lg transition-all text-center select-none cursor-pointer outline-none ${
                                formCurrency === 'IQD'
                                  ? 'bg-blue-600 text-white shadow font-sans'
                                  : 'text-slate-400 hover:text-white hover:bg-white/5 font-sans'
                              }`}
                            >
                              {language === 'ar' ? 'عراقي' : 'IQD'}
                            </button>
                            <button
                              type="button"
                              disabled={isReadOnly}
                              onClick={() => setFormCurrency('USD')}
                              className={`py-2 px-1 text-[11px] font-black rounded-lg transition-all text-center select-none cursor-pointer outline-none ${
                                formCurrency === 'USD'
                                  ? 'bg-emerald-600 text-white shadow font-sans'
                                  : 'text-slate-400 hover:text-white hover:bg-white/5 font-sans'
                              }`}
                            >
                              {language === 'ar' ? 'دولار' : 'USD'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {formBasicSalary > 0 && (
                        <div className="text-[10px] text-emerald-300 mt-2 font-sans flex items-center justify-between bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-2">
                          <span>اليومية: <strong className="font-mono text-emerald-400">{formatCurrency(Math.round(formBasicSalary / 30), language, formCurrency)}</strong></span>
                          <span>سعر الساعة: <strong className="font-mono text-emerald-400">{formatCurrency(Math.round((formBasicSalary / 30) / 8), language, formCurrency)}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Government Sector & Social Security Section */}
                  <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 mt-3 space-y-3" dir="rtl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-2">
                      <div className="text-right">
                        <h5 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                          <span>🏛️ قطاع التوظيف والشمول بالضمان الاجتماعي والصحي</span>
                        </h5>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                          تحديد كادر القطاع الحكومي لتطبيقه على استقطاعات الضمان الاجتماعي والصحي بالمستشفى (الموظف الحكومي يُستثنى تلقائياً مع إمكانية التعديل).
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                      {/* Sector choice options */}
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1.5 font-medium">جهة العمل الوظيفية</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setFormIsGovernmentSector(true);
                              setFormIsSubjectToSocialSecurity(false);
                              showToast('تم اختيار (يعمل في القطاع الحكومي) واستثنائه من الضمان تلقائياً', 'info');
                            }}
                            className={`py-2 px-2 text-xs rounded-xl font-bold cursor-pointer transition-all border flex items-center justify-center gap-1.5 select-none ${
                              formIsGovernmentSector
                                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-md ring-1 ring-amber-500/30'
                                : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <span>🏛️ يعمل في القطاع الحكومي</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormIsGovernmentSector(false);
                              setFormIsSubjectToSocialSecurity(true);
                              showToast('تم اختيار (لا يعمل في القطاع الحكومي) وشموله بالضمان تلقائياً', 'info');
                            }}
                            className={`py-2 px-2 text-xs rounded-xl font-bold cursor-pointer transition-all border flex items-center justify-center gap-1.5 select-none ${
                              !formIsGovernmentSector
                                ? 'bg-blue-600/25 border-blue-500/60 text-blue-300 shadow-md ring-1 ring-blue-500/30'
                                : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <span>🏥 لا يعمل بالقطاع الحكومي</span>
                          </button>
                        </div>
                      </div>

                      {/* Checkbox for Social Security inclusion/exemption */}
                      <div className="bg-slate-900/90 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3">
                        <div className="space-y-0.5 text-right">
                          <span className="text-xs font-black text-white block">هل يخضع للضمان الاجتماعي والصحي؟</span>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            {formIsGovernmentSector
                              ? '⚠️ الموظف حكومي ومستثنى تلقائياً (يمكنك تفعيله بوضع علامة صح)'
                              : '✅ الموظف خاص ويتم شموله باستقطاع الضمان 5%'}
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                          <input
                            type="checkbox"
                            checked={formIsSubjectToSocialSecurity}
                            onChange={(e) => setFormIsSubjectToSocialSecurity(e.target.checked)}
                            className="w-5 h-5 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-950 border-slate-700 cursor-pointer"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Fingerprint Exemption Section */}
                  <div className="bg-indigo-950/20 border border-indigo-500/15 rounded-2xl p-4 mt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="space-y-1 text-right">
                        <h5 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 justify-end">
                          <span>التحكم في آلية الحضور (البصمة والراتب الثابت)</span>
                          <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                        </h5>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          تفعيل الخيار أدناه يستثني الموظف تماماً من استقطاعات الغياب أو ساعات التأخير المرتبطة بنظام البصمة والحضور، ويعتبر راتبه متكاملاً وثابتاً.
                        </p>
                      </div>
                      <div>
                        <label className="relative inline-flex items-center gap-2.5 bg-[#0b0f19] border border-white/10 px-4 py-2 rounded-xl cursor-pointer hover:bg-slate-900/60 transition-all select-none">
                          <input
                            type="checkbox"
                            checked={formIsFingerprintExempt}
                            onChange={(e) => setFormIsFingerprintExempt(e.target.checked)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700 cursor-pointer"
                          />
                          <span className="text-xs font-black text-white whitespace-nowrap">موظف غير خاضع للبصمة (راتب ثابت مكتمل)</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Individualized Custom Shift Feature */}
                  <div className="bg-slate-950/40 border border-white/10 rounded-2xl p-4 mt-3">
                    <div className="flex flex-col gap-4 text-right" dir="rtl">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 font-sans">
                            <span>⏱️ أوقات دوام مخصص للموظف</span>
                          </h5>
                          <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                            تفعيل هذا الخيار يتجاوز شفتات القسم الافتراضية ويلزم النظام بآلية حضور مخصصة ومرنة لهذا الموظف تحديداً.
                          </p>
                        </div>
                        <div>
                          <label className="relative inline-flex items-center gap-2.5 bg-[#0b0f19] border border-white/10 px-4 py-2 rounded-xl cursor-pointer hover:bg-slate-900/60 transition-all select-none">
                            <input
                              type="checkbox"
                              checked={formHasCustomShift}
                              onChange={(e) => setFormHasCustomShift(e.target.checked)}
                              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700 cursor-pointer"
                            />
                            <span className="text-xs font-black text-white whitespace-nowrap">تفعيل دوام مخصص للموظف</span>
                          </label>
                        </div>
                      </div>

                      {formHasCustomShift && (
                        <div className="space-y-4 pt-3 border-t border-white/5 animate-fadeIn">
                          {/* 3-Option Shift Type Selector */}
                          <div className="space-y-2">
                            <span className="text-xs font-bold text-white block">حدد نوع الدوام المخصص للموظف:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <button
                                type="button"
                                onClick={() => setFormCustomShiftType('fixed')}
                                className={`px-3 py-2.5 rounded-xl border text-xs font-black transition-all flex flex-col items-center gap-1.5 ${
                                  formCustomShiftType === 'fixed'
                                    ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                                    : 'bg-slate-950/60 border-white/5 text-slate-400 hover:bg-slate-900 hover:text-white'
                                }`}
                              >
                                <span>⏱️ دوام محدد بوقت</span>
                                <span className="text-[9px] font-medium text-slate-400 text-center">أوقات حضور وانصراف يتم تحديدها يدوياً بدقة</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setFormCustomShiftType('flexible')}
                                className={`px-3 py-2.5 rounded-xl border text-xs font-black transition-all flex flex-col items-center gap-1.5 ${
                                  formCustomShiftType === 'flexible'
                                    ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                                    : 'bg-slate-950/60 border-white/5 text-slate-400 hover:bg-slate-900 hover:text-white'
                                }`}
                              >
                                <span>🔓 دوام مفتوح (مرن)</span>
                                <span className="text-[9px] font-medium text-slate-400 text-center">حضور مرن ومفتوح بالكامل بغير احتساب تأخير</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setFormCustomShiftType('shift_system')}
                                className={`px-3 py-2.5 rounded-xl border text-xs font-black transition-all flex flex-col items-center gap-1.5 ${
                                  formCustomShiftType === 'shift_system'
                                    ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                                    : 'bg-slate-950/60 border-white/5 text-slate-400 hover:bg-slate-900 hover:text-white'
                                }`}
                              >
                                <span>🔄 دوام بنظام شفت</span>
                                <span className="text-[9px] font-medium text-slate-400 text-center">ربط الموظف بشفت معين من شفتات القسم مع تثبيت وقته</span>
                              </button>
                            </div>
                          </div>

                          {/* Fixed Hours Option Form */}
                          {formCustomShiftType === 'fixed' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 border border-white/5 p-3 rounded-xl animate-scaleIn">
                              <div className="space-y-1.5">
                                <span className="text-[11px] text-slate-300 font-bold block">وقت الحضور الفردي (Start):</span>
                                <select
                                  value={formCustomStart}
                                  onChange={(e) => setFormCustomStart(e.target.value)}
                                  className="w-full p-2 bg-slate-950 border border-white/10 rounded-lg text-amber-200 text-xs font-bold text-center cursor-pointer focus:border-amber-500 focus:outline-none font-sans"
                                >
                                  {TIME_SLOT_OPTIONS.map((opt) => (
                                    <option key={opt.val} value={opt.val} className="bg-slate-900 text-white font-bold text-right">
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="space-y-1.5">
                                <span className="text-[11px] text-slate-300 font-bold block">وقت الانصراف الفردي (End):</span>
                                <select
                                  value={formCustomEnd}
                                  onChange={(e) => setFormCustomEnd(e.target.value)}
                                  className="w-full p-2 bg-slate-950 border border-white/10 rounded-lg text-amber-200 text-xs font-bold text-center cursor-pointer focus:border-amber-500 focus:outline-none font-sans"
                                >
                                  {TIME_SLOT_OPTIONS.map((opt) => (
                                    <option key={opt.val} value={opt.val} className="bg-slate-900 text-white font-bold text-right">
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}

                          {/* Flexible/Open Shift Option Message */}
                          {formCustomShiftType === 'flexible' && (
                            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 rounded-xl p-3.5 text-xs text-right animate-scaleIn space-y-1 font-sans">
                              <p className="font-bold text-amber-400">🔓 دوام مفتوح ومرن للموظف:</p>
                              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                                سيتم السماح لهذا الموظف بالحضور في أي ساعة بمجرد تسجيل بصمته. يعتبر حاضراً تماماً ولا يتم احتساب غرامة تأخير أو دوام ناقص.
                              </p>
                            </div>
                          )}

                          {/* Shift System Option Form */}
                          {formCustomShiftType === 'shift_system' && (
                            <div className="bg-slate-950/60 border border-white/10 p-4 rounded-xl animate-scaleIn space-y-4">
                              <div className="space-y-1.5 text-right">
                                <label className="block text-xs font-bold text-slate-200 font-sans">اختر نوع شفت القسم للموظف:</label>
                                <select
                                  value={formCustomShiftSystemOption}
                                  onChange={(e) => handleCustomShiftSystemOptionChange(e.target.value as any)}
                                  className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-amber-200 text-xs font-bold focus:outline-none focus:border-amber-500 transition-colors cursor-pointer text-right font-sans"
                                >
                                  <option value="s1" className="bg-slate-900 text-white font-bold text-right">🌅 الشفت الأول (الصباحي)</option>
                                  <option value="s2" className="bg-slate-900 text-white font-bold text-right">🌇 الشفت الثاني (المسائي)</option>
                                  <option value="s3" className="bg-slate-900 text-white font-bold text-right">🌃 الشفت الثالث (الليلي)</option>
                                  <option value="s4" className="bg-slate-900 text-white font-bold text-right">💂 الشفت الرابع (خفر مبيت / مستمر)</option>
                                </select>
                              </div>

                              <div className="border-t border-white/5 pt-3 space-y-3">
                                <div className="flex items-center justify-between font-sans">
                                  <span className="text-[11px] font-bold text-amber-300">⚙️ تأكيد / تعديل وتثبيت أوقات هذا الشفت للموظف</span>
                                  <span className="text-[10px] text-slate-400">أي تعديل هنا سيُخصص لصالح الموظف</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="space-y-1.5 font-sans">
                                    <span className="text-[11px] text-slate-300 font-bold block">وقت الحضور المثبت للشفت:</span>
                                    <select
                                      value={formCustomStart}
                                      onChange={(e) => setFormCustomStart(e.target.value)}
                                      className="w-full p-2 bg-slate-950 border border-white/10 rounded-lg text-amber-200 text-xs font-bold text-center cursor-pointer focus:border-amber-500 focus:outline-none font-sans"
                                    >
                                      {TIME_SLOT_OPTIONS.map((opt) => (
                                        <option key={opt.val} value={opt.val} className="bg-slate-900 text-white font-bold text-right">
                                          {opt.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="space-y-1.5 font-sans">
                                    <span className="text-[11px] text-slate-300 font-bold block">وقت الانصراف المثبت للشفت:</span>
                                    <select
                                      value={formCustomEnd}
                                      onChange={(e) => setFormCustomEnd(e.target.value)}
                                      className="w-full p-2 bg-slate-950 border border-white/10 rounded-lg text-amber-200 text-xs font-bold text-center cursor-pointer focus:border-amber-500 focus:outline-none font-sans"
                                    >
                                      {TIME_SLOT_OPTIONS.map((opt) => (
                                        <option key={opt.val} value={opt.val} className="bg-slate-900 text-white font-bold text-right">
                                          {opt.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* section: Dynamic Shift Ledger and Allowances Inputs (Dual Columns matching the provided picture layout) */}
                {editingEmployee && (
                  <>
                    <div className="space-y-4">
                      <div className="border-b border-white/5 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-2 text-right" dir="rtl">
                        <div>
                          <h4 className="text-xs font-bold text-blue-400">ثانياً: المتغيرات والدوام والشفتات والمستحقات المباشرة للأعضاء</h4>
                          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                            الخيارات مفصلة ومصنفة لتطابق إعدادات القسم الحالي تماماً بالرموز ومؤشر الاختيار الملون. الحقول المعطلة حسب إعدادات القسم مؤشر عليها بوضع <span className="font-semibold text-slate-500">🔒 معطل في القسم</span> ولا تدخل في احتسابات الراتب.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* COLUMN 1: الدوام والعمليات والشفتات */}
                        <div className="space-y-4">
                          <div className="bg-white/[0.01] p-4 rounded-3xl border border-blue-500/10 space-y-3">
                            <h5 className="text-xs font-bold text-blue-400 border-b border-white/5 pb-2 flex items-center gap-2" dir="rtl">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                              الدوام والعمليات والشفتات (مؤشرات الشفت والغياب والعمل)
                            </h5>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                              {(() => {
                                const col1FieldIds: FieldId[] = [
                                  'shiftMorning',
                                  'shiftEvening',
                                  'shiftMiddle',
                                  'shiftFull24',
                                  'shiftHalf12',
                                  'shiftKhafar',
                                  'callouts'
                                ];
                                return col1FieldIds.map((fieldId) => {
                                  const f = FIELDS_METADATA.find(meta => meta.id === fieldId);
                                  if (!f) return null;
                                  const isActive = selectedFormDept ? selectedFormDept.enabledFields[f.id] : true;
                                  if (!isActive) return null;
                                  const isFormOperationsDept = selectedFormDept && (selectedFormDept.name?.includes('العمليات') || selectedFormDept.id === 'dept-1780063315310');
                                  const isFixedWorkingDays = fieldId === 'workingDays' && isFormOperationsDept;
                                  const val = isFixedWorkingDays ? 30 : (numericInputs[f.id] || 0);
                                  const isDisabled = isReadOnly || isFixedWorkingDays;
                                  return (
                                    <StepperInput
                                      key={f.id}
                                      id={`inp-${f.id}`}
                                      label={getFieldLabel(f.id)}
                                      description={isFixedWorkingDays ? (language === 'ar' ? 'ثابت 30 يوماً لقسم العمليات' : 'Fixed 30 days for Operations') : (f.id === 'workingDays' ? 'الحد الأقصى 30 يوماً' : undefined)}
                                      value={val}
                                      onChange={(val) => handleNumericInputChange(f.id, String(val))}
                                      min={0}
                                      max={f.id === 'workingDays' ? 30 : undefined}
                                      step={1}
                                      disabled={isDisabled}
                                      isActive={isActive}
                                      type={f.type}
                                      language={language}
                                    />
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* COLUMN 2: المخصصات والاستقطاعات والقيم المدونة */}
                        <div className="space-y-4">
                          <div className="bg-white/[0.01] p-4 rounded-3xl border border-emerald-500/10 space-y-3">
                            <h5 className="text-xs font-bold text-emerald-400 border-b border-white/5 pb-2 flex items-center gap-2" dir="rtl">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                              المخصصات والاستقطاعات والقيم المدونة (البنود والخصومات)
                            </h5>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                              {(() => {
                                const col2FieldIds: FieldId[] = [
                                  'allowanceDanger',
                                  'allowanceMarriage',
                                  'allowanceChildren',
                                  'allowanceDegree',
                                  'allowanceExtraDays',
                                  'allowanceExtraHours',
                                  'allowanceGeneral',
                                  'allowanceEsnad'
                                ];

                                const customAllowances: FieldId[] = [
                                  'allowanceCustom1',
                                  'allowanceCustom2',
                                  'allowanceCustom3',
                                  'allowanceCustom4',
                                  'allowanceCustom5'
                                ];
                                customAllowances.forEach(id => {
                                  if (selectedFormDept && selectedFormDept.enabledFields[id]) {
                                    col2FieldIds.push(id);
                                  }
                                });

                                col2FieldIds.push(
                                  'deductionDays',
                                  'deductionHours',
                                  'deductionPenalties',
                                  'deductionOther'
                                );

                                const customPenalties: FieldId[] = [
                                  'deductionPenaltyCustom1',
                                  'deductionPenaltyCustom2',
                                  'deductionPenaltyCustom3',
                                  'deductionPenaltyCustom4',
                                  'deductionPenaltyCustom5'
                                ];
                                customPenalties.forEach(id => {
                                  if (selectedFormDept && selectedFormDept.enabledFields[id]) {
                                    col2FieldIds.push(id);
                                  }
                                });

                                return col2FieldIds.map((fieldId) => {
                                  const f = FIELDS_METADATA.find(meta => meta.id === fieldId);
                                  if (!f) return null;
                                  const isActive = selectedFormDept ? selectedFormDept.enabledFields[f.id] : true;
                                  if (!isActive) return null;
                                  
                                  // currency variables have stepping of 10,000 for ease, other number fields has 1
                                  let stepSize = f.type === 'currency' ? 10000 : 1;
                                  let labelText = getFieldLabel(f.id);
                                  
                                  if (f.category === 'allowances' && f.type === 'currency') {
                                    stepSize = 5000;
                                    labelText = `${getFieldLabel(f.id)} (يبدأ من 5,000 د.ع)`;
                                  }
                                  
                                  if (fieldId === 'deductionPenalties' || fieldId.startsWith('deductionPenaltyCustom')) {
                                    labelText = `${getFieldLabel(f.id)} (يبدأ من 5,000 د.ع)`;
                                    stepSize = 5000;
                                  }
                                  
                                  return (
                                    <StepperInput
                                      key={f.id}
                                      id={`inp-${f.id}`}
                                      label={labelText}
                                      value={numericInputs[f.id] || 0}
                                      onChange={(val) => handleNumericInputChange(f.id, String(val))}
                                      min={0}
                                      step={stepSize}
                                      disabled={isReadOnly}
                                      isActive={isActive}
                                      type={f.type}
                                      language={language}
                                    />
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rollover Section if Enabled */}
                    {(!selectedFormDept || selectedFormDept.enabledFields.previousMonthOver) && (
                      <div className="bg-white/[0.01] p-5 rounded-3xl border border-cyan-500/10 space-y-3">
                        <h4 className="text-xs font-bold text-cyan-400 flex items-center gap-2" dir="rtl">
                          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                          ثالثاً: رصيد التسوية ومدور الشهر السابق (موجب/سالب)
                        </h4>
                        <p className="text-[10px] text-slate-400 leading-relaxed" dir="rtl">
                          الرصيد المحسوب كفرق من رواتب الفترات المنصرمة. القيمة الموجبة (+) تُضاف لصافي أجور هذا الشهر، والقيمة السالبة (-) تُستقطع تلقائياً.
                        </p>
                        <div className="w-full sm:w-72">
                          <StepperInput
                            id="inp-previousMonthOver"
                            label="مدور الشهر السابق"
                            value={numericInputs.previousMonthOver || 0}
                            onChange={(val) => handleNumericInputChange('previousMonthOver', String(val))}
                            min={-10000000}
                            step={10000}
                            disabled={isReadOnly}
                            isActive={true}
                            type="currency"
                            language={language}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </form>

              {/* Modal Footer Controls */}
              <div className="p-4 px-6 border-t border-slate-800 bg-slate-905 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-800 cursor-pointer"
                >
                  إلغاء الأمر
                </button>
                <button
                  id="save-emp-submit"
                  onClick={handleSaveEmployee}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md cursor-pointer transition-colors"
                >
                  {editingEmployee ? 'حفظ وإعادة المحاسبة المباشرة' : 'تسجيل الموظف والمحاسبة الآلية'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Custom, Iframe-safe Employee Deletion Confirmation Modal */}
      <AnimatePresence>
        {empIdToDelete !== null && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="glass-panel border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 text-right font-sans"
            >
              <div className="flex items-center gap-3 text-red-400 justify-start" dir="rtl">
                <Trash2 className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-bold text-white">تأكيد حذف الموظف نهائياً؟</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف سجل هذا الموظف بالكامل من نظام كشوفات الرواتب؟ لا يمكن استرداد البيانات أو السلف المصاحبة بعد الحذف.
              </p>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEmpIdToDelete(null)}
                  className="px-4 py-2 text-xs text-slate-300 border border-slate-700/85 hover:bg-slate-850 rounded-lg cursor-pointer transition-all"
                >
                  تراجع وإلغاء
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteEmployee}
                  className="px-4 py-2 text-xs text-white bg-red-600 hover:bg-red-500 rounded-lg cursor-pointer font-medium transition-all shadow-md shadow-red-950/20"
                >
                  نعم، تأكيد الحذف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom, Iframe-safe Reset All Fields Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-center items-center p-4 font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="glass-panel border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 text-right"
            >
              <div className="flex items-center gap-3 text-red-400 justify-start animate-pulse" dir="rtl">
                <RefreshCw className="w-5 h-5 shrink-0 animate-spin-slow" />
                <h3 className="text-sm font-bold text-white">تأكيد البدء بشهر جديد وتصفير المدخلات؟</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                هل أنت متأكد من رغبتك بتصفير كافة مدخلات الدوام، الشفتات، المخصصات والاستقطاعات للموظفين للبدء في شهر مالي جديد؟
              </p>

              {/* Reset Scope Selector */}
              <div className="bg-slate-950/45 p-3 rounded-xl border border-white/5 space-y-3" dir="rtl">
                <label className="block text-[11px] font-bold text-slate-300">نطاق تطبيق عملية التصفير المتغيرة:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setResetTargetType('all')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                      resetTargetType === 'all'
                        ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                        : 'bg-transparent text-slate-400 border-white/5 hover:bg-white/5'
                    }`}
                  >
                    🪐 كافة الأقسام
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetTargetType('single')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                      resetTargetType === 'single'
                        ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                        : 'bg-transparent text-slate-400 border-white/5 hover:bg-white/5'
                    }`}
                  >
                    🏢 قسم مخصص فقط
                  </button>
                </div>

                {resetTargetType === 'single' && (
                  <div className="space-y-1 pt-1 animate-scale-up">
                    <label className="block text-[10px] text-slate-400 font-medium">اسم القسم الطبي المستهدف:</label>
                    <select
                      value={resetTargetDeptId}
                      onChange={(e) => setResetTargetDeptId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded-xl text-slate-250 text-xs focus:outline-none"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <p className="text-[10px] text-slate-400 leading-normal">
                سيتم الاحتفاظ بالأسماء والمناصب والرواتب الأساسية ثابتة، بينما تصبح المتغيرات وأيام الدوام صفراً (0) لتقوم بتحديدها يدوياً لكل موظف.
              </p>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 text-xs text-slate-300 border border-slate-700/85 hover:bg-slate-850 rounded-lg cursor-pointer transition-all"
                >
                  تراجع وإلغاء
                </button>
                <button
                  type="button"
                  onClick={confirmResetAllEntries}
                  className="px-4 py-2 text-xs text-white bg-red-600 hover:bg-red-500 rounded-lg cursor-pointer font-medium transition-all shadow-md shadow-red-950/20"
                >
                  نعم، تصفير والبدء بشهر جديد
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* File Save Location Dialog wrapper for dynamic Excel exports */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-center items-center p-4 font-sans text-right">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="glass-panel border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center gap-3 text-emerald-400 justify-start" dir="rtl">
                <FileSpreadsheet className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-bold text-white">تأكيد تصدير كشف رواتب Excel</h3>
              </div>
              
              <div className="space-y-4" dir="rtl">
                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-350 font-medium">الجهة المالكة والترويسة:</label>
                  <input
                    type="text"
                    disabled
                    value="مستشفى الفرح الأهلي"
                    className="w-full px-3 py-2 bg-slate-900/60 border border-white/5 rounded-xl text-slate-400 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-100 font-bold">اسم ملف التصدير للتحميل:</label>
                  <input
                    type="text"
                    value={exportFilename}
                    onChange={(e) => setExportFilename(e.target.value)}
                    placeholder="مثال: كشف_رواتب_القسم_مايو"
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    يمكنك تغيير اسم الملف بالكامل أعلاه قبل الحفظ.
                  </p>
                </div>

                <div className="bg-[#050b18] p-3 rounded-xl border border-white/5 space-y-2">
                  <span className="text-[10.5px] font-bold text-amber-300 flex items-center gap-1">
                    ⚠️ توضيح مسار ومجلد الحفظ:
                  </span>
                  <p className="text-[10px] text-slate-300 leading-relaxed leading-5">
                    التحميل سيظهر في مجلد التحميلات الرئيسي بجهازك تلقائياً باسم الملف المحدد. لتسهيل تحديد مكان الحفظ بمراكز الأقسام وصالات الحاسوب يدويًا لكل تقرير، ننصح بتفعيل خيار 
                    <strong className="text-white mx-1">"السؤال عن مكان حفظ كل ملف قبل تنزيله"</strong> 
                    بشكل دائم في إعدادات تنزيلات المتصفح الخاص بك.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 text-xs text-slate-300 border border-slate-700/85 hover:bg-slate-850 rounded-lg cursor-pointer transition-all"
                >
                  إلغاء التصدير
                </button>
                <button
                  type="button"
                  onClick={() => triggerActualExcelExport(exportFilename)}
                  className="px-4 py-2 text-xs text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg cursor-pointer font-semibold transition-all shadow-md shadow-emerald-950/20"
                >
                  تصدير وحفظ الملف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
