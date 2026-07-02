'use client';

import React, { useMemo, useState } from 'react';

type Props = {
  businessPhone?: string;
  title?: string;
  subtitle?: string;
};

export default function VeyoscanWhatsappPopup({
  businessPhone = '919643964242',
  title = 'Connect with VeyoScan',
  subtitle = 'Share your details and our team will assist you with the right QR solution on WhatsApp.',
}: Props) {
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
  });

  const [touched, setTouched] = useState(false);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    if (!form.name.trim()) e.name = 'Name is required';

    const digits = form.phone.replace(/[^\d]/g, '');
    if (!digits) e.phone = 'Phone number is required';
    else if (digits.length < 10) e.phone = 'Enter a valid phone number';

    const email = form.email.trim();
    if (!email) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Enter a valid email address';

    return e;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;

  const closePopup = () => {
    setOpen(false);
    document.body.style.overflow = '';
  };

  const openPopup = () => {
    setOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;

    const digitsPhone = form.phone.replace(/[^\d]/g, '');

    const msg = `Hello VeyoScan Team 👋

I am interested in VeyoScan QR solutions and would like to know more.

Customer Details:
Name: ${form.name}
Phone: ${digitsPhone}
Email: ${form.email}

Please share:
• Product details
• Pricing / plans
• Demo / next steps

Looking forward to connecting with your team.`;

    const url = `https://wa.me/${businessPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');

    closePopup();
  };

  return (
    <>
      {/* Floating WhatsApp Button */}
      <button
        type="button"
        onClick={openPopup}
        aria-label="Open WhatsApp support form"
        title="Connect with VeyoScan on WhatsApp"
        className="fixed bottom-5 left-5 z-[70] rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-black shadow-lg transition hover:brightness-110 active:scale-95"
      >
        WhatsApp
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            aria-label="Close WhatsApp support popup"
            onClick={closePopup}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <div className="relative mx-auto flex min-h-[100svh] max-w-xl items-center justify-center px-4 py-10">
            <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-[#0a0f1a]/95 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_30px_80px_rgba(0,0,0,0.65)]">
              <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 right-10 h-56 w-56 rounded-full bg-blue-500/15 blur-3xl" />

              <div className="relative border-b border-white/10 px-6 py-5">
                <div className="pr-12">
                  <div className="mb-2 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                    VeyoScan Support
                  </div>

                  <h3 className="text-xl font-semibold tracking-tight text-white">
                    {title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-white/70">
                    {subtitle}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closePopup}
                  className="absolute right-4 top-4 rounded-xl border border-white/10 bg-white/5 p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close WhatsApp support popup"
                  title="Close"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-6">
                <div className="mb-5 rounded-2xl border border-cyan-400/15 bg-white/[0.03] p-4">
                  <p className="text-sm leading-6 text-white/75">
                    Tell us a little about yourself and we will help you with the
                    best <span className="font-semibold text-cyan-300">VeyoScan QR solution</span> for your
                    business, vehicle, shop, office, or personal use.
                  </p>
                </div>

                <div className="space-y-4">
                  <Field label="Full Name" name="name" value={form.name} onChange={handleChange} placeholder="Enter your full name" error={touched ? errors.name : ''} />
                  <Field label="Phone Number" name="phone" value={form.phone} onChange={handleChange} placeholder="Enter your mobile number" inputMode="numeric" error={touched ? errors.phone : ''} />
                  <Field label="Email Address" name="email" value={form.email} onChange={handleChange} placeholder="Enter your email address" type="email" error={touched ? errors.email : ''} />
                </div>

                <button
                  type="submit"
                  className="mt-6 w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-3.5 text-sm font-semibold text-black transition hover:brightness-110 active:brightness-95"
                >
                  Continue to WhatsApp
                </button>

                <p className="mt-3 text-center text-xs leading-5 text-white/55">
                  By continuing, you agree to share these details with the VeyoScan team on WhatsApp for product assistance and follow-up.
                </p>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

type FieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  error?: string;
};

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  error,
}: FieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-white/85">{label}</label>
      <input
        className={[
          'w-full rounded-2xl border bg-white/5 px-4 py-3 text-sm text-white outline-none transition',
          'border-white/10 placeholder:text-white/35 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20',
          error ? 'border-red-500/40 focus:border-red-500/50 focus:ring-red-500/15' : '',
        ].join(' ')}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        inputMode={inputMode}
        autoComplete="off"
      />
      {error ? <p className="mt-1.5 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}