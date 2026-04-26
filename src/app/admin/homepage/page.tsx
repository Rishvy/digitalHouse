import { AdminHomepage } from "@/components/admin/AdminHomepage";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Homepage | Admin" };

export default function HomepagePage() {
  return (
    <div>
      <AdminPageHeader title="Homepage" subtitle="Manage storefront homepage sections" />
      <AdminHomepage />
    </div>
  );
}
