import type { Metadata } from "next";
import { AdminTemplatesList } from "@/components/admin/AdminTemplatesList";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export const metadata: Metadata = { title: "Templates | Admin" };

export default function TemplatesPage() {
  return (
    <div>
      <AdminPageHeader title="Templates" subtitle="Manage design templates for products" />
      <AdminTemplatesList />
    </div>
  );
}
