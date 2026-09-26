import React, { useState } from 'react';
import { Boxes, Lock, Mail, User, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Signup = ({ onSwitchToLogin }) => {
  const { signup } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Inventory Manager');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signup(email, password, fullName, role);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 mx-auto flex items-center justify-center shadow-xl shadow-blue-500/20">
            <Boxes className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Create StockSense Account</h1>
          <p className="text-slate-400 text-xs">Join your inventory management system</p>
        </div>

        <div className="glass-panel p-8 space-y-4 glow-blue">
          {error && <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl font-medium">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Alex Mercer" className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alex@company.com" className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Role *</label>
              <div className="relative">
                <Shield className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none">
                  <option value="Inventory Manager">Inventory Manager</option>
                  <option value="Warehouse Staff">Warehouse Staff</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-blue-600/30">
              {loading ? 'Creating Account...' : 'Register Account'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400">
          Already have an account? <button onClick={onSwitchToLogin} className="text-blue-400 font-semibold hover:underline">Sign In</button>
        </p>
      </div>
    </div>
  );
};
