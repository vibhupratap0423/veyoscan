'use client';

import React, { useEffect, useState } from 'react';

import Features from "./components/Features";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import WhyChoose from "./components/WhyChoose";

import QratechUseCases from './components/QratechUseCases';
import VeyoscanWhatsappPopup from './components/QratechWhatsappPopup';

export default function Page() {
  const [open, setOpen] = useState(false);

  // ✅ Har refresh/page load par popup open
  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 600); // delay optional
    return () => clearTimeout(t);
  }, []);

  const closePopup = () => {
    setOpen(false); // only closes for that session
  };

  return (
    <main className="min-h-screen bg-[#0a0f1a] text-white relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(0,255,255,0.12),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.12),transparent_30%)] pointer-events-none" />

      <VeyoscanWhatsappPopup open={open} onClose={closePopup} />

      <Hero />
      <QratechUseCases/>
      <Features />
      <HowItWorks />
      <WhyChoose />
    </main>
  );
}
