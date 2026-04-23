"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Role = "admin" | "production_staff" | "customer";

export function ProtectedRoute({
  requiredRole,
  children,
}: {
  requiredRole: Role;
  children: ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      const supabase = createSupabaseBrowserClient();
      const sb = supabase as any;
      const { data: userData } = await sb.auth.getUser();
      const user = userData.user;
      if (!user) {
        router.replace(`/auth/login?redirectTo=${encodeURIComponent(pathname)}`);
        return;
      }

      const { data: profile } = await sb
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile || profile.role !== requiredRole) {
        router.replace("/unauthorized");
        return;
      }
      setLoading(false);
    };

    void check();
  }, [pathname, requiredRole, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="rounded bg-primary-container px-4 py-2 text-on-primary-fixed">Loading dashboard...</div>
      </div>
    );
  }

  return <>{children}</>;
}
