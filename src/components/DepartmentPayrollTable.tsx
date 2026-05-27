/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Employee } from '../types';
import { calculateEmployeeSalaryAndDeductions } from '../data';
import { Edit, Trash2, HelpCircle, BadgeInfo, Award } from 'lucide-react';

interface DepartmentPayrollTableProps {
  department: string;
  employees: Employee[];
  onUpdateField: (empId: string, field: keyof Employee, value: any) => void;
  onEditClick: (emp: Employee) => void;
  onDeleteClick: (empId: string, name: string) => void;
  isPrintMode?: boolean;
  isLocked?: boolean;
}

export default function DepartmentPayrollTable({
  department,
  employees,
  onUpdateField,
  onEditClick,
  onDeleteClick,
  isPrintMode = false,
  isLocked = false
}: DepartmentPayrollTableProps) {
  
  if (employees.length === 0) {
    return (
      <div className="p-6 text-center text-gray-400 bg-slate-50 border border-dashed border-gray-200 rounded-xl" id={`empty-${department}`}>
        <p className="text-xs">لا يوجد موظفون مسجلون في {department} حالياً.</p>
      </div>
    );
  }

  // دالة مساعدة لإنشاء مدخل رقمي تفاعلي وقابل للتعديل الفوري
  const renderCellInput = (empId: string, field: keyof Employee, value: number = 0, placeholder = "0") => {
    if (isPrintMode) {
      return <span className="font-mono font-bold text-gray-800">{value.toLocaleString()}</span>;
    }
    return (
      <input
        type="number"
        min="0"
        placeholder={placeholder}
        value={value || ''}
        disabled={isLocked}
        onChange={(e) => onUpdateField(empId, field, Number(e.target.value))}
        className={`w-16 px-1.5 py-1 text-center font-mono font-bold text-gray-800 border outline-none rounded-lg text-xs transition-all ${
          isLocked 
            ? 'bg-slate-100 border-slate-200 text-gray-400 cursor-not-allowed opacity-60' 
            : 'bg-slate-50 border-gray-200 focus:border-teal-700'
        }`}
      />
    );
  };

  // دالة مساعدة لحساب وعرض الراتب الصافي مع تفاصيل العملية الحسابية
  const getCalculatedRow = (emp: Employee) => {
    return calculateEmployeeSalaryAndDeductions(emp);
  };

  // سنقوم بالتحقق من القسم وعرض الأعمدة المخصصة له بناءً على طلب المستخدم
  switch (department) {
    case "الادارة العليا":
      return (
        <div className="overflow-x-auto border border-gray-150 rounded-xl bg-white shadow-sm" id="table-upper-admin">
          <table className="w-full text-right border-collapse text-xs">
            <thead className="bg-slate-50 text-gray-500 font-bold border-b border-gray-150">
              <tr>
                <th className="p-3 text-center w-16">الكود</th>
                <th className="p-3">الاسم بالكامل</th>
                <th className="p-3">المنصب</th>
                <th className="p-3 text-center">الراتب الأساسي</th>
                <th className="p-3 text-center">إضافي (أيام)</th>
                <th className="p-3 text-center">إضافي (ساعات)</th>
                <th className="p-3 text-center">مبلغ عقوبات</th>
                <th className="p-3 text-center">أيام الاستقطاع</th>
                <th className="p-3 text-center">ساعات الاستقطاع</th>
                <th className="p-3 text-center">أيام الدوام</th>
                <th className="p-3 text-left font-bold text-teal-900 bg-teal-50/10">الراتب المستحق</th>
                {!isPrintMode && <th className="p-3 text-center">التحكم</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {employees.map(emp => {
                const calc = getCalculatedRow(emp);
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-3 text-center font-mono text-gray-450 font-bold">{emp.id}</td>
                    <td className="p-3 font-bold text-gray-900">{emp.name}</td>
                    <td className="p-3 text-gray-500">{emp.title}</td>
                    <td className="p-3 text-center">
                      {renderCellInput(emp.id, 'baseSalary', emp.baseSalary, "الراتب")}
                    </td>
                    <td className="p-3 text-center">
                      {renderCellInput(emp.id, 'overtimeDays', emp.overtimeDays, "أيام")}
                    </td>
                    <td className="p-3 text-center">
                      {renderCellInput(emp.id, 'overtimeHours', emp.overtimeHours, "ساعات")}
                    </td>
                    <td className="p-3 text-center">
                      {renderCellInput(emp.id, 'penalties', emp.penalties, "عقوبة")}
                    </td>
                    <td className="p-3 text-center">
                      {renderCellInput(emp.id, 'deductionDays', emp.deductionDays, "أيام")}
                    </td>
                    <td className="p-3 text-center">
                      {renderCellInput(emp.id, 'deductionHours', emp.deductionHours, "ساعات")}
                    </td>
                    <td className="p-3 text-center">
                      {renderCellInput(emp.id, 'workDaysCount', emp.workDaysCount, "دوام")}
                    </td>
                    <td className="p-3 text-left font-mono font-bold text-teal-800 bg-teal-50/10 text-[13px]">
                      {calc.finalSalary.toLocaleString()} د.ع
                    </td>
                    {!isPrintMode && (
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => onEditClick(emp)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="تعديل"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => onDeleteClick(emp.id, emp.name)} className="p-1 text-red-500 hover:bg-red-50 rounded" title="حذف"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );

    case "قسم الصيدلية":
      return (
        <div className="overflow-x-auto border border-gray-150 rounded-xl bg-white shadow-sm" id="table-pharmacy">
          <table className="w-full text-right border-collapse text-xs">
            <thead className="bg-slate-50 text-gray-500 font-bold border-b border-gray-150">
              <tr>
                <th className="p-3 text-center w-16">الكود</th>
                <th className="p-3">الاسم بالكامل</th>
                <th className="p-3">المنصب</th>
                <th className="p-3 text-center">مبلغ الشفت الصباحي</th>
                <th className="p-3 text-center">مبلغ الشفت الخفر</th>
                <th className="p-3 text-center">أيام الصباحي</th>
                <th className="p-3 text-center">أيام الخفر</th>
                <th className="p-3 text-center font-bold text-sky-900 bg-sky-50/10">مجموع الشفتين</th>
                <th className="p-3 text-center">إضافات</th>
                <th className="p-3 text-center">استقطاعات</th>
                <th className="p-3 text-left font-bold text-teal-900 bg-teal-50/10">الراتب المستحق</th>
                {!isPrintMode && <th className="p-3 text-center">التحكم</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {employees.map(emp => {
                const calc = getCalculatedRow(emp);
                const shiftsTotal = ((emp.morningShiftValue || 0) * (emp.morningShiftDays || 0)) + 
                                     ((emp.nightShiftValue || 0) * (emp.nightShiftDays || 0));
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-3 text-center font-mono text-gray-450 font-bold">{emp.id}</td>
                    <td className="p-3 font-bold text-gray-900">{emp.name}</td>
                    <td className="p-3 text-gray-500">{emp.title}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'morningShiftValue', emp.morningShiftValue)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'nightShiftValue', emp.nightShiftValue)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'morningShiftDays', emp.morningShiftDays)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'nightShiftDays', emp.nightShiftDays)}</td>
                    <td className="p-3 text-center font-mono font-bold text-sky-900 bg-sky-50/10">
                      {shiftsTotal.toLocaleString()} د.ع
                    </td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'additions', emp.additions)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'deductions', emp.deductions)}</td>
                    <td className="p-3 text-left font-mono font-bold text-teal-800 bg-teal-50/10 text-[13px]">
                      {calc.finalSalary.toLocaleString()} د.ع
                    </td>
                    {!isPrintMode && (
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => onEditClick(emp)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => onDeleteClick(emp.id, emp.name)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );

    case "قسم العمليات":
      return (
        <div className="overflow-x-auto border border-gray-150 rounded-xl bg-white shadow-sm" id="table-operations">
          <table className="w-full text-right border-collapse text-xs">
            <thead className="bg-slate-50 text-gray-500 font-bold border-b border-gray-150">
              <tr>
                <th className="p-3 text-center w-16">الكود</th>
                <th className="p-3">الاسم بالكامل</th>
                <th className="p-3">المنصب</th>
                <th className="p-3 text-center">الراتب الإجمالي</th>
                <th className="p-3 text-center">مبلغ اليوم</th>
                <th className="p-3 text-center">مبلغ الساعة</th>
                <th className="p-3 text-center">أيام الدوام</th>
                <th className="p-3 text-center">إضافات</th>
                <th className="p-3 text-center">استقطاعات</th>
                <th className="p-3 text-left font-bold text-teal-900 bg-teal-50/10">الراتب المستحق</th>
                {!isPrintMode && <th className="p-3 text-center">التحكم</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {employees.map(emp => {
                const calc = getCalculatedRow(emp);
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-3 text-center font-mono text-gray-450 font-bold">{emp.id}</td>
                    <td className="p-3 font-bold text-gray-900">{emp.name}</td>
                    <td className="p-3 text-gray-500">{emp.title}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'totalSalary', emp.totalSalary)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'dayValue', emp.dayValue)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'hourValue', emp.hourValue)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'workDaysCount', emp.workDaysCount)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'additions', emp.additions)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'deductions', emp.deductions)}</td>
                    <td className="p-3 text-left font-mono font-bold text-teal-800 bg-teal-50/10 text-[13px]">
                      {calc.finalSalary.toLocaleString()} د.ع
                    </td>
                    {!isPrintMode && (
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => onEditClick(emp)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => onDeleteClick(emp.id, emp.name)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );

    case "قسم النسائية والتوليد":
      return (
        <div className="overflow-x-auto border border-gray-150 rounded-xl bg-white shadow-sm" id="table-obgyn">
          <table className="w-full text-right border-collapse text-xs">
            <thead className="bg-slate-50 text-gray-500 font-bold border-b border-gray-150">
              <tr>
                <th className="p-3 text-center w-16">الكود</th>
                <th className="p-3">الاسم بالكامل</th>
                <th className="p-3">المنصب</th>
                <th className="p-3 text-center">مبلغ اليوم الكامل</th>
                <th className="p-3 text-center">مبلغ نصف شفت</th>
                <th className="p-3 text-center">أيام الدوام</th>
                <th className="p-3 text-center">إضافات</th>
                <th className="p-3 text-center">استقطاعات</th>
                <th className="p-3 text-left font-bold text-teal-900 bg-teal-50/10">الراتب المستحق</th>
                {!isPrintMode && <th className="p-3 text-center">التحكم</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {employees.map(emp => {
                const calc = getCalculatedRow(emp);
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-3 text-center font-mono text-gray-450 font-bold">{emp.id}</td>
                    <td className="p-3 font-bold text-gray-900">{emp.name}</td>
                    <td className="p-3 text-gray-500">{emp.title}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'fullDayValue', emp.fullDayValue)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'halfShiftValue', emp.halfShiftValue)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'workDaysCount', emp.workDaysCount)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'additions', emp.additions)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'deductions', emp.deductions)}</td>
                    <td className="p-3 text-left font-mono font-bold text-teal-800 bg-teal-50/10 text-[13px]">
                      {calc.finalSalary.toLocaleString()} د.ع
                    </td>
                    {!isPrintMode && (
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => onEditClick(emp)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => onDeleteClick(emp.id, emp.name)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );

    case "قسم الكافتريا":
      return (
        <div className="overflow-x-auto border border-gray-150 rounded-xl bg-white shadow-sm" id="table-cafeteria">
          <table className="w-full text-right border-collapse text-xs">
            <thead className="bg-slate-50 text-gray-500 font-bold border-b border-gray-150">
              <tr>
                <th className="p-3 text-center w-16">الكود</th>
                <th className="p-3">الاسم بالكامل</th>
                <th className="p-3">المنصب</th>
                <th className="p-3 text-center">مبلغ اليوم</th>
                <th className="p-3 text-center">مبلغ الساعة</th>
                <th className="p-3 text-center">أيام الدوام</th>
                <th className="p-3 text-center">إضافات</th>
                <th className="p-3 text-center">استقطاعات</th>
                <th className="p-3 text-left font-bold text-teal-900 bg-teal-50/10">الراتب المستحق</th>
                {!isPrintMode && <th className="p-3 text-center">التحكم</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {employees.map(emp => {
                const calc = getCalculatedRow(emp);
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-3 text-center font-mono text-gray-450 font-bold">{emp.id}</td>
                    <td className="p-3 font-bold text-gray-900">{emp.name}</td>
                    <td className="p-3 text-gray-500">{emp.title}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'dayValue', emp.dayValue)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'hourValue', emp.hourValue)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'workDaysCount', emp.workDaysCount)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'additions', emp.additions)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'deductions', emp.deductions)}</td>
                    <td className="p-3 text-left font-mono font-bold text-teal-800 bg-teal-50/10 text-[13px]">
                      {calc.finalSalary.toLocaleString()} د.ع
                    </td>
                    {!isPrintMode && (
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => onEditClick(emp)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => onDeleteClick(emp.id, emp.name)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );

    case "قسم الاطفال والخدج":
      return (
        <div className="overflow-x-auto border border-gray-150 rounded-xl bg-white shadow-sm" id="table-incubator">
          <table className="w-full text-right border-collapse text-xs">
            <thead className="bg-slate-50 text-gray-500 font-bold border-b border-gray-150">
              <tr>
                <th className="p-3 text-center w-16">الكود</th>
                <th className="p-3">الاسم بالكامل</th>
                <th className="p-3">المنصب</th>
                <th className="p-3 text-center">مبلغ شفت صباحي</th>
                <th className="p-3 text-center">مبلغ شفت خفر</th>
                <th className="p-3 text-center">أيام الصباحي</th>
                <th className="p-3 text-center">أيام الخفر</th>
                <th className="p-3 text-center font-bold text-sky-900 bg-sky-50/10">مجموع الصباحي والخفر</th>
                <th className="p-3 text-center">إضافات</th>
                <th className="p-3 text-center">استقطاعات</th>
                <th className="p-3 text-left font-bold text-teal-900 bg-teal-50/10">الراتب المستحق</th>
                {!isPrintMode && <th className="p-3 text-center">التحكم</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {employees.map(emp => {
                const calc = getCalculatedRow(emp);
                const shiftsSum = ((emp.morningShiftValue || 0) * (emp.morningShiftDaysCount || 0)) + 
                                  ((emp.nightShiftValue || 0) * (emp.nightShiftDaysCount || 0));
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-3 text-center font-mono text-gray-450 font-bold">{emp.id}</td>
                    <td className="p-3 font-bold text-gray-900">{emp.name}</td>
                    <td className="p-3 text-gray-500">{emp.title}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'morningShiftValue', emp.morningShiftValue)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'nightShiftValue', emp.nightShiftValue)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'morningShiftDaysCount', emp.morningShiftDaysCount)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'nightShiftDaysCount', emp.nightShiftDaysCount)}</td>
                    <td className="p-3 text-center font-mono font-bold text-sky-905">
                      {shiftsSum.toLocaleString()} د.ع
                    </td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'additions', emp.additions)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'deductions', emp.deductions)}</td>
                    <td className="p-3 text-left font-mono font-bold text-teal-800 bg-teal-50/10 text-[13px]">
                      {calc.finalSalary.toLocaleString()} د.ع
                    </td>
                    {!isPrintMode && (
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => onEditClick(emp)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => onDeleteClick(emp.id, emp.name)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );

    case "قسم السونار":
      return (
        <div className="overflow-x-auto border border-gray-150 rounded-xl bg-white shadow-sm" id="table-sonar">
          <table className="w-full text-right border-collapse text-xs">
            <thead className="bg-slate-50 text-gray-500 font-bold border-b border-gray-150">
              <tr>
                <th className="p-3 text-center w-16">الكود</th>
                <th className="p-3">الاسم بالكامل</th>
                <th className="p-3">المنصب</th>
                <th className="p-3 text-center">مبلغ الاستدعاء</th>
                <th className="p-3 text-center">عدد أيام الدوام (الاستدعاءات)</th>
                <th className="p-3 text-center">إضافات</th>
                <th className="p-3 text-center">استقطاعات</th>
                <th className="p-3 text-left font-bold text-teal-900 bg-teal-50/10">الراتب المستحق</th>
                {!isPrintMode && <th className="p-3 text-center">التحكم</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {employees.map(emp => {
                const calc = getCalculatedRow(emp);
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-3 text-center font-mono text-gray-450 font-bold">{emp.id}</td>
                    <td className="p-3 font-bold text-gray-900">{emp.name}</td>
                    <td className="p-3 text-gray-500">{emp.title}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'recallValue', emp.recallValue)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'workDaysCount', emp.workDaysCount)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'additions', emp.additions)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'deductions', emp.deductions)}</td>
                    <td className="p-3 text-left font-mono font-bold text-teal-800 bg-teal-50/10 text-[13px]">
                      {calc.finalSalary.toLocaleString()} د.ع
                    </td>
                    {!isPrintMode && (
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => onEditClick(emp)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => onDeleteClick(emp.id, emp.name)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );

    case "قسم اطباء الخدج المقيمين":
      return (
        <div className="overflow-x-auto border border-gray-150 rounded-xl bg-white shadow-sm" id="table-res-pediatrics">
          <table className="w-full text-right border-collapse text-xs">
            <thead className="bg-slate-50 text-gray-500 font-bold border-b border-gray-150">
              <tr>
                <th className="p-3 text-center w-16">الكود</th>
                <th className="p-3">الاسم بالكامل</th>
                <th className="p-3">المنصب</th>
                <th className="p-3 text-center">مبلغ اليوم الكامل</th>
                <th className="p-3 text-center">مبلغ اليوم المشترك</th>
                <th className="p-3 text-center">أيام الدوام الكامل</th>
                <th className="p-3 text-center">أيام الدوام المشترك</th>
                <th className="p-3 text-center font-bold text-sky-900 bg-sky-50/10 border-l border-r border-slate-100">مجموع الرواتب</th>
                <th className="p-3 text-center">إضافات</th>
                <th className="p-3 text-center">استقطاعات</th>
                <th className="p-3 text-left font-bold text-teal-900 bg-teal-50/10">الراتب المستحق</th>
                {!isPrintMode && <th className="p-3 text-center">التحكم</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {employees.map(emp => {
                const calc = getCalculatedRow(emp);
                const sumTotalAndJoint = ((emp.fullDayValue || 0) * (emp.fullDayCount || 0)) + 
                                         ((emp.jointDayValue || 0) * (emp.jointDayCount || 0));
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-3 text-center font-mono text-gray-450 font-bold">{emp.id}</td>
                    <td className="p-3 font-bold text-gray-900">{emp.name}</td>
                    <td className="p-3 text-gray-500">{emp.title}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'fullDayValue', emp.fullDayValue)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'jointDayValue', emp.jointDayValue)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'fullDayCount', emp.fullDayCount)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'jointDayCount', emp.jointDayCount)}</td>
                    <td className="p-3 text-center font-mono font-bold text-sky-900 bg-sky-50/10 border-l border-r border-slate-100">
                      {sumTotalAndJoint.toLocaleString()} د.ع
                    </td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'additions', emp.additions)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'deductions', emp.deductions)}</td>
                    <td className="p-3 text-left font-mono font-bold text-teal-800 bg-teal-50/10 text-[13px]">
                      {calc.finalSalary.toLocaleString()} د.ع
                    </td>
                    {!isPrintMode && (
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => onEditClick(emp)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => onDeleteClick(emp.id, emp.name)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );

    case "قسم المختبر ومصرف الدم":
      return (
        <div className="overflow-x-auto border border-gray-150 rounded-xl bg-white shadow-sm" id="table-lab">
          <table className="w-full text-right border-collapse text-xs">
            <thead className="bg-slate-50 text-gray-500 font-bold border-b border-gray-150">
              <tr>
                <th className="p-3 text-center w-16">الكود</th>
                <th className="p-3">الاسم بالكامل</th>
                <th className="p-3">المنصب</th>
                <th className="p-3 text-center">صباحي (مبلغ)</th>
                <th className="p-3 text-center">خفر (مبلغ)</th>
                <th className="p-3 text-center">نصف شفت (مبلغ)</th>
                <th className="p-3 text-center">صباحي (أيام)</th>
                <th className="p-3 text-center">خفر (أيام)</th>
                <th className="p-3 text-center">نصف شفت (أيام)</th>
                <th className="p-3 text-center font-bold text-sky-950 bg-sky-50/10">مجموع الراتب</th>
                <th className="p-3 text-center">إضافات</th>
                <th className="p-3 text-center">استقطاعات</th>
                <th className="p-3 text-left font-bold text-teal-900 bg-teal-50/10">الراتب المستحق</th>
                {!isPrintMode && <th className="p-3 text-center">التحكم</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {employees.map(emp => {
                const calc = getCalculatedRow(emp);
                const shiftsTotal = ((emp.morningShiftValue || 0) * (emp.morningShiftDays9 || 0)) + 
                                     ((emp.nightShiftValue || 0) * (emp.nightShiftDays9 || 0)) +
                                     ((emp.halfShiftValue9 || 0) * (emp.halfShiftDays9 || 0));
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-3 text-center font-mono text-gray-450 font-bold">{emp.id}</td>
                    <td className="p-3 font-bold text-gray-900">{emp.name}</td>
                    <td className="p-3 text-gray-500">{emp.title}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'morningShiftValue', emp.morningShiftValue)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'nightShiftValue', emp.nightShiftValue)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'halfShiftValue9', emp.halfShiftValue9)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'morningShiftDays9', emp.morningShiftDays9)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'nightShiftDays9', emp.nightShiftDays9)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'halfShiftDays9', emp.halfShiftDays9)}</td>
                    <td className="p-3 text-center font-semibold text-sky-950 bg-sky-50/10">{shiftsTotal.toLocaleString()} د.ع</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'additions', emp.additions)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'deductions', emp.deductions)}</td>
                    <td className="p-3 text-left font-mono font-bold text-teal-800 bg-teal-50/10 text-[13px]">
                      {calc.finalSalary.toLocaleString()} د.ع
                    </td>
                    {!isPrintMode && (
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => onEditClick(emp)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => onDeleteClick(emp.id, emp.name)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );

    case "قسم الاطباء المقيمين":
      return (
        <div className="overflow-x-auto border border-gray-150 rounded-xl bg-white shadow-sm" id="table-res-doctors">
          <table className="w-full text-right border-collapse text-xs">
            <thead className="bg-slate-50 text-gray-500 font-bold border-b border-gray-150">
              <tr>
                <th className="p-3 text-center w-16">الكود</th>
                <th className="p-3">الاسم بالكامل</th>
                <th className="p-3">المنصب</th>
                <th className="p-3 text-center">مبلغ اليوم (12 ساعة)</th>
                <th className="p-3 text-center">عدد أيام الدوام</th>
                <th className="p-3 text-center">إضافات</th>
                <th className="p-3 text-center">استقطاعات</th>
                <th className="p-3 text-left font-bold text-teal-900 bg-teal-50/10">الراتب المستحق</th>
                {!isPrintMode && <th className="p-3 text-center">التحكم</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {employees.map(emp => {
                const calc = getCalculatedRow(emp);
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-3 text-center font-mono text-gray-450 font-bold">{emp.id}</td>
                    <td className="p-3 font-bold text-gray-900">{emp.name}</td>
                    <td className="p-3 text-gray-500">{emp.title}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'dayValue12h', emp.dayValue12h)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'workDaysCount', emp.workDaysCount)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'additions', emp.additions)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'deductions', emp.deductions)}</td>
                    <td className="p-3 text-left font-mono font-bold text-teal-800 bg-teal-50/10 text-[13px]">
                      {calc.finalSalary.toLocaleString()} د.ع
                    </td>
                    {!isPrintMode && (
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => onEditClick(emp)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => onDeleteClick(emp.id, emp.name)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );

    case "قسم التمريض والردهات والطواريء":
      return (
        <div className="overflow-x-auto border border-gray-150 rounded-xl bg-white shadow-sm" id="table-er-nursing">
          <table className="w-full text-right border-collapse text-xs">
            <thead className="bg-slate-50 text-gray-500 font-bold border-b border-gray-150">
              <tr>
                <th className="p-3 text-center w-16">الكود</th>
                <th className="p-3">الاسم بالكامل</th>
                <th className="p-3">المنصب</th>
                <th className="p-3 text-center">مبلغ الشفت</th>
                <th className="p-3 text-center">أيام الدوام لـ 12 ساعة</th>
                <th className="p-3 text-center">إضافات</th>
                <th className="p-3 text-center">استقطاعات</th>
                <th className="p-3 text-left font-bold text-teal-900 bg-teal-50/10">الراتب المستحق</th>
                {!isPrintMode && <th className="p-3 text-center">التحكم</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {employees.map(emp => {
                const calc = getCalculatedRow(emp);
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-3 text-center font-mono text-gray-450 font-bold">{emp.id}</td>
                    <td className="p-3 font-bold text-gray-900">{emp.name}</td>
                    <td className="p-3 text-gray-500">{emp.title}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'shiftValue11', emp.shiftValue11)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'workDays12h11', emp.workDays12h11)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'additions', emp.additions)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'deductions', emp.deductions)}</td>
                    <td className="p-3 text-left font-mono font-bold text-teal-800 bg-teal-50/10 text-[13px]">
                      {calc.finalSalary.toLocaleString()} د.ع
                    </td>
                    {!isPrintMode && (
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => onEditClick(emp)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => onDeleteClick(emp.id, emp.name)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );

    case "قسم اطباء النسائية":
      return (
        <div className="overflow-x-auto border border-gray-150 rounded-xl bg-white shadow-sm" id="table-doc-gyn">
          <table className="w-full text-right border-collapse text-xs">
            <thead className="bg-slate-50 text-gray-500 font-bold border-b border-gray-150">
              <tr>
                <th className="p-3 text-center w-16">الكود</th>
                <th className="p-3">الاسم بالكامل</th>
                <th className="p-3">المنصب</th>
                <th className="p-3 text-center">مبلغ اليوم</th>
                <th className="p-3 text-center">أيام الدوام</th>
                <th className="p-3 text-center">إضافات</th>
                <th className="p-3 text-center">استقطاعات</th>
                <th className="p-3 text-left font-bold text-teal-900 bg-teal-50/10">الراتب المستحق</th>
                {!isPrintMode && <th className="p-3 text-center">التحكم</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {employees.map(emp => {
                const calc = getCalculatedRow(emp);
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-3 text-center font-mono text-gray-450 font-bold">{emp.id}</td>
                    <td className="p-3 font-bold text-gray-900">{emp.name}</td>
                    <td className="p-3 text-gray-500">{emp.title}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'dayValue', emp.dayValue)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'workDaysCount', emp.workDaysCount)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'additions', emp.additions)}</td>
                    <td className="p-3 text-center">{renderCellInput(emp.id, 'deductions', emp.deductions)}</td>
                    <td className="p-3 text-left font-mono font-bold text-teal-800 bg-teal-50/10 text-[13px]">
                      {calc.finalSalary.toLocaleString()} د.ع
                    </td>
                    {!isPrintMode && (
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => onEditClick(emp)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => onDeleteClick(emp.id, emp.name)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );

    case "قسم الأشعة":
    case "قسم الاشعة":
      return (
        <div className="overflow-x-auto border border-gray-150 rounded-xl bg-white shadow-sm animate-fade-in" id="table-radiology font-bold">
          <table className="w-full text-right border-collapse text-xs">
            <thead className="bg-amber-50 text-amber-900 font-bold border-b border-gray-200">
              <tr>
                <th className="p-3 text-center w-16">الكود</th>
                <th className="p-3">ممثل قسم الاشعة</th>
                <th className="p-3">المنصب</th>
                <th className="p-3 text-center bg-amber-100/30">المبلغ الكلي الشهري للأشعة (مبلغ قطعي ثابث 🛑)</th>
                <th className="p-3 text-left font-bold text-amber-950 font-sans">الراتب المستحق النهائي</th>
                {!isPrintMode && <th className="p-3 text-center">التحكم</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {employees.map(emp => {
                const calc = getCalculatedRow(emp);
                return (
                   <tr key={emp.id} className="hover:bg-amber-50/10 transition-colors font-bold">
                    <td className="p-3 text-center font-mono text-amber-700">{emp.id}</td>
                    <td className="p-3">
                      {isPrintMode ? (
                        <span className="font-bold text-gray-950">{emp.name || "ممثل قسم الاشعة"}</span>
                      ) : (
                        <input
                          type="text"
                          placeholder="اسم ممثل قسم الاشعة..."
                          className="w-full max-w-xs px-2 py-1 bg-slate-50 border border-gray-200 focus:border-teal-700 outline-none rounded-lg text-xs font-bold transition-all text-gray-900"
                          value={emp.name || ''}
                          disabled={isLocked}
                          onChange={(e) => onUpdateField(emp.id, 'name', e.target.value)}
                        />
                      )}
                    </td>
                    <td className="p-3 text-gray-500 font-medium">{emp.title}</td>
                    <td className="p-3 text-center bg-amber-50/20">
                      {renderCellInput(emp.id, 'radiologyTotalSum', emp.radiologyTotalSum, "مبلغ قطعي")}
                    </td>
                    <td className="p-3 text-left font-sans font-bold text-amber-900 bg-amber-50/30 text-[13px]">
                      {calc.finalSalary.toLocaleString()} د.ع
                    </td>
                    {!isPrintMode && (
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => onEditClick(emp)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => onDeleteClick(emp.id, emp.name)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="bg-amber-50/40 p-3 text-[11px] text-amber-800 border-t border-amber-150 text-center select-none font-bold">
            💡 هذا كادر خاضع لعقود الرصيد أو المبلغ القطعي الثابت الشهري، حيث لا تُحتسب عليه خصومات أوتوماتيكية للغياب.
          </div>
        </div>
      );

    case "قسم الأمنية":
    case "قسم الامنية":
      return (
        <div className="overflow-x-auto border border-gray-150 rounded-xl bg-white shadow-sm animate-fade-in" id="table-security font-bold">
          <table className="w-full text-right border-collapse text-xs">
            <thead className="bg-amber-50 text-amber-900 border-b border-gray-205">
              <tr>
                <th className="p-3 text-center w-16">الكود</th>
                <th className="p-3">ممثل قسم الامنية</th>
                <th className="p-3">المنصب</th>
                <th className="p-3 text-center bg-amber-100/30">المبلغ الكلي الشهري للأمنية (مبلغ قطعي ثابث 🛑)</th>
                <th className="p-3 text-left font-bold text-amber-950">الراتب المستحق النهائي</th>
                {!isPrintMode && <th className="p-3 text-center">التحكم</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {employees.map(emp => {
                const calc = getCalculatedRow(emp);
                return (
                  <tr key={emp.id} className="hover:bg-amber-50/10 transition-colors font-bold5">
                    <td className="p-3 text-center font-mono text-amber-700">{emp.id}</td>
                    <td className="p-3">
                      {isPrintMode ? (
                        <span className="font-bold text-gray-950">{emp.name || "ممثل قسم الامنية"}</span>
                      ) : (
                        <input
                          type="text"
                          placeholder="اسم ممثل قسم الامنية..."
                          className="w-full max-w-xs px-2 py-1 bg-slate-50 border border-gray-200 focus:border-teal-700 outline-none rounded-lg text-xs font-bold transition-all text-gray-900"
                          value={emp.name || ''}
                          disabled={isLocked}
                          onChange={(e) => onUpdateField(emp.id, 'name', e.target.value)}
                        />
                      )}
                    </td>
                    <td className="p-3 text-gray-500">{emp.title}</td>
                    <td className="p-3 text-center bg-amber-50/20">
                      {renderCellInput(emp.id, 'securityTotalSum', emp.securityTotalSum, "مبلغ قطعي")}
                    </td>
                    <td className="p-3 text-left font-sans font-bold text-amber-900 bg-amber-50/30 text-[13px]">
                      {calc.finalSalary.toLocaleString()} د.ع
                    </td>
                    {!isPrintMode && (
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => onEditClick(emp)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => onDeleteClick(emp.id, emp.name)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="bg-amber-50/40 p-3 text-[11px] text-amber-800 border-t border-amber-150 text-center select-none font-bold">
            🛡️ كادر الحراسة والأمنية يخضع لمبلغ قطعي ثابت بمخطط الهيكلية في مستشفى الفرح المعتمد.
          </div>
        </div>
      );

    case "قسم الاسعاف":
    case "قسم الإسعاف":
      return (
        <div className="overflow-x-auto border border-gray-150 rounded-xl bg-white shadow-sm animate-fade-in" id="table-ambulance">
          <table className="w-full text-right border-collapse text-xs">
            <thead className="bg-amber-50 text-amber-900 border-b border-gray-205">
              <tr>
                <th className="p-3 text-center w-16">الكود</th>
                <th className="p-3">ممثل قسم الاسعاف</th>
                <th className="p-3">المنصب</th>
                <th className="p-3 text-center bg-amber-100/30">المبلغ الكلي لقسم الإسعاف (مبلغ قطعي ثابث 🛑)</th>
                <th className="p-3 text-left font-bold text-amber-950">الراتب المستحق النهائي</th>
                {!isPrintMode && <th className="p-3 text-center">التحكم</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {employees.map(emp => {
                const calc = getCalculatedRow(emp);
                return (
                  <tr key={emp.id} className="hover:bg-amber-50/10 transition-colors font-bold">
                    <td className="p-3 text-center font-mono text-amber-700">{emp.id}</td>
                    <td className="p-3">
                      {isPrintMode ? (
                        <span className="font-bold text-gray-950">{emp.name || "ممثل قسم الاسعاف"}</span>
                      ) : (
                        <input
                          type="text"
                          placeholder="اسم ممثل قسم الاسعاف..."
                          className="w-full max-w-xs px-2 py-1 bg-slate-50 border border-gray-200 focus:border-teal-750 outline-none rounded-lg text-xs font-bold transition-all text-gray-900"
                          value={emp.name || ''}
                          disabled={isLocked}
                          onChange={(e) => onUpdateField(emp.id, 'name', e.target.value)}
                        />
                      )}
                    </td>
                    <td className="p-3 text-gray-500">{emp.title}</td>
                    <td className="p-3 text-center bg-amber-50/20">
                      {renderCellInput(emp.id, 'ambulanceTotalSum', emp.ambulanceTotalSum, "مبلغ قطعي")}
                    </td>
                    <td className="p-3 text-left font-sans font-bold text-amber-900 bg-amber-50/30 text-[13px]">
                      {calc.finalSalary.toLocaleString()} د.ع
                    </td>
                    {!isPrintMode && (
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => onEditClick(emp)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => onDeleteClick(emp.id, emp.name)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="bg-amber-50/40 p-3 text-[11px] text-amber-800 border-t border-amber-150 text-center select-none font-bold">
            🚒 رواتب سائقي ومنسبي الإسعاف الفوري مبالغ قطعية ثابتة شهرياً.
          </div>
        </div>
      );

    default:
      return (
        <div className="p-4 text-center text-gray-400">
          <BadgeInfo className="w-8 h-8 mx-auto text-gray-300 mb-2" />
          <p>لم يتم العثور على تشكيلة مخصصة لهذا القسم.</p>
        </div>
      );
  }
}
