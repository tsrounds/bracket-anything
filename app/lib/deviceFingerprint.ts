import { db } from './firebase/firebase-client';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';

// Initialize ClientJS instance
let clientJSInstance: any | null = null;

async function getClientJS(): Promise<any> {
  if (!clientJSInstance) {
    // Dynamic import to avoid SSR issues and get correct export
    const ClientJSModule = await import('clientjs');
    const ClientJS = ClientJSModule.ClientJS || ClientJSModule.default;
    clientJSInstance = new ClientJS();
  }
  return clientJSInstance;
}

/**
 * Generate device fingerprint using ClientJS
 * @returns Fingerprint string
 */
export async function getDeviceFingerprint(): Promise<string> {
  try {
    const client = await getClientJS();
    const fingerprint = client.getFingerprint().toString();
    return fingerprint;
  } catch (error) {
    console.error('[getDeviceFingerprint] Error generating fingerprint:', error);
    // Fallback to a basic fingerprint if ClientJS fails
    return generateFallbackFingerprint();
  }
}

/**
 * Fallback fingerprint generation if ClientJS fails
 * Combines basic browser properties
 */
function generateFallbackFingerprint(): string {
  const props = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage,
  ].join('|');

  return btoa(props); // Base64 encode
}

/**
 * Hash fingerprint using SHA-256 for privacy
 * @param fingerprint Raw fingerprint string
 * @returns Hashed fingerprint
 */
export async function hashFingerprint(fingerprint: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprint);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (error) {
    console.error('[hashFingerprint] Error hashing fingerprint:', error);
    // Fallback to simple hash
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }
}

/**
 * Check if device has already submitted a specific quiz
 * @param quizId Quiz identifier
 * @returns Boolean indicating if device submitted quiz
 */
export async function hasDeviceSubmittedQuiz(quizId: string): Promise<boolean> {
  if (!db) {
    console.error('[hasDeviceSubmittedQuiz] Firestore not initialized');
    return false;
  }

  try {
    const fingerprint = await getDeviceFingerprint();
    const fingerprintHash = await hashFingerprint(fingerprint);

    const fingerprintRef = doc(db, 'deviceFingerprints', fingerprintHash);
    const fingerprintDoc = await getDoc(fingerprintRef);

    if (!fingerprintDoc.exists()) {
      return false;
    }

    const data = fingerprintDoc.data();
    return data?.quizSubmissions?.includes(quizId) || false;
  } catch (error) {
    console.error('[hasDeviceSubmittedQuiz] Error checking submission:', error);
    return false;
  }
}

/**
 * Record device fingerprint in Firestore
 * Links fingerprint to user and optionally to quiz submission
 * @param userId Firebase user ID
 * @param quizId Optional quiz ID if submitting a quiz
 * @returns Fingerprint hash
 */
export async function recordDeviceFingerprint(
  userId: string,
  quizId?: string
): Promise<string> {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const fingerprint = await getDeviceFingerprint();
    const fingerprintHash = await hashFingerprint(fingerprint);

    const client = await getClientJS();
    const metadata = {
      userAgent: client.getUserAgent(),
      platform: client.getOS() + ' ' + client.getOSVersion(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    const fingerprintRef = doc(db, 'deviceFingerprints', fingerprintHash);
    const existingDoc = await getDoc(fingerprintRef);

    if (existingDoc.exists()) {
      // Update existing fingerprint record
      const updateData: any = {
        lastSeen: Timestamp.now(),
        linkedUsers: arrayUnion(userId),
      };

      if (quizId) {
        updateData.quizSubmissions = arrayUnion(quizId);
      }

      await updateDoc(fingerprintRef, updateData);
      console.log('[recordDeviceFingerprint] Updated existing fingerprint');
    } else {
      // Create new fingerprint record
      const newData: any = {
        fingerprintHash,
        rawFingerprint: fingerprint,
        firstSeen: Timestamp.now(),
        lastSeen: Timestamp.now(),
        linkedUsers: [userId],
        quizSubmissions: quizId ? [quizId] : [],
        metadata,
      };

      await setDoc(fingerprintRef, newData);
      console.log('[recordDeviceFingerprint] Created new fingerprint');
    }

    return fingerprintHash;
  } catch (error) {
    console.error('[recordDeviceFingerprint] Error recording fingerprint:', error);
    throw error;
  }
}

/**
 * Get all user IDs linked to the current device's fingerprint
 * Used to find quizzes created by the same device across different anonymous sessions
 * @returns Array of linked user IDs, or empty array if no fingerprint exists
 */
export async function getLinkedUserIds(): Promise<string[]> {
  if (!db) {
    console.error('[getLinkedUserIds] Firestore not initialized');
    return [];
  }

  try {
    const fingerprint = await getDeviceFingerprint();
    const fingerprintHash = await hashFingerprint(fingerprint);

    const fingerprintRef = doc(db, 'deviceFingerprints', fingerprintHash);
    const fingerprintDoc = await getDoc(fingerprintRef);

    if (!fingerprintDoc.exists()) {
      return [];
    }

    const data = fingerprintDoc.data();
    return data?.linkedUsers || [];
  } catch (error) {
    console.error('[getLinkedUserIds] Error fetching linked users:', error);
    return [];
  }
}

/**
 * Get device metadata for debugging/analytics
 */
export async function getDeviceMetadata() {
  try {
    const client = await getClientJS();
    return {
      browser: client.getBrowser(),
      browserVersion: client.getBrowserVersion(),
      os: client.getOS(),
      osVersion: client.getOSVersion(),
      device: client.getDevice(),
      deviceType: client.getDeviceType(),
      screenResolution: client.getCurrentResolution(),
      timezone: client.getTimeZone(),
      language: client.getLanguage(),
    };
  } catch (error) {
    console.error('[getDeviceMetadata] Error getting metadata:', error);
    return null;
  }
}
