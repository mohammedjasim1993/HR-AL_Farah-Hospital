import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings,
  Archive,
  RefreshCw,
  Download,
  Upload,
  UserCheck,
  UserPlus,
  Trash2,
  CalendarDays,
  Lock,
  Unlock,
  Users,
  CheckCircle2,
  AlertTriangle,
  Info,
  Globe,
  Palette,
  Clock,
  ShieldAlert,
  Edit2,
  PlusCircle,
  LogOut,
  Building,
  Phone,
  MapPin,
  UserX,
  Check,
  X,
  LifeBuoy,
  MessageSquare,
  PhoneCall,
  Award,
  ShieldCheck,
  Activity,
  Database,
  FileCode,
  Copy
} from 'lucide-react';
import { Department, Employee, ArchivedMonth, User, UserRole, CalculatedPayroll, AuditLogEntry } from '../types';
import { DEFAULT_USERS, calculateEmployeePayroll, sanitizeDepartmentPositions } from '../data';
import { showToast } from '../lib/toast';
import { TRANSLATIONS, getSystemDate } from '../lib/translations';

interface SettingsAndBackupProps {
  departments: Department[];
  employees: Employee[];
  payrollList: CalculatedPayroll[];
  archive: ArchivedMonth[];
  users: User[];
  currentUser: User;
  onUpdateArchive: (newArchive: ArchivedMonth[]) => void;
  onUpdateEmployees: (newEmployees: Employee[]) => void;
  onUpdateDepartments: (newDepartments: Department[]) => void;
  onUpdateUsers: (newUsers: User[]) => void;
  onLogout: () => void;
  onLoadDemoData: () => void;
  customFieldLabels?: Record<string, string>;
  onUpdateFieldLabel?: (fieldId: string, newLabel: string) => void;
  onAddLog?: (entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'userId' | 'userName' | 'userRole'>) => void;

  language: 'ar' | 'en';
  onUpdateLanguage: (lang: 'ar' | 'en') => void;
  theme: 'dark' | 'light' | 'brand' | 'cosmic' | 'luxury' | 'grey';
  onUpdateTheme: (theme: 'dark' | 'light' | 'brand' | 'cosmic' | 'luxury' | 'grey') => void;
  fontSize: number;
  onUpdateFontSize: (fontSize: number) => void;
  timeSettings: {
    autoSync: boolean;
    manualDate: string;
    manualTime: string;
  };
  onUpdateTimeSettings: (settings: any) => void;
  hospitalProfile: {
    nameAr: string;
    nameEn: string;
    logo: string;
    logoUrl?: string;
    addressAr: string;
    addressEn: string;
    phone: string;
    customFields: Array<{ key: string; value: string }>;
  };
  onUpdateHospitalProfile: (profile: any) => void;
  permissionsMatrix: {
    SuperAdmin: { read: boolean; write: boolean; delete: boolean; print: boolean };
    Accountant: { read: boolean; write: boolean; delete: boolean; print: boolean };
    HR: { read: boolean; write: boolean; delete: boolean; print: boolean };
    DataEntry: { read: boolean; write: boolean; delete: boolean; print: boolean };
    Lab_Technician: { read: boolean; write: boolean; delete: boolean; print: boolean };
    Ward_Nurse: { read: boolean; write: boolean; delete: boolean; print: boolean };
  };
  onUpdatePermissionsMatrix: (matrix: any) => void;
  labPermissionsMatrix: {
    SuperAdmin: { registry: string; patients_list: string; samples: string; sample_logs: string; transfusion: string };
    Accountant: { registry: string; patients_list: string; samples: string; sample_logs: string; transfusion: string };
    HR: { registry: string; patients_list: string; samples: string; sample_logs: string; transfusion: string };
    DataEntry: { registry: string; patients_list: string; samples: string; sample_logs: string; transfusion: string };
    Lab_Technician: { registry: string; patients_list: string; samples: string; sample_logs: string; transfusion: string };
    Ward_Nurse: { registry: string; patients_list: string; samples: string; sample_logs: string; transfusion: string };
  };
  onUpdateLabPermissionsMatrix: (matrix: any) => void;
  backupConfig: {
    directoryPath: string;
    intervalHours: number;
  };
  onUpdateBackupConfig: (config: any) => void;
  onDeleteArchiveMonth?: (monthId: string) => void;
}

export default function SettingsAndBackup({
  departments,
  employees,
  payrollList,
  archive,
  users,
  currentUser,
  onUpdateArchive,
  onUpdateEmployees,
  onUpdateDepartments,
  onUpdateUsers,
  onLogout,
  onLoadDemoData,
  customFieldLabels = {},
  onUpdateFieldLabel,
  onAddLog,

  language,
  onUpdateLanguage,
  theme,
  onUpdateTheme,
  fontSize,
  onUpdateFontSize,
  timeSettings,
  onUpdateTimeSettings,
  hospitalProfile,
  onUpdateHospitalProfile,
  permissionsMatrix,
  onUpdatePermissionsMatrix,
  labPermissionsMatrix,
  onUpdateLabPermissionsMatrix,
  backupConfig,
  onUpdateBackupConfig,
  onDeleteArchiveMonth,
}: SettingsAndBackupProps) {
  const t = TRANSLATIONS[language];

  // Active sub-tab inside settings
  const [settingsActiveTab, setSettingsActiveTab] = useState<'profile' | 'users' | 'language' | 'theme' | 'time' | 'system' | 'support'>('profile');

  // Hospital Profile custom fields and edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ ...hospitalProfile });
  const [newCustomKey, setNewCustomKey] = useState('');
  const [newCustomValue, setNewCustomValue] = useState('');

  useEffect(() => {
    setProfileForm({ ...hospitalProfile });
  }, [hospitalProfile]);

  // Archive & backup closure states
  const [archiveMonthId, setArchiveMonthId] = useState('');
  const [archiveLabel, setArchiveLabel] = useState('');

  useEffect(() => {
    const sysDate = getSystemDate(timeSettings);
    // Smart default: If early in month (<= 10th), default to previous month as payroll closure is for previous month
    const usePrev = sysDate.getDate() <= 10;
    const targetMonthIdx = usePrev ? (sysDate.getMonth() === 0 ? 11 : sysDate.getMonth() - 1) : sysDate.getMonth();
    const targetYear = usePrev && sysDate.getMonth() === 0 ? sysDate.getFullYear() - 1 : sysDate.getFullYear();

    const mm = String(targetMonthIdx + 1).padStart(2, '0');
    setArchiveMonthId(`${targetYear}-${mm}`);

    const months = language === 'ar' ? [
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
      'كانون الأول / ديسمبر'
    ] : [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    setArchiveLabel(`${months[targetMonthIdx]} ${targetYear}`);
  }, [timeSettings, language]);

  // User additions form states
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('DataEntry');
  const [sysUsername, setSysUsername] = useState('');
  const [sysPassword, setSysPassword] = useState('');
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');

  const [isArchivingSuccess, setIsArchivingSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Read permission evaluator
  const currentRoleMatrix = currentUser?.role ? (permissionsMatrix as any)?.[currentUser.role] : null;
  const isReadOnly = currentUser?.role !== 'SystemAdmin' && currentUser?.role !== 'SuperAdmin' && (currentUser?.role === 'DataEntry' || (currentRoleMatrix && !currentRoleMatrix?.write));

  // Hospital Profile handlers
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateHospitalProfile(profileForm);
    setIsEditingProfile(false);
    showToast(language === 'ar' ? 'تم تحديث بيانات مستشفى الفرح الموحدة بنجاح!' : 'Hospital Profile updated successfully!', 'success');
  };

  const handleAddCustomField = () => {
    if (!newCustomKey.trim() || !newCustomValue.trim()) {
      showToast(language === 'ar' ? 'يرجى كتابة اسم الحقل وقيمته.' : 'Please enter field title and value.', 'error');
      return;
    }
    const updatedFields = [
      ...(profileForm.customFields || []),
      { key: newCustomKey.trim(), value: newCustomValue.trim() }
    ];
    setProfileForm({ ...profileForm, customFields: updatedFields });
    setNewCustomKey('');
    setNewCustomValue('');
    showToast(language === 'ar' ? 'تمت إضافة الحقل بنجاح! سيتم الحفظ بشكل نهائي عند الضغط على زر حفظ التغييرات.' : 'Custom field added to queue.', 'info');
  };

  const handleRemoveCustomField = (index: number) => {
    const updatedFields = (profileForm.customFields || []).filter((_, i) => i !== index);
    setProfileForm({ ...profileForm, customFields: updatedFields });
  };

  // Matrix permission handlers
  const handleToggleMatrixPermission = (role: UserRole, permType: 'read' | 'write' | 'delete' | 'print') => {
    if (currentUser?.role !== 'SystemAdmin' && currentUser?.role !== 'SuperAdmin') {
      showToast(language === 'ar' ? 'لا توجد لديك حزمة صلاحيات لتعديل التراخيص الأساسية.' : 'Unauthorized to change system levels.', 'error');
      return;
    }
    const roleMap = (permissionsMatrix as any)[role] || { read: false, write: false, delete: false, print: false };
    const oldVal = roleMap[permType] ? 'مفعل' : 'معطل';
    const newVal = !roleMap[permType] ? 'مفعل' : 'معطل';

    const updated = {
      ...permissionsMatrix,
      [role]: {
        ...roleMap,
        [permType]: !roleMap[permType]
      }
    };
    onUpdatePermissionsMatrix(updated);
    showToast(language === 'ar' ? `تم تفويض وتحديث رخص فئة (${role})` : `Updated credentials for ${role}`, 'success');

    if (onAddLog) {
      onAddLog({
        actionType: 'PERMISSIONS_CHANGE',
        actionTitle: 'تعديل جدول صلاحيات الرتبة',
        targetName: `فئة الصلاحية: ${role}`,
        details: `تم تعديل حق (${permType}) لرتبة (${role}) من [${oldVal}] إلى [${newVal}]`,
        previousValue: oldVal,
        newValue: newVal
      });
    }
  };

  const handleChangeLabPermission = (role: UserRole, tabKey: 'registry' | 'patients_list' | 'samples' | 'sample_logs' | 'transfusion', level: 'full' | 'read' | 'none') => {
    if (currentUser?.role !== 'SystemAdmin' && currentUser?.role !== 'SuperAdmin') {
      showToast(language === 'ar' ? 'لا توجد لديك حزمة صلاحيات لتعديل التراخيص الأساسية.' : 'Unauthorized to change system levels.', 'error');
      return;
    }
    const roleLabMap = (labPermissionsMatrix as any)[role] || { registry: 'none', patients_list: 'none', samples: 'none', sample_logs: 'none', transfusion: 'none' };
    const oldLevel = roleLabMap[tabKey] || 'none';

    const updated = {
      ...labPermissionsMatrix,
      [role]: {
        ...roleLabMap,
        [tabKey]: level
      }
    };
    onUpdateLabPermissionsMatrix(updated);
    showToast(language === 'ar' ? `تم تحديث صلاحية نافذة المختبر لفئة (${role})` : `Updated lab window credential for ${role}`, 'success');

    if (onAddLog) {
      onAddLog({
        actionType: 'PERMISSIONS_CHANGE',
        actionTitle: 'تعديل صلاحيات وحدة المختبر',
        targetName: `رتبة (${role}) - النافذة (${tabKey})`,
        details: `تحديث مستويات الدخول لوحدة المختبر من [${oldLevel}] إلى [${level}]`,
        previousValue: oldLevel,
        newValue: level
      });
    }
  };

  // Month Closure resets
  const handleResetMonthlyVariables = () => {
    if (isReadOnly) {
      showToast(language === 'ar' ? 'ليس لديك تراخيص لإجراء تصفير.' : 'Permission denied.', 'error');
      return;
    }
    const msg = language === 'ar' 
      ? 'هل تريد بالفعل تصفير كافة المدخلات المتغيرة للموظفين؟ سيشمل ذلك: أيام الدوام، الساعات، الشفتات، الاستدعاءات، الإضافات الممنوحة، والخصومات والغيابات.'
      : 'Are you sure you want to completely flush all dynamic variables like hours, days, shifts, bonuses, and deductions for all employees?';
    
    if (confirm(msg)) {
      const resetEmps = employees.map((emp) => ({
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
      onUpdateEmployees(resetEmps);
      showToast(language === 'ar' ? 'تم تصفير متغيرات الدوام والخصومات للموظفين بنجاح!' : 'Dynamic variables zero-initiated!', 'success');
    }
  };

  // Archive and closing handles
  const handleCloseMonthAndArchive = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    if (employees.length === 0) {
      showToast(language === 'ar' ? 'لا يمكن إغلاق الشهر لعدم وجود موظفين نشطين حالياً في الكشف.' : 'Cannot close month. Staff roster is empty.', 'error');
      return;
    }

    const alreadyArchived = archive.some((a) => a.monthId === archiveMonthId);
    if (alreadyArchived) {
      const confirmMsg = language === 'ar'
        ? 'هذا الشهر مؤرشف مسبقاً! هل ترغب في إعادة كتابة السجلات وتحديثها بهذا الإصدار؟'
        : 'This ledger index already exists in history. Overwrite this archived index?';
      if (!confirm(confirmMsg)) {
        return;
      }
    }

    const snaps: CalculatedPayroll[] = employees.map((emp) => {
      const dept = departments.find((d) => d.id === emp.departmentId);
      return calculateEmployeePayroll(emp, dept);
    });

    const netSum = snaps.reduce((sum, s) => sum + s.netSalary, 0);
    const earningsSum = snaps.reduce((sum, s) => sum + s.totalEarnings, 0);
    const deductionsSum = snaps.reduce((sum, s) => sum + s.totalDeductions, 0);

    const newArchiveEntry: ArchivedMonth = {
      monthId: archiveMonthId,
      monthLabel: archiveLabel.trim(),
      employeesSnapshot: JSON.parse(JSON.stringify(employees)),
      departmentsSnapshot: JSON.parse(JSON.stringify(departments)),
      payrollsSnapshot: snaps,
      totalNetPaid: netSum,
      totalEarningsSum: earningsSum,
      totalDeductionsSum: deductionsSum,
      timestamp: getSystemDate(timeSettings).toISOString(),
    };

    const filteredArchive = archive.filter((a) => a.monthId !== archiveMonthId);
    const updatedArchive = [...filteredArchive, newArchiveEntry];

    onUpdateArchive(updatedArchive);

    const rolledEmployees: Employee[] = employees.map((emp) => ({
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

    onUpdateEmployees(rolledEmployees);

    setIsArchivingSuccess(true);
    setTimeout(() => {
      setIsArchivingSuccess(false);
    }, 4500);
    showToast(language === 'ar' ? 'تم ترحيل الشهر بنجاح وتأمين الأرشيف المالي لمستشفى الفرح!' : 'Cycle successfully closed and archived!', 'success');
  };

  // Backup Import & Export
  const handleExportDatabase = () => {
    const fullDB = {
      departments: departments.map(d => sanitizeDepartmentPositions(d)),
      employees,
      archive,
      users,
      hospitalProfile,
      permissionsMatrix,
      exportVersion: '1.5.0',
      exportedBy: currentUser.username,
      exportedAt: new Date().toISOString(),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullDB, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    
    const today = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute('download', `AlFarrah_Hospital_Backup_${today}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onload = (event) => {
      try {
        const jsonContent = event.target?.result as string;
        const parsed = JSON.parse(jsonContent);

        if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.departments) && Array.isArray(parsed.employees)) {
            const sanitizedDepts = parsed.departments.map((d: any) => sanitizeDepartmentPositions(d));
            onUpdateDepartments(sanitizedDepts);
            onUpdateEmployees(parsed.employees);
            
            if (Array.isArray(parsed.archive)) {
              onUpdateArchive(parsed.archive);
            }
            if (Array.isArray(parsed.users)) {
              onUpdateUsers(parsed.users);
            }
            if (parsed.hospitalProfile) {
              onUpdateHospitalProfile(parsed.hospitalProfile);
            }
            if (parsed.permissionsMatrix) {
              onUpdatePermissionsMatrix(parsed.permissionsMatrix);
            }

            showToast(
              language === 'ar' 
                ? 'تم استيراد قاعدة البيانات واستعادة المناصب والهياكل والتسعير والأرشيف بنجاح!' 
                : 'Ledger successfully recovered from save backup!', 
              'success'
            );
          } else {
            showToast(language === 'ar' ? 'صيغة ملف النسخ الاحتياطي غير متوافقة أو معطوبة.' : 'Incompatible backup file schema.', 'error');
          }
        }
      } catch (err) {
        showToast(language === 'ar' ? 'خطأ أثناء فك ومعالجة ملف النسخ الاحتياطي.' : 'Error decoding json payload.', 'error');
      }
    };
    fileReader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Server-side Automated Backup System integrations
  const [serverBackups, setServerBackups] = useState<any[]>([]);
  const [isBackupLoading, setIsBackupLoading] = useState(false);

  const fetchServerBackups = async () => {
    try {
      setIsBackupLoading(true);
      const res = await fetch('/api/backups');
      const json = await res.json();
      if (json && json.success) {
        setServerBackups(json.backups || []);
      }
    } catch (err) {
      console.error('Failed to load server backups:', err);
    } finally {
      setIsBackupLoading(false);
    }
  };

  useEffect(() => {
    fetchServerBackups();
  }, []);

  const handleCreateServerBackup = async () => {
    try {
      setIsBackupLoading(true);
      const res = await fetch('/api/backups/create', { method: 'POST' });
      const json = await res.json();
      if (json && json.success) {
        showToast(
          language === 'ar'
            ? 'تم إنشاء نسخة احتياطية تلقائية آمنة على السيرفر بنجاح!'
            : 'Failsafe automatic backup created successfully on the server!',
          'success'
        );
        fetchServerBackups();
      } else {
        showToast(
          language === 'ar' ? 'فشل حجز ونسخ البيانات على السيرفر.' : 'Failed to instantiate server backup.',
          'error'
        );
      }
    } catch (err) {
      showToast(language === 'ar' ? 'فشل الاتصال بسيرفر النسخ الاحتياطي.' : 'Backup connection fault.', 'error');
    } finally {
      setIsBackupLoading(false);
    }
  };

  const handleRestoreServerBackup = async (filename: string) => {
    if (isReadOnly) {
      showToast(language === 'ar' ? 'غير مصرح لك باستعادة دفاتر النظام.' : 'Unauthorized action.', 'error');
      return;
    }

    const confirmMsg = language === 'ar'
      ? `تنبيه أمان: هل أنت متأكد من تصفير وإعادة تعيين النظام بالكامل للملف (${filename})؟ سيتم استعادة كافة الأقسام والموظفين وأرشيف الرواتب المسجل في تاريخ هذه النسخة!`
      : `Security warning: Restore from ${filename}? This will overwrite active tables with the backup records!`;

    if (!confirm(confirmMsg)) return;

    try {
      setIsBackupLoading(true);
      const res = await fetch('/api/backups/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });
      const json = await res.json();
      if (json && json.success && json.data) {
        const serverData = json.data;
        if (serverData.departments) {
          const sanitizedDepts = serverData.departments.map((d: any) => sanitizeDepartmentPositions(d));
          onUpdateDepartments(sanitizedDepts);
        }
        if (serverData.employees) onUpdateEmployees(serverData.employees);
        if (serverData.archive) onUpdateArchive(serverData.archive);
        if (serverData.users) onUpdateUsers(serverData.users);
        if (serverData.hospitalProfile) onUpdateHospitalProfile(serverData.hospitalProfile);
        if (serverData.permissionsMatrix) onUpdatePermissionsMatrix(serverData.permissionsMatrix);

        showToast(
          language === 'ar'
            ? 'تم ترحيل البيانات واستعادة دفاتر النظام كاملة بنجاح!'
            : 'Operational registers fully restored successfully from the server backup!',
          'success'
        );
        fetchServerBackups();
      } else {
        showToast(
          language === 'ar' ? 'فشل تطبيق وقراءة الملف المنسوخ.' : 'Payload decoding or commit error on server.',
          'error'
        );
      }
    } catch (err) {
      showToast(language === 'ar' ? 'فشل في تحميل أو معالجة طلب الاسترجاع.' : 'Server network timed out.', 'error');
    } finally {
      setIsBackupLoading(false);
    }
  };

  const handleDeleteServerBackup = async (filename: string) => {
    if (isReadOnly) return;

    const confirmMsg = language === 'ar'
      ? `تنبيه: هل تود مسح وحذف نسخة النسخ الاحتياطي (${filename}) نهائياً من السيرفر؟`
      : `Confirm delete of backup ${filename} permanently?`;

    if (!confirm(confirmMsg)) return;

    try {
      setIsBackupLoading(true);
      const res = await fetch('/api/backups/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });
      const json = await res.json();
      if (json && json.success) {
        showToast(
          language === 'ar' ? 'تم مسح وإبادة ملف النسخ المختار بنجاح.' : 'Backup cleared from physical server files.',
          'success'
        );
        fetchServerBackups();
      } else {
        showToast(language === 'ar' ? 'فشل حذف الملف من السيرفر.' : 'Failed to unlink the backup file.', 'error');
      }
    } catch (err) {
      showToast(language === 'ar' ? 'حدث خطأ في الاتصال بالسيرفر.' : 'Physical disconnect.', 'error');
    } finally {
      setIsBackupLoading(false);
    }
  };

  // SQL Server 1433 Connection Testing State
  const [sqlStatus, setSqlStatus] = useState<{ connected: boolean; port: number; server: string; database: string } | null>(null);
  const [isTestingSql, setIsTestingSql] = useState(false);
  const [sqlTestResult, setSqlTestResult] = useState<{ success: boolean; message: string; info?: any } | null>(null);

  const checkSqlStatus = async () => {
    try {
      const res = await fetch('/api/sql/status');
      if (res.ok) {
        const data = await res.json();
        setSqlStatus(data);
      }
    } catch (e) {
      console.warn('SQL status check offline');
    }
  };

  const handleTestSqlConnection = async () => {
    setIsTestingSql(true);
    setSqlTestResult(null);
    try {
      const res = await fetch('/api/sql/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          server: '127.0.0.1',
          port: 1433,
          database: 'hr_farah_db',
          user: 'sa'
        })
      });
      const data = await res.json();
      setSqlTestResult(data);
      if (data.success) {
        showToast(language === 'ar' ? '✓ تم الاتصال بـ Microsoft SQL Server على البورت 1433 بنجاح!' : 'SQL Server connected on port 1433!', 'success');
      } else {
        showToast(language === 'ar' ? `تنبيه: ${data.error || 'تعذر الاتصال بـ SQL Server'}` : 'SQL Connection error', 'error');
      }
      checkSqlStatus();
    } catch (e) {
      showToast(language === 'ar' ? 'تعذر فحص الاتصال بالخادم.' : 'Failed to test connection', 'error');
    } finally {
      setIsTestingSql(false);
    }
  };

  useEffect(() => {
    checkSqlStatus();
  }, []);

  // SQL Scripts direct downloads and clipboard handlers
  const [copiedSqlType, setCopiedSqlType] = useState<string | null>(null);

  const handleDownloadSql = (type: 'unified' | 'lab') => {
    const url = type === 'lab' ? '/api/sql/lab-migration' : '/api/sql/unified-schema';
    const a = document.createElement('a');
    a.href = url;
    a.download = type === 'lab' ? 'migration_lab_module.sql' : 'AlFarrah_Hospital_Unified_Schema_2026.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(
      language === 'ar' ? 'جاري تحميل ملف كود SQL لقاعدة البيانات...' : 'Downloading database SQL script...',
      'success'
    );
  };

  const handleCopySql = async (type: 'unified' | 'lab') => {
    try {
      const res = await fetch(`/api/sql/raw-code?type=${type}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.code) {
          await navigator.clipboard.writeText(data.code);
          setCopiedSqlType(type);
          showToast(
            language === 'ar' 
              ? '✓ تم نسخ كود SQL بنجاح للحافظة! يمكنك الآن لصقه مباشرة في SQL Server (SSMS).' 
              : 'SQL code successfully copied to clipboard!',
            'success'
          );
          setTimeout(() => setCopiedSqlType(null), 3500);
          return;
        }
      }
      showToast(language === 'ar' ? 'تعذر جلب نص الكود.' : 'Could not fetch SQL code.', 'error');
    } catch (e) {
      showToast(language === 'ar' ? 'حدث خطأ أثناء نسخ كود SQL.' : 'Failed to copy SQL script.', 'error');
    }
  };

  // User control actions
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');

    if (isReadOnly) {
      setUserError(language === 'ar' ? 'أنت مدخل بيانات فقط، ليس لديك رخصة لإضافة مستخدمين.' : 'Unauthorized action.');
      return;
    }

    if (!newUsername.trim() || !newPassword.trim()) {
      setUserError(language === 'ar' ? 'يرجى كتابة اسم مستخدم وكلمة مرور صالحة.' : 'Credentials invalid.');
      return;
    }

    const exists = users.some((u) => u.username.toLowerCase() === newUsername.trim().toLowerCase());
    if (exists) {
      setUserError(language === 'ar' ? 'اسم المستخدم هذا موجود مسبقاً بالنظام.' : 'Username already registered.');
      return;
    }

    const newUserObj: User = {
      id: `usr-${Date.now()}`,
      username: newUsername.trim().toLowerCase(),
      password: newPassword.trim(),
      role: newRole,
      mustChangePassword: true,
    };

    onUpdateUsers([...users, newUserObj]);
    setNewUsername('');
    setNewPassword('');
    setUserSuccess(language === 'ar' ? 'تم تسجيل وإجازة ترخيص الحساب الجديد بنجاح!' : 'Licence registered successfully!');

    if (onAddLog) {
      onAddLog({
        actionType: 'USER_MANAGEMENT',
        actionTitle: 'إنشاء حساب مستخدم جديد بالنظام',
        targetName: `الحساب: ${newUserObj.username} (${newRole})`,
        details: `تم إنشاء حساب جديد برتبة (${newRole}) وتعيين كلمة مرور مؤقتة يتطلب تغييرها عند الدخول.`,
        previousValue: 'غير موجود',
        newValue: `نشط (${newRole})`
      });
    }
  };

  const handleDeleteUser = (id: string) => {
    if (isReadOnly) return;
    const target = users.find((u) => u.id === id);
    if (target && target.username.toLowerCase() === 'admin') {
      showToast(language === 'ar' ? 'لا يمكن حذف الحساب الأساسي (admin).' : 'Cannot delete roots admin handle.', 'error');
      return;
    }
    if (id === currentUser.id) {
      showToast(language === 'ar' ? 'لا يمكنك إبادة حسابك النشط المفتوح حالياً.' : 'Cannot self-destruct active account.', 'error');
      return;
    }

    const msg = language === 'ar'
      ? 'هل ترغب بالفعل بحذف وإقصاء التراخيص لهذا الحساب من الدخول؟'
      : 'Revoke and wipe account access for this user?';
    if (confirm(msg)) {
      const updated = users.filter((u) => u.id !== id);
      onUpdateUsers(updated);
      showToast(language === 'ar' ? 'تم مسح الحساب بنجاح.' : 'Account deleted successfully', 'success');

      if (onAddLog && target) {
        onAddLog({
          actionType: 'USER_MANAGEMENT',
          actionTitle: 'إلغاء وحذف حساب مستخدم',
          targetName: `الحساب: ${target.username} (${target.role})`,
          details: `تم إلغاء سحب ترخيص الحساب (${target.username}) وحذفه نهائياً من قائمة مستخدمي النظام.`,
          previousValue: `نشط (${target.role})`,
          newValue: 'محذوف'
        });
      }
    }
  };

  const handleChangeUserPassword = (id: string) => {
    if (isReadOnly) return;
    const target = users.find((u) => u.id === id);
    if (!target) return;

    const promptMsg = language === 'ar'
      ? `أدخل كلمة المرور الجديدة للحساب (${target.username}):`
      : `Enter new password for (${target.username}):`;

    const newPass = prompt(promptMsg);
    if (newPass === null) return;

    if (!newPass.trim()) {
      showToast(
        language === 'ar' ? 'يرجى كتابة كلمة مرور صالحة وغير فارغة.' : 'Password cannot be empty.',
        'error'
      );
      return;
    }

    const updated = users.map((u) => {
      if (u.id === id) {
        return { ...u, password: newPass.trim(), mustChangePassword: false };
      }
      return u;
    });

    onUpdateUsers(updated);
    showToast(
      language === 'ar' ? `تم تغيير كلمة المرور للمستخدم (${target.username}) بنجاح!` : `Password for (${target.username}) updated successfully!`,
      'success'
    );
  };

  const formatIQD = (amount: number) => {
    const val = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    return `${Math.round(val).toLocaleString('en-US')} ${language === 'ar' ? 'د.ع' : 'IQD'}`;
  };

  // Render variables
  const sidebarItems = [
    { id: 'profile', label: language === 'ar' ? 'بيانات المستشفى' : 'Hospital Profile', icon: Building, color: 'text-blue-400' },
    { id: 'users', label: language === 'ar' ? 'الحسابات والصلاحيات' : 'Users & Permissions', icon: Users, color: 'text-indigo-400' },
    { id: 'language', label: language === 'ar' ? 'إعدادات اللغة' : 'Language (i18n)', icon: Globe, color: 'text-cyan-400' },
    { id: 'theme', label: language === 'ar' ? 'المظهر والثيمات' : 'Themes & Visuals', icon: Palette, color: 'text-purple-400' },
    { id: 'time', label: language === 'ar' ? 'الوقت والتاريخ' : 'Time & Date', icon: Clock, color: 'text-emerald-400' },
    { id: 'system', label: language === 'ar' ? 'الأرشفة والنسخ الاحتياطي' : 'Closures & Backups', icon: Settings, color: 'text-amber-400' },
    { id: 'support', label: language === 'ar' ? 'الدعم الفني والبرمجة' : 'Technical Support', icon: LifeBuoy, color: 'text-emerald-400' }
  ];

  return (
    <div className="glass-panel rounded-2.5xl p-6 shadow-2xl relative" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Sidebar + Tab View Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-[520px]">
        
        {/* Navigation Sidebar (Responsive list) */}
        <div className="lg:col-span-1 flex flex-col gap-1.5 border-b lg:border-b-0 lg:border-l border-slate-705/15 pb-6 lg:pb-0 lg:pl-6">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest px-3 font-sans">
              {language === 'ar' ? 'الإعدادات الموحدة' : 'SYSTEM DASHBOARD'}
            </h3>
            <div className="h-[2px] w-12 bg-blue-500 rounded-full mx-3 mt-1.5" />
          </div>

          {sidebarItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setSettingsActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  settingsActiveTab === item.id
                    ? 'bg-blue-600/10 border border-blue-500/20 text-blue-300 shadow shadow-sky-950/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <IconComponent className={`w-4 h-4 ${item.color}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="mt-auto pt-6 border-t border-slate-800/10 no-print">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/15 text-red-400 rounded-xl text-xs font-black transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span>{t.logoutButton}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Detail Content Panel */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            
            {/* TAB 1: HOSPITAL PROFILE */}
            {settingsActiveTab === 'profile' && (
              <motion.div
                key="profile-tab"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-800/20">
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-blue-400" />
                    <div>
                      <h3 className="text-sm font-black text-white">{t.hospitalProfile}</h3>
                      <p className="text-[10px] text-slate-450">{language === 'ar' ? 'عرض الفهرس والهيكل الأساسي المعرف للمؤسسة' : 'Metadata defining hospital identification'}</p>
                    </div>
                  </div>

                  {!isEditingProfile && (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="px-3.5 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-300 text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      {t.editInfo}
                    </button>
                  )}
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleSaveProfile} className="space-y-5 bg-white/5 p-5 border border-white/10 rounded-2.5xl">
                    <h4 className="text-xs font-bold text-slate-200 border-b border-white/5 pb-2">{t.hospitalDetails}</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-slate-450 mb-1.5">{t.hospitalNameLabel} (العربية)</label>
                        <input
                          type="text"
                          required
                          value={profileForm.nameAr}
                          onChange={(e) => setProfileForm({ ...profileForm, nameAr: e.target.value })}
                          className="w-full px-3 py-2.5 glass-input border border-white/10 rounded-xl text-white text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-455 mb-1.5">{t.hospitalNameLabel} (English)</label>
                        <input
                          type="text"
                          required
                          value={profileForm.nameEn}
                          onChange={(e) => setProfileForm({ ...profileForm, nameEn: e.target.value })}
                          className="w-full px-3 py-2.5 glass-input border border-white/10 rounded-xl text-white text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-450 mb-1.5">{t.hospitalAddressLabel} (العربية)</label>
                        <input
                          type="text"
                          required
                          value={profileForm.addressAr}
                          onChange={(e) => setProfileForm({ ...profileForm, addressAr: e.target.value })}
                          className="w-full px-3 py-2.5 glass-input border border-white/10 rounded-xl text-white text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-455 mb-1.5">{t.hospitalAddressLabel} (English)</label>
                        <input
                          type="text"
                          required
                          value={profileForm.addressEn}
                          onChange={(e) => setProfileForm({ ...profileForm, addressEn: e.target.value })}
                          className="w-full px-3 py-2.5 glass-input border border-white/10 rounded-xl text-white text-xs focus:outline-none"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] text-slate-450 mb-1.5">{t.hospitalPhoneLabel}</label>
                        <input
                          type="text"
                          required
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="w-full px-3 py-2.5 glass-input border border-white/10 rounded-xl text-white text-xs focus:outline-none font-mono"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="block text-[10px] text-slate-450 mb-1">
                          {language === 'ar' ? 'صورة أو شعار المستشفى (تحديد من الحاسوب)' : 'Hospital Logo / Emblem (Upload from PC)'}
                        </label>
                        
                        <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-3 rounded-2xl">
                          {profileForm.logoUrl ? (
                            <div className="relative group shrink-0">
                              <img
                                src={profileForm.logoUrl}
                                alt="Logo Preview"
                                referrerPolicy="no-referrer"
                                className="w-14 h-14 object-cover rounded-xl border border-white/10 bg-white p-0.5"
                              />
                              <button
                                type="button"
                                onClick={() => setProfileForm(p => ({ ...p, logoUrl: '' }))}
                                className="absolute -top-1.5 -right-1.5 p-1 bg-red-600 hover:bg-red-500 text-white rounded-full transition-colors shadow"
                                title={language === 'ar' ? 'حذف الشعار' : 'Delete Logo'}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="w-14 h-14 rounded-xl border border-dashed border-white/20 flex items-center justify-center text-slate-500 shrink-0">
                              <Building className="w-6 h-6 animate-pulse" />
                            </div>
                          )}

                          <div className={`flex-1 space-y-1.5 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                            <input
                              type="file"
                              id="hospital-logo-file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const img = new Image();
                                  img.onload = () => {
                                    const MAX_WIDTH = 256;
                                    const MAX_HEIGHT = 256;
                                    let width = img.width;
                                    let height = img.height;

                                    if (width > height) {
                                      if (width > MAX_WIDTH) {
                                        height *= MAX_WIDTH / width;
                                        width = MAX_WIDTH;
                                      }
                                    } else {
                                      if (height > MAX_HEIGHT) {
                                        width *= MAX_HEIGHT / height;
                                        height = MAX_HEIGHT;
                                      }
                                    }

                                    const canvas = document.createElement('canvas');
                                    canvas.width = width;
                                    canvas.height = height;
                                    const ctx = canvas.getContext('2d');
                                    if (ctx) {
                                      ctx.drawImage(img, 0, 0, width, height);
                                      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                                      setProfileForm((prev) => ({ ...prev, logoUrl: dataUrl }));
                                      showToast(
                                        language === 'ar' 
                                          ? 'تم تحميل وتجهيز الشعار من الحاسبة بنجاح!' 
                                          : 'Logo uploaded and resized successfully!',
                                        'success'
                                      );
                                    }
                                  };
                                  img.src = event.target?.result as string;
                                };
                                reader.readAsDataURL(file);
                              }}
                            />
                            
                            <label
                              htmlFor="hospital-logo-file"
                              className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              {language === 'ar' ? 'تحديد ملف الصورة...' : 'Choose image file...'}
                            </label>
                            <p className="text-[9px] text-slate-500 leading-relaxed">
                              {language === 'ar' 
                                ? 'يدعم صيغ JPG, PNG, WebP. يتم ضغط الصورة تلقائياً لضمان حفظ سلس وسريع بالنظام.'
                                : 'Supports JPG, PNG, WebP. Formatted and optimized automatically for persistent storage.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Metadata field creation */}
                    <div className="space-y-3 pt-4 border-t border-white/5">
                      <h4 className="text-xs font-bold text-slate-200 flex items-center justify-between">
                        <span>{t.additionalCustomFields}</span>
                      </h4>

                      {/* Custom informational fields list */}
                      {(profileForm.customFields || []).length > 0 && (
                        <div className="space-y-1.5">
                          {profileForm.customFields.map((field, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-white/5 border border-white/10 rounded-lg text-xs">
                              <div>
                                <span className="font-semibold text-blue-300">{field.key}:</span>{' '}
                                <span className="text-white">{field.value}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomField(idx)}
                                className="p-1 hover:bg-red-500/15 text-red-400 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder={t.fieldName}
                          value={newCustomKey}
                          onChange={(e) => setNewCustomKey(e.target.value)}
                          className="w-1/3 px-3 py-2 glass-input border border-white/10 rounded-lg text-white text-xs focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder={t.fieldValue}
                          value={newCustomValue}
                          onChange={(e) => setNewCustomValue(e.target.value)}
                          className="flex-1 px-3 py-2 glass-input border border-white/10 rounded-lg text-white text-xs focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomField}
                          className="px-3 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          {t.addInfoField}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2.5 pt-4 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="px-4 py-2 border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        {t.cancel}
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow shadow-sky-950/20 cursor-pointer"
                      >
                        {t.saveChanges}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-5 bg-gradient-to-br from-blue-950/15 via-slate-900/10 to-transparent p-6 border border-white/10 rounded-2.5xl relative overflow-hidden shadow-inner">
                    <div className="absolute top-4 left-4 border border-blue-500/15 rounded-2xl overflow-hidden shrink-0 shadow-md">
                      {hospitalProfile.logoUrl ? (
                        <img
                          src={hospitalProfile.logoUrl}
                          alt="Hospital Logo"
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 object-cover bg-white p-0.5 rounded-2xl"
                        />
                      ) : (
                        <div className="p-4 bg-blue-600/10 text-blue-300 rounded-2xl">
                          <Building className="w-10 h-10 animate-pulse" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 max-w-lg">
                      <div className="space-y-1">
                        <span className="text-[10px] text-blue-400 font-mono tracking-widest uppercase font-black">
                          {language === 'ar' ? 'المستشفى المفهرس بالنظام' : 'INDEXED HOSPITAL ENTITY'}
                        </span>
                        <h2 className="text-xl font-extrabold text-white">
                          {language === 'ar' ? hospitalProfile.nameAr : hospitalProfile.nameEn}
                        </h2>
                        <p className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">
                          {hospitalProfile.nameEn}
                        </p>
                      </div>

                      <div className="h-[1px] w-28 bg-blue-500/20" />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="flex items-center gap-2 bg-white/5 p-2.5 rounded-xl border border-white/5">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                          <div>
                            <span className="block text-[9px] text-slate-500 leading-none mb-1">{t.hospitalAddressLabel}</span>
                            <span className="text-slate-200 font-bold">{language === 'ar' ? hospitalProfile.addressAr : hospitalProfile.addressEn}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 bg-white/5 p-2.5 rounded-xl border border-white/5">
                          <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                          <div>
                            <span className="block text-[9px] text-slate-500 leading-none mb-1">{t.hospitalPhoneLabel}</span>
                            <span className="text-slate-200 font-mono font-bold leading-normal">{hospitalProfile.phone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Custom Fields list */}
                      {(hospitalProfile.customFields || []).length > 0 && (
                        <div className="space-y-2 pt-4 border-t border-slate-800/15">
                          <h4 className="text-[11px] font-black text-slate-450 tracking-wide uppercase">
                            {language === 'ar' ? 'الحقول التعريفية الإضافية الملحقة' : 'ATTACHED CUSTOM INFORMATION'}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {hospitalProfile.customFields.map((field, idx) => (
                              <div key={idx} className="flex gap-1.5 p-2 bg-white/5 rounded-lg border border-white/5">
                                <span className="font-semibold text-blue-300">{field.key}:</span>
                                <span className="text-slate-200">{field.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 2: USERS & PERMISSIONS */}
            {settingsActiveTab === 'users' && (
              <motion.div
                key="users-tab"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-sm font-black text-white">{t.userControlTitle}</h3>
                  <p className="text-[10px] text-slate-450">{language === 'ar' ? 'تعيين الصلاحيات والأدوار للمستخدمين لضمان سرية المنظومة المالية والطبية' : 'Delegate system and lab module access levels'}</p>
                </div>

                <div className="space-y-6">
                  {/* SECTION 1: HR & PAYROLL SYSTEM MATRIX */}
                  <div className="bg-white/5 border border-white/10 rounded-2.5xl p-5 space-y-4">
                    <div className="border-b border-white/5 pb-3">
                      <h4 className="text-xs font-black text-white flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
                        <span>{language === 'ar' ? 'صلاحيات نظام الموارد البشرية والرواتب (HR & Payroll System)' : 'HR & Payroll System Access Clearance'}</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {language === 'ar' ? 'إدارة تراخيص عرض وتعديل وحذف التقارير المالية والرواتب المخصصة للموظفين' : 'Configure who can read, write, print or delete payroll ledger variables'}
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-right border-collapse" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                        <thead>
                          <tr className="border-b border-white/10 text-slate-400 font-bold">
                            <th className="pb-2.5 pt-1 pr-2">{t.roleLabel}</th>
                            <th className="pb-2.5 pt-1 text-center">{t.permissionRead}</th>
                            <th className="pb-2.5 pt-1 text-center">{t.permissionWrite}</th>
                            <th className="pb-2.5 pt-1 text-center">{t.permissionDelete}</th>
                            <th className="pb-2.5 pt-1 text-center">{t.permissionPrint}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {(['SystemAdmin', 'SuperAdmin', 'Accountant', 'HR', 'DataEntry'] as UserRole[]).map((role) => {
                            const matrix = (permissionsMatrix as any)?.[role] || { read: false, write: false, delete: false, print: false };
                            const roleLabelStr = role === 'SystemAdmin' ? t.systemAdminRole :
                                                 role === 'SuperAdmin' ? t.adminRole :
                                                 role === 'Accountant' ? t.accountantRole :
                                                 role === 'HR' ? t.hrRole :
                                                 t.dataEntryRole;
                            const roleDescStr = role === 'SystemAdmin' ? t.userRoleSystemAdminDesc :
                                                role === 'SuperAdmin' ? t.userRoleAdminDesc :
                                                role === 'Accountant' ? t.userRoleAccountantDesc :
                                                role === 'HR' ? t.userRoleHrDesc :
                                                t.userRoleDataEntryDesc;
                            
                            return (
                              <tr key={role} className="hover:bg-white/[0.01]">
                                <td className="py-3 pr-2">
                                  <span className="block font-bold text-slate-100">{roleLabelStr}</span>
                                  <span className="block text-[9px] text-slate-500 font-normal">{roleDescStr}</span>
                                </td>
                                {(['read', 'write', 'delete', 'print'] as const).map((perm) => (
                                  <td key={perm} className="py-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={matrix[perm]}
                                      disabled={!(currentUser?.role === 'SystemAdmin' || currentUser?.role === 'SuperAdmin') || role === 'SystemAdmin' || role === 'SuperAdmin'}
                                      onChange={() => handleToggleMatrixPermission(role, perm)}
                                      className="w-3.5 h-3.5 text-blue-600 bg-slate-900 border-white/20 rounded cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* SECTION 2: LABORATORY & BLOOD BANK WINDOWS MATRIX */}
                  <div className="bg-white/5 border border-white/10 rounded-2.5xl p-5 space-y-4">
                    <div className="border-b border-white/5 pb-3">
                      <h4 className="text-xs font-black text-white flex items-center gap-2">
                        <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
                        <span>{language === 'ar' ? 'صلاحيات قسم المختبر ومصرف الدم (Lab & Blood Bank Windows)' : 'Lab & Blood Bank Module Permissions'}</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {language === 'ar' ? 'حدد مستوى تخويل كل فئة وظيفية للدخول والمشاهدة لأي من النوافذ الخمسة المستقلة للمختبر' : 'Manage access levels (Full, Read-Only, or Hidden) for each of the five core laboratory tabs'}
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-right border-collapse" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                        <thead>
                          <tr className="border-b border-white/10 text-slate-400 font-bold text-[11px]">
                            <th className="pb-2.5 pt-1 pr-2 whitespace-nowrap">{t.roleLabel}</th>
                            <th className="pb-2.5 pt-1 text-center whitespace-nowrap">{language === 'ar' ? 'تسجيل البصمة' : 'Fingerprint Reg.'}</th>
                            <th className="pb-2.5 pt-1 text-center whitespace-nowrap">{language === 'ar' ? 'سجل المرضى' : 'Patient Log'}</th>
                            <th className="pb-2.5 pt-1 text-center whitespace-nowrap">{language === 'ar' ? 'سحب العينات' : 'Sample Collection'}</th>
                            <th className="pb-2.5 pt-1 text-center whitespace-nowrap">{language === 'ar' ? 'سجل العينات والتحاليل' : 'Sample Register'}</th>
                            <th className="pb-2.5 pt-1 text-center whitespace-nowrap">{language === 'ar' ? 'مواد المختبر' : 'Lab Materials'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {(['SystemAdmin', 'Lab_Manager', 'Lab_Analyst', 'Lab_DataEntry', 'Lab_Technician'] as UserRole[]).map((role) => {
                            const labMatrix = (labPermissionsMatrix && (labPermissionsMatrix as any)[role]) || { registry: 'none', patients_list: 'none', samples: 'none', sample_logs: 'none', transfusion: 'none' };
                            const roleLabelStr = role === 'SystemAdmin' ? t.systemAdminRole :
                                                 role === 'Lab_Manager' ? t.labManagerRole :
                                                 role === 'Lab_Analyst' ? t.labAnalystRole :
                                                 role === 'Lab_DataEntry' ? t.labDataEntryRole :
                                                 t.labTechnicianRole;
                            const roleDescStr = role === 'SystemAdmin' ? t.userRoleSystemAdminDesc :
                                                role === 'Lab_Manager' ? t.userRoleLabManagerDesc :
                                                role === 'Lab_Analyst' ? t.userRoleLabAnalystDesc :
                                                role === 'Lab_DataEntry' ? t.userRoleLabDataEntryDesc :
                                                t.userRoleLabTechDesc;
                            
                            const windowsKeys = ['registry', 'patients_list', 'samples', 'sample_logs', 'transfusion'] as const;

                            return (
                              <tr key={role} className="hover:bg-white/[0.01]">
                                <td className="py-3 pr-2 whitespace-nowrap">
                                  <span className="block font-bold text-slate-100">{roleLabelStr}</span>
                                  <span className="block text-[9px] text-slate-500 font-normal">{roleDescStr}</span>
                                </td>
                                {windowsKeys.map((winKey) => {
                                  const level = labMatrix[winKey] || 'none';
                                  return (
                                    <td key={winKey} className="py-3 px-1 text-center min-w-[130px]">
                                      <select
                                        value={level}
                                        disabled={!(currentUser?.role === 'SystemAdmin' || currentUser?.role === 'SuperAdmin') || role === 'SystemAdmin' || role === 'SuperAdmin'}
                                        onChange={(e) => handleChangeLabPermission(role, winKey, e.target.value as any)}
                                        className={`px-2 py-1 text-[10px] bg-slate-900 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer font-bold ${
                                          level === 'full' 
                                            ? 'text-emerald-400 bg-emerald-500/5' 
                                            : level === 'read' 
                                              ? 'text-indigo-400 bg-indigo-500/5' 
                                              : 'text-slate-400'
                                        }`}
                                      >
                                        <option value="full" className="bg-slate-950 text-emerald-400 font-bold">
                                          {language === 'ar' ? 'كامل الصلاحيات' : 'Full Access'}
                                        </option>
                                        <option value="read" className="bg-slate-950 text-indigo-400 font-bold">
                                          {language === 'ar' ? 'قراءة فقط' : 'Read Only'}
                                        </option>
                                        <option value="none" className="bg-slate-950 text-slate-400 font-bold">
                                          {language === 'ar' ? 'مخفي' : 'No Access (Hidden)'}
                                        </option>
                                      </select>
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Add User and Users List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Create System Admin Form (Special Box requested by user) */}
                  <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-indigo-950/40 via-blue-950/40 to-slate-900/40 border border-indigo-500/20 rounded-2.5xl p-6 space-y-4 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -z-10" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-2xl -z-10" />
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-3">
                      <div>
                        <h4 className="text-xs font-black text-indigo-300 flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-indigo-400 animate-pulse-slow" />
                          <span>{language === 'ar' ? 'بوابة تفويض وإنشاء مدير النظام (صلاحيات مطلقة)' : 'Portal for Creating & Authorizing System Administrators (Infinite Privileges)'}</span>
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {language === 'ar' 
                            ? 'هذه الخانة مخصصة لتفويض حساب "مدير نظام" فائق الصلاحيات له كامل الحق في المشاهدة والتعديل والحذف لكافة العمليات والأقسام المخبرية والمالية.' 
                            : 'This specific panel is dedicated for authorizing a "System Administrator" with complete access to view, edit, and delete in all modules and systems.'}
                        </p>
                      </div>
                      <span className="self-start px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[9px] font-bold">
                        {language === 'ar' ? 'رتبة عليا مطلقة' : 'Absolute Master Role'}
                      </span>
                    </div>

                    {isReadOnly ? (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-[11px] text-amber-300 flex gap-2">
                        <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>ميزة إضافة حسابات مقيدة بالصلاحيات الحالية.</span>
                      </div>
                    ) : (
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        setUserError('');
                        setUserSuccess('');
                        if (!sysUsername.trim() || !sysPassword.trim()) {
                          setUserError(language === 'ar' ? 'يرجى كتابة اسم مستخدم وكلمة مرور صالحة.' : 'Credentials invalid.');
                          return;
                        }
                        const exists = users.some((u) => u.username.toLowerCase() === sysUsername.trim().toLowerCase());
                        if (exists) {
                          setUserError(language === 'ar' ? 'اسم المستخدم هذا موجود مسبقاً بالنظام.' : 'Username already registered.');
                          return;
                        }
                        const newUserObj: User = {
                          id: `usr-${Date.now()}`,
                          username: sysUsername.trim().toLowerCase(),
                          password: sysPassword.trim(),
                          role: 'SystemAdmin',
                          mustChangePassword: true,
                        };
                        onUpdateUsers([...users, newUserObj]);
                        setSysUsername('');
                        setSysPassword('');
                        showToast(language === 'ar' ? 'تم إنشاء مدير النظام ذو الصلاحيات المطلقة بنجاح!' : 'System Admin created successfully!', 'success');
                      }} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                          <label className="block text-[10px] text-slate-300 mb-1.5">{language === 'ar' ? 'اسم مستخدم مدير النظام الجديد' : 'New System Admin Username'}</label>
                          <input
                            type="text"
                            required
                            value={sysUsername}
                            onChange={(e) => setSysUsername(e.target.value)}
                            placeholder="sysadmin_user"
                            className="w-full px-3 py-2 glass-input border border-indigo-500/20 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 font-mono bg-indigo-950/10"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-300 mb-1.5">{language === 'ar' ? 'كلمة المرور السرية للمدير الجديد' : 'New Admin Password'}</label>
                          <input
                            type="password"
                            required
                            value={sysPassword}
                            onChange={(e) => setSysPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-3 py-2 glass-input border border-indigo-500/20 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 bg-indigo-950/10"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-black rounded-xl transition-all shadow-lg hover:shadow-indigo-500/10 cursor-pointer text-center h-[34px] flex items-center justify-center gap-1.5"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>{language === 'ar' ? 'تفويض حساب مدير نظام' : 'Authorize System Admin'}</span>
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Create User Form */}
                  <div className="bg-white/5 border border-white/10 rounded-2.5xl p-5 space-y-4">
                    <h4 className="text-xs font-black text-white flex items-center gap-1.5 border-b border-white/5 pb-2.5">
                      <UserPlus className="w-4 h-4 text-blue-400" />
                      <span>{t.addNewUser}</span>
                    </h4>

                    {isReadOnly ? (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-[11px] text-amber-300 flex gap-2">
                        <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>ميزة إضافة حسابات مقيدة بالصلاحيات الحالية.</span>
                      </div>
                    ) : (
                      <form onSubmit={handleAddUser} className="space-y-4">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1.5">{t.username}</label>
                          <input
                            type="text"
                            required
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            placeholder="username"
                            className="w-full px-3 py-2 glass-input border border-white/10 rounded-xl text-white text-xs focus:outline-none font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1.5">{t.password}</label>
                          <input
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="password"
                            className="w-full px-3 py-2 glass-input border border-white/10 rounded-xl text-white text-xs focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1.5">{t.selectRole}</label>
                          <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value as UserRole)}
                            className="w-full px-3 py-2 glass-input border border-white/10 rounded-xl text-white text-xs focus:outline-none bg-slate-900"
                          >
                            <option value="SystemAdmin" className="bg-slate-900 text-white">{t.systemAdminRole}</option>
                            <option value="SuperAdmin" className="bg-slate-900 text-white">{t.adminRole}</option>
                            <option value="Accountant" className="bg-slate-900 text-white">{t.accountantRole}</option>
                            <option value="HR" className="bg-slate-900 text-white">{t.hrRole}</option>
                            <option value="DataEntry" className="bg-slate-900 text-white">{t.dataEntryRole}</option>
                            <option value="Lab_Manager" className="bg-slate-900 text-white">{t.labManagerRole}</option>
                            <option value="Lab_Analyst" className="bg-slate-900 text-white">{t.labAnalystRole}</option>
                            <option value="Lab_DataEntry" className="bg-slate-900 text-white">{t.labDataEntryRole}</option>
                            <option value="Lab_Technician" className="bg-slate-900 text-white">{t.labTechnicianRole}</option>
                          </select>
                        </div>

                        {userError && <p className="text-[10px] text-red-450 font-bold">{userError}</p>}
                        {userSuccess && <p className="text-[10px] text-emerald-400 font-bold">{userSuccess}</p>}

                        <button
                          type="submit"
                          className="w-full py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow cursor-pointer text-center"
                        >
                          {t.createLicense}
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Active Users List */}
                  <div className="bg-white/5 border border-white/10 rounded-2.5xl p-5 space-y-3">
                    <h4 className="text-xs font-black text-white border-b border-white/5 pb-2.5">
                      {t.authorizedAccounts} ({users.length})
                    </h4>

                    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                      {users.map((usr) => (
                        <div
                          key={usr.id}
                          className="bg-white/5 p-3 rounded-xl border border-white/10 hover:border-white/15 flex justify-between items-center text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`p-1.5 rounded-lg shrink-0 ${
                              usr.role === 'SystemAdmin' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.15)]' :
                              usr.role === 'SuperAdmin' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/10' :
                              usr.role === 'Accountant' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/10' :
                              usr.role === 'HR' ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/10' :
                              usr.role === 'Lab_Manager' ? 'bg-rose-600/10 text-rose-400 border border-rose-500/10' :
                              usr.role === 'Lab_Analyst' ? 'bg-purple-600/10 text-purple-400 border border-purple-500/10' :
                              usr.role === 'Lab_DataEntry' ? 'bg-amber-600/10 text-amber-400 border border-amber-500/10' :
                              'bg-slate-800 text-slate-400'
                            }`}>
                              <UserCheck className="w-4 h-4" />
                            </span>
                            <div>
                              <p className="text-white font-mono font-black">{usr.username}</p>
                              <p className="text-[9px] text-slate-500 leading-none mt-1">
                                {usr.role === 'SystemAdmin' ? t.systemAdminRole :
                                 usr.role === 'SuperAdmin' ? t.adminRole :
                                 usr.role === 'Accountant' ? t.accountantRole :
                                 usr.role === 'HR' ? t.hrRole :
                                 usr.role === 'DataEntry' ? t.dataEntryRole :
                                 usr.role === 'Lab_Technician' ? t.labTechnicianRole :
                                 usr.role === 'Ward_Nurse' ? t.wardNurseRole :
                                 usr.role === 'Lab_Manager' ? t.labManagerRole :
                                 usr.role === 'Lab_Analyst' ? t.labAnalystRole :
                                 usr.role === 'Lab_DataEntry' ? t.labDataEntryRole :
                                 usr.role}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[8px] tracking-wide uppercase font-black ${
                              usr.role === 'SystemAdmin' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/20' :
                              usr.role === 'SuperAdmin' ? 'bg-blue-600/10 text-blue-400' :
                              usr.role === 'Accountant' ? 'bg-indigo-600/10 text-indigo-400' :
                              usr.role === 'HR' ? 'bg-emerald-600/10 text-emerald-450' :
                              usr.role === 'Lab_Manager' ? 'bg-rose-600/10 text-rose-400' :
                              usr.role === 'Lab_Analyst' ? 'bg-purple-600/10 text-purple-400' :
                              usr.role === 'Lab_DataEntry' ? 'bg-amber-600/10 text-amber-400' :
                              'bg-slate-855 text-slate-450'
                            }`}>
                              {usr.role}
                            </span>
                            {!isReadOnly && (
                              <button
                                onClick={() => handleChangeUserPassword(usr.id)}
                                className="p-1 hover:bg-amber-500/15 text-slate-500 hover:text-amber-400 rounded transition-colors cursor-pointer animate-pulse-slow"
                                title={language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {!isReadOnly && usr.username !== 'admin' && (usr.role !== 'SystemAdmin' || currentUser?.role === 'SystemAdmin') && (
                              <button
                                onClick={() => handleDeleteUser(usr.id)}
                                className="p-1 hover:bg-red-500/15 text-slate-500 hover:text-red-400 rounded transition-colors cursor-pointer"
                                title="حذف حساب الدخول"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 3: LANGUAGE SETTINGS */}
            {settingsActiveTab === 'language' && (
              <motion.div
                key="language-tab"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-sm font-black text-white">{t.languageSettings}</h3>
                  <p className="text-[10px] text-slate-450">{language === 'ar' ? 'اختر اللغة الرسمية لتطابق اتجاه ومحاذاة الشاشات فوريّاً' : 'Set active interface syntax and layout direction'}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Arabic card */}
                  <button
                    onClick={() => onUpdateLanguage('ar')}
                    className={`p-6 rounded-2.5xl border text-right transition-all flex flex-col justify-between h-36 cursor-pointer ${
                      language === 'ar'
                        ? 'bg-blue-600/10 border-blue-500/20 text-blue-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="p-2 bg-white/5 rounded-xl text-lg font-black font-sans shrink-0">ع</span>
                      {language === 'ar' && (
                        <span className="p-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/10 rounded-full">
                          <Check className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white">اللغة العربية (Arabic)</h4>
                      <p className="text-[10px] text-slate-400 leading-none mt-1">تفعيل نظام الاتجاه من اليمين إلى اليسار RTL وتخطيط القاهرة Cairo</p>
                    </div>
                  </button>

                  {/* English card */}
                  <button
                    onClick={() => onUpdateLanguage('en')}
                    className={`p-6 rounded-2.5xl border text-left transition-all flex flex-col justify-between h-36 cursor-pointer ${
                      language === 'en'
                        ? 'bg-blue-600/10 border-blue-500/20 text-blue-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                    dir="ltr"
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="p-2 bg-white/5 rounded-xl text-lg font-black font-sans shrink-0">En</span>
                      {language === 'en' && (
                        <span className="p-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/10 rounded-full">
                          <Check className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white">English Language</h4>
                      <p className="text-[10px] text-slate-400 leading-none mt-1">Initiate Left-To-Right (LTR) grid alignment with typography Inter</p>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {/* TAB 4: THEMES & VISUALS */}
            {settingsActiveTab === 'theme' && (
              <motion.div
                key="theme-tab"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-sm font-black text-white">{t.themesVisuals}</h3>
                  <p className="text-[10px] text-slate-450">{t.themeSelectTitle}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Light mode select */}
                  <button
                    onClick={() => onUpdateTheme('light')}
                    className={`p-5 rounded-2.5xl border text-right transition-all flex flex-col gap-4 cursor-pointer relative overflow-hidden ${
                      theme === 'light'
                        ? 'bg-blue-600/10 border-blue-500/30 text-blue-300 shadow shadow-sky-950/15'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/15'
                    }`}
                  >
                    {/* Visual miniature representation */}
                    <div className="w-full h-12 rounded-xl bg-slate-100 flex flex-col p-1.5 gap-1 border border-zinc-200">
                      <div className="w-2/3 h-2 bg-slate-300 rounded" />
                      <div className="flex gap-1 w-full">
                        <div className="w-1/3 h-5 bg-white border border-zinc-200 rounded" />
                        <div className="w-2/3 h-5 bg-white border border-zinc-200 rounded" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">{t.themeLight}</h4>
                      <p className="text-[9px] text-slate-400 leading-relaxed mt-1">{t.themeLightDesc}</p>
                    </div>
                  </button>

                  {/* Dark mode select */}
                  <button
                    onClick={() => onUpdateTheme('dark')}
                    className={`p-5 rounded-2.5xl border text-right transition-all flex flex-col gap-4 cursor-pointer relative overflow-hidden ${
                      theme === 'dark'
                        ? 'bg-blue-600/10 border-blue-500/30 text-blue-300 shadow shadow-sky-950/15'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/15'
                    }`}
                  >
                    <div className="w-full h-12 rounded-xl bg-[#0a192f] flex flex-col p-1.5 gap-1 border border-blue-900/20">
                      <div className="w-2/3 h-2 bg-blue-500/15 rounded" />
                      <div className="flex gap-1 w-full">
                        <div className="w-1/3 h-5 bg-white/5 border border-white/10 rounded" />
                        <div className="w-2/3 h-5 bg-white/5 border border-white/10 rounded" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">{t.themeDark}</h4>
                      <p className="text-[9px] text-slate-400 leading-relaxed mt-1">{t.themeDarkDesc}</p>
                    </div>
                  </button>

                  {/* Brand mode select */}
                  <button
                    onClick={() => onUpdateTheme('brand')}
                    className={`p-5 rounded-2.5xl border text-right transition-all flex flex-col gap-4 cursor-pointer relative overflow-hidden ${
                      theme === 'brand'
                        ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-300 shadow shadow-emerald-950/15 font-bold scale-[1.02] border-emerald-500'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/15'
                    }`}
                  >
                    <div className="w-full h-12 rounded-xl bg-[#021814] flex flex-col p-1.5 gap-1 border border-emerald-900/20">
                      <div className="w-2/3 h-2 bg-emerald-500/15 rounded" />
                      <div className="flex gap-1 w-full">
                        <div className="w-1/3 h-5 bg-[#062e22]/50 border border-emerald-900/35 rounded" />
                        <div className="w-2/3 h-5 bg-[#062e22]/50 border border-emerald-900/35 rounded" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">{t.themeBrand}</h4>
                      <p className="text-[9px] text-emerald-450 leading-relaxed mt-1">{t.themeBrandDesc}</p>
                    </div>
                  </button>

                  {/* Cosmic mode select */}
                  <button
                    onClick={() => onUpdateTheme('cosmic')}
                    className={`p-5 rounded-2.5xl border text-right transition-all flex flex-col gap-4 cursor-pointer relative overflow-hidden ${
                      theme === 'cosmic'
                        ? 'bg-purple-600/10 border-purple-500/30 text-purple-300 shadow shadow-purple-950/15 font-bold scale-[1.02] border-purple-500'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/15'
                    }`}
                  >
                    <div className="w-full h-12 rounded-xl bg-[#0b071e] flex flex-col p-1.5 gap-1 border border-purple-900/20">
                      <div className="w-2/3 h-2 bg-purple-500/15 rounded" />
                      <div className="flex gap-1 w-full">
                        <div className="w-1/3 h-5 bg-[#170c2e]/50 border border-purple-900/35 rounded" />
                        <div className="w-2/3 h-5 bg-[#170c2e]/50 border border-purple-900/35 rounded" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">{t.themeCosmic}</h4>
                      <p className="text-[9px] text-slate-400 leading-relaxed mt-1">{t.themeCosmicDesc}</p>
                    </div>
                  </button>

                  {/* Luxury mode select */}
                  <button
                    onClick={() => onUpdateTheme('luxury')}
                    className={`p-5 rounded-2.5xl border text-right transition-all flex flex-col gap-4 cursor-pointer relative overflow-hidden ${
                      theme === 'luxury'
                        ? 'bg-[#d4a359]/10 border-[#d4a359]/30 text-[#d4a359] shadow shadow-yellow-950/15 font-bold scale-[1.02] border-[#d4a359]'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/15'
                    }`}
                  >
                    <div className="w-full h-12 rounded-xl bg-[#121214] flex flex-col p-1.5 gap-1 border border-[#d4a359]/20">
                      <div className="w-2/3 h-2 bg-[#d4a359]/15 rounded" />
                      <div className="flex gap-1 w-full">
                        <div className="w-1/3 h-5 bg-[#1e1e24]/50 border border-[#d4a359]/35 rounded" />
                        <div className="w-2/3 h-5 bg-[#1e1e24]/50 border border-[#d4a359]/35 rounded" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">{t.themeLuxury}</h4>
                      <p className="text-[9px] text-slate-400 leading-relaxed mt-1">{t.themeLuxuryDesc}</p>
                    </div>
                  </button>

                  {/* Grey mode select */}
                  <button
                    onClick={() => onUpdateTheme('grey')}
                    className={`p-5 rounded-2.5xl border text-right transition-all flex flex-col gap-4 cursor-pointer relative overflow-hidden ${
                      theme === 'grey'
                        ? 'bg-slate-500/15 border-slate-400/50 text-slate-200 shadow shadow-slate-950/20 font-bold scale-[1.02] border-slate-400'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/15'
                    }`}
                  >
                    <div className="w-full h-12 rounded-xl bg-[#27282c] flex flex-col p-1.5 gap-1 border border-slate-700/30">
                      <div className="w-2/3 h-2 bg-slate-400/20 rounded" />
                      <div className="flex gap-1 w-full">
                        <div className="w-1/3 h-5 bg-[#1e1f22] border border-slate-800/40 rounded" />
                        <div className="w-2/3 h-5 bg-[#1e1f22] border border-slate-800/40 rounded" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">{t.themeGrey}</h4>
                      <p className="text-[9px] text-slate-400 leading-relaxed mt-1">{t.themeGreyDesc}</p>
                    </div>
                  </button>
                </div>

                {/* Dynamic Font Size Control Section */}
                <div className="pt-6 border-t border-white/10 space-y-4 font-sans" dir="rtl">
                  <div>
                    <h3 className="text-sm font-black text-white">
                      {language === 'ar' ? 'التحكم بحجم خطوط النظام (تكبير وتصغير الخط)' : 'System Dynamic Font Scaling'}
                    </h3>
                    <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                      {language === 'ar' 
                        ? 'اختر التنسيق المفضل والأنسب لمستوى الرؤية ووضوح تفاصيل الأرقام والرواتب في واجهات النظام والتقارير' 
                        : 'Choose the overall scaling size of dynamic UI elements, tables, and monetary figures'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                    {[
                      { id: 'xs', val: 70, label: language === 'ar' ? 'صغير جداً (70%)' : 'XS Slim (70%)' },
                      { id: 'sm', val: 85, label: language === 'ar' ? 'صغير ومضغوط (85%)' : 'Small (85%)' },
                      { id: 'base', val: 100, label: language === 'ar' ? 'الافتراضي العادي (100%)' : 'Default (100%)' },
                      { id: 'lg', val: 120, label: language === 'ar' ? 'كبير ومريح (120%)' : 'Comfortable (120%)' },
                      { id: 'xl', val: 140, label: language === 'ar' ? 'مكبر وواضح (140%)' : 'Clear bold (140%)' },
                      { id: '2xl', val: 165, label: language === 'ar' ? 'ضخم جداً (165%)' : 'Very Bold (165%)' },
                      { id: '3xl', val: 190, label: language === 'ar' ? 'عملاق وممتد (190%)' : 'Extra Large (190%)' }
                    ].map((sz) => (
                      <button
                        key={sz.id}
                        type="button"
                        onClick={() => onUpdateFontSize(sz.val)}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-bold text-[10px] sm:text-[11px] ${
                          fontSize === sz.val
                            ? 'bg-blue-600/10 border-blue-500/45 text-blue-300 shadow scale-[1.03] outline-none'
                            : 'bg-white/5 border-white/10 text-slate-350 hover:border-white/15'
                        }`}
                      >
                        {sz.label}
                      </button>
                    ))}
                  </div>

                  {/* Manual Number input section */}
                  <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 w-fit">
                    <span className="text-[11px] font-bold text-slate-300">
                      {language === 'ar' ? 'أو أدخل نسبة مئوية مخصصة يدوياً هنا:' : 'Or enter custom manual percentage:'}
                    </span>
                    <div className="flex items-center gap-1.5 bg-slate-950/40 px-3 py-1.5 border border-white/10 rounded-lg">
                      <input
                        type="number"
                        min="50"
                        max="300"
                        value={fontSize}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) {
                            onUpdateFontSize(Math.min(300, Math.max(50, val)));
                          }
                        }}
                        className="w-12 bg-transparent text-center text-blue-300 font-sans font-black text-xs p-0 border-0 focus:ring-0 focus:outline-none"
                      />
                      <span className="text-[10px] text-blue-400 font-bold select-none">%</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 5: TIME & DATE */}
            {settingsActiveTab === 'time' && (
              <motion.div
                key="time-tab"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-sm font-black text-white">{t.timeDateTitle}</h3>
                  <p className="text-[10px] text-slate-450">{language === 'ar' ? 'حدد خيارات المزامنة المتأخرة لأغراض الإغلاقات والاسترجاع' : 'Chronology audit configs'}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Auto mode */}
                  <button
                    onClick={() => onUpdateTimeSettings({ ...timeSettings, autoSync: true })}
                    className={`p-5 rounded-2.5xl border text-right transition-all flex flex-col justify-between h-32 cursor-pointer ${
                      timeSettings.autoSync
                        ? 'bg-blue-600/10 border-blue-500/20 text-blue-300 shadow shadow-sky-950/10'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="p-2 bg-white/5 rounded-xl shrink-0"><RefreshCw className="w-5 h-5 text-blue-400" /></span>
                      {timeSettings.autoSync && (
                        <span className="p-1 px-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/10 rounded-full text-[9px] font-black uppercase">
                          {language === 'ar' ? 'نشط' : 'Active'}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">{t.syncAuto}</h4>
                      <p className="text-[9px] text-slate-450 leading-none mt-1">{t.syncAutoDesc}</p>
                    </div>
                  </button>

                  {/* Manual mode */}
                  <button
                    onClick={() => onUpdateTimeSettings({ ...timeSettings, autoSync: false })}
                    className={`p-5 rounded-2.5xl border text-right transition-all flex flex-col justify-between h-32 cursor-pointer ${
                      !timeSettings.autoSync
                        ? 'bg-blue-600/10 border-blue-500/20 text-blue-300 shadow shadow-sky-950/10'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="p-2 bg-white/5 rounded-xl shrink-0"><Lock className="w-5 h-5 text-indigo-400" /></span>
                      {!timeSettings.autoSync && (
                        <span className="p-1 px-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 rounded-full text-[9px] font-black uppercase">
                          {language === 'ar' ? 'نشط' : 'Active'}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">{t.adjustManual}</h4>
                      <p className="text-[9px] text-slate-455 leading-none mt-1">{t.adjustManualDesc}</p>
                    </div>
                  </button>
                </div>

                {!timeSettings.autoSync && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-white/5 border border-white/10 rounded-2.5xl p-5 grid grid-cols-2 gap-4"
                  >
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1.5">{t.manualDate}</label>
                      <input
                        type="date"
                        value={timeSettings.manualDate}
                        onChange={(e) => onUpdateTimeSettings({ ...timeSettings, manualDate: e.target.value })}
                        className="w-full px-3 py-2 glass-input border border-white/10 rounded-xl text-white text-xs focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1.5">{t.manualTime}</label>
                      <input
                        type="time"
                        value={timeSettings.manualTime}
                        onChange={(e) => onUpdateTimeSettings({ ...timeSettings, manualTime: e.target.value })}
                        className="w-full px-3 py-2 glass-input border border-white/10 rounded-xl text-white text-xs focus:outline-none font-mono"
                      />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* TAB 6: CLOSURES & BACKUPS */}
            {settingsActiveTab === 'system' && (
              <motion.div
                key="system-tab"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                
                {/* Month closures */}
                <div className="bg-white/5 border border-white/10 p-5 rounded-2.5xl space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-white/5">
                    <Archive className="w-5 h-5 text-blue-400" />
                    <h3 className="text-xs font-extrabold text-white">{t.monthClosureTitle}</h3>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                    {t.monthClosureDesc}
                  </p>

                  {isReadOnly ? (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300 flex gap-2">
                      <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{language === 'ar' ? 'ميزة تدوير وإغلاق الأشهر وحفظ الأرشيف متاحة للمسؤولين فقط حسابك مقيد.' : 'SuperAdmin credential required to trigger calendar roll.'}</span>
                    </div>
                  ) : (
                    <form onSubmit={handleCloseMonthAndArchive} className="space-y-4 pt-2">
                      <div className="grid grid-cols-2 gap-35">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1.5">{t.indexId}</label>
                          <input
                            type="month"
                            required
                            value={archiveMonthId}
                            onChange={(e) => setArchiveMonthId(e.target.value)}
                            className="w-full px-3 py-2 glass-input border border-white/10 rounded-xl text-white font-mono text-xs focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1.5">{t.titleAndLabel}</label>
                          <input
                            type="text"
                            required
                            value={archiveLabel}
                            onChange={(e) => setArchiveLabel(e.target.value)}
                            placeholder="مثال: أيار / مايو 2026"
                            className="w-full px-3 py-2 glass-input border border-white/10 rounded-xl text-white text-xs focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow shadow-sky-950/20 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {t.closeMonthButton}
                        </button>

                        <button
                          type="button"
                          onClick={handleResetMonthlyVariables}
                          className="py-2 px-3.5 bg-rose-900/25 text-rose-300 hover:bg-rose-900/40 border border-rose-500/20 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          title="تصفير أجور وساعات هذا الشهر دون أرشفة"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          {t.manualResetVariables}
                        </button>
                      </div>
                    </form>
                  )}

                  <AnimatePresence>
                    {isArchivingSuccess && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 rounded-xl p-3 text-[10px] leading-relaxed"
                      >
                        🎉 <span className="font-bold">{language === 'ar' ? 'تهانينا! تم ترحيل الشهر بنجاح لدفاتر الأرشيف المركزي:' : 'Index roll complete:'}</span> 
                        <br />
                        {language === 'ar' ? 'تم حفظ مستحقات الرواتب بالبصمة، وفتح شهر جديد مع تفريغ وتصفير جداول العمل.' : 'Lead record locked. Temporary variables completely flushed.'}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Backups */}
                <div className="bg-[#0f172a]/40 border border-slate-800/80 p-5 rounded-2.5xl space-y-4 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-sans font-extrabold text-white">
                          {language === 'ar' ? 'مركز النسخ الاحتياطي التلقائي للأمان (Automated Backup)' : 'Safe LAN Automated Backup Engine'}
                        </h3>
                        <p className="text-[9px] text-slate-400 font-sans mt-0.5">
                          {language === 'ar' ? 'أنظمة حماية آلية للمستشفى متزامنة دورياً وعند حدوث التغييرات.' : 'Medical database auto-sync, event recovery and physical logging.'}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleCreateServerBackup}
                      disabled={isBackupLoading}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-40 text-white rounded-xl text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/15 cursor-pointer select-none"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isBackupLoading ? 'animate-spin' : ''}`} />
                      <span>{language === 'ar' ? 'إنشاء نسخة الآن' : 'Take Automatic Backup'}</span>
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                    {t.backupCenterDesc}
                  </p>

                  {/* Backup Configuration Inputs */}
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 relative overflow-hidden backdrop-blur-md">
                    <div className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <span>{language === 'ar' ? 'إعدادات مسار مجلد السيرفر وجدولة النسخ التلقائي' : 'Server Archive Location & Scheduler Cycle Settings'}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Path Location */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-slate-300 block">
                          {language === 'ar' ? 'مسار مجلد تخزين النسخ الاحتياطية بالخادم:' : 'Server Target Folder Path:'}
                        </label>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={backupConfig?.directoryPath || ''}
                          onChange={(e) => onUpdateBackupConfig({
                            ...backupConfig,
                            directoryPath: e.target.value
                          })}
                          placeholder={language === 'ar' ? 'افتراضي (مجلد backups في النظام)' : 'Default (system backups/ folder)'}
                          className="w-full px-3 py-1.5 bg-slate-950/60 border border-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                        <span className="text-[8px] text-slate-500 block leading-tight">
                          {language === 'ar' 
                            ? 'يمكن كتابة مسار نسبي أو مطلق لحفظ وتأمين الملفات بقرص صلب أو فلاش ميموري آخر.' 
                            : 'Relative or absolute path. Supports backing up to physical secondary external drives.'}
                        </span>
                      </div>

                      {/* Backup Interval hours/days scheduling */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-slate-300 block">
                          {language === 'ar' ? 'معدل أو وتيرة تكرار التخزين التلقائي:' : 'Snapshot Interval Frequency Cycle:'}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            disabled={isReadOnly}
                            value={backupConfig?.intervalHours || 24}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value) || 24);
                              onUpdateBackupConfig({
                                ...backupConfig,
                                intervalHours: val
                              });
                            }}
                            className="w-20 px-3 py-1.5 bg-slate-950/60 border border-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
                          />
                          <select
                            disabled={isReadOnly}
                            value={((backupConfig?.intervalHours || 24) % 24 === 0) ? 'days' : 'hours'}
                            onChange={(e) => {
                              const currentVal = backupConfig?.intervalHours || 24;
                              if (e.target.value === 'days') {
                                const days = Math.max(1, Math.round(currentVal / 24));
                                onUpdateBackupConfig({
                                  ...backupConfig,
                                  intervalHours: days * 24
                                });
                              } else {
                                onUpdateBackupConfig({
                                  ...backupConfig,
                                  intervalHours: currentVal
                                });
                              }
                            }}
                            className="px-2.5 py-1.5 bg-slate-950/60 border border-slate-800 disabled:opacity-40 text-slate-300 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                          >
                            <option value="hours">{language === 'ar' ? 'ساعات' : 'Hours'}</option>
                            <option value="days">{language === 'ar' ? 'أيام' : 'Days'}</option>
                          </select>
                        </div>
                        <span className="text-[8px] text-slate-500 block leading-tight">
                          {language === 'ar' 
                            ? `تتم الجدولة والنسخ دورياً كل ${backupConfig?.intervalHours || 24} ساعة في خلفية النظام.` 
                            : `Background thread triggers manual-rollback snapshots dynamically every ${backupConfig?.intervalHours || 24} hours.`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Server host addresses & access warning banner */}
                  <div className="p-3 rounded-2xl bg-slate-900/40 border border-white/5 text-[10px] font-sans flex items-start gap-2.5 leading-relaxed text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 animate-pulse shrink-0" />
                    <div>
                      <span className="font-bold text-white block mb-0.5">
                        {language === 'ar' ? 'البث والولوج عبر الشبكة المحلية (LAN Network App):' : 'LAN Production Network Broadcasting:'}
                      </span>
                      <span>
                        {language === 'ar' 
                          ? 'يمكن لأي هاتف، كمبيوتر أو تابلت متصل بالراوتر الولوج للنظام فوراً وبدقة عبر الآيبي المحلي للملقم الأساسي للمستشفى.' 
                          : 'System binds dynamically to local interface hosts. Access and ledger updates operate synchronously over the router.'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[10px] font-extrabold text-slate-300 tracking-wider uppercase flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        <span>{language === 'ar' ? 'النسخ الاحتياطية المؤرشفة بالسيرفر' : 'Server Auto-Backups Catalog'} ({serverBackups.length})</span>
                      </h4>
                      <button 
                        onClick={fetchServerBackups}
                        className="p-1 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title={language === 'ar' ? 'تحديث اللائحة' : 'Refresh list'}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {isBackupLoading && serverBackups.length === 0 ? (
                      <div className="py-6 text-center text-slate-500 text-[10px] font-sans flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                        <span>{language === 'ar' ? 'جاري جرد النسخ من قواعد السيرفر...' : 'Analyzing backup headers...'}</span>
                      </div>
                    ) : serverBackups.length === 0 ? (
                      <div className="p-4 text-center text-slate-500 text-[10px] font-sans bg-white/5 border border-white/5 rounded-2xl">
                        {language === 'ar' ? 'لا توجد نسخ احتياطية على السيرفر بعد. سيتم إنشاء واحدة تلقائياً.' : 'No automated server backups indexed yet.'}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {serverBackups.map((bk) => {
                          const sizeKb = (bk.sizeBytes / 1024).toFixed(1);
                          return (
                            <div
                              key={bk.filename}
                              className="bg-[#0f172a]/60 hover:bg-[#0f172a]/90 border border-white/5 hover:border-indigo-500/20 p-2.5 rounded-xl flex items-center justify-between text-xs transition-colors shrink-0"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[10px] text-indigo-300 font-bold max-w-[140px] sm:max-w-xs md:max-w-sm truncate" title={bk.filename}>
                                    {bk.filename}
                                  </span>
                                  <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md font-mono">
                                    {sizeKb} KB
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[9px] text-slate-400 font-sans">
                                  <span>{bk.formattedTime}</span>
                                  <span className="w-1 h-1 rounded-full bg-slate-500" />
                                  <span className="text-[9px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.2 rounded">
                                    {bk.event}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <a
                                  href={`/api/backups/download?filename=${encodeURIComponent(bk.filename)}`}
                                  download={bk.filename}
                                  className="px-2 py-1 bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/20 rounded-lg text-[9px] font-bold font-sans transition-all flex items-center gap-1 cursor-pointer"
                                  title={language === 'ar' ? 'تحميل وحفظ النسخة على جهازك' : 'Download backup file to PC'}
                                >
                                  <Download className="w-3 h-3" />
                                  <span>{language === 'ar' ? 'تحميل' : 'Download'}</span>
                                </a>
                                <button
                                  onClick={() => handleRestoreServerBackup(bk.filename)}
                                  disabled={isBackupLoading}
                                  className="px-2 py-1 bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-300 hover:text-indigo-200 border border-indigo-500/20 rounded-lg text-[9px] font-bold font-sans transition-all flex items-center gap-1 cursor-pointer"
                                  title={language === 'ar' ? 'استعادة قاعدة البيانات' : 'Restore database snapshot'}
                                >
                                  <Upload className="w-3 h-3" />
                                  <span>{language === 'ar' ? 'استعادة' : 'Restore'}</span>
                                </button>
                                {!isReadOnly && (
                                  <button
                                    onClick={() => handleDeleteServerBackup(bk.filename)}
                                    disabled={isBackupLoading}
                                    className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                    title={language === 'ar' ? 'حذف النسخة' : 'Delete backup copy'}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-3 border-t border-white/5">
                    <span className="text-[10px] text-slate-500 font-sans">
                      {language === 'ar' ? 'تصدير يدوي آمن بصيغة JSON:' : 'Manual structured download:'}
                    </span>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      <button
                        onClick={handleExportDatabase}
                        className="px-4 py-2 bg-[#0f172a]/60 hover:bg-[#0f172a]/90 text-slate-300 border border-white/10 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        {t.exportBackup}
                      </button>

                      {!isReadOnly && (
                        <>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-[#0f172a]/60 hover:bg-[#0f172a]/90 border border-white/10 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Upload className="w-4 h-4" />
                            {t.importBackup}
                          </button>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImportDatabase}
                            accept=".json"
                            className="hidden"
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* SQL Database Scripts & Migration Export Box */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/40 via-indigo-950/30 to-slate-900/60 border border-blue-500/20 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-blue-500/15">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white flex items-center gap-2">
                          <span>{language === 'ar' ? 'إعدادات وقواعد بيانات Microsoft SQL Server' : 'Microsoft SQL Server & Database Scripts'}</span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30 font-mono">
                            PORT: 1433
                          </span>
                        </h4>
                        <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                          {language === 'ar' 
                            ? 'إدارة الربط المتزامن مع SQL Server عبر المنفذ 1433 وتنزيل وتطبيق أكواد وقواعد البيانات المحدثة.' 
                            : 'Manage live synchronization with Microsoft SQL Server on Port 1433 and download migration scripts.'}
                        </p>
                      </div>
                    </div>

                    {/* SQL Connection Test Button */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleTestSqlConnection}
                        disabled={isTestingSql}
                        className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isTestingSql ? 'animate-spin' : ''}`} />
                        <span>{language === 'ar' ? (isTestingSql ? 'جاري الفحص...' : 'فحص اتصال SQL (1433)') : (isTestingSql ? 'Testing...' : 'Test SQL (1433)')}</span>
                      </button>
                    </div>
                  </div>

                  {/* SQL Live Connection Info Card */}
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full shrink-0 ${sqlStatus?.connected ? 'bg-emerald-500 shadow-md shadow-emerald-500/50 animate-pulse' : 'bg-amber-500/80'}`} />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-[11px]">
                            {language === 'ar' ? 'سيرفر الـ SQL:' : 'SQL Host:'} <span className="font-mono text-indigo-300">127.0.0.1</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-white/5">
                            Port: <strong className="text-amber-400">1433</strong>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-white/5">
                            DB: <strong className="text-blue-300">hr_farah_db</strong>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-white/5">
                            Instance: <strong className="text-purple-300">ALFARAH_SERVER</strong>
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1 leading-tight">
                          {sqlStatus?.connected 
                            ? (language === 'ar' ? '✓ الاتصال بقاعدة بيانات SQL Server نشط ومقترن بفعالية عبر البورت 1433.' : 'SQL Server is active and synchronized via Port 1433.') 
                            : (language === 'ar' ? 'النظام يعمل بوضع التخزين الآمن F: مع إمكانية التبديل والمزامنة مع SQL Server عند بدء الخدمة على البورت 1433.' : 'System active in secure storage with optional SQL 1433 sync.')}
                        </p>
                      </div>
                    </div>

                    {sqlTestResult && (
                      <div className={`text-[10px] px-2.5 py-1.5 rounded-lg border shrink-0 ${sqlTestResult.success ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-amber-500/10 text-amber-300 border-amber-500/20'}`}>
                        {sqlTestResult.message}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                    {/* Master Unified Schema */}
                    <div className="p-3.5 rounded-xl bg-slate-900/70 border border-white/5 space-y-3 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-blue-300 flex items-center gap-1.5">
                            <FileCode className="w-4 h-4 text-blue-400" />
                            <span>{language === 'ar' ? 'الكود الشامل لقاعدة البيانات' : 'Master Unified Schema'}</span>
                          </span>
                          <span className="text-[9px] font-mono text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded">
                            unified_schema.sql
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                          {language === 'ar' 
                            ? 'يشمل جميع جداول الموظفين، الرواتب، الأقسام، سجل المرضى، التحاليل، مطابقة الدم، وجدول أرشفة كتب ومواد المختبر الجديد.' 
                            : 'Includes all hospital tables, employees, payroll, patients, lab tests, blood bank and materials archive.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleCopySql('unified')}
                          className="flex-1 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 border border-blue-500/30 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          {copiedSqlType === 'unified' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-300">{language === 'ar' ? 'تم النسخ بنجاح!' : 'Copied!'}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>{language === 'ar' ? 'نسخ كود الـ SQL' : 'Copy SQL'}</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadSql('unified')}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-white/10 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          title={language === 'ar' ? 'تحميل ملف SQL الشامل' : 'Download SQL File'}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{language === 'ar' ? 'تحميل الملف' : 'Download'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Lab & Materials Migration Script */}
                    <div className="p-3.5 rounded-xl bg-slate-900/70 border border-cyan-500/10 space-y-3 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                            <FileCode className="w-4 h-4 text-cyan-400" />
                            <span>{language === 'ar' ? 'كود تحديث وترقية المختبر والمواد' : 'Lab & Materials Migration SQL'}</span>
                          </span>
                          <span className="text-[9px] font-mono text-cyan-400/80 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/20">
                            migration_lab_module.sql
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                          {language === 'ar' 
                            ? 'كود ترقية فوري وسريع لإنشاء/تحديث جدول أرشفة مواد وكتب المختبر (Lab_Materials) وحذف الأعمدة الزائدة بأمان.' 
                            : 'Dedicated idempotent migration script for Lab Materials and blood bank tables.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleCopySql('lab')}
                          className="flex-1 px-3 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          {copiedSqlType === 'lab' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-300">{language === 'ar' ? 'تم النسخ بنجاح!' : 'Copied!'}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>{language === 'ar' ? 'نسخ كود التحديث' : 'Copy Migration'}</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadSql('lab')}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-white/10 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          title={language === 'ar' ? 'تحميل ملف ترقية المختبر' : 'Download Lab Migration SQL'}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{language === 'ar' ? 'تحميل الملف' : 'Download'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Archives counts listing */}
                <div className="pt-2 border-t border-slate-800/15">
                  <h4 className="text-xs font-bold text-slate-300 mb-3">{t.savedArchiveRecords} ({archive.length})</h4>
                  {archive.length === 0 ? (
                    <p className="text-slate-500 text-center py-4 text-[10px] font-sans">{language === 'ar' ? 'الأرشيف فارغ حالياً.' : 'Current historical register is empty.'}</p>
                  ) : (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {archive.map((arch) => (
                        <div
                          key={arch.monthId}
                          className="bg-white/5 border border-white/10 p-2 rounded-xl flex justify-between items-center text-xs"
                        >
                          <div className="flex items-center gap-2 text-slate-300 font-medium font-sans">
                            <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
                            <span>{arch.monthLabel}</span>
                            <span className="text-[9px] font-mono text-slate-500 mt-0.5">({arch.monthId})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-left font-mono text-blue-300 font-bold" dir="ltr">
                              {formatIQD(arch.totalNetPaid)}
                            </div>
                            {onDeleteArchiveMonth && (
                              <button
                                onClick={() => {
                                  if (confirm(language === 'ar' ? `هل ترغب بالفعل بحذف الأرشيف (${arch.monthLabel || arch.monthId})؟` : `Delete archive (${arch.monthLabel || arch.monthId})?`)) {
                                    onDeleteArchiveMonth(arch.monthId);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                title={language === 'ar' ? 'مسح هذا الأرشيف' : 'Delete Archive'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </motion.div>
            )}

            {/* TAB 7: TECHNICAL SUPPORT & COPYRIGHT INFO */}
            {settingsActiveTab === 'support' && (
              <motion.div
                key="support-tab"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6 max-w-xl mx-auto"
              >
                
                {/* Header branding card */}
                <div className="bg-gradient-to-tr from-slate-900 via-indigo-950/25 to-slate-900 border border-white/10 p-5 rounded-2.5xl flex items-center justify-between shadow-xl relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                  <div className={`space-y-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <h3 className="text-sm font-black text-white px-0.5 tracking-wider">
                      {language === 'ar' ? 'حقوق نظام الأرشفة' : 'Archiving System Copyright & Support'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                      {language === 'ar' ? 'الملكية الفكرية ورخص التطوير والدعم الفني المباشر' : 'Proprietary platform development, licenses & live tech support.'}
                    </p>
                  </div>
                  <div className="w-[52px] h-[52px] bg-gradient-to-tr from-blue-600 to-indigo-650 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/10 shrink-0 select-none">
                    م ج
                  </div>
                </div>

                {/* Developer Identification Block */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-2.5xl p-5 relative overflow-hidden shadow-md">
                  <div className={`absolute top-0 ${language === 'ar' ? 'right-0' : 'left-0'} w-1.5 h-full bg-blue-500`} />
                  <div className={`space-y-2.5 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <span className="text-[10px] font-bold text-slate-400 block tracking-wider">
                      {language === 'ar' ? 'إعداد وتطوير النظام:' : 'System Design & Development By:'}
                    </span>
                    <h4 className="text-base font-black text-white hover:text-blue-300 transition-colors">
                      {language === 'ar' ? 'المهندس محمد جاسم محمد ابراهيم' : 'Engineer Mohammed Jassim Mohammed Ibrahim'}
                    </h4>
                    <div className="pt-0.5">
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-full text-[10px] font-black tracking-wide leading-none">
                        <Award className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                        {language === 'ar' ? 'مطور البرمجيات والأنظمة الإدارية' : 'Software & Administrative Systems Developer'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direct technical support and hotline */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-2.5xl p-5 relative overflow-hidden shadow-md">
                  <div className={`absolute top-0 ${language === 'ar' ? 'right-0' : 'left-0'} w-1.5 h-full bg-emerald-500`} />
                  <div className={`space-y-2.5 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <span className="text-[10px] font-bold text-slate-400 block tracking-wider">
                      {language === 'ar' ? 'للتواصل والدعم الفني المباشر:' : 'Direct Hotline Support Contact:'}
                    </span>
                    <div className={`flex items-center gap-2 ${language === 'ar' ? 'justify-start' : 'justify-start'}`}>
                      <Phone className="w-4 h-4 text-emerald-400 animate-bounce shrink-0" />
                      <a 
                        href="tel:07836885808" 
                        className="text-lg font-black text-white hover:text-emerald-400 transition-colors font-mono tracking-wider cursor-pointer decoration-dotted underline underline-offset-4"
                        dir="ltr"
                      >
                        07836885808
                      </a>
                    </div>
                    <p className="text-[9px] text-slate-500 leading-relaxed font-sans">
                      {language === 'ar' ? 'اضغط على الرقم للاتصال الهاتفي الفوري' : 'Tap on the telephone hyperlink to immediately dial support line.'}
                    </p>
                  </div>
                </div>

                {/* Live interaction direct action buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <a
                    href="https://wa.me/9647836885808"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3.5 px-5 bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-300 hover:text-white rounded-2xl text-xs font-black transition-all shadow shadow-emerald-950/20 active:scale-95 cursor-pointer text-center"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{language === 'ar' ? 'واتساب مباشر' : 'Direct WhatsApp Chat'}</span>
                  </a>

                  <a
                    href="tel:07836885808"
                    className="flex items-center justify-center gap-2 py-3.5 px-5 bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/25 hover:border-blue-400/40 rounded-2xl text-xs font-black transition-all shadow-lg shadow-blue-500/10 active:scale-95 cursor-pointer text-center"
                  >
                    <PhoneCall className="w-4 h-4 text-white shrink-0 animate-pulse" />
                    <span>{language === 'ar' ? 'طلب اتصـال' : 'Direct Support Call'}</span>
                  </a>
                </div>

              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
