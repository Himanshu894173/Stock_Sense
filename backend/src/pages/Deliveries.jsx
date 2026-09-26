import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Plus, Trash2, X, AlertTriangle } from 'lucide-react';
import { apiClient } from '../api/client';

export const Deliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [sourceLocationId, setSourceLocationId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }]);

  useEffect(() => {
    loadDeliveriesData();
  }, []);

  const loadDeliveriesData = async () => {
    setLoading(true);
    try {
      const [dRes, pRes, lRes] = await Promise.all([
        apiClient.get('/deliveries'),
        apiClient.get('/products'),
        apiClient.get('/warehouses/locations')
      ]);
      setDeliveries(dRes || []);
      setProducts(pRes || []);
      setLocations(lRes || []);
    } catch (err) {
      console.error('Failed to load deliveries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => setItems([...items, { product_id: '', quantity: 1 }]);
  const handleRemoveItem = (idx) => setItems(items.filter((_, i) => i !== idx));
  const handleItemChange = (idx, field, val) => {
    const updated = [...items];
    updated[idx][field] = val;
    setItems(updated);
  };

  const handleCreateDelivery = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await apiClient.post('/deliveries', {
        customer_name: customerName,
        source_location_id: parseInt(sourceLocationId),
        notes,
        items: items.map(i => ({ product_id: parseInt(i.product_id), quantity: parseFloat(i.quantity) }))
      });
      setShowModal(false);
      setItems([{ product_id: '', quantity: 1 }]);
      setCustomerName('');
      loadDeliveriesData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleValidate = async (id) => {
    try {
      await apiClient.post(`/deliveries/${id}/validate`);
      loadDeliveriesData();
    } catch (err) {
      alert(`Insufficient Stock / Validation Error:\n${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <ArrowUpRight className="w-6 h-6 text-purple-400" /> Outgoing Delivery Orders
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Customer shipments. Validations check available stock balance & prevent negative stock.
          </p>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-purple-600/30"
        >
          <Plus className="w-5 h-5" /> Create Delivery Order
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase">
              <tr>
                <th className="px-6 py-4">Reference No</th>
                <th className="px-6 py-4">Source Location</th>
                <th className="px-6 py-4">Customer / Destination</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Items Count</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-8 text-slate-400">Loading delivery orders...</td></tr>
              ) : deliveries.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 text-slate-400">No delivery orders found.</td></tr>
              ) : (
                deliveries.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-bold font-mono text-slate-100">{d.reference_no}</td>
                    <td className="px-6 py-4 text-slate-200">{d.source_location_name}</td>
                    <td className="px-6 py-4 text-slate-400">{d.customer_name || 'Standard Shipment'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        d.status === 'Done' ? 'badge-done' :
                        d.status === 'Draft' ? 'badge-draft' : 'badge-waiting'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono">{d.items.length} Item(s)</td>
                    <td className="px-6 py-4 text-right">
                      {d.status !== 'Done' && (
                        <button 
                          onClick={() => handleValidate(d.id)}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-sm"
                        >
                          Validate & Deduct Stock
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
                <ArrowUpRight className="w-5 h-5 text-purple-400" /> Create Delivery Order
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
            </div>

            {errorMsg && <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">{errorMsg}</div>}

            <form onSubmit={handleCreateDelivery} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Customer / Recipient Name</label>
                  <input 
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. AeroTech Manufacturing"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Source Location *</label>
                  <select 
                    required
                    value={sourceLocationId}
                    onChange={(e) => setSourceLocationId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200"
                  >
                    <option value="">Select Source Warehouse / Rack</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name} ({l.code})</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Products to Ship *</label>
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
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-xl hover:bg-purple-500">Save Draft Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
