import { Suspense } from "react";
import LoginForm from "./form";
import { PrefsGroup } from "@/components/prefs";
import { getDict } from "@/lib/i18n/server";

export default async function LoginPage() {
  const t = await getDict();
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-neutral-950 p-4">
      <div className="absolute right-4 top-4">
        <PrefsGroup />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-700 bg-neutral-900 font-mono text-lg font-bold text-white">
            AZ
          </div>
          <div>
            <h1 className="font-mono text-sm font-bold uppercase tracking-[0.25em] text-white">AZ Architects</h1>
            <p className="text-xs text-neutral-400">{t.login.subtitle}</p>
          </div>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
        <p className="mt-4 text-center text-[11px] text-neutral-500">
          {t.login.footer}
        </p>
      </div>
    </main>
  );
}
