import React, { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { 
  loadOrders, 
  saveOrders, 
  loadFormFields, 
  saveFormFields, 
  loadAdminSettings, 
  saveAdminSettings 
} from './services/storage';
import { 
  initFirebaseAuthListener, 
  getStoredAccessToken, 
  googleSignIn, 
  logout 
} from './services/firebaseAuth';
import { 
  testFirestoreConnection, 
  saveOrderToFirestore, 
  saveAdminSettingsToFirestore, 
  fetchAdminSettingsFromFirestore, 
  fetchOrdersFromFirestore, 
  subscribeToOrders 
} from './services/firebase';
import { PrintOrder, FormFieldConfig, AdminSettings } from './types/form';
import { Header } from './components/Header';
import { GoogleFormView } from './components/Form/GoogleFormView';
import { GoogleFormConfirmation } from './components/Form/GoogleFormConfirmation';
import { OrderTrackerModal } from './components/Form/OrderTrackerModal';
import { AdminPortal } from './components/Admin/AdminPortal';
import { appendOrderToGoogleSheet } from './services/googleSheets';
import { Shield, Search, FileSpreadsheet } from 'lucide-react';

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Navigation state: 'form' | 'admin' | 'confirmed'
  const [currentView, setCurrentView] = useState<'form' | 'admin' | 'confirmed'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (path.includes('/admin') || hash === '#admin' || search.includes('admin')) {
        return 'admin';
      }
    }
    return 'form';
  });

  // App data state
  const [orders, setOrders] = useState<PrintOrder[]>(() => loadOrders());
  const [formFields, setFormFields] = useState<FormFieldConfig[]>(() => loadFormFields());
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(() => loadAdminSettings());
  const [submittedOrder, setSubmittedOrder] = useState<PrintOrder | null>(null);

  // Modal states
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [trackerInitialId, setTrackerInitialId] = useState('');

  // Google Workspace Auth state
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => getStoredAccessToken());

  // Listen to path changes (/admin)
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (path.includes('/admin') || hash === '#admin' || search.includes('admin')) {
        setCurrentView('admin');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Update theme class on HTML document
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Validate connection to Firestore on boot (per Firebase skill directive)
  useEffect(() => {
    testFirestoreConnection();

    // Fetch cloud-persisted admin settings
    fetchAdminSettingsFromFirestore()
      .then((remote) => {
        if (remote) {
          setAdminSettings((prev) => ({ ...prev, ...remote }));
        }
      })
      .catch((err) => {
        console.log('Firebase settings sync info:', err);
      });

    // Fetch cloud-persisted orders
    fetchOrdersFromFirestore()
      .then((remoteOrders) => {
        if (remoteOrders && remoteOrders.length > 0) {
          setOrders(remoteOrders);
          saveOrders(remoteOrders);
        }
      })
      .catch((err) => {
        console.log('Firebase orders sync info:', err);
      });
  }, []);

  // Initialize Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = initFirebaseAuthListener((user) => {
      setAuthUser(user);
      const token = getStoredAccessToken();
      if (token) setAccessToken(token);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore sync when administrator is active
  useEffect(() => {
    if (authUser) {
      try {
        const unsubscribe = subscribeToOrders((cloudOrders) => {
          if (cloudOrders && cloudOrders.length > 0) {
            setOrders(cloudOrders);
            saveOrders(cloudOrders);
          }
        });
        return () => unsubscribe();
      } catch (err) {
        console.log('Subscription notice:', err);
      }
    }
  }, [authUser]);

  const handleGoogleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setAuthUser(result.user);
        setAccessToken(result.accessToken);
      }
    } catch (err) {
      console.error('Google Sign-in failed in App:', err);
    }
  };

  const handleOrderSubmitted = async (newOrder: PrintOrder) => {
    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    saveOrders(updatedOrders);
    setSubmittedOrder(newOrder);
    setCurrentView('confirmed');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Persist immediately to Firebase Firestore
    try {
      await saveOrderToFirestore(newOrder);
      console.log('Order successfully saved to Firebase Firestore');
    } catch (err) {
      console.warn('Firebase order persist notice:', err);
    }

    // Centralized Google Sheet real-time append if configured
    if (adminSettings.autoSyncToSheet && adminSettings.spreadsheetId && accessToken) {
      try {
        await appendOrderToGoogleSheet(accessToken, adminSettings.spreadsheetId, newOrder);
        console.log('Order automatically pushed to central Google Sheet');
      } catch (err) {
        console.warn('Central Google Sheet auto-sync deferred:', err);
      }
    }
  };

  const handleOrdersUpdated = async (updated: PrintOrder[]) => {
    setOrders(updated);
    saveOrders(updated);
    for (const order of updated) {
      try {
        await saveOrderToFirestore(order);
      } catch {
        // Handled silently
      }
    }
  };

  const handleFormFieldsUpdated = (updated: FormFieldConfig[]) => {
    setFormFields(updated);
    saveFormFields(updated);
  };

  const handleSettingsUpdated = async (updated: AdminSettings) => {
    setAdminSettings(updated);
    saveAdminSettings(updated);
    try {
      await saveAdminSettingsToFirestore(updated);
    } catch (err) {
      console.warn('Firebase settings update notice:', err);
    }
  };

  const handleOpenTracker = (orderId?: string) => {
    setTrackerInitialId(orderId || '');
    setIsTrackerOpen(true);
  };

  const navigateToView = (view: 'form' | 'admin') => {
    setCurrentView(view);
    if (view === 'admin') {
      window.location.hash = 'admin';
    } else {
      if (window.location.hash) {
        window.history.pushState('', document.title, window.location.pathname + window.location.search);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div 
      className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col transition-colors selection:bg-[#673ab7] selection:text-white"
      style={{
        backgroundColor: currentView !== 'admin' ? (adminSettings.bgColor || '#f0ebf8') : undefined
      }}
    >
      
      {/* Top Main Navigation Bar (Visible ONLY in Backend Admin for administrators, completely invisible to form submitters) */}
      {currentView === 'admin' && (
        <Header
          currentView="admin"
          setCurrentView={(view) => {
            if (view === 'confirmation') setCurrentView('confirmed');
            else navigateToView(view);
          }}
          openTracker={() => handleOpenTracker()}
          darkMode={isDark}
          setDarkMode={setIsDark}
          user={authUser}
          accessToken={accessToken}
          onAuthChange={(u, t) => {
            setAuthUser(u);
            setAccessToken(t);
          }}
          sheetConfigured={!!adminSettings.spreadsheetId}
          spreadsheetUrl={adminSettings.spreadsheetUrl}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'form' && (
          <GoogleFormView
            fields={formFields}
            onOrderSubmitted={handleOrderSubmitted}
            accessToken={accessToken}
            adminSettings={adminSettings}
            onOpenAdmin={() => navigateToView('admin')}
          />
        )}

        {currentView === 'confirmed' && submittedOrder && (
          <GoogleFormConfirmation
            order={submittedOrder}
            adminSettings={adminSettings}
            onNewResponse={() => navigateToView('form')}
            onOpenTracker={(id) => handleOpenTracker(id)}
            onOpenAdmin={() => navigateToView('admin')}
          />
        )}

        {currentView === 'admin' && (
          <AdminPortal
            orders={orders}
            onOrdersUpdated={handleOrdersUpdated}
            formFields={formFields}
            onFormFieldsUpdated={handleFormFieldsUpdated}
            adminSettings={adminSettings}
            onSettingsUpdated={handleSettingsUpdated}
            user={authUser}
            accessToken={accessToken}
            onGoogleAuth={(u, t) => {
              setAuthUser(u);
              setAccessToken(t);
            }}
            onPromptGoogleAuth={handleGoogleLogin}
            onViewForm={() => navigateToView('form')}
          />
        )}
      </main>

      {/* Order Progress Tracker Modal */}
      <OrderTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        orders={orders}
        initialOrderId={trackerInitialId}
      />

    </div>
  );
}
