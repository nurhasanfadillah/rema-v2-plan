/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ConfirmProvider } from './context/ConfirmContext';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Mitras from './pages/Mitras';
import Products from './pages/Products';
import OrdersList from './pages/orders/OrdersList';
import CreateOrder from './pages/orders/CreateOrder';

const OrderDetail = React.lazy(() => import('./pages/orders/OrderDetail'));
const AppQueue = React.lazy(() => import('./pages/AppQueue'));
const Finance = React.lazy(() => import('./pages/Finance'));
const CancellationsReturns = React.lazy(() => import('./pages/CancellationsReturns'));
const Reports = React.lazy(() => import('./pages/Reports'));
const AuditLogs = React.lazy(() => import('./pages/AuditLogs'));
const OrderPriorities = React.lazy(() => import('./pages/OrderPriorities'));

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Login />;
  if (user.mustChangePassword) return <ChangePassword />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <ConfirmProvider>
        <BrowserRouter>
          <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}>
            <Routes>
              <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
                <Route index element={<Dashboard />} />
                <Route path="users" element={<Users />} />
                <Route path="mitras" element={<Mitras />} />
                <Route path="products" element={<Products />} />
                <Route path="orders" element={<OrdersList />} />
                <Route path="orders/drafts" element={<OrdersList />} />
                <Route path="orders/create" element={<CreateOrder />} />
                <Route path="orders/:id/edit" element={<CreateOrder />} />
                <Route path="orders/:id" element={<OrderDetail />} />
                <Route path="queue" element={<AppQueue />} />
                <Route path="priority" element={<OrderPriorities />} />
                <Route path="finance" element={<Finance />} />
                <Route path="reports" element={<Reports />} />
                <Route path="audit-logs" element={<AuditLogs />} />
                <Route path="cancellations" element={<CancellationsReturns />} />
                <Route path="change-password" element={<ChangePassword />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster position="top-right" />
      </ConfirmProvider>
    </AuthProvider>
  );
}
