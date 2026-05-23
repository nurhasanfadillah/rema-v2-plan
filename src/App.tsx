/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
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
import OrderDetail from './pages/orders/OrderDetail';
import AppQueue from './pages/AppQueue';
import Finance from './pages/Finance';
import CancellationsReturns from './pages/CancellationsReturns';

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
              <Route path="finance" element={<Finance />} />
              <Route path="cancellations" element={<CancellationsReturns />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </ConfirmProvider>
    </AuthProvider>
  );
}
