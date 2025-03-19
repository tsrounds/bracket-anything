import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// Log all environment variables for debugging
console.log('Environment Variables Check:', {
  NODE_ENV: process.env.NODE_ENV,
  allEnvKeys: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')),
  FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 5) + '...',
  FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
});

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app: firebase.app.App;
let auth: firebase.auth.Auth;
let db: firebase.firestore.Firestore;

if (typeof window !== 'undefined') {
  try {
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      throw new Error('Required Firebase configuration is missing. Check your environment variables.');
    }

    // Initialize Firebase
    if (!firebase.apps.length) {
      app = firebase.initializeApp(firebaseConfig);
    } else {
      app = firebase.app();
    }

    console.log('Firebase app initialized:', { 
      projectId: firebaseConfig.projectId,
      existingApps: firebase.apps.length 
    });

    auth = app.auth();
    db = app.firestore();

    // Set persistence to local
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch((error: Error) => {
      console.error('Error setting auth persistence:', error);
    });

    console.log('Firebase services initialized:', {
      hasAuth: !!auth,
      hasDb: !!db
    });
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
} else {
  console.log('Firebase initialization skipped - running on server');
  // Initialize with empty instances for server-side rendering
  app = {} as firebase.app.App;
  auth = {} as firebase.auth.Auth;
  db = {} as firebase.firestore.Firestore;
}

export { app, auth, db }; 