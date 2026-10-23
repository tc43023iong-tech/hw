import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const firestoreDbId = (firebaseConfig as any).firestoreDatabaseId || 'ai-studio-8c31e22c-0d18-42e7-915a-50ad1f46d76e';
export const db = getFirestore(app, firestoreDbId);

export const auth = getAuth(app);

// Google Workspace OAuth Provider with Sheets & Drive file scopes
export const googleWorkspaceProvider = new GoogleAuthProvider();
googleWorkspaceProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
googleWorkspaceProvider.addScope('https://www.googleapis.com/auth/drive.file');

// Test connection on boot per Firebase skill guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase is currently offline or unreachable. Local cache enabled.");
    }
  }
}

testConnection();
