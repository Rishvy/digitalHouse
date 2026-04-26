import { UsersTable } from "@/components/admin/UsersTable";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Users | Admin" };

export default function UsersPage() {
  return (
    <div>
      <AdminPageHeader title="Users" subtitle="Manage user accounts and roles" />
      <UsersTable />
    </div>
  );
}
