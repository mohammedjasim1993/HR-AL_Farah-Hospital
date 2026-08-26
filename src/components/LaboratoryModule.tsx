import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { 
  Fingerprint, 
  Camera, 
  QrCode, 
  Barcode, 
  Activity, 
  HeartPulse, 
  User, 
  Plus, 
  Search, 
  ShieldAlert, 
  CheckCircle, 
  Droplet, 
  FileText, 
  Download, 
  AlertTriangle,
  Clock,
  UserCheck,
  RefreshCw,
  RotateCw,
  TrendingUp,
  Award,
  Printer,
  Laptop,
  Check,
  Upload,
  Usb,
  Trash2,
  Edit,
  Users,
  X,
  Package,
  Layers,
  Sparkles,
  Boxes,
  Calendar,
  Building2,
  Tag,
  Eye,
  FileCheck,
  Database
} from 'lucide-react';
import { User as SystemUser } from '../types';

// Biometric Fingerprint USB Scanners catalog commonly used in hospitals
const BIOMETRIC_USB_DEVICES = [
  {
    id: 'bio-dev-zkteco',
    name: 'ZKTeco SLK20R / ZK9500 USB Reader',
    manufacturer: 'ZKTeco Inc.',
    vid: '1B55',
    pid: '0140',
    serial: 'ZK-SLK20-77621',
    apiType: 'LocalAgent',
    description: 'قارئ بصمات ZKTeco عالي الكفاءة يدعم التوصيل المباشر USB والتحقق الحركي السريع عبر خدمة ZKOnline SDK المحلية.'
  },
  {
    id: 'bio-dev-secugen',
    name: 'SecuGen Hamster Pro 20 (FAP20)',
    manufacturer: 'SecuGen Corporation',
    vid: '1162',
    pid: '0330',
    serial: 'SG-HP20-99824',
    apiType: 'WebUSB',
    description: 'قارئ بصمات بصري معتمد حكومياً عالي المتانة بمستشعر مقاوم للخدوش (FAP20 Certification).'
  },
  {
    id: 'bio-dev-uareu',
    name: 'DigitalPersona U.are.U 4500 Reader',
    manufacturer: 'Crossmatch Technologies Inc.',
    vid: '05BA',
    pid: '000A',
    serial: 'DP-URU45-44120',
    apiType: 'LocalAgent',
    description: 'جهاز مسح بيومتري بصري كلاسيكي مزود بإضاءة زرقاء خافتة، يوفر تشفير عالي الجودة للبصمات.'
  },
  {
    id: 'bio-dev-futronic',
    name: 'Futronic FS80H USB2.0 Optical Scanner',
    manufacturer: 'Futronic Technology Co. Ltd.',
    vid: '0E11',
    pid: '1000',
    serial: 'FT-FS80-55231',
    apiType: 'WebUSB',
    description: 'ماسح إبهام بصري احترافي مقاوم للتخريب ذو مستشعر زجاجي تاجي صلب بسماكة 14 ملم.'
  },
  {
    id: 'bio-dev-nitgen',
    name: 'Nitgen Fingkey Hamster II',
    manufacturer: 'Nitgen Co. Ltd.',
    vid: '0A85',
    pid: '0005',
    serial: 'NT-FKEY-11029',
    apiType: 'LocalAgent',
    description: 'ماسح بصمات مجهز بتقنية كشف الإصبع البشري الحي (LFD) لمنع الخداع بالبصمات المصنعة.'
  }
];

// 10 Fingers definition for Left & Right Hands biometric diagram
const FINGER_KEYS = [
  // Left Hand: Pinky(L5) to Thumb(L1)
  { id: 'L5', nameAr: 'الخنصر الأيسر', handAr: 'اليد اليسرى', hand: 'left', type: 'pinky', label: 'الخنصر' },
  { id: 'L4', nameAr: 'البنصر الأيسر', handAr: 'اليد اليسرى', hand: 'left', type: 'ring', label: 'البنصر' },
  { id: 'L3', nameAr: 'الوسطى اليسرى', handAr: 'اليد اليسرى', hand: 'left', type: 'middle', label: 'الوسطى' },
  { id: 'L2', nameAr: 'السبابة اليسرى', handAr: 'اليد اليسرى', hand: 'left', type: 'index', label: 'السبابة' },
  { id: 'L1', nameAr: 'الإبهام الأيسر', handAr: 'اليد اليسرى', hand: 'left', type: 'thumb', label: 'الإبهام' },
  
  // Right Hand: Thumb(R1) to Pinky(R5)
  { id: 'R1', nameAr: 'الإبهام الأيمن', handAr: 'اليد اليمنى', hand: 'right', type: 'thumb', label: 'الإبهام' },
  { id: 'R2', nameAr: 'السبابة اليمنى', handAr: 'اليد اليمنى', hand: 'right', type: 'index', label: 'السبابة' },
  { id: 'R3', nameAr: 'الوسطى اليمنى', handAr: 'اليد اليمنى', hand: 'right', type: 'middle', label: 'الوسطى' },
  { id: 'R4', nameAr: 'البنصر الأيمن', handAr: 'اليد اليمنى', hand: 'right', type: 'ring', label: 'البنصر' },
  { id: 'R5', nameAr: 'الخنصر الأيمن', handAr: 'اليد اليمنى', hand: 'right', type: 'pinky', label: 'الخنصر' },
];

// Helper functions to generate local QR codes and Barcodes as Base64 images instantly (no network overhead, highly reliable for medical contexts)
const generateLocalQRDataUrl = async (text: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(text, {
      margin: 1,
      width: 600,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Error generating QR data URL:', err);
    return '';
  }
};

const formatToStandardBarcode = (code: string | number): string => {
  if (code === undefined || code === null) return '';
  const clean = String(code).trim().replace('#', '');
  if (/^\d+$/.test(clean)) {
    return `FARAH-LAB-${clean.padStart(5, '0')}`;
  }
  // If it's already got FARAH-LAB- or standard prefix, return as is
  if (/^FARAH-LAB-/i.test(clean)) {
    return clean.toUpperCase();
  }
  // If it is BIO-XXX
  if (/^BIO-(\d+)/i.test(clean)) {
    const num = clean.replace(/^BIO-/i, '');
    return `FARAH-LAB-${num.padStart(5, '0')}`;
  }
  // Otherwise prefix it
  return `FARAH-LAB-${clean}`;
};

const generateLocalBarcodeDataUrl = (
  text: string | number,
  options?: { width?: number; height?: number; displayValue?: boolean; fontSize?: number; margin?: number }
): string => {
  try {
    const formatted = formatToStandardBarcode(text);
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, formatted, {
      format: 'CODE128',
      displayValue: options?.displayValue ?? false,
      fontSize: options?.fontSize ?? 14,
      width: options?.width ?? 2.5,
      height: options?.height ?? 60,
      margin: options?.margin ?? 2
    });
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error('Error generating Barcode data URL:', err);
    return '';
  }
};

interface LaboratoryModuleProps {
  currentUser: SystemUser;
  labPermissionsMatrix?: any;
}

export default function LaboratoryModule({ currentUser, labPermissionsMatrix }: LaboratoryModuleProps) {
  const playSuccessBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gainNode.gain.setValueAtTime(0.1, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      const now = audioCtx.currentTime;
      playTone(587.33, now, 0.1); // D5
      playTone(880, now + 0.1, 0.25); // A5
    } catch (err) {
      console.warn("Could not play audio success beep:", err);
    }
  };

  const [stats, setStats] = useState({
    patientsTotal: 0,
    samplesTotal: 0,
    transfusionsTotal: 0,
    alertsTotal: 0
  });

  // Get lab permission helper
  const getLabPermission = (tabKey: 'fingerprint_registration' | 'patient_log' | 'sample_collection' | 'sample_records' | 'blood_bags') => {
    if (!currentUser?.role) return 'none';
    if (currentUser?.role === 'SystemAdmin' || currentUser?.role === 'Lab_Manager') return 'full';
    if (currentUser?.role === 'SuperAdmin' || currentUser?.role === 'HR') return 'none';
    
    // Convert tabKey to matrix key
    let matrixKey: 'registry' | 'patients_list' | 'samples' | 'sample_logs' | 'transfusion' = 'registry';
    if (tabKey === 'fingerprint_registration') matrixKey = 'registry';
    else if (tabKey === 'patient_log') matrixKey = 'patients_list';
    else if (tabKey === 'sample_collection') matrixKey = 'samples';
    else if (tabKey === 'sample_records') matrixKey = 'sample_logs';
    else if (tabKey === 'blood_bags') matrixKey = 'transfusion';

    if (!labPermissionsMatrix) {
      if (currentUser?.role === 'Lab_Technician') {
        if (matrixKey === 'transfusion') return 'none';
        return 'full';
      }
      if (currentUser?.role === 'Ward_Nurse') {
        if (matrixKey === 'transfusion') return 'full';
        return 'none';
      }
      if (currentUser?.role === 'Lab_Analyst') {
        if (matrixKey === 'transfusion') return 'none';
        return 'full';
      }
      if (currentUser?.role === 'Lab_DataEntry') {
        if (matrixKey === 'registry' || matrixKey === 'patients_list') return 'full';
        return 'read';
      }
      return 'none';
    }
    const rolePerms = labPermissionsMatrix[currentUser?.role || ""];
    if (!rolePerms) return 'none';
    return rolePerms[matrixKey] || 'none';
  };

  const hasRegAccess = getLabPermission('fingerprint_registration') !== 'none';
  const hasPatientsAccess = getLabPermission('patient_log') !== 'none';
  const hasSamplesAccess = getLabPermission('sample_collection') !== 'none';
  const hasLogsAccess = getLabPermission('sample_records') !== 'none';
  const hasTransfusionAccess = getLabPermission('blood_bags') !== 'none';
  const hasMaterialsAccess = true;

  // Access Control flags
  const userRole = currentUser?.role || '';
  const isSysAdmin = userRole === 'SystemAdmin';
  // Allow isLabTech if they have any of the 4 lab-related permissions or are traditional Lab_Technician
  const isLabTech = userRole === 'Lab_Technician' || isSysAdmin || hasRegAccess || hasPatientsAccess || hasSamplesAccess || hasLogsAccess || hasMaterialsAccess;
  // Allow isWardNurse if they have blood_bags permission or are traditional Ward_Nurse
  const isWardNurse = userRole === 'Ward_Nurse' || isSysAdmin || hasTransfusionAccess;

  // Active section inside Lab
  const [activeTab, setActiveTab] = useState<'registry' | 'patients_list' | 'verify' | 'samples' | 'sample_logs' | 'materials'>(() => {
    try {
      const stored = sessionStorage.getItem('lab_active_tab') || localStorage.getItem('lab_active_tab');
      if (stored) {
        if (stored === 'registry' && hasRegAccess) return 'registry';
        if ((stored === 'patients_list' || stored === 'verify') && hasPatientsAccess) return stored as any;
        if (stored === 'samples' && hasSamplesAccess) return 'samples';
        if (stored === 'sample_logs' && hasLogsAccess) return 'sample_logs';
        if (stored === 'materials' && hasMaterialsAccess) return 'materials';
      }
    } catch {}

    if (hasRegAccess) return 'registry';
    if (hasPatientsAccess) return 'patients_list';
    if (hasSamplesAccess) return 'samples';
    if (hasLogsAccess) return 'sample_logs';
    if (hasMaterialsAccess) return 'materials';
    return 'registry';
  });

  // States for Laboratory Materials & Documents Archiving
  const [materialsList, setMaterialsList] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('locked_lab_materials');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
  const [materialsSearchQuery, setMaterialsSearchQuery] = useState('');
  const [materialsBarcodeScan, setMaterialsBarcodeScan] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('الكل');

  // Form states for new material book
  const [newMatBookName, setNewMatBookName] = useState('');
  const [newMatBookNumber, setNewMatBookNumber] = useState('');
  const [newMatBookDate, setNewMatBookDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newMatSupplier, setNewMatSupplier] = useState('');
  const [newMatCategory, setNewMatCategory] = useState('كواشف مخبرية (Reagents)');
  const [newMatLotNumber, setNewMatLotNumber] = useState('');
  const [newMatExpiryDate, setNewMatExpiryDate] = useState('');
  const [newMatQuantity, setNewMatQuantity] = useState('');
  const [newMatPdfBase64, setNewMatPdfBase64] = useState<string | null>(null);
  const [newMatPdfFileName, setNewMatPdfFileName] = useState<string | null>(null);
  const [isSubmittingMaterial, setIsSubmittingMaterial] = useState(false);
  const [materialError, setMaterialError] = useState<string | null>(null);
  const [materialSuccessMsg, setMaterialSuccessMsg] = useState<string | null>(null);

  // States for Editing Material Book & Attached PDF
  const [editingMaterial, setEditingMaterial] = useState<any | null>(null);
  const [editMatSupplier, setEditMatSupplier] = useState('');
  const [editMatBookNumber, setEditMatBookNumber] = useState('');
  const [editMatBookDate, setEditMatBookDate] = useState('');
  const [editMatCategory, setEditMatCategory] = useState('كواشف مخبرية (Reagents)');
  const [editMatLotNumber, setEditMatLotNumber] = useState('');
  const [editMatExpiryDate, setEditMatExpiryDate] = useState('');
  const [editMatQuantity, setEditMatQuantity] = useState('');
  const [editMatPdfBase64, setEditMatPdfBase64] = useState<string | null>(null);
  const [editMatPdfFileName, setEditMatPdfFileName] = useState<string | null>(null);
  const [isUpdatingMaterial, setIsUpdatingMaterial] = useState(false);
  const [editMatError, setEditMatError] = useState<string | null>(null);

  // States for Material Medicine QR Sticker Modal
  const [selectedMaterialForQR, setSelectedMaterialForQR] = useState<any | null>(null);
  const [materialStickerQRUrl, setMaterialStickerQRUrl] = useState<string>('');
  const [materialStickerBarcodeUrl, setMaterialStickerBarcodeUrl] = useState<string>('');
  const [showMatCameraScanner, setShowMatCameraScanner] = useState(false);

  // States for Sample Logs and Results editing
  const [samplesList, setSamplesList] = useState<any[]>([]);
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);
  const [samplesSearchQuery, setSamplesSearchQuery] = useState('');
  const [editingSampleId, setEditingSampleId] = useState<string | null>(null);
  const [editingResults, setEditingResults] = useState<any[]>([]);
  const [editingBloodType, setEditingBloodType] = useState<string>('');
  const [editingAllResultsFileBase64, setEditingAllResultsFileBase64] = useState<string | null>(null);
  const [editingAllResultsFileName, setEditingAllResultsFileName] = useState<string | null>(null);
  const [editingSampleStatus, setEditingSampleStatus] = useState<string>('Verified');

  // States for Patient Registration
  const [fullName, setFullName] = useState('');
  const [tablehNumber, setTablehNumber] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [operationType, setOperationType] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<number | ''>('');
  const [analysisType, setAnalysisType] = useState('Cross-match (توافق الدم المتقاطع)');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [companionPhoneNumber, setCompanionPhoneNumber] = useState('');
  const [showWristbandModal, setShowWristbandModal] = useState<any | null>(null);
  const [pdfToView, setPdfToView] = useState<{ base64: string, name: string } | null>(null);
  
  // Custom analysis types state (persisted in localStorage)
  const [savedAnalysisTypes, setSavedAnalysisTypes] = useState<string[]>(() => {
    const local = localStorage.getItem('saved_analysis_types');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (parsed.length > 8) {
          return parsed;
        }
      } catch (e) {}
    }
    return [
      'Cross-match (توافق الدم المتقاطع)',
      'Blood Grouping & Rh (فصيلة الدم وعامل الريسوس)',
      'Coombs Test - Direct (فحص كومس المباشر)',
      'Coombs Test - Indirect (فحص كومس غير المباشر)',
      'Antibody Screening (غربلة الأجسام المضادة للدم)',
      'CBC - Complete Blood Count (صورة الدم الكاملة)',
      'HbA1c - Glycated Hemoglobin (السكر التراكمي)',
      'FBS - Fasting Blood Sugar (سكر الدم الصائم)',
      'RBS - Random Blood Sugar (سكر الدم العشوائي)',
      'Kidney Function: Urea & Creatinine (وظائف الكلى)',
      'Liver Function: ALT, AST, ALP (وظائف الكبد)',
      'Total & Direct Bilirubin (تحليل اليرقان / أبو صفار)',
      'Lipid Profile: Cholesterol, TG, HDL, LDL (الدهون الكاملة)',
      'Thyroid: TSH, Free T3, Free T4 (هرمونات الغدة الدرقية)',
      'Serum Electrolytes: Na, K, Cl, Ca (الأملاح والمعادن)',
      'G6PD Enzyme (أنيميا الفول / فقر الدم)',
      'Widal Test - Typhoid Fever (فحص التيفوئيد)',
      'Brucella Test - Malta Fever (فحص الحمى المالطية)',
      'H. Pylori - Stomach Germ (فحص جرثومة المعدة)',
      'Urine Analysis - Complete (تحليل الإدرار الكامل)',
      'Stool Analysis - Complete (تحليل الخروج الكامل)',
      'ESR - Erythrocyte Sedimentation Rate (سرعة ترسب الدم)',
      'CRP - C-Reactive Protein (البروتين الالتهابي)',
      'RF - Rheumatoid Factor (عامل الروماتويد المفاصل)',
      'Vitamin D3 (تحليل فيتامين د3 الحيوية)',
      'Vitamin B12 (تحليل فيتامين ب12 للأعصاب)',
      'Serum Ferritin (مخزون الحديد في الجسم)',
      'Serum Iron & TIBC (الحديد والقدرة الرابطة الكلية)',
      'PT, PTT & INR (سيولة الدم وعوامل التخثر)',
      'Pregnancy Test - hCG (تحليل الحمل الهرموني)',
      'HBsAg - Hepatitis B (التهاب الكبد الفيروسي ب)',
      'Anti-HCV - Hepatitis C (التهاب الكبد الفيروسي ج)',
      'HIV Duo - AIDS Screen (فحص فيروس نقص المناعة)',
      'PSA - Prostate Specific Antigen (مستضد البروستات)',
      'Troponin I - Cardiac Marker (إنزيمات جلطة القلب)',
      'Amylase & Lipase (إنزيمات البنكرياس والهضم)',
      'Semen Analysis - Complete (تحليل السائل المنوي)',
      'PCV - Packed Cell Volume (مكدس خلايا الدم الحمراء)',
      'Uric Acid (تحليل داء النقرس والمفاصل)',
      'Calcium & Ionized Calcium (الكالسيوم الكلي والحر)',
      'Magnesium - Serum (تحليل عنصر المغنيسيوم)',
      'Zinc - Serum (تحليل عنصر الزنك في الدم)',
      'Hormones: LH, FSH, Prolactin (الهرمونات النسائية والخصوبة)',
      'Serum Albumin & Total Protein (البروتين والألبومين)'
    ];
  });
  const [newAnalysisTypeInput, setNewAnalysisTypeInput] = useState('');
  const [isAddingNewType, setIsAddingNewType] = useState(false);
  const [newSampleAnalysisTypeInput, setNewSampleAnalysisTypeInput] = useState('');
  const [isAddingNewSampleType, setIsAddingNewSampleType] = useState(false);

  const handleAddNewAnalysisType = (typeStr: string) => {
    const trimmed = typeStr.trim();
    if (!trimmed) return;
    if (!savedAnalysisTypes.includes(trimmed)) {
      const updated = [...savedAnalysisTypes, trimmed];
      setSavedAnalysisTypes(updated);
      localStorage.setItem('saved_analysis_types', JSON.stringify(updated));
    }
    setAnalysisType(trimmed);
    setNewAnalysisTypeInput('');
    setIsAddingNewType(false);
  };

  const handleAddNewSampleAnalysisType = (typeStr: string) => {
    const trimmed = typeStr.trim();
    if (!trimmed) return;
    if (!savedAnalysisTypes.includes(trimmed)) {
      const updated = [...savedAnalysisTypes, trimmed];
      setSavedAnalysisTypes(updated);
      localStorage.setItem('saved_analysis_types', JSON.stringify(updated));
    }
    setSampleAnalysisType(trimmed);
    setNewSampleAnalysisTypeInput('');
    setIsAddingNewSampleType(false);
  };

  // States for Searchable Multi-Select Dropdowns
  const [isRegDropdownOpen, setIsRegDropdownOpen] = useState(false);
  const [regSearchQuery, setRegSearchQuery] = useState('');
  const [isEditDropdownOpen, setIsEditDropdownOpen] = useState(false);
  const [editSearchQuery, setEditSearchQuery] = useState('');
  const [isSampleDropdownOpen, setIsSampleDropdownOpen] = useState(false);
  const [sampleDropdownSearchQuery, setSampleDropdownSearchQuery] = useState('');

  // States for Blood Type Confirmation and Document attachment
  const [pendingBloodType, setPendingBloodType] = useState<string | null>(null);
  const [showBloodTypeConfirmModal, setShowBloodTypeConfirmModal] = useState(false);
  const [allResultsFileBase64, setAllResultsFileBase64] = useState<string | null>(null);
  const [allResultsFileName, setAllResultsFileName] = useState<string | null>(null);
  const [sampleCollectionError, setSampleCollectionError] = useState<string | null>(null);
  
  // Sandbox/Trial Environment States (Disabled by default)
  const [isSandboxMode, setIsSandboxMode] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.removeItem('locked_is_sandbox_mode');
    } catch (e) {}
  }, []);

  const [sandboxPatients, setSandboxPatients] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('locked_sandbox_patients');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [sandboxSamples, setSandboxSamples] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('locked_sandbox_samples');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [registeredPatientsList, setRegisteredPatientsList] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('locked_registered_patients_list');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('locked_is_sandbox_mode', String(isSandboxMode));
    } catch (e) {
      console.error('Failed to save sandbox mode state:', e);
    }
  }, [isSandboxMode]);

  useEffect(() => {
    try {
      localStorage.setItem('locked_sandbox_patients', JSON.stringify(sandboxPatients));
    } catch (e) {
      console.error('Failed to save sandbox patients:', e);
    }
  }, [sandboxPatients]);

  useEffect(() => {
    try {
      localStorage.setItem('locked_sandbox_samples', JSON.stringify(sandboxSamples));
    } catch (e) {
      console.error('Failed to save sandbox samples:', e);
    }
  }, [sandboxSamples]);

  useEffect(() => {
    try {
      localStorage.setItem('locked_registered_patients_list', JSON.stringify(registeredPatientsList));
    } catch (e) {
      console.error('Failed to save registered patients list:', e);
    }
  }, [registeredPatientsList]);
  
  // Biometric simulator capture states
  const [fingerprintCaptured, setFingerprintCaptured] = useState(false);
  const [fingerprintTemplate, setFingerprintTemplate] = useState('');
  const [nationalIdPhoto, setNationalIdPhoto] = useState<string | null>(null);
  const [nationalIdFrontPhoto, setNationalIdFrontPhoto] = useState<string | null>(null);
  const [nationalIdBackPhoto, setNationalIdBackPhoto] = useState<string | null>(null);
  const [patientPhoto, setPatientPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<string | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannerConnectionStatus, setScannerConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [scannerLogs, setScannerLogs] = useState<string[]>([]);
  const [scannerProgressStep, setScannerProgressStep] = useState<number>(0);
  const [isSearchingUsb, setIsSearchingUsb] = useState(false);
  const [discoveredUsbDevices, setDiscoveredUsbDevices] = useState<any[]>([]);
  const [selectedUsbDevice, setSelectedUsbDevice] = useState<any>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [registryMessage, setRegistryMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Real Biometric Fingerprint Scanner connection states
  const [bioDeviceStatus, setBioDeviceStatus] = useState<'disconnected' | 'searching' | 'connected'>('disconnected');
  const [connectedBioDevice, setConnectedBioDevice] = useState<any | null>(null);
  const [bioScannerLogs, setBioScannerLogs] = useState<string[]>([
    "نظام الاتصال الموحد لبصمة الدم جاهز.",
    "اضغط على 'البحث عن جهاز البصمة' للاتصال بالماسح البيومتري الموصول بالحاسوب."
  ]);
  const [showBioDeviceModal, setShowBioDeviceModal] = useState(false);
  const [showZkSdkDownload, setShowZkSdkDownload] = useState(false);
  const [isSearchingBioDevice, setIsSearchingBioDevice] = useState(false);
  const [isScanningFingerprint, setIsScanningFingerprint] = useState(false);
  const [fingerprintScanProgress, setFingerprintScanProgress] = useState(0);
  const [fingerprintAnimationStep, setFingerprintAnimationStep] = useState<'idle' | 'scanning' | 'extracting' | 'completed'>('idle');

  // 10 Fingerprint Capture Modal States
  const [showHandFingerprintModal, setShowHandFingerprintModal] = useState(false);
  const [selectedFingerId, setSelectedFingerId] = useState('R2'); // Default to Right Index (السبابة اليمنى)
  const [capturedFingers, setCapturedFingers] = useState<Record<string, { template: string, timestamp: string }>>({});
  const [isScanningFinger, setIsScanningFinger] = useState<string | null>(null);
  const [scanningProgress, setScanningProgress] = useState(0);

  // 3-step fingerprint enrollment states for the selected finger
  const [enrollmentSteps, setEnrollmentSteps] = useState<Record<string, Array<{ template: string, timestamp: string }>>>({});
  const [simulateFingerMismatch, setSimulateFingerMismatch] = useState(false);
  const [enrollmentFeedback, setEnrollmentFeedback] = useState<string | null>(null);

  // Patients Registry & Edit/Delete states
  const [registrySearch, setRegistrySearch] = useState('');
  const [registryPatients, setRegistryPatients] = useState<any[]>([]);
  const [registryLoading, setRegistryLoading] = useState(false);
  const [editingPatient, setEditingPatient] = useState<any | null>(null);
  const [deletingPatientId, setDeletingPatientId] = useState<string | null>(null);
  const [registryActionMessage, setRegistryActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form states for editing patient
  const [editFullName, setEditFullName] = useState('');
  const [editGender, setEditGender] = useState<'male' | 'female'>('male');
  const [editAge, setEditAge] = useState<number | ''>('');
  const [editTablehNumber, setEditTablehNumber] = useState('');
  const [editRoomNumber, setEditRoomNumber] = useState('');
  const [editDoctorName, setEditDoctorName] = useState('');
  const [editOperationType, setEditOperationType] = useState('');
  const [editAnalysisType, setEditAnalysisType] = useState('Cross-match (توافق الدم المتقاطع)');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [editCompanionPhoneNumber, setEditCompanionPhoneNumber] = useState('');
  const [editPatientPhoto, setEditPatientPhoto] = useState<string | null>(null);
  const [editNationalIdPhoto, setEditNationalIdPhoto] = useState<string | null>(null);

  // Fetch or filter patients for registry tab
  const handleLoadRegistryPatients = async () => {
    if (isSandboxMode) {
      if (!registrySearch.trim()) {
        setRegistryPatients(sandboxPatients);
      } else {
        const query = registrySearch.toLowerCase().trim();
        const matched = sandboxPatients.filter(p => 
          (p.fullName && p.fullName.toLowerCase().includes(query)) || 
          (p.medicalRecordNumber && p.medicalRecordNumber.toLowerCase().includes(query)) ||
          (p.biometricCode && p.biometricCode.toString().includes(query)) ||
          (p.doctorName && p.doctorName.toLowerCase().includes(query)) ||
          (p.operationType && p.operationType.toLowerCase().includes(query))
        );
        setRegistryPatients(matched);
      }
      return;
    }

    setRegistryLoading(true);
    try {
      const res = await fetch(`/api/lab/patients/search?q=${encodeURIComponent(registrySearch)}`, {
        headers: {
          'x-user-role': currentUser?.role,
          'x-user-name': currentUser.username
        }
      });
      const data = await res.json();
      if (data.success && data.patients) {
        setRegistryPatients(data.patients);
      }
    } catch (err) {
      console.error('Failed to load registry patients:', err);
    } finally {
      setRegistryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'patients_list') {
      handleLoadRegistryPatients();
    }
  }, [activeTab, registrySearch, sandboxPatients, isSandboxMode]);

  // Start editing a patient
  const startEditing = (patient: any) => {
    setEditingPatient(patient);
    setEditFullName(patient.fullName);
    setEditGender(patient.gender || 'male');
    setEditAge(patient.age || '');
    setEditTablehNumber(patient.medicalRecordNumber || '');
    setEditRoomNumber(patient.roomNumber || '');
    setEditDoctorName(patient.doctorName || '');
    setEditOperationType(patient.operationType || '');
    setEditAnalysisType(patient.analysisType || 'Cross-match');
    setEditPhoneNumber(patient.phoneNumber || '');
    setEditCompanionPhoneNumber(patient.companionPhoneNumber || '');
    setEditPatientPhoto(patient.patientPhotoBase64 || null);
    setEditNationalIdPhoto(patient.nationalIdPhotoBase64 || null);
    setRegistryActionMessage(null);
  };

  // Submit edit patient details
  const handleUpdatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editingPatient) return;

    if (!editFullName.trim()) {
      setRegistryActionMessage({ type: 'error', text: 'يرجى إدخال الاسم الكامل للمريض (الاسم إجباري).' });
      return;
    }

    // Phone number is optional. If provided, validate length
    if (editPhoneNumber && editPhoneNumber.trim() !== '') {
      const cleanPhone = editPhoneNumber.trim().replace(/\D/g, '');
      if (cleanPhone.length !== 11 && cleanPhone.length !== 10) {
        setRegistryActionMessage({
          type: 'error',
          text: 'تنبيه: في حال كتابة رقم هاتف المريض يرجى إدخال رقم صحيح (مثل: 07701234567) أو تركه فارغاً فهو اختياري.'
        });
        return;
      }
    }

    if (editCompanionPhoneNumber && editCompanionPhoneNumber.trim() !== '') {
      const cleanCompanion = editCompanionPhoneNumber.trim().replace(/\D/g, '');
      if (cleanCompanion.length !== 11 && cleanCompanion.length !== 10) {
        setRegistryActionMessage({
          type: 'error',
          text: 'تنبيه: في حال كتابة رقم هاتف المرافق يرجى إدخال رقم صحيح (مثل: 07801234567) أو تركه فارغاً فهو اختياري.'
        });
        return;
      }
    }

    if (isSandboxMode) {
      const updatedSandbox = sandboxPatients.map(p => {
        if (p.id === editingPatient.id) {
          return {
            ...p,
            fullName: editFullName,
            gender: editGender,
            age: Number(editAge) || 0,
            medicalRecordNumber: editTablehNumber,
            roomNumber: editRoomNumber,
            doctorName: editDoctorName,
            operationType: editOperationType,
            analysisType: editAnalysisType,
            phoneNumber: editPhoneNumber,
            companionPhoneNumber: editCompanionPhoneNumber,
            patientPhotoBase64: editPatientPhoto,
            nationalIdPhotoBase64: editNationalIdPhoto
          };
        }
        return p;
      });
      setSandboxPatients(updatedSandbox);
      setEditingPatient(null);
      setRegistryActionMessage({ type: 'success', text: 'تم تحديث بيانات المريض بنجاح في البيئة التجريبية.' });
      return;
    }

    try {
      const res = await fetch(`/api/lab/patients/${editingPatient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role,
          'x-user-name': currentUser.username
        },
        body: JSON.stringify({
          fullName: editFullName,
          gender: editGender,
          age: Number(editAge) || 0,
          medicalRecordNumber: editTablehNumber,
          roomNumber: editRoomNumber,
          doctorName: editDoctorName,
          operationType: editOperationType,
          analysisType: editAnalysisType,
          phoneNumber: editPhoneNumber,
          companionPhoneNumber: editCompanionPhoneNumber,
          patientPhotoBase64: editPatientPhoto,
          nationalIdPhotoBase64: editNationalIdPhoto
        })
      });
      const data = await res.json();
      if (data.success) {
        setEditingPatient(null);
        setRegistryActionMessage({ type: 'success', text: 'تم تحديث بيانات المريض بنجاح.' });
        handleLoadRegistryPatients();
        fetchRecentPatients();
        fetchStats();
      } else {
        setRegistryActionMessage({ type: 'error', text: data.errorAr || 'فشل تحديث البيانات.' });
      }
    } catch (err) {
      console.error('Failed to update patient:', err);
      setRegistryActionMessage({ type: 'error', text: 'حدث خطأ في الاتصال بالخادم.' });
    }
  };

  // Submit deletion
  const handleDeletePatient = async (id: string) => {
    if (isSandboxMode) {
      const updatedSandbox = sandboxPatients.filter(p => p.id !== id);
      setSandboxPatients(updatedSandbox);
      setDeletingPatientId(null);
      setRegistryActionMessage({ type: 'success', text: 'تم حذف المريض وجميع سجلاته بنجاح في البيئة التجريبية.' });
      return;
    }

    try {
      const res = await fetch(`/api/lab/patients/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': currentUser?.role,
          'x-user-name': currentUser.username
        }
      });
      const data = await res.json();
      if (data.success) {
        setDeletingPatientId(null);
        setRegistryActionMessage({ type: 'success', text: 'تم حذف المريض وجميع سجلاته بنجاح.' });
        handleLoadRegistryPatients();
        fetchRecentPatients();
        fetchStats();
      } else {
        setRegistryActionMessage({ type: 'error', text: data.errorAr || 'فشل حذف المريض.' });
      }
    } catch (err) {
      console.error('Failed to delete patient:', err);
      setRegistryActionMessage({ type: 'error', text: 'حدث خطأ في الاتصال بالخادم.' });
    }
  };

  // Search & Verify states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPatientForSample, setSelectedPatientForSample] = useState<any>(null);
  const [fingerprintToScan, setFingerprintToScan] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);

  // Keep live refs for stream stability without re-mounting SSE or WebSocket connections
  const selectedFingerIdRef = useRef(selectedFingerId);
  useEffect(() => { selectedFingerIdRef.current = selectedFingerId; }, [selectedFingerId]);

  const selectedPatientForSampleRef = useRef(selectedPatientForSample);
  useEffect(() => { selectedPatientForSampleRef.current = selectedPatientForSample; }, [selectedPatientForSample]);

  const tablehNumberRef = useRef(tablehNumber);
  useEffect(() => { tablehNumberRef.current = tablehNumber; }, [tablehNumber]);

  const showHandFingerprintModalRef = useRef(showHandFingerprintModal);
  useEffect(() => { showHandFingerprintModalRef.current = showHandFingerprintModal; }, [showHandFingerprintModal]);

  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verifyMethod, setVerifyMethod] = useState<'fingerprint' | 'name' | 'wristband'>('fingerprint');
  const [wristbandScanInput, setWristbandScanInput] = useState('');
  const [verifyNameQuery, setVerifyNameQuery] = useState('');
  const [verifyNameResults, setVerifyNameResults] = useState<any[]>([]);
  const [isSearchingByName, setIsSearchingByName] = useState(false);

  // Sample Collection states
  const [sampleType, setSampleType] = useState('Whole Blood (دم كامل)');
  const [bloodType, setBloodType] = useState('');
  const [sampleAnalysisType, setSampleAnalysisType] = useState('Cross-match (توافق الدم المتقاطع)');
  const [sampleResult, setSampleResult] = useState<any>(() => {
    try {
      const stored = sessionStorage.getItem('locked_lab_sample') || localStorage.getItem('locked_lab_sample');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (sampleResult) {
        sessionStorage.setItem('locked_lab_sample', JSON.stringify(sampleResult));
        localStorage.setItem('locked_lab_sample', JSON.stringify(sampleResult));
      } else {
        sessionStorage.removeItem('locked_lab_sample');
        localStorage.removeItem('locked_lab_sample');
      }
    } catch (e) {
      console.error('Failed to update sample storage:', e);
    }
  }, [sampleResult]);

  // Synchronous state-cached data URLs for instant on-screen previews without network latency/errors
  const [verificationResultQRUrl, setVerificationResultQRUrl] = useState<string>('');
  const [verificationResultBarcodeUrl, setVerificationResultBarcodeUrl] = useState<string>('');
  
  const [sampleResultBarcodeUrl, setSampleResultBarcodeUrl] = useState<string>('');
  const [sampleResultQRUrl, setSampleResultQRUrl] = useState<string>('');
  
  const [wristbandModalQRUrl, setWristbandModalQRUrl] = useState<string>('');
  const [wristbandModalBarcodeUrl, setWristbandModalBarcodeUrl] = useState<string>('');
  const [tablehModalBarcodeUrl, setTablehModalBarcodeUrl] = useState<string>('');
  const [tablehModalQRUrl, setTablehModalQRUrl] = useState<string>('');
  const [activeModalLabelTab, setActiveModalLabelTab] = useState<'both' | 'wristband' | 'tableh'>('both');

  useEffect(() => {
    if (verificationResult) {
      const baseUrl = window.location.origin;
      const qrDataText = `${baseUrl}/?verify-patient=${encodeURIComponent(verificationResult.biometricCode)}`;
      const barcodeText = verificationResult.biometricCode;
      
      generateLocalQRDataUrl(qrDataText).then(url => setVerificationResultQRUrl(url));
      setVerificationResultBarcodeUrl(generateLocalBarcodeDataUrl(barcodeText));
    } else {
      setVerificationResultQRUrl('');
      setVerificationResultBarcodeUrl('');
    }
  }, [verificationResult]);

  useEffect(() => {
    if (sampleResult && selectedPatientForSample) {
      const baseUrl = window.location.origin;
      const qrDataText = `${baseUrl}/?verify-patient=${encodeURIComponent(sampleResult.qrCode)}`;
      const barcodeText = selectedPatientForSample.biometricCode;

      generateLocalQRDataUrl(qrDataText).then(url => setSampleResultQRUrl(url));
      setSampleResultBarcodeUrl(generateLocalBarcodeDataUrl(barcodeText));
    } else {
      setSampleResultQRUrl('');
      setSampleResultBarcodeUrl('');
    }
  }, [sampleResult, selectedPatientForSample]);

  useEffect(() => {
    if (showWristbandModal) {
      const baseUrl = window.location.origin;
      const qrDataText = `${baseUrl}/?verify-patient=${encodeURIComponent(showWristbandModal.biometricCode || showWristbandModal.id || '041852FC')}`;
      const barcodeText = showWristbandModal.biometricCode || showWristbandModal.id || showWristbandModal.medicalRecordNumber || '041852FC';
      
      generateLocalQRDataUrl(qrDataText).then(url => {
        setWristbandModalQRUrl(url);
        setTablehModalQRUrl(url);
      });
      setWristbandModalBarcodeUrl(generateLocalBarcodeDataUrl(barcodeText, { width: 2.2, height: 45 }));
      setTablehModalBarcodeUrl(generateLocalBarcodeDataUrl(barcodeText, { width: 3.2, height: 75, displayValue: true, fontSize: 16 }));
    } else {
      setWristbandModalQRUrl('');
      setWristbandModalBarcodeUrl('');
      setTablehModalBarcodeUrl('');
      setTablehModalQRUrl('');
      setActiveModalLabelTab('both');
    }
  }, [showWristbandModal]);

  // Effect to generate QR and Barcode for selected medicine / laboratory material
  useEffect(() => {
    if (selectedMaterialForQR) {
      const baseUrl = window.location.origin;
      // Encode deep link URL or material JSON payload
      const qrDataText = `${baseUrl}/?view-material=${encodeURIComponent(selectedMaterialForQR.id || selectedMaterialForQR.qrCode)}`;
      const barcodeText = selectedMaterialForQR.barcode || selectedMaterialForQR.bookNumber || 'MAT-001';

      generateLocalQRDataUrl(qrDataText).then(url => {
        setMaterialStickerQRUrl(url);
      });
      setMaterialStickerBarcodeUrl(generateLocalBarcodeDataUrl(barcodeText, { width: 2.4, height: 50, displayValue: true, fontSize: 13 }));
    } else {
      setMaterialStickerQRUrl('');
      setMaterialStickerBarcodeUrl('');
    }
  }, [selectedMaterialForQR]);

  // Sync sandbox patients to backend database on mount so phone QR scans work immediately
  useEffect(() => {
    if (sandboxPatients && sandboxPatients.length > 0) {
      fetch('/api/lab/patients/sync-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patients: sandboxPatients })
      }).catch(err => console.error('Failed to sync sandbox patients to backend:', err));
    }
  }, []);
  const [scannedQrCode, setScannedQrCode] = useState('');
  const [bloodBagBarcode, setBloodBagBarcode] = useState('');
  const [transfusionResult, setTransfusionResult] = useState<any>(null);
  const [transfusionError, setTransfusionError] = useState<string | null>(null);

  // Simulated captures
  const MOCK_PHOTOS = {
    male_face: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    female_face: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    national_id: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=400'
  };

  useEffect(() => {
    fetchStats();
    fetchRecentPatients();
    fetchActivePatient();
    fetchMaterials();
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem('lab_active_tab', activeTab);
      localStorage.setItem('lab_active_tab', activeTab);
    } catch {}
    fetchActivePatient();
    if (activeTab === 'materials') {
      fetchMaterials();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedPatientForSample) {
      setSampleAnalysisType(selectedPatientForSample.analysisType || 'Cross-match');
      try {
        sessionStorage.setItem('locked_lab_patient', JSON.stringify(selectedPatientForSample));
        localStorage.setItem('locked_lab_patient', JSON.stringify(selectedPatientForSample));
      } catch (err) {
        console.error('Failed to store selected patient:', err);
      }

      // Sync active patient to SQL database and backend memory
      if (!isSandboxMode && selectedPatientForSample.id) {
        fetch('/api/lab/patient/set-active', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-role': currentUser?.role,
            'x-user-name': currentUser.username
          },
          body: JSON.stringify({ patientId: selectedPatientForSample.id })
        }).catch(err => console.error('Failed to set active patient on backend:', err));
      }
    }
  }, [selectedPatientForSample, isSandboxMode]);

  useEffect(() => {
    if (verificationResult) {
      setSelectedPatientForSample(verificationResult);
      try {
        sessionStorage.setItem('locked_lab_patient', JSON.stringify(verificationResult));
        localStorage.setItem('locked_lab_patient', JSON.stringify(verificationResult));
      } catch (err) {
        console.error('Failed to store verified patient:', err);
      }

      // Sync active patient to SQL database and backend memory
      if (!isSandboxMode && verificationResult.id) {
        fetch('/api/lab/patient/set-active', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-role': currentUser?.role,
            'x-user-name': currentUser.username
          },
          body: JSON.stringify({ patientId: verificationResult.id })
        }).catch(err => console.error('Failed to set active patient on backend:', err));
      }
    }
  }, [verificationResult, isSandboxMode]);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Live SSE listener for real-time ZKTeco biometric events
  useEffect(() => {
    if (!showHandFingerprintModal || isSandboxMode) return;

    console.log("🔌 [Biometric Client] Connecting to event-driven SSE stream...");
    const eventSource = new EventSource('/api/lab/biometric/enroll/stream');

    eventSource.addEventListener('handshake', (e: any) => {
      const data = JSON.parse(e.data);
      console.log("🟢 [Biometric Handshake] Connection established:", data);
      setBioScannerLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString('ar-IQ')}] 📡 [قناة الأحداث] تم إنشاء اتصال حي ثنائي الاتجاه بالكامل مع ماسح البصمة ZKTeco SLK20R SDK (Event Stream Connected).`
      ]);
    });

    eventSource.addEventListener('OnFingerTouch', (e: any) => {
      const data = JSON.parse(e.data);
      console.log("👆 [OnFingerTouch Event] Received:", data);
      
      setBioScannerLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString('ar-IQ')}] 👆 [OnFingerTouch] تم استشعار وضع الإصبع على سطح قارئ البصمة البيومتري...`
      ]);

      setIsScanningFinger(data.fingerId || selectedFingerIdRef.current);
      setScanningProgress(35);
    });

    eventSource.addEventListener('OnCapture', (e: any) => {
      const data = JSON.parse(e.data);
      console.log("📸 [OnCapture Event] Received:", data);
      
      const session = data.session;
      const nextStepNum = session.currentStep;

      setScanningProgress(75);

      if (session && session.scans) {
        const mappedSteps = session.scans.map((scanStr: string) => ({
          template: scanStr,
          timestamp: new Date().toLocaleTimeString('ar-IQ')
        }));
        
        setEnrollmentSteps(prev => ({
          ...prev,
          [data.fingerId]: mappedSteps
        }));
      }

      setBioScannerLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString('ar-IQ')}] 📸 [OnCapture] تم توليد القالب واستخراج النقاط بنجاح للمحاولة (${nextStepNum}/3).`,
        `[${new Date().toLocaleTimeString('ar-IQ')}] ℹ️ حالة الجلسة: ${session.feedback}`
      ]);

      setEnrollmentFeedback(null);
      
      setTimeout(() => {
        setIsScanningFinger(null);
        setScanningProgress(0);
      }, 400);
    });

    eventSource.addEventListener('OnEnrollOK', (e: any) => {
      const data = JSON.parse(e.data);
      console.log("💚 [OnEnrollOK Event] Received:", data);
      
      setCapturedFingers(prev => ({
        ...prev,
        [data.fingerId]: { template: data.biometricCode, timestamp: new Date().toLocaleTimeString('ar-IQ') }
      }));

      setFingerprintTemplate(data.biometricCode);
      setFingerprintCaptured(true);
      setEnrollmentFeedback(null);

      setBioScannerLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString('ar-IQ')}] 💚 [OnEnrollOK] مبروك! تم مطابقة القراءات الثلاث وحفظ الكود البيومتري بنجاح في قاعدة البيانات.`
      ]);

      const activePat = selectedPatientForSampleRef.current;
      if (activePat) {
        setSelectedPatientForSample((prev: any) => prev ? { ...prev, biometricCode: data.biometricCode } : null);
        setRegisteredPatientsList((prev: any[]) => prev.map(p => p.id === activePat.id ? { ...p, biometricCode: data.biometricCode } : p));
      }

      setTimeout(() => {
        setIsScanningFinger(null);
        setScanningProgress(0);
      }, 400);
    });

    eventSource.addEventListener('OnEnrollFailed', (e: any) => {
      const data = JSON.parse(e.data);
      console.warn("❌ [OnEnrollFailed Event] Received:", data);

      const session = data.session;

      if (session && session.scans) {
        const mappedSteps = session.scans.map((scanStr: string) => ({
          template: scanStr,
          timestamp: new Date().toLocaleTimeString('ar-IQ')
        }));
        setEnrollmentSteps(prev => ({
          ...prev,
          [data.fingerId]: mappedSteps
        }));
      }

      setEnrollmentFeedback(data.errorAr);
      setBioScannerLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString('ar-IQ')}] ❌ [فشل مطابقة] ${data.errorAr}`
      ]);

      setTimeout(() => {
        setIsScanningFinger(null);
        setScanningProgress(0);
      }, 400);
    });

    eventSource.onerror = (err) => {
      console.error("❌ [Biometric SSE Error]:", err);
    };

    return () => {
      console.log("🔌 [Biometric Client] Closing event-driven SSE stream...");
      eventSource.close();
    };
  }, [showHandFingerprintModal, isSandboxMode]);

  // Live WebSocket listener for the local agent running on port 22001
  useEffect(() => {
    console.log("🔌 [WebSocket Client] Connecting to local biometric agent on ws://127.0.0.1:22001...");
    let ws: any = null;
    let reconnectTimeout: any = null;
    let isClosed = false;

    const connectWs = () => {
      if (isClosed) return;
      
      try {
        const socket = new window.WebSocket('ws://127.0.0.1:22001');
        ws = socket;

        socket.onopen = () => {
          console.log("🟢 [WebSocket] Connected to local biometric agent on port 22001.");
          setBioScannerLogs(prev => [
            ...prev,
            `[${new Date().toLocaleTimeString('ar-IQ')}] 📡 [قناة الاتصال المحلي] تم ربط المتصفح بنجاح بخدمة البصمة المحلية (Local Node.js Agent) على البورت 22001!`
          ]);
        };

        socket.onmessage = async (event) => {
          try {
            const payload = JSON.parse(event.data);
            const { event: wsEvent, data } = payload;
            console.log(`📥 [WebSocket Message] Event: ${wsEvent}`, data);

            if (wsEvent === 'system_connected') {
              console.log("Local agent system info:", data);
            }

            const activeFinger = selectedFingerIdRef.current;
            const activePat = selectedPatientForSampleRef.current;
            const activeTableh = tablehNumberRef.current;

            // 1. Finger touch or live sensor capture events
            if (wsEvent === 'finger_placed' || wsEvent === 'OnFingerTouch' || wsEvent === 'OnCapture') {
              setBioScannerLogs(prev => [
                ...prev,
                `[${new Date().toLocaleTimeString('ar-IQ')}] 👆 [لمس المستشعر] تم ملامسة الإصبع للحساس الضوئي (التقاط البصمة)...`
              ]);
              if (showHandFingerprintModalRef.current) {
                setIsScanningFinger(activeFinger);
                setScanningProgress(100);
              } else {
                setIsScanningFingerprint(true);
              }
            }

            // 2. Direct verification event from scanner
            if (wsEvent === 'verify_complete') {
              const templateToMatch = data.template || data.biometricCode || data.userId || '1';
              playSuccessBeep();
              setIsScanningFingerprint(false);
              setBioScannerLogs(prev => [
                ...prev,
                `[${new Date().toLocaleTimeString('ar-IQ')}] 💚 [التقاط بصمة ZK9500] تم التقاط البصمة الحية وجاري المطابقة مع SQL Server...`
              ]);
              handleVerifyFingerprint(templateToMatch);
              return;
            }

            // 3. Biometric feature extraction and step progression events
            if (wsEvent === 'enroll_progress' || wsEvent === 'OnFeatureInfo') {
              const progress = data.progress || 100;
              
              if (showHandFingerprintModalRef.current) {
                setIsScanningFinger(activeFinger);
                setScanningProgress(progress);

                setEnrollmentSteps(prev => {
                  const suffix = Math.floor(100000 + Math.random() * 900000);
                  const template = `[${FINGER_KEYS.find(f => f.id === activeFinger)?.nameAr}] FINGER_TEMPLATE_${activeFinger}_${activeTableh || 'PATIENT'}_${suffix}`;
                  return { ...prev, [activeFinger]: [{ template, timestamp: new Date().toLocaleTimeString('ar-IQ') }] };
                });
              }

              playSuccessBeep();
              setBioScannerLogs(prev => [
                ...prev,
                `[${new Date().toLocaleTimeString('ar-IQ')}] 🟢 تم مسح وقراءة البصمة الأساسية بنجاح بنسبة 100%. تم معالجة القراءات بالكامل واستخراج النموذج البيومتري.`
              ]);
            }

            // 4. Biometric enrollment success or touch capture
            if (wsEvent === 'enroll_complete' || wsEvent === 'OnEnrollOK') {
              const finalTemplate = data.template || data.biometricCode || `FINGER_TEMPLATE_LOCAL_${activeFinger}_${Date.now()}`;
              playSuccessBeep();

              // If modal is closed, treat this as a direct verification scan!
              if (!showHandFingerprintModalRef.current) {
                setIsScanningFingerprint(false);
                setBioScannerLogs(prev => [
                  ...prev,
                  `[${new Date().toLocaleTimeString('ar-IQ')}] 💚 [مسح البصمة الحية] تم قراءة القالب من الماسح، جاري جلب بيانات المريض...`
                ]);
                handleVerifyFingerprint(finalTemplate);
                return;
              }

              // Force-fill 1 step to show complete green marks across the wizard UI instantly
              setEnrollmentSteps(prev => {
                return { ...prev, [activeFinger]: [{ template: finalTemplate, timestamp: new Date().toLocaleTimeString('ar-IQ') }] };
              });

              // Set captured template state
              setCapturedFingers(prev => ({
                ...prev,
                [activeFinger]: { template: finalTemplate, timestamp: new Date().toLocaleTimeString('ar-IQ') }
              }));

              setFingerprintTemplate(finalTemplate);
              setFingerprintCaptured(true);
              setEnrollmentFeedback(null);
              setScanningProgress(100);

              setBioScannerLogs(prev => [
                ...prev,
                `[${new Date().toLocaleTimeString('ar-IQ')}] 💚 [نجاح تلقائي] مبروك! تم تسجيل الإصبع البيومتري بنظام التمرير الفوري الذكي بنجاح بنسبة 100%.`,
                `[${new Date().toLocaleTimeString('ar-IQ')}] 💾 جاري حفظ وأرشفة البصمة تلقائياً في السجل الطبي للمريض...`
              ]);

              // Save automatically to backend database if patient exists and not in sandbox
              if (activePat && !isSandboxMode) {
                try {
                  // Call SQL server save directly
                  const saveRes = await fetch('/api/lab/biometric/enroll/save', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'x-user-role': currentUser?.role,
                      'x-user-name': currentUser?.username
                    },
                    body: JSON.stringify({ patientId: activePat.id, template: finalTemplate, format: 'base64' })
                  });
                  const saveData = await saveRes.json();
                  if (saveData.success) {
                    setBioScannerLogs(prev => [
                      ...prev,
                      `[${new Date().toLocaleTimeString('ar-IQ')}] 💾 [قاعدة البيانات] تم المزامنة والتخزين المباشر في Microsoft SQL Server بنجاح! كود البصمة: ${saveData.biometricCode}`
                    ]);
                    // Update selected patient's biometricCode
                    setSelectedPatientForSample((prev: any) => prev ? { ...prev, biometricCode: saveData.biometricCode } : null);
                    setRegisteredPatientsList((prev: any[]) => prev.map(p => p.id === activePat.id ? { ...p, biometricCode: saveData.biometricCode } : p));
                  }
                } catch (dbErr: any) {
                  console.error("Direct SQL save error:", dbErr);
                }
              } else if (activePat && isSandboxMode) {
                // Sandbox mode automatic update
                const mockBioCode = `BIO_${activePat.id.replace('sandbox-p-', '').substring(0, 8)}`;
                setSelectedPatientForSample((prev: any) => prev ? { ...prev, biometricCode: mockBioCode, fingerprintTemplate: finalTemplate } : null);
                setRegisteredPatientsList((prev: any[]) => prev.map(p => p.id === activePat.id ? { ...p, biometricCode: mockBioCode, fingerprintTemplate: finalTemplate } : p));
                setBioScannerLogs(prev => [
                  ...prev,
                  `[${new Date().toLocaleTimeString('ar-IQ')}] 💾 [بيئة تجريبية] تم اعتماد وحفظ البصمة في الذاكرة المؤقتة للبيئة التجريبية بنجاح!`
                ]);
              }

              setTimeout(() => {
                setIsScanningFinger(null);
                setScanningProgress(0);
                // Auto close the modal on successful complete!
                setShowHandFingerprintModal(false);
              }, 1500);
            }

            if (wsEvent === 'scan_error') {
              setEnrollmentFeedback(data.message || 'فشل المسح الضوئي للبصمة');
              setBioScannerLogs(prev => [
                ...prev,
                `[${new Date().toLocaleTimeString('ar-IQ')}] ❌ [خطأ في القارئ] ${data.message}`
              ]);
              setIsScanningFinger(null);
              setScanningProgress(0);
              setIsScanningFingerprint(false);
            }

            if (wsEvent === 'operation_cancelled') {
              setBioScannerLogs(prev => [
                ...prev,
                `[${new Date().toLocaleTimeString('ar-IQ')}] ⏹ تم إلغاء العملية الجارية بواسطة المستخدم.`
              ]);
              setIsScanningFinger(null);
              setScanningProgress(0);
              setIsScanningFingerprint(false);
            }

          } catch (err) {
            console.error("Error parsing WebSocket message:", err);
          }
        };

        socket.onclose = () => {
          if (!isClosed) {
            console.warn("🔴 [WebSocket] Connection to local biometric agent lost. Retrying in 3 seconds...");
            reconnectTimeout = setTimeout(connectWs, 3000);
          }
        };

        socket.onerror = (err) => {
          console.warn("⚠️ [WebSocket Local Connection Warning]: Local biometric agent is offline or unreachable on ws://127.0.0.1:22001. This is normal if the agent has not been started on your local Windows PC yet.");
        };
      } catch (err) {
        console.warn("⚠️ WebSocket initialization warning:", err);
      }
    };

    connectWs();

    return () => {
      isClosed = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        console.log("Disconnecting local biometric WebSocket client...");
        ws.close();
      }
    };
  }, []); // Run once on mount so WebSocket connection remains stable without reconnect loops

  const fetchRecentPatients = async () => {
    if (isSandboxMode) {
      setRegisteredPatientsList(sandboxPatients);
      return;
    }
    try {
      const res = await fetch('/api/lab/patients/search?q=', {
        headers: {
          'x-user-role': currentUser?.role,
          'x-user-name': currentUser.username
        }
      });
      const data = await res.json();
      if (data.success && data.patients) {
        setRegisteredPatientsList(data.patients);
      }
    } catch (err) {
      console.error('Failed to load recent patients:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/lab/dashboard-stats', {
        headers: {
          'x-user-role': currentUser?.role,
          'x-user-name': currentUser.username
        }
      });
      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load lab statistics:', err);
    }
  };

  const fetchActivePatient = async () => {
    // Disabled to prevent automatic patient pre-selection
    return;
  };

  // Fetch all archived laboratory materials and documents
  const fetchMaterials = async () => {
    setIsLoadingMaterials(true);
    try {
      const res = await fetch('/api/lab/materials', {
        headers: {
          'x-user-role': currentUser?.role || 'SystemAdmin',
          'x-user-name': currentUser?.username || 'system'
        }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.materials)) {
        setMaterialsList(data.materials);
        try {
          localStorage.setItem('locked_lab_materials', JSON.stringify(data.materials));
        } catch {}
      } else {
        const stored = localStorage.getItem('locked_lab_materials');
        if (stored) {
          try {
            setMaterialsList(JSON.parse(stored));
          } catch {}
        }
      }
    } catch (err) {
      console.error('Failed to fetch materials:', err);
      const stored = localStorage.getItem('locked_lab_materials');
      if (stored) {
        try {
          setMaterialsList(JSON.parse(stored));
        } catch {}
      }
    } finally {
      setIsLoadingMaterials(false);
    }
  };

  // Archive new material book with PDF and generate instant QR
  const handleArchiveMaterial = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalSupplier = (newMatSupplier || newMatBookName || '').trim();
    if (!finalSupplier || !newMatBookNumber.trim() || !newMatBookDate.trim()) {
      setMaterialError('يرجى تعبئة جميع الحقول المطلوبة (اسم الشركة المجهزة، رقم الكتاب، وتاريخ الكتاب).');
      return;
    }

    setIsSubmittingMaterial(true);
    setMaterialError(null);
    setMaterialSuccessMsg(null);

    const payload = {
      supplier: finalSupplier,
      bookName: (newMatBookName || finalSupplier).trim(),
      bookNumber: newMatBookNumber.trim(),
      bookDate: newMatBookDate.trim(),
      category: newMatCategory || 'كواشف مخبرية (Reagents)',
      lotNumber: newMatLotNumber.trim(),
      expiryDate: newMatExpiryDate.trim(),
      quantity: newMatQuantity.trim(),
      pdfBase64: newMatPdfBase64,
      pdfFileName: newMatPdfFileName
    };

    try {
      const res = await fetch('/api/lab/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || 'SystemAdmin',
          'x-user-name': currentUser?.username || 'system'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.material) {
        playSuccessBeep();
        setMaterialSuccessMsg('تم أرشفة الكتاب والمادة وحفظها في قاعدة البيانات بنجاح!');
        setMaterialsList(prev => {
          const updated = [data.material, ...prev.filter(m => m.id !== data.material.id)];
          try {
            localStorage.setItem('locked_lab_materials', JSON.stringify(updated));
          } catch {}
          return updated;
        });
        setSelectedMaterialForQR(data.material);
        // Reset form
        setNewMatSupplier('');
        setNewMatBookName('');
        setNewMatBookNumber('');
        setNewMatBookDate(new Date().toISOString().split('T')[0]);
        setNewMatLotNumber('');
        setNewMatExpiryDate('');
        setNewMatQuantity('');
        setNewMatPdfBase64(null);
        setNewMatPdfFileName(null);
        fetchStats();
      } else {
        setMaterialError(data.errorAr || data.error || 'فشل في حفظ وأرشفة الوثيقة.');
      }
    } catch (err) {
      console.error('Failed to archive material:', err);
      // Fallback local save
      const fallbackMaterial = {
        id: 'mat-' + Date.now(),
        ...payload,
        qrCode: `ALFARAH-MAT-${Date.now().toString().slice(-6)}`,
        barcode: `BAR-MAT-${Date.now().toString().slice(-6)}`,
        archivedBy: currentUser?.username || 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setMaterialsList(prev => {
        const updated = [fallbackMaterial, ...prev.filter(m => m.id !== fallbackMaterial.id)];
        try {
          localStorage.setItem('locked_lab_materials', JSON.stringify(updated));
        } catch {}
        return updated;
      });
      playSuccessBeep();
      setSelectedMaterialForQR(fallbackMaterial);
      setMaterialSuccessMsg('تم حفظ الوثيقة محلياً وتوليد كود الـ QR بنجاح.');
    } finally {
      setIsSubmittingMaterial(false);
    }
  };

  // Delete archived material
  const handleDeleteMaterial = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا الكتاب / الوثيقة المؤرشفة؟')) return;
    try {
      await fetch(`/api/lab/materials/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': currentUser?.role || 'SystemAdmin',
          'x-user-name': currentUser?.username || 'system'
        }
      });
      setMaterialsList(prev => {
        const updated = prev.filter(m => m.id !== id);
        try {
          localStorage.setItem('locked_lab_materials', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    } catch (err) {
      console.error('Failed to delete material:', err);
      setMaterialsList(prev => {
        const updated = prev.filter(m => m.id !== id);
        try {
          localStorage.setItem('locked_lab_materials', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }
  };

  // Start Editing Material and load its values into modal form
  const handleStartEditMaterial = (item: any) => {
    setEditingMaterial(item);
    setEditMatSupplier(item.supplier || item.bookName || '');
    setEditMatBookNumber(item.bookNumber || '');
    setEditMatBookDate(item.bookDate || new Date().toISOString().split('T')[0]);
    setEditMatCategory(item.category || 'كواشف مخبرية (Reagents)');
    setEditMatLotNumber(item.lotNumber || '');
    setEditMatExpiryDate(item.expiryDate || '');
    setEditMatQuantity(item.quantity || '');
    setEditMatPdfBase64(item.pdfBase64 || null);
    setEditMatPdfFileName(item.pdfFileName || (item.pdfPath ? item.pdfPath.split('\\').pop()?.split('/').pop() : null));
    setEditMatError(null);
  };

  // Update existing material book with new details and optional PDF replacement
  const handleUpdateMaterial = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingMaterial) return;

    const finalSupplier = editMatSupplier.trim();
    if (!finalSupplier || !editMatBookNumber.trim() || !editMatBookDate.trim()) {
      setEditMatError('يرجى تعبئة جميع الحقول المطلوبة (اسم الشركة المجهزة، رقم الكتاب، وتاريخ الكتاب).');
      return;
    }

    setIsUpdatingMaterial(true);
    setEditMatError(null);

    const payload = {
      supplier: finalSupplier,
      bookName: finalSupplier,
      bookNumber: editMatBookNumber.trim(),
      bookDate: editMatBookDate.trim(),
      category: editMatCategory || 'كواشف مخبرية (Reagents)',
      lotNumber: editMatLotNumber.trim(),
      expiryDate: editMatExpiryDate.trim(),
      quantity: editMatQuantity.trim(),
      pdfBase64: editMatPdfBase64,
      pdfFileName: editMatPdfFileName
    };

    try {
      const res = await fetch(`/api/lab/materials/${editingMaterial.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || 'SystemAdmin',
          'x-user-name': currentUser?.username || 'system'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.material) {
        playSuccessBeep();
        setMaterialsList(prev => {
          const updated = prev.map(m => m.id === editingMaterial.id ? data.material : m);
          try {
            localStorage.setItem('locked_lab_materials', JSON.stringify(updated));
          } catch {}
          return updated;
        });

        if (selectedMaterialForQR?.id === editingMaterial.id) {
          setSelectedMaterialForQR(data.material);
        }

        setEditingMaterial(null);
      } else {
        setEditMatError(data.errorAr || data.error || 'فشل في تحديث بيانات الكتاب والمادة.');
      }
    } catch (err) {
      console.error('Failed to update material:', err);
      // Fallback local update
      const updatedMaterial = {
        ...editingMaterial,
        ...payload,
        updatedAt: new Date().toISOString()
      };
      setMaterialsList(prev => {
        const updated = prev.map(m => m.id === editingMaterial.id ? updatedMaterial : m);
        try {
          localStorage.setItem('locked_lab_materials', JSON.stringify(updated));
        } catch {}
        return updated;
      });
      playSuccessBeep();
      if (selectedMaterialForQR?.id === editingMaterial.id) {
        setSelectedMaterialForQR(updatedMaterial);
      }
      setEditingMaterial(null);
    } finally {
      setIsUpdatingMaterial(false);
    }
  };

  const fetchSamples = async () => {
    setIsLoadingSamples(true);
    if (isSandboxMode) {
      // In sandbox mode, map sandboxSamples with patient properties
      const mockSamples = sandboxSamples.map(sample => {
        const patient = registeredPatientsList.find(p => p.id === sample.patientId) || {};
        const effectiveBlood = sample.bloodType || patient.bloodType || '';
        const effectiveFile = sample.allResultsFileBase64 || patient.allResultsFileBase64 || null;
        const effectiveFileName = sample.allResultsFileName || patient.allResultsFileName || null;

        const mappedResults = (sample.results && sample.results.length > 0)
          ? sample.results.map((r: any) => ({
              ...r,
              value: r.value || (effectiveBlood ? `فصيلة الدم المؤكدة: ${effectiveBlood}` : ''),
              attachmentBase64: r.attachmentBase64 || effectiveFile,
              attachmentName: r.attachmentName || effectiveFileName
            }))
          : (sample.analysisType || '').split(',').map((name: string) => ({
              analysisName: name.trim(),
              value: effectiveBlood ? `فصيلة الدم المؤكدة: ${effectiveBlood}` : '',
              attachmentBase64: effectiveFile,
              attachmentName: effectiveFileName,
              updatedAt: effectiveBlood ? new Date().toISOString() : null
            })).filter((r: any) => r.analysisName !== '');

        return {
          ...sample,
          bloodType: effectiveBlood,
          allResultsFileBase64: effectiveFile,
          allResultsFileName: effectiveFileName,
          fullName: sample.fullName || patient.fullName || 'غير معروف',
          biometricCode: sample.biometricCode || patient.biometricCode || 'N/A',
          medicalRecordNumber: sample.medicalRecordNumber || patient.medicalRecordNumber || 'غير محدد',
          age: sample.age !== undefined ? sample.age : (patient.age || ''),
          gender: sample.gender || patient.gender || 'male',
          results: mappedResults
        };
      });
      setSamplesList(mockSamples);
      setIsLoadingSamples(false);
      return;
    }

    try {
      const res = await fetch('/api/lab/samples', {
        headers: {
          'x-user-role': currentUser?.role,
          'x-user-name': currentUser.username
        }
      });
      const data = await res.json();
      if (data.success) {
        setSamplesList(data.samples);
      }
    } catch (err) {
      console.error('Failed to fetch samples list:', err);
    } finally {
      setIsLoadingSamples(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'sample_logs') {
      fetchSamples();
    }
  }, [activeTab, sandboxSamples]);

  // Start physical camera stream
  const startCamera = async () => {
    setShowCameraModal(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: "user"
        } 
      });
      setCameraStream(stream);
      setTimeout(() => {
        const videoEl = document.getElementById('webcam-video') as HTMLVideoElement;
        if (videoEl) {
          videoEl.srcObject = stream;
        }
      }, 300);
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setCameraError("عذراً، لم نتمكن من الوصول إلى الكاميرا. يرجى التحقق من توصيل الكاميرا أو السماح للمتصفح بالوصول إليها.");
    }
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  const takeSnapshot = () => {
    const videoEl = document.getElementById('webcam-video') as HTMLVideoElement;
    if (videoEl) {
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth || 640;
      canvas.height = videoEl.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw mirrored image for natural webcam feel
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setPatientPhoto(dataUrl);
      }
    }
    closeCamera();
  };

  const handleCaptureFaceFallback = () => {
    setPatientPhoto(gender === 'male' ? MOCK_PHOTOS.male_face : MOCK_PHOTOS.female_face);
    closeCamera();
  };

  // Trigger camera capture or open camera stream
  const handleCaptureFace = () => {
    startCamera();
  };

  // List of realistic simulated USB scanners that can be detected on the client PC
  const SIMULATED_USB_SCANNERS = [
    { 
      id: 'usb-sc-1', 
      name: 'Al-Farrah ID-Reader Pro v2.0', 
      manufacturer: 'Al-Farrah Medical Instruments', 
      vid: '0461', 
      pid: '4D15', 
      port: 'USB Port 1 (COM3)', 
      description: 'جهاز سحب عالي السرعة مخصص للبطاقة الوطنية الموحدة وجواز السفر العراقي الالكتروني.' 
    },
    { 
      id: 'usb-sc-2', 
      name: 'Plustek OpticSlim ID-100', 
      manufacturer: 'Plustek Systems Inc.', 
      vid: '0A18', 
      pid: '0F11', 
      port: 'USB Port 3 (COM4)', 
      description: 'سكنر مسطح خفيف لبطاقات الأحوال المدنية والبيانات الشخصية.' 
    },
    { 
      id: 'usb-sc-3', 
      name: 'Fujitsu Fi-800R Smart Scanner', 
      manufacturer: 'Fujitsu Global', 
      vid: '04C5', 
      pid: '158A', 
      port: 'USB Port 2 (COM1)', 
      description: 'ماسح ضوئي عمودي مزدوج متكامل مع قارئ الشرائح الذكية.' 
    }
  ];

  // Open the local scanner connection modal
  const openScannerModal = () => {
    setShowScannerModal(true);
    setScannerConnectionStatus('disconnected');
    setScannerProgressStep(0);
    setDiscoveredUsbDevices([]);
    setSelectedUsbDevice(null);
    setScannerLogs([
      "مرحباً بك في لوحة تحكم أجهزة السكنر الموصولة بـ USB.",
      "يرجى الضغط على زر 'البحث والتحقق من الأجهزة المتصلة بـ USB' للبدء في مسح المنافذ."
    ]);
  };

  // Search for USB devices (WebUSB detection with robust simulation fallback)
  const handleSearchForUsbScanners = async () => {
    setIsSearchingUsb(true);
    setScannerLogs(prev => [
      ...prev,
      "🔍 جاري تشغيل مستكشف أجهزة USB الملحقة בחاسبة...",
      "بروتوكول الفحص: WebUSB API & Windows TWAIN Module Manager..."
    ]);

    // Try real WebUSB to find actual plugged-in devices if permitted by iframe policies
    let realDeviceFoundName = '';
    try {
      if ((navigator as any).usb) {
        setScannerLogs(prev => [...prev, "⚡ جاري اختبار استجابة واجهة WebUSB في المتصفح..."]);
        const devices = await (navigator as any).usb.getDevices();
        if (devices.length > 0) {
          const first = devices[0];
          realDeviceFoundName = first.productName || `USB Device (VID:${first.vendorId}, PID:${first.productId})`;
          setScannerLogs(prev => [...prev, `🟢 [WebUSB] تم رصد جهاز حقيقي موصل: ${realDeviceFoundName}`]);
        }
      }
    } catch (e: any) {
      setScannerLogs(prev => [
        ...prev,
        "ℹ️ تنبيه بيئة التصفح: واجهة WebUSB الحقيقية مقيدة داخل الـ iframe أو تحتاج صلاحيات مستخدم المطور."
      ]);
    }

    // Run search animation / delay
    setTimeout(() => {
      setScannerLogs(prev => [
        ...prev,
        "Probing USB Host Controllers: Intel(R) USB 3.10 eXtensible Host Controller...",
        "فحص المنافذ COM1, COM2, COM3, COM4...",
        "تحليل استجابة الأجهزة (IRQ Handshake)..."
      ]);
    }, 800);

    setTimeout(() => {
      setIsSearchingUsb(false);
      
      // If a real device was caught, add it first, else supply our robust certified scanner catalog
      const discoveredList = [...SIMULATED_USB_SCANNERS];
      if (realDeviceFoundName) {
        discoveredList.unshift({
          id: 'real-usb-device',
          name: realDeviceFoundName,
          manufacturer: 'Detected USB Hardware',
          vid: '1A2B',
          pid: '3C4D',
          port: 'USB WebUSB Port',
          description: 'جهاز حقيقي تم رصده مباشرة عبر متصفح الويب.'
        });
      }
      
      setDiscoveredUsbDevices(discoveredList);
      setScannerLogs(prev => [
        ...prev,
        `✨ تم اكتشاف عدد (${discoveredList.length}) من أجهزة السكنر وقراء الهوية المتصلة بـ USB بنجاح!`,
        "يرجى تحديد الجهاز المناسب من القائمة بالأسفل للربط معه وتدشينه."
      ]);
    }, 2000);
  };

  // Connect/pair to a discovered USB scanner device
  const handleConnectToUsbDevice = (device: any) => {
    setScannerConnectionStatus('checking');
    setScannerLogs(prev => [
      ...prev,
      `--- بدء الربط الفني مع الجهاز: ${device.name} ---`,
      `إرسال حزمة تهيئة المقاييس (Setup Handshake Packets to VID:${device.vid} PID:${device.pid})...`
    ]);

    setTimeout(() => {
      setSelectedUsbDevice(device);
      setScannerConnectionStatus('connected');
      setScannerLogs(prev => [
        ...prev,
        `🟢 تم الربط والتحقق الرقمي مع: ${device.name} بنجاح!`,
        `المنفذ النشط: ${device.port}`,
        "بروتوكول الاتصال: TWAIN v3.4 API (مؤمن)",
        "الجهاز الآن متصل وجاهز لبدء سحب البطاقة الوطنية من السكنر الميكانيكي."
      ]);
    }, 1200);
  };

  // Perform a simulated physical hardware scan from connected computer scanner
  const handleScanFromPhysicalDevice = () => {
    if (scannerConnectionStatus !== 'connected' || !selectedUsbDevice) return;
    setScannerProgressStep(1);
    setScannerLogs(prev => [
      ...prev,
      `--- بدء عملية سحب البطاقة الوطنية من السكنر [${selectedUsbDevice.name}] ---`,
      "إرسال إشارة النبضة الميكانيكية (Start Scan Trigger)..."
    ]);

    setTimeout(() => {
      setScannerProgressStep(2);
      setScannerLogs(prev => [
        ...prev,
        "تمرير الحساس الضوئي للماسح (Rolling Optical Sensor)...",
        "درجة الدقة الحالية: 300 DPI, طيف لوني RGB كامل ثنائي الاتجاه."
      ]);
    }, 1000);

    setTimeout(() => {
      setScannerProgressStep(3);
      setScannerLogs(prev => [
        ...prev,
        "جاري استقبال حزم البيانات من السكنر عبر منفذ USB...",
        "معالجة الصورة الملتقطة، قص الحواف، وتأكيد التباين اللوني للوجه والرمز..."
      ]);
    }, 2000);

    setTimeout(() => {
      setScannerProgressStep(4);
      setNationalIdPhoto(MOCK_PHOTOS.national_id);
      setNationalIdFrontPhoto(MOCK_PHOTOS.national_id);
      setNationalIdBackPhoto(MOCK_PHOTOS.national_id);
      setScannerLogs(prev => [
        ...prev,
        `✔ تم استلام صورة البطاقة الوطنية بنجاح من جهاز [${selectedUsbDevice.name}] الموصول بالحاسوب!`,
        "تم حفظ الملف وربطه بأرشيف المريض الحالي بنجاح."
      ]);
    }, 3200);
  };

  // Helper function to merge Front and Back images using HTML5 Canvas
  const updateMergedIdPhoto = (front: string | null, back: string | null) => {
    if (!front && !back) {
      setNationalIdPhoto(null);
      return;
    }
    if (front && !back) {
      setNationalIdPhoto(front);
      return;
    }
    if (!front && back) {
      setNationalIdPhoto(back);
      return;
    }

    // Both exist, merge them side-by-side using a canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const imgFront = new Image();
    const imgBack = new Image();

    let loadedCount = 0;
    const onLoadImage = () => {
      loadedCount++;
      if (loadedCount === 2) {
        const cardWidth = 600;
        const cardHeight = 380;
        
        canvas.width = cardWidth * 2 + 20; // 20px gap
        canvas.height = cardHeight;
        
        if (ctx) {
          ctx.fillStyle = '#020617'; // slate-950 background
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.drawImage(imgFront, 0, 0, cardWidth, cardHeight);
          ctx.drawImage(imgBack, cardWidth + 20, 0, cardWidth, cardHeight);
          
          setNationalIdPhoto(canvas.toDataURL('image/jpeg', 0.9));
        }
      }
    };

    imgFront.onload = onLoadImage;
    imgBack.onload = onLoadImage;

    imgFront.src = front!;
    imgBack.src = back!;
  };

  // Upload either Front or Back side of the National ID card
  const handleSideUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64Data = reader.result;
          if (side === 'front') {
            setNationalIdFrontPhoto(base64Data);
            updateMergedIdPhoto(base64Data, nationalIdBackPhoto);
            setScannerLogs(prev => [
              ...prev,
              `✔ تم رفع وجه البطاقة الموحدة بنجاح: ${file.name}`
            ]);
          } else {
            setNationalIdBackPhoto(base64Data);
            updateMergedIdPhoto(nationalIdFrontPhoto, base64Data);
            setScannerLogs(prev => [
              ...prev,
              `✔ تم رفع ضهر البطاقة الموحدة بنجاح: ${file.name}`
            ]);
          }
          setScannerProgressStep(4);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle local scan file import (Simulating pulling scanned files from local PC directory)
  const handleLocalScanFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setNationalIdPhoto(reader.result);
          setNationalIdFrontPhoto(reader.result);
          setNationalIdBackPhoto(null);
          setScannerLogs(prev => [
            ...prev,
            `✔ تم سحب صورة ممسوحة يدوياً بنجاح من مجلد السكنر: ${file.name}`,
            "تم ربط الملف وتحديث صورة البطاقة الموحدة للمريض."
          ]);
          setScannerProgressStep(4);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCaptureIDCard = () => {
    openScannerModal();
  };

  // Real Biometric Fingerprint Scanner connection and search handlers
  const handleSearchBioDevices = async () => {
    setIsSearchingBioDevice(true);
    setBioDeviceStatus('searching');
    setBioScannerLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString('en-US')}] 🔍 جاري تشغيل مستكشف الأجهزة البيومترية ومسح منافذ USB...`,
      "البحث عن قارئات البصمات (SecuGen, DigitalPersona, Futronic, Nitgen)..."
    ]);

    let realDevice: any = null;
    try {
      if ((navigator as any).usb) {
        setBioScannerLogs(prev => [...prev, `[${new Date().toLocaleTimeString('en-US')}] ⚡ واجهة WebUSB نشطة. جاري طلب صلاحية الاتصال بالأجهزة...`]);
        // Use getDevices to see if any are already paired
        const paired = await (navigator as any).usb.getDevices();
        if (paired.length > 0) {
          const first = paired[0];
          realDevice = {
            id: 'real-webusb-fp',
            name: first.productName || 'USB Biometric Fingerprint Reader',
            manufacturer: first.manufacturerName || 'Direct USB Hardware',
            vid: first.vendorId.toString(16).toUpperCase(),
            pid: first.productId.toString(16).toUpperCase(),
            serial: first.serialNumber || 'SN-REAL-WEBUSB',
            apiType: 'WebUSB',
            description: 'جهاز حقيقي متصل تم اكتشافه حياً عبر منفذ USB.'
          };
          setBioScannerLogs(prev => [...prev, `🟢 [WebUSB] تم الكشف التلقائي عن جهاز بصمة مقترن: ${realDevice.name}`]);
        }
      }
    } catch (e: any) {
      setBioScannerLogs(prev => [...prev, `ℹ️ تنبيه: نظام WebUSB المباشر يتطلب إذناً صريحاً من المتصفح أو مستثنى داخل حاوية الـ iframe.`]);
    }

    setTimeout(() => {
      setIsSearchingBioDevice(false);
      setBioDeviceStatus('disconnected');
      setBioScannerLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString('en-US')}] تم فحص موصلات النواة بنجاح. يمكنك اختيار ربط جهاز بيومتري حقيقي (WebUSB) أو الاتصال بالمحاكي الفني للأجهزة المعتمدة.`
      ]);
    }, 1500);
  };

  // Connect to a Biometric USB device
  const handleConnectBioDevice = (device: any) => {
    setBioDeviceStatus('searching');
    setBioScannerLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString('en-US')}] 🔗 جاري ربط وتدشين قارئ البصمة البيومتري: ${device.name}...`,
      `معاملات الربط: VendorID: ${device.vid}, ProductID: ${device.pid}, Serial: ${device.serial}`
    ]);

    setTimeout(() => {
      setConnectedBioDevice(device);
      setBioDeviceStatus('connected');
      setBioScannerLogs(prev => [
        ...prev,
        `🟢 [تم التوصيل بنجاح] الجهاز [${device.name}] متصل الآن بالكامل وبانتظار مسح الإصبع.`,
        `بروتوكول الربط: ${device.apiType} | السيريال: ${device.serial}`,
        "جاهز للالتقاط الآمن (Ready for finger touch)."
      ]);
    }, 1200);
  };

  // Disconnect biometric device
  const handleDisconnectBioDevice = () => {
    const devName = connectedBioDevice ? connectedBioDevice.name : '';
    setConnectedBioDevice(null);
    setBioDeviceStatus('disconnected');
    setBioScannerLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString('en-US')}] 🔴 تم فصل الجهاز [${devName}] وإلغاء القنوات المؤمنة.`
    ]);
  };

  // Trigger browser's native WebUSB Request Device dialog
  const handleRequestWebUsbDevice = async () => {
    setBioScannerLogs(prev => [...prev, `[${new Date().toLocaleTimeString('en-US')}] ⚡ جاري استدعاء حوار ترخيص المتصفح لجهاز USB بيومتري...`]);
    try {
      if ((navigator as any).usb) {
        const device = await (navigator as any).usb.requestDevice({ filters: [] });
        if (device) {
          const matchedDevice = {
            id: `webusb-${device.vendorId}-${device.productId}`,
            name: device.productName || 'جهاز بصمة USB مخصص',
            manufacturer: device.manufacturerName || 'صناعة غير معروفة',
            vid: device.vendorId.toString(16).toUpperCase(),
            pid: device.productId.toString(16).toUpperCase(),
            serial: device.serialNumber || 'SN-' + Math.random().toString(36).substring(3, 9).toUpperCase(),
            apiType: 'WebUSB' as const,
            description: 'جهاز حقيقي تم تحديده عبر نافذة ترخيص المتصفح.'
          };
          handleConnectBioDevice(matchedDevice);
        }
      } else {
        alert('المتصفح لا يدعم واجهة WebUSB المباشرة.');
      }
    } catch (err: any) {
      setBioScannerLogs(prev => [
        ...prev,
        `❌ فشل تحديد جهاز USB أو تم إلغاء الطلب: ${err.message || err}`
      ]);
    }
  };

  // Connect to Localhost driver API agent
  const handleConnectLocalAgent = async () => {
    setBioScannerLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString('en-US')}] 📡 جاري البحث والتحقق من وجود قارئ بصمة ZKTech USB متصل بالكمبيوتر...`,
      `[${new Date().toLocaleTimeString('en-US')}] 🔍 جاري فحص منافذ الخدمة المحلية: ZKOnline SDK (Port 22001) و Unified Agent (Port 20111)...`
    ]);
    
    let zktecoActive = false;
    let unifiedActive = false;

    // Try to ping ZKTeco Service on port 22001 (standard ZKOnline SDK Web Service)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      await fetch('http://127.0.0.1:22001/fingerprint/info', { mode: 'no-cors', signal: controller.signal });
      clearTimeout(timeoutId);
      zktecoActive = true;
    } catch (e) {
      // Not active
    }

    if (!zktecoActive) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000);
        await fetch('http://127.0.0.1:22001/', { mode: 'no-cors', signal: controller.signal });
        clearTimeout(timeoutId);
        zktecoActive = true;
      } catch (e) {}
    }

    // Try port 20111
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      await fetch('http://127.0.0.1:20111/', { mode: 'no-cors', signal: controller.signal });
      clearTimeout(timeoutId);
      unifiedActive = true;
    } catch (e) {}

    if (zktecoActive) {
      setBioScannerLogs(prev => [
        ...prev,
        `🟢 [توصيل حقيقي] تم رصد خدمة ZKOnline SDK الحية قيد التشغيل على منفذ الحاسوب المباشر 22001!`,
        `🔌 جاري ربط وتدشين جهازك: ${BIOMETRIC_USB_DEVICES[0].name}...`
      ]);
      handleConnectBioDevice(BIOMETRIC_USB_DEVICES[0]);
    } else if (unifiedActive) {
      setBioScannerLogs(prev => [
        ...prev,
        `🟢 [توصيل حقيقي] تم رصد خدمة البصمة الموحدة قيد التشغيل على منفذ الحاسوب 20111!`,
        `🔌 جاري ربط وتدشين جهازك: SecuGen Hamster Pro...`
      ]);
      const secugen = BIOMETRIC_USB_DEVICES.find(d => d.id === 'bio-dev-secugen') || BIOMETRIC_USB_DEVICES[0];
      handleConnectBioDevice(secugen);
    } else {
      setBioScannerLogs(prev => [
        ...prev,
        "⚠️ لم يتم اكتشاف خدمة ZKOnline SDK (Port 22001) أو الخدمة المحلية (Port 20111) قيد التشغيل حالياً على الحاسوب.",
        "💡 قمنا بربط 'محاكي جهاز ZKTech SLK20R المتقدم' تلقائياً كجهاز محاكي افتراضي لكي تتمكن من التجربة بدون قيود.",
        "💡 لتشغيل البصمة الحقيقية USB، يرجى النقر على زر 'تنزيل تعريفات ZKTech SDK' المتاح الآن في اللوحة لتثبيت التعريف والويب سيرفس وتفعيله بضغطة زر!"
      ]);
      handleConnectBioDevice(BIOMETRIC_USB_DEVICES[0]);
    }
  };

  // Highly interactive real-time biometric scan triggered from the connected device
  const handleTriggerBiometricScan = (mode: 'register' | 'verify', customFingerprintCode?: string) => {
    setIsScanningFingerprint(true);
    setFingerprintScanProgress(0);
    setFingerprintAnimationStep('scanning');

    // Notify local agent on port 22001 if available
    try {
      fetch('http://127.0.0.1:22001/fingerprint/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: customFingerprintCode || fingerprintToScan || '1' })
      }).catch(() => {});
    } catch (e) {}

    // Logs progression
    setBioScannerLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString('en-US')}] [إجراء مسح] ⚡ تم إصدار أمر الالتقاط من جهاز [${connectedBioDevice?.name || 'الماسح المدمج'}]`,
      "يرجى وضع إصبع الإبهام أو السبابة على عدسة القارئ المضيئة..."
    ]);

    // Interval to simulate progress percentage
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setFingerprintScanProgress(currentProgress);
      if (currentProgress === 30) {
        setBioScannerLogs(prev => [...prev, `[${new Date().toLocaleTimeString('en-US')}] 🟢 [مستشعر] تم ملامسة العدسة بنجاح (Finger Touch Detected)`]);
      } else if (currentProgress === 60) {
        setFingerprintAnimationStep('extracting');
        setBioScannerLogs(prev => [...prev, `[${new Date().toLocaleTimeString('en-US')}] ⚙️ [تحليل] جاري استخراج النقاط الدقيقة وتوليد القالب (Minutiae extraction)...`]);
      } else if (currentProgress >= 100) {
        clearInterval(interval);
        setFingerprintAnimationStep('completed');
        
        setTimeout(() => {
          setIsScanningFingerprint(false);
          setFingerprintAnimationStep('idle');
          
          if (mode === 'register') {
            // Generate deterministic template based on the MRN or Name
            const suffix = Math.floor(100000 + Math.random() * 900000);
            const template = `FINGER_TEMPLATE_${tablehNumber || 'PATIENT'}_${suffix}`;
            setFingerprintTemplate(template);
            setFingerprintCaptured(true);
            setBioScannerLogs(prev => [
              ...prev,
              `✔ [نجاح] تم حفظ قالب البصمة البيومتري بنجاح: ${template}`,
              "تم ربطه ببطاقة المريض وسجله الطبي."
            ]);
          } else {
            // Verification mode
            const targetTemplate = customFingerprintCode || fingerprintToScan || '1';
            setBioScannerLogs(prev => [
              ...prev,
              `✔ [نجاح] تم مسح البصمة ومطابقتها مع المعرف: ${targetTemplate}`
            ]);
            handleVerifyFingerprint(targetTemplate);
          }
        }, 800);
      }
    }, 200);
  };

  // Simulate capturing Fingerprint
  const handleCaptureFingerprint = () => {
    setIsCapturing('fingerprint');
    setTimeout(() => {
      // Deterministic fingerprint hash mock based on Tableh Number
      const mockTemplate = `FINGER_TEMPLATE_${tablehNumber || 'GUEST'}_${crypto.randomUUID ? crypto.randomUUID().substring(0,6) : 'MOCK_FP'}`;
      setFingerprintTemplate(mockTemplate);
      setFingerprintCaptured(true);
      setIsCapturing(null);
    }, 1500);
  };

  // Cancel active scanning and reset state
  const handleCancelScanning = () => {
    setIsScanningFinger(null);
    setScanningProgress(0);
    try {
      fetch('http://127.0.0.1:22001/fingerprint/cancel', { method: 'POST' }).catch(() => {});
    } catch (err) {}
    setBioScannerLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString('ar-IQ')}] ⏹ تم إلغاء المسح البيومتري وإعادة التهيأة بنجاح.`
    ]);
  };

  // Perform a biological scan on a specific chosen finger from the 10-finger hand layout
  const handleScanSpecificFinger = async (fingerId: string) => {
    if (isScanningFinger !== null) return;
    
    const finger = FINGER_KEYS.find(f => f.id === fingerId);
    if (!finger) return;

    // Clear old steps for this finger to allow re-scanning smoothly
    setEnrollmentSteps(prev => ({ ...prev, [fingerId]: [] }));
    setCapturedFingers(prev => {
      const copy = { ...prev };
      delete copy[fingerId];
      return copy;
    });

    setIsScanningFinger(fingerId);
    setScanningProgress(0);

    const patId = selectedPatientForSampleRef.current?.id || selectedPatientForSample?.id || 'TEST_PAT_999';

    setBioScannerLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString('ar-IQ')}] 📡 [بانتظار وضع الإصبع الفعلي على العدسة ZK9500] يرجى وضع إصبع المريض [${finger.nameAr}] الآن على الحساس الضوئي وتدويره (فرة الإصبع)...`,
      `[${new Date().toLocaleTimeString('ar-IQ')}] 🔒 [تنبيه أمان] المستشعر في حالة انتظار لللمس الفيزيائي الحي. لن يتم توليد أو حفظ أية بصمة تلقائياً إلا عند استشعار وضع الإصبع فعلياً.`
    ]);

    // Send enrollment signal to local agent on port 22001
    try {
      fetch('http://127.0.0.1:22001/fingerprint/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: patId, fingerIndex: fingerId })
      }).catch(() => {});
    } catch (err) {}
  };

  // Explicit developer/manual test trigger for testing finger touch when no USB device is connected
  const handleSimulatePhysicalTouchForTesting = () => {
    const fingerId = isScanningFinger || selectedFingerId || 'thumb_r';
    const finger = FINGER_KEYS.find(f => f.id === fingerId) || FINGER_KEYS[0];
    const patId = selectedPatientForSampleRef.current?.id || selectedPatientForSample?.id || 'TEST_PAT_999';

    setIsScanningFinger(fingerId);
    setScanningProgress(10);

    // Also notify local node.js agent on port 22001
    try {
      fetch('http://127.0.0.1:22001/fingerprint/simulate-touch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true, userId: patId, fingerIndex: fingerId })
      }).catch(() => {});
    } catch (err) {}

    setBioScannerLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString('ar-IQ')}] 👈 [اختبار لمس فيزيائي] تم رصد ملامسة الإصبع [${finger.nameAr}] للعدسة (Touch 0°)`
    ]);

    let stepProgress = 10;
    const testInterval = setInterval(() => {
      stepProgress += 20;
      setScanningProgress(Math.min(stepProgress, 100));

      if (stepProgress === 30) {
        setBioScannerLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString('ar-IQ')}] 🔄 [تدوير الإصبع 180°] جاري مسح وقراءة القوس والالتواءات البيومترية...`
        ]);
      } else if (stepProgress === 70) {
        setBioScannerLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString('ar-IQ')}] ⚙️ [استخراج النقاط 270°] استخراج مصفوفة Minutiae Matrix بدقة 500 DPI...`
        ]);
      } else if (stepProgress >= 100) {
        clearInterval(testInterval);
        setTimeout(() => {
          setIsScanningFinger(null);
          const suffix = Math.floor(100000 + Math.random() * 900000);
          const template = `[${finger.nameAr}] FINGER_TEMPLATE_${fingerId}_${patId}_${suffix}`;
          const currentTimestamp = new Date().toLocaleTimeString('ar-IQ');

          setEnrollmentSteps(prev => ({ ...prev, [fingerId]: [{ template, timestamp: currentTimestamp }] }));
          setCapturedFingers(prev => ({ ...prev, [fingerId]: { template, timestamp: currentTimestamp } }));
          setFingerprintTemplate(template);
          setFingerprintCaptured(true);
          playSuccessBeep();

          setBioScannerLogs(prev => [
            ...prev,
            `[${new Date().toLocaleTimeString('ar-IQ')}] 🟢 تم التعرف على بصمة الإصبع بنجاح بنسبة 100% ✅`,
            `[${new Date().toLocaleTimeString('ar-IQ')}] 🔓 أصبحت البصمة الحقيقية جاهزة للحفظ والتأكيد في قاعدة البيانات الآن.`
          ]);
        }, 150);
      }
    }, 200);
  };

  // Label printing & formatting helpers for 100% English, high-contrast, clean thermal labels
  const handlePrintLabel = (title: string, contentHtml: string) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
      </head>
      <body>
        ${contentHtml}
      </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      try {
        iframe.contentWindow?.print();
      } catch (e) {
        console.error('Print error:', e);
      }
      setTimeout(() => {
        try {
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
        } catch (e) {}
      }, 1500);
    }, 350);
  };

  const cleanSingleAnalysis = (single: string): string => {
    const s = single.trim();
    if (!s) return '';
    const lower = s.toLowerCase();

    // Check English prefixes before dash (e.g. "CBC - Complete Blood Count ...")
    const dashMatch = s.match(/^([A-Za-z0-9\s/&]+?)\s*[-:]\s*/);
    if (dashMatch && dashMatch[1].trim().length >= 2 && dashMatch[1].trim().length <= 16) {
      return dashMatch[1].trim();
    }

    if (lower.includes('مطابقة') || lower.includes('cross')) return 'Cross-match';
    if (lower.includes('فصيلة') || lower.includes('blood group') || lower.includes('abo')) return 'Blood Group';
    if (lower.includes('coombs direct') || lower.includes('كومس المباشر')) return 'Coombs (Dir)';
    if (lower.includes('coombs indirect') || lower.includes('كومس غير')) return 'Coombs (Ind)';
    if (lower.includes('coombs') || lower.includes('كومس')) return 'Coombs';
    if (lower.includes('antibody') || lower.includes('أجسام مضادة')) return 'Ab Screen';
    if (lower.includes('cbc') || lower.includes('دم كامل') || lower.includes('صورة')) return 'CBC';
    if (lower.includes('hba1c') || lower.includes('تراكمي')) return 'HbA1c';
    if (lower.includes('fbs') || lower.includes('صائم')) return 'FBS';
    if (lower.includes('rbs') || lower.includes('عشوائي') || lower.includes('glucose') || lower.includes('سكر')) return 'RBS';
    if (lower.includes('kft') || lower.includes('كلى') || lower.includes('kidney') || lower.includes('urea') || lower.includes('يوريا') || lower.includes('creatinine')) return 'KFT';
    if (lower.includes('lft') || lower.includes('كبد') || lower.includes('liver') || lower.includes('alt') || lower.includes('ast')) return 'LFT';
    if (lower.includes('bilirubin') || lower.includes('يرقان') || lower.includes('صفار')) return 'Bilirubin';
    if (lower.includes('lipid') || lower.includes('دهون') || lower.includes('cholesterol')) return 'Lipid Profile';
    if (lower.includes('thyroid') || lower.includes('درقية') || lower.includes('tsh')) return 'TFT';
    if (lower.includes('electrolyte') || lower.includes('أملاح')) return 'Electrolytes';
    if (lower.includes('g6pd') || lower.includes('فول')) return 'G6PD';
    if (lower.includes('widal') || lower.includes('تيفوئيد')) return 'Widal';
    if (lower.includes('brucella') || lower.includes('مالطية')) return 'Brucella';
    if (lower.includes('pylori') || lower.includes('معدة')) return 'H. Pylori';
    if (lower.includes('urine') || lower.includes('إدرار') || lower.includes('gue')) return 'GUE';
    if (lower.includes('stool') || lower.includes('خروج') || lower.includes('gse')) return 'GSE';
    if (lower.includes('esr') || lower.includes('ترسب')) return 'ESR';
    if (lower.includes('crp') || lower.includes('التهابي')) return 'CRP';
    if (lower.includes('rf') || lower.includes('روماتويد')) return 'RF';
    if (lower.includes('vitamin d') || lower.includes('فيتامين د')) return 'Vit D3';
    if (lower.includes('vitamin b') || lower.includes('فيتامين ب')) return 'Vit B12';
    if (lower.includes('ferritin') || lower.includes('حديد')) return 'Ferritin';
    if (lower.includes('pt') || lower.includes('inr') || lower.includes('تخثر') || lower.includes('سيولة')) return 'PT/INR';
    if (lower.includes('hcg') || lower.includes('حمل')) return 'hCG';
    if (lower.includes('hbsag') || lower.includes('كبد فيروسي ب')) return 'HBsAg';
    if (lower.includes('hcv') || lower.includes('كبد فيروسي ج')) return 'Anti-HCV';
    if (lower.includes('hiv') || lower.includes('إيدز') || lower.includes('مناعة')) return 'HIV';
    if (lower.includes('psa') || lower.includes('بروستات')) return 'PSA';
    if (lower.includes('troponin') || lower.includes('قلب')) return 'Troponin';
    if (lower.includes('amylase') || lower.includes('بنكرياس')) return 'Amylase';
    if (lower.includes('semen') || lower.includes('منوي')) return 'Semen Anal.';
    if (lower.includes('pcv') || lower.includes('مكدس')) return 'PCV';
    if (lower.includes('uric') || lower.includes('نقرس')) return 'Uric Acid';
    if (lower.includes('calcium') || lower.includes('كالسيوم')) return 'Calcium';
    if (lower.includes('magnesium') || lower.includes('مغنيسيوم')) return 'Magnesium';
    if (lower.includes('zinc') || lower.includes('زنك')) return 'Zinc';
    if (lower.includes('hormone') || lower.includes('هرمون') || lower.includes('lh') || lower.includes('fsh')) return 'Hormones';
    if (lower.includes('protein') || lower.includes('albumin') || lower.includes('بروتين')) return 'Protein';
    if (lower.includes('روتيني') || lower.includes('ترقيد') || lower.includes('routine') || lower.includes('admission')) return 'Routine';

    // Check parentheses for acronym
    const parenMatch = s.match(/\(([^)]+)\)/);
    if (parenMatch && /[a-zA-Z]/.test(parenMatch[1])) {
      const inside = parenMatch[1].trim();
      if (inside.length <= 15) return inside;
    }

    const sanitized = s.replace(/[\u0600-\u06FF]/g, '').replace(/^[^\w]+|[^\w]+$/g, '').trim();
    return sanitized || s;
  };

  const cleanAnalysisType = (type?: string): string => {
    if (!type) return 'CROSS-MATCH';
    const rawParts = String(type).split(/[,،+/]/).map(p => p.trim()).filter(Boolean);
    if (rawParts.length === 0) return 'CROSS-MATCH';
    const cleaned = rawParts.map(p => cleanSingleAnalysis(p)).filter(Boolean);
    if (cleaned.length === 0) return 'CROSS-MATCH';
    const unique = Array.from(new Set(cleaned));
    return unique.join(' + ');
  };

  const cleanOperationTypeEnglish = (op?: string): string => {
    if (!op) return '';
    const trimmed = String(op).trim();
    if (!trimmed) return '';

    // 1. If contains parentheses with English like "فحص روتيني / ترقيد (Routine / Admission)", extract within parens
    const parenMatch = trimmed.match(/\(([^)]+)\)/);
    if (parenMatch && /[a-zA-Z]/.test(parenMatch[1])) {
      return parenMatch[1].trim();
    }

    // 2. Strip all Arabic letters and trailing slashes/symbols
    const stripped = trimmed.replace(/[\u0600-\u06FF]/g, '').replace(/^[^\w]+|[^\w]+$/g, '').trim();
    if (stripped && /[a-zA-Z]/.test(stripped)) {
      return stripped;
    }

    // 3. Known Arabic translations if selected in pure Arabic
    const lower = trimmed.toLowerCase();
    if (lower.includes('روتيني') || lower.includes('ترقيد')) return 'Routine / Admission';
    if (lower.includes('مرارة')) return 'Cholecystectomy';
    if (lower.includes('زائدة')) return 'Appendectomy';
    if (lower.includes('قيصرية') || lower.includes('ولادة')) return 'Cesarean Section';
    if (lower.includes('ركبة')) return 'Total Knee Replacement';
    if (lower.includes('ورك')) return 'Total Hip Replacement';
    if (lower.includes('قسطرة')) return 'Cardiac Catheterization';
    if (lower.includes('قلب')) return 'Open Heart Surgery';
    if (lower.includes('درقية')) return 'Thyroidectomy';
    if (lower.includes('رحم')) return 'Hysterectomy';
    if (lower.includes('ورم')) return 'Tumor Resection';
    if (lower.includes('كسر') || lower.includes('عظم')) return 'Fracture Fixation';
    if (lower.includes('ساد') || lower.includes('عيون')) return 'Cataract Surgery';
    if (lower.includes('تجميل')) return 'Plastic Surgery';
    if (lower.includes('لوز')) return 'Tonsillectomy';
    if (lower.includes('أنف') || lower.includes('انف')) return 'Rhinoplasty';
    if (lower.includes('ناظور') || lower.includes('تنظير')) return 'Laparoscopy';
    if (lower.includes('فتق')) return 'Hernia Repair';
    if (lower.includes('طوارئ') || lower.includes('اسعاف')) return 'Emergency';

    return stripped || trimmed;
  };

  const formatBloodTypeEnglish = (bt?: string): string => {
    if (!bt) return 'N/A';
    let cleaned = String(bt).replace(/[\u0600-\u06FF]/g, '').replace(/🩸/g, '').trim();
    if (cleaned.toLowerCase().includes('موجب') || cleaned.toLowerCase().includes('positive')) cleaned = cleaned.replace(/positive|موجب/gi, '+');
    if (cleaned.toLowerCase().includes('سالب') || cleaned.toLowerCase().includes('negative')) cleaned = cleaned.replace(/negative|سالب/gi, '-');
    return cleaned || 'N/A';
  };

  const formatMrnEnglish = (mrn?: string): string => {
    if (!mrn) return 'N/A';
    const cleaned = String(mrn).trim();
    if (!cleaned || cleaned.includes('غير محدد') || cleaned.toLowerCase().includes('not') || cleaned.toLowerCase() === 'undefined' || cleaned.toLowerCase() === 'null') {
      return 'N/A';
    }
    const stripped = cleaned.replace(/[\u0600-\u06FF]/g, '').trim();
    return stripped || cleaned;
  };

  const formatGenderEnglish = (gender?: string): string => {
    if (!gender) return 'N/A';
    const g = String(gender).toLowerCase();
    if (g.includes('ذكر') || g.includes('male') || g === 'm') return 'Male';
    if (g.includes('أنثى') || g.includes('انثى') || g.includes('female') || g === 'f') return 'Female';
    return 'N/A';
  };

  const getCurrentFormattedDateTime = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = String(hours).padStart(2, '0');
    return `${year}-${month}-${day} ${strHours}:${minutes} ${ampm}`;
  };

  const handlePrintVerifiedTubeBarcode = () => {
    if (!verificationResult) return;
    const finalType = verificationResult.analysisType || 'Cross-match';
    const bloodTypeDisplay = formatBloodTypeEnglish((verificationResult as any).bloodType);
    
    // Encode ONLY the biometricCode directly to prevent QR/Barcode internet redirects and allow local matching when scanned
    const barcodeText = verificationResult.biometricCode;
    const barcodeDataUrl = generateLocalBarcodeDataUrl(barcodeText);
    const formattedCodeText = formatToStandardBarcode(barcodeText);
    const roomValue = verificationResult.roomNumber || (verificationResult as any).room || '';

    const content = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&family=Inter:wght@400;700;900&display=swap');
        @page {
          size: 50mm 30mm;
          margin: 0;
        }
        * {
          box-sizing: border-box;
        }
        body {
          padding: 0 !important;
          margin: 0 !important;
          background: #fff !important;
          color: #000 !important;
          font-family: 'Inter', 'Cairo', 'system-ui', -apple-system, sans-serif;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          width: 50mm;
          height: 30mm;
          display: flex;
          justify-content: center;
          align-items: center;
          box-sizing: border-box;
          overflow: hidden;
        }
        .print-label-container {
          width: 50mm;
          height: 30mm;
          padding: 0.8mm;
          box-sizing: border-box;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .print-border {
          width: 100%;
          height: 100%;
          border: 1.2px solid #000;
          border-radius: 3px;
          padding: 0.8mm 1mm;
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: stretch;
          direction: ltr;
          overflow: hidden;
        }
        
        /* Left Info Section */
        .print-info-side {
          width: 66%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          text-align: left;
          direction: ltr;
          box-sizing: border-box;
          padding-right: 1mm;
          overflow: hidden;
        }
        .hospital-title {
          font-size: 5pt;
          font-weight: 900;
          color: #000;
          line-height: 1.1;
          margin: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          white-space: nowrap;
          overflow: hidden;
        }
        .blood-badge {
          color: #e11d48;
          font-size: 5.2pt;
          font-weight: 950;
          white-space: nowrap;
        }
        .patient-name {
          font-size: 5.6pt;
          font-weight: 950;
          color: #000;
          line-height: 1.15;
          white-space: normal;
          word-break: break-word;
          overflow: hidden;
          font-family: 'Inter', 'Cairo', 'system-ui', -apple-system, sans-serif;
          margin: 0.1mm 0;
          text-align: left;
        }
        .analysis-row {
          font-size: 4.8pt;
          font-weight: 900;
          color: #000;
          line-height: 1.15;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: left;
          margin: 0.1mm 0;
          direction: ltr;
        }
        .print-meta-row {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          font-size: 4.5pt;
          font-weight: 800;
          color: #000;
          line-height: 1.1;
          margin: 0;
          direction: ltr;
          white-space: nowrap;
          overflow: hidden;
        }
        .analysis-pill-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          margin-top: 0.2mm;
        }
        .analysis-pill {
          border: 0.8px solid #000;
          border-radius: 9999px;
          padding: 0.2mm 2px;
          font-size: 4.5pt;
          font-weight: 900;
          text-align: center;
          color: #000;
          background: #f8fafc;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
          direction: ltr;
          box-sizing: border-box;
        }

        /* Right Barcode Section */
        .print-code-side {
          width: 32%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          border-left: 1px dashed #000;
          padding-left: 0.8mm;
          box-sizing: border-box;
          direction: ltr;
          flex-shrink: 0;
          overflow: hidden;
        }
        .barcode-img {
          height: 9mm;
          width: 100%;
          object-fit: contain;
          display: block;
          margin: 0 auto;
        }
        .code-text {
          font-size: 4.2pt;
          font-family: 'monospace', Courier, monospace;
          font-weight: 900;
          color: #000;
          line-height: 1.1;
          white-space: nowrap;
          text-align: center;
          margin-top: 0.3mm;
          width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      </style>
      <div class="print-label-container">
        <div class="print-border">
          <!-- Left Info Section (66% width) -->
          <div class="print-info-side">
            <div class="hospital-title">
              <span>AL-FARAH HOSPITAL</span>
              <span class="blood-badge">${bloodTypeDisplay}</span>
            </div>
            <div class="patient-name">Name : ${verificationResult.fullName}</div>
            <div class="analysis-row">analysis : ${cleanAnalysisType(finalType).toUpperCase()}</div>
            <div class="print-meta-row">
              <span>Age : ${verificationResult.age || 'N/A'}</span>
              <span>${formatGenderEnglish(verificationResult.gender)}</span>
              <span>Room : ${roomValue || 'N/A'}</span>
            </div>
          </div>

          <!-- Right Barcode Section (32% width) -->
          <div class="print-code-side">
            <img class="barcode-img" src="${barcodeDataUrl}" alt="Barcode" />
            <div class="code-text">${formattedCodeText}</div>
            <div class="code-text" style="font-size: 3.5pt; font-weight: bold; margin-top: 0.5mm;">
              ${getCurrentFormattedDateTime()}
            </div>
          </div>
        </div>
      </div>
    `;
    handlePrintLabel('Verified Tube Barcode', content);
  };

  const handlePrintVerifiedPatientQR = async () => {
    if (!verificationResult) return;
    const finalType = verificationResult.analysisType || 'Cross-match';
    const qrCodeVal = verificationResult.biometricCode;
    const baseUrl = (import.meta as any).env.VITE_APP_URL || window.location.origin;
    const qrDataText = `${baseUrl.replace(/\/$/, '')}/?verify-patient=${encodeURIComponent(qrCodeVal)}`;
    const bloodTypeDisplay = formatBloodTypeEnglish((verificationResult as any).bloodType);

    const qrDataUrl = await generateLocalQRDataUrl(qrDataText);
    const cleanId = String(verificationResult.id || qrCodeVal || '041852FC').replace('bio-', '').toUpperCase();
    const formattedCodeText = `QR-LAB-${cleanId.substring(0, 10)}`;
    const roomValue = verificationResult.roomNumber || (verificationResult as any).room || '';

    const content = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&family=Inter:wght@400;700;900&display=swap');
        @page {
          size: 50mm 30mm;
          margin: 0;
        }
        * {
          box-sizing: border-box;
        }
        body {
          padding: 0 !important;
          margin: 0 !important;
          background: #fff !important;
          color: #000 !important;
          font-family: 'Inter', 'Cairo', 'system-ui', -apple-system, sans-serif;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          width: 50mm;
          height: 30mm;
          display: flex;
          justify-content: center;
          align-items: center;
          box-sizing: border-box;
          overflow: hidden;
        }
        .print-label-container {
          width: 50mm;
          height: 30mm;
          padding: 0.6mm;
          box-sizing: border-box;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .print-border {
          width: 100%;
          height: 100%;
          border: 1.5px solid #000;
          border-radius: 3px;
          padding: 0.8mm 1mm;
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: stretch;
          direction: ltr;
          overflow: hidden;
        }
        
        /* Left Info Section */
        .print-info-side {
          flex: 1;
          min-width: 0;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          text-align: left;
          direction: ltr;
          box-sizing: border-box;
          padding-right: 1.2mm;
          overflow: hidden;
        }
        .hospital-title {
          font-size: 5.2pt;
          font-weight: 950;
          color: #000;
          line-height: 1.1;
          margin: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          white-space: nowrap;
          overflow: hidden;
          border-bottom: 1px solid #000;
          padding-bottom: 0.3mm;
        }
        .blood-badge {
          color: #000;
          font-size: 5.8pt;
          font-weight: 950;
          white-space: nowrap;
          border: 1px solid #000;
          padding: 0.1mm 1.2mm;
          border-radius: 2px;
        }
        .patient-name {
          font-size: 5.6pt;
          font-weight: 950;
          color: #000;
          line-height: 1.15;
          white-space: normal;
          word-break: break-word;
          overflow: hidden;
          font-family: 'Inter', 'Cairo', 'system-ui', -apple-system, sans-serif;
          margin: 0.1mm 0;
          text-align: left;
        }
        .print-meta-row {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          font-size: 5.2pt;
          font-weight: 900;
          color: #000;
          line-height: 1.1;
          margin: 0;
          direction: ltr;
          white-space: nowrap;
          overflow: hidden;
        }
        .room-row {
          font-size: 5.5pt;
          font-weight: 950;
          color: #000;
          line-height: 1.1;
          margin: 0.1mm 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .analysis-pill-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          margin-top: 0.2mm;
        }
        .analysis-pill {
          border: 1px solid #000;
          border-radius: 2.5px;
          padding: 0.3mm 0.8mm;
          font-size: 5pt;
          font-weight: 950;
          text-align: center;
          color: #000;
          background: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
          direction: ltr;
          box-sizing: border-box;
          line-height: 1.1;
        }

        /* Right QR Section */
        .print-code-side {
          width: 16mm;
          max-width: 16mm;
          min-width: 16mm;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          border-left: 1.5px dashed #000;
          padding-left: 0.8mm;
          box-sizing: border-box;
          direction: ltr;
          flex-shrink: 0;
          overflow: hidden;
        }
        .qr-img {
          height: 14.5mm;
          width: 14.5mm;
          max-height: 14.5mm;
          max-width: 14.5mm;
          object-fit: contain;
          display: block;
          margin: 0 auto;
          image-rendering: pixelated;
        }
        .code-text {
          font-size: 4.2pt;
          font-family: 'monospace', Courier, monospace;
          font-weight: 950;
          color: #000;
          line-height: 1.1;
          white-space: nowrap;
          text-align: center;
          margin-top: 0.2mm;
          width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      </style>
      <div class="print-label-container">
        <div class="print-border">
          <!-- Left Info Section -->
          <div class="print-info-side">
            <div class="hospital-title">
              <span>AL-FARAH HOSPITAL</span>
              <span class="blood-badge">${bloodTypeDisplay}</span>
            </div>
            <div class="patient-name">Name: ${verificationResult.fullName}</div>
            <div class="print-meta-row">
              <span>Age: ${verificationResult.age || 'N/A'}</span>
              <span>${formatGenderEnglish(verificationResult.gender)}</span>
            </div>
            <div class="room-row">
              <span>Room: ${roomValue || 'N/A'}</span>
            </div>
            <div class="analysis-pill-container">
              <div class="analysis-pill">
                ${cleanAnalysisType(finalType).toUpperCase()}
              </div>
            </div>
          </div>

          <!-- Right QR Section -->
          <div class="print-code-side">
            <img class="qr-img" src="${qrDataUrl}" alt="QR Code" />
            <div class="code-text">${formattedCodeText}</div>
          </div>
        </div>
      </div>
    `;
    handlePrintLabel('Verified Patient QR', content);
  };

  const handlePrintSampleTubeBarcode = () => {
    if (!sampleResult || !selectedPatientForSample) return;
    const finalType = sampleResult.analysisType || sampleAnalysisType;
    const bloodTypeDisplay = formatBloodTypeEnglish(sampleResult.bloodType || bloodType);
    
    // Encode ONLY the patient's biometricCode directly to prevent QR/Barcode internet redirects and allow local matching when scanned
    const barcodeText = selectedPatientForSample.biometricCode;
    const barcodeDataUrl = generateLocalBarcodeDataUrl(barcodeText);
    const cleanId = String(selectedPatientForSample.id || selectedPatientForSample.biometricCode || '041852FC').replace('bio-', '').toUpperCase();
    const formattedCodeText = formatToStandardBarcode(barcodeText);
    const roomValue = selectedPatientForSample.roomNumber || (selectedPatientForSample as any).room || '';

    const content = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&family=Inter:wght@400;700;900&display=swap');
        @page {
          size: 50mm 30mm;
          margin: 0;
        }
        * {
          box-sizing: border-box;
        }
        body {
          padding: 0 !important;
          margin: 0 !important;
          background: #fff !important;
          color: #000 !important;
          font-family: 'Inter', 'Cairo', 'system-ui', -apple-system, sans-serif;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          width: 50mm;
          height: 30mm;
          display: flex;
          justify-content: center;
          align-items: center;
          box-sizing: border-box;
          overflow: hidden;
        }
        .print-label-container {
          width: 50mm;
          height: 30mm;
          padding: 1mm;
          box-sizing: border-box;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .print-border {
          width: 100%;
          height: 100%;
          border: 1.2px solid #000;
          border-radius: 3.5px;
          padding: 0.8mm 1mm;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: stretch;
          overflow: hidden;
        }
        .main-content {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          flex-grow: 1;
          height: calc(100% - 3.5mm);
          width: 100%;
          direction: ltr;
        }
        
        /* Left Info Section */
        .print-info-side {
          width: 66%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          text-align: left;
          direction: ltr;
          box-sizing: border-box;
          padding-right: 1mm;
        }
        .hospital-title {
          font-size: 5pt;
          font-weight: 900;
          color: #000;
          line-height: 1.1;
          margin: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .blood-badge {
          color: #e11d48;
          font-size: 5.2pt;
          font-weight: 950;
        }
        .patient-name {
          font-size: 5.6pt;
          font-weight: 950;
          color: #000;
          line-height: 1.15;
          white-space: normal;
          word-break: break-word;
          overflow: hidden;
          font-family: 'Inter', 'Cairo', 'system-ui', -apple-system, sans-serif;
          margin: 0.1mm 0;
          text-align: left;
        }
        .analysis-row {
          font-size: 4.8pt;
          font-weight: 900;
          color: #000;
          line-height: 1.15;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: left;
          margin: 0.1mm 0;
          direction: ltr;
        }
        .print-meta-row {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          font-size: 4.5pt;
          font-weight: 800;
          color: #000;
          line-height: 1.1;
          margin: 0;
          direction: ltr;
          white-space: nowrap;
        }
        .doc-op-row {
          font-size: 4.2pt;
          font-weight: 900;
          color: #000;
          display: flex;
          flex-direction: column;
          gap: 0.1mm;
          line-height: 1.1;
          margin: 0.1mm 0;
          direction: ltr;
          white-space: nowrap;
          overflow: hidden;
        }
        .doc-op-row > div {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        /* Right Barcode Section */
        .print-code-side {
          width: 32%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          border-left: 1px dashed #000;
          padding-left: 0.8mm;
          box-sizing: border-box;
          direction: ltr;
        }
        .barcode-img {
          height: 9mm;
          width: 100%;
          object-fit: contain;
          display: block;
          margin: 0 auto;
        }
        .code-text {
          font-size: 4.2pt;
          font-family: 'monospace', Courier, monospace;
          font-weight: 900;
          color: #000;
          line-height: 1.1;
          white-space: nowrap;
          text-align: center;
          margin-top: 0.3mm;
          width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        /* Bottom Full-width Timestamp */
        .bottom-timestamp {
          width: 100%;
          text-align: center;
          font-size: 4.2pt;
          font-weight: bold;
          color: #000;
          border-top: 0.8px solid #000;
          padding-top: 0.3mm;
          margin-top: 0.2mm;
          direction: ltr;
          line-height: 1;
        }
      </style>
      <div class="print-label-container">
        <div class="print-border">
          <div class="main-content">
            <!-- Left Info Section (66% width) -->
            <div class="print-info-side">
              <div class="hospital-title">
                <span>AL-FARAH HOSPITAL</span>
                <span class="blood-badge">${bloodTypeDisplay}</span>
              </div>
              <div class="patient-name">Name : ${selectedPatientForSample.fullName}</div>
              <div class="analysis-row">analysis : ${cleanAnalysisType(finalType).toUpperCase()}</div>
              <div class="print-meta-row">
                <span>Age : ${selectedPatientForSample.age || 'N/A'}</span>
                <span>${formatGenderEnglish(selectedPatientForSample.gender)}</span>
                <span>Room : ${roomValue || 'N/A'}</span>
              </div>
              ${(selectedPatientForSample.doctorName || selectedPatientForSample.operationType) ? `
                <div class="doc-op-row">
                  ${selectedPatientForSample.doctorName ? `<div>👨‍⚕️ <strong>Dr: ${selectedPatientForSample.doctorName}</strong></div>` : ''}
                  ${selectedPatientForSample.operationType ? `<div>🩺 <strong>Op: ${cleanOperationTypeEnglish(selectedPatientForSample.operationType)}</strong></div>` : ''}
                </div>
              ` : ''}
            </div>

            <!-- Right Barcode Section (32% width) -->
            <div class="print-code-side">
              <img class="barcode-img" src="${barcodeDataUrl}" alt="Barcode" />
              <div class="code-text">${formattedCodeText}</div>
            </div>
          </div>

          <!-- Bottom Full-width Timestamp -->
          <div class="bottom-timestamp">
            Collection Time: ${getCurrentFormattedDateTime()}
          </div>
        </div>
      </div>
    `;
    handlePrintLabel('Sample Tube Barcode', content);
  };

  const handlePrintWristbandBarcode = async () => {
    if (!sampleResult || !selectedPatientForSample) return;
    const finalType = sampleResult.analysisType || sampleAnalysisType;
    const qrCodeVal = sampleResult.qrCode;
    const baseUrl = (import.meta as any).env.VITE_APP_URL || window.location.origin;
    const qrDataText = `${baseUrl.replace(/\/$/, '')}/?verify-patient=${encodeURIComponent(qrCodeVal)}`;
    const bloodTypeDisplay = formatBloodTypeEnglish(sampleResult.bloodType || bloodType);

    const qrDataUrl = await generateLocalQRDataUrl(qrDataText);
    const cleanId = String(selectedPatientForSample.id || qrCodeVal || '041852FC').replace('bio-', '').toUpperCase();
    const formattedCodeText = `QR-LAB-${cleanId.substring(0, 10)}`;

    const content = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Inter:wght@400;600;700;800;900&display=swap');
        @page {
          size: 50mm 30mm;
          margin: 0;
        }
        * {
          box-sizing: border-box;
        }
        body {
          padding: 0 !important;
          margin: 0 !important;
          background: #fff !important;
          color: #000 !important;
          font-family: 'Inter', 'Cairo', 'system-ui', -apple-system, sans-serif;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          width: 50mm;
          height: 30mm;
          display: flex;
          justify-content: center;
          align-items: center;
          box-sizing: border-box;
          overflow: hidden;
        }
        .print-label-container {
          width: 50mm;
          height: 30mm;
          padding: 0.6mm;
          box-sizing: border-box;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .print-border {
          width: 100%;
          height: 100%;
          border: 1.5px solid #000;
          border-radius: 3px;
          padding: 0.8mm 1mm;
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: stretch;
          direction: ltr;
          overflow: hidden;
        }
        
        /* Left Info Section */
        .print-info-side {
          flex: 1;
          min-width: 0;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          text-align: left;
          direction: ltr;
          box-sizing: border-box;
          padding-right: 1.2mm;
          overflow: hidden;
        }
        .hospital-title {
          font-size: 5.2pt;
          font-weight: 950;
          color: #000;
          line-height: 1.1;
          margin: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          white-space: nowrap;
          overflow: hidden;
          border-bottom: 1px solid #000;
          padding-bottom: 0.3mm;
        }
        .blood-badge {
          color: #000;
          font-size: 5.8pt;
          font-weight: 950;
          white-space: nowrap;
          border: 1px solid #000;
          padding: 0.1mm 1.2mm;
          border-radius: 2px;
        }
        .patient-name {
          font-size: 5.6pt;
          font-weight: 950;
          color: #000;
          line-height: 1.15;
          white-space: normal;
          word-break: break-word;
          overflow: hidden;
          font-family: 'Inter', 'Cairo', 'system-ui', -apple-system, sans-serif;
          margin: 0.1mm 0;
          text-align: left;
        }
        .print-meta-row {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          font-size: 5.2pt;
          font-weight: 900;
          color: #000;
          line-height: 1.1;
          margin: 0;
          direction: ltr;
          white-space: nowrap;
          overflow: hidden;
        }
        .room-row {
          font-size: 5.5pt;
          font-weight: 950;
          color: #000;
          line-height: 1.1;
          margin: 0.1mm 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .doc-op-row {
          font-size: 4.5pt;
          font-weight: 900;
          color: #000;
          display: flex;
          flex-direction: column;
          gap: 0.1mm;
          line-height: 1.1;
          margin: 0;
          direction: ltr;
          white-space: nowrap;
          overflow: hidden;
        }
        .doc-op-row > div {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .analysis-pill-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          margin-top: 0.2mm;
        }
        .analysis-pill {
          border: 1px solid #000;
          border-radius: 2.5px;
          padding: 0.3mm 0.8mm;
          font-size: 5pt;
          font-weight: 950;
          text-align: center;
          color: #000;
          background: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
          direction: ltr;
          box-sizing: border-box;
          line-height: 1.1;
        }

        /* Right QR Section */
        .print-code-side {
          width: 16mm;
          max-width: 16mm;
          min-width: 16mm;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          border-left: 1.5px dashed #000;
          padding-left: 0.8mm;
          box-sizing: border-box;
          direction: ltr;
          flex-shrink: 0;
          overflow: hidden;
        }
        .qr-img {
          height: 14.5mm;
          width: 14.5mm;
          max-height: 14.5mm;
          max-width: 14.5mm;
          object-fit: contain;
          display: block;
          margin: 0 auto;
          image-rendering: pixelated;
        }
        .code-text {
          font-size: 4.2pt;
          font-family: 'monospace', Courier, monospace;
          font-weight: 950;
          color: #000;
          line-height: 1.1;
          white-space: nowrap;
          text-align: center;
          margin-top: 0.2mm;
          width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      </style>
      <div class="print-label-container">
        <div class="print-border">
          <!-- Left Info Section -->
          <div class="print-info-side">
            <div class="hospital-title">
              <span>AL-FARAH HOSPITAL</span>
              <span class="blood-badge">${bloodTypeDisplay}</span>
            </div>
            <div class="patient-name">Name: ${selectedPatientForSample.fullName}</div>
            <div class="print-meta-row">
              <span>Age: ${selectedPatientForSample.age || 'N/A'}</span>
              <span>${formatGenderEnglish(selectedPatientForSample.gender)}</span>
            </div>
            <div class="room-row">
              <span>Room: ${selectedPatientForSample.roomNumber || 'N/A'}</span>
            </div>
            ${(selectedPatientForSample.doctorName || selectedPatientForSample.operationType) ? `
              <div class="doc-op-row">
                ${selectedPatientForSample.doctorName ? `<div>👨‍⚕️ <strong>Dr: ${selectedPatientForSample.doctorName}</strong></div>` : ''}
                ${selectedPatientForSample.operationType ? `<div>🩺 <strong>Op: ${cleanOperationTypeEnglish(selectedPatientForSample.operationType)}</strong></div>` : ''}
              </div>
            ` : ''}
            <div class="analysis-pill-container">
              <div class="analysis-pill">
                ${cleanAnalysisType(finalType).toUpperCase()}
              </div>
            </div>
          </div>

          <!-- Right QR Section -->
          <div class="print-code-side">
            <img class="qr-img" src="${qrDataUrl}" alt="QR Code" />
            <div class="code-text">${formattedCodeText}</div>
          </div>
        </div>
      </div>
    `;
    handlePrintLabel('Patient Wristband Label', content);
  };

  const handlePrintWristbandOnRegister = async (patientData: any) => {
    const baseUrl = window.location.origin;
    const qrDataText = `${baseUrl}/?verify-patient=${encodeURIComponent(patientData.biometricCode)}`;

    const cleanId = String(patientData.id || patientData.biometricCode || '041852FC').replace('bio-', '').toUpperCase();
    const formattedCodeText = `QR-LAB-${cleanId.substring(0, 10)}`;
    const bloodTypeDisplay = formatBloodTypeEnglish(patientData.bloodTypeDisplay || patientData.bloodType);

    const qrDataUrl = await generateLocalQRDataUrl(qrDataText);

    const content = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Inter:wght@400;600;700;800;900&display=swap');
        @page {
          size: 50mm 30mm;
          margin: 0;
        }
        * {
          box-sizing: border-box;
        }
        body {
          padding: 0 !important;
          margin: 0 !important;
          background: #fff !important;
          color: #000 !important;
          font-family: 'Inter', 'Cairo', 'system-ui', -apple-system, sans-serif;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          width: 50mm;
          height: 30mm;
          display: flex;
          justify-content: center;
          align-items: center;
          box-sizing: border-box;
          overflow: hidden;
        }
        .print-label-container {
          width: 50mm;
          height: 30mm;
          padding: 0.6mm;
          box-sizing: border-box;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .print-border {
          width: 100%;
          height: 100%;
          border: 1.5px solid #000;
          border-radius: 3px;
          padding: 0.8mm 1mm;
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: stretch;
          direction: ltr;
          overflow: hidden;
        }
        
        /* Left Info Section */
        .print-info-side {
          flex: 1;
          min-width: 0;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          text-align: left;
          direction: ltr;
          box-sizing: border-box;
          padding-right: 1.2mm;
          overflow: hidden;
        }
        .hospital-title {
          font-size: 5.2pt;
          font-weight: 950;
          color: #000;
          line-height: 1.1;
          margin: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          white-space: nowrap;
          overflow: hidden;
          border-bottom: 1px solid #000;
          padding-bottom: 0.3mm;
        }
        .blood-badge {
          color: #000;
          font-size: 5.8pt;
          font-weight: 950;
          white-space: nowrap;
          border: 1px solid #000;
          padding: 0.1mm 1.2mm;
          border-radius: 2px;
        }
        .patient-name {
          font-size: 5.6pt;
          font-weight: 950;
          color: #000;
          line-height: 1.15;
          white-space: normal;
          word-break: break-word;
          overflow: hidden;
          font-family: 'Inter', 'Cairo', 'system-ui', -apple-system, sans-serif;
          margin: 0.1mm 0;
          text-align: left;
        }
        .print-meta-row {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          font-size: 5.2pt;
          font-weight: 900;
          color: #000;
          line-height: 1.1;
          margin: 0;
          direction: ltr;
          white-space: nowrap;
          overflow: hidden;
        }
        .room-row {
          font-size: 5.5pt;
          font-weight: 950;
          color: #000;
          line-height: 1.1;
          margin: 0.1mm 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .doc-op-row {
          font-size: 4.5pt;
          font-weight: 900;
          color: #000;
          display: flex;
          flex-direction: column;
          gap: 0.1mm;
          line-height: 1.1;
          margin: 0;
          direction: ltr;
          white-space: nowrap;
          overflow: hidden;
        }
        .doc-op-row > div {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .analysis-pill-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          margin-top: 0.2mm;
        }
        .analysis-pill {
          border: 1px solid #000;
          border-radius: 2.5px;
          padding: 0.3mm 0.8mm;
          font-size: 5pt;
          font-weight: 950;
          text-align: center;
          color: #000;
          background: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
          direction: ltr;
          box-sizing: border-box;
          line-height: 1.1;
        }

        /* Right QR Section */
        .print-code-side {
          width: 16mm;
          max-width: 16mm;
          min-width: 16mm;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          border-left: 1.5px dashed #000;
          padding-left: 0.8mm;
          box-sizing: border-box;
          direction: ltr;
          flex-shrink: 0;
          overflow: hidden;
        }
        .qr-img {
          height: 14.5mm;
          width: 14.5mm;
          max-height: 14.5mm;
          max-width: 14.5mm;
          object-fit: contain;
          display: block;
          margin: 0 auto;
          image-rendering: pixelated;
        }
        .code-text {
          font-size: 4.2pt;
          font-family: 'monospace', Courier, monospace;
          font-weight: 950;
          color: #000;
          line-height: 1.1;
          white-space: nowrap;
          text-align: center;
          margin-top: 0.2mm;
          width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      </style>
      <div class="print-label-container">
        <div class="print-border">
          <!-- Left Info Section -->
          <div class="print-info-side">
            <div class="hospital-title">
              <span>AL-FARAH HOSPITAL</span>
              <span class="blood-badge">${bloodTypeDisplay}</span>
            </div>
            <div class="patient-name">Name: ${patientData.fullName}</div>
            <div class="print-meta-row">
              <span>Age: ${patientData.age || '0'}</span>
              <span>${formatGenderEnglish(patientData.gender)}</span>
            </div>
            <div class="room-row">
              <span>Room: ${patientData.roomNumber || 'N/A'}</span>
            </div>
            ${(patientData.doctorName || patientData.operationType) ? `
              <div class="doc-op-row">
                ${patientData.doctorName ? `<div>👨‍⚕️ <strong>Dr: ${patientData.doctorName}</strong></div>` : ''}
                ${patientData.operationType ? `<div>🩺 <strong>Op: ${cleanOperationTypeEnglish(patientData.operationType)}</strong></div>` : ''}
              </div>
            ` : ''}
            <div class="analysis-pill-container">
              <div class="analysis-pill">
                ${cleanAnalysisType(patientData.analysisType || 'Cross-match').toUpperCase()}
              </div>
            </div>
          </div>

          <!-- Right QR Section -->
          <div class="print-code-side">
            <img class="qr-img" src="${qrDataUrl}" alt="QR Code" />
            <div class="code-text">${formattedCodeText}</div>
          </div>
        </div>
      </div>
    `;
    handlePrintLabel('Patient Wristband Sticker', content);
  };

  const handlePrintTablehBarcode = async (patientData: any) => {
    if (!patientData) return;
    const baseUrl = window.location.origin;
    const qrDataText = `${baseUrl}/?verify-patient=${encodeURIComponent(patientData.biometricCode || patientData.id || '041852FC')}`;

    const qrDataUrl = await generateLocalQRDataUrl(qrDataText);

    const content = `
      <style>
        @page {
          size: auto;
          margin: 0;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: 100% !important;
          background: #ffffff !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .tableh-full-qr-wrapper {
          width: 100vw;
          height: 100vh;
          max-width: 100%;
          max-height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 8px;
          box-sizing: border-box;
          background: #ffffff;
        }
        .tableh-full-qr-wrapper img {
          max-width: 96vw;
          max-height: 96vh;
          width: 90vmin;
          height: 90vmin;
          object-fit: contain;
          display: block;
          margin: auto;
        }
      </style>
      <div class="tableh-full-qr-wrapper">
        <img src="${qrDataUrl}" alt="Patient Chart QR Code" />
      </div>
    `;
    handlePrintLabel('Patient Tableh Full QR Code', content);
  };

  const handlePrintMaterialSticker = async (material: any, qrUrl: string, barcodeUrl: string) => {
    if (!material) return;
    const baseUrl = window.location.origin;
    const qrDataText = `${baseUrl}/?view-material=${encodeURIComponent(material.id || material.qrCode)}`;
    const finalQrUrl = qrUrl || await generateLocalQRDataUrl(qrDataText);
    const supplierName = material.supplier || material.bookName || 'غير محدد';
    const bookNum = material.bookNumber || 'N/A';
    const bookDt = material.bookDate || 'N/A';
    const codeId = material.qrCode || material.barcode || 'MAT-001';

    const content = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@700;800;900&family=Inter:wght@700;800;900&display=swap');
        @page {
          size: 50mm 30mm;
          margin: 0;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          box-shadow: none !important;
          text-shadow: none !important;
        }
        body {
          padding: 0 !important;
          margin: 0 !important;
          background: #ffffff !important;
          color: #000000 !important;
          font-family: 'Cairo', 'Inter', 'system-ui', -apple-system, sans-serif;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          width: 50mm;
          height: 30mm;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
        }
        .mat-label-container {
          width: 50mm;
          height: 30mm;
          padding: 0.8mm;
          box-sizing: border-box;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .mat-border {
          width: 100%;
          height: 100%;
          border: 1.5px solid #000000;
          border-radius: 2px;
          padding: 0.8mm 1mm;
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: stretch;
          direction: rtl;
          overflow: hidden;
          background: #ffffff;
        }
        .mat-info-side {
          flex: 1;
          min-width: 0;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          text-align: right;
          direction: rtl;
          padding-left: 1.2mm;
          overflow: hidden;
        }
        .mat-hospital-header {
          border-bottom: 1.2px solid #000000;
          padding-bottom: 0.2mm;
          margin-bottom: 0.2mm;
        }
        .mat-hospital-title {
          font-size: 5.5pt;
          font-weight: 900;
          color: #000000;
          line-height: 1.15;
          white-space: nowrap;
          overflow: visible;
          text-overflow: clip;
          letter-spacing: -0.15px;
        }
        .mat-hospital-sub {
          font-size: 4.2pt;
          font-weight: 800;
          color: #000000;
          line-height: 1.1;
          white-space: nowrap;
        }
        .mat-details {
          display: flex;
          flex-direction: column;
          justify-content: space-around;
          flex: 1;
          gap: 0.2mm;
        }
        .mat-row {
          display: flex;
          align-items: baseline;
          gap: 0.8mm;
          font-size: 5.2pt;
          font-weight: 800;
          color: #000000;
          line-height: 1.15;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .mat-label {
          font-weight: 900;
          color: #000000;
          flex-shrink: 0;
        }
        .mat-val {
          font-weight: 900;
          color: #000000;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .mat-val-supplier {
          font-weight: 900;
          font-size: 5.2pt;
          color: #000000;
        }
        .mat-qr-side {
          width: 18.5mm;
          max-width: 18.5mm;
          min-width: 18.5mm;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          border-right: 1.2px dashed #000000;
          padding-right: 0.8mm;
          box-sizing: border-box;
          direction: ltr;
          flex-shrink: 0;
          overflow: hidden;
          background: #ffffff;
        }
        .mat-qr-img {
          width: 16.5mm;
          height: 16.5mm;
          max-width: 16.5mm;
          max-height: 16.5mm;
          object-fit: contain;
          display: block;
          image-rendering: pixelated;
          margin: 0 auto;
        }
        .mat-qr-code-text {
          font-size: 4.2pt;
          font-family: 'monospace', Courier, monospace;
          font-weight: 900;
          color: #000000;
          line-height: 1;
          white-space: nowrap;
          text-align: center;
          margin-top: 0.3mm;
          width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      </style>
      <div class="mat-label-container">
        <div class="mat-border">
          <!-- Right Info Side (in RTL layout) -->
          <div class="mat-info-side">
            <div class="mat-hospital-header">
              <div class="mat-hospital-title">مستشفى الفرح الاهلي</div>
              <div class="mat-hospital-sub">معتمدة ومسجلة لدى وزارة الصحة</div>
            </div>
            <div class="mat-details">
              <div class="mat-row">
                <span class="mat-label">الشركة:</span>
                <span class="mat-val mat-val-supplier">${supplierName}</span>
              </div>
              <div class="mat-row">
                <span class="mat-label">رقم الكتاب:</span>
                <span class="mat-val" style="font-family: 'monospace', sans-serif;">${bookNum}</span>
              </div>
              <div class="mat-row">
                <span class="mat-label">التاريخ:</span>
                <span class="mat-val">${bookDt}</span>
              </div>
            </div>
          </div>

          <!-- Left QR Code Side -->
          <div class="mat-qr-side">
            <img class="mat-qr-img" src="${finalQrUrl}" alt="QR Code" />
            <div class="mat-qr-code-text">${codeId}</div>
          </div>
        </div>
      </div>
    `;
    handlePrintLabel('Material Sticker 5x3', content);
  };

  const handlePrintBothLabels = async (patientData: any) => {
    if (!patientData) return;
    await handlePrintWristbandOnRegister(patientData);
    setTimeout(() => {
      handlePrintTablehBarcode(patientData);
    }, 1200);
  };

  // Submit Patient Registration
  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRegistryMessage(null);

    if (!fullName || !fullName.trim()) {
      setRegistryMessage({
        type: 'error',
        text: 'يرجى تقديم الاسم الكامل لتسجيل المريض بالهيكل الطبي (الاسم هو الحقل الإجباري الوحيد).'
      });
      return;
    }

    // Phone number is optional in laboratory & blood bank
    if (phoneNumber && phoneNumber.trim() !== '') {
      const cleanPhone = phoneNumber.trim().replace(/\D/g, '');
      if (cleanPhone.length !== 11 && cleanPhone.length !== 10) {
        setRegistryMessage({
          type: 'error',
          text: 'تنبيه: في حال كتابة رقم هاتف المريض يرجى إدخال رقم صحيح (مثل: 07701234567) أو تركه فارغاً فهو اختياري.'
        });
        return;
      }
    }

    if (companionPhoneNumber && companionPhoneNumber.trim() !== '') {
      const cleanCompanion = companionPhoneNumber.trim().replace(/\D/g, '');
      if (cleanCompanion.length !== 11 && cleanCompanion.length !== 10) {
        setRegistryMessage({
          type: 'error',
          text: 'تنبيه: في حال كتابة رقم هاتف المرافق يرجى إدخال رقم صحيح (مثل: 07801234567) أو تركه فارغاً فهو اختياري.'
        });
        return;
      }
    }

    // If Sandbox Mode is active, handle locally
    if (isSandboxMode) {
      const nextBioId = sandboxPatients.length + 1; // start from 1 sequentially
      const finalMedNumber = tablehNumber ? tablehNumber.trim() : 'غير محدد';
      const newPat = {
        id: 'sandbox-p-' + Date.now(),
        fullName,
        biometricCode: nextBioId,
        age: Number(age) || 30,
        gender,
        medicalRecordNumber: finalMedNumber,
        roomNumber: roomNumber || '',
        doctorName: doctorName || '',
        operationType: operationType || '',
        analysisType: analysisType || 'Cross-match',
        phoneNumber: phoneNumber || '',
        companionPhoneNumber: companionPhoneNumber || '',
        fingerprintTemplate: fingerprintTemplate,
        patientPhotoBase64: patientPhoto,
        nationalIdPhotoBase64: nationalIdPhoto
      };
      setSandboxPatients([...sandboxPatients, newPat]);
      setRegisteredPatientsList([newPat, ...registeredPatientsList]);

      // Sync immediately to backend ledger so phone QR camera scan finds the record instantly!
      fetch('/api/lab/patients/sync-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patients: [newPat] })
      }).catch(err => console.error('Failed to sync sandbox patient to backend:', err));
      
      // Active patient state is intentionally NOT pre-selected on registration to force manual verification/search
      try {
        sessionStorage.removeItem('locked_lab_patient');
        localStorage.removeItem('locked_lab_patient');
      } catch (err) {
        console.error('Failed to clear previous patient storage:', err);
      }

      setRegistryMessage({
        type: 'success',
        text: `[بيئة تجريبية] تم تسجيل المريض ${fullName} بنجاح! نوع التحليل: ${analysisType || 'Cross-match'}. الرمز الحيوي المتسلسل الممنوح له هو: #${nextBioId}.`
      });

      // Show options modal so user can choose to print wristband, tableh barcode, or both
      setShowWristbandModal(newPat);

      // Reset form
      setFullName('');
      setTablehNumber('');
      setRoomNumber('');
      setDoctorName('');
      setOperationType('');
      setAge('');
      setPhoneNumber('');
      setCompanionPhoneNumber('');
      setAnalysisType('Cross-match');
      setFingerprintCaptured(false);
      setFingerprintTemplate('');
      setNationalIdPhoto(null);
      setNationalIdFrontPhoto(null);
      setNationalIdBackPhoto(null);
      setPatientPhoto(null);
      return;
    }

    try {
      const res = await fetch('/api/lab/patients/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role,
          'x-user-name': currentUser.username
        },
        body: JSON.stringify({
          fullName,
          gender,
          age: Number(age) || 0,
          medicalRecordNumber: tablehNumber,
          roomNumber,
          doctorName,
          operationType,
          analysisType,
          phoneNumber,
          companionPhoneNumber,
          fingerprintTemplate: fingerprintTemplate,
          nationalIdPhotoBase64: nationalIdPhoto,
          patientPhotoBase64: patientPhoto
        })
      });

      const data = await res.json();
      if (data.success) {
        // Automatically trigger printing the wristband sticker with QR code!
        const newPatReal = {
          id: data.patientId,
          fullName,
          gender,
          age: Number(age) || 0,
          medicalRecordNumber: tablehNumber || 'غير محدد',
          roomNumber: roomNumber || '',
          doctorName: doctorName || '',
          operationType: operationType || '',
          analysisType,
          phoneNumber,
          companionPhoneNumber,
          biometricCode: data.biometricCode,
          photoBase64: patientPhoto,
          nationalIdPhotoBase64: nationalIdPhoto
        };

        // Active patient state is intentionally NOT pre-selected on registration to force manual verification/search
        try {
          sessionStorage.removeItem('locked_lab_patient');
          localStorage.removeItem('locked_lab_patient');
        } catch (err) {
          console.error('Failed to clear previous patient storage:', err);
        }

        setRegistryMessage({
          type: 'success',
          text: `تم تسجيل المريض ${fullName} بنجاح! نوع التحليل: ${analysisType}. الرمز الحيوي المتسلسل الممنوح له من الخادم هو: #${data.biometricCode}.`
        });

        // Show options modal so user can choose to print wristband, tableh barcode, or both
        setShowWristbandModal(newPatReal);

        // Reset form
        setFullName('');
        setTablehNumber('');
        setRoomNumber('');
        setDoctorName('');
        setOperationType('');
        setAge('');
        setPhoneNumber('');
        setCompanionPhoneNumber('');
        setAnalysisType('Cross-match');
        setFingerprintCaptured(false);
        setFingerprintTemplate('');
        setNationalIdPhoto(null);
        setNationalIdFrontPhoto(null);
        setNationalIdBackPhoto(null);
        setPatientPhoto(null);
        fetchStats();
        fetchRecentPatients();
      } else {
        setRegistryMessage({
          type: 'error',
          text: data.errorAr || data.error || 'فشلت عملية حفظ السجل.'
        });
      }
    } catch (err) {
      setRegistryMessage({
        type: 'error',
        text: 'عذراً، فشل الاتصال بالخادم الرئيسي لقاعدة البيانات.'
      });
    }
  };

  // Search Patient by Name in the Verification panel
  const handleVerifySearchByName = async (queryStr: string) => {
    const q = queryStr;
    setVerifyNameQuery(q);
    
    if (!q.trim()) {
      setVerifyNameResults([]);
      return;
    }

    setIsSearchingByName(true);
    if (isSandboxMode) {
      const queryLower = q.toLowerCase().trim();
      const matched = sandboxPatients.filter(p => 
        (p.fullName && p.fullName.toLowerCase().includes(queryLower)) || 
        (p.medicalRecordNumber && p.medicalRecordNumber.toLowerCase().includes(queryLower)) ||
        (p.biometricCode && String(p.biometricCode).includes(queryLower))
      );
      setVerifyNameResults(matched);
      setIsSearchingByName(false);
      return;
    }

    try {
      const res = await fetch(`/api/lab/patients/search?q=${encodeURIComponent(q)}`, {
        headers: {
          'x-user-role': currentUser?.role,
          'x-user-name': currentUser.username
        }
      });
      const data = await res.json();
      if (data.success) {
        setVerifyNameResults(data.patients);
      }
    } catch (err) {
      console.error('Failed to search patients by name for verification:', err);
    } finally {
      setIsSearchingByName(false);
    }
  };

  // Search Patient
  const handleSearchPatient = async () => {
    if (!searchQuery.trim()) return;

    if (isSandboxMode) {
      const query = searchQuery.toLowerCase().trim();
      const matched = sandboxPatients.filter(p => 
        p.fullName.toLowerCase().includes(query) || 
        p.medicalRecordNumber.toLowerCase().includes(query) ||
        p.biometricCode.toString().includes(query)
      );
      setSearchResults(matched);
      return;
    }

    try {
      const res = await fetch(`/api/lab/patients/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'x-user-role': currentUser?.role,
          'x-user-name': currentUser.username
        }
      });
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.patients);
      }
    } catch (err) {
      console.error('Failed to search patients:', err);
    }
  };

  // Helper to parse scanned code/URL/QR/Barcode values robustly on client
  const parseCodeClient = (input: string): { cleanNum: string; rawVal: string; isNumeric: boolean } => {
    if (!input) return { cleanNum: '', rawVal: '', isNumeric: false };
    let decoded = decodeURIComponent(input).trim();
    
    // 1. Try to extract from verify-patient URL query parameter
    const verifyMatch = decoded.match(/[?&]verify-patient=([^&]+)/);
    if (verifyMatch) {
      decoded = verifyMatch[1].trim();
    }

    // 2. Try to clean prefixes including FARAH-LAB-, SAMPLE-, etc.
    let clean = decoded;
    clean = clean.replace(/^(FARAH-LAB-|SAMPLE-|BIO-|QR-LAB-|QR-QR-LAB-|QR-|BAR-|TUBE-|SNDBX-QR-|SNDBX-BAR-)+/i, '');
    clean = clean.replace('#', '').trim();

    // Strip leading zeros for numbers (e.g. 00002 -> 2)
    if (/^\d+$/.test(clean)) {
      clean = String(parseInt(clean, 10));
    }

    return {
      rawVal: decoded,
      cleanNum: clean,
      isNumeric: /^\d+$/.test(clean)
    };
  };

  // Fingerprint Scan Verification
  const handleVerifyFingerprint = async (templateToMatch: string) => {
    setVerificationError(null);
    setIsCapturing('verifying');

    const parsed = parseCodeClient(templateToMatch);
    const cleanToMatch = parsed.cleanNum || templateToMatch;

    if (isSandboxMode) {
      setTimeout(() => {
        setIsCapturing(null);
        const cleanToMatchStr = String(cleanToMatch).trim();
        const rawToMatchStr = String(templateToMatch).trim();

        // 1. Check if input matches any sample directly in sandboxSamples or samplesList
        const matchedSampleDirect = [...sandboxSamples, ...samplesList].find(s => {
          const sQr = String(s.qrCode || '').trim();
          const sBar = String(s.barcode || '').trim();
          const sId = String(s.id || '').trim();
          const sQrClean = sQr.replace(/^(FARAH-LAB-|SAMPLE-|BIO-|QR-LAB-|QR-QR-LAB-|QR-|BAR-|TUBE-|SNDBX-QR-|SNDBX-BAR-)+/i, '').replace('#', '').trim();
          const sBarClean = sBar.replace(/^(FARAH-LAB-|SAMPLE-|BIO-|QR-LAB-|QR-QR-LAB-|QR-|BAR-|TUBE-|SNDBX-QR-|SNDBX-BAR-)+/i, '').replace('#', '').trim();

          return (sQr && (sQr === rawToMatchStr || sQr === cleanToMatchStr)) ||
                 (sBar && (sBar === rawToMatchStr || sBar === cleanToMatchStr)) ||
                 (sId && (sId === rawToMatchStr || sId === cleanToMatchStr)) ||
                 (sQrClean && (sQrClean === rawToMatchStr || sQrClean === cleanToMatchStr)) ||
                 (sBarClean && (sBarClean === rawToMatchStr || sBarClean === cleanToMatchStr));
        });

        // 2. Find patient by direct match or through matched sample
        const allPatientsPool = [...sandboxPatients, ...registeredPatientsList];
        const matched = allPatientsPool.find(p => {
          if (matchedSampleDirect && (p.id === matchedSampleDirect.patientId || p.biometricCode === matchedSampleDirect.biometricCode)) {
            return true;
          }

          const pCodeClean = String(p.biometricCode || '').trim().replace('#', '');
          const pIdClean = String(p.id || '').trim().replace('pat-', '').replace('sandbox-p-', '');
          const pMrn = String(p.medicalRecordNumber || '').trim();
          const pFp = String(p.fingerprintTemplate || '').trim();
          const pName = String(p.fullName || '').trim().toLowerCase();
          
          if (!cleanToMatchStr && !rawToMatchStr) return false;

          const directMatch = (pCodeClean && (pCodeClean === cleanToMatchStr || pCodeClean === rawToMatchStr)) ||
                 (pFp && (pFp === rawToMatchStr || pFp === cleanToMatchStr)) ||
                 (String(p.id) && String(p.id) === rawToMatchStr) ||
                 (pIdClean && pIdClean === cleanToMatchStr) ||
                 (pMrn && (pMrn === rawToMatchStr || pMrn === cleanToMatchStr)) ||
                 (pName && pName === rawToMatchStr.toLowerCase());

          if (directMatch) return true;

          // Check if any sample of this patient matches
          return [...sandboxSamples, ...samplesList].some(s => {
            if (s.patientId !== p.id && s.biometricCode !== p.biometricCode) return false;
            const sQr = String(s.qrCode || '').trim();
            const sBar = String(s.barcode || '').trim();
            const sQrClean = sQr.replace(/^(FARAH-LAB-|SAMPLE-|BIO-|QR-LAB-|QR-QR-LAB-|QR-|BAR-|TUBE-|SNDBX-QR-|SNDBX-BAR-)+/i, '').replace('#', '').trim();
            const sBarClean = sBar.replace(/^(FARAH-LAB-|SAMPLE-|BIO-|QR-LAB-|QR-QR-LAB-|QR-|BAR-|TUBE-|SNDBX-QR-|SNDBX-BAR-)+/i, '').replace('#', '').trim();

            return (sQr && (sQr === rawToMatchStr || sQr === cleanToMatchStr)) ||
                   (sBar && (sBar === rawToMatchStr || sBar === cleanToMatchStr)) ||
                   (sQrClean && (sQrClean === rawToMatchStr || sQrClean === cleanToMatchStr)) ||
                   (sBarClean && (sBarClean === rawToMatchStr || sBarClean === cleanToMatchStr));
          });
        });

        if (matched) {
          // Look up latest sample to attach confirmed bloodType, files, status!
          const latestSample = matchedSampleDirect || [...sandboxSamples, ...samplesList]
            .filter(s => s.patientId === matched.id || s.biometricCode === matched.biometricCode)
            .sort((a, b) => new Date(b.collectedAt || 0).getTime() - new Date(a.collectedAt || 0).getTime())[0];

          const verifiedPat = {
            ...matched,
            bloodType: latestSample?.bloodType || matched.bloodType || undefined,
            sampleBarcode: latestSample ? latestSample.barcode : undefined,
            sampleQrCode: latestSample ? latestSample.qrCode : undefined,
            sampleStatus: latestSample ? latestSample.status : undefined,
            allResultsFileBase64: latestSample?.allResultsFileBase64 || matched.allResultsFileBase64 || undefined,
            allResultsFileName: latestSample?.allResultsFileName || matched.allResultsFileName || undefined,
            patientPhotoBase64: matched.patientPhotoBase64 || matched.photoBase64
          };
          playSuccessBeep();
          setVerificationResult(verifiedPat);
          setSelectedPatientForSample(verifiedPat);
          if (verifiedPat.bloodType) {
            setBloodType(verifiedPat.bloodType);
          }
          if (verifiedPat.allResultsFileBase64) {
            setAllResultsFileBase64(verifiedPat.allResultsFileBase64);
            setAllResultsFileName(verifiedPat.allResultsFileName || 'report.pdf');
          }
        } else {
          setVerificationError('لم يتم العثور على مريض أو عينة مطابقة للرمز أو الباركود المدخل.');
        }
      }, 600);
      return;
    }

    setTimeout(async () => {
      try {
        const res = await fetch('/api/lab/patients/verify-fingerprint', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-role': currentUser?.role,
            'x-user-name': currentUser.username
          },
          body: JSON.stringify({ fingerprintTemplate: templateToMatch })
        });

        const data = await res.json();
        setIsCapturing(null);
        if (data.success && data.verified) {
          playSuccessBeep();
          setVerificationResult(data.patient);
          setSelectedPatientForSample(data.patient);
        } else {
          setVerificationError(data.errorAr || 'لم يتم العثور على مريض مطابق للبصمة.');
        }
      } catch (err) {
        setIsCapturing(null);
        setVerificationError('فشل الاتصال بخادم البصمة التحققية.');
      }
    }, 1500);
  };

  // Wristband Sticker Verification
  const handleVerifyWristband = (rawInput: string) => {
    if (!rawInput.trim()) return;
    setVerificationError(null);
    const parsed = parseCodeClient(rawInput);
    
    // Call existing handleVerifyFingerprint with the cleaned code
    handleVerifyFingerprint(parsed.cleanNum || parsed.rawVal || rawInput.trim());
  };

  // Collect Sample
  const handleCollectSample = async () => {
    if (!selectedPatientForSample) return;
    
    if (!bloodType) {
      setSampleCollectionError('يرجى تحديد فصيلة الدم المؤكدة مخبرياً للمريض أولاً!');
      return;
    }
    setSampleCollectionError(null);
    setSampleResult(null);

    const initialResults: any[] = [];
    const analysisList = (sampleAnalysisType || '').split(',').map((s: string) => s.trim()).filter((s: string) => s !== '');
    const activeAnalysisList = analysisList.length > 0 ? analysisList : ['Cross-match (توافق الدم المتقاطع)'];
    
    activeAnalysisList.forEach((analysisName: string) => {
      initialResults.push({
        analysisName,
        value: bloodType ? `فصيلة الدم المؤكدة: ${bloodType}` : 'تم سحب العينة وتأكيد الفصيلة',
        attachmentBase64: allResultsFileBase64 || null,
        attachmentName: allResultsFileName || null,
        updatedAt: new Date().toISOString()
      });
    });

    if (isSandboxMode) {
      const existingSample = sandboxSamples.find(s => s.patientId === selectedPatientForSample.id || (selectedPatientForSample.biometricCode && s.biometricCode === selectedPatientForSample.biometricCode));
      const mockBarcode = existingSample?.barcode || `SNDBX-BAR-${Date.now().toString().slice(-6)}`;
      const mockQr = existingSample?.qrCode || `SNDBX-QR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const targetSample = {
        id: existingSample?.id || ('sandbox-s-' + Date.now()),
        patientId: selectedPatientForSample.id,
        fullName: selectedPatientForSample.fullName,
        age: selectedPatientForSample.age,
        gender: selectedPatientForSample.gender,
        medicalRecordNumber: selectedPatientForSample.medicalRecordNumber,
        barcode: mockBarcode,
        qrCode: mockQr,
        sampleType: sampleType || existingSample?.sampleType || 'Whole Blood (دم كامل)',
        bloodType: bloodType || existingSample?.bloodType,
        analysisType: sampleAnalysisType || existingSample?.analysisType || 'Cross-match',
        status: 'Collected',
        collectedAt: existingSample?.collectedAt || new Date().toISOString(),
        results: initialResults,
        allResultsFileBase64: allResultsFileBase64 || existingSample?.allResultsFileBase64 || null,
        allResultsFileName: allResultsFileName || existingSample?.allResultsFileName || null
      };

      if (existingSample) {
        setSandboxSamples(sandboxSamples.map(s => s.id === existingSample.id ? targetSample : s));
      } else {
        setSandboxSamples([...sandboxSamples, targetSample]);
      }
      setSampleResult(targetSample);

      // Update patient state with newly collected sample details so it stays completely synchronized in UI
      const updatedPatient = {
        ...selectedPatientForSample,
        bloodType: bloodType || existingSample?.bloodType,
        sampleType: sampleType || existingSample?.sampleType || 'Whole Blood (دم كامل)',
        analysisType: sampleAnalysisType || existingSample?.analysisType || 'Cross-match',
        sampleBarcode: mockBarcode,
        sampleQrCode: mockQr,
        allResultsFileBase64: allResultsFileBase64 || existingSample?.allResultsFileBase64 || null,
        allResultsFileName: allResultsFileName || existingSample?.allResultsFileName || null
      };
      setSelectedPatientForSample(updatedPatient);
      setVerificationResult(updatedPatient);

      // Keep sandboxPatients in memory fully synced
      const updatedSandboxPatients = sandboxPatients.map(p => {
        if (p.id === selectedPatientForSample.id) {
          return updatedPatient;
        }
        return p;
      });
      setSandboxPatients(updatedSandboxPatients);

      // Sync with backend immediately
      try {
        fetch('/api/lab/patients/sync-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patients: [updatedPatient], samples: [targetSample] })
        }).catch(() => {});
      } catch (e) {}
      
      // Keep lists fully synced and refreshed on frontend
      fetchRecentPatients();
      
      // Reset fields
      setBloodType('');
      setAllResultsFileBase64(null);
      setAllResultsFileName(null);
      return;
    }

    try {
      const res = await fetch('/api/lab/samples/collect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role,
          'x-user-name': currentUser.username
        },
        body: JSON.stringify({
          patientId: selectedPatientForSample.id,
          sampleType: sampleType || 'Whole Blood (دم كامل)',
          bloodType,
          analysisType: sampleAnalysisType || 'Cross-match',
          collectedBy: currentUser.username,
          allResultsFileBase64,
          allResultsFileName
        })
      });

      const data = await res.json();
      if (data.success) {
        setSampleResult(data.sample);
        fetchStats();

        // Update patient state with newly collected sample details so it stays completely synchronized in UI
        const updatedPatient = {
          ...selectedPatientForSample,
          bloodType: data.sample.bloodType || bloodType,
          sampleType: data.sample.sampleType || sampleType || 'Whole Blood (دم كامل)',
          analysisType: data.sample.analysisType || sampleAnalysisType || 'Cross-match',
          sampleBarcode: data.sample.barcode,
          sampleQrCode: data.sample.qrCode,
          allResultsFileBase64: data.sample.allResultsFileBase64,
          allResultsFileName: data.sample.allResultsFileName
        };
        setSelectedPatientForSample(updatedPatient);
        setVerificationResult(updatedPatient);

        // Sync with backend local ledger immediately to ensure instant QR scanning capability
        try {
          fetch('/api/lab/patients/sync-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patients: [updatedPatient], samples: [data.sample] })
          }).catch(() => {});
        } catch (e) {}
        
        // Keep lists fully synced and refreshed on frontend
        fetchRecentPatients();
        handleLoadRegistryPatients();
        
        // Reset fields
        setBloodType('');
        setAllResultsFileBase64(null);
        setAllResultsFileName(null);
      }
    } catch (err) {
      console.error('Failed to collect sample:', err);
    }
  };

  // Verify Blood Transfusion
  const handleVerifyTransfusion = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTransfusionResult(null);
    setTransfusionError(null);

    if (isSandboxMode) {
      const parsed = parseCodeClient(scannedQrCode);
      const cleanScanned = parsed.cleanNum || scannedQrCode;

      const matchedSample = sandboxSamples.find(s => {
        const p = sandboxPatients.find(pat => pat.id === s.patientId);
        if (!p) return false;

        const cleanSqr = String(s.qrCode || '').replace(/^(FARAH-LAB-|SAMPLE-|BIO-|QR-LAB-|QR-QR-LAB-|QR-|BAR-|TUBE-|SNDBX-QR-|SNDBX-BAR-)+/i, '').replace('#', '').trim();
        const cleanSbar = String(s.barcode || '').replace(/^(FARAH-LAB-|SAMPLE-|BIO-|QR-LAB-|QR-QR-LAB-|QR-|BAR-|TUBE-|SNDBX-QR-|SNDBX-BAR-)+/i, '').replace('#', '').trim();
        const pCodeClean = String(p.biometricCode || '').trim().replace('#', '');
        const pIdClean = String(p.id || '').trim().replace('pat-', '').replace('sandbox-p-', '');
        const pMrn = String(p.medicalRecordNumber || '').trim();

        return s.qrCode === scannedQrCode ||
               s.barcode === scannedQrCode ||
               cleanSqr === cleanScanned ||
               cleanSbar === cleanScanned ||
               pCodeClean === cleanScanned ||
               pIdClean === cleanScanned ||
               pMrn === cleanScanned ||
               p.id === cleanScanned;
      });

      if (!matchedSample) {
        setTransfusionError('فشل التحقق التجريبي: لم يتم العثور على رمز معصم اليد أو ملصق أنبوب مطابق في عينات الفحص التجريبي.');
        return;
      }
      const matchedPatient = sandboxPatients.find(p => p.id === matchedSample.patientId);
      if (!matchedPatient) {
        setTransfusionError('خطأ تجريبي: عينة بلا سجل مريض تجريبي مطابق.');
        return;
      }

      const matchStatus = (bloodBagBarcode.toUpperCase() === 'TEST-FAIL-CASE') ? 'MISMATCH_ALERT' : 'MATCHED';
      setTransfusionResult({
        success: true,
        verified: true,
        status: matchStatus,
        patient: {
          fullName: matchedPatient.fullName,
          medicalRecordNumber: matchedPatient.medicalRecordNumber,
          bloodType: matchedSample.bloodType,
          age: matchedPatient.age,
          biometricCode: matchedPatient.biometricCode,
          patientPhotoBase64: matchedPatient.patientPhotoBase64
        }
      });
      return;
    }

    try {
      const res = await fetch('/api/lab/transfusion/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role,
          'x-user-name': currentUser.username
        },
        body: JSON.stringify({
          qrCode: scannedQrCode,
          bloodBagBarcode,
          nurseName: currentUser.username,
          wardFloor: 'الطابق الثاني - العناية المركزة'
        })
      });

      const data = await res.json();
      if (data.success && data.verified) {
        setTransfusionResult(data);
        fetchStats();
      } else {
        setTransfusionError(data.errorAr || data.error || 'فشلت عملية التحقق المتقاطع.');
      }
    } catch (err) {
      setTransfusionError('فشل الاتصال الفني ببروتوكول التحقق الفوري.');
    }
  };

  return (
    <div className="w-full space-y-6" dir="rtl">
      {/* Module Title and Subtitle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
            <HeartPulse className="w-8 h-8 text-rose-500 animate-pulse" />
            وحدة المختبر ومصرف الدم
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            نظام التحقق المتقاطع لسلامة المرضى ومطابقة الفصائل الطبية وعزل الصلاحيات
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 font-bold flex items-center gap-2">
            <Award className="w-4 h-4 text-[#06b6d4]" />
            الدور الحالي: <span className="text-blue-400 font-black">
              {userRole === 'SuperAdmin' ? 'مدير النظام (SuperAdmin)' : 
               userRole === 'Lab_Technician' ? 'فني مختبر (Lab Technician)' : 
               'ممرض الطابق (Ward Nurse)'}
            </span>
          </div>
          <button 
            type="button"
            onClick={fetchStats}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* RBAC Header Warning for Isolation Verification */}
      {!isSysAdmin && (
        <div className="bg-indigo-950/25 border border-indigo-500/20 rounded-2xl p-4 flex items-center gap-3.5 text-xs text-indigo-200">
          <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0" />
          <span>
            <strong>تأكيد عزل الصلاحيات المالي والوظيفي:</strong> كادر المختبر ومصرف الدم مستبعدين تماماً وبشكل صارم من الوصول إلى شؤون الكوادر، الرواتب، وسجلات المحاسبة المالية للمستشفى.
          </span>
        </div>
      )}

      {/* Dynamic Dashboard Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex items-center gap-4 shadow-xl">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-[11px] font-bold">المرضى المؤرشفين بالبصمة</p>
            <h3 className="text-xl font-black text-white mt-1">{stats.patientsTotal} مريض</h3>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex items-center gap-4 shadow-xl">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Droplet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-[11px] font-bold">عينات الدم المسحوبة</p>
            <h3 className="text-xl font-black text-white mt-1">{stats.samplesTotal} عينة</h3>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex items-center gap-4 shadow-xl">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-[11px] font-bold">مواد ووثائق المختبر المؤرشفة</p>
            <h3 className="text-xl font-black text-cyan-400 mt-1">{materialsList.length} وثيقة ومادة</h3>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex items-center gap-4 shadow-xl">
          <div className={`p-3 rounded-xl ${stats.alertsTotal > 0 ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-slate-800/40 text-slate-500'}`}>
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-[11px] font-bold">تنبيهات الأمان والمطابقة</p>
            <h3 className={`text-xl font-black mt-1 ${stats.alertsTotal > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-300'}`}>{stats.alertsTotal} تنبيه</h3>
          </div>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex border-b border-slate-850 gap-1 pb-0.5 flex-wrap sm:flex-nowrap">
        {hasRegAccess && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveTab('registry'); }}
            className={`py-2.5 px-3.5 border-b-2 text-xs font-bold whitespace-nowrap transition-all flex-1 text-center ${
              activeTab === 'registry' 
                ? 'border-blue-500 text-blue-400 bg-blue-500/5' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            تسجيل مريض جديد
          </button>
        )}
        {hasPatientsAccess && (
          <>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveTab('patients_list'); }}
              className={`py-2.5 px-3.5 border-b-2 text-xs font-bold whitespace-nowrap transition-all flex-1 text-center ${
                activeTab === 'patients_list' 
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              سجل المرضى والتحكم
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveTab('verify'); }}
              className={`py-2.5 px-3.5 border-b-2 text-xs font-bold whitespace-nowrap transition-all flex-1 text-center ${
                activeTab === 'verify' 
                  ? 'border-blue-500 text-blue-400 bg-blue-500/5' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              التحقق من الهوية
            </button>
          </>
        )}
        {hasSamplesAccess && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveTab('samples'); }}
            className={`py-2.5 px-3.5 border-b-2 text-xs font-bold whitespace-nowrap transition-all flex-1 text-center ${
              activeTab === 'samples' 
                ? 'border-blue-500 text-blue-400 bg-blue-500/5' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            سحب العينات وتوليد الباركود
          </button>
        )}
        {hasLogsAccess && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveTab('sample_logs'); }}
            className={`py-2.5 px-3.5 border-b-2 text-xs font-bold whitespace-nowrap transition-all flex-1 text-center ${
              activeTab === 'sample_logs' 
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            سجل العينات والتحاليل
          </button>
        )}
        {hasMaterialsAccess && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveTab('materials'); }}
            className={`py-2.5 px-3.5 border-b-2 text-xs font-bold whitespace-nowrap transition-all flex-1 text-center flex items-center justify-center gap-1.5 ${
              activeTab === 'materials' 
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5 shadow-inner' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-cyan-400" />
            مواد المختبر والأرشفة
          </button>
        )}
      </div>

      {/* TAB 1: Patient Registration */}
      {activeTab === 'registry' && hasRegAccess && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Registration Form */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-950/30 border border-slate-800 space-y-5">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-400" />
              تعبئة البيانات الشخصية للمريض
            </h3>

            <form onSubmit={handleRegisterPatient} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1.5 flex items-center justify-between">
                    <span>الاسم الثلاثي للمريض <span className="text-rose-400 font-black">* (إجباري)</span></span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-black">الحقل الإجباري الوحيد</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: علي جاسم محمد (مطلوب)"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500/50 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1.5 flex items-center justify-between">
                    <span>رقم الغرفة (Room Number)</span>
                    <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded font-bold">اختياري</span>
                  </label>
                  <input 
                    type="text" 
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="رقم الغرفة أو الجناح (اختياري)"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1.5 flex items-center justify-between">
                    <span>العمر بالسنوات</span>
                    <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded font-bold">اختياري</span>
                  </label>
                  <input 
                    type="number" 
                    min="0"
                    max="130"
                    value={age}
                    onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="مثال: 34 (اختياري)"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1.5 flex items-center justify-between">
                    <span>الجنس</span>
                    <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded font-bold">اختياري</span>
                  </label>
                  <select 
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="male">ذكر</option>
                    <option value="female">أنثى</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1.5 flex items-center justify-between">
                    <span>رقم الهاتف للمريض</span>
                    <span className="text-[10px] text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded font-bold">اختياري</span>
                  </label>
                  <input 
                    type="tel" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="مثال: 07701234567 (اختياري)"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs text-right focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1.5 flex items-center justify-between">
                    <span>رقم هاتف شخص مرافق</span>
                    <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded font-bold">اختياري</span>
                  </label>
                  <input 
                    type="tel" 
                    value={companionPhoneNumber}
                    onChange={(e) => setCompanionPhoneNumber(e.target.value)}
                    placeholder="مثال: 07801234567 (اختياري)"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs text-right focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1.5 flex items-center justify-between">
                    <span>اسم الطبيب المعالج / المشرف (Doctor Name)</span>
                    <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded font-bold">اختياري</span>
                  </label>
                  <input 
                    type="text" 
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="مثال: د. أحمد فؤاد (اختياري)"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1.5 flex items-center justify-between">
                    <span>نوع العملية / الإجراء الجراحي (Operation Type)</span>
                    <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded font-bold">اختياري</span>
                  </label>
                  <input 
                    type="text" 
                    list="common-operations-reg-list"
                    value={operationType}
                    onChange={(e) => setOperationType(e.target.value)}
                    placeholder="مثال: ولادة قيصرية / جراحة عامة (اختياري)"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500/50"
                  />
                  <datalist id="common-operations-reg-list">
                    <option value="ولادة قيصرية (Cesarean Section)" />
                    <option value="استئصال الزائدة الدودية (Appendectomy)" />
                    <option value="استئصال المرارة (Cholecystectomy)" />
                    <option value="جراحة عامة (General Surgery)" />
                    <option value="تبديل مفصل (Joint Replacement)" />
                    <option value="قسطرة قلبية (Cardiac Catheterization)" />
                    <option value="جراحة عظام (Orthopedic Surgery)" />
                    <option value="جراحة أورام (Oncology Surgery)" />
                    <option value="عملية طارئة (Emergency Surgery)" />
                    <option value="جراحة مسالك بولية (Urology Surgery)" />
                    <option value="جراحة عيون (Ophthalmic Surgery)" />
                    <option value="فحص روتيني / ترقيد (Routine / Admission)" />
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1.5 flex items-center justify-between">
                  <span>نوع التحليل / التحاليل المطلوبة المجدولة مع الأرشيف</span>
                  <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded font-bold">اختياري</span>
                </label>
                <div className="relative">
                  {/* The Trigger button */}
                  <button
                    type="button"
                    onClick={() => setIsRegDropdownOpen(!isRegDropdownOpen)}
                    className="w-full min-h-[48px] px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm text-right focus:outline-none focus:border-indigo-500/50 flex flex-wrap items-center justify-between gap-1.5 cursor-pointer font-bold select-none"
                    style={{ direction: 'rtl' }}
                  >
                    <div className="flex flex-wrap gap-2 items-center justify-start max-w-[90%] text-right">
                      {analysisType.split(',').map((s) => s.trim()).filter(Boolean).length > 0 ? (
                        analysisType.split(',').map((s) => s.trim()).filter(Boolean).map((tag) => (
                          <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/25 text-indigo-100 rounded-lg text-xs font-bold border border-indigo-500/40 shadow-sm transition-all hover:bg-indigo-500/35">
                            {tag}
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                const currentList = analysisType.split(',').map((s) => s.trim()).filter(Boolean);
                                const newList = currentList.filter(t => t !== tag);
                                setAnalysisType(newList.join(', '));
                              }}
                              className="text-rose-400 hover:text-rose-300 text-sm font-black cursor-pointer px-1 leading-none"
                            >
                              ×
                            </span>
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 font-bold text-sm">اضغط لاختيار أو البحث عن التحاليل...</span>
                      )}
                    </div>
                    <span className="text-slate-400 text-xs shrink-0">▼</span>
                  </button>

                  {/* Dropdown Menu */}
                  {isRegDropdownOpen && (
                    <>
                      {/* Click outside to close overlay */}
                      <div className="fixed inset-0 z-40" onClick={() => setIsRegDropdownOpen(false)} />
                      
                      <div className="absolute right-0 top-full mt-2 w-full bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl z-50 p-4 space-y-3.5 max-h-[350px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 text-right" style={{ direction: 'rtl' }}>
                        {/* Search Input inside Dropdown */}
                        <div className="relative">
                          <input
                            type="text"
                            value={regSearchQuery}
                            onChange={(e) => setRegSearchQuery(e.target.value)}
                            placeholder="ابحث في التحاليل المتاحة..."
                            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm text-right focus:outline-none focus:border-indigo-500/50 pr-8 font-bold"
                          />
                           <span className="absolute right-2.5 top-3 text-slate-500 text-sm">🔍</span>
                        </div>

                        {/* Options List */}
                        <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                          {savedAnalysisTypes
                            .filter((type) => type.toLowerCase().includes(regSearchQuery.toLowerCase()))
                            .map((type) => {
                              const currentList = analysisType.split(',').map((s) => s.trim()).filter(Boolean);
                              const isChecked = currentList.includes(type);
                              return (
                                <button
                                  type="button"
                                  key={type}
                                  onClick={() => {
                                    let newList;
                                    if (isChecked) {
                                      newList = currentList.filter(t => t !== type);
                                    } else {
                                      newList = [...currentList, type];
                                    }
                                    setAnalysisType(newList.join(', '));
                                  }}
                                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm cursor-pointer select-none transition-all ${
                                    isChecked 
                                      ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200 font-extrabold shadow-sm' 
                                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {}} // handled by button click
                                      className="w-4 h-4 accent-indigo-500 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                                    />
                                    <span className="font-bold text-sm text-right">{type}</span>
                                  </div>
                                  {isChecked && <span className="text-indigo-400 font-black text-xs bg-indigo-500/10 px-2 py-0.5 rounded-md">✓ محدد</span>}
                                </button>
                              );
                            })}
                          
                          {savedAnalysisTypes.filter((type) => type.toLowerCase().includes(regSearchQuery.toLowerCase())).length === 0 && (
                            <div className="text-center py-3 text-xs text-slate-500 italic">
                              لا توجد فحوصات مطابقة للبحث.
                            </div>
                          )}
                        </div>

                        {/* Add New Option Inline inside Dropdown */}
                        <div className="border-t border-slate-800/60 pt-3 flex gap-2">
                          <input
                            type="text"
                            value={newAnalysisTypeInput}
                            onChange={(e) => setNewAnalysisTypeInput(e.target.value)}
                            placeholder="إضافة تحليل جديد وتحديده..."
                            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-sm text-right focus:outline-none focus:border-indigo-500/50 font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newAnalysisTypeInput.trim()) {
                                const val = newAnalysisTypeInput.trim();
                                if (!savedAnalysisTypes.includes(val)) {
                                  const updated = [...savedAnalysisTypes, val];
                                  setSavedAnalysisTypes(updated);
                                  localStorage.setItem('saved_analysis_types', JSON.stringify(updated));
                                }
                                const currentList = analysisType.split(',').map((s) => s.trim()).filter(Boolean);
                                if (!currentList.includes(val)) {
                                  setAnalysisType([...currentList, val].join(', '));
                                }
                                setNewAnalysisTypeInput('');
                              }
                            }}
                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg font-black transition-colors cursor-pointer shrink-0"
                          >
                            + إضافة
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">يتم ربط نوع التحليل تلقائياً مع الهوية الحيوية وملصقات الأنابيب عند التحقق ومطابقة البصمة.</p>
              </div>

              {/* Action Message Alert */}
              {registryMessage && (
                <div className={`p-3.5 rounded-xl border text-xs space-y-2.5 text-right ${
                  registryMessage.type === 'success' 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                }`} style={{ direction: 'rtl' }}>
                  <p>{registryMessage.text}</p>
                  {registryMessage.type === 'success' && selectedPatientForSample && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('samples')}
                      className="mt-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg transition-all flex items-center gap-1.5 cursor-pointer inline-flex"
                    >
                      <Droplet className="w-3.5 h-3.5" />
                      الذهاب لسحب عينة دم لهذا المريض (سحب العينة) ←
                    </button>
                  )}
                </div>
              )}

              {getLabPermission('fingerprint_registration') === 'read' && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl text-xs font-bold text-center" style={{ direction: 'rtl' }}>
                  ⚠️ وضع القراءة فقط: لا تملك صلاحية تسجيل مرضى جدد.
                </div>
              )}

              <button
                type="submit"
                disabled={getLabPermission('fingerprint_registration') === 'read'}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                حفظ واصدار الارشيف الطبي وتوليد كيو ار كود الاسوار
              </button>
            </form>
          </div>

          {/* Biometric Scan Simulator Panel */}
          <div className="p-6 rounded-2xl bg-slate-950/30 border border-slate-800 flex flex-col justify-between space-y-6">
            <div>
              <h3 className="text-base font-black text-white mb-2.5 flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-indigo-400" />
                محاكي التقاط الأجهزة والملحقات
              </h3>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                انقر على الأزرار لتوليد بصمات المريض والتقاط الصور الثابتة محاكاة للأجهزة الطبية الخارجية المرتبطة.
              </p>
            </div>

            <div className="space-y-4">
              {/* Fingerprint Capture Simulator */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                    <Fingerprint className={`w-4 h-4 ${fingerprintCaptured ? 'text-emerald-400' : 'text-slate-500'}`} />
                    قارئ البصمة البيومتري النشط (اختياري)
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                    fingerprintCaptured 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : connectedBioDevice 
                      ? 'bg-emerald-500/10 text-emerald-400 animate-pulse border border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {fingerprintCaptured 
                      ? 'تم الالتقاط بنجاح' 
                      : connectedBioDevice 
                      ? 'مستعد للقراءة' 
                      : 'جهاز غير موصول'}
                  </span>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowHandFingerprintModal(true); }}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 border border-emerald-500/30 text-white text-xs rounded-xl font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-950/20"
                  >
                    <Fingerprint className="w-5 h-5 text-emerald-200 animate-pulse" />
                    اخذ بصمة المريض البايومترية (اختياري)
                  </button>

                  <div className="flex gap-2 justify-between text-[10px] text-slate-400 px-1 mt-1">
                    <span>
                      الجهاز الموصول: <span className={connectedBioDevice ? "text-emerald-400 font-bold" : "text-slate-500"}>
                        {connectedBioDevice ? connectedBioDevice.name : "قارئ افتراضي"}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowBioDeviceModal(true); }}
                      className="text-indigo-400 hover:underline hover:text-indigo-300 font-bold"
                    >
                      🔌 إدارة الأجهزة
                    </button>
                  </div>

                  {fingerprintCaptured && (
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 flex flex-col gap-1 mt-1.5 text-right">
                      <div className="font-bold flex items-center gap-1 justify-end">
                        <span>تم التقاط البصمة بنجاح ✅</span>
                      </div>
                      <div className="font-mono text-[9px] text-slate-300 truncate text-left" dir="ltr">
                        {fingerprintTemplate}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Patient Photo Capture Simulator */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                    <Camera className={`w-4.5 h-4.5 ${patientPhoto ? 'text-emerald-400' : 'text-slate-500'}`} />
                    كاميرا المريض (Face Photo - اختياري)
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                    patientPhoto 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : isCapturing === 'face'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {patientPhoto 
                      ? 'تم التقاط الصورة' 
                      : isCapturing === 'face'
                      ? 'جاري التقاط...'
                      : 'جهاز غير موصول'}
                  </span>
                </div>
                {patientPhoto && (
                  <div className="flex justify-center my-2">
                    <img src={patientPhoto} alt="Patient Mock" className="w-16 h-16 rounded-full object-cover border-2 border-emerald-400 shadow-md shadow-emerald-950/40" referrerPolicy="no-referrer" />
                  </div>
                )}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleCaptureFace}
                    disabled={isCapturing !== null}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 border border-emerald-500/30 text-white text-xs rounded-xl font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-950/20 disabled:opacity-50"
                  >
                    <Camera className="w-5 h-5 text-emerald-200 animate-pulse" />
                    {isCapturing === 'face' ? 'التقاط الصورة عبر الكاميرا...' : 'التقاط صورة وجه المريض (اختياري)'}
                  </button>

                  <div className="flex gap-2 justify-between text-[10px] text-slate-400 px-1 mt-1">
                    <span>
                      الكاميرا النشطة: <span className="text-slate-500">Virtual Dual Cam</span>
                    </span>
                    <span className="text-indigo-400 font-bold">
                      📷 إدارة الكاميرا
                    </span>
                  </div>

                  {patientPhoto && (
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 flex flex-col gap-1 mt-1.5 text-right">
                      <div className="font-bold flex items-center gap-1 justify-end">
                        <span>تم التقاط الصورة الطبية بنجاح ✅</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ID Capture Simulator */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                    <FileText className={`w-4.5 h-4.5 ${nationalIdPhoto ? 'text-emerald-400' : 'text-slate-500'}`} />
                    ماسح البطاقة الوطنية (National ID Scan - اختياري)
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                    nationalIdPhoto 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : isCapturing === 'id_card'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {nationalIdPhoto 
                      ? 'تم مسح الهوية' 
                      : isCapturing === 'id_card'
                      ? 'جاري المسح...'
                      : 'جهاز غير موصول'}
                  </span>
                </div>
                {nationalIdPhoto && (
                  <div className="flex justify-center my-2">
                    <img src={nationalIdPhoto} alt="ID Document Mock" className="h-16 w-24 rounded object-cover border border-emerald-400 shadow-md shadow-emerald-950/40" referrerPolicy="no-referrer" />
                  </div>
                )}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleCaptureIDCard}
                    disabled={isCapturing !== null}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 border border-emerald-500/30 text-white text-xs rounded-xl font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-950/20 disabled:opacity-50"
                  >
                    <FileText className="w-5 h-5 text-emerald-200 animate-pulse" />
                    {isCapturing === 'id_card' ? 'جاري مسح وجهي البطاقة...' : 'محاكاة مسح البطاقة الوطنية (اختياري)'}
                  </button>

                  <div className="flex gap-2 justify-between text-[10px] text-slate-400 px-1 mt-1">
                    <span>
                      القارئ النشط: <span className="text-slate-500">Document Scanner Hub</span>
                    </span>
                    <span className="text-indigo-400 font-bold">
                      📝 إدارة الماسح
                    </span>
                  </div>

                  {nationalIdPhoto && (
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 flex flex-col gap-1 mt-1.5 text-right">
                      <div className="font-bold flex items-center gap-1 justify-end">
                        <span>تم سحب بيانات البطاقة الموحدة بنجاح ✅</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* TAB: Patients Registry & Management */}
      {activeTab === 'patients_list' && hasPatientsAccess && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="space-y-1 text-right">
                <h3 className="text-lg font-black text-white">سجل جميع المرضى</h3>
                <p className="text-xs text-slate-400">ابحث عن أي مريض لتعديل بياناته، أو حذفه، أو تصفح ملفه التعريفي الموحد.</p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  placeholder="ابحث بالاسم أو رقم الغرفة أو الرمز..."
                  value={registrySearch}
                  onChange={(e) => setRegistrySearch(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-slate-200 text-xs text-right focus:outline-none transition-all placeholder:text-slate-500 font-bold"
                />
                <Search className="w-4 h-4 text-slate-500 absolute top-3 right-3" />
              </div>
            </div>

            {registryActionMessage && (
              <div className={`p-3.5 rounded-xl mb-4 text-xs font-bold text-right flex items-center justify-between ${
                registryActionMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' : 'bg-rose-500/10 text-rose-400 border border-rose-500/15'
              }`}>
                <span>{registryActionMessage.text}</span>
                <button onClick={() => setRegistryActionMessage(null)} className="text-slate-400 hover:text-slate-200 font-black cursor-pointer">×</button>
              </div>
            )}

            {/* Patients Table */}
            {registryLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                <p className="text-xs text-slate-400 font-bold">جاري تحميل سجل المرضى وتحديث البيانات...</p>
              </div>
            ) : registryPatients.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-800 rounded-2xl">
                <User className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-400">لم يتم العثور على أي مرضى في السجل</p>
                <p className="text-xs text-slate-500 mt-1">تأكد من كتابة الاسم بشكل صحيح أو قم بتسجيل مريض جديد.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800/60 overflow-hidden">
                <table className="w-full text-right text-[11px] table-auto">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10.5px]">
                      <th className="py-2.5 px-2 font-black text-center whitespace-nowrap">الرمز</th>
                      <th className="py-2.5 px-2 font-black whitespace-nowrap">اسم المريض</th>
                      <th className="py-2.5 px-2 font-black whitespace-nowrap">الطبيب</th>
                      <th className="py-2.5 px-2 font-black whitespace-nowrap">العملية</th>
                      <th className="py-2.5 px-2 font-black whitespace-nowrap">التحاليل</th>
                      <th className="py-2.5 px-1.5 font-black text-center whitespace-nowrap">الغرفة</th>
                      <th className="py-2.5 px-1.5 font-black whitespace-nowrap">العمر/الجنس</th>
                      <th className="py-2.5 px-1.5 font-black whitespace-nowrap">الهاتف</th>
                      <th className="py-2.5 px-1.5 font-black text-rose-400 whitespace-nowrap">الفصيلة / الباركود</th>
                      <th className="py-2.5 px-1.5 font-black whitespace-nowrap">المرفقات</th>
                      <th className="py-2.5 px-1.5 font-black text-center text-emerald-400 whitespace-nowrap">طباعة الملصقات</th>
                      <th className="py-2.5 px-1.5 font-black text-center whitespace-nowrap">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 bg-slate-950/20">
                    {registryPatients.map((patient) => (
                      <tr key={patient.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-2 px-2 font-mono font-bold text-emerald-400 text-center whitespace-nowrap">
                          #{patient.biometricCode}
                        </td>
                        <td className="py-2 px-2 font-black text-white whitespace-nowrap text-[11.5px]">
                          {patient.fullName}
                        </td>
                        <td className="py-2 px-2 text-indigo-300 font-bold whitespace-nowrap">
                          {patient.doctorName ? (
                            <span className="inline-flex items-center gap-1 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 text-[10px]">
                              👨‍⚕️ {patient.doctorName}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[10px]">غير محدد</span>
                          )}
                        </td>
                        <td className="py-2 px-2 font-bold whitespace-nowrap" dir="ltr">
                          {patient.operationType ? (
                            <span className="inline-flex items-center gap-0.5 bg-teal-500/10 text-teal-300 px-1.5 py-0.5 rounded border border-teal-500/20 text-[10px]">
                              🩺 {cleanOperationTypeEnglish(patient.operationType)}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[10px]">N/A</span>
                          )}
                        </td>
                        <td className="py-2 px-2" dir="ltr">
                          <div className="flex flex-wrap gap-0.5 items-center">
                            {cleanAnalysisType(patient.analysisType).split('+').map((testName, idx) => (
                              <span key={idx} className="inline-block px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/25 text-blue-300 rounded text-[9.5px] font-black uppercase whitespace-nowrap">
                                {testName.trim()}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2 px-1.5 text-slate-300 font-bold text-center whitespace-nowrap">
                          {patient.roomNumber || '-'}
                        </td>
                        <td className="py-2 px-1.5 text-slate-300 whitespace-nowrap text-[10.5px]">
                          {patient.age || 0} س / {patient.gender === 'male' ? 'ذكر' : 'أنثى'}
                        </td>
                        <td className="py-2 px-1.5 text-slate-300 font-mono text-[10px] whitespace-nowrap">
                          {patient.phoneNumber || '-'}
                        </td>
                        <td className="py-2 px-1.5 whitespace-nowrap">
                          {patient.bloodType ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="inline-block px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded text-[9.5px] font-black w-fit">{patient.bloodType} 🩸</span>
                              {patient.sampleBarcode && (
                                <span className="text-[8.5px] text-slate-400 font-mono select-all font-bold">{patient.sampleBarcode}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[9px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">لم تسحب عينة</span>
                          )}
                        </td>
                        <td className="py-2 px-1.5">
                          <div className="flex items-center gap-1">
                            {patient.patientPhotoBase64 ? (
                              <img
                                src={patient.patientPhotoBase64}
                                alt="صورة"
                                className="w-6 h-6 rounded object-cover border border-slate-700"
                                title="صورة الوجه"
                                referrerPolicy="no-referrer"
                                loading="lazy"
                              />
                            ) : null}
                            {patient.nationalIdPhotoBase64 ? (
                              <img
                                src={patient.nationalIdPhotoBase64}
                                alt="هوية"
                                className="w-6 h-6 rounded object-cover border border-slate-700"
                                title="الهوية الوطنية"
                                referrerPolicy="no-referrer"
                                loading="lazy"
                              />
                            ) : null}
                            {!patient.patientPhotoBase64 && !patient.nationalIdPhotoBase64 && !patient.allResultsFileBase64 && (
                              <span className="text-[9px] text-slate-600">بلا مرفقات</span>
                            )}
                            {patient.allResultsFileBase64 && (
                              <button
                                type="button"
                                onClick={() => setPdfToView({ base64: patient.allResultsFileBase64, name: patient.allResultsFileName || 'report.pdf' })}
                                className="px-1.5 py-0.5 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 hover:border-rose-500 rounded text-[9px] font-bold transition-all cursor-pointer"
                                title={patient.allResultsFileName || 'تقرير شامل'}
                              >
                                PDF
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-1.5">
                          <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setShowWristbandModal(patient);
                                handlePrintWristbandOnRegister(patient);
                              }}
                              title="طباعة سوار المعصم"
                              className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 hover:border-emerald-500 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                            >
                              <Printer className="w-3 h-3" />
                              <span>السوار</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowWristbandModal(patient);
                                handlePrintTablehBarcode(patient);
                              }}
                              title="طباعة ملصق الطبلة"
                              className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/30 hover:border-blue-500 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                            >
                              <Printer className="w-3 h-3" />
                              <span>الطبلة</span>
                            </button>
                          </div>
                        </td>
                        <td className="py-2 px-1.5">
                          {getLabPermission('patient_log') === 'read' ? (
                            <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-bold">عرض</span>
                          ) : (
                            <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                              <button
                                onClick={() => startEditing(patient)}
                                className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded text-[10px] font-bold flex items-center gap-0.5 cursor-pointer transition-all"
                              >
                                <Edit className="w-3 h-3" />
                                تعديل
                              </button>
                              <button
                                onClick={() => setDeletingPatientId(patient.id)}
                                className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded text-[10px] font-bold flex items-center gap-0.5 cursor-pointer transition-all"
                              >
                                <Trash2 className="w-3 h-3" />
                                حذف
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Edit Patient Modal Dialog */}
          {editingPatient && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
              <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-right">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <button onClick={() => setEditingPatient(null)} className="text-slate-400 hover:text-white text-lg font-black cursor-pointer">×</button>
                  <h3 className="text-md font-black text-white flex items-center gap-2">
                    تعديل بيانات المريض: <span className="text-emerald-400">#{editingPatient.biometricCode}</span>
                  </h3>
                </div>

                <form onSubmit={handleUpdatePatient} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">الاسم الكامل للمريض</label>
                      <input
                        type="text"
                        required
                        value={editFullName}
                        onChange={(e) => setEditFullName(e.target.value)}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 text-right focus:outline-none focus:border-emerald-500 transition-all font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">رقم الغرفة (Room Number)</label>
                      <input
                        type="text"
                        value={editRoomNumber}
                        onChange={(e) => setEditRoomNumber(e.target.value)}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 text-right focus:outline-none focus:border-emerald-500 transition-all font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">العمر (سنوات)</label>
                      <input
                        type="number"
                        value={editAge}
                        onChange={(e) => setEditAge(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 text-right focus:outline-none focus:border-emerald-500 transition-all font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">الجنس البيولوجي</label>
                      <select
                        value={editGender}
                        onChange={(e) => setEditGender(e.target.value as 'male' | 'female')}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 text-right focus:outline-none focus:border-emerald-500 transition-all font-bold"
                      >
                        <option value="male">ذكر (Male)</option>
                        <option value="female">أنثى (Female)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">رقم الهاتف للمريض</label>
                      <input
                        type="tel"
                        value={editPhoneNumber}
                        onChange={(e) => setEditPhoneNumber(e.target.value)}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 text-right focus:outline-none focus:border-emerald-500 transition-all font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">رقم هاتف شخص مرافق (اختياري)</label>
                      <input
                        type="tel"
                        value={editCompanionPhoneNumber}
                        onChange={(e) => setEditCompanionPhoneNumber(e.target.value)}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 text-right focus:outline-none focus:border-emerald-500 transition-all font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">اسم الطبيب المعالج / المشرف (اختياري)</label>
                      <input
                        type="text"
                        value={editDoctorName}
                        onChange={(e) => setEditDoctorName(e.target.value)}
                        placeholder="مثال: د. أحمد فؤاد"
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 text-right focus:outline-none focus:border-emerald-500 transition-all font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">نوع العملية / الإجراء الجراحي (اختياري)</label>
                      <input
                        type="text"
                        list="common-operations-edit-list"
                        value={editOperationType}
                        onChange={(e) => setEditOperationType(e.target.value)}
                        placeholder="مثال: ولادة قيصرية / جراحة عامة"
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 text-right focus:outline-none focus:border-emerald-500 transition-all font-bold"
                      />
                      <datalist id="common-operations-edit-list">
                        <option value="ولادة قيصرية (Cesarean Section)" />
                        <option value="استئصال الزائدة الدودية (Appendectomy)" />
                        <option value="استئصال المرارة (Cholecystectomy)" />
                        <option value="جراحة عامة (General Surgery)" />
                        <option value="تبديل مفصل (Joint Replacement)" />
                        <option value="قسطرة قلبية (Cardiac Catheterization)" />
                        <option value="جراحة عظام (Orthopedic Surgery)" />
                        <option value="جراحة أورام (Oncology Surgery)" />
                        <option value="عملية طارئة (Emergency Surgery)" />
                        <option value="جراحة مسالك بولية (Urology Surgery)" />
                        <option value="جراحة عيون (Ophthalmic Surgery)" />
                        <option value="فحص روتيني / ترقيد (Routine / Admission)" />
                      </datalist>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">نوع التحليل / الفحوصات الافتراضية المطلوبة *</label>
                    <div className="relative">
                      {/* The Trigger button */}
                      <button
                        type="button"
                        onClick={() => setIsEditDropdownOpen(!isEditDropdownOpen)}
                        className="w-full min-h-[48px] px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm text-right focus:outline-none focus:border-emerald-500 flex flex-wrap items-center justify-between gap-1.5 cursor-pointer font-bold select-none"
                        style={{ direction: 'rtl' }}
                      >
                        <div className="flex flex-wrap gap-2 items-center justify-start max-w-[90%] text-right">
                          {editAnalysisType.split(',').map((s) => s.trim()).filter(Boolean).length > 0 ? (
                            editAnalysisType.split(',').map((s) => s.trim()).filter(Boolean).map((tag) => (
                              <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/25 text-emerald-100 rounded-lg text-xs font-bold border border-emerald-500/40 shadow-sm transition-all hover:bg-emerald-500/35">
                                {tag}
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const currentList = editAnalysisType.split(',').map((s) => s.trim()).filter(Boolean);
                                    const newList = currentList.filter(t => t !== tag);
                                    setEditAnalysisType(newList.join(', '));
                                  }}
                                  className="text-rose-400 hover:text-rose-300 text-sm font-black cursor-pointer px-1 leading-none"
                                >
                                  ×
                                </span>
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-500 font-bold text-sm">اضغط لاختيار أو البحث عن التحاليل...</span>
                          )}
                        </div>
                        <span className="text-slate-400 text-xs shrink-0">▼</span>
                      </button>

                      {/* Dropdown Menu */}
                      {isEditDropdownOpen && (
                        <>
                          {/* Click outside to close overlay */}
                          <div className="fixed inset-0 z-40" onClick={() => setIsEditDropdownOpen(false)} />
                          
                          <div className="absolute right-0 top-full mt-2 w-full bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl z-50 p-4 space-y-3.5 max-h-[300px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 text-right" style={{ direction: 'rtl' }}>
                            {/* Search Input inside Dropdown */}
                            <div className="relative">
                              <input
                                type="text"
                                value={editSearchQuery}
                                onChange={(e) => setEditSearchQuery(e.target.value)}
                                placeholder="ابحث في التحاليل المتاحة..."
                                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm text-right focus:outline-none focus:border-emerald-500 pr-8 font-bold"
                              />
                              <span className="absolute right-2.5 top-3 text-slate-500 text-sm">🔍</span>
                            </div>

                            {/* Options List */}
                            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                              {savedAnalysisTypes
                                .filter((type) => type.toLowerCase().includes(editSearchQuery.toLowerCase()))
                                .map((type) => {
                                  const currentList = editAnalysisType.split(',').map((s) => s.trim()).filter(Boolean);
                                  const isChecked = currentList.includes(type);
                                  return (
                                    <button
                                      type="button"
                                      key={type}
                                      onClick={() => {
                                        let newList;
                                        if (isChecked) {
                                          newList = currentList.filter(t => t !== type);
                                        } else {
                                          newList = [...currentList, type];
                                        }
                                        setEditAnalysisType(newList.join(', '));
                                      }}
                                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm cursor-pointer select-none transition-all ${
                                        isChecked 
                                          ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-200 font-extrabold shadow-sm' 
                                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => {}} // handled by button click
                                          className="w-4 h-4 accent-emerald-500 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500 pointer-events-none"
                                        />
                                        <span className="font-bold text-sm text-right">{type}</span>
                                      </div>
                                      {isChecked && <span className="text-emerald-400 font-black text-xs bg-emerald-500/10 px-2 py-0.5 rounded-md">✓ محدد</span>}
                                    </button>
                                  );
                                })}
                              
                              {savedAnalysisTypes.filter((type) => type.toLowerCase().includes(editSearchQuery.toLowerCase())).length === 0 && (
                                <div className="text-center py-3 text-xs text-slate-500 italic">
                                  لا توجد فحوصات مطابقة للبحث.
                                </div>
                              )}
                            </div>

                            {/* Add New Option Inline inside Dropdown */}
                            <div className="border-t border-slate-800/60 pt-3 flex gap-2">
                              <input
                                type="text"
                                value={newAnalysisTypeInput}
                                onChange={(e) => setNewAnalysisTypeInput(e.target.value)}
                                placeholder="إضافة تحليل جديد وتحديده..."
                                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-sm text-right focus:outline-none focus:border-emerald-500 font-bold"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (newAnalysisTypeInput.trim()) {
                                    const val = newAnalysisTypeInput.trim();
                                    if (!savedAnalysisTypes.includes(val)) {
                                      const updated = [...savedAnalysisTypes, val];
                                      setSavedAnalysisTypes(updated);
                                      localStorage.setItem('saved_analysis_types', JSON.stringify(updated));
                                    }
                                    const currentList = editAnalysisType.split(',').map((s) => s.trim()).filter(Boolean);
                                    if (!currentList.includes(val)) {
                                      setEditAnalysisType([...currentList, val].join(', '));
                                    }
                                    setNewAnalysisTypeInput('');
                                  }
                                }}
                                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg font-black transition-colors cursor-pointer shrink-0"
                              >
                                + إضافة
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Photo attachments update options */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="border border-slate-800 bg-slate-950/40 p-3 rounded-xl text-center space-y-2">
                      <span className="text-[10px] text-slate-400 font-bold block">صورة وجه المريض</span>
                      {editPatientPhoto ? (
                        <div className="relative inline-block">
                          <img src={editPatientPhoto} className="w-16 h-16 object-cover rounded-lg mx-auto border border-slate-700" alt="وجه" />
                          <button
                            type="button"
                            onClick={() => setEditPatientPhoto(null)}
                            className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-rose-600 rounded-full text-white text-xs font-black flex items-center justify-center cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div className="h-16 flex items-center justify-center border border-dashed border-slate-800 rounded-lg">
                          <span className="text-[10px] text-slate-600">لا توجد صورة</span>
                        </div>
                      )}
                      <label className="block text-[10px] bg-slate-800 hover:bg-slate-750 text-slate-300 px-2 py-1 rounded cursor-pointer font-bold">
                        تغيير الصورة
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onload = () => setEditPatientPhoto(r.result as string);
                              r.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>

                    <div className="border border-slate-800 bg-slate-950/40 p-3 rounded-xl text-center space-y-2">
                      <span className="text-[10px] text-slate-400 font-bold block">البطاقة الوطنية</span>
                      {editNationalIdPhoto ? (
                        <div className="relative inline-block">
                          <img src={editNationalIdPhoto} className="w-24 h-16 object-contain bg-slate-950 rounded-lg mx-auto border border-slate-700" alt="البطاقة" />
                          <button
                            type="button"
                            onClick={() => setEditNationalIdPhoto(null)}
                            className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-rose-600 rounded-full text-white text-xs font-black flex items-center justify-center cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div className="h-16 flex items-center justify-center border border-dashed border-slate-800 rounded-lg">
                          <span className="text-[10px] text-slate-600">لا توجد صورة</span>
                        </div>
                      )}
                      <label className="block text-[10px] bg-slate-800 hover:bg-slate-750 text-slate-300 px-2 py-1 rounded cursor-pointer font-bold">
                        تغيير الصورة
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onload = () => setEditNationalIdPhoto(r.result as string);
                              r.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4 border-t border-slate-850">
                    <button
                      type="button"
                      onClick={() => setEditingPatient(null)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs rounded-xl font-bold transition-all cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-xl font-bold transition-all cursor-pointer"
                    >
                      حفظ التغييرات
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Patient Confirmation Modal */}
          {deletingPatientId && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
              <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-right space-y-4">
                <div className="text-rose-400 bg-rose-500/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div className="space-y-1 text-center">
                  <h4 className="text-md font-black text-white">تأكيد حذف ملف المريض</h4>
                  <p className="text-xs text-slate-400">
                    هل أنت متأكد تماماً من رغبتك في حذف هذا المريض؟
                  </p>
                  <p className="text-[11px] text-rose-400 font-bold bg-rose-500/5 p-2 rounded-lg mt-2 font-black">
                    ⚠️ هذا الإجراء سيؤدي إلى حذف المريض نهائياً مع كافة العينات والتحاليل وسجلات مطابقة الدم المرتبطة به ولا يمكن التراجع عن ذلك!
                  </p>
                </div>
                <div className="flex gap-2 justify-center pt-2">
                  <button
                    onClick={() => setDeletingPatientId(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs rounded-xl font-bold transition-all cursor-pointer"
                  >
                    إلغاء التراجع
                  </button>
                  <button
                    onClick={() => handleDeletePatient(deletingPatientId)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs rounded-xl font-bold transition-all cursor-pointer"
                  >
                    نعم، احذف المريض نهائياً
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Identity Scanner / Fingerprint Verification */}
      {activeTab === 'verify' && hasPatientsAccess && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Scan Action Card */}
            <div className="p-6 rounded-2xl bg-slate-950/30 border border-slate-800 space-y-5 text-center flex flex-col justify-start items-center">
              {/* Tab Selector */}
              <div className="flex w-full p-1 bg-slate-900/80 border border-slate-800 rounded-xl mb-2 gap-1">
                <button
                  type="button"
                  onClick={() => setVerifyMethod('fingerprint')}
                  className={`flex-1 py-1.5 text-[11px] md:text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    verifyMethod === 'fingerprint' 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Fingerprint className="w-3.5 h-3.5" />
                  التحقق بالبصمة
                </button>
                <button
                  type="button"
                  onClick={() => setVerifyMethod('wristband')}
                  className={`flex-1 py-1.5 text-[11px] md:text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    verifyMethod === 'wristband' 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  ملصق السوار
                </button>
                <button
                  type="button"
                  onClick={() => setVerifyMethod('name')}
                  className={`flex-1 py-1.5 text-[11px] md:text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    verifyMethod === 'name' 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  التحقق بالاسم
                </button>
              </div>

              {verifyMethod === 'fingerprint' ? (
                <>
                  <button
                    type="button"
                    title="انقر هنا لإجراء المسح الضوئي وقراءة البصمة الحية 🩸"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      // 1. Auto-connect agent / virtual driver hub if not connected yet
                      let currentDevice = connectedBioDevice;
                      if (!currentDevice) {
                        setBioScannerLogs(prev => [...prev, "🔄 جاري تهيئة مستشعرات القارئ والربط مع المنفذ التلقائي..."]);
                        await handleConnectLocalAgent();
                        currentDevice = BIOMETRIC_USB_DEVICES[0];
                      }

                      // 2. Select patient biometric code to scan automatically if the input is blank
                      let targetCode = fingerprintToScan;
                      if (!targetCode) {
                        const activePatients = isSandboxMode ? sandboxPatients : registeredPatientsList;
                        if (activePatients.length === 1) {
                          const candidate = activePatients[0];
                          targetCode = candidate.biometricCode || candidate.fingerprintTemplate || candidate.id;
                          setFingerprintToScan(targetCode);
                          setBioScannerLogs(prev => [...prev, `🔍 تم توجيه البصمة للمريض الوحيد المسجل: ${candidate.fullName}`]);
                        } else if (activePatients.length > 1) {
                          setBioScannerLogs(prev => [...prev, "⚠️ تنبيه: يوجد أكثر من مريض مسجل! يرجى اختيار المريض المحدد من القائمة المنسدلة أصل الجهاز لمطابقة بصمته الخاصة."]);
                        }
                      }

                      // 3. Initiate the scanning animation and then verify
                      handleTriggerBiometricScan('verify', targetCode);
                    }}
                    disabled={isScanningFingerprint}
                    className="p-5 rounded-full bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 hover:border-blue-500/60 text-blue-400 hover:text-blue-300 mb-2 transition-all cursor-pointer focus:outline-none flex items-center justify-center animate-pulse hover:scale-105 active:scale-95 disabled:opacity-40"
                  >
                    <Fingerprint className="w-12 h-12" />
                  </button>
                  <h3 className="text-base font-black text-white">التحقق اللحظي عبر مسح البصمة البيومترية</h3>
                  <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
                    عند حضور المريض إلى المختبر، <span className="text-cyan-400 font-bold">حدد اسم المريض من القائمة المنسدلة أدناه</span> أو ضع إصبعه على الماسح الضوئي لتأكيد هويته ومطابقة بصمته المخصصة فوراً.
                  </p>

                  {/* Explicit Patient Selection Dropdown */}
                  <div className="w-full space-y-2 text-right border-t border-b border-slate-800/80 py-3 my-2">
                    <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-cyan-400" />
                        اختر المريض المطلوب مطابقة بصمته المخصصة:
                      </span>
                      <span className="text-[10px] text-cyan-400 font-normal">تم تمييز كل مريض ببصمته الفريدة</span>
                    </label>
                    <select
                      value={fingerprintToScan}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFingerprintToScan(val);
                        const list = isSandboxMode ? sandboxPatients : registeredPatientsList;
                        const selPat = list.find(p => p.biometricCode === val || p.fingerprintTemplate === val || p.id === val || String(p.biometricCode) === val);
                        if (selPat) {
                          setBioScannerLogs(prev => [...prev, `👉 تم تمييز واختيار المريض: [${selPat.fullName}] - كود البصمة المخصص: #${selPat.biometricCode || 'N/A'}`]);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-750 focus:border-cyan-500 rounded-xl text-white text-xs font-bold focus:outline-none shadow-inner"
                    >
                      <option value="">-- اختر مريضاً من القائمة أو امسح البصمة المخصصة --</option>
                      {(isSandboxMode ? sandboxPatients : registeredPatientsList).map((pat) => (
                        <option key={pat.id} value={pat.biometricCode || pat.fingerprintTemplate || pat.id}>
                          {pat.fullName} {pat.biometricCode ? `(رمز البصمة المخصص: #${pat.biometricCode})` : ''} {pat.roomNumber ? `- غرفة: ${pat.roomNumber}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quick Demo Selector for Registered Fingerprints to Simulate */}
                  <div className="w-full space-y-3.5 pt-1">
                    {connectedBioDevice ? (
                      <div className="p-4 rounded-xl bg-emerald-950/10 border border-emerald-500/30 text-center space-y-3">
                        <p className="text-xs font-black text-emerald-300">جهاز البصمة البيومتري [{connectedBioDevice.name}] جاهز للمطابقة</p>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleTriggerBiometricScan('verify', fingerprintToScan); }}
                          disabled={isScanningFingerprint}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/30"
                        >
                          <Fingerprint className="w-5 h-5 animate-pulse text-white" />
                          وضع إصبع المريض المختار على قارئ USB للمطابقة اللحظية 🩸
                        </button>
                        <p className="text-[10px] text-slate-400">سيقوم القارئ بسحب البصمة الحية ومطابقتها تلقائياً مع السجلات البيومترية للمريض المختار</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <label className="block text-slate-300 text-xs font-bold text-right flex items-center justify-between">
                          <span>أو أدخل كود البصمة أو الرقم المتسلسل المخصص للمريض:</span>
                          <span className="text-[10px] text-emerald-400 font-normal">💡 يدعم كتابة #1 أو #2 مباشرة</span>
                        </label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={fingerprintToScan}
                            onChange={(e) => setFingerprintToScan(e.target.value)}
                            placeholder="مثال: اكتب #1 أو #2 أو الصق كود البصمة"
                            className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-blue-500/50"
                          />
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleTriggerBiometricScan('verify', fingerprintToScan); }}
                            disabled={!fingerprintToScan || isScanningFingerprint}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50 cursor-pointer animate-pulse shrink-0"
                          >
                            {isScanningFingerprint ? 'جاري المسح...' : 'إجراء المسح والتحقق 🔍'}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowBioDeviceModal(true); }}
                          className="w-full py-2 bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/20 hover:border-indigo-500/45 text-indigo-300 text-xs rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          🔌 توصيل والبحث عن أجهزة البصمة الموصولة بالحاسبة
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : verifyMethod === 'wristband' ? (
                <>
                  <div className="p-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-1">
                    <QrCode className="w-10 h-10 animate-pulse text-emerald-400" />
                  </div>
                  <h3 className="text-base font-black text-white">التحقق السريع عبر ملصق السوار</h3>
                  <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
                    امسح الرمز المطبوع على سوار معصم المريض (QR Code أو Barcode) لتأكيد الهوية البيومترية ومطابقة البيانات بشكل فوري وتجنب الأخطاء الطبية.
                  </p>

                  <div className="w-full space-y-4 pt-2">
                    <div className="space-y-2.5">
                      <label className="block text-slate-300 text-xs font-bold text-right">
                        امسح الكود أو الصق رابط السوار المطبوع:
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                            <QrCode className="w-4 h-4 text-emerald-500" />
                          </span>
                          <input 
                            type="text" 
                            value={wristbandScanInput}
                            onChange={(e) => setWristbandScanInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && wristbandScanInput.trim()) {
                                handleVerifyWristband(wristbandScanInput);
                              }
                            }}
                            placeholder="ضع المؤشر هنا ثم امسح بالقارئ اليدوي..."
                            className="w-full pr-10 pl-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-emerald-500/50 text-right"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleVerifyWristband(wristbandScanInput)}
                          disabled={!wristbandScanInput.trim() || isCapturing !== null}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50 cursor-pointer shrink-0"
                        >
                          {isCapturing === 'verifying' ? 'جاري التحقق...' : 'التحقق والمطابقة 🔍'}
                        </button>
                      </div>
                    </div>

                    {/* Suggested demo wristband barcodes of registered patients */}
                    <div className="border-t border-slate-800/80 pt-3 text-right w-full">
                      <p className="text-[10px] text-slate-500 font-bold mb-2">💡 محاكاة مسح ملصق سوار مريض مسجل:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {sandboxPatients.slice(0, 4).map((p) => {
                          const displayCode = p.biometricCode || '041852FC';
                          const displayUrl = `${window.location.origin}/?verify-patient=${displayCode}`;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setWristbandScanInput(displayUrl);
                                handleVerifyWristband(displayUrl);
                              }}
                              className="p-2 bg-slate-900/40 hover:bg-slate-800/40 border border-slate-800 hover:border-slate-700 rounded-lg text-right text-[10px] text-slate-300 transition-all flex flex-col gap-0.5"
                            >
                              <span className="font-bold text-slate-200">{p.fullName}</span>
                              <span className="font-mono text-emerald-500 text-[9px]">الرمز: #{displayCode}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-1">
                    <Search className="w-10 h-10 animate-pulse text-indigo-400" />
                  </div>
                  <h3 className="text-base font-black text-white">التحقق المباشر بالاسم</h3>
                  <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
                    ابحث عن المريض من خلال كتابة الاسم (أو جزء منه) لعرض السجلات المسجلة، ثم اضغط على "مطابقة واختيار" لجلب البيانات وطباعة الملصقات التعريفية.
                  </p>
                  
                  <div className="w-full space-y-4 pt-2">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={verifyNameQuery}
                        onChange={(e) => handleVerifySearchByName(e.target.value)}
                        placeholder="اكتب الاسم الكامل أو جزء منه للبحث..."
                        className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-indigo-500/50 text-right"
                      />
                      <button
                        type="button"
                        onClick={() => handleVerifySearchByName(verifyNameQuery)}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Search className="w-4 h-4" />
                        <span>بحث</span>
                      </button>
                    </div>

                    {/* Improved real-time visual lookup results */}
                    <div className="w-full space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {isSearchingByName ? (
                        <div className="py-4 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
                          <span>جاري جلب ومطابقة الأسماء...</span>
                        </div>
                      ) : verifyNameResults.length > 0 ? (
                        verifyNameResults.map((p) => {
                          const photo = p.patientPhotoBase64 || p.photoBase64 || (p.gender === 'female' ? MOCK_PHOTOS.female_face : MOCK_PHOTOS.male_face);
                          return (
                            <div 
                              key={p.id}
                              className="p-3 bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 rounded-xl flex items-center justify-between gap-3 text-right transition-all"
                              style={{ direction: 'rtl' }}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {photo ? (
                                  <img 
                                    src={photo} 
                                    alt={p.fullName} 
                                    className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                                    <User className="w-5 h-5 text-slate-400" />
                                  </div>
                                )}
                                <div className="text-right min-w-0">
                                  <p className="text-xs font-bold text-white truncate">{p.fullName}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                    كود: #{p.biometricCode} | غرفة: {p.roomNumber || 'غير محدد'} | {p.age || 'غير محدد'} سنة
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setVerificationResult(p);
                                  setSelectedPatientForSample(p);
                                  setVerificationError(null);
                                }}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] rounded-lg transition-all shrink-0 cursor-pointer shadow-md"
                              >
                                مطابقة واختيار
                              </button>
                            </div>
                          );
                        })
                      ) : verifyNameQuery.trim() ? (
                        <div className="py-4 text-center text-slate-500 text-xs">
                          لم يتم العثور على مريض بهذا الاسم. يرجى التحقق من الاسم المدخل.
                        </div>
                      ) : (
                        <div className="py-4 text-center text-slate-500 text-[11px] border border-dashed border-slate-800/80 rounded-xl bg-slate-900/20">
                          اكتب الاسم في مربع البحث أعلاه لعرض ومطابقة المرضى تلقائياً
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Results Column */}
            <div className="p-6 rounded-2xl bg-slate-950/30 border border-slate-800 space-y-5 flex flex-col justify-start">
              <h3 className="text-base font-black text-white text-right border-b border-slate-800 pb-2 flex items-center justify-between gap-2">
                {verificationResult && (
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationResult(null);
                      setVerificationError(null);
                      setFingerprintToScan('');
                      setWristbandScanInput('');
                    }}
                    className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 font-bold text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>إلغاء تحديد المريض</span>
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <span>نتيجة مطابقة البصمة والتحقق من الهوية</span>
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
              </h3>

              {verificationResult ? (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row gap-4 text-right justify-start relative overflow-hidden" style={{ direction: 'rtl' }}>
                    <div className="space-y-1 text-right flex-1">
                      <h4 className="text-sm font-black text-white">{verificationResult.fullName}</h4>
                      <p className="text-slate-400 text-xs">الرمز الحيوي المتسلسل: <span className="font-mono text-emerald-400 font-bold">#{verificationResult.biometricCode}</span></p>
                      <p className="text-slate-400 text-xs">العمر والجنس: <span className="font-bold text-slate-200">{verificationResult.age || 'غير محدد'} سنة ({verificationResult.gender === 'male' ? 'ذكر' : 'أنثى'})</span></p>
                      <p className="text-[#06b6d4] text-xs font-bold">رقم غرفة المريض: <span className="font-mono">{verificationResult.roomNumber || 'غير محدد'}</span></p>
                      <p className="text-amber-400 text-xs font-bold">نوع التحليل المعتمد: <span className="text-slate-100">{verificationResult.analysisType || 'Cross match (مطابقة متقاطعة)'}</span></p>
                      {verificationResult.doctorName && (
                        <p className="text-indigo-400 text-xs font-black">👨‍⚕️ الطبيب المعالج: <span className="text-white font-black">{verificationResult.doctorName}</span></p>
                      )}
                      {verificationResult.operationType && (
                        <p className="text-teal-400 text-xs font-black">🩺 نوع العملية الجراحية: <span className="text-white font-black">{verificationResult.operationType}</span></p>
                      )}
                      
                      {verificationResult.allResultsFileBase64 ? (
                        <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/15 rounded-xl flex items-center justify-between gap-3 text-right" style={{ direction: 'rtl' }}>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">📄</span>
                            <div className="text-right">
                              <p className="text-xs font-black text-rose-400">ملف PDF مرفق مع العينة</p>
                              <p className="text-[10px] text-slate-400 truncate max-w-[200px]" title={verificationResult.allResultsFileName}>{verificationResult.allResultsFileName || 'report.pdf'}</p>
                            </div>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setPdfToView({ base64: verificationResult.allResultsFileBase64, name: verificationResult.allResultsFileName || 'report.pdf' })}
                              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow"
                            >
                              عرض الملف 👁️
                            </button>
                            <a
                              href={verificationResult.allResultsFileBase64}
                              download={verificationResult.allResultsFileName || 'report.pdf'}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[10px] font-bold transition-all text-center flex items-center"
                            >
                              تنزيل 📥
                            </a>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-500 font-bold mt-2.5 flex items-center gap-1 bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                          <span>ℹ️ لم يتم إرفاق ملف PDF للتحاليل الشاملة مع عينة هذا المريض بعد.</span>
                        </p>
                      )}
                    </div>
                    {((verificationResult.photoBase64 || verificationResult.patientPhotoBase64 || (verificationResult.gender === 'female' ? MOCK_PHOTOS.female_face : MOCK_PHOTOS.male_face))) ? (
                      <div className="w-full md:w-52 h-44 sm:h-48 shrink-0 self-center">
                        <img 
                          src={verificationResult.photoBase64 || verificationResult.patientPhotoBase64 || (verificationResult.gender === 'female' ? MOCK_PHOTOS.female_face : MOCK_PHOTOS.male_face)} 
                          alt="Patient Face" 
                          className="w-full h-full rounded-2xl object-cover border-2 border-emerald-500 shadow-lg" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>
                    ) : (
                      <div className="w-full md:w-52 h-44 sm:h-48 rounded-2xl bg-slate-800 border-2 border-slate-700 flex flex-col items-center justify-center shrink-0 self-center gap-2">
                        <User className="w-12 h-12 text-slate-400" />
                        <span className="text-[10px] text-slate-400 font-bold">لا توجد صورة شخصية</span>
                      </div>
                    )}
                  </div>

                  {/* QR Code Panel */}
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 mt-2 text-right shadow-sm">
                    <div className="flex items-center gap-1.5 justify-end">
                      <p className="text-xs text-slate-800 font-black">ملصق انبوب التحليل {`{QR code}`}</p>
                      <QrCode className="w-4 h-4 text-cyan-600" />
                    </div>

                    {/* 3-Column Physical QR Label Preview with solid black text matching uploaded image (100% English) */}
                    <div 
                      className="p-2.5 rounded-xl border-2 border-black flex flex-row justify-between items-center text-left text-black w-full max-w-[400px] h-[105px] font-sans mx-auto shadow-lg relative select-all label-paper-white" 
                      style={{ direction: 'ltr', filter: 'none', backgroundColor: '#ffffff', color: '#000000', borderColor: '#000000' }}
                    >
                      {/* Left Section (65% width) */}
                      <div className="w-[65%] flex flex-col justify-between h-full py-0.5 text-left pr-2">
                        <div className="flex justify-between items-center text-[8px] font-extrabold text-black uppercase leading-none border-b border-black pb-0.5">
                          <span>AL-FARAH HOSPITAL</span>
                          <span className="border border-black px-1 rounded text-[8px] font-black text-rose-600">{formatBloodTypeEnglish((verificationResult as any).bloodType)}</span>
                        </div>
                        <div className="text-[9.5px] font-black text-black leading-tight truncate">
                          <span className="text-[8.5px] font-bold text-black">Name: </span>
                          <span>{verificationResult.fullName}</span>
                        </div>
                        
                        <div className="text-[8.5px] font-black text-black leading-tight truncate">
                          <span className="text-[8px] font-bold text-black">Analysis: </span>
                          <span>{cleanAnalysisType(verificationResult.analysisType || 'Cross-match').toUpperCase()}</span>
                        </div>

                        <div className="flex flex-row justify-between items-center w-full text-[8px] font-bold text-black leading-none pt-0.5">
                          <span>Age: {verificationResult.age || '0'}</span>
                          <span>{formatGenderEnglish(verificationResult.gender)}</span>
                          <span>Room: {verificationResult.roomNumber || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Right Section (35% width) - Vertical layout */}
                      <div className="w-[35%] flex flex-col justify-center items-center text-center h-full py-0.5 border-l border-dashed border-black pl-2 gap-1" style={{ direction: 'ltr' }}>
                        {verificationResultQRUrl ? (
                          <img 
                            src={verificationResultQRUrl} 
                            alt="QR Code" 
                            className="w-12 h-12 object-contain block my-0.5"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-slate-100 flex items-center justify-center text-[8px] text-slate-400">Loading...</div>
                        )}
                        <span className="text-[7.5px] font-mono font-black text-black leading-none truncate w-full text-center">QR-LAB-{verificationResult.biometricCode}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handlePrintVerifiedPatientQR}
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-rose-950/20"
                    >
                      <Printer className="w-4 h-4" />
                      طباعة ملصق انبوب التحليل (QR) 🖨️
                    </button>
                  </div>

                  {verificationResult.nationalIdPhotoBase64 && (
                    <div className="pt-2 text-right">
                      <p className="text-slate-400 text-[11px] mb-1.5 font-bold">نسخة الهوية الوطنية المؤرشفة:</p>
                      <img src={verificationResult.nationalIdPhotoBase64} alt="ID card archive" className="w-full h-32 rounded-lg object-contain bg-slate-950 border border-slate-800" referrerPolicy="no-referrer" />
                    </div>
                  )}

                  {/* Transition/Session Persistence Button to Blood Sampling */}
                  <div className="pt-3 border-t border-dashed border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatientForSample(verificationResult);
                        setActiveTab('samples');
                      }}
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/30"
                    >
                      <Droplet className="w-4 h-4 animate-pulse text-white" />
                      الانتقال لسحب عينات المريض وتحضير الملصق (🩸)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center h-full min-h-[300px]">
                  <Fingerprint className="w-12 h-12 text-slate-600 animate-pulse mb-3" />
                  <p className="text-sm font-black text-slate-400">في انتظار مطابقة هوية المريض...</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">يرجى إجراء المسح الحيوي للبصمة أو إدخال رقم الغرفة في اللوحة الجانبية للتحقق</p>
                </div>
              )}
            </div>
          </div>
        {/* Quick-reference Patient Fingerprint Codes Ledger */}
        <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-center flex-wrap gap-2 text-right" dir="rtl">
            <div className="space-y-1">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-indigo-400" />
                قائمة المرجع السريع لأكواد بصمات المرضى المسجلين بالمنظومة (للمحاكاة السريعة)
              </h4>
              <p className="text-[10px] text-slate-400">
                تُعرض هنا قائمة بالمرضى الذين تم أرشفة بصماتهم حيوياً. يمكنك نسخ كود البصمة أو النقر على "تعبئة وفحص تلقائي" لتجربة ومحاكاة عملية المطابقة فوراً دون كتابة يدوية.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchRecentPatients}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-850 hover:border-slate-800 text-slate-300 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 text-slate-400" />
              تحديث قائمة المرضى
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1 scrollbar-thin" dir="rtl">
            {registeredPatientsList.length > 0 ? (
              registeredPatientsList.map((p) => (
                <div 
                  key={p.id}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-900 text-right flex flex-col justify-between gap-4 hover:border-slate-800 hover:bg-slate-950 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs px-2.5 py-1 rounded bg-blue-500/15 text-blue-400 font-mono font-black">
                        رمز: #{p.biometricCode || 'N/A'}
                      </span>
                      <h5 className="text-sm sm:text-base font-black text-white">{p.fullName}</h5>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-400">
                      رقم غرفة المريض: <span className="text-slate-300 font-mono font-bold text-sm">{p.roomNumber || 'غير محدد'}</span>
                    </p>
                    <div className="pt-2 space-y-1.5">
                      <p className="text-xs text-slate-400 font-bold">كود البصمة البيومترية الخاص بالمريض:</p>
                      <div className="px-3 py-2 bg-slate-900/90 border border-slate-850 rounded-lg font-mono text-xs text-emerald-400 flex justify-between items-center gap-2 overflow-x-auto select-all">
                        <span className="truncate max-w-[150px] font-bold" title={p.fingerprintTemplate}>{p.fingerprintTemplate || 'لا يوجد بصمة مسجلة'}</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (p.fingerprintTemplate) {
                              navigator.clipboard.writeText(p.fingerprintTemplate);
                              alert('تم نسخ كود البصمة بنجاح! يمكنك الآن لصقه في مربع البحث.');
                            }
                          }}
                          className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded shrink-0 font-bold"
                        >
                          نسخ 📋
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!p.fingerprintTemplate}
                    onClick={() => {
                      if (p.fingerprintTemplate) {
                        setFingerprintToScan(p.fingerprintTemplate);
                        handleVerifyFingerprint(p.fingerprintTemplate);
                      }
                    }}
                    className="w-full py-2.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs sm:text-sm font-black rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Fingerprint className="w-4 h-4" />
                    🎯 تعبئة وفحص تلقائي للبصمة
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-slate-500 text-xs">
                لا يوجد مرضى مسجلين حيوياً بالمنظومة حالياً. قم بتسجيل مريض جديد في لسان التبويب الأول لتظهر معلوماته هنا.
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* TAB 3: Sample Collection and Barcode Generation */}
      {activeTab === 'samples' && hasSamplesAccess && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Finder */}
          <div className="lg:col-span-1 p-6 rounded-2xl bg-slate-950/30 border border-slate-800 space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-400" />
              البحث عن المريض لسحب العينة
            </h3>

            <div className="space-y-3">
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم، الهوية، أو الغرفة..."
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500/50"
              />
              <button
                onClick={handleSearchPatient}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                بحث في سجلات المرضى
              </button>
            </div>

            {/* Results list */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {searchResults.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedPatientForSample(p);
                    setSampleResult(null);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer text-right ${
                    selectedPatientForSample?.id === p.id 
                      ? 'bg-blue-500/10 border-blue-500/40' 
                      : 'bg-slate-900/60 border-slate-850 hover:border-slate-800'
                  }`}
                >
                  <p className="text-xs font-black text-white">{p.fullName}</p>
                  <p className="text-slate-400 text-[10px] mt-1 font-mono">غرفة: {p.roomNumber || 'غير محدد'} | هوية: {p.nationalId}</p>
                </div>
              ))}
              {searchResults.length === 0 && searchQuery && (
                <p className="text-center text-slate-500 text-[10px] py-4">لم يتم العثور على نتائج للبحث الحالي.</p>
              )}
            </div>
          </div>

          {/* Blood Sample Registration Form */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-950/30 border border-slate-800 space-y-5">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Droplet className="w-5 h-5 text-rose-400" />
              تسجيل وتأكيد فصيلة دم المريض ورفع التحاليل
            </h3>

            {selectedPatientForSample ? (
              <div className="space-y-5">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-200">{selectedPatientForSample.fullName}</h4>
                    <p className="text-slate-400 text-[10px] mt-0.5 font-mono">رقم غرفة المريض: {selectedPatientForSample.roomNumber || 'غير محدد'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        setSelectedPatientForSample(null);
                        setVerificationResult(null);
                        try {
                          sessionStorage.removeItem('locked_lab_patient');
                          localStorage.removeItem('locked_lab_patient');
                        } catch (e) {}
                        try {
                          await fetch('/api/lab/patient/clear-active', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'x-user-role': currentUser?.role,
                              'x-user-name': currentUser.username
                            }
                          });
                        } catch (err) {
                          console.error('Failed to clear active patient on backend:', err);
                        }
                      }}
                      className="text-[10px] bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 px-2 py-1 rounded font-bold transition-all cursor-pointer"
                    >
                      إلغاء التحديد ✕
                    </button>
                    <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded font-bold">محدد لإصدار فصيلة</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1.5">نوع عينة التحليل</label>
                    <input 
                      type="text"
                      value={sampleType}
                      onChange={(e) => setSampleType(e.target.value)}
                      placeholder="Whole Blood / Plasma"
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1.5">الفصيلة المؤكدة مخبرياً (Blood Type) *</label>
                    <select
                      value={bloodType}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setBloodType('');
                        } else {
                          setPendingBloodType(val);
                          setShowBloodTypeConfirmModal(true);
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500/50 font-mono font-black text-rose-400"
                    >
                      <option value="">-- اختر فصيلة الدم (غير محدد) --</option>
                      <option value="A+">A+ (موجب A)</option>
                      <option value="A-">A- (سالب A)</option>
                      <option value="B+">B+ (موجب B)</option>
                      <option value="B-">B- (سالب B)</option>
                      <option value="AB+">AB+ (موجب AB)</option>
                      <option value="AB-">AB- (سالب AB)</option>
                      <option value="O+">O+ (موجب O)</option>
                      <option value="O-">O- (سالب O)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 text-xs font-semibold mb-1.5">نوع التحليل / الفحوصات المطلوبة في الأنابيب والسجل الطبي *</label>
                    <div className="relative">
                      {/* The Trigger button */}
                      <button
                        type="button"
                        onClick={() => setIsSampleDropdownOpen(!isSampleDropdownOpen)}
                        className="w-full min-h-[48px] px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm text-right focus:outline-none focus:border-indigo-500/50 flex flex-wrap items-center justify-between gap-1.5 cursor-pointer font-bold select-none"
                        style={{ direction: 'rtl' }}
                      >
                        <div className="flex flex-wrap gap-2 items-center justify-start max-w-[90%] text-right">
                          {sampleAnalysisType.split(',').map((s) => s.trim()).filter(Boolean).length > 0 ? (
                            sampleAnalysisType.split(',').map((s) => s.trim()).filter(Boolean).map((tag) => (
                              <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/25 text-indigo-100 rounded-lg text-xs font-bold border border-indigo-500/40 shadow-sm transition-all hover:bg-indigo-500/35">
                                {tag}
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const currentList = sampleAnalysisType.split(',').map((s) => s.trim()).filter(Boolean);
                                    const newList = currentList.filter(t => t !== tag);
                                    setSampleAnalysisType(newList.join(', '));
                                  }}
                                  className="text-rose-400 hover:text-rose-300 text-sm font-black cursor-pointer px-1 leading-none"
                                >
                                  ×
                                </span>
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-500 font-bold text-sm">اضغط لاختيار أو البحث عن التحاليل...</span>
                          )}
                        </div>
                        <span className="text-slate-400 text-xs shrink-0">▼</span>
                      </button>

                      {/* Dropdown Menu */}
                      {isSampleDropdownOpen && (
                        <>
                          {/* Click outside to close overlay */}
                          <div className="fixed inset-0 z-40" onClick={() => setIsSampleDropdownOpen(false)} />
                          
                          <div className="absolute right-0 top-full mt-2 w-full bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl z-50 p-4 space-y-3.5 max-h-[300px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 text-right" style={{ direction: 'rtl' }}>
                            {/* Search Input inside Dropdown */}
                            <div className="relative">
                              <input
                                type="text"
                                value={sampleDropdownSearchQuery}
                                onChange={(e) => setSampleDropdownSearchQuery(e.target.value)}
                                placeholder="ابحث في التحاليل المتاحة..."
                                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm text-right focus:outline-none focus:border-indigo-500/50 pr-8 font-bold"
                              />
                              <span className="absolute right-2.5 top-3 text-slate-500 text-sm">🔍</span>
                            </div>

                            {/* Options List */}
                            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                              {savedAnalysisTypes
                                .filter((type) => type.toLowerCase().includes(sampleDropdownSearchQuery.toLowerCase()))
                                .map((type) => {
                                  const currentList = sampleAnalysisType.split(',').map((s) => s.trim()).filter(Boolean);
                                  const isChecked = currentList.includes(type);
                                  return (
                                    <button
                                      type="button"
                                      key={type}
                                      onClick={() => {
                                        let newList;
                                        if (isChecked) {
                                          newList = currentList.filter(t => t !== type);
                                        } else {
                                          newList = [...currentList, type];
                                        }
                                        setSampleAnalysisType(newList.join(', '));
                                      }}
                                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm cursor-pointer select-none transition-all ${
                                        isChecked 
                                          ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200 font-extrabold shadow-sm' 
                                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => {}} // handled by button click
                                          className="w-4 h-4 accent-indigo-500 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                                        />
                                        <span className="font-bold text-sm text-right">{type}</span>
                                      </div>
                                      {isChecked && <span className="text-indigo-400 font-black text-xs bg-indigo-500/10 px-2 py-0.5 rounded-md">✓ محدد</span>}
                                    </button>
                                  );
                                })}
                              
                              {savedAnalysisTypes.filter((type) => type.toLowerCase().includes(sampleDropdownSearchQuery.toLowerCase())).length === 0 && (
                                <div className="text-center py-3 text-xs text-slate-500 italic">
                                  لا توجد فحوصات مطابقة للبحث.
                                </div>
                              )}
                            </div>

                            {/* Add New Option Inline inside Dropdown */}
                            <div className="border-t border-slate-800/60 pt-3 flex gap-2">
                              <input
                                type="text"
                                value={newSampleAnalysisTypeInput}
                                onChange={(e) => setNewSampleAnalysisTypeInput(e.target.value)}
                                placeholder="إضافة تحليل جديد وتحديده..."
                                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-sm text-right focus:outline-none focus:border-indigo-500/50 font-bold"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (newSampleAnalysisTypeInput.trim()) {
                                    const val = newSampleAnalysisTypeInput.trim();
                                    if (!savedAnalysisTypes.includes(val)) {
                                      const updated = [...savedAnalysisTypes, val];
                                      setSavedAnalysisTypes(updated);
                                      localStorage.setItem('saved_analysis_types', JSON.stringify(updated));
                                    }
                                    const currentList = sampleAnalysisType.split(',').map((s) => s.trim()).filter(Boolean);
                                    if (!currentList.includes(val)) {
                                      setSampleAnalysisType([...currentList, val].join(', '));
                                    }
                                    setNewSampleAnalysisTypeInput('');
                                  }
                                }}
                                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg font-black transition-colors cursor-pointer shrink-0"
                              >
                                + إضافة
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">يت ربط هذا النص مع ملصق معصم اليد للمريض (الباركود والـ QR) للتعريف بنوع الفحص المطلوب.</p>
                  </div>

                  {/* PDF report of all patient analysis */}
                  <div className="sm:col-span-2 p-4 bg-slate-900/60 border border-slate-850 rounded-2xl space-y-3 text-right" style={{ direction: 'rtl' }}>
                    <label className="block text-slate-200 text-xs font-black">إرفاق تقرير كافة التحاليل والنتائج السابقة للمريض (PDF) 📂</label>
                    
                    <div className="flex gap-3">
                      {allResultsFileBase64 ? (
                        <div className="flex-1 flex items-center justify-between bg-slate-950/40 px-4 py-2.5 rounded-xl border border-slate-800 text-xs text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setAllResultsFileBase64(null);
                              setAllResultsFileName(null);
                            }}
                            className="text-rose-500 hover:text-rose-400 font-extrabold text-xs cursor-pointer text-center"
                          >
                            حذف المستند المرفق ×
                          </button>
                          <span className="text-emerald-400 font-black truncate max-w-[280px] flex items-center gap-1">
                            📎 {allResultsFileName} (جاهز للرفع والأرشفة)
                          </span>
                        </div>
                      ) : (
                        <label className="flex-1 flex items-center justify-center bg-slate-950/40 hover:bg-slate-900 border border-dashed border-slate-700 hover:border-slate-600 rounded-xl py-3 px-4 cursor-pointer transition-colors text-xs text-slate-400 font-bold gap-2">
                          <span className="text-rose-400">📄</span>
                          <span>اختر ملف PDF لنتائج التحاليل الشاملة من الحاسوب...</span>
                          <input
                            type="file"
                            accept=".pdf,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  setAllResultsFileBase64(reader.result as string);
                                  setAllResultsFileName(file.name);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">يمكنك إرفاق ملف PDF واحد متكامل يضم كافة تحاليل المريض. سيتم أرشفته مع العينة وعرضه بجوار فصيلة الدم للرجوع إليه وتنزيله لاحقاً.</p>
                  </div>
                </div>

                {sampleCollectionError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-bold text-center" style={{ direction: 'rtl' }}>
                    ⚠️ {sampleCollectionError}
                  </div>
                )}

                {getLabPermission('sample_collection') === 'read' && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl text-xs font-bold text-center mb-2" style={{ direction: 'rtl' }}>
                    ⚠️ وضع القراءة فقط: لا تملك صلاحية تسجيل أو سحب عينات جديدة.
                  </div>
                )}

                <button
                  type="button"
                  disabled={getLabPermission('sample_collection') === 'read'}
                  onClick={handleCollectSample}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Droplet className="w-4 h-4" />
                  تأكيد فصيلة الدم وحفظ تقارير التحاليل
                </button>

                {/* Sample details confirmation without label prints */}
                {sampleResult && (
                  <div className="p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/40 space-y-4 shadow-xl text-right animate-in fade-in" style={{ direction: 'rtl' }}>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">✓</span>
                        <div>
                          <p className="text-sm text-emerald-400 font-black">تم تأكيد فصيلة الدم وحفظ التحاليل بنجاح</p>
                          <p className="text-[11px] text-slate-400 font-medium">تم توثيق البيانات وربطها بالسجل الطبي للمريض</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2.5 py-1 rounded-lg font-mono font-bold">
                        {new Date().toLocaleTimeString('ar-IQ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      {/* Blood Group */}
                      <div className="p-3.5 bg-slate-950/60 border border-rose-500/30 rounded-xl flex flex-col items-center justify-center text-center">
                        <span className="text-[11px] text-slate-400 font-bold mb-1">الفصيلة المؤكدة</span>
                        <span className="text-2xl font-black text-rose-400 font-sans tracking-wider">
                          {sampleResult.bloodType || bloodType}
                        </span>
                      </div>

                      {/* Sample Type */}
                      <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col items-center justify-center text-center">
                        <span className="text-[11px] text-slate-400 font-bold mb-1">نوع العينة</span>
                        <span className="text-sm font-black text-cyan-300">
                          {sampleResult.sampleType || sampleType || 'Whole Blood (دم كامل)'}
                        </span>
                      </div>

                      {/* Attached Document */}
                      <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col items-center justify-center text-center">
                        <span className="text-[11px] text-slate-400 font-bold mb-1">تقرير التحاليل المرفق</span>
                        <span className="text-xs font-black text-emerald-400 truncate max-w-full">
                          {sampleResult.allResultsFileName ? `📎 ${sampleResult.allResultsFileName}` : 'لا يوجد ملف مرفق'}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-850 text-xs text-slate-300 flex items-center justify-between">
                      <span className="font-bold">الفحوصات المطلوبة:</span>
                      <span className="font-mono text-indigo-300 font-bold">{sampleResult.analysisType || sampleAnalysisType || 'Cross-match'}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs">
                يرجى البحث واختيار مريض من اللوحة الجانبية أولاً لبدء تسجيل عينات مصرف الدم.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Sample Logs and Analysis Results with Attachments */}
      {activeTab === 'sample_logs' && hasLogsAccess && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div className="text-right w-full sm:w-auto">
              <h3 className="text-base font-black text-white">سجل عينات الفحص والتحاليل المخبرية</h3>
              <p className="text-xs text-slate-400">مراقبة العينات المسحوبة، إدخال النتائج المخبرية لكل تحليل، وإرفاق أوراق التحليل من الحاسبة.</p>
            </div>
            <button
              onClick={fetchSamples}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0 self-start sm:self-auto"
            >
              🔄 تحديث السجل
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              value={samplesSearchQuery}
              onChange={(e) => setSamplesSearchQuery(e.target.value)}
              placeholder="البحث في سجل العينات باستخدام اسم المريض، الباركود (BAR-)، أو رمز الاستجابة السريعة (QR)..."
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-white text-xs text-right focus:outline-none focus:border-indigo-500/50 pr-10 font-bold"
            />
            <div className="absolute right-3 top-3.5 text-slate-500">🔍</div>
          </div>

          {isLoadingSamples ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <span className="inline-block animate-spin mr-2">⏳</span> جاري تحميل سجل العينات من الخادم والمزامنة...
            </div>
          ) : (
            <div className="space-y-4">
              {samplesList
                .filter(sample => {
                  const q = samplesSearchQuery.toLowerCase().trim();
                  if (!q) return true;
                  return (
                    (sample.fullName || '').toLowerCase().includes(q) ||
                    (sample.barcode || '').toLowerCase().includes(q) ||
                    (sample.qrCode || '').toLowerCase().includes(q) ||
                    (sample.id || '').toLowerCase().includes(q)
                  );
                })
                .map(sample => {
                  const isEditing = editingSampleId === sample.id;
                  const analyses = (sample.analysisType || 'Cross-match').split(',').map((s: string) => s.trim()).filter(Boolean);
                  
                  return (
                    <div key={sample.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 hover:border-slate-700/80 transition-all space-y-4 shadow-sm relative overflow-hidden text-right">
                      {/* Top Details bar */}
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/60 pb-3" style={{ direction: 'rtl' }}>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-lg font-bold text-indigo-400 shrink-0">
                            🧪
                          </div>
                          <div className="space-y-0.5 text-right">
                            <h4 className="text-sm font-black text-white">{sample.fullName}</h4>
                            <div className="flex flex-wrap items-center justify-start gap-x-3 gap-y-1 text-[11px] text-slate-400">
                              <span>العمر: <span className="text-slate-200 font-bold">{sample.age || 'غير محدد'}</span></span>
                              <span>الجنس: <span className="text-slate-200 font-bold">{sample.gender === 'female' ? 'أنثى' : 'ذكر'}</span></span>
                              <span>رقم الغرفة: <span className="text-slate-200 font-mono font-bold">{sample.roomNumber || 'غير محدد'}</span></span>
                            </div>
                          </div>
                        </div>

                        {/* Middle: Tube Codes & Blood Type */}
                        <div className="flex flex-wrap items-center gap-2 justify-start md:justify-center">
                          <span className="px-2.5 py-1 bg-rose-600/15 border border-rose-500/30 rounded-lg text-rose-400 text-xs font-black">
                            {sample.bloodType || 'غير محدد'} 🩸
                          </span>
                          {(sample.allResultsFileBase64 || sample.allResultsFileName) && (
                            <a
                              href={`/api/lab/public/samples/pdf?sampleId=${encodeURIComponent(sample.id || sample.qrCode || sample.barcode || '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/20 hover:border-indigo-500/40 rounded-lg text-indigo-300 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                              title="عرض كافة التحاليل المرفقة"
                            >
                              📁 النتائج الشاملة (PDF)
                            </a>
                          )}
                          <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 font-mono text-[10px] font-bold">
                            TUBE: {sample.barcode}
                          </span>
                          <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 font-mono text-[10px] font-bold">
                            QR: {sample.qrCode}
                          </span>
                        </div>

                        {/* Right: Status and Edit button */}
                        <div className="flex items-center gap-2 justify-end self-end md:self-auto">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                            sample.status === 'Verified' || sample.status === 'Verified (مكتمل ومؤكد)'
                              ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400'
                              : sample.status === 'Processing' || sample.status === 'Processing (تحت التحليل)'
                              ? 'bg-amber-600/10 border-amber-500/30 text-amber-400'
                              : 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400'
                          }`}>
                            {sample.status === 'Verified' ? '✓ مكتمل ومؤكد' : sample.status === 'Processing' ? '⏳ تحت التحليل' : '📦 تم سحب العينة'}
                          </span>
                          
                          {!isEditing ? (
                            <button
                              onClick={() => {
                                setEditingSampleId(sample.id);
                                setEditingBloodType(sample.bloodType || '');
                                setEditingAllResultsFileBase64(sample.allResultsFileBase64 || null);
                                setEditingAllResultsFileName(sample.allResultsFileName || null);
                                setEditingSampleStatus(sample.status || 'Verified');
                                // Pre-populate editing results list
                                const initialResults = analyses.map((name: string) => {
                                  const existingResult = (sample.results || []).find((r: any) => r.analysisName === name);
                                  const effectiveBlood = sample.bloodType ? `فصيلة الدم المؤكدة: ${sample.bloodType}` : '';
                                  return {
                                    analysisName: name,
                                    value: existingResult?.value || effectiveBlood,
                                    attachmentBase64: existingResult?.attachmentBase64 || sample.allResultsFileBase64 || null,
                                    attachmentName: existingResult?.attachmentName || sample.allResultsFileName || null,
                                    updatedAt: existingResult?.updatedAt || (sample.bloodType ? new Date().toISOString() : null)
                                  };
                                });
                                setEditingResults(initialResults);
                              }}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              ⚙️ إدخال / تعديل النتائج والفصيلة
                            </button>
                          ) : (
                            <button
                              onClick={() => setEditingSampleId(null)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium rounded-lg transition-colors cursor-pointer"
                            >
                              إلغاء
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Display of results or Edit interface */}
                      {!isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3" style={{ direction: 'rtl' }}>
                          {analyses.map((name: string) => {
                            const resultObj = (sample.results || []).find((r: any) => r.analysisName === name);
                            const effectiveValue = resultObj?.value || (sample.bloodType ? `فصيلة الدم المؤكدة: ${sample.bloodType}` : null);
                            const effectiveAttachmentBase64 = resultObj?.attachmentBase64 || sample.allResultsFileBase64;
                            const effectiveAttachmentName = resultObj?.attachmentName || sample.allResultsFileName || 'تقرير التحاليل الشاملة.pdf';

                            return (
                              <div key={name} className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2.5 text-right shadow-sm">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-black text-indigo-300 flex items-center gap-1.5">
                                    <span>🔬</span>
                                    <span>{name}</span>
                                  </span>
                                  {(resultObj?.updatedAt || sample.collectedAt) && (
                                    <span className="text-[9px] text-slate-500">تم التوثيق: {new Date(resultObj?.updatedAt || sample.collectedAt).toLocaleDateString('ar-IQ')}</span>
                                  )}
                                </div>

                                <div className="space-y-2 text-right">
                                  <div className="text-xs">
                                    <span className="text-slate-400 font-bold block mb-1">النتيجة المخبرية المعتمدة:</span>
                                    {effectiveValue ? (
                                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-cyan-300 font-bold text-xs font-sans">
                                        {effectiveValue}
                                      </span>
                                    ) : (
                                      <span className="font-bold text-slate-600 italic">
                                        لم تسجل نتيجة بعد
                                      </span>
                                    )}
                                  </div>

                                  <div className="text-xs">
                                    <span className="text-slate-400 font-bold block mb-1">المستند وتقرير التحليل المرفق:</span>
                                    {effectiveAttachmentBase64 ? (
                                      <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800 gap-2">
                                        <div className="flex items-center gap-2 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => setPdfToView({ base64: effectiveAttachmentBase64, name: effectiveAttachmentName })}
                                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-bold transition-all cursor-pointer shadow"
                                          >
                                            عرض 👁️
                                          </button>
                                          <a
                                            href={effectiveAttachmentBase64}
                                            download={effectiveAttachmentName}
                                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-[11px] font-bold transition-all flex items-center gap-1"
                                          >
                                            تنزيل 📥
                                          </a>
                                        </div>
                                        <span className="text-emerald-400 font-bold truncate text-[11px] pr-1 max-w-[180px]" title={effectiveAttachmentName}>
                                          📎 {effectiveAttachmentName}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-slate-600 italic text-[11px]">لا توجد ورقة تحليل مرفقة من الحاسبة</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* Editing Interface */
                        <div className="bg-slate-900/80 border border-indigo-500/20 rounded-2xl p-4 space-y-4 animate-in slide-in-from-top-2 duration-300" style={{ direction: 'rtl' }}>
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <h5 className="text-xs font-black text-indigo-400">تعديل نتائج التحاليل وتأكيد الفصيلة لهذه الحالة (دون إنشاء حالة جديدة)</h5>
                            <span className="text-[10px] text-emerald-400 font-bold">🔒 السجل المعتمد للعينة</span>
                          </div>

                          {/* Blood Group and Comprehensive PDF document row */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                            <div>
                              <label className="block text-[11px] text-slate-300 font-bold mb-1.5">الفصيلة المؤكدة للحالة (Blood Type)</label>
                              <select
                                value={editingBloodType}
                                onChange={(e) => setEditingBloodType(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-rose-400 text-xs font-mono font-black focus:outline-none focus:border-rose-500/50"
                              >
                                <option value="">-- غير محدد --</option>
                                <option value="A+">A+ (موجب A)</option>
                                <option value="A-">A- (سالب A)</option>
                                <option value="B+">B+ (موجب B)</option>
                                <option value="B-">B- (سالب B)</option>
                                <option value="AB+">AB+ (موجب AB)</option>
                                <option value="AB-">AB- (سالب AB)</option>
                                <option value="O+">O+ (موجب O)</option>
                                <option value="O-">O- (سالب O)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] text-slate-300 font-bold mb-1.5">تقرير التحاليل الشاملة المرفق (PDF)</label>
                              {editingAllResultsFileBase64 ? (
                                <div className="flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-[10px]">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingAllResultsFileBase64(null);
                                      setEditingAllResultsFileName(null);
                                    }}
                                    className="text-rose-500 hover:text-rose-400 font-bold"
                                  >
                                    حذف ×
                                  </button>
                                  <span className="text-emerald-400 font-bold truncate max-w-[180px]">
                                    📎 {editingAllResultsFileName || 'تقرير التحاليل الشاملة.pdf'}
                                  </span>
                                </div>
                              ) : (
                                <label className="flex items-center justify-center bg-slate-900 hover:bg-slate-800 border border-dashed border-slate-700 rounded-lg py-1.5 px-3 cursor-pointer text-[11px] text-slate-300 font-semibold">
                                  <span>📁 إرفاق أو استبدال ملف PDF...</span>
                                  <input
                                    type="file"
                                    accept=".pdf,application/pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = () => {
                                          setEditingAllResultsFileBase64(reader.result as string);
                                          setEditingAllResultsFileName(file.name);
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            {editingResults.map((resItem, idx) => (
                              <div key={resItem.analysisName} className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3">
                                <div className="text-xs font-bold text-white flex items-center gap-1 justify-start">
                                  <span>🔬</span>
                                  <span className="text-indigo-300">{resItem.analysisName}</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-right">
                                  {/* Result value input */}
                                  <div>
                                    <label className="block text-[11px] text-slate-400 mb-1">النتيجة المخبرية / التقرير النصي</label>
                                    <input
                                      type="text"
                                      value={resItem.value}
                                      onChange={(e) => {
                                        const updated = [...editingResults];
                                        updated[idx].value = e.target.value;
                                        setEditingResults(updated);
                                      }}
                                      placeholder="مثال: Normal, Hb 13.4, Positive..."
                                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500/50 text-right font-bold"
                                    />
                                  </div>

                                  {/* Attachment upload */}
                                  <div>
                                    <label className="block text-[11px] text-slate-400 mb-1">إرفاق ورقة التحليل الخاصة بهذا الفحص</label>
                                    <div className="flex gap-2">
                                      {resItem.attachmentBase64 ? (
                                        <div className="flex-1 flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-[10px]">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updated = [...editingResults];
                                              updated[idx].attachmentBase64 = null;
                                              updated[idx].attachmentName = null;
                                              setEditingResults(updated);
                                            }}
                                            className="text-rose-500 hover:text-rose-400 font-bold"
                                          >
                                            حذف
                                          </button>
                                          <span className="text-emerald-400 font-bold truncate max-w-[120px]">
                                            📎 {resItem.attachmentName}
                                          </span>
                                        </div>
                                      ) : (
                                        <label className="flex-1 flex items-center justify-center bg-slate-900 hover:bg-slate-800 border border-dashed border-slate-700 hover:border-slate-600 rounded-lg py-1.5 px-3 cursor-pointer transition-colors text-[11px] text-slate-300 font-semibold">
                                          <span>📁 اختر ملف من الحاسوب...</span>
                                          <input
                                            type="file"
                                            className="hidden"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                const reader = new FileReader();
                                                reader.onload = () => {
                                                  const updated = [...editingResults];
                                                  updated[idx].attachmentBase64 = reader.result as string;
                                                  updated[idx].attachmentName = file.name;
                                                  setEditingResults(updated);
                                                };
                                                reader.readAsDataURL(file);
                                              }
                                            }}
                                          />
                                        </label>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Status and Action bar */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-800 pt-3">
                            {/* Status Selector */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400">حالة العينة:</span>
                              <select
                                value={editingSampleStatus}
                                onChange={(e) => setEditingSampleStatus(e.target.value)}
                                className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
                              >
                                <option value="Collected">📦 تم سحب العينة (Collected)</option>
                                <option value="Processing">⏳ تحت التحليل (Processing)</option>
                                <option value="Verified">✓ مكتمل ومؤكد (Verified)</option>
                              </select>
                            </div>

                            {/* Save/Cancel actions */}
                            <div className="flex gap-2 justify-end">
                              <button
                                type="button"
                                onClick={async () => {
                                  const savedResults = editingResults.map(item => ({
                                    ...item,
                                    updatedAt: new Date().toISOString()
                                  }));

                                  if (isSandboxMode) {
                                    const updatedList = sandboxSamples.map(s => {
                                      if (s.id === sample.id) {
                                        return { 
                                          ...s, 
                                          results: savedResults, 
                                          status: editingSampleStatus,
                                          bloodType: editingBloodType || s.bloodType,
                                          allResultsFileBase64: editingAllResultsFileBase64 || s.allResultsFileBase64,
                                          allResultsFileName: editingAllResultsFileName || s.allResultsFileName
                                        };
                                      }
                                      return s;
                                    });
                                    setSandboxSamples(updatedList);
                                    
                                    // Also sync sandbox patient
                                    if (editingBloodType) {
                                      setSandboxPatients(sandboxPatients.map(p => p.id === sample.patientId ? { ...p, bloodType: editingBloodType } : p));
                                    }

                                    setEditingSampleId(null);
                                    fetchSamples();
                                    return;
                                  }

                                  try {
                                    const res = await fetch(`/api/lab/samples/${sample.id}/results`, {
                                      method: 'PUT',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        'x-user-role': currentUser?.role,
                                        'x-user-name': currentUser.username
                                      },
                                      body: JSON.stringify({ 
                                        results: savedResults, 
                                        status: editingSampleStatus,
                                        bloodType: editingBloodType || undefined,
                                        allResultsFileBase64: editingAllResultsFileBase64 || undefined,
                                        allResultsFileName: editingAllResultsFileName || undefined
                                      })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      setEditingSampleId(null);
                                      fetchSamples();
                                      fetchRecentPatients();
                                      handleLoadRegistryPatients();
                                    } else {
                                      alert('حدث خطأ أثناء حفظ النتائج.');
                                    }
                                  } catch (err) {
                                    console.error('Failed to save sample results:', err);
                                    alert('فشل الاتصال بالخادم لحفظ نتائج التحليل.');
                                  }
                                }}
                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow"
                              >
                                ✓ حفظ التعديلات على نفس الحالة
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingSampleId(null)}
                                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-lg transition-colors cursor-pointer"
                              >
                                إلغاء
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

              {samplesList.filter(sample => {
                const q = samplesSearchQuery.toLowerCase().trim();
                if (!q) return true;
                return (
                  (sample.fullName || '').toLowerCase().includes(q) ||
                  (sample.barcode || '').toLowerCase().includes(q) ||
                  (sample.qrCode || '').toLowerCase().includes(q) ||
                  (sample.id || '').toLowerCase().includes(q)
                );
              }).length === 0 && (
                <div className="py-12 text-center text-slate-500 text-xs bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
                  لا توجد عينات مطابقة لبحثك الحالي في السجل.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Laboratory Materials & Document Archiving */}
      {activeTab === 'materials' && hasMaterialsAccess && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* RIGHT COLUMN: Material Book Registration & PDF Archiving Form (5 cols) */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-950/40 border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-cyan-400" />
                  أرشفة كتاب ومواد المختبر (PDF)
                </h3>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                  توليد باركود + QR فوري
                </span>
              </div>

              {materialError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{materialError}</span>
                </div>
              )}

              {materialSuccessMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{materialSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleArchiveMaterial} className="space-y-4 text-right">
                {/* 1. Company / Supplier Name */}
                <div>
                  <label className="block text-slate-300 text-xs font-bold mb-1.5">
                    اسم الشركة المجهزة <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newMatSupplier}
                    onChange={(e) => setNewMatSupplier(e.target.value)}
                    placeholder="مثال: شركة الأفق للمستلزمات الطبية والتقنيات المخبرية"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60 transition-colors"
                  />
                </div>

                {/* 2 & 3. Book Number & Book Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 text-xs font-bold mb-1.5">
                      رقم الكتاب <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newMatBookNumber}
                      onChange={(e) => setNewMatBookNumber(e.target.value)}
                      placeholder="مثال: 1422 / ش.م / 2026"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60 transition-colors font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 text-xs font-bold mb-1.5">
                      تاريخ الكتاب <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={newMatBookDate}
                      onChange={(e) => setNewMatBookDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500/60 transition-colors"
                    />
                  </div>
                </div>

                {/* 4. PDF File Upload Section */}
                <div className="pt-1">
                  <label className="block text-slate-300 text-xs font-bold mb-1.5 flex items-center justify-between">
                    <span>إرفاق ملف الكتاب (PDF)</span>
                    <span className="text-[10px] text-slate-400 font-normal">سيتم فتحه عند قراءة رمز الـ QR</span>
                  </label>

                  {!newMatPdfBase64 ? (
                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-750 hover:border-cyan-500/60 bg-slate-900/50 hover:bg-slate-900 rounded-2xl cursor-pointer transition-all group">
                      <FileText className="w-8 h-8 text-slate-500 group-hover:text-cyan-400 transition-colors mb-2" />
                      <p className="text-xs font-bold text-slate-300 group-hover:text-cyan-300">
                        اضغط هنا لرفع ملف الـ PDF الخاص بالكتاب أو اسحبه هنا
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">الملف بصيغة PDF سيتم ربطه بالكيو ار كود لفتحه مباشرة عند المسح</p>
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
                              alert('يرجى اختيار ملف بصيغة PDF فقط.');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setNewMatPdfBase64(event.target?.result as string);
                              setNewMatPdfFileName(file.name);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  ) : (
                    <div className="p-3.5 bg-cyan-950/20 border border-cyan-500/30 rounded-2xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-white truncate">{newMatPdfFileName}</p>
                          <p className="text-[10px] text-cyan-400 font-bold">ملف PDF مرفق ومؤرشف بنجاح</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPdfToView({ base64: newMatPdfBase64, name: newMatPdfFileName || 'وثيقة الكتاب' })}
                          className="px-2.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          معاينة
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewMatPdfBase64(null);
                            setNewMatPdfFileName(null);
                          }}
                          className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-[11px] font-bold rounded-lg transition-colors"
                          title="حذف الملف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingMaterial}
                    className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs rounded-xl shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingMaterial ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-cyan-200" />
                    )}
                    <span>✨ أرشفة الكتاب وتوليد ملصق الكيو ار كود والباركود</span>
                  </button>
                </div>
              </form>
            </div>

            {/* LEFT COLUMN: Archived Documents List & QR Search (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Search & Scanner Input Bar */}
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 shadow-xl space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 pointer-events-none">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={materialsSearchQuery}
                      onChange={(e) => setMaterialsSearchQuery(e.target.value)}
                      placeholder="ابحث باسم الشركة المجهزة، رقم الكتاب، أو تاريخ الكتاب..."
                      className="w-full pl-4 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60 transition-colors"
                    />
                    {materialsSearchQuery && (
                      <button
                        onClick={() => setMaterialsSearchQuery('')}
                        className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="relative sm:w-64">
                    <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-cyan-400 pointer-events-none">
                      <Barcode className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={materialsBarcodeScan}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMaterialsBarcodeScan(val);
                        if (val.trim()) {
                          // Auto match material
                          const cleanVal = val.trim().toLowerCase();
                          const found = materialsList.find(m => 
                            (m.qrCode || '').toLowerCase().includes(cleanVal) ||
                            (m.barcode || '').toLowerCase().includes(cleanVal) ||
                            (m.id || '').toLowerCase().includes(cleanVal) ||
                            (m.bookNumber || '').toLowerCase().includes(cleanVal)
                          );
                          if (found) {
                            playSuccessBeep();
                            setSelectedMaterialForQR(found);
                          }
                        }
                      }}
                      placeholder="امسح الباركود أو الـ QR Code..."
                      className="w-full pl-4 pr-10 py-2.5 bg-slate-900 border border-cyan-500/30 rounded-xl text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>

                  <button
                    onClick={fetchMaterials}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-colors shrink-0 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                    title="تحديث القائمة"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMaterials ? 'animate-spin' : ''}`} />
                    <span>تحديث</span>
                  </button>
                </div>
              </div>

              {/* Materials Documents Cards List */}
              <div className="space-y-3">
                {isLoadingMaterials && materialsList.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 text-xs bg-slate-950/30 rounded-2xl border border-slate-800">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
                    جاري تحميل سجل الكتب والمواد المؤرشفة...
                  </div>
                ) : materialsList.filter(m => {
                  const q = materialsSearchQuery.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    (m.supplier || '').toLowerCase().includes(q) ||
                    (m.bookName || '').toLowerCase().includes(q) ||
                    (m.bookNumber || '').toLowerCase().includes(q) ||
                    (m.bookDate || '').toLowerCase().includes(q) ||
                    (m.qrCode || '').toLowerCase().includes(q) ||
                    (m.barcode || '').toLowerCase().includes(q)
                  );
                }).length === 0 ? (
                  <div className="py-16 text-center text-slate-500 text-xs bg-slate-950/30 rounded-2xl border border-dashed border-slate-800 p-6 space-y-2">
                    <Package className="w-10 h-10 text-slate-600 mx-auto" />
                    <p className="font-bold text-slate-400">لا توجد كتب أو مواد مؤرشفة تطابق معايير البحث.</p>
                    <p className="text-[11px] text-slate-500">قم برفع كتاب جديد من النموذج الجانبي لتوليد ملصق الباركود والكيو ار كود.</p>
                  </div>
                ) : (
                  materialsList.filter(m => {
                    const q = materialsSearchQuery.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      (m.supplier || '').toLowerCase().includes(q) ||
                      (m.bookName || '').toLowerCase().includes(q) ||
                      (m.bookNumber || '').toLowerCase().includes(q) ||
                      (m.bookDate || '').toLowerCase().includes(q) ||
                      (m.qrCode || '').toLowerCase().includes(q) ||
                      (m.barcode || '').toLowerCase().includes(q)
                    );
                  }).map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/90 hover:border-cyan-500/40 transition-all shadow-md space-y-3 group"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-white group-hover:text-cyan-300 transition-colors">
                              {item.supplier || item.bookName}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                              <span className="font-mono text-cyan-400 font-bold">كتاب رقم: #{item.bookNumber}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                {item.bookDate}
                              </span>
                              <span>•</span>
                              <span className="font-mono text-slate-500">
                                {item.qrCode}
                              </span>
                            </div>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-900 border border-slate-800 text-cyan-300 shrink-0">
                          مؤرشف ✅
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-850 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          {(item.pdfBase64 || item.pdfPath || item.pdfFileName) ? (
                            <button
                              type="button"
                              onClick={() => setPdfToView({ base64: item.pdfBase64 || `/api/lab/public/materials/${item.id}/pdf`, name: item.supplier || item.bookName || 'كتاب مؤرشف' })}
                              className="px-3 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              عرض ملف الـ PDF 📄
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-bold">لا يوجد ملف PDF مرفق</span>
                          )}

                          {(item.pdfBase64 || item.pdfPath || item.pdfFileName) && (
                            <a
                              href={item.pdfBase64 || `/api/lab/public/materials/${item.id}/pdf`}
                              download={`${item.supplier || item.bookName || 'كتاب-مختبر'}.pdf`}
                              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-slate-400" />
                              تنزيل PDF
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedMaterialForQR(item)}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
                          >
                            <QrCode className="w-3.5 h-3.5 text-blue-200" />
                            ملصق الدواء (QR)
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStartEditMaterial(item)}
                            className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-400 rounded-xl transition-colors cursor-pointer"
                            title="تعديل بيانات الكتاب والشركة والملف المرفق"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {(isSysAdmin || userRole === 'Lab_Manager' || userRole === 'SuperAdmin') && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMaterial(item.id)}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-xl transition-colors"
                              title="حذف الكتاب المؤرشف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Edit Laboratory Material & Book Modal */}
      {editingMaterial && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" 
            onClick={() => {
              if (!isUpdatingMaterial) setEditingMaterial(null);
            }} 
          />
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl relative z-10 text-right animate-in fade-in zoom-in-95 duration-200 space-y-4 max-h-[90vh] overflow-y-auto" style={{ direction: 'rtl' }}>
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">تعديل بيانات الكتاب والمادة المخبرية</h3>
                  <p className="text-[11px] text-slate-400">تعديل اسم الشركة، رقم الكتاب، تاريخه، أو استبدال ملف الـ PDF</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingMaterial(null)}
                disabled={isUpdatingMaterial}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editMatError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-400 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{editMatError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateMaterial} className="space-y-3.5">
              {/* Code Info Badge */}
              <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold">كود المادة الثابت:</span>
                <span className="font-mono text-cyan-400 font-black">{editingMaterial.qrCode || editingMaterial.barcode}</span>
              </div>

              {/* 1. Company / Supplier Name */}
              <div>
                <label className="block text-slate-300 text-xs font-bold mb-1">
                  اسم الشركة المجهزة / الجهة <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 pointer-events-none">
                    <Building2 className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={editMatSupplier}
                    onChange={(e) => setEditMatSupplier(e.target.value)}
                    placeholder="مثال: شركة المشرق للأدوية والمستلزمات الطبية..."
                    className="w-full pl-3 pr-9 py-2.5 bg-slate-950/60 border border-slate-750 focus:border-amber-500 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* 2. Book Number & Book Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 text-xs font-bold mb-1">
                    رقم الكتاب <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 pointer-events-none">
                      <Tag className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={editMatBookNumber}
                      onChange={(e) => setEditMatBookNumber(e.target.value)}
                      placeholder="مثال: 1111 أو م/452"
                      className="w-full pl-3 pr-9 py-2.5 bg-slate-950/60 border border-slate-750 focus:border-amber-500 rounded-xl text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-bold mb-1">
                    تاريخ الكتاب <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 pointer-events-none">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <input
                      type="date"
                      required
                      value={editMatBookDate}
                      onChange={(e) => setEditMatBookDate(e.target.value)}
                      className="w-full pl-3 pr-9 py-2.5 bg-slate-950/60 border border-slate-750 focus:border-amber-500 rounded-xl text-white text-xs focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* PDF File Management / Replacement */}
              <div className="pt-2">
                <label className="block text-slate-300 text-xs font-bold mb-1.5 flex items-center justify-between">
                  <span>الملف المرفق (PDF)</span>
                  <span className="text-[10px] text-slate-400 font-normal">يمكنك استبدال الملف أو إبقاؤه كما هو</span>
                </label>

                {editMatPdfBase64 || editMatPdfFileName ? (
                  <div className="p-3 bg-cyan-950/25 border border-cyan-500/30 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-white truncate">{editMatPdfFileName || 'ملف الكتاب المؤرشف.pdf'}</p>
                        <p className="text-[10px] text-cyan-400 font-bold">ملف الـ PDF المرفق حالياً</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPdfToView({ 
                          base64: editMatPdfBase64 || `/api/lab/public/materials/${editingMaterial.id}/pdf`, 
                          name: editMatPdfFileName || editMatSupplier || 'وثيقة الكتاب' 
                        })}
                        className="px-2.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        معاينة
                      </button>
                      <label className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        استبدال
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
                                alert('يرجى اختيار ملف بصيغة PDF فقط.');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setEditMatPdfBase64(event.target?.result as string);
                                setEditMatPdfFileName(file.name);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setEditMatPdfBase64(null);
                          setEditMatPdfFileName(null);
                        }}
                        className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                        title="إلغاء الملف المرفق"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-750 hover:border-amber-500/60 bg-slate-950/40 hover:bg-slate-950 rounded-2xl cursor-pointer transition-all group">
                    <FileText className="w-7 h-7 text-slate-500 group-hover:text-amber-400 transition-colors mb-1.5" />
                    <p className="text-xs font-bold text-slate-300 group-hover:text-amber-300">
                      اضغط هنا لرفع ملف PDF جديد للكتاب
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">سيتم ربط الملف الجديد بالكود ليفتح تلقائياً عند مسح الـ QR</p>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
                            alert('يرجى اختيار ملف بصيغة PDF فقط.');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setEditMatPdfBase64(event.target?.result as string);
                            setEditMatPdfFileName(file.name);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingMaterial(null)}
                  disabled={isUpdatingMaterial}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingMaterial}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-600/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isUpdatingMaterial ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري حفظ التعديلات...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>حفظ وتحديث البيانات</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Physical Medicine / Laboratory Material QR Code Sticker Modal */}
      {selectedMaterialForQR && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" 
            onClick={() => setSelectedMaterialForQR(null)} 
          />
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative z-10 text-right animate-in fade-in zoom-in-95 duration-200 space-y-5" style={{ direction: 'rtl' }}>
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">ملصق الدواء والكيو ار كود للمادة</h3>
                  <p className="text-[11px] text-slate-400">للصق المباشر على علب الأدوية والكواشف المخبرية</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMaterialForQR(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Physical Thermal Label Preview (5cm x 3cm Landscape, Pure White, No Shadow) */}
            <div 
              className="w-full max-w-[420px] mx-auto rounded-lg border-2 border-black p-3 flex flex-row items-stretch justify-between text-right font-sans aspect-[5/3] overflow-hidden select-none label-paper-white shadow-xl"
              style={{ backgroundColor: '#ffffff', color: '#000000', borderColor: '#000000', direction: 'rtl' }}
            >
              
              {/* Right Side: Material & Hospital Info (RTL) */}
              <div className="flex-1 flex flex-col justify-between pl-3 text-right" style={{ color: '#000000' }}>
                {/* Header */}
                <div className="border-b-2 border-black pb-1 mb-1" style={{ borderColor: '#000000' }}>
                  <h2 className="text-sm font-black leading-tight" style={{ color: '#000000' }}>مستشفى الفرح الاهلي</h2>
                  <p className="text-[10px] font-black leading-tight" style={{ color: '#000000' }}>معتمدة ومسجلة لدى وزارة الصحة</p>
                </div>

                {/* Details */}
                <div className="space-y-1 my-auto" style={{ color: '#000000' }}>
                  <div className="text-[11px] font-black leading-snug flex items-baseline gap-1" style={{ color: '#000000' }}>
                    <span className="font-black whitespace-nowrap" style={{ color: '#000000' }}>الشركة:</span>
                    <span className="font-black truncate" style={{ color: '#000000' }}>{selectedMaterialForQR.supplier || selectedMaterialForQR.bookName}</span>
                  </div>
                  <div className="text-[11px] font-black leading-snug flex items-baseline gap-1" style={{ color: '#000000' }}>
                    <span className="font-black whitespace-nowrap" style={{ color: '#000000' }}>رقم الكتاب:</span>
                    <span className="font-mono font-black" style={{ color: '#000000' }}>{selectedMaterialForQR.bookNumber}</span>
                  </div>
                  <div className="text-[11px] font-black leading-snug flex items-baseline gap-1" style={{ color: '#000000' }}>
                    <span className="font-black whitespace-nowrap" style={{ color: '#000000' }}>التاريخ:</span>
                    <span className="font-black" style={{ color: '#000000' }}>{selectedMaterialForQR.bookDate}</span>
                  </div>
                </div>

                {/* Dimensions indicator */}
                <div className="text-[9px] font-black pt-0.5" style={{ color: '#334155' }}>
                  مقاس الملصق: 50mm × 30mm (عرضي)
                </div>
              </div>

              {/* Left Side: Crisp QR Code & ID */}
              <div className="w-28 max-w-28 flex flex-col items-center justify-center border-r-2 border-dashed border-black pr-2 shrink-0" style={{ borderColor: '#000000', direction: 'ltr' }}>
                <div className="p-0.5 rounded" style={{ backgroundColor: '#ffffff' }}>
                  {materialStickerQRUrl ? (
                    <img 
                      src={materialStickerQRUrl} 
                      alt="Material QR Code" 
                      className="w-24 h-24 object-contain block"
                    />
                  ) : (
                    <div className="w-24 h-24 flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: '#f1f5f9', color: '#000000' }}>
                      جاري التوليد...
                    </div>
                  )}
                </div>
                <div className="font-mono text-[9.5px] font-black text-center truncate w-full mt-0.5" style={{ color: '#000000' }}>
                  {selectedMaterialForQR.qrCode}
                </div>
              </div>

            </div>

            {/* Modal action buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handlePrintMaterialSticker(selectedMaterialForQR, materialStickerQRUrl, materialStickerBarcodeUrl)}
                className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs rounded-xl shadow-lg shadow-cyan-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة ملصق الدواء والمادة فوراً (Thermal Printer)</span>
              </button>

              {(selectedMaterialForQR.pdfBase64 || selectedMaterialForQR.pdfPath || selectedMaterialForQR.pdfFileName) && (
                <button
                  type="button"
                  onClick={() => {
                    setPdfToView({ 
                      base64: selectedMaterialForQR.pdfBase64 || `/api/lab/public/materials/${selectedMaterialForQR.id}/pdf`, 
                      name: selectedMaterialForQR.supplier || selectedMaterialForQR.bookName || 'وثيقة الكتاب' 
                    });
                  }}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>فتح PDF</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Blood Type Confirmation Dialog */}
      {showBloodTypeConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay background with blur */}
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => {
            setShowBloodTypeConfirmModal(false);
            setPendingBloodType(null);
          }} />
          
          {/* Modal content */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative z-10 text-right animate-in fade-in zoom-in-95 duration-200 space-y-4" style={{ direction: 'rtl' }}>
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-2xl mx-auto mb-2 animate-bounce">
              ⚠️
            </div>
            
            <h3 className="text-base font-black text-white text-center">تأكيد فصيلة الدم المخبرية</h3>
            
            <p className="text-slate-300 text-xs text-center leading-relaxed font-semibold">
              هل أنت متأكد تماماً من أن فصيلة دم هذا الشخص هي 
              <span className="text-rose-400 font-extrabold text-sm mx-1.5 px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded font-mono">
                {pendingBloodType === 'A+' ? 'A+ (موجب A)' :
                 pendingBloodType === 'A-' ? 'A- (سالب A)' :
                 pendingBloodType === 'B+' ? 'B+ (موجب B)' :
                 pendingBloodType === 'B-' ? 'B- (سالب B)' :
                 pendingBloodType === 'AB+' ? 'AB+ (موجب AB)' :
                 pendingBloodType === 'AB-' ? 'AB- (سالب AB)' :
                 pendingBloodType === 'O+' ? 'O+ (موجب O)' :
                 pendingBloodType === 'O-' ? 'O- (سالب O)' : pendingBloodType}
              </span>؟
            </p>
            
            <p className="text-[10px] text-slate-500 text-center leading-relaxed">
              يرجى التحقق المزدوج والتأكد التام لمنع أي أخطاء طبية حرجة أثناء عمليات المطابقة وصرف الدم اللاحقة.
            </p>
            
            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => {
                  if (pendingBloodType) {
                    setBloodType(pendingBloodType);
                  }
                  setShowBloodTypeConfirmModal(false);
                  setPendingBloodType(null);
                }}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all shadow-md shadow-emerald-900/20 cursor-pointer text-center"
              >
                نعم، متأكد وأؤكد الفصيلة
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowBloodTypeConfirmModal(false);
                  setPendingBloodType(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
              >
                تراجع وإلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real Computer Webcam Capture Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-xs font-black text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#06b6d4] animate-pulse" />
                كاميرا المريض المباشرة (التقاط حقيقي)
              </h3>
              <button 
                type="button"
                onClick={closeCamera} 
                className="text-slate-400 hover:text-white transition-colors text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-800"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              {cameraError ? (
                <div className="p-4 bg-rose-950/40 border border-rose-500/20 rounded-xl text-rose-200 text-xs text-center space-y-3">
                  <p className="leading-relaxed">{cameraError}</p>
                  <button
                    type="button"
                    onClick={handleCaptureFaceFallback}
                    className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                  >
                    استخدام صورة النظام الافتراضية البديلة
                  </button>
                </div>
              ) : (
                <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                  <video 
                    id="webcam-video" 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover scale-x-[-1]" 
                  />
                  <div className="absolute inset-0 border border-cyan-500/20 rounded-xl pointer-events-none flex items-center justify-center">
                    <div className="w-36 h-36 rounded-full border-2 border-dashed border-cyan-400/40 animate-spin-slow" />
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={closeCamera}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                {!cameraError && (
                  <button
                    type="button"
                    onClick={takeSnapshot}
                    className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    التقاط صورة الآن
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Physical USB ID Scanner Connection & Simulation Modal */}
      {showScannerModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 shrink-0">
              <h3 className="text-xs font-black text-white flex items-center gap-2">
                <Usb className="w-4 h-4 text-amber-400 animate-pulse" />
                ربط ومعايرة الماسح الضوئي للبطاقة الوطنية الموحدة
              </h3>
              <button 
                type="button"
                onClick={() => setShowScannerModal(false)} 
                className="text-slate-400 hover:text-white transition-colors text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5 flex-1 overflow-y-auto">
              {/* Direct Scanner Status & Trigger */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Usb className="w-4 h-4 text-cyan-400" />
                    <div>
                      <p className="text-xs font-black text-white">الماسح الضوئي الموصول بالحاسبة (USB Scanner)</p>
                      <p className="text-[10px] text-slate-400">سحب فوري ومباشر لوجه وضهر البطاقة الوطنية</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    جاهز للسحب
                  </span>
                </div>

                {/* Progress Stepper for Scans */}
                {scannerProgressStep > 0 && scannerProgressStep < 4 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[10px] text-amber-400 font-bold">
                      <span>جاري سحب البطاقة من السكنر الموصول...</span>
                      <span>{Math.round((scannerProgressStep / 3) * 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300" 
                        style={{ width: `${(scannerProgressStep / 3) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Action button to scan from USB Scanner */}
                <button
                  type="button"
                  onClick={handleScanFromPhysicalDevice}
                  disabled={scannerProgressStep > 0 && scannerProgressStep < 4}
                  className="w-full px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-white text-xs font-black rounded-xl shadow-lg shadow-cyan-900/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Usb className="w-4 h-4" />
                  بدء سحب الصورة من السكنر الموصول بالحاسبة
                </button>
              </div>

              {/* Result Preview */}
              {nationalIdPhoto && (
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={nationalIdPhoto} 
                      alt="Scanned National ID" 
                      className="w-20 h-12 object-contain bg-slate-950 rounded-lg border border-slate-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-black text-white">البطاقة الوطنية المسحوبة بنجاح 📄</p>
                      <p className="text-[9px] text-slate-500">الأبعاد والخصائص متوافقة مع متطلبات الأرشفة البيومترية</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNationalIdPhoto(null);
                      setScannerProgressStep(0);
                    }}
                    className="p-1.5 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-900/40 rounded-lg text-[10px] transition-all cursor-pointer"
                  >
                    إعادة سحب
                  </button>
                </div>
              )}

              {/* Manual File Selection - رفع البطاقة الموحدة (وجه وضهر) */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                <p className="text-xs font-black text-slate-200 flex items-center gap-1.5 justify-start">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>رفع البطاقة الموحدة</span>
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  {/* Front Side Card Field */}
                  <div className="flex flex-col items-center justify-center border border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/40 rounded-xl p-3 transition-all min-h-[130px] relative text-center">
                    {nationalIdFrontPhoto ? (
                      <div className="relative w-full h-full flex flex-col items-center justify-between gap-1.5">
                        <img 
                          src={nationalIdFrontPhoto} 
                          alt="Front of ID" 
                          className="h-20 w-full object-contain bg-slate-950 rounded-lg border border-slate-800" 
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[9px] font-bold text-emerald-400">✔️ وجه البطاقة</span>
                        <button
                          type="button"
                          onClick={() => {
                            setNationalIdFrontPhoto(null);
                            updateMergedIdPhoto(null, nationalIdBackPhoto);
                          }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-full flex items-center justify-center text-[10px] transition-colors cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center gap-1.5 py-2">
                        <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-slate-400">
                          <Upload className="w-3.5 h-3.5 text-cyan-400" />
                        </div>
                        <span className="text-[10px] font-black text-slate-300">وجه البطاقة</span>
                        <span className="text-[8px] text-slate-500">اضغط للاستيراد</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSideUpload(e, 'front')}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Back Side Card Field */}
                  <div className="flex flex-col items-center justify-center border border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/40 rounded-xl p-3 transition-all min-h-[130px] relative text-center">
                    {nationalIdBackPhoto ? (
                      <div className="relative w-full h-full flex flex-col items-center justify-between gap-1.5">
                        <img 
                          src={nationalIdBackPhoto} 
                          alt="Back of ID" 
                          className="h-20 w-full object-contain bg-slate-950 rounded-lg border border-slate-800" 
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[9px] font-bold text-emerald-400">✔️ ضهر البطاقة</span>
                        <button
                          type="button"
                          onClick={() => {
                            setNationalIdBackPhoto(null);
                            updateMergedIdPhoto(nationalIdFrontPhoto, null);
                          }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-full flex items-center justify-center text-[10px] transition-colors cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center gap-1.5 py-2">
                        <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-slate-400">
                          <Upload className="w-3.5 h-3.5 text-cyan-400" />
                        </div>
                        <span className="text-[10px] font-black text-slate-300">ضهر البطاقة</span>
                        <span className="text-[8px] text-slate-500">اضغط للاستيراد</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSideUpload(e, 'back')}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer status text */}
              <div className="text-[10px] text-slate-500 text-center pt-1 border-t border-slate-900 flex justify-between">
                <span>بروتوكول الأمان: SHA-256 Biometric Matcher</span>
                <span>Al-Farrah Labs Hub © 2026</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Biometric Fingerprint USB Scanner Connection Modal */}
      {showBioDeviceModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 shrink-0">
              <h3 className="text-xs font-black text-white flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-emerald-400 animate-pulse" />
                الاتصال والتحقق من جهاز البصمة البيومتري الموصول بالحاسوب
              </h3>
              <button 
                type="button"
                onClick={() => setShowBioDeviceModal(false)} 
                className="text-slate-400 hover:text-white transition-colors text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 flex-1 overflow-y-auto">
              {/* Active Connection Info */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-black text-slate-200">الماسح البيومتري المباشر (Biometric USB Reader)</p>
                  <p className="text-[10px] text-slate-400">بروتوكول الأمان العالي: WebUSB API / Local Host Agent 20111</p>
                </div>
                <div>
                  {bioDeviceStatus === 'searching' ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      جاري تهيئة الاتصال...
                    </span>
                  ) : connectedBioDevice ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      🟢 متصل وجاهز لالتقاط البصمات
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      🔴 غير متصل - يرجى البحث عن جهاز
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleRequestWebUsbDevice}
                  className="px-3 py-2 bg-gradient-to-r from-emerald-600/20 to-emerald-700/20 hover:from-emerald-600/30 hover:to-emerald-700/30 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Usb className="w-4 h-4 text-emerald-400" />
                  الاتصال بجهاز USB حقيقي (WebUSB) 🔌
                </button>
                <button
                  type="button"
                  onClick={handleConnectLocalAgent}
                  className="px-3 py-2 bg-gradient-to-r from-indigo-600/20 to-indigo-700/20 hover:from-indigo-600/30 hover:to-indigo-700/30 border border-indigo-500/30 hover:border-indigo-500/50 text-indigo-300 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-indigo-400" />
                  الاتصال بخدمة البصمة المحلية (Port 22001 / 20111)
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowZkSdkDownload(true)}
                className="w-full px-3 py-2.5 bg-gradient-to-r from-rose-600/20 via-orange-600/15 to-amber-600/20 hover:from-rose-600/30 hover:via-orange-600/25 hover:to-amber-600/30 border border-rose-500/30 hover:border-rose-500/60 text-rose-300 hover:text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4 text-rose-400 animate-bounce" />
                تحميل وتفعيل تعريفات جهاز البصمة ZKTech USB SDK 📥
              </button>

              {/* Simulated/Catalog List */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-black text-slate-200">قائمة الأجهزة المتوافقة مع المنظومة وسائق الربط الافتراضي:</p>
                  <button
                    type="button"
                    onClick={handleSearchBioDevices}
                    disabled={isSearchingBioDevice}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 text-[9px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSearchingBioDevice ? 'animate-spin' : ''}`} />
                    البحث التلقائي عن أجهزة البصمة البيومترية 🔍
                  </button>
                </div>

                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {BIOMETRIC_USB_DEVICES.map((device) => {
                    const isSelected = connectedBioDevice?.id === device.id;
                    return (
                      <div 
                        key={device.id} 
                        className={`p-2.5 rounded-xl border text-right transition-all flex justify-between items-center gap-4 ${
                          isSelected 
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-white shadow-lg shadow-emerald-500/5' 
                            : 'bg-slate-950 border-slate-900 text-slate-300 hover:border-slate-850 hover:bg-slate-900/30'
                        }`}
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-black flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                            {device.name}
                          </p>
                          <p className="text-[9px] text-slate-400">
                            الشركة المصنعة: <span className="text-slate-300 font-bold">{device.manufacturer}</span> | منفذ الاتصال: <span className="text-slate-300 font-bold">USB Driver v4.1</span>
                          </p>
                          <p className="text-[9px] text-slate-500">
                            معرف الأمان: <span className="font-mono text-emerald-400/80">VID_{device.vid} / PID_{device.pid}</span> • {device.description}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleConnectBioDevice(device)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all shrink-0 cursor-pointer ${
                            isSelected 
                              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center gap-1' 
                              : 'bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200'
                          }`}
                        >
                          {isSelected ? 'توصيل ناجح ✅' : 'ربط وتفعيل 🔌'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Device logs console */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400">سجل عمليات جهاز البصمة البيومتري (Biometric Log Stream):</p>
                <div className="h-28 bg-slate-950 border border-slate-900 rounded-xl p-3 font-mono text-[9px] text-emerald-300 overflow-y-auto space-y-1 shadow-inner select-none">
                  {bioScannerLogs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed whitespace-pre-wrap">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-900/40 border-t border-slate-800 flex justify-between items-center">
              {connectedBioDevice && (
                <button
                  type="button"
                  onClick={handleDisconnectBioDevice}
                  className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  قطع الاتصال بالجهاز الحالي 🔌
                </button>
              )}
              <div className="flex-1 text-left">
                <button
                  type="button"
                  onClick={() => setShowBioDeviceModal(false)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  إغلاق النافذة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10 Fingerprints Capture & Selection Modal */}
      {showHandFingerprintModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[95vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-850 flex justify-between items-center bg-slate-900/40 shrink-0">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-emerald-400 animate-pulse" />
                <h3 className="text-sm font-black text-white">
                  منصة التقاط البصمات العشرية البيومترية للمريض
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => {
                  if (isScanningFinger) return;
                  setShowHandFingerprintModal(false);
                }} 
                className="text-slate-400 hover:text-white transition-colors text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-800 disabled:opacity-50 animate-pulse"
                disabled={isScanningFinger !== null}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {/* Top Banner / Device Status */}
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="text-right space-y-1">
                  <p className="text-xs font-black text-slate-200">الربط التلقائي بأجهزة المستشفى الموصولة</p>
                  <p className="text-[10px] text-slate-400">
                    نوع قارئ البصمة النشط: <span className="text-indigo-400 font-bold">{connectedBioDevice ? connectedBioDevice.name : "محاكي الأجهزة عالي الدقة (Virtual Hub)"}</span>
                  </p>
                  <p className="text-[10px] text-emerald-400 font-bold mt-1">
                    💡 انقر مباشرةً على أي من أصابع اليد العشرة لبدء قراءة ومسح البصمة تلقائياً وفوراً دون الحاجة لأي نقرات إضافية!
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowHandFingerprintModal(false);
                      setShowBioDeviceModal(true);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-[10px] font-bold rounded-xl border border-slate-700 transition-all cursor-pointer"
                  >
                    🔌 إعدادات وتوصيل الماسح الحقيقي
                  </button>
                  {connectedBioDevice ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      الماسح جاهز
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      الوضع الافتراضي نشط
                    </span>
                  )}
                </div>
              </div>

              {/* Interactive Hands Schema */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-2xl bg-slate-900/20 border border-slate-900">
                
                {/* Left Hand Card (اليد اليسرى) */}
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 flex flex-col items-center">
                  <h4 className="text-xs font-black text-slate-300 mb-6 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    اليد اليسرى (Left Hand)
                  </h4>
                  
                  {/* Fingers ordered: Pinky(L5), Ring(L4), Middle(L3), Index(L2), Thumb(L1) */}
                  <div className="flex justify-center items-end gap-3.5 h-48 w-full max-w-sm px-4">
                    {FINGER_KEYS.filter(f => f.hand === 'left').map((finger, idx) => {
                      const isSelected = selectedFingerId === finger.id;
                      const isScanned = !!capturedFingers[finger.id];
                      const isScanning = isScanningFinger === finger.id;
                      
                      // Derive heights representing anatomical finger lengths
                      let heightClass = "h-36"; // Middle
                      if (finger.type === 'pinky') heightClass = "h-24";
                      if (finger.type === 'ring') heightClass = "h-32";
                      if (finger.type === 'index') heightClass = "h-30";
                      if (finger.type === 'thumb') heightClass = "h-20 translate-y-3 self-end";

                      return (
                        <button
                          key={finger.id}
                          type="button"
                          onClick={() => {
                            if (isScanningFinger) return;
                            setSelectedFingerId(finger.id);
                            handleScanSpecificFinger(finger.id);
                          }}
                          disabled={isScanningFinger !== null}
                          className={`w-12 ${heightClass} rounded-t-3xl border transition-all flex flex-col justify-between items-center p-1.5 relative group cursor-pointer ${
                            isSelected
                              ? 'border-cyan-500 bg-cyan-950/25 text-cyan-200 shadow-lg shadow-cyan-500/10'
                              : isScanned
                              ? 'border-emerald-500/40 bg-emerald-950/10 text-emerald-300'
                              : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-750 hover:bg-slate-900/80'
                          }`}
                        >
                          {/* Selected / Scan status top glow */}
                          <div className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full filter blur-sm transition-all ${
                            isScanning
                              ? 'bg-amber-400 animate-ping'
                              : isSelected
                              ? 'bg-cyan-400'
                              : isScanned
                              ? 'bg-emerald-400'
                              : 'bg-transparent'
                          }`} />

                          {/* Fingerprint Glyph Area */}
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-950/80 border border-slate-800">
                            {isScanning ? (
                              <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                            ) : isScanned ? (
                              <Fingerprint className="w-5 h-5 text-emerald-400 animate-pulse" />
                            ) : (
                              <Fingerprint className={`w-4 h-4 transition-colors ${isSelected ? 'text-cyan-300' : 'text-slate-600 group-hover:text-slate-400'}`} />
                            )}
                          </div>

                          {/* Label info */}
                          <div className="text-center space-y-0.5 mt-2">
                            <span className="block text-[10px] font-black leading-none">{finger.label}</span>
                            <span className="block text-[8px] font-mono text-slate-500 leading-none">{finger.id}</span>
                            {isScanned && (
                              <span className="block text-[7px] text-emerald-400 font-bold bg-emerald-500/10 px-1 py-0.5 rounded-md mt-0.5 scale-90 whitespace-nowrap">ممسوح ✅</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right Hand Card (اليد اليمنى) */}
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 flex flex-col items-center">
                  <h4 className="text-xs font-black text-slate-300 mb-6 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    اليد اليمنى (Right Hand)
                  </h4>
                  
                  {/* Fingers ordered: Thumb(R1), Index(R2), Middle(R3), Ring(R4), Pinky(R5) */}
                  <div className="flex justify-center items-end gap-3.5 h-48 w-full max-w-sm px-4">
                    {FINGER_KEYS.filter(f => f.hand === 'right').map((finger, idx) => {
                      const isSelected = selectedFingerId === finger.id;
                      const isScanned = !!capturedFingers[finger.id];
                      const isScanning = isScanningFinger === finger.id;
                      
                      // Derive heights representing anatomical finger lengths
                      let heightClass = "h-36"; // Middle
                      if (finger.type === 'pinky') heightClass = "h-24";
                      if (finger.type === 'ring') heightClass = "h-32";
                      if (finger.type === 'index') heightClass = "h-30";
                      if (finger.type === 'thumb') heightClass = "h-20 translate-y-3 self-end";

                      return (
                        <button
                          key={finger.id}
                          type="button"
                          onClick={() => {
                            if (isScanningFinger) return;
                            setSelectedFingerId(finger.id);
                            handleScanSpecificFinger(finger.id);
                          }}
                          disabled={isScanningFinger !== null}
                          className={`w-12 ${heightClass} rounded-t-3xl border transition-all flex flex-col justify-between items-center p-1.5 relative group cursor-pointer ${
                            isSelected
                              ? 'border-cyan-500 bg-cyan-950/25 text-cyan-200 shadow-lg shadow-cyan-500/10'
                              : isScanned
                              ? 'border-emerald-500/40 bg-emerald-950/10 text-emerald-300'
                              : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-750 hover:bg-slate-900/80'
                          }`}
                        >
                          {/* Selected / Scan status top glow */}
                          <div className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full filter blur-sm transition-all ${
                            isScanning
                              ? 'bg-amber-400 animate-ping'
                              : isSelected
                              ? 'bg-cyan-400'
                              : isScanned
                              ? 'bg-emerald-400'
                              : 'bg-transparent'
                          }`} />

                          {/* Fingerprint Glyph Area */}
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-950/80 border border-slate-800">
                            {isScanning ? (
                              <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                            ) : isScanned ? (
                              <Fingerprint className="w-5 h-5 text-emerald-400 animate-pulse" />
                            ) : (
                              <Fingerprint className={`w-4 h-4 transition-colors ${isSelected ? 'text-cyan-300' : 'text-slate-600 group-hover:text-slate-400'}`} />
                            )}
                          </div>

                          {/* Label info */}
                          <div className="text-center space-y-0.5 mt-2">
                            <span className="block text-[10px] font-black leading-none">{finger.label}</span>
                            <span className="block text-[8px] font-mono text-slate-500 leading-none">{finger.id}</span>
                            {isScanned && (
                              <span className="block text-[7px] text-emerald-400 font-bold bg-emerald-500/10 px-1 py-0.5 rounded-md mt-0.5 scale-90 whitespace-nowrap">ممسوح ✅</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* 1-Step Enrollment Progress Indicator Dashboard */}
              {(() => {
                const steps = enrollmentSteps[selectedFingerId] || [];
                const isFullyEnrolled = steps.length >= 1;
                return (
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-800">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">الإصبع المحدد للتسجيل اللحظي</span>
                        <p className="text-sm font-black text-white flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                          {FINGER_KEYS.find(f => f.id === selectedFingerId)?.nameAr || ''} ({FINGER_KEYS.find(f => f.id === selectedFingerId)?.handAr || ''})
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-300">حالة المسح:</span>
                        <span className={`text-xs font-black px-2.5 py-1 rounded-lg font-mono border ${
                          isFullyEnrolled
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : isScanningFinger === selectedFingerId
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                            : 'bg-slate-950/50 text-slate-500 border-slate-850'
                        }`}>
                          {isFullyEnrolled ? 'تم الالتقاط (1/1)' : 'بانتظار المسح (0/1)'}
                        </span>
                      </div>
                    </div>

                    {/* Step Visual Cards */}
                    <div className="grid grid-cols-1 gap-3">
                      {/* Step 1 */}
                      <div className={`p-3.5 rounded-xl border text-right space-y-2 transition-all duration-300 relative overflow-hidden ${
                        isFullyEnrolled 
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-950/45' 
                          : isScanningFinger === selectedFingerId
                          ? 'bg-cyan-950/10 border-cyan-500/40 text-cyan-400 animate-pulse'
                          : 'bg-slate-950/50 border-slate-850 text-slate-500'
                      }`}>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase tracking-wider">قراءة والتقاط البصمة البيومترية المباشرة (1/1)</span>
                          {isFullyEnrolled ? (
                            <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xs">✓</span>
                          ) : (
                            <span className="w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-400">1</span>
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-black">مسح وحفظ البصمة في السجل الطبي</p>
                          <p className="text-[9px] text-slate-400 truncate">
                            {steps[0] ? `تاريخ ووقت المسح: ${steps[0].timestamp}` : '👆 يرجى وضع وملاطفة الإصبع على الحساس مباشرة لبدء التقاط البصمة فوراً...'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Mismatch feedback if exists */}
                    {enrollmentFeedback && (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-right rounded-xl">
                        {enrollmentFeedback}
                      </div>
                    )}

                    {/* Simulator and Reset controls */}
                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-3 border-t border-slate-800">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="simulateMismatchCheckbox"
                          checked={simulateFingerMismatch}
                          onChange={(e) => setSimulateFingerMismatch(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                        <label htmlFor="simulateMismatchCheckbox" className="text-[10px] font-bold text-slate-400 cursor-pointer select-none">
                          ⚠️ محاكاة وضع إصبع غير متطابق (لاختبار رفض التسجيل وفشل المطابقة)
                        </label>
                      </div>

                      {steps.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setEnrollmentSteps(prev => ({ ...prev, [selectedFingerId]: [] }));
                            setCapturedFingers(prev => {
                              const copy = { ...prev };
                              delete copy[selectedFingerId];
                              return copy;
                            });
                            setFingerprintTemplate('');
                            setFingerprintCaptured(false);
                            setEnrollmentFeedback(null);
                            setBioScannerLogs(prev => [
                              ...prev,
                              `[نظام] 🗑️ تم مسح القراءات لـ [${FINGER_KEYS.find(f => f.id === selectedFingerId)?.nameAr}] لإعادة بدء التسجيل.`
                            ]);
                          }}
                          className="px-2.5 py-1.5 bg-rose-950/10 hover:bg-rose-950/30 border border-rose-500/20 rounded-xl text-[10px] text-rose-300 font-extrabold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          🗑️ تصفير وإعادة التقاط البصمة لهذا الإصبع
                        </button>
                      )}
                    </div>

                    {/* Scan trigger button */}
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleScanSpecificFinger(selectedFingerId)}
                        disabled={isScanningFinger !== null}
                        className={`w-full sm:w-auto px-8 py-3 bg-gradient-to-r text-white text-xs font-black rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                          isFullyEnrolled
                            ? 'from-emerald-700 to-emerald-800 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-950/20'
                            : 'from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 shadow-cyan-950/20'
                        }`}
                      >
                        {isScanningFinger ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-white" />
                            جاري مسح البصمة والتحقق منها ({scanningProgress}%)...
                          </>
                        ) : isFullyEnrolled ? (
                          <>
                            <Fingerprint className="w-4 h-4 text-emerald-300" />
                            تم التقاط البصمة بنجاح ✅ (انقر لإعادة المسح)
                          </>
                        ) : (
                          <>
                            <Fingerprint className="w-4 h-4 text-cyan-200 animate-pulse" />
                            بدء مسح والتقاط البصمة اللحظي 🩸
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Scan progress simulation & 360 Degree Finger Rotation Visualizer */}
              {isScanningFinger ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-3 animate-in fade-in duration-300 relative overflow-hidden">
                  <div className="flex justify-between items-center text-xs font-bold px-1">
                    <span className="text-cyan-400 flex items-center gap-1.5">
                      <RotateCw className="w-4 h-4 animate-spin text-cyan-300" />
                      خاصية فرة وتدوير الإصبع (360° Finger Rotation Scan):
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCancelScanning}
                        className="px-2 py-0.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        title="إلغاء المسح الحالي وإلغاء قفل النظام"
                      >
                        ⏹ إلغاء المسح
                      </button>
                      <span className="font-mono text-cyan-300 font-black text-sm bg-cyan-950 px-2 py-0.5 rounded-lg border border-cyan-800">
                        {scanningProgress}%
                      </span>
                    </div>
                  </div>

                  {/* Finger Rotation Wheel Animation */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                        <div 
                          className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400 transition-transform duration-200"
                          style={{ transform: `rotate(${Math.round(scanningProgress * 3.6)}deg)` }}
                        />
                        <Fingerprint 
                          className="w-8 h-8 text-cyan-400 transition-transform duration-200"
                          style={{ transform: `rotate(${Math.round((scanningProgress * 3.6) / 4)}deg)` }}
                        />
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-xs font-black text-white">
                          {scanningProgress === 0 ? '⏳ يرجى وضع إصبع المريض على العدسة الضوئية ZK9500 وتدويره...' :
                           scanningProgress < 30 ? '👈 تم كشف وضع الإصبع! يرجى الاستمرار بالضغط وتدويره 360°...' :
                           scanningProgress < 70 ? '🔄 جاري مسح وتغطية زوايا البصمة الجانبية (فرة الإصبع)...' :
                           scanningProgress < 100 ? '⚡ استخراج مصفوفة النقاط البيومترية (500 DPI)...' :
                           '🟢 اكتمل التعرف على بصمة الإصبع بنسبة 100%!'}
                        </p>
                        <p className="text-[10px] font-mono text-cyan-300">
                          زاوبة التدوير: {Math.round(scanningProgress * 3.6)}° / 360° | الحالة: {scanningProgress === 0 ? 'بانتظار اللمس الفيزيائي' : 'مسح حي نشط'}
                        </p>
                      </div>
                    </div>

                    {/* Developer/Manual Test Button */}
                    <button
                      type="button"
                      onClick={handleSimulatePhysicalTouchForTesting}
                      className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/50 rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 shadow-sm"
                      title="اضغط هنا لتجربة محاكاة لمس الإصبع وتدويره إذا لم يكن لديك جهاز ZK9500 موصول بالموديل"
                    >
                      <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
                      ⚡ تجربة التقاط البصمة يدويًا (بدون جهاز USB)
                    </button>
                  </div>

                  <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative">
                    <div 
                      className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-cyan-300 to-transparent filter blur-[1px] opacity-80"
                      style={{
                        left: `${scanningProgress - 10}%`,
                        transition: 'left 0.15s ease-out'
                      }}
                    />
                    <div 
                      className="h-full bg-gradient-to-l from-cyan-400 to-indigo-500 transition-all duration-150"
                      style={{ width: `${scanningProgress}%` }}
                    />
                  </div>
                </div>
              ) : Object.keys(capturedFingers).length > 0 ? (
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-right space-y-1 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      🟢 تم التعرف على بصمة الإصبع بنجاح بنسبة 100% ✅
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                      تمت فرة الإصبع والمطابقة الكاملة
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    تم استخراج وتوليد القالب البيومتري الحقيقي للأصابع الملتقطة. يمكنك الآن الضغط على زر <strong className="text-emerald-400 font-extrabold">"حفظ وتأكيد البصمة البيومترية"</strong> أدناه للاعتماد النهائى.
                  </p>
                </div>
              ) : null}

              {/* Console Logs inside the finger modal */}
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 flex items-center gap-1.5 justify-end">
                  <span>سجل المعالجة البيومترية المباشرة (Active Biometric Stream)</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                </p>
                <div className="h-24 bg-slate-950 border border-slate-900 rounded-xl p-3 font-mono text-[9px] text-emerald-400 overflow-y-auto space-y-1 shadow-inner text-right select-none" dir="ltr">
                  {bioScannerLogs.slice(-10).map((log, idx) => (
                    <div key={idx} className="leading-relaxed whitespace-pre-wrap text-right">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-900/40 border-t border-slate-850 flex flex-col sm:flex-row gap-2 justify-between items-center shrink-0">
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold">
                  إجمالي البصمات الملتقطة حالياً: <span className="text-emerald-400 font-extrabold">{Object.keys(capturedFingers).length} من أصل 10 أصابع</span>
                </p>
                {Object.keys(capturedFingers).length === 0 && (
                  <p className="text-[10px] text-amber-400/90 font-semibold flex items-center gap-1 mt-0.5">
                    🔒 زر الحفظ مقفل: يرجى وضع إصبع المريض وتدويره حتى التعرف بنسبة 100% أولاً
                  </p>
                )}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    const selectedData = capturedFingers[selectedFingerId];
                    if (selectedData) {
                      setFingerprintTemplate(selectedData.template);
                      setFingerprintCaptured(true);
                      setBioScannerLogs(prev => [...prev, `[نظام] تم اعتماد بصمة الإصبع المحددة بنجاح للتحقق والمطابقة اللحظية.`]);
                    } else {
                      const scannedIds = Object.keys(capturedFingers);
                      if (scannedIds.length > 0) {
                        const targetId = scannedIds[0];
                        const finger = FINGER_KEYS.find(f => f.id === targetId);
                        setFingerprintTemplate(capturedFingers[targetId].template);
                        setFingerprintCaptured(true);
                        setBioScannerLogs(prev => [...prev, `[نظام] تم اعتماد بصمة [${finger?.nameAr}] كمعرف أساسي للمريض.`]);
                      }
                    }
                    setShowHandFingerprintModal(false);
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-950/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={isScanningFinger !== null || Object.keys(capturedFingers).length === 0}
                >
                  حفظ وتأكيد البصمة البيومترية ✅
                </button>
                <button
                  type="button"
                  onClick={() => setShowHandFingerprintModal(false)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer"
                  disabled={isScanningFinger !== null}
                >
                  إغلاق النافذة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wristband & Tableh Sticker Generation Success Modal */}
      {showWristbandModal && (() => {
        const formattedDateTime = new Date().toLocaleString('ar-IQ', { hour12: true });
        const cleanId = String(showWristbandModal.id || showWristbandModal.biometricCode || '041852FC').replace('bio-', '').toUpperCase();
        const formattedCodeText = `QR-LAB-${cleanId.substring(0, 10)}`;
        const tablehBarcodeDisplay = formatToStandardBarcode(showWristbandModal.medicalRecordNumber || showWristbandModal.biometricCode || showWristbandModal.id || '041852FC');

        return (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4" dir="rtl">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 max-h-[90vh]">
              
              {/* Header */}
              <div className="p-4 border-b border-slate-900 bg-slate-900/50 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-sm font-black text-white">
                    تم الحفظ بنجاح وتوليد ملصقات المريض الموحدة 🏷️📋
                  </h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowWristbandModal(null)} 
                  className="text-slate-400 hover:text-white transition-colors text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              {/* Subheader & Tabs */}
              <div className="px-6 pt-4 pb-2 text-center shrink-0">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-emerald-400">مستشفى الفرح الأهلي - منصة رعاية المريض وإصدار الباركود</p>
                  <p className="text-[11px] text-slate-400">
                    تم تسجيل المريض بنجاح في الأرشيف الطبي وإصدار باركود سوار المعصم وملصق إضبارة الطبلة.
                  </p>
                </div>

                {/* View Switcher Tabs */}
                <div className="flex justify-center gap-2 mt-3 p-1 bg-slate-900/80 border border-slate-800 rounded-xl max-w-md mx-auto">
                  <button
                    type="button"
                    onClick={() => setActiveModalLabelTab('both')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeModalLabelTab === 'both'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>📑 عرض الاثنين</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModalLabelTab('wristband')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeModalLabelTab === 'wristband'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>🏷️ ملصق السوار</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModalLabelTab('tableh')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeModalLabelTab === 'tableh'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>📋 ملصق الطبلة</span>
                  </button>
                </div>
              </div>

              {/* Content / Previews */}
              <div className="px-6 py-4 space-y-4 flex-1 overflow-y-auto">

                {/* 1. Wristband Preview */}
                {(activeModalLabelTab === 'both' || activeModalLabelTab === 'wristband') && (
                  <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 max-w-lg mx-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                        <span>🏷️ 1. معاينة ملصق سوار المعصم (Wristband - 50x30mm)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handlePrintWristbandOnRegister(showWristbandModal)}
                        className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3 h-3" />
                        طباعة السوار فقط
                      </button>
                    </div>
                    
                    {/* Actual Wristband Sticker Design (100% English - matching exact layout) */}
                    <div className="p-3 rounded-lg border-2 border-black flex flex-col justify-between shadow-md select-none min-h-[130px] max-w-[400px] mx-auto text-left" style={{ backgroundColor: '#ffffff', color: '#000000', direction: 'ltr' }}>
                      
                      {/* Top Header */}
                      <div className="flex justify-between items-center border-b-2 border-black pb-1 mb-1.5">
                        <span className="text-[12px] font-black tracking-wide uppercase text-black">AL-FARAH HOSPITAL</span>
                        <span className="text-[12px] font-black text-black border border-black px-1.5 py-0.5 rounded">{formatBloodTypeEnglish(showWristbandModal.bloodTypeDisplay || showWristbandModal.bloodType)}</span>
                      </div>

                      {/* Main Content Split */}
                      <div className="flex flex-row justify-between items-stretch gap-2.5 flex-1">
                        {/* Left Column: Patient Details */}
                        <div className="flex-1 flex flex-col justify-between text-left text-black min-w-0 pr-1 space-y-1">
                          <div className="text-[13px] font-black leading-tight break-words text-black">
                            Name: <span>{showWristbandModal.fullName}</span>
                          </div>
                          <div className="text-[12px] font-black text-black flex items-center justify-between">
                            <span>Age: {showWristbandModal.age || '0'}</span>
                            <span>{formatGenderEnglish(showWristbandModal.gender)}</span>
                          </div>
                          <div className="text-[12.5px] font-black text-black">
                            <span>Room: {showWristbandModal.roomNumber || 'N/A'}</span>
                          </div>
                          {showWristbandModal.doctorName && (
                            <div className="text-[10.5px] font-bold text-black truncate flex items-center gap-1">
                              <span>👨‍⚕️</span>
                              <span>Dr: <strong>{showWristbandModal.doctorName}</strong></span>
                            </div>
                          )}
                          {showWristbandModal.operationType && (
                            <div className="text-[10px] font-bold text-black truncate flex items-center gap-1">
                              <span>🩺</span>
                              <span>Op: <strong>{cleanOperationTypeEnglish(showWristbandModal.operationType)}</strong></span>
                            </div>
                          )}
                        </div>

                        {/* Right Column: QR Code Section */}
                        <div className="w-[115px] border-l-2 border-dashed border-black pl-2 flex flex-col items-center justify-center text-center shrink-0">
                          {wristbandModalQRUrl ? (
                            <img 
                              src={wristbandModalQRUrl} 
                              alt="Patient QR Code" 
                              className="w-20 h-20 object-contain mx-auto"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-slate-100 flex items-center justify-center text-[9px] text-slate-400">Loading...</div>
                          )}
                          <div className="text-[8.5px] font-mono font-black mt-1 whitespace-nowrap overflow-hidden text-ellipsis w-full text-black">
                            {`QR-LAB-${cleanId.substring(0, 10)}`}
                          </div>
                        </div>
                      </div>

                      {/* Footer Badge */}
                      <div className="mt-2 pt-1">
                        <div className="w-full text-center py-1 border-2 border-black rounded text-[12px] font-black tracking-wider uppercase text-black bg-white">
                          {cleanAnalysisType(showWristbandModal.analysisType || 'Cross-match').toUpperCase()}
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* 2. Tableh QR Preview (Full Size QR Code Only) */}
                {(activeModalLabelTab === 'both' || activeModalLabelTab === 'tableh') && (
                  <div className="p-3.5 rounded-xl bg-slate-900/40 border border-blue-900/40 max-w-lg mx-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1">
                        <span>📋 2. معاينة كيو ار كود الطبلة (كامل الورقة بدون تفاصيل)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handlePrintTablehBarcode(showWristbandModal)}
                        className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3 h-3" />
                        طباعة كيو ار كود الطبلة
                      </button>
                    </div>
                    
                    {/* Full Size Tableh QR Design without patient details */}
                    <div className="p-4 rounded-xl border-2 border-black flex flex-col items-center justify-center text-center shadow-lg select-none min-h-[220px] max-w-[320px] mx-auto bg-white" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
                      {tablehModalQRUrl ? (
                        <img 
                          src={tablehModalQRUrl} 
                          alt="Patient Chart QR Code" 
                          className="w-48 h-48 object-contain"
                        />
                      ) : (
                        <div className="w-48 h-48 bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">QR Loading...</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Instructions */}
                <div className="p-3 bg-slate-900/60 border border-slate-800/50 rounded-xl text-right text-[11px] text-slate-300 space-y-1 max-w-lg mx-auto">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    تعليمات الاستخدام الطبي:
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[10.5px]">
                    • <strong className="text-emerald-300">ملصق السوار:</strong> يوضع على معصم المريض لمطابقة وسحب عينات الدم بأمان.
                    <br />
                    • <strong className="text-blue-300">ملصق الطبلة:</strong> يوضع على إضبارة / ملف المريض الورقي لسهولة وسرعة المسح الضوئي في صالة العمليات والردهات.
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 bg-slate-900/80 border-t border-slate-900 flex flex-wrap gap-2 justify-between items-center shrink-0">
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handlePrintWristbandOnRegister(showWristbandModal)}
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-white" />
                    طباعة باركود السوار
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePrintTablehBarcode(showWristbandModal)}
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-white" />
                    طباعة ملصق الطبلة 📋
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePrintBothLabels(showWristbandModal)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-purple-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-white" />
                    طباعة الاثنين معاً 🖨️
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowWristbandModal(null)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  إغلاق النافذة والمتابعة
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Real-time scanning animation overlay */}
      {isScanningFingerprint && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4" dir="rtl">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-center space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Visual scan animation */}
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center bg-slate-900 rounded-full border border-slate-800 overflow-hidden">
              {/* Scanning laser line */}
              <div 
                className="absolute left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-lg shadow-emerald-400/50 animate-bounce z-10"
                style={{
                  top: `${fingerprintScanProgress}%`,
                  animationDuration: '2s'
                }}
              />
              
              {/* Rotating target background */}
              <div className="absolute inset-2 border-2 border-dashed border-emerald-500/10 rounded-full animate-spin" style={{ animationDuration: '20s' }} />
              
              {/* Fingerprint graphic */}
              <Fingerprint className={`w-20 h-20 transition-all duration-300 ${
                fingerprintAnimationStep === 'scanning' 
                  ? 'text-blue-400 animate-pulse' 
                  : fingerprintAnimationStep === 'extracting'
                  ? 'text-yellow-400 scale-105'
                  : 'text-emerald-400 scale-110'
              }`} />
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-black text-white">
                {fingerprintAnimationStep === 'scanning' 
                  ? 'جاري فحص الإصبع على عدسة الماسح...' 
                  : fingerprintAnimationStep === 'extracting'
                  ? 'جاري استخراج الخصائص الحيوية (500 DPI)...'
                  : 'اكتمل المسح واستخراج القالب بنجاح!'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                {connectedBioDevice 
                  ? `أمر قراءة بيومترية نشط من جهاز: ${connectedBioDevice.name}`
                  : 'جاري القراءة من القارئ الافتراضي المتكامل للدم.'}
              </p>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5 w-full">
              <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
                <span>مستوى المعالجة الحيوية:</span>
                <span className="font-mono">{fingerprintScanProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-gradient-to-l from-emerald-500 to-teal-400 transition-all duration-300"
                  style={{ width: `${fingerprintScanProgress}%` }}
                />
              </div>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-mono text-emerald-400 h-16 overflow-y-auto text-right space-y-1">
              <div>&gt;_ initializing sensor hardware... OK</div>
              {fingerprintScanProgress >= 30 && <div className="text-blue-400">&gt;_ Finger touch recognized on optical reader.</div>}
              {fingerprintScanProgress >= 60 && <div className="text-yellow-400">&gt;_ Minutiae fingerprint templates processed.</div>}
              {fingerprintScanProgress >= 100 && <div className="text-emerald-400">&gt;_ Template encrypted and verified successfully.</div>}
            </div>
          </div>
        </div>
      )}

      {/* Inline PDF Viewer Modal */}
      {pdfToView && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md" onClick={() => setPdfToView(null)} />
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200" style={{ direction: 'rtl' }}>
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📄</span>
                <div className="text-right">
                  <h3 className="text-sm font-black text-white">مستند التقرير الطبي المرفق (PDF)</h3>
                  <p className="text-[10px] text-slate-400 font-bold max-w-[250px] sm:max-w-md truncate" title={pdfToView.name}>{pdfToView.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={pdfToView.base64}
                  download={pdfToView.name}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition-all text-center flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-950/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تنزيل الملف</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPdfToView(null)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  إغلاق النافذة
                </button>
              </div>
            </div>

            {/* Modal Body - PDF Iframe Viewer */}
            <div className="flex-1 bg-slate-950 p-4 flex items-center justify-center relative">
              {pdfToView.base64 ? (
                <iframe
                  src={pdfToView.base64}
                  className="w-full h-full rounded-2xl border border-slate-800/80 bg-white"
                  title="PDF Viewer"
                />
              ) : (
                <div className="text-center space-y-2 text-slate-500">
                  <p className="text-sm font-bold">الملف غير متوفر حالياً للعرض.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ZKTech SDK Driver Download & Setup Modal */}
      {showZkSdkDownload && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setShowZkSdkDownload(false)} />
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
                  <Fingerprint className="w-6 h-6 animate-pulse" />
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-black text-white">مساعد تفعيل وتنزيل تعريفات جهاز البصمة ZKTech USB SDK</h3>
                  <p className="text-[10px] text-slate-400 font-bold">تشغيل وربط بصمة ZKTeco SLK20R / ZK9500 / ZK4500 تلقائياً بمجرد توصيل USB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowZkSdkDownload(false)}
                className="text-slate-400 hover:text-white transition-colors text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto text-right">
              {/* Concept Alert */}
              <div className="p-4 bg-gradient-to-l from-indigo-950/40 to-slate-950/40 border border-indigo-500/15 rounded-2xl space-y-2">
                <h4 className="text-xs font-black text-indigo-300 flex items-center gap-1.5">
                  <span>ℹ️</span>
                  كيف يعمل قارئ البصمة USB مباشرة مع الأنظمة السحابية والويب؟
                </h4>
                <p className="text-[10px] text-slate-300 leading-relaxed">
                  أنظمة الويب السحابية لا تستطيع قراءة منافذ USB مباشرة لأسباب أمنية بالمتصفحات. لذلك، تقدم شركة <span className="font-bold text-white">ZKTeco</span> حزمة ويب محلية خفيفة وآمنة تدعى <span className="font-bold text-emerald-400">ZKOnline SDK Service</span>.
                  تعمل هذه الخدمة كجسر آمن في الخلفية على حاسوبك، لتلتقط بصمة الإصبع من جهاز الـ USB الموصول وتمررها مشفرة فوراً للمنظومة على المنفذ المحلي <span className="font-mono text-cyan-400 font-black">22001</span>.
                </p>
              </div>

              {/* Steps */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-white border-b border-slate-800 pb-1.5 flex items-center gap-2">
                  <span>🛠️</span>
                  خطوات تفعيل وتشغيل البصمة على حاسوبك (خلال دقيقة واحدة):
                </h4>
                
                <div className="space-y-3">
                  {/* Step 1 */}
                  <div className="flex gap-3 text-right">
                    <span className="w-5 h-5 bg-slate-800 text-slate-200 border border-slate-700 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">١</span>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-200">توصيل جهاز البصمة USB</p>
                      <p className="text-[10px] text-slate-400">قم بربط قارئ البصمة ZKTech USB في فتحة USB بالكمبيوتر وتأكد من إضاءة الجهاز باللون الأحمر أو الأزرق الخفيف.</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-3 text-right">
                    <span className="w-5 h-5 bg-slate-800 text-slate-200 border border-slate-700 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">٢</span>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-200">تحميل معالج الإعداد التلقائي (ZKTeco SDK Helper)</p>
                      <p className="text-[10px] text-slate-400">قم بتنزيل ملف الدفعة المساعد الذي قمنا ببرمجته لك، لتشغيله واختبار منفذ البصمة ومكافحة مشاكل الاتصال.</p>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const scriptContent = `@echo off\r\n` +
                            `chcp 65001 > nul\r\n` +
                            `title ZKTeco USB Biometric SDK Driver Setup Helper\r\n` +
                            `echo =======================================================================\r\n` +
                            `echo           ZKTeco USB Biometric SDK Driver Setup Assistant\r\n` +
                            `echo =======================================================================\r\n` +
                            `echo.\r\n` +
                            `echo مرحبًا بك في معالج إعداد قارئ بصمات ZKTeco (SLK20R / ZK9500 / ZK4500)\r\n` +
                            `echo هذا الملف الإرشادي والبرمجي يساعدك على تشغيل قارئ البصمة USB فورًا على النظام.\r\n` +
                            `echo.\r\n` +
                            `echo 1. خطوات التشغيل الأساسية:\r\n` +
                            `echo -----------------------------\r\n` +
                            `echo أ- تأكد من توصيل قارئ البصمة USB في منفذ متوافق (يفضل USB 2.0).\r\n` +
                            `echo ب- تحتاج لتثبيت "ZKOnline SDK Web Service" لكي يستطيع المتصفح الوصول للجهاز.\r\n` +
                            `echo ج- المنفذ القياسي المستعمل لاستلام البصمات هو (Port 22001).\r\n` +
                            `echo.\r\n` +
                            `echo 2. فحص حالة الاتصال الحالية:\r\n` +
                            `echo -----------------------------\r\n` +
                            `echo جاري فحص ما إذا كان هناك جهاز متصل أو خدمة ويب نشطة...\r\n` +
                            `netstat -ano | findstr 22001 > nul\r\n` +
                            `if %errorlevel% equ 0 (\r\n` +
                            `    echo [نشط] تم اكتشاف خدمة ZKOnline SDK الويب قيد التشغيل على منفذ 22001!\r\n` +
                            `    echo البصمة جاهزة للاستخدام الآن على واجهة النظام.\r\n` +
                            `) else (\r\n` +
                            `    echo [تنبيه] خدمة الويب المحلية (Port 22001) ليست قيد التشغيل حالياً.\r\n` +
                            `    echo يرجى تنزيل وتثبيت حزمة "ZKOnline SDK" الرسمية من موقع ZKTeco أو تشغيل التطبيق المساعد.\r\n` +
                            `)\r\n` +
                            `echo.\r\n` +
                            `echo 3. تفعيل الاتصال الآمن (Local Loopback):\r\n` +
                            `echo ---------------------------------------\r\n` +
                            `echo لتجنب حظر المتصفح للاتصالات المحلية، يرجى التأكد من تشغيل المتصفح مع السماح بـ:\r\n` +
                            `echo chrome://flags/#allow-insecure-localhost\r\n` +
                            `echo.\r\n` +
                            `echo =======================================================================\r\n` +
                            `echo اضغط على أي مفتاح للخروج بعد قراءة التعليمات...\r\n` +
                            `pause > nul`;

                          const blob = new Blob([scriptContent], { type: 'text/plain;charset=utf-8' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = 'ZKTeco_SDK_Setup_Helper.bat';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                        }}
                        className="mt-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer w-fit"
                      >
                        <Download className="w-3.5 h-3.5" />
                        تنزيل ملف إعداد ودليل التهيئة ZKTeco_SDK_Helper.bat 📥
                      </button>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-3 text-right">
                    <span className="w-5 h-5 bg-slate-800 text-slate-200 border border-slate-700 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">٣</span>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-200">تثبيت الويب سيرفس الرسمية (ZKOnline SDK Service)</p>
                      <p className="text-[10px] text-slate-400">تحتوي الحزمة الرسمية من شركة ZKTeco على ملف تثبيت خفيف يُنشئ الخدمة المحلية على منفذ 22001. بمجرد انتهاء التثبيت، ستقوم المنظومة باكتشاف القارئ والتقاط البصمات فوراً عند وضع الإصبع.</p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex gap-3 text-right">
                    <span className="w-5 h-5 bg-slate-800 text-slate-200 border border-slate-700 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">٤</span>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-200">سماح ببروتوكول الاتصال المحلي (المتصفحات الآمنة)</p>
                      <p className="text-[10px] text-slate-400">من أجل حماية خصوصية بيانات المرضى، ننصح بفتح الرابط التالي في المتصفح وتفعيله لتجنب اعتراض شهادات الأمان المحلية:</p>
                      <code className="block bg-slate-950 p-2 rounded-lg text-[9px] text-cyan-300 font-mono text-left select-all mt-1.5 w-fit border border-slate-850">
                        chrome://flags/#allow-insecure-localhost
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Test Live Loopback Connection to Local Service */}
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                <div className="text-right space-y-1">
                  <p className="text-xs font-black text-white">اختبار الإشارة المباشرة لخدمة البصمة المحلية</p>
                  <p className="text-[10px] text-slate-400">انقر هنا لفحص ما إذا تم تثبيت وتشغيل الخدمة بنجاح على حاسوبك الشخصي الآن</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    setBioScannerLogs(prev => [...prev, `[${new Date().toLocaleTimeString('en-US')}] 🔍 جاري إرسال نبضة فحص حية ومباشرة إلى منفذ ZKTeco المحلي 22001...`]);
                    try {
                      const controller = new AbortController();
                      const timeoutId = setTimeout(() => controller.abort(), 1200);
                      await fetch('http://127.0.0.1:22001/', { mode: 'no-cors', signal: controller.signal });
                      clearTimeout(timeoutId);
                      
                      setBioScannerLogs(prev => [
                        ...prev,
                        `🟢 [توصيل حقيقي ناجح] تم كشف خدمة ZKTech USB على الحاسوب بنشاط!`
                      ]);
                      handleConnectBioDevice(BIOMETRIC_USB_DEVICES[0]);
                      alert('نجاح الاتصال! تم كشف جهاز ZKTech USB البيومتري الموصول بحاسوبك وهو يعمل بنجاح الآن.');
                      setShowZkSdkDownload(false);
                    } catch (e) {
                      setBioScannerLogs(prev => [
                        ...prev,
                        `❌ فشل الاتصال بالمنفذ 22001. يرجى مراجعة تشغيل البرنامج الخدمي ZKOnline SDK على حاسوبك الشخصي أولاً.`
                      ]);
                      alert('تنبيه: لم يتم كشف الخدمة المحلية قيد التشغيل بعد على المنفذ 22001. يرجى تتبع خطوات الدليل المرفق وتشغيل البرنامج الخدمي للربط.');
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950/20 self-stretch sm:self-auto text-center justify-center shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>فحص وتأكيد الاتصال الفوري 🔌</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowZkSdkDownload(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                إغلاق النافذة والمتابعة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen PDF Viewer Modal for Archived Laboratory Books & Documents */}
      {pdfToView && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md" 
            onClick={() => setPdfToView(null)} 
          />
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl h-[85vh] shadow-2xl relative z-10 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" style={{ direction: 'rtl' }}>
            {/* Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">{pdfToView.name}</h3>
                  <p className="text-[10px] text-slate-400">معاينة الكتاب والمستند الطبي المؤرشف</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={pdfToView.base64}
                  download={`${pdfToView.name}.pdf`}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تنزيل الملف</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPdfToView(null)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* PDF Embed / Iframe */}
            <div className="flex-1 bg-slate-950 p-2 overflow-hidden">
              <iframe
                src={pdfToView.base64}
                title={pdfToView.name}
                className="w-full h-full rounded-2xl border border-slate-800"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
