import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  query,
  where,
  Unsubscribe
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { DailyEntry, HandbookWeek } from '../types/handbook';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Local storage key helpers for seamless local resilience
const LOCAL_WEEK_PREFIX = 'handbook_week_';
const LOCAL_ENTRY_PREFIX = 'handbook_entry_';

export function getLocalWeek(id: string): HandbookWeek | null {
  try {
    const raw = localStorage.getItem(LOCAL_WEEK_PREFIX + id);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setLocalWeek(week: HandbookWeek): void {
  try {
    localStorage.setItem(LOCAL_WEEK_PREFIX + week.id, JSON.stringify(week));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
}

export function getLocalEntry(id: string): DailyEntry | null {
  try {
    const raw = localStorage.getItem(LOCAL_ENTRY_PREFIX + id);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setLocalEntry(entry: DailyEntry): void {
  try {
    localStorage.setItem(LOCAL_ENTRY_PREFIX + entry.id, JSON.stringify(entry));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
}

export const lastLocalWriteTimestamp = { value: 0 };

// Real-time listener for a specific week's handbook (specifically for exam remarks and metadata)
export function subscribeWeek(
  weekId: string,
  onUpdate: (week: HandbookWeek | null, isFromRemoteChange?: boolean) => void,
  onError?: (err: FirestoreErrorInfo) => void
): Unsubscribe {
  const docRef = doc(db, 'weeks', weekId);

  // Deliver local cache first for instant UI response
  const cached = getLocalWeek(weekId);
  if (cached) onUpdate(cached);

  let isFirst = true;

  return onSnapshot(
    docRef,
    (snapshot) => {
      const isFromOtherDevice = !isFirst && !snapshot.metadata.hasPendingWrites && (Date.now() - lastLocalWriteTimestamp.value > 2000);
      isFirst = false;

      if (snapshot.exists()) {
        const data = snapshot.data() as HandbookWeek;
        setLocalWeek(data);
        onUpdate(data, isFromOtherDevice);
      } else {
        onUpdate(cached || null, isFromOtherDevice);
      }
    },
    (error) => {
      const errInfo = handleFirestoreError(error, OperationType.GET, `weeks/${weekId}`);
      if (onError) onError(errInfo);
    }
  );
}

// Real-time listener for a single daily entry
export function subscribeDailyEntry(
  entryId: string,
  onUpdate: (entry: DailyEntry | null, isFromRemoteChange?: boolean) => void,
  onError?: (err: FirestoreErrorInfo) => void
): Unsubscribe {
  const docRef = doc(db, 'entries', entryId);

  const cached = getLocalEntry(entryId);
  if (cached) onUpdate(cached);

  let isFirst = true;

  return onSnapshot(
    docRef,
    (snapshot) => {
      const isFromOtherDevice = !isFirst && !snapshot.metadata.hasPendingWrites && (Date.now() - lastLocalWriteTimestamp.value > 2000);
      isFirst = false;

      if (snapshot.exists()) {
        const data = snapshot.data() as DailyEntry;
        setLocalEntry(data);
        onUpdate(data, isFromOtherDevice);
      } else {
        onUpdate(cached || null, isFromOtherDevice);
      }
    },
    (error) => {
      const errInfo = handleFirestoreError(error, OperationType.GET, `entries/${entryId}`);
      if (onError) onError(errInfo);
    }
  );
}

// Real-time listener for all daily entries of a week for a specific class
export function subscribeWeekEntries(
  weekNumber: number,
  classId: string,
  onUpdate: (entries: Record<string, DailyEntry>, isFromRemoteChange?: boolean) => void,
  onError?: (err: FirestoreErrorInfo) => void
): Unsubscribe {
  const colRef = collection(db, 'entries');
  const q = query(
    colRef,
    where('weekNumber', '==', weekNumber),
    where('classId', '==', classId)
  );

  let isFirst = true;

  return onSnapshot(
    q,
    (snapshot) => {
      const map: Record<string, DailyEntry> = {};
      snapshot.forEach((docSnap) => {
        const item = docSnap.data() as DailyEntry;
        map[item.date] = item;
        setLocalEntry(item);
      });

      const isFromOtherDevice = !isFirst && !snapshot.metadata.hasPendingWrites && (Date.now() - lastLocalWriteTimestamp.value > 2000);
      isFirst = false;

      onUpdate(map, isFromOtherDevice);
    },
    (error) => {
      const errInfo = handleFirestoreError(error, OperationType.LIST, 'entries');
      if (onError) onError(errInfo);
    }
  );
}

// Save or update weekly handbook (e.g. Test / Exam Remarks)
export async function saveHandbookWeek(week: HandbookWeek): Promise<void> {
  lastLocalWriteTimestamp.value = Date.now();
  const docRef = doc(db, 'weeks', week.id);
  const payload: HandbookWeek = {
    ...week,
    updatedAt: new Date().toISOString()
  };

  // Immediate local save
  setLocalWeek(payload);

  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `weeks/${week.id}`);
    throw error;
  }
}

// Save or update a daily homework entry
export async function saveDailyEntry(entry: DailyEntry): Promise<void> {
  lastLocalWriteTimestamp.value = Date.now();
  const docRef = doc(db, 'entries', entry.id);
  const payload: DailyEntry = {
    ...entry,
    updatedAt: new Date().toISOString()
  };

  // Immediate local save
  setLocalEntry(payload);

  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `entries/${entry.id}`);
    throw error;
  }
}

