// Reproduces the exact Firestore operations the patient/admin pages perform
// against the LIVE deployed rules, so we can see the real permission errors.
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDKGh6b1MFe1FLaT71Eq1z9wIPN6_4kyTI",
  authDomain: "hossammansourweb-9489f.firebaseapp.com",
  projectId: "hossammansourweb-9489f",
  storageBucket: "hossammansourweb-9489f.firebasestorage.app",
  messagingSenderId: "180761581589",
  appId: "1:180761581589:web:b61585f69488834f59d61c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const today = new Date().toISOString().split('T')[0];

// 1. Patient page public availability query (SlotPicker)
console.log('=== TEST 1: Patient availability query (clinicId+date on appointments) ===');
try {
  const q = query(collection(db, 'appointments'), where('clinicId', '==', 'tanta'), where('appointmentDate', '==', today));
  const snap = await getDocs(q);
  console.log('OK — docs:', snap.docs.map(d => d.id));
} catch (err) {
  console.log('FAILED:', err.code, '-', err.message);
}

// 1b. Same query without filters (what rules must deny)
console.log('=== TEST 1b: Unfiltered appointments query (should be denied publicly) ===');
try {
  const snap = await getDocs(collection(db, 'appointments'));
  console.log('UNEXPECTEDLY ALLOWED — docs:', snap.size);
} catch (err) {
  console.log('DENIED (expected):', err.code);
}

// 2. Settings read (patient + admin)
console.log('=== TEST 2: settings/clinic read ===');
try {
  const snap = await getDoc(doc(db, 'settings', 'clinic'));
  console.log('OK — exists:', snap.exists());
} catch (err) {
  console.log('FAILED:', err.code, '-', err.message);
}

// 3. Admin list query (getAppointments uses orderBy createdAt)
console.log('=== TEST 3: Admin appointments orderBy createdAt (anonymous — expect deny) ===');
try {
  const q = query(collection(db, 'appointments'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  console.log('ALLOWED — docs:', snap.size);
} catch (err) {
  console.log('RESULT:', err.code);
}

process.exit(0);
