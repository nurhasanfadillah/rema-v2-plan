import type {
  User,
  Mitra,
  Product,
  Order,
  LedgerEntry,
  ActionRequest,
  AuditLog,
  OrderPriority,
} from '../types';

type SafeUser = Omit<User, 'passwordHash'>;

const BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('rema_token');
}

function setToken(token: string): void {
  localStorage.setItem('rema_token', token);
}

function clearToken(): void {
  localStorage.removeItem('rema_token');
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json() as Promise<T>;
}

export const api = {
  auth: {
    login: (phone: string, password: string) =>
      request<{ token: string; user: SafeUser }>('POST', '/auth/login', { phone, password }),
    me: () => request<{ user: SafeUser }>('GET', '/auth/me'),
    setToken,
    clearToken,
    getToken,
  },

  mitras: {
    list: () => request<Mitra[]>('GET', '/mitras'),
    create: (data: Omit<Mitra, 'id'>) => request<Mitra>('POST', '/mitras', data),
    update: (id: string, data: Partial<Mitra>) => request<Mitra>('PUT', `/mitras/${id}`, data),
    remove: (id: string) => request<void>('DELETE', `/mitras/${id}`),
  },

  products: {
    list: () => request<Product[]>('GET', '/products'),
    create: (data: Omit<Product, 'id'> & { id?: string }) => request<Product>('POST', '/products', data),
    update: (id: string, data: Partial<Product>) => request<Product>('PUT', `/products/${id}`, data),
    remove: (id: string) => request<void>('DELETE', `/products/${id}`),
  },

  users: {
    list: () => request<SafeUser[]>('GET', '/users'),
    create: (data: Omit<User, 'id' | 'passwordHash'> & { password: string; id?: string }) =>
      request<SafeUser>('POST', '/users', data),
    update: (id: string, data: Partial<Omit<User, 'passwordHash'>> & { newPassword?: string }) =>
      request<SafeUser>('PUT', `/users/${id}`, data),
    changePassword: (id: string, body: { oldPassword?: string; newPassword: string }) =>
      request<SafeUser>('PATCH', `/users/${id}/password`, body),
    remove: (id: string) => request<void>('DELETE', `/users/${id}`),
  },

  orders: {
    list: () => request<Order[]>('GET', '/orders'),
    get: (id: string) => request<Order>('GET', `/orders/${id}`),
    create: (data: Omit<Order, 'id'>) => request<Order>('POST', '/orders', data),
    update: (id: string, data: Partial<Order>) => request<Order>('PUT', `/orders/${id}`, data),
    remove: (id: string) => request<void>('DELETE', `/orders/${id}`),
  },

  ledgers: {
    list: (mitraId?: string) =>
      request<LedgerEntry[]>('GET', mitraId ? `/ledgers?mitraId=${mitraId}` : '/ledgers'),
    create: (data: Omit<LedgerEntry, 'id'>) => request<LedgerEntry>('POST', '/ledgers', data),
    update: (id: string, data: Partial<LedgerEntry>) => request<LedgerEntry>('PUT', `/ledgers/${id}`, data),
    remove: (id: string) => request<void>('DELETE', `/ledgers/${id}`),
    removeByOrder: (orderId: string) => request<void>('DELETE', `/ledgers/order/${orderId}`),
  },

  requests: {
    list: () => request<ActionRequest[]>('GET', '/requests'),
    create: (data: Omit<ActionRequest, 'id'>) => request<ActionRequest>('POST', '/requests', data),
    update: (id: string, data: Partial<ActionRequest>) =>
      request<ActionRequest>('PUT', `/requests/${id}`, data),
  },

  auditLogs: {
    list: (limit?: number) =>
      request<AuditLog[]>('GET', limit ? `/audit-logs?limit=${limit}` : '/audit-logs'),
    create: (data: Omit<AuditLog, 'id' | 'createdAt'>) =>
      request<AuditLog>('POST', '/audit-logs', data),
  },

  priorities: {
    list: () => request<OrderPriority[]>('GET', '/priorities'),
    create: (data: { orderId: string; notes?: string }) =>
      request<OrderPriority>('POST', '/priorities', data),
    remove: (id: string) => request<void>('DELETE', `/priorities/${id}`),
  },

  upload: {
    file: (file: File) => {
      const token = getToken();
      return fetch(`${BASE}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': file.type,
          'X-File-Name': file.name,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: file,
      }).then(async res => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(err.error || res.statusText);
        }
        return res.json() as Promise<{ url: string }>;
      });
    },
  },
};
