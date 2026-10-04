import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/lib/auth';
import { analytics } from '@/lib/analytics';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Verify from '@/pages/Verify';
import NotFound from '@/pages/NotFound';
import AccessDenied from '@/pages/AccessDenied';
import { FullPageSpinner } from '@/components/Spinner';

// Lazy-loaded routes for optimal initial bundle size
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const TeacherDashboard = lazy(() => import('@/pages/TeacherDashboard'));
const StudentDashboard = lazy(() => import('@/pages/StudentDashboard'));
const EmployerDashboard = lazy(() => import('@/pages/EmployerDashboard'));
const Ledger = lazy(() => import('@/pages/Ledger'));
const StatusPage = lazy(() => import('@/pages/StatusPage'));
const StoreShowcase = lazy(() => import('@/pages/StoreShowcase'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('@/pages/TermsOfService'));
const Support = lazy(() => import('@/pages/Support'));
const Issue = lazy(() => import('@/pages/Issue'));
const InstitutionRegister = lazy(() => import('@/pages/InstitutionRegister'));

// Global floating & compliance components
import { OfflineBanner } from '@/components/OfflineBanner';
import { OnboardingModal } from '@/components/OnboardingModal';
import { DeleteAccountModal } from '@/components/DeleteAccountModal';
import { SupportModal } from '@/components/SupportModal';
import { DemoUserBar } from '@/components/DemoUserBar';

// Helper component for page view telemetry
function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    analytics.trackPageView(location.pathname);
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AnalyticsTracker />
        <OfflineBanner />
        <OnboardingModal />
        <DeleteAccountModal />
        <SupportModal />
        {import.meta.env.DEV && <DemoUserBar />}

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0f1730',
              color: '#e2e8f0',
              border: '1px solid rgba(212, 175, 55, 0.2)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#0f1730' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#0f1730' },
            },
          }}
        />

        <Layout>
          <Suspense fallback={<FullPageSpinner />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/verify" element={<Verify />} />
              <Route path="/ledger" element={<Ledger />} />
              <Route path="/login" element={<Login />} />
              <Route path="/institution/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/institution/register" element={<InstitutionRegister />} />
              <Route path="/support" element={<Support />} />
              <Route path="/status" element={<StatusPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/store-showcase" element={<StoreShowcase />} />

              {/* Protected routes */}
              <Route
                path="/issue"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <Issue />
                  </ProtectedRoute>
                }
              />

              {/* Role-specific dashboards */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/dashboard"
                element={
                  <ProtectedRoute roles={['teacher', 'institution']}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/institution/dashboard"
                element={
                  <ProtectedRoute roles={['institution', 'teacher']}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/dashboard"
                element={
                  <ProtectedRoute roles={['student']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employer/dashboard"
                element={
                  <ProtectedRoute roles={['employer']}>
                    <EmployerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Access control & status routes */}
              <Route path="/access-denied" element={<AccessDenied />} />

              {/* 404 Fallback route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
