import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/lib/auth';
import { analytics } from '@/lib/analytics';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Landing from '@/pages/Landing';
import Issue from '@/pages/Issue';
import Verify from '@/pages/Verify';
import Ledger from '@/pages/Ledger';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import AdminDashboard from '@/pages/AdminDashboard';
import TeacherDashboard from '@/pages/TeacherDashboard';
import StudentDashboard from '@/pages/StudentDashboard';
import NotFound from '@/pages/NotFound';
import AccessDenied from '@/pages/AccessDenied';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsOfService from '@/pages/TermsOfService';
import Support from '@/pages/Support';
import StatusPage from '@/pages/StatusPage';
import StoreShowcase from '@/pages/StoreShowcase';

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
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/ledger" element={<Ledger />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
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
                <ProtectedRoute roles={['teacher']}>
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

            {/* Access control & status routes */}
            <Route path="/access-denied" element={<AccessDenied />} />

            {/* 404 Fallback route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
