import { User, Mitra, Product, Order, LedgerEntry, ActionRequest, AuditLog } from '../types';

const DB_KEY = 'rema_v2_db';

interface DatabaseData {
  users: User[];
  mitras: Mitra[];
  products: Product[];
  orders: Order[];
  ledgers: LedgerEntry[];
  requests: ActionRequest[];
  auditLogs: AuditLog[];
}

const initialData: DatabaseData = {
  users: [
    {
      id: 'admin_1',
      name: 'Super Admin',
      phone: '6281234567890',
      passwordHash: 'rema1234',
      role: 'admin',
      isActive: true,
      mustChangePassword: true,
    }
  ],
  mitras: [],
  products: [],
  orders: [],
  ledgers: [],
  requests: [],
  auditLogs: [],
};

function readDB(): DatabaseData {
  try {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : initialData;
  } catch (e) {
    return initialData;
  }
}

function writeDB(data: DatabaseData) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  } catch (err: any) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError' || err.message.includes('Quota')) {
      alert("Penyimpanan Browser (Storage) Penuh! File terlalu besar atau banyak. Silahkan hapus data lama atau gunakan gambar ukuran yang lebih kecil (<500kb).");
    } else {
      alert("Gagal menyimpan data ke sistem: " + err.message);
    }
    console.error("Local Storage Error:", err);
  }
}

// Ensure init
if (!localStorage.getItem(DB_KEY)) {
  writeDB(initialData);
}

export const db = {
  getUsers: () => readDB().users,
  saveUsers: (users: User[]) => {
    const data = readDB();
    data.users = users;
    writeDB(data);
  },
  
  getMitras: () => readDB().mitras,
  saveMitras: (mitras: Mitra[]) => {
    const data = readDB();
    data.mitras = mitras;
    writeDB(data);
  },

  getProducts: () => readDB().products,
  saveProducts: (products: Product[]) => {
    const data = readDB();
    data.products = products;
    writeDB(data);
  },

  getOrders: () => readDB().orders,
  saveOrders: (orders: Order[]) => {
    const data = readDB();
    data.orders = orders;
    writeDB(data);
  },

  getLedgers: () => readDB().ledgers,
  saveLedgers: (ledgers: LedgerEntry[]) => {
    const data = readDB();
    data.ledgers = ledgers;
    writeDB(data);
  },

  getRequests: () => readDB().requests,
  saveRequests: (requests: ActionRequest[]) => {
    const data = readDB();
    data.requests = requests;
    writeDB(data);
  },

  getAuditLogs: () => readDB().auditLogs,
  addAuditLog: (log: Omit<AuditLog, 'id' | 'createdAt'>) => {
    const data = readDB();
    data.auditLogs.unshift({
      ...log,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    });
    // keep recent 1000
    if (data.auditLogs.length > 1000) data.auditLogs.length = 1000;
    writeDB(data);
  },
  
  reset: () => {
      writeDB(initialData);
  }
};
