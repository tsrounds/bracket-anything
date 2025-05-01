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
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    console.log('Firebase Admin config:', {
      hasProjectId: !!projectId,
      hasClientEmail: !!clientEmail,
      hasPrivateKey: !!privateKey,
      projectId,
      clientEmail: clientEmail ? `${clientEmail.substring(0, 5)}...` : undefined,
      privateKeyPreview: privateKey ? `${privateKey.substring(0, 50)}...` : undefined
    });

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Firebase Admin credentials are missing. Check your environment variables.');
    }

    // Handle different private key formats
    // 1. Remove any surrounding quotes if present
    privateKey = privateKey.replace(/^["']|["']$/g, '');
    
    // 2. Replace escaped newlines with actual newlines if present
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    // 3. Add BEGIN/END markers if they're missing
    if (!privateKey.includes('BEGIN PRIVATE KEY') && !privateKey.includes('END PRIVATE KEY')) {
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
    }

    // 4. Ensure proper newline format
    privateKey = privateKey.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Initialize new instance
    const app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
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
        3. You have added FIREBASE_PROJECT_ID to .env.local
        4. The private key format should be either:
           - Single line with escaped newlines: "-----BEGIN PRIVATE KEY-----\\nYOUR_KEY\\n-----END PRIVATE KEY-----"
           - Multiple lines with actual newlines:
             "-----BEGIN PRIVATE KEY-----
             YOUR_KEY
             -----END PRIVATE KEY-----"
      `);
    }
    throw error;
  }
}

// Export a singleton instance
const adminDb = getFirebaseAdmin();
export { adminDb }; 