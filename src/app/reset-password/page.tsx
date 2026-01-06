// src/app/reset-password/page.tsx
import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
          <div className="text-sm text-slate-300">Loading...</div>
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}
