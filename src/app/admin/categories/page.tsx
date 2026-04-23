import { AdminCategories } from "@/components/admin/AdminCategories";

export default function AdminCategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Product Categories</h1>
        <p className="text-sm text-on-surface/60">
          Manage product categories. Products can be assigned to categories.
        </p>
      </div>
      <AdminCategories />
    </div>
  );
}
