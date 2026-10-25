import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import {
  Calendar,
  Clock,
  Phone,
  MapPin,
  ShieldCheck,
  Award,
  HeartHandshake,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  User,
  Stethoscope,
  Search,
  MessageSquare,
  Bell,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
  RefreshCw,
  CalendarOff,
  Check,
  Printer,
  ArrowRight,
  Activity,
  Info,
  Navigation,
  PhoneCall,
  Ban,
  Sun,
  Moon,
  Settings,
  LogOut,
  KeyRound,
  Smile,
  Edit3,
  Trash2,
  Globe,
  Star,
  Layers,
  QrCode,
  Download,
  Copy,
  Share2,
  ExternalLink
} from 'lucide-react';

// ==========================================
// 1. FIREBASE INITIALIZATION (STRICT RULES)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyCsKIdVbZvoG4EtiDiwZfXxzXUdEulAziY",
  authDomain: "dr-banik-dental.firebaseapp.com",
  projectId: "dr-banik-dental",
  storageBucket: "dr-banik-dental.firebasestorage.app",
  messagingSenderId: "400210844072",
  appId: "1:400210844072:web:017fa23389cd157d7ae59d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'dr-banik-dental-clinic';

// Production Firestore Collection Names (Clean Slate — Zero Fake Patients)
const APPOINTMENTS_COLLECTION = 'chamber_appointments_live';
const SETTINGS_COLLECTION = 'chamber_settings_live';

// ==========================================
// 2. DEFAULT CHAMBER PROFILE & SERVICES
// ==========================================
const DEFAULT_SERVICES = [
  // REGULAR CHAMBER SERVICES (Morning 10:00 AM - 12:00 PM & Evening 05:00 PM - 08:30 PM)
  {
    id: 'general-consultation',
    name: 'General Dental Checkup & Toothache Relief',
    nameBn: 'সাধারণ দাঁতের চেকআপ ও ব্যথা উপশম',
    shortName: 'Checkup / Toothache',
    category: 'regular',
    duration: '15 mins',
    fee: '₹300',
    badge: 'Most Common',
    description:
      '1-on-1 clinical tooth & gum examination by Dr. Banik, acute toothache/swelling relief, treatment planning & prescription.',
    active: true
  },
  {
    id: 'followup-xray-review',
    name: 'Follow-Up Visit / Outside X-Ray Report Review',
    nameBn: 'ফলো-আপ ভিজিট / বাইরের এক্স-রে রিপোর্ট দেখানো',
    shortName: 'Follow-Up / X-Ray Review',
    category: 'regular',
    duration: '15 mins',
    fee: 'As Advised',
    badge: 'Returning Patients',
    description:
      'For returning patients bringing outside dental X-ray reports (IOPAR/OPG), post-extraction checkups, or ongoing treatment review.',
    active: true
  },
  {
    id: 'tooth-extraction',
    name: 'Painless Tooth Extraction',
    nameBn: 'ব্যথাহীন দাঁত তোলা (Extraction)',
    shortName: 'Tooth Extraction',
    category: 'regular',
    duration: '25 mins',
    fee: '₹500 – ₹1,200',
    badge: 'Gentle Hand',
    description:
      'Safe, comfortable removal of mobile teeth, severely decayed roots, or painful wisdom teeth under fast-acting local anesthesia.',
    active: true
  },
  {
    id: 'dentures-bridges',
    name: 'Complete & Partial Dentures / Fixed Bridges',
    nameBn: 'নকল দাঁত বাঁধানো (Dentures & Bridges)',
    shortName: 'Dentures & Bridges',
    category: 'regular',
    duration: '30 mins',
    fee: '₹1,500 onwards',
    badge: 'Senior Friendly',
    description:
      'Custom-fitted removable complete dentures (full set), flexible partial dentures, and fixed bridges to restore comfortable chewing.',
    active: true
  },
  {
    id: 'pediatric-care',
    name: "Children's (Pediatric) Dental Care",
    nameBn: 'শিশুদের দাঁতের যত্ন ও চিকিৎসা',
    shortName: 'Kids Dental Care',
    category: 'regular',
    duration: '20 mins',
    fee: '₹300 – ₹600',
    badge: 'Child Friendly',
    description:
      'Patient, fear-free dental checkups for children including loose milk tooth removal, kids cavity care, and toothache relief.',
    active: true
  },

  // SPECIAL CASES (Off-Chamber Period: 12:00 PM – 04:00 PM | Max 2 Per Day | Price Discussed During Checkup)
  {
    id: 'root-canal-crowns',
    name: 'Root Canal Treatment (RCT) & Dental Cap',
    nameBn: 'রুট ক্যানেল (RCT) এবং দাঁতের ক্যাপ',
    shortName: 'RCT & Dental Cap',
    category: 'special',
    duration: '90–120 mins',
    fee: 'Discussed with Doctor during checkup',
    badge: 'Special Case (12–4 PM)',
    description:
      'Extended, dedicated root canal sitting to save infected natural teeth, followed by precision PFM or Zirconia dental cap measurement.',
    active: true
  },
  {
    id: 'scaling-polishing',
    name: 'Ultrasonic Scaling & Gum Polishing',
    nameBn: 'আল্ট্রাসনিক স্কেলিং ও দাঁত পরিষ্কার',
    shortName: 'Scaling & Polishing',
    category: 'special',
    duration: '60 mins',
    fee: 'Discussed with Doctor during checkup',
    badge: 'Special Case (12–4 PM)',
    description:
      'Thorough ultrasonic removal of hard tartar, plaque, stubborn stains, and bleeding gums requiring unhurried special care.',
    active: true
  },
  {
    id: 'tooth-fillings',
    name: 'Tooth-Coloured Cavity Fillings',
    nameBn: 'দাঁতের রঙের ক্যাভিটি ফিলিং',
    shortName: 'Cavity Fillings',
    category: 'special',
    duration: '45–60 mins',
    fee: 'Discussed with Doctor during checkup',
    badge: 'Special Case (12–4 PM)',
    description:
      'Careful shade-matched composite & GIC dental restoration for deep cavities, food lodgement, or chipped front teeth.',
    active: true
  },
  {
    id: 'tooth-braces',
    name: 'Tooth Braces (Orthodontic Alignment)',
    nameBn: 'দাঁতের ব্রেসেস (আঁকাবাঁকা দাঁতের চিকিৎসা)',
    shortName: 'Tooth Braces',
    category: 'special',
    duration: '60–90 mins',
    fee: 'Discussed with Doctor during checkup',
    badge: 'Special Case (12–4 PM)',
    description:
      'Dedicated orthodontic consultation, braces bonding, wire adjustments, and alignment care for crowded or protruding teeth.',
    active: true
  }
];

const DEFAULT_CHAMBER_SETTINGS = {
  doctorName: 'Dr. Debashish Banik',
  degree: 'BDS (Regional Dental College, Guwahati)',
  regNo: 'TSDC Reg. Dental Surgeon',
  title: 'Dental Surgeon • Solo Private Practice',
  experience: '15+ Years Clinical Experience',
  clinicName: "Dr. Debashish Banik's Dental Chamber",
  phone: '+91 94361 28490',
  whatsapp: '919436128490',
  consultationFee: '₹300',
  address:
    'A.A Road, Beside Tropical Orthopaedics and Related Research Centre (near Mathchowmahani Bazar), Agartala, Tripura, 799007',
  landmark:
    'Beside Tropical Orthopaedics and Related Research Centre, near Mathchowmahani Bazar, A.A Road',
  mapQuery:
    'Tropical Orthopaedics and Related Research Centre, A.A Road, Mathchowmahani, Agartala, Tripura 799007',
  morningHoursLabel: '10:00 AM – 12:00 PM',
  specialHoursLabel: '12:00 PM – 04:00 PM (Special Cases Only)',
  eveningHoursLabel: '05:00 PM – 08:30 PM',
  daysOpenLabel: 'Mon – Sat (Sunday: By Prior Appointment)',
  slotDuration: 20, // 15, 20, or 30 mins for regular chamber
  maxSpecialCasesPerDay: 2, // Strict cap of 2 special cases per day
  autoReminder24h: true,
  autoReminder2h: true,
  adminPin: '1982', // Default private PIN, editable in dashboard, never shown on public screen
  customBookingUrl: '', // Optional custom domain URL for QR Code
  blockedDates: {},
  services: DEFAULT_SERVICES
};

const SYMPTOM_CHIPS = [
  'Severe toothache / swelling',
  'Bringing outside X-ray report for review',
  'Discussed with Doctor for Special Case slot',
  'Loose / mobile tooth needing removal',
  'Food getting stuck in cavity',
  'Denture / Cap measurement'
];

// ==========================================
// 3. BILINGUAL DICTIONARY (ENGLISH / বাংলা)
// ==========================================
const TRANSLATIONS = {
  en: {
    bookBtn: 'Book Appointment',
    qrBtn: 'Booking QR',
    showQrHeroBtn: 'Show Clinic QR Code',
    checkTokenBtn: 'Check Token / Reschedule',
    aboutNav: 'About Doctor',
    servicesNav: 'Treatments & Special Cases',
    locationNav: 'Chamber Address & Map',
    heroBadge: 'BDS, Regional Dental College (RDC), Guwahati • 15+ Yrs Experience',
    heroTitlePrefix: 'Personal, Painless & Trusted Dental Care by',
    heroSubtitle:
      'Welcome to a dedicated solo dental chamber on A.A Road, Agartala. Every patient is examined and treated 1-on-1 by Dr. Debashish Banik himself.',
    liveQueueTitle: 'Live Today’s Chamber Token Status',
    insideNow: 'Inside Chamber Now',
    nextToken: 'Next Token in Queue',
    morningChamber: 'Morning Chamber',
    specialChamber: 'Special Cases (Off-Chamber)',
    eveningChamber: 'Evening Chamber',
    outsideXrayTitle: 'Important Note on Dental X-Rays & Diagnostics',
    outsideXrayBody:
      'This is a solo clinical dental chamber and not a diagnostic center. Any required tooth X-rays (IOPAR / OPG) or blood tests are prescribed to be done from outside diagnostic centers and brought for review.',
    regularTreatmentsHeader: 'Regular Chamber Treatments (Morning & Evening)',
    specialTreatmentsHeader: 'Special Cases (12:00 PM – 04:00 PM • Max 2 Per Day)',
    specialCaseExplainer:
      'Special Cases require extended care and dedicated assistance. They are performed strictly during the Off-Chamber period (12:00 PM – 04:00 PM), limited to a maximum of 2 cases per day. Treatment charges are discussed with Dr. Banik during your initial dental checkup before booking a Special Case slot.'
  },
  bn: {
    bookBtn: 'চেম্বার বুকিং করুন',
    qrBtn: 'বুকিং QR',
    showQrHeroBtn: 'চেম্বার বুকিং QR কোড',
    checkTokenBtn: 'টোকেন খুঁজুন / সময় পরিবর্তন',
    aboutNav: 'ডাক্তার সম্পর্কে',
    servicesNav: 'চিকিৎসা ও স্পেশাল কেস',
    locationNav: 'চেম্বারের ঠিকানা ও ম্যাপ',
    heroBadge: 'বি.ডি.এস (আঞ্চলিক ডেন্টাল কলেজ, গুয়াহাটি) • ১৫+ বছরের অভিজ্ঞতা',
    heroTitlePrefix: 'যত্ন সহকারে ও ব্যথাহীন দাঁতের চিকিৎসা —',
    heroSubtitle:
      'আগরতলার এ.এ রোডে (মঠচৌমুহনী বাজার সংলগ্ন) ডাঃ দেবাশীষ বণিকের নিজস্ব ডেন্টাল চেম্বার। প্রতিটি রোগীকে ডাক্তারবাবু নিজে যত্ন সহকারে পরীক্ষা ও চিকিৎসা করেন।',
    liveQueueTitle: 'আজকের চেম্বারের লাইভ টোকেন স্ট্যাটাস',
    insideNow: 'এখন চেম্বারে আছেন',
    nextToken: 'পরবর্তী টোকেন',
    morningChamber: 'সকালের চেম্বার',
    specialChamber: 'স্পেশাল কেস (দুপুর ১২টা – ৪টা)',
    eveningChamber: 'সন্ধ্যার চেম্বার',
    outsideXrayTitle: 'দাঁতের এক্স-রে (X-Ray) ও পরীক্ষা সংক্রান্ত জরুরি বিজ্ঞপ্তি',
    outsideXrayBody:
      'এটি একটি ব্যক্তিগত ডেন্টাল চেম্বার, কোনো ডায়াগনস্টিক সেন্টার নয়। চিকিৎসার প্রয়োজনে দাঁতের এক্স-রে (IOPAR/OPG) বা রক্ত পরীক্ষা করতে হলে বাইরে যেকোনো ডায়াগনস্টিক সেন্টার থেকে করে নিয়ে আসতে হবে।',
    regularTreatmentsHeader: 'সাধারণ চেম্বার চিকিৎসা (সকাল ও সন্ধ্যা)',
    specialTreatmentsHeader: 'স্পেশাল কেস (দুপুর ১২:০০ – বিকাল ৪:০০ • প্রতিদিন সর্বোচ্চ ২টি)',
    specialCaseExplainer:
      'রুট ক্যানেল ও ক্যাপ, আল্ট্রাসনিক স্কেলিং, ক্যাভিটি ফিলিং এবং ব্রেসেস—এই ৪টি "স্পেশাল কেস"-এর জন্য বিশেষ যত্ন ও দীর্ঘ সময়ের প্রয়োজন হয়। এগুলি শুধুমাত্র দুপুর ১২টা থেকে বিকাল ৪টার মধ্যে করা হয় (প্রতিদিন সর্বোচ্চ ২জন)। স্পেশাল কেস স্লট বুক করার আগে সাধারণ চেকআপের সময় ডাক্তারবাবুর সাথে খরচ ও চিকিৎসার বিষয়ে আলোচনা করে নেওয়া আবশ্যক।'
  }
};

// ==========================================
// 4. DATE, TIME & TOKEN HELPER FUNCTIONS
// ==========================================
const getLocalDateString = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatReadableDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const todayStr = getLocalDateString(0);
  const tomorrowStr = getLocalDateString(1);
  const formatted = dateObj.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  if (dateStr === todayStr) return `Today, ${formatted}`;
  if (dateStr === tomorrowStr) return `Tomorrow, ${formatted}`;
  return formatted;
};

// Format daily sequential token number as 001, 002, 003...
const formatTokenSerial = (num) => {
  const n = Number(num) || 1;
  return String(n).padStart(3, '0');
};

// Generate Morning (10:00 AM - 11:45 AM), Special (12:00 PM - 04:00 PM), & Evening (05:00 PM - 08:20 PM) slots
const generateChamberSlots = (durationMins = 20) => {
  const interval = Number(durationMins) || 20;
  const formatTime = (totalMinutes) => {
    const hours24 = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const period = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    return `${String(hours12).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${period}`;
  };

  // Morning Regular Chamber: 10:00 AM (600) to 11:45 AM (705)
  const morning = [];
  for (let t = 10 * 60; t <= 11 * 60 + 45; t += interval) {
    morning.push(formatTime(t));
  }

  // Off-Chamber Special Case Slots: 12:00 PM – 04:00 PM (2 dedicated extended slots per day)
  const special = [
    '12:00 PM – 02:00 PM (Special Slot 1)',
    '02:00 PM – 04:00 PM (Special Slot 2)'
  ];

  // Evening Regular Chamber: 05:00 PM (1020) to 08:15 PM (1215)
  const evening = [];
  for (let t = 17 * 60; t <= 20 * 60 + 15; t += interval) {
    evening.push(formatTime(t));
  }

  return {
    morning,
    special,
    evening,
    allRegular: [...morning, ...evening],
    all: [...morning, ...special, ...evening]
  };
};

// Build high-contrast QR image URL
const buildQrImageUrl = (dataString, size = 420) => {
  const safeData = dataString || 'https://wa.me/919436128490';
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=14&ecc=M&color=0f172a&bgcolor=ffffff&data=${encodeURIComponent(
    safeData
  )}`;
};

// Convert slot string to minutes from midnight for chronological sorting
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  // Handle range like "12:00 PM – 02:00 PM (Special Slot 1)"
  const firstTimeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!firstTimeMatch) return 0;
  let h = parseInt(firstTimeMatch[1], 10);
  const m = parseInt(firstTimeMatch[2], 10);
  const period = firstTimeMatch[3].toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h * 60 + m;
};

// Normalize block entry for a date
const getBlockInfoForDate = (blockedDatesMap, dateStr) => {
  const raw = blockedDatesMap?.[dateStr];
  if (!raw) return null;
  if (typeof raw === 'string') {
    return { scope: 'full', reason: raw };
  }
  return {
    scope: raw.scope || 'full', // 'full' | 'morning' | 'special' | 'evening'
    reason: raw.reason || 'Chamber Closed / Doctor Unavailable'
  };
};

const normalizeStatus = (st) => {
  if (st === 'In-Clinic') return 'Inside Chamber';
  if (st === 'Waiting') return 'Waiting Outside';
  return st || 'Confirmed';
};

// ==========================================
// 5. MAIN APPLICATION COMPONENT
// ==========================================
export default function App() {
  // Auth & Firestore State
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [clinicSettings, setClinicSettings] = useState(DEFAULT_CHAMBER_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Theme & Language State
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState('en'); // 'en' | 'bn'
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // View Mode ('patient' | 'admin') & Admin PIN Auth
  const [viewMode, setViewMode] = useState('patient');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Toast Notification State (Zero browser alerts!)
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast((prev) => (prev && Date.now() - prev.id >= 4000 ? null : prev));
    }, 4200);
  };

  // Patient Booking Modal State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingCategoryTab, setBookingCategoryTab] = useState('regular'); // 'regular' | 'special'
  const [selectedServiceId, setSelectedServiceId] = useState('general-consultation');
  const [selectedDate, setSelectedDate] = useState(getLocalDateString(0));
  const [selectedSessionTab, setSelectedSessionTab] = useState('Morning'); // 'Morning' | 'Evening' | 'Special'
  const [selectedSlot, setSelectedSlot] = useState('');
  const [specialCaseConsultConfirmed, setSpecialCaseConsultConfirmed] = useState(false);
  const [patientForm, setPatientForm] = useState({
    fullName: '',
    phone: '',
    age: '',
    symptoms: ''
  });
  const [formError, setFormError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Patient Lookup / Reschedule / Cancel State
  const [isLookupModalOpen, setIsLookupModalOpen] = useState(false);
  const [lookupQuery, setLookupQuery] = useState('');
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState(getLocalDateString(1));
  const [rescheduleSlot, setRescheduleSlot] = useState('');
  const [cancelConfirmId, setCancelConfirmId] = useState(null);

  // Scannable Booking QR Modal & Standee State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrMode, setQrMode] = useState('web'); // 'web' | 'whatsapp'
  const [qrCustomUrlInput, setQrCustomUrlInput] = useState('');
  const [isDownloadingQr, setIsDownloadingQr] = useState(false);

  // Doctor / Chamber Dashboard State
  const [adminTab, setAdminTab] = useState('daily'); // 'daily' | 'weekly' | 'services' | 'qr' | 'settings'
  const [adminSelectedDate, setAdminSelectedDate] = useState(getLocalDateString(0));
  const [adminSessionFilter, setAdminSessionFilter] = useState('All'); // 'All' | 'Morning' | 'Special' | 'Evening'
  const [adminStatusFilter, setAdminStatusFilter] = useState('All');
  const [adminSearch, setAdminSearch] = useState('');
  const [privacyMask, setPrivacyMask] = useState(false);
  const [revealedRows, setRevealedRows] = useState({});

  // Block Session / Day Modal State
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockScopeInput, setBlockScopeInput] = useState('full'); // 'full' | 'morning' | 'special' | 'evening'
  const [blockReasonInput, setBlockReasonInput] = useState('Personal Work / Chamber Closed');

  // Walk-In Modal State
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [walkInForm, setWalkInForm] = useState({
    patientName: '',
    phone: '',
    age: '',
    serviceId: 'general-consultation',
    timeSlot: '10:00 AM',
    symptoms: ''
  });

  // Editable Clinic Profile Form State
  const [settingsForm, setSettingsForm] = useState(DEFAULT_CHAMBER_SETTINGS);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Service Editor Modal / Form State (For Doctor to Edit Services & Prices)
  const [editingService, setEditingService] = useState(null); // null or service object
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  // ==========================================
  // 6. FIREBASE AUTH & REAL-TIME LISTENERS
  // ==========================================
  useEffect(() => {
    // Initialize default QR URL from current browser location
    if (typeof window !== 'undefined') {
      const base = window.location.origin + window.location.pathname;
      setQrCustomUrlInput(`${base}?book=1`);
      // Auto-open Booking Modal if patient scanned QR code with ?book=1
      const params = new URLSearchParams(window.location.search);
      if (params.get('book') === '1') {
        setIsBookingOpen(true);
        setBookingStep(1);
      }
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error('Authentication error:', err);
        setIsLoading(false);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const appointmentsRef = collection(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      APPOINTMENTS_COLLECTION
    );
    const settingsDocRef = doc(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      SETTINGS_COLLECTION,
      'config'
    );

    // 1. Listen to Live Appointments (NO fake/sample patients seeded!)
    const unsubAppointments = onSnapshot(
      appointmentsRef,
      (snapshot) => {
        const loaded = snapshot.docs.map((d) => {
          const raw = d.data();
          return {
            id: d.id,
            ...raw,
            status: normalizeStatus(raw.status)
          };
        });
        loaded.sort((a, b) => {
          if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
          const serialDiff = (Number(a.tokenSerial) || 0) - (Number(b.tokenSerial) || 0);
          if (serialDiff !== 0) return serialDiff;
          return timeToMinutes(a.timeSlot) - timeToMinutes(b.timeSlot);
        });
        setAppointments(loaded);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error listening to appointments:', error);
        setIsLoading(false);
      }
    );

    // 2. Listen to Chamber Settings & Services
    const unsubSettings = onSnapshot(
      settingsDocRef,
      async (docSnap) => {
        if (!docSnap.exists()) {
          try {
            await setDoc(settingsDocRef, DEFAULT_CHAMBER_SETTINGS);
          } catch (e) {
            console.error('Error initializing chamber settings:', e);
          }
        } else {
          const data = docSnap.data();
          const merged = {
            ...DEFAULT_CHAMBER_SETTINGS,
            ...data,
            services:
              Array.isArray(data.services) && data.services.length > 0
                ? data.services
                : DEFAULT_SERVICES
          };
          setClinicSettings(merged);
          setSettingsForm(merged);
          if (merged.customBookingUrl && merged.customBookingUrl.trim()) {
            setQrCustomUrlInput(merged.customBookingUrl.trim());
          }
        }
      },
      (error) => {
        console.error('Error listening to chamber settings:', error);
      }
    );

    return () => {
      unsubAppointments();
      unsubSettings();
    };
  }, [user]);

  // ==========================================
  // 7. DERIVED DATA, SERVICES & SLOT LOCKING
  // ==========================================
  const todayStr = getLocalDateString(0);

  // Compute live QR target link based on selected mode ('web' or 'whatsapp')
  const activeQrTargetUrl = useMemo(() => {
    if (qrMode === 'whatsapp') {
      const cleanWa = (clinicSettings.whatsapp || '919436128490').replace(/\D/g, '');
      const prefillText = `Namaskar ${clinicSettings.doctorName}, I scanned the Chamber QR Code and would like to book a dental appointment.\n\n• Patient Name: \n• Age: \n• Preferred Session (Morning 10-12 / Evening 5-8:30 / Special Case 12-4): \n• Dental Problem: `;
      return `https://wa.me/${cleanWa}?text=${encodeURIComponent(prefillText)}`;
    }
    const baseInput =
      qrCustomUrlInput.trim() ||
      (typeof window !== 'undefined'
        ? `${window.location.origin}${window.location.pathname}?book=1`
        : 'https://dr-banik-dental-chamber.web.app/?book=1');
    if (baseInput.includes('?book=1') || baseInput.includes('&book=1')) {
      return baseInput;
    }
    return baseInput.includes('?') ? `${baseInput}&book=1` : `${baseInput}?book=1`;
  }, [qrMode, qrCustomUrlInput, clinicSettings.whatsapp, clinicSettings.doctorName]);

  // Download High-Res Branded Clinic QR Standee Poster as PNG
  const handleDownloadQrStandeePng = async () => {
    setIsDownloadingQr(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1700;
      const ctx = canvas.getContext('2d');

      // 1. Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Outer border
      ctx.strokeStyle = '#0d9488';
      ctx.lineWidth = 16;
      ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

      // 2. Top Header Banner
      const grad = ctx.createLinearGradient(0, 0, canvas.width, 280);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#115e59');
      ctx.fillStyle = grad;
      ctx.fillRect(40, 40, canvas.width - 80, 250);

      ctx.fillStyle = '#5eead4';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SCAN QR CODE FOR INSTANT APPOINTMENT BOOKING', canvas.width / 2, 105);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'extrabold 52px sans-serif';
      ctx.fillText(clinicSettings.doctorName, canvas.width / 2, 175);

      ctx.fillStyle = '#ccfbf1';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(
        `${clinicSettings.degree} • ${clinicSettings.experience}`,
        canvas.width / 2,
        225
      );

      ctx.fillStyle = '#99f6e4';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(clinicSettings.clinicName, canvas.width / 2, 265);

      // 3. Bilingual Scan Callout
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 38px sans-serif';
      ctx.fillText('Scan with Phone Camera, Google Lens or WhatsApp', canvas.width / 2, 360);

      ctx.fillStyle = '#0f766e';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText(
        'অ্যাপয়েন্টমেন্ট টোকেন (#001+) বুক করতে নিচের QR কোডটি স্ক্যান করুন',
        canvas.width / 2,
        412
      );

      // 4. QR Box Frame
      const qrBoxSize = 620;
      const qrBoxX = (canvas.width - qrBoxSize) / 2;
      const qrBoxY = 450;

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);
      ctx.strokeStyle = '#0d9488';
      ctx.lineWidth = 6;
      ctx.strokeRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);

      // Fetch QR image and draw onto canvas
      const qrUrl = buildQrImageUrl(activeQrTargetUrl, 560);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = qrUrl;
      });
      ctx.drawImage(img, qrBoxX + 30, qrBoxY + 30, 560, 560);

      // 5. Mode Badge under QR
      ctx.fillStyle = qrMode === 'whatsapp' ? '#059669' : '#0f766e';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(
        qrMode === 'whatsapp'
          ? 'WhatsApp Instant Booking QR • Direct Chamber Desk'
          : 'Online Live Slot & Daily Token (#001, #002...) Booking QR',
        canvas.width / 2,
        1125
      );

      // 6. Chamber Timings Box
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(80, 1165, canvas.width - 160, 260);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.strokeRect(80, 1165, canvas.width - 160, 260);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('DAILY CHAMBER SCHEDULE (সোমবার – শনিবার)', canvas.width / 2, 1215);

      ctx.font = 'bold 26px sans-serif';
      ctx.fillStyle = '#0f766e';
      ctx.fillText(
        `• Morning Chamber: ${clinicSettings.morningHoursLabel}   |   • Evening Chamber: ${clinicSettings.eveningHoursLabel}`,
        canvas.width / 2,
        1275
      );

      ctx.fillStyle = '#6b21a8';
      ctx.fillText(
        '• Special Cases (RCT & Cap, Scaling, Fillings, Braces): 12:00 PM – 04:00 PM (Max 2/Day)',
        canvas.width / 2,
        1330
      );

      ctx.fillStyle = '#334155';
      ctx.font = 'bold 25px sans-serif';
      ctx.fillText(
        `Chamber Phone / WhatsApp: ${clinicSettings.phone}`,
        canvas.width / 2,
        1390
      );

      // 7. Footer Address
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 25px sans-serif';
      ctx.fillText('CHAMBER LOCATION:', canvas.width / 2, 1485);

      ctx.fillStyle = '#334155';
      ctx.font = 'bold 23px sans-serif';
      ctx.fillText(
        'A.A Road, Beside Tropical Orthopaedics & Related Research Centre',
        canvas.width / 2,
        1530
      );
      ctx.fillText(
        '(Near Mathchowmahani Bazar), Agartala, Tripura – 799007',
        canvas.width / 2,
        1570
      );

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Dr-Debashish-Banik-Dental-Booking-QR-${qrMode}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Downloaded High-Res Clinic Booking QR Standee (PNG)!');
    } catch (err) {
      console.error('Canvas QR download fallback:', err);
      window.open(buildQrImageUrl(activeQrTargetUrl, 600), '_blank', 'noopener,noreferrer');
      showToast('Opened high-res QR image in a new tab for saving.');
    } finally {
      setIsDownloadingQr(false);
    }
  };

  const handleCopyBookingLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(activeQrTargetUrl);
      showToast('Booking QR link copied to clipboard!');
    }
  };

  // Active services configured by the Doctor
  const allServices = useMemo(() => {
    return Array.isArray(clinicSettings.services) && clinicSettings.services.length > 0
      ? clinicSettings.services
      : DEFAULT_SERVICES;
  }, [clinicSettings.services]);

  const activeRegularServices = useMemo(
    () => allServices.filter((s) => s.active !== false && s.category !== 'special'),
    [allServices]
  );

  const activeSpecialServices = useMemo(
    () => allServices.filter((s) => s.active !== false && s.category === 'special'),
    [allServices]
  );

  const selectedServiceObj = useMemo(
    () => allServices.find((s) => s.id === selectedServiceId) || allServices[0],
    [allServices, selectedServiceId]
  );

  const isSelectedServiceSpecial = selectedServiceObj?.category === 'special';

  // Next 14 days for date pickers
  const next14Days = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const dateStr = getLocalDateString(i);
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const isSunday = dateObj.getDay() === 0;
      const blockInfo = getBlockInfoForDate(clinicSettings.blockedDates, dateStr);
      return {
        dateStr,
        dayName:
          i === 0
            ? 'Today'
            : i === 1
            ? 'Tomorrow'
            : dateObj.toLocaleDateString('en-IN', { weekday: 'short' }),
        dayNum: d,
        monthShort: dateObj.toLocaleDateString('en-IN', { month: 'short' }),
        isSunday,
        blockInfo,
        isFullBlocked: blockInfo?.scope === 'full'
      };
    });
  }, [clinicSettings.blockedDates]);

  // Configured slots for Morning, Special (12-4 PM), and Evening
  const configuredSlots = useMemo(() => {
    return generateChamberSlots(clinicSettings.slotDuration || 20);
  }, [clinicSettings.slotDuration]);

  // Check if a specific session ('Morning' | 'Special' | 'Evening') is blocked on a date
  const isSessionBlockedOnDate = (dateStr, sessionName) => {
    const info = getBlockInfoForDate(clinicSettings.blockedDates, dateStr);
    if (!info) return false;
    if (info.scope === 'full') return true;
    if (info.scope === 'morning' && sessionName === 'Morning') return true;
    if (info.scope === 'special' && sessionName === 'Special') return true;
    if (info.scope === 'evening' && sessionName === 'Evening') return true;
    return false;
  };

  // Count how many active Special Cases are booked on a given date
  const getActiveSpecialCaseCountForDate = (dateStr, excludeDocId = null) => {
    return appointments.filter(
      (a) =>
        a.date === dateStr &&
        a.status !== 'Cancelled' &&
        (a.session === 'Special' || a.isSpecialCase) &&
        a.id !== excludeDocId
    ).length;
  };

  // Booked time slots Set for a given date (excludes 'Cancelled')
  const getBookedSlotsForDate = (dateStr, excludeDocId = null) => {
    const taken = new Set();
    appointments.forEach((appt) => {
      if (
        appt.date === dateStr &&
        appt.status !== 'Cancelled' &&
        appt.id !== excludeDocId
      ) {
        taken.add(appt.timeSlot);
      }
    });
    return taken;
  };

  // Calculate next sequential daily token (001, 002, 003...) for a given date
  const getNextDailyTokenForDate = (dateStr) => {
    const dayAppointments = appointments.filter((a) => a.date === dateStr);
    if (dayAppointments.length === 0) {
      return { tokenSerial: 1, tokenId: '001' };
    }
    const maxSerial = dayAppointments.reduce((maxVal, a) => {
      const parsed =
        Number(a.tokenSerial) ||
        parseInt(String(a.tokenId || '').replace(/\D/g, ''), 10) ||
        0;
      return parsed > maxVal ? parsed : maxVal;
    }, 0);
    const nextSerial = maxSerial + 1;
    return {
      tokenSerial: nextSerial,
      tokenId: formatTokenSerial(nextSerial)
    };
  };

  // Live Today's Chamber Queue Statistics
  const todayStats = useMemo(() => {
    const todayAppts = appointments.filter((a) => a.date === todayStr);
    const activeAppts = todayAppts.filter((a) => a.status !== 'Cancelled');
    const insideChamber = todayAppts.find((a) => a.status === 'Inside Chamber');
    const waitingList = todayAppts.filter((a) => a.status === 'Waiting Outside');
    const confirmedList = todayAppts.filter((a) => a.status === 'Confirmed');
    const completedList = todayAppts.filter((a) => a.status === 'Completed');
    const nextTokenInfo = getNextDailyTokenForDate(todayStr);

    return {
      total: activeAppts.length,
      morningCount: activeAppts.filter((a) => a.session === 'Morning').length,
      specialCount: activeAppts.filter((a) => a.session === 'Special').length,
      eveningCount: activeAppts.filter((a) => a.session === 'Evening').length,
      insideChamber,
      waitingCount: waitingList.length,
      nextWaiting: waitingList[0] || confirmedList[0] || null,
      completedCount: completedList.length,
      cancelledCount: todayAppts.filter((a) => a.status === 'Cancelled').length,
      nextAvailableTokenToday: nextTokenInfo.tokenId
    };
  }, [appointments, todayStr]);

  // Patient Lookup Matching (by 10-digit Phone, Token 001/002, or Name)
  const matchedLookupAppointments = useMemo(() => {
    const q = lookupQuery.trim().toLowerCase();
    if (!q) return [];
    const digitsOnly = q.replace(/\D/g, '');
    return appointments.filter((a) => {
      const tokenStr = String(a.tokenId || '').toLowerCase();
      const tokenMatch = tokenStr === q || tokenStr === q.replace('#', '');
      const phoneClean = (a.phone || '').replace(/\D/g, '');
      const phoneMatch = digitsOnly.length >= 4 && phoneClean.includes(digitsOnly);
      const nameMatch = q.length >= 3 && (a.patientName || '').toLowerCase().includes(q);
      return tokenMatch || phoneMatch || nameMatch;
    });
  }, [appointments, lookupQuery]);

  // Privacy Mask Helpers
  const formatMaskedPhone = (phone, rowId) => {
    if (!phone) return '';
    const clean = phone.replace(/\D/g, '');
    if (!privacyMask || revealedRows[rowId]) {
      return `+91 ${clean.slice(-10, -5)} ${clean.slice(-5)}`;
    }
    if (clean.length >= 10) {
      return `+91 ${clean.slice(0, 2)}XXX-XX${clean.slice(-3)}`;
    }
    return '+91 XXXXX-XXXXX';
  };

  const formatMaskedNotes = (note, rowId) => {
    if (!note) return 'No specific symptom notes added.';
    if (!privacyMask || revealedRows[rowId]) return note;
    return '•••••••••••••••••••••••••••• (Protected Patient Note)';
  };

  const toggleRevealRow = (rowId) => {
    setRevealedRows((prev) => ({ ...prev, [rowId]: !prev[rowId] }));
  };

  // Doctor Access Handler (Secure PIN — No public PIN hint!)
  const handleDoctorAccessClick = () => {
    if (viewMode === 'admin') {
      setViewMode('patient');
      return;
    }
    if (isAdminAuthenticated) {
      setViewMode('admin');
    } else {
      setPinInput('');
      setPinError('');
      setIsPinModalOpen(true);
    }
  };

  const handleVerifyPin = (e) => {
    e.preventDefault();
    const expectedPin = String(clinicSettings.adminPin || '1982').trim();
    if (pinInput.trim() === expectedPin) {
      setIsAdminAuthenticated(true);
      setIsPinModalOpen(false);
      setViewMode('admin');
      showToast(`Welcome, ${clinicSettings.doctorName}!`);
    } else {
      setPinError('Incorrect Chamber PIN. Access restricted to Dr. Debashish Banik.');
    }
  };

  // ==========================================
  // 8. PATIENT BOOKING & CONFLICT PREVENTION
  // ==========================================
  const openBookingWithService = (serviceId = 'general-consultation') => {
    const targetService =
      allServices.find((s) => s.id === serviceId) || activeRegularServices[0] || allServices[0];
    setSelectedServiceId(targetService.id);
    const isSpec = targetService.category === 'special';
    setBookingCategoryTab(isSpec ? 'special' : 'regular');

    const firstOpenDay = next14Days.find((d) => !d.isFullBlocked) || next14Days[0];
    setSelectedDate(firstOpenDay.dateStr);

    if (isSpec) {
      setSelectedSessionTab('Special');
    } else if (
      isSessionBlockedOnDate(firstOpenDay.dateStr, 'Morning') &&
      !isSessionBlockedOnDate(firstOpenDay.dateStr, 'Evening')
    ) {
      setSelectedSessionTab('Evening');
    } else {
      setSelectedSessionTab('Morning');
    }

    setSelectedSlot('');
    setSpecialCaseConsultConfirmed(false);
    setFormError('');
    setConfirmedBooking(null);
    setBookingStep(1);
    setIsBookingOpen(true);
  };

  const handleSelectServiceInModal = (serviceObj) => {
    setSelectedServiceId(serviceObj.id);
    const isSpec = serviceObj.category === 'special';
    if (isSpec) {
      setSelectedSessionTab('Special');
    } else if (selectedSessionTab === 'Special') {
      setSelectedSessionTab('Morning');
    }
    setSelectedSlot('');
    setFormError('');
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    setFormError('');

    const cleanName = patientForm.fullName.trim();
    const cleanPhone = patientForm.phone.replace(/\D/g, '').slice(-10);
    const cleanAge = patientForm.age.trim();

    if (!cleanName) {
      setFormError('Please enter the patient’s full name.');
      return;
    }
    if (cleanPhone.length !== 10) {
      setFormError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!cleanAge || isNaN(Number(cleanAge)) || Number(cleanAge) < 1 || Number(cleanAge) > 120) {
      setFormError('Please enter a valid patient age (1–120 years).');
      return;
    }
    if (!selectedSlot) {
      setFormError('Please select an available time slot.');
      return;
    }

    const serviceObj = selectedServiceObj;
    const isSpec = serviceObj.category === 'special';
    const sessionType = isSpec
      ? 'Special'
      : configuredSlots.morning.includes(selectedSlot)
      ? 'Morning'
      : 'Evening';

    if (isSpec && !specialCaseConsultConfirmed) {
      setFormError(
        'For Special Cases (12 PM – 4 PM), please confirm that you have discussed or will discuss the treatment plan & price with Dr. Banik.'
      );
      return;
    }

    // 1. Check if session or day is blocked
    if (isSessionBlockedOnDate(selectedDate, sessionType)) {
      setFormError(
        `The ${sessionType} session on ${formatReadableDate(
          selectedDate
        )} is closed. Please choose another session or date.`
      );
      return;
    }

    // 2. Enforce Special Case Daily Cap (Max 2 Special Cases per day)
    const maxSpecialCap = Number(clinicSettings.maxSpecialCasesPerDay) || 2;
    if (isSpec) {
      const currentSpecialCount = getActiveSpecialCaseCountForDate(selectedDate);
      if (currentSpecialCount >= maxSpecialCap) {
        setFormError(
          `Maximum ${maxSpecialCap} Special Cases are already booked for ${formatReadableDate(
            selectedDate
          )}. Please select another date.`
        );
        return;
      }
    }

    // 3. STRICT PER-SESSION MOBILE NUMBER DUPLICATE PREVENTION
    // One mobile number cannot book more than once in Morning, once in Evening, or once in Special on the same date,
    // UNLESS their previous booking in that session was Cancelled!
    const existingSameSessionBooking = appointments.find((appt) => {
      const apptPhone = (appt.phone || '').replace(/\D/g, '').slice(-10);
      return (
        appt.date === selectedDate &&
        appt.session === sessionType &&
        appt.status !== 'Cancelled' &&
        apptPhone === cleanPhone
      );
    });

    if (existingSameSessionBooking) {
      setFormError(
        `Mobile number +91 ${cleanPhone} already has an active ${sessionType} booking (Token #${existingSameSessionBooking.tokenId} at ${existingSameSessionBooking.timeSlot}) on ${formatReadableDate(
          selectedDate
        )}. A mobile number can only hold 1 active booking per session. To book a new slot in this session, please cancel or reschedule Token #${existingSameSessionBooking.tokenId} first.`
      );
      return;
    }

    // 4. Real-time Slot Double-Booking Guard
    const currentTakenSlots = getBookedSlotsForDate(selectedDate);
    if (currentTakenSlots.has(selectedSlot)) {
      setFormError(
        'This time slot was just booked by another patient. Please pick another available slot.'
      );
      setSelectedSlot('');
      return;
    }

    setIsSubmittingBooking(true);
    try {
      // 5. Generate Sequential Daily Token starting from 001 for the selected date
      const { tokenSerial, tokenId } = getNextDailyTokenForDate(selectedDate);
      const uniqueDocId = `${selectedDate}_T${tokenId}_${Date.now().toString().slice(-4)}`;

      const newBooking = {
        id: uniqueDocId,
        tokenId, // "001", "002", "003"...
        tokenSerial, // 1, 2, 3...
        patientName: cleanName,
        phone: cleanPhone,
        age: cleanAge,
        serviceId: serviceObj.id,
        serviceName: serviceObj.name,
        serviceCategory: serviceObj.category,
        serviceFee: serviceObj.fee,
        isSpecialCase: isSpec,
        date: selectedDate,
        timeSlot: selectedSlot,
        session: sessionType, // 'Morning' | 'Special' | 'Evening'
        symptoms:
          patientForm.symptoms.trim() ||
          (isSpec ? 'Special Case Sitting (12 PM – 4 PM)' : 'Chamber consultation'),
        status: 'Confirmed',
        reminder24hSent: false,
        reminder2hSent: false,
        createdAt: Date.now()
      };

      if (user) {
        const docRef = doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          APPOINTMENTS_COLLECTION,
          uniqueDocId
        );
        await setDoc(docRef, newBooking);
      } else {
        setAppointments((prev) => [...prev, newBooking]);
      }

      setConfirmedBooking(newBooking);
      setBookingStep(4);
      showToast(`Confirmed! Your Daily Chamber Token is #${tokenId}`);
    } catch (err) {
      console.error('Booking failed:', err);
      setFormError('Could not complete booking. Please check your connection and try again.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Reschedule existing appointment
  const handleConfirmReschedule = async () => {
    if (!rescheduleTarget || !rescheduleDate || !rescheduleSlot) return;

    const targetDocId = rescheduleTarget.id;
    const isSpec =
      rescheduleTarget.isSpecialCase || rescheduleTarget.serviceCategory === 'special';
    const nextSession = isSpec
      ? 'Special'
      : configuredSlots.morning.includes(rescheduleSlot)
      ? 'Morning'
      : 'Evening';

    // Check slot lock
    const taken = getBookedSlotsForDate(rescheduleDate, targetDocId);
    if (taken.has(rescheduleSlot)) {
      showToast('That time slot is already booked. Please choose another slot.', 'error');
      return;
    }

    // Check Special Case max 2 per day cap if rescheduling to a new date
    if (isSpec) {
      const specialCount = getActiveSpecialCaseCountForDate(rescheduleDate, targetDocId);
      const maxCap = Number(clinicSettings.maxSpecialCasesPerDay) || 2;
      if (specialCount >= maxCap) {
        showToast(
          `Maximum ${maxCap} Special Cases are already booked on ${formatReadableDate(
            rescheduleDate
          )}.`,
          'error'
        );
        return;
      }
    }

    // Check per-session duplicate mobile rule on the target date/session
    const cleanPhone = (rescheduleTarget.phone || '').replace(/\D/g, '').slice(-10);
    const conflict = appointments.find((a) => {
      const aPhone = (a.phone || '').replace(/\D/g, '').slice(-10);
      return (
        a.id !== targetDocId &&
        a.date === rescheduleDate &&
        a.session === nextSession &&
        a.status !== 'Cancelled' &&
        aPhone === cleanPhone
      );
    });

    if (conflict) {
      showToast(
        `This mobile number already has an active ${nextSession} booking (Token #${conflict.tokenId}) on ${formatReadableDate(
          rescheduleDate
        )}.`,
        'error'
      );
      return;
    }

    try {
      // If date changed, assign the next sequential daily token on that new date
      let updatedTokenFields = {};
      if (rescheduleDate !== rescheduleTarget.date) {
        const nextTok = getNextDailyTokenForDate(rescheduleDate);
        updatedTokenFields = {
          tokenId: nextTok.tokenId,
          tokenSerial: nextTok.tokenSerial
        };
      }

      if (user) {
        const docRef = doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          APPOINTMENTS_COLLECTION,
          targetDocId
        );
        await updateDoc(docRef, {
          date: rescheduleDate,
          timeSlot: rescheduleSlot,
          session: nextSession,
          status: 'Confirmed',
          ...updatedTokenFields
        });
      }
      showToast(
        `Booking rescheduled to ${formatReadableDate(rescheduleDate)} at ${rescheduleSlot}${
          updatedTokenFields.tokenId ? ` (New Token #${updatedTokenFields.tokenId})` : ''
        }`
      );
      setRescheduleTarget(null);
      setRescheduleSlot('');
    } catch (err) {
      console.error('Error rescheduling:', err);
      showToast('Could not reschedule appointment.', 'error');
    }
  };

  // Cancel appointment (releases slot AND allows the mobile number to book again in that session)
  const handleCancelAppointment = async (appt) => {
    try {
      const targetDocId = appt.id;
      if (user) {
        const docRef = doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          APPOINTMENTS_COLLECTION,
          targetDocId
        );
        await updateDoc(docRef, { status: 'Cancelled' });
      }
      setCancelConfirmId(null);
      showToast(
        `Token #${appt.tokenId} cancelled. Slot released — you may book a new slot anytime.`
      );
    } catch (err) {
      console.error('Error cancelling:', err);
      showToast('Failed to cancel appointment.', 'error');
    }
  };

  // ==========================================
  // 9. DOCTOR / CHAMBER DASHBOARD ACTIONS
  // ==========================================
  const handleUpdateStatus = async (appt, newStatus) => {
    try {
      const targetDocId = appt.id;
      if (user) {
        const docRef = doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          APPOINTMENTS_COLLECTION,
          targetDocId
        );
        await updateDoc(docRef, { status: newStatus });
      }
      showToast(`Token #${appt.tokenId} (${appt.patientName}) marked as "${newStatus}"`);
    } catch (err) {
      console.error('Status update error:', err);
      showToast('Could not update status.', 'error');
    }
  };

  const handleUpdateSlotDuration = async (minutes) => {
    try {
      const settingsRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        SETTINGS_COLLECTION,
        'config'
      );
      if (user) {
        await setDoc(settingsRef, { ...clinicSettings, slotDuration: minutes }, { merge: true });
      } else {
        setClinicSettings((prev) => ({ ...prev, slotDuration: minutes }));
      }
      showToast(`Regular chamber slot interval set to ${minutes} minutes.`);
    } catch (err) {
      console.error('Slot duration error:', err);
    }
  };

  const handleSaveBlockDate = async (
    dateStr,
    scope = 'full',
    reasonText = 'Personal Work / Chamber Closed'
  ) => {
    try {
      const currentBlocks = { ...(clinicSettings.blockedDates || {}) };
      if (!scope || scope === 'unblock') {
        delete currentBlocks[dateStr];
      } else {
        currentBlocks[dateStr] = {
          scope, // 'full' | 'morning' | 'special' | 'evening'
          reason: reasonText.trim() || 'Chamber Closed / Doctor Unavailable'
        };
      }

      const settingsRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        SETTINGS_COLLECTION,
        'config'
      );
      if (user) {
        await setDoc(
          settingsRef,
          { ...clinicSettings, blockedDates: currentBlocks },
          { merge: true }
        );
      } else {
        setClinicSettings((prev) => ({ ...prev, blockedDates: currentBlocks }));
      }

      setIsBlockModalOpen(false);
      if (!scope || scope === 'unblock') {
        showToast(`${formatReadableDate(dateStr)} is now OPEN for patient bookings.`);
      } else {
        const label =
          scope === 'full'
            ? 'Full Day'
            : scope === 'morning'
            ? 'Morning Session'
            : scope === 'special'
            ? 'Special Cases (12–4 PM)'
            : 'Evening Session';
        showToast(`${formatReadableDate(dateStr)} (${label}) marked unavailable.`);
      }
    } catch (err) {
      console.error('Block date error:', err);
    }
  };

  // Send direct WhatsApp message to patient via wa.me
  const handleSendWhatsAppToPatient = async (appt) => {
    try {
      const targetDocId = appt.id;
      if (user) {
        const docRef = doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          APPOINTMENTS_COLLECTION,
          targetDocId
        );
        await updateDoc(docRef, { reminder24hSent: true, reminder2hSent: true });
      }
      const cleanPhone = (appt.phone || '').replace(/\D/g, '').slice(-10);
      const msg = `Namaskar ${appt.patientName}, this is a confirmation from *${clinicSettings.clinicName}* (${clinicSettings.doctorName}).\n\n*Daily Token No:* #${appt.tokenId}\n*Treatment:* ${appt.serviceName}\n*Date:* ${formatReadableDate(appt.date)}\n*Time:* ${appt.timeSlot} (${appt.session} Session)\n*Chamber Location:* ${clinicSettings.address}\n\nPlease bring any previous prescriptions or outside X-rays if applicable.`;
      window.open(
        `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`,
        '_blank',
        'noopener,noreferrer'
      );
      showToast(`Opened WhatsApp message for ${appt.patientName} (Token #${appt.tokenId})`);
    } catch (err) {
      console.error('WhatsApp reminder error:', err);
    }
  };

  // Save Editable Clinic Profile Settings to Firestore
  const handleSaveClinicProfile = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const settingsRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        SETTINGS_COLLECTION,
        'config'
      );
      const updated = {
        ...clinicSettings,
        ...settingsForm
      };
      if (user) {
        await setDoc(settingsRef, updated, { merge: true });
      } else {
        setClinicSettings(updated);
      }
      showToast('Chamber address, timings, PIN & settings saved live!');
    } catch (err) {
      console.error('Error saving clinic profile:', err);
      showToast('Could not save settings.', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Doctor Service & Price Editor Handlers
  const handleOpenAddService = (defaultCat = 'regular') => {
    setEditingService({
      id: `service-${Date.now()}`,
      name: '',
      nameBn: '',
      shortName: '',
      category: defaultCat,
      duration: defaultCat === 'special' ? '60 mins' : '20 mins',
      fee: defaultCat === 'special' ? 'Discussed during checkup' : '₹300',
      badge: defaultCat === 'special' ? 'Special Case (12–4 PM)' : 'Chamber Care',
      description: '',
      active: true,
      isNew: true
    });
    setIsServiceModalOpen(true);
  };

  const handleOpenEditService = (serviceObj) => {
    setEditingService({ ...serviceObj, isNew: false });
    setIsServiceModalOpen(true);
  };

  const handleSaveServiceItem = async (e) => {
    e.preventDefault();
    if (!editingService || !editingService.name.trim()) return;

    const cleanedService = {
      id: editingService.id,
      name: editingService.name.trim(),
      nameBn: editingService.nameBn?.trim() || editingService.name.trim(),
      shortName: editingService.shortName?.trim() || editingService.name.trim().slice(0, 22),
      category: editingService.category === 'special' ? 'special' : 'regular',
      duration: editingService.duration.trim() || '20 mins',
      fee:
        editingService.fee.trim() ||
        (editingService.category === 'special' ? 'Discussed during checkup' : '₹300'),
      badge:
        editingService.badge?.trim() ||
        (editingService.category === 'special' ? 'Special Case (12–4 PM)' : 'Chamber Care'),
      description: editingService.description.trim() || 'Personal dental treatment by Dr. Banik.',
      active: editingService.active !== false
    };

    const existingList = [...allServices];
    const idx = existingList.findIndex((s) => s.id === cleanedService.id);
    if (idx >= 0) {
      existingList[idx] = cleanedService;
    } else {
      existingList.push(cleanedService);
    }

    try {
      const settingsRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        SETTINGS_COLLECTION,
        'config'
      );
      if (user) {
        await setDoc(settingsRef, { ...clinicSettings, services: existingList }, { merge: true });
      } else {
        setClinicSettings((prev) => ({ ...prev, services: existingList }));
      }
      setIsServiceModalOpen(false);
      setEditingService(null);
      showToast(`Saved "${cleanedService.name}" (${cleanedService.fee})!`);
    } catch (err) {
      console.error('Error saving service:', err);
      showToast('Failed to save service changes.', 'error');
    }
  };

  const handleDeleteServiceItem = async (serviceId) => {
    const updatedList = allServices.filter((s) => s.id !== serviceId);
    try {
      const settingsRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        SETTINGS_COLLECTION,
        'config'
      );
      if (user) {
        await setDoc(settingsRef, { ...clinicSettings, services: updatedList }, { merge: true });
      } else {
        setClinicSettings((prev) => ({ ...prev, services: updatedList }));
      }
      showToast('Service removed from list.');
    } catch (err) {
      console.error('Delete service error:', err);
    }
  };

  const handleResetDefaultServices = async () => {
    try {
      const settingsRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        SETTINGS_COLLECTION,
        'config'
      );
      if (user) {
        await setDoc(
          settingsRef,
          { ...clinicSettings, services: DEFAULT_SERVICES },
          { merge: true }
        );
      } else {
        setClinicSettings((prev) => ({ ...prev, services: DEFAULT_SERVICES }));
      }
      showToast('Restored default Regular & Special Case services.');
    } catch (err) {
      console.error('Reset services error:', err);
    }
  };

  // Add Walk-In Patient from Doctor Dashboard
  const handleAddWalkIn = async (e) => {
    e.preventDefault();
    const cleanPhone = walkInForm.phone.replace(/\D/g, '').slice(-10);
    if (!walkInForm.patientName.trim() || cleanPhone.length !== 10) {
      showToast('Please enter patient name and valid 10-digit mobile number.', 'error');
      return;
    }

    try {
      const serviceObj =
        allServices.find((s) => s.id === walkInForm.serviceId) || allServices[0];
      const isSpec = serviceObj.category === 'special';
      const sessionType = isSpec
        ? 'Special'
        : configuredSlots.morning.includes(walkInForm.timeSlot)
        ? 'Morning'
        : 'Evening';

      const { tokenSerial, tokenId } = getNextDailyTokenForDate(adminSelectedDate);
      const uniqueDocId = `${adminSelectedDate}_T${tokenId}_${Date.now().toString().slice(-4)}`;

      const newWalkIn = {
        id: uniqueDocId,
        tokenId,
        tokenSerial,
        patientName: walkInForm.patientName.trim(),
        phone: cleanPhone,
        age: walkInForm.age || '35',
        serviceId: serviceObj.id,
        serviceName: serviceObj.name,
        serviceCategory: serviceObj.category,
        serviceFee: serviceObj.fee,
        isSpecialCase: isSpec,
        date: adminSelectedDate,
        timeSlot: walkInForm.timeSlot,
        session: sessionType,
        symptoms: walkInForm.symptoms.trim() || 'Walk-in chamber patient',
        status: 'Waiting Outside',
        reminder24hSent: true,
        reminder2hSent: true,
        createdAt: Date.now()
      };

      if (user) {
        const docRef = doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          APPOINTMENTS_COLLECTION,
          uniqueDocId
        );
        await setDoc(docRef, newWalkIn);
      }
      setIsWalkInModalOpen(false);
      setWalkInForm({
        patientName: '',
        phone: '',
        age: '',
        serviceId: 'general-consultation',
        timeSlot: configuredSlots.morning[0] || '10:00 AM',
        symptoms: ''
      });
      showToast(`Walk-in patient ${newWalkIn.patientName} added with Token #${tokenId}`);
    } catch (err) {
      console.error('Walk-in error:', err);
    }
  };

  // Filtered appointments for Admin Daily Queue
  const filteredAdminDailyAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      if (appt.date !== adminSelectedDate) return false;
      if (adminSessionFilter !== 'All' && appt.session !== adminSessionFilter) return false;
      if (adminStatusFilter !== 'All' && appt.status !== adminStatusFilter) return false;
      if (adminSearch.trim()) {
        const q = adminSearch.toLowerCase();
        const matchName = (appt.patientName || '').toLowerCase().includes(q);
        const matchToken = String(appt.tokenId || '').toLowerCase().includes(q);
        const matchPhone = (appt.phone || '').includes(q);
        return matchName || matchToken || matchPhone;
      }
      return true;
    });
  }, [appointments, adminSelectedDate, adminSessionFilter, adminStatusFilter, adminSearch]);

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Inside Chamber':
        return 'bg-teal-600 text-white border-teal-600 shadow-sm';
      case 'Waiting Outside':
        return 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700';
      case 'Confirmed':
        return 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/80 dark:text-sky-200 dark:border-sky-700';
      case 'Completed':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-200 line-through dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const todayBlockInfo = getBlockInfoForDate(clinicSettings.blockedDates, todayStr);
  const selectedAdminDateBlockInfo = getBlockInfoForDate(
    clinicSettings.blockedDates,
    adminSelectedDate
  );

  // ==========================================
  // 10. RENDER PRODUCTION UI (LIGHT & DARK)
  // ==========================================
  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-teal-600 selection:text-white transition-colors duration-200">
        {/* FLOATING TOAST NOTIFICATION */}
        {toast && (
          <div className="fixed bottom-5 right-5 z-50 max-w-md bg-slate-900 dark:bg-slate-800 text-white px-5 py-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3">
            {toast.type === 'error' ? (
              <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-teal-400 shrink-0" />
            )}
            <p className="text-sm md:text-base font-medium leading-snug">{toast.message}</p>
            <button
              onClick={() => setToast(null)}
              className="ml-auto text-slate-400 hover:text-white p-1"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TOP LIVE CHAMBER STATUS BAR */}
        <div className="bg-slate-900 dark:bg-black text-slate-100 text-xs sm:text-sm py-2.5 px-4 border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <span className="inline-flex items-center gap-2 font-semibold text-teal-300">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping" />
                {todayBlockInfo
                  ? `Chamber Notice Today (${todayBlockInfo.scope.toUpperCase()}): ${todayBlockInfo.reason}`
                  : `Chamber Open Today • Morning (${clinicSettings.morningHoursLabel}) & Evening (${clinicSettings.eveningHoursLabel})`}
              </span>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              {todayStats.insideChamber && (
                <span className="bg-teal-950 text-teal-300 border border-teal-700 px-3 py-0.5 rounded-full text-xs font-bold">
                  Now Inside Chamber: Token #{todayStats.insideChamber.tokenId}
                </span>
              )}
              <a
                href={`tel:${clinicSettings.phone}`}
                className="inline-flex items-center gap-1.5 text-white hover:text-teal-300 font-semibold"
              >
                <PhoneCall className="w-3.5 h-3.5 text-teal-400" />
                <span>{clinicSettings.phone}</span>
              </a>
            </div>
          </div>
        </div>

        {/* MAIN STICKY HEADER WITH LIGHT/DARK & BENGALI/ENGLISH TOGGLES */}
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
            {/* Brand Identity */}
            <div
              onClick={() => setViewMode('patient')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center text-white shadow-md shadow-teal-700/20 group-hover:scale-105 transition-transform">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {clinicSettings.doctorName}
                  </h1>
                  <span className="bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[11px] font-bold px-2 py-0.5 rounded-md">
                    BDS (RDC, Guwahati)
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium truncate max-w-[260px] sm:max-w-md">
                  {clinicSettings.clinicName} • A.A Road, Mathchowmahani
                </p>
              </div>
            </div>

            {/* Patient Navigation Links */}
            {viewMode === 'patient' && (
              <nav className="hidden xl:flex items-center gap-6 text-sm font-bold text-slate-700 dark:text-slate-300">
                <a href="#about-doctor" className="hover:text-teal-600 dark:hover:text-teal-400">
                  {t.aboutNav}
                </a>
                <a href="#services" className="hover:text-teal-600 dark:hover:text-teal-400">
                  {t.servicesNav}
                </a>
                <button
                  onClick={() => setIsLookupModalOpen(true)}
                  className="hover:text-teal-600 dark:hover:text-teal-400 inline-flex items-center gap-1.5 text-teal-700 dark:text-teal-400"
                >
                  <Search className="w-4 h-4" />
                  <span>{t.checkTokenBtn}</span>
                </button>
                <a href="#clinic-location" className="hover:text-teal-600 dark:hover:text-teal-400">
                  {t.locationNav}
                </a>
              </nav>
            )}

            {/* Right Controls: Language, Light/Dark Mode, QR Code, Book CTA & Doctor Login */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Language Switch (English / বাংলা) */}
              <button
                onClick={() => setLang((prev) => (prev === 'en' ? 'bn' : 'en'))}
                className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-extrabold flex items-center gap-1.5 hover:border-teal-500 transition-colors"
                title="Switch Language (English / বাংলা)"
              >
                <Globe className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>{lang === 'en' ? 'বাংলা' : 'EN'}</span>
              </button>

              {/* Light / Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode((prev) => !prev)}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-300 hover:border-teal-500 transition-colors"
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle Light or Dark Mode"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Prominent Booking QR Button */}
              <button
                onClick={() => setIsQrModalOpen(true)}
                className="bg-teal-50 dark:bg-teal-950/90 hover:bg-teal-100 dark:hover:bg-teal-900 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-700 font-extrabold px-3 py-2.5 rounded-xl transition-all flex items-center gap-1.5 text-xs sm:text-sm shadow-sm"
                title="Open Scannable Clinic Booking QR Code"
              >
                <QrCode className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
                <span className="hidden sm:inline">{t.qrBtn}</span>
              </button>

              {viewMode === 'patient' ? (
                <>
                  <button
                    onClick={() => openBookingWithService('general-consultation')}
                    className="bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold px-3.5 sm:px-5 py-2.5 rounded-xl shadow-md shadow-teal-600/20 transition-all flex items-center gap-2 text-xs sm:text-sm"
                  >
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>{t.bookBtn}</span>
                  </button>
                  <button
                    onClick={handleDoctorAccessClick}
                    className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 text-xs"
                    title="Doctor Chamber Login"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span className="hidden md:inline">Doctor</span>
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('patient')}
                    className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex items-center gap-1.5"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    <span>Patient View</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsAdminAuthenticated(false);
                      setViewMode('patient');
                      showToast('Logged out of Doctor Dashboard.');
                    }}
                    className="bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold px-3 py-2.5 rounded-xl border border-rose-200 dark:border-rose-800 text-xs flex items-center gap-1.5"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Lock</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ========================================================= */}
        {/* VIEW 1: PATIENT-FACING SOLO DENTAL CHAMBER PORTAL         */}
        {/* ========================================================= */}
        {viewMode === 'patient' ? (
          <main>
            {/* HERO SECTION */}
            <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/70 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 pt-8 pb-16 sm:py-16 border-b border-slate-200/80 dark:border-slate-800">
              <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                  {/* Left Column */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="inline-flex items-center gap-2 bg-teal-100/90 dark:bg-teal-950/90 text-teal-900 dark:text-teal-300 border border-teal-300 dark:border-teal-800 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold">
                      <Award className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
                      <span>{t.heroBadge}</span>
                    </div>

                    <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15]">
                      {t.heroTitlePrefix}{' '}
                      <span className="text-teal-700 dark:text-teal-400 underline decoration-teal-400/60 decoration-wavy underline-offset-8">
                        {clinicSettings.doctorName}
                      </span>
                    </h2>

                    <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed max-w-2xl">
                      {t.heroSubtitle}
                    </p>

                    {/* Location Pill */}
                    <div className="inline-flex items-start gap-2.5 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      <MapPin className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          Chamber Location:{' '}
                        </span>
                        <span>{clinicSettings.address}</span>
                      </div>
                    </div>

                    {/* Primary CTAs */}
                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3.5 pt-1">
                      <button
                        onClick={() => openBookingWithService('general-consultation')}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-base sm:text-lg px-7 py-4 rounded-2xl shadow-lg shadow-teal-600/25 hover:shadow-xl transition-all flex items-center justify-center gap-3 group"
                      >
                        <Calendar className="w-5 h-5" />
                        <span>{t.bookBtn}</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>

                      <button
                        onClick={() => setIsLookupModalOpen(true)}
                        className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-300 dark:border-slate-700 font-bold text-base sm:text-lg px-5 py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                      >
                        <Search className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                        <span>{t.checkTokenBtn}</span>
                      </button>

                      <button
                        onClick={() => setIsQrModalOpen(true)}
                        className="bg-teal-50 dark:bg-teal-950/80 hover:bg-teal-100 dark:hover:bg-teal-900 text-teal-900 dark:text-teal-200 border-2 border-teal-300 dark:border-teal-700 font-extrabold text-base px-5 py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                      >
                        <QrCode className="w-5 h-5 text-teal-700 dark:text-teal-400" />
                        <span>{t.showQrHeroBtn}</span>
                      </button>
                    </div>

                    {/* Trust Highlights */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <p className="text-xl font-extrabold text-teal-700 dark:text-teal-400">
                          #001+
                        </p>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          Daily Serial Token
                        </p>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <p className="text-xl font-extrabold text-teal-700 dark:text-teal-400">
                          RDC
                        </p>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          Guwahati Govt. Alumni
                        </p>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <p className="text-xl font-extrabold text-teal-700 dark:text-teal-400">
                          15+ Yrs
                        </p>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          Clinical Experience
                        </p>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <p className="text-xl font-extrabold text-teal-700 dark:text-teal-400">
                          {clinicSettings.consultationFee}
                        </p>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          General Checkup
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Live Chamber Queue & Timings Card */}
                  <div className="lg:col-span-5">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-900 p-6 text-white">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border-2 border-teal-400/50 flex items-center justify-center shrink-0 text-2xl font-extrabold text-teal-300">
                            DB
                          </div>
                          <div>
                            <span className="inline-block bg-teal-500/20 text-teal-200 text-xs font-bold px-2.5 py-0.5 rounded-full border border-teal-400/30 mb-1">
                              {clinicSettings.regNo}
                            </span>
                            <h3 className="text-xl font-extrabold text-white">
                              {clinicSettings.doctorName}
                            </h3>
                            <p className="text-sm text-teal-200 font-semibold">
                              {clinicSettings.degree}
                            </p>
                            <p className="text-xs text-slate-300 mt-0.5">{clinicSettings.title}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 space-y-5">
                        {/* Live Daily Token Status */}
                        <div className="bg-teal-50/90 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 rounded-2xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-teal-900 dark:text-teal-300 flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-ping" />
                              {t.liveQueueTitle}
                            </span>
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                              {formatReadableDate(todayStr).replace('Today, ', '')}
                            </span>
                          </div>

                          {todayBlockInfo?.scope === 'full' ? (
                            <div className="text-sm font-semibold text-rose-800 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl p-3">
                              Chamber Closed Today: {todayBlockInfo.reason}. You can book slots for upcoming days.
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-3 pt-1">
                              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-teal-200 dark:border-teal-800">
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                                  {t.insideNow}
                                </p>
                                <p className="text-lg font-extrabold text-teal-700 dark:text-teal-400 mt-0.5">
                                  {todayStats.insideChamber
                                    ? `Token #${todayStats.insideChamber.tokenId}`
                                    : 'Chair Ready'}
                                </p>
                                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                                  {todayStats.insideChamber
                                    ? todayStats.insideChamber.timeSlot
                                    : `${todayStats.total} Booked Today`}
                                </p>
                              </div>
                              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-teal-200 dark:border-teal-800">
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                                  {t.nextToken}
                                </p>
                                <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                                  {todayStats.nextWaiting
                                    ? `Token #${todayStats.nextWaiting.tokenId}`
                                    : `Next: #${todayStats.nextAvailableTokenToday}`}
                                </p>
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                  {todayStats.waitingCount} Waiting Outside
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Chamber Timings Breakdown (Morning, Special 12-4 PM, Evening) */}
                        <div className="space-y-2.5 text-xs sm:text-sm">
                          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                              <Sun className="w-4 h-4 text-amber-500" />
                              {t.morningChamber}
                            </span>
                            <span className="font-extrabold text-slate-900 dark:text-white">
                              {clinicSettings.morningHoursLabel}
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                            <span className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                              <Star className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              {t.specialChamber}
                            </span>
                            <span className="font-extrabold text-purple-900 dark:text-purple-300">
                              12:00 PM – 04:00 PM
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                              <Moon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                              {t.eveningChamber}
                            </span>
                            <span className="font-extrabold text-slate-900 dark:text-white">
                              {clinicSettings.eveningHoursLabel}
                            </span>
                          </div>
                        </div>

                        {/* Direct Call & WhatsApp Inquiry */}
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <a
                            href={`tel:${clinicSettings.phone}`}
                            className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold py-3 px-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
                          >
                            <PhoneCall className="w-4 h-4 text-teal-400 shrink-0" />
                            <span>Call Chamber</span>
                          </a>
                          <a
                            href={`https://wa.me/${clinicSettings.whatsapp}?text=${encodeURIComponent(
                              `Namaskar ${clinicSettings.doctorName}, I would like to inquire about a dental checkup at your A.A Road chamber.`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
                          >
                            <MessageSquare className="w-4 h-4 shrink-0" />
                            <span>WhatsApp Us</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* DOCTOR BIO & OUTSIDE X-RAY TRANSPARENCY BANNER */}
            <section
              id="about-doctor"
              className="py-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
                {/* Outside X-Ray Policy Notice */}
                <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl p-5 flex items-start gap-3.5">
                  <Info className="w-6 h-6 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm text-amber-950 dark:text-amber-200 space-y-1">
                    <p className="font-extrabold text-amber-900 dark:text-amber-300 text-sm sm:text-base">
                      {t.outsideXrayTitle}
                    </p>
                    <p className="leading-relaxed">{t.outsideXrayBody}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-5 bg-gradient-to-br from-teal-800 to-slate-900 rounded-3xl p-7 text-white shadow-xl space-y-5">
                    <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-teal-200">
                      <ShieldCheck className="w-4 h-4" />
                      Government Dental College Pedigree
                    </div>
                    <h3 className="text-2xl font-extrabold leading-snug">
                      {clinicSettings.doctorName} — {clinicSettings.degree}
                    </h3>
                    <p className="text-slate-200 text-sm leading-relaxed">
                      Trained at Northeast India’s premier government dental institution—
                      <strong>Regional Dental College (RDC), Guwahati</strong>—with over 15 years of clinical expertise in painless tooth extractions, root canals, orthodontic braces, and prosthetic dentures.
                    </p>
                    <div className="space-y-2.5 pt-2 border-t border-white/15 text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-300 shrink-0" />
                        <span>100% Personal 1-on-1 Treatment by Dr. Banik</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-300 shrink-0" />
                        <span>Autoclaved Pouch-Sterilized Instruments</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-300 shrink-0" />
                        <span>Dedicated 12 PM – 4 PM Window for Special Cases</span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-7 space-y-4">
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                      Structured Chamber Timings for Zero Crowd & Better Care
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                      To ensure every patient receives unhurried attention, our chamber separates quick daily checkups/extractions from time-intensive procedures:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                        <h4 className="font-extrabold text-teal-700 dark:text-teal-400 text-base">
                          Regular Chamber (Morning & Evening)
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                          For General Checkups, Toothache Relief, Outside X-Ray Reviews, Tooth Extractions, Dentures, and Kids Dental Care.
                        </p>
                      </div>
                      <div className="p-5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                        <h4 className="font-extrabold text-purple-800 dark:text-purple-300 text-base">
                          Special Cases (12:00 PM – 04:00 PM)
                        </h4>
                        <p className="text-xs sm:text-sm text-purple-900/80 dark:text-purple-200/80 mt-1.5 leading-relaxed">
                          Reserved strictly for <strong>RCT & Dental Cap, Ultrasonic Scaling, Cavity Fillings, and Tooth Braces</strong> (Max 2 cases/day; price discussed during checkup).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* TREATMENTS SECTION: REGULAR VS SPECIAL CASES */}
            <section
              id="services"
              className="py-16 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-14">
                {/* PART A: REGULAR CHAMBER SERVICES */}
                <div>
                  <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div>
                      <span className="text-teal-700 dark:text-teal-400 font-extrabold text-xs sm:text-sm uppercase tracking-wider">
                        Morning ({clinicSettings.morningHoursLabel}) & Evening (
                        {clinicSettings.eveningHoursLabel})
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                        {t.regularTreatmentsHeader}
                      </h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeRegularServices.map((service) => (
                      <div
                        key={service.id}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md hover:border-teal-500 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-4">
                            <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800 flex items-center justify-center">
                              <Stethoscope className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full">
                              {service.badge || 'Regular Chamber'}
                            </span>
                          </div>
                          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">
                            {lang === 'bn' && service.nameBn ? service.nameBn : service.name}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
                            {service.description}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3.5">
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                              <Clock className="w-4 h-4 text-teal-600" />
                              {service.duration}
                            </span>
                            <span className="font-extrabold text-slate-900 dark:text-white">
                              {service.fee}
                            </span>
                          </div>
                          <button
                            onClick={() => openBookingWithService(service.id)}
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                          >
                            <span>Book Morning / Evening Slot</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PART B: SPECIAL CASES (12:00 PM – 04:00 PM | MAX 2 PER DAY) */}
                <div className="bg-gradient-to-br from-purple-950/5 via-purple-100/40 to-white dark:from-purple-950/30 dark:via-slate-900 dark:to-slate-900 rounded-3xl border-2 border-purple-300 dark:border-purple-800 p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-purple-200 dark:border-purple-800/80 pb-5">
                    <div className="space-y-1.5 max-w-3xl">
                      <div className="inline-flex items-center gap-2 bg-purple-700 text-white text-xs font-extrabold px-3 py-1 rounded-full">
                        <Star className="w-3.5 h-3.5" />
                        <span>
                          SPECIAL CASES • OFF-CHAMBER HOURS (12:00 PM – 04:00 PM) • MAX{' '}
                          {clinicSettings.maxSpecialCasesPerDay || 2} CASES / DAY
                        </span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                        {t.specialTreatmentsHeader}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {t.specialCaseExplainer}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {activeSpecialServices.map((service) => (
                      <div
                        key={service.id}
                        className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-purple-200 dark:border-purple-800/80 p-5 shadow-sm flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300 px-2.5 py-1 rounded-md border border-purple-300 dark:border-purple-700">
                              Special Case
                            </span>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                              {service.duration}
                            </span>
                          </div>
                          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mb-2">
                            {lang === 'bn' && service.nameBn ? service.nameBn : service.name}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                            {service.description}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                          <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl p-2.5 text-[11px] text-amber-950 dark:text-amber-200 font-semibold">
                            <span className="font-extrabold block text-amber-900 dark:text-amber-300">
                              Fee / Price:
                            </span>
                            {service.fee}
                          </div>
                          <button
                            onClick={() => openBookingWithService(service.id)}
                            className="w-full bg-purple-700 hover:bg-purple-800 text-white font-extrabold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs sm:text-sm"
                          >
                            <span>Book 12 PM – 4 PM Slot</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* PATIENT SELF-SERVICE TOKEN LOOKUP & RESCHEDULE SECTION (NO SAMPLE CHIPS) */}
            <section className="py-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <div className="max-w-5xl mx-auto px-4 sm:px-6">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-10 text-white shadow-xl">
                  <div className="max-w-2xl">
                    <span className="inline-flex items-center gap-1.5 text-teal-300 text-xs sm:text-sm font-bold uppercase tracking-wider">
                      <RefreshCw className="w-4 h-4" />
                      Live Token Tracker & Self-Service Portal
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">
                      Already Booked? Check Your Token Status or Cancel / Reschedule
                    </h2>
                    <p className="text-slate-300 text-sm sm:text-base mt-2">
                      Enter your <strong>10-Digit Mobile Number</strong> or{' '}
                      <strong>Daily Token Number (e.g., 001, 002)</strong> below. If you cancel an active booking, your mobile number is immediately freed to book a new slot in that session.
                    </p>
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={lookupQuery}
                        onChange={(e) => setLookupQuery(e.target.value)}
                        placeholder="Enter 10-Digit Mobile Number or Token Number (e.g. 001)..."
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white text-slate-900 placeholder-slate-400 font-semibold text-base focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                    </div>
                    {lookupQuery && (
                      <button
                        onClick={() => setLookupQuery('')}
                        className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-3.5 rounded-xl font-bold text-sm"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {lookupQuery.trim() && (
                    <div className="mt-6 space-y-4">
                      {matchedLookupAppointments.length === 0 ? (
                        <div className="bg-white/10 border border-white/15 rounded-2xl p-5 text-slate-200 text-sm">
                          No booking found matching <strong>"{lookupQuery}"</strong>. Please check your 10-digit mobile number or daily token number.
                        </div>
                      ) : (
                        matchedLookupAppointments.map((appt) => (
                          <div
                            key={appt.id}
                            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-200 dark:border-slate-700"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="bg-slate-900 text-teal-300 font-extrabold px-3 py-1 rounded-lg text-sm">
                                  Token #{appt.tokenId}
                                </span>
                                <span
                                  className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusBadgeStyle(
                                    appt.status
                                  )}`}
                                >
                                  Status: {appt.status}
                                </span>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                  {formatReadableDate(appt.date)} • {appt.timeSlot} ({appt.session})
                                </span>
                              </div>
                              <h4 className="text-lg font-extrabold">
                                {appt.patientName}{' '}
                                <span className="text-sm font-normal text-slate-500">
                                  ({appt.age} yrs)
                                </span>
                              </h4>
                              <p className="text-sm text-teal-700 dark:text-teal-400 font-bold">
                                {appt.serviceName}
                              </p>
                            </div>

                            {appt.status !== 'Cancelled' && appt.status !== 'Completed' && (
                              <div className="flex items-center gap-2.5 self-start md:self-center">
                                <button
                                  onClick={() => {
                                    setRescheduleTarget(appt);
                                    setRescheduleDate(appt.date);
                                    setRescheduleSlot('');
                                    setIsLookupModalOpen(true);
                                  }}
                                  className="bg-teal-50 dark:bg-teal-950 hover:bg-teal-100 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-700 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-1.5"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                  <span>Reschedule</span>
                                </button>

                                {cancelConfirmId === appt.id ? (
                                  <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950 p-1.5 rounded-xl border border-rose-200 dark:border-rose-800">
                                    <button
                                      onClick={() => handleCancelAppointment(appt)}
                                      className="bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                                    >
                                      Confirm Cancel
                                    </button>
                                    <button
                                      onClick={() => setCancelConfirmId(null)}
                                      className="text-slate-600 dark:text-slate-300 text-xs font-semibold px-2 py-1.5"
                                    >
                                      Keep
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setCancelConfirmId(appt.id)}
                                    className="bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold px-3.5 py-2.5 rounded-xl text-xs sm:text-sm"
                                  >
                                    Cancel Booking
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* CHAMBER LOCATION, HOURS & GOOGLE MAP (A.A ROAD, MATHCHOWMAHANI) */}
            <section id="clinic-location" className="py-16 bg-slate-50 dark:bg-slate-950">
              <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                  <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
                    <div className="space-y-5">
                      <div>
                        <span className="text-teal-700 dark:text-teal-400 font-extrabold text-xs uppercase tracking-wider">
                          Chamber Address & Schedule
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                          {clinicSettings.clinicName}
                        </h2>
                      </div>

                      <div className="space-y-4 text-sm sm:text-base">
                        <div className="flex items-start gap-3.5">
                          <MapPin className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-1" />
                          <div>
                            <p className="font-extrabold text-slate-900 dark:text-white">
                              Full Chamber Address
                            </p>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                              {clinicSettings.address}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3.5">
                          <Clock className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-1" />
                          <div className="w-full">
                            <p className="font-extrabold text-slate-900 dark:text-white mb-1.5">
                              Daily Chamber Schedule
                            </p>
                            <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs sm:text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-300 font-semibold">
                                  Morning Chamber:
                                </span>
                                <span className="font-extrabold text-slate-900 dark:text-white">
                                  {clinicSettings.morningHoursLabel}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-purple-700 dark:text-purple-300 font-semibold">
                                  Special Cases (Max 2/day):
                                </span>
                                <span className="font-extrabold text-purple-800 dark:text-purple-300">
                                  12:00 PM – 04:00 PM
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-300 font-semibold">
                                  Evening Chamber:
                                </span>
                                <span className="font-extrabold text-slate-900 dark:text-white">
                                  {clinicSettings.eveningHoursLabel}
                                </span>
                              </div>
                              <div className="flex justify-between pt-1.5 border-t border-slate-200 dark:border-slate-700">
                                <span className="text-slate-500">Days Open:</span>
                                <span className="font-bold text-teal-700 dark:text-teal-400">
                                  {clinicSettings.daysOpenLabel}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3.5">
                          <Phone className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-1" />
                          <div>
                            <p className="font-extrabold text-slate-900 dark:text-white">
                              Chamber Phone & WhatsApp
                            </p>
                            <p className="text-slate-700 dark:text-slate-300 font-bold">
                              {clinicSettings.phone}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <a
                        href={`tel:${clinicSettings.phone}`}
                        className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm"
                      >
                        <PhoneCall className="w-4 h-4" />
                        <span>Call Chamber</span>
                      </a>
                      <a
                        href={`https://wa.me/${clinicSettings.whatsapp}?text=${encodeURIComponent(
                          `Hello ${clinicSettings.doctorName}, I have a query regarding a dental visit at your A.A Road chamber.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>WhatsApp Inquiry</span>
                      </a>
                    </div>
                  </div>

                  {/* Embedded Interactive Google Map */}
                  <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm min-h-[390px] flex flex-col">
                    <div className="px-5 py-3.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 truncate">
                        <Navigation className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span className="truncate">{clinicSettings.address}</span>
                      </span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          clinicSettings.mapQuery || clinicSettings.address
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal-700 dark:text-teal-400 hover:underline font-bold shrink-0 ml-2"
                      >
                        Open in Google Maps →
                      </a>
                    </div>
                    <iframe
                      title="Dr. Debashish Banik Dental Chamber Location Map"
                      src={`https://www.google.com/maps?q=${encodeURIComponent(
                        clinicSettings.mapQuery || clinicSettings.address
                      )}&output=embed`}
                      className="w-full flex-1 border-0 min-h-[340px]"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </div>
              </div>
            </section>
          </main>
        ) : (
          /* ========================================================= */
          /* VIEW 2: DOCTOR / CHAMBER ADMIN DASHBOARD                  */
          /* ========================================================= */
          <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            {/* DOCTOR CONSOLE HEADER */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4 border border-slate-800">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="bg-teal-500/20 text-teal-300 border border-teal-400/40 text-xs font-bold px-3 py-1 rounded-full">
                    Live Production Chamber Console
                  </span>
                  <span className="text-xs text-slate-400">
                    Next Today Token: #{todayStats.nextAvailableTokenToday}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">
                  {clinicSettings.doctorName} — Chamber Queue & Service Manager
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                  Manage Morning, Special Case (12–4 PM), and Evening patients, edit services & fees, or block sessions.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    setPrivacyMask(!privacyMask);
                    showToast(
                      !privacyMask
                        ? 'Privacy Mask ON: Phone numbers & notes hidden.'
                        : 'Privacy Mask OFF: Full patient details visible.'
                    );
                  }}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 border transition-all ${
                    privacyMask
                      ? 'bg-teal-950 text-teal-300 border-teal-700'
                      : 'bg-slate-800 text-slate-200 border-slate-700'
                  }`}
                >
                  {privacyMask ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>Privacy Mask: {privacyMask ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  onClick={() => setIsWalkInModalOpen(true)}
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Add Walk-In Patient</span>
                </button>
              </div>
            </div>

            {/* LIVE CHAMBER SUMMARY CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Today's Active Visits
                </p>
                <div className="flex items-baseline justify-between mt-2">
                  <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    {todayStats.total}
                  </p>
                  <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded-full">
                    {todayStats.morningCount}M • {todayStats.specialCount}Sp • {todayStats.eveningCount}E
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 border-teal-500 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                  Inside Chamber Now
                </p>
                <div className="flex items-baseline justify-between mt-2">
                  <p className="text-2xl sm:text-3xl font-extrabold text-teal-700 dark:text-teal-400">
                    {todayStats.insideChamber ? `#${todayStats.insideChamber.tokenId}` : 'Chair Free'}
                  </p>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate max-w-[130px]">
                    {todayStats.insideChamber
                      ? todayStats.insideChamber.patientName
                      : 'Ready for next'}
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Waiting Outside
                </p>
                <div className="flex items-baseline justify-between mt-2">
                  <p className="text-3xl font-extrabold text-amber-600">{todayStats.waitingCount}</p>
                  <span className="text-xs font-semibold text-slate-500">
                    {todayStats.nextWaiting
                      ? `Next: #${todayStats.nextWaiting.tokenId}`
                      : 'None waiting'}
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Completed Today
                </p>
                <div className="flex items-baseline justify-between mt-2">
                  <p className="text-3xl font-extrabold text-emerald-600">
                    {todayStats.completedCount}
                  </p>
                  <span className="text-xs font-medium text-slate-500">
                    {todayStats.cancelledCount} Cancelled
                  </span>
                </div>
              </div>
            </div>

            {/* MAIN WORKSPACE GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT 8 COLUMNS: TABS (DAILY QUEUE, 7-DAY SCHEDULE, SERVICES & PRICES, CHAMBER SETTINGS) */}
              <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900">
                  <div className="flex flex-wrap items-center gap-1.5 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                      onClick={() => setAdminTab('daily')}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                        adminTab === 'daily'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Daily Queue
                    </button>
                    <button
                      onClick={() => setAdminTab('weekly')}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                        adminTab === 'weekly'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      7-Day Calendar
                    </button>
                    <button
                      onClick={() => setAdminTab('services')}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        adminTab === 'services'
                          ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Services & Prices</span>
                    </button>
                    <button
                      onClick={() => setAdminTab('qr')}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        adminTab === 'qr'
                          ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Booking QR & Poster</span>
                    </button>
                    <button
                      onClick={() => setAdminTab('settings')}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        adminTab === 'settings'
                          ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Chamber Settings</span>
                    </button>
                  </div>

                  {adminTab === 'daily' && (
                    <div className="flex items-center gap-2">
                      {selectedAdminDateBlockInfo ? (
                        <button
                          onClick={() => handleSaveBlockDate(adminSelectedDate, 'unblock')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Re-Open Date</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setIsBlockModalOpen(true)}
                          className="bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5"
                        >
                          <CalendarOff className="w-3.5 h-3.5" />
                          <span>Block Session / Day</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* TAB 1: DAILY CHAMBER QUEUE */}
                {adminTab === 'daily' && (
                  <div className="p-4 sm:p-6 space-y-5">
                    {/* 7-Day Date Selector Strip */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                      {next14Days.slice(0, 7).map((d) => {
                        const isSelected = d.dateStr === adminSelectedDate;
                        const dayCount = appointments.filter(
                          (a) => a.date === d.dateStr && a.status !== 'Cancelled'
                        ).length;
                        return (
                          <button
                            key={d.dateStr}
                            onClick={() => setAdminSelectedDate(d.dateStr)}
                            className={`px-3.5 py-2.5 rounded-2xl border text-left shrink-0 transition-all min-w-[104px] ${
                              isSelected
                                ? 'bg-slate-900 dark:bg-teal-600 text-white border-slate-900 dark:border-teal-500 shadow-sm'
                                : d.blockInfo
                                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                : 'bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs font-semibold opacity-80">
                              <span>{d.dayName}</span>
                              {d.blockInfo && <Ban className="w-3.5 h-3.5 text-rose-500" />}
                            </div>
                            <p className="text-base font-extrabold mt-0.5">
                              {d.dayNum} {d.monthShort}
                            </p>
                            <p
                              className={`text-[11px] font-bold mt-0.5 ${
                                isSelected ? 'text-teal-200' : 'text-teal-700 dark:text-teal-400'
                              }`}
                            >
                              {d.blockInfo
                                ? d.blockInfo.scope === 'full'
                                  ? 'Closed'
                                  : `${d.blockInfo.scope} off`
                                : `${dayCount} booked`}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    {/* Session Filter (All / Morning / Special Cases 12-4 PM / Evening) + Search */}
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                      <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                        {[
                          { id: 'All', label: 'All' },
                          { id: 'Morning', label: 'Morning' },
                          { id: 'Special', label: 'Special (12–4 PM)' },
                          { id: 'Evening', label: 'Evening' }
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setAdminSessionFilter(tab.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              adminSessionFilter === tab.id
                                ? 'bg-slate-900 dark:bg-teal-600 text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={adminSearch}
                          onChange={(e) => setAdminSearch(e.target.value)}
                          placeholder="Search name, token (001), or phone..."
                          className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>

                    {/* Status Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {[
                        'All',
                        'Inside Chamber',
                        'Waiting Outside',
                        'Confirmed',
                        'Completed',
                        'Cancelled'
                      ].map((st) => (
                        <button
                          key={st}
                          onClick={() => setAdminStatusFilter(st)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                            adminStatusFilter === st
                              ? 'bg-teal-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>

                    {/* Patient Queue Cards */}
                    <div className="space-y-3.5">
                      {filteredAdminDailyAppointments.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                          <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                          <p className="font-bold text-slate-700 dark:text-slate-200">
                            No patient bookings for this view yet
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            New bookings will appear here in real time starting from Token #001, or click "+ Add Walk-In Patient".
                          </p>
                        </div>
                      ) : (
                        filteredAdminDailyAppointments.map((appt) => {
                          const rowId = appt.id;
                          const isSpec =
                            appt.session === 'Special' || appt.isSpecialCase;
                          return (
                            <div
                              key={rowId}
                              className={`rounded-2xl border p-4 sm:p-5 transition-all ${
                                appt.status === 'Inside Chamber'
                                  ? 'bg-teal-50/70 dark:bg-teal-950/40 border-2 border-teal-500 shadow-md'
                                  : appt.status === 'Cancelled'
                                  ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
                                  : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="bg-slate-900 dark:bg-teal-500 text-white dark:text-slate-950 font-extrabold text-xs px-2.5 py-1 rounded-lg">
                                      Token #{appt.tokenId}
                                    </span>
                                    <span
                                      className={`font-extrabold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 ${
                                        isSpec
                                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                                          : 'bg-teal-100/80 dark:bg-teal-950 text-teal-900 dark:text-teal-300'
                                      }`}
                                    >
                                      <Clock className="w-3.5 h-3.5" />
                                      {appt.timeSlot} ({appt.session})
                                    </span>
                                    <span
                                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadgeStyle(
                                        appt.status
                                      )}`}
                                    >
                                      {appt.status}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                                    <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                                      {appt.patientName}
                                    </h4>
                                    <span className="text-xs font-semibold text-slate-500">
                                      ({appt.age} yrs)
                                    </span>
                                    <span className="text-xs font-mono bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                                      {formatMaskedPhone(appt.phone, rowId)}
                                    </span>
                                    {privacyMask && (
                                      <button
                                        onClick={() => toggleRevealRow(rowId)}
                                        className="text-xs text-teal-600 hover:underline font-bold flex items-center gap-0.5"
                                      >
                                        {revealedRows[rowId] ? 'Hide' : 'Show'}
                                      </button>
                                    )}
                                  </div>

                                  <p className="text-xs sm:text-sm font-bold text-teal-700 dark:text-teal-400">
                                    {appt.serviceName}{' '}
                                    {appt.serviceFee && (
                                      <span className="text-xs font-semibold text-slate-500">
                                        ({appt.serviceFee})
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700">
                                    <strong>Note:</strong> {formatMaskedNotes(appt.symptoms, rowId)}
                                  </p>
                                </div>

                                {/* 1-Tap Status Controls */}
                                <div className="flex flex-col sm:items-end justify-between gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    1-Tap Chamber Status
                                  </span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {[
                                      'Confirmed',
                                      'Waiting Outside',
                                      'Inside Chamber',
                                      'Completed',
                                      'Cancelled'
                                    ].map((st) => (
                                      <button
                                        key={st}
                                        onClick={() => handleUpdateStatus(appt, st)}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                          appt.status === st
                                            ? 'bg-slate-900 dark:bg-teal-500 text-white dark:text-slate-950 border-slate-900 dark:border-teal-500 shadow-sm'
                                            : 'bg-white dark:bg-slate-900 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                        }`}
                                      >
                                        {st}
                                      </button>
                                    ))}
                                  </div>

                                  <button
                                    onClick={() => handleSendWhatsAppToPatient(appt)}
                                    className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 border border-emerald-300 dark:border-emerald-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5 mt-1"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>WhatsApp Patient</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: 7-DAY CALENDAR OVERVIEW */}
                {adminTab === 'weekly' && (
                  <div className="p-4 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-extrabold">7-Day Chamber Schedule Overview</h3>
                        <p className="text-xs text-slate-500">
                          Click any day to open its queue or manage session availability
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {next14Days.slice(0, 7).map((d) => {
                        const dayAppts = appointments.filter(
                          (a) => a.date === d.dateStr && a.status !== 'Cancelled'
                        );
                        const mCount = dayAppts.filter((a) => a.session === 'Morning').length;
                        const spCount = dayAppts.filter((a) => a.session === 'Special').length;
                        const eCount = dayAppts.filter((a) => a.session === 'Evening').length;

                        return (
                          <div
                            key={d.dateStr}
                            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex flex-col justify-between gap-3"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                                  {d.dayName}
                                </span>
                                <h4 className="text-base font-extrabold">
                                  {d.dayNum} {d.monthShort}
                                </h4>
                              </div>
                              <span className="text-xs font-extrabold bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                                {dayAppts.length} Active Bookings
                              </span>
                            </div>

                            {d.blockInfo ? (
                              <div className="text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 p-2.5 rounded-xl">
                                Blocked ({d.blockInfo.scope.toUpperCase()}): {d.blockInfo.reason}
                              </div>
                            ) : (
                              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700">
                                  <p className="text-slate-400 font-semibold">Morning</p>
                                  <p className="font-extrabold text-sm mt-0.5">{mCount}</p>
                                </div>
                                <div className="bg-purple-50 dark:bg-purple-950/40 p-2 rounded-xl border border-purple-200 dark:border-purple-800">
                                  <p className="text-purple-700 dark:text-purple-300 font-semibold">
                                    Special
                                  </p>
                                  <p className="font-extrabold text-sm text-purple-900 dark:text-purple-200 mt-0.5">
                                    {spCount}/{clinicSettings.maxSpecialCasesPerDay || 2}
                                  </p>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700">
                                  <p className="text-slate-400 font-semibold">Evening</p>
                                  <p className="font-extrabold text-sm mt-0.5">{eCount}</p>
                                </div>
                              </div>
                            )}

                            <button
                              onClick={() => {
                                setAdminSelectedDate(d.dateStr);
                                setAdminTab('daily');
                              }}
                              className="w-full py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-teal-50 dark:hover:bg-slate-800 text-teal-700 dark:text-teal-300 border border-slate-200 dark:border-slate-700 text-xs font-extrabold"
                            >
                              Open Day Queue →
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 3: DOCTOR SERVICES & PRICES EDITOR */}
                {adminTab === 'services' && (
                  <div className="p-4 sm:p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                      <div>
                        <h3 className="text-lg font-extrabold">
                          Edit Chamber Services & Treatment Prices
                        </h3>
                        <p className="text-xs text-slate-500">
                          Customize Regular Chamber Treatments (Morning/Evening) & Special Cases (12:00 PM – 04:00 PM)
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleOpenAddService('regular')}
                          className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ Regular Service</span>
                        </button>
                        <button
                          onClick={() => handleOpenAddService('special')}
                          className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ Special Case</span>
                        </button>
                        <button
                          onClick={handleResetDefaultServices}
                          className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold px-3 py-2 rounded-xl"
                        >
                          Reset Defaults
                        </button>
                      </div>
                    </div>

                    {/* Regular Services List */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                        Regular Chamber Treatments (Morning & Evening)
                      </h4>
                      {allServices
                        .filter((s) => s.category !== 'special')
                        .map((service) => (
                          <div
                            key={service.id}
                            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-sm sm:text-base">
                                  {service.name}
                                </span>
                                <span className="bg-teal-100 dark:bg-teal-950 text-teal-900 dark:text-teal-300 text-xs font-extrabold px-2.5 py-0.5 rounded-md">
                                  {service.fee}
                                </span>
                                <span className="text-xs text-slate-500">({service.duration})</span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {service.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleOpenEditService(service)}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-teal-600" />
                                <span>Edit / Fee</span>
                              </button>
                              <button
                                onClick={() => handleDeleteServiceItem(service.id)}
                                className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                                title="Delete service"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Special Cases List */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                        Special Cases (Off-Chamber 12:00 PM – 04:00 PM • Max 2/Day)
                      </h4>
                      {allServices
                        .filter((s) => s.category === 'special')
                        .map((service) => (
                          <div
                            key={service.id}
                            className="p-4 rounded-2xl border-2 border-purple-200 dark:border-purple-800/80 bg-purple-50/40 dark:bg-purple-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-sm sm:text-base">
                                  {service.name}
                                </span>
                                <span className="bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-200 text-xs font-extrabold px-2.5 py-0.5 rounded-md">
                                  {service.fee}
                                </span>
                                <span className="text-xs text-slate-500">({service.duration})</span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {service.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleOpenEditService(service)}
                                className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-purple-600" />
                                <span>Edit / Fee</span>
                              </button>
                              <button
                                onClick={() => handleDeleteServiceItem(service.id)}
                                className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                                title="Delete service"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* TAB 3.5: DOCTOR'S BOOKING QR & RECEPTION STANDEE GENERATOR */}
                {adminTab === 'qr' && (
                  <div className="p-5 sm:p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                      <div>
                        <span className="text-xs font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                          Ready for Clinic Desk & WhatsApp Status
                        </span>
                        <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                          Chamber Booking QR Code & Printable Reception Standee
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Patients can scan this QR code outside the chamber or at the reception counter to book their Daily Token (#001, #002...) directly on their phone.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleDownloadQrStandeePng}
                          disabled={isDownloadingQr}
                          className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm"
                        >
                          <Download className="w-4 h-4" />
                          <span>{isDownloadingQr ? 'Generating...' : 'Download PNG Poster'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsQrModalOpen(true)}
                          className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5"
                        >
                          <Printer className="w-4 h-4" />
                          <span>Full Standee / Print A4</span>
                        </button>
                      </div>
                    </div>

                    {/* Dual QR Mode Switcher */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setQrMode('web')}
                        className={`py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm text-left transition-all flex items-center justify-between ${
                          qrMode === 'web'
                            ? 'bg-teal-600 text-white shadow-sm'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div>
                          <p>1. Direct Web Booking QR (?book=1)</p>
                          <p className="text-[11px] font-medium opacity-85">
                            Opens the 3-step live slot & token booking form automatically
                          </p>
                        </div>
                        {qrMode === 'web' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setQrMode('whatsapp')}
                        className={`py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm text-left transition-all flex items-center justify-between ${
                          qrMode === 'whatsapp'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div>
                          <p>2. WhatsApp Instant Booking QR</p>
                          <p className="text-[11px] font-medium opacity-85">
                            Opens patient's WhatsApp with pre-filled booking message to chamber
                          </p>
                        </div>
                        {qrMode === 'whatsapp' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
                      </button>
                    </div>

                    {/* Custom URL Input when in Web Mode */}
                    {qrMode === 'web' && (
                      <div className="bg-slate-50 dark:bg-slate-800/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                        <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                          Web App Link Encoded in QR Code (Auto-appends ?book=1)
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={qrCustomUrlInput}
                            onChange={(e) => setQrCustomUrlInput(e.target.value)}
                            placeholder="https://your-clinic-domain.com/?book=1"
                            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs sm:text-sm font-mono"
                          />
                          <button
                            type="button"
                            onClick={handleCopyBookingLink}
                            className="bg-slate-900 dark:bg-teal-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shrink-0"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Link</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Preview of the High-Contrast Scannable Standee Card */}
                    <div className="bg-white text-slate-900 rounded-3xl border-4 border-teal-600 p-6 sm:p-8 shadow-xl max-w-lg mx-auto text-center space-y-4">
                      <div className="bg-gradient-to-r from-slate-900 to-teal-900 text-white rounded-2xl p-4">
                        <p className="text-[11px] font-extrabold uppercase tracking-widest text-teal-300">
                          SCAN QR CODE TO BOOK APPOINTMENT
                        </p>
                        <h4 className="text-xl sm:text-2xl font-extrabold mt-0.5">
                          {clinicSettings.doctorName}
                        </h4>
                        <p className="text-xs text-teal-200 font-bold">
                          {clinicSettings.degree} • {clinicSettings.experience}
                        </p>
                        <p className="text-xs text-slate-300 mt-0.5">{clinicSettings.clinicName}</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-extrabold text-slate-900">
                          Scan with Phone Camera or Google Lens
                        </p>
                        <p className="text-xs font-bold text-teal-800">
                          চেম্বার বুকিং ও টোকেন (#001+) পেতে আপনার ফোনের ক্যামেরা দিয়ে স্ক্যান করুন
                        </p>
                      </div>

                      {/* Pure White High-Contrast QR Frame */}
                      <div className="bg-white p-4 rounded-2xl border-2 border-teal-500 inline-block shadow-md">
                        <img
                          src={buildQrImageUrl(activeQrTargetUrl, 320)}
                          alt="Dr. Debashish Banik Dental Chamber Booking QR Code"
                          className="w-60 h-60 sm:w-64 sm:h-64 object-contain mx-auto"
                        />
                      </div>

                      <div className="bg-slate-100 rounded-2xl p-3.5 text-xs space-y-1 text-slate-800 border border-slate-200">
                        <p className="font-extrabold text-slate-900">
                          Morning: {clinicSettings.morningHoursLabel} | Evening:{' '}
                          {clinicSettings.eveningHoursLabel}
                        </p>
                        <p className="font-bold text-purple-800">
                          Special Cases (RCT, Scaling, Fillings, Braces): 12:00 PM – 04:00 PM
                        </p>
                        <p className="text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                          📍 {clinicSettings.address}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: EDITABLE CHAMBER PROFILE, ADDRESS & TIMINGS */}
                {adminTab === 'settings' && (
                  <form onSubmit={handleSaveClinicProfile} className="p-5 sm:p-6 space-y-5">
                    <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                      <h3 className="text-lg font-extrabold">
                        Edit Chamber Profile, Address, Timings & Security PIN
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        All changes update the live patient portal immediately.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                          Chamber Name
                        </label>
                        <input
                          type="text"
                          required
                          value={settingsForm.clinicName || ''}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, clinicName: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                          Doctor Name
                        </label>
                        <input
                          type="text"
                          required
                          value={settingsForm.doctorName || ''}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, doctorName: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                          Chamber Phone Number
                        </label>
                        <input
                          type="text"
                          required
                          value={settingsForm.phone || ''}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, phone: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                          WhatsApp Number (with 91 prefix)
                        </label>
                        <input
                          type="text"
                          required
                          value={settingsForm.whatsapp || ''}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, whatsapp: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                          Morning Chamber Hours
                        </label>
                        <input
                          type="text"
                          required
                          value={settingsForm.morningHoursLabel || ''}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              morningHoursLabel: e.target.value
                            })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                          Evening Chamber Hours
                        </label>
                        <input
                          type="text"
                          required
                          value={settingsForm.eveningHoursLabel || ''}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              eveningHoursLabel: e.target.value
                            })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                          General Consultation Fee Display
                        </label>
                        <input
                          type="text"
                          required
                          value={settingsForm.consultationFee || ''}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              consultationFee: e.target.value
                            })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                          Doctor Secret Login PIN
                        </label>
                        <input
                          type="text"
                          required
                          value={settingsForm.adminPin || ''}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, adminPin: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                          Full Chamber Address (Shown on Website & Confirmation Slips)
                        </label>
                        <input
                          type="text"
                          required
                          value={settingsForm.address || ''}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, address: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                        />
                      </div>
                    </div>

                    <div className="pt-3 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSavingSettings}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold px-6 py-3 rounded-xl shadow-md text-sm flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isSavingSettings ? 'Saving...' : 'Save Chamber Settings'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* RIGHT 4 COLUMNS: SLOT INTERVAL, SPECIAL CASE CAP & SESSION BLOCKING */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400 flex items-center justify-center font-bold">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold">Slot & Session Control</h3>
                      <p className="text-xs text-slate-500">
                        Regular slot buffer & blocked dates
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                      Regular Chamber Slot Interval
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[15, 20, 30].map((mins) => (
                        <button
                          key={mins}
                          onClick={() => handleUpdateSlotDuration(mins)}
                          className={`py-2.5 px-2 rounded-xl font-extrabold text-xs sm:text-sm border transition-all ${
                            Number(clinicSettings.slotDuration) === mins
                              ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {mins} mins
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Special Cases are fixed at <strong>12:00 PM – 04:00 PM</strong> (Max{' '}
                      {clinicSettings.maxSpecialCasesPerDay || 2} per day).
                    </p>
                  </div>

                  {/* Blocked Dates List */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Blocked Sessions / Leave
                      </span>
                      <button
                        onClick={() => setIsBlockModalOpen(true)}
                        className="text-xs font-bold text-rose-600 hover:underline"
                      >
                        + Block Session/Day
                      </button>
                    </div>

                    {Object.keys(clinicSettings.blockedDates || {}).length === 0 ? (
                      <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700">
                        All chamber sessions are currently OPEN.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {Object.keys(clinicSettings.blockedDates).map((dStr) => {
                          const info = getBlockInfoForDate(clinicSettings.blockedDates, dStr);
                          if (!info) return null;
                          return (
                            <div
                              key={dStr}
                              className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl p-3 flex items-center justify-between gap-2 text-xs"
                            >
                              <div>
                                <p className="font-bold text-rose-900 dark:text-rose-200">
                                  {formatReadableDate(dStr)} ({info.scope.toUpperCase()})
                                </p>
                                <p className="text-rose-700 dark:text-rose-300">{info.reason}</p>
                              </div>
                              <button
                                onClick={() => handleSaveBlockDate(dStr, 'unblock')}
                                className="bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 border border-rose-300 font-bold px-2.5 py-1 rounded-lg shrink-0"
                              >
                                Unblock
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>
        )}

        {/* ========================================================= */}
        {/* MODAL 1: 3-STEP BOOKING MODAL (REGULAR & SPECIAL CASES)   */}
        {/* ========================================================= */}
        {isBookingOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
              {/* Modal Header */}
              <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                    {bookingStep === 4
                      ? 'Chamber Slot Locked & Confirmed!'
                      : `${clinicSettings.clinicName} • Step ${bookingStep} of 3`}
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold mt-0.5">
                    {bookingStep === 1 && '1. Select Dental Treatment or Special Case'}
                    {bookingStep === 2 &&
                      (isSelectedServiceSpecial
                        ? '2. Pick Date & Special Case Slot (12:00 PM – 04:00 PM)'
                        : '2. Pick Date & Regular Chamber Session (Morning / Evening)')}
                    {bookingStep === 3 && '3. Patient Details (1 Booking Per Session Per Mobile)'}
                    {bookingStep === 4 &&
                      `Confirmed — Daily Token #${confirmedBooking?.tokenId}`}
                  </h3>
                </div>
                <button
                  onClick={() => setIsBookingOpen(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 max-h-[80vh] overflow-y-auto text-slate-900 dark:text-slate-100">
                {/* STEP 1: SELECT SERVICE (REGULAR VS SPECIAL CASES) */}
                {bookingStep === 1 && (
                  <div className="space-y-4">
                    {/* Category Switcher */}
                    <div className="grid grid-cols-2 gap-2.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => {
                          setBookingCategoryTab('regular');
                          if (activeRegularServices[0]) {
                            handleSelectServiceInModal(activeRegularServices[0]);
                          }
                        }}
                        className={`py-2.5 px-3 rounded-xl font-extrabold text-xs sm:text-sm transition-all ${
                          bookingCategoryTab === 'regular'
                            ? 'bg-teal-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        Regular Chamber (Morning / Evening)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBookingCategoryTab('special');
                          if (activeSpecialServices[0]) {
                            handleSelectServiceInModal(activeSpecialServices[0]);
                          }
                        }}
                        className={`py-2.5 px-3 rounded-xl font-extrabold text-xs sm:text-sm transition-all ${
                          bookingCategoryTab === 'special'
                            ? 'bg-purple-700 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        Special Cases (12 PM – 4 PM)
                      </button>
                    </div>

                    {bookingCategoryTab === 'special' && (
                      <div className="bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 rounded-2xl p-4 text-xs sm:text-sm text-purple-950 dark:text-purple-200 space-y-1">
                        <p className="font-extrabold text-purple-900 dark:text-purple-300">
                          Special Case Scheduling Policy (12:00 PM – 04:00 PM • Max{' '}
                          {clinicSettings.maxSpecialCasesPerDay || 2}/Day)
                        </p>
                        <p>
                          RCT & Cap, Ultrasonic Scaling, Cavity Fillings, and Tooth Braces require extended care during the Off-Chamber period. Treatment fees are discussed with Dr. Banik during your dental checkup before booking a Special Case slot.
                        </p>
                      </div>
                    )}

                    <div className="space-y-2.5">
                      {(bookingCategoryTab === 'special'
                        ? activeSpecialServices
                        : activeRegularServices
                      ).map((s) => {
                        const isSelected = selectedServiceId === s.id;
                        const isSpec = s.category === 'special';
                        return (
                          <div
                            key={s.id}
                            onClick={() => handleSelectServiceInModal(s)}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                              isSelected
                                ? isSpec
                                  ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/40'
                                  : 'border-teal-600 bg-teal-50/60 dark:bg-teal-950/40'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-extrabold text-sm sm:text-base">{s.name}</p>
                                <span
                                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md ${
                                    isSpec
                                      ? 'bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-200'
                                      : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                                  }`}
                                >
                                  {s.fee}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                {s.description}
                              </p>
                            </div>
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? isSpec
                                    ? 'border-purple-600 bg-purple-600 text-white'
                                    : 'border-teal-600 bg-teal-600 text-white'
                                  : 'border-slate-300'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={() => setBookingStep(2)}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold px-6 py-3.5 rounded-xl flex items-center gap-2 text-sm sm:text-base"
                      >
                        <span>Next: Choose Date & Time Slot</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: SELECT DATE & SESSION SLOTS */}
                {bookingStep === 2 && (
                  <div className="space-y-5">
                    {/* Date Strip */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                        Select Appointment Date
                      </label>
                      <div className="flex items-center gap-2.5 overflow-x-auto pb-2">
                        {next14Days.map((d) => {
                          const isSelected = selectedDate === d.dateStr;
                          const specialCountOnDay = getActiveSpecialCaseCountForDate(d.dateStr);
                          const maxSpec = Number(clinicSettings.maxSpecialCasesPerDay) || 2;
                          const isSpecialFull =
                            isSelectedServiceSpecial && specialCountOnDay >= maxSpec;

                          return (
                            <button
                              key={d.dateStr}
                              type="button"
                              onClick={() => {
                                setSelectedDate(d.dateStr);
                                setSelectedSlot('');
                              }}
                              className={`px-3.5 py-2.5 rounded-2xl border-2 text-left shrink-0 transition-all min-w-[100px] ${
                                isSelected
                                  ? 'border-teal-600 bg-teal-600 text-white shadow-sm'
                                  : d.isFullBlocked || isSpecialFull
                                  ? 'border-rose-200 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 opacity-75'
                                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                              }`}
                            >
                              <p className="text-xs font-semibold opacity-85">{d.dayName}</p>
                              <p className="text-base font-extrabold">
                                {d.dayNum} {d.monthShort}
                              </p>
                              <p className="text-[10px] font-bold mt-0.5">
                                {d.isFullBlocked
                                  ? 'Closed'
                                  : isSelectedServiceSpecial
                                  ? `${maxSpec - specialCountOnDay} Special Left`
                                  : 'Open'}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Session Tabs: Special Case (12-4 PM) OR Regular Morning/Evening */}
                    {isSelectedServiceSpecial ? (
                      <div className="bg-purple-50 dark:bg-purple-950/40 border-2 border-purple-300 dark:border-purple-800 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                            <Star className="w-4 h-4" />
                            Off-Chamber Special Case Window (12:00 PM – 04:00 PM)
                          </span>
                          <span className="text-xs font-bold text-purple-800 dark:text-purple-300">
                            {getActiveSpecialCaseCountForDate(selectedDate)} /{' '}
                            {clinicSettings.maxSpecialCasesPerDay || 2} Booked
                          </span>
                        </div>

                        {isSessionBlockedOnDate(selectedDate, 'Special') ? (
                          <div className="text-sm font-bold text-rose-700 dark:text-rose-300 py-3">
                            Special Case session is closed on {formatReadableDate(selectedDate)}. Please pick another date.
                          </div>
                        ) : getActiveSpecialCaseCountForDate(selectedDate) >=
                          (Number(clinicSettings.maxSpecialCasesPerDay) || 2) ? (
                          <div className="bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 rounded-xl p-4 text-xs sm:text-sm font-bold text-rose-800 dark:text-rose-200">
                            Maximum {clinicSettings.maxSpecialCasesPerDay || 2} Special Cases are already booked for {formatReadableDate(selectedDate)}. Please select another date above.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {configuredSlots.special.map((slot) => {
                              const isBooked = getBookedSlotsForDate(selectedDate).has(slot);
                              const isSelected = selectedSlot === slot;
                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  disabled={isBooked}
                                  onClick={() => {
                                    setSelectedSessionTab('Special');
                                    setSelectedSlot(slot);
                                  }}
                                  className={`p-3.5 rounded-xl border-2 text-left font-extrabold text-xs sm:text-sm transition-all ${
                                    isBooked
                                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 line-through cursor-not-allowed border-slate-200'
                                      : isSelected
                                      ? 'bg-purple-700 text-white border-purple-700 shadow-md'
                                      : 'bg-white dark:bg-slate-900 hover:border-purple-500 border-purple-200 dark:border-purple-800'
                                  }`}
                                >
                                  <div>{slot}</div>
                                  <div className="text-[11px] font-medium opacity-80 mt-0.5">
                                    {isBooked ? 'Already Booked' : 'Available Special Case Slot'}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* Regular Morning / Evening Session Switcher */}
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSessionTab('Morning');
                              setSelectedSlot('');
                            }}
                            className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-center gap-3 ${
                              selectedSessionTab === 'Morning'
                                ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/50'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                            }`}
                          >
                            <Sun className="w-5 h-5 text-amber-500 shrink-0" />
                            <div>
                              <p className="font-extrabold text-xs sm:text-sm">Morning Chamber</p>
                              <p className="text-[11px] text-slate-500">
                                {clinicSettings.morningHoursLabel}
                              </p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSessionTab('Evening');
                              setSelectedSlot('');
                            }}
                            className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-center gap-3 ${
                              selectedSessionTab === 'Evening'
                                ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/50'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                            }`}
                          >
                            <Moon className="w-5 h-5 text-teal-600 shrink-0" />
                            <div>
                              <p className="font-extrabold text-xs sm:text-sm">Evening Chamber</p>
                              <p className="text-[11px] text-slate-500">
                                {clinicSettings.eveningHoursLabel}
                              </p>
                            </div>
                          </button>
                        </div>

                        {isSessionBlockedOnDate(selectedDate, selectedSessionTab) ? (
                          <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl p-5 text-center space-y-2">
                            <CalendarOff className="w-8 h-8 text-rose-600 mx-auto" />
                            <h4 className="font-extrabold text-rose-900 dark:text-rose-200 text-base">
                              {selectedSessionTab} Chamber Closed on {formatReadableDate(selectedDate)}
                            </h4>
                            <p className="text-xs text-rose-700 dark:text-rose-300">
                              Please switch session or select another date above.
                            </p>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between mb-2.5">
                              <span className="text-xs sm:text-sm font-bold">
                                Available {selectedSessionTab} Slots ({formatReadableDate(selectedDate)})
                              </span>
                              <span className="text-xs text-teal-700 dark:text-teal-400 font-bold">
                                Next Daily Token: #{getNextDailyTokenForDate(selectedDate).tokenId}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                              {(selectedSessionTab === 'Morning'
                                ? configuredSlots.morning
                                : configuredSlots.evening
                              ).map((slot) => {
                                const isBooked = getBookedSlotsForDate(selectedDate).has(slot);
                                const isSelected = selectedSlot === slot;
                                return (
                                  <button
                                    key={slot}
                                    type="button"
                                    disabled={isBooked}
                                    onClick={() => setSelectedSlot(slot)}
                                    className={`py-3 px-2 rounded-xl border text-xs sm:text-sm font-extrabold transition-all ${
                                      isBooked
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                                        : isSelected
                                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                                        : 'bg-white dark:bg-slate-800 hover:border-teal-500 border-slate-200 dark:border-slate-700'
                                    }`}
                                  >
                                    <div>{slot}</div>
                                    <div className="text-[10px] font-medium opacity-80">
                                      {isBooked ? 'Booked' : 'Open'}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setBookingStep(1)}
                        className="text-slate-600 dark:text-slate-400 font-bold text-sm px-4 py-2.5 flex items-center gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                      </button>
                      <button
                        type="button"
                        disabled={!selectedSlot}
                        onClick={() => setBookingStep(3)}
                        className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-extrabold px-6 py-3.5 rounded-xl flex items-center gap-2 text-sm sm:text-base transition-all"
                      >
                        <span>Next: Patient Details</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: PATIENT DETAILS & DUPLICATE GUARD */}
                {bookingStep === 3 && (
                  <form onSubmit={handleConfirmBooking} className="space-y-4">
                    <div className="bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 rounded-2xl p-3.5 flex items-center justify-between text-xs sm:text-sm">
                      <div>
                        <p className="font-extrabold text-teal-950 dark:text-teal-200">
                          {selectedServiceObj?.name} ({selectedServiceObj?.fee})
                        </p>
                        <p className="text-teal-800 dark:text-teal-300 font-semibold">
                          {formatReadableDate(selectedDate)} • <strong>{selectedSlot}</strong> • Est. Daily Token:{' '}
                          <strong>#{getNextDailyTokenForDate(selectedDate).tokenId}</strong>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBookingStep(2)}
                        className="text-teal-800 dark:text-teal-300 underline font-bold text-xs shrink-0"
                      >
                        Change
                      </button>
                    </div>

                    {isSelectedServiceSpecial && (
                      <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-300 dark:border-purple-800 cursor-pointer text-xs sm:text-sm">
                        <input
                          type="checkbox"
                          checked={specialCaseConsultConfirmed}
                          onChange={(e) => setSpecialCaseConsultConfirmed(e.target.checked)}
                          className="mt-1 w-4 h-4 accent-purple-700 rounded"
                        />
                        <span className="text-purple-950 dark:text-purple-200 font-semibold">
                          I understand this is a <strong>Special Case (12:00 PM – 04:00 PM)</strong> and treatment price is discussed with Dr. Debashish Banik during the initial dental checkup.
                        </span>
                      </label>
                    )}

                    {formError && (
                      <div className="bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 p-3.5 rounded-xl text-xs sm:text-sm font-semibold flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <span>{formError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                          Patient Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={patientForm.fullName}
                          onChange={(e) =>
                            setPatientForm({ ...patientForm, fullName: e.target.value })
                          }
                          placeholder="Enter Patient Full Name"
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-base focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                          Age (Years) *
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          max="120"
                          value={patientForm.age}
                          onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
                          placeholder="e.g. 38"
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-base focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        10-Digit Mobile Number (Max 1 Active Booking Per Session) *
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm">
                          +91
                        </span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={patientForm.phone}
                          onChange={(e) =>
                            setPatientForm({ ...patientForm, phone: e.target.value })
                          }
                          placeholder="10-digit mobile number"
                          className="w-full px-4 py-3 rounded-r-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-base focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Brief Note on Dental Problem (Optional)
                      </label>
                      <textarea
                        rows={2}
                        value={patientForm.symptoms}
                        onChange={(e) =>
                          setPatientForm({ ...patientForm, symptoms: e.target.value })
                        }
                        placeholder="Describe toothache, or mention if bringing outside X-ray..."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {SYMPTOM_CHIPS.map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => setPatientForm({ ...patientForm, symptoms: chip })}
                            className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            + {chip}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setBookingStep(2)}
                        className="text-slate-600 dark:text-slate-400 font-bold text-sm px-4 py-2.5 flex items-center gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingBooking}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold px-7 py-3.5 rounded-xl shadow-lg shadow-teal-600/25 flex items-center gap-2 text-base"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span>
                          {isSubmittingBooking ? 'Locking Slot...' : 'Confirm Chamber Booking'}
                        </span>
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 4: CONFIRMATION SLIP WITH SEQUENTIAL DAILY TOKEN (#001, #002...) */}
                {bookingStep === 4 && confirmedBooking && (
                  <div className="space-y-5">
                    <div className="bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-300 dark:border-emerald-700 rounded-2xl p-5 text-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                        <Check className="w-7 h-7 stroke-[3]" />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                        Chamber Appointment Confirmed
                      </p>
                      <h4 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        Daily Token: <span className="text-teal-600">#{confirmedBooking.tokenId}</span>
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                        Please show Token <strong>#{confirmedBooking.tokenId}</strong> when arriving at the chamber.
                      </p>
                    </div>

                    <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3 border border-slate-800">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 text-xs">
                        <span className="font-bold text-teal-300">{clinicSettings.clinicName}</span>
                        <span className="text-slate-400">{clinicSettings.doctorName}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                        <div className="sm:col-span-8 grid grid-cols-2 gap-3 text-xs sm:text-sm">
                          <div>
                            <p className="text-slate-400">Patient Name</p>
                            <p className="font-bold text-white">
                              {confirmedBooking.patientName} ({confirmedBooking.age} yrs)
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400">Daily Serial Token</p>
                            <p className="font-extrabold text-teal-400 text-base">
                              #{confirmedBooking.tokenId}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400">Date & Session</p>
                            <p className="font-bold text-white">
                              {formatReadableDate(confirmedBooking.date)} •{' '}
                              {confirmedBooking.timeSlot}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400">Treatment & Fee</p>
                            <p className="font-bold text-white">
                              {confirmedBooking.serviceName} ({confirmedBooking.serviceFee})
                            </p>
                          </div>
                        </div>

                        {/* Mini Verification QR on Confirmed Token Slip */}
                        <div className="sm:col-span-4 flex flex-col items-center justify-center bg-white p-2.5 rounded-xl text-slate-900 mx-auto">
                          <img
                            src={buildQrImageUrl(
                              `TOKEN:#${confirmedBooking.tokenId}|PATIENT:${confirmedBooking.patientName}|DATE:${confirmedBooking.date}|SLOT:${confirmedBooking.timeSlot}|DR.BANIK`,
                              140
                            )}
                            alt={`Token #${confirmedBooking.tokenId} Verification QR`}
                            className="w-24 h-24 object-contain"
                          />
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 mt-1">
                            Token #{confirmedBooking.tokenId} Pass
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 pt-2 border-t border-slate-800">
                        📍 {clinicSettings.address}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <a
                        href={`https://wa.me/${clinicSettings.whatsapp}?text=${encodeURIComponent(
                          `Namaskar ${clinicSettings.doctorName}, I have booked an appointment at your chamber.\nDaily Token: #${confirmedBooking.tokenId}\nPatient: ${confirmedBooking.patientName} (${confirmedBooking.age} yrs)\nTreatment: ${confirmedBooking.serviceName}\nDate: ${confirmedBooking.date} at ${confirmedBooking.timeSlot}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Send Slip to Chamber WhatsApp</span>
                      </a>
                      <button
                        onClick={() => window.print()}
                        className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Print Slip</span>
                      </button>
                      <button
                        onClick={() => setIsBookingOpen(false)}
                        className="bg-slate-900 dark:bg-teal-600 text-white font-bold py-3.5 px-5 rounded-xl text-sm"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 2: PATIENT LOOKUP & RESCHEDULE MODAL                */}
        {/* ========================================================= */}
        {isLookupModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold">
                    {rescheduleTarget
                      ? `Reschedule Token #${rescheduleTarget.tokenId}`
                      : 'Check Live Token / Cancel or Reschedule'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Search by your 10-digit Mobile Number or Daily Token (e.g. 001)
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsLookupModalOpen(false);
                    setRescheduleTarget(null);
                  }}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                {rescheduleTarget ? (
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm">
                      <p className="font-bold">
                        Patient: {rescheduleTarget.patientName} (Token #{rescheduleTarget.tokenId})
                      </p>
                      <p className="text-slate-500">
                        Current: {formatReadableDate(rescheduleTarget.date)} •{' '}
                        {rescheduleTarget.timeSlot}
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase text-slate-500 block mb-2">
                        Select New Date
                      </label>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {next14Days
                          .filter((d) => !d.isFullBlocked)
                          .map((d) => (
                            <button
                              key={d.dateStr}
                              onClick={() => {
                                setRescheduleDate(d.dateStr);
                                setRescheduleSlot('');
                              }}
                              className={`px-3 py-2 rounded-xl border text-xs font-bold shrink-0 ${
                                rescheduleDate === d.dateStr
                                  ? 'bg-teal-600 text-white border-teal-600'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {d.dayName}, {d.dayNum} {d.monthShort}
                            </button>
                          ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase text-slate-500 block mb-2">
                        Select New Open Slot
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {(rescheduleTarget.isSpecialCase ||
                        rescheduleTarget.serviceCategory === 'special'
                          ? configuredSlots.special
                          : configuredSlots.allRegular
                        ).map((slot) => {
                          const taken = getBookedSlotsForDate(
                            rescheduleDate,
                            rescheduleTarget.id
                          ).has(slot);
                          return (
                            <button
                              key={slot}
                              disabled={taken}
                              onClick={() => setRescheduleSlot(slot)}
                              className={`py-2.5 px-2 rounded-xl border text-xs font-bold ${
                                taken
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 line-through cursor-not-allowed'
                                  : rescheduleSlot === slot
                                  ? 'bg-teal-600 text-white border-teal-600'
                                  : 'bg-white dark:bg-slate-800 hover:border-teal-500 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => setRescheduleTarget(null)}
                        className="text-sm font-bold text-slate-600 px-4 py-2"
                      >
                        ← Back
                      </button>
                      <button
                        disabled={!rescheduleSlot}
                        onClick={handleConfirmReschedule}
                        className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold px-5 py-2.5 rounded-xl text-sm"
                      >
                        Confirm New Slot
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1.5">
                        10-Digit Mobile Number or Token Number (e.g. 001)
                      </label>
                      <input
                        type="text"
                        value={lookupQuery}
                        onChange={(e) => setLookupQuery(e.target.value)}
                        placeholder="Enter 10-digit mobile number or Token (001)..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-base focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div className="space-y-3">
                      {lookupQuery.trim() && matchedLookupAppointments.length === 0 && (
                        <p className="text-xs text-slate-500 text-center py-4">
                          No matching appointments found.
                        </p>
                      )}
                      {matchedLookupAppointments.map((appt) => (
                        <div
                          key={appt.id}
                          className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="bg-slate-900 text-white text-xs font-extrabold px-2.5 py-1 rounded-md">
                              Token #{appt.tokenId}
                            </span>
                            <span
                              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadgeStyle(
                                appt.status
                              )}`}
                            >
                              {appt.status}
                            </span>
                          </div>
                          <div>
                            <p className="font-bold">{appt.patientName}</p>
                            <p className="text-xs text-teal-700 dark:text-teal-400 font-semibold">
                              {appt.serviceName}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                              {formatReadableDate(appt.date)} at <strong>{appt.timeSlot}</strong> (
                              {appt.session})
                            </p>
                          </div>
                          {appt.status !== 'Cancelled' && appt.status !== 'Completed' && (
                            <div className="flex gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-700">
                              <button
                                onClick={() => {
                                  setRescheduleTarget(appt);
                                  setRescheduleDate(appt.date);
                                }}
                                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2 rounded-xl"
                              >
                                Reschedule Slot
                              </button>
                              <button
                                onClick={() => handleCancelAppointment(appt)}
                                className="bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold px-3 py-2 rounded-xl"
                              >
                                Cancel Booking
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 3: DOCTOR SERVICE & PRICE EDITOR MODAL              */}
        {/* ========================================================= */}
        {isServiceModalOpen && editingService && (
          <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <form
              onSubmit={handleSaveServiceItem}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold">
                  {editingService.isNew ? 'Add New Chamber Service' : 'Edit Service & Price'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Service Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingService({
                        ...editingService,
                        category: 'regular',
                        badge: 'Regular Chamber'
                      })
                    }
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border ${
                      editingService.category !== 'special'
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Regular (Morning / Evening)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingService({
                        ...editingService,
                        category: 'special',
                        fee: 'Discussed during checkup',
                        badge: 'Special Case (12–4 PM)'
                      })
                    }
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border ${
                      editingService.category === 'special'
                        ? 'bg-purple-700 text-white border-purple-700'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Special Case (12 PM – 4 PM)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Treatment / Service Name (English) *
                </label>
                <input
                  type="text"
                  required
                  value={editingService.name}
                  onChange={(e) =>
                    setEditingService({ ...editingService, name: e.target.value })
                  }
                  placeholder="e.g., Painless Tooth Extraction"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Price / Fee Display *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingService.fee}
                    onChange={(e) =>
                      setEditingService({ ...editingService, fee: e.target.value })
                    }
                    placeholder="e.g., ₹500 or Discussed during checkup"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Sitting Duration
                  </label>
                  <input
                    type="text"
                    value={editingService.duration}
                    onChange={(e) =>
                      setEditingService({ ...editingService, duration: e.target.value })
                    }
                    placeholder="e.g., 25 mins or 60–90 mins"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Description Shown to Patients
                </label>
                <textarea
                  rows={2}
                  value={editingService.description}
                  onChange={(e) =>
                    setEditingService({ ...editingService, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingService.active !== false}
                  onChange={(e) =>
                    setEditingService({ ...editingService, active: e.target.checked })
                  }
                  className="w-4 h-4 accent-teal-600 rounded"
                />
                <span>Show this service on the Patient Booking Portal</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 4: BLOCK DAY / SESSION MODAL                        */}
        {/* ========================================================= */}
        {isBlockModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold">
                  Block Chamber on {formatReadableDate(adminSelectedDate)}
                </h3>
                <button
                  onClick={() => setIsBlockModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-2">
                  Select Session to Block
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'full', label: 'Full Day' },
                    { id: 'morning', label: 'Morning Only' },
                    { id: 'special', label: 'Special (12–4 PM) Only' },
                    { id: 'evening', label: 'Evening Only' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setBlockScopeInput(opt.id)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-extrabold border ${
                        blockScopeInput === opt.id
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1.5">
                  Notice Shown to Patients
                </label>
                <input
                  type="text"
                  value={blockReasonInput}
                  onChange={(e) => setBlockReasonInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsBlockModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    handleSaveBlockDate(adminSelectedDate, blockScopeInput, blockReasonInput)
                  }
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm"
                >
                  Confirm Block
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 5: ADD WALK-IN PATIENT MODAL                        */}
        {/* ========================================================= */}
        {isWalkInModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
            <form
              onSubmit={handleAddWalkIn}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold">+ Add Walk-In Patient</h3>
                  <p className="text-xs text-teal-600 font-bold">
                    {formatReadableDate(adminSelectedDate)} • Next Token: #
                    {getNextDailyTokenForDate(adminSelectedDate).tokenId}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsWalkInModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={walkInForm.patientName}
                    onChange={(e) =>
                      setWalkInForm({ ...walkInForm, patientName: e.target.value })
                    }
                    placeholder="Full Name"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Age *
                  </label>
                  <input
                    type="number"
                    required
                    value={walkInForm.age}
                    onChange={(e) => setWalkInForm({ ...walkInForm, age: e.target.value })}
                    placeholder="40"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  10-Digit Mobile *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={walkInForm.phone}
                  onChange={(e) => setWalkInForm({ ...walkInForm, phone: e.target.value })}
                  placeholder="10-digit mobile"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Treatment
                  </label>
                  <select
                    value={walkInForm.serviceId}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      const sObj = allServices.find((s) => s.id === nextId);
                      setWalkInForm({
                        ...walkInForm,
                        serviceId: nextId,
                        timeSlot:
                          sObj?.category === 'special'
                            ? configuredSlots.special[0]
                            : configuredSlots.morning[0]
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  >
                    {allServices.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.shortName || s.name} ({s.category === 'special' ? 'Special' : 'Regular'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Slot
                  </label>
                  <select
                    value={walkInForm.timeSlot}
                    onChange={(e) =>
                      setWalkInForm({ ...walkInForm, timeSlot: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  >
                    {configuredSlots.all.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWalkInModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm"
                >
                  Assign Token & Add
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 6: CLEAN DOCTOR PIN LOGIN MODAL (NO PUBLIC HINTS)   */}
        {/* ========================================================= */}
        {isPinModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
            <form
              onSubmit={handleVerifyPin}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold">Doctor Chamber Access</h3>
                    <p className="text-xs text-slate-500">{clinicSettings.doctorName}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {pinError && (
                <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                  {pinError}
                </p>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1.5">
                  Enter Chamber Security PIN
                </label>
                <input
                  type="password"
                  maxLength={8}
                  autoFocus
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="••••"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-center text-xl font-extrabold tracking-widest focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold py-3 rounded-xl text-sm shadow-md"
              >
                Unlock Chamber Console
              </button>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 7: SCANNABLE BOOKING QR CODE & PRINTABLE A4 STANDEE */}
        {/* ========================================================= */}
        {isQrModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
              {/* Modal Top Bar (Hidden when printing) */}
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold">
                      Chamber Booking QR Code & Reception Standee
                    </h3>
                    <p className="text-xs text-slate-300">
                      Scan to book directly or print/download for your chamber counter
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsQrModalOpen(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-5 max-h-[85vh] overflow-y-auto print:max-h-none print:p-0">
                {/* Dual Mode Selector & URL Customizer (Hidden when printing) */}
                <div className="space-y-3 print:hidden">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setQrMode('web')}
                      className={`py-2.5 px-3 rounded-xl font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                        qrMode === 'web'
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Direct Web Booking QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrMode('whatsapp')}
                      className={`py-2.5 px-3 rounded-xl font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                        qrMode === 'whatsapp'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>WhatsApp Instant Booking QR</span>
                    </button>
                  </div>

                  {qrMode === 'web' && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={qrCustomUrlInput}
                        onChange={(e) => setQrCustomUrlInput(e.target.value)}
                        placeholder="Paste your live clinic URL (auto-adds ?book=1)"
                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200"
                      />
                      <button
                        type="button"
                        onClick={handleCopyBookingLink}
                        className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy URL</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* PRINTABLE / SCANNABLE HIGH-CONTRAST WHITE STANDEE CARD */}
                <div className="bg-white text-slate-900 rounded-3xl border-4 border-teal-600 p-6 sm:p-8 shadow-lg text-center space-y-4">
                  <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-900 text-white rounded-2xl p-5">
                    <span className="inline-block bg-teal-500/20 text-teal-200 border border-teal-400/40 text-[11px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-widest mb-1">
                      SCAN QR FOR INSTANT APPOINTMENT TOKEN (#001+)
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold">
                      {clinicSettings.doctorName}
                    </h2>
                    <p className="text-xs sm:text-sm text-teal-200 font-bold mt-0.5">
                      {clinicSettings.degree} • {clinicSettings.experience}
                    </p>
                    <p className="text-xs text-slate-300 mt-0.5">{clinicSettings.clinicName}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-base sm:text-lg font-extrabold text-slate-900">
                      Scan with Phone Camera, Google Lens or WhatsApp
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-teal-800">
                      অ্যাপয়েন্টমেন্ট টোকেন বুক করতে আপনার ফোনের ক্যামেরা দিয়ে QR কোডটি স্ক্যান করুন
                    </p>
                  </div>

                  {/* Crisp White Padded QR Container (Always white even in Dark Mode) */}
                  <div className="bg-white p-4 sm:p-5 rounded-3xl border-4 border-teal-500 inline-block shadow-md">
                    <img
                      src={buildQrImageUrl(activeQrTargetUrl, 360)}
                      alt="Scannable Booking QR Code for Dr. Debashish Banik Dental Chamber"
                      className="w-60 h-60 sm:w-72 sm:h-72 object-contain mx-auto"
                    />
                  </div>

                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-1 rounded-full ${
                        qrMode === 'whatsapp'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-teal-100 text-teal-900 border border-teal-300'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {qrMode === 'whatsapp'
                        ? 'WhatsApp Direct Booking QR'
                        : 'Online Real-Time Slot & Token Booking QR'}
                    </span>
                  </div>

                  {/* Chamber Timings & Location Footer on Standee */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs sm:text-sm space-y-1.5 text-left sm:text-center">
                    <div className="font-extrabold text-slate-900">
                      <span>Morning: {clinicSettings.morningHoursLabel}</span>
                      <span className="mx-2 text-slate-400">|</span>
                      <span>Evening: {clinicSettings.eveningHoursLabel}</span>
                    </div>
                    <p className="font-bold text-purple-800 text-xs">
                      Special Cases (RCT & Cap, Ultrasonic Scaling, Fillings, Braces): 12:00 PM – 04:00 PM (Max 2/Day)
                    </p>
                    <p className="text-xs font-bold text-slate-700 pt-1 border-t border-slate-200">
                      📍 {clinicSettings.address}
                    </p>
                    <p className="text-xs font-extrabold text-teal-800">
                      📞 Chamber Phone / WhatsApp: {clinicSettings.phone}
                    </p>
                  </div>
                </div>

                {/* Action Buttons: Download PNG, Print A4 Standee, or Test Scan Now */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 print:hidden">
                  <button
                    type="button"
                    onClick={handleDownloadQrStandeePng}
                    disabled={isDownloadingQr}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      {isDownloadingQr ? 'Preparing PNG...' : 'Download QR Standee (PNG)'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Reception Standee (A4)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsQrModalOpen(false);
                      openBookingWithService('general-consultation');
                    }}
                    className="bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-700 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-1.5 text-xs sm:text-sm"
                  >
                    <span>Test Scan Action</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <footer className="bg-slate-900 dark:bg-black text-slate-400 py-10 border-t border-slate-800 text-xs sm:text-sm print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-extrabold text-white">{clinicSettings.clinicName}</p>
              <p>
                {clinicSettings.doctorName}, {clinicSettings.degree}
              </p>
              <p className="text-slate-500 mt-0.5">{clinicSettings.address}</p>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={() => openBookingWithService('general-consultation')}
                className="text-teal-400 hover:underline font-bold"
              >
                {t.bookBtn}
              </button>
              <span>•</span>
              <button
                onClick={() => setIsLookupModalOpen(true)}
                className="text-teal-400 hover:underline font-bold"
              >
                {t.checkTokenBtn}
              </button>
              <span>•</span>
              <button
                onClick={handleDoctorAccessClick}
                className="text-slate-400 hover:text-white font-bold flex items-center gap-1"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{viewMode === 'patient' ? 'Doctor Login' : 'Patient View'}</span>
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
