import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  getDocFromServer 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { PrintOrder, AdminSettings } from '../types/form';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: getFirestore must explicitly receive firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connection verified.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore client is offline or network unavailable.');
    } else {
      console.log('Firebase connection ready.');
    }
    return false;
  }
}

// Sanitize order object for Firestore (removes undefined values)
function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        sanitized[key] = sanitizeForFirestore(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  return sanitized as T;
}

// ----------------- ORDERS SERVICE -----------------

export async function saveOrderToFirestore(order: PrintOrder): Promise<void> {
  const path = `orders/${order.id}`;
  try {
    const payload = sanitizeForFirestore(order);
    await setDoc(doc(db, 'orders', order.id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateOrderInFirestore(orderId: string, partial: Partial<PrintOrder>): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    const payload = sanitizeForFirestore(partial);
    await updateDoc(doc(db, 'orders', orderId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteOrderFromFirestore(orderId: string): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await deleteDoc(doc(db, 'orders', orderId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchOrderByIdFromFirestore(orderId: string): Promise<PrintOrder | null> {
  const path = `orders/${orderId}`;
  try {
    const snapshot = await getDoc(doc(db, 'orders', orderId));
    if (!snapshot.exists()) return null;
    return snapshot.data() as PrintOrder;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function fetchOrdersFromFirestore(): Promise<PrintOrder[]> {
  const path = 'orders';
  try {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => docSnap.data() as PrintOrder);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeToOrders(
  onUpdate: (orders: PrintOrder[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'orders';
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs.map((docSnap) => docSnap.data() as PrintOrder);
      onUpdate(orders);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// ----------------- APP SETTINGS SERVICE -----------------

export async function saveAdminSettingsToFirestore(settings: AdminSettings): Promise<void> {
  const path = 'settings/general';
  try {
    const payload = sanitizeForFirestore({
      ...settings,
      id: 'general',
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'settings', 'general'), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchAdminSettingsFromFirestore(): Promise<AdminSettings | null> {
  const path = 'settings/general';
  try {
    const snapshot = await getDoc(doc(db, 'settings', 'general'));
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    return data as AdminSettings;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}
