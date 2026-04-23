"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectTo = searchParams.get("redirectTo") ?? "/";

  const submit = async () => {
    setLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const sb = supabase as any;

    if (mode === "signup") {
      const { error: signUpError } = await sb.auth.signUp({ email, password });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      // Create/update profile row with default customer role.
      const { data: userData } = await sb.auth.getUser();
      if (userData.user) {
        await sb.from("users").upsert({
          id: userData.user.id,
          role: "customer",
          phone: null,
        });
      }
    } else {
      const { error: signInError } = await sb.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    router.replace(redirectTo);
  };

  return (
    <section className="mx-auto mt-16 w-full max-w-md rounded-xl bg-surface-container p-6">
      <h1 className="text-2xl font-bold">{mode === "login" ? "Login" : "Create account"}</h1>
      <p className="mt-1 text-sm text-on-surface/70">
        {mode === "login" ? "Sign in to continue." : "Create an account to continue."}
      </p>
      <div className="mt-4 space-y-3">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          className="w-full rounded bg-surface-container-low px-3 py-2 text-sm"
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          className="w-full rounded bg-surface-container-low px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-error">{error}</p>}
        <button
          type="button"
          disabled={loading || !email || !password}
          onClick={submit}
          className="w-full rounded bg-primary-container px-4 py-2 font-semibold text-on-primary-fixed disabled:opacity-50"
        >
          {loading ? "Please wait..." : mode === "login" ? "Login" : "Sign up"}
        </button>
        <button
          type="button"
          onClick={() => setMode((prev) => (prev === "login" ? "signup" : "login"))}
          className="w-full rounded bg-on-surface px-4 py-2 text-sm font-semibold text-surface"
        >
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Login"}
        </button>
      </div>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <section className="mx-auto mt-16 w-full max-w-md rounded-xl bg-surface-container p-6">
          <p className="text-sm text-on-surface/70">Loading login...</p>
        </section>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
