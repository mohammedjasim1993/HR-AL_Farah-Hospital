import React, { useState, useEffect } from 'react';
import { Plus, Check, X } from 'lucide-react';

export const DEFAULT_JOB_TITLES: string[] = [
  'مدير المستشفى',
  'مدير الادارة',
  'مدير قسم الشبكات',
  'موظف شبكات',
  'مدير قسم الحسابات',
  'محاسب',
  'أمين صندوق',
  'كاشير',
  'مدير المخزن',
  'مدير قسم الاحصاء',
  'موظف احصاء',
  'مدير قسم الاستعلامات',
  'موظف استعلامات',
  'مدير قسم الخدمات',
  'موظف خدمات',
  'مدير قسم العمليات',
  'وكيل مدير قسم العمليات',
  'مدخل بيانات',
  'مساعد تخدير',
  'مساعد جراح',
  'مدير قسم الصيدلية',
  'صيدلاني',
  'مدير قسم المختبر ومصرف الدم',
  'محلل',
  'قابلة',
  'طبيبة نسائي',
  'طبيب تخدير',
  'تمريض خدج',
  'مدير قسم السونار',
  'طبيب سونار',
  'طبيب مقيم',
  'مدير قسم الاطباء المقيمين',
  'طبيب طواريء',
  'معين'
];

export function getStoredJobTitles(): string[] {
  try {
    const saved = localStorage.getItem('alfarrah_custom_job_titles');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return Array.from(new Set([...DEFAULT_JOB_TITLES, ...parsed]));
      }
    }
  } catch (e) {
    console.error('Error reading stored job titles:', e);
  }
  return DEFAULT_JOB_TITLES;
}

export function saveCustomJobTitle(newTitle: string): string[] {
  const trimmed = newTitle.trim();
  if (!trimmed) return getStoredJobTitles();
  
  const currentList = getStoredJobTitles();
  if (!currentList.includes(trimmed)) {
    const updated = [...currentList, trimmed];
    try {
      const customOnly = updated.filter(t => !DEFAULT_JOB_TITLES.includes(t));
      localStorage.setItem('alfarrah_custom_job_titles', JSON.stringify(customOnly));
    } catch (e) {
      console.error('Error saving custom job title:', e);
    }
    return updated;
  }
  return currentList;
}

interface JobTitleSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export default function JobTitleSelect({
  value,
  onChange,
  className = 'w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white',
  placeholder = 'اختر العنوان الوظيفي...'
}: JobTitleSelectProps) {
  const [titles, setTitles] = useState<string[]>(getStoredJobTitles());
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [customTitleInput, setCustomTitleInput] = useState('');

  useEffect(() => {
    setTitles(getStoredJobTitles());
  }, []);

  // Ensure current value is included in list if non-empty
  const allTitles = React.useMemo(() => {
    const set = new Set(titles);
    if (value && value.trim() && !set.has(value.trim())) {
      set.add(value.trim());
    }
    return Array.from(set);
  }, [titles, value]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__ADD_NEW__') {
      setIsAddingNew(true);
      setCustomTitleInput('');
    } else {
      setIsAddingNew(false);
      onChange(val);
    }
  };

  const handleSaveCustomTitle = () => {
    const trimmed = customTitleInput.trim();
    if (trimmed) {
      const updatedList = saveCustomJobTitle(trimmed);
      setTitles(updatedList);
      onChange(trimmed);
      setIsAddingNew(false);
      setCustomTitleInput('');
    }
  };

  if (isAddingNew) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={customTitleInput}
            onChange={e => setCustomTitleInput(e.target.value)}
            placeholder="اكتب المسمى الوظيفي الجديد..."
            autoFocus
            className={`${className} flex-1`}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveCustomTitle();
              }
            }}
          />
          <button
            type="button"
            onClick={handleSaveCustomTitle}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center shrink-0 transition-colors shadow"
            title="حفظ المسمى"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsAddingNew(false)}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold flex items-center justify-center shrink-0 transition-colors"
            title="إلغاء"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-emerald-400 font-medium">
          سيتم حفظ هذا المسمى وإضافته لقائمة الخيارات الدائمة تلقائياً
        </p>
      </div>
    );
  }

  return (
    <select
      value={value || ''}
      onChange={handleSelectChange}
      className={className}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {allTitles.map((title) => (
        <option key={title} value={title}>
          {title}
        </option>
      ))}
      <option value="__ADD_NEW__" className="text-emerald-400 font-bold bg-slate-900">
        + إضافة مسمى وظيفي جديد...
      </option>
    </select>
  );
}
