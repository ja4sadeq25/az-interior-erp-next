import { Suspense } from "react";
import LoginForm from "./form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-700 bg-neutral-900 font-mono text-lg font-bold text-white">
            AZ
          </div>
          <div>
            <h1 className="font-mono text-sm font-bold uppercase tracking-[0.25em] text-white">AZ Architects</h1>
            <p className="text-xs text-neutral-400">Enterprise ERP · Secure Staff Sign-in</p>
          </div>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
        <p className="mt-4 text-center text-[11px] text-neutral-500">
          Access is restricted to authorized personnel. All activity is logged.
        </p>
      </div>
    </main>
  );
}
