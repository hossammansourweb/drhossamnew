import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';

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

console.log('=== anon availability query with limit(200) ===');
try {
  const q = query(collection(db,'appointments'), where('clinicId','==','tanta'), where('appointmentDate','==',today), limit(200));
  const s = await getDocs(q);
  console.log('OK — docs:', s.size, s.docs.map(d=>d.id));
} catch (err) { console.log('FAILED:', err.code); }

console.log('=== try tomorrow (data test) ===');
const tomorrow = new Date(Date.now()+86400000).toISOString().split('T')[0];
try {
  const q = query(collection(db,'appointments'), where('clinicId','==','tanta'), where('appointmentDate','==',tomorrow), limit(200));
  const s = await getDocs(q);
  console.log('OK — docs:', s.size, s.docs.map(d=>d.id));
} catch (err) { console.log('FAILED:', err.code); }

// What does the ACTUAL database contain? Use the admin REST... no, use slot-reservation doc read via public filtered list on a known seeded date: admin earlier query returned 3 docs. Let me read them via admin in check-admin style.
process.exit(0);
