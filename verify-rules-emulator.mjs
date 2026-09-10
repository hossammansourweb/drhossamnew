// Emulator rules verification — tests every rule path used by the app.
// Run with FIRESTORE_EMULATOR_HOST set (firebase emulators:exec).
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  getFirestore, connectFirestoreEmulator, collection, query, where, orderBy, getDocs,
  doc, getDoc, setDoc, deleteDoc, runTransaction, serverTimestamp, writeBatch, limit
} from 'firebase/firestore';

const firebaseConfig = { apiKey: "test", projectId: "hossammansourweb-9489f" };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
connectFirestoreEmulator(db, '127.0.0.1', 8080);
connectAuthEmulator(auth, 'http://127.0.0.1:9099');

const today = '2099-01-01';
let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log(`PASS: ${name}`); }
  else { fail++; console.log(`FAIL: ${name}`); }
}
async function denied(name, fn) {
  try { await fn(); fail++; console.log(`FAIL (allowed): ${name}`); }
  catch (e) { ok(name, String(e).includes('permission-denied')); }
}

// Seed: a real booked appointment (with PII) + settings
const seedApptId = 'appt_seed_1';
const slotId = `slot_tanta_${today}_19:00 ص`;

console.log('--- seeding as admin (via first write with rules open? no - seed via admin) ---');
// Emulator: sign in as admin via auth emulator and seed.
// Auth emulator has no users; create one via signUp.
const { createUserWithEmailAndPassword } = await import('firebase/auth');
const adminCred = await createUserWithEmailAndPassword(auth, 'admin@test.com', 'test123456').catch(e => e);
if (adminCred?.user) {
  console.log('admin user created:', adminCred.user.email);
} else {
  const signin = await signInWithEmailAndPassword(auth, 'admin@test.com', 'test123456');
  console.log('admin signed in:', signin.user.email);
}

// seed settings + one booked appointment + one slot reservation
await setDoc(doc(db, 'settings', 'clinic'), { doctorName: 'test' });
await setDoc(doc(db, 'appointments', seedApptId), {
  patientName: 'مريض موجود', patientPhone: '01000000000',
  appointmentDate: today, appointmentTime: '19:00 ص',
  clinicId: 'tanta', clinicName: 'عيادة طنطا',
  bookingType: 'new', price: 300, paymentMethod: 'clinic',
  paymentStatus: 'pay_at_clinic', bookingStatus: 'confirmed',
  appointmentId: seedApptId, createdAt: serverTimestamp(), updatedAt: serverTimestamp()
});
await setDoc(doc(db, 'appointments', slotId), {
  appointmentDate: today, appointmentTime: '19:00 ص',
  clinicId: 'tanta', clinicName: 'عيادة طنطا',
  bookingStatus: 'new', reservation: true, appointmentId: seedApptId,
  createdAt: serverTimestamp(), updatedAt: serverTimestamp()
});
console.log('seeded.');

console.log('--- ADMIN tests ---');
{
  const q = query(collection(db, 'appointments'), orderBy('createdAt', 'desc'));
  const s = await getDocs(q);
  ok('admin list orderBy createdAt', s.size >= 2);

  const g = await getDoc(doc(db, 'appointments', seedApptId));
  ok('admin get by id', g.exists());

  const upd = await setDoc(doc(db, 'appointments', seedApptId), { bookingStatus: 'attended' }, { merge: true });
  ok('admin update', true);

  await deleteDoc(doc(db, 'appointments', 'appt_del_me'));
  ok('admin delete (nonexistent ok)', true);

  await setDoc(doc(db, 'settings', 'clinic'), { newBookingPrice: 300 }, { merge: true });
  ok('admin write settings', true);
}

console.log('--- PATIENT (anon) tests ---');
await signOut(auth);
{
  // allowed: clinicId+date filtered list
  const q = query(collection(db, 'appointments'), where('clinicId', '==', 'tanta'), where('appointmentDate', '==', today), limit(200));
  const s = await getDocs(q);
  ok('anon availability list (clinicId+date+limit)', s.size === 2);

  // denied: no filters
  await denied('anon unfiltered list denied', () => getDocs(collection(db, 'appointments')));

  // denied: single-field filter
  await denied('anon single-filter list denied', () =>
    getDocs(query(collection(db, 'appointments'), where('clinicId', '==', 'tanta'))));

  // denied: get by id (PII)
  await denied('anon get by id denied', () => getDoc(doc(db, 'appointments', seedApptId)));

  // allowed: settings read
  const st = await getDoc(doc(db, 'settings', 'clinic'));
  ok('anon settings read', st.exists());

  // denied: settings write
  await denied('anon settings write denied', () =>
    setDoc(doc(db, 'settings', 'clinic'), { newBookingPrice: 1 }, { merge: true }));

  // denied: update existing appointment
  await denied('anon update appointment denied', () =>
    setDoc(doc(db, 'appointments', seedApptId), { bookingStatus: 'cancelled' }, { merge: true }));

  // denied: delete
  await denied('anon delete appointment denied', () => deleteDoc(doc(db, 'appointments', seedApptId)));

  // denied: INVALID booking create (bookingStatus != 'new')
  await denied('anon create invalid booking (status) denied', () =>
    setDoc(doc(db, 'appointments', 'appt_bad_1'), {
      patientName: 'x', patientPhone: '01000000000',
      appointmentDate: today, appointmentTime: '20:00 ص',
      clinicId: 'tanta', clinicName: 'عيادة طنطا',
      bookingType: 'new', price: 300, paymentMethod: 'clinic',
      paymentStatus: 'pay_at_clinic', bookingStatus: 'confirmed',
      appointmentId: 'appt_bad_1', createdAt: serverTimestamp(), updatedAt: serverTimestamp()
    }));

  // denied: booking create missing appointmentId match
  await denied('anon create booking (id mismatch) denied', () =>
    setDoc(doc(db, 'appointments', 'appt_bad_2'), {
      patientName: 'x', patientPhone: '01000000000',
      appointmentDate: today, appointmentTime: '20:00 ص',
      clinicId: 'tanta', clinicName: 'عيادة طنطا',
      bookingType: 'new', price: 300, paymentMethod: 'clinic',
      paymentStatus: 'pay_at_clinic', bookingStatus: 'new',
      appointmentId: 'something-else', createdAt: serverTimestamp(), updatedAt: serverTimestamp()
    }));

  // denied: reservation with PII
  await denied('anon create reservation with PII denied', () =>
    setDoc(doc(db, 'appointments', `slot_tanta_${today}_20:00 ص`), {
      patientName: 'x', patientPhone: '01000000000',
      appointmentDate: today, appointmentTime: '20:00 ص',
      clinicId: 'tanta', clinicName: 'عيادة طنطا',
      bookingStatus: 'new', reservation: true,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp()
    }));

  // allowed: VALID booking create
  try {
    await setDoc(doc(db, 'appointments', 'appt_ok_1'), {
      patientName: 'مريض جديد', patientPhone: '01111111111',
      appointmentDate: today, appointmentTime: '21:00 ص',
      clinicId: 'tanta', clinicName: 'عيادة طنطا',
      bookingType: 'new', price: 300, paymentMethod: 'clinic',
      paymentStatus: 'pay_at_clinic', bookingStatus: 'new',
      appointmentId: 'appt_ok_1', createdAt: serverTimestamp(), updatedAt: serverTimestamp()
    });
    ok('anon create valid booking allowed', true);
  } catch (e) { fail++; console.log('FAIL (denied):', 'anon create valid booking allowed', e.code); }
}

console.log('--- DOUBLE BOOKING TRANSACTION test (two parallel) ---');
{
  const mkTx = async (name, phone) => {
    const resvRef = doc(db, 'appointments', `slot_tanta_${today}_22:00 ص`);
    return runTransaction(db, async (tx) => {
      const snap = await tx.get(resvRef);
      if (snap.exists() && snap.data()?.bookingStatus !== 'cancelled') {
        throw new Error('SLOT_ALREADY_BOOKED');
      }
      const apptId = `appt_${Date.now()}_${Math.floor(Math.random()*9000)}`;
      tx.set(resvRef, {
        appointmentDate: today, appointmentTime: '22:00 ص',
        clinicId: 'tanta', clinicName: 'عيادة طنطا',
        bookingStatus: 'new', reservation: true, appointmentId: apptId,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp()
      });
      tx.set(doc(db, 'appointments', apptId), {
        patientName: name, patientPhone: phone,
        appointmentDate: today, appointmentTime: '22:00 ص',
        clinicId: 'tanta', clinicName: 'عيادة طنطا',
        bookingType: 'new', price: 300, paymentMethod: 'clinic',
        paymentStatus: 'pay_at_clinic', bookingStatus: 'new',
        appointmentId: apptId, createdAt: serverTimestamp(), updatedAt: serverTimestamp()
      });
      return apptId;
    });
  };
  const results = await Promise.allSettled([mkTx('مريض أ', '01011111111'), mkTx('مريض ب', '01022222222')]);
  const succeeded = results.filter(r => r.status === 'fulfilled');
  const rejected = results.filter(r => r.status === 'rejected');
  ok('exactly one parallel transaction wins', succeeded.length === 1 && rejected.length === 1);
  if (succeeded.length === 1) console.log('  winner:', succeeded[0].value);
}

console.log(`\n=== RESULTS: ${pass} passed, ${fail} failed ===`);
process.exit(fail > 0 ? 1 : 0);
