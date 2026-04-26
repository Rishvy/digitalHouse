import { AdminProductsList } from "@/components/admin/AdminProductsList";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Products | Admin" };

export default function ProductsPage() {
  return (
    <div>
      <AdminPageHeader title="Products" subtitle="Manage your print product catalog" />
      <AdminProductsList />
    </div>
  );
}
