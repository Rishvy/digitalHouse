import { TemplateBuilder } from "@/components/admin/TemplateBuilder";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Template Builder | Admin" };

export default async function AdminTemplateBuilderPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  return <TemplateBuilder initialTemplateId={templateId} />;
}
