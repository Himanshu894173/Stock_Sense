import React, { useState, useEffect } from 'react';
import { 
  Package, AlertTriangle, XCircle, ArrowDownLeft, ArrowUpRight, 
  ArrowLeftRight, Scale, TrendingUp, Activity, Plus, RefreshCw, CheckCircle2
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { apiClient } from '../api/client';

export const Dashboard = ({ setCurrentTab }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const stats = await apiClient.get('/dashboard/stats');
      setData(stats);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-blue-400">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span className="font-semibold text-lg">Loading real-time inventory statistics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 flex items-center justify-between">
        <span>Failed to load dashboard: {error}</span>
        <button onClick={loadDashboard} className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-xl">Retry</button>
      </div>
    );
  }

  const { kpis, category_distribution, recent_activities, low_stock_products } = data;

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  const kpiCards = [
    { title: 'Total Products', value: kpis.total_products, icon: Package, color: 'from-blue-600 to-indigo-600', tab: 'products' },
    { title: 'Low Stock Items', value: kpis.low_stock_items, icon: AlertTriangle, color: 'from-amber-600 to-orange-600', badge: 'Warning', tab: 'products' },
    { title: 'Out of Stock', value: kpis.out_of_stock_items, icon: XCircle, color: 'from-rose-600 to-red-600', badge: 'Critical', tab: 'products' },
    { title: 'Pending Receipts', value: kpis.pending_receipts, icon: ArrowDownLeft, color: 'from-emerald-600 to-teal-600', tab: 'receipts' },
    { title: 'Pending Deliveries', value: kpis.pending_deliveries, icon: ArrowUpRight, color: 'from-purple-600 to-indigo-600', tab: 'deliveries' },
    { title: 'Transfers Scheduled', value: kpis.scheduled_transfers, icon: ArrowLeftRight, color: 'from-cyan-600 to-blue-600', tab: 'transfers' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Real-Time Inventory Overview</h2>
          <p className="text-slate-400 text-sm mt-1">Live metrics dynamically queried from PostgreSQL database</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setCurrentTab('receipts')}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" /> Receive Goods
          </button>
          <button 
            onClick={() => setCurrentTab('deliveries')}
            className="flex items-center gap-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-purple-600/20"
          >
            <Plus className="w-4 h-4" /> Ship Order
          </button>
          <button 
            onClick={() => setCurrentTab('transfers')}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" /> Internal Transfer
          </button>
          <button 
            onClick={() => setCurrentTab('adjustments')}
            className="flex items-center gap-2 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-amber-600/20"
          >
            <Scale className="w-4 h-4" /> Audit Count
          </button>
        </div>
      </div>

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx}
              onClick={() => setCurrentTab(card.tab)}
              className="glass-panel p-4 hover:border-slate-700 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${card.color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                {card.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {card.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium">{card.title}</p>
              <p className="text-2xl font-bold text-slate-100 mt-1 group-hover:scale-105 transition-transform">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Volume by Category Bar Chart */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-200 text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Stock Volume by Category
            </h3>
            <span className="text-xs text-slate-400">Total Units</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={category_distribution}>
                <XAxis dataKey="category_name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                />
                <Bar dataKey="total_quantity" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution Pie Chart */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-200 text-base flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-400" />
              Product Mix Breakdown
            </h3>
            <span className="text-xs text-slate-400">Categories</span>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={category_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="product_count"
                  nameKey="category_name"
                >
                  {category_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px' }} />
                <Legend formatter={(value) => <span className="text-xs text-slate-300">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Watchlist */}
        <div className="glass-panel p-6">
          <h3 className="font-bold text-slate-200 text-base flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Low Stock & Reorder Watchlist ({low_stock_products.length})
          </h3>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {low_stock_products.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                All product stock levels are above reorder thresholds.
              </div>
            ) : (
              low_stock_products.map((item) => (
                <div key={item.id} className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-200 text-sm">{item.name}</h4>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">SKU: {item.sku} • {item.category_name}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                      item.status === 'Out of Stock' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {item.total_stock} Units
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">Reorder Level: {item.reorder_level}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Activity Stream (Stock Ledger) */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-200 text-base flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Live Inventory Audit Stream
            </h3>
            <button onClick={() => setCurrentTab('ledger')} className="text-xs text-blue-400 hover:text-blue-300 font-semibold">View Full Ledger →</button>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recent_activities.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No inventory movements recorded yet.</p>
            ) : (
              recent_activities.map((act) => (
                <div key={act.id} className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                        act.movement_type === 'Receipt' ? 'bg-emerald-500/20 text-emerald-400' :
                        act.movement_type === 'Delivery' ? 'bg-purple-500/20 text-purple-400' :
                        act.movement_type === 'Internal Transfer' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {act.movement_type}
                      </span>
                      <span className="font-mono text-slate-300 font-bold">{act.reference_no}</span>
                    </div>
                    <p className="font-medium text-slate-200 text-sm">{act.product_name}</p>
                    <p className="text-[10px] text-slate-400">{act.reason} • {act.timestamp}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold font-mono ${act.quantity > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {act.quantity > 0 ? `+${act.quantity}` : act.quantity}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
