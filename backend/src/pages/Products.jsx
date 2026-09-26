import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Filter, AlertTriangle, CheckCircle, XCircle, Warehouse, X, Layers } from 'lucide-react';
import { apiClient } from '../api/client';

export const Products = ({ globalSearch }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(globalSearch || '');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category_id: '',
    unit_of_measure: 'Units',
    reorder_level: 10,
    initial_stock: 0,
    initial_location_id: ''
  });
  const [locations, setLocations] = useState([]);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    loadProductsData();
  }, [search, selectedCategory, selectedWarehouse, selectedStatus]);

  useEffect(() => {
    if (globalSearch !== undefined) setSearch(globalSearch);
  }, [globalSearch]);

  const loadProductsData = async () => {
    setLoading(true);
    try {
      let queryStr = '?';
      if (search) queryStr += `search=${encodeURIComponent(search)}&`;
      if (selectedCategory) queryStr += `category_id=${selectedCategory}&`;
      if (selectedWarehouse) queryStr += `warehouse_id=${selectedWarehouse}&`;
      if (selectedStatus) queryStr += `stock_status=${selectedStatus}&`;

      const [prodRes, catRes, whRes, locRes] = await Promise.all([
        apiClient.get(`/products${queryStr}`),
        apiClient.get('/products/categories'),
        apiClient.get('/warehouses'),
        apiClient.get('/warehouses/locations')
      ]);

      setProducts(prodRes || []);
      setCategories(catRes || []);
      setWarehouses(whRes || []);
      setLocations(locRes || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      await apiClient.post('/products', {
        ...formData,
        category_id: parseInt(formData.category_id),
        reorder_level: parseFloat(formData.reorder_level),
        initial_stock: parseFloat(formData.initial_stock),
        initial_location_id: formData.initial_location_id ? parseInt(formData.initial_location_id) : null
      });
      setShowCreateModal(false);
      setFormData({
        name: '', sku: '', category_id: '', unit_of_measure: 'Units', reorder_level: 10, initial_stock: 0, initial_location_id: ''
      });
      loadProductsData();
    } catch (err) {
      setFormError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Product Catalog & Stock Management</h2>
          <p className="text-slate-400 text-sm mt-1">Manage product records, reorder thresholds, and multi-location balances</p>
        </div>

        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-blue-600/30"
        >
          <Plus className="w-5 h-5" /> Add New Product
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Product Name or SKU..."
            className="w-full bg-slate-900/80 text-slate-200 text-sm pl-9 pr-4 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Category Filter */}
        <select 
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-900/80 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2 focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {/* Warehouse Filter */}
        <select 
          value={selectedWarehouse}
          onChange={(e) => setSelectedWarehouse(e.target.value)}
          className="bg-slate-900/80 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2 focus:outline-none"
        >
          <option value="">All Warehouses</option>
          {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>

        {/* Status Filter */}
        <select 
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-slate-900/80 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2 focus:outline-none"
        >
          <option value="">All Stock Statuses</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
      </div>

      {/* Product Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase">
              <tr>
                <th className="px-6 py-4">Product / SKU</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Total Stock</th>
                <th className="px-6 py-4">Reorder Level</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400">Loading product list...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400">No matching products found.</td>
                </tr>
              ) : (
                products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-100">{prod.name}</p>
                        <p className="text-xs text-blue-400 font-mono mt-0.5">{prod.sku}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium">
                        {prod.category_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold font-mono text-slate-100">
                      {prod.total_stock} <span className="text-xs font-normal text-slate-400">{prod.unit_of_measure}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-400">
                      {prod.reorder_level} {prod.unit_of_measure}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                        prod.stock_status === 'In Stock' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : prod.stock_status === 'Low Stock' 
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {prod.stock_status === 'In Stock' && <CheckCircle className="w-3.5 h-3.5" />}
                        {prod.stock_status === 'Low Stock' && <AlertTriangle className="w-3.5 h-3.5" />}
                        {prod.stock_status === 'Out of Stock' && <XCircle className="w-3.5 h-3.5" />}
                        {prod.stock_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedProduct(prod)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-semibold rounded-lg transition-colors"
                      >
                        View Details & Balances
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-400" /> Create Product Record
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Product Name *</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Steel Rods, Ergonomic Chair"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">SKU Code (Unique) *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value.toUpperCase()})}
                    placeholder="STL-ROD-100"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category *</label>
                  <select 
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Unit of Measure</label>
                  <input 
                    type="text"
                    value={formData.unit_of_measure}
                    onChange={(e) => setFormData({...formData, unit_of_measure: e.target.value})}
                    placeholder="Units, kg, meters, boxes"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Reorder Level Threshold</label>
                  <input 
                    type="number"
                    min="0"
                    step="any"
                    value={formData.reorder_level}
                    onChange={(e) => setFormData({...formData, reorder_level: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Opening Stock (Optional)</label>
                  <input 
                    type="number"
                    min="0"
                    step="any"
                    value={formData.initial_stock}
                    onChange={(e) => setFormData({...formData, initial_stock: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Stock Location</label>
                  <select 
                    value={formData.initial_location_id}
                    onChange={(e) => setFormData({...formData, initial_location_id: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                  >
                    <option value="">Select Location</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name} ({l.code})</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-500">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-slate-100">{selectedProduct.name}</h3>
                <p className="text-xs text-blue-400 font-mono mt-0.5">SKU: {selectedProduct.sku} • {selectedProduct.category_name}</p>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              <div>
                <p className="text-xs text-slate-400">Total Stock</p>
                <p className="text-lg font-bold text-slate-100 font-mono">{selectedProduct.total_stock} {selectedProduct.unit_of_measure}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Reorder Threshold</p>
                <p className="text-lg font-bold text-slate-300 font-mono">{selectedProduct.reorder_level} {selectedProduct.unit_of_measure}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Status</p>
                <p className="text-sm font-bold text-amber-400 mt-1">{selectedProduct.stock_status}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-blue-400" /> Warehouse Location Balances
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedProduct.balances.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No stock allocated to locations yet.</p>
                ) : (
                  selectedProduct.balances.map(b => (
                    <div key={b.id} className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-200">{b.location_name}</p>
                        <p className="text-slate-400 text-[10px]">{b.warehouse_name}</p>
                      </div>
                      <span className="font-bold font-mono text-emerald-400 text-sm">{b.quantity} {selectedProduct.unit_of_measure}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setSelectedProduct(null)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
