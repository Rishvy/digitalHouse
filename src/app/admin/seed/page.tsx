import { SeedDemoDataPanel } from "@/components/admin/SeedDemoDataPanel";

export default function AdminSeedPage() {
  return (
    <section className="space-y-3 pb-20 lg:pb-4">
      <h1 className="text-3xl font-bold">Seed Demo Data</h1>
      <SeedDemoDataPanel />
    </section>
  );
}
