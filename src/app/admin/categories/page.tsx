import { AdminCategories } from "@/components/admin/AdminCategories";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Categories | Admin" };

export default function CategoriesPage() {
  return (
    <div>
      <AdminPageHeader title="Categories" subtitle="Organize products into categories" />
      <AdminCategories />
    </div>
  );
}
