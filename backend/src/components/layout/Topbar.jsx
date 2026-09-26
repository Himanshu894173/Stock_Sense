import React, { useState, useEffect } from 'react';
import { Search, Bell, Warehouse as WarehouseIcon, AlertTriangle, X } from 'lucide-react';
import { apiClient } from '../../api/client';

export const Topbar = ({ collapsed, user, searchVal, setSearchVal, onSelectProduct }) => {
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWh, setSelectedWh] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    loadTopBarData();
  }, []);

  const loadTopBarData = async () => {
    try {
      const whData = await apiClient.get('/warehouses');
      setWarehouses(whData || []);
      const stats = await apiClient.get('/dashboard/stats');
      setNotifications(stats.low_stock_products || []);
    } catch (err) {
      console.error('Failed loading topbar data:', err);
    }
  };

  return (
    <header 
      className={`fixed top-0 right-0 h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 z-30 flex items-center justify-between px-6 transition-all duration-300 ${
        collapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Global Search */}
      <div className="relative w-72 md:w-96">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          placeholder="Global search by SKU, product name, doc #..."
          className="w-full bg-slate-800/80 text-slate-200 text-sm pl-9 pr-8 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
        />
        {searchVal && (
          <button 
            onClick={() => setSearchVal('')} 
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Warehouse Selector */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-800/60 border border-slate-700/80 rounded-xl px-3 py-1.5">
          <WarehouseIcon className="w-4 h-4 text-blue-400" />
          <select 
            value={selectedWh}
            onChange={(e) => setSelectedWh(e.target.value)}
            className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-slate-800 text-slate-200">All Warehouses</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id} className="bg-slate-800 text-slate-200">{w.name} ({w.code})</option>
            ))}
          </select>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            title="Low Stock Alerts"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-slate-900 animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-50 p-4">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Stock Alerts ({notifications.length})</span>
                </div>
                <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-200 text-xs">Close</button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">All inventory levels healthy!</p>
                ) : (
                  notifications.map(item => (
                    <div key={item.id} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-200">{item.name}</p>
                        <p className="text-slate-400 font-mono">{item.sku}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${item.status === 'Out of Stock' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {item.total_stock} {item.status}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Min: {item.reorder_level}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-200">{user?.full_name}</p>
            <p className="text-[10px] text-slate-400">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
