import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Analytics | Admin" };

export default function AnalyticsPage() {
  return (
    <div>
      <AdminPageHeader title="Analytics" subtitle="Revenue trends and product performance" />
      <AnalyticsDashboard />
    </div>
  );
}
