import React, { useState, useEffect } from 'react';
import { Scale, Plus, AlertCircle, X, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../api/client';

export const Adjustments = () => {
  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Form State
  const [productId, setProductId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [recordedQty, setRecordedQty] = useState(0);
  const [countedQty, setCountedQty] = useState('');
  const [reason, setReason] = useState('Damaged');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadAdjustmentsData();
  }, []);

  const loadAdjustmentsData = async () => {
    setLoading(true);
    try {
      const [aRes, pRes, lRes] = await Promise.all([
        apiClient.get('/adjustments'),
        apiClient.get('/products'),
        apiClient.get('/warehouses/locations')
      ]);
      setAdjustments(aRes || []);
      setProducts(pRes || []);
      setLocations(lRes || []);
    } catch (err) {
      console.error('Failed to load adjustments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch recorded stock balance when product and location are selected
  useEffect(() => {
    if (productId && locationId) {
      const prod = products.find(p => p.id === parseInt(productId));
      if (prod && prod.balances) {
        const bal = prod.balances.find(b => b.location_id === parseInt(locationId));
        setRecordedQty(bal ? bal.quantity : 0);
      } else {
        setRecordedQty(0);
      }
    }
  }, [productId, locationId, products]);

  const calculatedDiff = countedQty !== '' ? parseFloat(countedQty) - recordedQty : 0;

  const handleCreateAdjustment = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await apiClient.post('/adjustments', {
        product_id: parseInt(productId),
        location_id: parseInt(locationId),
        counted_quantity: parseFloat(countedQty),
        reason,
        notes
      });
      setShowModal(false);
      setProductId('');
      setLocationId('');
      setCountedQty('');
      setNotes('');
      loadAdjustmentsData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Scale className="w-6 h-6 text-amber-400" /> Physical Inventory Adjustments
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Audit physical stock vs recorded count. Generates permanent audit ledger records.
          </p>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-amber-600/30"
        >
          <Plus className="w-5 h-5" /> New Physical Count Audit
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase">
              <tr>
                <th className="px-6 py-4">Reference No</th>
                <th className="px-6 py-4">Product / SKU</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Recorded Qty</th>
                <th className="px-6 py-4">Counted Qty</th>
                <th className="px-6 py-4">Difference</th>
                <th className="px-6 py-4">Audit Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan="7" className="text-center py-8 text-slate-400">Loading adjustments...</td></tr>
              ) : adjustments.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-slate-400">No stock adjustments recorded.</td></tr>
              ) : (
                adjustments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-bold font-mono text-slate-100">{a.reference_no}</td>
                    <td className="px-6 py-4 font-medium text-slate-200">{a.product_name} <span className="text-xs text-slate-400 font-mono">({a.product_sku})</span></td>
                    <td className="px-6 py-4 text-slate-300">{a.location_name}</td>
                    <td className="px-6 py-4 font-mono text-slate-400">{a.recorded_quantity}</td>
                    <td className="px-6 py-4 font-mono text-slate-100 font-bold">{a.counted_quantity}</td>
                    <td className="px-6 py-4 font-mono font-bold">
                      <span className={a.difference >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {a.difference > 0 ? `+${a.difference}` : a.difference}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">
                        {a.reason}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-400" /> Record Physical Count Audit
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
            </div>

            {errorMsg && <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">{errorMsg}</div>}

            <form onSubmit={handleCreateAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Product *</label>
                <select 
                  required
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200"
                >
                  <option value="">Select Product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Location *</label>
                <select 
                  required
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200"
                >
                  <option value="">Select Location</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name} ({l.code})</option>)}
                </select>
              </div>

              {productId && locationId && (
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">System Recorded Stock:</span>
                    <span className="font-bold font-mono text-slate-200">{recordedQty} Units</span>
                  </div>
                  {countedQty !== '' && (
                    <div className="flex justify-between text-xs pt-1 border-t border-slate-700">
                      <span className="text-slate-400">Calculated Adjustment Delta:</span>
                      <span className={`font-bold font-mono ${calculatedDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {calculatedDiff > 0 ? `+${calculatedDiff}` : calculatedDiff} Units
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Physical Counted Qty *</label>
                  <input 
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={countedQty}
                    onChange={(e) => setCountedQty(e.target.value)}
                    placeholder="Enter physical count"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Audit Reason *</label>
                  <select 
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200"
                  >
                    <option value="Damaged">Damaged</option>
                    <option value="Lost">Lost</option>
                    <option value="Found">Found</option>
                    <option value="Counting Error">Counting Error</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Explanation</label>
                <input 
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. 3 kg steel rod bent during floor transport"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-amber-600 text-white text-xs font-semibold rounded-xl hover:bg-amber-500">Confirm Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
