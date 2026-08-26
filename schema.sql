-- =========================================================================
--  نظام رواتب وأجور مستشفى الفرح الأهلي الموحد (Al-Farrah Private Hospital)
--  كود الـ SQL الكامل لإنشاء وإعداد وتغذية قاعدة البيانات من الصفر
--  (Microsoft SQL Server / standard SQL Database Schema)
-- =========================================================================

-- 1. إنشاء قاعدة البيانات (في حال عدم وجودها وتحديد ترميز يدعم اللغة العربية بشكل مثالي)
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'AlFarrahHospitalDB')
BEGIN
    CREATE DATABASE AlFarrahHospitalDB
    COLLATE Arabic_CI_AI; -- ترميز يدعم اللغة العربية والبحث غير الحساس للتشكيل والحروف
END;
GO

USE AlFarrahHospitalDB;
GO

-- =========================================================================
-- 2. جدول الأقسام (Hospital_Departments)
-- =========================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Hospital_Departments')
BEGIN
    CREATE TABLE Hospital_Departments (
        id VARCHAR(100) PRIMARY KEY,                         -- المعرف الفريد للقسم
        name NVARCHAR(255) NOT NULL,                         -- اسم القسم (باللغة العربية/الإنجليزية)
        budgetLimit FLOAT DEFAULT 0,                        -- الحد الأقصى لميزانية القسم
        salaryStructureType VARCHAR(100) DEFAULT 'variable',-- نوع هيكلية الرواتب (ثابت، متغير، مقطوع، ساعات...)
        salaryType VARCHAR(100) DEFAULT 'variable',         -- تفصيل نوع الراتب
        fixedSalary FLOAT DEFAULT 0,                        -- قيمة الراتب الثابت للقسم (إن وجد)
        lumpSumSalary FLOAT DEFAULT 0,                      -- الراتب المقطوع الكلي للقسم
        lumpSumRepresentative NVARCHAR(255) NULL,           -- اسم ممثل القسم المقطوع
        shiftsCount INT DEFAULT 4,                          -- عدد الشفتات الافتراضية للقسم
        workingDays FLOAT DEFAULT 0,                        -- عدد أيام العمل الافتراضية
        dayPrice FLOAT DEFAULT 0,                           -- سعر اليوم الافتراضي
        hourPrice FLOAT DEFAULT 0,                          -- سعر الساعة الافتراضي
        shiftMorning FLOAT DEFAULT 0,                       -- سعر الشفت الصباحي
        shiftEvening FLOAT DEFAULT 0,                       -- سعر الشفت المسائي
        shiftFull24 FLOAT DEFAULT 0,                        -- سعر شفت 24 ساعة كاملة
        shiftHalf12 FLOAT DEFAULT 0,                        -- سعر شفت 12 ساعة نصف يوم
        shiftKhafar FLOAT DEFAULT 0,                        -- سعر شفت الخفر
        workingHours FLOAT DEFAULT 0,                       -- ساعات العمل الافتراضية
        callouts FLOAT DEFAULT 0,                           -- قيمة الاستدعاءات الافتراضية
        enabledFields NVARCHAR(MAX) DEFAULT '{}'            -- الكولومات المفعلة بالقسم (بصيغة JSON)
    );
    
    -- إضافة كشافات لتحسين أداء عمليات البحث والتصفية
    CREATE INDEX IX_Hospital_Departments_Name ON Hospital_Departments(name);
END;
GO

-- =========================================================================
-- 3. جدول الموظفين المنتسبين الكلي (Hospital_Employees)
-- =========================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Hospital_Employees')
BEGIN
    CREATE TABLE Hospital_Employees (
        id VARCHAR(100) PRIMARY KEY,                         -- المعرف الفريد للمنتسب
        name NVARCHAR(255) NOT NULL,                         -- الاسم الكامل للمنتسب
        position NVARCHAR(255) NULL,                         -- العنوان أو المسمى الوظيفي
        departmentId VARCHAR(100) NULL,                      -- كود القسم التابع له (مرتبط بجدول الأقسام)
        phone NVARCHAR(100) NULL,                            -- رقم الهاتف للتواصل
        startDate NVARCHAR(100) NULL,                        -- تاريخ مباشرة العمل
        basicSalary FLOAT DEFAULT 0,                        -- الراتب الأساسي/الاسمي
        workingDays FLOAT DEFAULT 0,                        -- أيام العمل لهذا الشهر
        dayPrice FLOAT DEFAULT 0,                           -- سعر اليوم الفردي للموظف
        hourPrice FLOAT DEFAULT 0,                          -- سعر العمل الإضافي/ساعة
        shiftMorning FLOAT DEFAULT 0,                       -- قيمة شفت الصباح للموظف
        shiftEvening FLOAT DEFAULT 0,                       -- قيمة شفت المساء للموظف
        shiftFull24 FLOAT DEFAULT 0,                        -- قيمة شفت الـ 24 ساعة
        shiftHalf12 FLOAT DEFAULT 0,                        -- قيمة شفت الـ 12 ساعة
        shiftKhafar FLOAT DEFAULT 0,                        -- قيمة شفت الخفر الخاص
        workingHours FLOAT DEFAULT 0,                       -- عدد ساعات العمل الإضافية
        callouts FLOAT DEFAULT 0,                           -- الاستدعاءات المباشرة
        allowanceExtraDays FLOAT DEFAULT 0,                 -- مخصصات الأيام الإضافية للراتب
        allowanceExtraHours FLOAT DEFAULT 0,                -- مخصصات الساعات الإضافية للراتب
        deductionDays FLOAT DEFAULT 0,                      -- استقطاعات الغيابات بالأيام
        deductionHours FLOAT DEFAULT 0,                     -- استقطاعات الساعات المتأخرة
        notes NVARCHAR(MAX) NULL,                           -- ملاحظات محاسبية وإدارية
        isActive BIT DEFAULT 1,                             -- حالة الموظف (1 مفعّل، 0 غير نشط / مستقيل)
        CONSTRAINT FK_Hospital_Employees_Department FOREIGN KEY (departmentId) 
            REFERENCES Hospital_Departments(id) ON DELETE SET NULL
    );

    -- إضافة كشافات سرعة البحث
    CREATE INDEX IX_Hospital_Employees_Name ON Hospital_Employees(name);
    CREATE INDEX IX_Hospital_Employees_Dept ON Hospital_Employees(departmentId);
    CREATE INDEX IX_Hospital_Employees_Active ON Hospital_Employees(isActive);
END;
GO

-- =========================================================================
-- 4. جدول أرشيف الرواتب الشهري لجميع السنوات (Hospital_Archive)
-- =========================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Hospital_Archive')
BEGIN
    CREATE TABLE Hospital_Archive (
        id VARCHAR(100) PRIMARY KEY,                         -- كود الأرشيف الفريد (عادة يدمج معرف الشهر مع السنة والموظف)
        employeeId VARCHAR(100) NOT NULL,                    -- كود المنتسب المؤرشف
        employeeName NVARCHAR(255) NOT NULL,                 -- اسم المنتسب وقت الأرشفة
        departmentId VARCHAR(100) NULL,                      -- معرف القسم وقت الأرشفة
        departmentName NVARCHAR(255) NULL,                   -- اسم القسم وقت الأرشفة
        archivedAt NVARCHAR(100) NOT NULL,                   -- تاريخ شهر الأرشفة (مثال: '2026-05')
        payrollData NVARCHAR(MAX) NOT NULL                   -- لقطة كاملة لجميع الحسابات وتفاصيل الاستحقاقات (بصيغة JSON)
    );

    -- كشافات تحسين الاستعلامات والتقارير المالية والأرشفة
    CREATE INDEX IX_Hospital_Archive_Employee ON Hospital_Archive(employeeId);
    CREATE INDEX IX_Hospital_Archive_Month ON Hospital_Archive(archivedAt);
    CREATE INDEX IX_Hospital_Archive_Dept ON Hospital_Archive(departmentId);
END;
GO

-- =========================================================================
-- 5. جدول إعدادات النظام وتصاريح المستخدمين العامة (Hospital_Settings)
-- =========================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Hospital_Settings')
BEGIN
    CREATE TABLE Hospital_Settings (
        settings_key VARCHAR(100) PRIMARY KEY,               -- مفتاح الإعداد (Settings Key)
        settings_value NVARCHAR(MAX) NOT NULL                -- تفاصيل القيمة المحفوظة (بصيغة JSON أو نصية ثابتة)
    );
END;
GO


-- =========================================================================
-- 6. تغذية إعدادات النظام الافتراضية ومصفوفات الأمان والمستخدمين الأساسيين
-- =========================================================================

-- تغذية مستخدمي النظام الافتراضيين (SuperAdmin, Accountant, HR..)
-- كلمة المرور للمهندس محمد: 'mohammed_farrah'
-- كلمة المرور للمدير الافتراضي: 'admin123'
MERGE Hospital_Settings AS target
USING (SELECT 'users' AS skey, N'[
  {
    "id": "usr-engineer",
    "username": "07836885808",
    "password": "mohammed_farrah",
    "role": "SuperAdmin"
  },
  {
    "id": "usr-1",
    "username": "admin",
    "password": "admin123",
    "role": "SuperAdmin"
  },
  {
    "id": "usr-2",
    "username": "data",
    "password": "data123",
    "role": "DataEntry"
  }
]' AS sval) AS source
ON (target.settings_key = source.skey)
WHEN NOT MATCHED THEN
    INSERT (settings_key, settings_value) VALUES (source.skey, source.sval);
GO

-- تغذية بروفايل المستشفى المالي واللوغو الافتراضي لطباعة التقارير الرسمية
MERGE Hospital_Settings AS target
USING (SELECT 'hospitalProfile' AS skey, N'{
  "nameAr": "مستشفى الفرح الأهلي",
  "nameEn": "Al-Farrah Private Hospital",
  "logo": "HeartPulse",
  "addressAr": "العراق، البصرة",
  "addressEn": "Basra, Iraq",
  "phone": "07836885808",
  "customFields": []
}' AS sval) AS source
ON (target.settings_key = source.skey)
WHEN NOT MATCHED THEN
    INSERT (settings_key, settings_value) VALUES (source.skey, source.sval);
GO

-- تغذية مصفوفة تصاريح الإدخال والوظائف والشاشات لمختلف الأدوار في المستشفى
MERGE Hospital_Settings AS target
USING (SELECT 'permissionsMatrix' AS skey, N'{
  "SuperAdmin": { "read": true, "write": true, "delete": true, "print": true },
  "Accountant": { "read": true, "write": true, "delete": false, "print": true },
  "HR": { "read": true, "write": true, "delete": false, "print": true },
  "DataEntry": { "read": true, "write": false, "delete": false, "print": false }
}' AS sval) AS source
ON (target.settings_key = source.skey)
WHEN NOT MATCHED THEN
    INSERT (settings_key, settings_value) VALUES (source.skey, source.sval);
GO

-- تغذية إعدادات الوقت والنسخ المالي الاحتياطي الافتراضي
MERGE Hospital_Settings AS target
USING (SELECT 'timeSettings' AS skey, N'{
  "autoSync": true,
  "manualDate": "2026-05-29",
  "manualTime": "10:54"
}' AS sval) AS source
ON (target.settings_key = source.skey)
WHEN NOT MATCHED THEN
    INSERT (settings_key, settings_value) VALUES (source.skey, source.sval);
GO

-- =========================================================================
-- تم إعداد قاعدة البيانات وتهيئتها للعمل بالكامل مع محرك التطبيق بنجاح.
-- =========================================================================
