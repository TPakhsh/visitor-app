import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/analytics'; // اختیاری

// ============== اطلاعات پیکربندی Firebase شما ==============
const firebaseConfig = {
  apiKey: "AIzaSyAOR8pucoPj9xEnuuKdQyG72YdBzcRwMXE",
  authDomain: "visitorreportapp.firebaseapp.com",
  projectId: "visitorreportapp",
  storageBucket: "visitorreportapp.firebasestorage.app",
  messagingSenderId: "328308200277",
  appId: "1:328308200277:web:de07037a934ab15d8655dc",
  measurementId: "G-9ZFQ590XWY"
};
// ==========================================================

let app;
if (!firebase.apps.length) {
  app = firebase.initializeApp(firebaseConfig);
} else {
  app = firebase.app(); 
}

const auth = firebase.auth();
const db = firebase.firestore();
const FieldValue = firebase.firestore.FieldValue;
let analytics;
if (firebaseConfig.measurementId) {
    analytics = firebase.analytics();
}

export { auth, db, analytics, FieldValue };