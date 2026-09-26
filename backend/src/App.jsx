import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Receipts } from './pages/Receipts';
import { Deliveries } from './pages/Deliveries';
import { Transfers } from './pages/Transfers';
import { Adjustments } from './pages/Adjustments';
import { Ledger } from './pages/Ledger';
import { Warehouses } from './pages/Warehouses';
import { Profile } from './pages/Profile';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [authView, setAuthView] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [globalSearch, setGlobalSearch] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-blue-400 font-semibold text-lg">
        Initializing StockSense ERP...
      </div>
    );
  }

  if (!user) {
    if (authView === 'signup') return <Signup onSwitchToLogin={() => setAuthView('login')} />;
    if (authView === 'forgot') return <ForgotPassword onSwitchToLogin={() => setAuthView('login')} />;
    return (
      <Login 
        onSwitchToSignup={() => setAuthView('signup')} 
        onSwitchToForgot={() => setAuthView('forgot')} 
      />
    );
  }

  return (
    <MainLayout 
      currentTab={currentTab} 
      setCurrentTab={setCurrentTab}
      searchVal={globalSearch}
      setSearchVal={(val) => {
        setGlobalSearch(val);
        if (val && currentTab !== 'products') setCurrentTab('products');
      }}
    >
      {currentTab === 'dashboard' && <Dashboard setCurrentTab={setCurrentTab} />}
      {currentTab === 'products' && <Products globalSearch={globalSearch} />}
      {currentTab === 'receipts' && <Receipts />}
      {currentTab === 'deliveries' && <Deliveries />}
      {currentTab === 'transfers' && <Transfers />}
      {currentTab === 'adjustments' && <Adjustments />}
      {currentTab === 'ledger' && <Ledger />}
      {currentTab === 'warehouses' && <Warehouses />}
      {currentTab === 'profile' && <Profile />}
    </MainLayout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
