-- =========================================================================================
--  نظام إدارة ورواتب وأجور ومختبرات ومصرف دم مستشفى الفرح الأهلي (Al-Farrah Private Hospital)
--  الملف الشامل الموحد لجميع أكواد وقواعد بيانات النظام مع كل التحديثات (ALL_SYSTEM_DATABASE_CODES.sql)
--  تاريخ التحديث الأخير: 2026
--  إعداد المهندس: محمد جاسم محمد ابراهيم (الهاتف: 07836885808)
-- =========================================================================================
--  طريقة الاستخدام:
--  1. افتح برنامج Microsoft SQL Server Management Studio (SSMS).
--  2. انسخ كامل هذا الكود والصقه في نافذة استعلام جديدة (New Query).
--  3. اضغط على زر (Execute) أو F5.
--  4. سيقوم الكود بإنشاء قاعدة البيانات وكافة الجداول والفهارس والحسابات تلقائياً،
--     وكذلك تطبيق كافة التحديثات والترقيات في حال كانت الجداول موجودة مسبقاً دون أي أخطاء.
-- =========================================================================================

-- 1. إنشاء قاعدة البيانات مع دعم ترميز اللغة العربية
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'hr_farah_db')
BEGIN
    CREATE DATABASE hr_farah_db
    COLLATE Arabic_CI_AI;
    PRINT '>> تم إنشاء قاعدة البيانات hr_farah_db بنجاح.';
END
GO

USE hr_farah_db;
GO

BEGIN TRANSACTION;
BEGIN TRY

    -- =========================================================================================
    -- 2. جدول الأقسام (Hospital_Departments)
    -- =========================================================================================
    IF OBJECT_ID('dbo.Hospital_Departments', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Hospital_Departments (
            id VARCHAR(100) NOT NULL PRIMARY KEY,
            name NVARCHAR(255) NOT NULL,
            budgetLimit FLOAT DEFAULT 0,
            salaryStructureType VARCHAR(100) DEFAULT 'variable',
            salaryType VARCHAR(100) DEFAULT 'variable',
            fixedSalary FLOAT DEFAULT 0,
            lumpSumSalary FLOAT DEFAULT 0,
            lumpSumRepresentative NVARCHAR(255) NULL,
            shiftsCount INT DEFAULT 4,
            workingDays FLOAT DEFAULT 0,
            dayPrice FLOAT DEFAULT 0,
            hourPrice FLOAT DEFAULT 0,
            shiftMorning FLOAT DEFAULT 0,
            shiftEvening FLOAT DEFAULT 0,
            shiftFull24 FLOAT DEFAULT 0,
            shiftHalf12 FLOAT DEFAULT 0,
            shiftKhafar FLOAT DEFAULT 0,
            workingHours FLOAT DEFAULT 0,
            callouts FLOAT DEFAULT 0,
            enabledFields NVARCHAR(MAX) DEFAULT '{}'
        );
        PRINT '>> تم إنشاء جدول الأقسام dbo.Hospital_Departments';
    END;

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Hospital_Departments_Name' AND object_id = OBJECT_ID('dbo.Hospital_Departments'))
    BEGIN
        CREATE INDEX IX_Hospital_Departments_Name ON dbo.Hospital_Departments(name);
    END;

    -- =========================================================================================
    -- 3. جدول الموظفين والكوادر الطبية والإدارية (Hospital_Employees)
    -- =========================================================================================
    IF OBJECT_ID('dbo.Hospital_Employees', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Hospital_Employees (
            id VARCHAR(100) NOT NULL PRIMARY KEY,
            name NVARCHAR(255) NOT NULL,
            position NVARCHAR(255) NULL,
            departmentId VARCHAR(100) NULL,
            phone NVARCHAR(100) NULL,
            startDate NVARCHAR(100) NULL,
            basicSalary FLOAT DEFAULT 0,
            workingDays FLOAT DEFAULT 0,
            dayPrice FLOAT DEFAULT 0,
            hourPrice FLOAT DEFAULT 0,
            shiftMorning FLOAT DEFAULT 0,
            shiftEvening FLOAT DEFAULT 0,
            shiftFull24 FLOAT DEFAULT 0,
            shiftHalf12 FLOAT DEFAULT 0,
            shiftKhafar FLOAT DEFAULT 0,
            workingHours FLOAT DEFAULT 0,
            callouts FLOAT DEFAULT 0,
            allowanceExtraDays FLOAT DEFAULT 0,
            allowanceExtraHours FLOAT DEFAULT 0,
            deductionDays FLOAT DEFAULT 0,
            deductionHours FLOAT DEFAULT 0,
            notes NVARCHAR(MAX) NULL,
            isActive BIT DEFAULT 1,
            RoleID NVARCHAR(100) NULL,
            previousMonthAbsent FLOAT DEFAULT 0,
            hasCustomShift BIT DEFAULT 0,
            customStart VARCHAR(50) NULL,
            customEnd VARCHAR(50) NULL,
            customShiftType VARCHAR(50) NULL,
            customShiftSystemOption VARCHAR(50) NULL,
            isManager BIT DEFAULT 0,
            pricingOverride NVARCHAR(MAX) NULL,
            CONSTRAINT FK_Hospital_Employees_Department FOREIGN KEY (departmentId) 
                REFERENCES dbo.Hospital_Departments(id) ON DELETE SET NULL
        );
        PRINT '>> تم إنشاء جدول الموظفين dbo.Hospital_Employees';
    END
    ELSE
    BEGIN
        -- إضافة أي أعمدة إضافية إن لم تكن موجودة
        IF COL_LENGTH('dbo.Hospital_Employees', 'RoleID') IS NULL
            ALTER TABLE dbo.Hospital_Employees ADD RoleID NVARCHAR(100) NULL;
        IF COL_LENGTH('dbo.Hospital_Employees', 'isActive') IS NULL
            ALTER TABLE dbo.Hospital_Employees ADD isActive BIT DEFAULT 1;
        IF COL_LENGTH('dbo.Hospital_Employees', 'previousMonthAbsent') IS NULL
            ALTER TABLE dbo.Hospital_Employees ADD previousMonthAbsent FLOAT DEFAULT 0;
        IF COL_LENGTH('dbo.Hospital_Employees', 'hasCustomShift') IS NULL
            ALTER TABLE dbo.Hospital_Employees ADD hasCustomShift BIT DEFAULT 0;
        IF COL_LENGTH('dbo.Hospital_Employees', 'customStart') IS NULL
            ALTER TABLE dbo.Hospital_Employees ADD customStart VARCHAR(50) NULL;
        IF COL_LENGTH('dbo.Hospital_Employees', 'customEnd') IS NULL
            ALTER TABLE dbo.Hospital_Employees ADD customEnd VARCHAR(50) NULL;
        IF COL_LENGTH('dbo.Hospital_Employees', 'customShiftType') IS NULL
            ALTER TABLE dbo.Hospital_Employees ADD customShiftType VARCHAR(50) NULL;
        IF COL_LENGTH('dbo.Hospital_Employees', 'customShiftSystemOption') IS NULL
            ALTER TABLE dbo.Hospital_Employees ADD customShiftSystemOption VARCHAR(50) NULL;
        IF COL_LENGTH('dbo.Hospital_Employees', 'isManager') IS NULL
            ALTER TABLE dbo.Hospital_Employees ADD isManager BIT DEFAULT 0;
        IF COL_LENGTH('dbo.Hospital_Employees', 'pricingOverride') IS NULL
            ALTER TABLE dbo.Hospital_Employees ADD pricingOverride NVARCHAR(MAX) NULL;
    END;

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Hospital_Employees_Name' AND object_id = OBJECT_ID('dbo.Hospital_Employees'))
        CREATE INDEX IX_Hospital_Employees_Name ON dbo.Hospital_Employees(name);
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Hospital_Employees_Dept' AND object_id = OBJECT_ID('dbo.Hospital_Employees'))
        CREATE INDEX IX_Hospital_Employees_Dept ON dbo.Hospital_Employees(departmentId);
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Hospital_Employees_Active' AND object_id = OBJECT_ID('dbo.Hospital_Employees'))
        CREATE INDEX IX_Hospital_Employees_Active ON dbo.Hospital_Employees(isActive);

    -- =========================================================================================
    -- 4. جدول أرشيف الرواتب الشهري (Hospital_Archive)
    -- =========================================================================================
    IF OBJECT_ID('dbo.Hospital_Archive', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Hospital_Archive (
            id VARCHAR(100) NOT NULL PRIMARY KEY,
            employeeId VARCHAR(100) NULL,
            employeeName NVARCHAR(255) NULL,
            departmentId VARCHAR(100) NULL,
            departmentName NVARCHAR(255) NULL,
            archivedAt NVARCHAR(100) NULL,
            payrollData NVARCHAR(MAX) NULL,
            month VARCHAR(50) NULL,
            year INT NULL,
            data NVARCHAR(MAX) NULL,
            timestamp BIGINT NULL,
            finalApproved BIT DEFAULT 0,
            approvedBy NVARCHAR(255) NULL,
            approvalDate NVARCHAR(100) NULL
        );
        PRINT '>> تم إنشاء جدول أرشيف الرواتب dbo.Hospital_Archive';
    END
    ELSE
    BEGIN
        -- ضمان وجود كافة الأعمدة لكلا النسختين القديمة والجديدة
        IF COL_LENGTH('dbo.Hospital_Archive', 'employeeId') IS NULL
            ALTER TABLE dbo.Hospital_Archive ADD employeeId VARCHAR(100) NULL;
        IF COL_LENGTH('dbo.Hospital_Archive', 'employeeName') IS NULL
            ALTER TABLE dbo.Hospital_Archive ADD employeeName NVARCHAR(255) NULL;
        IF COL_LENGTH('dbo.Hospital_Archive', 'departmentId') IS NULL
            ALTER TABLE dbo.Hospital_Archive ADD departmentId VARCHAR(100) NULL;
        IF COL_LENGTH('dbo.Hospital_Archive', 'departmentName') IS NULL
            ALTER TABLE dbo.Hospital_Archive ADD departmentName NVARCHAR(255) NULL;
        IF COL_LENGTH('dbo.Hospital_Archive', 'archivedAt') IS NULL
            ALTER TABLE dbo.Hospital_Archive ADD archivedAt NVARCHAR(100) NULL;
        IF COL_LENGTH('dbo.Hospital_Archive', 'payrollData') IS NULL
            ALTER TABLE dbo.Hospital_Archive ADD payrollData NVARCHAR(MAX) NULL;
        IF COL_LENGTH('dbo.Hospital_Archive', 'month') IS NULL
            ALTER TABLE dbo.Hospital_Archive ADD month VARCHAR(50) NULL;
        IF COL_LENGTH('dbo.Hospital_Archive', 'year') IS NULL
            ALTER TABLE dbo.Hospital_Archive ADD year INT NULL;
        IF COL_LENGTH('dbo.Hospital_Archive', 'data') IS NULL
            ALTER TABLE dbo.Hospital_Archive ADD data NVARCHAR(MAX) NULL;
        IF COL_LENGTH('dbo.Hospital_Archive', 'timestamp') IS NULL
            ALTER TABLE dbo.Hospital_Archive ADD timestamp BIGINT NULL;
        IF COL_LENGTH('dbo.Hospital_Archive', 'finalApproved') IS NULL
            ALTER TABLE dbo.Hospital_Archive ADD finalApproved BIT DEFAULT 0;
        IF COL_LENGTH('dbo.Hospital_Archive', 'approvedBy') IS NULL
            ALTER TABLE dbo.Hospital_Archive ADD approvedBy NVARCHAR(255) NULL;
        IF COL_LENGTH('dbo.Hospital_Archive', 'approvalDate') IS NULL
            ALTER TABLE dbo.Hospital_Archive ADD approvalDate NVARCHAR(100) NULL;
    END;

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Hospital_Archive_Dept' AND object_id = OBJECT_ID('dbo.Hospital_Archive'))
        CREATE INDEX IX_Hospital_Archive_Dept ON dbo.Hospital_Archive(departmentId);
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Hospital_Archive_Employee' AND object_id = OBJECT_ID('dbo.Hospital_Archive'))
        CREATE INDEX IX_Hospital_Archive_Employee ON dbo.Hospital_Archive(employeeId);

    -- =========================================================================================
    -- 5. جدول السلف المالية والعهد (Hospital_Custodies)
    -- =========================================================================================
    IF OBJECT_ID('dbo.Hospital_Custodies', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Hospital_Custodies (
            id VARCHAR(100) NOT NULL PRIMARY KEY,
            employeeId VARCHAR(100) NOT NULL,
            amount FLOAT NOT NULL,
            date VARCHAR(50) NOT NULL,
            reason NVARCHAR(MAX) NULL,
            status VARCHAR(50) DEFAULT 'unpaid',
            CONSTRAINT FK_Hospital_Custodies_Employee FOREIGN KEY (employeeId) 
                REFERENCES dbo.Hospital_Employees(id) ON DELETE CASCADE
        );
        PRINT '>> تم إنشاء جدول السلف dbo.Hospital_Custodies';
    END;

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Hospital_Custodies_Emp' AND object_id = OBJECT_ID('dbo.Hospital_Custodies'))
        CREATE INDEX IX_Hospital_Custodies_Emp ON dbo.Hospital_Custodies(employeeId);

    -- =========================================================================================
    -- 6. جدول إعدادات النظام والمستخدمين (Hospital_Settings)
    -- =========================================================================================
    IF OBJECT_ID('dbo.Hospital_Settings', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Hospital_Settings (
            settings_key VARCHAR(100) NOT NULL PRIMARY KEY,
            settings_value NVARCHAR(MAX) NOT NULL
        );
        PRINT '>> تم إنشاء جدول إعدادات النظام dbo.Hospital_Settings';
    END
    ELSE
    BEGIN
        -- التأكد من صحة أسماء الأعمدة في حال كانت الإصدارة السابقة تستخدم skey / svalue
        IF COL_LENGTH('dbo.Hospital_Settings', 'settings_key') IS NULL AND COL_LENGTH('dbo.Hospital_Settings', 'skey') IS NOT NULL
        BEGIN
            EXEC sp_rename 'dbo.Hospital_Settings.skey', 'settings_key', 'COLUMN';
        END;
        IF COL_LENGTH('dbo.Hospital_Settings', 'settings_value') IS NULL AND COL_LENGTH('dbo.Hospital_Settings', 'svalue') IS NOT NULL
        BEGIN
            EXEC sp_rename 'dbo.Hospital_Settings.svalue', 'settings_value', 'COLUMN';
        END;
    END;

    -- =========================================================================================
    -- 7. جدول سجلات التدقيق والمراقبة الأمنية (Hospital_Audit_Logs)
    -- =========================================================================================
    IF OBJECT_ID('dbo.Hospital_Audit_Logs', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Hospital_Audit_Logs (
            id VARCHAR(100) NOT NULL PRIMARY KEY,
            userId VARCHAR(100) NULL,
            username NVARCHAR(255) NULL,
            action NVARCHAR(255) NOT NULL,
            details NVARCHAR(MAX) NULL,
            timestamp NVARCHAR(100) NOT NULL,
            ipAddress VARCHAR(50) NULL
        );
        PRINT '>> تم إنشاء جدول سجلات التدقيق dbo.Hospital_Audit_Logs';
    END;

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Hospital_Audit_Logs_Timestamp' AND object_id = OBJECT_ID('dbo.Hospital_Audit_Logs'))
        CREATE INDEX IX_Hospital_Audit_Logs_Timestamp ON dbo.Hospital_Audit_Logs(timestamp);

    -- =========================================================================================
    -- 8. جدول الصلاحيات والأدوار المتقدمة (Hospital_Security_Permissions)
    -- =========================================================================================
    IF OBJECT_ID('dbo.Hospital_Security_Permissions', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Hospital_Security_Permissions (
            id VARCHAR(100) NOT NULL PRIMARY KEY,
            roleName NVARCHAR(100) NOT NULL UNIQUE,
            permissions NVARCHAR(MAX) NOT NULL,
            description NVARCHAR(MAX) NULL
        );
        PRINT '>> تم إنشاء جدول الصلاحيات dbo.Hospital_Security_Permissions';
    END;

    -- =========================================================================================
    -- 9. جدول المرضى وملفات المختبر (Lab_Patients / Lab_Registered_Patients)
    -- =========================================================================================
    IF OBJECT_ID('dbo.Lab_Patients', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Lab_Patients (
            id VARCHAR(100) NOT NULL PRIMARY KEY,
            fullName NVARCHAR(255) NOT NULL,
            gender VARCHAR(50) NOT NULL DEFAULT 'male',
            age INT NOT NULL DEFAULT 0,
            medicalRecordNumber NVARCHAR(100) NOT NULL,
            analysisType NVARCHAR(MAX) NULL,
            phoneNumber NVARCHAR(100) NULL,
            companionPhoneNumber NVARCHAR(100) NULL,
            doctorName NVARCHAR(255) NULL,
            roomNumber NVARCHAR(100) NULL,
            operationType NVARCHAR(255) NULL,
            bloodType VARCHAR(20) NULL,
            status VARCHAR(50) DEFAULT 'registered',
            biometricCode INT IDENTITY(1,1) NOT NULL,
            createdAt DATETIME NOT NULL DEFAULT GETDATE(),
            qrCodeUrl NVARCHAR(MAX) NULL,
            patientPhotoBase64 NVARCHAR(MAX) NULL,
            fingerprintTemplate NVARCHAR(MAX) NULL,
            fingerprintImageBase64 NVARCHAR(MAX) NULL,
            allResultsFileBase64 NVARCHAR(MAX) NULL,
            allResultsFileName NVARCHAR(255) NULL,
            bloodBagsDelivered INT DEFAULT 0
        );
        PRINT '>> تم إنشاء جدول المرضى dbo.Lab_Patients';
    END
    ELSE
    BEGIN
        IF COL_LENGTH('dbo.Lab_Patients', 'bloodBagsDelivered') IS NULL
            ALTER TABLE dbo.Lab_Patients ADD bloodBagsDelivered INT DEFAULT 0;
        IF COL_LENGTH('dbo.Lab_Patients', 'allResultsFileBase64') IS NULL
            ALTER TABLE dbo.Lab_Patients ADD allResultsFileBase64 NVARCHAR(MAX) NULL;
        IF COL_LENGTH('dbo.Lab_Patients', 'allResultsFileName') IS NULL
            ALTER TABLE dbo.Lab_Patients ADD allResultsFileName NVARCHAR(255) NULL;
        IF COL_LENGTH('dbo.Lab_Patients', 'doctorName') IS NULL
            ALTER TABLE dbo.Lab_Patients ADD doctorName NVARCHAR(255) NULL;
        IF COL_LENGTH('dbo.Lab_Patients', 'roomNumber') IS NULL
            ALTER TABLE dbo.Lab_Patients ADD roomNumber NVARCHAR(100) NULL;
        IF COL_LENGTH('dbo.Lab_Patients', 'operationType') IS NULL
            ALTER TABLE dbo.Lab_Patients ADD operationType NVARCHAR(255) NULL;
        IF COL_LENGTH('dbo.Lab_Patients', 'bloodType') IS NULL
            ALTER TABLE dbo.Lab_Patients ADD bloodType VARCHAR(20) NULL;
        IF COL_LENGTH('dbo.Lab_Patients', 'status') IS NULL
            ALTER TABLE dbo.Lab_Patients ADD status VARCHAR(50) DEFAULT 'registered';
        IF COL_LENGTH('dbo.Lab_Patients', 'qrCodeUrl') IS NULL
            ALTER TABLE dbo.Lab_Patients ADD qrCodeUrl NVARCHAR(MAX) NULL;
        IF COL_LENGTH('dbo.Lab_Patients', 'patientPhotoBase64') IS NULL
            ALTER TABLE dbo.Lab_Patients ADD patientPhotoBase64 NVARCHAR(MAX) NULL;
        IF COL_LENGTH('dbo.Lab_Patients', 'fingerprintTemplate') IS NULL
            ALTER TABLE dbo.Lab_Patients ADD fingerprintTemplate NVARCHAR(MAX) NULL;
        IF COL_LENGTH('dbo.Lab_Patients', 'fingerprintImageBase64') IS NULL
            ALTER TABLE dbo.Lab_Patients ADD fingerprintImageBase64 NVARCHAR(MAX) NULL;
    END;

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Lab_Patients_FullName' AND object_id = OBJECT_ID('dbo.Lab_Patients'))
        CREATE INDEX IX_Lab_Patients_FullName ON dbo.Lab_Patients(fullName);
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Lab_Patients_MedicalRecord' AND object_id = OBJECT_ID('dbo.Lab_Patients'))
        CREATE INDEX IX_Lab_Patients_MedicalRecord ON dbo.Lab_Patients(medicalRecordNumber);

    -- =========================================================================================
    -- 10. جدول أرشيف البصمات والصور الحيومترية (Lab_Biometrics_Archive)
    -- =========================================================================================
    IF OBJECT_ID('dbo.Lab_Biometrics_Archive', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Lab_Biometrics_Archive (
            id VARCHAR(100) NOT NULL PRIMARY KEY,
            patientId VARCHAR(100) NOT NULL,
            fingerprintTemplate VARCHAR(MAX) NOT NULL,
            nationalIdPhotoBase64 VARCHAR(MAX) NULL,
            patientPhotoBase64 VARCHAR(MAX) NULL,
            createdAt DATETIME NOT NULL DEFAULT GETDATE(),
            CONSTRAINT FK_LabBiometrics_Patients FOREIGN KEY (patientId) REFERENCES dbo.Lab_Patients(id) ON DELETE CASCADE
        );
        PRINT '>> تم إنشاء جدول البصمات dbo.Lab_Biometrics_Archive';
    END;

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Lab_Biometrics_PatientId' AND object_id = OBJECT_ID('dbo.Lab_Biometrics_Archive'))
        CREATE INDEX IX_Lab_Biometrics_PatientId ON dbo.Lab_Biometrics_Archive(patientId);

    -- =========================================================================================
    -- 11. جدول عينات التحليل وباركودات الأنابيب (Lab_Samples)
    -- =========================================================================================
    IF OBJECT_ID('dbo.Lab_Samples', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Lab_Samples (
            id VARCHAR(100) NOT NULL PRIMARY KEY,
            patientId VARCHAR(100) NOT NULL,
            barcode VARCHAR(100) NULL,
            qrCode VARCHAR(255) NULL,
            sampleType NVARCHAR(100) NOT NULL DEFAULT N'Whole Blood',
            bloodType VARCHAR(20) NULL,
            tests NVARCHAR(MAX) NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'Collected',
            collectedAt DATETIME NOT NULL DEFAULT GETDATE(),
            collectedBy NVARCHAR(255) NULL,
            verifiedAt DATETIME NULL,
            analysisType NVARCHAR(255) NULL,
            results NVARCHAR(MAX) NULL,
            completedAt NVARCHAR(100) NULL,
            verifiedBy NVARCHAR(255) NULL,
            CONSTRAINT FK_LabSamples_Patients FOREIGN KEY (patientId) REFERENCES dbo.Lab_Patients(id) ON DELETE CASCADE
        );
        PRINT '>> تم إنشاء جدول العينات dbo.Lab_Samples';
    END
    ELSE
    BEGIN
        IF COL_LENGTH('dbo.Lab_Samples', 'tests') IS NULL
            ALTER TABLE dbo.Lab_Samples ADD tests NVARCHAR(MAX) NULL;
        IF COL_LENGTH('dbo.Lab_Samples', 'results') IS NULL
            ALTER TABLE dbo.Lab_Samples ADD results NVARCHAR(MAX) NULL;
        IF COL_LENGTH('dbo.Lab_Samples', 'completedAt') IS NULL
            ALTER TABLE dbo.Lab_Samples ADD completedAt NVARCHAR(100) NULL;
        IF COL_LENGTH('dbo.Lab_Samples', 'verifiedBy') IS NULL
            ALTER TABLE dbo.Lab_Samples ADD verifiedBy NVARCHAR(255) NULL;
    END;

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Lab_Samples_PatientId' AND object_id = OBJECT_ID('dbo.Lab_Samples'))
        CREATE INDEX IX_Lab_Samples_PatientId ON dbo.Lab_Samples(patientId);

    -- =========================================================================================
    -- 12. جدول سجلات مطابقات نقل الدم (Blood_Transfusion_Logs)
    -- =========================================================================================
    IF OBJECT_ID('dbo.Blood_Transfusion_Logs', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Blood_Transfusion_Logs (
            id VARCHAR(100) NOT NULL PRIMARY KEY,
            patientId VARCHAR(100) NOT NULL,
            sampleId VARCHAR(100) NULL,
            nurseId VARCHAR(100) NULL,
            nurseName NVARCHAR(255) NULL,
            wardFloor NVARCHAR(100) NULL,
            scannedQrCode VARCHAR(255) NULL,
            bloodBagBarcode VARCHAR(100) NOT NULL,
            verificationStatus VARCHAR(50) NOT NULL,
            loggedAt DATETIME NOT NULL DEFAULT GETDATE(),
            details NVARCHAR(MAX) NULL,
            CONSTRAINT FK_BloodTransfusion_Patients FOREIGN KEY (patientId) REFERENCES dbo.Lab_Patients(id)
        );
        PRINT '>> تم إنشاء جدول مطابقات الدم dbo.Blood_Transfusion_Logs';
    END;

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_BloodTransfusion_Status' AND object_id = OBJECT_ID('dbo.Blood_Transfusion_Logs'))
        CREATE INDEX IX_BloodTransfusion_Status ON dbo.Blood_Transfusion_Logs(verificationStatus);

    -- =========================================================================================
    -- 13. جدول دليل الفحوصات والتحاليل المخبرية (Lab_Test_Catalog)
    -- =========================================================================================
    IF OBJECT_ID('dbo.Lab_Test_Catalog', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Lab_Test_Catalog (
            id VARCHAR(100) NOT NULL PRIMARY KEY,
            name NVARCHAR(255) NOT NULL,
            category NVARCHAR(100) NOT NULL,
            sampleType NVARCHAR(100) NOT NULL,
            normalRange NVARCHAR(255) NULL,
            unit NVARCHAR(50) NULL,
            price FLOAT DEFAULT 0,
            turnaroundMinutes INT DEFAULT 30
        );
        PRINT '>> تم إنشاء جدول الفحوصات dbo.Lab_Test_Catalog';
    END;

    -- =========================================================================================
    -- 14. جدول أرشفة مواد وكتب ومستلزمات المختبر (Lab_Materials)
    -- =========================================================================================
    IF OBJECT_ID('dbo.Lab_Materials', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Lab_Materials (
            id VARCHAR(100) NOT NULL PRIMARY KEY,
            supplier NVARCHAR(255) NOT NULL,
            bookNumber NVARCHAR(100) NOT NULL,
            bookDate VARCHAR(50) NOT NULL,
            pdfPath NVARCHAR(500) NULL,
            pdfBase64 NVARCHAR(MAX) NULL,
            pdfFileName NVARCHAR(255) NULL,
            qrCode NVARCHAR(255) NULL,
            barcode NVARCHAR(255) NULL,
            archivedBy NVARCHAR(100) NULL,
            bookName NVARCHAR(255) NULL,
            category NVARCHAR(100) NULL,
            lotNumber NVARCHAR(100) NULL,
            expiryDate VARCHAR(50) NULL,
            quantity NVARCHAR(100) NULL,
            createdAt DATETIME DEFAULT GETDATE(),
            updatedAt DATETIME DEFAULT GETDATE()
        );
        PRINT '>> تم إنشاء جدول أرشفة المواد والكتب dbo.Lab_Materials';
    END
    ELSE
    BEGIN
        IF COL_LENGTH('dbo.Lab_Materials', 'pdfPath') IS NULL
            ALTER TABLE dbo.Lab_Materials ADD pdfPath NVARCHAR(500) NULL;
        IF COL_LENGTH('dbo.Lab_Materials', 'supplier') IS NULL
            ALTER TABLE dbo.Lab_Materials ADD supplier NVARCHAR(255) NULL;
        IF COL_LENGTH('dbo.Lab_Materials', 'pdfBase64') IS NULL
            ALTER TABLE dbo.Lab_Materials ADD pdfBase64 NVARCHAR(MAX) NULL;
        IF COL_LENGTH('dbo.Lab_Materials', 'pdfFileName') IS NULL
            ALTER TABLE dbo.Lab_Materials ADD pdfFileName NVARCHAR(255) NULL;
        IF COL_LENGTH('dbo.Lab_Materials', 'qrCode') IS NULL
            ALTER TABLE dbo.Lab_Materials ADD qrCode NVARCHAR(255) NULL;
        IF COL_LENGTH('dbo.Lab_Materials', 'barcode') IS NULL
            ALTER TABLE dbo.Lab_Materials ADD barcode NVARCHAR(255) NULL;
    END;

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Lab_Materials_Supplier' AND object_id = OBJECT_ID('dbo.Lab_Materials'))
        CREATE INDEX IX_Lab_Materials_Supplier ON dbo.Lab_Materials(supplier);
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Lab_Materials_BookNumber' AND object_id = OBJECT_ID('dbo.Lab_Materials'))
        CREATE INDEX IX_Lab_Materials_BookNumber ON dbo.Lab_Materials(bookNumber);
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Lab_Materials_BookDate' AND object_id = OBJECT_ID('dbo.Lab_Materials'))
        CREATE INDEX IX_Lab_Materials_BookDate ON dbo.Lab_Materials(bookDate);
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Lab_Materials_QRCode' AND object_id = OBJECT_ID('dbo.Lab_Materials'))
        CREATE INDEX IX_Lab_Materials_QRCode ON dbo.Lab_Materials(qrCode);

    -- =========================================================================================
    -- 15. تغذية الحسابات والمستخدمين الأساسيين في جدول Hospital_Settings بأمان تام
    -- =========================================================================================
    MERGE dbo.Hospital_Settings AS target
    USING (SELECT 'users' AS key_name, N'[
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
      },
      {
        "id": "usr-lab",
        "username": "lab_tech",
        "password": "lab123",
        "role": "Lab_Technician"
      },
      {
        "id": "usr-lab-mgr",
        "username": "lab_mgr",
        "password": "lab123",
        "role": "Lab_Manager"
      },
      {
        "id": "usr-lab-analyst",
        "username": "lab_analyst",
        "password": "lab123",
        "role": "Lab_Analyst"
      },
      {
        "id": "usr-nurse",
        "username": "nurse",
        "password": "nurse123",
        "role": "Nurse"
      }
    ]' AS val_content) AS source
    ON target.settings_key = source.key_name
    WHEN MATCHED THEN
        UPDATE SET target.settings_value = source.val_content
    WHEN NOT MATCHED THEN
        INSERT (settings_key, settings_value) VALUES (source.key_name, source.val_content);

    PRINT '>> تم تحديث وتغذية المستخدمين وحساب المهندس محمد جاسم في dbo.Hospital_Settings بنجاح.';

    COMMIT TRANSACTION;
    PRINT '=========================================================================================';
    PRINT '✅ اكتمل تنفيذ وتحديث جميع أكواد وقواعد بيانات النظام بنجاح 100%. النظام جاهز تماماً للعمل!';
    PRINT '=========================================================================================';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    PRINT '❌ حدث خطأ أثناء تنفيذ الأوامر: ' + ERROR_MESSAGE();
END CATCH;
GO
