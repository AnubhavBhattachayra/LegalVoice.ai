// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDdP0cn4k_YwyPld4A16KTe-elCDYb2YXs",
  authDomain: "legalvoice-ai.firebaseapp.com",
  projectId: "legalvoice-ai",
  storageBucket: "legalvoice-ai.firebasestorage.app",
  messagingSenderId: "215915598409",
  appId: "1:215915598409:web:101e05a9f9ea6e4d426598",
  measurementId: "G-J6Q2SZVYCY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Analytics (only in browser environment)
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { auth, analytics };
export default app; 