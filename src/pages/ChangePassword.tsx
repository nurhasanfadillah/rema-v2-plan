import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';

export default function ChangePassword() {
  const { user, logout, updateUser } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8 || password.length > 64) {
      toast.error('Password must be between 8 and 64 characters.');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match.');
      return;
    }

    const users = db.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], passwordHash: password, mustChangePassword: false };
      db.saveUsers(users);
      updateUser(users[idx]);
      db.addAuditLog({ userId: user.id, action: 'PASSWORD_CHANGED', details: 'User changed password upon requirement' });
      toast.success('Password berhasil diperbarui');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900 font-sans p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8">
        <h2 className="text-2xl font-bold mb-2">Change Password Required</h2>
        <p className="text-gray-500 mb-6 text-sm">Please secure your account by changing the default password.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input 
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 outline-none"
              required minLength={8} maxLength={64}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input 
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 outline-none"
              required
            />
          </div>

          <div className="pt-4 flex gap-3">
             <button type="button" onClick={logout} className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition">
              Logout
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition">
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
