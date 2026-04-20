'use client';

import React, { useEffect, useMemo, useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;

  // optional: agar aap different number / message chahte ho
  businessPhone?: string; // countrycode + number, no +, no spaces. ex: 917819004337
  title?: string;
  subtitle?: string;
};

export default function QratechWhatsappPopup({
  open,
  onClose,
  businessPhone = '918800625883',
  title = 'Get Your QR',
  subtitle = 'Enter details and we’ll connect on WhatsApp.',
}: Props) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
  });

  const [touched, setTouched] = useState(false);

  // ESC to close + body scroll lock
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    if (!form.name.trim()) e.name = 'Name is required';

    const digits = (form.phone || '').replace(/[^\d]/g, '');
    if (!digits) e.phone = 'Phone is required';
    else if (digits.length < 10) e.phone = 'Enter valid phone number';

    const email = form.email.trim();
    if (!email) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Enter valid email';

    return e;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;

    const digitsPhone = (form.phone || '').replace(/[^\d]/g, '');

    const msg = `Hello Qratech team 👋

I want to get a QR / demo.

Name: ${form.name}
Phone: ${digitsPhone}
Email: ${form.email}

Please share pricing & next steps.`;

    const url = `https://wa.me/${businessPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');

    // optional: close after open
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      {/* Backdrop */}
      <button
        aria-label="Close popup"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="relative mx-auto flex min-h-[100svh] max-w-xl items-center justify-center px-4 py-10">
        <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f1a]/95 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_30px_80px_rgba(0,0,0,0.65)]">
          {/* Glow */}
          <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-10 h-56 w-56 rounded-full bg-blue-500/15 blur-3xl" />

          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
            <div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="mt-1 text-sm text-white/70">{subtitle}</p>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/80 hover:bg-white/10 hover:text-white"
              aria-label="Close"
              title="Close"
            >
              ✕
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-5 py-5">
            <div className="space-y-4">
              <Field
                label="Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your full name"
                error={touched ? errors.name : ''}
              />

              <Field
                label="Phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="10 digit number"
                inputMode="numeric"
                error={touched ? errors.phone : ''}
              />

              <Field
                label="Email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                type="email"
                error={touched ? errors.email : ''}
              />
            </div>

            <button
              type="submit"
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-3 text-sm font-semibold text-black hover:brightness-110 active:brightness-95"
            >
              Continue on WhatsApp
            </button>

            <p className="mt-3 text-center text-xs text-white/55">
              By continuing, you agree to share these details on WhatsApp.
            </p>
          </form>
        </div>
      </div>
    </div>
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
      <label className="mb-1 block text-sm font-medium text-white/85">{label}</label>
      <input
        className={[
          'w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white outline-none',
          'border-white/10 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20',
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
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}