import { AdminHomepage } from "@/components/admin/AdminHomepage";

export default function AdminHomepagePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Homepage Customization</h1>
        <p className="text-sm text-on-surface/60">
          Customize your homepage with hero banners, category grids, and content blocks.
        </p>
      </div>
      <AdminHomepage />
    </div>
  );
}
