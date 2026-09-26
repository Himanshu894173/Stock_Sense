import React from 'react';
import { User, Shield, Mail, Calendar, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-2xl text-white shadow-xl shadow-blue-500/20">
          {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-100">{user?.full_name}</h2>
          <span className="inline-block mt-1 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
            {user?.role}
          </span>
        </div>
      </div>

      <div className="glass-panel p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-200 border-b border-slate-800 pb-3">User Profile Details</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-sm">
            <span className="text-slate-400 flex items-center gap-2"><Mail className="w-4 h-4 text-blue-400" /> Email Address</span>
            <span className="font-semibold text-slate-200">{user?.email}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-sm">
            <span className="text-slate-400 flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-400" /> Role Permissions</span>
            <span className="font-semibold text-slate-200">{user?.role}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-sm">
            <span className="text-slate-400 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" /> Account Status</span>
            <span className="font-semibold text-emerald-400">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
