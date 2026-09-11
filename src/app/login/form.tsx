"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/components/providers";
import { ShieldCheck, Lock } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const t = useT();
  const next = params.get("next") ?? "/";
  const inactive = params.get("inactive") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(inactive ? t.login.deactivated : null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setErr(t.login.invalid);
      return;
    }
    router.replace(next.startsWith("/") ? next : "/");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <div>
        <label className="label" htmlFor="email">{t.login.email}</label>
        <input
          id="email"
          className="input"
          type="email"
          autoComplete="username"
          required
          placeholder={t.login.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="label" htmlFor="password">{t.login.password}</label>
        <input
          id="password"
          className="input"
          type="password"
          autoComplete="current-password"
          required
          placeholder={t.login.passwordPlaceholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {err && <p className="alert-error">{err}</p>}
      <button className="btn w-full" disabled={busy}>
        <Lock className="h-4 w-4" />
        {busy ? t.login.signingIn : t.login.signIn}
      </button>
      <p className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400 dark:text-neutral-500">
        <ShieldCheck className="h-3.5 w-3.5" />
        {t.login.badge}
      </p>
    </form>
  );
}
