try { process.loadEnvFile?.(); } catch (_) {}
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { connectToDatabase, getDb } from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || 'chaincert-super-secret-jwt-key-2026';

const rawAllowedOrigins = (process.env.ALLOWED_ORIGIN || process.env.FRONTEND_URL || '').trim();
const configuredOrigins = rawAllowedOrigins
  ? rawAllowedOrigins.split(',').map((o) => o.trim().replace(/\/+$/, '')).filter(Boolean)
  : [];

// ============================================================
// RATE LIMITING (Sliding window in-memory)
// ============================================================
const rateLimitMap = new Map();

function checkRateLimit(key, limit = 60, windowMs = 60000) {
  const now = Date.now();
  const entry = rateLimitMap.get(key) || { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((ts) => now - ts < windowMs);
  if (entry.timestamps.length >= limit) {
    return false;
  }
  entry.timestamps.push(now);
  rateLimitMap.set(key, entry);
  return true;
}

// Periodic cleanup
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    entry.timestamps = entry.timestamps.filter((ts) => now - ts < 60000);
    if (entry.timestamps.length === 0) {
      rateLimitMap.delete(key);
    }
  }
}, 60000);

// ============================================================
// SANITIZATION & SECURITY HELPERS
// ============================================================
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
}

const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.bin', '.js', '.mjs', '.ts', '.html', '.htm',
  '.svg', '.vbs', '.msi', '.ps1', '.php', '.py', '.rb', '.com', '.scr', '.pif',
  '.jar', '.apk', '.vbe', '.wsf', '.wsh'
];

function validateUploadedFile(fileName, fileSize) {
  if (!fileName) return { valid: false, error: 'File name is required' };
  const lower = fileName.toLowerCase();

  const parts = lower.split('.');
  if (parts.length > 2) {
    for (let i = 1; i < parts.length; i++) {
      const subExt = `.${parts[i]}`;
      if (DANGEROUS_EXTENSIONS.includes(subExt)) {
        return { valid: false, error: `Double extension with executable pattern (${subExt}) is prohibited` };
      }
    }
  }

  for (const ext of DANGEROUS_EXTENSIONS) {
    if (lower.endsWith(ext)) {
      return { valid: false, error: `Executable or script files (${ext}) are prohibited` };
    }
  }

  const allowed = ['.pdf', '.png', '.jpg', '.jpeg'];
  const hasAllowedExt = allowed.some((ext) => lower.endsWith(ext));
  if (!hasAllowedExt) {
    return { valid: false, error: 'Only PDF, PNG, or JPG/JPEG documents are accepted' };
  }

  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
  if (fileSize && fileSize > MAX_SIZE) {
    return { valid: false, error: 'File size exceeds 5 MB limit' };
  }

  return { valid: true };
}

// ============================================================
// CORS CONFIGURATION
// ============================================================
const corsOptions = {
  origin: (origin, callback) => {
    // Mirror requesting origin or allow dev/production origins
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'apikey', 'X-Client-Info'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON payload in request body.' });
  }
  next();
});

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Crypto helpers
function sha256Hex(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function generateCertId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `CERT-${segment()}-${segment()}`;
}

function generateDraftId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `DRAFT-${segment()}-${segment()}`;
}

function generateUUID() {
  return crypto.randomUUID();
}

// User Auth helper from JWT Token
async function getUserFromRequest(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const database = getDb();
    const profile = await database.collection('users').findOne({
      $or: [{ id: decoded.sub || decoded.id }, { email: decoded.email }],
    });
    if (!profile) return null;
    return { user: { id: profile.id, email: profile.email }, profile };
  } catch (err) {
    return null;
  }
}

// Audit Logger
async function logActivity(userId, userEmail, action, entityType, entityId, details, req) {
  try {
    const ipAddress = req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || 'unknown';
    const userAgent = req?.headers['user-agent'] || 'unknown';
    const database = getDb();
    await database.collection('activity_logs').insertOne({
      id: generateUUID(),
      user_id: userId,
      user_email: userEmail,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: typeof details === 'object' ? details : { message: details },
      ip_address: String(ipAddress),
      user_agent: String(userAgent),
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[Activity Log Warning]', err.message);
  }
}

// Blockchain helpers
async function getLatestBlockHash() {
  const database = getDb();
  const blocks = await database.collection('blocks').find({}).sort({ block_index: -1 }).limit(1).toArray();
  if (blocks.length > 0) {
    return { hash: blocks[0].block_hash, index: blocks[0].block_index };
  }
  return { hash: '0x0000000000000000000000000000000000000000000000000000000000000000', index: -1 };
}

async function createBlock(certificateId, certificateHash) {
  const database = getDb();
  const { hash: previousBlockHash, index: prevIndex } = await getLatestBlockHash();
  const blockIndex = prevIndex + 1;
  const timestamp = new Date().toISOString();
  const blockHash = sha256Hex(certificateId + certificateHash + previousBlockHash + timestamp);

  const blockDoc = {
    id: generateUUID(),
    block_index: blockIndex,
    certificate_id: certificateId,
    certificate_hash: certificateHash,
    previous_block_hash: previousBlockHash,
    timestamp,
    block_hash: blockHash,
    created_at: new Date().toISOString(),
  };

  await database.collection('blocks').insertOne(blockDoc);
  return { blockHash, blockIndex, previousBlockHash, timestamp };
}

// Router
const router = express.Router();

// SSE (Server-Sent Events) Real-Time Broadcaster
const sseClients = new Set();

function broadcastEvent(type, data = {}) {
  const payload = `data: ${JSON.stringify({ type, data, timestamp: new Date().toISOString() })}\n\n`;
  for (const clientRes of sseClients) {
    try {
      clientRes.write(payload);
    } catch (_) {
      sseClients.delete(clientRes);
    }
  }
}

// GET /events - SSE Real-Time Event Stream
router.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'ChainCert Real-Time Stream Active' })}\n\n`);
  sseClients.add(res);

  const heartbeat = setInterval(() => {
    try {
      res.write(':ping\n\n');
    } catch (_) {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

// Healthcheck endpoint
router.get(['/', '/health'], async (req, res) => {
  const { mode, connected } = await connectToDatabase();
  res.json({
    status: 'ok',
    service: 'ChainCert Core API',
    database: mode,
    connected: Boolean(connected),
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// POST /auth/register
router.post('/auth/register', async (req, res) => {
  try {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(`reg_${clientIp}`, 10, 60000)) {
      return res.status(429).json({ error: 'Too many registration attempts. Please wait 60 seconds.' });
    }

    const { email, password, fullName, role } = req.body;
    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const cleanEmail = sanitizeString(email).toLowerCase();
    const cleanName = sanitizeString(fullName);

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      return res.status(400).json({
        error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
      });
    }

    const database = getDb();
    const existing = await database.collection('users').findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = generateUUID();

    // Student, Teacher, and Employer register as approved; Admin requires existing Admin review
    const isAdminRequest = role === 'admin';
    const initialStatus = isAdminRequest ? 'pending' : 'approved';

    const newUser = {
      id: userId,
      email: cleanEmail,
      full_name: cleanName,
      role,
      status: initialStatus,
      password: passwordHash,
      created_at: new Date().toISOString(),
    };

    await database.collection('users').insertOne(newUser);
    await logActivity(userId, cleanEmail, 'USER_REGISTER', 'users', userId, { role, status: initialStatus }, req);

    if (isAdminRequest) {
      return res.json({
        message: 'Administrator access requested. Your account is pending review by an existing ChainCert administrator.',
        requiresApproval: true,
      });
    }

    res.json({
      message: 'Account created successfully. You can sign in now.',
      requiresApproval: false,
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// POST /institution/register
router.post('/institution/register', async (req, res) => {
  try {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(`reg_inst_${clientIp}`, 10, 60000)) {
      return res.status(429).json({ error: 'Too many registration attempts. Please wait 60 seconds.' });
    }

    const { institutionName, email, description, location, country, password } = req.body || {};

    if (!institutionName || !institutionName.trim()) {
      return res.status(400).json({ error: 'Institution Name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Official Email is required.' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      return res.status(400).json({
        error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
      });
    }

    const cleanEmail = sanitizeString(email).toLowerCase();
    const cleanName = sanitizeString(institutionName);
    const database = getDb();

    const existing = await database.collection('users').findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ error: 'An account with this official email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = generateUUID();

    const newInstitution = {
      id: userId,
      email: cleanEmail,
      full_name: cleanName,
      institution: cleanName,
      role: 'institution',
      status: 'approved',
      description: description ? sanitizeString(description) : '',
      location: location ? sanitizeString(location) : '',
      country: country ? sanitizeString(country) : 'India',
      password: passwordHash,
      created_at: new Date().toISOString(),
    };

    await database.collection('users').insertOne(newInstitution);
    await logActivity(userId, cleanEmail, 'INSTITUTION_REGISTER', 'users', userId, { institutionName: cleanName }, req);

    res.status(201).json({
      success: true,
      message: 'Institution registered successfully! You can sign in now.',
      user: {
        id: userId,
        email: cleanEmail,
        fullName: cleanName,
        role: newInstitution.role,
        status: newInstitution.status,
      },
    });
  } catch (err) {
    console.error('[Institution Register Error]', err);
    res.status(500).json({ error: 'Unable to process institution registration. Please try again.' });
  }
});

// POST /auth/login
router.post('/auth/login', async (req, res) => {
  try {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(`login_${clientIp}`, 10, 60000)) {
      return res.status(429).json({ error: 'Too many login attempts. Please wait 60 seconds.' });
    }

    const { email, identifier, password, role } = req.body || {};
    const inputEmail = (email || identifier || '').trim();
    if (!inputEmail || !password) return res.status(400).json({ error: 'Email and password are required' });

    const cleanEmail = sanitizeString(inputEmail).toLowerCase();
    const database = getDb();

    let profile = await database.collection('users').findOne({ email: cleanEmail });
    if (!profile) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, profile.password || '');
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (profile.status === 'pending') {
      return res.status(403).json({ error: 'Your account is pending admin approval. Please check back later.' });
    }
    if (profile.status === 'rejected') {
      return res.status(403).json({ error: 'Your registration request has been rejected by an administrator.' });
    }

    if (role && profile.role !== role) {
      const portalNames = {
        institution: 'Institution',
        admin: 'Admin',
        teacher: 'Teacher',
        student: 'Student',
        employer: 'Employer',
      };
      const targetPortal = portalNames[profile.role] || profile.role;
      return res.status(403).json({ error: `This account belongs to the ${targetPortal} portal.` });
    }

    const token = jwt.sign(
      { sub: profile.id, email: profile.email, role: profile.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await logActivity(profile.id, cleanEmail, 'USER_LOGIN', 'users', profile.id, { role: profile.role }, req);

    res.json({
      token,
      user: {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        role: profile.role,
        status: profile.status,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// POST /auth/delete-account
router.post('/auth/delete-account', async (req, res) => {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth?.user) return res.status(401).json({ error: 'Unauthorized' });

    const database = getDb();
    await logActivity(auth.user.id, auth.user.email, 'DELETE_ACCOUNT', 'users', auth.user.id, { reason: 'User requested self-deletion' }, req);
    await database.collection('users').deleteOne({ id: auth.user.id });

    res.json({ message: 'Account permanently deleted', success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// POST /certificates/verify
router.post('/certificates/verify', async (req, res) => {
  try {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(`verify_${clientIp}`, 30, 60000)) {
      return res.status(429).json({ error: 'Verification rate limit exceeded. Please wait a minute.' });
    }

    const { certificateId, fileContent } = req.body;
    if (!certificateId) return res.status(400).json({ error: 'certificateId is required' });

    const cleanId = sanitizeString(certificateId);
    const database = getDb();

    const cert = await database.collection('certificates').findOne({ certificate_id: cleanId });
    if (!cert) {
      return res.json({ result: 'not_found', certificateId: cleanId, certificate: null, block: null, chainValid: false });
    }

    const blocks = await database.collection('blocks').find({ certificate_id: cleanId }).sort({ block_index: -1 }).limit(1).toArray();
    const block = blocks[0] || null;

    let chainValid = false;
    if (block) {
      const recomputed = sha256Hex(block.certificate_id + block.certificate_hash + block.previous_block_hash + block.timestamp);
      chainValid = recomputed === block.block_hash;
    }

    let computedHash = null;
    let result = 'valid';
    if (fileContent) {
      computedHash = sha256Hex(fileContent);
      if (computedHash !== cert.certificate_hash) result = 'tampered';
      else result = chainValid ? 'valid' : 'tampered';
    } else {
      result = chainValid ? 'valid' : 'tampered';
    }

    if (cert.status === 'revoked') result = 'revoked';

    try {
      await database.collection('verification_logs').insertOne({
        id: generateUUID(),
        certificate_id: cleanId,
        computed_hash: computedHash || cert.certificate_hash,
        stored_hash: cert.certificate_hash,
        result,
        verified_by: String(clientIp),
        created_at: new Date().toISOString(),
      });
    } catch (_) {}

    res.json({
      result,
      certificateId: cleanId,
      certificate: cert,
      block,
      computedHash,
      storedHash: cert.certificate_hash,
      chainValid,
    });
  } catch (err) {
    res.status(500).json({ error: 'Verification error occurred' });
  }
});

// GET /certificates
router.get('/certificates', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    const database = getDb();
    let query = {};
    if (search) {
      const clean = String(search).replace(/[%_,()'"\\]/g, '').trim();
      if (clean) {
        query = {
          $or: [
            { institution: { $regex: clean, $options: 'i' } },
            { student_name: { $regex: clean, $options: 'i' } },
            { certificate_id: { $regex: clean, $options: 'i' } },
          ],
        };
      }
    }

    const certificates = await database.collection('certificates').find(query).sort({ created_at: -1 }).skip(skip).limit(limit).toArray();
    const count = await database.collection('certificates').countDocuments(query);

    const certIds = certificates.map((c) => c.certificate_id);
    let blocksMap = {};
    if (certIds.length > 0) {
      const blocks = await database.collection('blocks').find({ certificate_id: { $in: certIds } }).sort({ block_index: -1 }).toArray();
      for (const b of blocks) {
        if (!blocksMap[b.certificate_id]) blocksMap[b.certificate_id] = b;
      }
    }

    res.json({
      certificates: certificates.map((c) => ({ ...c, block: blocksMap[c.certificate_id] || null })),
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve certificates' });
  }
});

// GET /certificates/:id
router.get('/certificates/:id', async (req, res) => {
  try {
    const cleanId = sanitizeString(req.params.id);
    const database = getDb();
    const cert = await database.collection('certificates').findOne({ certificate_id: cleanId });
    if (!cert) return res.status(404).json({ error: 'Certificate not found' });
    const block = await database.collection('blocks').findOne({ certificate_id: cleanId });
    res.json({ certificate: cert, block });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch certificate' });
  }
});

// GET /stats
router.get('/stats', async (req, res) => {
  try {
    const database = getDb();
    const [totalIssued, totalBlocks, totalVerifications, pendingUsers, pendingDrafts, verifs] = await Promise.all([
      database.collection('certificates').countDocuments(),
      database.collection('blocks').countDocuments(),
      database.collection('verification_logs').countDocuments(),
      database.collection('users').countDocuments({ status: 'pending' }),
      database.collection('certificate_drafts').countDocuments({ status: 'submitted' }),
      database.collection('verification_logs').find({}).toArray(),
    ]);

    const totalVerified = verifs.filter((v) => v.result === 'valid').length;
    const totalTampered = verifs.filter((v) => v.result === 'tampered' || v.result === 'invalid').length;

    res.json({
      totalIssued,
      totalVerified,
      totalTampered,
      totalBlocks,
      totalVerifications,
      pendingUsers,
      pendingDrafts,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch platform metrics' });
  }
});

// ADMIN ROUTES
router.get('/admin/users', async (req, res) => {
  const auth = await getUserFromRequest(req);
  if (!auth?.profile || auth.profile.role !== 'admin' || auth.profile.status !== 'approved') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  const database = getDb();
  const rawUsers = await database.collection('users').find({}).sort({ created_at: -1 }).toArray();
  const users = rawUsers.map(({ password, _id, ...user }) => user);
  res.json({ users });
});

router.post('/admin/users/:id/approve', async (req, res) => {
  const auth = await getUserFromRequest(req);
  if (!auth?.profile || auth.profile.role !== 'admin' || auth.profile.status !== 'approved') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  const { id } = req.params;
  const database = getDb();
  await database.collection('users').updateOne(
    { id },
    { $set: { status: 'approved', approved_by: auth.user.id, approved_at: new Date().toISOString() } }
  );
  const updated = await database.collection('users').findOne({ id });
  await logActivity(auth.user.id, auth.user.email, 'APPROVE_USER', 'users', id, { targetUserEmail: updated?.email }, req);
  broadcastEvent('user.approved', { userId: id, email: updated?.email, status: 'approved' });
  res.json({ user: updated, message: 'User approved' });
});

router.post('/admin/users/:id/reject', async (req, res) => {
  const auth = await getUserFromRequest(req);
  if (!auth?.profile || auth.profile.role !== 'admin' || auth.profile.status !== 'approved') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  const { id } = req.params;
  const database = getDb();
  await database.collection('users').updateOne(
    { id },
    { $set: { status: 'rejected', approved_by: auth.user.id, approved_at: new Date().toISOString() } }
  );
  const updated = await database.collection('users').findOne({ id });
  await logActivity(auth.user.id, auth.user.email, 'REJECT_USER', 'users', id, { targetUserEmail: updated?.email }, req);
  broadcastEvent('user.rejected', { userId: id, email: updated?.email, status: 'rejected' });
  res.json({ user: updated, message: 'User rejected' });
});

router.get('/admin/certificates/pending', async (req, res) => {
  const auth = await getUserFromRequest(req);
  if (!auth?.profile || auth.profile.role !== 'admin' || auth.profile.status !== 'approved') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  const database = getDb();
  const drafts = await database.collection('certificate_drafts').find({ status: 'submitted' }).sort({ created_at: -1 }).toArray();
  res.json({ drafts });
});

router.post('/admin/certificates/:id/approve', async (req, res) => {
  const auth = await getUserFromRequest(req);
  if (!auth?.profile || auth.profile.role !== 'admin' || auth.profile.status !== 'approved') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  const { id } = req.params;
  const database = getDb();
  const draft = await database.collection('certificate_drafts').findOne({ draft_id: id });
  if (!draft) return res.status(404).json({ error: 'Draft not found' });

  const certificateHash = sha256Hex(draft.file_content || '');
  const certId = generateCertId();
  const block = await createBlock(certId, certificateHash);

  let ownerId = null;
  if (draft.student_email) {
    const studentUser = await database.collection('users').findOne({ email: draft.student_email });
    if (studentUser) ownerId = studentUser.id;
  }

  const certDoc = {
    id: generateUUID(),
    certificate_id: certId,
    student_name: draft.student_name,
    course: draft.course,
    institution: draft.institution,
    issue_date: draft.issue_date,
    certificate_hash: certificateHash,
    file_name: draft.file_name,
    file_type: draft.file_type,
    file_size: draft.file_size,
    status: 'issued',
    owner_id: ownerId,
    draft_id: draft.id,
    created_at: new Date().toISOString(),
  };

  await database.collection('certificates').insertOne(certDoc);

  await database.collection('certificate_drafts').updateOne(
    { draft_id: id },
    {
      $set: {
        status: 'approved',
        certificate_id: certId,
        reviewed_by: auth.user.id,
        reviewed_at: new Date().toISOString(),
      },
    }
  );

  const updatedDraft = await database.collection('certificate_drafts').findOne({ draft_id: id });
  await logActivity(auth.user.id, auth.user.email, 'APPROVE_DRAFT', 'certificate_drafts', id, { certId }, req);

  broadcastEvent('certificate.approved', { draftId: id, certificateId: certId, status: 'approved' });
  broadcastEvent('certificate.status.updated', { certificateId: certId, status: 'issued' });

  res.json({ message: 'Certificate approved and issued', draft: updatedDraft, certificate: certDoc, block });
});

router.post('/admin/certificates/:id/reject', async (req, res) => {
  const auth = await getUserFromRequest(req);
  if (!auth?.profile || auth.profile.role !== 'admin' || auth.profile.status !== 'approved') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  const { id } = req.params;
  const database = getDb();
  await database.collection('certificate_drafts').updateOne(
    { draft_id: id },
    {
      $set: {
        status: 'rejected',
        rejection_reason: sanitizeString(req.body.reason || 'Rejected by administrator'),
        reviewed_by: auth.user.id,
        reviewed_at: new Date().toISOString(),
      },
    }
  );
  const updatedDraft = await database.collection('certificate_drafts').findOne({ draft_id: id });
  await logActivity(auth.user.id, auth.user.email, 'REJECT_DRAFT', 'certificate_drafts', id, { reason: req.body.reason }, req);
  broadcastEvent('certificate.rejected', { draftId: id, status: 'rejected' });
  res.json({ draft: updatedDraft, message: 'Draft rejected' });
});

router.delete('/admin/drafts/:id', async (req, res) => {
  const auth = await getUserFromRequest(req);
  if (!auth?.profile || auth.profile.role !== 'admin' || auth.profile.status !== 'approved') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  const { id } = req.params;
  const database = getDb();
  await database.collection('certificate_drafts').deleteOne({ draft_id: id });
  await logActivity(auth.user.id, auth.user.email, 'DELETE_DRAFT', 'certificate_drafts', id, {}, req);
  res.json({ message: 'Draft deleted successfully' });
});

router.post('/admin/certificates/:id/revoke', async (req, res) => {
  const auth = await getUserFromRequest(req);
  if (!auth?.profile || auth.profile.role !== 'admin' || auth.profile.status !== 'approved') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  const { id } = req.params;
  const database = getDb();
  await database.collection('certificates').updateOne({ certificate_id: id }, { $set: { status: 'revoked' } });
  const updatedCert = await database.collection('certificates').findOne({ certificate_id: id });
  await logActivity(auth.user.id, auth.user.email, 'REVOKE_CERTIFICATE', 'certificates', id, {}, req);
  broadcastEvent('certificate.revoked', { certificateId: id, status: 'revoked' });
  broadcastEvent('certificate.status.updated', { certificateId: id, status: 'revoked' });
  res.json({ certificate: updatedCert, message: 'Certificate revoked' });
});

router.get('/admin/audit-logs', async (req, res) => {
  const auth = await getUserFromRequest(req);
  if (!auth?.profile || auth.profile.role !== 'admin' || auth.profile.status !== 'approved') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  const database = getDb();
  const logs = await database.collection('activity_logs').find({}).sort({ created_at: -1 }).limit(100).toArray();
  res.json({ logs });
});

// TEACHER ROUTES
router.post('/teacher/certificates/draft', async (req, res) => {
  const auth = await getUserFromRequest(req);
  if (!auth?.profile || !['teacher', 'institution'].includes(auth.profile.role) || auth.profile.status !== 'approved') {
    return res.status(403).json({ error: 'Access denied. Approved Teacher or Institution role required.' });
  }
  const { draftId, studentName, course, institution, issueDate, studentEmail, fileContent, fileName, fileType, fileSize, submit } = req.body;

  if (fileName) {
    const fileCheck = validateUploadedFile(fileName, fileSize);
    if (!fileCheck.valid) return res.status(400).json({ error: fileCheck.error });
  }

  const cleanStudentName = sanitizeString(studentName);
  const cleanCourse = sanitizeString(course);
  const cleanInstitution = sanitizeString(institution);
  const cleanEmail = sanitizeString(studentEmail).toLowerCase();
  const status = submit ? 'submitted' : 'draft';
  const database = getDb();

  if (draftId) {
    const existingDraft = await database.collection('certificate_drafts').findOne({ draft_id: draftId, teacher_id: auth.user.id });
    if (!existingDraft) return res.status(404).json({ error: 'Draft not found or access denied.' });

    await database.collection('certificate_drafts').updateOne(
      { draft_id: draftId, teacher_id: auth.user.id },
      {
        $set: {
          student_name: cleanStudentName,
          course: cleanCourse,
          institution: cleanInstitution,
          issue_date: issueDate,
          student_email: cleanEmail,
          file_content: fileContent,
          file_name: fileName,
          file_type: fileType,
          file_size: fileSize,
          status,
          updated_at: new Date().toISOString(),
        },
      }
    );
    const updated = await database.collection('certificate_drafts').findOne({ draft_id: draftId });
    await logActivity(auth.user.id, auth.user.email, submit ? 'SUBMIT_DRAFT' : 'UPDATE_DRAFT', 'certificate_drafts', draftId, { studentName: cleanStudentName }, req);
    if (submit) {
      broadcastEvent('certificate.submitted', { draftId, studentName: cleanStudentName, course: cleanCourse, status: 'submitted' });
    }
    return res.json({ draft: updated, message: submit ? 'Draft submitted' : 'Draft saved' });
  }

  const newDraftId = generateDraftId();
  const draftDoc = {
    id: generateUUID(),
    draft_id: newDraftId,
    teacher_id: auth.user.id,
    student_name: cleanStudentName,
    course: cleanCourse,
    institution: cleanInstitution,
    issue_date: issueDate,
    student_email: cleanEmail,
    file_content: fileContent,
    file_name: fileName,
    file_type: fileType,
    file_size: fileSize,
    status,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await database.collection('certificate_drafts').insertOne(draftDoc);
  await logActivity(auth.user.id, auth.user.email, submit ? 'CREATE_AND_SUBMIT_DRAFT' : 'CREATE_DRAFT', 'certificate_drafts', newDraftId, { studentName: cleanStudentName }, req);
  if (submit) {
    broadcastEvent('certificate.submitted', { draftId: newDraftId, studentName: cleanStudentName, course: cleanCourse, status: 'submitted' });
  }
  res.json({ draft: draftDoc, message: submit ? 'Draft submitted' : 'Draft saved' });
});

router.get('/teacher/certificates', async (req, res) => {
  const auth = await getUserFromRequest(req);
  if (!auth?.profile || !['teacher', 'institution'].includes(auth.profile.role) || auth.profile.status !== 'approved') {
    return res.status(403).json({ error: 'Access denied. Approved Teacher or Institution role required.' });
  }
  const database = getDb();
  const drafts = await database.collection('certificate_drafts').find({ teacher_id: auth.user.id }).sort({ created_at: -1 }).toArray();
  res.json({ drafts });
});

// STUDENT ROUTES
router.get('/student/certificates', async (req, res) => {
  const auth = await getUserFromRequest(req);
  if (!auth?.profile || auth.profile.role !== 'student' || auth.profile.status !== 'approved') {
    return res.status(403).json({ error: 'Access denied. Approved Student role required.' });
  }
  const database = getDb();
  const certificates = await database.collection('certificates').find({
    $or: [{ owner_id: auth.user.id }, { student_name: auth.profile.full_name }],
  }).sort({ created_at: -1 }).toArray();
  res.json({ certificates });
});

// EMPLOYER WORKSPACE ROUTES
router.get('/employer/verifications', async (req, res) => {
  const auth = await getUserFromRequest(req);
  if (!auth?.profile || auth.profile.role !== 'employer' || auth.profile.status !== 'approved') {
    return res.status(403).json({ error: 'Access denied. Approved Employer role required.' });
  }
  const database = getDb();
  const verifications = await database.collection('verification_logs')
    .find({ verified_by: auth.user.email })
    .sort({ created_at: -1 })
    .toArray();
  res.json({ verifications });
});

router.post('/employer/verify-candidate', async (req, res) => {
  const auth = await getUserFromRequest(req);
  if (!auth?.profile || auth.profile.role !== 'employer' || auth.profile.status !== 'approved') {
    return res.status(403).json({ error: 'Access denied. Approved Employer role required.' });
  }
  const { candidateEmail, certificateId } = req.body;
  if (!certificateId) return res.status(400).json({ error: 'Certificate ID is required for verification' });

  const database = getDb();
  const cleanId = sanitizeString(certificateId);
  const cert = await database.collection('certificates').findOne({ certificate_id: cleanId });

  if (!cert) {
    return res.json({ result: 'not_found', certificateId: cleanId, certificate: null, block: null });
  }

  const block = await database.collection('blocks').findOne({ certificate_id: cleanId });
  let chainValid = false;
  if (block) {
    const recomputed = sha256Hex(block.certificate_id + block.certificate_hash + block.previous_block_hash + block.timestamp);
    chainValid = recomputed === block.block_hash;
  }

  let result = cert.status === 'revoked' ? 'revoked' : (chainValid ? 'valid' : 'tampered');

  await database.collection('verification_logs').insertOne({
    id: generateUUID(),
    certificate_id: cleanId,
    computed_hash: cert.certificate_hash,
    stored_hash: cert.certificate_hash,
    result,
    candidate_email: candidateEmail ? sanitizeString(candidateEmail) : null,
    verified_by: auth.user.email,
    created_at: new Date().toISOString(),
  });

  await logActivity(auth.user.id, auth.user.email, 'EMPLOYER_VERIFY_CANDIDATE', 'certificates', cleanId, { candidateEmail, result }, req);

  res.json({
    result,
    certificateId: cleanId,
    certificate: cert,
    block,
    chainValid,
  });
});

// DIRECT ISSUE (Admin Only)
router.post('/certificates/issue', async (req, res) => {
  const auth = await getUserFromRequest(req);
  if (!auth?.profile || auth.profile.role !== 'admin' || auth.profile.status !== 'approved') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  const { studentName, course, institution, issueDate, certificateId, fileContent, fileName, fileType, fileSize } = req.body;

  if (fileName) {
    const fileCheck = validateUploadedFile(fileName, fileSize);
    if (!fileCheck.valid) return res.status(400).json({ error: fileCheck.error });
  }

  const certId = certificateId || generateCertId();
  const certificateHash = sha256Hex(fileContent || '');
  const block = await createBlock(certId, certificateHash);

  const database = getDb();
  const certDoc = {
    id: generateUUID(),
    certificate_id: certId,
    student_name: sanitizeString(studentName),
    course: sanitizeString(course),
    institution: sanitizeString(institution),
    issue_date: issueDate,
    certificate_hash: certificateHash,
    file_name: fileName,
    file_type: fileType,
    file_size: fileSize,
    status: 'issued',
    created_at: new Date().toISOString(),
  };

  await database.collection('certificates').insertOne(certDoc);
  await logActivity(auth.user.id, auth.user.email, 'ISSUE_CERTIFICATE', 'certificates', certId, {}, req);
  res.json({ certificateId: certId, hash: certificateHash, blockHash: block.blockHash, blockIndex: block.blockIndex, previousBlockHash: block.previousBlockHash, txTimestamp: block.timestamp, certificate: certDoc });
});

// BILLING / STORE SHOWCASE DEMO
router.post('/billing/restore-purchases', async (req, res) => {
  const { licenseKey } = req.body || {};
  const restored = Boolean(licenseKey && String(licenseKey).trim().length >= 6);
  res.json({
    message: restored ? 'Subscription restored successfully.' : 'No active subscription found for this license key.',
    restored,
    tier: restored ? 'pro' : undefined,
  });
});

app.use(router);
app.use('/api', router);
app.use('/cert-api', router);

// Connect DB and launch Express server
connectToDatabase().then(({ mode }) => {
  app.listen(PORT, () => {
    console.log(`[ChainCert Server] Server running on port ${PORT}`);
    console.log(`[ChainCert Server] Database Engine: ${mode}`);
    console.log(`[ChainCert Server] Healthcheck available at: http://localhost:${PORT}/health`);
  });
});
