import { OmsBoard } from "@/components/admin/OmsBoard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Orders | Admin" };

export default function OrdersPage() {
  return (
    <div>
      <AdminPageHeader title="Orders" subtitle="Realtime Kanban view of production statuses" />
      <OmsBoard />
    </div>
  );
}
