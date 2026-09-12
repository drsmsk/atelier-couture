'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function AppLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session) {
        router.replace('/login');
        return;
      }
      setEmail(data.session.user.email);
      setChecking(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/login');
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  if (checking) {
    return <div className="loading-screen">Chargement…</div>;
  }

  return (
    <div className="page-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">Atelier</div>
        <nav className="sidebar-nav">
          <Link href="/clients" className={pathname.startsWith('/clients') ? 'active' : ''}>
            Clients
          </Link>
          <Link href="/products" className={pathname.startsWith('/products') ? 'active' : ''}>
            Pièces
          </Link>
          <Link href="/versements"
