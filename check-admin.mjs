import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, query, orderBy, getDocs, limit } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDKGh6b1MFe1FLaT71Eq1z9wIPN6_4kyTI",
  authDomain: "hossammansourweb-9489f.firebaseapp.com",
  projectId: "hossammansourweb-9489f",
  storageBucket: "hossammansourweb-9489f.firebasestorage.app",
  messagingSenderId: "180761581589",
  appId: "1:180761581589:web:b61585f69488834f59d61c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log('=== Signing in as admin@clinic.com ===');
const cred = await signInWithEmailAndPassword(auth, 'admin@clinic.com', 'admin123456');
console.log('Signed in:', cred.user.email);

// Admin appointments list (exactly what AdminApp fetchData does)
console.log('=== TEST: Admin getAppointments() query (orderBy createdAt desc) ===');
try {
  const q = query(collection(db, 'appointments'), orderBy('createdAt', 'desc'), limit(300));
  const snap = await getDocs(q);
  console.log('OK — total docs:', snap.size);
  snap.docs.forEach(d => {
    const data = d.data();
    console.log(JSON.stringify({
      id: d.id,
      clinicId: data.clinicId,
      clinicName: data.clinicName,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      bookingStatus: data.bookingStatus,
      reservation: data.reservation === true,
      hasPII: Boolean(data.patientName || data.patientPhone),
      createdAt: data.createdAt
    }));
  });
} catch (err) {
  console.log('FAILED:', err.code, '-', err.message);
}
process.exit(0);
