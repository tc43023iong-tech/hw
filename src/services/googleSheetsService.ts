import {
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut
} from 'firebase/auth';
import { auth, googleWorkspaceProvider } from '../firebase';
import { DailyEntry } from '../types/handbook';
import firebaseConfig from '../../firebase-applet-config.json';

export const SHEET_NAME_PREFIX = '同善堂中學小學部_每日家課手冊登記表_2026-2027';
const LOCAL_SPREADSHEET_KEY = 'google_sheet_spreadsheet_id';

export interface GoogleAuthUser {
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

// In-memory token caching per Workspace skill guidelines
let cachedAccessToken: string | null = null;
let cachedUser: GoogleAuthUser | null = null;
let isSigningIn = false;

// Listeners for auth state changes
const authListeners: ((user: GoogleAuthUser | null, token: string | null) => void)[] = [];

export const onGoogleAuthChange = (
  callback: (user: GoogleAuthUser | null, token: string | null) => void
) => {
  authListeners.push(callback);
  // Initial callback if already cached
  if (cachedAccessToken) {
    callback(cachedUser, cachedAccessToken);
  }
  return () => {
    const idx = authListeners.indexOf(callback);
    if (idx !== -1) authListeners.splice(idx, 1);
  };
};

function notifyAuthChange(user: GoogleAuthUser | null, token: string | null) {
  cachedUser = user;
  cachedAccessToken = token;
  authListeners.forEach((cb) => cb(user, token));
}

// Initialize Auth listener from Firebase Auth
export const initAuth = (
  onAuthSuccess?: (user: GoogleAuthUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      const gUser: GoogleAuthUser = {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      };
      notifyAuthChange(gUser, cachedAccessToken);
      if (onAuthSuccess) onAuthSuccess(gUser, cachedAccessToken);
    } else if (!cachedAccessToken && !isSigningIn) {
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Request token via Google Identity Services (GIS)
const requestTokenViaGIS = (): Promise<{ accessToken: string; user: GoogleAuthUser }> => {
  return new Promise((resolve, reject) => {
    const oAuthClientId =
      (firebaseConfig as any).oAuthClientId ||
      '40209611535-3mivhn491a27dkk7prar3452ln8n0l11.apps.googleusercontent.com';

    const triggerGIS = () => {
      try {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: oAuthClientId,
          scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
          callback: async (resp: any) => {
            if (resp.error) {
              console.error('GIS OAuth Error:', resp);
              reject(new Error(resp.error_description || resp.error || 'Google 授權失敗'));
              return;
            }

            const token = resp.access_token;
            let gUser: GoogleAuthUser = { email: auth.currentUser?.email || '已授權 Google 用戶' };

            // Fetch user profile info
            try {
              const uRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (uRes.ok) {
                const uData = await uRes.json();
                gUser = {
                  email: uData.email,
                  displayName: uData.name,
                  photoURL: uData.picture
                };
              }
            } catch (e) {
              console.warn('Could not fetch userinfo', e);
            }

            notifyAuthChange(gUser, token);
            resolve({ accessToken: token, user: gUser });
          }
        });

        client.requestAccessToken({ prompt: '' });
      } catch (err) {
        reject(err);
      }
    };

    if (!(window as any).google?.accounts?.oauth2) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => triggerGIS();
      script.onerror = () => reject(new Error('無法載入 Google 授權組件'));
      document.head.appendChild(script);
    } else {
      triggerGIS();
    }
  });
};

// Master Google Sign-in: Tries Firebase Auth popup first, seamlessly falls back to GIS Token Client
export const googleSignIn = async (): Promise<{ user: GoogleAuthUser; accessToken: string }> => {
  isSigningIn = true;
  try {
    // 1. Try Firebase Auth popup
    try {
      const result = await signInWithPopup(auth, googleWorkspaceProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        cachedAccessToken = credential.accessToken;
        const gUser: GoogleAuthUser = {
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL
        };
        notifyAuthChange(gUser, cachedAccessToken);
        return { user: gUser, accessToken: cachedAccessToken };
      }
    } catch (fbErr: any) {
      console.warn('Firebase popup sign-in encountered an issue, switching to Google Identity Client:', fbErr);
      // Fallback to GIS Token Client
      const gisResult = await requestTokenViaGIS();
      return gisResult;
    }

    // If no credential token from Firebase, also use GIS
    const gisResult = await requestTokenViaGIS();
    return gisResult;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (e) {}
  notifyAuthChange(null, null);
};

export function getSavedSpreadsheetId(): string | null {
  try {
    return localStorage.getItem(LOCAL_SPREADSHEET_KEY);
  } catch {
    return null;
  }
}

export function saveSpreadsheetId(id: string): void {
  try {
    localStorage.setItem(LOCAL_SPREADSHEET_KEY, id);
  } catch (e) {
    console.error('Failed to save spreadsheet id', e);
  }
}

// Find existing spreadsheet or create a new one in Google Drive
export async function getOrCreateSpreadsheet(token: string): Promise<{ id: string; url: string; isNew: boolean }> {
  // Check if we already have an ID saved locally
  const savedId = getSavedSpreadsheetId();
  if (savedId) {
    try {
      const checkRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${savedId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (checkRes.ok) {
        return {
          id: savedId,
          url: `https://docs.google.com/spreadsheets/d/${savedId}/edit`,
          isNew: false
        };
      }
    } catch {
      // Continue to search or create
    }
  }

  // Search user's Google Drive for existing spreadsheet
  try {
    const query = encodeURIComponent(`name='${SHEET_NAME_PREFIX}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`);
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        const foundId = searchData.files[0].id;
        saveSpreadsheetId(foundId);
        return {
          id: foundId,
          url: `https://docs.google.com/spreadsheets/d/${foundId}/edit`,
          isNew: false
        };
      }
    }
  } catch (e) {
    console.warn('Drive search failed, proceeding to create new sheet', e);
  }

  // Create new Google Spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: SHEET_NAME_PREFIX
      },
      sheets: [
        {
          properties: {
            title: '每日手冊登記',
            gridProperties: {
              frozenRowCount: 1
            }
          }
        }
      ]
    })
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(err.error?.message || '建立 Google 試算表失敗');
  }

  const newSheet = await createRes.json();
  const newId = newSheet.spreadsheetId;
  saveSpreadsheetId(newId);

  // Initialize header row
  const headers = [
    '日期',
    '週次',
    '星期',
    '教學日狀態',
    '中文',
    '數學',
    '英文',
    '常識',
    '其他',
    '測驗/默書備忘',
    '家長簽署',
    '班主任簽署',
    '最後同步時間'
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${newId}/values/每日手冊登記!A1:M1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range: '每日手冊登記!A1:M1',
      majorDimension: 'ROWS',
      values: [headers]
    })
  });

  return {
    id: newId,
    url: `https://docs.google.com/spreadsheets/d/${newId}/edit`,
    isNew: true
  };
}

// Sync single daily entry to Google Sheet
export async function syncEntryToGoogleSheet(
  token: string,
  spreadsheetId: string,
  entry: DailyEntry,
  dayInfo: { weekNumber: number; dayOfWeekStr: string; statusDesc: string },
  memosText: string,
  parentSigned: boolean,
  teacherSigned: boolean
): Promise<{ success: boolean; rowNumber?: number }> {
  // Read existing dates in Column A to find if this date already exists
  const readRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/每日手冊登記!A:A`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!readRes.ok) {
    throw new Error('無法讀取 Google 試算表資料');
  }

  const readData = await readRes.json();
  const rows: string[][] = readData.values || [];

  let targetRowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i] && rows[i][0] === entry.date) {
      targetRowIndex = i + 1; // 1-indexed for Sheets
      break;
    }
  }

  const rowValues = [
    entry.date,
    `第 ${dayInfo.weekNumber} 週`,
    dayInfo.dayOfWeekStr,
    dayInfo.statusDesc,
    entry.chinese || '',
    entry.math || '',
    entry.english || '',
    entry.generalStudies || '',
    entry.other || '',
    memosText || '',
    parentSigned ? '已查閱簽署' : '未簽署',
    teacherSigned ? '已檢閱' : '未檢閱',
    new Date().toLocaleString('zh-HK')
  ];

  if (targetRowIndex > 0) {
    // Update existing row
    const updateRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/每日手冊登記!A${targetRowIndex}:M${targetRowIndex}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          range: `每日手冊登記!A${targetRowIndex}:M${targetRowIndex}`,
          majorDimension: 'ROWS',
          values: [rowValues]
        })
      }
    );

    if (!updateRes.ok) {
      const err = await updateRes.json();
      throw new Error(err.error?.message || '更新試算表列失敗');
    }

    return { success: true, rowNumber: targetRowIndex };
  } else {
    // Append new row
    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/每日手冊登記!A:M:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          range: '每日手冊登記!A:M',
          majorDimension: 'ROWS',
          values: [rowValues]
        })
      }
    );

    if (!appendRes.ok) {
      const err = await appendRes.json();
      throw new Error(err.error?.message || '新增試算表列失敗');
    }

    return { success: true };
  }
}
