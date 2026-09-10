import { type ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-mesh flex flex-col">
      <Navbar />
      <main className={`flex-1 ${user ? 'pt-16' : ''}`}>{children}</main>
      <Footer />
    </div>
  );
}
