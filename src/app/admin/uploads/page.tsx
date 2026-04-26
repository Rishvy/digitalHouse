import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminUploads } from "@/components/admin/AdminUploads";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Media | Admin" };

export default function UploadsPage() {
  return (
    <div>
      <AdminPageHeader title="Media Library" subtitle="Upload and manage media assets" />
      <AdminUploads />
    </div>
  );
}
