import { AdminUploads } from "@/components/admin/AdminUploads";

export default function AdminUploadsPage() {
  return (
    <section className="space-y-3 pb-20 lg:pb-4">
      <h1 className="text-3xl font-bold">Admin Uploads</h1>
      <AdminUploads />
    </section>
  );
}
