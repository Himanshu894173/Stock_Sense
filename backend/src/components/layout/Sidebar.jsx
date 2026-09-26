import React from 'react';
import { 
  LayoutDashboard, Package, ArrowDownLeft, ArrowUpRight, 
  ArrowLeftRight, Scale, History, Warehouse, User, LogOut,
  ChevronLeft, ChevronRight, Boxes
} from 'lucide-react';

export const Sidebar = ({ currentTab, setCurrentTab, collapsed, setCollapsed, user, logout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'receipts', label: 'Receipts', icon: ArrowDownLeft, badge: 'Incoming' },
    { id: 'deliveries', label: 'Delivery Orders', icon: ArrowUpRight, badge: 'Outgoing' },
    { id: 'transfers', label: 'Internal Transfers', icon: ArrowLeftRight },
    { id: 'adjustments', label: 'Inventory Adjustments', icon: Scale },
    { id: 'ledger', label: 'Stock Ledger', icon: History },
    { id: 'warehouses', label: 'Warehouses', icon: Warehouse },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  return (
    <aside 
      className={`fixed top-0 left-0 h-screen bg-slate-900/90 backdrop-blur-xl border-r border-slate-800 transition-all duration-300 z-40 flex flex-col ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* App Header / Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <Boxes className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-lg text-slate-100 tracking-tight leading-none">StockSense</h1>
              <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase">Enterprise ERP</span>
            </div>
          )}
        </div>
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {!collapsed && (
                <span className="flex-1 text-left truncate">{item.label}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* User Info & Logout Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/50">
        {!collapsed && user && (
          <div className="mb-2 px-2 py-1.5 rounded-lg bg-slate-800/40 border border-slate-800 flex items-center justify-between">
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">{user.full_name}</p>
              <p className="text-[10px] text-blue-400 font-medium">{user.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors text-sm font-medium"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
