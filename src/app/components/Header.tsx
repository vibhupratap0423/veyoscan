'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { AnimatePresence, motion } from 'framer-motion';

type Profile = { id: string; full_name: string | null };

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [menuOpen, setMenuOpen] = useState(false); // mobile hamburger
  const [profileOpen, setProfileOpen] = useState(false); // desktop avatar dropdown
  const menuRef = useRef<HTMLDivElement>(null);

  const links = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/get-qr/pricing', label: 'Pricing' },
    { href: '/contact', label: 'Contact' },
    
  ];

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      if (u) loadProfile(u.id);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) loadProfile(u.id);
      else setProfile(null);
    });

    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    window.addEventListener('click', onClick);

    return () => {
      sub?.subscription?.unsubscribe();
      window.removeEventListener('click', onClick);
    };
  }, []);

  async function loadProfile(id: string) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', id)
      .single();
    setProfile(data || null);
  }

  async function signOut() {
    await supabase.auth.signOut();
    location.href = '/';
  }

  const initials =
    profile?.full_name?.trim()?.[0]?.toUpperCase() ??
    user?.email?.[0]?.toUpperCase() ??
    'U';

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const sheetVariants = {
    hidden: { opacity: 0, y: -12 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  };

  // ✅ central place for owner routes (only what you need now)
  const OWNER = {
    profile: '/owner/profile',
    ownerNumber: '/owner/profile', // ✅ same profile page (owner number section)
    emergencyNumber: '/owner/profile', // ✅ same profile page (emergency number section)
  };

  return (
    <header className="relative z-10 bg-[#0a0f1a]">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Row */}
        <div className="flex items-center justify-between h-16 md:h-20">
         

{/* Brand + Logo */}
<Link href="/" className="flex items-center gap-3 text-white h-full">
  <div className="flex h-[62px] w-[86px] items-center justify-center rounded-2xl border border-cyan-300/25 bg-white px-2 py-1 shadow-[0_0_16px_rgba(34,211,238,0.18)]">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src="/images/final logo  (2).png"
      alt="veyoscan logo"
      className="h-full w-full object-contain scale-[1.20]"
      draggable={false}
    />
  </div>

  <span className="font-semibold tracking-wide text-lg leading-none">
    Veyoscan
  </span>
</Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-white/80 hover:text-white"
              >
                {l.label}
              </a>
            ))}

           <Link
  href="/get-qr"
  prefetch={false}
  className="text-sm text-white/80 hover:text-white"
>
  Get QR
</Link>

            {!user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/sign-in"
                  className="bg-white text-black px-3 py-1 rounded text-sm"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/sign-up"
                  className="bg-orange-500 px-3 py-1 rounded text-sm"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <div ref={menuRef} className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileOpen((o) => !o);
                  }}
                  className="w-9 h-9 rounded-full bg-white/10 border border-white/20 grid place-items-center text-white"
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                >
                  <span className="font-semibold">{initials}</span>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/20 bg-zinc-900 text-sm shadow-lg p-3">
                    <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                      <div className="w-10 h-10 rounded-full bg-white/10 grid place-items-center text-white">
                        <span className="font-semibold">{initials}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate text-white">
                          {profile?.full_name ?? 'Profile'}
                        </div>
                        <div className="text-zinc-400 truncate">{user?.email}</div>
                      </div>
                    </div>

                    <div className="py-2">
                      <Link
                        href={OWNER.ownerNumber}
                        className="block px-2 py-2 rounded hover:bg-white/10 text-white"
                      >
                        Add Owner Number
                      </Link>

                      <Link
                        href={OWNER.emergencyNumber}
                        className="block px-2 py-2 rounded hover:bg-white/10 text-white"
                      >
                        Add Emergency Number
                      </Link>

                      <Link
                        href={OWNER.profile}
                        className="block px-2 py-2 rounded hover:bg-white/10 text-white"
                      >
                        Profile
                      </Link>
                    </div>

                    <button
                      onClick={signOut}
                      className="w-full mt-1 bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-lg"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMenuOpen((s) => !s)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md bg-white/5 ring-1 ring-white/10 text-white"
          >
            <span className="sr-only">Toggle menu</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6">
              <path
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen && (
            <>
              <motion.button
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 z-40 bg-black/40 md:hidden"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={backdropVariants}
                transition={{ duration: 0.15 }}
              />

              <motion.div
                id="mobile-menu"
                className="relative z-50 md:hidden"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={sheetVariants}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="grid gap-2 pb-4 text-white rounded-lg border border-white/10 bg-zinc-900/80 backdrop-blur p-2">
                  {/* ✅ Mobile Profile Card (only when logged in) */}
                  {user && (
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3 mb-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 grid place-items-center">
                          <span className="font-semibold">{initials}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate">
                            {profile?.full_name ?? 'Profile'}
                          </div>
                          <div className="text-white/60 text-sm truncate">
                            {user?.email}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2">
                        <Link
                          href={OWNER.ownerNumber}
                          className="rounded-md px-3 py-2 text-white/90 hover:bg-white/10"
                          onClick={() => setMenuOpen(false)}
                        >
                          Add Owner Number
                        </Link>

                        <Link
                          href={OWNER.emergencyNumber}
                          className="rounded-md px-3 py-2 text-white/90 hover:bg-white/10"
                          onClick={() => setMenuOpen(false)}
                        >
                          Add Emergency Number
                        </Link>

                        <Link
                          href={OWNER.profile}
                          className="rounded-md px-3 py-2 text-white/90 hover:bg-white/10"
                          onClick={() => setMenuOpen(false)}
                        >
                          Profile
                        </Link>

                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            signOut();
                          }}
                          className="mt-1 w-full bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-lg"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Normal page links */}
                  {links.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      className="rounded-md px-3 py-2 text-white/90 hover:bg-white/5"
                      onClick={() => setMenuOpen(false)}
                    >
                      {l.label}
                    </a>
                  ))}

                  <Link
                    href="/get-qr"
                    className="rounded-md px-3 py-2 text-white/90 hover:bg-white/5"
                    onClick={() => setMenuOpen(false)}
                  >
                    Get QR
                  </Link>

                  {/* ✅ Auth buttons only when NOT logged in */}
                  {!user && (
                    <div className="mt-2 grid gap-2">
                      <Link
                        href="/auth/sign-in"
                        className="bg-white text-black px-3 py-2 rounded text-sm"
                        onClick={() => setMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/auth/sign-up"
                        className="bg-orange-500 px-3 py-2 rounded text-sm"
                        onClick={() => setMenuOpen(false)}
                      >
                        Sign Up
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
