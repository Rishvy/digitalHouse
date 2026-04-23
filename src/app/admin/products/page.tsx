import { AdminProductForm } from "@/components/admin/AdminProductForm";
import { AdminProductsList } from "@/components/admin/AdminProductsList";

export default function AdminProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Products</h1>
        <p className="text-sm text-on-surface/60">
          Manage products and their variations. Assign products to categories.
        </p>
      </div>
      <AdminProductsList />
    </div>
  );
}
