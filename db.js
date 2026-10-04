import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chaincert';
const DB_NAME = process.env.MONGODB_DATABASE || 'chaincert';

let client = null;
let db = null;
let isConnected = false;
let dbMode = 'in-memory-mongodb';

class InMemoryCursor {
  constructor(items, query = {}) {
    this.items = filterItems(items, query);
    this._sortObj = null;
    this._skipNum = 0;
    this._limitNum = null;
  }
  sort(sortObj) {
    this._sortObj = sortObj;
    return this;
  }
  skip(skipNum) {
    this._skipNum = skipNum;
    return this;
  }
  limit(limitNum) {
    this._limitNum = limitNum;
    return this;
  }
  async toArray() {
    let result = [...this.items];
    if (this._sortObj) {
      result = sortItems(result, this._sortObj);
    }
    if (this._skipNum > 0) {
      result = result.slice(this._skipNum);
    }
    if (this._limitNum !== null && this._limitNum >= 0) {
      result = result.slice(0, this._limitNum);
    }
    return result;
  }
}

// In-Memory Data Store (Fallback if MongoDB daemon is unreachable locally)
class InMemoryStore {
  constructor() {
    this.collections = {
      users: [],
      certificates: [],
      blocks: [],
      certificate_drafts: [],
      verification_logs: [],
      activity_logs: [],
      stats: [],
    };
    this.seedInitialData();
  }

  async seedInitialData() {
    if (this.collections.users.length === 0) {
      const defaultPasswordHash = await bcrypt.hash('HemaKarthik0728', 10);
      const testPasswordHash = await bcrypt.hash('Password123!', 10);

      this.collections.users.push(
        {
          id: '45ed3132-b7ba-473b-83d0-600b3de3e47b',
          email: 'hema.work0728@gmail.com',
          full_name: 'Hema (Administrator)',
          role: 'admin',
          status: 'approved',
          password: defaultPasswordHash,
          created_at: new Date().toISOString(),
        },
        {
          id: '37749efd-ae30-42c9-bf99-cf2619ec57db',
          email: 'admin@chaincert.io',
          full_name: 'System Administrator',
          role: 'admin',
          status: 'approved',
          password: testPasswordHash,
          created_at: new Date().toISOString(),
        },
        {
          id: '5856592a-f3b1-4f7e-b33d-b95d67670636',
          email: 'testteacher@chaincert.io',
          full_name: 'Dr. Sarah Smith',
          role: 'teacher',
          status: 'approved',
          password: testPasswordHash,
          created_at: new Date().toISOString(),
        },
        {
          id: '3fc892dd-8a26-46a0-bdf0-0ce057c4bf1e',
          email: 'teststudent@chaincert.io',
          full_name: 'Alex Johnson',
          role: 'student',
          status: 'approved',
          password: testPasswordHash,
          created_at: new Date().toISOString(),
        },
        {
          id: '9b1d83ef-74a2-4e89-a21b-83c9a1742019',
          email: 'testemployer@chaincert.io',
          full_name: 'Global Talent HR Services',
          role: 'employer',
          status: 'approved',
          password: testPasswordHash,
          created_at: new Date().toISOString(),
        }
      );
    }
  }

  getCollection(name) {
    if (!this.collections[name]) {
      this.collections[name] = [];
    }
    const store = this.collections[name];

    return {
      find: (query = {}) => new InMemoryCursor(store, query),
      findOne: async (query = {}) => {
        const results = filterItems(store, query);
        return results[0] || null;
      },
      insertOne: async (doc) => {
        const newDoc = { _id: String(Date.now() + Math.random()), ...doc };
        store.push(newDoc);
        return { insertedId: newDoc._id };
      },
      insertMany: async (docs) => {
        const inserted = docs.map((d) => ({ _id: String(Date.now() + Math.random()), ...d }));
        store.push(...inserted);
        return { insertedCount: inserted.length };
      },
      updateOne: async (query, update) => {
        const item = (await filterItems(store, query))[0];
        if (!item) return { matchedCount: 0, modifiedCount: 0 };
        if (update.$set) {
          Object.assign(item, update.$set);
        }
        return { matchedCount: 1, modifiedCount: 1 };
      },
      deleteOne: async (query) => {
        const idx = store.findIndex((i) => matchQuery(i, query));
        if (idx !== -1) {
          store.splice(idx, 1);
          return { deletedCount: 1 };
        }
        return { deletedCount: 0 };
      },
      countDocuments: async (query = {}) => {
        return filterItems(store, query).length;
      },
    };
  }
}

function matchQuery(item, query) {
  for (const [key, val] of Object.entries(query)) {
    if (key === '$or' && Array.isArray(val)) {
      const match = val.some((subQ) => matchQuery(item, subQ));
      if (!match) return false;
      continue;
    }
    if (val && typeof val === 'object' && val.$regex) {
      const reg = new RegExp(val.$regex, val.$options || 'i');
      if (!reg.test(String(item[key] || ''))) return false;
      continue;
    }
    if (val && typeof val === 'object' && val.$in) {
      if (!val.$in.includes(item[key])) return false;
      continue;
    }
    if (item[key] !== val) return false;
  }
  return true;
}

function filterItems(store, query) {
  return store.filter((item) => matchQuery(item, query));
}

function sortItems(items, sortObj) {
  const sorted = [...items];
  const entries = Object.entries(sortObj);
  if (entries.length === 0) return sorted;
  const [field, dir] = entries[0];
  return sorted.sort((a, b) => {
    const valA = a[field] ?? '';
    const valB = b[field] ?? '';
    if (valA < valB) return dir === 1 ? -1 : 1;
    if (valA > valB) return dir === 1 ? 1 : -1;
    return 0;
  });
}

const fallbackStore = new InMemoryStore();

export async function connectToDatabase() {
  if (db && isConnected) return { db, mode: dbMode, connected: true };

  try {
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    await client.connect();
    db = client.db(DB_NAME);
    isConnected = true;
    dbMode = MONGODB_URI.includes('mongodb+srv://') || MONGODB_URI.includes('.mongodb.net')
      ? 'mongodb-atlas'
      : 'mongodb';

    console.log(`[ChainCert DB] Connected to database '${DB_NAME}' (${dbMode}).`);
    await ensureIndexes(db);
    await seedDefaultUsers(db);
    return { db, mode: dbMode, connected: true };
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(`[ChainCert DB] Production MongoDB connection failed (${err.message}). Falling back to in-memory DB.`);
    }
    console.warn(`[ChainCert DB] MongoDB Server connection note (${err.message}). Using local in-memory DB engine.`);
    isConnected = false;
    dbMode = 'in-memory-mongodb';
    return {
      db: {
        collection: (name) => fallbackStore.getCollection(name),
      },
      mode: 'in-memory-mongodb',
      connected: false,
    };
  }
}

async function seedDefaultUsers(mongodb) {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  try {
    const usersCol = mongodb.collection('users');
    const existingCount = await usersCol.countDocuments();
    if (existingCount === 0) {
      const defaultPasswordHash = await bcrypt.hash('HemaKarthik0728', 10);
      const testPasswordHash = await bcrypt.hash('Password123!', 10);

      await usersCol.insertMany([
        {
          id: '45ed3132-b7ba-473b-83d0-600b3de3e47b',
          email: 'hema.work0728@gmail.com',
          full_name: 'Hema (Administrator)',
          role: 'admin',
          status: 'approved',
          password: defaultPasswordHash,
          created_at: new Date().toISOString(),
        },
        {
          id: '37749efd-ae30-42c9-bf99-cf2619ec57db',
          email: 'admin@chaincert.io',
          full_name: 'System Administrator',
          role: 'admin',
          status: 'approved',
          password: testPasswordHash,
          created_at: new Date().toISOString(),
        },
        {
          id: '5856592a-f3b1-4f7e-b33d-b95d67670636',
          email: 'testteacher@chaincert.io',
          full_name: 'Dr. Sarah Smith',
          role: 'teacher',
          status: 'approved',
          password: testPasswordHash,
          created_at: new Date().toISOString(),
        },
        {
          id: '3fc892dd-8a26-46a0-bdf0-0ce057c4bf1e',
          email: 'teststudent@chaincert.io',
          full_name: 'Alex Johnson',
          role: 'student',
          status: 'approved',
          password: testPasswordHash,
          created_at: new Date().toISOString(),
        },
        {
          id: '9b1d83ef-74a2-4e89-a21b-83c9a1742019',
          email: 'testemployer@chaincert.io',
          full_name: 'Global Talent HR Services',
          role: 'employer',
          status: 'approved',
          password: testPasswordHash,
          created_at: new Date().toISOString(),
        },
      ]);
      console.log('[ChainCert DB] Seeded initial production users into MongoDB.');
    }
  } catch (err) {
    console.error('[ChainCert DB Seeding Error]', err.message);
  }
}

export function getDb() {
  if (db && isConnected) return db;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('[ChainCert DB Fatal] Production database is not connected. Fallback store is disabled in production.');
  }
  return {
    collection: (name) => fallbackStore.getCollection(name),
  };
}

async function ensureIndexes(mongodb) {
  try {
    if (!mongodb || typeof mongodb.collection !== 'function') return;
    await mongodb.collection('users').createIndex({ email: 1 });
    await mongodb.collection('certificates').createIndex({ certificate_id: 1 });
    await mongodb.collection('certificates').createIndex({ certificate_hash: 1 });
    await mongodb.collection('blocks').createIndex({ certificate_id: 1 });
    await mongodb.collection('certificate_drafts').createIndex({ draft_id: 1 });
  } catch (_) {
    // Non-blocking index creation
  }
}
