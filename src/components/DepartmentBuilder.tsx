import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HeartPulse,
  Baby,
  Scissors,
  ShieldAlert,
  Microscope,
  Stethoscope,
  Brain,
  Droplet,
  Bone,
  Eye,
  Pill,
  BedDouble,
  Heart,
  Activity,
  UserCheck,
  Coins,
  Building2,
  Plus,
  Trash2,
  Edit2,
  Check,
  Briefcase,
  X,
  Lock,
  DollarSign,
  ChevronLeft,
  Settings,
  HelpCircle,
  Sparkles,
  Calendar,
  Info,
  Sliders,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { Department, FieldId, UserRole, CalculatedPayroll, Employee } from '../types';
import { FIELDS_METADATA, sanitizeDepartmentPositions } from '../data';
import { showToast } from '../lib/toast';
import { TRANSLATIONS, formatCurrency } from '../lib/translations';

// 24-Hours Time Slot options at 30-minute intervals for user-friendly select controls
export const TIME_SLOT_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  const hourStr = String(h).padStart(2, "0");
  const minStr = m;
  const val = `${hourStr}:${minStr}`;
  const ampm = h >= 12 ? "مساءً" : "صباحاً";
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  const label = `${displayHour}:${minStr} ${ampm} (${val})`;
  return { val, label };
});

// 16 Premium Hospital Icons configured with cohesive theme styles
export const DEPT_ICON_TEMPLATES = [
  { icon: HeartPulse, label: 'القلب والنبض', color: 'text-red-400', bg: 'bg-red-500/15', glow: 'shadow-red-500/20', border: 'border-red-500/30' },
  { icon: Baby, label: 'الولادة ورعاية الأطفال', color: 'text-pink-400', bg: 'bg-pink-500/15', glow: 'shadow-pink-500/20', border: 'border-pink-500/30' },
  { icon: Scissors, label: 'الجراحة والعمليات', color: 'text-amber-400', bg: 'bg-amber-500/15', glow: 'shadow-amber-500/20', border: 'border-amber-500/30' },
  { icon: ShieldAlert, label: 'الطوارئ والإسعاف', color: 'text-orange-400', bg: 'bg-orange-500/15', glow: 'shadow-orange-500/20', border: 'border-orange-500/30' },
  { icon: Microscope, label: 'المختبر والتحاليل', color: 'text-emerald-400', bg: 'bg-emerald-500/15', glow: 'shadow-emerald-500/20', border: 'border-emerald-500/30' },
  { icon: Stethoscope, label: 'العيادات والفحص', color: 'text-blue-400', bg: 'bg-blue-500/15', glow: 'shadow-blue-500/20', border: 'border-blue-500/30' },
  { icon: Brain, label: 'الأعصاب والدماغ', color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/15', glow: 'shadow-fuchsia-500/20', border: 'border-fuchsia-500/30' },
  { icon: Droplet, label: 'بنك الدم والرعاية', color: 'text-cyan-400', bg: 'bg-cyan-500/15', glow: 'shadow-cyan-500/20', border: 'border-cyan-500/30' },
  { icon: Bone, label: 'الكسور والمفاصل', color: 'text-slate-400', bg: 'bg-slate-500/15', glow: 'shadow-slate-500/20', border: 'border-slate-500/30' },
  { icon: Eye, label: 'العيون والبصريات', color: 'text-sky-400', bg: 'bg-sky-500/15', glow: 'shadow-sky-500/20', border: 'border-sky-500/30' },
  { icon: Pill, label: 'الصيدلية والأدوية', color: 'text-violet-400', bg: 'bg-violet-500/15', glow: 'shadow-violet-500/20', border: 'border-violet-500/30' },
  { icon: BedDouble, label: 'الأجنحة العناية والرقود', color: 'text-rose-450', bg: 'bg-rose-500/15', glow: 'shadow-rose-500/20', border: 'border-rose-500/30' },
  { icon: Heart, label: 'أمراض وجراحة القلب', color: 'text-red-505', bg: 'bg-red-600/15', glow: 'shadow-red-600/20', border: 'border-red-600/30' },
  { icon: Activity, label: 'التخطيط والجهد والعناية', color: 'text-teal-400', bg: 'bg-teal-500/15', glow: 'shadow-teal-500/20', border: 'border-teal-500/30' },
  { icon: UserCheck, label: 'الشؤون الإدارية والكوادر', color: 'text-indigo-400', bg: 'bg-indigo-500/15', glow: 'shadow-indigo-500/20', border: 'border-indigo-500/30' },
  { icon: Coins, label: 'الحسابات والشؤون المالية', color: 'text-yellow-400', bg: 'bg-yellow-500/15', glow: 'shadow-yellow-500/20', border: 'border-yellow-500/30' },
];

interface EditablePositionItemProps {
  key?: any;
  position: string;
  index: number;
  isReadOnly: boolean;
  activeModal: string | null;
  onUpdate: (index: number, newValue: string) => void;
  onRemove: (pos: string) => void;
}

function EditablePositionItem({
  position,
  index,
  isReadOnly,
  activeModal,
  onUpdate,
  onRemove,
}: EditablePositionItemProps) {
  const [val, setVal] = React.useState(position);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setVal(position);
  }, [position]);

  const handleBlur = () => {
    const trimmed = val.trim();
    if (trimmed && trimmed !== position) {
      onUpdate(index, trimmed);
    } else {
      setVal(position);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  return (
    <div
      className="p-2 bg-slate-950/50 border border-white/5 rounded-xl flex items-center justify-between gap-2 group hover:border-indigo-500/30 transition-all duration-200 cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex items-center gap-2 w-full">
        <Edit2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 shrink-0 transition-colors" />
        <input
          ref={inputRef}
          type="text"
          disabled={isReadOnly || activeModal === 'view'}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="bg-transparent text-slate-200 text-xs font-bold focus:outline-none w-full border-b border-transparent focus:border-indigo-500 text-right focus:text-white transition-all caret-indigo-500"
        />
      </div>

      {(!isReadOnly && activeModal !== 'view') && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(position);
          }}
          className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-white/5 transition-all cursor-pointer shrink-0"
          title="حذف المنصب"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

interface DepartmentBuilderProps {
  departments: Department[];
  userRole: UserRole;
  onSaveDepartments: (depts: Department[]) => void;
  customFieldLabels?: Record<string, string>;
  onUpdateFieldLabel?: (fieldId: string, newLabel: string) => void;
  language: 'ar' | 'en';
  payrollList?: CalculatedPayroll[];
  employees?: Employee[];
}

export default function DepartmentBuilder({
  departments,
  userRole,
  onSaveDepartments,
  customFieldLabels = {},
  onUpdateFieldLabel,
  language = 'ar',
  payrollList = [],
  employees = [],
}: DepartmentBuilderProps) {
  const isReadOnly = userRole === 'DataEntry';

  // State to manage modals
  const [activeModal, setActiveModal] = useState<'create' | 'edit' | 'view' | null>(null);
  
  // Department being active or targeted
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [deptIdToDelete, setDeptIdToDelete] = useState<string | null>(null);

  // Unified Draft state for Create or Edit
  const [draftDept, setDraftDept] = useState<Department | null>(null);
  const [newPositionName, setNewPositionName] = useState('');
  const [modalTab, setModalTab] = useState<'basic' | 'positions' | 'fields' | 'pricing'>('basic');

  // Inline Field Renaming state (within modal)
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingFieldVal, setEditingFieldVal] = useState('');

  // Formatter for Iraq Dinars (IQD)
  const formatIQD = (amount: number | undefined) => {
    const val = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    return formatCurrency(val, language, 'IQD');
  };

  // Helper inside component to get localized/renamed field titles
  const getFieldLabel = (fId: FieldId) => {
    return customFieldLabels[fId] || FIELDS_METADATA.find((m) => m.id === fId)?.label || fId;
  };

  // Initialize unified default fields configuration
  const getDefaultFields = (): { [key in FieldId]?: boolean } => ({
    workingDays: true,
    workingHours: true,
    shiftMorning: false,
    shiftEvening: false,
    shiftMiddle: false,
    shiftFull24: false,
    shiftHalf12: false,
    shiftKhafar: false,
    callouts: false,
    allowanceDanger: false,
    allowanceMarriage: false,
    allowanceChildren: false,
    allowanceDegree: false,
    allowanceExtraDays: false,
    allowanceExtraHours: false,
    allowanceGeneral: false,
    allowanceEsnad: false,
    deductionDays: false,
    deductionHours: false,
    deductionPenalties: false,
    deductionOther: false,
    previousMonthOver: false,
  });

  // Action: Launch Create Modal
  const openCreateModal = () => {
    if (isReadOnly) return;
    setDraftDept({
      id: `dept-${Date.now()}`,
      name: '',
      code: '',
      positions: [],
      iconIndex: 0,
      enabledFields: getDefaultFields(),
      budgetLimit: 0,
      salaryType: 'variable',
      salaryStructureType: 'variable',
      fixedSalary: 0,
      lumpSumSalary: 0,
      lumpSumRepresentative: '',
      managerSalary: 0,
      defaultBasicSalary: 0,
      pricing: {
        basicSalary: 0,
        dayPrice: 0,
        hourPrice: 0,
        shiftMorningPrice: 0,
        shiftEveningPrice: 0,
        shiftMiddlePrice: 0,
        shiftFull24Price: 0,
        shiftHalf12Price: 0,
        shiftKhafarPrice: 0,
        calloutMalePrice: 0,
        calloutFemalePrice: 0,
        calloutManagerPrice: 0,
      },
    });
    setNewPositionName('');
    setModalTab('basic');
    setActiveModal('create');
  };

  // Action: Launch Edit Modal
  const openEditModal = (dept: Department) => {
    if (isReadOnly) return;
    setSelectedDept(dept);
    setDraftDept(JSON.parse(JSON.stringify(dept)));
    setNewPositionName('');
    setModalTab('basic');
    setActiveModal('edit');
  };

  // Action: Launch View Dialog
  const openViewModal = (dept: Department) => {
    setSelectedDept(dept);
    setDraftDept(JSON.parse(JSON.stringify(dept)));
    setModalTab('basic');
    setActiveModal('view');
  };

  // Confirm delete handler
  const confirmDeleteDepartment = () => {
    if (!deptIdToDelete || isReadOnly) return;
    const updated = departments.filter((d) => d.id !== deptIdToDelete);
    onSaveDepartments(updated);
    setDeptIdToDelete(null);
    showToast('تم حذف القسم بالكامل من الهيكلية بنجاح.', 'success');
  };

  // Inside Modal Actions
  const handleAddPositionInDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPositionName.trim() || !draftDept || isReadOnly) return;
    if (draftDept.positions.includes(newPositionName.trim())) {
      showToast('المنصب مضاف مسبقاً في هذا القسم.', 'info');
      return;
    }
    setDraftDept({
      ...draftDept,
      positions: [...draftDept.positions, newPositionName.trim()],
    });
    setNewPositionName('');
  };

  const handleRemovePositionInDraft = (pos: string) => {
    if (!draftDept || isReadOnly) return;
    setDraftDept({
      ...draftDept,
      positions: draftDept.positions.filter((p) => p !== pos),
    });
  };

  const handleUpdatePositionInDraft = (idx: number, newVal: string) => {
    if (!draftDept || isReadOnly) return;
    const updated = [...draftDept.positions];
    updated[idx] = newVal;
    setDraftDept({
      ...draftDept,
      positions: updated,
    });
  };

  const handleToggleFieldInDraft = (fId: FieldId) => {
    if (!draftDept || isReadOnly) return;
    setDraftDept({
      ...draftDept,
      enabledFields: {
        ...draftDept.enabledFields,
        [fId]: !draftDept.enabledFields[fId],
      },
    });
  };

  const handleUpdatePricingInDraft = (field: keyof Department['pricing'], val: number) => {
    if (!draftDept || isReadOnly) return;
    setDraftDept({
      ...draftDept,
      pricing: {
        ...draftDept.pricing,
        [field]: val,
      },
    });
  };

  const handleSaveModalAction = () => {
    if (!draftDept || isReadOnly) return;
    if (!draftDept.name.trim()) {
      showToast('يرجى تحديد اسم القسم أولاً.', 'error');
      setModalTab('basic');
      return;
    }

    let updatedList: Department[] = [];
    if (activeModal === 'create') {
      updatedList = [...departments, draftDept];
      showToast(`تم إنشاء وتفعيل القسم الاستشفائي الجديد "${draftDept.name}" بنجاح!`, 'success');
    } else if (activeModal === 'edit') {
      updatedList = departments.map((d) => (d.id === draftDept.id ? draftDept : d));
      showToast(`تم حفظ وتحديث هيكلية قسم "${draftDept.name}" بكافة الحقول والأسعار الحالية.`, 'success');
    }

    onSaveDepartments(updatedList);
    setActiveModal(null);
    setDraftDept(null);
    setSelectedDept(null);
  };

  // Field inline rename trigger
  const handleSaveFieldRename = (fId: FieldId) => {
    if (!editingFieldVal.trim() || !onUpdateFieldLabel) return;
    onUpdateFieldLabel(fId, editingFieldVal.trim());
    setEditingFieldId(null);
    showToast('تم تعديل مسمى الحقل المحاسبي بنجاح.', 'success');
  };

  // Auto fill standard positions for all departments
  const handleAutoPopulateAllPositions = () => {
    if (isReadOnly) return;
    const updated = departments.map(d => sanitizeDepartmentPositions(d));
    onSaveDepartments(updated);
    showToast('تم استعادة وتعبئة المناصب المخصصة لجميع أقسام المستشفى بنجاح!', 'success');
  };

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header card with system role details */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            الهيكلية التنظيمية وأقسام المستشفى
          </h2>
          <p className="text-slate-400 text-xs font-sans">
            إدارة الأقسام وتحديد صلاحيات ومحاسبة الشفتات والمناصب الطبية والإدارية المعتمدة رسمياً في مستشفى الفرح الأهلي.
          </p>
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleAutoPopulateAllPositions}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/20 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
              title="تعبئة المناصب التلقائية القياسية لجميع الأقسام التي تفتقر للمناصب"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              تعبئة/استعادة مناصب كافة الأقسام
            </button>
            <button
              onClick={openCreateModal}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white border border-white/10 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              إضافة وتأسيس قسم جديد
            </button>
          </div>
        )}
      </div>

      {isReadOnly && (
        <div className="bg-amber-500/10 border border-amber-500/15 text-amber-200 rounded-xl p-3 text-xs flex gap-2.5 items-start max-w-4xl no-print">
          <Lock className="w-4 h-4 mt-0.5 shrink-0 text-amber-300" />
          <p>
            <span className="font-semibold">تنبيه متعلق بالصلاحية:</span> الحساب الحالي بصفة "مدخل بيانات". إنشاء الأقسام، تعديل تسعير الشفتات وتأشير صلاحيات الخصومات والعقوبات مقتصر فقط على مديري النظام المالي (مثال: الشريك والمسؤول الفني محمد الفرح).
          </p>
        </div>
      )}

      {/* Directory structure cards list */}
      {departments.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center text-slate-500 text-xs min-h-[300px] flex flex-col justify-center items-center gap-4">
          <Building2 className="w-12 h-12 text-slate-700" />
          <p className="max-w-md leading-relaxed">
            لم يتم إنشاء وتأسيس أي قسم تنظيمي بعد في كشوف الأجور. يمكنك الضغط على زر إضافة بالشرير بالأعلى لتأسيس أول قسم استشفائي.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => {
            const iconIndex = dept.iconIndex !== undefined ? dept.iconIndex : 0;
            const iconObj = DEPT_ICON_TEMPLATES[iconIndex] || DEPT_ICON_TEMPLATES[0];
            const IconComp = iconObj.icon;

            // Calculate total net salaries spent currently in this department
            const deptEmployees = employees.filter((e) => e.departmentId === dept.id);
            const totalSalarySpent = payrollList
              .filter((p) => p.employeeId && deptEmployees.some(e => e.id === p.employeeId))
              .reduce((sum, p) => sum + p.netSalary, 0);

            const hasExceededBudget = !!dept.budgetLimit && dept.budgetLimit > 0 && totalSalarySpent > dept.budgetLimit;

            return (
              <motion.div
                key={dept.id}
                layoutId={`dept-card-${dept.id}`}
                className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 space-y-4 hover:border-slate-700/85 transition-all flex flex-col justify-between shadow-xl shadow-slate-950/10 hover:shadow-slate-950/30 group relative overflow-hidden"
              >
                <div className="space-y-4">
                  {/* Card Header: Icon + Name */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center p-2 border ${iconObj.bg} ${iconObj.color} ${iconObj.border} shadow-lg ${iconObj.glow} transition-transform group-hover:scale-110`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-white group-hover:text-blue-300 transition-colors">
                          {dept.name}
                        </h3>
                        <span className="text-xs text-slate-400 font-semibold block mt-1">
                          {dept.code && (
                            <span className="bg-cyan-500/10 text-cyan-300 px-1.5 py-0.5 rounded mr-1 text-[10px] font-black">
                              رقم القسم: {dept.code}
                            </span>
                          )}
                          رمز الهيكل: <span className="font-mono text-slate-300">{dept.id}</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-left shrink-0">
                      {(() => {
                        const sStruct = dept.salaryStructureType || (
                          dept.salaryType === 'fixed' ? 'fixed_unified' :
                          dept.salaryType === 'shifts' ? 'shifts' :
                          dept.salaryType === 'day' ? 'daily' :
                          (dept.salaryType === 'lumpSum' || dept.isLumpSum) ? 'lump_sum' :
                          dept.salaryType === 'callout' ? 'call_out' : 'variable'
                        );
                        const badgeInfo = (() => {
                          switch (sStruct) {
                            case 'fixed_unified':
                              return { label: 'راتب ثابت موحد', style: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/15' };
                            case 'lump_sum':
                              return { label: 'راتب قطعي للقسم', style: 'bg-amber-500/10 text-amber-300 border border-amber-500/15' };
                            case 'shifts':
                              return { label: 'راتب بنظام الشفتات', style: 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/15' };
                            case 'daily':
                              return { label: 'راتب بنظام اليوم', style: 'bg-blue-500/10 text-blue-300 border border-blue-500/15' };
                            case 'call_out':
                              return { label: 'راتب بنظام الاستدعاء', style: 'bg-purple-500/10 text-purple-300 border border-purple-500/15' };
                            default:
                              return { label: 'راتب خارجي متغير', style: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/15' };
                          }
                        })();
                        return (
                          <span className={`px-2.5 py-1 rounded text-[11px] font-black font-sans ${badgeInfo.style}`}>
                            {badgeInfo.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-[1px] bg-slate-800/50" />

                  {/* Positions Section */}
                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-300 font-bold block flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                      المناصب المخصصة بالهيكل ({dept.positions.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {dept.positions.length === 0 ? (
                        <span className="text-xs text-slate-500 font-sans italic">لا توجد مناصب مضافة.</span>
                      ) : (
                        dept.positions.map((p, pIdx) => (
                          <span key={pIdx} className="px-2.5 py-1 bg-slate-950/65 text-slate-200 text-xs rounded-md border border-slate-850 font-medium">
                            {p}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Permissions/Enabled fields Section */}
                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-300 font-bold block flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                      صلاحية الحقول والرواتب النشطة:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {/* Check dynamic active fields */}
                      {FIELDS_METADATA.map((f) => {
                        const isEnabled = dept.enabledFields[f.id];
                        if (!isEnabled) return null;
                        return (
                          <span
                            key={f.id}
                            title={f.description}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-950/25 text-blue-300 text-[10px] rounded border border-blue-900/40 font-bold"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                            {getFieldLabel(f.id)}
                          </span>
                        );
                      })}
                      {/* If no special fields enabled */}
                      {Object.values(dept.enabledFields).every((v) => !v) && (
                        <span className="text-xs text-slate-500 font-sans italic">لم يتم تفعيل أي حقول محاسبية بعد.</span>
                      )}
                    </div>
                  </div>

                  {/* Summary Rates info */}
                  <div className="p-3.5 bg-slate-950/45 rounded-2xl border border-slate-800/80 flex justify-between items-center text-xs text-slate-200">
                    <div>
                      <span className="block font-sans text-[10px] text-slate-400 font-bold mb-0.5">حساب اليومية:</span>
                      <strong className="text-amber-400 font-mono font-black text-sm">{formatIQD(dept.pricing.dayPrice)}</strong>
                    </div>
                    <div className="h-8 w-[1px] bg-slate-800" />
                    <div>
                      <span className="block font-sans text-[10px] text-slate-400 font-bold mb-0.5">ساعة إضافية/تأخير:</span>
                      <strong className="text-cyan-400 font-mono font-black text-sm">{formatIQD(dept.pricing.hourPrice)}</strong>
                    </div>
                    <div className="h-8 w-[1px] bg-slate-800" />
                    <div>
                      <span className="block font-sans text-[10px] text-slate-400 font-bold mb-0.5">شفتات/استدعاءات:</span>
                      <strong className="text-emerald-400 font-sans font-black text-xs">
                        {Object.keys(dept.pricing).some(k => k.endsWith('Price') && (dept.pricing as any)[k] > 0) ? 'مُسعّرة ✅' : 'غير مسعّرة ❌'}
                      </strong>
                    </div>
                  </div>

                  {/* Financial Ceiling & Budget Status */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/30 border border-slate-800/65 space-y-2.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-350 font-bold flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-blue-400" />
                        السقف المالي الشهري:
                      </span>
                      <span className="font-mono font-black text-rose-300 text-sm">
                        {dept.budgetLimit && dept.budgetLimit > 0 ? formatIQD(dept.budgetLimit) : 'غير محدد'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-350 font-bold flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-indigo-400" />
                        إجمالي الرواتب الحالية:
                      </span>
                      <span className={`font-mono font-black text-sm ${hasExceededBudget ? 'text-red-400 font-extrabold animate-pulse' : 'text-slate-200'}`}>
                        {formatIQD(totalSalarySpent)}
                      </span>
                    </div>

                    {dept.budgetLimit && dept.budgetLimit > 0 ? (
                      <div className="space-y-1.5">
                        <div className="w-full bg-slate-950/70 rounded-full h-2 overflow-hidden border border-white/5">
                          <div 
                            className={`h-full transition-all duration-300 rounded-full ${hasExceededBudget ? 'bg-gradient-to-r from-red-600 to-amber-500' : 'bg-gradient-to-r from-emerald-500 to-blue-500'}`} 
                            style={{ width: `${Math.min(100, (totalSalarySpent / dept.budgetLimit) * 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10.5px] text-slate-450">
                          <span className="font-bold">نسبة الاستغلال: {Math.round((totalSalarySpent / dept.budgetLimit) * 100)}%</span>
                          {hasExceededBudget && (
                            <span className="text-red-400 font-black bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 animate-pulse flex items-center gap-1">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              لقد تجاوزت السقف المالي
                            </span>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-slate-800/40 mt-4 h-10">
                  <button
                    onClick={() => openViewModal(dept)}
                    className="flex-1 py-2 bg-slate-955/65 hover:bg-slate-800/80 text-blue-300 font-extrabold border border-slate-800 text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Info className="w-4 h-4" />
                    مشاهدة الصلاحيات
                  </button>

                  {!isReadOnly && (
                    <>
                      <button
                        onClick={() => openEditModal(dept)}
                        className="py-2 px-3.5 bg-indigo-650/15 hover:bg-indigo-600/30 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-300 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                      >
                        <Edit2 className="w-3.8 h-3.8" />
                        تعديل الكلي
                      </button>

                      <button
                        onClick={() => setDeptIdToDelete(dept.id)}
                        className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/15 rounded-xl cursor-pointer transition-all shrink-0 active:scale-95"
                        title="حذف القسم"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Unified Master Modal - Create / Edit / View / Customize */}
      <AnimatePresence>
        {activeModal !== null && draftDept !== null && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex justify-center items-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl text-right font-sans"
            >
              {/* Modal Core Header */}
              <div className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-950/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {activeModal === 'create'
                        ? 'تأسيس وإنشاء قسم محاسبي متكامل'
                        : activeModal === 'edit'
                        ? `تعديل هيكلية وصلاحيات قسم: ${selectedDept?.name}`
                        : `مشاهدة معلومات وصلاحيات كشف: ${selectedDept?.name}`}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-sans">
                      {isReadOnly ? 'معاينة هيكل القسم فقط دون صلاحيات الحفظ والتعديل المالي' : 'تفعيل الحقول وإنشاء المناصب وتسعير معاملات شفتات الكادر'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1 px-1.5 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Tabs Navigation Header */}
              <div className="flex border-b border-white/10 bg-slate-950/20 p-1 divide-x divide-white/5 divide-x-reverse">
                <button
                  type="button"
                  onClick={() => setModalTab('basic')}
                  className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg cursor-pointer transition-all ${
                    modalTab === 'basic' ? 'bg-blue-600/20 text-blue-300 border border-blue-500/15' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ١. مسمى وأيقونة القسم
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('positions')}
                  className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg cursor-pointer transition-all ${
                    modalTab === 'positions' ? 'bg-blue-600/20 text-blue-300 border border-blue-500/15' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ٢. المناصب التابعة في الهيكل ({draftDept.positions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('fields')}
                  className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg cursor-pointer transition-all ${
                    modalTab === 'fields' ? 'bg-blue-600/20 text-blue-300 border border-blue-500/15' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ٣. تفعيل واطفاء حقول الكشف (صلاحيات القسم)
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('pricing')}
                  className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg cursor-pointer transition-all ${
                    modalTab === 'pricing' ? 'bg-blue-600/20 text-blue-300 border border-blue-500/15' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ٤. هيكل الرواتب وجدول التسعير
                </button>
              </div>

              {/* Modal Central Content - Tab Switcher */}
              <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-slate-900/40 min-h-[350px]">
                
                {/* TAB 1: Basic Info */}
                {modalTab === 'basic' && (
                  <div className="space-y-4 animate-scale-up">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-white">اسم القسم الاستشفائي الجديد:</label>
                      <input
                        type="text"
                        disabled={isReadOnly || activeModal === 'view'}
                        value={draftDept.name}
                        onChange={(e) => setDraftDept({ ...draftDept, name: e.target.value })}
                        placeholder="مثال: قسم التخدير وصالات الولادة"
                        className="w-full px-4 py-2.5 bg-slate-950/50 border border-white/10 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-white flex items-center justify-start gap-1">
                        {language === 'ar' ? 'رمز أو رقم القسم (اختياري):' : 'Department Code / Number (Optional):'}
                      </label>
                      <input
                        type="text"
                        disabled={isReadOnly || activeModal === 'view'}
                        value={draftDept.code || ''}
                        onChange={(e) => setDraftDept({ ...draftDept, code: e.target.value })}
                        placeholder={language === 'ar' ? 'مثال: DEPT101 أو 15' : 'e.g. DEPT101 or 15'}
                        className="w-full px-4 py-2.5 bg-slate-950/50 border border-white/10 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-white flex items-center gap-1.5 justify-start" dir="rtl">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                        السقف المالي للرواتب الشهري للقسم (دينار عراقي - اختياري):
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          disabled={isReadOnly || activeModal === 'view'}
                          value={draftDept.budgetLimit || ''}
                          onChange={(e) => setDraftDept({ ...draftDept, budgetLimit: e.target.value ? Number(e.target.value) : undefined })}
                          placeholder="مثال: 15000000 (أدخل 0 أو اتركه فارغاً لبيان سقف مال غير محدد)"
                          className="w-full pl-12 pr-4 py-2.5 bg-slate-950/50 border border-white/10 rounded-xl text-white text-xs font-mono font-semibold focus:outline-none focus:border-blue-500 transition-colors"
                          dir="ltr"
                          style={{ textAlign: 'right' }}
                        />
                        <span className="absolute left-3 top-2.5 text-[10px] text-slate-500 font-bold select-none">
                          د.ع
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 text-right">
                        تحديد السقف المالي/الميزانية القصوى لرواتب القسم، لتنبيهك في حال تجاوز مجموع الكشوفات لهذا المبلغ.
                      </p>
                    </div>

                    {/* rules of leaves, multi-shift configurations, and late-deductions */}
                    <div className="h-[1px] bg-white/5" />
                    <div className="bg-slate-950/40 p-4 rounded-2.5xl border border-white/5 space-y-4 shadow-inner" dir="rtl">
                      <h4 className="text-xs font-bold text-blue-400 flex items-center gap-1.5 justify-start">
                        <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                        حضور الكادر، نظام الشفتات، وخصومات التأخر:
                      </h4>

                       {/* Shift Type Select */}
                       <div className="space-y-1.5 text-right">
                         <label className="block text-xs font-bold text-white">نظام دوام الكادر بالقسم:</label>
                         <select
                           disabled={isReadOnly || activeModal === 'view'}
                           value={draftDept.shiftType || 'single'}
                           onChange={(e) => setDraftDept({ ...draftDept, shiftType: e.target.value as any })}
                           className="w-full px-4 py-2.5 bg-slate-950/50 border border-white/10 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                         >
                           <option value="single" className="bg-slate-900 text-white font-bold">شفت واحد ثابت لجميع الكادر</option>
                           <option value="multi_shift" className="bg-slate-900 text-white font-bold">نظام شفتات متعددة (حتى 4 شفتات متداخلة)</option>
                           <option value="flexible" className="bg-slate-900 text-white font-bold">دوام مفتوح (مرن - مبني على ساعات التواجد)</option>
                         </select>
                       </div>

                       {/* Single Shift Time Range Customization */}
                       {(draftDept.shiftType === 'single' || !draftDept.shiftType) && (
                         <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 space-y-2">
                           <p className="text-[11px] text-yellow-400 font-bold">تحديد ساعات الشفت الثابت للقسم:</p>
                           <div className="flex items-center gap-3 bg-slate-950/50 p-2.5 rounded-lg">
                             <div className="w-1/2 space-y-1 text-right">
                               <span className="text-[10px] text-slate-400 font-bold block">وقت الحضور (البداية):</span>
                               <select
                                                                 disabled={isReadOnly || activeModal === 'view'}
                                                                 value={draftDept.s1Start || '08:00'}
                                                                 onChange={(e) => setDraftDept({ ...draftDept, s1Start: e.target.value })}
                                                                 className="w-full p-2 bg-slate-950 border border-white/10 rounded-lg text-white text-xs font-bold text-center cursor-pointer focus:border-blue-500 focus:outline-none"
                                                               >
                                                                 {TIME_SLOT_OPTIONS.map((opt) => (
                                                                   <option key={opt.val} value={opt.val} className="bg-slate-900 text-white font-bold text-right">
                                                                     {opt.label}
                                                                   </option>
                                                                 ))}
                                                               </select>
                             </div>
                             <div className="w-1/2 space-y-1 text-right">
                               <span className="text-[10px] text-slate-400 font-bold block">وقت الانصراف (النهاية):</span>
                               <select
                                                                 disabled={isReadOnly || activeModal === 'view'}
                                                                 value={draftDept.s1End || '14:00'}
                                                                 onChange={(e) => setDraftDept({ ...draftDept, s1End: e.target.value })}
                                                                 className="w-full p-2 bg-slate-950 border border-white/10 rounded-lg text-white text-xs font-bold text-center cursor-pointer focus:border-blue-500 focus:outline-none"
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
                       )}

                       {/* Flexible Shift Description */}
                       {draftDept.shiftType === 'flexible' && (
                         <div className="p-3.5 bg-sky-950/30 rounded-xl border border-sky-500/20 text-right space-y-1">
                           <p className="text-xs font-bold text-sky-400">💡 نظام مرن (مفتوح خلال 24 ساعة):</p>
                           <p className="text-[10px] text-slate-300 leading-relaxed font-semibold">
                             يُمكن للموظف البصم في أي وقت خلال اليوم الكامل (24 ساعة). يحسب له حضور يوم كامل عند احتساب فرق الوقت بين البصمة الأولى والأخيرة وتجاوزها 6 ساعات. لا يتم احتساب غرامات تأخر تأخيرية في هذا النظام.
                           </p>
                         </div>
                       )}

                       {/* Multi-Shifts Dynamic Active Config */}
                       {draftDept.shiftType === 'multi_shift' && (
                         <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 space-y-3">
                           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/5 pb-2">
                             <p className="text-[11px] text-slate-300 font-bold">نظام شفتات متعددة متداخلة:</p>
                             <div className="flex items-center gap-2">
                               <label className="text-[10px] text-white font-bold shrink-0">عدد الشفتات النشطة:</label>
                               <select
                                 disabled={isReadOnly || activeModal === 'view'}
                                 value={draftDept.activeShiftsCount || 4}
                                 onChange={(e) => setDraftDept({ ...draftDept, activeShiftsCount: Number(e.target.value) })}
                                 className="px-2.5 py-1 bg-slate-950 border border-white/10 rounded text-white text-xs font-bold cursor-pointer focus:outline-none"
                               >
                                 <option value={1}>شفت واحد (1)</option>
                                 <option value={2}>شفتين (2)</option>
                                 <option value={3}>3 شفتات</option>
                                 <option value={4}>4 شفتات كاملة</option>
                               </select>
                             </div>
                           </div>

                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                             {/* Shift 1 */}
                             {(Number(draftDept.activeShiftsCount || 4) >= 1) && (
                               <div className="bg-slate-950/50 p-2.5 rounded-lg space-y-1.5">
                                 <span className="text-[11px] font-bold text-yellow-400">الشفت 1 (الصباحي):</span>
                                 <div className="flex items-center gap-1.5">
                                   <select
                                                                         disabled={isReadOnly || activeModal === 'view'}
                                                                         value={draftDept.s1Start || '08:00'}
                                                                         onChange={(e) => setDraftDept({ ...draftDept, s1Start: e.target.value })}
                                                                         className="w-1/2 p-1.5 bg-slate-950 border border-white/10 rounded text-white text-xs font-bold text-center cursor-pointer focus:border-blue-500 focus:outline-none"
                                                                       >
                                                                         {TIME_SLOT_OPTIONS.map((opt) => (
                                                                           <option key={opt.val} value={opt.val} className="bg-slate-900 text-white font-bold text-right">
                                                                             {opt.label}
                                                                           </option>
                                                                         ))}
                                                                       </select>
                                   <span className="text-[10px] text-slate-400">إلى</span>
                                   <select
                                                                         disabled={isReadOnly || activeModal === 'view'}
                                                                         value={draftDept.s1End || '14:00'}
                                                                         onChange={(e) => setDraftDept({ ...draftDept, s1End: e.target.value })}
                                                                         className="w-1/2 p-1.5 bg-slate-950 border border-white/10 rounded text-white text-xs font-bold text-center cursor-pointer focus:border-blue-500 focus:outline-none"
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

                             {/* Shift 2 */}
                             {(Number(draftDept.activeShiftsCount || 4) >= 2) && (
                               <div className="bg-slate-950/50 p-2.5 rounded-lg space-y-1.5">
                                 <span className="text-[11px] font-bold text-blue-400">الشفت 2 (المسائي):</span>
                                 <div className="flex items-center gap-1.5">
                                   <select
                                                                         disabled={isReadOnly || activeModal === 'view'}
                                                                         value={draftDept.s2Start || '14:00'}
                                                                         onChange={(e) => setDraftDept({ ...draftDept, s2Start: e.target.value })}
                                                                         className="w-1/2 p-1.5 bg-slate-950 border border-white/10 rounded text-white text-xs font-bold text-center cursor-pointer focus:border-blue-500 focus:outline-none"
                                                                       >
                                                                         {TIME_SLOT_OPTIONS.map((opt) => (
                                                                           <option key={opt.val} value={opt.val} className="bg-slate-900 text-white font-bold text-right">
                                                                             {opt.label}
                                                                           </option>
                                                                         ))}
                                                                       </select>
                                   <span className="text-[10px] text-slate-400">إلى</span>
                                   <select
                                                                         disabled={isReadOnly || activeModal === 'view'}
                                                                         value={draftDept.s2End || '20:00'}
                                                                         onChange={(e) => setDraftDept({ ...draftDept, s2End: e.target.value })}
                                                                         className="w-1/2 p-1.5 bg-slate-950 border border-white/10 rounded text-white text-xs font-bold text-center cursor-pointer focus:border-blue-500 focus:outline-none"
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

                             {/* Shift 3 */}
                             {(Number(draftDept.activeShiftsCount || 4) >= 3) && (
                               <div className="bg-slate-950/50 p-2.5 rounded-lg space-y-1.5">
                                 <span className="text-[11px] font-bold text-purple-400">الشفت 3 (الليلي):</span>
                                 <div className="flex items-center gap-1.5">
                                   <select
                                                                         disabled={isReadOnly || activeModal === 'view'}
                                                                         value={draftDept.s3Start || '20:00'}
                                                                         onChange={(e) => setDraftDept({ ...draftDept, s3Start: e.target.value })}
                                                                         className="w-1/2 p-1.5 bg-slate-950 border border-white/10 rounded text-white text-xs font-bold text-center cursor-pointer focus:border-blue-500 focus:outline-none"
                                                                       >
                                                                         {TIME_SLOT_OPTIONS.map((opt) => (
                                                                           <option key={opt.val} value={opt.val} className="bg-slate-900 text-white font-bold text-right">
                                                                             {opt.label}
                                                                           </option>
                                                                         ))}
                                                                       </select>
                                   <span className="text-[10px] text-slate-400">إلى</span>
                                   <select
                                                                         disabled={isReadOnly || activeModal === 'view'}
                                                                         value={draftDept.s3End || '02:00'}
                                                                         onChange={(e) => setDraftDept({ ...draftDept, s3End: e.target.value })}
                                                                         className="w-1/2 p-1.5 bg-slate-950 border border-white/10 rounded text-white text-xs font-bold text-center cursor-pointer focus:border-blue-500 focus:outline-none"
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

                             {/* Shift 4 */}
                             {(Number(draftDept.activeShiftsCount || 4) >= 4) && (
                               <div className="bg-slate-950/50 p-2.5 rounded-lg space-y-1.5">
                                 <span className="text-[11px] font-bold text-emerald-400">الشفت 4 (خفارة مبيت / مستمر):</span>
                                 <div className="flex items-center gap-1.5">
                                   <select
                                                                         disabled={isReadOnly || activeModal === 'view'}
                                                                         value={draftDept.s4Start || '02:00'}
                                                                         onChange={(e) => setDraftDept({ ...draftDept, s4Start: e.target.value })}
                                                                         className="w-1/2 p-1.5 bg-slate-950 border border-white/10 rounded text-white text-xs font-bold text-center cursor-pointer focus:border-blue-500 focus:outline-none"
                                                                       >
                                                                         {TIME_SLOT_OPTIONS.map((opt) => (
                                                                           <option key={opt.val} value={opt.val} className="bg-slate-900 text-white font-bold text-right">
                                                                             {opt.label}
                                                                           </option>
                                                                         ))}
                                                                       </select>
                                   <span className="text-[10px] text-slate-400">إلى</span>
                                   <select
                                                                         disabled={isReadOnly || activeModal === 'view'}
                                                                         value={draftDept.s4End || '08:00'}
                                                                         onChange={(e) => setDraftDept({ ...draftDept, s4End: e.target.value })}
                                                                         className="w-1/2 p-1.5 bg-slate-950 border border-white/10 rounded text-white text-xs font-bold text-center cursor-pointer focus:border-blue-500 focus:outline-none"
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
                           </div>
                         </div>
                       )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5 text-right">
                          <label className="block text-xs font-bold text-white">عدد أيام الإجازات المسموحة شهرياً:</label>
                          <input
                            type="number"
                            min="0"
                            disabled={isReadOnly || activeModal === 'view'}
                            value={draftDept.allowedPaidLeaves !== undefined ? draftDept.allowedPaidLeaves : 0}
                            onChange={(e) => setDraftDept({ ...draftDept, allowedPaidLeaves: Number(e.target.value) })}
                            className="w-full px-4 py-2.5 bg-slate-950/50 border border-white/10 rounded-xl text-white text-xs font-bold text-center focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="أدخل عدد الأيام"
                          />
                          <p className="text-[10px] text-slate-400 font-bold">رصيد الإجازات المسموح به براتب دون اقتطاع.</p>
                        </div>

                        <div className="space-y-1.5 text-right">
                          <label className="block text-xs font-bold text-white">مضاعف خصم الغياب (أيام):</label>
                          <input
                            type="number"
                            step="0.5"
                            min="1"
                            disabled={isReadOnly || activeModal === 'view'}
                            value={draftDept.absenceDeductionRate !== undefined ? draftDept.absenceDeductionRate : 1.0}
                            onChange={(e) => setDraftDept({ ...draftDept, absenceDeductionRate: Number(e.target.value) })}
                            className="w-full px-4 py-2.5 bg-slate-950/50 border border-white/10 rounded-xl text-white text-xs font-bold text-center focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="مثال: 1.0 أو 1.5"
                          />
                          <p className="text-[10px] text-slate-400 font-bold">معدل الخصم اليومي عند الغياب غير المسموح للقسم.</p>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-right">
                        <label className="block text-xs font-bold text-white">قاعدة احتساب يوم الجمعة للقسم:</label>
                        <select
                          disabled={isReadOnly || activeModal === 'view'}
                          value={draftDept.fridayRule || 'paid_holiday'}
                          onChange={(e) => setDraftDept({ ...draftDept, fridayRule: e.target.value as any })}
                          className="w-full px-4 py-2.5 bg-slate-950/50 border border-white/10 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                          style={{ direction: 'rtl' }}
                        >
                          <option value="paid_holiday" className="bg-slate-900 text-white font-bold">الجمعة عطلة رسمية مدفوعة (يُمنح حضوراً تلقائياً)</option>
                          <option value="working_day" className="bg-slate-900 text-white font-bold">الجمعة يوم دوام رسمي / خفارات (بناءً على البصمة فقط)</option>
                        </select>
                        <p className="text-[10px] text-slate-400 font-bold">تحديد طريقة التعامل مع أيام الجمعة من وجهة نظر البصمة.</p>
                      </div>

                      {/* Deduction Method & Fixed Hour Rate */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5 text-right">
                          <label className="block text-xs font-bold text-white">آلية احتساب خصومات التأخير:</label>
                          <select
                            disabled={isReadOnly || activeModal === 'view'}
                            value={draftDept.deductionMethod || 'proportional'}
                            onChange={(e) => setDraftDept({ ...draftDept, deductionMethod: e.target.value as any })}
                            className="w-full px-4 py-2.5 bg-slate-950/50 border border-white/10 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                          >
                            <option value="proportional" className="bg-slate-900 text-white font-bold">نسبي تلقائي من الراتب الكلي</option>
                            <option value="fixed_hour" className="bg-slate-900 text-white font-bold">مبلغ مقطوع ثابت لكل ساعة</option>
                          </select>
                        </div>

                        <div className="space-y-1.5 text-right">
                          <label className={`block text-xs font-bold ${draftDept.deductionMethod === 'fixed_hour' ? 'text-white' : 'text-slate-500'}`}>
                            مبلغ الغرامة لكل ساعة تأخر (د.ع):
                          </label>
                          <input
                            type="number"
                            step="1000"
                            min="0"
                            disabled={isReadOnly || activeModal === 'view' || draftDept.deductionMethod !== 'fixed_hour'}
                            value={draftDept.fixedHourRate !== undefined ? draftDept.fixedHourRate : 0}
                            onChange={(e) => setDraftDept({ ...draftDept, fixedHourRate: Number(e.target.value) })}
                            className="w-full px-4 py-2.5 bg-slate-950/50 border border-white/10 rounded-xl text-white text-xs font-bold text-center focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-40 font-sans"
                            placeholder="مثال: 5000"
                          />
                        </div>
                      </div>

                      {/* Advanced Financial/Payroll Features Section */}
                      <div className="bg-slate-950/45 border border-white/10 rounded-2xl p-4 space-y-4 text-right" dir="rtl">
                        <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 justify-start">
                          <span>⚙️ الميزات المالية المتقدمة (مستشفى الفرح الأهلي)</span>
                        </h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5 text-right">
                            <label className="block text-xs font-bold text-white">سعر الساعة الإضافية بالدينار (Overtime Rate):</label>
                            <input
                              type="number"
                              step="500"
                              min="0"
                              disabled={isReadOnly || activeModal === 'view'}
                              value={draftDept.overtimeHourRate !== undefined ? draftDept.overtimeHourRate : 0}
                              onChange={(e) => setDraftDept({ ...draftDept, overtimeHourRate: Number(e.target.value) })}
                              className="w-full px-4 py-2.5 bg-slate-950/50 border border-white/10 rounded-xl text-amber-200 text-xs font-bold text-center focus:outline-none focus:border-blue-500 transition-colors font-sans"
                              placeholder="مثال: 5000"
                            />
                            <p className="text-[9px] text-slate-400 font-bold">أجر الساعة الإضافية الواحدة للموظف عند تجاوز ساعات الشفت الرسمية.</p>
                          </div>

                          <div className="space-y-1.5 text-right">
                            <label className="block text-xs font-bold text-white">الحد الأقصى للخصم اليومي (Daily Penalty Cap):</label>
                            <input
                              type="number"
                              step="1"
                              min="0"
                              disabled={isReadOnly || activeModal === 'view'}
                              value={draftDept.maxDailyDeductionCap !== undefined ? draftDept.maxDailyDeductionCap : 100}
                              onChange={(e) => setDraftDept({ ...draftDept, maxDailyDeductionCap: Number(e.target.value) })}
                              className="w-full px-4 py-2.5 bg-slate-950/50 border border-white/10 rounded-xl text-amber-200 text-xs font-bold text-center focus:outline-none focus:border-blue-500 transition-colors font-sans"
                              placeholder="مثال: 100 لـ 100%"
                            />
                            <p className="text-[9px] text-slate-400 font-bold">الحد الأقصى لعقوبة الغياب/التأخر اليومية (أقل من أو يساوي 100 تعتبر كنسبة % من الراتب اليومي، أكبر من 100 كقيمة ثابتة بالدينار).</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-2.5 bg-slate-950/30 rounded-xl border border-white/5">
                          <div className="space-y-0.5 text-right">
                            <span className="text-xs font-bold text-white block">تفعيل تقريب العملة العراقية (IQD):</span>
                            <span className="text-[9.5px] text-slate-400 font-bold leading-normal block">عند تفعيل هذا الخيار، سيتم تقريب المجموع النهائي للخصومات وصافي راتب الموظف لأقرب 250 دينار عراقي لمطابقة التوزيع المالي النقدي.</span>
                          </div>
                          <div>
                            <input
                              type="checkbox"
                              disabled={isReadOnly || activeModal === 'view'}
                              checked={!!draftDept.enableIraqiRounding}
                              onChange={(e) => setDraftDept({ ...draftDept, enableIraqiRounding: e.target.checked })}
                              className="w-4 h-4 rounded text-blue-500 bg-slate-900 border-white/10 focus:ring-blue-500 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="h-[1px] bg-white/5" />

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                        أيقونات مميزة واحترافية للقسم الاستشاري:
                      </label>
                      <p className="text-[10px] text-slate-500">اختر أيقونة معبرة تنعكس على لوحات الرواتب والتصفيات بالقسم:</p>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-950/40 rounded-2xl border border-white/5">
                        {DEPT_ICON_TEMPLATES.map((item, idx) => {
                          const IconComponent = item.icon;
                          const isSelected = draftDept.iconIndex === idx;
                          return (
                            <button
                              key={idx}
                              type="button"
                              disabled={isReadOnly || activeModal === 'view'}
                              onClick={() => setDraftDept({ ...draftDept, iconIndex: idx })}
                              className={`p-3 rounded-xl border text-right transition-all flex items-center gap-2.5 ${
                                isSelected
                                  ? `${item.bg} ${item.border} ${item.color} font-bold scale-[1.03] shadow-lg shadow-blue-950/20`
                                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                              }`}
                            >
                              <div className={`p-1.5 rounded-lg border ${isSelected ? 'bg-slate-900 border-white/20' : 'bg-slate-950/40 border-white/5'}`}>
                                <IconComponent className="w-4 h-4 shrink-0" />
                              </div>
                              <span className="text-[11px] truncate">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Positions Builder */}
                {modalTab === 'positions' && (
                  <div className="space-y-4 animate-scale-up">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-1.5">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-indigo-400" />
                        المناصب الطبية والإدارية النشطة في هيكل هذا القسم
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        قم بتحديد المسميات الوظيفية المتاحة لأعضاء كشف هذا القسم لتظهر كعناصر للاختيار. يمكنك التعديل المباشر بالتسميات بالضغط عليها.
                      </p>
                    </div>

                    {/* Positions listing */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 py-1">
                      {draftDept.positions.length === 0 ? (
                        <div className="col-span-full py-8 text-center text-[11px] text-slate-500 italic">
                          لم يتم إدراج أي مسميات مناصب لهذا القسم. استخدم شريط الإدخال بالأسفل لتسجيل أول منصب.
                        </div>
                      ) : (
                        draftDept.positions.map((p, idx) => (
                          <EditablePositionItem
                            key={idx}
                            position={p}
                            index={idx}
                            isReadOnly={isReadOnly}
                            activeModal={activeModal}
                            onUpdate={handleUpdatePositionInDraft}
                            onRemove={handleRemovePositionInDraft}
                          />
                        ))
                      )}
                    </div>

                    {/* Form to add a new position */}
                    {(!isReadOnly && activeModal !== 'view') && (
                      <form onSubmit={handleAddPositionInDraft} className="flex gap-2.5 pt-4 border-t border-white/5">
                        <input
                          type="text"
                          required
                          value={newPositionName}
                          onChange={(e) => setNewPositionName(e.target.value)}
                          placeholder="مثال: معاون مخدر أقدم، طبيب مقيم متكامل، ممرض جامعي، معاون أمني"
                          className="flex-1 px-3 py-2.5 bg-slate-950/50 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 text-right"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          إضافة المنصـب
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* TAB 3: Enabled Fields with customized names */}
                {modalTab === 'fields' && (
                  <div className="space-y-6 animate-scale-up">
                    <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl space-y-1.5 shadow-md">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5 border-b border-white/5 pb-2">
                        <Settings className="w-4 h-4 text-indigo-400" />
                        صلاحية الحقول وتأشير أعمدة الحسابات المفعّلة للقسم
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed text-right">
                        اختر الحقول الحسابية والخصومات التي ستكون نشطة لمنتسبي هذا القسم. <span className="text-yellow-455 font-semibold bg-yellow-500/10 px-1 rounded">يمكنك تعديل أي مسمى حقل ليطابق نظامكم بالضغط على أيقونة القلم بجواره وتعديل الاسم مباشرة!</span>
                      </p>
                    </div>

                    <div className="hidden">
                      <div className="bg-slate-950/30 p-4 rounded-2xl border border-white/5 space-y-3">
                        <h4 className="text-xs font-semibold text-blue-400 border-b border-white/10 pb-2 flex items-center gap-2">
                          <Settings className="w-3.5 h-3.5 text-blue-400 animate-spin" style={{ animationDuration: '4s' }} />
                          تفعيل مخصصات واستقطاعات الكشف وقسم الرواتب النشط
                        </h4>
                        <div className="space-y-2.5">
                          {FIELDS_METADATA.filter(
                            (f) =>
                              f.category === 'allowances' ||
                              f.category === 'deductions' ||
                              f.category === 'adjustment'
                          ).map((f) => {
                            const isChecked = draftDept.enabledFields[f.id];
                            const isEditingCurrent = editingFieldId === f.id;
                            return (
                              <div
                                key={f.id}
                                className="flex items-center justify-between p-1.5 hover:bg-white/5 rounded-xl transition-all"
                              >
                                <label className="flex items-start gap-2.5 select-none cursor-pointer flex-1 min-w-0">
                                  <input
                                    type="checkbox"
                                    disabled={isReadOnly || activeModal === 'view'}
                                    checked={isChecked}
                                    onChange={() => handleToggleFieldInDraft(f.id)}
                                    className="mt-0.5 rounded text-indigo-500 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                                  />
                                  <div className="flex-1 min-w-0">
                                    {isEditingCurrent ? (
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <input
                                          type="text"
                                          value={editingFieldVal}
                                          onChange={(e) => setEditingFieldVal(e.target.value)}
                                          className="px-2 py-0.5 bg-slate-900 border border-blue-500 text-white rounded text-[11px] font-bold"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSaveFieldRename(f.id);
                                          }}
                                          className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded"
                                        >
                                          <Check className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingFieldId(null);
                                          }}
                                          className="p-1 text-red-400 hover:bg-red-500/10 rounded"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <>
                                        <span className={`text-[11px] font-bold ${isChecked ? 'text-white' : 'text-slate-500'}`}>
                                          {getFieldLabel(f.id)}
                                        </span>
                                       </>
                                     )}
                                   </div>
                                 </label>

                                 {!isEditingCurrent && (
                                   <button
                                     type="button"
                                     onClick={() => {
                                       setEditingFieldId(f.id);
                                       setEditingFieldVal(getFieldLabel(f.id));
                                     }}
                                     className="p-1 text-slate-500 hover:text-white rounded transition-colors mr-2 shrink-0 border border-transparent hover:border-white/10"
                                     title="تعديل مسمى هذا الحقل للبرنامج كاملاً"
                                   >
                                     <Edit2 className="w-3 h-3" />
                                   </button>
                                 )}
                               </div>
                             );
                           })}
                         </div>
                       </div>
                     </div>

                    {/* Section 0: Days & Hours of Work (أيام وساعات الدوام الأساسية) */}
                    <div className="bg-blue-950/10 border border-blue-500/10 p-5 rounded-2xl space-y-4 shadow-lg shadow-blue-950/20">
                      <div className="text-right">
                        <h4 className="text-xs font-bold text-blue-300 flex items-center gap-2 justify-end" dir="rtl">
                          <Calendar className="w-4 h-4 text-blue-400" />
                          أيام وساعات ومؤشرات الدوام الأساسية
                        </h4>
                        <p className="text-[9.5px] text-slate-400 mt-1">
                          تحديد ما إذا كان القسم يعتمد نظام أيام الدوام وحضور الموظفين الفعلي في الكشف (مثلاً للأقسام اليومية أو الثابتة) أم نظام الشفتات والورديات فقط.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(() => {
                          const coreWorkFields = FIELDS_METADATA.filter(
                            (f) => f.id === 'workingDays'
                          );

                          return coreWorkFields.map((f) => {
                             const isChecked = draftDept.enabledFields[f.id];
                             const isEditingCurrent = editingFieldId === f.id;

                             return (
                               <div
                                 key={f.id}
                                 className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                   isChecked
                                     ? 'bg-blue-955/20 border-blue-500/20 shadow-sm shadow-blue-950/10'
                                     : 'bg-black/20 border-white/5 opacity-65'
                                 } hover:border-blue-500/30 hover:scale-[1.01]`}
                               >
                                 <label className="flex items-start gap-3 select-none cursor-pointer flex-1 min-w-0">
                                   <input
                                     type="checkbox"
                                     disabled={isReadOnly || activeModal === 'view'}
                                     checked={!!isChecked}
                                     onChange={() => handleToggleFieldInDraft(f.id)}
                                     className="mt-0.5 rounded text-blue-500 focus:ring-blue-500 bg-slate-900 border-slate-700 w-4 h-4 cursor-pointer"
                                   />
                                   <div className="flex-1 min-w-0 text-right">
                                     {isEditingCurrent ? (
                                       <div className="flex items-center gap-1.5 mt-0.5" onClick={(e) => e.stopPropagation()}>
                                         <input
                                           type="text"
                                           value={editingFieldVal}
                                           onChange={(e) => setEditingFieldVal(e.target.value)}
                                           className="px-2 py-0.5 bg-slate-950 border border-blue-500 text-white rounded text-[11px] font-bold w-full"
                                         />
                                         <button
                                           type="button"
                                           onClick={() => handleSaveFieldRename(f.id)}
                                           className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded shrink-0"
                                         >
                                           <Check className="w-3.5 h-3.5" />
                                         </button>
                                         <button
                                           type="button"
                                           onClick={() => setEditingFieldId(null)}
                                           className="p-1 text-red-400 hover:bg-red-500/10 rounded shrink-0"
                                         >
                                           <X className="w-3.5 h-3.5" />
                                         </button>
                                       </div>
                                     ) : (
                                       <span className={`text-[11px] font-bold ${isChecked ? 'text-white' : 'text-slate-400'}`}>
                                         {getFieldLabel(f.id)}
                                       </span>
                                     )}
                                     <p className="text-[9px] text-slate-500 mt-0.5 truncate select-none leading-relaxed text-right" title={f.description}>
                                       {f.description}
                                     </p>
                                   </div>
                                 </label>

                                 <div className="flex items-center gap-1 shrink-0 mr-2">
                                   {!isEditingCurrent && !(isReadOnly || activeModal === 'view') && (
                                     <button
                                       type="button"
                                       onClick={() => {
                                         setEditingFieldId(f.id);
                                         setEditingFieldVal(getFieldLabel(f.id));
                                       }}
                                       className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors border border-transparent hover:border-white/5 bg-slate-900/60 cursor-pointer"
                                        title="تعديل المسمى"
                                     >
                                       <Edit2 className="w-3.5 h-3.5" />
                                     </button>
                                   )}
                                 </div>
                               </div>
                             );
                           });
                         })()}
                       </div>
                     </div>

                     <div className="h-4" />

                    {/* Section 1: Allowances (المخصصات والإضافات المالية) */}
                    <div className="bg-emerald-950/10 border border-emerald-500/10 p-5 rounded-2xl space-y-4 shadow-lg shadow-emerald-950/20">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-emerald-500/10 pb-3">
                        <div className="text-right">
                          <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-2 justify-end" dir="rtl">
                            <Coins className="w-4 h-4 text-emerald-400" />
                            المخصصات والإضافات المالية للقسم
                          </h4>
                          <p className="text-[9.5px] text-slate-400 mt-1">تحديد الحقول التي تدخل في حساب الإضافات والامتيازات لراتب الموظف</p>
                        </div>
                        
                        {/* Dynamic Add custom allowance button */}
                        {!(isReadOnly || activeModal === 'view') && (
                          <button
                            type="button"
                            onClick={() => {
                              const CUSTOM_ALLOWANCE_IDS: FieldId[] = [
                                'allowanceCustom1',
                                'allowanceCustom2',
                                'allowanceCustom3',
                                'allowanceCustom4',
                                'allowanceCustom5'
                              ];
                              const nextId = CUSTOM_ALLOWANCE_IDS.find(id => !draftDept.enabledFields[id]);
                              if (!nextId) {
                                showToast('لقد وصلت للحد الأقصى للمخصصات المخصصة المتاحة للقسم (5 مخصصات مضافة)', 'error');
                                return;
                              }
                              
                              if (onUpdateFieldLabel) {
                                onUpdateFieldLabel(nextId, 'مخصص إضافي جديد');
                              }
                              
                              setDraftDept({
                                ...draftDept,
                                enabledFields: {
                                  ...draftDept.enabledFields,
                                  [nextId]: true
                                }
                              });
                              setEditingFieldId(nextId);
                              setEditingFieldVal('مخصص إضافي جديد');
                              showToast('تمت إضافة مخصص مالي مخصص بنجاح! اكتب اسمه الآن ثم اضغط زر الحفظ.', 'success');
                            }}
                            className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow shadow-emerald-900/55 hover:scale-[1.03]"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            إضافة مخصص مالي جديد
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(() => {
                          const standardAllowances = FIELDS_METADATA.filter(
                            (f) => f.category === 'allowances' && !f.id.startsWith('allowanceCustom')
                          );
                          const activeCustomAllowances = FIELDS_METADATA.filter(
                            (f) => f.category === 'allowances' && f.id.startsWith('allowanceCustom') && draftDept.enabledFields[f.id]
                          );
                          const mergedList = [...standardAllowances, ...activeCustomAllowances];

                          if (mergedList.length === 0) {
                            return <p className="text-[10px] text-slate-500 col-span-2 text-center py-4">لا توجد مخصصات مفعلة حالياً.</p>;
                          }

                          return mergedList.map((f) => {
                            const isChecked = draftDept.enabledFields[f.id];
                            const isEditingCurrent = editingFieldId === f.id;
                            const isCustom = f.id.startsWith('allowanceCustom');

                            return (
                              <div
                                key={f.id}
                                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                  isChecked
                                    ? 'bg-emerald-950/20 border-emerald-500/20 shadow-sm shadow-emerald-950/10'
                                    : 'bg-black/20 border-white/5 opacity-65'
                                } hover:border-emerald-500/30 hover:scale-[1.01]`}
                              >
                                <label className="flex items-start gap-3 select-none cursor-pointer flex-1 min-w-0">
                                  <input
                                    type="checkbox"
                                    disabled={isReadOnly || activeModal === 'view'}
                                    checked={!!isChecked}
                                    onChange={() => handleToggleFieldInDraft(f.id)}
                                    className="mt-0.5 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-900 border-slate-700 w-4 h-4 cursor-pointer"
                                  />
                                  <div className="flex-1 min-w-0 text-right">
                                    {isEditingCurrent ? (
                                      <div className="flex items-center gap-1.5 mt-0.5" onClick={(e) => e.stopPropagation()}>
                                        <input
                                          type="text"
                                          value={editingFieldVal}
                                          onChange={(e) => setEditingFieldVal(e.target.value)}
                                          className="px-2 py-0.5 bg-slate-950 border border-emerald-500 text-white rounded text-[11px] font-bold w-full"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleSaveFieldRename(f.id)}
                                          className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded shrink-0"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditingFieldId(null)}
                                          className="p-1 text-red-400 hover:bg-red-500/10 rounded shrink-0"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="group flex items-center justify-end gap-1.5">
                                        {isCustom && (
                                          <span className="text-[8px] bg-emerald-500/15 text-emerald-400 px-1 py-0.5 rounded font-mono font-bold">
                                            مخصص مضاف
                                          </span>
                                        )}
                                        <span className={`text-[11px] font-bold ${isChecked ? 'text-white' : 'text-slate-400'}`}>
                                          {getFieldLabel(f.id)}
                                        </span>
                                      </div>
                                    )}
                                    <p className="text-[9px] text-slate-500 mt-0.5 truncate select-none leading-relaxed text-right" title={f.description}>
                                      {f.description}
                                    </p>
                                  </div>
                                </label>

                                <div className="flex items-center gap-1 shrink-0 mr-2">
                                  {!isEditingCurrent && !(isReadOnly || activeModal === 'view') && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingFieldId(f.id);
                                          setEditingFieldVal(getFieldLabel(f.id));
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors border border-transparent hover:border-white/5 bg-slate-900/60 cursor-pointer"
                                        title="تعديل المسمى"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                      
                                      {isCustom && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setDraftDept({
                                              ...draftDept,
                                              enabledFields: {
                                                ...draftDept.enabledFields,
                                                [f.id]: false
                                              }
                                            });
                                            showToast('تم إلغاء تفعيل وتجريد المخصص المضاف من القسم.', 'success');
                                          }}
                                          className="p-1.5 text-red-400 hover:text-red-300 rounded-md transition-colors border border-transparent hover:border-red-500/10 bg-red-955/20 cursor-pointer"
                                          title="تعطيل / حذف"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Section 2: Deductions (الاستقطاعات والخصومات المالية) */}
                    <div className="bg-rose-950/10 border border-rose-500/10 p-5 rounded-2xl space-y-4 shadow-lg shadow-rose-950/20">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-rose-500/10 pb-3">
                        <div className="text-right">
                          <h4 className="text-xs font-bold text-rose-300 flex items-center gap-2 justify-end" dir="rtl">
                            <Activity className="w-4 h-4 text-rose-400" />
                            الاستقطاعات والخصومات المالية للقسم
                          </h4>
                          <p className="text-[9.5px] text-slate-400 mt-1">تحديد حقول الاستقطاعات والعقوبات والغيابات التي تسحب من راتب الموظف</p>
                        </div>
                        
                        {/* Dynamic Add custom penalty button */}
                        {!(isReadOnly || activeModal === 'view') && (
                          <button
                            type="button"
                            onClick={() => {
                              const CUSTOM_PENALTY_IDS: FieldId[] = [
                                'deductionPenaltyCustom1',
                                'deductionPenaltyCustom2',
                                'deductionPenaltyCustom3',
                                'deductionPenaltyCustom4',
                                'deductionPenaltyCustom5'
                              ];
                              const nextId = CUSTOM_PENALTY_IDS.find(id => !draftDept.enabledFields[id]);
                              if (!nextId) {
                                showToast('لقد وصلت للحد الأقصى للعقوبات المخصصة المتاحة للقسم (5 عقوبات غرامات مضافة)', 'error');
                                return;
                              }
                              
                              if (onUpdateFieldLabel) {
                                onUpdateFieldLabel(nextId, 'عقوبة إضافية مخصصة');
                              }
                              
                              setDraftDept({
                                ...draftDept,
                                enabledFields: {
                                  ...draftDept.enabledFields,
                                  [nextId]: true
                                }
                              });
                              setEditingFieldId(nextId);
                              setEditingFieldVal('عقوبة إضافية مخصصة');
                              showToast('تمت إضافة عقوبة/غرامة مالية مخصصة بنجاح! اكتب مسمى العقوبة الآن ثم اضغط زر الحفظ.', 'success');
                            }}
                            className="py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-[10px] transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow shadow-rose-900/55 hover:scale-[1.03]"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            إضافة عقوبة مالية جديدة
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(() => {
                          const standardDeductions = FIELDS_METADATA.filter(
                            (f) => f.category === 'deductions' && !f.id.startsWith('deductionPenaltyCustom')
                          );
                          const activeCustomDeductions = FIELDS_METADATA.filter(
                            (f) => f.category === 'deductions' && f.id.startsWith('deductionPenaltyCustom') && draftDept.enabledFields[f.id]
                          );
                          const mergedList = [...standardDeductions, ...activeCustomDeductions];

                          if (mergedList.length === 0) {
                            return <p className="text-[10px] text-slate-500 col-span-2 text-center py-4">لا توجد استقطاعات مفعلة حالياً.</p>;
                          }

                          return mergedList.map((f) => {
                            const isChecked = draftDept.enabledFields[f.id];
                            const isEditingCurrent = editingFieldId === f.id;
                            const isCustom = f.id.startsWith('deductionPenaltyCustom');

                            return (
                              <div
                                key={f.id}
                                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                  isChecked
                                    ? 'bg-rose-950/20 border-rose-500/20 shadow-sm shadow-rose-950/10'
                                    : 'bg-black/20 border-white/5 opacity-65'
                                } hover:border-rose-500/30 hover:scale-[1.01]`}
                              >
                                <label className="flex items-start gap-3 select-none cursor-pointer flex-1 min-w-0">
                                  <input
                                    type="checkbox"
                                    disabled={isReadOnly || activeModal === 'view'}
                                    checked={!!isChecked}
                                    onChange={() => handleToggleFieldInDraft(f.id)}
                                    className="mt-0.5 rounded text-rose-500 focus:ring-rose-500 bg-slate-900 border-slate-700 w-4 h-4 cursor-pointer"
                                  />
                                  <div className="flex-1 min-w-0 text-right">
                                    {isEditingCurrent ? (
                                      <div className="flex items-center gap-1.5 mt-0.5" onClick={(e) => e.stopPropagation()}>
                                        <input
                                          type="text"
                                          value={editingFieldVal}
                                          onChange={(e) => setEditingFieldVal(e.target.value)}
                                          className="px-2 py-0.5 bg-slate-950 border border-rose-500 text-white rounded text-[11px] font-bold w-full"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleSaveFieldRename(f.id)}
                                          className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded shrink-0"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditingFieldId(null)}
                                          className="p-1 text-red-400 hover:bg-red-500/10 rounded shrink-0"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="group flex items-center justify-end gap-1.5">
                                        {isCustom && (
                                          <span className="text-[8px] bg-rose-500/10 text-rose-400 px-1 py-0.5 rounded font-mono font-bold border border-rose-500/20">
                                            عقوبة مضافة
                                          </span>
                                        )}
                                        <span className={`text-[11px] font-bold ${isChecked ? 'text-white' : 'text-slate-400'}`}>
                                          {getFieldLabel(f.id)}
                                        </span>
                                      </div>
                                    )}
                                    <p className="text-[9px] text-slate-500 mt-0.5 truncate select-none leading-relaxed text-right" title={f.description}>
                                      {f.description}
                                    </p>
                                  </div>
                                </label>

                                <div className="flex items-center gap-1 shrink-0 mr-2">
                                  {!isEditingCurrent && !(isReadOnly || activeModal === 'view') && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingFieldId(f.id);
                                          setEditingFieldVal(getFieldLabel(f.id));
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors border border-transparent hover:border-white/5 bg-slate-900/60 cursor-pointer"
                                        title="تعديل المسمى"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      
                                      {isCustom && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setDraftDept({
                                              ...draftDept,
                                              enabledFields: {
                                                ...draftDept.enabledFields,
                                                [f.id]: false
                                              }
                                            });
                                            showToast('تم إلغاء تفعيل وتجريد العقوبة المضافة من القسم.', 'success');
                                          }}
                                          className="p-1.5 text-red-400 hover:text-red-350 rounded-md transition-colors border border-transparent hover:border-red-500/10 bg-red-955/20 cursor-pointer"
                                          title="تعطيل / حذف"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Section 3: Carryover & Adjustments (التسويات والمدور المالي) */}
                    <div className="bg-indigo-950/10 border border-indigo-500/10 p-5 rounded-2xl space-y-4 shadow-lg shadow-indigo-950/20">
                      <div className="text-right">
                        <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-2 justify-end" dir="rtl">
                          <Sliders className="w-4 h-4 text-indigo-400" />
                          تسويات المبالغ السابقة والمدور المالي
                        </h4>
                        <p className="text-[9.5px] text-slate-400 mt-1">تفعيل ميزات جلب أو دحر الفروقات مالياً من كشوفات الأشهر السابقة</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {FIELDS_METADATA.filter((f) => f.category === 'adjustment').map((f) => {
                          const isChecked = draftDept.enabledFields[f.id];
                          const isEditingCurrent = editingFieldId === f.id;

                          return (
                            <div
                              key={f.id}
                              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                isChecked
                                  ? 'bg-indigo-955/20 border-indigo-500/20 shadow-sm shadow-indigo-950/10'
                                  : 'bg-black/20 border-white/5 opacity-65'
                              } hover:border-indigo-500/30 hover:scale-[1.01]`}
                            >
                              <label className="flex items-start gap-3 select-none cursor-pointer flex-1 min-w-0">
                                <input
                                  type="checkbox"
                                  disabled={isReadOnly || activeModal === 'view'}
                                  checked={!!isChecked}
                                  onChange={() => handleToggleFieldInDraft(f.id)}
                                  className="mt-0.5 rounded text-indigo-505 focus:ring-indigo-500 bg-slate-900 border-slate-700 w-4 h-4 cursor-pointer"
                                />
                                <div className="flex-1 min-w-0 text-right">
                                  {isEditingCurrent ? (
                                    <div className="flex items-center gap-1.5 mt-0.5" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="text"
                                        value={editingFieldVal}
                                        onChange={(e) => setEditingFieldVal(e.target.value)}
                                        className="px-2 py-0.5 bg-slate-950 border border-indigo-500 text-white rounded text-[11px] font-bold w-full"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleSaveFieldRename(f.id)}
                                        className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded shrink-0"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingFieldId(null)}
                                        className="p-1 text-red-400 hover:bg-red-500/10 rounded shrink-0"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className={`text-[11px] font-bold ${isChecked ? 'text-white' : 'text-slate-400'}`}>
                                      {getFieldLabel(f.id)}
                                    </span>
                                  )}
                                  <p className="text-[9px] text-slate-500 mt-0.5 truncate select-none leading-relaxed text-right" title={f.description}>
                                    {f.description}
                                  </p>
                                </div>
                              </label>

                              <div className="flex items-center gap-1 shrink-0 mr-2">
                                {!isEditingCurrent && !(isReadOnly || activeModal === 'view') && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingFieldId(f.id);
                                      setEditingFieldVal(getFieldLabel(f.id));
                                    }}
                                    className="p-1.5 text-slate-405 hover:text-white rounded-md transition-colors border border-transparent hover:border-white/5 bg-slate-900/60 cursor-pointer"
                                    title="تعديل المسمى"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                 {/* TAB 4: Detail Salary systems */}
                 {modalTab === 'pricing' && (() => {
                   const curStruct = draftDept ? (draftDept.salaryStructureType || (
                     draftDept.salaryType === 'fixed' ? 'fixed_unified' :
                     draftDept.salaryType === 'shifts' ? 'shifts' :
                     draftDept.salaryType === 'day' ? 'daily' :
                     (draftDept.salaryType === 'lumpSum' || draftDept.isLumpSum) ? 'lump_sum' :
                     draftDept.salaryType === 'callout' ? 'call_out' : 'variable'
                   )) : 'variable';

                   return (
                   <div className="space-y-4 animate-scale-up">
                     <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-1.5">
                       <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                         <Layers className="w-4 h-4 text-blue-400" />
                         هيكلية وأنظمة الرواتب التفصيلية للمستشفى بالقسم
                       </h4>
                       <p className="text-[10px] text-slate-400">
                         اختر أحد الأنظمة الرواتب الـ 6 المخصصة للتحكم الحسابي بالقسم. التغييرات ههنا تسري فوراً وبشكل حقيقي (Real-Time) على جميع الكوادر المضافة والمسجلة بالقسم:
                       </p>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 py-1 text-right font-sans" dir="rtl">
                      <button
                        type="button"
                        disabled={isReadOnly || activeModal === 'view'}
                        onClick={() => setDraftDept({ ...draftDept, salaryType: 'variable', salaryStructureType: 'variable', isLumpSum: false })}
                        className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                          curStruct === 'variable'
                            ? 'bg-blue-600/20 border-blue-500/50 text-white font-bold scale-[1.02] shadow-lg shadow-blue-950/20'
                            : 'bg-black/25 border-white/5 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="text-[11px] block text-blue-300 font-bold">١. راتب متغير (يدوي)</span>
                        <span className="text-[9px] text-slate-500 mt-1 block leading-relaxed">تحديد الراتب يدوياً للموظف مع تسعير اليوم والساعة.</span>
                      </button>

                      <button
                        type="button"
                        disabled={isReadOnly || activeModal === 'view'}
                        onClick={() => setDraftDept({ ...draftDept, salaryType: 'fixed', salaryStructureType: 'fixed_unified', isLumpSum: false })}
                        className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                          curStruct === 'fixed_unified'
                            ? 'bg-blue-600/20 border-blue-500/50 text-white font-bold scale-[1.02] shadow-lg shadow-blue-950/20'
                            : 'bg-black/25 border-white/5 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="text-[11px] block text-blue-300 font-bold">٢. راتب ثابت (موحد)</span>
                        <span className="text-[9px] text-slate-500 mt-1 block leading-relaxed">راتب موحد لكافة الموظفين بالقسم، مع راتب منفصل للمدير.</span>
                      </button>

                      <button
                        type="button"
                        disabled={isReadOnly || activeModal === 'view'}
                        onClick={() => setDraftDept({
                          ...draftDept,
                          salaryType: 'shifts',
                          salaryStructureType: 'shifts',
                          isLumpSum: false,
                          shiftsCount: draftDept.shiftsCount || 4,
                          enabledFields: {
                            ...draftDept.enabledFields,
                            shiftMorning: true,
                            shiftEvening: true,
                            shiftMiddle: true,
                            shiftKhafar: true,
                          }
                        })}
                        className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                          curStruct === 'shifts'
                            ? 'bg-cyan-600/25 border-cyan-500/50 text-white font-bold scale-[1.02] shadow-lg shadow-cyan-950/20'
                            : 'bg-black/25 border-white/5 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="text-[11px] block text-cyan-300 font-bold">٣. راتب بنظام الشفتات</span>
                        <span className="text-[9px] text-slate-500 mt-1 block leading-relaxed">تحديد عدد الشفتات من 1 إلى 6، نوعها، وسعر الشفت الثابت.</span>
                      </button>

                      <button
                        type="button"
                        disabled={isReadOnly || activeModal === 'view'}
                        onClick={() => setDraftDept({
                          ...draftDept,
                          salaryType: 'day',
                          salaryStructureType: 'daily',
                          isLumpSum: false,
                          enabledFields: {
                            ...draftDept.enabledFields,
                            workingDays: true,
                            shiftHalf12: true,
                          }
                        })}
                        className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                          curStruct === 'daily'
                            ? 'bg-emerald-600/25 border-emerald-500/50 text-white font-bold scale-[1.02] shadow-lg shadow-emerald-950/20'
                            : 'bg-black/25 border-white/5 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="text-[11px] block text-emerald-300 font-bold">٤. راتب بنظام اليوم</span>
                        <span className="text-[9px] text-slate-500 mt-1 block leading-relaxed">يحسب مبلغاً محدداً ومثبتاً عن كل يوم دوام فعلي للموظف.</span>
                      </button>

                      <button
                        type="button"
                        disabled={isReadOnly || activeModal === 'view'}
                        onClick={() => setDraftDept({ ...draftDept, salaryType: 'lumpSum', salaryStructureType: 'lump_sum', isLumpSum: true })}
                        className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                          curStruct === 'lump_sum'
                            ? 'bg-blue-600/20 border-blue-500/50 text-white font-bold scale-[1.02] shadow-lg shadow-blue-950/20'
                            : 'bg-black/25 border-white/5 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="text-[11px] block text-blue-300 font-bold">٥. راتب قطعي إجمالي للقسم</span>
                        <span className="text-[9px] text-slate-500 mt-1 block leading-relaxed">أجور القسم تُصرف دفعة واحدة كقطعية إجمالية باسم مخول.</span>
                      </button>

                      <button
                        type="button"
                        disabled={isReadOnly || activeModal === 'view'}
                        onClick={() => setDraftDept({
                          ...draftDept,
                          salaryType: 'callout',
                          salaryStructureType: 'call_out',
                          isLumpSum: false,
                          enabledFields: {
                            ...draftDept.enabledFields,
                            callouts: true,
                          }
                        })}
                        className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                          curStruct === 'call_out'
                            ? 'bg-purple-600/25 border-purple-500/50 text-white font-bold scale-[1.02] shadow-lg shadow-purple-950/20'
                            : 'bg-black/25 border-white/5 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="text-[11px] block text-purple-300 font-bold">٦. راتب بنظام الاستدعاء</span>
                        <span className="text-[9px] text-slate-500 mt-1 block leading-relaxed">يحسب بالكامل بناء على عدد حركات استدعاء العمل الفعلية.</span>
                      </button>
                    </div>

                    {/* 1. Variable systems custom view */}
                    {draftDept.salaryType === 'variable' && (
                      <div className="pt-2 bg-blue-950/15 p-4 border border-blue-500/20 rounded-xl space-y-3 font-sans text-right" dir="rtl">
                        <span className="text-[11px] font-black text-blue-300 block pb-1 border-b border-white/5">تفاصيل الراتب الإضافية للقسم (IQD):</span>
                        
                        <div>
                          <label className="block text-[10px] text-slate-300 mb-1 font-bold">الراتب الأساسي المعتمد للقسم (IQD) / 30 يوم:</label>
                          <input
                            type="number"
                            disabled={isReadOnly || activeModal === 'view'}
                            value={draftDept.defaultBasicSalary || ''}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              const calculatedDay = val > 0 ? Math.round(val / 30) : 0;
                              const calculatedHour = calculatedDay > 0 ? Math.round(calculatedDay / 8) : 0;
                              setDraftDept({
                                ...draftDept,
                                defaultBasicSalary: val,
                                pricing: {
                                  ...draftDept.pricing,
                                  dayPrice: calculatedDay,
                                  hourPrice: calculatedHour,
                                }
                              });
                            }}
                            placeholder="مثال: 600000"
                            className="w-full sm:max-w-xs bg-slate-950/50 border border-blue-500/30 rounded-lg py-1.5 px-3 text-white text-xs text-left font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                          <p className="text-[8.5px] text-emerald-400 font-bold mt-1">عند وضع قيمة الراتب، يسعّر اليوم والساعة تلقائياً استناداً إلى راتب 30 يوماً ووقت 8 ساعات.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="block text-[10px] text-slate-300 mb-1">تسعيرة سعر اليوم يدوياً:</label>
                            <input
                              type="number"
                              disabled={isReadOnly || activeModal === 'view'}
                              value={draftDept.pricing.dayPrice || ''}
                              onChange={(e) => handleUpdatePricingInDraft('dayPrice', Number(e.target.value))}
                              placeholder="مثال: 20000"
                              className="w-full bg-slate-950/50 border border-white/10 rounded-lg py-1.5 px-3 text-white text-xs text-left font-mono"
                            />
                            <p className="text-[8px] text-slate-500 mt-1">إذا ترك فارغاً، يشتق تلقائياً من (الراتب الأساسي للموظف / 30).</p>
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-300 mb-1">تسعيرة سعر الساعة يدوياً:</label>
                            <input
                              type="number"
                              disabled={isReadOnly || activeModal === 'view'}
                              value={draftDept.pricing.hourPrice || ''}
                              onChange={(e) => handleUpdatePricingInDraft('hourPrice', Number(e.target.value))}
                              placeholder="مثال: 2500"
                              className="w-full bg-slate-950/50 border border-white/10 rounded-lg py-1.5 px-3 text-white text-xs text-left font-mono"
                            />
                            <p className="text-[8px] text-slate-500 mt-1">إذا ترك فارغاً، يشتق تلقائياً كـ (سعر اليوم المعتمد / 8).</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. Fixed salary system */}
                    {draftDept.salaryType === 'fixed' && (
                      <div className="pt-2 bg-blue-950/15 p-4 border border-blue-500/20 rounded-xl space-y-3 font-sans text-right" dir="rtl">
                        <span className="text-[11px] font-black text-blue-300 block pb-1 border-b border-white/5">تحديد الرواتب الثابتة للقسم (IQD):</span>
                        <div>
                          <label className="block text-[11px] text-slate-350 font-semibold mb-1">الراتب الشهري الثابت والموحد لأعضاء الكشف:</label>
                          <input
                            type="number"
                            disabled={isReadOnly || activeModal === 'view'}
                            value={draftDept.fixedSalary || ''}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setDraftDept({
                                ...draftDept,
                                fixedSalary: v,
                                pricing: { ...draftDept.pricing, basicSalary: v },
                              });
                            }}
                            placeholder="مثال: 500000"
                            className="max-w-xs w-full bg-slate-950/50 border border-white/10 rounded-lg py-1.5 px-3 text-white text-xs text-left font-mono"
                          />
                        </div>
                      </div>
                    )}

                    {/* 3. Shifts System custom block */}
                    {draftDept.salaryType === 'shifts' && (() => {
                      const currentlyChecked = [
                        'shiftMorning',
                        'shiftEvening',
                        'shiftKhafar',
                        'shiftMiddle',
                        'shiftFull24',
                        'shiftHalf12'
                      ].filter(key => draftDept.enabledFields[key as FieldId]).length;

                      return (
                        <div className="pt-2 bg-cyan-950/15 p-4 border border-cyan-500/20 rounded-xl space-y-3 font-sans text-right" dir="rtl">
                          <span className="text-[11px] font-black text-cyan-300 block pb-1 border-b border-white/5">تفاصيل نظام الشفتات والرواتب (IQD):</span>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] text-slate-300 mb-1">عدد الشفتات النشطة للقسم:</label>
                              <select
                                disabled={isReadOnly || activeModal === 'view'}
                                value={draftDept.shiftsCount || 4}
                                onChange={(e) => setDraftDept({ ...draftDept, shiftsCount: Number(e.target.value) })}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-lg py-1.5 px-2 text-white text-xs focus:ring-0 focus:border-cyan-500"
                              >
                                {[1, 2, 3, 4, 5, 6].map(num => (
                                  <option key={num} value={num}>{num} شفتات</option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="flex items-center justify-start pb-1 text-cyan-300/80 text-[10px]">
                              <span>💡 يمكنك تفعيل حتى {draftDept.shiftsCount || 4} أنواع مختلفة من الشفتات، وتحديد تسعيرة مستقلة لكل نوع أدناه.</span>
                            </div>
                          </div>

                          {/* Shifts types selection checklist */}
                          <div className="space-y-1">
                            <label className="block text-[10px] text-slate-350 font-bold">تحديد أنواع الشفتات المطلوبة من القائمة:</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                              {[
                                { key: 'shiftMorning', label: 'صباحي' },
                                { key: 'shiftEvening', label: 'مسائي' },
                                { key: 'shiftKhafar', label: 'خفر' },
                                { key: 'shiftMiddle', label: 'وسطي' },
                                { key: 'shiftFull24', label: 'كامل ٢٤ ساعة' },
                                { key: 'shiftHalf12', label: 'شفت ١٢ ساعة' }
                              ].map(sh => {
                                const isActivated = draftDept.enabledFields[sh.key as FieldId];
                                const isLimitReached = !isActivated && currentlyChecked >= (draftDept.shiftsCount || 4);
                                return (
                                  <button
                                    key={sh.key}
                                    type="button"
                                    disabled={isReadOnly || activeModal === 'view'}
                                    onClick={() => {
                                      const activeShiftsLimit = draftDept.shiftsCount || 4;
                                      if (!isActivated && currentlyChecked >= activeShiftsLimit) {
                                        showToast(`تم بلوغ الحد الأقصى للشفتات المفعلة وهو (${activeShiftsLimit}) شفت. قم بزيادة عدد الشفتات النشطة للقسم أولاً لتفعيل المزيد من الشفتات.`, 'info');
                                        return;
                                      }
                                      setDraftDept({
                                        ...draftDept,
                                        enabledFields: {
                                          ...draftDept.enabledFields,
                                          [sh.key]: !isActivated
                                        }
                                      });
                                    }}
                                    className={`py-1.5 px-2 rounded-lg border text-center text-[10px] transition-all cursor-pointer font-bold ${
                                      isActivated
                                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 scale-[1.02]'
                                        : isLimitReached
                                          ? 'bg-black/10 border-white/5 text-slate-600 cursor-not-allowed opacity-50'
                                          : 'bg-black/25 border-white/5 text-slate-400 hover:text-slate-200'
                                    }`}
                                  >
                                    {sh.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Dynamic Pricing fields for activated shifts */}
                          {currentlyChecked > 0 && (
                            <div className="pt-2 border-t border-cyan-500/10 space-y-2">
                              <label className="block text-[10px] text-cyan-300 font-bold">تسعيرة الشفتات المفعلة للقسم (ادخل السعر الفردي لكل شفت):</label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {[
                                  { key: 'shiftMorning', label: 'صباحي', priceKey: 'shiftMorningPrice' },
                                  { key: 'shiftEvening', label: 'مسائي', priceKey: 'shiftEveningPrice' },
                                  { key: 'shiftKhafar', label: 'خفر', priceKey: 'shiftKhafarPrice' },
                                  { key: 'shiftMiddle', label: 'وسطي', priceKey: 'shiftMiddlePrice' },
                                  { key: 'shiftFull24', label: 'كامل ٢٤ ساعة', priceKey: 'shiftFull24Price' },
                                  { key: 'shiftHalf12', label: 'شفت ١٢ ساعة', priceKey: 'shiftHalf12Price' }
                                ].map(sh => {
                                  const isActivated = draftDept.enabledFields[sh.key as FieldId];
                                  if (!isActivated) return null;
                                  return (
                                    <div key={sh.key} className="bg-slate-900/40 p-2.5 rounded-lg border border-cyan-500/20 flex flex-col justify-between space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10.5px] font-bold text-white">الـ{sh.label}</span>
                                        <span className="text-[9px] text-cyan-400">نشط</span>
                                      </div>
                                      <input
                                        type="number"
                                        disabled={isReadOnly || activeModal === 'view'}
                                        value={draftDept.pricing[sh.priceKey as keyof typeof draftDept.pricing] || ''}
                                        onChange={(e) => handleUpdatePricingInDraft(sh.priceKey as any, Number(e.target.value) || 0)}
                                        placeholder="مثال: 30000"
                                        className="w-full bg-slate-950/80 border border-white/10 rounded-lg py-1 px-2.5 text-white text-xs text-left font-mono focus:border-cyan-500 focus:outline-none"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          <div className="p-3 bg-cyan-950/45 rounded-xl border border-cyan-500/25">
                            <span className="text-[10px] text-cyan-300 font-bold block mb-1">⚡ ميزة الزيادة التلقائية:</span>
                            <p className="text-[9.5px] text-slate-350 leading-relaxed">
                              يقوم النظام بشكل تلقائي برصد واحتساب أي شفتات إضافية ينجزها الموظف بما يفوق الحد الافتراضي وصرف أجورها كإضافة مالية لراتبه فورا.
                            </p>
                          </div>

                          <div className="p-3 bg-red-950/10 rounded-xl border border-red-500/20 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] text-slate-300 mb-1 font-bold">قيمة حسم يوم الغياب (IQD):</label>
                              <input
                                type="text"
                                disabled={isReadOnly || activeModal === 'view'}
                                value={draftDept.pricing?.dayPrice || ''}
                                onChange={(e) => handleUpdatePricingInDraft('dayPrice', Number(e.target.value.replace(/,/g, '')) || 0)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-lg py-1.5 px-2 text-white text-xs font-mono focus:ring-0 focus:border-red-500 text-center"
                                placeholder="مثال: 30000"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-300 mb-1 font-bold">قيمة حسم ساعة الغياب (IQD):</label>
                              <input
                                type="text"
                                disabled={isReadOnly || activeModal === 'view'}
                                value={draftDept.pricing?.hourPrice || ''}
                                onChange={(e) => handleUpdatePricingInDraft('hourPrice', Number(e.target.value.replace(/,/g, '')) || 0)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-lg py-1.5 px-2 text-white text-xs font-mono focus:ring-0 focus:border-red-500 text-center"
                                placeholder="مثال: 4000"
                              />
                            </div>
                            <div className="col-span-1 sm:col-span-2">
                              <span className="text-[9.5px] text-rose-300/80 leading-relaxed block">
                                💡 تُستخدم هذه القيم كأساس لاحتساب استقطاعات غياب الأيام والساعات للمنتسبين في نظام الشفتات. في حال تركها فارغة، سيقوم النظام بالاحتساب التلقائي بناءً على متوسط تسعيرة الشفتات المفعلة.
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 4. Day Salary System */}
                    {draftDept.salaryType === 'day' && (
                      <div className="pt-2 bg-emerald-950/15 p-4 border border-emerald-500/20 rounded-xl space-y-3 font-sans text-right" dir="rtl">
                        <span className="text-[11px] font-black text-emerald-300 block pb-1 border-b border-white/5">تفاصيل الراتب بنظام اليومية المحددة (IQD):</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] text-slate-300 mb-1 font-semibold">سعر اليوم الكامل (IQD):</label>
                            <input
                              type="number"
                              disabled={isReadOnly || activeModal === 'view'}
                              value={draftDept.pricing.dayPrice || ''}
                              onChange={(e) => handleUpdatePricingInDraft('dayPrice', Number(e.target.value))}
                              placeholder="مثال: 50000"
                              className="w-full bg-slate-950/50 border border-white/10 rounded-lg py-1.5 px-3 text-white text-xs text-left font-mono focus:border-emerald-500 focus:outline-none"
                            />
                            <p className="text-[8px] text-slate-500 mt-1">المبلغ المالي المعتمد لقاء حضور يوم عمل كامل.</p>
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-300 mb-1 font-semibold">سعر نصف اليوم (IQD):</label>
                            <input
                              type="number"
                              disabled={isReadOnly || activeModal === 'view'}
                              value={draftDept.pricing.shiftHalf12Price || ''}
                              onChange={(e) => handleUpdatePricingInDraft('shiftHalf12Price', Number(e.target.value))}
                              placeholder="مثال: 25000"
                              className="w-full bg-slate-950/50 border border-white/10 rounded-lg py-1.5 px-3 text-white text-xs text-left font-mono focus:border-emerald-500 focus:outline-none"
                            />
                            <p className="text-[8px] text-slate-500 mt-1">المبلغ المالي المعتمد لقاء حضور نصف يوم عمل.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 5. Lump sum whole department system */}
                    {(draftDept.salaryType === 'lumpSum' || draftDept.isLumpSum) && (
                      <div className="pt-2 bg-blue-950/15 p-4 border border-blue-500/20 rounded-xl space-y-3 font-sans text-right" dir="rtl">
                        <span className="text-[11px] font-black text-blue-300 block pb-1 border-b border-white/5">تفاصيل نظام الكشف القطعي الإجمالي للقسم:</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] text-slate-350 font-semibold mb-1">مبلغ الراتب القطعي الإجمالي الكلي للقسم:</label>
                            <input
                              type="number"
                              disabled={isReadOnly || activeModal === 'view'}
                              value={draftDept.lumpSumSalary || ''}
                              onChange={(e) => setDraftDept({ ...draftDept, lumpSumSalary: Number(e.target.value) })}
                              placeholder="مثال: 4500000"
                              className="w-full bg-slate-950/50 border border-white/10 rounded-lg py-1.5 px-3 text-white text-xs text-left font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-350 font-semibold mb-1">اسم الشخص المخوّل بالاستلام:</label>
                            <input
                              type="text"
                              disabled={isReadOnly || activeModal === 'view'}
                              value={draftDept.lumpSumRepresentative || ''}
                              onChange={(e) => setDraftDept({ ...draftDept, lumpSumRepresentative: e.target.value })}
                              placeholder="المخول باستلام أجور القسم الإجمالية"
                              className="w-full bg-slate-950/50 border border-white/10 rounded-lg py-1.5 px-3 text-white text-xs text-right"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 6. Callout System */}
                    {draftDept.salaryType === 'callout' && (
                      <div className="pt-2 bg-purple-950/15 p-4 border border-purple-500/20 rounded-xl space-y-3 font-sans text-right" dir="rtl">
                        <span className="text-[11px] font-black text-purple-300 block pb-1 border-b border-white/5">تحديد وسعر كل حركة استدعاء (IQD):</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] text-slate-300 mb-1 font-bold">سعر الاستدعاء للولد (ذكر):</label>
                            <input
                              type="number"
                              disabled={isReadOnly || activeModal === 'view'}
                              value={draftDept.pricing.calloutMalePrice || ''}
                              onChange={(e) => handleUpdatePricingInDraft('calloutMalePrice', Number(e.target.value))}
                              placeholder="مثال: 45000"
                              className="w-full bg-slate-950/50 border border-white/10 rounded-lg py-1.5 px-3 text-white text-xs text-left font-mono focus:border-purple-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-300 mb-1 font-bold">سعر الاستدعاء للبنت (أنثى):</label>
                            <input
                              type="number"
                              disabled={isReadOnly || activeModal === 'view'}
                              value={draftDept.pricing.calloutFemalePrice || ''}
                              onChange={(e) => handleUpdatePricingInDraft('calloutFemalePrice', Number(e.target.value))}
                              placeholder="مثال: 50000"
                              className="w-full bg-slate-950/50 border border-white/10 rounded-lg py-1.5 px-3 text-white text-xs text-left font-mono focus:border-purple-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-300 mb-1 font-bold font-sans text-indigo-300">سعر الاستدعاء للمدير:</label>
                            <input
                              type="number"
                              disabled={isReadOnly || activeModal === 'view'}
                              value={draftDept.pricing.calloutManagerPrice || ''}
                              onChange={(e) => handleUpdatePricingInDraft('calloutManagerPrice', Number(e.target.value))}
                              placeholder="مثال: 60000"
                              className="w-full bg-slate-950/50 border border-purple-500/20 rounded-lg py-1.5 px-3 text-white text-xs text-left font-mono focus:border-purple-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}


                      {/* Manager's Salary (راتب المدير) Field */}
                      <div className="pt-3 bg-emerald-950/15 p-4 border border-emerald-500/20 rounded-xl space-y-2 font-sans" dir="rtl">
                        <label className="block text-[11px] text-emerald-300 font-bold mb-1 flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                          راتب مدير القسم (IQD):
                        </label>
                        <p className="text-[10px] text-slate-350 leading-normal">
                          عند تحديد راتب لمدير القسم، سيتم كبحه تلقائياً كراتب أساسي لأي موظف داخل القسم يحمل منصب مدير (يحتوي الاسم على "مدير").
                        </p>
                        <input
                          type="number"
                          disabled={isReadOnly || activeModal === 'view'}
                          value={draftDept.managerSalary || ''}
                          onChange={(e) => setDraftDept({ ...draftDept, managerSalary: Number(e.target.value) || 0 })}
                          placeholder="مثال: 1500000"
                          className="max-w-xs w-full bg-slate-950/50 border border-white/15 rounded-lg py-1.5 px-3 text-white text-xs text-left font-mono focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      {/* Social Security Service (خدمة الضمان الاجتماعي 5%) Field */}
                      <div className="pt-3 bg-emerald-950/20 p-4 border border-emerald-500/30 rounded-xl space-y-2 font-sans" dir="rtl">
                        <div className="flex items-center justify-between">
                          <div className="text-right">
                            <label className="text-[11px] text-emerald-300 font-bold flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                              خدمة الضمان الاجتماعي (خصم 5% من الراتب المستحق)
                            </label>
                            <p className="text-[10px] text-slate-350 leading-normal mt-1">
                              عند تحديد هذا الخيار، يُعد القسم ضمن خدمة الضمان الاجتماعي ويتم تلقائياً خصم 5% من الراتب المستحق لجميع موظفي القسم وإظهار القيمة المخصومة في كشوفات وتقارير الرواتب.
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0 mr-3">
                            <input
                              type="checkbox"
                              disabled={isReadOnly || activeModal === 'view'}
                              checked={!!draftDept.enableSocialSecurity}
                              onChange={(e) => setDraftDept({ ...draftDept, enableSocialSecurity: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                          </label>
                        </div>
                      </div>

                    </div>
                    );
                  })()}
              </div>

              {/* Modal Core Footer */}
              <div className="p-5 border-t border-white/10 bg-slate-950/50 flex justify-end gap-3 flex-row-reverse" dir="rtl">
                {activeModal !== 'view' && !isReadOnly ? (
                  <>
                    <button
                      id="modal-save-btn"
                      type="button"
                      onClick={handleSaveModalAction}
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950/15"
                    >
                      <Check className="w-4 h-4" />
                      حفظ وتحديث القسم بالكامل
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      إلغاء التراجع
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    إغلاق المعاينة
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hospital Iframe-safe deletion confirmation dialog */}
      <AnimatePresence>
        {deptIdToDelete !== null && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 text-right font-sans"
            >
              <div className="flex items-center gap-3 text-red-400 justify-start" dir="rtl">
                <Trash2 className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-bold text-white">هل أنت متأكد من تصفير وإلغاء هذا القسم؟</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                سيؤدي حذف هذا القسم لإلغاء ارتباط كافة موظفيه فوراً وحظر تسعيراتهم بالكامل، بالإضافة لإزالة تاريخ هيكلية الشفتات الحالية. لا يمكن استرداد هذا الإجراء بمجرد التنشيط.
              </p>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setDeptIdToDelete(null)}
                  className="px-4 py-2 text-xs text-slate-300 border border-slate-800 hover:bg-slate-850 rounded-lg cursor-pointer"
                >
                  تراجع عن الحذف
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteDepartment}
                  className="px-4 py-2 text-xs text-white bg-red-650 hover:bg-red-500 rounded-lg cursor-pointer font-bold shadow-md shadow-red-950/20"
                >
                  نعم، احذف القسم من الهيكل
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
