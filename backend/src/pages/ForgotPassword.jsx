import React, { useState } from 'react';
import { Mail, KeyRound, CheckCircle2, ArrowRight } from 'lucide-react';
import { apiClient } from '../api/client';

export const ForgotPassword = ({ onSwitchToLogin }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await apiClient.post('/auth/forgot-password', { email });
      setMsg(res.message);
      setStep(2);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await apiClient.post('/auth/reset-password', { email, otp, new_password: newPassword });
      setMsg('Password updated successfully! You can now log in.');
      setStep(3);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Reset Password</h1>
          <p className="text-slate-400 text-xs">StockSense OTP-Based Authentication Reset</p>
        </div>

        <div className="glass-panel p-8 space-y-4 glow-blue">
          {error && <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl font-medium">{error}</div>}
          {msg && <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl font-medium">{msg}</div>}

          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@stocksense.com" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200" />
              </div>
              <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl">Generate OTP Code</button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Enter 6-Digit OTP *</label>
                <input required type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 font-mono" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">New Password *</label>
                <input required type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200" />
              </div>
              <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl">Update Password</button>
            </form>
          )}

          {step === 3 && (
            <button onClick={onSwitchToLogin} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl">Return to Login</button>
          )}
        </div>

        <p className="text-center text-xs text-slate-400">
          Remember your password? <button onClick={onSwitchToLogin} className="text-blue-400 font-semibold hover:underline">Back to Sign In</button>
        </p>
      </div>
    </div>
  );
};
