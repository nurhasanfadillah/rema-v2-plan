import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';
import { AuditLog, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Search, Filter, ShieldAlert } from 'lucide-react';

export default function AuditLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<Omit<User, 'passwordHash'>[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    api.auditLogs.list(1000).then(setLogs).catch(console.error);
    api.users.list().then(setUsers).catch(console.error);
  }, []);

  // Strict role check
  if (!user || !['admin', 'staff'].includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-black text-slate-100 mb-2">Akses Ditolak</h2>
        <p className="text-slate-400 max-w-md mx-auto">
          Anda tidak memiliki izin untuk melihat halaman ini. Halaman ini hanya untuk Administrator dan Staff.
        </p>
      </div>
    );
  }

  const filteredLogs = logs.filter(log => {
    const userLog = users.find(u => u.id === log.userId);
    const userName = userLog ? userLog.name.toLowerCase() : 'system';
    const term = searchTerm.toLowerCase();
    
    return (
      userName.includes(term) ||
      log.action.toLowerCase().includes(term) ||
      log.details.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
             Audit Logs
          </h1>
          <p className="text-sm font-medium text-slate-400 mt-1">
            Riwayat aktivitas pengguna sistem
          </p>
        </div>
      </div>

      {/* Constraints & Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center shadow-lg shadow-blue-500/5">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama, aksi, atau detail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-100 placeholder:text-slate-600 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400 font-medium px-2">
            <Filter className="w-4 h-4" />
            <span>Menampilkan {filteredLogs.length} hasil</span>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl shadow-blue-500/5">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50">
                <th className="px-6 py-4 label-xs">Waktu</th>
                <th className="px-6 py-4 label-xs">Pengguna</th>
                <th className="px-6 py-4 label-xs">Aksi</th>
                <th className="px-6 py-4 label-xs">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 text-sm">
                    Tidak ada aktivitas ditemukan.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const logUser = users.find(u => u.id === log.userId);
                  return (
                    <tr key={log.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-300">
                          {format(log.createdAt, 'dd MMM yyyy', { locale: id })}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          {format(log.createdAt, 'HH:mm:ss')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-200">
                          {logUser ? logUser.name : 'Unknown User'}
                        </div>
                        {logUser && (
                          <div className="text-[10px] font-mono font-bold tracking-widest uppercase text-blue-400 mt-0.5">
                            {logUser.role}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 capitalize">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-400 line-clamp-2" title={log.details}>
                          {log.details}
                        </p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
