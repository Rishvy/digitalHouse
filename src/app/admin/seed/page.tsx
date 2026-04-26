import { SeedDemoDataPanel } from "@/components/admin/SeedDemoDataPanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Seed Data | Admin" };

export default function SeedPage() {
  return (
    <div>
      <AdminPageHeader title="Seed Data" subtitle="Populate the database with demo content" />
      <SeedDemoDataPanel />
    </div>
  );
}
