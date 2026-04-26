import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PrintEditor } from "@/components/design-tool/PrintEditor";

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

  const { data: product } = await sb
    .from("products")
    .select("*, templates(konva_json)")
    .eq("id", productId)
    .maybeSingle();

  return (
    <PrintEditor
      productId={productId}
      variationId={variationId}
      qty={Number(qty) || 1}
      productName={`Product ${productId.slice(0, 8)}`}
    />
  );
}