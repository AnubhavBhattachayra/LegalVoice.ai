import { getApps, initializeApp, cert, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Check if Firebase Admin is already initialized
const apps = getApps();
let app;

if (!apps.length) {
  try {
    // Initialize the app
    app = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
    console.log('Firebase Admin initialized');
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
} else {
  app = getApp();
}

// Get Auth and Firestore instances
const auth = getAuth(app);
const firestore = getFirestore(app);

export { auth, firestore }; 