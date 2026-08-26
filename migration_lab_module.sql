-- =========================================================================
-- SQL Server Migration Script: Laboratory & Blood Bank Module Integration
-- Target Database: hr_farah_db
-- Target Engine: Microsoft SQL Server 2019 (15.0) or higher
-- Author: Senior Full-Stack Developer & Database Architect
-- Date: 2026
-- Description: Adds tables for Biometric Fingerprints, Patient Profiles,
--              Blood Sample Barcoding, and Transfusion Cross-Match logs
--              without breaking or interrupting any existing live operations.
-- =========================================================================

USE [hr_farah_db];
GO

-- ابدأ المعاملة البرمجية لضمان المعاملة الذرية السليمة (Atomicity)
BEGIN TRANSACTION;
BEGIN TRY

    -- 1. جدول ملف المريض والربط مع طبلة المريض (Lab_Patients)
    IF OBJECT_ID('dbo.Lab_Patients', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Lab_Patients (
            id VARCHAR(100) NOT NULL PRIMARY KEY,
            fullName NVARCHAR(255) NOT NULL,
            gender VARCHAR(50) NOT NULL DEFAULT 'male',
            age INT NOT NULL DEFAULT 0,
            medicalRecordNumber NVARCHAR(100) NOT NULL,
            analysisType NVARCHAR(255) NULL,
            phoneNumber NVARCHAR(100) NULL,
            companionPhoneNumber NVARCHAR(100) NULL,
            biometricCode INT IDENTITY(1,1) NOT NULL,
            createdAt DATETIME NOT NULL DEFAULT GETDATE()
        );
        PRINT 'SUCCESS: Created table dbo.Lab_Patients';
    END
    ELSE
    BEGIN
        PRINT 'WARNING: Table dbo.Lab_Patients already exists, verifying structure.';
    END;

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Lab_Patients_FullName' AND object_id = OBJECT_ID('dbo.Lab_Patients'))
        CREATE INDEX IX_Lab_Patients_FullName ON dbo.Lab_Patients(fullName);
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Lab_Patients_MedicalRecord' AND object_id = OBJECT_ID('dbo.Lab_Patients'))
        CREATE INDEX IX_Lab_Patients_MedicalRecord ON dbo.Lab_Patients(medicalRecordNumber);
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Lab_Patients_BiometricCode' AND object_id = OBJECT_ID('dbo.Lab_Patients'))
        CREATE INDEX IX_Lab_Patients_BiometricCode ON dbo.Lab_Patients(biometricCode);

    -- 2. جدول أرشيف البصمات والصور الحيومترية (Lab_Biometrics_Archive)
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
        PRINT 'SUCCESS: Created table dbo.Lab_Biometrics_Archive';
    END
    ELSE
    BEGIN
        PRINT 'WARNING: Table dbo.Lab_Biometrics_Archive already exists, skipping creation.';
    END;

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Lab_Biometrics_PatientId' AND object_id = OBJECT_ID('dbo.Lab_Biometrics_Archive'))
        CREATE INDEX IX_Lab_Biometrics_PatientId ON dbo.Lab_Biometrics_Archive(patientId);

    -- 3. جدول عينات التحليل وباركودات الأنابيب (Lab_Samples)
    IF OBJECT_ID('dbo.Lab_Samples', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Lab_Samples (
            id VARCHAR(100) NOT NULL PRIMARY KEY,
            patientId VARCHAR(100) NOT NULL,
            barcode VARCHAR(100) NOT NULL,
            qrCode VARCHAR(255) NOT NULL,
            sampleType NVARCHAR(100) NOT NULL DEFAULT N'Whole Blood',
            bloodType VARCHAR(20) NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'Collected',
            collectedAt DATETIME NOT NULL DEFAULT GETDATE(),
            collectedBy NVARCHAR(255) NULL,
            verifiedAt DATETIME NULL,
            CONSTRAINT UC_Lab_Samples_Barcode UNIQUE (barcode),
            CONSTRAINT UC_Lab_Samples_QRCode UNIQUE (qrCode),
            CONSTRAINT FK_LabSamples_Patients FOREIGN KEY (patientId) REFERENCES dbo.Lab_Patients(id) ON DELETE CASCADE
        );
        PRINT 'SUCCESS: Created table dbo.Lab_Samples';
    END
    ELSE
    BEGIN
        PRINT 'WARNING: Table dbo.Lab_Samples already exists, skipping creation.';
    END;

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Lab_Samples_Barcode' AND object_id = OBJECT_ID('dbo.Lab_Samples'))
        CREATE INDEX IX_Lab_Samples_Barcode ON dbo.Lab_Samples(barcode);
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Lab_Samples_QRCode' AND object_id = OBJECT_ID('dbo.Lab_Samples'))
        CREATE INDEX IX_Lab_Samples_QRCode ON dbo.Lab_Samples(qrCode);

    -- 4. جدول سجلات مطابقات نقل الدم وأمان الحقن (Blood_Transfusion_Logs)
    IF OBJECT_ID('dbo.Blood_Transfusion_Logs', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Blood_Transfusion_Logs (
            id VARCHAR(100) NOT NULL PRIMARY KEY,
            patientId VARCHAR(100) NOT NULL,
            sampleId VARCHAR(100) NOT NULL,
            nurseId VARCHAR(100) NOT NULL,
            nurseName NVARCHAR(255) NOT NULL,
            wardFloor NVARCHAR(100) NOT NULL,
            scannedQrCode VARCHAR(255) NOT NULL,
            bloodBagBarcode VARCHAR(100) NOT NULL,
            verificationStatus VARCHAR(50) NOT NULL,
            loggedAt DATETIME NOT NULL DEFAULT GETDATE(),
            details NVARCHAR(MAX) NULL,
            CONSTRAINT FK_BloodTransfusion_Patients FOREIGN KEY (patientId) REFERENCES dbo.Lab_Patients(id),
            CONSTRAINT FK_BloodTransfusion_Samples FOREIGN KEY (sampleId) REFERENCES dbo.Lab_Samples(id)
        );
        PRINT 'SUCCESS: Created table dbo.Blood_Transfusion_Logs';
    END
    ELSE
    BEGIN
        PRINT 'WARNING: Table dbo.Blood_Transfusion_Logs already exists, skipping creation.';
    END;

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_BloodTransfusion_Status' AND object_id = OBJECT_ID('dbo.Blood_Transfusion_Logs'))
        CREATE INDEX IX_BloodTransfusion_Status ON dbo.Blood_Transfusion_Logs(verificationStatus);

    -- 5. إضافة عمود الصلاحيات الإضافية لجدول الموظفين الحالي دون التسبب في عطل
    IF NOT EXISTS (
        SELECT * FROM sys.columns 
        WHERE object_id = OBJECT_ID('dbo.Hospital_Employees') AND name = 'RoleID'
    )
    BEGIN
        ALTER TABLE dbo.Hospital_Employees ADD RoleID NVARCHAR(100) NULL;
        PRINT 'SUCCESS: Altered table dbo.Hospital_Employees to add RoleID column';
    END;

    -- 6. جدول أرشفة مواد وكتب ومستلزمات المختبر وتوليد الكيو ار كود (Lab_Materials)
    IF OBJECT_ID('dbo.Lab_Materials', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Lab_Materials (
            id VARCHAR(100) NOT NULL PRIMARY KEY,
            bookName NVARCHAR(255) NOT NULL,
            bookNumber NVARCHAR(100) NOT NULL,
            bookDate VARCHAR(50) NOT NULL,
            supplier NVARCHAR(255) NOT NULL,
            category NVARCHAR(100) NULL,
            lotNumber NVARCHAR(100) NULL,
            expiryDate VARCHAR(50) NULL,
            quantity NVARCHAR(100) NULL,
            pdfBase64 NVARCHAR(MAX) NULL,
            pdfFileName NVARCHAR(255) NULL,
            qrCode NVARCHAR(255) NULL,
            barcode NVARCHAR(255) NULL,
            archivedBy NVARCHAR(100) NULL,
            createdAt DATETIME DEFAULT GETDATE(),
            updatedAt DATETIME DEFAULT GETDATE()
        );
        PRINT 'SUCCESS: Created table dbo.Lab_Materials';
    END
    ELSE
    BEGIN
        PRINT 'WARNING: Table dbo.Lab_Materials already exists, verifying structure.';
    END;

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Lab_Materials_Supplier' AND object_id = OBJECT_ID('dbo.Lab_Materials'))
        CREATE INDEX IX_Lab_Materials_Supplier ON dbo.Lab_Materials(supplier);
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Lab_Materials_BookNumber' AND object_id = OBJECT_ID('dbo.Lab_Materials'))
        CREATE INDEX IX_Lab_Materials_BookNumber ON dbo.Lab_Materials(bookNumber);
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Lab_Materials_BookDate' AND object_id = OBJECT_ID('dbo.Lab_Materials'))
        CREATE INDEX IX_Lab_Materials_BookDate ON dbo.Lab_Materials(bookDate);
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Lab_Materials_QRCode' AND object_id = OBJECT_ID('dbo.Lab_Materials'))
        CREATE INDEX IX_Lab_Materials_QRCode ON dbo.Lab_Materials(qrCode);

    -- إنهاء المعاملة وحفظ التغييرات بنجاح تام
    COMMIT TRANSACTION;
    PRINT '=========================================================================';
    PRINT 'MIGRATION COMPLETED SUCCESSFULLY WITHOUT INTERRUPTING LIVE DATABASE!';
    PRINT '=========================================================================';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    PRINT 'CRITICAL ERROR: Migration failed. All changes have been rolled back!';
    PRINT 'Error Message: ' + ERROR_MESSAGE();
END CATCH;
GO
