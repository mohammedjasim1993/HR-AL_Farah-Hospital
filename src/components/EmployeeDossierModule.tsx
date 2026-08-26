import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createZipBlob } from '../utils/zipUtils';
import {
  FolderOpen,
  Search,
  Plus,
  Printer,
  FileText,
  UserCheck,
  Building2,
  GraduationCap,
  Award,
  AlertTriangle,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Briefcase,
  Layers,
  ShieldAlert,
  Clock,
  ChevronLeft,
  X,
  Edit2,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  DollarSign,
  BookOpen,
  User,
  Filter,
  ArrowUpDown,
  FileSpreadsheet,
  Upload,
  Download,
  Eye,
  FileCheck,
  Image as ImageIcon,
  File,
  ZoomIn,
  HardDrive,
  RefreshCw,
  FolderArchive,
  FilePlus,
  RotateCw,
  Check,
  AlertCircle
} from 'lucide-react';
import {
  Employee,
  Department,
  TrainingCourseItem,
  PenaltyItem,
  AppreciationItem,
  LeaveBalanceInfo,
  UserRole,
  EmployeeAttachmentFile
} from '../types';
import { getNextEmployeeCode } from '../lib/translations';
import JobTitleSelect from './JobTitleSelect';

interface EmployeeDossierModuleProps {
  departments: Department[];
  employees: Employee[];
  userRole: UserRole;
  onSaveEmployees: (updated: Employee[]) => void;
  language?: 'ar' | 'en';
  onAddLog?: (actionType: any, title: string, targetName: string, details: string) => void;
}

export default function EmployeeDossierModule({
  departments,
  employees,
  userRole,
  onSaveEmployees,
  language = 'ar',
  onAddLog
}: EmployeeDossierModuleProps) {
  const isAr = language === 'ar';

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [contractTypeFilter, setContractTypeFilter] = useState<string>('all');
  const [qualificationFilter, setQualificationFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Selected Employee for Detail Dossier Modal
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeDossierTab, setActiveDossierTab] = useState<'personal' | 'job' | 'financial' | 'academic' | 'documents'>(
    'personal'
  );

  // Edit Mode state within Modal
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Employee>>({});

  // Document Preview Modal
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string; isPdf: boolean } | null>(null);

  // Real Server Folder & Document Repository State
  const [folderInfo, setFolderInfo] = useState<{
    folderName: string;
    folderPath: string;
    totalFiles: number;
    totalSizeFormatted: string;
    files: EmployeeAttachmentFile[];
  } | null>(null);
  const [isFolderLoading, setIsFolderLoading] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [uploadNotification, setUploadNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Additional custom document modal state
  const [isCustomDocModalOpen, setIsCustomDocModalOpen] = useState(false);
  const [customDocCategory, setCustomDocCategory] = useState<string>('degree');
  const [customDocTitle, setCustomDocTitle] = useState<string>('');
  const [customDocFile, setCustomDocFile] = useState<File | null>(null);
  const [isUploadingCustom, setIsUploadingCustom] = useState(false);

  // Printable Single Dossier Modal state
  const [printEmployee, setPrintEmployee] = useState<Employee | null>(null);

  // Quick New Dossier Form Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmpForm, setNewEmpForm] = useState<Partial<Employee>>({
    name: '',
    fullNameOfficial: '',
    employeeCode: '',
    departmentId: departments[0]?.id || '',
    position: 'موظف',
    gender: 'male',
    basicSalary: 500000,
    contractType: 'ملاك دائم',
    qualification: 'بكالوريوس',
    workingDays: 30,
    workingHours: 8,
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
    previousMonthOver: 0,
  });

  // Calculate High-level Personnel Stats
  const stats = useMemo(() => {
    const total = employees.length;
    const permanent = employees.filter(e => (e.contractType || 'ملاك دائم').includes('ملاك')).length;
    const contract = employees.filter(e => (e.contractType || '').includes('عقد')).length;
    const daily = employees.filter(e => (e.contractType || '').includes('أجر')).length;
    const higherDegrees = employees.filter(e =>
      ['ماجستير', 'دكتوراه', 'بورد', 'دبلوم عالي'].some(q => (e.qualification || '').includes(q))
    ).length;

    return { total, permanent, contract, daily, higherDegrees };
  }, [employees]);

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        emp.name.toLowerCase().includes(q) ||
        (emp.fullNameOfficial || '').toLowerCase().includes(q) ||
        (emp.employeeCode || '').toLowerCase().includes(q) ||
        (emp.nationalId || '').toLowerCase().includes(q) ||
        (emp.phone || '').toLowerCase().includes(q) ||
        (emp.position || '').toLowerCase().includes(q);

      const matchDept = selectedDeptId === 'all' || emp.departmentId === selectedDeptId;
      const matchContract = contractTypeFilter === 'all' || (emp.contractType || 'ملاك دائم') === contractTypeFilter;
      const matchQual = qualificationFilter === 'all' || (emp.qualification || 'غير محدد') === qualificationFilter;

      return matchSearch && matchDept && matchContract && matchQual;
    });
  }, [employees, searchQuery, selectedDeptId, contractTypeFilter, qualificationFilter]);

  // Fetch Employee Folder and Document files directly from server disk & database
  const fetchEmployeeDocuments = async (empId: string) => {
    setIsFolderLoading(true);
    try {
      const res = await fetch(`/api/employees/${empId}/documents`);
      const json = await res.json();
      if (json.success) {
        setFolderInfo({
          folderName: json.folderName,
          folderPath: json.folderPath,
          totalFiles: json.totalFiles,
          totalSizeFormatted: json.totalSizeFormatted,
          files: json.files || []
        });
      }
    } catch (err) {
      console.error('Failed to fetch employee folder documents:', err);
    } finally {
      setIsFolderLoading(false);
    }
  };

  // Handle Opening Employee Dossier
  const handleOpenDossier = (emp: Employee) => {
    setSelectedEmployee(emp);
    setEditFormData({ ...emp });
    setIsEditing(false);
    setActiveDossierTab('personal');
    setUploadNotification(null);
    fetchEmployeeDocuments(emp.id);
  };

  // Save changes to current employee dossier
  const handleSaveDossierChanges = () => {
    if (!selectedEmployee) return;

    const updatedList = employees.map(e => {
      if (e.id === selectedEmployee.id) {
        return {
          ...e,
          ...editFormData,
          name: editFormData.name || e.name,
          fullNameOfficial: editFormData.fullNameOfficial || editFormData.name || e.fullNameOfficial,
        };
      }
      return e;
    });

    onSaveEmployees(updatedList);
    const updatedEmp = updatedList.find(e => e.id === selectedEmployee.id);
    if (updatedEmp) setSelectedEmployee(updatedEmp);

    setIsEditing(false);
    if (onAddLog) {
      onAddLog(
        'EMPLOYEE_EDIT',
        'تحديث إضبارة موظف',
        selectedEmployee.name,
        `تم تحديث بيانات الإضبارة الشاملة للموظف (كود: ${selectedEmployee.employeeCode || 'غير محدد'})`
      );
    }
  };

  // Add Course to selected employee
  const handleAddCourse = (course: TrainingCourseItem) => {
    if (!editFormData) return;
    const currentCourses = editFormData.trainingCourses || [];
    const updatedCourses = [...currentCourses, course];
    setEditFormData({ ...editFormData, trainingCourses: updatedCourses });
  };

  // Remove Course
  const handleRemoveCourse = (courseId: string) => {
    if (!editFormData) return;
    const updatedCourses = (editFormData.trainingCourses || []).filter(c => c.id !== courseId);
    setEditFormData({ ...editFormData, trainingCourses: updatedCourses });
  };

  // Handle Document Upload (To Employee Dedicated Folder on Server & Linked to Database)
  const handleDocUpload = (
    category: 'nationalIdFront' | 'nationalIdBack' | 'residencyCard' | 'employmentContract' | string,
    file: File,
    customDisplayName?: string
  ) => {
    if (!selectedEmployee) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      
      // Update instant local state preview
      setEditFormData(prev => {
        const next = { ...prev };
        if (category === 'nationalIdFront') next.nationalIdFrontDoc = base64;
        if (category === 'nationalIdBack') next.nationalIdBackDoc = base64;
        if (category === 'residencyCard') next.residencyCardDoc = base64;
        if (category === 'employmentContract') next.employmentContractDoc = base64;
        return next;
      });

      try {
        const res = await fetch(`/api/employees/${selectedEmployee.id}/documents/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            displayName: customDisplayName || file.name,
            category,
            fileData: base64,
            employeeName: selectedEmployee.name
          })
        });

        const json = await res.json();
        if (json.success && json.employee) {
          const updatedList = employees.map(emp => emp.id === json.employee.id ? json.employee : emp);
          onSaveEmployees(updatedList);
          setSelectedEmployee(json.employee);
          setEditFormData(json.employee);
          fetchEmployeeDocuments(selectedEmployee.id);

          setUploadNotification({
            type: 'success',
            message: `✅ تم حفظ المستمسك في مجلد الإضبارة [${json.folderName}] ومزامنته بقاعدة البيانات بنجاح`
          });
          setTimeout(() => setUploadNotification(null), 5000);

          if (onAddLog) {
            onAddLog(
              'EMPLOYEE_EDIT',
              'رفع مستمسك رسمي إلى مجلد الإضبارة',
              selectedEmployee.name,
              `تم رفع ملف (${file.name}) إلى مجلد المستمسكات للموظف`
            );
          }
        } else {
          throw new Error(json.error || 'فشل رفع الملف');
        }
      } catch (err: any) {
        console.error('Doc upload error:', err);
        setUploadNotification({
          type: 'error',
          message: err.message || 'حدث خطأ أثناء حفظ الملف في المجلد'
        });
        setTimeout(() => setUploadNotification(null), 5000);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Document Removal from Server Folder & Database
  const handleRemoveDoc = async (
    category: 'nationalIdFront' | 'nationalIdBack' | 'residencyCard' | 'employmentContract' | string,
    fileId?: string,
    fileName?: string
  ) => {
    if (!selectedEmployee) return;

    try {
      const res = await fetch(`/api/employees/${selectedEmployee.id}/documents`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId,
          fileName,
          category
        })
      });

      const json = await res.json();
      if (json.success && json.employee) {
        const updatedList = employees.map(emp => emp.id === json.employee.id ? json.employee : emp);
        onSaveEmployees(updatedList);
        setSelectedEmployee(json.employee);
        setEditFormData(json.employee);
        fetchEmployeeDocuments(selectedEmployee.id);

        setUploadNotification({
          type: 'info',
          message: 'تم حذف المستمسك من مجلد الموظف وتحديث قاعدة البيانات'
        });
        setTimeout(() => setUploadNotification(null), 4000);
      }
    } catch (err: any) {
      console.error('Doc delete error:', err);
    }
  };

  // Upload Custom Additional Document to Folder
  const handleUploadCustomDoc = async () => {
    if (!customDocFile || !selectedEmployee) return;
    setIsUploadingCustom(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const res = await fetch(`/api/employees/${selectedEmployee.id}/documents/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: customDocFile.name,
            displayName: customDocTitle || customDocFile.name,
            category: customDocCategory,
            fileData: base64,
            employeeName: selectedEmployee.name
          })
        });

        const json = await res.json();
        if (json.success && json.employee) {
          const updatedList = employees.map(emp => emp.id === json.employee.id ? json.employee : emp);
          onSaveEmployees(updatedList);
          setSelectedEmployee(json.employee);
          setEditFormData(json.employee);
          fetchEmployeeDocuments(selectedEmployee.id);

          setUploadNotification({
            type: 'success',
            message: `✅ تم إضافة الوثيقة إلى مجلد [${json.folderName}] بنجاح`
          });
          setTimeout(() => setUploadNotification(null), 5000);

          setIsCustomDocModalOpen(false);
          setCustomDocTitle('');
          setCustomDocFile(null);
        } else {
          throw new Error(json.error || 'فشل رفع الوثيقة');
        }
      };
      reader.readAsDataURL(customDocFile);
    } catch (err: any) {
      console.error('Upload custom doc error:', err);
      alert(err.message || 'حدث خطأ أثناء الرفع');
    } finally {
      setIsUploadingCustom(false);
    }
  };

  // Download All Employee Folder Files as a single ZIP archive
  const handleDownloadAllAsZip = async () => {
    if (!selectedEmployee) return;
    const allFiles = folderInfo?.files || [];
    if (allFiles.length === 0) {
      alert('لا توجد ملفات مرفوعة في مجلد هذا الموظف لتحميلها.');
      return;
    }

    setIsDownloadingZip(true);
    try {
      const folderName = folderInfo?.folderName || `EMP_${selectedEmployee.id}_${selectedEmployee.name}`;
      const zipFiles: { name: string; data: Uint8Array }[] = [];

      for (const file of allFiles) {
        try {
          const response = await fetch(file.url);
          const arrayBuffer = await response.arrayBuffer();
          zipFiles.push({
            name: `${folderName}/${file.name}`,
            data: new Uint8Array(arrayBuffer)
          });
        } catch (e) {
          console.error(`Failed to pack file ${file.name}:`, e);
        }
      }

      if (zipFiles.length === 0) {
        throw new Error('لم يتم العثور على ملفات صالحة للتحميل');
      }

      const zipBlob = createZipBlob(zipFiles);
      const downloadUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const safeEmpName = selectedEmployee.name.replace(/\s+/g, '_');
      a.download = `مستمسكات_إضبارة_${safeEmpName}_${selectedEmployee.employeeCode || selectedEmployee.id}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error('Zip generation error:', err);
      alert('حدث خطأ أثناء تجميع ملفات المجلد: ' + (err?.message || ''));
    } finally {
      setIsDownloadingZip(false);
    }
  };

  // Handle Open Add New Dossier Modal with Auto-Incremented Code
  const handleOpenAddModal = () => {
    const nextCode = getNextEmployeeCode(employees);
    setNewEmpForm({
      name: '',
      fullNameOfficial: '',
      employeeCode: nextCode,
      departmentId: departments[0]?.id || '',
      position: 'موظف',
      gender: 'male',
      basicSalary: 500000,
      contractType: 'ملاك دائم',
      qualification: 'بكالوريوس',
      workingDays: 30,
      workingHours: 8,
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
      previousMonthOver: 0,
    });
    setIsAddModalOpen(true);
  };

  // Handle Add New Employee Dossier
  const handleCreateNewDossier = () => {
    if (!newEmpForm.name || !newEmpForm.departmentId) return;

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      name: newEmpForm.name,
      fullNameOfficial: newEmpForm.fullNameOfficial || newEmpForm.name,
      employeeCode: newEmpForm.employeeCode || getNextEmployeeCode(employees),
      departmentId: newEmpForm.departmentId,
      position: newEmpForm.position || 'موظف',
      gender: newEmpForm.gender || 'male',
      basicSalary: Number(newEmpForm.basicSalary) || 500000,
      currency: 'IQD',
      workingDays: 30,
      workingHours: 8,
      shiftMorning: 0,
      shiftEvening: 0,
      shiftMiddle: 0,
      shiftFull24: 0,
      shiftHalf12: 0,
      shiftKhafar: 0,
      callouts: 0,
      allowanceDanger: Number(newEmpForm.allowanceDanger) || 0,
      allowanceMarriage: Number(newEmpForm.allowanceMarriage) || 0,
      allowanceChildren: Number(newEmpForm.allowanceChildren) || 0,
      allowanceDegree: Number(newEmpForm.allowanceDegree) || 0,
      allowanceExtraDays: 0,
      allowanceExtraHours: 0,
      allowanceGeneral: 0,
      allowanceEsnad: 0,
      deductionDays: 0,
      deductionHours: 0,
      deductionPenalties: 0,
      deductionOther: 0,
      previousMonthOver: 0,

      // Dossier fields
      dob: newEmpForm.dob || '1990-01-01',
      pob: newEmpForm.pob || 'بغداد',
      nationality: newEmpForm.nationality || 'عراقي',
      nationalId: newEmpForm.nationalId || '',
      phone: newEmpForm.phone || '',
      email: newEmpForm.email || '',
      address: newEmpForm.address || '',
      hireDate: newEmpForm.hireDate || new Date().toISOString().split('T')[0],
      jobTitle: newEmpForm.jobTitle || newEmpForm.position || 'موظف',
      jobGrade: newEmpForm.jobGrade || 'الدرجة الرابعة',
      jobStage: newEmpForm.jobStage || 'المرحلة الأولى',
      contractType: newEmpForm.contractType || 'ملاك دائم',
      bankName: newEmpForm.bankName || 'مصرف الرافدين',
      bankIban: newEmpForm.bankIban || '',
      qualification: newEmpForm.qualification || 'بكالوريوس',
      graduationYear: newEmpForm.graduationYear || '2015',
      universityCollege: newEmpForm.universityCollege || 'جامعة بغداد',
      trainingCourses: [],
      penaltiesList: [],
      appreciationLettersList: [],
      leaveBalance: { sickDays: 0, annualDays: 0, remainingDays: 30, totalAccruedDays: 30 }
    };

    onSaveEmployees([...employees, newEmp]);
    setIsAddModalOpen(false);
    if (onAddLog) {
      onAddLog('EMPLOYEE_EDIT', 'إضافة إضبارة موظف جديد', newEmp.name, `تم فتح إضبارة موظف جديد بالرقم الوظيفي ${newEmp.employeeCode}`);
    }
  };

  return (
    <div className="space-y-6 select-none font-sans" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-5 lg:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white shadow-lg shadow-blue-500/30">
              <FolderOpen className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl lg:text-2xl font-black text-white tracking-wide">
                  إضابير الموظفين والسجل الإداري الشامل
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Personnel Dossiers
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 font-medium">
                السجل الموحد للبيانات الشخصية، الوظيفية، المالية، الخبرات العلمية، والعقوبات والإجازات
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة إضبارة موظف جديد</span>
            </button>
          </div>
        </div>

        {/* Personnel Statistics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="bg-slate-950/40 border border-white/10 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-bold">إجمالي الإضابير</p>
              <p className="text-base font-black text-white">{stats.total} موظفاً</p>
            </div>
          </div>

          <div className="bg-slate-950/40 border border-white/10 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-bold">الملاك الدائم</p>
              <p className="text-base font-black text-emerald-400">{stats.permanent} ملاك</p>
            </div>
          </div>

          <div className="bg-slate-950/40 border border-white/10 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-bold">العقود الوزارية</p>
              <p className="text-base font-black text-amber-400">{stats.contract} عقد</p>
            </div>
          </div>

          <div className="bg-slate-950/40 border border-white/10 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-bold">الأجر اليومي</p>
              <p className="text-base font-black text-purple-400">{stats.daily} كادر</p>
            </div>
          </div>

          <div className="bg-slate-950/40 border border-white/10 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-bold">حملة الشهادات العليا</p>
              <p className="text-base font-black text-cyan-400">{stats.higherDegrees} كادر</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and View Tools Control Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="بحث باسم الموظف، الرقم الوظيفي، الهوية، أو الهاتف..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Department Filter */}
          <select
            value={selectedDeptId}
            onChange={e => setSelectedDeptId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">جميع الأقسام والشُعب</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Contract Type Filter */}
          <select
            value={contractTypeFilter}
            onChange={e => setContractTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">جميع أنواع التعاقد</option>
            <option value="ملاك دائم">ملاك دائم</option>
            <option value="عقد وزاري">عقد وزاري</option>
            <option value="أجر يومي">أجر يومي</option>
          </select>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 border border-slate-800 rounded-xl shrink-0">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'cards' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>بطاقات الإضابير</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'table' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>جدول السجل الشامل</span>
          </button>
        </div>
      </div>

      {/* Main Content Area: Cards or Table */}
      {filteredEmployees.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-500">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-300">لا توجد إضابير موظفين تطابق البحث</h3>
          <p className="text-xs text-slate-500">جرب تغيير كلمات البحث أو إعادة ضبط الفلاتر المحددة</p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEmployees.map(emp => {
            const dept = departments.find(d => d.id === emp.departmentId);
            const coursesCount = emp.trainingCourses?.length || 0;
            const docsCount = [
              emp.nationalIdFrontDoc,
              emp.nationalIdBackDoc,
              emp.residencyCardDoc,
              emp.employmentContractDoc
            ].filter(Boolean).length;

            return (
              <div
                key={emp.id}
                onClick={() => handleOpenDossier(emp)}
                className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 space-y-3 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer group relative overflow-hidden"
              >
                {/* Top Badge */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-sm shadow-md">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                        {emp.fullNameOfficial || emp.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono font-bold">{emp.employeeCode || 'بدون رقم وظيفي'}</p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800 text-blue-300 border border-slate-700">
                    {emp.contractType || 'ملاك دائم'}
                  </span>
                </div>

                {/* Job & Department Info */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500 text-[11px]">القسم الإداري:</span>
                    <span className="font-bold text-blue-300">{dept?.name || 'غير محدد'}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500 text-[11px]">العنوان الوظيفي:</span>
                    <span className="font-medium text-slate-200">{emp.jobTitle || emp.position}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500 text-[11px]">التحصيل الدراسي:</span>
                    <span className="font-medium text-emerald-400">{emp.qualification || 'بكالوريوس'}</span>
                  </div>
                </div>

                {/* Dossier Indicator Badges */}
                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800/80 text-[10.5px]">
                  <div className="bg-slate-950 p-1.5 rounded-lg text-center border border-slate-800">
                    <span className="block text-slate-500 text-[9px]">الدورات التدريبية</span>
                    <span className="font-bold text-cyan-400">{coursesCount} دورة</span>
                  </div>

                  <div className="bg-slate-950 p-1.5 rounded-lg text-center border border-slate-800">
                    <span className="block text-slate-500 text-[9px]">المستمسكات الرسمية</span>
                    <span className={`font-bold ${
                      [emp.nationalIdFrontDoc, emp.nationalIdBackDoc, emp.residencyCardDoc, emp.employmentContractDoc].filter(Boolean).length === 4
                        ? 'text-emerald-400'
                        : [emp.nationalIdFrontDoc, emp.nationalIdBackDoc, emp.residencyCardDoc, emp.employmentContractDoc].filter(Boolean).length > 0
                        ? 'text-amber-400'
                        : 'text-slate-400'
                    }`}>
                      {[emp.nationalIdFrontDoc, emp.nationalIdBackDoc, emp.residencyCardDoc, emp.employmentContractDoc].filter(Boolean).length}/4 مرفوعة
                    </span>
                  </div>

                  <div className="bg-slate-950 p-1.5 rounded-lg text-center border border-slate-800">
                    <span className="block text-slate-500 text-[9px]">الحساب المصرفي</span>
                    <span className={`font-bold ${emp.bankIban ? 'text-blue-400' : 'text-slate-400'}`}>
                      {emp.bankIban ? 'محدد' : 'غير مسجل'}
                    </span>
                  </div>
                </div>

                {/* Bottom Action Hint */}
                <div className="pt-2 flex justify-between items-center text-[11px] text-blue-400 font-bold group-hover:translate-x-1 transition-transform">
                  <span>فتح وتعديل الإضبارة الشاملة</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="p-3">الرقم الوظيفي</th>
                  <th className="p-3">اسم الموظف الكامل</th>
                  <th className="p-3">القسم / التشكيل</th>
                  <th className="p-3">العنوان الوظيفي</th>
                  <th className="p-3">نوع التعاقد</th>
                  <th className="p-3">التحصيل الدراسي</th>
                  <th className="p-3">الهاتف</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredEmployees.map(emp => {
                  const dept = departments.find(d => d.id === emp.departmentId);
                  return (
                    <tr key={emp.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-blue-400">{emp.employeeCode || '---'}</td>
                      <td className="p-3 font-bold text-white">{emp.fullNameOfficial || emp.name}</td>
                      <td className="p-3">{dept?.name || '---'}</td>
                      <td className="p-3">{emp.jobTitle || emp.position}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-blue-300 font-medium">
                          {emp.contractType || 'ملاك دائم'}
                        </span>
                      </td>
                      <td className="p-3 text-emerald-400">{emp.qualification || '---'}</td>
                      <td className="p-3 font-mono dir-ltr text-right">{emp.phone || '---'}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleOpenDossier(emp)}
                          className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg transition-all text-xs font-bold"
                        >
                          عرض الإضبارة
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Comprehensive Full Dossier Inspector / Modal */}
      {selectedEmployee && editFormData && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 lg:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 lg:p-5 border-b border-slate-800 flex justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 rounded-xl text-white font-black text-lg">
                  {selectedEmployee.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-base lg:text-lg font-black text-white flex items-center gap-2">
                    <span>إضبارة الموظف: {editFormData.fullNameOfficial || selectedEmployee.name}</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      كود: {editFormData.employeeCode || 'غير محدد'}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    {departments.find(d => d.id === editFormData.departmentId)?.name || 'القسم الإداري'} |{' '}
                    {editFormData.jobTitle || editFormData.position}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPrintEmployee(selectedEmployee)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-400" />
                  <span>طباعة الإضبارة الرسمية</span>
                </button>

                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>تعديل الإضبارة</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSaveDossierChanges}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>حفظ التغييرات</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setSelectedEmployee(null);
                    setIsEditing(false);
                  }}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Dossier Tabs Navigation (5 Main Sections matching user request) */}
            <div className="bg-slate-950 border-b border-slate-800 px-4 flex gap-1 overflow-x-auto text-xs font-bold no-scrollbar">
              <button
                onClick={() => setActiveDossierTab('personal')}
                className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeDossierTab === 'personal'
                    ? 'border-blue-500 text-blue-400 font-black'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                <span>1. البيانات الشخصية والتعريفية</span>
              </button>

              <button
                onClick={() => setActiveDossierTab('job')}
                className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeDossierTab === 'job'
                    ? 'border-blue-500 text-blue-400 font-black'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>2. البيانات الوظيفية والإدارية</span>
              </button>

              <button
                onClick={() => setActiveDossierTab('financial')}
                className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeDossierTab === 'financial'
                    ? 'border-blue-500 text-blue-400 font-black'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>3. البيانات المالية والرواتب</span>
              </button>

              <button
                onClick={() => setActiveDossierTab('academic')}
                className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeDossierTab === 'academic'
                    ? 'border-blue-500 text-blue-400 font-black'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>4. السجل العلمي والخبرات</span>
              </button>

              <button
                onClick={() => setActiveDossierTab('documents')}
                className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeDossierTab === 'documents'
                    ? 'border-blue-500 text-blue-400 font-black'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>5. المستمسكات وعقود التشغيل</span>
              </button>
            </div>

            {/* Tab Content Body */}
            <div className="p-5 lg:p-6 overflow-y-auto flex-1 space-y-5">
              {/* TAB 1: البيانات الشخصية والتعريفية */}
              {activeDossierTab === 'personal' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-blue-400 pb-2 border-b border-slate-800 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>المعلومات الشخصية والمستمسكات الرسمية</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1 font-bold">
                        الاسم الكامل (حسب المستمسكات الرسمية)
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.fullNameOfficial || ''}
                          onChange={e => setEditFormData({ ...editFormData, fullNameOfficial: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                        />
                      ) : (
                        <p className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-bold text-white">
                          {editFormData.fullNameOfficial || selectedEmployee.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-bold">الرقم الوظيفي (ID)</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.employeeCode || ''}
                          onChange={e => setEditFormData({ ...editFormData, employeeCode: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                        />
                      ) : (
                        <p className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono font-bold text-blue-300">
                          {editFormData.employeeCode || 'غير محدد'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-bold">تاريخ الولادة</label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editFormData.dob || ''}
                          onChange={e => setEditFormData({ ...editFormData, dob: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                        />
                      ) : (
                        <p className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-slate-200">
                          {editFormData.dob || '1990-01-01'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-bold">محل الولادة</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.pob || ''}
                          onChange={e => setEditFormData({ ...editFormData, pob: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                        />
                      ) : (
                        <p className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-slate-200">
                          {editFormData.pob || 'بغداد'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-bold">الجنسية والرقم الوطني / القومي</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.nationalId || ''}
                          onChange={e => setEditFormData({ ...editFormData, nationalId: e.target.value })}
                          placeholder="مثال: 199283748291"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                        />
                      ) : (
                        <p className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-slate-200 font-mono">
                          {editFormData.nationalId || 'عراقي / 199384729182'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-bold">الجنس</label>
                      {isEditing ? (
                        <select
                          value={editFormData.gender || 'male'}
                          onChange={e => setEditFormData({ ...editFormData, gender: e.target.value as any })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                        >
                          <option value="male">ذكر</option>
                          <option value="female">أنثى</option>
                        </select>
                      ) : (
                        <p className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-slate-200">
                          {editFormData.gender === 'female' ? 'أنثى' : 'ذكر'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-bold">رقم الهاتف</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.phone || ''}
                          onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                        />
                      ) : (
                        <p className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-slate-200 font-mono">
                          {editFormData.phone || '07700000000'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-bold">البريد الإلكتروني</label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={editFormData.email || ''}
                          onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                        />
                      ) : (
                        <p className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-slate-200 font-mono">
                          {editFormData.email || 'employee@hospital.iq'}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2 lg:col-span-3">
                      <label className="block text-slate-400 mb-1 font-bold">العنوان السكني الحالي</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.address || ''}
                          onChange={e => setEditFormData({ ...editFormData, address: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                        />
                      ) : (
                        <p className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-slate-200">
                          {editFormData.address || 'بغداد - الرصافة - حي الجامعة'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: البيانات الوظيفية والإدارية */}
              {activeDossierTab === 'job' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-blue-400 pb-2 border-b border-slate-800 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    <span>البيانات الوظيفية وموقع الخدمة</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1 font-bold">القسم أو التشكيل الإداري</label>
                      {isEditing ? (
                        <select
                          value={editFormData.departmentId}
                          onChange={e => setEditFormData({ ...editFormData, departmentId: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                        >
                          {departments.map(d => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-bold text-blue-300">
                          {departments.find(d => d.id === editFormData.departmentId)?.name || 'غير محدد'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-bold">العنوان الوظيفي / المسمى</label>
                      {isEditing ? (
                        <JobTitleSelect
                          value={editFormData.jobTitle || editFormData.position || ''}
                          onChange={val =>
                            setEditFormData({ ...editFormData, jobTitle: val, position: val })
                          }
                        />
                      ) : (
                        <p className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-bold text-white">
                          {editFormData.jobTitle || editFormData.position}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-bold">نوع التعاقد</label>
                      {isEditing ? (
                        <select
                          value={editFormData.contractType || 'ملاك دائم'}
                          onChange={e => setEditFormData({ ...editFormData, contractType: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                        >
                          <option value="ملاك دائم">ملاك دائم</option>
                          <option value="عقد وزاري">عقد وزاري</option>
                          <option value="أجر يومي">أجر يومي</option>
                        </select>
                      ) : (
                        <p className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-bold text-emerald-400">
                          {editFormData.contractType || 'ملاك دائم'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-bold">تاريخ التعيين والمباشرة</label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editFormData.hireDate || ''}
                          onChange={e => setEditFormData({ ...editFormData, hireDate: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                        />
                      ) : (
                        <p className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-slate-200 font-mono">
                          {editFormData.hireDate || '2018-03-15'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: البيانات المالية والرواتب */}
              {activeDossierTab === 'financial' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-blue-400 pb-2 border-b border-slate-800 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span>البيانات المالية والحساب المصرفي للرواتب</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1 font-bold">اسم المصرف المحول له</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.bankName || ''}
                          onChange={e => setEditFormData({ ...editFormData, bankName: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                        />
                      ) : (
                        <p className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-bold text-white">
                          {editFormData.bankName || 'مصرف الرافدين'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-bold">رقم الحساب المصرفي (IBAN)</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.bankIban || ''}
                          onChange={e => setEditFormData({ ...editFormData, bankIban: e.target.value })}
                          placeholder="IQ00RAF0001000293848201"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                        />
                      ) : (
                        <p className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-blue-300 font-bold">
                          {editFormData.bankIban || 'IQ98RAF10020039482710492'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: السجل العلمي والخبرات */}
              {activeDossierTab === 'academic' && (
                <div className="space-y-5">
                  <h3 className="text-sm font-black text-blue-400 pb-2 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      <span>التحصيل الدراسي والدورات التدريبية</span>
                    </div>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1 font-bold">الشهادة / التحصيل الدراسي</label>
                      {isEditing ? (
                        <select
                          value={editFormData.qualification || 'بكالوريوس'}
                          onChange={e => setEditFormData({ ...editFormData, qualification: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                        >
                          <option value="دبلوم">دبلوم فني</option>
                          <option value="بكالوريوس">بكالوريوس</option>
                          <option value="دبلوم عالي">دبلوم عالي</option>
                          <option value="ماجستير">ماجستير</option>
                          <option value="دكتوراه">دكتوراه</option>
                          <option value="بورد">بورد طبي</option>
                        </select>
                      ) : (
                        <p className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-bold text-emerald-400">
                          {editFormData.qualification || 'بكالوريوس'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-bold">تاريخ التخرج</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.graduationYear || ''}
                          onChange={e => setEditFormData({ ...editFormData, graduationYear: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                        />
                      ) : (
                        <p className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-slate-200 font-mono">
                          {editFormData.graduationYear || '2016'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-bold">الجامعة / الكلية</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.universityCollege || ''}
                          onChange={e => setEditFormData({ ...editFormData, universityCollege: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                        />
                      ) : (
                        <p className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-slate-200">
                          {editFormData.universityCollege || 'جامعة بغداد - كلية العلوم / التقنيات'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Training Courses List */}
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-cyan-400" />
                        <span>سجل الدورات التدريبية المكتسبة</span>
                      </h4>

                      {isEditing && (
                        <button
                          onClick={() => {
                            const courseTitle = prompt('اسم الدورة التدريبية:');
                            if (!courseTitle) return;
                            const issuer = prompt('جهة الإصدار / المركز التدريبي:') || 'مركز التطوير الوزاري';
                            handleAddCourse({
                              id: `course-${Date.now()}`,
                              title: courseTitle,
                              date: new Date().toISOString().split('T')[0],
                              issuer,
                              durationHours: 30
                            });
                          }}
                          className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إضافة دورة تدريبية</span>
                        </button>
                      )}
                    </div>

                    {(editFormData.trainingCourses || []).length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                        لا توجد دورات تدريبية مسجلة حالياً
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {(editFormData.trainingCourses || []).map((c, idx) => (
                          <div
                            key={c.id || idx}
                            className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs"
                          >
                            <div>
                              <p className="font-bold text-white">{c.title}</p>
                              <p className="text-[11px] text-slate-400">
                                {c.issuer} | التاريخ: {c.date}
                              </p>
                            </div>
                            {isEditing && (
                              <button
                                onClick={() => handleRemoveCourse(c.id)}
                                className="text-rose-400 hover:text-rose-300 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: المستمسكات الرسمية وعقود التشغيل وفولدر الإضبارة */}
              {activeDossierTab === 'documents' && (
                <div className="space-y-6">
                  {/* Real-time Notification Banner */}
                  {uploadNotification && (
                    <div
                      className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                        uploadNotification.type === 'success'
                          ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                          : uploadNotification.type === 'error'
                          ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                          : 'bg-blue-950/80 border-blue-500/50 text-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {uploadNotification.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : uploadNotification.type === 'error' ? (
                          <AlertCircle className="w-4 h-4 text-rose-400" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-blue-400" />
                        )}
                        <span>{uploadNotification.message}</span>
                      </div>
                      <button
                        onClick={() => setUploadNotification(null)}
                        className="text-slate-400 hover:text-white p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* 📁 Folder & Database Connection Status Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-blue-900/40 shadow-xl space-y-3">
                    <div className="flex flex-wrap justify-between items-center gap-3 pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
                          <FolderOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-white flex items-center gap-2">
                            <span>فولدر مستمسكات الموظف (Server Folder & Database Repository)</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              <span>مربوط بقاعدة البيانات</span>
                            </span>
                          </h3>
                          <p className="text-xs text-slate-400">
                            مجلد فرعي خاص ومعزول لكل موظف على السيرفر لتخزين واسترجاع المستمسكات والوثائق الثبوتية
                          </p>
                        </div>
                      </div>

                      {/* Folder Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => selectedEmployee && fetchEmployeeDocuments(selectedEmployee.id)}
                          disabled={isFolderLoading}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
                          title="إعادة فحص محتويات المجلد على السيرفر"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isFolderLoading ? 'animate-spin' : ''}`} />
                          <span>فحص وتحديث</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleDownloadAllAsZip}
                          disabled={isDownloadingZip || (folderInfo?.totalFiles || 0) === 0}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-colors"
                          title="تحميل كل مستمسكات الموظف في ملف مضغوط ZIP"
                        >
                          <FolderArchive className="w-3.5 h-3.5" />
                          <span>{isDownloadingZip ? 'جاري التجميع...' : 'تحميل حزمة المستمسكات (ZIP)'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsCustomDocModalOpen(true)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-colors"
                        >
                          <FilePlus className="w-3.5 h-3.5" />
                          <span>إضافة مستمسك للمجلد</span>
                        </button>
                      </div>
                    </div>

                    {/* Folder Path & Stats Pills */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-medium">اسم المجلد الفرعي:</span>
                        <p className="font-mono font-bold text-blue-300 truncate" dir="ltr">
                          {folderInfo?.folderName || `EMP_${selectedEmployee?.id}_${selectedEmployee?.name}`}
                        </p>
                      </div>

                      <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-medium">المسار على السيرفر:</span>
                        <p className="font-mono text-[11px] text-slate-300 truncate" dir="ltr">
                          {folderInfo?.folderPath || `uploads/documents/EMP_${selectedEmployee?.id}`}
                        </p>
                      </div>

                      <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-medium">إجمالي المستمسكات المحفوظة:</span>
                        <p className="font-bold text-emerald-400">
                          {folderInfo?.totalFiles || 0} ملف وثائقي
                        </p>
                      </div>

                      <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-medium">الحجم الكلي على القرص:</span>
                        <p className="font-mono font-bold text-amber-300">
                          {folderInfo?.totalSizeFormatted || '0 B'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 1. Primary Official Documents Section */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <h4 className="text-xs font-black text-slate-200 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-blue-400" />
                        <span>المستمسكات الثبوتية الرسمية الأساسية (الرئيسية)</span>
                      </h4>
                      <span className="text-[11px] font-bold text-slate-400">
                        مكتمل:{' '}
                        <span className="text-emerald-400 font-mono">
                          {[
                            editFormData.nationalIdFrontDoc,
                            editFormData.nationalIdBackDoc,
                            editFormData.residencyCardDoc,
                            editFormData.employmentContractDoc
                          ].filter(Boolean).length} / 4
                        </span>
                      </span>
                    </div>

                    {/* Document Category 1: National ID / Nationality Card (Front & Back) */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
                        <CreditCard className="w-4 h-4 text-blue-400" />
                        <span>1. البطاقة الوطنية الموحدة أو شهادة الجنسية (الوجهين)</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Front of National ID */}
                        <DocumentUploadCard
                          title="البطاقة الوطنية / الجنسية (الوجه الأمامي)"
                          docUrl={editFormData.nationalIdFrontDoc}
                          isEditing={true}
                          onUpload={(file) => handleDocUpload('nationalIdFront', file, 'البطاقة الوطنية - الوجه الأمامي')}
                          onRemove={() => handleRemoveDoc('nationalIdFront')}
                          onPreview={() =>
                            setPreviewDoc({
                              title: 'البطاقة الوطنية / الجنسية (الوجه الأمامي)',
                              url: editFormData.nationalIdFrontDoc!,
                              isPdf: (editFormData.nationalIdFrontDoc || '').toLowerCase().includes('.pdf') || (editFormData.nationalIdFrontDoc || '').startsWith('data:application/pdf')
                            })
                          }
                        />

                        {/* Back of National ID */}
                        <DocumentUploadCard
                          title="البطاقة الوطنية / الجنسية (الوجه الخلفي)"
                          docUrl={editFormData.nationalIdBackDoc}
                          isEditing={true}
                          onUpload={(file) => handleDocUpload('nationalIdBack', file, 'البطاقة الوطنية - الوجه الخلفي')}
                          onRemove={() => handleRemoveDoc('nationalIdBack')}
                          onPreview={() =>
                            setPreviewDoc({
                              title: 'البطاقة الوطنية / الجنسية (الوجه الخلفي)',
                              url: editFormData.nationalIdBackDoc!,
                              isPdf: (editFormData.nationalIdBackDoc || '').toLowerCase().includes('.pdf') || (editFormData.nationalIdBackDoc || '').startsWith('data:application/pdf')
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* Document Category 2: Residence Card */}
                    <div className="space-y-3 pt-4 border-t border-slate-800/80">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                        <MapPin className="w-4 h-4 text-emerald-400" />
                        <span>2. بطاقة السكن الرسمية</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DocumentUploadCard
                          title="بطاقة السكن الرسمية (واضحة ومعتمدة)"
                          docUrl={editFormData.residencyCardDoc}
                          isEditing={true}
                          onUpload={(file) => handleDocUpload('residencyCard', file, 'بطاقة السكن الرسمية')}
                          onRemove={() => handleRemoveDoc('residencyCard')}
                          onPreview={() =>
                            setPreviewDoc({
                              title: 'بطاقة السكن الرسمية',
                              url: editFormData.residencyCardDoc!,
                              isPdf: (editFormData.residencyCardDoc || '').toLowerCase().includes('.pdf') || (editFormData.residencyCardDoc || '').startsWith('data:application/pdf')
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* Document Category 3: Employment Contract */}
                    <div className="space-y-3 pt-4 border-t border-slate-800/80">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                        <FileCheck className="w-4 h-4 text-amber-400" />
                        <span>3. نسخة من عقد التشغيل والتعيين والأمر الإداري</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DocumentUploadCard
                          title="نسخة عقد التشغيل / الأمر الإداري للمباشرة"
                          docUrl={editFormData.employmentContractDoc}
                          isEditing={true}
                          onUpload={(file) => handleDocUpload('employmentContract', file, 'عقد التشغيل والتعيين')}
                          onRemove={() => handleRemoveDoc('employmentContract')}
                          onPreview={() =>
                            setPreviewDoc({
                              title: 'نسخة من عقد التشغيل والتعيين',
                              url: editFormData.employmentContractDoc!,
                              isPdf: (editFormData.employmentContractDoc || '').toLowerCase().includes('.pdf') || (editFormData.employmentContractDoc || '').startsWith('data:application/pdf')
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Additional Documents Repository in Employee's Folder */}
                  <div className="space-y-4 pt-6 border-t border-slate-800">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-black text-cyan-400 flex items-center gap-2">
                          <Layers className="w-4 h-4" />
                          <span>جميع الوثائق والملفات المرفوعة داخل مجلد هذا الموظف</span>
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          قائمة بالملفات الفعلية المقروءة مباشرة من المجلد على السيرفر
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsCustomDocModalOpen(true)}
                        className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-cyan-500/30 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>رفع وثيقة إضافية</span>
                      </button>
                    </div>

                    {(!folderInfo || folderInfo.files.length === 0) ? (
                      <div className="p-6 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 text-center space-y-2">
                        <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="text-xs text-slate-400 font-bold">لا توجد ملفات إضافية في مجلد الموظف حالياً</p>
                        <p className="text-[11px] text-slate-500">
                          يمكنك رفع الشهادات الأكاديمية، جواز السفر، الفحوصات الطبية، السيرة الذاتية أو أي كتب رسمية
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsCustomDocModalOpen(true)}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>رفع أول وثيقة للمجلد</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {folderInfo.files.map((file, idx) => {
                          const isPdf = file.isPdf || file.name.toLowerCase().endsWith('.pdf');
                          return (
                            <div
                              key={file.id || idx}
                              className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex flex-col justify-between gap-2.5 transition-all shadow-sm group"
                            >
                              <div className="flex items-start gap-2.5">
                                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-blue-400 flex-shrink-0">
                                  {isPdf ? (
                                    <File className="w-5 h-5 text-rose-400" />
                                  ) : (
                                    <ImageIcon className="w-5 h-5 text-blue-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-white truncate" title={file.displayName || file.name}>
                                    {file.displayName || file.name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                                    <span className="font-mono text-slate-300">{file.fileSizeFormatted || '—'}</span>
                                    <span>•</span>
                                    <span className="truncate">{file.category || 'مستند'}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewDoc({
                                      title: file.displayName || file.name,
                                      url: file.url,
                                      isPdf
                                    })
                                  }
                                  className="flex-1 py-1 px-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 border border-slate-800"
                                >
                                  <Eye className="w-3 h-3 text-blue-400" />
                                  <span>معاينة</span>
                                </button>

                                <a
                                  href={file.url}
                                  download={file.name}
                                  className="py-1 px-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 border border-slate-800"
                                  title="تنزيل الملف"
                                >
                                  <Download className="w-3 h-3 text-emerald-400" />
                                </a>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveDoc(file.category || 'other', file.id, file.name)}
                                  className="py-1 px-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 border border-rose-900/50"
                                  title="حذف من المجلد"
                                >
                                  <Trash2 className="w-3 h-3 text-rose-400" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal for Adding Custom/Additional Document into Employee Folder */}
      {isCustomDocModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <FilePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">رفع مستمسك أو وثيقة جديدة للمجلد</h3>
                  <p className="text-xs text-slate-400">سيتم حفظ الملف في مجلد الموظف وربطه بقاعدة البيانات</p>
                </div>
              </div>
              <button
                onClick={() => setIsCustomDocModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">نوع المستمسك / التصنيف</label>
                <select
                  value={customDocCategory}
                  onChange={e => setCustomDocCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                >
                  <option value="degree">شهادة تخرج / وثيقة دراسية وأكاديمية</option>
                  <option value="passport">جواز السفر العراقي</option>
                  <option value="medicalCheck">تقرير الفحص الطبي ومطابقة اللياقة</option>
                  <option value="cv">السيرة الذاتية (CV / Resume)</option>
                  <option value="administrativeOrder">أمر إداري / كتاب شكر وترقية</option>
                  <option value="penaltyLetter">عقوبة أو إنذار رسمي</option>
                  <option value="other">مستمسك أو وثيقة أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">عنوان أو وصف الوثيقة</label>
                <input
                  type="text"
                  value={customDocTitle}
                  onChange={e => setCustomDocTitle(e.target.value)}
                  placeholder="مثال: وثيقة تخرج بكالوريوس - جامعة بغداد"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">الملف (صورة أو PDF)</label>
                <div
                  onClick={() => document.getElementById('custom-doc-input')?.click()}
                  className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 hover:bg-slate-950 cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition-colors"
                >
                  <input
                    id="custom-doc-input"
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setCustomDocFile(e.target.files[0]);
                        if (!customDocTitle) {
                          setCustomDocTitle(e.target.files[0].name);
                        }
                      }
                    }}
                  />
                  {customDocFile ? (
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{customDocFile.name} ({(customDocFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-blue-400" />
                      <span className="text-slate-300 font-bold">انقر لاختيار الملف من جهازك</span>
                      <span className="text-[10px] text-slate-500">يدعم الصور JPG, PNG وملفات PDF</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCustomDocModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleUploadCustomDoc}
                disabled={!customDocFile || isUploadingCustom}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" />
                <span>{isUploadingCustom ? 'جاري الحفظ في المجلد...' : 'رفع وحفظ في المجلد'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Official Dossier View Modal */}
      {printEmployee && (
        <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-950 w-full max-w-4xl p-8 rounded-xl shadow-2xl space-y-6 font-sans">
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-slate-950 pb-4">
              <div className="text-right space-y-1">
                <h2 className="text-xl font-black">جمهورية العراق - وزارة الصحة</h2>
                <h3 className="text-base font-bold">دائرة صحة بغداد / إضبارة خدمة موظف</h3>
                <p className="text-xs text-slate-600 font-mono">
                  رقم الإضبارة: {printEmployee.employeeCode || 'HR-2026'}
                </p>
              </div>

              <div className="text-left">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold no-print"
                >
                  طباعة الآن
                </button>
                <button
                  onClick={() => setPrintEmployee(null)}
                  className="px-3 py-2 bg-slate-200 text-slate-800 rounded-lg text-xs font-bold mr-2 no-print"
                >
                  إغلاق
                </button>
              </div>
            </div>

            {/* Content Tables */}
            <div className="space-y-4 text-xs">
              <div className="border border-slate-300 p-3 rounded-lg bg-slate-50 space-y-2">
                <h4 className="font-bold text-sm border-b pb-1">1. البيانات الشخصية والتعريفية</h4>
                <div className="grid grid-cols-2 gap-2">
                  <p>
                    <span className="font-bold">الاسم الرسمي:</span>{' '}
                    {printEmployee.fullNameOfficial || printEmployee.name}
                  </p>
                  <p>
                    <span className="font-bold">الرقم الوظيفي:</span> {printEmployee.employeeCode || '---'}
                  </p>
                  <p>
                    <span className="font-bold">تاريخ ومحل الولادة:</span> {printEmployee.dob || '1990'} -{' '}
                    {printEmployee.pob || 'بغداد'}
                  </p>
                  <p>
                    <span className="font-bold">الهوية الوطنية:</span> {printEmployee.nationalId || '---'}
                  </p>
                </div>
              </div>

              <div className="border border-slate-300 p-3 rounded-lg bg-slate-50 space-y-2">
                <h4 className="font-bold text-sm border-b pb-1">2. البيانات الوظيفية والمالية</h4>
                <div className="grid grid-cols-2 gap-2">
                  <p>
                    <span className="font-bold">العنوان الوظيفي:</span> {printEmployee.jobTitle || printEmployee.position}
                  </p>
                  <p>
                    <span className="font-bold">نوع التعاقد:</span> {printEmployee.contractType || 'ملاك دائم'}
                  </p>
                  <p>
                    <span className="font-bold">الراتب الأساسي:</span> {printEmployee.basicSalary.toLocaleString()} د.ع
                  </p>
                  <p>
                    <span className="font-bold">الحساب المصرفي (IBAN):</span> {printEmployee.bankIban || '---'}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t flex justify-between text-center text-xs font-bold">
              <div>
                <p>توقيع مسؤول شؤون الموظفين</p>
                <div className="h-12" />
                <p>_____________________</p>
              </div>
              <div>
                <p>مصادقة مدير المستشفى</p>
                <div className="h-12" />
                <p>_____________________</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Dossier Form Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <span>إضافة إضبارة موظف جديد إلى السجل الموحد</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">الاسم الكامل حسب المستمسكات</label>
                <input
                  type="text"
                  value={newEmpForm.fullNameOfficial || ''}
                  onChange={e => setNewEmpForm({ ...newEmpForm, fullNameOfficial: e.target.value, name: e.target.value })}
                  placeholder="الاسم الثلاثي أو الرباعي"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-400 font-bold">الرقم الوظيفي (ID)</label>
                  <span className="text-[10px] text-emerald-400 font-medium">تلقائي (+1) مع إمكانية التعديل</span>
                </div>
                <input
                  type="text"
                  value={newEmpForm.employeeCode || ''}
                  onChange={e => setNewEmpForm({ ...newEmpForm, employeeCode: e.target.value })}
                  placeholder="EMP-1001"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">القسم أو التشكيل الإداري</label>
                <select
                  value={newEmpForm.departmentId}
                  onChange={e => setNewEmpForm({ ...newEmpForm, departmentId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">العنوان الوظيفي / المسمى</label>
                <JobTitleSelect
                  value={newEmpForm.jobTitle || ''}
                  onChange={val => setNewEmpForm({ ...newEmpForm, jobTitle: val, position: val })}
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">نوع التعاقد</label>
                <select
                  value={newEmpForm.contractType || 'ملاك دائم'}
                  onChange={e => setNewEmpForm({ ...newEmpForm, contractType: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                >
                  <option value="ملاك دائم">ملاك دائم</option>
                  <option value="عقد وزاري">عقد وزاري</option>
                  <option value="أجر يومي">أجر يومي</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">الراتب الأساسي (د.ع)</label>
                <input
                  type="number"
                  value={newEmpForm.basicSalary || 500000}
                  onChange={e => setNewEmpForm({ ...newEmpForm, basicSalary: Number(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateNewDossier}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow"
              >
                حفظ وإنشاء الإضبارة
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Lightbox / Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl p-5 space-y-4 shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-sm">{previewDoc.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.url}
                  download="document"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تنزيل الملف</span>
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-950 rounded-xl p-4 min-h-[300px]">
              {previewDoc.isPdf ? (
                <iframe
                  src={previewDoc.url}
                  title={previewDoc.title}
                  className="w-full h-[600px] rounded-lg border border-slate-800"
                />
              ) : (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.title}
                  className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Dedicated High-Craft Document Upload Card Component
interface DocumentUploadCardProps {
  title: string;
  docUrl?: string;
  isEditing: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
  onPreview: () => void;
}

function DocumentUploadCard({
  title,
  docUrl,
  isEditing,
  onUpload,
  onRemove,
  onPreview
}: DocumentUploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPdf = docUrl?.startsWith('data:application/pdf') || false;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      onUpload(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isEditing) return;
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      onUpload(files[0]);
    }
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className={`border rounded-2xl p-4 transition-all duration-200 ${
        docUrl
          ? 'bg-slate-950/80 border-slate-700/80 hover:border-blue-500/50'
          : 'bg-slate-950/40 border-dashed border-slate-800 hover:border-slate-700'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            {isPdf ? (
              <File className="w-4 h-4 text-rose-400" />
            ) : (
              <ImageIcon className="w-4 h-4 text-blue-400" />
            )}
            <span>{title}</span>
          </h4>
          <span className="text-[10px] text-slate-400">
            {docUrl ? (isPdf ? 'ملف مستند PDF' : 'صورة ممسوحة ضوئياً') : 'مطلوب إرفاق الوثيقة'}
          </span>
        </div>

        {docUrl ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>مرفوع</span>
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
            غير مرفوع
          </span>
        )}
      </div>

      {docUrl ? (
        <div className="space-y-3">
          {/* Preview Box */}
          <div
            onClick={onPreview}
            className="relative h-32 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden cursor-pointer group flex items-center justify-center"
          >
            {isPdf ? (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <File className="w-10 h-10 text-rose-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-300">عرض مستند PDF</span>
              </div>
            ) : (
              <img
                src={docUrl}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            )}
            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <span className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow">
                <ZoomIn className="w-3.5 h-3.5" />
                <span>معاينة وتكبير</span>
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={onPreview}
              className="flex-1 py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border border-slate-700"
            >
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>معاينة</span>
            </button>

            <a
              href={docUrl}
              download={title}
              className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>تحميل</span>
            </a>

            {isEditing && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-1.5 px-2.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 border border-blue-500/30"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>استبدال</span>
                </button>

                <button
                  type="button"
                  onClick={onRemove}
                  className="py-1.5 px-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 border border-rose-500/30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف</span>
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Empty Upload Zone */
        <div
          onClick={() => {
            if (isEditing) {
              fileInputRef.current?.click();
            }
          }}
          className={`h-32 rounded-xl border border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${
            isEditing
              ? 'border-slate-700 hover:border-blue-500/60 bg-slate-900/50 hover:bg-slate-900 cursor-pointer group'
              : 'border-slate-800 bg-slate-950/20 cursor-not-allowed opacity-60'
          }`}
        >
          <div className="p-2.5 rounded-full bg-slate-800/80 text-blue-400 group-hover:scale-110 transition-transform">
            <Upload className="w-5 h-5" />
          </div>
          <div className="text-center px-4">
            <p className="text-xs font-bold text-slate-300">
              {isEditing ? 'انقر أو اسحب الملف لرفعه هنا' : 'لتفعيل الرفع، انقر على "تعديل الإضبارة" أعلاه'}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">يدعم الصور (JPG, PNG) أو ملفات المستندات (PDF)</p>
          </div>
        </div>
      )}
    </div>
  );
}
