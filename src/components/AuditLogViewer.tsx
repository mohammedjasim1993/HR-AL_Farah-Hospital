import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ClipboardList,
  ShieldCheck,
  DollarSign,
  UserCheck,
  Search,
  Filter,
  Download,
  Printer,
  Trash2,
  Clock,
  ArrowRightLeft,
  Key,
  Building2,
  UserCog,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  X,
  SlidersHorizontal,
  Plus
} from 'lucide-react';
import { AuditLogEntry, AuditActionType, UserRole } from '../types';
import { showToast } from '../lib/toast';
import * as XLSX from 'xlsx';

interface AuditLogViewerProps {
  auditLogs: AuditLogEntry[];
  currentUser: any;
  onClearLogs?: () => void;
  onAddLog?: (entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'userId' | 'userName' | 'userRole'>) => void;
  language?: 'ar' | 'en';
}

export default function AuditLogViewer({
  auditLogs,
  currentUser,
  onClearLogs,
  onAddLog,
  language = 'ar'
}: AuditLogViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionType, setSelectedActionType] = useState<string>('all');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [showClearModal, setShowClearModal] = useState(false);
  const [showAddLogModal, setShowAddLogModal] = useState(false);

  // Form states for manual log test
  const [manualTitle, setManualTitle] = useState('');
  const [manualTarget, setManualTarget] = useState('');
  const [manualDetails, setManualDetails] = useState('');
  const [manualActionType, setManualActionType] = useState<AuditActionType>('SALARY_CHANGE');

  // Action badge helpers
  const getActionBadge = (type: AuditActionType) => {
    switch (type) {
      case 'SALARY_CHANGE':
        return {
          labelAr: 'تعديل راتب / مالية',
          labelEn: 'Salary Update',
          bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
          icon: DollarSign
        };
      case 'PERMISSIONS_CHANGE':
        return {
          labelAr: 'صلاحيات وأدوار',
          labelEn: 'Permissions',
          bg: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
          icon: Key
        };
      case 'USER_MANAGEMENT':
        return {
          labelAr: 'إدارة الحسابات',
          labelEn: 'User Mgmt',
          bg: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
          icon: UserCog
        };
      case 'DEPARTMENT_CHANGE':
        return {
          labelAr: 'تسعير الأقسام',
          labelEn: 'Dept Pricing',
          bg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
          icon: Building2
        };
      case 'EMPLOYEE_EDIT':
        return {
          labelAr: 'تعديل بيانات كادر',
          labelEn: 'Employee Edit',
          bg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
          icon: UserCheck
        };
      default:
        return {
          labelAr: 'إجراء نظام',
          labelEn: 'System Config',
          bg: 'bg-slate-500/15 border-slate-500/30 text-slate-300',
          icon: ShieldCheck
        };
    }
  };

  // Get unique list of usernames for filtering
  const uniqueUsers = useMemo(() => {
    const set = new Set<string>();
    auditLogs.forEach((log) => {
      if (log.userName) set.add(log.userName);
    });
    return Array.from(set);
  }, [auditLogs]);

  // Statistics
  const stats = useMemo(() => {
    const total = auditLogs.length;
    const salaryLogs = auditLogs.filter((l) => l.actionType === 'SALARY_CHANGE').length;
    const permLogs = auditLogs.filter((l) => l.actionType === 'PERMISSIONS_CHANGE').length;
    const usersCount = uniqueUsers.length;

    return { total, salaryLogs, permLogs, usersCount };
  }, [auditLogs, uniqueUsers]);

  // Filtered and sorted logs
  const filteredLogs = useMemo(() => {
    return auditLogs
      .filter((log) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = log.actionTitle?.toLowerCase().includes(q);
          const matchUser = log.userName?.toLowerCase().includes(q);
          const matchTarget = log.targetName?.toLowerCase().includes(q);
          const matchDetails = log.details?.toLowerCase().includes(q);
          if (!matchTitle && !matchUser && !matchTarget && !matchDetails) return false;
        }

        // Action type filter
        if (selectedActionType !== 'all' && log.actionType !== selectedActionType) {
          return false;
        }

        // User filter
        if (selectedUserFilter !== 'all' && log.userName !== selectedUserFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
      });
  }, [auditLogs, searchQuery, selectedActionType, selectedUserFilter, sortOrder]);

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredLogs.length === 0) {
      showToast(language === 'ar' ? 'لا توجد سجلات للتصدير' : 'No log entries to export', 'info');
      return;
    }

    const rows = filteredLogs.map((log, index) => ({
      'ت': index + 1,
      'التاريخ والوقت': new Date(log.timestamp).toLocaleString('ar-IQ'),
      'اسم المستخدم': log.userName,
      'الرتبة/الدور': log.userRole,
      'نوع الإجراء': getActionBadge(log.actionType).labelAr,
      'عنوان التعديل': log.actionTitle,
      'الجهة/الموظف المستهدف': log.targetName,
      'تفاصيل التعديل': log.details,
      'القيمة السابقة': log.previousValue || '-',
      'القيمة الجديدة': log.newValue || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Audit_Log');
    XLSX.writeFile(wb, `AlFarrah_Audit_Log_${new Date().toISOString().slice(0, 10)}.xlsx`);

    showToast(language === 'ar' ? 'تم تصدير سجل التتبع إلى Excel بنجاح' : 'Audit log exported to Excel successfully', 'success');
  };

  // Print Audit Report
  const handlePrintLogs = () => {
    window.print();
  };

  // Submit manual log entry
  const handleCreateManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualTarget.trim() || !manualDetails.trim()) {
      showToast(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields', 'error');
      return;
    }

    if (onAddLog) {
      onAddLog({
        actionType: manualActionType,
        actionTitle: manualTitle.trim(),
        targetName: manualTarget.trim(),
        details: manualDetails.trim()
      });
      showToast(language === 'ar' ? 'تم تسجيل القيد بنجاح في سجل التتبع' : 'Audit record logged successfully', 'success');
    }

    setManualTitle('');
    setManualTarget('');
    setManualDetails('');
    setShowAddLogModal(false);
  };

  const isSystemAdmin = currentUser?.role === 'SystemAdmin' || currentUser?.role === 'SuperAdmin';

  return (
    <div className="space-y-6 pb-12 text-right" dir="rtl">
      {/* Printable CSS overrides */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #audit-log-printable, #audit-log-printable * {
            visibility: visible;
          }
          #audit-log-printable {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            color: #000 !important;
            background: #fff !important;
            padding: 15px;
          }
          .no-print {
            display: none !important;
          }
          table {
            border: 2px solid #000 !important;
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid #000 !important;
            padding: 6px 8px !important;
            color: #000 !important;
            font-size: 11px !important;
          }
          th {
            background-color: #f1f5f9 !important;
            font-weight: bold !important;
          }
        }
      `}</style>

      {/* Main Header Banner */}
      <div className="glass-header p-5 rounded-3xl border border-white/10 relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-indigo-500/20 border border-indigo-500/40 rounded-2xl text-indigo-400 shadow-inner">
              <ClipboardList className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-wide">
                  {language === 'ar' ? 'سجل تتبع العمليات والتعديلات (Audit Log)' : 'System Audit Log'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                  {language === 'ar' ? 'تتبع آمن لحركات الرواتب والصلاحيات' : 'Security Trail'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 font-medium leading-relaxed">
                {language === 'ar'
                  ? 'يعرض جميع التعديلات الهامة على رواتب الموظفين، الحسابات، وصلاحيات النظام مع توثيق اسم المستخدم والتوقيت الزمني الدقيق.'
                  : 'Tracks all critical updates to staff salaries, account permissions, and system parameters with timestamped attribution.'}
              </p>
            </div>
          </div>

          {/* Action Toolbar Buttons */}
          <div className="flex flex-wrap items-center gap-2 no-print">
            {onAddLog && (
              <button
                onClick={() => setShowAddLogModal(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'ar' ? 'إضافة قيد تتبع يدوي' : 'Log Manual Event'}</span>
              </button>
            )}

            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 rounded-xl bg-emerald-700/30 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>{language === 'ar' ? 'تصدير لـ Excel' : 'Export Excel'}</span>
            </button>

            <button
              onClick={handlePrintLogs}
              className="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 hover:text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4 text-blue-400" />
              <span>{language === 'ar' ? 'طباعة التقرير' : 'Print Report'}</span>
            </button>

            {isSystemAdmin && onClearLogs && (
              <button
                onClick={() => setShowClearModal(true)}
                className="px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 hover:text-rose-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="تفرغ سجل التتبع (مدير النظام فقط)"
              >
                <Trash2 className="w-4 h-4" />
                <span>{language === 'ar' ? 'تفريغ السجل' : 'Clear Logs'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Cards Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 no-print">
        <div className="glass-panel p-4 rounded-2xl border border-white/5 bg-slate-900/60 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">إجمالي القيود المسجلة</span>
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-indigo-300 mt-2">{stats.total}</p>
          <span className="text-[10px] text-slate-400 block mt-0.5">حدث في سجل النظام</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/5 bg-slate-900/60 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">تعديلات الرواتب</span>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-emerald-400 mt-2">{stats.salaryLogs}</p>
          <span className="text-[10px] text-slate-400 block mt-0.5">تغيير في الراتب أو الساعات</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/5 bg-slate-900/60 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">تعديل الصلاحيات</span>
            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
              <Key className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-purple-300 mt-2">{stats.permLogs}</p>
          <span className="text-[10px] text-slate-400 block mt-0.5">تعديل أدوار أو مصفوفة الصلاحية</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/5 bg-slate-900/60 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">المستخدمين المنفذين</span>
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-blue-300 mt-2">{stats.usersCount}</p>
          <span className="text-[10px] text-slate-400 block mt-0.5">حسابات نشطة في التعديل</span>
        </div>
      </div>

      {/* Filter and Search Bar Control Panel */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-slate-900/80 space-y-3 no-print">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'ar' ? 'بحث باسم المستخدم، الموظف المستهدف، أو تفاصيل التعديل...' : 'Search logs...'}
              className="w-full pr-9 pl-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-2.5 text-slate-400 hover:text-white text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Action Type Dropdown */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <select
                value={selectedActionType}
                onChange={(e) => setSelectedActionType(e.target.value)}
                className="px-3 py-2 pr-8 bg-slate-950 border border-white/10 rounded-xl text-xs text-indigo-300 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                <option value="all">🔍 جميع أنواع الإجراءات</option>
                <option value="SALARY_CHANGE">💵 تعديلات الرواتب والمالية</option>
                <option value="PERMISSIONS_CHANGE">🔑 تعديلات الصلاحيات والأدوار</option>
                <option value="USER_MANAGEMENT">👤 إدارة مستخدمي النظام</option>
                <option value="DEPARTMENT_CHANGE">🏢 تعديل تسعير وإعدادات الأقسام</option>
                <option value="EMPLOYEE_EDIT">📝 تعديل بيانات الكادر</option>
              </select>
              <Filter className="w-3.5 h-3.5 text-indigo-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>

            {/* User Filter Dropdown */}
            <div className="relative">
              <select
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="px-3 py-2 pr-8 bg-slate-950 border border-white/10 rounded-xl text-xs text-slate-300 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                <option value="all">👥 جميع المستخدمين</option>
                {uniqueUsers.map((usr) => (
                  <option key={usr} value={usr}>
                    {usr}
                  </option>
                ))}
              </select>
              <UserCog className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>

            {/* Date Sort Toggle */}
            <button
              onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{sortOrder === 'newest' ? 'الأحدث أولاً' : 'الأقدم أولاً'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Audit Log Table & Printable Container */}
      <div id="audit-log-printable" className="glass-panel p-4 rounded-3xl border border-white/10 bg-slate-900/90 shadow-xl overflow-hidden">
        {/* Printable Only Header */}
        <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-4 text-center">
          <h1 className="text-xl font-bold text-slate-900">مستشفى الفرح الأهلي - Basra, Iraq</h1>
          <h2 className="text-lg font-bold text-slate-800 mt-1">تقرير سجل تتبع العمليات والتعديلات (Audit Log Trail)</h2>
          <p className="text-xs text-slate-600 mt-1">
            تاريخ استخراج التقرير: {new Date().toLocaleString('ar-IQ')} | المستخرج: {currentUser?.username || 'النظام'}
          </p>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center mx-auto text-slate-500">
              <ClipboardList className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-400">لم يتم العثور على أي قيود في سجل التتبع طابق البحث</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              تأكد من عدم وجود فلاتر تقييدية، أو قم بإجراء تعديلات على الرواتب/الصلاحيات لتظهر القيود تلقائياً.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-white/10 text-slate-300 font-extrabold select-none">
                  <th className="p-3 text-center w-12">ت</th>
                  <th className="p-3 text-right w-44">التوقيت والتاريخ</th>
                  <th className="p-3 text-right w-40">اسم المستخدم (المنفذ)</th>
                  <th className="p-3 text-center w-36">نوع الإجراء</th>
                  <th className="p-3 text-right w-52">عنوان التعديل والجهة المستهدفة</th>
                  <th className="p-3 text-right">تفاصيل التعديل الفعلي</th>
                  <th className="p-3 text-center w-36">التغيير (قبل / بعد)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {filteredLogs.map((log, idx) => {
                  const badge = getActionBadge(log.actionType);
                  const BadgeIcon = badge.icon;
                  const dateStr = new Date(log.timestamp).toLocaleString('ar-IQ', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  });

                  return (
                    <tr key={log.id} className="hover:bg-white/[0.03] transition-colors">
                      {/* Sequence */}
                      <td className="p-3 text-center font-mono font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Timestamp */}
                      <td className="p-3 text-right font-mono text-[11px] text-slate-300 whitespace-nowrap" dir="ltr">
                        <div className="flex items-center gap-1.5 justify-end">
                          <Clock className="w-3 h-3 text-indigo-400 shrink-0 no-print" />
                          <span>{dateStr}</span>
                        </div>
                      </td>

                      {/* User Info */}
                      <td className="p-3 text-right">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0 no-print" />
                          <span>{log.userName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          {log.userRole}
                        </span>
                      </td>

                      {/* Action Category Badge */}
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10.5px] font-bold border ${badge.bg}`}>
                          <BadgeIcon className="w-3 h-3 shrink-0 no-print" />
                          <span>{badge.labelAr}</span>
                        </span>
                      </td>

                      {/* Action Title & Target */}
                      <td className="p-3 text-right">
                        <div className="font-black text-indigo-200 text-xs">
                          {log.actionTitle}
                        </div>
                        <div className="text-[11px] text-emerald-300/90 font-medium mt-0.5">
                          🎯 {log.targetName}
                        </div>
                      </td>

                      {/* Details */}
                      <td className="p-3 text-right leading-relaxed text-[11.5px] text-slate-300">
                        {log.details}
                      </td>

                      {/* Values Before/After */}
                      <td className="p-3 text-center font-mono text-[10.5px]">
                        {log.previousValue || log.newValue ? (
                          <div className="flex flex-col items-center justify-center gap-1 bg-slate-950/60 p-1.5 rounded-xl border border-white/5">
                            {log.previousValue && (
                              <span className="text-rose-400/90 line-through text-[10px]">
                                {log.previousValue}
                              </span>
                            )}
                            {log.newValue && (
                              <span className="text-emerald-400 font-bold">
                                {log.newValue}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[10px]">-</span>
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

      {/* Manual Audit Entry Modal */}
      <AnimatePresence>
        {showAddLogModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm no-print">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl text-right"
              dir="rtl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                    <Plus className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-black text-white">إضافة قيد تتبع يدوي لسجل التوثيق</h3>
                </div>
                <button
                  onClick={() => setShowAddLogModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateManualLog} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">نوع الإجراء الموثق:</label>
                  <select
                    value={manualActionType}
                    onChange={(e) => setManualActionType(e.target.value as AuditActionType)}
                    className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="SALARY_CHANGE">💵 تعديل راتب أو مستحقات مالية</option>
                    <option value="PERMISSIONS_CHANGE">🔑 تعديل صلاحيات وأدوار مستخدم</option>
                    <option value="USER_MANAGEMENT">👤 إنشاء أو تعديل حساب مستخدم</option>
                    <option value="DEPARTMENT_CHANGE">🏢 تعديل إعدادات وتسعير قسم</option>
                    <option value="EMPLOYEE_EDIT">📝 تعديل بيانات كادر موظف</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">عنوان التعديل الإداري:</label>
                  <input
                    type="text"
                    required
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="مثال: تعديل مخصصات الإسناد أو تعديل كلمة المرور"
                    className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">الجهة أو الموظف المستهدف:</label>
                  <input
                    type="text"
                    required
                    value={manualTarget}
                    onChange={(e) => setManualTarget(e.target.value)}
                    placeholder="مثال: د. أحمد المحسن أو مصفوفة المحاسبين"
                    className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">شرح وتفاصيل التعديل بالتفصيل:</label>
                  <textarea
                    rows={3}
                    required
                    value={manualDetails}
                    onChange={(e) => setManualDetails(e.target.value)}
                    placeholder="اكتب التوضيح الإداري والمبرر لعملية التعديل السجل..."
                    className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowAddLogModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>حفظ القيد بالتدقيق</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Clear Logs Confirm Modal */}
      <AnimatePresence>
        {showClearModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm no-print">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-right"
              dir="rtl"
            >
              <div className="flex items-center gap-3 text-rose-400 border-b border-rose-500/20 pb-3">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <h3 className="text-base font-black text-white">تأكيد تفريغ سجل التتبع (Audit Log)</h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                هل أنت أكتيد من رغبتك في حذف وتسوية جميع سجلات التتبع المحفوظة؟ هذا الإجراء سيرسخ تصفير الأرشيف ولا يمكن التراجع عنه.
              </p>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowClearModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onClearLogs) onClearLogs();
                    setShowClearModal(false);
                    showToast(language === 'ar' ? 'تم مسح سجل التتبع بنجاح' : 'Audit logs cleared', 'success');
                  }}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>تأكيد الحذف النهائي</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
