import { OmsBoard } from "@/components/admin/OmsBoard";

export default function AdminOrdersPage() {
  return (
    <section className="space-y-4 pb-20 lg:pb-4">
      <h1 className="text-3xl font-bold">Order Management</h1>
      <p className="text-sm text-on-surface/75">Realtime Kanban view of production statuses.</p>
      <OmsBoard />
    </section>
  );
}
