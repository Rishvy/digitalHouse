import type { ReactNode } from "react";
import { StorefrontFooter } from "@/components/layout/StorefrontFooter";
import StorefrontNav from "@/components/layout/StorefrontNav";

export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <StorefrontNav />
      <main className="flex-1">{children}</main>
      <StorefrontFooter />
    </>
  );
}
