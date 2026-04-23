import { UsersTable } from "@/components/admin/UsersTable";

export default function AdminUsersPage() {
  return (
    <section className="space-y-3">
      <h1 className="text-3xl font-bold">User Management</h1>
      <UsersTable />
    </section>
  );
}
