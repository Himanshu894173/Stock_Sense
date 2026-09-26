import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuth } from '../../context/AuthContext';

export const MainLayout = ({ currentTab, setCurrentTab, children, searchVal, setSearchVal }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar 
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        user={user}
        logout={logout}
      />
      <Topbar 
        collapsed={collapsed}
        user={user}
        searchVal={searchVal}
        setSearchVal={setSearchVal}
      />
      
      {/* Main Content Area */}
      <main className={`flex-1 transition-all duration-300 pt-20 px-6 pb-12 overflow-x-hidden ${collapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
