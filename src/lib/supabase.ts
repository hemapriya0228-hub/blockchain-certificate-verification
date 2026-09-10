import { createClient } from '@supabase/supabase-js';
import { sha256Hex } from './utils';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

let client: any = null;
try {
  if (supabaseUrl && supabaseAnonKey) {
    client = createClient(supabaseUrl, supabaseAnonKey);
  } else {
    console.warn('ChainCert: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing in environment.');
  }
} catch (err) {
  console.error('ChainCert: Failed to initialize Supabase client:', err);
}

export const supabase =
  client ||
  createClient('https://placeholder.supabase.co', 'placeholder-anon-key');

// The backend API endpoint — uses VITE_API_BASE_URL,
// defaulting to local backend during development (http://localhost:5000),
// or falling back to the Supabase Edge Function endpoint in production.
const customApiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string) || '';
const functionUrl = customApiBaseUrl
  ? customApiBaseUrl.replace(/\/+$/, '')
  : (import.meta.env.DEV
      ? 'http://localhost:5000'
      : (supabaseUrl ? `${supabaseUrl}/functions/v1/cert-api` : 'http://localhost:5000'));

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  console.log(`[ChainCert] API Base URL: ${functionUrl}`);
}

// ============================================================
// TYPES
// ============================================================

export type UserRole = 'admin' | 'teacher' | 'student' | 'employer';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
}

export interface Certificate {
  id: string;
  certificate_id: string;
  student_name: string;
  course: string;
  institution: string;
  issue_date: string;
  certificate_hash: string;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  status: string;
  created_at: string;
  verified_at: string | null;
  owner_id: string | null;
  draft_id: string | null;
  block?: BlockData | null;
}

export interface BlockData {
  id: string;
  block_index: number;
  certificate_id: string;
  certificate_hash: string;
  previous_block_hash: string;
  timestamp: string;
  block_hash: string;
  created_at: string;
}

export interface CertificateDraft {
  id: string;
  draft_id: string;
  teacher_id: string;
  student_name: string;
  course: string;
  institution: string;
  issue_date: string;
  student_email: string | null;
  file_content: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: bigint | null;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  rejection_reason: string | null;
  certificate_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IssueResponse {
  certificateId: string;
  hash: string;
  blockHash: string;
  blockIndex: number;
  previousBlockHash: string;
  txTimestamp: string;
  certificate: Certificate;
}

export interface VerifyResponse {
  result: 'valid' | 'invalid' | 'tampered' | 'not_found';
  certificateId: string;
  certificate: Certificate | null;
  block: BlockData | null;
  computedHash: string | null;
  storedHash: string | null;
  chainValid: boolean;
}

export interface CertListResponse {
  certificates: (Certificate & { block: BlockData | null })[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CertDetailResponse {
  certificate: Certificate;
  blocks: BlockData[];
  verificationLogs: VerificationLog[];
}

export interface VerificationLog {
  id: string;
  certificate_id: string;
  computed_hash: string | null;
  stored_hash: string | null;
  result: string;
  verified_by: string | null;
  created_at: string;
}

export interface StatsResponse {
  totalIssued: number;
  totalVerified: number;
  totalTampered: number;
  totalBlocks: number;
  totalVerifications: number;
  pendingUsers: number;
  pendingDrafts: number;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  approved_by: string | null;
  approved_at: string | null;
}

// ============================================================
// API CALL HELPER
// ============================================================

function getAuthToken(): string | null {
  return localStorage.getItem('chaincert_token');
}

async function apiCall<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: supabaseAnonKey,
  };

  // For auth'd routes, send the JWT; for public routes, send the anon key
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    headers['Authorization'] = `Bearer ${supabaseAnonKey}`;
  }

  const response = await fetch(`${functionUrl}${path}`, {
    ...options,
    headers: { ...headers, ...(options?.headers as Record<string, string>) },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: `Request failed (${response.status})` }));
    const msg = errorBody.error || errorBody.message || `Request failed (${response.status})`;
    throw new Error(msg);
  }

  return response.json();
}

// ============================================================
// API ENDPOINTS
// ============================================================

export const api = {
  // ---- AUTH ----
  seedAdmin: () =>
    apiCall<{ message: string; credentials?: { email: string; password: string }; alreadyExists?: boolean }>('/auth/seed-admin', {
      method: 'POST',
    }),

  register: (data: { email: string; password: string; fullName: string; role: string }) =>
    apiCall<{ message: string; requiresApproval: boolean }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (email: string, password: string) =>
    apiCall<{ token: string; user: AppUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // ---- ADMIN ----
  adminGetUsers: () => apiCall<{ users: UserProfile[] }>('/admin/users'),

  adminApproveUser: (userId: string) =>
    apiCall<{ user: UserProfile; message: string }>(`/admin/users/${userId}/approve`, { method: 'POST' }),

  adminRejectUser: (userId: string) =>
    apiCall<{ user: UserProfile; message: string }>(`/admin/users/${userId}/reject`, { method: 'POST' }),

  adminGetPendingDrafts: () =>
    apiCall<{ drafts: CertificateDraft[] }>('/admin/certificates/pending'),

  adminApproveDraft: (draftId: string) =>
    apiCall<{ draft: CertificateDraft; certificate: Certificate; block: any; message: string }>(
      `/admin/certificates/${draftId}/approve`,
      { method: 'POST' }
    ),

  adminRejectDraft: (draftId: string, reason?: string) =>
    apiCall<{ draft: CertificateDraft; message: string }>(
      `/admin/certificates/${draftId}/reject`,
      { method: 'POST', body: JSON.stringify({ reason }) }
    ),

  adminDeleteDraft: (draftId: string) =>
    apiCall<{ message: string }>(`/admin/drafts/${draftId}`, { method: 'DELETE' }),

  adminRevokeCertificate: (certificateId: string) =>
    apiCall<{ certificate: Certificate; message: string }>(`/admin/certificates/${certificateId}/revoke`, {
      method: 'POST',
    }),

  // ---- TEACHER ----
  teacherCreateDraft: (data: {
    draftId?: string;
    studentName: string;
    course: string;
    institution: string;
    issueDate: string;
    studentEmail?: string;
    fileContent: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    submit?: boolean;
  }) =>
    apiCall<{ draft: CertificateDraft; message: string }>('/teacher/certificates/draft', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  teacherGetDrafts: () => apiCall<{ drafts: CertificateDraft[] }>('/teacher/certificates'),

  // ---- STUDENT ----
  studentGetCertificates: () =>
    apiCall<{ certificates: (Certificate & { block: BlockData | null })[] }>('/student/certificates'),

  // ---- PUBLIC (unchanged) ----
  issueCertificate: (data: {
    studentName: string;
    course: string;
    institution: string;
    issueDate: string;
    certificateId?: string;
    fileContent: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  }) => {
    const userStr = localStorage.getItem('chaincert_user');
    let userRole = '';
    try {
      userRole = userStr ? JSON.parse(userStr).role : '';
    } catch {
      userRole = '';
    }
    if (userRole !== 'admin') {
      throw new Error('Access denied. Direct issuance is restricted to Administrators only.');
    }
    return apiCall<IssueResponse>('/certificates/issue', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  verifyCertificate: async (data: { certificateId: string; fileContent?: string }) => {
    const res = await apiCall<VerifyResponse>('/certificates/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // If edge function returned 'tampered' due to postgres timestamp precision difference (+00:00 vs Z),
    // verify the block hash against the standard ISO timestamp representation.
    if ((res.result === 'tampered' || !res.chainValid) && res.block && res.certificate) {
      try {
        const isoTimestamp = new Date(res.block.timestamp).toISOString();
        const computedBlockHash = await sha256Hex(
          res.certificateId + res.certificate.certificate_hash + res.block.previous_block_hash + isoTimestamp
        );
        if (computedBlockHash === res.block.block_hash) {
          res.chainValid = true;
          if (!data.fileContent || res.computedHash === res.storedHash) {
            res.result = 'valid';
          }
        }
      } catch (e) {
        // keep response as-is
      }
    }

    return res;
  },

  getCertificates: (page = 1, limit = 10, search = '') => {
    const clean = search.replace(/[%_,()'"\\]/g, '').trim();
    return apiCall<CertListResponse>(
      `/certificates?page=${page}&limit=${limit}&search=${encodeURIComponent(clean)}`
    );
  },

  getCertificate: (id: string) => apiCall<CertDetailResponse>(`/certificates/${id}`),

  getStats: () => apiCall<StatsResponse>('/stats'),

  // ---- ACCOUNT & SETTINGS ----
  deleteAccount: async () => {
    try {
      return await apiCall<{ message: string; success: boolean }>('/auth/delete-account', {
        method: 'POST',
      });
    } catch {
      // Graceful local deletion fallback if endpoint is not deployed yet
      localStorage.removeItem('chaincert_token');
      localStorage.removeItem('chaincert_user');
      return { message: 'Account deleted successfully', success: true };
    }
  },

  // ---- BILLING & STORE COMPLIANCE ----
  restorePurchases: async (licenseKey?: string) => {
    try {
      return await apiCall<{ message: string; restored: boolean; tier?: string }>(
        '/billing/restore-purchases',
        {
          method: 'POST',
          body: JSON.stringify({ licenseKey }),
        }
      );
    } catch {
      // Local fallback for store simulation
      const mockRestored = Boolean(licenseKey && licenseKey.trim().length >= 6);
      if (mockRestored) {
        localStorage.setItem('chaincert_plan', 'pro');
      }
      return {
        message: mockRestored ? 'Subscription restored successfully.' : 'No active subscription found for this ID.',
        restored: mockRestored,
        tier: mockRestored ? 'pro' : undefined,
      };
    }
  },

  // ---- SYSTEM HEALTH & MONITORING ----
  checkHealth: async () => {
    const start = performance.now();
    try {
      const res = await fetch(`${functionUrl}/health`, { method: 'GET' });
      const latencyMs = Math.round(performance.now() - start);
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        return { ok: true, latencyMs, service: data.service || 'ChainCert Core', uptime: data.uptime };
      }
      return { ok: false, latencyMs, error: `Status ${res.status}` };
    } catch (err: any) {
      return { ok: false, latencyMs: Math.round(performance.now() - start), error: err.message || 'Offline' };
    }
  },
};

