import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, Auth } from 'firebase/auth';
import { getFirestore, Firestore, enableNetwork, disableNetwork } from 'firebase/firestore';

// Log all environment variables for debugging
if (process.env.NODE_ENV === 'development') {
  console.log('Firebase Config:', {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  });
  
  console.log('Environment Check:', {
    NODE_ENV: process.env.NODE_ENV,
    allEnvKeys: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')),
    isClient: typeof window !== 'undefined'
  });
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Validate environment variables
Object.entries(firebaseConfig).forEach(([key, value]) => {
  if (!value) {
    console.warn(`Missing environment variable for ${key}`);
  }
});

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore | null = null;

if (typeof window !== 'undefined') {
  try {
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      throw new Error('Required Firebase configuration is missing. Check your environment variables.');
    }

    // Initialize Firebase app if not already initialized
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    
    // Initialize Firestore and Auth
    db = getFirestore(app);
    auth = getAuth(app);

    // Set persistence to local
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error('Error setting auth persistence:', error);
    });

    // Enable offline persistence for Firestore
    if (typeof window !== 'undefined') {
      // Firestore automatically enables offline persistence in web apps
      console.log('Firestore offline persistence enabled');
    }

    console.log('Firebase services initialized:', {
      hasAuth: !!auth,
      hasDb: !!db,
      projectId: firebaseConfig.projectId
    });
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
} else {
  // For server-side, we'll use a dummy implementation
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
  console.log('Firebase initialization skipped - running on server');
}

export { app, auth, db }; 