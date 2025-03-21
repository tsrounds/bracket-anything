import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
function getFirebaseAdmin() {
  console.log('Initializing Firebase Admin...');
  
  try {
    // If already initialized, return existing instance
    if (getApps().length > 0) {
      console.log('Firebase Admin already initialized, returning existing instance');
      return getFirestore(getApp());
    }

    // Get environment variables
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    console.log('Firebase Admin config:', {
      hasProjectId: !!projectId,
      hasClientEmail: !!clientEmail,
      hasPrivateKey: !!privateKey,
      projectId,
      clientEmail: clientEmail ? `${clientEmail.substring(0, 5)}...` : undefined
    });

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Firebase Admin credentials are missing. Check your environment variables.');
    }

    // Initialize new instance
    const app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        // Handle both raw and escaped newlines
        privateKey: privateKey.includes('\\n') 
          ? privateKey.replace(/\\n/g, '\n')
          : privateKey,
      }),
    });

    console.log('Firebase Admin initialized successfully with app:', app.name);
    return getFirestore(app);
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    // In development, provide more helpful error message
    if (process.env.NODE_ENV === 'development') {
      console.error(`
        Firebase Admin initialization failed. Please check:
        1. You have added FIREBASE_CLIENT_EMAIL to .env.local
        2. You have added FIREBASE_PRIVATE_KEY to .env.local
        3. You have added NEXT_PUBLIC_FIREBASE_PROJECT_ID to .env.local
        4. The private key is properly formatted (including newlines)
      `);
    }
    throw error;
  }
}

// Export the admin db instance
export const adminDb = getFirebaseAdmin(); 