import React, { useState, useEffect } from 'react';
import { Warehouse as WarehouseIcon, MapPin, Plus, Boxes, X } from 'lucide-react';
import { apiClient } from '../api/client';

export const Warehouses = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showWhModal, setShowWhModal] = useState(false);
  const [showLocModal, setShowLocModal] = useState(false);
  const [selectedWhId, setSelectedWhId] = useState('');

  // Form State
  const [whName, setWhName] = useState('');
  const [whCode, setWhCode] = useState('');
  const [whAddress, setWhAddress] = useState('');

  const [locName, setLocName] = useState('');
  const [locCode, setLocCode] = useState('');

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/warehouses');
      setWarehouses(res || []);
    } catch (err) {
      console.error('Failed loading warehouses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWarehouse = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/warehouses', { name: whName, code: whCode, address: whAddress });
      setShowWhModal(false);
      setWhName(''); setWhCode(''); setWhAddress('');
      loadWarehouses();
    } catch (err) {
      alert(`Error creating warehouse: ${err.message}`);
    }
  };

  const handleCreateLocation = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/warehouses/locations', {
        warehouse_id: parseInt(selectedWhId),
        name: locName,
        code: locCode
      });
      setShowLocModal(false);
      setLocName(''); setLocCode('');
      loadWarehouses();
    } catch (err) {
      alert(`Error creating location: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <WarehouseIcon className="w-6 h-6 text-blue-400" /> Multi-Warehouse & Location Hierarchy
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Organize storage locations, aisles, racks, and production floors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowLocModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-blue-400 font-semibold text-xs rounded-xl border border-slate-700 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Rack/Location
          </button>
          <button 
            onClick={() => setShowWhModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-blue-600/30"
          >
            <Plus className="w-5 h-5" /> Add Warehouse
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-slate-400 col-span-3 text-center py-8">Loading warehouse hierarchy...</p>
        ) : (
          warehouses.map((wh) => (
            <div key={wh.id} className="glass-panel p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
                    {wh.code}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-base">{wh.name}</h3>
                    <p className="text-xs text-slate-400">{wh.address || 'Standard Hub'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" /> Sub-Locations ({wh.locations ? wh.locations.length : 0})
                </h4>
                <div className="space-y-2">
                  {(!wh.locations || wh.locations.length === 0) ? (
                    <p className="text-xs text-slate-400 py-2">No sub-locations configured.</p>
                  ) : (
                    wh.locations.map((loc) => (
                      <div key={loc.id} className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-200">{loc.name}</p>
                          <p className="text-xs text-blue-400 font-mono">Code: {loc.code}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Warehouse Modal */}
      {showWhModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100">Add Warehouse Hub</h3>
              <button onClick={() => setShowWhModal(false)} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateWarehouse} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Warehouse Name *</label>
                <input required type="text" value={whName} onChange={(e) => setWhName(e.target.value)} placeholder="Main Warehouse" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Warehouse Code *</label>
                <input required type="text" value={whCode} onChange={(e) => setWhCode(e.target.value.toUpperCase())} placeholder="MWH" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Address / Location Info</label>
                <input type="text" value={whAddress} onChange={(e) => setWhAddress(e.target.value)} placeholder="100 Logistics Way" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200" />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowWhModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-500">Create Warehouse</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Location Modal */}
      {showLocModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100">Add Sub-Location / Rack</h3>
              <button onClick={() => setShowLocModal(false)} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateLocation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Parent Warehouse *</label>
                <select required value={selectedWhId} onChange={(e) => setSelectedWhId(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200">
                  <option value="">Select Warehouse</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Location Name *</label>
                <input required type="text" value={locName} onChange={(e) => setLocName(e.target.value)} placeholder="Rack A / Production Floor" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Location Code *</label>
                <input required type="text" value={locCode} onChange={(e) => setLocCode(e.target.value.toUpperCase())} placeholder="MWH-RA" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-slate-200" />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowLocModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-500">Create Location</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
