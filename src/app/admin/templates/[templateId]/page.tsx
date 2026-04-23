import { TemplateBuilder } from "@/components/admin/TemplateBuilder";

export default async function AdminTemplateBuilderPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  return (
    <section className="space-y-3">
      <h1 className="text-3xl font-bold">Template Builder</h1>
      <TemplateBuilder initialTemplateId={templateId} />
    </section>
  );
}
