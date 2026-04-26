import { AdminDashboard } from "@/components/admin/AdminDashboard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard | Admin" };

export default function AdminIndexPage() {
  return <AdminDashboard />;
}
