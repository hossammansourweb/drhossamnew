import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, query, where, orderBy, getDocs, limit, doc, getDoc } from 'firebase/firestore';

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
const auth = getAuth(app);
const today = new Date().toISOString().split('T')[0];

console.log('=== T1: anon availability query + limit(200) ===');
try {
  const q = query(collection(db,'appointments'), where('clinicId','==','tanta'), where('appointmentDate','==',today), limit(200));
  const s = await getDocs(q);
  console.log('OK — docs:', s.size);
} catch (err) { console.log('FAILED:', err.code); }

console.log('=== T2: anon getDoc slot reservation id (transaction path) ===');
try {
  const s = await getDoc(doc(db,'appointments', `slot_tanta_${today}_19:00 ص`));
  console.log('ALLOWED — exists:', s.exists());
} catch (err) { console.log('DENIED:', err.code); }

console.log('=== signing in admin ===');
await signInWithEmailAndPassword(auth, 'admin@clinic.com', 'admin123456');
console.log('signed in');

console.log('=== T3: admin availability query (no limit) ===');
try {
  const q = query(collection(db,'appointments'), where('clinicId','==','tanta'), where('appointmentDate','==',today));
  const s = await getDocs(q);
  console.log('OK — docs:', s.size);
} catch (err) { console.log('FAILED:', err.code); }

console.log('=== T4: admin orderBy createdAt (dashboard query) ===');
try {
  const q = query(collection(db,'appointments'), orderBy('createdAt','desc'), limit(300));
  const s = await getDocs(q);
  console.log('OK — docs:', s.size);
} catch (err) { console.log('FAILED:', err.code); }

console.log('=== T5: admin getDoc single appointment ===');
try {
  const s = await getDoc(doc(db,'appointments','appt_probe_nonexistent'));
  console.log('OK — exists:', s.exists());
} catch (err) { console.log('FAILED:', err.code); }

process.exit(0);
