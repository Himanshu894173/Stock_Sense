import React, { useState } from 'react';
import { Boxes, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login = ({ onSwitchToSignup, onSwitchToForgot }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@stocksense.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 mx-auto flex items-center justify-center shadow-xl shadow-blue-500/20">
            <Boxes className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Welcome to StockSense</h1>
          <p className="text-slate-400 text-xs">Enter your credentials to access the Inventory Management ERP</p>
        </div>

        {/* Card */}
        <div className="glass-panel p-8 space-y-4 glow-blue">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
                <button type="button" onClick={onSwitchToForgot} className="text-[11px] text-blue-400 hover:underline">Forgot password?</button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-blue-600/30"
            >
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">Quick Demo Accounts:</p>
            <div className="flex justify-between font-mono bg-slate-900/60 p-2 rounded-lg border border-slate-800 text-[11px]">
              <span>Manager: admin@stocksense.com</span>
              <span className="text-blue-400">admin123</span>
            </div>
            <div className="flex justify-between font-mono bg-slate-900/60 p-2 rounded-lg border border-slate-800 text-[11px]">
              <span>Staff: staff@stocksense.com</span>
              <span className="text-blue-400">staff123</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <button onClick={onSwitchToSignup} className="text-blue-400 font-semibold hover:underline">Create Account</button>
        </p>
      </div>
    </div>
  );
};
