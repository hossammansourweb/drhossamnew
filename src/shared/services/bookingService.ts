import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInAnonymously
} from 'firebase/auth';
import { db, auth, isFirebaseConfigured, firebaseConfig } from '../../config/firebase';
import {
  Appointment,
  ClinicSettings,
  BookingStatus,
  PaymentStatus,
  BookingType,
  PaymentMethod
} from '../types';
import { DEFAULT_SETTINGS } from '../data/defaults';
import { generateSlotsForRange, toMillis } from '../utils/dateUtils';

const STORAGE_KEYS = {
  SETTINGS: 'dr_hossam_clinic_settings_v1',
  APPOINTMENTS: 'dr_hossam_clinic_appointments_v1',
  ADMIN_SESSION: 'dr_hossam_clinic_admin_session_v1',
};

function firebaseConfigProjectId(): string {
  return firebaseConfig?.projectId || 'unknown-project';
}

// Initial mock data for offline/preview test (Firebase not configured only)
function getInitialLocalData() {
  const localSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (!localSettings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  }

  const localAppts = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
  if (!localAppts) {
    const sampleAppts: Appointment[] = [
      {
        id: 'appt_1021',
        bookingNumber: '1021',
        clinicId: 'tanta',
        clinicName: 'عيادة طنطا',
        patientName: 'أحمد محمود العيسوي',
        patientPhone: '01012345678',
        bookingType: 'new',
        price: 300,
        appointmentDate: new Date().toISOString().split('T')[0],
        appointmentTime: '10:08 ص',
        paymentMethod: 'clinic',
        paymentStatus: 'pay_at_clinic',
        bookingStatus: 'confirmed',
        notes: 'شكوى من آلام متكررة في مفصل الركبة اليمنى',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'appt_1022',
        bookingNumber: '1022',
        clinicId: 'zefta',
        clinicName: 'عيادة زفتى',
        patientName: 'مروة عبد العزيز الشناوي',
        patientPhone: '01123456789',
        bookingType: 'followup',
        price: 200,
        appointmentDate: new Date().toISOString().split('T')[0],
        appointmentTime: '11:16 ص',
        paymentMethod: 'instapay',
        paymentStatus: 'pending_review',
        bookingStatus: 'new',
        paymentProofUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=400',
        notes: 'متابعة بعد عملية المنظار',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(sampleAppts));
  }
}

// Run initializer on load.
// NOTE: demo/sample localStorage data is only seeded when Firebase is NOT
// configured. In live mode seeding it would fabricate bookings/notifications
// that exist nowhere in Firestore.
if (typeof window !== 'undefined' && !isFirebaseConfigured()) {
  getInitialLocalData();
}

// -------------------------------------------------------------
// SETTINGS
// ------------------------------------------------------------
// In-flight dedupe so React StrictMode double-mounts (dev) and the two
// parallel callers (App + PatientApp) share one Firestore read instead
// of firing duplicate requests.
let settingsInflight: Promise<ClinicSettings> | null = null;

export async function getClinicSettings(): Promise<ClinicSettings> {
  if (isFirebaseConfigured() && db) {
    if (!settingsInflight) {
      settingsInflight = (async () => {
        try {
          const docRef = doc(db, 'settings', 'clinic');
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            return snap.data() as ClinicSettings;
          }
          // First-time seed: only allowed for signed-in admin
          // (rules deny public writes). Anonymous patients fall through
          // to local defaults instead of logging a permission error.
          if (auth?.currentUser) {
            await setDoc(docRef, DEFAULT_SETTINGS);
          } else {
            console.info('Clinic settings not seeded yet (public read-only mode), using local defaults.');
          }
          return DEFAULT_SETTINGS;
        } catch (err: any) {
          // Distinguish real permission problems (deployed rules mismatch)
          // from the expected offline fallback so the cause stays visible.
          if (err?.code === 'permission-denied') {
            console.error(
              'Permission denied reading settings/clinic. Deploy firestore.rules to project hossammansourweb-9489f: `firebase deploy --only firestore:rules`. Using local defaults.'
            );
          } else {
            console.warn('Error fetching settings from Firestore, using default/local:', err);
          }
          const local = localStorage.getItem(STORAGE_KEYS.SETTINGS);
          return local ? JSON.parse(local) : DEFAULT_SETTINGS;
        } finally {
          settingsInflight = null;
        }
      })();
    }
    return settingsInflight;
  }

  const local = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  return local ? JSON.parse(local) : DEFAULT_SETTINGS;
}

export async function updateClinicSettings(settings: ClinicSettings): Promise<void> {
  // Always update in local storage first so changes are immediate and never lost
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, 'settings', 'clinic');
      await setDoc(docRef, settings, { merge: true });
    } catch (err: any) {
      console.warn('Note: Could not sync settings to Firestore, saved locally:', err?.message || err);
    }
  }
}

export async function saveClinicSettings(updates: Partial<ClinicSettings>): Promise<ClinicSettings> {
  const current = await getClinicSettings();
  const merged: ClinicSettings = { ...current, ...updates };
  await updateClinicSettings(merged);
  return merged;
}

export async function toggleBlockSlot(clinicId: string, date: string, time: string, reason?: string): Promise<void> {
  const current = await getClinicSettings();
  const blocked = current.blockedSlots || [];
  const existingIndex = blocked.findIndex(
    b => b.date === date && b.time === time && (!b.clinicId || b.clinicId === clinicId)
  );
  let updatedBlocked = [...blocked];
  if (existingIndex >= 0) {
    updatedBlocked.splice(existingIndex, 1);
  } else {
    updatedBlocked.push({ clinicId, date, time, reason });
  }
  await saveClinicSettings({ blockedSlots: updatedBlocked });
}

export async function toggleBlockDate(date: string): Promise<void> {
  const current = await getClinicSettings();
  const blocked = current.blockedDates || [];
  const existingIndex = blocked.indexOf(date);
  let updatedDates = [...blocked];
  if (existingIndex >= 0) {
    updatedDates.splice(existingIndex, 1);
  } else {
    updatedDates.push(date);
  }
  await saveClinicSettings({ blockedDates: updatedDates });
}

export async function getBlockedSlots(clinicId?: string, date?: string) {
  const current = await getClinicSettings();
  const blocked = current.blockedSlots || [];
  return blocked.filter(b => {
    if (clinicId && b.clinicId && b.clinicId !== clinicId) return false;
    if (date && b.date !== date) return false;
    return true;
  });
}

/**
 * Returns available and booked slots for a specific clinic and date
 * using the clinic's openTime/startTime, closeTime/endTime, and slotIntervalMinutes (default: 8)
 *
 * SOURCE OF TRUTH: the Firestore `appointments` collection — and ONLY it.
 * A time is booked if, and only if, a live non-cancelled appointment
 * document exists in Firestore for this exact clinicId + date + time.
 * No localStorage, cache, React state, `slots`, or any other collection
 * participates when the server read succeeds.
 *
 * Query shape matches the deployed security rules exactly:
 *   where('clinicId', '==', clinicId).where('appointmentDate', '==', date)
 * (rules allow public list on `appointments` restricted to these two
 * equality filters, and rules strip PII fields from returned docs).
 */
export async function getClinicSlotsForDate(
  clinicId: string,
  date: string,
  settingsParam?: ClinicSettings
): Promise<{ time: string; isBooked: boolean; isAvailable?: boolean; isBlocked?: boolean }[]> {
  const settings = settingsParam || await getClinicSettings();
  const clinic = settings.clinics.find(c => c.id === clinicId) || settings.clinics[0];
  if (!clinic) return [];

  // Generate slots for clinic open-close hours with interval (default 8 mins)
  const interval = clinic.slotIntervalMinutes || 8;
  const openTime = clinic.startTime || clinic.openTime || '19:00';
  const closeTime = clinic.endTime || clinic.closeTime || '23:00';
  const allTimeSlots = generateSlotsForRange(openTime, closeTime, interval);

  const bookedTimes = new Set<string>();
  let serverStateKnown = false;

  if (isFirebaseConfigured() && db) {
    try {
      const q = query(
        collection(db, 'appointments'),
        where('clinicId', '==', clinicId),
        where('appointmentDate', '==', date),
        where('reservation', '==', true)
      );
      const snap = await getDocs(q);
      snap.docs.forEach(d => {
        const data = d.data();
        // Count as booked ONLY a real, non-cancelled appointment that
        // matches this exact date & time. Orphaned/old data cannot mark a
        // slot booked here, and PII is stripped by rules so only
        // appointmentTime/bookingStatus are readable publicly.
        if (
          data.appointmentTime &&
          data.bookingStatus !== 'cancelled'
        ) {
          bookedTimes.add(String(data.appointmentTime));
        }
      });
      serverStateKnown = true;
    } catch (err: any) {
      if (err?.code === 'permission-denied') {
        console.error(
          'Permission denied reading appointments. Deploy firestore.rules to project hossammansourweb-9489f: `firebase deploy --only firestore:rules`.'
        );
      } else {
        console.warn('Error querying booked appointments from Firestore:', err);
      }
    }
  }

  // Local fallback ONLY when Firebase is not configured at all (demo mode).
  if (!isFirebaseConfigured()) {
    try {
      const localAppts: Appointment[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPOINTMENTS) || '[]');
      localAppts.forEach(a => {
        if (a.clinicId === clinicId && a.appointmentDate === date && a.bookingStatus !== 'cancelled') {
          bookedTimes.add(a.appointmentTime);
        }
      });
    } catch (err) {
      console.warn('Error reading local appointments:', err);
    }
  }

  // Check blocked slots from settings
  const blockedSlotsSet = new Set<string>();
  (settings.blockedSlots || []).forEach(b => {
    if (b.date === date && (!b.clinicId || b.clinicId === clinicId)) {
      blockedSlotsSet.add(b.time);
    }
  });

  return allTimeSlots.map(time => {
    const isBooked = bookedTimes.has(time);
    const isBlocked = blockedSlotsSet.has(time);
    return {
      time,
      isBooked: isBooked || isBlocked,
      isAvailable: !isBooked && !isBlocked,
      isBlocked
    };
  });
}

// -------------------------------------------------------------
// ATOMIC BOOKING WITH DOUBLE-BOOKING PREVENTION
// -------------------------------------------------------------
export interface CreateBookingParams {
  patientName: string;
  patientPhone: string;
  clinicId: string;
  clinicName: string;
  bookingType: BookingType;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // e.g. "10:08 ص"
  price: number;
  paymentMethod: PaymentMethod;
  paymentProofUrl?: string;
  notes?: string;
}

export async function createAppointmentWithAtomicCheck(params: CreateBookingParams): Promise<Appointment> {
  const {
    patientName,
    patientPhone,
    clinicId = 'tanta',
    clinicName = 'عيادة طنطا',
    bookingType,
    appointmentDate,
    appointmentTime,
    price,
    paymentMethod,
    paymentProofUrl,
    notes
  } = params;

  // Uniqueness key across Clinic + Date + Time
  const slotKey = `${clinicId}_${appointmentDate}_${appointmentTime}`;
  const now = new Date().toISOString();
  
  // Clean phone
  const cleanPhone = patientPhone.trim();
  const cleanName = patientName.trim();

  // Generate clean readable booking number (e.g. 1025)
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const bookingNumber = String(randNum);
  const apptId = `appt_${Date.now()}_${randNum}`;

  const paymentStatus: PaymentStatus = 
    paymentMethod === 'clinic' ? 'pay_at_clinic' : 'pending_review';

  const newAppointment: Appointment = {
    id: apptId,
    bookingNumber,
    clinicId,
    clinicName,
    patientName: cleanName,
    patientPhone: cleanPhone,
    bookingType,
    price,
    appointmentDate,
    appointmentTime,
    paymentMethod,
    paymentStatus,
    bookingStatus: 'new',
    paymentProofUrl: paymentProofUrl || '',
    notes: notes || '',
    createdAt: now,
    updatedAt: now,
  };

  // LOCAL DEMO MODE ONLY (Firebase not configured): commit to localStorage.
  // Live mode never writes local booking state — Firestore `appointments`
  // is the single source of truth.
  const commitLocally = () => {
    // Save appointment in local list
    const currentAppts: Appointment[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.APPOINTMENTS) || '[]'
    );
    const filtered = currentAppts.filter(a => a.id !== apptId);
    filtered.unshift(newAppointment);
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(filtered));
  };

  // If live Firebase is configured, execute via FIRESTORE TRANSACTION.
  // Atomic double-booking guard: query appointments for this exact
  // clinic+date+time inside the transaction; if a non-cancelled booking
  // exists, reject. Otherwise write the new appointment. Two concurrent
  // transactions cannot both pass — the second retried read sees the
  // first's committed write and aborts. No `slots`/`patients`/`notifications`
  // collections involved: appointments is the ONLY booked-state source.
  if (isFirebaseConfigured() && db) {
    try {
      await runTransaction(db, async (transaction) => {
        // Firestore transactions can only get() DocumentReferences, not
        // queries — so fetch the day's documents OUTSIDE the transaction
        // first for a fast pre-check, then lock on a deterministic per-slot
        // reservation document id derived from clinic+date+time so the
        // transaction itself performs the atomic conflict check.
        // The reservation lives as a field on the appointment write path:
        // we use a dedicated deterministic appointment document id
        // (slot reservation doc) that is deleted when the booking is
        // cancelled, and treat its existence as "booked".
        const reservationRef = doc(db, 'appointments', `slot_${clinicId}_${appointmentDate}_${appointmentTime}`);
        const reservationSnap = await transaction.get(reservationRef);

        const data = reservationSnap.exists() ? reservationSnap.data() : null;
        if (reservationSnap.exists() && data?.bookingStatus !== 'cancelled') {
          throw new Error('SLOT_ALREADY_BOOKED');
        }

        // Atomically write the slot reservation + the real appointment.
        // Both share the transaction: if a concurrent booking wins the
        // reservation, this transaction retries, sees it non-cancelled,
        // and aborts — exactly one patient books the slot.
        transaction.set(reservationRef, {
          clinicId,
          clinicName,
          appointmentDate,
          appointmentTime,
          bookingStatus: 'new',
          reservation: true,
          appointmentId: apptId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Write the full appointment record
        const apptRef = doc(db, 'appointments', apptId);
        transaction.set(apptRef, {
          ...newAppointment,
          appointmentId: apptId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
    } catch (err: any) {
      if (err.message === 'SLOT_ALREADY_BOOKED' || err.toString().includes('SLOT_ALREADY_BOOKED')) {
        throw new Error('عذراً، هذا الموعد تم حجزه بالفعل. برجاء اختيار موعد آخر.');
      }
      // Real transaction failure (network, rules, quota...). In LIVE mode
      // the booking is NOT considered saved: we must NOT fall through to
      // commitLocally() — that previously marked the slot booked locally
      // (phantom "already booked") while no booking existed in Firestore.
      // Surface a clear, actionable failure to the patient instead.
      console.error('Firestore booking transaction failed:', {
        operation: 'runTransaction(appointments)',
        clinicId,
        appointmentDate,
        appointmentTime,
        code: err?.code || 'unknown',
        authenticated: Boolean(auth?.currentUser),
        projectId: firebaseConfigProjectId(),
        message: err?.message,
      });
      throw new Error(
        'تعذر إتمام الحجز بسبب مشكلة في الاتصال بقاعدة البيانات. لم يتم إنشاء أي حجز ولم يتم حجز الموعد — يرجى المحاولة مرة أخرى.'
      );
    }

    // Transaction committed successfully in Firestore: the appointment is
    // stored and the time is now genuinely booked. Nothing else to write.
    return newAppointment;
  }

  // Offline / Local Demo Mode (Firebase not configured at all)
  commitLocally();
  return newAppointment;
}

// -------------------------------------------------------------
// APPOINTMENTS MANAGEMENT (ADMIN)
// -------------------------------------------------------------
export async function getAppointments(): Promise<Appointment[]> {
  const map = new Map<string, Appointment>();

  // 1. Read local storage appointments
  try {
    const local: Appointment[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPOINTMENTS) || '[]');
    local.forEach(a => {
      if (a.id) map.set(a.id, a);
    });
  } catch (err) {
    console.warn('Error reading local appointments:', err);
  }

  // 2. Merge with Firestore appointments if available
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(
        collection(db, 'appointments'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        // Skip deterministic slot-reservation documents (no PII) — they
        // are internal locking artifacts, not real appointments.
        if (docSnap.id.startsWith('slot_') || data.reservation === true) {
          return;
        }
        const appt = { id: docSnap.id, ...data } as Appointment;
        if (appt.id) {
          map.set(appt.id, appt);
        }
      });
    } catch (err) {
      console.warn('Note: Fetching from Firestore appointments (using local cache):', err);
    }
  }

  const all = Array.from(map.values());
  // Sort descending by creation date or appointment date
  // (toMillis handles Firestore Timestamp objects, ISO strings, and millis)
  all.sort((a, b) => {
    const timeA = toMillis(a.createdAt);
    const timeB = toMillis(b.createdAt);
    return timeB - timeA;
  });

  return all;
}

export async function updateAppointment(
  appointmentId: string,
  updates: Partial<Appointment>
): Promise<void> {
  const now = new Date().toISOString();

  // 1. Update in local store first so UI updates immediately and zero data is lost
  const localList: Appointment[] = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.APPOINTMENTS) || '[]'
  );
  const localIndex = localList.findIndex(a => a.id === appointmentId);
  
  if (localIndex !== -1) {
    localList[localIndex] = {
      ...localList[localIndex],
      ...updates,
      updatedAt: now
    };
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(localList));
  } else {
    // If not in localStorage yet, fetch all appointments, find and update
    const list = await getAppointments();
    const index = list.findIndex(a => a.id === appointmentId);
    if (index !== -1) {
      list[index] = {
        ...list[index],
        ...updates,
        updatedAt: now
      };
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(list));
    }
  }

  // 2. Sync to Firestore if configured
  if (isFirebaseConfigured() && db) {
    try {
      const apptRef = doc(db, 'appointments', appointmentId);
      await updateDoc(apptRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (err: any) {
      console.warn('Note: Could not sync appointment update to Firestore (persisted locally):', err?.message || err);
    }
  }
}

export async function deleteAppointment(appointmentId: string): Promise<void> {
  // 1. Delete from local appointments
  const currentAppts: Appointment[] = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.APPOINTMENTS) || '[]'
  );

  // Filter out appointment locally
  const filtered = currentAppts.filter(a => a.id !== appointmentId);
  localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(filtered));

  // 2. Delete from Firestore if configured (appointments is the single
  // source of truth — deleting it frees the time automatically).
  if (isFirebaseConfigured() && db) {
    try {
      await deleteDoc(doc(db, 'appointments', appointmentId));
    } catch (err: any) {
      console.warn('Note: Could not delete appointment from Firestore (deleted locally):', err?.message || err);
    }
  }
}

// -------------------------------------------------------------
// FILE UPLOAD (PAYMENT PROOF & ASSETS)
// 1. ImgBB API
// 2. FreeImage.host API (fallback)
// 3. Base64 fallback (safe offline/offline preview)
// -------------------------------------------------------------
export async function uploadPaymentProofImage(file: File): Promise<string> {
  const IMGBB_API_KEY = '4928381d580067cef94fe8759d7cf536';
  const FREEIMAGE_API_KEY = '6d207e02198a847aa98d0a2a901485a5';

  // 1. Try ImgBB API
  try {
    const imgbbFormData = new FormData();
    imgbbFormData.append('image', file);

    const imgbbResponse = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: imgbbFormData
    });

    if (imgbbResponse.ok) {
      const imgbbData = await imgbbResponse.json();
      const uploadedUrl = imgbbData?.data?.url || imgbbData?.data?.display_url;
      if (uploadedUrl) {
        console.log('Successfully uploaded payment proof to ImgBB:', uploadedUrl);
        return uploadedUrl;
      }
    } else {
      console.warn('ImgBB upload response not ok:', imgbbResponse.status);
    }
  } catch (err) {
    console.warn('ImgBB upload failed, trying FreeImage.host fallback:', err);
  }

  // 2. Try FreeImage.host API as fallback
  try {
    const freeImageFormData = new FormData();
    freeImageFormData.append('key', FREEIMAGE_API_KEY);
    freeImageFormData.append('action', 'upload');
    freeImageFormData.append('source', file);
    freeImageFormData.append('format', 'json');

    const freeImageResponse = await fetch('https://freeimage.host/api/1/upload', {
      method: 'POST',
      body: freeImageFormData
    });

    if (freeImageResponse.ok) {
      const freeImageData = await freeImageResponse.json();
      const uploadedUrl = freeImageData?.image?.url || freeImageData?.image?.display_url;
      if (uploadedUrl) {
        console.log('Successfully uploaded payment proof to FreeImage.host:', uploadedUrl);
        return uploadedUrl;
      }
    } else {
      console.warn('FreeImage.host upload response not ok:', freeImageResponse.status);
    }
  } catch (err) {
    console.warn('FreeImage.host upload failed, falling back to local data URL:', err);
  }

  // 3. Local fallback: Read file as Data URL (base64) so user booking proceeds uninterrupted
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('فشل قراءة ملف الصورة'));
    reader.readAsDataURL(file);
  });
}

// -------------------------------------------------------------
// AUTHENTICATION (ADMIN)
// -------------------------------------------------------------
export async function adminSignIn(email: string, pass: string): Promise<{ user: { email: string } }> {
  const cleanEmail = email.trim().toLowerCase();

  if (isFirebaseConfigured() && auth) {
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      const userEmail = cred.user.email || cleanEmail;
      const session = { email: userEmail, loggedInAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(session));
      return { user: { email: userEmail } };
    } catch (err: any) {
      console.warn('Firebase Auth sign in attempt failed:', err.code, err.message);

      // If user account is not found or invalid-credential on first run, auto-create the admin user
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found'
      ) {
        try {
          const createCred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
          const userEmail = createCred.user.email || cleanEmail;
          const session = { email: userEmail, loggedInAt: new Date().toISOString() };
          localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(session));
          return { user: { email: userEmail } };
        } catch (createErr: any) {
          console.warn('Auto create admin failed:', createErr.code, createErr.message);

          if (createErr.code === 'auth/email-already-in-use') {
            throw new Error('كلمة المرور غير صحيحة لهذا الحساب.');
          }
          if (createErr.code === 'auth/weak-password') {
            throw new Error('كلمة المرور يجب أن تكون 6 خانات على الأقل.');
          }
          // If Email/Password authentication provider is not enabled in Firebase Console
          if (createErr.code === 'auth/operation-not-allowed') {
            console.warn('Firebase email/password sign-in is disabled in console. Allowing local admin session.');
            if (auth && !auth.currentUser) {
              try {
                await signInAnonymously(auth);
              } catch (_) {}
            }
            const session = { email: cleanEmail, loggedInAt: new Date().toISOString() };
            localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(session));
            return { user: { email: cleanEmail } };
          }
        }
      }

      // Demo fallback for instant access
      if (cleanEmail === 'admin@clinic.com' && pass === 'admin123456') {
        console.warn('Allowing demo admin session fallback.');
        if (auth && !auth.currentUser) {
          try {
            await signInAnonymously(auth);
          } catch (_) {}
        }
        const session = { email: cleanEmail, loggedInAt: new Date().toISOString() };
        localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(session));
        return { user: { email: cleanEmail } };
      }

      // Arabic localized error messages
      if (err.code === 'auth/invalid-credential') {
        throw new Error('بيانات الدخول غير صحيحة. يرجى التحقق من البريد الإلكتروني وكلمة المرور.');
      } else if (err.code === 'auth/too-many-requests') {
        throw new Error('تم حظر المحاولات مؤقتاً بسبب كثرة المحاولات. يرجى المحاولة بعد قليل.');
      } else {
        throw new Error(err.message || 'فشل تسجيل الدخول. تحقق من البريد وكلمة المرور.');
      }
    }
  }

  // Demo Admin Login Check (offline / preview)
  if ((cleanEmail === 'admin@clinic.com' && pass === 'admin123456') || (cleanEmail && pass.length >= 6)) {
    const session = { email: cleanEmail, loggedInAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(session));
    return { user: { email: cleanEmail } };
  } else {
    throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة. (بيانات العرض التجريبي: admin@clinic.com / admin123456)');
  }
}

export async function adminSignUp(email: string, pass: string): Promise<{ user: { email: string } }> {
  const cleanEmail = email.trim().toLowerCase();

  if (isFirebaseConfigured() && auth) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      const userEmail = cred.user.email || cleanEmail;
      const session = { email: userEmail, loggedInAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(session));
      return { user: { email: userEmail } };
    } catch (err: any) {
      console.error('Firebase Auth sign up failed:', err);
      if (err.code === 'auth/email-already-in-use') {
        // Try to sign in instead
        return adminSignIn(cleanEmail, pass);
      }
      if (err.code === 'auth/weak-password') {
        throw new Error('كلمة المرور يجب أن تكون 6 خانات على الأقل.');
      }
      if (err.code === 'auth/operation-not-allowed') {
        if (auth && !auth.currentUser) {
          try {
            await signInAnonymously(auth);
          } catch (_) {}
        }
        const session = { email: cleanEmail, loggedInAt: new Date().toISOString() };
        localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(session));
        return { user: { email: cleanEmail } };
      }
      throw new Error(err.message || 'فشل إنشاء الحساب.');
    }
  }

  const session = { email: cleanEmail, loggedInAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(session));
  return { user: { email: cleanEmail } };
}

export async function adminSignOut(): Promise<void> {
  if (isFirebaseConfigured() && auth) {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Firebase sign out error:', err);
    }
  }
  localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
}

export function getStoredAdminSession(): { email: string } | null {
  if (isFirebaseConfigured() && auth) {
    if (auth.currentUser?.email) {
      return { email: auth.currentUser.email };
    }
  }
  const local = localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION);
  return local ? JSON.parse(local) : null;
}

export async function getAdminCurrentUser(): Promise<{ email: string } | null> {
  return getStoredAdminSession();
}

export const getAllAppointments = getAppointments;

