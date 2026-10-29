"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, ErrorNote, Field, Input } from "@/components/ui";

/**
 * Sign-in page. Public sign-up is disabled — accounts are created in the
 * Supabase dashboard. Anyone who needs access asks an admin.
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12">
      <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto space-y-6">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-2 font-semibold text-[17px] tracking-[-0.01em]">
            <span aria-hidden className="w-2.5 h-2.5 bg-ink" />
            Finances
          </p>
          <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em]">Sign in</h1>
        </div>

        <div className="space-y-4">
          <Field label="Email">
            <Input
              id="login-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="username webauthn"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Password">
            <Input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password webauthn"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
        </div>

        {error && <ErrorNote>{error}</ErrorNote>}

        <Button disabled={loading} className="w-full">
          {loading ? "Signing in…" : "Sign in"}
        </Button>

        <p className="text-[13px] text-ink-3 border-t border-rule pt-4">
          Access is by invitation. Ask an admin to add you.
        </p>
      </form>
    </div>
  );
}
