import React, { useState, useEffect } from 'react';
import { History, Search, Filter, Download } from 'lucide-react';
import { apiClient } from '../api/client';

export const Ledger = () => {
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [movementType, setMovementType] = useState('');

  useEffect(() => {
    loadLedgerData();
  }, [search, movementType]);

  const loadLedgerData = async () => {
    setLoading(true);
    try {
      let query = '?';
      if (search) query += `search=${encodeURIComponent(search)}&`;
      if (movementType) query += `movement_type=${encodeURIComponent(movementType)}&`;

      const data = await apiClient.get(`/ledger${query}`);
      setLedger(data || []);
    } catch (err) {
      console.error('Failed to load stock ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-blue-400" /> Stock Movement Ledger & Audit History
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Complete immutable audit trail tracing why, when, and by whom inventory changed.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Reference # or Reason..."
            className="w-full bg-slate-900/80 text-slate-200 text-sm pl-9 pr-4 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select 
          value={movementType}
          onChange={(e) => setMovementType(e.target.value)}
          className="bg-slate-900/80 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2 focus:outline-none"
        >
          <option value="">All Movement Types</option>
          <option value="Receipt">Vendor Receipt</option>
          <option value="Delivery">Customer Delivery</option>
          <option value="Internal Transfer">Internal Transfer</option>
          <option value="Inventory Adjustment">Inventory Adjustment</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Reference No</th>
                <th className="px-6 py-4">Product / SKU</th>
                <th className="px-6 py-4">Movement Type</th>
                <th className="px-6 py-4">Source / Dest</th>
                <th className="px-6 py-4">Qty Change</th>
                <th className="px-6 py-4">Qty (Before → After)</th>
                <th className="px-6 py-4">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {loading ? (
                <tr><td colSpan="8" className="text-center py-8 text-slate-400 font-sans">Loading ledger entries...</td></tr>
              ) : ledger.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-8 text-slate-400 font-sans">No stock movements found.</td></tr>
              ) : (
                ledger.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 text-slate-400">{new Date(entry.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-4 font-bold text-slate-200">{entry.reference_no}</td>
                    <td className="px-6 py-4 font-sans font-medium text-slate-200">
                      {entry.product_name} <span className="text-xs text-blue-400 font-mono">({entry.product_sku})</span>
                    </td>
                    <td className="px-6 py-4 font-sans">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        entry.movement_type === 'Receipt' ? 'bg-emerald-500/10 text-emerald-400' :
                        entry.movement_type === 'Delivery' ? 'bg-purple-500/10 text-purple-400' :
                        entry.movement_type === 'Internal Transfer' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {entry.movement_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-sans text-slate-400">
                      {entry.source_location_name && <span>{entry.source_location_name}</span>}
                      {entry.source_location_name && entry.destination_location_name && <span className="mx-1 text-slate-600">→</span>}
                      {entry.destination_location_name && <span>{entry.destination_location_name}</span>}
                    </td>
                    <td className="px-6 py-4 font-bold">
                      <span className={entry.quantity >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {entry.quantity > 0 ? `+${entry.quantity}` : entry.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {entry.quantity_before} → <span className="text-slate-100 font-bold">{entry.quantity_after}</span>
                    </td>
                    <td className="px-6 py-4 font-sans text-slate-400">{entry.user_name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
