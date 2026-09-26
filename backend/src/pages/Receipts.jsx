import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, Plus, CheckCircle, XCircle, Clock, FileText, Trash2, X } from 'lucide-react';
import { apiClient } from '../api/client';

export const Receipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // New Receipt Form
  const [destLocationId, setDestLocationId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }]);

  useEffect(() => {
    loadReceiptsData();
  }, []);

  const loadReceiptsData = async () => {
    setLoading(true);
    try {
      const [rRes, pRes, lRes] = await Promise.all([
        apiClient.get('/receipts'),
        apiClient.get('/products'),
        apiClient.get('/warehouses/locations')
      ]);
      setReceipts(rRes || []);
      setProducts(pRes || []);
      setLocations(lRes || []);
    } catch (err) {
      console.error('Failed to load receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { product_id: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleCreateReceipt = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await apiClient.post('/receipts', {
        supplier_id: supplierId ? parseInt(supplierId) : null,
        destination_location_id: parseInt(destLocationId),
        notes,
        items: items.map(i => ({
          product_id: parseInt(i.product_id),
          quantity: parseFloat(i.quantity)
        }))
      });
      setShowModal(false);
      setItems([{ product_id: '', quantity: 1 }]);
      setNotes('');
      loadReceiptsData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleValidate = async (id) => {
    try {
      await apiClient.post(`/receipts/${id}/validate`);
      loadReceiptsData();
    } catch (err) {
      alert(`Validation error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <ArrowDownLeft className="w-6 h-6 text-emerald-400" /> Incoming Goods Receipts
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Goods receiving workflow. Stock increases strictly upon validation.
          </p>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-emerald-600/30"
        >
          <Plus className="w-5 h-5" /> Create Vendor Receipt
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase">
              <tr>
                <th className="px-6 py-4">Reference No</th>
                <th className="px-6 py-4">Destination Location</th>
                <th className="px-6 py-4">Vendor / Supplier</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Items Count</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-8 text-slate-400">Loading receipts...</td></tr>
              ) : receipts.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 text-slate-400">No receipt documents found.</td></tr>
              ) : (
                receipts.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-bold font-mono text-slate-100">{r.reference_no}</td>
                    <td className="px-6 py-4 text-slate-200">{r.destination_location_name}</td>
                    <td className="px-6 py-4 text-slate-400">{r.supplier_name || 'Direct Vendor'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        r.status === 'Done' ? 'badge-done' :
                        r.status === 'Draft' ? 'badge-draft' : 'badge-waiting'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono">{r.items.length} Product(s)</td>
                    <td className="px-6 py-4 text-right">
                      {r.status !== 'Done' && (
                        <button 
                          onClick={() => handleValidate(r.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm"
                        >
                          Validate & Receive Stock
                        </button>
                      )}
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-400" /> Create Vendor Goods Receipt
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
            </div>

            {errorMsg && <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">{errorMsg}</div>}

            <form onSubmit={handleCreateReceipt} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Destination Location *</label>
                <select 
                  required
                  value={destLocationId}
                  onChange={(e) => setDestLocationId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200"
                >
                  <option value="">Select Destination Warehouse / Rack</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name} ({l.code})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Line Items *</label>
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select 
                        required
                        value={item.product_id}
                        onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200"
                      >
                        <option value="">Select Product</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                      </select>
                      <input 
                        type="number" 
                        min="0.01" 
                        step="any"
                        required
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        placeholder="Qty"
                        className="w-28 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200"
                      />
                      {items.length > 1 && (
                        <button type="button" onClick={() => handleRemoveItem(idx)} className="p-2 text-rose-400 hover:text-rose-300">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={handleAddItem} className="mt-2 text-xs text-blue-400 font-semibold hover:underline">
                  + Add Line Item
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-500">Save Draft Receipt</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
