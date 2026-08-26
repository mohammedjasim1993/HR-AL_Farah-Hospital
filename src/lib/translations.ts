export interface TranslationDict {
  // Navigation Tabs
  dashboardTab: string;
  employeesTab: string;
  departmentsTab: string;
  printTab: string;
  archiveTab: string;
  settingsTab: string;
  
  // Hospital Title
  hospitalTitle: string;
  hospitalSubtitle: string;
  portalNotice: string;
  
  // Settings Tab Labels
  hospitalProfile: string;
  usersPermissions: string;
  languageSettings: string;
  themesVisuals: string;
  timeDateSettings: string;
  archiveBackup: string;
  logoutButton: string;
  
  // Hospital Profile Substrings
  hospitalNameLabel: string;
  hospitalAddressLabel: string;
  hospitalPhoneLabel: string;
  hospitalLogoLabel: string;
  editInfo: string;
  addInfoField: string;
  saveChanges: string;
  cancel: string;
  hospitalDetails: string;
  additionalCustomFields: string;
  fieldName: string;
  fieldValue: string;
  addNewCustomField: string;
  
  // Users & Permissions Labels
  userControlTitle: string;
  permissionsMatrix: string;
  roleLabel: string;
  systemAdminRole: string;
  adminRole: string;
  accountantRole: string;
  hrRole: string;
  dataEntryRole: string;
  labTechnicianRole: string;
  wardNurseRole: string;
  labManagerRole: string;
  labAnalystRole: string;
  labDataEntryRole: string;
  permissionRead: string;
  permissionWrite: string;
  permissionDelete: string;
  permissionPrint: string;
  addNewUser: string;
  username: string;
  password: string;
  selectRole: string;
  createLicense: string;
  authorizedAccounts: string;
  userRoleSystemAdminDesc: string;
  userRoleAdminDesc: string;
  userRoleAccountantDesc: string;
  userRoleHrDesc: string;
  userRoleDataEntryDesc: string;
  userRoleLabTechDesc: string;
  userRoleWardNurseDesc: string;
  userRoleLabManagerDesc: string;
  userRoleLabAnalystDesc: string;
  userRoleLabDataEntryDesc: string;
  
  // Themes Substrings
  themeSelectTitle: string;
  themeLight: string;
  themeLightDesc: string;
  themeDark: string;
  themeDarkDesc: string;
  themeBrand: string;
  themeBrandDesc: string;
  themeCosmic: string;
  themeCosmicDesc: string;
  themeLuxury: string;
  themeLuxuryDesc: string;
  themeGrey: string;
  themeGreyDesc: string;
  
  // Time & Date Substrings
  timeDateTitle: string;
  syncAuto: string;
  syncAutoDesc: string;
  adjustManual: string;
  adjustManualDesc: string;
  manualDate: string;
  manualTime: string;
  currentTimePreview: string;
  
  // Other Settings / backup
  backupCenterTitle: string;
  backupCenterDesc: string;
  exportBackup: string;
  importBackup: string;
  monthClosureTitle: string;
  monthClosureDesc: string;
  indexId: string;
  titleAndLabel: string;
  closeMonthButton: string;
  manualResetVariables: string;
  savedArchiveRecords: string;

  // New Localization Fields for Dashboard & Forms
  totalEmployees: string;
  totalDepartments: string;
  totalNetSalary: string;
  totalAllowances: string;
  totalDeductions: string;
  departmentsComparison: string;
  currentMonth: string;
  previousMonth: string;
  wagesTrend: string;
  employeeNameField: string;
  positionField: string;
  genderField: string;
  maleGender: string;
  femaleGender: string;
  basicSalaryField: string;
  selectDepartment: string;
  actions: string;
  addEmployee: string;
  editEmployee: string;
  currencyField: string;
  iqdCurrency: string;
  usdCurrency: string;
  saveBtn: string;
  allDepts: string;
  directPrint: string;
  printPdf: string;
  saveAsConfirm: string;
  directPrintConfirm: string;
}

export const TRANSLATIONS: Record<'ar' | 'en', TranslationDict> = {
  ar: {
    dashboardTab: "لوحة الإحصاءات والتحليلات",
    employeesTab: "شؤون الكوادر والرواتب",
    departmentsTab: "هيكلة الأقسام والتسعير",
    printTab: "كشوف البصمات والطباعة",
    archiveTab: "أرشيف رواتب الأشهر",
    settingsTab: "لوحة التحكم والإعدادات الموحدة",
    
    hospitalTitle: "مستشفى الفرح الأهلي",
    hospitalSubtitle: "Al-Farrah Private Hospital • ERP",
    portalNotice: "البوابة المحاسبية والإدارية الموحدة لرواتب الكليات والكوادر الطبية",
    
    hospitalProfile: "معلومات المستشفى (Hospital Profile)",
    usersPermissions: "إدارة المستخدمين والصلاحيات",
    languageSettings: "إعدادات اللغة (Language Settings)",
    themesVisuals: "المظهر والثيمات (Themes & Visuals)",
    timeDateSettings: "الوقت والتاريخ (Time & Date)",
    archiveBackup: "أرشفة الشهور والأمان",
    logoutButton: "تسجيل الخروج من النظام (Log Out)",
    
    hospitalNameLabel: "اسم المستشفى",
    hospitalAddressLabel: "العنوان",
    hospitalPhoneLabel: "أرقام الاتصال",
    hospitalLogoLabel: "أيقونة/شعار المستشفى",
    editInfo: "تعديل معلومات المستشفى",
    addInfoField: "إضافة معلومات إضافية",
    saveChanges: "حفظ التغييرات",
    cancel: "إلغاء",
    hospitalDetails: "تفاصيل ملف المستشفى الأساسية",
    additionalCustomFields: "الحقول التفصيلية الإضافية",
    fieldName: "اسم الحقل",
    fieldValue: "قيمة الحقل",
    addNewCustomField: "إضافة حقل مخصص جديد",
    
    userControlTitle: "لوحة إدارة الصلاحيات للمستخدمين",
    permissionsMatrix: "جدول مستويات الصلاحية لكل رتبة",
    roleLabel: "الدور الوظيفي",
    systemAdminRole: "مدير النظام",
    adminRole: "مسؤول قسم الموارد البشرية (أدمن)",
    accountantRole: "المحاسب المالي",
    hrRole: "شؤون الموظفين (HR)",
    dataEntryRole: "مدخل بيانات",
    labTechnicianRole: "عمليات (Operations)",
    wardNurseRole: "ممرض ردهة (Ward Nurse)",
    labManagerRole: "مسؤول قسم المختبر (Lab Manager)",
    labAnalystRole: "محلل (Analyst)",
    labDataEntryRole: "مدخل بيانات (Lab Data Entry)",
    permissionRead: "قراءة",
    permissionWrite: "كتابة وتعديل",
    permissionDelete: "حذف وإقصاء",
    permissionPrint: "طباعة وتقارير",
    addNewUser: "تراخيص حساب وصول جديد",
    username: "اسم المستخدم",
    password: "كلمة المرور السرية",
    selectRole: "تعيين رتبة الصلاحية الأدق",
    createLicense: "إصدار ترخيص حساب جديد",
    authorizedAccounts: "الحسابات الحائزة على تخويل حالي بالنظام",
    userRoleSystemAdminDesc: "مدير النظام وله كامل الصلاحيات للمشاهدة والتعديل والحذف في جميع الأقسام والمدخلات",
    userRoleAdminDesc: "مسؤول قسم الموارد البشرية ولديه كامل الصلاحيات للمنظومة المالية وشبكة الأقسام",
    userRoleAccountantDesc: "محاسب مخول للإدارة والطباعة والتعديل المالي دون الحذف",
    userRoleHrDesc: "موظف موارد بشرية معني بساعات الحضور وأيام الدوام فقط",
    userRoleDataEntryDesc: "مدخل بيانات ذو تراخيص مقتصرة على المشاهدة والتسجيل المباشر",
    userRoleLabTechDesc: "عمليات فنية ومخبرية متكاملة للتحاليل المخبرية وسحب العينات والمطابقة",
    userRoleWardNurseDesc: "ممرض ردهة مخول بعمليات مطابقة وسلامة أكياس الدم",
    userRoleLabManagerDesc: "مسؤول المختبر ولديه كامل صلاحيات الإدارة والفحص والتسجيل المباشر",
    userRoleLabAnalystDesc: "محلل عينات سريرية مخول بالفحوصات وإدخال وتحليل العينات",
    userRoleLabDataEntryDesc: "مدخل بيانات المختبر مخول بالتسجيل والتوثيق والمشاهدة دون الفحص الفني",
    
    themeSelectTitle: "مظهر وهوية النظام البصرية",
    themeLight: "الوضع الفاتح (Light Mode)",
    themeLightDesc: "ألوان بيضاء نقية مريحة للعين في ظروف الإضاءة الشديدة بالمكتب",
    themeDark: "الوضع الداكن (Midnight Dark)",
    themeDarkDesc: "درجات لونية سوداء وأزرق ليلي لرفع الكفاءة وتقليل إجهاد النظر",
    themeBrand: "وضع هوية المستشفى (Hospital Brand)",
    themeBrandDesc: "مظهر فريد يبرز الزمردي والتيل الفاخر للهيئة الطبية للمستشفى",
    themeCosmic: "المظهر الكوني المتوهج (Cosmic Royal)",
    themeCosmicDesc: "توليفة ساحرة من الأزرق الملكي الباذخ والبنفسجي النيوني مع خلفية داكنة تحاكي الفضاء السحيق لراحة بصرية تامة",
    themeLuxury: "الفخامة والذهب الشمباني (Luxury Gold)",
    themeLuxuryDesc: "مظهر ملكي يجمع الرمادي الفحمي العميق مع حواف وأيقونات من رداء الذهب الفاخر المبهج للنظر",
    themeGrey: "الوضع الرمادي الرصاصي (Elegant Grey)",
    themeGreyDesc: "خلفية رمادية مطفية غنية بالأناقة، صُممت بمقاييس خاصة لتوفير خطوط وعناصر ورسوم بيانية فائقة الوضوح لراحة العين والوضوح التام للشؤون الحسابية",
    
    timeDateTitle: "ضبط توقيت وساعة النظام المحاسبي",
    syncAuto: "مزامنة تلقائية مع جهاز الحاسوب",
    syncAutoDesc: "تأمين تطابق فوري مع دقيقة وساعة وموقع الحاسبة المستخدمة",
    adjustManual: "ضبط ساعة وتاريخ مخصص يدوياً",
    adjustManualDesc: "إتاحة تعديل يدوي للتاريخ لأغراض الفوترة أو الدوران التاريخي الاستثنائي",
    manualDate: "التاريخ اليدوي",
    manualTime: "الوقت اليدوي",
    currentTimePreview: "التوقيت المعالَج الآن في سجلات الدوام",
    
    backupCenterTitle: "مركز أمان البيانات والنسخ الاحتياطي",
    backupCenterDesc: "صُمم هذا النظام بأعلى معايير الحفاظ والنسخ الاحتياطي للتخزين المحلي المقاوم للخطأ.",
    exportBackup: "تصدير وتأمين قاعدة البيانات بالكامل (JSON)",
    importBackup: "استيراد قاعدة بيانات محفوظة",
    monthClosureTitle: "إغلاق وتسجيل الأرشيف الشهري (Month Closure)",
    monthClosureDesc: "ترحيل الشهر وتصفير المدخلات والشفتات الفعالة لجميع موظفي المستشفى آلياً للشهر القادم.",
    indexId: "معرف الفهرسة للأرشيف (Month ID)",
    titleAndLabel: "اللقب والاسم المعنون للشهر",
    closeMonthButton: "إغلاق وأرشفة الدورة المالية الحالية",
    manualResetVariables: "تصفير يدوي للمتغيرات فقط",
    savedArchiveRecords: "السجلات التاريخية المتوفرة بالأرشيف",

    totalEmployees: "إجمالي كادر المستشفى",
    totalDepartments: "أقسام الشعب والأجنحة",
    totalNetSalary: "صافي الرواتب والأجور النهائية",
    totalAllowances: "إجمالي المضافات والمخصصات الممنوحة",
    totalDeductions: "إجمالي الخصومات والاستقطاعات",
    departmentsComparison: "مقارنة الرواتب للأقسام بين الشهر الحالي والسابق",
    currentMonth: "الشهر الحالي",
    previousMonth: "الشهر السابق",
    wagesTrend: "تحليل وتتبع اتجاه الأجور عبر التاريخ المؤرشف",
    employeeNameField: "اسم الموظف الثلاثي الكامل",
    positionField: "العنوان التدريجي والمسمى الوظيفي",
    genderField: "الجنس البيولوجي",
    maleGender: "ذكر",
    femaleGender: "أنثى",
    basicSalaryField: "الراتب الأساسي الشهري المقر",
    selectDepartment: "تنسيب الموظف وتحديد القسم المسؤول",
    actions: "الإجراءات المتاحة",
    addEmployee: "إضافة كادر جديد بملف منفصل",
    editEmployee: "تعديل هوية وملف الموظف",
    currencyField: "العملة المعتمدة للراتب",
    iqdCurrency: "دينار عراقي (IQD)",
    usdCurrency: "دولار أمريكي (USD)",
    saveBtn: "حفظ وتثبيت البيانات",
    allDepts: "جميع أقسام المستشفى",
    directPrint: "طباعة التقرير مباشرة",
    printPdf: "طباعة كتقرير PDF",
    saveAsConfirm: "جاري حفظ وتوليد تقرير الـ PDF على جهازك، هل تود المتابعة؟",
    directPrintConfirm: "هل تود إرسال الأمر للطباعة الفورية على الطابعة الافتراضية؟"
  },
  en: {
    dashboardTab: "Analytics Dashboard",
    employeesTab: "Staff & Payroll",
    departmentsTab: "Departments & Pricing",
    printTab: "Fingerprints & Printing",
    archiveTab: "Payroll Archives",
    settingsTab: "Unified Settings",
    
    hospitalTitle: "Al-Farrah Private Hospital",
    hospitalSubtitle: "Al-Farrah Private Hospital • ERP Suite",
    portalNotice: "Central Payroll & Administration Management System",
    
    hospitalProfile: "Hospital Profile",
    usersPermissions: "Users & Permissions",
    languageSettings: "Language Settings",
    themesVisuals: "Themes & Visuals",
    timeDateSettings: "Time & Date",
    archiveBackup: "Closures & Backups",
    logoutButton: "Log Out of System",
    
    hospitalNameLabel: "Hospital Name",
    hospitalAddressLabel: "Address",
    hospitalPhoneLabel: "Contact Phone Numbers",
    hospitalLogoLabel: "Hospital Logo/Icon",
    editInfo: "Edit Hospital Profile",
    addInfoField: "Add Metadata Fields",
    saveChanges: "Save Changes",
    cancel: "Cancel",
    hospitalDetails: "Primary Hospital Details",
    additionalCustomFields: "Additional Informational Fields",
    fieldName: "Field Title",
    fieldValue: "Field Value",
    addNewCustomField: "Add New Field",
    
    userControlTitle: "User Security & Authentication",
    permissionsMatrix: "Roles Permission Matrix",
    roleLabel: "Functional Role",
    systemAdminRole: "System Administrator",
    adminRole: "Head of Human Resources (Admin)",
    accountantRole: "Financial Accountant",
    hrRole: "HR Representative (HR)",
    dataEntryRole: "Data Entry Clerk",
    labTechnicianRole: "Operations (Lab Tech)",
    wardNurseRole: "Ward Nurse",
    labManagerRole: "Laboratory Manager",
    labAnalystRole: "Laboratory Analyst",
    labDataEntryRole: "Laboratory Data Entry",
    permissionRead: "Read Only",
    permissionWrite: "Write/Edit",
    permissionDelete: "Delete/Prune",
    permissionPrint: "Export/Print",
    addNewUser: "Authorize New Access Licence",
    username: "Username / Handle",
    password: "Secure Entry Password",
    selectRole: "Specify Detailed Action Role",
    createLicense: "Issue Accounts Licence",
    authorizedAccounts: "Approved Accounts Active On Terminal",
    userRoleSystemAdminDesc: "System Administrator with full access to view, edit, and delete in all departments and entries.",
    userRoleAdminDesc: "Head of Human Resources with full administrative & financial clearance across networks.",
    userRoleAccountantDesc: "Authorize printing, financial editing, but restricted from structural deletion.",
    userRoleHrDesc: "Human resources clearance to monitor working hours, attendance logs.",
    userRoleDataEntryDesc: "Restricted viewer accounts, direct attendance input only.",
    userRoleLabTechDesc: "Laboratory operations specialist authorized for drawing and testing samples.",
    userRoleWardNurseDesc: "Ward nurse authorized for blood bag cross-matching and safety.",
    userRoleLabManagerDesc: "Laboratory manager with full control over management, testing, and logs.",
    userRoleLabAnalystDesc: "Clinical analyst authorized for diagnostic tests and sample analyses.",
    userRoleLabDataEntryDesc: "Lab data entry clerk authorized for registration, documentation, and viewing.",
    
    themeSelectTitle: "Visual Theme & Environment Profile",
    themeLight: "Comfort Light Mode",
    themeLightDesc: "Polished pristine white tones curated for desk work under intense lighting",
    themeDark: "Midnight Velvet Dark",
    themeDarkDesc: "Slate-dark hues engineered to reduce visual fatigue during nocturnals",
    themeBrand: "Clinical Brand Emerald",
    themeBrandDesc: "Distinctive luxury teal & emerald graphics that reflect the clinical signature",
    themeCosmic: "Cosmic Royal Neon",
    themeCosmicDesc: "An immersive deep space experience blending royal velvet indigo, violet nebulae, and glowing modern borders",
    themeLuxury: "Luxury Champagne Gold",
    themeLuxuryDesc: "A sovereign executive setting blending deep charcoal slate canvas beautifully contoured with gold outlines",
    themeGrey: "Elegant Slate Grey",
    themeGreyDesc: "Soothing matte grey background specifically optimized with ultra-crisp fonts, grids, and charts to prevent any dynamic text or drawing overlaps",
    
    timeDateTitle: "Audit Clock & Chronology Synchronization",
    syncAuto: "Automatic PC Clock Synchronization",
    syncAutoDesc: "Enforce instantaneous synchronization with the host machine's active time",
    adjustManual: "Manual Clock Overwrite",
    adjustManualDesc: "Allows overriding the active ledger timestamp for retrospective retro billing and historical entries",
    manualDate: "Manual Date Selection",
    manualTime: "Manual Hour Selection",
    currentTimePreview: "Ledger Timestamp Currently Intercepted",
    
    backupCenterTitle: "Data Resilience & Encrypted Backups",
    backupCenterDesc: "Engineered with failsafe high-fidelity JSON exports to protect clinical ledgers.",
    exportBackup: "Export Full Database Ledger (JSON)",
    importBackup: "Restore Verified Database Archive",
    monthClosureTitle: "Month Roll Closure & Archival System",
    monthClosureDesc: "Archives snapshot of current payroll and zero-initiates the scheduler for next month.",
    indexId: "Index Identifier (Month ID)",
    titleAndLabel: "Title Heading/Desc",
    closeMonthButton: "Complete and Lock Current Cycle",
    manualResetVariables: "Manual Reset Vars Only",
    savedArchiveRecords: "Safeguarded Historically Archived Paybooks",

    totalEmployees: "Total Hospital Roster",
    totalDepartments: "Active Hospital Departments",
    totalNetSalary: "Net Paid Salaries",
    totalAllowances: "Total Allowances Allocated",
    totalDeductions: "Total Deductions Formulated",
    departmentsComparison: "Departmental Salary Breakdown (Current vs Previous)",
    currentMonth: "Current Month",
    previousMonth: "Previous Month",
    wagesTrend: "Archived Payroll Cost Trend over Months",
    employeeNameField: "Full Staff Name (Triple)",
    positionField: "Clinical or Administration Position",
    genderField: "Gender Identity",
    maleGender: "Male",
    femaleGender: "Female",
    basicSalaryField: "Approved Monthly Basic Salary",
    selectDepartment: "Assign To Department Ward",
    actions: "Actions",
    addEmployee: "Register New Hospital Staff Entry",
    editEmployee: "Edit Registered Staff Details",
    currencyField: "Salary Currency",
    iqdCurrency: "Iraqi Dinar (IQD)",
    usdCurrency: "US Dollar (USD)",
    saveBtn: "Save Roster Card",
    allDepts: "All Specialized Departments",
    directPrint: "Direct Print",
    printPdf: "Export to PDF Document",
    saveAsConfirm: "Generating and saving PDF file on your computer, continue?",
    directPrintConfirm: "Do you want to send this report to your local default printer right now?"
  }
};

// Global formatters using active language and active currency setting
export function formatCurrency(amount: number, lang: 'ar' | 'en', currency: 'IQD' | 'USD' = 'IQD'): string {
  const roundedAmount = Math.round(typeof amount === 'number' && !isNaN(amount) ? amount : 0);
  
  if (currency === 'USD') {
    if (lang === 'ar') {
      return `${roundedAmount.toLocaleString('en-US')} $`;
    } else {
      return `$${roundedAmount.toLocaleString('en-US')}`;
    }
  } else { // 'IQD'
    if (lang === 'ar') {
      return `${roundedAmount.toLocaleString('en-US')} د.ع`;
    } else {
      return `${roundedAmount.toLocaleString('en-US')} IQD`;
    }
  }
}

export function formatNumber(val: number, _lang?: 'ar' | 'en'): string {
  const num = typeof val === 'number' && !isNaN(val) ? val : 0;
  return num.toLocaleString('en-US');
}

export function getNextEmployeeCode(employees: { employeeCode?: string }[]): string {
  if (!employees || employees.length === 0) {
    return 'EMP-1001';
  }

  let maxNum = 0;
  let detectedPrefix = 'EMP-';
  let isPureNumber = false;

  employees.forEach((emp) => {
    const code = (emp.employeeCode || '').trim();
    if (!code) return;

    const match = code.match(/^(.*?)([0-9]+)$/);
    if (match) {
      const prefix = match[1];
      const numStr = match[2];
      const num = parseInt(numStr, 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
        detectedPrefix = prefix;
        isPureNumber = !prefix;
      }
    }
  });

  if (maxNum === 0) {
    return 'EMP-1001';
  }

  const nextNum = maxNum + 1;

  if (isPureNumber) {
    return `${nextNum}`;
  }

  if (detectedPrefix) {
    return `${detectedPrefix}${nextNum}`;
  }

  return `EMP-${nextNum}`;
}

export function getSystemDate(timeSettings: { autoSync: boolean; manualDate: string; manualTime: string }): Date {
  if (timeSettings.autoSync) {
    return new Date();
  }
  try {
    const [year, month, day] = timeSettings.manualDate.split('-').map(Number);
    const [hour, minute] = timeSettings.manualTime.split(':').map(Number);
    return new Date(year, month - 1, day, hour, minute, 0);
  } catch (err) {
    console.warn("Error parsing manual system date, falling back to current machine time:", err);
    return new Date();
  }
}

