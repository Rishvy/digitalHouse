import { DesignEditor } from "@/components/design-tool/DesignEditor";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DesignPage({
  params,
  searchParams,
}: {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ variationId?: string; qty?: string }>;
}) {
  const { productId } = await params;
  const { variationId = "", qty = "1" } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const sb = supabase as any;

  const { data: product } = await sb.from("products").select("template_id").eq("id", productId).maybeSingle();
  const typedProduct = (product ?? null) as { template_id?: string } | null;
  const { data: template } = await sb
    .from("templates")
    .select("konva_json")
    .eq("id", typedProduct?.template_id ?? "")
    .maybeSingle();

  const fallbackTemplate =
    '{"attrs":{"width":1000,"height":600},"className":"Stage","children":[{"className":"Layer","children":[]}]}';

  return (
    <DesignEditor
      productId={productId}
      variationId={variationId}
      qty={Number(qty) || 1}
      templateJson={(template as { konva_json?: string } | null)?.konva_json ?? fallbackTemplate}
    />
  );
}
